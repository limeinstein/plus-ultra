/* Painting helpers for procedural scene illustrations (Canvas 2D). */
(function (G) {
  'use strict';
  var A = {};
  G.Art = A;
  var U = G.U;

  A.canvas = function (w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // ---------------------------------------------------------------- color utils
  function hex(c) {
    if (Array.isArray(c)) return c;
    c = c.replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    return [parseInt(c.substr(0, 2), 16), parseInt(c.substr(2, 2), 16), parseInt(c.substr(4, 2), 16)];
  }
  A.hex = hex;
  A.mix = function (a, b, t) { a = hex(a); b = hex(b); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
  A.rgba = function (c, a) { c = hex(c); return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (a == null ? 1 : a) + ')'; };
  A.shade = function (c, k) { c = hex(c); return [U.clamp(c[0] * k, 0, 255), U.clamp(c[1] * k, 0, 255), U.clamp(c[2] * k, 0, 255)]; };
  A.jitter = function (c, rng, amt) { c = hex(c); var j = function () { return (rng() - 0.5) * amt; }; return [U.clamp(c[0] + j(), 0, 255), U.clamp(c[1] + j(), 0, 255), U.clamp(c[2] + j(), 0, 255)]; };

  // ---------------------------------------------------------------- noise tile
  var grainTile = null;
  A.grain = function () {
    if (grainTile) return grainTile;
    var c = A.canvas(256, 256), x = c.getContext('2d'), d = x.createImageData(256, 256), r = U.makeRng(99);
    for (var i = 0; i < d.data.length; i += 4) { var v = 110 + r() * 40; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0); grainTile = c; return c;
  };
  A.applyGrain = function (ctx, w, h, alpha) {
    ctx.save(); ctx.globalAlpha = alpha || 0.08; ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = ctx.createPattern(A.grain(), 'repeat'); ctx.fillRect(0, 0, w, h); ctx.restore();
  };
  A.vignette = function (ctx, w, h, strength, color) {
    var g = ctx.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, color || 'rgba(10,5,2,' + (strength || 0.6) + ')');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  };
  A.glow = function (ctx, x, y, r, color, alpha) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, A.rgba(color, alpha == null ? 0.6 : alpha)); g.addColorStop(0.35, A.rgba(color, (alpha == null ? 0.6 : alpha) * 0.35)); g.addColorStop(1, A.rgba(color, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  };
  /** warm color grade */
  A.grade = function (ctx, w, h, warm, alpha) {
    ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = alpha == null ? 0.35 : alpha;
    var g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, A.rgba(warm || '#ffb45a', 1)); g.addColorStop(1, 'rgba(60,40,90,1)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); ctx.restore();
  };
  A.lightRays = function (ctx, x, y, angle, spread, len, color, alpha, n, rng) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < n; i++) {
      var a = angle + (rng() - 0.5) * spread, w2 = 20 + rng() * 60;
      var g = ctx.createLinearGradient(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len);
      g.addColorStop(0, A.rgba(color, alpha * (0.5 + rng() * 0.5))); g.addColorStop(1, A.rgba(color, 0));
      ctx.fillStyle = g; ctx.beginPath();
      var px = -Math.sin(a), py = Math.cos(a);
      ctx.moveTo(x + px * 4, y + py * 4); ctx.lineTo(x - px * 4, y - py * 4);
      ctx.lineTo(x + Math.cos(a) * len - px * w2, y + Math.sin(a) * len - py * w2);
      ctx.lineTo(x + Math.cos(a) * len + px * w2, y + Math.sin(a) * len + py * w2);
      ctx.fill();
    }
    ctx.restore();
  };

  // ---------------------------------------------------------------- sky & atmosphere
  var SKIES = {
    day: ['#6f9fd0', '#a9c9e3', '#f1dfbf'],
    golden: ['#7f9cc4', '#e9c89a', '#f7c98a'],
    dusk: ['#2a3558', '#b0708a', '#f2a36a'],
    night: ['#070b1c', '#172445', '#3a3d5a'],
    storm: ['#4b5563', '#7b8290', '#a39e92']
  };
  A.sky = function (ctx, w, h, horizon, preset, rng) {
    var s = SKIES[preset] || SKIES.day;
    var g = ctx.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, s[0]); g.addColorStop(0.62, s[1]); g.addColorStop(1, s[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, horizon + 2);
    if (preset === 'night') {
      for (var i = 0; i < 220; i++) { ctx.fillStyle = 'rgba(255,255,240,' + (0.2 + rng() * 0.7) + ')'; ctx.fillRect(rng() * w, rng() * horizon * 0.9, rng() < 0.1 ? 2 : 1, rng() < 0.1 ? 2 : 1); }
    }
  };
  A.clouds = function (ctx, w, h, y0, y1, n, rng, tint, alpha) {
    for (var i = 0; i < n; i++) {
      var cx = rng() * w, cy = y0 + rng() * (y1 - y0), sz = 60 + rng() * 170;
      var puffs = 5 + Math.floor(rng() * 7);
      for (var k = 0; k < puffs; k++) {
        var px = cx + (rng() - 0.5) * sz * 1.8, py = cy + (rng() - 0.5) * sz * 0.25, r = sz * (0.25 + rng() * 0.35);
        var g = ctx.createRadialGradient(px - r * 0.2, py - r * 0.35, r * 0.1, px, py, r);
        g.addColorStop(0, A.rgba(tint || '#fffaf0', (alpha || 0.75)));
        g.addColorStop(0.6, A.rgba(A.mix(tint || '#fffaf0', '#b8c4d4', 0.35), (alpha || 0.75) * 0.55));
        g.addColorStop(1, A.rgba('#c8d2de', 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(px, py, r * 1.4, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
  };
  A.sun = function (ctx, x, y, r, color) {
    A.glow(ctx, x, y, r * 7, color || '#ffdc9a', 0.45);
    A.glow(ctx, x, y, r * 2.2, '#fff4d8', 0.8);
    ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  };
  A.birds = function (ctx, x0, y0, w, h, n, rng, color) {
    ctx.strokeStyle = color || 'rgba(60,50,40,.7)'; ctx.lineWidth = 1.4;
    for (var i = 0; i < n; i++) {
      var x = x0 + rng() * w, y = y0 + rng() * h, s = 4 + rng() * 6;
      ctx.beginPath(); ctx.moveTo(x - s, y - s * 0.3); ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.6, x, y); ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.6, x + s, y - s * 0.3); ctx.stroke();
    }
  };
  /** layered ridge silhouette */
  A.ridge = function (ctx, w, baseY, amp, rough, color, rng, snow) {
    var pts = [], n = 60, x, y;
    var ph1 = rng() * 10, ph2 = rng() * 10, ph3 = rng() * 10;
    for (var i = 0; i <= n; i++) {
      x = i / n * w;
      y = baseY - amp * (0.55 + 0.3 * Math.sin(i * 0.23 + ph1) + 0.15 * Math.sin(i * 0.61 + ph2) + rough * 0.25 * Math.sin(i * 1.7 + ph3) + rough * 0.12 * (rng() - 0.5));
      pts.push([x, y]);
    }
    ctx.fillStyle = A.rgba(color);
    ctx.beginPath(); ctx.moveTo(0, baseY + 400);
    pts.forEach(function (p) { ctx.lineTo(p[0], p[1]); });
    ctx.lineTo(w, baseY + 400); ctx.closePath(); ctx.fill();
    if (snow) {
      ctx.save(); ctx.clip();
      ctx.fillStyle = 'rgba(250,250,255,0.85)';
      ctx.beginPath();
      var cap = baseY - amp * 0.62;
      ctx.moveTo(0, cap); for (var k = 0; k <= n; k++) ctx.lineTo(k / n * w, cap + Math.sin(k * 1.3 + ph2) * 8 + rng() * 6);
      ctx.lineTo(w, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    return pts;
  };
  /** water band with sparkles */
  A.water = function (ctx, w, y0, y1, colTop, colBot, rng, sparkle) {
    var g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, A.rgba(colTop)); g.addColorStop(1, A.rgba(colBot));
    ctx.fillStyle = g; ctx.fillRect(0, y0, w, y1 - y0);
    var n = Math.floor((y1 - y0) * 3);
    for (var i = 0; i < n; i++) {
      var y = y0 + Math.pow(rng(), 1.6) * (y1 - y0), t = (y - y0) / (y1 - y0);
      var len = 6 + t * 40 * rng();
      ctx.fillStyle = 'rgba(255,248,225,' + (0.15 + rng() * (sparkle || 0.4)) * (1 - t * 0.6) + ')';
      ctx.fillRect(rng() * w, y, len, 1 + t * 1.5);
    }
    for (var j = 0; j < n * 0.6; j++) {
      var yy = y0 + rng() * (y1 - y0);
      ctx.fillStyle = 'rgba(20,40,70,' + (0.08 + rng() * 0.12) + ')';
      ctx.fillRect(rng() * w, yy, 10 + rng() * 60, 1.5);
    }
  };

  // ---------------------------------------------------------------- vegetation
  A.cypress = function (ctx, x, y, hgt, col, light) {
    var w = hgt * 0.16;
    var g = ctx.createLinearGradient(x - w, 0, x + w, 0);
    g.addColorStop(0, A.rgba(A.shade(col, light ? 1.35 : 1.1))); g.addColorStop(1, A.rgba(A.shade(col, 0.55)));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x, y - hgt);
    ctx.bezierCurveTo(x + w * 1.2, y - hgt * 0.6, x + w, y - hgt * 0.1, x + w * 0.4, y);
    ctx.lineTo(x - w * 0.4, y);
    ctx.bezierCurveTo(x - w, y - hgt * 0.1, x - w * 1.2, y - hgt * 0.6, x, y - hgt); ctx.fill();
  };
  A.roundTree = function (ctx, x, y, r, col, rng) {
    ctx.fillStyle = A.rgba(A.shade(col, 0.45)); ctx.fillRect(x - r * 0.08, y - r * 0.4, r * 0.16, r * 0.45);
    for (var i = 0; i < 9; i++) {
      var a = rng() * Math.PI * 2, d = rng() * r * 0.45, rr = r * (0.45 + rng() * 0.3);
      var px = x + Math.cos(a) * d, py = y - r * 0.85 + Math.sin(a) * d * 0.7;
      var g = ctx.createRadialGradient(px - rr * 0.35, py - rr * 0.4, rr * 0.1, px, py, rr);
      g.addColorStop(0, A.rgba(A.shade(col, 1.35))); g.addColorStop(1, A.rgba(A.shade(col, 0.6)));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, rr, 0, Math.PI * 2); ctx.fill();
    }
  };
  A.orangeTree = function (ctx, x, y, r, rng) {
    A.roundTree(ctx, x, y, r, '#3d5a2a', rng);
    for (var i = 0; i < 12; i++) {
      var px = x + (rng() - 0.5) * r * 1.3, py = y - r * 0.85 + (rng() - 0.5) * r * 0.9;
      ctx.fillStyle = rng() < 0.5 ? '#f09a2a' : '#e8802a'; ctx.beginPath(); ctx.arc(px, py, r * 0.06 + 1, 0, Math.PI * 2); ctx.fill();
    }
  };
  A.palm = function (ctx, x, y, hgt, col, rng) {
    var lean = (rng() - 0.5) * hgt * 0.25, tx = x + lean, ty = y - hgt;
    ctx.strokeStyle = A.rgba(A.shade(col, 0.5)); ctx.lineWidth = Math.max(2, hgt * 0.045); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + lean * 0.2, y - hgt * 0.5, tx, ty); ctx.stroke();
    for (var i = 0; i < 9; i++) {
      var a = -Math.PI / 2 + (i / 8 - 0.5) * Math.PI * 1.7 + (rng() - 0.5) * 0.2;
      var len = hgt * (0.32 + rng() * 0.12);
      var ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * 0.55 + len * 0.28;
      ctx.strokeStyle = A.rgba(A.shade(col, 0.8 + rng() * 0.5)); ctx.lineWidth = Math.max(1.5, hgt * 0.03);
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo((tx + ex) / 2, ty + Math.sin(a) * len * 0.3 - len * 0.12, ex, ey); ctx.stroke();
    }
  };
  A.pine = function (ctx, x, y, hgt, col) {
    ctx.fillStyle = A.rgba(A.shade(col, 0.5)); ctx.fillRect(x - hgt * 0.02, y - hgt * 0.2, hgt * 0.04, hgt * 0.2);
    for (var i = 0; i < 4; i++) {
      var yy = y - hgt * (0.15 + i * 0.2), ww = hgt * (0.32 - i * 0.06);
      ctx.fillStyle = A.rgba(A.shade(col, 0.7 + i * 0.12));
      ctx.beginPath(); ctx.moveTo(x - ww, yy); ctx.lineTo(x, yy - hgt * 0.32); ctx.lineTo(x + ww, yy); ctx.closePath(); ctx.fill();
    }
  };

  // ---------------------------------------------------------------- people silhouettes
  A.person = function (ctx, x, y, h, col, rng, opts) {
    opts = opts || {};
    var hw = h * 0.13, head = h * 0.11;
    var c = A.hex(col || '#2a2018');
    // legs / robe
    ctx.fillStyle = A.rgba(A.shade(c, 0.6));
    if (opts.robe) {
      ctx.beginPath(); ctx.moveTo(x - hw * 0.9, y - h * 0.62); ctx.lineTo(x + hw * 0.9, y - h * 0.62); ctx.lineTo(x + hw * 1.25, y); ctx.lineTo(x - hw * 1.25, y); ctx.fill();
    } else {
      ctx.fillRect(x - hw * 0.6, y - h * 0.45, hw * 0.5, h * 0.45);
      ctx.fillRect(x + hw * 0.1, y - h * 0.45, hw * 0.5, h * 0.45);
    }
    // torso
    ctx.fillStyle = A.rgba(c);
    ctx.beginPath(); ctx.moveTo(x - hw, y - h * 0.78); ctx.lineTo(x + hw, y - h * 0.78); ctx.lineTo(x + hw * 0.85, y - h * 0.42); ctx.lineTo(x - hw * 0.85, y - h * 0.42); ctx.fill();
    // light edge
    ctx.fillStyle = 'rgba(255,220,160,0.25)'; ctx.fillRect(x - hw, y - h * 0.78, hw * 0.35, h * 0.36);
    // head
    ctx.fillStyle = A.rgba(opts.skin || '#b9876a');
    ctx.beginPath(); ctx.arc(x, y - h * 0.86, head, 0, Math.PI * 2); ctx.fill();
    if (opts.hat) { ctx.fillStyle = A.rgba(opts.hat); ctx.beginPath(); ctx.ellipse(x, y - h * 0.93, head * 1.35, head * 0.45, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x - head * 0.8, y - h * 1.0, head * 1.6, head * 0.7); }
    if (opts.turban) { ctx.fillStyle = A.rgba(opts.turban); ctx.beginPath(); ctx.ellipse(x, y - h * 0.94, head * 1.1, head * 0.75, 0, 0, Math.PI * 2); ctx.fill(); }
    if (opts.veil) { ctx.fillStyle = A.rgba(opts.veil); ctx.beginPath(); ctx.moveTo(x - head * 1.3, y - h * 0.72); ctx.quadraticCurveTo(x, y - h * 1.08, x + head * 1.3, y - h * 0.72); ctx.fill(); }
  };
  A.crowd = function (ctx, x0, x1, yBase, depth, n, rng, palette, style) {
    var list = [];
    for (var i = 0; i < n; i++) list.push({ x: x0 + rng() * (x1 - x0), t: rng() });
    list.sort(function (a, b) { return a.t - b.t; });
    list.forEach(function (p) {
      var y = yBase + p.t * depth, h = 26 + p.t * 60;
      var col = A.jitter(palette[Math.floor(rng() * palette.length)] || '#3a2a1e', rng, 30);
      var o = { skin: A.jitter(style === 'af' ? '#6b4430' : style === 'cn' || style === 'jp' || style === 'kr' ? '#caa27e' : style === 'in' ? '#8a5c3e' : '#b9876a', rng, 20) };
      if (style === 'is' || style === 'pe' || style === 'in') { if (rng() < 0.6) o.turban = rng() < 0.5 ? '#e8e0cc' : '#b44a2a'; o.robe = rng() < 0.7; }
      else if (style === 'af' || style === 'sw') { o.robe = rng() < 0.6; if (rng() < 0.3) o.turban = '#e8e0cc'; }
      else if (style === 'cn' || style === 'kr' || style === 'jp') { o.robe = true; if (rng() < 0.5) o.hat = '#222'; }
      else if (style === 'az' || style === 'an' || style === 'na' || style === 'tr') { o.robe = rng() < 0.4; }
      else { if (rng() < 0.3) o.hat = '#2a1c14'; if (rng() < 0.25) o.veil = rng() < 0.5 ? '#2f5a5a' : '#6b3a2a'; o.robe = rng() < 0.35; }
      ctx.globalAlpha = 0.55 + p.t * 0.45;
      A.person(ctx, p.x, y, h, col, rng, o);
      ctx.globalAlpha = 1;
    });
  };

  // ---------------------------------------------------------------- ships (side view)
  /** spec: {sails:['sq','lat',..], hull:'#5a3a22', flag:'#c33', scale} */
  A.shipSide = function (ctx, x, y, s, spec, rng, dir) {
    spec = spec || {};
    dir = dir || 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
    var sails = spec.sails || ['sq', 'sq', 'lat'];
    var L = 120 + sails.length * 18;
    var hull = A.hex(spec.hull || '#4a2e1c');
    // hull
    var g = ctx.createLinearGradient(0, -20, 0, 18);
    g.addColorStop(0, A.rgba(A.shade(hull, 1.35))); g.addColorStop(1, A.rgba(A.shade(hull, 0.55)));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-L / 2, -22); ctx.lineTo(-L / 2 + 12, -10); ctx.quadraticCurveTo(-L / 2 + 25, 16, 0, 16); ctx.quadraticCurveTo(L / 2 - 8, 16, L / 2 + 12, -14);
    ctx.lineTo(L / 2 - 4, -14); ctx.lineTo(L / 2 - 26, -8); ctx.lineTo(-L / 2 + 30, -8); ctx.lineTo(-L / 2 + 22, -24); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(230,200,140,.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-L / 2 + 14, -4); ctx.quadraticCurveTo(0, 6, L / 2 - 2, -8); ctx.stroke();
    // castle stern
    ctx.fillStyle = A.rgba(A.shade(hull, 0.9)); ctx.fillRect(-L / 2 + 2, -34, 30, 14);
    ctx.fillStyle = 'rgba(255,220,140,.35)'; for (var w2 = 0; w2 < 3; w2++) ctx.fillRect(-L / 2 + 6 + w2 * 9, -30, 4, 5);
    // masts & sails
    var n = sails.length;
    for (var i = 0; i < n; i++) {
      var mx = -L / 2 + 34 + (i + 0.5) * ((L - 50) / n) * (dir > 0 ? 1 : 1);
      if (sails.length === 1) mx = 0;
      var mh = (i === 0 && n > 2 ? 70 : 92) + (i === 1 ? 14 : 0);
      if (sails[i] === 'lat' && i === n - 1) mh = 70;
      ctx.strokeStyle = '#2b1d12'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(mx, -10); ctx.lineTo(mx, -10 - mh); ctx.stroke();
      var sc = A.hex(spec.sail || '#efe4c9');
      if (sails[i] === 'bat' && A.sailBatSide) A.sailBatSide(ctx, mx, -10, mh, spec.sail || '#a95f36');
      else if (sails[i] === 'sq') {
        for (var k = 0; k < 2; k++) {
          var top = -10 - mh + 8 + k * mh * 0.45, hh = mh * 0.38, ww = 26 - k * 3;
          var sg = ctx.createLinearGradient(mx - ww, 0, mx + ww, 0);
          sg.addColorStop(0, A.rgba(A.shade(sc, 1.05))); sg.addColorStop(1, A.rgba(A.shade(sc, 0.72)));
          ctx.fillStyle = sg;
          ctx.beginPath(); ctx.moveTo(mx - ww, top); ctx.lineTo(mx + ww, top); ctx.quadraticCurveTo(mx + ww + 6, top + hh * 0.5, mx + ww, top + hh); ctx.lineTo(mx - ww, top + hh); ctx.quadraticCurveTo(mx - ww + 6, top + hh * 0.5, mx - ww, top); ctx.fill();
          if (spec.cross && k === 0 && i === Math.floor(n / 2)) { ctx.fillStyle = '#a3261c'; ctx.fillRect(mx - 3, top + 4, 6, hh - 8); ctx.fillRect(mx - 10, top + hh * 0.35, 20, 6); }
        }
      } else {
        var sg2 = ctx.createLinearGradient(mx - 30, 0, mx + 20, 0);
        sg2.addColorStop(0, A.rgba(A.shade(sc, 1.05))); sg2.addColorStop(1, A.rgba(A.shade(sc, 0.7)));
        ctx.fillStyle = sg2;
        ctx.beginPath(); ctx.moveTo(mx + 6, -10 - mh); ctx.lineTo(mx - 34, -14); ctx.lineTo(mx + 4, -14); ctx.quadraticCurveTo(mx + 14, -10 - mh * 0.5, mx + 6, -10 - mh); ctx.fill();
        ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(mx + 8, -10 - mh - 4); ctx.lineTo(mx - 36, -10); ctx.stroke();
      }
      // pennant
      ctx.fillStyle = spec.flag || '#b3261e';
      ctx.beginPath(); ctx.moveTo(mx, -10 - mh); ctx.lineTo(mx - 16, -10 - mh + 3); ctx.lineTo(mx, -10 - mh + 6); ctx.fill();
    }
    // rigging lines
    ctx.strokeStyle = 'rgba(40,28,18,.55)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(L / 2 + 10, -14); ctx.lineTo(-L / 2 + 34 + 0.5 * ((L - 50) / n), -100); ctx.moveTo(-L / 2 + 4, -34); ctx.lineTo(-L / 2 + 34 + (n - 0.5) * ((L - 50) / n), -80); ctx.stroke();
    ctx.restore();
  };

  // ---------------------------------------------------------------- 돛·깃발이 바람을 따른다 (G.Waves.rigStep이 만든 rig)
  /** 돛 하나를 겉바람에 맞춘다: 가로돛은 활대를 돌리고(brace), 삼각돛은 바람 아래쪽으로 넘기고(lee), 맞바람이면 떤다(luff).
      ctx.save() 뒤에 부른다. 돌려줌 = 돛이 부푼 정도에 곱할 값 */
  A.rigSail = function (ctx, mx, kind, rig, W, t, i) {
    if (!rig || rig.brace == null) return 1;
    var fa = kind === 'lat' || kind === 'lateen', lu = rig.luff || 0;
    if (lu > 0.02) ctx.translate(Math.sin(t * 23 + i * 2.1) * W * 0.03 * lu, Math.sin(t * 19 + i) * W * 0.025 * lu);
    ctx.translate(mx, 0);
    if (fa) { var le = rig.lee; if (Math.abs(le) < 0.12) le = le < 0 ? -0.12 : 0.12; ctx.scale(1, le); }
    else ctx.rotate(rig.brace * (kind === 'bat' ? 1.3 : 1));
    ctx.translate(-mx, 0);
    var fl = rig.fill == null ? 1 : rig.fill;
    return fl * (1 - lu) + lu * (0.12 + 0.55 * Math.abs(Math.sin(t * 16 + i * 1.7)));
  };
  /** 바람에 날리는 긴 깃발: (x, y)에서 dir(캔버스 rad) 쪽으로, 끝으로 갈수록 크게 물결친다 */
  A.streamer = function (ctx, x, y, dir, len, wid, t, col, aws) {
    var n = 9, c = Math.cos(dir), s = Math.sin(dir), px = -s, py = c, f = 7 + 9 * (aws || 0.5), amp = wid * (0.9 + 0.8 * (aws || 0.5));
    var top = [], bot = [];
    for (var k = 0; k <= n; k++) {
      var u = k / n, o = Math.sin(t * f - u * 5.5) * amp * u, w = wid * 0.5 * (1 - 0.8 * u);
      var bx = x + c * len * u + px * o, by = y + s * len * u + py * o;
      top.push([bx + px * w, by + py * w]); bot.push([bx - px * w, by - py * w]);
    }
    ctx.beginPath(); ctx.moveTo(top[0][0], top[0][1]);
    for (k = 1; k <= n; k++) ctx.lineTo(top[k][0], top[k][1]);
    for (k = n; k >= 0; k--) ctx.lineTo(bot[k][0], bot[k][1]);
    ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 0.6; ctx.stroke();
  };

  // ---------------------------------------------------------------- ship (top view, for maps)
  /** draws a ship seen from above, pointing along angle (radians, 0 = east, CCW positive with y-up world) */
  A.shipTop = function (ctx, x, y, ang, len, spec, t) {
    spec = spec || {};
    t = t || 0;
    ctx.save(); ctx.translate(x, y); ctx.rotate(-ang);
    var ps = spec.pose || {};
    if (spec.pose) { var hv = 1 + (ps.heave || 0); ctx.scale(hv, hv * (1 - Math.abs(ps.roll || 0) * 0.35)); }
    var L = len, W = len * 0.34;
    var sails = spec.sails || ['sq', 'sq', 'lat'];
    // wake foam & shadow (항적을 따로 그리는 기함은 삼각 거품을 뺀다)
    if (!spec.noWake) {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath(); ctx.moveTo(-L * 0.5, 0); ctx.lineTo(-L * 1.05, -W * 0.9); ctx.lineTo(-L * 1.05, W * 0.9); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,12,28,0.30)';
    ctx.beginPath(); ctx.ellipse(L * 0.04, W * (0.35 - (ps.roll || 0) * 0.6), L * 0.54, W * 0.62, 0, 0, Math.PI * 2); ctx.fill();
    // hull
    var hull = A.hex(spec.hull || '#5a3a22');
    function hullPath(k) {
      ctx.beginPath();
      ctx.moveTo(L * 0.56 * k, 0);
      ctx.bezierCurveTo(L * 0.42 * k, -W * 0.52 * k, L * 0.05, -W * 0.56 * k, -L * 0.36, -W * 0.5 * k);
      ctx.lineTo(-L * 0.47 * k, -W * 0.36 * k); ctx.lineTo(-L * 0.47 * k, W * 0.36 * k); ctx.lineTo(-L * 0.36, W * 0.5 * k);
      ctx.bezierCurveTo(L * 0.05, W * 0.56 * k, L * 0.42 * k, W * 0.52 * k, L * 0.56 * k, 0);
      ctx.closePath();
    }
    var g = ctx.createLinearGradient(0, -W * 0.55, 0, W * 0.55);
    g.addColorStop(0, A.rgba(A.shade(hull, 1.35))); g.addColorStop(0.5, A.rgba(hull)); g.addColorStop(1, A.rgba(A.shade(hull, 0.55)));
    hullPath(1); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(15,8,4,.8)'; ctx.lineWidth = Math.max(1, L / 60); ctx.stroke();
    // deck
    hullPath(0.84); ctx.fillStyle = A.rgba(A.mix('#b08a5a', hull, hull[0] + hull[1] + hull[2] < 150 ? 0.6 : 0.25)); ctx.fill();
    ctx.save(); hullPath(0.84); ctx.clip();
    ctx.strokeStyle = 'rgba(60,35,15,.35)'; ctx.lineWidth = Math.max(0.5, L / 160);
    for (var pl = -3; pl <= 3; pl++) { ctx.beginPath(); ctx.moveTo(-L * 0.5, pl * W * 0.11); ctx.lineTo(L * 0.5, pl * W * 0.11); ctx.stroke(); }
    ctx.restore();
    // stern castle & forecastle
    ctx.fillStyle = A.rgba(A.shade(hull, 0.85)); ctx.fillRect(-L * 0.46, -W * 0.34, L * 0.2, W * 0.68);
    ctx.fillStyle = A.rgba(A.mix('#c09a6a', hull, 0.2)); ctx.fillRect(-L * 0.43, -W * 0.27, L * 0.15, W * 0.54);
    ctx.fillStyle = A.rgba(A.shade(hull, 0.9)); ctx.beginPath(); ctx.moveTo(L * 0.5, 0); ctx.lineTo(L * 0.3, -W * 0.3); ctx.lineTo(L * 0.3, W * 0.3); ctx.closePath(); ctx.fill();
    // bowsprit
    ctx.strokeStyle = '#3a2616'; ctx.lineWidth = Math.max(1, L / 70); ctx.beginPath(); ctx.moveTo(L * 0.5, 0); ctx.lineTo(L * 0.7, 0); ctx.stroke();
    // masts & sails (기울면 돛대 끝이 그쪽으로)
    ctx.translate(-(ps.pitch || 0) * L * 0.12, -(ps.roll || 0) * W * 1.0);
    var n = sails.length;
    var sailCol = A.hex(spec.sail || '#f1e6cc');
    for (var i = 0; i < n; i++) {
      var mx = n === 1 ? 0 : L * 0.26 - i * (L * 0.58 / (n - 1));
      var kind = sails[i];
      var bil = W * (0.18 + 0.03 * Math.sin(t * 2.5 + i));
      var fu = spec.furl || 0;               // 돛을 거둔 정도 (0 = 활짝, 1 = 활대에 말아 묶음)
      ctx.save();
      bil *= A.rigSail(ctx, mx, kind, spec.rig, W, t, i);
      if (fu > 0) { var ax = kind === 'sq' || kind === 'bat' ? mx - W * 0.08 : mx; ctx.translate(ax, kind === 'sq' || kind === 'bat' ? 0 : W * 0.27); ctx.scale(1 - 0.72 * fu, kind === 'sq' || kind === 'bat' ? 1 : 1 - 0.72 * fu); ctx.translate(-ax, kind === 'sq' || kind === 'bat' ? 0 : -W * 0.27); bil *= 1 - 0.6 * fu; }
      if (kind === 'sq' || kind === 'bat') {
        var span = W * (i === 0 && n > 2 ? 1.35 : 1.6);
        var sg = ctx.createLinearGradient(mx - bil, 0, mx + bil * 1.6, 0);
        sg.addColorStop(0, A.rgba(A.shade(sailCol, 0.78))); sg.addColorStop(1, A.rgba(A.shade(sailCol, 1.08)));
        ctx.fillStyle = sg; ctx.strokeStyle = 'rgba(70,50,30,.6)'; ctx.lineWidth = Math.max(0.6, L / 140);
        ctx.beginPath();
        ctx.moveTo(mx - W * 0.05, -span / 2);
        ctx.quadraticCurveTo(mx + bil * 2.2, 0, mx - W * 0.05, span / 2);
        ctx.lineTo(mx - W * 0.16, span / 2 * 0.96);
        ctx.quadraticCurveTo(mx + bil * 0.9, 0, mx - W * 0.16, -span / 2 * 0.96);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // yard
        ctx.strokeStyle = '#3a2616'; ctx.lineWidth = Math.max(1, L / 90); ctx.beginPath(); ctx.moveTo(mx - W * 0.08, -span / 2 - W * 0.05); ctx.lineTo(mx - W * 0.08, span / 2 + W * 0.05); ctx.stroke();
        if (spec.cross && i === Math.floor((n - 1) / 2)) { ctx.fillStyle = '#b3261e'; var cw = Math.max(1.5, W * 0.1); ctx.fillRect(mx, -span * 0.18, cw, span * 0.36); ctx.fillRect(mx - cw * 0.3, -cw * 1.6, cw * 1.8, cw * 3.2); }
      } else {
        // lateen: long diagonal yard with a triangular sail swung to one side
        var yl = W * 2.2;
        ctx.fillStyle = A.rgba(A.shade(sailCol, 0.96)); ctx.strokeStyle = 'rgba(70,50,30,.6)'; ctx.lineWidth = Math.max(0.6, L / 140);
        ctx.beginPath();
        ctx.moveTo(mx + yl * 0.35, -W * 0.08);
        ctx.quadraticCurveTo(mx - yl * 0.1, W * 0.55 + bil, mx - yl * 0.55, W * 0.62);
        ctx.lineTo(mx - yl * 0.45, W * 0.18);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#3a2616'; ctx.lineWidth = Math.max(1, L / 90); ctx.beginPath(); ctx.moveTo(mx + yl * 0.38, -W * 0.12); ctx.lineTo(mx - yl * 0.58, W * 0.66); ctx.stroke();
      }
      ctx.restore();
      // mast top
      ctx.fillStyle = '#2a1a0e'; ctx.beginPath(); ctx.arc(mx, 0, Math.max(1.2, L / 55), 0, Math.PI * 2); ctx.fill();
    }
    // 돛대 위 긴 깃발 — 겉바람이 불어 가는 쪽으로 날린다
    var fk = (G.FX && G.FX.ride && G.FX.ride.flag != null) ? G.FX.ride.flag : 1;
    if (spec.rig && spec.rig.wind != null && fk > 0) {
      var mm = n === 1 ? 0 : L * 0.26 - Math.floor((n - 1) / 2) * (L * 0.58 / (n - 1));
      A.streamer(ctx, mm, 0, spec.rig.wind, L * 0.30 * fk, Math.max(1.5, W * 0.1 * fk), t, spec.pennant || '#c8312a', spec.rig.aws);
    }
    // pennant at the stern
    if (spec.rig && spec.rig.wind != null && spec.flag) A.streamer(ctx, -L * 0.47, 0, spec.rig.wind, L * 0.16, W * 0.22, t + 1.3, spec.flag, spec.rig.aws);
    else if (spec.flag) { ctx.fillStyle = spec.flag; ctx.beginPath(); ctx.moveTo(-L * 0.47, -W * 0.05); ctx.lineTo(-L * 0.62, -W * 0.18 + Math.sin(t * 6) * W * 0.05); ctx.lineTo(-L * 0.47, W * 0.12); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  };
})(window.G = window.G || {});
