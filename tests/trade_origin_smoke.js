/* 산 곳 기록 · 같은 도시에서 사서 되팔아 남기기 금지 (js/core/rules.js R.cargoLots · js/city/trade.js · js/city/misc.js)
   node tests/trade_origin_smoke.js */
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
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, UI = G.UI, R = G.R, c = G.CITY_DATA[0], other = G.CITY_DATA.find(x => x && x.id !== 0 && x.port), B = G.Scenes.city.B, T = B.trade, out = {};
      s.loc = Object.assign({}, s.loc, { mode: 'city', city: c.id });
      let pick = null, qty = null, sellRow = null;
      UI.say = async () => {}; UI.confirm = async () => true; UI.toast = () => {};
      UI.number = async (o) => (qty == null ? o.max : Math.min(qty, o.max));
      UI.window = (o) => ({ result: (async () => { if (pick == null) return null; const el = document.createElement('div'); el.innerHTML = o.html; const tr = el.querySelector('tr.click[data-id="' + pick + '"]'); if (o.onBuild) { o.onBuild(el, { close: (v) => { done = v; } }); } let done = null; if (tr) { if (o.onBuild) { o.onBuild(el, { close: (v) => { done = v; } }); tr.onclick(); } sellRow = tr.innerText; } const v = done; pick = null; return v; })() });
      if (G.Disc) G.Disc.checkTrade = () => [];
      const gid = R.cityGoods(c).find(id => G.GOOD[id] && !G.GOOD[id].nw && R.supply(c, id) >= 10);
      s.player.gold = 100000; s.fleet.cargo = {};
      // ① 리스본에서 10통 산다 → 산 곳 리스본
      pick = gid; qty = 10; await T.buy(c);
      const cg = s.fleet.cargo[gid];
      out.bought = cg && cg.q; out.lots = JSON.parse(JSON.stringify(R.cargoLots(cg))); out.fromText = R.cargoFromText(cg);
      // ② 깎아 산 것처럼 산 값이 시세보다 한참 낮아도 — 그 자리에서는 산 값까지만
      const mkt = T.estimate(c, gid, 1).first;
      cg.cost = 5; cg.lots[c.id].cost = 5;
      const g0 = s.player.gold; pick = gid; qty = 10; await T.sell(c);
      out.ownSell = { got: s.player.gold - g0, mkt, left: s.fleet.cargo[gid] ? s.fleet.cargo[gid].q : 0, row: sellRow };
      // ③ 섞인 짐: 다른 항구에서 산 5통 + 여기서 산 5통 — 다른 곳 몫부터 시세로
      s.fleet.cargo = {}; s.fleet.cargo[gid] = { q: 10, cost: 5, from: other.id, d: s.day, lots: {} };
      s.fleet.cargo[gid].lots[other.id] = { q: 5, cost: 5 }; s.fleet.cargo[gid].lots[c.id] = { q: 5, cost: 5 };
      const g1 = s.player.gold; pick = gid; qty = 5; await T.sell(c);
      const cg2 = s.fleet.cargo[gid];
      out.mixed = { got: s.player.gold - g1, left: JSON.parse(JSON.stringify(cg2.lots)), text: R.cargoFromText(cg2) };
      // ④ 짐이 다른 곳에서 줄면(폭풍·의뢰…) 산 곳 몫도 맞춘다 · 옛 저장(산 곳 없음)
      s.fleet.cargo[gid] = { q: 10, cost: 50, from: c.id, d: s.day, lots: {} }; s.fleet.cargo[gid].lots[c.id] = { q: 6, cost: 50 }; s.fleet.cargo[gid].lots[other.id] = { q: 4, cost: 50 };
      s.fleet.cargo[gid].q = 5; const nl = R.cargoLots(s.fleet.cargo[gid]); out.norm = Object.keys(nl).reduce((a, k) => a + nl[k].q, 0);
      const old = { q: 4, cost: 100, from: other.id, d: s.day }; out.oldSave = JSON.stringify(R.cargoLots(old));
      const prize = { q: 3, cost: 0, from: null, prize: true }; out.prize = R.cargoFromText(prize);
      // ⑤ 시장 물건: 산 도시가 달라도 한 칸으로 묶고(산 곳마다 치른 값은 it.buys — rules.js R.addMarketItems), 산 도시 시장에서는 치른 값까지만
      s.player.items = [];
      R.addMarketItems('rapier', 1, c.id, 1); R.addMarketItems('rapier', 1, other.id, 1); R.addMarketItems('rapier', 1, c.id, 3);
      const one = s.player.items[0], buys = R.buysOf(one);
      const hereVal = B.market.sellValue(one);
      s.loc.city = other.id; const thereVal = B.market.sellValue(one); s.loc.city = c.id;
      out.items = { stacks: s.player.items.length, qty: R.itemQty(one), herePaid: buys[c.id], therePaid: buys[other.id], hereVal, thereVal };
      // ⑥ 수첩 함대: 적재 교역품의 산 곳
      s.fleet.cargo = {}; s.fleet.cargo[gid] = { q: 8, cost: 50, from: c.id, d: s.day, lots: {} }; s.fleet.cargo[gid].lots[c.id] = { q: 5, cost: 50 }; s.fleet.cargo[gid].lots[other.id] = { q: 3, cost: 60 };
      out.other = other.name; out.city = c.name; out.good = G.GOOD[gid].name;
      return out;
    });
    console.log('   ' + JSON.stringify(r).slice(0, 1200));
    ok(r.bought === 10 && r.lots[0] && r.lots[0].q === 10 && r.fromText === r.city, r.city + '에서 ' + r.good + ' 10통을 사면 산 곳 「' + r.fromText + '」');
    ok(r.ownSell.got === 50 && r.ownSell.left === 0 && r.ownSell.mkt > 5 && /여기서 산 10통/.test(r.ownSell.row), '그 자리에서 되팔면 산 값(5닢)까지만 — 시세 ' + r.ownSell.mkt + '닢이어도 10통에 ' + r.ownSell.got + '닢 (이익 0)');
    ok(r.mixed.got > 25 && r.mixed.left[0] && r.mixed.left[0].q === 5 && !Object.keys(r.mixed.left).some(k => k !== '0'), '섞인 짐 5통을 팔면 다른 곳(' + r.other + ')에서 산 몫부터 시세로 (' + r.mixed.got + '닢) — 남은 짐: ' + r.mixed.text);
    ok(r.norm === 5, '짐이 줄면 산 곳 몫도 맞춘다 (10 → 5)');
    ok(r.oldSave.indexOf('"q":4') > 0 && r.prize === '나포·노획', '옛 저장은 처음 산 곳으로, 나포한 짐은 「나포·노획」');
    ok(r.items.stacks === 1 && r.items.qty === 3 && r.items.herePaid === 2 && r.items.therePaid === 1 && r.items.hereVal === 2, '시장 물건: 산 도시가 달라도 한 칸(' + r.items.stacks + '칸 ' + r.items.qty + '개) · 산 곳마다 치른 값(평균 ' + r.items.herePaid + '·' + r.items.therePaid + '닢) · 산 도시 시장에서는 치른 값(' + r.items.hereVal + '닢)까지만');
    ok(r.items.thereVal <= 1, '다른 도시에서도 거기서 산 적이 있으면 그곳에서 치른 값까지만 (' + r.items.thereVal + '닢)');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) {
    console.error('✗', e.message); process.exitCode = 1;
  } finally { await browser.close(); }
})();
