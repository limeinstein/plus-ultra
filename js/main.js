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
    Game.scene = Game.scenes[name];
    if (Game.scene && Game.scene.enter) Game.scene.enter(arg);
  };
  Game.onKey = function (e) { if (Game.scene && Game.scene.onKey) Game.scene.onKey(e); };

  var last = 0;
  function loop(t) {
    var dt = Math.min(0.25, (t - last) / 1000 || 0); last = t;
    Game.time += dt;
    // adaptive resolution for the WebGL world view
    if (worldCanvas && worldCanvas.style.display !== 'none' && dt > 0) {
      Game.ftAvg = (Game.ftAvg || 0.016) * 0.97 + dt * 0.03;
      Game.ftN = (Game.ftN || 0) + 1;
      if (Game.ftN > 24 && Game.ftAvg > 0.045 && (Game.autoRes || 1) > 0.55) { Game.autoRes = (Game.autoRes || 1) - 0.15; Game.ftN = 0; resizeCanvases(); }
      else if (Game.ftN > 240 && Game.ftAvg < 0.02 && (Game.autoRes || 1) < 1) { Game.autoRes = Math.min(1, Game.autoRes + 0.1); Game.ftN = 0; resizeCanvases(); }
    }
    if (Game.scene && Game.scene.update) {
      try { Game.scene.update(dt); } catch (e) { console.error(e); }
    }
    requestAnimationFrame(loop);
  }

  // ---------------------------------------------------------------- HUD helpers
  Game.cityHud = function () {
    var S = Game.state, c = G.CITY_DATA[S.loc.city];
    UI.hud.show([
      { k: 'date', icon: 'calendar', text: U.fmtDate(S.date) },
      { k: 'place', icon: 'castle', text: c ? c.name : '' },
      { grow: true },
      { k: 'gold', icon: 'coin', text: U.num(S.player.gold) + '<small>닢</small>' },
      { k: 'fame', icon: 'laurel', text: '명성 ' + U.num(S.player.fame) }
    ]);
  };
  Game.refreshHud = function () {
    var S = Game.state; if (!S) return;
    UI.hud.set('date', U.fmtDate(S.date));
    UI.hud.set('gold', U.num(S.player.gold) + '<small>닢</small>');
    UI.hud.set('fame', '명성 ' + U.num(S.player.fame));
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
    if (G.Quest) out = out.concat(G.Quest.daily());
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
    fit();
    window.addEventListener('resize', fit);
    Game.go('title');
    requestAnimationFrame(loop);
  };
  Game.fit = fit;

  window.addEventListener('DOMContentLoaded', function () { Game.boot(); });
})(window.G = window.G || {});
