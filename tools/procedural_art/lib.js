/* 보물·교역품 발견 원화 — 절차적 3D 모형을 박물관 조명으로 찍는 도구 (페이지 쪽).
   three.js 0.147 (전역 THREE) + examples/js 의 RoomEnvironment·ConvexGeometry·BufferGeometryUtils.
   T3.sheet(id) → 4×2 회전 원화(1536×1024 PNG data URL). 모형은 OBJ[id](T3) 가 THREE.Group 으로 돌려준다. */
'use strict';
var T3 = (function () {
  var T = {}, renderer, pmrem, envTex;
  var CW = 384, CH = 512, SS = 2;
  T.OBJ = {};

  /* ------------------------------------------------------------ 난수·잡음 */
  var seed = 1;
  T.seed = function (s) { seed = (typeof s === 'string' ? hash(s) : s) || 1; };
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  T.rnd = function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  T.rr = function (a, b) { return a + (b - a) * T.rnd(); };
  T.pick = function (arr) { return arr[Math.floor(T.rnd() * arr.length)]; };
  var P = new Uint8Array(512);
  (function () { var p = []; for (var i = 0; i < 256; i++) p[i] = i; var s = 7; for (i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; var j = s % (i + 1), t = p[i]; p[i] = p[j]; p[j] = t; } for (i = 0; i < 512; i++) P[i] = p[i & 255]; })();
  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function grad(h, x, y, z) { var u = (h & 15) < 8 ? x : y, v = (h & 15) < 4 ? y : ((h & 15) === 12 || (h & 15) === 14) ? x : z; return ((h & 1) ? -u : u) + ((h & 2) ? -v : v); }
  T.noise = function (x, y, z) {
    z = z || 0;
    var X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    var u = fade(x), v = fade(y), w = fade(z);
    var A = P[X] + Y, AA = P[A] + Z, AB = P[A + 1] + Z, B = P[X + 1] + Y, BA = P[B] + Z, BB = P[B + 1] + Z;
    function L(a, b, t) { return a + t * (b - a); }
    return L(L(L(grad(P[AA], x, y, z), grad(P[BA], x - 1, y, z), u), L(grad(P[AB], x, y - 1, z), grad(P[BB], x - 1, y - 1, z), u), v),
      L(L(grad(P[AA + 1], x, y, z - 1), grad(P[BA + 1], x - 1, y, z - 1), u), L(grad(P[AB + 1], x, y - 1, z - 1), grad(P[BB + 1], x - 1, y - 1, z - 1), u), v), w);
  };
  T.fbm = function (x, y, z, oct) { var s = 0, a = 0.5, f = 1; for (var i = 0; i < (oct || 4); i++) { s += a * T.noise(x * f, y * f, (z || 0) * f); f *= 2; a *= 0.5; } return s; };

  /* ------------------------------------------------------------ 캔버스 텍스처 */
  T.canvas = function (w, h, fn) { var c = document.createElement('canvas'); c.width = w; c.height = h; var g = c.getContext('2d', { willReadFrequently: true }); if (fn) fn(g, w, h, c); return c; };
  T.tex = function (c, opt) {
    opt = opt || {};
    var t = new THREE.CanvasTexture(c);
    if (!opt.linear) t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 8;
    if (opt.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(opt.repeat[0], opt.repeat[1]); }
    if (opt.wrapS) t.wrapS = THREE.RepeatWrapping;
    t.needsUpdate = true;
    return t;
  };
  /** 픽셀 단위 그리기: fn(x,y) → [r,g,b] (0~255) */
  T.pixels = function (w, h, fn) {
    return T.canvas(w, h, function (g) {
      var im = g.createImageData(w, h), d = im.data;
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
        var c = fn(x, y), o = (y * w + x) * 4;
        d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = c.length > 3 ? c[3] : 255;
      }
      g.putImageData(im, 0, 0);
    });
  };
  T.noiseCanvas = function (w, h, sc, lo, hi, oct) {
    return T.pixels(w, h, function (x, y) { var v = Math.round(lo + (hi - lo) * (0.5 + 0.5 * T.fbm(x / sc, y / sc, 0.3, oct || 4))); return [v, v, v]; });
  };

  /* ------------------------------------------------------------ 재질 */
  function phys(o) { var m = new THREE.MeshPhysicalMaterial(o); return m; }
  T.mat = {
    gold: function (o) { return phys(Object.assign({ color: 0xf2b54c, metalness: 1, roughness: 0.24, envMapIntensity: 1.25 }, o)); },
    paleGold: function (o) { return phys(Object.assign({ color: 0xe8c47a, metalness: 1, roughness: 0.3, envMapIntensity: 1.2 }, o)); },
    gilt: function (o) { return phys(Object.assign({ color: 0xd9a441, metalness: 0.92, roughness: 0.38, envMapIntensity: 1.1 }, o)); },
    silver: function (o) { return phys(Object.assign({ color: 0xd8d8dc, metalness: 1, roughness: 0.22, envMapIntensity: 1.2 }, o)); },
    iron: function (o) { return phys(Object.assign({ color: 0x5a5753, metalness: 0.85, roughness: 0.55, envMapIntensity: 0.8 }, o)); },
    bronze: function (o) { return phys(Object.assign({ color: 0x9a6a3c, metalness: 0.9, roughness: 0.42, envMapIntensity: 1.0 }, o)); },
    patina: function (o) { return phys(Object.assign({ color: 0x5f7a5c, metalness: 0.45, roughness: 0.62, envMapIntensity: 0.7 }, o)); },
    glaze: function (o) { return phys(Object.assign({ color: 0xffffff, metalness: 0, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 0.9 }, o)); },
    matte: function (o) { return phys(Object.assign({ color: 0xffffff, metalness: 0, roughness: 0.85, envMapIntensity: 0.5 }, o)); },
    stone: function (o) { return phys(Object.assign({ color: 0x8a8378, metalness: 0, roughness: 0.82, envMapIntensity: 0.45 }, o)); },
    marble: function (o) { return phys(Object.assign({ color: 0xece4d6, metalness: 0, roughness: 0.36, clearcoat: 0.25, clearcoatRoughness: 0.4, sheen: 0.3, sheenColor: new THREE.Color(0xfff2e0), envMapIntensity: 0.6 }, o)); },
    wood: function (o) { return phys(Object.assign({ color: 0x6b4423, metalness: 0, roughness: 0.6, envMapIntensity: 0.5 }, o)); },
    lacquer: function (o) { return phys(Object.assign({ color: 0x1a0d08, metalness: 0, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 0.9 }, o)); },
    cloth: function (o) { o = Object.assign({ color: 0x8a1c1c, metalness: 0, roughness: 0.9, sheen: 0.5, sheenRoughness: 0.4, envMapIntensity: 0.3 }, o); var c = new THREE.Color(o.color); o.sheenColor = c.clone().multiplyScalar(1.8); return phys(o); },
    paper: function (o) { return phys(Object.assign({ color: 0xffffff, metalness: 0, roughness: 0.92, envMapIntensity: 0.35, side: THREE.DoubleSide }, o)); },
    jade: function (o) { return phys(Object.assign({ color: 0x9fc29a, metalness: 0, roughness: 0.22, clearcoat: 0.8, clearcoatRoughness: 0.15, sheen: 0.4, sheenColor: new THREE.Color(0xe8ffe0), envMapIntensity: 0.8 }, o)); },
    enamel: function (c, o) { return phys(Object.assign({ color: c, metalness: 0.1, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.0 }, o)); },
    /** 보석: 깎은 면마다 번쩍이도록 평면 음영 + 강한 반사 + 안쪽 빛 */
    gem: function (c, o) {
      var col = new THREE.Color(c);
      var m = phys(Object.assign({ color: col, metalness: 0.0, roughness: 0.0, clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 1.6,
        emissive: col.clone().multiplyScalar(0.07), flatShading: true, specularIntensity: 1, ior: 1.9, transparent: false }, o));
      m.userData.keepEnv = true; return m;
    },
    cabochon: function (c, o) {
      var col = new THREE.Color(c);
      var m = phys(Object.assign({ color: col, metalness: 0.05, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.4,
        emissive: col.clone().multiplyScalar(0.1) }, o)); m.userData.keepEnv = true; return m;
    },
    pearl: function (o) { return phys(Object.assign({ color: 0xf4ece0, metalness: 0.05, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.1, iridescence: 0.7, iridescenceIOR: 1.6, sheen: 0.6, sheenColor: new THREE.Color(0xffe6f0), envMapIntensity: 1.3 }, o)); },
    diamond: function (o) { var m = phys(Object.assign({ color: 0xdfe6ee, metalness: 0.35, roughness: 0.02, clearcoat: 1, envMapIntensity: 2.6, flatShading: true, iridescence: 1.0, iridescenceIOR: 2.2, iridescenceThicknessRange: [200, 600], emissive: 0x2a2e34 }, o)); m.userData.keepEnv = true; return m; }
  };
  /** 텍스처를 붙인 재질 */
  T.texMat = function (base, canvas, extra) {
    var m = base(extra || {});
    m.map = T.tex(canvas);
    m.color = new THREE.Color(0xffffff);
    if (extra && extra.color !== undefined) m.color = new THREE.Color(extra.color);
    m.needsUpdate = true;
    return m;
  };

  /* ------------------------------------------------------------ 모양 도우미 */
  T.mesh = function (geo, mat, x, y, z) { var m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; m.receiveShadow = true; return m; };
  T.group = function () { var g = new THREE.Group(); for (var i = 0; i < arguments.length; i++) if (arguments[i]) g.add(arguments[i]); return g; };
  /** 단면 [[r,y],...] 를 돌려 깎은 그릇 모양 (UV: u=둘레, v=높이 비율) */
  T.lathe = function (prof, segs, smooth) {
    var pts = prof.map(function (p) { return new THREE.Vector2(Math.max(0.0001, p[0]), p[1]); });
    if (smooth) {
      var curve = new THREE.SplineCurve(pts);
      pts = curve.getPoints(smooth);
    }
    return new THREE.LatheGeometry(pts, segs || 96);
  };
  /** 매끈한 단면: 점들을 Catmull-Rom으로 이어 n점 */
  T.smoothProfile = function (prof, n) {
    var c = new THREE.SplineCurve(prof.map(function (p) { return new THREE.Vector2(p[0], p[1]); }));
    return c.getPoints(n || 120).map(function (v) { return [v.x, v.y]; });
  };
  /** 길이로 고르게 다시 나눈 단면 — 텍스처 v가 표면 길이 비율이 된다 */
  T.arcProfile = function (prof, n) {
    var c = new THREE.SplineCurve(prof.map(function (p) { return new THREE.Vector2(p[0], p[1]); }));
    return c.getSpacedPoints(n || 160).map(function (v) { return [Math.max(0.0001, v.x), v.y]; });
  };
  /** 그릇: 단면을 길이로 고르게 나눠 돌림 */
  T.vessel = function (prof, n, segs) { return T.lathe(T.arcProfile(prof, n || 160), segs || 128); };
  /** 위에서 내려다본 평면 UV (접시용) */
  T.planarUV = function (geo, R) {
    var p = geo.attributes.position, uv = geo.attributes.uv;
    for (var i = 0; i < p.count; i++) uv.setXY(i, 0.5 + p.getX(i) / (2 * R), 0.5 - p.getZ(i) / (2 * R));
    uv.needsUpdate = true; return geo;
  };
  T.tube = function (pts, r, segs, rs, closed) {
    var c = new THREE.CatmullRomCurve3(pts.map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); }), !!closed);
    return new THREE.TubeGeometry(c, segs || 64, r, rs || 12, !!closed);
  };
  /** 굵기가 바뀌는 관 (rFn(t)) */
  T.taperTube = function (pts, rFn, segs, rs) {
    var c = new THREE.CatmullRomCurve3(pts.map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); }));
    var g = new THREE.TubeGeometry(c, segs || 64, 1, rs || 12, false);
    var pos = g.attributes.position, fr = c.computeFrenetFrames(segs || 64, false);
    var n = segs || 64, r = rs || 12, v = new THREE.Vector3();
    for (var i = 0; i <= n; i++) {
      var p = c.getPointAt(i / n), rad = rFn(i / n);
      for (var j = 0; j <= r; j++) {
        var k = i * (r + 1) + j;
        v.fromBufferAttribute(pos, k).sub(p).multiplyScalar(rad).add(p);
        pos.setXYZ(k, v.x, v.y, v.z);
      }
    }
    g.computeVertexNormals();
    return g;
  };
  T.shape = function (pts) { var s = new THREE.Shape(); pts.forEach(function (p, i) { if (i) s.lineTo(p[0], p[1]); else s.moveTo(p[0], p[1]); }); return s; };
  T.extrude = function (shapeOrPts, depth, bevel, opts) {
    var s = Array.isArray(shapeOrPts) ? T.shape(shapeOrPts) : shapeOrPts;
    var g = new THREE.ExtrudeGeometry(s, Object.assign({ depth: depth, bevelEnabled: bevel > 0, bevelThickness: bevel || 0, bevelSize: bevel || 0, bevelSegments: 3, curveSegments: 24 }, opts || {}));
    g.translate(0, 0, -depth / 2);
    return g;
  };
  /** 브릴리언트 컷 보석 (가로 반지름 1 기준). kind: round|oval|pear|cushion|emerald|mughal */
  T.gemGeo = function (kind, n) {
    n = n || 16;
    var pts = [], i, a, sx = 1, sz = 1;
    if (kind === 'oval') sz = 0.72;
    function ring(r, y, k, off) {
      for (var j = 0; j < k; j++) {
        var t = (j + (off || 0)) / k * Math.PI * 2, rx = r * sx, rz = r * sz;
        var px = Math.cos(t) * rx, pz = Math.sin(t) * rz;
        if (kind === 'pear') { var f = 1 + 0.55 * Math.max(0, Math.cos(t)); px *= f; px += 0.2; }
        if (kind === 'cushion') { var q = Math.pow(Math.abs(Math.cos(t)), 0.6) * Math.sign(Math.cos(t)), w = Math.pow(Math.abs(Math.sin(t)), 0.6) * Math.sign(Math.sin(t)); px = q * rx * 0.95; pz = w * rz * 0.95; }
        if (kind === 'emerald') { var cx = Math.cos(t), cz = Math.sin(t), m = Math.max(Math.abs(cx) / 1.0, Math.abs(cz) / 0.72); px = cx / m * rx * 0.95; pz = cz / m * rz * 0.95; }
        pts.push(new THREE.Vector3(px, y, pz));
      }
    }
    if (kind === 'mughal') { // 코이누르 옛 무굴 컷: 낮고 넓은 면들
      ring(0.55, 0.42, 10, 0.5); ring(0.86, 0.26, 20); ring(1, 0.06, 24, 0.5); ring(1, -0.04, 24, 0.5); ring(0.6, -0.42, 12); pts.push(new THREE.Vector3(0, -0.62, 0));
    } else if (kind === 'emerald') {
      ring(0.62, 0.36, 4, 0.5); ring(0.82, 0.26, 8, 0.5); ring(1, 0.08, 8, 0.5); ring(1, 0.0, 8, 0.5); ring(0.75, -0.3, 8, 0.5); ring(0.45, -0.55, 4, 0.5); pts.push(new THREE.Vector3(0, -0.7, 0));
    } else {
      ring(0.56, 0.36, n / 2, 0.5); ring(0.82, 0.22, n); ring(1, 0.05, n * 2, 0.5); ring(1, -0.02, n * 2, 0.5); ring(0.52, -0.42, n); pts.push(new THREE.Vector3(0, -0.86, 0));
      if (kind === 'pear') pts.push(new THREE.Vector3(0.2, -0.86, 0));
    }
    var g = new THREE.ConvexGeometry(pts);
    if (g.index) g = g.toNonIndexed(); g.computeVertexNormals();
    return g;
  };
  /** 거친 원석 덩어리 */
  T.roughGeo = function (r, n, jag) {
    var pts = [];
    for (var i = 0; i < (n || 40); i++) {
      var u = T.rnd() * 2 - 1, t = T.rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u), k = r * (1 - (jag || 0.3) * T.rnd());
      pts.push(new THREE.Vector3(s * Math.cos(t) * k, u * k, s * Math.sin(t) * k));
    }
    var g = new THREE.ConvexGeometry(pts); if (g.index) g = g.toNonIndexed(); g.computeVertexNormals(); return g;
  };
  /** 매끈한 바위 (잡음으로 울퉁불퉁) */
  T.rockGeo = function (r, amp, sc, det) {
    var g = new THREE.IcosahedronGeometry(r, det || 5), o = T.rr(0, 50); g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = THREE.BufferGeometryUtils.mergeVertices(g);
    return T.warp(g, function (v) { var n = v.clone().normalize(); var k = 1 + (amp || 0.25) * T.fbm(n.x * (sc || 1.6) + o, n.y * (sc || 1.6), n.z * (sc || 1.6), 5); v.copy(n.multiplyScalar(r * k)); });
  };
  /** 육각 기둥 결정 */
  T.crystalGeo = function (r, h, tip) {
    var pts = [], i;
    for (i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r), new THREE.Vector3(Math.cos(a) * r, h, Math.sin(a) * r)); }
    pts.push(new THREE.Vector3(0, h + (tip || 0), 0));
    var g = new THREE.ConvexGeometry(pts); if (g.index) g = g.toNonIndexed(); g.computeVertexNormals(); return g;
  };
  /** 높이 캔버스(밝을수록 높음)로 돋을새김한 판. w×h, nx×ny 칸, depth 높이, mask(u,v)가 false면 그 칸을 뺌.
      UV는 0~1이라 색 캔버스를 그대로 map으로 쓴다. 판 앞면이 +z. */
  T.relief = function (hc, w, h, nx, ny, depth, mask) {
    var g = hc.getContext('2d'), W = hc.width, H = hc.height, d = g.getImageData(0, 0, W, H).data;
    function hgt(u, v) { var x = Math.min(W - 1, Math.max(0, Math.round(u * (W - 1)))), y = Math.min(H - 1, Math.max(0, Math.round((1 - v) * (H - 1)))); return d[(y * W + x) * 4] / 255; }
    var pos = [], uv = [], idx = [], i, j;
    for (j = 0; j <= ny; j++) for (i = 0; i <= nx; i++) {
      var u = i / nx, v = j / ny;
      pos.push((u - 0.5) * w, (v - 0.5) * h, hgt(u, v) * depth); uv.push(u, v);
    }
    for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
      if (mask && !mask((i + 0.5) / nx, (j + 0.5) / ny)) continue;
      var a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, e = c + 1;
      idx.push(a, b, e, a, e, c);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    return geo;
  };
  /** 둥근 판 (원판) 돋을새김: 극좌표 격자 */
  T.reliefDisc = function (hc, R, rings, segs, depth) {
    var g = hc.getContext('2d'), W = hc.width, H = hc.height, d = g.getImageData(0, 0, W, H).data;
    function hgt(u, v) { var x = Math.min(W - 1, Math.max(0, Math.round(u * (W - 1)))), y = Math.min(H - 1, Math.max(0, Math.round((1 - v) * (H - 1)))); return d[(y * W + x) * 4] / 255; }
    var pos = [0, 0, hgt(0.5, 0.5) * depth], uv = [0.5, 0.5], idx = [];
    for (var r = 1; r <= rings; r++) for (var s = 0; s < segs; s++) {
      var a = s / segs * Math.PI * 2, rr = r / rings, u = 0.5 + Math.cos(a) * rr * 0.5, v = 0.5 + Math.sin(a) * rr * 0.5;
      pos.push(Math.cos(a) * rr * R, Math.sin(a) * rr * R, hgt(u, v) * depth); uv.push(u, v);
    }
    for (s = 0; s < segs; s++) idx.push(0, 1 + s, 1 + (s + 1) % segs);
    for (r = 1; r < rings; r++) for (s = 0; s < segs; s++) {
      var a0 = 1 + (r - 1) * segs + s, a1 = 1 + (r - 1) * segs + (s + 1) % segs, b0 = a0 + segs, b1 = a1 + segs;
      idx.push(a0, b0, b1, a0, b1, a1);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    return geo;
  };
  /** 흐린 높이 캔버스 (돋을새김 모서리를 부드럽게) */
  T.blurCanvas = function (c, px) { return T.canvas(c.width, c.height, function (g) { g.filter = 'blur(' + px + 'px)'; g.drawImage(c, 0, 0); }); };
  /** 같은 모양 여럿 (InstancedMesh). list: [{p:[x,y,z], s, r:[x,y,z]}] */
  T.inst = function (geo, mat, list) {
    var im = new THREE.InstancedMesh(geo, mat, list.length), o = new THREE.Object3D();
    list.forEach(function (it, i) {
      o.position.set(it.p[0], it.p[1], it.p[2]);
      o.rotation.set(it.r ? it.r[0] : 0, it.r ? it.r[1] : 0, it.r ? it.r[2] : 0);
      var s = it.s === undefined ? 1 : it.s;
      if (Array.isArray(s)) o.scale.set(s[0], s[1], s[2]); else o.scale.set(s, s, s);
      o.updateMatrix(); im.setMatrixAt(i, o.matrix);
      if (it.c !== undefined) im.setColorAt(i, new THREE.Color(it.c));
    });
    im.castShadow = true; im.receiveShadow = true;
    return im;
  };
  /** 기하 정점을 함수로 옮김 fn(v) */
  T.warp = function (geo, fn) {
    var p = geo.attributes.position, v = new THREE.Vector3();
    for (var i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); fn(v, i); p.setXYZ(i, v.x, v.y, v.z); }
    geo.computeVertexNormals(); return geo;
  };

  /* ------------------------------------------------------------ SDF → 매끈한 조각 (naive surface nets) */
  T.sd = {
    sphere: function (x, y, z, c, r) { return Math.hypot(x - c[0], y - c[1], z - c[2]) - r; },
    ell: function (x, y, z, c, r) { // 타원체 근사
      var px = (x - c[0]) / r[0], py = (y - c[1]) / r[1], pz = (z - c[2]) / r[2];
      var k0 = Math.hypot(px, py, pz), k1 = Math.hypot(px / r[0], py / r[1], pz / r[2]);
      return k1 < 1e-9 ? -Math.min(r[0], r[1], r[2]) : k0 * (k0 - 1) / k1;
    },
    /** 둥근 원뿔 캡슐: a→b, 반지름 ra→rb */
    cap: function (x, y, z, a, b, ra, rb) {
      if (rb === undefined) rb = ra;
      var bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
      var pax = x - a[0], pay = y - a[1], paz = z - a[2];
      var l2 = bax * bax + bay * bay + baz * baz, h = Math.max(0, Math.min(1, (pax * bax + pay * bay + paz * baz) / (l2 || 1)));
      return Math.hypot(pax - bax * h, pay - bay * h, paz - baz * h) - (ra + (rb - ra) * h);
    },
    box: function (x, y, z, c, b, r) {
      var qx = Math.abs(x - c[0]) - b[0] + (r || 0), qy = Math.abs(y - c[1]) - b[1] + (r || 0), qz = Math.abs(z - c[2]) - b[2] + (r || 0);
      return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - (r || 0);
    },
    smin: function (a, b, k) { var h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; },
    smax: function (a, b, k) { return -T.sd.smin(-a, -b, k); }
  };
  /** sdf(x,y,z) 를 [min,max] 상자에서 해상도 res(긴 변 칸 수)로 메쉬로. colorFn(x,y,z,n) → [r,g,b] 0~1 (선택) */
  T.sdfMesh = function (sdf, min, max, res, colorFn) {
    var sx = max[0] - min[0], sy = max[1] - min[1], sz = max[2] - min[2], L = Math.max(sx, sy, sz), h = L / res;
    var nx = Math.ceil(sx / h) + 1, ny = Math.ceil(sy / h) + 1, nz = Math.ceil(sz / h) + 1;
    var F = new Float32Array(nx * ny * nz), i, j, k;
    for (k = 0; k < nz; k++) for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) F[i + nx * (j + ny * k)] = sdf(min[0] + i * h, min[1] + j * h, min[2] + k * h);
    var cid = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1), verts = [], idx = [];
    var E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
    var C = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
    var val = new Float32Array(8);
    for (k = 0; k < nz - 1; k++) for (j = 0; j < ny - 1; j++) for (i = 0; i < nx - 1; i++) {
      var mask = 0;
      for (var c = 0; c < 8; c++) { val[c] = F[(i + C[c][0]) + nx * ((j + C[c][1]) + ny * (k + C[c][2]))]; if (val[c] < 0) mask |= 1 << c; }
      if (mask === 0 || mask === 255) continue;
      var ax = 0, ay = 0, az = 0, cnt = 0;
      for (var e = 0; e < 12; e++) {
        var a = E[e][0], b = E[e][1];
        if ((val[a] < 0) === (val[b] < 0)) continue;
        var t = val[a] / (val[a] - val[b]);
        ax += C[a][0] + t * (C[b][0] - C[a][0]); ay += C[a][1] + t * (C[b][1] - C[a][1]); az += C[a][2] + t * (C[b][2] - C[a][2]); cnt++;
      }
      cid[i + (nx - 1) * (j + (ny - 1) * k)] = verts.length / 3;
      verts.push(min[0] + (i + ax / cnt) * h, min[1] + (j + ay / cnt) * h, min[2] + (k + az / cnt) * h);
    }
    function cell(i, j, k) { return cid[i + (nx - 1) * (j + (ny - 1) * k)]; }
    function quad(a, b, c, d, flip) { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (flip) idx.push(a, c, b, a, d, c); else idx.push(a, b, c, a, c, d); }
    for (k = 1; k < nz - 1; k++) for (j = 1; j < ny - 1; j++) for (i = 0; i < nx - 1; i++) { // x 모서리
      var s0 = F[i + nx * (j + ny * k)] < 0, s1 = F[i + 1 + nx * (j + ny * k)] < 0;
      if (s0 !== s1) quad(cell(i, j - 1, k - 1), cell(i, j, k - 1), cell(i, j, k), cell(i, j - 1, k), s1);
    }
    for (k = 1; k < nz - 1; k++) for (j = 0; j < ny - 1; j++) for (i = 1; i < nx - 1; i++) { // y 모서리
      s0 = F[i + nx * (j + ny * k)] < 0; s1 = F[i + nx * (j + 1 + ny * k)] < 0;
      if (s0 !== s1) quad(cell(i - 1, j, k - 1), cell(i - 1, j, k), cell(i, j, k), cell(i, j, k - 1), s1);
    }
    for (k = 0; k < nz - 1; k++) for (j = 1; j < ny - 1; j++) for (i = 1; i < nx - 1; i++) { // z 모서리
      s0 = F[i + nx * (j + ny * k)] < 0; s1 = F[i + nx * (j + ny * (k + 1))] < 0;
      if (s0 !== s1) quad(cell(i - 1, j - 1, k), cell(i, j - 1, k), cell(i, j, k), cell(i - 1, j, k), s1);
    }
    var g = new THREE.BufferGeometry(), pos = new Float32Array(verts), nor = new Float32Array(verts.length), e2 = h * 0.5;
    for (var v = 0; v < verts.length; v += 3) {
      var x = verts[v], y = verts[v + 1], z = verts[v + 2];
      var gx = sdf(x + e2, y, z) - sdf(x - e2, y, z), gy = sdf(x, y + e2, z) - sdf(x, y - e2, z), gz = sdf(x, y, z + e2) - sdf(x, y, z - e2), l = Math.hypot(gx, gy, gz) || 1;
      nor[v] = gx / l; nor[v + 1] = gy / l; nor[v + 2] = gz / l;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    if (colorFn) {
      var col = new Float32Array(verts.length);
      for (v = 0; v < verts.length; v += 3) { var cc = colorFn(verts[v], verts[v + 1], verts[v + 2], [nor[v], nor[v + 1], nor[v + 2]]); col[v] = cc[0]; col[v + 1] = cc[1]; col[v + 2] = cc[2]; }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    }
    g.setIndex(idx);
    return g;
  };

  /* ------------------------------------------------------------ 사람 몸 (조각용 SDF 부품) */
  /** 서 있는 사람의 관절. o: {h(키), hip:[x,y,z], lean, twist, la/ra(팔 끝 위치 함수 결과), ll/rl} 를 받아 캡슐 목록 */
  T.figure = function (o) {
    // 관절 좌표는 키 1 기준, 나중에 o.s 배율
    var s = o.s || 1, J = o.J, parts = [];
    function cap(a, b, ra, rb) { parts.push({ t: 'c', a: J[a], b: J[b], ra: ra * s, rb: (rb === undefined ? ra : rb) * s }); }
    function ell(c, r) { parts.push({ t: 'e', c: c, r: r.map(function (q) { return q * s; }) }); }
    // 몸통
    if (J.pelvis) ell(J.pelvis, [0.085, 0.065, 0.06]);
    if (J.belly) ell(J.belly, [0.072, 0.08, 0.055]);
    if (J.chest) ell(J.chest, [0.095, 0.085, 0.062]);
    if (J.neck && J.head) cap('neck', 'headBase', 0.03, 0.028);
    if (J.head) ell(J.head, [0.052, 0.066, 0.058]);
    if (J.lsh) { cap('lsh', 'lel', 0.032, 0.026); cap('lel', 'lwr', 0.025, 0.019); if (J.lha) cap('lwr', 'lha', 0.02, 0.016); }
    if (J.rsh) { cap('rsh', 'rel', 0.032, 0.026); cap('rel', 'rwr', 0.025, 0.019); if (J.rha) cap('rwr', 'rha', 0.02, 0.016); }
    if (J.lsh && J.rsh) cap('lsh', 'rsh', 0.04, 0.04);
    if (J.lhip) { cap('lhip', 'lkn', 0.058, 0.038); cap('lkn', 'lan', 0.036, 0.024); if (J.lft) cap('lan', 'lft', 0.024, 0.02); }
    if (J.rhip) { cap('rhip', 'rkn', 0.058, 0.038); cap('rkn', 'ran', 0.036, 0.024); if (J.rft) cap('ran', 'rft', 0.024, 0.02); }
    return parts;
  };
  T.partsSdf = function (parts, k) {
    // 각 부품의 감싸는 구 (멀리 있는 부품은 계산을 건너뜀)
    parts.forEach(function (p) {
      if (p.t === 'c') { p.bc = [(p.a[0] + p.b[0]) / 2, (p.a[1] + p.b[1]) / 2, (p.a[2] + p.b[2]) / 2]; p.br = Math.hypot(p.a[0] - p.b[0], p.a[1] - p.b[1], p.a[2] - p.b[2]) / 2 + Math.max(p.ra, p.rb); }
      else if (p.t === 'e') { p.bc = p.c; p.br = Math.max(p.r[0], p.r[1], p.r[2]); }
      else if (p.t === 's') { p.bc = p.c; p.br = p.r; }
      else if (p.t === 'b') { p.bc = p.c; p.br = Math.hypot(p.b[0], p.b[1], p.b[2]); }
    });
    return function (x, y, z) {
      var d = 1e9;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i], q, kk = p.k || k || 0.03;
        if (p.bc && !p.sub) { var lb = Math.hypot(x - p.bc[0], y - p.bc[1], z - p.bc[2]) - p.br; if (lb > d + kk) continue; }
        if (p.t === 'c') q = T.sd.cap(x, y, z, p.a, p.b, p.ra, p.rb);
        else if (p.t === 'e') q = T.sd.ell(x, y, z, p.c, p.r);
        else if (p.t === 's') q = T.sd.sphere(x, y, z, p.c, p.r);
        else if (p.t === 'b') q = T.sd.box(x, y, z, p.c, p.b, p.rr);
        else if (p.t === 'f') q = p.f(x, y, z);
        if (p.sub) d = T.sd.smax(d, -q, p.k || 0.01);
        else d = T.sd.smin(d, q, kk);
      }
      return d;
    };
  };
  /** 얼굴 붙은 머리 SDF: 중심 c, 크기 r(머리 반높이), 앞쪽 = +z */
  T.headSdf = function (c, r, o) {
    o = o || {};
    var cx = c[0], cy = c[1], cz = c[2];
    return function (x, y, z) {
      var X = (x - cx) / r, Y = (y - cy) / r, Z = (z - cz) / r;
      var d = T.sd.ell(X, Y, Z, [0, 0.05, -0.05], [0.74, 0.95, 0.86]);              // 머리통
      d = T.sd.smin(d, T.sd.ell(X, Y, Z, [0, -0.45, 0.18], [0.5, 0.48, 0.55]), 0.25); // 턱·볼
      d = T.sd.smin(d, T.sd.cap(X, Y, Z, [0, 0.08, 0.66], [0, -0.3, 0.86], 0.07, 0.13), 0.08); // 코
      d = T.sd.smin(d, T.sd.ell(X, Y, Z, [0, -0.52, 0.64], [0.2, 0.07, 0.08]), 0.06); // 입술
      d = T.sd.smin(d, T.sd.ell(X, Y, Z, [0, -0.86, 0.48], [0.2, 0.14, 0.14]), 0.12); // 턱끝
      d = T.sd.smin(d, T.sd.ell(X, Y, Z, [0, 0.22, 0.62], [0.55, 0.1, 0.14]), 0.12); // 눈썹뼈
      d = T.sd.smax(d, -T.sd.sphere(X, Y, Z, [0.26, 0.05, 0.78], 0.15), 0.08);       // 눈두덩
      d = T.sd.smax(d, -T.sd.sphere(X, Y, Z, [-0.26, 0.05, 0.78], 0.15), 0.08);
      d = T.sd.smin(d, T.sd.ell(X, Y, Z, [0.25, 0.04, 0.66], [0.11, 0.07, 0.07]), 0.03); // 눈알
      d = T.sd.smin(d, T.sd.ell(X, Y, Z, [-0.25, 0.04, 0.66], [0.11, 0.07, 0.07]), 0.03);
      if (!o.noEars) {
        d = T.sd.smin(d, T.sd.ell(X, Y, Z, [0.72, -0.05, 0.0], [0.08, 0.22, 0.13]), 0.06);
        d = T.sd.smin(d, T.sd.ell(X, Y, Z, [-0.72, -0.05, 0.0], [0.08, 0.22, 0.13]), 0.06);
      }
      return d * r;
    };
  };

  /* ------------------------------------------------------------ 그림 도구 (2D) */
  T.paint = {
    /** 부드러운 덩어리 */
    blob: function (g, x, y, rx, ry, col, soft, rot) {
      g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(1, ry / rx);
      var gr = g.createRadialGradient(0, 0, rx * (1 - (soft || 0.4)), 0, 0, rx);
      gr.addColorStop(0, col); gr.addColorStop(1, col.replace(/rgba?\(([^)]*?)(,\s*[\d.]+)?\)$/, function (m, a) { return 'rgba(' + a.split(',').slice(0, 3).join(',') + ',0)'; }));
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, Math.PI * 2); g.fill(); g.restore();
    },
    poly: function (g, pts, fill, stroke, lw) {
      g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.closePath();
      if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 1; g.stroke(); }
    },
    curve: function (g, pts, stroke, lw, fill) { // 부드러운 곡선 (중점 이차곡선)
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length - 1; i++) { var mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; g.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); }
      g.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
      if (fill) { g.closePath(); g.fillStyle = fill; g.fill(); }
      if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 1; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); }
    },
    /** 붓 자국 질감 — 화면 전체에 짧은 획 */
    strokes: function (g, w, h, n, alpha, len) {
      var snap = g.getImageData(0, 0, w, h).data;
      for (var i = 0; i < n; i++) {
        var x = T.rnd() * w, y = T.rnd() * h, o = ((y | 0) * w + (x | 0)) * 4;
        var dx = Math.min(w - 2, (x | 0) + 1), gx = 0;
        var a = T.rr(-0.6, 0.6), l = (len || 10) * T.rr(0.5, 1.5), k = T.rr(-16, 16);
        g.strokeStyle = 'rgba(' + Math.max(0, Math.min(255, snap[o] + k)) + ',' + Math.max(0, Math.min(255, snap[o + 1] + k)) + ',' + Math.max(0, Math.min(255, snap[o + 2] + k)) + ',' + (alpha || 0.35) + ')';
        g.lineWidth = T.rr(1, 3); g.lineCap = 'round';
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
      }
    },
    /** 옛 유화의 누런 바니시·잔금·가장자리 그늘 */
    age: function (g, w, h, o) {
      o = o || {};
      g.save();
      g.globalCompositeOperation = 'multiply';
      g.fillStyle = o.tint || 'rgba(214,186,120,0.38)'; g.fillRect(0, 0, w, h);
      var gr = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.75);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(110,90,60,1)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.restore();
      if (o.crack !== false) {
        g.save(); g.strokeStyle = 'rgba(30,20,10,' + (o.crack || 0.18) + ')'; g.lineWidth = 0.7;
        for (var i = 0; i < (o.cracks || 260); i++) {
          var x = T.rnd() * w, y = T.rnd() * h; g.beginPath(); g.moveTo(x, y);
          for (var k = 0; k < 4; k++) { x += T.rr(-14, 14); y += T.rr(-14, 14); g.lineTo(x, y); }
          g.stroke();
        }
        g.restore();
      }
    },
    /** 단순한 사람 (옷 입은 서 있는/앉은 모습). o: {x,y(발),h, robe, skin, hair, pose, head:'round'} */
    person: function (g, o) {
      var x = o.x, y = o.y, h = o.h, hw = h * (o.wide || 0.2), skin = o.skin || '#d9a77a', robe = o.robe || '#7a2a20';
      var top = y - h, hr = h * 0.085;
      g.save();
      if (o.sit) { // 앉은 모습: 무릎까지
        T.paint.poly(g, [[x - hw, y], [x - hw * 0.75, top + hr * 2.4], [x + hw * 0.75, top + hr * 2.4], [x + hw, y]], robe);
      } else {
        T.paint.poly(g, [[x - hw * 0.8, y], [x - hw * 0.62, top + hr * 2.4], [x - hw * 0.3, top + hr * 2.0], [x + hw * 0.3, top + hr * 2.0], [x + hw * 0.62, top + hr * 2.4], [x + hw * 0.8, y]], robe);
      }
      // 옷 주름 음영
      var gr = g.createLinearGradient(x - hw, 0, x + hw, 0);
      gr.addColorStop(0, 'rgba(0,0,0,0.35)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.08)'); gr.addColorStop(1, 'rgba(0,0,0,0.3)');
      g.fillStyle = gr; g.fillRect(x - hw, top + hr * 2, hw * 2, h - hr * 2);
      if (o.mantle) T.paint.poly(g, [[x - hw * 0.7, top + hr * 2.3], [x + hw * 0.2, top + hr * 2.1], [x + hw * 0.5, y - h * 0.35], [x - hw * 0.75, y - h * 0.2]], o.mantle);
      // 팔
      if (o.arm !== false) {
        g.strokeStyle = o.sleeve || robe; g.lineWidth = hw * 0.32; g.lineCap = 'round';
        var ax = o.armTo || [x + hw * 0.9, top + h * 0.45];
        g.beginPath(); g.moveTo(x + hw * 0.5, top + hr * 2.6); g.lineTo(ax[0], ax[1]); g.stroke();
        g.fillStyle = skin; g.beginPath(); g.arc(ax[0], ax[1], hw * 0.14, 0, Math.PI * 2); g.fill();
        var bx = o.arm2To || [x - hw * 0.85, top + h * 0.48];
        g.strokeStyle = o.sleeve || robe; g.beginPath(); g.moveTo(x - hw * 0.5, top + hr * 2.6); g.lineTo(bx[0], bx[1]); g.stroke();
        g.fillStyle = skin; g.beginPath(); g.arc(bx[0], bx[1], hw * 0.14, 0, Math.PI * 2); g.fill();
      }
      // 목·머리
      g.fillStyle = skin; g.fillRect(x - hr * 0.35, top + hr * 1.5, hr * 0.7, hr * 0.8);
      if (o.hairBack) { g.fillStyle = o.hairBack; g.beginPath(); g.ellipse(x, top + hr * 1.3, hr * 1.2, hr * 1.6, 0, 0, Math.PI * 2); g.fill(); }
      var hg = g.createRadialGradient(x - hr * 0.3, top + hr * 0.7, hr * 0.2, x, top + hr, hr * 1.1);
      hg.addColorStop(0, o.skinHi || '#f0c9a0'); hg.addColorStop(1, skin);
      g.fillStyle = hg; g.beginPath(); g.ellipse(x, top + hr, hr * 0.82, hr, 0, 0, Math.PI * 2); g.fill();
      if (o.hair) { g.fillStyle = o.hair; g.beginPath(); g.ellipse(x, top + hr * 0.55, hr * 0.88, hr * 0.62, 0, Math.PI, Math.PI * 2); g.fill(); }
      if (o.beard) { g.fillStyle = o.beard; g.beginPath(); g.ellipse(x, top + hr * 1.55, hr * 0.6, hr * 0.7, 0, 0, Math.PI); g.fill(); }
      if (o.hat) { g.fillStyle = o.hat; g.beginPath(); g.ellipse(x, top + hr * 0.25, hr * 1.1, hr * 0.42, 0, 0, Math.PI * 2); g.fill(); }
      if (o.halo) { g.strokeStyle = o.halo; g.lineWidth = hr * 0.18; g.beginPath(); g.arc(x, top + hr * 0.9, hr * 1.45, 0, Math.PI * 2); g.stroke(); }
      g.restore();
    },
    text: function (g, s, x, y, size, font, col, opts) {
      g.save(); g.font = (opts && opts.weight || '') + ' ' + size + 'px ' + (font || '"Noto Serif CJK TC"'); g.fillStyle = col || '#111';
      g.textAlign = opts && opts.align || 'left'; g.textBaseline = 'top'; g.fillText(s, x, y); g.restore();
    },
    /** 세로쓰기 (오른쪽 → 왼쪽) */
    vtext: function (g, s, x0, y0, size, colGap, rows, col, font, jitter) {
      var cols = 0; g.save(); g.font = size + 'px ' + (font || '"Noto Serif CJK TC"'); g.fillStyle = col || '#141010'; g.textAlign = 'center'; g.textBaseline = 'top';
      var chars = Array.from(s), r = 0, x = x0;
      chars.forEach(function (ch) {
        if (ch === '\n') { r = 0; x -= colGap; return; }
        g.save(); g.translate(x + (jitter ? T.rr(-jitter, jitter) : 0), y0 + r * size * 1.05);
        if (jitter) g.rotate(T.rr(-0.05, 0.05));
        g.fillText(ch, 0, 0); g.restore();
        r++; if (r >= rows) { r = 0; x -= colGap; }
      });
      g.restore();
    },
    /** 붉은 인장 */
    seal: function (g, x, y, s, ch) {
      g.save(); g.fillStyle = 'rgba(178,30,26,0.9)'; g.fillRect(x, y, s, s);
      g.fillStyle = 'rgba(250,235,220,0.9)'; g.font = (s * 0.42) + 'px "Noto Serif CJK TC"'; g.textAlign = 'center'; g.textBaseline = 'middle';
      var c = Array.from(ch || '印信');
      if (c.length >= 4) { g.fillText(c[0], x + s * 0.72, y + s * 0.27); g.fillText(c[1], x + s * 0.72, y + s * 0.73); g.fillText(c[2], x + s * 0.28, y + s * 0.27); g.fillText(c[3], x + s * 0.28, y + s * 0.73); }
      else { g.fillText(c[0], x + s / 2, y + s * 0.28); g.fillText(c[1] || '', x + s / 2, y + s * 0.72); }
      g.restore();
    }
  };

  /* ------------------------------------------------------------ 액자·판 */
  /** 금빛 액자 + 그림판. w,h = 그림 크기, fw = 액자 폭 */
  T.framed = function (canvas, w, h, o) {
    o = o || {};
    var fw = o.fw === undefined ? Math.min(w, h) * 0.09 : o.fw, d = o.depth || fw * 0.6;
    var gr = T.group();
    var pm = T.mat.matte({ roughness: 0.62, clearcoat: 0.35, clearcoatRoughness: 0.5, envMapIntensity: 0.35 });
    pm.map = T.tex(canvas); pm.needsUpdate = true;
    if (o.bump) { pm.bumpMap = T.tex(o.bump, { linear: true }); pm.bumpScale = o.bumpScale || 0.004; }
    var panel = T.mesh(new THREE.PlaneGeometry(w, h), pm, 0, 0, 0.002);
    gr.add(panel);
    gr.add(T.mesh(new THREE.BoxGeometry(w, h, d * 0.5), T.mat.wood({ color: 0x2a1a10 }), 0, 0, -d * 0.25));
    if (fw > 0) {
      var outer = T.shape([[-w / 2 - fw, -h / 2 - fw], [w / 2 + fw, -h / 2 - fw], [w / 2 + fw, h / 2 + fw], [-w / 2 - fw, h / 2 + fw]]);
      var hole = new THREE.Path(); hole.moveTo(-w / 2, -h / 2); hole.lineTo(-w / 2, h / 2); hole.lineTo(w / 2, h / 2); hole.lineTo(w / 2, -h / 2); hole.closePath();
      outer.holes.push(hole);
      var fg = new THREE.ExtrudeGeometry(outer, { depth: d, bevelEnabled: true, bevelThickness: fw * 0.35, bevelSize: fw * 0.3, bevelSegments: 4 });
      fg.translate(0, 0, -d * 0.6);
      var fm = o.frameMat || T.mat.gilt({ roughness: 0.42 });
      if (!o.frameMat) { fm.bumpMap = T.tex(T.noiseCanvas(256, 256, 6, 60, 200, 3), { linear: true, repeat: [3, 3] }); fm.bumpScale = 0.004; }
      gr.add(T.mesh(fg, fm));
      // 안쪽 몰딩
      var inner = T.shape([[-w / 2 - fw * 0.18, -h / 2 - fw * 0.18], [w / 2 + fw * 0.18, -h / 2 - fw * 0.18], [w / 2 + fw * 0.18, h / 2 + fw * 0.18], [-w / 2 - fw * 0.18, h / 2 + fw * 0.18]]);
      var hole2 = new THREE.Path(); hole2.moveTo(-w / 2, -h / 2); hole2.lineTo(-w / 2, h / 2); hole2.lineTo(w / 2, h / 2); hole2.lineTo(w / 2, -h / 2); hole2.closePath();
      inner.holes.push(hole2);
      var ig = new THREE.ExtrudeGeometry(inner, { depth: fw * 0.12, bevelEnabled: true, bevelThickness: fw * 0.08, bevelSize: fw * 0.06, bevelSegments: 2 });
      gr.add(T.mesh(ig, T.mat.gold({ roughness: 0.3 }), 0, 0, d * 0.32));
    }
    gr.userData.flat = true;
    return gr;
  };

  /* ------------------------------------------------------------ 장면·찍기 */
  T.setup = function () {
    THREE.ColorManagement.legacyMode = false; // 16진 색을 sRGB로 해석
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false });
    renderer.setPixelRatio(1);
    renderer.setSize(CW * SS, CH * SS);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.physicallyCorrectLights = true;
    document.body.appendChild(renderer.domElement);
    pmrem = new THREE.PMREMGenerator(renderer);
    envTex = pmrem.fromScene(studio(), 0.0).texture;
    return { ok: true };
  };
  T.renderer = function () { return renderer; };
  /** 사진 스튜디오 환경: 거의 검은 방 + 소프트박스 몇 장 (금속·보석에 또렷한 반사) */
  function studio() {
    var s = new THREE.Scene();
    s.add(new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({ color: 0x0a0806, side: THREE.BackSide })));
    function panel(w, h, p, k, col) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(p[0], p[1], p[2]); m.lookAt(0, 0, 0); s.add(m);
    }
    panel(10, 7, [-1, 9, 3], 3.2, 0xfff1dc);   // 위 소프트박스
    panel(2.5, 9, [-8, 1, 4], 2.4, 0xffe3c0);  // 왼쪽 띠 조명
    panel(2.5, 9, [8, 1.5, -3], 1.6, 0xd8e6ff); // 오른쪽 뒤 띠
    panel(7, 1.6, [0, -1.5, 9], 0.8, 0xffe8d0); // 앞 아래 반사판
    panel(1.2, 1.2, [4, 5, 6], 6.0, 0xffffff);  // 작은 핫스팟
    panel(1.0, 1.0, [-5, 3, -6], 4.0, 0xfff4e0);
    return s;
  }

  function bounds(obj) {
    obj.updateMatrixWorld(true);
    var R = 0, ymin = 1e9, ymax = -1e9, v = new THREE.Vector3(), m4 = new THREE.Matrix4();
    obj.traverse(function (m) {
      if (!m.isMesh || !m.geometry || m.userData.noFit) return;
      var p = m.geometry.attributes.position, step = Math.max(1, Math.floor(p.count / 6000));
      if (m.isInstancedMesh) {
        for (var k = 0; k < m.count; k++) {
          m.getMatrixAt(k, m4); m4.premultiply(m.matrixWorld);
          for (var i = 0; i < p.count; i += Math.max(1, Math.floor(p.count / 40))) { v.fromBufferAttribute(p, i).applyMatrix4(m4); R = Math.max(R, Math.hypot(v.x, v.z)); ymin = Math.min(ymin, v.y); ymax = Math.max(ymax, v.y); }
        }
        return;
      }
      for (var i = 0; i < p.count; i += step) { v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld); R = Math.max(R, Math.hypot(v.x, v.z)); ymin = Math.min(ymin, v.y); ymax = Math.max(ymax, v.y); }
    });
    return { R: R, ymin: ymin, ymax: ymax };
  }
  T.bounds = bounds;

  /** 박물관 조명 장면 하나를 만들어 id의 모형 여덟 시점을 찍는다. */
  T.sheet = function (id, opt) {
    opt = opt || {};
    T.seed(id);
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.environment = envTex;
    var obj = T.OBJ[id](T);
    var cfg = obj.userData || {};
    var holder = new THREE.Group(); holder.add(obj); scene.add(holder);
    var b = bounds(holder), Hh = b.ymax - b.ymin, yc = (b.ymax + b.ymin) / 2;
    var views = cfg.views || [0, 45, 90, 135, 180, 225, 270, 315];
    // 넓이: 회전하는 물건은 반지름 R, 흔드는 판은 최대 흔들림에서의 폭
    var aspect = CW / CH, fov = cfg.fov || 28, t = Math.tan(fov / 2 * Math.PI / 180), elev = (cfg.elev === undefined ? 10 : cfg.elev) * Math.PI / 180;
    var margin = cfg.margin || 1.1;
    var dist = Math.max((Hh / 2 * margin) / t, (b.R * margin) / (t * aspect)) + b.R;
    var cam = new THREE.PerspectiveCamera(fov, aspect, dist / 50, dist * 10);
    cam.position.set(0, yc + Math.sin(elev) * dist, Math.cos(elev) * dist);
    cam.lookAt(0, yc, 0);
    // 조명 (카메라 기준으로 고정, 물건만 돈다)
    var S = Math.max(Hh, b.R * 2);
    var key = new THREE.SpotLight(cfg.keyColor || 0xffe2b8, (cfg.key || 1) * 160 * S * S, 0, 0.42, 0.65, 2);
    key.position.set(-0.55 * dist, yc + 1.25 * dist, 0.75 * dist); key.target.position.set(0, yc, 0);
    key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.camera.near = dist * 0.3; key.shadow.camera.far = dist * 4;
    scene.add(key, key.target);
    var rim = new THREE.SpotLight(0xbcd2ff, (cfg.rim || 1) * 90 * S * S, 0, 0.5, 0.8, 2);
    rim.position.set(0.9 * dist, yc + 0.6 * dist, -0.9 * dist); rim.target.position.set(0, yc, 0); scene.add(rim, rim.target);
    var fill = new THREE.PointLight(0xffd7a8, (cfg.fill || 1) * 4 * S * S, 0, 2); fill.position.set(0.8 * dist, yc - 0.1 * dist, 0.9 * dist); scene.add(fill);
    var amb = new THREE.HemisphereLight(0x302820, 0x000000, (cfg.amb || 1) * 0.08); scene.add(amb);
    renderer.toneMappingExposure = cfg.exposure || 0.92;
    var envK = cfg.envK === undefined ? 0.45 : cfg.envK;
    obj.traverse(function (m) { if (m.material) [].concat(m.material).forEach(function (mt) { if (!mt.userData.envDone) { if (mt.metalness < 0.5 && !mt.userData.keepEnv) mt.envMapIntensity = (mt.envMapIntensity || 1) * envK; mt.userData.envDone = true; } }); });
    var out = document.createElement('canvas'); out.width = CW * 4; out.height = CH * 2;
    var og = out.getContext('2d'); og.imageSmoothingEnabled = true; og.imageSmoothingQuality = 'high';
    var tilt = cfg.tilt || 0;
    views.forEach(function (deg, i) {
      holder.rotation.set(Array.isArray(tilt) ? tilt[i] : tilt, deg * Math.PI / 180, 0);
      if (cfg.onView) cfg.onView(i, holder, cam);
      renderer.render(scene, cam);
      og.drawImage(renderer.domElement, 0, 0, CW * SS, CH * SS, (i % 4) * CW, Math.floor(i / 4) * CH, CW, CH);
    });
    // 정리
    scene.traverse(function (m) { if (m.geometry) m.geometry.dispose(); if (m.material) { [].concat(m.material).forEach(function (mt) { for (var k in mt) if (mt[k] && mt[k].isTexture) mt[k].dispose(); mt.dispose(); }); } });
    return out.toDataURL('image/png');
  };

  /** 넓은 장면 한 컷 (교역품용): fn(scene, cam, k) 를 프레임마다 부르고 w×h 로 찍음 */
  T.shot = function (w, h, setupFn, frames) {
    renderer.setSize(w * SS, h * SS);
    var scene = new THREE.Scene(); scene.environment = envTex;
    var st = setupFn(scene, T);
    var res = [], c = document.createElement('canvas'); c.width = w; c.height = h;
    var g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    for (var f = 0; f < frames; f++) {
      st.frame(f / Math.max(1, frames - 1), f);
      renderer.toneMappingExposure = st.exposure || 1;
      renderer.render(scene, st.cam);
      g.clearRect(0, 0, w, h);
      g.drawImage(renderer.domElement, 0, 0, w * SS, h * SS, 0, 0, w, h);
      res.push(c.toDataURL('image/png'));
    }
    scene.traverse(function (m) { if (m.geometry) m.geometry.dispose(); if (m.material) { [].concat(m.material).forEach(function (mt) { for (var k in mt) if (mt[k] && mt[k].isTexture) mt[k].dispose(); mt.dispose(); }); } });
    renderer.setSize(CW * SS, CH * SS);
    return res;
  };
  T.env = function () { return envTex; };
  return T;
})();
