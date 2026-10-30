/* 해전에서 적에게 넘어간 아군 배 — 이기면 되찾는다 (js/scenes/battle.js seize · finish) — node tests/battle_seized_ship_smoke.js (BROWSER_EXE=크롬 경로)
   · 포격으로 선원이 0이 되면 가라앉지 않고 「빼앗김」(seized) — 함대 표에도 빼앗김
   · 그 싸움에 이기면 되찾는다(함대에 남고, 백병전에서 붙잡힌 선원도 돌아온다) · 지거나 물러나면 적이 끌고 간다(함대에서 빠진다)
   · 가라앉은 배는 이겨도 돌아오지 않는다 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  // 해전 화면이 swiftshader에서 무거워 — 그리기를 느리게, 장면은 시험이 직접 넘긴다
  await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => setTimeout(() => raf(cb), 400); });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load resource|ERR_FILE_NOT_FOUND/.test(m.text())) errors.push(m.text()); });
  async function battle() {
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const s = G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      s.settings.res = 0.35; G.State.save = () => {};
      ['둘째', '셋째'].forEach(nm => { const sh = G.R.newShip('caravel', nm); sh.uid = 'u_' + nm; s.fleet.ships.push(sh); });
      s.fleet.crew = 120;
      window.__alerts = []; window.__toasts = [];
      G.UI.alert = async (t) => { window.__alerts.push(String(t)); };
      G.UI.say = async () => {}; const tt = G.UI.toast; G.UI.toast = (t) => { window.__toasts.push(String(t)); };
      G.UI.fade = () => {};
      G.Game.go('battle', { npc: { kind: 'pirate', n: 2 } });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'battle' && G.Scenes.battle.runtime() && G.Scenes.battle.runtime().ships.length >= 5, null, { timeout: 60000 });
    await page.waitForTimeout(500);
  }
  // 포탄 한 발로 그 배의 선원을 모두 쓰러뜨린다 (실제 명중 처리를 그대로 탄다)
  const shoot = (name) => page.evaluate((name) => {
    const st = G.Scenes.battle.runtime(), b = st.ships.find(x => x.side === 'me' && x.name === name);
    b.crew = 3; const rnd = Math.random; Math.random = () => 0.1;
    st.balls.push({ x: b.x + 40, y: b.y, tx: b.x, ty: b.y, t: 0, dur: 0.01, hit: true, target: b, dmg: 2, kill: 40 });
    try { G.Scenes.battle.update(1 / 30); } finally { Math.random = rnd; }
    return { alive: b.alive, seized: !!b.seized, sunk: !!b.sunk, crew: b.crew, hp: b.hp };
  }, name);
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });

    // 1) 포격으로 선원 0 → 빼앗김 → 이기면 되찾는다
    await battle();
    const hit = await shoot('둘째');
    ok(!hit.alive && hit.seized && !hit.sunk && hit.crew === 0 && hit.hp > 0, '포격으로 선원이 0이 되면 가라앉지 않고 적에게 넘어간다 (빼앗김)');
    await page.evaluate(() => { const st = G.Scenes.battle.runtime(); st.pf = 14; G.Scenes.battle.update(1 / 30); });
    await page.waitForTimeout(200);
    const panel = await page.evaluate(() => (document.querySelector('.fp-ship') ? [...document.querySelectorAll('.fp-ship')].map(e => e.innerText.replace(/\s+/g, ' ')).join(' | ') : ''));
    ok(/둘째.*빼앗김/.test(panel), '아군 함대 표에 「빼앗김 — 이기면 되찾는다」 (' + panel.slice(0, 120) + ')');
    // 셋째는 백병전에서 졌다 — 남은 선원 7명은 포로로
    await page.evaluate(() => { const st = G.Scenes.battle.runtime(), b = st.ships.find(x => x.side === 'me' && x.name === '셋째'); b.crew = 7; b.alive = false; G.Scenes.battle._t().seize(b, 7, true); });
    const win = await page.evaluate(async () => {
      const st = G.Scenes.battle.runtime(), f = G.Game.state.fleet;
      st.ships.forEach(x => { if (x.side === 'en') { x.alive = false; x.sunk = true; } });
      const crewIn = st.ships.filter(x => x.side === 'me' && x.alive).reduce((a, x) => a + x.crew, 0);
      st.over = true; await G.Scenes.battle._t().finish('win');
      return { names: f.ships.map(s => s.name), crew: f.crew, crewIn, alert: window.__alerts.join(' / ') };
    });
    ok(win.names.indexOf('둘째') >= 0 && win.names.indexOf('셋째') >= 0, '이기면 빼앗겼던 두 배를 되찾는다 (' + win.names.join(',') + ')');
    ok(win.crew === win.crewIn + 7, '백병전에서 붙잡혔던 선원 7명도 돌아온다 (선원 ' + win.crew + ')');
    ok(/되찾았다/.test(win.alert) && /선원 7명도 돌아왔다/.test(win.alert), '승리 알림에 「되찾았다」 · 돌아온 선원');

    // 2) 빼앗긴 채 물러나면 적이 끌고 간다
    await battle();
    await shoot('둘째');
    const lose = await page.evaluate(async () => {
      const st = G.Scenes.battle.runtime(), f = G.Game.state.fleet;
      st.over = true; await G.Scenes.battle._t().finish('retreat');
      return { names: f.ships.map(s => s.name), toast: window.__toasts.join(' / '), log: (G.Game.state.log || []).slice(-6).map(l => l.t || l).join(' / ') };
    });
    ok(lose.names.indexOf('둘째') < 0 && lose.names.length === 2, '물러나면 빼앗긴 배는 적이 끌고 간다 (' + lose.names.join(',') + ')');
    ok(/끌려갔다/.test(lose.toast) && /빼앗겼다/.test(lose.log), '끌려간 배를 알리고 일지에 남긴다');

    // 3) 가라앉은 배는 이겨도 돌아오지 않는다
    await battle();
    const sunk = await page.evaluate(async () => {
      const st = G.Scenes.battle.runtime(), f = G.Game.state.fleet, b = st.ships.find(x => x.side === 'me' && x.name === '둘째');
      b.alive = false; b.sunk = true;
      st.ships.forEach(x => { if (x.side === 'en') { x.alive = false; x.sunk = true; } });
      st.over = true; await G.Scenes.battle._t().finish('win');
      return f.ships.map(s => s.name);
    });
    ok(sunk.indexOf('둘째') < 0, '가라앉은 배는 이겨도 돌아오지 않는다');

    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
