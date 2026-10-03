/* 헤드리스 Chromium 안에서 배 한 척의 8방향 동작 시트(1792×3584)를 굽는다.
   카메라: 정사영, 수면 위 약 31°(sin = 0.52)에서 내려다보고 높이는 0.92배로 보이게(render_ship_sprites.py의 투영과 같다).
   피벗: 수면 중심이 칸의 (112,139). 3배로 그려 줄여 담는다(가장자리 매끈). */
(function (root) {
  'use strict';
  var B = root.Bake = {};
  var CELL = 224, AX = 112, AY = 139, COLS = 8, DIRS = 8, TAU = Math.PI * 2;
  var ACTIONS = { idle: { row: 0, col: 0, frames: 3 }, drift: { row: 0, col: 3, frames: 5 }, dash: { row: DIRS, col: 0, frames: 8 } };
  var SS, renderer, scene, cam, YS, key;

  B.setup = function (cfg) {
    cfg = cfg || {};
    SS = cfg.ss || 3;
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: true });
    renderer.setPixelRatio(1); renderer.setSize(CELL * SS, CELL * SS, false);
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = cfg.exposure || 1.32;   // 밝은 돛이 하얗게 날아가지 않게
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene();
    var th = Math.asin(0.52);
    YS = 0.92 / Math.cos(th);
    cam = new THREE.OrthographicCamera(-AX, CELL - AX, AY, -(CELL - AY), 1, 6000);
    cam.position.set(0, Math.sin(th) * 2500, Math.cos(th) * 2500); cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld(true); cam.updateProjectionMatrix();   // 첫 렌더 전에 맞춤 계산(project)을 하므로
    // 빛: 왼쪽 위 앞에서 따뜻한 해, 하늘빛 채움, 오른쪽 뒤 푸른 가장자리 빛
    scene.add(new THREE.HemisphereLight(0xe8eef8, 0x6e5034, 0.78));
    scene.add(new THREE.AmbientLight(0xfff6e8, 0.10));
    key = new THREE.DirectionalLight(0xfff0d4, 1.55);
    key.position.set(-260, 430, 310); key.castShadow = true;
    var sc = key.shadow.camera; sc.left = -170; sc.right = 170; sc.top = 170; sc.bottom = -170; sc.near = 10; sc.far = 1600;
    key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0006; key.shadow.normalBias = 0.25; key.shadow.radius = 2;
    scene.add(key); scene.add(key.target);
    var rim = new THREE.DirectionalLight(0xc4d6ff, 0.38); rim.position.set(320, 160, -260); scene.add(rim);
    Ship3D.init(THREE);
    return { ss: SS, ys: YS };
  };

  function state(action, fi) {
    var n = ACTIONS[action].frames, ph = TAU * fi / n, sn = Math.sin(ph);
    if (action === 'idle') return { furl: true, brace: 0.03, bill: 0, power: 0.06, phase: ph, oar: ph, oarPow: 0.0, roll: sn * 0.010, pitch: Math.cos(ph) * 0.006 };
    if (action === 'drift') return { furl: false, brace: 0.16 + 0.07 * sn, bill: 0.55 + 0.10 * sn, flutter: 0.8, power: 0.34, phase: ph, oar: ph, oarPow: 0.35, roll: 0.028 + sn * 0.008, pitch: sn * 0.007 };
    return { furl: false, brace: 0.19 + 0.035 * sn, bill: 1.0 + 0.06 * sn, flutter: 0.22, power: 1, phase: ph, oar: ph, oarPow: 1, roll: 0.06 + sn * 0.012, pitch: sn * 0.0113 };
  }
  B.state = state;

  function disposeTree(o) {
    o.traverse(function (c) { if (c.geometry) c.geometry.dispose(); });
  }
  function screenBox(obj, box) {
    obj.updateMatrixWorld(true);
    var v = new THREE.Vector3();
    obj.traverse(function (o) {
      if (!o.isMesh || o.isInstancedMesh) return;
      var p = o.geometry.attributes.position;
      for (var i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld).project(cam);
        var px = (v.x + 1) / 2 * CELL, py = (1 - v.y) / 2 * CELL;
        if (px < box[0]) box[0] = px; if (py < box[1]) box[1] = py; if (px > box[2]) box[2] = px; if (py > box[3]) box[3] = py;
      }
    });
    return box;
  }

  function Rig(spec) {
    this.ship = new Ship3D.Ship(spec);
    this.root = new THREE.Group(); this.body = new THREE.Group(); this.root.add(this.body);
    this.hull = this.ship.buildHull(); this.body.add(this.hull);
    this.k = 1; this.setScale(1);
    scene.add(this.root);
  }
  Rig.prototype.setScale = function (k) { this.k = k; this.root.scale.set(k, k * YS, k); };
  Rig.prototype.pose = function (action, dir, fi) {
    if (this.dyn) { this.body.remove(this.dyn); disposeTree(this.dyn); }
    if (this.wat) { this.root.remove(this.wat); disposeTree(this.wat); }
    var st = state(action, fi);
    this.dyn = new THREE.Group();
    this.dyn.add(this.ship.buildRig(st)); this.dyn.add(this.ship.buildOars(st));
    this.body.add(this.dyn);
    this.wat = this.ship.buildWater(st); this.root.add(this.wat);
    this.root.rotation.y = dir * TAU / DIRS;
    this.body.rotation.set(st.roll, 0, st.pitch);
    return st;
  };
  Rig.prototype.dispose = function () {
    scene.remove(this.root); disposeTree(this.root);
  };

  /* 칸 안에 들어가도록(사방 3px) 배율을 고른다 — 모든 방향·동작의 극단 장면을 투영해 본다 */
  Rig.prototype.fit = function () {
    var box = [1e9, 1e9, -1e9, -1e9], self = this;
    ['idle', 'drift', 'dash'].forEach(function (a) {
      var n = ACTIONS[a].frames;
      for (var d = 0; d < DIRS; d++) for (var f = 0; f < n; f += Math.max(1, Math.floor(n / 4))) { self.pose(a, d, f); screenBox(self.root, box); }
    });
    var m = 3.2, k = Math.min(1,
      (AX - m) / Math.max(1e-6, AX - box[0]), (CELL - m - AX) / Math.max(1e-6, box[2] - AX),
      (AY - m) / Math.max(1e-6, AY - box[1]), (CELL - m - AY) / Math.max(1e-6, box[3] - AY));
    this.setScale(k);
    return { k: k, box: box };
  };

  function cellCanvas() { var c = document.createElement('canvas'); c.width = CELL; c.height = CELL; return c; }
  function drawCell(ctx, x, y) {
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    // 3배 → 1배를 한 번에 줄이면 거칠어지므로 두 단계로 줄인다
    var mid = B._mid || (B._mid = document.createElement('canvas')), S = CELL * SS, M2 = Math.round(S / 2);
    if (SS >= 3) {
      mid.width = M2; mid.height = M2; var mc = mid.getContext('2d');
      mc.clearRect(0, 0, M2, M2); mc.imageSmoothingEnabled = true; mc.imageSmoothingQuality = 'high';
      mc.drawImage(renderer.domElement, 0, 0, S, S, 0, 0, M2, M2);
      ctx.drawImage(mid, 0, 0, M2, M2, x, y, CELL, CELL);
    } else ctx.drawImage(renderer.domElement, 0, 0, S, S, x, y, CELL, CELL);
  }

  /** 시트 전체. 돌려주는 값: { png: dataURL, k: 배율, ms } */
  B.ship = function (spec) {
    var t0 = performance.now(), rig = new Rig(spec), fit = rig.fit();
    var at = document.createElement('canvas'); at.width = CELL * COLS; at.height = CELL * DIRS * 2;
    var ctx = at.getContext('2d');
    Object.keys(ACTIONS).forEach(function (a) {
      var sp = ACTIONS[a];
      for (var d = 0; d < DIRS; d++) for (var f = 0; f < sp.frames; f++) {
        rig.pose(a, d, f); renderer.render(scene, cam);
        drawCell(ctx, (sp.col + f) * CELL, (sp.row + d) * CELL);
      }
    });
    rig.dispose();
    return { png: at.toDataURL('image/png'), k: fit.k, box: fit.box, ms: Math.round(performance.now() - t0) };
  };

  /** 미리보기: 몇 장면만(같은 맞춤 배율로). list = [[action, dir, frame], ...] */
  B.preview = function (spec, list, scale) {
    var rig = new Rig(spec), fit = rig.fit(), out = [], sc = scale || 1;
    list.forEach(function (it) {
      rig.pose(it[0], it[1], it[2]); renderer.render(scene, cam);
      var c = document.createElement('canvas'); c.width = CELL * sc; c.height = CELL * sc;
      var ctx = c.getContext('2d');
      if (sc === 1) drawCell(ctx, 0, 0);
      else { ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(renderer.domElement, 0, 0, CELL * SS, CELL * SS, 0, 0, CELL * sc, CELL * sc); }
      out.push(c.toDataURL('image/png'));
    });
    rig.dispose();
    return { k: fit.k, box: fit.box, frames: out };
  };
})(window);
