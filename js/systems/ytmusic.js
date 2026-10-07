/* 유튜브 OST 재생 (G.YTM) — 설정 「배경 음악」이 'ost'일 때 G.Audio.music 대신 장면 곡을 유튜브 퍼가기 재생기로 튼다.
   곡 표는 js/data/ost.js. 재생기는 화면 오른쪽 아래에 보이고(유튜브 규칙: 200×200 이상), 제목 줄을 끌어 옮길 수 있다.
   유튜브를 읽지 못하면(아티팩트·오프라인·퍼가기 금지) 알리고 기존 음악으로 돌아간다.
   사용자의 컴퓨터에 「Costa Del Sol BGM 모음.mp3」가 있으면 유튜브 대신 그 파일을 창 없이 직접 튼다 (js/systems/localost.js). */
(function (G) {
  'use strict';
  var Y = {}, U = G.U;
  G.YTM = Y;
  var player = null, ready = false, loading = false, box = null, cur = null, queued = null, failed = false, depth = 0, momentT = null;
  function S() { return G.Game && G.Game.state; }
  function OST() { return G.OST || { tracks: {}, videos: {}, moments: {} }; }
  function LO() { return G.LocalOST; }
  Y.on = function () { var s = S(); return !!(s && s.settings && s.settings.musicSrc === 'ost' && (!failed || (LO() && LO().ready()))); };
  /** 지금 내 컴퓨터의 MP3로 트는가 */
  Y.local = function () { return !!(LO() && LO().ready()); };
  Y.failed = function () { return failed; };
  Y.current = function () { return cur; };

  // ------------------------------------------------------------------ 장면 → 곡
  var BRIT = function (c) { return c.lon > -11 && c.lon < 2.2 && c.lat > 49.8 && c.lat < 61; };
  var SCAN = function (c) { return c.lat > 54.6 && c.lon > 4 && c.lon < 32; };
  var LOW = function (c) { return c.lon > 2.4 && c.lon < 7.2 && c.lat > 50.6 && c.lat < 53.6; };
  /** 도시(또는 그 고장) 곡 */
  Y.cityTrack = cityTrack;
  function cityTrack(c, land) {
    var st = c.style, rg = c.region;
    if (st === 'kr') return 'joseon';
    if (st === 'jp') return 't26';
    if (st === 'cn' && rg === 6) return 't05';
    if (st === 'se' || (st === 'cn' && rg === 8)) return rg === 7 ? 't05' : 't17';
    if (st === 'in') return land ? 't11' : 't09';
    if (st === 'is' || st === 'pe') return rg === 0 ? 't08' : 't06';
    if (st === 'ib') return rg === 3 ? 'africa' : 't08';
    if (st === 'af' || st === 'sw' || (st === 'tr' && rg === 3)) return 'africa';
    if (rg === 10) return 't03';                                   // 아메리카 (원주민·식민 도시 모두)
    if (st === 'ru' || st === 'st') return 't07';
    if (st === 'it') return 't04';
    if (st === 'gr') return 't14';
    if (st === 'ne') { if (rg === 8) return 't25'; return BRIT(c) || SCAN(c) || LOW(c) ? 't07' : 't04'; }
    return null;
  }
  function nearestCity(lon, lat) {
    var best = null, bd = 1e9;
    (G.CITY_DATA || []).forEach(function (c) { var d = G.Geo.dist(lon, lat, c.lon, c.lat); if (d < bd) { bd = d; best = c; } });
    return best;
  }
  function seaTrack(l) {  // 바다 갈래(G.Ships.zone)와 좌표로
    var lon = l.lon, lat = l.lat, z = G.Ships && G.Ships.zone ? G.Ships.zone(lon, lat) : null;
    if (lat < -22 && lat > -45 && lon > -5 && lon < 42) return 't01';            // 아프리카 남단(희망봉 둘레)
    if ((lon > 155 || lon < -105) && Math.abs(lat) < 55) return 't25';         // 태평양 한가운데
    if (z === 'med') return 't14';
    if (z === 'north') return 't18';
    if (z === 'ind') return 't12';
    if (z === 'sea') return 't17';
    if (z === 'east') { if (lat > 33 && lat < 43 && lon > 124 && lon < 131) return 'joseon'; return 't05'; }
    // 대서양: 신대륙 도시 7° 안(연안·카리브)이면 24, 먼바다는 23(대서양 횡단)
    var nc = nearestCity(lon, lat);
    if (nc && nc.region === 10 && G.Geo.dist(lon, lat, nc.lon, nc.lat) < 7) return 't24';
    return 't23';
  }
  /** 장면 이름 → 곡 id (없으면 null) */
  Y.pick = function (name) {
    var s = S(), l = s && s.loc, O = OST();
    if (O.moments[name] && name !== 'battle') return O.moments[name];
    // 도시 안의 건물(주점·왕궁·저택)에 있으면 그 건물 곡 — 나오면 G.Audio.setPlace(null)로 거리 곡 (js/systems/audio.js)
    if (name === 'town' && G.Audio && G.Audio.place && O.moments[G.Audio.place]) return O.moments[G.Audio.place];
    try {
      if (name === 'battle') return O.moments.battle;
      if (name === 'town' && l && l.city != null) {
        var c = G.CITY_DATA[l.city]; if (!c) return null;
        if (s.player && s.player.home === c.id) return O.moments.home;          // 고향 = 집으로 귀환
        return cityTrack(c, false);
      }
      if (name === 'sea' && l && l.lon != null) return seaTrack(l);
      if (name === 'land' && l && l.lon != null) { var nc = nearestCity(l.lon, l.lat); return nc ? cityTrack(nc, true) : null; }
    } catch (e) { return null; }
    return null;
  };

  // ------------------------------------------------------------------ 재생기
  function vol() { var s = S(), v = s && s.settings && s.settings.music != null ? s.settings.music : 0.35; return Math.round(Math.min(1, v * 1.6) * 100); }
  /* 재생기 창: 유튜브 규칙(퍼가기 재생기는 200×200 이상, 가리거나 숨기지 않기) 안에서 덜 거슬리게 —
     가장 작은 크기로 화면 위쪽 구석(도시에서는 왼쪽 가운데 — 오른쪽은 건물 메뉴)에 두고, 마우스를 올리지 않으면 흐리게.
     곡이 바뀌면 잠깐 또렷하게 제목을 보여 준다. 끌어 옮긴 자리는 기억한다(이 브라우저에만). 조정값: G.FX.ostBox */
  function FXB() { return (G.FX && G.FX.ostBox) || { w: 200, h: 200, idle: 0.5, flash: 2.5, gap: 8 }; }
  var KEY = 'pu_ost_box_pos', flashT = null;
  function savedPos() { try { var v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && isFinite(v.x) && isFinite(v.y) ? v : null; } catch (e) { return null; } }
  function savePos(x, y) { try { localStorage.setItem(KEY, JSON.stringify({ x: Math.round(x), y: Math.round(y) })); } catch (e) { /* 저장 못 해도 그만 */ } }
  /** 창 자리: 끌어 둔 자리가 있으면 그곳(화면 안으로), 없으면 장면마다 정한 구석 */
  function placeBox() {
    if (!box) return;
    var K = FXB(), W = window.innerWidth, H = window.innerHeight, bw = box.offsetWidth || K.w, bh = box.offsetHeight || K.h + 24, x, y;
    var sp = savedPos();
    if (sp) { x = sp.x; y = sp.y; }
    else {
      var hud = document.querySelector('.hud'), top = (hud ? hud.getBoundingClientRect().bottom : 54) + K.gap;
      var scene = G.Game && G.Game.sceneName;
      if (scene === 'city') { x = K.gap + 4; y = Math.max(top, (H - bh) / 2 + 40); }     // 도시: 오른쪽은 건물 메뉴라 왼쪽 가운데
      else { x = W - bw - K.gap; y = top; }                                            // 바다·뭍·해전: 오른쪽 위 (해도·나침반·명령 줄을 가리지 않게)
    }
    x = Math.max(0, Math.min(W - bw, x)); y = Math.max(0, Math.min(H - bh, y));
    box.style.left = x + 'px'; box.style.top = y + 'px'; box.style.right = 'auto'; box.style.bottom = 'auto';
  }
  Y.placeBox = placeBox;
  function idleLook() { if (box && !box.matches(':hover') && !box._drag) box.style.opacity = String(FXB().idle); }
  /** 곡이 바뀔 때 잠깐 또렷하게 */
  function flash() {
    if (!box) return;
    box.style.opacity = '1';
    if (flashT) clearTimeout(flashT);
    flashT = setTimeout(function () { flashT = null; idleLook(); }, FXB().flash * 1000);
  }
  function makeBox() {
    if (box) return box;
    var K = FXB();
    box = document.createElement('div');
    box.className = 'ost-box wood brass-frame';
    box.style.cssText = 'position:fixed;width:' + K.w + 'px;z-index:9000;padding:0;border-radius:6px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,.45);background:#1d140b;color:#f3e6c6;font:12px/1.3 "Nanum Myeongjo",serif;user-select:none;transition:opacity .35s;opacity:1';
    box.innerHTML = '<div class="ost-bar" style="display:flex;align-items:center;gap:6px;padding:3px 6px;cursor:move;background:rgba(0,0,0,.35)"><span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" class="ost-title">♪ ' + OST().title + '</span>' +
      '<button class="ost-x" title="기존 음악으로" style="background:none;border:0;color:#f3e6c6;cursor:pointer;font-size:13px;padding:0 2px">✕</button></div><div style="width:' + K.w + 'px;height:' + K.h + 'px"><div id="ost-player"></div></div>';
    document.body.appendChild(box);
    box.querySelector('.ost-x').onclick = function () { Y.setSource('base'); };
    box.addEventListener('mouseenter', function () { box.style.opacity = '1'; });
    box.addEventListener('mouseleave', function () { if (!flashT) idleLook(); });
    var bar = box.querySelector('.ost-bar'), drag = null;
    bar.addEventListener('mousedown', function (e) { if (e.target.closest('.ost-x')) return; var r = box.getBoundingClientRect(); drag = { dx: e.clientX - r.left, dy: e.clientY - r.top }; box._drag = true; e.preventDefault(); });
    window.addEventListener('mousemove', function (e) { if (!drag) return; box.style.left = Math.max(0, e.clientX - drag.dx) + 'px'; box.style.top = Math.max(0, e.clientY - drag.dy) + 'px'; box.style.right = 'auto'; box.style.bottom = 'auto'; });
    window.addEventListener('mouseup', function () { if (!drag) return; drag = null; box._drag = false; var r = box.getBoundingClientRect(); savePos(r.left, r.top); if (!box.matches(':hover')) idleLook(); });
    bar.addEventListener('dblclick', function () { try { localStorage.removeItem(KEY); } catch (e) { /* 없음 */ } placeBox(); });   // 두 번 누르면 처음 자리로
    window.addEventListener('resize', placeBox);
    placeBox();
    return box;
  }
  function fail(why) {
    if (failed) return;
    failed = true; loading = false;
    if (box) box.style.display = 'none';
    if (window.console) console.warn('[OST] ' + why);
    if (G.UI) G.UI.toast('유튜브 OST를 틀 수 없어 기존 음악으로 돌아갑니다. (' + why + ')', 'info', 5200);
    if (G.Audio) G.Audio.music(G.Audio.want || 'town', true);
  }
  function loadApi() {
    if (ready || loading) return;
    loading = true;
    makeBox();
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (prev) try { prev(); } catch (e) { /* 다른 재생기 */ }
      try {
        player = new window.YT.Player('ost-player', {
          width: FXB().w, height: FXB().h, playerVars: { autoplay: 1, controls: 1, rel: 0, modestbranding: 1, playsinline: 1 },
          events: {
            onReady: function () { ready = true; loading = false; player.setVolume(vol()); if (queued) { var q = queued; queued = null; start(q); } },
            onStateChange: function (e) { if (e.data === 0 && cur) start(cur, true); },          // 끝나면 그 곡을 처음부터 다시 (돌림)
            onError: function (e) { fail('영상을 재생할 수 없습니다 — 오류 ' + e.data); }
          }
        });
      } catch (e) { fail('재생기를 만들지 못했습니다'); }
    };
    if (window.YT && window.YT.Player) { window.onYouTubeIframeAPIReady(); return; }
    var sc = document.createElement('script');
    sc.src = 'https://www.youtube.com/iframe_api';
    sc.onerror = function () { fail('유튜브에 연결할 수 없습니다'); };
    document.head.appendChild(sc);
    setTimeout(function () { if (!ready && !failed) fail('유튜브가 응답하지 않습니다'); }, 12000);
  }
  function start(id, again) {
    var t = OST().tracks[id]; if (!t) return;
    cur = id;
    if (LO() && LO().want(id)) { if (box) box.style.display = 'none'; return; }     // 내 컴퓨터의 MP3 (찾는 중이면 찾은 뒤에)
    if (box) { box.style.display = ''; var tt = box.querySelector('.ost-title'); if (tt) tt.textContent = '♪ ' + t.name; placeBox(); flash(); }
    if (!ready) { queued = id; loadApi(); return; }
    var o = { videoId: OST().videos[t.v], startSeconds: t.s };
    if (t.e != null) o.endSeconds = t.e;
    try { player.loadVideoById(o); player.setVolume(vol()); if (!again) player.playVideo(); } catch (e) { fail('재생 실패'); }
  }
  /** 곡 틀기 (같은 곡이면 그대로) */
  Y.play = function (id) {
    if (!Y.on() || !id) return false;
    if (id === cur && ready) { placeBox(); return true; }      // 장면이 바뀌면 그 장면의 구석으로
    start(id);
    return true;
  };
  /** 내 MP3를 찾지 못했을 때 (localost.js) — 맡겨 둔 곡을 유튜브로 */
  Y.retry = function (id) { if (Y.on() && cur === id) start(id); };
  Y.pause = function () { cur = null; if (LO()) LO().pause(); try { if (player && ready) player.pauseVideo(); } catch (e) { /* 없음 */ } if (box) box.style.display = 'none'; };
  Y.setVolume = function () { if (LO()) LO().setVolume(); try { if (player && ready) player.setVolume(vol()); } catch (e) { /* 없음 */ } };

  // ------------------------------------------------------------------ 장면 사이의 「잠깐」 곡 (건물·미니 게임·사건)
  /** 그 순간의 곡으로 바꾼다. 끝나면 Y.resume() — 그동안 G.Audio.music 의 장면 바꿈은 기억만 해 둔다.
     (건물 곡은 여기가 아니라 G.Audio.setPlace — 겹쳐 쌓이지 않고, 건물을 나오면 바로 거리 곡) */
  Y.moment = function (name) {
    if (!Y.on()) return;
    var id = OST().moments[name]; if (!id) return;
    depth++; momentT = name; Y.play(id);
  };
  Y.inMoment = function () { return depth > 0; };
  Y.depth = function () { return depth; };
  Y.resume = function () {
    if (depth <= 0) return;
    depth--; if (depth > 0) return;
    momentT = null;
    if (G.Audio) G.Audio.music(G.Audio.want || 'town', true);
  };
  /** 설정: 'base'(기존 음악) | 'ost' */
  Y.setSource = function (src) {
    var s = S(); if (!s) return;
    s.settings.musicSrc = src === 'ost' ? 'ost' : 'base';
    if (src === 'ost') failed = false;
    depth = 0; momentT = null;
    if (src !== 'ost') Y.pause();
    if (G.Audio) G.Audio.music(G.Audio.want || 'town', true);
  };

  /** 한 번 감싸기: 미니 게임·육상전·청혼·세계 일주 귀환은 그동안 그 곡 */
  function wrap(obj, key, scene) {
    var f = obj && obj[key]; if (typeof f !== 'function' || f._ost) return;
    var g = function () {
      Y.moment(scene);
      var r;
      try { r = f.apply(this, arguments); } catch (e) { Y.resume(); throw e; }
      if (r && typeof r.then === 'function') return r.then(function (v) { Y.resume(); return v; }, function (e) { Y.resume(); throw e; });
      Y.resume(); return r;
    };
    g._ost = true; obj[key] = g;
  }
  Y.install = function () {
    if (Y._inst) return; Y._inst = true;
    if (LO() && Y.on()) LO().find();       // 내 MP3가 있는지 미리 찾아 둔다
    wrap(G.Games, 'puzzle', 'minigame'); wrap(G.Games, 'poker', 'minigame'); wrap(G.Fishing, 'open', 'minigame');
    wrap(G.Games, 'landWar', 'landwar');
    wrap(G.Wives, 'proposeMaid', 'love'); wrap(G.Wives, 'proposeMate', 'love');
    wrap(G.Sponsor, 'circumReturn', 'circum');
    wrap(G.Ending, 'show', 'gameover');
    // 전설의 대륙(무 제국·아틀란티스)을 찾는 순간
    var find = G.Disc && G.Disc.find;
    if (find && !find._ost) {
      G.Disc.find = function (d) {
        var legend = d && (d.id === 'mu' || /atlantis/i.test(d.id) || /아틀란티스|무 대륙|무 제국/.test(d.name || ''));
        if (!legend) return find.apply(this, arguments);
        Y.moment('legend');
        var r = find.apply(this, arguments);
        return r && r.then ? r.then(function (v) { Y.resume(); return v; }, function (e) { Y.resume(); throw e; }) : (Y.resume(), r);
      };
      G.Disc.find._ost = true;
    }
  };
})(window.G = window.G || {});
