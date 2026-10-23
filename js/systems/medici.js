/* 메디치 은행의 위기 (G.Medici) — 2026-10-21 사용자 요청 · 2026-10-22 루크레치아의 몫을 크게 늘림
   ■ 언제: 로렌초 데 메디치(메디치 가 당주 it_medici, 1492년 4월 8일까지)와 계약해 처음 보고를 마치면, 그 자리에서 로렌초가 털어놓는다.
   ■ 흐름 (state.medici.stage)
     1 빚쟁이 셋에게서 빚을 받는다 — 바르셀로나·르완다(앙골라)·파리. 로렌초가 알려 준 이름을 그 도시 술집에서 물어 찾는다.
       빚쟁이는 피렌체 본점 앞으로 환어음을 써 준다(제독이 돈을 들고 다니지 않는다).
     2 셋을 다 받으면 피렌체에서 파발이 온다 — 넷째 빚쟁이는 잉글랜드 국왕. 런던 왕궁에서 빚을 청하면 국왕이 기사를 내보낸다(일기토).
       이기면 국왕이 「이렇게까지 하는데 빚을 갚지 않는 것은 명예롭지 않다」며 20만 두카트(금화 200,000닢)를 내준다. 지면 물러났다가 다시 청할 수 있다.
     3 20만 두카트를 피렌체의 로렌초에게 전한다 → 사례 3만 두카트, 보티첼리와 딸 루크레치아를 동료로 소개한다.
   ■ 루크레치아 (로렌초의 맏딸, 은행 장부를 맡는다) — 이야기 내내 함께한다
     · 시작: 아버지의 고백 자리에 장부를 들고 들어와, 빚쟁이 셋의 사정을 적은 「장부 쪽지」를 건넨다.
     · 빚쟁이마다: 핑계를 대면 「루크레치아의 쪽지를 읽어 준다」(제 값을 다 받는다 · luc+1) 또는 「사정을 들어 준다」(이자를 깎아 준다 · kind+1).
     · 빚을 하나 받을 때마다 그녀의 편지가 온다(고른 길에 따라 말이 다르다). 셋째 뒤의 큰 편지는 통풍으로 앓아누운 아버지 대신 그녀가 쓴다.
     · 피렌체 왕궁 「루크레치아와 장부를 맞춘다」: 1단계에 처음 들르면 여비(금화 5,000닢), 2단계에는 잉글랜드 기사를 이기는 법(찌르기)과
       잉글랜드 왕비에게 먼저 보낸 편지 이야기(hint). 런던에서 일기토 앞에 그 말을 떠올리고, 지면 위로 편지가 온다.
     · 국왕은 이긴 뒤 그녀의 편지를 읽었다고 말한다(hint가 있으면). 피렌체에서 돈을 함께 세고, 동료가 될 때의 말이 luc/kind에 따라 달라진다.
     · 기한 반년 전 알림과 실패 소식에도 그녀의 편지가 붙는다.
   ■ 기한: 이야기를 들은 날부터 2년. 로렌초는 1492년 4월 8일에 세상을 떠나므로 그 전이 더 빠르면 그날까지.
     넘기면 메디치 은행이 무너졌다는 소식으로 끝나고 악명 +50.
   ■ 저장: state.medici = { stage, start, due, got: {debtor id: 'note'|'kind'}, luc, kind, visit: {단계: 1}, hint, kingTry, end: 'done'|'fail' }.
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
    years: 2, sum: 200000, reward: 30000, notoriety: 50, retry: 7, purse: 5000
  };
  M.CFG = CFG;

  // 빚쟁이 셋 (지어낸 사람들) — city: 그 도시 술집에서 묻는다
  //   excuse: 핑계 · note: 루크레치아의 쪽지 · noteAns: 쪽지를 들은 대답(제 값) · kindAns: 사정을 들어 준 대답(이자를 깎는다)
  var DEBTORS = [
    { id: 'calds', city: 12, name: '하우메 칼데스', role: 'merchant', face: 'portraits/medici/calds', what: '모직물 상인', bill: 18000, cut: 4000,
      ask: '하우메 칼데스라는 모직물 상인을 찾고 있소.',
      keeper: '칼데스? 피렌체 모직물을 외상으로 들여다 팔던 사람이지. 요즘은 빚쟁이를 피해 부두 창고 뒤 선술집에만 붙어 있다오. 저기 구석, 모자를 깊이 눌러쓴 사내요.',
      excuse: '메디치 은행에서 왔다고? …에이, 하필 이럴 때.\f피렌체 모직물 값을 다 치르지 못한 건 맞소. 허나 바다에서 배 두 척이 가라앉았소. 가라앉은 배에서 무슨 돈이 나오겠소?',
      memo: '바르셀로나 · 하우메 칼데스 — 『배가 가라앉았다』고 할 것. 그 배 두 척은 바르셀로나 해사 영사관에 해상 보험을 들어 두었음. 보험금은 지난봄에 나왔음.',
      noteAns: '…해사 영사관의 보험 장부까지? 피렌체에서 그걸 어떻게 안단 말이오.\f루크레치아? 로렌초 나리의 따님이? 허, 그 아가씨 무섭군. 알았소, 알았소. 보험금으로 제 값을 다 갚으리다. 본점 앞 환어음이오.',
      kindAns: '…사정을 들어 주겠다고? 빚쟁이가 그런 말을 하는 건 처음 듣소.\f좋소, 도망치는 것도 지쳤소. 원금은 다 갚으리다. 이자를 덜어 준 은혜는 잊지 않겠소. 로렌초 나리께 칼데스가 끝까지 갚았다고 전해 주시오.' },
    { id: 'sousa', city: 100, name: '페루 드 소자', role: 'merchant', face: 'portraits/medici/sousa', what: '상아·구리 상인', bill: 12000, cut: 3000,
      ask: '페루 드 소자라는 포르투갈 상인을 찾고 있소.',
      keeper: '소자 나리라면 콩고 임금님께 구리 팔찌를 대던 양반이오. 강가에서 상아를 다는 저울 앞에 늘 앉아 있지. 지금은 이 안쪽 탁자에서 술을 마시고 있소만.',
      excuse: '피렌체? 그 먼 데서 이 적도 아래까지 빚을 받으러 왔다고? 메디치 사람들 지독하군.\f허나 헛걸음이오. 그 돈은 리스본 지점에 벌써 갚았소. 영수증? 그런 건 바다에 두고 왔지, 하하.',
      memo: '르완다 · 페루 드 소자 — 『리스본 지점에 갚았다』고 할 것. 리스본 지점 장부에 소자의 상환 기록 없음. 지점장 편지: 소자는 지난해 상아 배 세 척을 무사히 들여왔음.',
      noteAns: '…리스본 지점장의 편지에, 내 상아 배 숫자까지?\f피렌체 본점에 그런 걸 다 꿰는 사람이 있다니. 로렌초 나리의 따님이라고? 허허, 메디치 가는 딸까지 지독하군. 좋소, 한 푼도 빼지 않고 갚으리다.',
      kindAns: '…농담을 농담으로 받아 주는구려. 상아 값이 떨어져서 정말 빠듯했소.\f여기 환어음이오. 이자만 좀 덜었으니 리스본을 거쳐 피렌체로 가면 돈이 될 거요. 다음에 또 빌려 달라고 전해 주시오.' },
    { id: 'launay', city: 14, name: '장 드 로네', role: 'merchant', face: 'portraits/medici/launay', what: '왕실 금은세공인', bill: 25000, cut: 6000,
      ask: '장 드 로네라는 금은세공인을 찾고 있소.',
      keeper: '로네 영감 말이오? 왕실 잔치 그릇을 만들던 금은세공인인데, 왕실이 값을 안 줘서 자기도 빚더미에 앉았다더군. 저기 난롯가에서 혼자 투덜대는 사람이오.',
      excuse: '메디치 은행! 왔구먼, 결국. 금을 사느라 빌린 돈 말이지?\f왕실 금고지기가 그릇값을 반년째 안 주는데 나더러 어쩌라는 거요. 집을 팔아도 모자라오.',
      memo: '파리 · 장 드 로네 — 정말 어려운 사람. 왕실 그릇값 증서를 메디치 리옹 지점이 대신 받아 주겠다고 할 것. 그 증서를 담보로 잡으면 로네는 집을 잃지 않고 갚을 수 있음.',
      noteAns: '…왕실 증서를 리옹 지점이 대신 받아 준다고? 그러면 내 집은…?\f(로네가 쪽지를 몇 번이고 다시 읽는다)\f그 아가씨가 이 늙은이 집까지 걱정해 주었단 말이오. 고맙소, 정말 고맙소. 증서를 맡기고 제 값을 다 갚으리다. 로렌초 나리 같은 분이 계셔야 우리 같은 장인도 금을 살 수 있소.',
      kindAns: '…이자를 덜어 주겠다고? 메디치 은행이 무너지면 이 파리의 상인들도 다 같이 무너지는데, 그 와중에 말이오?\f좋소, 집을 잡히고서라도 원금은 갚으리다. 피렌체 본점 앞 환어음이오.' }
  ];
  M.DEBTORS = DEBTORS;

  var L = {
    plea: [
      '보고 잘 들었네. 덕분에 모처럼 웃었어.\f…그런데 제독, 그대를 믿고 털어놓을 이야기가 하나 있네. 문을 닫아 주게.',
      '우리 메디치 은행이 지금 무너지기 직전일세. 런던과 브뤼헤 지점은 왕들에게 빌려준 돈을 받지 못해 벌써 문을 닫았고, 파치 가의 음모 뒤로 교황청과의 거래도 끊겼지.\f피렌체 사람들은 아직 모르네. 알게 되는 날, 이 도시의 돈줄이 한꺼번에 막혀.'],
    lucIn: '(문이 조용히 열리고, 두꺼운 장부를 품에 안은 젊은 여인이 들어온다)',
    lucHi: '아버지, 각 지점에서 온 장부를 다 맞춰 봤어요. …어머, 손님이 계신 줄 몰랐어요.',
    lorIntro: '괜찮다, 들어오너라. 제독, 내 맏딸 루크레치아일세. 은행 장부는 이제 이 아이가 나보다 밝다네.\f루크레치아, 이분께 우리 사정을 말씀드렸다. 빚쟁이들 이야기를 해 드리거라.',
    lucDebtors: [
      '처음 뵙겠어요, 제독님. 루크레치아 데 메디치예요.\f아버지가 받아야 할 돈 가운데 가장 급한 건 세 사람이에요. 바르셀로나의 모직물 상인 하우메 칼데스, 앙골라 해안 르완다의 상아 상인 페루 드 소자, 파리의 금은세공인 장 드 로네.',
      '세 사람 다 그 고장 술집에서 이름을 대면 찾을 수 있을 거예요. 그리고 다들 그럴듯한 핑계를 댈 거예요.\f그래서 핑계마다 장부에서 찾은 것을 쪽지에 적어 두었어요. 막히면 읽어 주세요. …물론 정말 딱한 사람이면, 제독님 마음대로 하셔도 돼요.'],
    memoGet: '루크레치아의 「장부 쪽지」를 받았다 — 빚쟁이 셋의 핑계와 장부의 증거가 적혀 있다.',
    lorDue: '그들은 피렌체 본점 앞으로 환어음을 써 줄 테니 돈을 들고 다닐 걱정은 없네. {due}까지는 끝내야 하네. 그 뒤로는 은행이 버티지 못해.',
    ask: '로렌초의 부탁을 들어줄까?',
    yes: '「맡겨 주십시오.」',
    no: '「지금은 다른 일이 바쁩니다.」',
    yesSay: '고맙네, 제독. 이 일은 피렌체의 은행가로서가 아니라 한 가문의 가장으로서 부탁하는 걸세.',
    lucYes: '각 지점 파발에게 제독님 배를 찾아가라고 일러 둘게요. 어음이 본점에 닿을 때마다 편지를 드릴게요.\f피렌체에 들르시면 왕궁으로 오세요. 장부를 같이 맞춰 봐요.',
    noSay: '…그런가. 마음이 바뀌면 언제든 다시 오게. 다만 오래 기다릴 수는 없네.',
    lucNo: '(루크레치아가 장부를 꼭 끌어안은 채 고개를 숙인다)',
    collected: '{name}의 환어음을 받았다 — 메디치 은행의 빚 {left}',
    choose: '{name} 버틴다. 어떻게 할까?',
    useNote: '루크레치아의 쪽지를 읽어 준다',
    beKind: '사정을 들어 주고 이자를 덜어 준다',
    readNote: '(루크레치아의 쪽지를 펼쳐 읽어 준다)\f「{memo}」',
    // 빚을 하나 받을 때마다 오는 편지 — [쪽지로 받았을 때, 사정을 들어 줬을 때]
    post: '(가게를 나서는데 메디치 은행의 파발이 다가온다. 루크레치아의 편지다)',
    letters: {
      calds: ['칼데스 씨의 어음이 본점에 닿았어요! 보험 장부 이야기에 얼굴이 하얘졌다면서요? 그 모습을 못 본 게 아쉬워요.\f아버지가 오랜만에 웃으셨어요. 「그 아이 쪽지가 칼보다 낫구나」 하시면서요.',
        '칼데스 씨의 어음이 본점에 닿았어요. 이자를 덜어 주셨다고요.\f장부로는 손해지만, 칼데스 씨는 다음에도 메디치 은행과 거래할 거예요. 할아버지가 늘 말씀하셨대요 — 은행은 돈이 아니라 믿음을 빌려주는 곳이라고.'],
      sousa: ['소자 씨가 「메디치 가는 딸까지 지독하다」고 했다고요? 칭찬으로 들을게요.\f적도 아래까지 가 주셔서 고마워요. 열병 조심하세요. 배에 기나나무 껍질이 없으면 리스본 지점에 말해 두었어요.',
        '소자 씨에게 이자를 덜어 주셨다고요. 상아 값이 떨어진 건 장부로도 보였어요. 잘하셨어요.\f적도 아래까지 가 주셔서 고마워요. 열병 조심하세요.'],
      launay: null   // 셋째는 큰 편지로 (letter3)
    },
    letter3: [
      '(피렌체에서 파발이 왔다. 메디치 가의 봉인 아래, 낯익은 글씨다 — 루크레치아의 편지다)',
      '제독님, 세 사람의 어음이 모두 본점에 닿았어요. 은행이 한숨 돌렸어요.\f그런데 아버지가 통풍으로 다시 누우셨어요. 펜을 쥐지 못하셔서 제가 대신 적어요.',
      '아직 가장 큰 빚이 남았어요. 넷째 빚쟁이는 잉글랜드의 국왕이에요. 잉글랜드 왕실이 장미 전쟁 때 군비로 빌려 간 돈이 이자까지 20만 두카트예요. 그 빚 때문에 런던 지점이 문을 닫았어요.\f왕에게 빚을 받으러 가는 일이라, 목숨이 걸릴지도 몰라요. 런던으로 가시기 전에 피렌체에 한 번 들러 주세요. 드릴 말씀이 있어요.'],
    letter3Lor: '(편지 끝에 떨리는 글씨로 몇 줄이 덧붙어 있다)\f— 받은 돈은 피렌체로 직접 가져다주게. 내 딸이 그대를 많이 믿는 모양이네. 로렌초.',
    // 피렌체 왕궁 「루크레치아와 장부를 맞춘다」
    visit1: [
      '제독님! 와 주셨군요. 장부를 같이 봐요.\f{left}. 빚쟁이를 찾는 동안 배를 놀릴 수는 없죠.',
      '이건 아버지 몰래 드리는 거예요. 은행 금고에서가 아니라 제 몫에서 떼었으니 걱정 마세요. 바다에서는 늘 돈이 모자라잖아요.'],
    purse: '루크레치아에게서 여비 금화 {n}닢을 받았다.',
    visit1Again: '{left}. 쪽지는 잘 가지고 계시죠? 핑계가 막히면 꼭 읽어 주세요.',
    visit2: [
      '제독님, 편지 받으셨군요. 아버지는 안쪽 방에서 쉬고 계세요.\f…잉글랜드 왕은 빚을 순순히 갚지 않을 거예요. 런던 지점장이 남긴 편지를 다 읽어 봤는데, 빚 이야기만 나오면 왕은 기사를 내보낸대요.',
      '그 기사들은 무거운 칼로 크게 베는 걸 즐긴대요. 크게 베는 칼에는 찌르기로 받으세요. 지점장의 경호원이 그렇게 살아남았대요.\f그리고 잉글랜드 왕비께 제가 먼저 편지를 보내 두었어요. 왕비께서도 딸을 키우는 어머니시니까, 아버지를 걱정하는 딸의 편지를 그냥 버리지는 않으실 거예요.'],
    hintGet: '루크레치아의 조언 — 잉글랜드 기사는 크게 벤다. 찌르기로 받으면 된다.',
    visit2Again: '런던 왕궁의 기사는 크게 베어요. 찌르기로 받으세요. 몸조심하세요, 제독님.',
    visitNote: '루크레치아와 장부를 맞춘다',
    // 런던
    kingAsk: '피렌체의 메디치 은행이 보냈다고? 잉글랜드 왕실이 진 빚을 받으러?\f…잉글랜드 왕이 은행가의 장부에 매일 줄 아는가. 썩 물러가라. 그래도 버틴다면, 내 기사가 그대를 내보낼 것이다.',
    knight: '전하의 명이오. 칼을 뽑으시오, 이방인. 피렌체 고리대금업자의 심부름꾼에게 잉글랜드 기사의 칼맛을 보여 주겠소.',
    recall: '(루크레치아의 말이 떠오른다 — 「크게 베는 칼에는 찌르기로 받으세요」)',
    kchoose: '왕의 기사가 칼을 뽑았다. 어떻게 할까?',
    fight: '맞서 싸운다',
    leave: '물러난다',
    kingWin: '…그만. 칼을 거두어라.\f메디치의 심부름꾼이 바다를 건너와 왕궁 한복판에서 목숨까지 걸었다. 이렇게까지 하는데 빚을 갚지 않는 것은 왕의 명예가 아니다.',
    kingWinLuc: '…실은 왕비가 피렌체에서 온 편지 한 통을 내게 내밀었다. 앓아누운 아비를 걱정하는 딸의 글씨였지. 그 편지를 읽고도 칼로 답한 것이 부끄럽구나.',
    kingPay: '재무관, 20만 두카트를 내주어라. 그리고 로렌초에게 전하라 — 잉글랜드는 빚을 잊지 않았다고.',
    kingLose: '보아라, 이것이 잉글랜드의 대답이다. 피렌체로 돌아가라.\f…그래도 다시 오겠다면 말리지는 않겠다. 그대 같은 고집쟁이는 처음 보는군.',
    loseLetter: [
      '(며칠을 앓고 일어나니 머리맡에 편지 한 통이 놓여 있다. 루크레치아의 글씨다)',
      '런던 지점의 옛 직원이 소식을 전해 주었어요. 다치셨다고요.\f빚보다 제독님이 먼저예요. 아버지도 같은 말씀이세요. 그래도 다시 가시겠다면… 크게 베는 칼에는 찌르기예요. 잊지 마세요.'],
    kingLeft: '현명한 판단이다. 잉글랜드에서 돈을 받으려거든 칼부터 갈고 오라.',
    // 피렌체로
    deliver: '20만 두카트를 전한다',
    deliverShort: '금화 {sum}닢이 있어야 전할 수 있다 (지금 {gold}닢)',
    thanks: [
      '…20만 두카트. 잉글랜드 왕에게서 정말로 받아 왔단 말인가!\f(로렌초가 지팡이를 짚고 금화 상자 앞에서 한참을 말없이 서 있다)'],
    countAct: '(루크레치아가 소매를 걷고 금화를 열 닢씩 쌓아 세어 나간다)',
    count: '…십구만 구천 구백 아흔, 이십만. 아버지, 한 닢도 모자라지 않아요.',
    thanks2: '그대가 이 집안을, 이 도시를 살렸네. 이것은 사례일세. 3만 두카트 — 그대가 걸었던 목숨에 비하면 적지만.',
    intro: '그리고 그대에게 내 곁의 두 사람을 소개하고 싶네. 내 집에서 자란 화가 산드로, 그리고 이미 잘 아는 내 맏딸 루크레치아일세.',
    botticelli: '로렌초 나리의 은인이시군요. 바다 끝까지 가는 배라면 저도 그려 보고 싶은 것이 많습니다 — 「비너스의 탄생」의 바다를 실제로 보고 싶었거든요.',
    // 동료가 될 때 — 고른 길에 따라
    lucJoin: {
      note: '제 쪽지를 셋 다 읽어 주셨더군요. 칼데스 씨도, 소자 씨도, 로네 씨도 제 이름을 들먹이며 갚았대요.\f…장부 속 숫자가 바다 건너에서 정말로 사람을 움직이는 걸 보고 싶어졌어요. 아버지, 저도 이분의 배를 타고 싶어요.',
      kind: '제독님은 쪽지보다 사람의 사정을 먼저 들어 주셨지요. 장부로는 손해였지만, 그 사람들은 이제 메디치 은행을 욕하지 않아요.\f은행이 빌려주는 건 믿음이라는 걸 제독님한테 배웠어요. 아버지, 저도 이분의 배를 타고 싶어요.',
      mix: '어떤 사람에게는 제 쪽지를, 어떤 사람에게는 자비를 주셨더군요. 저라면 그렇게 고르지 못했을 거예요.\f장부 밖의 세상을 더 배우고 싶어요. 아버지, 저도 이분의 배를 타고 싶어요.'
    },
    lorLuc: '…허허, 말려도 들을 아이가 아니지. 제 어미를 닮았어.',
    lorenzoEnd: '그 아이를 잘 부탁하네, 제독. 피렌체의 문은 언제나 그대에게 열려 있을 걸세.',
    lorenzoEndStay: '언젠가 그 아이가 다시 청하거든 들어주게. 피렌체의 문은 언제나 그대에게 열려 있을 걸세.',
    failNews: '피렌체에서 흉한 소식이 왔다 — 빚을 거두지 못한 메디치 은행이 끝내 무너졌다. 지점들이 문을 닫고, 피렌체의 상인들이 줄줄이 파산했다. 「메디치의 돈을 들고 사라진 뱃사람」이라는 소문이 항구마다 돈다. (악명 +{noto})',
    deathNews: '피렌체에서 부고가 왔다 — 로렌초 데 메디치가 세상을 떠났다. 빚을 다 거두지 못한 메디치 은행은 그를 따라 무너졌고, 사람들은 그 돈을 들고 사라진 뱃사람을 손가락질한다. (악명 +{noto})',
    failLuc: '함께 온 짧은 편지 — 「장부를 덮었어요. 제독님을 원망하지는 않을게요. 다만 다시는 피렌체에 오지 마세요. 루크레치아.」',
    remind: '루크레치아의 편지 — 「아버지의 은행이 버틸 날이 반년 남았어요. {left}. 기다릴게요.」'
  };
  M.LINES = L;

  // 로렌초의 딸 루크레치아 (1470~1553) — 술집에는 나오지 않고 이 이야기에서만 동료가 된다
  var LUCREZIA = { id: 'lucrezia_medici', name: '루크레치아 데 메디치', g: 'f', st: [42, 80, 30, 88], sk: { speech: 2, acct: 2, hist: 1, music: 1 }, lg: { 2: 3, 0: 1 }, fame: 0, wage: 150, y: [1470, 1553], reg: [],
    style: 'it', tone: 'polite', face: 'portraits/medici/lucrezia_medici', halfKey: 'portraits/medici/lucrezia_medici_half',
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
  /** 루크레치아 — 마주 선 모습 / 편지 */
  function luc(emo) { var id = LUCREZIA.id; return { name: LUCREZIA.name, portrait: G.Art.mateSpec(id), half: G.Img.chain.mateHalf(id), lang: 3, special: true, emotion: emo || null }; }
  function lucLetter() { var o = luc(); o.name = '루크레치아의 편지'; return o; }
  function fmtDue(n) { var y = Math.floor(n / 10000), m = Math.floor(n / 100) % 100, d = n % 100; return y + '년 ' + m + '월 ' + d + '일'; }
  function left() { var m = M.st(), n = DEBTORS.filter(function (d) { return !m.got[d.id]; }).length; return n ? '남은 빚쟁이 ' + n + '명' : '셋 모두 받았다'; }
  function leftWho() { var m = M.st(), r = DEBTORS.filter(function (d) { return !m.got[d.id]; }); return r.length ? '남은 빚쟁이는 ' + r.map(function (d) { return G.CITY_DATA[d.city].name + '의 ' + d.name; }).join(', ') : '세 사람 다 받으셨어요'; }
  function fill(t, o) { return String(t).replace(/\{(\w+)\}/g, function (a, k) { return o && o[k] != null ? o[k] : a; }); }
  async function say(lines, who, o) { lines = [].concat(lines); for (var i = 0; i < lines.length; i++) await UI.say(fill(lines[i], o), who); }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  /** 이 사건의 이름 있는 인물은 도시의 범용 역할 초상 대신 전용 얼굴상·무릎상을 쓴다. */
  function eventNpc(role, name, face) {
    var sp = C().npc(role, name);
    if (G.Art && G.Art.withImg) G.Art.withImg(sp.portrait, [face]);
    sp.half = [face + '_half']; sp.special = true;
    return sp;
  }
  function newState(due) { return { stage: 1, start: today(), due: due, got: {}, luc: 0, kind: 0, visit: {}, hint: 0, kingTry: 0 }; }

  // ---------------------------------------------------------------- 시작: 로렌초에게 처음 보고를 마친 뒤
  async function afterReport(sp) {
    var s = S(); if (!s || !sp || sp.id !== CFG.sponsor || s.medici || !lorenzoHere()) return;
    if (G.Tutorial && G.Tutorial.active && G.Tutorial.active()) return;
    if ((SP().rel(sp.id).done || 0) < 1) return;
    var due = Math.min(U.dateNum(U.addDays(s.date, Math.round(CFG.years * 365))), CFG.death), pc = pic('medici_crisis', '메디치 은행의 위기');
    try {
      var who = lorenzo();
      await say(L.plea, who);
      await UI.say(L.lucIn, {});
      await UI.say(L.lucHi, luc('surprised'));
      await UI.say(L.lorIntro, who);
      await say(L.lucDebtors, luc());
      await UI.say(fill(L.lorDue, { due: fmtDue(due) }), who);
      var v = await UI.ask(L.ask, [{ label: L.yes, value: 1 }, { label: L.no, value: 0 }], who);
      if (!v) { s.medici = { stage: 0, asked: today() }; await UI.say(L.noSay, who); await UI.say(L.lucNo, {}); return; }
      start(due);
      await UI.say(L.yesSay, who);
      await UI.say(L.lucYes, luc('happy'));
      UI.toast(L.memoGet, 'scroll', 5000);
    } finally { await pc.stop(); }
  }
  function start(due) {
    var s = S();
    s.medici = newState(due);
    G.State.log('로렌초 데 메디치의 부탁을 받았다 — 메디치 은행의 빚을 거둔다 (기한 ' + fmtDue(due) + '). 딸 루크레치아가 빚쟁이 셋의 사정을 적은 장부 쪽지를 주었다.');
    UI.toast('메디치 은행의 빚을 거둔다 — 바르셀로나·르완다·파리의 술집에서 빚쟁이를 찾자', 'scroll', 6000);
  }
  /** 거절했던 부탁을 다시 꺼낸다 (피렌체 왕궁 메뉴) */
  async function askAgain() {
    var s = S(), m = M.st(); if (!m || m.stage !== 0 || !lorenzoHere()) return;
    var due = Math.min(U.dateNum(U.addDays(s.date, Math.round(CFG.years * 365))), CFG.death), who = lorenzo();
    await UI.say('다시 와 주었군. 루크레치아, 이분께 빚쟁이들 이야기를 다시 해 드리거라.', who);
    await say(L.lucDebtors, luc());
    await UI.say(fill(L.lorDue, { due: fmtDue(due) }), who);
    var v = await UI.ask(L.ask, [{ label: L.yes, value: 1 }, { label: L.no, value: 0 }], who);
    if (!v) { await UI.say(L.noSay, who); return; }
    start(due); await UI.say(L.yesSay, who); await UI.say(L.lucYes, luc('happy'));
    UI.toast(L.memoGet, 'scroll', 5000);
  }

  // ---------------------------------------------------------------- 1 빚쟁이 셋 (술집)
  function debtorAt(c) { var m = M.st(); if (!M.active() || m.stage !== 1 || !c) return null; return DEBTORS.filter(function (d) { return d.city === c.id && !m.got[d.id]; })[0] || null; }
  async function findDebtor(c) {
    var d = debtorAt(c), m = M.st(); if (!d) return;
    var CC = C();
    await CC.me(d.ask);
    await UI.say(d.keeper, CC.npc('tavernkeeper', '술집 주인'));
    var who = eventNpc(d.role, d.name, d.face);
    await UI.say(d.excuse, who);
    var v = await UI.ask(fill(L.choose, { name: d.name + U.jx(d.name, '이/가') }), [{ label: L.useNote, value: 'note' }, { label: L.beKind, value: 'kind' }], { name: S().player.name, portrait: S().player.portrait });
    if (v !== 'kind') v = 'note';
    var bill = d.bill;
    if (v === 'note') {
      await UI.say(fill(L.readNote, { memo: d.memo }), {});
      await UI.say(d.noteAns, who);
      m.luc = (m.luc || 0) + 1;
    } else {
      bill = d.bill - d.cut;
      await UI.say(d.kindAns, who);
      m.kind = (m.kind || 0) + 1;
      if (G.Fame) G.Fame.add('so', 15);
    }
    m.got[d.id] = v;
    if (G.Audio) G.Audio.sfx('coin');
    G.State.log(d.name + '(' + G.CITY_DATA[d.city].name + ')에게서 메디치 은행 앞 환어음 ' + U.num(bill) + '두카트를 받았다' + (v === 'note' ? ' — 루크레치아의 쪽지로 제 값을 다 받았다.' : ' — 사정을 들어 주고 이자를 덜어 주었다.'));
    UI.toast(fill(L.collected, { name: d.name, left: left() }), 'scroll', 4500);
    if (DEBTORS.every(function (x) { return m.got[x.id]; })) {
      m.stage = 2;
      await UI.say(L.letter3[0], {});
      await say(L.letter3.slice(1), lucLetter());
      await UI.say(L.letter3Lor, {});
      G.State.log('루크레치아의 편지 — 넷째 빚쟁이는 잉글랜드 국왕이다. 런던으로 가기 전에 피렌체에 들러 달라고 한다.');
      UI.toast('넷째 빚쟁이는 잉글랜드 국왕 — 피렌체의 루크레치아를 만나고 런던 왕궁으로', 'crown', 5500);
      return;
    }
    var lt = L.letters[d.id];
    if (lt) { await UI.say(L.post, {}); await UI.say(lt[v === 'note' ? 0 : 1], lucLetter()); }
  }

  // ---------------------------------------------------------------- 피렌체 왕궁: 루크레치아와 장부를 맞춘다
  async function visitLuc() {
    var s = S(), m = M.st(); if (!M.active()) return;
    m.visit = m.visit || {};
    if (m.stage === 1) {
      if (!m.visit[1]) {
        m.visit[1] = 1;
        await UI.say(fill(L.visit1[0], { left: leftWho() }), luc('happy'));
        await UI.say(L.visit1[1], luc());
        s.player.gold += CFG.purse; G.Game.refreshHud();
        if (G.Audio) G.Audio.sfx('coin');
        UI.toast(fill(L.purse, { n: U.num(CFG.purse) }), 'coin', 4000);
        G.State.log(fill(L.purse, { n: U.num(CFG.purse) }));
      } else await UI.say(fill(L.visit1Again, { left: leftWho() }), luc());
      return;
    }
    if (m.stage === 2) {
      if (!m.visit[2]) {
        m.visit[2] = 1; m.hint = 1;
        await say(L.visit2, luc());
        UI.toast(L.hintGet, 'sword', 5000);
        G.State.log(L.hintGet);
      } else await UI.say(L.visit2Again, luc());
    }
  }

  // ---------------------------------------------------------------- 2 잉글랜드 국왕 (런던 왕궁)
  function knight(c) {
    var sp = eventNpc('soldier', '윌리엄 애시퍼드 경', 'portraits/medici/ashford');
    sp.look = 'rival'; sp.str = 82; sp.atk = 13; sp.def = 6; sp.skill = 3;
    sp.mar = 84; sp.int = 60; sp.cha = 55; sp.style = 'slash';
    return sp;
  }
  async function demandKing(c, sp) {
    var s = S(), m = M.st(); if (!m || m.stage !== 2) return;
    if (m.kingTry && U.dayIndex(s.date) < m.kingTry) { await UI.say('국왕은 오늘 그대를 만나 주지 않는다. 며칠 뒤에 다시 청해 보자.', {}); return; }
    var who = SP().speaker(sp), pc = pic('medici_challenge', '왕의 기사');
    try {
      await UI.say(L.kingAsk, who);
      var kn = knight(c);
      await UI.say(L.knight, kn);
      if (m.hint) await UI.say(L.recall, {});
      var v = await UI.ask(L.kchoose, [{ label: L.fight, value: 1 }, { label: L.leave, value: 0 }], { name: s.player.name, portrait: s.player.portrait });
      if (!v) { await UI.say(L.kingLeft, who); return; }
      var res = await G.Games.duel(kn, { place: 'tavern' });
      if (res !== 'win') {
        m.kingTry = U.dayIndex(s.date) + CFG.retry; m.lost = (m.lost || 0) + 1;
        await UI.say(L.kingLose, who);
        await UI.say(L.loseLetter[0], {}); await UI.say(L.loseLetter[1], lucLetter());
        m.hint = 1;
        return;
      }
      if (G.Fame) G.Fame.add('bt', 30);
      await UI.say(L.kingWin, who);
      if (m.visit && m.visit[2]) await UI.say(L.kingWinLuc, who);
      await UI.say(L.kingPay, who);
      s.player.gold += CFG.sum; m.stage = 3; m.paid = today();
      if (G.Audio) G.Audio.sfx('coin');
      G.Game.refreshHud();
      G.State.log(SP().holderName(sp) + '에게서 메디치 은행의 빚 20만 두카트를 받아 냈다. 피렌체의 로렌초에게 전해야 한다 (기한 ' + fmtDue(m.due) + ').');
      await UI.alert('잉글랜드 국왕이 메디치 은행의 빚을 갚았다.<br>금화 <b>' + U.num(CFG.sum) + '</b>닢(20만 두카트)을 받았다.<br><span class="muted">' + fmtDue(m.due) + '까지 피렌체의 로렌초 데 메디치에게 전해야 한다. 넘기면 악명 +' + CFG.notoriety + '</span>', '잉글랜드의 빚');
    } finally { await pc.stop(); }
  }

  // ---------------------------------------------------------------- 3 피렌체로 (로렌초에게 전한다)
  async function deliver(c, sp) {
    var s = S(), m = M.st(); if (!m || m.stage !== 3) return;
    var who = SP().speaker(sp);
    if (s.player.gold < CFG.sum) { await UI.say(fill(L.deliverShort, { sum: U.num(CFG.sum), gold: U.num(s.player.gold) }), who); return; }
    var pc = pic('medici_saved', '메디치 은행을 살리다');
    try {
      s.player.gold -= CFG.sum;
      await say(L.thanks, who);
      await UI.say(L.countAct, {});
      await UI.say(L.count, luc('happy'));
      await UI.say(L.thanks2, who);
      s.player.gold += CFG.reward;
      if (G.Fame) G.Fame.add('so', 200);
      SP().addTrust(SP().rel(sp.id), 20);
      m.stage = 4; m.end = 'done'; m.done = today();
      if (G.Audio) G.Audio.sfx('coin');
      G.Game.refreshHud();
      G.State.log('로렌초 데 메디치에게 20만 두카트를 전해 메디치 은행을 살렸다. (사례 3만 두카트)');
      await UI.alert('메디치 은행을 살렸다!<br>사례 금화 <b>' + U.num(CFG.reward) + '</b>닢(3만 두카트) · 사교 명성 · 로렌초의 신뢰가 크게 올랐다.', '메디치 은행의 위기');
      await UI.say(L.intro, who);
      await meet('botticelli', L.botticelli, c);
      var way = (m.luc || 0) >= 3 ? 'note' : (m.kind || 0) >= 3 ? 'kind' : 'mix';
      var lucOk = await meet(LUCREZIA.id, L.lucJoin[way], c, function () { return UI.say(L.lorLuc, who); });
      await UI.say(lucOk ? L.lorenzoEnd : L.lorenzoEndStay, who);
    } finally { await pc.stop(); }
  }
  /** 로렌초가 소개하는 사람 — 이미 부하이거나 떠나보냈으면 건너뛴다. before: 묻기 전에 끼우는 말 */
  async function meet(id, line, c, before) {
    var s = S(), d = G.MATE[id]; if (!d || s.mates.some(function (x) { return x.id === id; })) return false;
    var sp = id === LUCREZIA.id ? luc('happy') : { name: d.name, portrait: G.Art.mateSpec(id), half: G.Img.chain.mateHalf(id), lang: 3, special: true };
    await UI.say(line, sp);
    if (before) await before();
    var ok = await UI.confirm(d.name + U.jx(d.name, '을/를') + ' 부하로 맞이하겠습니까? (월급 금화 ' + U.num(d.wage) + '닢)', '부하로 맞이한다', '다음에');
    if (ok && G.Legend && G.Legend.join) { G.Legend.join(id, c); return true; }
    return false;
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
      out.push({ icon: 'scroll', text: L.failLuc });
      G.State.log(msg);
      return out;
    }
    if (!m.reminded && U.dateNum(U.addDays(s.date, 182)) >= m.due) {
      m.reminded = 1;
      out.push({ icon: 'scroll', text: fill(L.remind, { left: m.stage === 1 ? leftWho() : m.stage === 2 ? '잉글랜드 국왕이 남았어요' : '이제 피렌체로 돌아오시기만 하면 돼요' }) });
    }
    return out;
  };

  // ---------------------------------------------------------------- 도시 할 일 (js/scenes/city.js)
  M.todo = function (c) {
    var m = M.st(), out = []; if (!M.active() || !c) return out;
    var f = G.SPONSOR[CFG.sponsor];
    if (m.stage === 1 && debtorAt(c)) out.push({ kind: 'tavern', icon: 'coin', hot: true, text: '술집에서 ' + debtorAt(c).name + U.jx(debtorAt(c).name, '을/를') + ' 찾는다 (메디치 은행의 빚)' });
    if (m.stage === 2 && c.id === CFG.london) { var k = G.SPONSOR[CFG.king]; if (k) out.push({ kind: 'palace', arg: G.R.bldArg(k), icon: 'crown', hot: true, text: '왕궁에서 잉글랜드 국왕에게 메디치 은행의 빚을 청한다' }); }
    if (f && c.id === CFG.florence && (m.stage === 1 || m.stage === 2) && !(m.visit || {})[m.stage]) out.push({ kind: f.bld, arg: G.R.bldArg(f), icon: 'scroll', hot: m.stage === 2, text: '왕궁에서 루크레치아와 장부를 맞춘다' + (m.stage === 2 ? ' (런던에 가기 전에 들러 달라고 했다)' : '') });
    if (f && m.stage === 3 && c.id === CFG.florence) out.push({ kind: f.bld, arg: G.R.bldArg(f), icon: 'coin', hot: true, text: '로렌초 데 메디치에게 20만 두카트를 전한다' });
    return out;
  };
  /** 수첩·알림에 쓰는 한 줄 */
  M.note = function () {
    var m = M.st(); if (!M.active()) return '';
    return (m.stage === 1 ? '빚쟁이를 찾는다 — ' + DEBTORS.filter(function (d) { return !m.got[d.id]; }).map(function (d) { return G.CITY_DATA[d.city].name + '의 ' + d.name; }).join(' · ')
      : m.stage === 2 ? '런던 왕궁의 잉글랜드 국왕에게 빚을 받는다' + (m.visit && m.visit[2] ? '' : ' (먼저 피렌체의 루크레치아에게 들르면 좋다)') : '피렌체의 로렌초에게 20만 두카트를 전한다') + ' (기한 ' + fmtDue(m.due) + ')';
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
    // 왕궁: 잉글랜드 국왕에게 빚을 청한다 · 루크레치아와 장부를 맞춘다 · 로렌초에게 전한다 · 거절했던 부탁을 다시
    wrap(CC.B.palace, 'menu', function (orig) {
      return function (c, arg) {
        var list = orig.apply(this, arguments) || [], B = CC.B.palace, sp = B.sp ? B.sp(c, arg) : null, m = M.st();
        if (!sp || !m) return list;
        if (sp.id === CFG.king && m.stage === 2 && !m.end) list.push({ label: '메디치 은행의 빚을 청한다', icon: 'coin', sub: '20만 두카트', onClick: function () { return demandKing(c, sp); } });
        if (sp.id === CFG.sponsor && (m.stage === 1 || m.stage === 2) && !m.end) list.push({ label: L.visitNote, icon: 'people', sub: (m.visit || {})[m.stage] ? '' : '새 이야기', onClick: function () { return visitLuc(); } });
        if (sp.id === CFG.sponsor && m.stage === 3 && !m.end) list.push({ label: L.deliver, icon: 'coin', sub: '사례 3만 두카트', onClick: function () { return deliver(c, sp); } });
        if (sp.id === CFG.sponsor && m.stage === 0 && !m.end && lorenzoHere()) list.push({ label: '은행의 빚 이야기', icon: 'scroll', onClick: function () { return askAgain(); } });
        return list;
      };
    });
  };
  M._t = { afterReport: afterReport, findDebtor: findDebtor, demandKing: demandKing, deliver: deliver, start: start, visitLuc: visitLuc };   // 시험용
  // 도시 건물 스크립트(js/city/*.js)와 후원자(js/systems/sponsor.js)는 이 파일보다 먼저 읽힌다
  M.install();
})(window.G = window.G || {});
