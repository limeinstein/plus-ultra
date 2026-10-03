/* 배 36종의 3D 모형. three.js(r147, 전역 THREE)로 선체·선루·돛대·돛·노·물결을 짓는다.
   좌표: x 앞(뱃머리 +), y 위, z 우현(+)·좌현(−). 1단위 = 시트의 1px(224px 칸).
   치수(L·W·H·돛대 자리·높이)는 tools/render_ship_sprites.py의 dims()·mast_positions()·mast_heights()를 그대로 받아
   게임의 배 크기(baseLen)·깃발 자리와 맞춘다. 재질은 docs/art/ship-galleon-upgrade-reference.png(Codex 갤리온 기준 시안):
   짙은 월넛 외판, 황동 테, 꿀빛 갑판, 아이보리 돛. */
(function (root) {
  'use strict';
  var M = root.Ship3D = {};
  var TX = root.Ship3DTex;
  var T;                         // THREE
  var PI = Math.PI;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // ───────────────────────────────── 선체 평면형
  // bow/stern: 수면 끝(L 비율) · half: 최대 반폭(W 비율) · bowHalf/sternHalf: 끝 반폭(사각 선수·선미판)
  // uf/ua: 평행 중앙부의 앞·뒤 끝(길이 비율 0~1) · pb,cb / ps,cs: 선수·선미 곡률 · sB/sS: 현호(H 비율)
  // w0·tm·wTop: 단면(수면 폭·최대폭 높이·뱃전 폭 — 1보다 작으면 텀블홈) · rakeB/rakeS: 높이 1당 앞·뒤로 기우는 양
  var FORMS = {
    needle: { bow: .53, stern: -.50, half: .50, bowHalf: 0, sternHalf: .20, uf: .70, ua: .22, pb: 1.5, cb: .9, ps: 2.0, cs: .6, sB: .45, sS: .70, w0: .90, tm: .55, wTop: .99, rakeB: .55, rakeS: .45 },
    canoe:  { bow: .50, stern: -.50, half: .50, bowHalf: 0, sternHalf: 0, uf: .66, ua: .34, pb: 1.6, cb: .9, ps: 1.6, cs: .9, sB: 1.6, sS: 1.6, w0: .86, tm: .6, wTop: 1.0, rakeB: 1.9, rakeS: 1.9 },
    fine:   { bow: .52, stern: -.47, half: .49, bowHalf: 0, sternHalf: .29, uf: .62, ua: .28, pb: 1.7, cb: .75, ps: 2.2, cs: .55, sB: .34, sS: .28, w0: .82, tm: .45, wTop: .86, rakeB: .62, rakeS: .14 },
    bluff:  { bow: .46, stern: -.46, half: .55, bowHalf: 0, sternHalf: .36, uf: .56, ua: .38, pb: 2.2, cb: .55, ps: 2.4, cs: .45, sB: .30, sS: .22, w0: .84, tm: .45, wTop: .92, rakeB: .75, rakeS: .35 },
    round:  { bow: .48, stern: -.47, half: .56, bowHalf: 0, sternHalf: .34, uf: .56, ua: .32, pb: 2.0, cb: .62, ps: 2.4, cs: .5, sB: .26, sS: .20, w0: .82, tm: .42, wTop: .82, rakeB: .62, rakeS: .16 },
    pear:   { bow: .50, stern: -.46, half: .57, bowHalf: 0, sternHalf: .30, uf: .50, ua: .30, pb: 2.0, cb: .6, ps: 2.0, cs: .6, sB: .22, sS: .26, w0: .86, tm: .36, wTop: .68, rakeB: .62, rakeS: .2 },
    dhow:   { bow: .48, stern: -.47, half: .50, bowHalf: 0, sternHalf: .28, uf: .60, ua: .26, pb: 1.6, cb: .8, ps: 2.2, cs: .55, sB: .60, sS: .38, w0: .86, tm: .5, wTop: .95, rakeB: 1.6, rakeS: .25 },
    jong:   { bow: .48, stern: -.49, half: .50, bowHalf: 0, sternHalf: .10, uf: .62, ua: .32, pb: 1.7, cb: .75, ps: 1.8, cs: .7, sB: .55, sS: .75, w0: .86, tm: .5, wTop: .97, rakeB: 1.15, rakeS: .95 },
    junk:   { bow: .49, stern: -.47, half: .50, bowHalf: .22, sternHalf: .42, uf: .62, ua: .24, pb: 1.8, cb: .6, ps: 3.0, cs: .4, sB: .40, sS: .80, w0: .84, tm: .6, wTop: 1.03, rakeB: .95, rakeS: .7 },
    sand:   { bow: .50, stern: -.48, half: .50, bowHalf: .30, sternHalf: .40, uf: .70, ua: .22, pb: 2.2, cb: .5, ps: 3.0, cs: .4, sB: .28, sS: .38, w0: .92, tm: .4, wTop: 1.0, rakeB: .85, rakeS: .45 },
    box:    { bow: .49, stern: -.47, half: .50, bowHalf: .26, sternHalf: .40, uf: .64, ua: .24, pb: 2.0, cb: .55, ps: 3.0, cs: .4, sB: .32, sS: .42, w0: .90, tm: .45, wTop: 1.0, rakeB: .65, rakeS: .35 },
    open:   { bow: .52, stern: -.47, half: .49, bowHalf: 0, sternHalf: .26, uf: .60, ua: .28, pb: 1.8, cb: .7, ps: 2.2, cs: .55, sB: .42, sS: .32, w0: .86, tm: .5, wTop: .95, rakeB: .62, rakeS: .22 }
  };

  // 문화권·선체별 목재 색 [그늘, 외판, 갑판] — render_ship_sprites.py의 PALETTES와 같은 계열
  var PAL = {
    west: ['#2a160b', '#5c3119', '#a2723f'], galley: ['#2e140b', '#64301a', '#a66d3a'], dhow: ['#33200f', '#744825', '#b4854b'],
    jong: ['#2c170d', '#5f321b', '#a06a3a'], outrigger: ['#3a2111', '#7b4e2a', '#b48a52'], junk: ['#2a150c', '#5a2e1a', '#9a6237'],
    kr: ['#33220f', '#6b4a2b', '#a27a4c'], panok: ['#2e1f14', '#634329', '#9c7146'], turtle: ['#28241b', '#544c37', '#8c7a50'],
    jp: ['#241a12', '#4d3826', '#8c6c4a'], atake: ['#1f1610', '#43301f', '#7d5c3e'], raft: ['#46301a', '#8c6334', '#b88d53']
  };
  var IVORY = '#f2e4c1', TAN = '#d2b986', MAT_TAN = '#b79a6a', BRASS = 0xc89038;

  // ───────────────────────────────── 재질(한 번 만들어 계속 쓴다)
  var MAT = {}, TEXC = {};
  function tex(key, fn, rx, ry) {
    var k = key + '|' + rx + '|' + ry;
    if (TEXC[k]) return TEXC[k];
    var c = fn(), t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping; t.encoding = T.sRGBEncoding; t.anisotropy = 8;
    if (rx) t.repeat.set(rx, ry || rx);
    return (TEXC[k] = t);
  }
  function std(key, o) {
    if (MAT[key]) return MAT[key];
    var m = new T.MeshStandardMaterial(Object.assign({ roughness: 0.78, metalness: 0, side: T.DoubleSide }, o));
    return (MAT[key] = m);
  }
  function phong(key, o) {
    if (MAT[key]) return MAT[key];
    return (MAT[key] = new T.MeshPhongMaterial(Object.assign({ side: T.DoubleSide }, o)));
  }
  function mats(hullType, clinker) {
    var p = PAL[hullType] || PAL.west, key = hullType + (clinker ? 'C' : '');
    return {
      hull: std('hull' + key, { map: tex('hull' + key, function () { return TX.planks({ color: p[1], seam: p[0], rows: 16, seed: 3 + key.length, clinker: clinker, seamW: clinker ? 3.2 : 2.4 }); }) }),
      deck: std('deck' + key, { map: tex('deck' + key, function () { return TX.planks({ color: p[2], seam: p[0], rows: 14, seed: 5, minLen: 220, varLen: 200, seamA: 0.55, seamW: 1.6 }); }), roughness: 0.86 }),
      inner: std('inner' + key, { map: tex('inner' + key, function () { return TX.planks({ color: mix(p[1], p[2], 0.55), seam: p[0], rows: 16, seed: 9, nails: false, seamA: 0.6 }); }) }),
      dark: std('dark' + key, { color: new T.Color(p[0]).convertSRGBToLinear(), roughness: 0.7 }),
      mid: std('mid' + key, { color: new T.Color(p[1]).convertSRGBToLinear(), roughness: 0.72 }),
      deckc: std('deckc' + key, { color: new T.Color(p[2]).convertSRGBToLinear(), roughness: 0.8 }),
      pal: p
    };
  }
  function mix(a, b, t) {
    var A = TX.hex(a), B = TX.hex(b), o = '#';
    for (var i = 0; i < 3; i++) { var v = Math.round(lerp(A[i], B[i], t)); o += (v < 16 ? '0' : '') + v.toString(16); }
    return o;
  }
  function common() {
    return {
      brass: phong('brass', { color: new T.Color(BRASS).convertSRGBToLinear(), specular: 0xffe6a8, shininess: 46, emissive: new T.Color(0x3a2408).convertSRGBToLinear() }),
      brassHi: phong('brassHi', { color: new T.Color(0xf0c46c).convertSRGBToLinear(), specular: 0xfff2c8, shininess: 60, emissive: new T.Color(0x4a3010).convertSRGBToLinear() }),
      iron: phong('iron', { color: new T.Color(0x26262a).convertSRGBToLinear(), specular: 0x777777, shininess: 30 }),
      glass: phong('glass', { color: new T.Color(0x1a2330).convertSRGBToLinear(), specular: 0x9fb8d0, shininess: 80, emissive: new T.Color(0x0a0f18).convertSRGBToLinear() }),
      hole: std('hole', { color: 0x070403, roughness: 1 }),
      mast: std('mast', { color: new T.Color('#4a2a15').convertSRGBToLinear(), roughness: 0.6 }),
      spar: std('spar', { color: new T.Color('#3d2212').convertSRGBToLinear(), roughness: 0.62 }),
      rope: std('rope', { color: new T.Color('#3b2a18').convertSRGBToLinear(), roughness: 0.9 }),
      oar: std('oar', { color: new T.Color('#b98a52').convertSRGBToLinear(), roughness: 0.75 }),
      bamboo: std('bamboo', { color: new T.Color('#b39a5c').convertSRGBToLinear(), roughness: 0.7 }),
      batten: std('batten', { color: new T.Color('#5a3a1e').convertSRGBToLinear(), roughness: 0.7 }),
      red: std('red', { color: new T.Color('#7e2a1c').convertSRGBToLinear(), roughness: 0.65 }),
      white: std('white', { color: new T.Color('#e9e1cf').convertSRGBToLinear(), roughness: 0.85 }),
      roof: std('roof', { map: tex('roof', function () { return TX.roof({}); }), roughness: 0.7 }),
      thatch: std('thatch', { map: tex('thatch', function () { return TX.thatch({}); }), roughness: 0.95 }),
      plates: std('plates', { map: tex('plates', function () { return TX.plates({ color: '#55574a' }); }, 2, 1.2), roughness: 0.5, metalness: 0.2 }),
      wallJ: std('wallJ', { map: tex('wallJ', function () { return TX.wall({ color: '#3e2a1b', holes: 6 }); }), roughness: 0.8 }),
      wallK: std('wallK', { map: tex('wallK', function () { return TX.wall({ color: '#5a3d24', holes: 5, seed: 41 }); }), roughness: 0.8 }),
      spike: phong('spike', { color: new T.Color(0x8a8a86).convertSRGBToLinear(), specular: 0xdddddd, shininess: 50 }),
      log: std('log', { color: new T.Color('#9b7342').convertSRGBToLinear(), roughness: 0.85 }),
      foam: new T.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: T.DoubleSide })
    };
  }
  function sailMat(kind, color) {
    var key = 'sail' + kind + color;
    if (MAT[key]) return MAT[key];
    var t = tex(key, function () { return TX.sail({ kind: kind, color: color, cloths: kind === 'jp' ? 7 : kind === 'lat' ? 10 : 9, bands: 6 }); });
    return (MAT[key] = new T.MeshStandardMaterial({ map: t, roughness: 0.92, metalness: 0, side: T.DoubleSide, emissive: new T.Color(0x14100a).convertSRGBToLinear() }));
  }

  // ───────────────────────────────── 기하 도우미
  function geo(pos, uv, idx) {
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    if (uv) g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  /* (ni+1)×(nj+1) 격자. fn(i,j) → [x,y,z,u,v]. flip이면 면 방향을 뒤집는다 */
  function grid(ni, nj, fn, flip) {
    var pos = [], uv = [], idx = [];
    for (var j = 0; j <= nj; j++) for (var i = 0; i <= ni; i++) { var p = fn(i, j); pos.push(p[0], p[1], p[2]); uv.push(p[3], p[4]); }
    var w = ni + 1;
    for (var jj = 0; jj < nj; jj++) for (var ii = 0; ii < ni; ii++) {
      var a = jj * w + ii, b = a + 1, c = a + w, d = c + 1;
      if (flip) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
    }
    return geo(pos, uv, idx);
  }
  function mesh(g, m, shadow) { var o = new T.Mesh(g, m); o.castShadow = shadow !== false; o.receiveShadow = true; return o; }
  /* 두 점을 잇는 원기둥(돛대·활대·밧줄·노) */
  var UP = null;
  function rod(a, b, r0, r1, m, seg) {
    var A = new T.Vector3(a[0], a[1], a[2]), B = new T.Vector3(b[0], b[1], b[2]), d = B.clone().sub(A), len = d.length();
    var g = new T.CylinderGeometry(r1 == null ? r0 : r1, r0, len, seg || 8, 1, false);
    var o = new T.Mesh(g, m); o.castShadow = true; o.receiveShadow = true;
    o.position.copy(A).addScaledVector(d, 0.5);
    if (!UP) UP = new T.Vector3(0, 1, 0);
    o.quaternion.setFromUnitVectors(UP, d.normalize());
    return o;
  }
  function box(w, h, d, m, x, y, z) { var o = mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o; }

  // ───────────────────────────────── 선체
  function Hull(s) {
    var q = s.p, f = FORMS[q.form] || FORMS.open;
    this.s = s; this.q = q; this.f = f;
    this.L = s.L; this.W = s.W;
    var hk = s.hull === 'west' ? 1.18 : s.hull === 'galley' ? 1.12 : 1.1;
    this.H = s.H * hk;
    this.B = f.half * s.W;
    this.xb0 = f.bow * s.L; this.xs0 = f.stern * s.L;
    // 이물이 셀 밖으로 나가지 않게 기울기를 줄인다(뱃전 높이에서 L의 0.60 안)
    var top = this.H * (1 + f.sB);
    this.rB = Math.min(f.rakeB, Math.max(0, (0.60 * s.L - this.xb0) / top));
    this.rS = Math.min(f.rakeS, Math.max(0, (-0.55 * s.L - this.xs0) / -(this.H * (1 + f.sS))));
    this.bul = clamp(this.H * 0.17, 1.0, 3.4);       // 뱃전 판 높이
    this.th = clamp(this.W * 0.035, 0.7, 1.6);        // 판 두께
  }
  Hull.prototype.ends = function (y) { return [this.xs0 - this.rS * y, this.xb0 + this.rB * y]; };
  Hull.prototype.X = function (u, y) { var e = this.ends(y); return lerp(e[0], e[1], u); };
  Hull.prototype.U = function (x, y) { var e = this.ends(y); return clamp((x - e[0]) / (e[1] - e[0]), 0, 1); };
  Hull.prototype.sheer = function (u) {
    var f = this.f, kb = clamp((u - 0.62) / 0.38, 0, 1), ks = clamp((0.36 - u) / 0.36, 0, 1);
    return this.H * (1 + f.sB * kb * kb + f.sS * ks * ks);
  };
  Hull.prototype.plan = function (u) {
    var f = this.f, B = this.B, W = this.W, b;
    if (u >= f.uf) { var t = (u - f.uf) / (1 - f.uf); b = f.bowHalf * W + (B - f.bowHalf * W) * Math.pow(Math.max(0, 1 - Math.pow(t, f.pb)), f.cb); }
    else if (u <= f.ua) { var t2 = (f.ua - u) / f.ua; b = f.sternHalf * W + (B - f.sternHalf * W) * Math.pow(Math.max(0, 1 - Math.pow(t2, f.ps)), f.cs); }
    else b = B;
    return b;
  };
  Hull.prototype.g = function (tau) {
    var f = this.f;
    if (tau <= f.tm) return f.w0 + (1 - f.w0) * Math.sin(PI / 2 * tau / f.tm);
    if (tau <= 1) { var k = (tau - f.tm) / (1 - f.tm); return 1 + (f.wTop - 1) * (1 - Math.cos(PI * k)) / 2; }
    return f.wTop + (f.wTop - 1) * 0.35 * (tau - 1);
  };
  Hull.prototype.half = function (u, y) { return this.plan(u) * this.g(y / this.H); };
  Hull.prototype.deckY = function (u) { return this.sheer(u) - this.bul; };
  Hull.prototype.us = function (n) {   // 끝으로 갈수록 촘촘한 길이 방향 자리
    var o = []; for (var i = 0; i <= n; i++) { var t = i / n; o.push(0.5 - 0.5 * Math.cos(PI * t)); } return o;
  };

  /* 선체 껍질: 바깥 옆면(수면~뱃전), 선미·선수판, 갑판, 안쪽 뱃전, 난간 덮개.
     같은 함수로 선루(성루)도 짓는다: uA~uB 구간, 아래 y0(u)·위 y1(u), 폭 배수 inset */
  function shell(h, grp, M, o) {
    var uA = o.uA, uB = o.uB, y0 = o.y0, y1 = o.y1, inset = o.inset || 1, n = o.n || 40, nj = o.nj || 8;
    var us = []; for (var i = 0; i <= n; i++) { var t = i / n; us.push(lerp(uA, uB, o.even ? t : 0.5 - 0.5 * Math.cos(PI * t))); }
    var bul = o.bul == null ? h.bul : o.bul, th = h.th;
    function hw(u, y) { return Math.max(0, h.half(u, y) * inset); }
    [1, -1].forEach(function (side) {
      grp.add(mesh(grid(n, nj, function (i, j) {
        var u = us[i], ya = y0(u), yb = y1(u), y = lerp(ya, yb, j / nj), x = h.X(u, y);
        return [x, y, side * hw(u, y), x / 80, y / 25.6];
      }, side < 0), o.side || M.hull));
      if (o.top !== false) {
        // 안쪽 뱃전 벽
        grp.add(mesh(grid(n, 1, function (i, j) {
          var u = us[i], yt = y1(u), y = j ? yt : yt - bul, x = h.X(u, yt);
          return [x, y, side * Math.max(0, hw(u, yt) - th), x / 80, y / 25.6];
        }, side > 0), M.inner));
        // 난간 덮개
        grp.add(mesh(grid(n, 1, function (i, j) {
          var u = us[i], yt = y1(u), x = h.X(u, yt), w = hw(u, yt);
          return [x, yt, side * (j ? w + 0.1 : Math.max(0, w - th)), x / 40, j];
        }, side > 0), o.rail || M.dark));
      }
    });
    if (o.top !== false) {
      // 갑판
      grp.add(mesh(grid(n, 1, function (i, j) {
        var u = us[i], yt = y1(u), y = yt - bul, x = h.X(u, yt), w = Math.max(0, hw(u, yt) - th);
        return [x, y, j ? w : -w, x / 80, (j ? w : -w) / 25.6];
      }), o.deck || M.deck));
    }
    // 끝판(선미판·사각 선수판·선루 앞벽)
    function endWall(u, faceFwd, yA, yB, m, inner) {
      var nk = 6;
      grp.add(mesh(grid(nk, 4, function (i, j) {
        var y = lerp(yA, yB, j / 4), x = h.X(u, y) + (inner ? (faceFwd ? -0.01 : 0.01) : 0), w = hw(u, y) - (inner ? th : 0);
        var z = lerp(-w, w, i / nk);
        return [x, y, z, z / 25.6, y / 25.6];
      }, faceFwd), m || M.hull));
    }
    var hasBack = o.backWall != null ? o.backWall : (h.plan(uA) > 0.4);
    var hasFront = o.frontWall != null ? o.frontWall : (h.plan(uB) > 0.4);
    if (hasBack) endWall(uA, false, y0(uA), y1(uA), o.backMat);
    if (hasFront) endWall(uB, true, y0(uB), y1(uB), o.frontMat);
    return us;
  }

  /* 띠(외판의 굵은 띠·황동 테): 높이 y(u)를 따라 바깥에 덧댄 띠 */
  function band(h, grp, m, uA, uB, yf, hh, out, inset) {
    var n = 36;
    [1, -1].forEach(function (side) {
      grp.add(mesh(grid(n, 1, function (i, j) {
        var u = lerp(uA, uB, i / n), yc = yf(u), y = yc + (j ? hh : -hh), x = h.X(u, yc);
        return [x, y, side * (h.half(u, yc) * (inset || 1) + out), x / 40, j];
      }, side < 0), m, false));
    });
  }

  /* 창(황동 테·어두운 유리) — 법선 nx,nz 쪽을 바라본다 */
  function windowAt(grp, C, x, y, z, w, hgt, rotY) {
    var g = new T.Group();
    g.add(box(w + 0.9, hgt + 0.9, 0.35, C.brass, 0, 0, 0));
    g.add(box(w, hgt, 0.5, C.glass, 0, 0, 0.12));
    g.position.set(x, y, z); g.rotation.y = rotY; grp.add(g);
  }
  /* 포문과 포신 */
  function gunPort(grp, C, h, u, side, size) {
    var y = h.sheer(u) * 0.5, x = h.X(u, y), z = side * (h.half(u, y) + 0.1);
    var g = new T.Group();
    g.add(box(size * 1.35, size * 1.25, 0.4, C.brass, 0, 0, 0));
    g.add(box(size, size * 0.9, 0.55, C.hole, 0, 0, 0.08));
    var barrel = rod([0, 0, 0], [0, 0, size * 1.1], size * 0.26, size * 0.22, C.iron, 7);
    g.add(barrel);
    g.position.set(x, y, z); if (side < 0) g.rotation.y = PI; grp.add(g);
  }

  // ───────────────────────────────── 배 한 척
  function Ship(s) {
    this.s = s; this.q = s.p; this.h = new Hull(s);
    this.M = mats(s.hull, !!this.q.clinker); this.C = common();
    this.big = s.cap >= 250;
  }
  M.Ship = Ship;

  Ship.prototype.buildHull = function () {
    var s = this.s, q = this.q, h = this.h, M = this.M, C = this.C, grp = new T.Group(), self = this;
    if (s.hull === 'raft') return this.buildRaft(grp);
    shell(h, grp, M, { uA: 0, uB: 1, y0: function () { return 0; }, y1: function (u) { return h.sheer(u); }, n: 44, nj: 10 });

    // 외판 띠와 황동 테
    var west = s.hull === 'west', gal = s.hull === 'galley';
    if (west || gal || s.hull === 'dhow') {
      var wales = gal ? [0.72] : this.big ? [0.36, 0.66] : [0.58];
      wales.forEach(function (tw) {
        band(h, grp, M.dark, 0.03, 0.97, function (u) { return h.sheer(u) * tw; }, 0.75, 0.32);
        band(h, grp, C.brass, 0.04, 0.96, function (u) { return h.sheer(u) * tw + 1.15; }, 0.22, 0.42);
      });
      band(h, grp, C.brass, 0.02, 0.98, function (u) { return h.sheer(u) - 0.55; }, 0.2, 0.18);
    } else if (s.hull === 'junk' || s.hull === 'jong') {
      band(h, grp, C.red, 0.02, 0.98, function (u) { return h.sheer(u) * 0.78; }, 0.7, 0.3);
      band(h, grp, M.dark, 0.02, 0.98, function (u) { return h.sheer(u) * 0.45; }, 0.6, 0.3);
    } else {
      band(h, grp, M.dark, 0.02, 0.98, function (u) { return h.sheer(u) * 0.7; }, 0.6, 0.3);
    }

    // 문화권별 상부구조
    var fn = this['up_' + s.hull]; if (fn) fn.call(this, grp);
    // 포문
    var guns = q.guns || 0;
    if (guns && (west || gal || s.hull === 'dhow' || s.hull === 'junk' || s.hull === 'jong')) {
      var sz = clamp(h.H * 0.17, 1.6, 2.7);
      for (var k = 0; k < guns; k++) {
        var x = -s.L * 0.22 + k * (s.L * 0.48 / Math.max(1, guns - 1)), u = h.U(x, h.H * 0.5);
        gunPort(grp, C, h, u, 1, sz); gunPort(grp, C, h, u, -1, sz);
      }
    }
    // 이물 장식: 갤리 충각, 갤리온 부리, 다우의 긴 이물
    var bow = q.bow, yb = h.sheer(1);
    if (bow === 'ram') {
      var xr = h.X(1, h.H * 0.3);
      grp.add(rod([xr - 2, h.H * 0.32, 0], [Math.min(xr + s.L * 0.09, s.L * 0.62), h.H * 0.22, 0], 1.0, 0.35, M.dark, 6));
      grp.add(rod([xr - 3, h.H * 0.32, 0], [Math.min(xr + s.L * 0.08, s.L * 0.61), h.H * 0.24, 0], 0.5, 0.2, C.brass, 6));
    } else if (bow === 'beak') {
      var xk = h.X(0.985, yb * 0.7);
      var beak = new T.Shape(); beak.moveTo(0, -h.W * 0.15); beak.lineTo(s.L * 0.075, 0); beak.lineTo(0, h.W * 0.15); beak.closePath();
      var bg = new T.ExtrudeGeometry(beak, { depth: 1.2, bevelEnabled: false }); bg.rotateX(PI / 2);
      var bm = mesh(bg, M.mid); bm.position.set(xk - 1, yb * 0.72 + 1.2, 0); grp.add(bm);
      grp.add(rod([xk - 1, yb * 0.6, 0], [xk + s.L * 0.075, yb * 0.7, 0], 0.7, 0.4, M.dark, 6));
    }
    // 이물 돛대(바우스프릿)
    if (west && s.id !== 'barca' && s.id !== 'cog') {
      var x0 = h.X(0.93, yb), x1 = Math.min(s.L * 0.66, h.X(1, yb) + s.L * 0.13);
      this.sprit = { a: [x0, yb + 0.5, 0], b: [x1, yb + (x1 - x0) * 0.42, 0] };
      grp.add(rod(this.sprit.a, this.sprit.b, 0.95, 0.5, C.spar, 7));
    } else if (s.hull === 'galley' && s.id !== 'fusta') {
      var x2 = h.X(0.96, yb), x3 = Math.min(s.L * 0.64, x2 + s.L * 0.08);
      this.sprit = { a: [x2, yb + 0.3, 0], b: [x3, yb + (x3 - x2) * 0.32, 0] };
      grp.add(rod(this.sprit.a, this.sprit.b, 0.7, 0.4, C.spar, 6));
    }
    // 갤리의 노받이 틀(아포스티스)
    if (s.hull === 'galley' || q.oars) {
      var ap = s.hull === 'galley' ? h.W * 0.1 : 0;
      this.apost = ap;
      if (ap > 0) [1, -1].forEach(function (side) {
        var xa = -s.L * 0.36, xb2 = s.L * 0.34, ua = h.U(xa, h.H), ub = h.U(xb2, h.H);
        grp.add(rod([xa, h.sheer(ua) - 0.3, side * (h.half(ua, h.sheer(ua)) + ap)], [xb2, h.sheer(ub) - 0.3, side * (h.half(ub, h.sheer(ub)) + ap)], 0.55, 0.55, M.dark, 6));
        for (var k2 = 0; k2 < 5; k2++) {
          var xx = lerp(xa, xb2, k2 / 4), uu = h.U(xx, h.H), ys = h.sheer(uu) - 0.4, hw = h.half(uu, ys);
          grp.add(rod([xx, ys, side * hw], [xx, ys, side * (hw + ap)], 0.35, 0.35, M.dark, 5));
        }
      });
    }
    if (q.outrigger) this.outriggers(grp);
    return grp;
  };

  /* 갑판 위 성루(선루) */
  Ship.prototype.castle = function (grp, uA, uB, hc, o) {
    var h = this.h, M = this.M; o = o || {};
    var base = o.base || function (u) { return h.sheer(u); };
    var us = shell(h, grp, M, {
      uA: uA, uB: uB, y0: function (u) { return base(u) - h.bul - 0.2; }, y1: function (u) { return base(u) + hc; },
      inset: o.inset || 0.985, n: 18, nj: 3, bul: clamp(hc * 0.22, 0.9, 2.4), backWall: o.backWall, frontWall: o.frontWall,
      side: o.side, deck: o.deck, rail: o.rail
    });
    // 성루 위 황동 테
    band(h, grp, this.C.brass, uA + 0.005, uB - 0.005, function (u) { return base(u) + hc - 0.6; }, 0.2, 0.15, o.inset || 0.985);
    return us;
  };

  Ship.prototype.up_west = function (grp) {
    var s = this.s, q = this.q, h = this.h, C = this.C, self = this, big = this.big, id = s.id;
    var stern = q.stern, bow = q.bow;
    // 선미루
    if (stern && stern !== 'open') {
      var uq = { quarter: 0.20, castle: 0.22, high: 0.27, tower: 0.30, gallery: 0.33, round: 0.24 }[stern] || 0.22;
      var h1 = { quarter: 0.55, castle: 0.75, high: 0.8, tower: 0.85, gallery: 0.62, round: 0.55 }[stern] * h.H;
      if (id === 'cog' || id === 'hulk') h1 = h.H * 0.7;
      this.castle(grp, 0, uq, h1, { inset: stern === 'round' ? 0.86 : 0.98 });
      var top1 = function (u) { return h.sheer(u) + h1; };
      if (stern === 'high' || stern === 'tower' || stern === 'gallery') {
        var uq2 = uq * (stern === 'tower' ? 0.66 : 0.58), h2 = h.H * (stern === 'tower' ? 0.72 : stern === 'gallery' ? 0.48 : 0.55);
        this.castle(grp, 0, uq2, h2, { base: top1, inset: 0.95 });
        if (stern === 'tower') {
          var top2 = function (u) { return top1(u) + h2; };
          this.castle(grp, 0, uq2 * 0.62, h.H * 0.45, { base: top2, inset: 0.9 });
        }
      }
      // 선미 창과 회랑
      var ys = h.sheer(0) + h1 * 0.55, xs = h.X(0, ys) - 0.25, ws = h.half(0.002, ys) * 0.98;
      var nw = Math.max(2, Math.round(ws / 4.2));
      for (var k = 0; k < nw; k++) windowAt(grp, C, xs, ys, lerp(-ws * 0.7, ws * 0.7, nw > 1 ? k / (nw - 1) : 0.5), 2.2, 2.6, -PI / 2);
      if (stern === 'gallery') {
        var yg = ys - 2.2;
        grp.add(box(1.8, 0.6, ws * 2.05, C.brass, xs - 0.9, yg, 0));
        grp.add(box(1.5, 0.35, ws * 2.05, this.M.dark, xs - 0.75, yg + 2.8, 0));
        // 옆 회랑(쿼터 갤러리)
        [1, -1].forEach(function (side) {
          var uu = uq * 0.45, yq = h.sheer(uu) + h1 * 0.4, xq = h.X(uu, yq), zq = side * (h.half(uu, yq) * 0.98 + 0.9);
          grp.add(box(5.5, h1 * 0.55, 1.6, self.M.mid, xq, yq, zq));
          windowAt(grp, C, xq, yq, zq + side * 0.85, 1.6, 1.8, side > 0 ? 0 : PI);
        });
      }
      // 옆 창(작은 배는 하나)
      [1, -1].forEach(function (side) {
        var n2 = big ? 3 : 2;
        for (var j = 0; j < n2; j++) {
          var uu = uq * (0.25 + j * 0.25), yw = h.sheer(uu) + h1 * 0.5, xw = h.X(uu, yw), zw = side * (h.half(uu, yw) * 0.98 + 0.12);
          windowAt(grp, C, xw, yw, zw, 1.5, 1.8, side > 0 ? 0 : PI);
        }
      });
    }
    // 이물루
    if (bow === 'castle') {
      var hf = h.H * (big ? 0.72 : 0.55);
      this.castle(grp, 0.80, 1.0, hf, { inset: 0.98, frontWall: false });
      if (id === 'hcarrack' || id === 'lcarrack') this.castle(grp, 0.86, 1.0, h.H * 0.38, { base: function (u) { return h.sheer(u) + hf; }, inset: 0.92, frontWall: false });
    } else if (bow === 'beak' && big) {
      this.castle(grp, 0.76, 0.93, h.H * 0.42, { inset: 0.96 });
    } else if (bow === 'round') {
      this.castle(grp, 0.82, 1.0, h.H * 0.3, { inset: 0.96, frontWall: false });
    }
    // 승강구·캡스턴 등 갑판 소품
    var xm = -s.L * 0.05, um = h.U(xm, h.H), yd = h.deckY(um);
    grp.add(box(s.L * 0.08, 0.9, h.half(um, h.H) * 0.55, this.M.dark, xm, yd + 0.45, 0));
    if (big) grp.add(rod([-s.L * 0.16, yd, 0], [-s.L * 0.16, yd + 2.6, 0], 1.3, 1.1, this.M.mid, 10));
    if (id === 'barca' || id === 'pinnace' || id === 'caravel' || id === 'tartane') {
      // 키(선미 방향타)
      var x0 = h.X(0, h.H * 0.6);
      grp.add(rod([x0 - 0.5, h.sheer(0) + 1, 0], [x0 - 3.2, 0.4, 0], 0.8, 1.4, this.M.dark, 6));
    }
  };

  Ship.prototype.up_galley = function (grp) {
    var s = this.s, q = this.q, h = this.h, C = this.C, M = this.M, id = s.id;
    // 고물 차양(갤리의 선미 캐노피) 또는 성루
    if (q.stern === 'castle') {
      this.castle(grp, 0, 0.17, h.H * (id === 'galleass' ? 0.9 : 0.75), { inset: 0.96 });
      var ys = h.sheer(0) + h.H * 0.45, xs = h.X(0, ys) - 0.2, ws = h.half(0.004, ys) * 0.9;
      for (var k = 0; k < 3; k++) windowAt(grp, C, xs, ys, lerp(-ws * 0.6, ws * 0.6, k / 2), 2, 2.2, -PI / 2);
    } else if (q.stern === 'quarter') {
      // 아치형 차양
      var ua = 0.03, ub = 0.17, n = 10;
      var g2 = grid(n, 8, function (i, j) {
        var u = lerp(ua, ub, i / n), yd = h.deckY(u), x = h.X(u, yd), w = h.half(u, h.sheer(u)) * 0.92, a = PI * j / 8;
        return [x, yd + 1 + Math.sin(a) * w * 0.55 + 2.2, -Math.cos(a) * w, i / n, j / 8];
      });
      var cm = mesh(g2, C.red); cm.material = C.red; grp.add(cm);
    }
    if (id === 'galleass') this.castle(grp, 0.82, 1.0, h.H * 0.7, { inset: 0.96, frontWall: false });
    // 노꾼 의자(갑판 가로대)와 중앙 통로
    var xa = -s.L * 0.3, xb = s.L * 0.3;
    for (var k2 = 0; k2 < 9; k2++) {
      var x = lerp(xa, xb, k2 / 8), u = h.U(x, h.H), yd = h.deckY(u), w = h.half(u, h.sheer(u)) - h.th;
      grp.add(box(0.8, 0.5, w * 1.9, M.dark, x, yd + 0.3, 0));
    }
    var ux = h.U(0, h.H);
    grp.add(box(s.L * 0.62, 0.8, h.W * 0.13, M.mid, 0, h.deckY(ux) + 0.6, 0));
  };

  Ship.prototype.up_dhow = function (grp) {
    var s = this.s, q = this.q, h = this.h, C = this.C, id = s.id;
    if (q.stern !== 'open') {
      var hc = h.H * (id === 'baghlah' ? 0.95 : 0.6);
      this.castle(grp, 0, 0.24, hc, { inset: 0.97 });
      // 다우·바글라의 장식 선미판
      var ys = h.sheer(0) + hc * 0.5, xs = h.X(0, ys) - 0.25, ws = h.half(0.002, ys) * 0.95;
      var nwin = id === 'baghlah' ? 4 : 2;
      for (var k = 0; k < nwin; k++) windowAt(grp, C, xs, ys, lerp(-ws * 0.6, ws * 0.6, nwin > 1 ? k / (nwin - 1) : 0.5), 1.8, 2.4, -PI / 2);
      if (id === 'baghlah') grp.add(box(0.5, hc * 0.35, ws * 1.7, C.brass, xs - 0.2, ys + hc * 0.32, 0));
    }
    // 긴 이물 끝 기둥
    var y1 = h.sheer(1), x1 = h.X(1, y1);
    grp.add(rod([x1 - 1, y1 - 1, 0], [x1 + 1.2, y1 + 3.2, 0], 0.8, 0.5, this.M.dark, 6));
    if (id === 'sambuk') {   // 삼부크의 낮은 선미 난간
      var u0 = 0.06;
      grp.add(box(4, 1.2, h.half(u0, h.H) * 1.8, this.M.mid, h.X(u0, h.H), h.sheer(u0) + 0.6, 0));
    }
  };

  Ship.prototype.up_jong = function (grp) {
    var h = this.h, C = this.C, M = this.M, s = this.s;
    var hc = h.H * 0.8;
    this.castle(grp, 0.02, 0.27, hc, { inset: 0.94 });
    // 선미 집 지붕
    this.roofHouse(grp, h.X(0.04, h.H), h.X(0.25, h.H), h.half(0.15, h.H) * 0.78, h.sheer(0.15) + hc, h.H * 0.35, C.thatch, 0.18);
    // 이물 갑판집
    var x0 = s.L * 0.16, x1 = s.L * 0.32, u = h.U((x0 + x1) / 2, h.H);
    this.roofHouse(grp, x0, x1, h.half(u, h.H) * 0.55, h.deckY(u), h.H * 0.45, C.thatch, 0.25);
  };

  Ship.prototype.up_outrigger = function (grp) {
    var s = this.s, h = this.h, C = this.C;
    // 코라코라의 무사 대(가운데 높은 단)와 야자잎 지붕
    var x0 = -s.L * 0.24, x1 = s.L * 0.18, u = h.U(0, h.H), yd = h.deckY(u);
    grp.add(box(x1 - x0, 0.7, h.half(u, h.H) * 2.9, this.M.deckc, (x0 + x1) / 2, h.sheer(u) + 0.6, 0));
    this.roofHouse(grp, -s.L * 0.12, s.L * 0.06, h.half(u, h.H) * 1.3, h.sheer(u) + 0.9, 4.2, C.thatch, 0.3);
  };

  Ship.prototype.up_junk = function (grp) {
    var s = this.s, q = this.q, h = this.h, C = this.C, M = this.M, id = s.id, big = this.big;
    var hc = h.H * (q.stern === 'tower' ? 0.95 : q.stern === 'high' ? 0.8 : 0.6);
    this.castle(grp, 0, 0.26, hc, { inset: 1.0 });
    var top1 = function (u) { return h.sheer(u) + hc; };
    if (q.stern === 'tower') {
      this.castle(grp, 0, 0.17, h.H * 0.6, { base: top1, inset: 0.96 });
      this.roofHouse(grp, h.X(0.02, h.H), h.X(0.15, h.H), h.half(0.08, h.H) * 0.8, top1(0.08) + h.H * 0.6, h.H * 0.45, C.roof, 0.3);
    } else if (q.stern === 'high') {
      this.roofHouse(grp, h.X(0.04, h.H), h.X(0.2, h.H), h.half(0.1, h.H) * 0.78, top1(0.1), h.H * 0.5, C.roof, 0.25);
    }
    // 선미판의 붉은 테와 창
    var ys = h.sheer(0) + hc * 0.5, xs = h.X(0, ys) - 0.3, ws = h.half(0.002, ys);
    grp.add(box(0.5, hc * 0.7, ws * 1.6, C.red, xs, ys, 0));
    windowAt(grp, C, xs - 0.3, ys, 0, 2.2, 2.2, -PI / 2);
    // 키(높이 올린 큰 방향타)
    grp.add(box(2.6, h.sheer(0) * 0.8, 0.5, M.mid, xs - 1.2, h.sheer(0) * 0.45 + 0.6, 0));
    if (big) {
      var xm = -s.L * 0.02, um = h.U(xm, h.H);
      this.roofHouse(grp, xm - s.L * 0.08, xm + s.L * 0.08, h.half(um, h.H) * 0.62, h.deckY(um), h.H * (id === 'baochuan' ? 0.75 : 0.5), C.roof, 0.2);
    }
    if (id === 'shachuan') {
      var xb = s.L * 0.3, ub = h.U(xb, h.H);
      grp.add(box(s.L * 0.1, 1.6, h.half(ub, h.H) * 1.4, M.mid, xb, h.deckY(ub) + 0.8, 0));
    }
  };

  Ship.prototype.up_kr = function (grp) {   // 맹선: 낮은 판옥 없는 전선
    var s = this.s, h = this.h, C = this.C;
    var x0 = -s.L * 0.4, x1 = -s.L * 0.2, u = h.U((x0 + x1) / 2, h.H);
    this.roofHouse(grp, x0, x1, h.half(u, h.H) * 0.7, h.deckY(u), h.H * 0.75, C.roof, 0.25, C.wallK);
  };

  Ship.prototype.up_panok = function (grp) {
    var s = this.s, h = this.h, C = this.C, M = this.M;
    // 판옥: 뱃전 위로 넓게 덮은 윗갑판과 방패벽(총안)
    var ua = 0.04, ub = 0.92, hu = h.H * 0.95, ext = 1.08;
    var base = function (u) { return h.sheer(u); };
    var us = shell(h, grp, M, {
      uA: ua, uB: ub, y0: function (u) { return base(u) - h.bul; }, y1: function (u) { return base(u) + hu; },
      inset: ext, n: 22, nj: 3, side: C.wallK, bul: h.H * 0.4, backWall: true, frontWall: true, backMat: C.wallK, frontMat: C.wallK
    });
    // 장대(지휘 누각)
    var x0 = -s.L * 0.12, x1 = s.L * 0.06, u = h.U(0, h.H);
    this.roofHouse(grp, x0, x1, h.half(u, h.H) * 0.55, h.sheer(u) + hu - h.H * 0.4, h.H * 0.75, C.roof, 0.28, C.wallK);
  };

  function TURTLE_HR(h, e) { return h.B * 0.62 * Math.pow(e, 0.45) + 0.8; }
  Ship.prototype.up_turtle = function (grp) {
    var s = this.s, h = this.h, C = this.C, M = this.M;
    // 낮은 방패벽 위에 거북 등 지붕
    var ua = 0.06, ub = 0.9, hw0 = 0.5;
    shell(h, grp, M, {
      uA: ua, uB: ub, y0: function (u) { return h.sheer(u) - h.bul; }, y1: function (u) { return h.sheer(u) + h.H * 0.38; },
      inset: 1.04, n: 22, nj: 2, side: C.wallK, top: false, backWall: true, frontWall: true, backMat: C.wallK, frontMat: C.wallK
    });
    var n = 26, nk = 12, wallTop = function (u) { return h.sheer(u) + h.H * 0.38; };
    var shellG = grid(n, nk, function (i, j) {
      var u = lerp(ua, ub, i / n), e = Math.sin(PI * (i / n)), y0 = wallTop(u), w = h.half(u, y0) * 1.04, a = PI * j / nk;
      var hr = TURTLE_HR(h, e), x = h.X(u, y0);
      return [x, y0 + Math.sin(a) * hr, -Math.cos(a) * w * (0.55 + 0.45 * Math.pow(e, 0.35)), i / n * 3, j / nk * 1.2];
    });
    grp.add(mesh(shellG, C.plates));
    // 쇠못(인스턴스)
    var spikes = [], cone = new T.ConeGeometry(0.42, 2.0, 5);
    for (var i = 2; i < n - 1; i += 1) for (var j = 2; j <= nk - 2; j += 2) {
      var u = lerp(ua, ub, i / n), e = Math.sin(PI * (i / n)), y0 = wallTop(u), w = h.half(u, y0) * 1.04, a = PI * j / nk;
      var hr = TURTLE_HR(h, e), x = h.X(u, y0), z = -Math.cos(a) * w * (0.55 + 0.45 * Math.pow(e, 0.35));
      var p = new T.Vector3(x, y0 + Math.sin(a) * hr, z), nrm = new T.Vector3(0, Math.sin(a), -Math.cos(a)).normalize();
      var m4 = new T.Matrix4(), qn = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), nrm);
      m4.compose(p.add(nrm.clone().multiplyScalar(0.6)), qn, new T.Vector3(1, 1, 1));
      spikes.push(m4);
    }
    var im = new T.InstancedMesh(cone, C.spike, spikes.length);
    spikes.forEach(function (m4, k) { im.setMatrixAt(k, m4); });
    im.castShadow = true; grp.add(im);
    // 등마루 띠
    grp.add(mesh(grid(n, 1, function (i, j) {
      var u = lerp(ua, ub, i / n), e = Math.sin(PI * (i / n)), y0 = wallTop(u), hr = TURTLE_HR(h, e), x = h.X(u, y0);
      return [x, y0 + hr + 0.15, j ? 1.1 : -1.1, i / n, j];
    }), C.red));
    // 용머리
    var yb = h.sheer(1) + h.H * 0.35, xb = h.X(1, yb);
    var head = new T.Group();
    head.add(box(5.5, 3.4, 3.6, C.brass, 0, 0, 0));
    head.add(box(2.2, 1.4, 2.6, C.hole, 2.8, -0.2, 0));
    var horn = rod([-1, 1.5, 0], [-3, 4.5, 0], 0.5, 0.2, C.brass, 5); head.add(horn);
    head.position.set(xb + 0.5, yb, 0); head.rotation.z = 0.25; grp.add(head);
    // 이물·고물의 포혈
    for (var g2 = 0; g2 < 5; g2++) [1, -1].forEach(function (side) {
      var u = lerp(0.2, 0.82, g2 / 4), yy = h.sheer(u) + h.H * 0.2, xx = h.X(u, yy);
      grp.add(box(1.6, 1.2, 0.5, C.hole, xx, yy, side * (h.half(u, yy) * 1.04 + 0.2)));
    });
  };

  Ship.prototype.up_jp = function (grp) {
    var s = this.s, h = this.h, C = this.C, M = this.M, id = s.id;
    if (id === 'sekibune') {
      // 세키부네: 뱃전 둘레 대나무·널 방패(다테)와 지붕 없는 갑판
      shell(h, grp, M, {
        uA: 0.08, uB: 0.82, y0: function (u) { return h.sheer(u) - h.bul; }, y1: function (u) { return h.sheer(u) + h.H * 0.55; },
        inset: 1.03, n: 20, nj: 2, side: C.wallJ, top: false, backWall: true, frontWall: true, backMat: C.wallJ, frontMat: C.wallJ
      });
      var x0 = -s.L * 0.36, x1 = -s.L * 0.18, u = h.U(-s.L * 0.27, h.H);
      this.roofHouse(grp, x0, x1, h.half(u, h.H) * 0.6, h.sheer(u) + h.H * 0.1, h.H * 0.7, C.roof, 0.25, C.wallJ);
    } else {
      // 고바야: 대나무 다발 방패만
      [1, -1].forEach(function (side) {
        for (var k = 0; k < 9; k++) {
          var u = lerp(0.2, 0.78, k / 8), y = h.sheer(u), x = h.X(u, y), z = side * (h.half(u, y) + 0.2);
          grp.add(rod([x, y - 0.5, z], [x, y + h.H * 0.75, z], 0.8, 0.8, C.bamboo, 6));
        }
      });
    }
  };

  Ship.prototype.up_atake = function (grp) {
    var s = this.s, h = this.h, C = this.C, M = this.M;
    // 아타케부네: 배 전체를 덮은 상자형 성벽(총안), 위에 2층 망루(야구라)
    var hu = h.H * 1.15;
    shell(h, grp, M, {
      uA: 0.05, uB: 0.92, y0: function (u) { return h.sheer(u) - h.bul; }, y1: function (u) { return h.sheer(u) + hu; },
      inset: 1.03, n: 22, nj: 3, side: C.wallJ, deck: M.deckc, bul: h.H * 0.3, backWall: true, frontWall: true, backMat: C.wallJ, frontMat: C.wallJ
    });
    var u = h.U(-s.L * 0.08, h.H), y0 = h.sheer(u) + hu - h.H * 0.3, w = h.half(u, h.H) * 0.6;
    this.roofHouse(grp, -s.L * 0.22, s.L * 0.06, w, y0, h.H * 0.65, C.roof, 0.22, C.white);
    this.roofHouse(grp, -s.L * 0.16, 0, w * 0.75, y0 + h.H * 0.65 + 1.2, h.H * 0.55, C.roof, 0.22, C.white);
  };

  /* 지붕 있는 집: x0~x1, 반폭 hw, 바닥 y0, 벽 높이 hh. eave = 처마(폭 비율) */
  Ship.prototype.roofHouse = function (grp, x0, x1, hw, y0, hh, roofMat, eave, wallMat) {
    var C = this.C, M = this.M, len = x1 - x0, cx = (x0 + x1) / 2;
    var walls = mesh(new T.BoxGeometry(len, hh, hw * 2), wallMat || M.mid); walls.position.set(cx, y0 + hh / 2, 0); grp.add(walls);
    var ov = Math.min(hw * (eave || 0.2), 3.2), rh = Math.min(hw * 0.5, 2.2 + hh * 0.55);
    // 박공 지붕: 두 경사면
    [1, -1].forEach(function (side) {
      var g = grid(1, 1, function (i, j) {
        var x = lerp(x0 - ov, x1 + ov, i), z = side * (j ? 0 : hw + ov), y = y0 + hh + (j ? rh : -ov * 0.35);
        return [x, y, z, i * 2, j];
      }, side > 0);
      grp.add(mesh(g, roofMat));
    });
    // 박공 벽(삼각)
    [x0, x1].forEach(function (x, k) {
      var g = geo([x, y0 + hh, -hw, x, y0 + hh, hw, x, y0 + hh + rh, 0], [0, 0, 1, 0, 0.5, 1], k ? [0, 1, 2] : [0, 2, 1]);
      grp.add(mesh(g, wallMat || M.mid));
    });
    grp.add(rod([x0 - ov, y0 + hh + rh + 0.2, 0], [x1 + ov, y0 + hh + rh + 0.2, 0], 0.55, 0.55, M.dark, 6));
  };

  Ship.prototype.outriggers = function (grp) {
    var s = this.s, h = this.h, C = this.C, W = s.W;
    var zf = W * 2.25;
    [-s.L * 0.24, s.L * 0.2].forEach(function (x) {
      var u = h.U(x, h.H), y = h.sheer(u) + 0.6;
      grp.add(rod([x, y, -zf], [x, y, zf], 0.55, 0.55, C.bamboo, 6));
      [1, -1].forEach(function (side) { grp.add(rod([x, y, side * zf], [x, 0.6, side * zf], 0.4, 0.4, C.bamboo, 5)); });
    });
    [1, -1].forEach(function (side) {
      for (var k = 0; k < 2; k++) grp.add(rod([-s.L * 0.36, 0.7 + k * 0.9, side * (zf - k * 0.8)], [s.L * 0.32, 0.7 + k * 0.9, side * (zf - k * 0.8)], 0.75, 0.75, C.bamboo, 6));
    });
  };

  Ship.prototype.buildRaft = function (grp) {
    var s = this.s, C = this.C, L = s.L, W = s.W, n = 9, r = W / (n * 2.05);
    this.h.H = r * 2.2;
    for (var k = 0; k < n; k++) {
      var z = lerp(-W * 0.47, W * 0.47, k / (n - 1)), len = L * (0.86 + 0.12 * Math.cos(PI * (k / (n - 1) - 0.5)));
      grp.add(rod([-L * 0.5, r * 0.6, z], [-L * 0.5 + len, r * 0.6, z], r, r * 0.92, C.log, 10));
    }
    [-L * 0.3, 0, L * 0.25].forEach(function (x) { grp.add(rod([x, r * 1.6, -W * 0.5], [x, r * 1.6, W * 0.5], r * 0.45, r * 0.45, C.batten, 6)); });
    // 대나무 갑판과 오두막
    grp.add(box(L * 0.55, 0.6, W * 0.8, C.bamboo, -L * 0.04, r * 1.9, 0));
    this.roofHouse(grp, -L * 0.3, -L * 0.08, W * 0.26, r * 2.2, 4.5, C.thatch, 0.25, C.bamboo);
    // 고물 노(방향)
    grp.add(rod([-L * 0.42, r * 2.4, W * 0.15], [-L * 0.56, 0.2, W * 0.2], 0.5, 0.5, C.oar, 5));
    this.raftDeck = r * 2.2;
    return grp;
  };

  // ───────────────────────────────── 돛대·돛 (동작마다 새로 짓는다)
  /* st: { furl: bool, brace: rad, bill: 0~1, pulse: -1~1, oar: 위상, oarPow: 0~1, phase } */
  Ship.prototype.buildRig = function (st) {
    var s = this.s, q = this.q, h = this.h, C = this.C, grp = new T.Group(), self = this;
    var rig = q.rig || '', H0 = s.H, masts = s.masts, hs = s.heights, nm = masts.length;
    var west = s.hull === 'west', galley = s.hull === 'galley';
    var rbase = clamp(0.75 + 0.5 * Math.sqrt(s.cap / 600), 0.8, 1.7);
    var tiers2 = (rig === 'carrack' || rig === 'galleon' || rig === 'fluyt' || rig === 'frigate' || rig === 'hulk') && s.cap >= 300;
    var raft = s.hull === 'raft';
    var sailKinds = s.sails;
    for (var i = 0; i < nm; i++) {
      var mx = masts[i], mh = hs[i], top = H0 + mh, kind = sailKinds[i] || 'sq';
      var ud = h.U(mx, h.H), yd = raft ? this.raftDeck : h.deckY(ud);
      var r = rbase * (i === 0 && nm > 2 ? 0.85 : i === nm - 1 && nm > 2 ? 0.75 : 1);
      var style = (rig === 'jong' || rig === 'korakora') ? 'tanja' : kind === 'sq' ? (rig === 'japanese' ? 'jp' : 'sq') : kind === 'lat' ? 'lat' : (rig === 'korean' ? 'kr' : 'bat');
      // 돛대
      if (raft) {
        [1, -1].forEach(function (side) { grp.add(rod([mx - 2, yd, side * s.W * 0.28], [mx, top, 0], 0.7, 0.5, C.bamboo, 6)); });
      } else if (rig === 'korakora') {
        [[-3, -s.W * 0.3], [-3, s.W * 0.3], [3, 0]].forEach(function (p) { grp.add(rod([mx + p[0], yd, p[1]], [mx, top, 0], 0.55, 0.4, C.bamboo, 6)); });
      } else {
        var hasTop = west && (s.cap >= 150) && style === 'sq';
        var yTop1 = H0 + mh * (tiers2 && style === 'sq' ? 0.67 : 0.72);
        grp.add(rod([mx, yd - 0.5, 0], [mx, top, 0], r, r * 0.55, C.mast, 10));
        // 돛대 테(황동)
        for (var b = 1; b <= 3; b++) { var yb2 = lerp(yd, yTop1, b / 4); grp.add(rod([mx, yb2 - 0.3, 0], [mx, yb2 + 0.3, 0], r * 1.18, r * 1.18, C.brass, 10)); }
        if (hasTop) {
          var tr = r * 2.6 + 0.8;
          grp.add(rod([mx, yTop1 - 0.4, 0], [mx, yTop1 + 0.4, 0], tr, tr, C.spar, 14));
          var ring = new T.CylinderGeometry(tr, tr * 0.95, 1.3, 14, 1, true);
          var rm = mesh(ring, this.M.mid); rm.position.set(mx, yTop1 + 1.0, 0); grp.add(rm);
        }
        // 슈라우드(돛대 줄) — 서양선·갤리·다우
        if (west || galley || s.hull === 'dhow' || s.hull === 'jong') {
          var yh = west && hasTop ? yTop1 - 0.5 : H0 + mh * 0.78, nsh = west ? (this.big ? 4 : 3) : 2;
          [1, -1].forEach(function (side) {
            for (var k = 0; k < nsh; k++) {
              var xc = mx - 1.5 - k * 2.2 * (west ? 1 : 1.3), uc = h.U(xc, h.H), yc = h.sheer(uc), zc = side * (h.half(uc, yc) + 0.6);
              grp.add(rod([mx, yh, side * r * 0.6], [xc, yc + 0.2, zc], 0.17, 0.17, C.rope, 4));
            }
            if (west && self.big) {   // 줄사다리(가로줄)
              var x0 = mx - 1.5, x1 = mx - 1.5 - (nsh - 1) * 2.2, u0 = h.U(x0, h.H), u1 = h.U(x1, h.H);
              var z0 = side * (h.half(u0, h.sheer(u0)) + 0.6), z1 = side * (h.half(u1, h.sheer(u1)) + 0.6), ya = h.sheer(u0) + 0.2;
              for (var rr = 1; rr < 9; rr++) {
                var t = rr / 9, yy = lerp(ya, yh, t);
                var pa = [lerp(x0, mx, t), yy, lerp(z0, side * r * 0.6, t)], pb = [lerp(x1, mx, t), yy, lerp(z1, side * r * 0.6, t)];
                grp.add(rod(pa, pb, 0.09, 0.09, C.rope, 3));
              }
            }
          });
          // 앞 버팀줄(포어스테이)
          var fx = i === 0 ? (self.sprit ? self.sprit.b : [h.X(1, h.sheer(1)), h.sheer(1), 0]) : [masts[i - 1], H0 + hs[i - 1] * 0.3, 0];
          grp.add(rod([mx, top - 1, 0], fx, 0.14, 0.14, C.rope, 3));
        }
      }
      // 돛
      if (style === 'sq' || style === 'jp') this.squareSails(grp, mx, mh, H0, top, i, nm, st, style, tiers2 && style === 'sq', raft);
      else if (style === 'lat') this.lateen(grp, mx, mh, H0, st, i);
      else if (style === 'tanja') this.tanja(grp, mx, mh, H0, st);
      else this.batten(grp, mx, mh, H0, st, style, i);
      // 돛대 꼭대기 공
      var knob = mesh(new T.SphereGeometry(r * 0.75, 8, 6), C.spar); knob.position.set(mx, top + 0.3, 0); grp.add(knob);
    }
    // 이물 아래 돛(스프릿세일) — 16세기 카락·갤리온·플루트
    if (this.sprit && !st.furl && (rig === 'carrack' || rig === 'galleon' || rig === 'fluyt' || rig === 'hulk')) {
      var a = this.sprit.a, b2 = this.sprit.b, t2 = 0.62, px = lerp(a[0], b2[0], t2), py = lerp(a[1], b2[1], t2);
      var span = s.W * 0.30, hh = s.W * 0.30;
      this.sqSurface(grp, px, py - 0.6, py - 0.6 - hh, span, span * 0.95, st.brace * 0.6, st.bill * 0.7, st, sailMat('sq', IVORY), 6, 6);
      grp.add(rod([px, py - 0.6, -span], [px, py - 0.6, span], 0.45, 0.45, C.spar, 6));
    }
    // 앞 삼각돛(지브): 지중해 소형선
    if (!st.furl && (s.id === 'tartane' || s.id === 'xebec') && this.sprit) {
      var sb = this.sprit.b, m0 = masts[0], mh0 = hs[0];
      var p0 = [sb[0], sb[1], 0], p1 = [m0 + 0.5, H0 + mh0 * 0.78, 0], p2 = [m0 + 2, h.sheer(h.U(m0, h.H)) + 2, 0];
      this.triSurface(grp, p0, p1, p2, st.bill * s.W * 0.1, st.brace * 1.6, m0, sailMat('lat', IVORY));
    }
    return grp;
  };

  /* 사각돛 면: (mx) 둘레로 brace만큼 돌린 활대 아래 걸린 천. bill = 앞으로 부푼 정도 */
  Ship.prototype.sqSurface = function (grp, mx, yT, yB, spT, spB, brace, bill, st, mat, ni, nj) {
    ni = ni || 12; nj = nj || 10;
    var amp = bill, flut = (st.flutter || 0), ph = st.phase || 0;
    var g = grid(ni, nj, function (i, j) {
      var s1 = i / ni * 2 - 1, t = j / nj, z = s1 * lerp(spT, spB, t), y = lerp(yT, yB, t);
      var belly = amp * Math.pow(1 - s1 * s1, 0.85) * Math.pow(Math.sin(PI / 2 * t), 0.9);
      y += amp * 0.22 * (1 - s1 * s1) * t * t;                                // 아랫자락이 바람에 들린다
      belly += flut * Math.sin(t * 7 + ph * 2 + s1 * 2) * Math.pow(Math.abs(s1), 3) * 0.6;
      return [belly, y, z, (s1 + 1) / 2, t];
    });
    var o = mesh(g, mat); o.position.x = mx; o.rotation.y = brace; grp.add(o);
    return o;
  };
  Ship.prototype.squareSails = function (grp, mx, mh, H0, top, i, nm, st, style, tiers2, raft) {
    var s = this.s, C = this.C, W = s.W, mat = sailMat(style === 'jp' ? 'jp' : raft ? 'mat' : 'sq', raft ? TAN : IVORY);
    var spanK = (nm > 2 && i === 0 ? 1.0 : 1.12) * (style === 'jp' ? 0.86 : 1) * (raft ? 0.8 : 1);
    var bands = tiers2 ? [[0.95, 0.68, 0.72], [0.64, 0.27, 1.0]] : [[0.93, 0.30, 1.0]];
    var self = this;
    bands.forEach(function (bd, ti) {
      var span = W * spanK * bd[2], yT = H0 + mh * bd[0], yB = H0 + mh * bd[1];
      var br = st.brace * (ti ? 1 : 1.1);
      // 활대
      var yard = new T.Group(), yo = rod([0, yT + 0.6, -span * 1.08], [0, yT + 0.6, span * 1.08], 0.75, 0.75, C.spar, 7);
      yard.add(yo); yard.position.x = mx; yard.rotation.y = br; grp.add(yard);
      if (st.furl) {
        var f = rod([0, yT - 0.9, -span * 0.9], [0, yT - 0.9, span * 0.9], 1.7 + 0.2 * ti, 1.7, mat, 9);
        f.scale.set(1.15, 1, 1); var fg = new T.Group(); fg.add(f); fg.position.x = mx; fg.rotation.y = br; grp.add(fg);
        // 묶은 끈
        for (var g2 = -2; g2 <= 2; g2++) { var gk = rod([0, yT - 0.6, span * 0.38 * g2 - 0.15], [0, yT - 0.6, span * 0.38 * g2 + 0.15], 1.45, 1.45, C.rope, 8); fg.add(gk); }
        return;
      }
      var bill = st.bill * W * (0.2 + 0.03 * ti);
      self.sqSurface(grp, mx, yT, yB, span, span * (ti ? 0.98 : 0.92), br, bill, st, mat);
      // 아래 활대(코스 아래 활대 대신, 윗돛은 아래 돛 활대에 묶인다)
      if (style === 'jp' || raft) {
        var yb = new T.Group(); yb.add(rod([bill * 0.8, yB, -span * 0.95], [bill * 0.8, yB, span * 0.95], 0.55, 0.55, C.spar, 6)); yb.position.x = mx; yb.rotation.y = br; grp.add(yb);
      }
    });
  };

  /* 삼각돛(라틴): 앞 아래(택) → 뒤 위(피크) 활대, 뒤 아래(클루). 바람 아래쪽(+z)으로 부푼다 */
  Ship.prototype.lateen = function (grp, mx, mh, H0, st, i) {
    var s = this.s, C = this.C, rig = this.q.rig, mat = sailMat('lat', IVORY);
    var g = new T.Group(); g.position.x = mx;
    var long = rig === 'galley' || rig === 'galleass' || rig === 'xebec';
    var tack = [mh * (long ? 0.62 : 0.5), H0 + mh * 0.14], peak = [-mh * (long ? 0.62 : 0.56), H0 + mh * 1.0], clew = [-mh * (long ? 0.36 : 0.42), H0 + mh * 0.13];
    if (rig === 'dhow' || rig === 'baghlah') { tack = [mh * 0.58, H0 + mh * 0.12]; peak = [-mh * 0.5, H0 + mh * 1.03]; clew = [-mh * 0.48, H0 + mh * 0.22]; }
    // 활대(택과 피크 너머로 조금 나간다)
    var d = [peak[0] - tack[0], peak[1] - tack[1]];
    var ya = [tack[0] - d[0] * 0.04, tack[1] - d[1] * 0.04], yb = [peak[0] + d[0] * 0.04, peak[1] + d[1] * 0.04];
    if (st.furl) {
      g.add(rod([ya[0], ya[1], 0.6], [yb[0], yb[1], 0.6], 0.8, 0.45, C.spar, 7));
      var fr = rod([lerp(ya[0], yb[0], 0.08), lerp(ya[1], yb[1], 0.08) - 0.8, 0.6], [lerp(ya[0], yb[0], 0.85), lerp(ya[1], yb[1], 0.85) - 0.8, 0.6], 1.1, 0.7, mat, 8);
      g.add(fr); g.rotation.y = 0.05; grp.add(g); return;
    }
    g.add(rod([ya[0], ya[1], 0.5], [yb[0], yb[1], 0.5], 0.8, 0.45, C.spar, 7));
    var amp = st.bill * s.W * 0.22, flut = st.flutter || 0, ph = st.phase || 0;
    var ni = 14, nj = 10;
    var sg = grid(ni, nj, function (a, b) {
      var u = a / ni, r = b / nj, lx = lerp(tack[0], peak[0], u), ly = lerp(tack[1], peak[1], u);
      var x = lerp(lx, clew[0], r), y = lerp(ly, clew[1], r);
      var belly = amp * Math.pow(Math.sin(PI * r), 0.85) * (0.35 + 0.65 * Math.sin(PI * u)) * (1 - 0.6 * r * r);
      belly += flut * Math.sin(u * 8 + ph * 2) * r * r * 0.7;
      return [x - belly * 0.25, y, 0.9 + belly, u, r];
    });
    g.add(mesh(sg, mat));
    g.rotation.y = -st.brace * 1.8;   // 돛이 바람 아래로 돈다
    grp.add(g);
  };

  /* 탄자(동남아 기울인 사각돛): 위·아래 활대 모두 비스듬한 사각형 */
  Ship.prototype.tanja = function (grp, mx, mh, H0, st) {
    var s = this.s, C = this.C, mat = sailMat('mat', MAT_TAN), g = new T.Group(); g.position.x = mx;
    var wS = mh * 0.62, hS = mh * 0.8, be = 0.36, ph = 0.30;          // 아래 활대는 고물로 오르고, 돛 전체가 이물로 기운다
    var bx = -Math.cos(be), by = Math.sin(be), vx = Math.sin(ph), vy = Math.cos(ph);
    var A = [wS * 0.34, H0 + mh * 0.12], Bp = [A[0] + wS * bx, A[1] + wS * by], D = [A[0] + hS * vx, A[1] + hS * vy], Cc = [Bp[0] + hS * vx, Bp[1] + hS * vy];
    if (st.furl) {
      g.add(rod([A[0], A[1], 0.6], [Bp[0], Bp[1], 0.6], 0.6, 0.6, C.bamboo, 6));
      g.add(rod([lerp(A[0], Bp[0], 0.05), A[1] + 1.4, 0.6], [lerp(A[0], Bp[0], 0.95), Bp[1] + 1.4, 0.6], 1.4, 1.4, mat, 8));
      g.add(rod([lerp(A[0], Bp[0], 0.02), A[1] + 2.6, 0.6], [lerp(A[0], Bp[0], 0.98), Bp[1] + 2.6, 0.6], 0.55, 0.55, C.bamboo, 6));
      grp.add(g); return;
    }
    var amp = st.bill * s.W * 0.2, ni = 10, nj = 10;
    g.add(mesh(grid(ni, nj, function (a, b) {
      var u = a / ni, v = b / nj, x0 = lerp(A[0], Bp[0], u), y0 = lerp(A[1], Bp[1], u), x1 = lerp(D[0], Cc[0], u), y1 = lerp(D[1], Cc[1], u);
      var belly = amp * Math.sin(PI * u) * Math.sin(PI * v) + (st.flutter || 0) * Math.sin(v * 7 + (st.phase || 0) * 2) * u * u * 0.6;
      return [lerp(x0, x1, v), lerp(y0, y1, v), 0.8 + belly, u, 1 - v];
    }), mat));
    g.add(rod([A[0], A[1], 0.8], [Bp[0], Bp[1], 0.8], 0.55, 0.55, C.bamboo, 6));
    g.add(rod([D[0], D[1], 0.8], [Cc[0], Cc[1], 0.8], 0.55, 0.55, C.bamboo, 6));
    for (var k = 1; k < 4; k++) { var t = k / 4; g.add(rod([lerp(A[0], D[0], t), lerp(A[1], D[1], t), 0.9 + amp * Math.sin(PI * t) * 0.5], [lerp(Bp[0], Cc[0], t), lerp(Bp[1], Cc[1], t), 0.9 + amp * Math.sin(PI * t) * 0.5], 0.28, 0.28, C.batten, 4)); }
    g.rotation.y = -st.brace * 1.5; grp.add(g);
  };

  /* 대나무 살 돛(정크·조선 전선): 활대가 고물 쪽으로 높은 러그 돛, 살마다 칸이 조금씩 부푼다.
     style kr: 좌우가 거의 같은 사각형(판옥선·거북선) */
  Ship.prototype.batten = function (grp, mx, mh, H0, st, style, i) {
    var s = this.s, C = this.C, kr = style === 'kr', mat = sailMat('bat', kr ? '#e6d7b4' : TAN), g = new T.Group(); g.position.x = mx;
    var w = mh * (kr ? 0.56 : 0.62), fwd = kr ? 0.42 : 0.3;
    var luffX = w * fwd, leechX = -w * (1 - fwd);
    var yBot = H0 + mh * 0.16, yTopF = H0 + mh * (kr ? 0.9 : 0.84), yTopA = H0 + mh * (kr ? 0.95 : 1.0);
    var nb = kr ? 7 : 6, furl = st.furl, amp = st.bill * s.W * 0.13;
    var hgt = function (t) { return furl ? lerp(yBot, yBot + (yTopF - yBot) * 0.14, t) : null; };
    var ni = 10, nj = nb * 3;
    var sg = grid(ni, nj, function (a, b) {
      var u = a / ni, v = b / nj;                       // u: 앞(러프) → 뒤(리치), v: 아래 → 위
      var yF = lerp(yBot, yTopF, v), yA = lerp(yBot - mh * 0.02, yTopA, v);
      if (furl) { yF = lerp(yBot, yBot + mh * 0.1, v); yA = lerp(yBot - mh * 0.02, yBot + mh * 0.14, v); }
      var x = lerp(luffX, leechX, u) - (kr ? 0 : Math.sin(PI * v) * w * 0.12 * u);       // 리치가 뒤로 둥글다
      var y = lerp(yF, yA, u);
      var panel = (v * nb) % 1, belly = furl ? 0.2 : amp * (0.55 * Math.sin(PI * u) + 0.45 * Math.sin(PI * panel) * Math.sin(PI * u * 0.9 + 0.15));
      return [x, y, 0.9 + belly, u, v];
    });
    g.add(mesh(sg, mat));
    // 살
    for (var k = 0; k <= nb; k++) {
      var v = k / nb, yF = furl ? lerp(yBot, yBot + mh * 0.1, v) : lerp(yBot, yTopF, v), yA = furl ? lerp(yBot - mh * 0.02, yBot + mh * 0.14, v) : lerp(yBot - mh * 0.02, yTopA, v);
      var xa = leechX - (kr || furl ? 0 : Math.sin(PI * v) * w * 0.12);
      var bz = 0.9 + (furl ? 0.25 : amp * 0.55 * 0.2);
      g.add(rod([luffX + 0.6, yF, bz], [xa - 0.6, yA, bz], k === 0 || k === nb ? 0.55 : 0.32, k === 0 || k === nb ? 0.55 : 0.32, k === nb ? C.spar : C.batten, 5));
    }
    g.rotation.y = -st.brace * 1.2; grp.add(g);
  };

  Ship.prototype.triSurface = function (grp, p0, p1, p2, amp, brace, pivotX, mat) {
    var g = new T.Group(), ni = 8, nj = 8;
    g.add(mesh(grid(ni, nj, function (a, b) {
      var u = a / ni, r = b / nj, lx = lerp(p0[0], p1[0], u), ly = lerp(p0[1], p1[1], u);
      var x = lerp(lx, p2[0], r), y = lerp(ly, p2[1], r), belly = amp * Math.sin(PI * r) * Math.sin(PI * u);
      return [x - pivotX, y, belly, u, r];
    }), mat));
    g.position.x = pivotX; g.rotation.y = -brace; grp.add(g);
  };

  // ───────────────────────────────── 노
  Ship.prototype.buildOars = function (st) {
    var s = this.s, q = this.q, h = this.h, C = this.C, grp = new T.Group();
    var ht = s.hull, n = q.oars || 0;
    if (!n && !(ht === 'galley' || ht === 'kr' || ht === 'panok' || ht === 'turtle' || ht === 'jp' || ht === 'atake' || ht === 'outrigger')) return grp;
    n = n || 7;
    var reach = (ht === 'atake' || ht === 'panok' || ht === 'turtle') ? 0.62 : ht === 'outrigger' ? 0.95 : 0.9;
    var ap = this.apost || 0;
    for (var k = 0; k < n; k++) {
      var x = -s.L * 0.33 + k * (s.L * 0.64 / Math.max(1, n - 1)), u = h.U(x, h.H);
      var ys = (ht === 'panok' || ht === 'turtle' || ht === 'atake') ? h.sheer(u) * 0.72 : h.sheer(u) - 0.3;
      [1, -1].forEach(function (side) {
        var hw = h.half(u, ys) + ap + 0.3;
        var ph = (st.oar || 0) + k * 0.42 + (side > 0 ? 0 : 0.28), pow = st.oarPow || 0;
        var sweep = Math.sin(ph) * 0.42 * pow, lift = (0.5 + 0.5 * Math.cos(ph)) * pow;
        var len = s.W * reach + (ys - 0.5) * 0.6, dz = Math.cos(sweep) * len * 0.92, dx = -Math.sin(sweep) * len * 0.92;
        var yt = st.furl ? ys * 0.7 + 1.2 : 0.6 + lift * 3.0;
        var a = [x, ys, side * hw], b = [x + dx, yt, side * (hw + dz)];
        grp.add(rod(a, b, 0.32, 0.3, C.oar, 5));
        // 노깃
        var bl = new T.Mesh(new T.BoxGeometry(2.6, 0.25, 1.1), C.oar);
        bl.position.set(b[0] + dx * 0.04, b[1], b[2] + side * dz * 0.04); bl.rotation.y = -sweep * side; bl.castShadow = true; grp.add(bl);
      });
    }
    return grp;
  };

  // ───────────────────────────────── 물결(잔물결·선수 포말·물살 자국) — 수면에 붙은 반투명 띠
  Ship.prototype.buildWater = function (st) {
    var s = this.s, h = this.h, grp = new T.Group(), mat = this.C.foam, pow = st.power, ph = st.phase || 0;
    function ribbon(pts, w0, w1, a0, a1, y) {
      var pos = [], col = [], idx = [], n = pts.length;
      for (var i = 0; i < n; i++) {
        var p = pts[i], q2 = pts[Math.min(n - 1, i + 1)], p0 = pts[Math.max(0, i - 1)];
        var dx = q2[0] - p0[0], dz = q2[1] - p0[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l, t = i / (n - 1), w = lerp(w0, w1, t), a = lerp(a0, a1, t) * Math.sin(PI * Math.min(1, t * 4 + 0.05));
        pos.push(p[0] + nx * w, y, p[1] + nz * w, p[0] - nx * w, y, p[1] - nz * w);
        col.push(0.92, 0.97, 0.95, a, 0.92, 0.97, 0.95, a);
        if (i < n - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
      }
      var g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new T.Float32BufferAttribute(col, 4));
      g.setIndex(idx);
      var m = new T.Mesh(g, mat); m.renderOrder = -1; grp.add(m);
    }
    if (s.hull === 'raft') { /* 뗏목도 같은 규칙 */ }
    var xb = h.xb0, xs = h.xs0, L = s.L, B = h.B;
    var sideOut = function (u) { return h.half(u, 0.2) + 0.6; };
    // 선체 둘레 잔물결(정박·표류에 잘 보임)
    for (var r = 0; r < 2; r++) {
      var off = 1.2 + r * 2.4 + (0.6 + 0.6 * Math.sin(ph + r * 1.7)) * 1.2, a = (0.20 - r * 0.07) * (1 - pow * 0.4);
      [1, -1].forEach(function (side) {
        var pts = []; for (var i = 0; i <= 24; i++) { var u = i / 24; pts.push([h.X(u, 0) + (u > 0.97 ? off * 0.6 : u < 0.03 ? -off * 0.4 : 0), side * (sideOut(u) + off)]); }
        ribbon(pts, 0.35, 0.35, a, a, 0.15);
      });
    }
    if (pow > 0.1) {
      // 선수 포말: 이물에서 양옆으로 퍼진다
      [1, -1].forEach(function (side) {
        var pts = [], kick = 0.5 + 0.5 * Math.sin(ph + side * 0.8);
        for (var i = 0; i <= 14; i++) { var t = i / 14, u = 1 - t * 0.55; pts.push([h.X(u, 0) + 1.2 - t * 2, side * (sideOut(u) + t * (2 + 4 * pow) + kick * pow * 0.8 * t)]); }
        ribbon(pts, 0.6 + 1.0 * pow, 0.4, 0.55 * pow + 0.1, 0.05, 0.2);
        // 뒤로 퍼지는 물살 자국
        var tw = [], spread = B * (0.65 + 0.45 * pow);
        for (var j = 0; j <= 12; j++) { var t2 = j / 12; tw.push([lerp(xs + 2, xs - L * (0.05 + 0.04 * pow), t2), side * lerp(h.half(0.02, 0.2) * 0.6, spread, t2)]); }
        ribbon(tw, 0.5 + 0.8 * pow, 1.2 + pow, 0.45 * pow, 0.02, 0.18);
      });
      // 선미 바로 뒤 흰 물
      var pts2 = []; for (var k = 0; k <= 8; k++) { var t3 = k / 8; pts2.push([xs - 1 - t3 * L * 0.05 * (0.5 + pow), Math.sin(ph * 2 + t3 * 6) * 0.6]); }
      ribbon(pts2, h.half(0.01, 0.2) * 0.5 + 0.5, 1.6 + 1.6 * pow, 0.35 * pow, 0.0, 0.17);
    }
    return grp;
  };

  M.FORMS = FORMS;
  M.init = function (three) { T = three; };
})(window);
