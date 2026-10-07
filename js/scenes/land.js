/* Land exploration: an expedition party walks inland from a port gate or a landing point. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, A = G.Art;
  var L = {};
  G.Scenes.land = L;
  var DAY_SEC = 1.3;
  var st = null;
  function S() { return G.Game.state; }
  function zoomBy(k) { st.cam.zoomT = U.clamp((st.cam.zoomT || st.cam.zoom) * k, 80, 700); }
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
      // 대항해시대 3처럼 선원 모두가 탐험대로 나선다 (배는 닻을 내리고 기다린다)
      var party = s.fleet.crew;
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
    if (G.EventFx) G.EventFx.preload('land');
    if (G.Party.preloadSprites) G.Party.preloadSprites(MT().id);
  };
  function newSt(start) { return { cam: { lon: start[0], lat: start[1], zoom: 170 }, path: null, t: 0, busy: 0, paused: true, dayAcc: 0, speed: 1, trail: [], seen: {}, near: null, lastHint: -99, gph: 0, gdist: 0, gather: 1, face: 1, pfx: G.Party.newFx(), unit: {} }; }
  L.runtime = function () { return st; };
  L.refreshBar = function () { if (st && st.alive) refreshBar(); };
  function cleanMount(m) { return m && m.id && m.id !== 'walk' && m.n > 0 ? { id: m.id, n: m.n, draft: m.draft || 'horse', style: m.style || null } : { id: 'walk', n: 0 }; }
  function MT() { var l = S().loc; return l.mount || (l.mount = { id: 'walk', n: 0 }); }
  L.mount = MT;
  L.exit = function () { if (st) { st.alive = false; if (st.unkey) st.unkey(); } };

  // ---------------------------------------------------------------- UI
  var el = {};
  function buildUI() {
    var s = S();
    UI.clearScreen();
    // 육상 탐험 중: 날짜 · 위도 · 경도 · 탐험 일수 · 대원 · 식량 · 식수 · 피로 · 지형 · 탈것 · 계약 | 소지금 · 명성
    var H = G.Game.hud;
    UI.hud.show([
      { k: 'date', icon: 'calendar', label: '날짜', text: H.date() },
      { k: 'lat', icon: 'compass', label: '위도', text: H.lat() },
      { k: 'lon', label: '경도', text: H.lon() },
      { k: 'days', icon: 'tent', label: '탐험', text: '' },
      { k: 'party', icon: 'people', label: '대원', text: '' },
      { k: 'cost', icon: 'coin', label: '하루 경비', text: '', tip: '육상 탐험 중에는 배의 식량·물을 쓰지 않고, 그 고장에서 먹을 것과 물을 사고 길잡이·짐꾼 삯을 금화로 냅니다.' },
      { k: 'food', icon: 'bread', label: '식량', text: '' },
      { k: 'water', icon: 'drop', label: '식수', text: '' },
      { k: 'fat', icon: 'hourglass', label: '피로', text: '' },
      { k: 'terr', icon: 'land', label: '지형', text: '' },
      { k: 'mount', icon: 'boot', label: '탈것', text: '' },
      { k: 'contract', icon: 'seal', label: '계약', text: '' },
      { grow: true },
      { k: 'gold', icon: 'coin', label: '소지금', text: H.gold() },
      { k: 'fame', icon: 'laurel', label: '명성', text: U.num(s.player.fame) }
    ]);
    var catcher = U.el('div', 'mapcatch'); catcher.style.cssText = 'position:absolute;inset:0;z-index:5;cursor:crosshair';
    catcher.addEventListener('mousedown', onDown);
    catcher.addEventListener('mousemove', function (e) { st.mouse = pos(e); });
    catcher.addEventListener('wheel', function (e) { e.preventDefault(); zoomBy(e.deltaY > 0 ? 1 / 1.15 : 1.15); }, { passive: false });
    UI.pinch(catcher, zoomBy);
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
    [['＋', 1.25], ['－', 0.8]].forEach(function (z) { var b = U.el('button', 'btn small', z[0]); b.onclick = function (e) { e.stopPropagation(); zoomBy(z[1]); }; zb.appendChild(b); });
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
    if (k === '+' || k === '=') { zoomBy(1.2); return true; }
    if (k === '-') { zoomBy(1 / 1.2); return true; }
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
    var H = G.Game.hud;
    UI.hud.set('date', H.date());
    UI.hud.set('lat', H.lat()); UI.hud.set('lon', H.lon());
    UI.hud.set('days', (l.days || 0) + '일째');
    UI.hud.set('party', l.party + '명');
    var dc = dailyCost(); UI.hud.set('cost', U.num(dc) + '닢', s.player.gold < dc * 5);
    var food = H.supply('food'), water = H.supply('water');
    UI.hud.set('food', food.text, food.warn); UI.hud.set('water', water.text, water.warn);
    UI.hud.set('fat', Math.round(f.fatigue) + '%', f.fatigue > 60);
    var k = H.contract(); UI.hud.set('contract', k.text, k.warn); UI.hud.tip('contract', k.tip);
    UI.hud.set('fame', U.num(s.player.fame));
    var t = G.Geo.terrain(l.lon, l.lat), mt = MT(), M = G.Mounts;
    UI.hud.set('terr', (TERR[t] || TERR.grass).name);
    var sk = t === 'sea' ? 'grass' : t, sp = M.speed(mt, sk, l.party), su = M.suit(mt.id, sk);
    UI.hud.set('mount', mt.id === 'walk' ? '도보' : M.get(mt.id).name + ' ×' + sp.toFixed(1) + ' <small class="suit ' + su.cls + '">' + su.mark + '</small>', mt.id !== 'walk' && su.cls === 'bad');
    UI.hud.set('gold', H.gold());
  }
  function pos(e) { var r = G.Game.canvases().overlay.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 1600, (e.clientY - r.top) / r.height * 900]; }
  // st.qo: 이번 장면을 그릴 때 쓴 지진 흔들림(화면 px, js/art/quakefx.js). 카메라(st.cam)에는 더하지 않고 그리기·클릭 변환에만 넣는다
  function toScreen(lon, lat) { var o = st.qo; return [800 + G.Geo.wrapLon(lon - st.cam.lon) * st.cam.zoom + (o ? o[0] : 0), 450 - (lat - st.cam.lat) * st.cam.zoom + (o ? o[1] : 0)]; }
  function toWorld(x, y) { var o = st.qo; return [st.cam.lon + (x - (o ? o[0] : 0) - 800) / st.cam.zoom, st.cam.lat - (y - (o ? o[1] : 0) - 450) / st.cam.zoom]; }
  function onDown(e) {
    if (e.button !== 0 || UI.busy() || st.busy) return;
    var p = pos(e), w = toWorld(p[0], p[1]);
    var c = cityAt(p[0], p[1]); if (c) w = [c.lon, c.lat];
    var landmark = !c && landmarkAt(p[0], p[1]); if (landmark) w = [landmark.lon, landmark.lat];
    var mk = !c && !landmark && G.Explore.markerAt(st.marks || [], toScreen, p[0], p[1]);
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
  function cityAt(x, y) { var best = null, bd = Infinity; knownInland().forEach(function (c) { var p = toScreen(c.lon, c.lat), d = (p[0] - x) * (p[0] - x) + (p[1] - y) * (p[1] - y), hit = Math.max(24, G.CityIcon.metrics(c, 1.15).radius + 5); if (d <= hit * hit && d < bd) { bd = d; best = c; } }); return best; }
  function landmarkAt(x, y) { return G.DiscoveryIcon ? G.DiscoveryIcon.at(G.DiscoveryIcon.visible(), toScreen, x, y, 1.15) : null; }
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
      var v = tv * mk * (1 + R.skill('ops') * 0.1) * (s.fleet.fatigue > 70 ? 0.7 : 1) * (l.party > 20 ? 0.9 : 1) * (st.fastDays > 0 ? 1.45 : 1) * (G.Disaster ? G.Disaster.slow(l.lon, l.lat) : 1);   // 재해의 자취 안에서는 느리다
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
    var dxc = G.Geo.wrapLon(l.lon - st.cam.lon), kc = 1 - Math.exp(-dt * 3);
    st.cam.lon = G.Geo.wrapLon(st.cam.lon + dxc * kc); st.cam.lat += (l.lat - st.cam.lat) * kc;
    // 확대·축소: 목표 쪽으로 부드럽게 (바다와 같은 빠르기)
    if (st.cam.zoomT) {
      var zr = st.cam.zoomT / st.cam.zoom;
      if (Math.abs(zr - 1) < 0.004) { st.cam.zoom = st.cam.zoomT; st.cam.zoomT = 0; }
      else st.cam.zoom *= Math.pow(zr, 1 - Math.exp(-dt * ((G.FX.ship && G.FX.ship.zoomEase) || 12)));
    }
    st.rframe = (st.rframe || 0) + 1;
    var idle = st.busy > 0 || UI.busy();
    var quake = G.Quake && G.Quake.active();
    if (idle && st.rframe % 3 !== 0 && !quake) return;              // 대화 중에는 20fps (땅이 흔들리는 동안은 매 장면)
    if (st.paused && !idle && st.rframe % 2 !== 0 && !quake) return; // 멈춰 있을 때는 30fps
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
    st.pxs = (st.pxs || 0) + (moved / Math.max(dt, 1e-3) - (st.pxs || 0)) * Math.min(1, dt * 3);   // 화면에서 초당 움직인 거리 (뛰기·질주 그림을 고른다)
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
      var mt = MT(), M = G.Mounts;
      payDay(msgs, terr);
      // 피로: 걸음의 피로는 탈것이 덜어 주고, 추위는 털옷·썰매가 조금 덜어 준다
      f.fatigue = U.clamp(f.fatigue + (1.4 + (T.thirst ? 0.6 : 0)) * M.fatigue(mt, terr, l.party) + (T.cold ? 1 : 0) * M.cold(mt, l.party) - R.skill('ops') * 0.3, 0, 100);
      f.fatigue = Math.max(0, f.fatigue - R.skillRead('cook') * ((((G.BALANCE || {}).crewCare || {}).landCook) || 0.15));   // 요리: 야영지 끼니
      // 알맞지 않은 땅에서는 짐승을 잃는다
      var rk = M.risk(mt, terr);
      if (rk > 0 && mt.n > 0 && U.chance(Math.min(0.5, rk * (1 + mt.n / 8)))) {
        mt.n--; msgs.push({ icon: 'skull', text: M.lossText(mt.id, terr) + (mt.n > 0 ? ' (남은 ' + M.get(mt.id).name + ' ' + mt.n + ')' : '') });
        if (mt.n <= 0) { msgs.push({ icon: 'boot', text: '이제 모두 걸어서 간다.' }); l.mount = { id: 'walk', n: 0 }; }
      }
      if (T.sick && U.chance((0.04 - R.skill('med') * 0.01) * (st.herbs > 0 ? 0.3 : 1))) { var sk = U.ri(1, 2); l.party = Math.max(0, l.party - sk); f.crew = Math.max(0, f.crew - sk); msgs.push({ icon: 'skull', text: '열병으로 대원 ' + sk + '명을 잃었다.' }); }
      G.State.revealChart(l.lon, l.lat, 0.6 + R.skill('survey') * 0.2 + G.Mounts.scout(MT(), l.party));
      // discover inland cities
      G.CITY_DATA.forEach(function (c) { if (!R.cityExists(c) || s.known.indexOf(c.id) >= 0) return; if (G.Geo.dist(l.lon, l.lat, c.lon, c.lat) < 0.8) { s.known.push(c.id); UI.toast('새로운 도시 「' + c.name + '」' + U.jx(c.name, '을/를') + ' 발견했다!', 'castle', 4000); G.Fame.add('ex', 5); } });
      msgs.forEach(function (m) { UI.toast(m.text, m.icon); });
      refreshHud();
      // 자연재해: 지진·화산·산사태·쓰나미·홍수가 탐험대를 덮친다 (js/systems/disaster.js)
      if (G.Disaster) { await G.Disaster.land({ spend: spendDays, dailyCost: function () { return dailyCost(); }, mount: MT, refresh: refreshHud }); if (l.party <= 0 || f.crew <= 0) { await UI.say('탐험대가 전멸했다...', {}); if (f.crew <= 0) { st.busy--; await G.Family.retire(true); return; } l.party = 0; await returnToBase(true); st.busy--; return; } }
      // discoveries
      var chk = G.Disc.checkLand(l.lon, l.lat);
      for (var i = 0; i < chk.hits.length; i++) {
        var d = chk.hits[i];
        var pzd = G.Games.puzzleDue ? G.Games.puzzleDue(d) : G.Games.puzzleKind ? G.Games.puzzleKind(d) : null;   // 어느 장치로 잠겼는지는 js/games/puzzle.js
        if (pzd === 'rest') await UI.say(G.Games.puzzleRestLine(d), G.Scenes.mateSpeaker('surveyor'));   // 얼마 전에 장치를 풀었다 — 이곳은 부서져 있다
        else if (pzd) {
          await UI.say(G.Games.puzzleLine ? G.Games.puzzleLine(d) : '제독, 이 유적 안쪽에 무언가 있습니다. 하지만 장치로 굳게 잠겨 있군요...', G.Scenes.mateSpeaker('surveyor'));
          var ok = await G.Games.puzzle(d);
          if (!ok) { await UI.say('장치를 풀지 못했다. 다음에 다시 와 보자.', {}); continue; }
        } else await UI.say(landLine(d), G.Scenes.mateSpeaker('surveyor'));
        await G.Disc.find(d, 'land');
      }
      // 두고 온 유물을 가지러 왔다
      var lefts = G.Disc.leftHere('land', l.lon, l.lat);
      for (var li = 0; li < lefts.length; li++) await G.Disc.pickupLeft(lefts[li]);
      // 정찰대: 가까운 발견물을 알아채고 지도에 표식을 남긴다
      var sensed = G.Explore.sense('land', l.lon, l.lat, Math.max(st.scoutBoost || 1, 1 + G.Mounts.scout(MT(), l.party)));
      st.scoutBoost = 0;
      if (sensed.length) { await G.Explore.report(sensed, l.lon, l.lat, 'land'); st.marks = null; }
      if (st.herbs > 0) st.herbs--;
      if (st.fastDays > 0) st.fastDays--;
      // random encounters (지형마다 다른 사건이 먼저 일어날 수 있다)
      if (U.chance(0.1) && !(G.Tutorial && G.Tutorial.quiet && G.Tutorial.quiet())) { if (!(U.chance(0.55) && await terrainEvent(terr))) await encounter(terr); }   // 튜토리얼에서는 우연한 만남을 재운다
      if (l.party <= 0 || f.crew <= 0) { await UI.say('탐험대가 전멸했다...', {}); if (f.crew <= 0) { st.busy--; await G.Family.retire(true); return; } l.party = 0; await returnToBase(true); }
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
      var nativeSeed = 'native' + Math.floor(l.lon) + ':' + Math.floor(l.lat), nativeSpec = A.nativeSpec(nativeSeed, l.lon, l.lat);
      // 문화권 전용 그림이 있으면 쓰되, 모든 대륙을 같은 모습으로 만드는 옛 공통 그림은 쓰지 않는다.
      A.withImg(nativeSpec, [A.rolePortraitKey(nativeSpec), 'portraits/npc/native_' + nativeSpec.style]);
      var who = { name: nativeSpec.localName || '현지 주민', portrait: nativeSpec, lang: 3, li: l.lon < -30 ? 11 : l.lon > 90 ? 12 : 10, minLv: 1 };
      var v = await UI.ask('원주민 무리를 만났다. 이쪽을 경계하고 있다.', [{ label: '선물을 준다', value: 'gift' }, { label: '말을 건다', value: 'talk' }, { label: '물건을 바꾼다', value: 'trade' }, { label: '지나간다', value: null }], who);
      if (v === 'trade') { await nativeTrade(who); refreshHud(); return; }
      if (v === 'gift') { await nativeGift(who); refreshHud(); return; }
      else if (v === 'talk') {
        if (U.chance(0.5 + R.skill('speech') * 0.1)) { var d2 = nearHint(); if (d2) { G.Disc.addHint(d2.id, 'native'); await UI.say('(알아듣기 힘든 말이지만) ' + d2.hint, who); } else UI.toast('원주민들이 길을 가르쳐 주었다.', 'compass'); }
        else { await UI.say('원주민들이 화가 나서 달려든다!', {}); await landBattle('원주민 전사', foeSize(0.45, 0.95, 8), false, { kind: 'native' }); }
      }
    } else if (r < 0.55) {
      var bz = G.EventFx ? G.EventFx.beastsHere() : null;   // 그 땅의 짐승 (육상전에 나오는 짐승과 같다)
      var fxB = bz ? G.EventFx.show('beast', { animal: bz[1], pack: bz[0], bg: terr }) : null;
      await UI.say(U.pick(['사나운 짐승 떼가 습격해 왔다!', '굶주린 들짐승이 야영지를 덮쳤다!']), {});
      if (fxB) await fxB.stop();
      await landBattle('들짐승', foeSize(0.15, 0.35, 5, 40), true);
    } else if (r < 0.72) {
      await UI.say('도적 떼가 길을 막아섰다! "가진 것을 모두 내놓아라!"', {});
      var v2 = await UI.ask('어떻게 할까?', [{ label: '싸운다', value: 1 }, { label: '돈을 준다', value: 0 }], G.Scenes.mateSpeaker('first'));
      if (v2) await landBattle('도적 떼', foeSize(0.4, 0.9, 10), false, { kind: 'bandit' });
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
  /** 적의 수: 탐험대(선원 전원)에 맞춰 잡는다 */
  function foeSize(a, b, lo, hi) { var p = S().loc.party || 10; return U.clamp(Math.round(p * U.rf(a, b)), lo || 3, hi || 400); }
  /** 원주민에게 선물한다: 기뻐하면 식량과 물을 나누어 주고(보급), 때로는 더 얹어 주거나 모닥불 곁에 재워 준다(캠프파이어 — 여관처럼 쉰다) */
  async function nativeGift(who) {
    var s = S(), l = s.loc, f = s.fleet, use = R.dailyUse();
    var cost = Math.round((60 + l.party * 3) / 10) * 10;
    var trinkets = s.player.items.filter(function (it) { var d = G.ITEM[it.id]; return d && d.kind === 'gift' && !d.ring && !R.isProof(it); });
    var opts = [{ label: '자잘한 물건을 건넨다 (금화 ' + U.num(cost) + '닢어치 — 유리구슬·천·칼)', value: 'gold', dis: s.player.gold < cost }]
      .concat(trinkets.slice(0, 4).map(function (it, i) { return { label: '장신구를 건넨다: ' + R.itemName(it), value: 'it' + i, thumb: G.Img.itemSrc(it) }; }))
      .concat([{ label: '그만둔다', value: null }]);
    var v = await UI.ask('무엇을 선물할까? 장신구처럼 귀한 것을 건네면 더 반긴다.', opts, G.Scenes.mateSpeaker('first'));
    if (!v) return;
    var worth;
    if (v === 'gold') { s.player.gold -= cost; worth = 1; }
    else { var it = trinkets[+v.slice(2)]; s.player.items.splice(s.player.items.indexOf(it), 1); worth = 1.4 + (G.ITEM[it.id].gv || 5) / 25; }
    var pOk = U.clamp(0.72 + R.skill('speech') * 0.06 + (worth - 1) * 0.3, 0, 0.97);
    if (!U.chance(pOk)) { UI.toast('원주민들은 선물만 받고 숲으로 사라졌다.', 'people', 4000); return; }
    // 보급: 탐험대 전원이 며칠 먹고 마실 만큼
    var days = Math.round(U.rf(6, 10) * worth), roll = U.rand();
    var extra = roll < 0.28 + (worth - 1) * 0.2, fire = !extra && roll < 0.28 + (worth - 1) * 0.2 + 0.3 + (f.fatigue > 40 ? 0.15 : 0);
    if (extra) days = Math.round(days * 1.8);
    f.food += Math.round(use * days); f.water += Math.round(use * days);
    G.Fame.add('so', 1);
    if (extra) {
      await UI.say(U.pick(['(손짓으로) 먼 길을 가는 손님이니 넉넉히 가져가라고 한다.', '(웃으며) 선물이 마음에 든 모양이다. 광주리 가득 먹을 것을 내온다.']), who);
      UI.toast('추가 보급! 식량과 물을 약 ' + days + '일분씩 얻었다.', 'bread', 4800);
    } else UI.toast('원주민들이 기뻐하며 식량과 물을 약 ' + days + '일분씩 나누어 주었다.', 'bread', 4200);
    if (fire) await campfire(who);
    var d = U.chance(fire ? 0.8 : 0.45) ? nearHint() : null;
    if (d) { G.Disc.addHint(d.id, 'native'); await UI.say('(손짓발짓으로) ' + d.hint, who); UI.toast('단서를 얻었다: 「' + d.name + '」', 'scroll'); }
  }
  /** 캠프파이어: 원주민의 모닥불 곁에서 하룻밤 — 여관에서처럼 피로가 풀리고 몸이 낫는다 */
  async function campfire(who) {
    var s = S(), f = s.fleet, l = s.loc;
    spendDays(1);
    var fat0 = f.fatigue, hp0 = s.player.hp;
    f.fatigue = 0; s.player.hp = 100;
    (s.mates || []).forEach(function (m) { if (m.hurt) m.hurt = Math.max(0, m.hurt - 3); });
    var cv = A.canvas(720, 300);
    var win = UI.window({ title: '캠프파이어', icon: 'tent', width: 780, html: '<div class="campfire"><div class="cf-art"></div><div class="cf-text">' +
      U.pick(['원주민들이 모닥불 곁에 자리를 내주었다. 구운 고기와 곡물 죽이 돌고, 북소리에 맞춰 노래가 이어진다.', '밤이 되자 원주민들이 커다란 모닥불을 피웠다. 대원들은 오랜만에 배불리 먹고, 불 곁에서 깊이 잠들었다.', '모닥불 너머로 원주민의 이야기꾼이 조상들의 긴 여행 이야기를 들려준다. 말은 몰라도 대원들의 얼굴이 밝아진다.']) +
      '</div><div class="cf-res">피로 ' + Math.round(fat0) + ' → 0 · 제독 체력 ' + Math.round(hp0) + ' → 100 · 하루가 지났다</div></div>', buttons: [{ label: '날이 밝았다', value: 1, cls: 'navy' }] });
    win.content.querySelector('.cf-art').appendChild(cv);
    var t0 = performance.now(), live = true;
    win.result.then(function () { live = false; });
    (function loop() { if (!live) return; drawCampfire(cv.getContext('2d'), 720, 300, (performance.now() - t0) / 1000, l.lon); requestAnimationFrame(loop); })();
    if (G.Audio) G.Audio.sfx('discover');
    await win.result;
    refreshHud();
  }
  /** 모닥불 그림 (밤하늘·불꽃·둘러앉은 그림자) */
  function drawCampfire(x, w, h, t, lon) {
    var g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#070b1e'); g.addColorStop(0.7, '#1a1426'); g.addColorStop(1, '#2a160c'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    var rng = U.makeRng(7);
    for (var i = 0; i < 90; i++) { var sx = rng() * w, sy = rng() * h * 0.6, tw = 0.5 + 0.5 * Math.sin(t * 2 + i); x.fillStyle = 'rgba(255,255,240,' + (0.25 + tw * 0.5) * rng() + ')'; x.fillRect(sx, sy, 1.5, 1.5); }
    // 나무 그림자
    x.fillStyle = '#05070c';
    for (var tr = 0; tr < 7; tr++) { var tx = rng() * w, th = 90 + rng() * 80; x.beginPath(); x.moveTo(tx - 30, h * 0.72); x.lineTo(tx, h * 0.72 - th); x.lineTo(tx + 30, h * 0.72); x.fill(); }
    x.fillRect(0, h * 0.72, w, h);
    var cx = w / 2, cy = h * 0.8, fl = 1 + 0.08 * Math.sin(t * 9) + 0.05 * Math.sin(t * 23);
    var glow = x.createRadialGradient(cx, cy, 5, cx, cy, 260 * fl); glow.addColorStop(0, 'rgba(255,170,70,.55)'); glow.addColorStop(1, 'rgba(255,120,40,0)'); x.fillStyle = glow; x.fillRect(0, 0, w, h);
    // 둘러앉은 사람들 (불빛을 받은 실루엣)
    for (var p = 0; p < 9; p++) {
      var side = p % 2 ? 1 : -1, px = cx + side * (70 + Math.floor(p / 2) * 48), py = cy - 6 + Math.floor(p / 2) * 3, sway = Math.sin(t * 1.6 + p) * 2;
      x.fillStyle = p % 3 === 0 ? '#1e120a' : '#140c06';
      x.beginPath(); x.ellipse(px + sway, py - 26, 11, 20, 0, 0, 7); x.fill(); x.beginPath(); x.arc(px + sway, py - 52, 8, 0, 7); x.fill();
      x.fillStyle = 'rgba(255,150,70,.35)'; x.beginPath(); x.ellipse(px + sway - side * 6, py - 26, 4, 16, 0, 0, 7); x.fill();
    }
    // 장작과 불꽃
    x.fillStyle = '#3a2210'; x.save(); x.translate(cx, cy + 6); x.rotate(0.35); x.fillRect(-34, -4, 68, 8); x.rotate(-0.7); x.fillRect(-34, -4, 68, 8); x.restore();
    x.globalCompositeOperation = 'lighter';
    for (var k = 0; k < 26; k++) {
      var ph = (t * 1.4 + k * 0.137) % 1, fx = cx + Math.sin(k * 12.9 + t * 3) * 16 * (1 - ph), fy = cy - ph * 90 * fl, r = (1 - ph) * 16 + 3;
      x.fillStyle = 'rgba(' + (255) + ',' + Math.round(200 - ph * 150) + ',' + Math.round(80 - ph * 70) + ',' + (0.55 * (1 - ph)) + ')';
      x.beginPath(); x.arc(fx, fy, r, 0, 7); x.fill();
    }
    for (var e = 0; e < 8; e++) { var eph = (t * 0.5 + e * 0.13) % 1; x.fillStyle = 'rgba(255,190,90,' + (1 - eph) + ')'; x.fillRect(cx + Math.sin(e * 7 + t) * 40 * eph, cy - 40 - eph * 160, 2, 2); }
    x.globalCompositeOperation = 'source-over';
  }
  function nearHint() {
    var s = S(), l = s.loc;
    var cand = G.DISCOVERIES.filter(function (d) { return d.how === 'land' && !d.bookOnly && !G.Disc.foundByMe(d.id) && !s.hints[d.id] && G.Disc.available(d) && G.Geo.dist(l.lon, l.lat, d.lon, d.lat) < 12; });
    return cand.length ? U.pick(cand) : null;
  }
  /** 짐 나르는 짐승·마차가 있고 배에 포가 넉넉하면 가벼운 포를 끌고 다닌다 (육상전의 포병) */
  function packGuns() {
    var s = S(), mt = (s.loc && s.loc.mount) || { id: 'walk' };
    var pack = ['wagon', 'donkey', 'llama', 'yak', 'porter', 'camel', 'elephant'].indexOf(mt.id) >= 0 && mt.n > 0;
    return pack && U.sum(s.fleet.ships, function (sh) { return sh.guns.n; }) >= 4;
  }
  /** 육상전 (대항해시대 3식 부대전 — js/games/landwar.js). o: {kind: native|bandit|beast|garrison, guns} */
  async function landBattle(enemyName, n, beasts, o) {
    var s = S(), l = s.loc; o = o || {};
    var kind = o.kind || (beasts ? 'beast' : /원주민/.test(enemyName) ? 'native' : 'bandit');
    var terr = l.lon != null ? G.Geo.terrain(l.lon, l.lat) : 'grass';
    if (terr === 'sea') terr = 'grass';
    var r = await G.Games.landWar({ enemy: { name: enemyName, kind: kind, n: n }, party: l.party, terr: terr, guns: o.guns != null ? o.guns : packGuns() });
    var lost = l.party - r.left; l.party = Math.max(0, r.left); s.fleet.crew = Math.max(0, s.fleet.crew - lost);
    var res = r.res;
    if (res === 'win') {
      G.Fame.add('bt', kind === 'beast' ? 2 : 5 + (r.leaderDown ? 3 : 0));
      if (kind === 'beast') { var meat = Math.round(R.dailyUse() * U.rf(1.5, 3) * Math.min(3, n / 8)); s.fleet.food += meat; UI.toast('짐승들을 물리쳤다! 고기로 식량 약 ' + Math.round(meat / R.dailyUse()) + '일분을 얻었다.', 'bread', 4200); }
      else if (kind === 'native') UI.toast('원주민 전사들을 물리쳤다.', 'sword');
      else { var loot = n * U.ri(8, 15); s.player.gold += loot; UI.toast('승리했다! (금화 ' + loot + '닢)', 'sword'); }
    }
    else if (res === 'lose') { UI.toast('패배했다... 대원 ' + (r.dead) + '명을 잃었다.', 'skull'); s.fleet.fatigue = Math.min(100, s.fleet.fatigue + 20); }
    else UI.toast('싸움을 피해 물러났다.', 'boot');
    if (r.back) setTimeout(function () { UI.toast('쓰러졌던 대원 ' + r.back + '명이 치료를 받고 다시 일어섰다.', 'drop', 3800); }, 700);
    if (G.Game.scene === L) refreshHud();
    return res;
  }
  L.landBattle = landBattle;
  L._test = { encounter: function (t) { return encounter(t); }, terrainEvent: function (t) { return terrainEvent(t); }, nativeGift: function (w) { return nativeGift(w); }, campfire: function (w) { return campfire(w); }, runDay: function () { return runDay(); }, camp: function () { return camp(); } };

  // ---------------------------------------------------------------- actions
  /* 육상 탐험의 하루 경비: 배의 식량·물 대신 금화가 나간다 (G.BALANCE.landCost) */
  function LC() { return (G.BALANCE && G.BALANCE.landCost) || { base: 5, perMan: 1, thirsty: 0.5, unpaidFatigue: 6, desert: 0.25, water: [4, 8] }; }
  function dailyCost(terr) {
    var s = S(), l = s.loc, K = LC(), mt = MT(), M = G.Mounts;
    terr = terr || G.Geo.terrain(l.lon, l.lat); if (terr === 'sea') terr = 'grass';
    var T = TERR[terr] || TERR.grass;
    var mk = (M.use(mt, terr, l.party, 'food') + M.use(mt, terr, l.party, 'water')) / 2;   // 먹이·물을 덜 쓰는 짐승이면 그만큼 싸다
    var cw = G.Castaway ? G.Castaway.costMult() : 1;   // 표류기: 그 땅에서 살아남는 법을 알아 덜 든다
    return Math.max(1, Math.round((K.base + K.perMan * (l.party || 0)) * mk * cw * (1 + (K.thirsty || 0) * ((T.thirst || 1) - 1))));
  }
  L.dailyCost = function () { return dailyCost(); };
  /** 하루 경비를 낸다. 모자라면 가진 만큼 내고, 대원들이 지치고 몇은 떠난다 */
  function payDay(msgs, terr) {
    var s = S(), l = s.loc, f = s.fleet, K = LC(), cost = dailyCost(terr), paid = Math.min(s.player.gold, cost);
    s.player.gold -= paid;
    l.spent = (l.spent || 0) + paid;
    if (paid >= cost) return true;
    f.fatigue = Math.min(100, f.fatigue + (K.unpaidFatigue || 6));
    if (msgs && U.chance(K.desert == null ? 0.25 : K.desert) && l.party > 1) {
      var dd = Math.max(1, Math.ceil(l.party * 0.05)); l.party = Math.max(1, l.party - dd); f.crew = Math.max(0, f.crew - dd);
      msgs.push({ icon: 'skull', text: '경비를 대지 못해 대원 ' + dd + '명이 떠났다! (하루 경비 금화 ' + U.num(cost) + '닢)' });
    } else if (msgs) msgs.push({ icon: 'coin', text: '금화가 모자라 먹을 것과 삯을 다 대지 못했다. 대원들이 지쳐 간다.' });
    return false;
  }
  /** 얻은 식량·물을 배의 짐칸에 싣는다 (남는 칸만큼). 실제로 실은 양을 돌려준다 */
  function stow(kind, n) { var f = S().fleet, room = Math.max(0, Math.floor(R.free())), q = Math.max(0, Math.min(Math.round(n), room)); f[kind] = (f[kind] || 0) + q; return q; }
  /** 야영지에서 며칠을 보낸다 (날마다 경비를 내고 날이 간다) */
  function spendDays(n) {
    var s = S(), l = s.loc, msgs = [];
    for (var i = 0; i < n; i++) { G.Game.newDay(); l.days++; payDay(msgs); }
    msgs.forEach(function (m) { UI.toast(m.text, m.icon); });
  }
  async function camp() {
    var s = S(), l = s.loc, f = s.fleet;
    st.busy++;
    st.camping = true;
    try {
      var terr = G.Geo.terrain(l.lon, l.lat);
      // 사냥·물 긷기는 배의 식량·물 보급 — 배(출발한 항구)가 보이는 곳에서만 (G.BALANCE.landPack.near)
      var far = G.Cargo ? !G.Cargo.nearShip() : false, farTag = far ? ' — 배가 보이는 곳에서만' : '';
      // 배 고치기: 배가 보이는 곳에서, 상한 배가 있고 자재가 있을 때 (G.BALANCE.landRepair)
      var LR = landRepairCfg(), hurt = f.ships.filter(function (sh) { return sh.hp < sh.maxHp - 0.5; });
      var repTag = far ? ' — 배가 보이는 곳에서만' : !hurt.length ? ' — 상한 배가 없다' : (f.mat || 0) < 1 ? ' — 자재가 없다' : ' · 자재 ' + Math.floor(f.mat) + '통';
      var cwNote = G.Castaway ? G.Castaway.note() : '';
      var v = await UI.ask('야영지를 차렸다. 무엇을 할까?' + (cwNote ? '\n(' + cwNote + ')' : ''), [
        { label: '쉰다 (3일)', value: 'rest' },
        { label: '배를 고친다 (' + LR.days + '일)' + repTag, value: 'repair', dis: far || !hurt.length || (f.mat || 0) < 1 },
        { label: '사냥한다 (1일)' + farTag, value: 'hunt', dis: far },
        { label: '물을 긷는다 (1일)' + farTag, value: 'water', dis: far },
        { label: '정찰한다 (2일)', value: 'scout' },
        { label: '약초를 캔다 (1일)', value: 'herb' },
        { label: '그만둔다', value: null }], G.Scenes.mateSpeaker('first'));
      if ((v === 'hunt' || v === 'water') && far) { UI.toast('배가 보이지 않는 곳이라 식량·물을 배로 나를 수 없다. 배 가까이(' + (((G.BALANCE || {}).landPack || {}).near || 1.2) + '° 안)로 가자.', 'anchor', 4600); v = null; }
      if (v === 'rest') {
        var wb = G.Castaway ? G.Castaway.restBonus() : 0;   // 윌슨과 함께 쉬면 더 풀린다
        spendDays(3); f.fatigue = Math.max(0, f.fatigue - 25 - wb - R.skill('ops') * 5 - (R.skillRead('cook') + R.skillRead('music')) * ((((G.BALANCE || {}).crewCare || {}).restBonus) || 3));
        UI.toast(wb ? '푹 쉬었다. 대원들이 윌슨을 둘러싸고 수다를 떨며 피로를 풀었다.' : '푹 쉬었다. 피로가 풀렸다.', 'tent');
      } else if (v === 'repair') {
        await repairAtCamp(LR);
      } else if (v === 'water') {
        spendDays(1);
        // 땅의 물 많음: 숲·밀림·눈 녹은 물은 넉넉하고, 사막은 거의 없다
        var wet = { grass: 1.0, steppe: 0.6, forest: 1.2, jungle: 1.4, desert: 0.15, mountain: 1.0, snow: 0.9, tundra: 0.9, ice: 0.5 }[terr] || 0.8;
        var K = LC(), wr = K.water || [4, 8];
        var want = R.dailyUse() * U.rf(wr[0], wr[1]) * wet * Math.min(2, 0.5 + l.party / 20) * (1 + R.skill('survey') * 0.15) * (G.Castaway ? G.Castaway.findMult() : 1);
        if (want < R.dailyUse() * 0.5) UI.toast('땅이 말라 물길을 찾지 못했다.', 'drop');
        else if (R.free() < 1) UI.toast('물을 길었지만 배의 짐칸이 가득해 더 실을 곳이 없다.', 'drop', 4200);
        else { var gotW = stow('water', want); UI.toast('냇물과 샘에서 물 ' + gotW + '통을 길어 배로 날랐다. (배의 식수 약 ' + Math.round(gotW / R.dailyUse()) + '일분)', 'drop', 4200); }
        f.fatigue = Math.min(100, f.fatigue + 2);
      } else if (v === 'hunt') {
        spendDays(1);
        var rich = { grass: 1.3, steppe: 1.2, forest: 1.2, jungle: 1.0, desert: 0.35, mountain: 0.6, snow: 0.4, tundra: 0.7, ice: 0.2 }[terr] || 0.8;
        var sk = 1 + R.skill('shoot') * 0.3 + R.skill('sword') * 0.1;
        if (U.chance(0.12)) { await UI.say('사냥감을 쫓다가 도리어 사나운 짐승 떼와 마주쳤다!', {}); await landBattle('들짐승', foeSize(0.12, 0.3, 4, 30), true); }
        var got = Math.round(R.dailyUse() * U.rf(2, 6) * rich * sk * (G.Castaway ? G.Castaway.findMult() : 1));
        if (got > 0) { got = stow('food', got); UI.toast(got > 0 ? '사냥에 성공했다! 식량 ' + got + '통을 배로 날랐다. (배의 식량 약 ' + Math.round(got / R.dailyUse()) + '일분)' : '사냥은 했지만 배의 짐칸이 가득해 실을 곳이 없다.', 'bread', 4200); }
        var ck = R.skillRead ? R.skillRead('cook') : R.skill('cook');
        if (got > 0 && ck) {          // 요리: 잡아 온 고기로 저녁을 차려 피로를 덜어 준다
          var ckWho = (R.skillBest && R.skillBest('cook').who) || '제독', ckF = 3 + ck * 3;
          f.fatigue = Math.max(0, f.fatigue - ckF);
          UI.toast(ckWho + U.jx(ckWho, '이/가') + ' 사냥감으로 푸짐한 저녁을 차렸다. 피로 −' + ckF, 'bread', 4200);
        }
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
      // 같은 곳을 맴돌며 야영하면 윌슨·표류기 (js/systems/castaway.js)
      if (v && G.Castaway && G.Game.scene === L && S().loc.mode === 'land') { await G.Castaway.afterCamp(); refreshHud(); }
    } catch (e) { console.error(e); }
    st.camping = false;
    st.busy--;
  }
  function landRepairCfg() { var k = (G.BALANCE && G.BALANCE.landRepair) || {}; return { days: k.days || 2, perDay: k.perDay == null ? 0.07 : k.perDay, perSkill: k.perSkill == null ? 0.04 : k.perSkill, crewFloor: k.crewFloor == null ? 0.3 : k.crewFloor, fatigue: k.fatigue == null ? 3 : k.fatigue }; }
  /** 야영지에서 배를 고친다: 배가 보이는 물가에 대원들이 내려가 자재로 판자를 갈고 틈을 메운다.
      날마다 배마다 최대 내구 × (perDay + perSkill × 조선 특기) × 일손(대원 ÷ 최저 승원 수, crewFloor~1). 자재는 내구 1마다 matPerHp통 */
  async function repairAtCamp(LR) {
    var s = S(), l = s.loc, f = s.fleet, B = G.BALANCE || {}, mph = B.matPerHp != null ? B.matPerHp : 0.4;
    var sk = R.skill('ship'), hands = U.clamp((l.party || 0) / Math.max(1, R.crewMin()), LR.crewFloor, 1);
    var hp0 = f.ships.map(function (sh) { return sh.hp; }), mat0 = f.mat || 0, dayN = 0;
    for (var d = 0; d < LR.days; d++) {
      if ((f.mat || 0) < 0.05 || !f.ships.some(function (sh) { return sh.hp < sh.maxHp - 0.5; })) break;
      spendDays(1); dayN++;
      f.ships.forEach(function (sh) {
        if (sh.hp >= sh.maxHp) return;
        var fix = Math.min(sh.maxHp * (LR.perDay + LR.perSkill * sk) * hands, sh.maxHp - sh.hp, (f.mat || 0) / mph);
        if (fix <= 0) return;
        sh.hp += fix; f.mat = Math.max(0, (f.mat || 0) - fix * mph);
      });
      f.fatigue = Math.min(100, f.fatigue + LR.fatigue);
    }
    var lines = f.ships.map(function (sh, i) { return sh.hp - hp0[i] >= 0.5 ? sh.name + '호 ' + Math.round(hp0[i]) + '→' + Math.round(sh.hp) : null; }).filter(Boolean);
    var used = Math.round((mat0 - (f.mat || 0)) * 10) / 10;
    if (!lines.length) { UI.toast('배를 손보려 했지만 고칠 자재가 모자랐다.', 'sack', 4000); return; }
    var who = sk ? ((R.skillBest && R.skillBest('ship').who) || '제독') : null;
    UI.toast((who ? who + U.jx(who, '이/가') + ' 앞장서 ' : '대원들이 ') + dayN + '일 동안 물가에서 배를 손봤다 — ' + lines.join(', ') + ' (자재 ' + used + '통)' + ((f.mat || 0) < 1 ? ' · 자재가 다 떨어졌다' : ''), 'hammer', 5200);
  }

  /** 원주민과 물건을 바꾼다: 금화·장신구를 주고 식량과 그 고장 특산품을 받는다 */
  async function nativeTrade(who) {
    var s = S(), l = s.loc, f = s.fleet;
    var near = null, bd = 25;
    G.CITY_DATA.forEach(function (c) { if (!c.goods || !c.goods.length) return; var dd = G.Geo.dist(l.lon, l.lat, c.lon, c.lat); if (dd < bd) { bd = dd; near = c; } });
    var good = near ? U.pick(near.goods.filter(function (id) { return !(G.Slave && G.Slave.is(id)); })) : null;
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
    G.Fame.add('so', 2);
  }

  /** 지형마다 다른 사건. 일어나면 true */
  async function terrainEvent(terr) {
    var s = S(), l = s.loc, f = s.fleet, sp = G.Scenes.mateSpeaker('first'), EF = G.EventFx;
    // 소나기 (초원·숲·밀림): 물을 채우지만 젖은 길에 지친다
    if ((terr === 'grass' || terr === 'forest' || terr === 'jungle') && U.chance(0.22)) {
      var fxR = EF ? EF.show('shower', { bg: terr }) : null;
      await UI.say('하늘이 순식간에 어두워지더니 굵은 소나기가 쏟아진다! 대원들이 가죽 부대와 통을 펼쳐 빗물을 받는다.', sp);
      if (fxR) fxR.stop();
      var rainW = Math.round(R.dailyUse() * U.rf(2, 4)); f.water += rainW; f.fatigue = Math.min(100, f.fatigue + 4);
      UI.toast('빗물로 물 ' + rainW + '통을 채웠다. 젖은 길에 조금 지쳤다.', 'drop', 4000);
      return true;
    }
    if (terr === 'desert') {
      // 뙤약볕: 물이 빨리 준다 (항해술이 아니라 운용술로 버틴다)
      if (U.chance(0.3)) {
        var fxS = EF ? EF.show('sun', { bg: 'desert' }) : null;
        await UI.say('그늘 한 점 없는 모래 위로 해가 이글거린다. 대원들의 입술이 갈라진다...', {});
        if (fxS) fxS.stop();
        var heat = Math.round(dailyCost(terr) * U.rf(0.5, 1.2) * (1 - R.skill('ops') * 0.2)), hp = Math.min(s.player.gold, heat);
        s.player.gold -= hp; f.fatigue = Math.min(100, f.fatigue + 8);
        UI.toast('뙤약볕에 물을 더 사 마셨다. (금화 ' + U.num(hp) + '닢)', 'drop');
        return true;
      }
      if (U.chance(0.5)) {
        await UI.say('지평선이 누렇게 일어서더니 모래폭풍이 덮쳐 왔다!', {});
        var loss = Math.round(dailyCost(terr) * U.rf(1, 2.5) * (1 - R.skill('ops') * 0.2)), lp = Math.min(s.player.gold, loss);
        s.player.gold -= lp; f.fatigue = Math.min(100, f.fatigue + 10);
        UI.toast('모래폭풍에 물자를 잃어 다시 샀다. (금화 ' + U.num(lp) + '닢)', 'wind');
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
        f.fatigue = Math.max(0, f.fatigue - 6); G.Fame.add('ex', 2 + R.skill('art') * 2);
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
    // 출발한 성문으로 바로 들어와도 산 탈것은 사라지지 않고 마구간 장비로 돌아간다.
    if (isBaseCity) {
      var mt = MT(), mm = G.Mounts.get(mt.id);
      if (mt.id !== 'walk' && mt.n > 0 && !mm.hire) { s.stable = s.stable || {}; s.stable[c.id] = { id: mt.id, n: mt.n, draft: mt.draft }; }
      delete s.landReturn;
    }
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
    return '탐험 ' + (l.days || 0) + '일 · 새 발견 ' + found + '건' + (seen > 0 ? ' · 본 것 ' + seen + '곳' : '') + (lost > 0 ? ' · 잃은 대원 ' + lost + '명' : ' · 모두 무사') + (l.spent ? ' · 경비 금화 ' + U.num(l.spent) + '닢' : '');
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
    // 지진 흔들림: 이번 장면에서만 카메라를 옮겨 그린다 (st.cam은 그대로 — 카메라 추적과 흔들림이 서로 보정하지 않는다).
    // 땅 셰이더는 어느 자리든 그리므로 가장자리에 빈 곳이 드러나지 않는다 (캐시 판도 화면보다 1.45배 넓다)
    st.qo = G.Quake ? G.Quake.camera() : null;
    var qx = st.qo ? st.qo[0] : 0, qy = st.qo ? st.qo[1] : 0;
    if (r) r.draw({ lon: st.cam.lon - qx / st.cam.zoom, lat: st.cam.lat + qy / st.cam.zoom, zoom: st.cam.zoom, time: st.t, wind: [0.4, 0.2], cloud: 0.25, edge: 0.6, mode: 0, dusk: 0, storm: 0, quality: 1, cssWidth: 1600 });
    var cv = G.Game.canvases().overlay, ctx = cv.getContext('2d'), k = G.Game.overlayScale || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.setTransform(k, 0, 0, k, 0, 0);
    var ff = fontFam();
    // base marker
    var bp = toScreen(l.base.lon, l.base.lat);
    if (l.base.type === 'ship') { var bsh = S().fleet.ships[0], blk = bsh ? A.shipLook(bsh.type, { sails: bsh.sails, flag: '#1d3f7a' }) : { sails: ['sq', 'lat'], hull: '#5a3a22', cross: true }; blk.furl = 1; A.shipTop(ctx, bp[0], bp[1], 0.5, G.Scenes.sea.shipPx ? G.Scenes.sea.shipPx() * 0.85 : 80, blk, st.t); }
    // 직접 발견한 도시 밖 유적·자연 경관은 소도시 정도 크기의 투명 모형으로 표시한다.
    if (G.DiscoveryIcon) G.DiscoveryIcon.visible().forEach(function (d) {
      var p = toScreen(d.lon, d.lat); if (p[0] < -60 || p[0] > 1660 || p[1] < -60 || p[1] > 960) return;
      var mark = G.DiscoveryIcon.draw(ctx, d, p[0], p[1], { scale: 1.15 });
      ctx.font = '600 14px ' + ff; var key = 'disc:' + d.id, tw = labelW[key] || (labelW[key] = ctx.measureText(d.name).width), lx = p[0] + mark.radius + 3;
      ctx.fillStyle = 'rgba(20,14,8,.58)'; ctx.fillRect(lx, p[1] - 10, tw + 9, 19); ctx.fillStyle = '#f2e7cc'; ctx.textAlign = 'left'; ctx.fillText(d.name, lx + 4, p[1] + 4);
    });
    // 내륙 도시도 항해·해도와 같은 투명 문화권 모형으로 표시한다.
    knownInland().forEach(function (c) {
      var p = toScreen(c.lon, c.lat); if (p[0] < -50 || p[0] > 1650 || p[1] < -50 || p[1] > 950) return;
      var mark = G.CityIcon.draw(ctx, c, p[0], p[1], { scale: 1.15, visited: s.visited && s.visited[c.id] });
      ctx.font = '700 16px ' + ff; var tw = labelW[c.id] || (labelW[c.id] = ctx.measureText(c.name).width), lx = p[0] + mark.radius + 4;
      ctx.fillStyle = 'rgba(20,14,8,.62)'; ctx.fillRect(lx, p[1] - 11, tw + 10, 21); ctx.fillStyle = '#f2e7cc'; ctx.textAlign = 'left'; ctx.fillText(c.name, lx + 5, p[1] + 5);
    });
    // contract zone
    var ct = s.contract && G.DISC[s.contract.disc];
    if (ct && ct.how === 'land' && G.Disc.hasHint(ct.id) && !G.Disc.foundByMe(ct.id)) {
      var rng = U.makeRng(U.strHash(ct.id)), zk = G.Disc.clueK(ct.id, 'zone'); var zc = toScreen(ct.lon + (rng() - 0.5) * 1.2 * zk, ct.lat + (rng() - 0.5) * 1.2 * zk);
      ctx.strokeStyle = 'rgba(200,40,30,.6)'; ctx.setLineDash([8, 8]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(zc[0], zc[1], 1.3 * zk * st.cam.zoom, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    }
    // 자연재해의 자취 (알려진 것만)
    if (G.Disaster) G.Disaster.drawLand(ctx, toScreen, st.cam.zoom, st.t, ff);
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
    // 지진: 땅에서 피어오르는 먼지 · 튀는 잔돌 · 떨리는 우듬지와 풀 (탐험대 아래)
    if (G.Quake && st.qo) G.Quake.drawLand(ctx, toScreen, toWorld, st.cam.zoom);
    // 흔들리는 땅 위에서 탐험대는 조금 늦게 따라가 휘청인다 (그림만 — 실제 자리·발밑 먼지 자리는 그대로)
    if (st.qo && G.Quake) { var stg = G.Quake.stagger(st.qo); tp = tp.map(function (q) { return [q[0] + stg[0], q[1] + stg[1]]; }); }
    // 탐험대 모형: 발밑 먼지 → 고리 → 줄지어 선 대원들
    var pp = tp[0], mvg = (st.movT || 0) > 0;
    G.Party.drawFx(ctx, st.pfx, toScreen);
    st.unitItems = G.Party.draw(ctx, { ring: 1, pts: tp, head: l.heading, moving: mvg, camping: !!st.camping, phase: st.gph, dist: st.gdist, t: st.t, mount: mt, party: l.party, draft: mt.draft, region: mt.style, gather: st.gather, face: st.face, flag: '#1d3f7a', gait: mt.id === 'horse' && (st.mk || 1) > 2.1 ? 'trot' : 'walk', fast: (st.pxs || 0) > ((G.FX && G.FX.sprites && G.FX.sprites.partyFastPx) || 70), cache: st.unit });
    // 도시 이름은 탐험대 위에 (가려지지 않게)
    knownInland().forEach(function (c) {
      var p = toScreen(c.lon, c.lat); if (p[0] < -50 || p[0] > 1650 || p[1] < -50 || p[1] > 950) return;
      if (Math.abs(p[0] - pp[0]) > 160 || Math.abs(p[1] - pp[1]) > 90) return;
      ctx.font = '700 16px ' + ff; var tw2 = labelW[c.id] || (labelW[c.id] = ctx.measureText(c.name).width), lx2 = p[0] + G.CityIcon.metrics(c, 1.15).radius + 4; ctx.fillStyle = 'rgba(20,14,8,.62)'; ctx.fillRect(lx2, p[1] - 11, tw2 + 10, 21); ctx.fillStyle = '#f2e7cc'; ctx.textAlign = 'left'; ctx.fillText(c.name, lx2 + 5, p[1] + 5);
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
