/* 그림·벽화·병풍·제단화 — 화풍을 따라 다시 그린 그림판 */
(function (T) {
  var O = T.OBJ, PT = T.paint, M = T.mat;
  var SWAY = [0, 14, 26, 14, 0, -14, -26, -14];
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function lin(g, x0, y0, x1, y1, stops) { var gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); }); return gr; }
  function soft(g, px, fn) { g.save(); g.filter = 'blur(' + px + 'px)'; fn(); g.restore(); }
  /** 그림 마무리: 붓질·바니시·잔금 */
  function finish(g, w, h, o) {
    o = o || {};
    // 유화 느낌: 살짝 번지게 한 뒤 굵고 가는 붓 자국을 여러 겹
    var c = g.canvas, tmp = T.canvas(w, h, function (t) { t.filter = 'blur(1.6px)'; t.drawImage(c, 0, 0); });
    g.drawImage(tmp, 0, 0);
    var n = Math.round(w * h / 70);
    PT.strokes(g, w, h, n, 0.32, 16);
    PT.strokes(g, w, h, Math.round(n * 0.8), 0.28, 7);
    PT.age(g, w, h, o);
  }
  /** 액자에 걸고 벽에 붙인 그림 하나 */
  function hang(cv, W, H, o) {
    o = o || {};
    var f = T.framed(cv, W, H, { fw: o.fw === undefined ? Math.min(W, H) * 0.07 : o.fw, frameMat: o.frameMat });
    f.position.y = H / 2 + (o.fw === undefined ? Math.min(W, H) * 0.07 : o.fw) + 0.02;
    var g = T.group(f);
    g.userData = { elev: 2, views: SWAY };
    return g;
  }
  /** 사람 얼굴(정면 가까이): 부드러운 그라데이션 */
  function face(g, x, y, rx, ry, skin, shade, turn) {
    g.save();
    var gr = g.createRadialGradient(x - rx * 0.25 * (turn || 1), y - ry * 0.25, rx * 0.1, x, y, rx * 1.1);
    gr.addColorStop(0, skin[0]); gr.addColorStop(0.7, skin[1]); gr.addColorStop(1, shade);
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill();
    g.restore();
  }

  /* ---------------- 모나리자 */
  O.monalisa = function () {
    var cv = T.canvas(800, 1160, function (g, w, h) {
      // 스푸마토 풍경
      g.fillStyle = lin(g, 0, 0, 0, h, [[0, '#9fae94'], [0.25, '#8ea27e'], [0.45, '#6f7e5a'], [0.7, '#4a4a30'], [1, '#2a2618']]); g.fillRect(0, 0, w, h);
      soft(g, 10, function () {
        g.fillStyle = 'rgba(96,126,118,0.85)'; g.beginPath(); g.moveTo(0, 430); g.quadraticCurveTo(80, 330, 160, 380); g.quadraticCurveTo(220, 300, 300, 400); g.lineTo(300, 520); g.lineTo(0, 560); g.fill();
        g.beginPath(); g.moveTo(500, 360); g.quadraticCurveTo(600, 280, 680, 330); g.quadraticCurveTo(740, 270, 800, 300); g.lineTo(800, 480); g.lineTo(500, 470); g.fill();
        g.fillStyle = 'rgba(170,180,150,0.7)'; g.beginPath(); g.ellipse(120, 470, 110, 26, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(690, 410, 90, 20, 0, 0, 7); g.fill();
        g.strokeStyle = 'rgba(150,120,70,0.8)'; g.lineWidth = 10; g.beginPath(); g.moveTo(40, 680); g.quadraticCurveTo(140, 600, 90, 540); g.quadraticCurveTo(60, 500, 140, 480); g.stroke();
        g.beginPath(); g.moveTo(800, 560); g.quadraticCurveTo(700, 520, 720, 480); g.stroke();
      });
      // 몸: 어두운 옷, 겨자빛 소매
      soft(g, 3, function () {
        g.fillStyle = '#231c12'; g.beginPath(); g.moveTo(130, h); g.quadraticCurveTo(150, 700, 280, 600); g.lineTo(520, 600); g.quadraticCurveTo(660, 700, 700, h); g.fill();
        g.fillStyle = '#7a5a26'; g.beginPath(); g.moveTo(160, 980); g.quadraticCurveTo(170, 800, 270, 700); g.lineTo(330, 760); g.quadraticCurveTo(290, 880, 380, 1000); g.lineTo(200, 1040); g.fill();
        g.beginPath(); g.moveTo(640, 900); g.quadraticCurveTo(620, 760, 540, 690); g.lineTo(480, 760); g.quadraticCurveTo(540, 860, 460, 960); g.lineTo(600, 990); g.fill();
        g.strokeStyle = 'rgba(40,26,10,0.6)'; g.lineWidth = 4; for (var i = 0; i < 12; i++) { g.beginPath(); g.moveTo(190 + i * 12, 980 - i * 18); g.quadraticCurveTo(250, 860 - i * 10, 300, 760 + i * 4); g.stroke(); }
        // 가슴·목
        g.fillStyle = lin(g, 0, 560, 0, 720, [[0, '#c99a62'], [1, '#a87444']]); g.beginPath(); g.moveTo(300, 560); g.quadraticCurveTo(400, 600, 500, 560); g.lineTo(540, 640); g.quadraticCurveTo(400, 700, 260, 640); g.fill();
        g.fillStyle = '#b8864e'; g.fillRect(355, 470, 90, 110);
        // 손 (오른손이 왼손 위)
        face(g, 470, 1000, 95, 48, ['#e0b880', '#c09058'], '#7a5430');
        face(g, 360, 1030, 90, 40, ['#d8ae76', '#b8864e'], '#704a28');
      });
      // 머리·얼굴·베일
      soft(g, 2.5, function () {
        g.fillStyle = '#1e1810'; g.beginPath(); g.ellipse(400, 380, 170, 230, 0, Math.PI * 1.05, Math.PI * 1.95); g.fill();
        g.beginPath(); g.moveTo(240, 360); g.quadraticCurveTo(220, 520, 270, 640); g.lineTo(310, 620); g.quadraticCurveTo(290, 480, 300, 380); g.fill();
        g.beginPath(); g.moveTo(560, 360); g.quadraticCurveTo(580, 520, 530, 640); g.lineTo(495, 620); g.quadraticCurveTo(510, 480, 500, 380); g.fill();
        face(g, 400, 390, 110, 150, ['#e8c690', '#c99a62'], '#7a5430', 1);
      });
      soft(g, 1.4, function () {
        g.fillStyle = 'rgba(60,36,20,0.75)'; g.beginPath(); g.ellipse(360, 370, 22, 9, 0, 0, 7); g.ellipse(445, 370, 22, 9, 0, 0, 7); g.fill();
        g.fillStyle = 'rgba(25,16,10,0.9)'; g.beginPath(); g.arc(363, 371, 6, 0, 7); g.arc(447, 371, 6, 0, 7); g.fill();
        g.strokeStyle = 'rgba(120,80,50,0.6)'; g.lineWidth = 4; g.beginPath(); g.moveTo(402, 380); g.quadraticCurveTo(395, 430, 410, 445); g.stroke();
        g.strokeStyle = 'rgba(110,52,40,0.85)'; g.lineWidth = 4; g.beginPath(); g.moveTo(368, 478); g.quadraticCurveTo(405, 492, 445, 474); g.stroke();
        g.fillStyle = 'rgba(30,20,12,0.25)'; g.beginPath(); g.ellipse(400, 250, 140, 30, 0, 0, 7); g.fill();
      });
      // 난간
      g.fillStyle = 'rgba(60,50,32,0.85)'; g.fillRect(0, 900, 120, 30); g.fillRect(w - 110, 900, 110, 30);
      finish(g, w, h, { tint: 'rgba(200,170,90,0.45)', n: 4000, cracks: 500, crack: 0.14 });
    });
    return hang(cv, 0.53, 0.77);
  };

  /* ---------------- 천지창조 (아담의 창조) */
  O.creation = function () {
    var cv = T.canvas(1600, 720, function (g, w, h) {
      g.fillStyle = lin(g, 0, 0, 0, h, [[0, '#d8ccb0'], [1, '#c4b694']]); g.fillRect(0, 0, w, h);
      soft(g, 8, function () { // 왼쪽 언덕
        g.fillStyle = '#6a6a4a'; g.beginPath(); g.moveTo(0, h); g.lineTo(0, 470); g.quadraticCurveTo(200, 420, 380, 520); g.quadraticCurveTo(560, 600, 700, h); g.fill();
        g.fillStyle = '#8a8a62'; g.beginPath(); g.moveTo(0, 520); g.quadraticCurveTo(220, 460, 380, 540); g.lineTo(380, 560); g.lineTo(0, 600); g.fill();
      });
      // 아담: 비스듬히 누워 왼팔을 뻗음
      soft(g, 3, function () {
        var sk = '#d9a77e', sh = '#a8744e';
        g.fillStyle = lin(g, 150, 380, 520, 560, [[0, '#e8bc92'], [1, sh]]);
        g.beginPath(); g.moveTo(170, 430); g.quadraticCurveTo(260, 380, 360, 420); g.quadraticCurveTo(420, 460, 470, 520); g.lineTo(440, 560); g.quadraticCurveTo(330, 520, 230, 520); g.quadraticCurveTo(170, 500, 170, 430); g.fill(); // 몸통
        g.beginPath(); g.moveTo(420, 500); g.quadraticCurveTo(560, 470, 640, 530); g.lineTo(630, 555); g.quadraticCurveTo(540, 520, 440, 560); g.fill(); // 다리
        g.beginPath(); g.moveTo(400, 500); g.quadraticCurveTo(480, 400, 560, 470); g.lineTo(545, 485); g.quadraticCurveTo(480, 440, 430, 520); g.fill(); // 굽힌 다리
        face(g, 160, 380, 34, 40, ['#e8bc92', sk], sh); g.fillStyle = '#5a3a20'; g.beginPath(); g.ellipse(150, 360, 36, 26, 0, Math.PI, 0); g.fill();
        g.strokeStyle = sk; g.lineCap = 'round'; g.lineWidth = 26; g.beginPath(); g.moveTo(230, 430); g.quadraticCurveTo(380, 380, 660, 372); g.stroke();
        g.lineWidth = 9; g.beginPath(); g.moveTo(660, 372); g.lineTo(735, 380); g.stroke();
      });
      // 하느님: 붉은 망토 껍질 안에 천사들과 함께 날아옴
      soft(g, 5, function () {
        g.fillStyle = '#9a3e3a'; g.beginPath(); g.moveTo(940, 330); g.bezierCurveTo(980, 80, 1450, 40, 1560, 220); g.bezierCurveTo(1600, 380, 1300, 520, 1060, 460); g.bezierCurveTo(980, 440, 930, 400, 940, 330); g.fill();
        g.fillStyle = '#b8605a'; g.beginPath(); g.moveTo(990, 320); g.bezierCurveTo(1040, 140, 1400, 110, 1500, 240); g.bezierCurveTo(1520, 360, 1300, 450, 1080, 420); g.fill();
      });
      soft(g, 2.5, function () {
        for (var i = 0; i < 9; i++) { var ax = 1150 + (i % 4) * 85 + T.rr(-15, 15), ay = 200 + Math.floor(i / 4) * 90 + T.rr(-10, 10); g.fillStyle = '#d8a882'; g.beginPath(); g.ellipse(ax, ay + 40, 28, 50, T.rr(-0.8, 0.8), 0, 7); g.fill(); face(g, ax, ay, 24, 27, ['#ecc7a0', '#d0a07a'], '#9a6a48'); g.fillStyle = '#7a5030'; g.beginPath(); g.ellipse(ax, ay - 12, 24, 14, 0, Math.PI, 0); g.fill(); }
        g.fillStyle = '#e8e4dc'; g.beginPath(); g.moveTo(1000, 260); g.quadraticCurveTo(1150, 240, 1320, 330); g.quadraticCurveTo(1200, 380, 1040, 340); g.fill(); // 흰 옷
        face(g, 960, 240, 40, 46, ['#ecc7a0', '#d0a07a'], '#8a5a3a');
        g.fillStyle = '#ece8e0'; g.beginPath(); g.ellipse(950, 270, 46, 50, 0.2, 0, Math.PI); g.fill(); g.beginPath(); g.ellipse(975, 215, 50, 34, -0.3, Math.PI, 0); g.fill(); // 흰 수염·머리
        g.strokeStyle = '#d6a882'; g.lineCap = 'round'; g.lineWidth = 26; g.beginPath(); g.moveTo(1000, 280); g.quadraticCurveTo(900, 330, 800, 358); g.stroke();
        g.lineWidth = 9; g.beginPath(); g.moveTo(800, 358); g.lineTo(752, 372); g.stroke();
      });
      g.strokeStyle = 'rgba(120,100,70,0.25)'; g.lineWidth = 2; for (var i = 0; i < 5; i++) { g.beginPath(); g.moveTo(0, T.rr(0, h)); g.lineTo(w, T.rr(0, h)); g.stroke(); }
      finish(g, w, h, { tint: 'rgba(220,200,150,0.3)', n: 4000, crack: 0.12, cracks: 400 });
    });
    // 천장 프레스코 조각: 두꺼운 회벽 판 + 돌 테두리
    var g = hang(cv, 1.4, 0.63, { fw: 0.05, frameMat: M.stone({ color: 0xcfc2a8, roughness: 0.7 }) });
    return g;
  };

  /* ---------------- 최후의 만찬 */
  O.lastsupper = function () {
    var cv = T.canvas(1600, 860, function (g, w, h) {
      var vx = w / 2, vy = 330;
      g.fillStyle = '#6a5a44'; g.fillRect(0, 0, w, h);
      // 원근 방: 천장 격자, 옆벽 태피스트리, 뒷벽 창 셋
      g.fillStyle = '#4a3e30'; PT.poly(g, [[0, 0], [w, 0], [vx + 300, 160], [vx - 300, 160]], '#5a4c3a');
      for (var i = -6; i <= 6; i++) { g.strokeStyle = 'rgba(30,24,18,0.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(vx + i * 140, 0); g.lineTo(vx + i * 50, 160); g.stroke(); }
      PT.poly(g, [[0, 0], [vx - 300, 160], [vx - 300, 520], [0, 700]], '#5e5040'); PT.poly(g, [[w, 0], [vx + 300, 160], [vx + 300, 520], [w, 700]], '#5e5040');
      for (i = 0; i < 4; i++) { var t0 = i / 4, t1 = (i + 0.7) / 4; PT.poly(g, [[t0 * (vx - 300), 30 + t0 * 130], [t1 * (vx - 300), 30 + t1 * 130], [t1 * (vx - 300), 640 - t1 * 120], [t0 * (vx - 300), 640 - t0 * 120]], '#2a2a26'); PT.poly(g, [[w - t0 * (vx - 300), 30 + t0 * 130], [w - t1 * (vx - 300), 30 + t1 * 130], [w - t1 * (vx - 300), 640 - t1 * 120], [w - t0 * (vx - 300), 640 - t0 * 120]], '#2a2a26'); }
      g.fillStyle = '#7a6a52'; g.fillRect(vx - 300, 160, 600, 360);
      [[vx - 220, 70], [vx, 110], [vx + 220, 70]].forEach(function (wd) { g.fillStyle = lin(g, 0, 220, 0, 420, [[0, '#c8d4d0'], [1, '#8aa08a']]); g.fillRect(wd[0] - wd[1] / 2, 220, wd[1], 200); });
      g.fillStyle = '#6a5a44'; g.beginPath(); g.arc(vx, 220, 60, Math.PI, 0); g.fill();
      // 식탁
      g.fillStyle = '#e8e2d2'; g.fillRect(140, 560, w - 280, 110); g.fillStyle = '#c8c0ae'; g.fillRect(140, 640, w - 280, 30);
      g.strokeStyle = 'rgba(100,90,70,0.4)'; for (i = 0; i < 20; i++) { g.beginPath(); g.moveTo(160 + i * 66, 600); g.lineTo(160 + i * 66, 670); g.stroke(); }
      for (i = 0; i < 26; i++) { g.fillStyle = T.pick(['#d8d4cc', '#9a8a6a', '#c8a080']); g.beginPath(); g.ellipse(180 + i * 48, 572, 14, 6, 0, 0, 7); g.fill(); }
      g.fillStyle = '#4a3c2c'; g.fillRect(140, 670, w - 280, 140);
      // 제자들: 셋씩 넷 무리 + 가운데 그리스도
      var cols = ['#7a8a5a', '#a04a3a', '#3a5a7a', '#c8a050', '#6a4a7a', '#4a7a6a', '#b06a40', '#5a6a8a', '#8a5a3a', '#7a7a50', '#a05a5a', '#4a5a6a'];
      var xs = [230, 320, 410, 540, 620, 700, 900, 980, 1060, 1190, 1280, 1370];
      soft(g, 2, function () {
        xs.forEach(function (x, k) {
          var lean = [0.2, -0.1, 0.15, 0.3, -0.2, 0.1, -0.15, 0.25, -0.1, 0.2, -0.3, 0.1][k];
          PT.person(g, { x: x + lean * 30, y: 600, h: 300, robe: cols[k], skin: '#c89a70', hair: k % 3 ? '#3a2818' : '#8a8070', beard: k % 2 ? '#4a3420' : null, wide: 0.22, armTo: [x + 60 + lean * 40, 470 - k % 3 * 30], arm2To: [x - 50, 520] });
        });
        PT.poly(g, [[vx - 90, 600], [vx - 40, 380], [vx + 40, 380], [vx + 100, 600]], '#a8302a');
        PT.poly(g, [[vx + 10, 400], [vx + 50, 390], [vx + 120, 600], [vx + 20, 600]], '#2a4a8a');
        face(g, vx, 350, 32, 40, ['#d8ae80', '#b88a60'], '#7a5430'); g.fillStyle = '#4a2a14'; g.beginPath(); g.ellipse(vx, 340, 40, 52, 0, Math.PI * 1.05, Math.PI * 1.95); g.fill();
        g.fillStyle = '#d8ae80'; g.beginPath(); g.arc(vx - 120, 560, 14, 0, 7); g.arc(vx + 130, 556, 14, 0, 7); g.fill();
      });
      // 벽화가 벗겨진 자국
      for (i = 0; i < 260; i++) { g.fillStyle = 'rgba(' + T.pick(['200,190,170', '120,110,90', '160,150,130']) + ',' + T.rr(0.2, 0.6) + ')'; g.beginPath(); g.ellipse(T.rnd() * w, T.rnd() * h, T.rr(2, 14), T.rr(2, 8), T.rnd() * 3, 0, 7); g.fill(); }
      finish(g, w, h, { tint: 'rgba(210,190,140,0.35)', n: 3000, crack: 0.1, cracks: 200 });
    });
    return hang(cv, 1.4, 0.75, { fw: 0.04, frameMat: M.stone({ color: 0xbfb29a, roughness: 0.7 }) });
  };

  /* ---------------- 비너스의 탄생 */
  O.birthvenus = function () {
    var cv = T.canvas(1500, 940, function (g, w, h) {
      g.fillStyle = lin(g, 0, 0, 0, h, [[0, '#c8d8d0'], [0.45, '#b0c8bc'], [0.5, '#88a898'], [1, '#6a9080']]); g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(240,250,240,0.55)'; g.lineWidth = 3; for (var i = 0; i < 160; i++) { var x = T.rnd() * w, y = T.rr(0.5, 1) * h; g.beginPath(); g.moveTo(x - 10, y - 6); g.lineTo(x, y); g.lineTo(x + 10, y - 6); g.stroke(); }
      // 오른쪽 숲과 해안
      soft(g, 3, function () {
        g.fillStyle = '#6a7a3a'; g.beginPath(); g.moveTo(w, 0); g.lineTo(1260, 0); g.lineTo(1240, 560); g.lineTo(1150, h); g.lineTo(w, h); g.fill();
        for (i = 0; i < 4; i++) { g.fillStyle = '#3a4a24'; g.fillRect(1300 + i * 50, 0, 18, 640); for (var k = 0; k < 10; k++) PT.blob(g, 1300 + i * 50 + T.rr(-60, 60), T.rr(0, 500), 40, 26, 'rgba(40,70,40,0.9)', 0.4); }
      });
      // 조개와 비너스
      var cx = 720;
      g.fillStyle = '#e8d8b0'; g.beginPath(); g.moveTo(cx - 200, 880); g.quadraticCurveTo(cx, 760, cx + 200, 880); g.lineTo(cx + 150, 900); g.lineTo(cx - 150, 900); g.fill();
      g.strokeStyle = '#b09060'; g.lineWidth = 3; for (i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(cx + i * 28, 880); g.lineTo(cx, 905); g.stroke(); }
      soft(g, 2, function () {
        var sk = lin(g, cx - 80, 0, cx + 80, 0, [[0, '#f4e2cc'], [0.6, '#ecd2b8'], [1, '#c8a488']]);
        g.fillStyle = sk;
        g.beginPath(); g.moveTo(cx - 55, 330); g.quadraticCurveTo(cx - 75, 420, cx - 62, 480); g.quadraticCurveTo(cx - 110, 560, cx - 90, 640); g.quadraticCurveTo(cx - 70, 760, cx - 50, 860); g.lineTo(cx + 20, 860); g.quadraticCurveTo(cx + 10, 760, cx + 50, 660); g.quadraticCurveTo(cx + 95, 560, cx + 60, 470); g.quadraticCurveTo(cx + 80, 400, cx + 60, 330); g.quadraticCurveTo(cx, 310, cx - 55, 330); g.fill();
        g.strokeStyle = 'rgba(170,120,100,0.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 25, 860); g.quadraticCurveTo(cx - 20, 700, cx + 10, 650); g.stroke();
        face(g, cx + 10, 270, 40, 52, ['#f6e6d4', '#e8cdb4'], '#b89070', 1);
        g.strokeStyle = '#ecd2b8'; g.lineWidth = 22; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx + 40, 360); g.quadraticCurveTo(cx + 10, 420, cx - 20, 440); g.stroke();
        g.beginPath(); g.moveTo(cx - 30, 360); g.quadraticCurveTo(cx - 60, 480, cx - 40, 560); g.stroke();
        // 긴 금붉은 머리
        g.fillStyle = '#c8803a'; g.beginPath(); g.moveTo(cx - 20, 220); g.quadraticCurveTo(cx - 90, 260, cx - 110, 400); g.quadraticCurveTo(cx - 80, 520, cx - 40, 600); g.quadraticCurveTo(cx - 60, 420, cx - 30, 300); g.fill();
        g.beginPath(); g.moveTo(cx + 40, 230); g.quadraticCurveTo(cx + 90, 260, cx + 80, 320); g.lineTo(cx + 50, 300); g.fill();
      });
      // 왼쪽: 서풍의 신과 아우라
      soft(g, 3, function () {
        g.fillStyle = '#5a8a8a'; g.beginPath(); g.ellipse(260, 300, 170, 90, -0.4, 0, 7); g.fill();
        face(g, 300, 210, 34, 40, ['#e8c8a0', '#d0a880'], '#a07858'); face(g, 360, 250, 30, 36, ['#f0d8c0', '#e0c0a0'], '#b09070');
        g.fillStyle = '#4a6a5a'; g.beginPath(); g.moveTo(120, 160); g.quadraticCurveTo(200, 100, 280, 180); g.lineTo(200, 260); g.fill(); g.beginPath(); g.moveTo(140, 380); g.quadraticCurveTo(220, 420, 300, 360); g.lineTo(220, 320); g.fill();
        g.strokeStyle = 'rgba(240,250,250,0.6)'; g.lineWidth = 4; for (i = 0; i < 5; i++) { g.beginPath(); g.moveTo(400, 250 + i * 8); g.quadraticCurveTo(520, 260 + i * 10, 620, 300 + i * 12); g.stroke(); }
      });
      // 오른쪽: 꽃무늬 옷의 계절 여신, 분홍 망토
      soft(g, 2.5, function () {
        PT.person(g, { x: 1090, y: 880, h: 640, robe: '#f2ece0', skin: '#ecd2b8', hair: '#c8803a', wide: 0.16, armTo: [980, 420], arm2To: [1000, 520] });
        g.fillStyle = '#d07890'; g.beginPath(); g.moveTo(980, 400); g.quadraticCurveTo(900, 480, 930, 640); g.quadraticCurveTo(960, 560, 1010, 520); g.fill();
        for (i = 0; i < 40; i++) { g.fillStyle = T.pick(['#3a6a3a', '#d0a040', '#c05050']); g.beginPath(); g.arc(1090 + T.rr(-80, 80), T.rr(380, 860), 5, 0, 7); g.fill(); }
      });
      for (i = 0; i < 24; i++) { g.fillStyle = 'rgba(230,170,180,0.9)'; g.beginPath(); g.arc(T.rr(250, 700), T.rr(120, 500), 9, 0, 7); g.fill(); }
      finish(g, w, h, { tint: 'rgba(220,200,150,0.3)', n: 3600, crack: 0.1, cracks: 220 });
    });
    return hang(cv, 1.25, 0.78);
  };

  /* ---------------- 뒤러 자화상 (1500) */
  O.durer = function () {
    var cv = T.canvas(760, 1040, function (g, w, h) {
      g.fillStyle = '#16120c'; g.fillRect(0, 0, w, h);
      soft(g, 3, function () {
        // 털 깃 외투
        g.fillStyle = '#3a2614'; g.beginPath(); g.moveTo(60, h); g.quadraticCurveTo(100, 640, 250, 600); g.lineTo(510, 600); g.quadraticCurveTo(660, 640, 700, h); g.fill();
        g.fillStyle = '#5a3a1e'; g.beginPath(); g.moveTo(250, 600); g.quadraticCurveTo(300, 800, 290, h); g.lineTo(200, h); g.quadraticCurveTo(170, 760, 250, 600); g.fill(); g.beginPath(); g.moveTo(510, 600); g.quadraticCurveTo(460, 800, 470, h); g.lineTo(560, h); g.quadraticCurveTo(590, 760, 510, 600); g.fill();
        g.fillStyle = '#e8dcc8'; g.beginPath(); g.moveTo(330, 600); g.lineTo(430, 600); g.lineTo(410, 700); g.lineTo(350, 700); g.fill();
        // 털 깃을 쥔 손 (손가락)
        g.fillStyle = '#c8966a'; g.beginPath(); g.ellipse(380, 860, 40, 60, 0.3, 0, 7); g.fill();
        g.strokeStyle = '#d8a878'; g.lineWidth = 14; g.lineCap = 'round'; for (var f = 0; f < 4; f++) { g.beginPath(); g.moveTo(360 + f * 16, 820); g.lineTo(340 + f * 18, 760 + f * 4); g.stroke(); }
        // 어깨까지 늘어진 곱슬머리 (양쪽)
        g.fillStyle = '#7a5226';
        [-1, 1].forEach(function (sd) { g.beginPath(); g.moveTo(380 + sd * 90, 250); g.quadraticCurveTo(380 + sd * 200, 330, 380 + sd * 190, 620); g.quadraticCurveTo(380 + sd * 130, 640, 380 + sd * 100, 560); g.quadraticCurveTo(380 + sd * 110, 400, 380 + sd * 60, 300); g.fill(); });
        g.beginPath(); g.ellipse(380, 270, 130, 90, 0, Math.PI, 0); g.fill();
        for (var i = 0; i < 60; i++) { g.strokeStyle = T.pick(['#9a6a32', '#5a3818', '#b07a3a']); g.lineWidth = 6; var sd2 = T.pick([-1, 1]), sx = 380 + sd2 * T.rr(100, 190), sy = T.rr(260, 600); g.beginPath(); g.moveTo(sx, sy); g.bezierCurveTo(sx + 20, sy + 20, sx - 20, sy + 40, sx + 8, sy + 60); g.stroke(); }
      });
      soft(g, 1.8, function () {
        face(g, 380, 360, 110, 150, ['#e2b88a', '#c8966a'], '#7a5030', 0.2);
        g.fillStyle = '#6a4220'; g.beginPath(); g.moveTo(290, 430); g.quadraticCurveTo(380, 560, 470, 430); g.quadraticCurveTo(440, 520, 380, 530); g.quadraticCurveTo(320, 520, 290, 430); g.fill(); // 수염
        g.fillStyle = 'rgba(40,24,14,0.85)'; g.beginPath(); g.ellipse(340, 335, 20, 9, 0, 0, 7); g.ellipse(420, 335, 20, 9, 0, 0, 7); g.fill();
        g.fillStyle = '#e8dcc8'; g.beginPath(); g.arc(344, 334, 3, 0, 7); g.arc(424, 334, 3, 0, 7); g.fill();
        g.strokeStyle = 'rgba(120,76,46,0.7)'; g.lineWidth = 4; g.beginPath(); g.moveTo(380, 345); g.lineTo(374, 405); g.lineTo(392, 410); g.stroke();
        g.fillStyle = '#7a5226'; g.beginPath(); g.ellipse(380, 230, 120, 40, 0, Math.PI, 0); g.fill();
      });
      // 모노그램과 글
      g.fillStyle = '#b89a50'; g.font = 'bold 40px serif'; g.fillText('1500', 90, 320); g.font = 'bold 54px serif'; g.fillText('A', 110, 390); g.font = 'bold 36px serif'; g.fillText('D', 128, 386);
      g.font = 'italic 20px serif'; ['Albertus Durerus Noricus', 'ipsum me propriis sic effin', 'gebam coloribus aetatis', 'anno XXVIII'].forEach(function (s, i) { g.fillText(s, 470, 300 + i * 28); });
      finish(g, w, h, { tint: 'rgba(200,170,100,0.35)', n: 3000, crack: 0.15, cracks: 400 });
    });
    return hang(cv, 0.5, 0.68);
  };

  /* ---------------- 우르비노의 비너스 */
  O.urbinovenus = function () {
    var cv = T.canvas(1400, 1000, function (g, w, h) {
      g.fillStyle = '#1a2018'; g.fillRect(0, 0, w * 0.55, h); // 초록 휘장
      g.fillStyle = '#5a4a36'; g.fillRect(w * 0.55, 0, w * 0.45, h);
      g.fillStyle = '#7a3a2a'; g.fillRect(w * 0.55, h * 0.12, w * 0.45, h * 0.35); // 벽 걸개
      g.fillStyle = '#9ab0b8'; g.fillRect(w * 0.82, h * 0.12, w * 0.14, h * 0.28); // 창
      g.fillStyle = '#7a5a38'; for (var i = 0; i < 8; i++) PT.poly(g, [[w * 0.55 + i * 80, h * 0.62], [w * 0.55 + i * 80 + 40, h * 0.62], [w * 0.5 + i * 110 + 40, h], [w * 0.5 + i * 110, h]], i % 2 ? '#8a6a44' : '#6a4a2a');
      // 하녀 둘과 궤짝
      g.fillStyle = '#6a4a2a'; g.fillRect(w * 0.78, h * 0.42, 220, 120);
      PT.person(g, { x: w * 0.8, y: h * 0.6, h: 230, robe: '#d8d0c0', skin: '#d8a880', hair: '#3a2414', sit: false, wide: 0.18 });
      PT.person(g, { x: w * 0.9, y: h * 0.56, h: 260, robe: '#a03030', skin: '#d8a880', hair: '#3a2414', wide: 0.2 });
      // 붉은 매트리스와 흰 시트
      g.fillStyle = '#8a1c1a'; g.fillRect(0, h * 0.62, w * 0.62, h * 0.38);
      g.fillStyle = '#f0ece2'; g.beginPath(); g.moveTo(0, h * 0.64); g.quadraticCurveTo(w * 0.3, h * 0.6, w * 0.62, h * 0.66); g.lineTo(w * 0.62, h * 0.8); g.quadraticCurveTo(w * 0.3, h * 0.84, 0, h * 0.82); g.fill();
      PT.blob(g, 120, h * 0.56, 140, 70, 'rgba(240,236,226,1)', 0.25);
      // 기댄 비너스
      soft(g, 2.2, function () {
        var sk = lin(g, 0, h * 0.4, 0, h * 0.7, [[0, '#f2d8bc'], [1, '#d8b090']]);
        g.fillStyle = sk; g.beginPath(); g.moveTo(140, h * 0.52); g.quadraticCurveTo(300, h * 0.46, 480, h * 0.56); g.quadraticCurveTo(640, h * 0.6, 860, h * 0.64); g.lineTo(860, h * 0.68); g.quadraticCurveTo(620, h * 0.69, 470, h * 0.66); g.quadraticCurveTo(300, h * 0.62, 150, h * 0.6); g.fill();
        face(g, 150, h * 0.44, 44, 54, ['#f6e2cc', '#e8c8a8'], '#b08868', -1);
        g.fillStyle = '#9a6a3a'; g.beginPath(); g.moveTo(110, h * 0.4); g.quadraticCurveTo(80, h * 0.5, 120, h * 0.6); g.lineTo(150, h * 0.5); g.fill();
        g.fillStyle = 'rgba(220,120,140,0.9)'; for (i = 0; i < 6; i++) { g.beginPath(); g.arc(230 + i * 8, h * 0.56, 7, 0, 7); g.fill(); }
      });
      // 발치에 잠든 강아지
      PT.blob(g, w * 0.62, h * 0.64, 40, 22, 'rgba(200,170,120,1)', 0.4);
      finish(g, w, h, { tint: 'rgba(200,170,100,0.35)', n: 3400, crack: 0.12, cracks: 300 });
    });
    return hang(cv, 1.12, 0.8);
  };

  /* ---------------- 바벨탑 (브뤼헐) */
  O.babeltower = function () {
    var cv = T.canvas(1400, 1040, function (g, w, h) {
      g.fillStyle = lin(g, 0, 0, 0, h, [[0, '#a8b8c0'], [0.4, '#c8ccc0'], [0.6, '#8a9a7a'], [1, '#5a5a3a']]); g.fillRect(0, 0, w, h);
      soft(g, 6, function () { for (var i = 0; i < 8; i++) PT.blob(g, T.rr(0, w), T.rr(30, 220), T.rr(120, 260), T.rr(30, 60), 'rgba(240,240,236,0.8)', 0.6); });
      // 오른쪽 바다와 배
      g.fillStyle = '#7a94a0'; g.beginPath(); g.moveTo(w * 0.7, h * 0.45); g.lineTo(w, h * 0.42); g.lineTo(w, h); g.lineTo(w * 0.8, h); g.fill();
      for (var i = 0; i < 10; i++) { var sx = T.rr(w * 0.78, w - 20), sy = T.rr(h * 0.5, h * 0.9); g.fillStyle = '#3a2a1a'; g.fillRect(sx - 14, sy, 28, 8); g.fillStyle = '#e8e0d0'; g.fillRect(sx - 6, sy - 26, 12, 24); }
      // 왼쪽 아래 도시
      for (i = 0; i < 80; i++) { var hx = T.rr(0, w * 0.5), hy = T.rr(h * 0.7, h); g.fillStyle = T.pick(['#c8a080', '#a87a5a', '#d8c0a0']); g.fillRect(hx, hy, 26, 18); g.fillStyle = '#7a3a2a'; PT.poly(g, [[hx - 3, hy], [hx + 13, hy - 12], [hx + 29, hy]], '#7a3a2a'); }
      // 탑: 층마다 아치가 줄 선 기울어진 원뿔
      var cx = w * 0.5, base = h * 0.9, levels = 8;
      for (var L = 0; L < levels; L++) {
        var y0 = base - L * 90, y1 = y0 - 90, r0 = 460 - L * 46, r1 = 460 - (L + 1) * 46, lean = L * 6;
        var gr = g.createLinearGradient(cx - r0, 0, cx + r0, 0);
        gr.addColorStop(0, '#6a5a48'); gr.addColorStop(0.35, '#c8a888'); gr.addColorStop(0.6, '#b89070'); gr.addColorStop(1, '#5a4a3a');
        g.fillStyle = gr; g.beginPath(); g.moveTo(cx - r0 + lean, y0); g.lineTo(cx - r1 + lean, y1); g.lineTo(cx + r1 + lean, y1); g.lineTo(cx + r0 + lean, y0); g.fill();
        // 아치 줄
        var n = Math.round(r0 / 18);
        for (var k = 0; k < n; k++) { var t = (k + 0.5) / n, ax = cx + lean + (t * 2 - 1) * r0 * 0.96, aw = 12 * Math.sqrt(1 - Math.pow(t * 2 - 1, 2)) + 3; g.fillStyle = 'rgba(40,28,20,0.75)'; g.beginPath(); g.moveTo(ax - aw / 2, y0 - 10); g.lineTo(ax - aw / 2, y0 - 50); g.arc(ax, y0 - 50, aw / 2, Math.PI, 0); g.lineTo(ax + aw / 2, y0 - 10); g.fill(); }
        g.fillStyle = 'rgba(230,210,180,0.7)'; g.fillRect(cx - r1 + lean, y1 - 4, r1 * 2, 6);
      }
      // 꼭대기 공사 중인 붉은 벽돌
      g.fillStyle = '#9a4a32'; g.fillRect(cx - 60 + levels * 6, base - levels * 90 - 40, 140, 40);
      // 왼쪽 아래 니므롯 일행
      for (i = 0; i < 6; i++) PT.person(g, { x: 80 + i * 40, y: h - 20, h: 80, robe: T.pick(['#a03030', '#3a5a8a', '#e8d8b0']), skin: '#d8a880', wide: 0.2 });
      finish(g, w, h, { tint: 'rgba(210,190,140,0.3)', n: 3200, crack: 0.12, cracks: 260 });
    });
    return hang(cv, 1.1, 0.82);
  };

  /* ---------------- 오르가스 백작의 매장 (엘 그레코) */
  O.orgaz = function () {
    var cv = T.canvas(800, 1400, function (g, w, h) {
      g.fillStyle = '#1a1814'; g.fillRect(0, 0, w, h);
      // 위: 하늘 — 회백 구름, 그리스도, 마리아, 요한
      soft(g, 6, function () {
        for (var i = 0; i < 26; i++) PT.blob(g, T.rr(0, w), T.rr(60, 680), T.rr(80, 180), T.rr(40, 90), 'rgba(' + T.pick(['200,200,190', '160,160,150', '220,214,200']) + ',0.75)', 0.5);
        PT.blob(g, w / 2, 120, 160, 100, 'rgba(250,246,230,0.95)', 0.5);
      });
      soft(g, 2.5, function () {
        PT.person(g, { x: w / 2, y: 260, h: 200, robe: '#f2eee4', skin: '#e0c0a0', hair: '#5a3a20', beard: '#5a3a20', wide: 0.24 });
        PT.person(g, { x: 220, y: 560, h: 260, robe: '#a02a2a', mantle: '#2a3a8a', skin: '#e0c0a0', hair: '#2a2010', wide: 0.24 });
        PT.person(g, { x: 590, y: 560, h: 260, robe: '#d8d2c0', mantle: '#4a7a5a', skin: '#c8a080', beard: '#8a7050', wide: 0.24 });
        g.fillStyle = 'rgba(240,236,220,0.8)'; g.beginPath(); g.ellipse(w / 2, 620, 26, 70, 0, 0, 7); g.fill(); // 영혼을 안은 천사
        g.fillStyle = '#c89a3a'; g.beginPath(); g.ellipse(w / 2 - 20, 600, 60, 26, -0.6, 0, 7); g.fill();
      });
      // 아래: 검은 옷에 흰 주름 깃을 단 귀족들의 줄
      g.fillStyle = '#0e0c0a'; g.fillRect(0, 760, w, 280);
      for (var i = 0; i < 12; i++) {
        var x = 40 + i * 64, y = 800 + (i % 2) * 14;
        face(g, x, y, 22, 28, ['#d8b090', '#b88a68'], '#5a3a28');
        g.fillStyle = '#ece8e0'; g.beginPath(); g.ellipse(x, y + 32, 26, 9, 0, 0, 7); g.fill();
        g.fillStyle = '#2a2018'; g.beginPath(); g.ellipse(x, y - 8, 22, 12, 0, Math.PI, 0); g.fill();
      }
      // 금빛 제의의 두 성인과 갑옷 입은 백작
      soft(g, 1.5, function () {
        PT.poly(g, [[180, 1300], [220, 980], [330, 960], [380, 1300]], '#c8962e');
        PT.poly(g, [[440, 1300], [480, 960], [600, 980], [640, 1300]], '#c8962e');
        for (var k = 0; k < 30; k++) { g.fillStyle = T.pick(['#8a2a1a', '#e8d080', '#3a5a2a']); g.fillRect(T.pick([200, 470]) + T.rr(0, 150), T.rr(1000, 1280), 10, 14); }
        face(g, 300, 940, 34, 42, ['#e0c0a0', '#c8a080'], '#7a5a40'); g.fillStyle = '#e8e4dc'; g.beginPath(); g.ellipse(300, 970, 30, 36, 0, 0, Math.PI); g.fill();
        g.fillStyle = '#c8962e'; g.beginPath(); g.moveTo(275, 905); g.lineTo(300, 860); g.lineTo(325, 905); g.fill(); // 주교관
        face(g, 520, 950, 30, 38, ['#e0c0a0', '#c8a080'], '#7a5a40');
        g.fillStyle = lin(g, 0, 1150, 0, 1230, [[0, '#9a9a96'], [0.5, '#e8e8e4'], [1, '#4a4a48']]);
        g.beginPath(); g.moveTo(220, 1170); g.quadraticCurveTo(400, 1120, 580, 1180); g.lineTo(570, 1240); g.quadraticCurveTo(400, 1190, 230, 1230); g.fill();
        face(g, 230, 1200, 24, 28, ['#d0b098', '#a88870'], '#5a4030');
      });
      g.fillStyle = 'rgba(250,180,80,0.9)'; [120, 680].forEach(function (x) { g.fillRect(x, 820, 8, 200); PT.blob(g, x + 4, 815, 16, 22, 'rgba(255,200,90,0.9)', 0.4); });
      finish(g, w, h, { tint: 'rgba(200,170,110,0.3)', n: 3200, crack: 0.12, cracks: 300 });
    });
    return hang(cv, 0.5, 0.88);
  };

  /* ---------------- 대사들 (홀바인) */
  O.ambassadors = function () {
    var cv = T.canvas(1100, 1080, function (g, w, h) {
      g.fillStyle = '#1e4a32'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 300; i++) { g.strokeStyle = 'rgba(10,30,20,0.4)'; g.lineWidth = 2; var x = T.rr(0, w), y = T.rr(0, h * 0.8); g.beginPath(); g.arc(x, y, 14, 0, Math.PI); g.stroke(); }
      // 바닥 모자이크
      g.fillStyle = '#7a6a5a'; g.fillRect(0, h * 0.84, w, h * 0.16); for (i = 0; i < 12; i++) { g.strokeStyle = '#3a2a1a'; g.lineWidth = 3; g.strokeRect(i * 100 - 20, h * 0.86, 80, 40); }
      // 가운데 이층 선반과 물건들
      g.fillStyle = '#3a2a1c'; g.fillRect(380, 470, 340, 16); g.fillRect(380, 700, 340, 16); g.fillRect(390, 470, 14, 360); g.fillRect(696, 470, 14, 360);
      g.fillStyle = '#5a1a14'; g.fillRect(380, 486, 340, 10);
      g.fillStyle = '#a8803a'; g.beginPath(); g.arc(450, 440, 30, 0, 7); g.fill(); g.strokeStyle = '#6a4a20'; g.lineWidth = 3; g.stroke(); // 천구의
      g.fillStyle = '#7a6a4a'; g.fillRect(520, 420, 60, 50); g.fillStyle = '#c8a050'; g.fillRect(610, 410, 50, 60);
      g.fillStyle = '#4a6a8a'; g.beginPath(); g.arc(460, 660, 34, 0, 7); g.fill(); // 지구의
      g.fillStyle = '#8a5a2a'; g.beginPath(); g.ellipse(580, 670, 60, 24, 0.3, 0, 7); g.fill(); // 류트
      g.fillStyle = '#e8dcc0'; g.fillRect(620, 640, 60, 50);
      // 왼쪽 사람: 분홍 공단 위 검은 털 외투
      PT.person(g, { x: 230, y: h * 0.9, h: 780, robe: '#1a1410', mantle: null, skin: '#d8a880', hair: '#3a2414', beard: '#3a2414', hat: '#1a1410', wide: 0.3, armTo: [370, 520], arm2To: [120, 560] });
      g.fillStyle = '#c86a70'; g.fillRect(190, h * 0.9 - 600, 80, 220); g.fillStyle = '#e8dcc8'; g.beginPath(); g.ellipse(230, h * 0.9 - 680, 70, 26, 0, 0, 7); g.fill();
      g.fillStyle = '#c8a050'; g.beginPath(); g.arc(230, h * 0.9 - 560, 14, 0, 7); g.fill();
      // 오른쪽 사람: 긴 갈색 사제복
      PT.person(g, { x: 870, y: h * 0.9, h: 760, robe: '#4a2a1a', skin: '#d8a880', hair: '#2a1a10', beard: '#2a1a10', hat: '#1a1410', wide: 0.24, armTo: [720, 520], arm2To: [980, 600] });
      // 비스듬히 늘어진 해골 (왜상)
      g.save(); g.translate(560, h * 0.86); g.rotate(-0.42); g.scale(4.2, 0.62);
      g.fillStyle = 'rgba(200,196,180,0.9)'; g.beginPath(); g.ellipse(0, 0, 50, 34, 0, 0, 7); g.fill();
      g.fillStyle = 'rgba(60,54,46,0.8)'; g.beginPath(); g.ellipse(-14, -4, 10, 9, 0, 0, 7); g.ellipse(12, -4, 10, 9, 0, 0, 7); g.fill(); g.fillRect(-12, 16, 24, 6);
      g.restore();
      finish(g, w, h, { tint: 'rgba(200,170,100,0.3)', n: 3000, crack: 0.12, cracks: 300 });
    });
    return hang(cv, 0.86, 0.84);
  };

  /* ---------------- 세 폭·여러 폭 제단화: 가운데 판 + 열린 날개 */
  function triptych(center, left, right, W, H, o) {
    o = o || {};
    var g = T.group(), fw = o.fw || 0.04;
    var c = T.framed(center, W, H, { fw: fw }); c.position.y = H / 2 + fw + 0.04; g.add(c);
    [[left, -1], [right, 1]].forEach(function (q) {
      var wg = T.framed(q[0], W / 2, H, { fw: fw }), hinge = T.group(wg);
      wg.position.x = q[1] * (W / 4 + fw);
      hinge.position.set(q[1] * (W / 2 + fw), H / 2 + fw + 0.04, 0); hinge.rotation.y = -q[1] * 0.45;
      g.add(hinge);
    });
    g.add(T.mesh(new THREE.BoxGeometry(W * 1.9, 0.04, 0.3), M.lacquer({ color: 0x2a1408 }), 0, 0.02, -0.05));
    g.userData = { elev: 4, views: SWAY };
    return g;
  }

  /* ---------------- 쾌락의 정원 */
  O.earthlydelights = function () {
    function landscape(g, w, h, sky, ground) { g.fillStyle = lin(g, 0, 0, 0, h, [[0, sky], [0.25, sky], [0.3, ground], [1, ground]]); g.fillRect(0, 0, w, h); }
    var C = T.canvas(800, 900, function (g, w, h) {
      landscape(g, w, h, '#a8c0c8', '#7a9a5a');
      g.fillStyle = '#5a8aa0'; g.beginPath(); g.ellipse(w / 2, h * 0.42, 220, 40, 0, 0, 7); g.fill();
      for (var i = 0; i < 5; i++) { var x = 80 + i * 160; g.fillStyle = T.pick(['#d88aa0', '#7aa0c8', '#e8a070']); g.beginPath(); g.moveTo(x - 30, h * 0.3); g.quadraticCurveTo(x, h * 0.05, x + 30, h * 0.3); g.fill(); g.beginPath(); g.arc(x, h * 0.13, 16, 0, 7); g.fill(); }
      g.fillStyle = '#4a7aa0'; g.beginPath(); g.ellipse(w / 2, h * 0.62, 120, 30, 0, 0, 7); g.fill();
      for (i = 0; i < 260; i++) { var px = T.rr(0, w), py = T.rr(h * 0.3, h); g.fillStyle = T.pick(['#f0d8c8', '#e8c8b0', '#5a3a2a', '#f4e4d8']); g.beginPath(); g.ellipse(px, py, 4, 9, T.rr(-1, 1), 0, 7); g.fill(); }
      for (i = 0; i < 26; i++) { g.fillStyle = T.pick(['#c83a3a', '#e05a7a', '#3a7aa8', '#d8b040']); g.beginPath(); g.arc(T.rr(0, w), T.rr(h * 0.35, h), T.rr(10, 26), 0, 7); g.fill(); }
      for (i = 0; i < 12; i++) { var bx = T.rr(40, w - 40), by = T.rr(h * 0.45, h * 0.6); g.fillStyle = T.pick(['#f0e8e0', '#8a5a3a', '#e8c040']); PT.poly(g, [[bx - 20, by], [bx + 30, by - 10], [bx + 20, by + 8]], g.fillStyle); }
      finish(g, w, h, { tint: 'rgba(210,190,140,0.3)', n: 2000, cracks: 160 });
    });
    var L = T.canvas(400, 900, function (g, w, h) {
      landscape(g, w, h, '#b0c8c8', '#4a7a3a');
      g.fillStyle = '#e8a0b0'; g.beginPath(); g.moveTo(w / 2 - 30, h * 0.5); g.lineTo(w / 2 - 10, h * 0.2); g.lineTo(w / 2 + 10, h * 0.2); g.lineTo(w / 2 + 30, h * 0.5); g.fill();
      g.fillStyle = '#5a8aa0'; g.beginPath(); g.ellipse(w / 2, h * 0.52, 140, 30, 0, 0, 7); g.fill();
      PT.person(g, { x: w / 2, y: h * 0.92, h: 200, robe: '#e8d8c8', skin: '#f0d8c0', hair: '#c8a060', wide: 0.16 });
      for (var i = 0; i < 30; i++) { g.fillStyle = T.pick(['#f0f0f0', '#8a6a4a', '#c8c8a0']); g.beginPath(); g.ellipse(T.rr(0, w), T.rr(h * 0.3, h), 10, 6, 0, 0, 7); g.fill(); }
      finish(g, w, h, { tint: 'rgba(210,190,140,0.3)', n: 900, cracks: 80 });
    });
    var R = T.canvas(400, 900, function (g, w, h) {
      g.fillStyle = '#100c0a'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 20; i++) PT.blob(g, T.rr(0, w), T.rr(0, h * 0.35), T.rr(30, 80), T.rr(20, 40), 'rgba(230,90,30,0.85)', 0.6);
      g.fillStyle = '#e8e0d0'; g.beginPath(); g.ellipse(w / 2, h * 0.5, 80, 50, 0, 0, 7); g.fill(); // 나무 인간
      g.fillStyle = '#6a4a3a'; g.fillRect(w / 2 - 50, h * 0.55, 18, 200); g.fillRect(w / 2 + 30, h * 0.55, 18, 200);
      for (i = 0; i < 120; i++) { g.fillStyle = T.pick(['#c8b0a0', '#3a2a20', '#8a2a1a']); g.beginPath(); g.ellipse(T.rr(0, w), T.rr(h * 0.4, h), 4, 8, 0, 0, 7); g.fill(); }
      finish(g, w, h, { tint: 'rgba(200,170,110,0.3)', n: 900, cracks: 80 });
    });
    return triptych(C, L, R, 0.8, 0.9);
  };

  /* ---------------- 헨트 제단화 (열린 모습) */
  O.ghentaltar = function () {
    function panel(fn, w, h) { return T.canvas(w, h, function (g) { fn(g, w, h); finish(g, w, h, { tint: 'rgba(210,190,140,0.25)', n: 600, cracks: 60 }); }); }
    var C = T.canvas(900, 1000, function (g, w, h) {
      // 위: 하느님(붉은 옷)·마리아(푸른 옷)·요한(초록 옷) / 아래: 신비한 어린양 경배
      var top = h * 0.48;
      [[w * 0.17, '#2a3a8a'], [w * 0.5, '#a01a1a'], [w * 0.83, '#3a6a3a']].forEach(function (q, i) {
        g.fillStyle = '#c8a050'; g.fillRect(q[0] - w * 0.15, 10, w * 0.3, top - 20);
        g.fillStyle = '#1a2a1a'; g.fillRect(q[0] - w * 0.14, 20, w * 0.28, top - 40);
        PT.person(g, { x: q[0], y: top - 20, h: top - 70, robe: q[1], skin: '#e8c8a8', hair: i === 1 ? '#5a3a20' : '#c89a50', beard: i ? null : null, sit: true, wide: 0.28, halo: '#e8c860' });
        if (i === 1) { g.fillStyle = '#e8d080'; g.fillRect(q[0] - 30, 40, 60, 40); }
      });
      g.fillStyle = lin(g, 0, top, 0, h, [[0, '#a8c0c8'], [0.2, '#6a9a4a'], [1, '#3a6a2a']]); g.fillRect(0, top, w, h - top);
      g.fillStyle = '#3a5a2a'; for (var i = 0; i < 10; i++) PT.blob(g, T.rr(0, w), top + 40, 40, 30, 'rgba(40,70,30,0.9)', 0.3);
      g.fillStyle = '#a01a1a'; g.fillRect(w / 2 - 70, top + 170, 140, 60); g.fillStyle = '#f0f0e8'; g.beginPath(); g.ellipse(w / 2, top + 160, 30, 18, 0, 0, 7); g.fill(); // 제단과 어린양
      g.fillStyle = '#e8c860'; g.beginPath(); g.arc(w / 2, top + 100, 30, 0, 7); g.fill();
      g.fillStyle = '#7a8a9a'; g.beginPath(); g.ellipse(w / 2, top + 330, 50, 20, 0, 0, 7); g.fill(); // 생명의 샘
      for (i = 0; i < 90; i++) { var gx = T.pick([T.rr(40, 300), T.rr(600, 860)]), gy = T.rr(top + 120, h - 30); PT.person(g, { x: gx, y: gy, h: 50, robe: T.pick(['#a01a1a', '#2a3a8a', '#e8e0d0', '#3a2a1a']), skin: '#e8c8a8', arm: false, wide: 0.22 }); }
      finish(g, w, h, { tint: 'rgba(210,190,140,0.25)', n: 2000, cracks: 150 });
    });
    var L = panel(function (g, w, h) {
      g.fillStyle = '#c8a050'; g.fillRect(0, 0, w, h * 0.48); g.fillStyle = '#1a2a1a'; g.fillRect(10, 10, w - 20, h * 0.48 - 20);
      for (var i = 0; i < 6; i++) PT.person(g, { x: 60 + (i % 3) * 140, y: 200 + Math.floor(i / 3) * 150, h: 160, robe: '#a01a1a', skin: '#e8c8a8', hair: '#c89a50', wide: 0.3 });
      g.fillStyle = lin(g, 0, h * 0.48, 0, h, [[0, '#a8c0c8'], [0.2, '#6a9a4a'], [1, '#3a6a2a']]); g.fillRect(0, h * 0.48, w, h * 0.52);
      for (i = 0; i < 8; i++) PT.person(g, { x: T.rr(60, w - 60), y: T.rr(h * 0.7, h - 20), h: 110, robe: T.pick(['#4a3a2a', '#8a6a3a', '#3a4a6a']), skin: '#e8c8a8', hat: '#2a1a10', wide: 0.24 });
    }, 450, 1000);
    var R = panel(function (g, w, h) {
      g.fillStyle = '#c8a050'; g.fillRect(0, 0, w, h * 0.48); g.fillStyle = '#1a2a1a'; g.fillRect(10, 10, w - 20, h * 0.48 - 20);
      for (var i = 0; i < 6; i++) PT.person(g, { x: 60 + (i % 3) * 140, y: 200 + Math.floor(i / 3) * 150, h: 160, robe: '#3a6a3a', skin: '#e8c8a8', hair: '#c89a50', wide: 0.3 });
      g.fillStyle = lin(g, 0, h * 0.48, 0, h, [[0, '#a8c0c8'], [0.2, '#6a9a4a'], [1, '#3a6a2a']]); g.fillRect(0, h * 0.48, w, h * 0.52);
      for (i = 0; i < 8; i++) PT.person(g, { x: T.rr(60, w - 60), y: T.rr(h * 0.7, h - 20), h: 110, robe: T.pick(['#6a5a4a', '#8a3a2a', '#4a4a3a']), skin: '#e8c8a8', wide: 0.24 });
    }, 450, 1000);
    return triptych(C, L, R, 0.9, 1.0, { fw: 0.035 });
  };

  /* ---------------- 남만 병풍 (여섯 폭) */
  O.nanbanscreen = function () {
    var full = T.canvas(2400, 700, function (g, w, h) {
      g.fillStyle = '#d8b050'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 2000; i++) { g.strokeStyle = 'rgba(160,120,40,0.25)'; g.strokeRect(T.rr(0, w), T.rr(0, h), 40, 40); }
      // 금 구름
      for (i = 0; i < 18; i++) { var cx = T.rr(0, w), cy = T.pick([60, 120, h - 60]); g.fillStyle = '#ecc860'; g.beginPath(); g.ellipse(cx, cy, T.rr(120, 260), 40, 0, 0, 7); g.fill(); g.strokeStyle = '#b08a30'; g.lineWidth = 2; g.stroke(); }
      // 바다와 검은 배
      g.fillStyle = '#3a6a8a'; g.beginPath(); g.moveTo(0, h * 0.5); g.quadraticCurveTo(500, h * 0.45, 900, h * 0.6); g.lineTo(900, h); g.lineTo(0, h); g.fill();
      g.strokeStyle = 'rgba(240,240,240,0.6)'; for (i = 0; i < 40; i++) { var wx = T.rr(0, 880), wy = T.rr(h * 0.55, h); g.beginPath(); g.arc(wx, wy, 10, Math.PI, 0); g.stroke(); }
      g.fillStyle = '#1a1410'; g.beginPath(); g.moveTo(140, 430); g.lineTo(640, 430); g.quadraticCurveTo(620, 500, 560, 520); g.lineTo(220, 520); g.quadraticCurveTo(160, 490, 140, 430); g.fill();
      g.fillRect(160, 390, 120, 50); g.fillRect(520, 400, 100, 40);
      [260, 400, 520].forEach(function (mx, k) { g.fillStyle = '#3a2a1a'; g.fillRect(mx, 120 + k * 20, 8, 320); g.fillStyle = '#f0ead8'; g.fillRect(mx - 60 + k * 6, 160 + k * 20, 130 - k * 12, 80); g.fillRect(mx - 50 + k * 6, 260 + k * 20, 110 - k * 12, 70); g.strokeStyle = '#8a7a5a'; g.strokeRect(mx - 60 + k * 6, 160 + k * 20, 130 - k * 12, 80); });
      // 상륙한 남만인 행렬과 일본 집
      for (i = 0; i < 18; i++) {
        var px = 1000 + i * 70, py = h * 0.78 + (i % 3) * 20;
        PT.person(g, { x: px, y: py, h: 130, robe: T.pick(['#1a1a1a', '#8a1a1a', '#e8e0d0', '#2a3a6a']), skin: '#e8c8a8', hat: '#1a1410', hair: '#3a2414', wide: 0.24 });
        g.fillStyle = T.pick(['#c8a050', '#e8e0d0']); g.fillRect(px - 14, py - 50, 28, 40); // 부푼 바지
      }
      for (i = 0; i < 5; i++) { var hx = 1300 + i * 220, hy = 230; g.fillStyle = '#e8e0d0'; g.fillRect(hx, hy, 160, 90); g.fillStyle = '#4a4a4a'; PT.poly(g, [[hx - 20, hy], [hx + 80, hy - 60], [hx + 180, hy]], '#4a4a4a'); g.strokeStyle = '#3a2a1a'; g.strokeRect(hx, hy, 160, 90); }
      PT.person(g, { x: 2200, y: 380, h: 120, robe: '#1a1a1a', skin: '#e8c8a8', wide: 0.24 });
    });
    var g = T.group(), n = 6, pw = 0.26, ph = 0.72, fold = 0.42;
    var x = -((n - 1) / 2) * pw * Math.cos(fold);
    for (var i = 0; i < n; i++) {
      var cv = T.canvas(400, 700, function (c) { c.drawImage(full, i * 400, 0, 400, 700, 0, 0, 400, 700); });
      var p = T.framed(cv, pw - 0.02, ph - 0.02, { fw: 0.012, frameMat: M.lacquer({ color: 0x140806 }) });
      p.position.set(x + i * pw * Math.cos(fold), ph / 2 + 0.02, (i % 2) * pw * Math.sin(fold) - 0.05);
      p.rotation.y = (i % 2 ? -1 : 1) * fold;
      g.add(p);
    }
    g.userData = { elev: 8, views: SWAY };
    return g;
  };

  /* ---------------- 아잔타 벽화 (연꽃을 든 보살) */
  O.ajanta = function () {
    var cv = T.canvas(900, 1000, function (g, w, h) {
      g.fillStyle = '#6a3a1e'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 40; i++) PT.blob(g, T.rr(0, w), T.rr(0, h), T.rr(60, 160), T.rr(40, 120), 'rgba(' + T.pick(['120,60,30', '80,50,30', '140,90,50', '60,70,50']) + ',0.5)', 0.8);
      // 보살: 높은 보관, 기운 고개, 연꽃
      soft(g, 1.8, function () {
        var sk = lin(g, 300, 0, 600, 0, [[0, '#a86a3a'], [0.5, '#c88a52'], [1, '#8a5430']]);
        g.fillStyle = sk; g.beginPath(); g.moveTo(330, 420); g.quadraticCurveTo(450, 380, 570, 430); g.lineTo(600, 760); g.quadraticCurveTo(450, 800, 300, 760); g.fill(); // 몸
        face(g, 450, 300, 70, 92, ['#d89a62', '#b87a46'], '#6a3a1e', 0.5);
        g.fillStyle = '#c8962e'; g.beginPath(); g.moveTo(380, 230); g.lineTo(400, 120); g.lineTo(450, 90); g.lineTo(500, 120); g.lineTo(520, 230); g.fill(); // 보관
        for (i = 0; i < 9; i++) { g.fillStyle = T.pick(['#2a6a7a', '#c83a2a', '#e8d8a0']); g.beginPath(); g.arc(395 + i * 15, 200 - Math.abs(i - 4) * 12, 6, 0, 7); g.fill(); }
        g.strokeStyle = '#e8d8a0'; g.lineWidth = 6; g.beginPath(); g.arc(450, 440, 90, 0.2, Math.PI - 0.2); g.stroke(); // 진주 목걸이
        g.strokeStyle = '#c88a52'; g.lineWidth = 34; g.lineCap = 'round'; g.beginPath(); g.moveTo(560, 450); g.quadraticCurveTo(640, 560, 600, 640); g.stroke(); // 팔
        g.fillStyle = '#e8a0a8'; g.beginPath(); g.ellipse(610, 640, 30, 22, 0, 0, 7); g.fill(); g.fillStyle = '#d8707a'; g.beginPath(); g.ellipse(610, 630, 16, 20, 0, 0, 7); g.fill();
        g.fillStyle = '#1a1410'; g.beginPath(); g.ellipse(420, 295, 18, 6, -0.1, 0, 7); g.ellipse(482, 295, 18, 6, 0.1, 0, 7); g.fill();
      });
      // 옆의 작은 인물과 원숭이 등 (흐릿)
      for (i = 0; i < 6; i++) PT.person(g, { x: T.pick([120, 780]) + T.rr(-40, 40), y: T.rr(400, 980), h: 160, robe: T.pick(['#2a5a5a', '#8a2a1a', '#d8c8a0']), skin: '#a86a3a', hair: '#1a1410', wide: 0.22 });
      // 회벽이 떨어져 나간 자리
      for (i = 0; i < 30; i++) { g.fillStyle = 'rgba(200,180,150,' + T.rr(0.5, 0.9) + ')'; g.beginPath(); var x = T.rr(0, w), y = T.rr(0, h); for (var k = 0; k < 7; k++) g.lineTo(x + T.rr(-40, 40), y + T.rr(-30, 30)); g.fill(); }
      PT.age(g, w, h, { tint: 'rgba(200,170,120,0.25)', cracks: 300, crack: 0.25 });
    });
    // 불규칙한 회벽 조각
    var geo = T.relief(T.noiseCanvas(128, 128, 10, 60, 200, 3), 0.8, 0.9, 80, 90, 0.012, function (u, v) { var d = Math.hypot((u - 0.5) * 1.1, v - 0.5); return d < 0.5 + 0.06 * T.noise(u * 6, v * 6, 2) + 0.02 * Math.sin(u * 30); });
    var m = M.matte({ map: T.tex(cv), roughness: 0.9 });
    var g = T.group(T.mesh(geo, m, 0, 0.5, 0.02));
    g.add(T.mesh(new THREE.BoxGeometry(0.92, 1.0, 0.04), M.stone({ color: 0x3a2a20 }), 0, 0.5, -0.01));
    g.add(T.mesh(new THREE.BoxGeometry(0.5, 0.04, 0.3), M.lacquer(), 0, 0.0, -0.05));
    g.userData = { elev: 2, views: SWAY };
    return g;
  };

  /* ---------------- 팔라 도로 (금 제단 장식판) */
  O.paladoro = function () {
    var W = 1.3, H = 0.9;
    function draw(g, w, h, metal) {
      var GOLD = metal ? '#ffffff' : '#d8a848', E = function (c) { return metal ? '#000000' : c; };
      g.fillStyle = GOLD; g.fillRect(0, 0, w, h);
      // 칸 격자
      var cols = 13, rows = 4, cw = w / cols, rh = (h * 0.6) / rows;
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
        var x = c * cw + 6, y = h * 0.38 + r * rh + 6;
        if (c >= 5 && c <= 7 && r <= 2) continue; // 가운데 큰 판
        g.fillStyle = E('#1a3a8a'); g.fillRect(x + 4, y + 4, cw - 20, rh - 20);
        g.fillStyle = metal ? '#000' : '#e8c8a0'; g.beginPath(); g.arc(x + cw / 2 - 6, y + 28, 10, 0, 7); g.fill();
        g.fillStyle = E(T.pick(['#a01a1a', '#2a6a3a', '#e8e0d0', '#5a2a6a'])); g.fillRect(x + cw / 2 - 18, y + 40, 24, rh - 64);
        g.fillStyle = metal ? '#000' : '#e8c060'; g.beginPath(); g.arc(x + cw / 2 - 6, y + 28, 15, Math.PI, 0); g.fill();
      }
      // 가운데 그리스도 (판토크라토르)
      var cx = w / 2, cy = h * 0.6;
      g.fillStyle = E('#1a3a8a'); g.fillRect(cx - cw * 1.5 + 10, h * 0.38 + 10, cw * 3 - 20, rh * 3 - 20);
      g.fillStyle = E('#c83a2a'); g.beginPath(); g.moveTo(cx - 60, cy + 120); g.lineTo(cx - 40, cy - 20); g.lineTo(cx + 40, cy - 20); g.lineTo(cx + 60, cy + 120); g.fill();
      g.fillStyle = E('#2a4a9a'); g.beginPath(); g.moveTo(cx + 10, cy - 20); g.lineTo(cx + 50, cy - 10); g.lineTo(cx + 70, cy + 120); g.lineTo(cx + 20, cy + 120); g.fill();
      g.fillStyle = metal ? '#000' : '#e8c8a0'; g.beginPath(); g.arc(cx, cy - 50, 26, 0, 7); g.fill();
      g.strokeStyle = metal ? '#fff' : '#f0d070'; g.lineWidth = 8; g.beginPath(); g.arc(cx, cy - 52, 40, 0, 7); g.stroke();
      // 위 칸: 큰 대천사·축일 장면
      for (var k = 0; k < 7; k++) {
        var x2 = k * w / 7 + 14, y2 = 20;
        g.fillStyle = E(T.pick(['#1a3a8a', '#2a6a3a'])); g.beginPath(); g.moveTo(x2, y2 + 200); g.lineTo(x2, y2 + 60); g.quadraticCurveTo(x2 + w / 14 - 14, y2, x2 + w / 7 - 28, y2 + 60); g.lineTo(x2 + w / 7 - 28, y2 + 200); g.fill();
        PT.person(g, { x: x2 + w / 14 - 14, y: y2 + 190, h: 120, robe: E(T.pick(['#c83a2a', '#e8e0d0', '#5a2a6a'])), skin: metal ? '#000' : '#e8c8a0', arm: false, halo: metal ? '#fff' : '#f0d070', wide: 0.25 });
      }
    }
    var cv = T.canvas(1300, 900, function (g, w, h) { draw(g, w, h, false); PT.age(g, w, h, { tint: 'rgba(220,200,150,0.15)', crack: false }); });
    var mv = T.canvas(1300, 900, function (g, w, h) { draw(g, w, h, true); });
    var m = M.gold({ color: 0xffffff, roughness: 0.3 }); m.map = T.tex(cv); m.metalnessMap = T.tex(mv, { linear: true }); m.metalness = 1;
    var panel = T.mesh(new THREE.PlaneGeometry(W, H), m, 0, 0, 0.002);
    var f = T.framed(T.canvas(4, 4), W, H, { fw: 0.05, frameMat: M.gold({ roughness: 0.25 }) });
    f.children[0].visible = false; f.add(panel);
    // 칸 사이 보석
    var gems = [];
    for (var i = 0; i < 60; i++) gems.push({ p: [T.rr(-W / 2, W / 2), T.rr(-H / 2, H / 2), 0.01], s: T.rr(0.008, 0.014), c: T.pick([0xb0102a, 0x10802a, 0x1a3aa8, 0xf4eee0]) });
    f.add(T.inst(new THREE.SphereGeometry(1, 12, 8), M.cabochon(0xffffff), gems));
    f.position.y = H / 2 + 0.07;
    var g = T.group(f);
    g.userData = { elev: 4, views: SWAY };
    return g;
  };
})(T3);
