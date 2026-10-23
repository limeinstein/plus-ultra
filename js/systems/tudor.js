/* 튜더 왕실의 일 (G.Tudor) — 헨리 8세의 이혼 · 런던 탑의 엘리자베스 공주 · 잉글랜드 기사 · 무적함대. 2026-10-17
   ■ 헨리 8세의 이혼 (1527~1533): 잉글랜드 국왕(헨리 8세)과 친분(만난 적이 있고 신뢰 40 이상)이 있으면, 런던 왕궁에서 왕이
     아라곤의 카탈리나 왕비와의 혼인을 무르려고 교황청에 특사를 보내니 바래다 달라고 청한다 → 특사를 태우고 로마 교황궁에서
     알현하면 교황은 끝내 거절한다 → 런던으로 돌아가 아뢰면 헨리 8세가 이혼을 선언하고 로마와 갈라선다:
     잉글랜드·교황청, 잉글랜드·에스파냐의 관계가 파국(−100, 1553년까지)을 맞는다 (G.Rel.set).
   ■ 런던 탑의 엘리자베스 (메리 1세 시절, 1553.7~1558.11): 잉글랜드 왕궁의 주인과 친분이 있으면 런던 거리에 「런던 탑」이 보인다.
     갇힌 엘리자베스 공주가 언니(메리 여왕)가 자기를 죽이려 한다며 도움을 청한다 → 잉글랜드의 다른 도시(요크·브리스틀·사우샘프턴·플리머스)로
     넉 달 안에 피신시키면 성공 → 그녀가 여왕이 된 뒤(1558.11~) 런던 왕궁에 가면 그 보답으로 잉글랜드 기사(명예 작위 「기사」)로 임명한다.
   ■ 드레이크의 습격 세 번 → 무적함대: 잉글랜드 기사가 되고 두 해 뒤부터(습격은 1585·1586·1587년보다 이르지 않게, 한 해 간격) 드레이크가 부른다 — ① 카디스 앞바다(무적함대 선단)
     ② 아조레스 제도(보물선 산 펠리페호) ③ 카리브 해(서인도 함대). 부름마다 1년 안에 그 바다로 가면 드레이크의 배 세 척과 함께 싸운다
     (이기든 지든 물러나든 놓치든 다음 부름은 한 해 뒤). 무적함대는 1588년 5월 28일에 떠난다(남은 습격은 지나간다) → 도버 해협·영국 해협에서
     우리 함대 + 드레이크의 배 세 척 대 무적함대 열두 척 (G.Rel.greatBattle). 우리 편은 모두 캘버린포(멀리), 에스파냐는 카논포(짧고 셈) —
     우리 배의 대포는 그 싸움에서만 바뀐다. 습격을 셋 다 이기면 무적함대의 병사가 줄어든다. 무적함대를 이기면 명성·포상금·작위 한 칸.
     레판토(1571, js/data/relevents.js cr_league1571)는 역사대로 그 해에 따로 벌어진다.
   ■ 칼레 해전 (1588): 엘리자베스 1세에게 발견을 한 번이라도 보고했으면(TD.onReport), 1588년 런던 왕궁에서 여왕이 부른다 —
     「무적함대가 잉글랜드로 온다. 하워드 경과 드레이크가 칼레 앞바다에서 화선을 띄운다」 → 7월 20일~8월 15일 사이 칼레 앞바다(도버 해협 동쪽)에 가면
     화선을 띄우는 밤(제독이 화약·타르를 대면 무적함대가 더 크게 흩어진다) → 이튿날 그라블린 앞바다에서 하워드·드레이크·호킨스의 배와 함께 큰 해전.
     이기면 잉글랜드 작위 한 칸(기사가 아니면 기사)·명성·포상금. 칼레 해전을 겪으면 드레이크의 습격 끝의 「무적함대」는 따로 열리지 않는다(같은 1588년의 싸움).
   ■ 저장: state.tudor = {calais: {rep: 엘리자베스에게 한 발견 보고 수, stage: 'call'|'declined'|'met'|'won'|'lost'|'missed', fire}, div: {stage, due}, eliz: {stage, dest, due}, knight: {day, y},
     drake: {done 0~3, call 0|1~3, next, until, res[], won}, armada: 'call'|'met'|'won'|'lost'|'missed'} */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var TD = G.Tudor = {};
  function S() { return G.Game && G.Game.state; }
  function st() { var s = S(); if (!s) return null; var t = s.tudor || (s.tudor = {}); if (!t.div) t.div = { stage: 0 }; if (!t.eliz) t.eliz = { stage: 0 }; return t; }
  var K = { friend: 40, divY: [1527, 1533], envoyDays: 365, elizDays: 120, armadaDays: 730, armadaWindow: 180, raidWindow: 365 };   // armadaDays: 습격·무적함대 부름 사이(두 해) · raidWindow: 습격 하나를 기다려 주는 날
  K.raidGap = 365;   // 습격 사이 (1585~1587에 셋이 다 들어가게 한 해)
  TD.K = K;
  // 습격 ①②③을 부를 수 있는 가장 이른 날 (역사: 1585~1587년 드레이크의 습격) · 무적함대의 출항 (1588년 5월 28일 리스본)
  var RAID_FROM = [15850101, 15860101, 15870101], ARM = { from: 15880528, to: 15880731 };
  TD.ARM = ARM; TD.RAID_FROM = RAID_FROM;
  /** dateNum 날짜를 s.day(게임 날 번호)로 */
  function dayOf(n) { var s = S(); return s.day + U.dayIndex({ y: Math.floor(n / 10000), m: Math.floor(n / 100) % 100, d: n % 100 }) - U.dayIndex(s.date); }
  /** 다음 습격을 부를 날 — 서임 두 해 뒤(d.next)와 그 습격의 역사 해(RAID_FROM) 가운데 늦은 날. 옛 저장의 이른 d.next도 여기서 걸러진다 */
  function raidDay(d) { return Math.max(d.next || 0, dayOf(RAID_FROM[Math.min(d.done, RAID_FROM.length - 1)])); }
  function dn(d) { return d.y * 10000 + d.m * 100 + d.d; }
  function SP() { return G.Sponsor; }
  function king() { return G.SPONSOR.en_king; }
  function holder() { return SP() && king() ? SP().holder(king()) : null; }
  /** 잉글랜드 왕궁의 주인과 친분이 있는가 (만난 적이 있고 신뢰 40 이상) */
  TD.friend = function () { var r = S().sponsors && S().sponsors.en_king; return !!(r && r.met && (r.trust || 0) >= K.friend); };
  /** 왕(헨리 8세·엘리자베스 1세)의 이 사건 대사는 늘 알아듣게 — 탑의 공주 때는 읽히다가 여왕이 되자 게르만어로 뒤섞이던 것 (QA 2026-10-18) */
  function who() {
    var o = SP().speaker(king());
    if (elizQueen()) {
      var key = 'portraits/history/elizabeth_player';
      o.portrait = G.Art.withImg(G.Art.npcSpec('elizabeth', 'noble', 'ne', 'f'), [key, 'portraits/sponsors/en_king_6']);
      o.half = [key + '_half', 'portraits/sponsors/en_king_6_half'];
    }
    o.lang = 3; o.li = null; return o;
  }
  function envoy() { return { name: '스티븐 가디너 (국왕의 특사)', portrait: G.Art.withImg(G.Art.npcSpec('gardiner', 'priest', 'ne', 'm'), G.Img.chain.npc('priest')), lang: 3 }; }
  function eliz() {
    // 런던 탑의 공주와 즉위 뒤 여왕이 같은 전용 얼굴·무릎상으로 이어진다.
    var key = 'portraits/history/elizabeth_player';
    return { name: '엘리자베스 공주', portrait: G.Art.withImg(G.Art.npcSpec('elizabeth', 'noble', 'ne', 'f'), [key, 'portraits/princesses/court_princess_en_1', 'portraits/sponsors/en_king_6']), half: [key + '_half', 'portraits/princesses/court_princess_en_1_half', 'portraits/sponsors/en_king_6_half'], lang: 3 };
  }
  function drake() { return G.MATE.drake ? { name: '프랜시스 드레이크', portrait: G.Scenes.mateSpec('drake'), half: G.Img.chain.mateHalf('drake'), lang: 3 } : { name: '프랜시스 드레이크' }; }
  function englishRefuges() { return ['요크', '브리스틀', '사우샘프턴', '플리머스'].map(function (n) { return G.CITY_DATA.filter(function (c) { return c.name === n; })[0]; }).filter(function (c) { return c && R.cityExists(c); }); }
  function setTitle(n) {
    var c = G.Court && G.Court.state(); if (!c) return null;
    var realm = G.COURT.realms.EN, cur = c.titles.EN || 0, lad = G.Court.ladder(realm);
    var to = Math.min(lad.length, Math.max(n, cur + (cur >= n ? 1 : 0)));
    c.titles.EN = to;
    return G.Court.title(realm, to);
  }

  // ================================================================ 헨리 8세의 이혼
  async function henryAsk() {
    var t = st(), s = S(), w = who();
    await UI.say('…제독, 그대에게만 털어놓는 일이오. 짐과 카탈리나 왕비 사이에는 아들이 없소. 형의 아내였던 사람과 혼인한 것이 주님의 뜻을 거스른 것이 아니었나 밤마다 괴롭소.\f로마의 교황 성하께 이 혼인을 무효로 해 달라고 청할 생각이오. 그런데 황제 카를이 — 왕비의 조카 말이오 — 로마를 쥐고 흔드니, 짐의 특사가 무사히 닿을지 모르겠소.', w);
    var v = await UI.ask('헨리 8세가 특사를 로마 교황청까지 바래다 달라고 청한다.', [{ label: '특사를 태워 로마로 가겠다고 약속한다', value: 'yes' }, { label: '교회의 일에는 끼고 싶지 않다고 사양한다', value: 'no' }], w);
    if (v !== 'yes') { t.div.stage = -1; SP().addTrust(SP().rel('en_king'), -3); await UI.say('…그렇소. 하는 수 없지.', w); return; }
    t.div.stage = 1; t.div.due = U.dateNum(U.addDays(s.date, K.envoyDays));
    await UI.say('고맙소! 가디너 박사를 딸려 보내겠소. 로마의 교황궁에 닿거든 그를 성하 앞에 세워 주시오. 기한은 한 해요.', w);
    await UI.say('스티븐 가디너입니다. 폐하의 「큰 문제」를 성하께 아뢰러 갑니다. 신세 지겠습니다, 제독.', envoy());
    G.State.log('헨리 8세의 특사 스티븐 가디너를 태우고 로마 교황청으로 간다 (기한 ' + U.fmtDate(U.addDays(s.date, K.envoyDays)) + ')');
    UI.toast('왕의 특사를 태웠다 — 로마의 교황궁으로', 'scroll', 5000);
  }
  async function popeAnswer(pope) {
    var t = st(), pw = SP().speaker(pope);
    await UI.say('교황 성하, 잉글랜드의 헨리 국왕 폐하께서 아뢰옵니다. 폐하와 카탈리나 왕비의 혼인은 처음부터 무효이니, 그것을 밝혀 주시기를 간청하십니다.', envoy());
    await UI.say('…잉글랜드 왕의 고뇌는 안다. 허나 짐의 전임자께서 특별히 허락하신 혼인을 짐이 뒤집을 수는 없다. 게다가 — 왕비는 황제의 고모다. 황제의 군대가 이 도시를 짓밟은 것이 엊그제 일이니라.\f돌아가 전하라. 교황청은 이 혼인을 무효로 할 수 없다고.', pw);
    await UI.say('…폐하께서 크게 노하실 겁니다. 제독, 어서 런던으로 돌아가십시다.', envoy());
    t.div.stage = 2;
    G.State.log('교황 ' + SP().holderName(pope) + '이(가) 헨리 8세의 혼인 무효 청을 거절했다.');
  }
  async function henryBreak() {
    var t = st(), s = S(), w = who();
    await UI.say('…거절했다고? 교황이? 황제의 눈치를 보느라 짐의 영혼을 버리겠다는 것이로군!\f좋다. 잉글랜드의 교회는 잉글랜드의 왕이 다스린다. 로마의 허락 따위는 필요 없다. 짐은 카탈리나와의 혼인이 무효임을 선언하노라!', w);
    t.div.stage = 3;
    var y = s.date.y;
    if (G.Rel) { G.Rel.set('EN', 'PA', -100, 1553, '헨리 8세가 로마와 갈라섰다 — 잉글랜드 국교회'); G.Rel.set('EN', 'ES', -100, 1553, '카탈리나 왕비를 내친 헨리 8세에게 황제가 노했다'); }
    s.player.gold += 6000;
    var so = G.Fame ? G.Fame.add('so', 150) : 150;
    SP().addTrust(SP().rel('en_king'), 10);
    if (s.player.nation === 'ES' && G.SPONSOR.es_crown) SP().addTrust(SP().rel('es_crown'), -10);
    await UI.alert('<div class="center"><div style="font-size:26px;font-weight:800;margin:4px 0">헨리 8세의 이혼 선언</div><div class="muted">' + y + '년 · 런던</div></div><br>' +
      '잉글랜드가 로마 교황청과 갈라섰다. 이제 잉글랜드의 교회는 왕이 다스린다.<br>' +
      '<b class="warn-text">잉글랜드와 교황청</b>, <b class="warn-text">잉글랜드와 에스파냐</b>의 관계가 파국을 맞았다 (1553년까지).<br><br>' +
      '왕의 사례금 금화 <b>6,000</b>닢 · 사교 명성 <b>+' + so + '</b> · 헨리 8세의 신뢰 +10' + (s.player.nation === 'ES' ? '<br><span class="muted">에스파냐 왕실은 제독이 이 일을 도운 것을 못마땅해한다 (신뢰 −10)</span>' : ''), '종교 개혁의 시작');
    G.State.log('헨리 8세가 이혼을 선언하고 로마와 갈라섰다. 잉글랜드·교황청, 잉글랜드·에스파냐의 관계가 파국을 맞았다.');
    if (G.Game.refreshHud) G.Game.refreshHud();
  }

  // ================================================================ 런던 탑의 엘리자베스
  function maryReign() { var s = S(), t = dn(s.date); return t >= 15530719 && t < 15581117 && /메리/.test(holder() || ''); }
  function elizQueen() { return /엘리자베스/.test(holder() || ''); }
  /** 런던 왕궁에 들면 여왕이 서임할 차례인가 — 그때는 왕궁의 첫 인사(「그대가 근래 바다에서 이름을 떨친다는 항해자인가」)를 건너뛴다 (js/city/palace.js) */
  TD.knightDue = function (sp) { var t = st(); return !!(sp && sp.id === 'en_king' && t && elizQueen() && t.eliz.stage === 2 && !t.knight); };
  TD.towerOpen = function () { var t = st(); return !!(t && t.eliz.stage === 0 && maryReign() && TD.friend()); };
  /** 도시의 덧붙는 건물 (런던: 런던 탑) */
  TD.buildings = function (c) { return c && c.name === '런던' && TD.towerOpen() ? [{ kind: 'tower', name: '런던 탑', icon: 'castle' }] : []; };
  function hookTower() {
    var C = G.Scenes && G.Scenes.city; if (!C || !C.B || C.B.tower) return;
    var TW = { title: '런던 탑', icon: 'castle', paint: function () { return G.Img && G.Img.has('interiors/tower') ? 'tower' : 'gate'; }, exitLabel: '런던 탑을 나온다' };
    TW.enter = async function (c) {
      var guard = { name: '탑의 위병', portrait: G.Art.withImg(G.Art.npcSpec('towerguard', 'soldier', 'ne', 'm'), G.Img.chain.npc('guard', c)), lang: 3 };
      await UI.say('여기는 여왕 폐하의 감옥이오. …국왕 폐하와 친분이 있는 분이라니, 잠깐이라면 들여보내 드리지. 공주님은 저 종탑 방에 계시오.', guard);
      return true;
    };
    TW.menu = function (c) { return TD.towerOpen() ? [{ label: '갇힌 공주를 만난다', icon: 'crown', onClick: function () { return TD.meetEliz(c); } }] : []; };
    C.B.tower = TW;
  }
  TD.meetEliz = async function () {
    var pc = G.EventShot ? await G.EventShot.princess('eliz_tower') : null;   // 이벤트 샷: 종탑 방의 공주 (js/art/eventshot.js)
    try { return await meetElizIn(); } finally { if (pc) await pc.stop(); }
  };
  async function meetElizIn() {
    var t = st(), s = S(), e = eliz();
    await UI.say('…당신이 그 이름난 제독이군요. 위병이 문 밖에 있으니 작게 말할게요.\f언니 — 메리 여왕은 제가 와이엇의 반란에 끼었다고 믿어요. 저는 아무것도 하지 않았어요! 하지만 이 탑에서 나간 사람 가운데 목이 붙어 있는 사람은 드물지요. 어머니처럼요.\f부탁이에요. 저를 이 탑에서 빼내 런던에서 먼 잉글랜드의 다른 도시로 데려가 주세요. 그곳에는 저를 숨겨 줄 사람들이 있어요.', e);
    var refs = englishRefuges();
    var v = await UI.ask('엘리자베스 공주를 피신시킬까? (넉 달 안에 잉글랜드의 다른 도시로)', refs.map(function (c) { return { label: c.name + U.jx(c.name, '으로/로') + ' 모신다', value: c.id }; }).concat([{ label: '여왕을 거스를 수는 없다 — 사양한다', value: 'no' }]), e);
    if (v === 'no' || v == null) { await UI.say('…그래요. 당신 탓이 아니에요. 주님께서 저를 지켜 주시기를.', e); return; }
    t.eliz = { stage: 1, dest: v, due: U.dateNum(U.addDays(s.date, K.elizDays)) };
    await UI.say('고마워요! 하녀 옷으로 갈아입고 물 쪽 문(반역자의 문)으로 나갈게요. ' + G.CITY_DATA[v].name + '에 닿을 때까지 당신 배의 선실에 숨어 있을게요.', e);
    G.State.log('런던 탑에서 엘리자베스 공주를 빼내 ' + G.CITY_DATA[v].name + U.jx(G.CITY_DATA[v].name, '으로/로') + ' 피신시킨다 (기한 ' + U.fmtDate(U.addDays(s.date, K.elizDays)) + ')');
    UI.toast('엘리자베스 공주를 몰래 태웠다 — ' + G.CITY_DATA[v].name + U.jx(G.CITY_DATA[v].name, '으로/로'), 'crown', 5500);
  }
  async function elizSafe(c) {
    var t = st(), e = eliz();
    var pc = G.EventShot ? await G.EventShot.princess('eliz_safe', { city: c }) : null;   // 이벤트 샷: 피신한 항구
    try { await elizSafeIn(c, t, e); } finally { if (pc) await pc.stop(); }
  }
  async function elizSafeIn(c, t, e) {
    await UI.say('…' + c.name + '. 이제 숨을 쉴 수 있겠어요. 여기라면 언니의 병사들도 쉽게 찾지 못할 거예요.\f제독, 이 은혜를 잊지 않겠어요. 주님께서 저에게 왕관을 허락하신다면 — 그날 런던의 궁전으로 저를 찾아오세요.', e);
    t.eliz.stage = 2;
    if (G.Growth) G.Growth.once('eliz_safe', 'int', 1, '여왕의 병사들을 따돌리고 공주를 피신시켰다');
    var so = G.Fame ? G.Fame.add('so', 120) : 120;
    G.State.log('엘리자베스 공주를 ' + c.name + U.jx(c.name, '으로/로') + ' 무사히 피신시켰다. (사교 명성 +' + so + ')');
    UI.toast('엘리자베스 공주를 무사히 피신시켰다 — 사교 명성 +' + so, 'crown', 6000);
  }
  async function knight() {
    var pc = G.EventShot ? await G.EventShot.princess('eliz_knight') : null;   // 이벤트 샷: 여왕의 기사 서임
    try { await knightIn(); } finally { if (pc) await pc.stop(); }
  }
  async function knightIn() {
    var t = st(), s = S(), w = who();
    await UI.say('…그 얼굴, 잊을 리가 있겠어요? 런던 탑의 그 밤, 하녀 옷을 입은 저를 배에 숨겨 준 제독.\f이제 나는 잉글랜드의 여왕이에요. 무릎을 꿇으세요, ' + s.player.name + '.', w);
    var tt = setTitle(1);
    if (G.Growth) G.Growth.once('en_knight', 'cha', 1, '잉글랜드 기사 서임');
    t.knight = { day: s.day, y: s.date.y, date: U.dateNum(s.date) };
    var so = G.Fame ? G.Fame.add('so', 300) : 300;
    SP().addTrust(SP().rel('en_king'), 15);
    await UI.say('…이 칼이 그대의 어깨에 닿는 순간부터, 그대는 잉글랜드의 ' + (tt ? tt.ko : '기사') + '입니다. 일어나세요, ' + (tt && tt.call ? tt.call : '경') + '.', w);
    if (G.Audio) G.Audio.sfx('discover');
    await UI.alert('<div class="center"><div style="font-size:17px" class="muted">잉글랜드 · 명예 작위</div><div style="font-size:34px;font-weight:800;margin:6px 0">' + U.esc(tt ? tt.ko : '기사') + '</div><div style="font-size:20px;font-style:italic">' + U.esc(tt ? tt.native : 'Knight Bachelor') + '</div></div><br>' +
      '엘리자베스 1세가 런던 탑의 은혜를 갚았다. 사교 명성 <b>+' + so + '</b> · 여왕의 신뢰 +15<br><span class="muted">잉글랜드의 바다에는 머지않아 큰 싸움이 닥쳐온다는 소문이 돈다…</span>', '서임');
    G.State.log('엘리자베스 1세에게서 잉글랜드 ' + (tt ? tt.ko : '기사') + '의 작위를 받았다.');
    if (G.Game.refreshHud) G.Game.refreshHud();
  }

  // ================================================================ 드레이크의 습격 세 번 → 무적함대
  // 우리 편 = 드레이크의 배 세 척 · 우리 함대와 드레이크는 멀리 나가는 캘버린포, 에스파냐는 사정은 짧지만 한 방이 무서운 카논포
  var GUN = { me: 'culverin', foe: 'cannon' };
  var NOTE = '드레이크의 캘버린포를 실었다 — 사정거리 끝에서 두들기세요. 에스파냐 배의 카논포는 짧지만 붙으면 한 방에 부서집니다!';
  function drakeAboard() { var s = S(); return !!(s && s.mates && s.mates.some(function (m) { return m.id === 'drake'; })); }
  /** 드레이크의 배 세 척 (드레이크가 우리 배에 타고 있으면 그의 부하 선장들이 몬다) */
  function drakeShips() {
    var on = drakeAboard();
    return [{ type: 'galleon', name: on ? '리벤지호 (드레이크 함대)' : '리벤지호 (드레이크)', gun: GUN.me },
      { type: 'galleon', name: '골든 하인드호', gun: GUN.me },
      { type: 'carrack', name: '엘리자베스 보나벤처호', gun: GUN.me }];
  }
  /** 습격 세 번 — 한 해 간격 (raidDay) (box: [경도 서, 동, 위도 남, 북]) */
  var RAIDS = [
    { id: 'drake_raid1', where: '카디스 앞바다', box: [-8.8, -5.6, 35.4, 37.4],
      foeLabel: '카디스의 무적함대 선단', ships: ['galleon', 'galley', 'galley', 'carrack', 'galley'],
      news: '【드레이크의 습격 ①】 펠리페 2세가 잉글랜드를 칠 큰 함대를 카디스 항에서 꾸리고 있다. 드레이크가 편지를 보냈다 — 「에스파냐 왕의 수염을 그슬리러 가세. 카디스 앞바다로 오게.」',
      intro: '왔구려, 기사 나리! 저 항구 안에 무적함대가 될 배들과 보급품이 가득하오. 지금 불태우면 저들의 출항이 한 해는 늦어질 거요.\f우리 배에는 모두 캘버린포를 실었소. 저들의 카논포는 무섭지만 멀리 못 나가지 — 붙지 말고 멀리서 두들기시오!',
      win: { fame: 400, gold: 8000, so: 60, text: '카디스 습격 성공! 「에스파냐 왕의 수염을 그슬렸다」 — 불탄 배와 보급품 탓에 무적함대의 출항이 늦어졌다.' },
      lose: '카디스 앞바다에서 물러났다. 드레이크도 배를 돌렸다…' },
    { id: 'drake_raid2', where: '아조레스 제도', box: [-32, -24, 36, 40.6],
      foeLabel: '보물선 산 펠리페호와 호위 함대', ships: ['hcarrack', 'galleon', 'galleon', 'galleon'],
      news: '【드레이크의 습격 ②】 동인도의 보물을 가득 실은 에스파냐 왕의 큰 카락선 「산 펠리페호」가 돌아오고 있다. 드레이크가 아조레스 제도 앞바다에서 기다리자고 한다.',
      intro: '저기 오는구려, 산 펠리페호! 저 배 한 척의 짐이 무적함대를 꾸릴 돈이오. 호위하는 갤리온들의 카논포에 붙잡히지 말고, 멀리서 돛대와 키를 노리시오.',
      win: { fame: 500, gold: 14000, so: 70, text: '보물선 산 펠리페호를 나포했다! 향신료·비단·보석이 쏟아져 나왔다 — 무적함대의 군자금이 크게 줄었다.' },
      lose: '보물선은 호위 함대의 품에 안겨 리스본으로 들어갔다…' },
    { id: 'drake_raid3', where: '서인도 (카리브 해)', box: [-80, -62, 9, 20.5],
      foeLabel: '서인도 함대 (은 수송 선단 호위)', ships: ['lgalleon', 'galleon', 'galleon', 'galleon', 'carrack', 'galleon'],
      news: '【드레이크의 습격 ③】 무적함대를 꾸릴 마지막 은이 서인도에서 실려 온다. 드레이크가 산토도밍고·카르타헤나 앞바다, 카리브 해에서 만나자고 한다.',
      intro: '여기까지 와 주었구려! 저 은이 세비야에 닿으면 펠리페가 마지막 함대를 띄우오. 은 선단을 지키는 서인도 함대를 부수면 무적함대는 빈손으로 나서게 되지.\f늘 하던 대로 — 바람을 잡고, 멀리서, 캘버린포로!',
      win: { fame: 600, gold: 12000, so: 80, text: '서인도 함대를 무찔렀다! 은 수송 선단이 흩어졌다 — 이제 남은 것은 무적함대 그 자체뿐.' },
      lose: '서인도 함대에 밀려 물러났다. 은은 무사히 에스파냐로 건너갔다…' }
  ];
  RAIDS.forEach(function (r, i) {
    r.foe = '에스파냐'; r.allies = drakeShips(); r.who = { mate: 'drake' };
    r.ask = '드레이크의 습격 ' + (i + 1) + '/3 — ' + r.where + '에서 드레이크의 배 세 척과 함께 ' + r.foeLabel + U.jx(r.foeLabel, '을/를') + ' 치겠습니까?';
    r.gun = GUN.foe; r.myGun = GUN.me; r.gunNote = NOTE; r.gunK = 0.85; r.crewK = 0.8;
    r.decline = '…그대의 사정도 있겠지. 이번엔 우리끼리 가겠소. 다음에 다시 부르리다.';
    r.onWin = function () { var t = st(); t.drake.res[i] = 'won'; t.drake.won = (t.drake.won || 0) + 1; SP().addTrust(SP().rel('en_king'), 5); raidDone(); };
    r.onLose = function () { st().drake.res[i] = 'lost'; raidDone(); };
  });
  var ARMADA = {
    id: 'armada', foe: '에스파냐', foeLabel: '무적함대 (메디나시도니아 공작)',
    // 열두 척: 기함 산 마르틴호(대형 갤리온)와 갤리온·갤리어스·중카락 — 모두 카논포에 병사를 가득 태웠다
    ships: ['lgalleon', 'galleon', 'galleon', 'galleass', 'galleon', 'hcarrack', 'galleon', 'lgalleon', 'galleass', 'galleon', 'hcarrack', 'galleon'],
    allies: drakeShips(), who: { mate: 'drake' }, intro: '', ask: '무적함대 — 우리 함대와 드레이크의 배 세 척으로 에스파냐 무적함대 열두 척에 맞서겠습니까?',
    gun: GUN.foe, myGun: GUN.me, gunNote: NOTE, gunK: 0.9, crewK: 0.95,
    win: { fame: 1000, gold: 20000, so: 200, text: '무적함대를 무찔렀다! 불붙인 배에 흩어진 에스파냐 함대가 북해의 폭풍 속으로 쫓겨 갔다.' },
    lose: '해협에서 물러났다. 무적함대는 칼레 앞바다로 나아간다…',
    onWin: function () {
      var tt = setTitle(2), s = S();
      if (G.Rel) G.Rel.set('EN', 'ES', -100, s.date.y + 4, '무적함대를 무찔렀다');
      SP().addTrust(SP().rel('en_king'), 15);
      if (tt) UI.toast('여왕이 공을 기려 잉글랜드 ' + tt.ko + U.jx(tt.ko, '으로/로') + ' 올렸다!', 'crown', 6500);
      st().armada = 'won';
    },
    onLose: function () { st().armada = 'lost'; }
  };
  function armadaSpec() {
    var t = st(), won = (t.drake && t.drake.won) || 0;
    var spec = Object.assign({}, ARMADA);
    spec.allies = drakeShips();
    spec.intro = (drakeAboard() ? '자, 함께 온 이 바다요, 기사 나리. ' : '왔구려, 기사 나리! ') + '저기 보이는 초승달 모양의 대함대가 에스파냐의 무적함대요. 우리 몫은 저 앞줄의 열두 척이오.\f' +
      (won ? '그대와 함께 ' + won + '번이나 저들의 수염을 그슬렸지. ' + (won >= 3 ? '군자금도 보급품도 모자라 저들은 반쯤 굶주린 채 나왔소. ' : '') : '') +
      '저들은 덩치가 크고 병사가 많고, 카논포 한 방이 무섭소. 하지만 둔하고 대포가 짧지. 우리 배에는 모두 캘버린포를 실었소 — 바람을 등지고 사정거리 끝에서 두들기다가, 밤이 되면 불붙인 배를 보내 진을 흩뜨릴 참이오. 함께 갑시다!';
    if (won >= 3) spec.crewK = 0.8;   // 습격 세 번을 다 이겼으면 무적함대는 보급이 모자라 병사가 줄었다
    return spec;
  }
  function inBox(b) { var l = S().loc; return !!(l && l.mode === 'sea' && l.lon >= b[0] && l.lon <= b[1] && l.lat >= b[2] && l.lat <= b[3]); }
  var CHANNEL = [-7, 3, 48.5, 52];
  function inChannel() { return inBox(CHANNEL); }
  /** 습격 하나가 끝났다 (이기든 지든 물러나든 놓치든) — 다음 부름은 raidDay */
  function raidDone() { var d = st().drake; if (!d || !d.call) return; d.done = Math.max(d.done, d.call); d.call = 0; }
  function raidOf(d) { return d && d.call ? RAIDS[d.call - 1] : null; }
  if (G.Rel) { RAIDS.forEach(function (r) { G.Rel.register(r); }); G.Rel.register(ARMADA); }
  TD.RAIDS = RAIDS; TD.armadaSpec = armadaSpec;

  // ================================================================ 날마다 · 들어설 때
  TD.daily = function () {
    var t = st(), s = S(), out = []; if (!t) return out;
    hookTower(); hookCourt();
  if (G.Court && G.Court.taskHtml && !G.Court._tudorHtml) { G.Court._tudorHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + TD.html(); }; }
    var today = U.dateNum(s.date);
    if (t.div.stage === 1 && today > t.div.due) { t.div.stage = -2; SP().addTrust(SP().rel('en_king'), -8); out.push({ icon: 'scroll', text: '기한 안에 헨리 8세의 특사를 로마에 데려가지 못했다. 왕이 크게 실망했다. (신뢰 −8)' }); }
    if (t.eliz.stage === 1 && today > t.eliz.due) { t.eliz.stage = -2; out.push({ icon: 'skull', text: '엘리자베스 공주를 기한 안에 피신시키지 못했다. 공주는 여왕의 병사들에게 붙잡혀 우드스톡의 저택에 갇혔다고 한다.' }); }
    // 기사가 되고 두 해 뒤부터: 습격 ①②③ (1585년부터, 한 해 간격) → 무적함대는 1588년 5월 말에 (옛 저장: 이미 무적함대가 불렸으면 그대로)
    // 서임 2년 뒤면 연도와 상관없이 습격·무적함대가 열리던 것 — 습격은 1585년 무렵부터, 무적함대는 역사대로 1588년에만 (QA 2026-10-23)
    if (t.knight && !t.armada) {
      var d = t.drake || (t.drake = { done: 0, call: 0, next: t.knight.day + K.armadaDays, res: [], won: 0 });
      var rd = raidOf(d);
      if (rd && s.day > d.until) {
        d.res[d.call - 1] = d.res[d.call - 1] || 'missed'; raidDone();
        out.push({ icon: 'cannon', text: '드레이크는 ' + rd.where + '에서 기다리다 홀로 싸우러 갔다. (습격 ' + d.done + '/3 — 놓침)' });
      }
      var calaisOn = t.calais && (t.calais.stage === 'call' || t.calais.stage === 'met');   // 여왕이 칼레 해전에 부른 제독은 그쪽이 같은 1588년의 싸움
      if (elizQueen() && !calaisOn && today >= ARM.from && today <= ARM.to) {
        rd = raidOf(d);
        if (rd) { d.res[d.call - 1] = d.res[d.call - 1] || 'missed'; raidDone(); }   // 남은 습격은 무적함대에 밀려 지나간다
        t.armada = 'call'; t.armadaUntil = s.day + K.armadaWindow;
        out.push({ icon: 'cannon', history: true, text: '【무적함대】 마침내 에스파냐의 무적함대가 잉글랜드로 떠났다! 드레이크가 편지를 보냈다 — 「' + (d.done >= RAIDS.length ? '세 번의 습격은 이날을 위한 것이었소. ' : '') + '우리 배 넷으로 저들의 앞줄 열두 척을 맡읍시다. 도버 해협·영국 해협으로 오시오.」' });
      } else if (!d.call && d.done < RAIDS.length && s.day >= raidDay(d) && elizQueen() && today < ARM.from) {
        d.call = d.done + 1; d.until = s.day + K.raidWindow; rd = RAIDS[d.call - 1];
        d.next = s.day + K.raidGap;
        out.push({ icon: 'cannon', history: true, text: rd.news });
      }
    }
    // 칼레 해전: 무적함대가 칼레 앞바다에 닿았다 · 놓쳤다
    var ca = t.calais;
    if (ca && ca.stage === 'call' && today >= CAL.from && !ca.told) { ca.told = 1; out.push({ icon: 'cannon', history: true, text: '【무적함대】 에스파냐의 무적함대가 영국 해협을 거슬러 올라 칼레 앞바다에 닻을 내렸다! 하워드 경이 화선을 준비하고 있다 — 8월 15일까지 칼레 앞바다로.' }); }
    if (ca && ca.stage === 'call' && today > CAL.until) { ca.stage = 'missed'; t.armada = t.armada || 'calais'; out.push({ icon: 'cannon', text: '칼레 해전은 제독 없이 벌어졌다. 하워드 경의 화선에 흩어진 무적함대가 그라블린 앞바다에서 무너졌다고 한다.' }); }
    if (t.armada === 'call' && s.day > t.armadaUntil) { t.armada = 'missed'; out.push({ icon: 'cannon', text: '무적함대와의 싸움은 제독 없이 끝났다. 드레이크와 하워드 경의 함대가 해협을 지켜 냈다고 한다.' }); }
    return out;
  };
  TD.pending = function () {
    var t = S() && S().tudor; if (!t) return false;
    var rd = raidOf(t.drake);
    return !!((t.calais && calaisOpen() && inCalais()) || (t.armada === 'call' && inChannel()) || (rd && inBox(rd.box)) || (t.eliz && t.eliz.stage === 1 && S().loc && S().loc.mode === 'city' && S().loc.city === t.eliz.dest));
  };
  /** 바다의 하루 끝·도시에 들어설 때 */
  TD.check = async function () {
    var t = st(), s = S(); if (!t || TD._busy) return false;
    TD._busy = true;
    try {
      if (t.eliz.stage === 1 && s.loc.mode === 'city' && s.loc.city === t.eliz.dest) await elizSafe(G.CITY_DATA[s.loc.city]);
      var rd = raidOf(t.drake);
      if (t.calais && calaisOpen() && inCalais()) await calaisNight();
      else if (rd && inBox(rd.box) && G.Rel) {
        rd.allies = drakeShips(); G.Rel.register(rd);
        var go = await G.Rel.greatBattle(rd);
        if (!go) { t.drake.res[t.drake.call - 1] = 'declined'; raidDone(); }   // 물러나면 이번 습격은 지나가고, 한 해 뒤 다음 부름
      } else if (t.armada === 'call' && inChannel() && G.Rel) {
        var spec = armadaSpec(); G.Rel.register(spec);
        t.armada = 'met';
        await G.Rel.greatBattle(spec);
      }
    } catch (e) { console.error(e); }
    TD._busy = false;
    return true;
  };


  // ================================================================ 칼레 해전 (1588) — 엘리자베스 1세에게 발견을 보고한 제독
  var CALAIS = [0.9, 2.7, 50.55, 51.45];        // 칼레·그라블린 앞바다 (도버 해협 동쪽 어귀) [경도 서, 동, 위도 남, 북]
  var CAL = { callFrom: 15880101, callTo: 15880731, from: 15880720, until: 15880815 };
  function calais() { var t = st(); if (!t.calais) t.calais = { rep: 0 }; return t.calais; }
  /** 발견 보고 (js/systems/sponsor.js): 그때 잉글랜드 왕궁의 주인이 엘리자베스 1세면 센다 */
  TD.onReport = function (sp) { if (sp && sp.id === 'en_king' && elizQueen()) calais().rep++; };
  function hist(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }   // 칼레 해전의 인물들 (js/data/histfigures.js)
  /** 런던 왕궁에서 여왕이 부를 차례인가 */
  TD.calaisDue = function (sp) {
    var t = st(), c = calais(), today = dn(S().date);
    return !!(sp && sp.id === 'en_king' && elizQueen() && c.rep > 0 && !c.stage && !t.armada && today >= CAL.callFrom && today <= CAL.callTo);
  };
  function inCalais() { return inBox(CALAIS); }
  function calaisOpen() { var c = calais(), today = dn(S().date); return c.stage === 'call' && today >= CAL.from && today <= CAL.until; }
  async function calaisCall() {
    var c = calais(), w = who(), s = S();
    await UI.say((c.rep > 1 ? '그대가 내게 가져온 먼 바다의 이야기들, 잊지 않았소. ' : '그대가 내게 가져온 먼 바다의 발견, 잊지 않았소. ') + '오늘은 내가 그대에게 청할 일이 있어 불렀어요.\f' +
      '펠리페가 마침내 무적함대를 띄웠어요. 백삼십 척, 병사 이만. 파르마 공의 군대를 플랑드르에서 태워 이 섬에 올리려는 거예요.\f' +
      '저들의 총사령관은 메디나 시도니아 공작. 바다를 모르는 귀족이라지만, 레칼데와 오켄도 같은 늙은 바다 사자들이 곁에 있어요.\f' +
      '하워드 경과 드레이크는 저들이 칼레 앞바다에 닻을 내리는 날을 기다리고 있어요. 유스티누스 반 나사우의 네덜란드 배들이 플랑드르 해안을 막아 파르마 공의 바지선이 나오지 못하게 할 거예요.\f그 밤에 불붙인 배를 띄워 저들의 진을 흩뜨리고, 이튿날 그라블린 앞바다에서 끝장을 볼 거예요.', w);
    var v = await UI.ask('엘리자베스 1세가 칼레 앞바다의 싸움에 함께해 달라고 청한다 (1588년 7월 20일 ~ 8월 15일, 도버 해협의 칼레 앞바다)', [
      { label: '폐하의 바다를 함께 지키겠습니다', value: 'yes' }, { label: '제 나라 배로 에스파냐와 싸울 수는 없습니다 — 사양한다', value: 'no' }], w);
    if (v !== 'yes') { c.stage = 'declined'; await UI.say('…그대의 처지도 알아요. 그래도 이 섬의 바다에서 그대를 다시 보고 싶었는데.', w); return; }
    c.stage = 'call';
    SP().addTrust(SP().rel('en_king'), 5);
    await UI.say('고마워요, 제독. 7월 하순에서 8월 중순 사이, 칼레 앞바다로 가세요. 하워드 경의 아크 로열호가 그대를 기다릴 거예요.\f…신께서 바람을 우리 편으로 불게 하시기를.', w);
    G.State.log('엘리자베스 1세의 청으로 칼레 앞바다에서 무적함대와 싸우기로 했다. (1588년 7월 20일 ~ 8월 15일)');
    UI.toast('칼레 앞바다 — 1588년 7월 20일부터 8월 15일 사이 (도버 해협 동쪽)', 'cannon', 6500);
  }
  var CALAIS_BATTLE = {
    id: 'calais', foe: '에스파냐', foeLabel: '무적함대 (메디나 시도니아 공작)',
    allies: [{ type: 'lgalleon', name: '아크 로열호 (하워드 경)', gun: GUN.me }, { type: 'galleon', name: '리벤지호 (드레이크)', gun: GUN.me },
      { type: 'galleon', name: '빅토리호 (호킨스)', gun: GUN.me }, { type: 'galleon', name: '뱅가드호 (윈터)', gun: GUN.me }],
    who: { hist: 'drake' }, ask: '칼레 해전 — 그라블린 앞바다에서 하워드 경·드레이크·호킨스·윈터의 배와 함께 흩어진 무적함대에 맞서겠습니까?',
    gun: GUN.foe, myGun: GUN.me, gunNote: '하워드 경의 캘버린포를 실었다 — 사정거리 끝에서 두들기세요. 흩어진 에스파냐 배는 서로 돕지 못합니다!', gunK: 0.9, crewK: 0.9,
    boss: { hist: 'medina', str: 52, mar: 58, int: 70, cha: 66, line: '내 배에 오른 이상, 펠리페 폐하의 이름으로 그대를 상대하겠소!' },
    win: { fame: 1000, gold: 20000, so: 250, text: '칼레 해전에서 이겼다! 화선에 흩어진 무적함대가 그라블린 앞바다에서 무너졌다. 메디나 시도니아 공작은 북쪽으로 물러나라 명했고, 파르마 공의 군대는 끝내 바다를 건너지 못했다.' },
    lose: '그라블린 앞바다에서 물러났다. 그래도 바람은 잉글랜드 편이었다 — 무적함대는 북해로 밀려났다고 한다.',
    decline: '…알겠소. 그대는 여기까지 와 준 것만으로도 충분하오. 우리끼리 끝장을 보겠소.',
    onWin: function () {
      var t = st(), s = S(), c = calais(), tt = setTitle(t.knight ? 2 : 1);
      if (!t.knight) t.knight = { day: s.day, y: s.date.y, date: U.dateNum(s.date), calais: 1 };
      c.stage = 'won'; t.armada = 'calais';
      if (G.Rel) G.Rel.set('EN', 'ES', -100, s.date.y + 4, '칼레 해전');
      SP().addTrust(SP().rel('en_king'), 15);
      if (tt) UI.toast('엘리자베스 1세가 칼레의 공을 기려 잉글랜드 ' + tt.ko + U.jx(tt.ko, '으로/로') + ' 올렸다!', 'crown', 6500);
    },
    onLose: function () { calais().stage = 'lost'; st().armada = 'calais'; }
  };
  // 무적함대의 배 (기함부터): 화선에 크게 흩어졌으면 앞의 여섯 척만 남는다
  var ARMADA_SHIPS = [['lgalleon', '산 마르틴호 (메디나 시도니아 공작)'], ['galleon', '산 후안호 (레칼데)'], ['galleass', '산 로렌소호 (나폴리 갤리어스)'], ['galleon', '산타 아나호 (오켄도)'],
    ['hcarrack', '라 레가소나호'], ['galleon', '산 펠리페호'], ['galleass', '히로나호 (갤리어스)'], ['galleon', '산 마테오호']];
  function calaisSpec() {
    var c = calais(), spec = Object.assign({}, CALAIS_BATTLE), n = c.fire === 'big' ? 6 : 8;
    spec.ships = ARMADA_SHIPS.slice(0, n).map(function (x) { return x[0]; });
    spec.names = ARMADA_SHIPS.slice(0, n).map(function (x) { return x[1]; });
    spec.council = [
      ['howard', '모두 모였구려. 간밤의 불이 저들의 진을 깨뜨렸소. 오늘은 그라블린 앞바다, 저들이 다시 초승달을 짜기 전에 친다.'],
      ['hawkins', '저들의 배는 높고 무겁소, 각하. 바람 위에 서서 흘수선 아래를 노리면 저 큰 배들도 버티지 못합니다.'],
      ['winter', '화선을 띄우자고 한 늙은이로서 한마디만 하지 — 반 마일 안쪽으로 들어가지 마시오. 저들의 카논포는 짧지만, 붙으면 우리 배가 장작이 되오.']
    ];
    spec.intro = '그대가 소문의 그 제독이구려! 여왕 폐하께서 그대 이야기를 하셨소. 며칠 전엔 내가 페드로 데 발데스의 로사리오호를 통째로 붙잡았지 — 발데스는 지금 내 선실에서 포도주를 마시고 있다오.\f' +
      '어젯밤 화선 여덟 척이 썰물을 타고 저들의 진으로 흘러 들어갔소. 놀란 에스파냐 배들이 닻줄을 끊고 사방으로 흩어졌지' +
      (c.fire === 'big' ? ' — 그대가 댄 화약과 타르 덕에 불길이 더 거셌소. 저들 앞줄에 남은 배는 여섯 척뿐이오!' : '. 저들 앞줄에 남은 배는 여덟 척이오.') +
      '\f이제 끝장을 봅시다. 바람을 등지고, 멀리서, 캘버린포로!';
    spec.foeScene = [
      [null, '— 그 무렵, 무적함대의 기함 산 마르틴호.'],
      ['medina', '닻줄을 끊고 흩어진 배들을 다시 모으시오! 파르마 공에게서는 아직 소식이 없소?'],
      ['recalde', '공작 각하, 파르마 공의 바지선은 됭케르크에서 한 척도 나오지 못했습니다. 네덜란드 놈들의 얕은 배가 해안을 막고 있습니다.'],
      ['oquendo', '메드라노의 갤리선들은 비스케이만 폭풍에 흩어져 프랑스 해안에 숨었고, 발데스는 드레이크에게 잡혔소. 이제 우리끼리 싸울 수밖에 없소!'],
      ['medina', '…좋소. 산 마르틴호가 앞장서겠소. 주님과 펠리페 폐하를 위하여!']
    ];
    return spec;
  }
  /** 칼레 앞바다에 닿았을 때: 화선의 밤 → 그라블린 앞바다의 해전 */
  async function calaisNight() {
    var c = calais(), h = hist('howard'), s = S();
    c.stage = 'met';
    await UI.say('제독, 와 주었구려! 저기 보이시오? 칼레 앞바다에 닻을 내린 초승달 — 저것이 무적함대요. 저들은 파르마 공의 군대를 기다리고 있소.\f허나 유스티누스 반 나사우의 네덜란드 배들이 플랑드르 해안을 막고 있으니, 파르마 공은 나오지 못하오. 저들은 이 앞바다에 갇힌 셈이지.', h);
    if (G.Hist) await G.Hist.play([['winter', '각하, 오늘 밤이 그날입니다. 썰물에 바람까지 저들 쪽으로 붑니다. 낡은 배 여덟 척에 타르와 화약을 채워 불을 붙여 흘려보내면, 저들은 닻을 끊고 흩어질 겁니다.'],
      ['howard', '윈터 경의 말대로 하지. 화약과 타르를 더 실을수록 불길이 거세질 것이오.']]);
    var opts = [{ label: '하워드 경의 화선에 맡긴다', value: 'small' }];
    if (s.player.gold >= 5000) opts.unshift({ label: '화약·타르를 댄다 (금화 5,000닢 — 무적함대가 더 크게 흩어진다)', value: 'big' });
    var v = await UI.ask('화선에 실을 화약·타르를 대겠는가? — 소지금 ' + U.num(s.player.gold) + '닢', opts, h);
    if (v === 'big' && s.player.gold >= 5000) { s.player.gold -= 5000; c.fire = 'big'; } else c.fire = 'small';
    await UI.say('…자정이 지나자 여덟 척의 배가 불덩이가 되어 바람과 썰물을 타고 흘러갔다. 에스파냐 배들의 진이 비명과 함께 무너진다. 닻줄을 끊고 달아나는 배들이 어둠 속에서 서로 부딪쳤다.' + (c.fire === 'big' ? '\f제독이 댄 화약이 터질 때마다 불기둥이 돛대보다 높이 솟았다.' : ''), {});
    G.State.log('칼레 앞바다에서 화선을 띄워 무적함대의 진을 흩뜨렸다.' + (c.fire === 'big' ? ' (화약·타르 5,000닢)' : ''));
    var spec = calaisSpec(); if (G.Rel) { G.Rel.register(spec); await G.Rel.greatBattle(spec); }
    if (G.Game.state && G.Game.state.rel && G.Game.state.rel.battle && G.Game.state.rel.battle.calais === 'declined') { c.stage = 'declined'; st().armada = 'calais'; }
  }
  // ================================================================ 왕궁: 런던 · 로마
  function hookCourt() {
    var CT = G.Court; if (!CT || CT._tudor) return; CT._tudor = true;
    var onEnter = CT.onEnter;
    CT.onEnter = async function (sp) {
      var t = st(), s = S();
      if (sp && sp.id === 'en_king' && t) {
        try {
          var h = holder() || '';
          if (/헨리 8세/.test(h) && t.div.stage === 0 && s.date.y >= K.divY[0] && s.date.y <= K.divY[1] && TD.friend()) await henryAsk();
          else if (/헨리 8세/.test(h) && t.div.stage === 2) await henryBreak();
          else if (elizQueen() && t.eliz.stage === 2 && !t.knight) { await knight(); return; }
          else if (TD.calaisDue(sp)) { await calaisCall(); return; }   // 칼레 해전의 부름 (1588)   // 서임 뒤에 「그대가 포르투갈의 ○○인가」 왕명 인사가 이어지지 않게 — 왕명은 메뉴에서
        } catch (e) { console.error(e); }
      }
      return onEnter.apply(this, arguments);
    };
    var items = CT.palaceItems;
    CT.palaceItems = function (sp) {
      var out = items.apply(this, arguments) || [], t = st();
      if (sp && sp.id === 'it_pope' && t && t.div.stage === 1) out = out.concat([{ label: '잉글랜드 국왕의 특사를 모시고 알현한다', icon: 'scroll', sub: '헨리 8세의 혼인 무효 청원', onClick: function () { return popeAnswer(sp); } }]);
      return out;
    };
  }
  hookTower(); hookCourt();

  /** 수첩 줄 (계약·의뢰 쪽) */
  TD.html = function () {
    var t = S() && S().tudor; if (!t) return '';
    var out = [];
    if (t.div && t.div.stage === 1) out.push('헨리 8세의 특사를 로마 교황궁으로 (기한 ' + U.fmtDate({ y: Math.floor(t.div.due / 10000), m: Math.floor(t.div.due / 100) % 100, d: t.div.due % 100 }) + ')');
    if (t.div && t.div.stage === 2) out.push('교황의 답을 런던의 헨리 8세에게 아뢴다');
    if (t.eliz && t.eliz.stage === 1) out.push('엘리자베스 공주를 ' + G.CITY_DATA[t.eliz.dest].name + U.jx(G.CITY_DATA[t.eliz.dest].name, '으로/로') + ' 피신시킨다 (기한 ' + U.fmtDate({ y: Math.floor(t.eliz.due / 10000), m: Math.floor(t.eliz.due / 100) % 100, d: t.eliz.due % 100 }) + ')');
    if (t.eliz && t.eliz.stage === 2 && !t.knight) out.push('엘리자베스가 여왕이 되면 런던 왕궁으로 찾아간다');
    var rd = raidOf(t.drake);
    if (rd) out.push('드레이크의 습격 ' + t.drake.call + '/3 — ' + rd.where + '에서 드레이크와 만나 ' + rd.foeLabel + U.jx(rd.foeLabel, '을/를') + ' 친다');
    if (t.calais && t.calais.stage === 'call') out.push('1588년 7월 20일 ~ 8월 15일, 칼레 앞바다(도버 해협 동쪽)에서 하워드 경과 함께 무적함대에 맞선다');
    if (t.armada === 'call') out.push('도버 해협·영국 해협에서 드레이크와 만나 무적함대 열두 척에 맞선다');
    return out.length ? '<div class="sep"></div><h4 style="margin:0 0 8px">튜더 왕실의 일</h4><ul>' + out.map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ul>' : '';
  };
})(window.G = window.G || {});
