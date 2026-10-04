/* Sea scene: sailing over the procedural world, daily voyage processing, encounters. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, A = G.Art;
  var SEA = {};
  G.Scenes.sea = SEA;
  var DAY_SEC = 1.25;               // real seconds per game day at speed x1
  var st = null;                    // runtime state
  function S() { return G.Game.state; }
  /** 장면 시간 dt 동안 목표 쪽으로 다가가는 비율 (빠르기 k/초) — 장면 수가 달라도 같은 속도로 */
  function ease(dt, k) { return 1 - Math.exp(-dt * k); }

  // ================================================================ enter / exit
  SEA.enter = function (arg) {
    arg = arg || {};
    var s = S();
    G.Game.showLayers(true, true, false);
    if (G.SeaNews) G.SeaNews.on(true);   // 항해 중에는 소식·알림을 작게 (js/ui/seanews.js)
    if (!G.Game.ensureRenderer()) { UI.alert('WebGL을 사용할 수 없어 바다를 그릴 수 없습니다.<br>' + (G.Game.rendererError || '')); }
    if (!st || arg.depart != null || arg.fresh) st = newRuntime();
    st.alive = true; st.busy = 0; st.keys = {};
    if (G.EventFx) G.EventFx.preload('sea');
    if (!st.vel) st.vel = [0, 0];
    if (!st.fx && G.SeaFX) st.fx = G.SeaFX.create();
    if (!st.pose) st.pose = { roll: 0, pitch: 0, heave: 0 };
    if (G.Img.prefetchCrew) G.Img.prefetchCrew();     // 바다에서 말을 거는 동료들의 얼굴
    if (arg.depart != null) {
      var c = G.CITY_DATA[arg.depart];
      var dock = c.dock || [c.lat, c.lon];
      var start = G.Nav.nearestSea(dock[1], dock[0], 12) || [dock[1], dock[0]];
      s.loc = { mode: 'sea', lon: start[0], lat: start[1], heading: s.loc.heading || Math.PI, from: c.id };
      s.fleet.daysOut = 0;
      s.fleet.scurvy = Math.min(s.fleet.scurvy || 0, 10);     // 항구에서 신선한 먹을거리를 싣고 나간다
      s.voyage = { from: c.id, found0: s.stats.found, known0: s.known.length, marks0: Object.keys(s.marks || {}).length, wins0: s.stats.wins, gold0: s.player.gold };
      s.flags.fromEurope = c.region <= 3 && c.lon < 20;
      if (c.region === 10) s.flags.fromEurope = false;
      st.lastPort = c.id;
      st.cam = { lon: s.loc.lon, lat: s.loc.lat, zoom: st.cam ? st.cam.zoom : 110 };
      st.paused = false; st.vel = [0, 0]; st.stopping = false;
      G.State.revealChart(s.loc.lon, s.loc.lat, chartR());
      UI.toast(c.name + '에서 출항했다.', 'sail');
      if (G.Audio) G.Audio.sfx('bell');
      // 모항 출항 배웅 (지난번 모항 출항에서 3개월이 지났으면 갈매기 떼) — js/scenes/voyagefx.js
      if (G.VoyageFX) G.VoyageFX.onDepart(st, c);
    } else {
      s.loc.mode = 'sea';
      if (!st.cam) st.cam = { lon: s.loc.lon, lat: s.loc.lat, zoom: 110 };
      st.paused = true;
    }
    if (arg.resume && arg.msg) UI.toast(arg.msg, 'info');
    st.wind = R.wind(s.loc.lon, s.loc.lat, s.date, 0);
    st.windVis = { dir: st.wind.dir, spd: st.wind.spd };
    if (G.ShipSprite) G.ShipSprite.preload(s.fleet.ships.map(function (sh) { return sh.type; }), 3000);
    buildUI();
    if (G.Audio) G.Audio.music('sea');
    st.lastMini = -99;
  };
  SEA.exit = function () { if (G.SeaNews) G.SeaNews.on(false); if (st) { st.alive = false; if (st.unkey) st.unkey(); } };
  function newRuntime() {
    return { cam: null, path: null, target: null, paused: false, speed: 1, dayAcc: 0, busy: 0, keys: {}, npcs: [], wake: [], storm: 0, stormDays: 0, calm: 0, t: 0, mouse: null, lastMini: -99, dayCount: 0, toastQ: [],
      vel: [0, 0], fx: G.SeaFX ? G.SeaFX.create() : null, pose: { roll: 0, pitch: 0, heave: 0 }, turnRate: 0, accel: 0 };
  }
  SEA.runtime = function () { return st; };
  /** 시험용: 반란 장면을 바로 띄운다 */
  SEA._mutiny = function () { return mutiny(); };
  function chartR() { return 1.2 + R.skill('survey') * 0.45 + (G.Ships.fleetHas('scout') ? 0.3 : 0) + (G.Cabins ? G.Cabins.fx('chart', 'chart') : 0); }
  /** 무풍이면 돛은 거의 힘을 못 쓰지만 노는 그대로 젓는다 */
  function curWind() { return st.calm > 0 ? { dir: st.wind.dir, spd: st.wind.spd, calm: true } : st.wind; }

  // ================================================================ UI
  var hudEl = {};
  function buildUI() {
    var s = S();
    UI.clearScreen();
    // 항해 중: 날짜 · 위도 · 경도 · 항해 일수 · 식량 · 식수 · 선원 · 피로 · 계약 | 소지금 · 명성
    var H = G.Game.hud;
    UI.hud.show([
      { k: 'date', icon: 'calendar', label: '날짜', text: H.date() },
      { k: 'lat', icon: 'compass', label: '위도', text: H.lat() },
      { k: 'lon', label: '경도', text: H.lon() },
      { k: 'days', icon: 'sail', label: '항해', text: '' },
      { k: 'food', icon: 'bread', label: '식량', text: '' },
      { k: 'water', icon: 'drop', label: '식수', text: '' },
      { k: 'crew', icon: 'people', label: '선원', text: '' },
      { k: 'fat', icon: 'hourglass', label: '피로', text: '' },
      { k: 'contract', icon: 'seal', label: '계약', text: '' },
      { grow: true },
      { k: 'gold', icon: 'coin', label: '소지금', text: H.gold() },
      { k: 'fame', icon: 'laurel', label: '명성', text: U.num(s.player.fame) }
    ]);
    // input catcher
    var catcher = U.el('div', 'mapcatch');
    catcher.style.cssText = 'position:absolute;inset:0;z-index:5;cursor:crosshair';
    catcher.addEventListener('mousedown', onDown);
    catcher.addEventListener('mousemove', onMove);
    catcher.addEventListener('mouseleave', function () { st.mouse = null; });
    catcher.addEventListener('wheel', onWheel, { passive: false });
    UI.pinch(catcher, zoomBy);
    catcher.addEventListener('contextmenu', function (e) { e.preventDefault(); st.path = null; st.target = null; st.dirCrs = null; st.tackTheta = 0; });
    UI.add(catcher);
    // status strip
    hudEl.status = UI.add(U.el('div', 'status-strip wood', ''));
    // minimap
    var mm = U.el('div', 'minimap parch brass-frame', '<div class="lbl">해도</div><canvas width="568" height="388"></canvas>');
    mm.onclick = function () { SEA.chart(); };
    hudEl.mini = UI.add(mm).querySelector('canvas');
    // wind box
    var wb = U.el('div', 'windbox wood brass-frame', '<canvas width="260" height="260" style="width:130px;height:130px"></canvas><div class="wtxt"></div>');
    hudEl.windbox = UI.add(wb); hudEl.wind = wb.querySelector('canvas'); hudEl.wtxt = wb.querySelector('.wtxt');
    // sail bar
    var bar = U.el('div', 'sailbar wood brass-frame');
    function btn(label, icon, fn, cls) { var b = U.el('button', 'btn ' + (cls || ''), G.icon(icon) + label); b.onclick = function (e) { e.stopPropagation(); b.blur(); if (!UI.busy() && !st.busy) fn(); }; bar.appendChild(b); return b; }
    hudEl.pause = btn('정지', 'pause', function () { if (st.paused) resume(); else halt(); });
    var sp = U.el('div', 'speedctl');
    [1, 2, 4].forEach(function (k) { var o = U.el('div', 'opt' + (st.speed === k ? ' on' : ''), '×' + k); o.onclick = function (e) { e.stopPropagation(); st.speed = k; U.$$('.opt', sp).forEach(function (x) { x.classList.remove('on'); }); o.classList.add('on'); }; sp.appendChild(o); });
    bar.appendChild(sp);
    hudEl.port = btn('입항', 'anchor', function () { tryEnterPort(); }, 'navy');
    hudEl.land = btn('상륙', 'boot', function () { tryLand(); });
    if (G.Fishing) btn('낚시', 'fish', function () { goFish(); });
    btn('해도', 'map', function () { SEA.chart(); });
    btn('수첩', 'book', function () { st.busy++; G.Info.open('fleet').then(function () { st.busy--; }); });
    var zb = U.el('div', 'zoomctl');
    [['＋', 1.25], ['－', 0.8]].forEach(function (z) { var b = U.el('button', 'btn small', z[0]); b.onclick = function (e) { e.stopPropagation(); zoomBy(z[1]); }; zb.appendChild(b); });
    bar.appendChild(zb);
    UI.add(bar);
    refreshBar(); refreshHud();
    if (st.unkey) st.unkey();
    st.unkey = UI.pushKey(onKey);
    document.onkeyup = function (e) { if (st) { var ku = String(e.key).toLowerCase(); st.keys[ku] = false; if (st.arrows) st.arrows[ku] = false; } };
    // 창을 벗어나면 누르고 있던 키를 잊는다 (떼는 신호를 못 받아 대각선이 남지 않게)
    if (!SEA._blurHooked) { SEA._blurHooked = true; window.addEventListener('blur', function () { if (st) { st.keys = {}; st.arrows = {}; } }); }
  }
  function refreshBar() {
    if (!hudEl.pause) return;
    hudEl.pause.innerHTML = G.icon(st.paused ? 'sail' : 'pause') + (st.paused ? '출발' : '정지');
  }
  function refreshHud() {
    var s = S(), f = s.fleet, H = G.Game.hud;
    UI.hud.set('date', H.date());
    UI.hud.set('lat', H.lat()); UI.hud.set('lon', H.lon());
    UI.hud.set('days', (f.daysOut || 0) + '일째');
    var food = H.supply('food'), water = H.supply('water');
    UI.hud.set('food', food.text, food.warn); UI.hud.set('water', water.text, water.warn);
    UI.hud.set('crew', f.crew + '명' + (f.crew < R.crewMin() ? '<small>/' + R.crewMin() + '</small>' : ''), f.crew < R.crewMin());
    UI.hud.set('fat', Math.round(f.fatigue) + '%', f.fatigue > 60);
    var k = H.contract(); UI.hud.set('contract', k.text, k.warn); UI.hud.tip('contract', k.tip);
    UI.hud.set('gold', H.gold());
    UI.hud.set('fame', U.num(s.player.fame));
  }
  SEA.refreshHud = refreshHud;

  // ================================================================ input
  function stagePos(e) { var r = G.Game.canvases().overlay.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 1600, (e.clientY - r.top) / r.height * 900]; }
  function toWorld(x, y) { return [st.cam.lon + (x - 800) / st.cam.zoom, st.cam.lat - (y - 450) / st.cam.zoom]; }
  function toScreen(lon, lat) { return [800 + G.Geo.wrapLon(lon - st.cam.lon) * st.cam.zoom, 450 - (lat - st.cam.lat) * st.cam.zoom]; }
  SEA.toScreen = function (lon, lat) { return toScreen(lon, lat); };
  function onMove(e) { st.mouse = stagePos(e); }
  function onWheel(e) {
    e.preventDefault();
    var k = e.deltaY > 0 ? 1 / 1.15 : 1.15;
    zoomBy(k);
  }
  function zoomBy(k) { st.cam.zoomT = U.clamp((st.cam.zoomT || st.cam.zoom) * k, 26, 420); }
  function onDown(e) {
    if (e.button !== 0 || UI.busy() || st.busy) return;
    var p = stagePos(e);
    // click on a city marker?
    var hit = cityAt(p[0], p[1]);
    if (hit) { setCityTarget(hit); return; }
    var landmark = landmarkAt(p[0], p[1]);
    if (landmark) {
      if (landmark.how === 'land') {
        UI.toast('「' + landmark.name + '」 가까운 해안으로 향합니다.', 'boot', 3200);
        var shore = G.Nav.nearestSea(landmark.lon, landmark.lat, 6); if (shore) { setTarget(shore[0], shore[1], null); return; }
      }
      setTarget(landmark.lon, landmark.lat, null); return;
    }
    var npc = npcAt(p[0], p[1]);
    if (npc) { approachNpc(npc); return; }
    var mk = G.Explore.markerAt(st.marks || [], toScreen, p[0], p[1]);
    if (mk) {
      if (mk.d.how === 'land') { UI.toast('해안 가까이 가서 상륙하면 조사할 수 있습니다.', 'boot', 3200); var sea = G.Nav.nearestSea(mk.lon, mk.lat, 6); if (sea) { setTarget(sea[0], sea[1], null); return; } }
      setTarget(mk.lon, mk.lat, null); return;
    }
    var w = toWorld(p[0], p[1]);
    setTarget(w[0], w[1], null);
  }
  // 숫자판 여덟 방향 (위=북). 숫자판이 없는 자판을 위해 윗줄 대각선 숫자도 받는다
  var NUMDIR = { Numpad1: [-1, -1], Numpad2: [0, -1], Numpad3: [1, -1], Numpad4: [-1, 0],
    Numpad6: [1, 0], Numpad7: [-1, 1], Numpad8: [0, 1], Numpad9: [1, 1] };
  // 방향키·WASD = 그 방위로 간다 (↑ 북 · ↓ 남 · ← 서 · → 동, 두 키를 함께 누르면 대각선)
  var ARROWDIR = { arrowup: [0, 1], w: [0, 1], arrowdown: [0, -1], s: [0, -1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
  /** 방향키 방식: 'dir' = 누른 방위로 계속 간다(기본) · 'helm' = 손으로 키를 잡는다(예전 방식) */
  function helmMode() { var s = S(); return !!(s && s.settings && s.settings.keyMode === 'helm'); }
  SEA.helmMode = helmMode;
  /** 지금 누르고 있는 방향키들이 가리키는 방위 (없거나 서로 지우면 null) */
  function arrowAngle() {
    var x = 0, y = 0, a = st.arrows || {};
    for (var k in a) if (a[k] && ARROWDIR[k]) { x += ARROWDIR[k][0]; y += ARROWDIR[k][1]; }
    x = Math.sign(x); y = Math.sign(y);
    return (x || y) ? Math.atan2(y, x) : null;
  }
  function onKey(e) {
    if (!st || !st.alive || G.Game.scene !== SEA) return false;
    var k = e.key;
    if (UI.busy()) return false;
    // 스페이스: 정지 (돛을 거두고 미끄러지다 선다). 멈춘 채 항구가 가까우면 정박.
    // 손으로 키 잡는 방식에서는 예전처럼 정지·순항을 오간다
    if (k === ' ') {
      if (helmMode()) {
        if (st.stopping) { if (portNear()) { tryEnterPort(); return true; } resume(); return true; }
        if (!st.paused) { halt(); return true; }
        if (portNear()) { tryEnterPort(); return true; }
        resume(); return true;
      }
      if (st.stopping) { if (portNear()) tryEnterPort(); return true; }
      if (!st.paused) { halt(); return true; }
      if (portNear()) { tryEnterPort(); return true; }
      if (!e.repeat) UI.toast('멈춰 있습니다. 방향키로 가려는 쪽을 누르면 출발합니다.', 'sail', 2600);
      return true;
    }
    // 숫자판 1~9 = 여덟 방향 침로(5는 정지), 윗줄 1·2·3 = 속도
    if (e.code === 'Numpad5') { leaveAuto(); st.path = null; st.target = null; st.dirCrs = null; st.manual = false; halt(); return true; }
    if (NUMDIR[e.code]) {
      var d = NUMDIR[e.code];
      takeCourse(Math.atan2(d[1], d[0]));
      return true;
    }
    if (e.code === 'Digit1' || k === '1') { st.speed = 1; buildSpeed(); return true; }
    if (e.code === 'Digit2' || k === '2') { st.speed = 2; buildSpeed(); return true; }
    if (e.code === 'Digit3' || k === '3') { st.speed = 4; buildSpeed(); return true; }
    if (k === 'm' || k === 'M') { SEA.chart(); return true; }
    if (k === 'Enter') { tryEnterPort(); return true; }
    if (k === 'l' || k === 'L') { tryLand(); return true; }
    if ((k === 'f' || k === 'F') && G.Fishing) { goFish(); return true; }
    // 방향키 = 대항해시대 3처럼: 누르고 있는 동안 뱃머리가 그 방위(← 서 · → 동 · ↑ 북 · ↓ 남, 두 키 = 북서·남동 …) 쪽으로
    // 차츰 돌아가고, 떼면 그때 향한 쪽으로 곧게 나아간다. 지그재그 없이 뱃머리 쪽으로 가며(맞바람이면 느림), Space로 정지
    if (!helmMode() && ARROWDIR[String(k).toLowerCase()]) {
      st.arrows = st.arrows || {}; st.arrows[String(k).toLowerCase()] = true;
      if (e.repeat) return true;          // 누르고 있는 동안 되풀이되는 신호는 무시
      var ang = arrowAngle(); if (ang == null) return true;
      var l0 = S().loc;
      if (!st.arrowSteer || st.dirCrs == null || st.paused || st.stopping) takeCourse(st.paused && shipSpeed() < 0.02 ? l0.heading : (st.dirCrs != null ? st.dirCrs : l0.heading));
      st.arrowSteer = true;
      monsoonWarn(l0.lon + Math.cos(ang) * 15, l0.lat + Math.sin(ang) * 15);
      return true;
    }
    // (손으로 키 잡기 방식) 방향키 = 손으로 키를 잡는다: ↑ 누르는 동안 돛을 펴고 나아감(떼면 서서히 멈춤), ←→ 뱃머리, ↓ 돛을 거둬 세움
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'd', 'w', 's', 'A', 'D', 'W', 'S'].indexOf(k) >= 0) {
      var kk = k.toLowerCase();
      leaveAuto();
      if (!st.manual) {
        var moving = !st.paused && (st.path || st.dirCrs != null);
        st.manual = true; st.cruise = false; st.thr = moving ? 1 : 0;     // 가던 배는 그 힘을 이어받아 서서히 늦춘다
      }
      st.keys[kk] = true; st.path = null; st.target = null; st.dirCrs = null; st.tackTheta = 0; st.tackSide = 0;
      if (kk === 'arrowdown' || kk === 's') { st.cruise = false; st.braking = true; }          // 한 번 눌러도 돛을 거둬 멈출 때까지 세운다
      else if (kk === 'arrowup' || kk === 'w') { st.braking = false; st.stopping = false; if (st.paused) { st.paused = false; refreshBar(); } }
      return true;
    }
    if (k === '+' || k === '=') { zoomBy(1.2); return true; }
    if (k === '-') { zoomBy(1 / 1.2); return true; }
    return false;
  }
  function buildSpeed() { U.$$('.speedctl .opt').forEach(function (o, i) { o.classList.toggle('on', [1, 2, 4][i] === st.speed); }); }

  // ================================================================ targets & path
  /** 목적지를 잡는다. 자동항해(뱃길을 알아서 찾아 감)는 익숙한 항로에서만 — 항구는 그 항로의 경험이 차야 하고,
      바다는 가까운 곳(3° 안)만 곶을 돌아가는 뱃길을 찾아 준다. 나머지는 곧장 침로만 잡는다 (G.Routes) */
  /** 계절풍 바다를 지나는 뱃길이 맞바람이면 부관이 한 번 일러 준다 (목적지마다 한 번) */
  /** 상태 줄: 계절풍 바다라면 지금 계절풍과, 가는 방향이 맞바람인지 */
  function monsoonTag() {
    if (!G.Monsoon) return '';
    var l = S().loc, z = G.Monsoon.at(l.lon, l.lat); if (!z) return '';
    var ph = G.Monsoon.phase(z), fit = G.Monsoon.fit(st.crs != null && !st.manual ? st.crs : l.heading, ph);
    return ' · ' + G.Monsoon.NAME[ph] + ' ' + (fit === '맞바람' ? '<span style="color:#ff9f7a">맞바람</span>' : fit);
  }
  function monsoonWarn(lon, lat) {
    if (!G.Monsoon || !st) return;
    var l = S().loc, a = G.Monsoon.advice([l.lon, l.lat], [lon, lat]);
    if (!a || !a.head) return;
    var key = Math.round(lon) + ',' + Math.round(lat) + ':' + a.phase;
    if (st.monsoonWarned === key) return;
    st.monsoonWarned = key;
    UI.toast(G.Scenes.mateSpeaker('nav').name + ': 제독, ' + a.text, 'wind', 9000);
  }
  SEA.monsoonWarn = monsoonWarn;
  /** 자동항해 중 손으로 몰면(방향키·숫자판·바다 누르기·곧장 침로) 자동항해가 풀린다.
      이번 항해에는 다시 못 쓰고, 다음 항구에 들어간 뒤 그 항구와 이어진 항로에서 다시 쓴다 (G.Routes.autoOff) */
  function leaveAuto() {
    if (!st || !st.autoOn) return;
    st.autoOn = false;
    var v = S().voyage; if (v) v.autoOff = true;
    UI.toast('자동항해를 풀고 손으로 배를 몹니다. 자동항해는 다음 항구에 들어가면 그 항구와 이어진 항로에서 다시 쓸 수 있습니다.', 'sail', 5200);
  }
  SEA.leaveAuto = leaveAuto;
  function setTarget(lon, lat, city) {
    var s = S(), RT = G.Routes;
    var auto = city ? RT.isOpen(RT.origin(), city.id) : G.Geo.dist(s.loc.lon, s.loc.lat, lon, lat) <= RT.NEAR;
    if (!city || !auto) leaveAuto();
    monsoonWarn(lon, lat);
    if (!auto) { setCourse(lon, lat, city); return; }
    var path = G.Nav.path(s.loc.lon, s.loc.lat, lon, lat);
    if (!path) { UI.toast('그곳까지 가는 바닷길을 찾을 수 없습니다.', 'map'); return; }
    // make path longitudes relative to the ship
    st.path = path; st.pathI = 1; st.target = { lon: path[path.length - 1][0], lat: path[path.length - 1][1], city: city };
    st.manual = false; st.warnedFor = null; st.repath = 0; st.direct = false; if (city) st.autoOn = true;
    freshCourse(null);
    if (st.paused) { st.paused = false; refreshBar(); }
  }
  SEA.setTarget = setTarget;
  /** 침로: 목적지 쪽으로 곧장 간다 (뭍을 돌아가는 뱃길은 찾지 않는다) */
  function setCourse(lon, lat, city) {
    var s = S(), l = s.loc;
    leaveAuto();
    monsoonWarn(lon, lat);
    st.path = [[l.lon, l.lat], [lon, lat]]; st.pathI = 1; st.target = { lon: lon, lat: lat, city: city };
    st.manual = false; st.warnedFor = null; st.repath = 0; st.direct = true;
    l.heading = Math.atan2(lat - l.lat, G.Geo.wrapLon(lon - l.lon));
    freshCourse(l.heading);
    if (st.paused) { st.paused = false; refreshBar(); }
  }
  SEA.setCourse = setCourse;
  /** 숫자판 여덟 방향: 그 방위로 계속 간다 (맞바람이면 지그재그로 거슬러 오른다) */
  function takeCourse(ang) {
    leaveAuto();
    st.path = null; st.target = null; st.manual = false; st.direct = false; st.keys = {}; st.arrowSteer = false;
    freshCourse(ang); st.dirCrs = ang; st.stopping = false;     // 멈추던 중이어도 다시 돛을 편다
    if (st.paused) st.paused = false;
    refreshBar(); refreshButtons();
  }
  SEA.takeCourse = takeCourse;
  function freshCourse(crs) { st.arrowSteer = false; st.braking = false; st.dirCrs = null; st.crs = crs; st.dW = Infinity; st.xt = 0; st.tackSide = 0; st.tackTheta = 0; st.noTack = 0; st.cruise = false; st.thr = 0; }
  /** 멈춘다: 나아가던 힘도 없앤다 (항로·침로는 남겨 둬 다시 출발할 수 있다) */
  /** 멈춘다: 돛을 거두고 남은 관성으로 미끄러지다 선다 (거의 서 있으면 곧바로). 항로·침로는 남겨 둔다 */
  function halt() {
    st.cruise = false; st.braking = false; st.thr = 0; st.keys = {};
    if (!st.paused && shipSpeed() > FXS().stopSpeed * 2) st.stopping = true;
    else { st.paused = true; st.stopping = false; st.vel = [0, 0]; }
    refreshBar(); refreshButtons();
  }
  /** 다시 나아간다: 수동 조타 중이었으면 순항(↑를 누르고 있지 않아도 돛을 편 채로 간다) */
  function resume() { if (st.manual) { st.cruise = true; st.braking = false; } st.stopping = false; st.paused = false; refreshBar(); }
  function FXS() { return (G.FX && G.FX.ship) || { accel: 0.32, decel: 0.55, lateral: 0.2, maxDrift: 0.42, stopSpeed: 0.03, arriveSlow: 0.3, heave: 1, pitch: 1, roll: 1, camLead: 0.22, refSpeed: 1.1 }; }
  function shipSpeed() { return st.vel ? Math.hypot(st.vel[0], st.vel[1]) : 0; }
  SEA.shipSpeed = shipSpeed;
  SEA.halt = halt; SEA.resume = resume;
  /** 함대에서 가장 둔한 배의 키 (선회력 0.6~1.5) */
  function turnAbility() {
    var m = null;
    S().fleet.ships.forEach(function (s) { var t = G.SHIP[s.type]; if (t) m = m == null ? (t.turn || 1) : Math.min(m, t.turn || 1); });
    return U.clamp(m == null ? 1 : m, 0.6, 1.5);
  }
  /** 방향키로 침로 돌리기 (실제 시간 기준 — 배속과 상관없이 같은 손맛): 누른 방위 쪽으로 초당 약 75°(가장 둔한 배의 키만큼), 떼면 멈춘다 */
  var ARROW_TURN = 0.9;
  function arrowTurn(dt) {
    if (!st.arrowSteer || st.dirCrs == null || helmMode()) return;
    var want = arrowAngle(); if (want == null) { st.arrowHeld = 0; return; }
    st.arrowHeld = (st.arrowHeld || 0) + dt;
    var diff = U.angDiff(st.dirCrs, want);
    if (Math.abs(diff) > 3.1) diff = Math.abs(diff);          // 정반대면 왼쪽(반시계)으로 돈다
    var rate = ARROW_TURN * turnAbility() * Math.min(1, 0.5 + st.arrowHeld * 1.5) * dt;
    st.dirCrs += U.clamp(diff, -rate, rate); st.crs = st.dirCrs;
  }
  SEA.arrowTurn = arrowTurn;
  function turnKey() { var k = st.keys; return ((k.arrowleft || k.a) ? 1 : 0) - ((k.arrowright || k.d) ? 1 : 0); }
  function setCityTarget(c) {
    var d = c.dock || [c.lat, c.lon];
    if (!c.port) { UI.toast(c.name + U.j(c.name, '은/는').slice(c.name.length) + ' 내륙 도시입니다. 가까운 해안에 상륙해 육로로 가야 합니다.', 'castle'); setTarget(d[1], d[0], null); return; }
    var RT = G.Routes, o = RT.origin(), off = RT.autoOff();
    setTarget(d[1], d[0], c);
    if (st.direct) {
      var nm = o != null && o !== c.id ? RT.label(o, c.id) : null;
      UI.toast(c.name + ' 쪽으로 곧장 침로를 잡습니다.' + (off ? ' 이번 항해는 자동항해를 풀었습니다 — 다음 항구에 들어가면 다시 쓸 수 있습니다.' : nm ? ' 아직 자동항해를 할 수 없는 항로입니다 — ' + nm + '.' : '') + ' 뭍에 막히면 바다를 눌러 돌아갈 길을 잡으십시오.', 'map', 5200);
    } else UI.toast(c.name + U.jx(c.name, '으로/로') + ' 자동항해합니다. 방향키·숫자판·바다를 누르면 손으로 몰 수 있습니다.', 'anchor');
  }
  SEA.goCity = function (id) { setCityTarget(G.CITY_DATA[id]); };
  var kcCache = null, kcKey = '';
  function knownCities() {
    var s = S(), key = s.known.length + ':' + s.date.y + ':' + (s.date.y === 1521 ? s.date.m : 0);
    if (kcCache && kcKey === key) return kcCache;
    kcKey = key;
    kcCache = s.known.map(function (id) { return G.CITY_DATA[id]; }).filter(function (c) { return c && R.cityExists(c); });
    return kcCache;
  }
  function cityAt(x, y) {
    var best = null, bd = 22 * 22;
    knownCities().forEach(function (c) { var p = toScreen(c.lon, c.lat); var d = (p[0] - x) * (p[0] - x) + (p[1] - y) * (p[1] - y); if (d < bd) { bd = d; best = c; } });
    return best;
  }
  function landmarkAt(x, y) { return G.DiscoveryIcon ? G.DiscoveryIcon.at(G.DiscoveryIcon.visible(), toScreen, x, y, 1) : null; }
  function npcAt(x, y) {
    var best = null, bd = Math.pow(npcPx() * 0.6, 2);
    st.npcs.forEach(function (n) { var p = toScreen(n.lon, n.lat); var d = (p[0] - x) * (p[0] - x) + (p[1] - y) * (p[1] - y); if (d < bd) { bd = d; best = n; } });
    return best;
  }
  /** nearest enterable port within range */
  function portNear() {
    var s = S(), best = null, bd = 0.55;
    knownCities().forEach(function (c) {
      if (!c.port) return;
      var d = c.dock || [c.lat, c.lon];
      var dd = G.Geo.dist(s.loc.lon, s.loc.lat, d[1], d[0]);
      if (dd < bd) { bd = dd; best = c; }
    });
    return best;
  }
  SEA.portNear = portNear;
  /** 곧 들를 항구의 거리 그림을 미리 받는다 (아티팩트판은 그림 묶음을 처음 쓸 때 받으므로) — 하루에 한 번.
      목적지 항구는 3° 안에서, 지나가는 항구는 1.5° 안에서 */
  function prefetchAhead() {
    if (!G.Img.prefetchCity) return;
    var s = S(), l = s.loc, tc = st.target && st.target.city;
    if (tc && G.Geo.dist(l.lon, l.lat, tc.lon, tc.lat) < 3) G.Img.prefetchCity(tc, 'near');
    knownCities().forEach(function (c) {
      if (c.port && Math.abs(c.lat - l.lat) < 1.5 && G.Geo.dist(l.lon, l.lat, c.lon, c.lat) < 1.5) G.Img.prefetchCity(c, 'near');
    });
  }
  function landNear() {
    var s = S(), l = s.loc;
    for (var a = 0; a < 16; a++) { var ang = a / 16 * Math.PI * 2; for (var r = 0.1; r <= 0.4; r += 0.1) if (G.Geo.isLand(l.lon + Math.cos(ang) * r, l.lat + Math.sin(ang) * r)) return [l.lon + Math.cos(ang) * r, l.lat + Math.sin(ang) * r]; }
    return null;
  }

  // ================================================================ port & landing
  async function tryEnterPort() {
    var c = portNear();
    if (!c) { UI.toast('가까운 곳에 들를 수 있는 항구가 없습니다.', 'anchor'); return; }
    if (G.Disc.prefetchCity) G.Disc.prefetchCity(c.id);
    if (G.Img.prefetchCity) G.Img.prefetchCity(c, 'near');
    st.busy++;
    try {
      var ok = await G.Scenes.city.handleEntry(c);
      if (!ok) { st.busy--; st.paused = true; refreshBar(); return; }
      if (c.region === 10) s_flags().fromEurope = false;
      st.busy--;
      st.paused = true; st.path = null; st.target = null;
      await UI.fade(function () { G.Game.go('city', { cityId: c.id, arrive: true }); });
    } catch (e) { console.error(e); st.busy = 0; }
  }
  SEA.enterPort = tryEnterPort;
  function s_flags() { return S().flags; }
  /** 바다 낚시 (js/games/fishing.js): 낚는 동안 배는 멈춰 있다 */
  async function goFish() {
    if (st.busy) return;
    st.busy++; st.paused = true; st.vel = [0, 0]; refreshBar();
    try { await G.Fishing.open({ storm: st.storm > 0 }); } catch (e) { console.error(e); }
    st.busy--; refreshHud();
  }
  async function tryLand() {
    var p = landNear();
    if (!p) { UI.toast('해안에서 너무 멉니다. 육지에 더 가까이 가십시오.', 'boot'); return; }
    var s = S();
    if (s.fleet.crew < 5) { UI.toast('상륙할 선원이 모자랍니다.', 'people'); return; }
    st.busy++;
    var ok = await UI.ask('상륙해서 탐험하겠습니까? 배는 이곳에 정박시켜 둡니다.', [{ label: '상륙한다', value: true }, { label: '그만둔다', value: false }], G.Scenes.mateSpeaker('first'));
    st.busy--;
    if (!ok) return;
    st.paused = true; st.path = null;
    await UI.fade(function () { G.Game.go('land', { landing: { lon: p[0], lat: p[1], shipLon: s.loc.lon, shipLat: s.loc.lat } }); });
  }

  // ================================================================ chart window
  SEA.chart = async function () {
    if (st.busy) return;
    st.busy++;
    var s = S();
    var win = UI.window({ title: '해도', icon: 'map', width: 1180, html: '<div class="chartwrap"></div><div class="muted" style="font-size:15px;margin-top:6px">휠·＋/－로 확대, 끌어서 이동. 도시를 누르면 요약과 「이 항구로 간다」, 바다를 누르면 「이곳으로 간다」가 나옵니다.</div>', buttons: [{ label: '닫기', value: null }] });
    var RT = G.Routes;
    G.ChartView.mount(win.content.querySelector('.chartwrap'), {
      w: 1120, h: 560, span: 90,
      actions: function (c) {
        if (!c.port) return [];
        var o = RT.origin(), open = RT.isOpen(o, c.id);
        return [{ label: open ? c.name + U.jx(c.name, '으로/로') + ' 자동항해' : c.name + ' 쪽으로 곧장 침로', icon: open ? 'anchor' : 'map', fn: function () { win.close('go'); setTimeout(function () { setCityTarget(c); }, 30); } }];
      },
      seaAction: function (lon, lat) {
        if (!G.Geo.isSea(lon, lat, 0.2)) return null;
        var near = G.Geo.dist(s.loc.lon, s.loc.lat, lon, lat) <= RT.NEAR;
        return { label: '이곳으로 간다', note: near ? '가까운 바다라 곶을 돌아가는 뱃길을 찾아 갑니다.' : '곧장 침로를 잡습니다 (뭍에 막히면 멈춥니다).', fn: function () { win.close('go'); setTimeout(function () { setTarget(lon, lat, null); }, 30); } };
      }
    });
    await win.result;
    st.busy--;
  };

  // ================================================================ NPC fleets
  var NPC_KIND = {
    pirate: { name: '해적', hostile: true, sail: '#3a3430', hull: '#2a2420', flag: '#111' },
    merchant: { name: '상선', hostile: false, sail: '#efe4c9', hull: '#6a4a2a', flag: '#c9a030' },
    navy: { name: '함대', hostile: false, sail: '#e8e0d0', hull: '#4a2e1c', flag: '#8a1e1e' }
  };
  function pirateRate(lon, lat) {
    var r = 0.04;
    if (lon > -6 && lon < 36 && lat > 30 && lat < 46) r = 0.11;                  // Mediterranean (Barbary corsairs)
    if (lon > -90 && lon < -58 && lat > 8 && lat < 28) r = 0.1;                   // Caribbean
    if (lon > 40 && lon < 80 && lat > 0 && lat < 28) r = 0.08;                    // Arabian sea
    if (lon > 95 && lon < 125 && lat > -8 && lat < 25) r = 0.1;                   // SE Asia / wako
    if (lon > 118 && lon < 135 && lat > 22 && lat < 40) r = 0.09;                 // wako
    return r * risk().pirate;
  }
  function risk() { return G.SEA_RISK || { pirate: 1, storm: 1, tollBase: 200, tollRate: 0.12, pleadMax: 0 }; }
  /** 해적 통행료: 기본 + 가진 돈의 일정 비율 */
  function tollOf() { var k = risk(); return Math.round(k.tollBase + S().player.gold * k.tollRate); }
  SEA.tollOf = tollOf;
  /** 가진 것이 적으면(소지금 + 금고가 한도 이하) 해적에게 사정해 빠져나올 수 있다 */
  function canPlead() { var p = S().player; return (p.gold + (p.bank || 0) + cargoWorth()) <= risk().pleadMax; }
  /** 싣고 있는 짐의 값어치 (산 값, 모르면 기준 시세의 62%) — 짐이 많으면 '털어 갈 것이 없다'고 사정할 수 없다 */
  function cargoWorth() { var c = S().fleet.cargo, v = 0; for (var id in c) v += c[id].q * (c[id].cost || (G.GOOD[id] ? G.GOOD[id].p * 0.62 : 0)); return Math.round(v); }
  SEA.cargoWorth = cargoWorth;
  /** 해적의 세기(0~1): 명성이 높을수록, 함대(짐칸)가 클수록 큰 해적이 노린다 */
  function pirateK() {
    var s = S(), B = G.BALANCE || {};
    return Math.min(1, s.player.fame / (B.pirateFame || 4000), (B.pirateBase != null ? B.pirateBase : 1) + R.fleetCap() / (B.pirateCap || 1));
  }
  SEA.pirateK = pirateK;
  SEA.canPlead = canPlead;
  function spawnNpcs() {
    var s = S(), l = s.loc;
    // 탐험가의 함대(항로 위)·적대국의 추격 함대 (js/systems/seafolk.js)
    if (G.SeaFolk) { var sfN = G.SeaFolk.spawn(st.npcs); if (sfN) { st.npcs.push(sfN); if (G.ShipSprite) G.ShipSprite.want(sfN.ships); return; } }
    if (st.npcs.length >= 4) return;
    var ports = knownCities().filter(function (c) { return c.port && G.Geo.dist(l.lon, l.lat, c.lon, c.lat) < 12; }).length;
    var pr = pirateRate(l.lon, l.lat) * (s.settings.diff === 'easy' ? 0.6 : 1);
    var mr = 0.05 + ports * 0.02;
    var kind = null, f0 = s.fleet.ships[0];
    if (U.chance(pr)) kind = 'pirate'; else if (U.chance(mr)) kind = U.chance(0.75) ? 'merchant' : 'navy';
    if (!kind) return;
    for (var tries = 0; tries < 8; tries++) {
      var ang = U.rf(0, Math.PI * 2), dist = U.rf(2.5, 5);
      var lon = l.lon + Math.cos(ang) * dist, lat = l.lat + Math.sin(ang) * dist;
      if (!G.Geo.isSea(lon, lat, 1)) continue;
      // 해적 떼의 크기는 명성과 우리 함대 척수를 따른다 (배 한 척에 네 척이 몰려오지는 않는다)
      var n = kind === 'pirate' ? U.ri(1, Math.min(4, 1 + Math.floor(s.player.fame / ((G.BALANCE && G.BALANCE.pirateCountFame) || 1200)), s.fleet.ships.length + 1)) : U.ri(1, 3);
      var zone = G.Ships.zone(lon, lat), nation = kind === 'navy' ? G.Ships.navyNation(zone, s.date.y) : null;
      var K = kind === 'pirate' ? pirateK() : Math.min(1, s.player.fame / ((G.BALANCE && G.BALANCE.pirateFame) || 4000));
      var ships = G.Ships.enemyTypes(kind, zone, nation, n, K, s.date.y);
      var npc = { id: Math.random().toString(36).slice(2), kind: kind, lon: lon, lat: lat, heading: U.rf(0, 6.28), n: n, K: K, spd: U.rf(0.9, 1.4), life: U.ri(6, 14), hostile: NPC_KIND[kind].hostile || (kind === 'navy' && s.player.notoriety > 40), nation: nation, zone: zone, ships: ships };
      // 위용: 기함이 거대한 보선이면 작은 해적 떼는 덤비지 않는다
      if (kind === 'pirate' && n <= 2 && f0 && G.Ships.has(f0, 'awe')) { npc.hostile = false; npc.awed = true; }
      if (G.SeaFolk) G.SeaFolk.decorate(npc, st.npcs);   // 상선의 나라·선장(항해사), 적대국 함대는 덤빈다
      st.npcs.push(npc);
      if (G.ShipSprite) G.ShipSprite.want(ships);   // 화면에 들어오기 전에 그 배 그림을 풀어 둔다
      return;
    }
  }
  function updateNpcs(days) {
    var s = S(), l = s.loc;
    for (var i = st.npcs.length - 1; i >= 0; i--) {
      var n = st.npcs[i];
      var d = G.Geo.dist(l.lon, l.lat, n.lon, n.lat);
      if (n.exp && G.SeaFolk && G.SeaFolk.place(n, st.dayAcc)) { if (n.gone || d > 9) st.npcs.splice(i, 1); continue; }   // 탐험 함대는 날짜대로 항로를 간다
      if (n.hostile && d < (n.hunt ? 8 : 4.5) && !n.fled) n.heading = Math.atan2(l.lat - n.lat, G.Geo.wrapLon(l.lon - n.lon));
      else if ((n.kind === 'merchant' || n.awed) && d < 1.2) { n.heading = Math.atan2(n.lat - l.lat, G.Geo.wrapLon(n.lon - l.lon)); if (n.awed && !n.awedTold) { n.awedTold = true; UI.toast(G.Ships.pirateLabel(n.zone) + '의 배가 ' + s.fleet.ships[0].name + '호의 거대한 모습을 보고 달아난다.', 'ship', 3600); } }
      var sp = n.spd * days;
      var nl = n.lon + Math.cos(n.heading) * sp, nt = n.lat + Math.sin(n.heading) * sp;
      if (G.Geo.isSea(nl, nt, 0.5)) { n.lon = nl; n.lat = nt; } else n.heading += U.rf(1, 2.5);
      if (d > 9) st.npcs.splice(i, 1);
    }
  }
  async function checkEncounters() {
    var s = S(), l = s.loc;
    for (var i = 0; i < st.npcs.length; i++) {
      var n = st.npcs[i];
      if (!n.hostile || n.cooldown > 0) continue;
      if (G.Geo.dist(l.lon, l.lat, n.lon, n.lat) < 0.3) { await encounter(n, false); return; }
    }
  }
  async function encounter(n, byMe) {
    var s = S();
    st.busy++;
    st.paused = true; refreshBar();
    var k = NPC_KIND[n.kind];
    var pl = G.Ships.pirateLabel(n.zone);
    var who = n.kind === 'pirate' ? pl + ' 함대' : n.label || (n.nation || '') + ' ' + k.name;
    var kinds = n.ships ? n.ships.filter(function (id, i) { return n.ships.indexOf(id) === i; }).map(function (id) { return G.SHIP[id].name; }).join('·') : '';
    var kt = kinds ? ' (' + kinds + ')' : '';
    var text = byMe ? who + ' ' + n.n + '척이 있다' + kt + '. 어떻게 할까요?' : (n.kind === 'pirate' ? '제독! ' + pl + '입니다! ' + n.n + '척의 해적선이 다가옵니다!' + kt : n.hunt && G.Hostile ? '제독! ' + who + ' ' + n.n + '척이 우리를 잡으러 왔습니다!' + kt + ' (' + n.nation + ' 적대 ' + G.Hostile.get(n.nation) + ')' : who + ' ' + n.n + '척이 우리를 막아섭니다!' + kt);
    // 회피는 전투의 실패가 아니라 따로 고르는 운영 선택이다 — 가능성을 미리 보여 준다
    var fleeP = U.clamp(0.35 + (R.fleetSpeed(S().loc.heading, curWind()) - n.spd) * 0.5 + R.skill('nav') * 0.08, 0.1, 0.9);
    var opts = [{ label: '싸운다', value: 'fight' }, { label: '도망친다 (약 ' + Math.round(fleeP * 100) + '%)', value: 'flee' }];
    if (!byMe && n.kind === 'pirate') {
      opts.push({ label: '통행료를 낸다 (금화 ' + U.num(tollOf()) + '닢)', value: 'pay' });
      if (canPlead()) opts.push({ label: '사정한다 (털어 갈 것이 없다)', value: 'plead' });
    }
    if (!byMe && n.hunt && G.Hostile) opts.push({ label: '배상금을 낸다 (금화 ' + U.num(G.Hostile.fee(n.nation)) + '닢 · 적대 −' + G.BALANCE.hostility.payCut + ')', value: 'repay' });
    if (byMe) opts.push({ label: '그냥 둔다', value: null });
    var v = await UI.ask(text, opts, G.Scenes.mateSpeaker('first'));
    st.busy--;
    if (!v) { n.cooldown = 3; return; }
    if (v === 'plead') {
      var boss = { name: pl + ' 두목' };
      await UI.say(U.pick(['뭐? 가진 게 그것뿐이라고? ...배를 뒤져 봐야 쥐새끼나 나오겠군. 가라, 가!', '흥, 빈털터리 뱃놈들이로군. 쏠 화약이 아깝다. 꺼져라!', '거지 떼를 털어서 뭐 하나. 오늘은 봐주지. 다음엔 두둑이 채워 오라고!']), boss);
      UI.toast('해적들이 비웃으며 길을 비켜 주었다.', 'sail'); n.hostile = false; n.fled = true; n.cooldown = 12; refreshHud(); return;
    }
    if (v === 'repay') {
      if (await G.SeaFolk.pay(n)) { n.hostile = false; n.hunt = false; n.fled = true; n.cooldown = 12; n.heading += Math.PI; refreshHud(); return; }
      v = 'fight';
    }
    if (v === 'pay') {
      var toll = tollOf();
      if (s.player.gold >= toll) { s.player.gold -= toll; UI.toast('해적에게 금화 ' + U.num(toll) + '닢을 주고 지나갔다.', 'coin'); n.hostile = false; n.fled = true; n.cooldown = 10; refreshHud(); return; }
      UI.toast('줄 돈이 없다!', 'coin'); v = 'fight';
    }
    if (v === 'flee') {
      if (U.chance(fleeP)) { UI.toast('간신히 따돌렸다!', 'sail'); n.cooldown = 4; n.fled = true; n.heading += Math.PI; return; }
      UI.toast('따라잡혔다! 싸울 수밖에 없다!', 'sword');
    }
    // battle
    if (!byMe && n.kind !== 'pirate') s.player.notoriety += 0;
    if (byMe && n.kind !== 'pirate') s.player.notoriety += n.kind === 'navy' ? 12 : 8;
    if (byMe && G.SeaFolk) G.SeaFolk.attacked(n);   // 먼저 공격하면 그 나라의 적대가 오른다
    st.npcs.splice(st.npcs.indexOf(n), 1);
    await UI.fade(function () { G.Game.go('battle', { npc: n }); });
  }
  function approachNpc(n) {
    var s = S();
    if (G.Geo.dist(s.loc.lon, s.loc.lat, n.lon, n.lat) > 0.8) { setTarget(n.lon, n.lat, null); return; }
    if (!n.hostile && !n.awed) { hail(n); return; }
    encounter(n, true);
  }
  /** 적의가 없는 배와 신호를 주고받는다: 소식·시세·보급, 또는 공격 */
  async function hail(n) {
    var s = S(), f = s.fleet;
    st.busy++; st.paused = true; refreshBar();
    var capStyle = A.fleetStyle(n.zone || G.Ships.zone(n.lon, n.lat), n.nation);
    var capSpec = A.npcSpec('hail' + n.id, 'captain', capStyle);
    A.withImg(capSpec, [A.rolePortraitKey(capSpec), 'portraits/npc/captain_' + A.imageCulture(capStyle)]);
    var who = { name: (n.nation ? n.nation + ' ' : '') + NPC_KIND[n.kind].name + ' 선장', portrait: capSpec,
      half: G.Img.chain.halfOf(A.portraitKeys(capSpec)) };
    if (G.SeaFolk) who = G.SeaFolk.captain(n, who);   // 탐험가·아직 동료가 아닌 항해사
    try {
      var opts = [{ label: '소식을 묻는다', value: 'news' }];
      if (G.SeaFolk && G.SeaFolk.canTalk(n)) opts.unshift({ label: '선장과 이야기한다', value: 'talk' });
      if (n.kind === 'merchant') opts.push({ label: '식량·물을 산다', value: 'buy' });
      opts.push({ label: '공격한다', value: 'attack' }, { label: '인사만 하고 지나간다', value: null });
      var v = await UI.ask((G.SeaFolk && G.SeaFolk.greet(n)) || (n.kind === 'merchant' ? '상선' : '함대') + '이 신호에 답했다. "좋은 바람이오! 무슨 일이오?"', opts, who);
      if (v === 'talk') await G.SeaFolk.talk(n, who);
      else if (v === 'news') {
        if (n.talked) { await UI.say('더 해 줄 이야기는 없소. 좋은 항해 되시오.', who); }
        else {
          n.talked = true;
          var r = U.rand(), d = G.Explore.nearUnknown(s.loc.lon, s.loc.lat, 30);
          if (d && r < 0.45) { G.Disc.addHint(d.id, 'hail'); await UI.say('뱃사람들 사이에 도는 이야기가 있소. ' + d.hint, who); UI.toast('단서를 얻었다: 「' + d.name + '」', 'scroll', 4200); }
          else { var tip = G.Explore.marketTip(); await UI.say(tip || '요즘 바다는 조용하오. 해적만 조심하시오.', who); }
          f.discipline = Math.min(100, f.discipline + 2);
        }
      } else if (v === 'buy') {
        var price = 4, qty = Math.min(Math.max(0, Math.floor(R.free())), Math.round(R.dailyUse() * 30));
        if (qty <= 0) UI.toast('실을 자리가 없다.', 'sack');
        else if (s.player.gold < qty * price) UI.toast('금화가 모자란다.', 'coin');
        else { s.player.gold -= qty * price; f.food += qty / 2; f.water += qty / 2; UI.toast('식량과 물 ' + qty + '통을 샀다. (금화 ' + U.num(qty * price) + '닢)', 'bread'); refreshHud(); }
      } else if (v === 'attack') {
        st.busy--; encounter(n, true); return;
      }
    } catch (e) { console.error(e); }
    n.cooldown = 6;
    st.busy--;
  }

  // ================================================================ update loop
  SEA.update = function (dt) {
    if (st) st.dtLast = dt;
    if (!st || !st.alive) return;
    var s = S(), l = s.loc;
    st.t += dt;
    var frozen = st.busy > 0 || UI.busy();
    // 멈춘 채 ←→: 시간은 흐르지 않고 뱃머리만 돌린다 (닻을 내린 채 방향을 잡는 것)
    if (!frozen && st.paused && st.manual && turnKey()) { st.turnHeld = (st.turnHeld || 0) + dt; l.heading += turnKey() * 1.4 * dt * turnAbility() * Math.min(1, 0.45 + st.turnHeld * 1.6); }
    st.handSteer = false;
    if (!frozen) arrowTurn(dt);
    if (!frozen && !st.paused) {
      // 손으로 키를 돌리는 동안은 ×1로 흐른다: 배속을 올려도 도는 반경과 손맛이 같다
      var spd = st.speed;
      if (st.manual && turnKey() && spd > 1) { spd = 1; st.handSteer = true; }
      var daysDt = dt * spd / DAY_SEC;
      var nsub = Math.max(1, Math.ceil(daysDt / 0.08)), subD = daysDt / nsub, subT = dt / nsub;
      var dayDue = false;
      for (var k = 0; k < nsub && !st.busy && !st.paused; k++) {
        var h0 = l.heading;
        steer(subT, spd);
        st.turnRate = st.turnRate * 0.7 + (U.angDiff(h0, l.heading) / Math.max(subD, 1e-4)) * 0.3;   // 선회율 (rad/일)
        move(subD, subT);
        if (st.fx && G.SeaFX) { G.SeaFX.age(st.fx, subD); st.fxAged = true; }
        updateNpcs(subD);
        st.dayAcc += subD;
        if (st.dayAcc >= 1 && !dayDue) { st.dayAcc -= 1; dayDue = true; }   // 하루가 지났다 — 이 장면의 남은 걸음을 마저 간 뒤에 처리 (걸음을 잃지 않게)
      }
      if (dayDue) runDay();
      if (!st.busy && (st.frame = (st.frame || 0) + 1) % 10 === 0) checkEncounters();
    }
    // 물보라·항적의 시간: 항해 중에는 게임 속 시간으로, 멈추거나 대화 중에는 천천히 사라진다
    if (st.fx && G.SeaFX && !st.fxAged) G.SeaFX.age(st.fx, dt / DAY_SEC * 0.45);     // 멈춰 있거나 대화 중: 실제 시간으로 천천히
    st.fxAged = false;
    if (frozen || st.paused) st.turnRate *= Math.exp(-dt * 3);
    updatePose(dt);
    if (G.VoyageFX) G.VoyageFX.step(st, dt, { speed: shipSpeed(), frozen: frozen });   // 가속 물보라·배웅
    if (G.Errand) G.Errand.onSea(l.lon, l.lat);
    // 돛: 멈추면 활대에 말아 올리고, 나아가면 편다 (약 1초)
    var furlT = (st.paused || st.stopping || shipSpeed() < 0.05) ? 1 : 0;
    st.furl = (st.furl || 0) + (furlT - (st.furl || 0)) * ease(dt, 1.6);
    // 해안 가까이 멈춰 있으면 닻을 내린 배처럼 뱃머리가 해안선과 나란해진다 (커진 배가 뭍에 걸쳐 보이지 않게)
    if (!st.manual && !st.path && st.dirCrs == null && shipSpeed() < 0.05 && !UI.busy()) alongCoast(dt);
    // 카메라: 진행 방향으로 조금 앞서 (속력에 비례, 최대 0.3°) — 흔들기·급한 확대는 쓰지 않는다
    //   배는 그대로 따라가고(속도만큼 뒤처지지 않아 배속을 올려도 배가 화면에서 떠밀리지 않는다), 어긋난 만큼만 부드럽게 좁힌다
    var P = FXS(), vsp = shipSpeed(), lead = Math.min(0.3, vsp * P.camLead);
    var ld = vsp > 0.02 ? Math.atan2(st.vel[1], st.vel[0]) : l.heading;
    st.camLead = st.camLead || [0, 0];
    var kl = ease(dt, 1.2);
    st.camLead[0] += (Math.cos(ld) * lead - st.camLead[0]) * kl;
    st.camLead[1] += (Math.sin(ld) * lead - st.camLead[1]) * kl;
    var cx = l.lon + st.camLead[0], cy = l.lat + st.camLead[1];
    var ex = G.Geo.wrapLon(st.cam.lon - cx), ey = st.cam.lat - cy, keep = 1 - ease(dt, P.camCatch || 4);
    if (Math.abs(ex) > 4 || Math.abs(ey) > 4) keep = 0;             // 멀리 떨어졌으면(출항 직후 등) 바로 옮긴다
    st.cam.lon = G.Geo.wrapLon(cx + ex * keep);
    st.cam.lat = cy + ey * keep;
    // 확대·축소: 휠·단추는 목표만 바꾸고, 여기서 부드럽게 다가간다
    if (st.cam.zoomT) {
      var zr = st.cam.zoomT / st.cam.zoom;
      if (Math.abs(zr - 1) < 0.004) { st.cam.zoom = st.cam.zoomT; st.cam.zoomT = 0; }
      else st.cam.zoom *= Math.pow(zr, ease(dt, P.zoomEase || 12));
    }
    // wind visual smoothing
    var wd = U.angDiff(st.windVis.dir, st.wind.dir), kw = ease(dt, 1.5);
    st.windVis.dir += wd * kw; st.windVis.spd += (st.wind.spd - st.windVis.spd) * kw;
    render(dt);
  };

  /* 조타
     · 수동(방향키): ←→를 누르는 동안 뱃머리를 돌린다. 처음엔 살짝, 누르고 있으면 제 빠르기로 (잔 조정이 쉽다).
       함대에서 가장 둔한 배의 선회력에 맞추고, 배가 거의 서 있으면 키가 잘 듣지 않는다.
     · 자동(항로·침로·숫자판): 가야 할 방위(st.crs)를 정하고, 맞바람이면 그 좌우 θ로 번갈아 뱃머리를 둔다(태킹) */
  function steer(dt, spd) {
    var s = S(), l = s.loc;
    if (st.manual) {
      var dir = turnKey();
      if (dir) {
        st.turnHeld = (st.turnHeld || 0) + dt;
        var ramp = Math.min(1, 0.45 + st.turnHeld * 1.6);
        l.heading += dir * 2.1 * dt * turnAbility() * ramp * (0.5 + 0.5 * (st.thr || 0));
      } else st.turnHeld = 0;
      return;
    }
    st.turnHeld = 0;
    var crs = null, dW = Infinity;
    if (st.path && st.pathI < st.path.length) {
      var wp = st.path[st.pathI];
      var dx = G.Geo.wrapLon(wp[0] - l.lon), dy = wp[1] - l.lat;
      var d = Math.sqrt(dx * dx + dy * dy);
      // 한 걸음보다 가까우면 들른 것으로 친다 (빠른 배속에서 길목을 맴돌지 않도록)
      if (d < Math.max(0.07, (st.lastStep || 0) * 1.2)) {
        st.pathI++; st.repath = 0; st.xt = 0;
        if (st.pathI >= st.path.length) arrived();
        return;
      }
      crs = Math.atan2(dy, dx); dW = d;
    } else if (st.dirCrs != null) crs = st.dirCrs;
    if (crs == null) return;
    st.crs = crs; st.dW = dW;
    var want = crs + (st.tackTheta ? st.tackSide * st.tackTheta : 0);
    var diff = U.angDiff(l.heading, want);
    // 키는 게임 속 시간에 맞춰 돌린다: 배속을 올려도 도는 반경이 같다
    // 큰 배는 선체를 천천히 돌린다 (게임 속 시간 기준 — 배속을 올려도 도는 반경이 같다). 진행 방향은 관성으로 뒤따른다(move)
    var rate = 2.6 * dt * (spd || 1) * turnAbility(), ad = Math.abs(diff);
    if (st.tackTheta && ad > 0.3) rate *= 1.6;   // 뱃머리를 바람 너머로 돌려 반대쪽 다리로 (태킹)
    if (dW < 0.6 && ad > 0.5) rate *= 1.8;        // 코앞의 길목은 크게 꺾는다 (move에서 속력도 줄인다)
    l.heading += U.clamp(diff, -rate, rate);
  }
  function updatePose(dt) {
    var P = FXS(), t = st.t, ws = st.windVis ? st.windVis.spd : 0.5, sr = Math.min(1.4, shipSpeed() / P.refSpeed);
    var sea = 0.45 + 0.8 * ws + (st.storm > 0 ? 0.8 : 0);
    var turnHeel = U.clamp(-(st.turnRate || 0) * sr * 0.045, -0.22, 0.22);                 // 도는 반대쪽(바깥)으로 기운다
    var rel = st.windVis ? U.angDiff(S().loc.heading, st.windVis.dir) : 0;
    var windHeel = Math.sin(rel) * ws * 0.10 * Math.min(1, sr * 2);                           // 옆바람을 받으면 바람 아래로
    var accPitch = U.clamp((st.accel || 0) * 0.06, -0.05, 0.06);
    var RD = G.FX && G.FX.ride, WV = G.Waves, ps = st.pose;
    if (RD && RD.on !== false && WV && dt > 0) {
      // 보이는 파도를 탄다: 화면의 바다 셰이더와 같은 식으로 선체 위 다섯 점의 높이를 재고, 용수철-감쇠로 따라간다
      var l = S().loc, stK = st.storm > 0 ? RD.storm : 1;
      var w = rideWave(l.lon, l.lat, l.heading, shipPx());
      var tgt = { roll: P.roll * (turnHeel + windHeel + w.roll * stK), pitch: P.pitch * (w.pitch * stK + accPitch), heave: P.heave * w.heave * stK };
      st.ride = st.ride || WV.newRide();
      var R = st.ride, vp0 = R.vp;
      WV.spring(R, tgt, RD, Math.min(dt, 0.1));
      ps.roll = U.clamp(R.roll, -RD.maxRoll, RD.maxRoll); ps.pitch = U.clamp(R.pitch, -RD.maxPitch, RD.maxPitch); ps.heave = U.clamp(R.heave, -RD.maxHeave, RD.maxHeave);
      // 선수가 파도에 박힌다: 뱃머리가 빠르게 내려가는 순간, 달리고 있으면 선수 물보라가 크게 튄다
      R.cool = Math.max(0, R.cool - dt);
      if (R.vp < -RD.slam && vp0 >= -RD.slam && sr > 0.35 && !R.cool && st.fx && G.SeaFX && G.SeaFX.burst && !st.paused) {
        R.cool = RD.slamCool;
        G.SeaFX.burst(st.fx, l.lon, l.lat, l.heading, shipGeom(), shipSpeed(), RD.slamSpray * Math.min(2, (0.6 + sr * 0.7) * (-R.vp / RD.slam) * 0.8));
        st.slams = (st.slams || 0) + 1;
      }
      // 따르는 배: 제 자리의 파도를 탄다 (자리는 기함 기준 화면 px — 세상 좌표로 바꾼다)
      var z = st.cam ? st.cam.zoom : 110, f = S().fleet;
      st.rideF = st.rideF || [];
      for (var si = 1; si < f.ships.length; si++) {
        var sp0 = st.slotPos && st.slotPos[si]; if (!sp0) continue;
        var wf = rideWave(l.lon + sp0[0] / z, l.lat - sp0[1] / z, l.heading, followPx()), fk = RD.follow * stK;
        var RF = st.rideF[si] = st.rideF[si] || WV.newRide();
        WV.spring(RF, { roll: P.roll * (turnHeel * 0.9 + windHeel + wf.roll * fk), pitch: P.pitch * (wf.pitch * fk + accPitch), heave: P.heave * wf.heave * fk }, RD, Math.min(dt, 0.1));
      }
    } else {
      var roll = P.roll * (turnHeel + windHeel + Math.sin(t * 0.9 + 1.3) * 0.030 * sea);
      var pitch = P.pitch * (Math.sin(t * 1.15 + 0.4) * 0.030 * sea + accPitch);
      var heave = P.heave * (Math.sin(t * 1.35) * 0.6 + Math.sin(t * 0.73 + 2.0) * 0.4) * 0.018 * sea;
      var k = Math.min(1, dt * 4);
      ps.roll += (roll - ps.roll) * k; ps.pitch += (pitch - ps.pitch) * k; ps.heave += (heave - ps.heave) * k;
      st.rideF = null;
    }
    // 돛·깃발: 겉바람(참바람 − 배의 속도)을 따라 활대가 돌고, 삼각돛은 바람 아래쪽으로 넘어가며, 맞바람이면 펄럭인다
    if (WV && st.windVis && dt > 0) {
      var wsK = (RD && RD.windScale) || 1.6, vk = 0.5 / P.refSpeed;
      var ap = WV.apparent({ dir: st.windVis.dir, spd: st.windVis.spd * wsK }, (st.vel ? st.vel[0] : 0) * vk, (st.vel ? st.vel[1] : 0) * vk, S().loc.heading);
      st.rig = WV.rigStep(st.rig || {}, ap, Math.min(dt, 0.1), st.furl || 0);
    }
  }
  /** 이 자리의 파도가 미는 흔들림 (G.FX.ride.sea 배율을 곱한 값) — 배 그림 길이 lenPx의 선체 위 다섯 점 */
  function rideWave(lon, lat, heading, lenPx) {
    var WV = G.Waves, RD = G.FX.ride, K = RD.sea, z = st.cam ? st.cam.zoom : 110, r = G.Game.renderer;
    var pxD = z * (r && r.canvas ? r.canvas.width / 1600 : 1);
    var wind = st.windVis ? [Math.cos(st.windVis.dir) * st.windVis.spd, Math.sin(st.windVis.dir) * st.windVis.spd] : [0.5, 0.3];
    var Lb = Math.min(lenPx / z, 0.45 * WV.seaSwell()), cst = WV.coast(lon, lat), t = st.t;
    var h = WV.hull(function (x, y) { return WV.sea(x, y, t, wind, pxD, cst); }, lon, lat, heading, Lb, Lb * 0.5);
    var ch = K.chop || 0;
    return { roll: (h.roll + ch * h.lr) * K.roll, pitch: (h.pitch + ch * h.lp) * K.pitch, heave: h.heave * K.heave };
  }
  function arrived() {
    var tgt = st.target;
    st.path = null; st.target = null;
    if (tgt && tgt.city) { st.paused = true; st.vel = [0, 0]; refreshBar(); setTimeout(function () { if (st.alive && !st.busy) tryEnterPort(); }, 50); }
    else { st.stopping = true; refreshBar(); UI.toast('목적지에 도착했습니다.', 'anchor'); }
  }
  /* 돛 조절(수동): ↑를 누르면 THR_UP초에 걸쳐 돛을 다 펴고, 떼면 THR_COAST초에 걸쳐 서서히 멈춘다. ↓는 THR_BRAKE초에 세운다.
     (실제 시간 기준 — 손맛이 배속에 따라 달라지지 않게) */
  var THR_UP = 0.7, THR_COAST = 1.8, THR_BRAKE = 0.4;
  var TACK_MIN = 0.25;   // 목적지·길목이 이보다 가까우면 지그재그를 그만두고 곧장 붙는다
  function move(days, dtR) {
    var s = S(), l = s.loc, P = FXS();
    if (!st.path && !st.manual && st.dirCrs == null && !st.stopping && shipSpeed() < P.stopSpeed) return;
    st.sailT = (st.sailT || 0) + days;
    if (st.noTack > 0) st.noTack -= days;
    var wind = curWind(), k0 = (st.storm > 0 ? 0.6 : 1) * (st.slowDays > 0 ? 0.7 : 1), v = 0, m = null;
    var h = l.heading;
    // ---------------- 목표 속력 (돛·바람이 주는 힘) — 실제 속력은 선체의 관성으로 이것을 뒤따른다
    if (st.stopping) {
      v = 0;
    } else if (st.manual) {
      var kk = st.keys, brake = kk.arrowdown || kk.s || st.braking, goal = brake ? 0 : ((kk.arrowup || kk.w || st.cruise) ? 1 : 0);
      var thr = st.thr || 0, dtr = dtR || days * DAY_SEC;
      if (thr < goal) thr = Math.min(goal, thr + dtr / THR_UP);
      else if (thr > goal) thr = Math.max(goal, thr - dtr / (brake ? THR_BRAKE : THR_COAST));
      st.thr = thr;
      m = R.fleetMotion(h, wind);
      v = m.straight * thr;                          // 손으로 모는 배는 뱃머리 방향 그대로 (맞바람이면 스스로 지그재그를 해야 한다)
      if (brake) v = 0;
    } else if (st.path || st.dirCrs != null) {
      var crs = st.crs != null ? st.crs : h;
      m = R.fleetMotion(crs, wind);
      var tack = m.theta > 0.05 && (st.dW == null || st.dW >= TACK_MIN) && !(st.noTack > 0) && !st.arrowSteer;   // 방향키로 몰 때는 지그재그 없이 뱃머리 쪽으로 (맞바람이면 그만큼 느리게)
      if (tack) {
        if (!st.tackTheta || !st.tackSide) st.tackSide = st.tackSide || (m.legP >= m.legM ? 1 : -1);
        st.tackTheta = m.theta;
        // 한 다리의 폭: 길목까지 거리의 30% (0.05°~0.35°) — 가운데 줄을 사이에 두고 좌우로 번갈아
        var lim = U.clamp((st.dW == null || st.dW === Infinity ? 1.2 : st.dW) * 0.3, 0.05, 0.35);
        if (st.tackSide * (st.xt || 0) >= lim && Math.abs(U.angDiff(h, crs + st.tackSide * m.theta)) < 0.25) { st.tackSide = -st.tackSide; st.tacks = (st.tacks || 0) + 1; }
        v = m.vmg / Math.cos(m.theta);               // 다리를 따라 달리는 속력 (목적 방향으로는 vmg만큼 다가간다)
      } else { st.tackTheta = 0; v = m.vmg; }
      // 길목이 코앞인데 뱃머리가 크게 틀어져 있으면 속력을 줄여 선회 반경을 좁힌다 (길목을 맴돌지 않게)
      var off = Math.abs(U.angDiff(h, crs + (st.tackTheta ? st.tackSide * st.tackTheta : 0)));
      if (st.dW != null && st.dW < 0.6 && off > 0.6) v *= U.clamp(st.dW / 0.6, 0.35, 1);
      // 마지막 목적지에 다가가면 돛을 줄인다
      if (st.path && st.pathI === st.path.length - 1 && st.dW != null) v *= U.clamp(st.dW / P.arriveSlow, 0.3, 1);
    }
    v *= k0;
    // ---------------- 관성: 선체 앞뒤 방향은 가속·감속 시간으로, 옆 방향 미끄러짐은 물의 저항으로 줄어든다
    var hx = Math.cos(h), hy = Math.sin(h), vel = st.vel || (st.vel = [0, 0]);
    var fw = vel[0] * hx + vel[1] * hy, lt = -vel[0] * hy + vel[1] * hx;
    fw += (v - fw) * (1 - Math.exp(-days / (fw < v ? P.accel : P.decel)));
    if (fw < 0) fw *= Math.exp(-days / 0.1);
    lt *= Math.exp(-days / P.lateral);
    var maxLt = Math.abs(fw) * Math.tan(P.maxDrift);
    if (Math.abs(lt) > maxLt) lt = lt > 0 ? maxLt : -maxLt;
    var prevSp = shipSpeed();
    vel[0] = fw * hx - lt * hy; vel[1] = fw * hy + lt * hx;
    st.lat = lt; st.fwd = fw;
    var sp = shipSpeed();
    st.accel = st.accel * 0.8 + ((sp - prevSp) / Math.max(days, 1e-4)) * 0.2;
    // 다 멈췄다
    if (sp < P.stopSpeed && v < P.stopSpeed) {
      if (st.stopping || (st.manual && !(st.thr > 0.001))) { vel[0] = vel[1] = 0; st.stopping = false; st.thr = 0; st.braking = false; st.paused = true; st.lastStep = 0; refreshBar(); return; }
    }
    var md = Math.atan2(vel[1], vel[0]);
    var dist = sp * days;
    st.lastStep = dist;
    if (dist <= 0) return;
    var x0 = l.lon, y0 = l.lat;
    var nx = l.lon + Math.cos(md) * dist, ny = l.lat + Math.sin(md) * dist;
    if (!st.manual && st.tackTheta && m && !G.Geo.isSea(nx, ny, 0.2)) {
      // 지그재그 다리가 뭍에 걸렸다: 반대쪽 다리로 돌리고, 이번 걸음은 가야 할 방위대로 (곧 또 걸리면 한동안 지그재그 없이)
      if (st.sailT - (st.lastFlip || -9) < 0.3) st.noTack = 0.8;
      st.lastFlip = st.sailT; st.tackSide = -st.tackSide; st.xt = 0;
      md = st.crs; dist = Math.min(dist, m.vmg * k0 * days); st.lastStep = dist;
      nx = l.lon + Math.cos(md) * dist; ny = l.lat + Math.sin(md) * dist;
    }
    if (G.Geo.isSea(nx, ny, 0.2) && (!st.manual || bowClear(nx, ny, l.heading))) {
      step(nx, ny, dist);
      if (!st.manual && st.crs != null) st.xt = (st.xt || 0) + dist * Math.sin(U.angDiff(st.crs, md));
    } else {
      // 뭍을 따라 미끄러진다 (그만큼 속력을 잃는다)
      var ok = false;
      for (var a = 1; a <= 6 && !ok; a++) {
        for (var sgn = -1; sgn <= 1; sgn += 2) {
          var h2 = md + sgn * a * 0.25;
          var x2 = l.lon + Math.cos(h2) * dist * 0.7, y2 = l.lat + Math.sin(h2) * dist * 0.7;
          if (G.Geo.isSea(x2, y2, 0.2) && (!st.manual || bowClear(x2, y2, l.heading))) { step(x2, y2, dist * 0.7); ok = true; vel[0] *= 0.8; vel[1] *= 0.8; break; }
        }
      }
      // 자동 항해 중, 지형 자료의 해상도 탓에 막힌 좁은 물목이면(앞으로 0.1° 안에 다시 물) 그대로 지나간다
      if (!ok && st.path && thinBar(l.lon, l.lat, md, dist)) { step(nx, ny, dist); ok = true; }
      if (!ok) { vel[0] = vel[1] = 0; }
      if (!ok && (st.manual || st.stopping)) { st.thr = 0; st.cruise = false; st.stopping = false; st.paused = true; refreshBar(); UI.toast('뭍에 닿아 배를 세웠습니다. 뱃머리를 돌려 나아가십시오.', 'anchor'); return; }
      if (!ok) {
        // 자동 항해 중이면 지금 자리에서 뱃길을 다시 찾는다
        var tg = st.target;
        if (st.direct) {
          st.path = null; st.target = null; st.manual = false; st.paused = true; refreshBar();
          UI.toast('뭍에 막혔습니다. 익숙하지 않은 항로라 스스로 돌아갈 길을 찾지 못합니다 — 바다를 눌러 새 침로를 잡으십시오.', 'map', 5000);
          return;
        }
        if (tg && st.path && (st.repath || 0) < 4) {
          st.repath = (st.repath || 0) + 1;
          // 얕은 물가에 끼었으면 곁의 깊은 물로 살짝 옮긴 뒤 뱃길을 찾는다
          var deep = deepWater(l.lon, l.lat);
          if (deep) { l.lon = deep[0]; l.lat = deep[1]; }
          var np = G.Nav.path(l.lon, l.lat, tg.lon, tg.lat);
          if (np && np.length > 1) {
            st.path = np; st.pathI = 1;
            var w0 = np[1]; l.heading = Math.atan2(w0[1] - l.lat, G.Geo.wrapLon(w0[0] - l.lon)); st.xt = 0;
            return;
          }
        }
        st.path = null; st.dirCrs = null; st.manual = false; st.paused = true; refreshBar();
        UI.toast('육지에 막혀 더 나아갈 수 없습니다.', 'anchor');
        return;
      }
    }
    // 물보라·항적: 실제로 지나간 길을 따라 (배속·장면 수와 상관없이 거리로 센다)
    if (st.fx && G.SeaFX) G.SeaFX.step(st.fx, { x0: x0, y0: y0, x: l.lon, y: l.lat, h: l.heading, vx: vel[0], vy: vel[1], lat: lt, fwd: fw, turn: st.turnRate || 0, days: days }, shipGeom());
  }
  /** 기함의 크기 (세상 좌표 °): 화면의 배 그림 크기 ÷ 확대 */
  function shipGeom() { var z = st.cam ? st.cam.zoom : 110, L = shipPx() / z; return { len: L, wid: L * 0.34, ref: FXS().refSpeed, zoom: z }; }
  /** 배 그림 크기(px): 기함 · 따르는 배 · 다른 배 (조정값 G.FX.ship.size·followSize·npcSize) */
  function shipPx() { return FXS().size || 95; }
  function followPx() { return FXS().followSize || 76; }
  function npcPx() { return FXS().npcSize || 54; }
  SEA.shipPx = shipPx;
  /** 손으로 몰 때 뱃머리가 뭍에 닿는지 (그림의 뱃머리 끝과 멈추는 자리를 맞춘다 — 아주 좁은 물길을 막지 않게 최대 0.3°, 확대하면 배 그림이 세상에서 작아지므로 더 붙을 수 있다) */
  function bowClear(x, y, h) {
    var L = shipPx() / (st.cam ? st.cam.zoom : 110), a = Math.min(0.3, L * 0.42);
    return G.Geo.isSea(x + Math.cos(h) * a, y + Math.sin(h) * a, 0.2);
  }
  /** 뱃머리 앞의 뭍이 아주 얇은가 (자료 해상도에서 생긴 모래톱 같은 것) */
  function thinBar(lon, lat, h, dist) {
    var c = Math.cos(h), sn = Math.sin(h);
    for (var d = Math.max(dist, 0.01); d <= 0.1; d += 0.01) if (G.Geo.isSea(lon + c * d, lat + sn * d, 0.2)) return true;
    return false;
  }
  /** 곁에 있는 깊은 물 (물길로 이어진 곳만, 0.2° 안) */
  function deepWater(lon, lat) {
    if (G.Geo.isSea(lon, lat, 0.9)) return null;
    for (var r = 0.03; r <= 0.2001; r += 0.03) {
      for (var a = 0; a < 16; a++) {
        var h = a / 16 * Math.PI * 2, x = lon + Math.cos(h) * r, y = lat + Math.sin(h) * r;
        if (!G.Geo.isSea(x, y, 0.9)) continue;
        var wet = true;
        for (var t = 1; t < 6 && wet; t++) if (!G.Geo.isSea(lon + (x - lon) * t / 6, lat + (y - lat) * t / 6, 0)) wet = false;
        if (wet) return [G.Geo.wrapLon(x), y];
      }
    }
    return null;
  }
  function step(nx, ny, dist) {
    var s = S(), l = s.loc;
    var dLon = G.Geo.wrapLon(nx - l.lon);
    l.lon = G.Geo.wrapLon(nx); l.lat = U.clamp(ny, -80, 84);
    s.stats.distance += dist;
    G.Disc.trackCirc(dLon);
    if (st.path && st.path.length) {
      // keep path longitudes near the ship (unwrapped path vs wrapped position)
      var wp = st.path[st.pathI] || st.path[st.path.length - 1];
      var off = Math.round((wp[0] - l.lon) / 360) * 360;
      if (off) st.path.forEach(function (p) { p[0] -= off; });
    }
  }

  // ================================================================ daily processing
  async function runDay() {
    var s = S(), f = s.fleet, l = s.loc;
    st.busy++;
    try {
      var msgs = G.Game.newDay();
      f.daysOut = (f.daysOut || 0) + 1;
      st.dayCount++;
      // wind of the day
      st.wind = R.wind(l.lon, l.lat, s.date, st.dayCount);
      if (st.calm > 0) st.calm--;
      // supplies
      var use = R.dailyUse();
      // 식량·물이 모자라면 싣고 가는 교역품(곡식·어육·고기 / 맥주·포도주)을 먹고 마신다
      if (f.food < use) { var ef = R.eatCargo('food', use - f.food); if (ef) { f.food += ef; if (!st.ateCargo) { st.ateCargo = true; msgs.push({ icon: 'bread', text: '식량이 떨어져 싣고 가던 교역품을 먹기 시작했다.' }); } } }
      if (f.water < use) { var ew = R.eatCargo('water', use - f.water); if (ew) { f.water += ew; if (!st.drankCargo) { st.drankCargo = true; msgs.push({ icon: 'drop', text: '물이 떨어져 싣고 가던 맥주·포도주를 마시기 시작했다.' }); } } }
      f.food = Math.max(0, f.food - use); f.water = Math.max(0, f.water - use);
      if (f.food <= 0 || f.water <= 0) {
        var SV = (G.BALANCE && G.BALANCE.starve) || [0.03, 0.07];
        var dx = f.crew * U.rf(SV[0], SV[1]), dead = Math.floor(dx) + (U.chance(dx % 1) ? 1 : 0);   // 작은 배라고 날마다 꼭 한 명씩 쓰러지지는 않는다 (괴혈병과 같은 셈)
        f.crew = Math.max(0, f.crew - dead); f.fatigue = Math.min(100, f.fatigue + 4); f.discipline = Math.max(0, f.discipline - 4);
        if (dead) msgs.push({ icon: 'skull', text: (f.food <= 0 ? '식량' : '물') + '이 떨어져 선원 ' + dead + '명이 쓰러졌다!' });
        else if (U.chance(0.34)) msgs.push({ icon: 'skull', text: (f.food <= 0 ? '식량' : '물') + '이 떨어졌다. 선원들이 쓰러지기 직전이다!' });
      }
      // fatigue & discipline
      var BAL = G.BALANCE || {};
      var fb = 1.1 - R.skill('nav') * 0.22 + (st.storm > 0 ? 3 : 0) + (f.crew < R.crewMin() ? 0.8 : 0);
      if (BAL.spareWatch && f.crew >= Math.ceil(R.crewMin() * BAL.spareWatch)) fb -= BAL.spareRest || 0;   // 교대할 선원이 넉넉하다
      if (st.path || st.dirCrs != null || (st.manual && st.thr > 0.1)) { var row = st.manual ? (R.fleetMotion(l.heading, curWind()), R.fleetInfo && R.fleetInfo.row) : (R.fleetMotion(st.crs != null ? st.crs : l.heading, curWind()), R.rowing); if (row) { fb += 0.9; if (!st.rowWarned) { st.rowWarned = true; msgs.push({ icon: 'people', text: '돛이 바람을 못 받아 선원들이 노를 젓는다. 노를 오래 저으면 지친다.' }); } } else st.rowWarned = false; }
      var CC = BAL.crewCare || {};
      fb -= R.skillRead('cook') * (CC.cookFatigue || 0.12);       // 요리: 따뜻한 끼니가 고단함을 덜어 준다
      var CBN = G.Cabins;                                          // 기함의 선실 (사람을 배치한 방만 힘을 낸다)
      if (CBN) fb -= CBN.fx('galley', 'galley') + CBN.fx('mess', 'mess') + CBN.fx('helm', 'helm');
      f.fatigue = U.clamp(f.fatigue + fb, 0, 100);
      var morale = R.fleetBonus('morale');
      f.discipline = U.clamp(f.discipline - (f.fatigue > 60 ? 0.9 : 0.25) + R.skill('ops') * 0.18 + R.skill('theo') * 0.08 + R.skillRead('music') * (CC.musicDiscipline || 0.15) + morale * 2
        + (CBN ? CBN.fx('chapel', 'chapel') + CBN.fx('rec', 'rec') + CBN.fx('deck', 'deck') + CBN.fx('mess', 'messD') : 0), 0, 100);
      // scurvy
      // 괴혈병: 의술·과학이 있으면 늦게, 느리게 번진다 (G.BALANCE.scurvy*)
      var med = R.medSkill(), sci = R.skill('sci'), onset = scurvyOnset();
      if (f.daysOut > onset && !s.flags.limeActive) {
        f.scurvy = (f.scurvy || 0) + U.clamp((0.8 + (f.daysOut - onset) * (BAL.scurvyGrow || 0.04)) * Math.max(0.35, 1 - med * 0.18 - sci * 0.08) * Math.max(0.4, 1 - (CBN ? CBN.fx('sick', 'sick') : 0)), 0.05, 4);
        if (f.scurvy > 18 && U.chance(0.5)) {
          var sx = f.crew * (BAL.scurvyDeath || 0.012) * f.scurvy / 18, sd = Math.floor(sx) + (U.chance(sx % 1) ? 1 : 0);   // 작은 배라고 매번 한 명씩 쓰러지지는 않는다
          f.crew = Math.max(0, f.crew - sd);
          if (!st.scurvyWarned) { msgs.push({ icon: 'skull', text: '괴혈병이 번지고 있다! 선원이 하나둘 쓰러진다...' }); st.scurvyWarned = true; }
        }
        if (f.scurvy > 12 && R.hasItem('lime') && R.useCharge('lime')) { s.flags.limeActive = 60; f.scurvy = 0; msgs.push({ icon: 'drop', text: '라임 절임을 선원들에게 나누어 주었다. 괴혈병이 가라앉았다.' }); }
      }
      if (s.flags.limeActive) { s.flags.limeActive--; if (s.flags.limeActive <= 0) delete s.flags.limeActive; }
      // rats
      var ratL = BAL.ratLoss || [0.1, 0.25];
      if (!R.hasItem('cat') && f.food > 10 && U.chance(BAL.rat != null ? BAL.rat : 0.015)) { var lost = Math.round(f.food * U.rf(ratL[0], ratL[1])); f.food -= lost; st.warnedFor = null; msgs.push({ icon: 'sack', text: '쥐가 식량 ' + lost + '통을 먹어 치웠다! (배 고양이가 있으면 막을 수 있다)' }); }
      // cargo spoilage
      for (var gid in f.cargo) {
        var g = G.GOOD[gid], cg = f.cargo[gid];
        if (!G.Cargo && g.life && s.day - cg.d > g.life) {   // 상함은 G.Cargo.daily (world.js)
         var sp = Math.max(1, Math.ceil(cg.q * 0.08)); cg.q -= sp; if (cg.q <= 0) delete f.cargo[gid]; if (U.chance(0.2)) msgs.push({ icon: 'sack', text: U.j(g.name, '이/가') + ' 상하기 시작했다.' }); }
      }
      // repairs at sea
      // 바다 위 수리: 배마다 그 배 선장(기함은 제독·부관)의 조선기술
      //   자재(f.mat)가 있어야 고친다 — 내구 1마다 자재 BAL.matPerHp통. 자재가 떨어지면 한 번 알린다
      var mph = BAL.matPerHp != null ? BAL.matPerHp : 0.4, wanted = false;
      f.ships.forEach(function (sh) {
        var k = R.shipSkill(sh, 'ship'); if (!k || sh.hp >= sh.maxHp) return;
        wanted = true;
        var fix = Math.min(0.25 * k, sh.maxHp - sh.hp, (f.mat || 0) / mph);
        if (fix <= 0) return;
        sh.hp += fix; f.mat = Math.max(0, (f.mat || 0) - fix * mph);
      });
      // 선박 수리실: 목수들이 기함을 따로 더 고친다 (자재가 든다)
      var fs0 = f.ships[0], rp0 = CBN ? CBN.fx('repair', 'repair') : 0;
      if (rp0 > 0 && fs0 && fs0.hp < fs0.maxHp) { wanted = true; var fx0 = Math.min(rp0, fs0.maxHp - fs0.hp, (f.mat || 0) / mph); if (fx0 > 0) { fs0.hp += fx0; f.mat = Math.max(0, (f.mat || 0) - fx0 * mph); } }
      // 사육실: 닭·염소가 달걀과 젖을 낸다
      if (CBN) f.food += CBN.fx('pen', 'pen');
      if (wanted && (f.mat || 0) < 0.05 && !st.noMatWarned) { st.noMatWarned = true; msgs.push({ icon: 'sack', text: '자재가 떨어져 바다 위에서 배를 고칠 수 없다. 항구에서 자재를 실어야 한다.' }); }
      if ((f.mat || 0) >= 1) st.noMatWarned = false;
      // 연안선은 먼 바다의 큰 파도에 상한다
      var off = G.Ships.offshore(l.lon, l.lat);
      if (off > G.Ships.OPEN) f.ships.forEach(function (sh) {
        if (!G.Ships.has(sh, 'coast') || G.Ships.has(sh, 'sturdy') || !U.chance(0.14)) return;
        sh.hp = Math.max(1, sh.hp - sh.maxHp * U.rf(0.03, 0.06));
        msgs.push({ icon: 'wind', text: '먼 바다의 큰 파도에 ' + sh.name + '호가 삐걱거린다. (' + G.SHIP[sh.type].name + U.jx(G.SHIP[sh.type].name, '은/는') + ' 연안선이다)' });
      });
      // chart & ports
      G.State.revealChart(l.lon, l.lat, chartR());
      discoverPorts();
      if (st.stormGuard > 0) st.stormGuard--;
      if (st.stormRisk > 0) st.stormRisk--;
      if (st.slowDays > 0) st.slowDays--;
      // 계절풍 바다에 들어섰다: 지금 부는 바람을 알려 준다 (바다·계절풍마다 한 번)
      if (G.Monsoon) {
        var mz = G.Monsoon.at(l.lon, l.lat);
        if (mz) { var mk = mz.id + ':' + G.Monsoon.phase(mz); if (st.monsoonIn !== mk) { st.monsoonIn = mk; var mnx = G.Monsoon.next(mz); msgs.push({ icon: 'wind', text: mz.name + '의 ' + G.Monsoon.NAME[G.Monsoon.phase(mz)] + ' 속에 들어섰다 (' + mnx.date.m + '월 ' + mnx.date.d + '일 무렵 바뀜). ' + mz.tip[G.Monsoon.phase(mz)] + '.' }); } }
        else st.monsoonIn = null;
      }
      // special flags
      if (l.lat < -33.5 && l.lon > 17 && l.lon < 40) s.flags.viaCape = true;
      if (l.lat > 10 && l.lat < 30 && l.lon > -20 && l.lon < 0) {} // African Atlantic coast: nothing
      // weather
      weatherDay(msgs);
      if (st.stormDays > 0) { st.stormDays--; if (st.stormDays === 0) st.storm = 0; }
      // npcs
      spawnNpcs();
      st.npcs.forEach(function (n) { if (n.cooldown) n.cooldown--; });
      // show notices
      var news = msgs.filter(function (m) { return m.history; });
      msgs.filter(function (m) { return !m.history; }).forEach(function (m) { UI.toast(m.text, m.icon); });
      refreshHud();
      if (news.length) { if (G.SeaNews) G.SeaNews.show(news); else await G.Scenes.city.news(news); }   // 항해를 멈추지 않고 오른쪽 위에 잠깐
      if (G.Cabins && s.leaving && s.leaving.length) await G.Cabins.farewell();   // 충성이 바닥난 부하가 내리겠다고 나선다
      // 망루: 수평선 너머를 살핀다
      var sensed = G.Explore.sense('sea', l.lon, l.lat);
      if (sensed.length) await G.Explore.report(sensed, l.lon, l.lat, 'sea');
      // 이정표: 새 바다, 적도, 회귀선, 극권
      await G.Explore.milestones(l.lon, l.lat, st.prevLat);
      st.prevLat = l.lat;
      // 보급 경고 (목적지까지 모자라면 한 번 알린다)
      supplyWarn();
      prefetchAhead();
      // discoveries at sea
      var ds = G.Disc.checkSea(l.lon, l.lat);
      for (var i = 0; i < ds.length; i++) {
        if (!ds[i]) continue;
        await UI.say(seaLine(ds[i]), G.Scenes.mateSpeaker(R.skill('survey') ? 'surveyor' : 'first'));
        await G.Disc.find(ds[i], 'sea');
      }
      var lefts = G.Disc.leftHere('sea', l.lon, l.lat);
      for (var li = 0; li < lefts.length; li++) await G.Disc.pickupLeft(lefts[li]);
      if (G.Disc.foundByMe('circum') === false && s.circ && s.circ.done && !s.circ.told) { s.circ.told = true; UI.toast('지구를 한 바퀴 돌았다! 모항에 돌아가면 세계일주가 완성된다.', 'globe', 5000); }
      // crises
      await crises(msgs);
      if (st.dayCount % 3 === 0) drawMini();
    } catch (e) { console.error(e); }
    st.busy--;
  }
  SEA.runDay = runDay;
  /** 괴혈병이 번지기 시작하는 날 (출항 뒤): 의술·과학이 늦춘다 */
  function scurvyOnset() { var B = G.BALANCE || {}; return (B.scurvyOnset || 40) + R.medSkill() * (B.scurvyMed || 0) + R.skill('sci') * (B.scurvySci || 0); }
  SEA.scurvyOnset = scurvyOnset;
  /** 식량이 갑자기 줄거나 선원이 늘었을 때 보급 경고를 다시 할 수 있게 한다 */
  SEA.rearmSupplyWarn = function () { if (st) st.warnedFor = null; };
  SEA.etaDays = function () { return etaDays(); };
  function seaLine(d) {
    if (d.cat === 'geo') return '제독! 저것을 보십시오. 우리가 찾던 곳이 틀림없습니다!';
    if (d.cat === 'creature') return '제독, 뱃전에 이상한 것이 있습니다! 저런 생물은 처음 봅니다!';
    return '제독! 저기 무언가 보입니다!';
  }
  function discoverPorts() {
    var s = S(), l = s.loc, r = R.surveyRange() + 0.4;
    G.CITY_DATA.forEach(function (c) {
      if (!c.port || s.known.indexOf(c.id) >= 0 || !R.cityExists(c)) return;
      if (G.Geo.dist(l.lon, l.lat, c.lon, c.lat) < r) {
        s.known.push(c.id);
        G.State.log('새로운 항구 ' + c.name + U.j(c.name, '을/를').slice(c.name.length) + ' 발견했다.');
        UI.toast('새로운 항구 「' + c.name + '」' + U.jx(c.name, '을/를') + ' 발견했다!', 'anchor', 4000);
        s.player.fame += 3 + (G.REGION_DIST[0][c.region] || 0) * 3;
      }
    });
  }
  function stormChance(lon, lat, m) {
    var p = 0.012;
    if (lat > 45 && (m >= 10 || m <= 3)) p = 0.05;                                // North Atlantic winter
    if (lat < -32 && lon > 5 && lon < 45) p = 0.06;                               // Cape of Storms
    if (lat < -45) p = 0.07;                                                      // Roaring forties
    if (lon > -90 && lon < -55 && lat > 10 && lat < 30 && m >= 8 && m <= 10) p = 0.06; // hurricanes
    if (lon > 110 && lon < 145 && lat > 10 && lat < 35 && m >= 7 && m <= 10) p = 0.06; // typhoons
    if (lon > 50 && lon < 95 && lat > 0 && lat < 25 && m >= 6 && m <= 8) p = 0.035;   // monsoon squalls
    return p * risk().storm;
  }
  /** 교회에서 빈 항해의 무사: 넉 달 동안 폭풍을 덜 만난다 (예전 저장의 blessed = 1은 이미 끝난 것으로 본다) */
  function blessed() { var s = S(); return !!s.flags.blessed && s.flags.blessed > s.day; }
  SEA.blessed = blessed;
  function weatherDay(msgs) {
    var s = S(), l = s.loc, f = s.fleet;
    if (st.stormDays > 0) return;
    var p = stormChance(l.lon, l.lat, s.date.m) * Math.max((G.BALANCE && G.BALANCE.stormFloor) || 0, (1 - R.fleetBonus('storm') * 3) * (blessed() ? 0.75 : 1)) * (s.settings.diff === 'easy' ? 0.6 : 1) * (st.stormRisk > 0 ? 2.6 : 1);
    if (U.chance(p)) {
      st.stormPending = true;
    } else if (U.chance(0.012) && Math.abs(l.lat) < 12) { st.calm = U.ri(2, 5); msgs.push({ icon: 'wind', text: '바람이 멎었다. 무풍지대다...' }); if (G.EventFx) G.EventFx.flash('sun', 3.2); }
  }
  async function crises(msgs) {
    var s = S(), f = s.fleet;
    if (st.stormPending) {
      st.stormPending = false;
      st.storm = 1; st.stormDays = U.ri(1, 3);
      if (G.Audio) G.Audio.sfx('storm');
      var stormFx = G.EventFx ? G.EventFx.show('storm') : null;   // 폭풍 그림은 피해를 알리는 말까지 띄워 둔다
      await UI.say('제독! 폭풍입니다! 돛을 줄여라! 모두 밧줄을 붙잡아라!', G.Scenes.mateSpeaker('nav'));
      // 폭풍 피해는 배마다 그 배 선장의 항해술로 줄인다 (기함의 항해술은 신호로 다른 배에도 절반만큼 미친다)
      var navF = R.skill('nav');
      var dmgOf = function (sh) { var nv = Math.max(R.shipSkill(sh, 'nav'), navF * 0.5); return U.clamp(1 - nv * 0.22 - Math.min((G.BALANCE && G.BALANCE.stormDmgCut) || 1, R.fleetBonus('storm') * 2), 0.2, 1) * (st.stormGuard > 0 ? 0.5 : 1); };
      var dmgK = dmgOf(f.ships[0]);
      var lostCrew = 0, sunk = [];
      var offS = G.Ships.offshore(s.loc.lon, s.loc.lat), saved = [];
      f.ships.forEach(function (sh) {
        var dm = sh.maxHp * U.rf(0.06, 0.24) * dmgOf(sh) * (1 - R.fleetBonus('hp')) * G.Ships.stormK(sh, offS);
        sh.hp -= dm;
        if (sh.hp <= 0 && G.Ships.unsinkable(sh)) { sh.hp = 1; saved.push(sh); }
        if (sh.hp <= 0) sunk.push(sh);
      });
      lostCrew = Math.round(f.crew * U.rf(0, 0.06) * dmgK);
      f.crew = Math.max(0, f.crew - lostCrew);
      f.fatigue = Math.min(100, f.fatigue + 12);
      var lostFood = Math.round(f.food * U.rf(0, 0.1) * dmgK); f.food -= lostFood; if (lostFood) st.warnedFor = null;
      sunk.forEach(function (sh) {
        if (f.ships.length <= 1) { sh.hp = 1; return; }
        f.ships.splice(f.ships.indexOf(sh), 1);
        G.State.log(sh.name + '호가 폭풍 속에 침몰했다.');
      });
      G.Scenes.city.B.harbor.trimCrew();
      var txt = '폭풍이 지나갔다... 배가 손상을 입었다.' + (lostCrew ? ' 선원 ' + lostCrew + '명이 바다에 휩쓸려 갔다.' : '') + (lostFood ? ' 식량 ' + lostFood + '통을 잃었다.' : '');
      if (saved.length) txt += '\n' + saved.map(function (x) { return x.name; }).join(', ') + '호는 ' + (G.Ships.has(saved[0], 'raft') ? '뗏목이라' : '칸막이 선창 덕에') + ' 가라앉지 않고 버텼다.';
      if (sunk.length) txt += '\n' + sunk.map(function (x) { return x.name; }).join(', ') + '호가 침몰했다!';
      await UI.say(txt, {});
      if (stormFx) stormFx.stop();
      refreshHud();
    }
    // mutiny — 지칠 대로 지치고 규율이 무너졌을 때만, 한 번 일어나면 한동안은 없다 (G.BALANCE.mutiny)
    var MU = (G.BALANCE && G.BALANCE.mutiny) || { discipline: 15, fatigue: 80, chance: 0.06, cooldown: 40 };
    if (f.discipline < MU.discipline && f.fatigue > MU.fatigue && s.day >= (f.mutinyAt || 0) && U.chance(MU.chance)) {
      f.mutinyAt = s.day + (MU.cooldown || 40);
      await mutiny();
      refreshHud();
    }
    // random sea events (나흘에 한 번 넘게는 일어나지 않는다)
    if (U.chance(0.07)) await G.Explore.seaEvent({ st: st, refresh: refreshHud });
    // death of all crew / ships
    if (f.crew <= 0) {
      await UI.say('마지막 선원마저 쓰러졌다... 배는 주인 없이 바다를 떠돈다.', {});
      await G.Family.retire(true);
      return;
    }
    // player health
    if (s.player.hp <= 0) { await UI.say('제독이 병으로 쓰러졌다...', {}); await G.Family.retire(true); }
  }
  /** 반란: 주동자와 교섭하거나, 일기토로 결판을 낸다 (부관에게 맡길 수도 있다) */
  async function mutiny() {
    var s = S(), f = s.fleet, sp = G.Scenes.mateSpeaker('first');
    var A = G.Art, zone = G.Ships.zone(s.loc.lon, s.loc.lat), sty = A && A.fleetStyle ? A.fleetStyle(zone, s.player.nation) : null;
    var spec = A.withImg(A.npcSpec('mutineer' + s.day, 'sailor', sty || 'ib'), G.Img.chain.npc('brawler'));
    var lead = { name: '반란 주동자', look: 'brawler', portrait: spec, str: U.ri(55, 80), atk: U.ri(5, 11), def: U.ri(1, 4), skill: U.ri(0, 1), mar: U.ri(50, 75), int: U.ri(25, 50), cha: U.ri(35, 60) };
    await UI.say('선원들이 갑판에 모여 웅성거린다... 덩치 큰 선원 하나가 앞으로 나선다. "이런 항해는 더는 못 하겠소! 배를 돌리시오!"', { name: lead.name, portrait: spec });
    var px = G.Games && G.Games.proxy ? G.Games.proxy() : null, pd = px && G.MATE[px.id];
    var opts = [{ label: '교섭한다', value: 'talk' }, { label: '주동자와 일기토로 결판을 낸다', value: 'duel' }];
    if (pd) opts.push({ label: '부관 ' + pd.name + '에게 일기토를 맡긴다', value: 'proxy' });
    var v = await UI.ask('선원들이 반란을 일으키려 한다! 어떻게 할까?', opts, sp);
    if (v === 'duel' || v === 'proxy') {
      if (v === 'proxy') await UI.say(U.pick(['제독께서 나서실 것까지 없습니다. 제가 저 녀석의 버릇을 고쳐 놓지요.', '저런 놈은 제게 맡기십시오.']), sp);
      var res = await G.Games.duel(lead, v === 'proxy' ? { mate: px, place: 'deck' } : { place: 'deck' });
      var ld = G.Games.lastDuel || {}, fm = ld.mate, fd = fm && G.MATE[fm.id];
      if (res === 'win') {
        f.discipline = Math.min(100, f.discipline + 35); f.fatigue = Math.max(0, f.fatigue - 10); s.player.fame += 2;
        if (fm) fm.loyal = Math.min(100, (fm.loyal || 70) + 6);
        await UI.say((fd ? fd.name + U.jx(fd.name, '이/가') + ' ' : '') + '주동자를 쓰러뜨렸다! 선원들이 고개를 숙이고 제자리로 돌아간다. (규율 +35, 피로 −10)', {});
      } else {
        var gone = Math.max(1, Math.round(f.crew * (res === 'flee' ? 0.12 : 0.2)));
        f.crew = Math.max(0, f.crew - gone); f.discipline = Math.min(100, f.discipline + 12);
        if (fm && res === 'lose') fm.hurt = s.day + 20;
        await UI.say((res === 'flee' ? '결판을 내지 못했다. ' : '주동자에게 지고 말았다! ') + '주동자와 선원 ' + gone + '명이 보트를 내려 떠났다. 남은 선원들은 일단 조용해졌다.', {});
        G.Scenes.city.B.harbor.trimCrew && G.Scenes.city.B.harbor.trimCrew();
      }
      return;
    }
    // 교섭: 돈을 나누어 주거나, 가까운 항구로 가겠다고 약속하거나, 말로 달랜다
    var pay = f.crew * 5, port = nearestPortName();
    var t = await UI.ask('무엇을 내걸고 교섭할까?', [
      { label: '술과 돈을 나누어 준다 (금화 ' + U.num(pay) + '닢)', value: 'pay', dis: s.player.gold <= 0 },
      { label: (port ? port + '에 들러 쉬게 해 주겠다고' : '가까운 항구에서 쉬게 해 주겠다고') + ' 약속한다', value: 'promise' },
      { label: '말로 달랜다 (말솜씨·매력)', value: 'talk' }].concat(R.skillRead('cook') + R.skillRead('music') > 0 ? [{ label: '잔치를 열어 달랜다 (요리·음악 — 식량 ' + Math.ceil(R.dailyUse() * (((G.BALANCE || {}).crewCare || {}).feastFood || 2)) + '통)', value: 'feast', dis: f.food < R.dailyUse() }] : []), sp);
    if (t === 'feast') {
      var CF = (G.BALANCE && G.BALANCE.crewCare) || {}, ck = R.skillRead('cook'), mu = R.skillRead('music');
      f.food = Math.max(0, f.food - R.dailyUse() * (CF.feastFood || 2));
      var gain = (CF.feastBase || 12) + (CF.feastPer || 6) * (ck + mu);
      f.discipline = Math.min(100, f.discipline + gain); f.fatigue = Math.max(0, f.fatigue - (CF.feastFatigue || 10));
      await UI.say((ck ? '갑판에 큰 솥이 걸리고 고기와 향신료 냄새가 퍼진다. ' : '') + (mu ? '누군가 악기를 꺼내 들자 선원들이 하나둘 따라 부른다. ' : '') + '주동자도 결국 잔을 받아 들었다. (규율 +' + gain + ', 피로 −' + (CF.feastFatigue || 10) + ')', sp);
      return;
    }
    if (t === 'pay') {
      var paid = Math.min(s.player.gold, pay); s.player.gold -= paid;
      f.discipline = Math.min(100, f.discipline + Math.round(30 * paid / Math.max(1, pay))); f.fatigue = Math.max(0, f.fatigue - 5);
      UI.toast(paid < pay ? '가진 금화 ' + U.num(paid) + '닢을 모두 나누어 주었다. 불만이 다 가라앉지는 않았다.' : '선원들에게 금화 ' + U.num(pay) + '닢을 나누어 주었다. 갑판에 웃음이 돈다.', 'coin', 4200);
    } else if (t === 'promise') {
      f.discipline = Math.min(100, f.discipline + 18);
      UI.toast('선원들이 약속을 믿고 물러났다. 오래 미루면 다시 들고일어날 것이다.', 'anchor', 4600);
      f.mutinyAt = s.day + 15;   // 약속은 오래가지 않는다
    } else {
      if (U.chance(0.45 + R.skill('speech') * 0.15 + R.stat('cha') / 250)) { f.discipline = Math.min(100, f.discipline + 25); UI.toast('주동자를 설득했다. 선원들이 제자리로 돌아간다.', 'people'); }
      else { f.discipline = Math.min(100, f.discipline + 6); f.fatigue = Math.max(0, f.fatigue - 5); UI.toast('설득에 실패했다. 불만이 남아 있다...', 'people'); }
    }
  }
  function nearestPortName() {
    var s = S(), l = s.loc, best = null, bd = 1e9;
    (G.CITY_DATA || []).forEach(function (c) { if (!c.port || s.known.indexOf(c.id) < 0 || (R.cityExists && !R.cityExists(c))) return; var d = G.Geo.dist(l.lon, l.lat, c.lon, c.lat); if (d < bd) { bd = d; best = c; } });
    return best ? best.name : '';
  }
  // ================================================================ rendering
  function weatherParams() {
    var s = S(), l = s.loc;
    var cl = G.Geo.climate(l.lon, l.lat);
    var cloud = U.clamp(0.18 + cl.m * 0.35 + (Math.abs(l.lat) > 45 ? 0.12 : 0), 0.1, 0.7);
    return { cloud: Math.max(cloud, st.storm ? 0.8 : 0), storm: st.storm ? 0.85 : 0 };
  }
  function render(dt) {
    var s = S(), l = s.loc, r = G.Game.renderer;
    var idle = st.busy > 0 || UI.busy();
    st.rframe = (st.rframe || 0) + 1;
    if (idle && st.rframe % 3 !== 0) return;          // 대화 중에는 20fps
    if (st.paused && !idle && st.rframe % 2 !== 0) return;  // 멈춰 있을 때는 30fps
    var wp = weatherParams();
    if (r) r.draw({ lon: st.cam.lon, lat: st.cam.lat, zoom: st.cam.zoom, time: st.t, wind: [Math.cos(st.windVis.dir) * st.windVis.spd, Math.sin(st.windVis.dir) * st.windVis.spd], cloud: wp.cloud, edge: 0.75, mode: 0, dusk: 0, storm: wp.storm, quality: s.settings.res && s.settings.res < 1 ? 0.5 : 1, cssWidth: 1600 });
    drawOverlay();
    if ((st.frame2 = (st.frame2 || 0) + 1) % 6 === 0) { drawWind(); refreshButtons(); }
    if (st.lastMini < 0) drawMini();
  }
  /** 경로가 있으면 남은 거리(°)와 지금 속력으로 걸릴 날 */
  function etaDays() {
    if (!st.path || !st.path.length) return null;
    var s = S(), l = s.loc, d = 0, x = l.lon, y = l.lat;
    for (var i = st.pathI || 0; i < st.path.length; i++) { var q = st.path[i]; d += Math.hypot(G.Geo.wrapLon(q[0] - x), q[1] - y); x = q[0]; y = q[1]; }
    var v = Math.max(0.15, R.fleetSpeed(st.crs != null && !st.manual ? st.crs : l.heading, curWind()));
    return Math.max(1, Math.ceil(d / v));
  }
  SEA.eta = etaDays;
  function supplyWarn() {
    var eta = etaDays(); if (eta == null) return;
    var have = Math.min(R.daysOfFood(), R.daysOfWater());
    if (have < Math.ceil(eta * 1.1) + 2 && !st.warnedFor) {      // 가는 동안 지쳐 느려질 것까지 넉넉히 본다
      st.warnedFor = st.target ? (st.target.city ? st.target.city.id : 'pt') : 'pt';
      UI.say('제독, 이대로라면 목적지에 닿기 전에 식량과 물이 떨어집니다! (남은 ' + have + '일분 · 가는 데 약 ' + eta + '일)\n가까운 항구에 들러 보급하는 게 좋겠습니다.', G.Scenes.mateSpeaker('first'));
    }
  }
  function refreshButtons() {
    var pn = portNear();
    if (hudEl.port) { hudEl.port.classList.toggle('disabled', !pn); setHtml(hudEl.port, G.icon('anchor') + (pn ? pn.name + ' 입항' : '입항')); }
    if (hudEl.land) hudEl.land.classList.toggle('disabled', !landNear());
    var s = S(), l = s.loc;
    var tgt = st.target ? (st.target.city ? st.target.city.name + U.j(st.target.city.name, '으로/로').slice(st.target.city.name.length) + ' 항해 중' : '목적지로 항해 중')
      : st.dirCrs != null ? (st.paused ? U.dirName(st.dirCrs) + '쪽 침로 — 방향키를 누르면 그쪽으로 출발' : st.stopping ? U.dirName(st.dirCrs) + '쪽 침로' : U.dirName(st.dirCrs) + '쪽으로 항해 중 · ' + (st.arrowSteer && arrowAngle() != null ? U.dirName(arrowAngle()) + '쪽으로 뱃머리를 돌리는 중' : '방향키를 누르고 있으면 그쪽으로 뱃머리가 돌아감') + ' · Space 정지')
      : st.manual ? (st.paused ? '수동 조타 — ↑ 돛을 펴고 출발 · ←→ 제자리에서 뱃머리 · Space 순항' : st.cruise ? '수동 조타(순항) — ←→ 뱃머리 · ↓·Space 멈춤' : '수동 조타 — ↑ 누르는 동안 나아가고 떼면 서서히 멈춤 · Space 순항')
      : (st.paused ? (helmMode() ? '정지 — 스페이스로 다시 출발(항구 곁에서는 정박)' : '정지 — 방향키로 그쪽으로 출발 · 항구 곁에서는 Space로 정박') : '표류 중 — 바다를 클릭하거나 방향키·숫자판으로 나아가십시오');
    if (!st.manual && st.tackTheta && !st.paused) tgt += ' · <span style="color:#ffd98a">맞바람 — 지그재그로 거슬러 오르는 중</span>';
    if (st.handSteer) tgt += ' · 키를 잡는 동안 ×1';
    var v, vTxt;
    var now = st.paused ? 0 : shipSpeed();
    if (st.manual) { var mm = R.fleetMotion(l.heading, curWind()); v = now; vTxt = v.toFixed(2) + '°/일 (이 방향 최고 ' + mm.straight.toFixed(2) + ')'; }
    else { var vt = R.fleetSpeed(st.crs != null ? st.crs : l.heading, curWind()); v = now; vTxt = now.toFixed(2) + '°/일' + (st.path || st.dirCrs != null ? (Math.abs(now - vt) > 0.08 ? ' → ' + vt.toFixed(2) : '') : ''); }
    var eta = etaDays(), have = Math.min(R.daysOfFood(), R.daysOfWater());
    var etaTxt = eta != null ? ' · <span style="color:' + (have < eta + 2 ? '#ff9f7a' : '#cfe8b0') + '">도착까지 약 ' + eta + '일 / 보급 ' + have + '일분</span>' : '';
    var oc = G.Explore.oceanOf(l.lon, l.lat);
    if (hudEl.status) setHtml(hudEl.status, (st.paused ? '<b>⏸ 정지</b> · ' : st.stopping ? '<b>돛을 거두고 멈추는 중</b> · ' : '') + tgt + etaTxt + (st.storm ? ' · <span style="color:#ff9f7a">폭풍</span>' : '') + (st.calm ? ' · 무풍' : '') + (st.stormGuard > 0 ? ' · 폭풍 대비' : '') + monsoonTag() + '<br><span class="coord">' + (oc ? oc[1] + ' · ' : '') + '속력 ' + vTxt + (s.fleet.ships.length > 1 && R.fleetInfo && R.fleetInfo.slow ? ' (' + U.esc(R.fleetInfo.slow.name) + '호에 맞춤)' : '') + ' · 진로 ' + U.dirName(l.heading) + ' · 항해 ' + (s.fleet.daysOut || 0) + '일째' + (s.contract ? ' · 계약: ' + G.Errand.name(s.contract) : '') + '</span>');
  }
  /** 글이 바뀌었을 때만 고친다 (같은 글을 다시 넣으면 브라우저가 매번 새로 배치한다) */
  function setHtml(el, html) { if (el._html !== html) { el._html = html; el.innerHTML = html; } }
  function drawOverlay() {
    var cv = G.Game.canvases().overlay, ctx = cv.getContext('2d'), k = G.Game.overlayScale || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    var s = S(), l = s.loc, z = st.cam.zoom;
    // 작은 일거리 — 해도 작성 목표 해역
    var tk = s.contract && s.contract.task;
    if (tk && tk.kind === 'survey' && !tk.done) {
      var tz = toScreen(tk.lon, tk.lat);
      ctx.strokeStyle = 'rgba(40,110,170,.8)'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -st.t * 8;
      ctx.beginPath(); ctx.arc(tz[0], tz[1], 0.8 * z, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(20,50,90,.85)'; ctx.font = '600 15px ' + fontFam(); ctx.textAlign = 'center'; ctx.fillText('해도 작성 목표', tz[0], tz[1] - 0.8 * z - 6); ctx.textAlign = 'left';
    }
    // contract zone
    var ct = s.contract && G.DISC[s.contract.disc];
    if (ct && ct.how !== 'trade' && !(ct.lat === 0 && ct.lon === 0) && G.Disc.hasHint(ct.id) && !G.Disc.foundByMe(ct.id)) {
      var rng = U.makeRng(U.strHash(ct.id));
      var zc = toScreen(ct.lon + (rng() - 0.5) * 3, ct.lat + (rng() - 0.5) * 3);
      ctx.strokeStyle = 'rgba(200,40,30,.55)'; ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.arc(zc[0], zc[1], 3.2 * z, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(200,40,30,.8)'; ctx.font = '600 15px ' + fontFam(); ctx.textAlign = 'center'; ctx.fillText('계약 목적지 부근', zc[0], zc[1] - 3.2 * z - 6);
    }
    // path
    if (st.path) {
      ctx.strokeStyle = 'rgba(255,245,220,.75)'; ctx.lineWidth = 2; ctx.setLineDash([6, 7]);
      ctx.beginPath(); var p0 = toScreen(l.lon, l.lat); ctx.moveTo(p0[0], p0[1]);
      for (var i = st.pathI; i < st.path.length; i++) { var q = toScreen(st.path[i][0], st.path[i][1]); ctx.lineTo(q[0], q[1]); }
      ctx.stroke(); ctx.setLineDash([]);
      var tp = toScreen(st.target.lon, st.target.lat);
      ctx.strokeStyle = '#ffe6b0'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(tp[0], tp[1], 9 + Math.sin(st.t * 4) * 2, 0, 7); ctx.stroke();
    } else if (st.dirCrs != null) {
      // 숫자판 침로: 가야 할 방위를 점선으로
      var c0 = toScreen(l.lon, l.lat), c1 = toScreen(l.lon + Math.cos(st.dirCrs) * 2.5, l.lat + Math.sin(st.dirCrs) * 2.5);
      ctx.strokeStyle = 'rgba(255,245,220,.6)'; ctx.lineWidth = 2; ctx.setLineDash([6, 7]);
      ctx.beginPath(); ctx.moveTo(c0[0], c0[1]); ctx.lineTo(c1[0], c1[1]); ctx.stroke(); ctx.setLineDash([]);
    }
    // 항적·물보라 (배가 실제로 지나간 바다에 남는다)
    if (st.fx && G.SeaFX) G.SeaFX.draw(st.fx, ctx, toScreen, z, shipPx());
    // 망루가 본 것 (가까울수록 원이 좁혀진다)
    if ((st.frame3 = (st.frame3 || 0) + 1) % 20 === 1 || !st.marks || st.marksVer !== G.Explore.ver) { st.marks = G.Explore.markers(l.lon, l.lat, 'sea'); st.marksVer = G.Explore.ver; }
    st.marks.forEach(function (m) {
      var mp = toScreen(m.lon, m.lat);
      if (mp[0] < -200 || mp[0] > 1800 || mp[1] < -200 || mp[1] > 1100) return;
      G.Explore.drawMarker(ctx, m, mp, m.r * z, st.t, fontFam());
    });
    // npcs
    st.npcs.forEach(function (n) {
      if (G.ShipSprite && n.ships) G.ShipSprite.want(n.ships);
      var p = toScreen(n.lon, n.lat); if (p[0] < -50 || p[0] > 1650 || p[1] < -50 || p[1] > 950) return;
      var kk = NPC_KIND[n.kind];
      for (var j = 0; j < Math.min(3, n.n); j++) {
        var nty = n.ships && n.ships[j], nlook = nty ? A.shipLook(nty, { flag: kk.flag, cross: false }) : { sails: ['sq', 'sq', 'lat'], hull: kk.hull, sail: kk.sail, flag: kk.flag };
        if (n.kind === 'pirate') { nlook.hull = kk.hull; if (nlook.hullType === 'west' || nlook.hullType === 'galley' || nlook.hullType === 'dhow') nlook.sail = kk.sail; }
        var nk = npcPx() / 30;
        // 다른 배도 제 자리의 파도를 타고(용수철 없이 바로), 돛·깃발이 바람을 따른다
        if (G.FX.ride && G.FX.ride.on !== false && G.Waves && j === 0) {
          var nw = rideWave(n.lon, n.lat, n.heading, npcPx());
          n.pose = n.pose || { roll: 0, pitch: 0, heave: 0 }; var nkk = Math.min(1, (st.dtLast || 0.016) * 3);
          n.pose.roll += (U.clamp(nw.roll, -0.2, 0.2) - n.pose.roll) * nkk; n.pose.pitch += (U.clamp(nw.pitch, -0.08, 0.08) - n.pose.pitch) * nkk; n.pose.heave += (U.clamp(nw.heave, -0.05, 0.05) - n.pose.heave) * nkk;
          if (st.windVis) n.rig = G.Waves.rigStep(n.rig || {}, G.Waves.apparent({ dir: st.windVis.dir, spd: st.windVis.spd * 1.6 }, Math.cos(n.heading) * 0.3, Math.sin(n.heading) * 0.3, n.heading), Math.min(0.1, st.dtLast || 0.016), 0);
        }
        if (n.pose) nlook.pose = j ? { roll: n.pose.roll * 0.8, pitch: -n.pose.pitch * 0.6, heave: n.pose.heave * 0.5 } : n.pose;
        if (n.rig) nlook.rig = n.rig;
        nlook.motionSpeed = Math.min(1.4, Math.max(0, n.spd || 0) / FXS().refSpeed);
        nlook.motionRate = 0.8 + nlook.motionSpeed * 0.25;
        nlook.sid = n.id + ':' + j;
        var nsv = sideView('n' + n.id, n.heading); nlook.face = nsv.face; nlook.squash = nsv.squash;
        A.shipTop(ctx, p[0] - Math.cos(nsv.ang) * j * 18 * nk + j * 6 * nk, p[1] + Math.sin(nsv.ang) * j * 18 * nk + j * 8 * nk, nsv.ang, npcPx(), nlook, st.t + j);
      }
      if ((n.kind === 'pirate' && !n.awed) || n.hostile || n.exp) { ctx.font = '700 14px ' + fontFam(); ctx.textAlign = 'center'; var lbN = n.kind === 'pirate' ? G.Ships.pirateLabel(n.zone) : n.label || n.nation + ' 함대', lwN = ctx.measureText(lbN).width; ctx.fillStyle = 'rgba(20,10,6,.55)'; ctx.fillRect(p[0] - lwN / 2 - 5, p[1] - npcPx() * 0.72 - 15, lwN + 10, 19); ctx.fillStyle = n.exp && !n.hostile ? '#ffe08a' : '#ff9a8a'; ctx.fillText(lbN, p[0], p[1] - npcPx() * 0.72); ctx.textAlign = 'left'; }
    });
    // player fleet
    var pp = toScreen(l.lon, l.lat);
    var f = s.fleet;
    var sr = Math.min(1.4, shipSpeed() / FXS().refSpeed), slip = Math.min(1.2, Math.abs(st.lat || 0) / FXS().refSpeed * 2.2), sideS = (st.lat || 0) >= 0 ? 1 : -1;
    var SP = shipPx(), FP = followPx();
    var sv = sideView('flag', l.heading), ha = sv.ang;      // 그림에 쓰는 뱃머리 방향 (옆모습)
    selectionRing(ctx, pp, ha, SP);
    var slots = followSlots(f.ships.length, ha), fc = Math.cos(ha), fs = Math.sin(ha);
    st.slotPos = st.slotPos || [];
    for (var si = f.ships.length - 1; si >= 0; si--) {
      var sh = f.ships[si], sl = si ? slots[si] : [0, 0];
      var tx = pp[0] + (fc * sl[0] - fs * sl[1]) * SP, ty = pp[1] - (fs * sl[0] + fc * sl[1]) * SP;
      // 자리를 바꿀 때는 미끄러지듯 옮겨 간다
      var sp0 = st.slotPos[si];
      if (!sp0 || !si) sp0 = st.slotPos[si] = [tx - pp[0], ty - pp[1]];
      else { var kk = Math.min(1, (st.dtLast || 0.016) * 2.5); sp0[0] += (tx - pp[0] - sp0[0]) * kk; sp0[1] += (ty - pp[1] - sp0[1]) * kk; }
      var bx = pp[0] + sp0[0], by = pp[1] + sp0[1];
      var lenS = si === 0 ? SP : FP;
      // 선체에 붙은 물: 선수 파도와 선측 물줄기 (따르는 배는 조금 약하게)
      if (st.fx && G.SeaFX) G.SeaFX.drawHull(st.fx, ctx, bx, by, ha, lenS * sv.squash, sr * (si ? 0.7 : 1), slip * (si ? 0.5 : 1), sideS, st.t);
      var lk = A.shipLook(sh.type, { sails: sh.sails, flag: '#1d3f7a' });
      var ps = st.pose || {}, ph = si * 1.7, RF = si && st.rideF && st.rideF[si], RDm = G.FX.ride || {};
      if (RF) lk.pose = { roll: U.clamp(RF.roll, -RDm.maxRoll, RDm.maxRoll), pitch: U.clamp(RF.pitch, -RDm.maxPitch, RDm.maxPitch), heave: U.clamp(RF.heave, -RDm.maxHeave, RDm.maxHeave) };
      else lk.pose = { roll: (ps.roll || 0) * (si ? 0.9 : 1), pitch: (ps.pitch || 0) + (si ? Math.sin(st.t * 1.1 + ph) * 0.01 : 0), heave: (ps.heave || 0) * (si ? Math.cos(ph) : 1) };
      lk.noWake = true; lk.furl = st.furl || 0; lk.rig = st.rig || null; lk.sid = 'f' + si; lk.face = sv.face; lk.squash = sv.squash;
      lk.motionSpeed = sr * (si ? 0.92 : 1); lk.motionRate = 0.78 + Math.min(1.4, sr) * 0.28;
      A.shipTop(ctx, bx, by, ha, lenS, lk, st.t + si);
      if (G.VoyageFX) G.VoyageFX.drawSpray(st, ctx, bx, by, ha, lenS, si);   // 속력을 낼 때 선수 물보라
    }
    drawCities(ctx);
    if (G.VoyageFX) G.VoyageFX.drawSky(st, ctx, pp, l.heading, SP, toScreen);      // 모항 배웅 갈매기
    // hover tooltip
    if (st.mouse && !UI.busy()) {
      var hc = cityAt(st.mouse[0], st.mouse[1]);
      if (hc) { var og = G.Routes.origin(); tip(ctx, st.mouse[0] + 14, st.mouse[1] + 18, hc.name + ' · ' + G.R.cityOwner(hc) + ' · ' + G.CityIcon.label(hc) + (!hc.port ? ' (내륙 도시)' : og != null && og !== hc.id ? (G.Routes.isOpen(og, hc.id) ? ' — 클릭: 자동항해' : ' — 클릭: 곧장 침로 (' + G.Routes.label(og, hc.id).split(' · ')[1] + ')') : G.Routes.autoOff() && hc.port ? ' — 클릭: 곧장 침로 (자동항해는 다음 항구에서)' : ' — 클릭하면 이곳으로 향합니다')); }
      else {
        var hd = landmarkAt(st.mouse[0], st.mouse[1]);
        if (hd) tip(ctx, st.mouse[0] + 14, st.mouse[1] + 18, hd.name + ' · 발견한 유적 — 클릭하면 가까이 향합니다');
        else {
          var hn = npcAt(st.mouse[0], st.mouse[1]);
          if (hn) tip(ctx, st.mouse[0] + 14, st.mouse[1] + 18, (hn.kind === 'pirate' ? G.Ships.pirateLabel(hn.zone) : hn.label || (hn.nation || '') + ' ' + NPC_KIND[hn.kind].name) + ' ' + hn.n + '척' + (hn.ships ? ' (' + hn.ships.map(function (id) { return G.SHIP[id].name; }).join('·') + ')' : '') + (hn.awed ? ' — 우리 배를 보고 달아난다' : hn.hostile ? '' : ' — 클릭하면 신호를 보냅니다'));
          else { var hm = G.Explore.markerAt(st.marks || [], toScreen, st.mouse[0], st.mouse[1]); if (hm) tip(ctx, st.mouse[0] + 14, st.mouse[1] + 18, '망루가 본 것 (' + G.DISC_CATS[hm.d.cat] + ') · 약 ' + hm.dist.toFixed(1) + '° — 클릭하면 향합니다'); }
        }
      }
    }
  }
  function alongCoast(dt) {
    var l = S().loc, halfT = shipPx() / (st.cam ? st.cam.zoom : 110) * 0.5 * G.Geo.TEX_PER_DEG, d = G.Geo.sdf(l.lon, l.lat);
    if (d < -halfT * 1.1 || d > 0) return;
    var e = 0.06, gx = G.Geo.sdf(l.lon + e, l.lat) - G.Geo.sdf(l.lon - e, l.lat), gy = G.Geo.sdf(l.lon, l.lat + e) - G.Geo.sdf(l.lon, l.lat - e);
    if (Math.abs(gx) + Math.abs(gy) < 1e-4) return;
    var a = Math.atan2(gx, -gy), da = U.angDiff(l.heading, a), db = U.angDiff(l.heading, a + Math.PI), want = Math.abs(da) < Math.abs(db) ? da : db;
    l.heading += want * Math.min(1, dt * 0.9);
  }
  /* 옆모습: 지도 위의 배를 늘 옆에서 본 모습으로 그린다 (G.FX.ship.side).
     동쪽(오른쪽)으로 가면 오른쪽을, 서쪽이면 왼쪽을 보고, 위·아래로 갈 때는 그만큼(최대 tilt°) 뱃머리를 들거나 숙인다.
     좌우가 바뀌면 배가 뒤집히듯 돌아간다(flipSec초). 경계에서 깜박이지 않게 hold만큼 넘어가야 바뀐다.
     뱃길·속력·충돌 같은 규칙은 그대로 참 진로(l.heading)를 쓴다 — 그림만 바뀐다. */
  var sideMem = {};
  function sideView(id, h) {
    var SD = FXS().side || {};
    if (SD.on === false) return { ang: h, face: 0, squash: 1 };
    var c = Math.cos(h), o = sideMem[id];
    if (!o) o = sideMem[id] = { face: c >= 0 ? 1 : -1, from: c >= 0 ? 1 : -1, k: 1 };
    var hold = SD.hold != null ? SD.hold : 0.2;
    if ((o.face > 0 && c < -hold) || (o.face < 0 && c > hold)) { o.from = o.k < 0.5 ? o.from : o.face; o.face = -o.face; o.k = 0; }
    o.k = Math.min(1, o.k + (st.dtLast || 0.016) / Math.max(0.01, SD.flipSec || 0.35));
    var shown = o.k < 0.5 ? o.from : o.face, tilt = Math.sin(h) * (SD.tilt != null ? SD.tilt : 20) * Math.PI / 180;
    return { ang: shown > 0 ? tilt : Math.PI - tilt, face: shown, squash: Math.max(0.06, Math.abs(Math.cos(Math.PI * o.k))) };
  }
  /* 따르는 배의 자리: 기함 뒤로 비스듬히 줄지어 — 그 자리가 뭍이면 바다 쪽 다른 자리로 (자주 바뀌지 않게 잠시 기억) */
  var SLOTS = [[-0.52, 0.27], [-0.52, -0.27], [-1.04, 0.27], [-1.04, -0.27], [0.0, 0.55], [0.0, -0.55], [-0.52, 0.8], [-0.52, -0.8], [0.52, 0.55], [0.52, -0.55]];
  function followSlots(n, ang) {
    var l = S().loc, z = st.cam.zoom, SPx = shipPx(), out = [], used = {};
    st.slotMem = st.slotMem || {};
    if (ang == null) ang = l.heading;
    var c = Math.cos(ang), sn = Math.sin(ang);
    var hl = followPx() * 0.42;
    function sea(k) {
      var sl = SLOTS[k];
      for (var j = -1; j <= 1; j++) { var bx = sl[0] * SPx + j * hl, by = sl[1] * SPx; if (G.Geo.sdf(l.lon + (c * bx - sn * by) / z, l.lat + (sn * bx + c * by) / z) > -0.25) return false; }
      return true;
    }
    for (var i = 1; i < n; i++) {
      var mem = st.slotMem[i], pick = -1, pref = i - 1;
      if (mem != null && !used[mem] && sea(mem)) pick = mem;
      else if (!used[pref] && sea(pref)) pick = pref;
      else for (var k = 0; k < SLOTS.length; k++) if (!used[k] && sea(k)) { pick = k; break; }
      if (pick < 0) pick = used[pref] ? SLOTS.findIndex(function (_, k3) { return !used[k3]; }) : pref;
      used[pick] = 1; st.slotMem[i] = pick; out[i] = SLOTS[pick];
    }
    return out;
  }
  /** 기함 발밑의 고리: 조종하는 배를 알아보게, 나아갈 때는 뱃머리 앞 갈매기표로 방향을, 멈추면 천천히 숨 쉬듯 */
  function selectionRing(ctx, p, h, L) {
    var moving = !st.paused && shipSpeed() > 0.08, t = st.t;
    var rx = L * 0.64, ry = L * 0.29, a = moving ? 0.42 : 0.28 + 0.16 * Math.sin(t * 2.4);
    ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(-h);
    ctx.strokeStyle = 'rgba(6,18,34,' + (a * 0.55).toFixed(3) + ')'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 6.2832); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,222,150,' + a.toFixed(3) + ')'; ctx.lineWidth = 2;
    ctx.setLineDash(moving ? [] : [10, 7]); ctx.lineDashOffset = -t * 6;
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
    if (moving) {
      var cx = rx + 8 + Math.sin(t * 5) * 1.5;
      ctx.fillStyle = 'rgba(255,226,160,.85)'; ctx.strokeStyle = 'rgba(40,24,8,.6)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(cx + 11, 0); ctx.lineTo(cx - 3, -8); ctx.lineTo(cx + 1, 0); ctx.lineTo(cx - 3, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }
  /** 도시 표시 (배 그림 위에 그려 배가 커도 가려지지 않게) */
  function drawCities(ctx) {
    var s = S();
    var refPort = G.Routes ? G.Routes.origin() : null, nearPort = portNear();
    ctx.textAlign = 'left';
    // 도시 밖 유적은 제독이 직접 발견한 뒤부터 작은 투명 모형으로 남는다.
    if (G.DiscoveryIcon) G.DiscoveryIcon.visible().forEach(function (d) {
      var p = toScreen(d.lon, d.lat); if (p[0] < -60 || p[0] > 1660 || p[1] < -60 || p[1] > 960) return;
      G.DiscoveryIcon.draw(ctx, d, p[0], p[1]);
    });
    knownCities().forEach(function (c) {
      var p = toScreen(c.lon, c.lat);
      if (p[0] < -60 || p[0] > 1660 || p[1] < -30 || p[1] > 930) return;
      var visited = s.visited && s.visited[c.id], fl = G.CityInfo.flags(c, refPort);
      var mark = G.CityIcon.draw(ctx, c, p[0], p[1], { visited: visited, auto: fl.auto });
      var r2 = mark.radius;
      if (fl.sponsor) { var dx = p[0] + mark.width / 2, dy = p[1] + mark.top, dz = 5; ctx.fillStyle = '#d9b040'; ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(dx, dy - dz); ctx.lineTo(dx + dz, dy); ctx.lineTo(dx, dy + dz); ctx.lineTo(dx - dz, dy); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      if (fl.contract) { var fx = p[0] - mark.width * 0.18, fy = p[1] + mark.top; ctx.strokeStyle = '#f2e7cc'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - 20); ctx.stroke(); ctx.fillStyle = '#c0281e'; ctx.beginPath(); ctx.moveTo(fx, fy - 20); ctx.lineTo(fx - 14, fy - 15.5); ctx.lineTo(fx, fy - 11); ctx.closePath(); ctx.fill(); }
      // 이름은 가고 있는 곳과 곁의 항구만 (나머지는 마우스를 올리면)
      if ((st.target && st.target.city === c) || c === nearPort) {
        ctx.font = (c.size >= 3 ? '700 17px ' : '600 15px ') + fontFam();
        var tw = labelW[c.id] || (labelW[c.id] = ctx.measureText(c.name).width);
        ctx.fillStyle = 'rgba(20,14,8,.62)'; ctx.fillRect(p[0] + r2 + 3, p[1] - 11, tw + 10, 21);
        ctx.fillStyle = '#f2e7cc'; ctx.fillText(c.name, p[0] + r2 + 8, p[1] + 5);
      }
    });
  }
  function tip(ctx, x, y, text) {
    ctx.font = '600 15px ' + fontFam(); var w = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(20,14,8,.85)'; ctx.fillRect(x, y, w + 16, 26); ctx.strokeStyle = 'rgba(184,146,90,.7)'; ctx.strokeRect(x, y, w + 16, 26);
    ctx.fillStyle = '#f2e7cc'; ctx.textAlign = 'left'; ctx.fillText(text, x + 8, y + 18);
  }
  var FF = null, labelW = {};
  function fontFam() { return FF || (FF = getComputedStyle(document.body).fontFamily); }

  function drawWind() {
    if (!hudEl.wind) return;
    var cv = hudEl.wind, ctx = cv.getContext('2d'), W = cv.width, c = W / 2;
    var s = S(), l = s.loc;
    ctx.clearRect(0, 0, W, W);
    ctx.save(); ctx.translate(c, c); ctx.scale(2, 2);
    // compass ring
    ctx.strokeStyle = 'rgba(227,198,141,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 58, 0, 7); ctx.stroke();
    ctx.fillStyle = '#e3c68d'; ctx.font = '700 12px ' + fontFam(); ctx.textAlign = 'center';
    [['N', 0, -46], ['E', 46, 4], ['S', 0, 52], ['W', -46, 4]].forEach(function (t) { ctx.fillText(t[0], t[1], t[2]); });
    // wind arrow (blowing toward)
    var wd = st.windVis.dir, ws = st.windVis.spd;
    ctx.save(); ctx.rotate(-wd);
    ctx.strokeStyle = 'rgba(160,210,255,.95)'; ctx.fillStyle = 'rgba(160,210,255,.95)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(24, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(34, 0); ctx.lineTo(20, -9); ctx.lineTo(20, 9); ctx.fill();
    ctx.restore();
    // ship heading
    ctx.save(); ctx.rotate(-l.heading);
    ctx.fillStyle = '#f2e7cc'; ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(-10, -7); ctx.lineTo(-5, 0); ctx.lineTo(-10, 7); ctx.fill();
    ctx.restore();
    ctx.restore();
    var rel = Math.abs(U.angDiff(l.heading, st.wind.dir)) * 180 / Math.PI;
    var rn = rel < 45 ? '순풍' : rel < 110 ? '옆바람' : rel < 150 ? '비스듬한 역풍' : '역풍';
    var from = U.dirName(st.wind.dir + Math.PI);
    var mz = G.Monsoon ? G.Monsoon.at(l.lon, l.lat) : null, mtxt = '';
    if (mz) { var mph = G.Monsoon.phase(mz), mnx = G.Monsoon.next(mz); mtxt = '<div style="font-size:12.5px;color:#9fd0c8" title="' + mz.name + '의 계절풍">' + (mph === 'sw' ? '남서' : '북동') + ' 계절풍 ~' + mnx.date.m + '/' + mnx.date.d + '</div>'; }
    setHtml(hudEl.wtxt, '<div style="font-size:15px;color:#e3c68d">' + from + '풍</div><div style="font-size:14px">풍속 ' + '●●●●●'.slice(0, Math.max(1, Math.round(ws * 5))) + '</div><div style="font-size:14px;color:#d9c9a6">' + rn + '</div>' + mtxt);
  }
  function drawMini() {
    if (!hudEl.mini) return;
    var s = S(), l = s.loc;
    st.lastMini = st.dayCount;
    var w = 40, h = w * 388 / 568;
    var cv = G.Info.chartCanvas(284, 194, { lon0: l.lon - w / 2, lon1: l.lon + w / 2, lat0: l.lat - h / 2, lat1: l.lat + h / 2, labels: false, ship: l });
    var ctx = hudEl.mini.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(cv, 0, 0, 568, 388);
  }
})(window.G = window.G || {});
