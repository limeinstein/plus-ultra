/* 개척 도시 — 자료·대사·조정값 (규칙: js/systems/colony.js)
   통합 명성이 200,000을 넘으면 제독의 나라 국왕이 부른다. 국왕은 나라가 진출한 바다 가운데 새 도시를 세울 곳을 고르게 한다.
     에스파냐(카스티야) → 아메리카 · 포르투갈 → 아프리카·인도·동남아시아
   고른 곳(해도에 「○○ 개척지」)으로 배를 몰고 가 닻을 내리면 제독이 지은 이름으로 도시가 선다.
     1단계(세울 때) 항구·술집·교역소·여관 → 물자 ① 시장·교회 → 물자 ② 조합·감찰관 저택 → 물자 ③ 총독부
   물자는 곡물(밀)이나 목재를 실어 오는 일 세 번 (G.BALANCE.colony.qty). 총독부가 서면 제독이 총독이 되고, 아내와 아이들을 총독 관저로 모실 수 있다.
   통합 명성 400,000이면 또 하나 (G.BALANCE.colony.fame).
   자리(sites)의 위도·경도는 게임의 땅 지도(G.Geo)에서 뭍인 곳, dock은 바로 앞의 열린 바다다 (tools로 다시 잴 때: G.Geo.sdfRaw ≥ 0.4).
   그림을 넣으려면 images/events/colony/<장면>.webp (1600×900 또는 16:9) — 없으면 그 도시의 거리를 그대로 보여 준다. 주문서: tools/colony_art/PROMPT.md */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.colony = G.BALANCE.colony || {
    fame: [200000, 400000],   // 이 통합 명성마다 국왕이 한 번씩 부른다 (도시 하나씩)
    grant: 20000,             // 국왕이 내리는 개척 자금 (금화)
    foundFame: 3000,          // 도시를 세웠을 때의 명성 (탐험)
    goods: ['wheat', 'timber'],   // 개척민이 청하는 물자: 곡물(밀)·목재 가운데 하나
    qty: [40, 70, 100],       // 물자 ①②③ 의 양 (통)
    pay: 1.6,                 // 물자 값을 이만큼 곱해 국왕의 금고에서 치러 준다 (본국 시세 기준)
    fame3: [1500, 2500, 4000],    // 물자를 넘길 때마다의 명성 (교역)
    gap: 10,                  // 물자를 넘긴 뒤 다음 청이 오기까지 (일)
    near: 15,                 // 「진출한 바다」: 자리에서 이 거리(°) 안에 우리 나라 도시가 있거나
    seen: 12,                 // 제독이 들러 본 도시가 이 거리(°) 안에 있으면 고를 수 있다
    govFame: 6000,            // 총독에 오를 때의 명성 (사교)
    idBase: 1000              // 개척 도시의 도시 번호 (자료의 도시 번호와 겹치지 않게 1000번부터)
  };
  /* 개척지. nat: 그 나라만 고를 수 있다 · area: 큰 지역(G.REGIONS) · ref: 거리 배경·교역품을 빌려 오는 이웃 식민 도시 · goods: 처음 시장에 나오는 교역품 */
  G.COLONY_SITES = [
    { key: 'carib', nat: 'ES', area: 10, name: '카리브 해 — 트리니다드 섬', place: '트리니다드', lat: 10.65, lon: -61.51, dock: [10.596, -61.569], ref: 197,
      goods: ['sugar', 'tobacco', 'cacao', 'timber'], desc: '남아메리카 북쪽 끝에 붙은 큰 섬. 오리노코 강 어귀와 진주 해안을 내려다본다.' },
    { key: 'gulf', nat: 'ES', area: 10, name: '멕시코 만 북쪽 기슭', place: '갤버스턴 만', lat: 29.311, lon: -94.783, dock: [29.311, -94.703], ref: 265,
      goods: ['hides', 'beef', 'timber', 'cotton'], desc: '누에바 에스파냐 북쪽의 넓은 들과 모래섬. 소와 말을 놓아 기르기 좋다.' },
    { key: 'plata', nat: 'ES', area: 10, name: '라플라타 강 어귀', place: '몬테비데오 언덕', lat: -34.9, lon: -56.19, dock: [-34.917, -56.268], ref: 217,
      goods: ['hides', 'beef', 'wheat', 'wool'], desc: '부에노스아이레스 맞은편의 언덕진 포구. 대서양에서 강으로 드는 배를 지킨다.' },
    { key: 'calif', nat: 'ES', area: 10, name: '태평양 — 캘리포니아 해안', place: '산디에고 만', lat: 32.72, lon: -117.17, dock: [32.757, -117.284], ref: 205,
      goods: ['hides', 'fur', 'timber', 'wheat'], desc: '마닐라 갤리온이 돌아오는 길목의 잔잔한 만. 북쪽 바다로 나아가는 디딤돌.' },
    { key: 'chile', nat: 'ES', area: 10, name: '태평양 — 칠레 남부', place: '발디비아 강 어귀', lat: -39.749, lon: -73.337, dock: [-39.601, -73.471], ref: 276,
      goods: ['timber', 'wheat', 'silver', 'wool'], desc: '숲이 바다까지 내려온 남쪽 끝의 강 어귀. 마젤란 해협으로 가는 배가 쉬어 간다.' },
    { key: 'guinea', nat: 'PT', area: 3, name: '서아프리카 — 기니 해안', place: '비사우', lat: 11.881, lon: -15.566, dock: [11.834, -15.631], ref: 91,
      goods: ['ivory', 'pepper', 'rice', 'gold'], desc: '강줄기가 얽힌 낮은 해안. 내륙과 오가는 강배가 모인다.' },
    { key: 'angola', nat: 'PT', area: 3, name: '남서아프리카 — 앙골라 해안', place: '벵겔라', lat: -12.58, lon: 13.41, dock: [-12.491, 13.33], ref: 100,
      goods: ['ivory', 'copper', 'salt', 'palmoil'], desc: '르완다(루안다)에서 남쪽으로 내려간 마른 해안. 구리와 소금을 캐는 고원으로 길이 난다.' },
    { key: 'delagoa', nat: 'PT', area: 3, name: '동아프리카 — 델라고아 만', place: '로렌수마르케스', lat: -25.95, lon: 32.581, dock: [-25.95, 32.661], ref: 102,
      goods: ['ivory', 'gold', 'hides', 'timber'], desc: '희망봉을 돌아 인도로 가는 배가 물을 긷는 넓은 만. 상아와 금이 내륙에서 내려온다.' },
    { key: 'bombay', nat: 'PT', area: 5, name: '인도 서해안 — 봄베이 섬', place: '봄베이', lat: 18.944, lon: 72.826, dock: [18.984, 72.756], ref: 150,
      goods: ['cotton', 'cottoncloth', 'pepper', 'dye'], desc: '일곱 개 섬이 둘러싼 깊은 항구. 고아와 디우 사이에서 바람을 피하기 좋다.' },
    { key: 'coromandel', nat: 'PT', area: 5, name: '인도 동해안 — 코로만델', place: '마드라스', lat: 13.08, lon: 80.29, dock: [13.08, 80.41], ref: 154,
      goods: ['cottoncloth', 'dye', 'gems', 'rice'], desc: '사도 성 토마스의 무덤이 있다는 모래 해안. 면포와 쪽빛 물감이 모인다.' },
    { key: 'timor', nat: 'PT', area: 8, name: '동남아시아 — 티모르 섬', place: '딜리', lat: -8.562, lon: 125.564, dock: [-8.515, 125.629], ref: 172,
      goods: ['sandalwood', 'clove', 'honey', 'rice'], desc: '백단향 숲으로 이름난 섬. 향료 제도에서 남쪽으로 내려가면 닿는다.' },
    { key: 'macassar', nat: 'PT', area: 8, name: '동남아시아 — 셀레베스 섬', place: '마카사르', lat: -5.13, lon: 119.41, dock: [-5.011, 119.303], ref: 171,
      goods: ['nutmeg', 'rice', 'gold', 'timber'], desc: '향료 제도와 말라카 사이의 바닷길 한가운데. 부기스 사람들의 배가 드나든다.' }
  ];
  /* 단계마다 서는 건물 (kind는 거리·메뉴에서 쓰는 건물 이름) */
  G.COLONY_STAGES = [
    { name: '개척지', builds: ['harbor'] },
    { name: '개척 마을', builds: ['harbor', 'tavern', 'trade', 'inn'] },
    { name: '개척 도시', builds: ['market', 'church'] },
    { name: '식민 도시', builds: ['guild', 'inspector'] },
    { name: '총독령 도시', builds: ['govhall'] }
  ];
  G.COLONY_BUILD_NAMES = { harbor: '항구', tavern: '술집', trade: '교역소', inn: '여관', market: '시장', church: '교회', guild: '조합', inspector: '감찰관 저택', govhall: '총독부', home: '총독 관저' };
  /* 대사 — {name} 제독 · {king} 국왕 · {city} 왕궁의 도시 · {colony} 개척 도시 · {place} 개척지 · {good} 물자 · {qty} 양 */
  G.COLONY_LINES = {
    news: '{king}의 궁정에서 전령이 왔다 — 바다 너머에 왕국의 새 도시를 세울 사람을 찾으신다며, 명성 높은 {name} 제독을 {city} 왕궁으로 부르신다.',
    newsAgain: '{king}께서 다시 {name} 제독을 찾으신다 — 또 하나의 새 도시를 맡기고 싶으시다는 전갈이다. {city} 왕궁으로.',
    herald: '{name} 제독이시지요! 전하께서 새 도시의 일로 찾으십니다. 왕궁으로 드십시오.',
    plea: ['어서 오게, {name}. 그대의 이름은 이제 궁정 바깥의 바다에서도 들리네.\f우리 왕국의 깃발이 닿은 먼 바다에, 그대 손으로 도시 하나를 세워 주게.',
      '땅은 그대가 고르게. 우리 배가 드나드는 바다 가운데서 말일세. 개척민과 목수는 내가 딸려 보내지.'],
    again: '그대가 세운 도시 소식은 늘 반갑게 듣고 있네. 바다는 넓고, 우리 깃발이 설 자리는 아직 많지. 하나 더 맡아 주겠나?',
    ask: '새 도시를 세울 곳을 고르겠습니까?',
    later: '…서두를 일은 아니지. 마음이 정해지면 다시 오게.',
    chosen: '{place}라… 좋은 눈일세. 개척 자금으로 금화 {grant}닢을 내리겠네.\f개척민을 태운 배가 먼저 떠났으니, 그대도 그리로 가서 닻을 내리게. 도시의 이름은 그대가 짓게.',
    pending: '{place}의 소식은 아직인가? 개척민들이 그대를 기다리고 있을 걸세.',
    // 도시를 세운다
    landMate: '제독, 저기 해안에 깃발이 보입니다! 먼저 온 개척민들이 천막을 치고 기다리고 있습니다.',
    settler: ['제독님! 오시기만을 손꼽아 기다렸습니다. 목수들과 함께 터를 닦아 두었습니다.', '부두와 창고 자리, 그리고 사람들이 모일 술집과 여관 자리를 잡아 두었지요.\f이제 이 도시의 이름만 지어 주시면 됩니다!'],
    nameAsk: '새 도시의 이름을 지어 주십시오',
    named: '「{colony}」! 좋은 이름입니다. 오늘부터 이곳은 {colony}입니다!',
    cheer: '{colony} 만세! 국왕 전하 만세! {name} 제독 만세!',
    founded: '{place}에 새 도시 「{colony}」를 세웠다.',
    // 물자
    ask1: '제독님, 개척민들이 첫 겨울을 나려면 {good} {qty}통이 있어야 합니다. 실어다 주시면 시장과 교회를 세우겠습니다.',
    ask2: '도시가 자리를 잡아 갑니다! 이번에는 {good} {qty}통이 필요합니다 — 상인 조합과 감찰관 나리의 저택을 지을 겁니다.',
    ask3: '마지막입니다, 제독님. {good} {qty}통이면 총독부를 세울 수 있습니다. 그러면 이 도시도 어엿한 총독령이 됩니다!',
    askNews: '{colony}에서 소식이 왔다 — 개척민들이 {good} {qty}통을 청한다.',
    thanks: ['이것이면 넉넉합니다! 정말 고맙습니다, 제독님.', '목수들이 벌써 들떠 있습니다. 내일부터 바로 짓기 시작하지요.'],
    built: '{colony}에 {list}{jx} 섰다.',
    // 총독
    govAsk: '총독부가 섰습니다. 국왕 전하께서 보내신 임명장이 와 있습니다 — 제독께서 {colony}의 첫 총독이 되실 차례입니다.',
    govYes: '{colony}의 총독, {name} 각하! 이 도시의 사람들을 잘 이끌어 주십시오.',
    govLog: '{colony}의 총독이 되었다.',
    famMove: '아내와 아이들을 {colony}의 총독 관저로 모셨다. 이제 이곳이 가족이 기다리는 집이다.',
    famBack: '가족이 고향 {home}의 집으로 돌아갔다.',
    // 감찰관
    inspector: ['본국에서 온 감찰관일세. 이 도시가 국왕 폐하의 뜻대로 돌아가는지 살피는 것이 내 일이지.', '총독부가 서면 이 도시도 어엿한 총독령이 되네. 그때까지는 내가 장부를 맡아 두지.'],
    inspectorGov: ['총독 각하, 장부는 깨끗합니다. 세금도 제때 걷히고 있지요.', '본국에서도 {colony}의 이야기를 듣고들 있습니다. 바다 너머에서 이만큼 자란 도시는 드물지요.']
  };
})(window.G = window.G || {});
