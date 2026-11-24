/* 여성 제독의 선상 육아 (G.SeaNest) — 2026-11-24 사용자 요청 「여성 플레이어의 경우 선상에서 육아를 진행할 수 있게 구성해」
   대사·사건·할 일·조정값: js/data/seanest.js (G.SEA_NEST · G.SEA_NEST_ACTS · G.SEA_NEST_EVENTS · G.BALANCE.seaNest)
   ■ 누구: 여성 제독(R.heroFemale)의 열두 살 안 된 아이. 기함에 max(4)명까지.
   ■ 언제 태우나
     · 배에서 해산하면(js/systems/motherhood.js M.birth) 「내 배에서 직접 키운다 / 고향 집에서 유모가 키운다」를 고른다.
     · 자택 메뉴 「배에서 키울 아이」(js/city/misc.js): 집에 있는 아이를 태우거나, 배의 아이를 집에 맡긴다.
     · 다른 항구에서는 수첩 「배 위의 아이들」에서 상선 편에 고향으로 보낼 수 있다(sendGold).
   ■ 배에서 자라면
     · 아기 방(요람)은 기함의 진료실 → 식당 → 예배실 → 창고, 없으면 함장실 (방을 헐지는 않는다 — 이름만).
     · 돌보는 사람: 아이의 아버지(남편)가 배에 있으면 그 사람 → 다른 남편 → 의학이 높은 부하 → 여성 부하.
     · 날마다(바다): 두 살 밑의 아기는 밤에 울어 함대 피로가 조금 쌓인다(돌보는 사람이 있으면 절반).
     · 달마다(js/systems/family.js F.newMonth → SN.month): 사이 +bondMonth(떨어져 지내 서먹해지는 일이 없다) · 함께 바다에 나간 달(k.sea — 대물림의 견습 몫에 들어간다)
       세 살부터 능력, 여섯 살부터 뱃일 특기, 제독이 잘하는 말 · 여섯 살 밑은 가끔 열(의학이 없는 배면 제독 체력) · 함대 규율 +disc
       열두 살이 되면 선상 육아를 마치고 견습 선원(k.aboard)이 된다.
     · 수첩 「배 위의 아이들 — 돌보기」: 나이마다 함께하는 일(아이마다 같은 일은 actGap일에 한 번), 온 배의 식구가 함께하는 저녁(dinnerGap).
     · 바다 위 하루(js/scenes/sea.js): 가끔 배 위의 육아 사건 — 아이마다 같은 사건은 한 번.
   ■ 집 쪽 사건은 배의 아이를 집에 있는 아이로 보지 않는다(k.nest — homelife·familyevent·motherhood).
   ■ 세대 교체·섭정·함대를 잃음·남성 제독이 되면 배의 아이들은 고향 집으로 (SN.allHome).
   저장: k.nest = {since(날), acts:{일 id: 날}, seen:{사건 id: 날}, last(마지막 사건 날)} · state.seaNest = {dinner(날)} — 옛 저장에는 없다(없으면 배에 아이가 없다). */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var SN = {};
  G.SeaNest = SN;
  function S() { return G.Game && G.Game.state; }
  function P() { var s = S(); return s && s.player; }
  function F() { return G.Family; }
  function K() { return (G.BALANCE && G.BALANCE.seaNest) || {}; }
  function D() { return G.SEA_NEST || {}; }
  function H() { return G.Husbands; }
  function CB() { return G.Cabins; }
  function st() { var s = S(); return s.seaNest || (s.seaNest = {}); }
  function row(id) { var s = S(); return (s && s.mates || []).filter(function (m) { return m.id === id; })[0] || null; }
  function nm(id) { var d = id && G.MATE[id]; return d ? d.name : ''; }
  function given(k) { return (F().given ? F().given(k) : '') || k.name; }
  function age(k) { return F().kidAge(k); }
  function tut() { return !!(G.Tutorial && G.Tutorial.active && G.Tutorial.active()); }
  function female() { var p = P(); return !!(p && R.heroFemale && R.heroFemale(p)); }
  SN.K = K;

  // ---------------------------------------------------------------- 누가 배에 있나
  /** 배에서 키우는 아이들 */
  SN.list = function () { var p = P(); return p ? (p.kids || []).filter(function (k) { return k.nest && !k.lost && !k.unnamed; }) : []; };
  SN.is = function (k) { return !!(k && k.nest); };
  SN.count = function () { return SN.list().length; };
  SN.full = function () { return SN.count() >= (K().max || 4); };
  /** 나이 갈래: baby · small · child (열두 살부터 null) */
  SN.band = function (k) { var a = age(k); return a >= (K().untilAge || 12) ? null : a >= 8 ? 'child' : a >= 3 ? 'small' : 'baby'; };
  /** 배에 태울 수 있는 아이인가 (집에 있는 열두 살 밑의 아이) */
  SN.canTake = function (k) {
    if (!female() || !k || k.nest || k.aboard || k.lost || k.married || k.away || k.house != null || k.crew) return false;
    return !k.unnamed && age(k) < (K().untilAge || 12);
  };
  /** 해산 뒤 · 자택에서 배에 태운다 */
  SN.take = function (k) {
    if (!k || k.nest) return false;
    k.nest = { since: S().day, acts: {}, seen: {} };
    k.house = null;   // 둘째 부인의 집 아이가 아니다 (여성 제독의 아이는 본가)
    return true;
  };
  /** 집으로 (자택에 맡김 · 상선 편 · 세대 교체) */
  SN.leave = function (k) { if (k) delete k.nest; };
  SN.allHome = function (why) {
    var l = (P() && P().kids || []).filter(function (k) { return k.nest; });
    l.forEach(SN.leave);
    if (l.length && why) G.State.log(why);
    return l.length;
  };

  // ---------------------------------------------------------------- 방 · 돌보는 사람
  /** 아기 방(요람)을 둔 곳 — {kind, name} */
  SN.nursery = function () {
    var rooms = CB() && CB().rooms ? CB().rooms() : [], L = D(), kind = 'captain';
    (L.rooms || ['sick', 'mess', 'chapel', 'store']).some(function (t) { if (rooms.indexOf(t) > 0) { kind = t; return true; } return false; });
    return { kind: kind, name: (L.roomName || {})[kind] || kind };
  };
  /** 아이를 함께 돌보는 사람의 부하 ID (아버지 → 다른 남편 → 의학 → 여성 부하) */
  SN.carer = function (k) {
    var hs = H() ? H().list() : [];
    if (k && k.father && hs.some(function (h) { return h.id === k.father; })) return k.father;
    if (hs.length) return hs.slice().sort(function (a, b) { var x = row(a.id), y = row(b.id); return ((y && y.loyal) || 0) - ((x && x.loyal) || 0); })[0].id;
    var ms = (S().mates || []).filter(function (m) { return G.MATE[m.id] && !G.MATE[m.id].minor && !(R.mateHidden && R.mateHidden(m)); });
    var med = ms.map(function (m) { return { m: m, lv: R.mateSkill ? R.mateSkill(m, 'med') : 0 }; }).filter(function (x) { return x.lv > 0; }).sort(function (a, b) { return b.lv - a.lv; });
    if (med.length) return med[0].m.id;
    var fem = ms.filter(function (m) { return G.MATE[m.id].g === 'f'; }).sort(function (a, b) { return (b.loyal || 0) - (a.loyal || 0); });
    return fem.length ? fem[0].id : null;
  };
  /** 배에 의학을 아는 사람이 있나 (제독 · 부하) */
  SN.doctor = function () {
    if (R.skill && R.skill('med') > 0) return true;
    return (S().mates || []).some(function (m) { return G.MATE[m.id] && !(R.mateHidden && R.mateHidden(m)) && (R.mateSkill ? R.mateSkill(m, 'med') : 0) > 0; });
  };
  /** 이 아이의 아버지(배에 있으면) 아니면 남편 한 사람 */
  SN.dad = function (k) {
    var hs = H() ? H().list() : [];
    if (k && k.father && hs.some(function (h) { return h.id === k.father; })) return k.father;
    return hs.length ? hs[0].id : null;
  };

  // ---------------------------------------------------------------- 글 · 말하는 사람
  function shipName() { var f = S().fleet; return f && f.ships && f.ships[0] ? f.ships[0].name : '기함'; }
  function vars(k) {
    var p = P(), hc = G.CITY_DATA[R.seat ? R.seat() : p.home];
    return { k: k ? given(k) : '', dad: nm(SN.dad(k)) || '남편', carer: nm(SN.carer(k)) || '유모', room: SN.nursery().name, ship: shipName(), me: p.name, home: hc ? hc.name : '고향' };
  }
  function fill(t, o) {
    return String(t == null ? '' : t).replace(/\{(\w+)\|([^}]+)\}/g, function (all, k, j) { return o[k] == null ? all : U.jx(String(o[k]), j); })
      .replace(/\{(\w+)\}/g, function (all, k) { return o[k] == null ? all : o[k]; });
  }
  SN.fill = function (t, k, extra) { var o = vars(k), x; for (x in extra || {}) o[x] = extra[x]; return fill(t, o); };
  function mateSp(id, emotion) {
    var d = G.MATE[id]; if (!d) return null;
    var T = G.Scenes.city && G.Scenes.city.B && G.Scenes.city.B.tavern, who = T && T.mateSpeaker ? T.mateSpeaker(d) : { name: d.name, portrait: G.Scenes.mateSpec(id) };
    var o = {}, x; for (x in who) o[x] = who[x];
    o.lang = 3; o.li = null; o.emotion = emotion || 'warm';
    return o;
  }
  var sailors = {};
  function sailor(name) {
    if (sailors[name]) return sailors[name];
    var A = G.Art, cook = /요리사/.test(name), sp = { name: name, lang: 3 };
    try { sp.portrait = A.withImg(A.npcSpec('seanest_' + name, 'sailor', 'ib', 'm'), G.Img.chain.npc ? G.Img.chain.npc(cook ? 'cook' : 'boatswain') : []); } catch (e) { /* 그림 없이 */ }
    return (sailors[name] = sp);
  }
  function me() { var p = P(); return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function kidSp(k) { return G.HomeLife && G.HomeLife.speaker ? G.HomeLife.speaker(k, true) : { name: k.name, portrait: F().kidSpec(k), lang: 3 }; }
  /** 줄 하나의 말하는 사람 — 없으면 null(그 줄은 건너뛴다) */
  function who(code, name, k) {
    if (code === 'x') return {};
    if (code === 'p') return me();
    if (code === 'k') return k && age(k) >= 3 ? kidSp(k) : null;
    if (code === 'h') { var d = SN.dad(k); return d ? mateSp(d, 'warm') : null; }
    if (code === 'n') { var c = SN.carer(k); return c ? mateSp(c, 'warm') : null; }
    if (code === 'm') return G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : null;
    if (code === 's') return sailor(name || '선원');
    return null;
  }
  async function line(raw, k) {
    var m = /^(\w)(?:\[([^\]]+)\])?:([\s\S]*)$/.exec(raw); if (!m) return;
    var sp = who(m[1], m[2], k); if (!sp) return;
    var t = SN.fill(m[3], k);
    if (m[1] === 'x') await UI.say(t, {}); else await UI.say(t, sp);
  }
  SN.line = line;
  function needOk(need, k) { return !need || (need === 'h' ? !!SN.dad(k) : need === 'n' ? !!SN.carer(k) : true); }

  // ---------------------------------------------------------------- 효과
  var SN_ST = { str: '체력', int: '지력', mar: '무력', cha: '매력' };
  function skName(id) { return (G.SKILLS.filter(function (x) { return x.id === id; })[0] || {}).name || id; }
  /** 효과를 매기고 알림 글을 돌려준다 */
  SN.apply = function (fx, k) {
    var s = S(), f = s.fleet, p = s.player, out = [];
    if (!fx) return '';
    if (fx.bond && k) { F().addBond(k, fx.bond); out.push('사이 ' + (fx.bond > 0 ? '+' : '') + fx.bond); }
    ['str', 'int', 'mar', 'cha'].forEach(function (x) {
      if (!fx[x] || !k) return; if (!k.st) k.st = { str: 55, int: 55, mar: 55, cha: 55 };
      var b = k.st[x] || 55, gx = G.KidGrow ? G.KidGrow.statAdd(k, x, fx[x]) : (k.st[x] = Math.max(1, Math.min(90, b + fx[x])), k.st[x] - b);
      if (gx) out.push(SN_ST[x] + ' ' + (gx > 0 ? '+' : '') + gx);
    });
    if (fx.sk && k) {
      k.sk = k.sk || {};
      Object.keys(fx.sk).forEach(function (id) {
        var cap = fx.sk[id], cur = k.sk[id] || 0; if (cur >= cap) return;
        if (G.KidGrow) { if (!G.KidGrow.skill(k, id, 0.8, cap)) return; } else k.sk[id] = cur + 1;
        out.push(skName(id) + ' ' + k.sk[id]);
      });
    }
    if (fx.fatigue && f) { f.fatigue = U.clamp((f.fatigue || 0) + fx.fatigue, 0, 100); out.push('함대 피로 ' + (fx.fatigue > 0 ? '+' : '') + fx.fatigue); }
    if (fx.disc && f) { f.discipline = U.clamp((f.discipline == null ? 60 : f.discipline) + fx.disc, 0, 100); out.push('규율 ' + (fx.disc > 0 ? '+' : '') + fx.disc); }
    if (fx.hp) { var h0 = p.hp == null ? 100 : p.hp; p.hp = U.clamp(h0 + fx.hp, 1, 100); if (Math.round(p.hp - h0)) out.push('제독 체력 ' + (fx.hp > 0 ? '+' : '') + Math.round(p.hp - h0)); }
    if (fx.gold) { var g = fx.gold < 0 ? -Math.min(p.gold, -fx.gold) : fx.gold; if (g) { p.gold += g; out.push('금화 ' + (g > 0 ? '+' : '') + g); } }
    if (fx.food && f) {
      if (fx.food < 0) { var q = Math.min(Math.floor(f.food || 0), -fx.food); if (q > 0) { f.food -= q; out.push('식량 −' + q + '통'); } }
      else { var room = R.free ? Math.max(0, Math.floor(R.free())) : fx.food, q2 = Math.min(fx.food, room); if (q2 > 0) { f.food = (f.food || 0) + q2; out.push('식량 +' + q2 + '통'); } }
    }
    if (fx.loyal && k) {
      var id = SN.dad(k) || SN.carer(k), m = id && row(id);
      if (m) { m.loyal = U.clamp((m.loyal == null ? 70 : m.loyal) + fx.loyal, 0, 100); out.push(nm(id) + ' 충성 +' + fx.loyal); }
    }
    return out.join(' · ');
  };

  // ---------------------------------------------------------------- 해산 뒤 (js/systems/motherhood.js M.birth)
  /** 갓 태어난 아이들을 어디서 키울지 고른다. 고르지 않으면(창이 없으면) 고향 집 */
  SN.afterBirth = async function (kids) {
    var L = D(), p = P(), o = vars(kids[0]);
    if (!female()) return false;
    var free = (K().max || 4) - SN.count(), fits = free >= kids.length;
    var names = kids.map(function (k) { return given(k); }).join('·'), oo = {}; for (var x in o) oo[x] = o[x]; oo.k = names; oo.n = SN.count();
    var opts = [
      { label: fill(L.optSea, oo), right: fits ? fill(L.optSeaSub, oo) : fill(L.optFull, oo), value: 'sea', icon: 'ship', disabled: !fits },
      { label: fill(L.optHome, oo), right: fill(L.optHomeSub, oo), value: 'home', icon: 'house' }
    ];
    var v = await UI.choose(L.askTitle, opts, { width: 640, cancel: false, text: fill(L.ask, oo) });
    if (v !== 'sea' || !fits) return false;
    kids.forEach(function (k) { SN.take(k); G.State.log(SN.fill(L.seaLog, k)); });
    await UI.alert(fill(L.seaSet, oo), L.askTitle);
    var dad = SN.dad(kids[0]), carer = SN.carer(kids[0]);
    if (dad) await UI.say(U.pick(L.dadSea), mateSp(dad, 'happy'));
    else if (carer) await UI.say(U.pick(G.MATE[carer].g === 'f' ? L.carerSeaF : L.carerSeaM), mateSp(carer, 'warm'));
    return true;
  };

  // ---------------------------------------------------------------- 날마다 (js/systems/world.js)
  SN.daily = function () {
    var s = S(), p = P(), k = K(), L = D(), out = [];
    if (!s || !p) return out;
    var l = (p.kids || []).filter(function (x) { return x.nest; });
    if (!l.length) return out;
    if (!female() || s.regency) { SN.allHome(L.leftHome); return out; }
    if (!s.fleet || !s.fleet.ships || !s.fleet.ships.length) { SN.allHome(L.ashore); out.push({ icon: 'house', text: L.ashore }); return out; }
    if (s.loc && s.loc.mode === 'sea') {
      var babies = l.filter(function (x) { return !x.unnamed && age(x) < (k.cryAge || 2); }).length;
      if (babies) s.fleet.fatigue = U.clamp((s.fleet.fatigue || 0) + (k.cry == null ? 0.12 : k.cry) * babies * (SN.carer(l[0]) ? (k.cryCarer == null ? 0.5 : k.cryCarer) : 1), 0, 100);
    }
    return out;
  };

  // ---------------------------------------------------------------- 달마다 (js/systems/family.js F.newMonth)
  var SEA_SK = ['nav', 'survey', 'ops', 'sword', 'gun'];
  /** 배에서 자라는 아이의 한 달. out에 알림을 더한다 — 열두 살이 되면 견습 선원으로 */
  SN.month = function (k, out) {
    var c = K(), L = D(), p = P(), a = age(k);
    k.sea = (k.sea || 0) + 1;                                   // 함께 바다에 나간 달 (대물림 — F.succeed)
    F().addBond(k, c.bondMonth == null ? 3 : c.bondMonth);
    if (a >= (c.untilAge || 12)) {
      delete k.nest; k.aboard = true; k.seaBorn = true;
      if (G.KidGrow) G.KidGrow.skill(k, 'ops', 1, 1); else { k.sk = k.sk || {}; k.sk.ops = Math.max(1, k.sk.ops || 0); }
      out.push({ icon: 'ship', text: SN.fill(L.grownUp, k) });
      G.State.log(SN.fill(L.grownLog, k));
      return;
    }
    if (a >= 3 && U.chance(c.statP == null ? 0.5 : c.statP)) { var x = U.pick(['str', 'int', 'mar', 'cha']); if (G.KidGrow) G.KidGrow.stat(k, x, 1); }
    if (a >= (c.skillAge || 6)) {
      var sk = U.pick(SEA_SK.filter(function (id) { return G.SKILLS.some(function (y) { return y.id === id; }); }));
      var cap = (c.skillCap || [1, 2])[a >= (c.skillCapAge || 9) ? 1 : 0];
      var learnt = sk && (G.KidGrow ? G.KidGrow.skill(k, sk, c.skillP == null ? 0.25 : c.skillP, cap)
        : ((k.sk = k.sk || {}), (k.sk[sk] || 0) < cap && U.chance(c.skillP || 0.25) && (k.sk[sk] = (k.sk[sk] || 0) + 1)));
      if (learnt) out.push({ icon: 'star', text: SN.fill(L.learnSkill, k, { sk: skName(sk), lv: k.sk[sk] }) });
    }
    if (a >= 3 && U.chance(c.langP == null ? 0.12 : c.langP)) {   // 어머니가 잘하는 말 (보통까지)
      k.lg = k.lg || {};
      var cand = (p.lg || []).map(function (v, i) { return { i: i, v: v }; }).filter(function (o) { return o.v >= 2 && (k.lg[o.i] || 0) < Math.min(2, o.v); });
      if (cand.length) { var o = U.pick(cand); k.lg[o.i] = (k.lg[o.i] || 0) + 1; if (k.lg[o.i] === Math.min(2, o.v)) out.push({ icon: 'scroll', text: SN.fill(L.learnLang, k, { lg: G.LANGS[o.i] }) }); }
    }
    if (a < (c.sickAge || 6) && U.chance(c.sickP == null ? 0.03 : c.sickP)) {
      if (SN.doctor()) out.push({ icon: 'heart', text: SN.fill(L.sickOk, k) });
      else { var n = c.sickHp || 12; p.hp = Math.max(1, (p.hp == null ? 100 : p.hp) - n); F().addBond(k, 2); out.push({ icon: 'heart', text: SN.fill(L.sickBad, k, { n: n }) }); }
    }
    // 아이 웃음소리에 뱃사람들이 순해진다 (한 달에 한 번 — 맏이 몫으로)
    var first = SN.list()[0];
    if (first === k && S().fleet && c.disc) S().fleet.discipline = U.clamp((S().fleet.discipline == null ? 60 : S().fleet.discipline) + c.disc, 0, 100);
  };

  // ---------------------------------------------------------------- 바다 위 하루 (js/scenes/sea.js)
  function mem(k) { var n = k.nest || (k.nest = { acts: {}, seen: {} }); n.seen = n.seen || {}; n.acts = n.acts || {}; return n; }
  SN.pool = function (k) {
    var band = SN.band(k); if (!band) return [];
    var seen = mem(k).seen, a = age(k);
    return (G.SEA_NEST_EVENTS || []).filter(function (e) { return e.band === band && !Object.prototype.hasOwnProperty.call(seen, e.id) && (e.minAge == null || a >= e.minAge) && needOk(e.need, k); });
  };
  SN.ready = function () {
    var s = S(), gap = K().gap == null ? 45 : K().gap;
    if (!female()) return [];
    return SN.list().filter(function (k) { var m = mem(k); return (m.last == null || s.day - m.last >= gap) && SN.pool(k).length > 0; });
  };
  SN.atSea = async function () {
    var s = S(); if (!s || !s.loc || s.loc.mode !== 'sea' || tut()) return false;
    var l = SN.ready(); if (!l.length) return false;
    if (!U.chance(K().chance == null ? 0.05 : K().chance)) return false;
    var k = U.pick(l);
    return SN.play(k, U.pick(SN.pool(k)));
  };
  SN.play = async function (k, ev) {
    if (!k || !ev) return false;
    var s = S(), m = mem(k);
    m.last = s.day; m.seen[ev.id] = s.day;
    try {
      UI.toast((ev.title || '배 위의 육아') + ' — ' + given(k) + ' (' + age(k) + '세)', 'heart', 3600);
      for (var i = 0; i < ev.lines.length; i++) await line(ev.lines[i], k);
      var fx = ev.fx || null, say = null;
      if (ev.pick) {
        var po = ev.pick.opts.filter(function (o) { return needOk(o.need, k); });
        var v = await UI.ask(SN.fill(ev.pick.text || ev.title, k), po.map(function (o, j) { return { label: SN.fill(o.label, k), value: j }; }), Object.assign(me(), { cancel: false }));
        var o = po[v == null ? 0 : v] || po[0];
        fx = o.fx; say = o.say;
      }
      for (var j = 0; say && j < say.length; j++) await line(say[j], k);
      var note = SN.apply(fx, k);
      if (note) UI.toast(given(k) + ' — ' + note, 'heart', 4600);
      G.State.log('배 위의 육아: ' + k.name + ' — ' + (ev.title || ev.id));
    } catch (e) { console.error(e); }
    return true;
  };

  // ---------------------------------------------------------------- 함께하는 일 (수첩)
  function actLeft(k, a) { var n = mem(k), d = n.acts[a.id]; var gap = K().actGap || 30; return d == null ? 0 : Math.max(0, gap - (S().day - d)); }
  SN.acts = function (k) {
    var band = SN.band(k), a = age(k);
    return (G.SEA_NEST_ACTS || []).filter(function (x) { return x.band === band && (x.minAge == null || a >= x.minAge) && needOk(x.need, k); });
  };
  SN.doAct = async function (k, a) {
    var L = D(); mem(k).acts[a.id] = S().day;
    for (var i = 0; i < a.lines.length; i++) await line(a.lines[i], k);
    var fx = {}, x; for (x in a.fx) fx[x] = a.fx[x];
    if (a.music && R.skill && R.skill('music') > 0) for (x in a.music) fx[x] = (fx[x] || 0) + a.music[x];
    var note = SN.apply(fx, k);
    if (note) UI.toast(fill(L.done, { k: given(k), note: note }), 'heart', 4600);
    G.State.log('선상 육아: ' + k.name + ' — ' + a.label);
  };
  SN.kidMenu = async function (k) {
    var L = D();
    for (;;) {
      if (!k.nest) return;
      var acts = SN.acts(k), atHome = S().loc.mode === 'city' && S().loc.city === (R.seat ? R.seat() : P().home), inPort = S().loc.mode === 'city';
      var opts = acts.map(function (a) { var d = actLeft(k, a); return { label: a.label, right: d ? fill(L.soon, { d: d }) : a.sub, value: a, icon: a.icon || 'heart', disabled: d > 0 }; });
      if (inPort) opts.push(atHome ? { label: L.leaveItem, right: '', value: 'leave', icon: 'house' } : { label: L.sendItem, right: '금화 ' + U.num(K().sendGold || 400) + '닢', value: 'send', icon: 'house' });
      var v = await UI.choose(k.name + ' <small class="muted">' + age(k) + '세 · ' + (L.band || {})[SN.band(k)] + ' · ' + F().bondWord(k) + ' ' + F().bondHearts(k) + '</small>', opts, { width: 620 });
      if (v == null) return;
      if (v === 'leave') { await SN.leaveHome(k); return; }
      if (v === 'send') { if (await SN.send(k)) return; continue; }
      await SN.doAct(k, v);
    }
  };
  SN.leaveHome = async function (k) {
    var L = D();
    if (age(k) >= 3) await UI.say(U.pick(L.leaveLine), kidSp(k));
    SN.leave(k); G.State.log(SN.fill(L.leaveLog, k));
    UI.toast(SN.fill(L.leaveLog, k), 'house');
  };
  SN.send = async function (k) {
    var L = D(), p = P(), gold = K().sendGold || 400;
    var ok = await UI.ask(SN.fill(L.send, k, { gold: U.num(gold) }), [{ label: '보낸다', value: true }, { label: '그만둔다', value: false }], me());
    if (!ok) return false;
    if (p.gold < gold) { await UI.alert(L.sendNoGold, L.sendTitle); return false; }
    p.gold -= gold;
    if (age(k) >= 3) await UI.say(U.pick(L.leaveLine), kidSp(k));
    SN.leave(k); G.State.log(SN.fill(L.sendLog, k));
    if (G.Game.refreshHud) G.Game.refreshHud();
    return true;
  };
  SN.dinner = async function () {
    var L = D(), t = st();
    t.dinner = S().day;
    await UI.say(L.dinnerText, {});
    SN.list().forEach(function (k) { F().addBond(k, 2); });
    var f = S().fleet; if (f) f.fatigue = U.clamp((f.fatigue || 0) - 5, 0, 100);
    if (H()) H().list().forEach(function (h) { var m = row(h.id); if (m) m.loyal = U.clamp((m.loyal == null ? 70 : m.loyal) + 1, 0, 100); });
    UI.toast('온 배의 식구가 함께한 저녁 — 아이들 사이 +2 · 함대 피로 −5', 'heart', 4600);
  };
  /** 수첩 「배 위의 아이들 — 돌보기」 */
  SN.menu = async function () {
    var L = D();
    for (;;) {
      var l = SN.list(); if (!l.length) return;
      var t = st(), gap = K().dinnerGap || 30, dl = t.dinner == null ? 0 : Math.max(0, gap - (S().day - t.dinner));
      var opts = l.map(function (k) { return { label: k.name, right: age(k) + '세 · ' + (L.band || {})[SN.band(k)] + ' · ' + F().bondHearts(k), value: k, icon: 'heart' }; });
      opts.push({ label: L.dinner, right: dl ? fill(L.soon, { d: dl }) : L.dinnerSub, value: 'dinner', icon: 'bread', disabled: dl > 0 });
      var n = SN.nursery();
      var v = await UI.choose(L.menuTitle, opts, { width: 620, text: fill(L.menuHead, { ship: U.esc(shipName()), room: n.name }) });
      if (v == null) return;
      if (v === 'dinner') { await SN.dinner(); continue; }
      await SN.kidMenu(v);
    }
  };
  /** 수첩 제독 쪽의 단추 (js/ui/info.js) — 다 닫으면 redraw */
  SN.infoButton = function (el, redraw) {
    var n = SN.count(); if (!n || !female()) return;
    var b = U.el('button', 'btn navy', G.icon('heart') + ' ' + fill(D().infoBtn, { n: n }));
    b.style.margin = '10px 0 0';
    b.onclick = function () { SN.menu().then(function () { if (el.isConnected && redraw) redraw(); }); };
    el.appendChild(b);
  };
  /** 수첩 자녀 칸의 꼬리표 */
  SN.tag = function (k) { return k && k.nest ? ' · ' + D().tag : ''; };

  // ---------------------------------------------------------------- 자택 (js/city/misc.js HM.menu)
  function homeKids() { return (P().kids || []).filter(SN.canTake); }
  SN.homeItem = function (c) {
    if (!female()) return null;
    var a = SN.count(), b = homeKids().length; if (!a && !b) return null;
    return { label: D().homeItem, icon: 'ship', sub: fill(D().homeItemSub, { a: a, b: b }), onClick: function () { return SN.homeMenu(c); } };
  };
  SN.homeMenu = async function () {
    var L = D();
    for (;;) {
      var on = SN.list(), off = homeKids(), max = K().max || 4;
      var opts = on.map(function (k) { return { label: k.name + ' <small class="muted">' + age(k) + '세</small>', right: '배에서 자람 → ' + L.leaveItem, value: { k: k, go: 'leave' }, icon: 'house' }; })
        .concat(off.map(function (k) { return { label: k.name + ' <small class="muted">' + age(k) + '세</small>', right: on.length >= max ? fill(L.full, { n: max }) : '집 → 배에 태운다', value: { k: k, go: 'take' }, icon: 'ship', disabled: on.length >= max }; }));
      if (!opts.length) return;
      var v = await UI.choose(L.homeTitle, opts, { width: 620, text: L.homeHint });
      if (v == null) return;
      if (v.go === 'leave') { await SN.leaveHome(v.k); continue; }
      SN.take(v.k); G.State.log(SN.fill(L.takeLog, v.k));
      if (age(v.k) >= 3) await UI.say(U.pick(L.takeLine), kidSp(v.k));
      UI.toast(SN.fill(L.takeLog, v.k), 'ship');
    }
  };
})(window.G = window.G || {});
