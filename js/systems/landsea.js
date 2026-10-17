/* 육상 탐험 중에 보이는 바다의 배 (G.LandSea) — 탐험대가 뭍을 걷는 동안에도 화면 속 바다에서 배들이 오간다.
   · 탐험 함대(경쟁자): G.SeaFolk.voyages()의 함대가 날짜대로 항로를 간다 — 바다에서 보던 그 자리 (js/systems/seafolk.js posAt)
   · 그 바다의 배: 상선·함대·해적이 화면 속 바다에 드문드문 나타나 지나간다 (나라·배 종류는 바다와 같은 규칙 — G.Ships)
   그림만: 마주침·싸움은 없다. 탐험대가 걸어 날이 흐르는 만큼 움직이고, 멈춰 있을 때도 천천히 미끄러지며 파도를 탄다.
   조정값 G.FX.landSea (seafx.js). 육상 장면(js/scenes/land.js)이 step·draw를 부른다. */
(function (G) {
  'use strict';
  var U = G.U;
  var LS = {};
  G.LandSea = LS;
  var KIND = {
    pirate: { sail: '#3a3430', hull: '#2a2420', flag: '#111' },
    merchant: { sail: '#efe4c9', hull: '#6a4a2a', flag: '#c9a030' },
    navy: { sail: '#e8e0d0', hull: '#4a2e1c', flag: '#8a1e1e' }
  };
  var list = [], spawnAcc = 0, seeded = false, expT = 0, side = {};
  function S() { return G.Game.state; }
  function C() {
    var d = { on: true, max: 5, every: 0.35, near: 8, life: [5, 12], idle: 0.012, size: 0.9, pirate: 0.12, navy: 0.18 }, f = (G.FX && G.FX.landSea) || {}, o = {}, k;
    for (k in d) o[k] = f[k] == null ? d[k] : f[k];
    return o;
  }
  LS.reset = function () { list = []; spawnAcc = 0; seeded = false; expT = 0; side = {}; };
  LS.list = function () { return list; };

  /** 화면에 보이는 바다의 넓이(°): 가운데 lon·lat, 반폭·반높이 */
  function viewBox(v) { return { lon: v.lon, lat: v.lat, hw: 800 / v.zoom, hh: 450 / v.zoom }; }
  function inView(b, lon, lat, m) { return Math.abs(G.Geo.wrapLon(lon - b.lon)) < b.hw * (m || 1) && Math.abs(lat - b.lat) < b.hh * (m || 1); }

  function spawnOne(b, party, nearParty) {
    var s = S(), cf = C();
    for (var tries = 0; tries < 14; tries++) {
      var lon = G.Geo.wrapLon(b.lon + U.rf(-1, 1) * b.hw * 1.1), lat = b.lat + U.rf(-1, 1) * b.hh * 1.1;
      if (Math.abs(lat) > 78 || !G.Geo.isSea(lon, lat, 1.2)) continue;
      if (party && G.Geo.dist(lon, lat, party[0], party[1]) < (nearParty || 0)) continue;
      if (list.some(function (n) { return G.Geo.dist(lon, lat, n.lon, n.lat) < b.hw * 0.25; })) continue;
      var r = U.rf(0, 1), kind = r < cf.pirate ? 'pirate' : r < cf.pirate + cf.navy ? 'navy' : 'merchant';
      var zone = G.Ships && G.Ships.zone ? G.Ships.zone(lon, lat) : null;
      var nation = kind === 'navy' && G.Ships ? G.Ships.navyNation(zone, s.date.y) : kind === 'merchant' && G.SeaFolk && G.SeaFolk.localNation ? G.SeaFolk.localNation(lon, lat) : null;
      var n = kind === 'merchant' ? U.ri(1, 2) : U.ri(1, 3);
      var ships = null;
      try { ships = G.Ships.enemyTypes(kind, zone, nation, n, 0.3, s.date.y); } catch (e) { ships = null; }
      var o = { id: 'ls' + Math.random().toString(36).slice(2, 8), kind: kind, lon: lon, lat: lat, heading: U.rf(0, 6.283), spd: U.rf(0.8, 1.3), n: n, ships: ships, zone: zone, nation: nation,
        life: U.rf(cf.life[0], cf.life[1]), age: 0, a: 0 };
      if (G.ShipSprite && ships) G.ShipSprite.want(ships);
      list.push(o);
      return o;
    }
    return null;
  }

  /** 탐험 함대: 화면 가까이 있는 함대를 날짜대로 놓는다 */
  function syncExp(b, dayNow) {
    var SF = G.SeaFolk; if (!SF || !SF.voyages || !SF.posAt) return;
    var near = C().near;
    SF.voyages().forEach(function (ex) {
      var p = SF.posAt(ex, dayNow); if (!p) return;
      var have = list.filter(function (x) { return x.exp && x.exp.id === ex.id; })[0];
      var close = G.Geo.dist(b.lon, b.lat, p.lon, p.lat) < near;
      if (!have && close) {
        var o = { id: 'ex_' + ex.id, kind: 'navy', exp: ex, nation: ex.nation, lon: p.lon, lat: p.lat, heading: p.heading || 0, spd: 1, n: ex.ships.length, ships: ex.ships.slice(), zone: G.Ships ? G.Ships.zone(p.lon, p.lat) : null, age: 0, a: 0, life: 1e9 };
        o.label = SF.label ? SF.label(o) : ex.who + '의 탐험 함대';
        if (G.ShipSprite) G.ShipSprite.want(o.ships);
        list.push(o);
      } else if (have && !close) have.leave = true;
    });
    list.forEach(function (x) { if (x.exp && !SF.voyages().some(function (e) { return e.id === x.exp.id; })) x.leave = true; });
  }

  /** 한 장면: view = {lon, lat, zoom}, days = 이번 장면에 흐른 게임 날, dt = 실제 초, frac = 오늘의 지난 몫(0..1), party = [lon, lat] */
  LS.step = function (view, days, dt, frac, party) {
    var cf = C(); if (!cf.on || !G.Geo || !G.Geo.isSea) return;
    var s = S(), b = viewBox(view), dayNow = U.dayIndex(s.date) + (frac || 0);
    expT -= dt;
    if (expT <= 0) { expT = 0.5; try { syncExp(b, dayNow); } catch (e) { /* 함대 자료가 없으면 건너뛴다 */ } }
    // 처음 들어섰을 때 화면 속 바다에 몇 척을 미리 띄운다 (바다가 넓을수록 많이)
    if (!seeded) {
      seeded = true;
      var sea = 0; for (var i = 0; i < 24; i++) if (G.Geo.isSea(b.lon + U.rf(-1, 1) * b.hw, b.lat + U.rf(-1, 1) * b.hh, 1.2)) sea++;
      var want = Math.round(cf.max * Math.min(1, sea / 12));
      for (var k = 0; k < want; k++) { var o0 = spawnOne(b, party, 0.6); if (o0) { o0.a = 1; o0.age = U.rf(0, o0.life * 0.6); } }
    }
    // 날이 흐르면(탐험대가 걸으면) 새 배가 들어온다
    spawnAcc += days;
    var plain = list.filter(function (x) { return !x.exp; }).length;
    if (spawnAcc >= cf.every) { spawnAcc = 0; if (plain < cf.max && U.chance(0.7)) spawnOne(b, party, 0.6); }
    for (var j = list.length - 1; j >= 0; j--) {
      var n = list[j];
      if (n.exp) {
        var p = G.SeaFolk.posAt(n.exp, dayNow);
        if (!p) n.leave = true; else { n.lon = p.lon; n.lat = p.lat; if (p.heading != null) n.heading = p.heading; }
      } else {
        n.age += days;
        var mv = n.spd * days + n.spd * cf.idle * dt;                       // 날이 흐른 만큼 + 멈춰 있을 때도 천천히
        var nl = n.lon + Math.cos(n.heading) * mv, nt = n.lat + Math.sin(n.heading) * mv;
        if (G.Geo.isSea(nl, nt, 0.6)) { n.lon = G.Geo.wrapLon(nl); n.lat = nt; } else n.heading += U.rf(1, 2.5);
        if (n.age > n.life || !inView(b, n.lon, n.lat, 1.6)) n.leave = true;
      }
      // 나타나고 사라질 때는 천천히 (물안개 속에서 보이듯)
      var ta = n.leave ? 0 : 1;
      n.a += (ta - n.a) * Math.min(1, dt * 1.5);
      if (n.leave && n.a < 0.02) list.splice(j, 1);
    }
  };

  function sideView(n, dt) {
    var c = Math.cos(n.heading), o = side[n.id];
    if (!o) o = side[n.id] = { face: c >= 0 ? 1 : -1 };
    if ((o.face > 0 && c < -0.2) || (o.face < 0 && c > 0.2)) o.face = -o.face;
    var tilt = Math.sin(n.heading) * 20 * Math.PI / 180;
    return o.face > 0 ? tilt : Math.PI - tilt;
  }
  function pose(n, t) {
    var WV = G.Waves, RD = G.FX && G.FX.ride; if (!WV || !RD || RD.on === false) return null;
    try {
      var K = RD.sea || { roll: 1, pitch: 1, heave: 1 }, Lb = 0.12, cst = WV.coast(n.lon, n.lat);
      var h = WV.hull(function (x, y) { return WV.sea(x, y, t, [0.4, 0.2], 170, cst); }, n.lon, n.lat, n.heading, Lb, Lb * 0.5);
      return { roll: U.clamp(h.roll * K.roll, -0.2, 0.2), pitch: U.clamp(h.pitch * K.pitch, -0.08, 0.08), heave: U.clamp(h.heave * K.heave, -0.05, 0.05) };
    } catch (e) { return null; }
  }

  /** 그린다: toScreen(lon, lat) → [x, y], t = 장면 시각, ff = 글꼴 */
  LS.draw = function (ctx, toScreen, zoom, t, ff) {
    var cf = C(); if (!cf.on || !list.length || !G.Art || !G.Art.shipTop) return;
    var A = G.Art, px = ((G.FX && G.FX.ship && G.FX.ship.npcSize) || 54) * cf.size;
    list.forEach(function (n) {
      var p = toScreen(n.lon, n.lat); if (p[0] < -60 || p[0] > 1660 || p[1] < -60 || p[1] > 960 || n.a < 0.01) return;
      var kk = KIND[n.kind] || KIND.merchant, ang = sideView(n), ps = pose(n, t), k = px / 30;
      ctx.save(); ctx.globalAlpha = n.a;
      for (var j = Math.min(3, n.n || 1) - 1; j >= 0; j--) {
        var ty = n.ships && n.ships[j], look = ty ? A.shipLook(ty, { flag: kk.flag, cross: false }) : { sails: ['sq', 'sq', 'lat'], hull: kk.hull, sail: kk.sail, flag: kk.flag };
        if (n.kind === 'pirate') { look.hull = kk.hull; if (look.hullType === 'west' || look.hullType === 'galley' || look.hullType === 'dhow') look.sail = kk.sail; }
        if (ps) look.pose = j ? { roll: ps.roll * 0.8, pitch: -ps.pitch * 0.6, heave: ps.heave * 0.5 } : ps;
        look.motionSpeed = 0.6; look.motionRate = 0.9; look.sid = n.id + ':' + j;
        look.face = Math.cos(ang) >= 0 ? 1 : -1; look.squash = 1;
        var x = p[0] - Math.cos(ang) * j * 18 * k + j * 6 * k, y = p[1] + Math.sin(ang) * j * 18 * k + j * 8 * k;
        A.shipTop(ctx, x, y, ang, px, look, t + j);
      }
      if (n.exp && n.label) {
        ctx.font = '700 14px ' + (ff || 'serif'); ctx.textAlign = 'center';
        var lw = ctx.measureText(n.label).width;
        ctx.fillStyle = 'rgba(20,10,6,.55)'; ctx.fillRect(p[0] - lw / 2 - 5, p[1] - px * 0.72 - 15, lw + 10, 19);
        ctx.fillStyle = '#ffe08a'; ctx.fillText(n.label, p[0], p[1] - px * 0.72); ctx.textAlign = 'left';
      }
      ctx.restore();
    });
  };
})(window.G = window.G || {});
