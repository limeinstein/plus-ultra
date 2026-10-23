/* 교역소 일괄 거래 (2026-10-19) — js/city/trade.js T.batch
   · 구입·매각 표 왼쪽 네모로 여러 품목을 골라 「고른 것 한꺼번에 산다/판다」
   · 일괄 창: 품목마다 수량(짐칸·무게·돈·재고 안에서 고르게 나눈 기본값, 고쳐 쓸 수 있다), 합계
   · 결제 전 흥정: 회계 단계만큼 1차·2차·3차 — 성공하면 값이 더 깎이고(파는 쪽은 웃돈), 실패하면 그대로. 회계 0이면 1번, 3이면 3번
   · 산 값·짐칸이 맞다 · 팔 때 웃돈은 들여온 물건에만 · 콘솔 오류 0
   node tests/trade_batch_smoke.js */
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
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  const btn = async (re) => { await page.waitForFunction(r => Array.from(document.querySelectorAll('.foot button')).some(b => b.offsetParent && new RegExp(r).test(b.textContent)), re.source, { timeout: 8000 }); await page.evaluate(r => { const b = Array.from(document.querySelectorAll('.foot button')).filter(x => x.offsetParent && new RegExp(r).test(x.textContent)).pop(); b.click(); }, re.source); await page.waitForTimeout(250); };
  const hasBtn = (re) => page.evaluate(r => Array.from(document.querySelectorAll('.foot button')).some(b => b.offsetParent && new RegExp(r).test(b.textContent)), re.source);
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(() => G.Game.go('create'));
    await page.waitForSelector('#nm');
    await page.fill('#nm', '이강희'); await page.press('#nm', 'Enter');
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state, null, { timeout: 90000 });
    await page.evaluate(() => {
      const s = G.Game.state; s.player.gold = 200000; s.fleet.cargo = {}; s.player.sk.acct = 0; s.mates = s.mates.filter(m => m.role !== 'purser');
      G.UI.say = async () => {}; window.__R = G.U.rng; window.__want = null;
      G.U.rng = function () { return window.__want == null ? window.__R() : window.__want; };   // 흥정의 성패를 정한다 (U.chance)
      G.Disc.checkTrade = () => [];
    });
    // ---------------- 구입: 두 품목을 골라 일괄 구입, 1차 흥정 성공
    const c0 = await page.evaluate(() => { const c = G.CITY_DATA[0], T = G.Scenes.city.B.trade; window.__p = T.buy(c); return G.R.cityGoods(c).slice(0, 2).map(id => [id, T.buyP(c, id)]); });
    await page.waitForSelector('input.bpick');
    const nBox = await page.evaluate(() => document.querySelectorAll('input.bpick').length);
    ok(nBox >= 2, '구입 표에 품목마다 고르는 네모 (' + nBox + '개)');
    await page.evaluate(ids => ids.forEach(id => document.querySelector('input.bpick[data-id="' + id + '"]').click()), c0.map(x => x[0]));
    await btn(/고른 것 한꺼번에 산다/);
    await page.waitForSelector('input.bq');
    const q0 = await page.evaluate(() => Array.from(document.querySelectorAll('input.bq')).map(i => [i.dataset.id, +i.value]));
    ok(q0.length === 2 && q0.every(x => x[1] > 0), '일괄 구입 창: 두 품목 기본 수량 ' + q0.map(x => x[1]).join('·') + '통');
    // 수량을 고쳐 쓴다
    await page.evaluate(() => { const i = document.querySelectorAll('input.bq')[0]; i.value = 5; i.onchange(); });
    await page.waitForFunction(() => document.querySelectorAll('input.bq').length === 2 && +document.querySelectorAll('input.bq')[0].value === 5);
    ok(await hasBtn(/흥정한다 \(1차\)/), '회계 0: 「흥정한다 (1차)」');
    await page.evaluate(() => { window.__want = 0; });
    await btn(/흥정한다 \(1차\)/);
    await page.waitForFunction(() => /일괄 흥정 −\d+%/.test(document.body.innerText));
    const d1 = await page.evaluate(() => document.body.innerText.match(/일괄 흥정 −(\d+)%/)[1]);
    ok(+d1 >= 3, '1차 흥정 성공 — 일괄 할인 −' + d1 + '%');
    ok(!(await hasBtn(/흥정한다/)), '회계 0은 한 번뿐 — 2차 흥정 단추가 없다');
    const before = await page.evaluate(() => ({ gold: G.Game.state.player.gold, q: Array.from(document.querySelectorAll('input.bq')).map(i => [i.dataset.id, +i.value]), p: Array.from(document.querySelectorAll('input.bq')).map(i => G.Scenes.city.B.trade.buyP(G.CITY_DATA[0], i.dataset.id)),
      shown: +Array.from(document.querySelectorAll('table.batch tr')).pop().querySelectorAll('td')[1].querySelector('b').textContent.replace(/,/g, '') }));
    await btn(/^산다$/);
    await btn(/돌아간다/);
    await page.evaluate(() => window.__p);
    const after = await page.evaluate(q => { const s = G.Game.state; return { gold: s.player.gold, cargo: q.map(x => s.fleet.cargo[x[0]] ? s.fleet.cargo[x[0]].q : 0) }; }, before.q);
    const full = before.q.reduce((n, x, i) => n + x[1] * before.p[i], 0), expect = before.shown;
    console.log('   ' + JSON.stringify({ before, after, expect }));
    ok(after.cargo.join() === before.q.map(x => x[1]).join(), '짐칸에 고른 수량 그대로 (' + after.cargo.join('·') + '통)');
    ok(before.gold - after.gold === expect && expect < full, '치른 돈 ' + (before.gold - after.gold) + '닢 = 창에 보인 합계 (할인 전 ' + full + '닢)');

    // ---------------- 회계 3: 세 번 — 1차 성공·2차 실패·3차 성공, 실패해도 값은 그대로
    const r3 = await page.evaluate(async () => {
      const s = G.Game.state, c = G.CITY_DATA[0], T = G.Scenes.city.B.trade; s.player.sk.acct = 3;
      s.portVisit = (s.portVisit || 0) + 1; s.day++;   // 새 입항 — 흥정 횟수·일괄 흥정은 한 입항 동안 이어진다 (QA 2026-10-23)
      return { tries: T.batchTries() };
    });
    ok(r3.tries === 3, '회계 3: 흥정 3번');
    await page.evaluate(() => { const c = G.CITY_DATA[0]; window.__p = G.Scenes.city.B.trade.batch(c, 'buy', G.R.cityGoods(c).slice(2, 4)); });
    await page.waitForSelector('input.bq');
    await page.evaluate(() => { window.__want = 0; }); await btn(/흥정한다 \(1차\)/);
    const a1 = await page.evaluate(() => +(document.body.innerText.match(/일괄 흥정 −(\d+)%/) || [0, 0])[1]);
    await page.evaluate(() => { window.__want = 0.9999; }); await btn(/흥정한다 \(2차\)/);
    const a2 = await page.evaluate(() => ({ d: +(document.body.innerText.match(/일괄 흥정 −(\d+)%/) || [0, 0])[1], fail: /2차 흥정 실패/.test(document.body.innerText) }));
    await page.evaluate(() => { window.__want = 0; }); await btn(/흥정한다 \(3차\)/);
    const a3 = await page.evaluate(() => +(document.body.innerText.match(/일괄 흥정 −(\d+)%/) || [0, 0])[1]);
    console.log('   회계 3: ' + a1 + '% → (실패) ' + a2.d + '% → ' + a3 + '%');
    ok(a1 > 0 && a2.fail && a2.d === a1 && a3 > a1, '1차 성공 −' + a1 + '% · 2차 실패(값 그대로) · 3차 성공 −' + a3 + '%');
    ok(!(await hasBtn(/흥정한다/)), '세 번 뒤에는 흥정 단추가 없다');
    await btn(/돌아간다/); await page.evaluate(() => window.__p);

    // ---------------- 매각: 들여온 물건(다른 도시에서 산 것)은 웃돈, 이 도시에서 나는 물건은 웃돈 없음
    const sres = await page.evaluate(async () => {
      const s = G.Game.state, c = G.CITY_DATA[0], R = G.R, T = G.Scenes.city.B.trade;
      s.portVisit = (s.portVisit || 0) + 1; s.day++;   // 새 입항
      const imp = Object.keys(G.GOOD).find(id => !R.sells(c, id) && !(G.Slave && G.Slave.is(id)) && R.sellPrice(c, id) > 50);
      const loc = R.cityGoods(c).find(id => R.sells(c, id));
      s.fleet.cargo = {}; s.fleet.cargo[imp] = { q: 20, cost: 50, from: 7, d: s.day }; R.cargoLots(s.fleet.cargo[imp]);
      s.fleet.cargo[loc] = { q: 200, cost: 5, from: 7, d: s.day }; R.cargoLots(s.fleet.cargo[loc]);
      const eImp = T.estimate(c, imp, 20).total, eLoc = T.estimate(c, loc, 200).total;
      window.__want = 0;
      const g0 = s.player.gold;
      window.__p = T.batch(c, 'sell', [imp, loc]);
      return { imp, loc, eImp, eLoc, g0 };
    });
    await page.waitForSelector('input.bq');
    await btn(/흥정한다 \(1차\)/);
    await page.waitForFunction(() => /일괄 흥정 \+\d+%/.test(document.body.innerText));
    const sd = await page.evaluate(() => +document.body.innerText.match(/일괄 흥정 \+(\d+)%/)[1]);
    await btn(/^판다$/);
    await page.evaluate(() => window.__p);
    const sg = await page.evaluate(() => ({ gold: G.Game.state.player.gold, left: Object.keys(G.Game.state.fleet.cargo).length }));
    const got = sg.gold - sres.g0, plain = sres.eImp + sres.eLoc;
    console.log('   매각: 받은 돈 ' + got + ' · 웃돈 없이 ' + plain + ' · 웃돈 ' + sd + '%');
    ok(sg.left === 0 && got > plain && got - plain <= Math.round(sres.eImp * (sd + 1) / 100) + 3 && got - plain >= Math.round(sres.eImp * (sd - 1) / 100), '일괄 매각: 다 팔고, 웃돈 +' + sd + '%는 들여온 물건(' + sres.imp + ')에만 (+' + (got - plain) + '닢)');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); try { console.error((await page.evaluate(() => document.body.innerText)).slice(0, 1500)); } catch (x) {} process.exitCode = 1; } finally { await browser.close(); }
})();
