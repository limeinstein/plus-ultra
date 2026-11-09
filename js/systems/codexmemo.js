/* 도감 기록 (G.CodexMemo) — 2026-11-10 사용자 요청 「도감을 플레이어가 본 이벤트·구입한 아이템·장면만 볼 수 있게」
   · 게임(index.html)에서 본 것을 브라우저 저장소(localStorage 'pu_codex_seen_v1')에 쌓는다. 저장 슬롯과 상관없이 이 브라우저의 모든 항해에 걸쳐 쌓인다.
     ─ 장면 그림: 사건 장면을 띄울 때 (G.FamEv.showPic — 전설·가족·업적 장면 모두 여기를 지난다) → k[그림 키]
     ─ 사람: 대화창에 선 사람 (UI.say) → k[그 사람 고유 그림 키] · n[이름]
     ─ 소지품: 손에 넣은 물건 (R.addItem — 산 것·얻은 것) → it[물건 id]
     ─ 음식: 식당에서 먹은 음식 (G.Growth.meal) → f[음식 id]
     ─ 발견물·업적·동료·가진 물건·날짜: 지금 항해의 저장 상태에서 15초마다 옮겨 적는다 (옛 저장을 불러와도 그만큼은 채워진다)
       d[발견 id] · a[업적 id] · y = 살아 본 가장 늦은 날(년월일 수) — 세계 소식·왕실 사건은 그날이 지났으면 본 것으로
   · 도감(catalog.html ?view=player)이 이것을 읽어 본 것만 보여 준다 (js/catalog.js seenIt). 개발용 전체 도감(?view=assets)은 그대로 모두.
   · 도감 쪽에서는 읽기만 한다 (G.UI 가 없으면 갈고리를 걸지 않는다). */
