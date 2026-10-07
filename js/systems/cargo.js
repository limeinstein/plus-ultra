/* 짐의 부피·무게 · 식품의 보관(유통기한) · 육상 탐험대의 식량·물 짐.
   조정값: js/data/base.js G.BALANCE.cargo · G.BALANCE.landPack · G.BALANCE.market

   · 부피(통): 짐칸을 차지하는 크기. 교역품·식량·물·자재가 쓴다 (R.used / R.fleetCap — 예전 그대로).
   · 무게: 배가 버티는 무게 = 배마다 짐칸 × shipWt. 교역품(1통의 무게는 갈래·품목마다 다름) + 식량·물 + 자재
     + 선원 + 대포·포탄이 모두 들어간다. 후추 같은 가벼운 물건은 짐칸을 꽉 채울 수 있지만,
     광석·금속처럼 무거운 물건은 짐칸이 남아도 무게에 먼저 걸린다.
   · 보관: 먹을거리·마실거리·향신료·기호품은 신선하게 파는 날수(keep)가 있다. 넘으면 파는 값이 차츰 떨어지고(최저 decayMin),
     두 배를 넘으면 한 달에 rotMonth만큼 상해 없어진다. 포도주·럼·소금·꿀처럼 상하지 않는 것도 있다.
   · 육상 탐험: 식량·물은 쓰지 않고 금화 경비만 나간다(land.js). 야영의 사냥·물 긷기는 배의 식량·물을 채우는 일이라
     배(또는 출발한 항구)가 보이는 곳(landPack.near도 안)에서만 할 수 있다 (CG.nearShip). */
