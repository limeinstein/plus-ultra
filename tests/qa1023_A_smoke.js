/* QA 2026-10-23 A 그룹(도시·경제) 고침 점검 — node tests/qa1023_A_smoke.js (BROWSER_EXE=크롬 경로)
   [2]  이번 입항 번호(s.portVisit): 도시에 들어올 때 늘고 이어하기는 그대로 · R.sameStay · 술집 장사 소문이 같은 입항에 다시 풀리지 않는다
   [3]  일괄 흥정: 창을 닫았다 열어도 이어지고, 낱개 흥정과 횟수를 나눠 쓴다 · 값 깎기와 겹쳐도 합계가 상한을 넘지 않는다
   [30] 보급 되파는 값은 산 값을 넘지 않는다 · 개척 도시 단계가 올라도 식물 특산물이 남는다 · 산지 캐시를 비운다
   [34] 개척 도시 문구 조사 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::|Failed to load/.test(m.text())) errors.push(m.text().slice(0, 300)); });
  const btn = async (re) => { await page.waitForFunction(r => Array.from(document.querySelectorAll('.foot button')).some(b => b.offsetParent && new RegExp(r).test(b.textContent)), re.source, { timeout: 8000 }); await page.evaluate(r => { const b = Array.from(document.querySelectorAll('.foot button')).filter(x => x.offsetParent && new RegExp(r).test(x.textContent)).pop(); b.click(); }, re.source); await page.waitForTimeout(250); };
  const hasBtn = (re) => page.evaluate(r => Array.from(document.querySelectorAll('.foot button')).some(b => b.offsetParent && new RegExp(r).test(b.textContent)), re.source);
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { timeout: 90000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(() => G.Game.go('create'));
    await page.waitForSelector('#nm');
    await page.fill('#nm', '이강희'); await page.press('#nm', 'Enter');
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state, null, { timeout: 90000 });

    // ---------------- [2] 이번 입항 번호
    const pv = await page.evaluate(async () => {
      const s = G.Game.state, R = G.R, out = { first: s.portVisit };
      G.Game.go('city', { cityId: 0, load: true }); out.load = s.portVisit;      // 이어하기는 같은 입항
      G.Game.go('city', { cityId: 0 }); out.again = s.portVisit;                 // 다시 들어오면 하나 는다
      out.sameDay = R.sameStay(s.day, null); out.sameStay = R.sameStay(s.day - 5, s.portVisit); out.other = R.sameStay(s.day - 5, s.portVisit - 1); out.old = R.sameStay(undefined, undefined);
      // 술집 장사 소문: 하루 rumorAsk번 — 하루가 흘러도 같은 입항이면 그대로
      const T = G.Scenes.city.B.tavern, c = G.CITY_DATA[0], mk = R.market(0);
      mk.rum = { day: s.day, pv: s.portVisit, n: 2 }; s.day += 1; out.rumLeftStay = T.rumorLeft(c);
      s.portVisit++; out.rumLeftNext = T.rumorLeft(c);
      mk.rum = { day: s.day - 3, n: 2 }; out.rumLeftOld = T.rumorLeft(c);       // 옛 저장(입항 번호 없음)
      return out;
    });
    console.log('   ' + JSON.stringify(pv));
    ok(pv.first >= 1 && pv.load === pv.first && pv.again === pv.first + 1, '도시에 들어오면 입항 번호가 는다 (' + pv.first + ' → 이어하기 ' + pv.load + ' → 다시 입항 ' + pv.again + ')');
    ok(pv.sameDay && pv.sameStay && !pv.other && !pv.old, 'R.sameStay: 같은 날이거나 같은 입항이면 막는다 · 옛 기록은 막지 않는다');
    ok(pv.rumLeftStay === 0 && pv.rumLeftNext === 2 && pv.rumLeftOld === 2, '장사 소문: 하루가 흘러도 같은 입항이면 다 들은 그대로, 다음 입항에 다시 2번');

    // ---------------- [3] 일괄 흥정: 이어 쓰기 · 낱개 흥정과 나눠 쓰기 · 상한
    await page.evaluate(() => {
      const s = G.Game.state; s.player.gold = 200000; s.fleet.cargo = {}; s.player.sk.acct = 0; s.mates = s.mates.filter(m => m.role !== 'purser');
      G.UI.say = async () => {}; G.Scenes.city.say = async () => {}; window.__R = G.U.rng; window.__want = null;
      G.U.rng = function () { return window.__want == null ? window.__R() : window.__want; };
      G.Disc.checkTrade = () => []; G.Disc.checkCity = () => []; if (G.PlantTrade) G.PlantTrade.atTrade = async () => false; if (G.Escort) G.Escort.atTrade = async () => {};
    });
    for (let i = 0; i < 60; i++) {   // 도시에 들어서는 연출이 끝날 때까지 교역소 문을 두드린다
      const inTrade = await page.evaluate(() => { const c = G.Scenes.city.current(); if (c && c.kind === 'trade' && c.hagN != null) return true; if (!c && !G.UI.busy()) G.Scenes.city.visit('trade'); return false; });
      if (inTrade) break; await page.waitForTimeout(500);
    }
    await page.waitForFunction(() => { const c = G.Scenes.city.current(); return c && c.kind === 'trade' && c.hagN != null; }, null, { timeout: 30000 });
    await page.evaluate(() => { const c = G.CITY_DATA[0]; window.__p = G.Scenes.city.B.trade.batch(c, 'buy', G.R.cityGoods(c).slice(0, 2)); });
    await page.waitForSelector('input.bq');
    await page.evaluate(() => { window.__want = 0; }); await btn(/흥정한다 \(1차\)/);
    await page.waitForFunction(() => /일괄 흥정 −\d+%/.test(document.body.innerText));
    const d1 = await page.evaluate(() => +document.body.innerText.match(/일괄 흥정 −(\d+)%/)[1]);
    await btn(/돌아간다/); await page.evaluate(() => window.__p);
    // 다시 연다: 깎은 값은 그대로, 흥정은 더 못 한다 (회계 0 = 1번)
    await page.evaluate(() => { const c = G.CITY_DATA[0]; window.__p = G.Scenes.city.B.trade.batch(c, 'buy', G.R.cityGoods(c).slice(0, 2)); });
    await page.waitForSelector('input.bq');
    const d1b = await page.evaluate(() => +(document.body.innerText.match(/일괄 흥정 −(\d+)%/) || [0, 0])[1]);
    const again = await hasBtn(/흥정한다/);
    await btn(/돌아간다/); await page.evaluate(() => window.__p);
    ok(d1 > 0 && d1b === d1 && !again, '창을 닫았다 다시 열어도 일괄 할인 −' + d1 + '% 그대로 · 흥정을 새로 굴릴 수 없다');
    const share = await page.evaluate(async () => {
      const C = G.Scenes.city, T = C.B.trade, c = G.CITY_DATA[0], cur = C.current(), out = { hagN: cur.hagN, left: T.hagLeft(c) };
      let said = ''; const k0 = C.say; C.say = async (w, t) => { said = t; };
      await T.haggle(c); out.said = said; out.haggle = cur.haggle; C.say = k0;
      // 상한: 값 깎기(사는 값 −25%)와 겹치면 합계가 22%를 넘지 않는다 · 파는 쪽도
      const K = G.BALANCE.batchDeal || { cap: 0.22, sellK: 0.7 };
      cur.haggle = { ok: true, buy: 0.75, sell: 1.15 }; out.capBuy25 = T.batchCap(true); out.capSell = T.batchCap(false);
      cur.haggle = { ok: true, buy: 0.9, sell: 1.06 }; out.capBuy10 = T.batchCap(true); out.capSell6 = T.batchCap(false);
      out.total10 = 1 - 0.9 * (1 - out.capBuy10); out.sellTotal6 = 1.06 * (1 + out.capSell6 * K.sellK); out.cap = K.cap; out.sellCap = 1 + K.cap * K.sellK;
      cur.haggle = null; out.capNone = T.batchCap(true);
      return out;
    });
    console.log('   ' + JSON.stringify(share));
    ok(share.hagN === 1 && share.left === 0 && /흥정할 만큼/.test(share.said) && !share.haggle, '일괄 흥정이 낱개 값 깎기와 한도를 나눠 쓴다 (남은 흥정 0 → 값 깎기도 막힘)');
    ok(share.capBuy25 === 0 && Math.abs(share.total10 - share.cap) < 1e-9 && share.capNone === share.cap, '값 깎기와 겹치면 사는 쪽 합계 할인이 ' + Math.round(share.cap * 100) + '%를 넘지 않는다 (−10% 깎았으면 일괄은 ' + (share.capBuy10 * 100).toFixed(1) + '%까지)');
    ok(share.capSell < 0.01 && Math.abs(share.sellTotal6 - share.sellCap) < 1e-9, '파는 쪽도: 값 깎기 웃돈 × 일괄 웃돈이 +' + Math.round((share.sellCap - 1) * 100) + '%를 넘지 않는다');
    await page.evaluate(() => G.Scenes.city.leave && G.Scenes.city.leave());
    await page.waitForTimeout(400);

    // ---------------- [30a] 보급 되파는 값
    const sup = await page.evaluate(() => {
      const s = G.Game.state, R = G.R, lis = G.CITY_DATA[0], far = G.CITY_DATA.find(c => c && c.port && c.region > 2 && R.cityExists(c));
      const f = s.fleet; delete f.paid; const out = {};
      out.oldBack = R.supplyBack(far, 'food', 0.5); out.farPrice = R.supplyCost(far);
      R.notePaid(lis, 'food', 0, 100, R.supplyCost(lis)); out.paid = f.paid.food; out.lisPrice = R.supplyCost(lis);
      out.backFar = R.supplyBack(far, 'food', 0.5);
      R.notePaid(far, 'food', 100, 200, R.supplyCost(far)); out.paid2 = f.paid.food;
      return out;
    });
    console.log('   ' + JSON.stringify(sup));
    ok(sup.oldBack === sup.farPrice * 0.5, '옛 저장(산 값 기록 없음): 이 항구 값의 절반');
    ok(sup.lisPrice < sup.farPrice ? sup.backFar === sup.lisPrice * 0.5 : sup.backFar <= sup.farPrice * 0.5, '싼 항구에서 산 식량은 비싼 항구에서도 산 값의 절반까지만 (' + sup.backFar + '닢/통)');
    ok(Math.abs(sup.paid2 - (sup.lisPrice + sup.farPrice) / 2) < 1e-9, '평균 산 값: ' + sup.paid2);

    // ---------------- [30b·c] 개척 도시 단계가 올라도 식물 특산물 · 산지 캐시
    const col = await page.evaluate(() => {
      const s = G.Game.state, R = G.R, CO = G.Colony, PT = G.PlantTrade, out = {};
      const site = CO.sites().find(x => x.nat === (CO.natCode())) || CO.sites()[0];
      const e = CO.plant(site.key); e.name = '산 후안'; e.stage = 1; CO.sync(e);
      const c = G.CITY_DATA[e.id], g0 = c.goods[0];
      out.origin = !!(R.origins()[g0] && R.origins()[g0][c.region]);
      const crop = Object.keys(G.GOOD).find(id => G.GOOD[id].plant && c.goods.indexOf(id) < 0);
      PT.state().at[e.id] = [crop]; PT.sync(); out.before = G.CITY_DATA[e.id].goods.indexOf(crop) >= 0;
      e.stage = 2; CO.sync(e); out.after = G.CITY_DATA[e.id].goods.indexOf(crop) >= 0;
      out.cropOrigin = !!(R.origins()[crop] && R.origins()[crop][c.region]);
      // [34] 문구 조사
      const L = G.COLONY_LINES;
      out.founded = CO.fill(L.founded, { place: '봄베이 섬', colony: '산 후안' }); out.founded2 = CO.fill(L.founded, { place: '봄베이 섬', colony: '노바 리스보아' });
      out.chosen = CO.fill(L.chosen, { place: '봄베이 섬', grant: 1 }).split('…')[0]; out.chosen2 = CO.fill(L.chosen, { place: '봄베이', grant: 1 }).split('…')[0];
      out.recv = s.log.map(l => String(l.t || l.text || l)).filter(t => /새 도시를 세울 곳으로/.test(t)).pop() || '';
      out.recvWant = '「' + site.name + '」' + G.U.jx(site.name, '을/를') + ' 받았다';
      return out;
    });
    console.log('   ' + JSON.stringify(col));
    ok(col.origin, '개척 도시 특산물이 그 지역 산지로 잡힌다 (산지 캐시를 비운다)');
    ok(col.before && col.after && col.cropOrigin, '개척 도시 단계가 올라도 심은 식물 특산물이 교역소에 남는다');
    ok(/「산 후안」을 세웠다/.test(col.founded) && /「노바 리스보아」를 세웠다/.test(col.founded2), '조사: ' + col.founded + ' / ' + col.founded2);
    ok(col.chosen === '봄베이 섬이라' && col.chosen2 === '봄베이라', '조사: ' + col.chosen + '… / ' + col.chosen2 + '…');
    ok(col.recv.indexOf(col.recvWant) >= 0, '조사: ' + col.recvWant);
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); if (errors.length) console.error(errors.join(' | ')); process.exitCode = 1; } finally { await browser.close(); }
})();
