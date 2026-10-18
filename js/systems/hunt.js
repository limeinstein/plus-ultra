/* 사냥 전리품 (G.Hunt) — 자료·조정값은 js/data/hunt.js. 2026-10-18
   G.Hunt.beasts(lon, lat) → {pack, lead} 그 땅의 짐승 (육상전 그림과 같다)
   G.Hunt.loot(n, lon, lat) → [{id, q}] 짐승 n마리를 물리쳤을 때 얻는 가죽
   G.Hunt.give(list) → {got: [{id, q}], left: [{id, q}]} 배의 짐칸에 싣는다 (짐칸·품목 수가 모자라면 두고 온다)
   G.Hunt.text(res) → 알림 글 */
(function (G) {
  'use strict';
  var U = G.U, R = G.R;
  var H = G.Hunt = {};
  function S() { return G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.hunt) || {}; }

  // 호피의 산지: 호랑이가 사는 땅 — 그곳에서는 흔하고 멀리 갈수록 비싸다 (R.regionalMult)
  if (R && R.origins && !R._huntOrigin) {
    R._huntOrigin = true;
    var orig = R.origins;
    R.origins = function () {
      var o = orig.apply(this, arguments);
      if (!o.tigerskin) { o.tigerskin = {}; (K().origin || [5, 6, 8]).forEach(function (r) { o.tigerskin[r] = true; }); }
      return o;
    };
  }

  H.beasts = function (lon, lat) {
    var LA = G.LANDWAR_ART, reg = LA && LA.regions[LA.regionOf(lon || 0, lat || 0)];
    var b = (reg && reg.b) || ['boar', 'bear'];
    return { pack: b[0], lead: b[1] };
  };
  H.loot = function (n, lon, lat) {
    var bs = H.beasts(lon, lat), T = G.HUNT_SPOILS || {}, j = K().jitter || [0.8, 1.25], out = {};
    var p = T[bs.pack], l = T[bs.lead];
    if (p) out[p.good] = Math.min(p.max, Math.max(1, Math.round(n * p.per * U.rf(j[0], j[1]))));
    if (l) out[l.good] = (out[l.good] || 0) + (l.lead || 1);
    return Object.keys(out).map(function (id) { return { id: id, q: out[id] }; });
  };
  H.give = function (list) {
    var s = S(), f = s.fleet, got = [], left = [];
    (list || []).forEach(function (x) {
      if (!G.GOOD[x.id] || x.q <= 0) return;
      var room = Math.max(0, Math.floor(R.free())), kindOk = f.cargo[x.id] || Object.keys(f.cargo).length < R.maxKinds();
      var q = kindOk ? Math.min(x.q, room) : 0;
      if (q > 0) {
        var cg = f.cargo[x.id];
        if (cg) { cg.cost = Math.round(cg.cost * cg.q / (cg.q + q)); cg.q += q; }   // 공짜로 얻은 것 — 매입가 평균이 그만큼 내려간다
        else f.cargo[x.id] = { q: q, cost: 0, from: null, d: s.day, hunt: true };
        got.push({ id: x.id, q: q });
      }
      if (q < x.q) left.push({ id: x.id, q: x.q - q });
    });
    return { got: got, left: left };
  };
  function names(l) { return l.map(function (x) { return G.GOOD[x.id].name + ' ' + x.q + '통'; }).join(' · '); }
  H.text = function (res) {
    if (!res) return '';
    var t = res.got.length ? names(res.got) + U.jx(names(res.got), '을/를') + ' 벗겨 짐칸에 실었다' : '';
    if (res.left.length) t += (t ? ' — ' : '') + '짐칸이 모자라 ' + names(res.left) + U.jx(names(res.left), '은/는') + ' 두고 왔다';
    return t;
  };
  /** 이 땅 짐승의 이름 (떼 · 우두머리) */
  H.label = function (lon, lat) {
    var bs = H.beasts(lon, lat), T = G.HUNT_SPOILS || {};
    var a = T[bs.pack] ? T[bs.pack].ko : '짐승', b = T[bs.lead] ? T[bs.lead].ko : a;
    return a === b ? a : a + '·' + b;
  };
})(window.G = window.G || {});
