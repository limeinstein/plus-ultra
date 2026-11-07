/* 교역 1억 QA (2026-11-07) — 페이지 안 교역 봇 (window.TB). tools/qa_longrun/qalib.js(QA) 다음에 넣는다.
   · 사고팔기는 게임 함수 그대로: T.buyP·T.sellP(값) · R.supply(재고) · T.applyBuy·T.sellQty(거래·포화·유행·명성) · 일괄 흥정은 T.batch 와 같은 셈(회계·경리·확률)
   · 항해는 빠른 길: 날수 = G.Routes.estDays(실제 뱃길 길이 ÷ 함대 평균 선속) × windK, 그 날수만큼 QA.pass(세상·시장·급료·사건·수명이 실제로 흐름) — 바다 위 폭풍·해적은 없다(따로 실제 항해 표본으로 잰다)
   · 머리(brain): 'oracle' = 갈 곳의 지금 시세를 다 안다 / 'ledger' = 들러 본 교역소의 시세 수첩(G.Ledger)만 안다 — 모르는 항구는 둘러보러 간다
   · 배: 돈이 쌓이면 조선소에서 짐칸이 큰 배를 사고(5척까지) 작은 배를 판다 · 선원은 최소 인원 + 여유 · 식량·물은 그 구간 날수만큼 */
