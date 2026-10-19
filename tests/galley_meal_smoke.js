/* 요리실의 차림: 요리 특기자의 말(모국어)에 맞는 고장 음식 → 바다에서 피로↓ 규율↑, 식당이 있으면 효과↑ (js/systems/cabins.js CB.galleyMeal)
   node tests/galley_meal_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo(); G.Nav.init();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, CB = G.Cabins, out = {};
      const big = Object.keys(G.SHIP).map(id => ({ id, n: CB.slots({ type: id }) })).sort((a, b) => b.n - a.n)[0];
      s.fleet.ships[0].type = big.id; s.fleet.ships[0].cabins = null; s.fleet.cabinUid = null;
      CB.remodel(1, 'galley'); CB.remodel(2, 'hold');
      const put = (id, i) => { if (!s.mates.some(m => m.id === id)) s.mates.push({ id, role: 'none', loyal: 90 }); CB.place(s.mates.filter(m => m.id === id)[0], i); return s.mates.filter(m => m.id === id)[0]; };
      out.empty = CB.galleyMeal();
      // 요리 특기자를 찾는다: 이베리아 말(0·1)·로망스 말(2)·동아시아·중국 말 사람 하나씩
      const cooks = G.MATES.filter(d => d.sk && d.sk.cook >= 2 && d.lg);
      const byLang = (li) => cooks.find(d => { const ks = Object.keys(d.lg); let b = null, lv = 0; ks.forEach(k => { if (d.lg[k] > lv) { lv = d.lg[k]; b = +k; } }); return b === li; });
      const picks = [0, 2, 7, 14, 13, 5, 8].map(byLang).filter(Boolean);
      out.zones = picks.map(d => { s.mates = s.mates.filter(m => m.room !== 1); const m = put(d.id, 1); const gm = CB.galleyMeal(); return gm ? [d.name, gm.zone, gm.dish.name, gm.dish.tier, gm.lv] : [d.name, null]; });
      // 효과: 식당 없음 / 빈 식당 / 사람 있는 식당
      const one = picks[0]; s.mates = s.mates.filter(m => m.room !== 1); put(one.id, 1);
      const g0 = CB.galleyMeal();
      CB.remodel(2, 'mess'); const g1 = CB.galleyMeal();
      const speaker = G.MATES.find(d => d.sk && d.sk.speech >= 2 && !s.mates.some(m => m.id === d.id)); put(speaker.id, 2); const g2 = CB.galleyMeal();
      if (G.CabinView && G.CabinView._totals) { const t = G.CabinView._totals(); const row = t.fx.find(x => x.k === 'meal'); out.panel = row && [row.text, row.rooms]; }
      out.fx = [g0, g1, g2].map(g => ({ fat: +g.fat.toFixed(3), disc: +g.disc.toFixed(3), mult: +g.mult.toFixed(2), mess: g.mess, home: g.home }));
      // 요리 단계가 높을수록 값비싼(등급 높은) 음식
      const cm = s.mates.find(m => m.id === one.id); s.fleet.cargo = {};
      cm.sk = Object.assign({}, cm.sk || {}, { cook: 1 }); const lv1 = CB.galleyMeal();
      cm.sk.cook = 3; const lv3 = CB.galleyMeal();
      out.level = [[lv1.dish.name, lv1.dish.tier, +lv1.fat.toFixed(3)], [lv3.dish.name, lv3.dish.tier, +lv3.fat.toFixed(3)]];
      // 풍미: 후추·밀이 짐칸에 있으면
      s.fleet.cargo.pepper = { q: 5, cost: 100, d: s.day }; const fp = CB.galleyMeal();
      s.fleet.cargo.wheat = { q: 5, cost: 10, d: s.day }; const fpw = CB.galleyMeal();
      CB.galleyUse(fpw);
      out.flavor = { base: +lv3.fat.toFixed(3), pepper: [+fp.flavor.toFixed(2), +fp.fat.toFixed(3), fp.flavorText], both: [+fpw.flavor.toFixed(2), +fpw.fat.toFixed(3), fpw.flavorText], left: [s.fleet.cargo.pepper.q, s.fleet.cargo.wheat.q] };
      delete cm.sk.cook; s.fleet.cargo = { pepper: { q: 5, cost: 100, d: s.day } };
      // 차림은 7일마다 바뀐다
      const seen = new Set(); const d0 = s.day; for (let k = 0; k < 8; k++) { s.day = d0 + k * 7; seen.add(CB.galleyMeal().dish.id); } s.day = d0; out.rotate = seen.size;
      // 바다의 하루: 알림 · 피로가 덜 쌓인다
      G.SEA_RISK.pirate = 0; G.SEA_RISK.storm = 0; G.Explore.sense = () => []; G.Disc.checkSea = () => [];
      G.Game.go('sea', { depart: 0 }); const SEA = G.Scenes.sea, st = SEA.runtime();
      const news = []; const t0 = G.UI.toast; G.UI.toast = (t) => news.push(String(t));
      G.UI.say = async () => {}; G.UI.ask = async () => null; G.UI.choose = async () => null; G.UI.alert = async () => true; G.UI.confirm = async () => false;
      G.UI.window = () => ({ result: Promise.resolve(null), close() {} }); if (G.SeaNews) G.SeaNews.show = (m) => { (m || []).forEach(x => news.push(x.text)); };
      if (G.Pace) G.Pace.ok = () => false; if (G.FamEv) G.FamEv.atSea = async () => false; if (G.Romance) G.Romance.seaDay = async () => false; if (G.Disaster) G.Disaster.sea = async () => {};
      const race = (p) => Promise.race([p, new Promise(r => setTimeout(() => r('timeout'), 4000))]);
      const fat = async (on) => { if (!on) s.mates = s.mates.filter(m => m.room !== 1); else put(one.id, 1); st.galleyDish = null; s.fleet.fatigue = 30; s.fleet.discipline = 60; let f = 0, dsc = 0; for (let k = 0; k < 6; k++) { const a = s.fleet.fatigue, b = s.fleet.discipline; try { const v = await race(SEA.runDay()); if (v === 'timeout') out.err = 'runDay timeout'; } catch (e) { out.err = String(e); } f += s.fleet.fatigue - a; dsc += s.fleet.discipline - b; s.fleet.fatigue = 30; s.fleet.discipline = 60; } return [f / 6, dsc / 6]; };
      out.on = await fat(true); out.off = await fat(false);
      G.UI.toast = t0;
      out.dishSet = st.galleyDish; out.news = news.filter(t => /요리실/.test(t)).slice(0, 2);
      // 선실 화면 글
      out.cookName = G.MATE[one.id].name;
      return out;
    });
    console.log('   ' + JSON.stringify(r).slice(0, 1400));
    ok(r.empty === null, '요리실이 비었으면 차림 없음');
    ok(r.zones.length >= 4 && r.zones.every(z => z[1]), '요리사의 말에 맞는 고장 음식: ' + r.zones.map(z => z[0] + '→' + z[1] + ' 「' + z[2] + '」').join(' · '));
    ok(r.zones.every(z => z[3] <= Math.max(1, Math.min(3, z[4]))), '요리 단계까지의 음식만 차린다');
    ok(r.fx[1].fat > r.fx[0].fat && r.fx[2].fat > r.fx[1].fat && r.fx[1].mess && r.fx[2].mult > r.fx[1].mult, '식당이 있으면 효과가 오르고 식당에 사람이 있으면 더 (×' + r.fx.map(x => x.mult).join(' → ×') + ', 피로 −' + r.fx.map(x => x.fat).join(' / −') + ')');
    ok(r.panel && /「/.test(r.panel[0]) && /식당 ×/.test(r.panel[1]), '선실 화면 「함대에 적용되는 능력」에 차림 줄: ' + (r.panel || []).join(' — '));
    ok(r.level[1][1] > r.level[0][1] && r.level[1][2] > r.level[0][2], '요리 단계가 높을수록 값비싼 음식: 요리 1 「' + r.level[0][0] + '」(' + r.level[0][1] + '등급, 피로 −' + r.level[0][2] + ') → 요리 3 「' + r.level[1][0] + '」(' + r.level[1][1] + '등급, 피로 −' + r.level[1][2] + ')');
    ok(r.flavor.pepper[0] === 1.25 && r.flavor.both[0] === 1.35 && r.flavor.both[1] > r.flavor.pepper[1] && r.flavor.pepper[1] > r.flavor.base && r.flavor.left.join() === '4,4', '풍미: 후추 ×1.25, 후추·밀 ×1.35 (피로 −' + r.flavor.base + ' → −' + r.flavor.pepper[1] + ' → −' + r.flavor.both[1] + ') · 차림이 바뀔 때 1통씩 씀');
    ok(r.rotate >= 2, '차림이 7일마다 바뀐다 (8주에 ' + r.rotate + '가지)');
    ok(!r.err && r.on[0] < r.off[0] && r.on[1] > r.off[1], '바다의 하루: 요리사가 있으면 피로가 덜 쌓이고(' + r.on[0].toFixed(2) + ' < ' + r.off[0].toFixed(2) + ') 규율이 더 오른다(' + r.on[1].toFixed(2) + ' > ' + r.off[1].toFixed(2) + ')');
    ok(r.news && r.news.length >= 1 && /후추/.test(r.news[0]), '차림이 바뀌면 알린다: ' + (r.news || [])[0]);
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
