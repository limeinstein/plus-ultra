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
  AU.setVolume = function () { if (G.YTM) G.YTM.setVolume(); setFileVolume(); if (!ctx) return; musicGain.gain.value = vol('music', 0.35) * 0.5; sfxGain.gain.value = vol('sound', 0.5); };
  AU.unlock = function () {
    if (!init()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (pendingPlay) { var p = pendingPlay; pendingPlay = null; if (p === decks[deckOn]) tryPlay(p); }
    if (AU.want && !cur && !fileTrack) AU.music(AU.want);
  };
  document.addEventListener('pointerdown', function () { AU.unlock(); }, { once: false, passive: true });
  document.addEventListener('keydown', function () { AU.unlock(); }, { passive: true });

  var sfxTune = 1;
  function tone(freq, t, dur, type, gain, dest, attack) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'triangle'; o.frequency.value = freq * sfxTune;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain || 0.2, t + (attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sfxGain); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  function noise(t, dur, gain, freq, q, dest, type) {
    var s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    var f = ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = (freq || 800) * sfxTune; f.Q.value = q || 0.7;
    var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || sfxGain); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  function sweep(from, to, t, dur, type, gain, attack, dest) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(Math.max(1, from * sfxTune), t); o.frequency.exponentialRampToValueAtTime(Math.max(1, to * sfxTune), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain || 0.1, t + (attack || 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sfxGain); o.start(t); o.stop(t + dur + 0.05);
  }
  function knock(t, gain, high) {
    noise(t, 0.08, gain || 0.16, high ? 1500 : 280, high ? 2.4 : 1.1, null, 'bandpass');
    tone(high ? 620 : 105, t, high ? 0.1 : 0.16, 'triangle', (gain || 0.16) * 0.55);
  }
  /** 파일 없이 합성하는 효과음 목록 — 작은 음원을 여럿 겹쳐 물·나무·금속·목소리의 질감을 만든다. */
  AU.SFX = ['wake', 'sail', 'depart', 'dock', 'breath', 'wagon', 'horse', 'run', 'townstep', 'door', 'gull', 'cannon', 'gun', 'sword', 'growl', 'discover', 'children', 'page', 'glasses', 'coin', 'unload', 'cheer'];
  AU.SFX_VARIANTS = 3;
  var lastVariant = {};
  function pickVariant(name, want) {
    if (want != null) return ((want % AU.SFX_VARIANTS) + AU.SFX_VARIANTS) % AU.SFX_VARIANTS;
    var old = lastVariant[name] == null ? Math.floor(Math.random() * AU.SFX_VARIANTS) : lastVariant[name];
    var next = (old + 1 + Math.floor(Math.random() * (AU.SFX_VARIANTS - 1))) % AU.SFX_VARIANTS;
    lastVariant[name] = next; return next;
  }
  /** 두 번째 인수 0·1·2로 세 변형을 직접 고를 수 있고, 생략하면 바로 전과 다른 변형을 고른다. */
  AU.sfx = function (name, wantVariant) {
    if (!ctx || ctx.state !== 'running') return false;
    var t = ctx.currentTime, oldTune = sfxTune, variant = pickVariant(name, wantVariant);
    sfxTune = [0.91, 1, 1.09][variant];
    switch (name) {
      case 'click': tone(880, t, 0.06, 'square', 0.05); break;
      case 'wake':
        noise(t, 0.95, 0.11, 1150, 0.7, null, 'bandpass'); noise(t + 0.06, 0.75, 0.08, 320, 0.5);
        [0.14, 0.34, 0.57].forEach(function (d, i) { sweep(260 + i * 35, 95, t + d, 0.18, 'sine', 0.018); });
        break;
      case 'sail':
        noise(t, 0.92, 0.09, 950, 0.75, null, 'bandpass'); noise(t + 0.08, 0.46, 0.065, 3100, 0.8, null, 'highpass');
        [0.12, 0.38, 0.66].forEach(function (d, i) { noise(t + d, 0.055 + i * 0.012, 0.08 - i * 0.012, 4300 - i * 420, 1.1, null, 'highpass'); });
        sweep(225, 150, t + 0.24, 0.42, 'triangle', 0.018, 0.1);
        break;
      case 'depart':
        sweep(92, 118, t, 1.15, 'sawtooth', 0.08, 0.08); tone(184, t + 0.03, 1.05, 'sine', 0.055, null, 0.08);
        [0.08, 0.2].forEach(function (d) { noise(t + d, 0.22, 0.12, 480, 1.8, null, 'bandpass'); });
        [880, 1320].forEach(function (f, i) { tone(f, t + 0.46 + i * 0.025, 1.25, 'sine', 0.07); });
        break;
      case 'dock':
        knock(t, 0.28); knock(t + 0.19, 0.19); sweep(210, 82, t + 0.07, 0.65, 'sawtooth', 0.035, 0.04);
        noise(t + 0.28, 0.72, 0.09, 900, 0.8, null, 'bandpass');
        break;
      case 'breath':
        noise(t, 0.42, 0.055, 720, 1.8, null, 'bandpass'); noise(t + 0.62, 0.48, 0.045, 640, 1.6, null, 'bandpass');
        sweep(165, 125, t + 0.03, 0.38, 'sine', 0.016, 0.12); sweep(150, 112, t + 0.65, 0.4, 'sine', 0.014, 0.12);
        break;
      case 'wagon':
        noise(t, 0.85, 0.08, 170, 0.8); knock(t + 0.04, 0.15); knock(t + 0.46, 0.11);
        sweep(410, 250, t + 0.12, 0.48, 'triangle', 0.025, 0.12); sweep(260, 390, t + 0.48, 0.31, 'triangle', 0.018, 0.08);
        break;
      case 'horse':
        [0, 0.12, 0.34, 0.47].forEach(function (d, i) { noise(t + d, 0.075, i < 2 ? 0.16 : 0.13, 520 + (i % 2) * 190, 2.8, null, 'bandpass'); tone(92 + (i % 2) * 18, t + d, 0.09, 'triangle', 0.05); });
        break;
      case 'run':
        [0, 0.18, 0.36, 0.53].forEach(function (d, i) { noise(t + d, 0.085, 0.13 - i * 0.008, 330 + (i % 2) * 120, 1.8, null, 'bandpass'); tone(78 + (i % 2) * 15, t + d, 0.1, 'triangle', 0.035); });
        noise(t + 0.1, 0.52, 0.025, 1800, 1.1, null, 'highpass');
        break;
      case 'townstep':
        [0, 0.3, 0.61].forEach(function (d, i) { noise(t + d, 0.065, 0.095, 820 + i * 90, 2.5, null, 'bandpass'); tone(135 + i * 8, t + d, 0.08, 'triangle', 0.026); });
        break;
      case 'door':
        knock(t, 0.1, true); sweep(310, 115, t + 0.09, 0.72, 'sawtooth', 0.035, 0.12);
        noise(t + 0.06, 0.76, 0.075, 430, 2.2, null, 'bandpass'); knock(t + 0.68, 0.18);
        break;
      case 'gull':
        sweep(1450, 2350, t, 0.18, 'sine', 0.055, 0.02); sweep(2300, 1320, t + 0.16, 0.24, 'sine', 0.05, 0.02);
        sweep(1280, 2050, t + 0.58, 0.14, 'sine', 0.04, 0.02); sweep(2050, 1200, t + 0.7, 0.2, 'sine', 0.035, 0.02);
        break;
      case 'coin':
        [0, 0.045, 0.11, 0.18, 0.27, 0.39, 0.53, 0.68].forEach(function (d, i) { var f = [1318, 1760, 1480, 2093, 1568][i % 5]; tone(f, t + d, 0.18 + i * 0.012, 'triangle', 0.075); tone(f * 1.51, t + d + 0.008, 0.1, 'sine', 0.025); });
        break;
      case 'discover':
        [[392, 0], [523, 0.12], [659, 0.24], [784, 0.38], [1046, 0.55], [1318, 0.55]].forEach(function (n, i) { tone(n[0], t + n[1], 0.72 - i * 0.035, 'sawtooth', 0.055, null, 0.025); tone(n[0] / 2, t + n[1], 0.82, 'sine', 0.055); });
        noise(t + 0.52, 0.32, 0.04, 4200, 1.4, null, 'highpass');
        break;
      case 'cannon':
        noise(t, 0.06, 0.35, 5200, 0.7, null, 'highpass'); noise(t + 0.015, 1.35, 0.72, 310, 0.75); tone(48, t, 0.72, 'sine', 0.48);
        noise(t + 0.18, 1.6, 0.16, 120, 0.7); [0.2, 0.31, 0.47].forEach(function (d) { knock(t + d, 0.06); });
        break;
      case 'gun':
        noise(t, 0.045, 0.42, 6500, 0.55, null, 'highpass'); noise(t + 0.01, 0.42, 0.26, 720, 0.85, null, 'bandpass');
        tone(92, t, 0.24, 'sine', 0.16); noise(t + 0.13, 0.72, 0.055, 260, 0.8);
        break;
      case 'growl':
        sweep(118, 58, t, 1.15, 'sawtooth', 0.12, 0.16); sweep(176, 82, t + 0.08, 0.92, 'square', 0.035, 0.12);
        noise(t + 0.04, 1.08, 0.11, 260, 2.3, null, 'bandpass');
        break;
      case 'children':
        [0, 0.16, 0.34, 0.62, 0.78].forEach(function (d, i) { var f = [620, 760, 680, 820, 720][i]; sweep(f, f * 1.34, t + d, 0.16, 'sine', 0.035, 0.025); tone(f * 2, t + d + 0.025, 0.12, 'sine', 0.014); });
        noise(t + 0.08, 0.95, 0.025, 1800, 2, null, 'bandpass');
        break;
      case 'page':
        noise(t, 0.16, 0.13, 4300, 0.7, null, 'highpass'); noise(t + 0.09, 0.31, 0.075, 1800, 1.1, null, 'bandpass');
        noise(t + 0.3, 0.09, 0.08, 3600, 0.8, null, 'highpass');
        break;
      case 'glasses':
        [1760, 2380, 2940].forEach(function (f, i) { tone(f, t + i * 0.014, 0.52 - i * 0.06, 'sine', 0.045); });
        noise(t + 0.015, 0.055, 0.04, 6200, 2, null, 'highpass');
        break;
      case 'unload':
        [0, 0.21, 0.43, 0.68].forEach(function (d, i) { knock(t + d, 0.18 - i * 0.018, i === 2); });
        noise(t + 0.12, 0.85, 0.07, 210, 1.2); sweep(320, 190, t + 0.38, 0.42, 'triangle', 0.022, 0.08);
        break;
      case 'cheer':
        [0, 0.05, 0.12, 0.2, 0.31, 0.43].forEach(function (d, i) { var f = 165 + (i % 3) * 38; sweep(f, f * 1.9, t + d, 0.48 + (i % 2) * 0.16, i % 2 ? 'sawtooth' : 'triangle', 0.035, 0.06); });
        noise(t + 0.08, 1.05, 0.075, 950, 0.85, null, 'bandpass');
        break;
      case 'hit': noise(t, 0.35, 0.5, 1400, 1.2); break;
      case 'splash': noise(t, 0.6, 0.25, 2200, 0.6, null, 'bandpass'); break;
      case 'sword': noise(t, 0.11, 0.28, 5200, 3, null, 'highpass'); tone(1860, t, 0.34, 'triangle', 0.075); tone(2780, t + 0.012, 0.23, 'sine', 0.05); break;
      case 'storm': noise(t, 2.5, 0.5, 300, 0.5); break;
      case 'bell': [880, 1320].forEach(function (f, i) { tone(f, t + i * 0.02, 1.6, 'sine', 0.12); }); break;
      case 'fail': tone(330, t, 0.25, 'square', 0.08); tone(247, t + 0.2, 0.4, 'square', 0.08); break;
      default: sfxTune = oldTune; return false;
    }
    sfxTune = oldTune;
    return true;
  };

  /* 움직이는 동안 계속 들리는 소리는 매 장면마다 부르되, 여기서 실제 시간 간격을 막아 한 덩어리씩 낸다.
     게임 배속을 올려도 효과음이 겹치지 않는다. */
  var travelAt = {}, travelN = {};
  AU.travel = function (kind, intensity) {
    if (!ctx || ctx.state !== 'running' || !intensity) { if (!intensity) delete travelAt[kind]; return false; }
    var now = ctx.currentTime, k = Math.max(0.15, Math.min(1, intensity)), cfg = {
      sea: ['wake', 1.2 - k * 0.45], walk: ['breath', 2.9 - k * 0.6], horse: ['horse', 0.92 - k * 0.25], wagon: ['wagon', 1.15 - k * 0.3],
      run: ['run', 0.78 - k * 0.2], townstep: ['townstep', 0.94 - k * 0.2]
    }[kind];
    if (!cfg || now < (travelAt[kind] || 0)) return false;
    travelAt[kind] = now + cfg[1];
    if (kind === 'sea' && ((travelN[kind] = (travelN[kind] || 0) + 1) % 3 === 0)) cfg[0] = 'sail';
    return AU.sfx(cfg[0]);
  };

  // ---------------------------------------------------------------- generative music
  /* 코드로 만드는 음악. 장면 기본(town·sea·battle·title·land)과 고장 음악(G.MUSIC 표에서 'gen:이름'으로 고른다).
     root 으뜸음(Hz) · steps 음계(반음) · tempo 한 박(초) · type 가락 소리 · drone 깔리는 으뜸음 · perc 장단 · lead 가락 크기 · chords 화음을 깔지 */
  var SCALES = {
    town: { root: 220, steps: [0, 2, 3, 5, 7, 8, 10], tempo: 0.34, type: 'triangle' },     // aeolian lute
    sea: { root: 196, steps: [0, 2, 4, 7, 9], tempo: 0.62, type: 'sine' },               // pentatonic, calm
    battle: { root: 164.8, steps: [0, 1, 4, 5, 7, 8, 10], tempo: 0.2, type: 'sawtooth' },  // phrygian dominant
    title: { root: 196, steps: [0, 2, 4, 5, 7, 9, 11], tempo: 0.45, type: 'triangle' },
    land: { root: 174.6, steps: [0, 3, 5, 7, 10], tempo: 0.5, type: 'triangle' },
    // 고장 음악 (js/data/music.js 의 gen:이름)
    tavern: { root: 261.6, steps: [0, 2, 4, 5, 7, 9, 11], tempo: 0.17, type: 'square', perc: 'jig', lead: 0.035, busy: 0.85 },   // 주점: 빠른 지그
    east: { root: 220, steps: [0, 2, 4, 7, 9], tempo: 0.42, type: 'triangle', perc: 'wood', chords: false, lead: 0.07 },          // 중국: 5음 음계
    korea: { root: 196, steps: [0, 2, 5, 7, 9], tempo: 0.55, type: 'sine', drone: 0.035, perc: 'janggu', chords: false, lead: 0.07 },   // 조선: 느린 장단
    japan: { root: 220, steps: [0, 1, 5, 7, 8], tempo: 0.5, type: 'triangle', perc: 'wood', chords: false, lead: 0.07 },          // 일본: 미야코부시 음계
    arab: { root: 196, steps: [0, 1, 4, 5, 7, 8, 11], tempo: 0.26, type: 'triangle', drone: 0.04, perc: 'darbuka', chords: false },   // 이슬람: 히자즈
    india: { root: 185, steps: [0, 1, 4, 5, 7, 8, 11], tempo: 0.3, type: 'sawtooth', drone: 0.05, perc: 'tabla', chords: false, lead: 0.03 },   // 인도: 탐푸라 + 타블라
    africa: { root: 196, steps: [0, 3, 5, 7, 10], tempo: 0.22, type: 'triangle', perc: 'hand', busy: 0.55 },                      // 아프리카: 손북
    seasia: { root: 233, steps: [0, 1, 3, 7, 8], tempo: 0.3, type: 'sine', perc: 'gong', chords: false, lead: 0.08 },             // 동남아: 펠로그 가믈란
    america: { root: 207.7, steps: [0, 3, 5, 7, 10], tempo: 0.36, type: 'sine', drone: 0.025, perc: 'hand', lead: 0.075 },       // 아메리카: 피리
    seaind: { root: 185, steps: [0, 2, 4, 7, 9], tempo: 0.6, type: 'sine', drone: 0.03, busy: 0.45 },                            // 인도양 항해
    seaeast: { root: 220, steps: [0, 2, 4, 7, 9], tempo: 0.66, type: 'triangle', chords: false, busy: 0.4, lead: 0.06 }        // 동아시아·동남아 항해
  };
  AU.SCALES = SCALES;
  function freqOf(sc, deg, oct) { var n = sc.steps.length; var o = Math.floor(deg / n); var i = ((deg % n) + n) % n; return sc.root * Math.pow(2, (sc.steps[i] + 12 * (o + (oct || 0))) / 12); }
  var melody = 0;
  function perc(sc, beat, t) {
    switch (sc.perc) {
      case 'jig': if (beat % 3 === 0) noise(t, 0.08, beat % 6 === 0 ? 0.22 : 0.1, 220, 1, musicGain); break;
      case 'hand': if (beat % 2 === 0 || beat === 7 || beat === 13) noise(t, 0.1, beat % 4 === 0 ? 0.25 : 0.1, beat % 4 === 0 ? 160 : 420, 1.4, musicGain); break;
      case 'darbuka': if (beat === 0 || beat === 8) tone(90, t, 0.25, 'sine', 0.16, musicGain); if (beat === 3 || beat === 6 || beat === 11 || beat === 14) noise(t, 0.05, 0.12, 2400, 2, musicGain, 'bandpass'); break;
      case 'tabla': if (beat % 4 === 0) tone(beat % 8 === 0 ? 110 : 150, t, 0.3, 'sine', 0.12, musicGain); else if (beat % 2) noise(t, 0.04, 0.07, 3000, 3, musicGain, 'bandpass'); break;
      case 'wood': if (beat % 4 === 0) noise(t, 0.04, 0.12, 1800, 6, musicGain, 'bandpass'); break;
      case 'janggu': if (beat === 0 || beat === 6 || beat === 10) tone(beat ? 140 : 95, t, 0.3, 'sine', 0.14, musicGain); if (beat === 3 || beat === 12) noise(t, 0.05, 0.1, 2600, 3, musicGain, 'bandpass'); break;
      case 'gong': if (beat === 0) { tone(sc.root / 2, t, 2.4, 'sine', 0.08, musicGain, 0.02); tone(sc.root / 2 * 2.76, t, 1.6, 'sine', 0.02, musicGain, 0.02); } break;
    }
  }
  function schedule() {
    if (!cur || !ctx) return;
    var sc = SCALES[cur];
    while (nextT < ctx.currentTime + 0.6) {
      var beat = step % 16;
      if (sc.drone && beat === 0 && (step >> 4) % 2 === 0) { tone(sc.root / 2, nextT, sc.tempo * 32, 'sine', sc.drone, musicGain, 0.6); tone(sc.root * 0.75, nextT, sc.tempo * 32, 'sine', sc.drone * 0.5, musicGain, 0.6); }
      if (sc.chords !== false && beat % 8 === 0) { var chord = [0, 3, 4, 5][(step >> 4) % 4]; [0, 2, 4].forEach(function (k) { tone(freqOf(sc, chord + k, -1), nextT, sc.tempo * 7.5, 'sine', 0.05, musicGain, 0.3); }); }
      if (cur === 'battle' && beat % 2 === 0) noise(nextT, 0.12, beat % 4 === 0 ? 0.35 : 0.12, 180, 1, musicGain);
      if (sc.perc) perc(sc, beat, nextT);
      if (Math.random() < (sc.busy || (cur === 'sea' ? 0.45 : 0.7))) {
        melody += Math.round((Math.random() - 0.5) * 3.2); melody = Math.max(-2, Math.min(9, melody));
        tone(freqOf(sc, melody, 0), nextT, sc.tempo * (Math.random() < 0.3 ? 2.4 : 1.3), sc.type === 'sawtooth' && !sc.lead ? 'square' : sc.type, sc.lead || (cur === 'battle' ? 0.035 : 0.06), musicGain, 0.015);
      }
      if (cur === 'sea' && beat === 0 && Math.random() < 0.5) noise(nextT, 3.5, 0.05, 500, 0.4, musicGain);
      nextT += sc.tempo; step++;
    }
  }
  function genMusic(name) {
    if (!SCALES[name]) name = 'town';
    if (!init() || ctx.state !== 'running') { genWant = name; return; }
    genWant = null;
    if (cur === name) return;
    cur = name; step = 0; melody = 0; nextT = ctx.currentTime + 0.1;
    if (timer) clearInterval(timer);
    timer = setInterval(schedule, 200);
  }
  var genWant = null;
  function genStop() { cur = null; genWant = null; if (timer) clearInterval(timer); timer = null; }
  /** 시험용: 지금 코드 음악 이름 (없으면 null) */
  AU.genNow = function () { return cur || genWant; };

  // ---------------------------------------------------------------- music files (music/*.mp3, 표는 js/data/music.js)
  /* 장면 이름(town·sea·land·battle)과 지금 자리로 곡을 고른다. 파일 곡이 있으면 그것을, 없거나 못 읽으면 코드 음악.
     두 <audio>를 번갈아 써서 곡이 바뀔 때 겹쳐 넘어간다(fade초). 브라우저가 첫 클릭 전에는 소리를 막으므로 그때 다시 튼다. */
  var decks = [], deckOn = -1, fileTrack = null, failed = {}, pendingPlay = null, fadeTimer = null, hold = { track: null, n: 0 };
  function MT() { return G.MUSIC || { scenes: {} }; }
  function fileVol() { return Math.min(1, vol('music', 0.35) * (MT().volume || 1)); }
  function setFileVolume() { if (deckOn >= 0 && decks[deckOn] && !fadeTimer) decks[deckOn].volume = fileVol(); }
  /** 곡 이름이 쓸 수 있는가: 'gen:이름'은 코드 음악, 그 밖은 music/ 파일 */
  function usable(t) { if (!t) return false; if (t.indexOf('gen:') === 0) return !!SCALES[t.slice(4)]; return !!(G.MUSIC_FILES && G.MUSIC_FILES[t] && !failed[t]); }
  function nearestCity(lon, lat) {
    var best = null, bd = 1e9;
    (G.CITY_DATA || []).forEach(function (c) { if (G.R && G.R.cityExists && !G.R.cityExists(c)) return; var d = G.Geo.dist(lon, lat, c.lon, c.lat); if (d < bd) { bd = d; best = c; } });
    return best;
  }
  /** 도시의 고장 곡: byCity → byRegion → byStyle (아메리카·동남아·일본은 도시 양식보다 고장이 먼저) */
  function cityPick(sc, c) { return (sc.byCity && sc.byCity[c.id]) || (sc.byRegion && sc.byRegion[c.region]) || (sc.byStyle && sc.byStyle[c.style]) || null; }
  /** 장면과 자리에 맞는 곡 이름 (표에 없으면 null). 'gen:이름'이면 그 고장의 코드 음악 */
  AU.pick = function (name) {
    var sc = MT().scenes[name]; if (!sc) return null;
    var s = G.Game && G.Game.state, l = s && s.loc, t = null;
    try {
      if (name === 'town' && AU.place && sc.byPlace && sc.byPlace[AU.place]) t = sc.byPlace[AU.place];      // 주점 같은 건물 안
      else if (name === 'town' && l && l.city != null) {
        var c = G.CITY_DATA[l.city];
        if (c) t = cityPick(sc, c);
      } else if (name === 'sea' && l && l.lon != null && G.Ships && G.Ships.zone) {
        t = sc.byZone && sc.byZone[G.Ships.zone(l.lon, l.lat)] || null;
      } else if (name === 'land' && l && l.lon != null && G.Geo && G.Geo.terrain) {
        t = sc.byTerrain && sc.byTerrain[G.Geo.terrain(l.lon, l.lat)] || null;
        if (!t && sc.byNearCity) { var nc = nearestCity(l.lon, l.lat), tc = nc && cityPick(MT().scenes.town || {}, nc); if (tc && tc.indexOf('gen:') === 0) t = tc; }   // 사막·밀림이 아니면 가까운 도시의 고장 곡
      }
    } catch (e) { t = null; }
    if (usable(t)) return t;
    return usable(sc.def) ? sc.def : null;
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
  /* 잠깐 다른 곡(주점의 코드 음악 등)으로 바뀔 때는 거리 곡을 내리지 않고 멈춰만 둔다 — 건물에서 나오면 그 자리에서 이어 튼다.
     (예전에는 나올 때마다 곡 파일을 처음부터 다시 읽어, 큰 파일·한 파일짜리 판에서 화면이 잠깐 멎었다) */
  var parked = null;
  function parkFile() {
    if (deckOn < 0 || !fileTrack || !decks[deckOn]) { stopFile(); return; }
    var idx = deckOn, el = decks[idx], v0 = el.volume, F = Math.max(0.05, MT().fade || 1.8), t0 = Date.now();
    parked = { track: fileTrack, idx: idx };
    fileTrack = null; pendingPlay = null; deckOn = -1;
    if (fadeTimer) clearInterval(fadeTimer);
    fadeTimer = setInterval(function () {
      var k = Math.min(1, (Date.now() - t0) / (F * 1000));
      el.volume = v0 * (1 - k);
      if (k >= 1) { clearInterval(fadeTimer); fadeTimer = null; el.pause(); }
    }, 50);
  }
  function playFile(t) {
    if (fileTrack === t) return;
    genStop();
    if (parked && parked.track === t && decks[parked.idx] && decks[parked.idx].getAttribute('src')) {   // 멈춰 둔 거리 곡을 이어서
      var pi = parked.idx; parked = null; fileTrack = t;
      tryPlay(decks[pi]); fadeTo(pi);
      return;
    }
    fileTrack = t;
    var idx = deckOn === 0 ? 1 : 0;
    if (parked && parked.idx === idx) parked = null;   // 멈춰 둔 곡 자리를 새 곡이 쓴다
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
  /** 장면 음악: 고장에 맞는 파일 곡이나 코드 음악 */
  AU.music = function (name, force) {
    AU.want = name; hold = { track: null, n: 0 };
    if (name !== 'town' && name !== 'battle') AU.place = null;     // 도시를 떠나면 건물 곡은 끝 (일기토(battle)는 건물 안에서도 벌어진다)
    // 설정 「배경 음악」이 코스타 델 솔 3 OST면 유튜브 재생기로 (js/systems/ytmusic.js). 미니 게임 같은 「잠깐」 곡 동안에는 장면만 기억해 둔다
    var Y = G.YTM;
    if (Y) { Y.install(); if (Y.on()) { if (Y.inMoment() && !force) return; var yt = Y.pick(name); if (yt) { genStop(); stopFile(); Y.play(yt); return; } Y.pause(); } else Y.pause(); }
    var t = AU.pick(name);
    if (t && t.indexOf('gen:') === 0) { parkFile(); genMusic(t.slice(4)); return; }
    if (t) { if (force || fileTrack !== t) playFile(t); return; }
    stopFile();
    genMusic(name);
  };
  /** 지금 서 있는 건물 (주점·왕궁·저택…, 거리면 null) — 건물마다 곡이 있으면 그 곡, 나오면 그 고장 거리의 곡.
     겹쳐 쌓이지 않는다: 건물에서 건물로 옮겨도, 나가기 버튼·성문·출항 어느 길로 나와도 한 번에 바뀐다 (js/scenes/city.js) */
  AU.place = null;
  AU.setPlace = function (kind, quiet) {
    kind = kind || null;
    if (AU.place === kind) return;
    AU.place = kind;
    if (!quiet && AU.want === 'town') AU.music('town', true);
  };
  /** 지금 들리는 곡 (파일 이름 · 'gen:이름' · OST 곡 'ost:id') — 시험·도감용 */
  AU.now = function () {
    if (G.YTM && G.YTM.on() && G.YTM.current()) return 'ost:' + G.YTM.current();
    return fileTrack || (AU.genNow() ? 'gen:' + AU.genNow() : null);
  };
  /** 하루에 한 번(Game.newDay): 바다·뭍에서 자리가 바뀌면 곡을 바꾼다. hold일 연달아 다른 곳이어야 바꿔 경계에서 오락가락하지 않게 */
  AU.daily = function () {
    var name = AU.want; if (name !== 'sea' && name !== 'land') return;
    if (G.YTM && G.YTM.on()) { if (!G.YTM.inMoment()) { var yt = G.YTM.pick(name); if (yt && yt !== G.YTM.current()) G.YTM.play(yt); } return; }
    var t = AU.pick(name), now = fileTrack || (cur ? 'gen:' + cur : null);
    if (!t || t === now) { hold = { track: null, n: 0 }; return; }
    var need = (MT().scenes[name] || {}).hold || 1;
    if (hold.track === t) hold.n++; else hold = { track: t, n: 1 };
    if (hold.n >= need) { hold = { track: null, n: 0 }; if (t.indexOf('gen:') === 0) { stopFile(); genMusic(t.slice(4)); } else playFile(t); }
  };
  AU.nowPlaying = function () { return fileTrack; };
  /** 시험용: 지금 곡의 재생 상태 */
  AU.fileStatus = function () { var d = decks[deckOn]; return d ? { track: fileTrack, time: +d.currentTime.toFixed(2), paused: d.paused, volume: +d.volume.toFixed(2) } : null; };
  AU.stop = function () { AU.want = null; genStop(); stopFile(); if (G.YTM) G.YTM.pause(); };
  /** 건물·미니 게임·사건의 「잠깐」 곡 (OST일 때만) — 끝나면 AU.resume() */
  AU.moment = function (name) { if (G.YTM) G.YTM.moment(name); };
  AU.resume = function () { if (G.YTM) G.YTM.resume(); };
})(window.G = window.G || {});
