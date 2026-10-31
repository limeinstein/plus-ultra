/* 배마다의 자리와 자동 배치 (G.CrewAuto) — 2026-10-28 사용자 요청
   · 기함: 제독이 선장(함장실). 부관·항해사·측량사·통역·경리는 술집 「부하편성」에서 정한다.
           그 밖의 선실(갑판·요리실 …)은 손으로 두거나 선실 화면의 「자동 배치」로 능력에 맞게 채운다.
   · 다른 배: 선장 · 조타수 · 갑판 · 파수꾼 네 자리와 그 배 크기만큼의 선실(G.Cabins.slots). 사람은 늘 자동으로, 능력에 맞게 앉힌다.
     선장은 예전처럼 그 배를 몬다(R.captain — 항해술·포술·검술·조선기술·무력).
     조타수·갑판·선실은 함대 효과가 없다 — 「할 일 없는 부하」가 되지 않게 해 달마다 충성이 떨어지지 않을 뿐이다.
     파수꾼만은 측량 단계마다 지도 제작 속도 +5% (js/systems/cartography.js — 2026-10-29)
   · 자동으로 채우는 때(CA.refresh): 도시에 들어올 때 · 출항할 때 · 달마다(충성을 셈하기 전) · 부하가 들어왔을 때 · 기함을 바꿨을 때 · 해전 뒤 · 선실·편성 화면을 열 때.
     첫 항해 안내(튜토리얼) 중에는 저절로 채우지 않는다 — 제독이 선실에 앉혀 보는 단계가 있다.
     이때는 자리가 없는 부하와 다른 배의 사람만 움직이고, 기함 선실에 앉은 사람은 그대로 둔다(기함의 빈 방은 채운다).
   · 「자동 배치」(CA.autoAll): 술집에서 정한 역할이 없는 부하 모두를 기함 선실과 다른 배 자리에 다시 앉힌다.
   · 다른 배의 선장은 손으로 바꿀 수 있다 (2026-10-31 사용자 요청): 「다른 배의 사람들」에서 선장 자리를 누르거나, 술집 부하편성에서 「○○호 선장」.
     손으로 정한 선장(m.capLock)은 자동 채우기·「자동 배치」가 바꾸지 않는다 — 「능력에 맞게 저절로」를 고르면 다시 자동.
   저장: 다른 배의 자리 — m.role = 'crew', m.ship = 배 uid, m.post = 'helm' | 'deck' | 'lookout' | 'cabin'. 선장은 예전처럼 m.role = 'captain', m.ship (손으로 정했으면 m.capLock = 1).
   옛 저장에는 'crew'가 없다 — 처음 채울 때 만든다. 조정값 G.BALANCE.crewAuto */
