/* 메디치 은행의 위기 (G.Medici) — 2026-10-21 사용자 요청
   ■ 언제: 로렌초 데 메디치(메디치 가 당주 it_medici, 1492년 4월 8일까지)와 계약해 처음 보고를 마치면, 그 자리에서 로렌초가 털어놓는다.
   ■ 흐름 (state.medici.stage)
     1 빚쟁이 셋에게서 빚을 받는다 — 바르셀로나·르완다(앙골라)·파리. 로렌초가 알려 준 이름을 그 도시 술집에서 물어 찾는다.
       빚쟁이는 피렌체 본점 앞으로 환어음을 써 준다(제독이 돈을 들고 다니지 않는다).
     2 셋을 다 받으면 피렌체에서 파발이 온다 — 넷째 빚쟁이는 잉글랜드 국왕. 런던 왕궁에서 빚을 청하면 국왕이 기사를 내보낸다(일기토).
       이기면 국왕이 「이렇게까지 하는데 빚을 갚지 않는 것은 명예롭지 않다」며 20만 두카트(금화 200,000닢)를 내준다. 지면 물러났다가 다시 청할 수 있다.
     3 20만 두카트를 피렌체의 로렌초에게 전한다 → 사례 3만 두카트, 보티첼리와 딸 루크레치아를 동료로 소개한다.
   ■ 기한: 이야기를 들은 날부터 2년. 로렌초는 1492년 4월 8일에 세상을 떠나므로 그 전이 더 빠르면 그날까지.
     넘기면 메디치 은행이 무너졌다는 소식으로 끝나고 악명 +50.
   ■ 저장: state.medici = { stage, start, due, got: {debtor id: 1}, kingTry, end: 'done'|'fail' }. 없으면 아직 일어나지 않은 것.
   ■ 끼어드는 곳: 계약 보고(G.Sponsor.report를 감싼다) · 술집 메뉴(C.B.tavern.menu) · 왕궁 메뉴(C.B.palace.menu) · 하루(js/systems/world.js) · 도시 할 일(js/scenes/city.js) */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI;
  var M = {};
  G.Medici = M;
  function S() { return G.Game && G.Game.state; }
  function SP() { return G.Sponsor; }
  function C() { return G.Scenes.city; }

  var CFG = {
    sponsor: 'it_medici', king: 'en_king', florence: 30, london: 38,
    lorenzo: '로렌초 데 메디치', death: 14920408,      // 1492년 4월 8일
    years: 2, sum: 200000, reward: 30000, notoriety: 50, retry: 7
  };
  M.CFG = CFG;

  // 빚쟁이 셋 (지어낸 사람들) — city: 그 도시 술집에서 묻는다
  var DEBTORS = [
    { id: 'calds', city: 12, name: '하우메 칼데스', role: 'merchant', what: '모직물 상인', bill: 18000,
      ask: '하우메 칼데스라는 모직물 상인을 찾고 있소.',
      keeper: '칼데스? 피렌체 모직물을 외상으로 들여다 팔던 사람이지. 요즘은 빚쟁이를 피해 부두 창고 뒤 선술집에만 붙어 있다오. 저기 구석, 모자를 깊이 눌러쓴 사내요.',
      lines: ['메디치 은행에서 왔다고? …에이, 하필 이럴 때.', '피렌체 모직물 값을 다 치르지 못한 건 맞소. 바다에서 배 두 척이 가라앉는 바람에 셈이 꼬였지.\f좋소, 도망치는 것도 지쳤소. 피렌체 본점 앞으로 환어음을 써 주리다. 로렌초 나리께 칼데스가 끝까지 갚았다고 전해 주시오.'] },
    { id: 'sousa', city: 100, name: '페루 드 소자', role: 'merchant', what: '상아·구리 상인', bill: 12000,
      ask: '페루 드 소자라는 포르투갈 상인을 찾고 있소.',
      keeper: '소자 나리라면 콩고 임금님께 구리 팔찌를 대던 양반이오. 강가에서 상아를 다는 저울 앞에 늘 앉아 있지. 지금은 이 안쪽 탁자에서 술을 마시고 있소만.',
      lines: ['피렌체? 그 먼 데서 이 적도 아래까지 빚을 받으러 왔다고? 메디치 사람들 지독하군.', '…농담이오. 상아 배를 띄울 돈을 메디치 리스본 지점에서 빌렸지. 배는 돌아왔는데 내가 갚는 걸 잊었구려.\f여기 환어음이오. 리스본을 거쳐 피렌체로 가면 돈이 될 거요. 다음에 또 빌려 달라고 전해 주시오, 하하.'] },
    { id: 'launay', city: 14, name: '장 드 로네', role: 'merchant', what: '왕실 금은세공인', bill: 25000,
      ask: '장 드 로네라는 금은세공인을 찾고 있소.',
      keeper: '로네 영감 말이오? 왕실 잔치 그릇을 만들던 금은세공인인데, 왕실이 값을 안 줘서 자기도 빚더미에 앉았다더군. 저기 난롯가에서 혼자 투덜대는 사람이오.',
      lines: ['메디치 은행! 왔구먼, 결국. 금을 사느라 빌린 돈 말이지?', '왕실 금고지기가 그릇값을 반년째 안 주는데 나더러 어쩌라는 거요. …허나 메디치 은행이 무너지면 이 파리의 상인들도 다 같이 무너지지.\f좋소, 집을 잡히고서라도 갚으리다. 피렌체 본점 앞 환어음이오. 로렌초 나리 같은 분이 계셔야 우리 같은 장인도 금을 살 수 있소.'] }
  ];
  M.DEBTORS = DEBTORS;

  var L = {
    plea: [
      '보고 잘 들었네. 덕분에 모처럼 웃었어.\f…그런데 제독, 그대를 믿고 털어놓을 이야기가 하나 있네. 문을 닫아 주게.',
      '우리 메디치 은행이 지금 무너지기 직전일세. 런던과 브뤼헤 지점은 왕들에게 빌려준 돈을 받지 못해 벌써 문을 닫았고, 파치 가의 음모 뒤로 교황청과의 거래도 끊겼지.\f피렌체 사람들은 아직 모르네. 알게 되는 날, 이 도시의 돈줄이 한꺼번에 막혀.',
      '그래서 그대에게 부탁하네. 각국에 흩어진 빚쟁이들에게서 돈을 받아 주게.\f바르셀로나의 모직물 상인 하우메 칼데스, 앙골라 해안 르완다의 상아 상인 페루 드 소자, 파리의 금은세공인 장 드 로네. 그 고장 술집에서 이름을 대면 찾을 수 있을 걸세.',
      '그들은 피렌체 본점 앞으로 환어음을 써 줄 테니 돈을 들고 다닐 걱정은 없네. {due}까지는 끝내야 하네. 그 뒤로는 은행이 버티지 못해.'],
    ask: '로렌초의 부탁을 들어줄까?',
    yes: '「맡겨 주십시오.」',
    no: '「지금은 다른 일이 바쁩니다.」',
    yesSay: '고맙네, 제독. 이 일은 피렌체의 은행가로서가 아니라 한 가문의 가장으로서 부탁하는 걸세.',
    noSay: '…그런가. 마음이 바뀌면 언제든 다시 오게. 다만 오래 기다릴 수는 없네.',
    collected: '{name}의 환어음을 받았다 — 메디치 은행의 빚 {left}',
    letter: [
      '(피렌체에서 파발이 왔다. 로렌초의 봉인이 찍힌 편지다)',
      '제독, 세 사람의 환어음이 모두 본점에 닿았네. 그대 덕에 은행이 한숨 돌렸어.\f허나 아직 가장 큰 빚이 남았네. 넷째 빚쟁이는 잉글랜드의 국왕일세. 잉글랜드 왕실이 장미 전쟁 때 군비로 빌려 간 돈이 이자까지 20만 두카트야. 그 빚 때문에 런던 지점이 문을 닫았지.',
      '왕에게 빚을 받으러 가는 일이니 목숨을 걸어야 할지도 모르네. 런던 왕궁으로 가 주게. 받은 돈은 피렌체로 직접 가져다주게.'],
    kingAsk: '피렌체의 메디치 은행이 보냈다고? 잉글랜드 왕실이 진 빚을 받으러?\f…잉글랜드 왕이 은행가의 장부에 매일 줄 아는가. 썩 물러가라. 그래도 버틴다면, 내 기사가 그대를 내보낼 것이다.',
    knight: '전하의 명이오. 칼을 뽑으시오, 이방인. 피렌체 고리대금업자의 심부름꾼에게 잉글랜드 기사의 칼맛을 보여 주겠소.',
    choose: '왕의 기사가 칼을 뽑았다. 어떻게 할까?',
    fight: '맞서 싸운다',
    leave: '물러난다',
    kingWin: '…그만. 칼을 거두어라.\f메디치의 심부름꾼이 바다를 건너와 왕궁 한복판에서 목숨까지 걸었다. 이렇게까지 하는데 빚을 갚지 않는 것은 왕의 명예가 아니다.\f재무관, 20만 두카트를 내주어라. 그리고 로렌초에게 전하라 — 잉글랜드는 빚을 잊지 않았다고.',
    kingLose: '보아라, 이것이 잉글랜드의 대답이다. 피렌체로 돌아가라.\f…그래도 다시 오겠다면 말리지는 않겠다. 그대 같은 고집쟁이는 처음 보는군.',
    kingLeft: '현명한 판단이다. 잉글랜드에서 돈을 받으려거든 칼부터 갈고 오라.',
    deliver: '20만 두카트를 전한다',
    deliverShort: '금화 {sum}닢이 있어야 전할 수 있다 (지금 {gold}닢)',
    thanks: [
      '…20만 두카트. 잉글랜드 왕에게서 정말로 받아 왔단 말인가!\f(로렌초가 금화 상자 앞에서 한참을 말없이 서 있다)',
      '그대가 이 집안을, 이 도시를 살렸네. 이것은 사례일세. 3만 두카트 — 그대가 걸었던 목숨에 비하면 적지만.',
      '그리고 그대에게 내 곁의 두 사람을 소개하고 싶네. 내 집에서 자란 화가 산드로, 그리고 내 맏딸 루크레치아일세.'],
    botticelli: '로렌초 나리의 은인이시군요. 바다 끝까지 가는 배라면 저도 그려 보고 싶은 것이 많습니다 — 「비너스의 탄생」의 바다를 실제로 보고 싶었거든요.',
    lucrezia: '아버지의 은행을 지켜 주신 분이라고요. 저는 아버지 곁에서 장부와 편지를 배웠어요. 셈이라면 뱃사람들보다 밝을 거예요.\f아버지, 저도 이분의 배를 타 보고 싶어요.',
    lorenzoEnd: '그 아이를 잘 부탁하네, 제독. 피렌체의 문은 언제나 그대에게 열려 있을 걸세.',
    failNews: '피렌체에서 흉한 소식이 왔다 — 빚을 거두지 못한 메디치 은행이 끝내 무너졌다. 지점들이 문을 닫고, 피렌체의 상인들이 줄줄이 파산했다. 「메디치의 돈을 들고 사라진 뱃사람」이라는 소문이 항구마다 돈다. (악명 +{noto})',
    deathNews: '피렌체에서 부고가 왔다 — 로렌초 데 메디치가 세상을 떠났다. 빚을 다 거두지 못한 메디치 은행은 그를 따라 무너졌고, 사람들은 그 돈을 들고 사라진 뱃사람을 손가락질한다. (악명 +{noto})',
    remind: '메디치 은행의 빚을 거둘 기한이 반년 남았다 — {left}'
  };
  M.LINES = L;

  // 로렌초의 딸 루크레치아 (1470~1553) — 술집에는 나오지 않고 이 이야기에서만 동료가 된다
  var LUCREZIA = { id: 'lucrezia_medici', name: '루크레치아 데 메디치', g: 'f', st: [42, 80, 30, 88], sk: { speech: 2, acct: 2, hist: 1, music: 1 }, lg: { 2: 3, 0: 1 }, fame: 0, wage: 150, y: [1470, 1553], reg: [],
    style: 'it', tone: 'noble', face: 'portraits/street-folk/noble_youth_it', halfKey: 'portraits/street-folk/noble_youth_it_half',
    desc: '로렌초 데 메디치의 맏딸. 아버지 곁에서 은행의 장부와 각국 지점의 편지를 읽으며 자랐다. 셈이 밝고 말씨가 부드러워, 깐깐한 상인도 그녀 앞에서는 값을 깎아 준다.' };
  if (G.MATES && G.MATE && !G.MATE[LUCREZIA.id]) { G.MATES.push(LUCREZIA); G.MATE[LUCREZIA.id] = LUCREZIA; }

  // ---------------------------------------------------------------- 상태
  M.st = function () { var s = S(); return s && s.medici ? s.medici : null; };
  M.active = function () { var m = M.st(); return !!m && !m.end && m.stage >= 1; };
  function today() { return U.dateNum(S().date); }
  function lorenzoHere() {
    var sp = G.SPONSOR[CFG.sponsor]; if (!sp || !S()) return false;
    return today() < CFG.death && SP().holderName(sp) === CFG.lorenzo;
  }
  function lorenzo() { return SP().speaker(G.SPONSOR[CFG.sponsor]); }
  function fmtDue(n) { var y = Math.floor(n / 10000), m = Math.floor(n / 100) % 100, d = n % 100; return y + '년 ' + m + '월 ' + d + '일'; }
  function left() { var m = M.st(), n = DEBTORS.filter(function (d) { return !m.got[d.id]; }).length; return n ? '남은 빚쟁이 ' + n + '명' : '셋 모두 받았다'; }
  function fill(t, o) { return String(t).replace(/\{(\w+)\}/g, function (a, k) { return o && o[k] != null ? o[k] : a; }); }
  async function say(lines, who, o) { lines = [].concat(lines); for (var i = 0; i < lines.length; i++) await UI.say(fill(lines[i], o), who); }

  // ---------------------------------------------------------------- 시작: 로렌초에게 처음 보고를 마친 뒤
  async function afterReport(sp) {
    var s = S(); if (!s || !sp || sp.id !== CFG.sponsor || s.medici || !lorenzoHere()) return;
    if (G.Tutorial && G.Tutorial.active && G.Tutorial.active()) return;
    if ((SP().rel(sp.id).done || 0) < 1) return;
    var due = Math.min(U.dateNum(U.addDays(s.date, Math.round(CFG.years * 365))), CFG.death);
    var who = lorenzo();
    await say(L.plea, who, { due: fmtDue(due) });
    var v = await UI.ask(L.ask, [{ label: L.yes, value: 1 }, { label: L.no, value: 0 }], who);
    if (!v) { s.medici = { stage: 0, asked: today() }; await UI.say(L.noSay, who); return; }
    start(due);
    await UI.say(L.yesSay, who);
  }
  function start(due) {
    var s = S();
    s.medici = { stage: 1, start: today(), due: due, got: {}, kingTry: 0 };
    G.State.log('로렌초 데 메디치의 부탁을 받았다 — 메디치 은행의 빚을 거둔다 (기한 ' + fmtDue(due) + ')');
    UI.toast('메디치 은행의 빚을 거둔다 — 바르셀로나·르완다·파리의 술집에서 빚쟁이를 찾자', 'scroll', 6000);
  }
  /** 거절했던 부탁을 다시 꺼낸다 (피렌체 왕궁 메뉴) */
  async function askAgain() {
    var s = S(), m = M.st(); if (!m || m.stage !== 0 || !lorenzoHere()) return;
    var due = Math.min(U.dateNum(U.addDays(s.date, Math.round(CFG.years * 365))), CFG.death), who = lorenzo();
    await UI.say(L.plea[2], who); await UI.say(fill(L.plea[3], { due: fmtDue(due) }), who);
    var v = await UI.ask(L.ask, [{ label: L.yes, value: 1 }, { label: L.no, value: 0 }], who);
    if (!v) { await UI.say(L.noSay, who); return; }
    start(due); await UI.say(L.yesSay, who);
  }

  // ---------------------------------------------------------------- 1 빚쟁이 셋 (술집)
  function debtorAt(c) { var m = M.st(); if (!M.active() || m.stage !== 1 || !c) return null; return DEBTORS.filter(function (d) { return d.city === c.id && !m.got[d.id]; })[0] || null; }
  async function findDebtor(c) {
    var d = debtorAt(c), m = M.st(); if (!d) return;
    var CC = C();
    await CC.me(d.ask);
    await UI.say(d.keeper, CC.npc('tavernkeeper', '술집 주인'));
    var who = CC.npc(d.role, d.name);
    await say(d.lines, who);
    m.got[d.id] = 1;
    if (G.Audio) G.Audio.sfx('coin');
    G.State.log(d.name + '(' + G.CITY_DATA[d.city].name + ')에게서 메디치 은행 앞 환어음 ' + U.num(d.bill) + '두카트를 받았다.');
    UI.toast(fill(L.collected, { name: d.name, left: left() }), 'scroll', 4500);
    if (DEBTORS.every(function (x) { return m.got[x.id]; })) {
      m.stage = 2;
      await UI.say(L.letter[0], {});
      await say(L.letter.slice(1), lorenzo());
      G.State.log('로렌초의 편지 — 넷째 빚쟁이는 잉글랜드 국왕이다. 런던 왕궁으로.');
      UI.toast('넷째 빚쟁이는 잉글랜드 국왕 — 런던 왕궁으로 가자', 'crown', 5500);
    }
  }

  // ---------------------------------------------------------------- 2 잉글랜드 국왕 (런던 왕궁)
  function knight(c) {
    var CC = C(), sp = CC.npc('soldier', '윌리엄 애시퍼드 경');
    return { name: '윌리엄 애시퍼드 경', portrait: sp.portrait, look: 'rival', str: 82, atk: 13, def: 6, skill: 3, mar: 84, int: 60, cha: 55, style: 'slash' };
  }
  async function demandKing(c, sp) {
    var s = S(), m = M.st(); if (!m || m.stage !== 2) return;
    if (m.kingTry && U.dayIndex(s.date) < m.kingTry) { await UI.say('국왕은 오늘 그대를 만나 주지 않는다. 며칠 뒤에 다시 청해 보자.', {}); return; }
    var who = SP().speaker(sp);
    await UI.say(L.kingAsk, who);
    var kn = knight(c);
    await UI.say(L.knight, { name: kn.name, portrait: kn.portrait });
    var v = await UI.ask(L.choose, [{ label: L.fight, value: 1 }, { label: L.leave, value: 0 }], { name: s.player.name, portrait: s.player.portrait });
    if (!v) { await UI.say(L.kingLeft, who); return; }
    var res = await G.Games.duel(kn, { place: 'tavern' });
    if (res !== 'win') { m.kingTry = U.dayIndex(s.date) + CFG.retry; await UI.say(L.kingLose, who); return; }
    if (G.Fame) G.Fame.add('bt', 30);
    await UI.say(L.kingWin, who);
    s.player.gold += CFG.sum; m.stage = 3; m.paid = today();
    if (G.Audio) G.Audio.sfx('coin');
    G.Game.refreshHud();
    G.State.log(SP().holderName(sp) + '에게서 메디치 은행의 빚 20만 두카트를 받아 냈다. 피렌체의 로렌초에게 전해야 한다 (기한 ' + fmtDue(m.due) + ').');
    await UI.alert('잉글랜드 국왕이 메디치 은행의 빚을 갚았다.<br>금화 <b>' + U.num(CFG.sum) + '</b>닢(20만 두카트)을 받았다.<br><span class="muted">' + fmtDue(m.due) + '까지 피렌체의 로렌초 데 메디치에게 전해야 한다. 넘기면 악명 +' + CFG.notoriety + '</span>', '잉글랜드의 빚');
  }

  // ---------------------------------------------------------------- 3 피렌체로 (로렌초에게 전한다)
  async function deliver(c, sp) {
    var s = S(), m = M.st(); if (!m || m.stage !== 3) return;
    var who = SP().speaker(sp);
    if (s.player.gold < CFG.sum) { await UI.say(fill(L.deliverShort, { sum: U.num(CFG.sum), gold: U.num(s.player.gold) }), who); return; }
    s.player.gold -= CFG.sum;
    await say(L.thanks.slice(0, 2), who);
    s.player.gold += CFG.reward;
    if (G.Fame) G.Fame.add('so', 200);
    SP().addTrust(SP().rel(sp.id), 20);
    m.stage = 4; m.end = 'done'; m.done = today();
    if (G.Audio) G.Audio.sfx('coin');
    G.Game.refreshHud();
    G.State.log('로렌초 데 메디치에게 20만 두카트를 전해 메디치 은행을 살렸다. (사례 3만 두카트)');
    await UI.alert('메디치 은행을 살렸다!<br>사례 금화 <b>' + U.num(CFG.reward) + '</b>닢(3만 두카트) · 사교 명성 · 로렌초의 신뢰가 크게 올랐다.', '메디치 은행의 위기');
    await UI.say(L.thanks[2], who);
    await meet('botticelli', L.botticelli, c);
    await meet(LUCREZIA.id, L.lucrezia, c);
    await UI.say(L.lorenzoEnd, who);
  }
  /** 로렌초가 소개하는 사람 — 이미 부하이거나 떠나보냈으면 건너뛴다 */
  async function meet(id, line, c) {
    var s = S(), d = G.MATE[id]; if (!d || s.mates.some(function (x) { return x.id === id; })) return;
    var sp = { name: d.name, portrait: G.Art.mateSpec(id), half: G.Img.chain.mateHalf(id), lang: 3, special: true };
    await UI.say(line, sp);
    var ok = await UI.confirm(d.name + U.jx(d.name, '을/를') + ' 부하로 맞이하겠습니까? (월급 금화 ' + U.num(d.wage) + '닢)', '부하로 맞이한다', '다음에');
    if (ok && G.Legend && G.Legend.join) G.Legend.join(id, c);
  }

  // ---------------------------------------------------------------- 하루: 기한 · 로렌초의 죽음
  M.daily = function () {
    var s = S(), out = [], m = M.st(); if (!s || !m || m.end || m.stage < 1) return out;
    var t = today();
    if (t >= m.due) {
      var died = t >= CFG.death && m.due === CFG.death;
      m.end = 'fail'; m.failed = t;
      s.player.notoriety = (s.player.notoriety || 0) + CFG.notoriety;
      var msg = fill(died ? L.deathNews : L.failNews, { noto: CFG.notoriety });
      out.push({ icon: 'skull', text: msg, history: true });
      G.State.log(msg);
      return out;
    }
    if (!m.reminded && U.dateNum(U.addDays(s.date, 182)) >= m.due) {
      m.reminded = 1;
      out.push({ icon: 'scroll', text: fill(L.remind, { left: m.stage === 1 ? left() : m.stage === 2 ? '잉글랜드 국왕이 남았다' : '피렌체에 20만 두카트를 전해야 한다' }) });
    }
    return out;
  };

  // ---------------------------------------------------------------- 도시 할 일 (js/scenes/city.js)
  M.todo = function (c) {
    var m = M.st(), out = []; if (!M.active() || !c) return out;
    if (m.stage === 1 && debtorAt(c)) out.push({ kind: 'tavern', icon: 'coin', hot: true, text: '술집에서 ' + debtorAt(c).name + U.jx(debtorAt(c).name, '을/를') + ' 찾는다 (메디치 은행의 빚)' });
    if (m.stage === 2 && c.id === CFG.london) { var k = G.SPONSOR[CFG.king]; if (k) out.push({ kind: 'palace', arg: G.R.bldArg(k), icon: 'crown', hot: true, text: '왕궁에서 잉글랜드 국왕에게 메디치 은행의 빚을 청한다' }); }
    if (m.stage === 3 && c.id === CFG.florence) { var f = G.SPONSOR[CFG.sponsor]; if (f) out.push({ kind: f.bld, arg: G.R.bldArg(f), icon: 'coin', hot: true, text: '로렌초 데 메디치에게 20만 두카트를 전한다' }); }
    return out;
  };
  /** 수첩·알림에 쓰는 한 줄 */
  M.note = function () {
    var m = M.st(); if (!M.active()) return '';
    return (m.stage === 1 ? '빚쟁이를 찾는다 — ' + DEBTORS.filter(function (d) { return !m.got[d.id]; }).map(function (d) { return G.CITY_DATA[d.city].name + '의 ' + d.name; }).join(' · ')
      : m.stage === 2 ? '런던 왕궁의 잉글랜드 국왕에게 빚을 받는다' : '피렌체의 로렌초에게 20만 두카트를 전한다') + ' (기한 ' + fmtDue(m.due) + ')';
  };

  // ---------------------------------------------------------------- 원래 기능 감싸기
  function wrap(obj, key, fn) { var f = obj && obj[key]; if (typeof f !== 'function' || f._medici) return; obj[key] = fn(f); obj[key]._medici = true; }
  M.install = function () {
    var CC = C(); if (!CC || !CC.B || M._inst) return;
    M._inst = true;
    // 계약한 일을 보고해 마친 뒤 (계약 없는 늦은 보고·묶음 보고는 세지 않는다)
    wrap(SP(), 'report', function (orig) {
      return async function (sp) {
        var n0 = sp ? SP().rel(sp.id).done || 0 : 0;
        var r = await orig.apply(this, arguments);
        try { if (sp && (SP().rel(sp.id).done || 0) > n0) await afterReport(sp); } catch (e) { console.error(e); }
        return r;
      };
    });
    // 술집: 빚쟁이를 수소문한다
    wrap(CC.B.tavern, 'menu', function (orig) {
      return function (c) {
        var list = orig.apply(this, arguments) || [], d = debtorAt(c);
        if (d) {
          var item = { label: '빚쟁이를 수소문한다', icon: 'coin', sub: d.name + ' · 메디치 은행', onClick: function () { return findDebtor(c); } };
          var ex = list.length && list[list.length - 1] && list[list.length - 1].exit ? list.length - 1 : list.length;
          list.splice(ex, 0, item);
        }
        return list;
      };
    });
    // 왕궁: 잉글랜드 국왕에게 빚을 청한다 · 로렌초에게 전한다 · 거절했던 부탁을 다시
    wrap(CC.B.palace, 'menu', function (orig) {
      return function (c, arg) {
        var list = orig.apply(this, arguments) || [], B = CC.B.palace, sp = B.sp ? B.sp(c, arg) : null, m = M.st();
        if (!sp || !m) return list;
        if (sp.id === CFG.king && m.stage === 2 && !m.end) list.push({ label: '메디치 은행의 빚을 청한다', icon: 'coin', sub: '20만 두카트', onClick: function () { return demandKing(c, sp); } });
        if (sp.id === CFG.sponsor && m.stage === 3 && !m.end) list.push({ label: L.deliver, icon: 'coin', sub: '사례 3만 두카트', onClick: function () { return deliver(c, sp); } });
        if (sp.id === CFG.sponsor && m.stage === 0 && !m.end && lorenzoHere()) list.push({ label: '은행의 빚 이야기', icon: 'scroll', onClick: function () { return askAgain(); } });
        return list;
      };
    });
  };
  M._t = { afterReport: afterReport, findDebtor: findDebtor, demandKing: demandKing, deliver: deliver, start: start };   // 시험용
  // 도시 건물 스크립트(js/city/*.js)와 후원자(js/systems/sponsor.js)는 이 파일보다 먼저 읽힌다
  M.install();
})(window.G = window.G || {});
