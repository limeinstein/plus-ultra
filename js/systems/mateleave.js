/* 오래 함께한 부하와의 이별 (G.MateLeave) — 대사·조정값: js/data/mateleave.js (G.MATE_LEAVE · G.BALANCE.mateLeave). 2026-10-28 사용자 요청
   ■ 누가: 40년(longYears) 넘게 함께 항해했지만 지금 기함의 선실(부관실·조타실·파수대 포함)에 들지 못하고 다른 배의 선장도 아닌 부하 — 「노장」 (2026-10-29 사용자 요청 · js/systems/oldguard.js)
     제독이 60세(oldAge)를 넘었으면 가능성이 bothK배. 본처·둘째 부인, 동생(js/systems/siblings.js), 첫 항해 안내 중, 섭정 중에는 없다.
     사건으로 얻은 부하(MLV.eventMate — 옛이야기·전설 동료(tale), 술집에 나오지 않는 사건 동료(eventOnly), 사건이 맞아들인 부하(m.ev), 옛 저장은 evIds와 아즈텍 사건의 세 사람)는
     죽지 않고 고향으로 돌아갈 뿐이다 — 배에서 내리고 스무 해 뒤 다른 이름의 철새로 나타난다 (G.OldGuard.left · newYear).
   ■ 언제: 달마다(js/systems/world.js W.newMonth) — 겪을 수 있는 부하마다 가능성(monthly · 둘 다 해당하면 ×bothK, 실존 인물이 역사 속 활약을 마친 해를 넘겼으면 ×pastK)을 모아 그달 일어날지 정한다.
     한 제독이 80세(maxAge)가 될 때까지 모두 3번(lifeMax — 위기를 넘기거나 붙잡은 것도 센다), 사건 사이는 3년(gapDays) 넘게, 한 해에 많아야 둘(perYear). 2026-10-29 사용자 요청
     누가 겪나: 무작위가 아니라 「최근 선실에 머문 날」(m.cabRec — 기함의 선실·부관실·조타실·파수대에 있던 날, cabinHalf일마다 절반으로 친다)이 가장 적은 부하부터.
     같으면 선실에서 지낸 날 모두(m.skd 합)가 적은 쪽, 그다음 오래 함께한 쪽.
     사건은 도시·바다·뭍에서 다른 창이 없을 때 띄운다 (main.js 의 loop → MLV.tick).
   ■ 무엇: 사망(병·늙음) · 건강(무릎·눈·손 — 배에서 내려 고향으로) · 다른 일(손주·제 배·수도원·항해기·술집).
     사망·건강은 위기를 넘길 수 있다 — 짐칸의 약재(교역품 herbs 1통) · 배의 의원(의학 특기, 진료실이 있으면 더) · 제독의 의학 · 항구의 의원(도시에서만, 금화).
     넘기면 그 부하는 calm일 동안 다시 겪지 않고, 한 해 셈에도 들지 않는다. 다른 일로 떠나는 부하는 충성이 holdLoyal 이상이면 붙잡아 볼 수 있다.
   ■ 떠난 부하: 함대에서 빠지고 술집에 다시 나타나지 않는다(gone_). 남은 이야기는 s.mateFate[id] = {kind, why, y, home, at} — 여급에게 행방을 물으면 이것을 알려 준다.
   ■ 부부는 함께(2026-11-01 사용자 피드백): 떠나는 부하에게 배에 함께 탄 짝(MLV.spouseOf)이 있으면 그 짝도 한마디 하고 함께 내린다(MLV.follow — why 'spouse', with).
     죽음은 빼고. 해고(js/city/tavern.js)·충성이 바닥나 떠남(js/systems/cabins.js)·사례금(js/systems/sponsor.js)·세대 교체(js/systems/oldguard.js)도 같다.
     짝이 떠나지 않기로 한 사람(후계 약속·후견·붙잡힘)이면 둘 다 이별을 겪지 않고, 짝이 있는 부하는 수도원으로 떠나지 않는다.
   ■ 저장: s.mateLeave = {y: 해, n: 그해 일어난 수, pend: [{id, kind, why}], life: {gen, n}, last: 마지막 사건 날, td: 선실 날을 센 날} · s.mates[i].leaveCd · s.mates[i].cabRec */
