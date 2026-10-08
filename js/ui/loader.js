/* 불러오는 그림 (G.Loader) — 검은 화면 대신 도는 지구와 배(images/effects/loading-world.anim.webp, Codex 그림)를 띄운다.
   · 처음 열 때: index.html 의 #boot-loader 가 스크립트를 읽기 전부터 떠 있다가, 타이틀이 준비되면(지도·저장·글꼴) 걷힌다 (title.js)
   · 게임을 시작·이어하기·불러오기 할 때: 바다·탐험·도시를 미리 준비하는 동안(G.Game.prepare) 띄우고, 첫 장면이 그려진 뒤 걷는다
   · 장면을 바꾸는 검은 막(UI.fade)이 길어지면 그 위에 작게 (dim)
   조정값: G.FX.loader */
(function (G) {
  'use strict';
  var L = G.Loader = {};
  var el = null, shownAt = 0, hideT = null, depth = 0;
  function FX() { return (G.FX && G.FX.loader) || { minShow: 450, fadeMs: 450, fadeAfter: 350 }; }
  function box() {
    if (el) return el;
    el = document.getElementById('boot-loader');
    if (!el) {
      el = document.createElement('div'); el.id = 'boot-loader';
      el.innerHTML = '<div class="bl-box"><img class="bl-img" src="images/effects/loading-world.anim.webp" alt="" width="320" height="320"><div class="bl-text"></div><div class="bl-dots"><i></i><i></i><i></i></div></div>';
      document.body.appendChild(el);
    }
    if (el.classList.contains('on')) shownAt = shownAt || performance.now();
    return el;
  }
  /** 떠 있는가 */
  L.shown = function () { return !!(box() && el.classList.contains('on')); };
  /** 글 바꾸기 */
  L.text = function (t) { var b = box().querySelector('.bl-text'); if (b && t != null) b.textContent = t; };
  /** 띄운다. o.dim: 뒤 화면이 비치는 작은 모양 (장면 사이) */
  L.show = function (t, o) {
    box(); o = o || {};
    if (hideT) { clearTimeout(hideT); hideT = null; }
    el.classList.toggle('dim', !!o.dim);
    el.classList.remove('out');
    if (!el.classList.contains('on')) { el.classList.add('on'); shownAt = performance.now(); }
    if (t != null) L.text(t);
  };
  /** 걷는다 — 너무 짧게 깜박이지 않게 minShow ms 는 보여 준 뒤 천천히 */
  L.hide = function () {
    box();
    if (!el.classList.contains('on')) return Promise.resolve();
    var F = FX(), wait = Math.max(0, (F.minShow || 0) - (performance.now() - shownAt));
    return new Promise(function (res) {
      if (hideT) clearTimeout(hideT);
      hideT = setTimeout(function () {
        hideT = null;
        el.classList.add('out'); el.classList.remove('on');
        setTimeout(function () { if (!el.classList.contains('on')) el.classList.remove('out', 'dim'); res(); }, F.fadeMs || 450);
      }, wait);
    });
  };
  /** fn 을 하는 동안 띄워 둔다 (겹쳐 불러도 맨 바깥이 끝날 때 걷힌다) */
  L.during = async function (t, fn, o) {
    depth++; L.show(t, o);
    try { return await fn(); }
    finally { depth--; if (depth <= 0) { depth = 0; await L.hide(); } }
  };
  /** 다음 장면이 화면에 그려질 때까지 (두 번의 화면 갱신) */
  L.frames = function (n) {
    return new Promise(function (res) { var k = n || 2; (function step() { if (--k < 0) return res(); requestAnimationFrame(step); })(); });
  };
})(window.G = window.G || {});
