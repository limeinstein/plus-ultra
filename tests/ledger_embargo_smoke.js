/* 전쟁 중인 항구는 수익 항로·최저 구입가·최고 매각가에서 제외한다.
   node tests/ledger_embargo_smoke.js */
'use strict';
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (_) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }

(async () => {
  const browser = await playwright.chromium.launch({
    executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files']
  });
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto(pathToFileURL(path.resolve(__dirname, '..', process.env.PAGE || 'index.html')).href,
      { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => window.G && G.Ledger && G.Rel && G.Explore && G.Info);
    const passed = await page.evaluate(() => {
      const passed = [];
      function ok(value, message) { if (!value) throw new Error(message); passed.push(message); }
      const s = G.State.newGame({ name: '교역 시험', nation: 'PT', job: 'merchant', age: 24,
        birth: { m: 3, d: 2 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.state = s;
      s.date = { y: 1500, m: 6, d: 1 }; s.settings.res = 0.35;
      const city = name => G.CITY_DATA.find(c => c && c.name === name);
      const lis = city('리스본'), sev = city('세빌리아') || city('세비야'), lon = city('런던');
      const L = G.Ledger, rel = G.Rel, gid = G.R.cityGoods(lis)[0], good = G.GOOD[gid];
      rel.set('PT', 'ES', 0); rel.set('PT', 'EN', 0);
      s.ledger = {};
      function row(c, buy, sell) {
        const r = { t: s.day, b: {}, s: [], ci: { food: 100 } };
        r.b[gid] = buy; r.s[good.idx] = sell; s.ledger[c.id] = r;
      }
      row(lis, 100, 80); row(sev, 10, 1000); row(lon, 200, 300);
      const saved = JSON.stringify(s.ledger);
      ok(L.bestSell(gid).city === sev.id && L.bestBuy(gid).city === sev.id && L.bestRoute(lis.id).sell === sev.id,
        '평화 중에는 세빌리아의 유리한 시세를 추천한다');
      rel.set('PT', 'ES', -100);
      ok(rel.embargo(sev), '세빌리아 거래 금지 상태를 재현한다');
      ok(L.bestSell(gid).city === lon.id, '거래 금지 항구 대신 거래 가능한 매각지를 고른다');
      ok(L.bestBuy(gid).city === lis.id, '거래 금지 항구는 구입지에서도 제외한다');
      const route = L.bestRoute();
      ok(route.buy === lis.id && route.sell === lon.id && route.gain === 200 && L.bestRoute(sev.id) === null,
        '전체 항로와 출발지 지정 항로 모두 거래 금지를 반영한다');
      ok(L.table().every(r => (!r.buy || r.buy.city !== sev.id) && (!r.sell || r.sell.city !== sev.id)),
        '교역 수첩의 품목별 추천에도 거래 금지를 반영한다');
      ok(!G.Explore.marketTip().includes(sev.name), '상인의 수익 항로 소문에서 거래 금지 항구를 제외한다');
      s.fleet.cargo = {}; s.fleet.cargo[gid] = { q: 1, cost: 1, from: lis.id, d: s.day };
      ok(!G.Scenes.city.todo(sev).some(t => /여기서 팔면 이익|사서 .*팔면/.test(t.text)),
        '거래 금지 항구의 할 일에 이익 매각을 권하지 않는다');
      ok(JSON.stringify(s.ledger) === saved && L.quoteRows(lis.id).some(r => r.city === sev.id),
        '기존 시세 기록은 보존한다');
      rel.set('PT', 'ES', -30);
      ok(!rel.embargo(sev) && L.bestSell(gid).city === sev.id, '냉랭하지만 거래 가능한 항구는 추천한다');
      rel.set('PT', 'ES', -100, 1501);
      s.date.y = 1501;
      ok(!rel.embargo(sev) && L.bestRoute(lis.id).sell === sev.id, '전쟁이 끝나면 같은 기록으로 추천을 재개한다');
      s.date.y = 1500; s.player.nation = 'ES';
      ok(!rel.embargo(sev) && L.bestBuy(gid).city === sev.id, '제독 국적에 맞춰 거래 가능 여부를 판단한다');
      s.player.nation = 'PT';
      const book = s.ledger;
      s.ledger = {}; s.ledger[sev.id] = book[sev.id]; s.known = [sev.id];
      ok(L.bestSell(gid) === null && L.bestBuy(gid) === null && L.bestRoute() === null && L.table().length === 0,
        '알려진 항구가 모두 거래 금지면 추천하지 않는다');
      ok(G.Explore.marketTip() === null, '수익 항로가 없는 때의 장사 소문도 거래 금지 항구를 권하지 않는다');
      s.ledger = book;
      book[lon.id].t = s.day - L.OLD - 1;
      ok(L.bestSell(gid, lis.id) === null && L.bestRoute() === null, '오래된 기록 제외 규칙을 유지한다');
      book[lon.id].t = s.day;
      window.__ledgerEmbargo = { lis: lis.id, sev: sev.id, lon: lon.id, gid };
      return passed;
    });
    passed.forEach(message => console.log('  ✓ ' + message));
    await page.evaluate(() => { G.Info.open('trade'); });
    const notebook = await page.locator('.modal-back').last().innerText();
    const names = await page.evaluate(() => ({ sev: G.CITY_DATA[window.__ledgerEmbargo.sev].name, lon: G.CITY_DATA[window.__ledgerEmbargo.lon].name }));
    assert(!notebook.includes(names.sev) && notebook.includes(names.lon), '수첩 화면에서도 거래 금지 항구 대신 런던을 표시한다');
    await page.keyboard.press('Escape');
    await page.evaluate(() => { window.__tradeBuy = G.Scenes.city.B.trade.buy(G.CITY_DATA[window.__ledgerEmbargo.lis]); });
    await page.waitForSelector('input.bpick');
    const buy = await page.locator('tr.click[data-id="' + await page.evaluate(() => window.__ledgerEmbargo.gid) + '"]').innerText();
    assert(!buy.includes(names.sev) && buy.includes(names.lon), '구입 화면의 최고 매각지에서 거래 금지 항구를 제외한다');
    await page.keyboard.press('Escape');
    await page.evaluate(() => window.__tradeBuy);
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    console.log('  ✓ 교역 수첩·구입 화면 확인, 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
