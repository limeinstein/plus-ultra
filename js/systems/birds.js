/* 조류 재관찰: 발견 자리로 돌아오면 무리가 지나간다. 날짜·보상은 저장하고 연출만 따로 둔다. */
(function (G) {
  'use strict';
  var B = G.Birds = {}, U = G.U, owner, inside = {}, flocks = [], canvas;
  B.kinds = {
    frigatebird: 'fly', albatross: 'fly', paradise: 'fly', flamingo: 'fly', roc: 'fly',
    ploverbird: 'fly', peacock: 'fly', vinousbird: 'fly', crane: 'fly', eagle: 'fly',
    falcon: 'fly', mallard: 'fly', stork: 'fly', parrot: 'fly', turkey: 'fly',
    phoenix: 'fly', budgie: 'fly', condor: 'fly', hummingbird: 'fly',
    snowyowl: 'fly', bncrane: 'fly', hornbill: 'fly', sacredibis: 'fly', baldeagle: 'fly', toucan: 'fly', phoenixw: 'fly',
    penguin: 'swim', magellanpenguin: 'swim', emperorpenguin: 'swim', ostrich: 'run', kiwi: 'run', emu: 'run', roadrunner: 'run'
  };
  function S() { return G.Game && G.Game.state; }
  function rules() { return G.BALANCE.birdRevisit; }
  function fx() { return G.FX.birds; }
  function reset() { if (owner !== S()) { owner = S(); inside = {}; flocks = []; } }
  B.isBird = function (d) { return !!(d && d.cat === 'creature' && B.kinds[d.id]); };
  function place(d, st) {
    return st.birdPlace || { lon: d.lon, lat: d.lat, mode: d.how === 'city' ? 'city' : d.how === 'special' ? 'sea' : d.how, city: d.city };
  }
  function near(d, st, loc) {
    var p = place(d, st);
    if (p.mode === 'city') return loc.mode === 'city' && loc.city === p.city;
    return loc.mode === p.mode && G.Geo.dist(loc.lon, loc.lat, p.lon, p.lat) <= rules().radius;
  }
  B.dueDate = function (st) {
    var n = st.birdSeen || st.found, y = Math.floor(n / 10000) + rules().years;
    var m = Math.floor(n / 100) % 100, d = n % 100;
    return U.dateNum({ y: y, m: m, d: Math.min(d, U.daysInMonth(y, m)) });
  };
  B.reward = function (d, st) {
    // 옛 저장에는 최초 명성이 없으므로 현재 능력으로 보통 발견 때의 몫을 어림한다.
    var base = st.birdFame == null ? Math.round(G.Disc.fameFor(d) * (st.rival ? 0.45 : 0.75) * G.Disc.artBonus(d)) : st.birdFame;
    return Math.round(base * rules().fameK);
  };
  function image(id) {
    var key = G.Img.pick(['effects/birds/' + id]);
    if (!key) return null;
    var img = G.Img.get(key); if (!img) G.Img.want(key);
    return img;
  }
  function surface(lon, lat, land) { return G.Geo.isLand(lon, lat) === land; }
  function surfacePoint(lon, lat, land) {
    if (surface(lon, lat, land)) return [lon, lat];
    var c = fx();
    for (var r = c.groundStep; r <= c.surfaceSearch; r += c.groundStep) {
      for (var i = 0; i < c.surfaceAngles; i++) {
        var a = i * Math.PI * 2 / c.surfaceAngles, x = lon + Math.cos(a) * r, y = lat + Math.sin(a) * r;
        if (surface(x, y, land)) return [x, y];
      }
    }
    return null;
  }
  /** 달리기는 땅, 헤엄은 물을 따라 간다. 해안에서 멈추거나 방향을 바꾼다. */
  B.groundPath = function (p, kind, member) {
    var c = fx(), land = kind === 'run';
    var q = surfacePoint(p.lon + (member % 3) * c.groundSpacing, p.lat + Math.floor(member / 3) * c.groundSpacing, land);
    if (!q) return [];
    var path = [q], heading = 0;
    for (var n = 0; n < c.groundSteps; n++) {
      var found = null;
      for (var k = 0; k < c.surfaceAngles; k++) {
        var angle = heading + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * Math.PI * 2 / c.surfaceAngles;
        var x = q[0] + Math.cos(angle) * c.groundStep, y = q[1] + Math.sin(angle) * c.groundStep;
        if (surface(x, y, land)) { found = [x, y]; heading = angle; break; }
      }
      if (found) q = found;
      path.push(q);
    }
    return path;
  };
  B.show = function (d, st) {
    reset();
    image(d.id);
    var rng = U.makeRng(U.strHash(d.id) + U.dateNum(S().date)), members = [], c = fx();
    for (var i = 0; i < c.count; i++) members.push({ delay: rng() * c.stagger, phase: Math.floor(rng() * 8),
      x: (i % 3) * c.spacing, y: Math.floor(i / 3) * c.spacing * 0.55 + (rng() - 0.5) * c.spacing,
      scale: 0.75 + rng() * 0.5, flap: 0.8 + rng() * 0.4,
      path: B.kinds[d.id] === 'fly' ? null : B.groundPath(place(d, st), B.kinds[d.id], i) });
    flocks.push({ id: d.id, kind: B.kinds[d.id], place: place(d, st), t: 0, members: members, mode: S().loc.mode });
  };
  B.record = function (d, fame) {
    if (!B.isBird(d)) return;
    reset(); var s = S(), st = s.disc[d.id], l = s.loc;
    st.birdFame = fame; st.birdSeen = st.found;
    st.birdPlace = { lon: l.lon, lat: l.lat, mode: l.mode, city: l.city };
    image(d.id); // 발견 대화를 읽는 동안 시트를 미리 받는다.
    inside[d.id] = true;
  };
  B.onFind = function (d) { if (B.isBird(d)) B.show(d, S().disc[d.id]); };
  B.check = function () {
    reset(); var s = S(); if (!s || !s.loc) return [];
    var got = [], now = U.dateNum(s.date);
    Object.keys(B.kinds).forEach(function (id) {
      var d = G.DISC[id], st = s.disc[id]; if (!d || !st || !st.me || !st.found) return;
      var here = near(d, st, s.loc), entered = here && !inside[id]; inside[id] = here;
      if (!entered || now < B.dueDate(st)) return;
      var fame = B.reward(d, st); st.birdSeen = now;  // 보상보다 먼저 기록하여 재진입·저장 시 중복을 막는다.
      G.Fame.add('ex', fame); B.show(d, st); got.push({ id: id, fame: fame });
      var action = B.kinds[id] === 'fly' ? '하늘을 나는' : B.kinds[id] === 'run' ? '달리는' : '헤엄치는';
      var line = d.name + ' 무리가 ' + action + ' 모습을 다시 관찰했다. 탐험 명성 +' + fame;
      G.State.log(line); G.UI.toast(line + ' · 다음 관찰 보상은 ' + rules().years + '년 뒤', 'compass', 5500);
    });
    if (got.length && G.Game.refreshHud) G.Game.refreshHud();
    return got;
  };
  B.draw = function (ctx, project, mode) {
    var c = fx();
    flocks.forEach(function (f) {
      if (f.mode !== mode) return;
      var img = image(f.id); if (!img) return;
      var p = project(f.place.lon, f.place.lat), cw = img.width / 4, ch = img.height / 2;
      f.members.forEach(function (b) {
        var t = f.t - b.delay; if (t < 0 || t > c.duration) return;
        var u = t / c.duration, fly = f.kind === 'fly';
        var x = p[0] - c.travel * 0.3 + u * c.travel - b.x;
        var y = p[1] + (fly ? -c.height - Math.sin(u * Math.PI) * c.arc : c.groundOffset) + b.y;
        var flip = false;
        if (!fly && mode !== 'city') {
          if (!b.path || !b.path.length) return;
          var at = u * (b.path.length - 1), ai = Math.floor(at), a = b.path[ai], z = b.path[Math.min(ai + 1, b.path.length - 1)];
          var mix = at - ai, gx = a[0] + (z[0] - a[0]) * mix, gy = a[1] + (z[1] - a[1]) * mix;
          if (!surface(gx, gy, f.kind === 'run')) { gx = a[0]; gy = a[1]; }
          var gp = project(gx, gy); x = gp[0]; y = gp[1]; flip = z[0] < a[0];
        }
        var w = c.size * b.scale * ((c.sizeById && c.sizeById[f.id]) || 1), h = w * ch / cw;
        var frameMs = (c.frameById && c.frameById[f.id]) || c.frameMs;
        var frame = (b.phase + Math.floor(t * 1000 / (frameMs * b.flap))) % 8;
        ctx.save(); ctx.globalAlpha = Math.min(1, t / c.fade, (c.duration - t) / c.fade);
        ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
        ctx.drawImage(img, (frame % 4) * cw, Math.floor(frame / 4) * ch, cw, ch, -w / 2, -h / 2, w, h);
        ctx.restore();
      });
    });
  };
  B.update = function (dt) {
    reset(); var s = S(), mode = G.Game.sceneName, visible = s && s.loc && /^(sea|land|city)$/.test(mode);
    if (!canvas) {
      var ui = document.getElementById('ui'); if (!ui) return;
      canvas = document.createElement('canvas'); canvas.id = 'bird-flocks'; canvas.width = 1600; canvas.height = 900;
      canvas.style.cssText = 'width:1600px;height:900px;pointer-events:none'; ui.parentNode.insertBefore(canvas, ui);
    }
    var ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, 1600, 900);
    canvas.style.display = visible ? 'block' : 'none';
    if (!visible) { flocks = []; return; }
    var blocked = G.UI.busy() || (G.Loader && G.Loader.shown()) || (mode === 'city' && G.Town.active() && G.Town.hidden());
    if (blocked) return; // 발견 카드·건물 안에서는 기다렸다가 현장 화면에서 보여 준다.
    B.check();
    var project = mode === 'sea' ? G.Scenes.sea.toScreen : mode === 'land' ? G.Scenes.land.toScreen : function () { return [620, 420]; };
    B.draw(ctx, project, mode);
    flocks.forEach(function (f) { if (image(f.id)) f.t += dt; });
    flocks = flocks.filter(function (f) { return f.t <= fx().duration + fx().stagger && f.mode === mode; });
  };
})(window.G = window.G || {});
