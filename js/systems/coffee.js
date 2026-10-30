/* 커피 메뉴 (G.Coffee) — 2026-10-30 사용자 요청. 메뉴 자료: js/data/coffee.js (G.COFFEE) · 조정값: G.BALANCE.coffee
   ■ 열리기: 교역소에서 커피(교역품 coffee)를 한 번에 minQty통 이상 팔면(js/city/trade.js sellQty),
     그 도시의 식당 문화권(G.CUISINE.zone)에 딸린 커피 메뉴 가운데 아직 열리지 않은 것 하나가 열린다 — 자료에 적은 차례대로.
     예) 조선의 항구에 커피를 팔면 조선 식당에 「아이스 아메리카노」, 이탈리아에 팔 때마다 에스프레소 → 카푸치노 → 마키아토 → 콘파냐.
   ■ 마시기: 열린 메뉴는 그 문화권 모든 식당의 「커피를 마신다」에 나온다(js/city/restaurant.js). 한 도시에 들른 동안 한 잔(식사와는 따로).
     마시면 사교 명성 so[tier] — 처음 맛보는 메뉴는 first를 더 얹는다. 피로도 조금(rest) 풀린다.
   ■ 저장: s.coffee = { open: {메뉴: {c: 연 도시, d: 날}}, tasted: {메뉴: 잔 수}, last: {도시: 날}, lastPv: {도시: 입항 번호} } — 없으면 만든다(옛 저장 그대로). */
(function (G) {
  'use strict';
  var CF = G.Coffee = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.coffee) || { minQty: 10, base: 4, size: 2, tier: 3, so: [0, 2, 3, 4], first: 8, rest: 2 }; }
  function st() {
    var s = S(), o = s.coffee || (s.coffee = {});
    o.open = o.open || {}; o.tasted = o.tasted || {}; o.last = o.last || {}; o.lastPv = o.lastPv || {};
    return o;
  }
  CF.zone = function (c) { return c && G.CUISINE ? G.CUISINE.zone(c) : null; };
  CF.zoneName = function (z) { return (G.COFFEE_ZONE && G.COFFEE_ZONE[z]) || '이 고장'; };
  CF.ofZone = function (z) { return (G.COFFEE || []).filter(function (d) { return d.zone === z; }); };
  CF.isOpen = function (id) { var s = S(); return !!(s && s.coffee && s.coffee.open && s.coffee.open[id]); };
  /** 이 도시 식당에서 마실 수 있는 커피 (열린 것만) */
  CF.menu = function (c) { return CF.ofZone(CF.zone(c)).filter(function (d) { return CF.isOpen(d.id); }); };
  /** 이번 입항에 이 도시에서 이미 한 잔 했는가 */
  CF.used = function (c) { var o = st(); return o.last[c.id] != null && G.R.sameStay(o.last[c.id], o.lastPv[c.id]); };
  CF.price = function (c, d) { var k = K(); return Math.max(1, Math.round(k.base + (c.size || 1) * k.size + d.tier * k.tier)); };
  CF.fame = function (d) { var k = K(), o = st(); return ((k.so && k.so[d.tier]) || 0) + (o.tasted[d.id] ? 0 : (k.first || 0)); };

  /** 커피를 팔았다 (js/city/trade.js) → 새로 열린 메뉴 또는 null */
  CF.sold = function (c, id, q) {
    var s = S();
    if (id !== 'coffee' || !s || !c || q < K().minQty) return null;
    var o = st(), next = CF.ofZone(CF.zone(c)).filter(function (d) { return !o.open[d.id]; })[0];
    if (!next) return null;
    o.open[next.id] = { c: c.id, d: s.day };
    if (G.State && G.State.log) G.State.log(c.name + '에 커피를 팔았다. ' + CF.zoneName(next.zone) + '의 식당에 「' + next.name + '」 메뉴가 생겼다.');
    return next;
  };
  CF.soldText = function (c, d) {
    return c.name + '에 커피 맛이 퍼졌다! ' + CF.zoneName(d.zone) + ' 식당 차림표에 「' + d.name + '」' + G.U.jx(d.name, '이/가') + ' 생겼다.';
  };

  /** 한 잔 마신다 → {price, so, rest, first} 또는 실패 사유 문자열 */
  CF.drink = function (c, d) {
    var s = S(), k = K(), o = st();
    if (!CF.isOpen(d.id)) return 'closed';
    if (CF.used(c)) return 'used';
    var p = CF.price(c, d);
    if (s.player.gold < p) return 'gold';
    var first = !o.tasted[d.id], want = CF.fame(d);
    s.player.gold -= p;
    o.last[c.id] = s.day; o.lastPv[c.id] = G.R.stayNo();
    o.tasted[d.id] = (o.tasted[d.id] || 0) + 1;
    var before = s.fleet.fatigue || 0; s.fleet.fatigue = Math.max(0, before - (k.rest || 0));
    var so = want > 0 && G.Fame ? G.Fame.add('so', want) : 0;
    return { price: p, so: so, rest: before - s.fleet.fatigue, first: first };
  };
  /** 맛본 메뉴 수 / 전체 */
  CF.count = function () { var s = S(), t = (s && s.coffee && s.coffee.tasted) || {}; return { tasted: Object.keys(t).length, open: Object.keys((s && s.coffee && s.coffee.open) || {}).length, all: (G.COFFEE || []).length }; };
})(window.G = window.G || {});
