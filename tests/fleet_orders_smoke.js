/* 해전 함대 명령 점검 (js/scenes/battle.js — 기함을 뺀 배들)
   · 명령판이 뜨고 숫자 1~7로 전체 명령: 학익진이면 배들이 적을 반원으로 감싸고(포위 알림·포격 +), 일제 공격·포격전·호위·물러나기
   · 명령판 줄을 눌러 한 척을 고르고, 적함을 클릭하면 그 배만 그 적을 노린다(노림), Esc로 고르기를 푼다
   · 콘솔 오류 0. 스크린샷: OUT/fleet_orders.png
   node tests/fleet_orders_smoke.js  (playwright) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const GAME = pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href;
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'fleet_orders_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::/.test(m.text() + ' ' + ((m.location() || {}).url || ''))) errors.push('console: ' + m.text()); });
  await page.addInitScript(() => { window.requestAnimationFrame = function () { return 0; }; });
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Scenes && G.Scenes.battle, null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });
    await page.evaluate(() => {
      var s = G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 20, birth: { m: 3, d: 3 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: G.LANGS.map(function (_, i) { return i === 1 ? 3 : 0; }), diff: 'normal' });
      s.settings.res = 0.2;
      ['carrack', 'caravel', 'galleon', 'caravel'].forEach(function (t, i) { var sh = G.R.newShip(G.SHIP[t] ? t : 'caravel', ['백조', '매', '바다사자', '갈매기'][i]); sh.guns = { type: 'culverin', n: 12 }; s.fleet.ships.push(sh); });
      s.fleet.crew = 400; s.loc = { mode: 'sea', lon: -20, lat: 30, heading: 0 };
      G.Game.go('battle', { npc: { kind: 'navy', n: 3, nation: '잉글랜드' } });
      // 시험이 끝나기 전에 승부가 나지 않게: 우리 배는 튼튼하게, 적은 포를 줄이고 튼튼하게
      G.Scenes.battle.debug().ships.forEach(function (b) { if (b.side === 'me') b.hp = b.maxHp = b.maxHp * 6; else { b.guns.n = Math.max(1, Math.round(b.guns.n / 3)); b.hp = b.maxHp = b.maxHp * 12; b.crew = b.crew0 = b.crew * 3; } });
    });
    await page.waitForTimeout(800);
    const step = (sec) => page.evaluate((sec) => { var B = G.Scenes.battle; B.headless = true; for (var i = 0; i < sec * 20; i++) B.update(0.05); B.headless = false; B.update(0.01); }, sec);
    const orders = () => page.evaluate(() => G.Scenes.battle.debug().ships.filter(function (b) { return b.side === 'me' && !b.flag; }).map(function (b) { return b.order; }));
    ok(await page.$('.ordpanel .ord-btn') && (await page.$$('.ordpanel .ord-btn')).length === 7, '함대 명령판과 명령 일곱 가지');
    ok((await orders()).every(o => o === 'follow'), '처음에는 모두 기함 추종');
    await step(2);
    await page.keyboard.press('2'); await step(14);
    const crane = await page.evaluate(() => { var st = G.Scenes.battle.debug(); return { o: st.ships.filter(function (b) { return b.side === 'me' && !b.flag; }).map(function (b) { return b.order; }), env: st.ships.some(function (b) { return b.side === 'en' && b.envK > 1; }), log: st.log.join(' / ') }; });
    ok(crane.o.every(o => o === 'crane'), '2: 학익진');
    ok(crane.env, '학익진으로 적을 에워싸 포격이 세진다 (' + (crane.log.match(/에워쌌다[^/]*/) || [''])[0] + ')');
    await page.screenshot({ path: path.join(OUT, 'fleet_orders.png') });
    for (const [k, id] of [['3', 'focus'], ['4', 'gun'], ['5', 'guard'], ['6', 'free'], ['1', 'follow']]) { await page.keyboard.press(k); await step(1.5); ok((await orders()).every(o => o === id), k + ': ' + id); }
    // 한 척 고르기 → 적함 클릭 = 노림
    await page.click('.ord-row[data-no="3"]');
    ok(await page.evaluate(() => G.Scenes.battle.debug().sel && G.Scenes.battle.debug().sel.no === 3), '명령판 줄을 눌러 3번 배를 골랐다');
    const pt = await page.evaluate(() => { var st = G.Scenes.battle.debug(), e = st.ships.filter(function (b) { return b.side === 'en' && b.alive; })[0], r = G.Game.canvases().overlay.getBoundingClientRect(); return { x: r.left + (800 + (e.x - st.cx)) / 1600 * r.width, y: r.top + (450 + (e.y - st.cy)) / 900 * r.height, no: e.no }; });
    await page.mouse.click(pt.x, pt.y);
    const att = await page.evaluate(() => { var b = G.Scenes.battle.debug().ships.filter(function (x) { return x.side === 'me' && x.no === 3; })[0]; return b.order + ':' + (b.otarget ? b.otarget.no : '-'); });
    ok(att === 'attack:' + pt.no, '고른 배만 그 적을 노린다 (' + att + ')');
    await page.keyboard.press('7'); await step(1);
    const o7 = await orders();
    ok(o7[1] === 'retreat' && o7.filter(o => o === 'retreat').length === 1, '7: 고른 배만 물러나기');
    await page.keyboard.press('Escape');
    ok(await page.evaluate(() => !G.Scenes.battle.debug().sel), 'Esc: 고르기를 푼다');
    ok(!errors.length, '콘솔 오류 없음' + (errors.length ? ' — ' + errors.join(' / ') : ''));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('실패:', e.message, errors); process.exitCode = 1; }
  await browser.close();
})();
