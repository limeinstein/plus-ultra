/* 교역품 발견 장면 — 등불 켜진 시장 좌판 위의 물건을 카메라가 천천히 다가가며 비춘다.
   T3.TRADE[id](T) → { g: 물건 묶음, bg: 'bazaar'|'china'|'americas'|'africa'|'arabia', tint } */
(function (T) {
  var M = T.mat, PT = T.paint;
  var X = T.TRADE = {};
  var V3 = function (x, y, z) { return new THREE.Vector3(x, y, z); };

  /* ------------------------------------------------ 공통 소품 */
  function weave(w, h, c1, c2, cell) {
    return T.canvas(w, h, function (g) {
      g.fillStyle = c1; g.fillRect(0, 0, w, h);
      cell = cell || 8;
      for (var y = 0; y < h; y += cell) for (var x = 0; x < w; x += cell) {
        var odd = ((x / cell) + (y / cell)) % 2;
        g.fillStyle = odd ? c2 : c1; g.fillRect(x + 1, y + 1, cell - 2, cell - 2);
        g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x, y + (odd ? 0 : cell - 2), cell, 2);
      }
      for (var i = 0; i < w * h / 200; i++) { g.fillStyle = 'rgba(' + (T.rnd() < 0.5 ? '0,0,0' : '255,240,210') + ',0.08)'; g.fillRect(T.rnd() * w, T.rnd() * h, 2, 2); }
    });
  }
  function burlapMat() { var c = weave(512, 256, '#9a7a4e', '#b08a58', 6); var m = M.cloth({ color: 0xffffff, roughness: 1, sheen: 0.3 }); m.map = T.tex(c, { repeat: [3, 2] }); m.bumpMap = T.tex(c, { linear: true, repeat: [3, 2] }); m.bumpScale = 0.004; return m; }
  function wickerMat(col) { var c = weave(512, 256, col || '#a07a40', '#c09a58', 10); var m = M.wood({ color: 0xffffff, roughness: 0.8 }); m.map = T.tex(c, { repeat: [4, 2] }); m.bumpMap = T.tex(c, { linear: true, repeat: [4, 2] }); m.bumpScale = 0.006; return m; }
  function woodMat(c1, c2) {
    var cv = T.pixels(512, 128, function (x, y) { var n = 0.5 + 0.5 * Math.sin(x * 0.05 + T.fbm(x / 60, y / 8, 1, 3) * 6), a = c1 || [92, 58, 32], b = c2 || [130, 86, 50]; return [a[0] + (b[0] - a[0]) * n, a[1] + (b[1] - a[1]) * n, a[2] + (b[2] - a[2]) * n]; });
    var m = M.wood({ color: 0xffffff, roughness: 0.62 }); m.map = T.tex(cv, { repeat: [2, 2] }); return m;
  }
  /** 자루: 입구를 접어 내린 마대 (높이 h, 반지름 r), 윗면 y를 돌려줌 */
  function sack(r, h) {
    var prof = [[0, 0], [r * 0.85, 0], [r, h * 0.12], [r * 1.05, h * 0.5], [r * 0.98, h * 0.85], [r * 1.02, h * 0.92], [r * 1.12, h * 0.96], [r * 1.1, h], [r * 0.95, h * 0.97]];
    var geo = T.lathe(T.smoothProfile(prof, 60), 64);
    T.warp(geo, function (v) { var a = Math.atan2(v.x, v.z), k = 1 + 0.05 * T.noise(Math.cos(a) * 2, Math.sin(a) * 2, v.y * 5); v.x *= k; v.z *= k; });
    var m = T.mesh(geo, burlapMat()); m.material.side = THREE.DoubleSide;
    return { m: m, top: h * 0.9, r: r * 0.95 };
  }
  function basket(r, h, col) {
    var prof = [[0, 0], [r * 0.7, 0], [r * 0.9, h * 0.3], [r, h], [r * 0.96, h * 1.02]];
    var m = T.mesh(T.lathe(T.smoothProfile(prof, 30), 48), wickerMat(col)); m.material.side = THREE.DoubleSide;
    var rim = T.mesh(new THREE.TorusGeometry(r, 0.018, 8, 48), wickerMat(col), 0, h, 0); rim.rotation.x = Math.PI / 2;
    return { m: T.group(m, rim), top: h * 0.92, r: r * 0.95 };
  }
  /** 무더기: 단위 기하 geo를 반지름 R, 높이 H인 둥근 산 모양으로 n개 */
  function heap(geo, mat, n, R, H, y0, s0, s1, colors, rotAll) {
    var list = [];
    for (var i = 0; i < n; i++) {
      var r = R * Math.sqrt(T.rnd()), a = T.rnd() * Math.PI * 2, top = H * (1 - Math.pow(r / R, 2));
      var y = y0 + top * (1 - Math.pow(T.rnd(), 3) * 0.35);
      list.push({ p: [Math.cos(a) * r, y, Math.sin(a) * r], s: T.rr(s0, s1), r: rotAll === false ? [0, T.rnd() * 6.28, 0] : [T.rnd() * 6.28, T.rnd() * 6.28, T.rnd() * 6.28], c: colors ? T.pick(colors) : undefined });
    }
    return T.inst(geo, mat, list);
  }
  function scatter(geo, mat, n, x0, x1, z0, z1, y, s0, s1, colors) {
    var list = [];
    for (var i = 0; i < n; i++) list.push({ p: [T.rr(x0, x1), y, T.rr(z0, z1)], s: T.rr(s0, s1), r: [T.rr(-0.3, 0.3), T.rnd() * 6.28, T.rr(-0.3, 0.3)], c: colors ? T.pick(colors) : undefined });
    return T.inst(geo, mat, list);
  }
  function scale() { // 놋쇠 저울
    var b = M.gold({ color: 0xc8a050, roughness: 0.35 }), g = T.group();
    g.add(T.mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.03, 24), b, 0, 0.015, 0));
    g.add(T.mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 8), b, 0, 0.26, 0));
    g.add(T.mesh(new THREE.BoxGeometry(0.46, 0.01, 0.01), b, 0, 0.5, 0));
    [-1, 1].forEach(function (s) {
      [0, 1, 2].forEach(function (k) { var a = k / 3 * Math.PI * 2; g.add(T.mesh(T.tube([[s * 0.22, 0.5, 0], [s * 0.22 + Math.cos(a) * 0.06, 0.32, Math.sin(a) * 0.06]], 0.002, 4, 4), b)); });
      g.add(T.mesh(T.lathe([[0, 0], [0.07, 0.0], [0.08, 0.02], [0.0, 0.01]], 24), b, s * 0.22, 0.31, 0));
    });
    return g;
  }
  function jar(col, h) { var m = T.mesh(T.lathe(T.smoothProfile([[0, 0], [0.06, 0], [0.1, 0.05], [0.11, h * 0.5], [0.07, h * 0.85], [0.05, h * 0.9], [0.06, h], [0.0, h]], 40), 40), M.glaze({ color: col || 0x5a6a3a, roughness: 0.25 })); return m; }
  function cloth(w, d, col, pattern) {
    var cv = T.canvas(512, 512, function (g, W, H) { g.fillStyle = col; g.fillRect(0, 0, W, H); if (pattern) pattern(g, W, H); });
    var geo = new THREE.PlaneGeometry(w, d, 30, 30); geo.rotateX(-Math.PI / 2);
    T.warp(geo, function (v) { v.y = 0.004 + 0.012 * T.noise(v.x * 4, v.z * 4, 3); });
    var m = M.cloth({ color: 0xffffff, sheen: 0 }); m.sheen = 0; m.map = T.tex(cv); m.side = THREE.DoubleSide;
    return T.mesh(geo, m);
  }
  function stripes(colors) { return function (g, W, H) { for (var i = 0; i < 16; i++) { g.fillStyle = colors[i % colors.length]; g.fillRect(0, i * H / 16, W, H / 32); } }; }

  /* ------------------------------------------------ 교역품 28 */
  // 작은 알갱이 모양
  var GEO = {
    ball: function () { return new THREE.IcosahedronGeometry(1, 1); },
    bean: function () { var g = new THREE.SphereGeometry(1, 10, 8); g.scale(1, 0.62, 0.72); return g; },
    grain: function () { var g = new THREE.SphereGeometry(1, 6, 4); g.scale(1, 0.4, 0.4); return g; },
    lump: function () { return T.roughGeo(1, 14, 0.4); }
  };

  X.t_pepper = function () {
    var g = T.group(), s = sack(0.32, 0.5); g.add(s.m);
    var pm = M.matte({ color: 0x1e1a16, roughness: 0.55, clearcoat: 0.2 }); pm.bumpMap = T.tex(T.noiseCanvas(64, 64, 3, 40, 220, 2), { linear: true }); pm.bumpScale = 0.002;
    g.add(heap(GEO.ball(), pm, 1600, s.r, 0.12, s.top, 0.011, 0.014, [0x2a2420, 0x1a1612, 0x3a3020, 0x4a2a1a]));
    var b = basket(0.24, 0.16); b.m.position.set(0.62, 0, 0.12); g.add(b.m);
    var gp = heap(GEO.ball(), M.glaze({ color: 0x4a6a2a, roughness: 0.4 }), 500, b.r, 0.07, b.top, 0.011, 0.013, [0x3a6a2a, 0x5a7a2a, 0x8a3a1a]); gp.position.set(0.62, 0, 0.12); g.add(gp);
    var sc = scale(); sc.position.set(-0.62, 0, 0.0); g.add(sc);
    g.add(scatter(GEO.ball(), pm, 120, -0.4, 0.4, 0.3, 0.55, 0.012, 0.011, 0.014));
    return { g: g, bg: 'bazaar' };
  };
  X.t_clove = function () {
    var cg = new THREE.CylinderGeometry(0.15, 0.08, 1, 6); cg.translate(0, -0.5, 0);
    var head = new THREE.SphereGeometry(0.3, 8, 6); head.translate(0, 0.08, 0);
    var clove = THREE.BufferGeometryUtils.mergeBufferGeometries([cg.toNonIndexed(), head.toNonIndexed()]);
    var g = T.group(), s = sack(0.3, 0.46); g.add(s.m);
    var cm = M.matte({ color: 0x5a3220, roughness: 0.7 });
    g.add(heap(clove, cm, 1100, s.r, 0.12, s.top + 0.01, 0.028, 0.034, [0x5a3220, 0x6a3a22, 0x4a2a18]));
    var b = basket(0.22, 0.14); b.m.position.set(0.6, 0, 0.15); g.add(b.m);
    var hb = heap(clove, cm, 380, b.r, 0.06, b.top + 0.01, 0.028, 0.034, [0x5a3220, 0x7a4226]); hb.position.set(0.6, 0, 0.15); g.add(hb);
    // 꽃봉오리 달린 가지
    var br = T.group(T.mesh(T.tube([[-0.8, 0.02, 0.2], [-0.6, 0.04, 0.25], [-0.45, 0.03, 0.2]], 0.008, 16, 6), M.wood({ color: 0x5a4a2a })));
    for (var i = 0; i < 8; i++) br.add(T.mesh(new THREE.SphereGeometry(0.014, 8, 6), M.matte({ color: i % 2 ? 0xc84a3a : 0xd88a3a }), -0.5 + T.rr(-0.06, 0.06), 0.05, 0.2 + T.rr(-0.04, 0.04)));
    g.add(br);
    return { g: g, bg: 'bazaar' };
  };
  X.t_nutmeg = function () {
    var g = T.group(), b = basket(0.34, 0.22); g.add(b.m);
    var nm = M.matte({ color: 0x6a4428, roughness: 0.55, clearcoat: 0.3 });
    g.add(heap(GEO.bean(), nm, 160, b.r, 0.1, b.top, 0.035, 0.042, [0x6a4428, 0x5a3820, 0x7a5030]));
    // 붉은 메이스(가종피)를 두른 씨와 쪼갠 노란 열매
    for (var i = 0; i < 4; i++) {
      var x = 0.55 + (i % 2) * 0.16, z = 0.1 + Math.floor(i / 2) * 0.18;
      var half = T.mesh(new THREE.SphereGeometry(0.07, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.matte({ color: 0xd8c070, roughness: 0.5 }), x, 0.0, z); half.rotation.x = Math.PI; half.position.y = 0.07; half.rotation.x = 0; g.add(half);
      var seed = T.mesh(new THREE.SphereGeometry(0.035, 16, 12), nm, x, 0.07, z); seed.scale.set(1, 0.8, 0.9); g.add(seed);
      for (var k = 0; k < 6; k++) { var a = k / 6 * Math.PI * 2; g.add(T.mesh(T.tube([[x + Math.cos(a) * 0.03, 0.06, z + Math.sin(a) * 0.03], [x + Math.cos(a + 0.3) * 0.02, 0.1, z + Math.sin(a + 0.3) * 0.02], [x, 0.11, z]], 0.006, 8, 5), M.glaze({ color: 0xc81a14, roughness: 0.3 }))); }
    }
    var j = jar(0x3a4a6a, 0.28); j.position.set(-0.6, 0, 0.0); g.add(j);
    return { g: g, bg: 'bazaar' };
  };
  X.t_cinnamon = function () {
    var g = T.group(), bark = M.matte({ color: 0x8a4a22, roughness: 0.75 });
    bark.bumpMap = T.tex(T.noiseCanvas(128, 128, 3, 40, 220, 3), { linear: true }); bark.bumpScale = 0.003;
    var quill = new THREE.CylinderGeometry(0.018, 0.018, 0.6, 12, 1, true); quill.rotateZ(Math.PI / 2);
    // 묶음 세 개
    [[-0.1, 0.0, 0.0], [0.22, 0.0, 0.12], [-0.05, 0.12, 0.06]].forEach(function (p, bi) {
      var list = [];
      for (var i = 0; i < 26; i++) { var a = T.rnd() * Math.PI * 2, r = Math.sqrt(T.rnd()) * 0.09; list.push({ p: [p[0] + T.rr(-0.02, 0.02), p[1] + 0.1 + Math.sin(a) * r, p[2] + Math.cos(a) * r], s: [T.rr(0.9, 1.05), 1, 1], r: [T.rr(-0.05, 0.05), T.rr(-0.05, 0.05) + bi * 0.3, 0] }); }
      var im = T.inst(quill, bark, list); im.material.side = THREE.DoubleSide; g.add(im);
      [-0.15, 0.15].forEach(function (o) { var t = T.mesh(new THREE.TorusGeometry(0.1, 0.008, 8, 24), M.cloth({ color: 0xc8b080 }), p[0] + o, p[1] + 0.1, p[2]); t.rotation.y = Math.PI / 2 + bi * 0.3; g.add(t); });
    });
    var b = basket(0.2, 0.12); b.m.position.set(-0.68, 0, 0.1); g.add(b.m);
    var hb = heap(new THREE.CylinderGeometry(0.2, 0.2, 1, 8), bark, 60, 0.18, 0.05, 0.11, 0.06, 0.08); hb.position.set(-0.68, 0, 0.1); g.add(hb);
    g.add(scatter(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 10).rotateZ(Math.PI / 2), bark, 8, 0.3, 0.8, 0.3, 0.55, 0.02, 1, 1));
    return { g: g, bg: 'bazaar' };
  };
  function knobby(n, len) {
    var parts = [], p = [0, 0, 0];
    for (var i = 0; i < n; i++) { var q = [p[0] + T.rr(0.4, 0.8) * len, p[1] + T.rr(-0.1, 0.3) * len, p[2] + T.rr(-0.4, 0.4) * len]; parts.push({ t: 'c', a: p, b: q, ra: 0.22 * len, rb: 0.2 * len, k: 0.08 * len }); if (T.rnd() < 0.5) { var r = [q[0] + T.rr(-0.3, 0.3) * len, q[1] + 0.2 * len, q[2] + T.rr(0.3, 0.6) * len]; parts.push({ t: 'c', a: q, b: r, ra: 0.17 * len, rb: 0.14 * len, k: 0.08 * len }); } p = q; }
    var geo = T.sdfMesh(T.partsSdf(parts, 0.06 * len), [-1 * len, -0.6 * len, -1.2 * len], [n * 0.9 * len + 0.5 * len, (n * 0.4 + 0.6) * len, 1.2 * len], 48);
    geo.computeBoundingBox(); var c = new THREE.Vector3(); geo.boundingBox.getCenter(c); geo.translate(-c.x, -c.y, -c.z);
    return geo;
  }
  X.t_ginger = function () {
    var g = T.group(), b = basket(0.36, 0.2); g.add(b.m);
    var gm = M.matte({ color: 0xc8a070, roughness: 0.7 }); gm.bumpMap = T.tex(T.noiseCanvas(128, 128, 4, 40, 220, 3), { linear: true }); gm.bumpScale = 0.002;
    var shapes = [knobby(4, 0.1), knobby(3, 0.11), knobby(5, 0.09)];
    shapes.forEach(function (sg, i) { g.add(heap(sg, gm, 14, b.r * 0.85, 0.08, b.top + 0.03, 0.9, 1.1, [0xc8a070, 0xb89060, 0xd8b080])); });
    var sliced = []; for (var i = 0; i < 8; i++) sliced.push({ p: [0.5 + T.rr(0, 0.2), 0.008, 0.3 + T.rr(0, 0.1)], s: [0.04, 0.008, 0.035], r: [0, T.rnd() * 6, 0] });
    g.add(T.inst(new THREE.CylinderGeometry(1, 1, 1, 16), M.matte({ color: 0xe8d090 }), sliced));
    var j = jar(0x6a3a2a, 0.3); j.position.set(-0.62, 0, 0); g.add(j);
    return { g: g, bg: 'bazaar' };
  };
  X.t_allspice = function () {
    var g = T.group(), s = sack(0.3, 0.46); g.add(s.m);
    var am = M.matte({ color: 0x6a3020, roughness: 0.6 });
    g.add(heap(GEO.ball(), am, 1300, s.r, 0.12, s.top, 0.014, 0.018, [0x6a3020, 0x7a3a22, 0x5a2818, 0x8a4a2a]));
    var lf = new THREE.PlaneGeometry(0.05, 0.14);
    g.add(scatter(lf, M.matte({ color: 0x3a5a2a, side: THREE.DoubleSide }), 14, 0.35, 0.8, 0.1, 0.5, 0.01, 1, 1.3, [0x3a5a2a, 0x4a6a30]));
    var b = basket(0.2, 0.14, '#7a6030'); b.m.position.set(-0.6, 0, 0.12); g.add(b.m);
    var hb = heap(GEO.ball(), am, 300, b.r, 0.06, b.top, 0.014, 0.018, [0x6a3020, 0x8a4a2a]); hb.position.set(-0.6, 0, 0.12); g.add(hb);
    return { g: g, bg: 'americas' };
  };
  X.t_coffee = function () {
    var g = T.group(), s = sack(0.3, 0.46); g.add(s.m);
    var bean = GEO.bean(); bean.scale(1, 1, 1);
    g.add(heap(bean, M.matte({ color: 0x4a2a16, roughness: 0.4, clearcoat: 0.4 }), 900, s.r, 0.12, s.top, 0.016, 0.02, [0x4a2a16, 0x3a2010, 0x5a3420]));
    var b = basket(0.22, 0.12); b.m.position.set(0.58, 0, 0.1); g.add(b.m);
    var hb = heap(bean, M.matte({ color: 0x8a9a6a }), 300, b.r, 0.06, b.top, 0.016, 0.02, [0x8a9a6a, 0x9aa070]); hb.position.set(0.58, 0, 0.1); g.add(hb);
    // 놋쇠 주전자 (달라)
    var brass = M.gold({ color: 0xc89a4a, roughness: 0.25 });
    var pot = T.mesh(T.lathe(T.smoothProfile([[0, 0], [0.1, 0], [0.12, 0.08], [0.08, 0.16], [0.05, 0.24], [0.07, 0.3], [0.0, 0.34]], 40), 40), brass, -0.6, 0, 0.05); g.add(pot);
    g.add(T.mesh(T.tube([[-0.5, 0.12, 0.05], [-0.42, 0.26, 0.05], [-0.38, 0.3, 0.05]], 0.012, 12, 6), brass));
    g.add(T.mesh(new THREE.TorusGeometry(0.06, 0.008, 8, 20, Math.PI), brass, -0.72, 0.16, 0.05).rotateZ(Math.PI / 2));
    [[-0.35, 0.25], [-0.25, 0.32]].forEach(function (p) { g.add(T.mesh(T.lathe([[0, 0], [0.025, 0], [0.035, 0.05], [0.0, 0.045]], 20), M.glaze({ color: 0xf0eee8 }), p[0], 0, p[1])); });
    return { g: g, bg: 'arabia' };
  };
  X.t_tea = function () {
    var g = T.group(), wm = woodMat([120, 80, 40], [160, 110, 60]);
    var box = T.group(T.mesh(new THREE.BoxGeometry(0.6, 0.36, 0.42), wm, 0, 0.18, 0));
    var label = T.canvas(256, 256, function (c, w, h) { c.fillStyle = '#e8d8b0'; c.fillRect(0, 0, w, h); c.fillStyle = '#b02010'; c.font = 'bold 90px "Noto Serif CJK TC"'; c.textAlign = 'center'; c.fillText('武夷', w / 2, 110); c.fillText('茶', w / 2, 220); });
    box.add(T.mesh(new THREE.PlaneGeometry(0.2, 0.2), M.paper({ map: T.tex(label) }), 0, 0.2, 0.211));
    g.add(box);
    var leafCv = T.pixels(128, 128, function (x, y) { var n = 0.5 + 0.5 * T.noise(x / 3, y / 3); return [30 + n * 30, 26 + n * 26, 14 + n * 10]; });
    var lm = M.matte({ map: T.tex(leafCv), roughness: 0.8 }); lm.bumpMap = T.tex(leafCv, { linear: true }); lm.bumpScale = 0.01;
    var leaves = new THREE.PlaneGeometry(0.56, 0.38, 40, 30); leaves.rotateX(-Math.PI / 2); T.warp(leaves, function (v) { v.y = 0.035 * (1 - Math.pow(v.x / 0.28, 2)) * (1 - Math.pow(v.z / 0.19, 2)) + 0.01 * T.noise(v.x * 30, v.z * 30); });
    g.add(T.mesh(leaves, lm, 0, 0.35, 0));
    var lid = T.mesh(new THREE.BoxGeometry(0.62, 0.03, 0.44), wm, 0, 0.5, -0.3); lid.rotation.x = -1.2; g.add(lid);
    // 차 벽돌과 찻주전자
    [[0.55, 0.0], [0.6, 0.12]].forEach(function (p, i) { var b = T.mesh(new THREE.BoxGeometry(0.22, 0.04, 0.14), M.matte({ color: 0x3a2a18, roughness: 0.9 }), p[0], 0.02 + i * 0.04, p[1]); b.rotation.y = i * 0.3; g.add(b); });
    var tp = T.mesh(T.lathe(T.smoothProfile([[0, 0], [0.08, 0], [0.11, 0.06], [0.1, 0.12], [0.05, 0.15], [0.0, 0.16]], 30), 40), M.glaze({ color: 0x8a4a2a, roughness: 0.4 }), -0.58, 0, 0.1); g.add(tp);
    g.add(T.mesh(T.tube([[-0.48, 0.06, 0.1], [-0.42, 0.12, 0.1], [-0.4, 0.15, 0.1]], 0.012, 10, 6), M.glaze({ color: 0x8a4a2a })));
    return { g: g, bg: 'china' };
  };
  X.t_cacao = function () {
    var g = T.group();
    var pod = T.lathe(T.smoothProfile([[0, -0.12], [0.05, -0.1], [0.07, -0.02], [0.065, 0.06], [0.03, 0.12], [0, 0.13]], 30), 40);
    T.warp(pod, function (v) { var a = Math.atan2(v.x, v.z), k = 1 + 0.08 * Math.pow(Math.abs(Math.cos(a * 5)), 0.5); v.x *= k; v.z *= k; });
    var b = basket(0.34, 0.16, '#8a6a3a'); g.add(b.m);
    var list = []; for (var i = 0; i < 9; i++) { var a = i / 9 * Math.PI * 2 + T.rnd() * 0.4, r = i < 6 ? 0.16 : 0.0; list.push({ p: [Math.cos(a) * r, b.top + 0.05 + (i >= 6 ? 0.06 : 0), Math.sin(a) * r], s: 1, r: [Math.PI / 2, a, T.rr(-0.3, 0.3)], c: T.pick([0xc86a1a, 0xa83a1a, 0xd89a2a, 0x8a3a20]) }); }
    g.add(T.inst(pod, M.glaze({ color: 0xffffff, roughness: 0.45 }), list));
    // 쪼갠 꼬투리와 콩 그릇
    var bowl = T.mesh(T.lathe(T.smoothProfile([[0, 0], [0.08, 0], [0.16, 0.05], [0.18, 0.08], [0.0, 0.03]], 20), 40), M.wood({ color: 0x5a3a20 }), 0.6, 0, 0.15); g.add(bowl);
    var bb = heap(GEO.bean(), M.matte({ color: 0x5a2a1a, roughness: 0.5 }), 120, 0.14, 0.04, 0.05, 0.02, 0.025); bb.position.set(0.6, 0, 0.15); g.add(bb);
    g.add(T.mesh(pod, M.glaze({ color: 0xd89a2a }), -0.55, 0.06, 0.15).rotateZ(Math.PI / 2));
    return { g: g, bg: 'americas' };
  };
  X.t_tobacco = function () {
    var g = T.group();
    var leafCv = T.canvas(128, 256, function (c, w, h) { c.fillStyle = '#8a5a2a'; c.beginPath(); c.moveTo(w / 2, 0); c.quadraticCurveTo(w, h * 0.4, w / 2, h); c.quadraticCurveTo(0, h * 0.4, w / 2, 0); c.fill(); c.strokeStyle = '#c89a5a'; c.lineWidth = 3; c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.stroke(); for (var i = 1; i < 8; i++) { c.beginPath(); c.moveTo(w / 2, i * h / 8); c.lineTo(w * 0.15, i * h / 8 - 20); c.moveTo(w / 2, i * h / 8); c.lineTo(w * 0.85, i * h / 8 - 20); c.stroke(); } });
    var lm = new THREE.MeshPhysicalMaterial({ map: T.tex(leafCv), alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.8 });
    var lg = new THREE.PlaneGeometry(0.14, 0.32, 4, 8); lg.translate(0, -0.16, 0); T.warp(lg, function (v) { v.z = 0.03 * Math.sin(v.y * 8); });
    // 매달아 말리는 다발
    var rod = T.mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.8, 8), M.wood({ color: 0x4a3018 }), 0, 0.6, -0.25); rod.rotation.z = Math.PI / 2; g.add(rod);
    var list = []; for (var i = 0; i < 7; i++) for (var k = 0; k < 6; k++) list.push({ p: [-0.75 + i * 0.25 + T.rr(-0.03, 0.03), 0.59, -0.25], s: [1, T.rr(0.9, 1.1), 1], r: [T.rr(-0.3, 0.3), k / 6 * Math.PI * 2, T.rr(-0.15, 0.15)], c: T.pick([0xffffff, 0xd8c0a0, 0xc8a080]) });
    g.add(T.inst(lg, lm, list));
    // 말아 놓은 잎담배와 잎 더미
    var cig = new THREE.CylinderGeometry(0.018, 0.016, 0.22, 12); cig.rotateZ(Math.PI / 2);
    var cl = []; for (i = 0; i < 18; i++) cl.push({ p: [0.1 + (i % 6) * 0.04, 0.02 + Math.floor(i / 6) * 0.034, 0.25], s: 1, r: [0, 0.1, 0] });
    g.add(T.inst(cig, M.matte({ color: 0x6a3a1a, roughness: 0.8 }), cl));
    var b = basket(0.24, 0.14, '#8a6a3a'); b.m.position.set(-0.45, 0, 0.15); g.add(b.m);
    var pile = []; for (i = 0; i < 18; i++) pile.push({ p: [-0.45 + T.rr(-0.1, 0.1), 0.14 + T.rr(0, 0.06), 0.15 + T.rr(-0.1, 0.1)], s: [1, 0.7, 1], r: [Math.PI / 2 + T.rr(-0.4, 0.4), T.rnd() * 6, 0] });
    g.add(T.inst(lg, lm, pile));
    return { g: g, bg: 'americas' };
  };
  X.t_maize = function () {
    var g = T.group();
    var kern = T.canvas(256, 512, function (c, w, h) { var cols = ['#e8b830', '#d89a20', '#f0c840', '#c8402a', '#5a3a8a']; for (var y = 0; y < h; y += 16) for (var x = 0; x < w; x += 16) { c.fillStyle = T.rnd() < 0.85 ? cols[0 + (T.rnd() * 3 | 0)] : T.pick(cols); c.beginPath(); c.ellipse(x + 8, y + 8, 7, 7, 0, 0, 7); c.fill(); } });
    var km = M.glaze({ map: T.tex(kern), roughness: 0.35 }); km.bumpMap = T.tex(kern, { linear: true }); km.bumpScale = 0.004;
    var cob = T.lathe(T.smoothProfile([[0, -0.11], [0.03, -0.1], [0.038, 0.0], [0.03, 0.09], [0.0, 0.11]], 20), 24);
    var b = basket(0.36, 0.18, '#9a7a40'); g.add(b.m);
    var list = []; for (var i = 0; i < 14; i++) { var a = T.rnd() * 6.28, r = T.rr(0, 0.22); list.push({ p: [Math.cos(a) * r, b.top + 0.05 + T.rr(0, 0.06), Math.sin(a) * r], s: 1, r: [Math.PI / 2 + T.rr(-0.3, 0.3), T.rnd() * 6, T.rr(-0.4, 0.4)] }); }
    g.add(T.inst(cob, km, list));
    // 껍질 벗긴 이삭 두 개 + 껍질
    [[0.55, 0.15, 0.4], [0.62, 0.3, -0.3]].forEach(function (p) {
      var m = T.mesh(cob, km, p[0], 0.04, p[1]); m.rotation.set(Math.PI / 2, p[2], 0); g.add(m);
      for (var k = 0; k < 3; k++) { var h = T.mesh(new THREE.PlaneGeometry(0.08, 0.26), M.matte({ color: 0xd8c890, side: THREE.DoubleSide }), p[0] + 0.12 * Math.cos(p[2]), 0.02, p[1] - 0.1 * Math.sin(p[2])); h.rotation.set(-Math.PI / 2 + 0.3, 0, p[2] + k * 0.3 - 0.3); g.add(h); }
    });
    var j = jar(0x8a4a2a, 0.3); j.position.set(-0.6, 0, 0.05); g.add(j);
    return { g: g, bg: 'americas' };
  };
  X.t_potato = function () {
    var g = T.group(), b = basket(0.36, 0.2, '#8a6a3a'); g.add(b.m);
    var pm = M.matte({ color: 0x9a6a3a, roughness: 0.85 }); pm.bumpMap = T.tex(T.noiseCanvas(128, 128, 3, 40, 220, 3), { linear: true }); pm.bumpScale = 0.003;
    var pg = T.rockGeo(1, 0.15, 1.2, 3);
    g.add(heap(pg, pm, 34, b.r * 0.8, 0.1, b.top + 0.03, 0.045, 0.06, [0x9a6a3a, 0x7a4a2a, 0x6a3a5a, 0xc8a060]));
    g.add(scatter(pg, pm, 6, 0.4, 0.8, 0.1, 0.45, 0.04, 0.045, 0.055, [0x9a6a3a, 0x6a3a5a, 0xc8a060]));
    var cl = cloth(0.6, 0.4, '#a03020', stripes(['#a03020', '#e8c040', '#2a6a5a', '#f0e8d0'])); cl.position.set(-0.55, 0, 0.15); g.add(cl);
    g.add(scatter(pg, pm, 5, -0.75, -0.35, 0.05, 0.3, 0.05, 0.04, 0.05, [0x6a3a5a, 0xc8a060]));
    return { g: g, bg: 'americas' };
  };
  X.t_rice = function () {
    var g = T.group(), s = sack(0.32, 0.48); g.add(s.m);
    var rm = M.glaze({ color: 0xf0ece0, roughness: 0.4, clearcoat: 0.3 });
    g.add(heap(GEO.grain(), rm, 2600, s.r, 0.12, s.top, 0.009, 0.011, [0xf2eee4, 0xe8e2d4, 0xfaf6ee]));
    // 됫박(나무 되)과 볏단
    var box = T.mesh(new THREE.BoxGeometry(0.2, 0.1, 0.2), woodMat(), 0.6, 0.05, 0.15); g.add(box);
    var hb = heap(GEO.grain(), rm, 500, 0.09, 0.05, 0.1, 0.009, 0.011); hb.position.set(0.6, 0, 0.15); g.add(hb);
    var straw = []; for (var i = 0; i < 80; i++) { var a = T.rnd() * 6.28, r = T.rnd() * 0.05; straw.push({ p: [-0.6 + Math.cos(a) * r, 0.25, 0.0 + Math.sin(a) * r], s: 1, r: [T.rr(-0.15, 0.15), 0, T.rr(-0.15, 0.15)] }); }
    g.add(T.inst(new THREE.CylinderGeometry(0.003, 0.003, 0.5, 4), M.matte({ color: 0xc8a850 }), straw));
    g.add(T.mesh(new THREE.TorusGeometry(0.055, 0.008, 6, 20), M.matte({ color: 0x8a6a30 }), -0.6, 0.3, 0).rotateX(Math.PI / 2));
    g.add(heap(GEO.grain(), M.matte({ color: 0xd8b860 }), 300, 0.08, 0.06, 0.5, 0.01, 0.012).translateX(-0.6));
    return { g: g, bg: 'bazaar' };
  };
  X.t_silkraw = function () {
    var g = T.group(), silk = M.cloth({ color: 0xf2e8c8, roughness: 0.4, sheen: 1 });
    // 생사 타래: 꼬인 고리
    for (var i = 0; i < 5; i++) {
      var t = T.mesh(new THREE.TorusGeometry(0.12, 0.035, 16, 48), silk, -0.25 + i * 0.13, 0.04 + (i % 2) * 0.06, (i % 2) * 0.1); t.rotation.set(Math.PI / 2 - 0.2, 0, i * 0.4); t.scale.set(1, 0.45, 1); g.add(t);
    }
    var b = basket(0.22, 0.12, '#9a7a40'); b.m.position.set(0.52, 0, 0.1); g.add(b.m);
    var coc = GEO.bean(); var hb = heap(coc, M.cloth({ color: 0xf8f4ea, roughness: 0.9 }), 60, b.r, 0.05, b.top, 0.03, 0.036, [0xf8f4ea, 0xf0e4b0]); hb.position.set(0.52, 0, 0.1); g.add(hb);
    var bolt = T.mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 24), M.cloth({ color: 0xc8382a, sheen: 1 }), -0.55, 0.06, -0.2); bolt.rotation.z = Math.PI / 2; g.add(bolt);
    var bolt2 = T.mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 24), M.cloth({ color: 0x2a5a8a, sheen: 1 }), -0.55, 0.18, -0.2); bolt2.rotation.z = Math.PI / 2; g.add(bolt2);
    return { g: g, bg: 'china' };
  };
  X.t_antique = function () {
    var g = T.group();
    g.add(T.mesh(T.lathe(T.smoothProfile([[0, 0], [0.08, 0], [0.12, 0.1], [0.14, 0.22], [0.08, 0.32], [0.06, 0.4], [0.1, 0.46], [0.0, 0.45]], 40), 40), M.patina({ color: 0x5a7a5a })));
    var cv = T.canvas(512, 256, function (c, w, h) { c.fillStyle = '#c8a878'; c.fillRect(0, 0, w, h); c.strokeStyle = '#3a2a18'; c.lineWidth = 6; for (var i = 0; i < 8; i++) { c.beginPath(); c.moveTo(i * 64, 80); c.lineTo(i * 64 + 32, 40); c.lineTo(i * 64 + 64, 80); c.stroke(); } c.fillStyle = '#2a1a10'; for (i = 0; i < 4; i++) { c.beginPath(); c.ellipse(64 + i * 128, 170, 30, 50, 0, 0, 7); c.fill(); } });
    var am = T.mesh(T.lathe(T.smoothProfile([[0, 0], [0.06, 0], [0.13, 0.12], [0.12, 0.24], [0.06, 0.32], [0.07, 0.36], [0.0, 0.36]], 40), 40), M.matte({ map: T.tex(cv), roughness: 0.7 }), 0.5, 0, 0.1); g.add(am);
    // 작은 청동 불상 (SDF)
    var bud = T.sdfMesh(T.partsSdf([{ t: 'e', c: [0, 0.06, 0], r: [0.08, 0.05, 0.06] }, { t: 'e', c: [0, 0.14, 0], r: [0.05, 0.07, 0.04] }, { t: 's', c: [0, 0.23, 0.005], r: 0.035 }, { t: 's', c: [0, 0.27, 0], r: 0.015 }], 0.02), [-0.1, 0, -0.08], [0.1, 0.3, 0.08], 64);
    g.add(T.mesh(bud, M.bronze({ color: 0x7a5a30 }), -0.45, 0.02, 0.1));
    g.add(T.mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.03, 24), M.bronze({ color: 0x5a4020 }), -0.45, 0.015, 0.1));
    var coins = []; for (var i = 0; i < 16; i++) coins.push({ p: [T.rr(-0.2, 0.2), 0.005, T.rr(0.25, 0.4)], s: 1, r: [T.rr(-0.1, 0.1), T.rnd() * 6, 0] });
    g.add(T.inst(new THREE.CylinderGeometry(0.02, 0.02, 0.004, 16), M.bronze({ color: 0x8a6a3a }), coins));
    return { g: g, bg: 'arabia' };
  };
  function carpetCanvas(base) {
    return T.canvas(512, 768, function (c, w, h) {
      c.fillStyle = base || '#8a1a1a'; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#1a2a5a'; c.lineWidth = 30; c.strokeRect(20, 20, w - 40, h - 40); c.strokeStyle = '#e8d8a0'; c.lineWidth = 6; c.strokeRect(46, 46, w - 92, h - 92);
      for (var i = 0; i < 20; i++) { c.fillStyle = T.pick(['#e8c060', '#1a3a6a', '#f0e8d0', '#3a6a3a']); c.beginPath(); c.arc(T.pick([30, w - 30]), 40 + i * (h - 80) / 20, 8, 0, 7); c.fill(); }
      c.save(); c.translate(w / 2, h / 2); c.fillStyle = '#1a2a5a'; c.beginPath(); for (i = 0; i < 16; i++) { var a = i / 16 * Math.PI * 2, r = i % 2 ? 90 : 150; c.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 1.3); } c.fill(); c.fillStyle = '#e8c060'; c.beginPath(); c.arc(0, 0, 50, 0, 7); c.fill(); c.restore();
      for (i = 0; i < 60; i++) { c.fillStyle = T.pick(['#e8c060', '#f0e8d0', '#3a6a3a', '#1a3a6a']); var x = T.rr(80, w - 80), y = T.rr(80, h - 80); if (Math.hypot(x - w / 2, (y - h / 2) / 1.4) < 160) continue; c.beginPath(); c.ellipse(x, y, 6, 12, T.rnd() * 3, 0, 7); c.fill(); }
      for (i = 0; i < 4000; i++) { c.fillStyle = 'rgba(0,0,0,0.08)'; c.fillRect(T.rnd() * w, T.rnd() * h, 2, 2); }
    });
  }
  X.t_carpet = function () {
    var g = T.group();
    var hang = new THREE.PlaneGeometry(0.6, 0.8, 20, 30); T.warp(hang, function (v) { v.z = 0.02 * Math.sin(v.x * 10) * (0.5 - v.y / 0.8); });
    var m = M.cloth({ color: 0xffffff, roughness: 1 }); m.map = T.tex(carpetCanvas('#8a1a1a')); m.side = THREE.DoubleSide;
    g.add(T.mesh(hang, m, -0.1, 0.42, -0.35));
    g.add(T.mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 8), M.wood({ color: 0x3a2010 }), -0.1, 0.82, -0.35).rotateZ(Math.PI / 2));
    [[0.0, '#1a3a6a'], [0.18, '#7a1a2a'], [0.36, '#3a5a3a']].forEach(function (q, i) {
      var cv = carpetCanvas(q[1]), rm = M.cloth({ color: 0xffffff }); rm.map = T.tex(cv);
      var r = T.mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 24), rm, 0.45 - i * 0.05, 0.07 + (i === 2 ? 0.12 : 0), 0.1 + q[0] * (i === 2 ? 0.5 : 1)); r.rotation.z = Math.PI / 2; r.rotation.y = 0.4; g.add(r);
    });
    var flat = cloth(0.6, 0.4, '#6a1a1a', function (c, w, h) { c.drawImage(carpetCanvas('#6a1a1a'), 0, 0, w, h); }); flat.position.set(-0.45, 0, 0.2); flat.rotation.y = 0.2; g.add(flat);
    return { g: g, bg: 'arabia' };
  };
  function chintzCanvas(base) {
    return T.canvas(512, 512, function (c, w, h) {
      c.fillStyle = base; c.fillRect(0, 0, w, h);
      for (var i = 0; i < 40; i++) { var x = T.rnd() * w, y = T.rnd() * h; c.strokeStyle = '#2a5a2a'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 20, y - 30, x + 40, y - 10); c.stroke(); for (var k = 0; k < 6; k++) { c.fillStyle = T.pick(['#c8282a', '#e85a5a', '#2a4a9a']); c.beginPath(); c.ellipse(x + 40 + Math.cos(k) * 10, y - 10 + Math.sin(k) * 10, 8, 5, k, 0, 7); c.fill(); } c.fillStyle = '#e8c040'; c.beginPath(); c.arc(x + 40, y - 10, 5, 0, 7); c.fill(); }
      for (i = 0; i < 6; i++) { var bx = T.rnd() * w, by = T.rnd() * h; c.fillStyle = '#2a4a9a'; c.beginPath(); c.ellipse(bx, by, 18, 8, 0.3, 0, 7); c.fill(); c.fillStyle = '#c8282a'; c.beginPath(); c.moveTo(bx + 14, by); c.lineTo(bx + 30, by - 14); c.lineTo(bx + 24, by + 4); c.fill(); }
    });
  }
  X.t_chintz = function () {
    var g = T.group();
    ['#f4ecd8', '#c8282a', '#1a2a5a', '#e8d8a0', '#2a5a3a'].forEach(function (col, i) {
      var m = M.cloth({ color: 0xffffff }); m.map = T.tex(chintzCanvas(col), { repeat: [1, 2] });
      var b = T.mesh(new THREE.BoxGeometry(0.5, 0.06, 0.24), m, 0.35, 0.03 + i * 0.062, -0.05); b.rotation.y = T.rr(-0.06, 0.06); g.add(b);
    });
    var drape = new THREE.PlaneGeometry(0.7, 0.8, 40, 40); drape.translate(0, -0.4, 0);
    T.warp(drape, function (v) { var t = -v.y; if (t < 0.45) { v.z = 0; } else { var k = t - 0.45; v.y = -0.45 - Math.sin(k * 2) * 0.1; v.z = k * 0.9; } v.z += 0.02 * Math.sin(v.x * 18) * Math.min(1, t * 2); });
    var dm = M.cloth({ color: 0xffffff }); dm.map = T.tex(chintzCanvas('#f4ecd8')); dm.side = THREE.DoubleSide;
    g.add(T.mesh(drape, dm, -0.35, 0.72, -0.25));
    g.add(T.mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.8, 8), M.wood({ color: 0x3a2010 }), -0.35, 0.72, -0.25).rotateZ(Math.PI / 2));
    return { g: g, bg: 'bazaar' };
  };
  X.t_musk = function () {
    var g = T.group();
    var fur = M.cloth({ color: 0x6a4a30, roughness: 1, sheen: 1 }); fur.bumpMap = T.tex(T.noiseCanvas(128, 128, 1.5, 0, 255, 2), { linear: true }); fur.bumpScale = 0.004;
    var box = T.mesh(new THREE.BoxGeometry(0.44, 0.1, 0.3), M.lacquer({ color: 0x5a0c0a }), 0, 0.05, 0); g.add(box);
    g.add(T.mesh(new THREE.BoxGeometry(0.4, 0.02, 0.26), M.cloth({ color: 0xc8a050 }), 0, 0.095, 0));
    [[-0.1, 0.0], [0.08, 0.04], [0.02, -0.07]].forEach(function (p) { var m = T.mesh(new THREE.SphereGeometry(0.06, 24, 16), fur, p[0], 0.14, p[1]); m.scale.set(1, 0.75, 0.9); g.add(m); });
    // 향수 병들
    [[0.45, 0.0, 0x3a6a8a], [0.55, 0.15, 0x8a2a5a], [0.38, 0.18, 0x6a8a3a]].forEach(function (q) {
      g.add(T.mesh(T.lathe(T.smoothProfile([[0, 0], [0.04, 0], [0.05, 0.05], [0.03, 0.1], [0.012, 0.14], [0.018, 0.16], [0.0, 0.16]], 30), 30), M.glaze({ color: q[2], roughness: 0.05, transparent: true, opacity: 0.75 }), q[0], 0, q[1]));
      g.add(T.mesh(new THREE.SphereGeometry(0.018, 12, 8), M.gold(), q[0], 0.17, q[1]));
    });
    var sc = scale(); sc.position.set(-0.55, 0, 0.0); sc.scale.setScalar(0.8); g.add(sc);
    return { g: g, bg: 'china' };
  };
  X.t_frank = function () {
    var g = T.group(), b = basket(0.32, 0.18, '#9a7a40'); g.add(b.m);
    var rm = M.glaze({ color: 0xe8c890, roughness: 0.3, transparent: true, opacity: 0.92, emissive: new THREE.Color(0x3a2a10) });
    g.add(heap(T.roughGeo(1, 12, 0.3), rm, 260, b.r, 0.09, b.top, 0.02, 0.032, [0xe8c890, 0xf0d8a8, 0xd8b070, 0xf4e8c8]));
    // 향로와 연기
    var brass = M.gold({ color: 0xb08a40, roughness: 0.35 });
    var cen = T.mesh(T.lathe(T.smoothProfile([[0, 0], [0.06, 0], [0.04, 0.04], [0.04, 0.1], [0.09, 0.14], [0.1, 0.2], [0.0, 0.19]], 30), 40), brass, -0.55, 0, 0.1); g.add(cen);
    var smoke = T.canvas(128, 512, function (c, w, h) { for (var i = 0; i < 30; i++) { var y = h - i * 16, x = w / 2 + Math.sin(i * 0.5) * 20; PT.blob(c, x, y, 20 + i, 30, 'rgba(240,236,230,' + (0.35 - i * 0.01) + ')', 0.9); } });
    var sm = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 1.0), new THREE.MeshBasicMaterial({ map: T.tex(smoke), transparent: true, depthWrite: false, opacity: 0.8 })); sm.position.set(-0.55, 0.7, 0.1); sm.userData.noFit = true; sm.userData.smoke = true; g.add(sm);
    g.add(scatter(T.roughGeo(1, 12, 0.3), rm, 12, 0.35, 0.75, 0.1, 0.45, 0.02, 0.02, 0.03));
    return { g: g, bg: 'arabia' };
  };
  X.t_ambergris = function () {
    var g = T.group();
    var cl = cloth(0.8, 0.5, '#2a3a5a', stripes(['#2a3a5a', '#3a4a6a'])); g.add(cl);
    var am = M.marble({ color: 0x9a948a, roughness: 0.6, sheen: 0.2 }); am.bumpMap = T.tex(T.noiseCanvas(128, 128, 5, 30, 220, 4), { linear: true }); am.bumpScale = 0.01;
    [[0, 0.1, 0.0, 0.16], [0.25, 0.06, 0.08, 0.09], [-0.22, 0.05, 0.1, 0.07]].forEach(function (q) { var m = T.mesh(T.rockGeo(1, 0.3, 1.5, 4), am, q[0], q[1], q[2]); m.scale.set(q[3] * 1.3, q[3] * 0.7, q[3]); g.add(m); });
    var sc = scale(); sc.position.set(0.62, 0, -0.05); g.add(sc);
    var j = jar(0x2a2a3a, 0.26); j.position.set(-0.62, 0, -0.05); g.add(j);
    return { g: g, bg: 'africa' };
  };
  X.t_sandal = function () {
    var g = T.group(), wm = woodMat([170, 120, 70], [200, 150, 96]);
    var logs = []; for (var i = 0; i < 9; i++) logs.push({ p: [0.0 + ((i % 3) - 1) * 0.11 + (Math.floor(i / 3) % 2) * 0.05, 0.055 + Math.floor(i / 3) * 0.09, 0], s: [1, 1, 1], r: [0, 0, Math.PI / 2] });
    g.add(T.inst(new THREE.CylinderGeometry(0.05, 0.055, 0.7, 16), wm, logs));
    // 작은 백단 조각상과 향
    var fig = T.sdfMesh(T.partsSdf([{ t: 'e', c: [0, 0.05, 0], r: [0.06, 0.05, 0.05] }, { t: 'e', c: [0, 0.13, 0], r: [0.04, 0.06, 0.035] }, { t: 's', c: [0, 0.21, 0.004], r: 0.03 }, { t: 'c', a: [0, 0.23, 0], b: [0, 0.27, 0], ra: 0.012, rb: 0.004 }], 0.018), [-0.08, 0, -0.07], [0.08, 0.3, 0.07], 64);
    g.add(T.mesh(fig, M.wood({ color: 0xc8925a, roughness: 0.5 }), 0.55, 0, 0.15));
    var sticks = []; for (i = 0; i < 12; i++) sticks.push({ p: [-0.55 + T.rr(-0.02, 0.02), 0.15, 0.1 + T.rr(-0.02, 0.02)], s: 1, r: [T.rr(-0.15, 0.15), 0, T.rr(-0.15, 0.15)] });
    g.add(T.inst(new THREE.CylinderGeometry(0.004, 0.004, 0.3, 4), M.matte({ color: 0x8a3a2a }), sticks));
    g.add(T.mesh(T.lathe([[0, 0], [0.07, 0], [0.08, 0.06], [0.0, 0.05]], 24), M.bronze(), -0.55, 0, 0.1));
    return { g: g, bg: 'bazaar' };
  };
  X.t_pearl = function () {
    var g = T.group(), pm = M.pearl();
    var dish = T.mesh(T.lathe(T.smoothProfile([[0, 0], [0.12, 0], [0.22, 0.04], [0.26, 0.06], [0.0, 0.02]], 30), 48), M.silver({ roughness: 0.3 })); g.add(dish);
    g.add(heap(new THREE.SphereGeometry(1, 16, 12), pm, 160, 0.2, 0.05, 0.03, 0.014, 0.022));
    // 굴 껍데기와 진주 줄
    var shell = T.lathe(T.smoothProfile([[0, 0], [0.05, 0.005], [0.1, 0.02], [0.12, 0.03], [0.0, 0.01]], 20), 32);
    var sm = M.glaze({ color: 0xc8c0b0, roughness: 0.25, iridescence: 0.8, iridescenceIOR: 1.5 });
    [[0.5, 0.1], [0.62, -0.1], [-0.5, 0.15]].forEach(function (p, i) { var m = T.mesh(shell, sm, p[0], 0, p[1]); m.scale.set(1, 1, 0.8); g.add(m); g.add(T.mesh(new THREE.SphereGeometry(0.025, 16, 12), pm, p[0], 0.03, p[1])); });
    var strand = []; for (i = 0; i <= 40; i++) { var t = i / 40; strand.push([-0.6 + t * 0.4, 0.012, 0.35 + Math.sin(t * Math.PI) * 0.12]); }
    var list = strand.map(function (p) { return { p: p, s: 0.012 }; });
    g.add(T.inst(new THREE.SphereGeometry(1, 12, 10), pm, list));
    return { g: g, bg: 'arabia' };
  };
  X.t_jade = function () {
    var g = T.group();
    var jm = M.jade({ color: 0x2f8a54, roughness: 0.15 });
    var boulder = T.mesh(T.rockGeo(0.22, 0.25, 1.4, 4), M.stone({ color: 0x8a7a5a, roughness: 0.9 }), 0, 0.16, 0); boulder.scale.set(1.2, 0.8, 1); g.add(boulder);
    var cut = T.mesh(new THREE.BoxGeometry(0.16, 0.12, 0.12), jm, 0.0, 0.26, 0.13); cut.rotation.y = 0.4; g.add(cut);
    var bi = T.mesh(new THREE.TorusGeometry(0.09, 0.05, 16, 48), jm, 0.52, 0.11, 0.0); bi.scale.set(1, 1, 0.2); g.add(bi);
    g.add(T.mesh(new THREE.BoxGeometry(0.06, 0.02, 0.2), M.lacquer(), 0.52, 0.01, 0.0));
    [[-0.5, 0.15], [-0.62, 0.0], [-0.42, -0.05]].forEach(function (p, i) { var r = T.mesh(new THREE.TorusGeometry(0.06, 0.016, 16, 40), M.jade({ color: [0x3a9a5a, 0x7ab88a, 0x1f6a3a][i] }), p[0], 0.016, p[1]); r.rotation.x = Math.PI / 2; g.add(r); });
    return { g: g, bg: 'china' };
  };
  X.t_rhino = function () {
    var g = T.group();
    var horn = T.taperTube([[0, 0, 0], [0.02, 0.15, 0.0], [0.06, 0.3, 0.0], [0.13, 0.42, 0]], function (t) { return 0.09 * (1 - t) + 0.004; }, 40, 20);
    var hm = M.matte({ color: 0x4a3a2a, roughness: 0.45, clearcoat: 0.4 }); hm.bumpMap = T.tex(T.noiseCanvas(64, 256, 2, 60, 200, 2), { linear: true }); hm.bumpScale = 0.004;
    g.add(T.mesh(horn, hm, -0.05, 0.06, 0));
    g.add(T.mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.06, 32), M.lacquer({ color: 0x3a0a08 }), 0, 0.03, 0));
    var cup = T.mesh(T.lathe(T.smoothProfile([[0, 0], [0.04, 0], [0.05, 0.03], [0.09, 0.12], [0.1, 0.16], [0.0, 0.14]], 30), 32), M.glaze({ color: 0x8a5a2a, roughness: 0.3, transparent: true, opacity: 0.95 }), 0.5, 0, 0.1); g.add(cup);
    var j = jar(0x3a5a3a, 0.28); j.position.set(-0.55, 0, 0.05); g.add(j);
    return { g: g, bg: 'africa' };
  };
  X.t_ivory = function () {
    var g = T.group(), im = M.marble({ color: 0xf0e4c8, roughness: 0.35 });
    [[-1, 0.0], [1, 0.12]].forEach(function (q) {
      var pts = []; for (var i = 0; i <= 10; i++) { var t = i / 10; pts.push([q[0] * (-0.5 + t * 0.9), 0.04 + Math.sin(t * Math.PI * 0.8) * 0.25, q[1] + Math.sin(t * 2) * 0.05]); }
      g.add(T.mesh(T.taperTube(pts, function (t) { return 0.06 * (1 - t * 0.85); }, 40, 16), im));
    });
    var fig = T.sdfMesh(T.partsSdf([{ t: 'e', c: [0, 0.06, 0], r: [0.035, 0.06, 0.03] }, { t: 's', c: [0, 0.14, 0], r: 0.025 }], 0.015), [-0.05, 0, -0.04], [0.05, 0.18, 0.04], 48);
    [[0.55, 0.25], [0.65, 0.3]].forEach(function (p) { g.add(T.mesh(fig, im, p[0], 0, p[1])); });
    return { g: g, bg: 'africa' };
  };
  X.t_coral = function () {
    var g = T.group(), cm = M.glaze({ color: 0xd8382a, roughness: 0.35 });
    function branch(p, dir, len, r, depth) {
      var end = [p[0] + dir[0] * len, p[1] + dir[1] * len, p[2] + dir[2] * len];
      g.add(T.mesh(T.taperTube([p, [(p[0] + end[0]) / 2 + T.rr(-0.02, 0.02), (p[1] + end[1]) / 2, (p[2] + end[2]) / 2], end], function (t) { return r * (1 - t * 0.4); }, 8, 8), cm));
      if (depth > 0) for (var k = 0; k < 2; k++) { var d = [dir[0] + T.rr(-0.6, 0.6), dir[1] * 0.8 + 0.2, dir[2] + T.rr(-0.5, 0.5)], l = Math.hypot(d[0], d[1], d[2]); branch(end, [d[0] / l, d[1] / l, d[2] / l], len * 0.75, r * 0.65, depth - 1); }
    }
    branch([0, 0.04, 0], [0, 1, 0], 0.18, 0.03, 4);
    g.add(T.mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.05, 24), M.lacquer(), 0, 0.025, 0));
    var beads = []; for (var i = 0; i <= 40; i++) { var t = i / 40; beads.push({ p: [0.35 + t * 0.35, 0.012, 0.25 + Math.sin(t * Math.PI) * 0.12], s: 0.012 }); }
    g.add(T.inst(new THREE.SphereGeometry(1, 10, 8), cm, beads));
    var b = basket(0.2, 0.1, '#8a6a3a'); b.m.position.set(-0.55, 0, 0.1); g.add(b.m);
    var hb = heap(new THREE.CylinderGeometry(0.3, 0.3, 1, 6), cm, 50, b.r, 0.04, b.top, 0.03, 0.05); hb.position.set(-0.55, 0, 0.1); g.add(hb);
    return { g: g, bg: 'arabia', tint: 0 };
  };
  X.t_tortoise = function () {
    var g = T.group();
    var tc = T.canvas(256, 256, function (c, w, h) { c.fillStyle = '#d89a3a'; c.fillRect(0, 0, w, h); for (var i = 0; i < 30; i++) PT.blob(c, T.rnd() * w, T.rnd() * h, T.rr(10, 40), T.rr(8, 30), 'rgba(' + T.pick(['60,24,10', '90,40,14', '120,60,20']) + ',0.85)', 0.5); });
    var tm = M.glaze({ map: T.tex(tc), roughness: 0.12, transparent: true, opacity: 0.95 });
    for (var i = 0; i < 5; i++) { var p = new THREE.CylinderGeometry(0.1, 0.1, 0.01, 6); p.scale(1.2, 1, 1); var m = T.mesh(p, tm, -0.1 + (i % 3) * 0.16, 0.006 + i * 0.006, (i > 2 ? 0.12 : -0.02)); m.rotation.y = i * 0.5; g.add(m); }
    // 빗과 등딱지 하나
    var comb = T.extrude([[-0.12, 0], [0.12, 0], [0.12, 0.05], [-0.12, 0.05]], 0.008, 0.002);
    var cm2 = T.mesh(comb, tm, 0.5, 0.03, 0.15); cm2.rotation.x = -Math.PI / 2 + 0.2; g.add(cm2);
    var teeth = []; for (i = 0; i < 20; i++) teeth.push({ p: [0.39 + i * 0.012, 0.012, 0.22], s: 1, r: [Math.PI / 2 - 0.2, 0, 0] });
    g.add(T.inst(new THREE.BoxGeometry(0.004, 0.06, 0.004), tm, teeth));
    var shell = T.mesh(new THREE.SphereGeometry(0.22, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), tm, -0.55, 0.0, 0.05); shell.scale.set(1, 0.45, 1.3); g.add(shell);
    return { g: g, bg: 'africa' };
  };
  X.t_herbs = function () {
    var g = T.group();
    var root = M.matte({ color: 0xd8c098, roughness: 0.6 });
    // 인삼: 몸통에서 갈라진 뿌리
    function ginseng(x, z, s) {
      var parts = [{ t: 'c', a: [0, 0.0, 0], b: [0, 0.12, 0], ra: 0.03, rb: 0.022, k: 0.02 }, { t: 'c', a: [0, 0.0, 0], b: [-0.05, -0.12, 0.01], ra: 0.02, rb: 0.006, k: 0.02 }, { t: 'c', a: [0, 0.0, 0], b: [0.05, -0.13, -0.01], ra: 0.02, rb: 0.006, k: 0.02 }, { t: 'c', a: [0, 0.08, 0], b: [0.07, 0.04, 0], ra: 0.01, rb: 0.003, k: 0.01 }, { t: 'c', a: [0, 0.12, 0], b: [0, 0.18, 0], ra: 0.012, rb: 0.008, k: 0.01 }];
      var m = T.mesh(T.sdfMesh(T.partsSdf(parts, 0.02), [-0.1, -0.16, -0.05], [0.1, 0.2, 0.05], 56), root, x, 0.03, z); m.rotation.set(Math.PI / 2 - 0.1, 0, T.rr(-0.5, 0.5)); m.scale.setScalar(s); g.add(m);
    }
    ginseng(0, 0.05, 1.3); ginseng(0.15, 0.12, 1.1); ginseng(-0.14, 0.15, 1.0);
    g.add(T.mesh(new THREE.BoxGeometry(0.5, 0.03, 0.34), M.lacquer({ color: 0x5a0c0a }), 0, 0.015, 0.08));
    // 약장 서랍
    var cab = T.group(T.mesh(new THREE.BoxGeometry(0.7, 0.6, 0.3), woodMat([90, 54, 30], [120, 76, 44]), 0, 0.3, -0.35));
    for (var r = 0; r < 4; r++) for (var c = 0; c < 5; c++) { cab.add(T.mesh(new THREE.BoxGeometry(0.12, 0.12, 0.01), woodMat([110, 70, 40], [140, 96, 56]), -0.26 + c * 0.13, 0.08 + r * 0.14, -0.195)); cab.add(T.mesh(new THREE.SphereGeometry(0.01, 8, 6), M.bronze(), -0.26 + c * 0.13, 0.08 + r * 0.14, -0.185)); }
    g.add(cab);
    var sticks = []; for (var i = 0; i < 30; i++) sticks.push({ p: [0.55 + T.rr(-0.04, 0.04), 0.03, 0.15 + T.rr(-0.04, 0.04)], s: 1, r: [0, 0.2, Math.PI / 2] });
    g.add(T.inst(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 6), M.wood({ color: 0x8a5a2a }), sticks));
    g.add(T.mesh(new THREE.TorusGeometry(0.05, 0.006, 6, 20), M.cloth({ color: 0xc83020 }), 0.55, 0.03, 0.15).rotateY(Math.PI / 2 + 0.2));
    return { g: g, bg: 'china' };
  };

  /* ------------------------------------------------ 배경·장면 */
  var BG = {
    bazaar: { wall: ['#6a3a1e', '#a86a3a'], awn: ['#a83a2a', '#e8c070', '#2a5a6a'], lamp: 0xffb060 },
    arabia: { wall: ['#7a5a3a', '#c8a070'], awn: ['#2a4a7a', '#e8d8b0', '#8a2a2a'], lamp: 0xffc070 },
    china: { wall: ['#4a2a1a', '#8a4a2a'], awn: ['#a01a14', '#3a3a3a', '#c89a3a'], lamp: 0xff7040 },
    americas: { wall: ['#5a4a2a', '#9a7a4a'], awn: ['#c8a050', '#7a3a1a', '#2a6a4a'], lamp: 0xffb060 },
    africa: { wall: ['#8a7a60', '#d8c8a8'], awn: ['#e8e0d0', '#2a5a7a', '#a86a2a'], lamp: 0xffc888 }
  };
  function backdrop(kind) {
    var b = BG[kind] || BG.bazaar;
    var cv = T.canvas(1024, 512, function (c, w, h) {
      c.fillStyle = T.paint ? (function () { var gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, b.wall[0]); gr.addColorStop(0.7, b.wall[1]); gr.addColorStop(1, b.wall[0]); return gr; })() : '#000'; c.fillRect(0, 0, w, h);
      // 아치·문·좌판
      for (var i = 0; i < 6; i++) { var x = i * 180 + 40; c.fillStyle = 'rgba(20,10,4,0.55)'; c.beginPath(); c.moveTo(x, h); c.lineTo(x, h * 0.45); c.arc(x + 60, h * 0.45, 60, Math.PI, 0); c.lineTo(x + 120, h); c.fill(); }
      for (i = 0; i < 8; i++) { var ax = i * 140 - 20, ay = T.rr(h * 0.15, h * 0.3); c.fillStyle = T.pick(b.awn); c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + 150, ay); c.lineTo(ax + 170, ay + 60); c.lineTo(ax - 20, ay + 60); c.fill(); for (var k = 0; k < 8; k++) { c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(ax + k * 20, ay, 10, 60); } }
      for (i = 0; i < 40; i++) PT.blob(c, T.rnd() * w, T.rr(h * 0.55, h), T.rr(20, 60), T.rr(14, 40), 'rgba(' + T.pick(['200,140,60', '160,60,30', '60,90,60', '220,200,160']) + ',0.5)', 0.8);
      for (i = 0; i < 10; i++) PT.person(c, { x: T.rnd() * w, y: h * T.rr(0.9, 1.0), h: T.rr(150, 220), robe: T.pick(['#3a2a1a', '#6a3a2a', '#2a3a4a', '#8a7a5a']), skin: '#8a5a3a', arm: false });
    });
    var blurred = T.canvas(1024, 512, function (c) { c.filter = 'blur(10px)'; c.drawImage(cv, 0, 0); });
    var m = new THREE.MeshBasicMaterial({ map: T.tex(blurred), color: new THREE.Color(0.55, 0.5, 0.45) });
    var p = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.5), m); p.position.set(0, 1.4, -2.8);
    return { mesh: p, lamp: b.lamp };
  }

  /** 교역품 장면을 frames 장 찍는다 */
  T.tradeFrames = function (id, frames, W, H) {
    T.seed(id);
    return T.shot(W, H, function (scene) {
      var spec = X[id](T), g = spec.g;
      scene.background = new THREE.Color(0x0a0604);
      scene.fog = new THREE.Fog(0x0a0604, 3.5, 7.5);
      var bd = backdrop(spec.bg); scene.add(bd.mesh);
      // 좌판 탁자
      var top = T.mesh(new THREE.BoxGeometry(2.8, 0.08, 1.3), woodMat([52, 32, 18], [84, 54, 30]), 0, -0.04, 0.1); scene.add(top);
      var cl = cloth(2.0, 0.9, '#2a120c', function (c, w, h) { c.strokeStyle = '#6a4a20'; c.lineWidth = 10; c.strokeRect(14, 14, w - 28, h - 28); for (var i = 0; i < 30; i++) { c.fillStyle = 'rgba(120,80,30,0.25)'; c.beginPath(); c.arc(T.rnd() * w, T.rnd() * h, 6, 0, 7); c.fill(); } }); cl.position.set(0, -0.014, 0.1); scene.add(cl);
      scene.add(g);
      // 조명
      var key = new THREE.SpotLight(0xffd8a8, 60, 0, 0.55, 0.6, 2); key.position.set(-1.6, 2.6, 1.8); key.target.position.set(0, 0.15, 0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0005; scene.add(key, key.target);
      var rim = new THREE.SpotLight(0xffc890, 30, 0, 0.6, 0.8, 2); rim.position.set(1.8, 1.8, -1.6); rim.target.position.set(0, 0.2, 0); scene.add(rim, rim.target);
      var lamp = new THREE.PointLight(bd.lamp, 4, 0, 2); lamp.position.set(0.9, 1.3, 0.6); scene.add(lamp);
      scene.add(new THREE.HemisphereLight(0x806040, 0x100804, 0.35));
      // 등불 (보이는 빛)
      var lampMesh = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(bd.lamp).multiplyScalar(3) })); lampMesh.position.copy(lamp.position); scene.add(lampMesh);
      // 떠다니는 먼지
      var N = 160, pos = new Float32Array(N * 3), seeds = [];
      for (var i = 0; i < N; i++) seeds.push([T.rr(-1.4, 1.4), T.rr(0, 1.4), T.rr(-0.6, 1.0), T.rnd() * 6.28]);
      var pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      var dot = T.canvas(32, 32, function (c) { PT.blob(c, 16, 16, 15, 15, 'rgba(255,230,180,1)', 0.9); });
      var pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.025, map: T.tex(dot), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.7 })); scene.add(pts);
      var cam = new THREE.PerspectiveCamera(32, W / H, 0.05, 30);
      var smoke = []; g.traverse(function (m) { if (m.userData && m.userData.smoke) smoke.push(m); });
      return {
        cam: cam, exposure: 1.0,
        frame: function (t) {
          var e = 1 - Math.pow(1 - t, 2.2);
          var yaw = -0.4 + 0.4 * e, dist = 2.7 - 1.0 * e, hgt = 0.95 - 0.25 * e;
          cam.position.set(Math.sin(yaw) * dist, hgt, Math.cos(yaw) * dist);
          cam.lookAt(0, 0.2 - 0.04 * e, 0);
          key.intensity = 30 + 34 * Math.min(1, t * 1.6);
          for (var i = 0; i < N; i++) { var s = seeds[i]; pos[i * 3] = s[0] + Math.sin(t * 3 + s[3]) * 0.08; pos[i * 3 + 1] = s[1] + t * 0.25 + Math.sin(t * 5 + s[3]) * 0.03; pos[i * 3 + 2] = s[2]; }
          pg.attributes.position.needsUpdate = true;
          smoke.forEach(function (m) { m.lookAt(cam.position); m.position.y = 0.7 + t * 0.08; });
          lampMesh.scale.setScalar(1 + 0.1 * Math.sin(t * 20));
        }
      };
    }, frames);
  };
})(T3);
