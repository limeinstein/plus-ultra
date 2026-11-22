/* 이야기 모드 「황금의 바다 — 세계를 잇는 상인」 진행기 (G.GoldSea) — 자료·대사: js/data/gold.js  2026-11-22 사용자 요청
   ■ 하는 일 (틀은 js/systems/jhook.js 와 같다)
     · 이야기 고르기 지도에서 아드리안을 고르면 → 1480년의 세상을 다달이 1598년 4월까지 넘긴다. 고정된 제독(아드리안 판데르펠더 · 네덜란드 · 22세)과
       엘리너르·마리커·피터르, 플류트 「새벽별」로 암스테르담에서 프롤로그(1584년의 창가 · 1598년의 빚). 끝나면 바다에서 시작. 저장 s.gold = { act, beats, flags, … }.
     · 사건(G.GOLD.beats) 62개 — 16장의 큰 줄기 사이사이에 시간을 보내는 작은 이야기(i_*)가 끼어 있어 기다리는 동안에도 할 일이 있다.
       조건: where(도시 번호 · 'away' 고향 밖 · 'eu' 'af' 'as'/'asia' 'am' 대륙 · 'spain' 에스파냐 땅 · 'indian' 인도양) · after · gap · date · box · near · battles
             · deal(그 대륙의 「대단한 거래」를 이뤘나 — js/systems/tradeking.js) · king(교역왕 업적).
       then: join · leave(동료가 떠난다) · ship · items · title · fame · gold · loseGold(금화의 비율을 잃는다) · crew · discipline · notoriety · hints · flag
             · company(연합 동인도 회사에 출자하고 사원이 된다 — G.Company) · sponsor · battle · chain · finale.
     · 네덜란드 사람 제독(nation 'NL'): R.nationName·R.nativeLang·R.isHomeNation 을 감싼다.
     · 수첩 「황금의 바다」: 사건 진행 · 순자산(금화·은행·배·주식)과 「세계에서 가장 부유한 사람」 목표(G.GOLD.worthGoal) · 대단한 거래 네 대륙.
     · gold: true 가 붙은 동료·후원자(야코프 포스)는 이 모드가 아니면 나오지 않는다. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var JH = {}, D = G.GOLD;
  G.GoldSea = JH;
  if (!D) return;

  function S() { return G.Game && G.Game.state; }
  function T() { var s = S(); return s && s.gold ? s.gold : null; }
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
  var MATE_OF = { E: 'gs_eleonore', M: 'gs_marieke', B: 'gs_bram', L: 'gs_lucas', YU: 'gs_yusuf', JN: 'gs_jin', KW: 'gs_kwame', PT: 'gs_pieter' };
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
      if (k === 'ED') return G.MATE.edmund ? mateWho('edmund', '에드먼드 헤일') : { name: '에드먼드 헤일' };
      if (k === 'DH') { var f = G.Story && G.Story.father ? G.Story.father() : {}; f.name = '도현'; return f; }
      var n = (D.npcs || {})[k];
      if (n) {
        // 전용 그림 images/portraits/npc/gs_<키> 가 생기면 그것이 먼저
        var ownKey = 'portraits/npc/gs_' + k, has = G.Img && G.Img.has && G.Img.has(ownKey);
        if (!n[1] && !has) return { name: n[0] };
        var x = npcFace('gs_' + k, n[1] || 'native', n[2], n[3], has ? ownKey : n[4]); x.name = n[0]; return x;
      }
    } catch (e) { console.error(e); }
    return { name: k };
  }
  JH.who = who;
  function fmt(t) { var c = curCity(); return String(t).replace(/\{city\}/g, c ? c.name : '항구').replace(/\{name\}/g, S().player.given || S().player.name); }
  function speakerOf(l) { return Array.isArray(l) ? String(l[0]).replace(/^\?/, '') : l && l.ask ? (l.by || 'P') : null; }
  function partnerKey(lines, i) {
    var j, k;
    for (j = i - 1; j >= 0; j--) { k = speakerOf(lines[j]); if (!k || k === 'N') break; if (k !== 'P' && k !== 'YA') return k; }
    for (j = i + 1; j < lines.length; j++) { k = speakerOf(lines[j]); if (!k || k === 'N') break; if (k !== 'P' && k !== 'YA') return k; }
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
    await UI.fade(function () { G.Game.go('city', { cityId: D.home, gold: true }); });
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
    sk.acct = 2; sk.speech = 2; sk.nav = 1; sk.ops = 1;
    var lg = G.LANGS.map(function () { return 0; }); lg[3] = 3; lg[0] = 1; lg[1] = 1; lg[2] = 1;
    var s = G.State.newGame({ name: D.name, given: D.given, surname: D.surname, nation: 'PT', job: 'merchant', age: 22, birth: { m: D.born.m, d: D.born.d },
      st: { str: 58, int: 82, mar: 52, cha: 86 }, sk: sk, lg: lg, diff: 'normal', gold: D.gold, ships: [D.shipType] });
    var p = s.player;
    p.born = { y: D.born.y, m: D.born.m, d: D.born.d };     // 세월을 넘기는 동안 늙지 않게 먼저 적는다
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
      p.portrait = A.withImg(A.portraitSpec({ seed: 'gs_adrian', culture: 'north', g: 'm', age: 'young', cloth: '#1c2a52', beard: 0 }), ['portraits/player/' + D.look]);
      p.look = D.look;
    } catch (e) { console.error(e); }
    s.mates = [];
    (D.mates0 || []).forEach(function (id) { s.mates.push({ id: id, role: (D.roles || {})[id] || 'none', joined: U.dateNum(s.date), loyal: 92, ev: 1, from: D.home }); });
    if (s.known.indexOf(D.home) < 0) s.known.push(D.home);
    s.log = [];
    s.gold = { act: 1, beats: {}, flags: {}, started: U.dateNum(s.date), startDay: U.dayIndex(s.date) };
    G.State.log('1598년 4월, 암스테르담. 아드리안 판데르펠더의 이야기가 시작된다.');
    if (G.Frontier && G.Frontier.invalidate) G.Frontier.invalidate();
    return s;
  };
  /** 프롤로그(1534 · 교수대 · 탈출) — 끝나면 바다로 */
  JH.prologue = async function () {
    var t = T(); if (!t || t.prologue) return;
    var P = D.prologue;
    await play(P.pro);
    t.prologue = 1; t.beats.start = today(); S().flags.prologue = true;
    UI.toast('「새벽별」이 에이 만을 나선다. 어느 항구든 — 첫 짐을 판다.', 'scroll', 5200);
    await UI.fade(function () { G.Game.go('sea', { depart: D.home }); });
  };
  function giveItems(ids) {
    var p = S().player;
    (ids || []).forEach(function (id) { if (!p.items.some(function (it) { return it.id === id; })) { var it = D.items[id]; p.items.push({ id: id, kind: 'keepsake', name: it ? it[0] : id, desc: it ? it[1] : '', tale: true, gold: true }); } });
  }
  JH.hint = function (id) {
    var s = S(), d = G.DISC[id]; if (!s || !d || s.hints[id]) return false;
    s.hints[id] = { src: 'gold', d: U.dateNum(s.date) };
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
    if (w === 'away') return c.id !== D.home;
    if (w === 'spain') return own(c) === '에스파냐';
    if (w === 'indian') return c.lon > 36 && c.lon < 100 && c.lat > -30 && c.lat < 27;
    var cont = G.TradeKing && G.TradeKing.continent ? G.TradeKing.continent(c) : null;
    if (w === 'asia') return cont === 'as';
    if (w === 'eu' || w === 'af' || w === 'as' || w === 'am') return cont === w;
    return false;
  }
  function near(id) { var s = S(), d = G.DISC[id]; return !!(d && s.loc.mode === 'sea' && G.Geo.dist(s.loc.lon, s.loc.lat, d.lon, d.lat) < Math.max(1.2, d.r || 1)); }
  function ready(b, at, ctx) {
    var s = S(), t = T(); ctx = ctx || {};
    if (!t || !t.prologue || done(b.id) || b.at !== at) return false;
    if (b.after && !b.after.every(done)) return false;
    if (b.gap && b.after && b.after.length) { var last = Math.max.apply(null, b.after.map(doneDay)); if (today() - last < b.gap) return false; }
    if (b.date && s.date.y * 12 + s.date.m < b.date[0] * 12 + b.date[1]) return false;
    if (b.worthGoal && JH.worth() < D.worthGoal) return false;
    if (at === 'city' && !whereOk(b, ctx.city)) return false;
    if (b.box) { var l = s.loc, x = b.box; if (l.mode !== 'sea' || l.lon < x[0] || l.lon > x[1] || l.lat < x[2] || l.lat > x[3]) return false; }
    if (b.near && !near(b.near)) return false;
    if (b.battles && !((s.stats.battles || 0) > (t.battleMark || 0))) return false;
    if (b.deal && !(s.bigDeal && s.bigDeal[b.deal])) return false;
    if (b.king && !(G.Achieve && G.Achieve.done && G.Achieve.done('tradeking'))) return false;
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
  var TITLES = D.titles || {};
  JH.apply = async function (th, ctx) {
    var s = S(), t = T(), c = ctx.city || curCity();
    if (th.join) th.join.forEach(function (id) {
      if (!G.MATE[id] || aboard(id)) return;
      delete s.flags['gone_' + id];
      var nm = G.Legend && G.Legend.join ? G.Legend.join(id, c) : null;
      if (!nm) { nm = { id: id, role: 'none', joined: U.dateNum(s.date), loyal: 88, ev: 1 }; s.mates.push(nm); UI.toast(G.MATE[id].name + ' 동료가 되었다.', 'people', 3600); }
      nm.loyal = Math.max(nm.loyal || 0, 88);
    });
    if (th.leave) th.leave.forEach(function (id) {   // 동료가 떠난다 (납치된 엘리너르 · 달아난 피터르)
      var i = s.mates.findIndex(function (m) { return m.id === id; }); if (i < 0) return;
      var m = s.mates[i]; s.mates.splice(i, 1); s.flags['gone_' + id] = 1;
      if (m.ship && R.tidyCaptains) R.tidyCaptains();
      if (G.CrewAuto) G.CrewAuto.refresh();
      UI.toast(G.MATE[id].name + U.jx(G.MATE[id].name, '이/가') + ' 배를 떠났다.', 'people', 4200);
    });
    if (th.ship && s.fleet.ships.length < (G.MAX_SHIPS || 5) && G.SHIP[th.ship[0]]) {
      var sh = R.newShip(th.ship[0], th.ship[1]); sh.guns = { type: 'saker', n: 6 }; s.fleet.ships.push(sh);
      s.fleet.crew += 16; UI.toast('선단에 ' + G.SHIP[th.ship[0]].name + ' 「' + th.ship[1] + '」호가 더해졌다.', 'ship', 4200);
    }
    if (th.sponsor) { var rel = G.Sponsor.rel(D.sponsorData.id); rel.met = 1; rel.trust = Math.max(rel.trust || 0, 50); }
    if (th.company) joinCompany(th.company);
    if (th.items) giveItems(th.items);
    (th.hints || []).forEach(function (id) { JH.hint(id); });
    if (th.fame && G.Fame) for (var k in th.fame) G.Fame.add(k, th.fame[k]);
    if (th.gold) { s.player.gold = Math.max(0, s.player.gold + th.gold); if (th.gold > 0) UI.toast('금화 ' + U.num(th.gold) + '닢이 들어왔다.', 'coin', 3200); }
    if (th.loseGold) { var lost = Math.round(s.player.gold * th.loseGold); s.player.gold -= lost; t.lost = (t.lost || 0) + lost; UI.toast('금화 ' + U.num(lost) + '닢이 사라졌다.', 'coin', 4200); }
    if (th.crew) { var cap = U.sum(s.fleet.ships, function (x) { return x.crewMax; }); s.fleet.crew = Math.min(cap, s.fleet.crew + th.crew); }
    if (th.discipline) s.fleet.discipline = Math.max(0, Math.min(100, (s.fleet.discipline || 50) + th.discipline));
    if (th.notoriety) s.player.notoriety = Math.max(0, (s.player.notoriety || 0) + th.notoriety);
    if (th.flag) (t.flags || (t.flags = {}))[th.flag] = today();
    if (th.title) { (t.titles || (t.titles = [])).push(th.title); UI.toast('항구의 사람들이 부르는 이름 — 「' + th.title + '」', 'crown', 4800); }
    if (th.battle) await startBattle(th.battle);
    if (th.chain) { var nb = beatOf(th.chain); if (nb && !done(nb.id)) await run(nb, ctx); }
    if (th.finale) await finale();
  };
  /** 연합 동인도 회사에 출자하고 사원이 된다 (4장) — 청약 기간(1602.3.20~8.31)이면 액면, 아니면 그날 시세. 입회 조건이 모자라도 이야기의 힘으로 사원이 된다 */
  function joinCompany(o) {
    var s = S(), CO = G.Company, co = G.COMPANY && G.COMPANY[o.id]; if (!CO || !co) return;
    var gold = Math.max(0, Math.min(o.gold || 0, Math.floor(s.player.gold * 0.8)));
    var dn = U.dateNum(s.date), founding = dn >= co.from && dn <= 16020831;
    if (gold > 0) { s.player.gold -= gold; CO.subscribe(co, gold, founding); }
    if (!CO.isMember(co)) {
      if (CO.joinBlock(co)) { var b = s.company; b.member = co.id; b.rank = 1; b.merit = b.merit || 0; b.joined = s.day; b.chain = null; G.State.log(co.name + U.jx(co.name, '에') + ' 입회했다 (야코프 포스의 추천).'); }
      else CO.join(co);
    }
    // 동인도 회사의 탄생 사건(js/systems/eastindia.js)이 같은 청약을 또 묻지 않게
    if (!s.eindia) { s.eindia = { told: {} }; var AT = { eic: 16001231, voc: 16020320, swally: 16121130, batavia: 16190530, banda: 16210508, amboyna: 16230309 }; for (var k in AT) if (dn > AT[k]) s.eindia.told[k] = 1; }
    s.eindia.voc = gold || -1; s.eindia.vocMet = 1; s.eindia.told.voc = 1;
    UI.toast(co.name + '의 사원이 되었다 — 주식 ' + ((s.company.shares || {})[co.id] || 0) + '주.', 'seal', 5200);
  }
  async function startBattle(o) {
    var s = S(), t = T();
    t.battleMark = s.stats.battles || 0;
    var npc = { id: 'gs_' + (o.label || 'enemy'), kind: o.kind || 'pirate', n: o.n || 1, K: 1, zone: G.Ships && G.Ships.zone ? G.Ships.zone(s.loc.lon, s.loc.lat) : 'west', hostile: true, label: o.label, names: o.names, nation: o.nation };
    await UI.fade(function () { G.Game.go('battle', { npc: npc }); });
  }
  JH.arrive = async function (c, arg) {
    var t = T(); if (!t) return false;
    arg = arg || {};
    if (arg.gold) { await JH.prologue(); return true; }
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
  /** 지금 할 일 — 큰 줄기(deal 아닌 사건)가 먼저, 대단한 거래는 따로 한 줄 */
  function openBeats() { return (D.beats || []).filter(function (x) { return x.guide && !done(x.id) && (!x.after || x.after.every(done)); }); }
  function guideText(b) {
    var g = U.esc(b.guide);
    if (b.worthGoal && JH.worth() < D.worthGoal) g += ' <span class="muted">(' + U.num(JH.worth()) + ' / ' + U.num(D.worthGoal) + '닢)</span>';
    if (b.date && S().date.y * 12 + S().date.m < b.date[0] * 12 + b.date[1]) g += ' <span class="muted">(' + b.date[0] + '년 ' + b.date[1] + '월 무렵)</span>';
    return g;
  }
  JH.guide = function () {
    var t = T(); if (!t || !t.prologue || t.finale) return '';
    var b = openBeats().filter(function (x) { return !x.deal; })[0];
    return b ? guideText(b) : '';
  };
  JH.dealGuide = function () { var t = T(); if (!t || !t.prologue) return ''; var b = openBeats().filter(function (x) { return x.deal; })[0]; return b ? guideText(b) : ''; };
  JH.todo = function (c) {
    var t = T(); if (!t || !t.prologue) return [];
    var out = [], g = JH.guide(), d = JH.dealGuide();
    if (g) out.push({ icon: 'scroll', text: g + ' <span class="muted">(수첩 「황금의 바다」)</span>', onClick: function () { G.Info.open('gold'); } });
    if (d) out.push({ icon: 'coin', text: d, onClick: function () { G.Info.open('gold'); } });
    return out;
  };
  /** 순자산 — 금화 · 은행 · 배(값의 6할) · 회사 주식 */
  JH.worth = function () {
    var s = S(); if (!s) return 0;
    var ships = U.sum(s.fleet.ships, function (x) { var d = G.SHIP[x.type]; return d ? Math.round(d.price * 0.6 * (x.hp && x.hpMax ? x.hp / x.hpMax : 1)) : 0; });
    var shares = 0; try { if (G.Company && G.Company.holdings) shares = U.sum(G.Company.holdings(), function (h) { return h.value; }); } catch (e) { /* */ }
    return Math.round((s.player.gold || 0) + (s.player.bank || 0) + ships + shares);
  };
  JH.page = function (el) {
    var t = T(); if (!t) { el.innerHTML = '<div class="muted">이야기 모드가 아니다.</div>'; return; }
    var acts = {}; (D.beats || []).forEach(function (b) { (acts[b.act] || (acts[b.act] = [])).push(b); });
    var rows = Object.keys(acts).sort(function (a, b) { return a - b; }).map(function (a) {
      var bs = acts[a], n = bs.filter(function (b) { return done(b.id); }).length;
      return '<tr><td>' + a + '장</td><td>' + bs.map(function (b) { return (done(b.id) ? '<b>' : '<span class="muted">') + U.esc(TITLES[b.id] || b.id) + (done(b.id) ? '</b>' : '</span>'); }).join(' · ') + '</td><td>' + (n === bs.length ? '<span class="tag good-text">끝</span>' : n ? '<span class="tag warn-text">' + n + '/' + bs.length + '</span>' : '') + '</td></tr>';
    }).join('');
    var mates = ['gs_eleonore', 'gs_marieke', 'gs_bram', 'gs_lucas', 'gs_yusuf', 'gs_jin', 'gs_kwame', 'gs_pieter'].map(function (id) { var m = G.MATE[id]; return m ? '<span class="tag' + (aboard(id) ? ' good-text' : '') + '" style="margin:2px">' + U.esc(m.name) + (aboard(id) ? '' : ' …') + '</span>' : ''; }).join('');
    var w = JH.worth(), goal = D.worthGoal || 3000000, pct = Math.max(0, Math.min(100, Math.round(w / goal * 100)));
    var deals = [['eu', '유럽'], ['af', '아프리카'], ['as', '아시아'], ['am', '아메리카']].map(function (k) { var ok = S().bigDeal && S().bigDeal[k[0]]; return '<span class="tag' + (ok ? ' good-text' : '') + '" style="margin:2px">' + k[1] + (ok ? ' ✓' : '') + '</span>'; }).join('');
    var g = JH.guide(), d = JH.dealGuide();
    el.innerHTML = '<div class="grid2" style="grid-template-columns:300px 1fr;gap:24px"><div><div class="gs-face"></div>' +
      '<h4 style="margin:10px 0 4px">' + U.esc(D.title) + '</h4><div class="muted" style="font-size:14px;line-height:1.6">' + U.esc(D.synopsis) + '</div>' +
      '<div class="sep"></div><b>항구가 부르는 이름</b> — ' + (t.titles && t.titles.length ? U.esc(t.titles.join(' · ')) : '<span class="muted">아직 없다</span>') +
      '<div class="sep"></div><b>함께 가는 사람</b><div>' + mates + '</div></div><div>' +
      '<div style="margin-bottom:8px"><b>순자산</b> 금화 ' + U.num(w) + '닢 <span class="muted">/ 세계에서 가장 부유한 사람 ' + U.num(goal) + '닢</span>' +
      '<div style="height:10px;background:#d8c7a0;border:1px solid #9b7a3c;border-radius:5px;margin-top:4px;overflow:hidden"><div style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,#c9a035,#e8c860)"></div></div></div>' +
      '<div style="margin-bottom:10px"><b>대단한 거래</b> ' + deals + ' <span class="muted">— 한 번의 매각으로 이익 백만 닢 · 네 대륙이면 교역왕</span></div>' +
      (g ? '<div style="margin-bottom:6px"><b>지금 할 일</b> — ' + g + '</div>' : '') + (d ? '<div style="margin-bottom:10px" class="muted">' + d + '</div>' : '') +
      '<table class="tbl"><tr><th></th><th>사건</th><th></th></tr>' + rows + '</table></div></div>';
    try { var box = el.querySelector('.gs-face'), cv = G.Img.make(G.Img.chain.heroHalf(), 300, 380, function () { var x = document.createElement('canvas'); x.width = 300; x.height = 380; return x; }, { fit: 'contain' }); box.appendChild(cv); } catch (e) { console.error(e); }
  };

  // ================================================================ 게임 함수 감싸기
  function wrap(obj, name, fn) { var orig = obj && obj[name]; if (typeof orig !== 'function') return; obj[name] = fn(orig); obj[name]._gold = true; }
  function install() {
    if (G.Sponsor) wrap(G.Sponsor, 'present', function (orig) { return function (sp) { if (sp && sp.gold && !T()) return false; return orig.apply(this, arguments); }; });
    if (G.Frontier) wrap(G.Frontier, 'mateReady', function (orig) { return function (m) { if (m && m.gold && !T()) return false; return orig.apply(this, arguments); }; });
    if (R) {
      wrap(R, 'nationName', function (orig) { return function (n) { return n === 'NL' ? '네덜란드' : orig.apply(this, arguments); }; });
      wrap(R, 'nativeLang', function (orig) { return function (n) { return n === 'NL' ? 3 : orig.apply(this, arguments); }; });
      wrap(R, 'isHomeNation', function (orig) { return function (c) { var s = S(); if (s && s.player.nation === 'NL') return own(c) === '네덜란드'; return orig.apply(this, arguments); }; });
    }
  }
  function boot() { try { install(); } catch (e) { console.error(e); } }
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', boot); else boot();
})(window.G = window.G || {});
