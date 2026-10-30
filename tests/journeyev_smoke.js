/* 하늘과 날씨의 드문 사건 (2026-10-29) — 별똥별·은하수·일식·월식·혹서·혹한·용오름·쓰나미·메뚜기떼 · 오아시스 그림 · 얼마나 드문가
   node tests/journeyev_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || '';
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
      const JE = G.JourneyEv, out = {}, said = [], toasts = [];
      G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      G.UI.toast = (t) => { toasts.push(t); };
      let vclock = 0; G.Pace.clock = () => vclock; G.Pace.reset();
      function fresh(lon, lat, m, sk) {
        const s0 = {}; G.SKILLS.forEach(x => { s0[x.id] = 0; }); Object.assign(s0, sk || {});
        G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: s0, lg: [3, 3], diff: 'normal' });
        const s = G.Game.state; s.mates = []; s.date = { y: 1520, m: m || 7, d: 1 }; s.loc = { mode: 'sea', lon, lat }; s.fleet.fatigue = 30; s.fleet.discipline = 60; s.fleet.water = 100; s.player.gold = 5000; s.player.luck = 50;
        said.length = 0; toasts.length = 0; G.Pace.reset(); delete s.journeyEv; return s;
      }
      // ---- 사건마다 결과
      let s = fresh(-40, 20, 7); await JE.run('shooting_star', 'sea'); out.star = { dis: s.fleet.discipline, fat: s.fleet.fatigue, luck: s.player.luck };
      s = fresh(-40, 20, 7, { nav: 2 }); await JE.run('milky_way', 'sea'); out.milky = { fat: s.fleet.fatigue, nav: said.some(t => /별자리로/.test(t)) };
      s = fresh(-40, 20, 7); await JE.run('solar_eclipse', 'sea'); out.solarNo = { dis: s.fleet.discipline };
      s = fresh(-40, 20, 7, { sci: 1 }); const ex0 = s.player.fame && s.player.fame.ex || 0; await JE.run('solar_eclipse', 'sea'); out.solarSci = { dis: s.fleet.discipline, rec: said.some(t => /기록/.test(t)) };
      s = fresh(-40, 20, 7); await JE.run('lunar_eclipse', 'sea'); out.lunarNo = { dis: s.fleet.discipline };
      s = fresh(-40, 20, 7, { sci: 2 }); await JE.run('lunar_eclipse', 'sea'); out.lunarSci = { dis: s.fleet.discipline, lon: said.some(t => /경도|서쪽인지/.test(t)) };
      s = fresh(-40, 15, 7); await JE.run('extreme_heat', 'sea'); out.heat = { water: s.fleet.water, fat: s.fleet.fatigue };
      s = fresh(-40, 15, 7, { ops: 3 }); await JE.run('extreme_heat', 'sea'); out.heatOps = { water: s.fleet.water, fat: s.fleet.fatigue };
      s = fresh(-20, 60, 1); const c0 = s.fleet.crew; await JE.run('extreme_cold', 'sea'); out.cold = { lost: c0 - s.fleet.crew, fat: s.fleet.fatigue };
      s = fresh(-20, 60, 1, { med: 1 }); const c1 = s.fleet.crew; await JE.run('extreme_cold', 'sea'); out.coldMed = { lost: c1 - s.fleet.crew };
      s = fresh(-60, 20, 7); const hp0 = s.fleet.ships.map(x => x.hp); await JE.run('waterspout', 'sea'); out.spout = { dmg: hp0.reduce((a, h, i) => a + h - s.fleet.ships[i].hp, 0), max: s.fleet.ships[0].maxHp, alive: s.fleet.ships.every(x => x.hp >= 1) };
      s = fresh(-60, 20, 7, { nav: 3 }); const hp1 = s.fleet.ships.map(x => x.hp); await JE.run('waterspout', 'sea'); out.spoutNav = hp1.every((h, i) => h === s.fleet.ships[i].hp);
      s = fresh(140, 35, 7); const ships = s.fleet.ships.length; await JE.run('tsunami', 'sea'); out.tsu = { fat: s.fleet.fatigue, ships: s.fleet.ships.length === ships };
      s = fresh(20, 15, 7); s.loc = { mode: 'land', lon: 20, lat: 15, party: 30 }; await JE.run('locust_swarm', 'land', 'desert', { dailyCost: () => 100 }); out.locust = { gold: s.player.gold, fat: s.fleet.fatigue };
      // ---- 조건: 사건이 맞는 곳에서만
      const elig = (lon, lat, m, where, terr) => { fresh(lon, lat, m); return JE.eligible(where, terr).map(e => e[0]); };
      out.e = {
        tropicsSummer: elig(-40, 15, 7, 'sea'), northWinter: elig(-20, 60, 1, 'sea'), japanCoastFar: elig(146, 31, 7, 'sea'),
        saharaLand: elig(10, 22, 7, 'land', 'desert'), franceLand: elig(2, 47, 4, 'land', 'forest'), siberia: elig(100, 65, 7, 'land', 'tundra')
      };
      // 같은 사건은 쉬는 날이 지나야 · 이 사건들끼리는 20일
      s = fresh(-40, 15, 7); await JE.run('shooting_star', 'sea'); vclock += 1e9;
      out.coolStar = !JE.eligible('sea').some(e => e[0] === 'shooting_star');
      G.BALANCE.journeyEv.seaShare = 1; out.gapBlock = JE.roll('sea') === null; s.day += 21; out.afterGap = JE.roll('sea') !== null; G.BALANCE.journeyEv.seaShare = 0.15;
      // ---- 얼마나 드문가: 바다 위의 날 30000일 (바다의 우연한 사건 하루 7% · 앞 사건에서 나흘 — js/scenes/sea.js · explore.js 그대로)
      const spots = [[-40, 20], [-30, 45], [60, -20], [140, 30], [-20, 60], [110, 5], [-70, 15], [5, 0]];
      let days = 0, evs = 0, seaEv = 0; const per = {}; let lastEvt = -99;
      s = fresh(-40, 20, 7); s.journeyEv = { last: {} };
      for (let i = 0; i < 30000; i++) {
        s.day++; vclock += 1300; s.date = G.U.addDays(s.date, 1);
        const p = spots[Math.floor(i / 50) % spots.length]; s.loc.lon = p[0]; s.loc.lat = p[1]; days++;
        if (Math.random() < 0.07 && s.day - lastEvt >= 4) {
          seaEv++; const id = JE.roll('sea');
          lastEvt = s.day;
          if (id) { evs++; per[id] = (per[id] || 0) + 1; s.journeyEv.any = s.day; s.journeyEv.last[id] = s.day; G.Pace.mark('je:' + id); }
        }
      }
      out.sim = { days, evs, every: Math.round(days / Math.max(1, evs)), seaEv, per };
      // 뭍: 탐험하는 날 10000일 (뭍의 우연한 만남 하루 10%)
      let ldays = 0, levs = 0; const lper = {};
      s = fresh(20, 15, 7); s.journeyEv = { last: {} };
      const lspots = [[10, 22, 'desert'], [40, 25, 'desert'], [75, 25, 'grass'], [2, 47, 'forest'], [100, 65, 'tundra'], [-60, -10, 'jungle']];
      for (let i = 0; i < 10000; i++) {
        s.day++; vclock += 1300; s.date = G.U.addDays(s.date, 1); const p = lspots[Math.floor(i / 30) % lspots.length]; s.loc = { mode: 'land', lon: p[0], lat: p[1] }; ldays++;
        if (Math.random() < 0.1) { const id = JE.roll('land', p[2]); if (id) { levs++; lper[id] = (lper[id] || 0) + 1; s.journeyEv.any = s.day; s.journeyEv.last[id] = s.day; G.Pace.mark('je:' + id); } }
      }
      out.lsim = { days: ldays, evs: levs, every: Math.round(ldays / Math.max(1, levs)), per: lper };
      // 실제 바다 사건 자리에서 (explore.js X.seaEvent를 감쌌다)
      s = fresh(-40, 15, 7); G.BALANCE.journeyEv.seaShare = 1; G.BALANCE.journeyEv.seaDaily = 1; const st = { lastEvt: null };
      const got = await JE.seaDay({ st, refresh: () => {} }); out.hook = { got, mem: Object.keys(s.journeyEv.last), lastEvt: st.lastEvt === s.day };
      const st2 = { lastEvt: s.day - 2 }; out.hook.gap4 = (s.journeyEv = { last: {} }, await JE.seaDay({ st: st2 })) === false;
      G.BALANCE.journeyEv.seaShare = 0.15; G.BALANCE.journeyEv.seaDaily = 0.07;
      out.sheets = Object.keys(JE.SHEETS).every(id => G.Img.has('effects/events/exploration-20261029/' + id));
      return out;
    });
    console.log('   ' + JSON.stringify(r));
    ok(r.star.dis === 64 && r.star.fat === 26 && r.star.luck === 51, '별똥별: 규율 +4 · 피로 −4 · 행운 +1');
    ok(r.milky.fat === 22 && r.milky.nav, '은하수: 피로 −8 · 항해술이 있으면 별자리로 다시 잰다');
    ok(r.solarNo.dis === 48 && r.solarSci.dis === 60 && r.solarSci.rec, '일식: 아무도 모르면 규율 −12, 과학을 아는 사람이 있으면 기록하고 탐험 명성');
    ok(r.lunarNo.dis === 54 && r.lunarSci.dis === 60 && r.lunarSci.lon, '월식: 규율 −6 / 과학이 있으면 월식 시각으로 경도를 잰다');
    ok(r.heat.water < 100 && r.heat.fat === 38 && r.heatOps.fat < r.heat.fat && r.heatOps.water >= r.heat.water - 1, '혹서기: 물이 줄고 피로 +8 — 운용술이 덜어 준다');
    ok(r.cold.fat === 38 && r.cold.lost <= 2 && r.coldMed.lost === 0, '혹한기: 피로 +8 · 앓아 눕는 선원 0~2 — 의학이 있으면 없다');
    ok(r.spout.dmg > 0 && r.spout.dmg <= r.spout.max * 0.12 + 1 && r.spout.alive && r.spoutNav, '용오름: 배 한 척 내구력 5~12% (가라앉지 않는다) — 항해술 3이면 피한다');
    ok(r.tsu.fat === 34 && r.tsu.ships, '쓰나미: 먼바다라 너울만 — 피로 +4');
    ok(r.locust.gold < 5000 && r.locust.gold >= 4800 && r.locust.fat === 36, '메뚜기떼: 갉아먹힌 식량을 다시 산다 · 피로 +6');
    const E = r.e;
    ok(E.tropicsSummer.includes('extreme_heat') && E.tropicsSummer.includes('waterspout') && !E.tropicsSummer.includes('extreme_cold') && !E.tropicsSummer.includes('locust_swarm'), '열대 여름 바다: 혹서·용오름 (혹한·메뚜기 없음) — ' + E.tropicsSummer.join(','));
    ok(E.northWinter.includes('extreme_cold') && !E.northWinter.includes('extreme_heat') && !E.northWinter.includes('waterspout'), '북쪽 겨울 바다: 혹한 — ' + E.northWinter.join(','));
    ok(E.japanCoastFar.includes('tsunami'), '지진이 잦은 바다(일본 먼바다)에서만 쓰나미 — ' + E.japanCoastFar.join(','));
    ok(E.saharaLand.includes('locust_swarm') && E.saharaLand.includes('extreme_heat') && !E.franceLand.includes('locust_swarm') && E.siberia.includes('extreme_cold'), '사하라: 메뚜기떼·혹서 · 프랑스 숲: 메뚜기 없음 · 시베리아: 혹한');
    ok(r.coolStar && r.gapBlock && r.afterGap, '같은 사건은 쉬는 날이 지나야, 이 사건들끼리도 20일은 쉰다');
    ok(r.sim.every >= 70 && r.sim.every <= 220, '얼마나 드문가 — 바다 ' + r.sim.days + '일에 ' + r.sim.evs + '번 (약 ' + r.sim.every + '일에 한 번) ' + JSON.stringify(r.sim.per));
    ok((r.sim.per.solar_eclipse || 0) <= 12 && (r.sim.per.tsunami || 0) <= 6, '일식·쓰나미는 아주 드물다 (30000일에 일식 ' + (r.sim.per.solar_eclipse || 0) + ' · 쓰나미 ' + (r.sim.per.tsunami || 0) + ')');
    ok(r.lsim.every >= 40 && r.lsim.every <= 150, '뭍 ' + r.lsim.days + '일에 ' + r.lsim.evs + '번 (약 ' + r.lsim.every + '일에 한 번) ' + JSON.stringify(r.lsim.per));
    ok(r.hook.got === true && r.hook.mem.length === 1 && r.hook.lastEvt && r.hook.gap4, '바다의 하루(sea.js)에서 일어나고, 바다의 우연한 사건과 나흘 간격을 함께 쓴다');
    ok(r.sheets, '그림 10장이 모두 그림 목록에 있다');
    // 그림: 실제 화면에 띄워 본다
    const shots = await page.evaluate(async () => {
      const res = {};
      for (const id of Object.keys(G.JourneyEv.SHEETS)) {
        const h = G.JourneyEv.show(id);
        let n = 0; while (!(h.box && h.box.classList.contains('on')) && n++ < 100) await new Promise(r => setTimeout(r, 50));
        await new Promise(r => setTimeout(r, 400));
        const cv = h.canvas, px = cv ? cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data : [];
        let a = 0; for (let i = 3; i < px.length; i += 16) if (px[i] > 8) a++;
        res[id] = a;
        if (id === 'locust_swarm') { window.__keep = h; continue; }
        await h.stop();
      }
      return res;
    });
    if (OUT) await page.screenshot({ path: path.join(OUT, 'journeyev_locust.png') });
    ok(Object.values(shots).every(v => v > 50), '그림 10장이 실제로 그려진다 ' + JSON.stringify(shots));
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
