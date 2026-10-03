/* 배 3D 렌더러의 재질 그림(캔버스로 그리는 판재·돛천·지붕). 같은 씨앗이면 늘 같은 그림이 나온다.
   tools/ship3d/bake.py → render.js → page.html 이 불러 쓴다. 게임 실행에는 쓰지 않는다. */
(function (root) {
  'use strict';
  var X = root.Ship3DTex = {};

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0; var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  X.rng = rng;
  function hex(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function css(c, k, a) {
    k = k == null ? 1 : k;
    var r = Math.max(0, Math.min(255, Math.round(c[0] * k))), g = Math.max(0, Math.min(255, Math.round(c[1] * k))), b = Math.max(0, Math.min(255, Math.round(c[2] * k)));
    return a == null ? 'rgb(' + r + ',' + g + ',' + b + ')' : 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }
  X.hex = hex; X.css = css;
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* 판재: 가로로 긴 널빤지 줄. rows 줄, 이음매·나뭇결·나무못. clinker면 겹친 판(아래 가장자리 그늘) */
  X.planks = function (opt) {
    var W = opt.w || 512, H = opt.h || 512, rows = opt.rows || 16, base = hex(opt.color), seam = hex(opt.seam || '#1b0f07');
    var r = rng(opt.seed || 7), c = canvas(W, H), g = c.getContext('2d'), rh = H / rows;
    for (var i = 0; i < rows; i++) {
      var y0 = i * rh, x = -r() * 200;
      while (x < W) {
        var len = (opt.minLen || 150) + r() * (opt.varLen || 180), k = 0.86 + r() * 0.26;
        g.fillStyle = css(base, k); g.fillRect(x, y0, len, rh);
        // 나뭇결
        for (var s = 0; s < 7; s++) {
          var gy = y0 + 2 + r() * (rh - 4);
          g.strokeStyle = css(base, r() < 0.5 ? 0.72 : 1.22, 0.10 + r() * 0.12); g.lineWidth = 0.6 + r() * 1.1;
          g.beginPath(); g.moveTo(x, gy);
          g.bezierCurveTo(x + len * 0.3, gy + (r() - 0.5) * 3, x + len * 0.7, gy + (r() - 0.5) * 3, x + len, gy + (r() - 0.5) * 2); g.stroke();
        }
        // 맞댄 이음과 나무못
        g.fillStyle = css(seam, 1, 0.75); g.fillRect(x, y0, 2.2, rh);
        if (opt.nails !== false) {
          g.fillStyle = css(seam, 1.4, 0.55);
          g.beginPath(); g.arc(x + 6, y0 + rh * 0.3, 1.4, 0, 6.3); g.arc(x + 6, y0 + rh * 0.7, 1.4, 0, 6.3); g.fill();
        }
        x += len;
      }
      // 줄 사이 틈과 빛 받는 모서리
      g.fillStyle = css(seam, 1, opt.seamA || 0.85); g.fillRect(0, y0, W, opt.seamW || 2.4);
      g.fillStyle = css(base, 1.35, 0.28); g.fillRect(0, y0 + (opt.seamW || 2.4), W, 1.4);
      if (opt.clinker) { var gr = g.createLinearGradient(0, y0 + rh * 0.55, 0, y0 + rh); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(10,5,2,0.38)'); g.fillStyle = gr; g.fillRect(0, y0 + rh * 0.55, W, rh * 0.45); }
    }
    return c;
  };

  /* 돛천: 세로 솔기(천 폭), 가장자리 볼트로프, 아래쪽 약한 때. kind: sq | lat | bat | jp | mat */
  X.sail = function (opt) {
    var W = 256, H = 256, base = hex(opt.color || '#f1e3bf'), r = rng(opt.seed || 11), c = canvas(W, H), g = c.getContext('2d');
    g.fillStyle = css(base); g.fillRect(0, 0, W, H);
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, css(base, 1.03, 0.0)); gr.addColorStop(0.75, css(base, 0.96, 0.25)); gr.addColorStop(1, css(base, 0.84, 0.55));
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // 천의 결(아주 옅은 잡티)
    for (var n = 0; n < 900; n++) { g.fillStyle = css(base, r() < 0.5 ? 0.9 : 1.06, 0.12); g.fillRect(r() * W, r() * H, 1 + r() * 2, 1); }
    var kind = opt.kind || 'sq', cloths = opt.cloths || 9;
    if (kind === 'bat' || kind === 'mat') {
      // 대나무 살 사이 천: 살 줄 아래쪽이 조금 어둡다(부풀어 그늘)
      var bands = opt.bands || 6;
      for (var b = 0; b < bands; b++) {
        var y0 = b * H / bands, y1 = (b + 1) * H / bands, bg = g.createLinearGradient(0, y0, 0, y1);
        bg.addColorStop(0, css(base, 0.80, 0.55)); bg.addColorStop(0.25, css(base, 1.04, 0.0)); bg.addColorStop(0.8, css(base, 0.97, 0.10)); bg.addColorStop(1, css(base, 0.78, 0.45));
        g.fillStyle = bg; g.fillRect(0, y0, W, y1 - y0);
      }
      if (kind === 'mat') {   // 거적·대자리 돛: 엮은 결
        for (var yy = 0; yy < H; yy += 4) { g.fillStyle = css(base, 0.86, 0.22); g.fillRect(0, yy, W, 1); }
        for (var xx = 0; xx < W; xx += 6) { g.fillStyle = css(base, 0.9, 0.12); g.fillRect(xx, 0, 1, H); }
      }
      cloths = kind === 'mat' ? 0 : 6;
    }
    for (var i = 1; i < cloths; i++) {
      var x = i * W / cloths;
      g.fillStyle = css(base, 0.78, kind === 'jp' ? 0.75 : 0.42); g.fillRect(x - (kind === 'jp' ? 1.6 : 0.8), 0, kind === 'jp' ? 3.2 : 1.6, H);
      g.fillStyle = css(base, 1.08, 0.5); g.fillRect(x + 1, 0, 1, H);
    }
    if (kind === 'sq') {   // 리프 줄(돛 접는 끈 줄)
      for (var rf = 1; rf <= 2; rf++) { var ry = rf * H * 0.16; g.fillStyle = css(base, 0.8, 0.3); g.fillRect(0, ry, W, 1.2); for (var p = 4; p < W; p += 12) { g.fillStyle = css(base, 0.62, 0.5); g.fillRect(p, ry - 1.5, 1.2, 4); } }
    }
    // 볼트로프(가장자리)
    g.strokeStyle = css(base, 0.66, 0.7); g.lineWidth = 3; g.strokeRect(1.5, 1.5, W - 3, H - 3);
    return c;
  };

  /* 기와 지붕 */
  X.roof = function (opt) {
    var W = 256, H = 256, base = hex(opt.color || '#46474c'), r = rng(opt.seed || 23), c = canvas(W, H), g = c.getContext('2d');
    g.fillStyle = css(base); g.fillRect(0, 0, W, H);
    var cols = opt.cols || 16;
    for (var i = 0; i < cols; i++) {
      var x0 = i * W / cols, w = W / cols, gr = g.createLinearGradient(x0, 0, x0 + w, 0);
      gr.addColorStop(0, css(base, 0.62)); gr.addColorStop(0.45, css(base, 1.22)); gr.addColorStop(1, css(base, 0.72));
      g.fillStyle = gr; g.fillRect(x0, 0, w, H);
    }
    for (var y = 0; y < H; y += 16) { g.fillStyle = css(base, 0.55, 0.6); g.fillRect(0, y, W, 2); }
    for (var n = 0; n < 300; n++) { g.fillStyle = css(base, r() < 0.5 ? 0.8 : 1.2, 0.15); g.fillRect(r() * W, r() * H, 2, 2); }
    return c;
  };

  /* 초가·야자잎 지붕 */
  X.thatch = function (opt) {
    var W = 256, H = 256, base = hex(opt.color || '#b48a4a'), r = rng(opt.seed || 29), c = canvas(W, H), g = c.getContext('2d');
    g.fillStyle = css(base); g.fillRect(0, 0, W, H);
    for (var n = 0; n < 1600; n++) { var x = r() * W, y = r() * H; g.strokeStyle = css(base, 0.7 + r() * 0.6, 0.5); g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y + 6 + r() * 8); g.stroke(); }
    for (var yy = 0; yy < H; yy += 32) { g.fillStyle = css(base, 0.6, 0.45); g.fillRect(0, yy, W, 3); }
    return c;
  };

  /* 거북선 지붕: 육각 철판과 이음 */
  X.plates = function (opt) {
    var W = 256, H = 256, base = hex(opt.color || '#5a5a4c'), c = canvas(W, H), g = c.getContext('2d'), r = rng(opt.seed || 31);
    g.fillStyle = css(base, 0.62); g.fillRect(0, 0, W, H);
    var s = 16, h = s * Math.sqrt(3);
    for (var row = -1; row < H / h + 2; row++) {
      for (var col = -1; col < W / (s * 1.5) + 2; col++) {
        var cx = col * s * 1.5, cy = row * h + ((col & 1) ? h / 2 : 0);
        g.beginPath();
        for (var k = 0; k < 6; k++) { var a = k * Math.PI / 3; g.lineTo(cx + Math.cos(a) * (s - 1.5), cy + Math.sin(a) * (s - 1.5)); }
        g.closePath(); g.fillStyle = css(base, 0.9 + r() * 0.25); g.fill();
        g.strokeStyle = css(base, 1.35, 0.35); g.lineWidth = 1; g.stroke();
      }
    }
    return c;
  };

  /* 판벽(세로 널): 안택선·판옥선 방패벽 */
  X.wall = function (opt) {
    var W = 256, H = 128, base = hex(opt.color || '#4a3221'), c = canvas(W, H), g = c.getContext('2d'), r = rng(opt.seed || 37), n = opt.boards || 24;
    for (var i = 0; i < n; i++) { g.fillStyle = css(base, 0.85 + r() * 0.28); g.fillRect(i * W / n, 0, W / n, H); g.fillStyle = css(base, 0.45, 0.8); g.fillRect(i * W / n, 0, 1.6, H); }
    g.fillStyle = css(base, 0.4); g.fillRect(0, 0, W, 6); g.fillRect(0, H - 6, W, 6); g.fillRect(0, H * 0.5 - 2, W, 4);
    if (opt.holes) for (var j = 0; j < opt.holes; j++) { var x = (j + 0.5) * W / opt.holes; g.fillStyle = '#120c08'; g.fillRect(x - 4, H * 0.24, 8, 10); }
    return c;
  };
})(window);
