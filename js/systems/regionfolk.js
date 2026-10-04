/* 고장마다 사람이 있게 (G.RegionFolk)
   · 해마다(BALANCE.regionFolk.every) 고장(G.MATE_ZONES)마다 머무는 항해사 후보를 세어, 어느 5년 칸을 보아도 목표 수가 있게 한다.
     「그해에 있는 도시(사람이 사는 곳 — 독도 같은 무인도는 뺀다) × ratio(0.8)」명보다 적으면, 모자라는 만큼 그 고장 태생의 이름 없는 사람을 새로 둔다.
   · 세는 사람: 술집에 나올 수 있는 항해사(해가 맞고 개척 단계도 열린 사람 — 실존 인물·철새·마녀·고장 사람) 가운데 고용·해고되지 않은 사람.
     여러 고장을 다니는 사람은 다니는 도시 가운데 그 고장 도시의 몫만큼만 센다(예: 이베리아·이탈리아를 다니면 반 명씩).
   · 새로 두는 사람은 그 도시의 말을 하고(G.REGION_FOLK.byLang의 이름 묶음), 다른 말은 드물게(extraLang) 하나만 안다.
     고장을 벗어나지 않고(zones: [그 고장]) 철새처럼 저장된다(s.wander.defs, local: 고장) — 세대가 바뀌면(30년) 떠나고 다음 셈 때 새 얼굴로 채운다.
   · 저장: s.rfolk = {win: 마지막으로 채운 해 칸} */
