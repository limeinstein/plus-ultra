/* 자연재해 (G.Disaster) — 고정된 재해와 지도 위를 이동하는 토네이도·허리케인
   · 역사에 남은 재해(G.DISASTERS, js/data/disasters.js)는 그해 그 날 그 자리에서 일어난다.
   · 재해가 잦은 땅(G.HAZARD_ZONES)과 화산(G.VOLCANOES)에서는 이름 없는 재해가 가끔 일어난다. 탐험대가 그 땅을 걸으면 더 잦게 맞닥뜨린다(localK).
   · 한 번 일어난 재해는 며칠(갈래마다·사건마다 다르다) 이어진다 — 그 안에서는 탐험대의 걸음이 느려지고(slow) 지친다.
   · 탐험대 피해(D.land, js/scenes/land.js 하루 처리에서): 대원·짐승을 잃고, 부하가 다치고(m.hurt), 물자(금화)를 잃고, 길이 막혀 날을 허비한다.
     조짐을 알아채면(과학·역사학·측량, 역사에 남은 재해는 역사학이 더) 피하는 길을 고를 수 있다. 운용술·의학이 피해를 줄인다.
   · 배: 쓰나미·해일이 덮친 항구에 있거나, 해안 가까이 떠 있거나, 탐험대가 배를 해안에 대 두었으면 배가 상한다.
   · 도시: 재해가 덮친 도시는 한동안 시장 값이 뛴다(시장 사건). 들어가면 무너진 모습을 보고 구호금을 낼 수 있다(사교 명성).
   · 저장: s.dis = {act: 지금 이어지는 재해, hp: 다음에 볼 역사 재해 번호, city: {도시: 피해}, seq}
   조정값: G.BALANCE.disaster · 그림: js/art/disasterfx.js */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, D = {};
  G.Disaster = D;
  function S() { return G.Game.state; }
  function cfg() { return (G.BALANCE && G.BALANCE.disaster) || {}; }
  function K(kind) { return G.DISASTER_KINDS[kind]; }
  function ground(kind) { return G.GroundDisaster && G.GroundDisaster.handles(kind); }
  function st() {
    var s = S(); if (!s) return null;
    return s.dis || (s.dis = { act: [], hp: -1, city: {}, seq: 0 });
  }
  function dist(a, b, c, d) { return G.Geo && G.Geo.dist ? G.Geo.dist(a, b, c, d) : Math.hypot(a - c, b - d); }
  function isLand(lon, lat) { return !G.Geo || !G.Geo.isLand || G.Geo.isLand(lon, lat); }
  /** 해안까지 거리(°) — 땅이든 바다든 */
  function coastDist(lon, lat) { return G.Geo && G.Geo.sdfRaw && G.Geo.TEX_PER_DEG ? Math.abs(G.Geo.sdfRaw(lon, lat)) / G.Geo.TEX_PER_DEG : 0.1; }
  D.coastDist = coastDist;
  function dayOf(y, m, d) { return U.dayIndex({ y: y, m: m, d: d }); }
  function today() { return U.dayIndex(S().date); }

  // 시장 사건 (js/core/rules.js EVENTS) — 재해가 덮친 도시
  var MKT = { quake: '지진 피해', volcano: '화산재', landslide: '산사태 피해', tsunami: '해일 피해', flood: '홍수 피해', fire: '산불 피해' };
  if (R && R.MARKET_EVENTS) {
    R.MARKET_EVENTS['지진 피해'] = { cats: { food: 1.3 }, goods: { timber: 1.7, iron: 1.3 } };
    R.MARKET_EVENTS['화산재'] = { cats: { food: 1.5 }, all: 0.95 };
    R.MARKET_EVENTS['산사태 피해'] = { cats: { food: 1.25 }, goods: { timber: 1.3 } };
    R.MARKET_EVENTS['해일 피해'] = { cats: { food: 1.4 }, goods: { timber: 1.6 }, all: 0.95 };
    R.MARKET_EVENTS['홍수 피해'] = { cats: { food: 1.6 }, all: 0.95 };
    R.MARKET_EVENTS['산불 피해'] = { goods: { timber: 1.4 }, cats: { food: 1.15 } };
  }

  // ---------------------------------------------------------------- 재해 하나 일으키기
  /** def: {kind, name, place, lon, lat, sev, r, days, hist, t, tsu, slide}. 이어서 오는 쓰나미·산사태도 함께 올린다 */
  D.start = function (def, quiet) {
    var T = st(); if (!T) return null;
    var k = K(def.kind); if (!k) return null;
    var sev = U.clamp(def.sev || 1, 1, 3), now = today();
    var ev = { id: 'ds' + (++T.seq), hid: def.id || null, kind: def.kind, name: def.name || (def.place ? def.place + ' ' : '') + k.name, place: def.place || '', lon: def.lon, lat: def.lat, sev: sev,
      r: def.r || k.r[sev - 1], start: now, end: now + (def.days || Math.round(k.days * (0.7 + sev * 0.3))), hist: !!def.hist, t: def.t || '', y: S().date.y, m: S().date.m };
    if(ground(ev.kind)){
      var field=G.GroundDisaster.ensure(ev);
      if(!field&&!ev.hist&&(def.localField||ev.kind==='landslide'||ev.kind==='fire'||ev.kind==='flood')&&G.Hydro&&G.Hydro.ready)return null;
    }
    T.act.push(ev);
    var windRule = cfg().moving && cfg().moving[ev.kind];
    if (windRule) {
      ev.wind = { age: 0, offSurface: 0, hitWait: 0, originalR: ev.r, life: ev.end - now,
        heading: def.heading == null ? U.rf(-Math.PI, Math.PI) : def.heading,
        speed: def.speed == null ? U.rf(windRule.speed[0], windRule.speed[1]) : def.speed,
        curve: def.curve == null ? U.rf(-windRule.curve, windRule.curve) : def.curve };
      ev.known = true; ev.out = [];
      return ev;
    }
    var out = [];
    if (def.tsu) { var tw = D.start({ kind: 'tsunami', name: (def.name || '') + ' 해일', place: def.place, lon: def.lon, lat: def.lat, sev: Math.max(1, sev - (sev > 2 ? 0 : 1)), r: Math.max(K('tsunami').r[sev - 1], (def.r || 0) * 1.2), hist: def.hist, sub: 1 }, true); if (tw) tw.parent = ev.id; }
    if (def.slide) { var sl = D.start({ kind: 'landslide', name: (def.name || '') + ' 산사태', place: def.place, lon: def.lon, lat: def.lat, sev: Math.max(1, sev - 1), r: K('landslide').r[2] * 1.4, hist: def.hist, sub: 1 }, true); if (sl) sl.parent = ev.id; }
    if (!def.sub) {
      if(!def.localField)cityHits(ev);
      fleetHit(ev, out);
      var s = S(), d = dist(s.loc.lon, s.loc.lat, ev.lon, ev.lat), near = d < (cfg().news || 15);
      ev.known = near || ev.hist && sev >= 3;
      if (!quiet && (ev.known || ev.cityHit)) {
        var txt = (ev.hist ? '【' + ev.name + '】 ' : '') + (ev.place || '') + '에서 ' + k.name + U.jx(k.name, '이/가') + ' 일어났다' + (def.tsu ? ' — 해일이 해안을 덮쳤다' : '') + '. ' + (ev.t || '');
        out.unshift({ icon: k.icon, text: txt.trim(), history: ev.hist || d < 6 });
        if (ev.hist) G.State.log(ev.name + ' — ' + (ev.place || '') + ' (' + k.name + ')');
      } else if (!quiet && ev.hist && G.Journal) G.Journal.add(ev.name + ' — ' + (ev.place || '') + '에서 ' + k.name + U.jx(k.name, '이/가') + ' 일어났다는 소식이 들려온다.', 'C');   // 일지 (2026-10-23)
    } else if(ground(ev.kind)) {
      var l0=S().loc;ev.known=dist(l0.lon,l0.lat,ev.lon,ev.lat)<(cfg().news||15);
    }
    ev.out = out;
    return ev;
  };
  /** 재해가 덮친 도시: 시장 값이 뛰고, 들어가면 무너진 모습을 본다 */
  function cityHits(ev) {
    var T = st(), now = today(), cf = cfg(), cd = cf.cityDays || [60, 150];
    var kinds = [ev.kind]; T.act.forEach(function (e) { if (e.parent === ev.id) kinds.push(e.kind); });
    G.CITY_DATA.forEach(function (c) {
      if (!c || (R.cityExists && !R.cityExists(c))) return;
      var d = dist(c.lon, c.lat, ev.lon, ev.lat); if (d > ev.r) return;
      var kind = kinds.indexOf('tsunami') >= 0 && c.port && d <= ev.r * 1.1 ? 'tsunami' : ev.kind;
      if (kind === 'tsunami' && !c.port) kind = ev.kind === 'tsunami' ? null : ev.kind; if (!kind) return;
      var close = 1 - d / ev.r, until = now + Math.round(U.rf(cd[0], cd[1]) * (0.5 + ev.sev * 0.25));
      T.city[c.id] = { kind: kind, sev: Math.max(1, Math.round(ev.sev * (0.5 + close * 0.6))), name: ev.name, until: until, day: now, helped: false, seen: false };
      var m = R.market && R.market(c.id); if (m) { m.ev = MKT[kind]; m.evEnd = S().day + (until - now); }   // 시장 사건은 s.day로 센다
      ev.cityHit = true;
    });
  }
  /** 배가 상한다: 쓰나미가 덮친 항구에 있거나, 해안 가까이 떠 있거나, 탐험대가 배를 해안에 대 두었을 때 */
  function fleetHit(ev, out) {
    var s = S(), f = s.fleet, l = s.loc, cf = cfg();
    var hasWave = ev.kind === 'tsunami' || st().act.some(function (e) { return e.parent === ev.id && e.kind === 'tsunami'; });
    var wave = hasWave ? st().act.filter(function (e) { return (e.parent === ev.id || e.id === ev.id) && e.kind === 'tsunami'; })[0] : null;
    if (!wave || !f || !f.ships || !f.ships.length) return;
    var where = null, k = 0;
    if (l.mode === 'city') { var c = G.CITY_DATA[l.city]; if (c && c.port && dist(c.lon, c.lat, wave.lon, wave.lat) <= wave.r) { where = c.name + ' 항구'; k = 1; } }
    else if (l.mode === 'sea') { if (dist(l.lon, l.lat, wave.lon, wave.lat) <= wave.r && coastDist(l.lon, l.lat) < (cf.seaCoast || 0.6)) { where = '해안 가까운 바다'; k = 0.45; } }
    else if (l.mode === 'land' && l.base && l.base.type === 'ship') { if (dist(l.base.lon, l.base.lat, wave.lon, wave.lat) <= wave.r) { where = '탐험대가 배를 대 둔 해안'; k = 0.8; } }
    if (!where) return;
    var sd = cf.ship || [0.08, 0.3], navK = 1 - R.skill('nav') * 0.08, sunk = [];
    f.ships.forEach(function (sh) {
      sh.hp -= sh.maxHp * U.rf(sd[0], sd[1]) * wave.sev / 2 * k * navK;
      if (sh.hp <= 0) { if (G.Ships && G.Ships.unsinkable && G.Ships.unsinkable(sh)) sh.hp = 1; else sunk.push(sh); }
    });
    sunk.forEach(function (sh) { if (f.ships.length <= 1 || sh === f.ships[0]) { sh.hp = 1; return; } f.ships.splice(f.ships.indexOf(sh), 1); G.State.log(sh.name + '호가 해일에 부서져 가라앉았다.'); });
    var lost = l.mode === 'land' ? 0 : Math.round(f.crew * U.rf(0, 0.04) * wave.sev * k);
    f.crew = Math.max(1, f.crew - lost);
    if (G.Scenes.city && G.Scenes.city.B && G.Scenes.city.B.harbor && G.Scenes.city.B.harbor.trimCrew) G.Scenes.city.B.harbor.trimCrew();
    var txt = where + '에 해일이 들이쳤다! 배들이 크게 상했다.' + (sunk.length ? ' ' + sunk.map(function (x) { return x.name; }).join('·') + '호가 가라앉았다.' : '') + (lost ? ' 선원 ' + lost + '명이 휩쓸려 갔다.' : '');
    out.push({ icon: 'skull', text: txt });
    st().seaNote = { kind: 'tsunami', text: txt, day: today(), sev: wave.sev, lon: wave.lon, lat: wave.lat };
  }

  // ---------------------------------------------------------------- 하루
  function zonesAt(lon, lat) { return (G.HAZARD_ZONES || []).filter(function (z) { return dist(lon, lat, z.c[0], z.c[1]) <= z.c[2]; }); }
  D.zonesAt = zonesAt;
  function inSeason(z, kind, m) { return (kind !== 'flood' && kind !== 'landslide') || !z.months || z.months.indexOf(m) >= 0 || (kind === 'landslide' && U.chance(0.3)); }
  /** 땅 위의 한 점 (원 안에서) */
  function landPoint(z, tries) {
    for (var i = 0; i < (tries || 8); i++) {
      var a = U.rand() * 6.283, rr = Math.sqrt(U.rand()) * z.c[2], lon = z.c[0] + Math.cos(a) * rr, lat = z.c[1] + Math.sin(a) * rr;
      if (isLand(lon, lat)) return [lon, lat];
    }
    return null;
  }
  function sevRoll() { var r = U.rand(); return r < 0.62 ? 1 : r < 0.92 ? 2 : 3; }
  function randomOne(z, kind, at) {
    var p = at || landPoint(z); if (!p) return null;
    var sev = sevRoll(), tsu = false;
    if (kind === 'tsu') { kind = 'quake'; tsu = true; if (coastDist(p[0], p[1]) > 1.2) return null; sev = Math.max(2, sev); }
    var mt = G.Geo && G.Geo.terrain ? G.Geo.terrain(p[0], p[1]) : 'grass';
    if (kind === 'landslide' && mt !== 'mountain') return null;
    return D.start({ kind: kind, place: z.name, lon: p[0], lat: p[1], sev: sev, tsu: tsu, slide: kind === 'quake' && mt === 'mountain' && sev >= 2 });
  }
  D.daily = function () {
    var T = st(), s = S(); if (!T || !G.DISASTERS) return [];
    var cf = cfg(); if (cf.on === false) return [];
    var now = today(), out = [];
    T.act = T.act.filter(function (e) { delete e.out; return e.end >= now && (!e.field || now-e.start<=Math.ceil(e.field.life)); });
    Object.keys(T.city).forEach(function (id) { if (T.city[id].until < now) delete T.city[id]; });
    // 역사에 남은 재해
    var H = G.DISASTERS;
    if (T.hp < 0) { T.hp = 0; while (T.hp < H.length && dayOf(H[T.hp].y, H[T.hp].m, H[T.hp].d) < now) T.hp++; }   // 새 게임·옛 저장: 지난 일은 건너뛴다
    while (T.hp < H.length) {
      var h = H[T.hp], hd = dayOf(h.y, h.m, h.d);
      if (hd > now) break;
      T.hp++;
      if (now - hd > 3) continue;
      var ev = D.start({ id: h.id, kind: h.kind, name: h.name, place: h.place, lon: h.lon, lat: h.lat, sev: h.sev, r: h.r, days: h.days, hist: true, t: h.t, tsu: h.tsu, slide: h.slide });
      if (ev) out = out.concat(ev.out || []);
    }
    // 이름 없는 재해 (재해가 잦은 땅·화산)
    if (cf.random !== 0 && G.Geo && G.Geo.isLand) {
      var mult = cf.random == null ? 1 : cf.random, m = s.date.m;
      (G.HAZARD_ZONES || []).forEach(function (z) {
        ['quake', 'tsu', 'landslide'].forEach(function (kind) {
          var rate = z[kind]; if (!rate) return;
          if (!inSeason(z, kind, m)) return;
          var p = rate * mult / (kind === 'landslide' && z.months ? z.months.length * 30.4 : 365);
          if (U.chance(p)) { var e = randomOne(z, kind); if (e) out = out.concat(e.out || []); }
        });
      });
      (G.VOLCANOES || []).forEach(function (v) {
        if (U.chance((cf.volcanoRate || 0.012) * mult / 365)) { var e = D.start({ kind: 'volcano', name: v[0] + ' 분화', place: v[0], lon: v[1], lat: v[2], sev: sevRoll() }); if (e) out = out.concat(e.out || []); }
      });
      // 탐험대 둘레: 그 땅을 걷는 동안은 더 잦게 맞닥뜨린다
      if (s.loc.mode === 'land') {
        var l = s.loc, lk = cf.localK == null ? 4 : cf.localK, terr = G.Geo.terrain(l.lon, l.lat);
        zonesAt(l.lon, l.lat).forEach(function (z) {
          ['quake', 'landslide'].forEach(function (kind) {
            var rate = z[kind]; if (!rate || !inSeason(z, kind, m)) return;
            if (kind === 'landslide' && terr !== 'mountain') return;
            if (U.chance(rate * lk * mult / 365)) {
              var a = U.rand() * 6.283, rr = U.rf(0.05, 0.4), p = [l.lon + Math.cos(a) * rr, l.lat + Math.sin(a) * rr];
              if (!isLand(p[0], p[1])) p = [l.lon, l.lat];
              var e = randomOne(z, kind, p); if (e) out = out.concat(e.out || []);
            }
          });
        });
        if(G.GroundDisaster)G.GroundDisaster.spawnLand(T,l,mult);
        // 화산 곁을 지나면: 땅이 울리고, 드물게 터진다
        (G.VOLCANOES || []).forEach(function (v) {
          var dv = dist(l.lon, l.lat, v[1], v[2]); if (dv > 1.2) return;
          if (!T.rumble || T.rumble[v[0]] !== s.date.y) { T.rumble = T.rumble || {}; T.rumble[v[0]] = s.date.y; out.push({ icon: 'skull', text: v[0] + ' 가까이에 왔다. 땅이 웅웅 울리고, 산꼭대기에서 흰 김이 오른다.' }); }
          if (U.chance((cf.volcanoNear || 0.5) * mult / 365)) { var e = D.start({ kind: 'volcano', name: v[0] + ' 분화', place: v[0], lon: v[1], lat: v[2], sev: sevRoll() }); if (e) out = out.concat(e.out || []); }
        });
      }
    }
    return out;
  };

  // ---------------------------------------------------------------- 어디에 무엇이
  /** 이 점을 덮고 있는 재해들 (가까운 순) */
  D.at = function (lon, lat) {
    var T = st(); if (!T) return [];
    return T.act.filter(function (e) { return dist(lon, lat, e.lon, e.lat) <= e.r; })
      .sort(function (a, b) { return dist(lon, lat, a.lon, a.lat) / a.r - dist(lon, lat, b.lon, b.lat) / b.r; });
  };
  /** 탐험대 걸음: 재해 한가운데일수록 느리다 (1 = 보통) */
  D.slow = function (lon, lat) {
    var v = 1;
    D.at(lon, lat).forEach(function (e) { if (!e.wind&&!ground(e.kind)) { var k = K(e.kind), c = 1 - dist(lon, lat, e.lon, e.lat) / e.r; v = Math.min(v, 1 - (1 - k.slow) * Math.min(1, 0.4 + c)); } });
    return v;
  };
  D.active = function () { var T = st(); return T ? T.act.slice() : []; };

  // ---------------------------------------------------------------- 항해·탐험 중 움직이는 바람 재해
  function windAt(e, days) {
    var w = e.wind, turn = w.curve * days / 2, h = w.heading + turn;
    var distance = w.speed * days * (turn ? Math.sin(turn) / turn : 1);
    return [G.Geo.wrapLon(e.lon + Math.cos(h) * distance), U.clamp(e.lat + Math.sin(h) * distance, -86, 86)];
  }
  function threatens(e, mode) { return e.wind && (mode === 'land' || e.kind === 'hurricane'); }
  function localWind(l) {
    var T = st(), rules = cfg().moving, closest = null, margin = Infinity;
    if (!T || !rules || cfg().on === false) return null;
    for (var i = 0; i < T.act.length; i++) {
      var e = T.act[i]; if (!threatens(e, l.mode)) continue;
      var gap = dist(l.lon, l.lat, e.lon, e.lat) - e.r;
      if (gap <= rules[e.kind].warn && gap < margin) { closest = e; margin = gap; }
    }
    return closest ? { event: closest, margin: margin } : null;
  }
  D.travelTag = function (l) {
    if(cfg().on===false)return '';
    var field=G.GroundDisaster?G.GroundDisaster.tag(st(),l):'';
    var near = localWind(l); if (!near) return field;
    var e = near.event, direction = U.dirName(Math.atan2(e.lat - l.lat, G.Geo.wrapLon(e.lon - l.lon)));
    var txt = near.margin <= 0 ? e.name + ' 위험 구역 · 범위 밖으로' : direction + '쪽 ' + e.name + ' · 경계까지 ' + (near.margin < .1 ? '0.1° 미만' : near.margin.toFixed(1) + '°');
    return field+(field?' · ':'')+'<span style="color:#ffc28f" title="지도에 표시된 진행 방향을 보고 옆으로 우회하십시오.">' + U.esc(txt) + '</span>';
  };
  D.travelSlow = function (l) {
    if(cfg().on===false)return 1;
    var field=G.GroundDisaster?G.GroundDisaster.slow(st(),l):1;
    var near = localWind(l);
    if (!near || near.margin >= 0) return field;
    return Math.min(field,U.lerp(1, K(near.event.kind).slow, U.clamp(.22 - near.margin / near.event.r, 0, 1)));
  };
  function spawnWind(T, s, days, rules) {
    var l = s.loc, kind = l.mode === 'sea' ? 'hurricane' : 'tornado', c = rules[kind];
    var lat = Math.abs(l.lat), month = l.lat < 0 ? (s.date.m + 5) % 12 + 1 : s.date.m;
    if (T.windRest > 0 || T.act.some(function (e) { return e.kind === kind; }) ||
        lat < c.lat[0] || lat > c.lat[1] || month < c.months[0] || month > c.months[1] ||
        c.grounds.indexOf(G.Geo.terrain(l.lon, l.lat)) < 0 || !U.chance(1 - Math.exp(-c.rate * days * (cfg().random == null ? 1 : cfg().random)))) return;
    var severity = sevRoll(), radius = K(kind).r[severity - 1];
    for (var i = 0; i < 8; i++) {
      var bearing = (l.heading || 0) + U.rf(-.83, .83), lead = radius + U.rf(c.lead[0], c.lead[1]);
      var x = G.Geo.wrapLon(l.lon + Math.cos(bearing) * lead), y = l.lat + Math.sin(bearing) * lead;
      if (c.grounds.indexOf(G.Geo.terrain(x, y)) < 0 || isLand(x, y) !== (kind === 'tornado')) continue;
      var moving = bearing + (U.chance(.5) ? 1 : -1) * U.rf(1.35, 2.28);
      D.start({ kind: kind, sev: severity, lon: x, lat: y, heading: moving }, true);
      T.windRest = rules.cooldown;
      break;
    }
  }
  function approachDistance(l, lon0, lat0, e, ex, ey) {
    // 상대 이동을 선분으로 검사해 빠른 배속에도 회오리와 탐험대가 서로 통과하지 않게 한다.
    var x = G.Geo.wrapLon(lon0 - ex), y = lat0 - ey;
    var dx = G.Geo.wrapLon(l.lon - lon0) - G.Geo.wrapLon(e.lon - ex), dy = l.lat - lat0 - (e.lat - ey);
    var n = dx * dx + dy * dy, at = n ? U.clamp(-(x * dx + y * dy) / n, 0, 1) : 0;
    return Math.hypot(x + at * dx, y + at * dy);
  }
  function hitWind(s, e, rule, distance) {
    var f = s.fleet, k = (.67 + .19 * e.sev) * (1 - .55 * distance / e.r);
    f.fatigue = U.clamp(f.fatigue + rule.fatigue * k, 0, 100);
    f.discipline = U.clamp(f.discipline - rule.discipline * k, 0, 100);
    var sailing = s.loc.mode === 'sea';
    if (sailing) f.ships.forEach(function (ship) { if (ship.hp > 0) ship.hp = Math.max(1, ship.hp - ship.maxHp * rule.hull * k); });
    var txt = e.name + '에 휘말렸다. ' + (sailing ? '선체 손상 · ' : '') + '피로 증가 · 규율 저하. 위험 범위 밖으로 벗어나십시오.';
    UI.toast(txt, 'wind', 4200);G.State.log(txt);
  }
  /** 키·마우스 조작을 계속 받으며, 현재 걸음과 재해의 움직임을 같은 시간 구간에서 검사한다. */
  D.travelStep = function (days, lon0, lat0, moving) {
    var T = st(), s = S(), rules = cfg().moving;
    if (!T || !rules || cfg().on === false || !(days > 0)) return false;
    var l = s.loc, hit = G.GroundDisaster ? G.GroundDisaster.step(T,s,days,lon0,lat0,moving) : false;
    T.windRest = Math.max(0, (T.windRest || 0) - days);
    if (moving && cfg().random !== 0) spawnWind(T, s, days, rules);
    for (var i = T.act.length - 1; i >= 0; i--) {
      var e = T.act[i], w = e.wind; if (!w) continue;
      var rule = rules[e.kind], ex = e.lon, ey = e.lat, next = windAt(e, days);
      e.lon = next[0]; e.lat = next[1];
      w.heading += w.curve * days;w.age += days;w.hitWait -= days;
      if (isLand(e.lon, e.lat) !== (e.kind === 'tornado')) w.offSurface += days;
      else w.offSurface = Math.max(0, w.offSurface - days * .58);
      if (w.age >= w.life || w.offSurface >= rule.wrongSurface) { T.act.splice(i, 1); continue; }
      e.r = w.originalR * (1 - .53 * Math.max(w.offSurface / rule.wrongSurface, U.clamp((w.age / w.life - .75) * 4, 0, 1)));
      if (!threatens(e, l.mode)) continue;
      if (!w.warned && dist(l.lon, l.lat, e.lon, e.lat) - e.r <= rule.warn) {
        w.warned = true;
        var direction = U.dirName(Math.atan2(e.lat - l.lat, G.Geo.wrapLon(e.lon - l.lon)));
        UI.toast(direction + '쪽에 ' + e.name + '. 지도에 표시된 범위와 이동 방향을 보고 우회하십시오.', 'wind', 4400);
      }
      var distance = approachDistance(l, lon0, lat0, e, ex, ey);
      if (distance <= e.r && w.hitWait <= 0) {
        w.hitWait = rules.contact;
        hitWind(s, e, rule, distance);hit = true;
      }
    }
    return hit;
  };

  // ---------------------------------------------------------------- 탐험대
  var LINES = {
    quake: { sudden: '땅이 밑에서부터 울부짖듯 흔들린다! 서 있을 수가 없다 — 모두 엎드려라!', warn: '', after: '흔들림이 멎었다. 땅이 갈라지고 돌무더기가 길을 덮었다.' },
    volcano: { sudden: '산이 터졌다! 하늘이 시커멓게 덮이고 불덩이가 쏟아진다!', warn: '산꼭대기에서 검은 연기가 솟고, 땅이 쉬지 않고 떤다. 우물물이 뜨겁다... 산이 곧 터질 조짐입니다.', after: '재가 무릎까지 쌓였다. 짐승들이 숨을 헐떡인다.' },
    landslide: { sudden: '머리 위에서 우르릉 소리가 난다 — 산비탈이 통째로 무너져 내린다!', warn: '비탈에서 작은 돌이 자꾸 굴러떨어지고 나무들이 기울었습니다. 이 골짜기는 곧 무너질 것 같습니다.', after: '흙더미가 골짜기를 메웠다. 길이 끊겼다.' },
    tsunami: { sudden: '바다 쪽에서 하얀 벽이 밀려온다 — 해일이다! 높은 데로 뛰어라!', warn: '바닷물이 갑자기 먼바다로 쭉 빠져나갔습니다! 물고기가 갯벌에서 펄떡입니다... 옛사람들이 말하던 큰 파도의 조짐입니다!', after: '물이 빠지고 나니 해변에는 부서진 배와 나무들만 남았다.' },
    flood: { sudden: '한밤중에 강물이 둑을 넘었다! 야영지가 순식간에 물에 잠긴다!', warn: '며칠째 비가 그치지 않고 강물이 누렇게 불어나 소용돌이칩니다. 낮은 땅에서 잤다가는 쓸려 갑니다.', after: '흙탕물이 들판을 덮었다. 걸음이 더뎌질 것이다.' }
  };
  var FLEE = { volcano: '산에서 멀리 피한다', landslide: '골짜기를 벗어나 돌아간다', tsunami: '높은 언덕으로 달린다', flood: '높은 곳으로 올라가 야영한다' };
  /** 조짐을 알아챌 확률 */
  function detect(ev) {
    var c = cfg().detect || {}, p = c[ev.kind] == null ? 0.3 : c[ev.kind];
    if (ev.kind === 'quake') return p;
    p += R.skill('sci') * (c.sci || 0.12) + R.skill('survey') * (c.survey || 0.1) + R.skill('hist') * (c.hist || 0.1);
    if (ev.kind === 'tsunami') p += R.skill('nav') * (c.nav || 0.05);
    if (ev.hist && R.skill('hist') >= 2) p += c.histBonus || 0.2;      // 옛 기록에서 이 땅의 재해를 읽었다
    return U.clamp(p, 0, 0.9);
  }
  function who() { return G.Scenes.mateSpeaker(R.skill('sci') >= R.skill('survey') ? 'first' : 'surveyor'); }
  /** 하루 처리에서 부른다. ctx: {spend(n) 날 보내기, dailyCost() 하루 경비, mount() 탈것, refresh()} */
  D.land = async function (ctx) {
    var T = st(), s = S(), l = s.loc; if (!T || !l || l.mode !== 'land') return;
    var now = today();
    for (var i = 0; i < T.act.length; i++) {
      var ev = T.act[i];
      if (ev.wind || ground(ev.kind) || ev.metLand || now - ev.start > 2) continue;
      var d = dist(l.lon, l.lat, ev.lon, ev.lat); if (d > ev.r) continue;
      ev.metLand = 1;
      if (ev.parent && ev.kind!=='tsunami') continue;
      await onset(ev, d, ctx);
      if (l.party <= 0) return;
    }
    // 이어지는 재해 안을 걷는다: 재·흙탕물에 지친다 (재해마다 한 번 알린다)
    D.at(l.lon, l.lat).forEach(function (ev) {
      if (ev.wind || ground(ev.kind)) return;
      var f = s.fleet, kk = ev.kind;
      if (kk === 'volcano' || kk === 'flood' || kk === 'landslide') f.fatigue = Math.min(100, f.fatigue + (cfg().stayFatigue || 1.2) * ev.sev);
      if (!ev.toldLand) { ev.toldLand = 1; UI.toast((ev.name || K(kk).name) + '의 자취 안이다 — ' + { quake: '무너진 길을 돌아가느라 걸음이 더디다.', volcano: '재가 내려 숨쉬기 힘들고 걸음이 무겁다.', landslide: '흙더미가 길을 막아 돌아가야 한다.', tsunami: '해안이 온통 부서진 것들로 덮였다.', flood: '물이 빠지지 않은 들판이라 걸음이 무척 더디다.' }[kk], 'skull', 4600); }
    });
  };
  async function onset(ev, d, ctx) {
    var s = S(), l = s.loc, f = s.fleet, cf = cfg(), k = K(ev.kind), kids = st().act.filter(function (e) { return e.parent === ev.id; });
    var close = U.clamp(1 - d / ev.r, 0, 1), terr = G.Geo.terrain(l.lon, l.lat);
    var kind = ev.kind;
    // 해일은 바닷가에서만, 산사태는 산·숲에서만 크게 다친다
    var wave = kind === 'tsunami' || kids.some(function (e) { return e.kind === 'tsunami'; });
    var slide = kind === 'landslide' || (kids.some(function (e) { return e.kind === 'landslide'; }) && (terr === 'mountain' || terr === 'forest'));
    var coast = coastDist(l.lon, l.lat), atCoast = coast < (cf.tsuInland || 0.3);
    if (kind === 'tsunami' && !atCoast) { UI.toast('먼 바다 쪽에서 천둥 같은 굉음이 들렸다. 해안은 해일에 휩쓸렸을 것이다 — 우리는 뭍 깊숙이 있어 무사했다.', 'drop', 5200); return; }
    var mainKind = kind === 'quake' && wave && atCoast ? 'tsunami' : kind === 'quake' && slide ? 'landslide' : kind;
    // 지진: 탐험 화면의 땅이 흔들린다 (전조 → 본진 → 잦아듦, js/art/quakefx.js). 탐험대의 실제 자리는 그대로
    if (kind === 'quake' && G.Quake) G.Quake.start('quake', { sev: ev.sev, close: close });
    var fx = G.DisasterFx ? G.DisasterFx.show(kind === 'quake' ? 'quake' : mainKind, { title: ev.name }) : null;
    var lines = LINES[mainKind] || LINES.quake, prepared = false;
    try {
      if (ev.hist && ev.t) await UI.say('【' + ev.name + '】 ' + ev.t, {});
      if (kind === 'quake') {
        await UI.say(LINES.quake.sudden, who());
        if (mainKind !== 'quake') { if (fx) fx.stop(); fx = G.DisasterFx ? G.DisasterFx.show(mainKind, { title: ev.name }) : null; }
      }
      var canWarn = mainKind !== 'quake' && U.chance(detect(ev));
      if (canWarn) {
        var v = await UI.ask(lines.warn, [{ label: FLEE[mainKind] + ' (' + (mainKind === 'tsunami' ? '짐을 버리고' : '하루 이틀 늦어진다') + ')', value: 'flee' }, { label: '그대로 버틴다', value: 'stay' }], who());
        if (v === 'flee') {
          prepared = true;
          if (mainKind === 'tsunami') { var gl = Math.min(s.player.gold, Math.round(ctx.dailyCost() * U.rf(1, 2.5))); s.player.gold -= gl; if (gl) UI.toast('달아나느라 버린 짐 — 금화 ' + U.num(gl) + '닢어치', 'coin', 3600); }
          else ctx.spend(mainKind === 'volcano' ? 2 : 1);
        }
      } else if (kind !== 'quake') await UI.say(lines.sudden, who());
      if (mainKind !== kind && kind !== 'quake') await UI.say(lines.sudden, who());
      if (mainKind === 'tsunami' && kind === 'quake') await UI.say(LINES.tsunami.sudden, who());
      // 피해
      var res = damage(mainKind, ev, close, prepared, terr, ctx);
      await UI.say(lines.after, {});
      if (fx) { fx.stop(); fx = null; }
      await report(ev, mainKind, res, prepared);
      // 무너진 마을이 가까우면 도울 수 있다
      var vil = nearHitCity(l.lon, l.lat);
      if (vil && (mainKind === 'quake' || mainKind === 'flood' || mainKind === 'tsunami' || mainKind === 'landslide') && l.party > 2) {
        var h = await UI.ask(vil.name + '도 무너졌다. 사람들이 맨손으로 잔해를 헤집고 있다... 손을 보탤까?', [{ label: '이틀 머물며 돕는다', value: 1 }, { label: '갈 길을 간다', value: 0 }], G.Scenes.mateSpeaker('first'));
        if (h) { ctx.spend(2); f.fatigue = Math.min(100, f.fatigue + 6); var helpFm = G.Fame.add('so', 6 * ev.sev); var cc = st().city[vil.id]; if (cc) cc.helped = true; UI.toast(vil.name + ' 사람들이 고마워한다. (사교 명성 +' + helpFm + ')', 'people', 4200); G.State.log(ev.name + ' 때 ' + vil.name + ' 사람들을 도왔다.'); }
      }
    } catch (e) { console.error(e); }
    if (fx) fx.stop();
    if (ctx.refresh) ctx.refresh();
  }
  function nearHitCity(lon, lat) {
    var T = st(), best = null, bd = 1.2;
    Object.keys(T.city).forEach(function (id) { var c = G.CITY_DATA[id]; if (!c) return; var d = dist(lon, lat, c.lon, c.lat); if (d < bd) { bd = d; best = c; } });
    return best;
  }
  /** 피해 셈 — 대원·짐승·부하·물자·피로·날 */
  function damage(kind, ev, close, prepared, terr, ctx) {
    var s = S(), l = s.loc, f = s.fleet, cf = cfg(), LS = (cf.loss || {})[kind] || [0.03, 0.1];
    var mit = Math.max(0.25, 1 - R.skill('ops') * ((cf.mitig || {}).ops || 0.08) - R.skill('med') * ((cf.mitig || {}).med || 0.06));
    var tk = 1;
    if (kind === 'flood' && (terr === 'mountain' || terr === 'desert')) tk = 0.4;
    if (kind === 'landslide' && terr !== 'mountain' && terr !== 'forest' && terr !== 'jungle') tk = 0.5;
    var kk = ev.sev * (0.35 + 0.65 * close) * tk * mit * (prepared ? (cf.flee || 0.3) : 1);
    var res = { dead: 0, mounts: 0, hurt: [], gold: 0, days: 0, fat: 0 };
    // 대원
    var dead = Math.round(l.party * U.rf(LS[0], LS[1]) * kk);
    if (!dead && kk > 0.5 && l.party > 3 && U.chance(0.5)) dead = 1;
    dead = Math.min(dead, Math.ceil(l.party * (cf.maxLoss || 0.35)), Math.max(0, l.party - 1));   // 한 번에 잃는 대원은 많아야 maxLoss
    l.party -= dead; f.crew = Math.max(0, f.crew - dead); res.dead = dead;
    // 짐승 (물·재·흙에 약하다)
    var mt = ctx.mount ? ctx.mount() : null;
    if (mt && mt.id !== 'walk' && mt.n > 0) {
      var mk = { quake: 0.5, volcano: 1.3, landslide: 1.2, tsunami: 1.5, flood: 1.4 }[kind] || 1;
      var ml = Math.min(mt.n, Math.round(mt.n * U.rf(LS[0], LS[1]) * kk * mk * 1.6));
      if (ml) { mt.n -= ml; res.mounts = ml; res.mountName = G.Mounts.get(mt.id).name; if (mt.n <= 0) { l.mount = { id: 'walk', n: 0 }; res.walk = true; } }
    }
    // 부하가 다친다
    var hp = (cf.hurt || 0.35) * kk;
    U.shuffle(s.mates.slice()).slice(0, 2).forEach(function (m) {
      if (!U.chance(hp)) return;
      var dd = U.ri(15, 40); m.hurt = Math.max(m.hurt || 0, s.day + dd);
      var md = G.MATE[m.id]; if (md) res.hurt.push(md.name + ' (' + dd + '일)');
    });
    // 물자 (떠내려가고 묻혔다 — 다시 사야 한다)
    if (kind !== 'quake' || U.chance(0.4)) {
      var g = Math.min(s.player.gold, Math.round(ctx.dailyCost() * U.rf(1, 3) * ev.sev * (prepared ? 0.4 : 1)));
      s.player.gold -= g; res.gold = g;
    }
    // 피로·날
    res.fat = Math.round((4 + 5 * ev.sev) * (0.5 + close) * (prepared ? 0.6 : 1));
    f.fatigue = Math.min(100, f.fatigue + res.fat);
    if (kind === 'landslide' || kind === 'flood') { res.days = prepared ? 0 : U.ri(1, ev.sev + 1); if (res.days) ctx.spend(res.days); }
    else if (kind === 'quake' && ev.sev >= 2) { res.days = 1; ctx.spend(1); }
    return res;
  }
  async function report(ev, kind, r, prepared) {
    var k = K(kind), parts = [];
    if (r.dead) parts.push('대원 ' + r.dead + '명을 잃었다');
    if (r.mounts) parts.push(r.mountName + ' ' + r.mounts + (r.walk ? ' — 이제 걸어서 간다' : '') + '을(를) 잃었다');
    if (r.hurt.length) parts.push('다친 부하: ' + r.hurt.join(', ') + ' — 능력이 절반');
    if (r.gold) parts.push('물자를 잃어 금화 ' + U.num(r.gold) + '닢어치를 다시 마련했다');
    if (r.days) parts.push('길이 막혀 ' + r.days + '일을 허비했다');
    parts.push('피로 +' + r.fat);
    var head = (prepared ? '조짐을 알아채고 피한 덕에 피해가 적었다. ' : '') + (ev.name || k.name) + U.jx(ev.name || k.name, '이/가') + ' 지나갔다.';
    await UI.window({ title: k.name + ' 피해', icon: 'skull', width: 640, clickAny: true,
      html: '<div style="font-size:18px;line-height:1.7"><p>' + U.esc(head) + '</p><ul style="margin:6px 0 0 18px">' + parts.map(function (p) { return '<li>' + U.esc(p) + '</li>'; }).join('') + '</ul></div>',
      buttons: [{ label: '확인', value: 1, cls: 'navy' }] }).result;
    G.State.log(ev.name + U.jx(ev.name, '을/를') + ' 겪었다 — ' + parts.slice(0, 3).join(', ') + '.');
    var T = st(); T.met = (T.met || 0) + 1;
  }

  // ---------------------------------------------------------------- 바다·도시
  /** 바다의 하루 처리에서: 해일이 함대를 덮쳤으면 그림과 함께 알린다 */
  D.sea = async function () {
    var T = st(); if (!T || !T.seaNote) return;
    var n = T.seaNote; T.seaNote = null;
    if (today() - n.day > 1) return;
    // 해일이 바다의 함대를 덮쳤다: 항해 화면에서 큰 물결이 배를 들어 올렸다 내리고 민다 (그림만 — 피해는 위 fleetHit에서 이미 셈했다)
    if (n.kind === 'tsunami' && G.Quake && S().loc.mode === 'sea') {
      var l0 = S().loc, dir = n.lon != null ? Math.atan2(-(l0.lat - n.lat), G.Geo && G.Geo.wrapLon ? G.Geo.wrapLon(l0.lon - n.lon) : l0.lon - n.lon) : undefined;
      G.Quake.start('tsunami', { sev: n.sev || 2, close: 0.9, dir: dir });
    }
    var fx = G.DisasterFx ? G.DisasterFx.show(n.kind) : null;
    await UI.say(n.text, G.Scenes.mateSpeaker('nav'));
    if (fx) fx.stop();
  };
  /** 입항: 재해가 덮친 도시의 모습 · 구호금 */
  D.arrival = async function (c) {
    var T = st(); if (!T || !c) return;
    var h = T.city[c.id]; if (!h || h.until < today()) return;
    var s = S(), k = K(h.kind);
    if (T.seaNote && today() - T.seaNote.day <= 1) { var n = T.seaNote; T.seaNote = null; var fx0 = G.DisasterFx ? G.DisasterFx.show(n.kind) : null; await UI.say(n.text, G.Scenes.mateSpeaker('nav')); if (fx0) fx0.stop(); }
    if (h.seen) return;
    h.seen = true;
    var look = { quake: '무너진 집과 갈라진 길이 그대로다. 교회 종탑이 기울었다.', volcano: '지붕마다 잿빛 재가 두껍게 쌓였다. 사람들이 천으로 입을 가리고 다닌다.', landslide: '도시 한쪽이 흙더미에 묻혔다. 사람들이 삽으로 길을 내고 있다.', tsunami: '부두가 부서지고, 배들이 거리 한복판까지 밀려 올라와 있다.', flood: '거리에 흙탕물 자국이 어깨 높이까지 남았다. 곳간의 곡식이 다 젖었다.', fire: '마을 밖 그을린 숲에서 연기가 오른다.' }[h.kind];
    var fx = G.DisasterFx ? G.DisasterFx.show(h.kind, { title: h.name }) : null;
    await UI.say(c.name + U.jx(c.name, '은/는') + ' 얼마 전 ' + h.name + U.jx(h.name, '을/를') + ' 겪었다. ' + look + ' ' + (h.kind === 'volcano' || h.kind === 'flood' ? '먹을 것 값이 크게 뛰었다.' : '먹을 것과 목재 값이 크게 뛰었다.'), {});
    if (fx) fx.stop();
    if (h.helped) return;
    var cost = Math.round((cfg().relief || 120) * h.sev * (1 + (c.size || 1) * 0.5));
    var v = await UI.ask('구호금을 내어 도울까? (금화 ' + U.num(cost) + '닢)', [{ label: '구호금을 낸다', value: 1, dis: s.player.gold < cost }, { label: '그만둔다', value: 0 }], {});
    if (v && s.player.gold >= cost) {
      s.player.gold -= cost; h.helped = true;
      var fm = Math.round(4 + h.sev * 6 + (c.size || 1) * 2); fm = G.Fame.add('so', fm);
      UI.toast(c.name + ' 사람들이 이름을 기억할 것이다. (사교 명성 +' + fm + ')', 'people', 4200);
      G.State.log(h.name + ' 뒤 ' + c.name + '에 구호금 금화 ' + U.num(cost) + '닢을 냈다.');
      G.Game.refreshHud();
    }
  };
  /** 이 도시가 지금 재해를 입었나 */
  D.cityHit = function (cid) { var T = st(), h = T && T.city[cid]; return h && h.until >= today() ? h : null; };

  // ---------------------------------------------------------------- 지도 위 표시 (육상 탐험)
  /** 이름표 자리: 이미 그린 이름표와 겹치면 위로 비켜 올린다 */
  function labelY(used, x, y, w) {
    for (var n = 0; n < 6; n++) { var hit = used.some(function (b) { return Math.abs(b[0] - x) < (b[2] + w) / 2 + 6 && Math.abs(b[1] - y) < 26; }); if (!hit) break; y -= 28; }
    used.push([x, y, w]); return y;
  }
  var windTextures = null;
  function windNoise(grid, w, h, u, v) {
    var x = u * (w - 1), y = v * (h - 1), ix = Math.min(w - 2, Math.floor(x)), iy = Math.min(h - 2, Math.floor(y));
    var fx = x - ix, fy = y - iy, i = iy * w + ix;
    fx *= fx * (3 - 2 * fx);fy *= fy * (3 - 2 * fy);
    return U.lerp(U.lerp(grid[i], grid[i+1], fx), U.lerp(grid[i+w], grid[i+w+1], fx), fy);
  }
  function buildWindTextures() {
    var palettes = [
      [[45,66,83],[121,153,174]], [[100,131,155],[222,237,242]],
      [[43,42,41],[110,104,90]], [[87,62,42],[189,153,111]], [[115,135,148],[229,231,223]]
    ];
    var rng = U.makeRng(7351);
    return palettes.map(function (pair, variant) {
      var canvas = document.createElement('canvas');canvas.width = 160;canvas.height = 44;
      var ctx = canvas.getContext('2d'), tex = ctx.createImageData(canvas.width, canvas.height), data = tex.data;
      var broad = Float32Array.from({length: 7*5}, rng), fine = Float32Array.from({length: 21*9}, rng), specks = Float32Array.from({length: 55*17}, rng);
      // 길게 찢어진 바람 결을 한 번 만들어 두고, 매 장면에 나선의 접선 방향으로 돌려 그린다.
      for (var x = 0; x < tex.width; x++) {
        var u = x / (tex.width - 1), ends = Math.sin(Math.PI * u), width = .19 + .26 * Math.pow(ends, .87);
        var center = .18 * Math.sin(u * 5.7 + variant) + .33 * (windNoise(broad, 7, 5, u, .38) - .5);
        for (var y = 0; y < tex.height; y++) {
          var vv = y / (tex.height - 1), v = vv * 2 - 1;
          var cross = (v - center) / width;
          var grain = .54 * windNoise(broad, 7, 5, u, vv) + .32 * windNoise(fine, 21, 9, u, vv) + .14 * windNoise(specks, 55, 17, u, vv);
          var side = Math.exp(-cross * cross * 1.2), split = Math.exp(-Math.pow((v - center - .29) / .15, 2));
          var taper = Math.pow(ends, .82) * (1 - Math.pow(Math.abs(v), 4));
          var tone = U.clamp(grain + side * .30, 0, 1), i = (y * tex.width + x) * 4;
          data[i] = U.lerp(pair[0][0], pair[1][0], tone);data[i+1] = U.lerp(pair[0][1], pair[1][1], tone);data[i+2] = U.lerp(pair[0][2], pair[1][2], tone);
          data[i+3] = 255 * taper * (side * (.31 + .74 * grain) + split * .16);
        }
      }
      ctx.putImageData(tex, 0, 0);return canvas;
    });
  }
  function windFiber(ctx, tile, x, y, length, width, angle, alpha) {
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha *= alpha;
    ctx.drawImage(windTextures[tile], -length / 2, -width / 2, length, width);
    ctx.restore();
  }
  function cyclonePoint(x, y, radius, angle) {
    return [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius * .84];
  }
  function drawCyclone(ctx, x, y, r, t, e) {
    var fx = G.FX.movingDisaster, eye = r * fx.eye;
    var rotation = e.lat >= 0 ? -1 : 1, spin = t * fx.spin.hurricane * rotation;
    for (var arm = 0; arm < 3; arm++) {
      var tilt = spin + [0,2.36,4.32][arm], turn = rotation * [4.65,4.1,4.38][arm];
      for (var i = 0; i < 33; i++) {
        var v = (i + (t * .78 + arm * .28) % 1) / 33;
        var noise = Math.sin(i * 2.31 + arm * 6.6), ripple = Math.cos(i * 1.17 + arm * 3.1);
        var a = tilt + turn * v + .18 * ripple * v, d = eye + r * (.79 + arm * .038) * Math.pow(v, 1.17);
        var center = cyclonePoint(x, y, d, a), next = cyclonePoint(x, y, d + r * .029, a + turn * .034);
        var angle = Math.atan2(next[1] - center[1], next[0] - center[0]);
        var length = r * (.105 + .17 * v + .029 * noise), width = r * (.075 + .049 * v + .027 * ripple);
        var alpha = (.74 + noise * .16) * (1 - v * .60);
        windFiber(ctx, 0, center[0], center[1], length * 1.52, width * 1.60, angle, alpha);
        windFiber(ctx, 1, center[0] + Math.sin(a) * width * .22, center[1] - width * .20, length, width, angle, alpha);
      }
    }
    // 폭풍의 눈 주위는 짧게 꺾이는 결만 남기고, 그 바깥으로 빗바람이 더 멀리 뻗는다.
    for (var j = 0; j < 12; j++) {
      var a0 = spin * 1.23 + j * .524, d0 = eye * (1.08 + .14 * Math.sin(j * 2.3));
      var q = cyclonePoint(x,y,d0,a0), q1 = cyclonePoint(x,y,d0,a0 + .22 * rotation);
      windFiber(ctx, 1, q[0], q[1], eye * .92, eye * .53, Math.atan2(q1[1]-q[1],q1[0]-q[0]), .65);
    }
    ctx.lineCap = 'butt';ctx.beginPath();
    for (var n = 0; n < 70; n++) {
      var f = (n * .618034 + t * (.56 + n % 7 * .037)) % 1;
      var a1 = n * 2.39996 + spin * (1.58 - f * .77) + rotation * f * 1.8;
      var d1 = r * (.23 + 1.03 * f), tail = (.048 + (n % 6) * .021) * (.41 + f * .7);
      var p = cyclonePoint(x,y,d1,a1), a2 = a1 - rotation * tail;
      var back = cyclonePoint(x,y,d1 - r * tail * .48,a2);
      var bend = cyclonePoint(x,y,d1 - r * tail * .16,a1 - rotation * tail * .43);
      ctx.moveTo(back[0],back[1]);ctx.quadraticCurveTo(bend[0],bend[1],p[0],p[1]);
    }
    ctx.lineWidth = Math.max(.9, r * .005);ctx.strokeStyle='rgba(198,225,233,.58)';ctx.stroke();
  }
  function funnelPoint(x, y, h, lean, z, angle, time) {
    var width = h * (.035 + .238 * Math.pow(z, 1.68));
    var bend = lean * z * z + Math.sin(z * 5 - time * 3) * h * z * .058;
    return [x + bend + Math.cos(angle) * width, y - h * z + Math.sin(angle) * width * .28];
  }
  function drawFunnel(ctx, x, y, r, t, e) {
    var fx = G.FX.movingDisaster, h = U.clamp(r * 1.48, fx.funnel[0], fx.funnel[1]);
    var lean = Math.cos(e.wind.heading) * h * .24, spin = t * fx.spin.tornado * (e.lat >= 0 ? -1 : 1);
    // 부드러운 회오리 기둥 뒤로 지형이 비치고, 가장 밝은 먼지 띠는 앞면을 감으며 올라간다.
    for (var layer = 0; layer < 18; layer++) {
      var height = (layer + .25 + .5 * Math.sin(t * 8 + layer * .77)) / 18;
      height = U.clamp(height, 0, 1);
      var center = funnelPoint(x,y,h,lean,height,Math.PI*.5,t), top = funnelPoint(x,y,h,lean,height+.035,Math.PI*.5,t);
      var width0 = h * (.107 + .57 * Math.pow(height, 1.6));
      var axis = Math.atan2(top[1]-center[1],top[0]-center[0]);
      var flutter = Math.sin(spin * .65 + layer * .91);
      windFiber(ctx, height < .36 ? 3 : 2, center[0] + width0 * flutter * .09, center[1], h * .31, width0, axis, .64 + .16 * flutter);
    }
    // 어두운 뒷면 위를 더 밝은 앞면이 가로지르게 그려 깔때기의 회전과 깊이를 보여 준다.
    for (var side = 0; side < 2; side++) for (var arm = 0; arm < 4; arm++) {
      for (var i = 0; i < 21; i++) {
        var z = (i + (t * 1.95 + arm * .27) % 1) / 21;
        var twist = 12.4 + arm * .44, angle = spin + arm * 1.59 + z * twist;
        if ((Math.sin(angle) > 0 ? 1 : 0) !== side) continue;
        var p = funnelPoint(x,y,h,lean,z,angle,t), ahead = funnelPoint(x,y,h,lean,z+.022,angle+twist*.022,t);
        var direction = Math.atan2(ahead[1]-p[1],ahead[0]-p[0]);
        var edge = Math.sin(Math.PI * z), width = h * (.070 + .071 * z) * (.79 + .21 * Math.sin(i * 2.7 + arm));
        windFiber(ctx, side ? (z < .46 ? 3 : 4) : 2, p[0], p[1], h * (.075 + .19 * z), width, direction, side ? .42 + .41 * edge : .66);
      }
    }
    ctx.beginPath();
    for (var n = 0; n < 36; n++) {
      var f = (n * .618 + t * (.82 + n % 5 * .18)) % 1, a = spin * (.67 - .22 * f) + n * 2.39996;
      var d = r * (.10 + .61 * f), back = cyclonePoint(x,y,d,a - .27), front = cyclonePoint(x,y,d + r * .055,a);
      var lift = f * h * .16;
      ctx.moveTo(back[0],y + (back[1]-y)*.56 - lift);
      ctx.lineTo(front[0],y + (front[1]-y)*.56 - lift - (n%3+1));
    }
    ctx.lineWidth = Math.max(1,h * .011);ctx.strokeStyle='rgba(190,155,109,.64)';ctx.stroke();
    for (var k = 0; k < 12; k++) {
      var f0 = (k * .618 + t * .61) % 1, a0 = k * 2.396 + spin * .42;
      var q0 = cyclonePoint(x,y,r * (.21 + .54 * f0),a0);
      windFiber(ctx, 3, q0[0], y + (q0[1]-y)*.60, r * (.18 + .29 * f0), r * .105, Math.sin(a0)*.28, .63 * (1-f0));
    }
  }
  function drawMoving(ctx, e, toScreen, zoom, t, ff, used) {
    if (cfg().on === false) return;
    var p = toScreen(e.lon, e.lat), r = e.r * zoom, fx = G.FX.movingDisaster;
    if (p[0] + r < -55 || p[0] - r > 1655 || p[1] + r < -55 || p[1] - r > 1135) return;
    var x = p[0], y = p[1], w = e.wind, ahead = Math.min(fx.pathDays, w.life - w.age), horizon = windAt(e, ahead);
    var q = toScreen(horizon[0], horizon[1]);
    ctx.save();
    if (!windTextures) windTextures = buildWindTextures();
    if (e.kind === 'hurricane') drawCyclone(ctx, x, y, r, t, e); else drawFunnel(ctx, x, y, r, t, e);
    // 고리는 실제 피해 반경, 점선은 지금 방향대로 이동할 때의 중심 경로다.
    ctx.lineWidth = 2;ctx.strokeStyle = fx.ring;ctx.setLineDash([9,7]);ctx.beginPath();ctx.arc(x, y, r, 0, Math.PI * 2);ctx.stroke();
    if (Math.hypot(q[0]-x, q[1]-y) > 17 && Math.abs(q[0]-x) < 1300) {
      ctx.setLineDash([4, 6]);ctx.lineWidth = 2.5;ctx.beginPath();ctx.moveTo(x,y);
      for (var i = 1; i <= 5; i++) { var m = windAt(e, ahead * i / 5), sp = toScreen(m[0], m[1]);ctx.lineTo(sp[0],sp[1]); }
      ctx.stroke();ctx.setLineDash([]);
      var back = windAt(e, ahead * .95), b = toScreen(back[0],back[1]), a = Math.atan2(q[1]-b[1],q[0]-b[0]);
      ctx.beginPath();ctx.moveTo(q[0],q[1]);ctx.lineTo(q[0]-Math.cos(a-.55)*16,q[1]-Math.sin(a-.55)*16);ctx.lineTo(q[0]-Math.cos(a+.55)*16,q[1]-Math.sin(a+.55)*16);ctx.closePath();ctx.fillStyle=fx.ring;ctx.fill();
    }
    ctx.setLineDash([]);ctx.font = '700 15px ' + (ff || 'serif');
    var label = e.name + ' · ' + U.dirName(w.heading) + '쪽 이동', tw = ctx.measureText(label).width;
    var head = e.kind === 'tornado' ? U.clamp(r * 1.48, fx.funnel[0], fx.funnel[1]) : r * .73;
    var ly = labelY(used, x, Math.max(117, y - head - 16), tw + 18);
    ctx.fillStyle = 'rgba(25,28,35,.84)';ctx.fillRect(x - tw / 2 - 8, ly - 11, tw + 16, 23);
    ctx.strokeStyle = fx.ring;ctx.lineWidth = 1;ctx.strokeRect(x - tw / 2 - 8, ly - 11, tw + 16, 23);
    ctx.fillStyle = fx.warning;ctx.textAlign = 'center';ctx.fillText(label, x, ly + 5);
    ctx.restore();
  }
  D.drawLand = function (ctx, toScreen, zoom, t, ff) {
    var T = st(); if (!T) return;
    var used = [];
    T.act.forEach(function (e) {
      if(ground(e.kind)){if(cfg().on!==false&&G.GroundDisasterFx)G.GroundDisasterFx.draw(ctx,e,toScreen,zoom,t,ff);return;}
      if (e.parent || !e.known) return;
      if (e.wind) { drawMoving(ctx, e, toScreen, zoom, t, ff, used); return; }
      var p = toScreen(e.lon, e.lat), rr = e.r * zoom;
      if (p[0] + rr < -50 || p[0] - rr > 1650 || p[1] + rr < -50 || p[1] - rr > 950) return;
      var col = K(e.kind).color, g = ctx.createRadialGradient(p[0], p[1], rr * 0.1, p[0], p[1], rr);
      g.addColorStop(0, 'rgba(' + col + ',.42)'); g.addColorStop(0.45, 'rgba(' + col + ',.2)'); g.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], rr, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(' + col + ',.55)'; ctx.setLineDash([6, 8]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p[0], p[1], rr * (0.92 + 0.05 * Math.sin(t * 2)), 0, 7); ctx.stroke(); ctx.setLineDash([]);
      // 그 갈래의 움직이는 그림 (images/sprites/disaster_*.webp — js/art/disasterfx.js)
      if (G.DisasterFx && G.DisasterFx.sprite) G.DisasterFx.sprite(ctx, e.kind, p[0], p[1] + 10, U.clamp(rr * 0.8, 70, 150), t + (e.seqT || 0));
      var lbl = e.name + ' · ' + (today() - e.start + 1) + '일째';
      ctx.font = '700 15px ' + (ff || 'serif'); var tw = ctx.measureText(lbl).width;
      var ly = labelY(used, p[0], p[1] - 38 - (G.DisasterFx && G.DisasterFx.sprite ? U.clamp(rr * 0.8, 70, 150) * 0.6 : 0), tw + 16);      // 도시 이름·그림과 겹치지 않게 조금 위에, 다른 재해 이름표와도 겹치지 않게
      ctx.fillStyle = 'rgba(60,16,8,.78)'; ctx.fillRect(p[0] - tw / 2 - 8, ly - 12, tw + 16, 24); ctx.strokeStyle = 'rgba(255,190,140,.6)'; ctx.lineWidth = 1; ctx.strokeRect(p[0] - tw / 2 - 8, ly - 12, tw + 16, 24);
      ctx.fillStyle = '#ffd9b0'; ctx.textAlign = 'center'; ctx.fillText(lbl, p[0], ly + 5); ctx.textAlign = 'left';
    });
  };
  /** 움직이는 회오리는 기함이 가리지 않도록 함대 아래층에 그린다. */
  D.drawTravelSea = function (ctx, toScreen, zoom, t, ff) {
    var T = st(); if (!T) return;
    var used = [];
    T.act.forEach(function (e) {
      if(e.wind&&e.known)drawMoving(ctx,e,toScreen,zoom,t,ff,used);
      else if(ground(e.kind)&&cfg().on!==false&&G.GroundDisasterFx)G.GroundDisasterFx.draw(ctx,e,toScreen,zoom,t,ff);
    });
  };
  /** 바다 화면 (sea.js): 알려진 재해 가운데 바다에서 보이는 것 — 해일·화산(바닷가)·해안의 지진·홍수 — 의 움직이는 그림과 이름 */
  D.drawSea = function (ctx, toScreen, zoom, t, ff) {
    var T = st(); if (!T) return;
    var byId = {}, used = []; T.act.forEach(function (e) { byId[e.id] = e; });
    T.act.forEach(function (e) {
      var root = e.parent ? byId[e.parent] : e;
      if (!root || !root.known) return;
      if (e.wind || ground(e.kind)) return;
      if (!G.DisasterFx || !G.DisasterFx.sprite) return;
      if (e.parent && e.kind !== 'tsunami') return;                 // 딸린 재해는 해일만 바다에 보인다
      var size = U.clamp(e.r * zoom * 0.3, 70, 130), lon = e.lon, lat = e.lat;
      if (e.parent) {                                                // 해일은 지진 자리에서 바다 쪽으로 비켜 그린다
        var off = size * 0.75 / Math.max(1, zoom), cand = [[-off, 0], [off, 0], [0, -off], [0, off], [-off, -off], [off, off]];
        for (var i = 0; i < cand.length; i++) if (G.Geo.isSea(e.lon + cand[i][0], e.lat + cand[i][1], 0.2)) { lon = e.lon + cand[i][0]; lat = e.lat + cand[i][1]; break; }
      }
      var p = toScreen(lon, lat);
      if (p[0] < -200 || p[0] > 1800 || p[1] < -200 || p[1] > 1100) return;
      var wet = (e.kind === 'quake' || e.kind === 'landslide') && G.Geo.isSea(lon, lat);   // 바다 밑 지진은 흙먼지 그림 없이 이름만 (해일 그림이 따로 뜬다)
      if (!wet && !G.DisasterFx.sprite(ctx, e.kind, p[0], p[1] + 8, size, t, 0.88)) return;
      if (e.parent) return;
      var lbl = e.name + ' · ' + (today() - e.start + 1) + '일째';
      ctx.font = '700 14px ' + (ff || 'serif'); var tw = ctx.measureText(lbl).width, ly = labelY(used, p[0], wet ? p[1] - 10 : p[1] - size * 0.86 - 6, tw + 14);
      ctx.fillStyle = 'rgba(60,16,8,.72)'; ctx.fillRect(p[0] - tw / 2 - 7, ly - 11, tw + 14, 22);
      ctx.fillStyle = '#ffd9b0'; ctx.textAlign = 'center'; ctx.fillText(lbl, p[0], ly + 5); ctx.textAlign = 'left';
    });
  };
})(window.G = window.G || {});
