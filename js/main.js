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
    if (!(s > 0.02)) s = 0.02;   // 창이 아직 0 크기(숨은 탭·막 열린 창)일 때 — zoom 0·나누기 0을 막는다. 크기가 생기면 resize로 다시 맞춘다
    Game.scale = s;
    var left = Math.round((window.innerWidth - 1600 * s) / 2), top = Math.round((window.innerHeight - 900 * s) / 2);
    // 선명한 렌더링 (2026-10-18): transform: scale은 글씨를 1600×900 크기로 그린 뒤 늘려 27인치 FHD·QHD에서 획이 뭉개진다.
    // CSS zoom은 글씨를 화면의 실제 크기로 다시 짜서 그린다. zoom을 쓰면 left/top도 zoom배가 되므로 나눠 둔다. (js/ui/display.js)
    var sharp = G.Display && G.Display.render() === 'sharp';
    Game.renderMode = sharp ? 'sharp' : 'classic';
    if (sharp) {
      stage.style.transform = ''; stage.style.zoom = s;
      stage.style.left = (left / s).toFixed(3) + 'px'; stage.style.top = (top / s).toFixed(3) + 'px';
    } else {
      stage.style.zoom = ''; stage.style.transform = 'scale(' + s + ')';
      stage.style.left = left + 'px'; stage.style.top = top + 'px';
    }
    document.documentElement.classList.toggle('stage-sharp', !!sharp);
    fitUi(s);
    resizeCanvases();
    if (G.Display) G.Display.applyFont();
  }

  // ---------------------------------------------------------------- 글씨·창 크기 (UI QA 2026-10-11 #1)
  /* 무대(1600×900)를 화면에 맞춰 통째로 줄이면 작은 화면(1280×720 노트북·휴대폰)에서 글씨가 너무 작아진다.
     그래서 UI 층(#ui)만 따로 키운다: UI 층을 (1600/z)×(900/z) 크기로 짜고 CSS zoom z배로 키워 무대를 그대로 채운다.
     그림 캔버스(바다·거리·해전)는 그대로 · 창·메뉴·글씨만 커진다. 고른 크기는 이 브라우저(기기)에만 남긴다 (저장 파일과 무관) */
  var UI_SIZES = { auto: 0, small: 0.9, normal: 1, large: 1.15, xlarge: 1.3, max: 1.45 };   // 이름표는 js/ui/display.js D.SIZES
  Game.UI_SIZES = UI_SIZES;
  Game.uiSizePref = function () {
    try { var v = window.localStorage.getItem('pu.uiSize'); if (v && UI_SIZES[v] != null) return v; } catch (e) { /* 저장소를 못 쓰면 자동 */ }
    return 'auto';
  };
  Game.setUiSize = function (v) {
    try { window.localStorage.setItem('pu.uiSize', v); } catch (e) { /* 이번 판에만 */ Game._uiSizeMem = v; }
    fit();
  };
  function uiZoomFor(s) {
    var p = Game._uiSizeMem || Game.uiSizePref(), z = UI_SIZES[p];
    // 자동(DEFAULT): 글씨가 1600×900에서 보던 크기의 92% 이상으로 보이게 키운다 (1280×720 → 1.15배 · 1024×768 → 1.3배까지)
    // 모니터의 화소 밀도도 본다 (2026-10-18): 본문(19px)이 실제 화면에서 24점 이상으로 그려지게 — 27인치 FHD(배율 100~125%)는 조금 키우고, 4K는 그대로
    if (!z) {
      var dpr = window.devicePixelRatio || 1;
      z = Math.max(1, Math.min(1.3, Math.max(0.92 / Math.max(0.05, s), Math.min(1.2, 24 / (19 * Math.max(0.05, s) * dpr)))));
    }
    return Math.round(z * 100) / 100;
  }
  function fitUi(s) {
    var z = uiZoomFor(s), ui = document.getElementById('ui');
    Game.uiZoom = z;
    if (!ui) return;
    ui.style.setProperty('--unz', (1 / z).toFixed(4));   // 1600×900에 맞춰 짠 온 화면 판(캐릭터 만들기)은 원래 크기로 되돌린다
    if (z > 1.001 || z < 0.999) {
      ui.style.zoom = z;
      ui.style.width = (1600 / z).toFixed(2) + 'px'; ui.style.height = (900 / z).toFixed(2) + 'px';
      ui.style.right = 'auto'; ui.style.bottom = 'auto';
    } else {
      ui.style.zoom = ''; ui.style.width = ''; ui.style.height = ''; ui.style.right = ''; ui.style.bottom = '';
    }
    document.documentElement.classList.toggle('ui-zoomed', z > 1.001 || z < 0.999);
    if (UI.fitHud) UI.fitHud();
  }
  /** UI 층의 너비·높이 (UI 좌표) — 창·그림 상자를 가운데에 놓을 때 1600·900 대신 쓴다 */
  Game.uiW = function () { return 1600 / (Game.uiZoom || 1); };
  Game.uiH = function () { return 900 / (Game.uiZoom || 1); };
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

  // ---------------------------------------------------------------- 미리 준비 (불러오는 그림이 떠 있는 동안)
  /* 게임을 시작·이어하기·불러오기 할 때 바다·탐험이 바로 움직이도록 미리 해 둔다 (js/ui/loader.js 가 그동안 그림을 띄운다):
     지도 → 이 저장의 화질로 캔버스 크기 맞추기 → 바다 셰이더 컴파일 → 지금 자리(항구라면 그 앞바다)의 육지 판 → 배·탐험대·사건 그림 */
  function sleepFrame() { return new Promise(function (r) { requestAnimationFrame(function () { setTimeout(r, 0); }); }); }
  /** 그 자리의 바다(또는 탐험) 화면 — 장면의 첫 화면과 같은 모양 */
  Game.warmView = function (s, kind) {
    s = s || Game.state; if (!s || !s.loc) return null;
    var l = s.loc, lon = l.lon, lat = l.lat, land = kind === 'land' || (kind == null && l.mode === 'land');
    if (l.mode === 'city' && G.CITY_DATA[l.city]) {
      var c = G.CITY_DATA[l.city], dock = c.dock || [c.lat, c.lon], sea = G.Nav && G.Nav.nearestSea ? G.Nav.nearestSea(dock[1], dock[0], 12) : null;
      lon = land || !sea ? c.lon : sea[0]; lat = land || !sea ? c.lat : sea[1];
    }
    if (lon == null || lat == null) return null;
    var res = s.settings && s.settings.res;
    return { lon: lon, lat: lat, zoom: land ? 170 : 110, time: 0, wind: [0.5, 0.3], cloud: 0.3, edge: 0.75, mode: 0, quality: land ? 1 : (res && res < 1 ? 0.5 : 1), cssWidth: 1600 };
  };
  /** 게임 상태가 정해진 뒤 첫 장면 전에 (Loader 가 떠 있는 동안) */
  Game.prepare = async function (s) {
    s = s || Game.state;
    var LD = G.Loader;
    await Game.ensureGeo();
    fit();                                          // 이 저장의 화질(settings.res)로 캔버스 크기를 맞춘 뒤에 그려 둔다
    if (LD) LD.text('바다와 땅을 그릴 준비를 하는 중…');
    await sleepFrame();
    if (Game.ensureRenderer()) {
      try {
        Game.renderer.warmShaders();
        var v = Game.warmView(s); if (v) Game.renderer.prewarm(v);
        Game.renderer.finish();
      } catch (e) { console.warn('[준비] 바다 그림:', e); }
    }
    if (LD) LD.text('배와 탐험대를 꾸리는 중…');
    await sleepFrame();
    var ps = [], fl = s && s.fleet;
    if (G.ShipSprite && fl) ps.push(G.ShipSprite.preload(fl.ships.map(function (sh) { return sh.type; }), 4000));
    if (G.VoyageFX && G.VoyageFX.preload) G.VoyageFX.preload();
    if (G.EventFx) { G.EventFx.preload('sea'); G.EventFx.preload('land'); }
    if (G.Party && G.Party.preloadSprites) G.Party.preloadSprites((s.loc && s.loc.mount && s.loc.mount.id) || 'walk');
    if (G.Img && G.Img.prefetchCrew) G.Img.prefetchCrew();
    if (s.loc && s.loc.mode === 'city' && G.Scenes.city && G.Scenes.city.preloadImages && G.CITY_DATA[s.loc.city]) ps.push(G.Scenes.city.preloadImages(G.CITY_DATA[s.loc.city]));
    var cap = ((G.FX && G.FX.loader) || {}).prepareMs || 5000;
    await Promise.race([Promise.all(ps), new Promise(function (r) { setTimeout(r, cap); })]);
  };
  /** 첫 장면이 화면에 나왔나: 도시는 거리·메뉴·첫 대화가 뜰 때, 바다·탐험은 몇 장면을 그린 뒤 */
  Game.sceneShown = function (ms) {
    var t0 = performance.now(), n = 0;
    return new Promise(function (res) {
      (function check() {
        n++;
        var nm = Game.sceneName, ok = nm === 'city' ? !!((G.Town && G.Town.active && G.Town.active()) || document.querySelector('#ui .cmdmenu') || UI.busy()) : n > 3;
        if (ok || performance.now() - t0 > (ms || 8000)) return res();
        requestAnimationFrame(check);
      })();
    });
  };
  /** 불러오는 그림을 띄운 채 준비하고(Game.prepare) 첫 장면으로 들어간다 — goFn 이 장면을 연다 */
  Game.launch = function (text, goFn) {
    if (!G.Loader) { goFn(); return Promise.resolve(); }
    return G.Loader.during(text || '항해를 준비하는 중…', async function () {
      await Game.prepare();
      if (G.Loader) G.Loader.text('닻을 올리는 중…');
      goFn();
      await Game.sceneShown();
      await G.Loader.frames(2);
    });
  };
  /** 도시에 머무는 동안 그 항구 앞바다의 육지 판을 한 줄씩 그려 둔다 (출항·성문 밖 탐험이 멈칫하지 않게) */
  var pwTok = 0;
  Game.prewarmCity = function (c) {
    if (!Game.renderer || !Game.state || !c) return;
    var tok = ++pwTok, v = Game.warmView(Game.state, 'sea');
    (function step() {
      if (tok !== pwTok || Game.sceneName !== 'city' || !Game.renderer) return;          // 도시를 떠났으면 그만 (바다 장면이 판을 그린다)
      var done = false; try { done = Game.renderer.prewarm(v, true); } catch (e) { return; }
      if (!done) (window.requestIdleCallback || function (f) { return setTimeout(f, 30); })(step, { timeout: 120 });
    })();
  };

  // ---------------------------------------------------------------- scenes
  Game.go = function (name, arg) {
    Game.ftGrace = performance.now() + (((G.FX && G.FX.loop) || {}).sceneGrace || 1500);   // 장면을 막 바꾼 동안은 해상도 자동 조절이 재지 않는다
    if (Game.scene && Game.scene.exit) Game.scene.exit(name);   // 바다↔해전처럼 장면 사이에 이어져야 하는 날씨·소리를 위해 다음 장면을 알려 준다
    UI.clearScreen();
    Game.sceneName = name;
    if (G.ShipSprite) G.ShipSprite.want(G.ShipSprite.fleetTypes());   // 함대 배 그림을 미리 풀어 둔다 (바다에 나가기 전에)
    Game.scene = Game.scenes[name];
    if (Game.scene && Game.scene.enter) Game.scene.enter(arg);
  };
  Game.onKey = function (e) { return Game.scene && Game.scene.onKey ? Game.scene.onKey(e) === true : false; };

  var last = 0;
  function LP() { return (G.FX && G.FX.loop) || { maxDt: 0.1, resDown: 0.028, resUp: 0.0185, resMin: 0.45, resStep: 0.1, resHold: 40 }; }
  function loop(t) {
    var raw = (t - last) / 1000 || 0; last = t;
    var K = LP(), dt = Math.min(K.maxDt, Math.max(0, raw));   // 오래 멈췄던 장면(탭 전환·무거운 일) 뒤에 배가 순간 이동하지 않게
    Game.time += dt;
    // 바다(WebGL) 해상도 자동 조절: 평균 장면 시간을 보고 한 단계씩.
    //   · 버벅여 내려온 단계는 한동안(resHold초) 다시 올리지 않는다 (올렸다 내렸다 하며 화면을 새로 만드는 끊김 방지)
    //   · 낮췄는데도 빨라지지 않으면(화면 주사율이 30Hz로 묶인 기기 등) 원래대로 되돌리고 그 아래로는 내리지 않는다
    if (worldCanvas && worldCanvas.style.display !== 'none' && raw > 0 && raw < 0.25 && !(Game.ftGrace && t < Game.ftGrace) && !(G.Loader && G.Loader.shown())) {
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
    if (G.Life && Game.state) { try { G.Life.tick(); } catch (e) { console.error(e); } }   // 생일 선물·수명이 다한 날 (js/systems/lifespan.js)
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
  H.title = function () { var t = G.Court && G.Court.best(), sl = G.Slave ? G.Slave.title() : '', fm = G.Princess ? G.Princess.title() : '', gv = G.Colony ? G.Colony.title() : '', pv = G.Court && G.Court.privateer && G.Court.privateer() ? '사략선장' : ''; var head = [gv, pv, sl, fm].filter(Boolean).join(' · '); return head ? head + (t ? ' · ' + t.ko : '') : t ? t.ko : R.fameTitle(Game.state.player.fame); };   // 노예 무역에 손을 대면 「노예 상인」, 에스파냐 왕녀와 혼인하면 「부마」가 먼저 붙는다   // 노예 무역에 손을 대면 「노예 상인」이 먼저 붙는다
  H.titleTip = function () { var t = G.Court ? G.Court.titles() : [], sl = G.Slave ? G.Slave.title() : ''; return (G.Court && G.Court.privateer && G.Court.privateer() ? '사략선장 (사략허가장을 지닌 동안 — 해적의 습격 −' + G.Court.pirateCutPct() + '%) — ' : '') + (sl ? sl + ' (노예를 사고판 이름 — 남은 ' + G.Slave.remain() + '일) — ' : '') + (G.Princess && G.Princess.title() ? '부마 (에스파냐 국왕의 사위) — ' : '') + (t.length ? t.map(function (x) { return G.Court.fullName(x, true); }).join(' · ') + ' — ' : '') + R.fameTitle(Game.state.player.fame); };
  H.fameTip = function () { return G.Fame ? '통합 명성 = ' + G.Fame.text() : ''; };
  H.lang = function (c) {
    if (!c) return '';
    var cl = R.cityLang(c), lv = cl.lv || 0;   // 포르투갈어가 통하는 항구면 그 말로 (js/systems/treaty.js)
    return G.LANGS[cl.li] + ' <span class="dots">' + '●●●'.slice(0, lv) + '○○○'.slice(0, 3 - lv) + '</span>';
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
      { k: 'lang', icon: 'scroll', label: '언어', text: H.lang(c), tip: c ? '이 도시의 말과 제독 일행이 하는 수준 (동료 통역·부관 포함) — ' + G.LANG_LV[R.cityLang(c).lv || 0] + (R.cityLang(c).alt ? ' · 이 항구는 ' + G.LANGS[c.lang] + ' 대신 포르투갈어가 통한다 (' + G.Treaty.ptLang(c) + ')' : '') : '' },
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
      G.State.log('「' + t + '」' + U.jx(t, '으로/로') + ' 불리게 되었다. (명성 ' + U.num(S.player.fame) + ')');
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
    // 소식은 보고서처럼 말고 이야기하듯 (【…】 머리표·줄표를 걷어 낸다 — js/ui/ui.js UI.tidyNews)
    if (UI.tidyNews) out.forEach(function (m) { if (m && typeof m.text === 'string') m.text = UI.tidyNews(m.text); });
    return out;
  };

  // ---------------------------------------------------------------- boot
  Game.boot = function () {
    stage = document.getElementById('stage');
    if (G.Display) G.Display.init();
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
    // 휴대폰을 세로로 들면 가로로 돌리라고 알린다 (css #rotate-hint · 누르면 닫힌다)
    if (!document.getElementById('rotate-hint')) {
      var rh = document.createElement('div'); rh.id = 'rotate-hint';
      rh.innerHTML = '<div class="rh-ic">⟲</div><div>화면을 가로로 돌려 주십시오</div><small>이 게임은 가로 화면(16:9)에 맞춰져 있습니다 · 누르면 그대로 계속합니다</small>';
      rh.addEventListener('click', function () { rh.classList.add('off'); });
      document.body.appendChild(rh);
    }
    fit();
    window.addEventListener('resize', fit);
    Game.go('title');
    requestAnimationFrame(loop);
  };
  Game.fit = fit;

  window.addEventListener('DOMContentLoaded', function () { Game.boot(); });
})(window.G = window.G || {});
