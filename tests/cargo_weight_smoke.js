/* 짐의 부피·무게 · 큰 물량 교역 · 식품 보관(유통기한) · 육상 탐험대 식량·물 짐 점검.
   node tests/cargo_weight_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('requestfailed', q => { if (/^file:/.test(q.url())) console.log('  (없는 파일) ' + q.url().split('/game/')[1]); });
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Game.geoReady, null, { timeout: 90000 });
    const r = await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'merchant', age: 22, birth: { m: 4, d: 12 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 0), diff: 'normal' });
      const s = G.Game.state, f = s.fleet, R = G.R, CG = G.Cargo;
      f.cargo = {}; f.food = 40; f.water = 40;
      const out = { ship: f.ships.map(x => x.type + ' ' + x.cap).join(','), vol: R.fleetCap(), wcap: CG.fleetWtCap(), fixed: Math.round(CG.fixedWt()), freeVol: R.freeVol(), wfree: Math.round(CG.wfree()) };
      out.pepper = CG.room('pepper'); out.iron = CG.room('iron'); out.silver = CG.room('silver'); out.ironHeavy = CG.heavyBound('iron'); out.pepperHeavy = CG.heavyBound('pepper');
      // 큰 배(갤리온 2척)로 견주기
      f.ships = [R.newShip('galleon'), R.newShip('galleon')]; f.crew = 200; f.cargo = {}; f.food = 150; f.water = 150;
      out.big = { vol: R.fleetCap(), wcap: CG.fleetWtCap(), pepper: CG.room('pepper'), iron: CG.room('iron') };
      // 속력의 짐 보정: 가벼운 짐 · 무거운 짐
      f.cargo = { pepper: { q: 200, cost: 30, d: s.day } }; const sh1 = R.loadShares();
      f.cargo = { iron: { q: 200, cost: 10, d: s.day } }; const sh2 = R.loadShares();
      out.loadPepper = Math.round(Object.values(sh1).reduce((a, b) => a + b, 0) * 100) / 100; out.loadIron = Math.round(Object.values(sh2).reduce((a, b) => a + b, 0) * 100) / 100;
      // 물량: 캘리컷 → 리스본 후추
      f.cargo = {};
      const cal = G.CITY_DATA.find(c => c.name === '캘리컷'), lis = G.CITY_DATA[0];
      const stock = R.supply(cal, 'pepper'), bp = R.buyPrice(cal, 'pepper');
      R.onBuy(cal, 'pepper', 400); const bp2 = R.buyPrice(cal, 'pepper'), stock2 = R.supply(cal, 'pepper');
      let sold = 0, p0 = R.sellPrice(lis, 'pepper'); for (let i = 0; i < 40; i++) { sold += R.sellPrice(lis, 'pepper') * 10; R.onSell(lis, 'pepper', 10); }
      out.trade = { stock, bp, bp2, stock2, sellFirst: p0, sellAvg: Math.round(sold / 400), sellLast: R.sellPrice(lis, 'pepper'), profit400: sold - bp * 400 };
      // 보관: 후추 2년, 밀 1년
      const d0 = s.day;
      out.fresh = { pepperNew: G.Cargo.fresh('pepper', { d: d0 }), pepper2y: G.Cargo.fresh('pepper', { d: d0 - 900 }), pepper4y: G.Cargo.fresh('pepper', { d: d0 - 1500 }), wheat1y: G.Cargo.fresh('wheat', { d: d0 - 500 }), wine: G.Cargo.fresh('wine', { d: d0 - 3000 }), keepFish: G.Cargo.keep('fish') };
      f.cargo = { wheat: { q: 100, cost: 5, d: d0 - 900 } };
      for (let i = 0; i < 60; i++) G.Game.newDay();
      out.rot = f.cargo.wheat ? f.cargo.wheat.q : 0;
      return out;
    });
    console.log(JSON.stringify(r, null, 1));
    ok(r.pepper > r.iron && r.ironHeavy && !r.pepperHeavy, '첫 배(' + r.ship + '): 후추 ' + r.pepper + '통(부피에 걸림) · 철광석 ' + r.iron + '통(무게에 걸림) · 은 ' + r.silver + '통');
    ok(r.big.pepper > r.big.iron, '갤리온 2척: 후추 ' + r.big.pepper + ' · 철광석 ' + r.big.iron);
    ok(r.loadIron > r.loadPepper, '같은 200통이라도 철광석이 더 무거워 느림 (짐 비율 ' + r.loadPepper + ' → ' + r.loadIron + ')');
    ok(r.trade.stock >= 400 && r.trade.profit400 > 0, '캘리컷 후추 재고 ' + r.trade.stock + '통, 400통 사면 값 ' + r.trade.bp + ' → ' + r.trade.bp2 + ' · 리스본에서 400통 팔면 평균 ' + r.trade.sellAvg + '닢 (처음 ' + r.trade.sellFirst + ' → 끝 ' + r.trade.sellLast + ') · 남는 돈 ' + r.trade.profit400);
    ok(r.fresh.pepperNew === 1 && r.fresh.pepper2y < 1 && r.fresh.pepper4y === 0.5 && r.fresh.wine === 1, '보관: 후추 새것 1 · 2년 반 ' + r.fresh.pepper2y.toFixed(2) + ' · 4년 0.5 · 포도주 1 · 생선 ' + r.fresh.keepFish + '일');
    ok(r.rot < 100, '보관 두 배를 넘긴 밀 100통이 두 달에 ' + r.rot + '통으로');

    // 육상: 식량·물은 쓰지 않고 금화 경비만 · 야영의 사냥·물 긷기는 배(출발한 항구)가 보이는 곳에서만
    await page.evaluate(() => { const s = G.Game.state; s.fleet.ships = [G.R.newShip('caravel')]; s.fleet.crew = 40; s.fleet.food = 60; s.fleet.water = 60; s.fleet.cargo = {}; s.player.gold = 5000; G.Game.go('land', { from: 0 }); });
    await page.waitForFunction(() => G.Game.sceneName === 'land', null, { timeout: 30000 });
    await page.waitForTimeout(1500);
    const L1 = await page.evaluate(() => {
      const s = G.Game.state, l = s.loc, f = s.fleet, L = G.Scenes.land, out = {};
      out.near0 = G.Cargo.nearShip(l);
      const g0 = s.player.gold, food0 = f.food, water0 = f.water;
      for (let i = 0; i < 3; i++) L._test.runDay();
      out.days3 = { gold: g0 - s.player.gold, food: food0 - f.food, water: water0 - f.water, cost: L.dailyCost() };
      l.lon += 4; l.lat += 0.5; out.nearFar = G.Cargo.nearShip(l);
      return out;
    });
    console.log(JSON.stringify(L1));
    ok(L1.near0 && !L1.nearFar, '출발한 항구 곁에서는 배가 보이고, 4° 떨어지면 안 보임');
    ok(L1.days3.food === 0 && L1.days3.water === 0 && L1.days3.gold > 0, '육상 3일: 식량·물은 그대로, 금화 경비만 ' + L1.days3.gold + '닢');
    // 멀리서 야영: 사냥·물 긷기가 막혀 있다
    await page.evaluate(() => { G.Scenes.land._test.camp(); });
    await page.waitForTimeout(800);
    const farBtns = await page.evaluate(() => [...document.querySelectorAll('.askrow button')].map(b => ({ t: b.textContent, dis: b.classList.contains('disabled') })));
    ok(farBtns.some(b => /사냥한다/.test(b.t) && b.dis && /배가 보이는 곳에서만/.test(b.t)) && farBtns.some(b => /물을 긷는다/.test(b.t) && b.dis), '배가 안 보이는 곳 야영: 「사냥한다」「물을 긷는다」 막힘 (배가 보이는 곳에서만)');
    await page.screenshot({ path: '/tmp/cargo_camp_far.png' });
    await page.keyboard.press('Escape'); await page.waitForTimeout(400);
    // 배 곁에서 야영: 물을 길으면 배의 식수가 는다
    await page.evaluate(() => { const l = G.Game.state.loc; l.lon -= 4; l.lat -= 0.5; G.Scenes.land._test.camp(); });
    await page.waitForTimeout(800);
    const nearBtns = await page.evaluate(() => [...document.querySelectorAll('.askrow button')].map(b => ({ t: b.textContent, dis: b.classList.contains('disabled') })));
    ok(nearBtns.some(b => /물을 긷는다/.test(b.t) && !b.dis), '배가 보이는 곳 야영: 물 긷기 가능');
    const w0 = await page.evaluate(() => G.Game.state.fleet.water);
    await page.locator('.askrow button', { hasText: '물을 긷는다' }).click();
    await page.waitForTimeout(1200);
    const w1 = await page.evaluate(() => G.Game.state.fleet.water);
    ok(w1 > w0, '물을 길어 배의 식수 ' + Math.round(w0) + ' → ' + Math.round(w1));

    // 교역소 창: 무게 표시
    await page.evaluate(() => { const s = G.Game.state; s.loc = { mode: 'city', city: 0, lon: 0, lat: 0 }; G.Game.go('city', { cityId: 0 }); });
    await page.waitForFunction(() => G.Game.sceneName === 'city', null, { timeout: 30000 });
    await page.waitForTimeout(1200);
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); G.Scenes.city.B.trade.buy(G.CITY_DATA[0]).catch(e => console.error(e)); });
    await page.waitForTimeout(1200);
    const tx = await page.evaluate(() => document.querySelector('.win').innerText);
    ok(/무게 여유/.test(tx) && /무게 /.test(tx), '구입 창에 무게 여유·품목 무게');
    await page.screenshot({ path: '/tmp/cargo_buy.png' });
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
