/* 자택 장면 그림 (G.HomeArt) — 아이와 보내는 시간·집안일의 배경 그림. 대화하는 사람(아이의 무릎상) 뒤에 액자처럼 걸린다.
   · 기본은 코드로 그린다(Canvas 2D). images/events/home/<이름>.webp (또는 .png, 900×520) 를 넣으면 그 그림으로 바뀐다 — 이름은 HA.NAMES.
   · 가운데에는 아이가 서므로, 볼거리는 왼쪽·오른쪽에 둔다.
   · 쓰는 법: var h = G.HomeArt.show('yard', {title}); … await h.stop();   도감·시험: G.HomeArt.canvas('yard')
   조정값: G.FX.homeArt (w·h·top) */
(function (G) {
  'use strict';
  var HA = G.HomeArt = {};
  function C() { return (G.FX && G.FX.homeArt) || { w: 900, h: 520, top: 78 }; }
  var INK = '#3a2616';
  function rnd(seed) { var s = seed || 1; return function () { s = (s * 16807) % 2147483647; return (s & 0xffff) / 0x10000; }; }
  function lin(g, x0, y0, x1, y1, stops) { var gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(function (c, i) { gr.addColorStop(i / (stops.length - 1), c); }); return gr; }
  function glow(g, x, y, r, col) { var gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  function box(g, x, y, w, h, fill, noLine) { g.fillStyle = fill; g.fillRect(x, y, w, h); if (!noLine) { g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(x, y, w, h); } }
  function poly(g, pts, fill, noLine) { g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (!noLine) { g.strokeStyle = INK; g.lineWidth = 2; g.stroke(); } }
  function disc(g, x, y, r, fill, noLine) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = fill; g.fill(); if (!noLine) { g.strokeStyle = INK; g.lineWidth = 2; g.stroke(); } }
  function oval(g, x, y, rx, ry, fill, noLine) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fillStyle = fill; g.fill(); if (!noLine) { g.strokeStyle = INK; g.lineWidth = 2; g.stroke(); } }
  function line(g, pts, col, w) { g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.strokeStyle = col || INK; g.lineWidth = w || 2; g.stroke(); }

  // ---------------------------------------------------------------- 배경 조각
  /** 방: 벽·마루·굽도리 */
  function room(g, W, H, wall, floor, fy) {
    fy = fy || H * 0.68;
    g.fillStyle = lin(g, 0, 0, 0, fy, wall); g.fillRect(0, 0, W, fy);
    g.fillStyle = lin(g, 0, fy, 0, H, floor); g.fillRect(0, fy, W, H - fy);
    g.strokeStyle = 'rgba(40,24,10,.28)'; g.lineWidth = 1.5;
    for (var i = -6; i <= 16; i++) line(g, [[W / 2 + (i - 5) * 46, fy], [W / 2 + (i - 5) * 150, H]], 'rgba(40,24,10,.25)', 1.5);
    box(g, 0, fy - 10, W, 12, '#5d4127');
    return fy;
  }
  /** 창: 아치 창틀 안에 하늘(낮·밤·비)과 바다 */
  function win(g, x, y, w, h, o) {
    o = o || {};
    g.save();
    g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath(); g.clip();
    g.fillStyle = lin(g, 0, y, 0, y + h, o.sky || ['#8fb6d6', '#e8d9b0']); g.fillRect(x, y, w, h);
    if (o.stars) { var r = rnd(7); g.fillStyle = '#fff6d0'; for (var i = 0; i < 26; i++) g.fillRect(x + r() * w, y + r() * h * 0.7, 2, 2); }
    if (o.moon) { disc(g, x + w * 0.68, y + h * 0.28, w * 0.11, '#fbf1c4', true); disc(g, x + w * 0.73, y + h * 0.25, w * 0.1, o.sky ? o.sky[0] : '#1b2748', true); }
    if (o.sea !== false) { g.fillStyle = o.seaCol || '#4f86a0'; g.fillRect(x, y + h * 0.66, w, h * 0.34); g.fillStyle = 'rgba(255,255,255,.35)'; for (var k = 0; k < 4; k++) g.fillRect(x + 8 + k * w * 0.22, y + h * (0.72 + k * 0.06), w * 0.16, 2); }
    if (o.ship) { poly(g, [[x + w * 0.3, y + h * 0.66], [x + w * 0.52, y + h * 0.66], [x + w * 0.48, y + h * 0.7], [x + w * 0.33, y + h * 0.7]], '#3b2715', true); poly(g, [[x + w * 0.4, y + h * 0.5], [x + w * 0.5, y + h * 0.64], [x + w * 0.4, y + h * 0.64]], '#f4ead0', true); }
    if (o.rain) { g.strokeStyle = 'rgba(230,240,255,.55)'; g.lineWidth = 1.5; var rr = rnd(3); for (var j = 0; j < 40; j++) { var rx = x + rr() * w, ry = y + rr() * h; g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx - 5, ry + 14); g.stroke(); } }
    g.restore();
    g.strokeStyle = '#4a321d'; g.lineWidth = 8;
    g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath(); g.stroke();
    g.lineWidth = 4; line(g, [[x + w / 2, y], [x + w / 2, y + h]], '#4a321d', 4); line(g, [[x, y + h * 0.5], [x + w, y + h * 0.5]], '#4a321d', 4);
    box(g, x - 10, y + h, w + 20, 10, '#6a4a2c');
  }
  function table(g, x, y, w, h, col) {
    box(g, x + 14, y + 12, 14, h, '#4f361f'); box(g, x + w - 28, y + 12, 14, h, '#4f361f');
    poly(g, [[x, y + 14], [x + 18, y], [x + w - 18, y], [x + w, y + 14]], col || '#8a6238');
    box(g, x, y + 14, w, 12, '#6f4d2b');
  }
  function candle(g, x, y) { glow(g, x, y - 20, 90, 'rgba(255,214,130,.45)'); box(g, x - 5, y - 8, 10, 30, '#f2e6c6'); g.beginPath(); g.ellipse(x, y - 16, 5, 10, 0, 0, 7); g.fillStyle = '#ffd35a'; g.fill(); box(g, x - 12, y + 22, 24, 6, '#b08a3c'); }
  /** 바깥: 하늘·바다(또는 땅) */
  function outdoor(g, W, H, sky, hy, low) {
    g.fillStyle = lin(g, 0, 0, 0, hy, sky); g.fillRect(0, 0, W, hy);
    g.fillStyle = lin(g, 0, hy, 0, H, low); g.fillRect(0, hy, W, H - hy);
  }
  function seaLines(g, W, y0, y1) { g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 2; var r = rnd(11); for (var y = y0; y < y1; y += 14) { var x = r() * 80; while (x < W) { var l = 30 + r() * 60; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y); g.stroke(); x += l + 40 + r() * 90; } } }
  function stars(g, W, H, n, seed) { var r = rnd(seed || 5); for (var i = 0; i < n; i++) { var s = r() < 0.12 ? 3 : r() < 0.4 ? 2 : 1.3; g.fillStyle = 'rgba(255,246,214,' + (0.5 + r() * 0.5) + ')'; g.fillRect(r() * W, r() * H, s, s); } }
  function sun(g, x, y, r, col) { glow(g, x, y, r * 4, 'rgba(255,200,120,.5)'); disc(g, x, y, r, col || '#ffd98a', true); }
  function boat(g, x, y, s, hull, sail) {
    poly(g, [[x - 60 * s, y], [x + 64 * s, y], [x + 46 * s, y + 20 * s], [x - 44 * s, y + 20 * s]], hull || '#5a3b20');
    line(g, [[x, y], [x, y - 86 * s]], INK, 3);
    poly(g, [[x + 4 * s, y - 82 * s], [x + 50 * s, y - 12 * s], [x + 4 * s, y - 12 * s]], sail || '#f6ecd2');
    poly(g, [[x - 4 * s, y - 70 * s], [x - 40 * s, y - 12 * s], [x - 4 * s, y - 12 * s]], sail || '#f6ecd2');
  }
  function planks(g, x, y, w, h, col) { box(g, x, y, w, h, col || '#8a6238'); for (var i = 1; i < 6; i++) line(g, [[x, y + h * i / 6], [x + w, y + h * i / 6]], 'rgba(40,24,10,.3)', 1.5); }
  function barrel(g, x, y, w, h) { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - w * 0.14, y + h / 2, x, y + h); g.lineTo(x + w, y + h); g.quadraticCurveTo(x + w * 1.14, y + h / 2, x + w, y); g.closePath(); g.fillStyle = '#8a5f33'; g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke(); [0.2, 0.8].forEach(function (t) { line(g, [[x - w * 0.05, y + h * t], [x + w * 1.05, y + h * t]], '#3d2a16', 5); }); }
  function book(g, x, y, w, h) {
    poly(g, [[x, y + h * 0.2], [x + w / 2, y + h * 0.32], [x + w / 2, y + h], [x, y + h * 0.86]], '#f4ead0'); poly(g, [[x + w, y + h * 0.2], [x + w / 2, y + h * 0.32], [x + w / 2, y + h], [x + w, y + h * 0.86]], '#efe2c2');
    for (var i = 0; i < 5; i++) { line(g, [[x + 10, y + h * (0.36 + i * 0.1)], [x + w / 2 - 10, y + h * (0.45 + i * 0.1)]], 'rgba(58,38,22,.5)', 1.5); line(g, [[x + w - 10, y + h * (0.36 + i * 0.1)], [x + w / 2 + 10, y + h * (0.45 + i * 0.1)]], 'rgba(58,38,22,.5)', 1.5); }
  }
  function quill(g, x, y) { box(g, x - 12, y, 24, 20, '#2c2a36'); g.beginPath(); g.moveTo(x, y + 4); g.quadraticCurveTo(x + 50, y - 50, x + 34, y - 96); g.quadraticCurveTo(x + 10, y - 50, x, y + 4); g.fillStyle = '#f7f1e2'; g.fill(); g.strokeStyle = INK; g.lineWidth = 1.5; g.stroke(); }
  function pot(g, x, y, s) { poly(g, [[x - 22 * s, y], [x + 22 * s, y], [x + 16 * s, y + 34 * s], [x - 16 * s, y + 34 * s]], '#b5653a'); for (var i = -2; i <= 2; i++) { g.beginPath(); g.ellipse(x + i * 10 * s, y - 20 * s - Math.abs(i) * -4, 9 * s, 24 * s, i * 0.3, 0, 7); g.fillStyle = i % 2 ? '#4f8a45' : '#3f7339'; g.fill(); } }
  function hearth(g, x, y, w, h) { box(g, x, y, w, h, '#7a6a58'); box(g, x + 16, y + 26, w - 32, h - 26, '#1f1611'); glow(g, x + w / 2, y + h - 20, w * 0.9, 'rgba(255,150,60,.5)'); for (var i = 0; i < 3; i++) { g.beginPath(); g.ellipse(x + w / 2 + (i - 1) * 16, y + h - 26, 9, 26 - i * 4, 0, 0, 7); g.fillStyle = ['#ffb347', '#ffd35a', '#ff8a3c'][i]; g.fill(); } box(g, x - 10, y - 12, w + 20, 14, '#5d4d3d'); }
  function finish(g, W, H, night) {
    var v = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, night ? 'rgba(6,8,20,.55)' : 'rgba(40,22,8,.42)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
  }

  // ---------------------------------------------------------------- 장면
  var WARM = ['#d9c39a', '#c4a877'], WOODF = ['#8d6a42', '#6c4d2c'], NIGHTW = ['#2d2b45', '#3c3350'], NIGHTF = ['#3a2c2c', '#241a1c'];
  var DRAW = {
    /* 마당의 대야와 장난감 배 */
    yard: function (g, W, H) {
      outdoor(g, W, H, ['#9cc4dc', '#f1e3bd'], H * 0.5, ['#c9b48a', '#a98f62']);
      box(g, 0, H * 0.22, W, H * 0.3, '#e6d6b2'); for (var i = 0; i < 9; i++) box(g, i * 110 - 20, H * 0.18, 90, 22, '#b9603c');
      line(g, [[40, H * 0.3], [W - 40, H * 0.26]], '#5a4630', 2); [[120, '#f4ead0'], [200, '#c8553d'], [700, '#f4ead0'], [780, '#5f86a8']].forEach(function (c) { box(g, c[0], H * 0.3 - (c[0] > 400 ? 12 : 2), 56, 70, c[1]); });
      oval(g, 190, H * 0.86, 170, 46, '#6f4d2b'); oval(g, 190, H * 0.74, 170, 46, '#7fb2c8'); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.beginPath(); g.ellipse(170, H * 0.74, 70, 16, 0, 0, 7); g.stroke();
      line(g, [[20, H * 0.74], [20, H * 0.86]], INK, 2); line(g, [[360, H * 0.74], [360, H * 0.86]], INK, 2);
      boat(g, 200, H * 0.71, 0.75, '#a0522d', '#fff8e6');
      pot(g, 730, H * 0.72, 1.4); pot(g, 820, H * 0.78, 1);
    },
    /* 해 질 녘의 부두 */
    harbor: function (g, W, H) {
      outdoor(g, W, H, ['#f2a65a', '#f6d79a'], H * 0.56, ['#5b8fa8', '#2f5f7a']);
      sun(g, W * 0.72, H * 0.5, 34, '#ffe2a0'); seaLines(g, W, H * 0.6, H * 0.84);
      boat(g, 150, H * 0.52, 1.5, '#3b2715', '#fbe9c6'); boat(g, 760, H * 0.55, 0.8, '#3b2715', '#f1dcb4');
      planks(g, 0, H * 0.82, W, H * 0.2, '#7a5632'); [60, 300, 600, 840].forEach(function (x) { box(g, x, H * 0.72, 18, 60, '#4f361f'); });
      g.strokeStyle = '#33261a'; g.lineWidth = 2; [[420, 90], [470, 70], [520, 100], [250, 60]].forEach(function (p) { g.beginPath(); g.moveTo(p[0] - 12, p[1]); g.quadraticCurveTo(p[0] - 6, p[1] - 8, p[0], p[1]); g.quadraticCurveTo(p[0] + 6, p[1] - 8, p[0] + 12, p[1]); g.stroke(); });
    },
    /* 그림 그리는 탁자 */
    drawing: function (g, W, H, o) {
      var fy = room(g, W, H, WARM, WOODF);
      win(g, 640, 60, 170, 230, { ship: true });
      box(g, 90, 80, 150, 110, '#f4ead0'); boat(g, 165, 160, 0.5, '#7a4a2a', '#c8553d'); g.fillStyle = '#5f86a8'; g.fillRect(96, 172, 138, 12); disc(g, 215, 100, 12, '#f2b632', true);
      table(g, 60, fy - 40, 340, 120);
      poly(g, [[110, fy - 44], [250, fy - 52], [262, fy - 22], [120, fy - 16]], '#fbf4df'); line(g, [[140, fy - 36], [180, fy - 30], [210, fy - 40]], '#5a4630', 3);
      [[290, '#3a3a3a'], [312, '#a0522d'], [334, '#c8553d']].forEach(function (c) { box(g, c[0], fy - 34, 14, 8, c[1]); });
      if (o && o.shell) { g.strokeStyle = '#8a6f4a'; g.lineWidth = 2; g.beginPath(); g.ellipse(700, fy + 40, 70, 26, 0, 0, 7); g.stroke(); for (var i = 0; i < 9; i++) { var a = i / 9 * 6.283; disc(g, 700 + Math.cos(a) * 70, fy + 40 + Math.sin(a) * 26, 9, i % 2 ? '#f6d9c6' : '#fff3e0'); } }
    },
    shell: function (g, W, H) { DRAW.drawing(g, W, H, { shell: true }); },
    /* 밤의 침실 */
    night: function (g, W, H) {
      var fy = room(g, W, H, NIGHTW, NIGHTF);
      win(g, 640, 50, 180, 240, { sky: ['#1b2748', '#3b4a78'], stars: true, moon: true, seaCol: '#22395a' });
      g.fillStyle = 'rgba(200,215,255,.12)'; poly(g, [[640, 290], [820, 290], [900, H], [520, H]], 'rgba(200,215,255,.12)', true);
      box(g, 60, fy - 110, 26, 150, '#4f361f'); box(g, 330, fy - 70, 22, 110, '#4f361f'); box(g, 70, fy - 30, 270, 60, '#6f4d2b');
      poly(g, [[86, fy - 50], [330, fy - 50], [330, fy - 10], [86, fy - 10]], '#b9603c'); oval(g, 120, fy - 56, 40, 16, '#f4ead0');
      candle(g, 420, fy - 60); box(g, 396, fy - 30, 48, 70, '#5a3f25');
    },
    /* 마당의 목검과 허수아비 */
    swords: function (g, W, H, o) {
      outdoor(g, W, H, ['#a9c9dd', '#efe1bb'], H * 0.52, ['#c2ab7e', '#9d8356']);
      box(g, 0, H * 0.26, W, H * 0.28, '#e2d2ad'); for (var i = 0; i < 9; i++) box(g, i * 110 - 30, H * 0.22, 92, 22, '#b9603c');
      var st = o && o.steel;
      g.save(); g.translate(170, H * 0.62); g.rotate(-0.6); box(g, -6, -150, 12, 190, st ? '#cfd6dc' : '#b98a4e'); box(g, -24, 34, 48, 10, st ? '#b08a3c' : '#7a5632'); g.restore();
      g.save(); g.translate(230, H * 0.62); g.rotate(0.6); box(g, -6, -150, 12, 190, st ? '#dfe5ea' : '#c79a5c'); box(g, -24, 34, 48, 10, st ? '#b08a3c' : '#7a5632'); g.restore();
      box(g, 742, H * 0.42, 16, 210, '#6f4d2b'); box(g, 680, H * 0.5, 140, 14, '#6f4d2b'); oval(g, 750, H * 0.4, 34, 38, '#d9b56a'); poly(g, [[700, H * 0.52], [800, H * 0.52], [786, H * 0.76], [714, H * 0.76]], '#c9a45c');
      line(g, [[736, H * 0.38], [744, H * 0.39]], INK, 3); line(g, [[756, H * 0.39], [764, H * 0.38]], INK, 3);
    },
    duel: function (g, W, H) { DRAW.swords(g, W, H, { steel: true }); },
    /* 서재의 해도 */
    chart: function (g, W, H) {
      var fy = room(g, W, H, ['#b99d6e', '#9c7f52'], WOODF);
      for (var r = 0; r < 3; r++) { box(g, 640, 60 + r * 78, 220, 70, '#5a3f25'); for (var b = 0; b < 9; b++) box(g, 648 + b * 23, 68 + r * 78 + (b % 3) * 4, 19, 58 - (b % 3) * 4, ['#7a2f2a', '#2f4f6a', '#5a6a2f', '#8a6a2c'][(b + r) % 4]); }
      table(g, 40, fy - 30, 420, 120);
      poly(g, [[70, fy - 60], [400, fy - 70], [430, fy - 6], [90, fy + 2]], '#f1e3bd');
      g.strokeStyle = '#6b5234'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(120, fy - 44); g.bezierCurveTo(170, fy - 20, 190, fy - 50, 240, fy - 30); g.bezierCurveTo(280, fy - 14, 300, fy - 40, 350, fy - 46); g.stroke();
      g.setLineDash([6, 6]); line(g, [[140, fy - 14], [230, fy - 20], [330, fy - 28], [390, fy - 50]], '#a33a2a', 2); g.setLineDash([]);
      disc(g, 376, fy - 22, 18, 'rgba(0,0,0,0)'); line(g, [[376, fy - 44], [376, fy]], INK, 1.5); line(g, [[354, fy - 22], [398, fy - 22]], INK, 1.5);
      candle(g, 500, fy - 70); box(g, 476, fy - 40, 48, 80, '#5a3f25');
      disc(g, 750, fy + 20, 46, '#5f86a8'); g.fillStyle = '#7a9a5a'; g.beginPath(); g.ellipse(738, fy + 10, 20, 26, 0.4, 0, 7); g.fill(); box(g, 742, fy + 66, 16, 30, '#5a3f25');
    },
    /* 새벽 부두의 낚시 */
    pier: function (g, W, H) {
      outdoor(g, W, H, ['#b7c9d8', '#f3d9b0'], H * 0.46, ['#6f9db0', '#3d6e86']);
      sun(g, W * 0.2, H * 0.44, 26, '#fff0c0'); seaLines(g, W, H * 0.5, H * 0.8);
      planks(g, 0, H * 0.8, W, H * 0.22, '#7a5632'); [80, 380, 700].forEach(function (x) { box(g, x, H * 0.7, 18, 60, '#4f361f'); });
      line(g, [[130, H * 0.8], [330, H * 0.3]], '#5a3f25', 4); line(g, [[330, H * 0.3], [350, H * 0.62]], 'rgba(40,30,20,.6)', 1.2); disc(g, 350, H * 0.62, 6, '#c8553d');
      line(g, [[770, H * 0.8], [620, H * 0.36]], '#5a3f25', 4); line(g, [[620, H * 0.36], [600, H * 0.66]], 'rgba(40,30,20,.6)', 1.2); disc(g, 600, H * 0.66, 6, '#f2b632');
      barrel(g, 800, H * 0.68, 50, 64); g.fillStyle = '#9fb7c2'; g.beginPath(); g.ellipse(825, H * 0.69, 22, 7, 0, 0, 7); g.fill();
    },
    /* 책과 깃펜 */
    book: function (g, W, H) {
      var fy = room(g, W, H, WARM, WOODF);
      win(g, 660, 50, 170, 230, {});
      table(g, 40, fy - 30, 400, 120);
      book(g, 100, fy - 96, 220, 90); quill(g, 370, fy - 40);
      box(g, 90, 70, 190, 130, '#f4ead0'); g.fillStyle = INK; g.font = '700 34px serif'; g.fillText('A B C', 112, 120); g.font = '700 28px serif'; g.fillText('a b c d', 112, 166);
    },
    /* 시장 좌판 */
    market: function (g, W, H) {
      outdoor(g, W, H, ['#a7c8de', '#f1e3bd'], H * 0.5, ['#c9b48a', '#a98f62']);
      box(g, 0, H * 0.2, W, H * 0.34, '#e6d6b2');
      [[30, '#c8553d'], [600, '#3f6f8f']].forEach(function (s) {
        var x = s[0]; for (var i = 0; i < 6; i++) poly(g, [[x + i * 46, H * 0.3], [x + i * 46 + 46, H * 0.3], [x + i * 46 + 40, H * 0.44], [x + i * 46 + 6, H * 0.44]], i % 2 ? '#f4ead0' : s[1]);
        box(g, x + 4, H * 0.44, 10, 150, '#5a3f25'); box(g, x + 262, H * 0.44, 10, 150, '#5a3f25'); planks(g, x - 6, H * 0.68, 288, 70, '#8a6238');
      });
      disc(g, 90, H * 0.64, 16, '#f0c9a0'); poly(g, [[70, H * 0.68], [110, H * 0.68], [118, H * 0.6], [62, H * 0.6]], '#c8553d');
      poly(g, [[170, H * 0.6], [200, H * 0.6], [185, H * 0.68]], '#f2b632'); line(g, [[185, H * 0.56], [185, H * 0.6]], INK, 3);
      poly(g, [[240, H * 0.62], [290, H * 0.62], [296, H * 0.56], [282, H * 0.56], [278, H * 0.5], [268, H * 0.56], [240, H * 0.56]], '#a0522d');
      [0, 1, 2, 3, 4].forEach(function (i) { disc(g, 640 + i * 46, H * 0.65, 15, ['#e8a23a', '#c8553d', '#8fae4b', '#e8a23a', '#c8553d'][i]); });
    },
    /* 난롯가의 체스판 */
    chess: function (g, W, H) {
      var fy = room(g, W, H, ['#a98862', '#8b6c48'], ['#6f4d2b', '#4f361f']);
      hearth(g, 640, fy - 190, 200, 190);
      table(g, 60, fy - 20, 360, 110);
      poly(g, [[110, fy - 16], [150, fy - 66], [330, fy - 66], [370, fy - 16]], '#e9dcc0');
      for (var r = 0; r < 4; r++) for (var c = 0; c < 6; c++) if ((r + c) % 2) { var y0 = fy - 66 + r * 12.5, y1 = y0 + 12.5, k0 = (y0 - (fy - 66)) / 50, k1 = (y1 - (fy - 66)) / 50, xa = function (k, cc) { return 150 - 40 * k + cc * (180 + 80 * k) / 6; }; poly(g, [[xa(k0, c), y0], [xa(k0, c + 1), y0], [xa(k1, c + 1), y1], [xa(k1, c), y1]], '#4a3523', true); }
      [[170, fy - 60, '#f4ead0'], [230, fy - 46, '#2a1d14'], [300, fy - 56, '#f4ead0'], [200, fy - 28, '#2a1d14'], [320, fy - 30, '#f4ead0']].forEach(function (p) { box(g, p[0] - 5, p[1] - 22, 10, 22, p[2]); disc(g, p[0], p[1] - 26, 7, p[2]); });
    },
    /* 밤하늘과 사분의 */
    stars: function (g, W, H) {
      g.fillStyle = lin(g, 0, 0, 0, H, ['#0e1530', '#27365f', '#3d4a70']); g.fillRect(0, 0, W, H);
      stars(g, W, H * 0.74, 150, 9);
      glow(g, 700, 90, 40, 'rgba(255,246,214,.7)'); disc(g, 700, 90, 5, '#fffbe6', true);
      g.setLineDash([4, 6]); line(g, [[700, 90], [620, 150], [560, 140], [500, 190], [430, 180]], 'rgba(255,246,214,.5)', 1.5); g.setLineDash([]);
      g.fillStyle = '#1a2238'; g.fillRect(0, H * 0.74, W, H * 0.3); box(g, 0, H * 0.72, W, 14, '#4a3b2c'); for (var i = 0; i < 12; i++) box(g, 30 + i * 78, H * 0.75, 12, H * 0.25, '#3a2f24');
      g.save(); g.translate(170, H * 0.7); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -130); g.arc(0, 0, 130, -Math.PI / 2, 0); g.closePath(); g.fillStyle = '#b08a3c'; g.fill(); g.strokeStyle = '#3a2616'; g.lineWidth = 2; g.stroke();
      for (var a = 0; a <= 9; a++) { var t = -Math.PI / 2 + a * Math.PI / 18; line(g, [[Math.cos(t) * 112, Math.sin(t) * 112], [Math.cos(t) * 130, Math.sin(t) * 130]], '#3a2616', 1.5); }
      line(g, [[0, -130], [40, -40]], '#e8dcc0', 1.5); disc(g, 40, -40, 6, '#8a8f98'); g.restore();
    },
    /* 장부와 금화 */
    ledger: function (g, W, H) {
      var fy = room(g, W, H, ['#b99d6e', '#9c7f52'], WOODF);
      win(g, 660, 50, 170, 230, { ship: true });
      table(g, 40, fy - 30, 420, 120);
      book(g, 80, fy - 100, 220, 92); quill(g, 330, fy - 42);
      [[380, 5], [410, 8], [440, 3]].forEach(function (c) { for (var i = 0; i < c[1]; i++) oval(g, c[0], fy - 36 - i * 7, 15, 6, '#e3b84a'); });
      box(g, 700, fy - 10, 130, 80, '#6a4a2c'); box(g, 700, fy - 30, 130, 24, '#7d5a36'); box(g, 756, fy + 4, 18, 22, '#b08a3c');
    },
    /* 바다가 보이는 창 */
    window: function (g, W, H) {
      var fy = room(g, W, H, WARM, WOODF);
      win(g, 70, 40, 250, 300, { ship: true, sky: ['#7fa6c4', '#f0d8a8'] });
      poly(g, [[40, 30], [90, 30], [70, 350], [30, 350]], '#8a3b33'); poly(g, [[300, 30], [350, 30], [362, 350], [320, 350]], '#8a3b33');
      box(g, 650, fy - 120, 180, 120, '#6a4a2c'); box(g, 640, fy - 132, 200, 16, '#7d5a36'); pot(g, 700, fy - 170, 1.1); candle(g, 790, fy - 162);
    },
    /* 온 가족의 저녁상 */
    dinner: function (g, W, H) {
      var fy = room(g, W, H, ['#a98862', '#8b6c48'], ['#6f4d2b', '#4f361f'], H * 0.6);
      hearth(g, 60, fy - 180, 180, 180);
      table(g, 300, fy + 30, 560, 110, '#93683a');
      candle(g, 480, fy - 8); candle(g, 700, fy - 8);
      oval(g, 590, fy + 24, 60, 18, '#5a5048'); oval(g, 590, fy + 12, 56, 16, '#c98a4a'); glow(g, 590, fy - 10, 60, 'rgba(255,255,255,.18)');
      [[380, fy + 30], [810, fy + 30]].forEach(function (p) { oval(g, p[0], p[1], 34, 11, '#efe6cf'); });
      oval(g, 420, fy + 22, 30, 14, '#d9a25a'); oval(g, 760, fy + 22, 26, 12, '#d9a25a'); box(g, 650, fy - 14, 16, 40, '#6f8f5a');
    },
    /* 화가의 이젤 */
    easel: function (g, W, H) {
      var fy = room(g, W, H, WARM, WOODF);
      win(g, 640, 40, 200, 260, { ship: true });
      line(g, [[110, fy + 90], [200, fy - 230]], '#5a3f25', 8); line(g, [[330, fy + 90], [240, fy - 230]], '#5a3f25', 8); line(g, [[220, fy + 70], [220, fy - 220]], '#4f361f', 6);
      box(g, 100, fy - 190, 240, 180, '#f8f0da');
      [[160, '#8a3b33', 46], [220, '#2f4f6a', 60], [278, '#c8553d', 40]].forEach(function (f) { disc(g, f[0], fy - 110 - f[2] * 0.6, 14, '#f0c9a0', true); poly(g, [[f[0] - 20, fy - 96 - f[2] * 0.6], [f[0] + 20, fy - 96 - f[2] * 0.6], [f[0] + 24, fy - 20], [f[0] - 24, fy - 20]], f[1], true); });
      oval(g, 430, fy + 40, 54, 30, '#a0763f'); ['#c8553d', '#2f4f6a', '#f2b632', '#4f8a45'].forEach(function (c, i) { disc(g, 404 + i * 18, fy + 34 + (i % 2) * 8, 7, c, true); });
    },
    /* 생일 과자 */
    cake: function (g, W, H) {
      var fy = room(g, W, H, WARM, WOODF);
      for (var i = 0; i < 12; i++) poly(g, [[20 + i * 74, 60 + Math.sin(i * 0.9) * 14], [80 + i * 74, 60 + Math.sin((i + 1) * 0.9) * 14], [50 + i * 74, 110 + Math.sin(i * 0.9) * 14]], ['#c8553d', '#f2b632', '#3f6f8f', '#4f8a45'][i % 4]);
      table(g, 40, fy - 30, 380, 120);
      box(g, 150, fy - 80, 160, 50, '#d9a25a'); box(g, 150, fy - 92, 160, 16, '#f8ecd2'); [180, 230, 280].forEach(function (x) { box(g, x - 3, fy - 118, 6, 26, '#f4ead0'); g.beginPath(); g.ellipse(x, fy - 126, 4, 8, 0, 0, 7); g.fillStyle = '#ffd35a'; g.fill(); glow(g, x, fy - 126, 30, 'rgba(255,214,130,.5)'); });
      box(g, 680, fy - 20, 110, 80, '#3f6f8f'); box(g, 728, fy - 20, 14, 80, '#f2b632'); box(g, 680, fy + 12, 110, 12, '#f2b632'); box(g, 770, fy + 30, 70, 54, '#c8553d'); box(g, 800, fy + 30, 10, 54, '#f4ead0');
    },
    /* 깨진 꽃병 */
    vase: function (g, W, H) {
      var fy = room(g, W, H, WARM, WOODF);
      box(g, 620, fy - 130, 220, 130, '#6a4a2c'); box(g, 610, fy - 142, 240, 16, '#7d5a36'); disc(g, 690, fy - 60, 8, '#b08a3c'); disc(g, 770, fy - 60, 8, '#b08a3c');
      oval(g, 200, fy + 90, 150, 26, 'rgba(120,160,190,.45)', true);
      [[120, fy + 70, 0.3], [190, fy + 96, -0.5], [250, fy + 66, 0.9], [300, fy + 100, 0.1], [160, fy + 110, 1.4]].forEach(function (p) { g.save(); g.translate(p[0], p[1]); g.rotate(p[2]); poly(g, [[-26, -12], [22, -18], [30, 10], [-8, 18]], '#4f7fa8'); line(g, [[-14, -4], [14, -8]], '#f4ead0', 3); g.restore(); });
      [[330, fy + 60, '#c8553d'], [360, fy + 84, '#f2b632'], [90, fy + 104, '#c8553d']].forEach(function (f) { line(g, [[f[0], f[1]], [f[0] - 40, f[1] + 16]], '#4f8a45', 3); disc(g, f[0], f[1], 10, f[2]); });
    },
    /* 앓아누운 침대 */
    bed: function (g, W, H) {
      var fy = room(g, W, H, ['#8a7a6a', '#6f6052'], ['#5a4634', '#3d2f24']);
      win(g, 660, 50, 170, 230, { sky: ['#4a4a6a', '#c98a6a'], seaCol: '#3a4f68' });
      box(g, 50, fy - 130, 28, 190, '#4f361f'); box(g, 60, fy - 20, 380, 70, '#6f4d2b'); box(g, 430, fy - 60, 24, 120, '#4f361f');
      poly(g, [[80, fy - 46], [430, fy - 46], [430, fy], [80, fy]], '#9db0c4'); oval(g, 130, fy - 56, 50, 18, '#f4ead0'); oval(g, 126, fy - 68, 22, 8, '#e8eef4');
      box(g, 500, fy + 10, 70, 60, '#5a3f25'); oval(g, 535, fy + 8, 30, 10, '#d9d2c2'); oval(g, 535, fy + 4, 24, 7, '#9fc0d0'); candle(g, 590, fy - 30);
    },
    /* 식량 통에 숨은 아이 */
    barrel: function (g, W, H) {
      outdoor(g, W, H, ['#9cc4dc', '#f1e3bd'], H * 0.5, ['#5b8fa8', '#2f5f7a']);
      seaLines(g, W, H * 0.54, H * 0.76); boat(g, 720, H * 0.5, 1.6, '#3b2715', '#fbe9c6');
      planks(g, 0, H * 0.76, W, H * 0.26, '#7a5632');
      barrel(g, 60, H * 0.56, 90, 120); barrel(g, 250, H * 0.6, 80, 104); barrel(g, 160, H * 0.5, 96, 130);
      poly(g, [[156, H * 0.47], [260, H * 0.44], [262, H * 0.47], [158, H * 0.5]], '#6f4d2b'); box(g, 176, H * 0.5, 64, 16, '#1f1611', true); disc(g, 196, H * 0.515, 5, '#fff', true); disc(g, 220, H * 0.515, 5, '#fff', true); disc(g, 197, H * 0.516, 2, INK, true); disc(g, 221, H * 0.516, 2, INK, true);
      poly(g, [[560, H * 0.76], [640, H * 0.76], [700, H * 0.56], [660, H * 0.56]], '#8a6238');
    },
    /* 문설주의 키 금 */
    height: function (g, W, H) {
      var fy = room(g, W, H, WARM, WOODF);
      box(g, 90, 50, 44, fy - 50, '#7d5a36'); box(g, 320, 50, 44, fy - 50, '#7d5a36'); box(g, 80, 34, 294, 22, '#6a4a2c'); box(g, 134, 56, 186, fy - 56, '#3a2a1c', true);
      g.fillStyle = lin(g, 134, 56, 320, 56, ['rgba(255,220,150,.35)', 'rgba(255,220,150,0)']); g.fillRect(134, 56, 186, fy - 56);
      g.font = '700 15px serif'; [[fy - 90, '1'], [fy - 126, '2'], [fy - 156, '3'], [fy - 196, '4'], [fy - 250, '5']].forEach(function (m) { line(g, [[96, m[0]], [128, m[0]]], '#f4ead0', 3); g.fillStyle = '#f4ead0'; g.fillText(m[1], 100, m[0] - 5); });
      win(g, 660, 60, 170, 220, {}); box(g, 520, fy - 30, 60, 30, '#8a6238'); box(g, 526, fy, 10, 36, '#5a3f25'); box(g, 564, fy, 10, 36, '#5a3f25');
    }
  };
  var NIGHT = { night: 1, stars: 1, bed: 1 };
  HA.NAMES = Object.keys(DRAW);

  /* 장면마다 쓰는 그림 — 차례대로 찾는다:
       ① images/events/home/<이름> (그 장면만을 위해 그린 그림)
       ② 이미 있는 그림(고향의 건물 안·도시 풍경)에 빛깔을 입힌 것: base = 건물 종류('city' = 도시 풍경), tint = 밤·해 질 녘·새벽·저녁 불빛
       ③ 코드 그림 (그림 파일이 하나도 없을 때)
     plain: 자택 안 그대로인 장면 — ①이 없으면 액자를 걸지 않는다 (아이가 집 안 그림 앞에 그대로 선다) */
  HA.SCENES = {
    yard: { base: 'gate' }, harbor: { base: 'city', tint: 'dusk' }, drawing: { base: 'home', plain: true }, shell: { base: 'home', plain: true },
    night: { base: 'home', tint: 'night' }, swords: { base: 'gate' }, duel: { base: 'gate', tint: 'dusk' }, chart: { base: 'library', tint: 'warm' },
    pier: { base: 'city', tint: 'dawn' }, book: { base: 'library' }, market: { base: 'market' }, chess: { base: 'home', tint: 'evening' },
    stars: { base: 'city', tint: 'night', stars: true }, ledger: { base: 'home', plain: true }, window: { base: 'home', plain: true },
    dinner: { base: 'home', tint: 'evening' }, easel: { base: 'home', plain: true }, cake: { base: 'home', plain: true }, vase: { base: 'home', plain: true },
    bed: { base: 'home', tint: 'night' }, barrel: { base: 'city' }, height: { base: 'home', plain: true }
  };
  /** 빛깔 입히기 (밤·해 질 녘·새벽·저녁 불빛) */
  function grade(g, W, H, sc) {
    var t = sc.tint;
    g.save();
    if (t === 'night') {
      g.globalCompositeOperation = 'multiply'; g.fillStyle = '#5d70b8'; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgba(8,12,34,.16)'; g.fillRect(0, 0, W, H);
      if (sc.stars) stars(g, W, H * 0.42, 110, 9);
      glow(g, W * 0.8, H * 0.14, 150, 'rgba(210,225,255,.30)');
    } else if (t === 'dusk') {
      g.globalCompositeOperation = 'multiply'; g.fillStyle = lin(g, 0, 0, 0, H, ['#ffb074', '#e58a6a', '#b0708a']); g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'source-over'; glow(g, W * 0.75, H * 0.3, 260, 'rgba(255,190,110,.28)');
    } else if (t === 'dawn') {
      g.globalCompositeOperation = 'soft-light'; g.fillStyle = lin(g, 0, 0, 0, H, ['#ffd9c0', '#bcd4ea']); g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgba(235,240,250,.16)'; g.fillRect(0, 0, W, H);
    } else if (t === 'evening') {
      g.globalCompositeOperation = 'multiply'; g.fillStyle = '#b98a6a'; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'source-over'; glow(g, W * 0.3, H * 0.62, 300, 'rgba(255,190,100,.30)'); glow(g, W * 0.72, H * 0.6, 240, 'rgba(255,170,90,.22)');
    } else if (t === 'warm') {
      g.globalCompositeOperation = 'soft-light'; g.fillStyle = '#ffcf8a'; g.fillRect(0, 0, W, H);
    }
    g.restore();
    finish(g, W, H, t === 'night');
  }
  function homeCity() { var s = G.Game && G.Game.state; return s && s.player && G.CITY_DATA ? G.CITY_DATA[s.player.home] : null; }
  /** ②에 쓸 그림 후보 */
  HA.baseChain = function (name) {
    var sc = HA.SCENES[name], c = homeCity(), K = G.Img && G.Img.chain;
    if (!sc || !c || !K) return [];
    try { return sc.base === 'city' ? K.bg(c) : K.interior(sc.base, c); } catch (e) { return []; }
  };

  /** 장면 그림 한 장 (코드 그림) */
  HA.draw = function (name, W, H) {
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var g = cv.getContext('2d'), fn = DRAW[name] || DRAW.window;
    g.lineJoin = 'round'; g.lineCap = 'round';
    try { fn(g, W, H); finish(g, W, H, NIGHT[name]); } catch (e) { console.error(e); }
    return cv;
  };
  /** 장면 그림: ① 전용 그림 ② 있는 그림 + 빛깔 ③ 코드 그림 */
  HA.canvas = function (name, W, H) {
    var c = C(), I = G.Img; W = W || c.w; H = H || c.h;
    var proc = function () { return HA.draw(name, W, H); };
    if (!I || !I.pick) return proc();
    var own = I.chain.homeEvent ? I.chain.homeEvent(name) : [];
    if (I.pick(own)) return I.make(own, W, H, proc);
    var base = HA.baseChain(name), sc = HA.SCENES[name];
    if (!I.pick(base)) return proc();
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var g = cv.getContext('2d'); g.fillStyle = '#1b1410'; g.fillRect(0, 0, W, H);
    I.apply(cv, base, { fit: 'cover', fy: 0.6, post: function (ctx, w, h) { grade(ctx, w, h, sc); } }, proc);
    return cv;
  };
  /** 이 장면에 걸 액자가 있는가 (자택 안 그대로인 장면은 전용 그림이 있을 때만) */
  HA.framed = function (name) {
    var I = G.Img, sc = HA.SCENES[name];
    if (!sc || !I || !I.pick) return true;
    if (I.chain.homeEvent && I.pick(I.chain.homeEvent(name))) return true;
    if (!I.pick(HA.baseChain(name))) return true;        // 그림 파일이 없다 → 코드 그림을 건다
    return !sc.plain;
  };

  // ---------------------------------------------------------------- 띄우기
  var cur = null;
  /** 대화하는 사람 뒤에 장면 그림을 건다. 돌려주는 값 {stop()} */
  HA.show = function (name, o) {
    o = o || {};
    var root = document.getElementById('ui'), c = C(); if (!root || !HA.framed(name)) return { stop: function () { return Promise.resolve(); } };
    if (cur) cur.stop();
    var box = document.createElement('div');
    box.className = 'homeart wood brass-frame';
    box.style.cssText = 'left:' + Math.round((1600 - c.w - 20) / 2) + 'px;top:' + c.top + 'px';
    var cv = HA.canvas(name); cv.style.width = c.w + 'px'; cv.style.height = c.h + 'px';
    box.appendChild(cv);
    if (o.title) { var t = document.createElement('div'); t.className = 'eventfx-title'; t.textContent = o.title; box.appendChild(t); }
    root.appendChild(box);
    root.classList.add('homeart-on');
    requestAnimationFrame(function () { box.classList.add('on'); });
    var h = { box: box, canvas: cv };
    h.stop = function () {
      if (cur === h) { cur = null; root.classList.remove('homeart-on'); }
      box.classList.remove('on');
      return new Promise(function (res) { setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); res(); }, 260); });
    };
    cur = h;
    return h;
  };
})(window.G = window.G || {});
