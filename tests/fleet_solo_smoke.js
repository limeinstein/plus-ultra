/* 해전 기함 전술 점검 — 기함 혼자일 때도 명령판이 뜬다 (js/scenes/battle.js soloOrder)
   · 명령판이 「기함 전술」로 바뀌고 학익진·호위는 흐리게(배 2척 이상일 때)
   · 4 포격 중심: 적과 거리를 두고 포로만 · 3 돌격: 적 기함에 붙음 · 6 자동 교전 · 방향키로 몰면 직접 조종으로 · 2 학익진은 알림만
   · 함대가 있다가 모두 잃으면 같은 판이 기함 전술로 바뀐다 · 콘솔 오류 0
   node tests/fleet_solo_smoke.js  (스크린샷: OUT/fleet_solo.png) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const GAME = pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href;
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'fleet_solo_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::/.test(m.text() + ' ' + ((m.location() || {}).url || ''))) errors.push('console: ' + m.text()); });
  await page.addInitScript(() => { window.requestAnimationFrame = function () { return 0; }; });
  const step = (sec) => page.evaluate((sec) => { var B = G.Scenes.battle; B.headless = true; for (var i = 0; i < sec * 20; i++) B.update(0.05); B.headless = false; B.update(0.01); }, sec);
  const start = (extra) => page.evaluate((extra) => {
    var s = G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 20, birth: { m: 3, d: 3 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: G.LANGS.map(function (_, i) { return i === 1 ? 3 : 0; }), diff: 'normal' });
    s.settings.res = 0.2;
    s.fleet.ships[0].guns = { type: 'culverin', n: 16 };
    for (var i = 0; i < extra; i++) { var sh = G.R.newShip('caravel', '매' + i); sh.guns = { type: 'culverin', n: 10 }; s.fleet.ships.push(sh); }
    s.fleet.crew = 120 + extra * 60; s.loc = { mode: 'sea', lon: -20, lat: 30, heading: 0 };
    G.Game.go('battle', { npc: { kind: 'navy', n: 2, nation: '잉글랜드' } });
    G.Scenes.battle.debug().ships.forEach(function (b) { if (b.side === 'me') b.hp = b.maxHp = b.maxHp * 8; else { b.guns.n = Math.max(1, Math.round(b.guns.n / 3)); b.hp = b.maxHp = b.maxHp * 12; } });
  }, extra);
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Scenes && G.Scenes.battle, null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });
    // ① 기함 혼자
    await start(0); await page.waitForTimeout(600);
    const ui = await page.evaluate(() => { var p = document.querySelector('.ordpanel'); return p && { solo: p.classList.contains('solo'), n: p.querySelectorAll('.ord-btn').length, off: [...p.querySelectorAll('.ord-btn.off')].map(b => b.textContent.trim()), on: [...p.querySelectorAll('.ord-btn.on')].map(b => b.textContent.trim()), head: p.querySelector('.fp-h').textContent }; });
    console.log('   ' + JSON.stringify(ui));
    ok(ui && ui.solo && ui.n === 7, '기함 혼자여도 명령판이 뜬다 — ' + ui.head);
    ok(ui.off.length === 2 && /학익진/.test(ui.off.join()) && /호위/.test(ui.off.join()) && /직접 조종/.test(ui.on.join()), '학익진·기함 호위는 흐리게, 처음은 직접 조종');
    const fsx = () => page.evaluate(() => { var st = G.Scenes.battle.debug(), f = st.myFlag, en = st.ships.filter(b => b.side === 'en' && b.alive); return { tac: f.tactic || null, near: Math.min.apply(null, en.map(e => Math.hypot(e.x - f.x, e.y - f.y))), tgt: f.target ? f.target.no : null, shots: st.ships.filter(b => b.side === 'en').reduce((a, b) => a + (b.maxHp - b.hp), 0), on: [...document.querySelectorAll('.ordpanel .ord-btn.on')].map(b => b.textContent.trim()).join() }; });
    await page.keyboard.press('4');
    const ds = []; for (let i = 0; i < 10; i++) { await step(2); ds.push(Math.round((await fsx()).near)); }
    const g = await fsx(); g.avg = ds.reduce((a, b) => a + b, 0) / ds.length; console.log('   거리 ' + ds.join(','));
    console.log('   포격 중심 ' + JSON.stringify(g));
    ok(g.tac === 'gun' && /포격 중심/.test(g.on), '4: 기함 포격 중심');
    ok(g.avg > 140 && g.shots > 0, '포격 중심: 적과 거리를 두고(가장 가까운 적과 평균 ' + Math.round(g.avg) + ') 포로 쏜다 (적 피해 ' + Math.round(g.shots) + ')');
    await page.keyboard.press('3'); await step(14);
    const f3 = await fsx();
    ok(f3.tac === 'focus' && f3.tgt === 1 && f3.near < g.avg, '3: 돌격 — 적 기함(1번)을 노리고 붙는다 (거리 ' + Math.round(f3.near) + ')');
    await page.keyboard.press('2'); await step(0.5);
    ok((await fsx()).tac === 'focus' && await page.evaluate(() => [...document.querySelectorAll('.toast')].some(t => /학익진은 함께 싸울 배/.test(t.textContent))), '2: 학익진은 「함께 싸울 배가 있어야」 알림만');
    await page.keyboard.press('6'); await step(1);
    ok((await fsx()).tac === 'free', '6: 자동 교전');
    await page.screenshot({ path: path.join(OUT, 'fleet_solo.png') });
    await page.keyboard.down('ArrowUp'); await step(0.3); await page.keyboard.up('ArrowUp');
    const man = await fsx();
    ok(man.tac === null && /직접 조종/.test(man.on), '방향키로 몰면 직접 조종으로 돌아간다');
    // ② 함대가 있다가 모두 잃으면 기함 전술로
    await start(2); await page.waitForTimeout(600);
    ok(await page.evaluate(() => !document.querySelector('.ordpanel').classList.contains('solo')), '함대가 있으면 예전 함대 명령판');
    await page.evaluate(() => { G.Scenes.battle.debug().ships.forEach(b => { if (b.side === 'me' && !b.flag) { b.alive = false; b.sunk = true; } }); });
    await page.evaluate(() => { for (var i = 0; i < 12; i++) G.Scenes.battle.update(0.01); });   // 명령판은 그릴 때 6장마다 고친다
    ok(await page.evaluate(() => document.querySelector('.ordpanel').classList.contains('solo')), '다른 배를 모두 잃으면 같은 판이 기함 전술로 바뀐다');
    ok(!errors.length, '콘솔 오류 없음 ' + errors.join(' | '));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
