/* 항해일지 책과 자택의 서고 (G.LogBooks) — 2026-10-24 사용자 요청
   「일지는 40년 단위로 정리가 되어 자택과 모항 도서관에 배치되게 해줘. 그보다 짧은 기간 여행했다면 '플레이어명' 항해일지로,
    40년 이상이면 '플레이어명' 항해일지 1부, 2부로 볼 수 있게. 자택에는 서고를 만들어줘. 서고에는 일지뿐만 아니라 발견물 중에 얻은 책들도 꽂을 수 있어.」
   ■ 권(卷): 게임을 시작한 날(s.logArc.d0)부터 40년(G.BALANCE.logbooks.years)마다 한 권 — 1권 1480. 5. 1. ~ 1520. 4. 30.
     · 모두 한 권뿐(40년이 안 됨) → 「<제독> 항해일지」 · 40년을 넘기면 → 「<제독> 항해일지 1부」·「2부」…
     · 다 쓴 권은 그때의 제독 이름으로 묶는다 (대를 이으면 다음 권은 뒤를 이은 제독의 이름) · 쓰고 있는 권은 지금 제독의 이름
   ■ 수첩의 「일지」는 800줄(G.BALANCE.journal.cap)까지만 두고 넘치면 지운다 (js/systems/journal.js J.trim).
     지워지는 줄은 버리지 않고 쓰고 있는 권의 묶음(s.logArc.old)으로 옮긴다 (J.onDrop) — 나라끼리의 해전 분위기 소식(작은 소식)만은 버린다.
     권을 다 쓰면(40년이 지나면) 그 기간의 줄을 묶음과 일지에서 모아 한 권으로 엮는다 (s.logArc.vols) — 한 권은 volCap(1500)줄까지, 넘치면 일지와 같은 규칙(등급 몫)으로 줄인다.
   ■ 놓이는 곳: 자택의 「서고」(HM.menu — js/city/misc.js)와 모항(s.player.home) 도서관의 서가 (js/city/bookshelf.js — 맨 앞, 남색 책등)
   ■ 서고(s.study): 발견물에서 얻은 책(유물 가운데 서적 — kind 'book')을 소지품·보관함에서 꽂는다. 꽂은 책은 소지품 칸을 차지하지 않고, 꺼내 다시 들고 갈 수 있다.
     · 아직 보고·발표하지 않은 발견의 증거인 책은 꽂지 못한다 (보고할 때 내밀어야 하니) · 서고는 집에 있으니 대를 이어도 그대로
   ■ 필사본(s.studyCopies, 2026-10-26): 도서관 서가에서 한 번이라도 읽은 책(G.BOOKS)은 필사본으로 꽂는다 — 집에서 펼쳐 그 책에서 얻은 단서·찾은 곳을 다시 본다 (LBK.copies) */
