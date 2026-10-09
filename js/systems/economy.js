/* 살아 있는 경제 — 세상의 시장 사건 (G.Econ)
   · 가뭄·흉년·풍작·역병·대화재·함대 건조·왕실 혼례·축제·향료 선단·대상로 막힘·혹한·전쟁… (사건 표 js/data/econ.js)
     한 도시(가운데)를 골라 둘레의 도시들에서 어떤 물건이 모자라거나(값↑·재고↓) 넘친다(값↓·재고↑).
   · 사건은 조짐(lead) → 차츰 세짐(rampIn) → 한창 → 가라앉음(rampOut)으로 흐른다. 조짐 동안에는 값이 그대로지만 술집에 소문이 돈다.
   · 모자람 사건은 도시마다 「모자란 양」이 있다. 누가(제독이) 그만큼 실어다 팔면 모자람이 풀려 값이 제자리로 돌아간다 — 먼저 간 사람이 남긴다.
   · 제독이 가까이 있으면 소식으로 듣고, 멀리 있으면 술집 소문·교역소 주인 이야기·그 도시에 들러서 안다(s.econ.ev[].known).
     모르는 사건도 값에는 그대로 들어간다 — 소식을 놓치면 싸게 팔거나 비싸게 사게 된다.
   · 값에 곱하기: rules.js R.buyPrice·R.sellPrice(E.mult 'buy'·'sell'), R.supply('stock'), R.onSell(E.onSell — 모자란 양 채우기)
   · 저장: s.econ = {ev: [사건], seq, seeded} — 사건 {n, type, at(가운데 도시), cities, nat, war, k(세기), ann(조짐 날), start, end, why, pre, fill{도시:{물건:통}}, known, told}
     옛 저장에는 없고 쓸 때 만든다.
   조정값: G.BALANCE.econ */
