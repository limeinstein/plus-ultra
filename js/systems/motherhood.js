/* 여성 제독의 임신·출산 (G.Mother) — 2026-11-23 사용자 요청. 대사·조정값: js/data/motherhood.js (G.MOTHER · G.BALANCE.mother)
   ■ 항해 중 임신: 남편(js/systems/husbands.js)이 배에 있으면 tryGap일마다 conceive의 확률로 아이가 생긴다.
       제독이 momMax(50)세를 넘으면 생기지 않는다 · 아이 수는 예전 규칙 그대로(어머니마다 5 · 아들 5 · 딸 2 — wives.js W.sexesOpen) · 해산 뒤 gapDays는 쉰다.
       아버지는 남편 가운데 한 사람(pr.dad). tellDays 뒤에 알아차린다.
   ■ 해산 두 달 전(lieDays)부터 제독은 함장실을 남편 한 사람에게 맡기고 산실로 내려간다 (화면 틈에 — main.js loop → M.tick):
       기함의 진료실 → 식당 → 예배실 → (있으면) 창고. 하나도 없으면 방 하나를 헐어 창고로 바꾼다 (빈 선실부터 — 쓰는 방뿐이면 고르게 한다).
       고칠 방조차 없는 배면 함장실에 그대로.
       곁을 지키는 사람: 그 방의 의사 → 의학이 가장 높은 부하 → 여성 항해사 (산실에 제독과 둘).
   ■ 해산: 아이는 아버지의 성을 잇는다 (성을 알 수 없는 아버지면 제독의 성). 이름은 그 자리에서 짓는다.
       타고난 능력은 어머니(제독) 쪽 비중이 크다 (faW — family.js F.inherit). 해산 뒤 제독의 체력이 자리·곁을 지킨 사람에 따라 깎인다.
       아이는 고향 집에서 자란다 (예전의 자택·아이 사건이 그대로 이어진다). 제독이 집에 들르면 아이들과 가까워진다 (M.homeVisit).
   저장: player.pregSelf = {since, due, told, sex, dad, gen, lie:{kind, room, deputy, nurse, made}} · player.lastBirthSelf · player.trySelf
         state.motherTodo = {lie:1} | {birth:[아이 열쇠…], lie:{…}, dad} — 화면 틈에 보일 일. 옛 저장에는 없다. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var M = {};
  G.Mother = M;
  function S() { return G.Game && G.Game.state; }
  function P() { var s = S(); return s && s.player; }
  function K() { return (G.BALANCE && G.BALANCE.mother) || {}; }
  function FK() { return (G.BALANCE && G.BALANCE.family) || {}; }
  function D() { return G.MOTHER || {}; }
  function H() { return G.Husbands; }
  function F() { return G.Family; }
  function CB() { return G.Cabins; }
  function row(id) { var s = S(); return (s && s.mates || []).filter(function (m) { return m.id === id; })[0] || null; }
  function nm(id) { var d = id && G.MATE[id]; return d ? d.name : ''; }
  function fill(t, o) {
    return String(t).replace(/\{(\w+)\|([^}]+)\}/g, function (all, k, j) { return o[k] == null ? all : U.jx(String(o[k]), j); })
      .replace(/\{(\w+)\}/g, function (all, k) { return o[k] == null ? all : o[k]; });
  }
  function speaker(id, emotion) {
    var d = G.MATE[id], T = G.Scenes.city && G.Scenes.city.B && G.Scenes.city.B.tavern, who = T && T.mateSpeaker ? T.mateSpeaker(d) : { name: d.name, portrait: G.Scenes.mateSpec(id) };
    var o = {}, k; for (k in who) o[k] = who[k];
    o.lang = 3; o.li = null; o.emotion = emotion || 'warm';
    return o;
  }
  function tut() { return !!(G.Tutorial && G.Tutorial.active && G.Tutorial.active()); }
  function kidKey(k) { return k.sex + ':' + k.born.y + '-' + k.born.m + '-' + k.born.d + ':' + (S().player.kids.indexOf(k)); }

  // ---------------------------------------------------------------- 아버지
  /** 아버지(남편)의 성 — 알 수 없으면 null (제독의 성을 쓴다).
      「이름 성」꼴(두아르테 파셰쿠 페레이라)은 첫 낱말 뒤, 조선·중국·일본 이름은 앞 낱말(또는 띄어쓰지 않은 이름의 첫 글자)이 성 */
  M.dadSurname = function (id) {
    var d = id && G.MATE[id]; if (!d || !d.name) return null;
    var n = String(d.name).trim(), i = n.indexOf(' '), east = /^(kr|cn|jp)$/.test(d.style || '');
    if (east) return i > 0 ? n.slice(0, i) : (/^[가-힣]{2,4}$/.test(n) ? n.slice(0, 1) : null);
    return i > 0 ? n.slice(i + 1) : null;
  };
  function dadStats(id) { var d = G.MATE[id], t = (d && d.st) || [55, 55, 55, 55]; return { str: t[0], int: t[1], mar: t[2], cha: t[3] }; }
  function dadAge(id) { var d = G.MATE[id], s = S(); return d && d.bornY ? s.date.y - d.bornY : (R.age ? R.age() : 30) + 2; }
  /** 아이가 생긴 그때의 부모 — 아버지는 남편, 어머니는 제독 (F.inherit이 faW로 어머니 쪽을 더 닮게 한다) */
  M.genSnap = function (dad) {
    var p = P(), st = p.st || {}, mo = {};
    ['str', 'int', 'mar', 'cha'].forEach(function (k) { mo[k] = st[k] || 55; });
    return { fa: dadStats(dad), faAge: dadAge(dad), mo: mo, moAge: R.age ? R.age() : 30, mom: 'self', dad: dad, y: S().date.y, faW: (K().faW || [0.2, 0.45]).slice() };
  };

  // ---------------------------------------------------------------- 날마다 (js/systems/world.js)
  M.canConceive = function () {
    var s = S(), p = P(), k = K();
    if (!s || !p || !R.heroFemale(p) || p.pregSelf || tut() || s.regency) return false;
    if (!H() || !H().count()) return false;
    if ((R.age ? R.age() : 30) > (k.momMax || 50)) return false;
    if (G.Wives && G.Wives.canConceive && !G.Wives.canConceive('main')) return false;
    if (p.lastBirthSelf != null && s.day - p.lastBirthSelf < (FK().gapDays || 300)) return false;
    return true;
  };
  M.daily = function () {
    var s = S(), p = P(), k = K(), L = D(), out = [];
    if (!s || !p || !R.heroFemale(p)) return out;
    var pr = p.pregSelf;
    if (!pr) {
      if (!M.canConceive() || (p.trySelf != null && s.day - p.trySelf < (k.tryGap || 20))) return out;
      p.trySelf = s.day;
      if (!U.chance(k.conceive == null ? 0.3 : k.conceive)) return out;
      var dad = U.pick(H().list()).id, open = G.Wives && G.Wives.sexesOpen ? G.Wives.sexesOpen('main') : [];
      p.pregSelf = { since: s.day, due: s.day + (FK().gestation || 266), told: false, sex: open.length ? U.pick(open) : U.pick(['m', 'f']), dad: dad, gen: M.genSnap(dad) };
      return out;
    }
    if (!pr.told && s.day - pr.since >= (k.tellDays || 40)) {
      pr.told = true;
      (s.motherTodo || (s.motherTodo = {})).news = 1;
      var o = { dad: nm(pr.dad), m: Math.max(1, Math.round((pr.due - s.day) / 30)) };
      out.push({ icon: 'heart', text: fill(L.told, o) });
      G.State.log(fill(L.toldLog, o));
    }
    // 해산 두 달 전: 산실로 (화면 틈에 M.tick이 방을 정하고 알린다)
    if (!pr.lie && pr.due - s.day <= (k.lieDays || 60)) { pr.told = true; (s.motherTodo || (s.motherTodo = {})).lie = 1; }
    if (s.day >= pr.due) {
      if (!pr.lie) pr.lie = M.pickRoom(null);      // 화면 틈이 없었다면 여기서 조용히 정한다
      var c = FK(), sexes = G.Wives && G.Wives.birthSexes ? G.Wives.birthSexes('main', pr, U.chance(c.twins == null ? 0.03 : c.twins)) : [pr.sex || U.pick(['m', 'f'])], keys = [];
      sexes.forEach(function (sex) {
        var kid = { name: '', unnamed: true, sex: sex, born: { y: s.date.y, m: s.date.m, d: s.date.d }, sk: {}, lg: {}, st: null, edu: {} };
        F().bornStats(kid, pr.gen);
        if (G.KidVoy) kid.temper = G.KidVoy.rollTemper(kid, U.rand());
        kid.father = pr.dad; kid.fatherName = nm(pr.dad); kid.witness = true; kid.met = true; kid.bond = c.bondBorn || 60;
        F().registerBirth(kid); keys.push(kidKey(kid));
      });
      p.pregSelf = null; p.lastBirthSelf = s.day;
      s.motherTodo = { birth: keys, lie: pr.lie, dad: pr.dad };
    }
    return out;
  };

  // ---------------------------------------------------------------- 산실
  function roomName(kind) { return (D().roomName || {})[kind] || kind; }
  function bestDeputy(dad) {
    if (dad && H().is(dad)) return dad;
    var l = H().list().slice().sort(function (a, b) { var x = row(a.id), y = row(b.id); return ((y && y.loyal) || 0) - ((x && x.loyal) || 0); });
    if (l.length) return l[0].id;
    var first = (S().mates || []).filter(function (m) { return m.role === 'first'; })[0];
    return first ? first.id : null;
  }
  function bestNurse(i, kind, skip) {
    var s = S(), occ = i != null && CB() ? CB().occupant(i) : null;
    if (kind === 'sick' && occ && occ.id !== skip) return occ.id;
    var ms = (s.mates || []).filter(function (m) { return m.id !== skip && G.MATE[m.id] && !G.MATE[m.id].minor; });
    var med = ms.map(function (m) { return { m: m, lv: R.mateSkill ? R.mateSkill(m, 'med') : 0 }; }).filter(function (x) { return x.lv > 0; }).sort(function (a, b) { return b.lv - a.lv; });
    if (med.length) return med[0].m.id;
    var fem = ms.filter(function (m) { return G.MATE[m.id].g === 'f'; }).sort(function (a, b) { return (b.loyal || 0) - (a.loyal || 0); });
    return fem.length ? fem[0].id : null;
  }
  /** 산실을 정한다. demolish = 헐 방의 번호(고른 것) — 없으면 스스로 고른다. {kind, room, deputy, nurse, made, old} */
  M.pickRoom = function (demolish) {
    var p = P(), pr = p.pregSelf || {}, k = K(), rooms = CB() ? CB().rooms() : [], i = -1, kind = null, made = false, old = null;
    (k.rooms || ['sick', 'mess', 'chapel']).some(function (t) { var j = rooms.indexOf(t); if (j > 0) { i = j; kind = t; return true; } return false; });
    if (i < 0) {
      var st = rooms.indexOf('store');
      if (st > 0) { i = st; kind = 'store'; }
      else {
        var c = M.demolishable();
        var j = demolish != null && c.indexOf(demolish) >= 0 ? demolish : c[0];
        if (j != null) { old = G.CABIN[rooms[j]] ? G.CABIN[rooms[j]].name : rooms[j]; CB().remodel(j, 'store'); i = j; kind = 'store'; made = true; }
        else { i = null; kind = 'captain'; }
      }
    }
    var deputy = bestDeputy(pr.dad), nurse = bestNurse(i, kind, deputy);
    return { kind: kind, room: i, deputy: deputy, nurse: nurse, made: made, old: old };
  };
  /** 헐 수 있는 방 — 비어 있는 빈 선실 → 사람이 든 빈 선실 → 그 밖의 방(사람 없는 것 먼저). 갑판(0)은 뺀다 */
  M.demolishable = function () {
    var rooms = CB() ? CB().rooms() : [], out = [];
    for (var i = 1; i < rooms.length; i++) { var c = G.CABIN[rooms[i]]; if (c && !c.fixed) out.push(i); }
    function rank(i) { var hold = rooms[i] === 'hold', occ = !!CB().occupant(i); return (hold ? 0 : 2) + (occ ? 1 : 0); }
    return out.sort(function (a, b) { return rank(a) - rank(b) || a - b; });
  };
  /** 헐 방을 물어야 하나 — 산실로 쓸 방도 창고도 빈 선실도 없을 때 */
  function mustAsk() {
    var rooms = CB() ? CB().rooms() : [], k = K();
    if ((k.rooms || []).some(function (t) { return rooms.indexOf(t) > 0; }) || rooms.indexOf('store') > 0) return false;
    var c = M.demolishable();
    return c.length > 1 && rooms[c[0]] !== 'hold';
  }
  M.lieIn = async function () {
    var s = S(), p = P(), pr = p.pregSelf, L = D(); if (!pr || pr.lie) return;
    var pickI = null;
    if (mustAsk()) {
      var rooms = CB().rooms(), c = M.demolishable();
      pickI = await UI.choose(L.askRoom, c.map(function (i) { var occ = CB().occupant(i); return { label: G.CABIN[rooms[i]].name, right: occ ? nm(occ.id) + '의 방' : '비어 있음', value: i, icon: G.CABIN[rooms[i]].icon }; }), { width: 520, cancel: false });
    }
    var lie = pr.lie = M.pickRoom(pickI), o = { room: roomName(lie.kind), old: lie.old || '', deputy: nm(lie.deputy) || '부관', nurse: nm(lie.nurse) };
    var t = fill(L.lie, o);
    if (lie.made) t += '<br>' + fill(L.lieMade, o); else if (lie.kind === 'store') t += '<br>' + L.lieStore; else if (lie.kind === 'captain') t = L.lieCaptain;
    if (lie.deputy) t += '<br>' + fill(L.lieDeputy, o);
    t += '<br>' + (lie.nurse ? fill(L.lieNurse, o) : L.lieAlone);
    await UI.alert(t, L.lieTitle);
    if (lie.deputy) await UI.say(U.pick(L.deputySay), speaker(lie.deputy, 'warm'));
    if (lie.nurse) await UI.say(U.pick(G.MATE[lie.nurse].g === 'f' ? L.nurseSayF : L.nurseSayM), speaker(lie.nurse, 'warm'));
    if (G.FamEv) await G.FamEv.play('preg_cradle', G.FamEv.cast({ love: G.FamEv.husband(pr.dad), kids: [], babies: [] }));
    G.State.log(fill(L.lieLog, o));
  };
  /** 지금 산실에 들어 있나 (수첩·다른 사건이 본다) */
  M.lying = function () { var p = P(); return !!(p && p.pregSelf && p.pregSelf.lie); };

  // ---------------------------------------------------------------- 해산 (화면 틈에)
  async function nameKid(kid, dad) {
    var p = P(), L = D(), Fm = F(), dsur = M.dadSurname(dad), sur = dsur != null ? dsur : await Fm.askSurname();
    var taken = function (n) { return n === Fm.given(p) || p.kids.some(function (o) { return o !== kid && !o.unnamed && Fm.given(o) === n; }); };
    var pool = U.shuffle(Fm.names(kid.sex).filter(function (n) { return !taken(n); })).slice(0, 4);
    if (!pool.length) pool = Fm.names(kid.sex).slice(0, 4);
    var word = kid.sex === 'f' ? '딸' : '아들';
    var v = await UI.choose(fill(L.nameTitle, { kid: word }) + (sur ? fill(L.nameSur, { sur: sur }) : ''),
      pool.map(function (n) { return { label: Fm.fullName(n, sur), value: n, icon: 'heart' }; }).concat([{ label: '직접 짓는다', value: '_', icon: 'scroll' }]), { width: 460, cancel: false });
    if (v === '_' || !v) v = (await UI.prompt('아이의 이름' + (sur ? ' (성: ' + sur + ')' : ''), pool[0], 10)) || pool[0];
    kid.given = String(v).trim(); if (sur != null) kid.surname = sur; else delete kid.surname;
    kid.name = Fm.fullName(kid.given, sur || ''); kid.unnamed = false;
    return kid.name;
  }
  M.birth = async function (todo) {
    var s = S(), p = P(), k = K(), L = D(), lie = todo.lie || { kind: 'captain' }, dad = todo.dad;
    var kids = p.kids.filter(function (x) { return todo.birth.indexOf(kidKey(x)) >= 0; }); if (!kids.length) return;
    var pic = G.FamEv ? G.FamEv.showPic({ img: 'family-events/19_birth_newborn_hands', title: '어머니의 품에 안긴 첫 항해', noStand: true }) : null;
    try {
    var twins = kids.length > 1, what = twins ? '쌍둥이가' : kids[0].sex === 'f' ? '딸이' : '아들이', word = twins ? '쌍둥이' : kids[0].sex === 'f' ? '따님' : '아드님';
    // 제독의 몸
    var hk = k.hp || {}, med = lie.nurse && row(lie.nurse) && R.mateSkill ? R.mateSkill(row(lie.nurse), 'med') : 0;
    var loss = Math.max(hk.min || 5, (hk.base || 30) + (hk[lie.kind] || 0) - med * (hk.nurse || 5));
    p.hp = Math.max(1, (p.hp == null ? 100 : p.hp) - loss);
    if (s.fleet) s.fleet.fatigue = Math.max(0, (s.fleet.fatigue || 0) - (k.fatigue || 0));
    if (G.Audio && G.Audio.sfx) { try { G.Audio.sfx('children'); } catch (e) { /* 소리가 없어도 된다 */ } }
    await UI.alert(fill(L.birth, { room: roomName(lie.kind), what: what }) + kids.map(function (x) { var n = F().inheritNote(x); return n ? '<br><small class="muted">' + (twins ? (x.sex === 'f' ? '딸' : '아들') + ': ' : '') + U.esc(n) + '</small>' : ''; }).join('') +
      '<br><small class="muted">' + fill(L.hp, { n: loss }) + '</small>', L.birthTitle);
    if (lie.nurse && row(lie.nurse)) await UI.say(fill(U.pick(G.MATE[lie.nurse].g === 'f' ? L.birthNurseF : L.birthNurseM), { kid: word }), speaker(lie.nurse, 'happy'));
    if (dad && row(dad)) await UI.say(U.pick(L.birthDad), speaker(dad, 'happy'));
    for (var i = 0; i < kids.length; i++) {
      var full = await nameKid(kids[i], dad);
      G.State.log(fill(L.birthLog, { name: full, dad: nm(dad) || '?' }));
    }
    var hc = G.CITY_DATA[R.seat ? R.seat() : p.home];
    var atSea = G.SeaNest && G.SeaNest.afterBirth ? await G.SeaNest.afterBirth(kids) : false;   // 내 배에서 직접 키운다 · 고향 집 (js/systems/seanest.js)
    if (!atSea) await UI.alert(fill(L.after, { home: hc ? hc.name : '' }), L.birthTitle);
    if (G.Game.refreshHud) G.Game.refreshHud();
    } finally { if (pic) await pic.stop(); }
  };

  function ready() {
    var s = S(), g = G.Game;
    if (!s || !s.player || UI.busy() || (M.running && M.running === s)) return false;
    if (['city', 'sea', 'land'].indexOf(g.sceneName) < 0) return false;
    if (tut()) return false;
    var rt = g.scene && g.scene.runtime ? g.scene.runtime() : null;
    if (rt && rt.busy) return false;
    if (g.sceneName === 'city' && G.Scenes.city.busy && G.Scenes.city.busy()) return false;
    return true;
  }
  /** 날마다 화면 틈에 (main.js loop) — 산실로 옮기기 · 해산 */
  M.tick = function () {
    var s = S(); if (!s || !s.motherTodo) return;
    var T = s.motherTodo; if (!T.news && !T.lie && !T.birth) { delete s.motherTodo; return; }
    if (!ready()) return;
    M.running = s;
    (async function () {
      try {
        if (T.news && !T.birth && G.FamEv) { delete T.news; await G.FamEv.pregNews(); }
        if (T.birth) { delete s.motherTodo; await M.birth(T); }
        else { delete s.motherTodo; if (T.lie) await M.lieIn(); }
      } catch (e) { console.error(e); }
      if (M.running === s) M.running = null;
    })();
  };

  // ---------------------------------------------------------------- 자택 · 수첩
  /** 집에 들르면 아이들과 가까워진다 (보름에 한 번 — 남성 제독의 F.homeVisit과 같은 값) */
  M.homeVisit = function () {
    var s = S(), p = P(), c = FK(); if (!p || !R.heroFemale(p) || p.wife) return;
    if (p.lastHomeBond != null && s.day - p.lastHomeBond < 15) return;
    p.lastHomeBond = s.day;
    (p.kids || []).forEach(function (k) { if (!k.unnamed && !k.aboard && !k.nest && k.house == null && !k.married && !k.away) F().addBond(k, c.bondVisit || 3); });
  };
  /** 수첩 「배우자」 칸 뒤에 붙는 글 */
  M.info = function () {
    var p = P(), s = S(), pr = p && p.pregSelf, L = D(); if (!pr || !pr.told) return '';
    var t = fill(L.info, { m: Math.max(1, Math.round((pr.due - s.day) / 30)) });
    if (pr.lie) t += fill(L.infoLie, { room: roomName(pr.lie.kind), deputy: nm(pr.lie.deputy) || '부관' });
    return ' <small class="muted">(' + t + ')</small>';
  };
})(window.G = window.G || {});
