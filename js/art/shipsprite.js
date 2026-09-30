/* 16방향 선박 스프라이트: 선체와 바람별 돛 층을 합성한다.
   그림을 아직 못 읽었거나 빠졌으면 기존 A.shipTop(코드 그림)으로 자동 복귀한다.

   늦게 나오거나 끊기지 않게 하는 장치
   - 시트는 읽자마자 ImageBitmap으로 미리 풀어 둔다(createImageBitmap — 풀기는 따로 도는 일꾼이 한다).
     <img>를 그대로 그리면 처음 그릴 때 그 자리에서 1792×3136을 풀어 한 장면이 멈칫하고,
     브라우저가 메모리를 아끼려고 풀어 둔 것을 버리면 다시 멈칫한다.
   - 작게 그릴 때(다른 배·먼 배)는 반으로 줄인 사본을 쓴다 — 계단 현상이 줄고 GPU가 읽는 양도 준다.
   - 항해를 나서기 전(도시)·바다에 들어설 때·배가 화면 밖에서 나타날 때 미리 읽는다(S.want).
   - 방위 칸이 바뀌는 경계에서 뱃머리가 조금씩 흔들려도 두 그림 사이를 오가며 깜박이지 않게,
     배마다(spec.sid) 먼저 쓰던 칸을 조금 더 붙잡는다(히스테리시스). 칸 사이의 나머지 각도는 그림을 돌려 메운다. */
