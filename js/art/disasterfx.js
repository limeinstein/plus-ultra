/* 재해 그림 (G.DisasterFx) — 지진·화산·산사태·쓰나미·홍수가 덮칠 때 대화창 바로 위에 나무틀 그림창을 띄운다.
   · Canvas 배경 위에 images/sprites/disaster_*.webp의 투명 4×2 애니메이션 시트를 합성한다. 지진은 화면도 흔든다 (G.DisasterFx.shake).
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
  function drawSprite(ctx, kind, w, h, t) {
    var spec = G.DISASTER_SPRITES && G.DISASTER_SPRITES[kind], img = spriteImage(kind);
    if (!spec || !img) return false;
    var frame = Math.floor(Math.max(0, t) * 1000 / spec.ms) % spec.frames;
    var sw = img.width / 4, sh = img.height / 2, size = Math.min(w * 0.86, h * 1.7);
    ctx.save();
    ctx.globalAlpha = 0.94;
    ctx.drawImage(img, (frame % 4) * sw, Math.floor(frame / 4) * sh, sw, sh,
      (w - size) / 2, h - size * 0.88, size, size);
    ctx.restore();
    return true;
  }
  /** 지도 위 재해 표지: 그 갈래의 움직이는 그림(4×2 시트)을 (cx, cy)에 바닥을 맞춰 size 크기로 그린다. 그림이 아직 없으면 false */
  DF.sprite = function (ctx, kind, cx, cy, size, t, alpha) {
    var spec = G.DISASTER_SPRITES && G.DISASTER_SPRITES[kind], img = spriteImage(kind);
    if (!spec || !img) return false;
    var frame = Math.floor(Math.max(0, t) * 1000 / spec.ms) % spec.frames;
    var sw = img.width / 4, sh = img.height / 2;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 0.92 : alpha;
    ctx.drawImage(img, (frame % 4) * sw, Math.floor(frame / 4) * sh, sw, sh, cx - size / 2, cy - size * 0.86, size, size);
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
        ctx.setTransform(1, 0, 0, 1, 0, 0); sc.draw(ctx, w, h, t); drawSprite(ctx, kind, w, h, t);
      } catch (e) { console.warn('[재해 그림]', e); h0.alive = false; return; }
      requestAnimationFrame(frame);
    }
    try { sc.draw(ctx, w, h, 0.01); drawSprite(ctx, kind, w, h, 0.01); } catch (e) { console.warn('[재해 그림]', e); }
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
  /** 도감·시험용: 한 장면을 주어진 시각으로 그린다 */
  DF.render = function (ctx, kind, t, w, h) {
    var sc = SC[kind]; if (!sc) return false;
    w = w || 640; h = h || 280; t = t || 1;
    sc.draw(ctx, w, h, t); drawSprite(ctx, kind, w, h, t);
    return true;
  };
})(window.G = window.G || {});
