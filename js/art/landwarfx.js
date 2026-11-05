/* 육상전의 화약·흙먼지. 해전 cannonImpact와 같은 다중 난류 질감·화염 덩어리를 사용한다.
   처음 만든 질감은 재사용하고 난수는 씨앗으로 고정해 멈춘 화면에서 지글거리지 않는다. */
(function (G) {
  'use strict';
  var F = G.LandWarFx = {}, cache = {}, TAU = Math.PI * 2;
  function cfg() { return G.FX.landwar; }
  function rnd(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function clamp(n) { return Math.max(0, Math.min(1, n)); }
  function texture(kind, variant) {
    var key = kind + variant; if (cache[key]) return cache[key];
    var N = cfg().textureSize, c = document.createElement('canvas'); c.width = c.height = N;
    var ctx = c.getContext('2d'), data = ctx.createImageData(N, N);
    var layers = [4, 8, 16, 32].map(function (n, l) { var a = []; for (var i = 0; i < (n + 1) * (n + 1); i++) a.push(rnd(i + variant * 173 + l * 271)); return { n: n, a: a }; });
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var noise = 0, sum = 0;
      layers.forEach(function (l, i) {
        var xx = x / N * l.n, yy = y / N * l.n, ix = Math.floor(xx), iy = Math.floor(yy), fx = xx - ix, fy = yy - iy;
        fx *= fx * (3 - 2 * fx); fy *= fy * (3 - 2 * fy);
        var at = iy * (l.n + 1) + ix, a = l.a, next = l.n + 1, w = 1 / (1 << i);
        noise += ((a[at] * (1 - fx) + a[at + 1] * fx) * (1 - fy) + (a[at + next] * (1 - fx) + a[at + next + 1] * fx) * fy) * w; sum += w;
      });
      noise /= sum;
      var dx = (x - N / 2) / (N / 2), dy = (y - N / 2) / (N / 2), d = Math.sqrt(dx * dx + dy * dy);
      var mask = clamp((.85 - d + (noise - .5) * .75) * 5), heat = clamp(noise * 1.5 + (1 - d) * .3 - .28), off = (y * N + x) * 4;
      if (kind === 'fire') { data.data[off] = 190 + heat * 65; data.data[off + 1] = 34 + Math.pow(heat, 1.3) * 215; data.data[off + 2] = 5 + Math.pow(heat, 3.3) * 170; }
      else { var gray = (kind === 'dust' ? 101 : 65) + noise * 95; data.data[off] = gray; data.data[off + 1] = gray * (kind === 'dust' ? .83 : .96); data.data[off + 2] = gray * (kind === 'dust' ? .57 : .90); }
      data.data[off + 3] = mask * clamp((noise - .2) * 2.4) * (kind === 'fire' ? 235 : 170);
    }
    ctx.putImageData(data, 0, 0); return cache[key] = c;
  }
  function puff(ctx, kind, x, y, r, alpha, seed, stretch) {
    ctx.save(); ctx.globalAlpha *= clamp(alpha); ctx.translate(x, y); ctx.rotate(seed);
    ctx.drawImage(texture(kind, Math.abs(seed * 13 | 0) % 3), -r, -r * (stretch || 1), r * 2, r * 2 * (stretch || 1)); ctx.restore();
  }
  F.push = function (list, e) {
    // 숫자와 대사는 보존하고 오래된 연기부터 줄인다.
    if (list.length >= cfg().maxFx) { var i = list.findIndex(function (f) { return f.kind === 'smoke' || f.kind === 'dust' || f.kind === 'ember' || f.kind === 'debris'; }); if (i >= 0) list.splice(i, 1); else return false; }
    list.push(e); return true;
  };
  F.blast = function (list, x, y, power) {
    var K = cfg(), seed = x * .13 + y * .37;
    F.push(list, { kind: 'boom', x: x, y: y, t: 0, life: K.blastLife, s: power || 1, seed: seed });
    for (var i = 0; i < K.sparks; i++) {
      var a = rnd(i + seed) * TAU, speed = K.sparkSpeed[0] + rnd(i + seed + 17) * (K.sparkSpeed[1] - K.sparkSpeed[0]);
      F.push(list, { kind: 'ember', x: x, y: y, vx: Math.cos(a) * speed, vy: -Math.abs(Math.sin(a)) * speed - 35, t: 0, life: K.sparkLife[0] + rnd(seed + i + 3) * (K.sparkLife[1] - K.sparkLife[0]), seed: i });
    }
    for (i = 0; i < K.debris; i++) F.push(list, { kind: 'debris', x: x, y: y, vx: (rnd(i + seed + 4) - .5) * 280, vy: -90 - rnd(i + seed + 91) * 180, t: 0, life: K.debrisLife, seed: i });
  };
  F.muzzle = function (list, x, y, dir, cannon, delay) {
    var K = cfg();
    F.push(list, { kind: 'flash', x: x, y: y, d: dir, cannon: cannon, t: -(delay || 0), life: cannon ? K.cannonFlashLife : K.gunFlashLife, r: cannon ? K.cannonFlashRadius : K.gunFlashRadius });
    F.push(list, { kind: 'smoke', x: x, y: y, d: dir, cannon: cannon, t: -(delay || 0), life: cfg().smokeLife, seed: x * .1 + y * .3 });
  };
  F.draw = function (ctx, e) {
    if (e.t < 0) return true;
    var p = clamp(e.t / e.life), K = cfg(), seed = e.seed == null ? e.x * .17 + e.y * .21 : e.seed;
    if (e.kind === 'boom') {
      var r = K.blastRadius * (e.s || 1), fireAge = clamp(e.t / G.FX.cannonImpact.flameLife), expand = 1 - Math.exp(-fireAge * 14), lobes = G.FX.cannonImpact.flameLobes;
      ctx.save();
      // 지면 섬광과 낮은 흙먼지 고리 뒤로 솟는 화염 덩어리·검은 연기.
      for (var d = 0; d < 9; d++) { var da = d / 9 * TAU; puff(ctx, 'dust', e.x + Math.cos(da) * r * p * 1.7, e.y + Math.sin(da) * r * p * .28 + 12, r * (.2 + p * .45), (1 - p) * .72, d + seed, .55); }
      for (var i = 0; i < lobes; i++) {
        var a = -Math.PI / 2 + Math.sin(seed + i * 2.3) * 1.5, reach = r * expand * (.15 + i * .13), fr = r * (.35 + i % 3 * .08) * (.55 + expand * .8);
        var x = e.x + Math.cos(a) * reach, y = e.y + Math.sin(a) * reach - fireAge * r * .4;
        if (fireAge < 1) puff(ctx, 'fire', x, y, fr, Math.pow(1 - fireAge, 1.45), seed + i);
        if (p > .06) puff(ctx, 'smoke', x + p * 12, y - p * 38, fr * (.6 + p), Math.sin(p * Math.PI) * .85, seed + i);
      }
      if (e.t < .10) {
        ctx.globalCompositeOperation = 'lighter'; var flash = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r * .9);
        flash.addColorStop(0, 'rgba(255,255,225,' + (1 - e.t / .10) + ')'); flash.addColorStop(1, 'rgba(255,160,30,0)'); ctx.fillStyle = flash; ctx.fillRect(e.x - r, e.y - r, r * 2, r * 2);
      }
      ctx.restore(); return true;
    }
    if (e.kind === 'smoke') {
      for (var j = 0; j < 5; j++) { var q = clamp((e.t - j * .035) / e.life), radius = (e.cannon ? K.smokeRadius : K.smokeRadius * .65) * (.35 + q * 1.8); puff(ctx, 'smoke', e.x + (e.d || 1) * (j * 6 + q * 32), e.y - q * K.smokeRise + Math.sin(seed + j) * 5, radius, Math.sin(q * Math.PI) * .62, seed + j); } return true;
    }
    if (e.kind === 'dust') { puff(ctx, 'dust', e.x + (e.vx || 0) * e.t, e.y + (e.vy || 0) * e.t, (e.r || 7) * (1 + p * 1.8), (1 - p) * .8, seed); return true; }
    if (e.kind === 'flash') {
      ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.d || 1, 1);
      puff(ctx, 'fire', (e.r || 8) * .7, 0, (e.r || 8) * (1 - p * .6), 1 - p, 0, .45); ctx.restore(); return true;
    }
    if (e.kind === 'ember') {
      var ex = e.x + e.vx * e.t, ey = e.y + e.vy * e.t + 180 * e.t * e.t;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= 1 - p; ctx.strokeStyle = '#ffc56b'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - e.vx * .028, ey - (e.vy + 360 * e.t) * .028); ctx.stroke(); ctx.restore(); return true;
    }
    if (e.kind === 'debris') {
      ctx.save(); ctx.translate(e.x + e.vx * e.t, e.y + e.vy * e.t + K.debrisGravity * e.t * e.t); ctx.rotate(seed + e.t * 9); ctx.globalAlpha *= 1 - p; ctx.fillStyle = seed % 2 ? '#7d6243' : '#352c25'; ctx.fillRect(-2, -1.5, 5, 3); ctx.restore(); return true;
    }
    return false;
  };
})(window.G = window.G || {});
