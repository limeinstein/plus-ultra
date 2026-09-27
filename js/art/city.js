/* Procedural city views, parameterised by architectural style and city seed. */
(function (G) {
  'use strict';
  var A = G.Art, U = G.U;

  var STYLE = {
    ib: { walls: ['#efe6d2', '#e8d8b8', '#f3ecdd', '#e2c9a0', '#dcc39a'], roofs: ['#b5592f', '#a94f2a', '#c0673a', '#9c4a2a'], roof: 'tile', tower: 'bell', dome: null, veg: ['cypress', 'orange', 'palm'], hills: '#9a9a6a', water: ['#5d8fb8', '#2f5f86'] },
    ne: { walls: ['#a5563e', '#8f4a36', '#c9b08c', '#e9ddc2', '#7d5a45'], roofs: ['#3e3a3a', '#4a3a30', '#5a4636', '#6b3a2a'], roof: 'steep', tower: 'spire', timber: true, veg: ['round', 'pine'], hills: '#6d7a5a', water: ['#6c8aa2', '#3d5a72'] },
    it: { walls: ['#e3c08a', '#d9a86e', '#ecd6b0', '#c98e5e', '#f0dcc0'], roofs: ['#b3602f', '#a55330', '#c27040'], roof: 'tile', tower: 'campanile', dome: '#b86a3a', veg: ['cypress', 'round'], hills: '#8d9460', water: ['#5c8db4', '#2d5d84'] },
    gr: { walls: ['#f1ece0', '#e8e0cc', '#d9ccb0', '#e2d4b8'], roofs: ['#b5602f', '#a25530'], roof: 'tile', tower: 'bell', dome: '#7d8a94', veg: ['cypress', 'round'], hills: '#9a9a78', water: ['#4f8fbf', '#26608f'] },
    ru: { walls: ['#8a6a4a', '#7a5a3c', '#efe8da', '#a07a54'], roofs: ['#4a5a3a', '#5a4632', '#3a4a5a'], roof: 'steep', tower: 'onion', dome: '#d6a94a', veg: ['pine', 'round'], hills: '#6a7a5a', water: ['#6f8ba0', '#3a5670'] },
    is: { walls: ['#e9dcc0', '#dccaa4', '#f0e8d6', '#d4b88c', '#c9ae86'], roofs: null, roof: 'flat', tower: 'minaret', dome: '#e9e2d0', veg: ['palm', 'cypress', 'orange'], hills: '#b0a078', water: ['#4f8fb8', '#25608a'] },
    pe: { walls: ['#d9c098', '#cdb08a', '#e4d0ac'], roofs: null, roof: 'flat', tower: 'minaret-blue', dome: '#3aa0a8', veg: ['cypress', 'round'], hills: '#a89a7a', water: ['#5a8fb0', '#2a5f86'] },
    af: { walls: ['#b9814f', '#a8703f', '#c69060'], roofs: null, roof: 'mud', tower: 'mudtower', dome: null, veg: ['palm'], hills: '#b09060', water: ['#5a8fa8', '#2a5f7a'] },
    sw: { walls: ['#efe9dc', '#e6dcc6', '#d8cab0'], roofs: null, roof: 'flat', tower: 'minaret', dome: '#ece6d8', veg: ['palm'], hills: '#8a9a6a', water: ['#3fa0b8', '#1f6f90'] },
    in: { walls: ['#e6c89a', '#d9ae78', '#f0dcb8', '#c98e5e'], roofs: null, roof: 'flat', tower: 'shikhara', dome: '#efe6d6', veg: ['palm', 'round'], hills: '#8a9460', water: ['#4f95b0', '#236588'] },
    se: { walls: ['#b8905e', '#a57c4c', '#d4b48a'], roofs: ['#6a4a2a', '#7a5a34'], roof: 'thatch', tower: 'stupa', dome: '#d9a93a', veg: ['palm', 'round'], hills: '#5f7a4a', water: ['#4a9aa8', '#1f6a7a'] },
    cn: { walls: ['#b8452e', '#e4dccc', '#c9b394', '#a33a28'], roofs: ['#4a4a4a', '#3a3a3e', '#5a5048'], roof: 'curved', tower: 'pagoda', dome: null, veg: ['round', 'pine'], hills: '#6f7f5a', water: ['#5d8aa0', '#2d5a72'] },
    kr: { walls: ['#efe9dc', '#e2d8c4', '#c9b394'], roofs: ['#4a4a4e', '#3c3c42'], roof: 'curved', tower: 'pagoda', dome: null, veg: ['pine', 'round'], hills: '#6a7a5a', water: ['#5d8aa0', '#2d5a72'] },
    jp: { walls: ['#efe9dc', '#5a4632', '#e8dcc4'], roofs: ['#3a3a40', '#4a4036'], roof: 'curved', tower: 'pagoda', dome: null, veg: ['pine', 'round'], hills: '#5f7a52', water: ['#5d8aa0', '#2d5a72'] },
    az: { walls: ['#e6dcc6', '#d4c2a0', '#c9ae86'], roofs: null, roof: 'flat', tower: 'pyramid', dome: null, veg: ['palm', 'round'], hills: '#7a8a5a', water: ['#5a9aa8', '#2d6a7a'] },
    an: { walls: ['#9a9084', '#8a8074', '#aaa092'], roofs: ['#b89a5a', '#a88a4a'], roof: 'thatch', tower: 'stonetower', dome: null, veg: ['round'], hills: '#7a8060', water: ['#4f8aa8', '#265a7a'] },
    co: { walls: ['#f1ece0', '#efe0c0', '#e8cfa6', '#f0dcd0'], roofs: ['#b5592f', '#a94f2a'], roof: 'tile', tower: 'baroque', dome: '#b86a3a', veg: ['palm', 'round'], hills: '#6f8a52', water: ['#3fa0b8', '#1f6f90'] },
    tr: { walls: ['#a07a50', '#8a6a44'], roofs: ['#9a7a44', '#8a6a3a'], roof: 'cone', tower: null, dome: null, veg: ['palm', 'round'], hills: '#6f8a4a', water: ['#3f98a8', '#1f6a80'] },
    st: { walls: ['#e8e0cc', '#a08060', '#8a6a4a'], roofs: ['#6a5a4a'], roof: 'yurt', tower: 'minaret', dome: '#4a8aa0', veg: ['round'], hills: '#a09a70', water: ['#6a8aa0', '#3a5a70'] }
  };
  A.STYLE = STYLE;

  // ---------------------------------------------------------------- building primitives
  function roofPath(ctx, st, x, y, w, d, h, rc, rng) {
    var kind = st.roof;
    var top = A.rgba(A.shade(rc, 1.05)), side = A.rgba(A.shade(rc, 0.7));
    if (kind === 'tile' || kind === 'steep') {
      var rh = kind === 'steep' ? w * 0.55 : w * 0.26;
      ctx.fillStyle = top;
      ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x + w / 2, y - rh); ctx.lineTo(x + w + 3, y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = side;
      ctx.beginPath(); ctx.moveTo(x + w / 2, y - rh); ctx.lineTo(x + w / 2 + d, y - rh - d * 0.35); ctx.lineTo(x + w + d + 2, y - d * 0.35); ctx.lineTo(x + w + 3, y); ctx.closePath(); ctx.fill();
      // tile rows
      ctx.strokeStyle = 'rgba(60,25,10,.25)'; ctx.lineWidth = 1;
      for (var k = 1; k < 4; k++) { var yy = y - rh * k / 4; ctx.beginPath(); ctx.moveTo(x + (w / 2) * k / 4, yy); ctx.lineTo(x + w - (w / 2) * k / 4, yy); ctx.stroke(); }
      return rh;
    } else if (kind === 'curved') {
      var ch = w * 0.3;
      ctx.fillStyle = top;
      ctx.beginPath(); ctx.moveTo(x - w * 0.14, y - 2); ctx.quadraticCurveTo(x + w * 0.1, y - ch * 0.2, x + w * 0.2, y - ch); ctx.lineTo(x + w * 0.8, y - ch); ctx.quadraticCurveTo(x + w * 0.9, y - ch * 0.2, x + w * 1.14, y - 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = side; ctx.fillRect(x + w * 0.2, y - ch - 3, w * 0.6, 3);
      return ch;
    } else if (kind === 'thatch' || kind === 'cone') {
      var th = kind === 'cone' ? w * 0.7 : w * 0.45;
      ctx.fillStyle = top;
      ctx.beginPath(); ctx.moveTo(x - w * 0.1, y + 2); ctx.lineTo(x + w / 2, y - th); ctx.lineTo(x + w * 1.1, y + 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(60,40,15,.35)'; for (var s = 0; s < 6; s++) { ctx.beginPath(); ctx.moveTo(x + w / 2, y - th); ctx.lineTo(x - w * 0.1 + s * w * 0.24, y + 2); ctx.stroke(); }
      return th;
    } else if (kind === 'yurt') {
      ctx.fillStyle = top; ctx.beginPath(); ctx.ellipse(x + w / 2, y, w * 0.55, w * 0.3, 0, Math.PI, 0); ctx.fill();
      return w * 0.3;
    } else if (kind === 'mud') {
      ctx.fillStyle = A.rgba(A.shade(rc, 0.9));
      for (var p = 0; p < w; p += 7) ctx.fillRect(x + p, y - 6, 3, 6);
      return 6;
    } else { // flat
      ctx.fillStyle = A.rgba(A.shade(rc, 0.85)); ctx.fillRect(x - 2, y - 4, w + 4 + d * 0.6, 4);
      return 4;
    }
  }

  function house(ctx, st, x, base, w, h, rng, hazeCol, haze) {
    var wc = A.hex(st.walls[Math.floor(rng() * st.walls.length)]);
    var rc = A.hex(st.roofs ? st.roofs[Math.floor(rng() * st.roofs.length)] : wc);
    if (haze) { wc = A.mix(wc, hazeCol, haze); rc = A.mix(rc, hazeCol, haze); }
    var d = w * (0.18 + rng() * 0.12);
    var y = base - h;
    // side face (shadow)
    ctx.fillStyle = A.rgba(A.shade(wc, 0.62));
    ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w + d, y - d * 0.35); ctx.lineTo(x + w + d, base - d * 0.35); ctx.lineTo(x + w, base); ctx.closePath(); ctx.fill();
    // front face with warm light gradient
    var g = ctx.createLinearGradient(x, y, x + w, base);
    g.addColorStop(0, A.rgba(A.shade(wc, 1.08))); g.addColorStop(1, A.rgba(A.shade(wc, 0.9)));
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    if (st.timber && rng() < 0.6 && !haze) {
      ctx.strokeStyle = 'rgba(50,30,20,.75)'; ctx.lineWidth = Math.max(1, w * 0.035);
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
      for (var t = 1; t < 3; t++) { ctx.beginPath(); ctx.moveTo(x + w * t / 3, y); ctx.lineTo(x + w * t / 3, base); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(x, y + h * 0.5); ctx.lineTo(x + w, y + h * 0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w / 3, y + h * 0.5); ctx.moveTo(x + w, y); ctx.lineTo(x + 2 * w / 3, y + h * 0.5); ctx.stroke();
    }
    // windows
    if (w > 40 && (!haze || haze < 0.1)) { nearFacade(ctx, st, x, y, w, h, base, wc, rng); }
    else if (w > 10) {
      var rows = Math.max(1, Math.floor(h / 20)), cols = Math.max(1, Math.floor(w / 14));
      var ww = Math.max(2, w / cols * 0.32), wh = Math.max(3, h / rows * 0.36);
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
        if (rng() < 0.2) continue;
        var wx = x + (c + 0.5) * w / cols - ww / 2, wy = y + (r + 0.35) * h / rows;
        ctx.fillStyle = haze ? A.rgba(A.mix('#2a2018', hazeCol, haze)) : (rng() < 0.08 ? 'rgba(255,200,120,.85)' : 'rgba(40,30,22,.8)');
        if (st.roof === 'flat' || st.roof === 'mud') { ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + ww * 0.5); ctx.arc(wx + ww / 2, wy + ww * 0.5, ww / 2, Math.PI, 0); ctx.lineTo(wx + ww, wy + wh); ctx.fill(); }
        else ctx.fillRect(wx, wy, ww, wh);
      }
    }
    roofPath(ctx, st, x, y, w, d, h, rc, rng);
  }

  /** detailed facade for foreground houses: shuttered windows, arched door, balconies */
  function nearFacade(ctx, st, x, y, w, h, base, wc, rng) {
    var flat = st.roof === 'flat' || st.roof === 'mud';
    var floors = Math.max(1, Math.floor((h - 34) / 44)), cols = Math.max(1, Math.floor(w / 34));
    var shut = A.jitter(['#3f5a3a', '#2e4a6a', '#6a3a24', '#5a5a3a', '#7a4a2a'][Math.floor(rng() * 5)], rng, 20);
    var fh = (h - 30) / floors;
    for (var f = 0; f < floors; f++) {
      var wy = y + 10 + f * fh, wh = Math.min(26, fh * 0.55), ww = Math.min(14, w / cols * 0.36);
      for (var c = 0; c < cols; c++) {
        if (rng() < 0.12) continue;
        var wx = x + (c + 0.5) * w / cols - ww / 2;
        // recess & glass
        ctx.fillStyle = 'rgba(30,22,16,.85)';
        if (flat) { ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + ww * 0.5); ctx.arc(wx + ww / 2, wy + ww * 0.5, ww / 2, Math.PI, 0); ctx.lineTo(wx + ww, wy + wh); ctx.fill(); }
        else ctx.fillRect(wx, wy, ww, wh);
        if (rng() < 0.1) { ctx.fillStyle = 'rgba(255,196,110,.6)'; ctx.fillRect(wx + 1, wy + 2, ww - 2, wh - 3); }
        // sill
        ctx.fillStyle = A.rgba(A.shade(wc, 1.2)); ctx.fillRect(wx - 2, wy + wh, ww + 4, 2.5);
        // open shutters
        if (!flat && rng() < 0.75) { ctx.fillStyle = A.rgba(shut); ctx.fillRect(wx - ww * 0.55, wy, ww * 0.5, wh); ctx.fillRect(wx + ww * 1.05, wy, ww * 0.5, wh); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(wx - ww * 0.55, wy, ww * 0.12, wh); }
        // flower box
        if (rng() < 0.18) { ctx.fillStyle = '#5a3a22'; ctx.fillRect(wx - 1, wy + wh - 3, ww + 2, 4); for (var fl = 0; fl < 3; fl++) { ctx.fillStyle = ['#c0463a', '#e8c040', '#d06080'][fl]; ctx.beginPath(); ctx.arc(wx + 2 + fl * (ww - 4) / 2, wy + wh - 4, 1.8, 0, 7); ctx.fill(); } }
      }
      // balcony on the upper floors of wide houses
      if (f < floors - 1 && w > 80 && rng() < 0.3) { var by = wy + wh + 3; ctx.fillStyle = 'rgba(40,28,20,.8)'; ctx.fillRect(x + w * 0.2, by, w * 0.6, 3); ctx.strokeStyle = 'rgba(40,28,20,.7)'; ctx.lineWidth = 1; for (var b = 0; b < 8; b++) { ctx.beginPath(); ctx.moveTo(x + w * 0.2 + b * w * 0.6 / 7, by); ctx.lineTo(x + w * 0.2 + b * w * 0.6 / 7, by - 8); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(x + w * 0.2, by - 8); ctx.lineTo(x + w * 0.8, by - 8); ctx.stroke(); }
    }
    // ground-floor door (arched) and maybe a shop sign
    var dw = Math.min(22, w * 0.22), dh = Math.min(32, h * 0.3), dx = x + w * (0.3 + rng() * 0.4) - dw / 2;
    ctx.fillStyle = A.rgba(A.shade(wc, 0.72)); ctx.fillRect(dx - 3, base - dh - 3, dw + 6, dh + 3);
    ctx.fillStyle = '#3a2416'; ctx.beginPath(); ctx.moveTo(dx, base); ctx.lineTo(dx, base - dh + dw / 2); ctx.arc(dx + dw / 2, base - dh + dw / 2, dw / 2, Math.PI, 0); ctx.lineTo(dx + dw, base); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(dx + dw / 2, base); ctx.lineTo(dx + dw / 2, base - dh + dw * 0.5); ctx.stroke();
    if (rng() < 0.3) { ctx.strokeStyle = '#2a1c12'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(dx + dw + 4, base - dh - 8); ctx.lineTo(dx + dw + 18, base - dh - 8); ctx.stroke(); ctx.fillStyle = A.rgba(A.jitter('#8a5a2a', rng, 40)); ctx.fillRect(dx + dw + 8, base - dh - 6, 12, 10); }
    // weathering at the base
    var gd = ctx.createLinearGradient(0, base - 16, 0, base); gd.addColorStop(0, 'rgba(60,40,20,0)'); gd.addColorStop(1, 'rgba(60,40,20,.28)');
    ctx.fillStyle = gd; ctx.fillRect(x, base - 16, w, 16);
  }

  function tower(ctx, st, kind, x, base, s, rng, hazeCol, haze) {
    var wc = A.hex(st.walls[0]); if (haze) wc = A.mix(wc, hazeCol, haze);
    var dark = A.rgba(A.shade(wc, 0.62)), lit = A.rgba(A.shade(wc, 1.06));
    function box(x0, y0, w, h) { ctx.fillStyle = lit; ctx.fillRect(x0, y0, w, h); ctx.fillStyle = dark; ctx.fillRect(x0 + w * 0.62, y0, w * 0.38, h); }
    var domeC = A.hex(st.dome || '#b86a3a'); if (haze) domeC = A.mix(domeC, hazeCol, haze);
    if (kind === 'bell' || kind === 'campanile' || kind === 'baroque') {
      var w = 26 * s, h = 150 * s;
      box(x - w / 2, base - h, w, h);
      ctx.fillStyle = 'rgba(30,20,15,.85)'; ctx.fillRect(x - w * 0.3, base - h + 14 * s, w * 0.22, 18 * s); ctx.fillRect(x + w * 0.05, base - h + 14 * s, w * 0.22, 18 * s);
      if (kind === 'baroque') { box(x - w * 0.4, base - h - 26 * s, w * 0.8, 26 * s); ctx.fillStyle = A.rgba(domeC); ctx.beginPath(); ctx.arc(x, base - h - 26 * s, w * 0.4, Math.PI, 0); ctx.fill(); }
      else { ctx.fillStyle = A.rgba(A.shade(st.roofs ? st.roofs[0] : '#a94f2a', haze ? 1 : 1)); ctx.beginPath(); ctx.moveTo(x - w * 0.62, base - h); ctx.lineTo(x, base - h - 30 * s); ctx.lineTo(x + w * 0.62, base - h); ctx.fill(); }
      ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(x, base - h - 30 * s); ctx.lineTo(x, base - h - 44 * s); ctx.moveTo(x - 6 * s, base - h - 38 * s); ctx.lineTo(x + 6 * s, base - h - 38 * s); ctx.stroke();
    } else if (kind === 'spire') {
      var w2 = 30 * s, h2 = 120 * s;
      box(x - w2 / 2, base - h2, w2, h2);
      ctx.fillStyle = A.rgba(haze ? A.mix('#3a3a40', hazeCol, haze) : '#3a3a40');
      ctx.beginPath(); ctx.moveTo(x - w2 * 0.55, base - h2); ctx.lineTo(x, base - h2 - 110 * s); ctx.lineTo(x + w2 * 0.55, base - h2); ctx.fill();
    } else if (kind === 'onion') {
      var w3 = 28 * s; box(x - w3 / 2, base - 90 * s, w3, 90 * s);
      ctx.fillStyle = A.rgba(domeC);
      ctx.beginPath(); ctx.moveTo(x - w3 * 0.65, base - 90 * s); ctx.bezierCurveTo(x - w3 * 0.9, base - 120 * s, x - w3 * 0.1, base - 130 * s, x, base - 150 * s); ctx.bezierCurveTo(x + w3 * 0.1, base - 130 * s, x + w3 * 0.9, base - 120 * s, x + w3 * 0.65, base - 90 * s); ctx.fill();
      A.glow(ctx, x - 5 * s, base - 115 * s, 14 * s, '#fff0c0', 0.25);
    } else if (kind === 'minaret' || kind === 'minaret-blue') {
      var w4 = 12 * s, h4 = 150 * s;
      box(x - w4 / 2, base - h4, w4, h4);
      ctx.fillStyle = kind === 'minaret-blue' ? A.rgba(haze ? A.mix('#2f8f9a', hazeCol, haze) : '#2f8f9a') : lit;
      ctx.fillRect(x - w4 * 0.9, base - h4 * 0.72, w4 * 1.8, 5 * s); ctx.fillRect(x - w4 * 0.8, base - h4, w4 * 1.6, 5 * s);
      ctx.beginPath(); ctx.moveTo(x - w4 * 0.55, base - h4); ctx.lineTo(x, base - h4 - 26 * s); ctx.lineTo(x + w4 * 0.55, base - h4); ctx.fill();
    } else if (kind === 'shikhara') {
      var w5 = 50 * s, h5 = 130 * s;
      ctx.fillStyle = lit;
      ctx.beginPath(); ctx.moveTo(x - w5 / 2, base); ctx.lineTo(x - w5 / 2, base - h5 * 0.4); ctx.bezierCurveTo(x - w5 * 0.45, base - h5 * 0.85, x - w5 * 0.2, base - h5, x, base - h5); ctx.bezierCurveTo(x + w5 * 0.2, base - h5, x + w5 * 0.45, base - h5 * 0.85, x + w5 / 2, base - h5 * 0.4); ctx.lineTo(x + w5 / 2, base); ctx.fill();
      ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(x + w5 * 0.1, base); ctx.lineTo(x + w5 * 0.1, base - h5 * 0.98); ctx.bezierCurveTo(x + w5 * 0.3, base - h5 * 0.95, x + w5 * 0.45, base - h5 * 0.85, x + w5 / 2, base - h5 * 0.4); ctx.lineTo(x + w5 / 2, base); ctx.fill();
      ctx.strokeStyle = 'rgba(80,50,30,.35)'; for (var k = 1; k < 8; k++) { ctx.beginPath(); ctx.moveTo(x - w5 / 2, base - h5 * k / 9); ctx.lineTo(x + w5 / 2, base - h5 * k / 9); ctx.stroke(); }
      ctx.fillStyle = '#d9a93a'; ctx.beginPath(); ctx.arc(x, base - h5 - 6 * s, 7 * s, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'stupa') {
      var r = 34 * s; ctx.fillStyle = lit; ctx.fillRect(x - r * 1.2, base - 16 * s, r * 2.4, 16 * s);
      var gg = ctx.createLinearGradient(x - r, 0, x + r, 0); gg.addColorStop(0, A.rgba(A.shade(domeC, 1.3))); gg.addColorStop(1, A.rgba(A.shade(domeC, 0.6)));
      ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(x - r, base - 16 * s); ctx.bezierCurveTo(x - r, base - 60 * s, x - 8 * s, base - 70 * s, x, base - 130 * s); ctx.bezierCurveTo(x + 8 * s, base - 70 * s, x + r, base - 60 * s, x + r, base - 16 * s); ctx.fill();
      A.glow(ctx, x - r * 0.3, base - 60 * s, 30 * s, '#ffe7a0', 0.25);
    } else if (kind === 'pagoda') {
      var tiers = 5, pw = 44 * s, ph = 26 * s, yb = base;
      for (var i = 0; i < tiers; i++) {
        var tw = pw * (1 - i * 0.13);
        box(x - tw * 0.4, yb - ph, tw * 0.8, ph);
        ctx.fillStyle = A.rgba(haze ? A.mix('#3a3a40', hazeCol, haze) : '#3a3a40');
        ctx.beginPath(); ctx.moveTo(x - tw * 0.75, yb - ph + 3 * s); ctx.quadraticCurveTo(x - tw * 0.5, yb - ph - 2 * s, x - tw * 0.35, yb - ph - 9 * s); ctx.lineTo(x + tw * 0.35, yb - ph - 9 * s); ctx.quadraticCurveTo(x + tw * 0.5, yb - ph - 2 * s, x + tw * 0.75, yb - ph + 3 * s); ctx.fill();
        yb -= ph + 7 * s;
      }
      ctx.strokeStyle = '#8a7a50'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(x, yb); ctx.lineTo(x, yb - 26 * s); ctx.stroke();
    } else if (kind === 'pyramid') {
      var steps = 5, bw = 150 * s, sh = 20 * s;
      for (var j = 0; j < steps; j++) {
        var sw = bw * (1 - j * 0.16), yy = base - j * sh;
        ctx.fillStyle = lit; ctx.fillRect(x - sw / 2, yy - sh, sw * 0.62, sh);
        ctx.fillStyle = dark; ctx.fillRect(x - sw / 2 + sw * 0.62, yy - sh, sw * 0.38, sh);
      }
      ctx.fillStyle = 'rgba(120,40,30,.85)'; ctx.fillRect(x - 6 * s, base - steps * sh, 12 * s, steps * sh);
      box(x - 18 * s, base - steps * sh - 26 * s, 36 * s, 26 * s);
      ctx.fillStyle = A.rgba(haze ? A.mix('#a0422a', hazeCol, haze) : '#a0422a'); ctx.fillRect(x - 20 * s, base - steps * sh - 30 * s, 40 * s, 5 * s);
    } else if (kind === 'mudtower') {
      var w6 = 46 * s, h6 = 110 * s;
      ctx.fillStyle = lit; ctx.beginPath(); ctx.moveTo(x - w6 / 2, base); ctx.lineTo(x - w6 * 0.35, base - h6); ctx.lineTo(x + w6 * 0.35, base - h6); ctx.lineTo(x + w6 / 2, base); ctx.fill();
      ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(x + w6 * 0.1, base); ctx.lineTo(x + w6 * 0.1, base - h6); ctx.lineTo(x + w6 * 0.35, base - h6); ctx.lineTo(x + w6 / 2, base); ctx.fill();
      ctx.strokeStyle = 'rgba(60,40,20,.8)'; ctx.lineWidth = 2 * s;
      for (var q = 0; q < 5; q++) for (var e = -1; e <= 1; e += 2) { var yy2 = base - h6 * (0.2 + q * 0.17); ctx.beginPath(); ctx.moveTo(x + e * w6 * 0.42, yy2); ctx.lineTo(x + e * w6 * 0.58, yy2); ctx.stroke(); }
      ctx.fillStyle = lit; for (var cc = -1; cc <= 1; cc++) { ctx.beginPath(); ctx.moveTo(x + cc * 12 * s - 5 * s, base - h6); ctx.lineTo(x + cc * 12 * s, base - h6 - 14 * s); ctx.lineTo(x + cc * 12 * s + 5 * s, base - h6); ctx.fill(); }
    } else if (kind === 'stonetower') {
      var w7 = 40 * s, h7 = 80 * s; box(x - w7 / 2, base - h7, w7, h7);
      ctx.strokeStyle = 'rgba(40,35,30,.35)'; for (var z = 0; z < 8; z++) { ctx.beginPath(); ctx.moveTo(x - w7 / 2, base - z * 10 * s); ctx.lineTo(x + w7 / 2, base - z * 10 * s); ctx.stroke(); }
      ctx.fillStyle = A.rgba(haze ? A.mix('#b89a5a', hazeCol, haze) : '#b89a5a'); ctx.beginPath(); ctx.moveTo(x - w7 * 0.62, base - h7); ctx.lineTo(x, base - h7 - 40 * s); ctx.lineTo(x + w7 * 0.62, base - h7); ctx.fill();
    }
  }

  function bigDome(ctx, x, base, r, col, lit, hazeCol, haze) {
    var c = A.hex(col); if (haze) c = A.mix(c, hazeCol, haze);
    var wc = A.hex(lit); if (haze) wc = A.mix(wc, hazeCol, haze);
    ctx.fillStyle = A.rgba(A.shade(wc, 1.05)); ctx.fillRect(x - r * 1.05, base - r * 0.55, r * 2.1, r * 0.55);
    ctx.fillStyle = A.rgba(A.shade(wc, 0.65)); ctx.fillRect(x + r * 0.4, base - r * 0.55, r * 0.65, r * 0.55);
    var g = ctx.createRadialGradient(x - r * 0.4, base - r * 1.2, r * 0.1, x, base - r * 0.8, r * 1.1);
    g.addColorStop(0, A.rgba(A.shade(c, 1.35))); g.addColorStop(1, A.rgba(A.shade(c, 0.6)));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, base - r * 0.55, r, r * 0.95, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = A.rgba(A.shade(c, 0.5)); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, base - r * 1.5); ctx.lineTo(x, base - r * 1.75); ctx.stroke();
  }

  function vegetation(ctx, st, x, y, s, rng) {
    var kind = st.veg[Math.floor(rng() * st.veg.length)];
    if (kind === 'cypress') A.cypress(ctx, x, y, 90 * s, '#35502c', true);
    else if (kind === 'palm') A.palm(ctx, x, y, 110 * s, '#4a6a30', rng);
    else if (kind === 'orange') A.orangeTree(ctx, x, y, 34 * s, rng);
    else if (kind === 'pine') A.pine(ctx, x, y, 90 * s, '#2f4a30');
    else A.roundTree(ctx, x, y, 36 * s, '#4a6a34', rng);
  }

  // ---------------------------------------------------------------- city composition
  /** opts: {w, h, time:'day'|'golden'|'dusk'|'night', port:true, snow:bool, flag:color} */
  A.cityScene = function (city, opts) {
    opts = opts || {};
    var W = opts.w || 1600, H = opts.h || 900;
    var c = A.canvas(W, H), ctx = c.getContext('2d');
    var rng = U.makeRng(1000 + city.id * 7919);
    var st = STYLE[city.style] || STYLE.ib;
    var time = opts.time || 'day';
    var horizon = 360 + Math.floor(rng() * 60);
    var skyCol = time === 'dusk' ? '#e8a070' : time === 'night' ? '#20284a' : '#e9dcc0';
    A.sky(ctx, W, H, horizon + 60, time, rng);
    // sun
    if (time !== 'night') A.sun(ctx, 260 + rng() * 300, 110 + rng() * 60, 26, time === 'dusk' ? '#ffb070' : '#ffe2a0');
    else { ctx.fillStyle = '#f2ecd8'; ctx.beginPath(); ctx.arc(1180, 120, 22, 0, Math.PI * 2); ctx.fill(); A.glow(ctx, 1180, 120, 120, '#c8d4ff', 0.3); }
    A.clouds(ctx, W, H, 60, horizon - 80, 5 + Math.floor(rng() * 4), rng, time === 'dusk' ? '#ffd2b0' : '#fffaf0', time === 'night' ? 0.15 : 0.7);
    if (time !== 'night') A.birds(ctx, 500, 60, 700, 160, 6 + Math.floor(rng() * 6), rng);
    // mountains
    var snowy = opts.snow || [10, 26, 27, 55, 139, 136, 137, 219, 223, 218, 54, 181, 183].indexOf(city.id) >= 0;
    var hillCol = A.hex(st.hills);
    A.ridge(ctx, W, horizon + 10, snowy ? 180 : 70 + rng() * 60, 1, A.mix(hillCol, skyCol, 0.62), rng, snowy);
    A.ridge(ctx, W, horizon + 40, 40 + rng() * 50, 1.4, A.mix(hillCol, skyCol, 0.4), rng, false);
    var port = city.port;
    // water
    var waterTop = horizon + 30, waterBot = port ? 560 + rng() * 40 : horizon + 30;
    if (port) {
      A.water(ctx, W, waterTop, waterBot, A.mix(st.water[0], skyCol, 0.3), st.water[1], rng, 0.5);
      // distant ships
      for (var sh = 0; sh < 4 + rng() * 5; sh++) {
        var sx = 600 + rng() * 950, sy = waterTop + 8 + rng() * (waterBot - waterTop) * 0.5, ss = 0.12 + (sy - waterTop) / (waterBot - waterTop) * 0.35;
        A.shipSide(ctx, sx, sy, ss, { sails: rng() < 0.5 ? ['sq', 'sq', 'lat'] : ['lat', 'lat'], hull: '#3a2618', cross: city.nation === '포르투갈' || city.nation === '카스티야' }, rng, rng() < 0.5 ? 1 : -1);
      }
    }
    // far city on hills (hazy, small)
    var hazeCol = A.hex(skyCol);
    var farBase = port ? waterTop + 6 : horizon + 70;
    var x;
    for (x = port ? -20 : 0; x < (port ? 620 + rng() * 300 : W); ) {
      var fw = 10 + rng() * 16, fh = 8 + rng() * 16;
      house(ctx, st, x, farBase + (port ? 0 : rng() * 20), fw, fh, rng, hazeCol, 0.55);
      x += fw * (0.8 + rng() * 0.5);
    }
    // landmark row (mid)
    var midBase = port ? waterBot - 20 : horizon + 190;
    var lmX = 380 + rng() * 520;
    var lmS = 1.0 + rng() * 0.3;
    // mid-distance houses (behind landmark)
    for (x = -30; x < (port ? 760 + rng() * 200 : W + 20); ) {
      var mw = 22 + rng() * 34, mh = 20 + rng() * 40;
      house(ctx, st, x, midBase - rng() * 30, mw, mh, rng, hazeCol, 0.28);
      x += mw * (0.75 + rng() * 0.4);
    }
    // landmarks
    var lmKinds = [];
    if (st.tower) lmKinds.push(st.tower);
    if (st.dome && (city.rel === 'I' || city.style === 'it' || city.style === 'gr' || city.style === 'co' || city.style === 'in')) lmKinds.push('dome');
    if (city.style === 'az') lmKinds = ['pyramid'];
    if (city.size >= 3 && st.tower) lmKinds.push(st.tower);
    lmKinds.forEach(function (k, i) {
      var lx = lmX + (i - (lmKinds.length - 1) / 2) * (140 + rng() * 60);
      if (k === 'dome') bigDome(ctx, lx, midBase + 8, 46 * lmS, st.dome, st.walls[0], hazeCol, 0.12);
      else tower(ctx, st, k, lx, midBase + 10, lmS * (0.9 + rng() * 0.3), rng, hazeCol, 0.12);
      if (k === 'dome' && city.rel === 'I') { tower(ctx, st, st.tower === 'minaret-blue' ? 'minaret-blue' : 'minaret', lx - 70 * lmS, midBase + 10, lmS * 0.9, rng, hazeCol, 0.12); tower(ctx, st, st.tower === 'minaret-blue' ? 'minaret-blue' : 'minaret', lx + 70 * lmS, midBase + 10, lmS * 0.9, rng, hazeCol, 0.12); }
    });
    // castle / walls on hill for capitals
    if (city.flags && city.flags.indexOf('P') >= 0 && city.style !== 'az') {
      var cx0 = port ? 60 + rng() * 200 : 900 + rng() * 400, cy0 = midBase - 70;
      var wc = A.hex(st.walls[st.walls.length - 1]);
      ctx.fillStyle = A.rgba(A.mix(A.shade(wc, 0.95), hazeCol, 0.25)); ctx.fillRect(cx0, cy0, 220, 60);
      for (var tt = 0; tt < 4; tt++) { ctx.fillRect(cx0 - 6 + tt * 72, cy0 - 30, 26, 90); for (var cr = 0; cr < 3; cr++) ctx.fillRect(cx0 - 6 + tt * 72 + cr * 10, cy0 - 38, 6, 8); }
      ctx.fillStyle = A.rgba(A.mix(A.shade(wc, 0.6), hazeCol, 0.25)); ctx.fillRect(cx0 + 150, cy0, 70, 60);
      if (opts.flag) { ctx.fillStyle = opts.flag; ctx.fillRect(cx0 + 150, cy0 - 62, 22, 14); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(cx0 + 149, cy0 - 64, 2, 36); }
    }
    // harbor quay + near ships
    if (port) {
      var qy = waterBot - 4;
      ctx.fillStyle = '#6e5a44'; ctx.fillRect(0, qy, W, 18);
      ctx.fillStyle = '#4a3a2c'; ctx.fillRect(0, qy + 14, W, 6);
      for (var ns = 0; ns < 3; ns++) {
        var nx = 820 + ns * 250 + rng() * 80;
        A.shipSide(ctx, nx, qy + 2, 0.75 + rng() * 0.2, { sails: ns === 1 ? ['sq', 'sq', 'lat'] : ['sq', 'lat', 'lat'], hull: '#4a2e1c', cross: city.nation === '포르투갈' || city.nation === '카스티야', flag: opts.flag }, rng, rng() < 0.5 ? 1 : -1);
      }
      // crane
      ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 5; var crx = 740 + rng() * 60;
      ctx.beginPath(); ctx.moveTo(crx, qy); ctx.lineTo(crx + 10, qy - 150); ctx.lineTo(crx + 90, qy - 120); ctx.stroke();
      ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(crx + 90, qy - 120); ctx.lineTo(crx + 88, qy - 50); ctx.stroke();
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(crx + 80, qy - 50, 18, 14);
    }
    // near buildings row
    var nearBase = port ? 690 : 660;
    // waterfront: quay surface with cargo, bollards and dock hands
    if (port) {
      var dy0 = qy + 18, dy1 = nearBase + 14;
      var dg = ctx.createLinearGradient(0, dy0, 0, dy1); dg.addColorStop(0, '#7e6e58'); dg.addColorStop(1, '#9c8668');
      ctx.fillStyle = dg; ctx.fillRect(600, dy0, W - 600, dy1 - dy0);
      ctx.strokeStyle = 'rgba(40,30,20,.22)'; ctx.lineWidth = 1;
      for (var ry = dy0 + 8; ry < dy1; ry += 10 + (ry - dy0) * 0.06) { ctx.beginPath(); ctx.moveTo(600, ry); ctx.lineTo(W, ry); ctx.stroke(); }
      for (var rx = 600; rx < W; rx += 38) { ctx.beginPath(); ctx.moveTo(rx, dy0); ctx.lineTo(rx + (rx - 1100) * 0.08, dy1); ctx.stroke(); }
      // bollards along the edge
      for (var bx = 640; bx < W; bx += 110 + rng() * 40) { ctx.fillStyle = '#2e241c'; ctx.fillRect(bx, dy0 - 2, 9, 12); ctx.fillStyle = '#4a3a2c'; ctx.fillRect(bx - 2, dy0 - 5, 13, 4); }
      // cargo piles
      for (var cp = 0; cp < 9; cp++) {
        var px = 660 + rng() * 880, py = dy0 + 18 + rng() * (dy1 - dy0 - 26), sc = 0.7 + (py - dy0) / (dy1 - dy0) * 0.5;
        var kind = rng();
        if (kind < 0.4) { // crates
          for (var ci = 0; ci < 1 + Math.floor(rng() * 3); ci++) { var cw = 26 * sc, ch = 20 * sc, cx0 = px + ci * cw * 0.9, cy0 = py - (ci === 2 ? ch : 0); ctx.fillStyle = A.rgba(A.jitter('#8a6a40', rng, 20)); ctx.fillRect(cx0, cy0 - ch, cw, ch); ctx.strokeStyle = 'rgba(40,25,10,.6)'; ctx.strokeRect(cx0 + 1, cy0 - ch + 1, cw - 2, ch - 2); ctx.beginPath(); ctx.moveTo(cx0 + 1, cy0 - ch + 1); ctx.lineTo(cx0 + cw - 1, cy0 - 1); ctx.stroke(); }
        } else if (kind < 0.7) { // barrels
          for (var bi = 0; bi < 2 + Math.floor(rng() * 2); bi++) { var bxx = px + bi * 20 * sc; var bgr = ctx.createLinearGradient(bxx - 9 * sc, 0, bxx + 9 * sc, 0); bgr.addColorStop(0, '#3a2414'); bgr.addColorStop(0.4, '#7a5230'); bgr.addColorStop(1, '#3a2414'); ctx.fillStyle = bgr; ctx.beginPath(); ctx.ellipse(bxx, py - 12 * sc, 9 * sc, 13 * sc, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#1e140a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bxx - 9 * sc, py - 17 * sc); ctx.lineTo(bxx + 9 * sc, py - 17 * sc); ctx.moveTo(bxx - 9 * sc, py - 7 * sc); ctx.lineTo(bxx + 9 * sc, py - 7 * sc); ctx.stroke(); }
        } else { // sacks
          for (var si = 0; si < 3; si++) { ctx.fillStyle = A.rgba(A.jitter('#c2a878', rng, 25)); ctx.beginPath(); ctx.ellipse(px + si * 16 * sc, py - 8 * sc - (si === 1 ? 8 * sc : 0), 11 * sc, 8 * sc, 0, 0, 7); ctx.fill(); }
        }
      }
      // coiled rope
      ctx.strokeStyle = '#8a7048'; ctx.lineWidth = 2; for (var rr = 0; rr < 3; rr++) { ctx.beginPath(); ctx.ellipse(1480, dy0 + 30, 16 - rr * 4, 6 - rr * 1.5, 0, 0, 7); ctx.stroke(); }
      // dock hands
      A.crowd(ctx, 700, 1520, dy0 + 20, dy1 - dy0 - 20, 7, rng, ['#3a2a1e', '#5a3a22', '#2a3a4a', '#6a5a40'], city.style);
      // warehouse framing the right edge
      var whc = A.hex(st.walls[1] || st.walls[0]);
      ctx.fillStyle = A.rgba(A.shade(whc, 0.8)); ctx.fillRect(1500, dy0 - 120, 110, dy1 - dy0 + 120);
      ctx.fillStyle = A.rgba(A.shade(whc, 0.55)); ctx.fillRect(1500, dy0 - 120, 14, dy1 - dy0 + 120);
      ctx.fillStyle = '#3a2416'; ctx.fillRect(1530, dy1 - 60, 44, 58);
      ctx.fillStyle = A.rgba(st.roofs ? A.hex(st.roofs[0]) : A.shade(whc, 0.6)); ctx.beginPath(); ctx.moveTo(1490, dy0 - 118); ctx.lineTo(1560, dy0 - 150); ctx.lineTo(1620, dy0 - 118); ctx.fill();
    }
    for (x = -40; x < W + 40; ) {
      if (port && x > 640 && x < 1500) { x += 60; continue; }
      var bw = 70 + rng() * 90, bh = 90 + rng() * 120;
      house(ctx, st, x, nearBase + rng() * 12, bw, bh, rng, hazeCol, 0.06);
      if (rng() < 0.45) vegetation(ctx, st, x + bw + 10, nearBase + 16, 1.0 + rng() * 0.5, rng);
      x += bw * (0.85 + rng() * 0.3);
    }
    // street / plaza
    var g = ctx.createLinearGradient(0, nearBase, 0, H);
    var pave = st.roof === 'mud' || city.style === 'tr' ? '#b08a5a' : city.style === 'cn' || city.style === 'jp' || city.style === 'kr' ? '#8a8276' : '#a8957a';
    g.addColorStop(0, A.rgba(A.shade(pave, 0.95))); g.addColorStop(1, A.rgba(A.shade(pave, 0.62)));
    ctx.fillStyle = g; ctx.fillRect(0, nearBase + 8, W, H - nearBase);
    // cobblestones
    for (var cy = nearBase + 16; cy < H; cy += 8 + (cy - nearBase) * 0.05) {
      var rowH = 6 + (cy - nearBase) * 0.045;
      for (var cx = -rng() * 30; cx < W; cx += rowH * 1.6 + rng() * 6) {
        ctx.fillStyle = 'rgba(40,30,20,' + (0.08 + rng() * 0.1) + ')';
        ctx.beginPath(); ctx.ellipse(cx, cy, rowH * 0.75, rowH * 0.32, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,240,210,' + (0.05 + rng() * 0.07) + ')';
        ctx.beginPath(); ctx.ellipse(cx - 1, cy - rowH * 0.12, rowH * 0.5, rowH * 0.15, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    // market awnings
    var awnCols = ['#b8452e', '#e8dcc0', '#3a6a7a', '#c9962e', '#6a3a5a'];
    for (var aw = 0; aw < 4 + rng() * 3; aw++) {
      var ax = 60 + rng() * 1100, ay = nearBase + 30 + rng() * 40, aww = 90 + rng() * 60;
      ctx.fillStyle = '#4a3422'; ctx.fillRect(ax + 4, ay, 4, 60); ctx.fillRect(ax + aww - 8, ay, 4, 60);
      var ac = awnCols[Math.floor(rng() * awnCols.length)];
      for (var sidx = 0; sidx < 6; sidx++) { ctx.fillStyle = sidx % 2 ? ac : '#efe6d0'; ctx.beginPath(); ctx.moveTo(ax + sidx * aww / 6, ay); ctx.lineTo(ax + (sidx + 1) * aww / 6, ay); ctx.lineTo(ax + (sidx + 1) * aww / 6 + 4, ay + 22); ctx.lineTo(ax + sidx * aww / 6 + 4, ay + 22); ctx.fill(); }
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(ax + 4, ay + 22, aww, 40);
      for (var gd = 0; gd < 5; gd++) { ctx.fillStyle = A.rgba(A.jitter(['#d88a2a', '#7a9a3a', '#c9b48a', '#8a4a2a'][gd % 4], rng, 30)); ctx.beginPath(); ctx.arc(ax + 16 + gd * (aww - 20) / 5, ay + 56, 8, 0, Math.PI * 2); ctx.fill(); }
    }
    // crowd
    var palette = ['#3a2a1e', '#5a2a22', '#2a3a4a', '#4a4030', '#6a5a40', '#2f4a3a', '#7a3a2a'];
    A.crowd(ctx, 20, port ? 780 : 1500, nearBase + 20, 150, 26 + Math.floor(rng() * 20), rng, palette, city.style);
    // foreground framing building (left)
    var fl = A.hex(st.walls[1] || st.walls[0]);
    var fg = ctx.createLinearGradient(0, 0, 180, 0);
    fg.addColorStop(0, A.rgba(A.shade(fl, 0.35))); fg.addColorStop(1, A.rgba(A.shade(fl, 0.75)));
    ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(0, 60); ctx.lineTo(150, 110); ctx.lineTo(170, H); ctx.lineTo(0, H); ctx.fill();
    ctx.fillStyle = 'rgba(255,220,160,.18)'; ctx.fillRect(140, 110, 10, H - 110);
    // banner on the left wall
    if (opts.flag) {
      ctx.fillStyle = opts.flag; ctx.beginPath(); ctx.moveTo(40, 150); ctx.lineTo(120, 150); ctx.lineTo(120, 380); ctx.lineTo(80, 350); ctx.lineTo(40, 380); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(100, 150, 20, 230);
      ctx.strokeStyle = '#d9b45f'; ctx.fillStyle = '#d9b45f'; ctx.lineWidth = 3;
      if (city.rel === 'C' || city.rel === 'O') { ctx.beginPath(); ctx.moveTo(80, 190); ctx.lineTo(80, 300); ctx.moveTo(55, 230); ctx.lineTo(105, 230); ctx.stroke(); }
      else if (city.rel === 'I') { ctx.beginPath(); ctx.arc(80, 250, 24, 0, 7); ctx.fill(); ctx.fillStyle = opts.flag; ctx.beginPath(); ctx.arc(88, 246, 21, 0, 7); ctx.fill(); ctx.fillStyle = '#d9b45f'; ctx.beginPath(); ctx.arc(100, 238, 4, 0, 7); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(80, 250, 18, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(80, 250, 7, 0, 7); ctx.fill(); }
    }
    // lantern
    ctx.strokeStyle = '#1e1610'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(150, 250); ctx.lineTo(210, 250); ctx.stroke();
    ctx.fillStyle = '#2a1e14'; ctx.fillRect(196, 252, 26, 40); ctx.fillStyle = 'rgba(255,190,100,.8)'; ctx.fillRect(200, 258, 18, 28);
    A.glow(ctx, 209, 272, 70, '#ffb050', time === 'night' || time === 'dusk' ? 0.55 : 0.18);
    // right foreground plant
    vegetation(ctx, st, W - 60, H + 10, 2.2, rng);
    // light & grade
    if (time !== 'night') A.lightRays(ctx, 330, 80, 1.05, 0.6, 900, '#ffe0a0', 0.05, 7, rng);
    A.grade(ctx, W, H, time === 'dusk' ? '#ff9a50' : '#ffb865', time === 'night' ? 0.15 : 0.3);
    if (time === 'night') { ctx.fillStyle = 'rgba(10,14,40,.45)'; ctx.fillRect(0, 0, W, H); }
    A.vignette(ctx, W, H, 0.55);
    A.applyGrain(ctx, W, H, 0.07);
    return c;
  };
})(window.G = window.G || {});
