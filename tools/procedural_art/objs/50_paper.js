/* 두루마리·책·지도·코덱스 */
(function (T) {
  var O = T.OBJ, PT = T.paint, M = T.mat;
  var SWAY = [0, 16, 30, 16, 0, -16, -30, -16];
  function paperTex(w, h, c1, c2, sc) {
    return T.pixels(w, h, function (x, y) { var n = 0.5 + 0.5 * T.fbm(x / (sc || 40), y / (sc || 40), 0.2, 4), s = T.rnd() * 8 - 4; return [c1[0] + (c2[0] - c1[0]) * n + s, c1[1] + (c2[1] - c1[1]) * n + s, c1[2] + (c2[2] - c1[2]) * n + s]; });
  }
  function onPaper(w, h, c1, c2, fn) { var bg = paperTex(w >> 1, h >> 1, c1, c2, 30); return T.canvas(w, h, function (g) { g.drawImage(bg, 0, 0, w, h); fn(g, w, h); }); }

  /** 펼친 두루마리: 낮은 상 위, 왼쪽에 감긴 부분 */
  function handscroll(cv, L, H, o) {
    o = o || {};
    var g = T.group();
    var geo = new THREE.PlaneGeometry(L, H, 80, 4);
    T.warp(geo, function (v) { v.z = 0.006 * Math.sin(v.x / L * Math.PI * 6); });
    var sheet = T.mesh(geo, M.paper({ map: T.tex(cv), roughness: 0.8 }), 0, 0.084, 0); sheet.rotation.x = -Math.PI / 2; g.add(sheet);
    // 비단 테두리
    [-1, 1].forEach(function (sd) { var b = T.mesh(new THREE.PlaneGeometry(L, 0.018), M.cloth({ color: o.border || 0x8a6a3a }), 0, 0.0835, sd * (H / 2 + 0.009)); b.rotation.x = -Math.PI / 2; g.add(b); });
    var roll = T.mesh(new THREE.CylinderGeometry(0.035, 0.035, H + 0.036, 32), M.cloth({ color: o.border || 0x8a6a3a }), -L / 2 - 0.03, 0.105, 0); roll.rotation.x = Math.PI / 2; g.add(roll);
    var rod = T.mesh(new THREE.CylinderGeometry(0.012, 0.012, H + 0.1, 16), M.jade({ color: 0xd8dcc0 }), -L / 2 - 0.03, 0.105, 0); rod.rotation.x = Math.PI / 2; g.add(rod);
    var rod2 = T.mesh(new THREE.CylinderGeometry(0.008, 0.008, H + 0.06, 12), M.wood({ color: 0x4a2a14 }), L / 2 + 0.008, 0.08, 0); rod2.rotation.x = Math.PI / 2; g.add(rod2);
    // 낮은 상
    g.add(T.mesh(new THREE.BoxGeometry(L + 0.3, 0.04, H + 0.22), M.lacquer({ color: 0x1c0a06 }), 0, 0.05, 0));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { g.add(T.mesh(new THREE.BoxGeometry(0.04, 0.05, 0.04), M.lacquer({ color: 0x1c0a06 }), q[0] * (L / 2 + 0.1), 0.012, q[1] * (H / 2 + 0.07))); });
    return g;
  }
  /** 펼친 책: 두 쪽, 받침대 위에 비스듬히 */
  function openBook(left, right, w, h, o) {
    o = o || {};
    var g = T.group(), book = T.group();
    function page(cv, sd) {
      var geo = new THREE.PlaneGeometry(w, h, 40, 2); geo.translate(sd * w / 2, 0, 0);
      T.warp(geo, function (v) { var t = Math.abs(v.x) / w; v.z = 0.06 * w * Math.sqrt(t) * (1 - t) * 2.2 + 0.004; });
      return T.mesh(geo, M.paper({ map: T.tex(cv), roughness: 0.85 }));
    }
    book.add(page(left, -1), page(right, 1));
    for (var k = 1; k <= 4; k++) { // 쪽 두께
      [-1, 1].forEach(function (sd) { var e = T.mesh(new THREE.PlaneGeometry(w * 0.99, h * 0.995), M.paper({ color: 0xd8ccb0 }), sd * w / 2, 0, -k * 0.003); book.add(e); });
    }
    var cover = T.mesh(new THREE.BoxGeometry(w * 2 + 0.04, h + 0.04, 0.012), o.cover || M.cloth({ color: 0x5a1a10 }), 0, 0, -0.02); book.add(cover);
    book.rotation.x = -0.55; book.position.y = 0.32;
    g.add(book);
    // 받침대 (라할 같은 X자 책상)
    var st = M.wood({ color: 0x3a2010 });
    var board = T.mesh(new THREE.BoxGeometry(w * 2.15, h + 0.06, 0.02), st, 0, 0.32 - 0.52 * 0.04, -0.85 * 0.04); board.rotation.x = -0.55; g.add(board);
    g.add(T.mesh(new THREE.BoxGeometry(w * 2.1, 0.04, 0.42), st, 0, 0.02, -0.08));
    g.add(T.mesh(new THREE.BoxGeometry(w * 2.1, 0.035, 0.03), st, 0, 0.32 - (h / 2 + 0.02) * 0.85 + 0.0, (h / 2 + 0.02) * 0.52 + 0.02));
    g.userData = { elev: 16, views: SWAY };
    return g;
  }

  /* ---------------- 이백의 시집 */
  O.libai = function () {
    var cv = onPaper(2048, 512, [214, 196, 160], [232, 218, 186], function (c, w, h) {
      var poems = '床前明月光疑是地上霜舉頭望明月低頭思故鄉\n君不見黃河之水天上來奔流到海不復回君不見高堂明鏡悲白髮朝如青絲暮成雪人生得意須盡歡莫使金樽空對月\n花間一壺酒獨酌無相親舉杯邀明月對影成三人月旣不解飮影徒隨我身';
      c.save(); c.globalAlpha = 0.9;
      PT.vtext(c, poems, w - 70, 50, 52, 70, 7, '#16110c', '"Noto Serif CJK TC"', 3);
      c.restore();
      PT.seal(c, 420, 380, 70, '太白之印'); PT.seal(c, w - 120, 40, 50, '靑蓮');
      // 달과 술잔을 그린 작은 그림
      c.fillStyle = 'rgba(40,30,20,0.25)'; c.beginPath(); c.arc(240, 140, 60, 0, 7); c.fill();
      c.strokeStyle = 'rgba(20,14,10,0.7)'; c.lineWidth = 3; c.beginPath(); c.moveTo(80, 420); c.quadraticCurveTo(200, 300, 360, 430); c.stroke();
    });
    var g = handscroll(cv, 1.2, 0.3, { border: 0x2a3a5a });
    // 술잔과 달무늬 연적
    g.add(T.mesh(T.lathe(T.smoothProfile([[0, 0], [0.025, 0], [0.03, 0.01], [0.055, 0.04], [0.06, 0.045], [0.05, 0.04], [0.0, 0.015]], 30), 40), M.glaze({ color: 0xd9e6dc }), 0.42, 0.072, 0.27));
    var drop = T.mesh(new THREE.SphereGeometry(0.05, 32, 20), M.glaze({ color: 0xf0f0ea }), 0.55, 0.11, 0.24); drop.scale.set(1, 0.7, 1); g.add(drop);
    g.add(T.mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.02, 12), M.glaze({ color: 0x2a3a8a }), 0.55, 0.15, 0.24));
    g.userData = { elev: 42, views: SWAY };
    return g;
  };

  /* ---------------- 난정서 */
  O.lanting = function () {
    var txt = '永和九年歲在癸丑暮春之初會于會稽山陰之蘭亭脩稧事也羣賢畢至少長咸集此地有崇山峻領茂林脩竹又有清流激湍映帶左右引以爲流觴曲水列坐其次雖無絲竹管弦之盛一觴一詠亦足以暢敘幽情是日也天朗氣清惠風和暢仰觀宇宙之大俯察品類之盛所以遊目騁懷足以極視聽之娛信可樂也';
    var cv = onPaper(2048, 560, [206, 188, 150], [226, 210, 176], function (c, w, h) {
      // 위아래 칸 줄
      c.strokeStyle = 'rgba(120,80,40,0.35)'; c.lineWidth = 2; for (var x = w - 40; x > 200; x -= 54) { c.beginPath(); c.moveTo(x, 30); c.lineTo(x, h - 30); c.stroke(); }
      PT.vtext(c, txt, w - 67, 50, 44, 54, 10, '#17120d', '"Noto Serif CJK TC"', 4);
      // 감상인들의 붉은 인장
      for (var i = 0; i < 14; i++) PT.seal(c, T.rr(40, w - 80), T.rr(20, h - 80), T.rr(34, 56), T.pick(['神品', '乾隆', '御覽', '鑑賞', '三希', '宣和']));
    });
    var g = handscroll(cv, 1.25, 0.34, { border: 0x6a4a20 });
    g.userData = { elev: 42, views: SWAY };
    return g;
  };

  /* ---------------- 청명상하도 */
  O.qingming = function () {
    var cv = onPaper(2400, 520, [196, 176, 134], [214, 196, 156], function (c, w, h) {
      var ink = 'rgba(40,32,24,', river = h * 0.55;
      // 강
      c.fillStyle = 'rgba(150,140,110,0.45)'; c.beginPath(); c.moveTo(0, river - 40); c.quadraticCurveTo(w * 0.5, river - 90, w, river - 30); c.lineTo(w, river + 90); c.quadraticCurveTo(w * 0.5, river + 60, 0, river + 110); c.fill();
      c.strokeStyle = ink + '0.3)'; c.lineWidth = 1; for (var i = 0; i < 80; i++) { var x = T.rnd() * w, y = river + T.rr(-30, 80); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 15, y - 4, x + 30, y); c.stroke(); }
      // 무지개다리
      var bx = w * 0.5; c.strokeStyle = ink + '0.85)'; c.lineWidth = 6; c.beginPath(); c.moveTo(bx - 220, river + 20); c.quadraticCurveTo(bx, river - 170, bx + 220, river + 20); c.stroke();
      c.lineWidth = 2; for (var k = -200; k <= 200; k += 14) { var yy = river + 20 - 170 * (1 - Math.pow(k / 220, 2)) * 0.5; c.beginPath(); c.moveTo(bx + k, yy); c.lineTo(bx + k, yy + 26); c.stroke(); }
      for (k = 0; k < 60; k++) { var px = bx + T.rr(-180, 180), py = river + 10 - 170 * (1 - Math.pow((px - bx) / 220, 2)) * 0.5 - 8; c.fillStyle = T.pick([ink + '0.9)', 'rgba(150,60,40,0.8)', 'rgba(60,80,110,0.8)']); c.fillRect(px, py - 10, 4, 10); c.beginPath(); c.arc(px + 2, py - 12, 3, 0, 7); c.fill(); }
      // 배
      [[w * 0.32, river + 30, 1], [w * 0.62, river + 50, -1], [w * 0.78, river + 20, 1], [w * 0.15, river + 60, -1]].forEach(function (b) {
        c.fillStyle = 'rgba(110,80,50,0.9)'; c.beginPath(); c.moveTo(b[0] - 100, b[1]); c.lineTo(b[0] + 100, b[1]); c.lineTo(b[0] + 80, b[1] + 22); c.lineTo(b[0] - 85, b[1] + 22); c.fill();
        c.fillStyle = 'rgba(130,100,60,0.9)'; c.fillRect(b[0] - 60, b[1] - 34, 110, 34); c.strokeStyle = ink + '0.8)'; c.lineWidth = 2; c.strokeRect(b[0] - 60, b[1] - 34, 110, 34);
        c.beginPath(); c.moveTo(b[0] + b[2] * 20, b[1] - 34); c.lineTo(b[0] + b[2] * 30, b[1] - 150); c.stroke();
      });
      // 길가 집·나무·사람
      for (i = 0; i < 26; i++) {
        var hx = T.rr(0, w), hy = T.pick([river - 120, river - 70, river + 150]) + T.rr(-15, 15);
        if (Math.abs(hx - bx) < 240 && hy < river) continue;
        c.fillStyle = 'rgba(170,150,110,0.95)'; c.fillRect(hx, hy, 90, 44); c.fillStyle = 'rgba(70,64,56,0.95)'; c.beginPath(); c.moveTo(hx - 12, hy + 4); c.lineTo(hx + 45, hy - 26); c.lineTo(hx + 102, hy + 4); c.fill();
        c.strokeStyle = ink + '0.8)'; c.lineWidth = 1.5; c.strokeRect(hx, hy, 90, 44); c.fillStyle = 'rgba(60,40,30,0.8)'; c.fillRect(hx + 30, hy + 18, 20, 26);
      }
      for (i = 0; i < 30; i++) { var tx = T.rr(0, w), ty = T.pick([40, 70, river - 160, h - 40]); c.strokeStyle = ink + '0.85)'; c.lineWidth = 4; c.beginPath(); c.moveTo(tx, ty + 60); c.quadraticCurveTo(tx + 8, ty + 20, tx - 4, ty); c.stroke(); for (k = 0; k < 6; k++) PT.blob(c, tx + T.rr(-30, 30), ty + T.rr(-20, 20), 20, 14, 'rgba(70,90,60,0.6)', 0.5); }
      for (i = 0; i < 220; i++) { var mx = T.rr(0, w), my = T.pick([river - 80, river - 30, river + 200, h - 60]) + T.rr(-10, 10); c.fillStyle = T.pick([ink + '0.9)', 'rgba(150,60,40,0.85)', 'rgba(70,90,120,0.85)', 'rgba(200,190,160,0.9)']); c.fillRect(mx, my - 12, 4, 12); c.fillStyle = ink + '0.9)'; c.beginPath(); c.arc(mx + 2, my - 14, 3, 0, 7); c.fill(); }
      PT.seal(c, w - 90, h - 100, 60, '宣和');
    });
    var g = handscroll(cv, 1.5, 0.3, { border: 0x7a5a2a });
    g.userData = { elev: 42, views: SWAY };
    return g;
  };

  /* ---------------- 훈민정음 해례본 */
  O.hunmin = function () {
    function pg(c, w, h, text, jamo) {
      c.strokeStyle = 'rgba(30,24,18,0.75)'; c.lineWidth = 4; c.strokeRect(40, 50, w - 80, h - 100);
      c.lineWidth = 1.2; for (var x = w - 40; x > 40; x -= (w - 80) / 8) { c.beginPath(); c.moveTo(x, 50); c.lineTo(x, h - 50); c.stroke(); }
      PT.vtext(c, text, w - 40 - (w - 80) / 16, 70, 48, (w - 80) / 8, 13, '#15100c', '"Noto Serif CJK KR"');
      if (jamo) { c.font = 'bold 60px "Noto Serif CJK KR"'; c.fillStyle = '#15100c'; c.fillText(jamo, 60, 120); }
    }
    var L = onPaper(720, 1000, [218, 200, 160], [234, 220, 186], function (c, w, h) { pg(c, w, h, '國之語音異乎中國與文字不相流通故愚民有所欲言而終不得伸其情者多矣予爲此憫然新制二十八字欲使人人易習便於日用耳', ''); PT.seal(c, 70, 840, 80, '朝鮮王寶'); });
    var R = onPaper(720, 1000, [218, 200, 160], [234, 220, 186], function (c, w, h) { pg(c, w, h, 'ㄱ牙音如君字初發聲並書如虯字初發聲ㅋ牙音如快字初發聲ㆁ牙音如業字初發聲ㄷ舌音如斗字初發聲並書如覃字初發聲ㅌ舌音如呑字初發聲ㄴ舌音如那字初發聲', ''); });
    return openBook(L, R, 0.36, 0.5, { cover: M.cloth({ color: 0xc8a050 }) });
  };

  /* ---------------- 바부르나마 · 샤나메 (세밀화 + 글) */
  function miniatureBook(scene) {
    var gold = '#c89a3a';
    function border(c, w, h) { c.strokeStyle = gold; c.lineWidth = 10; c.strokeRect(50, 60, w - 100, h - 120); c.strokeStyle = '#1a3a7a'; c.lineWidth = 3; c.strokeRect(64, 74, w - 128, h - 148); }
    function script(c, x0, y0, x1, y1) {
      c.strokeStyle = '#1a120c'; c.lineWidth = 3; c.lineCap = 'round';
      for (var y = y0; y < y1; y += 34) {
        var x = x1;
        while (x > x0 + 20) { var l = T.rr(18, 46); c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x - l * 0.3, y - T.rr(4, 14), x - l * 0.7, y + T.rr(2, 10), x - l, y + T.rr(-3, 3)); c.stroke(); if (T.rnd() < 0.4) { c.fillStyle = '#1a120c'; c.beginPath(); c.arc(x - l * 0.5, y - 14, 2.4, 0, 7); c.fill(); } x -= l + T.rr(6, 14); }
      }
    }
    var L = onPaper(720, 1000, [226, 214, 186], [238, 228, 204], function (c, w, h) { border(c, w, h); scene(c, 76, 86, w - 152, h - 300); script(c, 80, h - 190, w - 80, h - 80); });
    var R = onPaper(720, 1000, [226, 214, 186], [238, 228, 204], function (c, w, h) { border(c, w, h); script(c, 80, 110, w - 80, h - 100); c.fillStyle = gold; c.fillRect(w / 2 - 120, 300, 240, 50); c.fillStyle = '#1a3a7a'; c.fillRect(w / 2 - 110, 308, 220, 34); });
    return openBook(L, R, 0.36, 0.5, { cover: M.cloth({ color: 0x5a1410 }) });
  }
  O.baburnama = function () {
    return miniatureBook(function (c, x, y, w, h) {
      // 사분 정원(차하르 바그): 물길과 꽃밭, 정자, 바부르와 신하들
      c.fillStyle = '#4f7a3a'; c.fillRect(x, y, w, h);
      c.fillStyle = '#e8d8a8'; c.fillRect(x, y, w, h * 0.18); c.fillStyle = '#9ab8d8'; c.fillRect(x, y, w, h * 0.12);
      c.fillStyle = '#5a8ac0'; c.fillRect(x + w / 2 - 14, y + h * 0.25, 28, h * 0.75); c.fillRect(x, y + h * 0.6 - 14, w, 28);
      for (var i = 0; i < 60; i++) { c.fillStyle = T.pick(['#d84a3a', '#f0e070', '#f4f0e8', '#b04a90']); c.beginPath(); c.arc(x + T.rnd() * w, y + h * 0.3 + T.rnd() * h * 0.7, 4, 0, 7); c.fill(); }
      for (i = 0; i < 6; i++) { var tx = x + 40 + i * (w - 80) / 5; c.fillStyle = '#2a4a2a'; c.beginPath(); c.ellipse(tx, y + h * 0.24, 22, 50, 0, 0, 7); c.fill(); }
      c.fillStyle = '#e8e0d0'; c.fillRect(x + w * 0.62, y + h * 0.28, w * 0.28, h * 0.22); c.fillStyle = '#c89a3a'; c.fillRect(x + w * 0.6, y + h * 0.26, w * 0.32, 10);
      PT.person(c, { x: x + w * 0.76, y: y + h * 0.48, h: 80, robe: '#d9a040', skin: '#c8906a', hat: '#f4f0e8', sit: true });
      [[0.2, '#a02020'], [0.32, '#2a5aa0'], [0.44, '#e0c040']].forEach(function (p) { PT.person(c, { x: x + w * p[0], y: y + h * 0.82, h: 90, robe: p[1], skin: '#c8906a', hat: '#f4f0e8' }); });
    });
  };
  O.shahnameh = function () {
    return miniatureBook(function (c, x, y, w, h) {
      // 가유마르스의 궁정: 무지갯빛 바위산과 표범 가죽 옷 입은 사람들
      c.fillStyle = '#c8a040'; c.fillRect(x, y, w, h * 0.2);
      var cols = ['#7a5aa0', '#d07050', '#4a8a7a', '#b0a050', '#5a7ab8', '#c86080', '#6aa060'];
      for (var i = 0; i < 36; i++) {
        var cx = x + T.rnd() * w, cy = y + h * 0.12 + i / 36 * h * 0.8, r = T.rr(45, 100);
        c.fillStyle = T.pick(cols); c.beginPath();
        for (var k = 0; k < 9; k++) { var a = k / 9 * Math.PI * 2, rr = r * T.rr(0.6, 1.1); c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.8); }
        c.fill(); c.strokeStyle = 'rgba(40,30,20,0.4)'; c.lineWidth = 1.5; c.stroke();
      }
      for (i = 0; i < 9; i++) PT.person(c, { x: x + T.rr(40, w - 40), y: y + T.rr(h * 0.4, h * 0.95), h: T.rr(50, 80), robe: T.pick(['#d9a040', '#c06030', '#e0d0a0']), skin: '#d8a070', hair: '#2a1a10' });
      PT.person(c, { x: x + w / 2, y: y + h * 0.36, h: 90, robe: '#c89a3a', skin: '#d8a070', sit: true, halo: '#f4d060' });
    });
  };

  /* ---------------- 마야 코덱스 (접는 책) */
  O.mayacodex = function () {
    var g = T.group(), n = 6, pw = 0.18, ph = 0.46;
    for (var i = 0; i < n; i++) {
      var cv = onPaper(256, 640, [214, 200, 168], [232, 220, 192], function (c, w, h) {
        c.strokeStyle = '#b02a1a'; c.lineWidth = 4; [0.33, 0.66].forEach(function (t) { c.beginPath(); c.moveTo(10, h * t); c.lineTo(w - 10, h * t); c.stroke(); });
        for (var band = 0; band < 3; band++) {
          var y0 = band * h / 3 + 16;
          if ((i + band) % 2 === 0) { // 글자 블록
            for (var r = 0; r < 3; r++) for (var q = 0; q < 2; q++) {
              var bx = 22 + q * 112, by = y0 + 12 + r * 64; c.fillStyle = T.pick(['#e8d8b0', '#c8d8b8', '#e0c8a0']); c.fillRect(bx, by, 96, 54);
              c.strokeStyle = '#1a1410'; c.lineWidth = 3; c.strokeRect(bx, by, 96, 54); c.beginPath(); c.arc(bx + 30, by + 27, 12, 0, 7); c.stroke(); c.fillStyle = '#b02a1a'; c.fillRect(bx + 52, by + 12, 30, 12); c.beginPath(); c.arc(bx + 68, by + 38, 6, 0, 7); c.fill();
            }
          } else { // 앉은 신
            c.fillStyle = '#c84a2a'; c.fillRect(70, y0 + 80, 100, 90); c.fillStyle = '#d8a070'; c.beginPath(); c.arc(120, y0 + 60, 30, 0, 7); c.fill(); c.strokeStyle = '#1a1410'; c.lineWidth = 3; c.stroke();
            c.fillStyle = '#2a7a7a'; c.beginPath(); c.moveTo(80, y0 + 40); c.lineTo(120, y0 + 0); c.lineTo(160, y0 + 40); c.fill();
            c.fillStyle = '#1a1410'; for (var d = 0; d < 4; d++) { c.beginPath(); c.arc(30, y0 + 40 + d * 30, 6, 0, 7); c.fill(); }
            c.fillRect(24, y0 + 170, 30, 6); c.fillRect(24, y0 + 180, 30, 6);
          }
        }
      });
      var p = T.mesh(new THREE.PlaneGeometry(pw, ph), M.paper({ map: T.tex(cv), roughness: 0.75 }));
      var a = (i % 2 ? -1 : 1) * 0.5, x = (i - (n - 1) / 2) * pw * Math.cos(0.5);
      p.position.set(x, ph / 2 + 0.03, (i % 2) * pw * Math.sin(0.5) - 0.04); p.rotation.y = a;
      g.add(p);
    }
    g.add(T.mesh(new THREE.BoxGeometry(1.0, 0.03, 0.34), M.lacquer({ color: 0x140a06 }), 0, 0.015, 0));
    g.userData = { elev: 10, views: SWAY };
    return g;
  };

  /* ---------------- 피리 레이스 지도 */
  O.pirireis = function () {
    var cv = T.canvas(1400, 1800, function (c, w, h) {
      var bg = paperTex(700, 900, [196, 164, 110], [222, 196, 146], 50); c.drawImage(bg, 0, 0, w, h);
      // 오른쪽 위로 비스듬히 찢긴 가죽 (남은 왼쪽 조각)
      // 이베리아·아프리카 해안 (오른쪽)
      function coast(pts, fill) { c.fillStyle = fill; c.strokeStyle = '#3a2a18'; c.lineWidth = 3; PT.curve(c, pts, '#3a2a18', 3, fill); }
      coast([[w, 120], [w * 0.86, 160], [w * 0.8, 300], [w * 0.84, 420], [w * 0.78, 560], [w * 0.74, 700], [w * 0.82, 820], [w * 0.88, 1000], [w * 0.9, 1250], [w, 1300]], 'rgba(170,140,90,0.55)');
      // 남아메리카 (왼쪽 아래, 남극 쪽으로 휘어짐)
      coast([[0, 700], [w * 0.2, 720], [w * 0.36, 820], [w * 0.4, 980], [w * 0.3, 1120], [w * 0.36, 1280], [w * 0.5, 1420], [w * 0.62, 1560], [w * 0.7, 1700], [w * 0.66, h], [0, h]], 'rgba(170,140,90,0.55)');
      // 산맥·강·동물
      c.fillStyle = '#7a5a3a'; for (var i = 0; i < 18; i++) { var mx = T.rr(30, w * 0.3), my = T.rr(820, 1600); c.beginPath(); c.moveTo(mx - 18, my); c.lineTo(mx, my - 30); c.lineTo(mx + 18, my); c.fill(); }
      c.strokeStyle = '#4a7aa0'; c.lineWidth = 4; c.beginPath(); c.moveTo(w * 0.36, 900); c.quadraticCurveTo(w * 0.2, 960, 40, 920); c.stroke();
      // 섬들 (카리브)
      for (i = 0; i < 16; i++) { c.fillStyle = T.pick(['#b03020', '#3a7a3a', '#c8a040']); c.beginPath(); c.ellipse(T.rr(w * 0.2, w * 0.55), T.rr(300, 650), T.rr(10, 40), T.rr(6, 18), T.rnd(), 0, 7); c.fill(); }
      // 나침도와 방위선
      [[w * 0.5, 700], [w * 0.62, 1300], [w * 0.2, 350]].forEach(function (p) {
        for (var k = 0; k < 32; k++) { var a = k / 32 * Math.PI * 2; c.strokeStyle = k % 4 === 0 ? 'rgba(40,30,20,0.55)' : k % 2 ? 'rgba(170,40,30,0.4)' : 'rgba(40,110,60,0.4)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] + Math.cos(a) * 1600, p[1] + Math.sin(a) * 1600); c.stroke(); }
        c.fillStyle = '#c89a3a'; c.beginPath(); for (k = 0; k < 16; k++) { var a2 = k / 16 * Math.PI * 2, rr = k % 2 ? 18 : 50; c.lineTo(p[0] + Math.cos(a2) * rr, p[1] + Math.sin(a2) * rr); } c.fill(); c.strokeStyle = '#3a2a18'; c.lineWidth = 2; c.stroke();
      });
      // 배 두 척
      [[w * 0.6, 520], [w * 0.5, 1100]].forEach(function (s) { c.fillStyle = '#5a3a20'; c.beginPath(); c.moveTo(s[0] - 50, s[1]); c.lineTo(s[0] + 50, s[1]); c.lineTo(s[0] + 36, s[1] + 20); c.lineTo(s[0] - 40, s[1] + 20); c.fill(); c.fillStyle = '#f0e6d0'; c.fillRect(s[0] - 20, s[1] - 60, 36, 50); c.strokeStyle = '#3a2a18'; c.strokeRect(s[0] - 20, s[1] - 60, 36, 50); });
      // 주석 글 (붉은·검은 글씨 줄)
      for (i = 0; i < 10; i++) { var tx = T.rr(60, w - 300), ty = T.rr(100, h - 100); c.fillStyle = 'rgba(240,230,200,0.7)'; c.fillRect(tx, ty, 220, 70); c.strokeStyle = i % 3 ? '#2a1a10' : '#9a2a1a'; c.lineWidth = 2; for (var l = 0; l < 4; l++) { c.beginPath(); c.moveTo(tx + 200, ty + 14 + l * 15); for (var q = 0; q < 8; q++) c.quadraticCurveTo(tx + 190 - q * 24, ty + 6 + l * 15, tx + 180 - q * 24, ty + 14 + l * 15); c.stroke(); } }
      T.paint.age(c, w, h, { tint: 'rgba(210,180,120,0.25)', cracks: 60 });
    });
    // 가죽 가장자리: 오른쪽 위가 비스듬히 잘린 모양
    var geo = T.relief(T.canvas(8, 8, function (c) { c.fillStyle = '#000'; c.fillRect(0, 0, 8, 8); }), 0.7, 0.9, 70, 90, 0, function (u, v) { return v < 1.25 - u * 0.7 + 0.02 * Math.sin(u * 40) && u > 0.01 + 0.01 * Math.sin(v * 50) && v > 0.01; });
    T.warp(geo, function (v) { v.z = 0.01 * T.noise(v.x * 6, v.y * 6); });
    var map = T.mesh(geo, M.paper({ map: T.tex(cv), roughness: 0.75 }), 0, 0.53, 0.01);
    var g = T.group(map);
    g.add(T.mesh(new THREE.BoxGeometry(0.8, 1.0, 0.03), M.cloth({ color: 0x1a2030 }), 0, 0.53, -0.01));
    g.add(T.mesh(new THREE.BoxGeometry(0.86, 1.06, 0.02), M.gilt({ roughness: 0.4 }), 0, 0.53, -0.03));
    g.add(T.mesh(new THREE.BoxGeometry(0.5, 0.04, 0.3), M.lacquer(), 0, 0.02, -0.05));
    g.userData = { elev: 4, views: SWAY };
    return g;
  };

  /* ---------------- 천마도 (자작나무 껍질 말다래) */
  O.cheonmado = function () {
    var cv = T.canvas(1400, 1000, function (c, w, h) {
      var bg = paperTex(700, 500, [120, 72, 40], [150, 96, 56], 24); c.drawImage(bg, 0, 0, w, h);
      for (var i = 0; i < 160; i++) { c.strokeStyle = 'rgba(60,30,14,0.35)'; c.lineWidth = T.rr(1, 3); var y = T.rnd() * h; c.beginPath(); c.moveTo(T.rnd() * w, y); c.lineTo(T.rnd() * w, y + T.rr(-4, 4)); c.stroke(); }
      // 테두리: 인동 넝쿨 무늬
      c.strokeStyle = '#e8dcc0'; c.lineWidth = 8; c.strokeRect(50, 50, w - 100, h - 100); c.strokeRect(110, 110, w - 220, h - 220);
      c.lineWidth = 5; for (var x = 80; x < w - 60; x += 70) { c.beginPath(); c.arc(x, 80, 20, Math.PI, 0); c.stroke(); c.beginPath(); c.arc(x + 35, h - 80, 20, 0, Math.PI); c.stroke(); }
      for (var y2 = 120; y2 < h - 100; y2 += 70) { c.beginPath(); c.arc(80, y2, 20, -Math.PI / 2, Math.PI / 2); c.stroke(); c.beginPath(); c.arc(w - 80, y2 + 35, 20, Math.PI / 2, Math.PI * 1.5); c.stroke(); }
      // 하얀 천마
      c.save(); c.translate(w * 0.5, h * 0.55); c.fillStyle = '#f2ecdc'; c.strokeStyle = '#3a2214'; c.lineWidth = 4;
      c.beginPath(); c.ellipse(0, 0, 230, 80, -0.08, 0, 7); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(170, -40); c.quadraticCurveTo(240, -140, 300, -170); c.lineTo(350, -150); c.quadraticCurveTo(320, -100, 250, -10); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.ellipse(330, -170, 50, 26, 0.4, 0, 7); c.fill(); c.stroke();
      c.fillStyle = '#3a2214'; c.beginPath(); c.arc(340, -180, 5, 0, 7); c.fill();
      // 불꽃 같은 갈기·꼬리, 혀
      c.fillStyle = '#f2ecdc';
      for (i = 0; i < 6; i++) { c.beginPath(); c.moveTo(220 + i * 18, -60 - i * 20); c.quadraticCurveTo(170 + i * 10, -120 - i * 20, 150 + i * 6, -170 - i * 10); c.lineTo(240 + i * 18, -80 - i * 20); c.fill(); c.stroke(); }
      for (i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-220, -10 + i * 8); c.quadraticCurveTo(-320, -90 + i * 30, -420, -140 + i * 40); c.lineTo(-400, -110 + i * 40); c.quadraticCurveTo(-300, -50 + i * 20, -215, 15 + i * 8); c.fill(); c.stroke(); }
      c.fillStyle = '#c8402a'; c.beginPath(); c.moveTo(370, -160); c.quadraticCurveTo(430, -150, 470, -190); c.lineTo(375, -150); c.fill();
      // 다리: 달리며 날기
      c.fillStyle = '#f2ecdc'; c.lineWidth = 4;
      [[140, 50, 260, 140], [100, 50, 60, 170], [-150, 40, -260, 120], [-120, 50, -60, 180]].forEach(function (l) { c.beginPath(); c.moveTo(l[0] - 18, l[1]); c.quadraticCurveTo((l[0] + l[2]) / 2 + 30, (l[1] + l[3]) / 2, l[2], l[3]); c.lineTo(l[2] + 26, l[3] - 4); c.quadraticCurveTo((l[0] + l[2]) / 2 + 50, (l[1] + l[3]) / 2, l[0] + 18, l[1]); c.fill(); c.stroke(); });
      // 몸의 반달 무늬
      c.strokeStyle = 'rgba(60,40,24,0.6)'; c.lineWidth = 3; for (i = 0; i < 9; i++) { c.beginPath(); c.arc(-150 + i * 38, -10 + (i % 2) * 20, 14, 0.2, Math.PI - 0.2); c.stroke(); }
      c.restore();
      // 구름
      for (i = 0; i < 8; i++) { var cx = T.rr(160, w - 160), cy = T.pick([200, h - 210]); c.strokeStyle = '#e8dcc0'; c.lineWidth = 6; c.beginPath(); c.arc(cx, cy, 24, 0, Math.PI * 1.6); c.stroke(); c.beginPath(); c.moveTo(cx + 24, cy); c.quadraticCurveTo(cx + 60, cy + 20, cx + 100, cy); c.stroke(); }
      T.paint.age(c, w, h, { tint: 'rgba(200,160,110,0.25)', cracks: 160, crack: 0.3 });
    });
    var g = T.framed(cv, 0.84, 0.6, { fw: 0.0 });
    g.position.y = 0.42;
    var outer = T.group(g);
    outer.add(T.mesh(new THREE.BoxGeometry(1.0, 0.76, 0.03), M.cloth({ color: 0x14141c }), 0, 0.42, -0.05));
    outer.add(T.mesh(new THREE.BoxGeometry(0.5, 0.04, 0.3), M.lacquer(), 0, 0.02, -0.05));
    outer.userData = { elev: 4, views: SWAY };
    return outer;
  };
})(T3);
