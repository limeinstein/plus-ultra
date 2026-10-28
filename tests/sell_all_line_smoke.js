/* 교역소·시장에서 물건을 다 판 뒤의 말 (js/city/trade.js T.sell · js/city/misc.js MK.sell)
   · 교역소 「모두 판다」 → 짐칸이 비면 제독이 거래를 마무리하는 말 (「무엇을 팔겠다는 건가?」가 아니다)
   · 교역소에서 마지막 품목을 낱개로 팔아 비워도 같은 마무리
   · 처음부터 짐이 없으면 그대로 「응? 도대체 무엇을 팔겠다는 건가?」
   · 시장에서 마지막 물건을 팔면 상인이 「다 받았네」, 처음부터 없으면 그대로. 콘솔 오류 0
   node tests/sell_all_line_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, UI = G.UI, c = G.CITY_DATA[0], B = G.Scenes.city.B, out = {};
      let said = [], winQ = [];
      UI.say = async (t, w) => { said.push({ t: String(t), who: w && w.name }); };
      UI.confirm = async () => true;
      UI.toast = () => {};
      UI.number = async (o) => o.max;
      UI.window = () => ({ result: Promise.resolve(winQ.length ? winQ.shift() : null) });
      UI.choose = async () => (winQ.length ? winQ.shift() : null);
      if (G.Disc) { G.Disc.checkTrade = () => []; }
      const goods = Object.keys(G.GOOD).slice(0, 2);
      const load = () => { s.fleet.cargo = {}; goods.forEach(id => { s.fleet.cargo[id] = { q: 5, cost: 100, d: s.day }; }); };
      // ① 모두 판다
      load(); said = []; winQ = ['all'];
      await B.trade.sell(c);
      out.all = { said: said.slice(), left: Object.keys(s.fleet.cargo).length };
      // ② 낱개로 마지막까지
      s.fleet.cargo = {}; s.fleet.cargo[goods[0]] = { q: 3, cost: 100, d: s.day };
      said = [];
      const W0 = UI.window; UI.window = (o) => { let picked = false; return { result: new Promise(res => { const el = document.createElement('div'); el.innerHTML = o.html; const tr = el.querySelector('tr.click'); if (o.onBuild && tr) o.onBuild(el, { close: (v) => { picked = true; res(v); } }); if (tr) tr.onclick(); if (!picked) res(null); }) }; };
      await B.trade.sell(c);
      UI.window = W0;
      out.one = { said: said.slice(), left: Object.keys(s.fleet.cargo).length };
      // ③ 처음부터 빈 짐칸
      s.fleet.cargo = {}; said = [];
      await B.trade.sell(c);
      out.empty = said.slice();
      // ④ 시장: 마지막 물건을 판다 / 처음부터 없음
      const MK = B.market;
      const itemId = Object.keys(G.ITEM).find(id => !G.ITEM[id].evidence && G.ITEM[id].price);
      s.player.items = [{ id: itemId }]; said = []; winQ = [];
      MK.sellPick = async (c2, list) => list.map(x => ({ x: x, q: G.R.itemQty(x.it), val: MK.sellValue(x.it) }));   // 매각 창(2026-10-28 여러 개 고르기)에서 모두 고른 셈
      if (MK && MK.sell) { await MK.sell(c); out.mk = said.slice(); s.player.items = []; said = []; await MK.sell(c); out.mkEmpty = said.slice(); }
      out.me = s.player.name;
      return out;
    });
    console.log('   ' + JSON.stringify(r).slice(0, 900));
    const bad = /무엇을 팔겠다는/;
    const last = a => a[a.length - 1] || {};
    ok(r.all.left === 0 && !r.all.said.some(x => bad.test(x.t)) && last(r.all.said).who === r.me, '「모두 판다」 뒤: 제독의 마무리 말 — ' + last(r.all.said).t);
    ok(r.one.left === 0 && !r.one.said.some(x => bad.test(x.t)) && last(r.one.said).who === r.me, '낱개로 마지막 품목까지 팔아도 마무리 말 — ' + last(r.one.said).t);
    ok(r.empty.length === 1 && bad.test(r.empty[0].t), '처음부터 짐이 없으면 그대로 「무엇을 팔겠다는 건가?」');
    if (r.mk) {
      ok(!r.mk.some(x => bad.test(x.t)) && /다 받았네/.test(last(r.mk).t), '시장: 마지막 물건을 팔면 「' + last(r.mk).t + '」');
      ok(r.mkEmpty.length === 1 && bad.test(r.mkEmpty[0].t), '시장: 처음부터 없으면 그대로');
    }
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) {
    console.error('✗', e.message); process.exitCode = 1;
  } finally { await browser.close(); }
})();
