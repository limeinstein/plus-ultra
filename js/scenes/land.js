/* Land exploration: an expedition party walks inland from a port gate or a landing point. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, A = G.Art;
  var L = {};
  G.Scenes.land = L;
  var DAY_SEC = 1.3;
  var st = null;
  function S() { return G.Game.state; }
  var TERR = {
    grass: { name: '초원', spd: 0.34 }, steppe: { name: '스텝', spd: 0.36 }, desert: { name: '사막', spd: 0.26, thirst: 2 }, forest: { name: '숲', spd: 0.2 },
    jungle: { name: '밀림', spd: 0.14, sick: 1 }, mountain: { name: '산악', spd: 0.1 }, snow: { name: '설원', spd: 0.1, cold: 1 }, tundra: { name: '툰드라', spd: 0.2, cold: 1 }, ice: { name: '빙원', spd: 0.07, cold: 2 }, sea: { name: '바다', spd: 0 }
  };

  L.enter = async function (arg) {
    arg = arg || {};
    var s = S();
    G.Game.showLayers(true, true, false);
    G.Game.ensureRenderer();
    if (arg.from != null || arg.landing) {
      var base;
      if (arg.from != null) { var c = G.CITY_DATA[arg.from]; base = { type: 'city', city: c.id, lon: c.lon, lat: c.lat }; }
      else base = { type: 'ship', lon: arg.landing.shipLon, lat: arg.landing.shipLat };
      var start = arg.from != null ? [base.lon, base.lat] : [arg.landing.lon, arg.landing.lat];
      var party = Math.min(s.fleet.crew, Math.max(5, Math.round(s.fleet.crew * 0.5)));
      party = Math.min(party, 30);
      var mt = cleanMount(arg.mount);
      s.loc = { mode: 'land', lon: start[0], lat: start[1], heading: 0, base: base, party: party, days: 0, party0: party, found0: s.stats.found, marks0: Object.keys(s.marks || {}).length, mount: mt };
      st = newSt(start);
      UI.toast('탐험대 ' + party + '명이 ' + (mt.id === 'walk' ? '걸어서' : G.Mounts.get(mt.id).name + U.jx(G.Mounts.get(mt.id).name, '과/와') + ' 함께') + ' 출발했다.', 'boot');
    } else {
      if (arg.resumeFrom != null) L.resumeFromCity(G.CITY_DATA[arg.resumeFrom], arg.mount);
      if (!st) st = newSt([s.loc.lon, s.loc.lat]);
      st.cam.lon = s.loc.lon; st.cam.lat = s.loc.lat; st.paused = true; st.path = null;
      var lt = st.trail[st.trail.length - 1]; if (lt && G.Geo.dist(lt[0], lt[1], s.loc.lon, s.loc.lat) > 0.3) st.trail = [];
      if (!st.pfx) { st.pfx = G.Party.newFx(); st.unit = {}; st.gph = 0; st.gdist = 0; st.gather = 1; st.face = 1; }
    }
    st.alive = true; st.busy = 0; st.keys = {}; st.dir = null;
    buildUI();
    if (G.Audio) G.Audio.music('land');
  };
  function newSt(start) { return { cam: { lon: start[0], lat: start[1], zoom: 170 }, path: null, t: 0, busy: 0, paused: true, dayAcc: 0, speed: 1, trail: [], seen: {}, near: null, lastHint: -99, gph: 0, gdist: 0, gather: 1, face: 1, pfx: G.Party.newFx(), unit: {} }; }
  L.runtime = function () { return st; };
  function cleanMount(m) { return m && m.id && m.id !== 'walk' && m.n > 0 ? { id: m.id, n: m.n, draft: m.draft || 'horse', style: m.style || null } : { id: 'walk', n: 0 }; }
  function MT() { var l = S().loc; return l.mount || (l.mount = { id: 'walk', n: 0 }); }
  L.mount = MT;
  L.exit = function () { if (st) { st.alive = false; if (st.unkey) st.unkey(); } };

  // ---------------------------------------------------------------- UI
  var el = {};
  function buildUI() {
    var s = S();
    UI.clearScreen();
    UI.hud.show([
      { k: 'date', icon: 'calendar', text: U.fmtDate(s.date) },
      { k: 'party', icon: 'people', text: '' },
      { k: 'sup', icon: 'bread', text: '' },
      { k: 'fat', icon: 'hourglass', text: '' },
      { k: 'terr', icon: 'land', text: '' },
      { k: 'mount', icon: 'boot', text: '' },
      { grow: true },
      { k: 'gold', icon: 'coin', text: U.num(s.player.gold) + '<small>닢</small>' }
    ]);
    var catcher = U.el('div', 'mapcatch'); catcher.style.cssText = 'position:absolute;inset:0;z-index:5;cursor:crosshair';
    catcher.addEventListener('mousedown', onDown);
    catcher.addEventListener('mousemove', function (e) { st.mouse = pos(e); });
    catcher.addEventListener('wheel', function (e) { e.preventDefault(); st.cam.zoom = U.clamp(st.cam.zoom * (e.deltaY > 0 ? 1 / 1.15 : 1.15), 80, 700); }, { passive: false });
    UI.add(catcher);
    el.status = UI.add(U.el('div', 'status-strip wood', ''));
    var bar = U.el('div', 'sailbar wood brass-frame');
    function btn(label, icon, fn, cls) { var b = U.el('button', 'btn ' + (cls || ''), G.icon(icon) + label); b.onclick = function (e) { e.stopPropagation(); b.blur(); if (!UI.busy() && !st.busy) fn(); }; bar.appendChild(b); return b; }
    el.pause = btn('정지', 'pause', function () { st.paused = !st.paused; refreshBar(); });
    el.back = btn('돌아간다', 'anchor', function () { goBack(); }, 'navy');
    el.city = btn('도시에 들어간다', 'castle', function () { enterCity(); });
    btn('야영', 'tent', function () { camp(); });
    btn('해도', 'map', function () { chart(); });
    btn('수첩', 'book', function () { st.busy++; G.Info.open('admiral').then(function () { st.busy--; }); });
    var zb = U.el('div', 'zoomctl');
    [['＋', 1.25], ['－', 0.8]].forEach(function (z) { var b = U.el('button', 'btn small', z[0]); b.onclick = function (e) { e.stopPropagation(); st.cam.zoom = U.clamp(st.cam.zoom * z[1], 80, 700); }; zb.appendChild(b); });
    bar.appendChild(zb);
    UI.add(bar);
    refreshBar(); refreshHud();
    if (st.unkey) st.unkey();
    st.unkey = UI.pushKey(onKey);
    document.onkeyup = function (e) { if (st) { st.keys[String(e.key).toLowerCase()] = false; st.keys[e.code] = false; } };
  }
  // ---------------------------------------------------------------- 키보드 조작
  // 숫자판 1~9 = 여덟 방향(5는 정지), 화살표·WASD = 그 방위로 계속 걷기, 스페이스 = 정지
  var NUMDIR = { Numpad1: [-1, -1], Numpad2: [0, -1], Numpad3: [1, -1], Numpad4: [-1, 0],
    Numpad6: [1, 0], Numpad7: [-1, 1], Numpad8: [0, 1], Numpad9: [1, 1],
    Digit1: [-1, -1], Digit3: [1, -1], Digit7: [-1, 1], Digit9: [1, 1] };
  function norm(d) { var m = Math.hypot(d[0], d[1]) || 1; return [d[0] / m, d[1] / m]; }
  function keyDir() {
    var k = st.keys, x = 0, y = 0;
    if (k.arrowleft || k.a) x -= 1;
    if (k.arrowright || k.d) x += 1;
    if (k.arrowup || k.w) y += 1;
    if (k.arrowdown || k.s) y -= 1;
    return (x || y) ? norm([x, y]) : null;
  }
  function onKey(e) {
    if (G.Game.scene !== L || !st || !st.alive || UI.busy() || st.busy) return false;
    var k = e.key;
    // 스페이스 = 정지 (바다와 같다). 멈춘 뒤에는 방향키나 땅을 눌러 다시 걷는다
    if (k === ' ') {
      if (!st.paused) { st.paused = true; st.dir = null; refreshBar(); }
      else if (!e.repeat) UI.toast('멈춰 있습니다. 방향키로 가려는 쪽을 누르거나 땅을 누르면 걷습니다.', 'boot', 2600);
      return true;
    }
    if (k === 'Enter') { if (cityNear()) enterCity(); else if (atBase()) goBack(); else UI.toast('들어갈 도시도, 돌아갈 곳도 가깝지 않습니다.', 'castle'); return true; }
    if (k === 'm' || k === 'M') { chart(); return true; }
    if (e.code === 'Numpad5' || k === '5') { st.dir = null; st.path = null; st.paused = true; refreshBar(); return true; }
    if (NUMDIR[e.code]) { st.dir = norm(NUMDIR[e.code]); st.path = null; st.paused = false; refreshBar(); return true; }
    if (k === '+' || k === '=') { st.cam.zoom = Math.min(700, st.cam.zoom * 1.2); return true; }
    if (k === '-') { st.cam.zoom = Math.max(80, st.cam.zoom / 1.2); return true; }
    // 방향키·WASD = 그 방위로 계속 걷는다 (두 키를 함께 누르면 대각선, Space로 정지)
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'd', 'w', 's', 'A', 'D', 'W', 'S'].indexOf(k) >= 0) {
      st.keys[k.toLowerCase()] = true;
      if (e.repeat) return true;
      var kd = keyDir(); if (!kd) return true;
      st.dir = kd; st.path = null;
      if (st.paused) { st.paused = false; refreshBar(); }
      return true;
    }
    return false;
  }
  function refreshBar() { if (el.pause) el.pause.innerHTML = G.icon(st.paused ? 'boot' : 'pause') + (st.paused ? '출발' : '정지'); }
  function refreshHud() {
    var s = S(), l = s.loc, f = s.fleet;
    UI.hud.set('date', U.fmtDate(s.date));
    UI.hud.set('party', '탐험대 ' + l.party + '명');
    var days = Math.min(R.daysOfFood(), R.daysOfWater());
    UI.hud.set('sup', '식량·물 ' + days + '일', days < 7);
    UI.hud.set('fat', '피로 ' + Math.round(f.fatigue) + '%', f.fatigue > 60);
    var t = G.Geo.terrain(l.lon, l.lat), mt = MT(), M = G.Mounts;
    UI.hud.set('terr', (TERR[t] || TERR.grass).name);
    var sk = t === 'sea' ? 'grass' : t, sp = M.speed(mt, sk, l.party), su = M.suit(mt.id, sk);
    UI.hud.set('mount', mt.id === 'walk' ? '도보' : M.get(mt.id).name + ' ×' + sp.toFixed(1) + ' <small class="suit ' + su.cls + '">' + su.mark + '</small>', mt.id !== 'walk' && su.cls === 'bad');
    UI.hud.set('gold', U.num(s.player.gold) + '<small>닢</small>');
  }
  function pos(e) { var r = G.Game.canvases().overlay.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 1600, (e.clientY - r.top) / r.height * 900]; }
  function toScreen(lon, lat) { return [800 + G.Geo.wrapLon(lon - st.cam.lon) * st.cam.zoom, 450 - (lat - st.cam.lat) * st.cam.zoom]; }
  function toWorld(x, y) { return [st.cam.lon + (x - 800) / st.cam.zoom, st.cam.lat - (y - 450) / st.cam.zoom]; }
  function onDown(e) {
    if (e.button !== 0 || UI.busy() || st.busy) return;
    var p = pos(e), w = toWorld(p[0], p[1]);
    var c = cityAt(p[0], p[1]); if (c) w = [c.lon, c.lat];
    var mk = !c && G.Explore.markerAt(st.marks || [], toScreen, p[0], p[1]);
    if (mk) w = [mk.lon, mk.lat];
    if (!G.Geo.isLand(w[0], w[1])) { UI.toast('그곳은 물입니다. 육지를 클릭하십시오.', 'land'); return; }
    st.path = w; st.paused = false; refreshBar();
  }
  var kiCache = null, kiKey = '', FF = null, labelW = {};
  function fontFam() { return FF || (FF = getComputedStyle(document.body).fontFamily); }
  function knownInland() {
    var s = S(), key = s.known.length + ':' + s.date.y;
    if (kiCache && kiKey === key) return kiCache;
    kiKey = key;
    var set = {}; s.known.forEach(function (id) { set[id] = 1; });
    kiCache = G.CITY_DATA.filter(function (c) { return set[c.id] && R.cityExists(c); });
    return kiCache;
  }
  function cityAt(x, y) { var best = null, bd = 24 * 24; knownInland().forEach(function (c) { var p = toScreen(c.lon, c.lat), d = (p[0] - x) * (p[0] - x) + (p[1] - y) * (p[1] - y); if (d < bd) { bd = d; best = c; } }); return best; }
  function cityNear() { var s = S(), l = s.loc, best = null, bd = 0.3; G.CITY_DATA.forEach(function (c) { if (!R.cityExists(c)) return; var d = G.Geo.dist(l.lon, l.lat, c.lon, c.lat); if (d < bd) { bd = d; best = c; } }); return best; }
  function atBase() { var s = S(), l = s.loc, b = l.base; return G.Geo.dist(l.lon, l.lat, b.lon, b.lat) < (b.type === 'ship' ? 0.45 : 0.3); }

  // ---------------------------------------------------------------- loop
  L.update = function (dt) {
    if (!st || !st.alive) return;
    var s = S(), l = s.loc;
    st.t += dt;
    var px0 = l.lon, py0 = l.lat;
    if (!st.paused && !st.busy && !UI.busy() && (st.path || st.dir)) {
      var days = dt * st.speed / DAY_SEC;
      var terr = G.Geo.terrain(l.lon, l.lat), tv = (TERR[terr] || TERR.grass).spd;
      var mk = G.Mounts.speed(MT(), terr, l.party);
      var v = tv * mk * (1 + R.skill('ops') * 0.1) * (s.fleet.fatigue > 70 ? 0.7 : 1) * (l.party > 20 ? 0.9 : 1) * (st.fastDays > 0 ? 1.45 : 1);
      st.mk = mk;
      var stepLen = v * days;
      if (st.dir) {
        var mx = l.lon + st.dir[0] * stepLen, my = l.lat + st.dir[1] * stepLen;
        if (G.Geo.isLand(mx, my)) { l.lon = G.Geo.wrapLon(mx); l.lat = my; l.heading = Math.atan2(st.dir[1], st.dir[0]); }
        else { st.dir = null; st.paused = true; refreshBar(); UI.toast('물가에 막혀 더 나아갈 수 없습니다.', 'land'); }
      } else {
      var dx = G.Geo.wrapLon(st.path[0] - l.lon), dy = st.path[1] - l.lat, d = Math.hypot(dx, dy);
      if (d <= stepLen) { l.lon = st.path[0]; l.lat = st.path[1]; st.path = null; st.paused = true; refreshBar(); arrive(); }
      else {
        var nx = l.lon + dx / d * stepLen, ny = l.lat + dy / d * stepLen;
        // 목표에 얼마나 다가갔는지 적어 두고, 제자리를 맴돌면 멈춘다
        if (st.goalRef !== st.path) { st.goalRef = st.path; st.bestD = d; st.wander = 0; st.slideSide = 0; }
        if (d < st.bestD - 0.03) { st.bestD = d; st.wander = 0; } else st.wander += stepLen;
        if (G.Geo.isLand(nx, ny)) { l.lon = G.Geo.wrapLon(nx); l.lat = ny; l.heading = Math.atan2(dy, dx); }
        else if (st.wander > Math.max(0.8, Math.min(2.0, st.bestD * 0.6)) || !slideAround(Math.atan2(dy, dx), stepLen)) {
          st.path = null; st.paused = true; refreshBar(); UI.toast('물가에 막혀 더 나아갈 수 없습니다. 다른 쪽으로 돌아가 보십시오.', 'land');
        }
      }
      }
      if (!st.trail.length || G.Geo.dist(st.trail[st.trail.length - 1][0], st.trail[st.trail.length - 1][1], l.lon, l.lat) > 0.02) { st.trail.push([l.lon, l.lat]); if (st.trail.length > 400) st.trail.shift(); }
      st.dayAcc += days;
      if (st.dayAcc >= 1) { st.dayAcc -= 1; runDay(); }
    }
    animate(dt, px0, py0);
    var dxc = G.Geo.wrapLon(l.lon - st.cam.lon);
    st.cam.lon = G.Geo.wrapLon(st.cam.lon + dxc * Math.min(1, dt * 3)); st.cam.lat += (l.lat - st.cam.lat) * Math.min(1, dt * 3);
    st.rframe = (st.rframe || 0) + 1;
    var idle = st.busy > 0 || UI.busy();
    if (idle && st.rframe % 3 !== 0) return;              // 대화 중에는 20fps
    if (st.paused && !idle && st.rframe % 2 !== 0) return; // 멈춰 있을 때는 30fps
    render();
  };
  /* 걸음 리듬: 간 거리(화면 px)를 걸음 폭으로 나눠 걸음 주기를 돌린다 — 빨리 가면 걸음도 빨라지지만 FX.party.maxStepHz를 넘지 않는다.
     멈추면 대원들이 모이고(gather), 짐승은 풀을 뜯는다. 발밑에서는 지형마다 먼지·눈·풀잎이 인다 */
  var STRIDE = { walk: 20, porter: 20, donkey: 22, horse: 40, camel: 46, llama: 24, yak: 30, wagon: 34, elephant: 50, reindeer: 36 };
  function animate(dt, px0, py0) {
    var l = S().loc, z = st.cam.zoom, FP = (G.FX && G.FX.party) || {};
    var dx = G.Geo.wrapLon(l.lon - px0) * z, dy = (l.lat - py0) * z, moved = Math.hypot(dx, dy);
    if (moved > 60) moved = 0;                                  // 순간 이동(도시에서 다시 나올 때)
    var s = FP.size || 1, stride = (STRIDE[MT().id] || 20) * s;
    st.gph += Math.min(moved / stride, (FP.maxStepHz || 2.2) * dt);
    st.gdist += moved / s;
    st.movT = moved > 0.02 ? 0.3 : Math.max(0, (st.movT || 0) - dt);
    var mv = st.movT > 0;
    st.gather += ((mv ? 0 : 1) - st.gather) * Math.min(1, dt * (mv ? 5 : 1.1));
    if (Math.abs(dx) > moved * 0.3 && moved > 0.02) st.face = dx > 0 ? 1 : -1;
    G.Party.age(st.pfx, dt);
    if (moved > 0 && st.unitItems) {
      var terr = G.Geo.terrain(l.lon, l.lat), feet = st.unitItems.map(function (it) { return toWorld(it.x, it.y); });
      G.Party.emit(st.pfx, terr, moved, feet, st.mk || 1);
    }
  }
  /** 물가에 막히면 물가를 따라 비켜 걷는다 (한쪽으로 정하면 그쪽을 고집해 오락가락하지 않는다) */
  function slideAround(h, len) {
    var l = S().loc, side = st.slideSide || 1;
    for (var a = 1; a <= 8; a++) {
      for (var k = 0; k < 2; k++) {
        var sg = k === 0 ? side : -side, h2 = h + sg * a * 0.22;
        var x2 = l.lon + Math.cos(h2) * len * 0.85, y2 = l.lat + Math.sin(h2) * len * 0.85;
        if (G.Geo.isLand(x2, y2)) { st.slideSide = sg; l.lon = G.Geo.wrapLon(x2); l.lat = y2; l.heading = h2; return true; }
      }
    }
    return false;
  }
  function arrive() {
    var c = cityNear();
    if (c) UI.toast(c.name + ' 근처에 도착했다. 「도시에 들어간다」를 누르십시오.', 'castle');
    else if (atBase()) UI.toast(S().loc.base.type === 'ship' ? '배가 기다리는 곳에 돌아왔다.' : '출발한 도시에 돌아왔다.', 'anchor');
  }

  async function runDay() {
    var s = S(), l = s.loc, f = s.fleet;
    st.busy++;
    try {
      var msgs = G.Game.newDay();
      l.days++;
      var terr = G.Geo.terrain(l.lon, l.lat), T = TERR[terr] || TERR.grass;
      var use = R.dailyUse(), mt = MT(), M = G.Mounts;
      f.food = Math.max(0, f.food - use * M.use(mt, terr, l.party, 'food')); f.water = Math.max(0, f.water - use * (T.thirst || 1) * M.use(mt, terr, l.party, 'water'));
      // 피로: 걸음의 피로는 탈것이 덜어 주고, 추위는 털옷·썰매가 조금 덜어 준다
      f.fatigue = U.clamp(f.fatigue + (1.4 + (T.thirst ? 0.6 : 0)) * M.fatigue(mt, terr, l.party) + (T.cold ? 1 : 0) * M.cold(mt, l.party) - R.skill('ops') * 0.3, 0, 100);
      // 알맞지 않은 땅에서는 짐승을 잃는다
      var rk = M.risk(mt, terr);
      if (rk > 0 && mt.n > 0 && U.chance(Math.min(0.5, rk * (1 + mt.n / 8)))) {
        mt.n--; msgs.push({ icon: 'skull', text: M.lossText(mt.id, terr) + (mt.n > 0 ? ' (남은 ' + M.get(mt.id).name + ' ' + mt.n + ')' : '') });
        if (mt.n <= 0) { msgs.push({ icon: 'boot', text: '이제 모두 걸어서 간다.' }); l.mount = { id: 'walk', n: 0 }; }
      }
      if (f.food <= 0 || f.water <= 0) { var dd = Math.max(1, Math.ceil(l.party * 0.05)); l.party = Math.max(0, l.party - dd); f.crew = Math.max(0, f.crew - dd); msgs.push({ icon: 'skull', text: '식량과 물이 떨어져 대원 ' + dd + '명이 쓰러졌다!' }); }
      if (T.sick && U.chance((0.04 - R.skill('med') * 0.01) * (st.herbs > 0 ? 0.3 : 1))) { var sk = U.ri(1, 2); l.party = Math.max(0, l.party - sk); f.crew = Math.max(0, f.crew - sk); msgs.push({ icon: 'skull', text: '열병으로 대원 ' + sk + '명을 잃었다.' }); }
      G.State.revealChart(l.lon, l.lat, 0.6 + R.skill('survey') * 0.2 + G.Mounts.scout(MT(), l.party));
      // discover inland cities
      G.CITY_DATA.forEach(function (c) { if (!R.cityExists(c) || s.known.indexOf(c.id) >= 0) return; if (G.Geo.dist(l.lon, l.lat, c.lon, c.lat) < 0.8) { s.known.push(c.id); UI.toast('새로운 도시 「' + c.name + '」' + U.jx(c.name, '을/를') + ' 발견했다!', 'castle', 4000); s.player.fame += 5; } });
      msgs.forEach(function (m) { UI.toast(m.text, m.icon); });
      refreshHud();
      // discoveries
      var chk = G.Disc.checkLand(l.lon, l.lat);
      for (var i = 0; i < chk.hits.length; i++) {
        var d = chk.hits[i];
        if (d.cat === 'treasure' || (d.cat === 'ruin' && U.chance(0.5))) {
          await UI.say('제독, 이 유적 안쪽에 무언가 있습니다. 하지만 장치로 굳게 잠겨 있군요...', G.Scenes.mateSpeaker('surveyor'));
          var ok = await G.Games.puzzle(d);
          if (!ok) { await UI.say('장치를 풀지 못했다. 다음에 다시 와 보자.', {}); continue; }
        } else await UI.say(landLine(d), G.Scenes.mateSpeaker('surveyor'));
        await G.Disc.find(d, 'land');
      }
      // 정찰대: 가까운 발견물을 알아채고 지도에 표식을 남긴다
      var sensed = G.Explore.sense('land', l.lon, l.lat, Math.max(st.scoutBoost || 1, 1 + G.Mounts.scout(MT(), l.party)));
      st.scoutBoost = 0;
      if (sensed.length) { await G.Explore.report(sensed, l.lon, l.lat, 'land'); st.marks = null; }
      if (st.herbs > 0) st.herbs--;
      if (st.fastDays > 0) st.fastDays--;
      // random encounters (지형마다 다른 사건이 먼저 일어날 수 있다)
      if (U.chance(0.1)) { if (!(U.chance(0.55) && await terrainEvent(terr))) await encounter(terr); }
      if (l.party <= 0 || f.crew <= 0) { await UI.say('탐험대가 전멸했다...', {}); if (f.crew <= 0) { await G.Family.retire(true); return; } l.party = 0; await returnToBase(true); }
    } catch (e) { console.error(e); }
    st.busy--;
  }
  function landLine(d) {
    if (d.cat === 'nature') return '제독, 저 경치를 보십시오! 이런 곳이 있었다니...';
    if (d.cat === 'creature') return '제독, 저기 이상한 생물이 있습니다! 조심하십시오!';
    if (d.cat === 'people') return '제독, 처음 보는 사람들입니다. 적의는 없어 보입니다.';
    return '제독! 찾았습니다! 저것이 틀림없습니다!';
  }
  async function encounter(terr) {
    var s = S(), l = s.loc, r = U.rand();
    if (r < 0.35) {
      var who = { name: '원주민', portrait: A.withImg(A.npcSpec('native' + Math.floor(l.lon) + Math.floor(l.lat), 'native', l.lon < -30 ? 'az' : 'af'), G.Img.chain.npc('native')), lang: 1 };
      var v = await UI.ask('원주민 무리를 만났다. 이쪽을 경계하고 있다.', [{ label: '선물을 준다', value: 'gift' }, { label: '말을 건다', value: 'talk' }, { label: '물건을 바꾼다', value: 'trade' }, { label: '지나간다', value: null }], who);
      if (v === 'trade') { await nativeTrade(who); refreshHud(); return; }
      if (v === 'gift') {
        var g = Math.min(s.player.gold, 100 + l.party * 5); s.player.gold -= g;
        if (U.chance(0.7)) { f_food(Math.round(R.dailyUse() * 6)); UI.toast('원주민들이 기뻐하며 식량을 나누어 주었다.', 'bread'); var d = nearHint(); if (d) { G.Disc.addHint(d.id, 'native'); await UI.say('(손짓발짓으로) ' + d.hint, who); } }
        else UI.toast('원주민들은 선물만 받고 사라졌다.', 'people');
      } else if (v === 'talk') {
        if (U.chance(0.5 + R.skill('speech') * 0.1)) { var d2 = nearHint(); if (d2) { G.Disc.addHint(d2.id, 'native'); await UI.say('(알아듣기 힘든 말이지만) ' + d2.hint, who); } else UI.toast('원주민들이 길을 가르쳐 주었다.', 'compass'); }
        else { await UI.say('원주민들이 화가 나서 달려든다!', {}); await landBattle('원주민 전사', U.ri(8, 25)); }
      }
    } else if (r < 0.55) {
      await UI.say(U.pick(['사나운 짐승 떼가 습격해 왔다!', '굶주린 들짐승이 야영지를 덮쳤다!']), {});
      await landBattle('들짐승', U.ri(4, 12), true);
    } else if (r < 0.72) {
      await UI.say('도적 떼가 길을 막아섰다! "가진 것을 모두 내놓아라!"', {});
      var v2 = await UI.ask('어떻게 할까?', [{ label: '싸운다', value: 1 }, { label: '돈을 준다', value: 0 }], G.Scenes.mateSpeaker('first'));
      if (v2) await landBattle('도적 떼', U.ri(10, 30));
      else { var lost = Math.min(s.player.gold, Math.round(150 + s.player.gold * 0.08)); s.player.gold -= lost; UI.toast('도적에게 금화 ' + U.num(lost) + '닢을 주었다.', 'coin'); }   // 바다의 통행료처럼 150 + 가진 돈의 8%
    } else if (r < 0.85) {
      await UI.say('맑은 샘을 발견했다! 물을 가득 채우고 잠시 쉬었다.', {});
      s.fleet.water += R.dailyUse() * 5; s.fleet.fatigue = Math.max(0, s.fleet.fatigue - 10);
    } else {
      var gold = U.ri(50, 400);
      await UI.say('버려진 야영지에서 금화 ' + gold + '닢이 든 주머니를 주웠다.', {});
      s.player.gold += gold;
    }
    refreshHud();
  }
  function f_food(n) { S().fleet.food += n; }
  function nearHint() {
    var s = S(), l = s.loc;
    var cand = G.DISCOVERIES.filter(function (d) { return d.how === 'land' && !G.Disc.foundByMe(d.id) && !s.hints[d.id] && G.Disc.available(d) && G.Geo.dist(l.lon, l.lat, d.lon, d.lat) < 12; });
    return cand.length ? U.pick(cand) : null;
  }
  /** simple land skirmish resolved in a few exchanges */
  async function landBattle(enemyName, n, beasts) {
    var s = S(), l = s.loc;
    var mine = l.party, en = n;
    var power = function () { return (1 + R.skill('sword') * 0.2 + R.skill('shoot') * 0.25 + R.atk() / 50) * (1 - s.fleet.fatigue / 250) * (1 + G.Mounts.combat(MT(), l.party)); };
    var html = '<div class="lb"><div class="flex"><b>탐험대</b><span class="right lbm">' + mine + '명</span></div><div class="lbar1"></div><div class="flex" style="margin-top:10px"><b>' + enemyName + '</b><span class="right lbe">' + en + '</span></div><div class="lbar2"></div><div class="lbl" style="margin-top:12px;min-height:50px;font-size:18px"></div></div>';
    var win = UI.window({ title: '지상전', icon: 'sword', width: 620, html: html, closable: false });
    var c = win.content;
    function draw(t) { c.querySelector('.lbar1').innerHTML = UI.bar(mine, l.party, 'green'); c.querySelector('.lbar2').innerHTML = UI.bar(en, n, 'red'); c.querySelector('.lbm').textContent = mine + '명'; c.querySelector('.lbe').textContent = en; if (t) c.querySelector('.lbl').innerHTML = t; }
    draw('');
    var foot = U.el('div', 'foot'); win.el.appendChild(foot);
    var res = await new Promise(function (resolve) {
      function round(kind) {
        var myA = mine * power() * (kind === 'shoot' ? 0.9 + R.skill('shoot') * 0.15 : kind === 'charge' ? 1.1 + R.skill('sword') * 0.1 : 0.5), enA = en * (beasts ? 1.2 : 1.0) * (kind === 'defend' ? 0.4 : 1);
        var k1 = Math.min(en, Math.round(myA * U.rf(0.12, 0.25))), k2 = Math.min(mine, Math.round(enA * U.rf(0.08, 0.18) * (1 - R.def() / 40)));
        en -= k1; mine -= k2;
        if (G.Audio) G.Audio.sfx(kind === 'shoot' ? 'cannon' : 'sword');
        draw((kind === 'shoot' ? '일제 사격!' : kind === 'charge' ? '돌격!' : '방어 태세!') + ' 적 ' + k1 + ' 쓰러뜨림 · 아군 ' + k2 + '명 부상');
        if (en <= 0) return resolve('win');
        if (mine <= 0 || mine < l.party * 0.25) return resolve('lose');
      }
      [['shoot', '사격'], ['charge', '돌격'], ['defend', '방어']].forEach(function (a) { var b = U.el('button', 'btn' + (a[0] === 'charge' ? ' red' : a[0] === 'shoot' ? ' navy' : ''), a[1]); b.onclick = function () { round(a[0]); }; foot.appendChild(b); });
      var fl = U.el('button', 'btn ghost', '도망친다'); fl.onclick = function () { if (U.chance(0.6)) resolve('flee'); else { round('defend'); } }; foot.appendChild(fl);
    });
    win.close(res);
    var lost = l.party - mine; l.party = Math.max(0, mine); s.fleet.crew = Math.max(0, s.fleet.crew - lost);
    if (res === 'win') { s.player.fame += beasts ? 2 : 5; if (!beasts) { var loot = n * U.ri(8, 15); s.player.gold += loot; UI.toast('승리했다! (금화 ' + loot + '닢)', 'sword'); } else UI.toast('짐승들을 물리쳤다!', 'sword'); }
    else if (res === 'lose') { UI.toast('패배했다... 대원 ' + lost + '명을 잃었다.', 'skull'); s.fleet.fatigue = Math.min(100, s.fleet.fatigue + 20); }
    else UI.toast('간신히 도망쳤다.', 'boot');
    refreshHud();
    return res;
  }
  L.landBattle = landBattle;

  // ---------------------------------------------------------------- actions
  /** 야영지에서 며칠을 보낸다 (식량·물을 쓰고 날이 간다) */
  function spendDays(n) {
    var s = S(), l = s.loc;
    for (var i = 0; i < n; i++) { G.Game.newDay(); l.days++; var use = R.dailyUse(); s.fleet.food = Math.max(0, s.fleet.food - use); s.fleet.water = Math.max(0, s.fleet.water - use); }
  }
  async function camp() {
    var s = S(), l = s.loc, f = s.fleet;
    st.busy++;
    try {
      var terr = G.Geo.terrain(l.lon, l.lat);
      var v = await UI.ask('야영지를 차렸다. 무엇을 할까?', [
        { label: '쉰다 (3일)', value: 'rest' },
        { label: '사냥한다 (1일)', value: 'hunt' },
        { label: '정찰한다 (2일)', value: 'scout' },
        { label: '약초를 캔다 (1일)', value: 'herb' },
        { label: '그만둔다', value: null }], G.Scenes.mateSpeaker('first'));
      if (v === 'rest') {
        spendDays(3); f.fatigue = Math.max(0, f.fatigue - 25 - R.skill('ops') * 5);
        UI.toast('푹 쉬었다. 피로가 풀렸다.', 'tent');
      } else if (v === 'hunt') {
        spendDays(1);
        var rich = { grass: 1.3, steppe: 1.2, forest: 1.2, jungle: 1.0, desert: 0.35, mountain: 0.6, snow: 0.4, tundra: 0.7, ice: 0.2 }[terr] || 0.8;
        var sk = 1 + R.skill('shoot') * 0.3 + R.skill('sword') * 0.1;
        if (U.chance(0.12)) { await UI.say('사냥감을 쫓다가 도리어 사나운 짐승 떼와 마주쳤다!', {}); await landBattle('들짐승', U.ri(4, 10), true); }
        var got = Math.round(R.dailyUse() * U.rf(2, 6) * rich * sk);
        if (got > 0) { f.food += got; UI.toast('사냥에 성공했다! 식량 ' + got + '통 (약 ' + Math.round(got / R.dailyUse()) + '일분)', 'bread', 4200); }
        else UI.toast('사냥감이 보이지 않았다.', 'boot');
        f.fatigue = Math.min(100, f.fatigue + 3);
      } else if (v === 'scout') {
        spendDays(2);
        G.State.revealChart(l.lon, l.lat, 2.2 + R.skill('survey') * 0.4);
        var found = G.Explore.sense('land', l.lon, l.lat, 2.2);
        if (found.length) { await G.Explore.report(found, l.lon, l.lat, 'land'); st.marks = null; }
        else {
          var c = null, bd = 6;
          G.CITY_DATA.forEach(function (x) { if (!R.cityExists(x) || s.known.indexOf(x.id) >= 0) return; var dd = G.Geo.dist(l.lon, l.lat, x.lon, x.lat); if (dd < bd) { bd = dd; c = x; } });
          if (c && U.chance(0.6)) { s.known.push(c.id); UI.toast('정찰대가 ' + U.dirName(Math.atan2(c.lat - l.lat, G.Geo.wrapLon(c.lon - l.lon))) + '쪽에서 마을을 찾았다 — ' + c.name, 'castle', 4500); }
          else UI.toast('사방을 둘러보았지만 눈에 띄는 것은 없었다. 주변 지도는 채웠다.', 'map', 4000);
        }
        if (U.chance(0.35)) { st.fastDays = 4; UI.toast('정찰 중에 지름길을 찾았다. 며칠 동안 걸음이 빨라진다.', 'boot', 4000); }
      } else if (v === 'herb') {
        spendDays(1);
        if (U.chance(0.35 + R.skill('med') * 0.2 + R.skill('sci') * 0.1)) { st.herbs = 12; f.fatigue = Math.max(0, f.fatigue - 8); UI.toast('쓸 만한 약초를 넉넉히 캤다. 한동안 열병 걱정이 줄어든다.', 'drop', 4200); }
        else UI.toast('약초를 알아볼 사람이 없어 헛걸음했다.', 'drop');
      }
      refreshHud();
    } catch (e) { console.error(e); }
    st.busy--;
  }

  /** 원주민과 물건을 바꾼다: 금화·장신구를 주고 식량과 그 고장 특산품을 받는다 */
  async function nativeTrade(who) {
    var s = S(), l = s.loc, f = s.fleet;
    var near = null, bd = 25;
    G.CITY_DATA.forEach(function (c) { if (!c.goods || !c.goods.length) return; var dd = G.Geo.dist(l.lon, l.lat, c.lon, c.lat); if (dd < bd) { bd = dd; near = c; } });
    var good = near ? U.pick(near.goods) : null;
    var qty = U.ri(4, 12), cost = 60 + qty * 12;
    var v = await UI.ask('(손짓으로) 우리가 가진 것과 바꾸자고 한다. 식량과 ' + (good && G.GOOD[good] ? G.GOOD[good].name + ' ' + qty + '통' : '털가죽') + '을 내민다. 대신 금화 ' + cost + '닢어치의 물건을 원한다.', [{ label: '바꾼다', value: 1 }, { label: '그만둔다', value: 0 }], who);
    if (!v) return;
    if (s.player.gold < cost) { UI.toast('바꿀 만한 것이 없다.', 'coin'); return; }
    s.player.gold -= cost;
    f.food += Math.round(R.dailyUse() * 4);
    var roomKind = f.cargo[good] || Object.keys(f.cargo).length < R.maxKinds();
    if (good && G.GOOD[good] && R.free() >= qty && roomKind) {
      var cg = f.cargo[good] || (f.cargo[good] = { q: 0, cost: 0, from: null, d: s.day });
      cg.cost = Math.round(((cg.cost || 0) * cg.q + cost * 0.7) / (cg.q + qty)); cg.q += qty;
      UI.toast(G.GOOD[good].name + ' ' + qty + '통과 식량을 얻었다.', 'sack', 4200);
      var tr = G.Disc.checkTrade ? G.Disc.checkTrade(good, near) : [];
      for (var i = 0; i < tr.length; i++) await G.Disc.find(tr[i], 'trade');
    } else UI.toast('식량을 얻었다.', 'bread');
    s.player.fame += 2;
  }

  /** 지형마다 다른 사건. 일어나면 true */
  async function terrainEvent(terr) {
    var s = S(), l = s.loc, f = s.fleet, sp = G.Scenes.mateSpeaker('first');
    if (terr === 'desert') {
      if (U.chance(0.5)) {
        await UI.say('지평선이 누렇게 일어서더니 모래폭풍이 덮쳐 왔다!', {});
        var loss = Math.round(R.dailyUse() * U.rf(1, 3) * (1 - R.skill('ops') * 0.2));
        f.water = Math.max(0, f.water - loss); f.fatigue = Math.min(100, f.fatigue + 10);
        UI.toast('모래폭풍에 물 ' + loss + '통을 잃었다.', 'wind');
      } else {
        await UI.say('야자나무 그늘 아래 맑은 물이 고인 오아시스다!', sp);
        f.water += R.dailyUse() * 8; f.fatigue = Math.max(0, f.fatigue - 15);
        UI.toast('물을 가득 채우고 쉬었다.', 'drop');
      }
      return true;
    }
    if (terr === 'snow' || terr === 'tundra' || terr === 'ice') {
      await UI.say('눈보라가 몰아친다. 한 치 앞도 보이지 않는다!', {});
      if (U.chance(0.35 + R.skill('ops') * 0.15 + R.skill('med') * 0.1)) { f.fatigue = Math.min(100, f.fatigue + 8); UI.toast('서로 몸을 붙이고 눈보라를 견뎌 냈다.', 'people'); }
      else { var dd = Math.min(l.party - 1, U.ri(1, 3)); l.party -= dd; f.crew = Math.max(0, f.crew - dd); f.fatigue = Math.min(100, f.fatigue + 14); UI.toast('동상으로 대원 ' + dd + '명을 잃었다.', 'skull'); }
      return true;
    }
    if (terr === 'jungle') {
      if (U.chance(0.5)) {
        await UI.say('발밑이 꺼지며 대원 하나가 늪에 빠졌다!', {});
        if (U.chance(0.5 + R.skill('ops') * 0.15)) UI.toast('밧줄을 던져 간신히 끌어냈다.', 'people');
        else { l.party = Math.max(0, l.party - 1); f.crew = Math.max(0, f.crew - 1); UI.toast('끝내 구하지 못했다...', 'skull'); }
      } else {
        await UI.say('나무 사이로 거대한 폭포가 보인다. 물보라에 무지개가 걸렸다.', sp);
        f.fatigue = Math.max(0, f.fatigue - 6); s.player.fame += 2 + R.skill('art') * 2;
        if (R.skill('art')) UI.toast('폭포를 화첩에 그려 두었다.', 'feather');
      }
      return true;
    }
    if (terr === 'mountain') {
      if (U.chance(0.45 + R.skill('survey') * 0.15)) { st.fastDays = 5; await UI.say('산등성이를 가로지르는 옛길을 찾았습니다! 며칠은 빨리 갈 수 있겠습니다.', G.Scenes.mateSpeaker('surveyor')); }
      else { await UI.say('낙석이다! 모두 몸을 숙여라!', {}); f.fatigue = Math.min(100, f.fatigue + 8); if (U.chance(0.4)) { l.party = Math.max(0, l.party - 1); f.crew = Math.max(0, f.crew - 1); UI.toast('대원 하나가 다쳐 쓰러졌다.', 'skull'); } }
      return true;
    }
    if (terr === 'grass' || terr === 'steppe') {
      if (U.chance(0.55)) {
        await UI.say('들소 떼가 지평선을 가득 메우고 지나간다. 사냥하기 좋은 기회다!', sp);
        var got = Math.round(R.dailyUse() * U.rf(3, 7) * (1 + R.skill('shoot') * 0.3));
        f.food += got; UI.toast('식량 ' + got + '통을 얻었다.', 'bread');
      } else {
        await UI.say('말을 탄 유목민 무리가 다가와 물끄러미 바라본다. 적의는 없어 보인다.', sp);
        if (U.chance(0.5)) { st.fastDays = 4; UI.toast('유목민이 지름길을 알려 주었다. 걸음이 빨라진다.', 'boot', 4000); }
        else { var d = G.Explore.nearUnknown(l.lon, l.lat, 10, function (x) { return x.how === 'land'; }); if (d) { G.Disc.addHint(d.id, 'nomad'); UI.toast('유목민에게서 단서를 얻었다: 「' + d.name + '」', 'scroll', 4200); } }
      }
      return true;
    }
    if (terr === 'forest') {
      if (U.chance(0.5)) { await UI.say('숲이 깊어 길을 잃었다... 하루를 헤맸다.', {}); spendDays(1); f.fatigue = Math.min(100, f.fatigue + 5); }
      else { var got2 = Math.round(R.dailyUse() * U.rf(2, 4)); f.food += got2; await UI.say('숲에서 열매와 버섯을 넉넉히 모았다. (식량 ' + got2 + '통)', sp); }
      return true;
    }
    return false;
  }
  async function enterCity() {
    var c = cityNear();
    if (!c) { UI.toast('가까운 곳에 도시가 없습니다.', 'castle'); return; }
    var s = S();
    st.busy++;
    var ok = await G.Scenes.city.handleEntry(c);
    st.busy--;
    if (!ok) return;
    if (s.known.indexOf(c.id) < 0) s.known.push(c.id);
    s.landReturn = { lon: s.loc.lon, lat: s.loc.lat, base: s.loc.base, party: s.loc.party, days: s.loc.days, mount: MT() };
    var isBaseCity = s.loc.base.type === 'city' && s.loc.base.city === c.id;
    if (isBaseCity) delete s.landReturn;
    await UI.fade(function () { G.Game.go('city', { cityId: c.id, arrive: true, via: isBaseCity ? 'sea' : 'land' }); });
  }
  /** called from the city gate when the player resumes the expedition */
  L.resumeFromCity = function (c, mount) {
    var s = S(), r = s.landReturn;
    if (!r) return false;
    s.loc = { mode: 'land', lon: c.lon, lat: c.lat, heading: 0, base: r.base, party: r.party, days: r.days, mount: cleanMount(mount || r.mount) };
    return true;
  };
  async function goBack() {
    var s = S(), l = s.loc, b = l.base;
    if (!atBase()) {
      var v = await UI.ask('출발 지점까지 걸어서 돌아갑니다.', [{ label: '돌아간다', value: 1 }, { label: '그만둔다', value: 0 }], G.Scenes.mateSpeaker('first'));
      if (v) { st.path = [b.lon + (b.type === 'ship' ? 0 : 0), b.lat]; if (b.type === 'ship') { var lp = nearestLand(b.lon, b.lat); if (lp) st.path = lp; } st.paused = false; refreshBar(); }
      return;
    }
    await returnToBase(false);
  }
  function nearestLand(lon, lat) {
    for (var r = 0.05; r < 0.6; r += 0.05) for (var a = 0; a < 16; a++) { var x = lon + Math.cos(a / 16 * 6.283) * r, y = lat + Math.sin(a / 16 * 6.283) * r; if (G.Geo.isLand(x, y)) return [x, y]; }
    return null;
  }
  /** 탐험을 마칠 때 한 줄로 돌아본다 */
  function summary() {
    var s = S(), l = s.loc;
    var found = s.stats.found - (l.found0 != null ? l.found0 : s.stats.found);
    var seen = Object.keys(s.marks || {}).length - (l.marks0 || 0);
    var lost = (l.party0 || l.party) - l.party;
    return '탐험 ' + (l.days || 0) + '일 · 새 발견 ' + found + '건' + (seen > 0 ? ' · 본 것 ' + seen + '곳' : '') + (lost > 0 ? ' · 잃은 대원 ' + lost + '명' : ' · 모두 무사');
  }
  async function returnToBase(wiped) {
    var s = S(), b = s.loc.base, mt = MT();
    var sum = summary();
    // 탈것: 도시로 돌아오면 성문 마구간에 맡기고, 배로 돌아가면 싣지 못하니 해안 마을에 넘긴다. 짐꾼은 품삯을 받고 돌아간다
    if (mt.id !== 'walk' && mt.n > 0 && !wiped) {
      var Mm = G.Mounts.get(mt.id);
      if (Mm.hire) sum += ' · 짐꾼들은 품삯을 받고 돌아갔다';
      else if (b.type === 'city') { s.stable = s.stable || {}; var old = s.stable[b.city]; s.stable[b.city] = old && old.id === mt.id ? { id: mt.id, n: old.n + mt.n, draft: mt.draft } : { id: mt.id, n: mt.n, draft: mt.draft }; sum += ' · ' + Mm.name + U.jx(Mm.name, '은/는') + ' 성문 마구간에 맡겼다'; }
      else { var gold = Math.round(Mm.price * mt.n * 0.3); s.player.gold += gold; sum += ' · ' + Mm.name + U.jx(Mm.name, '은/는') + ' 배에 실을 수 없어 해안 마을에 넘겼다(금화 ' + U.num(gold) + '닢)'; }
    }
    s.loc.mount = { id: 'walk', n: 0 };
    delete s.landReturn;
    G.State.log('육상 탐험을 마쳤다 — ' + sum);
    setTimeout(function () { UI.toast('육상 탐험을 마쳤다 — ' + sum, 'boot', 6000); }, 700);
    if (b.type === 'city') await UI.fade(function () { G.Game.go('city', { cityId: b.city, via: 'sea' }); });
    else { s.loc = { mode: 'sea', lon: b.lon, lat: b.lat, heading: 0 }; await UI.fade(function () { G.Game.go('sea', { resume: true, msg: wiped ? '탐험대를 잃고 배로 돌아왔다.' : '탐험을 마치고 배로 돌아왔다.' }); }); }
  }
  async function chart() {
    st.busy++;
    var s = S(), l = s.loc;
    var win = UI.window({ title: '주변 지도', icon: 'map', width: 1160, html: '<div class="chartwrap"></div>', buttons: [{ label: '닫기', value: 1 }] });
    G.ChartView.mount(win.content.querySelector('.chartwrap'), { w: 1100, h: 550, center: [l.lon, l.lat], span: 60 });
    await win.result;
    st.busy--;
  }

  // ---------------------------------------------------------------- render
  function render() {
    var s = S(), l = s.loc, r = G.Game.renderer;
    if (r) r.draw({ lon: st.cam.lon, lat: st.cam.lat, zoom: st.cam.zoom, time: st.t, wind: [0.4, 0.2], cloud: 0.25, edge: 0.6, mode: 0, dusk: 0, storm: 0, quality: 1, cssWidth: 1600 });
    var cv = G.Game.canvases().overlay, ctx = cv.getContext('2d'), k = G.Game.overlayScale || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.setTransform(k, 0, 0, k, 0, 0);
    var ff = fontFam();
    // base marker
    var bp = toScreen(l.base.lon, l.base.lat);
    if (l.base.type === 'ship') { var bsh = S().fleet.ships[0], blk = bsh ? A.shipLook(bsh.type, { sails: bsh.sails, flag: '#1d3f7a' }) : { sails: ['sq', 'lat'], hull: '#5a3a22', cross: true }; blk.furl = 1; A.shipTop(ctx, bp[0], bp[1], 0.5, G.Scenes.sea.shipPx ? G.Scenes.sea.shipPx() * 0.85 : 80, blk, st.t); }
    // cities
    knownInland().forEach(function (c) {
      var p = toScreen(c.lon, c.lat); if (p[0] < -50 || p[0] > 1650 || p[1] < -50 || p[1] > 950) return;
      ctx.fillStyle = '#5a2a1a'; ctx.strokeStyle = '#f2e7cc'; ctx.lineWidth = 2; ctx.beginPath(); ctx.rect(p[0] - 7, p[1] - 7, 14, 14); ctx.fill(); ctx.stroke();
      ctx.font = '700 16px ' + ff; var tw = labelW[c.id] || (labelW[c.id] = ctx.measureText(c.name).width); ctx.fillStyle = 'rgba(20,14,8,.62)'; ctx.fillRect(p[0] + 10, p[1] - 11, tw + 10, 21); ctx.fillStyle = '#f2e7cc'; ctx.textAlign = 'left'; ctx.fillText(c.name, p[0] + 15, p[1] + 5);
    });
    // contract zone
    var ct = s.contract && G.DISC[s.contract.disc];
    if (ct && ct.how === 'land' && G.Disc.hasHint(ct.id) && !G.Disc.foundByMe(ct.id)) {
      var rng = U.makeRng(U.strHash(ct.id)); var zc = toScreen(ct.lon + (rng() - 0.5) * 1.2, ct.lat + (rng() - 0.5) * 1.2);
      ctx.strokeStyle = 'rgba(200,40,30,.6)'; ctx.setLineDash([8, 8]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(zc[0], zc[1], 1.3 * st.cam.zoom, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    }
    // 정찰대가 알아챈 것
    if (!st.marks || (st.f || 0) % 20 === 0 || st.marksVer !== G.Explore.ver) { st.marks = G.Explore.markers(l.lon, l.lat, 'land'); st.marksVer = G.Explore.ver; }
    st.marks.forEach(function (m) {
      var mp = toScreen(m.lon, m.lat);
      if (mp[0] < -300 || mp[0] > 1900 || mp[1] < -300 || mp[1] > 1200) return;
      G.Explore.drawMarker(ctx, m, mp, m.r * st.cam.zoom, st.t, ff);
    });
    // 지나온 길 (멀리는 옅은 점선, 가까이는 발자국·바퀴 자국)
    ctx.strokeStyle = 'rgba(90,40,20,.30)'; ctx.lineWidth = 2; ctx.setLineDash([3, 6]); ctx.beginPath();
    var lastP = null;
    st.trail.forEach(function (t, i) { var p = toScreen(t[0], t[1]); if (lastP && Math.abs(p[0] - lastP[0]) + Math.abs(p[1] - lastP[1]) < 80) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); lastP = p; }); ctx.stroke(); ctx.setLineDash([]);
    var mt = MT(), terrNow = G.Geo.terrain(l.lon, l.lat), psz = (G.FX && G.FX.party && G.FX.party.size) || 1;
    var tp = [toScreen(l.lon, l.lat)];
    for (var ti = st.trail.length - 1; ti >= 0 && tp.length < 220; ti--) { var q = toScreen(st.trail[ti][0], st.trail[ti][1]), pv = tp[tp.length - 1]; if (Math.abs(q[0] - pv[0]) + Math.abs(q[1] - pv[1]) > 40) break; tp.push(q); }
    G.Party.drawTracks(ctx, tp.slice(0, 140), mt.id, terrNow, psz);
    // destination
    if (st.path) { var dp = toScreen(st.path[0], st.path[1]), pp0 = toScreen(l.lon, l.lat); ctx.strokeStyle = 'rgba(255,245,220,.8)'; ctx.setLineDash([6, 7]); ctx.beginPath(); ctx.moveTo(pp0[0], pp0[1]); ctx.lineTo(dp[0], dp[1]); ctx.stroke(); ctx.setLineDash([]); ctx.beginPath(); ctx.arc(dp[0], dp[1], 8, 0, 7); ctx.stroke(); }
    // 탐험대 모형: 발밑 먼지 → 고리 → 줄지어 선 대원들
    var pp = tp[0], mvg = (st.movT || 0) > 0;
    G.Party.drawFx(ctx, st.pfx, toScreen);
    st.unitItems = G.Party.draw(ctx, { ring: 1, pts: tp, head: l.heading, moving: mvg, phase: st.gph, dist: st.gdist, t: st.t, mount: mt, party: l.party, draft: mt.draft, region: mt.style, gather: st.gather, face: st.face, flag: '#1d3f7a', gait: mt.id === 'horse' && (st.mk || 1) > 2.1 ? 'trot' : 'walk', cache: st.unit });
    // 도시 이름은 탐험대 위에 (가려지지 않게)
    knownInland().forEach(function (c) {
      var p = toScreen(c.lon, c.lat); if (p[0] < -50 || p[0] > 1650 || p[1] < -50 || p[1] > 950) return;
      if (Math.abs(p[0] - pp[0]) > 160 || Math.abs(p[1] - pp[1]) > 90) return;
      ctx.font = '700 16px ' + ff; var tw2 = labelW[c.id] || (labelW[c.id] = ctx.measureText(c.name).width); ctx.fillStyle = 'rgba(20,14,8,.62)'; ctx.fillRect(p[0] + 10, p[1] - 11, tw2 + 10, 21); ctx.fillStyle = '#f2e7cc'; ctx.textAlign = 'left'; ctx.fillText(c.name, p[0] + 15, p[1] + 5);
    });
    // status
    if ((st.f = (st.f || 0) + 1) % 8 === 0 && el.status) {
      var near = cityNear();
      var tN = G.Geo.terrain(l.lon, l.lat), tK = tN === 'sea' ? 'grass' : tN, M = G.Mounts, mt2 = MT();
      var su2 = M.suit(mt2.id, tK), how = mt2.id === 'walk' ? '도보' : M.get(mt2.id).name + ' ' + mt2.n + (mt2.id === 'porter' ? '패' : mt2.id === 'wagon' || mt2.id === 'reindeer' ? '대' : '필');
      var effTxt = mt2.id === 'walk' ? '' : ' — 걸음 ×' + M.speed(mt2, tK, l.party).toFixed(1) + ' · 피로 ×' + M.fatigue(mt2, tK, l.party).toFixed(2) + (M.cover(mt2, l.party) < 1 ? ' (짐승이 모자라 효과가 ' + Math.round(M.cover(mt2, l.party) * 100) + '%)' : '') + ' · 이 땅 <span class="suit ' + su2.cls + '">' + su2.mark + '</span>';
      el.status.innerHTML = (st.paused ? '<b>⏸ 정지</b> · ' : '') + (st.dir ? U.dirName(Math.atan2(st.dir[1], st.dir[0])) + '쪽으로 걷는 중 · Space 정지' : st.path ? '이동 중' : '땅을 클릭하거나 방향키·숫자판으로 움직이십시오') + ' · 탐험 ' + (l.days || 0) + '일째 · ' + how + effTxt + '<br><span class="coord">' + (TERR[tN] || TERR.grass).name + ' · ' + (l.base.type === 'ship' ? '배까지 ' : '출발 도시까지 ') + G.Geo.dist(l.lon, l.lat, l.base.lon, l.base.lat).toFixed(1) + '°' + (near ? ' · ' + near.name + ' 근처' + (function () { var of = G.Mounts.offers(near, S().date.y).map(function (id) { return G.Mounts.get(id).name; }); return of.length ? ' (성문 마구간: ' + of.join('·') + ')' : ''; })() : '') + '</span>';
      el.city.classList.toggle('disabled', !near);
      el.back.innerHTML = G.icon('anchor') + (atBase() ? (l.base.type === 'ship' ? '배에 오른다' : '도시로 돌아간다') : '출발지로 돌아간다');
    }
  }
})(window.G = window.G || {});
