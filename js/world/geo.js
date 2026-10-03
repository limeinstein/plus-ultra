/* World geography: unpacks the embedded land/river/climate data, builds a signed-distance field,
   and offers JS-side sampling that matches the WebGL shader (same hash/noise). */
(function (G) {
  'use strict';
  var Geo = {};
  G.Geo = Geo;

  var W, H, CW, CH;
  var geoTex = null;   // Uint8Array RGBA W*H : R fine sdf, G coarse sdf, B river, A land
  var climTex = null;  // Uint8Array RGBA CW*CH
  var TEX_PER_DEG;

  // ---------------------------------------------------------------- hash / noise (mirrors GLSL)
  function hash2u(x, y) {
    var h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1);
    h ^= h >>> 15; h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h >>> 0;
  }
  function hash2(x, y) { return hash2u(x, y) / 4294967296; }
  function vnoise(px, py) {
    var ix = Math.floor(px), iy = Math.floor(py);
    var fx = px - ix, fy = py - iy;
    var ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    var a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  }
  Geo.hash2 = hash2; Geo.vnoise = vnoise;

  /** coast perturbation in texels (identical formula in shader) */
  function coastNoise(lon, lat) {
    var px = lon + 180, py = lat + 90;
    return (vnoise(px * 3.0, py * 3.0) - 0.5) * 1.1 +
           (vnoise(px * 9.0 + 17.3, py * 9.0 + 17.3) - 0.5) * 0.56 +
           (vnoise(px * 27.0 + 41.7, py * 27.0 + 41.7) - 0.5) * 0.26;
  }
  Geo.coastNoise = coastNoise;

  // ---------------------------------------------------------------- EDT (Felzenszwalb-Huttenlocher)
  function edt1d(f, n, d, v, z) {
    var k = 0, q, s;
    v[0] = 0; z[0] = -1e20; z[1] = 1e20;
    for (q = 1; q < n; q++) {
      s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
      k++; v[k] = q; z[k] = s; z[k + 1] = 1e20;
    }
    k = 0;
    for (q = 0; q < n; q++) {
      while (z[k + 1] < q) k++;
      var dq = q - v[k];
      d[q] = dq * dq + f[v[k]];
    }
  }
  /** squared distance to nearest pixel where feat(x,y) is true, horizontal wrap handled by padding */
  function edt2d(isFeat, w, h, pad) {
    var ew = w + pad * 2;
    var grid = new Float32Array(ew * h);
    var INF = 1e20, x, y;
    for (y = 0; y < h; y++) {
      var row = y * ew;
      for (x = 0; x < ew; x++) {
        var sx = (x - pad + w) % w;
        grid[row + x] = isFeat(sx, y) ? 0 : INF;
      }
    }
    var n = Math.max(ew, h);
    var f = new Float32Array(n), d = new Float32Array(n), v = new Int32Array(n), z = new Float32Array(n + 1);
    // columns
    for (x = 0; x < ew; x++) {
      for (y = 0; y < h; y++) f[y] = grid[y * ew + x];
      edt1d(f, h, d, v, z);
      for (y = 0; y < h; y++) grid[y * ew + x] = d[y];
    }
    // rows
    for (y = 0; y < h; y++) {
      var r = y * ew;
      for (x = 0; x < ew; x++) f[x] = grid[r + x];
      edt1d(f, ew, d, v, z);
      for (x = 0; x < ew; x++) grid[r + x] = d[x];
    }
    return grid;
  }

  // ---------------------------------------------------------------- 좁은 물길
  /** 지형 자료의 해상도에서 막혀 버린 해협·강어귀. 배가 드나들 수 있게 물길을 뚫는다 (경도, 위도 꺾은선) */
  var CHANNELS = [
    [[26.88, 40.52], [27.02, 40.55], [27.18, 40.56], [27.34, 40.56]],   // 다르다넬스 → 마르마라해 (이스탄불·흑해)
    [[-3.60, 51.29], [-3.42, 51.30], [-3.25, 51.31], [-3.08, 51.36]],   // 브리스틀 해협 → 세번강 어귀 (브리스틀)
    [[3.60, 51.42], [3.80, 51.42], [3.96, 51.42], [4.10, 51.41]],       // 베스테르스헬더 (앤트워프)
    // 세인트로렌스강: 하구 → 퀘벡(스타다코나) → 트루아리비에르 → 몬트리올(호셸라가). 큰 배가 몬트리올까지 거슬러 올랐다
    [[-69.80, 47.80], [-70.20, 47.52], [-70.60, 47.25], [-70.95, 46.98], [-71.20, 46.82], [-71.55, 46.70], [-72.00, 46.52],
     [-72.54, 46.33], [-72.95, 46.08], [-73.25, 45.80], [-73.52, 45.52]],
    // 델라웨어강: 델라웨어만 → 크리스티나 요새 → 필라델피아
    [[-75.36, 39.30], [-75.46, 39.48], [-75.52, 39.66], [-75.40, 39.82], [-75.20, 39.92]],
    // 제임스강: 체서피크만 어귀 → 제임스타운
    [[-76.30, 37.00], [-76.45, 37.06], [-76.62, 37.15], [-76.76, 37.20]]
  ];
  Geo.CHANNELS = CHANNELS;
  /* 자료(Natural Earth 50m)에 없을 만큼 작은 섬을 땅으로 찍는다: [경도, 위도, 반지름(텍스처 칸 — 1칸 ≈ 0.09°)]
     지도에 보이고 배가 그 둘레를 돌아가도록 실제보다 조금 크게 (독도는 실제 약 0.2km²) */
  var ISLES = [
    [131.866, 37.241, 1.6]    // 독도 (울릉도 동남쪽 87km)
  ];
  Geo.ISLES = ISLES;
  function stampIsles(land) {
    ISLES.forEach(function (s) {
      var cx = (s[0] + 180) / 360 * W, cy = (90 - s[1]) / 180 * H, R = s[2], R2 = R * R;
      for (var y = Math.floor(cy - R); y <= Math.ceil(cy + R); y++) {
        if (y < 0 || y >= H) continue;
        for (var x = Math.floor(cx - R); x <= Math.ceil(cx + R); x++) {
          var dx = x + 0.5 - cx, dy = y + 0.5 - cy;
          if (dx * dx + dy * dy <= R2) land[y * W + ((x % W) + W) % W] = 1;
        }
      }
    });
  }
  function carveChannels(land) {
    var R = 1.7, R2 = R * R;
    CHANNELS.forEach(function (line) {
      for (var i = 0; i < line.length - 1; i++) {
        var ax = (line[i][0] + 180) / 360 * W, ay = (90 - line[i][1]) / 180 * H;
        var bx = (line[i + 1][0] + 180) / 360 * W, by = (90 - line[i + 1][1]) / 180 * H;
        var n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 0.25));
        for (var k = 0; k <= n; k++) {
          var cx = ax + (bx - ax) * k / n, cy = ay + (by - ay) * k / n;
          for (var y = Math.floor(cy - R); y <= Math.ceil(cy + R); y++) {
            if (y < 0 || y >= H) continue;
            for (var x = Math.floor(cx - R); x <= Math.ceil(cx + R); x++) {
              var dx = x + 0.5 - cx, dy = y + 0.5 - cy;
              if (dx * dx + dy * dy <= R2) land[y * W + ((x % W) + W) % W] = 0;
            }
          }
        }
      }
    });
  }

  // ---------------------------------------------------------------- init
  Geo.init = function () {
    var D = G.WORLD_DATA;
    W = D.W; H = D.H; CW = D.CW; CH = D.CH;
    TEX_PER_DEG = W / 360;
    Geo.W = W; Geo.H = H; Geo.TEX_PER_DEG = TEX_PER_DEG;
    var t0 = performance.now();
    var landBits = G.unpackB64(D.land, W * H / 8);
    var rivBits = G.unpackB64(D.river, W * H / 8);
    climTex = G.unpackB64(D.climate, CW * CH * 4);
    var land = new Uint8Array(W * H);
    var i, b;
    for (i = 0; i < landBits.length; i++) {
      b = landBits[i];
      if (b) for (var k = 0; k < 8; k++) land[i * 8 + k] = (b >> k) & 1;
    }
    carveChannels(land);
    stampIsles(land);
    var t1 = performance.now();
    var pad = 64, ew = W + pad * 2;
    geoTex = new Uint8Array(W * H * 4);
    var x, y, idx, gi, s, o, fr, cr;
    // pass 1: land pixels -> distance to nearest water
    var dist = edt2d(function (x, y) { return land[y * W + x] === 0; }, W, H, pad);
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      idx = y * W + x; if (!land[idx]) continue;
      s = Math.sqrt(dist[y * ew + x + pad]) - 0.5; o = idx * 4;
      fr = 128 + s * 16; geoTex[o] = fr > 255 ? 255 : fr;
      cr = 128 + s * 2; geoTex[o + 1] = cr > 255 ? 255 : cr;
    }
    dist = null;
    // pass 2: water pixels -> distance to nearest land
    dist = edt2d(function (x, y) { return land[y * W + x] === 1; }, W, H, pad);
    var t2 = performance.now();
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      idx = y * W + x; o = idx * 4;
      if (!land[idx]) {
        s = -(Math.sqrt(dist[y * ew + x + pad]) - 0.5);
        fr = 128 + s * 16; geoTex[o] = fr < 0 ? 0 : fr;
        cr = 128 + s * 2; geoTex[o + 1] = cr < 0 ? 0 : cr;
      }
    }
    dist = null;
    var t3 = performance.now();
    Geo.mouths = linkRiverMouths(rivBits, land);
    Geo.timingMouths = performance.now() - t3;
    riverField(rivBits);
    Geo.landMask = land;
    Geo.timing = { unpack: t1 - t0, edt: t2 - t1, pack: performance.now() - t2 };
    Geo.ready = true;
  };

  /** 강 하구 잇기: 강 자료의 줄기가 바다 몇 칸 앞에서 끊긴 곳(예: 테주강·리스본)이 있어, 강물이 땅 한가운데서 멈춘 것처럼 보인다.
      이어진 강 줄기마다 끝점 가운데 바다에 가장 가까운 한 곳(하구)만 골라, 흐르던 방향으로 가장 가까운 바다까지 강 칸을 잇는다.
      강은 보기용이라 배의 판정(육지·바다)에는 영향이 없다. */
  function linkRiverMouths(rivBits, land) {
    var N = W * H, i, x, y, k;
    function isR(j) { return (rivBits[j >> 3] >> (j & 7)) & 1; }
    function setR(j) { rivBits[j >> 3] |= 1 << (j & 7); }
    function idx(xx, yy) { return yy * W + ((xx % W) + W) % W; }
    var comp = new Int32Array(N), nComp = 0, stack = [], ends = {}, hasMouth = {}, linked = 0;
    var DX = [-1, 0, 1, -1, 1, -1, 0, 1], DY = [-1, -1, -1, 0, 0, 1, 1, 1];
    for (i = 0; i < N; i++) {
      if (comp[i] || !isR(i) || !land[i]) continue;
      nComp++; comp[i] = nComp; stack.push(i);
      while (stack.length) {
        var c = stack.pop(), cx = c % W, cy = (c / W) | 0, nb = 0, last = -1;
        for (k = 0; k < 8; k++) {
          var ny = cy + DY[k]; if (ny < 0 || ny >= H) continue;
          var j = idx(cx + DX[k], ny);
          if (!land[j]) hasMouth[nComp] = 1;   // 이미 바다에 닿은 강 줄기는 건드리지 않는다
          if (!isR(j)) continue;
          nb++; last = j;
          if (!comp[j] && land[j]) { comp[j] = nComp; stack.push(j); }
        }
        if (nb <= 1) {   // 끝점: 가장 가까운 바다 칸을 찾는다 (흐르던 방향 쪽을 조금 더 친다)
          var dxr = 0, dyr = 0;
          if (last >= 0) { dxr = cx - last % W; if (dxr > 1) dxr -= W; if (dxr < -1) dxr += W; dyr = cy - ((last / W) | 0); }
          var dl = Math.hypot(dxr, dyr) || 1, best = 1e9, bx = 0, by = 0, RS = 11;
          for (var oy = -RS; oy <= RS; oy++) {
            var yy = cy + oy; if (yy < 0 || yy >= H) continue;
            for (var ox = -RS; ox <= RS; ox++) {
              if (land[idx(cx + ox, yy)]) continue;
              var dd = Math.hypot(ox, oy), cs = dd ? (ox * dxr + oy * dyr) / (dd * dl) : 1;
              var cost = dd * (1.35 - 0.35 * cs);
              if (cost < best) { best = cost; bx = ox; by = oy; }
            }
          }
          if (best < 1e8) { var e = ends[nComp]; if (!e || best < e.cost) ends[nComp] = { cost: best, x: cx, y: cy, ox: bx, oy: by }; }
        }
      }
    }
    for (var key in ends) {
      if (hasMouth[key]) continue;
      var m = ends[key], n = Math.max(Math.abs(m.ox), Math.abs(m.oy));
      if (n <= 1) continue;
      for (k = 1; k <= n; k++) {
        var px = Math.round(m.x + m.ox * k / n), py = Math.round(m.y + m.oy * k / n), q = idx(px, py);
        if (!land[q]) break;
        setR(q);
      }
      linked++;
    }
    return linked;
  }

  /** 강 거리장 → geo 텍스처 B: 가장 가까운 강 칸까지의 거리(칸, 0~8)를 255-거리×31.9 로 담는다.
      셰이더가 이것으로 강폭·굽이·강변·골짜기·하구를 그린다. 모따기 거리 변환 두 번 (가로는 이어 붙임) */
  function riverField(rivBits) {
    var N = W * H, D = new Uint16Array(N), INF = 8 * 16 + 40, x, y, i, v;
    for (i = 0; i < N; i++) D[i] = (rivBits[i >> 3] >> (i & 7)) & 1 ? 0 : INF;
    var A = 16, B = 23;
    for (var rep = 0; rep < 2; rep++) {
      for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
        i = y * W + x; v = D[i]; if (!v) continue;
        var xl = x ? i - 1 : i + W - 1;
        if (D[xl] + A < v) v = D[xl] + A;
        if (y) {
          var up = i - W, ul = x ? up - 1 : up + W - 1, ur = x < W - 1 ? up + 1 : up - W + 1;
          if (D[up] + A < v) v = D[up] + A; if (D[ul] + B < v) v = D[ul] + B; if (D[ur] + B < v) v = D[ur] + B;
        }
        D[i] = v;
      }
      for (y = H - 1; y >= 0; y--) for (x = W - 1; x >= 0; x--) {
        i = y * W + x; v = D[i]; if (!v) continue;
        var xr = x < W - 1 ? i + 1 : i - W + 1;
        if (D[xr] + A < v) v = D[xr] + A;
        if (y < H - 1) {
          var dn = i + W, dl = x ? dn - 1 : dn + W - 1, dr = x < W - 1 ? dn + 1 : dn - W + 1;
          if (D[dn] + A < v) v = D[dn] + A; if (D[dl] + B < v) v = D[dl] + B; if (D[dr] + B < v) v = D[dr] + B;
        }
        D[i] = v;
      }
    }
    for (i = 0; i < N; i++) { var d = D[i] / 16 * 31.875; geoTex[i * 4 + 2] = d >= 255 ? 0 : 255 - Math.round(d); }
    // A: 강 줄기를 가우스로 흐린 값 (σ 0.75칸) — 대각선으로 이어진 강 칸도 끊기지 않는 매끈한 강줄기가 된다
    var K = [0.0561, 0.2342, 0.4194, 0.2342, 0.0561], tmp = new Float32Array(N), NORM = 1 / 0.53;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x; var acc = 0;
      for (var k = -2; k <= 2; k++) { var xx = (x + k + W) % W, j = y * W + xx; if (!D[j]) acc += K[k + 2]; }
      tmp[i] = acc;
    }
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x; var acc2 = 0;
      for (var k2 = -2; k2 <= 2; k2++) { var yy = y + k2; if (yy < 0 || yy >= H) continue; acc2 += K[k2 + 2] * tmp[yy * W + x]; }
      var c = acc2 * NORM; geoTex[i * 4 + 3] = c >= 1 ? 255 : Math.round(c * 255);
    }
  }
  Geo.geoTexture = function () { return geoTex; };
  Geo.climateTexture = function () { return climTex; };
  Geo.size = function () { return { W: W, H: H, CW: CW, CH: CH }; };

  // ---------------------------------------------------------------- sampling
  function wrapLon(lon) { lon = (lon + 180) % 360; if (lon < 0) lon += 360; return lon - 180; }
  Geo.wrapLon = wrapLon;

  function sampleChan(tex, w, h, fx, fy, ch) {
    // fx,fy in texel space with centers at +0.5 ; bilinear with horizontal wrap
    fx -= 0.5; fy -= 0.5;
    var x0 = Math.floor(fx), y0 = Math.floor(fy);
    var tx = fx - x0, ty = fy - y0;
    var x1 = x0 + 1, y1 = y0 + 1;
    x0 = ((x0 % w) + w) % w; x1 = ((x1 % w) + w) % w;
    if (y0 < 0) y0 = 0; if (y1 < 0) y1 = 0; if (y0 >= h) y0 = h - 1; if (y1 >= h) y1 = h - 1;
    var a = tex[(y0 * w + x0) * 4 + ch], b = tex[(y0 * w + x1) * 4 + ch];
    var c = tex[(y1 * w + x0) * 4 + ch], d = tex[(y1 * w + x1) * 4 + ch];
    return (a + (b - a) * tx) + ((c + (d - c) * tx) - (a + (b - a) * tx)) * ty;
  }

  /** signed distance (texels, >0 land) without coast noise */
  Geo.sdfRaw = function (lon, lat) {
    var fx = (wrapLon(lon) + 180) / 360 * W, fy = (90 - lat) / 180 * H;
    var sf = (sampleChan(geoTex, W, H, fx, fy, 0) - 128) / 16;
    var sc = (sampleChan(geoTex, W, H, fx, fy, 1) - 128) / 2;
    var w = Math.min(1, Math.max(0, (Math.abs(sf) - 6.0) / 1.5));
    w = w * w * (3 - 2 * w);
    return sf + (sc - sf) * w;
  };
  /** signed distance including the coast perturbation — matches rendered coastline */
  Geo.sdf = function (lon, lat) { return Geo.sdfRaw(lon, lat) + coastNoise(wrapLon(lon), lat); };
  Geo.isLand = function (lon, lat) { return Geo.sdf(lon, lat) > 0; };
  /** navigable water with a safety margin (texels) */
  Geo.isSea = function (lon, lat, margin) { return Geo.sdf(lon, lat) < -(margin || 0.25) && !Geo.berg(lon, lat); };
  /** 가장 가까운 강까지 거리 (칸, 8 이상이면 8) */
  Geo.river = function (lon, lat) {
    var fx = (wrapLon(lon) + 180) / 360 * W, fy = (90 - lat) / 180 * H;
    return (255 - sampleChan(geoTex, W, H, fx, fy, 2)) / 31.875;
  };
  /** 빙산 (셰이더 bergs()와 같은 식): 찬 바다에서만, 0.45° 칸마다 하나가 있을 수 있다. 빙산 위면 true — 배가 지나갈 수 없다 */
  var BERG_CB = 0.45;
  Geo.berg = function (lon, lat) {
    if (Math.abs(lat) < 42) return false;     // 따뜻한 바다에는 없다
    var c = Geo.climate(lon, lat);
    var Iw = lat < -55 ? (function () { var t = Math.min(1, Math.max(0, (lat + 57) / -10)); return t * t * (3 - 2 * t); })() : c.ice, Tw = c.t;
    function sm(e0, e1, x) { var t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }
    var a = sm(0.02, 0.30, Iw) + 0.3 * sm(62, 70, Math.abs(lat));
    var b = sm(0.52, 0.30, Tw);
    var fxb = G.FX && G.FX.water && G.FX.water.berg != null ? G.FX.water.berg : 1;
    var dens = a * b * fxb;
    if (dens <= 0.01) return false;
    var px = wrapLon(lon) + 180, py = lat + 90, cx0 = Math.floor(px / BERG_CB), cy0 = Math.floor(py / BERG_CB);
    for (var j = -1; j <= 1; j++) for (var i = -1; i <= 1; i++) {
      var cx = cx0 + i, cy = cy0 + j;
      if (hash2(cx + 5, cy + 5) > dens * 0.40) continue;
      var ctx = (cx + 0.2 + 0.6 * hash2(cx + 13, cy + 1)) * BERG_CB, cty = (cy + 0.2 + 0.6 * hash2(cx + 1, cy + 13)) * BERG_CB;
      var hr = hash2(cx + 19, cy + 7), R = BERG_CB * (0.09 + 0.22 * hr * hr);
      var dx = px - ctx, dy = py - cty, dd = Math.sqrt(dx * dx + dy * dy);
      if (dd > R) continue;
      var id = hash2(cx + 2, cy + 77), ux = dd > 1e-5 ? dx / dd : 1, uy = dd > 1e-5 ? dy / dd : 0, sd;
      if (id >= 0.45) {   // 탁상 빙산: 모서리 둥근 긴 네모
        var a0 = id * 6.2832, ca = Math.cos(a0), sa = Math.sin(a0), asp = 1 + 1.2 * ((id * 7.7) % 1);
        var qx = Math.abs(ca * dx + sa * dy) / R, qy = Math.abs(-sa * dx + ca * dy) / R * asp;
        sd = Math.pow(Math.pow(qx, 4) + Math.pow(qy, 4), 0.25);
      } else sd = dd / (R * (0.62 + 0.38 * vnoise(ux * 3 + id * 13.1, uy * 3 + hr * 7.3)));
      if (sd < 0.95) return true;
    }
    return false;
  };
  /** climate: {t, m, e, ice} 0..1 */
  Geo.climate = function (lon, lat) {
    var fx = (wrapLon(lon) + 180) / 360 * CW, fy = (90 - lat) / 180 * CH;
    return {
      t: sampleChan(climTex, CW, CH, fx, fy, 0) / 255,
      m: sampleChan(climTex, CW, CH, fx, fy, 1) / 255,
      e: sampleChan(climTex, CW, CH, fx, fy, 2) / 255,
      ice: sampleChan(climTex, CW, CH, fx, fy, 3) / 255
    };
  };

  /** terrain class for exploration: 'sea','ice','mountain','desert','jungle','forest','steppe','grass','tundra','snow' */
  Geo.terrain = function (lon, lat) {
    var s = Geo.sdf(lon, lat);
    if (s <= 0) return 'sea';
    var c = Geo.climate(lon, lat);
    var px = lon + 180, py = lat + 90;
    var rn = vnoise(px * 2.2, py * 2.2);
    var ridge = 1 - Math.abs(2 * rn - 1);
    var h = c.e * (0.35 + 0.65 * ridge * ridge);
    var mm = c.m + (vnoise(px * 1.3 + 5.1, py * 1.3 + 5.1) - 0.5) * 0.25;
    if (c.ice > 0.6) return 'ice';
    if (h > 0.62) return 'mountain';
    if (h > 0.42 && c.t < 0.45) return 'snow';
    if (c.t < 0.3) return mm > 0.5 ? 'forest' : 'tundra';
    if (mm < 0.2) return 'desert';
    if (mm < 0.42) return c.t > 0.7 ? 'steppe' : 'steppe';
    if (mm > 0.72 && c.t > 0.72) return 'jungle';
    if (mm > 0.6) return 'forest';
    return 'grass';
  };

  /** great-circle-ish distance in degrees on the flat game map (wraps lon) */
  Geo.dist = function (lon1, lat1, lon2, lat2) {
    var dx = wrapLon(lon2 - lon1), dy = lat2 - lat1;
    return Math.sqrt(dx * dx + dy * dy);
  };
})(window.G = window.G || {});
