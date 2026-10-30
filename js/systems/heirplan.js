/* 후계를 위한 안배 (G.HeirPlan) — 대사·조정값: js/data/heirplan.js (G.HEIR_PLAN · G.BALANCE.heirPlan). 2026-10-29 사용자 요청
   ■ 소꿉친구가 찾아오다: 어른이 된 아들(G.Family.heirs — 16~30세)이 있는 집에 들르면 friendVisit의 확률로 그 아들의 소꿉친구가 찾아온다(아들마다 한 사람).
     「지금 배에 태운다」 → 곧바로 함대에 합류 · 「뒤를 잇는 날 곁에 있어 다오」 → 약속(후계를 맡길 두 자리 가운데 하나) · 「아직은 이르다」 → friendLater일 뒤 다시.
     소꿉친구는 G.OldGuard.makeKin('friend') 로 짓는다(여성은 Codex의 소꿉친구 초상 32종). 합류 전에는 술집에 나타나지 않는다(gone_).
   ■ 후계를 위한 인선: 자택 메뉴 「후계를 위한 안배」(어른이 된 아들이 있을 때) — 제독이 autoAge(55)를 넘으면 집에 들렀을 때 한 번 먼저 권한다.
     20년(oldYears) 넘게 함께한 옛 부하 가운데 둘(G.BALANCE.oldGuard.keep — 약속한 소꿉친구가 있으면 하나)까지 「아들 곁에 남아 달라」고 부탁한다.
     충성에 따라 받아들이거나(accept) 거절한다(declineCd일 뒤 다시 부탁). 약속한 부하는 그날까지 배를 떠나지 않는다(js/systems/mateleave.js MLV.weight)
     — 수첩 「동료」에 「안배」 꼬리표. 다시 열어 고르지 않으면 약속을 거둔다.
   ■ 세대 교체(G.OldGuard.atSucceed → HP.forSucceed): 약속한 부하는 처음부터 골라 둔 채로 「남을 사람」 창에 나오고(노장이 아니어도 후견 후보),
     약속한 소꿉친구는 부두에 나와 기다린다(무작위 친족 대신). 끝나면 약속은 새 제독 몫으로 비운다(HP.afterSucceed).
   ■ 장면 그림(있으면): family-events/childfriend_visit · childfriend_join · heir_council · oldguard_farewell — 주문서 images/family-events/HEIRPLAN_PROMPT.md
   ■ 저장: s.oldGuard.plan = {ids: [약속한 부하 id], asked: 권한 해, heir, no: {id: 다시 부탁할 수 있는 날}} · 아들 k.cfriend = {id, st: met|aboard|promised|later|joined, y, at} */
