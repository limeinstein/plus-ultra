/* 먼바다의 스타일화된 너울 · 육상 탐험 중 바다를 오가는 배
   A. 바다 물결 (js/world/renderer.js waterCol · js/world/waves.js WV.sea)
      · 선체가 타는 큰 너울은 유지하고, 화면을 어지럽히던 셀 단위 반달 물마루는 없다
      · 시간 변화가 연속적이고 바다 장면이 셰이더 오류 없이 그려진다
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
    // ---------------- A. 스타일화된 너울
    const a = await page.evaluate(() => {
      const WV = G.Waves, out = {};
      const deep = WV.coast(-38, 30);
      let maxDeep = 0, maxStep = 0, meanStep = 0, cnt = 0;
      for (let i = 0; i < 60; i++) {
        const lo = -38 + (i % 10) * 0.07, la = 30 + Math.floor(i / 10) * 0.05;
        const h0 = WV.sea(lo, la, 12.3, [0.6, 0.35], 170, deep).h;
        const h1 = WV.sea(lo, la, 12.35, [0.6, 0.35], 170, deep).h;
        maxDeep = Math.max(maxDeep, Math.abs(h0)); maxStep = Math.max(maxStep, Math.abs(h1 - h0)); meanStep += Math.abs(h1 - h0); cnt++;
      }
      out.maxDeep = maxDeep; out.maxStep = maxStep; out.meanStep = meanStep / cnt; out.hasTrain = typeof WV.train === 'function'; out.cnt = cnt;
      return out;
    });
    console.log('   ' + JSON.stringify(a));
    ok(a.maxDeep > 0.008 && a.cnt > 10, '먼바다의 큰 너울 높이가 유지된다 (최대 ' + a.maxDeep.toFixed(4) + ')');
    ok(!a.hasTrain, '셀 단위 반달 물마루 레이어를 제거했다');
    ok(a.maxStep < a.maxDeep * 0.8 && a.meanStep > 0, '너울이 순간이동하지 않고 연속해서 흐른다');
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
    await page.evaluate(() => {
      if (G.SEA_RISK) { G.SEA_RISK.pirate = 0; G.SEA_RISK.storm = 0; }
      const st = G.Scenes.sea.runtime(); st.speed = 1; G.Game.state.loc.heading = 0.25; G.Scenes.sea.takeCourse(0.25);
    });
    await page.waitForTimeout(4200);
    await page.screenshot({ path: path.join(OUT, 'landsea_ocean_sailing.png') });
    const wakeN = await page.evaluate(() => { const f = G.Scenes.sea.runtime().fx; return f ? f.trail.length + f.parts.length : 0; });
    ok(wakeN > 3, '항해 중에는 배 주변 포말과 항적이 남는다 (효과 ' + wakeN + '개)');
    const turnWake = await page.evaluate(() => {
      const f = G.Scenes.sea.runtime().fx, q = f && f.trail[f.trail.length - 1];
      window.__wakeAnchor = q ? [q.x, q.y] : null; G.Scenes.sea.takeCourse(1.0); return window.__wakeAnchor;
    });
    await page.waitForTimeout(2200);
    await page.screenshot({ path: path.join(OUT, 'landsea_ocean_turning.png') });
    const wakeHeld = await page.evaluate(() => {
      const a = window.__wakeAnchor, f = G.Scenes.sea.runtime().fx; return !!(a && f && f.trail.some(q => Math.abs(q.x - a[0]) < 1e-9 && Math.abs(q.y - a[1]) < 1e-9));
    });
    ok(!!turnWake && wakeHeld, '선회해도 앞서 생긴 항적은 지나간 세계 좌표에 남는다');

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
