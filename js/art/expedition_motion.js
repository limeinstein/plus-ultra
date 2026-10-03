/* 육상 탐험의 보행·회전·야영. 저장 상태나 실제 이동 속도는 바꾸지 않는다. */
(function (G) {
  'use strict';
  var E = G.ExpeditionMotion = {}, TAU = Math.PI * 2;
  function config() { return (G.FX && G.FX.sprites && G.FX.sprites.expedition) || {}; }
  function wrap(a) { return ((a + Math.PI) % TAU + TAU) % TAU - Math.PI; }
  function mod(n, d) { return ((n % d) + d) % d; }
  function spec(id) { return (G.EXPEDITION_MOTION || {}).mounts && G.EXPEDITION_MOTION.mounts[id]; }
  function asset(m, action) { return m && (G.EXPEDITION_MOTION.sheets || {})[m[action]]; }
  function picture(sheet) {
    if (!sheet || !G.Img) return null;
    var im = G.Img.get(sheet.key);
    if (!im && G.Img.has(sheet.key)) G.Img.want(sheet.key);
    return im;
  }
  E.preload = function (id) {
    var m = spec(id || 'walk');
    ['walk', 'turn', 'camp'].forEach(function (action) { picture(asset(m, action)); });
  };
  E.ready = function (id, action) { return !!picture(asset(spec(id), action || 'walk')); };
  E.sample = function (u) {
    var id = (u.mount && u.mount.id) || 'walk', m = spec(id);
    if (!m) return null;
    var holder = u.cache || {}, a = holder.expedition, t = Number(u.t) || 0;
    var target = Number.isFinite(u.head) ? u.head : 0, c = config();
    if (!a || a.id !== id || t < a.time) {
      a = holder.expedition = { id: id, heading: target, time: t, phase: Number(u.phase) || 0 };
    }
    var dt = Math.max(0, Math.min(c.maxDelta || 0.1, t - a.time));
    a.time = t;
    var diff = wrap(target - a.heading), step = (c.turnRate || 4.8) * dt;
    a.heading = wrap(a.heading + Math.max(-step, Math.min(step, diff)));
    // 정지할 때 0번 자세로 되감지 않는다. 다시 걸으면 이어지는 발부터 움직인다.
    if (u.moving) a.phase = Number.isFinite(u.phase) ? u.phase : t * (c.previewHz || 1.3);
    var turning = Math.abs(wrap(target - a.heading)) > (c.turnEpsilon || 0.015);
    var action = u.camping ? 'camp' : turning ? 'turn' : 'walk';
    var sheet = asset(m, action), index, flip = false, frame = 0;
    if (!sheet) return null;
    if (action === 'camp') index = (m.campRow || 0) * 8 + mod(Math.floor(t * (c.campFps || 7)), 8);
    else if (action === 'turn') index = mod(Math.round((Math.PI / 2 - a.heading) / (TAU / 16)), 16);
    else {
      var dir = mod(Math.round((Math.PI / 2 - a.heading) / (TAU / 8)), 8);
      var count = sheet.framesPerDirection || 8;
      var row = sheet.directionRows ? sheet.directionRows[dir] : [dir, false];
      frame = mod(Math.floor(a.phase * count), count);
      index = row[0] * count + frame;
      flip = row[1];
    }
    return { id: id, action: action, index: index, frame: frame, flip: flip, sheet: sheet, heading: a.heading, phase: a.phase };
  };
  // 인물의 기준 크기에 맞춘다. 큰 탈것을 셀 높이에 다시 끼워 줄이지 않는다.
  E.scale = function (sheet, size) {
    return (size || 1) * config().admiralHeight / sheet.admiralReferenceHeight;
  };
  E.draw = function (ctx, u) {
    if (config().enabled === false || (G.FX && G.FX.sprites && G.FX.sprites.party === false) || !spec((u.mount && u.mount.id) || 'walk')) return false;
    var chosen = E.sample(u), im = chosen && picture(chosen.sheet);
    if (!im) return false;
    var cell = chosen.sheet.cells[chosen.index];
    if (!cell) return false;
    var m = spec(chosen.id), p = u.pts[0];
    var s = u.size || (G.FX && G.FX.party && G.FX.party.size) || 1;
    var k = E.scale(chosen.sheet, s);
    if (u.ring && G.Party.ring) G.Party.ring(ctx, p[0], p[1], chosen.heading, u.moving && !u.camping, u.t || 0, s);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.translate(p[0], p[1]);
    if (chosen.flip) ctx.scale(-1, 1);
    ctx.drawImage(im, cell[0], cell[1], cell[2], cell[3], -cell[4] * k, -cell[5] * k, cell[2] * k, cell[3] * k);
    ctx.restore();
    return [{ x: p[0], y: p[1], m: { t: m.kind || 'person' } }];
  };
  if (G.Party) {
    var previousDraw = G.Party.draw, previousPreload = G.Party.preloadSprites;
    G.Party.draw = function (ctx, u) { return E.draw(ctx, u) || previousDraw(ctx, u); };
    G.Party.preloadSprites = function (id) { E.preload(id); if (previousPreload) previousPreload(id); };
  }
})(window.G = window.G || {});