(function (G) {
  'use strict';
  var U = G.U;
  var HP = G.HeirPlan = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return G.BALANCE.heirPlan; }
  function D() { return G.HEIR_PLAN; }
  function OG() { return G.OldGuard; }
  function F() { return G.Family; }
  function R() { return G.R; }
  function fill(t, o) { return OG().fill(t, o); }
  HP.plan = function () { var o = OG().st(); var p = o.plan || (o.plan = { ids: [], asked: 0, no: {} }); if (!p.no) p.no = {}; if (!p.ids) p.ids = []; return p; };
  function row(id) { return (S().mates || []).filter(function (m) { return m.id === id; })[0] || null; }
  function yrs(m) { return G.MateLeave ? G.MateLeave.years(m) : 0; }
  function isWife(id) { var p = S().player; return p.wife === id || !!(G.Wives && G.Wives.of && G.Wives.of(id)); }
  function keep() { return (G.BALANCE.oldGuard && G.BALANCE.oldGuard.keep) || 2; }

  // ---------------------------------------------------------------- 누구
  /** 뒤를 이을 아들 (맏이부터) */
  HP.heir = function () { var h = F() && F().heirs ? F().heirs() : []; return h[0] || null; };
  /** 약속한 부하인가 (배에 있을 때) */
  HP.pledged = function (m) { var s = S(), p = s && s.oldGuard && s.oldGuard.plan; return !!(m && p && p.ids && p.ids.indexOf(m.id) >= 0); };
  HP.pledgedRows = function () { var p = HP.plan(); p.ids = p.ids.filter(function (id) { return !!row(id); }); return p.ids.map(row); };
  /** 약속한 소꿉친구 (뒤를 이을 아들의) */
  HP.promisedFriend = function (k) {
    k = k || HP.heir(); var cf = k && k.cfriend, o = S().oldGuard;
    return cf && cf.st === 'promised' && o && o.defs && o.defs[cf.id] ? o.defs[cf.id] : null;
  };
  /** 부탁할 수 있는 옛 부하 — 20년 넘게 함께한 사람 (아내·동생·친족 제외) */
  HP.candidates = function () {
    return (S().mates || []).filter(function (m) { var d = G.MATE[m.id]; return d && !d.sib && !d.kin && !isWife(m.id) && yrs(m) >= K().oldYears; });
  };
  HP.canArrange = function () { var s = S(); return !!(s && s.player && HP.heir() && (HP.candidates().length || HP.plan().ids.length)); };
  HP.menuSub = function () { var p = HP.plan(), n = HP.pledgedRows().length + (HP.promisedFriend() ? 1 : 0); return HP.heir().name + ' · 약속 ' + n + '/' + keep(); };

  // ---------------------------------------------------------------- 말
  function mateSp(id) { var d = G.MATE[id]; return { name: d.name, portrait: G.Scenes.mateSpec(id), half: G.Img.chain.mateHalf(id), lang: 3 }; }
  function heirSp(k) { return { name: k.name, portrait: F().kidSpec ? F().kidSpec(k) : null, lang: 3 }; }
  function meSp() { var p = S().player; return { name: p.name, portrait: p.portrait, half: G.Img.chain.heroHalf ? G.Img.chain.heroHalf() : null, lang: 3 }; }
  async function lines(list, id, o, k) {
    list = [].concat(list || []);
    for (var i = 0; i < list.length; i++) {
      var l = list[i], who = l.slice(0, 2), t = fill(l.slice(2), o);
      if (who === 'm:') await G.UI.say(t, mateSp(id));
      else if (who === 'h:') await G.UI.say(t, heirSp(k));
      else if (who === 'p:') await G.UI.say(t, meSp());
      else await G.UI.say(t, {});
    }
  }
  HP.lines = lines;
  var pic = null;
  /** 장면 그림 (images/family-events/… — 없으면 건너뛴다) · key는 tools/audit_event_images.py 가 찾게 온전한 이름으로 */
  HP.pic = async function (key, title, cast) {
    await HP.stopPic();
    try {
      pic = cast && OG().showShot ? await OG().showShot(cast.kind, S().player, cast.k, cast.people, false) :
        G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: key, title: title, noStand: false }) : null;
    } catch (e) { pic = null; }
    return pic;
  };
  HP.stopPic = function () { var p = pic; pic = null; return p && p.stop ? p.stop() : Promise.resolve(); };
  function base(k) { var s = S(), p = s.player, hc = G.CITY_DATA[p.home]; return { old: p.name, heir: k ? k.name : '', home: hc ? hc.name : '' }; }

  // ---------------------------------------------------------------- 소꿉친구
  HP.friendDue = function (k) {
    var s = S(), c = K(), a = F().kidAge(k), cf = k.cfriend;
    if (a < c.friendAge[0] || a > c.friendAge[1]) return false;
    if (!cf) return true;
    return cf.st === 'later' && s.day >= (cf.at || 0);
  };
  /** 소꿉친구가 찾아온다 — 아들 k (없으면 맏이) */
  HP.friendVisit = async function (k, c) {
    var s = S(), UI = G.UI, V = D().visit, o = OG().st();
    k = k || HP.heir(); if (!k) return false;
    var d = k.cfriend && o.defs[k.cfriend.id];
    if (!d) {
      d = OG().makeKin('friend', s.player, k); if (!d) return false;
      o.defs[d.id] = d; if (!G.MATE[d.id]) { G.MATES.push(d); G.MATE[d.id] = d; } G.MATE_RANGE[d.id] = { zones: [], home: d.home };
      k.cfriend = { id: d.id, st: 'met', y: s.date.y };
    }
    s.flags['gone_' + d.id] = 1;   // 합류하기 전에는 술집에 나오지 않는다
    var x = Object.assign(base(k), { name: d.name });
    await HP.pic('family-events/childfriend_visit', V.title, { kind: 'visit', k: k, people: [d] });
    try {
      await lines(V.open, d.id, x, k);
      await lines(V.talk, d.id, x, k);
      var full = HP.pledgedRows().length >= keep();
      var v = await UI.ask(fill(V.ask, x), [
        { label: fill(V.join, x), value: 'join' },
        { label: fill(V.promise, x) + (full ? ' ' + V.promiseFull : ''), value: 'promise', dis: full },
        { label: V.later, value: 'later' }
      ], mateSp(d.id));
      if (v === 'join') {
        await HP.stopPic(); await HP.pic('family-events/childfriend_join', '소꿉친구의 합류', { kind: 'join', k: k, people: [d] });
        var r = G.Legend && G.Legend.join ? G.Legend.join(d.id, c || G.CITY_DATA[s.player.home]) : null;
        if (r) { delete r.ev; r.loyal = (G.BALANCE.oldGuard && G.BALANCE.oldGuard.kinLoyal) || 90; r.kin = 'friend'; }
        k.cfriend.st = 'aboard';
        await lines(V.joinSay, d.id, x, k);
        var fc = d.friendClass && G.OLD_GUARD && G.OLD_GUARD.friendClasses && G.OLD_GUARD.friendClasses[d.friendClass];
        if (fc && fc.lines) await lines(fc.lines, d.id, x, k);
      } else if (v === 'promise' && !full) {
        k.cfriend.st = 'promised';
        await lines(V.promiseSay, d.id, x, k);
      } else {
        v = 'later'; k.cfriend.st = 'later'; k.cfriend.at = s.day + K().friendLater;
        await lines(V.laterSay, d.id, x, k);
      }
      G.State.log(fill(V.log[v], x));
    } finally { await HP.stopPic(); }
    if (G.Game.refreshHud) G.Game.refreshHud();
    return true;
  };

  // ---------------------------------------------------------------- 후계를 위한 인선
  function acceptP(m) { var a = K().accept, l = m.loyal || 0; for (var i = 0; i < a.length; i++) if (l >= a[i][0]) return a[i][1]; return 0; }
  HP.acceptP = acceptP;
  /** 옛 부하들을 불러 후계를 부탁한다 (자택 메뉴 · 처음 한 번은 집에 들렀을 때 권한다) */
  HP.arrange = async function (c, auto) {
    var s = S(), UI = G.UI, C = D().council, k = HP.heir(), P = HP.plan();
    if (!k) return false;
    var x = base(k);
    if (auto) {
      P.asked = s.date.y;
      if (!(await UI.confirm(fill(C.offer, x), C.offerYes, C.offerNo))) return false;
    }
    P.asked = s.date.y; P.heir = k.name;
    var fr = HP.promisedFriend(k), max = keep() - (fr ? 1 : 0), now = HP.pledgedRows();
    await HP.pic('family-events/heir_council', C.title, { kind: 'council', k: k, people: [] });
    try {
      await lines(C.open, null, x, k);
      var cands = HP.candidates();
      now.forEach(function (m) { if (cands.indexOf(m) < 0) cands.push(m); });
      cands = cands.map(function (m) {
        var pl = P.ids.indexOf(m.id) >= 0, no = !pl && P.no[m.id] && s.day < P.no[m.id];
        var tg = (OG().isVeteran(m) ? ' <span class="tag">' + C.tagVet + '</span>' : '') + (pl ? ' <span class="tag">' + C.tagPledge + '</span>' : '') + (no ? ' <span class="tag">' + C.tagNo + '</span>' : '');
        return { m: m, pre: pl, dis: !!no, tags: tg };
      }).sort(function (a, b) { return (b.pre - a.pre) || (yrs(b.m) - yrs(a.m)); });
      var head = fill(C.pickHead, Object.assign({}, x, { max: max, friendNote: fr ? fill(C.friendNote, { fname: fr.name }) : '' }));
      var chosen = max > 0 ? await OG().pick(cands, x, { title: C.pickTitle, head: head, max: max, btn: C.pickBtn, noneOk: true }) : [];
      var pick = chosen.map(function (q) { return q.m.id; });
      // 거두는 약속
      P.ids.slice().forEach(function (id) { if (pick.indexOf(id) < 0) { P.ids.splice(P.ids.indexOf(id), 1); if (G.MATE[id]) G.State.log(fill(C.release, { name: G.MATE[id].name })); } });
      // 새로 하는 부탁
      var got = 0, fresh = chosen.filter(function (q) { return P.ids.indexOf(q.m.id) < 0; });
      for (var i = 0; i < fresh.length; i++) {
        var m = fresh[i].m, d = G.MATE[m.id], y = Object.assign({}, x, { name: d.name, yrs: yrs(m) });
        await HP.pic('family-events/heir_council', C.title, { kind: 'council', k: k, people: [m] });
        await lines(C.ask, m.id, y, k);
        if (U.chance(acceptP(m))) {
          await lines(U.pick(C.yes), m.id, y, k);
          P.ids.push(m.id); delete P.no[m.id]; m.loyal = Math.min(100, (m.loyal || 70) + 5); got++;
          G.State.log(fill(C.log, y));
        } else {
          await lines(U.pick(C.no), m.id, y, k);
          P.no[m.id] = s.day + K().declineCd;
          G.State.log(fill(C.logNo, y));
        }
      }
      if (got || chosen.length) await lines([C.heirSay], null, x, k);
      else await lines([C.none], null, x, k);
    } finally { await HP.stopPic(); }
    if (G.Game.refreshHud) G.Game.refreshHud();
    return true;
  };

  // ---------------------------------------------------------------- 집에 들렀을 때 (js/city/misc.js HM.enter)
  HP.homeEvents = async function (c) {
    var s = S(); if (!s || !s.player || (G.Tutorial && G.Tutorial.active && G.Tutorial.active()) || s.regency) return;
    var k = HP.heir();
    if (k && HP.friendDue(k) && U.chance(K().friendVisit)) await HP.friendVisit(k, c);
    var P = HP.plan();
    if (k && !P.asked && R().age && R().age() >= K().autoAge && HP.candidates().length) await HP.arrange(c, true);
  };

  // ---------------------------------------------------------------- 세대 교체 (G.OldGuard.atSucceed)
  HP.forSucceed = function (p, k) {
    var fr = HP.promisedFriend(k);
    if (fr && row(fr.id)) fr = null;   // 그새 배에 탄 사람
    return { friend: fr, pledged: HP.pledgedRows() };
  };
  /** 약속한 소꿉친구가 부두에서 기다린다 */
  HP.friendArrives = async function (d, o, k) { await lines(D().visit.atSucceed, d.id, Object.assign({}, o, { name: d.name }), k); };
  HP.afterSucceed = function () {
    var s = S(), o = s && s.oldGuard; if (!o) return;
    (s.player.kids || []).forEach(function (k) { if (k.cfriend && k.cfriend.st === 'promised') k.cfriend.st = row(k.cfriend.id) ? 'joined' : 'missed'; });
    o.plan = { ids: [], asked: 0, no: {} };
  };
})(window.G = window.G || {});
