/* 보석·왕관 */
(function (T) {
  var O = T.OBJ, PT = T.paint, M = T.mat;
  var V3 = function (x, y, z) { return new THREE.Vector3(x, y, z); };

  /** 보석 하나 (기하는 가로 반지름 1) — 위(테이블)가 dir 쪽을 보게 */
  function gem(kind, mat, s, p, dir, n) {
    var m = T.mesh(T.gemGeo(kind, n), mat, p[0], p[1], p[2]);
    m.scale.set(s, s, s);
    if (dir) m.quaternion.setFromUnitVectors(V3(0, 1, 0), V3(dir[0], dir[1], dir[2]).normalize());
    return m;
  }
  function cab(col, r, p, dir, flat) {
    var g = new THREE.SphereGeometry(1, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2);
    var m = T.mesh(g, M.cabochon(col), p[0], p[1], p[2]);
    m.scale.set(r, r * (flat || 0.6), r);
    if (dir) m.quaternion.setFromUnitVectors(V3(0, 1, 0), V3(dir[0], dir[1], dir[2]).normalize());
    return m;
  }
  function bezel(r, p, dir, mat) { // 보석 받침 테
    var m = T.mesh(new THREE.TorusGeometry(r, r * 0.16, 10, 32), mat || M.gold(), p[0], p[1], p[2]);
    m.quaternion.setFromUnitVectors(V3(0, 0, 1), V3(dir[0], dir[1], dir[2]).normalize());
    return m;
  }
  function pearls(curvePts, r, n, closed) {
    var c = new THREE.CatmullRomCurve3(curvePts.map(function (p) { return V3(p[0], p[1], p[2]); }), !!closed), list = [];
    for (var i = 0; i < n; i++) { var p = c.getPointAt(closed ? i / n : i / (n - 1)); list.push({ p: [p.x, p.y, p.z], s: r }); }
    return T.inst(new THREE.SphereGeometry(1, 16, 12), M.pearl(), list);
  }
  function velvetCushion(w, d, h, col) {
    var g = new THREE.BoxGeometry(w, h, d, 24, 6, 24);
    T.warp(g, function (v) { // 가운데가 부푼 방석
      var nx = v.x / (w / 2), nz = v.z / (d / 2), k = Math.max(0, 1 - Math.pow(Math.max(Math.abs(nx), Math.abs(nz)), 4));
      if (v.y > 0) v.y = h / 2 * (0.3 + 0.7 * k) + h * 0.25 * k; else v.y = -h / 2;
      var r = 1 - 0.06 * (1 - Math.abs(v.y) / h); v.x *= r; v.z *= r;
    });
    var m = T.mesh(g, M.cloth({ color: col || 0x5a1018, sheenColor: new THREE.Color(0xff9a9a) }));
    var tassels = [];
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (q) {
      tassels.push(T.mesh(new THREE.ConeGeometry(h * 0.18, h * 0.6, 12), M.gold({ roughness: 0.5 }), q[0] * w * 0.47, -h * 0.1, q[1] * d * 0.47));
    });
    return T.group.apply(null, [m].concat(tassels));
  }
  function ermine(r, y, thick) {
    var cv = T.canvas(1024, 128, function (g, w, h) {
      g.fillStyle = '#f2efe8'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 40; i++) { var x = (i + 0.5) * w / 40, yy = h * (i % 2 ? 0.35 : 0.65); g.fillStyle = '#111'; g.beginPath(); g.moveTo(x, yy - 12); g.lineTo(x - 5, yy + 8); g.lineTo(x + 5, yy + 8); g.fill(); }
    });
    var m = M.cloth({ color: 0xffffff, sheenColor: new THREE.Color(0xffffff), roughness: 1 }); m.map = T.tex(cv);
    var t = T.mesh(new THREE.TorusGeometry(r, thick, 20, 96), m, 0, y, 0); t.rotation.x = Math.PI / 2;
    return t;
  }
  function crossPattee(s) {
    var a = 0.32, b = 1, pts = [[-a * 0.5, 0], [a * 0.5, 0], [a * 0.3, 0.55], [b * 0.5, 0.42], [b * 0.5, 0.98], [a * 0.3, 0.85], [a * 0.5, 1.4], [-a * 0.5, 1.4], [-a * 0.3, 0.85], [-b * 0.5, 0.98], [-b * 0.5, 0.42], [-a * 0.3, 0.55]];
    var g = T.extrude(pts.map(function (p) { return [p[0] * s, p[1] * s]; }), s * 0.12, s * 0.03);
    return g;
  }
  function fleur(s) {
    var sh = new THREE.Shape();
    sh.moveTo(0, 1.45);
    sh.bezierCurveTo(0.22, 1.2, 0.2, 0.85, 0.08, 0.6);
    sh.bezierCurveTo(0.4, 0.75, 0.62, 0.95, 0.55, 1.12);
    sh.bezierCurveTo(0.9, 0.95, 0.82, 0.45, 0.4, 0.38);
    sh.lineTo(0.12, 0.38); sh.lineTo(0.12, 0.0); sh.lineTo(-0.12, 0.0); sh.lineTo(-0.12, 0.38); sh.lineTo(-0.4, 0.38);
    sh.bezierCurveTo(-0.82, 0.45, -0.9, 0.95, -0.55, 1.12);
    sh.bezierCurveTo(-0.62, 0.95, -0.4, 0.75, -0.08, 0.6);
    sh.bezierCurveTo(-0.2, 0.85, -0.22, 1.2, 0, 1.45);
    var g = new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.035, bevelSegments: 3, curveSegments: 20 });
    g.translate(0, 0, -0.05); g.scale(s, s, s);
    return g;
  }
  /** 테 위에 둘레를 따라 세운 장식 (얼굴이 바깥을 봄) */
  function onRim(obj, R, a, y) { obj.position.set(Math.sin(a) * R, y, Math.cos(a) * R); obj.rotation.y = a; return obj; }
  /** 아치: 테 가장자리에서 꼭대기로 휘었다가 가운데가 살짝 꺼짐 */
  function archPts(R, y0, top, dip, a) {
    var pts = [];
    for (var i = 0; i <= 24; i++) {
      var t = i / 24 * 2 - 1, r = R * t, rise = Math.sin((1 - Math.abs(t)) * Math.PI / 2);
      var h = y0 + (top - y0) * Math.pow(rise, 0.6) - dip * Math.exp(-t * t * 18);
      var rr = r * (0.95 - 0.25 * Math.pow(rise, 3));
      pts.push([Math.sin(a) * rr, h, Math.cos(a) * rr]);
    }
    return pts;
  }
  function velvetCap(R, y0, top, col) {
    var g = T.lathe(T.smoothProfile([[R * 0.97, y0], [R * 0.95, y0 + (top - y0) * 0.4], [R * 0.7, y0 + (top - y0) * 0.8], [0.0, top - 0.04]], 40), 64);
    return T.mesh(g, M.cloth({ color: col || 0x3a0e4a, sheenColor: new THREE.Color(0xc080ff) }));
  }
  function monde(y, s) {
    var g = T.group(T.mesh(new THREE.SphereGeometry(s, 32, 24), M.gold({ roughness: 0.2 }), 0, y, 0));
    var band = T.mesh(new THREE.TorusGeometry(s * 1.01, s * 0.08, 8, 48), M.gold(), 0, y, 0); band.rotation.x = Math.PI / 2; g.add(band);
    var band2 = T.mesh(new THREE.TorusGeometry(s * 1.01, s * 0.08, 8, 48, Math.PI), M.gold(), 0, y, 0); g.add(band2);
    var cr = T.mesh(crossPattee(s * 0.9), M.gold(), 0, y + s * 0.9, 0); g.add(cr);
    g.add(gem('round', M.gem(0x1844c8), s * 0.16, [0, y + s * 1.47, s * 0.1], [0, 0, 1]));
    return g;
  }

  /* ---------------- 코이누르 (무굴 컷, 팔찌형 받침) */
  O.kohinoor = function () {
    var dia = M.diamond();
    var g = T.group();
    var big = gem('mughal', dia, 0.22, [0, 0.42, 0.06], [0, 0.2, 1], 0); g.add(big);
    g.add(bezel(0.23, [0, 0.42, 0.0], [0, 0.2, 1], M.gold({ roughness: 0.18 })));
    // 팔찌형 받침: 금과 붉고 푸른 에나멜 띠
    var cv = T.canvas(1024, 128, function (c, w, h) {
      c.fillStyle = '#d9a542'; c.fillRect(0, 0, w, h);
      for (var i = 0; i < 24; i++) { var x = (i + 0.5) * w / 24; c.fillStyle = i % 2 ? '#a0141e' : '#14603a'; c.beginPath(); c.ellipse(x, h / 2, 14, 36, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#f6e8c0'; c.beginPath(); c.arc(x, h / 2, 5, 0, Math.PI * 2); c.fill(); }
    });
    var band = T.mesh(new THREE.TorusGeometry(0.42, 0.06, 16, 96), (function () { var m = M.gold({ roughness: 0.25, metalness: 0.7 }); m.map = T.tex(cv); m.color = new THREE.Color(0xffffff); return m; })(), 0, 0.42, -0.08);
    band.scale.set(1, 1, 0.55);
    g.add(band);
    [-1, 1].forEach(function (sd) {
      g.add(gem('oval', dia, 0.12, [sd * 0.3, 0.42, 0.02], [sd * 0.4, 0.1, 1]));
      g.add(bezel(0.125, [sd * 0.3, 0.42, -0.02], [sd * 0.4, 0.1, 1]));
      // 실크 끈과 진주 술
      g.add(T.mesh(T.tube([[sd * 0.46, 0.42, -0.1], [sd * 0.58, 0.3, -0.05], [sd * 0.55, 0.1, 0.0], [sd * 0.5, 0.02, 0.02]], 0.012, 32, 8), M.cloth({ color: 0x8a1020 })));
      g.add(pearls([[sd * 0.5, 0.02, 0.02], [sd * 0.5, -0.06, 0.02]], 0.022, 3));
    });
    g.add(velvetCushion(1.3, 0.75, 0.16, 0x10224a).translateY(-0.12));
    g.userData = { elev: 16 };
    return g;
  };

  /* ---------------- 흑태자의 루비 — 대영 제국관 앞의 큰 붉은 스피넬 */
  O.blackprince = function () {
    var R = 0.5, g = T.group();
    var cv = T.canvas(1024, 128, function (c, w, h) { c.fillStyle = '#d6a74a'; c.fillRect(0, 0, w, h); c.fillStyle = '#b07f28'; for (var i = 0; i < 64; i++) c.fillRect(i * 16, 0, 2, h); });
    var bm = M.gold({ roughness: 0.22 }); bm.map = T.tex(cv); bm.color = new THREE.Color(0xffffff);
    g.add(T.mesh(new THREE.CylinderGeometry(R, R, 0.16, 96, 1, true), bm, 0, 0.13, 0));
    g.add(ermine(R + 0.02, 0.05, 0.05));
    // 테의 보석: 사파이어·에메랄드 번갈아
    for (var i = 0; i < 8; i++) {
      var a = i / 8 * Math.PI * 2 + Math.PI / 8, d = [Math.sin(a), 0, Math.cos(a)];
      g.add(gem(i % 2 ? 'emerald' : 'oval', M.gem(i % 2 ? 0x0c8a3c : 0x1638a8), 0.045, [d[0] * (R + 0.02), 0.14, d[2] * (R + 0.02)], d));
    }
    g.add(pearls(Array.from({ length: 49 }, function (_, k) { var a = k / 48 * Math.PI * 2; return [Math.sin(a) * (R + 0.012), 0.215, Math.cos(a) * (R + 0.012)]; }), 0.012, 72, true));
    // 십자가 4·백합 4
    for (i = 0; i < 8; i++) {
      var a2 = i / 8 * Math.PI * 2, geo = i % 2 === 0 ? crossPattee(0.16) : fleur(0.12);
      var piece = T.mesh(geo, M.gold({ roughness: 0.2 }));
      g.add(onRim(piece, R * 0.98, a2, 0.21));
      if (i % 2 === 0 && i !== 0) { var d2 = [Math.sin(a2), 0, Math.cos(a2)]; g.add(gem('emerald', M.gem(0x0c8a3c), 0.035, [d2[0] * (R + 0.03), 0.31, d2[2] * (R + 0.03)], d2)); }
    }
    // 앞 십자가의 흑태자 루비 (반질하게 간 덩어리)
    var ruby = T.mesh(new THREE.SphereGeometry(1, 40, 28), M.cabochon(0xb0081c, { emissive: new THREE.Color(0x3a0006), roughness: 0.04 }), 0, 0.33, R + 0.04);
    ruby.scale.set(0.068, 0.085, 0.045); g.add(ruby);
    // 아치 두 개 + 진주
    [0, Math.PI / 2].forEach(function (a) {
      var pts = archPts(R * 0.96, 0.24, 0.78, 0.07, a);
      g.add(T.mesh(T.tube(pts, 0.018, 64, 10), M.gold({ roughness: 0.2 })));
      var off = pts.map(function (p) { var l = Math.hypot(p[0], p[2]) || 1; return [p[0] + p[0] / l * 0.022, p[1] + 0.012, p[2] + p[2] / l * 0.022]; });
      g.add(pearls(off, 0.014, 30));
    });
    g.add(velvetCap(R, 0.2, 0.7));
    g.add(monde(0.79, 0.075));
    g.add(velvetCushion(1.4, 1.4, 0.16, 0x4a0a14).translateY(-0.1));
    g.userData = { elev: 14 };
    return g;
  };

  /* ---------------- 롬바르디아 철관 */
  O.ironcrown = function () {
    var R = 0.5, g = T.group();
    var cv = T.canvas(2048, 256, function (c, w, h) {
      c.fillStyle = '#d8a848'; c.fillRect(0, 0, w, h);
      for (var i = 0; i < 6; i++) {
        var x0 = i * w / 6; c.strokeStyle = '#8a5a18'; c.lineWidth = 6; c.strokeRect(x0 + 6, 8, w / 6 - 12, h - 16);
        for (var k = 0; k < 5; k++) { // 초록 에나멜 꽃
          var fx = x0 + w / 12 + T.rr(-110, 110), fy = T.rr(40, h - 40);
          for (var p = 0; p < 5; p++) { var a = p / 5 * Math.PI * 2; c.fillStyle = '#1f7a4a'; c.beginPath(); c.ellipse(fx + Math.cos(a) * 12, fy + Math.sin(a) * 12, 10, 6, a, 0, Math.PI * 2); c.fill(); }
          c.fillStyle = '#e8d9a0'; c.beginPath(); c.arc(fx, fy, 5, 0, Math.PI * 2); c.fill();
        }
        c.strokeStyle = '#b28030'; c.lineWidth = 3; for (k = 0; k < 6; k++) { c.beginPath(); c.arc(x0 + T.rr(30, w / 6 - 30), T.rr(30, h - 30), 14, 0, Math.PI * 1.5); c.stroke(); }
      }
    });
    var bm = M.gold({ roughness: 0.25 }); bm.map = T.tex(cv); bm.color = new THREE.Color(0xffffff); bm.side = THREE.DoubleSide;
    g.add(T.mesh(new THREE.CylinderGeometry(R, R, 0.2, 120, 1, true), bm, 0, 0.1, 0));
    g.add(T.mesh(new THREE.CylinderGeometry(R * 0.965, R * 0.965, 0.18, 120, 1, true), M.iron({ side: THREE.DoubleSide, roughness: 0.7 }), 0, 0.1, 0));
    [0.0, 0.2].forEach(function (y) { var t = T.mesh(new THREE.TorusGeometry(R, 0.008, 8, 120), M.gold(), 0, y, 0); t.rotation.x = Math.PI / 2; g.add(t); });
    var cols = [0x9a0a1a, 0x1238a0, 0x0c7a40, 0x9a0a1a, 0x3a1a8a, 0x1238a0];
    for (var i = 0; i < 6; i++) {
      for (var k = 0; k < 3; k++) {
        var a = (i + 0.5) / 6 * Math.PI * 2 + (k - 1) * 0.28, y = k === 1 ? 0.1 : 0.065 + (k % 2) * 0.07, d = [Math.sin(a), 0, Math.cos(a)];
        g.add(cab(cols[(i + k) % 6], 0.03, [d[0] * R, y, d[2] * R], d, 0.7));
        g.add(bezel(0.032, [d[0] * (R + 0.002), y, d[2] * (R + 0.002)], d));
      }
      // 금 장미 장식
      var a2 = (i + 0.5) / 6 * Math.PI * 2 + 0.14, d2 = [Math.sin(a2), 0, Math.cos(a2)];
      g.add(T.inst(new THREE.SphereGeometry(1, 10, 8), M.gold(), [0, 1, 2, 3, 4, 5].map(function (q) { var aa = q / 6 * Math.PI * 2; return { p: [d2[0] * (R + 0.01) + Math.cos(aa) * 0.014 * d2[2], 0.155 + Math.sin(aa) * 0.014, d2[2] * (R + 0.01) - Math.cos(aa) * 0.014 * d2[0]], s: 0.008 }; })));
    }
    g.add(velvetCushion(1.35, 1.35, 0.14, 0x6a0c14).translateY(-0.08));
    g.userData = { elev: 22 };
    return g;
  };

  /* ---------------- 성 바츨라프 왕관 */
  O.wenceslas = function () {
    var R = 0.48, g = T.group();
    g.add(T.mesh(new THREE.CylinderGeometry(R, R, 0.2, 96, 1, true), M.gold({ roughness: 0.25, side: THREE.DoubleSide }), 0, 0.1, 0));
    for (var i = 0; i < 4; i++) {
      var a = i / 4 * Math.PI * 2, d = [Math.sin(a), 0, Math.cos(a)];
      var fl = T.mesh(fleur(0.26), M.gold({ roughness: 0.22 })); g.add(onRim(fl, R * 0.99, a, 0.16));
      g.add(gem('cushion', M.gem(0x1440b8), 0.06, [d[0] * (R + 0.03), 0.1, d[2] * (R + 0.03)], d));
      g.add(gem('oval', M.gem(0xb00c3a), 0.045, [d[0] * (R + 0.08), 0.34, d[2] * (R + 0.08)], d));
      [-0.3, 0.3].forEach(function (o) { var aa = a + o, dd = [Math.sin(aa), 0, Math.cos(aa)]; g.add(cab(0xa00a2a, 0.028, [dd[0] * R, 0.1, dd[2] * R], dd)); });
      var a3 = a + Math.PI / 4, d3 = [Math.sin(a3), 0, Math.cos(a3)];
      g.add(cab(0x1a8a40, 0.032, [d3[0] * R, 0.1, d3[2] * R], d3));
    }
    g.add(pearls(Array.from({ length: 41 }, function (_, k) { var a = k / 40 * Math.PI * 2; return [Math.sin(a) * (R + 0.01), 0.005, Math.cos(a) * (R + 0.01)]; }), 0.012, 64, true));
    g.add(pearls(Array.from({ length: 41 }, function (_, k) { var a = k / 40 * Math.PI * 2; return [Math.sin(a) * (R + 0.01), 0.198, Math.cos(a) * (R + 0.01)]; }), 0.012, 64, true));
    [Math.PI / 4].forEach(function (a) {
      var pts = archPts(R * 0.95, 0.2, 0.76, 0.0, a);
      g.add(T.mesh(T.tube(pts, 0.03, 64, 10), M.gold({ roughness: 0.22 })));
      for (var k = 2; k < 23; k += 4) { var p = pts[k], l = Math.hypot(p[0], p[2]) || 1; g.add(cab(k % 8 === 2 ? 0x1440b8 : 0xa00a2a, 0.026, [p[0] + p[0] / l * 0.03, p[1] + 0.02, p[2] + p[2] / l * 0.03], [p[0] / l, 0.6, p[2] / l])); }
    });
    [Math.PI * 3 / 4].forEach(function (a) { var pts = archPts(R * 0.95, 0.2, 0.76, 0.0, a); g.add(T.mesh(T.tube(pts, 0.03, 64, 10), M.gold({ roughness: 0.22 }))); });
    g.add(velvetCap(R, 0.18, 0.7, 0x7a1020));
    var cr = T.mesh(crossPattee(0.12), M.gold(), 0, 0.77, 0); g.add(cr);
    g.add(cab(0x2050c0, 0.035, [0, 0.86, 0.02], [0, 0, 1], 0.5));
    g.add(velvetCushion(1.3, 1.3, 0.14, 0x18306a).translateY(-0.08));
    g.userData = { elev: 14 };
    return g;
  };

  /* ---------------- 티무르 루비 목걸이 */
  O.timurruby = function () {
    var g = T.group();
    // 검은 벨벳 목 받침
    var bust = T.lathe(T.smoothProfile([[0.0, -0.05], [0.62, -0.05], [0.6, 0.05], [0.45, 0.35], [0.28, 0.6], [0.19, 0.75], [0.17, 1.0], [0.0, 1.02]], 60), 96);
    var bm = T.mesh(bust, M.cloth({ color: 0x0e0e18, sheenColor: new THREE.Color(0x5060a0) })); bm.scale.set(1, 1, 0.6); g.add(bm);
    // 목걸이 고리 위의 스피넬 세 개 + 다이아몬드
    var ring = []; for (var i = 0; i <= 40; i++) { var a = (i / 40 - 0.5) * Math.PI * 1.25; ring.push([Math.sin(a) * 0.3, 0.6 - Math.cos(a) * 0.12 + 0.12, Math.cos(a) * 0.3 * 0.62 + 0.04]); }
    g.add(T.mesh(T.tube(ring, 0.012, 80, 8), M.gold()));
    g.add(pearls(ring.map(function (p) { return [p[0], p[1] - 0.012, p[2] + 0.01]; }), 0.013, 34));
    function spinel(s, p) {
      var m = T.mesh(T.roughGeo(1, 28, 0.18), M.cabochon(0xc0102c, { flatShading: false, roughness: 0.05, emissive: new THREE.Color(0x400008) }), p[0], p[1], p[2]);
      m.geometry.computeVertexNormals(); m.scale.set(s, s * 1.15, s * 0.6);
      var cap = T.mesh(new THREE.ConeGeometry(s * 0.5, s * 0.5, 16, 1, true), M.gold(), p[0], p[1] + s * 1.1, p[2]);
      return T.group(m, cap);
    }
    g.add(spinel(0.1, [0, 0.36, 0.25]));
    g.add(spinel(0.06, [-0.17, 0.43, 0.2]));
    g.add(spinel(0.06, [0.17, 0.43, 0.2]));
    [[-0.08, 0.5, 0.23], [0.08, 0.5, 0.23], [0, 0.52, 0.24]].forEach(function (p) { g.add(gem('round', M.diamond(), 0.03, p, [0, 0.2, 1])); });
    g.userData = { elev: 10 };
    return g;
  };

  /* ---------------- 공작 옥좌 */
  O.peacockthrone = function () {
    var g = T.group(), gold = M.gold({ roughness: 0.22 });
    var cv = T.canvas(512, 256, function (c, w, h) { c.fillStyle = '#d9a646'; c.fillRect(0, 0, w, h); for (var i = 0; i < 60; i++) { c.fillStyle = T.pick(['#a00c22', '#0e7a3a', '#1838a0', '#f4f0e0']); c.beginPath(); c.arc(T.rnd() * w, T.rnd() * h, T.rr(3, 7), 0, Math.PI * 2); c.fill(); } c.strokeStyle = '#8a5a18'; c.lineWidth = 4; c.strokeRect(6, 6, w - 12, h - 12); });
    var jm = M.gold({ roughness: 0.25 }); jm.map = T.tex(cv); jm.color = new THREE.Color(0xffffff);
    // 단과 다리
    g.add(T.mesh(new THREE.BoxGeometry(1.0, 0.12, 0.8), jm, 0, 0.22, 0));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { g.add(T.mesh(T.lathe(T.smoothProfile([[0.0, 0], [0.06, 0], [0.04, 0.05], [0.05, 0.1], [0.035, 0.16], [0.0, 0.16]], 20), 24), gold, q[0] * 0.44, 0, q[1] * 0.34)); });
    // 방석·등받이
    g.add(T.mesh(new THREE.BoxGeometry(0.86, 0.08, 0.66), M.cloth({ color: 0x8a1020 }), 0, 0.32, 0.02));
    g.add(T.mesh(new THREE.BoxGeometry(0.86, 0.36, 0.06), jm, 0, 0.5, -0.33));
    g.add(T.mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 20), M.cloth({ color: 0x9a1424 }), 0, 0.42, -0.24)).children;
    g.children[g.children.length - 1].rotation.z = Math.PI / 2;
    // 열두 개 에메랄드 기둥과 차양
    var em = M.gem(0x0d8a44, { flatShading: false, roughness: 0.08 });
    for (var i = 0; i < 6; i++) {
      var x = -0.46 + (i % 3) * 0.46, z = i < 3 ? 0.38 : -0.38;
      g.add(T.mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.62, 12), em, x, 0.6, z));
      g.add(T.mesh(new THREE.SphereGeometry(0.035, 12, 8), gold, x, 0.92, z));
    }
    var roof = T.mesh(new THREE.ConeGeometry(0.72, 0.18, 4, 1), jm, 0, 1.02, 0); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.82); g.add(roof);
    g.add(T.mesh(new THREE.BoxGeometry(1.06, 0.05, 0.86), gold, 0, 0.93, 0));
    // 지붕 위 공작 두 마리: 펼친 꼬리
    [-1, 1].forEach(function (sd) {
      var px = sd * 0.22, py = 1.12;
      var body = T.mesh(new THREE.SphereGeometry(0.05, 20, 14), M.enamel(0x1a4ab8), px, py, 0); body.scale.set(1, 1.3, 0.9); g.add(body);
      g.add(T.mesh(T.tube([[px, py + 0.04, 0], [px - sd * 0.02, py + 0.1, 0], [px - sd * 0.05, py + 0.12, 0]], 0.012, 12, 8), M.enamel(0x1a4ab8)));
      var feathers = [];
      for (var k = 0; k < 15; k++) {
        var a = (k / 14 - 0.5) * 2.2;
        for (var r = 1; r <= 4; r++) feathers.push({ p: [px + sd * 0.04 + Math.sin(a) * 0.05 * r, py + Math.cos(a) * 0.05 * r - 0.02, -0.02 - r * 0.004], s: 0.012 + r * 0.002, c: r === 4 ? 0x0e8a44 : r === 3 ? 0x1838b0 : 0xd9a646 });
      }
      var fm = M.gem(0xffffff, { flatShading: false, roughness: 0.1, emissive: new THREE.Color(0x000000) });
      g.add(T.inst(new THREE.SphereGeometry(1, 12, 8), fm, feathers));
    });
    g.add(T.mesh(T.tube([[0, 1.1, 0], [0, 1.22, 0]], 0.012, 6, 6), gold));
    g.add(T.inst(new THREE.SphereGeometry(1, 10, 8), M.gem(0x0e8a44, { flatShading: false }), Array.from({ length: 10 }, function (_, k) { var a = k / 10 * Math.PI * 2; return { p: [Math.cos(a) * 0.05, 1.24 + Math.sin(a) * 0.04, 0], s: 0.022 }; })));
    g.userData = { elev: 14 };
    return g;
  };

  /* ---------------- 원석 받침대 둘레 */
  function matrixRock(col, r, n) {
    var mt = M.stone({ color: col, roughness: 0.75 }); mt.bumpMap = T.tex(T.noiseCanvas(512, 512, 10, 40, 220, 5), { linear: true }); mt.bumpScale = 0.01;
    var m = T.mesh(T.rockGeo(r, 0.32, 1.8), mt);
    m.scale.set(1.3, 0.55, 1.0);
    return m;
  }
  /* ---------------- 모곡 루비 */
  O.mogokruby = function () {
    var g = T.group();
    var rock = matrixRock(0x9a958c, 0.3); rock.position.y = 0.1; rock.scale.y = 0.42; g.add(rock);
    var rm = M.gem(0x9a0618, { emissive: new THREE.Color(0x3a0006) });
    [[0, 0.22, 0.05, 0.12, 0.14, 0.1], [-0.15, 0.2, 0.0, 0.08, 0.1, -0.5], [0.15, 0.2, -0.04, 0.09, 0.1, 0.6], [0.04, 0.22, -0.14, 0.07, 0.09, 0.2], [-0.05, 0.18, 0.15, 0.06, 0.08, 0.9]].forEach(function (q) {
      var c = T.mesh(T.crystalGeo(1, 0.6, 0.05), rm, q[0], q[1], q[2]); c.scale.set(q[3], q[4], q[3]); c.rotation.set(q[5] * 0.6, q[5], q[5] * 0.4); g.add(c);
    });
    // 옆에 깎은 비둘기피 루비
    g.add(T.mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.12, 24), M.gold(), 0.42, 0.06, 0.2));
    g.add(gem('cushion', rm, 0.1, [0.42, 0.19, 0.2], [0, 1, 0.6]));
    g.userData = { elev: 18 };
    return g;
  };
  /* ---------------- 라트나푸라 사파이어 */
  O.lankasapphire = function () {
    var g = T.group(), sm = M.gem(0x1e46c8, { emissive: new THREE.Color(0x061440) });
    g.add(gem('oval', sm, 0.2, [0, 0.42, 0.0], [0, 0.15, 1]));
    for (var i = 0; i < 22; i++) { var a = i / 22 * Math.PI * 2; g.add(gem('round', M.diamond(), 0.025, [Math.cos(a) * 0.235, 0.42 + Math.sin(a) * 0.17, -0.03], [0, 0.15, 1])); }
    g.add(bezel(0.2, [0, 0.42, -0.04], [0, 0.15, 1], M.gold()));
    g.children[g.children.length - 1].scale.set(1.1, 0.8, 1);
    g.add(T.mesh(T.tube([[0, 0.62, -0.04], [0, 0.72, -0.05]], 0.012, 8, 8), M.gold()));
    g.add(T.mesh(new THREE.TorusGeometry(0.035, 0.008, 8, 24), M.gold(), 0, 0.75, -0.05));
    // 받침대와 강돌 원석
    g.add(T.mesh(T.lathe(T.smoothProfile([[0, 0], [0.3, 0], [0.28, 0.04], [0.06, 0.08], [0.04, 0.2], [0.05, 0.22], [0.0, 0.22]], 30), 48), M.lacquer(), 0, 0, -0.1));
    for (i = 0; i < 6; i++) { var s = T.rr(0.03, 0.06), m = T.mesh(T.roughGeo(1, 24, 0.25), M.cabochon(T.pick([0x2a52c8, 0x4a6ad0, 0x1a3aa0]), { flatShading: true, roughness: 0.25 }), T.rr(-0.45, 0.45), s * 0.6, T.rr(0.1, 0.35)); m.scale.set(s, s * 0.7, s); g.add(m); }
    g.userData = { elev: 10 };
    return g;
  };
  /* ---------------- 무소 에메랄드 */
  O.muzoemerald = function () {
    var g = T.group();
    var rock = matrixRock(0x2a2622, 0.42); rock.position.y = 0.18; g.add(rock);
    var calc = matrixRock(0xe6e0d0, 0.18); calc.position.set(0.15, 0.3, 0.1); g.add(calc);
    var em = M.gem(0x0aa04a, { emissive: new THREE.Color(0x02300f), roughness: 0.03 });
    [[0, 0.32, 0.05, 0.08, 0.55, 0.1], [-0.16, 0.3, -0.02, 0.05, 0.32, -0.45], [0.16, 0.3, -0.06, 0.055, 0.36, 0.5], [-0.05, 0.3, -0.18, 0.04, 0.26, -0.2]].forEach(function (q) {
      var c = T.mesh(T.crystalGeo(1, 1, 0), em, q[0], q[1], q[2]); c.scale.set(q[3], q[4], q[3]); c.rotation.set(0, q[5], q[5] * 0.5); g.add(c);
    });
    g.userData = { elev: 16 };
    return g;
  };
  /* ---------------- 라 페레그리나 진주 */
  O.peregrina = function () {
    var g = T.group();
    var pearl = T.mesh(T.lathe(T.smoothProfile([[0.0, -0.17], [0.07, -0.15], [0.115, -0.07], [0.11, 0.03], [0.07, 0.12], [0.025, 0.16], [0.0, 0.165]], 60), 64), M.pearl(), 0, 0.45, 0);
    g.add(pearl);
    var cap = T.mesh(T.lathe([[0.0, 0.6], [0.045, 0.6], [0.06, 0.62], [0.05, 0.66], [0.0, 0.67]], 32), M.silver(), 0, 0, 0); g.add(cap);
    // 다이아몬드 박은 고리 장식
    g.add(T.mesh(T.tube([[0, 0.66, 0], [0, 0.78, 0], [-0.08, 0.86, 0], [0, 0.94, 0], [0.08, 0.86, 0], [0, 0.78, 0]], 0.012, 48, 8), M.silver()));
    [[0, 0.72], [0, 0.8], [-0.06, 0.86], [0.06, 0.86], [0, 0.92]].forEach(function (p) { g.add(gem('round', M.diamond(), 0.022, [p[0], p[1], 0.015], [0, 0, 1])); });
    // 금 진열 받침대 (거는 막대)
    var gm = M.gold({ roughness: 0.3 });
    g.add(T.mesh(T.lathe([[0, 0], [0.3, 0], [0.3, 0.03], [0.04, 0.06], [0.0, 0.06]], 40), gm));
    g.add(T.mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.05, 12), gm, -0.24, 0.52, 0));
    g.add(T.mesh(T.tube([[-0.24, 1.04, 0], [-0.12, 1.08, 0], [0, 1.05, 0]], 0.01, 16, 8), gm));
    g.add(T.mesh(T.tube([[0, 1.05, 0], [0, 0.94, 0]], 0.004, 4, 6), gm));
    g.userData = { elev: 8 };
    return g;
  };

  /* ---------------- 신라 금관 */
  O.sillacrown = function () {
    var g = T.group(), gm = M.gold({ roughness: 0.2, side: THREE.DoubleSide }), R = 0.42;
    var cv = T.canvas(1024, 64, function (c, w, h) { c.fillStyle = '#e2b24c'; c.fillRect(0, 0, w, h); c.fillStyle = '#8a5e18'; for (var i = 0; i < 160; i++) { c.beginPath(); c.arc(i * 6.4, 10, 1.6, 0, 7); c.arc(i * 6.4, h - 10, 1.6, 0, 7); c.fill(); } });
    var bm = M.gold({ roughness: 0.22, side: THREE.DoubleSide }); bm.map = T.tex(cv); bm.color = new THREE.Color(0xffffff);
    g.add(T.mesh(new THREE.CylinderGeometry(R, R, 0.1, 96, 1, true), bm, 0, 0.05, 0));
    function chul(h) { // 出자 나뭇가지 세움 장식 (평면)
      var w = 0.022, pts = [[-w, 0], [w, 0], [w, h]];
      var s = new THREE.Shape(); s.moveTo(-w, 0); s.lineTo(w, 0);
      [0.3, 0.55, 0.8].forEach(function (t) { s.lineTo(w, h * t - 0.02); s.lineTo(w + 0.1, h * t + 0.07); s.lineTo(w + 0.1, h * t + 0.13); s.lineTo(w + 0.08, h * t + 0.13); s.lineTo(w + 0.08, h * t + 0.08); s.lineTo(w, h * t + 0.02); });
      s.lineTo(w, h); s.lineTo(w + 0.025, h + 0.03); s.lineTo(0, h + 0.07); s.lineTo(-w - 0.025, h + 0.03); s.lineTo(-w, h);
      [0.8, 0.55, 0.3].forEach(function (t) { s.lineTo(-w, h * t + 0.02); s.lineTo(-w - 0.08, h * t + 0.08); s.lineTo(-w - 0.08, h * t + 0.13); s.lineTo(-w - 0.1, h * t + 0.13); s.lineTo(-w - 0.1, h * t + 0.07); s.lineTo(-w, h * t - 0.02); });
      s.closePath();
      return T.extrude(s, 0.004, 0.002);
    }
    function antler(h) {
      var s = new THREE.Shape(); s.moveTo(-0.02, 0); s.lineTo(0.02, 0); s.lineTo(0.02, h * 0.4); s.quadraticCurveTo(0.12, h * 0.5, 0.11, h * 0.8); s.lineTo(0.09, h * 0.8); s.quadraticCurveTo(0.09, h * 0.55, 0.02, h * 0.5);
      s.lineTo(0.02, h * 0.95); s.lineTo(-0.0, h); s.lineTo(-0.02, h * 0.95); s.lineTo(-0.02, h * 0.62); s.quadraticCurveTo(-0.1, h * 0.7, -0.1, h * 0.9); s.lineTo(-0.12, h * 0.9); s.quadraticCurveTo(-0.12, h * 0.6, -0.02, h * 0.5); s.closePath();
      return T.extrude(s, 0.004, 0.002);
    }
    var ups = [];
    [-0.75, 0, 0.75].forEach(function (a) { var m = T.mesh(chul(0.55), gm); onRim(m, R, a, 0.06); g.add(m); ups.push([a, 0.55]); });
    [Math.PI - 0.6, Math.PI + 0.6].forEach(function (a) { var m = T.mesh(antler(0.5), gm); onRim(m, R, a, 0.06); g.add(m); ups.push([a, 0.5]); });
    // 둥근 달개와 비취 곱은옥
    var sp = [], jade = [];
    ups.forEach(function (u) {
      for (var k = 0; k < 26; k++) {
        var t = T.rr(0.05, 1), y = 0.08 + u[1] * t, dx = T.rr(-0.11, 0.11) * Math.min(1, t * 2.5);
        var a = u[0] + dx / R, r = R + 0.01;
        sp.push({ p: [Math.sin(a) * r, y, Math.cos(a) * r], s: 0.016, r: [Math.PI / 2 + T.rr(-0.4, 0.4), a, T.rr(-0.5, 0.5)] });
      }
      for (k = 0; k < 4; k++) { var a2 = u[0] + T.rr(-0.12, 0.12), y2 = 0.15 + k * 0.12; jade.push({ p: [Math.sin(a2) * (R + 0.02), y2, Math.cos(a2) * (R + 0.02)], s: 0.03, r: [0, a2, T.rr(-0.4, 0.4)] }); }
    });
    for (var k = 0; k < 60; k++) { var a3 = k / 60 * Math.PI * 2; sp.push({ p: [Math.sin(a3) * (R + 0.012), 0.05 + (k % 2) * 0.03, Math.cos(a3) * (R + 0.012)], s: 0.014, r: [Math.PI / 2, a3, 0] }); }
    g.add(T.inst(new THREE.CylinderGeometry(1, 1, 0.08, 16), M.gold({ roughness: 0.15 }), sp));
    var gogok = T.taperTube([[0, 0.5, 0], [0.4, 0.3, 0], [0.45, -0.1, 0], [0.2, -0.45, 0]], function (t) { return 0.36 * (1 - t * 0.6); }, 24, 12);
    g.add(T.inst(gogok, M.jade({ color: 0x2f8a4a, roughness: 0.15 }), jade));
    // 늘어뜨린 드리개
    [-1, 1].forEach(function (sd) {
      var a = sd * 1.45, x = Math.sin(a) * R, z = Math.cos(a) * R;
      g.add(T.mesh(T.tube([[x, 0.02, z], [x * 1.02, -0.12, z * 1.02], [x * 1.03, -0.28, z * 1.03]], 0.006, 16, 6), gm));
      g.add(T.inst(new THREE.CylinderGeometry(1, 1, 0.08, 12), M.gold({ roughness: 0.15 }), Array.from({ length: 10 }, function (_, q) { return { p: [x * 1.02 + T.rr(-0.02, 0.02), -0.02 - q * 0.026, z * 1.02], s: 0.013, r: [Math.PI / 2, a, 0] }; })));
      var leaf = T.mesh(T.extrude([[0, 0], [0.03, -0.04], [0, -0.1], [-0.03, -0.04]], 0.004, 0.002), gm, x * 1.03, -0.28, z * 1.03); leaf.rotation.y = a; g.add(leaf);
    });
    g.userData = { elev: 10 };
    return g;
  };
})(T3);
