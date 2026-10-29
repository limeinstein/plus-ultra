/* 도시의 신기루 (2026-10-29 사용자 요청) — 1485년까지는 나오지 않고, 그 뒤로는 입항할 때 10% 확률로 나온다
   node tests/city_mirage_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function ok(v, msg) { console.log((v ? '  ✓ ' : '  ✗ ') + msg); if (!v) fail++; }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const D = G.Disc, out = {};
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: [3, 3, 3], diff: 'normal' });
      const s = G.Game.state;
      // 도시 안 미래의 건물 가운데 mirageFrom이 없는 것 (1480년부터 보이던 것)
      const all = G.DISCOVERIES.filter(d => D.isBuilding(d) && D.isFuture(d));
      const early = all.filter(d => !d.mirageFrom && !d.openY && !d.alwaysMirage);
      out.count = all.length; out.early = early.length;
      const d = early[0] || all[0], city = d.city;
      out.d = d.id + '@' + G.CITY_DATA[city].name;
      s.loc = { mode: 'city', city, lon: G.CITY_DATA[city].lon, lat: G.CITY_DATA[city].lat };
      // 1485년: 소문·단서(built)도, 거리·메뉴(cityBuildings)에도 없다 — 입항을 백 번 해도
      s.date = { y: 1485, m: 12, d: 31 }; let seen85 = 0;
      for (let i = 0; i < 100; i++) { s.portVisit = (s.portVisit || 0) + 1; if (D.cityBuildings(city).includes(d)) seen85++; }
      out.y85 = { built: D.built(d), seen: seen85 };
      // 1486년부터: 입항마다 10% 안팎
      s.date = { y: 1490, m: 1, d: 1 }; let seen = 0; const N = 3000;
      for (let i = 0; i < N; i++) { s.portVisit++; if (D.cityBuildings(city).includes(d)) seen++; }
      out.rate = seen / N; out.built90 = D.built(d);
      // 한 입항 안에서는 같은 결과 (몇 번을 물어도 · 이어하기도)
      let same = true;
      for (let i = 0; i < 50; i++) { s.portVisit++; const a = D.inTown(d); for (let k = 0; k < 5; k++) if (D.inTown(d) !== a) same = false; }
      out.same = same;
      // 떴을 때는 눌러서 찾을 수 있다(inTown) · 안 떴을 때는 못 찾는다
      s.mirageVisit = { v: s.portVisit, c: { [city]: 1 } }; out.shownOk = D.inTown(d) && D.cityBuildings(city).includes(d);
      s.mirageVisit = { v: s.portVisit, c: { [city]: 0 } }; out.hiddenOk = !D.inTown(d) && !D.cityBuildings(city).includes(d);
      // 신기루가 아닌 도시 건물(이미 세워진 것)은 늘 있다
      const real = G.DISCOVERIES.find(x => D.isBuilding(x) && !D.isFuture(x) && (!x.built || x.built <= 1490) && !x.openY && !x.mirageFrom && D.needMet(x));
      out.real = real ? (s.loc.city = real.city, s.mirageVisit = { v: s.portVisit, c: { [real.city]: 0 } }, D.cityBuildings(real.city).includes(real)) : 'none';
      // 1610년부터 나오는 신기루 50은 그대로 (1609년엔 없음)
      const m50 = all.find(x => x.mirageFrom === 1610);
      if (m50) { s.date = { y: 1609, m: 6, d: 1 }; out.m50a = D.built(m50); s.date = { y: 1611, m: 1, d: 1 }; out.m50b = D.built(m50); }
      out.cfg = [G.BALANCE.mirage.cityFrom, G.BALANCE.mirage.cityChance];
      return out;
    });
    console.log('   ' + JSON.stringify(r));
    ok(r.count > 0 && r.early > 0, '도시의 신기루 건물 ' + r.count + '개 (그 가운데 예전엔 1480년부터 보이던 것 ' + r.early + '개) — 예: ' + r.d);
    ok(r.y85.built === false && r.y85.seen === 0, '1485년까지는 입항을 백 번 해도 나오지 않는다 (소문·단서도)');
    ok(r.built90 && r.rate > 0.08 && r.rate < 0.12, '1486년부터는 입항할 때 10% 확률 — 3000번 입항에 ' + (r.rate * 100).toFixed(1) + '%');
    ok(r.same, '한 번 입항한 동안에는 결과가 바뀌지 않는다');
    ok(r.shownOk && r.hiddenOk, '떴을 때만 메뉴·거리에 서고 눌러서 찾을 수 있다');
    ok(r.real === true || r.real === 'none', '신기루가 아닌 도시 건물은 늘 그대로 있다');
    ok(r.m50a === false && r.m50b === true, '1610년부터 나오는 신기루 50은 그대로');
    ok(r.cfg[0] === 1486 && r.cfg[1] === 0.1, '조정값 G.BALANCE.mirage.cityFrom 1486 · cityChance 0.1');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
