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
    const key = (code) => document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code.startsWith('Shift') ? 'Shift' : code, bubbles: true }));
    const upd = (dt) => { sea.dayAcc = 0; SEA.update(dt); };   // 날이 넘어가 사건이 뜨지 않게
    const home = [G.Game.state.loc.lon, G.Game.state.loc.lat];
    G.Game.state.loc.lon = -20; G.Game.state.loc.lat = 38; sea.cam.lon = -20; sea.cam.lat = 38; upd(0.02);   // 항구가 없는 먼바다에서 (멈추면 입항을 묻지 않게)
    const btnF = () => document.querySelector('.sailbar .btn.follow');
    ok(!G.Ctrl.follow() && btnF() && !btnF().classList.contains('on'), '항해: 마우스 따라가기 기본 끔 · 수첩 옆 단추 (' + (btnF() && btnF().previousElementSibling && btnF().previousElementSibling.textContent) + ' 옆)');
    fire('mousemove', 1250, 450);
    ok(!sea.pointerSteer && sea.paused, '항해: 끔이면 커서를 옮겨도 배가 그대로');
    key('ShiftLeft'); upd(0.02);
    ok(G.Ctrl.follow() && btnF().classList.contains('on'), '항해: 왼쪽 Shift로 켬 (단추가 빛남)');
    fire('mousemove', 1250, 450);
    ok(!sea.pointerSteer && sea.paused, '항해: 켬이어도 한 번 누르기 전에는 따라가지 않음');
    fire('mousedown', 1250, 450);
    ok(sea.pointerSteer && sea.followArmed && !sea.paused && !sea.path && Math.abs(sea.dirCrs) < 0.15, '항해: 오른쪽 바다를 누르면 동쪽으로 따라가기 시작 (목적지 아님)');
    fire('mousemove', 800, 100);
    const c0 = sea.dirCrs; for (let i = 0; i < 10; i++) upd(0.02);
    const c1 = sea.dirCrs; for (let i = 0; i < 120; i++) upd(0.02);
    ok(c1 > c0 + 0.05 && c1 < 1.2 && Math.abs(sea.dirCrs - Math.PI / 2) < 0.05, '항해: 그 뒤로는 커서를 옮기는 것만으로 침로가 차츰 북쪽으로 (0.2초 ' + c1.toFixed(2) + ' → ' + sea.dirCrs.toFixed(2) + ')');
    // 조작 감도
    const turnIn = (cs) => { G.Game.state.settings.ctrlSens = cs; fire('mousemove', 1250, 450); for (let i = 0; i < 200; i++) upd(0.02); fire('mousemove', 800, 100); for (let i = 0; i < 10; i++) upd(0.02); return sea.dirCrs; };
    const tSlow = turnIn('slow'), tNorm = turnIn('normal'), tFast = turnIn('fast');
    ok(tSlow < tNorm && tNorm < tFast && Math.abs(tFast - Math.PI / 2) < 0.01, '항해: 조작 감도 — 0.2초 동안 도는 침로 느리게 ' + tSlow.toFixed(2) + ' < 보통 ' + tNorm.toFixed(2) + ' < 빠르게 ' + tFast.toFixed(2));
    G.Game.state.settings.ctrlSens = 'slow';
    const l = G.Game.state.loc, q = SEA.toScreen(l.lon, l.lat);
    fire('mousemove', q[0] + Math.cos(sea.dirCrs + 0.12) * 300, q[1] - Math.sin(sea.dirCrs + 0.12) * 300);
    const b0 = sea.dirCrs; for (let i = 0; i < 30; i++) upd(0.02);
    ok(Math.abs(sea.dirCrs - b0) < 0.001, '항해: 느리게 — 7°쯤 비켜난 커서는 무시 (침로 그대로)');
    fire('mousemove', q[0] + 40, q[1]);
    ok(sea.paused || sea.stopping, '항해: 느리게 — 배 둘레 70px 안에 커서를 두면 선다');
    G.Game.state.settings.ctrlSens = 'normal';
    key('Space');
    ok(!sea.followArmed && !sea.pointerSteer, '항해: Space를 누르면 따라가기를 멈춤');
    fire('mousedown', 1250, 450);
    ok(sea.followArmed && sea.pointerSteer, '항해: 다시 누르면 이어 따라감');
    key('ShiftRight'); upd(0.02);
    ok(!G.Ctrl.follow() && !sea.followArmed && !sea.pointerSteer && !btnF().classList.contains('on'), '항해: 오른쪽 Shift로 끔 — 따라가기 멈춤');
    btnF().click(); ok(G.Ctrl.follow(), '항해: 단추로 켬'); btnF().click(); ok(!G.Ctrl.follow(), '항해: 단추로 끔');
    sea.path = null; sea.target = null; sea.dirCrs = null; sea.paused = true; sea.stopping = false; sea.vel = [0, 0];

    G.Game.state.loc.lon = home[0]; G.Game.state.loc.lat = home[1]; sea.cam.lon = home[0]; sea.cam.lat = home[1]; sea.portPromptUntil = { [lisbon.id]: Date.now() + 1e9 };   // 리스본으로 되돌아와도 입항을 묻지 않게
    ok(!sea.busy && !G.UI.busy(), '항해: 시험 중 열린 창 없음 ' + sea.busy + ' ' + (document.querySelector('.dlg, .window') || {}).innerText);
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
    const lbtn = () => document.querySelector('.sailbar .btn.follow');
    lfire('mousemove', 1250, 450);
    ok(!land.pointerWalk && !land.dir && lbtn() && !lbtn().classList.contains('on'), '탐험: 끔이면 커서를 옮겨도 그대로 · 수첩 옆 단추');
    key('ShiftLeft');
    lfire('mousemove', 1250, 450);
    ok(G.Ctrl.follow() && !land.pointerWalk, '탐험: Shift로 켬 — 누르기 전에는 따라가지 않음');
    lfire('mousedown', 1250, 450);
    ok(land.pointerWalk && land.followArmed && !land.paused && !land.path && land.dir[0] > 0.95, '탐험: 오른쪽을 누르면 동쪽으로 걷기 시작');
    lfire('mousemove', 800, 100);
    const lupd = (dt) => { const p = [G.Game.state.loc.lon, G.Game.state.loc.lat]; L.update(dt); G.Game.state.loc.lon = p[0]; G.Game.state.loc.lat = p[1]; };   // 제자리에서 방향만 본다(물가에 막히지 않게)
    for (let i = 0; i < 4; i++) lupd(0.02);
    const la = land.dir ? Math.atan2(land.dir[1], land.dir[0]) : NaN;
    for (let i = 0; i < 60; i++) lupd(0.02);
    ok(land.dir && la > 0.05 && la < 1.3 && Math.atan2(land.dir[1], land.dir[0]) > 1.4, '탐험: 커서를 옮기면 발걸음이 차츰 북쪽으로 (' + la.toFixed(2) + ' → ' + (land.dir ? Math.atan2(land.dir[1], land.dir[0]).toFixed(2) : 'null ' + land.paused + ' ' + land.busy) + ')');
    key('ShiftLeft');
    ok(!G.Ctrl.follow() && !land.followArmed && !land.pointerWalk, '탐험: Shift로 끔');
    land.dir = null; land.paused = true;
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