(function () {
  'use strict';
  var TB = window.TB = { legs: [], notes: [], opt: {} };
  function S() { return G.Game.state; }
  var R, U, C, T, Y, RT;
  function bind() { R = G.R; U = G.U; C = G.Scenes.city; T = C.B.trade; Y = C.B.shipyard; RT = G.Routes; }
  function rnd() { return Math.random(); }
  function wealth() { var p = S().player; return Math.round(p.gold + (p.bank || 0)); }
  TB.wealth = wealth;
  function cargoValueAt(c) { var s = S(), v = 0; for (var id in s.fleet.cargo) v += s.fleet.cargo[id].q * (s.fleet.cargo[id].cost || 0); return v; }
  function goodsHere(c) { var y = S().date.y; return R.cityGoods(c).filter(function (id) { return G.GOOD[id] && (!G.GOOD[id].nw || c.region === 10 || y >= 1520) && !(G.Sakoku && G.Sakoku.tradeBlock(c, id, 'buy')); }); }
  function entryOK(c) { try { return !G.Scenes.city.entryCheck(c); } catch (e) { return false; } }
  function tradeOK(c) { return R.facilities(c).trade && !(G.Rel && G.Rel.embargo && G.Rel.embargo(c)); }
  function BD() { var d = { base: 0.03, perAcct: 0.015, purser: 0.015, bulkPer: 2000, bulkMax: 0.03, cap: 0.22, sellK: 0.7, fade: 0.8, floor: 0.8, ceil: 1.2 }, b = (G.BALANCE && G.BALANCE.batchDeal) || {}, o = {}, k; for (k in d) o[k] = b[k] == null ? d[k] : b[k]; return o; }

  // ---------------------------------------------------------------- 일괄 흥정 (T.batch 의 「흥정한다」를 그대로 셈)
  function dealDisc(c, buy, nq) {
    if (!(C.langLv(c) > 0)) return 0;
    var K = BD(), tries = T.batchTries(), cap = T.batchCap(buy), disc = 0, fails = 0;
    var odds = T.haggleOdds(c), retry = (G.BALANCE && G.BALANCE.acct && G.BALANCE.acct.retryK) || 0.7;
    for (var used = 1; used <= tries && disc < cap - 1e-9; used++) {
      var p = odds.p * Math.pow(K.fade, used - 1 - fails) * Math.pow(retry, fails);
      if (U.chance(p)) { disc = Math.min(cap, disc + T.batchStep(c, nq) * (used > 1 ? 0.7 : 1)); if (G.Growth) G.Growth.haggle(); }
      else fails++;
    }
    var B = BD(); if (buy && B.floor != null) disc = Math.min(disc, 1 - B.floor); if (!buy && B.ceil != null) disc = Math.min(disc, (B.ceil - 1) / (B.sellK || 0.7));   // 값 깎기·흥정 합쳐 ×0.8 · ×1.2 (G.BALANCE.batchDeal.floor·ceil)
    return disc;
  }
  /** 이 도시에서 q통 팔면 받을 돈 (실제로 팔지 않고 시장을 되돌린다 — T.estimate 와 같은 셈) */
  function estSell(c, id, q) {
    if (q <= 0) return 0;
    var m = R.market(c.id), st = m.g[id] ? { sat: m.g[id].sat, dep: m.g[id].dep, stockOut: m.g[id].stockOut } : null;
    var sn = G.Econ ? G.Econ.snap(c) : null, total = 0, left = q, chunk = Math.max(1, Math.ceil(q / 10));
    while (left > 0) { var n = Math.min(chunk, left); total += T.sellP(c, id) * n; R.onSell(c, id, n); left -= n; }
    if (st) m.g[id] = st; else delete m.g[id];
    if (G.Econ) G.Econ.restore(c, sn);
    return total;
  }
  TB.estSell = estSell;

  // ---------------------------------------------------------------- 팔기
  function sellAll(c, why) {
    var s = S(), out = [], K = BD();
    var ids = Object.keys(s.fleet.cargo).filter(function (id) { return !(G.Sakoku && G.Sakoku.tradeBlock(c, id, 'sell')); });
    if (!ids.length || !tradeOK(c)) return out;
    var pick = ids.filter(function (id) {
      var cg = s.fleet.cargo[id]; if (!cg || cg.q <= 0) return false;
      var est = estSell(c, id, cg.q), unit = est / cg.q, age = s.day - cg.d;
      if (why === 'dump') return true;
      if (TB.plan && TB.plan.to === c.id && TB.plan.goods && TB.plan.goods[id]) return unit >= cg.cost * (TB.opt.lossOk || 0.75) || age > 240;
      return unit >= cg.cost * 1.05 || age > 300;
    });
    if (!pick.length) return out;
    var nq = 0; pick.forEach(function (id) { nq += s.fleet.cargo[id].q; });
    var disc = dealDisc(c, false, nq);
    pick.forEach(function (id) {
      var cg = s.fleet.cargo[id]; if (!cg) return;
      var q = cg.q, cost = cg.cost, g0 = s.player.gold;
      var sold = T.sellQty(c, id, q);
      var bon = R.sells(c, id) ? 0 : Math.round((sold.otherTotal || 0) * disc * K.sellK);
      if (bon) { s.player.gold += bon; s.stats.profit += bon; }
      out.push({ g: id, q: q, rev: s.player.gold - g0, cost: cost * q, profit: s.player.gold - g0 - cost * q, from: cg.from });
    });
    return out;
  }

  // ---------------------------------------------------------------- 배·선원·보급
  function shipBuy(c) {
    var s = S(), f = s.fleet, out = null;
    if (!R.facilities(c).shipyard || !TB.opt.ships) return null;
    var types = Y.types(c).filter(function (id) { return !Y.locked(c, id); });
    if (!types.length) return null;
    var best = null;
    types.forEach(function (id) { var t = G.SHIP[id], p = Y.priceOf(c, id); var v = t.cap / p; if (t.cap >= 120 && (!best || t.cap > best.cap || (t.cap === best.cap && p < best.p))) best = { id: id, cap: t.cap, p: p, v: v }; });
    if (!best) return null;
    var minSh = f.ships.slice(1).concat([]).sort(function (a, b) { return a.cap - b.cap; })[0];
    var full = f.ships.length >= (G.MAX_SHIPS || 5);
    var gold = s.player.gold, K = TB.opt.shipK || 4;
    if (!full && gold > best.p * K) {
      var sh = R.newShip(best.id, null, G.Ships ? G.Ships.localWood(c).id : null); f.ships.push(sh); s.player.gold -= best.p; out = { buy: best.id, p: best.p };
    } else if (full && minSh && best.cap > minSh.cap * 1.4 && gold > best.p * K * 1.5) {
      var v = R.shipValue(minSh); f.ships.splice(f.ships.indexOf(minSh), 1); s.player.gold += v;
      var sh2 = R.newShip(best.id, null, G.Ships ? G.Ships.localWood(c).id : null); f.ships.push(sh2); s.player.gold -= best.p; out = { buy: best.id, p: best.p, sold: minSh.type, v: v };
    }
    // 기함이 작으면 바꾼다 (기함 = ships[0])
    if (!out && f.ships[0] && best.cap > f.ships[0].cap * 1.6 && gold > best.p * K * 2 && f.ships.length > 1) {
      var old = f.ships[0], v2 = R.shipValue(old), nw = R.newShip(best.id, old.name, G.Ships ? G.Ships.localWood(c).id : null);
      f.ships[0] = nw; s.player.gold += v2 - best.p; out = { flag: best.id, p: best.p, sold: old.type, v: v2 };
    }
    return out;
  }
  function crewUp(c) {
    var s = S(), f = s.fleet, want = Math.ceil(R.crewMin() * 1.1) + 2, mx = U.sum(f.ships, function (x) { return x.crewMax; });
    want = Math.min(want, mx);
    if (f.crew < want) { var n = want - f.crew, cost = n * R.hireCost(c); if (s.player.gold > cost) { s.player.gold -= cost; f.crew += n; TB.cost.hire += cost; } }
    else if (f.crew > want + 10 && G.Scenes.city.B.harbor.trimCrew) { f.crew = want; }
  }
  function repair(c) {
    var s = S(), tot = 0;
    s.fleet.ships.forEach(function (sh) {
      if (sh.hp >= sh.maxHp) return;
      var k = G.Ships && G.Ships.repairK ? G.Ships.repairK(sh, c) : 1, cost = Math.ceil((sh.maxHp - sh.hp) * G.SHIP[sh.type].price / sh.maxHp * 0.32 * k);
      if (s.player.gold > cost) { s.player.gold -= cost; sh.hp = sh.maxHp; tot += cost; }
    });
    TB.cost.repair += tot;
  }
  function provision(c, days) {
    var s = S(), f = s.fleet, need = Math.ceil(R.dailyUse() * days * 1.25) + 3, tot = 0;
    ['food', 'water'].forEach(function (k) {
      if (f[k] >= need) return;
      var q = need - Math.floor(f[k]), unit = R.supplyPrice(c, k), cost = q * unit;
      if (s.player.gold < cost) q = Math.floor(s.player.gold / unit), cost = q * unit;
      if (q <= 0) return;
      if (R.notePaid) R.notePaid(c, k, f[k], f[k] + q, unit);
      f[k] += q; s.player.gold -= cost; tot += cost;
    });
    TB.cost.supply += tot;
  }

  // ---------------------------------------------------------------- 계획: 어디로, 무엇을
  var SATK = null;
  function avgSaleK(c, id, q) {   // 오라클이 아닐 때(수첩 값) — 판 만큼 떨어지는 몫을 시장 셈으로 어림 (지금 포화 0에서)
    var K = (G.BALANCE && G.BALANCE.market) || {}, a = K.satPrice || 0.55, cr = K.crash || 0, cap = R.satCap(c, id), n = 10, sum = 0;
    for (var i = 0; i < n; i++) { var x = (i + 0.5) / n * q / cap; sum += Math.exp(-x * a - cr * Math.max(0, x - 1)); }
    return sum / n;
  }
  /** 빠른 어림 (계획용): 지금 값 p0 에서 판 만큼 포화가 늘어 값이 떨어진다 — R.satFactor 그대로. 계획 한 번 동안 (도시·물건) 값을 기억 */
  var MEMO = {};
  function estFast(D, id, q) {
    var k = D.id + ':' + id, m = MEMO[k];
    if (!m) { var mk = R.market(D.id), st = mk.g[id], sat0 = st ? st.sat : 0; m = MEMO[k] = { p0: T.sellP(D, id), f0: R.satFactor(sat0), sat0: sat0, cap: R.satCap(D, id) }; }
    if (!(m.p0 > 0)) return 0;
    var base = m.p0 / Math.max(1e-6, m.f0), total = 0, left = q, chunk = Math.max(1, Math.ceil(q / 10)), sat = m.sat0;
    while (left > 0) { var n = Math.min(chunk, left); total += Math.max(1, Math.round(base * R.satFactor(sat))) * n; sat += n / m.cap; left -= n; }
    return total;
  }
  function priceAt(D, id, q) {
    if (TB.opt.brain === 'oracle') return estFast(D, id, q);
    var row = (S().ledger || {})[D.id]; if (!row || S().day - row.t > (G.Ledger.OLD || 540)) return null;
    var p = row.s[G.GOOD[id].idx]; if (!p) return null;
    return p * q * avgSaleK(D, id, q);
  }
  function legDays(a, b) {
    var d = RT.estDays(a, b); if (d == null) return null;
    return Math.max(1, Math.round(d * (TB.opt.windK || 1)));
  }
  function candidates(c) {
    var s = S(), here = c, v = Math.max(0.3, G.Plan.avgSpeed()), maxD = TB.opt.maxLeg || 45, out = [];
    G.CITY_DATA.forEach(function (d) {
      if (!d || d.id === c.id || !d.port || !R.cityExists(d) || !tradeOK(d)) return;
      var line = Math.hypot(G.Geo.wrapLon((d.dock ? d.dock[1] : d.lon) - (c.dock ? c.dock[1] : c.lon)), (d.dock ? d.dock[0] : d.lat) - (c.dock ? c.dock[0] : c.lat));
      if (line / v > maxD) return;
      out.push({ c: d, line: line });
    });
    out.sort(function (a, b) { return a.line - b.line; });
    // 가까운 항구 nNear 곳 + 먼 항구 가운데 큰 곳 nFar 곳 (먼 뱃길 장사도 보게)
    var near = out.slice(0, TB.opt.nNear || 28), far = out.slice(TB.opt.nNear || 28).sort(function (a, b) { return (b.c.size || 0) - (a.c.size || 0) || a.line - b.line; }).slice(0, TB.opt.nFar || 22);
    out = near.concat(far);
    var ok = [];
    out.forEach(function (o) { if (!entryOK(o.c)) return; var days = legDays(c.id, o.c.id); if (days == null || days > maxD) return; o.days = days; ok.push(o); });
    return ok;
  }
  /** from 에서 D 로 가는 한 구간의 장사: ctx = {cargo, room, budget, kinds} */
  function evalLeg(c, D, days, goods, ctx) {
    var held = 0;   // 실은 짐을 그곳에서 팔 때
    for (var id in ctx.cargo) { var v = priceAt(D, id, ctx.cargo[id].q); if (v) held += v - ctx.cargo[id].q * ctx.cargo[id].cost; }
    var opts = [];
    goods.forEach(function (id) {
      var bp = T.buyP(c, id), stock = R.supply(c, id); if (stock <= 0 || bp <= 0) return;
      var maxQ = Math.min(stock, Math.max(0, ctx.room), Math.floor(Math.max(0, ctx.budget) / bp));
      if (maxQ < 3) return;
      var bestQ = null;
      [0.1, 0.2, 0.35, 0.5, 0.7, 1].forEach(function (k) {
        var q = Math.max(3, Math.floor(maxQ * k)), rev = priceAt(D, id, q); if (rev == null) return;
        var pr = rev - q * bp * (1 - (TB.opt.expDisc || 0.05));
        if (!bestQ || pr > bestQ.pr) bestQ = { q: q, pr: pr };
      });
      if (bestQ && bestQ.pr > Math.max(30, bestQ.q * bp * 0.08)) opts.push({ id: id, q: bestQ.q, pr: bestQ.pr, per: bestQ.pr / bestQ.q, bp: bp });
    });
    opts.sort(function (a, b) { return b.per - a.per; });
    var pick = {}, used = 0, spent = 0, prof = 0, kinds = ctx.kinds, maxK = R.maxKinds();
    opts.forEach(function (op) {
      if (kinds >= maxK && !ctx.cargo[op.id]) return;
      var q = Math.min(op.q, ctx.room - used, Math.floor((ctx.budget - spent) / op.bp)); if (q < 3) return;
      var pr = q === op.q ? op.pr : op.per * q;
      pick[op.id] = q; used += q; spent += q * op.bp; prof += pr; if (!ctx.cargo[op.id]) kinds++;
    });
    return { pick: pick, prof: prof, held: held, tot: prof + Math.max(0, held) };
  }
  function ctxFor(days, empty) {
    var s = S(), f = s.fleet, use = R.dailyUse(), prov = Math.ceil(use * days * 1.25) + 3, reserve = Math.max(800, s.player.gold * 0.03);
    var cargoQ = empty ? 0 : R.cargoQty();
    return { cargo: empty ? {} : f.cargo, kinds: empty ? 0 : Object.keys(f.cargo).length,
      room: R.fleetCap() - cargoQ - (empty ? 2 * prov : Math.max(prov, f.food) + Math.max(prov, f.water)) - Math.ceil(f.mat || 0) - 2,
      budget: s.player.gold - reserve - prov * 2 * 4 };
  }
  var POT = {};
  /** 이 항구에서 다음에 할 수 있는 가장 좋은 장사 (빈 배로) — 두 구간 앞을 보는 머리가 쓴다. 60일 동안 기억 */
  function potential(D) {
    var s = S(), k = POT[D.id];
    if (k && s.day - k.t < (TB.opt.potDays || 60)) return k;
    var goods = tradeOK(D) ? goodsHere(D) : [], best = { tot: 0, days: 0 };
    candidates(D).forEach(function (o) { var e = evalLeg(D, o.c, o.days, goods, ctxFor(o.days, true)), r = e.prof / (o.days + (TB.opt.portDays || 2)); if (r > (best.rate || 0)) best = { tot: e.prof, days: o.days, rate: r, to: o.c.id }; });
    best.t = s.day; POT[D.id] = best; return best;
  }
  function planFrom(c) {
    var s = S(), best = null, cands = candidates(c), goods = tradeOK(c) ? goodsHere(c) : [], pd = TB.opt.portDays || 2;
    var all = cands.map(function (o) { var e = evalLeg(c, o.c, o.days, goods, ctxFor(o.days)); return { o: o, e: e, score: e.tot / (o.days + pd) }; });
    if (TB.opt.look) {   // 두 구간 앞: 그곳에서 이어 갈 장사까지 넣어 하루당 이익
      all.sort(function (a, b) { return b.score - a.score; });
      all.slice(0, TB.opt.lookN || 8).forEach(function (x) { var p2 = potential(x.o.c); x.score2 = (x.e.tot + p2.tot) / (x.o.days + pd + p2.days + pd); });
      all.forEach(function (x) { if (x.score2 == null) x.score2 = x.score * 0.5; x.score = x.score2; });
    }
    all.forEach(function (x) { if (!best || x.score > best.score) best = { to: x.o.c.id, days: x.o.days, goods: x.e.pick, prof: Math.round(x.e.prof), held: Math.round(x.e.held), score: x.score }; });
    // 수첩 머리: 아는 것이 없으면 둘러보러 (가까운 데서 오래 못 본 교역소)
    if (TB.opt.brain !== 'oracle' && (!best || best.score < (TB.opt.exploreBelow || 40))) {
      var book = s.ledger || {}, unk = cands.filter(function (o) { var r = book[o.c.id]; return !r || s.day - r.t > 360; });
      if (unk.length) { var o2 = unk[Math.floor(rnd() * Math.min(6, unk.length))]; best = { to: o2.c.id, days: o2.days, goods: best ? best.goods : {}, prof: best ? best.prof : 0, held: 0, score: 0, explore: true }; }
    }
    if (!best && cands.length) { var o3 = cands[Math.floor(rnd() * Math.min(8, cands.length))]; best = { to: o3.c.id, days: o3.days, goods: {}, prof: 0, held: 0, score: 0, wander: true }; }
    return best;
  }
  function buyPlan(c, plan) {
    var s = S(), out = [];
    var ids = Object.keys(plan.goods || {}).filter(function (id) { return plan.goods[id] > 0; });
    if (!ids.length) return out;
    var nq = 0; ids.forEach(function (id) { nq += plan.goods[id]; });
    var disc = dealDisc(c, true, nq);
    ids.forEach(function (id) {
      var bp = T.buyP(c, id), up = Math.max(1, Math.round(bp * (1 - disc)));
      var room = G.Cargo ? G.Cargo.room(id) : R.free();
      var q = Math.min(plan.goods[id], R.supply(c, id), room, Math.floor(s.player.gold / up));
      if (q < 1) return;
      T.applyBuy(c, id, q, up);
      out.push({ g: id, q: q, unit: up, disc: +disc.toFixed(3) });
    });
    return out;
  }

  // ---------------------------------------------------------------- 빠른 세월: 창이 없으면 기다리지 않는다 (QA.settle 은 한 번에 120ms 넘게 잔다)
  var mc = new MessageChannel(), mcq = [];
  mc.port1.onmessage = function () { var f = mcq.shift(); if (f) f(); };
  function yieldM() { return new Promise(function (r) { mcq.push(r); mc.port2.postMessage(0); }); }
  async function calm() { for (var k = 0; k < 2; k++) await yieldM(); if (G.UI.busy() || (G.Life && (G.Life.running || G.Life.dying)) || (S() && S().life && S().life.end)) { TB.prof.settleN = (TB.prof.settleN || 0) + 1000; var tb = topBusy(); TB.busyWhy[tb] = (TB.busyWhy[tb] || 0) + 1; await QA.settle(60000); } }
  function topBusy() { var m = [].slice.call(document.querySelectorAll('#ui .modal-back')).pop(); return m ? (m.innerText || '').replace(/\s+/g, ' ').slice(0, 50) : G.UI.busy() ? 'busy-no-modal' : 'life'; }
  TB.busyWhy = {};
  async function fastPass(days) {
    var s = S(), n = 0, name0 = s.player.name, ends = [];
    while (n < days) {
      if (G.Game.sceneName === 'title') { ends.push('title'); break; }
      var before = s.day;
      try { G.Game.passDays(Math.min(30, days - n)); } catch (e) { console.error(e); }
      var did = s.day - before; n += did;
      await calm(); s = S(); if (!s) break;
      if (did === 0) {
        for (var i = 0; i < 200 && s.life && s.life.end; i++) { QA.aux(); await QA.clear(40); await QA.sleep(30); }
        await QA.settle(240000); s = S();
        if (s && s.life && s.life.end) { TB.notes.push('수명 끝에서 멈춤'); break; }
        if (G.EraEnd && G.EraEnd.over(s)) break;
      }
      if (s && s.player && s.player.name !== name0) { ends.push('대 이음: ' + name0 + ' → ' + s.player.name + ' (' + s.date.y + ')'); name0 = s.player.name; }
    }
    QA.aux();
    return { days: n, events: ends };
  }

  // ---------------------------------------------------------------- 한 구간: 항구에서 할 일 → 항해 → 다음 항구
  TB.cost = { hire: 0, repair: 0, supply: 0, ships: 0, wages: 0 };
  TB.step = async function () {
    var s = S(), c = G.CITY_DATA[s.loc.city], rec = { from: c.id, y0: s.date.y, d0: s.day, w0: wealth() };
    if (TB.opt.brain !== 'oracle' && tradeOK(c)) G.Ledger.record(c);
    var tq = performance.now(); rec.sold = sellAll(c); TB.prof.sell += performance.now() - tq;
    repair(c);
    var sb = shipBuy(c); if (sb) { rec.ship = sb; TB.cost.ships += (sb.p || 0) - (sb.v || 0); }
    crewUp(c);
    tq = performance.now(); MEMO = {};
    var avg0 = G.Plan.avgSpeed, vNow = avg0.call(G.Plan); G.Plan.avgSpeed = function () { return vNow; };   // 계획하는 동안 선속은 그대로 (뱃길 날수를 셀 때마다 다시 세지 않게)
    var plan; try { plan = planFrom(c); } finally { G.Plan.avgSpeed = avg0; }
    TB.prof.plan += performance.now() - tq;
    if (!plan) { rec.res = 'no-plan'; TB.legs.push(rec); return false; }
    TB.plan = plan;
    provision(c, plan.days);
    rec.bought = buyPlan(c, plan);
    rec.to = plan.to; rec.days = plan.days; rec.estProf = plan.prof; rec.explore = !!plan.explore; rec.wander = !!plan.wander;
    // 항해
    var g0 = s.player.gold, f = s.fleet, use = R.dailyUse();
    tq = performance.now(); var p = await fastPass(plan.days); TB.prof.pass += performance.now() - tq;
    s = S(); if (!s || G.Game.sceneName === 'title') { rec.res = 'title'; TB.legs.push(rec); return false; }
    f = s.fleet;
    f.food = Math.max(0, f.food - use * p.days); f.water = Math.max(0, f.water - use * p.days);
    rec.passGold = s.player.gold - g0;   // 항해하는 동안 나간 돈(급료 등)·들어온 돈
    if (p.events.length) rec.life = p.events;
    var d = G.CITY_DATA[plan.to];
    if (s.known.indexOf(d.id) < 0) s.known.push(d.id);
    s.loc = { mode: 'city', city: d.id, lon: d.lon, lat: d.lat, heading: 0 };
    try { RT.record(c.id, d.id, plan.days); } catch (e) { /* 없음 */ }
    tq = performance.now();
    // 입항: 열 번에 한 번은 실제 입항 장면(C.enter — 입항 사건·의뢰·소문)을, 나머지는 입항 번호만 늘린다 (시험 속도 — 도시 화면 짓기가 한 번 140ms)
    if (TB.legs.length % (TB.opt.enterEvery || 10) === 0) { G.Game.go('city', { cityId: d.id }); await calm(); }
    else { s.portVisit = (s.portVisit || 0) + 1; }
    TB.prof.enter += performance.now() - tq;
    if (G.Game.sceneName !== 'city') { rec.res = 'scene:' + G.Game.sceneName; }
    rec.w1 = wealth(); rec.y1 = S().date.y; rec.gold = Math.round(S().player.gold);
    TB.legs.push(rec);
    return true;
  };
  /** 판 하나: opt = {nation, job, brain, maxLeg, ships, shipK, windK, target, endY, realMin} */
  TB.run = async function (opt) {
    bind(); POT = {};
    // 시험 속도: 알림은 화면에 그리지 않고 세어만 둔다 · 윗줄(HUD) 다시 그리기는 건너뛴다 (화면 배치 셈이 세월 셈의 1할을 넘게 쓴다)
    TB.toasts = {};
    if (!G.UI.toast.__tb) { G.UI.toast = function (t) { var k = String(t == null ? '' : t).replace(/<[^>]+>/g, '').replace(/[0-9,.]+/g, '#').slice(0, 40); TB.toasts[k] = (TB.toasts[k] || 0) + 1; }; G.UI.toast.__tb = 1; }
    if (!G.Game.refreshHud.__tb) { G.Game.refreshHud = function () {}; G.Game.refreshHud.__tb = 1; }
    // 업적 검사(AC.daily)는 하루 셈의 절반을 넘게 쓴다 — 시험에서는 보름에 한 번 (보상·업적은 그대로 생긴다, 조금 늦게)
    if (G.Achieve && G.Achieve.daily && !G.Achieve.daily.__tb) { var acd = G.Achieve.daily; G.Achieve.daily = function () { var s0 = S(); return s0 && s0.day % (opt.achEvery || 15) === 0 ? acd.apply(this, arguments) : []; }; G.Achieve.daily.__tb = 1; } TB.opt = opt; TB.legs = []; TB.cost = { hire: 0, repair: 0, supply: 0, ships: 0 }; TB.plan = null;
    TB.prof = { plan: 0, pass: 0, enter: 0, sell: 0 };
    var t0 = Date.now(), target = opt.target || 1e8, marks = {}, steps = [1e5, 1e6, 1e7, 1e8];
    var out = { opt: opt, marks: marks };
    for (var n = 0; ; n++) {
      var s = S();
      if (!s || G.Game.sceneName === 'title') { out.end = 'title'; break; }
      var w = wealth();
      steps.forEach(function (k) { if (w >= k && !marks[k]) marks[k] = { y: s.date.y, m: s.date.m, day: s.day, leg: n, realS: Math.round((Date.now() - t0) / 1000) }; });
      if (w >= target) { out.end = 'target'; break; }
      if (s.date.y >= (opt.endY || 1700)) { out.end = 'year'; break; }
      if ((Date.now() - t0) / 60000 > (opt.realMin || 12)) { out.end = 'realtime'; break; }
      // 대 잇기: 마흔에 아들을 둔다 (수명 80이 오면 아들이 잇는다)
      if (!s.qaSon && G.R.age && G.R.age() >= 40) { s.qaSon = 1; try { QA.giveSon('교역 시험'); } catch (e) { TB.notes.push('giveSon: ' + e.message); } }
      if (G.Game.sceneName !== 'city') { G.Game.go('city', { cityId: s.loc.city != null ? s.loc.city : s.player.home }); await calm(); }
      if (n % 50 === 0) console.log('TBP ' + n + ' ' + s.date.y + '.' + s.date.m + ' w=' + w + ' t=' + Math.round((Date.now() - t0) / 1000) + 's prof=' + Object.keys(TB.prof).map(function (k) { return k + ':' + Math.round(TB.prof[k] / 1000); }).join(','));
      var ok = false;
      try { ok = await TB.step(); } catch (e) { TB.notes.push('step: ' + e.message + ' ' + String(e.stack).split('\n')[1]); ok = false; }
      if (!ok) { out.end = out.end || 'step-fail'; if (TB.legs.length && TB.legs[TB.legs.length - 1].res === 'no-plan') break; if (TB.notes.length > 20) break; }
    }
    var s2 = S();
    out.final = s2 ? { y: s2.date.y, m: s2.date.m, day: s2.day, wealth: wealth(), gold: Math.round(s2.player.gold), bank: Math.round(s2.player.bank || 0), ships: s2.fleet.ships.map(function (x) { return x.type; }), cap: R.fleetCap(), crew: s2.fleet.crew, gen: s2.player.generation, fame: s2.player.fame, noto: s2.player.notoriety || 0, stats: s2.stats } : null;
    out.legs = TB.legs.length; out.cost = TB.cost; out.notes = TB.notes.slice(0, 30); out.realS = Math.round((Date.now() - t0) / 1000);
    return out;
  };
})();