(function (G) {
  'use strict';
  var U = G.U, R = G.R;
  var E = G.Econ = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.econ) || {}; }
  function MK() { return (G.BALANCE && G.BALANCE.market) || { sat: [160, 140] }; }
  function st() { var s = S(); if (!s) return null; return s.econ || (s.econ = { ev: [], seq: 0 }); }
  E.state = st;
  var DEF = {}; (G.ECON_EVENTS || []).forEach(function (d) { DEF[d.id] = d; });
  E.DEF = DEF;
  function def(e) { return e.type === 'war' ? G.ECON_WAR_EVENT : DEF[e.type]; }
  E.def = def;
  function city(id) { return G.CITY_DATA[id]; }
  function day() { return S().day; }

  // ---------------------------------------------------------------- 사건의 세기
  /** 이 사건이 물건 g에 거는 배수 (1 = 상관없음). 도시 c는 「바깥 물건」 사건(imports)에만 쓴다 */
  function dOf(e, g, c) {
    var D = def(e), gd = G.GOOD[g]; if (!D || !gd) return 1;
    var d = null;
    if (D.scope === 'imports') d = c && !R.sells(c, g) ? D.imports : null;
    else if (D.goodsOver && D.goodsOver[g] != null) d = D.goodsOver[g];
    else if (D.goods && D.goods[g] != null) d = D.goods[g];
    else if (D.cats && D.cats[gd.cat] != null) d = D.cats[gd.cat];
    if (d == null || d === 1) return 1;
    return 1 + (d - 1) * (e.k || 1);
  }
  E.dOf = dOf;
  /** 0~1: 조짐 동안 0, 처음 rampIn 몫 동안 차츰, 끝 rampOut 몫 동안 차츰 가라앉음 */
  function ramp(e, d) {
    if (d == null) d = day();
    if (d < e.start || d >= e.end) return 0;
    var k = K(), t = (d - e.start) / Math.max(1, e.end - e.start), a = k.rampIn || 0.12, b = k.rampOut || 0.3;
    return t < a ? Math.max(0.15, t / a) : t > 1 - b ? Math.max(0, (1 - t) / b) : 1;
  }
  E.ramp = ramp;
  /** 이 도시가 받아 줄 모자란 양 (처음 크기 — 채운 것은 빼지 않음) */
  function needQty(e, c, g) {
    var d = dOf(e, g, c); if (d <= 1) return 0;
    var M = MK(), sat = M.sat || [160, 140];
    return Math.max(10, Math.round((sat[0] + (c.size || 1) * sat[1]) * (K().needK || 0.6) * (d - 1)));
  }
  E.needQty = needQty;
  /** 채운 양: 제독이 실어다 판 것 + 다른 상인들이 날마다 조금씩 실어 오는 것(npcFill × 모자란 양 × 지난 날) */
  function filled(e, c, g) {
    var f = e.fill && e.fill[c.id], mine = f && f[g] || 0, npc = K().npcFill || 0;
    return mine + (npc ? needQty(e, c, g) * Math.min(1, npc * Math.max(0, day() - e.start)) : 0);
  }
  /** 아직 모자란 양 */
  E.needLeft = function (e, c, g) { return Math.max(0, Math.round(needQty(e, c, g) - filled(e, c, g))); };
  /** 사건 하나가 지금 도시 c의 물건 g 값에 거는 배수 */
  function eff(e, c, g, d) {
    var v = dOf(e, g, c); if (v === 1) return 1;
    var r = ramp(e, d); if (!r) return 1;
    if (v > 1) { var nq = needQty(e, c, g), fr = nq ? Math.min(1, filled(e, c, g) / nq) : 0; return 1 + (v - 1) * r * (1 - fr); }
    return 1 + (v - 1) * r;
  }
  E.eff = eff;

  // ---------------------------------------------------------------- 도시 → 사건 (날마다 다시 만든다)
  var IDX = null, IDX_KEY = '';
  function index() {
    var T = st(); if (!T) return {};
    var key = day() + ':' + T.seq + ':' + T.ev.length;
    if (IDX && IDX_KEY === key && IDX_STATE === T) return IDX;
    IDX = {}; IDX_KEY = key; IDX_STATE = T;
    T.ev.forEach(function (e) { e.cities.forEach(function (id) { (IDX[id] = IDX[id] || []).push(e); }); });
    return IDX;
  }
  var IDX_STATE = null;
  /** 도시에 걸린 사건 (조짐 포함 — 값에 드는 것은 ramp가 0보다 큰 것만) */
  E.at = function (cid) { return index()[cid] || []; };
  E.activeAt = function (cid) { var d = day(); return E.at(cid).filter(function (e) { return d >= e.start && d < e.end; }); };

  /** 값에 곱하는 배수. side: 'sell'(제독이 파는 값) · 'buy'(제독이 사는 값) · 'stock'(교역소 재고) */
  E.mult = function (c, g, side) {
    if (!S() || !S().econ || !c) return 1;
    var L = E.at(c.id); if (!L.length) return 1;
    var k = K(), m = 1;
    for (var i = 0; i < L.length; i++) {
      var v = eff(L[i], c, g); if (v === 1) continue;
      if (side === 'sell') m *= v;
      else if (side === 'buy') m *= v > 1 ? 1 + (v - 1) * (k.buyShare == null ? 0.75 : k.buyShare) : v;
      else if (side === 'stock') m *= v > 1 ? 1 / (1 + (v - 1) * (k.stockK || 1.2)) : Math.min(2.5, 1 + (1 - v) * (k.glutStock || 1.5));
    }
    return m;
  };
  /** 팔았다: 모자람 사건이면 모자란 양을 채운다 (R.onSell) */
  E.onSell = function (c, g, q) {
    if (!S() || !S().econ) return;
    E.activeAt(c.id).forEach(function (e) {
      if (dOf(e, g, c) <= 1) return;
      var f = e.fill || (e.fill = {}), fc = f[c.id] || (f[c.id] = {});
      fc[g] = (fc[g] || 0) + q;
    });
  };
  /** 이 도시에서 이 물건이 아직 모자란 양 (한창인 모자람 사건들의 합) */
  E.needAt = function (c, g) {
    if (!S() || !S().econ) return 0;
    return U.sum(E.activeAt(c.id), function (e) { return dOf(e, g, c) > 1 && ramp(e) > 0 ? E.needLeft(e, c, g) : 0; });
  };
  /** 매각 창의 어림셈(되돌리기)용: 이 도시의 채운 양을 적어 두고 되돌린다 */
  E.snap = function (c) { return E.at(c.id).map(function (e) { return [e, e.fill && e.fill[c.id] ? JSON.stringify(e.fill[c.id]) : null]; }); };
  E.restore = function (c, sn) { (sn || []).forEach(function (x) { var e = x[0]; if (!e.fill) e.fill = {}; if (x[1]) e.fill[c.id] = JSON.parse(x[1]); else delete e.fill[c.id]; }); };

  // ---------------------------------------------------------------- 사건 일으키기
  function okNeed(D, c) {
    if (!D.need) return true;
    if (D.need === 'big') return c.size >= 2;
    if (D.need === 'port') return !!c.port;
    var f = R.facilities(c);
    if (D.need === 'palace') return !!f.palace;
    if (D.need === 'yard') return !!f.shipyard;
    return true;
  }
  function busy(type, cid) { return E.at(cid).some(function (e) { return e.type === type; }); }
  function exists(c) { return c && R.cityExists(c) && !c.outpost; }
  function pickCenter(D) {
    var s = S(), known = {};
    (s.known || []).forEach(function (id) { known[id] = 1; });
    var cand = G.CITY_DATA.filter(function (c) { return exists(c) && D.regions.indexOf(c.region) >= 0 && okNeed(D, c) && !busy(D.id, c.id) && (D.scope !== 'nation' || R.cityOwner(c) !== '원주민'); });
    if (!cand.length) return null;
    return U.weighted(cand, function (c) { return Math.pow(c.size || 1, 1.3) * (known[c.id] ? 1.8 : 1) * (c.port ? 1.2 : 1); });
  }
  function within(c0, r, filt) {
    return G.CITY_DATA.filter(function (c) { return exists(c) && G.Geo.dist(c0.lon, c0.lat, c.lon, c.lat) <= r && (!filt || filt(c)); }).map(function (c) { return c.id; });
  }
  function fill(t, e) {
    var c = city(e.at);
    return String(t || '').replace(/\{place\}/g, c ? c.name : '')
      .replace(/\{nation이\}/g, e.nat ? e.nat + U.jx(e.nat, '이/가') : '').replace(/\{nation\}/g, e.nat || '')
      .replace(/\{war이\}/g, e.war ? e.war + U.jx(e.war, '이/가') : '').replace(/\{war\}/g, e.war || '');
  }
  function make(type, at, cities, extra) {
    var T = st(), D = type === 'war' ? G.ECON_WAR_EVENT : DEF[type], k = K(), d = day();
    var lead = D.lead ? U.ri(D.lead[0], D.lead[1]) : 0, dur = U.ri(D.dur[0], D.dur[1]), sg = k.strength || [0.85, 1.15];
    var e = { n: ++T.seq, type: type, at: at, cities: cities, k: Math.round(U.rf(sg[0], sg[1]) * 100) / 100, ann: d, start: d + lead, end: d + lead + dur, fill: {} };
    if (extra) for (var x in extra) e[x] = extra[x];
    e.why = fill(U.pick(D.why), e);
    if (D.pre) e.pre = fill(D.pre, e);
    T.ev.push(e);
    return e;
  }
  /** 저절로 일어나는 사건 하나 (조건에 맞는 것 가운데 무게로) */
  E.spawn = function (typeId) {
    var s = S(), mo = s.date.m, y = s.date.y;
    var pool = typeId ? [DEF[typeId]] : G.ECON_EVENTS.filter(function (D) { return (!D.months || D.months.indexOf(mo) >= 0) && (!D.years || (y >= D.years[0] && y <= D.years[1])); });
    for (var tries = 0; tries < 6 && pool.length; tries++) {
      var D = U.weighted(pool, function (x) { return x.w || 1; });
      var c = pickCenter(D); if (!c) { pool = pool.filter(function (x) { return x !== D; }); continue; }
      var cities, extra = null;
      if (D.scope === 'area') cities = within(c, D.r || 5);
      else if (D.scope === 'nation') { var nat = R.cityOwner(c); cities = within(c, D.r || 9, function (x) { return R.cityOwner(x) === nat; }); extra = { nat: nat }; }
      else cities = [c.id];
      if (!cities.length) cities = [c.id];
      return make(D.id, c.id, cities, extra);
    }
    return null;
  };
  /** 정해서 일으키기 (시험·이야기 사건용): type, 가운데 도시 번호, {lead: 조짐 날수, dur: 날수, k: 세기} */
  E.start = function (type, cid, o) {
    o = o || {}; var D = DEF[type], c = city(cid); if (!D || !c) return null;
    var cities = D.scope === 'area' ? within(c, D.r || 5) : D.scope === 'nation' ? within(c, D.r || 9, function (x) { return R.cityOwner(x) === R.cityOwner(c); }) : [c.id];
    var e = make(type, c.id, cities.length ? cities : [c.id], D.scope === 'nation' ? { nat: R.cityOwner(c) } : null);
    var d = day();
    if (o.lead != null) { var len = e.end - e.start; e.start = d + o.lead; e.end = e.start + len; }
    if (o.dur != null) e.end = e.start + o.dur;
    if (o.k != null) e.k = o.k;
    return e;
  };
  /** 지금 벌어지는 실제 전쟁 (G.ECON_WARS) */
  E.wars = function (y) { y = y || S().date.y; return (G.ECON_WARS || []).filter(function (w) { return y >= w[0] && y <= w[1]; }); };
  /** 전쟁 사건: 그 전쟁의 나라 하나(그 전쟁 지역의 도시가 있는 나라) */
  E.spawnWar = function (w) {
    var T = st(), d = day();
    if (T.ev.some(function (e) { return e.type === 'war' && e.war === w[2] && d < e.end; })) return null;
    var byNat = {};
    G.CITY_DATA.forEach(function (c) { if (!exists(c) || w[4].indexOf(c.region) < 0) return; var o = R.cityOwner(c); if (w[3].indexOf(o) >= 0) (byNat[o] = byNat[o] || []).push(c); });
    var nats = Object.keys(byNat); if (!nats.length) return null;
    var nat = U.weighted(nats, function (n) { return byNat[n].length; }), list = byNat[nat];
    var at = U.weighted(list, function (c) { return Math.pow(c.size || 1, 1.5); });
    return make('war', at.id, list.map(function (c) { return c.id; }), { nat: nat, war: w[2] });
  };

  // ---------------------------------------------------------------- 날마다 (js/systems/world.js)
  function here() {
    var s = S(), l = s.loc || {};
    if (l.mode === 'city' && city(l.city)) return city(l.city);
    return { lon: l.lon || 0, lat: l.lat || 0, region: -1 };
  }
  function near(e) {
    var p = here(), c = city(e.at); if (!c) return false;
    if (e.cities.indexOf(S().loc && S().loc.city) >= 0 && S().loc.mode === 'city') return true;
    return G.Geo.dist(p.lon, p.lat, c.lon, c.lat) <= (K().newsDist || 12);
  }
  E.daily = function () {
    var s = S(), out = [], k = K(); if (!s || k.on === false) return out;
    var T = st(), d = day();
    T.ev = T.ev.filter(function (e) { return d < e.end; });
    // 처음: 세상에는 이미 몇 가지 일이 벌어지고 있다 (소식 없이, 한창인 채로)
    if (!T.seeded) {
      T.seeded = 1;
      for (var i = 0; i < (k.seed == null ? 7 : k.seed); i++) {
        var e0 = E.spawn(); if (!e0) continue;
        var len = e0.end - e0.start, back = Math.round(len * U.rf(0.1, 0.55));
        e0.ann = e0.start = d - back; e0.end = e0.start + len; e0.told = 1;
      }
      E.wars().forEach(function (w) { if (U.chance(0.5)) { var ew = E.spawnWar(w); if (ew) { var l2 = ew.end - ew.start, b2 = Math.round(l2 * U.rf(0.1, 0.5)); ew.ann = ew.start = d - b2; ew.end = ew.start + l2; ew.told = 1; } } });
    }
    // 실제 전쟁이 벌어지는 해
    E.wars().forEach(function (w) { if (U.chance(k.warPerDay == null ? 0.02 : k.warPerDay)) E.spawnWar(w); });
    // 저절로 일어나는 사건
    var live = T.ev.filter(function (e) { return e.type !== 'war'; }).length;
    if (live < (k.max || 14) && U.chance(k.perDay == null ? 0.1 : k.perDay)) E.spawn();
    // 가까이 있으면 소식을 듣는다 — 조짐부터, 일어날 때 한 번 더
    T.ev.forEach(function (e) {
      var D = def(e), c = city(e.at); if (!D || !c || e.told === 'on' || e.told === 1) return;
      var pre = d < e.start;
      if (pre && (e.told === 'pre' || !e.pre)) return;
      if (!near(e)) return;
      if (!pre && e.known && e.known >= e.start) { e.told = 'on'; return; }   // 그 도시에 들러 이미 안다
      e.told = pre ? 'pre' : 'on'; E.learn(e);
      out.push({ icon: 'scales', text: pre ? '장사꾼들 사이에 이런 말이 돈다. ' + e.pre + '.' : E.headline(e) });
      G.State.log('시장 소식: ' + E.title(e) + (pre ? ' (조짐)' : ''));
    });
    return out;
  };

  // ---------------------------------------------------------------- 알기·말하기
  E.learn = function (e) { if (e && !e.known) e.known = day(); };
  /** 도시에 들렀다: 그 도시에 걸린 사건을 알게 된다 — 새로 안 사건을 돌려준다 */
  E.visit = function (c) {
    if (!S() || !S().econ) return [];
    var out = [];
    E.activeAt(c.id).forEach(function (e) { if (!e.known) { E.learn(e); out.push(e); } });
    return out;
  };
  /** 사건이 움직이는 물건: [{g, d}] 세기 순 (imports 사건은 빈 목록) */
  E.goodsOf = function (e) {
    var D = def(e); if (!D || D.scope === 'imports') return [];
    var y = S().date.y, seen = {}, out = [];
    function add(g, d) { if (seen[g] || !G.GOOD[g] || d === 1) return; if (G.GOOD[g].nw && y < 1520) return; seen[g] = 1; out.push({ g: g, d: 1 + (d - 1) * (e.k || 1) }); }
    if (D.goodsOver) for (var g0 in D.goodsOver) add(g0, D.goodsOver[g0]);
    if (D.goods) for (var g1 in D.goods) add(g1, D.goods[g1]);
    if (D.cats) G.GOODS.forEach(function (gd) { if (D.cats[gd.cat] != null) add(gd.id, D.cats[gd.cat]); });
    return out.sort(function (a, b) { return Math.abs(Math.log(b.d)) - Math.abs(Math.log(a.d)); });
  };
  function names(list, n) { return list.slice(0, n).map(function (x) { return G.GOOD[x.g].name; }).join('·'); }
  function glut(e) { var D = def(e); return D && D.glut; }
  /** 소식 한 줄 (일어났을 때) */
  E.headline = function (e) {
    var D = def(e), gl = E.goodsOf(e), up = gl.filter(function (x) { return x.d > 1; }), dn = gl.filter(function (x) { return x.d < 1; });
    var t = e.why + '.';
    if (D.scope === 'imports') return t + ' 그 항구에서 산지가 아닌 물건은 값이 크게 뛰었다.';
    if (glut(e) && dn.length) return t + ' ' + names(dn, 3) + ' 값이 떨어지고 있다.';
    if (up.length) return t + ' ' + names(up, 3) + ' 값이 오르고 있다.';
    return t;
  };
  /** 술집·교역소에서 듣는 이야기 한 토막 (이 도시 c에서) */
  E.say = function (e, c) {
    var D = def(e), d = day(), C0 = city(e.at), left = Math.max(1, e.end - d);
    if (d < e.start) return '아직 소문일세만, ' + (e.pre || e.why) + '. ' + U.howLong(Math.max(1, e.start - d)) + ' 뒤면 값이 움직일 걸세.';
    if (D.scope === 'imports') return e.why + '. 그쪽에 물건을 대면 부르는 게 값이라더군. ' + U.howLong(left) + '은 갈 걸세.';
    var gl = E.goodsOf(e);
    if (glut(e)) {
      var dn = gl.filter(function (x) { return x.d < 1; }), v = eff(e, C0, dn[0].g);
      return e.why + '. ' + names(dn, 3) + ' 값이 ' + (v <= 0.6 ? '반값으로' : v <= 0.85 ? '삼 할쯤' : '조금') + ' 떨어졌다네. 싸게 사 둘 기회지. ' + U.howLong(left) + '은 갈 걸세.';
    }
    var up = gl.filter(function (x) { return x.d > 1; }); if (!up.length) return e.why + '.';
    var top = up[0], v2 = eff(e, C0, top.g), nl = E.needLeft(e, C0, top.g), nq = needQty(e, C0, top.g);
    var what = names(up, 3) + U.jx(G.GOOD[up[Math.min(2, up.length - 1)].g].name, '을/를') + ' 찾는다더군';
    if (v2 < 1.15 || nl < nq * 0.15) return e.why + '. ' + what + '. 하지만 벌써 여러 배가 실어다 채워서 값은 거의 제자리로 돌아왔다네.';
    var tail = nl < nq * 0.4 ? ' 다른 배들이 실어다 꽤 채웠지만 아직 ' + U.num(Math.round(nl / 10) * 10) + '통쯤 모자라다네.' : ' 그곳에선 ' + G.GOOD[top.g].name + U.jx(G.GOOD[top.g].name, '이/가') + ' 아직 ' + U.num(Math.round(nl / 10) * 10) + '통쯤 모자라다네.';
    var hm = U.howMuch(v2);
    return e.why + '. ' + what + '. 값이 ' + (/곱절$/.test(hm) ? hm + '로 뛰었고,' : hm + ' 올랐고,') + tail + ' ' + U.howLong(left) + '은 갈 걸세.';
  };
  /** 술집 소문: 이 도시에서 들을 만한 사건 n가지 (모르는 것·가까운 것 먼저). 들으면 알게 된다 */
  E.rumors = function (c, n) {
    var T = st(); if (!T) return [];
    var d = day(), k = K(), maxD = k.rumorDist || 40;
    var cand = T.ev.filter(function (e) {
      if (d >= e.end || (d < e.start && !e.pre)) return false;
      var c0 = city(e.at); if (!c0) return false;
      return e.cities.indexOf(c.id) >= 0 || G.Geo.dist(c.lon, c.lat, c0.lon, c0.lat) <= maxD || G.REGION_DIST[c.region][c0.region] <= 1;
    });
    var out = [];
    while (out.length < (n || 1) && cand.length) {
      var e = U.weighted(cand, function (x) { var c0 = city(x.at), dd = G.Geo.dist(c.lon, c.lat, c0.lon, c0.lat); return (x.known ? 0.2 : 1) / Math.pow(1 + dd / 10, 1.4) * (x.cities.indexOf(c.id) >= 0 ? 0.6 : 1); });
      cand = cand.filter(function (x) { return x !== e; });
      out.push(e);
    }
    return out;
  };
  /** 수첩·창에 쓰는 이름: 「가뭄 — 세빌리아 일대」 */
  E.title = function (e) {
    var D = def(e), c = city(e.at);
    if (e.type === 'war') return e.war + ' — ' + e.nat;
    if (D.scope === 'nation') return D.name + ' — ' + e.nat;
    return D.name + ' — ' + (c ? c.name : '') + (D.scope === 'area' ? ' 일대' : '');
  };
  /** 알고 있는 사건 (조짐 포함) */
  E.knownList = function () {
    var T = st(); if (!T) return [];
    var d = day();
    return T.ev.filter(function (e) { return e.known && d < e.end; }).sort(function (a, b) { return (a.start - b.start); });
  };
  /** 사고팔기 표의 꼬리표: 이 도시에서 이 물건 값에 걸린 사건 */
  E.tag = function (c, g) {
    if (!S() || !S().econ) return '';
    var by = {}, order = [];
    E.activeAt(c.id).forEach(function (e) {
      var v = eff(e, c, g); if (Math.abs(v - 1) < 0.12) return;
      var nm = e.type === 'war' ? '전쟁' : def(e).name, t = by[nm];
      if (!t) { t = by[nm] = { v: 1, tips: [] }; order.push(nm); }
      t.v *= v;
      t.tips.push(E.title(e) + ' — ' + e.why + '. ×' + v.toFixed(2) + (v > 1 ? ' · 아직 모자란 양 약 ' + U.num(E.needLeft(e, c, g)) + '통' : '') + ' · ' + Math.max(0, e.end - day()) + '일쯤 더');
    });
    return order.map(function (nm) { var t = by[nm]; return ' <span class="tag ' + (t.v > 1 ? 'ev-up' : 'ev-down') + '" title="' + U.esc(t.tips.join('\n')) + '">' + nm + ' ' + (t.v > 1 ? '▲' : '▼') + '</span>'; }).join('');
  };
  /** 도시 이름표의 한 줄: 이 도시에 걸린 사건 이름 */
  E.cityNote = function (c) {
    var L = E.activeAt(c.id); if (!L.length) return '';
    return L.map(function (e) { return e.type === 'war' ? '전쟁' : def(e).name; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).join('·');
  };
  /** 수첩 교역 맨 위 상자: 들은 시장 소식 */
  E.box = function () {
    var L = E.knownList(), d = day();
    if (!L.length) return '<div class="econ-box"><b>' + G.icon('scales') + ' 시장 소식</b> <small class="muted">— 아직 들은 소식이 없습니다. 술집의 「장사 소문을 듣는다」·교역소 주인의 이야기·가까운 곳의 소식으로 알게 됩니다.</small></div>';
    return '<div class="econ-box"><b>' + G.icon('scales') + ' 시장 소식</b> <small class="muted">— 들은 사건 ' + L.length + '가지. ▲ 모자라 비싸다 · ▼ 넘쳐 싸다. 모자란 물건은 누군가 채우면 값이 제자리로 돌아온다</small>' +
      L.map(function (e) {
        var gl = E.goodsOf(e), D = def(e), pre = d < e.start;
        var chips = D.scope === 'imports' ? '<span class="era-chip up">바깥에서 들여오는 물건 모두 ▲</span>' : gl.slice(0, 5).map(function (x) { return '<span class="era-chip ' + (x.d > 1 ? 'up' : 'down') + '" title="' + U.esc(G.GOOD[x.g].name + ' 값 ×' + x.d.toFixed(2) + ' (한창일 때 · 가운데 도시)') + '">' + G.goodDot(x.g) + G.GOOD[x.g].name + ' <small>' + (x.d > 1 ? '▲' : '▼') + '</small></span>'; }).join('');
        return '<div class="era-row econ-row"><span class="era-lbl ' + (pre ? 'soon' : glut(e) ? 'down' : 'up') + '" title="' + U.esc(e.why) + '">' + U.esc(E.title(e)) + '</span>' + chips +
          '<small class="muted"> ' + (pre ? '조짐 · ' + (e.start - d) + '일 뒤' : (e.end - d) + '일 남음') + '</small></div>';
      }).join('') + '</div>';
  };
})(window.G = window.G || {});
