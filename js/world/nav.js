/* Sea navigation: coarse passability grid + A* path finding + path smoothing. */
(function (G) {
  'use strict';
  var N = {};
  G.Nav = N;
  var RES = 4;              // cells per degree
  var GW = 360 * RES, GH = 170 * RES, LAT0 = 85; // rows from lat 85 down to -85
  var pass = null;          // 0 뭍, 1 물가에 걸친 칸, 2 트인 바다
  var rep = null;           // 칸의 대표점: 3×3 부분 격자 가운데 가장 깊은 물 (4 = 칸 가운데)
  var edge = null;          // 물가 칸 사이 길목 판정 캐시: 0 모름, 1 지나감, 2 막힘 (칸×8방향)
  var near = null;          // 트인 바다 칸이지만 뭍이 가까움(작은 섬·곶이 칸 사이에 숨을 수 있다) → 길목을 따져 본다
  var SUB = 0.3 / RES;      // 부분 격자 간격(°)

  function build() {
    var t0 = (typeof performance !== 'undefined' ? performance.now() : 0);
    pass = new Uint8Array(GW * GH);
    rep = new Uint8Array(GW * GH);
    edge = new Uint8Array(GW * GH * 8);
    near = new Uint8Array(GW * GH);
    var Geo = G.Geo;
    for (var y = 0; y < GH; y++) {
      var lat = LAT0 - (y + 0.5) / RES;
      for (var x = 0; x < GW; x++) {
        var lon = -180 + (x + 0.5) / RES, i = y * GW + x;
        var s = Geo.sdfRaw(lon, lat);
        rep[i] = 4;
        if (s < -0.9) { pass[i] = 2; if (s > -N.NEAR_TX) near[i] = 1; }          // 트인 바다 (뭍이 가까우면 표시)
        else if (s < 1.8) {
          // 물가: 3×3 부분 격자에서 가장 깊은 물을 찾아, 충분히 물이면 지나갈 수 있는 칸으로 (좁은 해협)
          var best = 99, bk = 4;
          for (var k = 0; k < 9; k++) {
            var v = Geo.sdf(lon + ((k % 3) - 1) * SUB, lat - (((k / 3) | 0) - 1) * SUB);
            if (v < best) { best = v; bk = k; }
          }
          if (best < -0.35) { pass[i] = 1; rep[i] = bk; }
        }
      }
    }
    N.buildMs = (typeof performance !== 'undefined' ? performance.now() : 0) - t0;
  }
  /** 칸의 대표점 [경도, 위도] */
  function repPoint(i) {
    var x = i % GW, y = (i - x) / GW, k = rep[i];
    return [-180 + (x + 0.5) / RES + ((k % 3) - 1) * SUB, LAT0 - (y + 0.5) / RES - (((k / 3) | 0) - 1) * SUB];
  }
  var OPP = [1, 0, 3, 2, 7, 6, 5, 4];
  /** 물가 칸이 낀 길목: 두 대표점을 잇는 선이 뭍을 가로지르지 않아야 한다 */
  function edgeOK(a, b, k) {
    var c = edge[a * 8 + k];
    if (c) return c === 1;
    var p = repPoint(a), q = repPoint(b);
    var dx = G.Geo.wrapLon(q[0] - p[0]), dy = q[1] - p[1], n = Math.max(2, Math.ceil(Math.sqrt(dx * dx + dy * dy) / 0.025)), ok = true;
    for (var j = 1; j < n && ok; j++) if (G.Geo.sdf(p[0] + dx * j / n, p[1] + dy * j / n) > 0.15) ok = false;
    edge[a * 8 + k] = edge[b * 8 + OPP[k]] = ok ? 1 : 2;
    return ok;
  }
  var comp = null;
  /** label connected water bodies so targets snap to the sea the ship is actually in */
  function label() {
    comp = new Int32Array(GW * GH); var id = 0, q = new Int32Array(GW * GH);
    for (var i = 0; i < GW * GH; i++) {
      if (!pass[i] || comp[i]) continue;
      id++; var h = 0, t = 0; q[t++] = i; comp[i] = id;
      while (h < t) {
        var c = q[h++], x = c % GW, y = (c - x) / GW;
        for (var k = 0; k < 4; k++) {
          var nx = x + (k === 0 ? 1 : k === 1 ? -1 : 0), ny = y + (k === 2 ? 1 : k === 3 ? -1 : 0);
          if (ny < 0 || ny >= GH) continue; if (nx < 0) nx += GW; else if (nx >= GW) nx -= GW;
          var ni = ny * GW + nx; if (pass[ni] && !comp[ni]) { comp[ni] = id; q[t++] = ni; }
        }
      }
    }
  }
  N.COAST = 2;     // 물가 칸의 비용 배수
  N.NEAR_TX = 4;   // 뭍에서 이만큼(텍셀, 약 0.35°) 안의 트인 바다 칸도 길목이 뭍을 가로지르는지 따진다 (칸 사이에 숨은 작은 섬·곶)
  N.HW = 1.15;     // 휴리스틱 가중치 (1이면 최단, 클수록 빠르지만 길이 굽는다)
  N.ready = function () { return !!pass; };
  N.init = function () { if (!pass) { build(); label(); } };
  N.component = function (lon, lat) { N.init(); var c = cellOf(lon, lat); return comp[c[1] * GW + c[0]]; };
  function cellOf(lon, lat) {
    var x = Math.floor((G.Geo.wrapLon(lon) + 180) * RES), y = Math.floor((LAT0 - lat) * RES);
    return [((x % GW) + GW) % GW, Math.max(0, Math.min(GH - 1, y))];
  }

  /** (lon,lat)에서 p까지 곧게 물로 이어지는가 (뭍을 넘지 않는가) */
  function wetLine(lon, lat, p) {
    var dx = G.Geo.wrapLon(p[0] - lon), dy = p[1] - lat, n = Math.max(2, Math.ceil(Math.sqrt(dx * dx + dy * dy) / 0.02));
    for (var j = 1; j < n; j++) if (G.Geo.sdf(lon + dx * j / n, lat + dy * j / n) > 0.15) return false;
    return true;
  }
  /** nearest passable cell center to (lon,lat) within r cells.
      wet = true면 그 자리에서 곧게 물로 이어지는 칸을 먼저 고른다 (섬·곶 너머의 칸으로 붙지 않게 — 예: 솔렌트 안의 배가 와이트 섬 남쪽 칸으로) */
  N.nearestSea = function (lon, lat, r, want, wet) {
    N.init();
    var c = cellOf(lon, lat); r = r || 24;
    function ok(i) { return pass[i] && (!want || comp[i] === want); }
    if (ok(c[1] * GW + c[0])) return [lon, lat];
    var first = null;
    for (var k = 1; k <= r; k++) {
      var cand = [];
      for (var dy = -k; dy <= k; dy++) for (var dx = -k; dx <= k; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== k) continue;
        var x = ((c[0] + dx) % GW + GW) % GW, y = c[1] + dy; if (y < 0 || y >= GH) continue;
        if (ok(y * GW + x)) cand.push([dx * dx + dy * dy, y * GW + x]);
      }
      if (!cand.length) continue;
      cand.sort(function (a, b) { return a[0] - b[0]; });
      if (!wet) return repPoint(cand[0][1]);
      if (!first) first = repPoint(cand[0][1]);
      for (var q = 0; q < cand.length; q++) { var rp = repPoint(cand[q][1]); if (wetLine(lon, lat, rp)) return rp; }
      if (k >= 6) return first;          // 가까이에 곧게 닿는 칸이 없으면 가장 가까운 칸
    }
    return first;
  };

  // ---------------------------------------------------------------- binary heap
  function Heap() { this.k = []; this.v = []; }
  Heap.prototype.push = function (key, val) {
    var k = this.k, v = this.v, i = k.length; k.push(key); v.push(val);
    while (i > 0) { var p = (i - 1) >> 1; if (k[p] <= key) break; k[i] = k[p]; v[i] = v[p]; i = p; }
    k[i] = key; v[i] = val;
  };
  Heap.prototype.pop = function () {
    var k = this.k, v = this.v, top = v[0], lk = k.pop(), lv = v.pop(), n = k.length;
    if (n) {
      var i = 0;
      for (;;) { var l = 2 * i + 1, r = l + 1, m = i, mk = lk; if (l < n && k[l] < mk) { m = l; mk = k[l]; } if (r < n && k[r] < mk) { m = r; mk = k[r]; } if (m === i) break; k[i] = k[m]; v[i] = v[m]; i = m; }
      k[i] = lk; v[i] = lv;
    }
    return top;
  };
  Heap.prototype.size = function () { return this.k.length; };

  var gScore = null, came = null, stamp = null, closed = null, curStamp = 0;
  /** A* from (lon0,lat0) to (lon1,lat1). returns array of [lon,lat] (smoothed) or null */
  N.path = function (lon0, lat0, lon1, lat1, maxNodes) {
    // 먼저 물가 길목을 꼼꼼히 따져 찾고, 없으면(자료가 거친 해협) 예전처럼 느슨하게 찾는다
    return search(lon0, lat0, lon1, lat1, maxNodes, true) || search(lon0, lat0, lon1, lat1, maxNodes, false);
  };
  function search(lon0, lat0, lon1, lat1, maxNodes, strict) {
    N.init();
    if (!gScore) { gScore = new Float32Array(GW * GH); came = new Int32Array(GW * GH); stamp = new Uint32Array(GW * GH); closed = new Uint32Array(GW * GH); }
    curStamp++;
    var s = cellOf(lon0, lat0), t = cellOf(lon1, lat1);
    var si = s[1] * GW + s[0], ti = t[1] * GW + t[0];
    var s0 = null;
    if (!pass[si]) { s0 = N.nearestSea(lon0, lat0, 8, 0, true); if (!s0) return null; s = cellOf(s0[0], s0[1]); si = s[1] * GW + s[0]; }
    if (!pass[ti] || comp[ti] !== comp[si]) { var ns = N.nearestSea(lon1, lat1, 60, comp[si], true); if (!ns) return null; t = cellOf(ns[0], ns[1]); ti = t[1] * GW + t[0]; lon1 = ns[0]; lat1 = ns[1]; }
    var tx = t[0], ty = t[1];
    function h(x, y) { var dx = Math.abs(x - tx); if (dx > GW / 2) dx = GW - dx; var dy = Math.abs(y - ty); return (dx + dy) + (1.4142 - 2) * Math.min(dx, dy); }
    var open = new Heap();
    stamp[si] = curStamp; gScore[si] = 0; came[si] = -1;
    open.push(h(s[0], s[1]), si);
    var n = 0, found = false, mx = maxNodes || GW * GH;
    var DX = [1, -1, 0, 0, 1, 1, -1, -1], DY = [0, 0, 1, -1, 1, -1, 1, -1], DC = [1, 1, 1, 1, 1.4142, 1.4142, 1.4142, 1.4142];
    while (open.size()) {
      var cur = open.pop();
      if (closed[cur] === curStamp) continue;
      closed[cur] = curStamp;
      if (cur === ti) { found = true; break; }
      if (++n > mx) break;
      var cx = cur % GW, cy = (cur - cx) / GW, g0 = gScore[cur];
      for (var k = 0; k < 8; k++) {
        var nx = cx + DX[k], ny = cy + DY[k];
        if (ny < 0 || ny >= GH) continue;
        if (nx < 0) nx += GW; else if (nx >= GW) nx -= GW;
        var ni = ny * GW + nx;
        if (!pass[ni]) continue;
        if (k >= 4 && (!pass[cy * GW + nx] || !pass[ny * GW + cx])) continue; // no corner cutting
        if (strict && (pass[cur] === 1 || pass[ni] === 1 || near[cur] || near[ni]) && !edgeOK(cur, ni, k)) continue;   // 곶·지협·작은 섬을 가로지르지 않는다
        // 물가 칸(1)은 조금 비싸게: 되도록 트인 바다로 간다
        var ng = g0 + DC[k] * (pass[ni] === 1 ? N.COAST : 1);
        if (closed[ni] === curStamp || (stamp[ni] === curStamp && ng >= gScore[ni])) continue;
        stamp[ni] = curStamp; gScore[ni] = ng; came[ni] = cur;
        open.push(ng + h(nx, ny) * N.HW, ni);
      }
    }
    if (!found) return null;
    var cells = [];
    for (var c = ti; c !== -1; c = came[c]) cells.push(c);
    cells.reverse();
    var pts = cells.map(repPoint);
    pts[0] = [lon0, lat0]; pts[pts.length - 1] = [lon1, lat1];
    // 배가 칸 밖(얕은 물가)에 있어 가까운 칸으로 붙였는데 곧게 닿지 않으면, 그 칸의 대표점을 먼저 들르게 한다
    if (s0 && !wetLine(lon0, lat0, cells.length > 1 ? repPoint(cells[1]) : [lon1, lat1])) pts.splice(1, 0, s0);
    return N.smooth(unwrap(pts));
  }
  /** make longitudes continuous along the path (no jumps of 360) */
  function unwrap(pts) {
    for (var i = 1; i < pts.length; i++) {
      var d = pts[i][0] - pts[i - 1][0];
      if (d > 180) pts[i][0] -= 360; else if (d < -180) pts[i][0] += 360;
    }
    return pts;
  }
  N.clear = function (a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy), n = Math.ceil(len / 0.02);   // 0.02° 간격 (예전 0.06°는 작은 섬·곶 끝을 건너뛰었다)
    for (var i = 1; i < n; i++) { var t = i / n; if (!G.Geo.isSea(a[0] + dx * t, a[1] + dy * t, 0.3)) return false; }
    return true;
  };
  N.smooth = function (pts) {
    if (pts.length <= 2) return pts;
    var out = [pts[0]], i = 0;
    while (i < pts.length - 1) {
      var j = Math.min(pts.length - 1, i + 60);
      while (j > i + 1 && !N.clear(pts[i], pts[j])) j--;
      out.push(pts[j]); i = j;
    }
    return out;
  };
})(window.G = window.G || {});