(function (G) {
  'use strict';
  var U = G.U;
  var LBK = G.LogBooks = {};
  function S() { return G.Game && G.Game.state; }
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.logbooks = G.BALANCE.logbooks || {};
  (function (b) {
    if (b.years == null) b.years = 40;      // 한 권에 담는 햇수
    if (b.volCap == null) b.volCap = 1500;  // 다 쓴 한 권의 줄 수
    if (b.bufCap == null) b.bufCap = 2500;  // 쓰고 있는 권의, 일지에서 밀려난 줄 묶음
  })(G.BALANCE.logbooks);
  function K() { return G.BALANCE.logbooks; }

  // ---------------------------------------------------------------- 보관 상태
  /** s.logArc = { d0: 시작한 날(dateNum), vols: [{no, from, to, name, lines}], old: [일지에서 밀려난 줄] } */
  LBK.arc = function (s) {
    s = s || S(); if (!s) return null;
    var a = s.logArc;
    if (!a || typeof a !== 'object') a = s.logArc = {};
    if (!Array.isArray(a.vols)) a.vols = [];
    if (!Array.isArray(a.old)) a.old = [];
    if (!a.d0) {
      var st = s.date && s.day ? U.addDays(s.date, -Math.round(s.day)) : s.date || { y: 1480, m: 5, d: 1 };
      var d0 = U.dateNum(st);
      if (s.log && s.log.length && s.log[0] && s.log[0].d < d0) d0 = s.log[0].d;
      a.d0 = d0;
    }
    return a;
  };
  /** k권(1부터)이 시작하는 날 */
  LBK.bound = function (k, a) {
    a = a || LBK.arc();
    var y0 = Math.floor(a.d0 / 10000), md = a.d0 % 10000;
    return (y0 + K().years * (k - 1)) * 10000 + md;
  };
  /** 그날이 들어가는 권 */
  LBK.volOf = function (d, a) {
    a = a || LBK.arc();
    var y0 = Math.floor(a.d0 / 10000), md0 = a.d0 % 10000, y = Math.floor(d / 10000), md = d % 10000;
    var el = y - y0 - (md < md0 ? 1 : 0);
    return Math.max(1, Math.floor(el / K().years) + 1);
  };
  LBK.curVol = function () { var s = S(); return LBK.volOf(U.dateNum(s.date)); };
  function byDate(list) {
    return list.map(function (e, i) { return { e: e, i: i }; }).sort(function (x, y) { return x.e.d - y.e.d || x.i - y.i; }).map(function (x) { return x.e; });
  }
  function copy(e) { var o = { d: e.d, t: e.t, g: e.g }; if (e.k) o.k = e.k; return o; }
  /** 묶음과 일지에서 [lo, hi) 기간의 줄 (묶음이 먼저 — 같은 날이면 먼저 적힌 줄이 앞) */
  function gather(a, s, lo, hi) {
    var inR = function (e) { return e && e.d >= lo && (hi == null || e.d < hi); };
    return byDate(a.old.filter(inR).concat((s.log || []).filter(inR)));
  }
  /** k권을 엮는다 (다 쓴 권) */
  function close(a, s, k) {
    var lo = k === 1 ? -Infinity : LBK.bound(k, a), hi = LBK.bound(k + 1, a);
    var lines = gather(a, s, lo, hi).map(copy);
    if (lines.length > K().volCap && G.Journal && G.Journal.trim) G.Journal.trim(lines, K().volCap);
    a.vols.push({ no: k, from: LBK.bound(k, a), to: hi, name: s.player.name, lines: lines });
    a.old = a.old.filter(function (e) { return e.d >= hi; });
  }
  /** 40년이 지났으면 다 쓴 권을 엮는다 */
  LBK.roll = function () {
    var s = S(); if (!s || !s.date) return 0;
    var a = LBK.arc(s), cur = LBK.curVol(), n = 0;
    while (a.vols.length < cur - 1) { close(a, s, a.vols.length + 1); n++; }
    return n;
  };
  /** 일지(s.log)가 넘쳐 지워진 줄 — js/systems/journal.js J.trim 이 부른다 */
  LBK.onDrop = function (log, gone) {
    var s = S(); if (!s || log !== s.log || !gone || !gone.length) return;
    var a = LBK.arc(s), J = G.Journal;
    var first = a.vols.length + 1;   // 아직 엮지 않은 권부터
    gone.forEach(function (e) {
      if (!e || (J && J.minor && J.minor(e))) return;    // 작은 소식은 버린다
      if (LBK.volOf(e.d, a) >= first) a.old.push(copy(e));
    });
    LBK.roll();
    if (a.old.length > K().bufCap && J && J.trim) { a.old = byDate(a.old); J.trim(a.old, K().bufCap); }
  };

  // ---------------------------------------------------------------- 권 목록
  function title(name, no, total) { return (name || '제독') + ' 항해일지' + (total > 1 ? ' ' + no + '부' : ''); }
  function ymd(d) { return Math.floor(d / 10000) + '. ' + (Math.floor(d / 100) % 100) + '. ' + (d % 100) + '.'; }
  LBK.ymd = ymd;
  /** 지금까지의 항해일지 — [{no, title, from, to, open, count, lines()}] (앞 권부터) */
  LBK.volumes = function () {
    var s = S(); if (!s) return [];
    LBK.roll();
    var a = LBK.arc(s), cur = LBK.curVol(), total = cur, out = [];
    a.vols.forEach(function (v) {
      out.push({ no: v.no, title: title(v.name, v.no, total), name: v.name, from: v.from, to: U.dateNum(U.addDays({ y: Math.floor(v.to / 10000), m: Math.floor(v.to / 100) % 100, d: v.to % 100 }, -1)),
        open: false, count: v.lines.length, lines: function () { return v.lines; } });
    });
    var lo = cur === 1 ? -Infinity : LBK.bound(cur, a);
    var now = gather(a, s, lo, null);
    out.push({ no: cur, title: title(s.player.name, cur, total), name: s.player.name, from: LBK.bound(cur, a), to: U.dateNum(s.date), open: true, count: now.length,
      lines: function () { return gather(a, s, lo, null); } });
    return out;
  };
  /** 모항 도서관 서가에 꽂힐 책 (js/city/bookshelf.js) — 모항이 아니면 없다 */
  LBK.forLibrary = function (c) {
    var s = S(); if (!s || !c || c.id !== s.player.home) return [];
    return LBK.volumes().map(function (v) {
      return { id: 'logbook' + v.no, jv: true, vol: v, title: v.title, name: v.title, author: v.name, lang: -1, y: 0, libs: [c.id], discs: [] };
    });
  };
  function rangeText(v) { return ymd(v.from) + ' ~ ' + (v.open ? '지금' : ymd(v.to)); }
  LBK.rangeText = rangeText;
  LBK.stateText = function (v) { return rangeText(v) + ' · ' + U.num(v.count) + '줄' + (v.open ? ' · 지금 쓰고 있는 권' : ''); };

  // ---------------------------------------------------------------- 읽기
  /** 한 권을 펼친다 — 해마다 묶어 날짜와 내용 */
  LBK.read = async function (v) {
    var UI = G.UI, lines = v.lines(), y = null, h = '';
    if (G.Audio) G.Audio.sfx('page');
    h += '<div class="lbk-head"><b>' + U.esc(v.title) + '</b><span class="muted">' + rangeText(v) + ' · ' + U.num(lines.length) + '줄</span></div>';
    if (!lines.length) h += '<div class="muted">아직 아무것도 적히지 않았다.</div>';
    h += '<div class="lbk-body">';
    lines.forEach(function (l) {
      var ly = Math.floor(l.d / 10000);
      if (ly !== y) { y = ly; h += '<h4 class="lbk-year">' + ly + '년</h4>'; }
      h += '<div class="lbk-line"><span class="muted">' + (Math.floor(l.d / 100) % 100) + '. ' + (l.d % 100) + '.</span><span>' + U.esc(l.t) + '</span></div>';
    });
    h += '</div>';
    var w = UI.window({ title: U.esc(v.title), icon: 'book', width: 900, html: h, buttons: [{ label: '덮는다', value: 1, cls: 'navy' }] });
    w.el.classList.add('lbkwin');
    await w.result;
  };

  // ---------------------------------------------------------------- 서고 (s.study)
  function R() { return G.R; }
  LBK.study = function () { var s = S(); return s.study || (s.study = []); };
  function def(it) { return (G.ITEM && G.ITEM[it.id]) || (G.RELIC && G.RELIC[it.id]) || null; }
  /** 발견물에서 얻은 책인가 */
  LBK.isBook = function (it) { var d = it && def(it); return !!(d && (d.kind || it.kind) === 'book'); };
  /** 서고에 꽂을 수 있는 책: 소지품·보관함의 책 — 아직 보고하지 않은 증거는 빼고 */
  LBK.candidates = function () {
    var s = S(), out = [];
    s.player.items.forEach(function (it) { if (LBK.isBook(it)) out.push({ it: it, from: 'items', proof: R().isProof(it) }); });
    R().storage().forEach(function (it) { if (LBK.isBook(it)) out.push({ it: it, from: 'storage', proof: false }); });
    return out;
  };
  /** 한 권을 꽂는다 */
  LBK.shelve = function (it) {
    var s = S(), p = s.player, list = null;
    if (!LBK.isBook(it) || R().isProof(it)) return false;
    if (p.items.indexOf(it) >= 0) list = p.items; else if (R().storage().indexOf(it) >= 0) list = R().storage();
    if (!list) return false;
    list.splice(list.indexOf(it), 1);
    LBK.study().push(it);
    return true;
  };
  /** 한 권을 꺼내 소지품으로 (칸이 모자라면 못 꺼낸다) */
  LBK.unshelve = function (it) {
    var st = LBK.study(), i = st.indexOf(it), p = S().player;
    if (i < 0 || R().slotsUsed() >= R().ITEM_MAX) return false;
    st.splice(i, 1); p.items.push(it); if (R().mergeItems) R().mergeItems();
    return true;
  };
  function bookName(it) { return R().itemName(it); }
  function bookFrom(it) { var d = def(it), dc = d && d.relic && G.DISC && G.DISC[d.relic]; return dc ? dc.name : ''; }

  // ---------------------------------------------------------------- 도서관에서 읽은 책의 필사본 (s.studyCopies) — 2026-10-26 사용자 요청
  /* 「자택에 읽은 발견물 책 꽂는 기능이 없어」 — 도서관 서가의 책(발견물의 단서가 실린 사료, G.BOOKS)은 그 자리에서 읽고 두고 오는 책이라
     서고에 꽂을 길이 없었다. 한 번이라도 읽은 책(s.flags['read_<책>'])은 필사본으로 서고에 꽂는다.
     · 소지품·보관함을 거치지 않는다 (책 id만 s.studyCopies에 남긴다) · 빼면 다시 「꽂을 책」으로 돌아간다 · 서고는 집에 있으니 대를 이어도 그대로
     · 집에서 펼치면 그 책에서 얻은 단서와, 그 책에 적힌 곳 가운데 이미 찾은 곳을 본다 — 날은 지나지 않고 새 단서는 얻지 않는다
       (말 실력이 늘어 새로 읽히는 대목은 도서관 서가에서 다시 읽어야 한다 — G.Scenes.city.B.library.homeRead) */
  LBK.copies = function () { var s = S(); return s.studyCopies || (s.studyCopies = []); };
  /** 한 번이라도 읽은 도서관 책 */
  LBK.readBooks = function () { var s = S(), f = (s && s.flags) || {}; return (G.BOOKS || []).filter(function (b) { return !!f['read_' + b.id]; }); };
  /** 꽂은 필사본 (책 정의 — 사라진 책 id는 건너뛴다) */
  LBK.copyBooks = function () { return LBK.copies().map(function (id) { return G.BOOK && G.BOOK[id]; }).filter(Boolean); };
  /** 아직 꽂지 않은, 읽은 책 */
  LBK.copyCandidates = function () { var have = {}; LBK.copies().forEach(function (id) { have[id] = 1; }); return LBK.readBooks().filter(function (b) { return !have[b.id]; }); };
  /** 필사본 한 권을 꽂는다 (읽은 책만) */
  LBK.shelveCopy = function (b) {
    var s = S(); if (!b || !G.BOOK || !G.BOOK[b.id] || !(s.flags && s.flags['read_' + b.id]) || LBK.copies().indexOf(b.id) >= 0) return false;
    LBK.copies().push(b.id); return true;
  };
  /** 필사본 한 권을 서고에서 뺀다 */
  LBK.unshelveCopy = function (b) { var a = LBK.copies(), i = a.indexOf(b && b.id); if (i < 0) return false; a.splice(i, 1); return true; };
  /** 꽂을 수 있는 것이 하나라도 있나 (발견물의 책 + 읽은 책) */
  LBK.canAdd = function () { return LBK.candidates().length > 0 || LBK.copyCandidates().length > 0; };
  function LIB() { return G.Scenes && G.Scenes.city && G.Scenes.city.B && G.Scenes.city.B.library; }
  /** 필사본 책등 아래 한 줄: 지은이·말·이 책에서 얻은 단서 수 */
  function copyLine(b) {
    var L = LIB(), n = L && L.fromBook ? L.fromBook(b) : null;
    return U.esc(b.author || '지은이 모름') + ' · ' + U.esc((G.LANGS && G.LANGS[b.lang]) || '') + (n ? ' · 이 책에서 얻은 단서 ' + n.hints.length + '곳' + (n.found.length ? ' · 찾은 곳 ' + n.found.length + '곳' : '') : '');
  }

  var SPINE = ['#5b3a1e', '#3e4a2c', '#4a2f3c', '#2f4250', '#6a4a22', '#47322a', '#3a3f5a', '#58402a'];
  function spine(cls, i, w, h, lab, col) {
    return '<div class="bk real ' + cls + '" data-i="' + i + '" style="width:' + w + 'px;height:' + h + 'px' + (col ? ';--c:' + col : '') + '"><i class="lab">' + (lab ? '<em>' + U.esc(lab) + '</em>' : '') + '</i></div>';
  }
  /** 자택의 서고 */
  LBK.open = async function (c, place) {
    var UI = G.UI;
    for (;;) {
      var act = await studyWin(c, place);
      if (!act) return;
      if (act.kind === 'jv') { await LBK.read(act.v); continue; }
      if (act.kind === 'add') { await addBooks(); continue; }
      if (act.kind === 'bk') {
        var it = act.it, nm = bookName(it), full = R().slotsUsed() >= R().ITEM_MAX;
        var v = await UI.choose(nm, [
          { label: '펼쳐 본다', value: 'read', icon: 'book' },
          { label: '꺼내 들고 간다', value: 'take', icon: 'chest', disabled: full, right: full ? '소지품 칸이 모자란다' : '소지품 ' + R().slotsUsed() + '/' + R().ITEM_MAX },
          { label: '그대로 둔다', value: null }
        ], { width: 480 });
        if (v === 'read') await readBook(it);
        else if (v === 'take') { if (LBK.unshelve(it)) UI.toast('「' + nm + '」' + U.jx(nm, '을/를') + ' 꺼냈다.', 'book'); }
      }
      if (act.kind === 'cp') {   // 도서관에서 읽은 책의 필사본
        var b = act.b, bt = b.title || b.name;
        var cv = await UI.choose(bt, [
          { label: '펼쳐 본다', value: 'read', icon: 'book', right: '날은 지나지 않는다' },
          { label: '서고에서 뺀다', value: 'out', icon: 'boot', right: '다시 꽂을 수 있다' },
          { label: '그대로 둔다', value: null }
        ], { width: 480 });
        if (cv === 'read') { var L = LIB(); if (L && L.homeRead) await L.homeRead(b); }
        else if (cv === 'out') { if (LBK.unshelveCopy(b)) UI.toast('「' + bt + '」 필사본을 서고에서 뺐다.', 'book'); }
      }
    }
  };
  async function readBook(it) {
    var UI = G.UI, d = def(it) || {}, from = bookFrom(it), nm = bookName(it);
    var src = G.Img && G.Img.itemSrc ? G.Img.itemSrc(it) : null;
    if (G.Audio) G.Audio.sfx('page');
    var h = '<div style="display:flex;gap:16px;align-items:flex-start">' + (src ? '<img src="' + src + '" alt="" style="width:120px;height:120px;object-fit:contain;flex:0 0 120px">' : '') +
      '<div style="font-size:18px;line-height:1.7"><b style="font-size:21px">' + U.esc(nm) + '</b>' + (from ? '<div class="muted">「' + U.esc(from) + '」에서 얻은 책</div>' : '') +
      '<div style="margin-top:8px">' + U.esc(it.desc || d.desc || '') + '</div></div></div>';
    await UI.window({ title: '서고 — ' + U.esc(nm), icon: 'book', width: 720, clickAny: true, html: h, buttons: [{ label: '덮는다', value: 1, cls: 'navy' }] }).result;
  }
  async function addBooks() {
    var UI = G.UI;
    for (;;) {
      var cand = LBK.candidates(), copies = LBK.copyCandidates();
      if (!cand.length && !copies.length) { await UI.alert('꽂을 책이 없다 — 도서관에서 읽은 책은 필사본으로, 발견물에서 얻은 책(탁본·해도·기록)은 소지품이나 보관함에 두면 여기에 꽂을 수 있다.'); return; }
      var ok = cand.filter(function (x) { return !x.proof; });
      var opts = cand.map(function (x, i) {
        var from = bookFrom(x.it);
        return { label: U.esc(bookName(x.it)) + (from ? ' <small class="muted">' + U.esc(from) + '</small>' : ''), value: 'i:' + i, icon: 'book', disabled: x.proof,
          right: x.proof ? '보고·발표하면 꽂을 수 있다' : x.from === 'storage' ? '보관함' : '소지품' };
      });
      // 도서관에서 읽은 책 — 필사본 (소지품을 거치지 않는다)
      copies.forEach(function (b) {
        opts.push({ label: U.esc(b.title || b.name) + ' <small class="muted">' + U.esc(b.author || '지은이 모름') + '</small>', value: 'c:' + b.id, icon: 'scroll', right: '필사본 · 도서관에서 읽은 책' });
      });
      var nAll = ok.length + copies.length;
      if (nAll > 1) opts.unshift({ label: '모두 꽂는다 (' + nAll + '권)', value: 'all', icon: 'plus' });
      opts.push({ label: '그만둔다', value: null });
      var v = await UI.choose('서고 — 어느 책을 꽂을까?', opts, { width: 680, text: '꽂은 책은 소지품 칸을 차지하지 않습니다. 발견물의 책은 언제든 꺼내 갈 수 있고, 도서관에서 읽은 책은 필사본으로 꽂아 집에서 다시 펼쳐 봅니다.' });
      if (v == null) return;
      if (v === 'all') {
        ok.forEach(function (x) { LBK.shelve(x.it); });
        copies.forEach(function (b) { LBK.shelveCopy(b); });
        if (G.Game.refreshHud) G.Game.refreshHud(); return;
      }
      if (String(v).indexOf('c:') === 0) LBK.shelveCopy(G.BOOK[String(v).slice(2)]);
      else { var x0 = cand[+String(v).slice(2)]; if (x0) LBK.shelve(x0.it); }
      if (G.Game.refreshHud) G.Game.refreshHud();
    }
  }
  function studyWin(c, place) {
    var UI = G.UI, vols = LBK.volumes(), books = LBK.study().slice(), cps = LBK.copyBooks(), reals = [], PER = 24;
    // 칸: 맨 위 항해일지 → 도서관에서 읽은 책의 필사본 → 발견물에서 얻은 책 (칸마다 24권)
    var rows = [vols.map(function (v) { return { jv: v }; })];
    for (var j = 0; j < cps.length; j += PER) rows.push(cps.slice(j, j + PER).map(function (b) { return { cp: b }; }));
    for (var i = 0; i < books.length; i += PER) rows.push(books.slice(i, i + PER).map(function (it) { return { it: it }; }));
    while (rows.length < 2) rows.push([]);
    var rng = U.makeRng(U.strHash('study:' + (S().player.home || 0)));
    var html = '<div class="bshelf-head"><span class="lg"><i class="bk jv"></i>항해일지</span><span class="lg"><i class="bk copy"></i>도서관에서 읽은 책 (필사본)</span><span class="lg"><i class="bk tome"></i>발견물에서 얻은 책</span>' +
      '<span class="cnt">항해일지 ' + vols.length + '권 · 필사본 ' + cps.length + '권 · 발견물의 책 ' + books.length + '권</span></div><div class="bcase">';
    rows.forEach(function (row, ri) {
      html += '<div class="brow"><div class="bline">';
      if (!row.length) html += '<div class="bempty">' + (ri === 1 && !books.length && !cps.length ? '빈 칸 — 도서관에서 읽은 책(필사본)이나 발견물에서 얻은 책을 꽂을 수 있다' : '') + '</div>';
      row.forEach(function (x) {
        var n = reals.length; reals.push(x);
        if (x.jv) html += spine('jv' + (x.jv.open ? ' writing' : ''), n, 46, 140, x.jv.no + '부');
        else if (x.cp) html += spine('copy', n, 32 + Math.floor(rng() * 10), 118 + Math.floor(rng() * 24), '');
        else html += spine('tome', n, 30 + Math.floor(rng() * 12), 108 + Math.floor(rng() * 28), '', SPINE[Math.floor(rng() * SPINE.length)]);
      });
      html += '</div><div class="bplank"></div></div>';
    });
    html += '</div><div class="bplate"></div>';
    var api, focus = -1;
    function plate(i) {
      var p = api.content.querySelector('.bplate'), x = reals[i];
      if (!x) { p.innerHTML = '<span class="muted">책을 누르면 펼쳐 봅니다. 맨 윗칸은 항해일지 — 40년마다 한 권으로 엮입니다.</span>'; return; }
      if (x.jv) p.innerHTML = '<span class="pk jv"></span><b>' + U.esc(x.jv.title) + '</b><br><span class="st">' + LBK.stateText(x.jv) + '</span>';
      else if (x.cp) p.innerHTML = '<span class="pk copy"></span><b>' + U.esc(x.cp.title || x.cp.name) + '</b><span class="muted"> · 필사본</span><br><span class="st">' + copyLine(x.cp) + '</span>';
      else { var f = bookFrom(x.it); p.innerHTML = '<span class="pk tome"></span><b>' + U.esc(bookName(x.it)) + '</b>' + (f ? '<span class="muted"> · 「' + U.esc(f) + '」</span>' : '') + '<br><span class="st">' + U.esc(String(x.it.desc || (def(x.it) || {}).desc || '')) + '</span>'; }
    }
    function pick(i) { var x = reals[i]; if (!x) return; api.close(x.jv ? { kind: 'jv', v: x.jv } : x.cp ? { kind: 'cp', b: x.cp } : { kind: 'bk', it: x.it }); }
    var canAdd = LBK.canAdd();
    api = UI.window({ title: (place || '자택') + ' — 서고', icon: 'book', width: 1240, parch: false, html: html,
      buttons: [{ label: '책을 꽂는다', value: { kind: 'add' }, icon: 'plus', disabled: !canAdd, title: '꽂을 책이 없다 — 도서관에서 책을 읽거나, 발견물에서 책을 얻자' }, { label: '닫는다', value: null }],
      onKey: function (e) {
        if (G.Keys.is(e, 'left') || G.Keys.is(e, 'up')) { focus = Math.max(0, focus - 1); mark(); return true; }
        if (G.Keys.is(e, 'right') || G.Keys.is(e, 'down')) { focus = Math.min(reals.length - 1, focus + 1); mark(); return true; }
        if ((G.Keys.is(e, 'confirm') || G.Keys.is(e, 'confirmAlt')) && focus >= 0) { pick(focus); return true; }
        return false;
      } });
    function mark() { U.$$('.bk.real', api.content).forEach(function (e) { e.classList.toggle('focus', +e.getAttribute('data-i') === focus); }); plate(focus); }
    api.el.classList.add('shelfwin', 'studywin');
    U.$$('.bk.real', api.content).forEach(function (e) {
      var i = +e.getAttribute('data-i');
      e.addEventListener('mouseenter', function () { plate(i); });
      e.addEventListener('mouseleave', function () { plate(focus); });
      e.addEventListener('click', function () { pick(i); });
    });
    plate(-1);
    return api.result;
  }
})(window.G = window.G || {});
