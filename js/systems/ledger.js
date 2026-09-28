/* 시세 수첩: 들른 교역소의 사는 값·파는 값을 날짜와 함께 적어 두고, 어디서 사서 어디에 팔면 남는지 알려 준다.
   state.ledger[도시번호] = { t: 적은 날(state.day), s: [교역품 순번별 파는 값], b: {교역품: 사는 값} } */
(function (G) {
  'use strict';
  var U = G.U, R = G.R;
  var L = {};
  G.Ledger = L;
  function S() { return G.Game.state; }
  function book() { var s = S(); return s.ledger || (s.ledger = {}); }
  L.OLD = 540;          // 이보다 오래된 기록은 믿지 않는다 (날)

  /** 교역소에 들어갈 때 부른다 */
  L.record = function (c) {
    var s = S(), row = { t: s.day, s: [], b: {} };
    G.GOODS.forEach(function (g) { row.s.push(R.sellPrice(c, g.id)); });
    R.cityGoods(c).forEach(function (id) { if (G.GOOD[id]) row.b[id] = R.buyPrice(c, id); });
    row.ci = {}; Object.keys(G.GOOD_CATS).forEach(function (k) { row.ci[k] = Math.round(R.catIndex(c, k) * 100); });   // 갈래별 시세(%) — 교역소 「시세」 창에서 다른 도시와 견준다
    row.ev = R.market(c.id).ev || null;
    book()[c.id] = row;
    return row;
  };
  /** 시세 기록이 있는 다른 도시들 (최근 들른 순) */
  L.quoteRows = function (except, n) {
    var b = book(), out = [];
    for (var id in b) { if (+id === except || !fresh(b[id]) || !b[id].ci) continue; out.push({ city: +id, age: S().day - b[id].t, ci: b[id].ci, ev: b[id].ev }); }
    return out.sort(function (a, b) { return a.age - b.age; }).slice(0, n || 8);
  };
  function fresh(row) { return row && S().day - row.t <= L.OLD; }
  L.age = function (cityId) { var row = book()[cityId]; return row ? S().day - row.t : null; };

  /** 이 교역품을 가장 비싸게 사 주는 곳 (알려진 기록 중) */
  L.bestSell = function (goodId, except) {
    var g = G.GOOD[goodId], b = book(), best = null;
    if (!g) return null;
    for (var id in b) {
      if (+id === except || !fresh(b[id])) continue;
      var p = b[id].s[g.idx];
      if (p && (!best || p > best.price)) best = { city: +id, price: p, age: S().day - b[id].t };
    }
    return best;
  };
  /** 이 교역품을 가장 싸게 파는 곳 */
  L.bestBuy = function (goodId, except) {
    var b = book(), best = null;
    for (var id in b) {
      if (+id === except || !fresh(b[id])) continue;
      var p = b[id].b[goodId];
      if (p && (!best || p < best.price)) best = { city: +id, price: p, age: S().day - b[id].t };
    }
    return best;
  };
  /** 알려진 기록으로 본 가장 남는 장사 (from 이 주어지면 그 도시에서 사는 것만) */
  L.bestRoute = function (from) {
    var b = book(), best = null;
    for (var id in b) {
      if (!fresh(b[id])) continue;
      if (from != null && +id !== from) continue;
      for (var gid in b[id].b) {
        var buy = b[id].b[gid], sell = L.bestSell(gid, +id);
        if (!sell) continue;
        var gain = sell.price - buy;
        if (gain > 0 && (!best || gain > best.gain)) best = { good: gid, buy: +id, sell: sell.city, buyP: buy, sellP: sell.price, gain: gain };
      }
    }
    return best;
  };
  /** 수첩 탭에 보일 표: 교역품마다 가장 싸게 사는 곳과 가장 비싸게 파는 곳 */
  L.table = function () {
    var rows = [];
    G.GOODS.forEach(function (g) {
      var sb = L.bestBuy(g.id), ss = L.bestSell(g.id);
      if (!sb && !ss) return;
      rows.push({ id: g.id, name: g.name, buy: sb, sell: ss, gain: sb && ss && ss.city !== sb.city ? ss.price - sb.price : null });
    });
    rows.sort(function (a, b) { return (b.gain || -1e9) - (a.gain || -1e9); });
    return rows;
  };
  L.count = function () { return Object.keys(book()).length; };
})(window.G = window.G || {});
