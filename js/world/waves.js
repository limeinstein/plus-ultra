/* 파도 높이 (G.Waves) — 화면의 바다 셰이더(renderer.js의 waterCol·battleSea)와 같은 식을 JS로 옮긴 것.
   배가 "보이는 파도"를 타게 한다: 선체 위 몇 점의 물 높이로 앞뒤 기울기(pitch)·좌우 기울기(roll)·오르내림(heave)을 정하고,
   그 값을 용수철-감쇠(2차)로 따라가 배마다 관성과 되흔들림이 생긴다.
   · sea(lon, lat, t, wind, pxD)   항해 지도: 너울 2 + 풍랑 5 (해안 가까이 물결이 뭍 쪽으로 휘는 것까지)
   · battle(qx, qy, t, wind, pxU)  해전: 너울 2 + 풍랑 6 (q = 해전 좌표 100px 단위, 위가 +)
   두 함수 모두 {h, gx, gy} (높이와 기울기)를 돌려준다. 셰이더와 같은 해시·값 잡음을 써서 물마루 자리가 화면과 맞는다.
   조정값은 G.FX.ride (seafx.js). */
(function (G) {
  'use strict';
  var WV = {};
  G.Waves = WV;

  // ---------- 셰이더와 같은 해시·값 잡음 (uint 곱셈은 Math.imul로 32비트)
  function hash(x, y) {
    var h = (Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1)) >>> 0;
    h ^= h >>> 15; h = Math.imul(h, 0x85ebca6b) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0; h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function vnoise(px, py) {
    var ix = Math.floor(px), iy = Math.floor(py), fx = px - ix, fy = py - iy;
    var ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    var a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  }
  WV.vnoise = vnoise;
  function smooth(e0, e1, x) { var t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }
  function waveK() { var w = G.FX && G.FX.water; return w && w.wave != null ? w.wave : 1; }

  /** 해안 쪽 정보: 먼바다면 null. 셰이더의 d(해안까지 텍셀)·gS(뭍 쪽 기울기)와 같은 뜻 */
  function coast(lon, lat) {
    var Geo = G.Geo; if (!Geo || !Geo.sdfRaw || !Geo.TEX_PER_DEG) return null;
    var s = Geo.sdf(lon, lat), d = Math.max(-s, 0);
    if (d > 30) return null;                                  // exp(−30/5) ≈ 0 — 먼바다
    var e = 1 / Geo.TEX_PER_DEG;
    return { near: Math.exp(-d / 5), gx: (Geo.sdfRaw(lon + e, lat) - Geo.sdfRaw(lon - e, lat)) * 0.5, gy: (Geo.sdfRaw(lon, lat + e) - Geo.sdfRaw(lon, lat - e)) * 0.5 };
  }

  WV.coast = coast;

  /** 항해 지도의 물 높이. wind = [x, y] (셰이더 uWind와 같은 값), pxD = 1°의 화면 px(장치 기준). cst = coast() 결과(없으면 먼바다) */
  WV.sea = function (lon, lat, t, wind, pxD, cst) {
    var px = lon + 180, py = lat + 90;
    var wx = wind[0], wy = wind[1], wl = Math.sqrt(wx * wx + wy * wy), wstr = Math.min(1, wl);
    var nx = wx + 1e-4, nl = Math.sqrt(nx * nx + wy * wy), wdx = nx / nl, wdy = wy / nl, wpx = -wdy, wpy = wdx;
    var nearC = 0, tlx = 1, tly = 0;
    if (cst) { nearC = cst.near; var gl = Math.sqrt((cst.gx + 1e-5) * (cst.gx + 1e-5) + cst.gy * cst.gy); tlx = (cst.gx + 1e-5) / gl; tly = cst.gy / gl; }
    var nW1 = vnoise(px * 1.3 + 5, py * 1.3 + 5), nW2 = vnoise(px * 0.9 + 3.1, py * 0.9 + 3.1);
    var wk = waveK(), h = 0, gx = 0, gy = 0;
    for (var i = 0; i < 7; i++) {
      var lam = (i < 2 ? (0.62 - i * 0.22) : (0.17 / (1 + (i - 2) * 0.42))) * wk;
      var spr = i < 2 ? (i * 0.45 - 0.25) : ((i - 4) * 0.45 + 0.1);
      var dx = wdx * Math.cos(spr) + wpx * Math.sin(spr), dy = wdy * Math.cos(spr) + wpy * Math.sin(spr), dl = Math.sqrt(dx * dx + dy * dy); dx /= dl; dy /= dl;
      var mk = nearC * (i < 2 ? 0.75 : 0.45);
      dx += (tlx - dx) * mk; dy += (tly - dy) * mk; dl = Math.sqrt(dx * dx + dy * dy); dx /= dl; dy /= dl;
      lam *= 1 + (0.6 - 1) * nearC;
      var lf = smooth(3, 10, lam * pxD);
      if (lf <= 0) continue;
      var k = 6.2832 / lam, omega = 0.020 * Math.sqrt(lam / 0.5) * k * (i < 2 ? 1 : 1.3);
      var amp = lam * (i < 2 ? (0.07 + 0.05 * wstr) : (0.05 + 0.10 * wstr)) * (i < 2 ? (1 - 0.5 * nearC) : 1);
      var xp = (px * dx + py * dy) * k;
      var env = 0.55 + 0.45 * Math.sin(xp / 6.5 - omega / 6.5 * t + i * 2.1 + nW1 * (4 + i));
      var ph = xp - omega * t + i * 1.7 + nW2 * (2.5 - i * 0.2) + nW1 * i * 0.3;
      var a = amp * env * lf, c = Math.cos(ph);
      h += a * Math.sin(ph); gx += a * k * dx * c; gy += a * k * dy * c;
    }
    return { h: h, gx: gx, gy: gy };
  };
  /** 항해 지도에서 가장 긴 너울의 파장(°) — 배가 이것보다 길면 기울기를 잴 간격을 줄인다 */
  WV.seaSwell = function () { return 0.62 * waveK(); };

  /** 해전 바다의 물 높이. q = 해전 좌표(100px 단위, 위가 +), pxU = 한 단위의 화면 px */
  WV.battle = function (qx, qy, t, wind, pxU) {
    var wx = wind[0], wy = wind[1], wstr = Math.min(1, Math.sqrt(wx * wx + wy * wy));
    var nx = wx + 1e-4, nl = Math.sqrt(nx * nx + wy * wy), wdx = nx / nl, wdy = wy / nl, wpx = -wdy, wpy = wdx;
    var n1 = vnoise(qx * 0.11 + 3, qy * 0.11 + 3), n2 = vnoise(qx * 0.07 + 11, qy * 0.07 + 11);
    var wk = waveK(), h = 0, gx = 0, gy = 0;
    for (var i = 0; i < 8; i++) {
      var lam = (i < 2 ? (7.5 - i * 2.6) : (2.2 / (1 + (i - 2) * 0.55))) * wk;
      var spr = i < 2 ? (i * 0.5 - 0.2) : Math.sin(i * 2.3) * 0.75;
      var dx = wdx * Math.cos(spr) + wpx * Math.sin(spr), dy = wdy * Math.cos(spr) + wpy * Math.sin(spr), dl = Math.sqrt(dx * dx + dy * dy); dx /= dl; dy /= dl;
      var k = 6.2832 / lam, omega = Math.sqrt(9.8 * k / 33) * 0.65;
      var steep = i < 2 ? 0.05 + 0.03 * wstr : 0.03 + 0.07 * wstr, amp = steep / k;
      var lf = smooth(4, 14, lam * pxU);
      if (lf <= 0) continue;
      var xp = (qx * dx + qy * dy) * k;
      var env = 0.55 + 0.45 * Math.sin(xp * 0.17 - omega * 0.17 * t + i * 2.1 + n1 * (3 + i));
      var ph = xp - omega * t + i * 1.7 + n2 * (3 - i * 0.25);
      var a = amp * env * lf, c = Math.cos(ph);
      h += a * Math.sin(ph); gx += a * k * dx * c; gy += a * k * dy * c;
    }
    return { h: h, gx: gx, gy: gy };
  };
  WV.battleSwell = function () { return 7.5 * waveK(); };

  /** 선체 위 다섯 점(선수·선미·좌현·우현·가운데)의 물 높이로 기울기를 잰다.
      fn(x, y) → {h}, (x, y) 가운데, ang 선수 방향(rad, 세상 좌표 반시계), L·B = 기울기를 잴 앞뒤·좌우 간격(세상 단위)
      돌려줌: {pitch: 선수가 높으면 +, roll: 우현이 높으면 +, heave: 평균 높이, bowH: 선수 높이} (기울기는 높이/간격) */
  WV.hull = function (fn, x, y, ang, L, B) {
    var c = Math.cos(ang), s = Math.sin(ang), hl = L * 0.5, hb = B * 0.5;
    var bow = fn(x + c * hl, y + s * hl).h, st = fn(x - c * hl, y - s * hl).h;
    var port = fn(x - s * hb, y + c * hb).h, stb = fn(x + s * hb, y - c * hb).h, m = fn(x, y), mid = m.h;
    // lp·lr = 가운데 한 점의 물 기울기(짧은 물결까지) — 긴 너울의 느린 흔들림 위에 잔 흔들림을 얹는 데 쓴다
    return { pitch: (bow - st) / L, roll: (stb - port) / B, heave: (bow + st + port + stb + 2 * mid) / 6, bowH: bow, lp: m.gx * c + m.gy * s, lr: m.gx * s - m.gy * c };
  };

  /** 2차 흔들림(용수철-감쇠): 물이 미는 기울기를 배가 관성을 가지고 따라간다 — 되흔들림·늦은 반응.
      R = {roll, pitch, heave, vr, vp, vh} 상태, tgt = {roll, pitch, heave}, P = G.FX.ride, dt = 실제 초 */
  WV.spring = function (R, tgt, P, dt) {
    var n = Math.max(1, Math.ceil(dt / 0.02)), h = dt / n;
    for (var i = 0; i < n; i++) {
      R.vr += (P.rollW * P.rollW * (tgt.roll - R.roll) - 2 * P.rollZ * P.rollW * R.vr) * h; R.roll += R.vr * h;
      R.vp += (P.pitchW * P.pitchW * (tgt.pitch - R.pitch) - 2 * P.pitchZ * P.pitchW * R.vp) * h; R.pitch += R.vp * h;
      R.vh += (P.heaveW * P.heaveW * (tgt.heave - R.heave) - 2 * P.heaveZ * P.heaveW * R.vh) * h; R.heave += R.vh * h;
    }
  };
  WV.newRide = function () { return { roll: 0, pitch: 0, heave: 0, vr: 0, vp: 0, vh: 0, bow: 0, bowV: 0, cool: 0 }; };

  /** 겉바람(배에서 느끼는 바람): 참바람 − 배의 속도. 돌려줌 {a: 선수 기준 각(0 = 뒤에서 불어옴, ±π = 정면), spd}
      wind = {dir(불어 가는 쪽), spd 0..1}, vx·vy = 배 속도를 참바람과 같은 척도로 맞춘 값 */
  WV.apparent = function (wind, vx, vy, heading) {
    var vm = Math.sqrt(vx * vx + vy * vy), cap = 0.7 * wind.spd;          // 배가 바람보다 빨라 겉바람이 뒤집히지 않게
    if (vm > cap && vm > 0) { vx *= cap / vm; vy *= cap / vm; }
    var ax = Math.cos(wind.dir) * wind.spd - vx, ay = Math.sin(wind.dir) * wind.spd - vy;
    var sp = Math.sqrt(ax * ax + ay * ay), d = Math.atan2(ay, ax) - heading;
    while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    return { a: d, spd: sp };
  };

  /** 돛의 모양(부드럽게 따라감): rig = {brace, lee, luff, fill} — 그림(paint.js·ships.js)이 이것을 읽는다.
      brace = 가로돛 활대를 돌린 각(캔버스 기준 rad), lee = 삼각돛이 넘어가 있는 쪽(+1 우현 … −1 좌현),
      luff = 맞바람에 돛이 펄럭이는 정도(0..1), fill = 돛이 부푼 정도, wind = 깃발이 날리는 쪽(캔버스 기준 rad) */
  WV.rigStep = function (rig, ap, dt, furl) {
    var P = (G.FX && G.FX.ride) || {};
    var rel = Math.abs(ap.a);
    var luffT = smooth(P.luffFrom || 2.25, P.luffTo || 2.7, rel) * (1 - (furl || 0));
    var braceT = Math.max(-0.75, Math.min(0.75, -ap.a * 0.8));              // 활대는 바람을 받는 쪽으로 (한계 약 43°)
    if (rel > 2.2) braceT = Math.sign(-ap.a || 1) * 0.75;
    var leeT = -Math.sin(ap.a) >= 0 ? 1 : -1;                              // 바람이 건너가는 쪽 = 삼각돛이 넘어가는 쪽
    if (Math.abs(Math.sin(ap.a)) < 0.12 && rig.lee != null) leeT = rig.lee >= 0 ? 1 : -1;   // 바로 뒤·앞바람이면 그대로 둔다
    var fillT = Math.min(1.25, 0.45 + 0.9 * ap.spd) * (1 - 0.75 * luffT);
    if (rig.brace == null) { rig.brace = braceT; rig.lee = leeT; rig.luff = luffT; rig.fill = fillT; rig.wind = -ap.a; }
    var k = Math.min(1, dt * (P.rigRate || 1.6)), kl = Math.min(1, dt * 1.8);
    rig.brace += (braceT - rig.brace) * k;
    rig.lee += (leeT - rig.lee) * kl;                                       // 태킹·자이빙 때 삼각돛이 가운데를 지나 반대쪽으로 넘어간다
    rig.luff += (luffT - rig.luff) * Math.min(1, dt * 3);
    rig.fill += (fillT - rig.fill) * Math.min(1, dt * 2.5);
    // 깃발은 바람이 불어 가는 쪽으로 (캔버스 좌표: 선수 = +x, 우현 = +y)
    var wT = -ap.a, dw = wT - rig.wind; while (dw > Math.PI) dw -= 2 * Math.PI; while (dw < -Math.PI) dw += 2 * Math.PI;
    rig.wind += dw * Math.min(1, dt * 4);
    rig.aws = ap.spd;
    return rig;
  };
})(window.G = window.G || {});
