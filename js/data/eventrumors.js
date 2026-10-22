/* 사건·전설 부하의 소문 (G.EVENT_RUMORS) — 거리를 걷는 마을 사람이 가끔(5%) 들려준다. 시스템: js/systems/eventrumor.js. 2026-10-22 사용자 요청
   「어느 지역에서 누군가 조건을 맞추어야 한다」는 것을 짧고 두루뭉술하게 — 정답을 다 알려 주지 않는다.
   항목: id · near [[경도, 위도], …] + r(°): 이 둘레 도시의 마을 사람만 이야기한다 · own: 그 도시를 다스리는 나라 이름(정규식)도 맞아야 한다 · mates: 이 사람들이 모두 배에 있거나 떠났으면 끝난 이야기
         y: [시작 해, 끝 해] (또는 d: [yyyymmdd, yyyymmdd]) · live(s): 아직 일어날 수 있는가 (없으면 mates·y만 본다) · text: [말 1~2개]
   ※ 이야기 속 사건의 실제 조건은 그 시스템 파일의 머리 주석에 있다. 조건을 바꾸면 여기 말도 맞춰 고친다. */
(function (G) {
  'use strict';
  var P = {   // 자주 쓰는 자리
    paris: [2.35, 48.85], germany: [10, 51], denmark: [10.5, 55.7], nordic: [25, 61], edinburgh: [-3.2, 55.95], london: [-0.12, 51.5],
    toledo: [-4.0, 39.86], seville: [-6.0, 37.4], vienna: [16.37, 48.2], genoa: [8.93, 44.4], milan: [9.19, 45.46], florence: [11.25, 43.77],
    istanbul: [28.97, 41.0], cairo: [31.2, 30.0], baghdad: [44.4, 33.3], china: [116, 34], hangzhou: [120.2, 30.3], korea: [127.5, 36.5],
    havana: [-82.4, 23.1], veracruz: [-96.1, 19.2], panama: [-79.5, 9.0], lima: [-77.0, -12.0], namerica: [-76, 37]
  };
  var FR = /프랑스|브르타뉴|부르고뉴|프로방스/, EN = /잉글랜드|영국/, DE = /신성로마|한자|작센|바이에른|브레멘|함부르크|뤼베크|프로이센|베스트팔렌|프랑크푸르트|독일/,
    DK = /덴마크/, KR = /조선|대한/, CN = /^(명|청|대서|대순|삼번|후금|동녕 왕국)$/;
  function dn(s) { return s.date.y * 10000 + s.date.m * 100 + s.date.d; }
  function has(s, id) { return (s.mates || []).some(function (m) { return m.id === id; }); }
  G.EVENT_RUMORS = [
    // ───────────── 옛이야기의 아가씨들 (js/systems/fairytales.js)
    { id: 'cinderella', near: [P.paris], r: 7, own: FR, mates: ['cinderella'], text: [
      '프랑스 어느 숲에서 깨진 유리 구두를 꼭 쥔 아가씨를 봤다는 사람이 있어요. 유리를 싣고 다니는 솜씨 좋은 사람이라면 도울 수 있을 텐데.',
      '숲길에 재투성이 아가씨가 나타난대요. 구두 한 짝을 고쳐 줄 손재주를 찾는다나 봐요.'] },
    { id: 'snow_white', near: [P.paris], r: 7, own: FR, mates: ['snow_white'], text: [
      '숲에서 사냥꾼에게 쫓기는 아가씨가 있다는 소문이오. 일곱 사내가 함께 다니는 무리 앞에만 나타난다나.',
      '프랑스 숲 깊은 곳에 왕비의 미움을 산 아가씨가 숨어 산다더군. 사내 일곱이 한 무리여야 만난다던가.'] },
    { id: 'sleeping_beauty', near: [P.germany], r: 7, own: DE, mates: ['sleeping_beauty'], text: [
      '독일 땅 숲 깊숙이 가시덤불에 덮인 성이 있소. 거기 잠든 처녀를 깨우려면 용을 본 사람과 병을 고치는 사람이 함께 가야 한다는군.',
      '가시덤불 성 이야기를 아시오? 숲에서 밤을 지새우는 사람만 그 성을 본다고들 하오.'] },
    { id: 'little_mermaid', near: [P.denmark], r: 5, own: DK, mates: ['little_mermaid'], text: [
      '덴마크 섬 물가에서 말을 못 하는 아가씨를 봤대요. 걸음이 서툴러서, 섬에서 사냥하던 사람들 눈에만 띈다나.',
      '바다에서 올라온 것 같은 아가씨가 섬 바닷가를 헤맨다지. 섬에 내려 야영하는 뱃사람이라면 만날지도.'] },
    { id: 'joan', near: [P.paris], r: 7, own: FR, mates: ['joan_of_arc'], text: [
      '숲가 마을에서 「마녀를 태워라」 하는 소리가 났대요. 약초 캐러 숲에 들어간 사람이 봤다는데… 배에 비어 있는 기도방이 있는 분이라면 그 아가씨가 따라갈지도요.',
      '프랑스 숲 마을에 화형대가 섰다는 소문이 돌아요. 칼을 쓸 줄 아는 사람이 막아서야 할 텐데.'] },
    { id: 'snowqueen', near: [P.nordic], r: 12, mates: ['gerda', 'elizaveta'], live: function (s) { return !(s.snowQ && s.snowQ.stage); }, text: [
      '북쪽 호숫가에서 동생을 찾는 소녀가 있대요. 하얀 썰매가 동쪽으로 갔다나. 호숫가에서 밤을 보내는 사람이면 만날지도.',
      '얼어붙은 호수 가에 빨간 구두를 신은 아이가 서 있다는 소문이오. 눈의 여왕 이야기를 하더군.'] },
    { id: 'peter', near: [P.edinburgh], r: 4, mates: ['peter_pan'], live: function (s) { return !(s.peter && s.peter.phase === 'done'); }, text: [
      '스코틀랜드 작은 섬엔 어른이 되지 않는 아이가 산다는 옛말이 있지. 아이를 데리고 섬에 내리는 사람은 조심하라더군.',
      '서쪽 섬들에서 아이가 밤새 사라졌다 돌아왔다는 이야기가 있소. 산비탈 약초 냄새를 따라가면 찾는다나.'] },
    // ───────────── 전설 속 인물 (js/systems/legends.js)
    { id: 'tao', near: [P.china], r: 14, own: CN, mates: ['liu_bei', 'guan_yu', 'zhang_fei'], text: [
      '북쪽 탁군 땅 복숭아밭에 의형제를 맺은 세 사내가 있다더군. 중국 술집에서 술을 자꾸 사는 사람한테 먼저 말을 건다나.',
      '술 좋아하는 붉은 얼굴의 장수와 수염 덥수룩한 사내… 술집과 복숭아밭을 오가며 만나 보시오.'] },
    { id: 'zhuge', near: [P.china], r: 14, own: CN, mates: ['zhuge_liang'], live: function (s) { return has(s, 'liu_bei'); }, text: [
      '와룡이라는 선비가 여관에서 누군가를 기다린다지. 덕이 높은 사람을 곁에 둔 제독이 자꾸 찾아오면 나선다나.'] },
    { id: 'dartagnan', near: [P.paris], r: 7, own: FR, mates: ['d_artagnan'], text: [
      '가스코뉴에서 올라온 젊은이가 말 살 돈이 모자라 장터를 서성인대요. 시장에서 물건을 많이 사는 사람한테 손을 벌린다나요.'] },
    { id: 'musketeers', near: [P.paris], r: 9, own: FR, mates: ['athos', 'porthos', 'aramis'], live: function (s) { return has(s, 'd_artagnan'); }, text: [
      '왕의 총사 셋이 가스코뉴 젊은이를 찾고 있다는군. 그 젊은이와 함께 처음 가 보는 술집에 들어서면 결투를 걸어 올 거요.'] },
    { id: 'scheherazade', near: [P.istanbul, P.cairo, P.baghdad], r: 10, mates: ['scheherazade'], text: [
      '천 하룻밤 이야기를 아는 여인이 도서관에 들른대요. 한자리에서 책을 여러 권 읽는 사람을 눈여겨본다나.'] },
    { id: 'lamp', near: [P.istanbul], r: 10, mates: ['aladdin', 'ali_baba'], live: function (s) { return has(s, 'scheherazade'); }, text: [
      '오스만 교역소에 돈을 크게 댄 사람한테만 오는 손님들이 있소. 낡은 등잔과 동굴 이야기를 하는 젊은이들… 이야기꾼 여인이 말을 옮겨 줘야 알아듣는다던가.'] },
    // ───────────── 이베리아·이탈리아
    { id: 'quixote', near: [P.toledo], r: 6, mates: ['don_quixote', 'sancho_panza'], live: function (s) { return !(s.quix && s.quix.stage); }, text: [
      '라 만차 들판에서 풍차한테 창을 겨누는 늙은 기사가 있대요. 톨레도 쪽에 가면 볼 수 있을걸요. 순례 길동무를 찾는다나.',
      '당나귀 탄 땅딸보 종자를 거느린 기사 이야기 들었소? 톨레도 근처에서 바다의 기사를 기다린다더군.'] },
    { id: 'leonardo', near: [P.milan], r: 6, y: [1482, 1519], live: function (s) { return !(s.leo && s.leo.joined) && !has(s, 'leonardo'); }, text: [
      '밀라노에 하늘을 나는 기계를 그리는 화가가 산대요. 먼저 공작님께 얼굴을 알려야 그 집 문이 열린다나요.'] },
    { id: 'medici', near: [P.florence], r: 7, d: [14800101, 14920407], live: function (s) { return !(s.medici && s.medici.stage); }, text: [
      '피렌체 메디치 은행이 남모를 시름에 잠겼다는 소문이오. 그 집 당주와 일을 한번 해 낸 사람한테나 털어놓겠지.'] },
    { id: 'barbarossa', near: [P.seville, P.vienna, P.genoa], r: 8, d: [15380101, 15440731], live: function (s) { return !(s.barb && s.barb.stage); }, text: [
      '붉은 수염 해적 때문에 황제 폐하의 시름이 깊으시대요. 폐하께서 믿고 작위까지 받은 사람이라면 부르실 거라나.'] },
    { id: 'princess', near: [P.seville], r: 9, live: function (s) { return !s.princess; }, text: [
      '에스파냐 왕녀님 소식이 끊겼다는 쉬쉬하는 이야기가 있소. 이름이 아주 높은, 아직 장가 안 간 제독을 왕께서 찾으신다나.'] },
    // ───────────── 잉글랜드
    { id: 'henry', near: [P.london], r: 6, own: EN, y: [1525, 1533], live: function (s) { return !(s.tudor && s.tudor.div && s.tudor.div.stage); }, text: [
      '국왕 폐하께서 왕비님과의 혼인을 무르시려 한대요. 폐하와 친한 뱃사람이라면 로마까지 심부름을 맡기실지도요.'] },
    { id: 'elizabeth', near: [P.london], r: 6, own: EN, d: [15530701, 15581117], live: function (s) { return !(s.tudor && s.tudor.eliz && s.tudor.eliz.stage); }, text: [
      '런던 탑에 갇힌 공주님이 언니 여왕을 무서워하신다는 소문이오. 왕궁과 줄이 닿는 사람이라면 거리에서 탑이 보일 거요.'] },
    { id: 'calais', near: [P.london], r: 7, own: EN, d: [15860101, 15880815], live: function (s) { return !(s.tudor && s.tudor.calais && s.tudor.calais.stage); }, text: [
      '에스파냐가 큰 함대를 꾸린대요. 여왕님께 발견을 아뢴 적 있는 뱃사람들이 칼레 앞바다로 불려 간다나요.'] },
    // ───────────── 아메리카
    { id: 'aztec', near: [P.havana, P.veracruz], r: 12, d: [15170301, 15210812], live: function (s) { return !(s.aztec && s.aztec.end); }, text: [
      '쿠바 항구 술집에서 서쪽 호수 위의 황금 도시 이야기가 한창이오. 코르테스라는 사내가 사람을 모은다더군.'] },
    { id: 'inca', near: [P.panama, P.lima], r: 12, d: [15240101, 15370430], live: function (s) { return !(s.incaFall && s.incaFall.side === 'declined'); }, text: [
      '파나마에서 남쪽 황금 나라로 갈 동업자를 찾는 늙은 군인이 있대요. 돈을 대는 사람이라면 한몫 끼워 준다나요.',
      '남쪽 산속 나라가 흔들린다는 소문이오. 그 나라 서울에 가 보면 보게 될 거요.'] },
    { id: 'pocahontas', near: [P.namerica, P.havana], r: 16, d: [15210813, 17000101], mates: ['h_pocahontas'], live: function (s) { return !(s.poca && s.poca.done) && !(G.Pocahontas && G.Pocahontas.slaver && G.Pocahontas.slaver()); }, text: [
      '옥수수밭 가장자리에서 정착민과 원주민이 맞선대요. 사람을 사고판 적 없는 제독 앞에서만, 두 줄 사이로 뛰어드는 처녀가 있다나요.'] },
    // ───────────── 동아시아
    { id: 'simcheong', near: [P.korea], r: 6, own: KR, mates: ['simcheong'], live: function (s) { return !(s.sim && s.sim.done); }, text: [
      '포구에 「제물로 바칠 처녀를 쌀 삼백 석에 산다」는 방이 붙었대요. 쌀을 넉넉히 싣고 조선 항구에 드는 배라면….'] },
    { id: 'gyeonwoo', near: [P.korea, P.hangzhou], r: 8, live: function (s) { return !(s.gw && s.gw.end); }, text: [
      '오작 할멈이 거북 모양 배를 찾아다닌대요. 항주와 사카이를 아는 선장이라면 한 해 한 번 만나는 연인을 이어 줄 수 있다나요.'] }
  ];
})(window.G = window.G || {});