(function (G) {
  'use strict';
  var A = G.Art, I = G.Img, TAU = Math.PI * 2;
  var oldTop = A.shipTop;
  var S = {};
  G.ShipSprite = S;

  function CF() { return (G.FX && G.FX.sprite) || {}; }
  function wrap(a) { a %= TAU; return a < 0 ? a + TAU : a; }
  function angd(a) { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; }

  /* ── 시트 준비: 키 → {st:'loading'|'ok'|'fail', full, half, img} ── */
  var sheets = {};
  var canBitmap = typeof window.createImageBitmap === 'function';
  function bitmap(img, w, h) {
    if (!canBitmap) return Promise.resolve(null);
    try {
      var p = w ? createImageBitmap(img, { resizeWidth: w, resizeHeight: h, resizeQuality: 'high', premultiplyAlpha: 'premultiply' })
        : createImageBitmap(img, { premultiplyAlpha: 'premultiply' });
      return p.catch(function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  }
  function prepare(key) {
    var sh = sheets[key];
    if (sh) return sh.p;
    sh = sheets[key] = { st: 'loading' };
    sh.p = I.load(key).then(function (img) {
      if (!img) { sh.st = 'fail'; return sh; }
      sh.img = img;
      var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
      // 원본 크기 풀기가 먼저 끝나면 곧바로 그리기 시작한다. 반 크기 사본은 뒤따라 채운다.
      return bitmap(img).then(function (full) {
        sh.full = full; sh.w = w; sh.h = h; sh.st = 'ok';
        var hk = CF().halfBelow == null ? 0.55 : CF().halfBelow;
        if (hk > 0) bitmap(img, Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(h / 2))).then(function (half) { sh.half = half; });
        return sh;
      });
    });
    return sh.p;
  }
  function ready(meta) {
    if (!meta || !I || !I.has(meta.key)) return null;
    var sh = sheets[meta.key];
    if (!sh) { prepare(meta.key); return null; }
    return sh.st === 'ok' ? sh : null;
  }
  S.status = function (type) {
    var meta = G.SHIP_ART && G.SHIP_ART[type];
    if (!meta || !I || !I.has(meta.key)) return 'none';
    var sh = sheets[meta.key]; return sh ? sh.st : 'idle';
  };

  /** 미리 읽기: 배 종류 목록(중복·없는 것은 건너뜀). 다 준비되면(또는 ms가 지나면) 풀린다 */
  S.preload = function (ids, ms) {
    var seen = {}, ps = [];
    (ids || []).forEach(function (id) {
      var meta = G.SHIP_ART && G.SHIP_ART[id];
      if (!id || seen[id] || !meta || !I || !I.has(meta.key)) return;
      seen[id] = true; ps.push(prepare(meta.key));
    });
    if (!ps.length) return Promise.resolve();
    var all = Promise.all(ps);
    return ms ? Promise.race([all, new Promise(function (r) { setTimeout(r, ms); })]) : all;
  };
  /** 곧 그릴 배(화면 밖에서 다가오는 배 등): 기다리지 않고 읽기만 시작한다. 매 장면 불러도 가볍다 */
  S.want = function (ids) {
    if (!ids) return;
    for (var i = 0; i < ids.length; i++) {
      var meta = G.SHIP_ART && G.SHIP_ART[ids[i]];
      if (meta && !sheets[meta.key] && I && I.has(meta.key)) prepare(meta.key);
    }
  };
  /** 제독 함대의 배 종류 */
  S.fleetTypes = function () {
    var s = G.Game && G.Game.state; if (!s || !s.fleet || !s.fleet.ships) return [];
    return s.fleet.ships.map(function (sh) { return sh.type; });
  };

  /* ── 방위 칸 고르기 (배마다 히스테리시스) ── */
  //   칸이 바뀌면 앞 칸 위에 새 칸을 잠깐(FX.sprite.fade초) 겹쳐 올려 그림이 툭 바뀌지 않게 한다
  var held = {}, heldN = 0;
  function nowS() { return (window.performance ? performance.now() : Date.now()) / 1000; }
  function pickDir(meta, a, sid) {
    var step = TAU / meta.dirs, raw = a / step, dir = Math.round(raw) % meta.dirs;
    if (sid == null) return { dir: dir, from: dir, k: 1 };
    var key = meta.key + '|' + sid, h = held[key];
    if (h && h.dir !== dir) {
      var hy = CF().hold == null ? 0.12 : CF().hold;          // 칸 폭의 몇 배만큼 더 붙잡나
      if (Math.abs(angd(a - h.dir * step)) < step * (0.5 + hy)) dir = h.dir;
    }
    if (!h) { if (++heldN > 400) { held = {}; heldN = 0; } h = held[key] = { dir: dir, from: dir, t0: -9 }; }   // 오래된 배는 가끔 비운다
    else if (h.dir !== dir) { h.from = h.dir; h.dir = dir; h.t0 = nowS(); }
    var fd = CF().fade == null ? 0.14 : CF().fade, k = fd > 0 ? Math.min(1, (nowS() - h.t0) / fd) : 1;
    return { dir: dir, from: h.from, k: k };
  }

  function sourceFor(sh, meta, drawScale) {
    // 화면(장치 픽셀) 기준 배율이 halfBelow보다 작으면 반 크기 사본
    var hk = CF().halfBelow == null ? 0.55 : CF().halfBelow;
    if (sh.half && drawScale < hk) return { src: sh.half, k: sh.half.width / (meta.cols * meta.cell) };
    var src = sh.full || sh.img;
    return { src: src, k: (sh.w || src.width) / (meta.cols * meta.cell) };
  }
  function frame(ctx, so, meta, dir, layer, scale, residual, alpha, wobble, fill) {
    if (alpha <= 0.001) return;
    var c = meta.cell, band = Math.floor(dir / meta.cols), k = so.k;
    var sx = (dir % meta.cols) * c * k, sy = (layer * 2 + band) * c * k, sc = c * k;
    var ax = meta.anchor[0], ay = meta.anchor[1];
    ctx.save();
    if (alpha < 1) ctx.globalAlpha *= alpha;
    ctx.rotate(-residual + (wobble || 0));
    if (fill != null && layer !== meta.layers.hull) ctx.scale(1 + Math.max(-0.05, Math.min(0.07, (fill - 0.75) * 0.04)), 1);
    ctx.drawImage(so.src, sx, sy, sc, sc, -ax * scale, -ay * scale, c * scale, c * scale);
    ctx.restore();
  }
  function drawDirection(ctx, so, meta, dir, ang, scale, spec, t, alpha) {
    var step = TAU / meta.dirs, residual = angd(ang - dir * step);
    var rig = spec.rig || {}, sails = meta.sails || [];
    var hasSquare = sails.indexOf('sq') >= 0, hasLateen = sails.indexOf('lat') >= 0;
    var luff = Math.max(0, Math.min(1, rig.luff || 0));
    var state = hasSquare ? (rig.brace || 0) / 0.75 : hasLateen ? (rig.lee || 0) : (rig.brace || rig.lee || 0);
    state = Math.max(-1, Math.min(1, state)) * (1 - luff * 0.68);
    var wobble = Math.sin(t * 18 + dir * 0.7) * 0.018 * luff;
    var furl = Math.max(0, Math.min(1, spec.furl || 0));
    var fill = rig.fill == null ? 0.85 : rig.fill;
    frame(ctx, so, meta, dir, meta.layers.hull, scale, residual, alpha, 0, null);
    if (furl < 0.5) frame(ctx, so, meta, dir, meta.layers.sails[Math.max(0, Math.min(4, Math.round((state + 1) * 2)))], scale, residual, alpha, wobble, fill);
    else frame(ctx, so, meta, dir, meta.layers.furl, scale, residual, alpha, 0, 0.4);
  }
  /* 그림자·물살 자국: 뱃머리 쪽으로 돌린다. 내려다보는 각도(약 55°)만큼 남북 방향은 짧아 보인다 */
  var FORE = 0.82;
  function shadow(ctx, len, ang, spec) {
    if (ctx.globalCompositeOperation === 'lighter') return;     // 맞은 배를 밝게 겹칠 때는 그림자를 다시 그리지 않는다
    var ps = spec.pose || {}, W = len * 0.34;
    var ca = Math.cos(ang), sa = Math.sin(ang) * FORE, sa2 = Math.atan2(sa, ca), fl = Math.sqrt(ca * ca + sa * sa);
    ctx.save(); ctx.rotate(-sa2);
    if (!spec.noWake) {
      ctx.fillStyle = 'rgba(255,255,255,0.11)'; ctx.beginPath();
      ctx.moveTo(-len * 0.5 * fl, 0); ctx.lineTo(-len * 1.05 * fl, -W * 0.9); ctx.lineTo(-len * 1.05 * fl, W * 0.9); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // 그림자는 물 위(화면 아래쪽)로 조금 비껴 떨어진다 — 비낌은 화면 기준, 모양은 뱃머리 쪽으로
    ctx.save(); ctx.translate(0, W * (0.34 - (ps.roll || 0) * 0.55)); ctx.rotate(-sa2);
    ctx.fillStyle = 'rgba(0,12,28,0.28)'; ctx.beginPath();
    ctx.ellipse(len * 0.03 * fl, 0, Math.max(W * 0.62, len * 0.52 * fl), W * 0.58, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function flags(ctx, x, y, ang, len, spec, t) {
    if (!spec.flag || !A.streamer) return;
    var rig = spec.rig || {}, wa = -ang + (rig.wind || 0), aws = rig.aws == null ? 0.6 : rig.aws;
    A.streamer(ctx, x, y - len * 0.59, wa, len * 0.22, Math.max(1.5, len * 0.024), t, spec.pennant || '#c8312a', aws);
    var bx = x - Math.cos(ang) * len * 0.45, by = y + Math.sin(ang) * len * 0.45 * FORE - len * 0.11;
    A.streamer(ctx, bx, by, wa, len * 0.13, Math.max(1.2, len * 0.02), t + 1.3, spec.flag, aws);
  }

  /** 같은 인수의 A.shipTop 대체 그림. 그렸으면 true (spec.sid = 배마다 다른 이름이면 방위 칸이 덜 깜박인다) */
  S.draw = function (ctx, x, y, ang, len, spec, t) {
    spec = spec || {};
    var meta = G.SHIP_ART && G.SHIP_ART[spec.type], sh = ready(meta);
    if (!sh) return false;
    var a = wrap(ang), step = TAU / meta.dirs;
    var pk = pickDir(meta, a, spec.sid), dir = pk.dir;
    var ps = spec.pose || {}, hv = 1 + (ps.heave || 0), scale = len / meta.baseLen;
    var m = ctx.getTransform ? ctx.getTransform() : null, dev = m ? Math.sqrt(m.a * m.a + m.b * m.b) : 1;
    var so = sourceFor(sh, meta, scale * dev);
    // 경계 바로 앞 아주 좁은 폭만 두 칸을 겹쳐 튀지 않게 한다 (붙잡은 칸이면 겹치지 않는다)
    var residual = angd(a - dir * step), blend = 0, other = dir;
    var edge = CF().blend == null ? 0.02 : CF().blend;
    if (spec.sid == null && edge > 0) {
      var e0 = step * (0.5 - edge), ar = Math.abs(residual);
      if (ar > e0) { blend = Math.min(0.5, (ar - e0) / (step * edge) * 0.5); other = (dir + (residual >= 0 ? 1 : -1) + meta.dirs) % meta.dirs; }
    }
    ctx.save(); ctx.translate(x, y); shadow(ctx, len, a, spec);
    ctx.scale(hv, hv * (1 - Math.abs(ps.roll || 0) * 0.32));
    ctx.translate(-(ps.pitch || 0) * len * 0.10, -(ps.roll || 0) * len * 0.24);
    ctx.imageSmoothingEnabled = true;
    if (pk.k < 1 && pk.from !== dir) { drawDirection(ctx, so, meta, pk.from, a, scale, spec, t || 0, 1); drawDirection(ctx, so, meta, dir, a, scale, spec, t || 0, pk.k * pk.k * (3 - 2 * pk.k)); }   // 앞 칸 위에 새 칸을 서서히
    else drawDirection(ctx, so, meta, dir, a, scale, spec, t || 0, 1 - blend);
    if (blend > 0.001) drawDirection(ctx, so, meta, other, a, scale, spec, t || 0, blend);
    ctx.restore();
    flags(ctx, x, y, ang, len, spec, t || 0);
    return true;
  };

  A.shipTop = function (ctx, x, y, ang, len, spec, t) {
    if (!S.draw(ctx, x, y, ang, len, spec, t)) oldTop(ctx, x, y, ang, len, spec, t);
  };
})(window.G = window.G || {});
