/* 바다 화면의 작은 해도·바람 판 — 단추줄에 가리지 않는다 · 끌어서 옮기기 (2026-10-30 사용자 요청) — node tests/hud_pin_smoke.js   (BROWSER_EXE=크롬 경로)
   js/ui/hudpin.js · js/scenes/sea.js · css/style.css
   ① 여러 창 크기에서 해도·바람 판의 아래 끝이 단추줄 위에 있고 화면 안에 다 보인다
   ② 끌면 옮겨지고(해도를 열지 않는다) 이 기기에 기억한다 · 다시 바다에 나와도 그 자리 · 창 크기가 바뀌어도 화면 안
   ③ 그냥 누르면 해도가 열린다 · 오른쪽 클릭이면 제자리 · 콘솔 오류 0
   SHOT_DIR 를 주면 화면을 남긴다 */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..');
const SHOTS = process.env.SHOT_DIR || '';
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => setTimeout(() => raf(cb), 120); });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_FILE/.test(m.text())) errors.push('console: ' + m.text()); });
  async function shot(name) { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name) }); } }
  const rects = () => page.evaluate(() => {
    const r = s => { const e = document.querySelector('#ui ' + s); if (!e) return null; const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom }; };
    const st = document.getElementById('stage') || document.getElementById('ui'), sb = st.getBoundingClientRect();
    return { mini: r('.minimap'), wind: r('.windbox'), bar: r('.sailbar'), vw: innerWidth, vh: innerHeight, stage: { l: sb.left, t: sb.top, r: sb.right, b: sb.bottom } };
  });
  function clear(R) { const inV = x => x.l >= -1 && x.t >= -1 && x.r <= R.vw + 1 && x.b <= R.vh + 1; return R.mini.b <= R.bar.t + 1 && R.wind.b <= R.bar.t + 1 && inV(R.mini) && inV(R.wind); }
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.HudPin, null, { timeout: 120000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      try { localStorage.removeItem('pu.hudPos.minimap'); localStorage.removeItem('pu.hudPos.windbox'); } catch (e) { /* */ }
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 70, int: 60, mar: 70, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.settings.sound = 0; s.settings.music = 0;
      G.Game.go('sea', { depart: 0 });
    });
    await page.waitForSelector('#ui .minimap', { state: 'attached', timeout: 30000 });
    await page.waitForTimeout(1200);
    const sizes = [[1600, 900], [1432, 807], [1280, 720], [1920, 1080], [1366, 768]], out = [];
    for (const [w, h] of sizes) {
      await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(500);
      const R = await rects(); out.push([w + '×' + h, clear(R), Math.round(R.mini.b), Math.round(R.wind.b), Math.round(R.bar.t)]);
      if (w === 1432) await shot('after_1432x807.png');
    }
    console.log(JSON.stringify(out));
    ok(out.every(x => x[1]), '여러 창 크기에서 해도·바람 판이 단추줄 위에 다 보인다 — ' + out.map(x => x[0] + (x[1] ? '' : ' ✗')).join(', '));
    // ② 끌기
    await page.setViewportSize({ width: 1600, height: 900 }); await page.waitForTimeout(400);
    let R = await rects();
    const mx = (R.mini.l + R.mini.r) / 2, my = (R.mini.t + R.mini.b) / 2;
    await page.mouse.move(mx, my); await page.mouse.down(); await page.mouse.move(mx + 120, my - 220, { steps: 8 }); await page.mouse.up();
    await page.waitForTimeout(300);
    const chartOpen = await page.evaluate(() => [...document.querySelectorAll('.win')].some(w => /해도/.test(w.textContent.slice(0, 40))));
    const R2 = await rects(), saved = await page.evaluate(() => G.HudPin.saved('minimap'));
    ok(Math.abs(R2.mini.l - R.mini.l - 120) < 3 && Math.abs(R2.mini.t - R.mini.t + 220) < 3 && saved && !chartOpen, '끌면 옮겨지고 기억한다 · 해도는 열리지 않는다 (' + JSON.stringify(saved) + ')');
    await shot('after_dragged.png');
    // 바람 판도 화면 밖으로는 못 간다
    const wx = (R.wind.l + R.wind.r) / 2, wy = (R.wind.t + R.wind.b) / 2;
    await page.mouse.move(wx, wy); await page.mouse.down(); await page.mouse.move(wx + 900, wy + 900, { steps: 6 }); await page.mouse.up();
    const R3 = await rects();
    ok(R3.wind.r <= R3.vw + 1 && R3.wind.b <= R3.vh + 1, '화면 밖으로 끌어도 화면 안에 붙잡는다');
    // 다시 바다에 나와도 그 자리 · 창 크기가 바뀌어도 화면 안
    await page.evaluate(() => { G.Game.go('sea', { depart: 0 }); });
    await page.waitForTimeout(1200);
    const R4 = await rects();
    ok(Math.abs(R4.mini.l - R2.mini.l) < 3 && Math.abs(R4.mini.t - R2.mini.t) < 3, '다시 바다에 나와도 옮긴 자리 그대로');
    await page.setViewportSize({ width: 1280, height: 720 }); await page.waitForTimeout(500);
    const R5 = await rects();
    ok(R5.wind.r <= R5.vw + 1 && R5.wind.b <= R5.vh + 1 && R5.mini.t >= -1, '창을 줄여도 옮긴 판이 화면 안');
    await page.setViewportSize({ width: 1600, height: 900 }); await page.waitForTimeout(400);
    // ③ 오른쪽 클릭 → 제자리 · 그냥 누르면 해도
    const R6 = await rects();
    await page.mouse.click((R6.mini.l + R6.mini.r) / 2, (R6.mini.t + R6.mini.b) / 2, { button: 'right' });
    await page.waitForTimeout(200);
    const R7 = await rects(), gone = await page.evaluate(() => G.HudPin.saved('minimap'));
    ok(!gone && Math.abs(R7.mini.l - R.mini.l) < 3 && Math.abs(R7.mini.b - R.mini.b) < 3, '오른쪽 클릭이면 제자리로');
    const chartFn = await page.evaluate(() => { let n = 0; const f = G.Scenes.sea.chart; G.Scenes.sea.chart = () => { n++; }; window.__chartN = () => n; return true; });
    await page.mouse.click((R7.mini.l + R7.mini.r) / 2, (R7.mini.t + R7.mini.b) / 2);
    await page.waitForTimeout(200);
    ok(await page.evaluate(() => window.__chartN()) === 1, '그냥 누르면 큰 해도가 열린다');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' / ') : ''));
    console.log('hud_pin_smoke OK');
  } catch (e) {
    console.error('✗ ' + (e && e.stack || e)); process.exitCode = 1;
  } finally { await browser.close(); }
})();
