/* ① 발견물 떼어 놓기 ② 장치(퍼즐) 빈도 ③ 돌 입방체 화면 점검.
   node tests/pz_spread_cube_smoke.js  (playwright, 스크린샷은 OUT 폴더) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const GAME = pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href;
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'pz_spread_cube_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text() + ' ' + ((m.location() || {}).url || ''))) errors.push('console: ' + m.text()); });
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Game.geoReady, null, { timeout: 90000 });

    // ① 떼어 놓기
    const r = await page.evaluate(() => {
      const P = G.Disc.SPREAD, L = G.DISCOVERIES.filter(d => d.how === 'land' || d.how === 'sea');
      let close = [], maxMove = 0, wrong = 0, cityNear = 0;
      for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { const dd = G.Geo.dist(L[i].lon, L[i].lat, L[j].lon, L[j].lat); if (dd < P.min - 0.01) close.push(L[i].id + '~' + L[j].id + ' ' + dd.toFixed(2)); }
      L.forEach(d => { maxMove = Math.max(maxMove, G.Geo.dist(d.lon, d.lat, d.lon0, d.lat0)); if (G.Geo.isLand(d.lon, d.lat) !== d._land) wrong++;
        G.CITY_DATA.forEach(c => { if (G.Geo.dist(d.lon, d.lat, c.lon, c.lat) < P.city - 0.01) cityNear++; }); });
      const moved = L.filter(d => d.lat !== d.lat0 || d.lon !== d.lon0);
      const k = G.DISC.kings, t = G.DISC.tutankh, m = G.DISC.mycenae, a = G.DISC.agamemnon;
      return { n: L.length, moved: moved.length, close, maxMove, wrong, cityNear, kt: G.Geo.dist(k.lon, k.lat, t.lon, t.lat), ma: G.Geo.dist(m.lon, m.lat, a.lon, a.lat), kingsMove: G.Geo.dist(k.lon, k.lat, k.lon0, k.lat0),
        mv: (f) => 0, ruinAvg: avg(moved.filter(d => d.cat === 'ruin' || d.cat === 'nature')), otherAvg: avg(moved.filter(d => !(d.cat === 'ruin' || d.cat === 'nature' || d.cat === 'geo'))) };
      function avg(l) { return l.length ? l.reduce((a, d) => a + G.Geo.dist(d.lon, d.lat, d.lon0, d.lat0), 0) / l.length : 0; }
    });
    console.log('  옮긴 발견물 ' + r.moved + '/' + r.n + ', 가장 멀리 ' + r.maxMove.toFixed(2) + '°, 아직 붙은 쌍 ' + r.close.length + (r.close.length ? ' (' + r.close.slice(0, 8).join(', ') + ')' : '') + ', 도시와 붙은 것 ' + r.cityNear);
    ok(r.close.length <= 3, '뭍·바다 발견물이 거의 모두 ' + 0.34 + '° 이상 떨어짐');
    ok(r.wrong === 0, '뭍의 것은 뭍에, 바다의 것은 바다에');
    ok(r.maxMove <= 0.61, '처음 자리에서 0.6° 안');
    ok(r.kt > 0.33 && r.ma > 0.33, '왕가의 계곡↔소년왕의 비보 ' + r.kt.toFixed(2) + '°, 미케네↔아가멤논의 가면 ' + r.ma.toFixed(2) + '°');
    ok(r.ruinAvg <= r.otherAvg + 0.005, '유적·자연은 덜 움직임 (평균 ' + r.ruinAvg.toFixed(2) + '° < 보물·동물 ' + r.otherAvg.toFixed(2) + '°)');

    // ② 장치 빈도
    const p = await page.evaluate(() => {
      const M = G.Games.puzzleMap(), ids = Object.keys(M), by = {};
      ids.forEach(id => { by[M[id]] = (by[M[id]] || 0) + 1; });
      const tre = G.DISCOVERIES.filter(d => d.how === 'land' && d.cat === 'treasure').length, ru = G.DISCOVERIES.filter(d => d.how === 'land' && d.cat === 'ruin').length;
      const old = G.DISCOVERIES.filter(d => d.how === 'land' && (d.cat === 'treasure' || G.Games.PUZZLE_FIX[d.id] || (d.cat === 'ruin' && (Math.abs(G.U.strHash('lock:' + d.id)) % 1000) / 1000 < 0.5))).length;
      return { old, n: ids.length, by, tre, ru, fix: Object.keys(G.Games.PUZZLE_FIX).every(id => { const d = G.DISC[id]; return !d || d.how !== 'land' || !(d.cat === 'treasure' || d.cat === 'ruin') || M[id]; }) };
    });
    console.log('  잠긴 곳 ' + p.n + ' (뭍의 보물 ' + p.tre + '·유적 ' + p.ru + ') ' + JSON.stringify(p.by));
    ok(p.n <= p.old * 0.5 && p.n >= 20, '장치로 잠긴 곳 ' + p.n + '곳 (예전 ' + p.old + '곳)');
    ok(p.fix, '이름난 곳(기자·크노소스·진시황릉…)은 그대로 잠김');
    const rest = await page.evaluate(() => {
      G.Game.state = G.State.newGame ? G.Game.state : G.Game.state;
      const s = G.Game.state || (G.Game.state = { day: 100, flags: {} });
      const lockedId = Object.keys(G.Games.puzzleMap()).find(id => !G.Games.PUZZLE_FIX[id]);
      const d = G.DISC[lockedId];
      s.day = 100; delete s.pzDay;
      const a = G.Games.puzzleDue(d);
      s.pzDay = 90; const b = G.Games.puzzleDue(d), c = G.Games.puzzleDue(G.DISC.giza);
      s.day = 125; const e = G.Games.puzzleDue(d);
      delete s.pzDay;
      return { a, b, c, e };
    });
    ok(rest.a && rest.a !== 'rest' && rest.b === 'rest' && rest.c === 'sphinx' && rest.e === rest.a, '장치를 만난 뒤 30일 안에는 부서져 있음 (이름난 곳은 그대로) ' + JSON.stringify(rest));

    // ③ 돌 입방체 ★3 (인장 있음)
    for (const lv of [1, 3]) {
      await page.evaluate((lv) => { window.__pz = G.Games.pz.cube({ id: 'test', name: '시험' }, lv).then(v => (window.__pzr = v)); }, lv);
      await page.waitForSelector('.cboard .c3', { timeout: 10000 });
      await page.waitForTimeout(400);
      const st = await page.evaluate(() => ({ cans: document.querySelectorAll('.cboard .cl.can').length, pv: [...document.querySelectorAll('.cboard .pv')].map(e => e.textContent), face: document.querySelector('.cube-side .face').textContent, pads: document.querySelectorAll('.cpads .cpad').length }));
      ok(st.cans >= 1 && st.cans === st.pv.length && st.pads === 4, '★' + lv + ': 굴릴 수 있는 옆 칸 ' + st.cans + '곳에 미리 보기 ' + st.pv.join(' ') + ' · 방향 단추 4');
      await page.screenshot({ path: path.join(OUT, 'cube' + lv + '_0.png') });
      // 미리 보기가 맞는가: 옆 칸 하나를 눌러 굴린 뒤의 면이 그 칸의 표시와 같아야 한다
      const chk = await page.evaluate(() => {
        const MARK = { '☀': '위', '●': '아래(바닥)', '↑': '북쪽', '↓': '남쪽', '→': '동쪽', '←': '서쪽' };
        const c = document.querySelector('.cboard .cl.can'), want = MARK[c.querySelector('.pv').textContent];
        c.click();
        return { want, got: document.querySelector('.cube-side .face').textContent.slice(2), rolled: !!document.querySelector('.cboard .roll.re, .cboard .roll.rw, .cboard .roll.rn, .cboard .roll.rs') };
      });
      ok(chk.want === chk.got, '옆 칸 표시대로 굴러감: ' + chk.want + ' = ' + chk.got + (chk.rolled ? ' (굴러가는 모습)' : ''));
      await page.waitForTimeout(120);
      await page.screenshot({ path: path.join(OUT, 'cube' + lv + '_rolling.png') });
      await page.waitForTimeout(400);
      await page.keyboard.press('ArrowRight'); await page.waitForTimeout(300);
      await page.keyboard.press('ArrowUp'); await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(OUT, 'cube' + lv + '_1.png') });
      const before = await page.evaluate(() => document.querySelector('.cube-side').innerText);
      await page.locator('.win button', { hasText: '한 수 무르기' }).click(); await page.waitForTimeout(300);
      const after = await page.evaluate(() => document.querySelector('.cube-side').innerText);
      ok(before !== after && /한 수 물렀다/.test(await page.evaluate(() => document.querySelector('.pz-stat').innerText)), '한 수 무르기');
      await page.locator('.win button', { hasText: '포기한다' }).click(); await page.waitForTimeout(400);
      ok(await page.evaluate(() => window.__pzr === false), '포기하면 닫힘');
    }
    ok(!errors.length, '콘솔 오류 0 ' + errors.join('\n'));
  } catch (e) {
    console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1;
    await page.screenshot({ path: path.join(OUT, 'fail.png') }).catch(() => {});
  } finally { await browser.close(); }
})();
