/* 육상에서 들른 잔지바르의 성문을 나와도 원래 대륙 탐험대로 돌아간다. */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/feedback132-20261103');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
    page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ body: '', contentType: 'text/css' }));
    await page.addInitScript(() => { requestAnimationFrame = () => 0; });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Scenes.land && G.State, null, { polling: 100 });
    const report = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '잔지바르 성문 검사', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, L = G.Scenes.land, c = G.CITY_DATA.find(c => c.name === '잔지바르');
      s.settings.res = .35; s.settings.autosave = false; s.settings.portAsk = 'off'; s.player.gold = 100000; s.flags.prologue = true;
      let origin;
      for (let dx = .29; dx > .10 && !origin; dx -= .01) for (let dy = -.06; dy <= .06; dy += .01) {
        const p = [c.lon - dx, c.lat + dy];
        if (G.Geo.dist(...p, c.lon, c.lat) < .3 && G.Geo.isLand(...p)) { origin = p; break; }
      }
      if (!origin) throw Error('대륙에서 잔지바르 입장 범위 재현점 없음');
      const base = { type: 'ship', lon: origin[0] + .05, lat: origin[1], heading: 1.3 };
      s.landReturn = { mode: 'land', lon: origin[0], lat: origin[1], heading: 2.1, base, party: 18, party0: 20, days: 11, spent: 321, found0: 2, marks0: 7, mount: { id: 'horse', n: 2 } };
      s.loc = { mode: 'city', city: c.id, lon: c.lon, lat: c.lat, via: 'land' };
      L.resumeFromCity(c);
      window.feedback132 = { origin, base, expedition: JSON.parse(JSON.stringify(s.loc)), cityId: c.id };
      return { origin, resumed: [s.loc.lon, s.loc.lat], city: [c.lon, c.lat], restored: s.loc };
    });
    console.log(JSON.stringify(report));
    assert.deepEqual(report.resumed, report.origin, '도시 중심의 섬 대신 입장 전 대륙 위치를 복원');
    assert.equal(report.restored.spent, 321); assert.equal(report.restored.party0, 20); assert.equal(report.restored.found0, 2); assert.equal(report.restored.marks0, 7);
    // 실제 육상 단추로 입장한다. 입장 심사와 인사만 생략하고 도시·성문·복귀 경로는 그대로 쓴다.
    await page.evaluate(async () => {
      const s = G.Game.state, t = feedback132;
      s.loc = JSON.parse(JSON.stringify(t.expedition));
      G.Cabins.rooms();
      G.Scenes.city.handleEntry = async () => true; G.Scenes.city.arrival = async () => {};
      G.UI.fade = async fn => fn();
      G.Game.go('land', {}); G.Scenes.land.update(0); await G.Loader.hide();
      window.fleet132 = JSON.stringify(s.fleet);
    });
    await page.getByRole('button', { name: '도시에 들어간다', exact: true }).click();
    await page.waitForFunction(() => G.Game.sceneName === 'city' && !G.Scenes.city.isBusy(), null, { polling: 100 });
    const visit = await page.evaluate(() => {
      const s = G.Game.state;
      localStorage.setItem('feedback132-save', G.State.serialize());
      return { via: s.loc.via, saved: s.landReturn, fleet: JSON.stringify(s.fleet), expectedFleet: fleet132 };
    });
    assert.equal(visit.via, 'land'); assert.deepEqual([visit.saved.lon, visit.saved.lat], report.origin); assert.equal(visit.saved.spent, 321); assert.equal(visit.fleet, visit.expectedFleet);
    // 도시에 머무는 중 저장·브라우저 재실행 후 실제 성문 메뉴로 돌아간다.
    await page.reload();
    await page.waitForFunction(() => window.G && G.Scenes.land && G.State, null, { polling: 100 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo(); G.Game.state = G.State.deserialize(localStorage.getItem('feedback132-save')); localStorage.removeItem('feedback132-save');
      G.UI.fade = async fn => fn(); G.Scenes.city.say = async () => {};
      G.Town.focusOn = async () => {}; // 자동 프레임을 멈춘 검사에서는 건물까지 걷는 연출만 생략한다.
      G.Scenes.city.B.gate.outfit = async () => ({ id: 'walk', n: 0 });
      G.Game.go('city', { cityId: G.Game.state.loc.city, load: true }); await G.Loader.hide();
    });
    await page.waitForFunction(() => !G.Scenes.city.isBusy(), null, { polling: 100 });
    await page.evaluate(() => { G.Scenes.city.visit('gate'); });
    await page.locator('.cmdmenu .cmd').filter({ hasText: '탐험대로 돌아간다' }).click();
    await page.waitForFunction(() => G.Game.sceneName === 'land', null, { polling: 100 });
    const resumed = await page.evaluate(() => {
      const s = G.Game.state, L = G.Scenes.land, st = L.runtime();
      for (let frame = 0; frame < 6; frame++) L.update(0); // 정지 화면의 그리기 생략 주기를 지나 실제 지형·상태판까지 그린다.
      return { loc: s.loc, landReturn: !!s.landReturn, fleet: JSON.stringify(s.fleet), paused: st.paused, path: st.path };
    });
    assert.deepEqual([resumed.loc.lon, resumed.loc.lat], report.origin); assert.deepEqual(resumed.loc.base, report.restored.base);
    assert.equal(resumed.loc.spent, 321); assert.equal(resumed.loc.days, 11); assert.equal(resumed.loc.party, 18); assert.equal(resumed.loc.mount.id, 'walk');
    assert.equal(resumed.landReturn, false); assert.equal(resumed.paused, true); assert.equal(resumed.path, null);
    const fleetAfter = JSON.parse(resumed.fleet), fleetBefore = JSON.parse(visit.fleet);
    // 성문 건물에 들어가는 하루 동안 규율은 정상적으로 회복한다. 배·대원·짐·보급은 그대로여야 한다.
    for (const key of ['ships', 'crew', 'cargo', 'food', 'water', 'mat']) assert.deepEqual(fleetAfter[key], fleetBefore[key], '기존 함대 보존: ' + key);
    fs.mkdirSync(OUT, { recursive: true }); await page.screenshot({ path: path.join(OUT, 'returned-to-mainland.png') });
    const recovery = await page.evaluate(async () => {
      const s = G.Game.state, L = G.Scenes.land, c = G.CITY_DATA.find(c => c.name === '잔지바르');
      const saved = JSON.parse(JSON.stringify(s.loc)), p = L.landPoint(c.lon, c.lat);
      const st = L.runtime(); st.dir = [-1, 0]; st.path = null; st.paused = false;
      L.update(.05); const walkable = s.loc.lon < saved.lon; st.dir = null; st.paused = true;
      s.loc.lon = saved.lon; s.loc.lat = saved.lat;
      // 옛 판의 오류를 그대로 만든 저장: 탐험대는 섬 위, 입장 전 좌표는 대륙에 남아 있다.
      s.landReturn = JSON.parse(JSON.stringify(saved)); s.loc.lon = p[0]; s.loc.lat = p[1];
      G.Game.state = G.State.deserialize(G.State.serialize());
      G.Game.go('land', {});
      const restored = [G.Game.state.loc.lon, G.Game.state.loc.lat], record = JSON.stringify(G.Game.state.loc);
      G.Game.go('land', {});
      const once = JSON.stringify(G.Game.state.loc) === record && !G.Game.state.landReturn;
      // 같은 땅에서 정상적으로 걸어온 옛 저장은 되감지 않는다.
      const ss = G.Game.state, point = [ss.loc.lon, ss.loc.lat];
      let next;
      for (let a = 0; a < 8; a++) {
        const q = [point[0] + Math.cos(a * Math.PI / 4) * .015, point[1] + Math.sin(a * Math.PI / 4) * .015];
        if (G.Geo.isLand(...q)) { next = q; break; }
      }
      if (!next) throw Error('정상 육상 저장 검사점 없음');
      ss.landReturn = JSON.parse(JSON.stringify(ss.loc)); ss.loc.lon = next[0]; ss.loc.lat = next[1];
      G.Game.go('land', {});
      const kept = ss.loc.lon === next[0] && ss.loc.lat === next[1];
      // 입장 전 좌표가 없는 옛 도시 저장도 성문 근처의 뭍으로 나올 수 있다.
      let legacy = 0;
      G.CITY_DATA.forEach(city => {
        ss.landReturn = { base: saved.base, party: 18, days: 3, mount: { id: 'walk', n: 0 } };
        L.resumeFromCity(city); if (G.Geo.isLand(ss.loc.lon, ss.loc.lat)) legacy++;
      });
      return { island: p, restored, once, kept, walkable, legacy, cities: G.CITY_DATA.length };
    });
    assert.deepEqual(recovery.restored, report.origin, '이미 섬으로 옮겨진 옛 저장 복구'); assert(recovery.once && recovery.kept && recovery.walkable); assert.equal(recovery.legacy, recovery.cities);
    report.recovery = recovery; report.actualGateAndSaveReload = true;
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ ...report, errors }, null, 2));
    console.log('통과: 잔지바르 실제 입장·성문 복귀·도시 저장 재실행·탐험/함대 보존·기존 갇힘 복구·316개 도시 옛 저장·콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
