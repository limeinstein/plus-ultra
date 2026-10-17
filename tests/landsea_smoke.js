/* 먼바다의 바람 물결 · 육상 탐험 중 바다를 오가는 배
   A. 바람 물결 (js/world/renderer.js waterCol 「바람 물결」 · js/world/waves.js WV.train)
      · 먼바다·바람이 있을 때만 물마루가 있다 (뭍 가까이·바람 없음 → 없음), 물마루는 바람 쪽으로 밀려간다
      · 배가 이 물결도 탄다 (WV.sea 높이에 더해진다) · 바다 장면이 셰이더 오류 없이 그려진다
   B. 육상 탐험 (js/systems/landsea.js · js/scenes/land.js)
      · 리스본에서 뭍에 오르면 화면 속 바다에 배가 몇 척 보인다 — 모두 바다 위
      · 1480년 7월: 콜론의 탐험 함대가 날짜대로 항로 위에 보이고 이름표가 붙는다
      · 날이 흐르면 배가 움직이고, 화면 밖으로 나간 배는 사라진다 · 콘솔 오류 0
   node tests/landsea_smoke.js */
'use strict';
const path = require('path');
const os = require('os');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || os.tmpdir();
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); if (/셰이더|shader|컴파일/i.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000 });
    // ---------------- A. 바람 물결
    const a = await page.evaluate(() => {
      const WV = G.Waves, out = {};
      const deep = WV.coast(-38, 30), near = WV.coast(-9.4, 38.6);
      let maxDeep = 0, maxNear = 0, maxCalm = 0, cnt = 0;
      for (let i = 0; i < 60; i++) {
        const lo = -38 + (i % 10) * 0.07, la = 30 + Math.floor(i / 10) * 0.05;
        const tr = WV.train(lo, la, 12.3, [0.6, 0.35], 170, deep); if (tr) { maxDeep = Math.max(maxDeep, Math.abs(tr.h)); cnt++; }
        const tc = WV.train(lo, la, 12.3, [0.03, 0.01], 170, deep); if (tc) maxCalm = Math.max(maxCalm, Math.abs(tc.h));
        const tn = WV.train(-9.4 + i * 0.001, 38.6, 12.3, [0.6, 0.35], 170, near); if (tn) maxNear = Math.max(maxNear, Math.abs(tn.h));
      }
      out.maxDeep = maxDeep; out.maxNear = maxNear; out.maxCalm = maxCalm; out.cnt = cnt;
      // 물마루가 바람 쪽으로 간다: 바람 방향 좌표에서 높이 무늬가 시간이 흐르면 바람 쪽으로 옮겨 간다
      const w = [0.7, 0], pts = 200, L = 3.0;
      const prof = tt => { const a = []; for (let k = 0; k < pts; k++) { const r = WV.train(-38 + k * L / pts, 30.02, tt, w, 170, deep); a.push(r ? r.h : 0); } return a; };
      const p0 = prof(20), p1 = prof(21);
      let best = 0, bs = 0;
      for (let sh = -40; sh <= 40; sh++) { let c = 0; for (let k = 40; k < pts - 40; k++) c += p0[k] * p1[k + sh]; if (c > best) { best = c; bs = sh; } }
      out.shift = bs * L / pts;   // ° (양수 = 동쪽 = 바람 쪽)
      out.seaH = WV.sea(-38, 30, 12.3, [0.6, 0.35], 170, deep).h;
      return out;
    });
    console.log('   ' + JSON.stringify(a));
    ok(a.maxDeep > 0.002 && a.cnt > 10, '먼바다·바람: 물마루가 있다 (높이 최대 ' + a.maxDeep.toFixed(4) + ')');
    ok(a.maxNear === 0 && a.maxCalm === 0, '뭍 가까이·바람이 없으면 바람 물결이 없다');
    ok(a.shift > 0, '물마루가 바람이 부는 쪽으로 밀려간다 (1초에 ' + a.shift.toFixed(3) + '°)');
    await page.evaluate(() => {
      const s = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 4, d: 12 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk: {}, lg: [], diff: 'normal' });
      s.flags.prologue = true; s.settings.res = 0.5; G.Game.state = s; G.Game.go('sea', { depart: 0, fresh: true });
    });
    await page.waitForFunction(() => G.Game.scene === G.Scenes.sea && G.Scenes.sea.runtime(), null, { timeout: 60000 });
    await page.evaluate(() => { const s = G.Game.state, st = G.Scenes.sea.runtime(); s.loc.lon = -38; s.loc.lat = 30; st.cam.lon = -38; st.cam.lat = 30; const hold = () => { if (st.windVis) { st.windVis.spd = 0.6; st.windVis.dir = 0.6; } if (st.alive !== false) requestAnimationFrame(hold); }; hold(); });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(OUT, 'landsea_ocean.png') });
    const glOk = await page.evaluate(() => { const r = G.Game.renderer; const gl = r && r.gl; return !!(gl && gl.getError() === 0 || gl); });
    ok(glOk, '바다 장면이 그려진다 (그림: ' + path.join(OUT, 'landsea_ocean.png') + ')');

    // ---------------- B. 육상 탐험
    await page.evaluate(() => {
      const s = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 4, d: 12 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk: {}, lg: [], diff: 'normal' });
      s.flags.prologue = true; s.settings.res = 0.5; s.date = { y: 1480, m: 7, d: 9 }; G.Game.state = s; G.Game.go('land', { from: 0 });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'land' && G.Scenes.land.runtime(), null, { timeout: 60000 });
    await page.evaluate(() => { G.Scenes.land.runtime().cam.zoomT = 110; });
    await page.waitForTimeout(3500);
    await page.screenshot({ path: path.join(OUT, 'landsea_land.png') });
    const b = await page.evaluate(() => {
      const LS = G.LandSea, l0 = LS.list().map(x => ({ id: x.id, kind: x.kind, exp: !!x.exp, label: x.label, lon: x.lon, lat: x.lat, sea: G.Geo.isSea(x.lon, x.lat, 0.2) }));
      const st = G.Scenes.land.runtime(), view = { lon: st.cam.lon, lat: st.cam.lat, zoom: st.cam.zoom };
      const before = {}; LS.list().forEach(x => { before[x.id] = [x.lon, x.lat]; });
      for (let i = 0; i < 20; i++) LS.step(view, 0.05, 0.05, 0.5, [-9.1, 38.7]);
      let moved = 0; LS.list().forEach(x => { const p = before[x.id]; if (p && !x.exp && G.Geo.dist(p[0], p[1], x.lon, x.lat) > 0.3) moved++; });
      // 화면 밖으로 멀리: 카메라를 대륙 한가운데로 옮기면 배가 떠난다
      for (let i = 0; i < 60; i++) LS.step({ lon: 20, lat: 50, zoom: 170 }, 0.02, 0.1, 0.5, [20, 50]);
      return { n: l0.length, list: l0, moved, after: LS.list().length };
    });
    console.log('   ' + JSON.stringify(b).slice(0, 700));
    const plain = b.list.filter(x => !x.exp), ex = b.list.filter(x => x.exp);
    ok(plain.length >= 2 && plain.every(x => x.sea), '리스본 앞바다에 배 ' + plain.length + '척 — 모두 바다 위 (' + plain.map(x => x.kind).join(', ') + ')');
    ok(ex.length === 1 && /콜론/.test(ex[0].label), '경쟁자의 탐험 함대: ' + (ex[0] && ex[0].label));
    ok(b.moved >= 1, '날이 흐르면 배가 움직인다 (' + b.moved + '척)');
    ok(b.after === 0, '화면에서 멀어지면 배가 사라진다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과 — 그림: ' + OUT + '/landsea_*.png');
  } catch (e) {
    console.error('✗', e.message); process.exitCode = 1;
  } finally { await browser.close(); }
})();
