/* 유행 (G.Fad) — 같은 물건을 같은 나라(또는 같은 지역)에 거듭 팔아 큰 이익을 내면 그 물건이 그곳에서 유행을 탄다.
   · 석 달(window) 안에 need번 넘게, 한 번에 profit(30%) 넘는 이익으로 팔면 → chance 확률로 유행이 시작된다
     (한 도시에서 같은 날 여러 번 나눠 판 것은 한 번으로 친다)
   · 유행하는 동안(days) 그 나라·지역의 모든 도시에서 그 물건의 값이 mult배 (파는 값·사는 값 모두 — 그 자리에서 사서 되파는 것을 막는다)
   · 끝나면 제값으로 돌아가고, 같은 곳·같은 물건은 cooldown일 동안 다시 유행하지 않는다
   · 제독과 상관없이 이는 「세상의 유행」(발견 소식·시대의 바람·번짐)도 여기에 함께 올라간다 — js/systems/era.js, 배수는 저마다 f.m
   조정값: G.BALANCE.fad (js/data/base.js). 값은 R.sellPrice·R.buyPrice (js/core/rules.js)가 G.Fad.mult 를 곱한다.

   저장 상태 (옛 저장에는 없다 — 쓸 때 만든다)
   state.fad = { log: [{g, d, c, n, r}] 이익을 낸 거래(물건·날·도시·나라·지역), on: [{g, k:'n'|'r', key, since, until}] 지금 유행, off: {열쇠: 끝난 날} } */
(function (G) {
  'use strict';
  var U = G.U, F = {};
  G.Fad = F;
  function S() { return G.Game && G.Game.state; }
  function B() { return (G.BALANCE && G.BALANCE.fad) || { profit: 0.3, need: 3, window: 90, chance: 0.6, mult: 3, days: 60, cooldown: 180 }; }
  function st() { var s = S(); if (!s) return null; if (!s.fad) s.fad = { log: [], on: [], off: {} }; if (!s.fad.off) s.fad.off = {}; return s.fad; }
  function nationOf(c) { try { return G.R.cityOwner(c) || ''; } catch (e) { return ''; } }
  function key(g, k, v) { return g + '|' + k + '|' + v; }

  /** 이 도시에서 지금 이 물건이 유행인가 → 그 유행(없으면 null) */
  F.at = function (c, goodId) {
    var s = S(); if (!s || !s.fad || !s.fad.on.length || !c) return null;
    var nat = null;
    for (var i = 0; i < s.fad.on.length; i++) {
      var f = s.fad.on[i]; if (f.g !== goodId || s.day >= f.until) continue;
      if (f.k === 'r' ? f.key === c.region : f.key === (nat == null ? (nat = nationOf(c)) : nat)) return f;
    }
    return null;
  };
  /** 값에 곱할 배수 (유행이 아니면 1) */
  F.mult = function (c, goodId) { var f = F.at(c, goodId); return f ? (f.m || B().mult || 3) : 1; };   // 세상의 유행(js/systems/era.js)은 저마다 배수 m
  /** 세상의 유행을 올린다 (js/systems/era.js — 발견의 유행·저절로 이는 유행·번짐): f = {g, k, key, since, until, m, src, why} */
  F.start = function (f) { var fd = st(); if (fd && f) fd.on.push(f); return f; };
  /** 유행하는 곳의 이름 */
  F.where = function (f) { return f.k === 'r' ? G.REGIONS[f.key] + ' 지역' : f.key; };
  /** 지금 유행 목록 [{g, name, where, left}] */
  F.list = function () {
    var s = S(); if (!s || !s.fad) return [];
    return s.fad.on.filter(function (f) { return s.day < f.until && G.GOOD[f.g]; }).map(function (f) { return { g: f.g, name: G.GOOD[f.g].name, where: F.where(f), left: f.until - s.day, f: f, m: f.m || B().mult || 3, src: f.src || 'me', why: f.why || '' }; });
  };

  /** 물건을 팔았다 (trade.js sellQty): 이익이 컸으면 적어 두고, 조건이 차면 유행이 시작된다. 시작됐으면 그 유행을 돌려준다 */
  F.sold = function (c, goodId, q, total, cost) {
    var s = S(), fd = st(), b = B(); if (!fd || !q || !cost || F.at(c, goodId)) return null;
    if (total / q < cost * (1 + (b.profit == null ? 0.3 : b.profit))) return null;
    var nat = nationOf(c), win = b.window || 90;
    fd.log = fd.log.filter(function (x) { return s.day - x.d <= win; });
    if (fd.log.some(function (x) { return x.g === goodId && x.c === c.id && x.d === s.day; })) return null;   // 같은 날 같은 도시는 한 번
    fd.log.push({ g: goodId, d: s.day, c: c.id, n: nat, r: c.region });
    var mine = fd.log.filter(function (x) { return x.g === goodId; });
    var nN = nat ? mine.filter(function (x) { return x.n === nat; }).length : 0, nR = mine.filter(function (x) { return x.r === c.region; }).length;
    var need = b.need || 3, k = nN >= need ? 'n' : nR >= need ? 'r' : null;
    if (!k) return null;
    var v = k === 'n' ? nat : c.region, ky = key(goodId, k, v);
    if (fd.off[ky] != null && s.day - fd.off[ky] < (b.cooldown || 0)) return null;
    if (!U.chance(b.chance == null ? 0.6 : b.chance)) return null;
    var f = { g: goodId, k: k, key: v, since: s.day, until: s.day + (b.days || 60) };
    fd.on.push(f);
    fd.log = fd.log.filter(function (x) { return !(x.g === goodId && (k === 'n' ? x.n === v : x.r === v)); });
    G.State.log(F.where(f) + '에서 ' + G.GOOD[goodId].name + U.jx(G.GOOD[goodId].name, '이/가') + ' 유행하기 시작했다.');
    return f;
  };
  /** 조건까지 몇 번 남았나 (교역소 주인의 귀띔): {n, need} — 이 물건을 이 나라·지역에 이익 내고 판 횟수 */
  F.progress = function (c, goodId) {
    var s = S(), fd = st(), b = B(); if (!fd) return { n: 0, need: b.need || 3 };
    var nat = nationOf(c), mine = fd.log.filter(function (x) { return x.g === goodId && s.day - x.d <= (b.window || 90); });
    return { n: Math.max(nat ? mine.filter(function (x) { return x.n === nat; }).length : 0, mine.filter(function (x) { return x.r === c.region; }).length), need: b.need || 3 };
  };

  /** 날마다 (W.daily): 끝난 유행을 거둔다 */
  F.daily = function () {
    var s = S(), out = []; if (!s || !s.fad || !s.fad.on.length) return out;
    var fd = st();
    fd.on = fd.on.filter(function (f) {
      if (s.day < f.until) return true;
      fd.off[key(f.g, f.k, f.key)] = s.day;
      if (G.GOOD[f.g]) out.push({ icon: 'scales', text: F.where(f) + '의 ' + G.GOOD[f.g].name + ' 유행이 가라앉았다. 값이 제자리로 돌아갔다.' });
      return false;
    });
    return out;
  };
})(window.G = window.G || {});
