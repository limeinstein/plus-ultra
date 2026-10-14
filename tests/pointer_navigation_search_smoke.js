/* 마우스 조타·클릭 이동·정박 탐색 시험 — node tests/pointer_navigation_search_smoke.js */
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::|fonts|ERR_FILE/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await page.addInitScript(() => { window.requestAnimationFrame = () => 0; window.createImageBitmap = undefined; });
  await page.goto(process.env.PAGE_URL || pathToFileURL(path.join(ROOT, 'index.html')).href);
  await page.waitForFunction(() => window.G && G.Game && G.Scenes && G.Scenes.sea && G.Scenes.land, null, { timeout: 90000 });

  const out = await page.evaluate(async () => {
    const rows = []; const ok = (v, s) => rows.push((v ? '✓ ' : '✗ ') + s);
    await G.Game.ensureGeo(); G.Nav.init();
    G.State.newGame({ name: '마우스 시험', nation: 'PT', job: 'explorer', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
    G.SEA_RISK.pirate = 0; G.SEA_RISK.storm = 0;
    G.Explore.sense = () => []; G.Explore.report = async () => 0; G.Explore.milestones = async () => {};
    G.Disc.checkSea = () => []; G.Disc.find = async () => {};
    const lisbon = G.CITY_DATA.find(c => c && c.name === '리스본');

    G.Game.go('sea', { depart: lisbon.id });
    const SEA = G.Scenes.sea, sea = SEA.runtime(), map = document.querySelector('.mapcatch'), rect = map.getBoundingClientRect();
    const fire = (type, sx, sy, extra) => map.dispatchEvent(new MouseEvent(type, Object.assign({ bubbles: true, clientX: rect.left + sx / 1600 * rect.width, clientY: rect.top + sy / 900 * rect.height, button: 0 }, extra || {})));
    sea.path = null; sea.target = null; sea.paused = true; sea.vel = [0, 0];
    fire('mousemove', 1250, 450);
    ok(sea.pointerSteer && !sea.paused && Math.abs(sea.dirCrs) < 0.15, '항해: 커서를 오른쪽에 두면 동쪽으로 출발');

    const sl = G.Game.state.loc;
    let goal = null;
    for (let r = 0.35; r <= 1.2 && !goal; r += 0.15) for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2, x = sl.lon + Math.cos(a) * r, y = sl.lat + Math.sin(a) * r;
      if (G.Geo.isSea(x, y, 0.2) && G.Geo.dist(x, y, lisbon.lon, lisbon.lat) > 0.35) { const p = SEA.toScreen(x, y); if (p[0] > 80 && p[0] < 1520 && p[1] > 80 && p[1] < 820) { goal = [x, y, p]; break; } }
    }
    ok(!!goal, '항해: 화면 안의 클릭 목적지 확보');
    if (goal) {
      fire('mousedown', goal[2][0], goal[2][1]);
      const target = sea.target && [sea.target.lon, sea.target.lat];
      ok(!!sea.path && !sea.pointerSteer, '항해: 클릭하면 목적지 경로로 전환');
      fire('mousemove', 350, 200);
      ok(!!sea.path && sea.target && target && G.Geo.dist(target[0], target[1], sea.target.lon, sea.target.lat) < 0.001, '항해: 이동 중 커서가 클릭 경로를 덮어쓰지 않음');
    }

    sea.path = null; sea.target = null; sea.dirCrs = null; sea.pointerSteer = false; sea.paused = true; sea.stopping = false; sea.vel = [0, 0];
    let npcSpot = null;
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, x = sl.lon + Math.cos(a) * 2, y = sl.lat + Math.sin(a) * 2; if (G.Geo.isSea(x, y, 0.5) && G.Geo.isSea(x + Math.cos(a) * 0.2, y + Math.sin(a) * 0.2, 0.5)) { npcSpot = [x, y, a]; break; } }
    sea.npcs = npcSpot ? [{ id: 'moving', kind: 'merchant', lon: npcSpot[0], lat: npcSpot[1], heading: npcSpot[2], n: 1, spd: 1, life: 20, hostile: false, ships: ['tartane'] }] : [];
    const n0 = sea.npcs[0] && [sea.npcs[0].lon, sea.npcs[0].lat];
    SEA.update(0.5);
    ok(n0 && G.Geo.dist(n0[0], n0[1], sea.npcs[0].lon, sea.npcs[0].lat) > 0.01 && sea.paused, '항해: 내 배가 멈춰도 다른 배는 계속 이동');

    sea.npcs = []; sea.dayAcc = 0; const day0 = G.U.dayIndex(G.Game.state.date);
    const searched = await SEA.search();
    ok(searched && G.U.dayIndex(G.Game.state.date) === day0 + 1, '항해: 정지 상태 탐색이 하루를 사용');
    ok(!![...document.querySelectorAll('.sailbar button')].find(b => b.textContent.indexOf('탐색') >= 0), '항해: 탐색 버튼 표시');

    G.Game.go('land', { from: lisbon.id });
    const L = G.Scenes.land, land = L.runtime(), lmap = document.querySelector('.mapcatch'), lr = lmap.getBoundingClientRect();
    const lfire = (type, sx, sy) => lmap.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: lr.left + sx / 1600 * lr.width, clientY: lr.top + sy / 900 * lr.height, button: 0 }));
    lfire('mousemove', 1250, 450);
    ok(land.pointerWalk && !land.paused && land.dir[0] > 0.95, '탐험: 커서를 오른쪽에 두면 동쪽으로 걷기 시작');
    const ll = G.Game.state.loc; let landGoal = null;
    for (let r = 0.08; r <= 0.45 && !landGoal; r += 0.04) for (let i = 0; i < 32; i++) {
      const a = i / 32 * Math.PI * 2, x = ll.lon + Math.cos(a) * r, y = ll.lat + Math.sin(a) * r;
      if (G.Geo.isLand(x, y)) { const sx = 800 + G.Geo.wrapLon(x - land.cam.lon) * land.cam.zoom, sy = 450 - (y - land.cam.lat) * land.cam.zoom; if (sx > 80 && sx < 1520 && sy > 80 && sy < 820) { landGoal = [x, y, sx, sy]; break; } }
    }
    ok(!!landGoal, '탐험: 화면 안의 클릭 목적지 확보');
    if (landGoal) {
      lfire('mousedown', landGoal[2], landGoal[3]);
      ok(!!land.path && !land.dir && !land.pointerWalk, '탐험: 클릭하면 커서 방향 대신 목적지 이동');
      lfire('mousemove', 300, 700);
      ok(!!land.path && !land.dir, '탐험: 이동 중 커서가 클릭 목적지를 덮어쓰지 않음');
      for (let i = 0; i < 600 && land.path; i++) L.update(0.05);
      ok(!land.path && land.paused, '탐험: 클릭한 곳에 도착하면 정지');
    }
    return rows;
  });

  console.log(out.join('\n'));
  console.log(errors.slice(0, 8).join('\n') || '✓ 콘솔 오류 없음');
  await browser.close();
  process.exitCode = out.some(x => x[0] === '✗') || errors.length ? 1 : 0;
})().catch(e => { console.error(e); process.exit(1); });
