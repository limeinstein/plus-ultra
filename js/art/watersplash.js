/* 해전 물보라 7종. 그림·반동만 담당하며 피해·속력·충돌 좌표를 바꾸지 않는다. */
(function (G) {
  'use strict';
  var W = G.WaterSplash = {}, sheets = {}, loading = {};
  function cfg() { return G.FX.waterSplash; }
  /** 물기둥은 남기고 수면에 깔린 물은 더 비치게 한다. 한 번만 합성해 매 프레임의 비용을 줄인다. */
  function translucent(im) {
    var c = cfg(), a = c.alpha, cv = document.createElement('canvas');
    cv.width = im.naturalWidth || im.width; cv.height = im.naturalHeight || im.height;
    var ctx = cv.getContext('2d'); ctx.drawImage(im, 0, 0); ctx.globalCompositeOperation = 'destination-in';
    for (var i = 0; i < c.frames; i++) {
      var x = i % c.cols * c.cell, y = Math.floor(i / c.cols) * c.cell, g = ctx.createLinearGradient(0, y, 0, y + c.cell);
      g.addColorStop(0, 'rgba(0,0,0,' + a.spray + ')');
      g.addColorStop(a.sprayAt, 'rgba(0,0,0,' + a.spray + ')');
      g.addColorStop(a.baseAt, 'rgba(0,0,0,' + a.base + ')');
      g.addColorStop(a.edgeAt, 'rgba(0,0,0,' + a.edge + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, c.cell, c.cell); ctx.clip();
      ctx.fillStyle = g; ctx.fillRect(x, y, c.cell, c.cell); ctx.restore();
    }
    return cv;
  }
  function load(id) {
    var key = 'effects/water/' + id;
    if (sheets[id]) return Promise.resolve(sheets[id]);
    if (loading[id]) return loading[id];
    if (!G.Img || !G.Img.has(key)) return Promise.resolve(null);
    return loading[id] = G.Img.load(key).then(function (im) {
      delete loading[id]; if (im) sheets[id] = translucent(im); return sheets[id] || null;
    }, function () { delete loading[id]; return null; });
  }
  W.preload = function () { return Promise.all(Object.keys(cfg().types).map(load)); };
  W.status = function (id) { return sheets[id] ? 'ok' : loading[id] ? 'loading' : 'none'; };
  /** 닫힌 흰 원 대신 끊어진 가는 잔물결. 로딩 중에도 같은 옅은 표현을 쓴다. */
  W.ripple = function (ctx, x, y, radius, q, seed) {
    var c = cfg(), t = Math.max(0, Math.min(1, q)), r = radius * (1 - c.rippleGrow + t * c.rippleGrow);
    if (!c.on || t >= 1) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(1, c.planeY);
    ctx.globalAlpha *= c.rippleOpacity * (1 - t) * (1 - t);
    ctx.strokeStyle = '#a5c5ce'; ctx.lineWidth = c.rippleLine; ctx.lineCap = 'round';
    for (var i = 0; i < c.rippleParts; i++) {
      var a = i * Math.PI * 2 / c.rippleParts + (seed || 0), rr = r * (0.9 + 0.1 * Math.sin(i * 3.7 + (seed || 0)));
      ctx.beginPath(); ctx.arc(0, 0, rr, a, a + c.rippleSpan); ctx.stroke();
    }
    ctx.restore();
  };
  W.emit = function (st, id, x, y, scale, angle) {
    var c = cfg(), type = c.types[id];
    if (!c.on || !type || !st || !st.fx) return false;
    var count = 0;
    for (var i = 0; i < st.fx.length; i++) if (st.fx[i].kind === 'waterSprite') count++;
    if (count >= c.max) return false;
    st.fx.push({ kind: 'waterSprite', style: id, x: x, y: y, t: 0, life: type.life,
      size: type.size * (scale || 1), angle: angle || 0 });
    load(id); return true;
  };
  W.draw = function (ctx, f, x, y) {
    var c = cfg(), type = c.types[f.style], im = sheets[f.style];
    if (!type || !c.on) return;
    var q = Math.max(0, Math.min(1, f.t / f.life)), a = Math.min(1, q / c.fadeIn, (1 - q) / c.fadeOut);
    ctx.save(); ctx.translate(x, y);
    // 옆으로 뻗는 물살만 수면을 따라 돌린다. 수직 물기둥은 세워 둔다.
    if (type.directional) { ctx.scale(1, c.planeY); ctx.rotate(f.angle); ctx.scale(1, 1 / c.planeY); }
    a *= ctx.globalAlpha * c.opacity; ctx.globalAlpha = a;
    if (im) {
      var pos = q * (c.frames - 1), first = Math.floor(pos), mix = pos - first, size = f.size;
      function frame(n, alpha) {
        ctx.globalAlpha = a * alpha;
        ctx.drawImage(im, n % c.cols * c.cell, Math.floor(n / c.cols) * c.cell, c.cell, c.cell,
          -c.anchor[0] / c.cell * size, -c.anchor[1] / c.cell * size, size, size);
      }
      frame(first, 1 - mix); if (mix > 0) frame(Math.min(first + 1, c.frames - 1), mix);
    } else {
      // 불러오는 동안에도 물에 닿은 위치가 보인다. file://에서도 별도 요청 없이 동작한다.
      W.ripple(ctx, 0, 0, f.size * c.fallbackGrow, q, f.angle);
    }
    ctx.restore();
  };
})(window.G = window.G || {});
