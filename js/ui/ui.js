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
      if (c.text !== text) { c.text = text; c.span.innerHTML = text; }
      if (c.warn !== warn) { c.warn = warn; c.span.parentNode.classList.toggle('val-warn', warn); }
    }
  };
  var hudCells = {};
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
    while (toastEl.children.length > 5) toastEl.removeChild(toastEl.firstChild);
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
  function speech(box, raw, opts) {
    var TG = G.Tongues, sit = TG ? TG.situation(opts) : { plain: true };
    var old = box.querySelector('.interp'); if (old) old.parentNode.removeChild(old);
    box.style.bottom = '';
    if (sit.plain) return U.esc(raw).replace(/\n/g, '<br>');
    var html = TG.heard(raw, sit.own, sit.li);
    if (sit.team > sit.own && sit.mate) {
      var sub = U.el('div', 'interp parch');
      var who = (sit.mate.role === 'interp' ? '통역' : '부관') + ' ' + sit.mate.name;
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
    var d = { top: 60, sink: 6, aspect: 0.6667, minH: 360, maxH: 640, bustW: 260, bustH: 260, soloCity: true, npcDuo: true }, f = (G.FX && G.FX.stand) || {}, o = {}, k;
    for (k in d) o[k] = f[k] == null ? d[k] : f[k];
    return o;
  }
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
      if (duo && who && who.name) { an = U.el('div', 'actor-name wood', U.esc(who.name)); stage.appendChild(an); if (G.Bio) G.Bio.tag(an, who); }
      var A0 = { el: actor, name: an, side: side, tall: tall, scale: who && who.standScale > 0 ? Math.min(1, who.standScale) : 1, aspect: 0 };   // standScale: 아이처럼 키가 작은 사람 (어른 = 1)
      actors.push(A0);
      // 그림의 실제 가로세로 비를 따른다 — 제독 무릎상(512×512 정사각)도 1024×1536 그림과 같은 키로 서게
      if (tall && G.Img.load) {
        try {
          var pr = G.Img.load(half.key);
          if (pr && pr.then) pr.then(function (img) {
            if (img && img.naturalWidth && img.naturalHeight) { A0.aspect = img.naturalWidth / img.naturalHeight; layout(); }
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
      var h = Math.max(F.minH, Math.min(F.maxH, foot - F.top)), w = Math.round(h * F.aspect);
      var cores = [];
      actors.forEach(function (a) {
        var aw = a.tall ? Math.round(h * (a.aspect || F.aspect) * a.scale) : F.bustW, ah = a.tall ? Math.round(h * a.scale) : F.bustH, x;
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
  UI.say = function (text, opts) {
    opts = withFace(opts || {});
    var pages = Array.isArray(text) ? text.slice() : String(text).split('\f');
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
      var shownAt = 0;
      function next() {
        if (finished || Date.now() - shownAt < 220) return;      // 두 번 눌러(더블클릭) 한 쪽을 건너뛰지 않게
        idx++;
        if (idx >= pages.length) { done(); } else show();
      }
      function done() { if (finished) return; finished = true; unkey(); shell.destroy(); if (back.parentNode) back.parentNode.removeChild(back); resolve(); }
      var unkey = pushKey(function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { next(); return true; }
        return false;
      });
      back.addEventListener('click', next);       // 대화창이든 바깥이든 누르면 Enter처럼 넘어간다 (대화창 클릭은 여기로 올라온다)
      show();
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
      body.innerHTML = '<div>' + speech(box, String(text), opts) + '</div><div class="askrow"></div>';
      var row = body.querySelector('.askrow');
      function done(v) { unkey(); shell.destroy(); if (back.parentNode) modalRoot.removeChild(back); resolve(v); }
      var pk = pickKey(text, list, opts), prev = lastPick(pk);
      list.forEach(function (o, i) {
        var b = U.el('button', 'btn small' + (i === 0 ? ' navy' : '') + (o.dis ? ' disabled' : '') + (prev != null && prev === o.label ? ' prevpick' : ''), (o.thumb ? '<img class="ask-thumb" src="' + o.thumb + '" alt="">' : o.icon ? G.icon(o.icon) : '') + o.label + (prev != null && prev === o.label ? '<span class="prevtag">지난번</span>' : ''));
        b.onclick = function (e) { e.stopPropagation(); rememberPick(pk, o.label); done(o.value); };
        row.appendChild(b);
      });
      var unkey = pushKey(function (e) {
        if (e.key === 'Escape' && opts.cancel !== false) { done(opts.cancelValue != null ? opts.cancelValue : null); return true; }
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
    function pressSolo() { if (closed || Date.now() - openedAt < 400) return; if (solo.onClick) { var r = solo.onClick(api); if (r === false) return; } api.close(solo.value); }
    var unkey = pushKey(function (e) {
      if (e.key === 'Escape' && opts.closable !== false) { api.close(null); return true; }
      if (solo && e.key === 'Enter' && !(e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))) { pressSolo(); return true; }
      if (opts.onKey) return opts.onKey(e);
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
        btn.onclick = function () { if (b.onClick) { var r = b.onClick(api); if (r === false) return; } api.close(b.value); };
        foot.appendChild(btn);
        if (b.id) api[b.id] = btn;
      });
    }
    if (opts.onBuild) opts.onBuild(content, api);
    return api;
  };

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
