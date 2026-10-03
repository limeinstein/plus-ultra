/* 지역별 교역품 · 중계무역 점검 (js/data/tradegoods.js)
   · 나뉜 물건: 발렌시아=유럽 도기, 광주=중국 도자기·중국 비단, 캘리컷=인도 캘리코, 쿄토=동양 서화
   · 중국 도자기·인도 후추가 유럽에서 산지 값의 3배 안팎에 팔리는지
   · 중계 항구(알렉산드리아·베니스·말라카 …)는 산지보다 비싸게 팔고, 산지로 치지 않는지
   · 교역소 구입 창에 「중계」 표시, 옛 저장 파일의 '도자기'(발렌시아산) → 유럽 도기, 도감이 열리는지
   node tests/trade_relay_smoke.js  (playwright, 스크린샷은 OUT 폴더) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const GAME = pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href;
const CAT = pathToFileURL(path.join(ROOT, 'catalog.html')).href;
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'trade_relay_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::/.test(m.text() + ' ' + ((m.location() || {}).url || ''))) errors.push('console: ' + m.text()); });
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.TradeGoods && G.R, null, { timeout: 90000 });
    const r = await page.evaluate(() => {
      G.State.newGame({ name: '주앙', nation: 'PT', job: 'merchant', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.state.date.y = 1580;
      const R = G.R, by = n => G.CITY_DATA.find(c => c && c.name === n);
      const base = (n, id) => { const c = by(n), g = G.GOOD[id]; return R.isRelay(c, id) ? g.p * R.relayMult(c, id, 'buy') : R.sells(c, id) ? g.p * 0.62 : g.p * R.regionalMult(id, c.region); };
      return {
        valencia: by('발렌시아').goods, canton: by('광주').goods, calicut: by('캘리컷').goods, kyoto: by('쿄토').goods,
        porc: base('리스본', 'porcelain') / base('광주', 'porcelain'), pep: base('리스본', 'pepper') / base('캘리컷', 'pepper'),
        pepLondon: base('런던', 'pepper') / base('캘리컷', 'pepper'),
        alexRelay: R.isRelay(by('알렉산드리아'), 'pepper'), alexBuy: base('알렉산드리아', 'pepper'), calBuy: base('캘리컷', 'pepper'),
        venice: R.isRelay(by('베니스'), 'pepper'), originsPepper: Object.keys(R.origins().pepper).map(Number),
        antwerpEarly: G.TradeGoods.isRelay(by('앤트워프'), 'pepper', 1490), antwerpLate: G.TradeGoods.isRelay(by('앤트워프'), 'pepper', 1520),
        faienceOrigins: G.TradeGoods.originRegions('faience'), alexId: by('알렉산드리아').id
      };
    });
    ok(r.valencia.includes('faience') && !r.valencia.includes('porcelain'), '발렌시아: 유럽 도기 (중국 도자기 아님)');
    ok(r.canton.includes('porcelain') && r.canton.includes('cnsilk'), '광주: 중국 도자기 · 중국 비단');
    ok(r.calicut.includes('calico'), '캘리컷: 인도 캘리코');
    ok(r.kyoto.includes('eaart') && !r.kyoto.includes('silk'), '쿄토: 동양 서화, 비단은 들여옴(중계)');
    ok(r.porc > 2.8, '중국 도자기 광주→리스본 ' + r.porc.toFixed(2) + '배');
    ok(r.pep > 3 && r.pepLondon > r.pep, '후추 캘리컷→리스본 ' + r.pep.toFixed(2) + '배 · 런던 ' + r.pepLondon.toFixed(2) + '배');
    ok(r.alexRelay && r.alexBuy > r.calBuy * 1.3, '알렉산드리아 후추는 중계 (사는 값 ' + Math.round(r.alexBuy) + ' > 캘리컷 ' + Math.round(r.calBuy) + ')');
    ok(r.venice, '베니스도 후추를 들여와 판다');
    ok(!r.originsPepper.includes(4) && !r.originsPepper.includes(2), '중계 항구는 후추 산지로 치지 않음 (산지 지역 ' + r.originsPepper.join(',') + ')');
    ok(!r.antwerpEarly && r.antwerpLate, '앤트워프 향신료 창고는 1501년부터');

    // 교역소 구입 창 (알렉산드리아)
    await page.evaluate(async (id) => { await G.Game.ensureGeo(); G.Game.state.player.gold = 50000; G.Game.go('city', { cityId: id }); }, r.alexId);
    await page.waitForTimeout(2500);
    for (let i = 0; i < 10 && await page.evaluate(() => G.UI.busy()); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(250); }
    await page.evaluate((id) => { G.Scenes.city.B.trade.buy(G.CITY_DATA[id]); }, r.alexId);
    await page.waitForTimeout(1200);
    const tags = await page.evaluate(() => [...document.querySelectorAll('.tbl tr.click')].map(tr => tr.textContent).filter(t => /중계/.test(t)).length);
    ok(tags >= 3, '구입 창에 「중계」 표시 ' + tags + '줄');
    await page.screenshot({ path: path.join(OUT, '1_alexandria_buy.png') });
    for (let i = 0; i < 6 && await page.evaluate(() => G.UI.busy()); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(250); }

    // 옛 저장 파일
    const mig = await page.evaluate(() => {
      const s = G.Game.state, v = G.CITY_DATA.find(c => c && c.name === '발렌시아');
      s.fleet.cargo = { porcelain: { q: 12, cost: 70, from: v.id, d: s.day } };
      const back = G.State.deserialize(G.State.serialize());
      return Object.keys(back.fleet.cargo);
    });
    ok(mig.length === 1 && mig[0] === 'faience', '옛 저장 파일: 발렌시아산 「도자기」 → 유럽 도기');

    // 도감
    const cat = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    cat.on('pageerror', e => errors.push('catalog: ' + e.message));
    await cat.goto(CAT);
    await cat.waitForFunction(() => window.G && G.TradeGoods && G.GOOD.cnsilk, null, { timeout: 60000 });
    ok(true, '도감이 열리고 새 교역품(중국 비단 …)을 안다');
    await cat.close();

    ok(!errors.length, '콘솔 오류 없음' + (errors.length ? ': ' + errors.join(' / ') : ''));
    console.log('스크린샷: ' + OUT);
  } catch (e) {
    console.error('✗ ' + e.message); if (errors.length) console.error(errors.join('\n')); process.exitCode = 1;
  } finally { await browser.close(); }
})();
