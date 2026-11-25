/* 뭍길 찾기 (G.LandNav) — 2026-11-19 동식물 QA 100판 수정
   탐험대는 누른 곳까지 곧장 걸어서, 큰 호수·만·강어귀가 가로막으면 「물가에 막혀 더 나아갈 수 없습니다」로 멈췄다
   (QA: 알림 133번 · 빅토리아 호수 앞 진주모나비 75일). 곧은 길이 물을 건너면 출발점과 목표를 감싼 창 안에서
   뭍 칸(0.25°)만 밟는 A*로 둘러 가는 길을 찾아, 걷는 길(st.path)에 이어 붙인다 (js/scenes/land.js routeTo).
   · 뭍 칸: 칸 가운데가 뭍(sdf > LN.LAND)이고 이웃 칸으로 가는 선이 물을 건너지 않는 곳
   · 창: 두 점을 감싼 사각형 + LN.PAD°, 한 변이 LN.MAXSPAN°를 넘으면 찾지 않는다(대륙 횡단은 사람이 길을 잡는다)
   · 결과: [[경도, 위도] …] (출발점 빼고 목표 포함) 또는 null(뭍으로 이어지지 않음) */
(function (G) {
  'use strict';
  var LN = G.LandNav = {};
  LN.RES = 4;         // 1°에 칸 4개
  LN.PAD = 4;         // 창 둘레 여유(°)
  LN.MAXSPAN = 50;    // 창 한 변의 최대 길이(°)
  LN.LAND = 0.06;     // 뭍으로 치는 sdf
  LN.MAXNODES = 60000;
  function sdf(lon, lat) { return G.Hydro && G.Hydro.ready ? (G.Hydro.canWalk(lon,lat) ? 1 : -1) : G.Geo.sdf(lon, lat); }
  /** a에서 b까지 곧게 뭍으로만 이어지나 (0.04° 간격) */
  LN.clear = function (a, b) {
    var dx = G.Geo.wrapLon(b[0] - a[0]), dy = b[1] - a[1], n = Math.max(2, Math.ceil(Math.sqrt(dx * dx + dy * dy) / 0.012));
    for (var i = 0; i <= n; i++) if (sdf(G.Geo.wrapLon(a[0] + dx * i / n), a[1] + dy * i / n) <= 0) return false;
    return true;
  };
  LN.path = function (lon0, lat0, lon1, lat1) {
    var R = LN.RES, dlon = G.Geo.wrapLon(lon1 - lon0);
    var minLon = Math.min(lon0, lon0 + dlon) - LN.PAD, maxLon = Math.max(lon0, lon0 + dlon) + LN.PAD;
    var minLat = Math.max(-84, Math.min(lat0, lat1) - LN.PAD), maxLat = Math.min(84, Math.max(lat0, lat1) + LN.PAD);
    if (maxLon - minLon > LN.MAXSPAN || maxLat - minLat > LN.MAXSPAN) return null;
    var W = Math.ceil((maxLon - minLon) * R), H = Math.ceil((maxLat - minLat) * R), N = W * H;
    var land = new Int8Array(N);   // 0 모름, 1 뭍, 2 물
    function lonOf(x) { return minLon + (x + 0.5) / R; }
    function latOf(y) { return minLat + (y + 0.5) / R; }
    function isL(i) { if (!land[i]) { var x = i % W, y = (i - x) / W; land[i] = sdf(G.Geo.wrapLon(lonOf(x)), latOf(y)) > LN.LAND ? 1 : 2; } return land[i] === 1; }
    function cell(lon, lat) { var x = Math.floor((lon - minLon) * R), y = Math.floor((lat - minLat) * R); return [Math.max(0, Math.min(W - 1, x)), Math.max(0, Math.min(H - 1, y))]; }   // lon은 출발 경도에 이어 붙인 값 (날짜변경선을 넘어도)
    // 출발·도착 칸 (가장 가까운 뭍 칸)
    function snap(lon, lat) {
      var c = cell(lon, lat);
      for (var r = 0; r < 6; r++) for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        var x = c[0] + dx, y = c[1] + dy; if (x < 0 || y < 0 || x >= W || y >= H) continue;
        if (isL(y * W + x) && LN.clear([lon, lat], [lonOf(x), latOf(y)])) return y * W + x;
      }
      return -1;
    }
    var s0 = snap(lon0, lat0), g0 = snap(lon0 + dlon, lat1);
    if (s0 < 0 || g0 < 0) return null;
    var gx = g0 % W, gy = (g0 - gx) / W;
    var gs = new Float32Array(N).fill(1e9), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    var heapK = [], heapV = [];
    function push(k, v) { var i = heapK.length; heapK.push(k); heapV.push(v); while (i > 0) { var p = (i - 1) >> 1; if (heapK[p] <= k) break; heapK[i] = heapK[p]; heapV[i] = heapV[p]; i = p; } heapK[i] = k; heapV[i] = v; }
    function pop() { var top = heapV[0], lk = heapK.pop(), lv = heapV.pop(), n = heapK.length; if (n) { var i = 0; for (;;) { var l = 2 * i + 1, r = l + 1, m = i, mk = lk; if (l < n && heapK[l] < mk) { m = l; mk = heapK[l]; } if (r < n && heapK[r] < mk) { m = r; mk = heapK[r]; } if (m === i) break; heapK[i] = heapK[m]; heapV[i] = heapV[m]; i = m; } heapK[i] = lk; heapV[i] = lv; } return top; }
    function h(i) { var x = i % W, y = (i - x) / W; return Math.hypot(x - gx, y - gy); }
    gs[s0] = 0; push(h(s0), s0);
    var DX = [1, -1, 0, 0, 1, 1, -1, -1], DY = [0, 0, 1, -1, 1, -1, 1, -1], nodes = 0, found = false;
    while (heapK.length && nodes < LN.MAXNODES) {
      var c = pop(); if (closed[c]) continue; closed[c] = 1; nodes++;
      if (c === g0) { found = true; break; }
      var cx = c % W, cy = (c - cx) / W;
      for (var k = 0; k < 8; k++) {
        var nx = cx + DX[k], ny = cy + DY[k]; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        var ni = ny * W + nx; if (closed[ni] || !isL(ni)) continue;
        if (k >= 4 && (!isL(cy * W + nx) || !isL(ny * W + cx))) continue;   // 대각선은 두 옆 칸도 뭍일 때만 (좁은 물목을 비스듬히 건너지 않게)
        // 두 칸 가운데가 뭍이어도 사이에 좁은 강·물목이 있을 수 있다.
        if (!LN.clear([lonOf(cx), latOf(cy)], [lonOf(nx), latOf(ny)])) continue;
        var effect = G.Hydro && G.Hydro.ready ? G.Hydro.landEffect(G.Geo.wrapLon(lonOf(nx)),latOf(ny)) : null;
        var g = gs[c] + (k >= 4 ? 1.414 : 1) / Math.max(.04,effect ? effect.speed : 1);
        if (g < gs[ni]) { gs[ni] = g; came[ni] = c; push(g + h(ni) * 1.05, ni); }
      }
    }
    LN.lastNodes = nodes;
    if (!found) return null;
    var pts = [], i = g0;
    while (i >= 0 && i !== s0) { var x = i % W, y = (i - x) / W; pts.push([G.Geo.wrapLon(lonOf(x)), latOf(y)]); i = came[i]; }
    pts.reverse();
    // 목표 칸의 중심에서 실제 클릭한 자리까지도 물을 건너지 않아야 한다.
    pts.push([G.Geo.wrapLon(lon0 + dlon), lat1]);
    // 다듬기: 곧게 뭍으로 이어지는 데까지 건너뛴다
    var out = [], cur = [lon0, lat0], j = 0;
    while (j < pts.length) {
      var far = j;
      for (var q = Math.min(pts.length - 1, j + 80); q > j; q--) if (LN.clear(cur, pts[q])) { far = q; break; }
      if (!LN.clear(cur, pts[far])) return null;
      out.push(pts[far]); cur = pts[far]; j = far + 1;
    }
    return out;
  };
})(window.G = window.G || {});
