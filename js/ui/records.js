/* 증거·역사 소식은 자동으로 화면을 덮지 않고 상단의 새 기록 배지에 모은다. */
(function (G) {
  'use strict';
  var R = G.Records = {}, U = G.U, view = null;
  function state() { return G.Game && G.Game.state; }
  function store() {
    var s = state(); if (!s) return null;
    if (!s.noticeRecords || !Array.isArray(s.noticeRecords.items)) s.noticeRecords = { seq: 0, items: [] };
    return s.noticeRecords;
  }
  function plain(t) { return String(t == null ? '' : t).replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''); }
  function label(kind) { return kind === 'history' ? '역사' : '증거·단서'; }
  function source() {
    var s = state(), l = s && s.loc, c = l && l.mode === 'city' && G.CITY_DATA[l.city];
    return c ? c.name : l && l.mode === 'sea' ? '항해 중' : l && l.mode === 'land' ? '육상 탐험 중' : '';
  }
  function dateText(n) { return n ? U.fmtDate({ y: Math.floor(n / 10000), m: Math.floor(n / 100) % 100, d: n % 100 }) : ''; }
  function imageSrc(img) {
    if (!img || typeof img !== 'string') return '';
    if (G.Img && G.Img.has(img)) return G.Img.src(img);
    return /^(images\/|data:image\/|https?:\/\/|file:\/\/)/.test(img) ? img : '';
  }
  R.items = function () { var st = store(); return st ? st.items.slice() : []; };
  R.unread = function () { return R.items().filter(function (e) { return !e.read; }).length; };
  R.refresh = function () {
    var b = document.querySelector('.record-badge'); if (!b) return;
    var items = R.items(), n = R.unread(), text = n ? '새 기록 ' + n + '건' : '기록함';
    b.hidden = !items.length; b.classList.toggle('has-unread', n > 0);
    b.setAttribute('aria-label', text + ' — 증거와 역사 기록 열기');
    var t = b.querySelector('span'), changed = t.textContent !== text;
    t.textContent = text;
    if (changed && G.UI.fitHud) G.UI.fitHud();
  };
  R.mount = function (hud) {
    if (!hud || hud.querySelector('.record-badge')) { R.refresh(); return; }
    var anchor = hud.querySelector('.notice-btn'); if (!anchor) return;
    var b = U.el('button', 'record-badge', G.icon('scroll') + '<span></span>');
    b.style.setProperty('--record-font', G.FX.recordBadge.font + 'px'); b.style.setProperty('--record-height', G.FX.recordBadge.height + 'px');
    b.type = 'button'; b.title = '새 증거·단서와 역사 기록 — 눌렀을 때만 원문과 그림을 엽니다';
    b.setAttribute('aria-live', 'polite'); b.setAttribute('aria-atomic', 'true');
    b.onclick = function (e) { e.stopPropagation(); if (!G.UI.busy()) R.open(); };
    b.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') { e.preventDefault(); e.stopPropagation(); if (!e.repeat) b.click(); }
    });
    anchor.insertAdjacentElement('afterend', b); R.refresh();
  };
  function trim() {
    var st = store(), keep = G.BALANCE.notice.recordKeep, read = st.items.filter(function (e) { return e.read; });
    if (read.length > keep) {
      var remove = read.slice(0, read.length - keep);
      st.items = st.items.filter(function (e) { return remove.indexOf(e) < 0; });
    }
  }
  R.add = function (kind, entry) {
    var s = state(), st = store(); if (!s || !st || !entry || !entry.text) return null;
    kind = kind === 'history' ? 'history' : 'evidence';
    var text = plain(entry.text), date = entry.date || U.dateNum(s.date);
    var origin = plain(entry.source || (kind === 'history' ? '세상의 소식' : source()));
    var key = entry.key || kind + '|' + date + '|' + origin + '|' + text;
    var old = st.items.filter(function (e) { return e.key === key; })[0];
    if (old) return old;
    st.seq = Math.max(st.seq || 0, st.items.reduce(function (n, e) { return Math.max(n, e.id || 0); }, 0)) + 1;
    var title = plain(entry.title || text.split('\n')[0]), chars = G.FX.recordBadge.titleChars;
    var e = { id: st.seq, key: key, kind: kind, date: date, title: title.length > chars ? title.slice(0, chars) + '…' : title, text: text,
      img: typeof entry.img === 'string' ? entry.img : '', source: origin, read: false };
    st.items.push(e); trim(); R.refresh();
    if (view && view.win.el.isConnected) view.render();
    return e;
  };
  R.addNews = function (news) {
    (news || []).forEach(function (m) {
      if (!m || !m.text) return;
      R.add('history', { text: m.text, title: m.title, img: m.img || (m.icon && m.icon.src), source: m.source, date: m.recordDate });
    });
  };
  /** 예전 알림 호출도 같은 기록 경로로 모은다. 위험·조작 결과의 일반 알림은 그대로 둔다. */
  R.captureToast = function (text, icon, opt) {
    if (!state()) return false;
    opt = opt || {};
    var t = plain(text), picture = icon && typeof icon === 'object' && icon.src;
    var evidence = /^(단서를 얻었다|단서가 겹쳤다|단서 「|증거 등급|현장 기록|후원자에게 바쳤다|돌려받았다|보물 지도의 증거)/.test(t);
    if (!opt.record && !evidence && !picture) return false;
    var body = opt.body || t;
    // 물건 그림 알림은 해당 물건의 설명도 함께 보관한다.
    if (picture && !opt.body && G.R && state() && state().player) {
      var item = (state().player.items || []).filter(function (it) { return t.indexOf(G.R.itemName(it)) >= 0; }).slice(-1)[0];
      var def = item && (G.ITEM[item.id] || (G.RELIC && G.RELIC[item.id])), desc = item && (item.desc || (def && def.desc));
      if (desc) body += '\n\n' + desc;
    }
    R.add(opt.record === 'history' ? 'history' : 'evidence', { text: body, title: opt.title || t, img: opt.img || picture, source: opt.source, key: opt.recordKey, date: opt.date });
    return true;
  };
  R.open = function () {
    if (view && view.win.el.isConnected) return view.win.result;
    if (G.UI.busy()) return Promise.resolve(null);
    var win = G.UI.window({ title: '증거·역사 기록함', icon: 'scroll', width: 1080, height: 650, pauseScene: true, clickAny: false,
      html: '<div class="record-browser"><div class="record-filters"><button type="button" data-filter="all">전체</button><button type="button" data-filter="evidence">증거·단서</button><button type="button" data-filter="history">역사</button><span class="record-count"></span></div>' +
        '<div class="record-columns"><div class="record-list" role="list" aria-label="기록 목록" tabindex="0" data-native-scroll></div><article class="record-detail" tabindex="0" data-native-scroll aria-label="기록 원문"></article></div></div>',
      buttons: [{ label: '모두 읽음', value: 'read', onClick: function () { var st = store(); st.items.forEach(function (e) { e.read = true; }); trim(); R.refresh(); render(); return false; } }, { label: '닫기', value: null, cls: 'navy' }],
      onClose: function () { view = null; R.refresh(); } });
    var filter = 'all', selected = null, list = win.content.querySelector('.record-list'), detail = win.content.querySelector('.record-detail');
    function renderDetail() {
      if (!selected) { detail.innerHTML = '<div class="record-empty">왼쪽에서 기록을 고르면 원문과 그림을 볼 수 있습니다.<br>아직 읽지 않은 기록은 배지에 남습니다.</div>'; return; }
      var img = imageSrc(selected.img);
      detail.innerHTML = '<div class="record-meta">' + U.esc(label(selected.kind) + ' · ' + dateText(selected.date) + (selected.source ? ' · ' + selected.source : '')) + '</div><h3>' + U.esc(selected.title) + '</h3>' +
        (img ? '<img class="record-picture" src="' + U.esc(img) + '" alt="' + U.esc(selected.title) + '">' : '') + '<div class="record-text">' + U.esc(selected.text) + '</div>';
      detail.scrollTop = 0;
    }
    function render() {
      var y = list.scrollTop, items = R.items().reverse().filter(function (e) { return filter === 'all' || e.kind === filter; });
      list.innerHTML = items.map(function (e) { return '<button type="button" class="record-row' + (!e.read ? ' unread' : '') + (selected && selected.id === e.id ? ' selected' : '') + '" data-record-id="' + e.id + '" aria-pressed="' + !!(selected && selected.id === e.id) + '">' +
        '<span class="record-row-meta">' + U.esc(label(e.kind)) + (!e.read ? ' · 새 기록' : '') + ' · ' + U.esc(dateText(e.date)) + '</span><span class="record-row-title">' + U.esc(e.title) + '</span></button>'; }).join('') || '<div class="record-empty">이 갈래의 기록이 없습니다.</div>';
      list.scrollTop = y;
      win.content.querySelector('.record-count').textContent = '읽지 않은 기록 ' + R.unread() + '건';
      [].forEach.call(win.content.querySelectorAll('[data-filter]'), function (b) { var on = b.dataset.filter === filter; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    }
    win.content.addEventListener('click', function (ev) {
      var row = ev.target.closest('[data-record-id]'), tab = ev.target.closest('[data-filter]');
      if (tab) { filter = tab.dataset.filter; render(); }
      if (row) {
        selected = R.items().filter(function (e) { return String(e.id) === row.dataset.recordId; })[0];
        if (selected) { selected.read = true; R.refresh(); render(); renderDetail(); }
      }
    });
    win.content.addEventListener('keydown', function (ev) {
      var b = ev.target.closest('button');
      if (b && (ev.key === 'Enter' || ev.key === ' ' || ev.code === 'Space')) { ev.preventDefault(); ev.stopPropagation(); if (!ev.repeat) b.click(); }
    });
    view = { win: win, render: render }; render(); renderDetail();
    return win.result;
  };
})(window.G = window.G || {});
