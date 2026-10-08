/* 내 컴퓨터의 코스타 델 솔 MP3 (G.LocalOST) — 설정 「배경 음악」이 「코스타 델 솔 3 OST」일 때, 사용자가 가진
   「Costa Del Sol BGM 모음.mp3」가 있으면 유튜브 재생기 대신 이 파일을 직접 튼다 (창이 뜨지 않고, 인터넷이 없어도 된다).
   · 파일은 게임에 넣지 않는다(배포판·아티팩트에 없음). 찾는 차례:
       1. 이 브라우저에 보관해 둔 파일 — 설정의 「MP3 고르기」로 고른 것 (IndexedDB, 웹판에서도 쓸 수 있다)
       2. G.OST.local.files — file:// 로 열었을 때 WebGame/music/_local/costa_del_sol.mp3 → 옆 폴더 Ref/Costa Del Sol BGM 모음.mp3
     길이가 minDur초보다 짧으면 다른 파일로 본다. 하나도 없으면 예전처럼 유튜브 재생기(js/systems/ytmusic.js)로.
   · 한 파일 안의 곡 구간(G.OST.local.segs)만 튼다. 자연스럽게:
       - 곡이 바뀌면 두 재생기를 겹쳐 fade초 동안 천천히 바꿔 든다 (뚝 끊기지 않게)
       - 곡 끝에 닿기 전에 같은 곡 처음과 겹쳐 돌린다 (돌림 이음매가 들리지 않게)
       - 조금 전(resumeSec초 안)에 듣던 곡으로 돌아오면 멈췄던 자리부터 이어 듣는다 (주점에 들렀다 나와도 거리 곡이 처음부터 다시 시작하지 않게)
       - 곡이 바뀌면 화면 왼쪽 아래에 곡 이름이 잠깐 떠올랬다 사라진다 (showSec초)
   조정값: G.FX.localOst */
