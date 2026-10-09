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

  /** 그릴 그림: {src, key} (key = images/ 기준 이름 — 얼굴 자리 G.PORTRAIT_FACES를 찾을 때 쓴다) */
  function sourceOf(opts) {
    if (opts.src) return { src: opts.src, key: opts.key || null };
    var chain = opts.chain;
    if (!chain && opts.portrait && G.Art && G.Art.portraitKeys) chain = G.Art.portraitKeys(opts.portrait);
    if (chain && G.Img) {
      var key = G.Img.pick(chain);
      if (key) return { src: G.Img.src(key), key: key };
    }
    return null;
  }

  /* 얼굴 자리(그림 기준 비율, tools/portrait_faces.py)를 리그 상자 기준 %로 옮긴다.
     그림은 상자 안에 contain으로 놓이므로(흉상은 가운데, 반신은 아래에 붙음) 그 자리를 셈해서 맞춘다.
     목(머리를 돌리는 축·머리 조각의 아래 끝)은 턱 바로 밑, 가슴은 그 아래 얼굴 높이의 1.25배. 눈 깜박임·입은 두 눈을 잇는 선의 기울기대로. */
  var NECK_BELOW_CHIN = 0.02, CHEST_BELOW_NECK = 1.25, EYE_W = 0.5, MOUTH_W = 0.9;
  function placeFace(root, face, iw, ih, posY) {
    var bw = root.offsetWidth, bh = root.offsetHeight;
    if (!bw || !bh || !iw || !ih) return false;
    var k = Math.min(bw / iw, bh / ih), dw = iw * k, dh = ih * k, ox = (bw - dw) / 2, oy = (bh - dh) * posY;
    function X(nx) { return (ox + nx * dw) / bw * 100; }
    function Y(ny) { return (oy + ny * dh) / bh * 100; }
    var b = face.box, e = face.eyes, m = face.mouth;
    var neck = Y(b[1] + b[3] * (1 + NECK_BELOW_CHIN)), chest = Math.min(94, neck + b[3] * dh / bh * 100 * CHEST_BELOW_NECK);
    root.style.setProperty('--rig-face-x', X(b[0] + b[2] / 2) + '%');
    root.style.setProperty('--rig-neck', neck + '%');
    root.style.setProperty('--rig-chest', chest + '%');
    // 두 눈 사이 거리(화면 px)와 기울기
    var ex = (e[2] - e[0]) * dw, ey = (e[3] - e[1]) * dh, iod = Math.sqrt(ex * ex + ey * ey), ang = Math.atan2(ey, ex) * 180 / Math.PI;
    var fx = root.querySelector('.rig-facefx'); if (!fx) return true;
    var el = fx.querySelector('.eye-l'), er = fx.querySelector('.eye-r'), mo = fx.querySelector('.mouth');
    [[el, e[0], e[1]], [er, e[2], e[3]]].forEach(function (q) {
      if (!q[0]) return;
      q[0].style.left = X(q[1]) + '%'; q[0].style.top = Y(q[2]) + '%';
      q[0].style.width = (iod * EYE_W / bw * 100) + '%';
      q[0].style.transform = 'translate(-50%, -50%) rotate(' + ang.toFixed(1) + 'deg) scaleY(.15)';
    });
    if (mo && m) {
      mo.style.left = X(m[0]) + '%'; mo.style.top = Y(m[1]) + '%';
      mo.style.width = (iod * MOUTH_W / bw * 100) + '%';
      mo.style.setProperty('--rig-mouth-rot', ang.toFixed(1) + 'deg');
    }
    return true;
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

    var so = sourceOf(opts), src = so && so.src, layered = opts.layered !== false && !!src;
    var faceAt = opts.face || (so && so.key && G.PORTRAIT_FACES && G.PORTRAIT_FACES[so.key]) || null, ro = null, headIm = null;
    if (layered) {
      // 같은 그림을 머리·몸통·하체로 세 번 읽는 동안 일부만 먼저 뜨면 얼굴이나 모자가
      // 수평으로 잘린 것처럼 보인다. 완성된 한 장을 받침으로 먼저 보여 주고, 세 조각이
      // 전부 준비된 뒤에만 2.5D 레이어로 바꾼다. 한 조각이라도 실패하면 받침을 유지한다.
      var baseIm = new Image(), piecesLeft = 3, pieceFailed = false;
      baseIm.className = 'rig-layer rig-base';
      baseIm.alt = opts.alt || '';
      baseIm.decoding = 'async'; baseIm.draggable = false; baseIm.src = src;
      root.appendChild(baseIm);
      function pieceReady() {
        piecesLeft--;
        if (!pieceFailed && piecesLeft === 0 && !dead) root.classList.add('rig-ready');
      }
      function pieceError() {
        pieceFailed = true;
        root.classList.add('rig-piece-failed');
      }
      ['lower', 'torso', 'head'].forEach(function (part) {
        var im = new Image();
        im.className = 'rig-layer rig-piece rig-' + part;
        im.alt = '';
        im.decoding = 'async'; im.draggable = false;
        im.addEventListener('load', pieceReady, { once: true });
        im.addEventListener('error', pieceError, { once: true });
        im.src = src;
        if (part === 'head') headIm = im;
        root.appendChild(im);
      });
      var face = document.createElement('div');
      face.className = 'rig-facefx' + (opts.noFace ? ' off' : '');   // noFace: 옆모습 같은 그림 — 기본 자리 눈·입을 덧그리지 않는다
      face.innerHTML = '<i class="eye eye-l"></i><i class="eye eye-r"></i><i class="mouth"></i>';
      root.appendChild(face);
      // 그림마다 다른 얼굴 자리에 목·가슴 나눔선과 눈·입을 맞춘다 (없으면 기본 자리). 상자 크기가 바뀌면 다시 맞춘다
      if (faceAt && headIm) {
        var posY = profile === 'half' ? 1 : 0.5;
        var fit = function () { if (!dead && headIm.naturalWidth) placeFace(root, faceAt, headIm.naturalWidth, headIm.naturalHeight, posY); };
        root.classList.add('rig-faced');
        // 그림 묶음을 늦게 읽는 판(아티팩트)에서는 자리표 그림이 먼저 오고 나중에 진짜 그림으로 바뀌므로 load 를 늘 듣는다
        if (headIm.complete) setTimeout(fit, 0);
        headIm.addEventListener('load', fit);
        if (window.ResizeObserver) { ro = new ResizeObserver(fit); ro.observe(root); }
        else if (window.requestAnimationFrame) requestAnimationFrame(function () { requestAnimationFrame(fit); });
      }
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
      dead = true; clearTimeout(blinkTimer); if (ro) ro.disconnect();
      if (root.parentNode) root.parentNode.removeChild(root);
      host.classList.remove('portrait-rig-host');
    }

    setState(opts.state || 'idle');
    setEmotion(opts.emotion || 'neutral');
    scheduleBlink();
    return { root: root, setState: setState, setEmotion: setEmotion, setSpeaking: function (on) { setState(on ? 'talk' : 'listen'); }, destroy: destroy };
  };
})(window.G = window.G || {});
