/* 살아 있는 경제 — 세상의 시장 사건 (G.Econ)
   · 가뭄·흉년·풍작·역병·대화재·함대 건조·왕실 혼례·축제·향료 선단·대상로 막힘·혹한·전쟁… (사건 표 js/data/econ.js)
     한 도시(가운데)를 골라 둘레의 도시들에서 어떤 물건이 모자라거나(값↑·재고↓) 넘친다(값↓·재고↑).
   · 사건은 조짐(lead) → 차츰 세짐(rampIn) → 한창 → 가라앉음(rampOut)으로 흐른다. 조짐 동안에는 값이 그대로지만 술집에 소문이 돈다.
   · 모자람 사건은 도시마다 「모자란 양」이 있다. 누가(제독이) 그만큼 실어다 팔면 모자람이 풀려 값이 제자리로 돌아간다 — 먼저 간 사람이 남긴다.
   · 제독이 가까이 있으면 소식으로 듣고, 멀리 있으면 술집 소문·교역소 주인 이야기·그 도시에 들러서 안다(s.econ.ev[].known).
     모르는 사건도 값에는 그대로 들어간다 — 소식을 놓치면 싸게 팔거나 비싸게 사게 된다.
   · 값에 곱하기: rules.js R.buyPrice·R.sellPrice(E.mult 'buy'·'sell'), R.supply('stock'), R.onSell(E.onSell — 모자란 양 채우기)
   · 제독이 실어다 팔아 모자람이 풀리면(E.sold) 적어 두고, 거리 사람·술집 소문이 그 이야기를 한다(E.reliefLine·E.reliefMurmur).
   · 저장: s.econ = {ev: [사건], seq, seeded, relief: [풀린 일], reliefSeq} — 사건 {n, type, at(가운데 도시), cities, nat, war, k(세기), ann(조짐 날), start, end, why, pre, fill{도시:{물건:통}}, known, told}
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

  // ---------------------------------------------------------------- 제독이 실어다 풀었다 (모자람이 풀림 → 마을 사람들의 입으로)
  /* 매각이 끝난 뒤(js/city/trade.js sellQty) 한 번: 이번 매각으로 모자람 사건이 풀렸거나(full) 크게 꺾였으면(part) 적어 둔다.
     s.econ.relief = [{id, ev(사건 n), type, city, g, q(제독이 이 도시에 판 양), day, kind, mb·ma(사건 배수 전·뒤), pb·pa(사는 값 전·뒤), why, others[아직 모자란 이웃 도시], told{도시: 몇 번}}]
     거리 사람(js/systems/streetfolk.js)이 그 도시에서는 고마움·값 이야기로, 이웃 도시에서는 「…라더라」로 전한다. 술집 소문(E.say)도 제독의 이름을 댄다. */
  function RK() { return K().relief || {}; }
  /** 사건 까닭을 들은 말로 (「… 밀밭이 타들어 간다」 → 「… 밀밭이 타들어 간다고들 했지. 」) */
  function whySay(w) { var t = String(w || '').replace(/[.。]\s*$/, ''); return /다$/.test(t) ? t + '고들 했지. ' : ''; }
  function reliefs() { var T = st(); return T ? (T.relief || (T.relief = [])) : []; }
  E.reliefs = reliefs;
  E.sold = function (c, g, q) {
    if (!S() || !S().econ || !c || !q) return [];
    var out = [], rk = RK(), d = day(), T = st();
    E.activeAt(c.id).forEach(function (e) {
      var v = dOf(e, g, c); if (v <= 1) return;
      var r = ramp(e); if (!r) return;
      var nq = needQty(e, c, g); if (!nq) return;
      var left = E.needLeft(e, c, g), leftB = Math.min(nq, left + q);
      var frA = 1 - left / nq, frB = 1 - leftB / nq;
      var mb = 1 + (v - 1) * r * (1 - frB), ma = 1 + (v - 1) * r * (1 - frA);
      if (mb < 1.12) return;                                         // 이미 거의 제자리였다 — 이야깃거리가 아니다
      var mine = (e.fill && e.fill[c.id] && e.fill[c.id][g]) || q;
      var full = left <= nq * (rk.fullLeft == null ? 0.06 : rk.fullLeft);
      var prev = reliefs().filter(function (x) { return x.ev === e.n && x.city === c.id && x.g === g; });
      if (prev.some(function (x) { return x.kind === 'full'; })) return;
      if (!full && (prev.length || mine < nq * (rk.partShare == null ? 0.4 : rk.partShare) || mb - ma < 0.15)) return;
      var bs = K().buyShare == null ? 0.75 : K().buyShare, pa = Math.round(R.buyPrice(c, g)), pb = Math.round(pa * (1 + (mb - 1) * bs) / (1 + (ma - 1) * bs));
      var others = e.cities.filter(function (id) {
        var t = city(id); if (!t || id === c.id || !t.port) return false;
        var n2 = needQty(e, t, g); return n2 > 0 && E.needLeft(e, t, g) > n2 * 0.4;
      }).map(function (id) { var t = city(id); return { id: id, d: G.Geo.dist(c.lon, c.lat, t.lon, t.lat), left: E.needLeft(e, t, g) }; })
        .sort(function (a, b) { return a.d - b.d; }).slice(0, 3);
      if (prev.length) { var T0 = T.relief; T.relief = T0.filter(function (x) { return prev.indexOf(x) < 0; }); }
      var rec = { id: (T.reliefSeq = (T.reliefSeq || 0) + 1), ev: e.n, type: e.type, city: c.id, g: g, q: Math.round(mine), day: d, kind: full ? 'full' : 'part',
        mb: Math.round(mb * 100) / 100, ma: Math.round(ma * 100) / 100, pb: pb, pa: pa, why: e.why, left: left, others: others, told: {} };
      reliefs().push(rec); out.push(rec);
      E.learn(e);
      G.State.log('시장: ' + c.name + '의 ' + G.GOOD[g].name + ' 모자람' + (full ? '이 풀렸다' : '이 한풀 꺾였다') + ' — 실어다 판 ' + U.num(rec.q) + '통. 값 ' + U.num(pb) + ' → ' + U.num(pa) + '닢');
    });
    // 오래된 이야기는 잊힌다
    var keep = rk.keepDays || 240;
    if (T.relief && T.relief.length) T.relief = T.relief.filter(function (x) { return d - x.day <= keep; }).slice(-(rk.max || 30));
    return out;
  };
  /** 매각 뒤 알림 한 줄 */
  E.reliefToast = function (rec) {
    var c = city(rec.city), gn = G.GOOD[rec.g].name;
    return rec.kind === 'full'
      ? c.name + '에 ' + U.num(rec.q) + '통의 ' + gn + U.jx(gn, '이/가') + ' 풀리자 모자람이 가셨다. ' + gn + ' 값이 ' + U.num(rec.pb) + '닢에서 ' + U.num(rec.pa) + '닢으로 제자리를 찾았다 — 거리에 소문이 돌기 시작한다.'
      : c.name + '의 ' + gn + ' 값이 한풀 꺾였다(' + U.num(rec.pb) + ' → ' + U.num(rec.pa) + '닢). 아직 ' + U.num(Math.round(rec.left / 10) * 10) + '통쯤 모자라다.';
  };
  /** 이 도시 c의 거리에서 들릴 만한 이야기: {rec, local} — 그 도시면 local, 이웃이면 들은 이야기 */
  E.reliefNear = function (c) {
    if (!S() || !S().econ || !c) return null;
    var rk = RK(), d = day(), best = null;
    reliefs().forEach(function (x) {
      var age = d - x.day, t = city(x.city); if (!t || age < 0) return;
      var local = x.city === c.id;
      if (local ? age > (x.kind === 'full' ? (rk.localDays || 45) : (rk.partDays || 25)) : (x.kind !== 'full' || age > (rk.hearDays || 90))) return;
      if (!local) {
        var dd = G.Geo.dist(c.lon, c.lat, t.lon, t.lat);
        if (dd > (rk.hearDist || 22) && !(G.REGION_DIST[c.region] && G.REGION_DIST[c.region][t.region] === 0)) return;
        if (age < Math.min(20, dd * 0.8)) return;                    // 소문이 닿는 데도 날이 걸린다
        if (((x.told || {})[c.id] || 0) >= (rk.hearTell || 2)) return;
      } else if (((x.told || {})[c.id] || 0) >= (rk.localTell || 6)) return;
      var w = (local ? 10 : 1) - age / 100;
      if (!best || w > best.w) best = { rec: x, local: local, w: w };
    });
    return best;
  };
  /** 지나가며 들리는 짧은 말 (말풍선) */
  E.reliefMurmur = function (n, c) {
    var R0 = n.rec, gn = G.GOOD[R0.g].name, t = city(R0.city), food = G.GOOD[R0.g].cat === 'food';
    if (!n.local) return U.pick([t.name + '에 ' + gn + U.jx(gn, '이/가') + ' 풀렸대', t.name + ' ' + gn + ' 값이 내렸다던데', t.name + ' 쪽은 한시름 놨다네']);
    if (R0.kind === 'part') return U.pick([gn + ' 값이 좀 내렸네', '그래도 아직 모자라대', '배가 또 오면 좋겠는데']);
    return U.pick([gn + ' 값이 내렸대!', '부두에 ' + gn + U.jx(gn, '이/가') + ' 들어왔어', food ? '이제 끼니 걱정은 덜었네' : '이제 한시름 놨네', '어느 배 덕분이래', gn + ' 값이 제자리래']);
  };
  /** 거리 사람이 말을 걸었을 때 하는 이야기 (f: 거리 사람) — 없으면 null */
  E.reliefLine = function (f, c) {
    if (!f || f.animal || f.reliefSaid) return null;
    var n = E.reliefNear(c); if (!n) return null;
    var rk = RK(), told = (n.rec.told || {})[c.id] || 0;
    if (!f.murmur && !U.chance(n.local ? (told < (rk.localSure == null ? 3 : rk.localSure) ? 1 : (rk.localLater == null ? 0.5 : rk.localLater)) : (rk.hearChance == null ? 0.45 : rk.hearChance))) return null;
    var x = n.rec, t = city(x.city), gn = G.GOOD[x.g].name, food = G.GOOD[x.g].cat === 'food', s = S();
    var she = s.player.g === 'f', pn = s.player.name || '제독';
    var price = gn + ' 값이 한 통 ' + U.num(x.pb) + '닢에서 ' + U.num(x.pa) + '닢으로';
    var oth = (x.others || []).filter(function (o) { var t2 = city(o.id); if (!t2) return false; var e = st().ev.filter(function (e0) { return e0.n === x.ev; })[0]; return e && day() < e.end && E.needLeft(e, t2, x.g) > 30; });
    var nextTip = oth.length ? ' 그래도 ' + city(oth[0].id).name + U.jx(city(oth[0].id).name, '은/는') + ' 아직 ' + gn + U.jx(gn, '이/가') + ' 모자라다더군.' : '';
    var type = f.type, text;
    if (n.local && x.kind === 'part') {
      text = type === 'merchant' ? '당신 배가 ' + gn + ' ' + U.num(x.q) + '통을 풀어서 ' + price + ' 꺾였소. 그래도 아직 ' + U.num(Math.round(x.left / 10) * 10) + '통쯤 모자라오. 한 번 더 실어 오면 그만큼 또 남을 거요.'
        : type === 'boy' || type === 'girl' ? (she ? (type === 'boy' ? '누나' : '언니') : '아저씨') + '가 ' + gn + ' 실어 왔죠? 엄마가 조금 나아졌대요. 근데 아직 모자라대요.'
        : '선장님 배가 ' + U.eul(gn) + ' 실어 온 덕에 ' + price + ' 내렸어요. 그래도 아직 다 채워지진 않았대요. 다른 배도 오면 좋겠는데.';
    } else if (n.local) {
      if (type === 'merchant') text = '당신이 ' + gn + ' ' + U.num(x.q) + '통을 푼 그 선장이로군. 덕분에 ' + price + ' 돌아갔소. 이제 여기에 ' + U.eul(gn) + ' 가져와도 큰 재미는 없을 거요.' + (oth.length ? ' 남기려면 ' + city(oth[0].id).name + U.jx(city(oth[0].id).name, '으로/로') + ' 가 보시오. 거긴 아직 ' + U.num(Math.round(oth[0].left / 10) * 10) + '통쯤 모자라다니.' : ' 모자란 곳은 늘 바뀌는 법이지.');
      else if (type === 'grandma') text = '자네가 ' + U.eul(gn) + ' 실어 왔다면서? 장에서 ' + price + ' 내렸다네. ' + (food ? '이제 손주들 끼니 걱정은 덜었어.' : '이제야 숨통이 트이는구먼.') + ' 고맙네, 고마워.';
      else if (type === 'woman') text = '선장님이 ' + U.eul(gn) + ' 실어 왔다면서요? 장에서 ' + price + ' 내렸어요. ' + (food ? '이제 애들 끼니 걱정은 덜었네요.' : '숨통이 좀 트였어요.') + ' 고마워요.';
      else if (type === 'boy' || type === 'girl') text = (she ? (type === 'boy' ? '누나' : '언니') : '아저씨') + '가 ' + gn + ' 실어 온 사람이에요? ' + (food ? '엄마가 이제 배불리 먹을 수 있대요!' : '어른들이 다 그 배 이야기만 해요!');
      else if (type === 'man' || type === 'navigator' || type === 'soldier') text = '부두에 ' + gn + ' ' + U.num(x.q) + '통이 내려지는 걸 봤소. 그게 당신 배였구려. ' + (x.why ? whySay(x.why) : '') + '치솟던 ' + gn + ' 값이 그 뒤로 제자리로 돌아왔소.';
      else text = '이 고장 사람들이 한시름 놓았네. ' + gn + U.jx(gn, '이/가') + ' 모자라 다들 애를 태웠는데, ' + pn + ' 선장 배가 실어 온 뒤로 ' + price + ' 돌아갔지.';
    } else {
      var who = pn + ' 선장';
      text = type === 'merchant'
        ? t.name + ' 쪽은 이제 늦었소. 누가 ' + gn + ' ' + U.num(Math.round(x.q / 10) * 10) + '통을 먼저 풀어서 값이 제자리로 돌아갔다더군.' + (oth.length ? ' 그 일대에서 아직 모자란 데는 ' + oth.map(function (o) { return city(o.id).name; }).join('·') + '쯤이라오.' : ' 이제 그쪽으로 ' + U.eul(gn) + ' 싣고 가 봐야 헛걸음이오.')
        : '들었소? ' + t.name + '에 ' + gn + U.jx(gn, '이/가') + ' 모자라 난리였는데, 어느 배가 ' + U.num(Math.round(x.q / 10) * 10) + '통을 실어다 풀어서 값이 제자리로 돌아갔다지 뭐요. ' + who + '이라던데… 혹시 당신이오?' + nextTip;
    }
    f.reliefSaid = x.id;
    x.told = x.told || {}; x.told[c.id] = (x.told[c.id] || 0) + 1;
    return { text: text, rec: x };
  };
  /** 술집·교역소 소문(E.say)에 쓰는: 이 사건을 제독이 풀어 준 일이 있나 */
  function reliefOf(e) { var L = reliefs().filter(function (x) { return x.ev === e.n && x.kind === 'full'; }); return L[L.length - 1] || null; }
  E.reliefOf = reliefOf;

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
    var firstDay = !T.seeded;
    T.ev = T.ev.filter(function (e) { return d < e.end; });
    // 처음: 세상에는 이미 몇 가지 일이 벌어지고 있다 (소식 없이, 한창인 채로)
    if (firstDay) {
      T.seeded = 1;
      for (var i = 0; i < (k.seed == null ? 7 : k.seed); i++) {
        var e0 = E.spawn(); if (!e0) continue;
        var len = e0.end - e0.start, back = Math.round(len * U.rf(0.1, 0.55));
        e0.ann = e0.start = d - back; e0.end = e0.start + len; e0.told = 1;
      }
      E.wars().forEach(function (w) { if (U.chance(0.5)) { var ew = E.spawnWar(w); if (ew) { var l2 = ew.end - ew.start, b2 = Math.round(l2 * U.rf(0.1, 0.5)); ew.ann = ew.start = d - b2; ew.end = ew.start + l2; ew.told = 1; } } });
    }
    // 초기 사건을 만든 날에는 일반 일일 사건을 겹쳐 만들지 않는다.
    // 그렇지 않으면 첫 화면에 아직 알리지 않은 사건이 섞일 수 있다.
    if (!firstDay) {
      // 실제 전쟁이 벌어지는 해
      E.wars().forEach(function (w) { if (U.chance(k.warPerDay == null ? 0.02 : k.warPerDay)) E.spawnWar(w); });
      // 저절로 일어나는 사건
      var live = T.ev.filter(function (e) { return e.type !== 'war'; }).length;
      if (live < (k.max || 14) && U.chance(k.perDay == null ? 0.1 : k.perDay)) E.spawn();
    }
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
    if (D.cats) G.GOODS.forEach(function (gd) { if (D.cats[gd.cat] != null && !gd.plant) add(gd.id, D.cats[gd.cat]); });   // 식물 특산물은 심은 곳에만 있어 갈래 사건에서 뺀다
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
    if (v2 < 1.15 || nl < nq * 0.15) {
      var rl = reliefOf(e);
      if (rl && city(rl.city)) return e.why + '. ' + what + '. 그런데 ' + (S().player.name || '어느') + ' 선장의 배가 ' + city(rl.city).name + '에 ' + G.GOOD[rl.g].name + ' ' + U.num(Math.round(rl.q / 10) * 10) + '통을 먼저 풀어서 값은 거의 제자리로 돌아왔다네.';
      return e.why + '. ' + what + '. 하지만 벌써 여러 배가 실어다 채워서 값은 거의 제자리로 돌아왔다네.';
    }
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
