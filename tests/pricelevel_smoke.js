/* 물가 — 가격 혁명 시험 (2026-11-19) — node tests/pricelevel_smoke.js
   1480년에는 모든 값이 예전 그대로, 1600년 리스본에서는 교역품 2.4배·식량 1+(1.4×1.2)·품삯 1+(1.4×0.6)·배 1+(1.4×0.8)인지,
   사고팔기·보급·선원·여관·배값·수리·대포·동료 월급·출자 문턱·의뢰 사례금·배 되팔기에 물가가 들어가는지, 도시·조선소·교역소 화면에서 콘솔 오류가 없는지 본다. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  let fail = 0;
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    const errs = [];
    page.on('pageerror', e => errs.push('pageerror ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
    await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'index.html')).href));
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 180000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.State.newGame({ name: '시험', nation: 'PT', job: 'merchant', age: 20, birth: { m: 3, d: 9 }, st: { str: 60, int: 64, mar: 56, cha: 66 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
      const s = G.Game.state, R = G.R, K = G.BALANCE.priceLevel, Y = G.Scenes.city.B.shipyard;
      s.flags.prologue = true; s.settings.res = 0.35;
      const L = G.CITY_DATA[0], A = G.CITY_DATA.find(c => c && c.name === '나가사키');
      const out = { checks: [] };
      const ok = (name, v, why) => out.checks.push([name, !!v, why]);
      const snap = () => ({ buy: R.buyPrice(L, 'wine'), sell: R.sellPrice(L, 'pepper'), hire: R.hireCost(L), food: R.supplyCost(L), water: R.waterCost(L), mat: R.matCost(L), inn: R.innCost(L),
        ship: Y.priceOf(L, 'hulk'), inv: R.investLevels(0)[5], sv: R.shipValue(s.fleet.ships[0]) });
      const near = (a, b, t) => Math.abs(a - b) <= (t || 0.03) * Math.max(1, Math.abs(b));
      ok('1480 물가 거의 1', near(R.priceLevel(L, 'goods'), 1, 0.002) && near(R.priceLevel(A, 'goods'), 1, 0.002), R.priceLevel(L, 'goods'));
      K.on = false; const off80 = snap(); K.on = true; const on80 = snap();
      ok('1480 값 거의 그대로 (0.3% 안)', Object.keys(off80).every(k => Math.abs(on80[k] - off80[k]) <= Math.max(1, off80[k] * 0.003) + 10 * (k === 'ship')), JSON.stringify([off80, on80]));
      // 1600년으로 (날 수는 그대로 — 출렁임·시장 사건이 같게)
      s.date.y = 1600; s.date.m = 1; s.date.d = 1;
      ok('1600 리스본 교역품 2.4', near(R.priceLevel(L, 'goods'), 2.4, 0.001), R.priceLevel(L, 'goods'));
      ok('1600 식량 2.68', near(R.priceLevel(L, 'food'), 1 + 1.4 * 1.2, 0.001), R.priceLevel(L, 'food'));
      ok('1600 품삯 1.84', near(R.priceLevel(L, 'wage'), 1 + 1.4 * 0.6, 0.001), R.priceLevel(L, 'wage'));
      ok('1600 배 2.12', near(R.priceLevel(L, 'ship'), 1 + 1.4 * 0.8, 0.001), R.priceLevel(L, 'ship'));
      ok('1600 나가사키 1.1', near(R.priceLevel(A, 'goods'), 1.1, 0.001), R.priceLevel(A, 'goods'));
      ok('1645 동아시아 1.4 → 1665 0.95', near(R.priceLevel(6, 'goods', 1645), 1.4, 0.001) && near(R.priceLevel(6, 'goods', 1665), 0.95, 0.001), [R.priceLevel(6, 'goods', 1645), R.priceLevel(6, 'goods', 1665)]);
      K.on = false; const off = snap(); K.on = true; const on = snap();
      out.off = off; out.on = on;
      ok('사는 값 ×2.4', near(on.buy / off.buy, 2.4, 0.08), [on.buy, off.buy]);
      ok('파는 값 ×2.4', near(on.sell / off.sell, 2.4, 0.08), [on.sell, off.sell]);
      ok('선원 품삯 ×1.84', near(on.hire / off.hire, 1.84, 0.08), [on.hire, off.hire]);
      ok('식량 오름', on.food > off.food && on.water >= off.water && on.mat > off.mat, [on.food, off.food, on.water, off.water, on.mat, off.mat]);
      ok('여관 ×2.4', near(on.inn / off.inn, 2.4, 0.05), [on.inn, off.inn]);
      ok('배값 ×2.12', near(on.ship / off.ship, 2.12, 0.02), [on.ship, off.ship]);
      ok('출자 문턱 ×2.4', near(on.inv / off.inv, 2.4, 0.01), [on.inv, off.inv]);
      ok('배 되팔기도 물가를 따르되 새 배값보다 한참 싸다', on.sv > off.sv && on.sv < Y.priceOf(L, s.fleet.ships[0].type) * 0.7, [on.sv, off.sv]);
      { const sh = s.fleet.ships[0], keep = sh.paidPrice; sh.paidPrice = 1000; ok('산 값이 있으면 되팔기는 산 값 기준', R.shipValue(sh) <= 1000, R.shipValue(sh)); sh.paidPrice = keep; }
      // 동료 월급
      const md = G.MATES.find(m => m.wage > 0 && !m.noWander);
      if (md) { s.mates.push({ id: md.id, loyal: 70 }); K.on = false; const w0 = R.mateWage(md.id); K.on = true; const w1 = R.mateWage(md.id); s.mates.pop();
        ok('동료 월급 ×1.84', near(w1 / w0, 1.84, 0.05), [w1, w0]); }
      // 의뢰 사례금: 같은 의뢰를 물가를 끄고 켜서 만든다
      if (G.Quest && G.Quest.offers) {
        K.on = false; const q0 = G.Quest.offers(L).map(q => q.pay); K.on = true; const q1 = G.Quest.offers(L).map(q => q.pay);
        out.q = [q0, q1];
        ok('의뢰 사례금 오름', q1.length && q1.every((v, i) => v >= q0[i]) && q1.some((v, i) => v > q0[i]), JSON.stringify([q0, q1]));
      }
      // 화면: 도시 → 교역소·조선소 목록을 그려 본다
      G.Game.go('city', { cityId: 0 }); await new Promise(r => setTimeout(r, 1500));
      out.scene = G.Game.sceneName;
      return out;
    });
    r.checks.forEach(c => { console.log((c[1] ? 'ok   ' : 'FAIL ') + c[0] + (c[1] ? '' : '  ' + JSON.stringify(c[2]))); if (!c[1]) fail++; });
    console.log('1600 리스본 (물가 끔 → 켬):', JSON.stringify(r.off), '→', JSON.stringify(r.on));
    if (r.scene !== 'city') { console.log('FAIL 도시 장면', r.scene); fail++; }
    if (errs.length) { console.log('FAIL 콘솔 오류', errs.slice(0, 5)); fail++; } else console.log('ok   콘솔 오류 0');
  } finally { await browser.close(); }
  console.log(fail ? fail + '개 실패' : '모두 통과');
  process.exit(fail ? 1 : 0);
})();
