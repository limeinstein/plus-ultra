/* Painted pictures used in windows: discovery vignettes and ship cards. */
(function (G) {
  'use strict';
  var A = G.Art, U = G.U;

  // ---------------------------------------------------------------- discovery vignette
  var CAT_COL = { geo: '#3d679a', nature: '#4f8a52', ruin: '#9a6a3a', treasure: '#c9a030', creature: '#7a5a2a', people: '#8a3a2a', trade: '#6a4a8a' };
  A.discoveryArt = function (d, w, h) {
    w = w || 720; h = h || 330;
    var c = A.canvas(w, h), ctx = c.getContext('2d'), rng = U.makeRng(U.strHash(d.id));
    var cat = d.cat;
    var hz = h * 0.58;
    if (cat === 'geo') {
      // chart on parchment
      ctx.fillStyle = '#e8d8b0'; ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < 400; i++) { ctx.fillStyle = 'rgba(120,80,30,' + rng() * 0.05 + ')'; ctx.beginPath(); ctx.arc(rng() * w, rng() * h, 2 + rng() * 30, 0, 7); ctx.fill(); }
      ctx.strokeStyle = 'rgba(90,60,30,.35)'; ctx.lineWidth = 1;
      for (var a = 0; a < 16; a++) { ctx.beginPath(); ctx.moveTo(w * 0.72, h * 0.5); ctx.lineTo(w * 0.72 + Math.cos(a / 16 * 6.283) * 900, h * 0.5 + Math.sin(a / 16 * 6.283) * 900); ctx.stroke(); }
      // coast
      ctx.fillStyle = '#c9b07a'; ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(0, h * 0.15);
      var x = 0, y = h * 0.15;
      for (var k = 0; k < 40; k++) { x += w * 0.012 + rng() * w * 0.012; y += (rng() - 0.35) * h * 0.06; ctx.lineTo(x, y); }
      ctx.lineTo(x, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill(); ctx.stroke();
      // hatching along coast
      ctx.strokeStyle = 'rgba(60,90,120,.35)'; for (var hh = 0; hh < 60; hh++) { var hx = rng() * w, hy = rng() * h; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + 18, hy); ctx.stroke(); }
      // compass rose
      ctx.save(); ctx.translate(w * 0.72, h * 0.5);
      for (var r2 = 0; r2 < 8; r2++) { ctx.rotate(Math.PI / 4); ctx.fillStyle = r2 % 2 ? '#7a2a1e' : '#1e3552'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(8, -8); ctx.lineTo(0, -(r2 % 2 ? 40 : 62)); ctx.lineTo(-8, -8); ctx.fill(); }
      ctx.restore();
      A.shipSide(ctx, w * 0.45, h * 0.62, 0.5, { sails: ['sq', 'sq', 'lat'], hull: '#3a2416', cross: true }, rng, 1);
      // dotted route
      ctx.strokeStyle = 'rgba(140,40,30,.8)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w * 0.08, h * 0.9); ctx.bezierCurveTo(w * 0.3, h * 0.95, w * 0.35, h * 0.6, w * 0.45, h * 0.6); ctx.stroke(); ctx.setLineDash([]);
    } else {
      var preset = cat === 'ruin' ? 'golden' : cat === 'treasure' ? 'night' : cat === 'people' ? 'dusk' : 'day';
      A.sky(ctx, w, h, hz, preset, rng);
      if (preset !== 'night') A.clouds(ctx, w, h, 20, hz - 40, 4, rng, preset === 'dusk' ? '#ffd0a0' : '#fffaf0', 0.6);
      A.ridge(ctx, w, hz, 50 + rng() * 60, 1, cat === 'nature' ? '#6a8a6a' : '#8a8060', rng, d.lat && Math.abs(d.lat) > 50);
      var g = ctx.createLinearGradient(0, hz, 0, h);
      var gc = cat === 'nature' || cat === 'creature' ? ['#5a7a3a', '#2a4a1e'] : cat === 'ruin' ? ['#b89a60', '#6a5030'] : cat === 'treasure' ? ['#2a2018', '#0a0806'] : ['#8a7a4a', '#4a3a20'];
      g.addColorStop(0, gc[0]); g.addColorStop(1, gc[1]); ctx.fillStyle = g; ctx.fillRect(0, hz, w, h - hz);
      if (cat === 'nature') {
        if (/폭포/.test(d.name)) { ctx.fillStyle = 'rgba(230,240,255,.85)'; ctx.fillRect(w * 0.42, hz - 90, w * 0.16, 110); A.glow(ctx, w * 0.5, hz + 20, 160, '#ffffff', 0.4); }
        for (var t = 0; t < 14; t++) A.roundTree(ctx, rng() * w, hz + 10 + rng() * (h - hz) * 0.7, 14 + rng() * 22, '#3a6a2a', rng);
      } else if (d.id === 'tajmahal') {
        paintTaj(ctx, w, h, hz);
      } else if (cat === 'ruin') {
        ctx.fillStyle = '#d8c090';
        for (var col = 0; col < 7; col++) { var cx = w * 0.2 + col * w * 0.09, ch = 90 + (col % 3) * 20; if (rng() < 0.3) ch *= 0.5; ctx.fillRect(cx, hz + 30 - ch, 22, ch); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(cx + 14, hz + 30 - ch, 8, ch); ctx.fillStyle = '#d8c090'; }
        ctx.fillRect(w * 0.18, hz - 90, w * 0.5, 16);
        A.glow(ctx, w * 0.8, hz - 40, 200, '#ffb060', 0.3);
      } else if (cat === 'treasure') {
        A.glow(ctx, w * 0.5, hz + 30, 300, '#ffd070', 0.55);
        ctx.fillStyle = '#6a4020'; ctx.fillRect(w * 0.5 - 80, hz, 160, 80); ctx.fillStyle = '#c9a030'; ctx.fillRect(w * 0.5 - 84, hz - 6, 168, 14); ctx.fillRect(w * 0.5 - 10, hz + 10, 20, 24);
        ctx.beginPath(); ctx.moveTo(w * 0.5 - 80, hz); ctx.quadraticCurveTo(w * 0.5, hz - 70, w * 0.5 + 80, hz); ctx.fillStyle = '#7a4a24'; ctx.fill();
        for (var sp = 0; sp < 40; sp++) { ctx.fillStyle = 'rgba(255,230,150,' + rng() + ')'; ctx.fillRect(w * 0.5 + (rng() - 0.5) * 240, hz - rng() * 120, 2, 2); }
      } else if (cat === 'creature') {
        for (var t2 = 0; t2 < 8; t2++) A.palm(ctx, rng() * w, hz + 20 + rng() * 40, 80 + rng() * 60, '#2a4a1e', rng);
        ctx.fillStyle = '#1a140c';
        ctx.beginPath(); ctx.ellipse(w * 0.5, hz + 60, 70, 34, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(w * 0.5 + 72, hz + 34, 26, 20, -0.4, 0, 7); ctx.fill();
        for (var lg = 0; lg < 4; lg++) ctx.fillRect(w * 0.5 - 50 + lg * 30, hz + 80, 10, 40);
      } else if (cat === 'people') {
        A.glow(ctx, w * 0.5, hz + 70, 200, '#ff9040', 0.5);
        ctx.fillStyle = '#ffb040'; ctx.beginPath(); ctx.moveTo(w * 0.5 - 16, hz + 80); ctx.quadraticCurveTo(w * 0.5, hz + 20, w * 0.5 + 16, hz + 80); ctx.fill();
        for (var pp = 0; pp < 6; pp++) A.person(ctx, w * 0.5 + Math.cos(pp) * 150, hz + 90 + Math.sin(pp) * 10, 90, [30, 22, 16], rng, {});
        ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.moveTo(w * 0.15, hz + 60); ctx.lineTo(w * 0.22, hz - 20); ctx.lineTo(w * 0.29, hz + 60); ctx.fill();
      } else {
        for (var sk = 0; sk < 9; sk++) { var sx = w * 0.2 + (sk % 5) * 90, sy = hz + 60 + Math.floor(sk / 5) * 50; ctx.fillStyle = A.rgba(A.jitter('#b89a6a', rng, 40)); ctx.beginPath(); ctx.ellipse(sx, sy, 38, 30, 0, 0, 7); ctx.fill(); }
      }
    }
    A.grade(ctx, w, h, '#ffa850', 0.25); A.vignette(ctx, w, h, 0.6); A.applyGrain(ctx, w, h, 0.06);
    return c;
  };

  /** 흰 대리석 영묘: 양파 돔, 네 미너렛, 긴 연못과 사이프러스 */
  function paintTaj(ctx, w, h, hz) {
    var s = h / 330 * 0.72, cx = w * 0.5, base = hz + 16 * s;
    var marble = '#f5f0e6', shade = 'rgba(160,140,120,.28)', dark = '#8e8272';
    // 정원 잔디와 연못
    var g = ctx.createLinearGradient(0, base, 0, h); g.addColorStop(0, '#6f8f4a'); g.addColorStop(1, '#2f4a22');
    ctx.fillStyle = g; ctx.fillRect(0, base, w, h - base);
    ctx.fillStyle = '#e9e1d2'; ctx.beginPath(); ctx.moveTo(cx - 20 * s, base); ctx.lineTo(cx + 20 * s, base); ctx.lineTo(cx + 120 * s, h); ctx.lineTo(cx - 120 * s, h); ctx.closePath(); ctx.fill();
    var pg = ctx.createLinearGradient(0, base, 0, h); pg.addColorStop(0, '#9fc2da'); pg.addColorStop(1, '#4d7c9e');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.moveTo(cx - 12 * s, base + 2); ctx.lineTo(cx + 12 * s, base + 2); ctx.lineTo(cx + 84 * s, h); ctx.lineTo(cx - 84 * s, h); ctx.closePath(); ctx.fill();
    A.glow(ctx, cx, base - 150 * s, 240 * s, '#ffe8c8', 0.14);
    // 사이프러스
    for (var k = 0; k < 7; k++) {
      var t = k / 6, yy = base + 6 + t * (h - base) * 0.95, off = 34 * s + t * 150 * s, th = 26 * s + t * 60 * s;
      [-1, 1].forEach(function (sd) {
        ctx.fillStyle = '#1f3a1c'; ctx.beginPath(); ctx.ellipse(cx + sd * off, yy - th * 0.5, th * 0.16, th * 0.55, 0, 0, 7); ctx.fill();
      });
    }
    function arch(x, y, aw, ah, col) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - aw / 2, y); ctx.lineTo(x - aw / 2, y - ah + aw * 0.5);
      ctx.quadraticCurveTo(x - aw / 2, y - ah, x, y - ah - aw * 0.18); ctx.quadraticCurveTo(x + aw / 2, y - ah, x + aw / 2, y - ah + aw * 0.5); ctx.lineTo(x + aw / 2, y); ctx.closePath(); ctx.fill();
    }
    function onion(x, y, rw, rh) {
      ctx.beginPath(); ctx.moveTo(x - rw, y);
      ctx.bezierCurveTo(x - rw * 1.45, y - rh * 0.55, x - rw * 0.35, y - rh * 0.8, x, y - rh);
      ctx.bezierCurveTo(x + rw * 0.35, y - rh * 0.8, x + rw * 1.45, y - rh * 0.55, x + rw, y);
      ctx.closePath(); ctx.fill();
    }
    // 네 미너렛
    [-1, 1].forEach(function (sd) {
      var mx = cx + sd * 178 * s, mh = 170 * s, mw = 9 * s;
      ctx.fillStyle = marble; ctx.fillRect(mx - mw / 2, base - mh, mw, mh);
      ctx.fillStyle = shade; ctx.fillRect(mx, base - mh, mw / 2, mh);
      for (var b = 1; b <= 3; b++) { ctx.fillStyle = '#e2dacb'; ctx.fillRect(mx - mw * 0.9, base - mh * b / 3.3, mw * 1.8, 3 * s); }
      ctx.fillStyle = marble; onion(mx, base - mh, mw * 0.9, 16 * s);
    });
    // 기단
    ctx.fillStyle = '#e6dfd1'; ctx.fillRect(cx - 200 * s, base - 16 * s, 400 * s, 16 * s);
    // 본당
    ctx.fillStyle = marble; ctx.fillRect(cx - 112 * s, base - 116 * s, 224 * s, 100 * s);
    ctx.fillStyle = shade; ctx.fillRect(cx + 70 * s, base - 116 * s, 42 * s, 100 * s);
    arch(cx, base - 16 * s, 46 * s, 86 * s, dark);
    [-1, 1].forEach(function (sd) {
      arch(cx + sd * 78 * s, base - 16 * s, 22 * s, 34 * s, dark);
      arch(cx + sd * 78 * s, base - 62 * s, 22 * s, 34 * s, dark);
    });
    // 드럼과 큰 돔
    ctx.fillStyle = marble; ctx.fillRect(cx - 54 * s, base - 142 * s, 108 * s, 30 * s);
    onion(cx, base - 140 * s, 60 * s, 104 * s);
    // 오른쪽 그늘 (돔 모양 안쪽만)
    ctx.save(); ctx.beginPath(); ctx.rect(cx + 14 * s, base - 250 * s, 80 * s, 112 * s); ctx.clip();
    ctx.fillStyle = shade; onion(cx, base - 140 * s, 60 * s, 104 * s); ctx.restore();
    ctx.strokeStyle = '#c9a85e'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(cx, base - 244 * s); ctx.lineTo(cx, base - 262 * s); ctx.stroke();
    // 지붕의 작은 정자 돔
    [-1, 1].forEach(function (sd) {
      ctx.fillStyle = marble; ctx.fillRect(cx + sd * 88 * s - 11 * s, base - 132 * s, 22 * s, 16 * s);
      onion(cx + sd * 88 * s, base - 130 * s, 14 * s, 26 * s);
    });
    // 연못에 비친 그림자
    ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 9 * s, base + 6, 18 * s, (h - base) * 0.55);
    ctx.restore();
  }

  // ---------------------------------------------------------------- ship picture
  A.shipCard = function (typeId, w, h, seed, spec) {
    var chain = G.Img.chain.ship(typeId);
    if (G.Img.pick(chain)) return G.Img.make(chain, w, h, function () { return paintShipCard(typeId, w, h, seed, spec); });
    return paintShipCard(typeId, w, h, seed, spec);
  };
  function paintShipCard(typeId, w, h, seed, spec) {
    var cv = A.canvas(w, h), ctx = cv.getContext('2d'), rng = U.makeRng(U.strHash(String(seed || typeId)));
    var g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#cfd9df'); g.addColorStop(0.62, '#f2e2c0'); g.addColorStop(0.63, '#5d86a6'); g.addColorStop(1, '#27506e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    var t = G.SHIP[typeId], look = A.shipLook ? A.shipLook(typeId, spec && spec.sails ? { sails: spec.sails } : null) : { sails: t.sails, hull: '#3a2416', cross: true, flag: '#1d3f7a' };
    // 그림 폭(배 좌표) — 카드에 꼭 맞게 줄이고, 작은 배는 조금 더 작게
    var n = look.sails.length, ht = look.hullType;
    var span = ht === 'galley' ? 270 + (look.big ? 40 : 0) : ht === 'dhow' || ht === 'jong' ? 170 + n * 24 : ht === 'junk' ? 190 + n * 22 : ht === 'kr' ? 180 : ht === 'panok' ? 220 : ht === 'turtle' ? 240 : ht === 'jp' ? (look.big ? 210 : 170) : ht === 'atake' ? 230 : ht === 'raft' ? 140 : ht === 'outrigger' ? 200 : 175 + n * 18;
    var fit = Math.min(w * 0.94 / span, h * 0.72 / 118);
    var scale = fit * U.clamp(0.66 + t.cap / 1500, 0.7, 1);
    A.shipSide(ctx, w * 0.5, h * 0.72, scale, look, rng, 1);
    ctx.fillStyle = 'rgba(255,255,255,.25)'; for (var i = 0; i < 20; i++) ctx.fillRect(rng() * w, h * 0.66 + rng() * h * 0.3, 8 + rng() * 16, 1);
    return cv;
  }

  /** title screen painting: golden sea with a carrack under full sail */
  A.titleScene = function () {
    var W = 1600, H = 900, c = A.canvas(W, H), ctx = c.getContext('2d'), rng = U.makeRng(7);
    A.sky(ctx, W, H, 560, 'golden', rng);
    A.sun(ctx, 1120, 420, 34, '#ffb872');
    A.clouds(ctx, W, H, 80, 360, 7, rng, '#ffe6c4', 0.6);
    A.birds(ctx, 300, 120, 900, 200, 9, rng, 'rgba(70,50,40,.6)');
    A.ridge(ctx, W, 560, 40, 1, A.mix('#7a8a70', '#f2c890', 0.6), rng, false);
    // sea
    A.water(ctx, W, 560, H, '#c98e5e', '#1b3550', rng, 0.8);
    // sun glitter column
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 260; i++) {
      var y = 562 + Math.pow(rng(), 1.3) * 330, spread = 20 + (y - 560) * 0.9;
      ctx.fillStyle = 'rgba(255,210,150,' + (0.08 + rng() * 0.35) + ')';
      ctx.fillRect(1120 + (rng() - 0.5) * spread * 2, y, 8 + rng() * 40, 1.5 + (y - 560) / 160);
    }
    ctx.restore();
    // distant ships
    A.shipSide(ctx, 380, 600, 0.35, { sails: ['sq', 'sq', 'lat'], hull: '#2a1a10', cross: true }, rng, 1);
    A.shipSide(ctx, 1450, 585, 0.22, { sails: ['lat', 'lat'], hull: '#2a1a10' }, rng, -1);
    // hero ship
    A.shipSide(ctx, 760, 760, 2.1, { sails: ['sq', 'sq', 'sq', 'lat'], hull: '#3a2416', cross: true, flag: '#1d3f7a' }, rng, 1);
    // bow wave
    ctx.fillStyle = 'rgba(255,240,220,.35)';
    ctx.beginPath(); ctx.ellipse(1060, 792, 120, 12, 0, 0, Math.PI * 2); ctx.fill();
    A.grade(ctx, W, H, '#ff9a50', 0.35);
    A.vignette(ctx, W, H, 0.75);
    A.applyGrain(ctx, W, H, 0.08);
    return c;
  };

})(window.G = window.G || {});