(function (G) {
  'use strict';
  var CM = G.CodexMemo = {}, KEY = 'pu_codex_seen_v1', mem = null, dirty = false, timer = null;
  function blank() { return { k: {}, n: {}, it: {}, f: {}, d: {}, a: {}, y: 0 }; }
  CM.KEY = KEY;
  CM.load = function (fresh) {
    if (mem && !fresh) return mem;
    var v = null; try { v = window.localStorage && localStorage.getItem(KEY); } catch (e) { v = null; }
    try { mem = v ? JSON.parse(v) : blank(); } catch (e) { mem = blank(); }
    // 저장소가 깨졌거나 다른 형식의 값이 들어 있어도 도감과 게임은 열린다.
    if (!mem || typeof mem !== 'object' || Array.isArray(mem)) mem = blank();
    var b = blank();
    for (var x in b) {
      if (x === 'y') { if (typeof mem.y !== 'number' || !isFinite(mem.y) || mem.y < 0) mem.y = 0; }
      else if (!mem[x] || typeof mem[x] !== 'object' || Array.isArray(mem[x])) mem[x] = {};
    }
    return mem;
  };
  CM.flush = function () {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!dirty) return; dirty = false;
    try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* 저장소가 막혔으면 이번 실행 동안만 */ }
  };
  function mark(bag, id) {
    if (id == null || id === '') return;
    var m = CM.load(); if (!Object.prototype.hasOwnProperty.call(m, bag) || bag === 'y') return;
    if (Object.prototype.hasOwnProperty.call(m[bag], id) && m[bag][id]) return;
    m[bag][id] = 1; dirty = true;
    if (!timer) timer = setTimeout(CM.flush, 800);
  }
  CM.mark = mark;
  CM.reset = function () { mem = blank(); dirty = true; CM.flush(); };   // 시험용
  function day(d) { return d ? d.y * 10000 + (d.m || 1) * 100 + (d.d || 1) : 0; }
  CM.date = day;

  // ---------------------------------------------------------------- 대화창의 사람
  /** 그 사람만의 그림 키 — 고장·성별로 빌려 쓰는 얼굴 묶음(pools)·역할 그림은 빼고 (다른 사람까지 열리지 않게) */
  function ownKeys(sp) {
    var out = [], p = sp && sp.portrait;
    if (p && p.img) out = out.concat(p.img);
    if (sp && sp.half && sp.half.length) out.push([].concat(sp.half)[0]);   // 무릎상은 맨 앞(그 사람 것)만 — 뒤에는 남의 그림을 빌려 쓰는 예비 키가 붙는다 (로코 → 적 함장 무릎상)
    if (sp && sp.img) out = out.concat(sp.img);
    return out.filter(function (k) { return typeof k === 'string' && !/^portraits\/(pools|npc-roles)\//.test(k); }).slice(0, 6);
  }
  CM.speaker = function (sp) {
    if (!sp || typeof sp !== 'object') return;
    ownKeys(sp).forEach(function (k) { mark('k', k); });
    if (sp.name && typeof sp.name === 'string' && sp.name.length < 40) mark('n', sp.name.replace(/<[^>]*>/g, ''));
  };

  // ---------------------------------------------------------------- 지금 항해에서 옮겨 적기
  function itemsOf(s) {
    var out = [];
    (s.player.items || []).forEach(function (it) { out.push(it.id); });
    (s.player.storage || []).forEach(function (it) { out.push(it.id); });
    (s.mates || []).forEach(function (m) { (m.items || []).forEach(function (it) { out.push(it && it.id); }); });
    return out;
  }
  CM.sync = function () {
    var s = G.Game && G.Game.state; if (!s || !s.player || !s.date) return;
    var m = CM.load();
    for (var id in (s.disc || {})) { var st = s.disc[id]; if (st && st.found && st.me) mark('d', id); }
    for (var a in (s.achv || {})) mark('a', a);
    itemsOf(s).forEach(function (id) { if (id && id !== 'evidence') mark('it', id); });
    var ever = Object.keys(s.crewEver || {}).concat((s.mates || []).map(function (x) { return x.id; }));
    ever.forEach(function (id) { var d = G.MATE && G.MATE[id]; if (!d) return; mark('n', d.name); mark('k', 'portraits/mates/' + id); });
    var t = day(s.date); if (t > m.y) { m.y = t; dirty = true; if (!timer) timer = setTimeout(CM.flush, 800); }
  };

  // ---------------------------------------------------------------- 갈고리 (게임에서만)
  function wrap(obj, name, make) { if (obj && typeof obj[name] === 'function' && !obj[name].__codex) { var f = make(obj[name]); f.__codex = 1; obj[name] = f; } }
  CM.install = function () {
    if (CM.installed || !G.UI || !G.UI.say) return false;
    CM.installed = true;
    wrap(G.UI, 'say', function (orig) { return function (text, opts) { try { CM.speaker(opts); } catch (e) { /* 기록 못 해도 대화는 이어진다 */ } return orig.apply(this, arguments); }; });
    wrap(G.FamEv, 'showPic', function (orig) { return function (ev) { try { if (ev && ev.img) mark('k', ev.img); } catch (e) { /* */ } return orig.apply(this, arguments); }; });
    wrap(G.R, 'addItem', function (orig) { return function (id) { var r = orig.apply(this, arguments); try { if (r !== false && id) mark('it', id); } catch (e) { /* */ } return r; }; });
    wrap(G.Growth, 'meal', function (orig) { return function (tier, id) { try { if (id) mark('f', id); } catch (e) { /* */ } return orig.apply(this, arguments); }; });
    setInterval(function () { try { CM.sync(); } catch (e) { /* */ } }, 15000);
    window.addEventListener('pagehide', function () { try { CM.sync(); CM.flush(); } catch (e) { /* */ } });
    window.addEventListener('beforeunload', function () { try { CM.sync(); CM.flush(); } catch (e) { /* */ } });
    return true;
  };
  CM.install();
})(window.G = window.G || {});
