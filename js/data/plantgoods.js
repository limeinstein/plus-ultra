/* 식물 발견물이 내는 교역품 (2026-10-22) — 발견물은 js/data/plantdisc.js, 교역소에 심는 일은 js/systems/plantrade.js
   - G.GOODS 끝에 붙인다: 시세 수첩(js/systems/ledger.js)이 순번(idx)으로 적으므로 다른 파일이 붙인 교역품(tradegoods·slavetrade·hunt) 뒤에.
   - plant 표시가 있는 교역품은 처음에는 어느 교역소에서도 팔지 않는다. 제독이 그 식물을 찾아 어느 교역소에 심어야 그곳 특산물이 된다.
     출자로 늘어나는 물건·전리품·시장 사건의 품목에는 끼지 않는다 (rules.js · battle.js · economy.js).
   - 값의 산지(R.origins): 그 식물이 본디 자라는 지역 + 심은 교역소의 지역 (plantrade.js) */
(function (G) {
  'use strict';
  if (!G.GOODS || !G.PLANT_CROP) return;
  (G.PLANTS || []).forEach(function (pid) {
    var g = G.PLANT_CROP[pid]; if (!g || G.GOOD[g.id]) return;
    g.idx = G.GOODS.length; G.GOODS.push(g); G.GOOD[g.id] = g;
  });
  // 지역 수요 — 꽃·향료는 멀리 갈수록 탐낸다 (튤립: 네덜란드의 튤립 광풍, 장미수: 이슬람 세계와 인도, 용뇌: 중국·인도의 약방)
  var DEMAND = {
    p_tulip: { 1: 1.5, 0: 1.15, 2: 1.1 },
    p_rosewater: { 5: 1.3, 6: 1.15, 4: 1.1 },
    p_bluerose: { 1: 1.3, 2: 1.2, 6: 1.2, 9: 1.2 },
    p_camphor: { 6: 1.35, 5: 1.25, 4: 1.15 },
    p_cochineal: { 0: 1.2, 1: 1.25, 2: 1.2 },
    p_brazilwood: { 1: 1.25, 2: 1.1 },
    p_orchid: { 6: 1.25, 9: 1.2 },
    p_sakura: { 6: 1.1, 1: 1.1 },
    p_lemon: { 1: 1.2 },
    p_redpine: { 9: 1.2 },
    p_cedar: { 3: 1.1, 4: 1.15 },
    p_teak: { 4: 1.15, 0: 1.1 },
    p_gumarabic: { 2: 1.15, 1: 1.15 }
  };
  if (G.GOOD_DEMAND) for (var id in DEMAND) G.GOOD_DEMAND[id] = DEMAND[id];

  // 부하 수다 (js/systems/banter.js): 나무는 오르고, 꽃은 냄새 맡고, 열매는 따 먹고, 선인장은 손가락을 찔린다
  var B = G.BANTER;
  if (B && B.kindOf) {
    (G.PLANTS || []).forEach(function (pid) {
      var d = G.DISC && G.DISC[pid]; if (!d || B.kindOf[pid]) return;
      B.kindOf[pid] = d.tree ? 'tree' : 'flower';
      if (B.ideaOf && !B.ideaOf[pid]) {
        if (d.cactus) B.ideaOf[pid] = [['finger', 'danger']];
        else if (!d.tree && !d.flower) B.ideaOf[pid] = [['fruit', 'ok']];
      }
    });
  }
})(window.G = window.G || {});