(function (G) {
  'use strict';
  var L = G.LocalOST = {};
  var state = 'idle', url = null, srcName = '', queued = null, decks = [], on = -1, cur = null, timer = null, unlockWait = false;
  var pos = {}, fromStore = false;                          // 곡 id → {t: 멈춘 자리(초), at: 멈춘 때(ms)}
  function FX() { return (G.FX && G.FX.localOst) || { fade: 2.5, loopFade: 3, resumeSec: 300, showSec: 3.2, gain: 0.9, probeMs: 6000 }; }
  function CFG() { return (G.OST && G.OST.local) || { files: [], segs: {}, alias: {} }; }
  function S() { return G.Game && G.Game.state; }
  /** 설정의 음악 크기 → 0~1 (유튜브 재생기와 같은 곡선) */
  function vol() { var s = S(), v = s && s.settings && s.settings.music != null ? s.settings.music : 0.35; return Math.max(0, Math.min(1, Math.min(1, v * 1.6) * (FX().gain || 0.9))); }
  L.state = function () { return state; };
  L.ready = function () { return state === 'ready'; };
  L.source = function () { return srcName; };
  /** 설정에서 골라 이 브라우저에 보관한 파일인가 */
  L.stored = function () { return state === 'ready' && fromStore; };
  L.current = function () { return cur; };
  /** 곡 id → [시작, 끝] (이 MP3에 없는 곡은 비슷한 곡으로) */
  L.seg = function (id) { var c = CFG(); return c.segs[id] || (c.alias && c.segs[c.alias[id]]) || null; };

  // ---------------------------------------------------------------- 파일 찾기
  var DB = 'pu_localost', STORE = 'f', KEY = 'mp3';
  function idb(fn) {
    return new Promise(function (res) {
      try {
        var rq = window.indexedDB.open(DB, 1);
        rq.onupgradeneeded = function () { rq.result.createObjectStore(STORE); };
        rq.onsuccess = function () { try { fn(rq.result, res); } catch (e) { res(null); } };
        rq.onerror = function () { res(null); };
      } catch (e) { res(null); }
    });
  }
  function storedFile() {
    return idb(function (db, res) {
      var tx = db.transaction(STORE, 'readonly'), g = tx.objectStore(STORE).get(KEY);
      g.onsuccess = function () { res(g.result || null); }; g.onerror = function () { res(null); };
    });
  }
  function storeFile(file) {
    return idb(function (db, res) {
      var tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put(file, KEY);
      tx.oncomplete = function () { res(true); }; tx.onerror = function () { res(false); };
    });
  }
  L.hasStored = function () { return storedFile().then(function (f) { return !!f; }); };
  /** 소리 파일 하나가 쓸 만한가 (길이로 본다) */
  function probe(u) {
    return new Promise(function (res) {
      var a = new Audio(), done = false;
      function fin(ok) { if (done) return; done = true; a.removeAttribute('src'); try { a.load(); } catch (e) { /* 없음 */ } res(ok); }
      a.preload = 'metadata';
      a.addEventListener('loadedmetadata', function () { fin(isFinite(a.duration) && a.duration >= (CFG().minDur || 0)); });
      a.addEventListener('error', function () { fin(false); });
      setTimeout(function () { fin(false); }, FX().probeMs || 6000);
      a.src = u;
    });
  }
  function enc(p) { if (/^[a-z]+:/i.test(p)) return encodeURI(p); return p.split('/').map(function (x) { return x === '..' || x === '.' ? x : encodeURIComponent(x); }).join('/'); }
  /** 찾아본다 (한 번). 끝나면 L.ready() */
  L.find = function () {
    if (state === 'probing' || state === 'ready') return L._p || Promise.resolve(state === 'ready');
    state = 'probing';
    L._p = (async function () {
      if (window.PU_LOCAL_OST === false) { state = 'none'; return false; }     // 시험: 내 MP3를 찾지 않는다 (유튜브 재생기 점검)
      var f = await storedFile();
      if (f) { var u0 = URL.createObjectURL(f); if (await probe(u0)) { url = u0; srcName = f.name || '보관한 MP3'; fromStore = true; state = 'ready'; return true; } URL.revokeObjectURL(u0); }
      var list = CFG().files || [];
      for (var i = 0; i < list.length; i++) {
        var u = enc(list[i]);
        if (await probe(u)) { url = u; srcName = list[i]; fromStore = false; state = 'ready'; return true; }
      }
      state = 'none';
      return false;
    })().then(function (ok) {
      var q = queued; queued = null;
      if (ok && q) L.play(q);
      else if (!ok && q && G.YTM && G.YTM.retry) G.YTM.retry(q);   // 파일이 없으면 유튜브로
      return ok;
    });
    return L._p;
  };
  /** 설정에서 고른 파일을 쓴다 (이 브라우저에 보관) */
  L.useFile = async function (file) {
    if (!file) return false;
    var u = URL.createObjectURL(file);
    if (!(await probe(u))) { URL.revokeObjectURL(u); return false; }
    L.stop();
    url = u; srcName = file.name; fromStore = true; state = 'ready';
    await storeFile(file);
    return true;
  };
  L.forget = async function () {
    await idb(function (db, res) { var tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).delete(KEY); tx.oncomplete = function () { res(true); }; tx.onerror = function () { res(false); }; });
    L.stop(); state = 'idle'; url = null; srcName = ''; fromStore = false; L._p = null;
  };

  // ---------------------------------------------------------------- 두 재생기를 겹쳐 바꿔 들기
  function deck(i) {
    if (decks[i]) return decks[i];
    var a = new Audio(); a.preload = 'auto'; a.volume = 0; a._g = 0; a._to = 0; a._id = null;
    // 창을 내려 두어 타이머가 느려져도 곡 끝을 놓치지 않게 재생 위치가 바뀔 때마다도 본다. 파일 끝에 닿아 멈췄으면 곡 처음으로
    a.addEventListener('timeupdate', function () { if (Date.now() - lastTick > 400) tick(); else loopCheck(i); });   // 타이머가 늦으면 소리 바꿈도 여기서
    a.addEventListener('ended', function () { if (i === on && a._id && a._to > 0) { var sg = L.seg(a._id); if (sg) start(a._id, sg[0], 0.6); } });
    decks[i] = a; return a;
  }
  /** 곡 끝에 다가가면 다른 재생기로 같은 곡 처음부터 겹쳐 돌린다 (곡이 끝나도 끊기지 않고 반복) */
  function loopCheck(i) {
    var a = decks[i], F = FX();
    if (!a || i !== on || !a._id || a.paused || a._to <= 0) return;
    var sg = L.seg(a._id); if (!sg) return;
    if (a.currentTime >= sg[1] - (F.loopFade || 3)) start(a._id, sg[0], F.loopFade || 3);
    else if (a.currentTime < sg[0] - 1 && a.readyState >= 1) a.currentTime = sg[0];
  }
  function tryPlay(a) {
    var p; try { p = a.play(); } catch (e) { p = null; }
    if (p && p.catch) p.catch(function () { waitGesture(); });
  }
  /** 브라우저가 첫 클릭 전에는 소리를 막는다 — 클릭·키를 기다렸다 다시 */
  function waitGesture() {
    if (unlockWait) return; unlockWait = true;
    function go() { unlockWait = false; document.removeEventListener('pointerdown', go, true); document.removeEventListener('keydown', go, true); decks.forEach(function (a) { if (a && a._to > 0 && a.paused) tryPlay(a); }); }
    document.addEventListener('pointerdown', go, true); document.addEventListener('keydown', go, true);
  }
  var lastTick = 0;
  function tick() {
    var nowT = Date.now(), dt = lastTick ? Math.min(1, Math.max(0.02, (nowT - lastTick) / 1000)) : 0.1, F = FX(), v = vol(), busy = false;
    lastTick = nowT;
    decks.forEach(function (a, i) {
      if (!a) return;
      var sp = 1 / Math.max(0.05, (a._fade || F.fade || 2.5));
      if (a._g < a._to) a._g = Math.min(a._to, a._g + dt * sp); else if (a._g > a._to) a._g = Math.max(a._to, a._g - dt * sp);
      a.volume = Math.max(0, Math.min(1, a._g * v));
      if (a._to === 0 && a._g <= 0 && !a.paused) { remember(a); a.pause(); }
      if (a._g > 0 || a._to > 0) busy = true;
    });
    loopCheck(on);
    if (!busy && timer) { clearInterval(timer); timer = null; }
  }
  function ensureTimer() { if (!timer) { lastTick = Date.now(); timer = setInterval(tick, 100); } }
  function remember(a) { if (a && a._id) pos[a._id] = { t: a.currentTime, at: Date.now() }; }
  /** id 곡을 at초부터 다른 재생기로 틀고, 지금 재생기는 fade초에 걸쳐 줄인다 */
  function start(id, at, fade) {
    var nxt = on === 0 ? 1 : 0, a = deck(nxt), old = decks[on];
    if (old) { old._to = 0; old._fade = fade; }
    a._id = id; a._to = 1; a._fade = fade; a._g = 0; a.volume = 0;
    if (a.src !== new URL(url, location.href).href) a.src = url;
    var seek = function () { try { a.currentTime = at; } catch (e) { /* 아직 못 감 */ } };
    seek(); if (a.readyState < 1) a.addEventListener('loadedmetadata', seek, { once: true });   // 아직 못 읽었어도 시작 자리를 먼저 정해 둔다 (파일 처음이 잠깐 들리지 않게)
    tryPlay(a);
    on = nxt; cur = id;
    ensureTimer();
  }
  // ---------------------------------------------------------------- 곡 이름 알림
  var nowEl = null, nowT = null;
  function showName(id) {
    var t = G.OST && G.OST.tracks[id], F = FX(); if (!t || !(F.showSec > 0)) return;
    if (!nowEl) {
      nowEl = document.createElement('div'); nowEl.className = 'ost-now';
      (document.getElementById('ui') || document.body).appendChild(nowEl);
    }
    nowEl.textContent = '♪ ' + t.name;
    nowEl.classList.add('on');
    if (nowT) clearTimeout(nowT);
    nowT = setTimeout(function () { if (nowEl) nowEl.classList.remove('on'); }, F.showSec * 1000);
  }

  // ---------------------------------------------------------------- 밖에서 부르는 것
  /** 곡 틀기 — 파일이 있으면 true (찾는 중이면 맡아 두었다가 튼다) */
  L.want = function (id) {
    if (state === 'none') return false;
    if (state !== 'ready') { queued = id; L.find(); return true; }
    L.play(id);
    return true;
  };
  L.play = function (id) {
    if (!L.ready()) return false;
    var sg = L.seg(id); if (!sg) return false;
    if (id === cur && decks[on] && decks[on]._to > 0) { if (decks[on].paused) tryPlay(decks[on]); return true; }
    var F = FX(), p = pos[id], at = sg[0];
    if (p && Date.now() - p.at < (F.resumeSec || 300) * 1000 && p.t > sg[0] && p.t < sg[1] - (F.loopFade || 3) - 2) at = p.t;   // 조금 전에 듣던 곡이면 이어서
    if (decks[on]) remember(decks[on]);
    start(id, at, F.fade || 2.5);
    showName(id);
    return true;
  };
  L.pause = function () { decks.forEach(function (a) { if (a) { if (a._to > 0) remember(a); a._to = 0; a._fade = 0.8; } }); cur = null; ensureTimer(); };
  L.stop = function () { decks.forEach(function (a) { if (a) { remember(a); a._to = 0; a._g = 0; a.volume = 0; a.pause(); } }); cur = null; };
  L.setVolume = function () { decks.forEach(function (a) { if (a) a.volume = Math.max(0, Math.min(1, a._g * vol())); }); };
  /** 시험·수첩용: 지금 상태 */
  L.status = function () {
    var a = decks[on];
    return { state: state, source: srcName, track: cur, time: a ? +a.currentTime.toFixed(2) : null, paused: a ? a.paused : null,
      vols: decks.map(function (d) { return d ? +d.volume.toFixed(3) : null; }), on: on };
  };
})(window.G = window.G || {});
