/* 보급의 실제 무게·통 단위 올림·결제 검사, 소지금 기준 동료·선원 급료 경고.
   node tests/supply_weight_wages_smoke.js (BROWSER_EXE로 Chromium 경로 지정 가능) */
'use strict';
const assert = require('assert/strict');
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); } catch (_) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 720 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load resource|net::ERR_/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && !G.Loader.shown(), null, { timeout: 90000 });
    await page.evaluate(() => {
      window.requestAnimationFrame = () => 0;
      window.resetSupplyTest = () => {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
        G.State.newGame({ name: '보급시험', nation: 'PT', job: 'merchant', age: 25, birth: { m: 1, d: 1 },
          st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
        const s = G.Game.state, f = s.fleet;
        s.player.gold = 100000; s.mates = []; s.settings.res = 0.35;
        f.ships = [G.R.newShip('caravel')]; f.ships[0].cap = 100; f.ships[0].guns.n = 0;
        f.crew = 17; f.food = 10.2; f.water = 10.2; f.mat = 4.2;
        f.cargo = { iron: { q: 20, cost: 10 } };
        s.lastSupply = 1; s.lastMat = 4;
        window.testMessages = []; G.Scenes.city.mate = async t => { window.testMessages.push(t); };
        G.State.save = () => true;
      };
      window.startSupplyTest = () => { window.supplyResult = G.Scenes.city.B.harbor.supply(G.CITY_DATA[0], { need: 1 }); };
      window.supplySnapshot = () => {
        const s = G.Game.state, f = s.fleet;
        return { food: f.food, water: f.water, mat: f.mat, crew: f.crew, gold: s.player.gold,
          vol: G.R.used(), cap: G.R.fleetCap(), weight: G.Cargo.fleetWt(), weightCap: G.Cargo.fleetWtCap(), free: G.R.free(), messages: window.testMessages };
      };
    });
    const open = async setup => {
      await page.evaluate(setup || (() => { resetSupplyTest(); startSupplyTest(); }));
      await page.waitForSelector('.sup-info');
    };
    const set = (k, value) => page.evaluate(([k, value]) => {
      const input = document.querySelector('tr[data-k="' + k + '"] input[type=number]'); input.value = value; input.onchange();
    }, [k, value]);
    const max = k => page.locator('tr[data-k="' + k + '"] button[data-q=max]').click();
    const pay = async () => {
      await page.getByRole('button', { name: '맞춘다', exact: true }).click();
      return page.evaluate(async () => { const result = await window.supplyResult; return { result, ...supplySnapshot() }; });
    };
    const safe = (s, label) => {
      assert(s.vol <= s.cap && s.weight <= s.weightCap + 1e-9, label + ': ' + JSON.stringify(s));
      console.log('✓ ' + label + ' (' + s.weight.toFixed(2) + ' / ' + s.weightCap + ')');
    };

    await open(); await max('mat');
    let s = await pay(); safe(s, '자재 최대 보급은 통당 무게 1.2와 소수 보급량의 올림을 반영한다');
    assert.equal(s.food, 10.2); assert.equal(s.water, 10.2);
    assert(await page.evaluate(() => G.Cargo.supplyFree({ ...G.Game.state.fleet, mat: G.Game.state.fleet.mat + 1 }) < 0));

    await open(() => {
      resetSupplyTest(); const f = G.Game.state.fleet;
      f.ships[0].cap = 200; f.cargo = { pepper: { q: 140, cost: 10 } };
      f.food = 0.1; f.water = 0.1; f.mat = 0.1; startSupplyTest();
    });
    await page.locator('.bq[data-d=max]').click();
    s = await pay(); safe(s, '식량·물 함께 최대 보급은 부피 올림까지 반영한다');
    assert.equal(s.mat, 0.1);

    await open(); await set('mat', 15);
    const before = await page.evaluate(() => { G.Game.state.fleet.crew = 2000; return supplySnapshot(); });
    s = await pay(); assert.equal(s.gold, before.gold); assert.equal(s.mat, before.mat);
    assert(s.messages.some(t => /무게 한도/.test(t)));
    console.log('✓ 결제 직전 한도가 바뀌어도 초과 보급과 결제를 막는다');

    await open(() => { resetSupplyTest(); G.Game.state.fleet.mat = 90.2; startSupplyTest(); });
    await set('mat', 5); s = await pay(); safe(s, '기존 초과 적재도 보급품을 내려 해소할 수 있다'); assert(s.result.got > 0);

    const prep = await page.evaluate(async () => {
      resetSupplyTest(); const f = G.Game.state.fleet;
      f.ships[0].cap = 200; f.crew = 1; f.food = 60.1; f.water = 0.1; f.mat = 1;
      f.cargo = { iron: { q: 45, cost: 10 } };
      G.UI.number = async opt => { window.prepMax = opt.max; return opt.max; };
      G.Scenes.city.mateAsk = async () => false;
      await G.Scenes.city.B.harbor.prep(G.CITY_DATA[0]);
      return { ...supplySnapshot(), days: window.prepMax };
    });
    safe(prep, '출항 준비 최대 보급은 새 선원 무게와 남아 있는 식량도 반영한다');
    assert(prep.days > 0 && prep.crew > 1 && prep.food >= 60.1);

    const wages = await page.evaluate(() => {
      resetSupplyTest(); const s = G.Game.state, cb = G.Cabins;
      s.mates = [{ id: 'rocco', loyal: 80, role: 'first' }]; s.fleet.discipline = 80;
      s.player.gold = 0; s.player.bank = 100000;
      const total = cb.wages() + G.World.crewWage(), warn = cb.wageWarning();
      const extra = cb.wageWarning(100);
      s.player.gold = total * 6; const six = cb.wageWarning();
      s.player.gold--; const five = cb.wageWarning();
      s.player.gold = total; const out = G.World.newMonth();
      const paid = { gold: s.player.gold, loyal: s.mates[0].loyal, discipline: s.fleet.discipline, out };
      s.mates = []; s.player.gold = 0; const crewOnly = cb.wageWarning();
      s.fleet.crew = 0; const none = cb.wageWarning();
      return { total, warn, extra, six, five, paid, crewOnly, none };
    });
    assert.equal(wages.warn.months, 0); assert.equal(wages.warn.wage, wages.total);
    assert.match(wages.warn.text, /소지금/); assert.match(wages.warn.text, /예금은 금고/);
    assert.equal(wages.extra.wage, wages.total + 100);
    assert.equal(wages.six, null); assert.equal(wages.five.months, 5);
    assert.equal(wages.paid.gold, 0); assert(wages.paid.loyal >= 78); assert.equal(wages.paid.discipline, 80);
    assert(!wages.paid.out.some(x => /지불하지 못|다 치르지 못/.test(x.text)));
    assert(wages.crewOnly.wage > 0 && wages.crewOnly.months === 0); assert.equal(wages.none, null);
    console.log('✓ 현금 0·예금 10만은 부족 경고, 급료 합계·고용 추가분·6개월 경계·실제 월 지급과 일치');

    await page.evaluate(() => {
      resetSupplyTest(); G.Game.state.player.gold = 0; G.Game.state.player.bank = 100000;
      window.cabinResult = G.CabinView.open();
    });
    await page.waitForSelector('.cb-top');
    const cabin = await page.locator('.cb-top').innerText();
    assert.match(cabin, /동료·선원 급료 한 달/); assert.match(cabin, /소지금으로 0달/);
    await page.getByRole('button', { name: '닫는다', exact: true }).click();
    await page.evaluate(() => window.cabinResult);
    console.log('✓ 선실 화면의 급료 합계와 부족 표시도 소지금 기준으로 일치');
    assert.deepEqual(errors, []); console.log('✓ 브라우저 실행 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
