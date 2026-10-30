/* 양피지 해도: 미지의 전설과 실제로 거듭 살핀 땅을 따로 그린다. */
(function (G) {
  'use strict';
  var A = G.ChartArt = { revision: 0 }, U = G.U, ready;
  var land, terrain, elevation, sampled, tints;
  var kinds = ['sea', 'grass', 'steppe', 'forest', 'jungle', 'desert', 'mountain', 'snow', 'tundra', 'ice'];
  function C() { return G.FX.chart; }
  function cv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function hash(x, y) { var n = Math.imul(x, 374761393) + Math.imul(y, 668265263); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967295; }
  function noise(x, y) {
    var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    return (hash(ix, iy) * (1 - fx) + hash(ix + 1, iy) * fx) * (1 - fy) + (hash(ix, iy + 1) * (1 - fx) + hash(ix + 1, iy + 1) * fx) * fy;
  }
  A.preload = function () {
    if (!ready) ready = Promise.all(C().motifs.map(function (id) { return G.Img.load('chart/' + id); })).then(function () { A.revision++; });
    return ready;
  };
  function data(i) {
    if (!land) { land = new Uint8Array(720 * 360); terrain = new Uint8Array(720 * 360); elevation = new Uint8Array(720 * 360); sampled = new Uint8Array(720 * 360); tints = new Float32Array(720 * 360 * 3); }
    if (sampled[i]) return;
    var lon = -180 + (i % 720 + 0.5) / 2, lat = 90 - (Math.floor(i / 720) + 0.5) / 2;
    land[i] = G.Geo.isLand(lon, lat) ? 1 : 0;
    if (land[i]) { terrain[i] = Math.max(0, kinds.indexOf(G.Geo.terrain(lon, lat))); elevation[i] = Math.round(G.Geo.climate(lon, lat).e * 255); }
    var c = C(), col = land[i] ? c.terrainColors[terrain[i]] || c.land : c.land;
    var shade = land[i] ? (elevation[i] / 255 - 0.4) * c.relief : 0;
    for (var k = 0; k < 3; k++) tints[i * 3 + k] = col[k] - shade;
    sampled[i] = 1;
  }
  function level(s, i) { return Math.max(s.chartPasses ? s.chartPasses[i] : 0, s.chartBits && (s.chartBits[i >> 3] & (1 << (i & 7))) ? 1 : 0); }
  function mountain(ctx, x, y, size) {
    ctx.beginPath(); ctx.moveTo(x - size, y + size * 0.4); ctx.lineTo(x, y - size); ctx.lineTo(x + size, y + size * 0.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - size); ctx.lineTo(x + size * 0.1, y - size * 0.35); ctx.lineTo(x - size * 0.12, y - size * 0.14); ctx.stroke();
    for (var i = 1; i <= 4; i++) { var dx = i * size * 0.16; ctx.beginPath(); ctx.moveTo(x + dx, y - size + dx * 1.4); ctx.lineTo(x + dx - size * 0.2, y + size * 0.3); ctx.stroke(); }
  }
  function tree(ctx, x, y, size) {
    ctx.beginPath(); ctx.moveTo(x, y + size * 0.5); ctx.lineTo(x, y - size); ctx.moveTo(x - size * 0.5, y); ctx.lineTo(x, y - size); ctx.lineTo(x + size * 0.5, y); ctx.moveTo(x - size * 0.65, y + size * 0.3); ctx.lineTo(x, y - size * 0.5); ctx.lineTo(x + size * 0.65, y + size * 0.3); ctx.stroke();
  }
  /** 읽을 곳은 남겨 두고 종이 가장자리와 여백만 닳고 찢어진 듯 보이게 한다. */
  A.finish = function (ctx, w, h) {
    var c = C(), v = c.wear; if (!v || w < c.motifMinCanvas) return;
    ctx.save();
    // 접었다 편 자국: 짙은 줄 바로 옆에 가는 종이빛을 놓아 솟은 섬유처럼 보인다.
    [0.32, 0.69].forEach(function (f, n) {
      var x = w * f; ctx.strokeStyle = 'rgba(103,70,30,' + v.foldAlpha + ')'; ctx.lineWidth = v.foldWidth;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.bezierCurveTo(x - 4, h * .3, x + 3, h * .7, x - 2, h); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,241,196,' + v.foldLight + ')'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 2, 0); ctx.lineTo(x + 1, h); ctx.stroke();
    });
    ctx.strokeStyle = 'rgba(104,72,32,' + v.foldAlpha + ')'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, h * .46); ctx.bezierCurveTo(w * .3, h * .45, w * .7, h * .47, w, h * .46); ctx.stroke();
    function edge(vertical, far) {
      var extent = vertical ? h : w, points = [], step = v.edgeStep;
      for (var i = 0; i <= extent + step; i += step) {
        var depth = v.edgeDepth * (0.25 + hash(Math.floor(i / step), (vertical ? 11 : 41) + (far ? 3 : 0)) * .75);
        var pos = Math.min(extent, i), side = far ? (vertical ? w : h) - depth : depth;
        points.push(vertical ? [side, pos] : [pos, side]);
      }
      ctx.fillStyle = v.backing; ctx.beginPath();
      if (vertical) { ctx.moveTo(far ? w : 0, 0); ctx.lineTo(far ? w : 0, h); }
      else { ctx.moveTo(0, far ? h : 0); ctx.lineTo(w, far ? h : 0); }
      for (var j = points.length - 1; j >= 0; j--) ctx.lineTo(points[j][0], points[j][1]);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = v.edgeInk; ctx.lineWidth = 1.6; ctx.beginPath();
      points.forEach(function (p, k) { if (!k) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); }); ctx.stroke();
    }
    edge(false, false); edge(false, true); edge(true, false); edge(true, true);
    function tear(x, y, flip) {
      ctx.save(); ctx.translate(x, y); ctx.scale(flip, 1);
      ctx.fillStyle = v.backing; ctx.beginPath(); ctx.moveTo(0, -v.tearWidth); ctx.lineTo(v.tearLength * .42, -2);
      ctx.lineTo(v.tearLength * .6, -4); ctx.lineTo(v.tearLength, 1); ctx.lineTo(v.tearLength * .45, 3); ctx.lineTo(0, v.tearWidth); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(245,224,170,.70)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, v.tearWidth); ctx.lineTo(v.tearLength * .45, 4); ctx.lineTo(v.tearLength, 1); ctx.stroke(); ctx.restore();
    }
    tear(0, h * .25, 1); tear(w, h * .74, -1);
    // 펜 끝에 맺힌 작은 먹방울과 짧은 흘러내림. 큰 얼룩으로 지도를 덮지 않는다.
    [[.87, .09], [.11, .82], [.96, .39]].forEach(function (p, i) {
      var x = w * p[0], y = h * p[1], len = v.dripLength * (.6 + hash(i, 9) * .4);
      ctx.fillStyle = 'rgba(43,29,19,' + v.inkAlpha + ')'; ctx.beginPath(); ctx.ellipse(x, y, 2.2, 1.5, .4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(43,29,19,' + (v.inkAlpha * .65) + ')'; ctx.lineWidth = .85;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 1.5, y + len * .3, x - 1, y + len * .7, x + .6, y + len); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + .6, y + len, .8, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  };
  A.terrain = function (w, h, box) {
    var c = C(), s = G.Game.state, lonSpan = box.lon1 - box.lon0, latSpan = box.lat1 - box.lat0;
    var out = cv(w, h), ctx = out.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
    var levels = new Uint8Array(w * h), cls = new Uint8Array(w * h), dist = new Uint16Array(w * h);
    var unknown = cv(w, h), ux = unknown.getContext('2d'), ui = ux.createImageData(w, h);
    var mask3 = cv(w, h), m3 = mask3.getContext('2d'), i3 = m3.createImageData(w, h);
    var mask4 = cv(w, h), m4 = mask4.getContext('2d'), i4 = m4.createImageData(w, h);
    var xs = new Float64Array(w), gx = new Int32Array(w), fine = lonSpan / w < c.fineCoast;
    var stats = { unknown: 0, outline: 0, river: 0, mountain: 0, terrain: 0, motifs: 0 };
    var paper = new Float32Array(w * h);
    for (var x = 0; x < w; x++) { xs[x] = box.lon0 + (x + 0.5) / w * lonSpan; gx[x] = U.clamp(Math.floor((G.Geo.wrapLon(xs[x]) + 180) * 2), 0, 719); }
    for (var y = 0; y < h; y++) {
      var lat = box.lat1 - (y + 0.5) / h * latSpan, gy = Math.floor((90 - lat) * 2), valid = gy >= 0 && gy < 360;
      for (x = 0; x < w; x++) {
        var pi = y * w + x, o = pi * 4, gi = U.clamp(gy, 0, 359) * 720 + gx[x], lv = valid ? level(s, gi) : 0;
        levels[pi] = lv;
        // 지도 위치에 따라 이어지는 종이의 섬유와 얼룩.
        var grain = (hash(x, y) - 0.5) * c.grain + (noise(xs[x] * 0.7, lat * 0.7) - 0.5) * c.stain;
        paper[pi] = grain;
        var col = c.paper, r = col[0], g = col[1], b = col[2];
        if (lv || box.reveal) {
          data(gi); var isLand = fine ? G.Geo.sdfRaw(xs[x], lat) > 0 : !!land[gi];
          cls[pi] = isLand ? 2 : 1;
          col = isLand ? c.land : c.sea;
          r = col[0]; g = col[1]; b = col[2];
          if (lv >= 4 && isLand) {
            // 지형의 채색은 칸 경계에서 끊기지 않게 이어 준다.
            var tx = (G.Geo.wrapLon(xs[x]) + 180) * 2 - 0.5, ty = (90 - lat) * 2 - 0.5;
            var ix = Math.floor(tx), iy = Math.floor(ty), fx = tx - ix, fy = ty - iy;
            fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
            var xa = ((ix % 720) + 720) % 720, xb = (xa + 1) % 720, ya = U.clamp(iy, 0, 359), yb = U.clamp(iy + 1, 0, 359);
            var a = ya * 720 + xa, bb = ya * 720 + xb, cc = yb * 720 + xa, dd = yb * 720 + xb;
            data(a); data(bb); data(cc); data(dd);
            var ca = (1 - fx) * (1 - fy), cb = fx * (1 - fy), ccw = (1 - fx) * fy, cd = fx * fy;
            r = tints[a*3]*ca + tints[bb*3]*cb + tints[cc*3]*ccw + tints[dd*3]*cd;
            g = tints[a*3+1]*ca + tints[bb*3+1]*cb + tints[cc*3+1]*ccw + tints[dd*3+1]*cd;
            b = tints[a*3+2]*ca + tints[bb*3+2]*cb + tints[cc*3+2]*ccw + tints[dd*3+2]*cd; stats.terrain++;
          }
          if (lv >= 2 && isLand && G.Geo.river(xs[x], lat) < c.riverWidth) { r = c.river[0]; g = c.river[1]; b = c.river[2]; stats.river++; }
          if (!lv && box.reveal) { r = r * 0.35 + c.paper[0] * 0.65; g = g * 0.35 + c.paper[1] * 0.65; b = b * 0.35 + c.paper[2] * 0.65; }
        }
        if (!lv) { ui.data[o + 3] = 255; stats.unknown++; }
        else { dist[pi] = 60000; stats.outline++; }
        if (lv >= 3) i3.data[o + 3] = 255;
        if (lv >= 4) i4.data[o + 3] = 255;
        d[o] = r + grain; d[o + 1] = g + grain; d[o + 2] = b + grain; d[o + 3] = 255;
      }
    }
    // 탐사 경계는 종이로 스며드는 먹처럼. 미지의 쪽에는 실제 땅·강을 그리지 않는다.
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      var p = y * w + x; if (!dist[p]) continue;
      if (x) dist[p] = Math.min(dist[p], dist[p - 1] + 1);
      if (y) dist[p] = Math.min(dist[p], dist[p - w] + 1);
    }
    for (y = h - 1; y >= 0; y--) for (x = w - 1; x >= 0; x--) {
      p = y * w + x; if (!dist[p]) continue;
      if (x < w - 1) dist[p] = Math.min(dist[p], dist[p + 1] + 1);
      if (y < h - 1) dist[p] = Math.min(dist[p], dist[p + w] + 1);
      o = p * 4;
      if (dist[p] < c.edgeFade) {
        var fade = U.clamp((dist[p] + (noise(xs[x] * 4, (box.lat1 - y / h * latSpan) * 4) - 0.5) * c.edgeRagged) / c.edgeFade, 0, 1);
        for (var k = 0; k < 3; k++) d[o + k] = d[o + k] * fade + (c.paper[k] + paper[p]) * (1 - fade);
      }
      if (x < w - 1 && y < h - 1 && cls[p] && ((cls[p + 1] && cls[p] !== cls[p + 1]) || (cls[p + w] && cls[p] !== cls[p + w]))) {
        for (k = 0; k < 3; k++) d[o + k] = d[o + k] * 0.3 + c.ink[k] * 0.7;
      }
    }
    ctx.putImageData(img, 0, 0); ux.putImageData(ui, 0, 0); m3.putImageData(i3, 0, 0); m4.putImageData(i4, 0, 0);
    function px(lon, lat) { return [(lon - box.lon0) / lonSpan * w, (box.lat1 - lat) / latSpan * h]; }
    // 먹선으로 그린 산과 숲도 각각 세 번·네 번 살핀 범위에만 남긴다.
    var detail = cv(w, h), dx = detail.getContext('2d'), step = Math.max(c.detailMinStep, lonSpan / w * c.detailGap), size = c.mountainSize;
    dx.strokeStyle = c.mountainInk; dx.lineWidth = 0.75;
    for (var lt = Math.ceil(box.lat0 / step) * step; lt <= box.lat1; lt += step) for (var ln = Math.ceil(box.lon0 / step) * step; ln <= box.lon1; ln += step) {
      if (G.State.chartLevel(ln, lt) < 3 || !G.Geo.isLand(ln, lt)) continue;
      var e = G.Geo.climate(ln, lt).e, kind = G.Geo.terrain(ln, lt);
      if (kind !== 'mountain' && kind !== 'snow' && e < c.mountainFrom) continue;
      var q = px(ln, lt); mountain(dx, q[0], q[1], size * (0.7 + e)); stats.mountain++;
    }
    dx.globalCompositeOperation = 'destination-in'; dx.drawImage(mask3, 0, 0); ctx.drawImage(detail, 0, 0);
    dx.globalCompositeOperation = 'source-over'; dx.clearRect(0, 0, w, h); dx.strokeStyle = c.forestInk;
    for (lt = Math.ceil(box.lat0 / step) * step; lt <= box.lat1; lt += step) for (ln = Math.ceil(box.lon0 / step) * step; ln <= box.lon1; ln += step) {
      if (G.State.chartLevel(ln, lt) < 4) continue;
      kind = G.Geo.terrain(ln, lt); if (kind !== 'forest' && kind !== 'jungle') continue;
      q = px(ln, lt); tree(dx, q[0], q[1], c.treeSize);
    }
    dx.globalCompositeOperation = 'destination-in'; dx.drawImage(mask4, 0, 0); ctx.drawImage(detail, 0, 0);
    // 경위선과 항해자가 자로 그은 방위선.
    var grid = lonSpan > 120 ? 30 : lonSpan > 40 ? 10 : 5;
    ctx.strokeStyle = c.gridInk; ctx.lineWidth = 0.7;
    for (ln = Math.ceil(box.lon0 / grid) * grid; ln <= box.lon1; ln += grid) { q = px(ln, 0); ctx.beginPath(); ctx.moveTo(q[0], 0); ctx.lineTo(q[0], h); ctx.stroke(); }
    for (lt = Math.ceil(box.lat0 / grid) * grid; lt <= box.lat1; lt += grid) { q = px(0, lt); ctx.beginPath(); ctx.moveTo(0, q[1]); ctx.lineTo(w, q[1]); ctx.stroke(); }
    if (w >= c.motifMinCanvas && !box.reveal) {
      dx.globalCompositeOperation = 'source-over'; dx.clearRect(0, 0, w, h); dx.strokeStyle = c.rhumbInk; dx.lineWidth = 0.6;
      var motifGrid = c.motifGrid;
      for (var ay = 0; ay < motifGrid.rows; ay++) for (var ax = 0; ax < motifGrid.cols; ax++) {
        var mlon = motifGrid.lon + ax * motifGrid.lonStep, mlat = motifGrid.lat + ay * motifGrid.latStep;
        if (mlon < box.lon0 - 20 || mlon > box.lon1 + 20 || mlat < box.lat0 - 20 || mlat > box.lat1 + 20 || G.State.chartLevel(mlon, mlat)) continue;
        var id = c.motifs[(ax * 11 + ay * 7) % c.motifs.length], key = 'chart/' + id, art = G.Img.get(key);
        if (!art) { G.Img.want(key); continue; }
        q = px(mlon, mlat); var sz = U.clamp(w / lonSpan * c.motifWorldSize, c.motifMinSize, c.motifMaxSize), hh = sz * art.height / art.width;
        dx.globalAlpha = c.motifAlpha; dx.drawImage(art, q[0] - sz / 2, q[1] - hh / 2, sz, hh); stats.motifs++;
        if (id === 'compass') {
          dx.globalAlpha = 1;
          for (var ray = 0; ray < 16; ray++) { var ang = ray * Math.PI / 8; dx.beginPath(); dx.moveTo(q[0], q[1]); dx.lineTo(q[0] + Math.cos(ang) * w * 2, q[1] + Math.sin(ang) * w * 2); dx.stroke(); }
        }
      }
      dx.globalAlpha = 1; dx.globalCompositeOperation = 'destination-in'; dx.drawImage(unknown, 0, 0); ctx.drawImage(detail, 0, 0);
    }
    var vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.65);
    vignette.addColorStop(0, 'rgba(89,53,19,0)'); vignette.addColorStop(1, 'rgba(89,53,19,.18)'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, w, h);
    out._chartStats = stats; return out;
  };
})(window.G = window.G || {});
