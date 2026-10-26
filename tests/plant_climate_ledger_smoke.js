/* 식물 특산물 고친 점 점검 — node tests/plant_climate_ledger_smoke.js   (BROWSER_EXE=크롬 경로)
   · 시세 수첩: 아직 못 찾고 심지도 않은 식물의 교역품은 표에 나오지 않는다 (실제 이름도 새지 않는다) — 찾거나 심으면 나온다
   · 기후: 모든 식물은 제 원산지 위도에서 자라고, 원산 지역의 교역소 한 곳 이상에 심을 수 있다
   · 지중해 항구(나폴리·리스본·베니스·제노바·마르세유·이스탄불)에 레몬·코르크참나무·우산소나무를 심을 수 있다
   · 파란 장미 1통 이익(가장 비싼 곳 값 − 산지 값 0.62배)이 기존 교역품 가운데 가장 남는 것보다 크지 않다
   · 새 일지·불러오기 순간 도시 특산물(c.goods)이 그 일지에 맞는다 · 「…」은/는 조사 · 게임 안 도시 이름(세빌리아·노브고르트)
   · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => window.__noRaf ? 0 : setTimeout(() => raf(cb), 200); });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_FILE/.test(m.text())) errors.push('console: ' + m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.PlantTrade && G.PlantTrade.hooked, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      const out = {}, P = G.PLANTS.map(id => G.DISC[id]);
      await G.Game.ensureGeo();
      const NG = (name, nation) => G.State.newGame({ name: name, nation: nation, job: 'merchant', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      NG('시험', 'PT');
      const s = G.Game.state, R = G.R, PT = G.PlantTrade, L = G.Ledger, UI = G.UI;
      const trade = G.CITY_DATA.filter(c => c && c.goods && R.facilities(c).trade);
      const found = id => { G.Game.state.disc[id] = Object.assign(G.Game.state.disc[id] || {}, { found: true, me: true }); };
      // ---- 5: 시세 수첩
      trade.slice(0, 40).forEach(c => L.record(c));
      const plantRows = () => L.table().filter(x => G.GOOD[x.id].plant).map(x => x.id);
      const realNames = P.map(d => d.realName);
      out.rows0 = L.table().length; out.plant0 = plantRows();
      out.leak0 = L.table().filter(x => realNames.indexOf(x.name) >= 0).map(x => x.name);
      found('mango'); out.plantFound = plantRows();
      found('camphor'); const mal = G.CITY_DATA[160]; out.plantedMal = PT.plant(G.DISC.camphor, mal);
      delete G.Game.state.disc.camphor;            // 찾은 기록이 없어도 심었으면 보인다
      L.record(mal); out.plantPlanted = plantRows();
      // ---- 6: 기후
      out.zone = P.map(d => {
        const self = PT.fits(d, { lat: d.lat });
        const native = trade.filter(c => c.region === d.reg && PT.why(d, c) === null);
        return { id: d.id, z: G.PLANT_ZONE[d.id], lat: +d.lat.toFixed(1), self: self, native: native.length };
      });
      out.zoneBad = out.zone.filter(z => !z.self || !z.native);
      const med = [34, 0, 29, 28, 21, 112].map(id => G.CITY_DATA[id]);
      out.medNames = med.map(c => c.name);
      out.med = {};
      ['lemon', 'corkoak', 'stonepine', 'fig', 'citron'].forEach(pid => { out.med[pid] = med.filter(c => PT.why(G.DISC[pid], c) !== null).map(c => c.name + ':' + PT.why(G.DISC[pid], c)); });
      // ---- 7: 파란 장미 이익 (QA 와 같은 셈: 기준 값 × (가장 비싼 지역 배수 − 0.62), 심기 전 본디 산지만)
      NG('셈', 'PT');
      const regs = Object.keys(G.REGIONS).map(Number);
      const prof = g => g.p * (Math.max.apply(null, regs.map(rg => R.regionalMult(g.id, rg))) - 0.62);
      const ex = G.GOODS.filter(g => !g.plant).map(g => ({ id: g.id, name: g.name, v: prof(g) })).sort((a, b) => b.v - a.v);
      const pl = G.GOODS.filter(g => g.plant).map(g => ({ id: g.id, name: g.name, v: prof(g) })).sort((a, b) => b.v - a.v);
      out.bestEx = ex.slice(0, 3).map(x => x.name + ' ' + Math.round(x.v));
      out.bestPl = pl.slice(0, 3).map(x => x.name + ' ' + Math.round(x.v));
      out.blue = Math.round(prof(G.GOOD.p_bluerose)); out.ex0 = Math.round(ex[0].v);
      // ---- 15: 새 일지·불러오기 순간 c.goods 맞추기 (R.cityGoods 를 부르기 전에 그대로 읽어도)
      found('durian'); PT.plant(G.DISC.durian, mal);
      const json = G.State.serialize();
      NG('둘째', 'ES');
      out.rawAfterNew = mal.goods.filter(id => G.GOOD[id].plant);
      G.Game.state = G.State.deserialize(json);
      out.rawAfterLoad = mal.goods.filter(id => G.GOOD[id].plant);
      // ---- 16: 심은 뒤 알림의 조사
      const toasts = []; const t0 = UI.toast; UI.toast = function (t) { toasts.push(String(t)); };
      UI.say = async () => {}; UI.ask = async () => 1;
      NG('셋째', 'PT'); found('apple'); found('durian');
      const lis = G.CITY_DATA[0], goa = G.CITY_DATA[150];
      await PT.atTrade(lis); G.Game.state.plantTrade.offer = null; await PT.atTrade(goa);   // 주인이 먼저 청하는 것은 반년에 한 번 (2026-10-26) — 알림 조사만 보려고 쉬는 날을 지운다
      UI.toast = t0;
      out.toasts = toasts;
      // ---- 17: 게임 안 도시 이름
      const txt = P.map(d => [d.realName, d.desc, d.hint, d.clue].join(' ')).join(' ');
      out.oldSpell = ['세비야', '노브고로드', '베네치아', '아르긴', '바이아 '].filter(w => txt.indexOf(w) >= 0);
      if (/아르긴 상관/.test(((G.WONDERS && G.WONDERS.textAdd) || {}).b_cadamosto || '')) out.oldSpell.push('사료 아르긴 상관');
      out.bitter = G.DISC.bitterorange.realName;
      return out;
    });
    console.log(JSON.stringify({ rows0: r.rows0, plant0: r.plant0, plantFound: r.plantFound, plantPlanted: r.plantPlanted, zoneBad: r.zoneBad, med: r.med, bestEx: r.bestEx, bestPl: r.bestPl, blue: r.blue, raw: [r.rawAfterNew, r.rawAfterLoad], toasts: r.toasts, oldSpell: r.oldSpell, bitter: r.bitter }, null, 1));
    ok(r.rows0 > 0 && !r.plant0.length && !r.leak0.length, '시세 수첩: 못 찾은 식물 교역품은 표에 없다 (' + r.rows0 + '줄, 실제 이름 새지 않음)');
    ok(r.plantFound.join() === 'p_mango', '찾은 식물(망고)의 교역품은 표에 나온다');
    ok(r.plantedMal && r.plantPlanted.indexOf('p_camphor') >= 0, '심은 식물(용뇌)의 교역품은 표에 나온다');
    ok(!r.zoneBad.length, '모든 식물이 원산지 위도에서 자라고 원산 지역 교역소 한 곳 이상에 심을 수 있다 ' + JSON.stringify(r.zoneBad));
    ok(Object.values(r.med).every(a => !a.length), '지중해 항구(' + r.medNames.join('·') + ')에 레몬·코르크참나무·우산소나무·무화과·시트론을 심을 수 있다');
    ok(r.blue <= r.ex0, '파란 장미 1통 이익 ' + r.blue + ' ≤ 기존 교역품 최고 ' + r.bestEx[0]);
    ok(!r.rawAfterNew.length && r.rawAfterLoad.join() === 'p_durian', '새 일지·불러오기 순간 도시 특산물이 그 일지에 맞는다');
    ok(r.toasts.some(t => /「노르망디 사과」는 그대로/.test(t)) && r.toasts.some(t => /「두리안」은 그대로/.test(t)), '심은 뒤 알림 조사 — 「노르망디 사과」는 · 「두리안」은');
    ok(!r.oldSpell.length && /세빌리아/.test(r.bitter), '식물 글의 도시 이름이 게임 안 이름과 같다 (세빌리아·노브고르트) ' + r.oldSpell.join(','));
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
