/* UI framework: HUD, promise-based dialogs, windows, choices, number input, toasts. */
(function (G) {
  'use strict';
  var U = G.U;
  var UI = {};
  G.UI = UI;
  var root, screenEl, modalRoot, toastEl, hudEl, fadeEl;
  var keyHandlers = [];

  UI.init = function () {
    root = document.getElementById('ui');
    screenEl = U.el('div', 'layer'); screenEl.id = 'screen'; screenEl.style.pointerEvents = 'none';
    root.appendChild(screenEl);
    hudEl = U.el('div', 'hud wood hidden'); root.appendChild(hudEl);
    modalRoot = U.el('div', 'layer'); modalRoot.style.pointerEvents = 'none'; modalRoot.style.zIndex = 60; root.appendChild(modalRoot);
    toastEl = U.el('div', 'toasts'); root.appendChild(toastEl);
    fadeEl = U.el('div', 'fade-black'); root.appendChild(fadeEl);
    document.addEventListener('keydown', function (e) {
      for (var i = keyHandlers.length - 1; i >= 0; i--) { if (keyHandlers[i](e) === true) { e.preventDefault(); return; } }
      if (G.Game && G.Game.onKey) G.Game.onKey(e);
    });
  };
  function pushKey(fn) { keyHandlers.push(fn); return function () { var i = keyHandlers.indexOf(fn); if (i >= 0) keyHandlers.splice(i, 1); }; }
  UI.pushKey = pushKey;

  /** screen-level container (cleared per mode) */
  UI.screen = function () { return screenEl; };
  UI.clearScreen = function () { screenEl.innerHTML = ''; };
  UI.add = function (el) { el.style.pointerEvents = 'auto'; screenEl.appendChild(el); return el; };
  UI.busy = function () { return modalRoot.children.length > 0; };

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
    },
    /** 칸에 마우스를 올리면 보이는 설명 */
    tip: function (k, text) { var c = hudEl.querySelector('[data-k="' + k + '"]'); if (c) c.title = text || ''; },
    /** 칸의 작은 이름 */
    label: function (k, text) { var c = hudEl.querySelector('[data-k="' + k + '"] em'); if (c) c.innerHTML = text; },
    hide: function () { hudEl.classList.add('hidden'); },
    set: function (k, text, warn) {
      var c = hudEl.querySelector('[data-k="' + k + '"] span'); if (c) { c.innerHTML = text; c.parentNode.classList.toggle('val-warn', !!warn); }
    }
  };
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
  UI.toast = function (text, icon, ms) {
    var t = U.el('div', 'toast wood', G.icon(icon || 'rose') + '<div>' + text + '</div>');
    toastEl.appendChild(t);
    while (toastEl.children.length > 5) toastEl.removeChild(toastEl.firstChild);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 520); }, ms || 3200);
  };

  UI.fade = function (fn) {
    return new Promise(function (resolve) {
      fadeEl.classList.add('on');
      setTimeout(function () {
        Promise.resolve(fn && fn()).then(function () {
          setTimeout(function () { fadeEl.classList.remove('on'); resolve(); }, 60);
        });
      }, 460);
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

  // ---------------------------------------------------------------- dialog (say)
  /** opts: {name, portrait:(spec|canvas|null), lang:(level 0..3 for garble), dark:bool} */
  UI.say = function (text, opts) {
    opts = opts || {};
    var pages = Array.isArray(text) ? text.slice() : String(text).split('\f');
    return new Promise(function (resolve) {
      var back = U.el('div', 'modal-back clear');
      var box = U.el('div', 'dlg' + (opts.portrait ? '' : ' noportrait'));
      var inner = '';
      if (opts.portrait) inner += '<div class="pframe wood"></div>';
      inner += '<div class="body parch"></div>';
      box.innerHTML = inner;
      if (opts.name) {
        var nm = U.el('div', 'name wood', U.esc(opts.name));
        if (!opts.portrait) nm.style.left = '24px';
        box.appendChild(nm);
      }
      if (opts.portrait) {
        var pc = opts.portrait instanceof HTMLCanvasElement ? opts.portrait : G.Art.portraitCanvas(opts.portrait, 134);
        box.querySelector('.pframe').appendChild(pc);
      }
      back.appendChild(box);
      modalRoot.appendChild(back);
      var body = box.querySelector('.body');
      var idx = 0, finished = false;
      function show() {
        var t = U.esc(pages[idx]).replace(/\n/g, '<br>');
        if (opts.lang != null && opts.lang < 3) t = UI.garble(pages[idx], opts.lang).replace(/\n/g, '<br>');
        body.innerHTML = t + '<div class="more">▼</div>';
      }
      function next() {
        if (finished) return;
        idx++;
        if (idx >= pages.length) { done(); } else show();
      }
      function done() { if (finished) return; finished = true; unkey(); if (back.parentNode) back.parentNode.removeChild(back); resolve(); }
      var unkey = pushKey(function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { next(); return true; }
        return false;
      });
      box.addEventListener('click', next);
      show();
    });
  };

  /** speech + inline choices. choices: [{label, value, dis}] | strings. returns value (null on Esc if cancel !== false) */
  UI.ask = function (text, choices, opts) {
    opts = opts || {};
    var list = choices.map(function (o, i) { return typeof o === 'string' ? { label: o, value: i } : o; });
    return new Promise(function (resolve) {
      var back = U.el('div', 'modal-back clear');
      var box = U.el('div', 'dlg ask' + (opts.portrait ? '' : ' noportrait'));
      box.innerHTML = (opts.portrait ? '<div class="pframe wood"></div>' : '') + '<div class="body parch"></div>';
      if (opts.name) { var nm = U.el('div', 'name wood', U.esc(opts.name)); if (!opts.portrait) nm.style.left = '24px'; box.appendChild(nm); }
      if (opts.portrait) box.querySelector('.pframe').appendChild(opts.portrait instanceof HTMLCanvasElement ? opts.portrait : G.Art.portraitCanvas(opts.portrait, 134));
      back.appendChild(box); modalRoot.appendChild(back);
      var body = box.querySelector('.body');
      var t = opts.lang != null && opts.lang < 3 ? UI.garble(String(text), opts.lang) : U.esc(String(text));
      body.innerHTML = '<div>' + t.replace(/\n/g, '<br>') + '</div><div class="askrow"></div>';
      var row = body.querySelector('.askrow');
      function done(v) { unkey(); if (back.parentNode) modalRoot.removeChild(back); resolve(v); }
      list.forEach(function (o, i) {
        var b = U.el('button', 'btn small' + (i === 0 ? ' navy' : '') + (o.dis ? ' disabled' : ''), (o.icon ? G.icon(o.icon) : '') + o.label);
        b.onclick = function (e) { e.stopPropagation(); done(o.value); };
        row.appendChild(b);
      });
      var unkey = pushKey(function (e) {
        if (e.key === 'Escape' && opts.cancel !== false) { done(opts.cancelValue != null ? opts.cancelValue : null); return true; }
        var n = parseInt(e.key, 10); if (n >= 1 && n <= list.length && !list[n - 1].dis) { done(list[n - 1].value); return true; }
        return false;
      });
      box.style.cursor = 'default';
    });
  };

  /** sequence of speeches: [[speakerSpec, text], ...] */
  UI.talk = async function (lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      await UI.say(l[1], { name: l[0] && l[0].name, portrait: l[0] && l[0].portrait, lang: l[0] && l[0].lang });
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
    var unkey = pushKey(function (e) {
      if (e.key === 'Escape' && opts.closable !== false) { api.close(null); return true; }
      if (opts.onKey) return opts.onKey(e);
      return false;
    });
    var x = w.querySelector('.title .x'); if (x) x.onclick = function () { api.close(null); };
    if (opts.buttons) {
      var foot = w.querySelector('.foot');
      opts.buttons.forEach(function (b) {
        var btn = U.el('button', 'btn ' + (b.cls || ''), (b.icon ? G.icon(b.icon) : '') + b.label);
        btn.onclick = function () { if (b.onClick) { var r = b.onClick(api); if (r === false) return; } api.close(b.value); };
        foot.appendChild(btn);
        if (b.id) api[b.id] = btn;
      });
    }
    if (opts.onBuild) opts.onBuild(content, api);
    return api;
  };

  /** simple choice list. options: array of {label, value, icon, right, disabled, desc} | strings */
  UI.choose = function (title, options, opts) {
    opts = opts || {};
    var list = options.map(function (o, i) { return typeof o === 'string' ? { label: o, value: i } : o; });
    var html = (opts.text ? '<div style="font-size:19px;margin-bottom:12px;line-height:1.55">' + opts.text + '</div>' : '') + '<div class="choices"></div>';
    var win = UI.window({ title: title, icon: opts.icon, width: opts.width || 520, html: html, closable: opts.cancel !== false, clear: opts.clear });
    var ch = win.content.querySelector('.choices');
    list.forEach(function (o, i) {
      var d = U.el('div', 'choice' + (o.disabled ? ' dis' : ''), (o.icon ? G.icon(o.icon) : '') + '<span>' + o.label + '</span>' + (o.right != null ? '<span class="r">' + o.right + '</span>' : ''));
      if (o.desc) d.title = o.desc;
      d.onclick = function () { win.close(o.value); };
      ch.appendChild(d);
    });
    return win.result;
  };

  UI.confirm = function (text, yes, no, title) {
    var win = UI.window({ title: title || '확인', width: 560, html: '<div style="font-size:20px;line-height:1.6">' + text + '</div>',
      buttons: [{ label: no || '아니오', value: false }, { label: yes || '예', value: true, cls: 'navy' }] });
    return win.result.then(function (v) { return !!v; });
  };

  UI.alert = function (text, title) {
    var win = UI.window({ title: title || '알림', width: 560, html: '<div style="font-size:20px;line-height:1.6">' + text + '</div>', buttons: [{ label: '확인', value: true, cls: 'navy' }] });
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
    f.onkeydown = function (e) { if (e.key === 'Enter') win.close('ok'); e.stopPropagation(); };
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
      var d = U.el('div', 'cmd' + (it.dim ? ' dim' : '') + (it.exit ? ' exit' : ''), G.icon(it.icon || 'chev') + '<span>' + it.label + '</span>' + (it.sub ? '<span class="sub">' + it.sub + '</span>' : ''));
      d.onclick = function () { if (UI.busy()) return; it.onClick && it.onClick(); };
      box.appendChild(d);
    });
    UI.add(m);
    return m;
  };

  UI.bar = function (v, max, cls) {
    var p = max ? U.clamp(v / max, 0, 1) : 0;
    return '<div class="bar ' + (cls || '') + '"><i style="width:' + (p * 100).toFixed(1) + '%"></i></div>';
  };
})(window.G = window.G || {});
