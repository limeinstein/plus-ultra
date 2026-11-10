/* 대단한 거래 · 교역왕 (2026-11-10) — js/systems/tradeking.js
   ① 대륙 가르기 ② 매각(모두 판다·한 품목·한꺼번에)이 한 번의 이익으로 TK.sold에 닿는다
   ③ 100만 닢 미만은 기록만, 넘으면 그 대륙 업적 + 장면 ④ 1500년: 네 대륙이면 교역왕 ⑤ 1790년: 오세아니아도 필요
   node tests/tradeking_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); } catch (e) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function ok(v, msg) { if (!v) fail++; console.log((v ? '  ✓ ' : '  ✗ ') + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load|ERR_/.test(m.text())) errors.push(m.text()); });
  async function drain(p, max) {   // 장면·창을 넘기며 약속이 끝날 때까지
    for (let i = 0; i < (max || 60); i++) {
      if (await page.evaluate(() => window.__done)) break;
      const clicked = await page.evaluate(() => { const bs = [...document.querySelectorAll('.modal-back button.navy, .modal-back button.green')].filter(b => b.offsetParent); const b = bs[bs.length - 1]; if (b) { b.click(); return true; } return false; });
      if (!clicked) await page.keyboard.press('Enter');
      await page.waitForTimeout(250);
    }
    return page.evaluate(() => window.__res);
  }
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'trader', age: 24, birth: { m: 3, d: 3 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
      const s = G.Game.state; s.player.gold = 1000; s.date = { y: 1500, m: 6, d: 1 };
      G.UI.fade = async fn => { await fn(); };
      G.Game.go('city', { cityId: 0 });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city', null, { timeout: 30000 });
    for (let i = 0; i < 20 && await page.evaluate(() => G.UI.busy()); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(300); }

    // ① 대륙
    const cont = await page.evaluate(() => {
      const TK = G.TradeKing, by = n => G.CITY_DATA.find(c => c && c.name === n);
      const want = { 리스본: 'eu', 튀니스: 'af', 카이로: 'af', 세우타: 'af', 이스탄불: 'eu', 앙카라: 'as', 카잔: 'eu', 나가사키: 'as', 고아: 'as', 아바나: 'am', 시드니: 'oc', 암보이나: 'as' };
      const bad = Object.keys(want).filter(n => TK.continent(by(n)) !== want[n]);
      return { bad, ach: G.ACHIEVEMENTS.filter(a => /^bigdeal_|^tradeking$/.test(a.id)).map(a => a.id) };
    });
    ok(!cont.bad.length, '도시 → 대륙 (지중해의 마그레브·이집트는 아프리카, 아나톨리아는 아시아, 시드니는 오세아니아) ' + cont.bad.join(','));
    ok(cont.ach.join() === 'bigdeal_eu,bigdeal_af,bigdeal_as,bigdeal_am,bigdeal_oc,tradeking', '업적 6개 (대륙 다섯 + 교역왕)');

    // ② 매각 연결: 「모두 판다」 한 번 = TK.sold 한 번 (그 매각의 이익 전부)
    const wire = await page.evaluate(async () => {
      const s = G.Game.state, c = G.CITY_DATA[0], R = G.R, TK = G.TradeKing, calls = [];
      const orig = TK.sold; TK.sold = async (cc, p) => { calls.push({ c: cc.id, p }); };
      const imp = Object.keys(G.GOOD).filter(id => !R.sells(c, id) && !(G.Slave && G.Slave.is(id)) && R.sellPrice(c, id) > 50).slice(0, 2);
      s.portVisit = (s.portVisit || 0) + 1; s.day++;
      s.fleet.cargo = {}; imp.forEach(id => { s.fleet.cargo[id] = { q: 10, cost: 5, from: 7, d: s.day }; R.cargoLots(s.fleet.cargo[id]); });
      const p0 = s.stats.profit;
      window.__done = false;
      const pr = G.Scenes.city.B.trade.sell(c).then(() => { window.__done = true; });
      return { imp, p0, calls, restore: !!orig, pr: !!pr, fn: (window.__orig = orig, 1), cl: (window.__calls = calls, 1) };
    });
    // 「모두 판다」 → 확인 → 다 팔면 끝맺는 말
    await page.waitForSelector('.modal-back', { timeout: 10000 });
    await page.evaluate(() => { const b = [...document.querySelectorAll('.modal-back button')].find(x => /모두 판다/.test(x.textContent)); b.click(); });
    await page.waitForTimeout(400);
    await page.evaluate(() => { const b = [...document.querySelectorAll('.modal-back button')].find(x => /^(예|확인|판다|그렇게 한다)/.test(x.textContent.trim())) || document.querySelector('.modal-back button.green, .modal-back button.navy'); if (b) b.click(); });
    for (let i = 0; i < 20 && !(await page.evaluate(() => window.__done)); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(300); }
    const w2 = await page.evaluate(() => { const s = G.Game.state; G.TradeKing.sold = window.__orig; return { calls: window.__calls, profit: s.stats.profit, left: Object.keys(s.fleet.cargo).length }; });
    ok(w2.left === 0 && w2.calls.length === 1 && w2.calls[0].c === 0 && w2.calls[0].p > 0 && w2.calls[0].p === w2.profit - wire.p0, '「모두 판다」 한 번 → TK.sold(리스본, 그 매각의 이익 ' + (w2.calls[0] || {}).p + ')');

    // ③ 100만 미만은 기록만 → 넘으면 「유럽의 대단한 거래」
    const r3 = await page.evaluate(async () => {
      const s = G.Game.state, TK = G.TradeKing, AC = G.Achieve;
      const g = await TK.sold(G.CITY_DATA[0], 999999);
      return { got: g.length, best: TK.best('eu'), done: AC.done('bigdeal_eu'), rows: AC.progress(AC.get('bigdeal_eu')).rows };
    });
    ok(r3.got === 0 && !r3.done && r3.best === 999999 && r3.rows[0].count === 999999 && r3.rows[0].n === 1000000 && r3.rows[0].money, '99만 9999닢: 기록만 (진행 999,999/1,000,000닢)');
    await page.evaluate(() => { window.__done = false; const s = G.Game.state; window.__f0 = G.Fame.get('tr'); G.TradeKing.sold(G.CITY_DATA[0], 1250000).then(g => { window.__res = g.map(a => a.id); window.__done = true; }); });
    await page.waitForTimeout(1400);
    const scene = await page.evaluate(() => ({ rib: (document.querySelector('.achv-ribbon') || {}).textContent || '', txt: document.body.innerText.slice(0, 4000) }));
    const g3 = await drain();
    const a3 = await page.evaluate(() => ({ done: G.Achieve.done('bigdeal_eu'), fame: G.Fame.get('tr') - window.__f0, titles: G.Achieve.titles(), best: G.TradeKing.best('eu'), bd: G.Game.state.bigDeal.eu }));
    ok(g3 && g3.indexOf('bigdeal_eu') >= 0 && a3.done && /유럽의 대단한 거래/.test(scene.rib), '125만 닢 한 번 → 「유럽의 대단한 거래」 장면 (금빛 띠)');
    ok(a3.fame >= 600 && a3.titles.indexOf('유럽의 큰손') >= 0 && a3.bd.c === 0 && a3.best === 1250000, '보상: 교역 명성 +' + a3.fame + ' · 칭호 「유럽의 큰손」 · 기록 (리스본 1,250,000)');

    // ④ 1500년: 오세아니아는 아직 교역소가 없다 → 네 대륙이면 교역왕
    await page.evaluate(() => {
      const TK = G.TradeKing, AC = G.Achieve, by = n => G.CITY_DATA.find(c => c && c.name === n);
      const rows0 = AC.progress(AC.get('tradeking')).rows.map(r => r.label);
      window.__done = false;
      (async () => { const g1 = await TK.sold(by('튀니스'), 1100000); const g2 = await TK.sold(by('고아'), 1000000);
        window.__res = { rows0, g: g1.concat(g2).map(a => a.id), king: AC.done('tradeking') }; window.__done = true; })();
    });
    const r4 = await drain(80);
    ok(r4.rows0 && r4.rows0.length === 4 && r4.rows0.indexOf('오세아니아의 대단한 거래') < 0, '1500년 교역왕 조건: 유럽·아프리카·아시아·아메리카 넷 (오세아니아 없음)');
    ok(r4.g && r4.g.join() === 'bigdeal_af,bigdeal_as' && !r4.king, '아프리카(튀니스)·아시아(고아) 달성, 아직 교역왕 아님');
    await page.evaluate(() => { window.__done = false; window.__g0 = G.Game.state.player.gold; G.TradeKing.sold(G.CITY_DATA.find(c => c && c.name === '아바나'), 3000000).then(g => { window.__res = g.map(a => a.id); window.__done = true; }); });
    const g5 = await drain(80);
    const a5 = await page.evaluate(() => ({ king: G.Achieve.done('tradeking'), gold: G.Game.state.player.gold - window.__g0, titles: G.Achieve.titles() }));
    ok(g5 && g5.join() === 'bigdeal_am,tradeking' && a5.king && a5.gold === 200000 && a5.titles.indexOf('교역왕') >= 0, '아메리카(아바나) → 「신대륙의 대단한 거래」와 「교역왕」 (금화 +' + a5.gold + ', 칭호 교역왕)');

    // ⑤ 1790년 (시드니가 있다): 오세아니아도 교역왕의 조건
    const r6 = await page.evaluate(() => {
      const s = G.Game.state, AC = G.Achieve; const keep = s.achv; s.achv = { bigdeal_eu: { d: 1 }, bigdeal_af: { d: 1 }, bigdeal_as: { d: 1 }, bigdeal_am: { d: 1 } };
      s.date = { y: 1790, m: 1, d: 1 };
      const p = AC.progress(AC.get('tradeking'));
      s.achv = keep; s.date = { y: 1500, m: 6, d: 1 };
      return { rows: p.rows.map(r => r.label + ' ' + r.count + '/' + r.n), done: p.done };
    });
    ok(r6.rows.length === 5 && !r6.done && r6.rows.indexOf('오세아니아의 대단한 거래 0/1') >= 0, '1790년: 네 대륙만으로는 교역왕이 아니다 — 오세아니아 0/1');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } catch (e) { fail++; console.error('✗', e.message); } finally { await browser.close(); }
  console.log(fail ? '\n실패 ' + fail : '\n통과');
  process.exitCode = fail ? 1 : 0;
})();
