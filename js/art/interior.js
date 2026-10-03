/* Procedural building interiors: warm, candle-lit painted rooms. */
(function (G) {
  'use strict';
  var A = G.Art, U = G.U;
  var W = 1600, H = 900;

  function cultureOf(city) {
    var s = city.style;
    if (s === 'is' || s === 'pe' || s === 'sw' || (s === 'af' && city.rel === 'I')) return 'islam';
    if (s === 'cn' || s === 'kr' || s === 'jp') return 'eastasia';
    if (s === 'in' || s === 'se') return 'south';
    if (s === 'az' || s === 'an' || s === 'na' || s === 'tr' || s === 'af') return 'native';
    return 'europe';
  }
  A.cultureOf = cultureOf;
  var PAL = {
    europe: { wall: '#6b5238', wall2: '#8a6a48', floor: '#5a3e28', beam: '#2e1f14', stone: '#8c7c68', arch: 'round' },
    islam: { wall: '#b89a6e', wall2: '#d6be94', floor: '#8a5a3a', beam: '#4a3220', stone: '#c9b08a', arch: 'horseshoe' },
    eastasia: { wall: '#6a4a32', wall2: '#9a7a52', floor: '#6a5038', beam: '#2a1a12', stone: '#8a8070', arch: 'flat' },
    south: { wall: '#9a7a52', wall2: '#c09a6a', floor: '#7a5a3a', beam: '#3a2818', stone: '#a89070', arch: 'pointed' },
    native: { wall: '#8a6a44', wall2: '#a88a5a', floor: '#6a4e30', beam: '#3a2a18', stone: '#9a8a70', arch: 'flat' }
  };

  // ---------------------------------------------------------------- room shell
  function room(ctx, pal, rng, opts) {
    opts = opts || {};
    var vx = opts.vx || 800, vy = opts.vy || 430;   // vanishing point
    var bx0 = opts.bx0 || 430, bx1 = opts.bx1 || 1170, by0 = opts.by0 || 170, by1 = opts.by1 || 600; // back wall rect
    // ceiling
    var cg = ctx.createLinearGradient(0, 0, 0, by0);
    cg.addColorStop(0, A.rgba(A.shade(pal.beam, 0.6))); cg.addColorStop(1, A.rgba(A.shade(pal.wall, 0.55)));
    ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(bx1, by0); ctx.lineTo(bx0, by0); ctx.closePath(); ctx.fill();
    // floor
    var fg = ctx.createLinearGradient(0, by1, 0, H);
    fg.addColorStop(0, A.rgba(A.shade(pal.floor, 0.8))); fg.addColorStop(1, A.rgba(A.shade(pal.floor, 1.15)));
    ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(bx0, by1); ctx.lineTo(bx1, by1); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    // floor planks / tiles
    ctx.strokeStyle = 'rgba(20,10,5,.28)'; ctx.lineWidth = 1.2;
    for (var i = -12; i <= 12; i++) { ctx.beginPath(); ctx.moveTo(vx + (bx1 - bx0) / 24 * i, by1); ctx.lineTo(vx + i * 130, H); ctx.stroke(); }
    if (opts.tiles) { for (var j = 0; j < 9; j++) { var t = Math.pow(j / 9, 1.7), y = by1 + (H - by1) * t; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } }
    // side walls
    var lw = ctx.createLinearGradient(0, 0, bx0, 0);
    lw.addColorStop(0, A.rgba(A.shade(pal.wall, 0.45))); lw.addColorStop(1, A.rgba(A.shade(pal.wall, 0.8)));
    ctx.fillStyle = lw; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(bx0, by0); ctx.lineTo(bx0, by1); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    var rw = ctx.createLinearGradient(W, 0, bx1, 0);
    rw.addColorStop(0, A.rgba(A.shade(pal.wall, 0.4))); rw.addColorStop(1, A.rgba(A.shade(pal.wall, 0.75)));
    ctx.fillStyle = rw; ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(bx1, by0); ctx.lineTo(bx1, by1); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    // back wall
    var bw = ctx.createLinearGradient(bx0, by0, bx1, by1);
    bw.addColorStop(0, A.rgba(A.shade(pal.wall2, 0.9))); bw.addColorStop(1, A.rgba(A.shade(pal.wall, 0.8)));
    ctx.fillStyle = bw; ctx.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
    // plaster texture
    for (var k = 0; k < 260; k++) {
      ctx.fillStyle = 'rgba(' + (rng() < 0.5 ? '255,240,210' : '30,20,10') + ',' + (0.02 + rng() * 0.05) + ')';
      ctx.beginPath(); ctx.ellipse(bx0 + rng() * (bx1 - bx0), by0 + rng() * (by1 - by0), 8 + rng() * 40, 4 + rng() * 16, rng() * 3, 0, Math.PI * 2); ctx.fill();
    }
    // beams
    if (opts.beams !== false) {
      ctx.fillStyle = A.rgba(pal.beam);
      for (var b = 0; b < 5; b++) {
        var t2 = b / 5, yb = by0 * t2 * 0.9;
        var xl = bx0 * (1 - t2) * 0 + (bx0) * (t2), xr = W - (W - bx1) * t2;
        ctx.fillRect(xl - 10, yb, xr - xl + 20, 16 * (1 - t2 * 0.6));
      }
      ctx.fillRect(bx0 - 6, by0 - 12, bx1 - bx0 + 12, 14);
    }
    return { vx: vx, vy: vy, bx0: bx0, bx1: bx1, by0: by0, by1: by1 };
  }

  function archWindow(ctx, x, y, w, h, kind, fill) {
    ctx.beginPath();
    if (kind === 'round') { ctx.moveTo(x, y + h); ctx.lineTo(x, y + w / 2); ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w, y + h); }
    else if (kind === 'pointed') { ctx.moveTo(x, y + h); ctx.lineTo(x, y + w * 0.6); ctx.quadraticCurveTo(x, y, x + w / 2, y - w * 0.1); ctx.quadraticCurveTo(x + w, y, x + w, y + w * 0.6); ctx.lineTo(x + w, y + h); }
    else if (kind === 'horseshoe') { ctx.moveTo(x + w * 0.08, y + h); ctx.lineTo(x + w * 0.08, y + w * 0.62); ctx.bezierCurveTo(x - w * 0.12, y + w * 0.1, x + w * 0.2, y - w * 0.12, x + w / 2, y - w * 0.12); ctx.bezierCurveTo(x + w * 0.8, y - w * 0.12, x + w * 1.12, y + w * 0.1, x + w * 0.92, y + w * 0.62); ctx.lineTo(x + w * 0.92, y + h); }
    else { ctx.rect(x, y, w, h); }
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  }
  /** outdoor view inside a window (sea & sky or city) */
  function viewOutside(ctx, x, y, w, h, kind, rng, time) {
    ctx.save(); ctx.clip();
    var night = time === 'night';
    var sky = ctx.createLinearGradient(0, y, 0, y + h);
    sky.addColorStop(0, night ? '#101832' : time === 'dusk' ? '#6a78a8' : '#8fb4d8');
    sky.addColorStop(1, night ? '#2a3050' : time === 'dusk' ? '#f0a070' : '#f4dfb8');
    ctx.fillStyle = sky; ctx.fillRect(x, y, w, h);
    var hz = y + h * 0.62;
    ctx.fillStyle = night ? '#1a2440' : '#3c6a92'; ctx.fillRect(x, hz, w, h);
    ctx.fillStyle = night ? 'rgba(255,220,150,.25)' : 'rgba(255,245,220,.4)';
    for (var i = 0; i < 30; i++) ctx.fillRect(x + rng() * w, hz + rng() * (h * 0.38), 6 + rng() * 20, 1.5);
    // far city silhouette
    ctx.fillStyle = night ? '#141a2e' : A.rgba(A.mix('#9a8a70', '#c8d4e0', 0.5));
    for (var bx = x; bx < x + w; bx += 10 + rng() * 14) { var bh = 6 + rng() * 22; ctx.fillRect(bx, hz - bh, 9 + rng() * 10, bh); }
    if (night) { for (var l = 0; l < 20; l++) { ctx.fillStyle = 'rgba(255,200,120,.8)'; ctx.fillRect(x + rng() * w, hz - rng() * 20, 2, 2); } }
    if (kind === 'ships') A.shipSide(ctx, x + w * 0.6, hz + 12, 0.28, { sails: ['sq', 'sq', 'lat'], hull: '#2a1a10' }, rng, -1);
    ctx.restore();
  }
  function candle(ctx, x, y, s, lit) {
    ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x - 3 * s, y - 16 * s, 6 * s, 16 * s);
    ctx.fillStyle = '#ffd27a'; ctx.beginPath(); ctx.ellipse(x, y - 21 * s, 2.6 * s, 6 * s, 0, 0, Math.PI * 2); ctx.fill();
    if (lit !== false) A.glow(ctx, x, y - 20 * s, 90 * s, '#ffb050', 0.4);
  }
  function lantern(ctx, x, y, s) {
    ctx.strokeStyle = '#1a120c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, y - 20 * s); ctx.stroke();
    ctx.fillStyle = '#2a1e14'; ctx.fillRect(x - 12 * s, y - 20 * s, 24 * s, 34 * s);
    ctx.fillStyle = 'rgba(255,190,100,.9)'; ctx.fillRect(x - 8 * s, y - 15 * s, 16 * s, 24 * s);
    A.glow(ctx, x, y - 3 * s, 170 * s, '#ffa040', 0.45);
  }
  function barrel(ctx, x, y, s, rng) {
    var g = ctx.createLinearGradient(x - 30 * s, 0, x + 30 * s, 0);
    g.addColorStop(0, '#2a1a10'); g.addColorStop(0.35, '#7a5230'); g.addColorStop(1, '#2a1a10');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y - 40 * s, 30 * s, 8 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 28 * s, y - 40 * s); ctx.quadraticCurveTo(x - 36 * s, y - 20 * s, x - 28 * s, y); ctx.lineTo(x + 28 * s, y); ctx.quadraticCurveTo(x + 36 * s, y - 20 * s, x + 28 * s, y - 40 * s); ctx.fill();
    ctx.strokeStyle = '#1a120a'; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(x - 32 * s, y - 30 * s); ctx.lineTo(x + 32 * s, y - 30 * s); ctx.moveTo(x - 32 * s, y - 10 * s); ctx.lineTo(x + 32 * s, y - 10 * s); ctx.stroke();
    ctx.fillStyle = '#4a321e'; ctx.beginPath(); ctx.ellipse(x, y - 40 * s, 26 * s, 6 * s, 0, 0, Math.PI * 2); ctx.fill();
  }
  function crate(ctx, x, y, w, h, rng) {
    ctx.fillStyle = '#7a5a36'; ctx.fillRect(x, y - h, w, h);
    ctx.fillStyle = '#5a3e24'; ctx.fillRect(x + w, y - h - 10, 14, h); ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x + 14, y - h - 10); ctx.lineTo(x + w + 14, y - h - 10); ctx.lineTo(x + w, y - h); ctx.fillStyle = '#9a7648'; ctx.fill();
    ctx.strokeStyle = 'rgba(30,18,8,.6)'; ctx.lineWidth = 2; ctx.strokeRect(x + 2, y - h + 2, w - 4, h - 4); ctx.beginPath(); ctx.moveTo(x + 2, y - h + 2); ctx.lineTo(x + w - 2, y - 2); ctx.stroke();
  }
  function sack(ctx, x, y, s, col, rng) {
    var c = A.hex(col || '#b89a6a');
    var g = ctx.createRadialGradient(x - 10 * s, y - 40 * s, 4, x, y - 25 * s, 45 * s);
    g.addColorStop(0, A.rgba(A.shade(c, 1.2))); g.addColorStop(1, A.rgba(A.shade(c, 0.55)));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 28 * s, y); ctx.quadraticCurveTo(x - 38 * s, y - 40 * s, x - 12 * s, y - 55 * s); ctx.lineTo(x + 12 * s, y - 55 * s); ctx.quadraticCurveTo(x + 38 * s, y - 40 * s, x + 28 * s, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = A.rgba(A.jitter(['#d8b060', '#6a3a1e', '#e8e0d0', '#3a2a1a'][Math.floor(rng() * 4)], rng, 20));
    ctx.beginPath(); ctx.ellipse(x, y - 52 * s, 16 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill();
  }
  function table(ctx, x, y, w, s, rng, stuff) {
    ctx.fillStyle = '#3a2616'; ctx.fillRect(x - w / 2 + 10 * s, y, 8 * s, 60 * s); ctx.fillRect(x + w / 2 - 18 * s, y, 8 * s, 60 * s);
    var g = ctx.createLinearGradient(0, y - 10 * s, 0, y + 10 * s); g.addColorStop(0, '#8a603a'); g.addColorStop(1, '#4a3020');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x - w / 2 + 20 * s, y - 16 * s); ctx.lineTo(x + w / 2 - 20 * s, y - 16 * s); ctx.lineTo(x + w / 2, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2e1e12'; ctx.fillRect(x - w / 2, y, w, 8 * s);
    if (stuff) stuff(x, y - 8 * s, s);
  }
  function mug(ctx, x, y, s) { ctx.fillStyle = '#8a8a90'; ctx.fillRect(x - 7 * s, y - 20 * s, 14 * s, 20 * s); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x - 5 * s, y - 18 * s, 3 * s, 16 * s); ctx.strokeStyle = '#6a6a70'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.arc(x + 9 * s, y - 10 * s, 5 * s, -1.2, 1.2); ctx.stroke(); }
  function bookshelf(ctx, x, y, w, h, rng, dim) {
    ctx.fillStyle = '#2e1c10'; ctx.fillRect(x, y, w, h);
    var rows = Math.floor(h / 70);
    for (var r = 0; r < rows; r++) {
      var ry = y + 10 + r * (h - 10) / rows, rh = (h - 10) / rows - 12;
      ctx.fillStyle = '#1a0f08'; ctx.fillRect(x + 6, ry, w - 12, rh + 4);
      for (var bx = x + 8; bx < x + w - 12;) {
        var bw = 7 + rng() * 10, bh = rh * (0.7 + rng() * 0.3);
        var col = A.jitter(['#6a2a1e', '#2a3a5a', '#3a4a2a', '#6a4a22', '#4a2a3a', '#8a6a3a'][Math.floor(rng() * 6)], rng, 25);
        if (dim) col = A.shade(col, dim);
        ctx.fillStyle = A.rgba(col); ctx.fillRect(bx, ry + rh - bh + 4, bw, bh);
        ctx.fillStyle = 'rgba(230,190,110,.35)'; ctx.fillRect(bx + 1, ry + rh - bh + 10, bw - 2, 2);
        bx += bw + 1;
      }
      ctx.fillStyle = '#4a3020'; ctx.fillRect(x, ry + rh + 4, w, 6);
    }
  }
  function figure(ctx, x, y, h, col, rng, opts) {
    // seated/standing silhouette with rim light
    A.person(ctx, x, y, h, A.shade(col || '#2a1e16', 0.9), rng, opts || {});
  }
  function banner(ctx, x, y, w, h, col, emblem) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w / 2, y + h - w * 0.35); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x + w * 0.7, y, w * 0.3, h - 10);
    ctx.fillStyle = '#d9b45f'; ctx.fillRect(x - 4, y - 6, w + 8, 6);
    if (emblem === 'cross') { ctx.fillRect(x + w / 2 - 3, y + h * 0.18, 6, h * 0.45); ctx.fillRect(x + w * 0.25, y + h * 0.3, w * 0.5, 6); }
    else if (emblem === 'crescent') { ctx.beginPath(); ctx.arc(x + w / 2, y + h * 0.4, w * 0.22, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + w / 2 + w * 0.08, y + h * 0.38, w * 0.2, 0, Math.PI * 2); ctx.fill(); }
    else if (emblem) { ctx.beginPath(); ctx.arc(x + w / 2, y + h * 0.4, w * 0.18, 0, Math.PI * 2); ctx.fill(); }
  }
  function fireplace(ctx, x, y, s, rng) {
    ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x - 110 * s, y - 170 * s, 220 * s, 170 * s);
    ctx.fillStyle = '#3a2e24'; ctx.fillRect(x - 130 * s, y - 180 * s, 260 * s, 18 * s);
    ctx.fillStyle = '#120a06'; archWindow(ctx, x - 75 * s, y - 120 * s, 150 * s, 120 * s, 'round'); ctx.fill();
    for (var i = 0; i < 16; i++) {
      var fx = x + (rng() - 0.5) * 90 * s, fh = (30 + rng() * 60) * s;
      var g = ctx.createLinearGradient(0, y - fh, 0, y);
      g.addColorStop(0, 'rgba(255,220,120,0)'); g.addColorStop(0.5, 'rgba(255,150,40,.8)'); g.addColorStop(1, 'rgba(255,90,20,.9)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(fx - 10 * s, y - 6 * s); ctx.quadraticCurveTo(fx - 6 * s, y - fh * 0.6, fx, y - fh); ctx.quadraticCurveTo(fx + 6 * s, y - fh * 0.6, fx + 10 * s, y - 6 * s); ctx.fill();
    }
    A.glow(ctx, x, y - 50 * s, 420 * s, '#ff8a30', 0.5);
  }
  function rug(ctx, x, y, w, h, col, pattern) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-w * 0.35, 0); ctx.lineTo(w * 0.35, 0); ctx.lineTo(w * 0.5, h); ctx.lineTo(-w * 0.5, h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#d9b45f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-w * 0.31, 8); ctx.lineTo(w * 0.31, 8); ctx.lineTo(w * 0.45, h - 8); ctx.lineTo(-w * 0.45, h - 8); ctx.closePath(); ctx.stroke();
    if (pattern) { ctx.strokeStyle = 'rgba(230,200,140,.5)'; for (var i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(0, h * 0.5, w * (0.08 + i * 0.06), h * (0.12 + i * 0.07), 0, 0, Math.PI * 2); ctx.stroke(); } }
    ctx.restore();
  }

  function emblemFor(city, cul) { return city.rel === 'C' ? 'cross' : cul === 'islam' || city.rel === 'I' ? 'crescent' : 'star'; }

  // ---------------------------------------------------------------- scenes
  var PAINTERS = {};
  PAINTERS.tavern = function (ctx, city, rng, pal, cul) {
    var r = room(ctx, pal, rng, { bx0: 380, bx1: 1220, by0: 140, by1: 560 });
    fireplace(ctx, 1000, r.by1, 1.1, rng);
    archWindow(ctx, 470, 230, 170, 240, cul === 'islam' ? 'horseshoe' : 'round', '#000'); viewOutside(ctx, 470, 180, 170, 300, 'city', rng, 'night');
    ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 8; archWindow(ctx, 470, 230, 170, 240, cul === 'islam' ? 'horseshoe' : 'round'); ctx.stroke();
    bookshelf(ctx, 700, 250, 170, 170, rng, 0.8);
    for (var b = 0; b < 12; b++) { ctx.fillStyle = A.rgba(A.jitter(['#3a6a3a', '#6a2a1e', '#8a7a4a'][b % 3], rng, 30)); ctx.fillRect(712 + b * 12, 240, 8, 22); }
    banner(ctx, 1110, 190, 70, 170, A.rgba(A.jitter('#2a3a5a', rng, 20)), emblemFor(city, cul));
    barrel(ctx, 250, 700, 1.6, rng); barrel(ctx, 140, 760, 1.9, rng); barrel(ctx, 1450, 720, 1.7, rng);
    lantern(ctx, 600, 190, 1); lantern(ctx, 1000, 150, 1.1);
    // patrons
    var cols = ['#2a1e16', '#3a2a1e', '#4a2a22', '#2a2a3a'];
    for (var p = 0; p < 7; p++) figure(ctx, 470 + p * 110 + rng() * 40, 600 + rng() * 30, 90 + rng() * 25, cols[p % 4], rng, cul === 'islam' ? { turban: '#e8e0cc', robe: true } : { hat: rng() < 0.5 ? '#2a1c14' : null });
    table(ctx, 800, 720, 520, 1.4, rng, function (x, y, s) { mug(ctx, x - 150, y, s); mug(ctx, x - 60, y, s); candle(ctx, x + 40, y, s); mug(ctx, x + 140, y, s); ctx.fillStyle = '#e8dcc0'; ctx.save(); ctx.translate(x - 20, y - 4); ctx.rotate(-0.08); ctx.fillRect(-60, -6, 120, 8); ctx.restore(); });
    table(ctx, 250, 600, 260, 0.9, rng, function (x, y, s) { mug(ctx, x - 40, y, s); candle(ctx, x + 30, y, s); });
  };
  PAINTERS.trade = function (ctx, city, rng, pal, cul) {
    var r = room(ctx, pal, rng, { bx0: 330, bx1: 1270, by0: 110, by1: 540, beams: true });
    // big arches to the harbour
    for (var i = 0; i < 3; i++) {
      var ax = 420 + i * 280, aw = 220;
      archWindow(ctx, ax, 190, aw, 350, pal.arch === 'flat' ? 'round' : pal.arch, '#000'); viewOutside(ctx, ax, 150, aw, 390, i === 1 ? 'ships' : 'city', rng, 'day');
      ctx.strokeStyle = A.rgba(A.shade(pal.stone, 0.8)); ctx.lineWidth = 16; archWindow(ctx, ax, 190, aw, 350, pal.arch === 'flat' ? 'round' : pal.arch); ctx.stroke();
    }
    A.lightRays(ctx, 700, 250, 1.35, 0.5, 700, '#ffe0a0', 0.09, 8, rng);
    for (var c = 0; c < 6; c++) crate(ctx, 90 + c * 60 + rng() * 20, 680 - (c % 2) * 30, 80 + rng() * 30, 60 + rng() * 30, rng);
    for (var s = 0; s < 7; s++) sack(ctx, 1150 + s * 60 + rng() * 20, 830 - (s % 2) * 50, 1.3, ['#c9b48a', '#a88a5a', '#d8c8a0'][s % 3], rng);
    barrel(ctx, 1500, 700, 1.5, rng); barrel(ctx, 1420, 660, 1.2, rng);
    // counter with scales
    table(ctx, 760, 740, 640, 1.5, rng, function (x, y, s) {
      ctx.strokeStyle = '#c9a050'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 90); ctx.lineTo(x, y); ctx.moveTo(x - 60, y - 80); ctx.lineTo(x + 60, y - 80); ctx.stroke();
      ctx.fillStyle = '#c9a050'; ctx.beginPath(); ctx.ellipse(x - 60, y - 40, 24, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 60, y - 40, 24, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - 60, y - 80); ctx.lineTo(x - 80, y - 40); ctx.moveTo(x - 60, y - 80); ctx.lineTo(x - 40, y - 40); ctx.moveTo(x + 60, y - 80); ctx.lineTo(x + 40, y - 40); ctx.moveTo(x + 60, y - 80); ctx.lineTo(x + 80, y - 40); ctx.stroke();
      for (var k = 0; k < 7; k++) { ctx.fillStyle = A.rgba(A.jitter(['#d88a2a', '#6a3a1e', '#e8e0d0', '#3a2a1a', '#8a2a1e'][k % 5], rng, 20)); ctx.beginPath(); ctx.ellipse(x - 260 + k * 30, y - 6, 12, 6, 0, 0, Math.PI * 2); ctx.fill(); }
      candle(ctx, x + 210, y, 1.2);
    });
    for (var f = 0; f < 6; f++) figure(ctx, 420 + f * 150 + rng() * 40, 560, 100, ['#3a2a1e', '#2a3a4a', '#4a3020'][f % 3], rng, cul === 'islam' ? { turban: '#e8e0cc', robe: true } : {});
  };
  PAINTERS.library = function (ctx, city, rng, pal, cul) {
    var r = room(ctx, pal, rng, { bx0: 360, bx1: 1240, by0: 90, by1: 560, beams: false });
    bookshelf(ctx, 0, 60, 330, 700, rng, 0.85); bookshelf(ctx, 1270, 60, 330, 700, rng, 0.85);
    bookshelf(ctx, 380, 150, 220, 410, rng); bookshelf(ctx, 1000, 150, 220, 410, rng);
    // tall window
    archWindow(ctx, 650, 120, 300, 420, cul === 'islam' ? 'horseshoe' : 'pointed', '#000'); viewOutside(ctx, 650, 60, 300, 480, 'ships', rng, 'day');
    ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 10; archWindow(ctx, 650, 120, 300, 420, cul === 'islam' ? 'horseshoe' : 'pointed'); ctx.stroke();
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(800, 90); ctx.lineTo(800, 540); ctx.moveTo(650, 330); ctx.lineTo(950, 330); ctx.stroke();
    A.lightRays(ctx, 800, 300, 1.75, 0.4, 700, '#fff0c8', 0.1, 9, rng);
    // lectern with open book
    table(ctx, 800, 760, 720, 1.5, rng, function (x, y, s) {
      ctx.fillStyle = '#efe4c8'; ctx.beginPath(); ctx.moveTo(x - 190, y - 10); ctx.quadraticCurveTo(x - 90, y - 40, x, y - 16); ctx.quadraticCurveTo(x + 90, y - 40, x + 190, y - 10); ctx.lineTo(x + 190, y + 2); ctx.quadraticCurveTo(x + 90, y - 24, x, y); ctx.quadraticCurveTo(x - 90, y - 24, x - 190, y + 2); ctx.fill();
      ctx.strokeStyle = 'rgba(60,40,20,.35)'; ctx.lineWidth = 1; for (var l = 0; l < 6; l++) { ctx.beginPath(); ctx.moveTo(x - 170, y - 12 + l * 2 - 20 + l * 3); ctx.lineTo(x - 30, y - 16 + l * 3 - 16); ctx.stroke(); }
      candle(ctx, x - 280, y, 1.3); candle(ctx, x + 280, y, 1.3);
      // globe
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x + 380, y - 60, 8, 60);
      var g = ctx.createRadialGradient(x + 370, y - 130, 10, x + 384, y - 110, 70); g.addColorStop(0, '#e8d6a8'); g.addColorStop(1, '#6a5030');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + 384, y - 110, 55, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c9a050'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x + 384, y - 110, 62, -2.2, 1.2); ctx.stroke();
    });
    figure(ctx, 560, 600, 110, '#2a2420', rng, { robe: true });
  };
  PAINTERS.church = function (ctx, city, rng, pal, cul) {
    var stone = cul === 'islam' ? '#cdb892' : '#8c7c68';
    var p2 = { wall: A.shade(stone, 0.7), wall2: stone, floor: cul === 'islam' ? '#7a3a2a' : '#6a5a4a', beam: '#3a2e24', stone: stone };
    var r = room(ctx, p2, rng, { bx0: 520, bx1: 1080, by0: 80, by1: 580, beams: false, tiles: true });
    // columns
    for (var i = 0; i < 4; i++) {
      var t = i / 4, xl = 520 * t, xr = W - 520 * t, cw = 60 * (1 - t * 0.6), top = 80 * t;
      [xl + 40 * (1 - t), xr - 40 * (1 - t) - cw].forEach(function (cx) {
        var g = ctx.createLinearGradient(cx, 0, cx + cw, 0); g.addColorStop(0, A.rgba(A.shade(stone, 0.6))); g.addColorStop(0.4, A.rgba(A.shade(stone, 1.1))); g.addColorStop(1, A.rgba(A.shade(stone, 0.5)));
        ctx.fillStyle = g; ctx.fillRect(cx, top, cw, H - top);
      });
    }
    if (cul === 'islam') {
      // mihrab & lamps & carpets
      archWindow(ctx, 720, 260, 160, 320, 'horseshoe', '#2a5a6a');
      ctx.strokeStyle = '#d9b45f'; ctx.lineWidth = 6; archWindow(ctx, 720, 260, 160, 320, 'horseshoe'); ctx.stroke();
      for (var k = 0; k < 7; k++) { var lx = 560 + k * 80; lantern(ctx, lx, 200 + (k % 2) * 30, 0.8); }
      for (var c2 = 0; c2 < 4; c2++) rug(ctx, 800, 600 + c2 * 70, 500 + c2 * 180, 60, A.rgba(A.jitter('#8a2a22', rng, 30)), true);
    } else if (cul === 'eastasia' || cul === 'south') {
      // altar with statue silhouette and incense
      ctx.fillStyle = '#b8862a'; ctx.beginPath(); ctx.ellipse(800, 380, 90, 120, 0, 0, Math.PI * 2); ctx.fill(); A.glow(ctx, 800, 380, 300, '#ffcf70', 0.35);
      ctx.fillStyle = '#6a4a1a'; ctx.beginPath(); ctx.arc(800, 300, 36, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(740, 330, 120, 150);
      table(ctx, 800, 560, 400, 1, rng, function (x, y, s) { for (var q = -2; q <= 2; q++) candle(ctx, x + q * 60, y, 1); });
      for (var sm = 0; sm < 20; sm++) { ctx.fillStyle = 'rgba(220,220,220,' + (0.02 + rng() * 0.04) + ')'; ctx.beginPath(); ctx.ellipse(800 + (rng() - 0.5) * 200, 200 + rng() * 300, 40 + rng() * 60, 20, rng(), 0, Math.PI * 2); ctx.fill(); }
    } else {
      // rose window & altar
      var cx0 = 800, cy0 = 220;
      ctx.fillStyle = '#1a1422'; ctx.beginPath(); ctx.arc(cx0, cy0, 120, 0, Math.PI * 2); ctx.fill();
      var cols = ['#b8342a', '#2a5aa8', '#d9b45f', '#3a8a5a', '#8a3aa8'];
      for (var sg = 0; sg < 16; sg++) { ctx.fillStyle = cols[sg % 5]; ctx.beginPath(); ctx.moveTo(cx0, cy0); ctx.arc(cx0, cy0, 110, sg * Math.PI / 8, (sg + 1) * Math.PI / 8); ctx.fill(); }
      ctx.strokeStyle = '#2a2020'; ctx.lineWidth = 4; for (var ss = 0; ss < 16; ss++) { ctx.beginPath(); ctx.moveTo(cx0, cy0); ctx.lineTo(cx0 + Math.cos(ss * Math.PI / 8) * 110, cy0 + Math.sin(ss * Math.PI / 8) * 110); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(cx0, cy0, 110, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(cx0, cy0, 45, 0, Math.PI * 2); ctx.fillStyle = '#d9b45f'; ctx.fill(); ctx.stroke();
      A.glow(ctx, cx0, cy0, 260, '#ffe0b0', 0.35);
      A.lightRays(ctx, cx0, cy0, 1.57, 0.5, 700, '#ffe8c8', 0.08, 8, rng);
      table(ctx, 800, 580, 380, 1, rng, function (x, y, s) { ctx.fillStyle = '#d9b45f'; ctx.fillRect(x - 4, y - 90, 8, 90); ctx.fillRect(x - 26, y - 70, 52, 7); candle(ctx, x - 120, y, 1.2); candle(ctx, x + 120, y, 1.2); });
      // pews
      for (var pw = 0; pw < 5; pw++) { var py = 640 + pw * 55, pwid = 260 + pw * 60; ctx.fillStyle = '#3a2616'; ctx.fillRect(800 - pwid - 60, py, pwid, 18 + pw * 2); ctx.fillRect(860, py, pwid, 18 + pw * 2); }
    }
  };
  PAINTERS.inn = function (ctx, city, rng, pal, cul) {
    var r = room(ctx, pal, rng, { bx0: 420, bx1: 1180, by0: 150, by1: 560 });
    archWindow(ctx, 520, 240, 180, 220, cul === 'islam' ? 'horseshoe' : 'round', '#000'); viewOutside(ctx, 520, 190, 180, 270, 'ships', rng, 'dusk');
    ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 8; archWindow(ctx, 520, 240, 180, 220, cul === 'islam' ? 'horseshoe' : 'round'); ctx.stroke();
    fireplace(ctx, 1000, r.by1, 0.9, rng);
    // bed
    ctx.fillStyle = '#4a2e1a'; ctx.fillRect(80, 560, 460, 170); ctx.fillStyle = '#3a2214'; ctx.fillRect(60, 470, 40, 300);
    var bg = ctx.createLinearGradient(0, 560, 0, 640); bg.addColorStop(0, '#e8dcc0'); bg.addColorStop(1, '#b8a888');
    ctx.fillStyle = bg; ctx.fillRect(100, 560, 430, 70);
    ctx.fillStyle = A.rgba(A.jitter('#7a2a22', rng, 20)); ctx.fillRect(250, 575, 290, 90);
    ctx.fillStyle = '#f2ead8'; ctx.beginPath(); ctx.ellipse(170, 575, 60, 22, 0, 0, Math.PI * 2); ctx.fill();
    table(ctx, 820, 700, 300, 1.2, rng, function (x, y, s) { candle(ctx, x - 50, y, 1.2); mug(ctx, x + 40, y, 1.2); });
    rug(ctx, 800, 760, 700, 130, A.rgba(A.jitter('#5a2a22', rng, 20)), true);
  };
  PAINTERS.market = function (ctx, city, rng, pal, cul) {
    // outdoor bazaar street
    A.sky(ctx, W, H, 360, 'day', rng); A.clouds(ctx, W, H, 40, 220, 4, rng, '#fffaf0', 0.6);
    var st = A.STYLE[city.style] || A.STYLE.ib;
    ctx.fillStyle = A.rgba(A.shade(st.walls[0], 0.8)); ctx.fillRect(0, 150, W, 450);
    for (var i = 0; i < 9; i++) { var bx = i * 190 - 20; ctx.fillStyle = A.rgba(A.jitter(st.walls[i % st.walls.length], rng, 20)); ctx.fillRect(bx, 170 + rng() * 60, 180, 500); ctx.fillStyle = 'rgba(30,20,12,.7)'; archWindow(ctx, bx + 50, 380, 80, 150, pal.arch === 'flat' ? 'round' : pal.arch); ctx.fill(); }
    var g = ctx.createLinearGradient(0, 600, 0, H); g.addColorStop(0, '#9a8468'); g.addColorStop(1, '#5a4a38'); ctx.fillStyle = g; ctx.fillRect(0, 600, W, 300);
    var cols = ['#b8452e', '#e8dcc0', '#3a6a7a', '#c9962e', '#6a3a5a', '#2a5a3a'];
    for (var s2 = 0; s2 < 5; s2++) {
      var sx = 40 + s2 * 320, sy = 430, sw = 280;
      for (var k = 0; k < 7; k++) { ctx.fillStyle = k % 2 ? cols[s2 % cols.length] : '#efe6d0'; ctx.beginPath(); ctx.moveTo(sx + k * sw / 7, sy); ctx.lineTo(sx + (k + 1) * sw / 7, sy); ctx.lineTo(sx + (k + 1) * sw / 7 + 10, sy + 60); ctx.lineTo(sx + k * sw / 7 + 10, sy + 60); ctx.fill(); }
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(sx + 10, sy + 60, sw, 140);
      ctx.fillStyle = '#4a3020'; ctx.fillRect(sx + 10, sy + 150, sw, 60);
      // wares
      for (var w2 = 0; w2 < 8; w2++) {
        var wx = sx + 30 + w2 * 32, wy = sy + 145;
        if (s2 % 2) { ctx.strokeStyle = '#c0c4cc'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + 6, wy - 70); ctx.stroke(); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(wx - 6, wy - 6, 14, 6); }
        else { ctx.fillStyle = A.rgba(A.jitter(['#d9b45f', '#c0c4cc', '#b8342a', '#2a5aa8'][w2 % 4], rng, 30)); ctx.beginPath(); ctx.arc(wx, wy - 14, 9, 0, Math.PI * 2); ctx.fill(); A.glow(ctx, wx, wy - 14, 20, '#fff0c0', 0.2); }
      }
    }
    A.crowd(ctx, 0, W, 660, 200, 22, rng, ['#3a2a1e', '#5a2a22', '#2a3a4a', '#4a4030'], city.style);
    A.lightRays(ctx, 200, 0, 1.1, 0.5, 900, '#ffe0a0', 0.06, 6, rng);
  };
  PAINTERS.shipyard = function (ctx, city, rng, pal, cul) {
    A.sky(ctx, W, H, 460, 'day', rng); A.clouds(ctx, W, H, 40, 300, 5, rng, '#fffaf0', 0.65);
    A.sun(ctx, 300, 120, 24);
    A.water(ctx, W, 460, 620, '#6a9ac0', '#2a5a82', rng, 0.5);
    A.shipSide(ctx, 1300, 520, 0.6, { sails: ['sq', 'sq', 'lat'], hull: '#3a2618' }, rng, -1);
    // slipway & hull frame
    ctx.fillStyle = '#6a5a44'; ctx.beginPath(); ctx.moveTo(0, 620); ctx.lineTo(W, 600); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    ctx.fillStyle = '#4a3622'; ctx.fillRect(250, 660, 900, 30);
    ctx.strokeStyle = '#6a4424'; ctx.lineWidth = 12;
    for (var i = 0; i < 12; i++) { var x = 300 + i * 70, hgt = 150 + Math.sin(i / 11 * Math.PI) * 120; ctx.beginPath(); ctx.moveTo(x, 660); ctx.quadraticCurveTo(x - 50, 660 - hgt * 0.6, x - 10, 660 - hgt); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 10, 660); ctx.quadraticCurveTo(x + 60, 660 - hgt * 0.6, x + 20, 660 - hgt); ctx.stroke(); }
    ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(260, 650); ctx.quadraticCurveTo(700, 690, 1180, 600); ctx.stroke();
    ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(230, 560); ctx.quadraticCurveTo(700, 470, 1150, 430); ctx.stroke();
    // scaffolding
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 6;
    for (var sc = 0; sc < 6; sc++) { ctx.beginPath(); ctx.moveTo(260 + sc * 180, 690); ctx.lineTo(260 + sc * 180, 330); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(240, 420); ctx.lineTo(1180, 400); ctx.stroke();
    // timber piles
    for (var t = 0; t < 8; t++) { ctx.fillStyle = A.rgba(A.jitter('#8a6a40', rng, 20)); ctx.beginPath(); ctx.ellipse(1250 + (t % 4) * 60, 820 - Math.floor(t / 4) * 40, 28, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#6a4a28'; ctx.beginPath(); ctx.ellipse(1250 + (t % 4) * 60, 820 - Math.floor(t / 4) * 40, 12, 8, 0, 0, Math.PI * 2); ctx.fill(); }
    for (var f = 0; f < 6; f++) figure(ctx, 200 + f * 180 + rng() * 60, 800 + rng() * 40, 110, ['#3a2a1e', '#4a3020', '#2a2a3a'][f % 3], rng, {});
    A.lightRays(ctx, 300, 120, 0.9, 0.4, 900, '#ffe0a0', 0.06, 6, rng);
  };
  PAINTERS.palace = function (ctx, city, rng, pal, cul) {
    var stone = cul === 'islam' ? '#d6c09a' : cul === 'eastasia' ? '#8a2a1e' : '#b8a888';
    var p2 = { wall: A.shade(stone, 0.75), wall2: stone, floor: '#6a5a4a', beam: '#3a2e24', stone: stone };
    var r = room(ctx, p2, rng, { bx0: 460, bx1: 1140, by0: 90, by1: 560, beams: false, tiles: true });
    for (var i = 0; i < 4; i++) {
      var t = i / 4, cw = 70 * (1 - t * 0.6), top = 90 * t;
      [460 * t + 30 * (1 - t), W - 460 * t - 30 * (1 - t) - cw].forEach(function (cx) {
        var g = ctx.createLinearGradient(cx, 0, cx + cw, 0); g.addColorStop(0, A.rgba(A.shade(stone, 0.55))); g.addColorStop(0.4, A.rgba(A.shade(stone, 1.15))); g.addColorStop(1, A.rgba(A.shade(stone, 0.5)));
        ctx.fillStyle = g; ctx.fillRect(cx, top, cw, H - top);
      });
    }
    rug(ctx, 800, 560, 260, 340, '#7a1e1e', false);
    // throne
    ctx.fillStyle = '#4a1414'; ctx.fillRect(740, 300, 120, 220); ctx.fillStyle = '#d9b45f'; ctx.fillRect(730, 290, 140, 14); ctx.fillRect(730, 300, 12, 220); ctx.fillRect(858, 300, 12, 220);
    ctx.fillStyle = '#6a1a1a'; ctx.fillRect(750, 420, 100, 50);
    A.glow(ctx, 800, 360, 260, '#ffe0a0', 0.25);
    banner(ctx, 560, 150, 90, 260, '#1d3f7a', emblemFor(city, cul)); banner(ctx, 950, 150, 90, 260, '#7a1e1e', 'star');
    // chandelier
    ctx.strokeStyle = '#c9a050'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(800, 0); ctx.lineTo(800, 110); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(800, 120, 90, 18, 0, 0, Math.PI * 2); ctx.stroke();
    for (var c = 0; c < 8; c++) candle(ctx, 800 + Math.cos(c / 8 * Math.PI * 2) * 90, 120 + Math.sin(c / 8 * Math.PI * 2) * 18, 0.8);
    for (var gdn = 0; gdn < 2; gdn++) figure(ctx, 600 + gdn * 400, 600, 150, '#3a3a44', rng, { hat: '#8a8a90' });
  };
  PAINTERS.mansion = function (ctx, city, rng, pal, cul) {
    var r = room(ctx, pal, rng, { bx0: 360, bx1: 1240, by0: 110, by1: 560 });
    bookshelf(ctx, 380, 160, 260, 400, rng, 0.9);
    // big window to harbour at dusk
    ctx.fillStyle = '#000'; ctx.fillRect(760, 170, 420, 330); ctx.beginPath(); ctx.rect(760, 170, 420, 330); viewOutside(ctx, 760, 150, 420, 350, 'ships', rng, 'dusk');
    ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 10; ctx.strokeRect(760, 170, 420, 330); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(970, 170); ctx.lineTo(970, 500); ctx.moveTo(760, 320); ctx.lineTo(1180, 320); ctx.stroke();
    // globe & map table
    table(ctx, 760, 760, 900, 1.6, rng, function (x, y, s) {
      ctx.fillStyle = '#e4d4ac'; ctx.save(); ctx.translate(x, y - 6); ctx.rotate(0.02); ctx.fillRect(-300, -30, 600, 34); ctx.restore();
      ctx.strokeStyle = 'rgba(120,40,30,.6)'; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(x - 240, y - 20); ctx.quadraticCurveTo(x - 60, y - 40, x + 180, y - 14); ctx.stroke(); ctx.setLineDash([]);
      candle(ctx, x - 360, y, 1.4); candle(ctx, x + 360, y, 1.4);
      ctx.fillStyle = '#c9a050'; ctx.beginPath(); ctx.arc(x + 200, y - 50, 40, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#8a6a30'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x + 200, y - 50, 48, 14, 0.5, 0, Math.PI * 2); ctx.stroke();
    });
    banner(ctx, 1230, 150, 80, 220, '#6a1e1e', emblemFor(city, cul));
    fireplace(ctx, 200, r.by1 + 60, 0.8, rng);
  };
  PAINTERS.guild = function (ctx, city, rng, pal, cul) {
    var r = room(ctx, pal, rng, { bx0: 400, bx1: 1200, by0: 130, by1: 560 });
    banner(ctx, 740, 170, 120, 280, '#1e3552', 'star');
    for (var m = 0; m < 3; m++) { ctx.fillStyle = '#e4d4ac'; ctx.fillRect(450 + m * 90, 220 + m * 10, 80, 110); ctx.strokeStyle = 'rgba(90,60,30,.5)'; ctx.strokeRect(450 + m * 90, 220 + m * 10, 80, 110); }
    bookshelf(ctx, 950, 200, 220, 360, rng, 0.9);
    table(ctx, 800, 740, 1000, 1.4, rng, function (x, y, s) { for (var q = -3; q <= 3; q++) { if (q % 2) candle(ctx, x + q * 120, y, 1.1); else mug(ctx, x + q * 120, y, 1.1); } });
    for (var f = 0; f < 5; f++) figure(ctx, 450 + f * 170, 640, 120, ['#2a1e16', '#3a2a1e', '#1e2a3a'][f % 3], rng, {});
    lantern(ctx, 600, 170, 1); lantern(ctx, 1000, 170, 1);
  };
  PAINTERS.harbor = function (ctx, city, rng, pal, cul) {
    A.sky(ctx, W, H, 430, 'golden', rng); A.sun(ctx, 1200, 180, 28, '#ffc080'); A.clouds(ctx, W, H, 60, 300, 6, rng, '#ffe8c8', 0.6);
    A.water(ctx, W, 430, H, '#7aa0c0', '#1f4868', rng, 0.7);
    for (var i = 0; i < 5; i++) A.shipSide(ctx, 150 + i * 330 + rng() * 60, 520 + (i % 2) * 90, 0.6 + (i % 2) * 0.35, { sails: i % 2 ? ['sq', 'sq', 'lat'] : ['sq', 'lat', 'lat'], hull: '#3a2416', cross: city.nation === '포르투갈' || city.nation === '카스티야' }, rng, i % 2 ? 1 : -1);
    ctx.fillStyle = '#5a4630'; ctx.beginPath(); ctx.moveTo(0, 740); ctx.lineTo(W, 700); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    for (var p = 0; p < 16; p++) { ctx.fillStyle = '#3a2a1a'; ctx.fillRect(p * 105, 690 + p * -2.5, 14, 80); }
    ctx.strokeStyle = 'rgba(30,20,10,.5)'; for (var pl = 0; pl < 12; pl++) { ctx.beginPath(); ctx.moveTo(0, 750 + pl * 14); ctx.lineTo(W, 712 + pl * 16); ctx.stroke(); }
    for (var b = 0; b < 4; b++) barrel(ctx, 1200 + b * 90, 850 - (b % 2) * 30, 1.2, rng);
    for (var c = 0; c < 3; c++) crate(ctx, 100 + c * 100, 860, 90, 70, rng);
    A.crowd(ctx, 300, 1100, 740, 120, 12, rng, ['#3a2a1e', '#5a2a22', '#2a3a4a'], city.style);
    A.lightRays(ctx, 1200, 180, 2.4, 0.5, 900, '#ffd8a0', 0.06, 6, rng);
  };
  PAINTERS.gate = function (ctx, city, rng, pal, cul) {
    A.sky(ctx, W, H, 520, 'day', rng); A.clouds(ctx, W, H, 60, 300, 5, rng, '#fffaf0', 0.6);
    A.ridge(ctx, W, 520, 80, 1, '#9aa890', rng, false); A.ridge(ctx, W, 560, 50, 1.2, '#7a8a5a', rng, false);
    var g = ctx.createLinearGradient(0, 560, 0, H); g.addColorStop(0, '#9a9a60'); g.addColorStop(1, '#6a6a3a'); ctx.fillStyle = g; ctx.fillRect(0, 560, W, H);
    ctx.fillStyle = '#b8a47a'; ctx.beginPath(); ctx.moveTo(760, 560); ctx.lineTo(840, 560); ctx.lineTo(1150, H); ctx.lineTo(450, H); ctx.fill();
    for (var t = 0; t < 14; t++) A.roundTree(ctx, 100 + rng() * 1400, 600 + rng() * 60, 20 + rng() * 20, '#4a6a34', rng);
    // gate arch in foreground (walls painted on a separate layer, arch cut out)
    var stone = A.hex(pal.stone), ak = pal.arch === 'flat' ? 'round' : pal.arch;
    var L = A.canvas(W, H), lc = L.getContext('2d');
    var wg = lc.createLinearGradient(0, 0, W, 0);
    wg.addColorStop(0, A.rgba(A.shade(stone, 0.42))); wg.addColorStop(0.5, A.rgba(A.shade(stone, 0.62))); wg.addColorStop(1, A.rgba(A.shade(stone, 0.4)));
    lc.fillStyle = wg; lc.fillRect(0, 0, W, H);
    for (var s = 0; s < 26; s++) {
      for (var sx = -40 + (s % 2) * 45; sx < W; sx += 90) { lc.fillStyle = 'rgba(0,0,0,' + (0.05 + rng() * 0.12) + ')'; lc.fillRect(sx, s * 36, 86, 32); lc.fillStyle = 'rgba(255,235,200,' + (rng() * 0.06) + ')'; lc.fillRect(sx, s * 36, 86, 3); }
    }
    lc.globalCompositeOperation = 'destination-out'; archWindow(lc, 420, 150, 760, 800, ak); lc.fillStyle = '#000'; lc.fill(); lc.globalCompositeOperation = 'source-over';
    lc.strokeStyle = A.rgba(A.shade(stone, 0.95)); lc.lineWidth = 34; archWindow(lc, 420, 150, 760, 800, ak); lc.stroke();
    lc.strokeStyle = 'rgba(0,0,0,.35)'; lc.lineWidth = 6; archWindow(lc, 400, 130, 800, 820, ak); lc.stroke();
    ctx.drawImage(L, 0, 0);
    // shadow cast by the gate onto the road
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, 860, W, 40);
    figure(ctx, 330, 860, 220, '#3a3a44', rng, { hat: '#8a8a90' });
  };
  PAINTERS.home = function (ctx, city, rng, pal, cul) {
    PAINTERS.inn(ctx, city, rng, pal, cul);
    ctx.fillStyle = 'rgba(255,200,140,.08)'; ctx.fillRect(0, 0, W, H);
  };

  A.interior = function (kind, city, variant) {
    var c = A.canvas(W, H), ctx = c.getContext('2d');
    var rng = U.makeRng(U.strHash(kind + ':' + city.id + ':' + (variant || '')));
    var cul = cultureOf(city), pal = PAL[cul];
    var painter = PAINTERS[kind] || PAINTERS.tavern;
    painter(ctx, city, rng, pal, cul);
    A.grade(ctx, W, H, '#ffa850', 0.3);
    A.vignette(ctx, W, H, 0.7);
    A.applyGrain(ctx, W, H, 0.07);
    return c;
  };
})(window.G = window.G || {});