(function (G) {
  'use strict';
  var U = G.U;
  var MLV = G.MateLeave = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return G.BALANCE.mateLeave; }
  function D() { return G.MATE_LEAVE; }
  function R() { return G.R; }
  function st() {
    var s = S(), o = s.mateLeave || (s.mateLeave = { y: s.date.y, n: 0, pend: [] });
    if (o.y !== s.date.y) { o.y = s.date.y; o.n = 0; }
    return o;
  }
  MLV.st = st;
  /** 이 제독이 겪은 이별 사건 수 {gen, n} — 대가 바뀌면 새로 센다. 옛 저장은 이 제독이 어른이 된 뒤 떠난 부하(s.mateFate) 수로 채운다 */
  function life() {
    var s = S(), o = st(), g = s.player.generation || 1;
    if (!o.life || o.life.gen !== g) {
      var n = 0;
      if (!o.life) { var y0 = (s.date.y - (R().age ? R().age() : 0)) + 16; Object.keys(s.mateFate || {}).forEach(function (id) { var f = s.mateFate[id]; if (f && f.y >= y0) n++; }); }
      o.life = { gen: g, n: Math.min(n, K().lifeMax || 3) };
    }
    return o.life;
  }
  MLV.life = life;
  /** 지금 기함의 선실(갑판이 아닌 방 · 부관실·조타실·파수대)에 있나 */
  MLV.inCabin = function (m) { var t = G.Cabins && G.Cabins.roomOf ? G.Cabins.roomOf(m) : null; return !!t && t !== 'deck'; };
  /** 「최근 선실에 머문 날」을 센다 — 지난 날은 cabinHalf일마다 절반 (MLV.tick이 날이 바뀔 때마다 부른다) */
  MLV.track = function () {
    var s = S(); if (!s || !s.mates || s.day == null) return;
    var o = st(); if (o.td == null) { o.td = s.day; return; }
    var d = s.day - o.td; if (d <= 0) return;
    d = Math.min(d, 3650); o.td = s.day;
    var q = Math.pow(0.5, 1 / (K().cabinHalf || 365)), qd = Math.pow(q, d), add = (1 - qd) / (1 - q);
    s.mates.forEach(function (m) { m.cabRec = (m.cabRec || 0) * qd + (MLV.inCabin(m) ? add : 0); });
  };
  function cabinAll(m) { var n = 0; for (var k in (m.skd || {})) n += m.skd[k] || 0; return n; }
  /** 겪을 수 있는 부하를 차례로 — 최근 선실에 머문 날이 적은 부하부터 [{m, w, rec}] */
  MLV.order = function () {
    var s = S();
    return s.mates.map(function (m, i) { return { m: m, w: MLV.weight(m), rec: m.cabRec || 0, all: cabinAll(m), yrs: MLV.years(m), i: i }; })
      .filter(function (x) { return x.w > 0; })
      .sort(function (a, b) { return (a.rec - b.rec) || (a.all - b.all) || (b.yrs - a.yrs) || (a.i - b.i); });
  };
  /** 함께한 햇수 (joined 0 = 처음부터 함께한 부하 → 게임 날수로) */
  MLV.years = function (m) {
    var s = S();
    if (!m.joined) return Math.floor((s.day || 0) / 365);
    return Math.max(0, Math.floor((U.dateNum(s.date) - m.joined) / 10000));
  };
  function tut() { return !!(G.Tutorial && G.Tutorial.active && G.Tutorial.active()); }
  function isWife(id) { var p = S().player; return p.wife === id || !!(G.Wives && G.Wives.of && G.Wives.of(id)); }
  /** 사건으로 얻은 부하인가 — 이별을 겪지 않는다 */
  MLV.eventMate = function (m) {
    var d = G.MATE[m.id], s = S(); if (!d) return false;
    if (m.ev || d.tale || d.eventOnly) return true;
    if ((K().evIds || []).indexOf(m.id) >= 0) return true;
    if (s.aztec && ['aguilar', 'marina', 'h_cuauhtemoc'].indexOf(m.id) >= 0 && m.joined && m.joined >= 15190101 && m.joined <= 15211231) return true;   // 옛 저장: 아즈텍 사건 동안 들어온 세 사람
    return false;
  };
  /** 이 부하가 이별을 겪을 수 있나 — 배수(0이면 아니다) */
  MLV.weight = function (m) {
    var s = S(), k = K(), d = G.MATE[m.id]; if (!d || d.sib || m.devoted || isWife(m.id)) return 0;
    if (m.role === 'captain' || MLV.inCabin(m)) return 0;
    if (G.HeirPlan && G.HeirPlan.pledged(m)) return 0;                             // 후계를 맡기로 약속한 부하는 그날까지 떠나지 않는다 (js/systems/heirplan.js)                          // 기함의 선실에 들었거나 다른 배의 선장이면 아니다 (2026-10-29)
    if (m.leaveCd && s.day < m.leaveCd) return 0;
    if (st().pend.some(function (x) { return x.id === m.id; })) return 0;
    // 부부는 함께 떠나니(MLV.follow) — 짝이 떠나지 않기로 한 사람(후계를 위한 약속 · 후견 · 붙잡힌 사람)이거나 짝의 이별이 이미 정해졌으면 둘 다 남는다 (2026-11-01)
    var sp = MLV.spouseOf(m.id), sr = sp ? row(sp) : null;
    if (sr && (sr.devoted || (G.HeirPlan && G.HeirPlan.pledged(sr)) || (sr.leaveCd && s.day < sr.leaveCd) || st().pend.some(function (x) { return x.id === sp; }))) return 0;
    if (MLV.years(m) < k.longYears) return 0;                                      // 40년 넘게 함께한 노장만
    var w = R().age() >= k.oldAge ? k.bothK : 1;
    if (MLV.past(d)) w *= k.pastK;
    return w;
  };
  /** 실존 인물이 역사 속 활약을 마친 해를 넘겼나 (철새·마녀·동생은 아니다) */
  MLV.past = function (d) { return !!(d && !d.wd && !d.witch && !d.sib && d.y && d.y[1] && d.y[1] < 9000 && S().date.y > d.y[1]); };

  /** 달마다 (world.js W.newMonth): 일어날 일을 정해 둔다 — 알림은 없다 (사건이 직접 보여 준다) */
  MLV.newMonth = function () {
    var s = S(), k = K(), o = st();
    if (!s || !s.mates || !s.mates.length || tut() || s.regency) return [];
    if (o.n >= k.perYear) return [];
    var L = life(); if (L.n >= (k.lifeMax || 3)) return [];                        // 이 제독이 80세가 될 때까지 모두 3번
    if (o.last != null && s.day - o.last < (k.gapDays || 0)) return [];            // 사건 사이는 3년 넘게
    if (R().age && R().age() > (k.maxAge || 80)) return [];
    MLV.track();
    var cand = MLV.order(); if (!cand.length) return [];
    var none = 1; cand.forEach(function (x) { none *= 1 - Math.min(1, k.monthly * x.w); });
    if (!U.chance(1 - none)) return [];
    [cand[0].m].forEach(function (m) {                                              // 최근 선실에 가장 덜 머문 부하
      var d = G.MATE[m.id], kw = { death: MLV.eventMate(m) ? 0 : k.kinds.death * (MLV.past(d) ? 2 : 1), health: k.kinds.health, other: k.kinds.other };   // 사건 동료는 죽지 않고 고향으로
      var kind = U.weighted(Object.keys(kw), function (x) { return kw[x]; });
      var e = { id: m.id, kind: kind };
      if (kind === 'other') { var wed = !!MLV.spouseOf(m.id); e.why = U.pick(D().other.reasons.filter(function (r) { return r.pick !== false && !(wed && r.couple === false); })).id; }   // 짝이 있는 부하는 수도원으로 가지 않는다
      if (kind === 'health') e.line = U.ri(0, D().health.lines.length - 1);
      o.pend.push(e); o.n++; L.n++; o.last = s.day;
    });
    return [];
  };

  // ---------------------------------------------------------------- 글
  function row(id) { return S().mates.filter(function (m) { return m.id === id; })[0] || null; }
  function homeOf(id) {
    var r = G.MATE_RANGE && G.MATE_RANGE[id], c = r && r.home != null ? G.CITY_DATA[r.home] : null, m = row(id);
    if (!c && m && m.from != null) c = G.CITY_DATA[m.from];
    if (!c) c = G.CITY_DATA[S().player.home];
    return c;
  }
  function here() { var s = S(); return s.loc && s.loc.mode === 'city' ? G.CITY_DATA[s.loc.city] : null; }
  function fill(t, id, extra) {
    var d = G.MATE[id] || {}, m = row(id), c = here(), hc = homeOf(id);
    var o = { name: d.name || '', me: S().player.name, yrs: m ? MLV.years(m) : 0, home: hc ? hc.name : '', city: c ? c.name : '' };
    for (var x in extra || {}) o[x] = extra[x];
    return String(t).replace(/\{(\w+)(?::([^}]+))?\}/g, function (all, key, pair) {
      if (o[key] == null) return all;
      var w = String(o[key]); return pair ? U.j(w, pair) : w;
    });
  }
  MLV.fill = fill;
  function mateSp(id) { var d = G.MATE[id]; return { name: d.name, portrait: G.Scenes.mateSpec(id), half: G.Img.chain.mateHalf(id), lang: 3 }; }
  async function lines(list, id, extra, doc) {
    list = [].concat(list || []);
    for (var i = 0; i < list.length; i++) {
      var l = list[i], who = l.slice(0, 2), t = fill(l.slice(2), id, extra);
      if (who === 'm:') await G.UI.say(t, mateSp(id));
      else if (who === 'd:' && doc) await G.UI.say(t, mateSp(doc));
      else if (who === 'p:') { var p = S().player; await G.UI.say(t, { name: p.name, portrait: p.portrait, half: G.Img.chain.heroHalf ? G.Img.chain.heroHalf() : null, lang: 3 }); }
      else await G.UI.say(t, {});
    }
  }

  // ---------------------------------------------------------------- 부부는 함께 — 2026-11-01 사용자 피드백 「손주를 보러 떠난 항해사의 짝이 배에 그대로 남았다」
  //   부부 한쪽이 배를 떠나면(이별의 「다른 일로」·「몸이 상해」, 해고, 충성이 바닥나 떠남, 사례금을 못 받아 떠남, 세대 교체) 짝도 함께 내린다.
  //   죽음은 빼고 — 남은 짝은 배에 남아 슬퍼한다 (js/systems/romance.js widow). 잠시 자리를 비우는 이야기(이순신이 전라좌수영으로 — 노량 뒤에 돌아온다)도 빼고.
  /** 배에 함께 탄 짝의 id — 부하끼리 혼례를 올린 부부(G.Romance 부부 단계 · 견우와 직녀)와 처음부터 짝인 사람(d.wed: 셰익스피어와 앤 · 로미오와 줄리엣). 없으면 null
      두 사람이 모두 배에 있을 때 불러야 한다(견우와 직녀는 둘 다 있어야 부부로 본다) — 떠나는 사람을 함대에서 빼기 전에 */
  MLV.spouseOf = function (id) {
    var s = S(); if (!s || !s.mates || !id) return null;
    var p = G.Romance && G.Romance.pairOf ? G.Romance.pairOf(id) : null, o = null;
    if (p && p.stage === 'wed' && (p.m === id || p.f === id)) o = p.m === id ? p.f : p.m;
    var d = G.MATE[id]; if (!o && d && d.wed && G.MATE[d.wed]) o = d.wed;
    return o && o !== id && row(o) ? o : null;
  };
  function callOf(id) { var d = G.MATE[id]; return d && d.g === 'f' ? '아내' : d && d.g === 'm' ? '남편' : '짝'; }
  /** 짝 대사의 낱말 — {name} 따라 내리는 사람 · {mate} 먼저 떠나는 사람 · {who} 그를 부르는 말 · {self} 떠나는 사람이 따라 내리는 사람을 부르는 말 · {home} 두 사람이 가는 곳 */
  MLV.spouseWords = function (sp, goneId, homeId) {
    var s = S(), gd = G.MATE[goneId] || {}, fate = (s.mateFate || {})[goneId], hc = null;
    if (homeId != null) hc = G.CITY_DATA[homeId];
    else if (fate && fate.home != null) hc = G.CITY_DATA[fate.home];
    else hc = homeOf(goneId);
    return { mate: gd.name || '', who: callOf(goneId), self: callOf(sp), home: hc ? hc.name : '고향', homeId: hc ? hc.id : null };
  };
  /** 떠나려는 부하에게 무엇을 해 줄지 물을 때 덧붙이는 말 「(아내 ○○도 함께 떠난다)」 — 짝이 없으면 '' */
  MLV.spouseNote = function (goneId, sp) {
    sp = sp || MLV.spouseOf(goneId); if (!sp) return '';
    return ' ' + fill(D().spouse.note, sp, MLV.spouseWords(sp, goneId));
  };
  /** 해고를 물을 때 덧붙이는 말 — 짝이 없으면 '' */
  MLV.fireWarn = function (goneId, sp) {
    sp = sp || MLV.spouseOf(goneId); if (!sp) return '';
    return fill(D().spouse.fireWarn, sp, MLV.spouseWords(sp, goneId));
  };
  /** 짝을 따라 함대에서 뺀다 (대사 없이) — 남은 이야기는 「짝을 따라」(s.mateFate[id] = {kind:'other', why:'spouse', with: 먼저 떠난 사람})
      동생(d.sib)은 집으로 돌아간다 — 그 뒤는 js/systems/siblings.js 가 맡는다. quiet: 알림 없이 (여럿을 한 줄로 알릴 때) */
  MLV.goWith = function (sp, goneId, how, w, quiet) {
    var s = S(), d = G.MATE[sp], m = row(sp), c = here(); if (!d || !m) return false;
    w = w || MLV.spouseWords(sp, goneId);
    var yrs = MLV.years(m), hc = w.homeId != null ? G.CITY_DATA[w.homeId] : null;
    if (G.OldGuard && !d.sib) G.OldGuard.left(sp, how === 'fire' || how === 'quit' ? how : 'spouse');   // 사건 동료는 스무 해 뒤 철새로 (js/systems/oldguard.js)
    s.mates = s.mates.filter(function (x) { return x.id !== sp; });
    if (R().tidyCaptains) R().tidyCaptains();
    if (G.Cabins && G.Cabins.tidy) G.Cabins.tidy();
    if (!d.sib) {
      s.flags['gone_' + sp] = 1;
      (s.mateFate || (s.mateFate = {}))[sp] = { kind: 'other', why: 'spouse', with: goneId, y: s.date.y, home: hc ? hc.id : null, at: c ? c.id : null, sea: !c, yrs: yrs };
      if (G.MateKnow) G.MateKnow.know(sp, hc ? hc.id : null, 'fate');
    }
    if (G.Wives && G.Wives.sync) G.Wives.sync();
    G.State.log(fill(D().spouse.log, sp, Object.assign({ yrs: yrs }, w)));
    if (!quiet) G.UI.toast(fill(D().spouse.toast, sp, w), 'heart', 5500);
    return true;
  };
  /** 짝이 떠날 때 함께 내린다 — 한두 마디 하고 함대에서 빠진다. how: 'other'(o.why: 떠나는 까닭) · 'health' · 'fire' · 'quit'
      o.spouse: 미리 찾아 둔 짝(떠나는 사람을 빼기 전에 MLV.spouseOf로) · o.words: 미리 만든 낱말 → 함께 내린 짝의 id (없으면 null) */
  MLV.follow = async function (goneId, how, o) {
    o = o || {};
    var sp = o.spouse || MLV.spouseOf(goneId); if (!sp || !row(sp)) return null;
    var P = D().spouse, w = o.words || MLV.spouseWords(sp, goneId);
    await lines((how === 'other' && o.why && P.why[o.why]) || P[how] || P.other, sp, w);
    MLV.goWith(sp, goneId, how, w);
    if (G.Game.refreshHud) G.Game.refreshHud();
    return sp;
  };

  // ---------------------------------------------------------------- 위기를 넘기는 길
  /** 배의 의원: 의학이 가장 높은 다른 부하 {id, lv} (없으면 null) */
  MLV.doctor = function (exceptId) {
    var best = null;
    S().mates.forEach(function (m) {
      if (m.id === exceptId) return;
      var lv = R().mateSkill ? R().mateSkill(m, 'med') : 0;
      if (lv > 0 && (!best || lv > best.lv)) best = { id: m.id, lv: lv };
    });
    return best;
  };
  function herbs() { var c = S().fleet.cargo || {}; return c.herbs && c.herbs.q >= 1 ? c.herbs : null; }
  function sickRoom() { try { return G.Cabins && G.Cabins.power && G.Cabins.power('sick') > 0; } catch (e) { return false; } }
  /** 고를 수 있는 길: [{label, value, p, cost}] */
  MLV.cures = function (id) {
    var k = K(), C = D().cure, out = [], s = S(), c = here();
    var med = R().skill ? R().skill('med') : 0, own = (s.player.sk && s.player.sk.med) || 0, doc = MLV.doctor(id), room = sickRoom() ? k.sickRoom : 0;
    if (herbs()) out.push({ label: C.herbs, value: 'herbs', p: Math.min(0.95, k.herbs + med * k.herbsMed + room) });
    if (doc) out.push({ label: fill(C.doctor, id, { doc: G.MATE[doc.id].name }), value: 'doctor', doc: doc.id, p: Math.min(0.95, k.doctor[Math.min(3, doc.lv) - 1] + room) });
    else if (own > 0) out.push({ label: fill(C.self, id, { lv: own }), value: 'self', p: Math.min(0.95, k.doctor[Math.min(3, own) - 1] + room) });
    if (c) { var cost = k.cityDoctorCost[0] + (c.size || 1) * k.cityDoctorCost[1]; out.push({ label: fill(C.city, id, { cost: U.num(cost) }), value: 'city', cost: cost, p: k.cityDoctor, dis: s.player.gold < cost }); }
    out.push({ label: C.none, value: 'none', p: 0 });
    return out;
  };
  /** 위기 — 넘겼으면 true */
  async function crisis(id, ask, note) {
    var UI = G.UI, s = S(), C = D().cure, opts = MLV.cures(id);
    var v = await UI.ask(fill(ask, id) + (note || ''), opts.map(function (o) { return { label: o.label, value: o.value, dis: o.dis }; }), mateSp(id));
    var o = opts.filter(function (x) { return x.value === v; })[0] || opts[opts.length - 1];
    if (o.value === 'herbs') { var h = herbs(); if (h) { h.q -= 1; if (h.q <= 0) delete s.fleet.cargo.herbs; } await lines([C.herbsSay], id); }
    else if (o.value === 'doctor') await lines([C.doctorSay], id, null, o.doc);
    else if (o.value === 'city') { if (s.player.gold < o.cost) o = { value: 'none', p: 0 }; else { s.player.gold -= o.cost; await lines([C.citySay], id); } }
    var ok = o.p > 0 && U.chance(o.p);
    if (!ok && o.value !== 'none') await lines([C.fail], id);
    return ok ? o : null;
  }
  function saved(id, how) {
    var s = S(), m = row(id), k = K(), o = st(), d = G.MATE[id];
    if (m) { m.leaveCd = s.day + k.calm; m.loyal = Math.min(100, (m.loyal || 70) + 8); }
    o.n = Math.max(0, o.n - 1);   // 넘긴 위기는 한 해 셈에 들지 않는다
    var w = how.value === 'herbs' ? '약재' : how.value === 'doctor' ? G.MATE[how.doc].name + '의 손' : how.value === 'self' ? '제독의 손' : '항구 의원의 손';
    G.State.log(d.name + U.jx(d.name, '이/가') + ' ' + w + '으로 위기를 넘겼다.');
    G.UI.toast(d.name + ' — 위기를 넘겼다 (' + w + ') · 충성 +8', 'heart', 5000);
  }
  /** 함대에서 뺀다 · 남은 이야기 */
  function leave(id, kind, why, extra) {
    var s = S(), d = G.MATE[id], m = row(id), hc = homeOf(id), c = here();
    var yrs = m ? MLV.years(m) : 0;
    if (G.OldGuard) G.OldGuard.left(id, kind);   // 사건 동료는 스무 해 뒤 철새로 (js/systems/oldguard.js)
    s.mates = s.mates.filter(function (x) { return x.id !== id; });
    if (R().tidyCaptains) R().tidyCaptains();
    s.flags['gone_' + id] = 1;
    if (G.Wives && G.Wives.sync) G.Wives.sync();
    (s.mateFate || (s.mateFate = {}))[id] = { kind: kind, why: why || null, y: s.date.y, home: hc ? hc.id : null, at: c ? c.id : null, sea: !c, yrs: yrs };
    if (G.MateKnow) G.MateKnow.know(id, hc ? hc.id : null, 'fate');
    var L = D()[kind], whyT = why ? (D().other.reasons.filter(function (r) { return r.id === why; })[0] || {}).t : '';
    G.State.log(fill(L.log, id, Object.assign({ why: whyT, yrs: yrs }, extra || {})));
  }

  // ---------------------------------------------------------------- 사건
  MLV.play = async function (e) {
    var UI = G.UI, s = S(), d = G.MATE[e.id], m = row(e.id), k = K();
    if (!d || !m) return;
    var yrs = MLV.years(m);
    if (e.kind === 'death') {
      var L = D().death, c = here();
      await lines(c ? L.port : L.sea, e.id);
      var ok = await crisis(e.id, L.ask);
      if (ok) { await lines(L.saved, e.id); saved(e.id, ok); return; }
      await lines(L.last, e.id, { yrs: yrs });
      await UI.alert('<div class="center" style="font-size:15px;letter-spacing:.2em;color:#8a6a3a">— ' + U.esc(L.title) + ' —</div><div style="line-height:1.75;margin-top:8px">' + U.esc(fill(c ? L.burialPort : L.burialSea, e.id)) + '</div>', d.name);
      leave(e.id, 'death');
      S().mates.forEach(function (x) { x.loyal = Math.min(100, (x.loyal || 70) + 2); });   // 남은 부하들이 마음을 다잡는다
      UI.toast(d.name + U.jx(d.name, '이/가') + ' 세상을 떠났다. 함께한 ' + yrs + '년.', 'skull', 6000);
    } else if (e.kind === 'health') {
      var H = D().health, spH = MLV.spouseOf(e.id);   // 짝은 떠나는 사람을 빼기 전에 찾아 둔다 — 함께 내린다 (2026-11-01)
      await lines(H.lines[e.line || 0] || H.lines[0], e.id);
      var ok2 = await crisis(e.id, H.ask, MLV.spouseNote(e.id, spH));
      if (ok2) { await lines(H.saved, e.id); saved(e.id, ok2); return; }
      await lines(H.bye, e.id);
      await severance(e.id, H.title, spH);
      leave(e.id, 'health');
      if (spH) await MLV.follow(e.id, 'health', { spouse: spH });
      UI.toast(d.name + U.jx(d.name, '이/가') + ' 배에서 내렸다. 함께한 ' + yrs + '년.', 'boot', 6000);
    } else {
      var O = D().other, r = O.reasons.filter(function (x) { return x.id === e.why; })[0] || O.reasons[0], spO = MLV.spouseOf(e.id);
      await lines(r.lines, e.id);
      var gift = R().mateWage(e.id) * k.severance, canHold = (m.loyal || 0) >= k.holdLoyal;
      var opts = [{ label: fill(O.gift, e.id, { gift: U.num(gift) }), value: 'gift', dis: s.player.gold < gift }];
      if (canHold) opts.push({ label: O.hold, value: 'hold' });
      opts.push({ label: O.go, value: 'go' });
      var v = await UI.ask(fill(O.ask, e.id, { why: r.t }) + MLV.spouseNote(e.id, spO), opts, mateSp(e.id));
      if (v === 'hold') {
        if (U.chance(k.holdChance)) { await lines(O.held, e.id); m.leaveCd = s.day + k.calm; st().n = Math.max(0, st().n - 1); G.State.log(d.name + U.jx(d.name, '을/를') + ' 붙잡았다.'); return; }
        await lines(O.notHeld, e.id); v = 'go';
      }
      if (v === 'gift' && s.player.gold >= gift) { s.player.gold -= gift; await lines(O.giftSay, e.id); } else await lines(O.goSay, e.id);
      leave(e.id, 'other', r.id);
      if (spO) await MLV.follow(e.id, 'other', { spouse: spO, why: r.id });
      UI.toast(d.name + ' — ' + r.t + ' 배를 떠났다. 함께한 ' + yrs + '년.', 'boot', 6000);
    }
    if (G.Game.refreshHud) G.Game.refreshHud();
  };
  /** 건강으로 내리는 부하: 퇴직금을 챙겨 줄지 */
  async function severance(id, title, sp) {
    var s = S(), O = D().other, gift = R().mateWage(id) * K().severance;
    var v = await G.UI.ask(fill('{name}에게 무엇을 해 줄까?', id) + MLV.spouseNote(id, sp), [{ label: fill(O.gift, id, { gift: U.num(gift) }), value: 'gift', dis: s.player.gold < gift }, { label: O.go, value: 'go' }], mateSp(id));
    if (v === 'gift' && s.player.gold >= gift) { s.player.gold -= gift; await lines(O.giftSay, id); } else await lines(O.goSay, id);
    void title;
  }

  // ---------------------------------------------------------------- 화면 틈에 (main.js loop)
  function ready() {
    var s = S(), g = G.Game, UI = G.UI;
    if (!s || !s.player || UI.busy() || MLV.running === s) return false;
    if (['city', 'sea', 'land'].indexOf(g.sceneName) < 0 || tut()) return false;
    if (G.Life && G.Life.running === s) return false;
    var rt = g.scene && g.scene.runtime ? g.scene.runtime() : null;
    if (rt && rt.busy) return false;
    if (g.sceneName === 'city' && G.Scenes.city.busy && G.Scenes.city.busy()) return false;
    return true;
  }
  MLV.tick = function () {
    var s = S();
    if (s && s.mates && s.date && (!s.mateLeave || s.mateLeave.td !== s.day)) { try { MLV.track(); } catch (e) { console.error(e); } }   // 날이 바뀌면 선실에 머문 날을 센다
    if (!s || !s.mateLeave || !s.mateLeave.pend || !s.mateLeave.pend.length) return;
    if (!ready()) return;
    MLV.running = s;
    var e = s.mateLeave.pend.shift();
    (async function () {
      try { if (row(e.id)) await MLV.play(e); else { st().n = Math.max(0, st().n - 1); life().n = Math.max(0, life().n - 1); } } catch (err) { console.error(err); }   // 그새 배를 떠난 부하는 셈에서 뺀다
      if (MLV.running === s) MLV.running = null;
    })();
  };
})(window.G = window.G || {});
