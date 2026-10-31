/* 탐험대 동료의 경로 추종. 각자 걷고 돌아서며 넓은 곳에서 느슨한 다이아 대열을 이룬다. */
(function (G) {
  'use strict';
  var F = G.ExpeditionFormation = {}, TAU = Math.PI * 2;
  function cfg() { return (G.FX && G.FX.sprites && G.FX.sprites.expedition && G.FX.sprites.expedition.formation) || {}; }
  function sheets() { return (G.EXPEDITION_FOLLOWERS || {}).sheets || {}; }
  function crewSheets() { return (G.EXPEDITION_CREW || {}).sheets || {}; }
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
        // 각 자리는 대원을 대표하는 표시다. 큰 탈것도 도보 호위와 섞지 않는다.
        role = kind;
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
    list.forEach(function (kind) {
      ['female_', 'captain_'].forEach(function (prefix) { var s = crewSheets()[prefix + kind]; if (s && G.Img) G.Img.want(s.key); });
    });
    // 짐꾼 원화는 두 사람이므로 제독은 단독 도보 원화를 미리 준비한다.
    if (id === 'porter' && G.ExpeditionMotion) G.ExpeditionMotion.preload('walk');
  };
  F.ready = function (id) { return !!image(id); };
  F.crewReady = function () { return Object.keys(crewSheets()).every(function (id) { var s = crewSheets()[id]; G.Img.want(s.key); return !!G.Img.get(s.key); }); };
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
  function angle(a) { return mod(a + Math.PI, TAU) - Math.PI; }
  function approach(a, b, step) { return a + Math.max(-step, Math.min(step, b - a)); }
  /** 카메라가 움직여도 대원의 위치는 지도 위에 남는다. 새 저장 필드는 만들지 않는다. */
  F.follow = function (u, chosen, size) {
    var c = cfg(), fc = c.follow, cache = u.cache || {}, space = u.follow;
    var zoom = space ? space.zoom : 1, root = space ? { x: space.x, y: space.y } : { x: u.pts[0][0], y: u.pts[0][1] };
    var roles = F.roles(u), key = roles.join(':') + ':' + (space ? 'map' : 'screen'), time = Number(u.t) || 0;
    var state = cache.formation, scale = size * ((G.FX && G.FX.party && G.FX.party.spacing) || 1);
    var gap = (c.gaps || {})[(u.mount && u.mount.id) || 'walk'] || c.gaps.walk;
    var back = gap[0] * scale / zoom, side = gap[1] * scale / zoom;
    function toScreen(p) { return { x: u.pts[0][0] + (p.x - root.x) * zoom, y: u.pts[0][1] + (p.y - root.y) * zoom }; }
    function stand(p) { var q = toScreen(p); return !u.canStand || u.canStand(q.x, q.y); }
    function clear(a, b) {
      if (!u.canStand) return true;
      var n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * zoom / fc.groundStep));
      for (var i = 1; i <= n; i++) if (!stand({ x: a.x + (b.x - a.x) * i / n, y: a.y + (b.y - a.y) * i / n })) return false;
      return true;
    }
    if (state && state.members && space) {
      var dx = root.x - state.inputX;
      if (space.wrap) dx -= Math.round(dx / space.wrap) * space.wrap;
      root.x = state.root.x + dx;
    }
    var jumped = state && state.members && Math.hypot(root.x - state.root.x, root.y - state.root.y) * zoom > fc.teleportPx * size;
    if (!state || !state.members || state.key !== key || time < state.time || jumped) {
      var initial = F.constrain(F.layout(u, chosen.heading, size), u, size);
      state = cache.formation = { key: key, time: time, root: root, inputX: space ? space.x : root.x, speed: 0, width: 1, travelled: 0, trail: [[root.x, root.y]], members: [] };
      // 기존 발자국이 있으면 화면에 들어온 직후에도 실제로 걸었던 땅에서 시작한다.
      u.pts.slice(1).forEach(function (p) { state.trail.push([root.x + (p[0] - u.pts[0][0]) / zoom, root.y + (p[1] - u.pts[0][1]) / zoom]); });
      if (state.trail.length === 1) {
        // 출발 직후 빈 이력 때문에 동료들이 모두 선장 자리로 몰리지 않게 한다.
        for (var d = fc.groundStep * size / zoom; d <= back * fc.lineSlots[roles.length - 1]; d += fc.groundStep * size / zoom) {
          var seed = { x: root.x - Math.cos(chosen.heading) * d, y: root.y + Math.sin(chosen.heading) * d };
          var tail = state.trail[state.trail.length - 1];
          if (!clear({ x: tail[0], y: tail[1] }, seed)) break;
          state.trail.push([seed.x, seed.y]);
        }
      }
      initial.forEach(function (it) {
        var p = { x: root.x + (it.x - u.pts[0][0]) / zoom, y: root.y + (it.y - u.pts[0][1]) / zoom };
        state.members[it.index] = { x: p.x, y: p.y, goal: { x: p.x, y: p.y }, speed: 0, heading: it.heading,
          phase: chosen.phase + ((c.phaseOffsets || [])[it.index] || 0), moving: false };
      });
    }
    var dt = Math.max(0, Math.min(fc.maxDelta, time - state.time));
    var moved = Math.hypot(root.x - state.root.x, root.y - state.root.y) * zoom;
    state.time = time; state.inputX = space ? space.x : root.x; state.root = root;
    state.travelled += moved;
    if (dt > 0) state.speed += ((moved / dt) - state.speed) * (1 - Math.exp(-fc.speedSmooth * dt));
    var first = state.trail[0];
    if (Math.hypot(root.x - first[0], root.y - first[1]) * zoom >= fc.trailStep) {
      state.trail.unshift([root.x, root.y]); if (state.trail.length > fc.trailPoints) state.trail.length = fc.trailPoints;
    }
    var trail = [[root.x, root.y]].concat(state.trail);
    // 지나온 길 밖으로 현재 방향을 연장하지 않는다. 회전 때 대열이 휘둘리는 일을 막는다.
    function at(distance) {
      var remaining = distance;
      for (var i = 1; i < trail.length; i++) {
        var a = trail[i - 1], b = trail[i], len = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (len < 1e-8) continue;
        if (remaining <= len) return { x: a[0] + (b[0] - a[0]) * remaining / len, y: a[1] + (b[1] - a[1]) * remaining / len, dx: (a[0] - b[0]) / len, dy: (a[1] - b[1]) / len };
        remaining -= len;
      }
      var p = trail[trail.length - 1]; return { x: p[0], y: p[1], dx: Math.cos(chosen.heading), dy: -Math.sin(chosen.heading) };
    }
    if (moved > 0 && dt > 0) {
      var near = at(back), far = at(back * 2), bend = Math.abs(angle(Math.atan2(-near.dy, near.dx) - Math.atan2(-far.dy, far.dx)));
      bend = Math.max(bend, Math.abs(angle(chosen.heading - Math.atan2(-near.dy, near.dx))));
      var width = Math.max(0, 1 - bend / fc.bendAngle);
      // 굽은 길·물가에서는 일렬에 가까워지고, 곧고 넓은 길에서 서서히 벌어진다.
      for (var j = 1; j < roles.length; j++) {
        var q = at(back * fc.backSlots[j]), lateral = side * fc.sideSlots[j];
        var wide = { x: q.x - q.dy * lateral, y: q.y + q.dx * lateral * c.lateralY };
        if (!stand(wide) || !clear(q, wide)) width = 0;
      }
      state.width += (width - state.width) * (1 - Math.exp(-dt * (width < state.width ? fc.closeRate : fc.openRate)));
      for (var j = 1; j < roles.length; j++) {
        var delay = fc.lineSlots[j] + (fc.backSlots[j] - fc.lineSlots[j]) * state.width;
        var q = at(back * delay), lateral = roles.length === 2 ? 0 : side * fc.sideSlots[j] * state.width;
        var goal = { x: q.x - q.dy * lateral, y: q.y + q.dx * lateral * c.lateralY };
        state.members[j].goal = stand(goal) && clear(q, goal) ? goal : { x: q.x, y: q.y };
        state.members[j].pathHeading = Math.atan2(-q.dy, q.dx);
        state.members[j].arrived = false;
      }
    }
    state.members[0].x = root.x; state.members[0].y = root.y;
    state.members[0].heading = chosen.heading; state.members[0].phase = chosen.phase; state.members[0].moving = !!u.moving;
    var separation = Math.max(fc.separation * size, gap[0] * scale * fc.separationGap) / zoom;
    state.members.slice(1).forEach(function (m, i) {
      if (!space && !state.travelled) {
        if (u.moving) m.phase = chosen.phase + ((c.phaseOffsets || [])[i + 1] || 0);
        m.moving = !!u.moving; return;
      }
      if (!dt) return;
      if (m.arrived) { m.speed = 0; m.moving = false; return; }
      var goal = m.goal, distance = Math.hypot(goal.x - m.x, goal.y - m.y), stop = fc.stopDistance * size / zoom;
      if (!clear(m, goal)) {
        // 안전하게 갈 수 있는 앞쪽 발자국으로 향한다. 물 건너로 옆걸음치지 않는다.
        var best = null;
        trail.forEach(function (p) {
          var q = { x: p[0], y: p[1] }, d = Math.hypot(q.x - m.x, q.y - m.y);
          if (d < stop || d * zoom > fc.lookAhead * size || !clear(m, q)) return;
          var score = Math.hypot(q.x - goal.x, q.y - goal.y) + d * 0.25;
          if (!best || score < best.score) best = { x: q.x, y: q.y, score: score };
        });
        if (best) goal = best; else { m.speed = 0; m.moving = false; return; }
      }
      distance = Math.hypot(goal.x - m.x, goal.y - m.y);
      var vx = goal.x - m.x, vy = goal.y - m.y;
      var len = Math.hypot(vx, vy); if (len > 1e-8) { vx /= len; vy /= len; }
      state.members.forEach(function (other) {
        if (m === other) return;
        var dx = m.x - other.x, dy = m.y - other.y, d = Math.hypot(dx, dy);
        if (d > 1e-6 && d < separation) { var push = (1 - d / separation) * fc.separationWeight; vx += dx / d * push; vy += dy / d * push; }
      });
      var targetHeading = Math.atan2(-vy, vx), diff = angle(targetHeading - m.heading);
      var maxSpeed = Math.max(fc.minSpeed * size, state.speed * fc.catchup + fc.catchupExtra * size);
      var desired = distance > stop ? Math.min(maxSpeed, distance * zoom / fc.arrivalSeconds) : 0;
      // 줄을 좁히려고 뒤로 돌아가 자리를 맞추지 않는다. 간격이 생길 때까지 기다린다.
      if (m.pathHeading != null && Math.abs(angle(m.pathHeading - m.heading)) < Math.PI / 2 &&
          (goal.x - m.x) * Math.cos(m.pathHeading) - (goal.y - m.y) * Math.sin(m.pathHeading) < -stop) desired = 0;
      var previousHeading = m.heading;
      if (desired > 0) m.heading = angle(m.heading + Math.max(-fc.turnRate * dt, Math.min(fc.turnRate * dt, diff)));
      m.speed = approach(m.speed, desired, fc.acceleration * size * dt);
      // 가려는 쪽으로 돌아선 뒤 걷는다. 뒤나 옆으로 미끄러지지 않게 한다.
      var advance = Math.min(distance, m.speed * dt / zoom) * Math.max(0, Math.cos(angle(targetHeading - m.heading)));
      var next = { x: m.x + Math.cos(m.heading) * advance, y: m.y - Math.sin(m.heading) * advance };
      if (distance <= stop || !clear(m, next)) advance = 0;
      if (advance > 0) {
        m.x = next.x; m.y = next.y;
        var stride = (fc.strides[roles[i + 1]] || fc.strides.foot) * size;
        m.phase += Math.min(advance * zoom / stride, ((G.FX && G.FX.party && G.FX.party.maxStepHz) || 2.2) * dt);
      }
      m.moving = advance * zoom > 0.01;
      if (!desired) { m.speed = 0; m.heading = previousHeading; m.arrived = true; }
    });
    return roles.map(function (role, i) {
      var m = state.members[i], p = toScreen(m);
      return { index: i, role: role, leader: i === 0, gender: i === 3 ? 'f' : 'm', x: p.x, y: p.y, heading: m.heading, phase: m.phase, moving: m.moving,
        worldX: m.x, worldY: m.y, m: { t: role === 'foot' || role === 'porter' ? 'person' : 'beast' } };
    });
  };
  function drawCell(ctx, im, cell, x, y, k, flip) {
    ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
    ctx.drawImage(im, cell[0], cell[1], cell[2], cell[3], -cell[4] * k, -cell[5] * k, cell[2] * k, cell[3] * k);
    ctx.restore();
  }
  F.draw = function (ctx, u, chosen, captainImage) {
    if (cfg().enabled === false || chosen.action === 'camp') return false;
    var s = u.size || (G.FX && G.FX.party && G.FX.party.size) || 1, items = F.follow(u, chosen, s);
    if (G.ExpeditionTracks) { G.ExpeditionTracks.update(u, items, s); G.ExpeditionTracks.draw(ctx, u); }
    if (u.ring && G.Party.ring) G.Party.ring(ctx, u.pts[0][0], u.pts[0][1], chosen.heading, u.moving, u.t || 0, s);
    items.forEach(function (it) {
      var target = it.heading;
      var kind = it.leader ? variant(u) : it.role;
      var appearance = it.leader ? 'captain_' + kind : it.gender === 'f' ? 'female_' + kind : null;
      var sheet = appearance && crewSheets()[appearance];
      // 아직 전용 제독·여성 원화가 없는 이동 수단은 같은 이동 수단의 공용 원화를 쓴다.
      // 이전 동작 시트로 내려가면 짐꾼·마차처럼 자세와 크기가 다른 역할이 순간적으로 바뀐다.
      if (!sheet) {
        sheet = crewSheets()['male_' + kind] || sheets()[kind];
        if (sheet) appearance = crewSheets()['male_' + kind] ? 'male_' + kind : null;
      }
      var im = sheet && G.Img.get(sheet.key); if (!im && sheet && G.Img.has(sheet.key)) G.Img.want(sheet.key);
      // 의상 변형이 로딩 중이어도 같은 동물의 크기와 자세는 유지한다.
      if (!im && it.leader && kind !== 'foot' && kind !== 'porter') {
        var sameMount = crewSheets()['male_' + kind] || sheets()[kind];
        if (sameMount) { var sameImage = G.Img.get(sameMount.key); if (sameImage) { sheet = sameMount; im = sameImage; appearance = 'male_' + kind; } }
      }
      if (im) {
        var dir = mod(Math.round((Math.PI / 2 - target) / (Math.PI / 4)), 8);
        var directionRow = sheet.directionRows ? sheet.directionRows[dir] : [dir, false], row = directionRow[0];
        var frame = mod(Math.floor(it.phase * 4), 4);
        it.sheet = sheet; it.im = im; it.cell = sheet.cells[row * 4 + frame]; it.frame = frame; it.row = row; it.flip = directionRow[1];
        it.scale = s * sheet.targetHeight / ((sheet.rowHeights || [])[row] || sheet.bodyHeight);
        it.appearance = appearance || 'male_' + kind;
      } else {
        // 파일이 늦거나 없어도 편대는 남긴다. 같은 탈것의 기존 원화를 안전하게 쓴다.
        var fallbackId = kind === 'foot' || kind === 'porter' && it.leader ? 'walk' : kind === 'camel2' ? 'camel' : kind === 'oxwagon' ? 'wagon' : kind;
        var fallback = it.leader && kind !== 'porter' ? chosen : G.ExpeditionMotion.sample({ mount: { id: fallbackId }, head: target, moving: it.moving, phase: it.phase, t: u.t || 0, cache: {} });
        var base = fallback && fallback.sheet, oldImage = base && G.Img.get(base.key);
        if (!oldImage) { fallback = chosen; base = chosen.sheet; oldImage = captainImage; }
        it.sheet = base; it.im = oldImage; it.cell = base.cells[fallback.index]; it.flip = fallback.flip;
        it.scale = G.ExpeditionMotion.scale(base, s); it.fallback = !it.leader;
      }
    });
    // 땅에서 뒤쪽인 대원부터 그려 앞뒤 가림을 맞춘다.
    items.sort(function (a, b) { return a.y - b.y || a.index - b.index; });
    items.forEach(function (it) { drawCell(ctx, it.im, it.cell, it.x, it.y, it.scale, it.flip); });
    return items;
  };
})(window.G = window.G || {});
