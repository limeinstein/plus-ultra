/* Procedural audio (Web Audio): sound effects and simple generative music. */
(function (G) {
  'use strict';
  var AU = {};
  G.Audio = AU;
  var ctx = null, master = null, musicGain = null, sfxGain = null, noiseBuf = null;
  var cur = null, timer = null, nextT = 0, step = 0;

  function vol(k, d) { var s = G.Game && G.Game.state; var v = s && s.settings && s.settings[k] != null ? s.settings[k] : (AU.pref ? AU.pref[k] : d); return v == null ? d : v; }
  AU.pref = { sound: 0.5, music: 0.35 };
  function init() {
    if (ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    try { ctx = new AC(); } catch (e) { return false; }
    master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    AU.setVolume();
    return true;
  }
  AU.setVolume = function () { setFileVolume(); if (!ctx) return; musicGain.gain.value = vol('music', 0.35) * 0.5; sfxGain.gain.value = vol('sound', 0.5); };
  AU.unlock = function () {
    if (!init()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (pendingPlay) { var p = pendingPlay; pendingPlay = null; if (p === decks[deckOn]) tryPlay(p); }
    if (AU.want && !cur && !fileTrack) AU.music(AU.want);
  };
  document.addEventListener('pointerdown', function () { AU.unlock(); }, { once: false, passive: true });
  document.addEventListener('keydown', function () { AU.unlock(); }, { passive: true });

  function tone(freq, t, dur, type, gain, dest, attack) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'triangle'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain || 0.2, t + (attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sfxGain); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  function noise(t, dur, gain, freq, q, dest, type) {
    var s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    var f = ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq || 800; f.Q.value = q || 0.7;
    var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || sfxGain); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  AU.sfx = function (name) {
    if (!ctx || ctx.state !== 'running') return;
    var t = ctx.currentTime;
    switch (name) {
      case 'click': tone(880, t, 0.06, 'square', 0.05); break;
      case 'coin': tone(1320, t, 0.12, 'triangle', 0.15); tone(1760, t + 0.07, 0.2, 'triangle', 0.12); break;
      case 'discover': [523, 659, 784, 1046, 1318].forEach(function (f, i) { tone(f, t + i * 0.12, 0.9 - i * 0.08, 'triangle', 0.16); tone(f / 2, t + i * 0.12, 0.8, 'sine', 0.08); }); break;
      case 'cannon': noise(t, 0.9, 0.9, 380, 0.8); tone(60, t, 0.5, 'sine', 0.6); break;
      case 'hit': noise(t, 0.35, 0.5, 1400, 1.2); break;
      case 'splash': noise(t, 0.6, 0.25, 2200, 0.6, null, 'bandpass'); break;
      case 'sword': noise(t, 0.12, 0.35, 5000, 3, null, 'highpass'); tone(2400, t, 0.15, 'sawtooth', 0.04); break;
      case 'storm': noise(t, 2.5, 0.5, 300, 0.5); break;
      case 'bell': [880, 1320].forEach(function (f, i) { tone(f, t + i * 0.02, 1.6, 'sine', 0.12); }); break;
      case 'fail': tone(330, t, 0.25, 'square', 0.08); tone(247, t + 0.2, 0.4, 'square', 0.08); break;
    }
  };

  // ---------------------------------------------------------------- generative music
  var SCALES = {
    town: { root: 220, steps: [0, 2, 3, 5, 7, 8, 10], tempo: 0.34, type: 'triangle' },     // aeolian lute
    sea: { root: 196, steps: [0, 2, 4, 7, 9], tempo: 0.62, type: 'sine' },               // pentatonic, calm
    battle: { root: 164.8, steps: [0, 1, 4, 5, 7, 8, 10], tempo: 0.2, type: 'sawtooth' },  // phrygian dominant
    title: { root: 196, steps: [0, 2, 4, 5, 7, 9, 11], tempo: 0.45, type: 'triangle' },
    land: { root: 174.6, steps: [0, 3, 5, 7, 10], tempo: 0.5, type: 'triangle' }
  };
  function freqOf(sc, deg, oct) { var n = sc.steps.length; var o = Math.floor(deg / n); var i = ((deg % n) + n) % n; return sc.root * Math.pow(2, (sc.steps[i] + 12 * (o + (oct || 0))) / 12); }
  var melody = 0;
  function schedule() {
    if (!cur || !ctx) return;
    var sc = SCALES[cur];
    while (nextT < ctx.currentTime + 0.6) {
      var beat = step % 16;
      if (beat % 8 === 0) { var chord = [0, 3, 4, 5][(step >> 4) % 4]; [0, 2, 4].forEach(function (k) { tone(freqOf(sc, chord + k, -1), nextT, sc.tempo * 7.5, 'sine', 0.05, musicGain, 0.3); }); }
      if (cur === 'battle' && beat % 2 === 0) noise(nextT, 0.12, beat % 4 === 0 ? 0.35 : 0.12, 180, 1, musicGain);
      if (Math.random() < (cur === 'sea' ? 0.45 : 0.7)) {
        melody += Math.round((Math.random() - 0.5) * 3.2); melody = Math.max(-2, Math.min(9, melody));
        tone(freqOf(sc, melody, 0), nextT, sc.tempo * (Math.random() < 0.3 ? 2.4 : 1.3), sc.type === 'sawtooth' ? 'square' : sc.type, cur === 'battle' ? 0.035 : 0.06, musicGain, 0.015);
      }
      if (cur === 'sea' && beat === 0 && Math.random() < 0.5) noise(nextT, 3.5, 0.05, 500, 0.4, musicGain);
      nextT += sc.tempo; step++;
    }
  }
  function genMusic(name) {
    if (!init() || ctx.state !== 'running') return;
    if (cur === name) return;
    cur = name; step = 0; melody = 0; nextT = ctx.currentTime + 0.1;
    if (timer) clearInterval(timer);
    timer = setInterval(schedule, 200);
  }
  function genStop() { cur = null; if (timer) clearInterval(timer); timer = null; }

  // ---------------------------------------------------------------- music files (music/*.mp3, 표는 js/data/music.js)
  /* 장면 이름(town·sea·land·battle)과 지금 자리로 곡을 고른다. 파일 곡이 있으면 그것을, 없거나 못 읽으면 코드 음악.
     두 <audio>를 번갈아 써서 곡이 바뀔 때 겹쳐 넘어간다(fade초). 브라우저가 첫 클릭 전에는 소리를 막으므로 그때 다시 튼다. */
  var decks = [], deckOn = -1, fileTrack = null, failed = {}, pendingPlay = null, fadeTimer = null, hold = { track: null, n: 0 };
  function MT() { return G.MUSIC || { scenes: {} }; }
  function fileVol() { return Math.min(1, vol('music', 0.35) * (MT().volume || 1)); }
  function setFileVolume() { if (deckOn >= 0 && decks[deckOn] && !fadeTimer) decks[deckOn].volume = fileVol(); }
  /** 장면과 자리에 맞는 곡 이름 (표에 없으면 null) */
  AU.pick = function (name) {
    var sc = MT().scenes[name]; if (!sc) return null;
    var s = G.Game && G.Game.state, l = s && s.loc, t = null;
    try {
      if (name === 'town' && l && l.city != null) {
        var c = G.CITY_DATA[l.city];
        if (c) t = (sc.byCity && sc.byCity[c.id]) || (sc.byStyle && sc.byStyle[c.style]) || (sc.byRegion && sc.byRegion[c.region]) || null;
      } else if (name === 'sea' && l && l.lon != null && G.Ships && G.Ships.zone) {
        t = sc.byZone && sc.byZone[G.Ships.zone(l.lon, l.lat)] || null;
      } else if (name === 'land' && l && l.lon != null && G.Geo && G.Geo.terrain) {
        t = sc.byTerrain && sc.byTerrain[G.Geo.terrain(l.lon, l.lat)] || null;
      }
    } catch (e) { t = null; }
    t = t || sc.def || null;
    return t && G.MUSIC_FILES && G.MUSIC_FILES[t] && !failed[t] ? t : (sc.def && !failed[sc.def] && G.MUSIC_FILES && G.MUSIC_FILES[sc.def] ? sc.def : null);
  };
  function src(t) { var f = G.MUSIC_FILES[t]; return /^(data:|blob:|https?:)/.test(f) ? f : f.split('/').map(encodeURIComponent).join('/'); }
  function tryPlay(el) {
    try {
      var p = el.play();
      if (p && p.catch) p.catch(function (e) { if (e && e.name === 'NotAllowedError') pendingPlay = el; });
    } catch (e) { pendingPlay = el; }
  }
  function fadeTo(nextIdx) {
    var F = Math.max(0.05, MT().fade || 1.8), t0 = Date.now(), from = deckOn;
    if (fadeTimer) clearInterval(fadeTimer);
    decks.forEach(function (d, i) { if (d && i !== from && i !== nextIdx && !d.paused) d.pause(); });   // 겹쳐 넘어가던 중에 또 바뀌면 앞의 곡은 멈춘다
    fadeTimer = setInterval(function () {
      var k = Math.min(1, (Date.now() - t0) / (F * 1000)), tv = fileVol();
      if (nextIdx >= 0 && decks[nextIdx]) decks[nextIdx].volume = tv * k;
      if (from >= 0 && from !== nextIdx && decks[from]) decks[from].volume = tv * (1 - k);
      if (k >= 1) {
        clearInterval(fadeTimer); fadeTimer = null;
        if (from >= 0 && from !== nextIdx && decks[from]) { decks[from].pause(); decks[from].removeAttribute('src'); decks[from].load(); }
      }
    }, 50);
    deckOn = nextIdx;
  }
  function playFile(t) {
    if (fileTrack === t) return;
    genStop();
    fileTrack = t;
    var idx = deckOn === 0 ? 1 : 0;
    if (!decks[idx]) { decks[idx] = new Audio(); decks[idx].loop = true; decks[idx].preload = 'auto'; }
    var el = decks[idx];
    el.onerror = function () {                      // 파일이 없거나 못 읽음 → 이 곡은 빼고 코드 음악으로
      if (fileTrack !== t) return;
      failed[t] = 1; fileTrack = null; if (window.console) console.warn('[음악] 파일을 읽지 못했습니다: ' + G.MUSIC_FILES[t]);
      AU.music(AU.want, true);
    };
    el.src = src(t); el.volume = 0; el.currentTime = 0;
    tryPlay(el);
    fadeTo(idx);
  }
  function stopFile() {
    if (deckOn < 0 && !fileTrack) return;
    fileTrack = null; pendingPlay = null;
    fadeTo(-1);
  }
  /** 장면 음악: 파일 곡이 있으면 그것, 없으면 코드 음악 */
  AU.music = function (name, force) {
    AU.want = name; hold = { track: null, n: 0 };
    var t = AU.pick(name);
    if (t) { if (force || fileTrack !== t) playFile(t); return; }
    stopFile();
    genMusic(name);
  };
  /** 하루에 한 번(Game.newDay): 바다·뭍에서 자리가 바뀌면 곡을 바꾼다. hold일 연달아 다른 곳이어야 바꿔 경계에서 오락가락하지 않게 */
  AU.daily = function () {
    var name = AU.want; if (name !== 'sea' && name !== 'land') return;
    var t = AU.pick(name); if (!t || t === fileTrack) { hold = { track: null, n: 0 }; return; }
    var need = (MT().scenes[name] || {}).hold || 1;
    if (hold.track === t) hold.n++; else hold = { track: t, n: 1 };
    if (hold.n >= need) { hold = { track: null, n: 0 }; playFile(t); }
  };
  AU.nowPlaying = function () { return fileTrack; };
  /** 시험용: 지금 곡의 재생 상태 */
  AU.fileStatus = function () { var d = decks[deckOn]; return d ? { track: fileTrack, time: +d.currentTime.toFixed(2), paused: d.paused, volume: +d.volume.toFixed(2) } : null; };
  AU.stop = function () { AU.want = null; genStop(); stopFile(); };
})(window.G = window.G || {});
