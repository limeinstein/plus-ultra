/* 갈래로 거르기·정렬 · 소지품 고정 (2026-10-29 피드백)
   · 「발견물 보고 때(후원자·항구) 갈래별(지리·보물·교역품 …)로 정렬하거나 거르기」 → G.DiscPick: 일괄 보고·발표 창의 UI.checkTools 에 넣을 갈래·정렬 설정
   · 「소지품을 고정(즐겨찾기처럼)해 일괄 매각·모두 맡기기에서 빠지게」 → G.ItemPin: player.pin = {물건 id: 1}
   · 「모두 맡기기 때 항해도구(라임·고양이·육분의 …)는 빼고 · 거르기 방식」 → G.ItemCat: 소지품의 갈래(무기·방어구·항해도구 …)
   · 「맡기거나 팔면 소지품 창 스크롤이 처음으로 돌아간다」 → G.KeepScroll: 다시 그려도 스크롤 자리를 이어 간다
   옛 저장에는 player.pin 이 없다 — 쓸 때 만든다. */
(function (G) {
  'use strict';
  var U = G.U;
  function S() { return G.Game && G.Game.state; }

  // ---------------------------------------------------------------- 발견물: 갈래·정렬
  var DP = G.DiscPick = {};
  /** 줄에 붙일 data- 속성: 갈래·이름·찾은 날 (+ 덧붙일 값 extra {val}) */
  DP.attrs = function (d, extra) {
    var s = S(), rec = s && s.disc && s.disc[d.id], found = (rec && rec.found) || 0;
    return ' data-cat="' + U.esc(d.cat || '') + '" data-name="' + U.esc(d.name || '') + '" data-found="' + found + '"' + (extra && extra.val != null ? ' data-val="' + Math.round(extra.val) + '"' : '');
  };
  function catIdx(k) { var o = Object.keys(G.DISC_CATS || {}), i = o.indexOf(k); return i < 0 ? 99 : i; }
  /** UI.checkTools 에 더할 설정 — first: 처음 차례의 이름 (「값진 순」 등) · val: data-val 로 「값 높은 순」 */
  DP.opts = function (first, val, state) {
    var sorts = [{ id: 'base', label: first || '처음 차례' },
      { id: 'cat', label: '갈래', key: function (r) { return String(100 + catIdx(r.getAttribute('data-cat'))) + (r.getAttribute('data-name') || ''); } },
      { id: 'name', label: '이름', key: function (r) { return r.getAttribute('data-name') || ''; } },
      { id: 'found', label: '최근에 찾은 것', key: function (r) { return +r.getAttribute('data-found') || 0; }, desc: true }];
    if (val) sorts.splice(1, 0, { id: 'val', label: val, key: function (r) { return +r.getAttribute('data-val') || 0; }, desc: true });
    return { cat: function (r) { return r.getAttribute('data-cat') || ''; }, catName: function (k) { return (G.DISC_CATS && G.DISC_CATS[k]) || k; },
      catOrder: Object.keys(G.DISC_CATS || {}), sorts: sorts, state: state };
  };
  DP.state = {};   // 창을 다시 열어도 갈래·정렬을 이어 간다 (게임을 끄면 처음으로)

  // ---------------------------------------------------------------- 소지품: 갈래
  var IC = G.ItemCat = {};
  IC.ORDER = ['weapon', 'armor', 'tool', 'gift', 'mgift', 'fig', 'special', 'treasure', 'keepsake', 'relic', 'evidence', 'etc'];
  var EXTRA = { relic: '발견 유물', fig: '선수상', evidence: '증거품', keepsake: '소중한 물건', etc: '그 밖' };
  /** 물건의 갈래 열쇠 */
  IC.of = function (it) {
    if (!it) return 'etc';
    if (G.RELIC && G.RELIC[it.id]) return 'relic';
    var d = G.ITEM && G.ITEM[it.id], k = (d && d.kind) || it.kind;
    if (k === 'evidence' || k === 'clue') return 'evidence';
    if (G.FIGUREHEAD && G.FIGUREHEAD[it.id]) return 'fig';
    return k && (G.ITEM_KIND && G.ITEM_KIND[k] || EXTRA[k]) ? k : 'etc';
  };
  IC.name = function (k) { return (G.ITEM_KIND && G.ITEM_KIND[k]) || EXTRA[k] || k; };
  IC.idx = function (k) { var i = IC.ORDER.indexOf(k); return i < 0 ? 98 : i; };
  /** 줄에 붙일 data- 속성 (val: 값, 없으면 0) */
  IC.attrs = function (it, val) {
    var k = IC.of(it);
    return ' data-icat="' + k + '" data-name="' + U.esc(G.R && G.R.itemName ? G.R.itemName(it) : it.name || it.id) + '" data-val="' + Math.round(val || 0) + '"' + (IP.is(it) ? ' data-pin="1"' : '');
  };
  /** UI.checkTools 에 더할 설정 */
  IC.opts = function (state, withVal) {
    var sorts = [{ id: 'base', label: '가진 차례' },
      { id: 'kind', label: '종류', key: function (r) { return String(100 + IC.idx(r.getAttribute('data-icat'))) + (r.getAttribute('data-name') || ''); } },
      { id: 'name', label: '이름', key: function (r) { return r.getAttribute('data-name') || ''; } },
      { id: 'pin', label: '고정한 것 먼저', key: function (r) { return r.getAttribute('data-pin') ? 0 : 1; } }];
    if (withVal) sorts.splice(2, 0, { id: 'val', label: '값 높은 순', key: function (r) { return +r.getAttribute('data-val') || 0; }, desc: true });
    return { cat: function (r) { return r.getAttribute('data-icat') || ''; }, catName: IC.name, catOrder: IC.ORDER, sorts: sorts, state: state,
      skipAll: function (r) { return !!r.getAttribute('data-pin'); } };
  };
  IC.state = {};
  /** 거르고 정렬한 소지품 [{it, i, k}] — st = {cat: 갈래 열쇠 | 'pin' | '', sort: 'base' | 'kind' | 'name' | 'pin'} */
  IC.view = function (items, st) {
    st = st || {};
    var arr = (items || []).map(function (it, i) { return { it: it, i: i, k: IC.of(it) }; });
    if (st.cat === 'pin') arr = arr.filter(function (x) { return IP.is(x.it); });
    else if (st.cat) arr = arr.filter(function (x) { return x.k === st.cat; });
    var nm = function (x) { return G.R && G.R.itemName ? G.R.itemName(x.it) : x.it.id; };
    if (st.sort === 'kind') arr.sort(function (a, b) { return (IC.idx(a.k) - IC.idx(b.k)) || nm(a).localeCompare(nm(b), 'ko'); });
    else if (st.sort === 'name') arr.sort(function (a, b) { return nm(a).localeCompare(nm(b), 'ko'); });
    else if (st.sort === 'pin') arr.sort(function (a, b) { return (IP.is(b.it) - IP.is(a.it)) || (a.i - b.i); });
    return arr;
  };
  /** 종류 단추 + 정렬 칸 (data-icf · .icf-sort) */
  IC.barHtml = function (items, st) {
    var n = {}, keys = [], pins = 0;
    (items || []).forEach(function (it) { var k = IC.of(it); if (!n[k]) { n[k] = 0; keys.push(k); } n[k]++; if (IP.is(it)) pins++; });
    keys.sort(function (a, b) { return IC.idx(a) - IC.idx(b); });
    if (st.cat && st.cat !== 'pin' && !n[st.cat]) st.cat = '';
    if (st.cat === 'pin' && !pins) st.cat = '';
    return '<div class="icf-bar"><div class="ck-cats"><button type="button" class="ck-cat' + (st.cat ? '' : ' on') + '" data-icf="">전체 <small>' + (items || []).length + '</small></button>' +
      keys.map(function (k) { return '<button type="button" class="ck-cat' + (st.cat === k ? ' on' : '') + '" data-icf="' + k + '">' + U.esc(IC.name(k)) + ' <small>' + n[k] + '</small></button>'; }).join('') +
      (pins ? '<button type="button" class="ck-cat pin' + (st.cat === 'pin' ? ' on' : '') + '" data-icf="pin">' + G.icon('pin') + '고정 <small>' + pins + '</small></button>' : '') + '</div>' +
      '<label class="ck-sortl">정렬 <select class="icf-sort">' + [['base', '가진 차례'], ['kind', '종류'], ['name', '이름'], ['pin', '고정한 것 먼저']].map(function (o) { return '<option value="' + o[0] + '"' + ((st.sort || 'base') === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label></div>';
  };
  /** 단추·정렬을 잇는다 — 바뀌면 onChange() (다시 그리기) */
  IC.wireBar = function (box, st, onChange) {
    U.$$('[data-icf]', box).forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); st.cat = b.getAttribute('data-icf'); onChange(true); }; });
    var so = box.querySelector('.icf-sort'); if (so) { so.onchange = function () { st.sort = so.value; onChange(true); }; so.onkeydown = function (e) { e.stopPropagation(); }; }
  };

  // ---------------------------------------------------------------- 소지품: 고정 (즐겨찾기)
  var IP = G.ItemPin = {};
  function bag() { var s = S(); if (!s || !s.player) return {}; if (!s.player.pin) s.player.pin = {}; return s.player.pin; }
  IP.is = function (it) { var s = S(); return !!(it && s && s.player && s.player.pin && s.player.pin[it.id]); };
  IP.set = function (it, on) { var b = bag(); if (!it) return; if (on) b[it.id] = 1; else delete b[it.id]; };
  IP.toggle = function (it) { IP.set(it, !IP.is(it)); return IP.is(it); };
  IP.count = function () { var s = S(); return s && s.player && s.player.pin ? (s.player.items || []).filter(IP.is).length : 0; };
  /** 고정 단추 (data-pinid = 물건 id) */
  IP.button = function (it) {
    var on = IP.is(it);
    return '<button type="button" class="pin-b' + (on ? ' on' : '') + '" data-pinid="' + U.esc(it.id) + '" title="' + (on ? '고정 풀기' : '고정 — 일괄 매각의 「전체 선택」과 보관함의 「모두 맡긴다」에서 빠진다') + '" aria-pressed="' + on + '">' + G.icon('pin') + '</button>';
  };
  /** 상자 안의 고정 단추를 잇는다 — 누르면 고정을 바꾸고 그 줄의 data-pin 과 단추 모양을 고친 뒤 onChange() */
  IP.wire = function (box, onChange) {
    U.$$('[data-pinid]', box).forEach(function (b) {
      b.onclick = function (e) {
        e.stopPropagation(); e.preventDefault();
        var id = b.getAttribute('data-pinid'), on = !IP.is({ id: id });
        IP.set({ id: id }, on);
        U.$$('[data-pinid="' + id.replace(/"/g, '') + '"]', box).forEach(function (x) {
          x.classList.toggle('on', on); x.setAttribute('aria-pressed', on);
          x.title = on ? '고정 풀기' : '고정 — 일괄 매각의 「전체 선택」과 보관함의 「모두 맡긴다」에서 빠진다';
          var row = x.closest('[data-icat]'); if (row) { if (on) row.setAttribute('data-pin', '1'); else row.removeAttribute('data-pin'); }
        });
        if (G.Audio) G.Audio.sfx('click');
        if (onChange) onChange(id, on);
      };
    });
  };

  // ---------------------------------------------------------------- 스크롤 자리 이어 가기
  /** 다시 그리기 전에 부른다 — 상자 안 스크롤 칸(sel)들의 자리를 기억해 두었다가, 돌려받은 함수를 그린 뒤에 부르면 되돌린다 */
  /** 가장 가까운 스크롤 칸 (없으면 null) */
  G.scrollParent = function (e) {
    while (e && e !== document.body && e !== document.documentElement) {
      var oy = getComputedStyle(e).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && e.scrollHeight > e.clientHeight) return e;
      e = e.parentElement;
    }
    return null;
  };
  G.KeepScroll = function (box, sel) {
    var els = sel ? U.$$(sel, box) : [box], pos = els.map(function (e) { return e.scrollTop; });
    return function () { var now = sel ? U.$$(sel, box) : [box]; now.forEach(function (e, i) { if (pos[i] != null) e.scrollTop = pos[i]; }); };
  };
})(window.G = window.G || {});
