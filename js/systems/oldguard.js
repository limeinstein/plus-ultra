/* 노장(老將) — 세대 교체의 두 사람 · 스무 해 뒤의 철새 (G.OldGuard) — 대사·조정값: js/data/oldguard.js (G.OLD_GUARD · G.BALANCE.oldGuard). 2026-10-29 사용자 요청
   ■ 노장: 40년(years) 넘게 함께 항해했지만 기함의 선실에도 들지 못하고 다른 배의 선장도 아닌 부하 (OG.isVeteran — 아내·동생은 아니다).
     달마다의 이별(사망·고향으로)도 이 부하들만 겪는다 (js/systems/mateleave.js MLV.weight).
   ■ 세대 교체(G.Family.succeed → OG.atSucceed): 노장들은 물러나는 제독과 함께 배에서 내린다. 그 가운데 둘(keep)까지 새 제독 곁에 남길 수 있다 —
     남은 노장은 충성 100, aideCalm일 동안 배를 떠나지 않는다(m.aide = {gen, y}).
     kinChance의 확률로 새 제독의 친족(사촌·외삼촌)이나 소꿉친구가 함께 하겠다고 찾아온다 — 고르면 두 자리 가운데 하나를 쓴다.
     친족·소꿉친구는 새로 짓는 항해사다: 정의는 s.oldGuard.defs 에 두고 불러올 때 G.MATES 에 다시 올린다(OG.apply — 철새와 같은 때).
   ■ 사건 동료(옛이야기·전설·사건으로 얻은 부하 — MLV.eventMate)는 죽지 않는다. 이별(고향으로)·해고·떠남·세대 교체로 배에서 내리면(OG.left)
     returnYears(20)년 뒤 해가 바뀔 때(G.Wander.newYear → OG.newYear) 다른 이름의 철새로 고장의 술집에 나타난다 — 능력(능력치·특기·말)과 얼굴은 내릴 때 그대로.
   ■ 저장: s.oldGuard = {seq, defs: {kin_…: 정의}, ret: [{id, name, y, due, home, st, sk, lg, g, face, halfKey, style, wage, fame, admiral, done, wd}]}
           s.mates[i].aide = {gen, y} */
