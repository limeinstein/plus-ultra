/* 항해사(부하 후보)의 발걸음: 도시마다 머무는 항해사가 있고, 한 달에 한 번 이웃 도시로 옮기거나 머문다.
   자기 고장(G.MATE_RANGE → G.MATE_ZONES)의 도시만 다닌다. 만날 수 있는 곳은 그 도시의 술집·여관뿐.
   저장: s.mateLoc = {항해사ID: 도시 번호} (없으면 처음 쓸 때 채운다 — 옛 저장 파일도 그대로 열린다) */
(function (G) {
  'use strict';
  var U = G.U, MM = {};
  G.MateMove = MM;
  function S() { return G.Game.state; }
  function CFG() { return G.MATE_MOVE || {}; }
  function city(id) { return G.CITY_DATA[id]; }
  function exists(c, y) { return c && !(c.founded && y < c.founded) && !(c.until && y >= c.until); }
  function dist(a, b) {
    var dl = Math.abs(a.lon - b.lon); if (dl > 180) dl = 360 - dl;
    var dx = dl * Math.cos((a.lat + b.lat) / 2 * Math.PI / 180), dy = a.lat - b.lat;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /** 그 항해사가 다니는 도시 번호들 (고장 순서대로, 겹치면 한 번) */
  var rangeCache = {};
  MM.range = function (id) {
    if (rangeCache[id]) return rangeCache[id];
    var r = G.MATE_RANGE && G.MATE_RANGE[id], out = [], seen = {};
    if (r) r.zones.forEach(function (z) { ((G.MATE_ZONES[z] || {}).ids || []).forEach(function (cid) { if (!seen[cid]) { seen[cid] = 1; out.push(cid); } }); });
    if (!out.length) {   // 표에 없는 항해사: 예전처럼 고장(region)의 도시
      var m = G.MATE[id];
      G.CITY_DATA.forEach(function (c) { if (m && m.reg.indexOf(c.region) >= 0) out.push(c.id); });
    }
    return (rangeCache[id] = out);
  };
  /** 다니는 고장 이름 (「이탈리아」, 「이베리아·마그레브·사헬」…) */
  MM.zoneNames = function (id) {
    var r = G.MATE_RANGE && G.MATE_RANGE[id];
    if (!r) { var m = G.MATE[id]; return m ? m.reg.map(function (x) { return G.REGIONS[x]; }).join('·') : ''; }
    return r.zones.map(function (z) { return (G.MATE_ZONES[z] || {}).name || z; }).join('·');
  };

  function pickStart(id, y) {
    var r = G.MATE_RANGE && G.MATE_RANGE[id], cfg = CFG();
    if (r && r.home != null && exists(city(r.home), y) && U.chance(cfg.homeStart == null ? 0.5 : cfg.homeStart)) return r.home;
    var first = r ? ((G.MATE_ZONES[r.zones[0]] || {}).ids || []) : MM.range(id);
    var ok = first.filter(function (cid) { return exists(city(cid), y); });
    if (!ok.length) ok = MM.range(id).filter(function (cid) { return exists(city(cid), y); });
    if (!ok.length) return r && r.home != null ? r.home : null;
    return weighted(ok, function (cid) { return 1 + (city(cid).size || 1); });
  }
  function weighted(list, wf) {
    var tot = 0, ws = list.map(function (x) { var w = wf(x); tot += w; return w; }), r = U.rand() * tot;
    for (var i = 0; i < list.length; i++) { r -= ws[i]; if (r <= 0) return list[i]; }
    return list[list.length - 1];
  }

  /** 모든 항해사의 자리 (처음이면 채운다) */
  MM.locs = function () {
    var s = S(); if (!s) return {};
    s.mateLoc = s.mateLoc || {};
    var y = s.date.y;
    G.MATES.forEach(function (m) {
      var cur = s.mateLoc[m.id];
      if (cur == null || !exists(city(cur), y) || MM.range(m.id).indexOf(cur) < 0) {
        var st = pickStart(m.id, y);
        if (st != null) s.mateLoc[m.id] = st;
      }
    });
    return s.mateLoc;
  };
  MM.where = function (id) { var l = MM.locs()[id]; return l == null ? null : city(l); };

  /** 한 달에 한 번: 머물거나 가까운 도시(큰 도시일수록 잘 감)로, 가끔 배를 타고 먼 고장으로 */
  MM.month = function () {
    var s = S(), y = s.date.y, locs = MM.locs(), cfg = CFG(), out = [];
    var hired = {}; s.mates.forEach(function (x) { hired[x.id] = 1; });
    G.MATES.forEach(function (m) {
      if (hired[m.id] || s.flags['gone_' + m.id]) return;
      var cur = city(locs[m.id]); if (!cur) return;
      if (U.chance(cfg.stay == null ? 0.5 : cfg.stay)) return;
      var rng = MM.range(m.id).filter(function (cid) { return cid !== cur.id && exists(city(cid), y); });
      if (!rng.length) return;
      rng.sort(function (a, b) { return dist(cur, city(a)) - dist(cur, city(b)); });
      var near = rng.slice(0, Math.max(1, cfg.near || 4)), to;
      var far = cur.port ? rng.slice(near.length).filter(function (cid) { return city(cid).port && dist(cur, city(cid)) > 20; }) : [];
      if (far.length && U.chance(cfg.voyage == null ? 0.06 : cfg.voyage)) to = U.pick(far);
      else to = weighted(near, function (cid) { var c = city(cid); return (1 + (c.size || 1)) / (1 + dist(cur, c) * 0.15); });
      locs[m.id] = to;
      out.push(m.id);
    });
    return out;
  };

  /** 이 도시의 술집·여관에 지금 있는 항해사 (고용했거나 떠나보낸 사람은 뺀다) */
  MM.here = function (cityId) {
    var s = S(), locs = MM.locs();
    return G.MATES.filter(function (m) {
      return locs[m.id] === cityId && !s.mates.some(function (x) { return x.id === m.id; }) && !s.flags['gone_' + m.id];
    });
  };
  /** 이 도시 근처에 있는 항해사 (술집 주인의 귀띔용): [{m, c, d}] 가까운 순 */
  MM.nearby = function (c, ok, maxD) {
    var s = S(), locs = MM.locs(), out = [];
    maxD = maxD || CFG().hintDeg || 14;
    G.MATES.forEach(function (m) {
      if (s.mates.some(function (x) { return x.id === m.id; }) || s.flags['gone_' + m.id]) return;
      if (ok && !ok(m)) return;
      var at = city(locs[m.id]); if (!at || at.id === c.id) return;
      var d = dist(c, at); if (d <= maxD) out.push({ m: m, c: at, d: d });
    });
    return out.sort(function (a, b) { return a.d - b.d; });
  };
})(window.G = window.G || {});
