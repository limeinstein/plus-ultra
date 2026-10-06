/* 노예 무역 — 교역품 「노예」와 그 산지·수요, 조정값 (규칙: js/systems/slavetrade.js, 발견물 t_slaves는 js/data/moredisc.js의 G.MORE_TRADE)
   역사 속에 있던 일이라 넣되, 돈이 되는 대신 이름이 더러워지는 일로 다룬다 — 사고팔 때마다 악명이 오르고 「노예 상인」이라는 이름이 붙는다.
   · 물건은 G.GOODS 맨 끝에 붙인다(tradegoods.js 다음 — 물건 순번이 바뀌지 않게).
   · 산지: 서아프리카의 포르투갈 상관(아르킨·베르데 곶·시에라리온·산호르헤 다 미나·산토메·르완다)과 동아프리카의 킬와·잔지바르.
   · 수요: 신대륙의 농장·광산(1.6배), 중근동(1.3배), 이베리아(1.15배). */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.slave = G.BALANCE.slave || {
    buy: [2, 15],        // 살 때 악명: [0] + 통 수 ÷ [1]
    sell: [3, 10],       // 팔 때 악명: [0] + 통 수 ÷ [1]
    titleYears: 5        // 마지막으로 사고판 날부터 이만큼(해) 지나야 「노예 상인」이라는 이름이 잊힌다
  };
  G.SLAVE = {
    good: { id: 'slaves', name: '노예', cat: 'misc', p: 120, life: 0, el: 0.9 },
    cities: ['아르킨', '베르데 곶', '시에라리온', '산호르헤', '산토메', '르완다', '킬와', '잔지바르'],
    demand: { 10: 1.6, 4: 1.3, 0: 1.15 },
    title: '노예 상인'
  };
  var g = G.SLAVE.good;
  if (G.GOODS && !G.GOOD[g.id]) { g.idx = G.GOODS.length; G.GOODS.push(g); G.GOOD[g.id] = g; }
  if (G.GOOD_DEMAND) G.GOOD_DEMAND[g.id] = G.SLAVE.demand;
  (G.CITY_DATA || []).forEach(function (c) {
    if (c && c.goods && G.SLAVE.cities.indexOf(c.name) >= 0 && c.goods.indexOf(g.id) < 0) c.goods.push(g.id);
  });
})(window.G = window.G || {});
