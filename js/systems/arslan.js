/* 이야기 모드 「돌아오는 배의 값」 — 아르슬란 젬오을루 편 진행기 (G.Arslan) — 자료·대사: js/data/arslan.js  2026-11-28 사용자 요청
   ■ 하는 일 (틀은 js/systems/gold.js · jhook.js 와 같다)
     · 이야기 고르기 지도에서 아르슬란을 고르면 → 1480년의 세상을 다달이 1494년 4월까지 넘긴다. 고정된 제독(아르슬란 젬오을루 · 오스만 · 18세)으로
       이스탄불 거리에서 시작한다. 저장 s.arslan = { act, beats, flags, pro, fleet: {isl, por, ita}, wed: {동료: 날}, cool: {사건: 날} }.
     · 프롤로그는 이스탄불을 걸으며 네 장면 — 거리(시장의 해도) → 조선소(배·피루제·아일린) → 도서관(귈리자르) → 항구(〈달무리〉).
       장면은 그 건물에 들어설 때(js/scenes/city.js C.visit → AR.enter) 일어난다. 마치기 전에는 출항할 수 없다.
     · 사건(G.ARSLAN.beats)은 도시에 들어설 때 · 바다의 하루 끝에 조건을 보고 하나씩.
       조건: where · box(하나 또는 여럿) · after · gap · date · battles · days(출항 뒤 날수) · with(배에 있어야 하는 동료) · needGold
             · fleet [세력, 수](그 바다에서 꺾은 선단) · wedMin(맺은 혼약 수)
       then: join · items · fame · gold · loseGold · crew · discipline · notoriety · flag · title · battle · chain · wed · base · reveal · sche · redo · finale
       고르는 대답의 셋째 칸도 then 과 같은 꼴 — 고른 쪽의 일이 사건의 then 보다 먼저 일어난다.
     · 남성은 부하로 들이지 않는다: 술집 고용(T.hireMate)과 사건 합류(G.Legend.join)에서 아르슬란이 「난 남자는 안 믿는 주의라.」 하고 거절한다.
     · 세 세력의 10대 함대: 선주회의 보증(a4_guild) 뒤, 세 바다(G.ARSLAN.fleets 의 box)에서 해전을 이길 때마다 그 세력의 선단이 하나씩 꺾인다.
       G.BALANCE.arslan.fleetNeed 척을 꺾으면 우두머리 사건이 열린다.
     · 혼약(then.wed)은 이 이야기 안의 약속이다 — 충성 100 · 수첩에 적힌다. 둘째 부인 규칙(js/systems/wives.js)과는 따로 간다.
     · arslan: true 가 붙은 동료는 이 모드가 아니면 나오지 않는다. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var AR = {}, D = G.ARSLAN;
  G.Arslan = AR;
  if (!D) return;

  function S() { return G.Game && G.Game.state; }
  function T() { var s = S(); return s && s.arslan ? s.arslan : null; }
  function K() { return G.BALANCE.arslan; }
  function today() { return U.dayIndex(S().date); }
  function inCity() { var s = S(); return G.Game.sceneName === 'city' && s && s.loc.mode === 'city'; }
  function curCity() { var s = S(); return s && s.loc.mode === 'city' ? G.CITY_DATA[s.loc.city] : null; }
  function aboard(id) { var s = S(); return !!(s && s.mates.some(function (m) { return m.id === id; })); }
  function row(id) { var s = S(); return s ? s.mates.filter(function (m) { return m.id === id; })[0] || null : null; }
  AR.active = function () { return !!T(); };
  AR.released = function () { return true; };

  // ================================================================ 말하는 사람
  var MATE_OF = { F: 'ar_firuze', G: 'ar_gulizar', A: 'ar_aylin', LP: 'little_prince', SH: 'scheherazade', IN: 'ar_inaya', MH: 'ar_mahina',
    LE: 'ar_leonor', YS: 'ar_yasin', DV: 'ar_devi', VI: 'ar_viola', KY: 'ar_kya', SA: 'ar_sayo' };
  var GUEST = { HG: 'sy_hwanggyu', WD: 'sy_woldam' };   // 「바닷길 노래」의 두 사람 (자료가 있으면 그 얼굴로)
  function mateWho(id, name) {
    var d = G.MATE[id]; if (!d) return { name: name || id };
    return { name: name || d.name, rigId: 'mate:' + id, portrait: G.Scenes.mateSpec(id), half: G.Img.chain.mateHalf(id), lang: 3, special: true };
  }
  function me() { var s = S(), p = s && s.player; if (!p) return { name: D.name }; return { name: p.name, rigId: 'player', portrait: p.portrait, half: G.Img.chain.heroHalf() }; }
  function npcFace(seed, role, style, g, file) {
    var A = G.Art, sp = { lang: 3, rigId: 'npc:' + seed };
    try {
      var spec = A.npcSpec(seed, role || 'native', style || 'is', g || 'm'), base = A.portraitKeys ? A.portraitKeys(spec) || [] : [];
      sp.portrait = A.withImg(spec, (file ? [file] : []).concat(base));
      sp.half = (file ? [file + '_half'] : []).concat(G.Img.chain.halfOf ? G.Img.chain.halfOf(base) : []);
    } catch (e) { /* 그림이 없어도 말은 한다 */ }
    return sp;
  }
  function who(k) {
    try {
      if (k === 'P') return me();
      var artSpeaker = G.StoryArt && G.StoryArt.speaker ? G.StoryArt.speaker('arslan', k) : null; if (artSpeaker) return artSpeaker;
      if (k === 'N' || !k) return {};
      if (MATE_OF[k]) return mateWho(MATE_OF[k]);
      var n = (D.npcs || {})[k];
      if (GUEST[k] && G.MATE[GUEST[k]]) return mateWho(GUEST[k], n ? n[0] : null);
      if (n) {
        // 전용 그림 images/portraits/npc/ar_<기호> 가 생기면 그것이 먼저
        var ownKey = 'portraits/npc/ar_' + k, has = G.Img && G.Img.has && G.Img.has(ownKey);
        if (!n[1] && !has) return { name: n[0] };
        var x = npcFace('ar_' + k, n[1] || 'native', n[2], n[3], has ? ownKey : n[4]); x.name = n[0]; return x;
      }
    } catch (e) { console.error(e); }
    return { name: k };
  }
  AR.who = who;
  function fmt(t) {
    var c = curCity(), s = S(), d = s.date;
    if (/\{year\}/.test(t)) t = G.StoryText ? G.StoryText.format(t, { year: d.y }) : String(t).replace(/\{year\}/g, d.y);
    return String(t).replace(/\{city\}/g, c ? c.name : '항구').replace(/\{name\}/g, s.player.given || s.player.name);
  }
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
  /** 대사를 차례로. 고른 대답에 딸린 일(셋째 칸)은 fx 에 모아 돌려준다 */
  async function play(lines, beat, branch, fx) {
    fx = fx || [];
    lines = (lines || []).filter(keep).map(function (l) { return Array.isArray(l) ? [String(l[0]).replace(/^\?/, ''), l[1]] : l; });
    try {
      for (var i = 0; i < lines.length; i++) {
        var ln = lines[i];
        if (beat && G.StoryArt) await G.StoryArt.line('arslan', beat, ln, branch ? -1 : i);
        if (Array.isArray(ln)) await UI.say(fmt(ln[1]), facing(ln[0], lines, i));
        else if (ln && ln.ask) {
          var v = await UI.ask(fmt(ln.ask), ln.opts.map(function (o, k) { return { label: o[0], value: k }; }), facing(ln.by || 'P', lines, i));
          var o = ln.opts[v == null ? 0 : v];
          var t = T(); if (t) (t.picks || (t.picks = [])).push(o[0]);
          if (Array.isArray(o[1])) await play(o[1], beat, true, fx);
          if (o[2]) fx.push(o[2]);
        }
      }
    } finally { if (!branch && G.StoryArt) await G.StoryArt.end(); }
    return fx;
  }
  AR.play = play;

  // ================================================================ 시작
  /** 이야기 고르기에서 부른다 (skip = 확인 창 없이) */
  AR.begin = async function (skip) {
    await G.State.ready;
    if (!skip) {
      var v = await UI.window({ title: '이야기 — ' + D.title, icon: 'scroll', width: 700, html: '<div style="font-size:18px;line-height:1.7">' + U.esc(D.synopsis) + '</div>',
        buttons: [{ label: '그만둔다', value: null }, { label: '이야기를 시작한다', value: 'go', cls: 'navy' }] }).result;
      if (v !== 'go') return;
    }
    await G.Game.ensureGeo();
    await AR.start();
    await UI.fade(function () { G.Game.go('city', { cityId: D.home, arslan: true }); });
  };
  /** 1480년 5월부터 시작 해까지 세상을 다달이 넘긴다 — 경쟁자 발표·군주 교대·새 도시·철새가 그 해에 맞게 */
  AR.catchUp = async function (s, to, onStep) {
    var target = to.y * 12 + to.m, n = 0;
    while (s.date.y * 12 + s.date.m < target) {
      var py = s.date.y, nd = U.addDays({ y: s.date.y, m: s.date.m, d: 1 }, 32); nd.d = 1;
      s.date = nd; s.day += 30;
      try { G.World.newMonth(); if (s.date.y !== py) G.World.newYear(); if (G.Disc && G.Disc.rivals) G.Disc.rivals(); } catch (e) { console.error(e); }
      if (++n % 24 === 0) { if (onStep) onStep(s.date.y); await new Promise(function (r) { setTimeout(r, 0); }); }
    }
    s.date = { y: to.y, m: to.m, d: to.d || 1 };
  };
  /** 고정된 제독으로 새 상태를 만든다 (시험에서도 쓴다) */
  AR.start = async function (onStep) {
    var sk = {}; G.SKILLS.forEach(function (x) { sk[x.id] = 0; });
    sk.sword = 2; sk.speech = 2; sk.ops = 1; sk.nav = 1;
    var lg = G.LANGS.map(function () { return 0; }); lg[5] = 3; lg[2] = 1; lg[6] = 1;
    var s = G.State.newGame({ name: D.name, given: D.given, surname: D.surname, nation: 'PT', job: 'explorer', age: D.age, birth: { m: D.born.m, d: D.born.d },
      st: { str: 70, int: 58, mar: 62, cha: 92 }, sk: sk, lg: lg, diff: 'normal', gold: D.gold, ships: [D.shipType] });
    var p = s.player;
    p.born = { y: D.born.y, m: D.born.m, d: D.born.d };     // 세월을 넘기는 동안 늙지 않게 먼저 적는다
    G.Game.state = s;
    await AR.catchUp(s, D.start, onStep);
    var home = G.CITY_DATA[D.home];
    p.nation = D.nation; p.home = D.home; p.g = D.g; p.gold = D.gold; p.bank = 0; p.fame = 0; p.notoriety = 0;
    s.loc = { mode: 'city', city: D.home, lon: home.lon, lat: home.lat, heading: Math.PI };
    s.fleet.ships[0].name = D.ship; s.fleet.crew = D.crew; s.fleet.fatigue = 0; s.fleet.discipline = 80;
    s.fleet.food = Math.ceil(R.dailyUse(s.fleet.crew, s.fleet) * 14); s.fleet.water = Math.ceil(R.dailyUse(s.fleet.crew, s.fleet) * 14);
    s.contract = null;
    try {
      var A = G.Art;
      p.portrait = A.withImg(A.portraitSpec({ seed: 'ar_arslan', culture: 'arab', g: 'm', age: 'young', cloth: '#27407a', beard: 0 }), ['portraits/story-player/arslan', 'portraits/player/' + D.look]);
      p.look = D.look;
    } catch (e) { console.error(e); }
    s.mates = [];
    (D.mates0 || []).forEach(function (id) { s.mates.push({ id: id, role: (D.roles || {})[id] || 'none', joined: U.dateNum(s.date), loyal: 92, ev: 1, from: D.home }); });
    if (s.known.indexOf(D.home) < 0) s.known.push(D.home);
    s.log = [];
    s.arslan = { act: 1, beats: {}, flags: {}, pro: 0, fleet: { isl: 0, por: 0, ita: 0 }, wed: {}, cool: {}, started: U.dateNum(s.date), startDay: U.dayIndex(s.date) };
    G.State.log(D.start.y + '년 ' + D.start.m + '월, 이스탄불. 아르슬란 젬오을루의 이야기가 시작된다.');
    if (G.Frontier && G.Frontier.invalidate) G.Frontier.invalidate();
    return s;
  };

  // ================================================================ 프롤로그 — 이스탄불을 걸으며 한 장면씩
  function stages() { return (D.prologue && D.prologue.stages) || []; }
  AR.stage = function () { var t = T(); return t && !t.prologue ? stages()[t.pro || 0] || null : null; };
  /** 그 장면이 일어나는 건물 — 도시에 그 건물이 없으면 항구(조선소)·술집(도서관)으로 */
  function stageKind(st, c) {
    var f = R.facilities ? R.facilities(c) : {};
    if (st.at === 'shipyard' && !f.shipyard) return 'harbor';
    if (st.at === 'library' && !f.library) return 'tavern';
    return st.at;
  }
  function proJoin(id) {
    var s = S(); if (!G.MATE[id] || aboard(id)) return;
    s.mates.push({ id: id, role: (D.roles || {})[id] || 'none', joined: U.dateNum(s.date), loyal: 92, ev: 1, from: D.home });
    if (G.CrewAuto && G.CrewAuto.refresh) { try { G.CrewAuto.refresh(); } catch (e) { console.error(e); } }
    UI.toast(G.MATE[id].name + U.jx(G.MATE[id].name, '이/가') + ' 일행이 되었다.', 'people', 4200);
  }
  function proDone() {
    var t = T(), s = S(); if (!t || t.prologue) return;
    stages().forEach(function (st) { (st.join || []).forEach(proJoin); });     // 장면이 도중에 끊겼어도 일행은 모인다
    giveItems(['ar_chart']);
    t.pro = stages().length; t.prologue = 1; t.beats.start = today(); s.flags.prologue = true;
    UI.toast('〈달무리〉가 떠날 채비를 마쳤다. 처음은 카라만 앞바다 — 안탈리아와 실리프케 사이.', 'scroll', 6200);
    if (G.Game.refreshHud) G.Game.refreshHud();
  }
  /** 다음 갈 건물을 거리에서 금빛으로 짚어 준다 */
  function pointNext() {
    var st = AR.stage(), TW = G.Town, c = curCity();
    if (!st || !c || !inCity() || !TW || !TW.active || !TW.active() || (TW.hidden && TW.hidden()) || st.at === 'start') return;
    var kind = stageKind(st, c);
    try { if (TW.lookAt) TW.lookAt(kind); if (TW.highlight) TW.highlight([kind], 14000); } catch (e) { console.error(e); }
  }
  async function runStage(c) {
    var t = T(), st = AR.stage(); if (!st) return null;
    var last = (t.pro || 0) + 1 >= stages().length;
    t.pro = (t.pro || 0) + 1;                 // 먼저 적는다 — 도중에 오류가 나도 같은 장면이 되풀이되지 않게
    AR._busy = true;
    try { await play(st.lines, 'pro_' + st.id); } catch (e) { console.error(e); }
    AR._busy = false;
    (st.join || []).forEach(proJoin);
    G.State.log('「' + D.short + '」 — ' + (st.log || '이야기가 한 걸음 나아갔다.'));
    if (last) proDone();
    else if (st.next) { UI.toast('다음 — ' + st.next, 'star', 6200); setTimeout(pointNext, 900); }
    return st;
  }
  /** 건물에 들어설 때 (js/scenes/city.js C.visit) — false 를 돌려주면 장면만 보고 거리로 나온다 */
  AR.enter = async function (c, kind) {
    var t = T(); if (!t || t.prologue || !c || c.id !== D.home) return true;
    var st = AR.stage(); if (!st) { proDone(); return true; }
    if (st.at === 'start') { await runStage(c); st = AR.stage(); if (!st) return true; }   // 첫 장면을 못 본 채 불러온 저장
    if (stageKind(st, c) === kind) { await runStage(c); if (inCity() && G.Game.cityHud) G.Game.cityHud(); return !!st.stay; }
    return true;                              // 다른 건물은 언제든 구경할 수 있다
  };

  function giveItems(ids) {
    var p = S().player;
    (ids || []).forEach(function (id) { if (!p.items.some(function (it) { return it.id === id; })) { var it = D.items[id]; p.items.push({ id: id, kind: 'keepsake', name: it ? it[0] : id, desc: it ? it[1] : '', tale: true, arslan: true }); } });
  }

  // ================================================================ 사건
  function done(id) { var t = T(); return !!(t.beats && t.beats[id] != null); }
  function doneDay(id) { return T().beats[id]; }
  AR.done = function (id) { return !!T() && done(id); };
  function whereOk(b, c) {
    var w = b.where; if (w == null) return true; if (!c) return false;
    if (Array.isArray(w)) return w.indexOf(c.id) >= 0;
    if (w === 'away') return c.id !== D.home;
    return false;
  }
  function inBox(x, lon, lat) { return lon >= x[0] && lon <= x[1] && lat >= x[2] && lat <= x[3]; }
  function boxes(x) { return Array.isArray(x[0]) ? x : [x]; }
  function boxOk(x) { var l = S().loc; return l.mode === 'sea' && boxes(x).some(function (bx) { return inBox(bx, l.lon, l.lat); }); }
  function fleetNeed(b) { return Math.min((b.fleet && b.fleet[1]) || K().fleetNeed, K().fleetMax - 1); }   // 마지막 한 척은 우두머리
  function fleetCount(k) { var t = T(); return (t && t.fleet && t.fleet[k]) || 0; }
  function wedCount() { var t = T(); return t && t.wed ? Object.keys(t.wed).length : 0; }
  function daysNeed(b) { return b.days || K().wedDays; }
  function sailed() { var t = T(); return today() - (t.startDay || today()); }
  /** 사건이 열리는 조건 가운데 「자리」가 아닌 것 (지금 할 일에 무엇이 모자란지 적을 때도 쓴다) */
  function gate(b) {
    var s = S(), t = T();
    if (b.after && !b.after.every(done)) return 'after';
    if (t.cool && t.cool[b.id] > today()) return 'cool';
    if (b.gap && b.after && b.after.length) { var last = Math.max.apply(null, b.after.map(doneDay)); if (today() - last < b.gap) return 'gap'; }
    if (b.date && s.date.y * 12 + s.date.m < b.date[0] * 12 + b.date[1]) return 'date';
    if (b.days != null && sailed() < daysNeed(b)) return 'days';
    if (b.with && !b.with.every(aboard)) return 'with';
    if (b.fleet && fleetCount(b.fleet[0]) < fleetNeed(b)) return 'fleet';
    if (b.wedMin && wedCount() < b.wedMin) return 'wed';
    if (b.needGold && s.player.gold < b.needGold) return 'gold';
    if (b.battles && !G.StoryBattle.won('arslan', b)) return 'battle';
    return '';
  }
  function ready(b, at, ctx) {
    var t = T(); ctx = ctx || {};
    if (!t || !t.prologue || t.finale || done(b.id) || b.at !== at) return false;
    if (gate(b)) return false;
    if (at === 'city' && !whereOk(b, ctx.city)) return false;
    if (b.box && !boxOk(b.box)) return false;
    return true;
  }
  function beatOf(id) { return (D.beats || []).filter(function (b) { return b.id === id; })[0]; }
  var TITLES = D.titles || {};
  async function run(b, ctx) {
    var t = T(); ctx = ctx || {};
    t.beats[b.id] = today();
    if (b.act) t.act = Math.max(t.act || 1, b.act);
    var fx = [];
    try { fx = await play(b.lines, b.id); } catch (e) { console.error(e); }
    ctx.beat = b;
    for (var i = 0; i < fx.length; i++) await AR.apply(fx[i], ctx);     // 고른 대답의 일이 먼저
    G.State.log('「' + D.short + '」 — ' + (b.title || TITLES[b.id] || '이야기가 한 걸음 나아갔다.'));
    await AR.apply(b.then || {}, ctx);
    if (G.Game.refreshHud) G.Game.refreshHud();
  }
  AR.apply = async function (th, ctx) {
    var s = S(), t = T(), c = (ctx && ctx.city) || curCity(), b = ctx && ctx.beat;
    if (th.reveal) { var lp = s.lprince || (s.lprince = {}); lp.revealed = true; lp.phase = 'done'; }   // 별에서 온 소년이 우물가에서 두건을 젖혔다 (js/systems/littleprince.js)
    if (th.sche) { var L = s.legend || (s.legend = {}); (L.sche || (L.sche = {})).done = 1; }            // 셰헤라자드의 이야기들이 열린다 (js/systems/nights.js)
    if (th.join) th.join.forEach(function (id) {
      if (!G.MATE[id] || aboard(id)) return;
      delete s.flags['gone_' + id];
      AR._joining = true;
      var nm = null;
      try { nm = G.Legend && G.Legend.join ? G.Legend.join(id, c) : null; } catch (e) { console.error(e); }
      AR._joining = false;
      if (!nm) { nm = { id: id, role: 'none', joined: U.dateNum(s.date), loyal: 88, ev: 1 }; s.mates.push(nm); UI.toast(G.MATE[id].name + ' 동료가 되었다.', 'people', 3600); }
      nm.loyal = Math.max(nm.loyal || 0, 88);
    });
    if (th.items) giveItems(th.items);
    if (th.fame && G.Fame) for (var k in th.fame) G.Fame.add(k, th.fame[k]);
    if (th.gold) { s.player.gold = Math.max(0, s.player.gold + th.gold); UI.toast(th.gold > 0 ? '금화 ' + U.num(th.gold) + '닢이 들어왔다.' : '금화 ' + U.num(-th.gold) + '닢을 치렀다.', 'coin', 3200); }
    if (th.loseGold) { var lost = Math.round(s.player.gold * th.loseGold); s.player.gold -= lost; t.lost = (t.lost || 0) + lost; UI.toast('금화 ' + U.num(lost) + '닢이 빵과 물이 되었다.', 'coin', 4200); }
    if (th.crew) { var cap = U.sum(s.fleet.ships, function (x) { return x.crewMax; }); s.fleet.crew = Math.min(cap, s.fleet.crew + th.crew); }
    if (th.discipline) s.fleet.discipline = Math.max(0, Math.min(100, (s.fleet.discipline || 50) + th.discipline));
    if (th.notoriety) s.player.notoriety = Math.max(0, (s.player.notoriety || 0) + th.notoriety);
    if (th.flag) {
      (t.flags || (t.flags = {}))[th.flag] = today();
      if (th.flag === 'helm') UI.toast('선장이 키에서 손을 뗐다 — 이제 폭풍과 추격전 앞에서 아일린에게 지휘를 맡길 수 있다.', 'anchor', 5600);
      if (/^sea_/.test(th.flag)) { var fk = th.flag.slice(4); if (t.fleet) t.fleet[fk] = K().fleetMax; UI.toast(D.fleets[fk].name + '의 우두머리를 꺾었다.', 'laurel', 5200); }
    }
    if (th.base) { t.base = today(); UI.toast('비자고스 제도의 섬이 사람들의 거점이 되었다.', 'anchor', 5200); }
    if (th.title) { (t.titles || (t.titles = [])).push(th.title); UI.toast('바다의 사람들이 부르는 이름 — 「' + th.title + '」', 'crown', 4800); }
    if (th.wed) {
      (t.wed || (t.wed = {}))[th.wed] = today();
      var wr = row(th.wed); if (wr) wr.loyal = 100;
      var wn = G.MATE[th.wed] ? G.MATE[th.wed].name : th.wed;
      UI.toast(wn + U.jx(wn, '과/와') + ' 혼약을 맺었다.', 'ring', 5200);
      G.State.log(wn + U.jx(wn, '이/가') + ' 스스로 승낙했다 — 혼약을 맺었다.');
    }
    if (th.redo && b) { delete t.beats[b.id]; (t.cool || (t.cool = {}))[b.id] = today() + K().redoDays; }   // 미룬 일은 얼마 뒤 다시 열린다
    if (th.battle) await startBattle(th.battle);
    if (th.chain) { var nb = beatOf(th.chain); if (nb && !done(nb.id)) await run(nb, { city: c }); }
    if (th.finale) await finale();
  };
  async function startBattle(o) {
    var s = S(), t = T();
    t.battleMark = s.stats.battles || 0;
    var npc = { id: 'ar_' + (o.label || 'enemy'), kind: o.kind || 'pirate', n: o.n || 1, K: 1, zone: G.Ships && G.Ships.zone ? G.Ships.zone(s.loc.lon, s.loc.lat) : 'west', hostile: true, label: o.label, names: o.names, nation: o.nation };
    G.StoryBattle.start('arslan', o, npc);
    await UI.fade(function () { G.Game.go('battle', { npc: npc }); });
  }
  AR.arrive = async function (c, arg) {
    var t = T(); if (!t) return false;
    arg = arg || {};
    if (!t.prologue) {
      if (!(t.pro > 0) && c.id === D.home && (arg.arslan || !arg.load)) { await runStage(c); if (G.Game.cityHud) G.Game.cityHud(); return true; }   // 첫 장면
      setTimeout(pointNext, 1200);            // 도입부 도중에 이어하기: 다음 갈 곳을 다시 짚어 준다
      return false;
    }
    if (arg.load) return false;
    var b = (D.beats || []).filter(function (x) { return ready(x, 'city', { city: c }); })[0];
    if (!b) return false;
    await run(b, { city: c });
    if (inCity() && G.Game.cityHud) G.Game.cityHud();
    return true;
  };
  AR.seaPending = function () {
    if (G.StoryBattle) G.StoryBattle.recover('arslan');
    var t = T(), s = S(); if (!t || !t.prologue || AR._busy || !s || s.loc.mode !== 'sea') return false;
    return (D.beats || []).some(function (b) { return ready(b, 'sea'); });
  };
  AR.atSea = async function () {
    if (AR._busy) return false; AR._busy = true;
    try { var b = (D.beats || []).filter(function (x) { return ready(x, 'sea'); })[0]; if (b) await run(b, {}); }
    catch (e) { console.error(e); } finally { AR._busy = false; }
    return true;
  };
  async function finale() {
    var t = T(); t.finale = today();
    var weds = Object.keys(t.wed || {}).map(function (id) { return G.MATE[id] ? G.MATE[id].short || G.MATE[id].name : id; });
    var html = '<div style="font-size:19px;line-height:1.7"><b>「' + U.esc(D.title) + '」 — 끝</b><br>' + U.esc(fmt(D.ending)) +
      '<div class="sep"></div><span class="muted">걸린 날: ' + U.num(today() - (t.startDay || today())) + '일 · 동료 ' + S().mates.length + '명 · 혼약: ' + U.esc(weds.join(' · ') || '없음') +
      ' · 바다가 부른 이름: ' + U.esc((t.titles || []).join(' · ')) + '</span>' +
      '<div class="sep"></div>이야기는 여기서 한 매듭을 짓습니다. 항해는 그대로 이어집니다.</div>';
    await UI.window({ title: D.short, icon: 'laurel', width: 680, html: html, buttons: [{ label: '항해를 이어 간다', value: 'ok', cls: 'navy' }] }).result;
  }

  // ================================================================ 지금 할 일 · 수첩
  function kindOf(b) { return /^r_/.test(b.id) ? 'crew' : /^w_/.test(b.id) ? 'wed' : /^s_/.test(b.id) ? 'scene' : 'main'; }
  function openBeats() { return (D.beats || []).filter(function (x) { return x.guide && !done(x.id) && (!x.after || x.after.every(done)); }); }
  function guideText(b) {
    var g = U.esc(b.guide), s = S(), why = gate(b);
    if (b.fleet) g += ' <span class="muted">(' + U.esc(D.fleets[b.fleet[0]].sea) + '에서 선단 ' + Math.min(fleetCount(b.fleet[0]), fleetNeed(b)) + '/' + fleetNeed(b) + ')</span>';
    if (why === 'date') g += ' <span class="muted">(' + b.date[0] + '년 ' + b.date[1] + '월 무렵)</span>';
    if (why === 'days') g += ' <span class="muted">(출항 ' + daysNeed(b) + '일 뒤 — ' + (daysNeed(b) - sailed()) + '일 남음)</span>';
    if (why === 'gold') g += ' <span class="muted">(금화 ' + U.num(b.needGold) + '닢이 있어야 한다 — 지금 ' + U.num(s.player.gold) + '닢)</span>';
    if (why === 'wed') g += ' <span class="muted">(혼약이 아직 없다 — 첫 동료들의 이야기를 먼저)</span>';
    if (why === 'with') g += ' <span class="muted">(그 동료가 배에 있어야 한다)</span>';
    if (why === 'cool') g += ' <span class="muted">(조금 더 시간이 지난 뒤)</span>';
    return g;
  }
  function firstOpen(kind) { return openBeats().filter(function (x) { return kindOf(x) === kind && gate(x) !== 'cool'; })[0]; }
  AR.guide = function () {
    if (G.StoryBattle) G.StoryBattle.recover('arslan');
    var t = T(); if (!t || t.finale) return '';
    if (!t.prologue) { var st = AR.stage(); return st && st.at !== 'start' ? U.esc({ shipyard: '조선소로 — 아일린 누나네 헐값 배', library: '도서관으로 — 어머니의 편지를 읽어 주던 사서', harbor: '항구로 — 배에 이름을 붙인다' }[st.at] || '') : ''; }
    var b = firstOpen('main');
    return b ? guideText(b) : '';
  };
  AR.todo = function (c) {
    var t = T(); if (!t) return [];
    var out = [], g = AR.guide(), open = function () { G.Info.open('arslan'); };
    if (g) out.push({ icon: 'scroll', text: g + ' <span class="muted">(수첩 「돌아오는 배」)</span>', onClick: open });
    if (!t.prologue) return out;
    var cr = firstOpen('crew'); if (cr) out.push({ icon: 'people', text: guideText(cr), onClick: open });
    var wd = openBeats().filter(function (x) { return kindOf(x) === 'wed' && !gate(x); })[0]; if (wd) out.push({ icon: 'ring', text: guideText(wd), onClick: open });
    return out;
  };
  AR.page = function (el) {
    var t = T(); if (!t) { el.innerHTML = '<div class="muted">이야기 모드가 아니다.</div>'; return; }
    var acts = {}; (D.beats || []).forEach(function (b) { (acts[b.act] || (acts[b.act] = [])).push(b); });
    var rows = Object.keys(acts).sort(function (a, b) { return a - b; }).map(function (a) {
      var bs = acts[a], n = bs.filter(function (b) { return done(b.id); }).length;
      return '<tr><td style="white-space:nowrap">' + (a === '8' ? '종막' : a + '막') + '<br><span class="muted" style="font-size:12px">' + U.esc((D.acts || {})[a] || '') + '</span></td><td>' +
        bs.map(function (b) { return (done(b.id) ? '<b>' : '<span class="muted">') + U.esc(TITLES[b.id] || b.id) + (done(b.id) ? '</b>' : '</span>'); }).join(' · ') + '</td><td>' +
        (n === bs.length ? '<span class="tag good-text">끝</span>' : n ? '<span class="tag warn-text">' + n + '/' + bs.length + '</span>' : '') + '</td></tr>';
    }).join('');
    var mates = (D.crew || []).map(function (id) {
      var m = G.MATE[id]; if (!m) return '';
      var w = t.wed && t.wed[id] != null;
      return '<span class="tag' + (aboard(id) ? ' good-text' : '') + '" style="margin:2px">' + U.esc(m.short || m.name) + (w ? ' ♥' : '') + (aboard(id) ? '' : ' …') + '</span>';
    }).join('');
    var seas = t.flags && t.flags.guild ? ['isl', 'por', 'ita'].map(function (k) {
      var f = D.fleets[k], n = Math.min(K().fleetMax, fleetCount(k)), head = t.flags['sea_' + k];
      return '<div style="margin:3px 0"><b>' + U.esc(f.name) + '</b> ' + (head ? '<span class="tag good-text">우두머리를 꺾었다</span>' : '<span class="tag warn-text">' + n + '/' + K().fleetMax + '</span> <span class="muted">' + Math.min(K().fleetNeed, K().fleetMax - 1) + '척을 꺾으면 우두머리가 나선다</span>') +
        '<div class="muted" style="font-size:13px">' + U.esc(f.sea) + ' — ' + f.list.map(function (nm, i) { return i < n || head ? '<s>' + U.esc(nm) + '</s>' : U.esc(nm); }).join(' · ') + '</div></div>';
    }).join('') : '<span class="muted">선주회의 보증을 얻은 뒤에 열린다.</span>';
    var todo = AR.todo(curCity()).map(function (x) { return '<div style="margin:2px 0">' + x.text.replace(/ <span class="muted">\(수첩[^<]*<\/span>/, '') + '</div>'; }).join('');
    el.innerHTML = '<div class="grid2" style="grid-template-columns:300px 1fr;gap:24px"><div><div class="ar-face"></div>' +
      '<h4 style="margin:10px 0 4px">' + U.esc(D.title) + '</h4><div class="muted" style="font-size:14px;line-height:1.6">' + U.esc(D.synopsis) + '</div>' +
      '<div class="sep"></div><b>바다가 부른 이름</b> — ' + (t.titles && t.titles.length ? U.esc(t.titles.join(' · ')) : '<span class="muted">아직 없다</span>') +
      '<div class="sep"></div><b>〈달무리〉의 열세 동료</b> <span class="muted">(♥ 혼약)</span><div>' + mates + '</div>' +
      '<div class="muted" style="font-size:13px;margin-top:6px">남성은 부하로 들이지 않는다 — 「' + U.esc(D.refuse.line) + '」</div></div><div>' +
      (todo ? '<div style="margin-bottom:10px"><b>지금 할 일</b>' + todo + '</div>' : '') +
      '<div style="margin-bottom:10px"><b>세 바다의 10대 함대</b><div>' + seas + '</div></div>' +
      '<table class="tbl"><tr><th></th><th>사건</th><th></th></tr>' + rows + '</table></div></div>';
    try { var box = el.querySelector('.ar-face'), cv = G.Img.make(G.Img.chain.heroHalf(), 300, 380, function () { var x = document.createElement('canvas'); x.width = 300; x.height = 380; return x; }, { fit: 'contain' }); box.appendChild(cv); } catch (e) { console.error(e); }
    if (G.StoryArt && G.StoryArt.gallery) G.StoryArt.gallery('arslan', el);
  };

  // ================================================================ 남성은 부하로 들이지 않는다
  function isMale(m) { return !!m && m.g === 'm' && (D.refuse.ok || []).indexOf(m.id) < 0; }
  async function refuse() {
    await UI.say(D.refuse.line, me());
    var pool = (D.refuse.after || []).filter(function (l) { return aboard(MATE_OF[l[0]]); });
    if (pool.length) { var l = U.pick(pool); await UI.say(l[1], who(l[0])); }
  }
  AR.refuses = function (m) { return !!T() && isMale(m); };

  // ================================================================ 세 세력의 10대 함대 — 그 바다에서 이긴 해전
  /** 해전이 끝날 때 (js/scenes/battle.js → G.StoryBattle.finish 를 감싼 것) */
  function countFleet(npc, result) {
    var t = T(), s = S(); if (!t || result !== 'win' || !t.flags || !t.flags.guild || !npc) return;
    if (/^ar_/.test(String(npc.id || ''))) return;          // 이야기 해전은 따로 센다 (우두머리)
    var l = s.loc; if (!l || l.lon == null) return;
    for (var k in D.fleets) {
      var f = D.fleets[k]; if (t.flags['sea_' + k] || !f.box.some(function (bx) { return inBox(bx, l.lon, l.lat); })) continue;
      var n = (t.fleet[k] || 0); if (n >= K().fleetMax - 1) continue;     // 마지막 한 척은 우두머리
      t.fleet[k] = n + 1;
      UI.toast(f.name + ' — 「' + f.list[n] + '」' + U.jx(f.list[n], '을/를') + ' 꺾었다 (' + (n + 1) + '/' + K().fleetMax + ')', 'flag', 5200);
      G.State.log('「' + D.short + '」 — ' + f.name + '의 「' + f.list[n] + '」' + U.jx(f.list[n], '을/를') + ' 꺾었다.');
      break;
    }
  }

  // ================================================================ 게임 함수 감싸기
  function wrap(obj, name, fn) { var orig = obj && obj[name]; if (typeof orig !== 'function' || orig._arslan) return; obj[name] = fn(orig); obj[name]._arslan = true; }
  function install() {
    if (G.Frontier) wrap(G.Frontier, 'mateReady', function (orig) { return function (m) { if (m && m.arslan && !T()) return false; return orig.apply(this, arguments); }; });
    var C = G.Scenes && G.Scenes.city;
    // 술집에서 남성 항해사를 고용하려 하면 거절한다
    if (C && C.B && C.B.tavern) wrap(C.B.tavern, 'hireMate', function (orig) {
      return async function (c, m) {
        if (T() && isMale(m)) { await refuse(); return false; }
        return orig.apply(this, arguments);
      };
    });
    // 사건으로 남성이 입단을 청해도 거절한다 (이 이야기가 직접 들이는 사람은 빼고)
    if (G.Legend) wrap(G.Legend, 'join', function (orig) {
      return function (id) {
        if (T() && !AR._joining && isMale(G.MATE[id])) {
          UI.toast('아르슬란 — 「' + D.refuse.line + '」 ' + G.MATE[id].name + '의 입단을 거절했다.', 'people', 5200);
          return null;
        }
        return orig.apply(this, arguments);
      };
    });
    // 도입부를 마치기 전에는 떠나지 않는다
    if (C && C.B && C.B.harbor) wrap(C.B.harbor, 'depart', function (orig) {
      return async function () {
        var t = T();
        if (t && !t.prologue) { var ln = ((D.prologue || {}).notYet || {}).depart; if (ln) await UI.say(fmt(ln[1]), who(aboard(MATE_OF[ln[0]]) ? ln[0] : 'P')); setTimeout(pointNext, 600); return false; }
        return orig.apply(this, arguments);
      };
    });
    if (G.StoryBattle) wrap(G.StoryBattle, 'finish', function (orig) {
      return function (npc, result) { try { countFleet(npc, result); } catch (e) { console.error(e); } return orig.apply(this, arguments); };
    });
  }
  function boot() { try { install(); } catch (e) { console.error(e); } }
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', boot); else boot();
})(window.G = window.G || {});
