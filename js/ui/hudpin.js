/* 바다 화면의 작은 해도·바람 판 — 단추줄에 가리지 않게 · 메모지처럼 끌어서 옮기기 (G.HudPin). 2026-10-30 사용자 요청
   ■ 기본 자리: 왼쪽 아래(해도)·오른쪽 아래(바람 판) — 아래 단추줄(.sailbar)의 높이를 재어 그 바로 위에 둔다 (예전에는 bottom 18px라
     UI 크기가 100%일 때 단추줄 뒤로 아래쪽이 가려졌다). 창 크기·글씨 크기를 바꿔도 다시 잰다.
   ■ 판을 누른 채 끌면 옮겨진다(4px 넘게 움직였을 때만 — 그냥 누르면 해도는 예전처럼 큰 해도를 연다). 놓은 자리는 이 기기(브라우저)에 기억한다
     (localStorage pu.hudPos.<이름> — 저장 파일과 상관없다. 모니터마다 다를 수 있으니까). 화면 밖으로 나가지 않게 UI 층 안으로 붙잡는다.
   ■ 오른쪽 클릭 또는 판 귀퉁이의 ⟲(옮겼을 때만 보인다)로 기본 자리로 돌아간다. */
(function (G) {
  'use strict';
  var HP = G.HudPin = {};
  var KEY = 'pu.hudPos.', GAP = 8, MIN_VIS = 1;
  var pins = [], drag = null;
  function get(k) { try { var v = window.localStorage.getItem(KEY + k); return v ? JSON.parse(v) : null; } catch (e) { return HP._mem ? HP._mem[k] || null : null; } }
  function put(k, v) { try { if (v) window.localStorage.setItem(KEY + k, JSON.stringify(v)); else window.localStorage.removeItem(KEY + k); } catch (e) { (HP._mem = HP._mem || {})[k] = v; } }
  HP.saved = get;
  function layer() { return document.getElementById('ui'); }
  function zoom() { return (G.Game && G.Game.uiZoom) || 1; }
  function size() { var l = layer(); return { w: l ? l.clientWidth || 1600 : 1600, h: l ? l.clientHeight || 900 : 900 }; }
  /** 아래 단추줄 바로 위 (UI 좌표의 bottom 값) */
  HP.barTop = function () {
    var bar = document.querySelector('#ui .sailbar');
    if (!bar || !bar.offsetHeight) return 94;
    var b = parseFloat(getComputedStyle(bar).bottom) || 18;
    return Math.round(b + bar.offsetHeight + GAP);
  };
  /** 판 하나를 놓는다 (기억한 자리 → 없으면 기본 자리) */
  function place(p) {
    var el = p.el; if (!el || !el.isConnected) return;
    var l = layer(); if (l) l.style.setProperty('--sea-bar-top', HP.barTop() + 'px');
    var pos = get(p.key);
    if (!pos) { el.style.left = el.style.top = el.style.right = el.style.bottom = ''; el.classList.remove('hp-moved'); return; }
    var sz = size(), w = el.offsetWidth || 300, h = el.offsetHeight || 200;
    var x = Math.max(0, Math.min(sz.w - w, pos.x * sz.w)), y = Math.max(MIN_VIS, Math.min(sz.h - h, pos.y * sz.h));
    el.style.left = Math.round(x) + 'px'; el.style.top = Math.round(y) + 'px'; el.style.right = 'auto'; el.style.bottom = 'auto';
    el.classList.add('hp-moved');
  }
  HP.fit = function () { pins = pins.filter(function (p) { return p.el && p.el.isConnected; }); pins.forEach(place); };
  HP.reset = function (key) { put(key, null); HP.fit(); };
  /** 판을 옮길 수 있게 — key: 기억할 이름 · 판의 onclick(누르기)은 끌지 않았을 때만 */
  HP.pin = function (el, key, label) {
    if (!el) return el;
    var p = { el: el, key: key };
    pins.push(p);
    el.classList.add('hud-pin');
    el.title = (el.title ? el.title + ' · ' : '') + '끌어서 옮기기 · 오른쪽 클릭: 제자리로';
    var rs = document.createElement('button');
    rs.className = 'hp-reset'; rs.type = 'button'; rs.textContent = '⟲'; rs.title = (label || '') + ' 제자리로';
    rs.addEventListener('mousedown', function (e) { e.stopPropagation(); });
    rs.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    rs.onclick = function (e) { e.stopPropagation(); e.preventDefault(); HP.reset(key); };
    el.appendChild(rs);
    el.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      var r = el.getBoundingClientRect(), L = layer().getBoundingClientRect(), k = L.width / (layer().clientWidth || 1600) || 1;
      drag = { el: el, key: key, sx: e.clientX, sy: e.clientY, x0: (r.left - L.left) / k, y0: (r.top - L.top) / k, k: k, id: e.pointerId, moved: false };
    });
    // 끌었으면 누르기(해도 열기)는 하지 않는다
    el.addEventListener('click', function (e) { if (el._hpMoved) { e.stopPropagation(); e.preventDefault(); el._hpMoved = false; } }, true);
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); e.stopPropagation(); HP.reset(key); });
    requestAnimationFrame(function () { place(p); });
    place(p);
    return el;
  };
  // 끌기 — 판이 여러 번 새로 생겨도 창의 듣개는 하나만
  window.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var el = drag.el, dx = (e.clientX - drag.sx) / drag.k, dy = (e.clientY - drag.sy) / drag.k;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
    if (!drag.moved) { drag.moved = true; el.classList.add('hp-drag'); }
    var sz = size(), w = el.offsetWidth, h = el.offsetHeight;
    var x = Math.max(0, Math.min(sz.w - w, drag.x0 + dx)), y = Math.max(MIN_VIS, Math.min(sz.h - h, drag.y0 + dy));
    el.style.left = Math.round(x) + 'px'; el.style.top = Math.round(y) + 'px'; el.style.right = 'auto'; el.style.bottom = 'auto';
    el.classList.add('hp-moved');
    e.preventDefault();
  });
  function end(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    var el = drag.el;
    if (drag.moved) {
      var sz = size();
      put(drag.key, { x: (parseFloat(el.style.left) || 0) / sz.w, y: (parseFloat(el.style.top) || 0) / sz.h });
      el.classList.remove('hp-drag'); el._hpMoved = true;
      setTimeout(function () { el._hpMoved = false; }, 400);
    }
    drag = null;
  }
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
  window.addEventListener('resize', function () { setTimeout(HP.fit, 60); });
})(window.G = window.G || {});
