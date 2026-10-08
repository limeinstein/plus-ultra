/* 불러오는 그림·미리 준비 점검 (js/ui/loader.js · js/main.js Game.prepare/launch/prewarmCity · js/world/renderer.js prewarm)
   - 처음 열 때 검은 화면 대신 도는 지구 그림이 뜨고, 타이틀이 준비되면 걷힌다
   - 이어하기(G.Game.resume) 동안 그림이 떠 있고, 그사이 바다 셰이더·앞바다 육지 판·배 그림을 준비해 첫 바다 장면에서 판을 새로 그리지 않는다
   - 도시에 머무는 동안 앞바다 판을 한 줄씩 미리 그려 출항이 멈칫하지 않는다 · 장면 바꾸는 검은 막이 길면 그림을 작게 띄운다
   node tests/loader_smoke.js   (스크린샷: OUT 또는 임시 폴더/loader_shots) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'loader_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href, { waitUntil: 'domcontentloaded' });
    const boot = await page.evaluate(() => { const e = document.getElementById('boot-loader'), i = e && e.querySelector('img'); return e ? { on: e.classList.contains('on'), z: +getComputedStyle(e).zIndex, src: i.getAttribute('src') } : null; });
    await page.waitForFunction(() => { const i = document.querySelector('#boot-loader img'); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 20000 });
    await page.screenshot({ path: path.join(OUT, 'boot.png') });
    ok(boot && boot.on && boot.z >= 10000 && /loading-world\.anim\.webp$/.test(boot.src), '처음 열 때 스크립트보다 먼저 불러오는 그림(도는 지구)이 화면 맨 위에 뜬다');
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Game.geoReady, null, { timeout: 120000 });
    await page.waitForFunction(() => !G.Loader.shown(), null, { timeout: 20000 });
    await page.waitForFunction(() => getComputedStyle(document.getElementById('boot-loader')).display === 'none' && G.Game.renderer && G.Game.renderer._warmed, null, { timeout: 20000 }).catch(() => {});
    const title = await page.evaluate(() => ({ disp: getComputedStyle(document.getElementById('boot-loader')).display, warmed: !!(G.Game.renderer && G.Game.renderer._warmed) }));
    ok(title.disp === 'none' && title.warmed, '타이틀이 준비되면 그림이 걷히고, 바다 셰이더는 그 뒤에 미리 컴파일된다');

    // ② 이어하기: 바다 위 저장 — 그림이 뜬 채 준비하고, 첫 바다 장면은 판을 새로 그리지 않는다
    const res = await page.evaluate(async () => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
      G.Game.state.loc = { mode: 'sea', lon: -14, lat: 36, heading: 1 };
      const texts = [], t0 = performance.now(); let shownDuring = false;
      const tx = G.Loader.text; G.Loader.text = function (t) { if (t) texts.push(t); return tx.apply(this, arguments); };
      const p = G.Game.resume();
      await new Promise(r => setTimeout(r, 50)); shownDuring = G.Loader.shown();
      await p; G.Loader.text = tx;
      const r = G.Game.renderer, full0 = r.stats.full;
      await new Promise(r2 => setTimeout(r2, 1500));
      return { texts, shownDuring, ms: Math.round(performance.now() - t0), scene: G.Game.sceneName, after: G.Loader.shown(), full0, full1: r.stats.full, ready: !!(r.caches[0] && r.caches[0].ready), autoRes: G.Game.autoRes || 1 };
    });
    console.log(JSON.stringify(res));
    ok(res.shownDuring && !res.after && res.scene === 'sea', '이어하기 동안 그림이 떠 있고 바다가 준비되면 걷힌다 (' + res.ms + 'ms: ' + res.texts.join(' → ') + ')');
    ok(res.ready && res.full1 === res.full0, '미리 그려 둔 앞바다 판을 그대로 써서 첫 바다 장면에서 판을 새로 그리지 않았다 (새로 그림 ' + res.full0 + '→' + res.full1 + ')');
    ok(res.autoRes === 1, '첫 장면들 때문에 바다 해상도가 내려가지 않았다 (자동 해상도 ' + res.autoRes + ')');
    await page.screenshot({ path: path.join(OUT, 'sea.png') });

    // ③ 도시에 머무는 동안 앞바다 판을 한 줄씩 → 출항 첫 장면에서 새로 그리지 않음
    const city = await page.evaluate(async () => {
      const s = G.Game.state, c = G.CITY_DATA.filter(x => x.port && Math.abs(x.lon - (-14)) > 25)[0];
      s.loc = { mode: 'city', city: c.id, lon: c.lon, lat: c.lat };
      G.Game.go('city', { cityId: c.id });
      const r = G.Game.renderer, t0 = performance.now();
      while (performance.now() - t0 < 40000) { await new Promise(x => setTimeout(x, 300)); const v = G.Game.warmView(s, 'sea'); if (r.caches[0] && r.caches[0].ready && r._covers(r.caches[0], v.lon, v.lat, v.zoom * r.canvas.width / 1600, r.canvas.width, r.canvas.height, r.caches[0].key, 1)) break; }
      document.querySelectorAll('.modal-back').forEach(e => e.remove());
      const full0 = r.stats.full;
      G.Game.go('sea', { depart: c.id });
      await new Promise(x => setTimeout(x, 1500));
      return { city: c.name, warmMs: Math.round(performance.now() - t0), full0, full1: r.stats.full };
    });
    console.log(JSON.stringify(city));
    ok(city.full1 === city.full0, city.city + '에 머무는 동안 앞바다 판을 미리 그려 출항 첫 장면에서 새로 그리지 않았다');

    // ④ 장면 바꾸는 검은 막이 길면 작게 띄우고, 끝나면 걷는다
    const fade = await page.evaluate(async () => {
      let seen = false, dim = false;
      await G.UI.fade(() => new Promise(r => setTimeout(() => { seen = G.Loader.shown(); dim = document.getElementById('boot-loader').classList.contains('dim'); r(); }, 900)));
      await new Promise(r => setTimeout(r, 1200));
      return { seen, dim, after: G.Loader.shown() };
    });
    ok(fade.seen && fade.dim && !fade.after, '오래 걸리는 장면 바꿈(검은 막)에는 그림을 작게 띄우고 끝나면 걷는다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
