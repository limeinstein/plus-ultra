/* 육상전 — 대항해시대 3의 육상전처럼 탐험대를 부대로 나누어 싸운다 (규칙·글·그림은 이 게임에서 새로 만들었다). 2026-10-23 크게 고침 — 자료는 js/data/landwarunits.js
   ■ 전장: 양쪽 모두 앞줄·가운데줄·뒷줄 세 줄, 줄마다 세 칸(위·가운데·아래). 근접 부대는 맨 앞줄끼리(옆 칸까지) 싸우고, 기병은 앞줄에서 뒷줄까지 파고들며,
     총·활은 두 줄 안, 포는 어디든 닿는다. 앞줄이 무너지면 다음 줄이 앞줄이 된다. 칸마다 언덕·숲·개울이 놓이고, 비·안개·더위가 싸움을 바꾼다
   ■ 병종 상성(가위바위보): 창병 > 기병 > 활·총·포 > 걷는 보병 … (G.LANDWAR.VS). 부대를 고르면 적 부대 위에 유리 ▲ · 불리 ▼ 가 뜬다
   ■ 차례: 부대마다 명령(공격·돌격·방어·전진·후퇴·대기)과 목표를 고르고 「진행」. 「모두 공격」「모두 방어」로 한 번에 할 수도 있고 「자동」도 있다.
     제독은 차례마다 특수 작전 하나(기습·함정·저격·작렬탄·일제 사격·함성)를 함께 쓸 수 있다 — 쓰고 나면 몇 차례 기다려야 다시 쓴다
   ■ 적의 다음 행동을 미리 보여 준다(돌격 → 총병 등). 적은 종류마다 성격이 다르다 — 원주민: 숲에서 매복·측면 · 도적: 약한 부대에 몰려들고 불리하면 달아난다 ·
     짐승: 우두머리가 울부짖으면 한꺼번에 돌진 · 수비대: 처음엔 진을 지키며 포격하다가 돌격
   ■ 땅마다 이름난 적 부대 (재규어 전사·예니체리·전투 코끼리·사무라이·신기전 …) · 동료 항해사를 부대 지휘관으로 (고유 솜씨, 일기토)
   ■ 싸움 전: 정찰(적 편성을 미리 본다) · 진형(횡대·종심·매복 대기) · 탐험 장비(화승총·창·흉갑 — js/systems/landkit.js) · 원주민과는 통역으로 말로 달래 보기
   ■ 싸우는 중: 판마다 한 번쯤 사건 (원군·적의 원군·소나기·안개·화약 부족·짐승 난입)
   ■ 끝: 결과 판 — 전리품·노획한 말·화승총·포로 (몸값을 받거나 풀어 준다 — 풀어 주면 그 땅 원주민이 반긴다)
   - 적 우두머리를 쓰러뜨리면 남은 적이 항복해 이긴다. 제독대가 무너지거나 대원이 2할 밑으로 줄면 진다 · 쓰러진 대원 일부는 의학 솜씨만큼 살아 돌아온다
   G.Games.landWar({ enemy: {name, kind: native|bandit|beast|garrison, n, leader}, party, terr, guns, flee, hold, halt, noHurt, fastEnd })
     → {res: win|lose|flee|truce, dead, back, left, leaderDown, held, spoils: {gold, horses, muskets, prisoners, ransom, freed}}
   - hold: 「퇴각 판」 — 적의 차례를 hold번 버티면(제독대가 살아 있으면) 빠져나가 이긴다 (아즈텍의 슬픈 밤 — js/systems/aztec.js)
   - halt: {turn, banner, text, after} — 그 차례가 끝났을 때 아직 승부가 나지 않았으면 누군가 끼어들어 싸움이 멈춘다 (res 'truce') — 포카혼타스의 중재 (js/systems/pocahontas.js) */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, I = G.Img;
  G.Games = G.Games || {};
  var W = 1000, H = 440;
  var LX = [410, 280, 150], LY = [140, 262, 384];   // 우리 편 줄(앞·가운데·뒤)의 x · 칸(위·가운데·아래)의 y — 적은 좌우를 뒤집는다
  var TYPES = {
    inf: { name: '보병', pow: 1.0, cls: 'pike', sk: 'sword' },
    cav: { name: '기병', up: '중장기병', pow: 1.45, cls: 'cav', sk: 'sword' },
    gun: { name: '총병', up: '머스킷총병', pow: 0.8, cls: 'missile', sk: 'shoot' },
    art: { name: '포병', up: '캐논포병', pow: 0.5, cls: 'art', sk: 'gun' },
    adm: { name: '제독대', up: '무적 제독대', pow: 1.35, cls: 'blade' }
  };
  G.LANDWAR_TYPES = TYPES;
  // 적: 부대 [이름, 병종, 힘, 그림], 우두머리 [이름, 힘]
  var FOES = {
    native: { units: [['전사', 'blade', 1.1, 'spear'], ['궁수', 'missile', 0.8, 'bow']], mix: [0, 0, 1], leader: ['족장', 1.6], col: ['#8a4a2a', '#c89060'] },
    bandit: { units: [['도적', 'blade', 1.15, 'blade'], ['총잡이', 'missile', 0.9, 'musket']], mix: [0, 0, 1], leader: ['두목', 1.7], col: ['#5a1e1a', '#3a3030'] },
    beast: { units: [['짐승 떼', 'beast', 1.35, 'beast']], mix: [0], leader: ['우두머리 짐승', 2.0], col: ['#5a4a3a', '#7a6a58'] },
    garrison: { units: [['창병', 'pike', 1.15, 'pike'], ['총병', 'missile', 0.95, 'musket'], ['포대', 'art', 0.5, 'cannon']], mix: [0, 1, 0, 1, 2], leader: ['수비대장', 1.7], col: ['#6a6a78', '#8a2a24'] }
  };
  var TERR_AMBUSH = { forest: 0.8, jungle: 0.85, mountain: 0.7, grass: 0.45, steppe: 0.4, desert: 0.3, snow: 0.35, tundra: 0.4, ice: 0.25 };
  var TERR_TRAP = { forest: 0.65, jungle: 0.7, mountain: 0.6, grass: 0.5, steppe: 0.45, desert: 0.4, snow: 0.55, tundra: 0.5, ice: 0.4 };
  var TERR_BG = { grass: ['#6f8a4a', '#51683a'], steppe: ['#a09a5a', '#7a7440'], desert: ['#d8b878', '#b89458'], forest: ['#46643a', '#2e4a2a'], jungle: ['#3a5a30', '#223a1e'],
    mountain: ['#8a8474', '#666050'], snow: ['#e8ecf0', '#c4ccd6'], tundra: ['#a8a888', '#84846a'], ice: ['#dfeaf2', '#b8ccdc'] };
  var TERR_NAME = { grass: '들판', steppe: '초원', desert: '사막', forest: '숲', jungle: '밀림', mountain: '산', snow: '눈밭', tundra: '툰드라', ice: '얼음 땅' };
  // 칸마다 놓이는 지형 — [위, 가운데, 아래] 가운데서 고른다 (hill: 언덕 · woods: 숲 · stream: 개울)
  var TERR_FEAT = { grass: ['hill', 'stream', null], steppe: ['hill', null, null], desert: ['hill', null, null], forest: ['woods', 'woods', null], jungle: ['woods', 'woods', 'stream'],
    mountain: ['hill', 'hill', 'woods'], snow: ['woods', null, null], tundra: ['stream', null, null], ice: [null, null, null] };
  var FEAT_NAME = { hill: '언덕', woods: '숲', stream: '개울' };
  var ACT = {
    attack: { name: '공격', icon: '⚔' }, shoot: { name: '사격', icon: '➶' }, bombard: { name: '포격', icon: '✸' }, charge: { name: '돌격', icon: '»' },
    guard: { name: '방어', icon: '◈' }, adv: { name: '전진', icon: '▶' }, back: { name: '후퇴', icon: '◀' }, wait: { name: '대기', icon: '·' },
    volley: { name: '일제 사격', icon: '➶' }, roar: { name: '울부짖음', icon: '!' }, flee: { name: '달아날 채비', icon: '…' }, duel: { name: '일기토를 청함', icon: '⚔' },
    haka: { name: '하카', icon: '!' }, ambush: { name: '매복 사격', icon: '➶' }, stun: { name: '발이 묶임', icon: '×' }
  };

  // 말풍선 — 싸움의 맛을 살리는 짧은 외침 (2026-10-23 연출)
  var SHOUT = {
    charge: ['돌격하라!', '앞으로!', '밀어붙여라!', '한꺼번에 쳐라!'], attack: ['베어라!', '쳐라!', '물러서지 마라!'], guard: ['버텨라!', '방패를 세워라!', '자리를 지켜라!'],
    shoot: ['쏴라!', '겨눠… 쏴!', '한 놈도 놓치지 마라!'], cheer: ['와아아!', '이겼다!', '제독 만세!'], flee: ['도망쳐라!', '살려 줘!', '물러나라!'],
    native: ['우와아아!', '아이야이야!', '조상의 이름으로!'], bandit: ['죽여라!', '몽땅 털어라!', '덤벼 봐라!'], beast: ['크르릉…', '캬아악!', '우우우…'], garrison: ['진을 지켜라!', '쏴라!', '한 걸음도 물러서지 마라!']
  };
  // 이름난 동료가 처음 싸움에 나설 때 외치는 말 — 없으면 「나를 따르라!」
  var CMDR_CRY = { guan_yu: '관운장이 여기 있다!', zhang_fei: '연인 장익덕이 여기 있다!', liu_bei: '백성을 지켜라!', zhuge_liang: '계책대로 움직여라.', d_artagnan: '하나는 모두를 위하여!',
    athos: '총사들이여, 검을!', porthos: '으하하, 덤벼라!', aramis: '침착하게 겨눠라.', drake: '엘 드라케가 간다!', barbarossa: '붉은 수염을 보아라!', joan_of_arc: '주님의 이름으로, 앞으로!',
    bokuden: '한 칼에 끝낸다.', don_quixote: '거인들이여, 각오하라!', sancho_panza: '나리, 저건 그냥 양 떼인데요!', marina: '물러서지 마세요!', tupac: '산이 우리 편이다!',
    kisk: '은동고를 위하여!', leonardo: '포각을 조금만 더…', peter_pan: '꼬끼오~!', ahmad: '사막의 바람처럼!' };
  var OP_ICON = { ambush: '✦', trap: '⩚', snipe: '◎', shells: '✸', volley: '➶', cry: '⚑', roar: '‼' };
  function ART() { return G.LANDWAR_ART || null; }
  function S() { return G.Game.state; }
  function BL() { return (G.BALANCE && G.BALANCE.landwar) || {}; }
  function LD() { return G.LANDWAR || { VS: {}, SPECIAL: {}, MATE_SKILL: {}, EVENTS: [], ABILITY: {}, CLS_NAME: {} }; }
  function sk(id) { return R.skill(id); }
  function mountInfo() {
    var l = S().loc || {}, mt = l.mount || { id: 'walk', n: 0 }, id = mt.id, n = mt.n || 0;
    var ride = id === 'horse' || id === 'camel' ? n : id === 'elephant' ? n * 6 : 0;
    var pack = ['wagon', 'donkey', 'llama', 'yak', 'porter', 'camel', 'elephant'].indexOf(id) >= 0 && n > 0;
    return { id: id, ride: ride, pack: pack, name: id === 'elephant' ? '코끼리' : id === 'camel' ? '낙타' : '말' };
  }
  function upgraded(type) {
    if (type === 'adm') return sk('sword') >= 3 && sk('shoot') >= 3 && sk('gun') >= 3;
    var t = TYPES[type]; return !!(t.up && t.sk && sk(t.sk) >= 3);
  }
  function unitName(u) {
    if (u.side === 'en') return u.name;
    if (u.ally) return u.name || '사냥꾼';
    var t = TYPES[u.type]; return u.type === 'cav' && u.ride === '코끼리' ? (u.up ? '중장 코끼리대' : '코끼리대') : (u.up ? t.up : t.name);
  }
  function clsOf(u) { return u.side === 'me' ? TYPES[u.type].cls : u.cls; }
  function reachOf(u) { var c = clsOf(u); return c === 'cav' ? 'cav' : c === 'missile' || c === 'horsearcher' ? 'shot' : c === 'art' ? 'art' : 'melee'; }
  function vsK(a, d) { var t = LD().VS[clsOf(a)]; return (t && t[clsOf(d)]) || 1; }
  function abil(u) { return u.special && u.special.ability; }

  /** 우리 편 편성: 제독대 + 부대 (인원을 고르게 나눈다) */
  function formMine(P, guns) {
    var adm = Math.max(1, Math.min(12, Math.round(P * 0.12))), rest = Math.max(0, P - adm);
    var k = U.clamp(Math.floor(rest / 5), rest >= 3 ? 1 : 0, 5), out = [];
    for (var i = 0; i < k; i++) {
      var n = Math.floor(rest / k) + (i < rest % k ? 1 : 0);
      out.push({ side: 'me', type: i % 2 ? 'gun' : 'inf', n: n, n0: n });
    }
    var mi = mountInfo(), cap = mi.ride;
    out.forEach(function (u) { if (u.type === 'inf' && cap >= u.n) { u.type = 'cav'; cap -= u.n; } });
    if (guns && out.length >= 2) out[out.length - 1].type = 'art';
    out.push({ side: 'me', type: 'adm', n: adm, n0: adm, leader: true });
    return out;
  }
  function allowed(units, u, type, guns) {
    if (u.type === 'adm') return type === 'adm';
    if (type === 'adm') return false;
    if (type === 'cav') { var mi = mountInfo(), used = 0; units.forEach(function (o) { if (o !== u && o.type === 'cav') used += o.n; }); return mi.ride - used >= u.n; }
    if (type === 'art') return guns && !units.some(function (o) { return o !== u && o.type === 'art'; });
    return true;
  }
  function formFoe(e, regKey) {
    var F = FOES[e.kind] || FOES.bandit, n = Math.max(3, e.n), lead = Math.max(3, Math.round(n * 0.15)), rest = Math.max(2, n - lead);
    var k = U.clamp(Math.round(rest / 10), 2, 5), out = [];
    for (var i = 0; i < k; i++) {
      var m = Math.floor(rest / k) + (i < rest % k ? 1 : 0), ut = F.units[F.mix[i % F.mix.length]] || F.units[0];
      if (ut[3] === 'cannon' && n < 60) ut = F.units[0];
      out.push({ side: 'en', name: ut[0], cls: ut[1], pow: ut[2], look: ut[3], n: m, n0: m });
    }
    // 그 땅의 이름난 병사: 원주민·수비대와의 싸움에서 적이 20명을 넘으면 한 부대가 바뀐다
    var SP = regKey && LD().SPECIAL[regKey];
    if (SP && (e.kind === 'native' || e.kind === 'garrison') && n >= 20 && out.length) {
      var idx = SP.cls === 'missile' || SP.cls === 'horsearcher' ? out.map(function (u) { return u.cls; }).lastIndexOf('missile') : 0;
      var o = out[idx >= 0 ? idx : 0];
      o.name = SP.name; o.cls = SP.cls; o.pow = SP.pow; o.special = SP; o.look = SP.cls === 'missile' || SP.cls === 'horsearcher' ? 'bow' : SP.cls === 'art' ? 'cannon' : 'spear';
    }
    out.push({ side: 'en', name: e.leader || F.leader[0], cls: e.kind === 'beast' ? 'beast' : 'blade', pow: F.leader[1], look: e.kind === 'beast' ? 'beast' : 'chief', n: lead, n0: lead, leader: true });
    return out;
  }

  G.Games.landWar = function (opt) {
    var s = S(), f = s.fleet, e = opt.enemy, terr = opt.terr || 'grass', guns = !!opt.guns, K = BL();
    var P0 = Math.max(1, opt.party);
    var here = s.loc || {}, LA = ART(), regKey = LA ? LA.regionOf(here.lon || 0, here.lat || 0) : null, reg = LA && regKey ? LA.regions[regKey] : null;
    var mine = formMine(P0, guns), foes = formFoe(e, regKey), Fk = FOES[e.kind] || FOES.bandit;
    var foe0 = U.sum(foes, function (u) { return u.n; });
    var phase = 'form', over = false, busy = false, auto = false, sel = null, turnNo = 0, turnsDone = 0;
    var formation = 'line', scouted = false, scoutTried = false, revealed = false, hiddenMe = false, ambushBonus = 1, parleyTried = false;
    var used = {}, trapOn = false, stunEn = false, cryOn = false, ammoT = 0, fogT = 0, eventDone = false, roared = false, duelDone = false, onceUsed = {};
    var HOLD = Math.max(0, opt.hold || 0), rounds = 0, captured = 0;
    var fx = [], fxS = [], decals = [], shakeT = 0, freezeT = 0, t0 = performance.now(), log = [], cam = null, finalRes = null, hover = null, formSaid = false;   // fxS: 화면에 붙는 연출(배너·차례 카드·번쩍임) · decals: 땅에 남는 자국
    var mi = mountInfo();
    mine.forEach(function (u) { if (u.type === 'cav') u.ride = mi.name; });
    var CBN = G.Cabins, STAFF = CBN ? CBN.fx('staff', 'staff') : 0, STAFF_DMG = 1 + (CBN ? CBN.fx('staff', 'staffDmg') : 0);   // 참모실의 힘 (G.BALANCE.cabins.fx.staff·staffDmg)
    // 전장의 지형 (칸마다) · 날씨
    var feat = (TERR_FEAT[terr] || [null, null, null]).slice();
    feat = U.shuffle ? U.shuffle(feat) : feat;
    var hillSide = feat.map(function () { return U.chance(0.5) ? 'me' : 'en'; });
    var weather = terr === 'desert' ? 'heat' : (G.Rain && G.Rain.raining && G.Rain.raining()) || (terr === 'jungle' && U.chance(0.35)) ? 'rain' : 'clear';
    var SPR = G.Sprites, SFX = (G.FX && G.FX.sprites) || {}, useSpr = !!(SPR && LA && reg) && SFX.battle !== false;
    var bgImg = null, bgChain = I && I.chain && I.chain.landWarBackground ? I.chain.landWarBackground(terr) : [];
    if (I && bgChain.length) I.resolve(bgChain).then(function (res) { if (res) bgImg = res.img; });
    if (useSpr) {
      var need = ['swordsmen', 'musketeers', 'cannons', 'officers', 'animals'];
      ['m', 'r', 'l', 'c', 'bandit'].forEach(function (k) { if (reg[k] && need.indexOf(reg[k][0]) < 0) need.push(reg[k][0]); });
      SPR.preload(need);
      if (LA.cav[mi.name]) SPR.partyReady(LA.cav[mi.name]);
      foes.forEach(function (u) { if (u.special && u.special.party) SPR.partyReady(u.special.party); });
    }
    // 끝나면 시작할 때의 곡(장면·건물)으로 돌린다 — 늘 뭍 곡('land')으로 바꿔 도시·바다에서 맞지 않던 것 (QA 2026-10-23)
    var musicBack = G.Audio ? { want: G.Audio.want, place: G.Audio.place } : null;
    if (G.Audio) G.Audio.music('landwar');
    // 동료 지휘관 후보 (다치지 않은 부하)
    var cmdrPool = (s.mates || []).filter(function (m) { return G.MATE[m.id] && !(R.mateHurt && R.mateHurt(m)) && !(R.mateHidden && R.mateHidden(m)); });
    function mateRow(id) { return (s.mates || []).filter(function (m) { return m.id === id; })[0] || null; }
    function msk(u) { return u && u.cmdr ? LD().MATE_SKILL[u.cmdr] || null : null; }
    function anyMsk(kind) { return mine.filter(function (u) { var m = msk(u); return m && m.kind === kind && (u.n > 0 || u.leader); }).map(msk); }
    function kit() { return G.LandKit ? G.LandKit.cover : function () { return 0; }; }

    return new Promise(function (resolve) {
      var html = '<div class="lwar"><div class="lw-stage"><canvas width="' + W + '" height="' + H + '"></canvas><div class="lw-pop" hidden></div><div class="lw-tip" hidden></div></div>' +
        '<div class="lw-bar"><div class="lw-log"></div><div class="lw-btns"></div></div></div>';
      var win = UI.window({ title: '육상전 — ' + e.name, icon: 'sword', width: 1080, html: html, closable: false });
      var el = win.content, cv = el.querySelector('canvas'), ctx = cv.getContext('2d'), btns = el.querySelector('.lw-btns'), logEl = el.querySelector('.lw-log');
      var popEl = el.querySelector('.lw-pop'), tipEl = el.querySelector('.lw-tip'), unitsEl = popEl;   // 부대 명령은 그림 위에 뜨는 작은 창에서 한다
      function say(t) { log.push(t); logEl.innerHTML = log.slice(-2).map(function (x, i, a) { return '<div' + (i < a.length - 1 ? ' class="old"' : '') + '>' + x + '</div>'; }).join(''); }

      // ------------------------------------------------ 자리 (줄 · 칸)
      function alive(list) { return list.filter(function (u) { return u.n > 0; }); }
      function sideOf(u) { return u.side === 'me' ? mine : foes; }
      function minLine(list) { var a = alive(list); return a.length ? Math.min.apply(null, a.map(function (u) { return u.line; })) : 0; }
      function eff(u) { return u.line - minLine(sideOf(u)); }
      function cellFree(list, line, lane, except) { return !alive(list).some(function (u) { return u !== except && u.line === line && u.lane === lane; }); }
      function putAt(list, u, lines) {
        var order = [1, 0, 2];
        for (var li = 0; li < lines.length; li++) for (var j = 0; j < 3; j++) { var ln = order[j]; if (cellFree(list, lines[li], ln, u)) { u.line = lines[li]; u.lane = ln; return; } }
        u.line = 2; u.lane = 1;
      }
      function arrange() {
        mine.forEach(function (u) { u.line = null; });
        var rest = mine.filter(function (u) { return !u.leader; });
        var adm = mine.filter(function (u) { return u.leader; })[0];
        if (adm) { adm.line = 2; adm.lane = 1; }
        if (formation === 'deep') {
          rest.filter(function (u) { return u.type === 'inf' || u.type === 'cav' || u.ally; }).forEach(function (u) { putAt(mine, u, [0, 1, 2]); });
          rest.filter(function (u) { return u.type === 'gun'; }).forEach(function (u) { putAt(mine, u, [1, 2, 0]); });
          rest.filter(function (u) { return u.type === 'art'; }).forEach(function (u) { putAt(mine, u, [2, 1, 0]); });
        } else {
          rest.filter(function (u) { return u.type !== 'art'; }).forEach(function (u) { putAt(mine, u, [0, 1, 2]); });
          rest.filter(function (u) { return u.type === 'art'; }).forEach(function (u) { putAt(mine, u, [2, 1, 0]); });
        }
      }
      function arrangeFoes() {
        foes.forEach(function (u) { u.line = null; });
        var lead = foes.filter(function (u) { return u.leader; })[0];
        lead.line = e.kind === 'beast' ? 1 : 2; lead.lane = 1;
        foes.filter(function (u) { return !u.leader && reachOf(u) === 'melee' || (!u.leader && reachOf(u) === 'cav'); }).forEach(function (u) { putAt(foes, u, [0, 1, 2]); });
        foes.filter(function (u) { return !u.leader && reachOf(u) === 'shot'; }).forEach(function (u) { putAt(foes, u, [1, 0, 2]); });
        foes.filter(function (u) { return !u.leader && reachOf(u) === 'art'; }).forEach(function (u) { putAt(foes, u, [2, 1, 0]); });
      }
      arrange(); arrangeFoes();
      function home(u) { var me = u.side === 'me', x = LX[u.line], y = LY[u.lane]; return [me ? x : W - x, y]; }
      function place() { mine.concat(foes).forEach(function (u) { if (u.line == null) return; var p = home(u); u.tx = p[0]; u.ty = p[1]; if (u.x == null) { u.x = u.tx + (u.side === 'me' ? -160 : 160); u.y = u.ty; } }); }
      place();

      // ------------------------------------------------ 그리기
      function fig(x, y, look, col, k, face, t) {
        ctx.save(); ctx.translate(x, y); ctx.scale(face * k, k);
        var bob = Math.sin(t * 3 + x * 0.1) * 0.8;
        if (look === 'beast') {
          ctx.fillStyle = col[0]; ctx.beginPath(); ctx.ellipse(0, -8 + bob, 13, 6, 0, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.ellipse(12, -12 + bob, 6, 4.5, -0.3, 0, 7); ctx.fill();
          ctx.fillRect(-10, -4, 2.5, 8); ctx.fillRect(-4, -4, 2.5, 8); ctx.fillRect(4, -4, 2.5, 8); ctx.fillRect(9, -4, 2.5, 8);
          ctx.beginPath(); ctx.moveTo(15, -16 + bob); ctx.lineTo(17, -21 + bob); ctx.lineTo(13, -16 + bob); ctx.fill();
          ctx.restore(); return;
        }
        if (look === 'cav') {
          ctx.fillStyle = '#5a3a22'; ctx.beginPath(); ctx.ellipse(0, -12 + bob, 15, 7, 0, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.ellipse(15, -19 + bob, 5, 8, 0.5, 0, 7); ctx.fill();
          ctx.fillRect(-11, -7, 3, 11); ctx.fillRect(-5, -7, 3, 11); ctx.fillRect(5, -7, 3, 11); ctx.fillRect(10, -7, 3, 11);
          ctx.translate(0, -16);
        }
        if (look === 'cannon') {
          ctx.fillStyle = '#2a2a2e'; ctx.fillRect(-4, -12, 24, 7); ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.arc(0, -4, 6, 0, 7); ctx.fill();
          ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(0, -4, 2, 0, 7); ctx.fill();
          ctx.translate(-14, 0);
        }
        // 사람
        ctx.fillStyle = col[0]; ctx.fillRect(-4, -20 + bob, 8, 13);
        ctx.fillStyle = col[1]; ctx.fillRect(-4, -8 + bob, 3, 8); ctx.fillRect(1, -8 + bob, 3, 8);
        ctx.fillStyle = '#d8a878'; if (look === 'spear' || look === 'bow' || look === 'chief') ctx.fillStyle = '#8a5a3a';
        ctx.beginPath(); ctx.arc(0, -25 + bob, 4.5, 0, 7); ctx.fill();
        ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 1.6;
        if (look === 'sword' || look === 'blade' || look === 'cav' || look === 'adm') { ctx.strokeStyle = '#e8e8f0'; ctx.beginPath(); ctx.moveTo(4, -16 + bob); ctx.lineTo(13, -26 + bob); ctx.stroke(); }
        if (look === 'musket' || look === 'gunner') { ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-2, -16 + bob); ctx.lineTo(16, -19 + bob); ctx.stroke(); }
        if (look === 'spear' || look === 'pike') { ctx.strokeStyle = '#6a4a2a'; ctx.beginPath(); ctx.moveTo(3, -4 + bob); ctx.lineTo(8, -40 + bob); ctx.stroke(); ctx.fillStyle = '#ccc'; ctx.beginPath(); ctx.moveTo(8, -44 + bob); ctx.lineTo(10, -38 + bob); ctx.lineTo(6, -38 + bob); ctx.fill(); }
        if (look === 'bow') { ctx.strokeStyle = '#6a4a2a'; ctx.beginPath(); ctx.arc(6, -18 + bob, 9, -1.2, 1.2); ctx.stroke(); }
        if (look === 'chief') { ctx.fillStyle = '#e0b040'; for (var q = 0; q < 5; q++) { ctx.beginPath(); ctx.ellipse(-4 + q * 2, -32 + bob, 1.4, 5, (q - 2) * 0.3, 0, 7); ctx.fill(); } ctx.strokeStyle = '#e8e8f0'; ctx.beginPath(); ctx.moveTo(4, -16 + bob); ctx.lineTo(14, -24 + bob); ctx.stroke(); }
        if (look === 'adm') { ctx.fillStyle = '#1a1a2a'; ctx.fillRect(-6, -31 + bob, 12, 3); ctx.fillRect(-3, -35 + bob, 6, 4); }
        if (look === 'hat') { ctx.fillStyle = '#2a2020'; ctx.fillRect(-5, -30 + bob, 10, 3); }
        ctx.restore();
      }
      /** 우리 편 단계 (0~3): 보병 = 검술, 총병 = 사격술, 포병 = 포술, 제독대 = 세 솜씨의 평균 (셋 다 3이면 전설) */
      function tierOf(u) {
        var skill = LA.mine[u.type] && LA.mine[u.type][1];
        if (skill) return U.clamp(sk(skill), 0, 3);
        if (u.type === 'adm') return upgraded('adm') ? 3 : U.clamp(Math.floor((sk('sword') + sk('shoot') + sk('gun')) / 3), 0, 2);
        return 0;
      }
      function sprOf(u) {
        if (!useSpr) return null;
        if (u._spr !== undefined && u._sprType === u.type) return u._spr;
        var me = u.side === 'me', r = null, L = null;
        if (me && u.type === 'cav') r = LA.cav[u.ride] ? { party: LA.cav[u.ride] } : null;
        else if (me) { var mm = LA.mine[u.type]; if (mm) r = { id: mm[0], row: tierOf(u) }; }
        else if (u.special && u.special.party) r = { party: u.special.party };
        else if (u.look === 'beast') r = { id: 'animals', row: SPR.row('animals', u.leader ? reg.b[1] : reg.b[0]), beast: 1 };
        else {
          L = u.special ? (reg[u.special.look] || reg.m)
            : u.leader ? reg.l
            : u.look === 'cannon' ? (reg.c || reg.m)
            : u.look === 'bow' || u.look === 'musket' ? reg.r
            : u.look === 'blade' && reg.bandit ? reg.bandit
            : reg.m;
          if (L) r = { id: L[0], row: SPR.row(L[0], L[1]) };
        }
        if (r && r.id && !(r.row >= 0)) r = null;
        u._spr = r; u._sprType = u.type;
        return r;
      }
      function actOf(u) {
        if (u.n <= 0) return 'dead';
        if (u.act && u.actT < (u.act === 'attack' ? 0.75 : 0.45)) return u.act;
        return Math.abs(u.tx - u.x) + Math.abs(u.ty - u.y) > 4 ? 'walk' : 'idle';
      }
      /** 그림 시트로 부대를 그린다 — 그림이 없거나 끝내 못 받았으면 false (코드 그림으로) */
      function drawSprUnit(u, sp, x, y, face, t) {
        var act = actOf(u), fps = SFX.battleFps || {}, k0 = u.leader ? 1.22 : 1;
        if (sp.party) {
          if (!SPR.partyReady(sp.party)) return SPR.partyPending(sp.party);   // 받는 중이면 비워 두고 기다린다
          var nfp = SPR.partyFrames(sp.party), kk = (SFX.unitH || 50) * 1.2 / SPR.partyHeight(sp.party) * k0;
          var moving = act === 'walk' || act === 'attack';   // 그림 한 장이 말 탄 세 사람 — 겹쳐 그리지 않는다
          SPR.drawParty(ctx, sp.party, face > 0 ? 2 : 6, moving ? Math.floor(t * 9) % nfp : 0, x, y, kk);
          return true;
        }
        var id = sp.id, row = sp.row;
        if (!SPR.ready(id)) return SPR.pending(id);
        var k = ((sp.beast ? SFX.beastH : SFX.unitH) || 46) / SPR.bodyH(id) * k0 * ((SFX.sheetK || {})[id] || 1);
        var big = id === 'cannons' || (id === 'ottoman' && row === 1);
        var nf = U.clamp(Math.ceil(u.n / 4), 1, big ? 2 : sp.beast ? 3 : 6), gap = big ? 58 : sp.beast ? 42 : 24;
        for (var i = 0; i < nf; i++) {
          var col = i % 3, back = i >= 3, inRow = back ? nf - 3 : Math.min(nf, 3);
          var fx0 = x + (col - (inRow - 1) / 2) * gap * face - (back ? 10 * face : 0), fy0 = y - (back ? 14 : 0) + (col === 1 ? 5 : 0);
          var fr = act === 'dead' ? SPR.at(id, row, 'dead', 99, 1, false)
            : act === 'idle' || act === 'walk' ? SPR.at(id, row, act, t + i * 0.37, fps[act] || 6)
            : SPR.at(id, row, act, (u.actT || 0) - i * 0.04, fps[act] || 10, false);
          SPR.draw(ctx, id, row, fr, fx0, fy0, k, face < 0);
        }
        return true;
      }
      /** 부대가 달려 나가 부딪히는 몸놀림: u.rush = {dx, dy, t} — 0.55초 동안 목표 쪽으로 갔다가 돌아온다 */
      function rushOff(u) {
        if (!u.rush) return [0, 0];
        var p = U.clamp(u.rush.t / 0.55, 0, 1), k = Math.sin(p * Math.PI);
        return [u.rush.dx * k, u.rush.dy * k];
      }
      function drawUnit(u, t) {
        if (u.n <= 0 && !(u.fade > 0)) return;
        var me = u.side === 'me', face = me ? 1 : -1, ro = rushOff(u), x = u.x + ro[0] - (u.recoil || 0) * 12 * face, y = u.y + ro[1];
        if (u.cheer && u.n > 0) y -= Math.abs(Math.sin(t * 7 + u.lane * 1.7 + u.line)) * 9;   // 이겼다 — 펄쩍펄쩍
        var look = me ? (u.type === 'inf' ? 'sword' : u.type === 'gun' ? 'musket' : u.type === 'cav' ? 'cav' : u.type === 'art' ? 'cannon' : 'adm') : u.look;
        var col = me ? (u.type === 'adm' ? ['#1d3f7a', '#e8dcc0'] : u.ally ? ['#4a6a3a', '#d8ccb0'] : ['#2a4a7a', '#d8ccb0']) : Fk.col;
        var nf = U.clamp(Math.ceil(u.n / 4), 1, look === 'cav' || look === 'cannon' ? 3 : 6), k = u.leader ? 1.25 : 1;
        ctx.save(); if (u.n <= 0) ctx.globalAlpha = Math.max(0, u.fade);
        if (me && hiddenMe && u.n > 0) ctx.globalAlpha = 0.55;   // 매복 중 (숨어 있다)
        ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 52, 12, 0, 0, 7); ctx.fill();
        if (sel === u) { ctx.strokeStyle = 'rgba(120,220,255,' + (0.7 + 0.3 * Math.sin(t * 6)) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y + 4, 60, 16, 0, 0, 7); ctx.stroke(); }
        else if (hover === u && u.n > 0 && !over) { ctx.strokeStyle = me ? 'rgba(200,240,255,.55)' : 'rgba(255,200,170,.55)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y + 4, 58, 15, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
        if (sel && sel.ord && sel.ord.target === u) { ctx.strokeStyle = 'rgba(255,90,60,' + (0.6 + 0.3 * Math.sin(t * 6)) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y + 4, 60, 16, 0, 0, 7); ctx.stroke(); }
        var sp = sprOf(u);
        if (!(sp && drawSprUnit(u, sp, x, y, face, t))) {
          for (var i = 0; i < nf; i++) {
            var fx0 = x + ((i % 3) - 1) * (look === 'cav' ? 30 : 17) - (i >= 3 ? 8 : 0), fy0 = y - (i >= 3 ? 14 : 0) + ((i % 3) === 1 ? 5 : 0);
            fig(fx0, fy0, look === 'musket' && u.side === 'me' ? 'musket' : look, col, k, face, t);
          }
        }
        if (u.hitT > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,160,120,' + u.hitT * 1.2 + ')'; ctx.beginPath(); ctx.ellipse(x, y - 16, 55, 28, 0, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
        ctx.restore();
        if (u.n <= 0) return;
        // 이름·인원·막대
        var fam = getComputedStyle(document.body).fontFamily;
        ctx.font = '700 14px ' + fam; ctx.textAlign = 'center';
        var known = me || revealed || scouted;
        var label = (u.leader ? '★ ' : '') + (known ? unitName(u) : '적 부대') + ' ' + (known ? u.n : '약 ' + Math.max(5, Math.round(u.n / 5) * 5));
        var tw = ctx.measureText(label).width + 12;
        ctx.fillStyle = me ? (u.ally ? 'rgba(30,60,30,.82)' : 'rgba(20,34,64,.82)') : 'rgba(70,20,16,.82)'; ctx.fillRect(x - tw / 2, y + 12, tw, 19);
        ctx.fillStyle = u.leader ? '#ffe08a' : '#f2e7cc'; ctx.fillText(label, x, y + 26);
        ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x - 36, y + 33, 72, 5);
        ctx.fillStyle = me ? '#6aa86a' : '#d05040'; ctx.fillRect(x - 36, y + 33, 72 * U.clamp(u.n / u.n0, 0, 1), 5);
        // 지휘관 · 이름난 병사 · 독
        ctx.font = '600 11px ' + fam;
        var tag = me && u.cmdr && G.MATE[u.cmdr] ? '지휘 ' + G.MATE[u.cmdr].name.split(' ')[0] : (!me && known && u.special ? LD().ABILITY[u.special.ability] || LD().CLS_NAME[u.cls] || '' : '');
        if (tag) { var tw2 = ctx.measureText(tag).width + 8; ctx.fillStyle = me ? 'rgba(200,170,90,.9)' : 'rgba(150,60,40,.9)'; ctx.fillRect(x - tw2 / 2, y + 40, tw2, 14); ctx.fillStyle = '#1a1208'; ctx.fillText(tag, x, y + 51); }
        if (u.poison > 0) { ctx.fillStyle = '#7ad04a'; ctx.fillText('독', x + 44, y - 4); }
        // 명령 · 적의 다음 행동
        var o = me ? u.ord : u.intent;
        var full = o && o.act && (hover === u || sel === u || (o.target && sel === o.target) || (!me && ['wait', 'adv', 'stun'].indexOf(o.act) < 0) || (me && !o.auto && !sel));
        if (phase === 'fight' && !over && o && o.act && (me || revealed) && !full && !busy) {
          // 덜 중요한 명령은 작은 동그라미 하나로 (부대를 고르거나 마우스를 올리면 자세히)
          var ai = (ACT[o.act] || ACT.attack).icon; ctx.font = fontOf(800, 13);
          ctx.fillStyle = me ? 'rgba(20,50,80,.8)' : 'rgba(90,30,20,.8)'; var ix = x - face * 50; ctx.beginPath(); ctx.arc(ix, y - 46, 10, 0, 7); ctx.fill(); ctx.fillStyle = '#fff2cc'; ctx.fillText(ai, ix, y - 41.5);   // 부대 옆에 붙여 다른 줄 이름표와 겹치지 않게
        }
        if (phase === 'fight' && !over && o && o.act && (me || revealed) && full && !(busy && me)) {
          var a = ACT[o.act] || ACT.attack, nm = a.icon + ' ' + (me && u.type === 'gun' && o.act === 'attack' ? '사격' : me && u.type === 'art' && o.act === 'attack' ? '포격' : a.name) + (o.target && o.target.n > 0 ? ' → ' + (o.target.side === 'me' ? unitName(o.target) : (revealed ? o.target.name : '적')) : '');
          ctx.font = '700 13px ' + fam; var tw3 = ctx.measureText(nm).width + 10;
          ctx.fillStyle = me ? 'rgba(20,50,80,.85)' : (o.act === 'charge' || o.act === 'roar' || o.act === 'volley' || o.act === 'ambush' || o.act === 'duel' ? 'rgba(150,30,20,.92)' : 'rgba(90,30,20,.85)');
          ctx.fillRect(x - tw3 / 2, y - 84, tw3, 17); ctx.fillStyle = '#fff2cc'; ctx.fillText(nm, x, y - 71);
        }
        // 고른 우리 부대에서 본 상성
        if (!me && sel && sel.n > 0 && phase === 'fight' && known) {
          var v = vsK(sel, u);
          if (v >= 1.15 || v <= 0.87) { ctx.font = '800 18px ' + fam; ctx.fillStyle = v >= 1.15 ? '#7ae07a' : '#ff8a70'; ctx.fillText(v >= 1.15 ? '▲' : '▼', x - 46, y - 40); }
        }
      }
      function drawField(t) {
        // 칸마다의 지형
        for (var ln = 0; ln < 3; ln++) {
          var ft = feat[ln], y = LY[ln];
          if (!ft) continue;
          if (ft === 'woods') {
            [-1, 1].forEach(function (sd) {
              var cx = sd < 0 ? 210 : W - 210;
              for (var k = 0; k < 7; k++) { var tx = cx - 150 + k * 50, ty = y - 30 + (k % 2) * 8; ctx.fillStyle = 'rgba(30,60,30,.55)'; ctx.beginPath(); ctx.moveTo(tx - 16, ty + 12); ctx.lineTo(tx, ty - 26); ctx.lineTo(tx + 16, ty + 12); ctx.fill(); }
            });
          } else if (ft === 'hill') {
            var hx = hillSide[ln] === 'me' ? 280 : W - 280;
            ctx.fillStyle = 'rgba(120,100,60,.32)'; ctx.beginPath(); ctx.ellipse(hx, y + 10, 190, 34, 0, Math.PI, 0); ctx.fill();
            ctx.strokeStyle = 'rgba(80,60,30,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(hx, y + 10, 190, 34, 0, Math.PI, 0); ctx.stroke();
          } else if (ft === 'stream') {
            ctx.strokeStyle = 'rgba(90,150,210,.55)'; ctx.lineWidth = 9; ctx.beginPath();
            for (var xx = 0; xx <= 60; xx++) { var px = W / 2 - 30 + Math.sin(xx * 0.3 + t) * 10, py = y - 50 + xx * 1.7; if (!xx) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
            ctx.stroke();
          }
          ctx.font = '700 12px ' + getComputedStyle(document.body).fontFamily; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,248,220,.85)';
          ctx.fillText(FEAT_NAME[ft] + (ft === 'hill' ? (hillSide[ln] === 'me' ? ' (우리 쪽)' : ' (적 쪽)') : ''), ft === 'hill' ? (hillSide[ln] === 'me' ? 280 : W - 280) : W / 2, y - 60);
        }
      }
      function drawWeather(t) {
        if (weather === 'rain') { ctx.strokeStyle = 'rgba(200,220,255,.35)'; ctx.lineWidth = 1.2; for (var i = 0; i < 90; i++) { var x = (i * 97 + t * 400) % (W + 40) - 20, y = (i * 53 + t * 700) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 16); ctx.stroke(); } }
        if (fogT > 0) { ctx.fillStyle = 'rgba(230,232,236,.38)'; ctx.fillRect(0, 0, W, H); }
        if (weather === 'heat') { ctx.fillStyle = 'rgba(255,200,120,' + (0.05 + 0.02 * Math.sin(t * 2)) + ')'; ctx.fillRect(0, 0, W, H); }
      }
      function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); }
      function fontOf(w, px) { return w + ' ' + px + 'px ' + FAM; }
      var FAM = getComputedStyle(document.body).fontFamily;
      /** 땅에 남는 자국: 쓰러진 병사 · 포탄 구덩이 · 꽂힌 화살 */
      function drawDecals() {
        decals.forEach(function (d) {
          ctx.save(); ctx.translate(d.x, d.y); ctx.globalAlpha = d.a;
          if (d.kind === 'crater') { ctx.fillStyle = 'rgba(40,30,20,.45)'; ctx.beginPath(); ctx.ellipse(0, 0, 22, 7, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(90,70,40,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, -1, 26, 9, 0, 0, 7); ctx.stroke(); }
          else if (d.kind === 'arrow') { ctx.strokeStyle = 'rgba(50,35,20,.7)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(d.r * 7, -9); ctx.stroke(); }
          else { ctx.rotate(d.r); ctx.fillStyle = d.me ? 'rgba(30,45,80,.55)' : 'rgba(80,35,25,.55)'; ctx.fillRect(-7, -2.5, 14, 5); ctx.fillStyle = 'rgba(60,40,30,.5)'; ctx.beginPath(); ctx.arc(9, 0, 3, 0, 7); ctx.fill(); }
          ctx.restore();
        });
      }
      function addDecal(kind, x, y, extra) { decals.push(Object.assign({ kind: kind, x: x, y: y, a: 1, r: U.rf(-0.6, 0.6) }, extra || {})); if (decals.length > 90) decals.shift(); }
      /** 말풍선 (부대 머리 위) */
      function bubble(u, text, life) {
        if (!u || opt.fastEnd) return;
        fx = fx.filter(function (b) { return !(b.kind === 'bubble' && b.u === u); });
        fx.push({ kind: 'bubble', u: u, text: text, t: 0, life: life || 1.6 });
      }
      function shout(u, kind, p) { if (u && (p == null || U.chance(p))) bubble(u, U.pick(SHOUT[kind] || SHOUT.attack)); }
      function drawWorldFx() {
        fx.forEach(function (e) {
          var k2 = e.t / e.life; if (e.t < 0) return;
          if (e.kind === 'ball' || e.kind === 'arrow' || e.kind === 'shot') {
            var gx = e.x0 + (e.x1 - e.x0) * k2, gy = e.y0 + (e.y1 - e.y0) * k2;
            var px = gx, py = gy - Math.sin(k2 * Math.PI) * (e.kind === 'ball' ? 120 : e.kind === 'arrow' ? 60 : 4);
            if (e.kind !== 'shot') { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(gx, gy + 26, e.kind === 'ball' ? 7 : 4, e.kind === 'ball' ? 2.5 : 1.5, 0, 0, 7); ctx.fill(); }   // 땅 그림자
            if (e.kind === 'ball') { ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(px, py, 5.5, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,160,60,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - (e.x1 - e.x0) * 0.04, py + 6); ctx.stroke(); }
            else if (e.kind === 'arrow') { var ang = Math.atan2((e.y1 - e.y0) - Math.cos(k2 * Math.PI) * 60 * Math.PI, e.x1 - e.x0); ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - Math.cos(ang) * 14, py - Math.sin(ang) * 14); ctx.stroke(); }
            else { ctx.strokeStyle = 'rgba(255,240,180,' + (1 - k2) + ')'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - (e.x1 - e.x0) * 0.06, py - (e.y1 - e.y0) * 0.06); ctx.stroke(); }
          } else if (e.kind === 'smoke') { ctx.fillStyle = 'rgba(232,232,226,' + 0.55 * (1 - k2) + ')'; ctx.beginPath(); ctx.arc(e.x + k2 * 26 * e.d, e.y - k2 * 18, 8 + k2 * 22, 0, 7); ctx.fill(); }
          else if (e.kind === 'dust') { ctx.fillStyle = 'rgba(170,150,110,' + 0.5 * (1 - k2) + ')'; ctx.beginPath(); ctx.arc(e.x + e.vx * e.t, e.y + e.vy * e.t, e.r * (1 + k2 * 1.4), 0, 7); ctx.fill(); }
          else if (e.kind === 'debris') { var dx = e.x + e.vx * e.t, dy = e.y + e.vy * e.t + 420 * e.t * e.t; ctx.fillStyle = 'rgba(60,45,30,' + (1 - k2) + ')'; ctx.fillRect(dx, dy, 3, 3); }
          else if (e.kind === 'flash') { ctx.fillStyle = 'rgba(255,230,140,' + (1 - k2) + ')'; ctx.beginPath(); ctx.arc(e.x, e.y, (e.r || 6) + k2 * 6, 0, 7); ctx.fill(); }
          else if (e.kind === 'boom') { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,' + Math.round(200 - k2 * 150) + ',80,' + (1 - k2) * 0.9 + ')'; ctx.beginPath(); ctx.arc(e.x, e.y, 10 + k2 * 44, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(80,70,60,' + 0.5 * (1 - k2) + ')'; ctx.beginPath(); ctx.arc(e.x, e.y - k2 * 34, 14 + k2 * 32, 0, 7); ctx.fill(); }
          else if (e.kind === 'clash') { ctx.strokeStyle = 'rgba(255,245,200,' + (1 - k2) + ')'; ctx.lineWidth = 2.5; for (var r = 0; r < 8; r++) { var a = r / 8 * 6.28 + e.seed; ctx.beginPath(); ctx.moveTo(e.x + Math.cos(a) * 6, e.y + Math.sin(a) * 6); ctx.lineTo(e.x + Math.cos(a) * (14 + k2 * 26), e.y + Math.sin(a) * (14 + k2 * 26)); ctx.stroke(); } }
          else if (e.kind === 'slash') { ctx.strokeStyle = 'rgba(255,255,255,' + (1 - k2) + ')'; ctx.lineWidth = 4 * (1 - k2) + 1; ctx.beginPath(); ctx.arc(e.x, e.y, 30, e.a0, e.a0 + Math.min(1, k2 * 3) * 2.2); ctx.stroke(); }
          else if (e.kind === 'ring') { ctx.strokeStyle = 'rgba(' + e.col + ',' + (1 - k2) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(e.x, e.y + 4, 40 + k2 * 40, 12 + k2 * 12, 0, 0, 7); ctx.stroke(); }
          else if (e.kind === 'num') { ctx.font = fontOf(800, e.big ? 28 : 22); ctx.textAlign = 'center'; ctx.lineWidth = 4; var ny = e.y - k2 * 40 - (k2 < 0.15 ? (0.15 - k2) * 60 : 0); ctx.strokeStyle = 'rgba(0,0,0,' + (1 - k2) + ')'; ctx.strokeText(e.text, e.x, ny); ctx.fillStyle = 'rgba(' + e.col + ',' + (1 - k2) + ')'; ctx.fillText(e.text, e.x, ny); }
          else if (e.kind === 'word') { var sc = k2 < 0.12 ? 0.6 + k2 / 0.12 * 0.6 : 1.2 - Math.min(0.2, (k2 - 0.12)); ctx.save(); ctx.translate(e.x, e.y - k2 * 20); ctx.scale(sc, sc); ctx.font = fontOf(900, 26); ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(60,10,0,' + (1 - k2) + ')'; ctx.strokeText(e.text, 0, 0); ctx.fillStyle = 'rgba(255,' + (e.col || '220,60') + ',' + (1 - k2) + ')'; ctx.fillText(e.text, 0, 0); ctx.restore(); }
          else if (e.kind === 'spike') { ctx.fillStyle = 'rgba(90,60,30,' + (1 - k2) + ')'; for (var sp = 0; sp < 7; sp++) { var sx = e.x - 50 + sp * 16; ctx.beginPath(); ctx.moveTo(sx - 5, e.y + 8); ctx.lineTo(sx, e.y - 14 * Math.min(1, k2 * 4)); ctx.lineTo(sx + 5, e.y + 8); ctx.fill(); } }
          else if (e.kind === 'flag') { var al2 = 1 - k2 * 0.3; ctx.strokeStyle = 'rgba(60,40,20,' + al2 + ')'; ctx.lineWidth = 3; ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(Math.min(1.3, k2 * 4)); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -40); ctx.stroke(); ctx.fillStyle = e.me ? 'rgba(40,70,140,' + al2 + ')' : 'rgba(150,40,30,' + al2 + ')'; ctx.fillRect(0, -40, 22, 14); ctx.restore(); }
          else if (e.kind === 'pop') { var pk = Math.min(1, k2 * 5), py2 = e.u.y - 104 - Math.sin(Math.min(1, k2 * 4) * Math.PI) * 8; ctx.save(); ctx.globalAlpha = k2 > 0.7 ? (1 - k2) / 0.3 : 1; ctx.translate(e.u.x + 44, py2); ctx.scale(pk, pk); ctx.fillStyle = '#d83a20'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = fontOf(900, 16); ctx.textAlign = 'center'; ctx.fillText('!', 0, 6); ctx.restore(); }
          else if (e.kind === 'bubble') {
            var u2 = e.u, bx = u2.x + rushOff(u2)[0], by = u2.y - 112, pk2 = Math.min(1, k2 * 6), al3 = k2 > 0.8 ? (1 - k2) / 0.2 : 1;
            ctx.save(); ctx.globalAlpha = al3; ctx.translate(bx, by); ctx.scale(pk2, pk2);
            ctx.font = fontOf(800, 14); var bw = ctx.measureText(e.text).width + 18, me2 = u2.side === 'me';
            ctx.fillStyle = me2 ? 'rgba(255,252,240,.96)' : 'rgba(255,236,226,.96)'; ctx.strokeStyle = me2 ? '#2a4a7a' : '#8a2a1a'; ctx.lineWidth = 2;
            rrect(-bw / 2, -14, bw, 26, 9); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-6, 11); ctx.lineTo(0, 20); ctx.lineTo(6, 11); ctx.fill();
            ctx.fillStyle = '#1a1208'; ctx.textAlign = 'center'; ctx.fillText(e.text, 0, 5); ctx.restore();
          }
        });
      }
      /** 화면에 붙는 연출 — 카메라가 다가가도 잘리지 않는다 */
      function drawScreenFx() {
        fxS.forEach(function (e) {
          var k2 = e.t / e.life; if (e.t < 0) return;
          var al = k2 < 0.15 ? k2 / 0.15 : k2 > 0.75 ? (1 - k2) / 0.25 : 1;
          if (e.kind === 'banner') { ctx.font = fontOf(800, 38); ctx.textAlign = 'center'; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,10,0,' + al + ')'; ctx.strokeText(e.text, W / 2, 70); ctx.fillStyle = 'rgba(255,226,140,' + al + ')'; ctx.fillText(e.text, W / 2, 70); }
          else if (e.kind === 'flashS') { ctx.fillStyle = 'rgba(' + (e.col || '255,255,255') + ',' + (1 - k2) * (e.a || 0.35) + ')'; ctx.fillRect(0, 0, W, H); }
          else if (e.kind === 'turn') {
            var ty = -30 + Math.min(1, k2 * 6) * 52; ctx.globalAlpha = al; ctx.font = fontOf(800, 20); ctx.textAlign = 'center';
            var tw = ctx.measureText(e.text).width + 40; ctx.fillStyle = 'rgba(20,14,8,.78)'; rrect(W / 2 - tw / 2, ty - 22, tw, 32, 16); ctx.fill();
            ctx.strokeStyle = 'rgba(220,180,90,.9)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#ffe2a0'; ctx.fillText(e.text, W / 2, ty); ctx.globalAlpha = 1;
          } else if (e.kind === 'vs') {
            var sl = Math.min(1, e.t / 0.35), ease = 1 - Math.pow(1 - sl, 3), out = k2 > 0.78 ? (k2 - 0.78) / 0.22 : 0;
            ctx.save(); ctx.globalAlpha = 1 - out;
            ctx.fillStyle = 'rgba(0,0,0,' + 0.35 * (1 - out) + ')'; ctx.fillRect(0, 0, W, H);
            var lx = -W / 2 + ease * W / 2, rx = W - ease * W / 2;
            ctx.fillStyle = 'rgba(28,52,96,.92)'; ctx.beginPath(); ctx.moveTo(lx, H / 2 - 64); ctx.lineTo(lx + W / 2 + 30, H / 2 - 64); ctx.lineTo(lx + W / 2 - 10, H / 2 + 54); ctx.lineTo(lx, H / 2 + 54); ctx.fill();
            ctx.fillStyle = 'rgba(120,28,20,.92)'; ctx.beginPath(); ctx.moveTo(rx + 30, H / 2 - 64); ctx.lineTo(rx + W / 2, H / 2 - 64); ctx.lineTo(rx + W / 2, H / 2 + 54); ctx.lineTo(rx - 10, H / 2 + 54); ctx.fill();
            ctx.textAlign = 'center'; ctx.fillStyle = '#f6ecd0'; ctx.font = fontOf(800, 28); ctx.fillText(e.a, lx + W / 4, H / 2 - 6); ctx.fillText(e.b, rx + W / 4 + 10, H / 2 - 6);
            ctx.font = fontOf(600, 16); ctx.fillStyle = 'rgba(246,236,208,.85)'; ctx.fillText(e.a2, lx + W / 4, H / 2 + 24); ctx.fillText(e.b2, rx + W / 4 + 10, H / 2 + 24);
            var vk = Math.min(1, Math.max(0, (e.t - 0.3) / 0.2)); ctx.save(); ctx.translate(W / 2 + 10, H / 2 - 4); ctx.scale(0.5 + vk * 0.5 + (1 - vk) * 1.5, 0.5 + vk * 0.5 + (1 - vk) * 1.5); ctx.globalAlpha = vk * (1 - out);
            ctx.font = fontOf(900, 54); ctx.lineWidth = 7; ctx.strokeStyle = '#1a0e04'; ctx.strokeText('VS', 0, 18); ctx.fillStyle = '#ffd860'; ctx.fillText('VS', 0, 18); ctx.restore();
            ctx.restore();
          }
        });
      }
      /** 위 왼쪽: 차례·인원 · 아래 가운데: 무엇을 하면 되는지 */
      function drawHud(t) {
        if (over) return;
        ctx.textAlign = 'left'; ctx.font = fontOf(700, 14);
        var txt;
        if (phase === 'fight') {
          var tot = U.sum(mine, function (u) { return u.n; }), et = U.sum(foes, function (u) { return u.n; });
          txt = '제 ' + turnNo + ' 차례 · 아군 ' + tot + ' · 적 ' + et + (weather === 'rain' ? ' · 비' : weather === 'heat' ? ' · 더위' : '') + (fogT > 0 ? ' · 안개' : '') + (HOLD ? ' · 빠져나가기까지 ' + Math.max(0, HOLD - rounds) : '');
        } else txt = (TERR_NAME[terr] || terr) + (weather === 'rain' ? ' · 비' : weather === 'heat' ? ' · 더위' : ' · 맑음') + ' · 아군 ' + P0 + ' · 적 ' + (scouted ? foe0 : '약 ' + Math.max(5, Math.round(foe0 / 5) * 5));
        var tw = ctx.measureText(txt).width + 22;
        ctx.fillStyle = 'rgba(16,12,8,.62)'; rrect(10, 10, tw, 26, 13); ctx.fill(); ctx.fillStyle = '#f2e7cc'; ctx.fillText(txt, 21, 28);
        var hint = phase === 'form' ? (sel ? '' : '우리 부대를 눌러 종류와 지휘관을 바꾼다 · 준비가 되면 「전투 개시」')
          : busy ? '' : sel ? '적 부대를 누르면 목표 · 빈 곳을 누르면 닫는다' : '우리 부대를 눌러 명령 · Space 진행';
        if (hint) {
          ctx.textAlign = 'right'; ctx.font = fontOf(700, 14); var hw = ctx.measureText(hint).width + 24, al = 0.8 + 0.2 * Math.sin(t * 3);
          ctx.globalAlpha = al; ctx.fillStyle = 'rgba(16,12,8,.62)'; rrect(W - 10 - hw, 10, hw, 26, 13); ctx.fill(); ctx.fillStyle = '#fff0c8'; ctx.fillText(hint, W - 22, 28); ctx.globalAlpha = 1;
        }
      }
      function draw() {
        var t = (performance.now() - t0) / 1000;
        var bg = TERR_BG[terr] || TERR_BG.grass;
        ctx.save();
        if (shakeT > 0 && S().settings.shake !== false) ctx.translate(U.rf(-1, 1) * shakeT * 14, U.rf(-1, 1) * shakeT * 10);
        if (cam && cam.t > 0) { var z = 1 + (cam.z - 1) * Math.min(1, (cam.life - cam.t) / 0.25, cam.t / 0.3); ctx.translate(cam.x, cam.y); ctx.scale(z, z); ctx.translate(-cam.x, -cam.y); }
        if (bgImg && I) {
          I.drawCover(ctx, bgImg, -20, -20, W + 40, H + 40, 0.5, 0.5);
          var shade = ctx.createLinearGradient(0, 0, 0, H);
          shade.addColorStop(0, 'rgba(10,14,20,.02)'); shade.addColorStop(0.62, 'rgba(18,12,8,.03)'); shade.addColorStop(1, 'rgba(18,10,6,.12)');
          ctx.fillStyle = shade; ctx.fillRect(-20, -20, W + 40, H + 40);
        } else {
          var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#9ab8d0'); g.addColorStop(0.22, '#c8d6d8'); g.addColorStop(0.23, bg[0]); g.addColorStop(1, bg[1]);
          ctx.fillStyle = g; ctx.fillRect(-20, -20, W + 40, H + 40);
          var rng = U.makeRng(11);
          for (var i = 0; i < 70; i++) { ctx.fillStyle = 'rgba(0,0,0,' + rng() * 0.07 + ')'; ctx.fillRect(rng() * W, H * 0.25 + rng() * H * 0.75, 3 + rng() * 20, 2); }
        }
        drawField(t);
        drawDecals();
        // 적의 다음 행동이 겨누는 곳 (점선)
        if (phase === 'fight' && revealed && !over) {
          ctx.save(); ctx.setLineDash([6, 6]); ctx.lineDashOffset = -t * 20; ctx.lineWidth = 1.5;
          alive(foes).forEach(function (u) { var o = u.intent; if (!o || !o.target || o.target.n <= 0) return; ctx.strokeStyle = 'rgba(255,110,80,' + (hover === u ? 0.9 : 0.4) + ')'; ctx.lineWidth = hover === u ? 2.5 : 1.5; ctx.beginPath(); ctx.moveTo(u.x, u.y - 30); ctx.lineTo(o.target.x, o.target.y - 30); ctx.stroke(); });
          if (sel && sel.ord && sel.ord.target && sel.ord.target.n > 0) { ctx.strokeStyle = 'rgba(120,220,255,.8)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(sel.x, sel.y - 30); ctx.lineTo(sel.ord.target.x, sel.ord.target.y - 30); ctx.stroke(); }
          ctx.restore();
        }
        mine.concat(foes).slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (u) { drawUnit(u, t); });
        drawWorldFx();
        drawWeather(t);
        ctx.restore();
        // 가장자리를 어둡게 (영화처럼)
        var vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.62);
        vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.28)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
        if (finalRes === 'win') { ctx.fillStyle = 'rgba(255,214,120,' + (0.1 + 0.04 * Math.sin(t * 2)) + ')'; ctx.fillRect(0, 0, W, H); }
        else if (finalRes === 'lose') { ctx.fillStyle = 'rgba(30,30,40,.35)'; ctx.fillRect(0, 0, W, H); }
        drawScreenFx();
        drawHud(t);
      }
      function banner(text, life) { fxS = fxS.filter(function (e) { return e.kind !== 'banner'; }); fxS.push({ kind: 'banner', text: text, t: 0, life: life || 1.3 }); }
      function flashScreen(col, a, life) { fxS.push({ kind: 'flashS', col: col, a: a, t: 0, life: life || 0.3 }); }
      function focus(x, y, life) { cam = { x: x, y: y, z: 1.28, t: life || 1.3, life: life || 1.3 }; }
      var last = performance.now(), live = true;
      function loop() {
        if (!live) return;
        var now = performance.now(), dt0 = Math.min(0.05, (now - last) / 1000); last = now;
        var dt = cam && cam.t > 0 ? dt0 * 0.4 : dt0;   // 결정적인 순간에는 느리게
        if (freezeT > 0) { freezeT -= dt0; dt = 0; }     // 세게 맞는 순간 아주 잠깐 멈춘다 (타격감)
        if (cam) { cam.t -= dt0; if (cam.t <= 0) cam = null; }
        mine.concat(foes).forEach(function (u) {
          if (u.tx != null) { var sp = u.march ? 1.6 : 4; u.x += (u.tx - u.x) * Math.min(1, dt * sp); u.y += (u.ty - u.y) * Math.min(1, dt * sp); if (u.march && Math.abs(u.tx - u.x) < 6) u.march = false; }
          if (u.hitT > 0) u.hitT = Math.max(0, u.hitT - dt * 2.5);
          if (u.rush) { u.rush.t += dt; if (u.rush.t > 0.55) u.rush = null; }
          if (u.recoil) u.recoil = Math.max(0, u.recoil - dt * 3);
          if (u.act) u.actT = (u.actT || 0) + dt;
          if (u.n <= 0 && u.fade > 0) u.fade = Math.max(0, u.fade - dt * 1.2);
        });
        fx.forEach(function (e) { e.t += dt; }); fx = fx.filter(function (e) { return e.t < e.life; });
        fxS.forEach(function (e) { e.t += dt0; }); fxS = fxS.filter(function (e) { return e.t < e.life; });
        if (shakeT > 0) shakeT = Math.max(0, shakeT - dt * 2.2);
        draw();
        placePop();
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
      G.Games._landDebug = { mine: mine, foes: foes, step: function (n) { for (var i = 0; i < (n || 1); i++) { mine.concat(foes).forEach(function (u) { if (u.tx != null) { u.x = u.tx; u.y = u.ty; } }); fx.forEach(function (e) { e.t += 0.1; }); } draw(); }, draw: draw,
        state: function () { return { phase: phase, turn: turnNo, formation: formation, weather: weather, feat: feat, revealed: revealed, scouted: scouted, used: used, sel: sel, captured: captured }; },
        run: function () { return turn(); }, setOrder: function (u, act, tg) { setOrder(u, act, tg); }, plan: function () { planEnemy(); } };

      // ------------------------------------------------ 힘 계산
      function myMul(u) {
        var m = 1 - Math.min(0.5, f.fatigue / 250);
        if (u.ally) return m;
        if (u.type === 'inf' || u.type === 'adm') m *= 1 + sk('sword') * 0.08;
        if (u.type === 'cav') m *= (1 + sk('sword') * 0.08) * (1 + G.Mounts.combat(S().loc.mount, P0) * 0.6);
        if (u.type === 'gun') m *= 1 + sk('shoot') * 0.1;
        if (u.type === 'art') m *= 1 + sk('gun') * 0.1;
        if (u.type === 'adm') m *= 1 + R.atk() / 40;
        if (u.up) m *= u.type === 'adm' ? 2 : 1.4;
        return m;
      }
      /** 지휘관이 더하는 힘 (부대 하나) */
      function cmdrK(u) {
        if (!u.cmdr) return 1;
        var m = mateRow(u.cmdr), d = G.MATE[u.cmdr]; if (!m || !d) return 1;
        var c = K.cmdr || {}, skId = (TYPES[u.type] && TYPES[u.type].sk) || 'sword';
        var k = 1 + R.mateSkill(m, skId) * (c.sk || 0.07) + Math.max(0, ((d.st && d.st[2]) || 50) - 50) * (c.mar || 0.004);
        var ms = msk(u);
        if (ms) {
          var r = reachOf(u);
          if (ms.kind === 'melee' && (r === 'melee' || r === 'cav')) k *= ms.k * (ms.vs && ms.vs[e.kind] ? ms.vs[e.kind] / ms.k : 1);
          if (ms.kind === 'shot' && u.type === 'gun') k *= ms.k;
          if (ms.kind === 'art' && u.type === 'art') k *= ms.k;
        }
        return k;
      }
      function allK() {
        var k = 1;
        anyMsk('all').forEach(function (ms) { if (!ms.region || ms.region.indexOf(regKey) >= 0) k *= ms.k; });
        if (cryOn) k *= 1.2;
        return k;
      }
      function kitK(u) {
        var cv = kit(), kk = K.kitK || {};
        if (u.type === 'gun') return 1 + (kk.musket || 0) * cv('musket', U.sum(mine.filter(function (x) { return x.type === 'gun' && x.n > 0; }), function (x) { return x.n; }));
        return 1;
      }
      function powOf(u) {
        if (u.side === 'en') return u.pow;
        return TYPES[u.type].pow * myMul(u) * cmdrK(u) * kitK(u) * allK();
      }
      function isGunLike(u) { return u.side === 'me' ? (u.type === 'gun' || u.type === 'art') : (u.look === 'musket' || u.look === 'cannon' || u.cls === 'art' || (u.special && (u.special.ability === 'volley' || u.special.ability === 'rocket'))); }
      function dmgK(att, def) {
        var k = vsK(att, def), r = reachOf(att), ranged = r === 'shot' || r === 'art', ln = def.lane;
        if (def.stance === 'guard') k *= K.guard || 0.5;
        if (att.stance === 'charge') k *= (K.charge || [1.5])[0] * (att.chargeK || 1);
        if (def.stance === 'charge') k *= (K.charge || [1.5, 1.4])[1] * (def.chargeRisk || 1);
        if (ranged) {
          if (feat[ln] === 'woods') k *= K.woods || 0.7;
          if (feat[att.lane] === 'hill' && hillSide[att.lane] === att.side) k *= (K.hill || [1.25])[0];
          if (weather === 'rain') k *= isGunLike(att) ? ((K.rain || {}).gun || 0.5) : ((K.rain || {}).bow || 0.8);
          if (fogT > 0) k *= K.fog || 0.6;
        } else {
          if (feat[ln] === 'hill' && hillSide[ln] === def.side) k *= (K.hill || [1, 0.8])[1];
          if (feat[att.lane] === 'stream' || feat[ln] === 'stream') k *= K.stream || 0.7;
        }
        if (weather === 'heat') k *= Math.max(0.65, 1 - (K.heat || 0.05) * Math.max(0, turnNo - 1));
        if (att.side === 'me' && att.type === 'gun' && ammoT > 0) k *= 0.6;
        if (att.side === 'me' && turnNo === 1) k *= ambushBonus;
        if (def.side === 'me') {
          if (formation === 'deep' && clsOf(att) === 'cav') k *= (K.deep || {}).cav || 0.7;
          if (!ranged) { var cv = kit(); k *= 1 - ((K.kitK || {}).armor || 0.2) * cv('armor', U.sum(mine.filter(function (x) { return x.n > 0 && (x.type === 'inf' || x.type === 'cav' || x.type === 'adm'); }), function (x) { return x.n; })); }
          anyMsk('guardall').forEach(function (ms) { k *= ms.k; });
          var gm = msk(def); if (gm && gm.kind === 'guard') k *= gm.k;
          if (def.type === 'adm') k *= (1 - Math.min(0.5, R.def() / 30)) * (def.up ? 0.5 : 1);
        }
        if (att.side === 'me' && att.type === 'inf' && clsOf(def) === 'cav') k *= 1 + ((K.kitK || {}).pike || 0.4) * kit()('pike', U.sum(mine.filter(function (x) { return x.type === 'inf' && x.n > 0; }), function (x) { return x.n; }));
        if (def.side === 'en' && def.leader) { k *= 0.5; if (alive(foes).filter(function (u) { return !u.leader; }).length >= 2) k *= 0.5; }   // 우두머리는 날랜 호위병 — 다른 적이 둘 넘게 남아 있으면 더 단단하다
        if (att.side === 'me' && turnNo === 1 && hakaT) k *= 0.85;
        if (att.side === 'me' && att.type === 'gun' && formation === 'deep') k *= (K.deep || {}).gun || 1.1;
        return k;
      }
      var hakaT = false;
      function kills(att, def, extra) {
        var base = Math.max(1, att.n) * powOf(att) * U.rf(0.2, 0.3) * dmgK(att, def) * (extra || 1);
        var n = Math.round(base); if (n < 1 && U.chance(base)) n = 1;
        return Math.min(def.n, n);
      }
      function hurt(u, n, big) {
        if (n <= 0) { fx.push({ kind: 'num', text: '막음', col: '200,220,255', x: u.x, y: u.y - 50, t: 0, life: 0.9 }); return; }
        u.n -= n; u.hitT = 0.5;
        for (var di = 0, dn = Math.min(4, Math.ceil(n / 3)); di < dn; di++) addDecal('body', u.x + U.rf(-46, 46), u.y + U.rf(-6, 12), { me: u.side === 'me' });   // 쓰러진 병사
        if (big && n >= 3) freezeT = Math.max(freezeT, 0.06);
        if (u.n <= 0) {
          u.n = 0; u.fade = 1; fx.push({ kind: 'flag', x: u.x, y: u.y, me: u.side === 'me', t: 0, life: 2.4 });
          fx.push({ kind: 'word', text: u.side === 'me' ? unitName(u) + ' 무너짐' : u.name + ' 격파!', col: u.side === 'me' ? '170,150' : '220,60', x: u.x, y: u.y - 70, t: 0, life: 1.4 });
          if (u.side === 'en' && u.leader) { focus(u.x, u.y - 20, 1.4); flashScreen('255,240,200', 0.45, 0.5); }
          else if (u.side === 'en') { var nb2 = alive(foes).filter(function (x) { return !x.leader; })[0]; if (nb2) shout(nb2, 'flee', 0.5); }
        }
        if (u.act !== 'attack' || u.actT > 0.3) { u.act = 'hurt'; u.actT = 0; }
        fx.push({ kind: 'num', text: '−' + n, col: u.side === 'me' ? '255,140,120' : '255,236,160', x: u.x + U.rf(-10, 10), y: u.y - 52, big: big, t: 0, life: 1.1 });
        shakeT = Math.min(1, shakeT + (big ? 0.5 : 0.18));
      }
      /** 치명타: 10%로 피해 ×1.5 — 화면이 번쩍이고 잠깐 멈춘다 */
      function crit(n, t) {
        if (n <= 0 || !U.chance(0.1)) return n;
        fx.push({ kind: 'word', text: '치명타!', x: t.x, y: t.y - 76, t: 0, life: 1 }); flashScreen('255,250,230', 0.3, 0.25); freezeT = 0.12;
        return Math.min(t.n, Math.max(n + 1, Math.round(n * 1.5)));
      }
      function canHit(a, d) {
        if (a.n <= 0 || d.n <= 0) return false;
        if (d.side === 'me' && hiddenMe) return false;
        var r = reachOf(a), da = eff(a), dd = eff(d), lane = Math.abs(a.lane - d.lane);
        if (r === 'melee') return da === 0 && dd === 0 && lane <= 1;
        if (r === 'cav') return da === 0 && dd <= 2 && (dd > 0 || lane <= 1);
        if (r === 'shot') return da + dd <= 2;
        return true;
      }
      function targetsOf(a) { return alive(a.side === 'me' ? foes : mine).filter(function (d) { return canHit(a, d); }); }
      /** 고를 만한 목표: 상성 · 우두머리 · 다친 정도 */
      function bestTarget(a, list) {
        if (!list.length) return null;
        return list.slice().sort(function (p, q) { return score(q) - score(p); })[0];
        function score(t) { return vsK(a, t) * (t.leader ? (alive(foes).filter(function (x) { return !x.leader; }).length >= 2 ? 0.45 : 1.6) : 1) * (1.3 - t.n / Math.max(1, t.n0) * 0.5); }
      }
      function sleep(ms) { return new Promise(function (r) { setTimeout(r, opt.fastEnd ? Math.min(ms, 5) : ms); }); }

      // ------------------------------------------------ 우리 편 명령
      function autoOrder(u) {
        var ts = targetsOf(u);
        if (u.leader) { var t0 = ts.length ? bestTarget(u, ts) : null; return t0 && eff(u) === 0 ? { act: 'attack', target: t0, auto: true } : { act: 'guard', auto: true }; }
        if (ts.length) return { act: 'attack', target: bestTarget(u, ts), auto: true };
        var r = reachOf(u);
        if (r === 'art') return { act: 'wait', auto: true };
        if (u.line > 0 && [0, 1, 2].some(function (ln) { return cellFree(mine, u.line - 1, ln, u); })) return { act: 'adv', auto: true };
        return { act: r === 'melee' || r === 'cav' ? 'guard' : 'wait', auto: true };
      }
      function setOrder(u, act, tg) {
        if (!u || u.n <= 0) return;
        var o = { act: act, auto: false };
        if (act === 'attack' || act === 'charge') {
          var ts = targetsOf(u);
          o.target = tg && ts.indexOf(tg) >= 0 ? tg : bestTarget(u, ts);
          if (!o.target) { say(unitName(u) + U.jx(unitName(u), '이/가') + ' 닿는 적이 없다 — 전진하거나 다른 명령을 고르자.'); return; }
          if (act === 'charge' && reachOf(u) !== 'melee' && reachOf(u) !== 'cav') o.act = 'attack';
        }
        if (act === 'adv' && u.line === 0) { say('이미 맨 앞줄이다.'); return; }
        if (act === 'back' && u.line === 2) { say('더 물러설 자리가 없다.'); return; }
        u.ord = o;
      }
      function refreshOrders() { alive(mine).forEach(function (u) { var o = u.ord; if (!o || o.auto || ((o.act === 'attack' || o.act === 'charge') && !(o.target && canHit(u, o.target)))) u.ord = autoOrder(u); }); }

      // ------------------------------------------------ 적의 생각 (다음 차례에 할 일을 미리 정해 보여 준다)
      function weakest(list) { return list.slice().sort(function (a, b) { return a.n - b.n; })[0]; }
      function planEnemy() {
        var al = alive(foes), tot = U.sum(al, function (u) { return u.n; });
        var woodsy = terr === 'forest' || terr === 'jungle' || terr === 'mountain';
        al.forEach(function (u) {
          if (stunEn) { u.intent = { act: 'stun' }; return; }
          if (u.stun > 0) { u.intent = { act: 'stun' }; return; }
          var ts = targetsOf(u), t = null, act = 'attack';
          if (ts.length) {
            if (e.kind === 'bandit') t = weakest(ts);
            else if (e.kind === 'native') t = ts.filter(function (x) { return x.type === 'gun' || x.type === 'art'; })[0] || ts.filter(function (x) { return x.lane !== 1; })[0] || weakest(ts);
            else if (e.kind === 'beast') t = U.pick(ts);
            else t = bestTarget(u, ts);
          }
          if (!t) {
            var r = reachOf(u);
            u.intent = r === 'art' || u.line === 0 ? { act: 'wait' } : { act: 'adv' };
            if (u.leader && u.intent.act === 'adv' && alive(foes).filter(function (x) { return !x.leader; }).length) u.intent = { act: 'wait' };   // 우두머리는 부하들 뒤에 있다
            return;
          }
          var ab = abil(u);
          if (e.kind === 'beast' && roared) act = 'charge';
          if (e.kind === 'garrison' && turnNo <= 2 && reachOf(u) === 'melee' && !u.leader) act = 'guard';
          if (e.kind === 'native' && turnNo === 1 && woodsy && reachOf(u) === 'shot' && !hiddenMe) act = 'ambush';
          if (ab === 'volley' && turnNo % 2 === 0) act = 'volley';
          if (ab === 'duel' && !duelDone && (t.cmdr || t.type === 'adm') && reachOf(u) === 'melee') act = 'duel';
          if (ab === 'haka' && turnNo === 1) act = 'haka';
          u.intent = { act: act, target: act === 'guard' || act === 'haka' ? null : t };
        });
        // 짐승의 우두머리: 세 차례마다 울부짖는다 → 다음 차례 모두 돌진
        var L = foes.filter(function (u) { return u.leader && u.n > 0; })[0];
        if (L && e.kind === 'beast' && !roared && turnNo % 3 === 2) L.intent = { act: 'roar' };
        // 도적: 불리하면 두목이 달아날 채비를 한다
        if (L && e.kind === 'bandit' && tot < foe0 * 0.35) L.intent = { act: 'flee' };
      }

      // ------------------------------------------------ 버튼
      function btn(parent, label, cls, fn, dis, tip, always) {
        var b = U.el('button', 'btn ' + (cls || ''), label);
        if (dis) { b.classList.add('disabled'); b.disabled = true; }
        if (tip) b.title = tip;
        b.onclick = function () { if (always || (!busy && !over)) fn(); };
        parent.appendChild(b); return b;
      }
      function formInfo() {
        var parts = ['<b>' + (TERR_NAME[terr] || terr) + '</b>'];
        var fts = feat.map(function (x, i) { return x ? ['위', '가운데', '아래'][i] + ' 칸 ' + FEAT_NAME[x] + (x === 'hill' ? (hillSide[i] === 'me' ? '(우리 쪽)' : '(적 쪽)') : '') : null; }).filter(Boolean);
        if (fts.length) parts.push(fts.join(' · '));
        parts.push(weather === 'rain' ? '비 — 총·포가 약하다' : weather === 'heat' ? '더위 — 차례가 갈수록 지친다' : '맑음');
        var kk = G.LandKit ? G.LandKit.summary(P0) : '';
        return parts.join(' · ') + (kk ? '<br><small>장비: ' + kk + '</small>' : '');
      }
      function foeSummary() {
        if (!scouted) return '적 편성은 아직 모른다 — 약 ' + Math.max(5, Math.round(foe0 / 5) * 5) + (e.kind === 'beast' ? '마리' : '명') + (scoutTried ? '' : ' (정찰하면 알 수 있다)');
        return '적: ' + foes.map(function (u) { return (u.leader ? '★' : '') + u.name + ' ' + u.n + (u.special ? ' — ' + u.special.desc : ''); }).join(' · ');
      }
      function scoutP() { return U.clamp(0.45 + sk('survey') * 0.12 + (G.Mounts.scout ? G.Mounts.scout(S().loc.mount, P0) * 0.3 : 0) + STAFF, 0.1, 0.95); }
      function ambushFormP() { return U.clamp((TERR_AMBUSH[terr] || 0.45) + sk('survey') * 0.04 + STAFF, 0.1, 0.95); }
      function formBar() {
        btns.innerHTML = '';
        var row = U.el('div', 'lw-row lw-main');
        var seg = U.el('div', 'lw-seg');
        [['line', '횡대', '앞줄에 셋 — 고르게 싸운다'], ['deep', '종심', '근접 부대를 앞에, 총병은 가운데, 포는 뒤 — 기병 돌격을 ×0.7로 받고 총병 ×1.1'], ['ambush', '매복 대기 <small>' + Math.round(ambushFormP() * 100) + '%</small>', '숨어서 기다린다 — 통하면 첫 차례에 적이 우리를 찾지 못하고 우리 공격 ×1.5 (숲·밀림·산에서 잘 통한다)']].forEach(function (x) {
          var b = btn(seg, x[1], 'small' + (formation === x[0] ? ' on' : ' ghost'), function () { formation = x[0]; arrange(); place(); formBar(); }, false, x[2]);
          if (formation === x[0]) b.classList.add('on');
        });
        row.appendChild(U.el('span', 'lw-lbl', '진형'));
        row.appendChild(seg);
        btn(row, '정찰한다 <small>' + Math.round(scoutP() * 100) + '%</small>', 'small' + (scoutTried ? ' ghost' : ''), function () {
          scoutTried = true;
          if (U.chance(scoutP())) { scouted = true; say('정찰병이 돌아왔다 — ' + foeSummary()); foes.forEach(function (u) { if (u.special) fx.push({ kind: 'pop', u: u, t: 0, life: 1.6 }); }); }
          else say('정찰병이 적에게 들켜 쫓겨 왔다. 편성은 알아내지 못했다.');
          formBar();
        }, scoutTried, '측량 솜씨·탈것이 좋을수록 잘 된다 (한 번)');
        var parl = cmdrPool.some(function (m) { var k = LD().MATE_SKILL[m.id]; return k && k.kind === 'parley'; });   // 통역할 동료(마리나)가 함께 있으면
        if (parl && e.kind === 'native' && !parleyTried && opt.flee !== false) btn(row, '말로 달랜다', 'small', function () {
          parleyTried = true; var p = U.clamp(0.45 + sk('speech') * 0.1, 0.1, 0.9);
          if (U.chance(p)) { say('통역이 원주민의 말로 싸울 뜻이 없다고 전하자, 그들이 창을 내렸다.'); end('truce'); return; }
          say('말이 통하지 않았다. 원주민들이 함성을 지른다!'); alive(foes).forEach(function (u) { shout(u, 'native', 0.6); }); formBar();
        }, false, '통역할 동료가 있으면 싸움을 말로 멈춰 볼 수 있다');
        row.appendChild(U.el('span', 'lw-grow'));
        var go = U.el('button', 'btn red lw-go', '전투 개시'); go.onclick = start; row.appendChild(go);
        var fl = U.el('button', 'btn small ghost', '피한다'); fl.onclick = function () { tryFlee(true); }; if (opt.flee !== false) row.appendChild(fl);
        btns.appendChild(row);
        if (!formSaid) {
          formSaid = true;
          say((HOLD ? '<b>퇴각 판</b> — 적의 차례를 ' + HOLD + '번 버티면(제독대가 살아 있으면) 빠져나간다. 「2 모두 방어」로 버티자.<br>' : '') + formInfo() + '<br>' + foeSummary());
        }
        unitBar();
      }
      mine.forEach(function (u) { u.up = upgraded(u.type); });

      function specials() {
        var art = alive(mine).some(function (u) { return u.type === 'art'; }), gunsN = alive(mine).filter(function (u) { return u.type === 'gun'; }).length, shells = R.hasItem('shells');
        var sch = U.sum(anyMsk('scheme'), function (ms) { return !ms.terr || ms.terr === terr ? ms.k : 0; }), snp = U.sum(anyMsk('snipe'), function (ms) { return ms.k; });
        var cool = K.cool || {}, coolCut = anyMsk('scheme').length ? 1 : 0, adm = mine.filter(function (u) { return u.leader; })[0];
        var tip2 = STAFF > 0 ? ' · 참모실 +' + Math.round(STAFF * 100) + '%, 피해 ×' + (Math.round(STAFF_DMG * 100) / 100) : '';
        var out = [
          { id: 'ambush', name: '기습', p: U.clamp((TERR_AMBUSH[terr] || 0.45) + sk('survey') * 0.04 + sch, 0.1, 0.95), tip: '숨어서 덮친다 — 적 모두를 치고 한 차례 발을 묶는다 (숲·밀림·산에서 잘 통한다)' },
          { id: 'trap', name: '함정', p: U.clamp((TERR_TRAP[terr] || 0.5) + sk('survey') * 0.05 + sch, 0.1, 0.95), tip: '함정을 판다 — 다음에 달려드는 적이 걸려 크게 다친다' },
          { id: 'snipe', name: '저격', p: U.clamp(0.18 + sk('shoot') * 0.12 + snp, 0.05, 0.9), tip: '솜씨 좋은 사수가 적 우두머리를 노린다' },
          { id: 'shells', name: '작렬탄', p: null, need: art && shells, tip: '포병이 작렬탄을 쏜다 — 적 전체에 큰 피해 (소지품의 작렬탄 1회를 쓴다)' },
          { id: 'volley', name: '일제 사격', p: null, need: gunsN >= 1, tip: '총병 모두가 한 적을 노려 한꺼번에 쏜다 (×1.3) — 고른 부대의 목표, 없으면 알아서' },
          { id: 'cry', name: '함성', p: null, need: adm && adm.n > 0, tip: '제독이 앞장서 함성을 지른다 — 이번 차례 우리 편 모두 +20%' }
        ];
        var roarU = mine.filter(function (u) { var m = msk(u); return m && m.kind === 'roar' && !onceUsed[u.cmdr] && u.n > 0; })[0];
        if (roarU) out.push({ id: 'roar', name: '호통', p: null, need: true, tip: msk(roarU).desc, u: roarU });
        out.forEach(function (x) {
          if (x.p != null && STAFF > 0) { x.p = Math.min(0.95, x.p + STAFF); x.tip += tip2; }
          var c = Math.max(1, (cool[x.id] || 3) - coolCut);
          x.wait = used[x.id] ? Math.max(0, used[x.id] + c - turnNo) : 0;
          x.ok = (x.need === undefined || !!x.need) && !x.wait;
        });
        return out;
      }
      function cmdBar() {
        btns.innerHTML = '';
        var row = U.el('div', 'lw-row lw-main');
        btn(row, '진행 ▶ <small>Space</small>', 'gold lw-go', function () { turn(); }, false, '정한 명령대로 이번 차례를 치른다');
        btn(row, '<span class="k">1</span>모두 공격', 'small red', function () { alive(mine).forEach(function (u) { u.ord = autoOrder(u); }); turn(); }, false, '부대마다 닿는 적을 알아서 골라 친다');
        btn(row, '<span class="k">2</span>모두 방어', 'small', function () { alive(mine).forEach(function (u) { u.ord = { act: 'guard', auto: true }; }); turn(); }, false, '받는 피해 ×0.5 — 달려든 적을 받아친다');
        row.appendChild(U.el('span', 'lw-sep'));
        var ops = U.el('div', 'lw-ops');
        specials().forEach(function (x, i) {
          var b = btn(ops, '<span class="k">' + (i + 3) + '</span><i>' + (OP_ICON[x.id] || '✦') + '</i><b>' + x.name + '</b>' + (x.p != null ? '<small>' + Math.round(x.p * 100) + '%</small>' : '') + (x.wait ? '<em>' + x.wait + '</em>' : ''),
            'lw-op' + (pendingSpecial === x.id ? ' on' : '') + (x.wait ? ' cool' : ''), function () { pickSpecial(x); }, !x.ok, x.name + ' — ' + x.tip + (x.wait ? ' (' + x.wait + '차례 뒤에 다시)' : '') + ' · 차례마다 하나를 부대 명령과 함께 쓴다');
          if (pendingSpecial === x.id) b.classList.add('on');
        });
        row.appendChild(ops);
        row.appendChild(U.el('span', 'lw-grow'));
        var ab = btn(row, auto ? '자동 멈춤' : '자동', 'small ghost', function () { auto = !auto; cmdBar(); if (auto && !busy) turn(); }, false, '「모두 공격」을 되풀이한다');
        if (auto) ab.classList.add('on');
        if (opt.flee !== false) btn(row, '후퇴', 'small ghost', function () { tryFlee(false); }, false, '싸움에서 빠져나간다 (실패하면 적이 뒤를 친다)');
        btns.appendChild(row);
        unitBar();
      }
      var pendingSpecial = null;
      function pickSpecial(x) {
        if (!x.ok) return; pendingSpecial = pendingSpecial === x.id ? null : x.id;
        say(pendingSpecial ? '<b>' + x.name + '</b> — 이번 차례에 함께 쓴다. 「진행」을 누르면 먼저 펼친다.' : x.name + ' — 쓰지 않는다.');
        cmdBar();
      }
      // ------------------------------------------------ 그림 위의 작은 명령 창 (부대를 누르면 그 부대 곁에 뜬다)
      var CLS_KO = { pike: '창병', blade: '칼잡이', cav: '기병', missile: '사격', horsearcher: '기마궁수', art: '포', beast: '짐승', elephant: '코끼리' };
      function matchLine(u) {
        // 지금 싸움에 나온 적 가운데 이 부대가 유리한 · 불리한 상대
        var good = [], bad = [];
        alive(foes).forEach(function (f) { if (!(revealed || scouted)) return; var v = vsK(u, f), w = vsK(f, u); if (v >= 1.15 && good.indexOf(f.name) < 0) good.push(f.name); if (w >= 1.2 && bad.indexOf(f.name) < 0) bad.push(f.name); });
        return (good.length ? '<span class="up">▲ ' + good.join('·') + '</span>' : '') + (bad.length ? '<span class="dn">▼ ' + bad.join('·') + '</span>' : '');
      }
      function popHead(u) {
        var cm = u.cmdr && G.MATE[u.cmdr], ms = msk(u);
        return '<div class="lp-head"><b>' + unitName(u) + ' ' + u.n + '</b><small>' + (CLS_KO[clsOf(u)] || '') + (cm ? ' · 지휘 ' + cm.name.split(' ')[0] : '') + (ms ? ' «' + ms.name + '»' : '') + '</small></div>';
      }
      function tile(parent, icon, label, on, fn, dis, tip) {
        var b = U.el('button', 'lp-act' + (on ? ' on' : ''), '<i>' + icon + '</i><span>' + label + '</span>');
        if (dis) { b.disabled = true; b.classList.add('dis'); }
        if (tip) b.title = tip;
        b.onclick = function (ev) { ev.stopPropagation(); if (!busy && !over && !dis) fn(); };
        parent.appendChild(b); return b;
      }
      function unitBar() {   // (예전 이름 그대로) 고른 부대의 명령 창을 다시 그린다
        if (!sel || sel.n <= 0 || over || busy) { popEl.hidden = true; popEl.innerHTML = ''; return; }
        var u = sel; popEl.innerHTML = popHead(u); popEl.hidden = false;
        var row = U.el('div', 'lp-row');
        if (phase === 'form') {
          if (u.type !== 'adm') {
            var mi3 = mountInfo();
            [['inf', '⚔', '보병', '창과 칼 — 기병에 강하다'], ['gun', '➶', '총병', '두 줄 안을 쏜다 — 걷는 보병에 강하다'], ['cav', '»', '기병', mi3.ride ? mi3.name + ' ' + mi3.ride + '명분 — 적 뒷줄까지 파고든다 · 총·포에 강하다' : '말·낙타·코끼리가 있어야 한다'], ['art', '✸', '포병', guns ? '어디든 쏜다 — 한 부대만' : '포와 짐 나르는 짐승·마차가 있어야 한다']].forEach(function (x) {
              var ok = x[0] === u.type || allowed(mine, u, x[0], guns);
              tile(row, x[1], x[2], u.type === x[0], function () { u.type = x[0]; if (x[0] === 'cav') u.ride = mountInfo().name; u.up = upgraded(u.type); u._spr = undefined; arrange(); place(); fx.push({ kind: 'ring', x: u.tx, y: u.ty, col: '120,220,255', t: 0, life: 0.5 }); unitBar(); }, !ok, x[3]);
            });
            popEl.appendChild(row);
            if (cmdrPool.length) {
              popEl.appendChild(U.el('div', 'lp-lbl', '지휘관'));
              var cr = U.el('div', 'lp-chips');
              var taken = {}; mine.forEach(function (o) { if (o !== u && o.cmdr) taken[o.cmdr] = unitName(o); });
              var none = U.el('button', 'lp-chip' + (!u.cmdr ? ' on' : ''), '없음'); none.onclick = function (ev) { ev.stopPropagation(); u.cmdr = null; unitBar(); }; cr.appendChild(none);
              cmdrPool.forEach(function (m) {
                var d = G.MATE[m.id], k = LD().MATE_SKILL[m.id], tk = taken[m.id];
                var c = U.el('button', 'lp-chip' + (u.cmdr === m.id ? ' on' : '') + (k ? ' star' : '') + (tk ? ' dis' : ''), d.name.split(' ')[0] + (k ? '<small>' + k.name + '</small>' : ''));
                c.title = (k ? k.name + ' — ' + k.desc : '검술·사격·포술·무력이 부대에 더해진다') + (tk ? ' (지금 ' + tk + ' 지휘)' : '');
                c.onclick = function (ev) { ev.stopPropagation(); if (tk) return; u.cmdr = m.id; u.cried = false; bubble(u, CMDR_CRY[m.id] || '맡겨 주십시오!', 1.4); unitBar(); };
                cr.appendChild(c);
              });
              popEl.appendChild(cr);
            }
          } else popEl.appendChild(U.el('div', 'lp-note', '제독이 이끄는 부대 — 무너지면 진다. 뒷줄 가운데에 선다.'));
        } else {
          var r = reachOf(u), o = u.ord || {};
          var acts = [['attack', r === 'shot' ? '➶' : r === 'art' ? '✸' : '⚔', r === 'shot' ? '사격' : r === 'art' ? '포격' : '공격', '목표를 친다 — 적 부대를 누르면 목표']];
          if (r === 'melee' || r === 'cav') acts.push(['charge', '»', '돌격', '세게 부딪친다 — 주는 피해 ×1.5, 받는 피해 ×1.4']);
          acts.push(['guard', '◈', '방어', '받는 피해 ×0.5 · 달려든 적을 받아친다'], ['adv', '▶', '전진', '한 줄 앞으로 (이번 차례는 싸우지 않는다)'], ['back', '◀', '후퇴', '한 줄 뒤로 — 다친 부대를 빼낸다'], ['wait', '·', '대기', '그대로 있는다']);
          acts.forEach(function (x) {
            var dis = (x[0] === 'adv' && u.line === 0) || (x[0] === 'back' && u.line === 2) || ((x[0] === 'attack' || x[0] === 'charge') && !targetsOf(u).length);
            tile(row, x[1], x[2], o.act === x[0], function () { setOrder(u, x[0], o.target); if (u.ord && !u.ord.auto) fx.push({ kind: 'ring', x: u.x, y: u.y, col: '120,220,255', t: 0, life: 0.45 }); unitBar(); }, dis, x[3] + (dis ? ' (지금은 안 된다)' : ''));
          });
          popEl.appendChild(row);
          var ml = matchLine(u), tg = o.target && o.target.n > 0 ? '목표 <b>' + o.target.name + '</b>' : '';
          popEl.appendChild(U.el('div', 'lp-note', (tg ? tg + ' · ' : '') + (ml || '') + (!tg && !ml ? '적 부대를 누르면 목표가 된다' : '')));
        }
        placePop();
      }
      function placePop() {
        if (popEl.hidden || !sel) return;
        var kx = cv.clientWidth / W, ky = cv.clientHeight / H, ox = cv.offsetLeft, oy = cv.offsetTop;
        var x = sel.x * kx + ox, y = sel.y * ky + oy, w = popEl.offsetWidth, h = popEl.offsetHeight;
        var left = U.clamp(x - w / 2, ox + 4, ox + cv.clientWidth - w - 4), top = y - h - 96 * ky;
        if (top < oy + 4) top = y + 62 * ky;
        popEl.style.left = Math.round(left) + 'px'; popEl.style.top = Math.round(top) + 'px';
      }
      /** 부대 위에 마우스를 올리면 뜨는 설명 */
      function tipFor(u) {
        var me = u.side === 'me', known = me || revealed || scouted, h = '<b>' + (u.leader ? '★ ' : '') + (known ? unitName(u) : '적 부대') + '</b> ' + (known ? u.n + (u.look === 'beast' ? '마리' : '명') : '');
        if (!known) return h + '<br><small>정찰하면 편성을 알 수 있다</small>';
        h += '<br><small>' + (CLS_KO[clsOf(u)] || '') + (u.special ? ' · ' + u.special.desc : '') + '</small>';
        if (me) { var ms = msk(u); if (ms) h += '<br><small>지휘 ' + G.MATE[u.cmdr].name + ' — ' + ms.desc + '</small>'; if (phase === 'fight') h += '<br><small>' + matchLine(u) + '</small>'; }
        else {
          var o = u.intent; if (phase === 'fight' && o && o.act) h += '<br><small>다음: ' + (ACT[o.act] || ACT.attack).name + (o.target && o.target.n > 0 ? ' → ' + unitName(o.target) : '') + '</small>';
          if (sel && sel.side === 'me' && sel.n > 0) { var v = vsK(sel, u); h += '<br><small>고른 ' + unitName(sel) + ' 기준: ' + (v >= 1.15 ? '<span class="up">유리</span>' : v <= 0.87 ? '<span class="dn">불리</span>' : '보통') + (canHit(sel, u) ? '' : ' · 지금은 닿지 않는다') + '</small>'; }
          if (u.leader) h += '<br><small>쓰러뜨리면 남은 적이 항복한다' + (alive(foes).filter(function (x) { return !x.leader; }).length >= 2 ? ' — 호위가 단단하다' : '') + '</small>';
        }
        return h;
      }

      // ------------------------------------------------ 시작
      function start() {
        if (phase !== 'form') return;
        phase = 'fight'; revealed = true; mine.forEach(function (u) { u.up = upgraded(u.type); });
        if (formation === 'ambush') {
          if (U.chance(ambushFormP())) { hiddenMe = true; ambushBonus = K.ambushForm || 1.5; say('<b>매복이 먹혔다!</b> 적은 우리가 어디 있는지 모른다.'); }
          else { ambushBonus = 0.9; say('매복을 들켰다! 적이 먼저 자리를 잡는다.'); }
          formation = 'line';
        }
        log.length = 0;   // 편성 때의 안내는 지운다
        sel = null; unitBar();
        var adm0 = mine.filter(function (u) { return u.leader; })[0];
        fxS.push({ kind: 'vs', a: '제독 ' + S().player.name, a2: '탐험대 ' + P0 + '명' + (formation === 'deep' ? ' · 종심' : ''), b: e.name, b2: (e.kind === 'beast' ? '약 ' + foe0 + '마리' : '약 ' + foe0 + '명') + (foes.some(function (u) { return u.special; }) ? ' · ' + foes.filter(function (u) { return u.special; })[0].name : ''), t: 0, life: opt.fastEnd ? 0.05 : 1.9 });
        mine.forEach(function (u) { if (u.tx != null) { u.x = u.tx - 230; u.march = true; } });
        foes.forEach(function (u) { if (u.tx != null) { u.x = u.tx + 230; u.march = true; } });
        setTimeout(function () { if (over) return; banner('전투 개시!', 1.2); if (adm0) bubble(adm0, U.pick(['전군, 앞으로!', '겁내지 마라, 나를 따르라!', '한 사람도 잃지 않는다!']), 1.8); var f0 = alive(foes).filter(function (u) { return !u.leader; })[0]; if (f0) setTimeout(function () { shout(f0, e.kind); }, 500); }, opt.fastEnd ? 0 : 1500);
        var ups = mine.filter(function (u) { return u.up; }).map(unitName);
        var cms = mine.filter(function (u) { return u.cmdr && G.MATE[u.cmdr]; }).map(function (u) { return G.MATE[u.cmdr].name.split(' ')[0] + '(' + unitName(u) + ')'; });
        say('전투 개시!' + (ups.length ? ' <b>' + ups.join(' · ') + '</b> — 특기 덕에 강해졌다.' : '') + (cms.length ? ' 지휘: ' + cms.join(' · ') : ''));
        if (G.Audio) { G.Audio.sfx('drums'); setTimeout(function () { if (G.Audio) G.Audio.sfx('draw'); }, 900); setTimeout(function () { if (G.Audio) G.Audio.sfx('cheer'); }, 1500); }
        turnNo = 1;
        // 하카: 첫 차례 우리 편이 움츠러든다
        if (foes.some(function (u) { return abil(u) === 'haka'; })) { hakaT = true; say('적이 하카를 춘다 — 우렁찬 함성에 우리 편이 움츠러든다. (첫 차례 우리 공격 −15%)'); }
        planEnemy(); refreshOrders(); cmdBar();
        setTimeout(function () { if (!over && !busy && turnNo === 1) turnCard(); }, opt.fastEnd ? 0 : 2000);
      }

      // ------------------------------------------------ 한 차례
      async function strike(u, t, mode) {
        if (u.n <= 0 || !t || t.n <= 0) return;
        var me = u.side === 'me', r = reachOf(u), look = me ? u.type : u.look, face = me ? 1 : -1;
        u.act = 'attack'; u.actT = 0;
        // 지휘관의 첫 외침
        var cried = false;
        if (me && u.cmdr && !u.cried) { u.cried = cried = true; bubble(u, CMDR_CRY[u.cmdr] || '나를 따르라!', 1.8); }
        if (r === 'melee' || r === 'cav') {
          var heavy = mode === 'charge' || r === 'cav' || clsOf(u) === 'elephant' || (clsOf(u) === 'beast' && roared);
          u.rush = { dx: (t.x - u.x) * (heavy ? 0.78 : 0.55), dy: (t.y - u.y) * (heavy ? 0.78 : 0.55), t: 0 };
          if (heavy) for (var di = 0; di < 9; di++) fx.push({ kind: 'dust', x: u.x + U.rf(-34, 34), y: u.y + U.rf(-2, 10), vx: -face * U.rf(20, 60), vy: U.rf(-18, -4), r: U.rf(6, 12), t: -di * 0.035, life: 0.9 });
          if (!cried) { if (!me) shout(u, e.kind, 0.35); else if (mode === 'charge') shout(u, 'charge'); else shout(u, 'attack', 0.25); }
          if (G.Audio) { if (look === 'cav' || clsOf(u) === 'cav' || clsOf(u) === 'elephant') { G.Audio.sfx('horse'); setTimeout(function () { if (G.Audio) G.Audio.sfx('sword'); }, 95); } else G.Audio.sfx('sword'); }
          await sleep(heavy ? 330 : 260);
          var cx = (u.x + t.x) / 2 + (me ? 30 : -30);
          fx.push({ kind: 'clash', x: cx, y: t.y - 20, seed: U.rand() * 6, t: 0, life: 0.45 });
          fx.push({ kind: 'slash', x: t.x - face * 10, y: t.y - 26, a0: me ? -2.4 : -0.8, t: 0, life: 0.35 });
          if (heavy) { fx.push({ kind: 'slash', x: t.x + face * 8, y: t.y - 18, a0: me ? -1.9 : -1.2, t: -0.08, life: 0.35 }); shakeT = Math.min(1, shakeT + 0.35); }
          if (trapOn && !me) { trapOn = false; fx.push({ kind: 'spike', x: u.x, y: u.y, t: 0, life: 1.2 }); var tk = Math.max(1, Math.round(u.n * Math.min(0.9, U.rf(0.25, 0.4) * STAFF_DMG))); hurt(u, tk, true); fx.push({ kind: 'word', text: '함정!', col: '200,80', x: u.x, y: u.y - 76, t: 0, life: 1.1 }); say(u.name + U.jx(u.name, '이/가') + ' 함정에 걸렸다!'); if (u.n <= 0) return; }
          var n = crit(kills(u, t, mode === 'volley' ? 1.3 : 1), t);
          if (abil(u) === 'capture' && t.side === 'me') { var cp = Math.round(n * 0.35); captured += cp; if (cp) { say(u.name + U.jx(u.name, '이/가') + ' 우리 대원 ' + cp + '명을 사로잡아 끌고 간다!'); fx.push({ kind: 'word', text: '사로잡힘!', col: '200,80', x: t.x, y: t.y - 100, t: 0, life: 1.2 }); } }
          hurt(t, n, look === 'cav' || u.leader || u.stance === 'charge' || heavy);
          if (abil(u) === 'trample') { var nb = alive(sideOf(t)).filter(function (x) { return x !== t && x.line === t.line && Math.abs(x.lane - t.lane) === 1; })[0]; if (nb) { hurt(nb, Math.round(kills(u, nb) * 0.6), true); say(u.name + U.jx(u.name, '이/가') + ' 옆 부대까지 짓밟았다!'); } }
          if (abil(u) === 'poison' && t.n > 0) t.poison = 2;
          // 받아치기: 근접으로 맞은 부대가 근접 부대면 (방어 중이면 더 세게, 창병이 기병을 받으면 크게) — 치고 빠지는 부대는 받지 않는다
          var tr = reachOf(t);
          if (t.n > 0 && u.n > 0 && (tr === 'melee' || tr === 'cav') && abil(u) !== 'skirmish') {
            var ck = (K.counter || 0.45) * (t.stance === 'guard' ? 1.3 : 1);
            if (clsOf(t) === 'pike' && clsOf(u) === 'cav') ck = K.pikeCounter || 0.8;
            var cn = Math.round(kills(t, u) * ck);
            if (cn > 0) {
              await sleep(120);
              if (t.stance === 'guard') { fx.push({ kind: 'word', text: '받아치기!', col: '230,120', x: u.x, y: u.y - 76, t: 0, life: 1 }); if (t.side === 'me') shout(t, 'guard', 0.6); }
              fx.push({ kind: 'slash', x: u.x + face * 10, y: u.y - 22, a0: me ? -0.8 : -2.4, t: 0, life: 0.3 });
              hurt(u, cn, false);
            }
          }
        } else {
          var art = clsOf(u) === 'art' || look === 'art' || look === 'cannon', bow = !art && (look === 'bow' || (u.cls === 'missile' && !isGunLike(u)));
          if (art) {
            u.recoil = 1; fx.push({ kind: 'flash', x: u.x + face * 30, y: u.y - 18, r: 14, t: 0, life: 0.22 }); fx.push({ kind: 'smoke', x: u.x + face * 34, y: u.y - 18, d: face, t: 0, life: 2.2 });
            fx.push({ kind: 'ball', x0: u.x + face * 30, y0: u.y - 20, x1: t.x, y1: t.y - 10, t: 0, life: 0.7 });
          } else if (bow) for (var a = 0; a < 8; a++) fx.push({ kind: 'arrow', x0: u.x + U.rf(-30, 30), y0: u.y - 24, x1: t.x + U.rf(-40, 40), y1: t.y - 14 + U.rf(-8, 8), t: -a * 0.04, life: 0.6 });
          else {
            if (me && mode !== 'volley') shout(u, 'shoot', 0.35);
            for (var m = 0; m < 5; m++) { var mx = u.x + face * 22 + (m % 3 - 1) * 16, my = u.y - 22 - (m >= 3 ? 12 : 0); fx.push({ kind: 'flash', x: mx, y: my, t: -m * 0.06, life: 0.18 }); fx.push({ kind: 'smoke', x: mx + face * 4, y: my, d: face, t: -m * 0.06, life: 2.0 }); fx.push({ kind: 'shot', x0: mx, y0: my, x1: t.x + U.rf(-30, 30), y1: t.y - 20 + U.rf(-10, 10), t: -m * 0.06, life: 0.25 }); }
          }
          if (isGunLike(u) && clsOf(u) !== 'art') look = 'musket';
          if (G.Audio) { if (clsOf(u) === 'art') G.Audio.sfx('cannon'); else if (look === 'gun' || look === 'musket') G.Audio.sfx('gun'); }
          await sleep(art ? 620 : 420);
          if (art) {
            fx.push({ kind: 'boom', x: t.x, y: t.y - 10, t: 0, life: 0.7 }); addDecal('crater', t.x + U.rf(-20, 20), t.y + 8);
            for (var q = 0; q < 12; q++) fx.push({ kind: 'debris', x: t.x, y: t.y - 10, vx: U.rf(-140, 140), vy: U.rf(-260, -90), t: 0, life: 0.9 });
            shakeT = Math.min(1, shakeT + 0.4);
          } else {
            for (var p2 = 0; p2 < 4; p2++) fx.push({ kind: 'dust', x: t.x + U.rf(-40, 40), y: t.y + U.rf(-4, 6), vx: U.rf(-10, 10), vy: U.rf(-14, -4), r: U.rf(3, 6), t: 0, life: 0.6 });
            if (bow) for (var p3 = 0; p3 < 3; p3++) addDecal('arrow', t.x + U.rf(-50, 50), t.y + U.rf(0, 14), { r: U.rf(-1, 1) });
          }
          var nn = crit(kills(u, t, (mode === 'volley' ? 1.3 : mode === 'ambush' ? 1.4 : 1)), t);
          hurt(t, nn, clsOf(u) === 'art');
          if (abil(u) === 'rocket') { alive(sideOf(t)).filter(function (x) { return x !== t; }).forEach(function (x) { fx.push({ kind: 'boom', x: x.x, y: x.y - 10, t: 0, life: 0.6 }); hurt(x, Math.round(kills(u, x) * 0.35), false); }); }
          if (abil(u) === 'poison' && t.n > 0) t.poison = 2;
        }
        await sleep(140);
      }
      function moveUnit(u, dir) {
        var list = sideOf(u), nl = u.line + dir; if (nl < 0 || nl > 2) return false;
        var lanes = [u.lane, 1, 0, 2];
        for (var i = 0; i < lanes.length; i++) if (cellFree(list, nl, lanes[i], u)) { u.line = nl; u.lane = lanes[i]; return true; }
        return false;
      }
      async function maybeDuel(ours, theirs, challenger) {
        if (duelDone || !theirs || theirs.n <= 0 || !ours || ours.n <= 0) return false;
        var row = ours.cmdr ? mateRow(ours.cmdr) : null, d = ours.cmdr && G.MATE[ours.cmdr];
        if (!row && ours.type !== 'adm') return false;
        var who = d ? d.name : S().player.name, foeName = theirs.leader ? theirs.name : theirs.name + '의 장수';
        var v = await UI.ask((challenger === 'en' ? foeName + U.jx(foeName, '이/가') + ' 앞으로 나와 ' + who + '에게 일기토를 청한다!' : who + U.jx(who, '이/가') + ' ' + foeName + '에게 일기토를 건다!'), [{ label: '일기토를 받는다', value: 1 }, { label: '물러서지 않고 부대로 싸운다', value: 0 }], G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {});
        if (!v) return false;
        duelDone = true;
        var ms = msk(ours), weak = ms && ms.duel ? 1 - ms.duel / 100 : 1;
        var en = { name: foeName, look: e.kind === 'bandit' ? 'brawler' : 'rival', str: Math.round(U.ri(68, 86) * weak), atk: Math.round(U.ri(9, 14) * weak), def: U.ri(3, 7), skill: 1, mar: Math.round(U.ri(65, 85) * weak), int: 50, cha: 50 };
        var res = await G.Games.duel(en, row ? { mate: row, place: 'land', fastEnd: opt.fastEnd } : { place: 'land', fastEnd: opt.fastEnd });
        if (G.Audio) G.Audio.music('landwar');   // 일기토가 끝나면 다시 육상전 곡
        if (res === 'win') {
          var cut = Math.max(1, Math.round(theirs.n * 0.7)); hurt(theirs, cut, true); focus(theirs.x, theirs.y - 20, 1.2); banner(who + ' 승리!', 1.3);
          say('<b>' + who + U.jx(who, '이/가') + ' 일기토에서 이겼다!</b> ' + theirs.name + U.jx(theirs.name, '이/가') + ' 무너진다.');
          if (G.Audio) G.Audio.sfx('cheer');
        } else if (res === 'lose') {
          hurt(ours, Math.max(1, Math.round(ours.n * 0.3)), true);
          if (row) { row.hurt = S().day + 30; say(who + U.jx(who, '이/가') + ' 일기토에서 쓰러졌다! (30일 동안 다쳐 능력이 절반이 된다)'); }
          else say('제독이 일기토에서 밀렸다! 부대가 흔들린다.');
        }
        return true;
      }
      async function runSpecial(id) {
        var sp = specials().filter(function (x) { return x.id === id; })[0]; if (!sp || !sp.ok) return;
        used[id] = turnNo;
        var ok = sp.p == null || U.chance(sp.p);
        if (id === 'ambush') {
          if (ok) { banner('기습!', 1.2); say('기습이 먹혔다! 적이 우왕좌왕한다.'); await sleep(300); alive(foes).forEach(function (t) { for (var a = 0; a < 3; a++) fx.push({ kind: 'arrow', x0: t.x - 260, y0: t.y - 120, x1: t.x + U.rf(-20, 20), y1: t.y - 14, t: -a * 0.06, life: 0.55 }); }); await sleep(560); alive(foes).forEach(function (t) { hurt(t, Math.max(1, Math.round(t.n * U.rf(0.15, 0.25) * STAFF_DMG)), false); }); stunEn = true; }
          else say('기습을 들켰다! 적이 먼저 달려든다.');
        } else if (id === 'trap') {
          if (ok) { trapOn = true; say('앞길에 함정을 팠다. 다음에 달려드는 적이 걸려들 것이다.'); banner('함정', 1); } else say('함정을 팔 틈이 없었다.');
        } else if (id === 'snipe') {
          var L = foes.filter(function (u) { return u.leader; })[0];
          fx.push({ kind: 'flash', x: 200, y: 180, t: 0, life: 0.2 }); fx.push({ kind: 'shot', x0: 200, y0: 180, x1: L.x, y1: L.y - 24, t: 0, life: 0.3 });
          if (G.Audio) G.Audio.sfx('gun');
          await sleep(320);
          if (ok) { var sn = Math.max(1, Math.round(L.n * (L.n <= 3 ? 1 : Math.min(1, 0.5 * STAFF_DMG)))); hurt(L, sn, true); say('저격 성공! ' + L.name + '에게 명중했다!'); }
          else { hurt(L, 0); say('저격이 빗나갔다...'); }
        } else if (id === 'shells') {
          R.useCharge('shells');
          var art = alive(mine).filter(function (u) { return u.type === 'art'; })[0];
          banner('작렬탄!', 1.2);
          alive(foes).forEach(function (t, i) { fx.push({ kind: 'ball', x0: art.x, y0: art.y - 20, x1: t.x, y1: t.y - 10, t: -i * 0.06, life: 0.7 }); });
          if (G.Audio) G.Audio.sfx('cannon');
          await sleep(700);
          alive(foes).forEach(function (t) { fx.push({ kind: 'boom', x: t.x, y: t.y - 10, t: 0, life: 0.9 }); hurt(t, Math.max(1, Math.round(t.n * Math.min(0.95, U.rf(0.35, 0.5) * STAFF_DMG))), true); });
          say('작렬탄이 적진 한가운데서 터졌다!');
        } else if (id === 'volley') {
          var gs = alive(mine).filter(function (u) { return u.type === 'gun'; });
          var tg = (sel && sel.ord && sel.ord.target && sel.ord.target.n > 0) ? sel.ord.target : null;
          if (!tg) { var cand = []; gs.forEach(function (g) { cand = cand.concat(targetsOf(g)); }); tg = bestTarget(gs[0], cand); }
          if (!tg) { say('일제 사격 — 총이 닿는 적이 없다.'); return; }
          banner('일제 사격!', 1.1);
          for (var i = 0; i < gs.length; i++) { if (canHit(gs[i], tg)) { gs[i].ordDone = true; await strike(gs[i], tg, 'volley'); } }
          say('총병들이 한꺼번에 ' + tg.name + U.jx(tg.name, '을/를') + ' 쏘았다!');
        } else if (id === 'cry') {
          cryOn = true; banner('함성!', 1.1); if (G.Audio) G.Audio.sfx('cheer'); say('제독이 칼을 높이 들고 외친다 — 우리 편이 힘을 낸다! (이번 차례 +20%)');
        } else if (id === 'roar') {
          var ru = sp.u, t2 = alive(foes).filter(function (u) { return eff(u) === 0; })[0];
          onceUsed[ru.cmdr] = 1;
          if (t2) { t2.stun = 1; t2.intent = { act: 'stun' }; banner('호통!', 1.1); say(G.MATE[ru.cmdr].name + '의 호통에 ' + t2.name + U.jx(t2.name, '이/가') + ' 얼어붙었다!'); }
        }
      }
      function mainAct(u) { return u.ord ? u.ord.act : 'wait'; }
      async function turn() {
        if (busy || over || phase !== 'fight') return; busy = true;
        try {
          cmdBarLock();
          // 0) 제독의 특수 작전
          if (pendingSpecial) { var ps = pendingSpecial; pendingSpecial = null; await runSpecial(ps); }
          // 1) 우리 편: 자세 · 움직임
          alive(mine).forEach(function (u) { var a = mainAct(u); u.stance = a === 'guard' ? 'guard' : a === 'charge' ? 'charge' : null; u.chargeK = 1; u.chargeRisk = 1;
            if (a === 'charge') { var ms = msk(u); if (ms && ms.kind === 'charge' && (!ms.once || !onceUsed[u.cmdr])) { u.chargeK = Math.max(1, ms.k / ((K.charge || [1.5])[0])); u.chargeRisk = ms.risk || 1; if (ms.once) onceUsed[u.cmdr] = 1; } } });
          alive(mine).forEach(function (u) { var a = mainAct(u); if (a === 'adv') { if (!moveUnit(u, -1) && !u.ord.auto) say(unitName(u) + ' — 앞에 자리가 없다.'); } else if (a === 'back') moveUnit(u, 1); });
          place(); await sleep(300);
          // 2) 우리 편 공격 (앞줄부터)
          var order = alive(mine).slice().sort(function (a, b) { return a.line - b.line; });
          for (var i = 0; i < order.length; i++) {
            var u = order[i], a = mainAct(u); if (u.ordDone) { u.ordDone = false; continue; }
            if (u.n <= 0 || !alive(foes).length || outcome()) break;
            if (a !== 'attack' && a !== 'charge') continue;
            var t = u.ord.target && canHit(u, u.ord.target) ? u.ord.target : bestTarget(u, targetsOf(u));
            if (!t) continue;
            if ((reachOf(u) === 'melee' || reachOf(u) === 'cav') && t.leader && u.cmdr && !duelDone && !opt.fastEnd) { if (await maybeDuel(u, t, 'me')) continue; }
            await strike(u, t, a);
          }
          hiddenMe = false;
          var r = outcome();
          if (!r) r = await enemyPhase();
          // 4) 독 · 시간
          [mine, foes].forEach(function (list) { alive(list).forEach(function (u) { if (u.poison > 0) { u.poison--; var pn = Math.max(1, Math.round(u.n * 0.06)); hurt(u, pn, false); } if (u.stun > 0) u.stun--; }); });
          if (ammoT > 0) ammoT--; if (fogT > 0) fogT--;
          cryOn = false; hakaT = false;
          alive(mine).concat(alive(foes)).forEach(function (u) { u.stance = null; });
          r = r || outcome();
          place();
          if (r) return end(r);
          turnsDone++;
          if (opt.halt && turnsDone >= (opt.halt.turn || 2)) { auto = false; if (opt.halt.text) say(opt.halt.text); await sleep(600); return end('truce'); }
          // 5) 사건 (판마다 한 번쯤)
          if (!eventDone && turnNo >= 1 && turnNo <= 4 && U.chance((K.event || 0.55) / 3)) await runEvent();
          turnNo++;
          planEnemy(); refreshOrders();
          turnCard();
          var tot = U.sum(mine, function (u) { return u.n; }), et = U.sum(foes, function (u) { return u.n; });
          say('<b>' + turnNo + '번째 차례</b> — 아군 ' + tot + '명 · 적 ' + et + (e.kind === 'beast' ? '마리' : '명') + (weather === 'rain' ? ' · 비' : '') + (fogT > 0 ? ' · 안개' : '') + (HOLD ? ' · <b>빠져나가기까지 ' + Math.max(0, HOLD - rounds) + '차례</b>' : '') + ' — 적 위의 글이 적이 다음에 할 일이다.');
          busy = false; cmdBar();
          if (auto) setTimeout(function () { if (auto && !over) turn(); }, 650);
        } catch (er) { console.error(er); busy = false; if (!over) cmdBar(); }
      }
      function turnCard() {
        fxS.push({ kind: 'turn', text: '제 ' + turnNo + ' 차례', t: 0, life: 1.3 });
        var loud = alive(foes).filter(function (u) { var a = u.intent && u.intent.act; return a === 'charge' || a === 'volley' || a === 'roar' || a === 'ambush' || a === 'duel' || a === 'flee'; });
        loud.forEach(function (u, i) { fx.push({ kind: 'pop', u: u, t: -i * 0.12, life: 1.6 }); });
        if (loud.length) { var u0 = loud[0], a0 = u0.intent.act; bubble(u0, a0 === 'roar' ? '크아아아앙!' : a0 === 'flee' ? '여, 열세다…' : a0 === 'duel' ? '내 칼을 받아라!' : U.pick(SHOUT[e.kind] || SHOUT.attack), 1.6); }
      }
      function cmdBarLock() { [].forEach.call(btns.querySelectorAll('button'), function (b) { b.disabled = true; }); popEl.hidden = true; tipEl.hidden = true; }
      async function enemyPhase() {
        if (stunEn) { stunEn = false; say('적은 발이 묶여 이번에는 움직이지 못한다.'); await sleep(300); if (HOLD) rounds++; return outcome(); }
        var al = alive(foes);
        // 우두머리 행동
        var L = al.filter(function (u) { return u.leader; })[0];
        if (L && L.intent && L.intent.act === 'flee') { say('<b>' + L.name + U.jx(L.name, '이/가') + ' 부하들을 버리고 달아났다!</b>'); fled = true; return 'win'; }
        if (L && L.intent && L.intent.act === 'roar') { roared = true; banner('울부짖음!', 1.1); if (G.Audio) G.Audio.sfx('growl'); say(L.name + U.jx(L.name, '이/가') + ' 울부짖는다 — 다음 차례에 짐승 떼가 한꺼번에 덤빈다! (방어로 받아라)'); }
        else if (roared && e.kind === 'beast') roared = false;
        // 자세 · 움직임
        al.forEach(function (u) { var a = u.intent && u.intent.act; u.stance = a === 'guard' ? 'guard' : a === 'charge' ? 'charge' : null; if (a === 'adv') moveUnit(u, -1); });
        place(); await sleep(260);
        for (var j = 0; j < al.length; j++) {
          var u = al[j], it = u.intent || {}; if (u.n <= 0 || !alive(mine).length || outcome()) continue;
          if (['attack', 'charge', 'volley', 'ambush', 'duel'].indexOf(it.act) < 0) continue;
          var t = it.target && canHit(u, it.target) ? it.target : (function () { var ts = targetsOf(u); return ts.length ? (e.kind === 'bandit' ? weakest(ts) : bestTarget(u, ts)) : null; })();
          if (!t) continue;
          if (it.act === 'duel' && !opt.fastEnd) { if (await maybeDuel(t, u, 'en')) continue; }
          await strike(u, t, it.act);
        }
        // 방어하던 우리 근접 부대가 달려든 적을 받아친다 (strike 안에서) — 여기서는 버틴 차례를 센다
        if (HOLD) rounds++;
        return outcome();
      }
      var fled = false;
      async function runEvent() {
        eventDone = true;
        var ev = LD().EVENTS.filter(function (x) { return !x.need || (x.need === 'gun' && alive(mine).some(function (u) { return u.type === 'gun'; })); });
        if (weather === 'rain') ev = ev.filter(function (x) { return x.id !== 'rain'; });
        if (e.kind === 'beast') ev = ev.filter(function (x) { return x.id !== 'reinforce'; });
        var x = U.weighted ? U.weighted(ev, function (q) { return q.w || 1; }) : U.pick(ev); if (!x) return;
        banner(x.banner, 1.3); say('<b>' + x.text + '</b>');
        if (x.id === 'allies') {
          var n = Math.max(3, Math.round(P0 * 0.15)), u = { side: 'me', type: 'inf', ally: true, name: '사냥꾼', n: n, n0: n, ord: null };
          mine.splice(mine.length - 1, 0, u); putAt(mine, u, [1, 0, 2]); u.up = false; place(); if (G.Audio) G.Audio.sfx('cheer');
        } else if (x.id === 'reinforce') {
          var F = Fk.units[0], m = Math.max(3, Math.round(foe0 * 0.2)), r = { side: 'en', name: F[0] + ' (원군)', cls: F[1], pow: F[2], look: F[3], n: m, n0: m };
          foes.splice(foes.length - 1, 0, r); putAt(foes, r, [2, 1, 0]); place(); if (G.Audio) G.Audio.sfx('drums');
        } else if (x.id === 'rain') weather = 'rain';
        else if (x.id === 'fog') fogT = 2;
        else if (x.id === 'ammo') ammoT = 2;
        else if (x.id === 'beasts') {
          [mine, foes].forEach(function (list) { var fr = alive(list).filter(function (u) { return eff(u) === 0; }), t = fr.length ? U.pick(fr) : null; if (t) hurt(t, Math.max(1, Math.round(t.n * U.rf(0.08, 0.14))), false); });
          if (G.Audio) G.Audio.sfx('growl');
        }
        await sleep(500);
      }
      function outcome() {
        var lead = foes.filter(function (u) { return u.leader; })[0], adm = mine.filter(function (u) { return u.leader; })[0];
        if (lead.n <= 0 || !alive(foes).length) return 'win';
        if (adm.n <= 0) return 'lose';
        var tot = U.sum(mine, function (u) { return u.ally ? 0 : u.n; });
        if (tot < P0 * 0.2) return 'lose';
        if (HOLD && rounds >= HOLD) return 'win';
        return null;
      }
      async function tryFlee(before) {
        if (busy || over) return; busy = true;
        var p = (before ? 0.7 : 0.5) + (mountInfo().ride ? 0.15 : 0) - (e.kind === 'beast' ? 0.1 : 0);
        if (U.chance(p)) { say('싸움을 피해 물러났다.'); return end('flee'); }
        say('물러나지 못했다! 적이 뒤를 친다.');
        if (before) { phase = 'fight'; revealed = true; turnNo = 1; mine.forEach(function (u) { u.up = upgraded(u.type); }); planEnemy(); }
        for (var j = 0; j < foes.length; j++) { var u = foes[j]; if (u.n > 0 && !outcome()) { var ts = targetsOf(u); if (ts.length) await strike(u, bestTarget(u, ts), 'attack'); } }
        place(); var r = outcome(); if (r) return end(r);
        refreshOrders(); busy = false; cmdBar();
      }

      // ------------------------------------------------ 끝 — 결과 판
      function end(res) {
        over = true; auto = false; sel = null; popEl.hidden = true; tipEl.hidden = true; finalRes = res;
        var lead = foes.filter(function (u) { return u.leader; })[0];
        var leaderDown = lead.n <= 0;
        var held = res === 'win' && HOLD && rounds >= HOLD && !leaderDown;
        var remain = alive(foes).filter(function (u) { return !u.leader; });
        if (res === 'win' && remain.length) remain.forEach(function (u, i) { u.tx = (u.x || W) + 400; u.march = true; u.fade = 1; if (i < 2) shout(u, 'flee'); });
        if (res === 'win') { alive(mine).forEach(function (u, i) { u.cheer = true; if (i % 2 === 0) setTimeout(function () { shout(u, 'cheer'); }, 300 + i * 220); }); }
        if (res === 'lose') alive(mine).forEach(function (u) { u.tx = u.x - 300; u.march = true; });
        banner(res === 'win' ? (leaderDown ? lead.name + U.jx(lead.name, '을/를') + ' 쓰러뜨렸다!' : held ? '빠져나왔다!' : fled ? '적이 달아났다!' : '승리!') : res === 'lose' ? '패배...' : res === 'truce' ? ((opt.halt && opt.halt.banner) || '싸움이 멈추었다') : '후퇴', 2);
        if (res === 'win' && G.Audio) G.Audio.sfx('cheer');
        var allyN = U.sum(mine.filter(function (u) { return u.ally; }), function (u) { return u.n; });
        var left = U.sum(mine.filter(function (u) { return !u.ally; }), function (u) { return u.n; });
        var back0 = 0;
        if (res === 'win' && captured > 0) { back0 = captured; say('사로잡혀 갔던 대원 ' + captured + '명을 되찾았다!'); }
        left = Math.min(P0, left + back0);
        var dead = P0 - left;
        var back = res === 'flee' && dead === 0 ? 0 : Math.min(dead, Math.round(dead * U.clamp(0.25 + sk('med') * 0.15 + (S().player.st.int > 70 ? 0.05 : 0), 0, 1)));
        var adm = mine.filter(function (u) { return u.leader; })[0];
        if (G.Growth) G.Growth.land(res);
        if (!opt.noHurt) S().player.hp = Math.max(10, Math.round(S().player.hp - 40 * (1 - adm.n / adm.n0)));
        if (G.LandKit && dead > 0) G.LandKit.lose(dead / P0);
        // 전리품
        var sp = { gold: 0, horses: 0, muskets: 0, prisoners: 0, ransom: 0, freed: false };
        if (res === 'win') {
          var nn = foe0, F = e.kind;
          if (F === 'bandit') sp.gold = nn * U.ri(8, 15) * (fled ? 0.5 : 1);
          if (F === 'garrison') sp.gold = nn * U.ri(5, 9);
          sp.gold = Math.round(sp.gold);
          if (foes.some(function (u) { return u.cls === 'cav' || u.cls === 'horsearcher'; }) || (F === 'bandit' && U.chance(0.35)) || (F === 'garrison' && U.chance(0.5))) sp.horses = U.ri(2, 4 + Math.floor(nn / 15));
          if (foes.some(function (u) { return u.look === 'musket'; })) sp.muskets = U.ri(3, 6 + Math.floor(nn / 10));
          if (leaderDown && F !== 'beast') sp.prisoners = Math.round(U.sum(remain, function (u) { return u.n; }) * (K.prisoners || 0.6));
          if (sp.muskets && G.LandKit) G.LandKit.add('musket', sp.muskets);
        }
        btns.innerHTML = ''; unitsEl.innerHTML = '';
        var lines = [];
        if (res === 'truce') lines.push('<b>' + ((opt.halt && opt.halt.after) || '양쪽 모두 무기를 내렸다.') + '</b>');
        else lines.push(res === 'win' ? (leaderDown ? '<b>' + lead.name + U.jx(lead.name, '이/가') + ' 쓰러지자 남은 적이 무기를 버렸다!</b>' : held ? '<b>끝까지 버텨 적을 뿌리치고 빠져나왔다!</b>' : fled ? '<b>적이 우두머리를 따라 흩어져 달아났다!</b>' : '<b>승리했다!</b>') : res === 'lose' ? '<b>패배했다...</b> 살아남은 대원들이 흩어져 물러났다.' : '싸움을 피해 물러났다.');
        if (dead) lines.push('쓰러진 대원 ' + dead + '명 가운데 ' + back + '명이 치료받고 일어섰다.');
        if (allyN) lines.push('도와준 사냥꾼들은 고맙다는 인사를 받고 제 길로 갔다.');
        var loot = [];
        if (sp.gold) loot.push('금화 ' + U.num(sp.gold) + '닢');
        if (sp.horses) loot.push('말 ' + sp.horses + '마리');
        if (sp.muskets) loot.push('화승총 ' + sp.muskets + '정 (탐험 장비에 더함)');
        if (loot.length) lines.push('전리품: ' + loot.join(' · '));
        say(lines.join('<br>'));
        var done = function () { live = false; win.close(res); if (G.Audio) { if (musicBack && musicBack.want && musicBack.want !== 'landwar') { if (G.Audio.setPlace) G.Audio.setPlace(musicBack.place, true); G.Audio.music(musicBack.want); } else G.Audio.music('land'); } resolve({ res: res, dead: dead - back, back: back, left: left + back, leaderDown: leaderDown, held: !!held, spoils: sp }); };
        function okBtn() { var ok = U.el('button', 'btn navy', '확인'); ok.onclick = done; btns.appendChild(ok); }
        if (sp.prisoners > 0 && !opt.fastEnd) {
          var rate = K.ransom || [15, 30], ransom = Math.round(sp.prisoners * U.ri(rate[0], rate[1]) * (e.kind === 'native' ? 0.4 : 1));
          var pr = U.el('div', 'lw-row'); pr.appendChild(U.el('span', 'muted', '포로 ' + sp.prisoners + '명 — '));
          btns.appendChild(pr);
          btn(pr, '몸값을 받는다 <small>금화 ' + U.num(ransom) + '닢</small>', 'gold', function () { S().player.gold += ransom; sp.ransom = ransom; if (G.Game.refreshHud) G.Game.refreshHud(); say('포로들의 몸값으로 금화 ' + U.num(ransom) + '닢을 받았다.'); pr.remove(); okBtn(); }, false, '', true);
          btn(pr, '풀어 준다', 'ghost', function () {
            sp.freed = true; if (G.Fame) G.Fame.add('so', 2);
            if (e.kind === 'native' && regKey) { var fl = S().flags || (S().flags = {}); fl['lwFriend_' + regKey] = S().date.y; say('포로들을 풀어 주었다. 그 땅 사람들이 제독의 이름을 좋게 말할 것이다. (이 땅의 원주민이 한동안 우리를 반긴다)'); }
            else say('포로들을 풀어 주었다. 너그러운 제독이라는 소문이 돈다.');
            pr.remove(); okBtn();
          }, false, '', true);
        } else okBtn();
        if (opt.fastEnd) setTimeout(done, 50);
      }

      // 그림을 누르면: 우리 부대 → 고르고 명령 창을 띄운다 · 적 부대 → 고른 부대의 목표 · 빈 곳 → 닫는다
      function pick(ev) {
        var r = cv.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * W, y = (ev.clientY - r.top) / r.height * H;
        var hit = null, bd = 64 * 64;
        mine.concat(foes).forEach(function (u) { if (u.n <= 0) return; var d = (u.x - x) * (u.x - x) + (u.y - 22 - y) * (u.y - 22 - y) * 1.6; if (d < bd) { bd = d; hit = u; } });
        return hit;
      }
      cv.addEventListener('mousedown', function (ev) {
        if (over || busy) return;
        var hit = pick(ev);
        if (!hit) { if (sel) { sel = null; unitBar(); } return; }
        if (hit.side === 'me') {
          if (phase === 'form' && hit.type === 'adm' && sel !== hit) { sel = hit; unitBar(); return; }
          sel = sel === hit ? null : hit; if (sel) fx.push({ kind: 'ring', x: hit.x, y: hit.y, col: '120,220,255', t: 0, life: 0.4 }); unitBar(); return;
        }
        if (phase !== 'fight') return;
        if (!sel || sel.n <= 0 || !canHit(sel, hit)) {
          var cand = alive(mine).filter(function (u) { return canHit(u, hit); }).sort(function (p, q) { return vsK(q, hit) - vsK(p, hit); })[0];
          if (!cand) { say(hit.name + ' — 지금 닿는 우리 부대가 없다. 부대를 전진시키자.'); return; }
          if (sel && sel.n > 0) say(unitName(sel) + U.jx(unitName(sel), '은/는') + ' ' + hit.name + '에게 닿지 않아 ' + unitName(cand) + U.jx(unitName(cand), '이/가') + ' 맡는다.');
          sel = cand;
        }
        setOrder(sel, sel.ord && sel.ord.act === 'charge' ? 'charge' : 'attack', hit);
        fx.push({ kind: 'ring', x: hit.x, y: hit.y, col: '255,110,80', t: 0, life: 0.5 });
        var v = vsK(sel, hit);
        say('<b>' + unitName(sel) + '</b> → ' + hit.name + (v >= 1.15 ? ' — <b class="good-text">유리</b>' : v <= 0.87 ? ' — <b class="warn-text">불리</b>' : '') + (hit.leader && alive(foes).filter(function (u) { return !u.leader; }).length >= 2 ? ' (우두머리는 호위가 단단하다 — 다른 적을 먼저)' : ''));
        unitBar();
      });
      cv.addEventListener('mousemove', function (ev) {
        var hit = over ? null : pick(ev);
        hover = hit; cv.style.cursor = hit ? 'pointer' : 'default';
        if (!hit || busy) { tipEl.hidden = true; return; }
        tipEl.innerHTML = tipFor(hit); tipEl.hidden = false;
        var r = cv.getBoundingClientRect(), x = ev.clientX - r.left + cv.offsetLeft, y = ev.clientY - r.top + cv.offsetTop;
        var w = tipEl.offsetWidth, left = x + 16 + w > cv.offsetLeft + cv.clientWidth ? x - 16 - w : x + 16;
        tipEl.style.left = Math.round(left) + 'px'; tipEl.style.top = Math.round(Math.max(cv.offsetTop + 4, y - tipEl.offsetHeight - 10)) + 'px';
      });
      cv.addEventListener('mouseleave', function () { hover = null; tipEl.hidden = true; });
      var unkey = UI.pushKey(function (ev) {
        if (over) return false;
        var k = ev.key;
        if (phase === 'form' && (G.Keys.is(ev, 'confirm') || G.Keys.is(ev, 'confirmAlt'))) { start(); return true; }
        if (k === 'Escape' && sel) { sel = null; unitBar(); return true; }
        if (k === 'Tab' && phase === 'form') { var af = mine.filter(function (u) { return u.type !== 'adm'; }), j = af.indexOf(sel); sel = af[(j + 1) % af.length]; unitBar(); return true; }
        if (phase !== 'fight' || busy) return false;
        if (k === '1') { alive(mine).forEach(function (u) { u.ord = autoOrder(u); }); turn(); return true; }
        if (k === '2') { alive(mine).forEach(function (u) { u.ord = { act: 'guard', auto: true }; }); turn(); return true; }
        if (k === ' ' || k === 'Enter') { turn(); return true; }
        if (k === 'Tab') { var a = alive(mine), i = a.indexOf(sel); sel = a[(i + 1) % a.length]; unitBar(); return true; }
        var n = parseInt(k, 10); if (n >= 3 && n <= 9) { var x = specials()[n - 3]; if (x && x.ok) pickSpecial(x); return true; }
        return false;
      });
      win.result.then(function () { live = false; unkey(); });
      formBar();
    });
  };
})(window.G = window.G || {});
