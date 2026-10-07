/* 재해 그림 (G.DisasterFx) — 지진·화산·산사태·쓰나미·홍수가 덮칠 때 대화창 바로 위에 나무틀 그림창을 띄운다.
   · 그림은 images/sprites/disaster_*.webp의 투명 4×2 애니메이션 시트 하나만 쓴다. 그 뒤에는 하늘·땅 빛깔(그러데이션)만 깔고,
     앞에는 효과(재·불티·먼지·물보라·비)만 얹는다 (SC[갈래].bg · back · fx, 놓는 자리 LAY[갈래]).
   · 시트가 아직 없거나 못 불러오면 예전처럼 코드로 그린 장면(산·집·물벽 — SC[갈래].draw)으로 대신한다. 둘을 겹쳐 그리지 않는다.
   · 지진은 화면도 흔든다 (G.DisasterFx.shake).
   · 쓰는 법: var fx = G.DisasterFx.show('volcano'); await UI.say(...); fx.stop();
   조정값: G.FX.disaster (w · h · bottom · shake) */
(function (G) {
  'use strict';
  var DF = G.DisasterFx = {};
  var NOOP = { stop: function () { return Promise.resolve(); }, alive: false };
  function C() { return (G.FX && G.FX.disaster) || {}; }
  function spriteImage(kind) {
    var spec = G.DISASTER_SPRITES && G.DISASTER_SPRITES[kind], I = G.Img;
    if (!spec || !I) return null;
    var key = 'sprites/' + spec.id, img = I.get(key);
    if (!img && I.has(key)) I.want(key);
    return img;
  }
  /* 그림창 안에서 시트를 놓는 자리: size = 창 높이 × size, x = 가운데 자리(창 너비 비율), base = 시트 칸 바닥이 창 바닥보다 아래로 내려가는 몫(칸 크기 비율),
     n·gap·lag = 옆으로 이어 놓는 개수·간격(칸 크기 비율)·옆 칸의 시간 늦춤(초) — 물결·흙탕물은 창 너비를 채우도록 이어 놓는다.
     fade = 이어 놓을 때 칸의 좌우 가장자리를 흐리게 지우는 폭(칸 비율) — 칸의 곧은 끝이 이음매로 보이지 않게 */
  var LAY = {
    quake: { size: 1.12, x: 0.5, base: 0.05 },
    volcano: { size: 1.08, x: 0.5, base: 0.05 },
    landslide: { size: 1.05, x: 0.47, base: 0.02 },
    tsunami: { size: 0.98, x: 0.5, base: 0.02, n: 3, gap: 0.78, lag: 0.55, fade: 0.22 },
    flood: { size: 0.95, x: 0.5, base: 0.1, n: 3, gap: 0.78, lag: 0.4, fade: 0.22 }
  };
  DF.LAY = LAY;
  function cell(img, spec, t) {
    var frame = Math.floor(Math.max(0, t) * 1000 / spec.ms) % spec.frames;
    return { sx: (frame % 4) * img.width / 4, sy: Math.floor(frame / 4) * img.height / 2, sw: img.width / 4, sh: img.height / 2, frame: frame };
  }
  /** 칸 하나를 좌우 가장자리가 흐려지게 따로 그린 캔버스 (칸마다 기억해 둔다) */
  var fadeCache = {};
  function faded(img, c, fade, bottom) {
    var key = img.src.length + ':' + img.width + ':' + c.frame + ':' + fade + ':' + (bottom || 0), cv = fadeCache[key];
    if (cv) return cv;
    cv = document.createElement('canvas'); cv.width = c.sw; cv.height = c.sh;
    var g = cv.getContext('2d'); g.drawImage(img, c.sx, c.sy, c.sw, c.sh, 0, 0, c.sw, c.sh);
    var m = g.createLinearGradient(0, 0, c.sw, 0);
    m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(fade, 'rgba(0,0,0,1)'); m.addColorStop(1 - fade, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalCompositeOperation = 'destination-in'; g.fillStyle = m; g.fillRect(0, 0, c.sw, c.sh);
    if (bottom) { var v = g.createLinearGradient(0, 0, 0, c.sh); v.addColorStop(0, 'rgba(0,0,0,1)'); v.addColorStop(1 - bottom, 'rgba(0,0,0,1)'); v.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = v; g.fillRect(0, 0, c.sw, c.sh); }
    return (fadeCache[key] = cv);
  }
  /** 그림창에 시트를 그린다 (o.dx·o.dy: 흔들림). 그림이 없으면 false */
  /** 이 갈래의 시트 파일이 있는가 (불러오기 전이라도) */
  function hasSheet(kind) { var spec = G.DISASTER_SPRITES && G.DISASTER_SPRITES[kind], I = G.Img; return !!(spec && I && I.has && I.has('sprites/' + spec.id)); }
  function drawSprite(ctx, kind, w, h, t, o) {
    var spec = G.DISASTER_SPRITES && G.DISASTER_SPRITES[kind], img = spriteImage(kind);
    if (!spec || !img) return false;
    var L = LAY[kind] || { size: 1, x: 0.5, base: 0 }, size = h * L.size, n = L.n || 1, dx = (o && o.dx) || 0, dy = (o && o.dy) || 0;
    var y = h - size * (1 - (L.base || 0)) + dy;
    ctx.save();
    for (var i = 0; i < n; i++) {
      var k = i - (n - 1) / 2, tt = t - Math.abs(k) * (L.lag || 0), c = cell(img, spec, tt);
      var cx = w * L.x + k * size * (L.gap || 1) + dx;
      ctx.globalAlpha = k ? 0.92 : 1;
      if (n > 1 && L.fade) ctx.drawImage(faded(img, c, L.fade), cx - size / 2, y, size, size);
      else ctx.drawImage(img, c.sx, c.sy, c.sw, c.sh, cx - size / 2, y, size, size);
    }
    ctx.restore();
    return true;
  }
  /** 지도 위 재해 표지: 그 갈래의 움직이는 그림(4×2 시트)을 (cx, cy)에 바닥을 맞춰 size 크기로 그린다. 그림이 아직 없으면 false */
  DF.sprite = function (ctx, kind, cx, cy, size, t, alpha) {
    var spec = G.DISASTER_SPRITES && G.DISASTER_SPRITES[kind], img = spriteImage(kind);
    if (!spec || !img) return false;
    var c = cell(img, spec, t), L = LAY[kind] || {};
    ctx.save();
    ctx.globalAlpha = alpha == null ? 0.92 : alpha;
    // 물결·흙탕물 칸은 곧은 끝이 네모로 보이지 않게 좌우·아래를 흐려서 그린다
    if (L.fade) ctx.drawImage(faded(img, c, L.fade, 0.18), cx - size / 2, cy - size * 0.86, size, size);
    else ctx.drawImage(img, c.sx, c.sy, c.sw, c.sh, cx - size / 2, cy - size * 0.86, size, size);
    ctx.restore();
    return true;
  };
  // 고정된 난수 (장면마다 같은 모양)
  function rng(seed) { var x = seed >>> 0 || 1; return function () { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
  function grad(ctx, h, a, b, y0, y1) { var g = ctx.createLinearGradient(0, y0 || 0, 0, y1 == null ? h : y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
  function hills(ctx, w, h, y, col, amp, seed) {
    var r = rng(seed); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, h);
    for (var x = 0; x <= w; x += 20) ctx.lineTo(x, y - amp * (0.5 + 0.5 * Math.sin(x / 70 + seed) * r()));
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  }
  function house(ctx, x, y, s, wall, roof) {
    ctx.fillStyle = wall; ctx.fillRect(x - s, y - s * 1.2, s * 2, s * 1.2);
    ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x - s * 1.25, y - s * 1.15); ctx.lineTo(x, y - s * 2); ctx.lineTo(x + s * 1.25, y - s * 1.15); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(30,20,10,.65)'; ctx.fillRect(x - s * 0.25, y - s * 0.7, s * 0.5, s * 0.7);
  }
  function tree(ctx, x, y, s, col) { ctx.fillStyle = '#4a3220'; ctx.fillRect(x - s * 0.12, y - s, s * 0.24, s); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y - s * 1.3, s * 0.65, 0, 7); ctx.fill(); }

  var SC = {};
  // ---------------------------------------------------------------- 지진: 집이 흔들리고 땅이 갈라지며 먼지가 인다
  SC.quake = { title: '지진', draw: function (ctx, w, h, t) {
    var dec = Math.max(0.25, 1 - t / 6), sh = Math.sin(t * 47) * 6 * dec, sv = Math.cos(t * 39) * 3 * dec;
    ctx.fillStyle = grad(ctx, h, '#8a8f96', '#d8c9a8'); ctx.fillRect(0, 0, w, h);
    ctx.save(); ctx.translate(sh * 0.3, 0); hills(ctx, w, h, h * 0.55, '#8c8a76', 40, 3); ctx.restore();
    ctx.save(); ctx.translate(sh, sv);
    ctx.fillStyle = grad(ctx, h, '#8a6c48', '#5e4630', h * 0.62, h); ctx.fillRect(-20, h * 0.62, w + 40, h * 0.4);
    var r = rng(11);
    for (var i = 0; i < 7; i++) {
      var hx = 50 + i * 85 + r() * 20, tilt = (r() - 0.5) * 0.25 * Math.min(1, t / 2.5), fall = t > 2 + i * 0.4 && i % 3 === 1;
      ctx.save(); ctx.translate(hx, h * 0.66); ctx.rotate(fall ? Math.min(1.2, (t - 2 - i * 0.4) * 0.9) * (i % 2 ? 1 : -1) : tilt + Math.sin(t * 30 + i) * 0.03 * dec);
      house(ctx, 0, 0, 16 + r() * 6, i % 2 ? '#cdb991' : '#b9a27c', i % 3 ? '#8a4a32' : '#6d5a46'); ctx.restore();
    }
    // 갈라지는 땅
    var crack = Math.min(1, t / 3);
    ctx.strokeStyle = '#1c120a'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath();
    var cx = w * 0.15, cy = h * 0.8; ctx.moveTo(cx, cy); r = rng(5);
    for (var k = 1; k <= 14 * crack; k++) { cx += w * 0.05; cy += (r() - 0.5) * 26; ctx.lineTo(cx, cy); }
    ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(28,18,10,.7)'; ctx.stroke();
    ctx.restore();
    // 먼지와 떨어지는 돌
    r = rng(21);
    for (var p = 0; p < 40; p++) {
      var px = r() * w, life = ((t * 0.5 + r()) % 1), py = h * 0.7 - life * 120 - r() * 30;
      ctx.fillStyle = 'rgba(190,170,140,' + (0.35 * (1 - life)).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(px + sh, py, 8 + life * 20, 0, 7); ctx.fill();
    }
    for (var q = 0; q < 6; q++) { var lt = ((t * 0.8 + q / 6) % 1); ctx.fillStyle = '#5b5040'; ctx.beginPath(); ctx.arc(w * 0.82 + q * 9, 20 + lt * lt * h * 0.6, 5 + q % 3 * 2, 0, 7); ctx.fill(); }
  } };
  // ---------------------------------------------------------------- 화산: 불기둥·용암·화산탄·내리는 재
  SC.volcano = { title: '화산 분화', draw: function (ctx, w, h, t) {
    ctx.fillStyle = grad(ctx, h, '#2a1612', '#a0442a'); ctx.fillRect(0, 0, w, h);
    var cx = w * 0.5, top = h * 0.36, base = h * 0.92;
    // 연기 기둥
    var r = rng(7);
    for (var i = 0; i < 26; i++) {
      var lf = ((t * 0.18 + i / 26) % 1), px = cx + Math.sin(i * 1.7 + t * 0.4) * (20 + lf * 120), py = top - lf * (top + 60), rad = 22 + lf * 70;
      ctx.fillStyle = 'rgba(' + (60 + i % 3 * 12) + ',' + (52 + i % 3 * 10) + ',' + (50 + i % 3 * 8) + ',' + (0.75 - lf * 0.4).toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(px, py, rad, 0, 7); ctx.fill();
    }
    // 산
    ctx.fillStyle = '#3a2a22'; ctx.beginPath(); ctx.moveTo(cx - w * 0.48, base); ctx.lineTo(cx - 40, top); ctx.lineTo(cx + 40, top); ctx.lineTo(cx + w * 0.48, base); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2a1d17'; ctx.beginPath(); ctx.moveTo(cx + 10, top); ctx.lineTo(cx + 40, top); ctx.lineTo(cx + w * 0.48, base); ctx.lineTo(cx + w * 0.18, base); ctx.closePath(); ctx.fill();
    // 분화구 불빛과 용암 줄기
    var gl = ctx.createRadialGradient(cx, top, 4, cx, top, 90); gl.addColorStop(0, 'rgba(255,220,120,.95)'); gl.addColorStop(1, 'rgba(255,90,20,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, top, 90, 0, 7); ctx.fill();
    ctx.lineCap = 'round';
    [[-1, 0.0], [1, 0.3], [-1, 0.55], [1, 0.8]].forEach(function (s, k) {
      var len = Math.min(1, t / 4 + s[1] * 0.3); ctx.strokeStyle = 'rgba(255,' + (120 + k * 20) + ',30,.9)'; ctx.lineWidth = 6 - k;
      ctx.beginPath(); ctx.moveTo(cx + s[0] * (8 + k * 6), top + 4);
      for (var j = 1; j <= 10 * len; j++) ctx.lineTo(cx + s[0] * (8 + k * 6 + j * (14 + k * 3)) + Math.sin(j + k) * 6, top + j * (base - top) / 11);
      ctx.stroke();
    });
    // 화산탄
    r = rng(31);
    for (var b = 0; b < 14; b++) {
      var bl = ((t * 0.6 + r()) % 1), vx = (r() - 0.5) * 260, vy = 200 + r() * 120;
      var bx = cx + vx * bl, by = top - vy * bl + 300 * bl * bl;
      ctx.fillStyle = 'rgba(255,' + (140 + b * 6 % 80) + ',40,' + (1 - bl * 0.6).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(bx, by, 3 + b % 3, 0, 7); ctx.fill();
    }
    // 재
    r = rng(41); ctx.fillStyle = 'rgba(200,190,180,.55)';
    for (var a = 0; a < 90; a++) { var ax = (r() * w + t * 18) % w, ay = (r() * h + t * (25 + r() * 25)) % h; ctx.fillRect(ax, ay, 2, 2); }
  } };
  // ---------------------------------------------------------------- 산사태: 비탈이 무너져 흙더미와 바위가 쏟아진다
  SC.landslide = { title: '산사태', draw: function (ctx, w, h, t) {
    ctx.fillStyle = grad(ctx, h, '#7f8c96', '#c9c2ae'); ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#6b7a6a'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w * 0.62, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#56664e'; for (var k = 0; k < 9; k++) tree(ctx, 30 + k * 30, h * (0.15 + k * 0.1) + 30, 14, '#3e5a34');
    ctx.fillStyle = '#7a6a50'; ctx.fillRect(0, h * 0.86, w, h * 0.14);
    for (var hs = 0; hs < 3; hs++) house(ctx, w * 0.66 + hs * 70, h * 0.88, 15, '#c4ad86', '#7a4630');
    // 흙더미 (비탈을 따라 흘러내린다)
    var prog = Math.min(1, t / 3.5), sx = w * 0.05, sy = h * 0.02, ex = w * 0.62, ey = h * 0.95;
    var fx = sx + (ex - sx) * prog, fy = sy + (ey - sy) * prog;
    ctx.fillStyle = '#6a4c30'; ctx.beginPath(); ctx.moveTo(sx - 30, sy); ctx.lineTo(sx + 50, sy);
    ctx.quadraticCurveTo(fx + 70, fy - 20, fx + 60, fy + 10); ctx.quadraticCurveTo(fx, fy + 40, fx - 70, fy + 20); ctx.lineTo(sx - 30, sy + 60); ctx.closePath(); ctx.fill();
    // 굴러가는 바위
    var r = rng(13);
    for (var i = 0; i < 12; i++) {
      var lf = ((t * 0.45 + r()) % 1), d = Math.min(prog + 0.15, lf), bx = sx + (ex - sx) * d + (r() - 0.5) * 60, by = sy + (ey - sy) * d - 10 + (r() - 0.5) * 30, rad = 6 + r() * 10;
      ctx.save(); ctx.translate(bx, by); ctx.rotate(t * 6 + i); ctx.fillStyle = i % 2 ? '#6f6658' : '#857a68'; ctx.beginPath();
      for (var v = 0; v < 6; v++) { var an = v / 6 * 6.283; ctx.lineTo(Math.cos(an) * rad * (0.8 + (v % 2) * 0.3), Math.sin(an) * rad * (0.8 + (v % 2) * 0.3)); }
      ctx.closePath(); ctx.fill(); ctx.restore();
    }
    // 흙먼지
    r = rng(3);
    for (var p = 0; p < 26; p++) { var pl = ((t * 0.4 + r()) % 1); ctx.fillStyle = 'rgba(160,130,95,' + (0.4 * (1 - pl)).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(fx + (r() - 0.5) * 160, fy - pl * 90, 10 + pl * 26, 0, 7); ctx.fill(); }
  } };
  // ---------------------------------------------------------------- 쓰나미: 바닷물이 빠졌다가 큰 물벽이 밀려온다
  SC.tsunami = { title: '쓰나미', draw: function (ctx, w, h, t) {
    ctx.fillStyle = grad(ctx, h, '#5c7488', '#c4ccc8'); ctx.fillRect(0, 0, w, h);
    var cyc = t % 7, recede = Math.min(1, cyc / 2), adv = Math.max(0, (cyc - 2) / 4);
    // 해변과 마을
    ctx.fillStyle = '#d4c094'; ctx.fillRect(0, h * 0.62, w, h * 0.38);
    for (var i = 0; i < 4; i++) house(ctx, 40 + i * 62, h * 0.66, 13, '#d0bc94', '#8a4e34');
    for (var j = 0; j < 3; j++) tree(ctx, 290 + j * 26, h * 0.67, 18, '#4f7a3c');
    // 물러나는 바닷물
    var shore = w * (0.55 + recede * 0.25 - adv * 0.9);
    ctx.fillStyle = '#4c7f98'; ctx.fillRect(shore, h * 0.6, w - shore, h * 0.4);
    // 물벽
    if (adv > 0) {
      var wx = w * (1.1 - adv * 1.15), wh = h * (0.25 + Math.min(1, adv * 2) * 0.55), top = h - wh;
      ctx.fillStyle = grad(ctx, h, '#3a7c98', '#173a50', top, h);
      ctx.beginPath(); ctx.moveTo(wx - 6, h);
      ctx.bezierCurveTo(wx - 22, h - wh * 0.45, wx + 18, top + 34, wx - 34, top + 26);      // 앞면 (오목하게 솟는다)
      ctx.quadraticCurveTo(wx - 12, top - 20, wx + 56, top - 2);                          // 말려 넘어가는 물마루
      ctx.quadraticCurveTo(wx + 220, top + 8, w + 20, top + wh * 0.22);                    // 뒤쪽 물등
      ctx.lineTo(w + 20, h); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(190,225,240,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx - 4, h - 10); ctx.bezierCurveTo(wx - 14, h - wh * 0.45, wx + 14, top + 40, wx - 26, top + 30); ctx.stroke();
      var r = rng(9); ctx.fillStyle = 'rgba(240,248,252,.85)';
      for (var f = 0; f < 30; f++) { var fa = r(); ctx.beginPath(); ctx.arc(wx - 30 + fa * 100 + Math.sin(t * 8 + f) * 4, h - wh + 10 - r() * 26, 3 + r() * 6, 0, 7); ctx.fill(); }
      ctx.fillStyle = 'rgba(220,235,245,.45)'; for (var g = 0; g < 18; g++) { var sp = ((t * 1.5 + r()) % 1); ctx.beginPath(); ctx.arc(wx - 40 - sp * 80, h - wh - sp * 50 + sp * sp * 120, 3, 0, 7); ctx.fill(); }
    }
  } };
  // ---------------------------------------------------------------- 홍수: 비가 퍼붓고 흙탕물이 차올라 통나무와 짐이 떠내려간다
  SC.flood = { title: '홍수', draw: function (ctx, w, h, t) {
    ctx.fillStyle = grad(ctx, h, '#4a5662', '#9aa4a8'); ctx.fillRect(0, 0, w, h);
    hills(ctx, w, h, h * 0.5, '#5f6c58', 30, 5);
    for (var i = 0; i < 5; i++) house(ctx, 70 + i * 120, h * 0.74, 17, '#bba680', '#7a4630');
    for (var j = 0; j < 6; j++) tree(ctx, 30 + j * 110, h * 0.72, 22, '#45603a');
    var lvl = h * (0.86 - Math.min(1, t / 5) * 0.2);
    ctx.fillStyle = 'rgba(122,98,62,.92)'; ctx.beginPath(); ctx.moveTo(0, h);
    for (var x = 0; x <= w; x += 16) ctx.lineTo(x, lvl + Math.sin(x / 40 + t * 3) * 4);
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(220,210,180,.5)'; ctx.lineWidth = 2; ctx.beginPath();
    for (var x2 = 0; x2 <= w; x2 += 16) ctx.lineTo(x2, lvl + Math.sin(x2 / 40 + t * 3) * 4); ctx.stroke();
    // 떠내려가는 것들
    var r = rng(17);
    for (var d = 0; d < 7; d++) {
      var dx = ((r() * w + t * (40 + r() * 30)) % (w + 120)) - 60, dy = lvl + 8 + r() * (h - lvl - 20);
      ctx.save(); ctx.translate(dx, dy); ctx.rotate(Math.sin(t * 2 + d) * 0.2);
      if (d % 3 === 0) { ctx.fillStyle = '#6a4a2c'; ctx.fillRect(-26, -5, 52, 10); }
      else if (d % 3 === 1) { ctx.fillStyle = '#8a6a40'; ctx.fillRect(-10, -10, 20, 16); ctx.strokeStyle = '#4a3420'; ctx.strokeRect(-10, -10, 20, 16); }
      else { ctx.fillStyle = '#3e5a34'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    // 비
    r = rng(23); ctx.strokeStyle = 'rgba(210,225,235,.45)'; ctx.lineWidth = 1.2; ctx.beginPath();
    for (var k = 0; k < 120; k++) { var rx = (r() * w + t * 90) % w, ry = (r() * h + t * 600) % h; ctx.moveTo(rx, ry); ctx.lineTo(rx - 5, ry + 16); }
    ctx.stroke();
  } };
  // ---------------------------------------------------------------- 시트와 함께 쓰는 바탕(bg)·뒤 효과(back)·앞 효과(fx) — 산·집·물벽 같은 모양은 그리지 않는다
  function sky(ctx, w, h, a, b, ground) {
    ctx.fillStyle = grad(ctx, h, a, b); ctx.fillRect(0, 0, w, h);
    if (ground) { ctx.fillStyle = grad(ctx, h, 'rgba(0,0,0,0)', ground, h * 0.62, h); ctx.fillRect(0, h * 0.62, w, h * 0.38); }
  }
  function puffs(ctx, w, h, t, seed, n, col, x0, x1, y0, rise, r0, r1, speed) {
    var r = rng(seed);
    for (var p = 0; p < n; p++) {
      var life = ((t * speed + r()) % 1), px = x0 + r() * (x1 - x0), py = y0 - life * rise - r() * 20;
      ctx.fillStyle = 'rgba(' + col + ',' + (0.38 * (1 - life)).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(px, py, r0 + life * r1, 0, 7); ctx.fill();
    }
  }
  SC.quake.bg = function (ctx, w, h) { sky(ctx, w, h, '#8a8f96', '#d8c9a8', 'rgba(94,70,48,.55)'); };
  SC.quake.shake = function (t) { var dec = Math.max(0.25, 1 - t / 6); return { dx: Math.sin(t * 47) * 6 * dec, dy: Math.cos(t * 39) * 3 * dec }; };
  SC.quake.fx = function (ctx, w, h, t) {
    var sh = SC.quake.shake(t);
    puffs(ctx, w, h, t, 21, 34, '190,170,140', 0, w, h * 0.9, 120, 8, 20, 0.5);
    puffs(ctx, w, h, t + 0.5, 37, 14, '170,150,120', w * 0.3 + sh.dx, w * 0.7 + sh.dx, h * 0.98, 60, 14, 30, 0.7);   // 땅에서 이는 흙먼지
  };
  SC.volcano.bg = function (ctx, w, h) { sky(ctx, w, h, '#2a1612', '#a0442a', 'rgba(40,20,14,.6)'); };
  SC.volcano.back = function (ctx, w, h, t) {   // 분화구 쪽이 붉게 달아오른다
    var gl = ctx.createRadialGradient(w * 0.5, h * 0.8, 10, w * 0.5, h * 0.8, h * 0.9), k = 0.55 + 0.15 * Math.sin(t * 5);
    gl.addColorStop(0, 'rgba(255,150,60,' + k.toFixed(2) + ')'); gl.addColorStop(1, 'rgba(255,80,20,0)');
    ctx.fillStyle = gl; ctx.fillRect(0, 0, w, h);
  };
  SC.volcano.fx = function (ctx, w, h, t) {
    var r = rng(31), cx = w * 0.5, top = h * 0.55;
    for (var b = 0; b < 16; b++) {         // 날아가는 화산탄·불티
      var bl = ((t * 0.6 + r()) % 1), vx = (r() - 0.5) * 420, vy = 220 + r() * 140;
      var bx = cx + vx * bl, by = top - vy * bl + 320 * bl * bl;
      ctx.fillStyle = 'rgba(255,' + (140 + b * 6 % 80) + ',40,' + (1 - bl * 0.6).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(bx, by, 2 + b % 3, 0, 7); ctx.fill();
    }
    r = rng(41); ctx.fillStyle = 'rgba(200,190,180,.55)';   // 내리는 재
    for (var a = 0; a < 110; a++) { var ax = (r() * w + t * 18) % w, ay = (r() * h + t * (25 + r() * 25)) % h; ctx.fillRect(ax, ay, 2, 2); }
  };
  SC.landslide.bg = function (ctx, w, h) { sky(ctx, w, h, '#7f8c96', '#c9c2ae', 'rgba(110,90,62,.55)'); };
  SC.landslide.fx = function (ctx, w, h, t) {
    puffs(ctx, w, h, t, 3, 26, '160,130,95', w * 0.25, w * 0.85, h * 0.95, 110, 10, 26, 0.4);
    var r = rng(13);
    for (var i = 0; i < 8; i++) { var lf = ((t * 0.5 + r()) % 1), bx = w * (0.2 + r() * 0.2) + lf * w * 0.45, by = h * 0.1 + lf * h * 0.85; ctx.fillStyle = i % 2 ? 'rgba(111,102,88,.9)' : 'rgba(133,122,104,.9)'; ctx.beginPath(); ctx.arc(bx, by, 2 + r() * 3, 0, 7); ctx.fill(); }
  };
  SC.tsunami.bg = function (ctx, w, h) { sky(ctx, w, h, '#5c7488', '#c4ccc8', 'rgba(23,58,80,.5)'); };
  SC.tsunami.fx = function (ctx, w, h, t) {
    var r = rng(9);
    for (var g = 0; g < 40; g++) {      // 물보라
      var sp = ((t * 1.2 + r()) % 1), x0 = r() * w, y0 = h * (0.22 + r() * 0.35);
      ctx.fillStyle = 'rgba(232,244,250,' + (0.7 * (1 - sp)).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(x0 - sp * 60, y0 - sp * 60 + sp * sp * 150, 1.5 + r() * 3, 0, 7); ctx.fill();
    }
    var mist = ctx.createLinearGradient(0, h * 0.3, 0, h * 0.8); mist.addColorStop(0, 'rgba(220,235,245,0)'); mist.addColorStop(0.5, 'rgba(220,235,245,.2)'); mist.addColorStop(1, 'rgba(220,235,245,0)');
    ctx.fillStyle = mist; ctx.fillRect(0, h * 0.3, w, h * 0.5);   // 물안개 (위아래로 흐려진다)
  };
  SC.flood.bg = function (ctx, w, h) { sky(ctx, w, h, '#4a5662', '#9aa4a8', 'rgba(90,72,46,.55)'); };
  SC.flood.fx = function (ctx, w, h, t) {
    var r = rng(23); ctx.strokeStyle = 'rgba(210,225,235,.45)'; ctx.lineWidth = 1.2; ctx.beginPath();   // 퍼붓는 비
    for (var k = 0; k < 140; k++) { var rx = (r() * w + t * 90) % w, ry = (r() * h + t * 600) % h; ctx.moveTo(rx, ry); ctx.lineTo(rx - 5, ry + 16); }
    ctx.stroke();
    r = rng(29);
    for (var s = 0; s < 14; s++) { var sl = ((t * 1.4 + r()) % 1), sx = r() * w, sy = h * (0.72 + r() * 0.22); ctx.strokeStyle = 'rgba(230,220,200,' + (0.5 * (1 - sl)).toFixed(2) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(sx, sy, 3 + sl * 12, 1 + sl * 3, 0, 0, 7); ctx.stroke(); }   // 빗방울 물결
  };
  /** 한 장면: 시트가 있으면 바탕 → 뒤 효과 → 시트 → 앞 효과, 없으면 코드로 그린 장면만. 시트를 그렸으면 true */
  function paint(ctx, kind, w, h, t) {
    var sc = SC[kind];
    if (sc.bg && (spriteImage(kind) || hasSheet(kind))) {   // 시트를 불러오는 동안에도 코드 장면을 잠깐 보이지 않는다
      sc.bg(ctx, w, h, t);
      if (sc.back) sc.back(ctx, w, h, t);
      drawSprite(ctx, kind, w, h, t, sc.shake ? sc.shake(t) : null);
      if (sc.fx) sc.fx(ctx, w, h, t);
      return true;
    }
    sc.draw(ctx, w, h, t);
    return false;
  }
  DF.paint = paint;
  DF.SCENES = SC;

  var cur = null;
  /** 재해 그림창을 띄운다. o.title: 창 이름 (없으면 갈래 이름) */
  DF.show = function (kind, o) {
    o = o || {};
    var sc = SC[kind], cf = C(); if (!sc || cf.on === false) return NOOP;
    var root = document.getElementById('ui'); if (!root) return NOOP;
    if (cur) cur.stop();
    var w = cf.w || 640, h = cf.h || 280;
    var box = document.createElement('div');
    box.className = 'eventfx wood brass-frame dzfx';
    box.style.cssText = 'left:' + Math.round((1600 - w - 20) / 2) + 'px;top:' + Math.round(900 - (cf.bottom || 205) - h - 20) + 'px';
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.style.width = w + 'px'; cv.style.height = h + 'px';
    box.appendChild(cv);
    var tl = document.createElement('div'); tl.className = 'eventfx-title'; tl.textContent = o.title || sc.title; box.appendChild(tl);
    root.appendChild(box);
    var ctx = cv.getContext('2d'), h0 = { alive: true }, t0 = performance.now();
    function frame() {
      if (!h0.alive) return;
      try {
        var t = (performance.now() - t0) / 1000;
        ctx.setTransform(1, 0, 0, 1, 0, 0); paint(ctx, kind, w, h, t);
      } catch (e) { console.warn('[재해 그림]', e); h0.alive = false; return; }
      requestAnimationFrame(frame);
    }
    try { paint(ctx, kind, w, h, 0.01); } catch (e) { console.warn('[재해 그림]', e); }
    requestAnimationFrame(frame);
    setTimeout(function () { box.classList.add('on'); }, 16);
    if (kind === 'quake' || o.shake) DF.shake(cf.shake || 1.6);
    h0.stop = function () {
      if (!box.parentNode) return Promise.resolve();
      h0.alive = false; box.classList.remove('on'); if (cur === h0) cur = null;
      return new Promise(function (res) { setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); res(); }, 280); });
    };
    h0.canvas = cv; h0.box = box;
    cur = h0;
    return h0;
  };
  /** 화면(지도·바다)을 흔든다 — 예전에는 #stage의 그림 층을 CSS로 옮겼지만, 이제는 탐험·항해 화면이 그릴 때만 카메라를 옮긴다
      (G.Quake, js/art/quakefx.js — 상태창·단추·자막·미니맵은 흔들리지 않고 클릭 자리도 맞는다). 이미 흔들리는 중이면 그대로 둔다 */
  DF.shake = function (sec, o) {
    if (G.Quake && !G.Quake.active('quake')) G.Quake.start('quake', o || { sev: 2, close: 0.7 });
  };
  /** 도감·시험용: 한 장면을 주어진 시각으로 그린다 — 시트로 그렸으면 true, 코드 장면으로 대신했으면 false */
  DF.render = function (ctx, kind, t, w, h) {
    var sc = SC[kind]; if (!sc) return false;
    w = w || 640; h = h || 280; t = t || 1;
    return paint(ctx, kind, w, h, t);
  };
})(window.G = window.G || {});