(function (G) {
  'use strict';
  var CA = {};
  G.CrewAuto = CA;
  function S() { return G.Game && G.Game.state; }
  function R() { return G.R; }
  function CB() { return G.Cabins; }
  function K() { return (G.BALANCE && G.BALANCE.crewAuto) || {}; }

  CA.POSTS = [
    { id: 'helm', name: '조타수', icon: 'wheel', skills: ['nav', 'ops'], main: ['nav'], sub: ['ops'], desc: '키를 잡는다.' },
    { id: 'deck', name: '갑판', icon: 'ship', skills: ['ops', 'sword'], main: ['ops'], sub: ['sword'], desc: '갑판에서 선원들을 부린다.' },
    { id: 'lookout', name: '파수꾼', icon: 'telescope', skills: ['survey', 'hist'], main: ['survey'], sub: ['hist'], desc: '돛대 꼭대기에서 바다를 살핀다. 측량 단계마다 해도가 5%씩 빨리 상세해진다.' }
  ];
  CA.POST = {};
  CA.POSTS.forEach(function (p) { CA.POST[p.id] = p; });
  /** 술집 「부하편성」에서 정하는 기함 역할 — 자동 배치가 건드리지 않는다 */
  var TAVERN_ROLE = { first: 1, nav: 1, surveyor: 1, interp: 1, purser: 1 };
  CA.tavernRole = function (m) { return !!(m && TAVERN_ROLE[m.role]); };
  /** 자리가 없는 부하 (달마다 충성이 떨어진다) */
  CA.idle = function (m) { return !!m && (!m.role || m.role === 'none') && m.room == null; };
  CA.others = function () { var s = S(); return s && s.fleet ? s.fleet.ships.slice(1) : []; };
  CA.shipByUid = function (uid) { var s = S(); return s && s.fleet ? s.fleet.ships.filter(function (x) { return x.uid === uid; })[0] || null : null; };
  /** 이 배의 선실 수 (기함과 같은 셈 — 큰 배일수록 많다) */
  CA.berths = function (sh) { return CB() && sh ? CB().slots(sh) : 0; };
  /** 이 배의 사람들 {captain, helm, deck, lookout, cabin: [..]} */
  CA.crewOf = function (sh) {
    var s = S(), o = { captain: null, helm: null, deck: null, lookout: null, cabin: [] };
    if (!s || !sh) return o;
    s.mates.forEach(function (m) {
      if (!m || m.ship !== sh.uid) return;
      if (m.role === 'captain') o.captain = m;
      else if (m.role === 'crew') { if (m.post === 'cabin') o.cabin.push(m); else if (CA.POST[m.post]) o[m.post] = m; }
    });
    return o;
  };
  /** 「조타수 · ○○호」 */
  CA.placeName = function (m) {
    var sh = CA.shipByUid(m.ship), p = CA.POST[m.post];
    return (p ? p.name : '선실') + (sh ? ' · ' + sh.name + '호' : '');
  };

  /** 고치기: 없어진 배·기함에 있는 사람, 이름 모를 자리, 같은 자리 둘, 선실 수를 넘친 사람은 대기로 (R.tidyCaptains 가 부른다) */
  CA.tidy = function () {
    var s = S(); if (!s || !s.mates || !s.fleet) return;
    var idx = {}, seen = {}, berth = {};
    s.fleet.ships.forEach(function (sh, k) { idx[sh.uid] = k; });
    s.mates.forEach(function (m) {
      if (!m) return;
      if (m.capLock && m.role !== 'captain') delete m.capLock;   // 선장 자리를 떠났으면 손으로 정한 표시도 끝
      if (m.role !== 'crew') { if (m.post != null) delete m.post; return; }
      var k = idx[m.ship], sh = s.fleet.ships[k], bad = !(k > 0) || !(m.post === 'cabin' || CA.POST[m.post]);
      if (!bad && m.post === 'cabin') { berth[m.ship] = (berth[m.ship] || 0) + 1; bad = berth[m.ship] > CA.berths(sh); }
      else if (!bad) { var key = m.ship + ':' + m.post; bad = !!seen[key]; seen[key] = 1; }
      if (m.room != null) { delete m.room; delete m.roomType; }
      if (bad) { m.role = 'none'; delete m.ship; delete m.post; }
    });
  };

  // ---------------------------------------------------------------- 능력에 맞는 정도
  function eff(m) { return CB() ? CB().eff(m) : 1; }
  function skill(m, id) { return R().mateSkill(m, id); }
  /** 특기 가운데 가장 높은 단계 + 나머지 조금 */
  function bestOf(m, ks) { var best = 0, sum = 0; (ks || []).forEach(function (k) { var v = skill(m, k); best = Math.max(best, v); sum += v; }); return best + (sum - best) * 0.1; }
  /** 주 특기(★) 그대로 · 보조 특기(☆) 절반 + 다른 특기 조금 — 기함 선실과 같은 셈 (js/systems/cabins.js CB.roomLevel · 2026-10-29 피드백) */
  function fitOf(m, c) {
    if (!CB() || !CB().roomLevel) return bestOf(m, c.skills || G.ROLE_SKILLS[c.role] || []);
    var rs = CB().roomSkills(c), lv = CB().roomLevel(c, m), sum = 0; rs.main.concat(rs.sub).forEach(function (k) { sum += skill(m, k); });
    return lv ? lv + sum * 0.05 : 0;
  }
  /** 기함 방에 맞는 정도 (선실 화면의 추천과 같은 셈 — 통역실은 제독보다 잘하는 말) */
  CA.roomFit = function (m, type) {
    var c = G.CABIN[type]; if (!c || !G.MATE[m.id]) return 0;
    if (c.lang) {
      var p = S().player, n = 0, L = G.LANGS || [];
      for (var li = 0; li < L.length; li++) { var a = CB().mateLang(m, li), b = (p.lg && p.lg[li]) || 0; if (a > b) n += a - b; }
      return Math.min(3, n * 0.5) * eff(m);
    }
    return fitOf(m, c) * eff(m);
  };
  /** 선장에 맞는 정도: 항해술(속력·폭풍) · 포술 · 검술 · 조선기술 + 무력(백병전) — 0~4 */
  CA.captainFit = function (m) {
    var d = G.MATE[m.id]; if (!d) return 0;
    var w = K().capW || { nav: 1, gun: 0.6, sword: 0.6, ship: 0.3 }, t = 0, ws = 0;
    Object.keys(w).forEach(function (k) { t += skill(m, k) * w[k]; ws += w[k]; });
    var str = (d.st && d.st[2]) || 50;
    return (t / (ws || 1) + str / 100) * eff(m);
  };
  /** 다른 배의 조타수·갑판·파수꾼에 맞는 정도 */
  CA.postFit = function (m, post) { var p = CA.POST[post]; return p && G.MATE[m.id] ? fitOf(m, p) * eff(m) : 0; };

  // ---------------------------------------------------------------- 자리와 배치
  function isAt(m, st) {
    if (st.k === 'room') return m.room === st.i && m.role !== 'crew' && m.role !== 'captain';
    if (st.k === 'captain') return m.role === 'captain' && m.ship === st.sh.uid;
    if (st.k === 'post') return m.role === 'crew' && m.ship === st.sh.uid && m.post === st.post;
    return m.role === 'crew' && m.ship === st.sh.uid && m.post === 'cabin';
  }
  /** 한 사람을 한 자리에 앉혔을 때의 값: 기함 방(효과) > 다른 배 선장 > 조타수·갑판·파수꾼 > 선실. 같으면 지금 자리 그대로 */
  function value(m, st) {
    var k = K(), keep = isAt(m, st) ? 0.01 : 0;
    if (st.k === 'room') return (k.flag == null ? 1 : k.flag) + CA.roomFit(m, st.type) + keep;
    if (st.k === 'captain') return (k.cap == null ? 1.5 : k.cap) + CA.captainFit(m) + keep;
    if (st.k === 'post') return (k.post == null ? 0.3 : k.post) + 0.1 * CA.postFit(m, st.post) + keep;
    return (k.berth == null ? 0.1 : k.berth) + keep;
  }
  /** 손으로 정한 다른 배 선장 (자동 채우기·자동 배치가 건드리지 않는다) */
  CA.locked = function (m) { return !!(m && m.capLock && m.role === 'captain'); };
  /** 움직일 사람: fill — 자리 없는 사람과 다른 배 사람 · all — 술집 역할이 없는 모두. 둘째 부인처럼 숨어 있는 사람·손으로 정한 선장은 빼고 */
  function poolOf(mode) {
    var s = S();
    return s.mates.filter(function (m) {
      if (!m || !G.MATE[m.id] || CA.tavernRole(m) || CA.locked(m)) return false;
      if (R().mateHidden && R().mateHidden(m)) return false;
      if (mode === 'all') return true;
      return CA.idle(m) || m.role === 'captain' || m.role === 'crew';
    });
  }
  /** 앉힐 자리: 기함의 사람을 둘 수 있는 방(회계실은 경리의 방이라 뺀다) — fill이면 빈 방만 · 다른 배마다 선장·조타수·갑판·파수꾼·선실 */
  function seatsOf(mode, pool) {
    var out = [];
    if (CB()) {
      CB().rooms().forEach(function (t, i) {
        if (t === 'hold' || t === 'account' || CB().noStaff(t)) return;
        var occ = CB().occupant(i);
        if (occ && (mode === 'fill' || pool.indexOf(occ) < 0)) return;
        out.push({ k: 'room', i: i, type: t });
      });
    }
    // 다른 배: 선장들 → 조타수들 → 갑판들 → 파수꾼들 → 선실 (값이 같으면 앞의 자리부터 — 사람이 모자라도 배마다 고르게)
    var ships = CA.others().filter(function (sh) { return sh && sh.uid != null; });
    ships.forEach(function (sh) { if (!CA.locked(CA.crewOf(sh).captain)) out.push({ k: 'captain', sh: sh }); });   // 손으로 정한 선장의 배는 그 자리를 빼고
    CA.POSTS.forEach(function (p) { ships.forEach(function (sh) { out.push({ k: 'post', sh: sh, post: p.id }); }); });
    var most = 0; ships.forEach(function (sh) { most = Math.max(most, CA.berths(sh)); });
    for (var b = 0; b < most; b++) ships.forEach(function (sh) { if (b < CA.berths(sh)) out.push({ k: 'berth', sh: sh, n: b }); });
    return out;
  }
  /** 짝 짓기: 값이 큰 짝부터 (사람·자리가 비어 있으면) — [{m, st}] */
  CA.plan = function (mode) {
    var s = S(); if (!s || !s.mates || !s.fleet || !s.fleet.ships.length) return [];
    var pool = poolOf(mode), seats = seatsOf(mode, pool), pairs = [];
    pool.forEach(function (m, a) { seats.forEach(function (st, b) { pairs.push({ m: m, st: st, v: value(m, st), a: a, b: b }); }); });
    pairs.sort(function (x, y) { return (y.v - x.v) || (x.a - y.a) || (x.b - y.b); });
    var usedM = {}, usedS = {}, out = [];
    pairs.forEach(function (p) {
      if (usedM[p.a] || usedS[p.b]) return;
      usedM[p.a] = usedS[p.b] = 1; out.push({ m: p.m, st: p.st });
    });
    return out;
  };
  function where(m) { return CB() ? CB().placeName(m) : R().roleName(m); }
  /** 배치를 바꾼다 — 돌려주는 값: 자리가 바뀐 사람 [{m, from, to, wasIdle}] */
  CA.apply = function (mode) {
    var s = S(); if (!s || !s.mates || !s.fleet || !s.fleet.ships.length) return [];
    if (CB()) CB().rooms();
    var plan = CA.plan(mode), pool = poolOf(mode), before = pool.map(function (m) { return { m: m, from: where(m), idle: CA.idle(m) }; });
    pool.forEach(function (m) {
      if (m.room != null) { delete m.room; delete m.roomType; }
      if (m.role === 'captain' || m.role === 'crew') { m.role = 'none'; delete m.ship; delete m.post; }
    });
    plan.forEach(function (p) {
      var m = p.m, st = p.st;
      if (st.k === 'room') CB().place(m, st.i);
      else if (st.k === 'captain') { m.role = 'captain'; m.ship = st.sh.uid; }
      else { m.role = 'crew'; m.ship = st.sh.uid; m.post = st.k === 'post' ? st.post : 'cabin'; }
    });
    if (R().tidyCaptains) R().tidyCaptains();
    var out = [];
    before.forEach(function (b) { var to = where(b.m); if (to !== b.from) out.push({ m: b.m, from: b.from, to: to, wasIdle: b.idle }); });
    return out;
  };
  /** 늘 하는 채우기: 자리 없는 사람을 빈 자리에, 다른 배는 능력에 맞게 다시 */
  CA.refresh = function () {
    var s = S(); if (!s || !s.mates || !s.mates.length || !s.fleet || !s.fleet.ships.length) return [];
    if (G.Tutorial && G.Tutorial.active && G.Tutorial.active()) return [];   // 첫 항해 안내 중에는 제독이 손으로 앉혀 본다 (튜토리얼 7단계 「선실」)
    try { CA.tidy(); return CA.apply('fill'); } catch (e) { console.error(e); return []; }
  };
  /** 「자동 배치」: 술집 역할이 없는 부하 모두를 능력에 맞게 */
  CA.autoAll = function () {
    var s = S(); if (!s || !s.mates || !s.fleet || !s.fleet.ships.length) return [];
    CA.tidy(); return CA.apply('all');
  };
  /** 다른 배의 선장을 손으로 정한다 (m = null이면 그 배 선장을 다시 「능력에 맞게 저절로」).
      m이 다른 배에 있었으면 밀려난 선장이 m의 자리로 바꿔 앉고, 그 밖이면(기함 선실·술집 역할·대기) 밀려난 선장은 빈 자리를 저절로 찾는다.
      돌려주는 값: 밀려난 선장 (없으면 null) */
  CA.setCaptain = function (uid, m) {
    var s = S(), sh = CA.shipByUid(uid); if (!s || !sh || s.fleet.ships[0] === sh) return null;
    var prev = CA.crewOf(sh).captain;
    if (!m) { if (prev) delete prev.capLock; CA.refresh(); return null; }
    if (prev === m) { m.capLock = 1; return null; }
    var from = { role: m.role, ship: m.ship, post: m.post, lock: m.capLock };
    if (m.room != null && CB()) CB().place(m, null);
    m.role = 'captain'; m.ship = uid; m.capLock = 1; delete m.post;
    if (prev) {
      delete prev.capLock;
      if (from.role === 'captain' && from.ship != null) { prev.role = 'captain'; prev.ship = from.ship; if (from.lock) prev.capLock = 1; }   // 두 배의 선장을 맞바꾼다
      else if (from.role === 'crew' && from.ship != null) { prev.role = 'crew'; prev.ship = from.ship; prev.post = from.post; }
      else { prev.role = 'none'; delete prev.ship; delete prev.post; }
    }
    if (R().tidyCaptains) R().tidyCaptains();
    if (CB()) CB().tidy();
    CA.refresh();   // 비운 자리(기함 선실·다른 배)와 밀려난 사람을 저절로
    return prev && prev !== m ? prev : null;
  };
  /** 자리를 얻은 사람 알림 한 줄 (없으면 null): 「자리가 없던 ○○ → 조타수 · △△호」 */
  CA.notice = function (moved) {
    var got = (moved || []).filter(function (x) { return x.wasIdle && !CA.idle(x.m); });
    if (!got.length) return null;
    return '자리가 없던 ' + got.slice(0, 4).map(function (x) { return G.MATE[x.m.id].name + ' → ' + x.to; }).join(' · ') + (got.length > 4 ? ' 외 ' + (got.length - 4) + '명' : '') + '.';
  };
  /** 자리가 없는 부하 수 */
  CA.idleCount = function () { var s = S(); return s && s.mates ? s.mates.filter(function (m) { return G.MATE[m.id] && CA.idle(m); }).length : 0; };
})(window.G = window.G || {});
