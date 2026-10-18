/* 에도만(도쿄만)에서 나올 수 있다 (2026-10-19) — js/world/geo.js CHANNELS
   지형 자료에서 도쿄만이 거의 다 뭍으로 메워져 에도 앞바다가 갇힌 못이었다 → 입항하면 「육지에 막혀」 나오지 못했다.
   · 모든 항구의 부두가 큰 바다와 이어진 물에 있다 (갇힌 항구 0)
   · 에도: 성은 뭍에, 부두는 물에, 부두에서 사가미 바다·태평양까지 뱃길이 있다
   · 에도에서 출항해 남쪽으로 나간다 (바다 장면) · 콘솔 오류 0
   node tests/edo_bay_smoke.js */
'use strict';
const path = require('path');
const os = require('os');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const OUT = process.env.OUT || os.tmpdir();
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(__dirname, '..', process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady && G.Nav && G.Nav.ready(), null, { timeout: 120000 });
    const r = await page.evaluate(() => {
      const N = G.Nav, cnt = {}, rows = [];
      G.CITY_DATA.forEach(c => {
        if (!c || !c.port) return;
        const d = c.dock || [c.lat, c.lon], s = N.nearestSea(d[1], d[0], 6);
        const k = s ? N.component(s[0], s[1]) : 'none'; cnt[k] = (cnt[k] || 0) + 1; rows.push([c.name, k]);
      });
      const main = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
      const edo = G.CITY_DATA[297], dk = edo.dock;
      const p = N.seaPath ? N.seaPath(dk[1], dk[0], 139.6, 34.8) : N.path(dk[1], dk[0], 139.6, 34.8);
      return { odd: rows.filter(x => String(x[1]) !== main).map(x => x[0]), ports: rows.length,
        cityLand: G.Geo.isLand(edo.lon, edo.lat), dockSea: !G.Geo.isLand(dk[1], dk[0]), path: p ? p.length : 0 };
    });
    console.log('   ' + JSON.stringify(r));
    ok(!r.odd.length, '항구 ' + r.ports + '곳 모두 큰 바다와 이어진 물에 부두가 있다 ' + r.odd.join(', '));
    ok(r.cityLand && r.dockSea, '에도: 성은 뭍, 부두는 물');
    ok(r.path > 1, '에도 부두에서 사가미 바다까지 뱃길이 있다 (' + r.path + '점)');
    // 에도에서 출항
    await page.evaluate(() => {
      const s = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 4, d: 12 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk: {}, lg: [], diff: 'normal' });
      s.flags.prologue = true; s.settings.res = 0.5; s.date = { y: 1610, m: 5, d: 1 };
      s.loc = { mode: 'city', city: 297 }; G.Game.state = s; G.Game.go('sea', { depart: 297, fresh: true });
    });
    await page.waitForFunction(() => G.Game.scene === G.Scenes.sea && G.Scenes.sea.runtime(), null, { timeout: 60000 });
    await page.waitForTimeout(2500);
    const y0 = await page.evaluate(() => G.Game.state.loc.lat);
    // 남쪽 먼바다로 길을 잡는다
    await page.evaluate(() => { const sea = G.Scenes.sea; if (sea.goTo) sea.goTo(139.7, 34.7); else if (sea.setTarget) sea.setTarget(139.7, 34.7); });
    await page.waitForTimeout(1500);
    const st = await page.evaluate(() => { const rt = G.Scenes.sea.runtime(); return { path: rt.path ? rt.path.length : 0, lat: G.Game.state.loc.lat }; });
    await page.screenshot({ path: path.join(OUT, 'edo_bay.png') });
    console.log('   출항 ' + y0.toFixed(3) + ' · ' + JSON.stringify(st));
    ok(st.path > 0 || st.lat < y0, '에도에서 출항해 만 밖으로 길을 잡는다 (그림: ' + path.join(OUT, 'edo_bay.png') + ')');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
