/* 기함의 선실 (G.Cabins) — 방의 쓰임, 부하 배치, 방의 힘, 함께 지내며 말 배우기, 충성과 떠남.
   종류는 js/data/cabins.js, 조정값은 G.BALANCE.cabins · G.BALANCE.mates (js/data/base.js), 화면은 js/ui/cabinview.js.

   저장 상태
   · 배: sh.cabins = ['deck', 'hold', 'galley', …]  (0번은 늘 갑판, 그 뒤가 고칠 수 있는 선실)
   · 부하: m.room = 선실 번호(기함의 sh.cabins 자리), m.roomType = 그 방의 종류(기함을 바꿀 때 같은 방을 찾아 옮긴다)
           m.lgx = {말 번호: 배운 단계}, m.lgd = {말 번호: 함께 지낸 날}
           m.skd = {특기: 선실에서 지낸 날}, m.skg = {특기: 늘어난 단계}, m.skw = {특기: 그 날을 쌓은 방 종류 · 여러 방이면 '*'}
   · 제독: player.lgd = {말 번호: 날}
   · 함대: fleet.cabinUid = 선실을 맞춰 둔 기함, state.leaving = [떠나겠다는 부하 id]
   옛 저장 파일에는 이것들이 없다 — 쓸 때 만들어 채운다. */
