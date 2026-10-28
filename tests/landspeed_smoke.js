/* 육상 탐험 배속 시험 (tests/landspeed_smoke.js) — node tests/landspeed_smoke.js
   · 아래 단추 줄에 ×0.5 · ×1 · ×2 · ×4 (바다와 같은 모양), 누르면 바뀐다
   · 설정의 속도 키(기본 ` 1 2 3)로도 바뀐다 · 숫자판 1·3은 그대로 대각선 걷기
   · ×4면 같은 시간에 걸음·날짜가 네 배 · 고른 배속이 다음 상륙에도 이어진다. 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::|fonts|ERR_/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
  const R = await page.evaluate(async () => {
    const out = []; const ok = (c, m) => out.push((c ? '✓ ' : '✗ ') + m);
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    await G.Game.ensureGeo(); G.Nav.init(); G.UI.fade = async fn => { fn && fn(); };
    G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
    const s = G.Game.state; s.fleet.food = 500; s.fleet.water = 500;
    G.Game.go('land', { from: s.player.home }); await sleep(400);
    const L = G.Scenes.land, st = L.runtime();
    const opts = [...document.querySelectorAll('.land-speed .opt')];
    ok(opts.length === 4 && opts.map(o => o.textContent).join(' ') === '×0.5 ×1 ×2 ×4', '단추 줄에 배속: ' + opts.map(o => o.textContent).join(' '));
    ok(st.speed === 1 && opts[1].classList.contains('on'), '처음은 ×1');
    opts[3].click(); await sleep(50);
    ok(st.speed === 4 && opts[3].classList.contains('on') && s.settings.landSpeed === 4, '×4를 누르면 ×4 (설정에도 남음)');
    const key = (k, code) => { const e = new KeyboardEvent('keydown', { key: k, code: code, bubbles: true }); window.dispatchEvent(e); document.dispatchEvent(e); };
    key('2', 'Digit2'); await sleep(30); ok(st.speed === 2, '2 키 → ×2');
    key('`', 'Backquote'); await sleep(30); ok(st.speed === 0.5, '` 키 → ×0.5');
    key('3', 'Digit3'); await sleep(30); ok(st.speed === 4, '3 키 → ×4');
    key('1', 'Numpad1'); await sleep(30); ok(st.speed === 4 && st.dir && st.dir[0] < 0 && st.dir[1] < 0, '숫자판 1은 그대로 남서쪽 걷기');
    st.dir = null; st.paused = true;
    // 같은 시간에 걷는 거리
    const walk = async (sp) => {
      for (let k = 0; k < 40 && (st.busy || G.UI.busy()); k++) { const mb = [...document.querySelectorAll('.modal-back')].pop(); if (mb) (mb.querySelector('.askrow .btn, .choice') || mb.querySelector('.dlg') || mb).click(); await sleep(50); }
      st.busy = 0;
      L.setSpeed(sp); const l = s.loc, x0 = l.lon, y0 = l.lat, d0 = l.days, a0 = st.dayAcc;
      st.dir = [1, 0]; st.paused = false; st.path = null;
      for (let i = 0; i < 3; i++) L.update(0.05);
      const dist = Math.hypot(G.Geo.wrapLon(l.lon - x0), l.lat - y0), days = (l.days - d0) + (st.dayAcc - a0);
      l.lon = x0; l.lat = y0; st.paused = true; st.dir = null;
      return { dist, days, busy: st.busy, ui: G.UI.busy(), dlg: ((document.querySelector('.modal-back') || {}).textContent || '').slice(0, 60) };
    };
    // 뭍 한가운데로 (이베리아 내륙)
    s.loc.lon = -4.0; s.loc.lat = 40.0;
    const w1 = await walk(1); const w4 = await walk(4);
    ok(w1.dist > 0 && Math.abs(w4.dist / w1.dist - 4) < 0.3, '같은 시간에 ×4는 네 배 걷는다 (' + w1.dist.toFixed(4) + '° → ' + w4.dist.toFixed(4) + '°)');
    ok(Math.abs(w4.days / w1.days - 4) < 0.3, '날짜도 네 배 흐른다 (' + w1.days.toFixed(3) + ' → ' + w4.days.toFixed(3) + '일)');
    // 다음 상륙에도
    L.setSpeed(2);
    G.Game.go('sea', { depart: s.player.home }); await sleep(200);
    G.Game.go('land', { from: s.player.home }); await sleep(400);
    ok(L.runtime().speed === 2 && document.querySelector('.land-speed .opt.on').textContent === '×2', '다시 상륙해도 고른 배속(×2) 그대로');
    // 단추 줄이 화면 밖으로 넘치지 않는다
    const bar = document.querySelector('.land-speed').closest('.sailbar').getBoundingClientRect();
    const stage = document.querySelector('#stage').getBoundingClientRect();
    ok(bar.left >= stage.left - 1 && bar.right <= stage.right + 1, '단추 줄 너비 ' + Math.round(bar.width) + 'px — 화면 안 (' + Math.round(stage.width) + ')');
    return out;
  });
  await page.screenshot({ path: process.env.SHOT || '/tmp/landspeed.png' });
  console.log(R.join('\n')); console.log(errs.slice(0, 5).join('\n') || '✓ 콘솔 오류 없음'); await b.close();
  process.exitCode = R.some(x => x[0] === '✗') || errs.length ? 1 : 0;
})();
