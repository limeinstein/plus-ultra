/* 이야기 모드 「해적여제 — 교수대 아래서 올린 깃발」 진행기 (G.JHook) — 자료·대사: js/data/jhook.js  2026-11-21 사용자 요청
   ■ 하는 일
     · 이야기 고르기 지도(js/ui/storyselect.js)에서 제시카를 고르면 → 1480년의 세상을 다달이 1545년 6월까지 넘긴다(경쟁자 발표·군주 교대·철새가 그 해에 맞게).
       그다음 고정된 제독(제시카 후크 · 잉글랜드 · 20세 · 여성)과 스미스·윌리엄, 핀네스 「제비」로 런던에서 프롤로그(1534년 · 교수대 · 탈출).
       프롤로그가 끝나면 템스 강을 빠져나가 바다에서 시작한다. 저장 상태에 s.jhook = { act, beats: {사건 id: 날 번호}, … }.
     · 사건(G.JHOOK.beats)은 도시에 들어설 때(js/scenes/city.js) · 바다의 하루 끝(js/scenes/sea.js)에 조건을 보고 하나씩.
       조건: where(도시 · 'england'), after, gap, date [해, 달], box(바다 자리), near(발견물 가까이), battles(해전 뒤).
       then: join · ship · items · title · fame · gold · crew · hints · battle · chain(곧바로 다음 사건) · pardon · base · finale.
     · 잉글랜드 사람 제독(nation 'EN'): R.nationName·R.nativeLang·R.isHomeNation 을 감싼다. 6막이 끝날 때까지 런던은 수배 중(잠입은 할 수 있다).
     · jhook: true 가 붙은 동료·후원자(킬리그루)는 이 모드가 아니면 나오지 않는다. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var JH = {}, D = G.JHOOK;
  G.JHook = JH;
  if (!D) return;

  function S() { return G.Game && G.Game.state; }
  function T() { var s = S(); return s && s.jhook ? s.jhook : null; }
  function today() { return U.dayIndex(S().date); }
  function inCity() { var s = S(); return G.Game.sceneName === 'city' && s && s.loc.mode === 'city'; }
  function curCity() { var s = S(); return s && s.loc.mode === 'city' ? G.CITY_DATA[s.loc.city] : null; }
  function aboard(id) { var s = S(); return !!(s && s.mates.some(function (m) { return m.id === id; })); }
  function own(c) { return R.cityOwner ? R.cityOwner(c) : c.nation; }
  JH.active = function () { return !!T(); };
  JH.released = function () { return true; };

  // ================================================================ 자료 등록
  if (G.SPONSORS && D.sponsorData && !G.SPONSOR[D.sponsorData.id]) { G.SPONSORS.push(D.sponsorData); G.SPONSOR[D.sponsorData.id] = D.sponsorData; }

  // ================================================================ 말하는 사람
  var MATE_OF = { S: 'jh_smith', W: 'jh_william', C: 'jh_conan', LU: 'jh_lucia', KO: 'jh_kofi', MR: 'jh_mariam', CL: 'jh_chenlei', JG: 'jh_jane' };
  function mateWho(id, name) {
    var d = G.MATE[id]; if (!d) return { name: name || id };
    return { name: name || d.name, rigId: 'mate:' + id, portrait: G.Scenes.mateSpec(id), half: G.Img.chain.mateHalf(id), lang: 3, special: true };
  }
  function me() { var p = S().player; return { name: p.name, rigId: 'player', portrait: p.portrait, half: G.Img.chain.heroHalf() }; }
  function npcFace(seed, role, style, g, file) {
    var A = G.Art, sp = { lang: 3, rigId: 'npc:' + seed };
    try {
      var spec = A.npcSpec(seed, role || 'native', style || 'ne', g || 'm'), base = A.portraitKeys ? A.portraitKeys(spec) || [] : [];
      sp.portrait = A.withImg(spec, (file ? [file] : []).concat(base));
      sp.half = (file ? [file + '_half'] : []).concat(G.Img.chain.halfOf ? G.Img.chain.halfOf(base) : []);
    } catch (e) { /* 그림이 없어도 말은 한다 */ }
    return sp;
  }
  function who(k) {
    try {
      if (k === 'P') return me();
      if (k === 'N' || !k) return {};
      if (MATE_OF[k]) return mateWho(MATE_OF[k]);
      if (k === 'GO') return G.MATE.omalley ? mateWho('omalley', '그레이스') : { name: '그레이스' };
      if (k === 'DR') return G.MATE.drake ? mateWho('drake', '드레이크') : { name: '드레이크' };
      if (k === 'KG') { var sp = G.SPONSOR[D.sponsorData.id]; var o = G.Sponsor && G.Sponsor.speaker ? G.Sponsor.speaker(sp) : {}; o.name = '킬리그루'; return o; }
      if (k === 'DH') { var f = G.Story && G.Story.father ? G.Story.father() : {}; f.name = '도현'; return f; }
      var n = (D.npcs || {})[k];
      if (n) {
        // 전용 그림 images/portraits/npc/jh_<키> 가 생기면 그것이 먼저
        var ownKey = 'portraits/npc/jh_' + k, has = G.Img && G.Img.has && G.Img.has(ownKey);
        if (!n[1] && !has) return { name: n[0] };
        var x = npcFace('jh_' + k, n[1] || 'native', n[2], n[3], has ? ownKey : n[4]); x.name = n[0]; return x;
      }
    } catch (e) { console.error(e); }
    return { name: k };
  }
  JH.who = who;
  function fmt(t) { var c = curCity(); return String(t).replace(/\{city\}/g, c ? c.name : '항구').replace(/\{name\}/g, S().player.given || S().player.name); }
  function speakerOf(l) { return Array.isArray(l) ? String(l[0]).replace(/^\?/, '') : l && l.ask ? (l.by || 'P') : null; }
  function partnerKey(lines, i) {
    var j, k;
    for (j = i - 1; j >= 0; j--) { k = speakerOf(lines[j]); if (!k || k === 'N') break; if (k !== 'P' && k !== 'Y') return k; }
    for (j = i + 1; j < lines.length; j++) { k = speakerOf(lines[j]); if (!k || k === 'N') break; if (k !== 'P' && k !== 'Y') return k; }
    return null;
  }
  function facing(k, lines, i) {
    var sp = who(k); if (k !== 'P') return sp;
    var pk = partnerKey(lines, i), pt = pk ? who(pk) : null;
    if (pt && pt.portrait) { sp.layout = 'duo'; sp.side = 'left'; sp.choiceSide = 'left'; sp.partner = pt; sp.emotion = 'neutral'; }
    return sp;
  }
  function keep(l) { if (!Array.isArray(l)) return true; var k = String(l[0]); if (k.charAt(0) !== '?') return true; var id = MATE_OF[k.slice(1)]; return !id || aboard(id); }
  async function play(lines) {
    lines = (lines || []).filter(keep).map(function (l) { return Array.isArray(l) ? [String(l[0]).replace(/^\?/, ''), l[1]] : l; });
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      if (Array.isArray(ln)) await UI.say(fmt(ln[1]), facing(ln[0], lines, i));
      else if (ln && ln.ask) {
        var v = await UI.ask(fmt(ln.ask), ln.opts.map(function (o, k) { return { label: o[0], value: k }; }), facing(ln.by || 'P', lines, i));
        var o = ln.opts[v == null ? 0 : v];
        var t = T(); if (t) (t.picks || (t.picks = [])).push(o[0]);
        if (Array.isArray(o[1])) await play(o[1]);
      }
    }
  }
  JH.play = play;

  // ================================================================ 시작
  /** 이야기 고르기에서 부른다 (skip = 확인 창 없이) */
  JH.begin = async function (skip) {
    await G.State.ready;
    if (!skip) {
      var v = await UI.window({ title: '이야기 — ' + D.title, icon: 'scroll', width: 700, html: '<div style="font-size:18px;line-height:1.7">' + U.esc(D.synopsis) + '</div>',
        buttons: [{ label: '그만둔다', value: null }, { label: '이야기를 시작한다', value: 'go', cls: 'navy' }] }).result;
      if (v !== 'go') return;
    }
    await G.Game.ensureGeo();
    await JH.start();
    await UI.fade(function () { G.Game.go('city', { cityId: D.home, jhook: true }); });
  };
  /** 1480년 5월부터 시작 해까지 세상을 다달이 넘긴다 — 경쟁자 발표·군주 교대·새 도시·철새가 그 해에 맞게 (하루씩 넘기면 너무 느리다) */
  JH.catchUp = async function (s, to, onStep) {
    var target = to.y * 12 + to.m, n = 0;
    while (s.date.y * 12 + s.date.m < target) {
      var py = s.date.y, nd = U.addDays({ y: s.date.y, m: s.date.m, d: 1 }, 32); nd.d = 1;
      s.date = nd; s.day += 30;
      try { G.World.newMonth(); if (s.date.y !== py) G.World.newYear(); if (G.Disc && G.Disc.rivals) G.Disc.rivals(); } catch (e) { console.error(e); }
      if (++n % 24 === 0) { if (onStep) onStep(s.date.y); await new Promise(function (r) { setTimeout(r, 0); }); }
    }
    s.date = { y: to.y, m: to.m, d: to.d || 1 };
  };
  /** 고정된 제독·동료로 새 상태를 만든다 (시험에서도 쓴다) */
  JH.start = async function (onStep) {
    var sk = {}; G.SKILLS.forEach(function (x) { sk[x.id] = 0; });
    sk.sword = 2; sk.nav = 2; sk.survey = 2; sk.ops = 1; sk.gun = 1;
    var lg = G.LANGS.map(function () { return 0; }); lg[3] = 3; lg[0] = 2; lg[1] = 1; lg[2] = 1;
    var s = G.State.newGame({ name: D.name, given: D.given, surname: D.surname, nation: 'PT', job: 'explorer', age: 20, birth: { m: D.born.m, d: D.born.d },
      st: { str: 64, int: 66, mar: 76, cha: 78 }, sk: sk, lg: lg, diff: 'normal', gold: D.gold, ships: [D.shipType] });
    var p = s.player;
    p.born = { y: 1525, m: D.born.m, d: D.born.d };     // 세월을 넘기는 동안 늙지 않게 먼저 적는다
    G.Game.state = s;
    await JH.catchUp(s, D.start, onStep);
    var home = G.CITY_DATA[D.home];
    p.nation = D.nation; p.home = D.home; p.g = D.g; p.gold = D.gold; p.bank = 0; p.fame = 0; p.notoriety = 0;
    s.loc = { mode: 'city', city: D.home, lon: home.lon, lat: home.lat, heading: Math.PI };
    s.fleet.ships[0].name = D.ship; s.fleet.crew = D.crew; s.fleet.fatigue = 0; s.fleet.discipline = 80;
    s.fleet.food = Math.ceil(R.dailyUse(s.fleet.crew, s.fleet) * 14); s.fleet.water = Math.ceil(R.dailyUse(s.fleet.crew, s.fleet) * 14);
    s.contract = null;
    try {
      var A = G.Art;
      p.portrait = A.withImg(A.portraitSpec({ seed: 'jh_jessica', culture: 'med', g: 'f', age: 'young', cloth: '#1e2c52', beard: 0 }), ['portraits/player/' + D.look]);
      p.look = D.look;
    } catch (e) { console.error(e); }
    s.mates = [];
    (D.mates0 || []).forEach(function (id) { s.mates.push({ id: id, role: (D.roles || {})[id] || 'none', joined: U.dateNum(s.date), loyal: 92, ev: 1, from: D.home }); });
    if (s.known.indexOf(D.home) < 0) s.known.push(D.home);
    s.log = [];
    s.jhook = { act: 1, beats: {}, flags: {}, started: U.dateNum(s.date), startDay: U.dayIndex(s.date) };
    G.State.log('1545년 6월, 런던 와핑. 제시카 후크의 이야기가 시작된다.');
    if (G.Frontier && G.Frontier.invalidate) G.Frontier.invalidate();
    return s;
  };
  /** 프롤로그(1534 · 교수대 · 탈출) — 끝나면 바다로 */
  JH.prologue = async function () {
    var t = T(); if (!t || t.prologue) return;
    var P = D.prologue;
    await play(P.pro); await play(P.a1); await play(P.a2);
    giveItems(['jh_coat', 'jh_compass']);
    t.prologue = 1; t.beats.start = today(); S().flags.prologue = true;
    UI.toast('아버지의 외투와 나침반을 받았다. 다음은 브리스틀 — 콘월의 킬리그루 저택.', 'scroll', 5200);
    await UI.fade(function () { G.Game.go('sea', { depart: D.home }); });
  };
  function giveItems(ids) {
    var p = S().player;
    (ids || []).forEach(function (id) { if (!p.items.some(function (it) { return it.id === id; })) { var it = D.items[id]; p.items.push({ id: id, kind: 'keepsake', name: it ? it[0] : id, desc: it ? it[1] : '', tale: true, jhook: true }); } });
  }
  JH.hint = function (id) {
    var s = S(), d = G.DISC[id]; if (!s || !d || s.hints[id]) return false;
    s.hints[id] = { src: 'jhook', d: U.dateNum(s.date) };
    if (G.Explore) G.Explore.ver++;
    UI.toast('단서를 얻었다: 「' + d.name + '」', 'scroll', 3600);
    return true;
  };

  // ================================================================ 사건
  function done(id) { var t = T(); return !!(t.beats && t.beats[id] != null); }
  function doneDay(id) { return T().beats[id]; }
  JH.done = function (id) { return !!T() && done(id); };
  function whereOk(b, c) {
    var w = b.where; if (w == null) return true; if (!c) return false;
    if (Array.isArray(w)) return w.indexOf(c.id) >= 0;
    if (w === 'england') return own(c) === '잉글랜드';
    return false;
  }
  function near(id) { var s = S(), d = G.DISC[id]; return !!(d && s.loc.mode === 'sea' && G.Geo.dist(s.loc.lon, s.loc.lat, d.lon, d.lat) < Math.max(1.2, d.r || 1)); }
  function ready(b, at, ctx) {
    var s = S(), t = T(); ctx = ctx || {};
    if (!t || !t.prologue || done(b.id) || b.at !== at) return false;
    if (b.after && !b.after.every(done)) return false;
    if (b.gap && b.after && b.after.length) { var last = Math.max.apply(null, b.after.map(doneDay)); if (today() - last < b.gap) return false; }
    if (b.date && s.date.y * 12 + s.date.m < b.date[0] * 12 + b.date[1]) return false;
    if (at === 'city' && !whereOk(b, ctx.city)) return false;
    if (b.box) { var l = s.loc, x = b.box; if (l.mode !== 'sea' || l.lon < x[0] || l.lon > x[1] || l.lat < x[2] || l.lat > x[3]) return false; }
    if (b.near && !near(b.near)) return false;
    if (b.battles && !((s.stats.battles || 0) > (t.battleMark || 0))) return false;
    return true;
  }
  function beatOf(id) { return (D.beats || []).filter(function (b) { return b.id === id; })[0]; }
  async function run(b, ctx) {
    var t = T();
    t.beats[b.id] = today();
    if (b.act) t.act = Math.max(t.act || 1, b.act);
    try { await play(b.lines); } catch (e) { console.error(e); }
    await JH.apply(b.then || {}, ctx || {});
    G.State.log('「' + D.short + '」 — ' + (b.title || TITLES[b.id] || '이야기가 한 걸음 나아갔다.'));
    if (G.Game.refreshHud) G.Game.refreshHud();
  }
  var TITLES = { a3_killigrew: '킬리그루의 식탁 · 코난 홈즈', a4_grace: '그레이스 오말리', a5_lucia2: '루시아가 합류했다', a5_kofi: '코피가 합류했다', a5_mariam: '마리암이 합류했다',
    a5_chenlei: '첸레이가 따라왔다', a5_henry: '헨리 왕이 죽었다', a5_rules: '해적여제의 규칙', a6_confess: '스미스의 고백 — 아틀란티스', a6_atlantis: '도현과 아버지의 문서',
    a7_palace: '화이트홀 — 소년 왕', a8_knight: '비밀 기사의 약속', a9_jane: '제인 그레이 구출', a10_hunt: '스미스의 반대', a10_tower: '탑의 엘리자베스', a11_york: '요크의 이별 · 보물지도',
    a12_island: '마당섬을 되찾았다', a12_letter: '엘리자베스의 편지', a13_council: '마당의 회의', a13_court: '여왕의 협력자', a14_drake: '드레이크', a14_battle: '무적함대', a14_after: '키를 돌렸다',
    a15_title: '작위를 돌려주다', a16_home: '돌아온 해적여제' };
  JH.apply = async function (th, ctx) {
    var s = S(), t = T(), c = ctx.city || curCity();
    if (th.join) th.join.forEach(function (id) {
      if (!G.MATE[id] || aboard(id)) return;
      var nm = G.Legend && G.Legend.join ? G.Legend.join(id, c) : null;
      if (!nm) { nm = { id: id, role: 'none', joined: U.dateNum(s.date), loyal: 88, ev: 1 }; s.mates.push(nm); UI.toast(G.MATE[id].name + ' 동료가 되었다.', 'people', 3600); }
      nm.loyal = Math.max(nm.loyal || 0, 88);
    });
    if (th.ship && s.fleet.ships.length < (G.MAX_SHIPS || 5) && G.SHIP[th.ship[0]]) {
      var sh = R.newShip(th.ship[0], th.ship[1]); sh.guns = { type: 'saker', n: 6 }; s.fleet.ships.push(sh);
      s.fleet.crew += 14; UI.toast('킬리그루가 카라벨 「' + th.ship[1] + '」호를 빌려주었다.', 'ship', 4200);
    }
    if (th.sponsor) { var rel = G.Sponsor.rel(D.sponsorData.id); rel.met = 1; rel.trust = Math.max(rel.trust || 0, 50); }
    if (th.items) giveItems(th.items);
    (th.hints || []).forEach(function (id) { JH.hint(id); });
    if (th.fame && G.Fame) for (var k in th.fame) G.Fame.add(k, th.fame[k]);
    if (th.gold) { s.player.gold = Math.max(0, s.player.gold + th.gold); }
    if (th.crew) { var cap = U.sum(s.fleet.ships, function (x) { return x.crewMax; }); s.fleet.crew = Math.min(cap, s.fleet.crew + th.crew); }
    if (th.title) { (t.titles || (t.titles = [])).push(th.title); UI.toast('바다의 사람들이 부르는 이름 — 「' + th.title + '」', 'crown', 4800); }
    if (th.pardon) { t.pardon = today(); s.player.notoriety = Math.round((s.player.notoriety || 0) * 0.3); }
    if (th.base) t.base = today();
    if (th.battle) await startBattle(th.battle);
    if (th.chain) { var nb = beatOf(th.chain); if (nb && !done(nb.id)) await run(nb, ctx); }
    if (th.finale) await finale();
  };
  async function startBattle(o) {
    var s = S(), t = T();
    t.battleMark = s.stats.battles || 0;
    var npc = { id: 'jh_' + (o.label || 'enemy'), kind: o.kind || 'pirate', n: o.n || 1, K: 1, zone: G.Ships && G.Ships.zone ? G.Ships.zone(s.loc.lon, s.loc.lat) : 'west', hostile: true, label: o.label, names: o.names, nation: o.nation };
    await UI.fade(function () { G.Game.go('battle', { npc: npc }); });
  }
  JH.arrive = async function (c, arg) {
    var t = T(); if (!t) return false;
    arg = arg || {};
    if (arg.jhook) { await JH.prologue(); return true; }
    if (arg.load || !t.prologue) return false;
    var b = (D.beats || []).filter(function (x) { return ready(x, 'city', { city: c }); })[0];
    if (!b) return false;
    await run(b, { city: c });
    if (inCity() && G.Game.cityHud) G.Game.cityHud();
    return true;
  };
  JH.seaPending = function () {
    var t = T(), s = S(); if (!t || !t.prologue || JH._busy || !s || s.loc.mode !== 'sea') return false;
    return (D.beats || []).some(function (b) { return ready(b, 'sea'); });
  };
  JH.atSea = async function () {
    if (JH._busy) return false; JH._busy = true;
    try { var b = (D.beats || []).filter(function (x) { return ready(x, 'sea'); })[0]; if (b) await run(b, {}); }
    catch (e) { console.error(e); } finally { JH._busy = false; }
    return true;
  };
  async function finale() {
    var t = T(); t.finale = today();
    var html = '<div style="font-size:19px;line-height:1.7"><b>「' + U.esc(D.title) + '」 — 끝</b><br>' + U.esc(D.ending) +
      '<div class="sep"></div><span class="muted">걸린 날: ' + U.num(today() - (t.startDay || today())) + '일 · 동료 ' + S().mates.length + '명 · 바다가 부른 이름: ' + U.esc((t.titles || []).join(' · ')) + '</span>' +
      '<div class="sep"></div>이야기는 여기서 한 매듭을 짓습니다. 항해는 그대로 이어집니다.</div>';
    await UI.window({ title: D.short, icon: 'laurel', width: 680, html: html, buttons: [{ label: '항해를 이어 간다', value: 'ok', cls: 'navy' }] }).result;
  }

  // ================================================================ 지금 할 일 · 수첩
  JH.guide = function () {
    var t = T(); if (!t || !t.prologue || t.finale) return '';
    var b = (D.beats || []).filter(function (x) { return x.guide && !done(x.id) && (!x.after || x.after.every(done)); })[0];
    if (!b) return '';
    var g = U.esc(b.guide);
    if (b.date && S().date.y * 12 + S().date.m < b.date[0] * 12 + b.date[1]) g += ' <span class="muted">(' + b.date[0] + '년 ' + b.date[1] + '월 무렵)</span>';
    return g;
  };
  JH.todo = function (c) {
    var t = T(); if (!t || !t.prologue) return [];
    var g = JH.guide(); if (!g) return [];
    return [{ icon: 'scroll', text: g + ' <span class="muted">(수첩 「해적여제」)</span>', onClick: function () { G.Info.open('jhook'); } }];
  };
  JH.page = function (el) {
    var t = T(); if (!t) { el.innerHTML = '<div class="muted">이야기 모드가 아니다.</div>'; return; }
    var acts = {}; (D.beats || []).forEach(function (b) { (acts[b.act] || (acts[b.act] = [])).push(b); });
    var rows = Object.keys(acts).map(function (a) {
      var bs = acts[a], n = bs.filter(function (b) { return done(b.id); }).length;
      return '<tr><td>' + a + '막</td><td>' + bs.map(function (b) { return (done(b.id) ? '<b>' : '<span class="muted">') + U.esc(G.N(TITLES[b.id] || b.id)) + (done(b.id) ? '</b>' : '</span>'); }).join(' · ') + '</td><td>' + (n === bs.length ? '<span class="tag good-text">끝</span>' : n ? '<span class="tag warn-text">' + n + '/' + bs.length + '</span>' : '') + '</td></tr>';
    }).join('');
    var mates = ['jh_smith', 'jh_william', 'jh_conan', 'jh_lucia', 'jh_kofi', 'jh_mariam', 'jh_chenlei', 'jh_jane'].map(function (id) { var m = G.MATE[id]; return m ? '<span class="tag' + (aboard(id) ? ' good-text' : '') + '" style="margin:2px">' + U.esc(m.name) + (aboard(id) ? '' : ' …') + '</span>' : ''; }).join('');
    var g = JH.guide();
    el.innerHTML = '<div class="grid2" style="grid-template-columns:300px 1fr;gap:24px"><div><div class="jh-face"></div>' +
      '<h4 style="margin:10px 0 4px">' + U.esc(D.title) + '</h4><div class="muted" style="font-size:14px;line-height:1.6">' + U.esc(D.synopsis) + '</div>' +
      '<div class="sep"></div><b>바다가 부른 이름</b> — ' + (t.titles && t.titles.length ? U.esc(t.titles.join(' · ')) : '<span class="muted">아직 없다</span>') +
      '<div class="sep"></div><b>함께 가는 사람</b><div>' + mates + '</div></div><div>' +
      (g ? '<div style="margin-bottom:10px"><b>지금 할 일</b> — ' + g + '</div>' : '') +
      '<table class="tbl"><tr><th></th><th>사건</th><th></th></tr>' + rows + '</table></div></div>';
    try { var box = el.querySelector('.jh-face'), cv = G.Img.make(G.Img.chain.heroHalf(), 300, 380, function () { var x = document.createElement('canvas'); x.width = 300; x.height = 380; return x; }, { fit: 'contain' }); box.appendChild(cv); } catch (e) { console.error(e); }
  };

  // ================================================================ 게임 함수 감싸기
  function wrap(obj, name, fn) { var orig = obj && obj[name]; if (typeof orig !== 'function') return; obj[name] = fn(orig); obj[name]._jhook = true; }
  function install() {
    if (G.Sponsor) wrap(G.Sponsor, 'present', function (orig) { return function (sp) { if (sp && sp.jhook && !T()) return false; return orig.apply(this, arguments); }; });
    if (G.Frontier) wrap(G.Frontier, 'mateReady', function (orig) { return function (m) { if (m && m.jhook && !T()) return false; return orig.apply(this, arguments); }; });
    if (R) {
      wrap(R, 'nationName', function (orig) { return function (n) { return n === 'EN' ? '잉글랜드' : orig.apply(this, arguments); }; });
      wrap(R, 'nativeLang', function (orig) { return function (n) { return n === 'EN' ? 3 : orig.apply(this, arguments); }; });
      wrap(R, 'isHomeNation', function (orig) { return function (c) { var s = S(); if (s && s.player.nation === 'EN') return own(c) === '잉글랜드'; return orig.apply(this, arguments); }; });
    }
    // 6막(아버지의 문서)을 얻기 전에는 런던이 수배 중이다 — 잠입은 할 수 있다
    var C = G.Scenes && G.Scenes.city;
    if (C) wrap(C, 'entryCheck', function (orig) {
      return function (c) {
        var r = orig.apply(this, arguments), t = T();
        if (!r && t && t.prologue && c && c.id === D.home && !(t.beats && t.beats.a6_atlantis != null))
          return { reason: 'wanted', text: '런던 항구에 「해적 로저 후크의 딸」 수배서가 붙어 있다. 들어가면 붙잡힌다!' };
        return r;
      };
    });
  }
  function boot() { try { install(); } catch (e) { console.error(e); } }
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', boot); else boot();
})(window.G = window.G || {});
