/* 조류·나비 재관찰: 발견 자리로 돌아오면 무리가 지나간다. 날짜·보상은 저장하고 연출만 따로 둔다. */
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
  B.butterflies = { morpho: true, glasswing: true, monarchwinter: true, lunamoth: true, eightyeight: true,
    swallowtail: true, emeraldswallow: true, birdwing: true, sasakia: true, atlasmoth: true, deadleaf: true,
    bhutanglory: true, sunsetmoth: true, cometmoth: true, giantswallow: true, motherpearl: true, peacockbf: true };
  function S() { return G.Game && G.Game.state; }
  function rules() { return G.BALANCE.birdRevisit; }
  function fx() { return G.FX.birds; }
  function reset() { if (owner !== S()) { owner = S(); inside = {}; flocks = []; } }
  B.isBird = function (d) { return !!(d && d.cat === 'creature' && B.kinds[d.id]); };
  B.isButterfly = function (d) { return !!(d && d.cat === 'creature' && B.butterflies[d.id]); };
  B.isObservable = function (d) { return B.isBird(d) || B.isButterfly(d); };
  function kind(d) { return B.isButterfly(d) ? 'flutter' : B.kinds[d.id]; }
  function settings(d) { return B.isButterfly(d) ? G.FX.butterflies : fx(); }
  function prefix(d) { return B.isButterfly(d) ? 'butterfly' : 'bird'; }
  function between(range, rng) { return range[0] + rng() * (range[1] - range[0]); }
  function place(d, st) {
    return st.butterflyPlace || st.birdPlace || { lon: d.lon, lat: d.lat, mode: d.how === 'city' ? 'city' : d.how === 'special' ? 'sea' : d.how, city: d.city };
  }
  function near(d, st, loc) {
    var p = place(d, st);
    if (p.mode === 'city') return loc.mode === 'city' && loc.city === p.city;
    return loc.mode === p.mode && G.Geo.dist(loc.lon, loc.lat, p.lon, p.lat) <= rules().radius;
  }
  B.dueDate = function (st) {
    var n = st.butterflySeen || st.birdSeen || st.found, y = Math.floor(n / 10000) + rules().years;
    var m = Math.floor(n / 100) % 100, d = n % 100;
    return U.dateNum({ y: y, m: m, d: Math.min(d, U.daysInMonth(y, m)) });
  };
  B.reward = function (d, st) {
    // 옛 저장에는 최초 명성이 없으므로 현재 능력으로 보통 발견 때의 몫을 어림한다.
    var saved = st[prefix(d) + 'Fame'];
    var base = saved == null ? Math.round(G.Disc.fameFor(d) * (st.rival ? 0.45 : 0.75) * G.Disc.artBonus(d)) : saved;
    return Math.round(base * rules().fameK);
  };
  function image(id) {
    var key = G.Img.pick(['effects/' + (B.butterflies[id] ? 'butterflies/' : 'birds/') + id]);
    if (!key) return null;
    var img = G.Img.get(key); if (!img) G.Img.want(key);
    return img;
  }
  function surface(lon, lat, land) { return G.Geo.isLand(lon, lat) === land; }
  function surfacePoint(lon, lat, land, limit, step) {
    if (surface(lon, lat, land)) return [lon, lat];
    var c = fx();
    for (var r = step || c.groundStep; r <= (limit || c.surfaceSearch); r += step || c.groundStep) {
      for (var i = 0; i < c.surfaceAngles; i++) {
        var a = i * Math.PI * 2 / c.surfaceAngles, x = lon + Math.cos(a) * r, y = lat + Math.sin(a) * r;
        if (surface(x, y, land)) return [x, y];
      }
    }
    return null;
  }
  /** 달리기는 땅, 헤엄은 물을 따라 간다. 해안에서 멈추거나 방향을 바꾼다. */
  B.groundPath = function (p, kind, member, direction) {
    var c = fx(), land = kind === 'run';
    var q = surfacePoint(p.lon + (member % 3) * c.groundSpacing, p.lat + Math.floor(member / 3) * c.groundSpacing, land);
    if (!q) return [];
    var path = [q], heading = direction || 0;
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
  B.count = function (d, rng) {
    if (B.isButterfly(d)) {
      var range = G.FX.butterflies.count;
      return range[0] + Math.floor((rng || Math.random)() * (range[1] - range[0] + 1));
    }
    var c = fx(), special = c.countById && c.countById[d.id];
    if (special != null) return special;
    if (B.kinds[d.id] === 'run') return c.runCount[0] + Math.floor((rng || Math.random)() * (c.runCount[1] - c.runCount[0] + 1));
    return c.count;
  };
  /** 바다에서 발견한 펭귄도 가까운 해안에서 출발한다. 걸음 → 입수 → 헤엄을 잇는다. */
  B.entryPath = function (p, member) {
    var c = fx(), land = surfacePoint(p.lon, p.lat, true, c.coastSearch, c.coastSearchStep);
    if (!land) return null;
    land = surfacePoint(land[0], land[1] + member * c.shoreSpacing, true) || land;
    var water = surfacePoint(land[0], land[1], false, c.coastSearch, c.coastSearchStep);
    if (!water) return null;
    for (var i = 0; i < c.coastBisect; i++) {
      var mid = [(land[0] + water[0]) / 2, (land[1] + water[1]) / 2];
      if (surface(mid[0], mid[1], true)) land = mid; else water = mid;
    }
    var dx = water[0] - land[0], dy = water[1] - land[1], len = Math.hypot(dx, dy);
    if (!len) return null; dx /= len; dy /= len;
    var walk = [land], q = land;
    for (var back = c.groundStep; back <= c.shoreWalk; back += c.groundStep) {
      var a = [land[0] - dx * back, land[1] - dy * back];
      if (!surface(a[0], a[1], true)) break;
      walk.push(a);
    }
    walk.reverse();
    // 바닷가의 첫 물 칸에서 시작해 땅을 가로지르지 않고 물속으로 나아간다.
    var swim = B.groundPath({ lon: water[0], lat: water[1] }, 'swim', 0, Math.atan2(dy, dx));
    return { walk: walk, swim: swim, land: land, water: water };
  };
  function sample(path, u, land) {
    var at = U.clamp(u, 0, 1) * (path.length - 1), i = Math.floor(at), a = path[i], z = path[Math.min(i + 1, path.length - 1)];
    var mix = at - i, x = a[0] + (z[0] - a[0]) * mix, y = a[1] + (z[1] - a[1]) * mix;
    if (!surface(x, y, land)) { x = a[0]; y = a[1]; }
    return { lon: x, lat: y, flip: z[0] < a[0] };
  }
  B.entryPose = function (entry, u) {
    var c = fx(), o;
    if (u < c.entryWalk) { o = sample(entry.walk, u / c.entryWalk, true); o.phase = 'walk'; return o; }
    if (u < c.entryWalk + c.entryDive) {
      var t = (u - c.entryWalk) / c.entryDive;
      return { lon: entry.land[0] + (entry.water[0] - entry.land[0]) * t,
        lat: entry.land[1] + (entry.water[1] - entry.land[1]) * t, phase: 'dive', progress: t, flip: entry.water[0] < entry.land[0] };
    }
    o = sample(entry.swim, (u - c.entryWalk - c.entryDive) / (1 - c.entryWalk - c.entryDive), false); o.phase = 'swim'; return o;
  };
  B.show = function (d, st) {
    reset();
    image(d.id); if (B.kinds[d.id] === 'swim') image(d.id + '_shore');
    var butterfly = B.isButterfly(d), rng = butterfly ? Math.random : U.makeRng(U.strHash(d.id) + U.dateNum(S().date)), members = [], c = settings(d);
    var flying = kind(d) === 'fly', count = B.count(d, rng), columns = !butterfly && count > c.count ? c.largeColumns : 3;
    for (var i = 0; i < count; i++) {
      if (butterfly) {
        members.push({ delay: rng() * c.stagger, life: between(c.life, rng), phase: Math.floor(rng() * 8),
          x: between(c.spreadX, rng), y: between(c.spreadY, rng), scale: between(c.scale, rng),
          flap: between(c.flap, rng), drift: between(c.drift, rng), rise: between(c.rise, rng),
          swayX: between(c.swayX, rng), swayY: between(c.swayY, rng), frequency: between(c.frequency, rng),
          angle: rng() * Math.PI * 2, fade: between(c.fadeRange, rng) });
        continue;
      }
      members.push({ delay: rng() * (flying ? c.flightStagger : c.stagger), phase: Math.floor(rng() * 8),
      life: flying ? c.flightDuration : c.duration,
      x: (i % columns) * c.spacing, y: Math.floor(i / columns) * c.spacing * 0.55 + (rng() - 0.5) * c.spacing,
      scale: 0.75 + rng() * 0.5, flap: 0.8 + rng() * 0.4,
      path: B.kinds[d.id] === 'run' ? B.groundPath(place(d, st), 'run', i) : null,
      entry: B.kinds[d.id] === 'swim' ? B.entryPath(place(d, st), i) : null });
    }
    var limit = butterfly || flying ? Math.max.apply(null, members.map(function (b) { return b.delay + b.life; })) : c.duration + c.stagger;
    var flock = { id: d.id, kind: kind(d), place: place(d, st), t: 0, limit: limit, members: members, mode: S().loc.mode };
    if (flying) {
      flock.centerX = (Math.min(columns, count) - 1) * c.spacing / 2;
      flock.centerY = (Math.ceil(count / columns) - 1) * c.spacing * 0.55 / 2;
    }
    flocks.push(flock); return flock;
  };
  B.record = function (d, fame) {
    if (!B.isObservable(d)) return;
    reset(); var s = S(), st = s.disc[d.id], l = s.loc;
    var field = prefix(d);
    st[field + 'Fame'] = fame; st[field + 'Seen'] = st.found;
    st[field + 'Place'] = { lon: l.lon, lat: l.lat, mode: l.mode, city: l.city };
    image(d.id); // 발견 대화를 읽는 동안 시트를 미리 받는다.
    inside[d.id] = true;
  };
  B.onFind = function (d) { if (B.isObservable(d)) B.show(d, S().disc[d.id]); };
  B.check = function () {
    reset(); var s = S(); if (!s || !s.loc) return [];
    var got = [], now = U.dateNum(s.date);
    Object.keys(B.kinds).concat(Object.keys(B.butterflies)).forEach(function (id) {
      var d = G.DISC[id], st = s.disc[id]; if (!d || !st || !st.me || !st.found) return;
      var here = near(d, st, s.loc), entered = here && !inside[id]; inside[id] = here;
      if (!entered || now < B.dueDate(st)) return;
      var fame = B.reward(d, st); st[prefix(d) + 'Seen'] = now;  // 보상보다 먼저 기록하여 재진입·저장 시 중복을 막는다.
      G.Fame.add('ex', fame); var flock = B.show(d, st); got.push({ id: id, fame: fame });
      var action = B.isButterfly(d) || B.kinds[id] === 'fly' ? '하늘을 나는' : B.kinds[id] === 'run' ? '달리는' : '헤엄치는';
      var line = d.name + (flock.members.length === 1 ? U.jx(d.name, '이/가') : ' 무리가') + ' ' + action + ' 모습을 다시 관찰했다. 탐험 명성 +' + fame;
      G.State.log(line); G.UI.toast(line + ' · 다음 관찰 보상은 ' + rules().years + '년 뒤', 'compass', 5500, { tier: 'line' });
    });
    if (got.length && G.Game.refreshHud) G.Game.refreshHud();
    return got;
  };
  function airborne(f) { return f.kind === 'fly' || f.kind === 'flutter'; }
  function ready(f) { return image(f.id) && (f.kind !== 'swim' || image(f.id + '_shore')); }
  function smooth(u) { u = U.clamp(u, 0, 1); return u * u * (3 - 2 * u); }
  function watching(ui, on) {
    if (ui.classList.contains('watching-nature') === on) return;
    ui.classList.toggle('watching-nature', on);
    if (G.UI.noticeZone) G.UI.noticeZone();
    if (on) { var notices = ui.querySelector('.toasts'); if (notices) notices.scrollTop = notices.scrollHeight; }
  }
  // 지도의 이동을 좇아 튀지 않도록 첫 현장 위치에서 하늘 구도를 잡는다.
  function anchor(f, p) {
    var c = fx().view;
    if (!f.anchor) f.anchor = [U.clamp(p[0], c.anchorX[0], c.anchorX[1]), U.clamp(p[1], c.anchorY[0], c.anchorY[1])];
    return f.anchor;
  }
  function sky(ctx, mode) {
    var c = fx().view, alpha = 0, time = 0;
    flocks.forEach(function (f) {
      if (f.mode !== mode || !airborne(f) || !ready(f)) return;
      var a = smooth(Math.min(f.t, f.limit - f.t) / c.fade);
      if (a > alpha) { alpha = a; time = f.t; }
    });
    if (!alpha) return;
    ctx.save(); ctx.globalAlpha = alpha;
    var g = ctx.createLinearGradient(0, c.top, 0, c.bottom);
    g.addColorStop(0, c.sky[0]); g.addColorStop(0.5, c.sky[1]); g.addColorStop(1, c.sky[2]);
    ctx.fillStyle = g; ctx.fillRect(0, c.top, 1600, c.bottom - c.top);
    c.clouds.forEach(function (p) {
      ctx.save(); ctx.translate(p[0] + time * c.cloudDrift, p[1]); ctx.scale(p[2], p[3]);
      var cloud = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      cloud.addColorStop(0, 'rgba(255,255,245,' + c.cloudAlpha + ')'); cloud.addColorStop(1, 'rgba(255,255,245,0)');
      ctx.fillStyle = cloud; ctx.fillRect(-1, -1, 2, 2); ctx.restore();
    });
    ctx.restore();
  }
  B.draw = function (ctx, project, mode) {
    sky(ctx, mode);
    flocks.forEach(function (f) {
      if (f.mode !== mode) return;
      var flutter = f.kind === 'flutter', c = flutter ? G.FX.butterflies : fx();
      var img = image(f.id); if (!img) return;
      var p = project(f.place.lon, f.place.lat), cw = img.width / 4, ch = img.height / 2;
      if (airborne(f)) p = anchor(f, p);
      f.members.forEach(function (b) {
        var t = f.t - b.delay, life = b.life || c.duration; if (t < 0 || t > life) return;
        var u = t / life, fly = f.kind === 'fly' || flutter;
        var x, y, distanceScale = 1;
        var flip = false, pose = null, sprite = img;
        if (flutter) {
          x = p[0] + b.x + t * b.drift + Math.sin(t * b.frequency + b.angle) * b.swayX;
          var startY = p[1] - c.height + b.y;
          var climb = Math.min(life * b.rise, startY - fx().view.ceiling - b.swayY - c.size * b.scale / 2);
          y = startY - Math.sin(u * Math.PI / 2) * climb + Math.cos(t * b.frequency * c.swayRatio + b.angle) * b.swayY;
          distanceScale = 1 - (1 - c.distantScale) * smooth(u);
        } else if (fly) {
          // 계속 높아지는 완만한 곡선과 작아지는 날개로 상승·거리감을 만든다.
          var rise = Math.sin(u * Math.PI / 2);
          distanceScale = 1 - (1 - c.distantScale) * smooth(u);
          x = p[0] + (u - 0.5) * c.flightTravel + (f.centerX - b.x) * c.flightSpreadX * distanceScale;
          y = p[1] - rise * c.flightRise + (b.y - f.centerY) * fx().view.spreadY * distanceScale
            + Math.sin(t * c.glideRate + b.phase) * c.glideSway;
        } else {
          x = p[0] - c.travel * 0.3 + u * c.travel - b.x;
          y = p[1] + c.groundOffset + b.y;
        }
        if (!fly && mode !== 'city') {
          if (f.kind === 'swim') {
            if (!b.entry || !b.entry.swim.length) return;
            pose = B.entryPose(b.entry, u);
            if (pose.phase !== 'swim') { sprite = image(f.id + '_shore'); if (!sprite) return; }
          } else {
            if (!b.path || !b.path.length) return;
            pose = sample(b.path, u, true);
          }
          var gp = project(pose.lon, pose.lat); x = gp[0]; y = gp[1]; flip = pose.flip;
          if (pose.phase === 'dive') y -= Math.sin(pose.progress * Math.PI) * c.diveHeight;
        }
        var w = c.size * b.scale * ((c.sizeById && c.sizeById[f.id]) || 1) * distanceScale, h = w * ch / cw;
        var frameMs = (c.frameById && c.frameById[f.id]) || c.frameMs;
        var frame = (b.phase + Math.floor(t * 1000 / (frameMs * b.flap))) % 8;
        if (pose && pose.phase === 'walk') frame %= 4;
        if (pose && pose.phase === 'dive') frame = 4 + Math.min(3, Math.floor(pose.progress * 4));
        var fade = b.fade || (fly ? c.flightFade : c.fade);
        ctx.save(); ctx.globalAlpha = smooth(Math.min(1, t / fade, (life - t) / fade));
        ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
        if (flutter) ctx.rotate(Math.sin(t * b.frequency + b.angle) * c.tilt);
        ctx.drawImage(sprite, (frame % 4) * cw, Math.floor(frame / 4) * ch, cw, ch, -w / 2, -h / 2, w, h);
        if (pose && pose.phase === 'dive') {
          var splash = Math.max(0, (pose.progress - 0.45) / 0.55), r = c.splashSize * splash;
          ctx.globalAlpha *= 1 - splash; ctx.strokeStyle = '#e6fbff'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(0, h * 0.2, r, r * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.restore();
      });
    });
  };
  B.update = function (dt) {
    reset(); var s = S(), mode = G.Game.sceneName, visible = s && s.loc && /^(sea|land|city)$/.test(mode);
    var ui = document.getElementById('ui'); if (!ui) return;
    if (!canvas) {
      canvas = document.createElement('canvas'); canvas.id = 'bird-flocks'; canvas.width = 1600; canvas.height = 900;
      canvas.style.cssText = 'width:1600px;height:900px;pointer-events:none'; ui.parentNode.insertBefore(canvas, ui);
    }
    var ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, 1600, 900);
    canvas.style.display = visible ? 'block' : 'none';
    if (!visible) { flocks = []; watching(ui, false); return; }
    flocks = flocks.filter(function (f) { return f.t <= f.limit && f.mode === mode; });
    var blocked = G.UI.busy() || ui.classList.contains('talking') || ui.querySelector('.dlg-stage, .dlg, .reveal:not(.report)')
      || (G.Loader && G.Loader.shown()) || (mode === 'city' && G.Town.active() && G.Town.hidden());
    if (blocked) { watching(ui, false); return; } // 발견 카드·대화·건물 안에서는 기다렸다가 현장 화면에서 보여 준다.
    B.check();
    watching(ui, flocks.some(function (f) { return airborne(f) && ready(f); }));
    var project = mode === 'sea' ? G.Scenes.sea.toScreen : mode === 'land' ? G.Scenes.land.toScreen : function () { return [620, 420]; };
    B.draw(ctx, project, mode);
    flocks.forEach(function (f) { if (ready(f)) f.t += Math.min(Math.max(0, dt), fx().view.maxDelta); });
    flocks = flocks.filter(function (f) { return f.t <= f.limit && f.mode === mode; });
    watching(ui, flocks.some(function (f) { return airborne(f) && ready(f); }));
  };
})(window.G = window.G || {});
