/* 임진왜란 — 동래에서 노량까지 (G.Imjin) 2026-10-30 사용자 요청
   사람·소지품·조정값: js/data/imjin.js (G.HIST_FIG · h_kimdeokryeong · imjin_silk · imjin_gat · G.BALANCE.imjin)
   날짜는 게임의 양력이다 (부산 상륙 음력 4.13 = 양력 1592.5.23 · 동래성 함락 5.25 — js/data/dominion_notes.js 와 같다)
   ■ ① 부름 (1592.1.1~5.22): 조선에 들른 적이 있으면 동아시아 항구에서 동래의 김시민이 보낸 군관이 제독을 찾는다 — 「조선이나 명의 배로 부산포에 와 달라」
   ■ ② 부산포 앞바다 (1592.5.23~7.31, 동래 입항 전 — js/scenes/sea.js): 조선 군선·명나라 배(G.BALANCE.imjin.eastShips)가 함대에 있으면
        왜선들이 조선 수군으로 알고 덤빈다 → 해전 (G.Rel.greatBattle — 끝나면 동래로). 그런 배가 없으면 왜선은 본체만체 지나간다 (이야기는 열리지 않는다)
   ■ ③ 동래 읍성: 왜병에게 끌려가는 논개를 구한다(육상전 — 지면 김시민의 군사가 달려와 함께 구한다) → 논개를 태우거나, 뒤에 술집에서 만날 수 있다
        → 김시민: 송상현 부사가 성을 지킨다 · 「북쪽에 왜군의 수와 조총을 알려 달라」 · 비단 궤짝(팔 수 없다)을 여비로 맡긴다
        → 부산포 어귀는 왜선이 막았다: 북쪽에 소식을 전할 때까지 동래에서 출항할 수 없다 (js/city/harbor.js) — 성문으로 나간다
   ■ ④ 성문을 나서자마자 (뭍 — js/scenes/land.js): 왜군 조총대를 뚫는 육상전
   ■ ⑤ 탄금대 (충주): 신립이 조총을 비웃는다 — 「기마대면 충분하오」 → 육상전. 이기든 지든 신립이 제독을 구해 내고 강으로 돌아선다 · 소식이 닿아 동래 포구가 풀린다
   ■ ⑥ 한양 (도시): 경복궁을 빠져나가는 선조 · 불타는 궁궐과 절망한 사람들 · 「그래도 나라를 지켜야」 하는 젊은 의병들 · 백성의 원망을 듣는 광해군 · 백성을 살리려는 허준 · 갓장수
   ■ ⑦ 한양을 나선 길 (뭍): 피란민을 구하는 곽재우 → 김덕령이 함께 → 남쪽 바다 이순신의 소식. 갓을 썼으면 둘을 부하로 맞을 수 있다
   ■ ⑧ 행주산성 (뭍): 권율에게 비단 궤짝을 전한다 → 조선의 명예 작위 · (갓이 없었으면 진영의 갓장수 — 두 번째 기회)
   ■ ⑨ 부산(동래)으로 돌아오면: 원균 — 배를 가라앉히고 술잔을 든 경상우수사 → 원균을 떠나 이순신에게 → 옥포 해전 (끝나면 한산도로)
   ■ ⑩ 한산도: 학익진 — 한산도 대첩 → 「바다가 다시 끓는 날 부르겠소」
   ■ ⑪ 1597.8~ (동래·한산도): 이순신이 압송되고 원균이 통제사 — 칠천량 해전 (조선 수군의 패배: 이기면 열두 척을 건져 낸다)
   ■ ⑫ 1598.12~ (동래·한산도): 노량 해전 (진린의 명 수군과 함께) → 이순신이 총에 맞는다. 의술이 있는 부하나 제독이 살려 내면
        「전쟁은 이제 끝났다. 나의 죽음을 알리지 마라」 — 이순신이 세상에서 사라져 제독과 함께 떠난다 (동료). 없으면 역사 그대로
   ■ 이순신과 함께하는 해전(옥포·한산·칠천량·노량): 내 함대가 turtleTo(5)척 미만이면 모자란 수만큼 거북선이 기함이 아닌 우리 편 배로 합류한다
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/imjin_*.webp
   ■ 저장: s.imjin = { call, noShip, sea, nongae, nongaeJoin, north, silk, breakout, tangeum, delivered, seoul, gat, gwak, gwakJoin, haengju, title1, wongyun, okpo, hansan, hansanSaid, chil, chilSaid, noryang, yi, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var IJ = G.Imjin = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.imjin) || {}; }
  var DONGNAE = 226, HANYANG = 190, HANSAN = 229, KOREA = [190, 226, 227, 228, 229];
  var TANGEUM = [127.90, 36.99], HAENGJU = [126.82, 37.60];
  IJ.PLACES = { tangeum: TANGEUM, haengju: HAENGJU };
  var D = IJ.D = { callFrom: 15920101, callTo: 15920522, warFrom: 15920523, warTo: 15920731, chil: 15970801, noryang: 15981201 };
  var NEWS_AT = { busanjin: 15920524, dongnaeFall: 15920525, gwakRise: 15920601, tangeumNews: 15920607, flight: 15920609, seoulFall: 15920612, okpoNews: 15920616,
    hansanNews: 15920814, haengjuNews: 15930314, jinju: 15930727, deokryeong: 15960915, chilNews: 15970827, myeongnyang: 15971026, noryangNews: 15981216 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.imjin) {
      s.imjin = { told: {} };
      var t0 = U.dateNum(s.date);
      Object.keys(NEWS_AT).forEach(function (k) { if (t0 > NEWS_AT[k]) s.imjin.told[k] = 1; });   // 옛 저장
    }
    if (!s.imjin.told) s.imjin.told = {};
    return s.imjin;
  }
  IJ.state = st;
  // 논개: 동래에서 구하기 전에는 술집에 나오지 않는다 — 구한 뒤로는 조선 땅의 술집에서 만날 수 있다 (js/systems/frontier.js — eventOnly)
  (function setup() {
    var m = G.MATE && G.MATE.h_nongae; if (!m) return;
    if (m.y && m.y[1] < 1610) m.y = [m.y[0], 1610];   // 구했으면 1593년 진주에서 죽지 않는다
    try {
      Object.defineProperty(m, 'eventOnly', { configurable: true, enumerable: true, get: function () { var s = S(), b = s && s.imjin; return !(b && b.nongae); } });
    } catch (e) { m.eventOnly = true; }
  })();
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function atCity(id) { return cityNow() === id; }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function mateSp(id, emo) { return G.Legend && G.Legend.speaker && G.MATE[id] ? G.Legend.speaker(id, emo) : { name: (G.MATE[id] || {}).name || id, lang: 3 }; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관', lang: 3 }; }
  var CROWD = { name: '피란민', lang: 3 }, YOUTH = { name: '젊은 의병', lang: 3 }, PEDDLER = { name: '갓장수', lang: 3 }, OFFICER = { name: '김시민의 군관', lang: 3 }, SOLDIER = { name: '왜병', lang: 3 };
  var WHO = { P: me, N: function (e) { return mateSp('h_nongae', e); }, GJ: function (e) { return mateSp('h_gwakjaeu', e); }, KD: function (e) { return mateSp('h_kimdeokryeong', e); },
    YS: function (e) { return mateSp('h_yisunsin', e); }, HJ: function (e) { return mateSp('h_heojun', e); }, F: first };
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l) continue;
      var w = l[0], who = w && typeof w === 'object' ? w : w && WHO[w] ? WHO[w](l[2]) : w ? H(w) : {};
      await UI.say(l[1], who);
    }
  }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { await pc.stop(); } }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function log(t) { G.State.log(t); }
  function fame(kind, key) { var n = (K().fame || {})[key] || 0; return n ? G.Fame.add(kind, n) : 0; }
  function give(id) { var s = S(); if (R.hasItem && R.hasItem(id)) return; var ok = R.addItem ? R.addItem(id) : false; if (!ok) s.player.items.push({ id: id }); }
  function has(id) { return !!(R.hasItem && R.hasItem(id)); }
  function city(id) { return G.CITY_DATA[id]; }
  function dist(lon, lat, p) { return G.Geo.dist(lon, lat, p[0], p[1]); }
  function inKorea(lon, lat) { return lon > 125.4 && lon < 129.9 && lat > 33.9 && lat < 39.6; }
  /** 이번에 들어온 도시를 빼고 조선 도시에 들른 적이 있는가 (도착하면 s.visited가 하나 는다 — js/scenes/city.js) */
  function visitedKorea(cur) {
    var v = S().visited || {};
    return KOREA.some(function (id) { var n = v[id] || 0; if (id === cur) n -= 1; return n > 0; });
  }
  IJ.visitedKorea = visitedKorea;
  function hasEast() { var L = K().eastShips || []; return (S().fleet.ships || []).some(function (x) { return L.indexOf(x.type) >= 0; }); }
  IJ.hasEast = hasEast;
  function eastNames() { return (K().eastShips || []).map(function (id) { return G.SHIP[id] ? G.SHIP[id].name : id; }).join('·'); }
  function leaveMate(id) {
    var s = S(), i = -1; s.mates.forEach(function (x, k) { if (x.id === id) i = k; });
    if (i < 0) return false;
    s.mates.splice(i, 1); return true;
  }
  function join(id, loyal) {
    if (row(id) || !G.Legend || !G.Legend.join) return row(id);
    var m = G.Legend.join(id, city(cityNow() != null ? cityNow() : DONGNAE)); if (m && loyal) m.loyal = loyal;
    return m;
  }
  /** 도시 안의 육상전 — 선원이 그대로 탐험대가 된다 (js/systems/potosi.js 와 같다) */
  async function landFight(name, n, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, n, false, o); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }
  function foe(k) { return (K().foe || {})[k] || 20; }
  /** 조선의 명예 작위 한 칸 (js/systems/court.js — G.COURT.realms.KR) */
  async function titleUp(by, why) {
    var CT = G.Court, realm = G.COURT && G.COURT.realms && G.COURT.realms.KR, s = S();
    if (!CT || !realm) return null;
    var c = CT.state(), n = CT.rank(realm) + 1, tt = CT.title(realm, n);
    if (!tt) { s.player.gold += 5000; UI.toast('조선 조정의 하사금 금화 +5,000', 'coin', 5000); log(why + ' 조선 조정이 하사금 금화 5,000닢을 내렸다.'); return 'gold'; }
    c.titles[realm.id] = n;
    if (G.Growth && G.Growth.event) G.Growth.event('cha', 1, tt.ko + ' 제수 — 조선 조정의 예법을 익혔다');
    await UI.alert('<div class="center"><div style="font-size:17px" class="muted">' + U.esc(realm.name) + ' · 명예 작위</div><div style="font-size:34px;font-weight:800;margin:6px 0">' + U.esc(tt.ko) + '</div><div style="font-size:16px" class="muted">' + U.esc(by) + '</div><div style="margin-top:10px">' + U.esc(why) + '</div></div>', '명예 작위');
    log(why + ' 조선의 명예 작위 ' + (CT.fullName ? CT.fullName(tt, true) : tt.ko) + '를 받았다.');
    UI.toast((CT.fullName ? CT.fullName(tt, true) : tt.ko) + ' — 조선의 명예 작위', 'crown', 6000);
    if (G.Audio) G.Audio.sfx('discover');
    return tt.ko;
  }

  // ================================================================ 해전 자료
  var JP_NAMES = ['고니시의 안택선', '도도 다카토라의 안택선', '와키자카의 안택선', '가토 요시아키의 안택선', '구키 요시타카의 안택선', '마쓰우라의 관선', '시마즈의 관선', '고토의 관선', '아리마의 관선', '오무라의 관선', '쓰시마의 관선', '이키의 관선', '하카타의 관선', '나고야의 관선', '세토 내해의 관선', '척후 소조', '전령 소조', '불화살 소조', '물길잡이 소조', '마지막 소조'];
  function jpFleet(atake, seki, koba) {
    var ships = [], names = [], i;
    for (i = 0; i < atake; i++) { ships.push('atakebune'); names.push(JP_NAMES[i % 5]); }
    for (i = 0; i < seki; i++) { ships.push('sekibune'); names.push(JP_NAMES[5 + i % 10]); }
    for (i = 0; i < koba; i++) { ships.push('kobaya'); names.push(JP_NAMES[15 + i % 5]); }
    return { ships: ships, names: names };
  }
  /** 내 함대가 turtleTo척 미만이면 모자란 수만큼 거북선 — 기함이 아닌 우리 편 배로 (js/scenes/battle.js npc.allies) */
  function turtles() {
    var n = (S().fleet.ships || []).length, need = Math.max(0, (K().turtleTo || 5) - n), out = [];
    for (var i = 0; i < need; i++) out.push({ type: 'geobukseon', name: '거북선 ' + (i + 1) + '호', gun: 'culverin' });
    return out;
  }
  IJ.turtles = turtles;
  function korean(names, type) { return names.map(function (nm) { return { type: type || 'panokseon', name: nm, gun: 'culverin' }; }); }
  function spec(o) {
    var f = jpFleet(o.jp[0], o.jp[1], o.jp[2]);
    var x = { id: o.id, foe: '일본', ships: f.ships, names: f.names, foeLabel: o.label, allies: (o.allies || []).concat(o.turtle ? turtles() : []),
      who: o.who, intro: o.intro, ask: o.ask, decline: o.decline, fightLabel: o.fightLabel, noLabel: o.noLabel, gun: 'perrier', gunK: o.gunK || 0.8, crewK: o.crewK || 1,
      gunNote: o.gunNote, win: o.win, lose: o.lose, backCity: o.back, noPrize: !!o.noPrize, place: o.place };
    x.onWin = function () { var b = st(); if (b) b[o.key] = 'won'; };
    x.onLose = function () { var b = st(); if (b && b[o.key] !== 'won') b[o.key] = 'lost'; };
    return x;
  }
  /** 큰 해전을 연다 — 앞서 물러났거나 졌어도 다시 싸울 수 있게 기록을 지운다 (js/systems/huguenot.js 와 같다) */
  async function sea(sp) {
    var s = S(); if (!G.Rel || !G.Rel.greatBattle) return false;
    G.Rel.register(sp);
    if (s.rel && s.rel.battle) delete s.rel.battle[sp.id];
    return await G.Rel.greatBattle(sp);
  }
  function busanSpec() {
    var n = (S().fleet.ships || []).length;
    return spec({ id: 'imjin_busan', key: 'sea', jp: [1, Math.min(4, 1 + n), Math.min(3, 1 + Math.floor(n / 2))], label: '고니시 유키나가의 선봉 함대', back: DONGNAE, noPrize: false, place: '부산포 앞바다',
      intro: '제독! 왜선들이 우리 배를 보고 뱃머리를 돌립니다 — 조선 수군인 줄 아는 모양입니다! 피할 길이 없습니다!',
      ask: '부산포 앞바다 — 왜선들이 덤벼든다', fightLabel: '맞서 싸운다', noLabel: '뱃머리를 돌려 물러난다', decline: '…저 많은 배와는 싸울 수 없습니다. 일단 물러납시다.',
      gunNote: '왜선은 큰 포가 적다 — 배에 붙어 뛰어드는 무사들을 조심하시오. 멀리서 포로 부수는 편이 낫습니다.',
      win: { fame: K().fame.busan, text: '부산포 앞바다에서 왜군 선봉의 배들을 물리치고 동래 포구로 들어갔다.' },
      lose: '부산포 앞바다에서 왜선에 쫓겨, 부서진 배를 끌고 간신히 동래 포구로 숨어들었다.' });
  }
  IJ.busanSpec = busanSpec;
  function okpoSpec() {
    return spec({ id: 'imjin_okpo', key: 'okpo', jp: [2, 4, 2], label: '도도 다카토라의 함대', back: HANSAN, turtle: true, place: '옥포 앞바다',
      allies: korean(['이순신의 대장선', '전라좌수영 판옥선', '녹도 만호 정운의 판옥선', '광양 현감 어영담의 판옥선']),
      who: { mate: 'h_yisunsin' },
      intro: '전라좌수사 이순신이오. 원 수사의 일은 들었소. …나는 바다를 버리지 않소. 옥포 포구에 왜선 서른 척이 닻을 내리고 마을을 털고 있다 하오. 함께 가 주겠소? 「가볍게 움직이지 말고 산처럼 무겁게 지키라」 — 오늘 우리 배의 군령이오.',
      ask: '옥포 해전 — 이순신의 함대와 함께 싸우겠는가?', decline: '…그대의 사정도 있겠지. 우리끼리 나가겠소. 한산도에서 다시 봅시다.',
      gunNote: '판옥선의 총통은 멀리 무겁게 쏩니다. 왜선이 붙기 전에 부수시오 — 거북선은 적진을 헤집습니다.',
      win: { fame: K().fame.okpo, gold: 1500, text: '옥포 해전 — 이순신의 함대와 함께 왜선을 깨뜨렸다. 조선 수군의 첫 승리다!' },
      lose: '옥포 앞바다에서 물러났다. 이순신의 함대는 홀로 싸웠다.' });
  }
  function hansanSpec() {
    return spec({ id: 'imjin_hansan', key: 'hansan', jp: [3, 6, 2], label: '와키자카 야스하루의 함대', back: HANSAN, turtle: true, place: '견내량과 한산도 앞바다',
      allies: korean(['이순신의 대장선', '전라우수사 이억기의 판옥선', '이운룡의 판옥선', '어영담의 판옥선', '방답 첨사의 판옥선']),
      who: { mate: 'h_yisunsin' },
      intro: '견내량은 물길이 좁고 암초가 많소. 판옥선이 싸우기에 좋지 않지. 그래서 판옥선 대여섯 척으로 왜선을 넓은 한산도 앞바다로 꾀어낼 것이오. 그들이 따라 나오면 — 학이 날개를 펴듯 둘러싸는 거요. 학익진(鶴翼陣)이오.',
      ask: '한산도 대첩 — 학익진의 날개가 되어 싸우겠는가?', decline: '…좋소. 배를 고치고 다시 오시오. 바다는 기다려 줄 것이오.',
      gunNote: '학익진 — 적을 넓은 바다로 끌어내 반달 모양으로 감싸고 총통을 한꺼번에 쏩니다. 적 기함(와키자카의 안택선)을 노리시오.',
      win: { fame: K().fame.hansan, gold: 3000, so: 120, text: '한산도 대첩 — 학익진으로 와키자카의 함대를 무너뜨렸다! 왜군의 바닷길이 끊겼다.' },
      lose: '한산도 앞바다에서 물러났다.' });
  }
  function chilSpec() {
    return spec({ id: 'imjin_chil', key: 'chil', jp: [4, 7, 2], label: '도도 다카토라·가토 요시아키의 연합 함대', back: HANSAN, turtle: true, crewK: 1.15, place: '칠천량',
      allies: korean(['원균의 대장선', '경상우수영 판옥선', '충청수영 판옥선', '배설의 판옥선']),
      who: { hist: 'wongyun' },
      intro: '하하, 왔는가! 이순신이 잡혀간 뒤로 내가 삼도수군통제사일세. 조정에서는 부산으로 쳐들어가라 성화고… 군사들은 밤새 노를 저어 지쳤네만, 뭐 어떤가. 왜놈 배쯤이야. 칠천도에 닻을 내리고 한숨 자고 내일 단숨에 쓸어버리세!',
      ask: '칠천량 — 지친 원균의 함대가 한밤에 둘러싸였다. 함께 싸우겠는가?', fightLabel: '배를 붙여 싸운다 — 한 척이라도 더 건진다', decline: '…겁쟁이 같으니! 나 혼자서도 이긴다!',
      gunNote: '한밤의 기습 — 조선 함대는 이미 무너지고 있다. 이기려 하기보다 적 기함을 꺾어 빠져나갈 길을 여시오.',
      win: { fame: K().fame.chil, text: '칠천량의 불길 속에서 왜군 기함을 꺾고, 배설의 판옥선 열두 척과 함께 빠져나왔다.' },
      lose: '칠천량에서 조선 수군이 무너졌다. 간신히 몸만 빠져나왔다.' });
  }
  function noryangSpec() {
    return spec({ id: 'imjin_noryang', key: 'noryang', jp: [4, 8, 2], label: '시마즈 요시히로의 함대', back: HANSAN, turtle: true, place: '노량',
      allies: korean(['이순신의 대장선', '판옥선 「안골」', '판옥선 「녹도」', '판옥선 「흥양」']).concat([{ type: 'ljunk', name: '진린의 대선', gun: 'culverin' }, { type: 'ljunk', name: '등자룡의 대선', gun: 'culverin' }, { type: 'junk', name: '명 수군 사선', gun: 'saker' }]),
      who: { mate: 'h_yisunsin' },
      intro: '도요토미가 죽었소. 왜군은 이제 돌아가려 하오. 진린 도독은 고니시의 뇌물을 받고 길을 열어 주자 했소. …나는 거절했소. 이 원수들을 한 척도 그냥 돌려보낼 수 없소. 오늘 밤 노량 물목에서 시마즈의 배 오백 척을 맞소. 「이 원수를 갚는다면 죽어도 여한이 없겠나이다」 — 하늘에 그렇게 빌었소.',
      ask: '노량 해전 — 마지막 바다. 이순신과 함께 싸우겠는가?', decline: '…그대는 살아 돌아가시오. 이 싸움은 우리 것이오.',
      gunNote: '좁은 물목에서의 밤 싸움 — 불화살과 총통이 쏟아진다. 진린의 명 수군이 우리 편에서 싸운다.',
      win: { fame: K().fame.noryang, gold: 4000, so: 200, text: '노량 해전 — 시마즈의 함대를 깨뜨렸다. 칠 년의 전쟁이 끝났다.' },
      lose: '노량의 물목에서 물러났다. 그러나 조선과 명의 배들은 끝까지 싸웠다.' });
  }
  IJ._specs = { busan: busanSpec, okpo: okpoSpec, hansan: hansanSpec, chil: chilSpec, noryang: noryangSpec };

  // ================================================================ 날마다 — 소식
  IJ.daily = function () {
    var s = S(), b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told, met = !!(b.call || b.sea), east = met || !!(s.loc && s.loc.lon != null && s.loc.lon > 95);
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('busanjin', east, 'skull', '【부산진 함락】 대마도를 떠난 왜선 칠백여 척이 부산 앞바다를 메웠다. 부산진 첨사 정발이 검은 갑옷을 입고 싸우다 성과 함께 쓰러졌다. 임진년의 전쟁이 시작되었다.');
    news('dongnaeFall', east, 'castle', '【동래성 함락】 왜장 고니시가 「싸우고 싶으면 싸우고, 아니면 길을 빌려 달라」고 써 보냈다. 동래 부사 송상현은 「싸워 죽기는 쉬우나 길을 빌려주기는 어렵다」고 답하고 조복을 입은 채 성과 함께 죽었다.' + (b.north ? ' 성이 무너지기 전 성문을 빠져나간 이방인 선장 하나가 북쪽으로 소식을 들고 갔다고 한다.' : ''));
    news('gwakRise', east && !b.gwak, 'flag', '【홍의장군】 경상도 의령의 선비 곽재우가 집안의 재산을 털어 의병을 일으켰다. 붉은 옷을 입고 말을 달리며 낙동강의 왜군 배를 친다고 한다.');
    news('tangeumNews', east, 'skull', b.tangeum && b.tangeum !== 'skip'
      ? '【탄금대】 충주 탄금대에서 신립의 기마대가 왜군의 조총에 무너졌다. 신립은 달천 강물에 몸을 던졌다. 그가 마지막으로 말머리를 돌린 것은 포위된 이방인 선장 일행을 빼내기 위해서였다고, 살아남은 군사들이 전한다.'
      : '【탄금대】 충주 탄금대에서 배수진을 친 신립의 기마대가 왜군의 조총에 무너졌다. 신립은 달천 강물에 몸을 던졌다. 이제 한양까지 막을 군사가 없다.');
    news('flight', east && !b.seoul, 'castle', '【파천】 비 내리는 새벽, 임금이 도성을 버리고 북쪽으로 떠났다. 성난 백성들이 궁궐에 불을 질렀다. 노비 문서를 둔 장례원부터 타올랐다고 한다.');
    news('seoulFall', east, 'castle', '【한양 함락】 왜군이 한양에 들어왔다. 부산에 오른 지 스무 날 만이다. 임금은 평양을 거쳐 의주로 향하고, 세자 광해군이 따로 조정을 나누어 백성을 모은다고 한다.');
    news('okpoNews', east && !b.okpo, 'ship', '【옥포 해전】 전라좌수사 이순신이 거제 옥포에서 왜선 스물여섯 척을 깨뜨렸다. 조선 수군의 첫 승리다.');
    news('hansanNews', east && !b.hansan, 'ship', '【한산도 대첩】 이순신이 견내량의 왜선을 한산도 앞바다로 꾀어내 학이 날개를 펴듯 둘러싸고 무찔렀다. 왜군의 바닷길이 끊겼다.');
    news('haengjuNews', east || !!b.haengju, 'flag', b.haengju
      ? '【행주대첩】 행주산성의 권율이 삼만 왜군을 물리쳤다. 산성의 아낙들이 치마에 돌을 날라 싸웠다고 한다. 화살이 떨어질 무렵 강화에서 화살 실은 배가 닿았는데 — 그 화살은 바다의 이방인 선장이 날라 온 동래의 비단으로 산 것이었다.'
      : '【행주대첩】 행주산성의 권율이 삼만 왜군을 물리쳤다. 산성의 아낙들이 치마에 돌을 날라 싸웠다고 한다.');
    var nonOn = b.nongaeJoin === 'yes' || row('h_nongae');
    news('jinju', east || !!b.nongae, 'skull', nonOn
      ? '【진주성】 진주성이 왜군 십만에 무너졌다. 승전 잔치를 벌인 촉석루에서 사람들은 기생 하나를 찾았다. 「그 아이라면 왜장의 목을 안고 남강에 뛰어들었을 것을」 — 그러나 그날 논개는 진주에 없었다. 바다에 있었다.'
      : '【진주성】 진주성이 왜군 십만에 무너졌다. 승전 잔치를 벌인 촉석루에서 기생 논개가 왜장을 껴안고 남강에 몸을 던졌다고 한다.');
    news('deokryeong', east && !!b.gwak, 'skull', row('h_kimdeokryeong') || b.gwakJoin === 'yes'
      ? '【김덕령】 의병장 김덕령을 이몽학의 난에 엮어 잡아들이라는 명이 내려졌다. 그러나 금부도사가 찾아간 곳에 그는 없었다. 바다의 배에 올라 있다는 소문만 남았다.'
      : '【김덕령】 의병장 김덕령이 이몽학의 난에 엮였다는 모함을 받아 옥에서 매를 맞고 죽었다. 스물아홉이었다. 「춘산에 불이 나니」로 시작하는 시조 한 수가 남았다.');
    news('chilNews', east && !b.chil, 'skull', '【칠천량】 삼도수군통제사 원균이 칠천량에서 크게 졌다. 판옥선과 거북선이 거의 모두 불탔다. 원균은 뭍으로 올랐다가 죽었다. 배설이 판옥선 열두 척을 이끌고 달아난 것이 전부라 한다.');
    news('myeongnyang', east && !!(b.hansan || b.chil), 'ship', '【명량】 다시 통제사가 된 이순신이 울돌목에서 판옥선 열세 척으로 왜선 백삼십여 척을 막아 냈다. 「신에게는 아직 열두 척의 배가 있사옵니다」 — 조정에 올린 그의 글이다.' + (b.chil === 'won' ? ' 그 열두 척은 칠천량의 불길 속에서 이방인 선장이 건져 낸 배였다.' : ''));
    news('noryangNews', east && !b.noryang, 'ship', '【노량 해전】 돌아가려는 왜선 오백 척을 이순신과 진린이 노량에서 막아 무찔렀다. 싸움이 끝날 무렵 이순신이 날아온 총알에 맞아 숨을 거두었다. 「싸움이 급하다. 나의 죽음을 알리지 마라.」 칠 년의 전쟁이 끝났다.');
    return out;
  };

  // ================================================================ ① 부름 (1592.1~5.22)
  function callOpen() {
    var b = st(), t = today(), c = cityNow(); if (!b || b.call || b.sea || c == null || t < D.callFrom || t > D.callTo) return false;
    var cc = city(c); if (!cc || [6, 9].indexOf(cc.region) < 0) return false;   // 조선·명·일본의 항구
    return visitedKorea(c);
  }
  async function call() {
    var b = st(); b.call = 1;
    await play([
      [null, '부두에 갓을 쓴 사내 하나가 기다리고 있다. 허리에 환도를 찼다. 낯선 배들 사이를 한참 둘러보다 제독의 깃발을 보고 다가온다.'],
      [OFFICER, '조선 동래에서 온 군관이오. 동래성을 지키는 김시민 장군께서 선장을 찾으시오. 전에 조선 바다에 왔던 이방인 선장이 있다고 들으셨소.'],
      [OFFICER, '대마도에 왜선이 수백 척 모여든다 하오. 조정은 「설마」 하고만 있소. 장군께서는 왜군의 배가 언제, 얼마나 오는지 바다에서 볼 사람이 필요하다 하시오.'],
      [OFFICER, '다만 — 부산포가 싸움터가 되면 남만의 배는 왜선이 쳐다보지도 않을 것이고, 성은 문을 열지 않을 것이오. 조선의 군선이든 명나라의 배든, 그 깃발을 단 배로 와 주시오. (' + eastNames() + ')'],
      ['F', '제독, 왜군이 쳐들어온다는 소문이 정말이라면… 동래까지는 며칠 뱃길입니다. 어떻게 하시겠습니까?']
    ]);
    log('동래의 김시민 장군이 보낸 군관을 만났다 — 조선이나 명의 배를 이끌고 부산포로 와 달라고 한다.');
    UI.toast('김시민의 부름 — 조선·명의 배로 부산포(동래)에', 'scroll', 5600);
  }

  // ================================================================ ② 부산포 앞바다 (동래 입항 전 — js/scenes/sea.js)
  IJ.beforePort = async function (c) {
    var b = st(), t = today(); if (!b || !c || c.id !== DONGNAE || b.sea || t < D.warFrom || t > D.warTo) return false;
    if (!visitedKorea(null)) return false;
    if (!hasEast()) {
      if (!b.noShip) {
        b.noShip = 1;
        await play([
          [null, '부산포 앞바다가 왜선으로 새카맣다. 수백 척이 돛을 내리고 뭍으로 군사를 쏟아 낸다. 부산진 쪽에서 검은 연기가 오른다.'],
          ['F', '제독, 왜선들이 우리 배를 힐끗 보고는 그냥 지나갑니다. 남만의 배라 상관하지 않는 모양입니다. …조선이나 명의 배였다면 저들이 곧장 덤볐겠지요.']
        ]);
        UI.toast('조선 군선이나 명나라 배(' + eastNames() + ')가 있어야 이 이야기가 이어집니다 — 7월 말까지', 'ship', 6500);
      }
      return false;
    }
    return await busan();
  };
  async function busan() {
    var b = st(); b.met = 1;
    await withPic('imjin_busan', '부산포 앞바다 (1592)', function () { return play([
      [null, '부산포 앞바다. 수평선 끝까지 왜선의 돛이 늘어섰다. 칠백 척이 넘는다. 부산진 성벽 위로 검은 연기가 오르고, 콩 볶는 듯한 조총 소리가 바다까지 들린다.'],
      [null, '그때, 왜선 몇 척이 뱃머리를 돌린다. 제독의 배에 달린 동방의 돛과 노를 본 것이다. 북이 울리고, 깃발이 오른다.'],
      [SOLDIER, '(바람결에 들리는 외침) 조선의 수군이다! 배를 붙여라!']
    ]); });
    var went = await sea(busanSpec());
    if (!went) { log('부산포 앞바다에서 왜선을 피해 뱃머리를 돌렸다.'); return true; }   // 물러나도 이번에는 들어가지 않는다 — 다시 와야 한다
    return true;
  }

  // ================================================================ ③ 동래 읍성 — 논개 · 김시민
  function nongaeOpen() { var b = st(); return !!(b && b.sea && !b.nongae && atCity(DONGNAE)); }
  async function nongae() {
    var b = st(), k = K();
    await withPic('imjin_dongnae', '동래 읍성 (1592)', function () { return play([
      [null, '동래 포구. 부두에는 피란 보따리를 진 사람들이 우왕좌왕한다. 부산진이 무너졌다는 소식에 성 안 사람들은 얼굴이 하얗다.'],
      [null, '그때 골목 끝에서 비명이 들린다. 성벽을 넘어 먼저 들어온 왜병 열댓이 여인 하나를 끌고 간다. 여인은 비녀를 뽑아 들고 한 놈의 팔을 찔렀다.'],
      [SOLDIER, '이 계집이! 묶어라, 대장께 바칠 것이다!']
    ]); });
    var gunP = Math.min(0.85, 0.3 + (R.skill ? R.skill('gun') || 0 : 0) * 0.15);
    var v = await UI.ask('왜병들이 여인을 끌고 간다!', [
      { label: '칼을 뽑고 뛰어든다', value: 'fight', icon: 'sword' },
      { label: '조총을 하늘에 쏘아 겁을 준다 (' + Math.round(gunP * 100) + '%)', value: 'scare', icon: 'cannon' }], me());
    var res = 'win';
    if (v === 'scare' && U.chance(gunP)) {
      await play([[null, '탕! 탕! 선원들이 한꺼번에 쏜 총소리가 골목을 울린다. 왜병들은 조선군이 몰려온 줄 알고 여인을 내팽개치고 달아났다.']]);
      b.nongae = 'scared';
    } else {
      if (v === 'scare') await play([[null, '총소리에 왜병들이 멈칫했지만, 이내 조총을 겨누며 돌아섰다. 싸울 수밖에 없다!']]);
      res = await landFight('여인을 끌고 가는 왜병', foe('nongae'), { kind: 'garrison', guns: true, leader: '왜병 조장', noSpecial: true });
      b.nongae = res === 'win' ? 'saved' : 'kimsimin';
      if (res !== 'win') await play([[null, '왜병의 칼날이 제독의 어깨를 스치는 순간 — 북소리와 함께 붉은 철릭의 군사들이 골목으로 쏟아져 들어온다. 앞선 장수가 환도 한 번에 왜병 조장을 베었다.'], ['kimsimin', '동래성의 군사들이다! 한 놈도 놓치지 마라!']]);
    }
    fame('bt', 'nongae');
    await play([
      ['N', '(흐트러진 머리를 걷어 올리며) …고맙습니다. 진주에서 온 논개라 합니다. 동래에 계신 어른께 안부를 전하러 왔다가 이 난리를 만났지요.'],
      ['N', '저 왜병들이 저를 「대장께 바칠 것」이라 했지요. 흥 — 그 대장이란 자가 제 앞에 오면, 그 목을 끌어안고 강물에 뛰어들 생각이었어요. 저 혼자 죽지는 않아요.'],
      ['P', '그 칼은 조금 더 아껴 두시오. 이 전쟁은 길 것 같소.'],
      ['N', '(처음으로 웃으며) 선장님은 이상한 분이네요. 배에 타라는 말을 그렇게 하시는 분은 처음 봐요.']
    ]);
    var j = await UI.ask('논개를 배에 태우겠는가?', [
      { label: '태운다 — 「함께 갑시다」', value: 'yes', icon: 'heart' },
      { label: '「몸을 피하시오」 — 다음에 (조선 땅의 술집에서 다시 만날 수 있다)', value: 'no' }], me());
    b.nongaeJoin = j === 'yes' ? 'yes' : 'no';
    if (b.nongaeJoin === 'yes') { join('h_nongae', 85); await play([['N', '좋아요. 대신 배에서는 저도 칼을 들 거예요. 선장님.']]); }
    else await play([['N', '그럼 저는 진주로 가 볼게요. 살아 있으면 — 어느 술집에서든 또 뵙겠지요.']]);
    log('동래 읍성에서 왜병에게 끌려가던 진주의 논개를 구했다.' + (b.nongaeJoin === 'yes' ? ' 논개가 배에 올랐다.' : ' 논개는 진주로 떠났다 (조선 땅의 술집에서 다시 만날 수 있다).'));
    await kimsimin();
  }
  async function kimsimin() {
    var b = st(), s = S();
    await withPic('imjin_kimsimin', '동래성의 김시민 (1592)', function () { return play([
      ['kimsimin', '김시민이오. 부름에 응해 주어 고맙소. 바다에서 싸우는 모습을 성루에서 보았소 — 왜선들이 그대를 조선 수군으로 알았으니, 이제 그대도 저들의 원수가 되었구려.'],
      ['kimsimin', '부산진은 어제 무너졌소. 정발 첨사는 검은 갑옷을 입고 끝까지 싸웠다 하오. 왜장 고니시가 송상현 부사께 「길을 빌려 달라」 써 보냈는데, 부사께서는 이렇게 답하셨소 — 「싸워 죽기는 쉬우나 길을 빌려주기는 어렵다(戰死易 假道難).」'],
      ['songsanghyeon', '(성루에서 내려다보며) 김 장군, 그 이방인을 북으로 보내시오. 나는 이 성을 떠나지 않을 것이오. 그러나 누군가는 저들의 수와 무기를 조정에 알려야 하오.'],
      ['kimsimin', '왜군은 이십만이 넘소. 그리고 그들의 무기 — 조총이오. 활보다 멀리 가고, 갑옷을 뚫소. 조정은 아직 그걸 모르오. 충주의 신립 장군과 한양의 조정에 이것을 알려 주시오.'],
      ['kimsimin', '부산포 어귀는 이미 왜선이 쇠사슬처럼 막았소. 그대의 배는 성 안 포구에 묶어 두고, 성문으로 나가 뭍길로 가시오. 북쪽에 소식이 닿기 전에는 이 포구에서 배가 나갈 수 없소.'],
      ['kimsimin', '(무거운 궤짝을 내밀며) 이것은 동래 관아의 비단 스무 필이오. 여비 삼아 들고 가되, 팔지는 마시오. 북쪽 전라도 순찰사 권율 장군이 군사를 모으고 있소 — 이 비단이면 화살 만 대와 군량 석 달 치가 되오. 장군께 꼭 전해 주시오.']
    ]); });
    give('imjin_silk'); b.silk = 1; b.north = 1;
    await play([['F', '제독, 배는 포구에 단단히 매어 두겠습니다. 성문으로 나가면 왜군이 길에 깔렸을 겁니다. 단단히 준비하십시오. 충주는 북서쪽, 한양은 그 너머입니다.']]);
    log('동래성의 김시민이 비단 궤짝을 맡기며 북쪽 신립과 조정에 왜군의 수와 조총을 알려 달라고 했다. 부산포가 막혀 성문으로 나가야 한다.');
    UI.toast('비단 궤짝 (팔 수 없다) — 동래 포구가 막혔다: 성문으로 나가 북쪽(충주 탄금대·한양)으로', 'scroll', 7000);
    refresh();
  }
  /** 동래 포구가 막혔는가 (js/city/harbor.js 출항) */
  IJ.portShut = function (c) { var b = S() && S().imjin; return !!(b && c && c.id === DONGNAE && b.north && !b.delivered); };
  IJ.portShutSay = function () { return UI.say('제독, 부산포 어귀는 왜선이 겹겹이 막았습니다. 북쪽에 소식을 전하기 전에는 배를 낼 수 없습니다 — 성문으로 나가 뭍길로 가셔야 합니다.', first()); };

  // ================================================================ 뭍 (js/scenes/land.js 하루가 끝날 때)
  function landDue(lon, lat) {
    var b = st(); if (!b) return null;
    if (b.north && !b.breakout && G.Geo.dist(lon, lat, city(DONGNAE).lon, city(DONGNAE).lat) < 0.7) return 'breakout';
    if (b.breakout && !b.tangeum && !b.seoul && dist(lon, lat, TANGEUM) < 0.5) return 'tangeum';
    if (b.seoul && !b.gwak && inKorea(lon, lat)) return 'gwak';
    if (b.gwak && !b.haengju && dist(lon, lat, HAENGJU) < 0.12) return 'haengju';
    return null;
  }
  IJ.landDue = landDue;
  var LAND = {};
  IJ.onLand = async function (lon, lat, ctx) {
    var kind = landDue(lon, lat); if (!kind || IJ._busy) return false;
    IJ._busy = true;
    try { if (ctx && ctx.stop) ctx.stop(); await LAND[kind](ctx || {}); } catch (e) { console.error(e); }
    IJ._busy = false; refresh(); return true;
  };
  function battleOf(ctx) { return ctx && ctx.battle ? ctx.battle : function (nm, n, o) { return G.Scenes.land.landBattle(nm, n, false, o); }; }

  // ④ 성문을 나서자마자
  LAND.breakout = async function (ctx) {
    var b = st();
    await withPic('imjin_breakout', '동래 성문 밖 (1592)', function () { return play([
      [null, '성문을 나서자마자 들판 저편에서 흰 깃발이 일어선다. 장대 끝에 십자가 문양을 단 고니시군의 조총대다. 백 걸음 앞에서 화승 타는 냄새가 난다.'],
      ['F', '제독, 길이 막혔습니다! 저 줄을 뚫지 못하면 북쪽으로 못 갑니다!']
    ]); });
    var res = await battleOf(ctx)('고니시군의 조총대', foe('breakout'), { kind: 'garrison', guns: true, leader: '고니시의 부장', noSpecial: true });
    b.breakout = res === 'win' ? 'win' : 'lose';
    fame('bt', 'breakout');
    await play([[null, res === 'win' ? '조총대의 줄이 흩어졌다. 탐험대는 연기 속을 빠져나와 북쪽 고갯길로 들어섰다.' : '피투성이가 되어 간신히 줄 사이를 빠져나왔다. 뒤에서 조총 소리가 오래 따라왔다. 그래도 길은 북쪽으로 열려 있다.']]);
    log('동래 성문 밖에서 고니시군의 조총대를 뚫고 북쪽으로 나섰다.');
    UI.toast('북쪽으로 — 충주 탄금대의 신립에게 (북서쪽)', 'map', 5000);
  };

  // ⑤ 탄금대
  LAND.tangeum = async function (ctx) {
    var b = st();
    await withPic('imjin_tangeum', '충주 탄금대 (1592)', function () { return play([
      [null, '충주. 남한강과 달천이 만나는 탄금대 아래 너른 들에 기마병 팔천이 진을 쳤다. 깃발이 바람에 펄럭인다. 등 뒤가 강이다.'],
      ['sinrip', '동래에서 왔다고? 김시민이 보냈다니 들어 보지. 왜군의 수가 얼마고 무엇을 들었다고?'],
      ['P', '이십만이 넘소. 그리고 조총 — 활보다 멀리 가고 갑옷을 뚫는 총을 수천 자루 가졌소. 동래 성문 밖에서 그 총에 내 사람들이 쓰러졌소.'],
      ['sinrip', '(코웃음을 치며) 조총? 그 쇠막대기 말인가. 쏠 때마다 맞는다던가? 한 번 쏘고 나면 화약을 다시 재느라 한참이라더군. 그 사이에 내 기마대가 짓밟아 버리면 그만이오.']
    ]); });
    var v = await UI.ask('신립이 조총을 우습게 본다', [
      { label: '「새재(조령)의 좁은 길에서 막으시오」 — 고갯길을 권한다', value: 'pass', icon: 'map' },
      { label: '「조총은 줄을 지어 번갈아 쏘오」 — 겪은 것을 알린다', value: 'warn', icon: 'cannon' },
      { label: '말없이 장군의 뜻을 따른다', value: 'follow' }], me());
    b.advice = v;
    await play(v === 'pass'
      ? [['sinrip', '새재? 그 좁은 고개에서는 말을 달릴 수 없소. 내 군사는 기마병이오. 넓은 들이라야 기마가 산다. …그리고 등 뒤에 강을 두면 군사들이 도망치지 못하지. 배수진(背水陣)이오.']]
      : v === 'warn'
        ? [['sinrip', '번갈아 쏜다…? (잠시 말이 없다가) 흥, 그래도 말은 총알보다 빠르오. 기마대면 충분하오. 이방인은 바다 싸움이나 걱정하시오.']]
        : [['sinrip', '좋소. 바다의 사람치고는 말귀가 밝군. 내 기마대가 어떻게 싸우는지 구경이나 하시오.']]);
    b.delivered = 1;   // 북쪽에 소식이 닿았다 — 동래 포구가 풀린다
    await play([[null, '이튿날 아침, 안개 속에서 왜군의 흰 깃발이 들을 메웠다. 기마대가 달려 나가자 — 조총 소리가 콩 볶듯 터지고, 앞줄의 말들이 한꺼번에 쓰러진다. 논에 빠진 말발굽이 허우적거린다.']]);
    var res = await battleOf(ctx)('고니시 유키나가의 본대', foe('tangeum'), { kind: 'garrison', guns: true, leader: '고니시 유키나가', noSpecial: true, hold: 3 });
    b.tangeum = res === 'win' ? 'win' : 'lose';
    fame('bt', 'tangeum');
    await withPic('imjin_sinrip', '신립의 마지막 돌격 (1592)', function () { return play(res === 'win'
      ? [[null, '제독의 일행이 왜군의 왼쪽 날개를 무너뜨렸다. 그러나 들 한가운데에서 기마대가 무너지고 있다. 흰 깃발이 사방에서 좁혀 온다.'],
        ['sinrip', '(피 묻은 얼굴로 말을 몰고 와) 이방인! 이 싸움은 졌소. 그대가 옳았소 — 저 쇠막대기는 말보다 빨랐소. 저 언덕 뒤로 빠지시오. 길은 내가 열겠소!'],
        [null, '신립이 남은 기병 백여 기를 이끌고 왜군의 한가운데로 다시 뛰어든다. 그 틈으로 탐험대가 언덕을 넘었다. 뒤돌아보았을 때, 장수의 붉은 깃발은 달천 강가로 사라지고 있었다.']]
      : [[null, '조총의 연기 속에서 탐험대가 에워싸였다. 칼을 든 왜병들이 좁혀 온다 — 그때 말발굽 소리와 함께 붉은 깃발이 들이닥친다.'],
        ['sinrip', '(제독을 말 위로 끌어올리며) 이방인을 죽게 둘 수는 없지! 그대 말이 옳았소. 조총은… 말보다 빨랐소. 저 언덕까지만 데려다주겠소. 그 다음은 그대 몫이오!'],
        [null, '언덕 너머에 제독을 내려놓은 신립은 말머리를 돌려 다시 연기 속으로 달려갔다. 그것이 마지막이었다. 그날 저녁, 그가 달천 강물에 몸을 던졌다는 소문이 들려왔다.']]); });
    log('충주 탄금대에서 신립에게 왜군의 수와 조총을 알렸다. 신립의 기마대는 무너졌고, 신립은 제독 일행을 빼내고 강으로 돌아섰다. 동래 포구가 풀렸다.');
    UI.toast('북쪽에 소식이 닿았다 — 동래 포구가 풀렸다 · 한양으로 (북서쪽)', 'castle', 6000);
  };

  // ================================================================ ⑥ 한양 — 파천
  function seoulOpen() { var b = st(); return !!(b && b.breakout && !b.seoul && atCity(HANYANG)); }
  async function seoul() {
    var b = st(), s = S(), k = K();
    if (!b.tangeum) { b.tangeum = 'skip'; b.delivered = 1; }
    await withPic('imjin_flight', '경복궁을 떠나는 임금 (1592)', function () { return play([
      [null, '비 내리는 새벽. 경복궁 돈의문 쪽으로 횃불도 없이 가마 하나가 빠져나간다. 신하들은 진흙에 발이 빠지고, 궁녀들은 맨발이다.'],
      ['seonjo', '(가마 휘장을 들추고) …그대가 동래에서 온 이방인인가. ' + (b.tangeum === 'skip' ? '신립이 탄금대에서 무너졌다는 소식이 먼저 왔다. 그대의 말이 사실이라면 — 왜적이 이십만이라니.' : '신립에게 소식을 전했다고 들었다. 그런데도 신립이 무너졌단 말인가.') + ' …과인은 북으로 간다. 명나라에 원병을 청할 것이다.'],
      [CROWD, '(빗속에서 돌을 던지며) 임금이 백성을 버리고 가는구나! 누구를 믿고 살란 말이오!'],
      [null, '가마가 떠나자 성난 사람들이 궁궐로 몰려간다. 노비 문서를 둔 장례원에 먼저 불이 붙고, 이윽고 경복궁의 기와지붕 위로 불길이 솟는다.'],
      [CROWD, '(무너진 담 아래 주저앉은 노인) 다 끝났소… 왜놈이 오면 다 죽는 거요. 나라가 없는데 무엇을 지키오.']
    ]); });
    await play([
      [YOUTH, '(삿갓 아래 젖은 얼굴의 젊은이들이 둘러선다) 할아버지, 그래도 나라는 지켜야 합니다! 임금이 가셨어도 이 땅은 우리 땅입니다. 고을마다 의병이 일어선다 했습니다. 우리도 남쪽으로 내려가 싸우겠습니다!'],
      ['gwanghae', '(흙 묻은 도포 차림의 젊은 세자가 사람들 앞에 선다) …나는 세자 광해다.'],
      [CROWD, '세자라고? 아비를 따라 도망가지 않고 무얼 하오! 우리 아들은 탄금대에서 죽었소!'],
      ['gwanghae', '(던져진 진흙을 닦지도 않고) 원망은 내가 다 듣겠다. 아바마마는 북으로 가시지만, 나는 조정을 나누어 이 땅에 남는다. 그대들의 아들이 죽은 땅에서 나도 죽을 것이다.']
    ]);
    var v = await UI.ask('광해군이 성난 백성 앞에 섰다', [
      { label: '세자 곁에 서서 사람들을 달랜다', value: 'guard', icon: 'people' },
      { label: '백성의 원망을 끝까지 듣게 둔다', value: 'listen' }], me());
    b.gwanghae = v;
    await play(v === 'guard'
      ? [['gwanghae', '(조용히) 고맙소, 이방인. 그러나 막지 마시오. 저 원망이 내가 짊어질 짐이오. 짐을 지지 않는 임금은 임금이 아니오.']]
      : [[null, '세자는 돌과 욕설을 다 맞고 나서야 고개를 숙였다. 사람들은 하나둘 돌을 내려놓았다. 누군가 흐느꼈다.'], ['gwanghae', '…들어 주어 고맙소. 이 원망을 잊지 않겠소.']]);
    await play([
      [null, '불타는 궁궐 담 밑에서 한 늙은 의원이 다친 사람들을 눕혀 놓고 상처를 싸매고 있다. 약 상자는 비가 들이쳐 젖었다.'],
      ['HJ', '허준이오. 어의라 임금을 따라가야 하나… 이 사람들을 두고 갈 수가 없구려. 선장, 배에 약이 있으면 조금만 나누어 주시오. 백성이 살아야 나라가 사는 법이오.']
    ]);
    var m = await UI.ask('허준이 약을 청한다', [
      { label: '탐험대의 약초와 붕대를 모두 내준다 (금화 300닢어치)', value: 'give', icon: 'drop' },
      { label: '「우리도 갈 길이 멀다」', value: 'no' }], me());
    b.heojun = m;
    if (m === 'give') {
      s.player.gold = Math.max(0, s.player.gold - 300);
      var so = G.Fame.add('so', 60);
      if (G.Growth && G.Growth.once) G.Growth.once('imjin_heojun', 'int', 1, '허준 곁에서 약초 쓰는 법을 보았다');
      await play([['HJ', '(젖은 약 상자에 약초를 채우며) 이것으로 열은 더 살리겠소. …언젠가 이 전쟁이 끝나면, 이 땅의 약초와 처방을 한 권으로 묶을 것이오. 그대 같은 사람이 다치면 누구라도 펼쳐 볼 수 있게.']]);
      log('불타는 한양에서 허준에게 약초를 나누었다. (사교 명성 +' + so + ')');
    } else await play([['HJ', '그렇겠지. 몸조심하시오. …살아남는 것도 싸움이오.']]);
    // 갓장수 — 첫 번째 기회
    await gatOffer('seoul');
    var sf = fame('ex', 'seoul');
    b.seoul = 1;
    log('한양에서 임금의 파천과 불타는 경복궁을 보았다. 세자 광해군은 남아 백성의 원망을 들었다. (탐험 명성 +' + sf + ')');
    await play([['F', '제독, 한양도 곧 왜군 손에 떨어질 겁니다. 성문을 나서서 남쪽으로 내려가는 피란민 길을 따라가 보시지요. 의병들이 일어선다는 말이 있습니다.']]);
    refresh();
  }
  async function gatOffer(where) {
    var b = st(), s = S(), price = K().gatPrice || 300;
    if (has('imjin_gat')) return true;
    await play(where === 'seoul'
      ? [[PEDDLER, '(비에 젖은 갓을 품에 안고) 나리, 갓 하나 사 가시오. 피란길에 짐이 되어 내놓는 마지막 물건이오. 조선 땅에서는 갓을 써야 선비들이 사람 대접을 하오. 이방인이라도 말이오.']]
      : [[PEDDLER, '(진영 한구석에서) 거기 바다의 나리! 갓이 없으시구려. 의병 대장들을 만나려면 갓은 써야 하오. 하나 남았소.']]);
    var v = await UI.ask('갓장수가 갓을 내민다', [
      { label: '갓을 산다 (금화 ' + U.num(price) + '닢)', value: 'buy', icon: 'coin', dis: s.player.gold < price },
      { label: '사지 않는다', value: 'no' }], me());
    if (v !== 'buy' || s.player.gold < price) { b['gatNo_' + where] = 1; return false; }
    s.player.gold -= price; give('imjin_gat'); b.gat = where;
    UI.toast('갓 (흑립)을 샀다 — 금화 −' + U.num(price), 'coin', 4200);
    await play([[PEDDLER, '(갓끈을 매어 주며) 허, 제법 어울리시오. 이제 어딜 가도 「예를 아는 분」 소리를 들으실 거요.']]);
    return true;
  }

  // ⑦ 한양을 나선 길 — 곽재우 · 김덕령
  LAND.gwak = async function (ctx) {
    var b = st();
    await withPic('imjin_gwak', '붉은 옷의 의병장 (1592)', function () { return play([
      [null, '한양을 나선 길. 남쪽으로 내려가는 피란민의 행렬을 왜병 노략질패가 덮쳤다. 아이를 업은 아낙이 길에 쓰러진다.'],
      [null, '그때 — 언덕 위에서 붉은 옷을 입은 장수 하나가 말을 달려 내려온다. 그 뒤로 농기구와 활을 든 사내들이 함성을 지르며 따른다.'],
      ['GJ', '하늘에서 내려온 홍의장군(紅衣將軍)이 여기 있다! 사람들을 해치는 놈들은 한 놈도 살려 두지 마라! …거기 이방인들! 칼을 들었으면 같이 싸우시오!']
    ]); });
    var res = await battleOf(ctx)('피란민을 덮친 왜병 노략질패', foe('refugee'), { kind: 'garrison', guns: true, leader: '노략질패 대장', noSpecial: true });
    b.gwakFight = res;
    fame('bt', 'gwak');
    await play([
      [null, res === 'win' ? '노략질패가 흩어졌다. 피란민들이 붉은 옷의 장수 앞에 엎드려 운다.' : '탐험대가 밀리는 사이, 붉은 옷의 장수가 왜병 대장을 베었다. 노략질패가 흩어졌다.'],
      ['GJ', '의령의 곽재우요. 집안 재산을 털어 사람을 모았지. 관군은 다 도망가고 백성만 남았으니, 백성이 싸울 수밖에.'],
      ['KD', '(커다란 철퇴 둘을 등에 메고 상복을 입은 젊은 장수가 말에서 내린다) 곽 장군! 전라도 광주의 김덕령이오. 형님을 이 전쟁에서 잃고 상복을 입은 채 일어섰소. 같이 남쪽으로 내려갑시다.'],
      ['GJ', '좋소! …이방인, 그대도 한동안 같은 길이오? 그럼 함께 가세. 길 위에서 들은 소식이 하나 있는데 — 남쪽 바다에 이순신이라는 장수가 있다더군.'],
      ['KD', '전라좌수사 이순신. 옥포에서 왜선을 수십 척 깨뜨렸다는 소식이오. 관군은 다 도망가는데 바다에서만은 이기고 있다고. 왜군은 바닷길로 군량을 나르는데, 그 길을 이순신이 끊고 있소.'],
      ['GJ', '뭍에서는 우리가, 바다에서는 이순신이. 그러면 이 전쟁, 아직 끝나지 않았소.']
    ]);
    if (has('imjin_gat')) await askGwak('road');
    else {
      b.gwakJoin = 'later';
      await play([
        ['KD', '(제독의 맨머리를 힐끗 보고 웃으며) 그런데 이방인 선장, 갓도 안 쓰셨구려. 조선 선비가 갓 없는 사람 밑에 들어갈 수는 없지. 하하!'],
        ['GJ', '행주 쪽으로 가는 길이면 함께 가세. 권율 장군 진영에는 장사치들도 모인다더군. 거기서 갓이라도 하나 구해 쓰시오.']
      ]);
    }
    b.gwak = 1;
    log('한양을 나선 길에서 붉은 옷의 의병장 곽재우와 상복을 입은 김덕령을 만나 피란민을 구했다. 남쪽 바다의 이순신 소식을 들었다.');
    UI.toast('행주산성으로 — 한양에서 서쪽 한강 가 덕양산 (권율에게 비단을)', 'map', 6000);
  };
  async function askGwak(where) {
    var b = st();
    var v = await UI.ask('곽재우와 김덕령을 부하로 맞이하겠는가?', [
      { label: '맞이한다 — 「뭍과 바다에서 함께 싸웁시다」', value: 'yes', icon: 'people' },
      { label: '「그대들은 이 땅에 필요하오」 — 보낸다', value: 'no' }], me());
    if (v === 'yes') {
      await play([
        ['GJ', where === 'road' ? '갓을 쓴 걸 보니 예를 아는 분이구려. 좋소! 홍의장군의 칼을 그대에게 맡기겠소.' : '그 갓 하나로 사람이 달라 보이는구려. 좋소, 함께 갑시다!'],
        ['KD', '형님의 원수를 갚을 수 있다면 바다든 뭍이든 상관없소. 이 철퇴가 그대의 배를 지키겠소.']
      ]);
      join('h_gwakjaeu', 88); join('h_kimdeokryeong', 88);
      b.gwakJoin = 'yes';
      log('곽재우와 김덕령이 부하가 되었다.');
    } else {
      b.gwakJoin = 'no';
      await play([['GJ', '하하, 그렇게 말해 주니 고맙소. 남쪽의 백성들이 우리를 기다리오. 살아서 또 만납시다!']]);
    }
  }

  // ⑧ 행주산성 — 권율에게 비단을
  LAND.haengju = async function (ctx) {
    var b = st();
    await withPic('imjin_haengju', '행주산성의 권율 (1592)', function () { return play([
      [null, '한강 가의 덕양산. 낮은 산 위에 목책과 흙담을 두른 산성이 섰다. 군사들은 돌을 나르고, 아낙들이 치마폭에 돌을 담아 성벽 위로 올린다.'],
      ['gwonyul', '권율이오. 동래의 김시민이 보낸 사람이라고? …김 장군은 무사하오?'],
      ['P', '내가 떠날 때는 성 안에 있었소. 장군께 맡긴 것이 있다며 이것을 들려 보냈소.']
    ]); });
    if (has('imjin_silk')) {
      R.removeItem('imjin_silk'); b.silk = 'given';
      await play([
        [null, '궤짝 뚜껑을 열자 빛깔 고운 비단 스무 필이 나온다. 동래에서 이곳까지, 비와 진흙과 조총 연기 속에서도 한 필도 젖지 않았다.'],
        ['gwonyul', '(비단을 쓰다듬으며 한참 말이 없다가) …이것을 팔지 않고 여기까지 들고 왔구려. 여비가 모자랐을 텐데.'],
        ['gwonyul', '강화의 장사치들에게 이 비단을 보내면 화살 만 대와 쌀 수백 석이 되오. 이 산성에서 왜군을 막을 수 있소. 내 장계에 그대의 이름을 올리겠소 — 조정이 의주에 있어도 그 이름은 닿을 것이오.']
      ]);
      var tt = await titleUp('전라도 순찰사 권율의 장계로', '동래의 비단을 행주산성까지 지켜 전한 공으로.');
      b.title1 = tt || 'none';
      var hf = fame('so', 'haengju');
      log('행주산성의 권율에게 김시민의 비단 궤짝을 전했다. (사교 명성 +' + hf + ')');
    } else {
      b.silk = 'lost';
      await play([['gwonyul', '…궤짝이 없다고? 길에서 잃었구려. 괜찮소. 이 난리에 몸이라도 성히 왔으니 그것으로 되었소. 화살은 어떻게든 구해 보겠소.']]);
      log('행주산성의 권율을 만났지만 김시민의 비단은 전하지 못했다.');
    }
    await play([['gwonyul', '(성벽 위 아낙들을 가리키며) 저 사람들 좀 보시오. 싸움터에 나올 사람들이 아니지. 그래도 치마를 짧게 잘라 매고 돌을 나르오. 이 산성은 저 치마폭이 지킬 것이오.']]);
    // 곽재우·김덕령 — 갓이 없었으면 진영의 갓장수 (두 번째 기회)
    if (b.gwakJoin === 'later') {
      var got = await gatOffer('haengju');
      if (got) await askGwak('haengju');
      else {
        b.gwakJoin = 'no';
        await play([['GJ', '여기서 헤어집시다, 이방인. 우리는 남쪽 의령과 광주로 가오. 갓 쓴 그대를 보았으면 좋았을 텐데! 하하.'], ['KD', '바다에서 이순신을 만나거든, 뭍에도 싸우는 사람이 있다고 전해 주시오.']]);
      }
    }
    b.haengju = 1;
    await play([['F', '제독, 이제 동래로 돌아가 배를 찾읍시다. 바다에서도 싸움이 벌어지고 있다지 않습니까.']]);
    UI.toast('부산(동래)으로 — 배가 기다린다', 'anchor', 5000);
  };

  // ================================================================ ⑨ 원균 → 옥포
  function wongyunOpen() { var b = st(); return !!(b && b.haengju && !b.wongyun && (atCity(DONGNAE) || atCity(HANSAN))); }
  async function wongyun() {
    var b = st();
    if (row('h_yisunsin')) {   // 전쟁 전에 이미 부하로 데리고 있었다 — 제 자리로 돌아간다 (노량 뒤에 돌아온다)
      await play([['YS', '제독, 나라가 부르오. 나는 전라좌수영으로 돌아가 판옥선을 이끌어야 하오. …바다에서 다시 만납시다. 그때는 그대가 내 함대의 날개가 되어 주시오.']]);
      leaveMate('h_yisunsin'); b.yiAboard = 1;
      UI.toast('이순신이 전라좌수영으로 돌아갔다', 'boot', 4800);
    }
    await withPic('imjin_wongyun', '경상우수사 원균 (1592)', function () { return play([
      [null, '포구 바깥 섬 그늘. 판옥선 몇 척이 돛을 내리고 숨어 있다. 대장선 선실에서는 술 냄새가 풍긴다.'],
      ['wongyun', '(술잔을 든 채) 오, 동래에서 살아 나왔다는 그 이방인인가! 경상우수사 원균일세. 앉게, 앉아.'],
      ['wongyun', '왜선이 칠백 척이었네, 칠백! 그걸 무슨 수로 막나? 그래서 내 배들은… 왜놈들 손에 넘어가지 않게 내가 손수 가라앉혔지. 백여 척을. 하하, 현명하지 않은가?'],
      ['F', '(작게) 제독… 싸워 보지도 않고 제 수군을 바다에 묻었다는 겁니다.'],
      ['wongyun', '전라좌수사 이순신에게 도와 달라 사람을 보냈네. 그자가 오면 내가 앞장서고 그자가 뒤를 받치면 되지. 공은 내가 세우고! 자네도 내 밑에 들어오게. 술은 넉넉하네.']
    ]); });
    var v = await UI.ask('원균이 술잔을 내민다', [
      { label: '「나는 이순신에게 가겠소」 — 잔을 내려놓는다', value: 'leave', icon: 'boot' },
      { label: '「일단 함께 나가 봅시다」 — 원균을 따라나선다', value: 'follow' }], me());
    b.wongyun = v;
    if (v === 'follow') await play([
      [null, '이튿날 원균의 배를 따라 나섰다. 수평선에 왜선 돛 몇 개가 보이자 — 원균의 대장선이 먼저 뱃머리를 돌린다.'],
      ['wongyun', '(멀리서 외친다) 바, 바람이 좋지 않네! 오늘은 물러나세! 이순신이 오면 다시 나오지!'],
      ['F', '…제독, 저 사람을 믿고는 바다에 못 나갑니다.']
    ]);
    else await play([['wongyun', '(얼굴이 붉어지며) 흥, 이순신이 무슨 대수라고! 가게, 가! 그자가 이기면 그 공의 절반은 내 것이네!']]);
    await play([
      [null, '그날 저녁, 수평선 저편에서 판옥선 스물네 척이 노를 맞추어 다가온다. 대장선 돛대에 「全羅左水使」의 깃발이 오른다.'],
      ['YS', '전라좌수사 이순신이오. 그대가 동래에서 북쪽으로 소식을 들고 갔다는 이방인 선장이오? 곽재우·김덕령이 보낸 말이 바닷길로도 왔소. …뭍에도 싸우는 사람이 있다니, 힘이 나는구려.']
    ]);
    log('경상우수사 원균을 만났다 — 제 손으로 수군을 가라앉히고 술잔을 든 장수였다. 원균을 떠나 전라좌수사 이순신에게 갔다.');
    var went = await sea(okpoSpec());
    if (!went) log('옥포 해전에 나서지 않았다. 동래나 한산도에서 다시 이순신을 만날 수 있다.');
  }
  function okpoOpen() { var b = st(); return !!(b && b.wongyun && !b.okpo && (atCity(DONGNAE) || atCity(HANSAN))); }
  async function okpoAgain() {
    await play([['YS', '다시 왔구려. 옥포의 왜선들은 아직 거기 있소. 오늘은 함께 가겠소?']]);
    await sea(okpoSpec());
  }

  // ================================================================ ⑩ 한산도 대첩
  function hansanOpen() { var b = st(); return !!(b && b.okpo && !b.hansan && atCity(HANSAN)); }
  async function hansan() {
    var b = st();
    await withPic('imjin_hansan_council', '한산도의 군략 회의 (1592)', function () { return play([
      [null, '한산도. 이순신의 대장선 선실에 등잔이 켜졌다. 탁자 위에 그린 바다 그림에 견내량의 좁은 물길이 그어져 있다.'],
      ['YS', b.okpo === 'won' ? '옥포에서 그대의 배가 앞장섰다는 보고를 들었소. 고맙소.' : '옥포에서는 우리끼리 싸웠소. 그대가 다시 와 주어 다행이오.'],
      ['YS', '와키자카 야스하루가 왜선 일흔세 척을 이끌고 견내량에 들어왔소. 우리 판옥선을 우습게 본다지. 그 자만심을 이용할 것이오.']
    ]); });
    var went = await sea(hansanSpec());
    if (!went) log('한산도 대첩에 나서지 않았다. 한산도에서 다시 이순신을 만날 수 있다.');
  }
  function hansanAfterOpen() { var b = st(); return !!(b && b.hansan && !b.hansanSaid && atCity(HANSAN)); }
  async function hansanAfter() {
    var b = st(); b.hansanSaid = 1;
    await play(b.hansan === 'won'
      ? [['YS', '(갑판에서 바다를 바라보며) 한산도의 바다가 이렇게 조용한 건 처음이오. 왜군의 바닷길이 끊겼으니 평양의 고니시도 더는 북으로 못 갈 것이오. 그대 덕이오.'],
        ['YS', '그러나 이 전쟁은 길 것이오. 조정에는 나를 미워하는 사람도 많소. …몇 해 뒤 바다가 다시 끓거든, 한산도나 동래로 와 주시오. 그대를 부르겠소.']]
      : [['YS', '한산도에서는 우리가 이겼소. 다음에는 그대와 함께 이기고 싶소. …몇 해 뒤 바다가 다시 끓거든, 한산도나 동래로 와 주시오.']]);
    log('한산도에서 이순신이 말했다 — 「몇 해 뒤 바다가 다시 끓거든 한산도나 동래로 와 주시오.」');
    UI.toast('정유년(1597년 가을) 이후 한산도·동래에서 다시 이순신의 바다로', 'ship', 6000);
  }

  // ================================================================ ⑪ 칠천량
  function chilOpen() { var b = st(), t = today(); return !!(b && b.hansan && !b.chil && t >= D.chil && t < D.noryang && (atCity(DONGNAE) || atCity(HANSAN))); }
  async function chil() {
    var b = st();
    await withPic('imjin_chil', '칠천량의 밤 (1597)', function () { return play([
      [null, '정유년. 다시 왜군이 바다를 건너왔다. 그러나 한산도의 통제영에 이순신은 없다. 조정의 명을 어겼다는 죄로 한양으로 끌려가 매를 맞고, 이제는 계급장 없이 권율의 진영을 따라다닌다고 한다.'],
      [null, '삼도수군통제사의 깃발 아래에는 원균이 앉아 있다.']
    ]); });
    var went = await sea(chilSpec());
    if (!went) log('칠천량 해전에 나서지 않았다.');
  }
  function chilAfterOpen() { var b = st(); return !!(b && b.chil && !b.chilSaid && atCity(HANSAN)); }
  async function chilAfter() {
    var b = st(); b.chilSaid = 1;
    await play(b.chil === 'won'
      ? [[null, '칠천량의 바다가 불탔다. 판옥선과 거북선이 하나둘 불길에 삼켜지고, 원균은 뭍으로 올랐다가 끝내 돌아오지 못했다.'],
        [null, '그 불길 사이로 제독의 배가 길을 열었다. 뒤를 따라 판옥선 열두 척이 빠져나왔다 — 조선 수군에 남은 배의 전부였다.'],
        [{ name: '배설', lang: 3 }, '(떨리는 목소리로) 이 열두 척을… 백의종군하는 이순신 공께 가져가겠소. 그분이라면 이것으로도 싸울 것이오.']]
      : [[null, '칠천량의 바다가 불탔다. 판옥선과 거북선이 하나둘 불길에 삼켜지고, 원균은 뭍으로 올랐다가 끝내 돌아오지 못했다. 조선 수군이 무너졌다.']]);
    log(b.chil === 'won' ? '칠천량에서 조선 수군이 무너졌다. 불길 속에서 판옥선 열두 척을 건져 냈다.' : '칠천량에서 조선 수군이 무너졌다.');
    UI.toast('무술년(1598년 겨울) 이후 한산도·동래에서 — 마지막 바다', 'ship', 6000);
  }

  // ================================================================ ⑫ 노량 — 「나의 죽음을 알리지 마라」
  function noryangOpen() { var b = st(); return !!(b && b.hansan && !b.noryang && today() >= D.noryang && (atCity(DONGNAE) || atCity(HANSAN))); }
  async function noryang() {
    var b = st();
    await withPic('imjin_noryang', '노량의 밤 (1598)', function () { return play([
      [null, '무술년 겨울. 도요토미 히데요시가 죽었다. 순천 왜성에 갇힌 고니시를 구하러 시마즈의 배 오백 척이 노량 물목으로 몰려온다.'],
      [null, b.chil === 'won' ? '이순신의 대장선 뒤에 판옥선들이 늘어섰다. 칠천량에서 건진 열두 척이 명량에서 살아남아, 이제 다시 수십 척이 되었다.' : '이순신의 대장선 뒤에 판옥선들이 늘어섰다. 명량의 열세 척이 다시 수십 척이 되었다.'],
      ['chenlin', '(명나라 대선에서 건너와) 이 공, 이 바다의 이방인이 그대가 말한 사람이오? 좋소, 오늘 밤은 명의 배도 함께 싸우겠소.']
    ]); });
    var went = await sea(noryangSpec());
    if (!went) log('노량 해전에 나서지 않았다.');
  }
  function shotOpen() { var b = st(); return !!(b && b.noryang && !b.yi && atCity(HANSAN)); }
  /** 의술이 있는 사람 — 제독 또는 부하 (단계가 가장 높은 사람) */
  function healer() {
    var s = S(), best = { lv: s.player.sk && s.player.sk.med || 0, who: null };
    (s.mates || []).forEach(function (m) { var lv = R.mateSkill ? R.mateSkill(m, 'med') || 0 : 0; if (lv > best.lv) best = { lv: lv, who: m.id }; });
    return best;
  }
  IJ.healer = healer;
  async function shot() {
    var b = st(), s = S(), h = healer();
    await withPic('imjin_yisunsin', '노량의 새벽 (1598)', function () { return play([
      [null, '새벽. 관음포로 달아나는 왜선을 쫓아 이순신의 대장선이 북을 울린다. 이순신이 손수 북채를 잡았다.'],
      [null, '그때 — 어둠 속 왜선에서 날아온 총알 하나가 그의 왼쪽 가슴을 꿰뚫었다. 이순신이 북 앞에 쓰러진다.'],
      [{ name: '이순신의 조카 이완', lang: 3 }, '숙부님! 숙부님!']
    ]); });
    await UI.ask('이순신이 쓰러졌다', [{ label: '배를 붙여 이순신의 대장선으로 건너간다', value: 'go', icon: 'heart' }], me());
    if (h.lv >= 1) {
      var hs = h.who ? mateSp(h.who) : me(), hn = h.who ? G.MATE[h.who].name : '제독';
      await play([
        [hs, h.who ? '비키시오! (상처를 누르며) 총알이 뼈에 걸려 심장까지는 가지 않았소. 피만 멎으면 살 수 있소 — 천과 뜨거운 물을!' : '(제독이 직접 상처를 누른다) 총알이 갈비뼈에 걸렸다. 심장까지는 가지 않았다. 피만 멎으면 산다 — 천과 뜨거운 물을!'],
        [null, hn + U.jx(hn, '이/가') + ' 피를 멎게 하는 사이, 이순신이 눈을 떴다. 북소리는 그치지 않았다. 바다는 아직 싸우고 있다.'],
        ['YS', '(가쁜 숨으로) …싸움은 어떻게 되었느냐.'],
        [{ name: '이완', lang: 3 }, '이기고 있습니다! 왜선들이 달아납니다!'],
        ['YS', '그렇다면… 전쟁은 이제 끝났다. (제독의 손을 잡으며) 완아, 들어라. 나의 죽음을 알리지 마라. 이 갑옷을 입고 네가 북을 쳐라. 이순신은 오늘 노량에서 죽었다 — 그렇게 하라.'],
        ['YS', '(제독에게) 조정은 전쟁이 끝나면 장수를 두려워하오. 칼을 쥔 사람은 살아서 돌아갈 곳이 없소. …나를 그대의 배에 태워 주시오. 이름 없는 늙은 뱃사람으로. 바다에서는 그래도 쓸모가 있을 것이오.']
      ]);
      b.yi = 'saved';
      var y = G.MATE.h_yisunsin; if (y && y.y && y.y[1] < 1625) y.y = [y.y[0], 1625];
      join('h_yisunsin', 95);
      var so = G.Fame.add('so', 200);
      log('노량의 새벽, 총에 맞은 이순신을 ' + hn + U.jx(hn, '이/가') + ' 살려 냈다. 「나의 죽음을 알리지 마라」 — 이순신은 세상에서 사라져 제독의 배에 올랐다. (사교 명성 +' + so + ')');
      UI.toast('이순신 — 「나의 죽음을 알리지 마라」 · 제독의 배에 올랐다', 'heart', 7000);
    } else {
      await play([
        [null, '배에 의술을 아는 사람이 없다. 상처를 누르는 손 사이로 피가 멈추지 않는다.'],
        ['YS', '(희미하게) 싸움이 급하다… 나의 죽음을 알리지 마라. (제독을 바라보며) 그대도… 바다에서… 고마웠소.'],
        [null, '이순신은 그렇게 눈을 감았다. 조카 이완이 숙부의 갑옷을 입고 북을 쳤다. 싸움이 끝날 때까지 아무도 장수가 죽은 줄 몰랐다.']
      ]);
      b.yi = 'died';
      log('노량의 새벽, 이순신이 총에 맞아 숨을 거두었다. 「싸움이 급하다. 나의 죽음을 알리지 마라.」');
      UI.toast('이순신 — 노량에서 지다', 'skull', 6000);
    }
    var tt = await titleUp('선무공신 교서로', '임진년부터 무술년까지 조선의 바다와 뭍에서 함께 싸운 공으로.');
    b.title2 = tt || 'none';
    if (G.Audio) G.Audio.sfx('cheer');
    refresh();
  }

  // ================================================================ 도시에 들어설 때 (js/scenes/city.js)
  var STEPS = [[nongaeOpen, nongae], [seoulOpen, seoul], [wongyunOpen, wongyun], [okpoOpen, okpoAgain], [hansanAfterOpen, hansanAfter], [hansanOpen, hansan],
    [chilAfterOpen, chilAfter], [chilOpen, chil], [shotOpen, shot], [noryangOpen, noryang], [callOpen, call]];
  IJ.pending = function () { if (!S()) return false; return STEPS.some(function (x) { return x[0](); }); };
  IJ.check = async function () {
    if (IJ._busy) return false; IJ._busy = true;
    try { for (var i = 0; i < STEPS.length; i++) if (STEPS[i][0]()) { await STEPS[i][1](); break; } } catch (e) { console.error(e); }
    IJ._busy = false; refresh();
    return true;
  };
  IJ._t = { call: call, busan: busan, nongae: nongae, kimsimin: kimsimin, seoul: seoul, wongyun: wongyun, hansan: hansan, hansanAfter: hansanAfter, chil: chil, chilAfter: chilAfter, noryang: noryang, shot: shot, LAND: LAND, gatOffer: gatOffer };
})(window.G = window.G || {});
