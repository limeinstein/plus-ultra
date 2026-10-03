/* 미니게임의 그림 읽기·소품 표시. 게임 규칙과 저장 상태는 건드리지 않는다. */
(function (G) {
  'use strict';
  var A = G.MinigameArt = {}, D = G.MINIGAME_ART;
  function imageKey(name) { return 'minigames/' + name; }
  function escaped(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  A.style = function (name) {
    var r = D.rects[name], s = D.size;
    if (!r) return '';
    return 'background-image:var(--mg-props);background-repeat:no-repeat;background-size:' +
      (s[0] / r[2] * 100) + '% ' + (s[1] / r[3] * 100) + '%;background-position:' +
      (r[0] / (s[0] - r[2]) * 100) + '% ' + (r[1] / (s[1] - r[3]) * 100) + '%;';
  };
  A.sprite = function (name, cls, label) {
    return '<span class="mg-sprite ' + (cls || '') + '" style="' + A.style(name) + '"' +
      (label ? ' role="img" aria-label="' + escaped(label) + '"' : ' aria-hidden="true"') + '></span>';
  };
  A.get = function (name) {
    var key = imageKey(name);
    if (!G.Img || !G.Img.has(key)) return null;
    G.Img.want(key); return G.Img.get(key);
  };
  A.prepare = function (names) {
    if (G.Img) G.Img.prefetchKeys(names.map(imageKey), true);
  };
  // CSS의 주소도 Img를 거쳐야 file://·한 파일판·그림 묶음판에서 모두 동작한다.
  A.mount = function (root, kind) {
    root.classList.add('mg-art', 'mg-' + kind);
    var scene = kind === 'poker' ? 'poker' : kind === 'sphinx' ? 'sphinx' : 'ruins';
    [D.props, imageKey(scene)].forEach(function (key, i) {
      if (!G.Img || !G.Img.has(key)) return;
      G.Img.load(key).then(function (im) {
        if (!im) return;
        // CSS 파일 안에서 읽어도 css/images/... 로 잘못 찾지 않도록 절대 주소로 만든다.
        var src = new URL(G.Img.src(key), document.baseURI).href;
        root.style.setProperty(i ? '--mg-scene' : '--mg-props', 'url("' + src + '")');
        if (!i) {
          Object.keys(D.rects).forEach(function (name) {
            root.style.setProperty('--mg-' + name + '-size', (D.size[0] / D.rects[name][2] * 100) + '% ' + (D.size[1] / D.rects[name][3] * 100) + '%');
            root.style.setProperty('--mg-' + name + '-pos', (D.rects[name][0] / (D.size[0] - D.rects[name][2]) * 100) + '% ' + (D.rects[name][1] / (D.size[1] - D.rects[name][3]) * 100) + '%');
          });
          root.classList.add('mg-ready');
        }
      });
    });
  };
  A.draw = function (ctx, name, x, y, w, h) {
    var im = A.get('props'), r = D.rects[name];
    if (!im || !r) return false;
    // 배포판에서 그림이 줄어들어도 원본 기준 소품 좌표를 같은 비율로 맞춘다.
    var sx = im.naturalWidth / D.size[0], sy = im.naturalHeight / D.size[1];
    ctx.drawImage(im, r[0] * sx, r[1] * sy, r[2] * sx, r[3] * sy, x, y, w, h); return true;
  };
  A.fishing = function (ctx, w, h, waterline) {
    var im = A.get('fishing'); if (!im) return false;
    var split = Math.round(im.height * G.FX.minigames.fishingWaterline);
    ctx.drawImage(im, 0, 0, im.width, split, 0, 0, w, waterline);
    ctx.drawImage(im, 0, split, im.width, im.height - split, 0, waterline, w, h - waterline);
    return true;
  };
})(window.G = window.G || {});
