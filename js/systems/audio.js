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
  AU.setVolume = function () { if (!ctx) return; musicGain.gain.value = vol('music', 0.35) * 0.5; sfxGain.gain.value = vol('sound', 0.5); };
  AU.unlock = function () { if (!init()) return; if (ctx.state === 'suspended') ctx.resume(); if (AU.want && !cur) AU.music(AU.want); };
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
  AU.music = function (name) {
    AU.want = name;
    if (!init() || ctx.state !== 'running') return;
    if (cur === name) return;
    cur = name; step = 0; melody = 0; nextT = ctx.currentTime + 0.1;
    if (timer) clearInterval(timer);
    timer = setInterval(schedule, 200);
  };
  AU.stop = function () { cur = null; AU.want = null; if (timer) clearInterval(timer); timer = null; };
})(window.G = window.G || {});
