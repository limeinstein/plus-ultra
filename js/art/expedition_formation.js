/* 탐험대 다이아 편대. 지나온 길과 화면 좌표만 쓰며 이동 규칙·저장 자료는 바꾸지 않는다. */
(function (G) {
  'use strict';
  var F = G.ExpeditionFormation = {}, TAU = Math.PI * 2;
  function cfg() { return (G.FX && G.FX.sprites && G.FX.sprites.expedition && G.FX.sprites.expedition.formation) || {}; }
  function sheets() { return (G.EXPEDITION_FOLLOWERS || {}).sheets || {}; }
  function mod(n, d) { return ((n % d) + d) % d; }
  function image(id) {
    var s = sheets()[id], I = G.Img;
    if (!s || !I) return null;
    var im = I.get(s.key); if (!im && I.has(s.key)) I.want(s.key);
    return im;
  }
  function variant(u) {
    var mt = u.mount || {}, id = mt.id || 'walk';
    if (id === 'walk') return 'foot';
    if (id === 'camel' && ['st', 'pe', 'cn'].indexOf(u.region || mt.style) >= 0) return 'camel2';
    if (id === 'wagon' && (u.draft || mt.draft) === 'ox') return 'oxwagon';
    return id;
  }
  F.variant = variant;
  /** 표시 수는 선장 포함 최대 네 명. 대원이 적으면 없는 사람을 만들지 않는다. */
  F.count = function (party) { return Math.max(1, Math.min(cfg().maxMembers || 4, Math.floor(Number(party) || 1))); };
  F.roles = function (u) {
    var id = (u.mount && u.mount.id) || 'walk', kind = variant(u), n = Math.max(0, Number(u.mount && u.mount.n) || 0);
    var count = F.count(u.party), out = ['captain'];
    // 기존 원화에 없는 지역별 탈것은 선장 자리에도 맞는 마구를 쓴다.
    if (kind === 'oxwagon' || kind === 'camel2') out[0] = kind;
    for (var i = 1; i < count; i++) {
      var role = 'foot';
      if (id === 'walk') role = 'foot';
      else if (id === 'porter') role = i <= n ? 'porter' : 'foot';
      else if (['wagon', 'elephant', 'reindeer'].indexOf(id) >= 0) {
        // 큰 수레·썰매·코끼리는 후미에 두고 좌우에는 걸어서 호위한다.
        role = i === count - 1 && n > 1 ? kind : 'foot';
      } else if (i < n) role = kind;
      out.push(role);
    }
    return out;
  };
  F.preload = function (id) {
    var list = ['foot', id === 'walk' ? 'foot' : id || 'foot'];
    if (id === 'camel') list.push('camel2');
    if (id === 'wagon') list.push('oxwagon');
    list.forEach(image);
  };
  F.ready = function (id) { return !!image(id); };
  function along(pts, distance, heading) {
    var acc = 0;
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], len = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (len < 0.001) continue;
      if (acc + len >= distance) {
        var t = (distance - acc) / len;
        return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, dx: (a[0] - b[0]) / len, dy: (a[1] - b[1]) / len };
      }
      acc += len;
    }
    var p = pts[pts.length - 1], dx = Math.cos(heading), dy = -Math.sin(heading);
    return { x: p[0] - dx * (distance - acc), y: p[1] - dy * (distance - acc), dx: dx, dy: dy };
  }
  /** 선장 → 좌우 두 명 → 후미 한 명. 커브에서는 해당 대원이 밟은 길의 방향을 따른다. */
  F.layout = function (u, heading, size) {
    var c = cfg(), id = (u.mount && u.mount.id) || 'walk', gap = (c.gaps || {})[id] || [44, 34];
    var k = size * ((G.FX && G.FX.party && G.FX.party.spacing) || 1), roles = F.roles(u), out = [];
    var back = gap[0] * k, side = gap[1] * k, slots = [[0, 0], [1, -1], [1, 1], [2, 0]];
    // 두 명일 때는 대각선 한쪽으로 벌어지지 않고 선장 바로 뒤를 따른다.
    if (roles.length === 2) slots = [[0, 0], [1, 0]];
    roles.forEach(function (role, i) {
      var slot = slots[i], q = i ? along(u.pts, slot[0] * back, heading) : { x: u.pts[0][0], y: u.pts[0][1], dx: Math.cos(heading), dy: -Math.sin(heading) };
      var lateral = slot[1] * side;
      out.push({ index: i, role: role, leader: i === 0, x: q.x - q.dy * lateral, y: q.y + q.dx * lateral * (c.lateralY || 0.72), heading: i ? Math.atan2(-q.dy, q.dx) : heading, m: { t: role === 'foot' || role === 'porter' ? 'person' : 'beast' } });
    });
    return out;
  };
  // 물가에서는 발밑이 땅인 가까운 자리로 비켜 선다. 넓은 땅의 다이아 편대는 그대로 둔다.
  F.constrain = function (items, u, size) {
    if (!u.canStand) return items;
    var c = cfg(), leader = items[0], angles = c.groundAngles || 24;
    var radii = c.groundRadii || [1, 0.85, 0.7, 0.55, 0.4, 0.25, 0.1];
    var minGap = (c.groundMinGap || 20) * size;
    items.slice(1).forEach(function (it) {
      if (u.canStand(it.x, it.y)) return;
      var dx = it.x - leader.x, dy = it.y - leader.y, radius = Math.hypot(dx, dy), best = null;
      radii.forEach(function (r) {
        for (var a = 0; a < angles; a++) {
          var ang = Math.atan2(dy, dx) + a * TAU / angles;
          var x = leader.x + Math.cos(ang) * radius * r, y = leader.y + Math.sin(ang) * radius * r;
          if (!u.canStand(x, y)) continue;
          var clear = items.every(function (other) { return other === it || Math.hypot(x - other.x, y - other.y) >= minGap; });
          var score = Math.hypot(x - it.x, y - it.y) + (clear ? 0 : radius * 10);
          if (!best || score < best.score) best = { x: x, y: y, score: score };
        }
      });
      if (best) { it.x = best.x; it.y = best.y; it.constrained = true; }
      else { it.x = leader.x; it.y = leader.y; it.constrained = true; }
    });
    return items;
  };
  function drawCell(ctx, im, cell, x, y, k, flip) {
    ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
    ctx.drawImage(im, cell[0], cell[1], cell[2], cell[3], -cell[4] * k, -cell[5] * k, cell[2] * k, cell[3] * k);
    ctx.restore();
  }
  F.draw = function (ctx, u, chosen, captainImage) {
    if (cfg().enabled === false || chosen.action === 'camp' || (F.count(u.party) < 2 && F.roles(u)[0] === 'captain')) return false;
    var s = u.size || (G.FX && G.FX.party && G.FX.party.size) || 1, items = F.constrain(F.layout(u, chosen.heading, s), u, s), c = cfg();
    var cache = u.cache || {}, state = cache.formation;
    if (!state || state.time > (u.t || 0) || state.id !== chosen.id) state = cache.formation = { id: chosen.id, time: u.t || 0, headings: [] };
    var dt = Math.max(0, Math.min(0.1, (u.t || 0) - state.time)); state.time = u.t || 0;
    if (u.ring && G.Party.ring) G.Party.ring(ctx, u.pts[0][0], u.pts[0][1], chosen.heading, u.moving, u.t || 0, s);
    items.forEach(function (it) {
      var old = state.headings[it.index], target = it.heading;
      if (old != null) { var delta = mod(target - old + Math.PI, TAU) - Math.PI, step = (c.turnRate || 4.8) * dt; target = old + Math.max(-step, Math.min(step, delta)); }
      state.headings[it.index] = target; it.heading = target;
      var sheet = sheets()[it.role], im = sheet && image(it.role);
      if (im) {
        var dir = mod(Math.round((Math.PI / 2 - target) / (Math.PI / 4)), 8);
        var directionRow = sheet.directionRows ? sheet.directionRows[dir] : [dir, false], row = directionRow[0];
        var phase = chosen.phase + ((c.phaseOffsets || [0, 0.21, 0.48, 0.73])[it.index] || 0);
        var frame = mod(Math.floor(phase * 4), 4);
        it.sheet = sheet; it.im = im; it.cell = sheet.cells[row * 4 + frame]; it.frame = frame; it.row = row; it.flip = directionRow[1];
        it.scale = s * sheet.targetHeight / sheet.bodyHeight;
      } else {
        // 파일이 늦거나 없어도 편대는 남긴다. 같은 탈것의 기존 원화를 안전하게 쓴다.
        var fallbackId = it.role === 'foot' ? 'walk' : it.role === 'camel2' ? 'camel' : it.role === 'oxwagon' ? 'wagon' : it.role;
        var fallback = it.role === 'captain' ? chosen : G.ExpeditionMotion.sample({ mount: { id: fallbackId }, head: target, moving: true, phase: chosen.phase, t: u.t || 0, cache: {} });
        var base = fallback && fallback.sheet, oldImage = base && G.Img.get(base.key);
        if (!oldImage) { fallback = chosen; base = chosen.sheet; oldImage = captainImage; }
        it.sheet = base; it.im = oldImage; it.cell = base.cells[fallback.index]; it.flip = fallback.flip;
        it.scale = G.ExpeditionMotion.scale(base, s); it.fallback = it.role !== 'captain';
      }
    });
    // 선장 고정 원화를 유지하고, 땅에서 뒤쪽인 대원부터 그려 앞뒤 가림을 맞춘다.
    items.sort(function (a, b) { return a.y - b.y || a.index - b.index; });
    items.forEach(function (it) { drawCell(ctx, it.im, it.cell, it.x, it.y, it.scale, it.flip); });
    return items;
  };
})(window.G = window.G || {});
