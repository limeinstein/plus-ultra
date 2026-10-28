/* 이동하는 해상 괴물의 세계 기록·항구 경고·전투 동작. 저장은 현재 게임 안에 둔다. */
(function (G) {
  'use strict';
  var M = G.SeaMonsters = {}, U = G.U, TAU = Math.PI * 2;
  function S() { return G.Game.state; }
  function K() { return G.BALANCE.seaMonsters; }
  function data(id) { return G.SEA_MONSTERS && G.SEA_MONSTERS[id]; }
  function name(id) { return G.SEA_MONSTER_ART[id].name; }
  function store() { var s = S(); return s.seaMonsters || (s.seaMonsters = { v: 1, entries: {} }); }
  M.is = function (id) { return !!data(id); };
  M.strongest = function (year) {
    var ships = G.SHIP_TYPES.filter(function (t) { return (!t.from || year >= t.from) && (!t.until || year < t.until); });
    return ships.sort(function (a, b) { return b.hp - a.hp || b.ports - a.ports; })[0];
  };
  function ports() { return G.CITY_DATA.filter(function (c) { return c.port && G.R.cityExists(c); }); }
  function water(lon, lat) {
    if (lat < -65 || lat > 72 || !G.Geo.isSea(lon, lat, K().seaMargin)) return false;
    for (var i = 0; i < 8; i++) if (!G.Geo.isSea(lon + Math.cos(i * TAU / 8) * K().openProbe, lat + Math.sin(i * TAU / 8) * K().openProbe, K().seaMargin)) return false;
    return true;
  }
  function spawn(id, old, entries) {
    var cities = ports(); if (!cities.length) return null;
    for (var i = 0; i < K().spawnTries; i++) {
      var c = U.pick(cities), dock = c.dock || [c.lat, c.lon], a = U.rf(0, TAU), r = U.rf(K().spawnNear[0], K().spawnNear[1]);
      var lon = G.Geo.wrapLon(dock[1] + Math.cos(a) * r), lat = dock[0] + Math.sin(a) * r;
      if (!water(lon, lat) || (old && G.Geo.dist(lon, lat, old.lon, old.lat) < K().spawnMove)) continue;
      if (Object.keys(entries).some(function (key) { var e = entries[key]; return key !== id && e.active && G.Geo.dist(lon, lat, e.lon, e.lat) < K().spacing; })) continue;
      return { id: id, active: true, cycle: old ? old.cycle + 1 : 1, lon: lon, lat: lat,
        born: U.clone(S().date), hp: null, maxHp: null, avoidUntil: -1, reports: {} };
    }
    return null;
  }
  M.sync = function () {
    var root = store(), now = U.dateNum(S().date);
    if (!G.Game.geoReady || root.checked === now) return root.entries;
    root.entries = root.entries || {}; root.checked = now;
    Object.keys(G.SEA_MONSTERS).forEach(function (id) {
      var old = root.entries[id];
      if (old && (old.active || !old.next || U.dateNum(old.next) > now)) return;
      var next = spawn(id, old, root.entries); if (next) root.entries[id] = next;
    });
    return root.entries;
  };
  M.near = function (lon, lat, radius) {
    var entries = M.sync();
    return Object.keys(entries).map(function (id) { return entries[id]; }).filter(function (e) {
      return e.active && G.Geo.dist(lon, lat, e.lon, e.lat) <= radius;
    }).sort(function (a, b) { return G.Geo.dist(lon, lat, a.lon, a.lat) - G.Geo.dist(lon, lat, b.lon, b.lat); });
  };
  M.contact = function () {
    var s = S(); return M.near(s.loc.lon, s.loc.lat, K().meetRange).filter(function (e) { return U.dayIndex(s.date) >= (e.avoidUntil || 0); })[0] || null;
  };
  M.news = function (c) { return M.near(c.lon, c.lat, K().newsRange); };
  M.newsText = function (c, e) {
    var angle = Math.atan2(e.lat - c.lat, G.Geo.wrapLon(e.lon - c.lon));
    return '이 항구의 ' + U.dirName(angle) + '쪽 바다에서 「' + name(e.id) + '」 목격 소식이 들린다. ' +
      (data(e.id).attack === 'charge' ? '엄청난 속도로 배를 들이받는다고 한다.' : '사방으로 물덩이와 포탄을 뿜어 배를 부순다고 한다.') + ' 물속에 숨으면 공격이 닿지 않으니 조심해야 한다.';
  };
  M.tell = async function (c, who, all) {
    var news = M.news(c), fresh = news.filter(function (e) { return !e.reports[c.id]; });
    var list = all ? news : fresh.slice(0, 1);
    for (var i = 0; i < list.length; i++) {
      var e = list[i]; await G.UI.say(M.newsText(c, e), who || {}); e.reports[c.id] = U.dateNum(S().date);
      // 소식은 단서이며 발견 확정은 실제로 마주쳤을 때만 한다.
      if (G.Disc && G.DISC[e.id]) G.Disc.addHint(e.id, 'monster:' + c.id + ':' + e.cycle);
    }
    if (all && !news.length) await G.UI.say('이 근처 바다에서 새로 목격된 괴물 소식은 없다.', who || {});
    return list.length;
  };
  M.discover = async function (e) {
    var d = G.DISC[e.id], s = S();
    if (d && !G.Disc.foundByMe(e.id)) {
      await G.Disc.find(d, 'sea');
      if (S() === s && G.Disc.foundByMe(e.id)) s.disc[e.id].monsterAt = { lon: e.lon, lat: e.lat, date: U.clone(s.date), cycle: e.cycle };
    }
  };
  M.avoid = function (e) { e.avoidUntil = U.dayIndex(S().date) + K().avoidDays; };
  M.npc = function (e) {
    return { kind: 'monster', monster: e.id, monsterCycle: e.cycle, n: 1, noPrize: true,
      center: { lon: e.lon, lat: e.lat }, label: name(e.id), place: name(e.id) + ' 출몰 해역' };
  };
  M.enemy = function (npc) {
    var t = M.strongest(S().date.y), e = M.sync()[npc.monster], max = t.hp * K().hpK;
    var hp = e && e.maxHp > 0 && e.hp != null ? Math.max(1, Math.min(max, max * e.hp / e.maxHp)) : max;
    return { type: t.id, monster: npc.monster, name: name(npc.monster), hp: hp, maxHp: max,
      crew: t.crew[1], crewMax: t.crew[1], guns: { type: 'saker', n: t.ports }, sails: t.sails.slice() };
  };
  M.decorate = function (b, src) {
    b.monster = src.monster; b.tr = []; b.monsterPhase = 'surface'; b.phaseTime = 0;
    b.attackTime = 0; b.attackCd = K().firstAttack; b.chargeStage = 'wait'; b.chargeTime = 0;
    var t = G.SHIP.baochuan;
    b.len = (58 + Math.min(1000, t.cap) / 14) * 1.5 * (t.len || 1);
  };
  M.targetable = function (b) { return !!b && b.alive && (!b.monster || b.monsterPhase === 'surface'); };
  M.phaseLabel = function (b) {
    return b.monsterPhase === 'dive' ? '잠수 중 · 공격 불가' : b.monsterPhase === 'submerged' ? '수중 은신 · 공격 불가' : b.monsterPhase === 'emerge' ? '떠오르는 중 · 공격 불가' : b.chargeStage === 'windup' ? '돌진 준비!' : b.chargeStage === 'rush' ? '돌진!' : '수면';
  };
  function distanceSegment(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, q = U.clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    return Math.hypot(px - ax - dx * q, py - ay - dy * q);
  }
  M.projectileHit = function (ball, st, dt) {
    var a = U.clamp(ball.t / ball.dur, 0, 1), z = U.clamp((ball.t + dt) / ball.dur, 0, 1);
    var ax = ball.x + (ball.tx - ball.x) * a, ay = ball.y + (ball.ty - ball.y) * a;
    var bx = ball.x + (ball.tx - ball.x) * z, by = ball.y + (ball.ty - ball.y) * z;
    return st.ships.filter(function (o) { return o.side !== ball.from.side && M.targetable(o) &&
      distanceSegment(o.x, o.y, ax, ay, bx, by) < o.len * K().hitRadiusK + K().shotRadius;
    }).sort(function (p, q) { return Math.hypot(p.x - ax, p.y - ay) - Math.hypot(q.x - ax, q.y - ay); })[0] || null;
  };
  function volley(b, st) {
    var cfg = K(), element = data(b.monster).element || 'water'; b.attackTime = G.FX.seaMonster.actions.attack.seconds; b.attackAnim = 0;
    for (var i = 0; i < cfg.rays; i++) {
      var angle = i * TAU / cfg.rays + (b.volleyN || 0) * Math.PI / cfg.rays;
      st.balls.push({ x: b.x, y: b.y, tx: b.x + Math.cos(angle) * cfg.shotRange,
        ty: b.y + Math.sin(angle) * cfg.shotRange, t: 0, dur: cfg.shotRange / cfg.shotSpeed,
        hit: false, target: null, from: b, radial: true, element: element, dmg: b.maxHp / cfg.hpK * cfg.shotHpK, kill: 1 });
    }
    b.volleyN = (b.volleyN || 0) + 1;
    if (G.Audio) G.Audio.sfx(element === 'water' ? 'splash' : 'cannon');
  }
  M.step = function (b, dt, st, api) {
    var cfg = K(), profile = data(b.monster); b.phaseTime += dt;
    var durations = { surface: cfg.surfaceSeconds, dive: cfg.diveSeconds, submerged: cfg.hiddenSeconds, emerge: cfg.emergeSeconds };
    var next = { surface: 'dive', dive: 'submerged', submerged: 'emerge', emerge: 'surface' };
    while (b.phaseTime >= durations[b.monsterPhase]) {
      b.phaseTime -= durations[b.monsterPhase]; b.monsterPhase = next[b.monsterPhase];
      b.chargeStage = 'wait'; b.chargeTime = 0;
      if (api.effect && (b.monsterPhase === 'dive' || b.monsterPhase === 'emerge')) api.effect(b.monsterPhase);
      if (b.monsterPhase === 'dive') {
        st.ships.forEach(function (o) { if (o.target === b) { o.target = null; o.boardIntent = false; } });
        api.log(b.name + U.jx(b.name, '이/가') + ' 물속으로 숨는다! 떠오를 때까지 공격할 수 없다.');
      }
    }
    b.crew = b.crew0; b.attackAnim = (b.attackAnim || 0) + dt; b.attackTime = Math.max(0, (b.attackTime || 0) - dt);
    var foes = st.ships.filter(function (o) { return o.side !== b.side && o.alive; });
    if (!foes.length) return;
    var target = foes.sort(function (a, c) { return Math.hypot(a.x - b.x, a.y - b.y) - Math.hypot(c.x - b.x, c.y - b.y); })[0];
    var angle = Math.atan2(target.y - b.y, target.x - b.x), speed = cfg.speed * (profile.speed || 1), startedRush = false;
    b.attackCd -= dt;
    if (!M.targetable(b)) { speed *= 0.5; b.attackTime = 0; }
    else if (profile.attack === 'volley') {
      if (b.attackCd <= 0) { volley(b, st); if (api.effect) api.effect('volley'); b.attackCd = cfg.volleySeconds; }
      if (Math.hypot(target.x - b.x, target.y - b.y) < cfg.standOff) angle += Math.PI / 2;
    } else {
      b.chargeTime -= dt;
      if (b.chargeStage === 'wait' && b.attackCd <= 0) {
        b.chargeStage = 'windup'; b.chargeTime = cfg.chargeWindup; b.chargeHeading = angle; b.chargeHits = []; b.chargeTarget = target;
        api.log(b.name + U.jx(b.name, '이/가') + ' 몸을 낮춘다! 돌진 방향을 피해라!');
      }
      if (b.chargeStage === 'windup') {
        // 준비하는 동안에는 같은 배의 현재 자리를 겨눈다. 출발한 뒤에는 그 방향으로 곧게 달린다.
        if (foes.indexOf(b.chargeTarget) < 0) b.chargeTarget = target;
        angle = Math.atan2(b.chargeTarget.y - b.y, b.chargeTarget.x - b.x);
        b.chargeHeading = angle; speed = 0;
        if (b.chargeTime <= 0) {
          b.chargeStage = 'rush'; b.chargeTime = cfg.chargeSeconds; b.attackTime = cfg.chargeSeconds; b.attackAnim = 0;
          b.wakeTime = 0; startedRush = true;
        }
      }
      if (b.chargeStage === 'rush') {
        angle = b.chargeHeading; speed = cfg.chargeSpeed;
        if (b.chargeTime <= 0) { b.chargeStage = 'wait'; b.attackCd = cfg.chargeRecovery; speed = cfg.speed; }
      }
    }
    if (b.chargeStage === 'rush') b.heading = angle;
    else {
      var turn = b.chargeStage === 'windup' ? cfg.chargeAimTurn : cfg.turn;
      b.heading += U.clamp(U.angDiff(b.heading, angle), -turn * dt, turn * dt);
    }
    // 몸을 돌린 뒤 물살을 내보내야 첫 물살부터 이동 방향과 맞는다.
    if (startedRush && api.effect) api.effect('rush');
    var ox = b.x, oy = b.y;
    b.vel = [Math.cos(b.heading) * speed, Math.sin(b.heading) * speed]; b.spd = speed;
    b.x += b.vel[0] * dt; b.y += b.vel[1] * dt;
    api.resolveTerrain(b, ox, oy);
    if (b.chargeStage === 'rush') {
      b.wakeTime = (b.wakeTime || 0) + dt;
      if (b.wakeTime >= G.FX.waterSplash.wakeEvery) { b.wakeTime %= G.FX.waterSplash.wakeEvery; if (api.effect) api.effect('wake'); }
    }
    var lim = api.arena * 0.8, dist = Math.hypot(b.x, b.y);
    if (dist > lim) { b.x *= lim / dist; b.y *= lim / dist; b.heading += Math.PI; b.chargeStage = 'wait'; b.attackCd = cfg.chargeRecovery; }
    if (M.targetable(b) && b.chargeStage === 'rush') foes.forEach(function (o) {
      var index = st.ships.indexOf(o);
      if (b.chargeHits.indexOf(index) >= 0 || distanceSegment(o.x, o.y, ox, oy, b.x, b.y) >= cfg.ramRadius + o.len * cfg.hitRadiusK) return;
      b.chargeHits.push(index); var dmg = b.maxHp / cfg.hpK * cfg.ramHpK * api.armor(o);
      o.hp -= dmg; api.hit(o, dmg, b); api.log(b.name + U.jx(b.name, '이/가') + ' ' + o.name + '호를 들이받았다!');
      if (o.hp <= 0) api.hullBreak(o);
    });
  };
  M.draw = function (ctx, b, x, y, time) {
    var state = b.monsterPhase === 'surface' ? ((b.attackTime || 0) > 0 ? 'attack' : b.spd > 0 ? 'swim' : 'idle') : b.monsterPhase;
    if (state === 'surface') state = 'idle';
    var elapsed = state === 'attack' ? b.attackAnim || 0 : b.phaseTime || time || 0;
    if (!b.alive) { state = 'dive'; elapsed = (b.sink || 0) * K().diveSeconds; }
    return G.SeaMonsterSprite.draw(ctx, x, y, -b.heading, b.len, { type: b.monster, state: state, elapsed: elapsed }, time);
  };
  M.drawSea = function (ctx, project, zoom, time) {
    var s = S(), near = M.near(s.loc.lon, s.loc.lat, K().sight);
    near.forEach(function (e) {
      var p = project(e.lon, e.lat), size = zoom * K().mapLen;
      G.SeaMonsterSprite.draw(ctx, p[0], p[1], Math.atan2(s.loc.lat - e.lat, G.Geo.wrapLon(s.loc.lon - e.lon)), size,
        { type: e.id, state: 'idle', elapsed: time }, time);
      ctx.save(); ctx.fillStyle = '#ffc0a5'; ctx.textAlign = 'center'; ctx.font = 'bold 17px sans-serif'; ctx.fillText(name(e.id), p[0], p[1] - size * 0.65); ctx.restore();
    });
  };
  M.afterBattle = function (npc, result, ships) {
    var root = store(), e = root.entries[npc.monster], b = ships.filter(function (x) { return x.monster === npc.monster; })[0];
    if (!e || !b || e.cycle !== npc.monsterCycle || !e.active) return;
    if (result === 'win' && b.sunk) {
      e.active = false; e.hp = 0; e.killed = U.clone(S().date);
      var date = S().date, year = date.y + data(e.id).years;
      e.next = { y: year, m: date.m, d: Math.min(date.d, U.daysInMonth(year, date.m)) };
      G.State.log(name(e.id) + U.jx(name(e.id), '을/를') + ' 무찔렀다. 다음 출몰은 ' + data(e.id).years + '년 뒤다.');
    } else { e.hp = Math.max(1, b.hp); e.maxHp = b.maxHp; M.avoid(e); }
    delete root.checked;
  };
})(window.G = window.G || {});
