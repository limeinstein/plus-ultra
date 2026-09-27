/* 배 그림: 갤리·다우·정크·조선 배(맹선·판옥선·거북선)·일본 배(소조·관선·안택선)·뗏목·쪽배.
   서양 배는 js/art/paint.js 의 A.shipSide / A.shipTop 이 그린다. 여기서는 그 둘을 감싸 선체 모양(hullType)에 따라 나눈다. */
(function (G) {
  'use strict';
  var U = G.U, A = G.Art;

  /** 배 종류에 맞는 그림 설정 (over로 덮어쓴다) */
  A.shipLook = function (typeId, over) {
    var t = G.SHIP[typeId] || {}, c = t.cult || 'eu', h = t.hull || 'west';
    var k = { sails: t.sails || ['sq', 'sq', 'lat'], hullType: h, hull: '#3a2416', sail: '#efe4c9', cross: c === 'eu', flag: '#1d3f7a', big: (t.cap || 0) >= 250, type: typeId };
    if (c === 'is') { k.hull = '#5a3a1e'; k.sail = '#ece0c4'; k.flag = '#2f6a3a'; }
    if (c === 'sa') { k.hull = '#4a3020'; k.sail = '#c9a878'; k.flag = '#b3261e'; }
    if (h === 'junk') { k.hull = '#4a2c1c'; k.sail = '#a95f36'; k.flag = '#b3261e'; }
    if (h === 'kr' || h === 'panok' || h === 'turtle') { k.hull = '#6a4a2c'; k.sail = '#e6dcc2'; k.flag = '#2a4f8a'; }
    if (h === 'jp' || h === 'atake') { k.hull = '#2e2622'; k.sail = '#efe8d8'; k.flag = '#f2ede0'; }
    if (h === 'raft') { k.hull = '#a88a5a'; k.sail = '#e3d4a8'; k.flag = null; }
    if (h === 'outrigger') { k.hull = '#5a3a22'; k.sail = '#cdb27a'; k.flag = '#c9a030'; }
    if (h === 'galley') k.hull = '#4a2e1c';
    return Object.assign(k, over || {});
  };

  function grad(ctx, x0, y0, x1, y1, c, a, b) { var g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, A.rgba(A.shade(c, a))); g.addColorStop(1, A.rgba(A.shade(c, b))); return g; }

  // ================================================================ 돛 (옆모습)
  /** 대나무 살 돛: 돛대 뒤쪽으로 펼친 사다리꼴, 가로 살이 보인다. mx: 돛대 x, y0: 돛대 밑동, mh: 돛대 높이 */
  A.sailBatSide = function (ctx, mx, y0, mh, sc, wk) {
    sc = A.hex(sc || '#a95f36');
    var top = y0 - mh + 4, bot = y0 - 8, w = mh * 0.52 * (wk || 1);
    var p = [[mx + w * 0.22, top + mh * 0.1], [mx - w * 0.78, top - mh * 0.02], [mx - w * 0.92, bot], [mx + w * 0.24, bot]];
    ctx.fillStyle = grad(ctx, mx - w, 0, mx + w * 0.3, 0, sc, 0.78, 1.08);
    ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); ctx.lineTo(p[1][0], p[1][1]);
    ctx.quadraticCurveTo(mx - w * 1.08, (top + bot) / 2, p[2][0], p[2][1]); ctx.lineTo(p[3][0], p[3][1]); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(40,20,10,.55)'; ctx.lineWidth = 1.1;
    for (var k = 0; k <= 6; k++) {
      var u = k / 6, ya = p[0][1] + (p[3][1] - p[0][1]) * u, yb = p[1][1] + (p[2][1] - p[1][1]) * u;
      var xa = p[0][0] + (p[3][0] - p[0][0]) * u, xb = p[1][0] + (p[2][0] - p[1][0]) * u - Math.sin(u * Math.PI) * w * 0.12;
      ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xb, yb); ctx.stroke();
    }
  };
  /** 일본 배의 네모 돛: 무명 폭을 세로로 이어 붙였다 */
  function sailJpSide(ctx, mx, y0, mh, sc) {
    sc = A.hex(sc || '#efe8d8');
    var top = y0 - mh + 6, bot = y0 - 10, w = mh * 0.46;
    ctx.fillStyle = grad(ctx, mx - w, 0, mx + w, 0, sc, 1.03, 0.78);
    ctx.beginPath(); ctx.moveTo(mx - w, top); ctx.lineTo(mx + w, top); ctx.quadraticCurveTo(mx + w + 8, (top + bot) / 2, mx + w, bot); ctx.lineTo(mx - w, bot); ctx.quadraticCurveTo(mx - w + 8, (top + bot) / 2, mx - w, top); ctx.fill();
    ctx.strokeStyle = 'rgba(90,70,50,.45)'; ctx.lineWidth = 0.9;
    for (var i = 1; i < 8; i++) { var x = mx - w + i * w * 2 / 8; ctx.beginPath(); ctx.moveTo(x, top + 1); ctx.lineTo(x + 3, bot - 1); ctx.stroke(); }
    ctx.strokeStyle = '#2b1d12'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mx - w - 4, top); ctx.lineTo(mx + w + 4, top); ctx.stroke();
  }
  function sailSqSide(ctx, mx, y0, mh, sc, cross) {
    sc = A.hex(sc);
    for (var k = 0; k < 2; k++) {
      var top = y0 - mh + 8 + k * mh * 0.45, hh = mh * 0.38, ww = 26 - k * 3;
      ctx.fillStyle = grad(ctx, mx - ww, 0, mx + ww, 0, sc, 1.05, 0.72);
      ctx.beginPath(); ctx.moveTo(mx - ww, top); ctx.lineTo(mx + ww, top); ctx.quadraticCurveTo(mx + ww + 6, top + hh * 0.5, mx + ww, top + hh); ctx.lineTo(mx - ww, top + hh); ctx.quadraticCurveTo(mx - ww + 6, top + hh * 0.5, mx - ww, top); ctx.fill();
      if (cross && k === 0) { ctx.fillStyle = '#a3261c'; ctx.fillRect(mx - 3, top + 4, 6, hh - 8); ctx.fillRect(mx - 10, top + hh * 0.35, 20, 6); }
    }
  }
  function sailLatSide(ctx, mx, y0, mh, sc) {
    sc = A.hex(sc);
    ctx.fillStyle = grad(ctx, mx - 30, 0, mx + 20, 0, sc, 1.05, 0.7);
    ctx.beginPath(); ctx.moveTo(mx + 6, y0 - mh); ctx.lineTo(mx - 34, y0 - 4); ctx.lineTo(mx + 4, y0 - 4); ctx.quadraticCurveTo(mx + 14, y0 - mh * 0.5, mx + 6, y0 - mh); ctx.fill();
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(mx + 8, y0 - mh - 4); ctx.lineTo(mx - 36, y0); ctx.stroke();
  }
  /** 돛대 하나와 돛 */
  function mastSide(ctx, kind, mx, y0, mh, spec, rake, style, wk) {
    ctx.strokeStyle = '#2b1d12'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(mx, y0); ctx.lineTo(mx + (rake || 0), y0 - mh); ctx.stroke();
    var sx = mx + (rake || 0) * 0.5;
    if (kind === 'bat') A.sailBatSide(ctx, sx, y0, mh, spec.sail, wk);
    else if (kind === 'sq' && style === 'jp') sailJpSide(ctx, sx, y0, mh, spec.sail);
    else if (kind === 'sq') sailSqSide(ctx, sx, y0, mh, spec.sail || '#efe4c9', spec.cross);
    else sailLatSide(ctx, sx, y0, mh, spec.sail || '#efe4c9');
    if (spec.flag) { ctx.fillStyle = spec.flag; ctx.beginPath(); ctx.moveTo(mx + (rake || 0), y0 - mh); ctx.lineTo(mx + (rake || 0) - 16, y0 - mh + 3); ctx.lineTo(mx + (rake || 0), y0 - mh + 6); ctx.fill(); }
  }
  function oarsSide(ctx, x0, x1, y, n, len) {
    ctx.strokeStyle = 'rgba(58,38,22,.9)'; ctx.lineWidth = 1.6;
    for (var i = 0; i < n; i++) { var x = x0 + (x1 - x0) * i / Math.max(1, n - 1); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - len * 0.45, y + len); ctx.stroke(); }
  }
  function planks(ctx, x0, x1, y0, y1, n) {
    ctx.strokeStyle = 'rgba(20,10,4,.28)'; ctx.lineWidth = 0.8;
    for (var i = 1; i < n; i++) { var y = y0 + (y1 - y0) * i / n; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
  }

  // ================================================================ 선체 (옆모습)
  var SIDE = {};
  SIDE.galley = function (ctx, spec) {
    var sails = spec.sails, n = sails.length, big = spec.big, L = 200 + (big ? 40 : 0), hull = A.hex(spec.hull);
    oarsSide(ctx, -L / 2 + 34, L / 2 - 46, -6, big ? 20 : 14, 22);
    ctx.fillStyle = grad(ctx, 0, -14, 0, 12, hull, 1.35, 0.55);
    ctx.beginPath(); ctx.moveTo(-L / 2 - 10, -16); ctx.lineTo(-L / 2 + 20, -10); ctx.lineTo(L / 2 - 18, -9); ctx.lineTo(L / 2 + 4, -13);
    ctx.lineTo(L / 2 + (spec.ram === false ? 10 : 38), -7); ctx.lineTo(L / 2 + 4, -2); ctx.quadraticCurveTo(L / 2 - 24, 11, 0, 11); ctx.quadraticCurveTo(-L / 2 + 22, 11, -L / 2 - 4, -3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(230,200,140,.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-L / 2 + 10, -8); ctx.lineTo(L / 2 - 20, -7); ctx.stroke();
    // 고물 차양
    ctx.fillStyle = spec.cross ? '#8a2a1e' : '#2f5a3a';
    ctx.beginPath(); ctx.moveTo(-L / 2 - 2, -12); ctx.quadraticCurveTo(-L / 2 + 14, -34, -L / 2 + 36, -12); ctx.closePath(); ctx.fill();
    // 뱃머리 포대
    ctx.fillStyle = A.rgba(A.shade(hull, 0.8)); ctx.fillRect(L / 2 - 44, -19, 30, 9);
    ctx.fillStyle = '#1a1410'; for (var g = 0; g < 3; g++) ctx.fillRect(L / 2 - 16, -17 + g * 2.5, 9, 1.6);
    if (big) {
      ctx.fillStyle = A.rgba(A.shade(hull, 0.9)); ctx.fillRect(-L / 2 - 4, -32, 40, 18); ctx.fillRect(L / 2 - 50, -30, 36, 14);
      ctx.fillStyle = '#1a1410'; for (var p = 0; p < 9; p++) ctx.fillRect(-L / 2 + 44 + p * 17, -7, 5, 4);
    }
    for (var i = 0; i < n; i++) {
      var mx = n === 1 ? L * 0.12 : L * 0.22 - i * (L * 0.5 / (n - 1));
      mastSide(ctx, sails[i], mx, -10, (i === 0 ? 86 : 70) - (n > 2 && i === n - 1 ? 12 : 0), spec, 0);
    }
  };
  SIDE.dhow = function (ctx, spec) {
    var sails = spec.sails, n = sails.length, L = 118 + n * 24, hull = A.hex(spec.hull);
    ctx.fillStyle = grad(ctx, 0, -26, 0, 14, hull, 1.35, 0.55);
    ctx.beginPath(); ctx.moveTo(-L / 2 - 6, -28); ctx.lineTo(-L / 2 + 30, -22); ctx.lineTo(L / 2 - 14, -10); ctx.lineTo(L / 2 + 26, -20);
    ctx.lineTo(L / 2 + 6, -4); ctx.quadraticCurveTo(L / 2 - 20, 14, 0, 14); ctx.quadraticCurveTo(-L / 2 + 16, 14, -L / 2 + 2, 0); ctx.closePath(); ctx.fill();
    planks(ctx, -L / 2 + 6, L / 2 - 10, -14, 10, 4);
    ctx.fillStyle = 'rgba(255,220,140,.35)'; for (var w = 0; w < 3; w++) ctx.fillRect(-L / 2 + 2 + w * 8, -22, 4, 5);
    if (spec.hullType === 'jong') {
      ctx.fillStyle = A.rgba(A.shade(hull, 0.85)); ctx.fillRect(-L / 2 + 4, -40, 44, 16);
      ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-L / 2 + 20, -18); ctx.lineTo(-L / 2 + 2, 16); ctx.moveTo(-L / 2 + 34, -16); ctx.lineTo(-L / 2 + 18, 16); ctx.stroke();   // 고물 양옆의 키
    }
    for (var i = 0; i < n; i++) {
      var mx = n === 1 ? 10 : L * 0.28 - i * (L * 0.62 / (n - 1));
      mastSide(ctx, sails[i], mx, -12, (i === 0 ? 96 : 84) - i * 6, spec, 8);
    }
  };
  SIDE.jong = SIDE.dhow;
  SIDE.junk = function (ctx, spec) {
    var sails = spec.sails, n = sails.length, L = 128 + n * 22, hull = A.hex(spec.hull);
    // 키
    ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.moveTo(-L / 2 + 2, -6); ctx.lineTo(-L / 2 - 14, 18); ctx.lineTo(-L / 2 + 6, 20); ctx.lineTo(-L / 2 + 10, -4); ctx.fill();
    ctx.fillStyle = grad(ctx, 0, -40, 0, 14, hull, 1.3, 0.55);
    ctx.beginPath(); ctx.moveTo(-L / 2 - 10, -44); ctx.lineTo(-L / 2 + 28, -26); ctx.quadraticCurveTo(0, -16, L / 2 - 10, -22); ctx.lineTo(L / 2 + 8, -28);
    ctx.lineTo(L / 2 + 2, -4); ctx.quadraticCurveTo(L / 2 - 24, 14, 0, 14); ctx.quadraticCurveTo(-L / 2 + 14, 14, -L / 2 - 2, -8); ctx.closePath(); ctx.fill();
    planks(ctx, -L / 2 + 6, L / 2 - 4, -18, 10, 4);
    ctx.fillStyle = '#9a2a1c'; ctx.beginPath(); ctx.moveTo(-L / 2 + 26, -24); ctx.quadraticCurveTo(0, -12, L / 2 - 10, -18); ctx.lineTo(L / 2 - 10, -14); ctx.quadraticCurveTo(0, -8, -L / 2 + 26, -19); ctx.fill();
    // 고물 누각
    ctx.fillStyle = A.rgba(A.shade(hull, 0.9)); ctx.fillRect(-L / 2 - 6, -54, 38, 14);
    ctx.fillStyle = '#7a2a1a'; ctx.beginPath(); ctx.moveTo(-L / 2 - 12, -54); ctx.lineTo(-L / 2 + 38, -54); ctx.lineTo(-L / 2 + 30, -60); ctx.lineTo(-L / 2 - 4, -60); ctx.fill();
    // 뱃머리 눈
    ctx.fillStyle = '#f2ead8'; ctx.beginPath(); ctx.arc(L / 2 - 12, -12, 4.4, 0, 7); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(L / 2 - 11, -12, 2, 0, 7); ctx.fill();
    var spread = n >= 4 ? 0.8 : 0.62, wk = n >= 4 ? 0.7 : 1;
    for (var i = 0; i < n; i++) {
      var mx = n === 1 ? 0 : L * (n >= 4 ? 0.4 : 0.32) - i * (L * spread / (n - 1));
      mastSide(ctx, sails[i], mx, -16, (i === 0 ? 76 : i === 1 ? 100 : 86) + (n > 3 && i === 1 ? 10 : 0), spec, i === 0 ? 10 : 0, null, wk);
    }
  };
  function krHull(ctx, L, hull, top) {
    ctx.fillStyle = grad(ctx, 0, top, 0, 12, hull, 1.3, 0.6);
    ctx.beginPath(); ctx.moveTo(-L / 2 - 8, top - 2); ctx.lineTo(L / 2 + 10, top - 4); ctx.lineTo(L / 2 - 6, 10); ctx.lineTo(-L / 2 + 10, 10); ctx.closePath(); ctx.fill();
    planks(ctx, -L / 2, L / 2 + 2, top, 10, 4);
  }
  SIDE.kr = function (ctx, spec) {
    var sails = spec.sails, n = sails.length, L = 150, hull = A.hex(spec.hull);
    oarsSide(ctx, -L / 2 + 20, L / 2 - 20, -4, 7, 18);
    krHull(ctx, L, hull, -20);
    ctx.fillStyle = A.rgba(A.shade(hull, 0.85)); ctx.fillRect(-L / 2 - 6, -30, L + 12, 6);
    for (var i = 0; i < n; i++) mastSide(ctx, sails[i], n === 1 ? 0 : L * 0.22 - i * L * 0.44 / (n - 1), -24, i === 0 ? 70 : 84, spec, 0);
  };
  SIDE.panok = function (ctx, spec) {
    var sails = spec.sails, n = sails.length, L = 180, hull = A.hex(spec.hull);
    oarsSide(ctx, -L / 2 + 20, L / 2 - 20, -2, 10, 18);
    krHull(ctx, L, hull, -16);
    // 판옥 (위층 집)
    var hx0 = -L / 2 + 6, hx1 = L / 2 - 4;
    ctx.fillStyle = grad(ctx, 0, -48, 0, -18, A.mix('#b08a5a', hull, 0.3), 1.15, 0.8); ctx.fillRect(hx0, -46, hx1 - hx0, 28);
    ctx.fillStyle = '#1a1208'; for (var p = 0; p < 9; p++) ctx.fillRect(hx0 + 10 + p * (hx1 - hx0 - 20) / 8, -36, 5, 5);
    // 여장 (방패 담)
    ctx.fillStyle = A.rgba(A.shade(hull, 1.1)); ctx.fillRect(hx0 - 4, -52, hx1 - hx0 + 8, 6);
    for (var m = 0; m < 16; m++) ctx.fillRect(hx0 - 4 + m * (hx1 - hx0 + 8) / 16, -57, (hx1 - hx0) / 32, 5);
    // 장대 (지휘소)
    ctx.fillStyle = A.rgba(A.shade(hull, 0.95)); ctx.fillRect(-12, -70, 26, 14); ctx.fillStyle = '#5a1a14'; ctx.beginPath(); ctx.moveTo(-16, -70); ctx.lineTo(18, -70); ctx.lineTo(10, -76); ctx.lineTo(-8, -76); ctx.fill();
    ['#b3261e', '#c9a030', '#2a4f8a'].forEach(function (c, k) { var fx = -L / 2 + 20 + k * 60; ctx.strokeStyle = '#2b1d12'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(fx, -57); ctx.lineTo(fx, -82); ctx.stroke(); ctx.fillStyle = c; ctx.fillRect(fx, -82, 12, 8); });
    for (var i = 0; i < n; i++) mastSide(ctx, sails[i], n === 1 ? 0 : L * 0.3 - i * L * 0.56 / (n - 1), -52, i === 0 ? 62 : 74, spec, 0);
  };
  SIDE.turtle = function (ctx, spec) {
    var sails = spec.sails, n = sails.length, L = 170, hull = A.hex(spec.hull);
    oarsSide(ctx, -L / 2 + 22, L / 2 - 26, -2, 9, 18);
    krHull(ctx, L, hull, -16);
    // 덮개 (거북 등)
    ctx.save();
    ctx.beginPath(); ctx.moveTo(-L / 2 - 2, -18); ctx.quadraticCurveTo(-L / 2 + 20, -60, 0, -60); ctx.quadraticCurveTo(L / 2 - 16, -60, L / 2 - 4, -18); ctx.closePath();
    ctx.fillStyle = grad(ctx, 0, -62, 0, -18, '#4a4636', 1.25, 0.7); ctx.fill();
    ctx.clip();
    ctx.strokeStyle = 'rgba(210,190,130,.45)'; ctx.lineWidth = 1;
    for (var r = 0; r < 5; r++) for (var c2 = -8; c2 < 9; c2++) {
      var hx = c2 * 13 + (r % 2) * 6.5, hy = -58 + r * 10, hr = 6;
      ctx.beginPath(); for (var k = 0; k < 6; k++) { var a = k * Math.PI / 3; ctx[k ? 'lineTo' : 'moveTo'](hx + Math.cos(a) * hr, hy + Math.sin(a) * hr * 0.8); } ctx.closePath(); ctx.stroke();
    }
    ctx.restore();
    // 쇠못
    ctx.fillStyle = '#c8c0b0';
    for (var sI = 0; sI < 22; sI++) { var u = sI / 21, sx = -L / 2 + 8 + u * (L - 22), sy = -18 - Math.sin(u * Math.PI) * 40; ctx.beginPath(); ctx.moveTo(sx - 1.6, sy + 1); ctx.lineTo(sx, sy - 5); ctx.lineTo(sx + 1.6, sy + 1); ctx.fill(); }
    // 포구
    ctx.fillStyle = '#140e08'; for (var p = 0; p < 7; p++) ctx.fillRect(-L / 2 + 22 + p * 19, -26, 5, 5);
    // 용머리
    ctx.fillStyle = '#8a6a2a';
    ctx.beginPath(); ctx.moveTo(L / 2 - 8, -22); ctx.quadraticCurveTo(L / 2 + 6, -36, L / 2 + 22, -40); ctx.lineTo(L / 2 + 34, -36); ctx.lineTo(L / 2 + 24, -32); ctx.lineTo(L / 2 + 32, -28); ctx.lineTo(L / 2 + 16, -28); ctx.quadraticCurveTo(L / 2 + 6, -22, L / 2 - 2, -16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#b3261e'; ctx.beginPath(); ctx.moveTo(L / 2 + 24, -33); ctx.lineTo(L / 2 + 34, -32); ctx.lineTo(L / 2 + 24, -30); ctx.fill();
    ctx.fillStyle = '#f2e0a0'; ctx.beginPath(); ctx.arc(L / 2 + 20, -38, 1.8, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(200,200,200,.35)'; ctx.beginPath(); ctx.arc(L / 2 + 42, -34, 5, 0, 7); ctx.arc(L / 2 + 50, -37, 4, 0, 7); ctx.fill();
    for (var i = 0; i < n; i++) mastSide(ctx, sails[i], n === 1 ? 0 : L * 0.16 - i * L * 0.34 / (n - 1), -56, i === 0 ? 46 : 54, spec, 0);
  };
  function jpHull(ctx, L, hull, wallTop) {
    ctx.fillStyle = grad(ctx, 0, -18, 0, 10, hull, 1.4, 0.6);
    ctx.beginPath(); ctx.moveTo(-L / 2 - 4, -16); ctx.lineTo(L / 2 - 4, -16); ctx.lineTo(L / 2 + 18, -24); ctx.lineTo(L / 2 - 4, 8); ctx.lineTo(-L / 2 + 8, 8); ctx.closePath(); ctx.fill();
    // 판자 벽 (矢倉)
    ctx.fillStyle = grad(ctx, 0, wallTop, 0, -16, A.mix('#6a5040', hull, 0.4), 1.2, 0.8); ctx.fillRect(-L / 2 + 2, wallTop, L - 12, -16 - wallTop);
    ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 0.8;
    for (var x = -L / 2 + 8; x < L / 2 - 10; x += 7) { ctx.beginPath(); ctx.moveTo(x, wallTop); ctx.lineTo(x, -16); ctx.stroke(); }
    ctx.fillStyle = '#0e0a08'; for (var h = -L / 2 + 14; h < L / 2 - 16; h += 16) ctx.fillRect(h, (wallTop - 16) / 2 - 2, 4, 4);
  }
  SIDE.jp = function (ctx, spec) {
    var L = spec.big ? 170 : 130, hull = A.hex(spec.hull);
    oarsSide(ctx, -L / 2 + 16, L / 2 - 16, -2, spec.big ? 12 : 8, 18);
    jpHull(ctx, L, hull, -28);
    ctx.fillStyle = A.rgba(A.shade(hull, 1.2)); ctx.fillRect(-L / 2 + 2, -40, 30, 12); ctx.fillStyle = '#3a2e28'; ctx.fillRect(-L / 2 - 2, -44, 38, 5);
    mastSide(ctx, spec.sails[0] || 'sq', 6, -28, 84, spec, 0, 'jp');
    // 노보리 깃발
    ctx.fillStyle = '#f2ede0'; ctx.fillRect(-L / 2 + 4, -86, 5, 44); ctx.fillStyle = '#b3261e'; ctx.fillRect(-L / 2 + 4, -86, 5, 8);
  };
  SIDE.atake = function (ctx, spec) {
    var L = 190, hull = A.hex(spec.hull);
    oarsSide(ctx, -L / 2 + 16, L / 2 - 16, -2, 14, 18);
    jpHull(ctx, L, hull, -44);
    // 망루 (천수)
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(-40, -70, 60, 26);
    ctx.fillStyle = '#2a2420'; ctx.beginPath(); ctx.moveTo(-48, -70); ctx.lineTo(28, -70); ctx.lineTo(18, -80); ctx.lineTo(-38, -80); ctx.fill();
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(-26, -96, 32, 16);
    ctx.fillStyle = '#2a2420'; ctx.beginPath(); ctx.moveTo(-32, -96); ctx.lineTo(12, -96); ctx.lineTo(4, -106); ctx.lineTo(-24, -106); ctx.fill();
    ctx.fillStyle = '#0e0a08'; for (var w = 0; w < 5; w++) ctx.fillRect(-34 + w * 11, -62, 5, 6);
    mastSide(ctx, spec.sails[0] || 'sq', L * 0.26, -44, 76, spec, 0, 'jp');
    ctx.fillStyle = '#f2ede0'; ctx.fillRect(-L / 2 + 6, -96, 5, 50); ctx.fillRect(-L / 2 + 16, -90, 5, 44); ctx.fillStyle = '#b3261e'; ctx.fillRect(-L / 2 + 6, -96, 5, 8);
  };
  SIDE.raft = function (ctx, spec) {
    var L = 120, hull = A.hex(spec.hull);
    ctx.fillStyle = '#5a4020'; for (var b = 0; b < 4; b++) ctx.fillRect(-30 + b * 22, 4, 4, 16);             // 끼움판
    ctx.fillStyle = grad(ctx, 0, -8, 0, 8, hull, 1.25, 0.7); ctx.fillRect(-L / 2, -8, L, 14);
    ctx.strokeStyle = 'rgba(60,40,20,.5)'; ctx.lineWidth = 1; for (var r = 1; r < 3; r++) { ctx.beginPath(); ctx.moveTo(-L / 2, -8 + r * 4.6); ctx.lineTo(L / 2, -8 + r * 4.6); ctx.stroke(); }
    ctx.fillStyle = '#7a5a30'; ctx.fillRect(-L / 2 + 8, -24, 30, 16); ctx.fillStyle = '#b09050'; ctx.beginPath(); ctx.moveTo(-L / 2 + 4, -24); ctx.lineTo(-L / 2 + 23, -34); ctx.lineTo(-L / 2 + 42, -24); ctx.fill();
    ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(4, -8); ctx.lineTo(14, -78); ctx.lineTo(24, -8); ctx.stroke();
    sailSqSide(ctx, 14, -8, 72, spec.sail || '#e3d4a8', false);
  };
  SIDE.outrigger = function (ctx, spec) {
    var L = 170, hull = A.hex(spec.hull);
    // 부판과 받침대
    ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 2; for (var k = 0; k < 5; k++) { var bx = -L / 2 + 30 + k * 28; ctx.beginPath(); ctx.moveTo(bx, -10); ctx.lineTo(bx + 4, 8); ctx.stroke(); }
    ctx.fillStyle = '#4a3020'; ctx.beginPath(); ctx.ellipse(0, 8, L * 0.42, 3.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = grad(ctx, 0, -14, 0, 8, hull, 1.35, 0.6);
    ctx.beginPath(); ctx.moveTo(-L / 2 - 12, -26); ctx.quadraticCurveTo(-L / 2 + 10, -8, -L / 2 + 30, -9); ctx.lineTo(L / 2 - 30, -9); ctx.quadraticCurveTo(L / 2 - 10, -8, L / 2 + 12, -26);
    ctx.quadraticCurveTo(L / 2, 2, 0, 4); ctx.quadraticCurveTo(-L / 2, 2, -L / 2 - 12, -26); ctx.fill();
    // 노 젓는 사람들
    ctx.fillStyle = '#2a1a10'; for (var p = 0; p < 12; p++) { ctx.beginPath(); ctx.arc(-L / 2 + 32 + p * 10, -13, 2.2, 0, 7); ctx.fill(); }
    oarsSide(ctx, -L / 2 + 30, L / 2 - 30, -8, 12, 14);
    ctx.fillStyle = '#b09050'; ctx.fillRect(-26, -24, 44, 6);
    mastSide(ctx, spec.sails[0] || 'lat', 8, -18, 70, spec, 0);
  };

  // ================================================================ 옆모습 감싸기
  var westSide = A.shipSide;
  A.shipSide = function (ctx, x, y, s, spec, rng, dir) {
    spec = spec || {};
    var ht = spec.hullType;
    if (!ht || ht === 'west' || !SIDE[ht]) return westSide(ctx, x, y, s, spec, rng, dir);
    dir = dir || 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
    SIDE[ht](ctx, spec);
    ctx.restore();
  };

  // ================================================================ 위에서 본 모습 (지도·해전)
  function oarsTop(ctx, L, W, n, t, reach) {
    ctx.strokeStyle = 'rgba(58,38,22,.85)'; ctx.lineWidth = Math.max(0.8, L / 110);
    var sw = Math.sin(t * 3) * W * 0.25;
    for (var i = 0; i < n; i++) {
      var x = -L * 0.32 + i * L * 0.62 / Math.max(1, n - 1);
      ctx.beginPath(); ctx.moveTo(x, -W * 0.45); ctx.lineTo(x - sw, -W * 0.45 - W * reach); ctx.moveTo(x, W * 0.45); ctx.lineTo(x - sw, W * 0.45 + W * reach); ctx.stroke();
    }
  }
  function sailsTop(ctx, L, W, sails, spec, t, span0) {
    var ps = A.pose || {};
    ctx.save(); ctx.translate(-(ps.pitch || 0) * L * 0.12, -(ps.roll || 0) * W * 1.0);   // 기울면 돛대 끝이 그쪽으로
    sailsTopIn(ctx, L, W, sails, spec, t, span0);
    ctx.restore();
  }
  function sailsTopIn(ctx, L, W, sails, spec, t, span0) {
    var n = sails.length, sc = A.hex(spec.sail || '#f1e6cc');
    for (var i = 0; i < n; i++) {
      var mx = n === 1 ? L * 0.05 : L * 0.26 - i * (L * 0.58 / (n - 1)), kind = sails[i];
      var bil = W * (0.18 + 0.03 * Math.sin(t * 2.5 + i)), span = W * (span0 || 1.5);
      var fu = spec.furl || 0, sqk = kind !== 'lat' && kind !== 'lateen';
      ctx.save();
      if (fu > 0) { var ax = sqk ? mx - W * 0.08 : mx, ay = sqk ? 0 : W * 0.27; ctx.translate(ax, ay); ctx.scale(1 - 0.72 * fu, sqk ? 1 : 1 - 0.72 * fu); ctx.translate(-ax, -ay); bil *= 1 - 0.6 * fu; }
      ctx.strokeStyle = 'rgba(70,50,30,.6)'; ctx.lineWidth = Math.max(0.6, L / 140);
      if (kind === 'bat') {
        ctx.fillStyle = A.rgba(A.shade(sc, 0.95));
        ctx.beginPath(); ctx.moveTo(mx, -span * 0.45); ctx.quadraticCurveTo(mx - bil * 2.2, 0, mx, span * 0.45); ctx.lineTo(mx - W * 0.1, span * 0.42); ctx.quadraticCurveTo(mx - bil * 1.3, 0, mx - W * 0.1, -span * 0.42); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(40,20,10,.55)';
        for (var k = -3; k <= 3; k++) { var yy = k * span * 0.12; ctx.beginPath(); ctx.moveTo(mx, yy); ctx.lineTo(mx - bil * 1.6 * (1 - Math.abs(k) / 5) - W * 0.1, yy); ctx.stroke(); }
      } else if (kind === 'sq') {
        ctx.fillStyle = A.rgba(A.shade(sc, 1.0));
        ctx.beginPath(); ctx.moveTo(mx - W * 0.05, -span / 2); ctx.quadraticCurveTo(mx + bil * 2.2, 0, mx - W * 0.05, span / 2); ctx.lineTo(mx - W * 0.16, span / 2 * 0.96); ctx.quadraticCurveTo(mx + bil * 0.9, 0, mx - W * 0.16, -span / 2 * 0.96); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#3a2616'; ctx.lineWidth = Math.max(1, L / 90); ctx.beginPath(); ctx.moveTo(mx - W * 0.08, -span / 2 - W * 0.05); ctx.lineTo(mx - W * 0.08, span / 2 + W * 0.05); ctx.stroke();
      } else {
        var yl = W * 2.0;
        ctx.fillStyle = A.rgba(A.shade(sc, 0.96));
        ctx.beginPath(); ctx.moveTo(mx + yl * 0.35, -W * 0.08); ctx.quadraticCurveTo(mx - yl * 0.1, W * 0.55 + bil, mx - yl * 0.55, W * 0.62); ctx.lineTo(mx - yl * 0.45, W * 0.18); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#3a2616'; ctx.lineWidth = Math.max(1, L / 90); ctx.beginPath(); ctx.moveTo(mx + yl * 0.38, -W * 0.12); ctx.lineTo(mx - yl * 0.58, W * 0.66); ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = '#2a1a0e'; ctx.beginPath(); ctx.arc(mx, 0, Math.max(1.2, L / 55), 0, Math.PI * 2); ctx.fill();
    }
  }
  var TOP = {};
  function shadow(ctx, L, W) {
    var ps = A.pose || {};
    if (!ps.noWake) { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.moveTo(-L * 0.5, 0); ctx.lineTo(-L * 1.05, -W * 0.9); ctx.lineTo(-L * 1.05, W * 0.9); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,12,28,0.30)'; ctx.beginPath(); ctx.ellipse(L * 0.04, W * (0.35 - (ps.roll || 0) * 0.6), L * 0.54, W * 0.62, 0, 0, Math.PI * 2); ctx.fill();
  }
  function fillHull(ctx, path, hull, W, L) {
    var g = ctx.createLinearGradient(0, -W * 0.55, 0, W * 0.55);
    g.addColorStop(0, A.rgba(A.shade(hull, 1.35))); g.addColorStop(0.5, A.rgba(hull)); g.addColorStop(1, A.rgba(A.shade(hull, 0.55)));
    path(1); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(15,8,4,.8)'; ctx.lineWidth = Math.max(1, L / 60); ctx.stroke();
    var dark = hull[0] + hull[1] + hull[2] < 150;          // 검게 칠한 배(해적·일본 배)는 갑판도 어둡게
    path(0.84); ctx.fillStyle = A.rgba(A.mix('#b08a5a', hull, dark ? 0.6 : 0.25)); ctx.fill();
  }
  TOP.galley = function (ctx, L, W, spec, t) {
    W = L * 0.2; shadow(ctx, L, W);
    oarsTop(ctx, L, W, spec.big ? 12 : 9, t, 1.3);
    var hull = A.hex(spec.hull);
    fillHull(ctx, function (k) { ctx.beginPath(); ctx.moveTo(L * 0.52 * k, 0); ctx.quadraticCurveTo(L * 0.3, -W * 0.55 * k, -L * 0.3, -W * 0.5 * k); ctx.lineTo(-L * 0.48 * k, -W * 0.3 * k); ctx.lineTo(-L * 0.48 * k, W * 0.3 * k); ctx.lineTo(-L * 0.3, W * 0.5 * k); ctx.quadraticCurveTo(L * 0.3, W * 0.55 * k, L * 0.52 * k, 0); ctx.closePath(); }, hull, W, L);
    ctx.strokeStyle = '#3a2616'; ctx.lineWidth = Math.max(1.2, L / 60); ctx.beginPath(); ctx.moveTo(L * 0.5, 0); ctx.lineTo(L * 0.68, 0); ctx.stroke();   // 충각
    ctx.fillStyle = spec.cross ? '#8a2a1e' : '#2f5a3a'; ctx.fillRect(-L * 0.46, -W * 0.3, L * 0.14, W * 0.6);
    sailsTop(ctx, L, W * 1.3, spec.sails, spec, t);
  };
  TOP.outrigger = function (ctx, L, W, spec, t) {
    W = L * 0.16; shadow(ctx, L, W);
    ctx.strokeStyle = '#3a2616'; ctx.lineWidth = Math.max(1, L / 80);
    for (var k = 0; k < 4; k++) { var bx = -L * 0.25 + k * L * 0.17; ctx.beginPath(); ctx.moveTo(bx, -W * 2.2); ctx.lineTo(bx, W * 2.2); ctx.stroke(); }
    ctx.fillStyle = '#4a3020'; ctx.fillRect(-L * 0.32, -W * 2.4, L * 0.64, W * 0.4); ctx.fillRect(-L * 0.32, W * 2.0, L * 0.64, W * 0.4);
    oarsTop(ctx, L, W, 10, t, 1.1);
    fillHull(ctx, function (k) { ctx.beginPath(); ctx.moveTo(L * 0.55 * k, 0); ctx.quadraticCurveTo(0, -W * 0.7 * k, -L * 0.55 * k, 0); ctx.quadraticCurveTo(0, W * 0.7 * k, L * 0.55 * k, 0); ctx.closePath(); }, A.hex(spec.hull), W, L);
    ctx.fillStyle = '#b09050'; ctx.fillRect(-L * 0.12, -W * 0.5, L * 0.24, W);
    sailsTop(ctx, L, W * 2, spec.sails, spec, t);
  };
  function boxPath(ctx, L, W, bow) {
    return function (k) {
      ctx.beginPath();
      ctx.moveTo(L * 0.5 * k, -W * 0.3 * k); ctx.quadraticCurveTo(L * 0.5 * k + (bow || 0), 0, L * 0.5 * k, W * 0.3 * k);
      ctx.quadraticCurveTo(L * 0.3, W * 0.52 * k, -L * 0.2, W * 0.5 * k); ctx.lineTo(-L * 0.48 * k, W * 0.42 * k); ctx.lineTo(-L * 0.48 * k, -W * 0.42 * k); ctx.lineTo(-L * 0.2, -W * 0.5 * k);
      ctx.quadraticCurveTo(L * 0.3, -W * 0.52 * k, L * 0.5 * k, -W * 0.3 * k); ctx.closePath();
    };
  }
  TOP.junk = function (ctx, L, W, spec, t) {
    W = L * 0.4; shadow(ctx, L, W);
    var hull = A.hex(spec.hull);
    fillHull(ctx, boxPath(ctx, L, W, L * 0.04), hull, W, L);
    ctx.fillStyle = A.rgba(A.shade(hull, 0.85)); ctx.fillRect(-L * 0.47, -W * 0.36, L * 0.2, W * 0.72);
    ctx.fillStyle = '#7a2a1a'; ctx.fillRect(-L * 0.45, -W * 0.3, L * 0.16, W * 0.6);
    sailsTop(ctx, L, W, spec.sails, spec, t, 1.3);
  };
  TOP.kr = function (ctx, L, W, spec, t) {
    W = L * 0.4; shadow(ctx, L, W);
    oarsTop(ctx, L, W, 6, t, 0.6);
    fillHull(ctx, boxPath(ctx, L, W, L * 0.02), A.hex(spec.hull), W, L);
    sailsTop(ctx, L, W, spec.sails, spec, t, 1.3);
  };
  TOP.panok = function (ctx, L, W, spec, t) {
    W = L * 0.42; shadow(ctx, L, W);
    oarsTop(ctx, L, W, 8, t, 0.6);
    var hull = A.hex(spec.hull);
    fillHull(ctx, boxPath(ctx, L, W, L * 0.02), hull, W, L);
    ctx.fillStyle = A.rgba(A.mix('#c0a070', hull, 0.3)); ctx.fillRect(-L * 0.42, -W * 0.4, L * 0.82, W * 0.8);
    ctx.strokeStyle = A.rgba(A.shade(hull, 0.7)); ctx.lineWidth = Math.max(1, L / 50); ctx.strokeRect(-L * 0.42, -W * 0.4, L * 0.82, W * 0.8);
    ctx.fillStyle = '#5a1a14'; ctx.fillRect(-L * 0.08, -W * 0.14, L * 0.16, W * 0.28);
    sailsTop(ctx, L, W, spec.sails, spec, t, 1.3);
  };
  TOP.turtle = function (ctx, L, W, spec, t) {
    W = L * 0.4; shadow(ctx, L, W);
    oarsTop(ctx, L, W, 8, t, 0.6);
    fillHull(ctx, boxPath(ctx, L, W, L * 0.02), A.hex(spec.hull), W, L);
    ctx.save(); ctx.beginPath(); ctx.ellipse(-L * 0.02, 0, L * 0.44, W * 0.44, 0, 0, 7); ctx.fillStyle = '#4a4636'; ctx.fill(); ctx.clip();
    ctx.strokeStyle = 'rgba(210,190,130,.5)'; ctx.lineWidth = Math.max(0.6, L / 140);
    var hr = L * 0.06;
    for (var r = -3; r <= 3; r++) for (var c = -6; c <= 6; c++) {
      var hx = c * hr * 1.75 + (r % 2 ? hr * 0.87 : 0), hy = r * hr * 1.5;
      ctx.beginPath(); for (var k = 0; k < 6; k++) { var a = k * Math.PI / 3 + Math.PI / 6; ctx[k ? 'lineTo' : 'moveTo'](hx + Math.cos(a) * hr, hy + Math.sin(a) * hr); } ctx.closePath(); ctx.stroke();
      ctx.fillStyle = '#c8c0b0'; ctx.fillRect(hx - 0.8, hy - 0.8, 1.6, 1.6);
    }
    ctx.restore();
    ctx.fillStyle = '#8a6a2a'; ctx.beginPath(); ctx.moveTo(L * 0.42, -W * 0.12); ctx.lineTo(L * 0.62, 0); ctx.lineTo(L * 0.42, W * 0.12); ctx.fill();   // 용머리
    sailsTop(ctx, L, W, spec.sails, spec, t, 1.0);
  };
  TOP.jp = function (ctx, L, W, spec, t) {
    W = L * 0.34; shadow(ctx, L, W);
    oarsTop(ctx, L, W, spec.big ? 9 : 6, t, 0.7);
    var hull = A.hex(spec.hull);
    fillHull(ctx, function (k) { ctx.beginPath(); ctx.moveTo(L * 0.58 * k, 0); ctx.lineTo(L * 0.3, -W * 0.5 * k); ctx.lineTo(-L * 0.48 * k, -W * 0.46 * k); ctx.lineTo(-L * 0.48 * k, W * 0.46 * k); ctx.lineTo(L * 0.3, W * 0.5 * k); ctx.closePath(); }, hull, W, L);
    ctx.strokeStyle = A.rgba(A.mix('#6a5040', hull, 0.4)); ctx.lineWidth = Math.max(1.4, L / 34); ctx.strokeRect(-L * 0.42, -W * 0.4, L * 0.7, W * 0.8);
    sailsTop(ctx, L, W, spec.sails, spec, t, 1.6);
  };
  TOP.atake = function (ctx, L, W, spec, t) {
    W = L * 0.4; shadow(ctx, L, W);
    oarsTop(ctx, L, W, 10, t, 0.6);
    var hull = A.hex(spec.hull);
    fillHull(ctx, function (k) { ctx.beginPath(); ctx.moveTo(L * 0.56 * k, 0); ctx.lineTo(L * 0.34, -W * 0.5 * k); ctx.lineTo(-L * 0.48 * k, -W * 0.48 * k); ctx.lineTo(-L * 0.48 * k, W * 0.48 * k); ctx.lineTo(L * 0.34, W * 0.5 * k); ctx.closePath(); }, hull, W, L);
    ctx.fillStyle = A.rgba(A.mix('#6a5040', hull, 0.3)); ctx.fillRect(-L * 0.44, -W * 0.44, L * 0.8, W * 0.88);
    ctx.fillStyle = '#2a2420'; ctx.fillRect(-L * 0.24, -W * 0.3, L * 0.3, W * 0.6); ctx.fillStyle = '#e8e0d0'; ctx.fillRect(-L * 0.18, -W * 0.16, L * 0.18, W * 0.32);
    sailsTop(ctx, L, W, spec.sails, spec, t, 1.6);
  };
  TOP.raft = function (ctx, L, W, spec, t) {
    W = L * 0.42; shadow(ctx, L, W);
    ctx.fillStyle = A.rgba(A.hex(spec.hull)); ctx.fillRect(-L * 0.45, -W * 0.5, L * 0.95, W);
    ctx.strokeStyle = 'rgba(60,40,20,.6)'; ctx.lineWidth = Math.max(0.6, L / 120);
    for (var i = 1; i < 7; i++) { var y = -W * 0.5 + W * i / 7; ctx.beginPath(); ctx.moveTo(-L * 0.45, y); ctx.lineTo(L * 0.5, y); ctx.stroke(); }
    ctx.fillStyle = '#b09050'; ctx.fillRect(-L * 0.36, -W * 0.25, L * 0.24, W * 0.5);
    sailsTop(ctx, L, W, spec.sails, spec, t, 1.4);
  };
  TOP.dhow = null; TOP.jong = null;     // 서양 배와 같은 모양으로 그린다

  var westTop = A.shipTop;
  A.shipTop = function (ctx, x, y, ang, len, spec, t) {
    spec = spec || {};
    var ht = spec.hullType, fn = ht && TOP[ht];
    if (!fn) return westTop(ctx, x, y, ang, len, spec, t);
    t = t || 0;
    A.pose = spec.pose || null; if (A.pose) A.pose.noWake = !!spec.noWake;
    ctx.save(); ctx.translate(x, y); ctx.rotate(-ang);
    if (spec.pose) { var ps = spec.pose, hv = 1 + (ps.heave || 0); ctx.scale(hv, hv * (1 - Math.abs(ps.roll || 0) * 0.35)); }
    fn(ctx, len, len * 0.34, spec, t);
    A.pose = null;
    if (spec.flag) { ctx.fillStyle = spec.flag; ctx.beginPath(); ctx.moveTo(-len * 0.47, -len * 0.02); ctx.lineTo(-len * 0.62, -len * 0.06 + Math.sin(t * 6) * len * 0.02); ctx.lineTo(-len * 0.47, len * 0.04); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  };
})(window.G = window.G || {});
