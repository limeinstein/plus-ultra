/* 도자기 10종 */
(function (T) {
  var O = T.OBJ, PT = T.paint;
  function rgba(r, g, b, a) { return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; }
  /** 유약 바탕: 색 + 잔잡음 + 위아래 농담 */
  function glazeBase(g, w, h, c1, c2, sc) {
    var im = g.createImageData(w, h), d = im.data;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var n = T.fbm(x / (sc || 60), y / (sc || 60), 0.5, 4) * 0.5 + 0.5, o = (y * w + x) * 4;
      for (var k = 0; k < 3; k++) d[o + k] = c1[k] + (c2[k] - c1[k]) * n;
      d[o + 3] = 255;
    }
    g.putImageData(im, 0, 0);
  }
  /** 잔금(빙렬) */
  function crackle(g, w, h, col, n, len) {
    g.save(); g.strokeStyle = col; g.lineWidth = 1;
    for (var i = 0; i < n; i++) {
      var x = T.rnd() * w, y = T.rnd() * h, a = T.rnd() * Math.PI * 2;
      g.beginPath(); g.moveTo(x, y);
      for (var k = 0; k < 5; k++) { a += T.rr(-0.9, 0.9); x += Math.cos(a) * (len || 14); y += Math.sin(a) * (len || 14); g.lineTo(x, y); }
      g.stroke();
    }
    g.restore();
  }
  /** 학 한 마리 (상감: 흰 몸, 검은 윤곽·날개 끝) */
  function crane(g, x, y, s, a, up) {
    g.save(); g.translate(x, y); g.rotate(a || 0); g.scale(s, s);
    g.lineJoin = 'round'; g.lineCap = 'round';
    var W = '#f4f1e6', K = '#2a2622';
    // 날개
    var wy = up ? -1 : 1;
    PT.poly(g, [[-4, 0], [-26, -22 * wy], [-40, -30 * wy], [-34, -14 * wy], [-20, -4 * wy]], W, K, 1.6);
    PT.poly(g, [[4, 0], [22, -26 * wy], [40, -36 * wy], [34, -16 * wy], [18, -2 * wy]], W, K, 1.6);
    PT.poly(g, [[-40, -30 * wy], [-34, -14 * wy], [-31, -22 * wy]], K);
    PT.poly(g, [[40, -36 * wy], [34, -16 * wy], [31, -26 * wy]], K);
    // 몸통·목·머리
    g.fillStyle = W; g.strokeStyle = K; g.lineWidth = 1.6;
    g.beginPath(); g.ellipse(0, 2, 13, 6, 0.1, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(10, 0); g.quadraticCurveTo(22, -4, 30, 4); g.lineWidth = 3.5; g.strokeStyle = K; g.stroke(); g.lineWidth = 2; g.strokeStyle = W; g.stroke();
    g.fillStyle = K; g.beginPath(); g.arc(31, 5, 2.6, 0, Math.PI * 2); g.fill();
    g.strokeStyle = K; g.lineWidth = 1.2; g.beginPath(); g.moveTo(33, 6); g.lineTo(40, 9); g.stroke();
    g.fillStyle = '#b02a20'; g.beginPath(); g.arc(30.5, 3.5, 1.1, 0, Math.PI * 2); g.fill();
    // 다리
    g.strokeStyle = K; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-10, 3); g.lineTo(-28, 8); g.moveTo(-10, 5); g.lineTo(-27, 11); g.stroke();
    g.restore();
  }
  function cloud(g, x, y, s, white) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.strokeStyle = white ? '#f1eee2' : '#2a2622'; g.lineWidth = 2.2; g.lineCap = 'round';
    g.beginPath(); g.arc(0, 0, 6, Math.PI * 0.2, Math.PI * 1.9); g.stroke();
    g.beginPath(); g.arc(10, -2, 4.5, Math.PI * 0.9, Math.PI * 2.6); g.stroke();
    g.beginPath(); g.moveTo(-6, 2); g.quadraticCurveTo(-18, 10, -32, 6); g.stroke();
    g.beginPath(); g.moveTo(14, 1); g.quadraticCurveTo(22, 6, 30, 2); g.stroke();
    g.restore();
  }
  function petalsBand(g, w, y0, y1, n, fill, stroke, flip) {
    for (var i = 0; i < n; i++) {
      var x = (i + 0.5) * w / n, hw = w / n * 0.42, ya = flip ? y1 : y0, yb = flip ? y0 : y1;
      g.beginPath(); g.moveTo(x - hw, ya); g.quadraticCurveTo(x - hw, yb, x, yb); g.quadraticCurveTo(x + hw, yb, x + hw, ya); g.closePath();
      if (fill) { g.fillStyle = fill; g.fill(); }
      g.strokeStyle = stroke; g.lineWidth = 2; g.stroke();
    }
  }
  function band(g, w, y, h, col) { g.fillStyle = col; g.fillRect(0, y, w, h); }

  /* ---------------- 고려 상감청자 운학문 매병 */
  O.goryeoceladon = function () {
    var prof = [[0.0, 0], [0.19, 0.0], [0.205, 0.025], [0.18, 0.1], [0.185, 0.22], [0.24, 0.42], [0.32, 0.62], [0.355, 0.74], [0.33, 0.84], [0.22, 0.915], [0.105, 0.945], [0.085, 0.975], [0.112, 1.0], [0.07, 1.012], [0.0, 1.0]];
    var cv = T.canvas(2048, 1024, function (g, w, h) {
      glazeBase(g, w, h, [110, 148, 122], [150, 182, 152], 70);
      // v: 0 = 바닥 → 1 = 입 (캔버스 y는 반대)
      function Y(v) { return h * (1 - v); }
      petalsBand(g, w, Y(0.17), Y(0.05), 16, rgba(240, 236, 220, 0.0), '#f0ece0');
      band(g, w, Y(0.18), 4, '#efe9dc');
      band(g, w, Y(0.8), 3, '#efe9dc');
      // 어깨의 여의두 무늬
      for (var i = 0; i < 12; i++) { var x = (i + 0.5) * w / 12; g.strokeStyle = '#f0ece0'; g.lineWidth = 3; g.beginPath(); g.arc(x, Y(0.84), 22, Math.PI, 0); g.stroke(); g.strokeStyle = '#2a2622'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, Y(0.84), 14, Math.PI, 0); g.stroke(); }
      // 동그란 창(이중 원) 안의 학, 바깥은 날아오르는 학과 구름
      for (i = 0; i < 4; i++) {
        var cx = (i + 0.25) * w / 4, cy = Y(0.5 + (i % 2) * 0.12), r = 120;
        g.lineWidth = 5; g.strokeStyle = '#f2eee2'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
        g.lineWidth = 2; g.strokeStyle = '#2a2622'; g.beginPath(); g.arc(cx, cy, r - 9, 0, Math.PI * 2); g.stroke();
        crane(g, cx, cy, 1.9, -0.5 + (i % 2) * 0.3, true);
        cloud(g, cx - 50, cy + 70, 1.1, true);
        var ox = cx + w / 8;
        crane(g, ox, Y(0.35 + (i % 2) * 0.32), 1.5, 0.6, false);
        cloud(g, ox + 40, Y(0.6 - (i % 2) * 0.2), 1.3, true);
        cloud(g, ox - 60, Y(0.25), 1, true);
      }
      // 유약 고임(짙은 곳)
      g.globalCompositeOperation = 'multiply';
      for (i = 0; i < 40; i++) PT.blob(g, T.rnd() * w, T.rnd() * h, T.rr(40, 120), T.rr(20, 60), 'rgba(170,200,170,0.5)', 0.9);
      g.globalCompositeOperation = 'source-over';
      crackle(g, w, h, 'rgba(60,80,62,0.18)', 500, 9);
    });
    var m = T.texMat(T.mat.glaze, cv, { roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.04 });
    var g = T.group(T.mesh(T.vessel(prof), m));
    g.scale.setScalar(1);
    return g;
  };

  /* ---------------- 당삼채 뚜껑 항아리 */
  O.tangsancai = function () {
    var prof = [[0, 0], [0.2, 0], [0.22, 0.03], [0.26, 0.12], [0.36, 0.32], [0.41, 0.5], [0.39, 0.64], [0.3, 0.76], [0.2, 0.8], [0.19, 0.86], [0.205, 0.875], [0.0, 0.875]];
    var lid = [[0, 1.0], [0.035, 0.995], [0.04, 0.97], [0.06, 0.95], [0.18, 0.91], [0.235, 0.88], [0.235, 0.865], [0.0, 0.865]].reverse();
    var cv = T.canvas(2048, 1024, function (g, w, h) {
      glazeBase(g, w, h, [236, 214, 160], [246, 232, 196], 40);
      var cols = [[186, 110, 36], [58, 120, 64], [230, 220, 180], [196, 132, 40], [70, 140, 90]];
      // 위에서 흘러내린 세 가지 색 유약
      for (var i = 0; i < 70; i++) {
        var c = T.pick(cols), x = T.rnd() * w, len = T.rr(0.35, 0.95) * h, wd = T.rr(14, 46);
        var gr = g.createLinearGradient(0, 0, 0, len);
        gr.addColorStop(0, rgba(c[0], c[1], c[2], 0.95)); gr.addColorStop(0.75, rgba(c[0], c[1], c[2], 0.85)); gr.addColorStop(1, rgba(c[0], c[1], c[2], 0));
        g.fillStyle = gr; g.beginPath(); g.moveTo(x - wd / 2, 0);
        for (var y = 0; y <= len; y += 20) g.lineTo(x - wd / 2 + T.noise(x * 0.01, y * 0.02) * 16, y);
        for (y = len; y >= 0; y -= 20) g.lineTo(x + wd / 2 + T.noise(x * 0.01 + 3, y * 0.02) * 16, y);
        g.closePath(); g.fill();
        g.beginPath(); g.ellipse(x + T.noise(x, len) * 10, len * 0.96, wd * 0.55, wd * 0.4, 0, 0, Math.PI * 2); g.fillStyle = rgba(c[0], c[1], c[2], 0.75); g.fill();
      }
      // 아래 1/4은 유약 없는 흙
      var gr2 = g.createLinearGradient(0, h * 0.72, 0, h * 0.82);
      gr2.addColorStop(0, 'rgba(226,196,160,0)'); gr2.addColorStop(1, 'rgba(226,196,160,1)');
      g.fillStyle = gr2; g.fillRect(0, h * 0.72, w, h * 0.28);
      for (i = 0; i < 18; i++) { var x2 = (i + 0.5) * w / 18; g.fillStyle = 'rgba(240,226,190,0.9)'; g.beginPath(); g.ellipse(x2, h * 0.36, 26, 34, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(60,120,70,0.8)'; g.beginPath(); g.arc(x2, h * 0.36, 9, 0, Math.PI * 2); g.fill(); }
    });
    var m = T.texMat(T.mat.glaze, cv, { roughness: 0.14 });
    var lidCv = T.canvas(512, 256, function (g, w, h) { glazeBase(g, w, h, [70, 130, 70], [190, 120, 40], 25); });
    return T.group(T.mesh(T.vessel(prof), m), T.mesh(T.vessel(lid, 60), T.texMat(T.mat.glaze, lidCv, { roughness: 0.12 })));
  };

  /* ---------------- 원·명 청화백자 운룡문 항아리 */
  function dragon(g, cx, cy, s, flip) {
    g.save(); g.translate(cx, cy); g.scale(flip ? -s : s, s);
    var B = '#1c2f86', D = '#121e5c';
    var path = [];
    for (var t = 0; t <= 1; t += 0.02) path.push([-260 + t * 520, Math.sin(t * Math.PI * 2.2) * 70 - t * 20]);
    // 몸통
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = D; g.lineWidth = 38; PT.curve(g, path, D, 38);
    PT.curve(g, path, B, 32);
    // 비늘
    g.strokeStyle = '#eef0f2'; g.lineWidth = 1.6;
    for (var i = 2; i < path.length - 2; i++) for (var k = -1; k <= 1; k++) { g.beginPath(); g.arc(path[i][0], path[i][1] + k * 9, 6, 0.2, Math.PI - 0.2); g.stroke(); }
    // 등 지느러미 불꽃
    g.fillStyle = B;
    for (i = 3; i < path.length - 3; i += 2) PT.poly(g, [[path[i][0] - 6, path[i][1] - 16], [path[i][0] + 2, path[i][1] - 38], [path[i][0] + 8, path[i][1] - 16]], B);
    // 다리와 발톱
    [[10, 1], [22, -1], [34, 1], [44, -1]].forEach(function (q) {
      var p = path[q[0]], dir = q[1];
      g.strokeStyle = B; g.lineWidth = 12; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + 30, p[1] + 50 * dir); g.lineTo(p[0] + 52, p[1] + 52 * dir); g.stroke();
      g.strokeStyle = D; g.lineWidth = 3; for (var c = -1; c <= 1; c++) { g.beginPath(); g.moveTo(p[0] + 52, p[1] + 52 * dir); g.lineTo(p[0] + 68, p[1] + (52 + c * 12) * dir); g.stroke(); }
    });
    // 머리
    var hd = path[path.length - 1];
    g.fillStyle = B; g.beginPath(); g.ellipse(hd[0] + 30, hd[1] - 6, 46, 28, -0.2, 0, Math.PI * 2); g.fill();
    g.fillStyle = D; PT.poly(g, [[hd[0] + 60, hd[1] - 4], [hd[0] + 96, hd[1] + 8], [hd[0] + 60, hd[1] + 14]], D);
    g.fillStyle = '#f2f2ee'; g.beginPath(); g.arc(hd[0] + 36, hd[1] - 14, 7, 0, Math.PI * 2); g.fill(); g.fillStyle = D; g.beginPath(); g.arc(hd[0] + 37, hd[1] - 14, 3.5, 0, Math.PI * 2); g.fill();
    g.strokeStyle = B; g.lineWidth = 6; g.beginPath(); g.moveTo(hd[0] + 10, hd[1] - 26); g.quadraticCurveTo(hd[0] - 10, hd[1] - 80, hd[0] - 40, hd[1] - 70); g.stroke();
    g.beginPath(); g.moveTo(hd[0] + 70, hd[1] - 6); g.quadraticCurveTo(hd[0] + 120, hd[1] - 40, hd[0] + 140, hd[1] - 20); g.lineWidth = 3; g.stroke();
    // 여의주
    g.strokeStyle = B; g.lineWidth = 4; g.beginPath(); g.arc(hd[0] + 170, hd[1] - 50, 22, 0, Math.PI * 2); g.stroke();
    for (i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2; g.beginPath(); g.moveTo(hd[0] + 170 + Math.cos(a) * 26, hd[1] - 50 + Math.sin(a) * 26); g.lineTo(hd[0] + 170 + Math.cos(a) * 40, hd[1] - 50 + Math.sin(a) * 40); g.stroke(); }
    g.restore();
  }
  function wavesBand(g, w, y0, y1, col) {
    g.save(); g.strokeStyle = col; g.lineWidth = 2.5;
    for (var row = 0; row < 3; row++) for (var x = 0; x < w + 40; x += 36) { g.beginPath(); g.arc(x + (row % 2) * 18, y0 + (row + 1) * (y1 - y0) / 4, 16, Math.PI, 0); g.stroke(); }
    g.restore();
  }
  O.qinghua = function () {
    var prof = [[0, 0], [0.24, 0], [0.25, 0.03], [0.27, 0.1], [0.36, 0.3], [0.42, 0.5], [0.42, 0.62], [0.36, 0.76], [0.24, 0.84], [0.19, 0.87], [0.19, 0.97], [0.21, 1.0], [0.17, 1.0], [0.0, 0.98]];
    var cv = T.canvas(2048, 1024, function (g, w, h) {
      glazeBase(g, w, h, [232, 236, 236], [246, 248, 246], 50);
      function Y(v) { return h * (1 - v); }
      g.strokeStyle = '#1c2f86'; g.lineWidth = 4;
      [0.13, 0.2, 0.74, 0.79, 0.88, 0.93].forEach(function (v) { g.beginPath(); g.moveTo(0, Y(v)); g.lineTo(w, Y(v)); g.stroke(); });
      wavesBand(g, w, Y(0.2), Y(0.13), '#1c2f86');
      petalsBand(g, w, Y(0.12), Y(0.02), 14, 'rgba(28,47,134,0.25)', '#1c2f86');
      // 어깨 운견(구름 깃) 무늬
      for (var i = 0; i < 8; i++) { var x = (i + 0.5) * w / 8; g.fillStyle = 'rgba(28,47,134,0.85)'; g.beginPath(); g.moveTo(x - 90, Y(0.79)); g.quadraticCurveTo(x - 60, Y(0.7), x, Y(0.66)); g.quadraticCurveTo(x + 60, Y(0.7), x + 90, Y(0.79)); g.fill(); g.strokeStyle = '#f2f4f2'; g.lineWidth = 2; g.beginPath(); g.arc(x, Y(0.74), 20, 0, Math.PI * 2); g.stroke(); }
      // 몸통: 구름 속 두 마리 용
      dragon(g, w * 0.27, Y(0.46), 1.25, false);
      dragon(g, w * 0.77, Y(0.43), 1.25, true);
      for (i = 0; i < 14; i++) { var cx = T.rnd() * w, cy = Y(T.rr(0.25, 0.65)); g.strokeStyle = '#2a43a0'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 12, 0, Math.PI * 1.6); g.stroke(); g.beginPath(); g.moveTo(cx + 12, cy); g.quadraticCurveTo(cx + 30, cy + 10, cx + 50, cy + 4); g.stroke(); }
      // 코발트 번짐(헤이핑 반점)
      g.globalCompositeOperation = 'multiply';
      for (i = 0; i < 220; i++) PT.blob(g, T.rnd() * w, T.rnd() * h, T.rr(2, 6), T.rr(2, 6), 'rgba(40,50,110,0.5)', 0.6);
      g.globalCompositeOperation = 'source-over';
    });
    return T.group(T.mesh(T.vessel(prof), T.texMat(T.mat.glaze, cv, { roughness: 0.08 })));
  };

  /* ---------------- 여요 청자 필세(붓 씻는 그릇) */
  O.ruware = function () {
    var prof = [[0, 0], [0.26, 0], [0.27, 0.012], [0.255, 0.03], [0.34, 0.04], [0.47, 0.08], [0.52, 0.15], [0.525, 0.175], [0.505, 0.17], [0.48, 0.12], [0.36, 0.07], [0.0, 0.055]];
    var cv = T.canvas(2048, 512, function (g, w, h) {
      glazeBase(g, w, h, [104, 132, 140], [130, 156, 160], 50);
      crackle(g, w, h, 'rgba(90,92,80,0.35)', 700, 10);
      crackle(g, w, h, 'rgba(210,180,120,0.25)', 300, 18);
    });
    var m = T.texMat(T.mat.glaze, cv, { roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.35, side: THREE.DoubleSide });
    var o = T.group(T.mesh(T.vessel(prof, 120), m));
    // 받침 지지 흔적이 있는 받침 위에 놓인 모습: 작은 흑단 받침대
    var st = T.mesh(T.vessel([[0, -0.06], [0.34, -0.06], [0.36, -0.03], [0.3, -0.01], [0.27, 0.0], [0, 0]], 40, 64), T.mat.lacquer());
    o.add(st);
    o.userData = { elev: 28 };
    return o;
  };

  /* ---------------- 조선 백자 달항아리 */
  O.moonjar = function () {
    var prof = [[0, 0], [0.17, 0], [0.18, 0.02], [0.2, 0.05], [0.33, 0.16], [0.43, 0.33], [0.455, 0.5], [0.43, 0.67], [0.33, 0.83], [0.22, 0.92], [0.18, 0.94], [0.18, 0.99], [0.2, 1.0], [0.0, 0.99]];
    var geo = T.vessel(prof, 160, 160);
    T.warp(geo, function (v) { // 위아래를 따로 빚어 붙인 비대칭
      var a = Math.atan2(v.x, v.z), k = 1 + 0.025 * Math.sin(a * 2 + v.y * 3) + 0.018 * T.noise(Math.cos(a) * 2, Math.sin(a) * 2, v.y * 3);
      v.x *= k; v.z *= k;
      if (Math.abs(v.y - 0.5) < 0.03) { v.x *= 1.006; v.z *= 1.006; }
    });
    var cv = T.canvas(2048, 1024, function (g, w, h) {
      glazeBase(g, w, h, [236, 232, 220], [246, 244, 236], 90);
      g.globalCompositeOperation = 'multiply';
      for (var i = 0; i < 14; i++) PT.blob(g, T.rnd() * w, T.rr(0.2, 0.8) * h, T.rr(40, 140), T.rr(30, 120), 'rgba(222,206,176,0.55)', 0.95);
      for (i = 0; i < 6; i++) PT.blob(g, T.rnd() * w, T.rr(0.3, 0.7) * h, T.rr(30, 70), T.rr(60, 130), 'rgba(205,190,170,0.4)', 0.95);
      g.globalCompositeOperation = 'source-over';
      for (i = 0; i < 300; i++) { g.fillStyle = 'rgba(120,110,95,0.25)'; g.beginPath(); g.arc(T.rnd() * w, T.rnd() * h, T.rr(0.6, 1.6), 0, Math.PI * 2); g.fill(); }
      g.fillStyle = 'rgba(214,200,180,0.6)'; g.fillRect(0, h * 0.495, w, 3);
    });
    return T.group(T.mesh(geo, T.texMat(T.mat.glaze, cv, { roughness: 0.22, clearcoat: 0.7, clearcoatRoughness: 0.25, sheen: 0.3 })));
  };

  /* ---------------- 접시: 받침대에 비스듬히 세운 큰 접시 */
  function plateOnStand(canvas, opts) {
    opts = opts || {};
    var R = 0.5, prof = [[0, -0.02], [0.2, -0.02], [0.205, 0.0], [0.24, 0.005], [0.4, 0.04], [0.5, 0.07], [0.505, 0.075], [0.49, 0.08], [0.39, 0.055], [0.22, 0.03], [0.0, 0.028]];
    var geo = T.lathe(prof, 128); T.planarUV(geo, R + 0.01);
    var m = T.texMat(opts.base || T.mat.glaze, canvas, opts.matOpts || { roughness: 0.1 });
    if (opts.metal) { m.metalnessMap = T.tex(opts.metal, { linear: true }); m.metalness = 1; m.roughnessMap = null; m.roughness = 0.28; m.needsUpdate = true; }
    var plate = T.mesh(geo, m);
    plate.rotation.x = Math.PI / 2 - 0.22; // 얼굴이 카메라(+z)를 보게 세움
    plate.position.y = 0.52;
    var stand = T.group(
      T.mesh(new THREE.BoxGeometry(0.5, 0.03, 0.22), T.mat.lacquer(), 0, 0.015, -0.02),
      T.mesh(new THREE.BoxGeometry(0.035, 0.42, 0.03), T.mat.lacquer(), 0, 0.22, -0.12)
    );
    stand.children[1].rotation.x = -0.22;
    var g = T.group(plate, stand);
    g.userData = { views: [0, 14, 26, 14, 0, -14, -26, -14], elev: 6 };
    return g;
  }

  /* ---------------- 이즈니크 도기 큰 접시 */
  O.iznikware = function () {
    var cv = T.canvas(1024, 1024, function (g, w, h) {
      var c = w / 2;
      glazeBase(g, w, h, [238, 236, 228], [248, 247, 242], 60);
      var BL = '#1f3f9a', TQ = '#2aa3a0', RD = '#b8261f', GR = '#2d7a3a', K = '#20201c';
      // 가장자리: 파도와 바위 무늬
      g.save(); g.beginPath(); g.arc(c, c, 500, 0, Math.PI * 2); g.arc(c, c, 410, 0, Math.PI * 2, true); g.fillStyle = '#f2f1ea'; g.fill('evenodd');
      for (var i = 0; i < 40; i++) {
        var a = i / 40 * Math.PI * 2, x = c + Math.cos(a) * 455, y = c + Math.sin(a) * 455;
        g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2);
        g.strokeStyle = BL; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 22, Math.PI, Math.PI * 1.9); g.stroke();
        g.strokeStyle = K; g.lineWidth = 2; g.beginPath(); g.arc(4, -2, 12, Math.PI, Math.PI * 1.95); g.stroke();
        g.restore();
      }
      g.restore();
      g.strokeStyle = K; g.lineWidth = 3; g.beginPath(); g.arc(c, c, 410, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(c, c, 500, 0, Math.PI * 2); g.stroke();
      // 가운데: 사즈 잎·튤립·카네이션·히아신스 다발
      function leaf(x, y, l, a, col) { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = col; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(l * 0.4, -l * 0.18, l, 0); g.quadraticCurveTo(l * 0.5, l * 0.12, 0, 0); g.fill(); g.strokeStyle = K; g.lineWidth = 1.6; g.stroke(); g.restore(); }
      function tulip(x, y, s, a) { g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s); g.fillStyle = RD; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-26, -20, -16, -62); g.lineTo(-6, -40); g.lineTo(0, -66); g.lineTo(6, -40); g.lineTo(16, -62); g.quadraticCurveTo(26, -20, 0, 0); g.fill(); g.strokeStyle = K; g.lineWidth = 2; g.stroke(); g.restore(); }
      function carnation(x, y, s, a) { g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s); g.fillStyle = BL; g.beginPath(); g.moveTo(-8, 0); g.lineTo(-10, -20); g.lineTo(10, -20); g.lineTo(8, 0); g.fill(); g.fillStyle = RD; g.beginPath(); for (var k = 0; k < 7; k++) { var aa = Math.PI + k / 6 * Math.PI; g.lineTo(Math.cos(aa) * 30, -24 + Math.sin(aa) * 24); g.lineTo(Math.cos(aa + 0.22) * 20, -24 + Math.sin(aa + 0.22) * 16); } g.closePath(); g.fill(); g.strokeStyle = K; g.lineWidth = 1.5; g.stroke(); g.restore(); }
      function stem(pts) { PT.curve(g, pts, GR, 4); }
      var base = [c, c + 330];
      [[-0.9, 300], [-0.45, 360], [0, 380], [0.45, 360], [0.9, 300], [-0.2, 250], [0.25, 260]].forEach(function (q, i) {
        var a = -Math.PI / 2 + q[0], tx = base[0] + Math.cos(a) * q[1], ty = base[1] + Math.sin(a) * q[1];
        stem([[base[0], base[1]], [base[0] + Math.cos(a) * q[1] * 0.5 + q[0] * 40, base[1] + Math.sin(a) * q[1] * 0.5], [tx, ty]]);
        if (i % 3 === 0) tulip(tx, ty, 1.2, q[0]); else if (i % 3 === 1) carnation(tx, ty, 1.1, q[0]); else { for (var k = 0; k < 6; k++) { g.fillStyle = BL; g.beginPath(); g.ellipse(tx, ty - k * 14, 9, 7, 0, 0, Math.PI * 2); g.fill(); } }
        leaf(base[0] + Math.cos(a) * q[1] * 0.4, base[1] + Math.sin(a) * q[1] * 0.4, 130, a + (i % 2 ? 0.7 : -0.7), i % 2 ? GR : TQ);
      });
      leaf(c - 40, c + 300, 280, -2.4, GR); leaf(c + 40, c + 300, 280, -0.7, TQ);
      // 붉은 슬립은 두껍게 솟아 있음
      crackle(g, w, h, 'rgba(120,120,100,0.06)', 200, 8);
    });
    return plateOnStand(cv, { matOpts: { roughness: 0.06 } });
  };

  /* ---------------- 발렌시아 러스터 도기 큰 접시 */
  O.lustreware = function () {
    var gold = '#c9933a', BL = '#2a3f88';
    function draw(g, w, h, metalPass) {
      var c = w / 2;
      if (metalPass) { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); } else glazeBase(g, w, h, [232, 222, 196], [242, 234, 212], 50);
      var L = metalPass ? '#ffffff' : gold, B = metalPass ? '#000000' : BL;
      // 동심 띠
      g.lineWidth = 10; g.strokeStyle = L; [480, 440, 300, 170].forEach(function (r) { g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.stroke(); });
      // 가장자리: 브리오니 잎 무늬(러스터) + 파란 잎
      for (var i = 0; i < 36; i++) {
        var a = i / 36 * Math.PI * 2;
        g.save(); g.translate(c + Math.cos(a) * 460, c + Math.sin(a) * 460); g.rotate(a);
        g.fillStyle = (i % 2) ? L : B; g.beginPath(); g.ellipse(0, 0, 12, 22, 0, 0, Math.PI * 2); g.fill(); g.restore();
      }
      // 가운데 띠: 촘촘한 러스터 점과 덩굴
      for (i = 0; i < 900; i++) {
        var r = T.rr(185, 290), a2 = T.rnd() * Math.PI * 2;
        g.fillStyle = L; g.beginPath(); g.arc(c + Math.cos(a2) * r, c + Math.sin(a2) * r, T.rr(2, 5), 0, Math.PI * 2); g.fill();
      }
      for (i = 0; i < 12; i++) {
        var a3 = i / 12 * Math.PI * 2; g.save(); g.translate(c, c); g.rotate(a3);
        g.strokeStyle = B; g.lineWidth = 7; g.beginPath(); g.moveTo(0, -190); g.quadraticCurveTo(40, -240, 0, -290); g.stroke();
        g.fillStyle = B; g.beginPath(); g.ellipse(18, -240, 14, 26, 0.4, 0, Math.PI * 2); g.fill();
        g.restore();
      }
      // 가운데 문장 방패
      g.save(); g.translate(c, c);
      g.beginPath(); g.moveTo(-90, -110); g.lineTo(90, -110); g.lineTo(90, 20); g.quadraticCurveTo(90, 110, 0, 130); g.quadraticCurveTo(-90, 110, -90, 20); g.closePath();
      g.fillStyle = metalPass ? '#000' : '#efe6cf'; g.fill(); g.lineWidth = 8; g.strokeStyle = L; g.stroke();
      for (i = 0; i < 4; i++) { g.fillStyle = L; g.fillRect(-70 + i * 40, -95, 20, 200); }
      g.restore();
    }
    var cv = T.canvas(1024, 1024, function (g, w, h) { draw(g, w, h, false); });
    var mv = T.canvas(1024, 1024, function (g, w, h) { draw(g, w, h, true); });
    return plateOnStand(cv, { metal: mv });
  };

  /* ---------------- 아리타(이마리) 뚜껑 항아리 */
  O.aritaware = function () {
    var prof = [[0, 0], [0.2, 0], [0.21, 0.03], [0.24, 0.1], [0.33, 0.28], [0.37, 0.42], [0.36, 0.56], [0.3, 0.68], [0.21, 0.74], [0.2, 0.78], [0.0, 0.78]];
    var lid = [[0, 1.02], [0.04, 1.015], [0.045, 0.98], [0.03, 0.96], [0.08, 0.93], [0.2, 0.86], [0.24, 0.79], [0.235, 0.775], [0.0, 0.775]].reverse();
    function body(g, w, h) {
      glazeBase(g, w, h, [236, 236, 230], [246, 246, 242], 50);
      var BL = '#1d2f78', RD = '#b33a20', GD = '#d4a83c';
      // 파란 바탕 칸과 흰 칸이 번갈아 (이마리 패널)
      for (var i = 0; i < 6; i++) {
        var x0 = i * w / 6, x1 = x0 + w / 6;
        if (i % 2 === 0) {
          g.fillStyle = BL; g.beginPath(); g.moveTo(x0, h * 0.08); g.lineTo(x1, h * 0.08); g.lineTo(x1, h * 0.92); g.lineTo(x0, h * 0.92); g.fill();
          for (var k = 0; k < 4; k++) { var cx = x0 + w / 12 + T.rr(-30, 30), cy = h * (0.2 + k * 0.2); // 금색 국화
            for (var p = 0; p < 12; p++) { var a = p / 12 * Math.PI * 2; g.fillStyle = GD; g.beginPath(); g.ellipse(cx + Math.cos(a) * 18, cy + Math.sin(a) * 18, 12, 5, a, 0, Math.PI * 2); g.fill(); }
            g.fillStyle = RD; g.beginPath(); g.arc(cx, cy, 8, 0, Math.PI * 2); g.fill(); }
        } else {
          // 흰 칸: 붉은 모란과 바위
          var mx = (x0 + x1) / 2;
          for (k = 0; k < 3; k++) { var py = h * (0.3 + k * 0.22); for (p = 0; p < 9; p++) { var a2 = p / 9 * Math.PI * 2; PT.blob(g, mx + Math.cos(a2) * 26 + T.rr(-6, 6), py + Math.sin(a2) * 20, 22, 16, 'rgba(180,58,32,0.9)', 0.3); } g.fillStyle = GD; g.beginPath(); g.arc(mx, py, 9, 0, Math.PI * 2); g.fill();
            g.strokeStyle = '#2f5a2a'; g.lineWidth = 4; g.beginPath(); g.moveTo(mx, py + 20); g.quadraticCurveTo(mx + 40, py + 60, mx + 10, py + 90); g.stroke(); }
          g.strokeStyle = BL; g.lineWidth = 3; g.strokeRect(x0 + 12, h * 0.1, x1 - x0 - 24, h * 0.8);
        }
      }
      g.fillStyle = BL; g.fillRect(0, h * 0.0, w, h * 0.06); g.fillRect(0, h * 0.94, w, h * 0.06);
      g.strokeStyle = GD; g.lineWidth = 3; g.beginPath(); g.moveTo(0, h * 0.07); g.lineTo(w, h * 0.07); g.moveTo(0, h * 0.93); g.lineTo(w, h * 0.93); g.stroke();
    }
    var cv = T.canvas(2048, 1024, body);
    var lc = T.canvas(1024, 256, body);
    var knob = T.mesh(new THREE.SphereGeometry(0.05, 24, 16), T.mat.gold({ roughness: 0.3 }), 0, 1.05, 0);
    return T.group(T.mesh(T.vessel(prof), T.texMat(T.mat.glaze, cv, { roughness: 0.08 })), T.mesh(T.vessel(lid, 80), T.texMat(T.mat.glaze, lc, { roughness: 0.08 })), knob);
  };

  /* ---------------- 흑유 라쿠 찻사발 */
  O.rakubowl = function () {
    var prof = [[0, 0], [0.17, 0], [0.18, 0.02], [0.16, 0.05], [0.3, 0.07], [0.34, 0.2], [0.35, 0.42], [0.345, 0.5], [0.33, 0.505], [0.32, 0.45], [0.31, 0.2], [0.26, 0.1], [0, 0.09]];
    var geo = T.vessel(prof, 140, 140);
    T.warp(geo, function (v) { var a = Math.atan2(v.x, v.z), k = 1 + 0.04 * T.noise(Math.cos(a) * 1.6, Math.sin(a) * 1.6, v.y * 4); v.x *= k; v.z *= k; if (v.y > 0.45) v.y += 0.02 * Math.sin(a * 3); });
    var cv = T.canvas(1024, 512, function (g, w, h) {
      glazeBase(g, w, h, [18, 16, 15], [44, 38, 32], 14);
      for (var i = 0; i < 400; i++) PT.blob(g, T.rnd() * w, T.rnd() * h, T.rr(2, 9), T.rr(2, 7), 'rgba(80,60,40,0.4)', 0.8);
    });
    var bump = T.noiseCanvas(512, 256, 6, 60, 200, 4);
    var m = T.texMat(T.mat.glaze, cv, { roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.35, side: THREE.DoubleSide });
    m.bumpMap = T.tex(bump, { linear: true }); m.bumpScale = 0.004;
    var o = T.group(T.mesh(geo, m)); o.userData = { elev: 24, exposure: 1.25 };
    return o;
  };

  /* ---------------- 쓰쿠모나스 차이레(가지 모양 차통) */
  O.tsukumonasu = function () {
    var prof = [[0, 0], [0.11, 0], [0.12, 0.02], [0.16, 0.06], [0.27, 0.16], [0.31, 0.27], [0.29, 0.38], [0.22, 0.5], [0.15, 0.6], [0.12, 0.67], [0.105, 0.72], [0.11, 0.75], [0.0, 0.75]];
    var cv = T.canvas(1024, 512, function (g, w, h) {
      glazeBase(g, w, h, [70, 42, 22], [118, 74, 34], 30);
      // 어깨에서 흘러내린 짙은 유약 (나다레)
      for (var i = 0; i < 5; i++) {
        var x = (i + 0.3) * w / 5, len = T.rr(0.35, 0.55) * h;
        var gr = g.createLinearGradient(0, 0, 0, len);
        gr.addColorStop(0, 'rgba(30,18,10,0.95)'); gr.addColorStop(0.85, 'rgba(48,26,12,0.9)'); gr.addColorStop(1, 'rgba(48,26,12,0)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(x - 30, 0); g.quadraticCurveTo(x - 20, len * 0.6, x, len); g.quadraticCurveTo(x + 20, len * 0.6, x + 30, 0); g.fill();
        PT.blob(g, x, len * 0.95, 18, 14, 'rgba(160,110,50,0.7)', 0.5);
      }
      g.fillStyle = 'rgba(150,104,64,1)'; g.fillRect(0, h * 0.86, w, h * 0.14);
    });
    var lid = T.mesh(T.lathe([[0, 0.79], [0.08, 0.79], [0.115, 0.77], [0.12, 0.755], [0.0, 0.755]].reverse(), 64), T.mat.marble({ color: 0xf0e6d0, roughness: 0.3 }));
    var knob = T.mesh(new THREE.SphereGeometry(0.03, 20, 12), T.mat.marble({ color: 0xf0e6d0 }), 0, 0.8, 0);
    var m = T.texMat(T.mat.glaze, cv, { roughness: 0.1 });
    var tray = T.mesh(T.lathe([[0, -0.04], [0.46, -0.04], [0.48, 0.0], [0.45, 0.005], [0, -0.01]], 96), T.mat.lacquer({ color: 0x2a0806 }));
    return T.group(T.mesh(T.vessel(prof), m), lid, knob, tray);
  };
})(T3);
