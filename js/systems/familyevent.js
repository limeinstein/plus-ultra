/* 가족 사건 (G.FamEv) — 아내·애인과의 데이트, 혼례, 임신, 출산, 귀환, 가족의 일상을 그림 한 장과 대화로 보여 준다.
   사건과 대사는 js/data/familyevents.js (G.FAMILY_EVENTS), 그림은 images/family-events/.

   누가 나오나 (cast): 그 자리에 함께 있는 사람만 —
   · 바다·술집·항구: 배에 탄 아내(본처 p.wifeAboard 또는 둘째 부인 G.Wives.aboard()), 견습으로 탄 아이(G.Family.aboard()), 부관
   · 집: 그 집의 아내(본처 자택 / 둘째 부인의 집)와 그 집에 사는 아이들, 갓난아기
   · 술집 데이트: 여급(애인 — 아직 결혼하지 않았다)
   대사 한 줄마다 말하는 사람·조건이 있어, 그 사람이 없거나 조건이 맞지 않으면 그 줄은 빠진다.

   언제 (조정값 G.BALANCE.famEv):
   · 바다: 아내가 배에 있을 때 날마다 seaChance (앞 사건에서 seaGap일 넘게 지났을 때)
   · 술집: 여급 메뉴 「함께 시간을 보낸다」(호감 dateAff 이상, 같은 사람과 dateGap일에 한 번) · 배에 탄 아내와 「아내와 한잔한다」
   · 고향 부두: 아내가 집에 있고 dockDays일 넘게 떠나 있었으면 · 집에 돌아온 날: returnDays일 넘게 떠나 있었으면
   · 임신: 아기 소식을 들은 날(소식 장면), 그 뒤 집에 들르면 한 번씩(배를 감싸는 손 · 해산 cradleDays일 앞이면 요람)
   · 출산: 해산을 지켜보았으면 「두 사람의 손에 안긴 아기」, 놓쳤으면 「요람 곁의 첫 밤」
   · 집의 하루: 다른 일이 없던 날 homeChance (homeGap일에 한 번까지) · 항구: 아이가 배에 탔으면 portChance (portGap일)
   · 혼례: 청혼을 받아들인 날 (여급 → 술집 잔치, 부하 → 갑판 혼례)
   저장: p.famEv = {seen: {id: 횟수}, last, sea, home, port, ret, dates: {여급 id: 날}} · 아내와의 정: p.wifeLove · 둘째 부인 w.love (옛 저장엔 없다 — 쓸 때 만든다) */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI;
  var FE = G.FamEv = {};
  function S() { return G.Game.state; }
  function P() { return S().player; }
  function K() { return (G.BALANCE && G.BALANCE.famEv) || {}; }
  function Fm() { return G.Family; }
  function HL() { return G.HomeLife; }
  function T() { return G.Scenes.city && G.Scenes.city.B && G.Scenes.city.B.tavern; }
  function mem() { var p = P(); return p.famEv || (p.famEv = { seen: {}, dates: {} }); }
  FE.mem = mem;
  FE.EV = function (id) { return (G.FAMILY_EVENTS || []).filter(function (e) { return e.id === id; })[0] || null; };

  // ---------------------------------------------------------------- 누가 있나
  /** 아내·애인 → {kind:'wife'|'wife2'|'lover', id, name, speaker, mate, maid, preg, w, m} */
  FE.mainWife = function () {
    var p = P(); if (!p.wife) return null;
    return { kind: 'wife', id: p.wife, name: Fm().wifeName(), speaker: Fm().wifeSpeaker(), mate: !!Fm().wifeMate(), maid: !!G.MAID[p.wife], preg: !!(p.preg && p.preg.told) };
  };
  FE.wife2 = function (w) {
    if (!w || !G.Wives) return null;
    return { kind: 'wife2', id: w.id, w: w, name: G.Wives.name(w), speaker: G.Wives.speaker(w), mate: w.kind === 'mate', maid: w.kind === 'maid', preg: !!(w.preg && w.preg.told) };
  };
  FE.lover = function (m) {
    if (!m) return null;
    return { kind: 'lover', id: m.id, m: m, name: m.name, speaker: T() ? T().maidSpeaker(m) : { name: m.name }, mate: false, maid: true, preg: false };
  };
  /** 배에 탄 아내 (본처가 먼저) */
  FE.aboardWife = function () {
    var p = P();
    if (p.wife && p.wifeAboard) return FE.mainWife();
    var ab = G.Wives ? G.Wives.aboard() : [];
    return ab.length ? FE.wife2(ab[0]) : null;
  };
  function named(k) { return !k.unnamed && Fm().kidAge(k) >= 3; }
  function byAge(a, b) { return Fm().kidAge(b) - Fm().kidAge(a); }
  /** 집에 있는 아이들 [이름 있는 3살 넘은 아이, 갓난아기] — w 가 있으면 그 둘째 부인의 집 */
  FE.homeKids = function (w) {
    var p = P(), list = w ? (G.Wives ? G.Wives.kidsOf(w) : []) : (p.kids || []).filter(function (k) { return !k.aboard && k.house == null; });
    return { kids: list.filter(named).sort(byAge), babies: list.filter(function (k) { return !named(k); }) };
  };
  FE.aboardKids = function () { return (Fm().aboard() || []).filter(named).sort(byAge); };
  function hasMate() { var s = S(); return (s.mates || []).some(function (m) { return m.role === 'first' && !(G.R.mateHidden && G.R.mateHidden(m)); }); }

  /** 장면에 나오는 사람들 */
  FE.cast = function (o) {
    o = o || {};
    var s = S(), p = P(), c = o.city != null ? G.CITY_DATA[o.city] : (s.loc && s.loc.mode === 'city' ? G.CITY_DATA[s.loc.city] : null);
    return { at: o.at, love: o.love || null, kids: (o.kids || []).slice(), babies: o.babies || [], aboard: !!o.aboard, mate: o.mate == null ? false : !!o.mate,
      city: c ? c.name : '', home: G.CITY_DATA[p.home] ? G.CITY_DATA[p.home].name : '', days: o.days || 0, witness: !!o.witness, second: !!o.second, npc: o.npc || null };
  };

  // ---------------------------------------------------------------- 조건
  function ageOf(k) { return k ? Fm().kidAge(k) : -1; }
  function test(tok, cs) {
    var not = tok.charAt(0) === '!', t = not ? tok.slice(1) : tok, L = cs.love, k1 = cs.kids[0], r;
    switch (t) {
      case 'wife': r = !!L && L.kind === 'wife'; break;
      case 'wife2': r = !!L && L.kind === 'wife2'; break;
      case 'lover': r = !!L && L.kind === 'lover'; break;
      case 'married': r = !!L && L.kind !== 'lover'; break;
      case 'matewife': r = !!L && L.mate; break;
      case 'maidwife': r = !!L && L.maid; break;
      case 'k1': r = cs.kids.length >= 1; break;
      case 'k2': r = cs.kids.length >= 2; break;
      case 'k3': r = cs.kids.length >= 3; break;
      case 'nokids': r = !cs.kids.length; break;
      case 'girl': r = !!k1 && k1.sex === 'f'; break;
      case 'boy': r = !!k1 && k1.sex !== 'f'; break;
      case 'small': r = !!k1 && ageOf(k1) < 8; break;
      case 'big': r = !!k1 && ageOf(k1) >= 12; break;
      case 'baby': r = cs.babies.length > 0; break;
      case 'preg': r = !!L && !!L.preg; break;
      case 'mate': r = cs.mate; break;
      case 'aboard': r = cs.aboard && cs.kids.length > 0; break;
      case 'second': r = cs.second; break;
      case 'witness': r = cs.witness; break;
      case 'rich': r = P().gold > 10000; break;
      case 'long': r = cs.days > 150; break;
      default: r = true;
    }
    return not ? !r : r;
  }
  function all(list, cs) { return !list || list.every(function (t) { return test(t, cs); }); }
  /** 그 사건이 지금 사람들로 일어날 수 있나 — kid 범위가 있으면 맞는 아이를 맏이 자리(k1)로 옮긴 cast 를 돌려준다 */
  FE.fits = function (ev, cs) {
    if (!ev || (cs.at && ev.at !== cs.at)) return null;
    var c2 = cs;
    if (ev.kid) {
      var pickK = cs.kids.filter(function (k) { var a = ageOf(k); return a >= ev.kid[0] && a <= ev.kid[1]; })[0];
      if (!pickK) return null;
      c2 = Object.assign({}, cs, { kids: [pickK].concat(cs.kids.filter(function (k) { return k !== pickK; })) });
    }
    if (!c2.love && ev.at !== 'home' && ev.at !== 'port') return null;     // 집·항구 밖의 장면은 아내·애인이 있어야
    return all(ev.need, c2) ? c2 : null;
  };
  /** 어울리는 사건 하나를 고른다 (많이 본 것일수록 덜, 바로 앞에 본 것은 빼고) */
  FE.choose = function (at, cs) {
    var m = mem(), cands = [];
    (G.FAMILY_EVENTS || []).forEach(function (ev) {
      if (ev.at !== at) return;
      var c2 = FE.fits(ev, cs); if (!c2) return;
      cands.push({ ev: ev, cs: c2, w: (ev.w || 1) / (1 + (m.seen[ev.id] || 0) * 2) * (ev.id === m.lastId ? 0.15 : 1) });
    });
    if (!cands.length) return null;
    var tot = cands.reduce(function (a, x) { return a + x.w; }, 0), r = U.rand() * tot;
    for (var i = 0; i < cands.length; i++) { r -= cands[i].w; if (r <= 0) return cands[i]; }
    return cands[cands.length - 1];
  };

  // ---------------------------------------------------------------- 글
  function kname(k) { return k ? Fm().kidName(k) : ''; }
  FE.fill = function (t, cs) {
    var L = cs.love, k = cs.kids, p = P();
    var V = {
      me: p.name, love: L ? L.name : '', you: L && L.kind === 'lover' ? '선장님' : '당신',
      k1: kname(k[0]), k2: kname(k[1]), k3: kname(k[2]), kids: k.map(kname).join('·') || '얘들아', child: k[0] ? (k[0].sex === 'f' ? '딸' : '아들') : '',
      baby: cs.babies.length ? kname(cs.babies[0]) : '아기', mate: (function () { var sp = G.Scenes.mateSpeaker('first'); return sp ? sp.name : ''; })(),
      city: cs.city, home: cs.home, days: String(cs.days || '')
    };
    return String(t).replace(/\{(\w+)(?:\|([^}]*))?\}/g, function (all0, key, post) {
      var v = V[key] == null ? '' : V[key];
      if (post == null) return v;
      return v + (post.indexOf('/') >= 0 ? U.jx(v, post) : post);
    });
  };
  /** 말하는 사람 → UI.say 의 화자 (없으면 null = 그 줄을 건너뛴다) */
  FE.speaker = function (w, cs) {
    var T0 = T();
    switch (w) {
      case 'n': return {};
      case 'me': return T0 && T0.playerSpeaker ? T0.playerSpeaker() : { name: P().name, portrait: P().portrait };
      case 'love': return cs.love ? cs.love.speaker : null;
      case 'k1': case 'k2': case 'k3': { var k = cs.kids[+w.charAt(1) - 1]; return k && HL() ? HL().speaker(k) : null; }
      case 'kids': { if (!cs.kids.length || !HL()) return null; var sp = Object.assign({}, HL().speaker(cs.kids[0])); if (cs.kids.length > 1) sp.name = cs.kids.map(kname).join('·'); return sp; }
      case 'mate': return cs.mate ? G.Scenes.mateSpeaker('first') : null;
      case 'npc': return cs.npc || null;
    }
    return null;
  };
  /** 장면 그림을 가리지 않게: 대화창 위에 서는 무릎상(half)은 빼고 대화창 안의 얼굴만 */
  FE.face = function (sp) { if (!sp) return sp; var o = Object.assign({}, sp); delete o.half; delete o.rigId; delete o.standScale; o.noStand = true; return o; };
  /** 실제로 나올 줄들 [[화자, 글]] (시험·미리보기) */
  FE.lines = function (ev, cs) {
    var out = [];
    (ev.lines || []).forEach(function (ln) {
      if (!all(ln.if, cs)) return;
      var sp = FE.speaker(ln.w, cs); if (!sp) return;
      out.push([FE.face(sp), FE.fill(ln.t, cs), ln.w]);
    });
    return out;
  };

  // ---------------------------------------------------------------- 그림
  var curPic = null;
  FE.showPic = function (ev) {
    var root = document.getElementById('ui'), I = G.Img;
    if (!root || !ev.img || !I || !I.file(ev.img)) return { stop: function () { return Promise.resolve(); } };
    if (curPic) curPic.stop();
    var fx = (G.FX && G.FX.famScene) || { w: 1008, top: 74 }, w = fx.w || 1008, h = Math.round(w * 256 / 576);
    var box = document.createElement('div');
    box.className = 'famscene wood brass-frame';
    box.style.cssText = 'left:' + Math.round((1600 - w - 20) / 2) + 'px;top:' + (fx.top || 74) + 'px';
    var img = document.createElement('img'); img.src = I.src(ev.img); img.alt = ev.title || ''; img.style.width = w + 'px'; img.style.height = h + 'px';
    var clip = document.createElement('div'); clip.className = 'fs-clip'; clip.style.width = w + 'px'; clip.style.height = h + 'px'; clip.appendChild(img);
    box.appendChild(clip);
    if (ev.title) { var t = document.createElement('div'); t.className = 'eventfx-title'; t.textContent = ev.title; box.appendChild(t); }
    root.appendChild(box); root.classList.add('homeart-on');
    requestAnimationFrame(function () { box.classList.add('on'); });
    var hd = { box: box };
    hd.stop = function () {
      if (curPic === hd) { curPic = null; root.classList.remove('homeart-on'); }
      box.classList.remove('on');
      return new Promise(function (res) { setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); res(); }, 260); });
    };
    curPic = hd;
    return hd;
  };

  // ---------------------------------------------------------------- 효과
  function addLove(L, n) {
    if (!L || !n) return;
    if (L.kind === 'lover') { var st = S().maids[L.id] || (S().maids[L.id] = { aff: 0, met: 0 }); st.aff = Math.min(100, (st.aff || 0) + n); }
    else if (L.kind === 'wife2' && L.w) L.w.love = Math.min(100, (L.w.love == null ? 70 : L.w.love) + n);
    else { var p = P(); p.wifeLove = Math.min(100, (p.wifeLove == null ? 70 : p.wifeLove) + n); }
  }
  FE.apply = function (fx, cs) {
    if (!fx) return '';
    var s = S(), p = P(), out = [];
    if (fx.aff && cs.love) { addLove(cs.love, fx.aff); out.push(cs.love.name + U.jx(cs.love.name, '와/과') + '의 정 +' + fx.aff); }
    if (fx.bond) { var ks = cs.kids.concat(cs.babies); ks.forEach(function (k) { Fm().addBond(k, fx.bond); }); if (ks.length) out.push('아이와의 사이 +' + fx.bond); }
    if (fx.fatigue && s.fleet) { s.fleet.fatigue = U.clamp((s.fleet.fatigue || 0) + fx.fatigue, 0, 100); out.push('피로 ' + fx.fatigue); }
    if (fx.hp) { p.hp = Math.min(100, (p.hp == null ? 100 : p.hp) + fx.hp); out.push('체력 +' + fx.hp); }
    if (fx.luck) { p.luck = Math.min(99, (p.luck || 50) + fx.luck); out.push('행운 +' + fx.luck); }
    return out.join(' · ');
  };

  // ---------------------------------------------------------------- 보여 주기
  FE.busy = false;
  /** 사건 하나를 그림과 함께 펼친다. evOrId: 사건 또는 id, cs: FE.cast(...) */
  FE.play = async function (evOrId, cs) {
    var ev = typeof evOrId === 'string' ? FE.EV(evOrId) : evOrId; if (!ev) return false;
    var c2 = FE.fits(ev, Object.assign({}, cs, { at: ev.at })); if (!c2) return false;
    var m = mem(), s = S();
    m.seen[ev.id] = (m.seen[ev.id] || 0) + 1; m.last = s.day; m.lastId = ev.id;
    FE.busy = true;
    if (G.Img && G.Img.preload) { try { await G.Img.preload([[ev.img]], 1200); } catch (e) { /* 그림이 늦으면 글부터 */ } }
    var pic = FE.showPic(ev), res = '', fx = Object.assign({}, ev.fx || {});
    try {
      var ls = FE.lines(ev, c2);
      for (var i = 0; i < ls.length; i++) await UI.say(ls[i][1], ls[i][0]);
      if (ev.pick) {
        var opts = ev.pick.opts.map(function (o, j) { return { label: FE.fill(o.label, c2), value: j }; });
        var v = await UI.ask(FE.fill(ev.pick.text, c2), opts, FE.face(FE.speaker('me', c2))), o = ev.pick.opts[v] || ev.pick.opts[0];
        for (var key in (o.fx || {})) fx[key] = (fx[key] || 0) + o.fx[key];
        if (o.t) { var sp = FE.face(FE.speaker(o.t[0], c2)); if (sp) await UI.say(FE.fill(o.t[1], c2), sp); }
      }
      res = FE.apply(fx, c2);
    } catch (e) { console.error(e); }
    await pic.stop();
    FE.busy = false;
    if (res) UI.toast(ev.title + ' — ' + res, 'heart', 4500);
    G.State.log('「' + ev.title + '」 — ' + (c2.love ? c2.love.name + U.jx(c2.love.name, '와/과') + ' 함께' : '가족과 함께') + ' 보낸 시간.');
    if (G.Game.refreshHud) G.Game.refreshHud();
    return true;
  };
  /** 그 자리에 맞는 사건을 골라 펼친다 */
  FE.run = async function (at, cs) {
    var pk = FE.choose(at, Object.assign({}, cs, { at: at }));
    if (!pk) return false;
    return FE.play(pk.ev, pk.cs);
  };

  // ================================================================ 언제
  /** 바다 위 하루 (js/scenes/sea.js) — 배에 아내가 있으면 가끔 */
  FE.atSea = async function () {
    var s = S(), k = K(), m = mem(), L = FE.aboardWife();
    if (!L || (G.Tutorial && G.Tutorial.active && G.Tutorial.active())) return false;
    if (m.sea != null && s.day - m.sea < (k.seaGap == null ? 20 : k.seaGap)) return false;
    if (!U.chance(k.seaChance == null ? 0.06 : k.seaChance)) return false;
    m.sea = s.day;
    return FE.run('sea', FE.cast({ love: L, kids: FE.aboardKids(), aboard: true, mate: hasMate() }));
  };
  /** 술집: 여급과 함께 시간을 보낸다 (js/city/tavern.js 여급 메뉴) — 할 수 있나 */
  FE.canDate = function (mid) {
    var s = S(), st = s.maids && s.maids[mid], k = K(), d = mem().dates[mid];
    if (!st || (st.aff || 0) < (k.dateAff == null ? 40 : k.dateAff)) return { ok: false, why: '조금 더 가까워지면' };
    if (d != null && s.day - d < (k.dateGap == null ? 7 : k.dateGap)) return { ok: false, why: (k.dateGap || 7) - (s.day - d) + '일 뒤에' };
    return { ok: true };
  };
  FE.date = async function (c, maid) {
    var s = S();
    mem().dates[maid.id] = s.day;
    return FE.run('tavern', FE.cast({ city: c.id, love: FE.lover(maid), kids: [], mate: false }));
  };
  /** 술집: 배에 탄 아내와 한잔 */
  FE.canWifeDate = function () { var L = FE.aboardWife(), d = mem().dates._wife, s = S(); return !!L && (d == null || s.day - d >= (K().dateGap || 7)); };
  FE.wifeDate = async function (c) {
    var L = FE.aboardWife(); if (!L) return false;
    mem().dates._wife = S().day;
    return FE.run('tavern', FE.cast({ city: c.id, love: L, kids: FE.aboardKids(), aboard: true, mate: hasMate() }));
  };
  function awayDays() { var p = P(), m = mem(); var last = Math.max(p.homeSeen == null ? -1 : p.homeSeen, m.home == null ? -1 : m.home); return last < 0 ? 0 : S().day - last; }
  FE.awayDays = awayDays;
  /** 항구에 들어온 날 (js/scenes/city.js C.arrival) — 고향 부두의 마중, 배에 탄 아이와 빨래 */
  FE.arrive = async function (c) {
    var s = S(), p = P(), k = K(), m = mem();
    if (G.Tutorial && G.Tutorial.active && G.Tutorial.active()) return false;
    if (c.id === p.home && p.wife && !p.wifeAboard) {
      var away = awayDays();
      if (away >= (k.dockDays == null ? 120 : k.dockDays) && U.chance(k.dockChance == null ? 0.7 : k.dockChance)) {
        var hk = FE.homeKids();
        m.ret = s.day;
        return FE.play('dock_embrace', FE.cast({ at: 'dock', city: c.id, love: FE.mainWife(), kids: hk.kids, babies: hk.babies, mate: hasMate(), days: away }));
      }
    }
    var ak = FE.aboardKids();
    if (ak.length && c.port && (m.port == null || s.day - m.port >= (k.portGap == null ? 30 : k.portGap)) && U.chance(k.portChance == null ? 0.2 : k.portChance)) {
      m.port = s.day;
      return FE.run('port', FE.cast({ city: c.id, love: FE.aboardWife(), kids: ak, aboard: true, mate: hasMate() }));
    }
    return false;
  };
  /** 집 문을 연 때 (js/city/misc.js 자택 · js/systems/wives.js 둘째 부인의 집) — 오래 떠났다 돌아왔으면 귀환 장면.
      w: 둘째 부인 (없으면 본처의 자택) */
  FE.homeReturn = async function (w) {
    var s = S(), p = P(), k = K(), m = mem();
    FE.entry = { day: s.day, played: false };
    var L = w ? FE.wife2(w) : FE.mainWife(); if (!L) return false;
    var away = w ? (w.seen == null ? 0 : s.day - w.seen) : awayDays();
    if (w) w.seen = s.day;
    if (!w && m.ret != null && s.day - m.ret <= 5) { m.home = s.day; return false; }   // 부두에서 막 마중을 받았다
    if (!w) m.home = s.day;
    if (away < (k.returnDays == null ? 45 : k.returnDays)) return false;
    var hk = FE.homeKids(w);
    var ok = await FE.run('return', FE.cast({ love: L, kids: hk.kids, babies: hk.babies, days: away }));
    if (ok) { FE.entry.played = true; if (!w) m.ret = s.day; }
    return ok;
  };
  /** 아기 소식을 들은 날 (family.js·wives.js 의 「아기가 생겼어요」 대신) */
  FE.pregNews = async function (w) {
    var L = w ? FE.wife2(w) : FE.mainWife(); if (!L) return false;
    L.preg = true;
    var hk = FE.homeKids(w), ok = await FE.play('preg_news', FE.cast({ at: 'preg', love: L, kids: hk.kids, babies: hk.babies }));
    if (ok && FE.entry) FE.entry.played = true;
    return ok;
  };
  /** 해산 뒤 (family.js birthScene · firstMeet, wives.js) */
  FE.birth = async function (born, witness, w) {
    var L = w ? FE.wife2(w) : FE.mainWife(); if (!L) return false;
    var hk = FE.homeKids(w), others = hk.kids.filter(function (k) { return born.indexOf(k) < 0; });
    var ok = await FE.play(witness ? 'birth_hands' : 'birth_night', FE.cast({ at: 'birth', love: L, kids: others, babies: born, witness: witness }));
    if (ok && FE.entry) FE.entry.played = true;
    return ok;
  };
  /** 집에서의 하루 (자택·둘째 부인의 집에 들어가 다른 일이 끝난 뒤) — 임신 중이면 그 장면, 아니면 가족의 일상 */
  FE.homeDay = async function (w) {
    var s = S(), p = P(), k = K(), m = mem(), e = FE.entry;
    if (e && e.day === s.day && e.played) return false;
    var L = w ? FE.wife2(w) : FE.mainWife(); if (!L) return false;
    var hk = FE.homeKids(w), pr = w ? w.preg : p.preg;
    if (pr && pr.told) {
      pr.fe = pr.fe || {};
      var id = pr.due - s.day <= (k.cradleDays == null ? 60 : k.cradleDays) ? (pr.fe.cradle ? null : 'preg_cradle') : (pr.fe.touch ? null : 'preg_touch');
      if (id) { pr.fe[id === 'preg_cradle' ? 'cradle' : 'touch'] = 1; L.preg = true; var ok0 = await FE.play(id, FE.cast({ at: 'preg', love: L, kids: hk.kids, babies: hk.babies })); if (ok0 && e) e.played = true; return ok0; }
    }
    if (!hk.kids.length) return false;
    if (!w && p.homeEvt === s.day) return false;                  // 아이와 얽힌 다른 일(homelife.js)이 오늘 있었다
    if (m.home2 != null && s.day - m.home2 < (k.homeGap == null ? 25 : k.homeGap)) return false;
    if (!U.chance(k.homeChance == null ? 0.5 : k.homeChance)) return false;
    m.home2 = s.day;
    var ok = await FE.run('home', FE.cast({ love: L, kids: hk.kids, babies: hk.babies }));
    if (ok && e) e.played = true;
    return ok;
  };
  /** 혼례 (청혼을 받아들인 직후) — o: {id, second, city} */
  FE.wedding = async function (o) {
    var s = S(), c = G.CITY_DATA[o.city != null ? o.city : s.loc.city], L;
    if (o.second && G.Wives) L = FE.wife2(G.Wives.of(o.id)); else L = FE.mainWife();
    if (!L) return false;
    var A = G.Art, npc = L.maid
      ? { name: '술집 주인', portrait: A.withImg(A.npcSpec('wedkeeper' + (c ? c.id : 0), 'keeper', c ? G.Img.folkStyle(c) : 'ib', 'm'), G.Img.chain.npc('innkeeper', c)), lang: 3 }
      : { name: '갑판장', portrait: A.withImg(A.npcSpec('boatswain', 'sailor', 'ib', 'm'), G.Img.chain.npc('boatswain')), lang: 3 };
    return FE.play(L.maid ? 'wed_tavern' : 'wed_ship', FE.cast({ at: 'wed', city: c ? c.id : null, love: L, mate: hasMate(), second: !!o.second, npc: npc }));
  };
})(window.G = window.G || {});
