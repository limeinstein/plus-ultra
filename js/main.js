/* Main controller: boot, stage scaling, scene management, game loop, daily world updates. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var Game = { state: null, scene: null, sceneName: '', scenes: {}, time: 0 };
  G.Game = Game;
  G.Scenes = Game.scenes;

  var stage, worldCanvas, overlayCanvas, sceneCanvas;
  Game.renderer = null;

  // ---------------------------------------------------------------- stage scaling
  function fit() {
    var s = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
    Game.scale = s;
    stage.style.transform = 'scale(' + s + ')';
    stage.style.left = Math.round((window.innerWidth - 1600 * s) / 2) + 'px';
    stage.style.top = Math.round((window.innerHeight - 900 * s) / 2) + 'px';
    resizeCanvases();
  }
  function resizeCanvases() {
    var s = Game.scale || 1, dpr = window.devicePixelRatio || 1;
    var q = (Game.state && Game.state.settings ? (Game.state.settings.res || 1) : 1) * (Game.autoRes || 1);
    var k = Math.min(2, s * dpr) * q;
    var w = Math.round(1600 * k), h = Math.round(900 * k);
    if (w > 2880) { h = Math.round(h * 2880 / w); w = 2880; }
    if (worldCanvas.width !== w) { worldCanvas.width = w; worldCanvas.height = h; }
    var ok = Math.min(2, s * dpr);
    var ow = Math.round(1600 * ok), oh = Math.round(900 * ok);
    if (overlayCanvas.width !== ow) { overlayCanvas.width = ow; overlayCanvas.height = oh; }
    Game.overlayScale = ow / 1600;
  }
  Game.canvases = function () { return { world: worldCanvas, overlay: overlayCanvas, scene: sceneCanvas }; };
  Game.showLayers = function (world, overlay, scene) {
    worldCanvas.style.display = world ? 'block' : 'none';
    overlayCanvas.style.display = overlay ? 'block' : 'none';
    sceneCanvas.style.display = scene ? 'block' : 'none';
  };
  /** draw a full-screen painting onto the scene canvas */
  Game.setScene = function (img) {
    Game._sceneSrc = img || null;
    var ctx = sceneCanvas.getContext('2d');
    ctx.clearRect(0, 0, 1600, 900);
    if (img) ctx.drawImage(img, 0, 0, 1600, 900);
  };
  Game.sceneCtx = function () { return sceneCanvas.getContext('2d'); };

  // ---------------------------------------------------------------- geo & renderer
  Game.geoReady = false;
  Game.ensureGeo = function () {
    if (Game.geoReady) return Promise.resolve();
    if (Game._geoPromise) return Game._geoPromise;
    Game._geoPromise = new Promise(function (resolve) {
      setTimeout(function () {
        G.Geo.init();
        if (G.Disc && G.Disc.spread) G.Disc.spread();   // 붙어 있는 발견물을 조금씩 떼어 놓는다 (systems/discovery.js)
        setTimeout(function () {
          if (G.Nav) G.Nav.init();
          Game.geoReady = true;
          resolve();
        }, 10);
      }, 30);
    });
    return Game._geoPromise;
  };
  Game.ensureRenderer = function () {
    if (Game.renderer) return true;
    try { Game.renderer = new G.WorldRenderer(worldCanvas); return true; }
    catch (e) { console.error(e); Game.rendererError = e.message; return false; }
  };

  // ---------------------------------------------------------------- scenes
  Game.go = function (name, arg) {
    if (Game.scene && Game.scene.exit) Game.scene.exit();
    UI.clearScreen();
    Game.sceneName = name;
    if (G.ShipSprite) G.ShipSprite.want(G.ShipSprite.fleetTypes());   // 함대 배 그림을 미리 풀어 둔다 (바다에 나가기 전에)
    Game.scene = Game.scenes[name];
    if (Game.scene && Game.scene.enter) Game.scene.enter(arg);
  };
  Game.onKey = function (e) { if (Game.scene && Game.scene.onKey) Game.scene.onKey(e); };

  var last = 0;
  function LP() { return (G.FX && G.FX.loop) || { maxDt: 0.1, resDown: 0.028, resUp: 0.0185, resMin: 0.45, resStep: 0.1, resHold: 40 }; }
  function loop(t) {
    var raw = (t - last) / 1000 || 0; last = t;
    var K = LP(), dt = Math.min(K.maxDt, Math.max(0, raw));   // 오래 멈췄던 장면(탭 전환·무거운 일) 뒤에 배가 순간 이동하지 않게
    Game.time += dt;
    // 바다(WebGL) 해상도 자동 조절: 평균 장면 시간을 보고 한 단계씩.
    //   · 버벅여 내려온 단계는 한동안(resHold초) 다시 올리지 않는다 (올렸다 내렸다 하며 화면을 새로 만드는 끊김 방지)
    //   · 낮췄는데도 빨라지지 않으면(화면 주사율이 30Hz로 묶인 기기 등) 원래대로 되돌리고 그 아래로는 내리지 않는다
    if (worldCanvas && worldCanvas.style.display !== 'none' && raw > 0 && raw < 0.25) {
      Game.ftAvg = (Game.ftAvg || 0.016) * 0.96 + raw * 0.04;
      Game.ftN = (Game.ftN || 0) + 1;
      var ar = Game.autoRes || 1, now = t / 1000, tr = Game.resTry;
      Game.resBad = Game.resBad || {};
      if (tr) {
        if (Game.ftN > 60) {
          if (Game.ftAvg > tr.ft * 0.9) { Game.resFloor = tr.from; Game.autoRes = tr.from; Game.ftAvg = tr.ft; resizeCanvases(); }
          Game.resTry = null; Game.ftN = 0;
        }
      } else if (Game.ftN > 30 && Game.ftAvg > K.resDown && ar > Math.max(K.resMin, Game.resFloor || 0) + 1e-6) {
        Game.resBad[ar.toFixed(2)] = now;
        Game.resTry = { from: ar, ft: Game.ftAvg };
        Game.autoRes = Math.max(K.resMin, ar - K.resStep); Game.ftN = 0; resizeCanvases();
      } else if (Game.ftN > 300 && Game.ftAvg < K.resUp && ar < 1) {
        var up = Math.min(1, ar + K.resStep), bad = Game.resBad[up.toFixed(2)];
        if (bad == null || now - bad > K.resHold) { Game.autoRes = up; resizeCanvases(); }
        Game.ftN = 0;
      }
    }
    if (Game.scene && Game.scene.update) {
      try { Game.scene.update(dt); } catch (e) { console.error(e); }
    }
    requestAnimationFrame(loop);
  }

  // ---------------------------------------------------------------- HUD helpers
  // 윗줄 상태 표시 (대항해시대 3처럼 도시·항해·육상 탐험마다 보이는 것이 다르다)
  var H = Game.hud = {};
  function dnDate(n) { return new Date(Math.floor(n / 10000), Math.floor(n / 100) % 100 - 1, n % 100); }
  /** 계약 남은 날: {text, warn, tip} */
  H.contract = function () {
    var S = Game.state, k = S && S.contract;
    if (!k) return { text: '없음', warn: false, tip: '맺은 계약이 없습니다.' };
    var cur = new Date(S.date.y, S.date.m - 1, S.date.d), left = Math.round((dnDate(k.due) - cur) / 86400000);
    var sp = G.SPONSOR && G.SPONSOR[k.sponsor], who = sp ? (G.Sponsor ? G.Sponsor.holderName(sp) : sp.title) : '';
    var what = k.small && G.Errand ? G.Errand.name(k) : k.circ ? '세계일주' : (G.DISC[k.disc] ? G.DISC[k.disc].name : '');
    var done = k.small && G.Errand ? G.Errand.done(k) : k.circ ? (G.Disc && G.Disc.foundByMe('circum')) : (G.Disc && G.Disc.foundByMe(k.disc));
    var tip = who + ' — 「' + what + '」 · 기한 ' + Math.floor(k.due / 10000) + '년 ' + (Math.floor(k.due / 100) % 100) + '월 ' + (k.due % 100) + '일' + (done ? ' · 찾았다 — 보고하러 가십시오' : '');
    if (left < 0) return { text: '기한 넘김 ' + (-left) + '일', warn: true, tip: tip };
    return { text: (done ? '✓ ' : '') + '남은 ' + U.num(left) + '일', warn: !done && left < 60, tip: tip };
  };
  /** 위도·경도: 천문판·육분의가 있어야(측량 2단계면 위도) 보인다 */
  H.lat = function () { var S = Game.state, l = S.loc; return R.hasItem('sextant') || R.hasItem('astrolabe') || R.skill('survey') >= 2 ? U.fmtLat(l.lat) : '? <small>(천문판)</small>'; };
  H.lon = function () { var S = Game.state, l = S.loc; return R.hasItem('sextant') ? U.fmtLon(l.lon) : '? <small>(육분의)</small>'; };
  /** 직위: 작위가 있으면 가장 높은 작위, 없으면 명성으로 부르는 이름 */
  H.title = function () { var t = G.Court && G.Court.best(), sl = G.Slave ? G.Slave.title() : ''; return sl ? sl + (t ? ' · ' + t.ko : '') : t ? t.ko : R.fameTitle(Game.state.player.fame); };   // 노예 무역에 손을 대면 「노예 상인」이 먼저 붙는다
  H.titleTip = function () { var t = G.Court ? G.Court.titles() : [], sl = G.Slave ? G.Slave.title() : ''; return (sl ? sl + ' (노예를 사고판 이름 — 남은 ' + G.Slave.remain() + '일) — ' : '') + (t.length ? t.map(function (x) { return G.Court.fullName(x, true); }).join(' · ') + ' — ' : '') + R.fameTitle(Game.state.player.fame); };
  H.fameTip = function () { return G.Fame ? '통합 명성 = ' + G.Fame.text() : ''; };
  H.lang = function (c) {
    if (!c) return '';
    var lv = R.lang(c.lang) || 0;
    return G.LANGS[c.lang] + ' <span class="dots">' + '●●●'.slice(0, lv) + '○○○'.slice(0, 3 - lv) + '</span>';
  };
  H.gold = function () { return U.num(Game.state.player.gold) + '<small>닢</small>'; };
  H.date = function () { return U.fmtDate(Game.state.date); };
  /** 보급 일수와 위기 단계. 교역품으로 대신 먹고 마실 수 있는 양도 포함한다. */
  H.supply = function (kind) {
    var days = kind === 'food' ? R.daysOfFood() : R.daysOfWater();
    var state = days <= 0 ? '고갈' : days < 3 ? '위기' : days < 7 ? '부족' : '';
    return { days: days, text: (days >= 999 ? '—' : days + '일') + (state ? ' <small class="supply-state ' + (days < 3 ? 'crisis' : 'low') + '">' + state + '</small>' : ''), warn: days < 7 };
  };
  /** 도시에 있을 때: 날짜 · 도시 · 위도·경도 · 식량·식수 · 피로 · 계약 | 소지금 · 명성 · 직위 */
  Game.cityHud = function () {
    var S = Game.state, c = G.CITY_DATA[S.loc.city], f = S.fleet, k = H.contract(), food = H.supply('food'), water = H.supply('water');
    var own = c && R.cityOwner ? R.cityOwner(c) : '';
    UI.hud.show([
      { k: 'date', icon: 'calendar', label: '날짜', text: H.date() },
      { k: 'place', icon: 'castle', label: own ? '도시 · ' + own : '도시', text: c ? c.name : '' },
      { k: 'lang', icon: 'scroll', label: '언어', text: H.lang(c), tip: c ? '이 도시의 말과 제독 일행이 하는 수준 (동료 통역·부관 포함) — ' + G.LANG_LV[R.lang(c.lang) || 0] : '' },
      { k: 'lat', icon: 'compass', label: '위도', text: c ? U.fmtLat(c.lat) : H.lat() },
      { k: 'lon', label: '경도', text: c ? U.fmtLon(c.lon) : H.lon() },
      { k: 'food', icon: 'bread', label: '식량', text: food.text },
      { k: 'water', icon: 'drop', label: '식수', text: water.text },
      { k: 'fat', icon: 'hourglass', label: '피로', text: Math.round(f.fatigue || 0) + '%' },
      { k: 'contract', icon: 'seal', label: '계약', text: k.text, tip: k.tip },
      { grow: true },
      { k: 'gold', icon: 'coin', label: '소지금', text: H.gold() },
      { k: 'fame', icon: 'laurel', label: '명성', text: U.num(S.player.fame), tip: H.fameTip() },
      { k: 'title', icon: 'crown', label: '직위', text: H.title(), tip: H.titleTip() }
    ]);
    UI.hud.set('food', food.text, food.warn); UI.hud.set('water', water.text, water.warn);
    UI.hud.set('fat', Math.round(f.fatigue || 0) + '%', (f.fatigue || 0) > 60);
    UI.hud.set('contract', k.text, k.warn);
  };
  Game.refreshHud = function () {
    var S = Game.state; if (!S) return;
    UI.hud.set('date', H.date());
    UI.hud.set('gold', H.gold());
    if (G.Fame) G.Fame.sync();   // 갈래의 합을 통합 명성에 맞춘다
    UI.hud.set('fame', U.num(S.player.fame)); UI.hud.tip('fame', H.fameTip());
    UI.hud.set('title', H.title()); UI.hud.tip('title', H.titleTip());
    var food = H.supply('food'), water = H.supply('water'), f = S.fleet || {};
    UI.hud.set('food', food.text, food.warn); UI.hud.set('water', water.text, water.warn);
    UI.hud.set('fat', Math.round(f.fatigue || 0) + '%', (f.fatigue || 0) > 60);
    var k = H.contract(); UI.hud.set('contract', k.text, k.warn); UI.hud.tip('contract', k.tip);
    Game.checkTitle();
  };
  /** 명성이 올라 부르는 이름이 바뀌면 축하해 준다 */
  var TITLES = ['무명의 항해자', '신참 모험가', '이름난 모험가', '저명한 항해가', '위대한 탐험가', '대항해자'];
  Game.checkTitle = function () {
    var S = Game.state; if (!S || !S.player) return;
    var t = R.fameTitle(S.player.fame);
    if (!S.titleSeen) { S.titleSeen = t; return; }
    if (t === S.titleSeen) return;
    if (TITLES.indexOf(t) > TITLES.indexOf(S.titleSeen)) {
      UI.toast('명성이 드높아졌다 — 이제 세상은 제독을 「' + t + '」' + U.jx(t, '이라/라') + ' 부른다!', 'laurel', 6500);
      G.State.log('「' + t + '」로 불리게 되었다. (명성 ' + U.num(S.player.fame) + ')');
      if (G.Audio) G.Audio.sfx('discover');
    }
    S.titleSeen = t;
  };

  // ---------------------------------------------------------------- time
  /** advance world time by n days (in port / on land); returns list of messages */
  Game.passDays = function (n) {
    var msgs = [];
    for (var i = 0; i < n; i++) { var m = Game.newDay(); if (m && m.length) msgs = msgs.concat(m); }
    return msgs;
  };
  /** one day passes: world-level processing. returns array of notices */
  Game.newDay = function () {
    var S = Game.state; var out = [];
    var prev = S.date;
    S.date = U.addDays(S.date, 1); S.day++;
    if (S.date.m !== prev.m) out = out.concat(G.World.newMonth());
    if (S.date.y !== prev.y) out = out.concat(G.World.newYear());
    out = out.concat(G.World.daily());
    if (G.Audio && G.Audio.daily) G.Audio.daily();   // 바다·뭍에서 지역이 바뀌면 음악도
    if (G.Quest) out = out.concat(G.Quest.daily());
    // 스트레스는 피로 하나로 합쳤다: 옛 저장에 남은 스트레스는 절반을 피로에 더하고 지운다
    if (S.fleet && S.fleet.stress) { S.fleet.fatigue = U.clamp((S.fleet.fatigue || 0) + S.fleet.stress * 0.5, 0, 100); delete S.fleet.stress; }
    Game.checkTitle();
    return out;
  };

  // ---------------------------------------------------------------- boot
  Game.boot = function () {
    stage = document.getElementById('stage');
    worldCanvas = document.getElementById('world');
    overlayCanvas = document.getElementById('overlay');
    sceneCanvas = document.getElementById('scene');
    sceneCanvas.width = 1600; sceneCanvas.height = 900;
    UI.init();
    // 그림 장치 메모리가 모자라면 브라우저가 2D 캔버스의 내용도 지운다 — 되살아나면 배경 그림과 거리를 다시 그린다
    [sceneCanvas, overlayCanvas].forEach(function (cv) {
      cv.addEventListener('contextrestored', function () {
        if (Game._sceneSrc) Game.setScene(Game._sceneSrc);
        if (G.Town && G.Town.redraw) G.Town.redraw();
      });
    });
    fit();
    window.addEventListener('resize', fit);
    Game.go('title');
    requestAnimationFrame(loop);
  };
  Game.fit = fit;

  window.addEventListener('DOMContentLoaded', function () { Game.boot(); });
})(window.G = window.G || {});