(function (G) {
  'use strict';
  var U = G.U, R = G.R;
  var CG = G.Cargo = {};
  function S() { return G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.cargo) || {}; }

  // ================================================================ 무게
  /** 교역품 1통의 무게 */
  CG.wt = function (id) {
    var g = G.GOOD[id], k = K();
    if (!g) return 1;
    if (k.wtGood && k.wtGood[id] != null) return k.wtGood[id];
    return k.wt && k.wt[g.cat] != null ? k.wt[g.cat] : 1;
  };
  /** 배 한 척이 버티는 무게 */
  CG.shipWtCap = function (s) { return Math.floor(s.cap * (K().shipWt || 1.3)); };
  /** 함대가 버티는 무게 — 회계 단계가 높으면 짐을 고르게 나눠 싣고 묶어 조금 더 버틴다 (G.Acct.wtBonus, G.BALANCE.acct.wt) */
  CG.fleetWtCap = function () { var n = U.sum(S().fleet.ships, CG.shipWtCap), b = G.Acct ? G.Acct.wtBonus() : 0; return b ? Math.floor(n * (1 + b)) : n; };
  /** 늘 실려 있는 무게: 선원 · 대포 · 포탄 */
  CG.fixedWt = function () {
    var f = S().fleet, k = K();
    return f.crew * (k.crewWt != null ? k.crewWt : 0.1) + U.sum(f.ships, function (s) {
      var c = G.CANNON[s.guns.type];
      return s.guns.n * ((c ? c.load : 1) * (k.gunWt != null ? k.gunWt : 1.5) + (k.shotWt != null ? k.shotWt : 0.25));
    });
  };
  CG.goodsWt = function (cargo) { var n = 0; for (var id in cargo) n += cargo[id].q * CG.wt(id); return n; };
  /** 식량·물·자재·의뢰 짐의 무게 */
  CG.storesWt = function () {
    var f = S().fleet, k = K();
    return (Math.ceil(f.food || 0) + Math.ceil(f.water || 0)) * (k.supWt != null ? k.supWt : 1) + Math.ceil(f.mat || 0) * (k.matWt != null ? k.matWt : 1.2) + (G.Quest ? G.Quest.load() : 0);
  };
  CG.fleetWt = function () { return CG.fixedWt() + CG.goodsWt(S().fleet.cargo) + CG.storesWt(); };
  /** 더 버틸 수 있는 무게 */
  CG.wfree = function () { return CG.fleetWtCap() - CG.fleetWt(); };
  /** 이 교역품을 몇 통 더 실을 수 있나 (부피와 무게 가운데 먼저 걸리는 쪽) */
  CG.room = function (id) { return Math.max(0, Math.min(Math.floor(R.freeVol()), Math.floor(CG.wfree() / CG.wt(id) + 1e-9))); };
  /** 무게가 먼저 걸리는가 */
  CG.heavyBound = function (id) { return Math.floor(CG.wfree() / CG.wt(id) + 1e-9) < Math.floor(R.freeVol()); };
  /** 식량·물·자재에 쓸 수 있는 칸 (부피·무게 둘 다 본다, 무게 1 기준) */
  CG.supplyRoom = function () {
    var f = S().fleet, q = G.Quest ? G.Quest.load() : 0;
    var vol = R.fleetCap() - R.cargoQty() - q;
    var wt = CG.fleetWtCap() - CG.fixedWt() - CG.goodsWt(f.cargo) - q;
    return Math.min(vol, Math.floor(wt));
  };
  /** 짐 무게 비율 0~1 — 선원·대포를 뺀 몫 가운데 짐이 차지한 비율. 속력의 짐 보정(R.loadShares)이 부피 비율과 견주어 큰 쪽을 쓴다 */
  CG.loadRatio = function () {
    var room = CG.fleetWtCap() - CG.fixedWt();
    return room > 0 ? U.clamp((CG.goodsWt(S().fleet.cargo) + CG.storesWt()) / room, 0, 1.5) : 1;
  };
  /** 화면에 보이는 한 줄: 「무게 312/806」 */
  CG.wtText = function () { return Math.round(CG.fleetWt()) + ' / ' + CG.fleetWtCap(); };

  // ================================================================ 보관 (유통기한)
  /** 신선하게 파는 날수 (0 = 상하지 않음) */
  CG.keep = function (id) {
    var g = G.GOOD[id], k = K();
    if (!g) return 0;
    if (k.keepGood && k.keepGood[id] != null) return k.keepGood[id];
    return (k.keep && k.keep[g.cat]) || 0;
  };
  /** 이 짐(cg.d = 산 날, 여러 번 샀으면 양으로 가중한 날)의 파는 값 비율: 1 → decayMin */
  CG.fresh = function (id, cg, day) {
    var kp = CG.keep(id); if (!kp || !cg) return 1;
    var age = (day == null ? S().day : day) - (cg.d || 0);
    if (age <= kp) return 1;
    var m = K().decayMin != null ? K().decayMin : 0.5;
    return Math.max(m, 1 - (1 - m) * (age - kp) / kp);
  };
  /** 매각 창에 쓸 상태 {keep, age, left, f, rot, text} — 상하지 않는 물건이면 null */
  CG.state = function (id, cg) {
    var kp = CG.keep(id); if (!kp || !cg) return null;
    var age = S().day - (cg.d || 0), f = CG.fresh(id, cg), rot = age > kp * 2;
    var text = rot ? '상하는 중 · 값 ' + Math.round(f * 100) + '%' : f < 1 ? '묵음 · 값 ' + Math.round(f * 100) + '%' : kp - age <= 60 ? (kp - age) + '일 뒤 묵음' : '';
    return { keep: kp, age: age, left: kp - age, f: f, rot: rot, text: text };
  };
  /** 날마다 (world.js W.daily): 보관 기간의 두 배를 넘긴 짐은 조금씩 상해 없어진다 */
  CG.daily = function () {
    var s = S(), f = s.fleet, out = [], k = K(), rate = (k.rotMonth != null ? k.rotMonth : 0.06) / 30;
    if (!f || !f.cargo) return out;
    Object.keys(f.cargo).forEach(function (id) {
      var cg = f.cargo[id], kp = CG.keep(id);
      if (!kp || s.day - (cg.d || 0) <= kp * 2) return;
      cg.rot = (cg.rot || 0) + cg.q * rate;
      if (cg.rot >= 1) {
        var lose = Math.min(cg.q, Math.floor(cg.rot)); cg.rot -= lose; cg.q -= lose;
        if (!cg.rotTold || s.day - cg.rotTold >= 30) { cg.rotTold = s.day; out.push({ icon: 'sack', text: G.GOOD[id].name + U.jx(G.GOOD[id].name, '이/가') + ' 너무 오래되어 상해 가고 있다. (남은 ' + Math.max(0, cg.q) + '통)' }); }
        if (cg.q <= 0) delete f.cargo[id];
      }
    });
    return out;
  };

  // ================================================================ 육상 탐험: 배가 보이는가
  /** 배(또는 출발한 항구)가 보이는 곳(G.BALANCE.landPack.near도 안)에 있는가 — 그때만 야영에서 사냥·물 긷기로 배의 식량·물을 채울 수 있다 */
  CG.nearShip = function (l) {
    l = l || S().loc; var b = l && l.base; if (!b) return false;
    return G.Geo.dist(l.lon, l.lat, b.lon, b.lat) <= (((G.BALANCE || {}).landPack || {}).near || 1.2);
  };
})(window.G = window.G || {});
