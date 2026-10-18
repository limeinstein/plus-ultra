/* 성문으로 나선 육상 탐험이 물 위에서 시작해 끼이던 것 (QA 2026-10-18: 브레멘 성문 → 출성 → 못 움직임)
   도시 자리(경위도)가 강·만의 물 위인 곳(브레멘·말라카)은 가장 가까운 뭍에서 출발해야 한다 (js/scenes/land.js landPoint).
   ① 모든 도시: 성문으로 나서는 자리가 뭍인가 ② 브레멘·말라카·리스본: 성문으로 나서서 방향키로 걸으면 실제로 움직이는가
   ③ 탐험대로 돌아간다(resumeFrom)·물 위에 선 옛 저장 파일도 풀린다 ④ 콘솔 오류 0
   node tests/land_gate_water_smoke.js  (BROWSER_EXE=크로미움 경로 · OUT=스크린샷 폴더) */
'use strict';
const path = require('path'), fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const PAGE = process.env.PAGE ? pathToFileURL(path.resolve(process.env.PAGE)).href : pathToFileURL(path.join(ROOT, 'index.html')).href;
const OUT = process.env.OUT || path.join(ROOT, 'tmp', 'land_gate_water');
fs.mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });   // 육상 화면(WebGL)은 swiftshader에서 느리다 — 작은 창으로
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_FAILED|_blob/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(PAGE);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 180000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '디오구 페헤이라', nation: 'PT', job: 'explorer', age: 30, birth: { m: 4, d: 12 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.prologueDone = true; s.date = { y: 1520, m: 5, d: 1 }; s.player.gold = 50000; s.settings.res = 0.35;
      if (G.SEA_RISK) { G.SEA_RISK.pirate = 0; G.SEA_RISK.storm = 0; }
    });
    // ① 모든 도시: 성문으로 나서는 자리
    const all = await page.evaluate(() => {
      const bad = [], water = [];
      G.CITY_DATA.forEach(c => {
        if (!c) return;
        if (!G.Geo.isLand(c.lon, c.lat)) water.push(c.name);
        const p = G.Scenes.land.landPoint(c.lon, c.lat);
        if (!G.Geo.isLand(p[0], p[1]) || G.Geo.dist(p[0], p[1], c.lon, c.lat) > 0.6) bad.push(c.name);
      });
      return { bad, water };
    });
    ok(all.water.indexOf('브레멘') >= 0, '도시 자리가 물 위인 곳: ' + all.water.join(' · '));
    if (!process.env.SKIP_ALL) ok(!all.bad.length, '모든 도시에서 성문으로 나서는 자리가 뭍 (가까운 뭍 0.6° 안)' + (all.bad.length ? ' — 실패: ' + all.bad.join(', ') : ''));
    // ② 성문으로 나서서 걷기: 브레멘(46) · 말라카(160) · 리스본(0)
    for (const id of (process.env.IDS != null ? process.env.IDS.split(',').filter(Boolean).map(Number) : [0, 46, 160])) {
      await page.evaluate(id => { G.Game.go('city', { cityId: id }); }, id);
      for (let i = 0; i < 300; i++) {   // 육상 화면에서 도시로 — 열린 말은 넘긴다
        if (await page.evaluate(() => G.Game.sceneName === 'city' && !G.Scenes.city.isBusy() && !document.querySelector('.modal-back'))) break;
        await page.keyboard.press('Enter'); await page.waitForTimeout(300);
      }
      await page.waitForTimeout(600);
      // 성문 → 탐험을 떠난다 → 걸어서 → 떠난다 (실제 메뉴 흐름. 말·물음은 첫 단추)
      await page.evaluate(() => { G.Scenes.city.visit('gate'); });
      for (let i = 0; i < 60; i++) {
        await page.waitForTimeout(200);
        const sc = await page.evaluate(() => G.Game.sceneName);
        if (sc === 'land') break;
        await page.evaluate(() => {
          const b = [...document.querySelectorAll('.modal-back')].pop();
          if (b) { const bt = b.querySelectorAll('.askrow button, .choice, .foot button'); const go = [...bt].find(x => /떠난다|걸어서|출발|확인/.test(x.innerText)) || bt[0]; if (go) go.click(); else b.click(); return; }
          const cmd = [...document.querySelectorAll('.cmdmenu .cmd')].find(x => /탐험을 떠난다/.test(x.innerText)); if (cmd) cmd.click();
        });
        await page.keyboard.press('Enter');
      }
      await page.waitForFunction(() => G.Game.sceneName === 'land', null, { timeout: 90000 });
      await page.waitForTimeout(1500);
      for (let i = 0; i < 20; i++) { const busy = await page.evaluate(() => !!document.querySelector('.modal-back')); if (!busy) break; await page.keyboard.press('Enter'); await page.waitForTimeout(200); }
      const r = await page.evaluate(id => {
        const s = G.Game.state, l = s.loc, L = G.Scenes.land, st = L.runtime(), c = G.CITY_DATA[id];
        const start = [l.lon, l.lat], onLand = G.Geo.isLand(l.lon, l.lat);
        // 여덟 방향으로 걸어 본다 (방향키로 걷는 것과 같은 st.dir)
        let moved = 0, maxD = 0;
        for (let a = 0; a < 8; a++) {
          l.lon = start[0]; l.lat = start[1];
          st.dir = [Math.cos(a / 8 * 6.283), Math.sin(a / 8 * 6.283)]; st.paused = false; st.path = null; st.busy = 0;
          for (let k = 0; k < 40 && st.dir; k++) L.update(0.05);
          const d = G.Geo.dist(l.lon, l.lat, start[0], start[1]); maxD = Math.max(maxD, d); if (d > 0.01) moved++;
        }
        st.dir = null; st.paused = true; l.lon = start[0]; l.lat = start[1];
        return { name: c.name, onLand, gap: G.Geo.dist(start[0], start[1], c.lon, c.lat), moved, maxD };
      }, id);
            ok(r.onLand && r.moved >= 3, r.name + ' 성문으로 나섬 → 뭍에서 출발(도시에서 ' + r.gap.toFixed(2) + '°) · 여덟 방향 중 ' + r.moved + '방향으로 걸어짐 (최대 ' + r.maxD.toFixed(2) + '°)');
      // 도시로 돌아온다 (다음 도시를 위해)
      await page.evaluate(() => { G.Game.state.loc = { mode: 'city', city: 0, lon: G.CITY_DATA[0].lon, lat: G.CITY_DATA[0].lat }; });
    }
    // ③ 탐험대로 돌아간다(resumeFrom) · 물 위에 선 옛 저장 파일 — 앞에서 열린 말·창(걷는 동안의 사건)은 먼저 닫는다
    for (let i = 0; i < 60; i++) { if (!(await page.evaluate(() => G.UI.busy() || !!document.querySelector('.modal-back')))) break; await page.evaluate(() => { const b = [...document.querySelectorAll('.modal-back')].pop(); if (b) { const bt = b.querySelectorAll('.askrow button, .foot button'); if (bt.length) bt[bt.length - 1].click(); } }); await page.keyboard.press('Enter'); await page.waitForTimeout(250); }
    const rs = await page.evaluate(async () => {
      const s = G.Game.state, b = G.CITY_DATA[46];
      s.landReturn = { base: { type: 'city', city: 46, lon: b.lon, lat: b.lat }, party: 20, days: 3, mount: { id: 'walk', n: 0 } };
      G.Game.go('land', { resumeFrom: 46, mount: { id: 'walk', n: 0 } });
      await new Promise(r => setTimeout(r, 800));
      const a = G.Geo.isLand(s.loc.lon, s.loc.lat);
      // 옛 저장 파일: 물 위(브레멘 자리)에 서 있다가 걸으려 하면 먼저 뭍으로
      s.loc.lon = b.lon; s.loc.lat = b.lat; const st = G.Scenes.land.runtime(); st.dir = [1, 0]; st.paused = false; st.busy = 0;
      for (let k = 0; k < 30; k++) G.Scenes.land.update(0.05);
      const bb = G.Geo.isLand(s.loc.lon, s.loc.lat) && G.Geo.dist(s.loc.lon, s.loc.lat, b.lon, b.lat) > 0.01;
      const dbg = { busy: G.UI.busy(), scene: G.Game.sceneName, mode: s.loc.mode, lon: s.loc.lon, lat: s.loc.lat, dir: st.dir, alive: st.alive };
      st.dir = null; st.paused = true;
      return { a, bb, dbg };
    });
    ok(rs.a, '브레멘 성문 「탐험대로 돌아간다」 — 뭍에서 다시 나섬');
    ok(rs.bb, '물 위에 선 채 저장된 탐험도 걸으면 뭍으로 올라서 움직임' + (rs.bb ? '' : ' ' + JSON.stringify(rs.dbg)));
    await page.waitForTimeout(400);
    ok(!errors.length, '콘솔 오류 없음 ' + errors.slice(0, 4).join(' | '));
    console.log('    스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.slice(0, 5).join('\n')); process.exitCode = 1; }
  await browser.close();
})();
