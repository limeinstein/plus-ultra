/* 임진왜란 종료·일본 쇄국·시대 교역·해전 명령과 나포의 회귀 검사. */
'use strict';
const assert = require('assert'), path = require('path'), fs = require('fs'), { pathToFileURL } = require('url');
let chromium; try { ({ chromium } = require('playwright')); } catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const { world, report } = require('../tools/trade_balance.cjs');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/gameplay-balance-20261101');
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const trade = report(); fs.writeFileSync(path.join(OUT, 'trade-comparison.json'), JSON.stringify(trade, null, 2));
  const winners = [1600, 1650, 1699].map(y => trade.after[y][0].route);
  assert.equal(new Set(winners).size, 3, '세 시대의 최고 수익 항로가 바뀐다');
  const route = (mode, y, name) => trade[mode][y].find(r => r.route === name);
  assert(route('after', 1650, '리스본–말라카').net > route('before', 1650, '리스본–말라카').net * 2);
  assert(route('after', 1650, '광주–나가사키').closed);
  const g = world(false), s = g.Game.state, nagasaki = g.CITY_DATA[191];
  s.date = { y: 1639, m: 7, d: 31 }; assert(!g.Sakoku.entryBlock(nagasaki));
  s.date.d = 1; s.date.m = 8; assert(g.Sakoku.entryBlock(nagasaki));
  s.date.y = 1641; s.date.m = 5; s.player.nation = 'NL'; assert(!g.Sakoku.entryBlock(nagasaki)); assert(g.Sakoku.entryBlock(g.CITY_DATA[192]));
  s.date.y = 1668; s.date.m = 1; assert.equal(g.R.supply(nagasaki, 'silver'), 0); assert(!g.R.cityGoods(nagasaki).includes('silver'));
  delete s.sakoku; assert.equal(g.Sakoku.daily().length, 1); assert.equal(g.Sakoku.daily().length, 0);
  s.date.y = 1650; delete s.sakoku; assert.equal(g.Sakoku.daily().length, 0);
  console.log('통과: 시대별 항로 순위·대양 교역 수익·쇄국과 은 수출 경계·옛 저장 소식');
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const errors = [], result = { winners };
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => { requestAnimationFrame = () => 0; });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => G.Game && G.Imjin && G.Sakoku, null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    result.history = await page.evaluate(async () => {
      const s = G.Game.state = G.State.newGame({ name: '검사', nation: 'PT', job: 'explorer', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      s.settings.res = .25; s.date = { y: 1598, m: 12, d: 31 }; s.loc = { mode: 'city', city: 226 };
      s.imjin = { told: {}, north: 1, hansan: 'won', hansanSaid: 1 };
      const before = { pending: G.Imjin.pending(), shut: G.Imjin.portShut(G.CITY_DATA[226]) };
      s.date = { y: 1599, m: 1, d: 1 };
      const out = { before, pending: G.Imjin.pending(), check: await G.Imjin.check(), shut: G.Imjin.portShut(G.CITY_DATA[226]), land: G.Imjin.landDue(129.1, 35.3), news: G.Imjin.daily().length, repeat: G.Imjin.daily().length };
      s.date.y = 1650; out.late = G.Imjin.pending(); out.entry = G.Scenes.city.entryCheck(G.CITY_DATA[191]);
      const says = [], say = G.Scenes.city.say; G.Scenes.city.say = async (who, text) => says.push(text);
      try { out.batch = await G.Scenes.city.B.trade.batch(G.CITY_DATA[191], 'buy', ['silver']); } finally { G.Scenes.city.say = say; }
      out.refused = says.some(t => /교역 금지/.test(t)); return out;
    });
    const h = result.history;
    assert(h.before.pending && h.before.shut); assert(!h.pending && !h.check && !h.shut && h.land === null && !h.late); assert(h.news === 1 && h.repeat === 0); assert(h.entry.reason === 'sakoku' && !h.batch && h.refused);
    console.log('통과: 1599년부터 전투·육상 사건·봉쇄 해제, 1650년 일본 입항·교역 차단');
    await page.evaluate(() => {
      const s = G.Game.state; s.loc = { mode: 'sea', lon: -30, lat: 25, heading: 0 }; s.fleet.ships = ['galleon', 'galleon', 'caravel'].map(id => G.R.newShip(id)); s.fleet.crew = 300;
      G.Game.go('battle', { npc: { kind: 'navy', nation: '잉글랜드', n: 3, ships: ['galleon', 'caravel', 'caravel'] } });
      const st = G.Scenes.battle.runtime(); st.ships.forEach(b => { b.guns.n = 0; b.hp = b.maxHp = 10000; });
      st.ships.filter(b => b.side === 'en').forEach(b => { b.halt = true; b.crew = b.crew0 = 100; });
    });
    result.separation = await page.evaluate(() => { const st = G.Scenes.battle.runtime(); return Math.hypot(st.enFlag.x - st.myFlag.x, st.enFlag.y - st.myFlag.y); });
    assert(result.separation < 650 && result.separation > 400);
    await page.evaluate(() => { const st = G.Scenes.battle.runtime(), b = st.ships.find(b => b.side === 'me' && !b.flag); b.board = st.enFlag; b.boardIntent = true; b.route = { pts: [[-3000, -3000]], i: 0 }; b.detour = { a: 3, until: 999 }; b.crane = { old: true }; });
    await page.keyboard.press('2');
    result.crane = await page.evaluate(() => {
      const B = G.Scenes.battle, st = B.runtime(), boats = st.ships.filter(b => b.side === 'me' && !b.flag);
      const cleared = boats.every(b => !b.board && !b.boardIntent && !b.detour && !b.route && b.crane && b.target === st.enFlag);
      B.headless = true; for (let i = 0; i < 800; i++) B.update(.05); B.headless = false;
      return { cleared, ships: boats.map(b => ({ order: b.order, side: Math.sign(b.y - st.enFlag.y), error: Math.hypot(b.x - b.moveTo[0], b.y - b.moveTo[1]) })) };
    });
    assert(result.crane.cleared); assert(result.crane.ships.every(b => b.order === 'crane' && b.error < 100), JSON.stringify(result.crane)); assert(result.crane.ships[0].side !== result.crane.ships[1].side);
    await page.keyboard.press('4');
    result.gun = await page.evaluate(() => {
      const B = G.Scenes.battle, st = B.runtime(); B.headless = true; for (let i = 0; i < 600; i++) B.update(.05); B.headless = false; B.update(0);
      return st.ships.filter(b => b.side === 'me' && !b.flag).map(b => ({ order: b.order, board: !!b.boardIntent, crane: !!b.crane, distance: Math.hypot(b.x - b.target.x, b.y - b.target.y), error: Math.hypot(b.x - b.moveTo[0], b.y - b.moveTo[1]) }));
    });
    assert(result.gun.every(b => b.order === 'gun' && !b.board && !b.crane && b.distance > 170 && b.distance < 450 && b.error < 80), JSON.stringify(result.gun));
    await page.screenshot({ path: path.join(OUT, 'fleet-gunnery.png') });
    result.saved = await page.evaluate(() => { const B = G.Scenes.battle, st = B.runtime(); st.paused = true; const snap = B.snapshot(); G.Game.go('battle', { battle: snap }); return B.runtime().ships.filter(b => b.side === 'me' && !b.flag).every(b => b.order === 'gun' && b.face != null); }); assert(result.saved);
    console.log('통과: 짧은 교전 거리·즉시 명령 전환·학익진 자리·포격 거리·해전 저장 복원');
    result.targetPriority = await page.evaluate(() => {
      const B = G.Scenes.battle, st = B.runtime(), b = st.ships.find(b => b.side === 'me' && !b.flag), enemies = st.ships.filter(b => b.side === 'en');
      st.paused = false; st.holdFire = false; st.balls = []; st.hitstop = 0;
      st.ships.forEach((x, i) => { x.x = -1000; x.y = i * 150; x.guns.n = 0; x.halt = true; x.vel = [0, 0]; });
      b.x = b.y = 0; b.heading = Math.PI / 2; b.order = 'attack'; b.otarget = enemies[0]; b.target = enemies[0]; b.moveTo = null; b.guns.n = 12; b.reload = [0, 0, 0];
      enemies[0].x = 210; enemies[0].y = 0; enemies[1].x = 120; enemies[1].y = 0;
      B.headless = true; B.update(.05); B.headless = false;
      const shots = st.balls.filter(x => x.from === b); return shots.length > 0 && shots.every(x => x.target === enemies[0]);
    }); assert(result.targetPriority, '가까운 다른 적보다 명시한 표적에 먼저 발사');
    await page.evaluate(() => {
      G.Game.go('battle', { npc: { kind: 'navy', n: 1, ships: ['galleon'] } });
      const st = G.Scenes.battle.runtime(); st.ships.forEach(b => { b.guns.n = 0; b.crew = b.crew0 = 100; }); st.enFlag.halt = true;
      window.__boardingSay = G.UI.say; window.__boardingStarted = false;
      G.UI.say = () => { window.__boardingStarted = true; return new Promise(() => {}); }; // 접현 안내에서 멈추고 조작 경로만 확인
    });
    await page.keyboard.press('b');
    result.boarding = await page.evaluate(() => {
      const B = G.Scenes.battle, st = B.runtime(); let elapsed = 0;
      B.headless = true; while (elapsed < 25 && !st.busy) { B.update(.05); elapsed += .05; } B.headless = false;
      const out = { elapsed, started: window.__boardingStarted && st.busy > 0, distance: Math.hypot(st.myFlag.x - st.enFlag.x, st.myFlag.y - st.enFlag.y) };
      G.UI.say = window.__boardingSay; delete window.__boardingSay; G.Game.go('title'); return out;
    });
    assert(result.boarding.started && result.boarding.elapsed < 25 && result.boarding.distance < 85, JSON.stringify(result.boarding));
    console.log('통과: 시작 위치에서 백병전 명령으로 실제 접현 발동');
    // 포격으로 기함을 격침한 직후의 승패 경로를 확률 양끝으로 검사한다.
    result.surrender = await page.evaluate(() => {
      const B = G.Scenes.battle, out = [], chance = G.U.chance;
      for (const [kind, roll, noPrize] of [['pirate', true, false], ['pirate', false, false], ['navy', true, false], ['pirate', true, true]]) {
        G.Game.go('battle', { npc: { kind, n: 3, noPrize, ships: ['galleon', 'caravel', 'caravel'] } });
        const st = B.runtime(), ef = st.enFlag; ef.hp = 0; ef.alive = false; ef.sunk = true;
        const probabilities = []; G.U.chance = p => { probabilities.push(p); return roll; };
        B._t().checkEnd();
        out.push({ kind, roll, noPrize, won: st.flagWin, captured: st.ships.filter(b => b.side === 'en' && b.captured).length, sunk: ef.sunk && !ef.captured, fled: st.ships.filter(b => b.side === 'en' && b.fled).length, probabilities });
      }
      G.U.chance = chance;
      // 앞선 비동기 정산이 다음 장면을 건드리지 않게 마지막 전투에서도 나온다.
      G.Game.go('title'); return out;
    });
    assert(result.surrender[0].captured === 2 && result.surrender[0].sunk && result.surrender[0].won);
    assert(result.surrender[0].probabilities.every(p => p >= .12 && p <= .8));
    assert(result.surrender.slice(1).every(r => !r.captured && r.fled === 2));
    await page.waitForTimeout(1100); assert.deepStrictEqual(errors, []);
    fs.writeFileSync(path.join(OUT, 'browser-report.json'), JSON.stringify({ ...result, errors }, null, 2));
    console.log('통과: 포격 격침 뒤 잔여 해적선 확률 나포·실패 시 도주·금지 전투 제외·콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
