/* 대화 인물의 가벼운 2.5D 리그: 한 장의 투명 그림을 머리·몸통·하체로 나눠 아주 작게 움직인다. */
(function (G) {
  'use strict';
  var PR = {};
  G.PortraitRig = PR;

  var DEFAULT = {
    bust: { neck: 39, chest: 61, eyeY: 31, eyeGap: 13, mouthY: 45, faceX: 50 },
    half: { neck: 28, chest: 48, eyeY: 20, eyeGap: 8, mouthY: 27, faceX: 50 }
  };

  function fx() {
    return (G.FX && G.FX.dialogue) || {
      breath: 1, sway: 1, talk: 1, blinkMin: 2800, blinkMax: 6200
    };
  }

  function copy(a, b) {
    var o = {}, k;
    for (k in a) o[k] = a[k];
    for (k in (b || {})) o[k] = b[k];
    return o;
  }

  function sourceOf(opts) {
    if (opts.src) return opts.src;
    var chain = opts.chain;
    if (!chain && opts.portrait && G.Art && G.Art.portraitKeys) chain = G.Art.portraitKeys(opts.portrait);
    if (chain && G.Img) {
      var key = G.Img.pick(chain);
      if (key) return G.Img.src(key);
    }
    return null;
  }

  function fallback(host, opts) {
    var el;
    if (opts.portrait instanceof HTMLCanvasElement) el = opts.portrait;
    else if (opts.portrait && G.Art && G.Art.portraitCanvas) el = G.Art.portraitCanvas(opts.portrait, opts.size || 248);
    else return null;
    el.classList.add('rig-fallback');
    host.appendChild(el);
    return el;
  }

  /**
   * host 안에 리그를 붙인다.
   * opts: {src|chain|portrait, profile:'bust'|'half', anchors, side, state, emotion, alt, layered}
   */
  PR.mount = function (host, opts) {
    opts = opts || {};
    var profile = opts.profile === 'half' ? 'half' : 'bust';
    var a = copy(DEFAULT[profile], opts.anchors);
    var root = document.createElement('div');
    root.className = 'portrait-rig portrait-rig-' + profile + ' side-' + (opts.side || 'right');
    root.style.setProperty('--rig-neck', a.neck + '%');
    root.style.setProperty('--rig-chest', a.chest + '%');
    root.style.setProperty('--rig-face-x', a.faceX + '%');
    root.style.setProperty('--rig-eye-y', a.eyeY + '%');
    root.style.setProperty('--rig-eye-gap', a.eyeGap + '%');
    root.style.setProperty('--rig-mouth-y', a.mouthY + '%');
    var F = fx();
    var breath = F.breath == null ? 1 : F.breath, sway = F.sway == null ? 1 : F.sway, talk = F.talk == null ? 1 : F.talk;
    root.style.setProperty('--rig-breath-y', (-breath) + 'px');
    root.style.setProperty('--rig-breath-s', String(1 + 0.004 * breath));
    root.style.setProperty('--rig-sway-a', (0.34 * sway) + 'deg');
    root.style.setProperty('--rig-sway-b', (-0.22 * sway) + 'deg');
    root.style.setProperty('--rig-sway-y', (-sway) + 'px');
    root.style.setProperty('--rig-talk-a', (0.38 * talk) + 'deg');
    root.style.setProperty('--rig-talk-b', (-0.28 * talk) + 'deg');
    root.style.setProperty('--rig-talk-y', (-1.5 * talk) + 'px');
    host.classList.add('portrait-rig-host');
    host.appendChild(root);

    var src = sourceOf(opts), layered = opts.layered !== false && !!src;
    if (layered) {
      ['lower', 'torso', 'head'].forEach(function (part) {
        var im = new Image();
        im.className = 'rig-layer rig-' + part;
        im.alt = part === 'head' ? (opts.alt || '') : '';
        im.decoding = 'async'; im.draggable = false; im.src = src;
        root.appendChild(im);
      });
      var face = document.createElement('div');
      face.className = 'rig-facefx';
      face.innerHTML = '<i class="eye eye-l"></i><i class="eye eye-r"></i><i class="mouth"></i>';
      root.appendChild(face);
    } else {
      root.classList.add('rig-single');
      fallback(root, opts);
    }

    var dead = false, blinkTimer = 0;
    function scheduleBlink() {
      if (dead || !layered || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
      var K = fx(), lo = K.blinkMin || 2800, hi = K.blinkMax || 6200;
      blinkTimer = setTimeout(function () {
        if (dead || !root.isConnected) { dead = true; return; }
        root.classList.add('is-blink');
        setTimeout(function () { if (!dead) root.classList.remove('is-blink'); }, 145);
        scheduleBlink();
      }, lo + Math.random() * Math.max(100, hi - lo));
    }
    function setState(state) {
      ['idle', 'talk', 'listen', 'react'].forEach(function (s) { root.classList.toggle('is-' + s, s === state); });
      root.setAttribute('data-state', state || 'idle');
    }
    function setEmotion(emotion) {
      ['neutral', 'warm', 'happy', 'surprised', 'shy'].forEach(function (s) { root.classList.toggle('emotion-' + s, s === emotion); });
      root.setAttribute('data-emotion', emotion || 'neutral');
    }
    function destroy() {
      dead = true; clearTimeout(blinkTimer);
      if (root.parentNode) root.parentNode.removeChild(root);
      host.classList.remove('portrait-rig-host');
    }

    setState(opts.state || 'idle');
    setEmotion(opts.emotion || 'neutral');
    scheduleBlink();
    return { root: root, setState: setState, setEmotion: setEmotion, setSpeaking: function (on) { setState(on ? 'talk' : 'listen'); }, destroy: destroy };
  };
})(window.G = window.G || {});
