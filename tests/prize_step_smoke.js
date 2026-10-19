/* 나포한 배의 짐(전리품) 수량 조절 — node tests/prize_step_smoke.js   (BROWSER_EXE=크롬 경로)
   · 줄마다 ◀ ▶ 단추: 하나씩, Shift는 10씩, 누르고 있으면 계속 · 키보드 ←→(Shift 10) · ↑↓ 줄 고르기 · Home 0 · End 최대
   · 짐칸을 넘치게는 늘리지 않는다 · 막대를 끄는 동안 표를 새로 그리지 않는다 · 옮겨 싣기가 실제로 반영된다 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'prize_step');
require('fs').mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  // 해전 화면이 swiftshader에서 무거워 클릭이 밀린다 — 그리기를 느리게 (시험만)
  await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => window.__noRaf ? 0 : setTimeout(() => raf(cb), 250); });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.state.settings.res = 0.35;
      G.Game.go('battle', { npc: { kind: 'merchant', n: 1 } });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'battle', null, { timeout: 30000 });
    await page.evaluate(() => {
      const s = G.Game.state; s.fleet.cargo = {}; s.fleet.food = 0; s.fleet.water = 0; s.fleet.mat = 0;
      window.__done = false;
      G.Scenes.battle._t().prizeHolds([{ type: 'carrack', crew: 20 }, { type: 'caravel', crew: 10 }]).then(() => { window.__done = true; });
    });
    await page.waitForFunction(() => document.querySelector('.ph-tbl tr[data-row]'), null, { timeout: 10000 }); await page.waitForTimeout(500);
    await page.evaluate(() => { window.__noRaf = true; });   // 짐 창이 뜬 뒤에는 해전 그리기를 멈춘다 (시험만)
    const take = i => page.evaluate(i => +document.querySelector('tr[data-row="' + i + '"] .ph-take').textContent.replace(/,/g, ''), i);
    // 아무것도 싣지 않은 상태에서 시작
    await page.click('button[data-q="none"]');
    ok(await take(0) === 0, '「아무것도 싣지 않는다」 → 0');
    const rowEl = await page.$('tr[data-row="0"] input[type=range]');
    await page.click('tr[data-row="0"] button.ph-step[data-d="1"]');
    ok(await take(0) === 1, '▶ 한 번 → 1');
    await page.keyboard.down('Shift'); await page.click('tr[data-row="0"] button.ph-step[data-d="1"]'); await page.keyboard.up('Shift');
    ok(await take(0) === 11, 'Shift+▶ → 10 더 (11)');
    await page.click('tr[data-row="0"] button.ph-step[data-d="-1"]');
    ok(await take(0) === 10, '◀ 한 번 → 10');
    ok(await page.evaluate(el => el.isConnected, rowEl), '값이 바뀌어도 표를 새로 그리지 않는다 (막대가 그대로)');
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
    ok(await take(0) === 12, '키보드 → 두 번 → 12');
    await page.keyboard.press('Shift+ArrowLeft');
    ok(await take(0) === 2, 'Shift+← → 10 덜 (2)');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    ok(await take(1) === 1 && await take(0) === 2, '↓로 다음 줄을 고르고 → 는 그 줄에 (둘째 줄 1)');
    // 누르고 있으면 계속 오른다
    const btn = await page.$('tr[data-row="1"] button.ph-step[data-d="1"]'); const bb = await btn.boundingBox();
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.mouse.down(); await page.waitForTimeout(2000); await page.mouse.up();
    const held = await take(1); await page.waitForTimeout(300);
    ok(held > 5 && await take(1) === held, '▶를 누르고 있으면 계속 오르고, 손을 떼면 멈춘다 (' + held + ')');
    // End: 남은 자리만큼 · 넘치지 않음
    await page.keyboard.press('End');
    const info = await page.evaluate(() => ({ t: document.querySelector('.ph-info').textContent, dis: document.querySelector('.win .foot .btn.navy').disabled, inc: document.querySelector('tr[data-row="1"] button.ph-step[data-d="1"]').disabled }));
    ok(!/넘침|넘음/.test(info.t) && !info.dis, 'End → 자리만큼 최대, 짐칸을 넘지 않음 (' + info.t.trim() + ')');
    for (let i = 0; i < 30; i++) await page.keyboard.press('ArrowRight');
    ok(!/넘침|넘음/.test(await page.evaluate(() => document.querySelector('.ph-info').textContent)), '→를 더 눌러도 넘치게 늘지 않는다');
    await page.keyboard.press('Home');
    ok(await take(1) === 0, 'Home → 0');
    await page.screenshot({ path: path.join(OUT, 'prize_step.png') });
    // 옮겨 싣기
    await page.keyboard.press('ArrowUp'); 
    const want0 = await take(0);
    const kind0 = await page.evaluate(() => document.querySelector('tr[data-row="0"] td').textContent.trim());
    await page.click('.win .foot .btn.navy');
    await page.waitForFunction(() => window.__done, null, { timeout: 10000 });
    const got = await page.evaluate(() => { const f = G.Game.state.fleet; return { food: f.food, water: f.water, mat: f.mat, cargo: Object.keys(f.cargo).length }; });
    console.log(kind0, want0, got);
    ok(want0 > 0 && (got.food === want0 || got.water === want0 || got.mat === want0), '고른 수량이 실제로 실린다 (' + kind0 + ' ' + want0 + ')');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ': ' + errors.join(' | ') : ''));
    console.log('통과 — 그림: ' + OUT);
  } catch (e) { console.error('실패:', e.message, errors); await page.screenshot({ path: path.join(OUT, 'fail.png') }).catch(() => {}); process.exitCode = 1; } finally { await browser.close(); }
})();
