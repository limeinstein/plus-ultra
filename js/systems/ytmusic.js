/* 유튜브 OST 재생 (G.YTM) — 설정 「배경 음악」이 'ost'일 때 G.Audio.music 대신 장면 곡을 유튜브 퍼가기 재생기로 튼다.
   곡 표는 js/data/ost.js. 재생기는 화면 오른쪽 아래에 보이고(유튜브 규칙: 200×200 이상), 제목 줄을 끌어 옮길 수 있다.
   유튜브를 읽지 못하면(아티팩트·오프라인·퍼가기 금지) 알리고 기존 음악으로 돌아간다. */
(function (G) {
  'use strict';
  var Y = {}, U = G.U;
  G.YTM = Y;
  var player = null, ready = false, loading = false, box = null, cur = null, queued = null, failed = false, depth = 0, momentT = null;
  function S() { return G.Game && G.Game.state; }
  function OST() { return G.OST || { tracks: {}, videos: {}, moments: {} }; }
  Y.on = function () { var s = S(); return !!(s && s.settings && s.settings.musicSrc === 'ost' && !failed); };
  Y.failed = function () { return failed; };
  Y.current = function () { return cur; };

  // ------------------------------------------------------------------ 장면 → 곡
  var BRIT = function (c) { return c.lon > -11 && c.lon < 2.2 && c.lat > 49.8 && c.lat < 61; };
  var SCAN = function (c) { return c.lat > 54.6 && c.lon > 4 && c.lon < 32; };
  var LOW = function (c) { return c.lon > 2.4 && c.lon < 7.2 && c.lat > 50.6 && c.lat < 53.6; };
  /** 도시(또는 그 고장) 곡 */
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
  function makeBox() {
    if (box) return box;
    box = document.createElement('div');
    box.className = 'ost-box wood brass-frame';
    box.style.cssText = 'position:fixed;right:14px;bottom:70px;width:240px;z-index:9000;padding:0;border-radius:8px;overflow:hidden;box-shadow:0 8px 22px rgba(0,0,0,.55);background:#1d140b;color:#f3e6c6;font:13px/1.3 "Nanum Myeongjo",serif;user-select:none';
    box.innerHTML = '<div class="ost-bar" style="display:flex;align-items:center;gap:6px;padding:5px 8px;cursor:move;background:rgba(0,0,0,.35)"><span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" class="ost-title">♪ ' + OST().title + '</span>' +
      '<button class="ost-x" title="기존 음악으로" style="background:none;border:0;color:#f3e6c6;cursor:pointer;font-size:15px;padding:0 2px">✕</button></div><div style="width:240px;height:200px"><div id="ost-player"></div></div>';
    document.body.appendChild(box);
    box.querySelector('.ost-x').onclick = function () { Y.setSource('base'); };
    var bar = box.querySelector('.ost-bar'), drag = null;
    bar.addEventListener('mousedown', function (e) { if (e.target.closest('.ost-x')) return; var r = box.getBoundingClientRect(); drag = { dx: e.clientX - r.left, dy: e.clientY - r.top }; e.preventDefault(); });
    window.addEventListener('mousemove', function (e) { if (!drag) return; box.style.left = Math.max(0, e.clientX - drag.dx) + 'px'; box.style.top = Math.max(0, e.clientY - drag.dy) + 'px'; box.style.right = 'auto'; box.style.bottom = 'auto'; });
    window.addEventListener('mouseup', function () { drag = null; });
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
          width: 240, height: 200, playerVars: { autoplay: 1, controls: 1, rel: 0, modestbranding: 1, playsinline: 1 },
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
    if (box) { box.style.display = ''; var tt = box.querySelector('.ost-title'); if (tt) tt.textContent = '♪ ' + t.name; }
    if (!ready) { queued = id; loadApi(); return; }
    var o = { videoId: OST().videos[t.v], startSeconds: t.s };
    if (t.e != null) o.endSeconds = t.e;
    try { player.loadVideoById(o); player.setVolume(vol()); if (!again) player.playVideo(); } catch (e) { fail('재생 실패'); }
  }
  /** 곡 틀기 (같은 곡이면 그대로) */
  Y.play = function (id) {
    if (!Y.on() || !id) return false;
    if (id === cur && ready) return true;
    start(id);
    return true;
  };
  Y.pause = function () { cur = null; try { if (player && ready) player.pauseVideo(); } catch (e) { /* 없음 */ } if (box) box.style.display = 'none'; };
  Y.setVolume = function () { try { if (player && ready) player.setVolume(vol()); } catch (e) { /* 없음 */ } };

  // ------------------------------------------------------------------ 장면 사이의 「잠깐」 곡 (건물·미니 게임·사건)
  /** 그 순간의 곡으로 바꾼다. 끝나면 Y.resume() — 그동안 G.Audio.music 의 장면 바꿈은 기억만 해 둔다 */
  Y.moment = function (name) {
    if (!Y.on()) return;
    var id = OST().moments[name]; if (!id) return;
    depth++; momentT = name; Y.play(id);
  };
  Y.inMoment = function () { return depth > 0; };
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
