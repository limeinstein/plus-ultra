/* UI framework: HUD, promise-based dialogs, windows, choices, number input, toasts. */
(function (G) {
  'use strict';
  var U = G.U;
  var UI = {};
  G.UI = UI;
  var root, screenEl, modalRoot, toastEl, hudEl, fadeEl;
  var keyHandlers = [];

  // ---------------------------------------------------------------- keyboard bindings
  // 저장 파일마다 바꿀 수 있는 공통 키. code를 저장해 한글/영문 입력 상태와 무관하게 같은 물리 키를 쓴다.
  var KEY_DEFAULTS = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', confirm: 'Enter', confirmAlt: 'Space', cancel: 'Escape', speedHalf: 'Backquote', speed1: 'Digit1', speed2: 'Digit2', speed3: 'Digit3', mouseFollow: 'ShiftLeft' };
  var KEY_ACTIONS = [
    { id: 'up', label: '위', desc: '메뉴 위 · 거리 건물 입장 · 바다/육상/해전 북쪽' },
    { id: 'down', label: '아래', desc: '메뉴 아래 · 바다/육상/해전 남쪽' },
    { id: 'left', label: '왼쪽', desc: '메뉴/거리 왼쪽 · 바다/육상/해전 서쪽' },
    { id: 'right', label: '오른쪽', desc: '메뉴/거리 오른쪽 · 바다/육상/해전 동쪽' },
    { id: 'confirm', label: '확정', desc: '선택 · 입항/도시 입장' },
    { id: 'confirmAlt', label: '확정 보조/정지', desc: '메뉴 선택 · 이동 중 정지' },
    { id: 'cancel', label: '취소', desc: '창 닫기 · 건물 나오기' },
    { id: 'speedHalf', label: '해상 속도 ×0.5', desc: '해상 배속 0.5 (천천히)' },
    { id: 'speed1', label: '해상 속도 ×1', desc: '해상 배속 1' },
    { id: 'speed2', label: '해상 속도 ×2', desc: '해상 배속 2' },
    { id: 'speed3', label: '해상 속도 ×4', desc: '해상 배속 4' },
    { id: 'mouseFollow', label: '마우스 따라가기', desc: '바다·육상 탐험에서 켬/끔 (기본 SHIFT — 왼쪽·오른쪽 모두)' }
  ];
  function keySettings(s) {
    s = s || (G.Game && G.Game.state && G.Game.state.settings);
    if (!s) return KEY_DEFAULTS;
    var k = s.keys || (s.keys = {});
    Object.keys(KEY_DEFAULTS).forEach(function (id) { if (!k[id]) k[id] = KEY_DEFAULTS[id]; });
    return k;
  }
  function eventCode(e) {
    if (e && e.code === 'NumpadEnter') return 'Enter';   // 숫자판 Enter도 Enter로 — 확정이 먹지 않던 것 (QA 2026-10-23)
    if (e && e.code) return e.code;
    var k = e && e.key;
    if (k === ' ') return 'Space';
    if (k === 'Esc') return 'Escape';
    if (/^[0-9]$/.test(k || '')) return 'Digit' + k;
    return k || '';
  }
  function keyIs(e, action) {
    var keys = keySettings(), code = eventCode(e);
    if (code === keys[action]) return true;
    // 확정 키를 다른 키로 바꿨어도 숫자판 Enter는 확정으로 받는다 — 다른 동작이 Enter를 쓰지 않을 때만 (QA 2026-10-23)
    if (action === 'confirm' && e && e.code === 'NumpadEnter') return !Object.keys(keys).some(function (id) { return keys[id] === 'Enter'; });
    return false;
  }
  function keyLabel(code) {
    var names = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Enter: 'ENTER', Space: 'SPACE', Escape: 'ESC', ShiftLeft: '왼쪽 SHIFT', ShiftRight: '오른쪽 SHIFT', Backquote: '`' };
    if (names[code]) return names[code];
    if (/^Digit[0-9]$/.test(code)) return code.slice(5);
    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    if (/^Numpad/.test(code)) return 'NUM ' + code.slice(6);
    return String(code || '').replace(/Left$/, ' (왼쪽)').replace(/Right$/, ' (오른쪽)');
  }
  G.Keys = {
    actions: KEY_ACTIONS,
    defaults: function () { var o = {}; Object.keys(KEY_DEFAULTS).forEach(function (k) { o[k] = KEY_DEFAULTS[k]; }); return o; },
    ensure: keySettings,
    code: eventCode,
    is: keyIs,
    label: function (action, settings) { return keyLabel(keySettings(settings)[action]); },
    bind: function (settings, action, code) {
      var keys = keySettings(settings), old = keys[action], other = null;
      Object.keys(keys).some(function (id) { if (id !== action && keys[id] === code) { other = id; return true; } return false; });
      keys[action] = code;
      if (other) keys[other] = old;
    },
    reset: function (settings) { settings.keys = this.defaults(); return settings.keys; }
  };

  // ---------------------------------------------------------------- 마우스 따라가기 · 조작 감도 (바다·육상 탐험)
  // 마우스 따라가기는 기본 끔(s.settings.mouseFollow — 옛 저장에는 없으니 끔). 켜면 가려는 쪽을 한 번 눌러야 따라가기 시작하고,
  // 그 뒤로는 마우스를 옮기는 대로 뱃머리·발걸음이 돈다. 끄면 누른 곳까지 간다(예전처럼).
  var SENS_DEF = { seaDeadPx: 50, landDeadPx: 40, seaTurn: 1.5, landTurn: 3.5, deadDeg: 6, arrowK: 1, leadK: 1 };
  function gameSettings() { var g = G.Game && G.Game.state; return g && g.settings; }
  G.Ctrl = {
    follow: function () { var st = gameSettings(); return !!(st && st.mouseFollow); },
    setFollow: function (v) { var st = gameSettings(); if (st) st.mouseFollow = !!v; },
    /** 켬/끔을 바꾸고 알린다. 바뀐 값을 돌려준다 */
    toggle: function () {
      var v = !this.follow(); this.setFollow(v);
      var k = keyLabel(keySettings().mouseFollow).replace(/^(왼쪽|오른쪽) /, '');
      UI.toast(v ? '마우스 따라가기 켬 — 가려는 쪽을 한 번 누르면, 그 뒤로는 마우스를 옮기는 대로 방향을 틉니다 (' + k + '로 끔)'
                 : '마우스 따라가기 끔 — 누른 곳까지 갑니다 (' + k + '로 켬)', 'target', 4200);
      return v;
    },
    /** 마우스 따라가기 단축키인가 (기본 왼쪽 SHIFT면 오른쪽 SHIFT도 받는다 · 누르고 있는 동안 되풀이되는 신호는 무시) */
    isToggleKey: function (e) {
      if (!e || e.repeat) return false;
      var c = eventCode(e), b = keySettings().mouseFollow;
      return c === b || (b === 'ShiftLeft' && c === 'ShiftRight');
    },
    sensId: function () { var st = gameSettings(), v = st && st.ctrlSens; return v === 'slow' || v === 'fast' ? v : 'normal'; },
    /** 항구·성문 곁을 지날 때: 'notify' 알림만(기본 — 창을 띄우지 않고 Enter·단추로 들어간다) · 'stop' 멈춰 섰을 때만 묻기 · 'ask' 언제나 묻기(예전) */
    portAsk: function () { var st = gameSettings(), v = st && st.portAsk; return v === 'stop' || v === 'ask' ? v : 'notify'; },
    /** 맞바람 지그재그 (자동항해·침로 · js/scenes/sea.js move): 'off' 곧게(기본 — 다가가는 빠르기는 지그재그와 같다) · 'open' 먼바다에서만 · 'on' 언제나(예전) */
    tackMode: function () { var st = gameSettings(), v = st && st.tackMode; return v === 'open' || v === 'on' ? v : 'off'; },
    sens: function () { var B = (G.BALANCE || {}).ctrlSens || {}; return B[this.sensId()] || B.normal || SENS_DEF; },
    /** 단추의 모양 (켬이면 빛난다) */
    paintButton: function (b) {
      if (!b) return; var on = this.follow(); if (b._on === on) return;
      b._on = on; b.classList.toggle('on', on);
      b.innerHTML = G.icon('target') + '마우스 따라가기<small class="tog">' + (on ? '켬' : '끔') + '</small>';
      b.title = (on ? '켜짐: 가려는 쪽을 한 번 누르면 그 뒤로는 마우스를 옮기는 대로 방향을 틉니다' : '꺼짐: 누른 곳까지 갑니다') + ' — 단축키 ' + keyLabel(keySettings().mouseFollow);
    },
    /** 하단 메뉴가 화면보다 넓으면(작은 화면 · 큰 글씨 · 긴 항구 이름) 통째로 줄여 넣는다 */
    fitBar: function (bar) {
      if (!bar || !bar.parentNode) return;
      // 바다·뭍 화면이 6프레임마다 불러 너비를 다시 재던 것 — 단추 글·보임·창 크기가 그대로면 건너뛴다 (QA 2026-10-23)
      var sig = window.innerWidth + 'x' + window.innerHeight + '|' + (document.fonts ? document.fonts.status : '') + '|' + bar.parentNode.style.zoom;
      for (var ci = 0; ci < bar.children.length; ci++) { var ch = bar.children[ci]; sig += '|' + ch.style.display + ':' + ch.className + ':' + ch.textContent; }
      if (bar._sig === sig) return;
      var pw = bar.parentNode.clientWidth, w = bar.offsetWidth; if (!pw || !w) return;
      bar._sig = sig;
      var k = w > pw - 16 ? Math.round((pw - 16) / w * 1000) / 1000 : 1;
      if (bar._k === k) return; bar._k = k;
      bar.style.transformOrigin = '50% 100%'; bar.style.transform = k < 1 ? 'translateX(-50%) scale(' + k + ')' : '';
    }
  };

  /* 전체 화면 (UI.fs, 2026-10-17)
     브라우저의 F11 전체 화면은 마우스를 맨 위로 올리면 브라우저의 탭·주소창이 내려온다 — 브라우저 기능이라 게임이 막을 수 없다.
     게임이 직접 켜는 웹 전체 화면(requestFullscreen)에서는 내려오지 않는다. 그래서 F11을 누르면 이쪽으로 켜고 끈다(설정 창에도 단추).
     크롬·엣지에서는 Esc를 게임이 그대로 쓰도록 키보드를 잡아 둔다(navigator.keyboard.lock) — 전체 화면을 끄려면 F11이나 Esc를 길게.
     게임이 다른 페이지 안에 들어 있어 전체 화면을 허락받지 못했으면(아티팩트 등) F11은 브라우저에 그대로 맡긴다. */
  var FS = UI.fs = {};
  FS.on = function () { return !!(document.fullscreenElement || document.webkitFullscreenElement); };
  FS.can = function () { var d = document.documentElement; return !!(d.requestFullscreen || d.webkitRequestFullscreen) && document.fullscreenEnabled !== false && document.webkitFullscreenEnabled !== false; };
  FS.locked = false;
  function fsLock() {
    FS.locked = false;
    try { if (navigator.keyboard && navigator.keyboard.lock) navigator.keyboard.lock(['Escape', 'F11']).then(function () { FS.locked = true; }, function () {}); } catch (e) { /* 키보드를 잡지 못하는 브라우저 */ }
  }
  FS.enter = function () {
    var d = document.documentElement, f = d.requestFullscreen || d.webkitRequestFullscreen;
    if (!f || !FS.can()) return Promise.resolve(false);
    try { return Promise.resolve(f.call(d, { navigationUI: 'hide' })).then(function () { fsLock(); return true; }, function () { return false; }); }
    catch (e) { return Promise.resolve(false); }
  };
  FS.exit = function () {
    try { if (navigator.keyboard && navigator.keyboard.unlock) navigator.keyboard.unlock(); } catch (e) { /* */ }
    FS.locked = false;
    var f = document.exitFullscreen || document.webkitExitFullscreen;
    return f && FS.on() ? Promise.resolve(f.call(document)).catch(function () {}) : Promise.resolve();
  };
  FS.toggle = function () { return FS.on() ? FS.exit() : FS.enter(); };
  // F11: 브라우저 전체 화면 대신 게임 전체 화면 (다른 키 처리보다 먼저)
  window.addEventListener('keydown', function (e) {
    if ((e.key === 'F11' || e.code === 'F11') && !e.repeat && FS.can()) { e.preventDefault(); e.stopPropagation(); FS.toggle(); }
  }, true);
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) {
    document.addEventListener(ev, function () {
      if (FS.on()) setTimeout(function () { if (FS.on() && UI.toast) UI.toast('전체 화면 — 끄려면 F11' + (FS.locked ? ' 또는 Esc를 길게' : ' 또는 Esc'), 'info', 3200); }, 250);
      else { try { if (navigator.keyboard && navigator.keyboard.unlock) navigator.keyboard.unlock(); } catch (e) { /* */ } FS.locked = false; }
      document.dispatchEvent(new CustomEvent('pu-fullscreen', { detail: { on: FS.on() } }));
    });
  });

  UI.init = function () {
    root = document.getElementById('ui');
    screenEl = U.el('div', 'layer'); screenEl.id = 'screen'; screenEl.style.pointerEvents = 'none';
    root.appendChild(screenEl);
    hudEl = U.el('div', 'hud wood hidden'); root.appendChild(hudEl);
    modalRoot = U.el('div', 'layer'); modalRoot.style.pointerEvents = 'none'; modalRoot.style.zIndex = 60; root.appendChild(modalRoot);
    toastEl = U.el('div', 'toasts'); root.appendChild(toastEl);
    fadeEl = U.el('div', 'fade-black'); root.appendChild(fadeEl);
    document.addEventListener('keydown', function (e) { if (routeKey(e)) e.preventDefault(); });
    // 우클릭은 Esc와 같은 "돌아간다" 입력이다. 선택 대화에서는 떠나고, 창은 닫고,
    // 건물 기본 메뉴에서는 그 건물을 나온다. 아무도 받지 않은 우클릭은 브라우저 메뉴를 그대로 둔다.
    document.addEventListener('contextmenu', function (e) {
      var cancelCode = keySettings().cancel;
      var cancel = { key: cancelCode === 'Space' ? ' ' : cancelCode, code: cancelCode, target: e.target, repeat: false, originalEvent: e };
      if (routeKey(cancel) || UI.busy()) e.preventDefault();
    });
  };
  function routeKey(e) {
    for (var i = keyHandlers.length - 1; i >= 0; i--) if (keyHandlers[i](e) === true) return true;
    if (screenMenuKey(e)) return true;
    return !!(G.Game && G.Game.onKey && G.Game.onKey(e) === true);
  }
  function pushKey(fn) { keyHandlers.push(fn); return function () { var i = keyHandlers.indexOf(fn); if (i >= 0) keyHandlers.splice(i, 1); }; }
  UI.pushKey = pushKey;

  /** screen-level container (cleared per mode) */
  UI.screen = function () { return screenEl; };
  UI.clearScreen = function () { screenEl.innerHTML = ''; };
  UI.add = function (el) { el.style.pointerEvents = 'auto'; screenEl.appendChild(el); return el; };
  UI.busy = function () { return modalRoot.children.length > 0; };

  function usable(el) { return !!(el && el.isConnected && !el.classList.contains('dis') && !el.classList.contains('disabled') && !el.disabled && el.offsetParent !== null); }
  function selectKeyItem(items, current, step) {
    items = items.filter(usable); if (!items.length) return null;
    var i = items.indexOf(current); if (i < 0) i = step < 0 ? 0 : -1;
    i = (i + step + items.length) % items.length;
    items.forEach(function (x) { x.classList.remove('kbd-focus'); });
    var el = items[i]; el.classList.add('kbd-focus');
    if (el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
    return el;
  }
  /** 거리(마을 풍경)가 보이는 동안: 방향키·Enter는 제독이 쓴다 (←→ 걷기 · ↑/Enter 건물에 들어가기 — js/scenes/town.js).
      오른쪽 건물 메뉴는 마우스로 누른다 — 예전엔 ↑↓가 메뉴와 제독을 함께 움직여 ↑로 건물에 들어갈 수 없었다 */
  function townKeys() { return !!(G.Town && G.Town.active && G.Town.active() && !G.Town.hidden()); }
  UI.townKeys = townKeys;
  /** 화면 오른쪽 명령 메뉴: ↑↓로 고르고 Enter/Space로 실행. 장면의 이동키보다 먼저 받는다 (거리에서는 제외). */
  function screenMenuKey(e) {
    if (!screenEl || UI.busy() || townKeys()) return false;
    var menu = screenEl.querySelector('.cmdmenu'); if (!menu || menu.classList.contains('talk-hidden')) return false;
    var items = Array.prototype.slice.call(menu.querySelectorAll('.cmd'));
    var cur = menu.querySelector('.cmd.kbd-focus');
    if (keyIs(e, 'up')) { selectKeyItem(items, cur, -1); return true; }
    if (keyIs(e, 'down')) { selectKeyItem(items, cur, 1); return true; }
    if (keyIs(e, 'confirm') || keyIs(e, 'confirmAlt')) { cur = cur || selectKeyItem(items, null, 1); if (cur) cur.click(); return true; }
    return false;
  }

  // ---------------------------------------------------------------- HUD
  UI.hud = {
    show: function (cells) {
      hudEl.classList.remove('hidden');
      var h = '<svg class="emb" viewBox="0 0 48 48">' + emblemSvg() + '</svg>';
      cells.forEach(function (c) {
        if (c.grow) { h += '<div class="grow"></div>'; return; }
        // label이 있으면 두 줄 칸 (작은 이름 + 값) — 대항해시대 3의 윗줄 상태 표시처럼
        if (c.label) h += '<div class="cell two' + (c.cls ? ' ' + c.cls : '') + '" data-k="' + (c.k || '') + '"' + (c.tip ? ' title="' + U.esc(c.tip) + '"' : '') + '>' + (c.icon ? G.icon(c.icon) : '') + '<div class="tv"><em>' + c.label + '</em><span>' + (c.text || '') + '</span></div></div>';
        else h += '<div class="cell' + (c.cls ? ' ' + c.cls : '') + '" data-k="' + (c.k || '') + '">' + (c.icon ? G.icon(c.icon) : '') + '<span>' + c.text + '</span></div>';
      });
      hudEl.innerHTML = h;
      hudEl.classList.toggle('dense', cells.length > 9);
      fitHud();
      // 칸을 한 번만 찾아 두고(hud.set 이 하루에도 열 번 넘게 불린다), 값이 그대로면 DOM을 건드리지 않는다
      hudCells = {};
      Array.prototype.forEach.call(hudEl.querySelectorAll('[data-k]'), function (c) {
        var k = c.getAttribute('data-k'); if (!k || hudCells[k]) return;
        var sp = c.querySelector('span');
        hudCells[k] = { cell: c, span: sp, em: c.querySelector('em'), text: sp ? sp.innerHTML : '', warn: false, tip: c.title || '' };
      });
    },
    /** 칸에 마우스를 올리면 보이는 설명 */
    tip: function (k, text) { var c = hudCells[k]; text = text || ''; if (c && c.tip !== text) { c.tip = text; c.cell.title = text; } },
    /** 칸의 작은 이름 */
    label: function (k, text) { var c = hudCells[k]; if (c && c.em && c.label !== text) { c.label = text; c.em.innerHTML = text; } },
    hide: function () { hudEl.classList.add('hidden'); },
    set: function (k, text, warn) {
      var c = hudCells[k]; if (!c || !c.span) return;
      text = String(text); warn = !!warn;
      if (c.text !== text) { var grew = text.length !== c.text.length; c.text = text; c.span.innerHTML = text; if (grew) fitHudSoon(); }
      if (c.warn !== warn) { c.warn = warn; c.span.parentNode.classList.toggle('val-warn', warn); }
    }
  };
  var hudCells = {};
  /* 윗줄 상태 표시가 화면 너비를 넘으면 (글씨·창 크기를 키웠을 때) 윗줄만 알맞게 줄여 다 보이게 한다 — 소지금·직위가 잘리지 않게 (UI QA 2026-10-11 #1) */
  function fitHud() {
    if (!hudEl || hudEl.classList.contains('hidden')) return;
    hudEl.style.zoom = '';
    var need = hudEl.scrollWidth, have = hudEl.clientWidth;
    if (have > 0 && need > have + 1) hudEl.style.zoom = Math.max(0.6, have / need * 0.985).toFixed(3);   // 글꼴이 늦게 읽혀 폭이 조금 바뀌어도 넘치지 않게 1.5% 여유
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fitHud(); });
  var hudFitPending = false;
  function fitHudSoon() { if (hudFitPending) return; hudFitPending = true; requestAnimationFrame(function () { hudFitPending = false; fitHud(); }); }
  UI.fitHud = fitHud;
  function emblemSvg() {
    return '<defs><radialGradient id="embg" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#5a4128"/><stop offset="1" stop-color="#1c130b"/></radialGradient></defs>' +
      '<circle cx="24" cy="24" r="22" fill="url(#embg)" stroke="#b8925a" stroke-width="1.5"/>' +
      '<circle cx="24" cy="24" r="17" fill="none" stroke="#7a5c33" stroke-width="1"/>' +
      '<path d="M24 5l2.6 16.4L43 24l-16.4 2.6L24 43l-2.6-16.4L5 24l16.4-2.6z" fill="#d9b45f" stroke="#7a5c33" stroke-width=".8"/>' +
      '<path d="M24 12l1.2 10.8L36 24l-10.8 1.2L24 36l-1.2-10.8L12 24l10.8-1.2z" fill="#2a1f16" opacity=".55"/>' +
      '<circle cx="24" cy="24" r="2.2" fill="#f2e2b6"/>';
  }
  UI.emblemSvg = emblemSvg;

  // ---------------------------------------------------------------- toasts
  /** icon: 아이콘 이름, 또는 {src: 그림 주소, icon: 그림이 없을 때 아이콘} — 물건을 얻었을 때 그 물건 그림 */
  UI.toast = function (text, icon, ms) {
    var lead = icon && typeof icon === 'object' ? (icon.src ? '<img class="toast-pic" src="' + icon.src + '" alt="">' : G.icon(icon.icon || 'chest')) : G.icon(icon || 'rose');
    var t = U.el('div', 'toast wood', lead + '<div>' + text + '</div>');
    toastEl.appendChild(t);
    // 알림이 쌓여 대화 중 인물·대화창을 덮지 않게: 평소 3개, 대화 중에는 2개까지만 (오래된 것부터 걷는다). 대화 중에는 오른쪽 위로 비켜 작게 (css #ui.talking .toasts)
    var talkingNow = !!document.querySelector('.dlg-stage, .dlg'), maxT = talkingNow ? 2 : 3;
    while (toastEl.children.length > maxT) toastEl.removeChild(toastEl.firstChild);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 520); }, ms || 3200);
  };

  /* 검은 막을 덮고 fn 을 한 뒤 다음 장면이 그려지면 걷는다. fn 이 오래 걸리면(G.FX.loader.fadeAfter ms) 검은 막 위에 불러오는 그림을 작게 (js/ui/loader.js) */
  UI.fade = function (fn) {
    return new Promise(function (resolve) {
      fadeEl.classList.add('on');
      setTimeout(function () {
        var LD = G.Loader, mine = false, lt = setTimeout(function () { if (LD && !LD.shown()) { mine = true; LD.show('', { dim: true }); } }, (((G.FX && G.FX.loader) || {}).fadeAfter) || 350);
        Promise.resolve(fn && fn()).then(function () {
          // 새 장면의 첫 화면이 검은 막 뒤에서 그려진 다음에 걷는다 (막을 걷은 뒤 멈칫하지 않게)
          requestAnimationFrame(function () { requestAnimationFrame(function () {
            clearTimeout(lt); if (mine && LD) LD.hide();
            setTimeout(function () { fadeEl.classList.remove('on'); resolve(); }, 60);
          }); });
        });
      }, 300);    // 검은 막이 다 덮을 때까지 (css .fade-black 의 transition 과 같게)
    });
  };

  // ---------------------------------------------------------------- language garbling
  /** turns text partially into ×× depending on language level (0..3) */
  UI.garble = function (text, level) {
    if (level >= 3) return text;
    var rng = U.makeRng(U.strHash(text));
    var keep = [0, 0.35, 0.7][Math.max(0, level)];
    return text.replace(/[가-힣A-Za-z0-9]+/g, function (w) {
      if (rng() < keep) return w;
      return '<span class="garble">' + w.replace(/./g, '×') + '</span>';
    });
  };

  // ---------------------------------------------------------------- 낯선 말과 통역 (G.Tongues)
  /** 대화 본문 HTML과, 통역이 있으면 대화창 아래 작은 통역 창을 붙인다. box = .dlg, raw = 원문 한 쪽 */
  /* 대화 글에 섞어 쓰는 꾸밈 태그(b·i·em·strong·u·small·sub·sup·br, class만 단 span)는 살리고 나머지는 글자 그대로 보인다 —
     예전엔 모두 글자로 나와 흥정 물음 같은 데서 <b>·<br>·<span class="muted">가 그대로 보였다 (2026-10-17). 이름 속 < > 는 안전하게 글자로. */
  var SAFE_TAG = /&lt;(\/?)(b|i|em|strong|u|small|sub|sup|br|span)((?:\s+class=&quot;[\w\- ]*&quot;)?)\s*\/?&gt;/g;
  function richEsc(t) {
    return U.esc(t).replace(SAFE_TAG, function (m, sl, tag, cls) { return '<' + sl + tag + (cls && !sl ? cls.replace(/&quot;/g, '"') : '') + '>'; }).replace(/\n/g, '<br>');
  }
  UI.richEsc = richEsc;
  /** 태그를 걷어 낸 맨글 (낯선 말로 흐리게 들리는 글에는 꾸밈을 싣지 않는다) */
  function bareText(t) { return String(t == null ? '' : t).replace(/<br\s*\/?>/gi, '\n').replace(/<\/?(b|i|em|strong|u|small|sub|sup|span)(\s[^>]*)?>/gi, ''); }
  function speech(box, raw, opts) {
    var TG = G.Tongues, sit = TG ? TG.situation(opts) : { plain: true };
    var old = box.querySelector('.interp'); if (old) old.parentNode.removeChild(old);
    box.style.bottom = '';
    var mime = G.Tale && G.Tale.mime ? G.Tale.mime(raw, opts) : null;    // 아직 말을 모르는 인어공주: 몸짓으로 (js/systems/fairytales.js)
    if (mime) { box.classList.remove('withinterp'); return mime; }
    if (sit.plain) return richEsc(raw);
    raw = bareText(raw);
    var html = TG.heard(raw, sit.own, sit.li);
    if (sit.team > sit.own && sit.mate) {
      var sub = U.el('div', 'interp parch');
      var who = (sit.mate.role === 'interp' ? '통역' : sit.mate.role === 'room' ? '통역실' : '부관') + ' ' + sit.mate.name;
      var how = sit.team >= 3 ? '' : sit.team === 2 ? ' <small>(대강 알아들음)</small>' : ' <small>(띄엄띄엄 알아들음)</small>';
      sub.innerHTML = '<div class="ipf"></div><div class="itext"><div class="iname">' + U.esc(who) + how + '</div>' + TG.relay(raw, sit.own, sit.team) + '</div>';
      try { var pc = G.Art.portraitCanvas(G.Scenes.mateSpec(sit.mate.id), 56); sub.querySelector('.ipf').appendChild(pc); } catch (e) { sub.querySelector('.ipf').style.display = 'none'; }
      box.appendChild(sub);
      box.classList.add('withinterp');
      requestAnimationFrame(function () { box.style.bottom = (34 + sub.offsetHeight + 14) + 'px'; });
      box.style.bottom = (34 + 96) + 'px';
    } else box.classList.remove('withinterp');
    return html;
  }
  /** 낯선 말을 하는 화자는 늘 얼굴을 보인다 — 초상이 없으면 지금 도시(없으면 그 말의 고장) 양식의 마을 사람 얼굴을 만든다 */
  var LI_STYLE = ['ib', 'ib', 'it', 'ne', 'ru', 'is', 'pe', 'cn', 'in', 'st', 'af', 'az', 'se', 'jp', 'kr', 'na'];
  function withFace(opts) {
    if (!opts || opts.portrait || opts.li == null || opts.noFace) return opts;
    var S = G.Game && G.Game.state, c = S && S.loc && S.loc.mode === 'city' ? G.CITY_DATA[S.loc.city] : null;
    var style = c && c.lang === opts.li ? c.style : LI_STYLE[opts.li] || 'ib', o = {}, k;
    for (k in opts) o[k] = opts[k];
    try { o.portrait = G.Art.npcSpec('spk:' + (opts.name || '') + ':' + style, 'merchant', style); } catch (e) { return opts; }
    return o;
  }
  UI.withFace = withFace;

  // ---------------------------------------------------------------- 지난번 선택 (골라야 하는 창은 기다리되, 지난번에 고른 것을 표시해 둔다)
  /** 같은 물음인지: 말하는 사람 + 선택지 이름들 + 물음의 앞부분(숫자는 뺌 — 값·날짜가 달라도 같은 사건) */
  function pickKey(text, list, opts) {
    var q = String(text || '').replace(/[0-9,.]+/g, '#').slice(0, 40);
    return U.strHash(((opts && (opts.name || opts.title)) || '') + '|' + q + '|' + list.map(function (o) { return String(o.label).replace(/<[^>]+>/g, '').replace(/[0-9,.]+/g, '#'); }).join('/'));
  }
  function pickStore() { var S = G.Game && G.Game.state; if (!S) return null; return S.lastPick || (S.lastPick = {}); }
  function lastPick(k) { var m = pickStore(); return m ? m[k] : null; }
  function rememberPick(k, label) { var m = pickStore(); if (!m) return; m[k] = label; var ks = Object.keys(m); if (ks.length > 300) delete m[ks[0]]; }
  UI.pickKey = pickKey;

  /* 항해 중 사건의 저절로 넘기기 (2026-10-20): 폭풍·바다의 사건·해일·맞바람처럼 항해 중에 생기는 일은 처음에는 답을 기다리고,
     같은 말·같은 물음이 두 번째부터는 ms(5초) 동안 아무 입력이 없으면 지난번처럼 저절로 넘어간다 (물음은 지난번에 고른 것).
     UI.autoRun(fn) 안에서 열린 UI.say·UI.ask만 해당한다. 단추를 누르거나 키를 누르면 기다리던 셈을 멈추고 그 입력을 따른다.
     저장: s.autoSeen (본 말), 고른 것은 s.lastPick (pickKey). 조정값 G.BALANCE.seaAuto {on, ms} */
  var autoDepth = 0;
  function autoCfg() { var b = (G.BALANCE && G.BALANCE.seaAuto) || {}; return { on: b.on !== false, ms: b.ms || 5000 }; }
  function autoOn() { return autoDepth > 0 && autoCfg().on && !!(G.Game && G.Game.state); }
  UI.autoRun = async function (fn) { autoDepth++; try { return await fn(); } finally { autoDepth--; } };
  UI.autoActive = autoOn;
  function sayKey(text, opts) { if (opts && opts.autoKey) return 'k:' + opts.autoKey; return U.strHash(((opts && opts.name) || '') + '|' + String(text || '').replace(/<[^>]+>/g, '').replace(/[0-9,.]+/g, '#').slice(0, 60)); }
  function seenStore() { var S = G.Game && G.Game.state; if (!S) return null; return S.autoSeen || (S.autoSeen = {}); }
  function normLabel(l) { return String(l == null ? '' : l).replace(/<[^>]+>/g, '').replace(/[0-9,.]+/g, '#'); }
  /** 셈하는 띠: n초 뒤 cb. 돌려준 함수를 부르면 멈춘다 */
  function autoTimer(box, label, cb, hint) {
    var ms = autoCfg().ms, t0 = Date.now(), bar = U.el('div', 'auto-left', '');
    box.appendChild(bar);
    function tick() {
      var left = Math.max(0, Math.ceil((ms - (Date.now() - t0)) / 1000));
      bar.innerHTML = '⏳ ' + left + '초 뒤 ' + label + ' <span class="muted">(' + (hint || '누르면 직접 고른다') + ')</span>';
      if (Date.now() - t0 >= ms) { stop(); cb(); }
    }
    var iv = setInterval(tick, 200); tick();
    function stop() { clearInterval(iv); if (bar.parentNode) bar.parentNode.removeChild(bar); }
    return stop;
  }

  function copyOpts(a, extra) {
    var o = {}, k;
    for (k in (a || {})) o[k] = a[k];
    for (k in (extra || {})) o[k] = extra[k];
    return o;
  }

  function portraitNode(who, size) {
    if (!who || !who.portrait) return null;
    return who.portrait instanceof HTMLCanvasElement ? who.portrait : G.Art.portraitCanvas(who.portrait, size);
  }

  // ---------------------------------------------------------------- 대화창 위에 서는 사람들
  /* 무릎상(머리부터 무릎까지 서 있는 그림)은 대화창 윗변에 발을 딛고 선다.
     · 두 사람(duo): 왼쪽 사람은 그림 왼쪽 끝이 대화창 왼쪽 끝에, 오른쪽 사람은 그림 오른쪽 끝이 대화창 오른쪽 끝에 맞는다.
     · 구도는 하나: 어디서든 말하는 사람은 제독(왼쪽)과 마주 선다(오른쪽). 제독 혼잣말은 방금 마주 선 사람과, 없으면 제독만 왼쪽에.
     · 바다·뭍(탐험·해전)에서는 무릎상 대신 두 사람 얼굴(액자 흉상)만. 특별한 사건(가족·연인·부하끼리 썸·왕녀 — isSpecial)만 무릎상.
     · 도서관(책 보기)·술집(이야기)만 예전 구도 — 혼자 가운데(G.FX.stand.soloCity)·대화창 안 얼굴 칸이 그 자리에 맞게 섞인다 (keepScene)
     · 무릎상과 얼굴(흉상)을 섞지 않는다: 두 사람 다 무릎상이 있어야 무릎상, 한 사람이라도 없거나 파일을 못 읽으면 둘 다 얼굴.
     · 그림은 화면 UI(도시 이름판·건물 메뉴·HUD·아래 단추줄)보다 아래 층(.dlg-actors, z 13)에 그려 UI를 가리지 않는다.
       이름표만 대화창 층에 두어 눌러서 인물 이야기를 볼 수 있게 한다. */
  function standFx() {
    var d = { top: 60, sink: 6, aspect: 0.6667, minH: 360, maxH: 640, fitMax: 1.2, bustW: 260, bustH: 260, soloCity: true, npcDuo: true }, f = (G.FX && G.FX.stand) || {}, o = {}, k;
    for (k in d) o[k] = f[k] == null ? d[k] : f[k];
    return o;
  }
  /* 무릎상의 머리끝 자리 (그림 높이에 대한 비율, 0 = 맨 위): 그림마다 머리 위 빈칸이 달라 같은 키로 세우면 제독이 작아 보였다
     (기본 제독 512×512는 13%, 다른 제독 그림 4%, 사람들 1024×1536은 1% 안팎). 그림의 투명한 윗부분을 재고,
     픽셀을 못 읽으면(file://) 아래 표 · 없으면 1%로 본다. 두 사람이 마주 서면 머리끝을 맞춰 키를 고른다 (dialogShell layout) */
  var STAND_TOP = { 'characters/player_half': 0.133, 'characters/player_half_ganghui': 0.008, 'characters/player_half_sea_dog': 0.008, 'characters/player_half_sea_dog_old': 0.008, 'characters/player_half_hat_spinner': 0, 'characters/player_half_hat_spinner_old': 0 }, topMemo = {};
  function figureTop(img, key) {
    if (topMemo[key] != null) return topMemo[key];
    var t = null;
    try {
      var w = 48, h = Math.max(8, Math.round(48 * img.naturalHeight / img.naturalWidth)), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      var g = cv.getContext('2d'); g.drawImage(img, 0, 0, w, h);
      var d = g.getImageData(0, 0, w, h).data;
      for (var y = 0; y < h && t == null; y++) for (var x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) { t = y / h; break; }
    } catch (e) { t = null; }
    if (t == null) t = STAND_TOP[key] != null ? STAND_TOP[key] : /^characters\/player_half/.test(key) ? 0.039 : 0.01;
    return (topMemo[key] = t);
  }
  UI.figureTop = figureTop;   // 시험용
  /** 이 말하는 사람이 제독 자신인가 (초상·리그 이름·이름으로) */
  function isPlayer(who) {
    var S = G.Game && G.Game.state, p = S && S.player;
    return !!(p && who && (who.rigId === 'player' || (who.portrait && who.portrait === p.portrait) || (who.name && who.name === p.name)));
  }
  function halfKeyOf(who) {
    if (!who || who.noHalf || !G.Img || !G.Img.pick) return null;
    var chain = who.half;
    if (!chain && isPlayer(who) && G.Img.chain.heroHalf) chain = G.Img.chain.heroHalf();   // 제독은 생김새·나이에 맞는 무릎상
    if (!chain && who.portrait && !(who.portrait instanceof HTMLCanvasElement) && G.Art && G.Art.portraitKeys && G.Img.chain.halfFor) {
      try { chain = G.Img.chain.halfFor(who.portraitChain || G.Art.portraitKeys(who.portrait)); } catch (e) { chain = null; }
    }
    return chain && chain.length ? { chain: chain, key: G.Img.pick(chain) } : null;
  }
  var talking = 0, untalkTimer = 0, hiddenPanels = [];
  /* 같은 건물 안에서 마지막으로 마주 선 상대 — 제독이 혼자 고민하는 물음(「어떻게 할까?」)도 그 사람과 마주 선 구도로 보여 준다 */
  var lastPartner = null, storyPartner = null;   // storyPartner: 이야기 모드에서 지금 장면에 마주한 사람
  /** 건물 메뉴 밖(바다·뭍·창 위)에서: 방금(1분 안) 마주 선 사람 */
  function recentPartner() { var lp = lastPartner; return lp && Date.now() - lp.t < 60 * 1000 ? lp.who : null; }
  /** 도서관(책 보기)·술집(이야기)은 예전 구도를 그대로 쓴다 — 혼자 선 사람·대화창 안 얼굴 칸·마주 보기가 그 자리에 맞게 섞인다 */
  function keepScene() {
    var S = G.Game && G.Game.state, C = G.Scenes && G.Scenes.city;
    if (!S || !S.loc || S.loc.mode !== 'city' || !C || !C.current) return false;
    var cur = null; try { cur = C.current(); } catch (e) { cur = null; }
    return !!cur && (cur.kind === 'library' || cur.kind === 'tavern');
  }
  UI.keepScene = keepScene;
  /** 바다·뭍(탐험·해전 포함)에서는 두 사람 다 액자 흉상(얼굴)만 — 무릎상 두 사람은 특별한 사건에만 */
  function seaOrLand() { var S = G.Game && G.Game.state; return !!(S && S.loc && (S.loc.mode === 'sea' || S.loc.mode === 'land')); }
  /** 특별한 사건의 사람: who.special(부하끼리 썸·왕녀 등) 또는 제독의 가족(아내·둘째 부인·아이) */
  function isSpecial(who) {
    if (!who) return false;
    if (who.special) return true;
    var S = G.Game && G.Game.state, p = S && S.player, nm = who.name;
    if (!p || !nm || isPlayer(who)) return false;
    try {
      var names = [];
      if (p.wife && G.Family && G.Family.wifeName) names.push(G.Family.wifeName());
      if (G.Wives && G.Wives.name) (p.wives2 || []).forEach(function (w) { names.push(G.Wives.name(w)); });
      (p.kids || []).forEach(function (k) { if (k.name) names.push(k.name); });
      return names.some(function (n) { return n && (nm === n || nm.indexOf(n + ' (') === 0); });   // 아이 이름 뒤에 「(9세 · …)」가 붙기도 한다
    } catch (e) { return false; }
  }
  UI.isSpecial = isSpecial;
  function partnerFor(menu) {
    var lp = lastPartner;
    return lp && menu && lp.menu === menu && menu.isConnected && Date.now() - lp.t < 15 * 60 * 1000 ? lp.who : null;
  }
  /* 대화가 이어질 때(한마디 → 다음 한마디) 사이에 감춘 것이 잠깐 나타났다 사라지지 않게, 끝난 뒤 조금 기다렸다 되돌린다 */
  function setTalking(d) {
    talking = Math.max(0, talking + d);
    clearTimeout(untalkTimer);
    if (talking > 0) { if (root) root.classList.add('talking'); return; }
    untalkTimer = setTimeout(function () {
      if (talking > 0) return;
      if (root) root.classList.remove('talking');
      hiddenPanels.forEach(function (p) { p.classList.remove('talk-hidden'); }); hiddenPanels = [];
    }, 160);
  }
  /* 선 사람의 몸(그림 상자 가운데 60%)과 많이 겹치는 화면 패널(건물 메뉴·할 일·도시 이름판)은 대화하는 동안 감춘다 — 그림이 UI를 가리지도, UI 뒤에 사람이 묻히지도 않게 */
  var TALK_PANELS = '.cmdmenu, .todo, .city-banner, .fleetpanel';
  function hidePanelsUnder(rects) {
    if (!screenEl) return;
    [].forEach.call(screenEl.querySelectorAll(TALK_PANELS), function (p) {
      var r = stageRect(p), area = r.width * r.height, hit = 0;
      if (!area) return;
      rects.forEach(function (a) {
        var x1 = Math.max(r.left, a.left), x2 = Math.min(r.right, a.right), y1 = Math.max(r.top, a.top), y2 = Math.min(r.bottom, a.bottom);
        if (x2 > x1 && y2 > y1) hit += (x2 - x1) * (y2 - y1);
      });
      var hide = hit > Math.max(1500, area * 0.03);
      if (hide && hiddenPanels.indexOf(p) < 0) { p.classList.add('talk-hidden'); hiddenPanels.push(p); }
    });
  }
  /** 무대(1600×900) 좌표로 본 요소의 상자 */
  function stageRect(el) {
    var r = el.getBoundingClientRect(), R = root.getBoundingClientRect(), k = root.offsetWidth ? R.width / root.offsetWidth : 1;
    k = k || 1;
    return { left: (r.left - R.left) / k, top: (r.top - R.top) / k, right: (r.right - R.left) / k, bottom: (r.bottom - R.top) / k, width: r.width / k, height: r.height / k };
  }

  /** 대화 껍데기. duo(두 사람이 마주 봄)와 혼자 말하는 사람. */
  /* opts.noStand: 대화창 위에 사람을 세우지 않고 대화창 안의 얼굴만 (장면 그림을 가리지 않게 — js/systems/familyevent.js) */
  function dialogShell(back, opts, asking) {
    // 장면 그림(옛이야기·전설 — js/systems/familyevent.js scenepic-on)이 떠 있는 동안: 사람을 그림 앞에 세우지 않는다
    if (root && root.classList.contains('scenepic-on') && !opts.noStand) opts = Object.assign({}, opts, { noStand: true, layout: null, partner: null });
    var duo = opts.layout === 'duo' && opts.partner, partner = opts.partner, side = opts.side, choiceSide = opts.choiceSide;
    var rigs = [], box, F = standFx(), actors = [], layer = null, ro = null, stage;
    var S = G.Game && G.Game.state;
    // 아래 층에 세울 수 있나: 다른 창(교역소 표·미니게임 등)이 열려 있지 않고, 건물 메뉴·도시 이름판이 있는 화면일 때.
    // 아니면 예전처럼 대화창 층에 세운다(창 뒤에 숨지 않게). 혼자 말하는 사람은 아래 층에 세울 수 있을 때만 선다
    var low = !!(root && !UI.busy() && screenEl && screenEl.querySelector('.cmdmenu, .city-banner'));
    var menuEl = low ? screenEl.querySelector('.cmdmenu') : null;
    // 이야기 모드(「아버지의 사진」)는 사건이다 — 어느 화면(술집·도서관·바다·뭍)에서든 마주 선 무릎상 둘로 (얼굴 ↔ 무릎상으로 바뀌지 않게)
    var story = !!(root && S && S.player && G.Story && G.Story.active && G.Story.active());
    var keep = !story && keepScene();
    // 이야기 모드에서 제독 혼자의 말·물음(진행기 밖의 대사): 이 장면에서 방금 마주했던 사람과 둘이 선다. 사람 없는 내레이션이 오면 장면이 바뀐 것으로 본다
    if (story && !opts.portrait && !opts.name) storyPartner = null;
    if (story && !duo && !opts.noStand && isPlayer(opts) && storyPartner && Date.now() - storyPartner.t < 10 * 60 * 1000) { duo = true; partner = storyPartner.who; side = 'left'; choiceSide = 'left'; }
    if (!keep) {
      /* 한 가지 구도: 어디서든(도시·바다·뭍·해전·창이 열려 있을 때도) 말하는 사람은 제독과 마주 선다 — 제독 왼쪽 · 상대 오른쪽.
         혼자 가운데 서는 구도와 대화창 안 얼굴 칸은 쓰지 않는다 (사람이 없는 말·noStand 장면만 예전 대화창).
         두 사람을 이미 정해 준 대화(부하끼리의 썸 등)는 그대로. 도서관·술집은 예전 구도 그대로 (keepScene) */
      if (!opts.noStand && (opts.portrait || isPlayer(opts)) && S && S.player && !duo) {   // 제독은 초상이 없어도 무릎상(heroHalf)으로 선다
        duo = true;
        if (isPlayer(opts)) { partner = partnerFor(menuEl) || recentPartner(); side = 'left'; choiceSide = 'left'; }
        else { side = 'right'; choiceSide = choiceSide || 'left'; partner = { name: S.player.name, rigId: 'player', portrait: S.player.portrait, half: G.Img && G.Img.chain.heroHalf ? G.Img.chain.heroHalf() : null }; }
      }
    }
    // 제독 혼자의 물음·혼잣말: 방금 마주 섰던 사람이 있으면 그 사람과 함께 선다 (제독 = 왼쪽, 고르는 쪽)
    if (keep && !duo && low && !opts.noStand && isPlayer(opts) && partnerFor(menuEl)) { duo = true; partner = partnerFor(menuEl); side = 'left'; choiceSide = 'left'; }
    // 도시 안에서 혼자 말하던 사람(여급·수위·거간꾼·거리의 마을 사람…)도 동료처럼 제독과 마주 선 무릎상 대화로 (G.FX.stand.npcDuo).
    // 무릎상이 없는 사람만 그 자리에 흉상으로 선다. who.solo = true면 예전처럼 혼자 가운데에
    if (keep && !duo && low && !opts.noStand && F.npcDuo && opts.portrait && !opts.solo && !isPlayer(opts) && S && S.loc && S.loc.mode === 'city' && S.player) {
      duo = true; side = 'right'; choiceSide = choiceSide || 'left';
      partner = { name: S.player.name, rigId: 'player', portrait: S.player.portrait, half: G.Img && G.Img.chain.heroHalf ? G.Img.chain.heroHalf() : null };
    }
    var solo = keep && !duo && !opts.noStand && !!opts.portrait && low && (!F.soloCity || (S && S.loc && S.loc.mode === 'city'));
    var soloHalf = solo ? halfKeyOf(opts) : null;
    if (soloHalf && !soloHalf.key) soloHalf = null;
    if (!duo && !solo) {
      box = U.el('div', 'dlg' + (asking ? ' ask' : '') + (opts.portrait ? '' : ' noportrait'));
      box.innerHTML = (opts.portrait ? '<div class="pframe wood"></div>' : '') + '<div class="body parch"></div>';
      if (opts.name) {
        var oldName = U.el('div', 'name wood', U.esc(opts.name));
        if (!opts.portrait) oldName.style.left = '24px';
        box.appendChild(oldName);
        if (G.Bio) G.Bio.tag(oldName, opts);
      }
      if (opts.portrait) box.querySelector('.pframe').appendChild(portraitNode(opts, 134));
      if (opts.portrait && G.Bio) G.Bio.tag(box.querySelector('.pframe'), opts);
      back.appendChild(box);
      return { box: box, layout: function () {}, destroy: function () {} };
    }

    stage = U.el('div', 'dlg-stage' + (duo ? ' duo' : ' solo') + (asking ? ' ask' : ''));
    layer = U.el('div', 'dlg-actors');
    if (low) root.appendChild(layer); else stage.appendChild(layer);
    function addActor(who, side, active, half) {
      var tall = !!(half && half.key);
      var actor = U.el('div', 'dlg-actor ' + side + (tall ? ' tall' : ' bust') + (active ? ' active' : ''));
      var art = U.el('div', 'actor-art'); actor.appendChild(art);
      if (G.PortraitRig) {
        rigs.push(G.PortraitRig.mount(art, {
          portrait: tall ? null : who && who.portrait, chain: tall ? half.chain : who && who.portraitChain, profile: tall ? 'half' : 'bust', side: side === 'center' ? 'right' : side,
          state: active ? (asking ? 'react' : 'talk') : 'listen', emotion: active ? (opts.emotion || 'neutral') : 'neutral',
          anchors: who && who.rigAnchors, alt: who && who.name, noFace: !!(who && who.rigNoFace)
        }));
      } else {
        var p = portraitNode(who, 280); if (p) art.appendChild(p);
      }
      layer.appendChild(actor);
      var an = null;
      if (duo && who && who.name) { an = U.el('div', 'actor-name wood ' + (side === speakerSide ? 'speaking' : 'quiet'), U.esc(who.name)); stage.appendChild(an); if (G.Bio) G.Bio.tag(an, who); }   // 지금 말하는 사람의 이름표만 밝게 (UI QA 2026-10-11 #4)
      var A0 = { el: actor, name: an, side: side, tall: tall, scale: who && who.standScale > 0 ? Math.min(1, who.standScale) : 1, aspect: 0,
        fbox: tall && G.PORTRAIT_FACES && G.PORTRAIT_FACES[half.key] ? G.PORTRAIT_FACES[half.key].box : null };   // 얼굴 자리 (그림 안 비율) — 발표 그림이 얼굴을 가리지 않게 (UI.stageInfo)   // standScale: 아이처럼 키가 작은 사람 (어른 = 1)
      actors.push(A0);
      // 그림의 실제 가로세로 비를 따른다 — 제독 무릎상(512×512 정사각)도 1024×1536 그림과 같은 키로 서게
      if (tall && G.Img.load) {
        try {
          var pr = G.Img.load(half.key);
          if (pr && pr.then) pr.then(function (img) {
            if (img && img.naturalWidth && img.naturalHeight) { A0.aspect = img.naturalWidth / img.naturalHeight; A0.top0 = figureTop(img, half.key); layout(); }
            else toFaces();   // 무릎상 파일을 읽지 못하면 두 사람 다 얼굴로 (한 사람만 얼굴이 되지 않게)
          }, function () { toFaces(); });
        } catch (e) { /* 그림이 없으면 기본 비율 */ }
      }
    }
    /* 무릎상 파일을 읽지 못했을 때: 선 사람들을 모두 얼굴(흉상)로 다시 세운다 */
    var duoCast = null, facesNow = false;
    function toFaces() {
      if (facesNow || !box || !box.isConnected) return;
      facesNow = true;
      rigs.forEach(function (r) { if (r) r.destroy(); }); rigs = [];
      actors.forEach(function (a) { if (a.el.parentNode) a.el.parentNode.removeChild(a.el); if (a.name && a.name.parentNode) a.name.parentNode.removeChild(a.name); });
      actors = [];
      if (duoCast) {
        if (duoCast.left) addActor(duoCast.left, 'left', duoCast.active === 'left', null);
        if (duoCast.right) addActor(duoCast.right, 'right', duoCast.active === 'right', null);
      } else addActor(opts, 'center', true, null);
      layout();
    }
    var speakerSide = 'center';
    if (duo) {
      speakerSide = side === 'left' ? 'left' : 'right';
      var left = speakerSide === 'left' ? opts : partner;
      var right = speakerSide === 'right' ? opts : partner;
      var activeSide = asking ? (choiceSide || (speakerSide === 'left' ? 'right' : 'left')) : speakerSide;
      // 바다·뭍에서는 특별한 사건(가족·연인·부하끼리 썸·왕녀)이 아니면 두 사람 얼굴(흉상)만 — 무릎상은 과하다
      var faces = seaOrLand() && !story && !isSpecial(left) && !isSpecial(right);
      // 무릎상과 얼굴을 섞지 않는다: 두 사람 다 무릎상이 있을 때만 무릎상, 한 사람이라도 없으면 둘 다 얼굴
      var hl = left ? halfKeyOf(left) : null, hr = right ? halfKeyOf(right) : null;
      if ((left && !(hl && hl.key)) || (right && !(hr && hr.key))) faces = true;
      duoCast = { left: left, right: right, active: activeSide };
      if (left) addActor(left, 'left', activeSide === 'left', faces ? null : hl);       // 제독 혼잣말에 방금 마주 선 사람이 없으면 제독만 왼쪽에
      if (right) addActor(right, 'right', activeSide === 'right', faces ? null : hr);
      var other = isPlayer(left) ? right : isPlayer(right) ? left : right;
      if ((low || !keep) && other && !isPlayer(other)) lastPartner = { who: other, menu: menuEl, t: Date.now() };
      if (story && other && !isPlayer(other) && other.portrait) storyPartner = { who: other, t: Date.now() };
    } else {
      addActor(opts, 'center', true, soloHalf);
      if (low && !isPlayer(opts)) lastPartner = { who: opts, menu: menuEl, t: Date.now() };
    }
    box = U.el('div', 'dlg duo' + (duo ? '' : ' solo') + (asking ? ' ask' : '') + ' speaker-' + speakerSide);
    box.innerHTML = '<div class="body parch"></div>';
    if (opts.name) { var nmEl = U.el('div', 'name wood', U.esc(opts.name)); box.appendChild(nmEl); if (G.Bio) G.Bio.tag(nmEl, opts); }
    stage.appendChild(box); back.appendChild(stage);
    setTalking(1);

    /* 대화창 자리를 재어 사람들을 세운다 (쪽이 바뀌거나 선택지가 붙어 대화창 높이가 바뀌면 다시) */
    function layout() {
      if (!box.isConnected || !root) return;
      var b = stageRect(box), foot = b.top + F.sink;
      if (!low) { var L = stageRect(layer); b = { left: b.left - L.left, right: b.right - L.left, top: b.top - L.top, width: b.width }; foot = b.top + F.sink; }
      // 자리가 모자라면(글씨·창 크기를 키워 UI 층이 낮을 때) 키를 줄여 머리가 화면 위로 나가지 않게 — 그래도 240 아래로는 줄이지 않는다
      var room = foot - F.top, h = Math.max(Math.min(F.minH, Math.max(240, room)), Math.min(F.maxH, room)), w = Math.round(h * F.aspect);
      var cores = [];
      // 마주 선 두 사람의 머리끝을 맞춘다: 머리 위 빈칸이 큰 그림(기본 제독 13%)을 그만큼 키운다 — 아랫단(무릎)은 대화창 윗변 그대로, 최대 fitMax배
      var talls = actors.filter(function (a) { return a.tall; }), refTop = talls.length > 1 ? Math.min.apply(null, talls.map(function (a) { return a.top0 == null ? 0.01 : a.top0; })) : null;
      actors.forEach(function (a) {
        var fit = a.tall && refTop != null ? U.clamp((1 - refTop) / (1 - (a.top0 == null ? refTop : a.top0)), 1, F.fitMax || 1.2) : 1;
        a.el.dataset.fit = fit.toFixed(3); a.el.dataset.top0 = a.top0 == null ? '' : a.top0.toFixed(3);
        var aw = a.tall ? Math.round(h * (a.aspect || F.aspect) * a.scale * fit) : F.bustW, ah = a.tall ? Math.round(h * a.scale * fit) : F.bustH, x;
        if (a.side === 'left') x = b.left;
        else if (a.side === 'right') x = b.right - aw;
        else x = b.left + (b.width - aw) / 2;
        var st = a.el.style;
        st.left = Math.round(x) + 'px'; st.width = aw + 'px'; st.height = ah + 'px';
        st.top = Math.round((a.tall ? foot : b.top) - ah) + 'px';
        if (a.name) {   // 이름표: 대화창 윗변에 걸친 나무패 — 왼쪽 사람은 왼쪽 끝, 오른쪽 사람은 오른쪽 끝 (대화창 이름패와 같은 자리)
          var ns = a.name.style;
          ns.top = Math.round(b.top - 20) + 'px';
          if (a.side === 'right') { ns.left = Math.round(b.right - 24) + 'px'; ns.transform = 'translateX(-100%)'; }
          else if (a.side === 'left') { ns.left = Math.round(b.left + 24) + 'px'; ns.transform = 'none'; }
          else { ns.left = Math.round(x + aw / 2) + 'px'; ns.transform = 'translateX(-50%)'; }
        }
        var top = (a.tall ? foot : b.top) - ah;
        cores.push(a.tall ? { left: x + aw * 0.2, right: x + aw * 0.8, top: top + ah * 0.03, bottom: b.top } : { left: x, right: x + aw, top: top, bottom: b.top });
      });
      if (low) hidePanelsUnder(cores);
      publishStage();
    }
    /* 지금 선 사람들의 얼굴 자리와 이름표 윗변 (#ui 좌표) — 보고·발표 자리의 발견물 그림(G.Scenes.discoveryShow)이 이것을 보고 자리를 잡는다 */
    function publishStage() {
      try {
        var faces = [], nameTop = stageRect(box).top;
        actors.forEach(function (a) {
          if (!a.el.isConnected) return;
          var r = stageRect(a.el), fb = a.fbox;
          if (fb) faces.push({ left: r.left + fb[0] * r.width, top: r.top + fb[1] * r.height, right: r.left + (fb[0] + fb[2]) * r.width, bottom: r.top + (fb[1] + fb[3]) * r.height });
          else if (a.tall) faces.push({ left: r.left + r.width * 0.3, top: r.top, right: r.left + r.width * 0.7, bottom: r.top + r.height * 0.24 });   // 얼굴 자리 자료가 없으면 머리 쪽 어림
          else faces.push({ left: r.left + r.width * 0.2, top: r.top, right: r.left + r.width * 0.8, bottom: r.top + r.height * 0.7 });
          if (a.name && a.name.isConnected) nameTop = Math.min(nameTop, stageRect(a.name).top);
        });
        var nm = box.querySelector('.name'); if (nm && nm.offsetParent) nameTop = Math.min(nameTop, stageRect(nm).top);
        UI.stageInfo = { faces: faces, nameTop: nameTop, actorsOnTop: !low, t: Date.now() };
        document.dispatchEvent(new CustomEvent('pu-dlg-layout', { detail: UI.stageInfo }));
      } catch (e) { /* 자리를 못 재면 그대로 */ }
    }
    if (window.ResizeObserver) { ro = new ResizeObserver(layout); ro.observe(box); }
    requestAnimationFrame(layout);
    function relayout() { layout(); requestAnimationFrame(function () { requestAnimationFrame(layout); }); }   // 통역 창이 붙으면 대화창이 한 틀 뒤에 올라간다
    return {
      box: box, layout: relayout,
      destroy: function () {
        if (ro) ro.disconnect();
        rigs.forEach(function (r) { if (r) r.destroy(); });
        if (layer && layer.parentNode) layer.parentNode.removeChild(layer);
        UI.stageInfo = null;
        setTalking(-1);
      }
    };
  }

  /** 화면 위쪽에 붙여 두는 작은 쪽지 (대화가 이어지는 동안 무엇에 관한 이야기인지 보여 준다). 돌려준 함수를 부르면 사라진다 */
  UI.pin = function (html) {
    var el = U.el('div', 'pinnote parch', html);
    (modalRoot || document.body).appendChild(el);
    return function () { if (el.parentNode) el.parentNode.removeChild(el); };
  };

  // ---------------------------------------------------------------- dialog (say)
  /** opts: 기존 화자 필드 + {layout:'duo', partner:화자, side, emotion} */
  /* 사람이 하는 말 다듬기: 말 속에 섞인 셈·규칙 안내(괄호 안의 숫자·「명성 +」 따위, 끝에 붙은 「— 새 단서」)는 말에서 빼고 알림으로 보여 주고,
     말 가운데의 줄표( — )는 쉼표·마침표로 바꾼다. 「」『』 안(이름·제목)은 건드리지 않는다. 돌려주는 값: {text, notes} */
  var NOTE_RE = /\d|명성|금화|신뢰|악명|규율|피로|충성|단계|필요|닢|일 뒤|남은/;
  UI.tidySpeech = function (text) {
    var notes = [], t = String(text == null ? '' : text);
    if (/<\w/.test(t) && !/<span class="muted">/.test(t)) return { text: t, notes: notes };   // 표·그림 같은 HTML은 그대로
    // 끝에 붙은 안내: 「\n\n— 새 단서: …」, 「\n— …」
    t = t.replace(/\n+\s*—\s*([^\n]+)\s*$/, function (m, x) { notes.push(x.trim()); return ''; });
    // 괄호 안의 셈·규칙 (이름 괄호 「피달구 (Fidalgo)」나 「(한참 뒤)」 같은 지문은 남긴다)
    t = t.replace(/\s*\(([^()]*)\)/g, function (m, x) {
      if (!NOTE_RE.test(x)) return m;
      notes.push(x.replace(/^\s+|\s+$/g, '')); return '';
    });
    // 말 가운데 줄표 — 「」『』 밖에서만, 이름 속 줄표(「별의 길 — 쿠페의 항로」 같은 발견·물건 이름)도 건드리지 않는다
    t = t.split(dashSplitter()).map(function (part, i) {
      if (i % 2) return part;
      return part.replace(/([다요오죠네군소까]|[!?….])\s+—\s+/g, function (m, ch) { return /[!?….]/.test(ch) ? ch + ' ' : ch + '. '; })
        .replace(/\s+—\s+/g, ', ');
    }).join('');
    t = t.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '').replace(/ {2,}/g, ' ');
    return { text: t, notes: notes.filter(Boolean) };
  };
  var dashRe = null;
  function dashSplitter() {
    if (dashRe) return dashRe;
    var names = [];
    (G.DISCOVERIES || []).forEach(function (d) { if (/ — /.test(d.name || '')) names.push(d.name); });
    Object.keys(G.ITEM || {}).forEach(function (k) { var n = G.ITEM[k] && G.ITEM[k].name; if (n && / — /.test(n)) names.push(n); });
    var esc = names.sort(function (a, b) { return b.length - a.length; }).map(function (n) { return n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
    dashRe = new RegExp('(「[^」]*」|『[^』]*』' + (esc.length ? '|' + esc.join('|') : '') + ')');
    return dashRe;
  }
  /** 다듬다 빠진 셈·안내를 알림으로 */
  function noteToast(notes) { (notes || []).forEach(function (n, i) { setTimeout(function () { UI.toast(n.replace(/^—\s*/, ''), 'scroll', 4600); }, 250 + i * 350); }); }
  /** 세상의 소식 다듬기: 【…】 머리표와 줄표를 걷어 내고 이야기하듯 */
  UI.tidyNews = function (text) {
    var t = String(text == null ? '' : text);
    t = t.replace(/^【[^】]*(소식|유행|시장)】\s*/, '');
    t = t.replace(/^【([^】]+)】\s*/, '');
    t = t.replace(/^(?:소식|소문|철새 소식|새 도시 소식):\s*/, '');
    t = t.split(dashSplitter()).map(function (part, i) {
      if (i % 2) return part;
      return part.replace(/조짐\s+—\s+/g, '').replace(/([다요오])\s+—\s+/g, '$1. ').replace(/\s+—\s+/g, ', ');
    }).join('');
    return t.replace(/ {2,}/g, ' ').trim();
  };

  UI.say = function (text, opts) {
    opts = withFace(opts || {});
    var pages = Array.isArray(text) ? text.slice() : String(text).split('\f');
    if (!opts.raw) { var allNotes = []; pages = pages.map(function (pg) { var r = UI.tidySpeech(pg); allNotes = allNotes.concat(r.notes); return r.text; }); noteToast(allNotes); }
    return new Promise(function (resolve) {
      var back = U.el('div', 'modal-back clear catch');
      var shell = dialogShell(back, opts, false), box = shell.box;
      modalRoot.appendChild(back);
      var body = box.querySelector('.body');
      var idx = 0, finished = false;
      function show() {
        body.innerHTML = speech(box, pages[idx], opts) + '<div class="more">▼</div>'; shownAt = Date.now();
        shell.layout();
      }
      var shownAt = 0, arm = null;
      function next() {
        if (finished || Date.now() - shownAt < 220) return;      // 두 번 눌러(더블클릭) 한 쪽을 건너뛰지 않게
        idx++;
        if (idx >= pages.length) { done(); } else { show(); if (arm) arm(); }   // 손으로 넘겨도 새 쪽은 5초를 처음부터 센다 (QA 2026-10-23)
      }
      var auto = autoOn(), seen = auto ? seenStore() : null, sk = auto ? sayKey(pages.join('\f'), opts) : null, stopAuto = null;
      function done() { if (finished) return; finished = true; if (stopAuto) stopAuto(); unkey(); shell.destroy(); if (back.parentNode) back.parentNode.removeChild(back); resolve(); }
      var unkey = pushKey(function (e) {
        if (keyIs(e, 'confirm') || keyIs(e, 'confirmAlt') || keyIs(e, 'cancel')) { next(); return true; }
        return false;
      });
      back.addEventListener('click', next);       // 대화창이든 바깥이든 누르면 Enter처럼 넘어간다 (대화창 클릭은 여기로 올라온다)
      show();
      // 항해 중 사건: 전에 본 말이면 5초 뒤 저절로 넘어간다 (쪽마다)
      if (auto && seen) {
        if (seen[sk]) {
          arm = function () { if (stopAuto) stopAuto(); stopAuto = autoTimer(box, '저절로 넘어갑니다', function () { stopAuto = null; shownAt = 0; next(); }, '누르면 바로 넘어간다'); };
          arm();
        }
        seen[sk] = 1; var ks = Object.keys(seen); if (ks.length > 400) delete seen[ks[0]];
      }
    });
  };

  /** speech + inline choices. choices: [{label, value, dis, icon, thumb}] | strings. returns value (null on Esc if cancel !== false)
      thumb: 단추 앞에 작은 그림(소지품·교역품 그림 주소) */
  UI.ask = function (text, choices, opts) {
    opts = withFace(opts || {});
    var list = choices.map(function (o, i) { return typeof o === 'string' ? { label: o, value: i } : o; });
    return new Promise(function (resolve) {
      var back = U.el('div', 'modal-back clear');
      var shell = dialogShell(back, opts, true), box = shell.box;
      modalRoot.appendChild(back);
      var body = box.querySelector('.body');
      // 고를 때 알아야 할 셈(금화·남은 날 …)은 알림으로 흘려보내지 않고 질문 아래 작은 글씨로 남긴다 (QA 2026-10-10)
      var tt = opts.raw ? { text: String(text), notes: [] } : UI.tidySpeech(text);
      var note = tt.notes.length ? '<div class="ask-note">' + tt.notes.map(function (n) { return U.esc(n.replace(/<[^>]+>/g, '').replace(/^—\s*/, '')); }).join(' · ') + '</div>' : '';
      body.innerHTML = '<div>' + speech(box, tt.text, opts) + '</div>' + note + '<div class="askrow"></div>';
      var row = body.querySelector('.askrow');
      var selected = null;
      function pick(step) { selected = selectKeyItem(Array.prototype.slice.call(row.querySelectorAll('button')), selected, step); return selected; }
      function done(v) { unkey(); shell.destroy(); if (back.parentNode) modalRoot.removeChild(back); resolve(v); }
      var pk = pickKey(text, list, opts), prev = lastPick(pk), stopAuto = null;
      var done0 = done; done = function (v) { if (stopAuto) { stopAuto(); stopAuto = null; } done0(v); };
      list.forEach(function (o, i) {
        var b = U.el('button', 'btn small' + (i === 0 ? ' navy' : '') + (o.dis ? ' disabled' : '') + (prev != null && prev === o.label ? ' prevpick' : ''), (o.thumb ? '<img class="ask-thumb" src="' + o.thumb + '" alt="">' : o.icon ? G.icon(o.icon) : '') + o.label + (prev != null && prev === o.label ? '<span class="prevtag">지난번</span>' : ''));
        b.onclick = function (e) { e.stopPropagation(); rememberPick(pk, o.label); done(o.value); };
        row.appendChild(b);
      });
      selected = row.querySelector('button:not(.disabled)'); if (selected) selected.classList.add('kbd-focus');
      // 항해 중 사건: 지난번에 고른 것이 있으면 5초 뒤 그대로 고른다 (누르거나 키를 누르면 멈춘다)
      if (autoOn() && prev != null) {
        var pv = list.filter(function (o) { return !o.dis && normLabel(o.label) === normLabel(prev); })[0];
        if (pv) {
          stopAuto = autoTimer(box, '지난번처럼 「' + U.esc(normLabel(pv.label).replace(/#/g, '').replace(/\s+/g, ' ').trim()) + '」', function () { stopAuto = null; rememberPick(pk, pv.label); done(pv.value); });
          var halt = function () { if (stopAuto) { stopAuto(); stopAuto = null; } };
          box.addEventListener('pointerdown', halt, true);
        }
      }
      var unkey = pushKey(function (e) {
        if (stopAuto) { stopAuto(); stopAuto = null; }
        if (keyIs(e, 'cancel') && opts.cancel !== false) { done(opts.cancelValue != null ? opts.cancelValue : null); return true; }
        if (keyIs(e, 'up') || keyIs(e, 'left')) { pick(-1); return true; }
        if (keyIs(e, 'down') || keyIs(e, 'right')) { pick(1); return true; }
        if (keyIs(e, 'confirm') || keyIs(e, 'confirmAlt')) { selected = selected || pick(1); if (selected) selected.click(); return true; }
        var n = parseInt(e.key, 10); if (n >= 1 && n <= list.length && !list[n - 1].dis) { rememberPick(pk, list[n - 1].label); done(list[n - 1].value); return true; }
        return false;
      });
      box.style.cursor = 'default';
      shell.layout();
    });
  };

  /** sequence of speeches: [[speakerSpec, text], ...] 또는 {speaker,text,emotion} */
  UI.talk = async function (lines, talkOpts) {
    talkOpts = talkOpts || {};
    var speakers = [];
    lines.forEach(function (l) { var s = Array.isArray(l) ? l[0] : l.speaker; if (s && speakers.indexOf(s) < 0) speakers.push(s); });
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i], sp = Array.isArray(l) ? l[0] : l.speaker, tx = Array.isArray(l) ? l[1] : l.text;
      var o = copyOpts(sp, { emotion: (!Array.isArray(l) && l.emotion) || 'neutral' });
      if (talkOpts.layout === 'duo' && speakers.length === 2) {
        o.layout = 'duo'; o.side = speakers.indexOf(sp) === 0 ? 'left' : 'right'; o.partner = speakers[sp === speakers[0] ? 1 : 0];
      }
      await UI.say(tx, o);
    }
  };

  // ---------------------------------------------------------------- window
  /** opts: {title, icon, width, height, html, parch:true, closable:true, buttons:[{label, cls, value, icon}], onBuild(el, win), clear:false}
      returns {el, content, close(value), result:Promise} */
  UI.window = function (opts) {
    var back = U.el('div', 'modal-back' + (opts.clear ? ' clear' : ''));
    var w = U.el('div', 'win wood brass-frame');
    if (opts.width) w.style.width = opts.width + 'px';
    if (opts.height) w.style.height = opts.height + 'px';
    var h = '';
    if (opts.title != null) h += '<div class="title">' + (opts.icon ? G.icon(opts.icon) : '') + '<span>' + opts.title + '</span>' + (opts.closable === false ? '' : '<span class="x" title="닫기">✕</span>') + '</div>';
    h += '<div class="content ' + (opts.parch === false ? '' : 'parch') + '"></div>';
    if (opts.buttons && opts.buttons.length) h += '<div class="foot"></div>';
    w.innerHTML = h;
    back.appendChild(w);
    modalRoot.appendChild(back);
    var content = w.querySelector('.content');
    if (opts.height) content.style.flex = '1';
    if (opts.html) content.innerHTML = opts.html;
    var resolveFn;
    var api = { el: w, content: content, back: back };
    api.result = new Promise(function (r) { resolveFn = r; });
    var closed = false;
    api.close = function (v) {
      if (closed) return; closed = true; unkey();
      if (back.parentNode) back.parentNode.removeChild(back);
      if (opts.onClose) opts.onClose(v);
      resolveFn(v);
    };
    // 알림처럼 누를 단추가 하나뿐인 창(내용이 정적인 창): Enter·Space나 아무 데나 누르면 그 단추를 누른 것으로 — 고를 것이 있는 창은 기다린다
    //   · 창 바깥(어두운 바탕)을 누르거나 Enter → 그 단추. 창 안을 눌러도 되는 것은 내용이 글·그림뿐인 창(opts.clickAny: 알림·소식·발견·열람 결과…)
    var solo = opts.buttons && opts.buttons.length === 1 && !opts.onKey && opts.clickAny !== false ? opts.buttons[0] : null;
    var openedAt = Date.now();     // 막 연 창은 잠깐(0.4초) 누름을 받지 않는다 — 앞 창을 두 번 눌러(더블클릭) 새 창까지 넘겨 버리지 않게
    var selected = null;
    // 설정 창의 새 항목(글자 크기·글꼴·조작 감도…)도 방향키로 고르게 — .opt-row 안의 선택지 전체 (QA 2026-10-23)
    function candidates() { return Array.prototype.slice.call(w.querySelectorAll('.choice:not(.dis), button:not([disabled]):not(.disabled), .opt[data-res], .opt[data-uisz], .opt[data-as], .opt[data-sh], .opt[data-bt], .opt[data-km], .opt[data-ms], .opt-row .opt:not(.dis), .tab')); }
    function moveSelection(step) { selected = selectKeyItem(candidates(), selected && selected.isConnected ? selected : w.querySelector('.kbd-focus'), step); return selected; }
    function pressSolo() { if (closed || Date.now() - openedAt < 400) return; if (solo.onClick) { var r = solo.onClick(api); if (r === false) return; } api.close(solo.value); }
    var unkey = pushKey(function (e) {
      var typing = e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      if (keyIs(e, 'cancel') && opts.closable !== false && !typing) { api.close(null); return true; }
      if (solo && (keyIs(e, 'confirm') || keyIs(e, 'confirmAlt')) && !typing) { pressSolo(); return true; }
      if (opts.onKey && opts.onKey(e) === true) return true;
      if (!typing && (keyIs(e, 'up') || keyIs(e, 'left'))) { moveSelection(-1); return true; }
      if (!typing && (keyIs(e, 'down') || keyIs(e, 'right'))) { moveSelection(1); return true; }
      if (!typing && (keyIs(e, 'confirm') || keyIs(e, 'confirmAlt'))) { selected = (selected && selected.isConnected ? selected : w.querySelector('.kbd-focus')) || moveSelection(1); if (selected) selected.click(); return true; }
      return false;
    });
    if (solo) {
      back.addEventListener('click', function (e) {
        var t = e.target;
        if (t !== back && !opts.clickAny) return;
        if (t.closest && t.closest('button, a, input, select, textarea, .choice, .title .x')) return;
        pressSolo();
      });
      if (opts.clickAny) w.style.cursor = 'pointer';
    }
    var x = w.querySelector('.title .x'); if (x) x.onclick = function () { api.close(null); };
    if (opts.buttons) {
      var foot = w.querySelector('.foot');
      opts.buttons.forEach(function (b) {
        var btn = U.el('button', 'btn ' + (b.cls || ''), (b.icon ? G.icon(b.icon) : '') + b.label);
        btn.onclick = function () { if (b.disabled) return; if (b.onClick) { var r = b.onClick(api); if (r === false) return; } api.close(b.value); };
        if (b.disabled) { btn.disabled = true; btn.classList.add('disabled'); if (b.title) btn.title = b.title; }
        foot.appendChild(btn);
        if (b.id) api[b.id] = btn;
      });
    }
    if (opts.onBuild) opts.onBuild(content, api);
    if (G.Game && G.Game.uiZoom > 1.001) { requestAnimationFrame(function () { fitWin(w, back); }); setTimeout(function () { fitWin(w, back); }, 350); }
    return api;
  };
  /* 글씨·창 크기를 키워 UI 층이 좁아졌을 때(UI QA 2026-10-11 #1): 창이 화면보다 조금 크면(22% 안쪽) 창만 알맞게 줄여 한눈에 보이게 한다.
     그보다 크면(긴 목록) 너비만 맞추고 위아래는 스크롤 — 글씨가 너무 작아지지 않게 */
  function fitWin(w, back) {
    if (!w.isConnected || !(G.Game && G.Game.uiZoom > 1.001)) return;
    w.style.zoom = '';
    var mw = w.style.maxWidth, mh = w.style.maxHeight;
    w.style.maxWidth = 'none'; w.style.maxHeight = 'none';
    var nw = w.offsetWidth, nh = w.offsetHeight;
    w.style.maxWidth = mw; w.style.maxHeight = mh;
    var aw = back.clientWidth - 20, ah = back.clientHeight - 16;
    if (!nw || !nh || aw <= 0 || ah <= 0) return;
    var kw = Math.min(1, aw / nw), k = Math.min(kw, ah / nh);
    if (k < 0.78) k = kw;
    if (k < 0.999) w.style.zoom = Math.max(0.7, k).toFixed(3);
  }
  UI.fitWin = fitWin;

  /** simple choice list. options: array of {label, value, icon, thumb, right, disabled, desc} | strings */
  UI.choose = function (title, options, opts) {
    opts = opts || {};
    var list = options.map(function (o, i) { return typeof o === 'string' ? { label: o, value: i } : o; });
    var html = (opts.text ? '<div style="font-size:19px;margin-bottom:12px;line-height:1.55">' + opts.text + '</div>' : '') + '<div class="choices"></div>';
    var win = UI.window({ title: title, icon: opts.icon, width: opts.width || 520, html: html, closable: opts.cancel !== false, clear: opts.clear });
    var ch = win.content.querySelector('.choices');
    list.forEach(function (o, i) {
      var lead = o.thumb ? '<img class="choice-thumb" src="' + o.thumb + '" alt="">' : (o.icon ? G.icon(o.icon) : '');
      var d = U.el('div', 'choice' + (o.disabled ? ' dis' : ''), lead + '<span>' + o.label + '</span>' + (o.right != null ? '<span class="r">' + o.right + '</span>' : ''));
      if (o.desc) d.title = o.desc;
      d.onclick = function () { win.close(o.value); };
      ch.appendChild(d);
    });
    var first = ch.querySelector('.choice:not(.dis)'); if (first) first.classList.add('kbd-focus');
    return win.result;
  };

  UI.confirm = function (text, yes, no, title) {
    var win = UI.window({ title: title || '확인', width: 560, html: '<div style="font-size:20px;line-height:1.6">' + text + '</div>',
      buttons: [{ label: no || '아니오', value: false }, { label: yes || '예', value: true, cls: 'navy' }] });
    return win.result.then(function (v) { return !!v; });
  };

  UI.alert = function (text, title) {
    var win = UI.window({ title: title || '알림', width: 560, clickAny: true, html: '<div style="font-size:20px;line-height:1.6">' + text + '</div>', buttons: [{ label: '확인', value: true, cls: 'navy' }] });
    return win.result;
  };

  /** number input: {title, text, min, max, value, unit, quick:[{label,value}], info:function(v)->html} */
  UI.number = function (o) {
    var min = o.min || 0, max = Math.max(min, o.max), val = U.clamp(o.value == null ? max : o.value, min, max);
    var html = (o.text ? '<div style="font-size:18px;margin-bottom:12px">' + o.text + '</div>' : '') +
      '<div class="flex" style="gap:12px"><button class="btn small mn">−</button><input type="range" min="' + min + '" max="' + max + '" value="' + val + '">' +
      '<button class="btn small pl">＋</button></div>' +
      '<div class="flex" style="margin-top:14px;gap:10px"><input class="nfield" type="text" style="width:130px;text-align:right" value="' + val + '"><span style="font-size:19px">' + (o.unit || '') + '</span>' +
      '<span class="muted" style="margin-left:auto;font-size:16px">' + U.num(min) + ' ~ ' + U.num(max) + '</span></div>' +
      '<div class="qk flex" style="margin-top:12px;flex-wrap:wrap;gap:6px"></div><div class="inf" style="margin-top:12px;font-size:17px;min-height:24px"></div>';
    var win = UI.window({ title: o.title, width: o.width || 560, html: html, buttons: [{ label: '취소', value: null }, { label: '결정', cls: 'navy', value: 'ok' }] });
    var rng = win.content.querySelector('input[type=range]'), fld = win.content.querySelector('.nfield'), inf = win.content.querySelector('.inf');
    function set(v) { v = U.clamp(Math.round(+v || 0), min, max); val = v; rng.value = v; fld.value = v; if (o.info) inf.innerHTML = o.info(v); }
    rng.oninput = function () { set(rng.value); };
    fld.onchange = function () { set(fld.value); };
    win.content.querySelector('.mn').onclick = function () { set(val - (o.step || 1)); };
    win.content.querySelector('.pl').onclick = function () { set(val + (o.step || 1)); };
    var qk = win.content.querySelector('.qk');
    (o.quick || [{ label: '최소', value: min }, { label: '최대', value: max }]).forEach(function (q) {
      var b = U.el('button', 'btn small', q.label); b.onclick = function () { set(q.value); }; qk.appendChild(b);
    });
    set(val);
    return win.result.then(function (r) { return r === 'ok' ? val : null; });
  };

  /** text input */
  UI.prompt = function (title, value, max) {
    var win = UI.window({ title: title, width: 520, html: '<input class="nfield" type="text" maxlength="' + (max || 16) + '" style="width:100%" value="' + U.esc(value || '') + '">',
      buttons: [{ label: '취소', value: null }, { label: '결정', value: 'ok', cls: 'navy' }] });
    var f = win.content.querySelector('input'); setTimeout(function () { f.focus(); f.select(); }, 30);
    f.onkeydown = function (e) { if (keyIs(e, 'confirm')) win.close('ok'); e.stopPropagation(); };
    return win.result.then(function (r) { return r === 'ok' ? f.value.trim() : null; });
  };

  // ---------------------------------------------------------------- command menu (right side)
  /** items: [{label, icon, sub, dim, exit, onClick}] */
  UI.cmdMenu = function (title, sub, items, opts) {
    var m = U.el('div', 'cmdmenu wood brass-frame' + (items.filter(Boolean).length > 9 ? ' many' : ''));
    if (opts && opts.top != null) m.style.top = opts.top + 'px';
    if (opts && opts.left != null) { m.style.left = opts.left + 'px'; m.style.right = 'auto'; }
    m.innerHTML = '<h3>' + title + (sub ? '<small>' + sub + '</small>' : '') + '</h3><div class="items"></div>';
    var box = m.querySelector('.items');
    items.forEach(function (it) {
      if (!it) return;
      // 설명(sub): 짧은 것(숫자·「저장 가능」 따위)은 오른쪽에 한 줄로, 긴 것은 버튼을 키우지 않게 풍선 도움말로 (2026-10-23 사용자 요청)
      var subTxt = it.sub != null ? String(it.sub).replace(/<[^>]*>/g, '').trim() : '', inline = subTxt && (subTxt.length <= (opts && opts.subMax || 7) || /^[\d,.\s]+(닢|명|척|통|일|점|%)?$/.test(subTxt));   // 숫자(금고 잔액 등)는 길어도 한 줄로
      var d = U.el('div', 'cmd' + (it.dim ? ' dim' : '') + (it.exit ? ' exit' : '') + (subTxt && !inline ? ' has-tip' : ''), G.icon(it.icon || 'chev') + '<span>' + it.label + '</span>' + (inline ? '<span class="sub">' + it.sub + '</span>' : subTxt ? '<span class="tipdot" aria-hidden="true">ⓘ</span>' : ''));
      if (subTxt && !inline) { d.dataset.tip = subTxt; d.setAttribute('aria-label', String(it.label).replace(/<[^>]*>/g, '') + ' — ' + subTxt); }
      d.onclick = function () { if (UI.busy()) return; it.onClick && it.onClick(); };
      box.appendChild(d);
    });
    var first = box.querySelector('.cmd'); if (first && !townKeys()) first.classList.add('kbd-focus');   // 거리에서는 메뉴에 키 표시를 두지 않는다
    UI.add(m);
    return m;
  };

  /** 두 손가락 벌리기·오므리기로 확대 (휴대폰·태블릿). fn(배율) — 한 번 움직일 때마다 앞 모양 대비 배율 */
  UI.pinch = function (el, fn) {
    var d0 = 0;
    function dist(e) { var a = e.touches[0], b = e.touches[1]; return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); }
    el.addEventListener('touchstart', function (e) { if (e.touches.length === 2) d0 = dist(e); }, { passive: true });
    el.addEventListener('touchmove', function (e) {
      if (e.touches.length !== 2 || !d0) return;
      e.preventDefault();
      var d = dist(e); if (d > 0) { fn(d / d0); d0 = d; }
    }, { passive: false });
    el.addEventListener('touchend', function (e) { if (e.touches.length < 2) d0 = 0; }, { passive: true });
  };
  UI.bar = function (v, max, cls) {
    var p = max ? U.clamp(v / max, 0, 1) : 0;
    return '<div class="bar ' + (cls || '') + '"><i style="width:' + (p * 100).toFixed(1) + '%"></i></div>';
  };
})(window.G = window.G || {});