(function (G) {
  'use strict';
  var U = G.U, CB = {};
  G.Cabins = CB;
  function S() { return G.Game && G.Game.state; }
  function R() { return G.R; }
  function B() { return (G.BALANCE && G.BALANCE.cabins) || {}; }
  function BM() { return (G.BALANCE && G.BALANCE.mates) || {}; }
  var FIXED_ROLE = { first: 'adjutant', nav: 'helm', surveyor: 'lookout' };

  // ---------------------------------------------------------------- 방의 수와 기함 맞추기
  /** 이 배에서 고칠 수 있는 선실 수 (갑판·조타실·함장실·부관실·파수대는 따로 늘 있다) — 큰 배일수록 많다 */
  CB.slots = function (sh) {
    var t = sh && G.SHIP[sh.type]; if (!t) return 0;
    if (t.cabins != null) return t.cabins;
    var b = B();
    return U.clamp(Math.round((t.crew[1] + t.hp) / (b.slotDiv || 22)), b.slotMin || 2, b.slotMax || 16);
  };
  CB.flagship = function () { var s = S(); return s && s.fleet && s.fleet.ships[0] || null; };
  function ensure(sh) {
    var n = CB.slots(sh) + 1;
    if (!sh.cabins) sh.cabins = ['deck'];
    sh.cabins[0] = 'deck';
    while (sh.cabins.length < n) sh.cabins.push('hold');
    if (sh.cabins.length > n) sh.cabins.length = n;
    return sh.cabins;
  }
  /** 기함의 선실 목록 (없으면 만든다). 기함이 바뀌었으면 부하들을 같은 종류의 방으로 옮긴다 */
  CB.rooms = function () {
    var s = S(), sh = CB.flagship(); if (!sh) return [];
    var rooms = ensure(sh), f = s.fleet;
    if (f.cabinUid !== sh.uid) {
      var first = f.cabinUid == null;
      f.cabinUid = sh.uid;
      var taken = {}, lost = [];
      s.mates.forEach(function (m) {
        if (m.room == null) return;
        var want = m.roomType, i = -1;
        for (var k = 0; k < rooms.length; k++) if (rooms[k] === want && !taken[k]) { i = k; break; }
        if (i >= 0 && !CB.noStaff(want)) { m.room = i; taken[i] = 1; }
        else { delete m.room; delete m.roomType; if (m.role === 'purser' && want === 'account') m.role = 'none'; lost.push(m); }
      });
      if (!first && lost.length && G.UI) G.UI.toast('기함이 바뀌어 ' + lost.map(function (m) { return G.MATE[m.id].name; }).join('·') + '의 방이 없어졌다 — 선실에서 다시 배치하십시오.', 'people', 6500);
    }
    return rooms;
  };
  /** 어긋난 배치를 바로잡는다: 부관·항해사·측량사·선장은 제자리가 따로 있고, 한 방에는 한 사람 */
  CB.tidy = function () {
    var s = S(); if (!s) return;
    var rooms = CB.rooms(), seen = {};
    s.mates.forEach(function (m) {
      if (m.room == null) return;
      if (FIXED_ROLE[m.role] || m.role === 'captain' || m.role === 'crew' || m.room >= rooms.length || seen[m.room] || CB.noStaff(rooms[m.room]) || (rooms[m.room] === 'account' && m.role !== 'purser')) { delete m.room; delete m.roomType; return; }
      seen[m.room] = 1; m.roomType = rooms[m.room];
    });
  };
  /** 사람을 두지 않는 방인가 (창고) */
  CB.noStaff = function (type) { var c = G.CABIN[type]; return !!(c && c.noStaff); };
  /** 창고가 늘려 주는 짐칸(통): 기함만, 창고 한 칸마다 배 본래 적재량 × per, max칸까지 (G.BALANCE.cabins.store) */
  CB.storeBonus = function (sh) {
    var s = S(), f = s && s.fleet; if (!f || !f.ships.length) return 0;
    sh = sh || f.ships[0]; if (sh !== f.ships[0] || !sh.cabins) return 0;
    var t = G.SHIP[sh.type]; if (!t) return 0;
    var k = B().store || {}, n = sh.cabins.filter(function (x) { return x === 'store'; }).length;
    return Math.floor(t.cap * (k.per != null ? k.per : 0.05) * Math.min(n, k.max != null ? k.max : 4));
  };
  /** 창고 칸 수 (센 것 / 있는 것) */
  CB.storeRooms = function () { var sh = CB.flagship(), k = B().store || {}, n = sh && sh.cabins ? sh.cabins.filter(function (x) { return x === 'store'; }).length : 0; return { n: n, used: Math.min(n, k.max != null ? k.max : 4) }; };
  /** 이 선실에 있는 부하 (없으면 null) */
  CB.occupant = function (i) { var s = S(); return s.mates.filter(function (m) { return m.room === i; })[0] || null; };
  /** 고정 자리(부관실·조타실·파수대)에 있는 부하 */
  CB.roleMate = function (role) { var s = S(); return s.mates.filter(function (m) { return m.role === role; })[0] || null; };
  /** 부하가 지금 있는 곳의 이름 */
  CB.placeName = function (m) {
    if (m.role === 'captain') return R().roleName(m);
    if (m.role === 'crew' && G.CrewAuto) return G.CrewAuto.placeName(m);   // 다른 배의 조타수·갑판·파수꾼·선실
    if (FIXED_ROLE[m.role]) return G.CABIN[FIXED_ROLE[m.role]].name;
    var rooms = CB.rooms();
    if (m.room != null && rooms[m.room]) return G.CABIN[rooms[m.room]].name + (m.role === 'interp' ? ' · 통역' : '');
    return m.role === 'interp' ? '통역 (방 없음)' : m.role === 'purser' ? '경리 (방 없음)' : '대기';
  };
  /** 부하를 선실 i에 둔다 (i가 null이면 방에서 뺀다). 그 방에 있던 사람은 방을 비운다 */
  CB.place = function (m, i) {
    var s = S(), rooms = CB.rooms();
    if (i == null) { if (m.role === 'purser' && m.roomType === 'account') m.role = 'none'; delete m.room; delete m.roomType; return; }
    var type = rooms[i]; if (!type || CB.noStaff(type)) return;   // 빈 선실에는 거주할 수 있고, 창고에는 사람을 두지 않는다
    var old = CB.occupant(i);
    if (old && old !== m) CB.place(old, null);
    if (m.roomType === 'account' && type !== 'account' && m.role === 'purser') m.role = 'none';
    if (FIXED_ROLE[m.role] || m.role === 'captain' || m.role === 'crew') { m.role = 'none'; delete m.ship; delete m.post; }   // 다른 배에서 기함으로 데려온다
    m.room = i; m.roomType = type;
    if (type === 'account') {          // 회계실에 앉은 사람이 경리다
      s.mates.forEach(function (x) { if (x !== m && x.role === 'purser') x.role = 'none'; });
      m.role = 'purser';
    }
    if (R().tidyCaptains) R().tidyCaptains();
  };
  /** 선실 i를 type으로 고친다 (값은 치르지 않는다 — 조선소 화면이 치른다) */
  CB.remodel = function (i, type) {
    var rooms = CB.rooms(); if (i <= 0 || i >= rooms.length || !G.CABIN[type] || G.CABIN[type].fixed) return false;
    var m = CB.occupant(i);
    rooms[i] = type;
    if (m) { if (CB.noStaff(type)) CB.place(m, null); else CB.place(m, i); }
    return true;
  };

  /** 여러 선실의 완성 배치와 견적. 실제 방·금화·부하 배치는 건드리지 않는다. */
  CB.planRemodel = function (types) {
    var s = S(), sh = CB.flagship(), rooms = CB.rooms();
    var p = { ok: false, error: '', cost: 0, days: 0, changes: [], placements: [], idle: 0 };
    if (!sh || !Array.isArray(types) || types.length !== rooms.length || types[0] !== 'deck') { p.error = '선실 수가 맞지 않습니다. 선실 화면을 다시 여십시오.'; return p; }
    for (var i = 1; i < types.length; i++) {
      var c = G.CABIN[types[i]];
      if (!c || c.fixed) { p.error = '고칠 수 없는 선실 종류입니다.'; return p; }
      if (types[i] !== rooms[i]) { p.changes.push(i); p.cost += c.cost || 0; p.days += c.days || 0; }
    }
    p.rooms = types.slice();
    var before = sh.cabins, capacityBefore = R().fleetCap();
    try { sh.cabins = p.rooms; p.capacity = R().fleetCap(); }
    finally { sh.cabins = before; }
    p.over = Math.max(0, R().used() - p.capacity);
    var taken = {}, accountTaken = s.mates.some(function (m) { return m.role === 'purser' && m.room == null; });
    s.mates.forEach(function (m) {
      if (m.room == null || !rooms[m.room] || FIXED_ROLE[m.role] || m.role === 'captain' || m.role === 'crew') return;
      p.placements.push({ id: m.id, from: m.room, type: rooms[m.room], to: null });
    });
    function seat(a, i) {
      if (i == null || taken[i] || !p.rooms[i] || CB.noStaff(p.rooms[i]) || (p.rooms[i] === 'account' && accountTaken)) return false;
      a.to = i; taken[i] = true;
      if (p.rooms[i] === 'account') accountTaken = true;
      return true;
    }
    // 바꾸지 않는 방은 그대로, 옮긴 같은 종류의 방 → 원래 자리 → 나머지 빈자리 순서로 둔다.
    p.placements.forEach(function (a) { if (p.rooms[a.from] === a.type) seat(a, a.from); });
    p.placements.forEach(function (a) {
      if (a.to != null) return;
      for (var k = 0; k < p.rooms.length; k++) if (p.rooms[k] === a.type && seat(a, k)) break;
    });
    p.placements.forEach(function (a) { if (a.to == null) seat(a, a.from); });
    p.placements.forEach(function (a) {
      if (a.to != null) return;
      for (var k = 0; k < p.rooms.length; k++) if (seat(a, k)) break;
      if (a.to == null) p.idle++;
    });
    if (p.over > 0 && p.capacity < capacityBefore) p.error = '완성 뒤 짐칸이 부족합니다. 짐을 ' + U.num(p.over) + '통 비운 뒤 고치십시오.';
    else if (p.cost > s.player.gold) p.error = '돈이 모자랍니다.';
    p.ok = !p.error;
    return p;
  };
  /** 견적을 다시 검사한 뒤 방·금화·거주자를 한 번에 바꾼다. 공사 날짜는 화면에서 넘긴다. */
  CB.remodelAll = function (types, expected) {
    var sh = CB.flagship(), rooms = CB.rooms();
    if (expected && (sh !== expected.ship || rooms.join(',') !== expected.rooms.join(','))) return { ok: false, error: '기함이나 선실이 바뀌었습니다. 선실 화면을 다시 여십시오.' };
    var p = CB.planRemodel(types); if (!p.ok || !p.changes.length) return p;
    var s = S();
    sh.cabins = p.rooms.slice(); s.player.gold -= p.cost;
    p.placements.forEach(function (a) {
      var m = s.mates.filter(function (x) { return x.id === a.id; })[0];
      if (m.role === 'purser' && (a.to == null || p.rooms[a.to] !== 'account')) m.role = 'none';
      delete m.room; delete m.roomType;
      if (a.to != null) { m.room = a.to; m.roomType = p.rooms[a.to]; if (m.roomType === 'account') m.role = 'purser'; }
    });
    return p;
  };

  // ---------------------------------------------------------------- 충성과 효율
  /** 충성이 낮으면 일을 건성으로 한다: 특기·능력의 효율 (1 = 온전히) */
  CB.eff = function (m) {
    var b = BM(), lo = m.loyal == null ? 70 : m.loyal;
    return lo <= (b.veryLow == null ? 20 : b.veryLow) ? (b.veryLowEff || 0.5) : lo <= (b.low == null ? 40 : b.low) ? (b.lowEff || 0.75) : 1;
  };
  /** 이 부하의 이 특기가 선실 덕에 함대에 쓰이는가 */
  CB.activates = function (m, skill) {
    if (m.room == null || m.role === 'captain' || m.role === 'crew') return false;
    var rooms = CB.rooms(), c = G.CABIN[rooms[m.room]];
    return !!(c && c.skills && c.skills.indexOf(skill) >= 0);
  };
  /** 통역실에 있는가 */
  CB.interprets = function (m) { if (m.room == null) return false; var c = G.CABIN[CB.rooms()[m.room]]; return !!(c && c.lang); };
  // ---------------------------------------------------------------- 통역관 (2026-10-25 사용자 요청)
  /* 통역으로 임명한(m.role 'interp') 사람을 통역실에 두면 「통역관」이 된다.
     · 제 말뿐 아니라 제독과 기함에 탄 다른 부하들이 아는 말을 모두 모아(통역 장부) 통역한다 — 그 말을 가장 잘하는 사람의 단계만큼.
       제가 모르는 말은 「○○이 알려 주었는데 —」처럼 누구에게 물어 옮기는지 밝힌다 (js/ui/ui.js speech).
     · 말을 배우는 속도가 다른 부하보다 빠르다(G.BALANCE.cabins.interpRate) — 일행에게 물어 가며 그 사람이 아는 단계까지 익힌다. */
  CB.isChief = function (m) { return !!(m && m.role === 'interp' && G.MATE[m.id] && CB.interprets(m) && !(R().mateHidden && R().mateHidden(m))); };
  /** 통역관 (여럿이면 아는 말이 가장 많은 사람) — 없으면 null */
  CB.chiefInterp = function () {
    var s = S(); if (!s || !s.mates) return null;
    var best = null, bs = -1, n = (G.LANGS || []).length;
    s.mates.forEach(function (m) {
      if (!CB.isChief(m)) return;
      var t = 0; for (var li = 0; li < n; li++) t += R().mateLang(m, li);
      if (t > bs) { bs = t; best = m; }
    });
    return best;
  };
  /** 통역 장부 한 줄: 그 말을 일행(통역관 자신·제독·기함의 부하) 가운데 가장 잘하는 사람 — {li, lv, own(통역관 자신의 단계), src: 'self'|'admiral'|부하 id, name}. 통역관이 없으면 null */
  CB.langEntry = function (li, ci) {
    var s = S(); ci = ci || CB.chiefInterp(); if (!ci) return null;
    var own = R().mateLang(ci, li), e = { li: li, lv: own, own: own, src: 'self', name: G.MATE[ci.id].name };
    var pl = (s.player.lg && s.player.lg[li]) || 0; if (pl > e.lv) { e.lv = pl; e.src = 'admiral'; e.name = '제독'; }
    s.mates.forEach(function (m) {
      if (m === ci || m.role === 'captain' || m.role === 'crew' || !G.MATE[m.id]) return;   // 다른 배의 선장·선원은 기함에 없다
      var lv = R().mateLang(m, li); if (lv > e.lv) { e.lv = lv; e.src = m.id; e.name = G.MATE[m.id].name; }
    });
    return e;
  };
  /** 통역 장부: 일행이 아는 말 모두 (단계가 높은 순) */
  CB.langBook = function () {
    var ci = CB.chiefInterp(); if (!ci) return null;
    var out = [];
    for (var li = 0; li < (G.LANGS || []).length; li++) { var e = CB.langEntry(li, ci); if (e.lv > 0) out.push(e); }
    return out.sort(function (a, b) { return b.lv - a.lv || a.li - b.li; });
  };
  /** 통역관이 남에게 물어 옮길 때의 말머리 (k: 문장마다 정해진 수) */
  CB.viaPhrase = function (name, k) {
    var U2 = G.U, F = [name + U2.jx(name, '이/가') + ' 알려 주었는데 — ', name + '에게 물어보니 — ', name + ' 말로는 — ', name + U2.jx(name, '이/가') + ' 귀띔해 주기를 — '];
    return F[Math.abs(k || 0) % F.length];
  };
  // ---------------------------------------------------------------- 방이 보는 특기 (2026-10-29 피드백)
  /** 이 방(또는 다른 배의 자리)이 보는 특기 {main:[주 특기], sub:[보조 특기]} — 자료에 없으면 skills(역할 특기)의 첫째가 주, 나머지가 보조 */
  CB.roomSkills = function (c) {
    if (!c) return { main: [], sub: [] };
    if (c.main) return { main: c.main.slice(), sub: (c.sub || []).slice() };
    var ks = c.skills || G.ROLE_SKILLS[c.role] || [];
    return { main: ks.slice(0, 1), sub: ks.slice(1) };
  };
  CB.subK = function () { var k = B().subK; return k == null ? 0.5 : k; };
  /** 이 사람이 이 방에서 내는 특기 단계와 그 특기: {lv: 방에 쓰이는 단계, sk, raw: 그 특기의 단계, main: 주 특기인가} — 주 특기는 그대로, 보조 특기는 절반 */
  CB.roomBest = function (c, m) {
    var rs = CB.roomSkills(c), best = { lv: 0, sk: null, raw: 0, main: true };
    if (!m || !G.MATE[m.id]) return best;
    rs.main.forEach(function (k) { var v = R().mateSkill(m, k); if (v > best.lv) best = { lv: v, sk: k, raw: v, main: true }; });
    rs.sub.forEach(function (k) { var v = R().mateSkill(m, k), e = v * CB.subK(); if (e > best.lv) best = { lv: e, sk: k, raw: v, main: false }; });
    return best;
  };
  CB.roomLevel = function (c, m) { return CB.roomBest(c, m).lv; };
  /** 「★항해술 · ☆운용술(절반)」 */
  CB.skillLabel = function (c) {
    var rs = CB.roomSkills(c), nm = function (k) { return (G.SKILL_BY_ID[k] || {}).name || k; };
    if (c && c.lang) return '말(제독이 모르는 말)';
    if (!rs.main.length && !rs.sub.length) return '';
    return rs.main.map(function (k) { return '★' + nm(k); }).concat(rs.sub.map(function (k) { return '☆' + nm(k); })).join(' · ') + (rs.sub.length ? ' <small class="muted">(☆는 절반만 친다)</small>' : '');
  };
  /** 음악실에서 이 동료가 쓰는 악기와 배율. 여러 개·여러 종류라도 중첩하지 않는다. */
  CB.musicInstrument = function (m) {
    var k = B().musicInstrument || {}, best = { mult: 1, item: null }, special = (k.special || {})[m && m.id];
    R().mateItems(m).forEach(function (it) {
      var d = G.ITEM[it.id]; if (!d || d.kind !== 'instrument') return;
      var mult = special && special.item === it.id ? special.mult : k.mult;
      if (mult > best.mult) best = { mult: mult, item: it.id };
    });
    return best;
  };
  function roomPower(c, m, plain) {
    if (!m || !G.MATE[m.id] || c.id === 'hold') return 0;   // 빈 선실은 거주용이며 직무 효과는 없다
    return (1 + CB.roomLevel(c, m)) * CB.eff(m) * (!plain && c.id === 'musicroom' ? CB.musicInstrument(m).mult : 1);
  }
  /** 방 하나의 힘: 비었거나 거주용 빈 선실이면 0, 직무 선실에 사람이 있으면 (1 + 특기 단계) × 충성 효율 */
  CB.powerAt = function (i) { var rooms = CB.rooms(), c = G.CABIN[rooms[i]]; return c ? roomPower(c, CB.occupant(i)) : 0; };
  /** 이 종류 방의 힘을 모두 더한 값 (상한 G.BALANCE.cabins.cap). 고정 자리는 그 역할을 맡은 사람으로 센다 */
  CB.power = function (type) {
    var s = S(); if (!s || !s.fleet || !s.fleet.ships.length) return 0;
    var c = G.CABIN[type]; if (!c) return 0;
    var sum = 0, weighted = 0;
    if (c.fixed && c.role) sum = roomPower(c, CB.roleMate(c.role));
    else { var rooms = CB.rooms(); for (var i = 0; i < rooms.length; i++) if (rooms[i] === type) { var m = CB.occupant(i); sum += roomPower(c, m, true); if (type === 'musicroom') weighted += roomPower(c, m); } }
    var caps = B().caps || {};
    return Math.min(caps[type] || B().cap || 8, sum) * (type === 'musicroom' && sum ? weighted / sum : 1);
  };
  /** 효과 값: G.BALANCE.cabins.fx[key] × 그 방의 힘 */
  CB.fx = function (type, key) {
    var v = ((B().fx || {})[key]) || 0; if (!v) return 0;
    var hot = (type === 'galley' || type === 'mess') && CB.kitchenLink() ? 1 + num0((B().kitchen || {}).fx, 0.25) : 1;   // 요리실과 식당이 붙어 있으면 (아래)
    return v * CB.power(type) * hot;
  };
  function num0(v, d) { return v == null ? d : v; }

  // ---------------------------------------------------------------- 맞닿은 방 (2026-11-02 사용자 요청)
  // 선실 카드는 G.BALANCE.cabins.cols(6)칸씩 줄을 지어 놓인다 — 선실 번호 i(1부터) → [칸, 줄]. 위·아래·왼쪽·오른쪽이 맞닿은 방이다 (대각선은 아님).
  CB.roomCell = function (i) { var c = CB.cols(); return [(i - 1) % c, Math.floor((i - 1) / c)]; };
  CB.roomsTouch = function (i, j) {
    if (!(i >= 1) || !(j >= 1) || i === j) return false;
    var a = CB.roomCell(i), b = CB.roomCell(j);
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
  };
  /** type 방들이 맞닿아 이룬 덩어리들 [[선실 번호…]…] */
  CB.roomGroups = function (type) {
    var rooms = CB.rooms(), idx = [], seen = {}, out = [];
    for (var i = 1; i < rooms.length; i++) if (rooms[i] === type) idx.push(i);
    idx.forEach(function (st) {
      if (seen[st]) return;
      var grp = [], q = [st]; seen[st] = 1;
      while (q.length) { var x = q.shift(); grp.push(x); idx.forEach(function (y) { if (!seen[y] && CB.roomsTouch(x, y)) { seen[y] = 1; q.push(y); } }); }
      out.push(grp.sort(function (a, b) { return a - b; }));
    });
    return out;
  };

  // 요리실 + 식당: 맞닿아 있으면 「따끈한 밥상」 — 갓 지은 끼니가 식기 전에 나간다.
  //   요리실·식당의 피로·규율 효과(와 별미) × (1 + kitchen.fx), 요리실 차림의 배율 + kitchen.meal. 조정값 G.BALANCE.cabins.kitchen
  /** 맞닿은 요리실·식당 한 쌍 {galley, mess} (없으면 null) */
  CB.kitchenPair = function () {
    var rooms = CB.rooms();
    for (var i = 1; i < rooms.length; i++) if (rooms[i] === 'galley')
      for (var j = 1; j < rooms.length; j++) if (rooms[j] === 'mess' && CB.roomsTouch(i, j)) return { galley: i, mess: j };
    return null;
  };
  CB.kitchenLink = function () { return !!CB.kitchenPair(); };

  // 음악실 앙상블: 사람이 있는 음악실이 맞닿아 있으면 함께 연주한다 — 음악 특기(1단계 이상)를 가진 사람이 2명부터.
  //   2 듀엣 · 3 트리오 · 4 콰트로 · 5~6 밴드 · 7~ 그룹 (G.BALANCE.cabins.ensemble.names)
  //   음악 단계(mus)와 웅변 단계(spk)를 충성 효율로 더하고, 사람이 많을수록 어울림(syn = 1 + size × (사람 − 2))이 붙는다.
  //   · 항해 중 하루 피로 −fat × (mus + spk/2) × syn · 하루 규율 +disc × (mus/2 + spk) × syn (합계 fatMax·discMax까지)
  //   · 입항한 도시의 유행: 파는 값에 붙는 유행의 몫(배수 − 1)을 fad × (mus + spk) × syn 만큼 키운다 (fadMax까지) — js/core/rules.js R.sellPrice
  //     (이 교역소에서 산 몫은 산 값보다 비싸게 팔 수 없으니 그 자리에서 되파는 장사는 막혀 있다)
  function EK() { return B().ensemble || {}; }
  CB.ensembleName = function (n) {
    var names = EK().names || [[2, '듀엣'], [3, '트리오'], [4, '콰트로'], [5, '밴드'], [7, '그룹']], nm = '';
    names.forEach(function (x) { if (n >= x[0]) nm = x[1]; });
    return nm;
  };
  /** 앙상블들 [{rooms, members, n, name, mus, spk, syn, fat, disc, fad}] — 2명이 안 되는 덩어리는 빠진다 */
  CB.ensembles = function () {
    var s = S(); if (!s || !s.fleet || !s.fleet.ships.length) return [];
    var K = EK(), min = num0(K.min, 2), out = [];
    CB.roomGroups('musicroom').forEach(function (grp) {
      var members = [], mus = 0, spk = 0;
      grp.forEach(function (i) {
        var m = CB.occupant(i); if (!m || !G.MATE[m.id]) return;
        var mv = R().mateSkill(m, 'music'); if (mv < 1) return;   // 음악을 모르는 사람은 함께 연주하지 못한다
        var e = CB.eff(m);
        members.push(m); mus += mv * e; spk += R().mateSkill(m, 'speech') * e;
      });
      if (members.length < min) return;
      var n = members.length, syn = 1 + num0(K.size, 0.15) * (n - 2);
      out.push({ rooms: grp, members: members, n: n, name: CB.ensembleName(n), mus: mus, spk: spk, syn: syn,
        fat: num0(K.fat, 0.05) * (mus + spk / 2) * syn, disc: num0(K.disc, 0.03) * (mus / 2 + spk) * syn, fad: num0(K.fad, 0.03) * (mus + spk) * syn });
    });
    return out;
  };
  /** 앙상블 효과의 합 {fat, disc, fad, list} (상한을 친 뒤) */
  CB.ensembleFx = function () {
    var K = EK(), list = CB.ensembles(), o = { fat: 0, disc: 0, fad: 0, list: list };
    list.forEach(function (e) { o.fat += e.fat; o.disc += e.disc; o.fad += e.fad; });
    o.fat = Math.min(num0(K.fatMax, 1.2), o.fat); o.disc = Math.min(num0(K.discMax, 0.8), o.disc); o.fad = Math.min(num0(K.fadMax, 0.75), o.fad);
    return o;
  };
  /** 선실 i가 속한 앙상블 (없으면 null) */
  CB.ensembleAt = function (i) { var l = CB.ensembles(); for (var k = 0; k < l.length; k++) if (l[k].rooms.indexOf(i) >= 0) return l[k]; return null; };
  /** 유행하는 물건을 팔 때 값에 더 곱할 것: 함대가 이 도시 항구에 있을 때만 (탐험대로 뭍길로 왔으면 악사들은 배에 있다) */
  CB.fadBoost = function (c, fm) {
    var s = S(); if (!(fm > 1) || !s || !s.loc || s.loc.city !== c.id || s.loc.via === 'land') return 1;
    var amp = CB.ensembleFx().fad; if (!amp) return 1;
    return (1 + (fm - 1) * (1 + amp)) / fm;
  };

  // ---------------------------------------------------------------- 요리실의 차림 (2026-10-19)
  // 요리실에 요리 특기자를 두면 그 사람의 말(모국어)에 맞는 고장의 음식(js/data/cuisine.js)을 차린다 — 바다에서 날마다 피로를 덜고 규율을 돋운다.
  // 차림은 그 고장 음식 가운데 요리사의 요리 단계까지의 것(음식 등급 1~3)으로, 7일마다 바뀐다. 기함에 식당이 있으면 효과가 오르고 식당에 사람이 있으면 더 오른다.
  // 제독 고향의 음식이면 「고향의 맛」 — 규율이 더 오른다. 조정값 G.BALANCE.cabins.galleyMeal
  var LANG_ZONES = { 0: ['iberia'], 1: ['iberia'], 2: ['french', 'italian'], 3: ['german', 'british'], 4: ['east_europe', 'russia_steppe'], 5: ['ottoman_levant', 'north_africa'],
    6: ['ottoman_levant'], 7: ['china_south', 'china_north'], 8: ['india'], 9: ['russia_steppe'], 10: ['africa', 'south_africa'], 11: ['latin'], 12: ['seasia'], 13: ['japan'], 14: ['korea'], 15: ['north_america', 'native_oceania'] };
  var STYLE_ZONE = { ib: 'iberia', co: 'iberia', it: 'italian', ne: 'german', gr: 'east_europe', ru: 'russia_steppe', st: 'russia_steppe', is: 'ottoman_levant', pe: 'ottoman_levant',
    cn: 'china_south', in: 'india', se: 'seasia', jp: 'japan', kr: 'korea', af: 'africa', sw: 'africa', tr: 'africa', az: 'latin', an: 'latin', na: 'north_america' };
  var ZONE_NAME = { british: '브리튼', german: '독일·저지대', french: '프랑스', iberia: '이베리아', italian: '이탈리아', east_europe: '동유럽·그리스', russia_steppe: '러시아·초원',
    ottoman_levant: '오스만·레반트', north_africa: '북아프리카', africa: '아프리카', south_africa: '남아프리카', india: '인도', seasia: '동남아시아', china_north: '중국 북방',
    china_south: '중국 남방', korea: '조선', japan: '일본', north_america: '북아메리카', latin: '중남미', native_oceania: '원주민·오세아니아' };
  CB.ZONE_NAME = ZONE_NAME;
  /** 요리실에서 솥을 잡은 사람: 요리 단계가 가장 높은 사람 {m, lv} (없으면 null) */
  CB.galleyCook = function () {
    var rooms = CB.rooms(), best = null;
    for (var i = 0; i < rooms.length; i++) if (rooms[i] === 'galley') {
      var m = CB.occupant(i); if (!m || !G.MATE[m.id]) continue;
      var lv = R().mateSkill(m, 'cook'); if (lv >= 1 && (!best || lv > best.lv)) best = { m: m, lv: lv };
    }
    return best;
  };
  /** 요리사가 차리는 고장 음식: 모국어의 음식권 (말 하나에 음식권이 여럿이면 그 사람 양식에 맞는 쪽) */
  CB.cookZone = function (m) {
    var d = G.MATE[m.id], li = CB.nativeLang(m), zs = (li != null && LANG_ZONES[li]) || [], sz = d && STYLE_ZONE[d.style];
    if (sz && zs.indexOf(sz) >= 0) return sz;
    return zs[0] || sz || null;
  };
  /** 이번 주 차림과 하루 효과 {cook, lv, zone, zoneName, dish, mess, mult, home, fat, disc} — 요리사가 없으면 null */
  CB.galleyMeal = function () {
    var ck = CB.galleyCook(); if (!ck || !G.CUISINE) return null;
    var zone = CB.cookZone(ck.m); if (!zone) return null;
    var lv = Math.min(3, ck.lv), all = G.CUISINE.list.filter(function (d) { return d.zone === zone; });
    // 요리 단계가 높을수록 값비싼 음식: 만들 수 있는 가장 높은 등급의 음식을 차린다 (그런 음식이 하나뿐이면 한 등급 아래 것과 번갈아)
    var can = all.filter(function (d) { return (d.tier || 1) <= lv; }), top = 0;
    can.forEach(function (d) { top = Math.max(top, d.tier || 1); });
    var pool = can.filter(function (d) { return (d.tier || 1) === top; });
    if (pool.length < 2) pool = pool.concat(can.filter(function (d) { return (d.tier || 1) === top - 1; }));
    if (!pool.length) pool = all.slice().sort(function (a, b) { return (a.tier || 1) - (b.tier || 1); }).slice(0, 1);
    if (!pool.length) return null;
    // 차릴 음식이 하나뿐이면 차림이 바뀌지 않아 향신료가 줄지 않은 채 풍미가 이어지던 것 — 그 음식권의 다음 음식과 번갈아 차린다 (QA 2026-10-23)
    //   (등급 제한 밖에서 빌려 온 음식은 효과를 원래 차림의 등급까지만 친다)
    var poolTop = 0, borrowed = null;
    pool.forEach(function (d) { poolTop = Math.max(poolTop, d.tier || 1); });
    if (pool.length < 2) {
      var rest = all.filter(function (d) { return pool.indexOf(d) < 0; }).sort(function (a, b) { return (a.tier || 1) - (b.tier || 1); });
      if (rest.length) { borrowed = rest[0]; pool = pool.concat([borrowed]); }
    }
    var s = S(), wk = Math.floor((s.day || 0) / 7), dish = pool[Math.abs(wk + U.strHash(ck.m.id)) % pool.length];
    var K = B().galleyMeal || {}, rooms = CB.rooms(), mess = rooms.indexOf('mess') >= 0;
    var hot = CB.kitchenLink();   // 요리실과 식당이 맞닿아 있다 — 「따끈한 밥상」
    var mult = 1 + (mess ? (K.messHas == null ? 0.3 : K.messHas) : 0) + CB.power('mess') * (K.messPow == null ? 0.1 : K.messPow) + (hot ? num0((B().kitchen || {}).meal, 0.25) : 0);
    var homeC = s.player && G.CITY_DATA[s.player.home], home = !!(homeC && G.CUISINE.zone && G.CUISINE.zone(homeC) === zone);
    var tier = dish === borrowed ? Math.min(dish.tier || 1, poolTop) : (dish.tier || 1), eff = CB.eff(ck.m) * (1 + Math.max(0, lv - 1) * (K.skill == null ? 0.1 : K.skill));   // 충성 효율 × 솜씨
    // 풍미: 짐칸의 향신료·식자재 (가장 많이 실은 것을 쓴다)
    var cargo = (s.fleet && s.fleet.cargo) || {}, spice = null, food = null;
    Object.keys(cargo).forEach(function (id) { var g = G.GOOD[id], q = cargo[id] && cargo[id].q; if (!g || !(q > 0)) return;
      if (g.cat === 'spice' && (!spice || q > cargo[spice].q)) spice = id; else if (g.cat === 'food' && (!food || q > cargo[food].q)) food = id; });
    var flavor = 1 + (spice ? (K.spice == null ? 0.25 : K.spice) : 0) + (food ? (K.food == null ? 0.1 : K.food) : 0);
    return { cook: ck.m, name: G.MATE[ck.m.id].name, lv: ck.lv, zone: zone, zoneName: ZONE_NAME[zone] || zone, dish: dish, mess: mess, hot: hot, mult: mult, home: home,
      spice: spice, food: food, flavor: flavor, flavorText: [spice, food].filter(Boolean).map(function (id) { return G.GOOD[id].name; }).join('·'),
      fat: ((K.fat0 == null ? 0.1 : K.fat0) + (K.fatTier == null ? 0.08 : K.fatTier) * tier) * mult * eff * flavor,
      disc: ((K.disc0 == null ? 0.04 : K.disc0) + (K.discTier == null ? 0.04 : K.discTier) * tier) * mult * eff * flavor * (home ? (K.home || 1.25) : 1) };
  };
  /** 차림이 바뀔 때 풍미에 쓴 향신료·식자재를 1통씩 덜어 낸다 */
  CB.galleyUse = function (gm) {
    var c = S().fleet.cargo;
    [gm && gm.spice, gm && gm.food].forEach(function (id) { if (!id || !c[id]) return; c[id].q -= 1; if (c[id].q <= 0) delete c[id]; });
  };

  // ---------------------------------------------------------------- 말 배우기
  /** 부하의 모국어 (가장 잘하는 말) */
  CB.nativeLang = function (m) {
    var d = G.MATE[m.id]; if (!d || !d.lg) return null;
    var best = null, lv = 0;
    Object.keys(d.lg).forEach(function (k) { if (d.lg[k] > lv) { lv = d.lg[k]; best = +k; } });
    return best;
  };
  /** 부하의 말 단계: 타고난 것과 배에서 배운 것 가운데 높은 쪽 */
  CB.mateLang = function (m, li) { var d = G.MATE[m.id]; return Math.max((d && d.lg && d.lg[li]) || 0, (m.lgx && m.lgx[li]) || 0); };
  function levelFor(days) { var t = B().langDays || [90, 270, 730], lv = 0; for (var i = 0; i < t.length; i++) if (days >= t[i]) lv = i + 1; return lv; }
  /** 방의 자리 (가까운 방을 가릴 때): 선실 번호 → [칸, 줄] */
  CB.cols = function () { return B().cols || 6; };
  function cell(m) {
    if (m === 'admiral') return [-1, 0];
    if (m.role === 'first') return [-2, 0];
    if (m.role === 'nav') return [-3, 0];
    if (m.role === 'surveyor') return [-3, -1];
    if (m.room == null) return null;
    if (m.room === 0) return [-4, 0];                                   // 갑판 — 조타실 옆
    var k = m.room - 1, c = CB.cols();
    return [k % c, 1 + Math.floor(k / c)];
  }
  function near(a, b) {
    var x = cell(a), y = cell(b); if (!x || !y) return false;
    if (x[0] < 0 || y[0] < 0) return x[0] < 0 && y[0] < 0 && Math.abs(x[0] - y[0]) + Math.abs(x[1] - y[1]) <= 1;   // 갑판 위 자리끼리
    return Math.abs(x[0] - y[0]) + Math.abs(x[1] - y[1]) === 1;
  }
  CB.near = near;
  /** 하루: 한배를 탄 사람들이 서로의 모국어를 익힌다. 모두가 제독의 모국어를 하루만큼, 서로의 말은 가까운 방이면 하루·멀면 farRate 만큼.
      돌려주는 값: 알림 [{icon, text}] */
  // ---------------------------------------------------------------- 선실에서 특기가 는다 (2026-10-22 사용자 요청)
  // 방마다 키우는 특기(G.CABINS grow — 없으면 skills의 첫 특기: 지도 제작실 → 측량)가 있고, 그 방에서 지낸 날이 쌓이면 그 특기가 는다.
  // 3년(1095일) +1 · 9년 +2 · 27년 +3 (G.BALANCE.cabins.growDays). 날은 특기마다 쌓인다 — 같은 특기를 키우는 다른 방으로 옮겨도 이어진다. 특기는 3까지.
  // 저장: m.skd = {특기: 지낸 날} · m.skg = {특기: 늘어난 단계} (R.mateSkill이 더한다)
  /** 이 방에서 느는 특기 (없으면 null) */
  CB.growSkill = function (type) { var c = G.CABIN[type]; if (!c || c.noStaff || type === 'hold' || type === 'captain') return null; return c.grow || (c.skills && c.skills[0]) || null; };
  /** 부하가 지금 지내는 방 종류 (부관·항해사·측량사는 부관실·조타실·파수대) — 없으면 null */
  CB.roomOf = function (m) {
    if (!m || m.role === 'captain' || m.role === 'crew') return null;   // 다른 배의 자리에서는 특기가 늘지 않는다 (충성만 지킨다)
    if (FIXED_ROLE[m.role]) return FIXED_ROLE[m.role];
    if (m.room == null) return null;
    return CB.rooms()[m.room] || null;
  };
  function growDays() { return B().growDays || [1095, 3285, 9855]; }
  CB.growDays = growDays;
  /** 지낸 날 → 늘어난 단계 (0~3) */
  function growLevel(days) { var g = growDays(), n = 0; for (var i = 0; i < g.length; i++) if (days >= g[i]) n = i + 1; return n; }
  CB.growLevel = growLevel;
  /** 부하의 본디 특기 단계: 타고난 것 + 선실에서 는 것 (3까지). 충성·부상으로 줄어든 것은 빼지 않는다 — 실제로 쓰는 단계는 R.mateSkill */
  CB.baseSkill = function (m, id) { var d = G.MATE[m.id]; return d ? ((m.sk && m.sk[id] != null ? m.sk[id] : d.sk && d.sk[id]) || 0) : 0; };
  CB.rawSkill = function (m, id) { var lv = CB.baseSkill(m, id); return m.skg && m.skg[id] ? Math.min(3, lv + m.skg[id]) : lv; };
  /** 부하의 특기 목록 [{id, name, lv: 지금 쓰는 단계, raw: 본디 단계, grown: 선실에서 는 단계}] — all: 타고난 특기는 0이어도 넣는다 */
  CB.skillList = function (m, all) {
    var d = G.MATE[m.id] || {}, out = [];
    (G.SKILLS || []).forEach(function (sk) {
      var raw = CB.rawSkill(m, sk.id), lv = R().mateSkill(m, sk.id);
      if (raw > 0 || lv > 0 || (all && d.sk && sk.id in d.sk)) out.push({ id: sk.id, name: sk.name, lv: lv, raw: raw, grown: raw - Math.min(3, CB.baseSkill(m, sk.id)) });
    });
    return out;
  };
  /** 특기 한 줄: 「항해술 2 · 측량 1★」 — ★ 선실에서 는 것, (본디 2) 충성이 낮거나 다쳐서 지금은 덜 쓰는 것 */
  CB.skillText = function (m) {
    var l = CB.skillList(m);
    return l.length ? l.map(function (x) { return x.name + ' ' + x.lv + (x.grown > 0 ? '★' : '') + (x.lv < x.raw ? '(본디 ' + x.raw + ')' : ''); }).join(' · ') : '특기 없음';
  };
  /** 날 수 → 「2년 140일」 */
  function yd(days) { var y = Math.floor(days / 365), d = days % 365; return (y ? y + '년' : '') + (y && d ? ' ' : '') + (d || !y ? d + '일' : ''); }
  CB.yd = yd;
  /** 지금 방에서 느는 특기의 진행 {sk, name, days: 쌓인 날, next: 다음 단계 날(없으면 null), max: 특기가 이미 3} — 늘 특기가 없으면 null */
  CB.growInfo = function (m) {
    var sk = m && CB.growSkill(CB.roomOf(m)); if (!sk || !G.MATE[m.id]) return null;
    var days = (m.skd && m.skd[sk]) || 0, g = growDays(), lv = growLevel(days);
    return { sk: sk, name: G.SKILL_BY_ID[sk].name, days: days, next: lv < g.length ? g[lv] : null, max: CB.rawSkill(m, sk) >= 3 };
  };
  /** 「측량 2년 140일 · 다음 단계 3년」 (늘 특기가 없으면 null) */
  CB.growNote = function (m) {
    var o = CB.growInfo(m); if (!o) return null;
    if (o.max) return o.name + ' 3 — 더 늘지 않는다';
    return o.name + ' ' + yd(o.days) + ' · ' + (o.next ? '다음 단계 ' + yd(o.next) : '다 늘었다');
  };
  /** 날마다: 방에 있는 부하의 그 방 특기에 하루가 쌓인다 — 단계가 오르면 알릴 말.
      단계는 본디 단계(CB.rawSkill)로 견준다 — 충성이 낮거나 다쳐서 지금 덜 쓰더라도 는 것은 알린다 (2026-10-23 QA 32).
      m.skw = {특기: 그 날을 쌓은 방 종류, 여러 방이면 '*'} — 방을 옮겼으면 「선실에서 … (지금 파수대)」로 알린다 (QA 33) */
  CB.grow = function () {
    var s = S(), out = []; if (!s || !s.mates) return out;
    s.mates.forEach(function (m) {
      var d = G.MATE[m.id]; if (!d) return;
      var type = CB.roomOf(m), sk = CB.growSkill(type); if (!sk) return;
      m.skd = m.skd || {}; m.skw = m.skw || {};
      var prev = m.skd[sk] || 0;
      if (m.skw[sk] == null) m.skw[sk] = prev > 0 ? '*' : type;   // 옛 저장: 어느 방에서 쌓았는지 모르면 여러 방으로 친다
      else if (m.skw[sk] !== type) m.skw[sk] = '*';
      m.skd[sk] = prev + 1;
      var g = growLevel(m.skd[sk]); m.skg = m.skg || {};
      if (g <= (m.skg[sk] || 0)) return;
      var before = CB.rawSkill(m, sk);
      m.skg[sk] = g;
      var after = CB.rawSkill(m, sk); if (after <= before) return;
      var nm = G.SKILL_BY_ID[sk].name, yrs = Math.round(m.skd[sk] / 365), room = G.CABIN[type].name;
      var t = d.name + U.jx(d.name, '이/가') + ' ' + (m.skw[sk] === type
        ? room + '에서 ' + yrs + '년을 지내며 ' + nm + U.jx(nm, '이/가') + ' 늘었다 (' + nm + ' ' + before + ' → ' + after + ').'
        : '선실에서 ' + nm + U.jx(nm, '을/를') + ' ' + yrs + '년 익혀 한 단계 늘었다 (' + nm + ' ' + before + ' → ' + after + ' · 지금 ' + room + ').');
      var now = R().mateSkill(m, sk);
      if (now < after) {
        var lo = CB.eff(m) < 1, hu = R().mateHurt(m);
        var why = lo && hu ? '충성이 낮고 다쳐 있어서' : lo ? '충성이 낮아 일을 건성으로 해서' : hu ? '다쳐 있어서' : '자리에 없어서';
        t += ' 다만 ' + why + ' 지금은 ' + nm + ' ' + now + '만큼만 쓴다.';
      }
      out.push({ icon: G.CABIN[type].icon || 'star', text: t });
    });
    return out;
  };
  CB.daily = function () {
    var s = S(), out = []; if (!s || !s.mates || !s.player) return out;
    CB.rooms();
    out = out.concat(CB.grow());   // 선실에서 특기가 는다
    var p = s.player, far = B().farRate == null ? 0.3 : B().farRate;
    var aboard = s.mates.filter(function (m) { return G.MATE[m.id] && m.role !== 'captain' && m.role !== 'crew'; });
    var away = s.mates.filter(function (m) { return G.MATE[m.id] && (m.role === 'captain' || m.role === 'crew'); });   // 다른 배의 선장·선원 — 제독의 말만 익힌다
    var myNative = R().nativeLang ? R().nativeLang(p.nation) : 0;
    var chief = CB.chiefInterp(), iRate = B().interpRate || 2;
    function learn(who, name, gain, get, set, cap, how) {
      Object.keys(gain).forEach(function (k) {
        var li = +k, cur = get(li); if (cur >= Math.min(3, cap && cap[k] != null ? cap[k] : 3)) return;   // cap: 가르쳐 준 사람의 단계까지만 (통역관이 물어 배우는 말)
        who.lgd = who.lgd || {};
        who.lgd[li] = (who.lgd[li] || 0) + gain[k] * ((who.id && G.MATE[who.id] && G.MATE[who.id].lgk) || 1) * (who === chief ? iRate : 1);   // lgk: 말을 빨리 배우는 사람 (이야기의 자코모 ×2) · 통역관은 ×interpRate
        var lv = levelFor(who.lgd[li]);
        if (lv > cur) {
          lv = Math.min(lv, cap && cap[k] != null ? Math.max(cap[k], cur) : 3);
          if (lv <= cur) return;
          var fw = who.id && G.Tale && G.Tale.firstWords ? G.Tale.firstWords(who, li) : null;   // 말을 몰랐던 인어공주가 처음 말을 하는 날
          set(li, lv); out.push(fw || { icon: 'scroll', text: name + U.j(name, '이/가').slice(name.length) + (who === chief ? ' 통역실에서 ' + (how && how[k] ? how[k] + '에게 물어 가며 ' : '일행과 말을 나누며 ') : ' 한배에서 지내며 ') + G.LANGS[li] + '를 익혔다 (' + G.LANG_LV[lv] + ').' });
        }
      });
    }
    aboard.forEach(function (m) {
      var gain = {}; gain[myNative] = 1;
      aboard.forEach(function (o) { if (o === m) return; var li = CB.nativeLang(o); if (li == null) return; gain[li] = Math.max(gain[li] || 0, near(m, o) ? 1 : far); });
      var cap = null, how = null;
      if (m === chief) {   // 통역관: 일행이 아는 말을 물어 가며 — 가르쳐 준 사람의 단계까지 (타고난 말은 3까지)
        cap = {}; how = {};
        Object.keys(gain).forEach(function (k) { cap[k] = 3; });
        (CB.langBook() || []).forEach(function (e) {
          if (e.src === 'self' || e.lv <= CB.mateLang(m, e.li)) return;
          if (gain[e.li] == null || gain[e.li] < (B().interpAsk || 1)) gain[e.li] = B().interpAsk || 1;
          if (cap[e.li] == null) cap[e.li] = e.lv;
          how[e.li] = e.name;
        });
      }
      learn(m, G.MATE[m.id].name, gain, function (li) { return CB.mateLang(m, li); }, function (li, lv) { m.lgx = m.lgx || {}; m.lgx[li] = lv; }, cap, how);
    });
    away.forEach(function (m) { var gain = {}; gain[myNative] = 1; learn(m, G.MATE[m.id].name, gain, function (li) { return CB.mateLang(m, li); }, function (li, lv) { m.lgx = m.lgx || {}; m.lgx[li] = lv; }); });
    var mine = {};
    aboard.forEach(function (o) { var li = CB.nativeLang(o); if (li == null) return; mine[li] = Math.max(mine[li] || 0, near('admiral', o) ? 1 : far); });
    learn(p, '제독', mine, function (li) { return p.lg[li] || 0; }, function (li, lv) { p.lg[li] = lv; });
    return out;
  };

  // ---------------------------------------------------------------- 급료와 떠남
  /** 한 달 급료 (회계실이 있으면 조금 덜 든다) */
  CB.wages = function () {
    var s = S(), w = 0;
    var seen = {};   // 같은 사람이 두 줄이어도 한 번만
    s.mates.forEach(function (m) { var d = G.MATE[m.id]; if (d && !seen[m.id]) { seen[m.id] = 1; w += R().mateWage(m.id); } });
    return Math.round(w * Math.max(0.5, 1 - CB.fx('account', 'wage')));
  };
  /** 동료와 선원에게 줄 한 달 급료 합계 */
  CB.totalWages = function (extra) { return CB.wages() + (extra || 0) + (G.World && G.World.crewWage ? G.World.crewWage() : 0); };
  /** 급료는 소지금에서만 지급한다. 예금은 금고에서 찾아야 쓸 수 있다. */
  CB.wageMonths = function (extra) { var w = CB.totalWages(extra); return w > 0 ? Math.floor(S().player.gold / w) : 999; };
  /** 급료가 버거우면 경리나 부관이 하는 말 (괜찮으면 null) — extra: 새로 들일 사람의 급료 */
  CB.wageWarning = function (extra) {
    var mo = CB.wageMonths(extra), lim = BM().warnMonths || 6; if (mo >= lim) return null;
    var w = CB.totalWages(extra);
    return { months: mo, wage: w, text: '제독, 동료·선원 급료가 한 달에 금화 ' + U.num(w) + '닢입니다. 소지금으로는 ' + (mo <= 0 ? '이번 달 급료도 치르지 못합니다.' : mo + '달밖에 버티지 못합니다.') + ' 예금은 금고에서 미리 찾아야 합니다. 급료가 밀리면 충성과 규율이 떨어집니다.' };
  };
  /** 경고를 말할 사람: 경리, 없으면 부관, 없으면 갑판장 */
  CB.warnSpeaker = function () { var SC = G.Scenes; return SC.mateSpeaker ? SC.mateSpeaker(R().purser() ? 'purser' : 'first') : {}; };
  /** 달마다: 할 일 없는 부하는 충성이 떨어지고, 부관이 있으면 조금 오른다. 충성이 바닥나면 떠나겠다고 나선다. 알림을 돌려준다 */
  CB.monthly = function (paid) {
    var s = S(), b = BM(), out = [];
    var adj = CB.power('adjutant') > 0 ? (b.adjutantLoyal == null ? 1 : b.adjutantLoyal) : 0;
    var moved = G.CrewAuto ? G.CrewAuto.refresh() : [], got = G.CrewAuto && G.CrewAuto.notice(moved);   // 충성을 셈하기 전에 자리 없는 부하를 빈 자리에 (js/systems/crewauto.js)
    if (got) out.push({ icon: 'people', text: got });
    CB.tidy();
    s.mates.forEach(function (m) {
      var d = G.MATE[m.id]; if (!d) return;
      var lo = m.loyal == null ? 70 : m.loyal;
      var idle = (!m.role || m.role === 'none') && m.room == null;
      if (idle) lo -= b.idleLoyal == null ? 2 : b.idleLoyal;
      else if (paid && lo < (b.settle || 70)) lo += adj;
      R().setLoyal(m, U.clamp(lo, m.id === 'rocco' ? 5 : 0, 100));
      if (m.loyal <= 0) { s.leaving = s.leaving || []; if (s.leaving.indexOf(m.id) < 0) s.leaving.push(m.id); }
    });
    if (paid) { var w = CB.wageWarning(); if (w) out.push({ icon: 'coin', text: (R().purser() ? '경리' : '부관') + ': 동료·선원 급료가 한 달 ' + U.num(w.wage) + '닢 — 소지금으로 ' + Math.max(0, w.months) + '달 버틴다. 예금은 금고에서 미리 찾아야 한다.' }); }
    var low = s.mates.filter(function (m) { return m.loyal != null && m.loyal > 0 && m.loyal <= (b.low == null ? 40 : b.low); });
    if (low.length) out.push({ icon: 'people', text: low.map(function (m) { return G.MATE[m.id].name; }).join('·') + '의 충성이 낮아 일을 건성으로 한다.' });
    return out;
  };
  /** 떠나겠다는 부하와 이야기한다 (도시에 들어설 때·바다의 하루 끝에 부른다). 붙잡으면 충성이 조금 돌아온다 */
  CB.farewell = async function () {
    var s = S(), UI = G.UI; if (!s || !s.leaving || !s.leaving.length || CB._busy) return;
    CB._busy = true;
    try {
      while (s.leaving.length) {
        var id = s.leaving.shift(), m = s.mates.filter(function (x) { return x.id === id; })[0], d = G.MATE[id];
        if (!m || !d || m.loyal > 0) continue;
        if (G.Wives && G.Wives.of && G.Wives.of(id)) { await G.Wives.farewell(m); continue; }   // 배에 함께 탄 부인: 「더는 당신이랑 못 살겠어요」 (js/systems/wives.js)
        var b = BM(), sp = { name: d.name, portrait: G.Scenes.mateSpec(id), lang: 3 };
        await UI.say(U.pick(['제독, 더는 함께할 수 없소. 이 배에서 내리겠소.', '할 만큼 했소. 다음 항구에서… 아니, 지금 내 짐을 싸겠소.', '당신 밑에서는 더 볼 것이 없소. 여기서 갈라섭시다.']), sp);
        var ML = G.MateLeave, spQ = ML && ML.spouseOf ? ML.spouseOf(id) : null, spW = spQ ? ML.spouseWords(spQ, id) : null;   // 부부는 함께 (2026-11-01) — 짝도 따라 내린다
        var v = await UI.ask(d.name + U.j(d.name, '이/가').slice(d.name.length) + ' 배에서 내리려 한다.' + (spQ ? ML.spouseNote(id, spQ) : ''), [{ label: '붙잡는다 (설득)', value: 1 }, { label: '보내 준다', value: 0 }], sp);
        var p = U.clamp((b.persuade == null ? 0.25 : b.persuade) + (R().stat('cha') - 50) / 200 + R().skill('speech') * (b.persuadeSpeech || 0.12), 0.05, 0.9);
        if (v && U.chance(p)) {
          m.loyal = b.persuadeLoyal || 25;
          await UI.say(U.pick(['…그렇게까지 말한다면, 한 번만 더 믿어 보겠소.', '제독의 말에 마음이 흔들리는군. 좋소, 조금 더 타 보지.']), sp);
          UI.toast(d.name + U.j(d.name, '을/를').slice(d.name.length) + ' 붙잡았다. (충성 ' + m.loyal + ')', 'people', 4000);
        } else {
          if (v) await UI.say(U.pick(['말로 될 일이 아니오. 잘 있으시오.', '이미 마음을 정했소.']), sp);
          if (G.OldGuard) G.OldGuard.left(id, 'quit');   // 사건 동료는 스무 해 뒤 철새로 (js/systems/oldguard.js)
          s.mates = s.mates.filter(function (x) { return x !== m; });
          if (R().tidyCaptains) R().tidyCaptains();
          s.flags['gone_' + id] = 1;
          if (G.Wives && G.Wives.sync) G.Wives.sync();   // 혹시 부인이었으면 「배에 함께」를 풀고 제 집으로 (부인은 위의 G.Wives.farewell 이 먼저 맡는다)
          G.State.log(d.name + U.j(d.name, '이/가').slice(d.name.length) + ' 함대를 떠났다.');
          UI.toast(d.name + U.j(d.name, '이/가').slice(d.name.length) + ' 함대를 떠났다.', 'boot', 4500);
          if (spQ) await ML.follow(id, 'quit', { spouse: spQ, words: spW });
        }
      }
    } catch (e) { console.error(e); }
    CB._busy = false;
    if (G.Game.refreshHud) G.Game.refreshHud();
  };
})(window.G = window.G || {});
