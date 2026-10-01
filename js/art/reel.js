/* 발견 장면 판(images/discovery-sheets/ID.webp — tools/ruin_gifs/sheets.py)을 Canvas에 돌리는 재생기 (G.Reel).
   · 판: 가로 6칸 × 세로 n줄, 칸 하나가 한 장면(가로:세로 2.25). 칸 수 = 장면 수.
   · 장면 사이를 겹쳐 그려(앞 장면 위에 다음 장면을 서서히) 적은 장면으로도 부드럽게 넘어간다.
   · 재생 시간은 게임이 정한다(G.FX.reveal.playMs). 끝나면 마지막 장면에서 멈춘다 — GIF처럼 처음부터 다시 받을 필요가 없다.
   · 판을 미리 받아 풀어 두면(Reel.prefetch) 발견하는 순간 바로 돈다. */
(function (G) {
  'use strict';
  var R = {};
  G.Reel = R;
  var COLS = 6, ASPECT = 576 / 256;

  function FX() { return (G.FX && G.FX.reveal) || {}; }
  function I() { return G.Img; }
  /** 이 발견물의 장면 판 키 (없으면 null) */
  R.key = function (d) { var k = d && ('discovery-sheets/' + d.id); return k && I() && I().has(k) ? k : null; };
  R.has = function (d) { return !!R.key(d); };

  /* 판 준비: 키 → Promise<{img, cols, rows, n, cw, ch}> — 받은 뒤 decode()로 미리 풀어 둔다 (처음 그릴 때 멈칫하지 않게) */
  var ready = {}, info = {};
  function layout(img) {
    var W = img.naturalWidth || img.width, H = img.naturalHeight || img.height;
    var cw = W / COLS, rows = Math.max(1, Math.round(H / (cw / ASPECT)));
    return { img: img, cols: COLS, rows: rows, n: COLS * rows, cw: cw, ch: H / rows };
  }
  R.load = function (key) {
    if (!key) return Promise.resolve(null);
    if (ready[key]) return ready[key];
    ready[key] = I().load(key).then(function (img) {
      if (!img) { delete ready[key]; return null; }
      var done = function () { return (info[key] = layout(img)); };
      return img.decode ? img.decode().then(done, done) : done();
    });
    return ready[key];
  };
  /** 이미 풀어 둔 판 (없으면 null) — 기다리지 않는다 */
  R.now = function (key) { return info[key] || null; };
  /** 곧 볼지도 모르는 발견물: 기다리지 않고 받기만 시작한다. 여러 번 불러도 한 번만 받는다 */
  R.prefetch = function (d) {
    var k = R.key(d); if (k && !ready[k]) R.load(k);
    if (d && I() && I().prefetchKeys) I().prefetchKeys(['discovery-ends/' + d.id]);   // 발견 카드·신기루의 마지막 장면 그림 (아티팩트판은 묶음에 있다)
  };

  /** 한 순간(p: 0~1)의 그림을 ctx에 그린다 — 장면 사이는 겹쳐서 */
  function drawAt(ctx, L, p, W, H) {
    var x = Math.max(0, Math.min(1, p)) * (L.n - 1), i = Math.floor(x), f = x - i;
    var X = FX().blend == null ? 0.55 : FX().blend;       // 한 장면 시간 가운데 겹쳐 넘어가는 몫
    var a = X > 0 ? Math.max(0, Math.min(1, (f - (1 - X)) / X)) : (f >= 0.5 ? 1 : 0);
    a = a * a * (3 - 2 * a);
    if (i >= L.n - 1) { i = L.n - 1; a = 0; }
    cell(ctx, L, i, 1, W, H);
    if (a > 0.002) cell(ctx, L, i + 1, a, W, H);
  }
  function cell(ctx, L, i, alpha, W, H) {
    var sx = (i % L.cols) * L.cw, sy = Math.floor(i / L.cols) * L.ch;
    ctx.globalAlpha = alpha;
    ctx.drawImage(L.img, sx + 0.5, sy + 0.5, L.cw - 1, L.ch - 1, 0, 0, W, H);   // 반 픽셀 안쪽: 옆 칸이 번져 들지 않게
    ctx.globalAlpha = 1;
  }
  /** 마지막 장면만 그린다 (재생을 건너뛸 때, 수첩의 작은 그림) */
  R.drawLast = function (canvas, L) { var c = canvas.getContext('2d'); c.imageSmoothingEnabled = true; cell(c, L, L.n - 1, 1, canvas.width, canvas.height); };

  /** canvas에서 판 L을 ms 동안 돌린다. opts: {ms, loop, onEnd} → {finish(): 곧장 마지막 장면, stop(), done: Promise} */
  R.play = function (canvas, L, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d'), ms = Math.max(200, opts.ms || FX().playMs || 5000), t0 = null, raf = 0, over = false, resolveDone;
    var done = new Promise(function (r) { resolveDone = r; });
    ctx.imageSmoothingEnabled = true;
    function end() { if (over) return; over = true; if (raf) cancelAnimationFrame(raf); raf = 0; R.drawLast(canvas, L); resolveDone(); if (opts.onEnd) opts.onEnd(); }
    function tick(now) {
      raf = 0; if (over) return;
      if (!canvas.isConnected && t0 != null) { over = true; resolveDone(); return; }    // 창을 닫았다
      if (t0 == null) t0 = now;
      var p = (now - t0) / ms;
      if (p >= 1 && !opts.loop) { end(); return; }
      drawAt(ctx, L, opts.loop ? p % 1 : p, canvas.width, canvas.height);
      raf = requestAnimationFrame(tick);
    }
    drawAt(ctx, L, 0, canvas.width, canvas.height);
    raf = requestAnimationFrame(tick);
    return { finish: end, stop: function () { over = true; if (raf) cancelAnimationFrame(raf); raf = 0; resolveDone(); }, done: done };
  };

  /** 장면 판을 도는 Canvas 요소를 바로 돌려준다 (판을 아직 받는 중이면 받는 대로 시작). opts: {w, h, ms, loop, cls} */
  R.element = function (d, opts) {
    opts = opts || {};
    var key = R.key(d); if (!key) return null;
    var cv = document.createElement('canvas');
    cv.width = opts.w || 1152; cv.height = opts.h || 512;
    if (opts.cls) cv.className = opts.cls;
    R.load(key).then(function (L) { if (L) R.play(cv, L, { ms: opts.ms, loop: opts.loop }); });
    return cv;
  };
})(window.G = window.G || {});
