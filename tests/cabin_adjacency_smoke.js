/* 맞닿은 선실 — 따끈한 밥상·음악실 앙상블 회귀 검사. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Cabins && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(() => {
      G.State.newGame({ name: '선실 시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, CB = G.Cabins;
      const big = ['galleon', 'carrack', 'nao'].find(id => G.SHIP[id] && G.SHIP[id].cabins >= 8) || 'galleon';
      s.fleet.ships[0] = G.R.newShip(big, '시험 기함'); s.fleet.cabinUid = null; s.mates = [];
      const rooms = CB.rooms();
      const candidates = G.MATES.filter(d => d.sk && d.sk.music > 0 && !d.eventOnly).slice(0, 3);
      if (rooms.length < 9 || candidates.length < 3) throw new Error('시험용 선실 또는 음악 특기자가 부족하다');
      const make = (d, room) => { const m = { id: d.id, role: 'none', loyal: 100, room, roomType: 'musicroom' }; s.mates.push(m); return m; };
      // 6열 배치: 1-2는 붙고, 6-7은 줄 경계라 붙지 않으며, 2-8은 위아래로 붙는다.
      [1, 2, 8].forEach(i => { rooms[i] = 'musicroom'; });
      candidates.forEach((d, i) => make(d, [1, 2, 8][i]));
      const ensemble = CB.ensembles()[0], fx = CB.ensembleFx();
      const touch = { side: CB.roomsTouch(1, 2), wrap: CB.roomsTouch(6, 7), vertical: CB.roomsTouch(2, 8) };
      // 요리실과 식당은 붙었을 때만 기본 선실 효과와 차림 배율이 오른다.
      const cookDef = G.MATES.find(d => d.sk && d.sk.cook > 0 && !d.eventOnly);
      rooms[3] = 'galley'; rooms[5] = 'mess';
      const cook = { id: cookDef.id, role: 'none', loyal: 100, room: 3, roomType: 'galley' }; s.mates.push(cook);
      const cold = CB.fx('galley', 'galley');
      rooms[4] = 'mess'; rooms[5] = 'hold';
      const hot = CB.fx('galley', 'galley'), pair = CB.kitchenPair();
      // 같은 유행 배수라도 앙상블은 입항 중에만 유행으로 오른 몫을 키운다.
      const city = G.CITY_DATA[0]; s.loc = { mode: 'city', city: city.id, lon: city.lon, lat: city.lat };
      const fad = CB.fadBoost(city, 1.6); s.loc.via = 'land'; const landFad = CB.fadBoost(city, 1.6);
      return { touch, n: ensemble && ensemble.n, name: ensemble && ensemble.name, fat: fx.fat, disc: fx.disc, fadFx: fx.fad,
        cold, hot, pair, fad, landFad };
    });
    ok(r.touch.side && r.touch.vertical && !r.touch.wrap, '6열 선실의 좌우·상하 인접과 줄 경계를 정확히 구분한다');
    ok(r.n === 3 && r.name === '트리오' && r.fat > 0 && r.disc > 0 && r.fadFx > 0, '맞닿은 음악실 3칸이 트리오를 이루어 피로·규율·유행 효과를 낸다');
    ok(r.pair && r.pair.galley === 3 && r.pair.mess === 4 && r.hot > r.cold, '맞닿은 요리실·식당은 「따끈한 밥상」 보너스를 받는다');
    ok(r.fad > 1 && r.landFad === 1, '앙상블 유행 효과는 함대가 입항한 도시에서만 적용된다');
    ok(errors.length === 0, '콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