(function (G) {
  'use strict';
  var U = G.U, RF = {};
  G.RegionFolk = RF;
  function S() { return G.Game.state; }
  function cfg() { return (G.BALANCE && G.BALANCE.regionFolk) || {}; }
  function D() { return G.REGION_FOLK || {}; }
  function city(id) { return G.CITY_DATA[id]; }
  function exists(c, y) { return c && !(c.founded && y < c.founded) && !(c.until && y >= c.until); }
  function ready(m, y) { return G.Frontier ? G.Frontier.mateReady(m, y) : (y >= m.y[0] && y <= m.y[1]); }

  /** 그해 그 고장에서 사람이 사는 도시들 */
  RF.cities = function (z, y) {
    var zz = G.MATE_ZONES[z]; if (!zz) return [];
    return zz.ids.filter(function (id) { var c = city(id); return exists(c, y) && !c.outpost; });
  };
  /** 그 고장에 있어야 할 사람 수 */
  RF.target = function (z, y) { var r = cfg().ratio == null ? 0.8 : cfg().ratio; return Math.round(RF.cities(z, y).length * r); };
  /** 도시 → 그 도시가 든 고장들 */
  var zoneOf = null;
  function zonesOf(cid) {
    if (!zoneOf) { zoneOf = {}; Object.keys(G.MATE_ZONES).forEach(function (z) { G.MATE_ZONES[z].ids.forEach(function (id) { (zoneOf[id] = zoneOf[id] || []).push(z); }); }); }
    return zoneOf[cid] || [];
  }
  /** 고장마다 머무는 항해사 후보 수 — 여러 고장을 다니는 사람은 다니는 도시 가운데 그 고장 도시의 몫만큼 센다(기댓값).
      지금 자리로 세면 이웃 고장을 오가는 사람 탓에 채운 뒤 곧 비어 버린다 */
  RF.count = function () {
    var s = S(), y = s.date.y, out = {}, hired = {};
    s.mates.forEach(function (x) { hired[x.id] = 1; });
    G.MATES.forEach(function (m) {
      if (hired[m.id] || s.flags['gone_' + m.id] || s.player.wife === m.id || !ready(m, y)) return;
      var rng = G.MateMove.range(m.id).filter(function (cid) { var c = city(cid); return exists(c, y) && !c.outpost; });
      if (!rng.length) return;
      var w = 1 / rng.length;
      rng.forEach(function (cid) { zonesOf(cid).forEach(function (z) { out[z] = (out[z] || 0) + w; }); });
    });
    return out;
  };
  /** 지금 자리로 센 수 (조사용) */
  RF.here = function () {
    var s = S(), y = s.date.y, locs = G.MateMove.locs(), out = {}, hired = {};
    s.mates.forEach(function (x) { hired[x.id] = 1; });
    G.MATES.forEach(function (m) {
      if (hired[m.id] || s.flags['gone_' + m.id] || s.player.wife === m.id || !ready(m, y)) return;
      var cid = locs[m.id]; if (cid == null) return;
      zonesOf(cid).forEach(function (z) { out[z] = (out[z] || 0) + 1; });
    });
    return out;
  };
  /** 조사용: 고장마다 {도시, 목표, 지금} */
  RF.report = function () {
    var y = S().date.y, now = RF.count(), here = RF.here(), out = {};
    Object.keys(G.MATE_ZONES).forEach(function (z) { var n = RF.cities(z, y).length; if (n) out[z] = { cities: n, target: RF.target(z, y), now: Math.round((now[z] || 0) * 10) / 10, here: here[z] || 0 }; });
    return out;
  };

  // ---------------------------------------------------------------- 이름
  function taken() {
    var t = {}; G.MATES.forEach(function (m) { t[m.name] = 1; });
    return t;
  }
  function nameFrom(pk, g, home) {
    var W = G.WANDER_NATIONS && G.WANDER_NATIONS[pk];
    if (W && G.Wander && G.Wander.makeName) return G.Wander.makeName(pk, g).name;
    var p = D().pools[pk], t = taken(), list = p[g] || p.m, nm = null;
    for (var i = 0; i < 40 && !nm; i++) {
      var a;
      if (p.order === 'mono') a = U.pick(list);
      else if (p.order === 'combo') a = U.pick(p.a) + ' ' + U.pick(list);
      else if (p.order === 'sf') a = U.pick(p.sur) + (p.sep == null ? '' : p.sep) + U.pick(list);
      else a = U.pick(list) + ' ' + U.pick(p.sur);
      if (!t[a]) nm = a;
    }
    return nm || (U.pick(list) + ' (' + city(home).name + ')');
  }
  function natName(pk) {
    var W = G.WANDER_NATIONS && G.WANDER_NATIONS[pk];
    return W ? W.name : (D().pools[pk] || {}).name || '';
  }

  // ---------------------------------------------------------------- 얼굴: 나라별 항해사 얼굴 묶음 → 없으면 철새 얼굴 후보
  var POOL_OF = { VN: 'vn', PT: 'pt', BR: 'pt', FR: 'fr', DE: 'de', NL: 'nl', EN: 'en', ES: 'es', MX: 'es', SA: 'es', KR: 'kr', CN: 'cn', JP: 'jp', IN: 'ind', SE: 'se',
    TR: 'ot', AR: 'eg', PE: 'pe', CA: 'pe', AF: 'af', SW: 'af', AZT: 'az', TA: 'az', QU: 'inca', NA: 'na' };   // 이탈리아·그리스·루스·북유럽·몽골은 묶음이 없어 철새 얼굴 후보로
  function face(style, g, type, z, pk) {
    var pool = POOL_OF[pk];
    if (pool) {
      var ks = []; for (var i = 1; i <= 10; i++) { var k = 'portraits/pools/mates/' + pool + '/' + g + '/' + String(i).padStart(2, '0'); if (!G.Img || !G.Img.has || G.Img.has(k)) ks.push(k); }
      if (ks.length) return U.pick(ks);
    }
    var fp = G.Wander && G.Wander.facePool ? G.Wander.facePool(style, g, type) : [];
    return fp.length ? U.pick(fp) : null;
  }

  // ---------------------------------------------------------------- 한 사람
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  RF.make = function (z, home) {
    var s = S(), y = s.date.y, c = city(home), d = D(), cf = cfg();
    var pk = (d.byLang[c.lang] || function () { return null; })(z, c);
    if (!pk || (!(G.WANDER_NATIONS && G.WANDER_NATIONS[pk]) && !(d.pools && d.pools[pk]))) pk = 'ES';
    var types = Object.keys(G.WANDER_TYPES).filter(function (k) { return !(k === 'gun' && d.noGun.indexOf(c.lang) >= 0); });
    var tk = U.weighted(types, function (k) { return G.WANDER_TYPES[k].w || 1; }), T = G.WANDER_TYPES[tk];
    var g = U.chance(tk === 'war' || tk === 'gun' ? 0.18 : 0.35) ? 'f' : 'm';
    var st = T.st.map(function (v) { return clamp(v + U.ri(-12, 10), 26, 88); });
    var sk = {}, skSum = 0;
    T.sk.forEach(function (x) { var lv = U.ri(x[1], x[2]); if (lv > 0) { sk[x[0]] = lv; skSum += lv; } });
    var lg = {}; lg[c.lang] = 3;
    var ex = (d.extraLang[c.lang] || []).filter(function (l) { return !(l in lg); });
    var p = cf.extraLang == null ? 0.15 : cf.extraLang;
    if (tk === 'tongue') p = Math.min(1, p * 4);     // 통역은 그래도 하나쯤은 안다
    if (ex.length && U.chance(p)) lg[U.pick(ex)] = U.ri(1, 2);
    var stSum = st[0] + st[1] + st[2] + st[3];
    var fame = Math.max(0, Math.round(((stSum - 205) * 9 + skSum * 90 - 250) / 50) * 50);
    var wage = Math.max(20, Math.round((24 + skSum * 11 + (stSum - 200) / 3) / 5) * 5);
    var style = c.style || 'ib', nm = nameFrom(pk, g, home);
    var tn = ((d.typeName[tk] || {})[style]) || T.nm;
    var tx = G.WANDER_TEXT, tr = U.pick(tk === 'bard' ? d.text.bard : (tx.trait[tk] || tx.trait.nav));
    s.wander.seq = (s.wander.seq || 0) + 1;
    return {
      id: 'wd_' + y + '_' + s.wander.seq, name: nm, g: g, wd: true, local: z, nat: pk, natName: natName(pk), type: tk, typeName: tn, st: st, sk: sk, lg: lg, fame: fame, wage: wage,
      y: [y, 9999], reg: [c.region], desc: c.name + ' 태생의 ' + (g === 'f' ? '여' : '') + tn + '. ' + tr,
      story: c.name + '에서 태어났다. ' + U.pick(d.text.past) + ' ' + U.pick(d.text.dream),
      style: style, role: g === 'f' ? 'maid' : (T.role[0] || 'sailor'), face: face(style, g, tk, z, pk), zones: [z], home: home, gen: G.Wander.genOf(y), born: y, line: null, prevName: null
    };
  };

  /** 이 규칙이 생기기 전 저장: 지금 나와 있는 실존 고장 인물을 「이미 알린 사람」으로 적어 둔다 (불러오자마자 소문이 쏟아지지 않게) */
  function adopt(s, y) {
    if (!s.front || !s.front.mates) return;
    G.MATES.forEach(function (m) { if (m.native && ready(m, y)) s.front.mates[m.id] = 1; });
  }
  /** 모자라는 고장을 채운다. force가 아니면 every해(1년)마다 한 번 — 그래서 어느 5년 칸을 보아도 목표 수가 유지된다. 새로 둔 사람 수를 돌려준다 */
  RF.fill = function (force) {
    var s = S(); if (!s || !s.wander || !G.MateMove || !G.Wander) return 0;
    var y = s.date.y, cf = cfg(), win = Math.floor((y - 1480) / (cf.every || 1));
    if (!s.rfolk) adopt(s, y);
    s.rfolk = s.rfolk || {};
    if (!force && s.rfolk.win === win) return 0;
    s.rfolk.win = win;
    G.MateMove.locs();                 // s.mateLoc를 채워 둔다 (옛 저장)
    var now = RF.count(), made = 0, cap = cf.maxPerFill || 400;
    Object.keys(G.MATE_ZONES).forEach(function (z) {
      var cs = RF.cities(z, y); if (!cs.length) return;
      var need = Math.ceil(RF.target(z, y) - (now[z] || 0) - 0.25);
      for (var k = 0; k < need && made < cap; k++) {
        var home = U.weighted(cs, function (cid) { return 1 + (city(cid).size || 1); });
        var d = RF.make(z, home); if (!d) break;
        s.wander.defs[d.id] = d;
        if (!G.MATE[d.id]) { G.MATES.push(d); G.MATE[d.id] = d; }
        G.MATE_RANGE[d.id] = { zones: d.zones, home: d.home };
        s.mateLoc[d.id] = home;
        now[z] = (now[z] || 0) + 1;      // 이 고장 도시만 다니니 이 고장에 한 명 (겹치는 이웃 고장 몫은 다음 셈에서)
        made++;
      }
    });
    if (made && G.Bio) G.Bio.reset();
    return made;
  };

  /** 실존 인물(quiet)의 「소문」은 그 고장 도시를 하나라도 알 때만 돈다 */
  RF.heard = function (m) {
    var s = S(), r = G.MATE_RANGE[m.id]; if (!r) return true;
    return r.zones.some(function (z) { return (G.MATE_ZONES[z] || { ids: [] }).ids.some(function (id) { return s.known.indexOf(id) >= 0; }); });
  };
})(window.G = window.G || {});
