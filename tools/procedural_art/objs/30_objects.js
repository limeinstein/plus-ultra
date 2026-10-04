/* 공예·무기·돌 유물 */
(function (T) {
  var O = T.OBJ, PT = T.paint, M = T.mat;
  var V3 = function (x, y, z) { return new THREE.Vector3(x, y, z); };
  function gray(v) { v = Math.round(v * 255); return 'rgb(' + v + ',' + v + ',' + v + ')'; }
  function stoneTex(w, h, c1, c2, sc) {
    return T.pixels(w, h, function (x, y) { var n = 0.5 + 0.5 * T.fbm(x / (sc || 30), y / (sc || 30), 0.7, 5), s = T.rnd() * 18 - 9; return [c1[0] + (c2[0] - c1[0]) * n + s, c1[1] + (c2[1] - c1[1]) * n + s, c1[2] + (c2[2] - c1[2]) * n + s]; });
  }
  function mixMaps(colorCanvas, heightCanvas, dark) { // 오목한 곳은 어둡게
    return T.canvas(colorCanvas.width, colorCanvas.height, function (g, w, h) {
      g.drawImage(colorCanvas, 0, 0);
      g.globalCompositeOperation = 'multiply';
      g.globalAlpha = dark || 0.55;
      g.drawImage(heightCanvas, 0, 0, w, h);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    });
  }
  function base(w, d, h, mat) { return T.mesh(new THREE.BoxGeometry(w, h, d), mat || M.lacquer(), 0, h / 2, 0); }
  var SWAY = [0, 16, 30, 16, 0, -16, -30, -16];

  /* ---------------- 전국옥새 */
  O.hanseal = function () {
    var g = T.group(), jade = M.jade({ color: 0xe6ead0, roughness: 0.18, sheenColor: new THREE.Color(0xffffff) });
    var s = 0.42, h = 0.24;
    var body = T.extrude([[-s / 2, -s / 2], [s / 2, -s / 2], [s / 2, s / 2], [-s / 2, s / 2]], h, 0.015);
    body.rotateX(-Math.PI / 2);
    var bm = T.mesh(body, jade, 0, h / 2 + 0.1, 0); g.add(bm);
    // 깨진 한 모서리를 금으로 메움
    g.add(T.mesh(new THREE.BoxGeometry(0.1, h + 0.02, 0.1), M.gold({ roughness: 0.25 }), s / 2 - 0.045, h / 2 + 0.1, s / 2 - 0.045));
    // 서로 얽힌 다섯 용 손잡이
    for (var k = 0; k < 5; k++) {
      var pts = [], a0 = k / 5 * Math.PI * 2;
      for (var t = 0; t <= 1.0001; t += 0.1) { var a = a0 + t * 2.6, r = 0.17 * (1 - t * 0.55); pts.push([Math.cos(a) * r, h + 0.1 + 0.015 + Math.sin(t * Math.PI) * 0.16 + t * 0.05, Math.sin(a) * r]); }
      g.add(T.mesh(T.taperTube(pts, function (q) { return 0.028 * (1 - q * 0.5) + 0.01; }, 40, 10), jade));
      var hd = pts[pts.length - 1], head = T.mesh(new THREE.SphereGeometry(0.032, 16, 12), jade, hd[0], hd[1] + 0.01, hd[2]); head.scale.set(1.3, 0.9, 1); g.add(head);
      g.add(T.mesh(new THREE.ConeGeometry(0.008, 0.05, 8), jade, hd[0], hd[1] + 0.05, hd[2]));
    }
    g.add(base(1.0, 0.8, 0.1, M.lacquer({ color: 0x2a0806 })));
    // 앞에 찍어 둔 인영 (受命於天 旣壽永昌)
    var cv = T.canvas(512, 512, function (c, w, hh) {
      c.fillStyle = '#efe6d2'; c.fillRect(0, 0, w, hh);
      c.fillStyle = '#b4221c'; c.fillRect(70, 70, 372, 372); c.fillStyle = '#efe6d2'; c.fillRect(86, 86, 340, 340); c.fillStyle = '#b4221c';
      c.font = 'bold 80px "Noto Serif CJK TC"'; c.textAlign = 'center'; c.textBaseline = 'middle';
      var txt = ['受命', '於天', '旣壽', '永昌'];
      txt.forEach(function (col, i) { Array.from(col).forEach(function (ch, j) { c.fillText(ch, 384 - i * 86, 170 + j * 170); }); });
      c.globalCompositeOperation = 'destination-out'; for (var q = 0; q < 900; q++) { c.fillStyle = 'rgba(0,0,0,' + T.rr(0.1, 0.5) + ')'; c.fillRect(T.rnd() * w, T.rnd() * hh, 3, 3); }
    });
    var paper = T.mesh(new THREE.PlaneGeometry(0.36, 0.36), M.paper({ map: T.tex(cv) }), 0, 0.103, 0.33); paper.rotation.x = -Math.PI / 2; paper.userData.noFit = true; g.add(paper);
    g.userData = { elev: 22 };
    return g;
  };

  /* ---------------- 관우의 청룡언월도 */
  O.guanyublade = function () {
    var g = T.group(), steel = M.silver({ color: 0xc8ccd2, roughness: 0.18 }), gold = M.gold({ roughness: 0.28 });
    var pole = T.mesh(new THREE.CylinderGeometry(0.022, 0.026, 1.7, 20), M.lacquer({ color: 0x5a0a08 }), 0, 0.85 + 0.08, 0); g.add(pole);
    [0.3, 0.6, 0.9, 1.2, 1.5].forEach(function (y) { g.add(T.mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 20), gold, 0, y, 0)); });
    g.add(T.mesh(new THREE.ConeGeometry(0.03, 0.12, 16), gold, 0, 0.12, 0).rotateX(Math.PI));
    // 반달 칼날
    var sh = new THREE.Shape();
    sh.moveTo(-0.02, 0); sh.lineTo(0.05, 0); sh.quadraticCurveTo(0.1, 0.2, 0.08, 0.42); sh.quadraticCurveTo(0.05, 0.58, -0.06, 0.68);
    sh.quadraticCurveTo(-0.02, 0.5, -0.16, 0.36); sh.quadraticCurveTo(-0.2, 0.3, -0.24, 0.22); sh.quadraticCurveTo(-0.12, 0.2, -0.06, 0.12); sh.lineTo(-0.02, 0);
    var blade = T.mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.01, bevelSegments: 2, curveSegments: 32 }), steel, 0, 1.82, -0.006);
    g.add(blade);
    // 날 밑의 용머리
    var hx = -0.02, hy = 1.82;
    var head = T.mesh(new THREE.SphereGeometry(0.05, 20, 14), gold, hx, hy, 0); head.scale.set(1.5, 1, 0.9); g.add(head);
    var snout = T.mesh(new THREE.ConeGeometry(0.035, 0.12, 12), gold, hx - 0.1, hy + 0.02, 0); snout.rotation.z = Math.PI / 2; g.add(snout);
    [-1, 1].forEach(function (sd) { g.add(T.mesh(T.tube([[hx + 0.03, hy + 0.03, sd * 0.02], [hx + 0.08, hy + 0.1, sd * 0.03], [hx + 0.14, hy + 0.12, sd * 0.03]], 0.008, 12, 6), gold)); });
    g.add(T.mesh(new THREE.SphereGeometry(0.012, 10, 8), M.cabochon(0x20a050), hx - 0.04, hy + 0.025, 0.04));
    g.add(T.mesh(new THREE.SphereGeometry(0.012, 10, 8), M.cabochon(0x20a050), hx - 0.04, hy + 0.025, -0.04));
    // 붉은 술
    var tas = [];
    for (var i = 0; i < 40; i++) { var a = T.rnd() * Math.PI * 2; tas.push({ p: [Math.cos(a) * 0.02, 1.68 - T.rr(0, 0.04), Math.sin(a) * 0.02], s: [1, T.rr(0.8, 1.1), 1], r: [Math.sin(a) * 0.15, 0, Math.cos(a) * 0.15] }); }
    var strand = new THREE.CylinderGeometry(0.004, 0.006, 0.16, 5); strand.translate(0, -0.08, 0);
    g.add(T.inst(strand, M.cloth({ color: 0xb01010 }), tas));
    g.add(T.mesh(new THREE.SphereGeometry(0.03, 12, 10), M.cloth({ color: 0xb01010 }), 0, 1.69, 0));
    // 받침대
    g.add(base(0.42, 0.42, 0.08, M.lacquer({ color: 0x1a0a06 })));
    g.add(T.mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.06, 20), gold, 0, 0.11, 0));
    g.userData = { elev: 6 };
    return g;
  };

  /* ---------------- 성창 */
  O.holylance = function () {
    var g = T.group(), iron = M.iron({ color: 0x4a4744, roughness: 0.5 });
    var sh = new THREE.Shape();
    sh.moveTo(0, 0.62); sh.quadraticCurveTo(0.09, 0.42, 0.075, 0.2); sh.quadraticCurveTo(0.06, 0.08, 0.035, 0.0); sh.lineTo(-0.035, 0); sh.quadraticCurveTo(-0.06, 0.08, -0.075, 0.2); sh.quadraticCurveTo(-0.09, 0.42, 0, 0.62);
    var hole = new THREE.Path(); hole.moveTo(0, 0.4); hole.lineTo(0.012, 0.3); hole.lineTo(0.012, 0.1); hole.lineTo(-0.012, 0.1); hole.lineTo(-0.012, 0.3); hole.closePath(); sh.holes.push(hole);
    var blade = T.mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.012, bevelSegments: 3, curveSegments: 24 }), iron, 0, 0.42, -0.006);
    g.add(blade);
    // 가운데 못과 감은 철사, 금 덮개
    g.add(T.mesh(new THREE.CylinderGeometry(0.006, 0.004, 0.32, 8), M.iron({ color: 0x2e2a28 }), 0, 0.42 + 0.25, 0));
    [0.53, 0.56, 0.59].forEach(function (y) { g.add(T.mesh(new THREE.TorusGeometry(0.017, 0.004, 6, 20), M.silver({ color: 0xb8b0a0 }), 0, y, 0)); });
    var sleeve = T.mesh(new THREE.CylinderGeometry(0.042, 0.05, 0.2, 32, 1, true), M.gold({ roughness: 0.22, side: THREE.DoubleSide }), 0, 0.6, 0); g.add(sleeve);
    var cv = T.canvas(512, 128, function (c, w, h) { c.fillStyle = '#d9a84a'; c.fillRect(0, 0, w, h); c.fillStyle = '#7a4e14'; c.font = 'bold 30px serif'; c.fillText('LANCEA ET CLAVVS DOMINI', 10, 72); });
    sleeve.material.map = T.tex(cv); sleeve.material.color = new THREE.Color(0xffffff);
    g.add(T.mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.16, 20), iron, 0, 0.36, 0));
    g.add(T.mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.3, 16), M.wood({ color: 0x3a2412 }), 0, 0.15, 0));
    // 붉은 벨벳 받침
    var back = T.mesh(new THREE.BoxGeometry(0.42, 1.2, 0.04), M.cloth({ color: 0x5a0c14 }), 0, 0.6, -0.08); g.add(back);
    g.add(base(0.5, 0.3, 0.04, M.gold({ roughness: 0.3 })));
    g.userData = { elev: 4, views: SWAY };
    return g;
  };

  /* ---------------- 칭기즈 칸의 보물: 황금 안장 */
  O.genghis = function () {
    var g = T.group(), gold = M.gold({ roughness: 0.26 });
    // 안장 몸: 휜 판
    var seat = new THREE.BoxGeometry(0.8, 0.06, 0.5, 40, 2, 20);
    T.warp(seat, function (v) { var x = v.x / 0.4, z = v.z / 0.25; v.y += 0.12 * x * x - 0.1 * z * z; });
    g.add(T.mesh(seat, M.cloth({ color: 0x6a1010 }), 0, 0.42, 0));
    // 앞뒤 금판 (사슴 돋을새김)
    function plate(w, h) {
      var hc = T.canvas(256, 256, function (c, W, H) {
        c.fillStyle = gray(0.2); c.fillRect(0, 0, W, H);
        c.fillStyle = gray(0.9); c.beginPath(); c.ellipse(128, 150, 70, 34, 0, 0, 7); c.fill(); // 사슴 몸
        c.beginPath(); c.moveTo(170, 140); c.lineTo(200, 80); c.lineTo(215, 88); c.lineTo(190, 145); c.fill();
        c.lineWidth = 7; c.strokeStyle = gray(0.9); c.beginPath(); c.moveTo(205, 82); c.quadraticCurveTo(170, 30, 120, 40); c.moveTo(180, 60); c.lineTo(160, 30); c.moveTo(150, 45); c.lineTo(140, 15); c.stroke();
        [80, 110, 150, 175].forEach(function (x) { c.beginPath(); c.moveTo(x, 170); c.lineTo(x - 10, 215); c.stroke(); });
        c.lineWidth = 10; c.strokeStyle = gray(0.7); c.beginPath(); c.arc(128, 128, 118, 0, 7); c.stroke();
        for (var i = 0; i < 24; i++) { var a = i / 24 * 7; c.fillStyle = gray(0.85); c.beginPath(); c.arc(128 + Math.cos(a) * 104, 128 + Math.sin(a) * 104, 5, 0, 7); c.fill(); }
      });
      var geo = T.relief(T.blurCanvas(hc, 2), w, h, 96, 96, 0.025, function (u, v) { var x = u - 0.5, y = v - 0.5; return y < 0 || x * x + y * y < 0.25; });
      var m = M.gold({ roughness: 0.3 }); return T.mesh(geo, m);
    }
    var front = plate(0.36, 0.3); front.position.set(0, 0.58, 0.26); front.rotation.x = -0.2; g.add(front);
    var backp = plate(0.44, 0.34); backp.position.set(0, 0.6, -0.26); backp.rotation.set(0.25, Math.PI, 0); g.add(backp);
    g.add(T.mesh(new THREE.BoxGeometry(0.36, 0.28, 0.02), gold, 0, 0.56, 0.24).rotateX(-0.2));
    // 안장 깔개
    var cv = T.canvas(512, 256, function (c, w, h) { c.fillStyle = '#7a1a14'; c.fillRect(0, 0, w, h); c.strokeStyle = '#d9a84a'; c.lineWidth = 8; c.strokeRect(14, 14, w - 28, h - 28); for (var i = 0; i < 10; i++) { c.beginPath(); c.arc(40 + i * 48, 40, 10, 0, 7); c.stroke(); c.beginPath(); c.arc(40 + i * 48, h - 40, 10, 0, 7); c.stroke(); } });
    var blanket = new THREE.BoxGeometry(1.0, 0.012, 0.66, 40, 1, 12);
    T.warp(blanket, function (v) { var x = v.x / 0.5; v.y -= 0.3 * x * x; v.x *= 1 - 0.25 * x * x; });
    var bmat = M.cloth({ color: 0xffffff }); bmat.map = T.tex(cv);
    g.add(T.mesh(blanket, bmat, 0, 0.385, 0));
    // 등자
    [-1, 1].forEach(function (sd) {
      g.add(T.mesh(T.tube([[sd * 0.3, 0.38, 0], [sd * 0.33, 0.2, 0], [sd * 0.33, 0.1, 0]], 0.008, 12, 6), M.cloth({ color: 0x3a1a0a })));
      var st = T.mesh(new THREE.TorusGeometry(0.06, 0.012, 10, 24), gold, sd * 0.33, 0.06, 0); st.rotation.y = Math.PI / 2; g.add(st);
    });
    // 받침 나무 틀 + 금 허리띠 장식
    g.add(T.mesh(new THREE.BoxGeometry(0.1, 0.36, 0.6), M.wood({ color: 0x2a1a10 }), 0, 0.2, 0));
    g.add(base(0.9, 0.7, 0.04, M.lacquer()));
    for (var i = 0; i < 6; i++) { var p = T.mesh(new THREE.BoxGeometry(0.06, 0.008, 0.08), gold, -0.25 + i * 0.1, 0.045, 0.28); p.rotation.y = 0.05 * i; g.add(p); }
    g.userData = { elev: 14 };
    return g;
  };

  /* ---------------- 백제 금동대향로 */
  O.baekjecenser = function () {
    var g = T.group(), gm = M.gilt({ roughness: 0.42, color: 0xc7963e });
    // 용 받침: 똬리 + 머리를 들어 줄기를 묾
    var pts = [];
    for (var t = 0; t <= 1; t += 0.02) { var a = t * Math.PI * 4, r = 0.2 - t * 0.12; pts.push([Math.cos(a) * r, 0.04 + t * 0.2, Math.sin(a) * r]); }
    pts.push([0.0, 0.3, 0.02]);
    g.add(T.mesh(T.taperTube(pts, function (q) { return 0.04 * (1 - q * 0.4); }, 120, 12), gm));
    for (var i = 0; i < 5; i++) { var a2 = i / 5 * Math.PI * 2; g.add(T.mesh(T.tube([[Math.cos(a2) * 0.16, 0.06, Math.sin(a2) * 0.16], [Math.cos(a2) * 0.24, 0.02, Math.sin(a2) * 0.24]], 0.012, 6, 6), gm)); }
    var hd = T.mesh(new THREE.SphereGeometry(0.05, 20, 14), gm, 0.0, 0.3, 0.05); hd.scale.set(1, 0.8, 1.4); g.add(hd);
    // 연꽃 몸통
    var bowl = T.lathe(T.smoothProfile([[0.0, 0.33], [0.06, 0.33], [0.16, 0.38], [0.21, 0.46], [0.22, 0.52], [0.0, 0.52]], 40), 64);
    g.add(T.mesh(bowl, gm));
    var petal = new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2); petal.scale(0.045, 0.06, 0.012);
    var pl = [];
    for (var row = 0; row < 3; row++) for (i = 0; i < 12; i++) { var a3 = (i + row * 0.5) / 12 * Math.PI * 2, rr = 0.12 + row * 0.04, y = 0.36 + row * 0.05; pl.push({ p: [Math.sin(a3) * rr, y, Math.cos(a3) * rr], r: [-0.6 + row * 0.25, a3, 0], s: 1 }); }
    g.add(T.inst(petal, gm, pl));
    // 산봉우리 뚜껑
    var lid = T.lathe(T.smoothProfile([[0.22, 0.52], [0.2, 0.6], [0.15, 0.72], [0.08, 0.8], [0.0, 0.83]], 40), 64);
    g.add(T.mesh(lid, gm));
    var peaks = [];
    for (i = 0; i < 110; i++) {
      var tt = Math.pow(T.rnd(), 0.8), a4 = T.rnd() * Math.PI * 2, prof = [0.21, 0.19, 0.15, 0.1, 0.05], yy = 0.53 + tt * 0.28, rr2 = 0.22 - tt * 0.19;
      peaks.push({ p: [Math.sin(a4) * rr2 * 0.97, yy - 0.01, Math.cos(a4) * rr2 * 0.97], s: [T.rr(0.035, 0.055), T.rr(0.06, 0.1), T.rr(0.035, 0.055)], r: [Math.cos(a4) * 0.35 * (1 - tt), a4, -Math.sin(a4) * 0.35 * (1 - tt)] });
    }
    var pk = new THREE.ConeGeometry(1, 1, 7); pk.translate(0, 0.5, 0);
    g.add(T.inst(pk, gm, peaks));
    // 봉황
    var py = 0.86;
    var body = T.mesh(new THREE.SphereGeometry(0.05, 20, 14), gm, 0, py + 0.04, 0); body.scale.set(0.9, 1.2, 1); g.add(body);
    g.add(T.mesh(T.taperTube([[0, py + 0.08, 0.02], [0, py + 0.15, 0.04], [0, py + 0.17, 0.08]], function (q) { return 0.02 - q * 0.008; }, 16, 8), gm));
    g.add(T.mesh(new THREE.ConeGeometry(0.012, 0.04, 8), gm, 0, py + 0.17, 0.11).rotateX(Math.PI / 2));
    [-1, 1].forEach(function (sd) {
      var w = new THREE.Shape(); w.moveTo(0, 0); w.quadraticCurveTo(0.08, 0.08, 0.16, 0.14); w.lineTo(0.12, 0.08); w.lineTo(0.15, 0.07); w.lineTo(0.1, 0.03); w.lineTo(0.12, 0.0); w.quadraticCurveTo(0.06, -0.02, 0, 0);
      var wm = T.mesh(T.extrude(w, 0.008, 0.003), gm, sd * 0.03, py + 0.06, -0.01); wm.rotation.y = sd > 0 ? -0.3 : Math.PI + 0.3; g.add(wm);
    });
    g.add(T.mesh(T.taperTube([[0, py + 0.02, -0.03], [0, py + 0.0, -0.1], [0, py + 0.06, -0.18], [0, py + 0.12, -0.2]], function (q) { return 0.02 * (1 - q * 0.6); }, 20, 8), gm));
    g.add(base(0.6, 0.6, 0.03, M.lacquer()));
    g.userData = { elev: 10 };
    return g;
  };

  /* ---------------- 잉카 황금 태양 원반 */
  O.incadisc = function () {
    var hc = T.canvas(1024, 1024, function (c, w, h) {
      var C = w / 2; c.fillStyle = gray(0.25); c.fillRect(0, 0, w, h);
      c.fillStyle = gray(0.55); c.beginPath(); c.arc(C, C, 500, 0, 7); c.fill();
      c.lineWidth = 16; c.strokeStyle = gray(0.85); c.beginPath(); c.arc(C, C, 470, 0, 7); c.stroke();
      // 지그재그 빛살 띠
      c.beginPath(); for (var i = 0; i <= 64; i++) { var a = i / 64 * Math.PI * 2, r = i % 2 ? 420 : 370; c.lineTo(C + Math.cos(a) * r, C + Math.sin(a) * r); } c.lineWidth = 14; c.stroke();
      c.lineWidth = 12; c.beginPath(); c.arc(C, C, 330, 0, 7); c.stroke();
      // 얼굴
      c.fillStyle = gray(0.75); c.beginPath(); c.arc(C, C, 290, 0, 7); c.fill();
      c.fillStyle = gray(1); [[-110, -60], [110, -60]].forEach(function (e) { c.beginPath(); c.ellipse(C + e[0], C + e[1], 70, 40, 0, 0, 7); c.fill(); c.fillStyle = gray(0.55); c.beginPath(); c.arc(C + e[0], C + e[1], 22, 0, 7); c.fill(); c.fillStyle = gray(1); });
      c.fillStyle = gray(1); c.beginPath(); c.moveTo(C - 30, C - 70); c.lineTo(C + 30, C - 70); c.lineTo(C + 55, C + 60); c.lineTo(C - 55, C + 60); c.fill();
      c.fillStyle = gray(0.95); c.beginPath(); c.ellipse(C, C + 150, 120, 40, 0, 0, 7); c.fill(); c.fillStyle = gray(0.6); c.fillRect(C - 100, C + 145, 200, 10);
      for (i = 0; i < 9; i++) { c.fillStyle = gray(0.95); c.fillRect(C - 160 + i * 40, C + 210, 20, 40); }
    });
    var hb = T.blurCanvas(hc, 3);
    var cv = T.canvas(512, 512, function (c, w, h) { c.fillStyle = '#e8b448'; c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'multiply'; c.drawImage(hb, 0, 0, w, h); });
    var gm = M.gold({ roughness: 0.22, color: 0xffffff }); gm.map = T.tex(cv);
    var disc = T.mesh(T.reliefDisc(hb, 0.4, 160, 256, 0.04), gm, 0, 0.6, 0);
    var g = T.group(disc);
    // 바깥 빛살
    var rays = [];
    for (var i = 0; i < 16; i++) { var a = i / 16 * Math.PI * 2; rays.push({ p: [Math.cos(a) * 0.48, 0.6 + Math.sin(a) * 0.48, -0.002], r: [0, 0, a - Math.PI / 2], s: 1 }); }
    var ray = T.extrude([[-0.035, -0.09], [0.035, -0.09], [0.0, 0.1]], 0.006, 0.004);
    g.add(T.inst(ray, M.gold({ roughness: 0.25 }), rays));
    g.add(T.mesh(new THREE.CylinderGeometry(0.41, 0.41, 0.02, 128), M.gold(), 0, 0.6, -0.012).rotateX(Math.PI / 2));
    g.add(base(0.5, 0.3, 0.04)); g.add(T.mesh(new THREE.BoxGeometry(0.04, 0.12, 0.04), M.lacquer(), 0, 0.08, -0.03));
    g.userData = { elev: 2, views: SWAY };
    return g;
  };

  /* ---------------- 아스테카 태양의 돌 */
  O.sunstone = function () {
    var hc = T.canvas(1024, 1024, function (c, w, h) {
      var C = w / 2; c.fillStyle = gray(0.3); c.fillRect(0, 0, w, h);
      c.fillStyle = gray(0.62); c.beginPath(); c.arc(C, C, 505, 0, 7); c.fill();
      function ring(r, lw, v) { c.lineWidth = lw; c.strokeStyle = gray(v); c.beginPath(); c.arc(C, C, r, 0, 7); c.stroke(); }
      // 바깥: 불뱀 두 마리
      for (var i = 0; i < 2; i++) { c.save(); c.translate(C, C); c.rotate(i * Math.PI); for (var k = 0; k < 22; k++) { var a = Math.PI * 0.05 + k / 22 * Math.PI * 0.9; c.fillStyle = gray(0.8); c.save(); c.rotate(a); c.fillRect(440, -14, 50, 28); c.restore(); } c.restore(); }
      ring(430, 10, 0.85);
      // 별 띠 (작은 사각 점)
      for (i = 0; i < 80; i++) { var a = i / 80 * Math.PI * 2; c.fillStyle = gray(0.85); c.fillRect(C + Math.cos(a) * 405 - 6, C + Math.sin(a) * 405 - 6, 12, 12); }
      ring(385, 8, 0.85);
      // 큰 빛살 8 + 작은 빛살
      for (i = 0; i < 8; i++) { c.save(); c.translate(C, C); c.rotate(i / 8 * Math.PI * 2); c.fillStyle = gray(0.9); c.beginPath(); c.moveTo(-40, -300); c.lineTo(0, -385); c.lineTo(40, -300); c.fill(); c.restore(); }
      for (i = 0; i < 40; i++) { var a2 = i / 40 * Math.PI * 2; c.fillStyle = gray(0.78); c.beginPath(); c.arc(C + Math.cos(a2) * 330, C + Math.sin(a2) * 330, 8, 0, 7); c.fill(); }
      ring(300, 8, 0.85);
      // 20일 상형 칸
      for (i = 0; i < 20; i++) {
        c.save(); c.translate(C, C); c.rotate(i / 20 * Math.PI * 2); c.strokeStyle = gray(0.85); c.lineWidth = 5; c.strokeRect(-36, -290, 72, 60);
        c.fillStyle = gray(0.8); var t = i % 4;
        if (t === 0) { c.beginPath(); c.arc(0, -260, 16, 0, 7); c.fill(); } else if (t === 1) { c.fillRect(-18, -275, 36, 30); } else if (t === 2) { c.beginPath(); c.moveTo(-20, -240); c.lineTo(0, -282); c.lineTo(20, -240); c.fill(); } else { c.beginPath(); c.ellipse(0, -260, 22, 12, 0, 0, 7); c.fill(); c.fillStyle = gray(0.4); c.beginPath(); c.arc(6, -262, 4, 0, 7); c.fill(); }
        c.restore();
      }
      ring(225, 8, 0.85);
      // 나우이 올린 네 칸과 가운데 얼굴
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { c.save(); c.translate(C + q[0] * 105, C + q[1] * 105); c.rotate(Math.PI / 4); c.fillStyle = gray(0.82); c.fillRect(-55, -55, 110, 110); c.fillStyle = gray(0.5); c.fillRect(-35, -35, 70, 70); c.fillStyle = gray(0.85); c.beginPath(); c.arc(0, 0, 20, 0, 7); c.fill(); c.restore(); });
      c.fillStyle = gray(0.95); c.beginPath(); c.arc(C, C, 95, 0, 7); c.fill();
      c.fillStyle = gray(0.55); c.beginPath(); c.ellipse(C - 35, C - 20, 18, 10, 0, 0, 7); c.ellipse(C + 35, C - 20, 18, 10, 0, 0, 7); c.fill();
      c.fillStyle = gray(1); c.beginPath(); c.moveTo(C - 18, C + 30); c.lineTo(C + 18, C + 30); c.lineTo(C, C + 100); c.fill(); // 칼날 혀
      // 돌 표면 잡음
      var im = c.getImageData(0, 0, w, h), d = im.data;
      for (var p = 0; p < d.length; p += 4) { var n = (T.rnd() - 0.5) * 22; d[p] += n; d[p + 1] += n; d[p + 2] += n; }
      c.putImageData(im, 0, 0);
    });
    var hb = T.blurCanvas(hc, 2.5);
    var col = mixMaps(stoneTex(512, 512, [104, 98, 90], [150, 142, 128], 26), hb, 0.6);
    var m = M.stone({ color: 0xffffff, roughness: 0.82 }); m.map = T.tex(col);
    var g = T.group(T.mesh(T.reliefDisc(hb, 0.5, 200, 320, 0.05), m, 0, 0.58, 0));
    var rim = T.mesh(new THREE.CylinderGeometry(0.505, 0.51, 0.14, 128, 1, true), M.stone({ color: 0x6a645a }), 0, 0.58, -0.06); rim.rotation.x = Math.PI / 2; g.add(rim);
    g.add(T.mesh(new THREE.CircleGeometry(0.51, 64), M.stone({ color: 0x4a4640 }), 0, 0.58, -0.13).rotateY(Math.PI));
    g.add(base(0.7, 0.3, 0.06, M.stone({ color: 0x2a2826 })));
    g.userData = { elev: 2, views: SWAY };
    return g;
  };

  /* ---------------- 함무라비 법전 비석 */
  O.hammurabi = function () {
    var W = 0.42, H = 1.2;
    function inShape(u, v) { var x = (u - 0.5) * W, y = v * H, top = H - W / 2; if (y < top) return true; var dx = x, dy = y - top; return dx * dx / (W * W / 4) + dy * dy / (W * W / 4 * 0.9) < 1; }
    var hc = T.canvas(512, 1464, function (c, w, h) {
      c.fillStyle = gray(0.55); c.fillRect(0, 0, w, h);
      // 위: 샤마시(앉음)와 함무라비(서 있음)
      var top = h * 0.28;
      c.fillStyle = gray(0.85);
      c.beginPath(); c.ellipse(330, 210, 34, 40, 0, 0, 7); c.fill(); // 샤마시 머리(뿔관)
      for (var k = 0; k < 4; k++) c.fillRect(296, 150 - k * 14, 68, 10);
      c.beginPath(); c.moveTo(280, 250); c.lineTo(380, 250); c.lineTo(400, 380); c.lineTo(270, 380); c.fill(); // 몸
      c.fillRect(280, 380, 130, 30); c.beginPath(); c.moveTo(260, 410); c.lineTo(420, 410); c.lineTo(430, 470); c.lineTo(250, 470); c.fill(); // 무릎·옷자락
      c.fillRect(420, 300, 40, 170); // 의자
      c.fillRect(250, 300, 40, 12); c.beginPath(); c.arc(240, 306, 14, 0, 7); c.fill(); // 고리와 막대
      c.beginPath(); c.ellipse(165, 200, 30, 36, 0, 0, 7); c.fill(); c.fillRect(140, 160, 50, 22); // 함무라비 머리
      c.beginPath(); c.moveTo(130, 240); c.lineTo(200, 240); c.lineTo(215, 470); c.lineTo(115, 470); c.fill();
      c.fillRect(190, 250, 50, 14);
      c.fillStyle = gray(0.4); c.fillRect(0, top, w, 10);
      // 쐐기문자 칸
      var y = top + 30;
      while (y < h - 30) {
        c.fillStyle = gray(0.45); c.fillRect(20, y, w - 40, 2);
        for (var x = 30; x < w - 30; x += T.rr(8, 16)) {
          var t = T.rnd(); c.fillStyle = gray(0.3);
          if (t < 0.5) { c.beginPath(); c.moveTo(x, y + 6); c.lineTo(x + 7, y + 4); c.lineTo(x + 7, y + 8); c.fill(); c.fillRect(x + 6, y + 5, 6, 2); }
          else if (t < 0.8) { c.beginPath(); c.moveTo(x + 2, y + 2); c.lineTo(x + 6, y + 2); c.lineTo(x + 4, y + 13); c.fill(); }
          else { c.beginPath(); c.moveTo(x, y + 3); c.lineTo(x + 8, y + 7); c.lineTo(x, y + 11); c.fill(); }
        }
        y += 18;
      }
    });
    var hb = T.blurCanvas(hc, 1.2);
    var col = mixMaps(stoneTex(512, 1464, [22, 22, 24], [48, 46, 46], 40), hb, 0.45);
    var m = M.stone({ color: 0xffffff, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.5 }); m.map = T.tex(col);
    var front = T.mesh(T.relief(hb, W, H, 160, 460, 0.02, inShape), m, 0, H / 2, 0.11);
    var sh = new THREE.Shape(); sh.moveTo(-W / 2, 0); sh.lineTo(W / 2, 0); sh.lineTo(W / 2, H - W / 2); sh.absellipse(0, H - W / 2, W / 2, W / 2 * 0.95, 0, Math.PI, false); sh.lineTo(-W / 2, 0);
    var body = T.mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, curveSegments: 40 }), M.stone({ color: 0x18181a, roughness: 0.45, clearcoat: 0.3 }), 0, 0, -0.11);
    var g = T.group(body, front, base(0.6, 0.4, 0.04, M.stone({ color: 0x1a1816 })));
    body.position.y = 0.04; front.position.y += 0.04;
    g.userData = { elev: 4, views: [0, 22, 40, 22, 0, -22, -40, -22] };
    return g;
  };

  /* ---------------- 팔만대장경 경판 */
  O.tripitaka = function () {
    var txt = '觀自在菩薩行深般若波羅蜜多時照見五蘊皆空度一切苦厄舍利子色不異空空不異色色卽是空空卽是色受想行識亦復如是舍利子是諸法空相不生不滅不垢不淨不增不減是故空中無色無受想行識無眼耳鼻舌身意無色聲香味觸法無眼界乃至無意識界無無明亦無無明盡乃至無老死亦無老死盡無苦集滅道無智亦無得以無所得故菩提薩埵依般若波羅蜜多故心無罣礙無罣礙故無有恐怖遠離顚倒夢想究竟涅槃';
    function page(c, w, h, mirror) {
      c.save(); if (mirror) { c.translate(w, 0); c.scale(-1, 1); }
      PT.vtext(c, txt, w - 30, 30, 26, 30, 14, c.fillStyle, '"Noto Serif CJK TC"');
      c.restore();
      c.strokeStyle = c.fillStyle; c.lineWidth = 4; c.strokeRect(10, 14, w - 20, h - 28);
    }
    var hc = T.canvas(1024, 440, function (c, w, h) { c.fillStyle = gray(0.25); c.fillRect(0, 0, w, h); c.fillStyle = gray(0.9); page(c, w, h, true); });
    var hb = T.blurCanvas(hc, 0.8);
    var wood = stoneTex(512, 220, [26, 20, 16], [52, 40, 30], 20);
    var col = T.canvas(1024, 440, function (c, w, h) { c.drawImage(wood, 0, 0, w, h); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.25; c.drawImage(hb, 0, 0); });
    var m = M.wood({ color: 0xffffff, roughness: 0.55 }); m.map = T.tex(col);
    var bw = 0.68, bh = 0.29;
    var face = T.mesh(T.relief(hb, bw, bh, 520, 220, 0.006), m, 0, 0, 0.022);
    var board = T.mesh(new THREE.BoxGeometry(bw, bh, 0.044), M.wood({ color: 0x241a12 }));
    var g1 = T.group(board, face);
    [-1, 1].forEach(function (sd) {
      g1.add(T.mesh(new THREE.BoxGeometry(0.06, bh + 0.04, 0.07), M.wood({ color: 0x2e2218 }), sd * (bw / 2 + 0.03), 0, 0));
      [-1, 1].forEach(function (q) { g1.add(T.mesh(new THREE.BoxGeometry(0.065, 0.03, 0.075), M.bronze({ color: 0x6a5030 }), sd * (bw / 2 + 0.03), q * (bh / 2 + 0.005), 0)); });
    });
    g1.position.set(0, 0.36, 0); g1.rotation.x = -0.25;
    // 앞에 찍은 종이
    var pc = T.canvas(1024, 440, function (c, w, h) { c.fillStyle = '#e8dcc0'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(20,16,12,0.9)'; page(c, w, h, false); });
    var paper = T.mesh(new THREE.PlaneGeometry(0.6, 0.26), M.paper({ map: T.tex(pc) }), 0, 0.085, 0.3); paper.rotation.x = -Math.PI / 2;
    var g = T.group(g1, paper, base(0.9, 0.7, 0.08, M.lacquer()));
    g.add(T.mesh(new THREE.BoxGeometry(0.5, 0.18, 0.06), M.lacquer(), 0, 0.17, -0.1));
    g.userData = { elev: 18, views: SWAY };
    return g;
  };

  /* ---------------- 몬테수마의 깃털관 */
  O.moctezuma = function () {
    var g = T.group();
    function featherTex(c1, c2) {
      return T.canvas(64, 256, function (c, w, h) {
        c.clearRect(0, 0, w, h);
        var gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, c2); gr.addColorStop(1, c1);
        c.fillStyle = gr; c.beginPath(); c.moveTo(w / 2, 0); c.quadraticCurveTo(w, h * 0.3, w * 0.62, h); c.lineTo(w * 0.38, h); c.quadraticCurveTo(0, h * 0.3, w / 2, 0); c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(w / 2, 4); c.lineTo(w / 2, h); c.stroke();
        c.globalCompositeOperation = 'destination-out'; for (var i = 0; i < 40; i++) { c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 1; var y = T.rnd() * h * 0.8; c.beginPath(); c.moveTo(w / 2, y); c.lineTo(T.rnd() < 0.5 ? 0 : w, y + 12); c.stroke(); }
      });
    }
    function fan(n, r0, r1, wdt, tex, z, spread) {
      var mt = new THREE.MeshPhysicalMaterial({ map: T.tex(tex), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.55, sheen: 0.8, sheenColor: new THREE.Color(0x88ffcc), envMapIntensity: 0.6 });
      var geo = new THREE.PlaneGeometry(wdt, r1 - r0); geo.translate(0, (r1 - r0) / 2, 0);
      var list = [];
      for (var i = 0; i < n; i++) { var a = (i / (n - 1) - 0.5) * (spread || Math.PI * 1.15); list.push({ p: [Math.sin(a) * r0, 0.15 + Math.cos(a) * r0 * 0.9, z + T.rr(-0.004, 0.004)], r: [T.rr(-0.05, 0.05), 0, -a], s: [1, T.rr(0.92, 1.05), 1] }); }
      return T.inst(geo, mt, list);
    }
    g.add(fan(150, 0.32, 0.85, 0.07, featherTex('#0c5a3a', '#2fae6a'), -0.02));
    g.add(fan(110, 0.27, 0.45, 0.05, featherTex('#18306e', '#2a8ac8'), 0.0));
    g.add(fan(100, 0.22, 0.32, 0.04, featherTex('#8a1a14', '#d8402a'), 0.012));
    g.add(fan(90, 0.17, 0.25, 0.035, featherTex('#3a2412', '#8a6a3a'), 0.02));
    // 금판 줄
    var plates = [];
    [0.3, 0.42].forEach(function (r, ri) { for (var i = 0; i < 26 - ri * 4; i++) { var a = (i / (25 - ri * 4) - 0.5) * Math.PI * 1.1; plates.push({ p: [Math.sin(a) * r, 0.15 + Math.cos(a) * r * 0.9, 0.03], s: 0.018, r: [Math.PI / 2, 0, 0] }); } });
    g.add(T.inst(new THREE.CylinderGeometry(1, 1, 0.3, 16), M.gold({ roughness: 0.22 }), plates));
    // 받침 틀
    g.add(base(0.7, 0.24, 0.05, M.lacquer()));
    g.add(T.mesh(new THREE.BoxGeometry(0.03, 0.2, 0.03), M.lacquer(), 0, 0.12, -0.05));
    g.userData = { elev: 4, views: SWAY };
    return g;
  };

  /* ---------------- 벨렝 성체 현시대 */
  O.belemmonstrance = function () {
    var g = T.group(), gm = M.gold({ roughness: 0.2 });
    g.add(T.mesh(T.lathe(T.smoothProfile([[0, 0], [0.24, 0], [0.25, 0.03], [0.2, 0.07], [0.12, 0.12], [0.06, 0.2], [0.045, 0.3], [0.06, 0.33], [0.045, 0.36], [0.05, 0.45], [0.0, 0.46]], 80), 48), gm));
    // 에나멜 받침 무늬 띠
    var t = T.mesh(new THREE.TorusGeometry(0.2, 0.012, 8, 48), M.enamel(0x1a3a9a), 0, 0.06, 0); t.rotation.x = Math.PI / 2; g.add(t);
    for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2; g.add(T.mesh(new THREE.SphereGeometry(0.018, 12, 8), M.enamel(i % 2 ? 0x1a6a3a : 0xa01a1a), Math.cos(a) * 0.2, 0.065, Math.sin(a) * 0.2)); }
    // 가운데 감실: 유리 원통 + 무릎 꿇은 사도 12
    g.add(T.mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.012, 48), gm, 0, 0.46, 0));
    g.add(T.mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.16, 32, 1, true), M.glaze({ color: 0xddeeff, roughness: 0.02, transparent: true, opacity: 0.35, side: THREE.DoubleSide }), 0, 0.55, 0));
    g.add(T.mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.005, 24), M.paleGold(), 0, 0.55, 0.02).rotateX(Math.PI / 2));
    var ap = [];
    for (i = 0; i < 12; i++) { var a2 = i / 12 * Math.PI * 2; ap.push({ p: [Math.cos(a2) * 0.1, 0.48, Math.sin(a2) * 0.1], s: [1, 1, 1], r: [0, -a2, 0] }); }
    var fig = new THREE.CapsuleGeometry(0.012, 0.03, 4, 8); fig.translate(0, 0.02, 0);
    g.add(T.inst(fig, M.enamel(0xf0f0f0), ap));
    // 고딕 기둥 넷과 뾰족탑
    for (i = 0; i < 4; i++) {
      var a3 = i / 4 * Math.PI * 2 + Math.PI / 4, x = Math.cos(a3) * 0.115, z = Math.sin(a3) * 0.115;
      g.add(T.mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 8), gm, x, 0.57, z));
      g.add(T.mesh(new THREE.ConeGeometry(0.018, 0.09, 6), gm, x, 0.72, z));
      g.add(T.mesh(new THREE.ConeGeometry(0.01, 0.05, 6), gm, x * 0.6, 0.69, z * 0.6));
    }
    g.add(T.mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.02, 48), gm, 0, 0.67, 0));
    // 혼천의
    var arm = M.gold({ roughness: 0.18 });
    [0, Math.PI / 3, -Math.PI / 3].forEach(function (r) { var ring = T.mesh(new THREE.TorusGeometry(0.075, 0.005, 8, 48), arm, 0, 0.8, 0); ring.rotation.set(Math.PI / 2 - 0.4, r, 0); g.add(ring); });
    var eq = T.mesh(new THREE.TorusGeometry(0.075, 0.007, 8, 48), arm, 0, 0.8, 0); eq.rotation.x = Math.PI / 2; g.add(eq);
    g.add(T.mesh(new THREE.SphereGeometry(0.018, 16, 12), M.enamel(0x2050b0), 0, 0.8, 0));
    // 꼭대기 십자가
    g.add(T.mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.12, 8), gm, 0, 0.92, 0));
    g.add(T.mesh(new THREE.BoxGeometry(0.06, 0.008, 0.008), gm, 0, 0.95, 0));
    g.add(T.mesh(new THREE.BoxGeometry(0.008, 0.08, 0.008), gm, 0, 0.94, 0));
    g.userData = { elev: 8 };
    return g;
  };
})(T3);