(function (G) {
  'use strict';
  var U = G.U;
  var OG = G.OldGuard = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return G.BALANCE.oldGuard; }
  function D() { return G.OLD_GUARD; }
  function R() { return G.R; }
  function MLV() { return G.MateLeave; }
  function st() { var s = S(); return s.oldGuard || (s.oldGuard = { seq: 0, defs: {}, ret: [] }); }
  OG.st = st;
  function fill(t, o) {
    return String(t).replace(/\{(\w+)(?::([^}]+))?\}/g, function (all, key, pair) {
      if (o[key] == null) return all;
      var w = String(o[key]); return pair ? U.j(w, pair) : w;
    });
  }
  OG.fill = fill;
  function years(m) { return MLV() ? MLV().years(m) : 0; }
  function isWife(id) { var p = S().player; return p.wife === id || !!(G.Wives && G.Wives.of && G.Wives.of(id)); }
  function city(id) { return id != null ? G.CITY_DATA[id] : null; }

  // ---------------------------------------------------------------- 누구
  /** 기함의 선실(부관실·조타실·파수대 포함)에 들었거나 다른 배의 선장인가 */
  OG.posted = function (m) { return !!m && (m.role === 'captain' || !!(MLV() && MLV().inCabin(m))); };
  /** 노장: 40년 넘게 함께 항해했지만 선실에도 선장 자리에도 들지 못한 부하 */
  OG.isVeteran = function (m) {
    var d = m && G.MATE[m.id]; if (!d || d.sib || isWife(m.id)) return false;
    return years(m) >= K().years && !OG.posted(m);
  };
  OG.veterans = function () { return (S().mates || []).filter(OG.isVeteran); };
  /** 수첩 「동료」의 꼬리표 — 친족·소꿉친구 · 후견(세대 교체 때 남은 노장) · 노장(떠날 수 있다) */
  OG.tags = function (m, d) {
    var s = S(), out = '';
    if (d && d.kinTag) out += '<span class="tag">' + U.esc(d.kinTag) + '</span>';
    if (G.HeirPlan && G.HeirPlan.pledged(m)) out += '<span class="tag" title="후계를 위한 안배 — 세대 교체 때 새 제독 곁에 남기로 약속했다. 그날까지 배를 떠나지 않는다">안배</span>';
    if (m.aide && s.day < (m.leaveCd || 0)) out += '<span class="tag" title="세대 교체 때 새 제독 곁에 남은 노장 — 한동안 배를 떠나지 않는다">후견</span>';
    else if (OG.isVeteran(m)) out += '<span class="tag" title="40년 넘게 함께했지만 기함의 선실·다른 배의 선장 자리에 없다 — 언젠가 배를 떠날 수 있고, 세대 교체 때는 선대와 함께 내린다">노장 · ' + years(m) + '년</span>';
    return out;
  };
  OG.isEvent = function (m) { return !!(MLV() && MLV().eventMate && MLV().eventMate(m)); };

  // ---------------------------------------------------------------- 배에서 내린 사건 동료 → 스무 해 뒤의 철새
  function snapSk(m, d) {
    var sk = {};
    (G.SKILLS || []).forEach(function (x) {
      var lv = G.Cabins && G.Cabins.rawSkill ? G.Cabins.rawSkill(m, x.id) : ((m.sk && m.sk[x.id]) || (d.sk && d.sk[x.id]) || 0);
      if (lv > 0) sk[x.id] = Math.min(3, lv);
    });
    if (!Object.keys(sk).length) Object.keys(d.sk || {}).forEach(function (k) { if (d.sk[k] > 0) sk[k] = d.sk[k]; });
    return sk;
  }
  /** 부하가 배에서 내릴 때 (이별·해고·떠남·세대 교체) — 사건 동료면 스무 해 뒤에 돌아올 자리를 적어 둔다 */
  OG.left = function (id, how) {
    var s = S(), m = (s.mates || []).filter(function (x) { return x.id === id; })[0], d = G.MATE[id];
    if (!m || !d || d.wd || d.sib || d.kin || isWife(id) || !OG.isEvent(m)) return null;
    var o = st();
    if (o.ret.some(function (r) { return r.id === id && !r.done; })) return null;
    var rg = G.MATE_RANGE && G.MATE_RANGE[id], zs = rg && rg.zones && rg.zones.length ? rg.zones : null;
    var zc = zs ? ((G.MATE_ZONES[zs[0]] || {}).ids || [])[0] : null;
    var hc = rg && rg.home != null ? rg.home : zc != null ? zc : (m.from != null ? m.from : s.player.home);   // 고향(그 사람의 고장) — 없으면 배에 오른 항구
    var face = d.face || 'portraits/mates/' + id;
    var r = { id: id, name: d.name, how: how || '', y: s.date.y, due: s.date.y + K().returnYears, home: hc, g: d.g === 'f' ? 'f' : 'm',
      st: (d.st || [55, 55, 55, 55]).slice(), sk: snapSk(m, d), lg: U.clone(d.lg || {}), face: face, halfKey: d.halfKey || face + '_half', style: d.style || null,
      wage: d.wage || 0, fame: d.fame || 0, admiral: s.player.name, zones: (G.MATE_RANGE && G.MATE_RANGE[id] && G.MATE_RANGE[id].zones) || null };
    o.ret.push(r);
    return r;
  };
  function natFor(r) {
    var N = G.WANDER_NATIONS || {}, ks = Object.keys(N), lg = r.lg || {};
    var zs = r.zones || [];
    var c = ks.filter(function (k) { return (N[k].zones || []).some(function (z) { return zs.indexOf(z) >= 0; }) && lg[N[k].lang] > 0; });   // 그 사람의 고장에서 온 철새로
    if (!c.length) c = ks.filter(function (k) { return N[k].style === r.style && lg[N[k].lang] > 0; });
    if (!c.length) c = ks.filter(function (k) { return lg[N[k].lang] >= 3; });
    if (!c.length) c = ks.filter(function (k) { return lg[N[k].lang] > 0; });
    if (!c.length) c = ks.filter(function (k) { return N[k].style === r.style; });
    if (!c.length) c = ks;
    return c[Math.abs(U.strHash('ret-nat:' + r.id + ':' + r.y)) % c.length];
  }
  function typeFor(sk) {
    var T = G.WANDER_TYPES || {}, best = null, bl = 0;
    Object.keys(sk).forEach(function (k) { if (sk[k] > bl) { bl = sk[k]; best = k; } });
    var hit = Object.keys(T).filter(function (t) { return T[t].sk[0][0] === best; })[0];
    return hit || 'nav';
  }
  function liveCity(id, y) { var c = city(id); return c && !(c.founded && y < c.founded) && !(c.until && y >= c.until) ? c : null; }
  /** 철새 한 사람으로 — 다른 이름, 같은 능력 */
  OG.makeReturn = function (r) {
    var s = S(), WD = G.Wander, y = s.date.y, nk = natFor(r), N = G.WANDER_NATIONS[nk], tk = typeFor(r.sk), T = G.WANDER_TYPES[tk];
    var nm = WD.makeName(nk, r.g);
    var home = liveCity(r.home, y) ? r.home : null;
    var zones = (r.zones && r.zones.length ? r.zones : N.zones).slice();
    if (home == null) { var hs = ((G.MATE_ZONES[zones[0]] || {}).ids || []).filter(function (id) { return liveCity(id, y); }); home = hs.length ? hs[0] : s.player.home; }
    var hc = city(home), x = D().ret;
    var skSum = 0; for (var k in r.sk) skSum += r.sk[k];
    var stSum = r.st[0] + r.st[1] + r.st[2] + r.st[3];
    s.wander.seq = (s.wander.seq || 0) + 1;
    var id = 'wd_' + y + '_' + s.wander.seq;
    var o = { adj: N.adj, type: (r.g === 'f' ? '여' : '') + T.nm, born: hc ? hc.name : N.name, admiral: r.admiral, old: r.name };
    var def = {
      id: id, name: nm.name, g: r.g, wd: true, ret: r.id, retName: r.name, nat: nk, natName: N.name, type: tk, typeName: T.nm,
      st: r.st.slice(), sk: U.clone(r.sk), lg: U.clone(r.lg), skBoost: 1,
      fame: r.fame || Math.max(0, Math.round(((stSum - 205) * 9 + skSum * 90 - 250) / 50) * 50),
      wage: r.wage || Math.max(25, Math.round((28 + skSum * 12 + (stSum - 200) / 3) / 5) * 5),
      y: [y, 9999], reg: [], desc: fill(x.desc, o), story: fill(x.story, o), style: r.style || N.style, role: r.g === 'f' ? 'maid' : (T.role[0] || 'sailor'),
      face: r.face, halfKey: G.Img && G.Img.has && G.Img.has(r.halfKey) ? r.halfKey : null,
      zones: zones, home: home, gen: WD.genOf(y + 10), born: y, line: id, prevName: null, nameFrom: nm.from
    };
    return def;
  };
  /** 해가 바뀔 때 (G.Wander.newYear 끝에서) — 날이 찬 사건 동료가 철새로 나타난다 */
  OG.newYear = function () {
    var s = S(), out = []; if (!s || !s.wander || !s.oldGuard) return out;
    var y = s.date.y;
    st().ret.forEach(function (r) {
      if (r.done || y < r.due) return;
      if (s.mates.some(function (m) { return m.id === r.id; })) { r.done = 'aboard'; return; }   // 그새 다시 배에 오른 사람
      var d; try { d = OG.makeReturn(r); } catch (e) { console.error(e); r.done = 'fail'; return; }
      s.wander.defs[d.id] = d;
      if (!G.MATE[d.id]) { G.MATES.push(d); G.MATE[d.id] = d; }
      G.MATE_RANGE[d.id] = { zones: d.zones, home: d.home };
      r.done = y; r.wd = d.id;
      var hc = city(d.home);
      out.push({ icon: 'people', text: fill(D().ret.news, { city: hc ? hc.name : '어느 항구', type: d.typeName, name: d.name, old: r.name }) });
    });
    return out;
  };

  // ---------------------------------------------------------------- 친족·소꿉친구 (새로 짓는 항해사)
  function register(d) {
    if (!G.MATE[d.id]) { G.MATES.push(d); G.MATE[d.id] = d; }
    G.MATE_RANGE[d.id] = { zones: [], home: d.home };
  }
  /** 새 게임·불러오기 (G.Wander.apply 끝에서) — 지난 게임의 친족 항해사를 치우고 이 게임의 것을 올린다 */
  OG.apply = function () {
    var s = S();
    for (var i = G.MATES.length - 1; i >= 0; i--) if (G.MATES[i].kin) { delete G.MATE[G.MATES[i].id]; delete G.MATE_RANGE[G.MATES[i].id]; G.MATES.splice(i, 1); }
    if (!s || !s.oldGuard) return;
    for (var id in s.oldGuard.defs) register(s.oldGuard.defs[id]);
  };
  function natKey(p) {
    var N = G.WANDER_NATIONS || {};
    if (N[p.nation]) return p.nation;
    var nl = R().nativeLang ? R().nativeLang(p.nation) : 0;
    return Object.keys(N).filter(function (k) { return N[k].lang === nl; })[0] || 'ES';
  }
  /** 찾아온 사람을 짓는다 — kind: cousin(사촌) · uncle(외삼촌) · friend(소꿉친구) */
  OG.makeKin = function (kind, p, k) {
    var s = S(), WD = G.Wander, nk = natKey(p), k0 = D().kin[kind];
    var types = kind === 'uncle' ? ['nav', 'war', 'trade', 'doctor'] : kind === 'friend' ? ['nav', 'war', 'gun', 'survey', 'cook'] : ['nav', 'trade', 'war', 'survey', 'scholar'];
    var g = kind === 'uncle' ? 'm' : (U.chance(kind === 'friend' ? 0.4 : 0.3) ? 'f' : 'm');
    var look = null, friendClass = null;
    if (kind === 'friend' && g === 'f') {
      var nations = G.WANDER_NATIONS || {}, style = (nations[nk] || {}).style;
      // 같은 항구에서 자란 이주민 집안도 만난다. 아직 알려지지 않았거나 생기지 않은 국적은 쓰지 않는다.
      var available = Object.keys(nations).filter(function (n) {
        var x = nations[n];
        return (!x.from || s.date.y >= x.from) && (!x.after || !G.Frontier || x.after.every(function (id) { return G.Frontier.known(id); }));
      });
      var allLooks = (G.OLD_GUARD_FRIEND_LOOKS || []).filter(function (x) {
        return x.adult && available.some(function (n) { return x.styles.indexOf(nations[n].style) >= 0; });
      });
      var local = (G.OLD_GUARD_FRIEND_LOOKS || []).filter(function (x) { return x.adult && x.styles.indexOf(style) >= 0; });
      var looks = local.length && U.chance(K().friendLocalChance) ? local : allLooks;
      if (looks.length) {
        look = U.pick(looks); friendClass = D().friendClasses && D().friendClasses[look.kind];
        if (look.styles.indexOf(style) < 0) nk = U.pick(available.filter(function (n) { return look.styles.indexOf(nations[n].style) >= 0; }));
        if (friendClass) types = friendClass.types;
      }
    }
    var d = WD.make({ nat: nk, g: g, type: U.pick(types) }); if (!d) return null;
    if (kind === 'cousin' && p.surname) { var gv = (d.nameFrom && d.nameFrom[0] ? d.nameFrom[0].split(' ')[0] : d.name.split(' ')[0]); d.name = G.Family && G.Family.fullName ? G.Family.fullName(gv, p.surname) : gv + ' ' + p.surname; }
    if (kind === 'uncle') d.st = d.st.map(function (v, i) { return Math.min(92, v + (i === 1 ? 8 : 4)); });
    var o = st(); o.seq = (o.seq || 0) + 1;
    var hc = city(p.home);
    d.id = 'kin_' + s.date.y + '_' + o.seq; delete d.wd; d.kin = kind; d.kinOf = k.name; d.kinTag = k0.tag; d.line = d.id;   // kinOf: 누구의 친족·소꿉친구인가 (첫사랑 — js/systems/firstlove.js)
    d.home = p.home; d.zones = []; d.gen = undefined;
    var fo = { heir: k.name, old: p.name, home: hc ? hc.name : '', name: d.name };
    d.desc = fill(k0.desc, fo); d.story = d.desc; d.prevName = null;
    if (look && friendClass) {
      d.face = look.face; d.halfKey = look.halfKey; d.role = friendClass.role;
      d.friendLook = look.id; d.friendClass = look.kind; d.friendOrigin = look.origin; d.friendAdult = true;
      d.kinTag = k0.tag + ' · ' + friendClass.tag; d.typeName = friendClass.tag;
      d.desc += ' ' + fill(friendClass.desc, fo); d.story = d.desc;
    }
    return d;
  };
  function kinKind() { var w = K().kinKinds; return U.weighted(Object.keys(w), function (x) { return w[x]; }); }

  // ---------------------------------------------------------------- 세대 교체
  function mateSp(id) { var d = G.MATE[id]; return { name: d.name, portrait: G.Scenes.mateSpec(id), half: G.Img.chain.mateHalf(id), lang: 3 }; }
  function heirSp(k) { return { name: k.name, portrait: G.Family && G.Family.kidSpec ? G.Family.kidSpec(k) : null, lang: 3 }; }
  /** 생김새와 고향은 저장된 인물을 따른다. 이주민 친구여도 함께 자란 모항의 배경을 쓴다. */
  async function showShot(kind, p, k, people, forced) {
    var d = D().shots, ES = G.EventShot, I = G.Img, fx = G.FX && G.FX.oldGuardShot;
    if (!d || !ES || !I || !fx) return null;
    var region = 'med', style = ((G.WANDER_NATIONS || {})[natKey(p)] || {}).style;
    var look = (G.OLD_GUARD_FRIEND_LOOKS || []).filter(function (x) { return x.styles.indexOf(style) >= 0; })[0];
    if (look) region = look.id.split('_')[1];
    var port = kind === 'join' || kind === 'farewell';
    var bg = port ? d.joinPrefix + region : kind === 'visit' ? d.visitBg : kind === 'council' ? d.councilBg : d.cabin;
    if (!I.has(bg)) return null;
    var pos = kind === 'join' ? fx.join : kind === 'visit' ? fx.visit : forced ? fx.mourning : kind === 'council' ? (people.length ? fx.aide : fx.arrange) : kind === 'farewell' ? fx.aide : fx[kind], cast = [];
    var heir = G.HomeLife && k.born ? G.HomeLife.chain(k, true) : I.chain.kid(k.sex, 1, 5, '', true);
    function add(half, x, lead) { cast.push({ half: half, x: x, lead: !!lead, h: pos.h, y: pos.y }); }
    add(heir, pos.heirX, kind !== 'join' && kind !== 'visit');
    if (kind === 'join' || kind === 'visit') {
      if (kind === 'visit') add(I.chain.heroHalf(), pos.oldX, false);
      add(I.chain.mateHalf(people[0].id), pos.friendX, true);
    }
    else {
      if (!forced) add(I.chain.heroHalf(), pos.oldX, false);
      (people || []).slice(0, (pos.mateX || []).length).forEach(function (m, i) { add(I.chain.mateHalf(m.id), pos.mateX[i], false); });
    }
    var title = kind === 'join' ? (people[0].kin === 'friend' ? d.friend : d.kin) : forced ? d.mourning : d[kind];
    var imageKey = kind === 'visit' ? d.visitBg : kind === 'council' ? d.councilBg : kind === 'join' ? d.joinKey : kind === 'farewell' ? d.farewellKey : d.cabin;
    return ES.show({ title: title, imageKey: imageKey, bg: [bg], cast: cast, light: forced && kind !== 'join' ? 'night' : kind === 'farewell' ? 'dusk' : 'gold', sparkle: false });
  }
  OG.showShot = showShot;
  async function withShot(kind, p, k, people, forced, run) {
    var pc = await showShot(kind, p, k, people, forced);
    try { return await run(); }
    finally { if (pc && pc.stop) await pc.stop(); }
  }
  async function lines(list, id, o, k) {
    for (var i = 0; i < list.length; i++) {
      var l = list[i], who = l.slice(0, 2), t = fill(l.slice(2), o);
      if (who === 'm:') await G.UI.say(t, mateSp(id));
      else if (who === 'h:') await G.UI.say(t, heirSp(k));
      else await G.UI.say(t, {});
    }
  }
  function bestSk(m) {
    var d = G.MATE[m.id], out = [];
    (G.SKILLS || []).forEach(function (x) { var lv = G.Cabins && G.Cabins.rawSkill ? G.Cabins.rawSkill(m, x.id) : ((d.sk || {})[x.id] || 0); if (lv > 0) out.push({ n: x.name, lv: lv }); });
    return out.sort(function (a, b) { return b.lv - a.lv; }).slice(0, 3).map(function (x) { return x.n + ' ' + x.lv; }).join(' · ');
  }
  /** 남을 사람 고르기 — cands: [{m?, def?, kin?, pre?(처음부터 고름), dis?(고를 수 없음), tags?(덧붙일 꼬리표 html)}] → 고른 것
      opt: {title, head, max, btn} — 후계를 위한 인선(js/systems/heirplan.js)도 같은 창을 쓴다 */
  OG.pick = async function (cands, o, opt) {
    opt = opt || {};
    var UI = G.UI, max = opt.max != null ? opt.max : K().keep, sel = cands.map(function (c) { return !!c.pre && !c.dis; });
    while (sel.filter(Boolean).length > max) sel[sel.lastIndexOf(true)] = false;
    function n() { return sel.filter(Boolean).length; }
    function row(c, i) {
      var d = c.def || G.MATE[c.m.id], on = sel[i], dis = c.dis || (!on && n() >= max);
      var right = (c.def ? '<span class="tag">' + U.esc(c.def.kinTag) + '</span> ' + U.esc(c.def.typeName || '') : '함께한 ' + years(c.m) + '년' + (OG.isEvent(c.m) ? ' <span class="tag">사건 동료</span>' : '')) + (c.tags || '');
      var sub = c.def ? U.esc(c.def.desc) : U.esc(bestSk(c.m) || '');
      return '<tr class="click" data-og="' + i + '" style="' + (dis ? 'opacity:.45' : '') + '"><td class="pick" style="width:28px"><input type="checkbox" data-og="' + i + '"' + (on ? ' checked' : '') + (dis ? ' disabled' : '') + '></td>' +
        '<td><b>' + U.esc(d.name) + '</b> <span class="muted">' + right + '</span><div class="muted" style="font-size:13px">' + sub + '</div></td></tr>';
    }
    function html() {
      return '<div class="muted" style="margin-bottom:8px">' + fill(opt.head || D().pickHead, o) + '</div><div style="margin-bottom:6px"><b>' + n() + ' / ' + max + '명 고름</b></div>' +
        '<div style="max-height:52vh;overflow:auto"><table class="tbl">' + cands.map(row).join('') + '</table></div>';
    }
    for (;;) {
      var win = UI.window({ title: opt.title || D().pickTitle, icon: 'people', width: 760, closable: false, html: html(),
        buttons: [{ label: opt.btn || '고른 사람을 남긴다', value: 'pick' }],
        onBuild: function (el, w) {
          function box() { return w.content || el; }
          function redraw() { box().innerHTML = html(); wire(); }
          function wire() { U.$$('tr[data-og]', box()).forEach(function (tr) { tr.onclick = function (ev) { if (ev) ev.preventDefault(); var i = +tr.dataset.og; if (cands[i].dis || (!sel[i] && n() >= max)) return; sel[i] = !sel[i]; redraw(); }; }); }
          wire();
        } });
      await win.result;
      if (n() || opt.noneOk || !cands.some(function (c) { return c.m; }) || (await UI.confirm(fill(D().pickNone, o), '그대로 한다', '다시 고른다'))) break;
    }
    return cands.filter(function (c, i) { return sel[i]; });
  };
  /** 세대 교체 (G.Family.succeed — 새 제독으로 바뀌기 전에): 노장들과의 작별 · 곁에 남을 두 사람 */
  OG.atSucceed = async function (p, k, forced) {
    var s = S(), UI = G.UI, c0 = K(), vets = OG.veterans(), hc = city(p.home);
    var o = { old: p.name, heir: k.name, yrs: c0.years, young: k.sex === 'f' ? '아가씨' : '도련님', home: hc ? hc.name : '' };
    var kin = null, plan = G.HeirPlan ? G.HeirPlan.forSucceed(p, k) : { friend: null, pledged: [] };   // 후계를 위한 안배 — 약속한 부하·소꿉친구 (js/systems/heirplan.js)
    if (plan.friend) kin = plan.friend;
    else if (U.chance(c0.kinChance)) { try { kin = OG.makeKin(kinKind(), p, k); } catch (e) { console.error(e); kin = null; } }
    var extra = plan.pledged.filter(function (m) { return vets.indexOf(m) < 0; });   // 노장이 아니어도 약속한 부하는 후견 후보
    if (!vets.length && !kin && !extra.length) { if (G.HeirPlan) G.HeirPlan.afterSucceed(); return { kept: [], gone: [] }; }
    var pt = '<span class="tag">약속</span>';
    var cands = vets.concat(extra).map(function (m) { var pl = plan.pledged.indexOf(m) >= 0; return { m: m, pre: pl, pledged: pl, tags: pl ? ' ' + pt : '' }; });
    if (kin) cands.push({ def: kin, kin: true, pre: !!plan.friend, tags: plan.friend ? ' ' + pt : '' });
    if (plan.friend && G.HeirPlan) await G.HeirPlan.friendArrives(kin, o, k);
    var chosen = await withShot('arrange', p, k, [], forced, async function () {
      await UI.alert(fill(vets.length ? D().intro : D().introKin, o), '노장들');
      return OG.pick(cands, o);
    });
    var kept = [], gone = [], gen = (p.generation || 1) + 1;
    // 남는 노장
    chosen.filter(function (c) { return c.m; }).forEach(function (c, i) {
      var m = c.m; m.aide = { gen: gen, y: s.date.y }; m.loyal = Math.max(m.loyal || 0, c0.aideLoyal); m.leaveCd = Math.max(m.leaveCd || 0, (s.day || 0) + c0.aideCalm);
      kept.push(m.id);
      G.State.log(fill(D().aideLog, { name: G.MATE[m.id].name, heir: k.name }));
      c.say = c.pledged && G.HEIR_PLAN ? [G.HEIR_PLAN.council.pledgeStay] : D().stay[i % D().stay.length];
    });
    var aides = chosen.filter(function (c) { return c.m; });
    if (aides.length) await withShot('aide', p, k, aides.map(function (c) { return c.m; }), forced, async function () {
      if (!forced) await UI.say(fill(D().askAide, { names: aides.map(function (c) { return G.MATE[c.m.id].name; }).join('·'), heir: k.name }),
        { name: p.name, portrait: p.portrait, half: G.Img.chain.heroHalf(), lang: 3 });
      for (var i = 0; i < aides.length; i++) {
        var c = aides[i];
        await lines(c.say, c.m.id, Object.assign({}, o, { name: G.MATE[c.m.id].name }));
      }
      await lines([D().stayHeir], null, o, k);
    });
    // 함께 오는 친족·소꿉친구
    var kc = chosen.filter(function (c) { return c.kin; })[0];
    if (kc) {
      var d = kc.def; st().defs[d.id] = d; register(d);
      var row = G.Legend && G.Legend.join ? G.Legend.join(d.id, hc) : null;
      if (row) { delete row.ev; row.loyal = c0.kinLoyal; row.kin = d.kin; kept.push(d.id); }
      var joinTalk = async function () {
        await lines(D().kin[d.kin].lines, d.id, Object.assign({}, o, { name: d.name }), k);
        var fc = d.friendClass && D().friendClasses && D().friendClasses[d.friendClass];
        if (fc) await lines(fc.lines, d.id, Object.assign({}, o, { name: d.name }), k);
      };
      if (row) await withShot('join', p, k, [d], forced, joinTalk); else await joinTalk();
      G.State.log(fill(D().kin.join, { name: d.name, heir: k.name, tag: d.kinTag }));
      if (G.HeirPlan) G.HeirPlan.stopPic();
    }
    // 내리는 노장
    var leave = vets.filter(function (m) { return kept.indexOf(m.id) < 0; });
    leave.forEach(function (m) {
      var d = G.MATE[m.id], yrs = years(m), h = city((G.MATE_RANGE && G.MATE_RANGE[m.id] && G.MATE_RANGE[m.id].home) != null ? G.MATE_RANGE[m.id].home : (m.from != null ? m.from : p.home));
      OG.left(m.id, 'retire');
      s.mates = s.mates.filter(function (x) { return x !== m; });
      s.flags['gone_' + m.id] = 1;
      (s.mateFate || (s.mateFate = {}))[m.id] = { kind: 'other', why: 'retire', y: s.date.y, home: h ? h.id : null, at: s.loc && s.loc.mode === 'city' ? s.loc.city : null, sea: !(s.loc && s.loc.mode === 'city'), yrs: yrs };
      if (G.MateKnow) G.MateKnow.know(m.id, h ? h.id : null, 'fate');
      G.State.log(fill(D().log, { name: d.name, old: p.name, home: h ? h.name : '고향', yrs: yrs }));
      gone.push(m.id);
    });
    if (gone.length) {
      if (R().tidyCaptains) R().tidyCaptains();
      if (G.Cabins && G.Cabins.tidy) G.Cabins.tidy();
      var names = gone.map(function (id) { return G.MATE[id].name; }), last = names[names.length - 1];
      await withShot('farewell', p, k, leave, forced, function () {
        return UI.alert(fill(forced ? D().goDeath : D().goRetire, Object.assign({}, o, { namesW: names.join('·') + U.jx(last, '은/는') })), '노장들');
      });
    }
    if (G.HeirPlan) G.HeirPlan.afterSucceed();
    return { kept: kept, gone: gone };
  };
})(window.G = window.G || {});