/* 바다의 꽃 호 난파선 보물 (seadisc.js) */
(function (T) {
  var M = T.mat;
  T.OBJ.flordelamar = function () {
    var g = T.group(), gold = M.gold({ roughness: 0.3 });
    // 조개·따개비가 붙은 반쯤 썩은 상자
    var wood = M.wood({ color: 0x3a3226, roughness: 0.85 }); wood.bumpMap = T.tex(T.noiseCanvas(256, 256, 4, 30, 220, 4), { linear: true }); wood.bumpScale = 0.01;
    var bx = T.group();
    [[0, 0.03, 0, 0.7, 0.06, 0.44], [0, 0.18, 0.21, 0.7, 0.3, 0.03], [0, 0.18, -0.21, 0.7, 0.3, 0.03], [0.34, 0.18, 0, 0.03, 0.3, 0.44], [-0.34, 0.18, 0, 0.03, 0.3, 0.44]].forEach(function (b) { bx.add(T.mesh(new THREE.BoxGeometry(b[3], b[4], b[5]), wood, b[0], b[1], b[2])); });
    var lid = T.mesh(new THREE.BoxGeometry(0.72, 0.04, 0.46), wood, 0, 0.42, -0.36); lid.rotation.x = -1.1; bx.add(lid);
    g.add(bx);
    // 넘치는 금화와 금 그릇·보석
    var coin = new THREE.CylinderGeometry(1, 1, 0.12, 16), list = [];
    for (var i = 0; i < 420; i++) { var r = Math.sqrt(T.rnd()), a = T.rnd() * 6.28, x = Math.cos(a) * r * 0.32, z = Math.sin(a) * r * 0.2; list.push({ p: [x, 0.28 + 0.08 * (1 - r * r) + T.rr(-0.01, 0.01), z], s: 0.022, r: [T.rr(-0.6, 0.6), T.rnd() * 6, T.rr(-0.6, 0.6)] }); }
    for (i = 0; i < 70; i++) list.push({ p: [T.rr(-0.6, 0.6), 0.004, T.rr(0.15, 0.45)], s: 0.022, r: [T.rr(-0.1, 0.1), T.rnd() * 6, T.rr(-0.1, 0.1)] });
    g.add(T.inst(coin, gold, list));
    var bowl = T.mesh(T.lathe(T.smoothProfile([[0, 0], [0.05, 0], [0.06, 0.02], [0.12, 0.07], [0.13, 0.09], [0.0, 0.05]], 30), 40), gold, 0.45, 0.0, 0.2); bowl.rotation.z = 0.5; g.add(bowl);
    var cup = T.mesh(T.lathe(T.smoothProfile([[0, 0], [0.05, 0], [0.02, 0.03], [0.02, 0.1], [0.07, 0.16], [0.08, 0.22], [0.0, 0.2]], 40), 40), gold, -0.08, 0.3, 0.02); g.add(cup);
    [[0.1, 0.36, 0.05, 0xb0102a], [-0.18, 0.35, -0.04, 0x10802a], [0.2, 0.33, -0.08, 0x1a3aa8], [-0.5, 0.02, 0.3, 0xb0102a]].forEach(function (q) { var m = T.mesh(T.gemGeo('oval'), M.gem(q[3]), q[0], q[1], q[2]); m.scale.setScalar(0.035); g.add(m); });
    // 따개비와 산호
    var barn = []; for (i = 0; i < 90; i++) { var side = T.pick([[0.35, 0], [-0.35, 0], [0, 0.22], [0, -0.22]]); barn.push({ p: [side[0] ? side[0] + 0.005 * Math.sign(side[0]) : T.rr(-0.33, 0.33), T.rr(0.03, 0.32), side[1] ? side[1] + 0.005 * Math.sign(side[1]) : T.rr(-0.2, 0.2)], s: T.rr(0.008, 0.018), r: [side[1] ? Math.PI / 2 * Math.sign(side[1]) : 0, 0, side[0] ? -Math.PI / 2 * Math.sign(side[0]) : 0] }); }
    g.add(T.inst(new THREE.ConeGeometry(1, 1, 8, 1, true), M.stone({ color: 0xd8d0c0, roughness: 0.8 }), barn));
    var cor = M.glaze({ color: 0xd85a40, roughness: 0.5 });
    g.add(T.mesh(T.taperTube([[-0.36, 0.05, 0.15], [-0.42, 0.15, 0.16], [-0.4, 0.25, 0.12]], function (t) { return 0.02 * (1 - t * 0.6); }, 12, 8), cor));
    g.add(T.mesh(T.taperTube([[-0.42, 0.15, 0.16], [-0.48, 0.2, 0.17]], function (t) { return 0.012 * (1 - t * 0.6); }, 8, 6), cor));
    g.userData = { elev: 18 };
    return g;
  };
})(T3);
