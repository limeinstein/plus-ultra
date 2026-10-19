/* 아즈텍 제국의 멸망 (1517~1522)에 나오는 역사 인물과 사건 전용 인물 — G.HIST_FIG 에 덧붙인다. 사건은 js/systems/aztec.js. 2026-10-19 사용자 요청 「아즈텍 제국 멸망 시나리오 — 이벤트 개발」
   얼굴 그림: images/portraits/history/<id>.webp (384×384) · <id>_half.webp (1024×1536 투명 무릎상) — images/portraits/history/PROMPT.md 「아즈텍 제국의 멸망」
   코르테스는 경쟁 탐험가 그림(portraits/rivals/에르난 코르테스), 말린체·아길라르는 동료 그림(portraits/mates/marina·aguilar),
   쿠아우테목·시코텐카틀은 고장 인물 그림(portraits/mates/h_cuauhtemoc·h_xicotencatl), 벨라스케스는 쿠바 총독 후원자 그림을 그대로 쓴다.
   그림이 없으면 역할(role)·양식(st: ib 이베리아, az 메소아메리카)으로 그린 얼굴. */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    // ── 에스파냐 — 쿠바의 원정대와 총독
    cortes: { name: '에르난 코르테스', title: '원정대장 · 베라크루스 시의회가 뽑은 총사령관', st: 'ib', role: 'soldier', born: 1485, look: '30대 중반, 짧게 다듬은 검은 수염, 검은 벨벳 위의 흉갑, 말솜씨 좋은 법률가의 눈빛' },
    velazquez: { name: '디에고 벨라스케스', title: '쿠바 총독', st: 'ib', role: 'noble', face: 'portraits/sponsors/es_cuba', born: 1465, look: '50대, 살집 있는 얼굴, 흰 러프와 금 사슬, 의심 많은 눈' },
    narvaez: { name: '판필로 데 나르바에스', title: '총독이 보낸 토벌대장', st: 'ib', role: 'soldier', born: 1478, look: '40대, 붉은 수염, 크고 우렁찬 목소리, 반짝이는 새 흉갑' },
    alvarado: { name: '페드로 데 알바라도', title: '코르테스의 부장 · 「태양(토나티우)」', st: 'ib', role: 'soldier', born: 1485, look: '30대, 금빛 머리와 수염, 화려한 깃털 투구, 성급하고 잔인한 미소' },
    bernal: { name: '베르날 디아스 델 카스티요', title: '원정대의 병사 · 뒷날 『누에바 에스파냐 정복기』를 쓴다', st: 'ib', role: 'soldier', born: 1496, look: '20대, 햇볕에 그을린 마른 얼굴, 낡은 솜 갑옷, 무엇이든 눈여겨보는 눈' },
    aguilar: { name: '헤로니모 데 아길라르', title: '유카탄에 떠밀려 온 수도사 · 마야어 통역', st: 'ib', role: 'priest', mate: 'aguilar', born: 1489, look: '30대, 원주민처럼 그을린 몸에 해진 허리옷, 품에 낡은 기도서' },
    marina: { name: '말린체 (도냐 마리나)', title: '통역 · 나우아틀어와 마야어를 잇는 여인', st: 'az', role: 'native', mate: 'marina', born: 1500, look: '10대 후반~20대, 곧은 눈매, 흰 위필 옷에 땋은 머리, 조용하지만 흔들리지 않는 목소리' },
    // ── 메시카 (아즈텍) — 호수 위의 도시 테노치티틀란
    moctezuma: { name: '목테수마 2세', title: '메시카의 틀라토아니 · 아즈텍 황제', st: 'az', role: 'king', born: 1466, look: '50대, 마르고 위엄 있는 얼굴, 청록 코걸이와 짙은 청록 안면 문양, 맨팔 위 청록 모자이크 왕실 흉식, 케찰 깃털관' },
    cuitlahuac: { name: '쿠이틀라우아크', title: '이스타팔라파의 군주 · 목테수마의 아우', st: 'az', role: 'king', born: 1476, look: '40대, 굳은 얼굴, 붉고 검은 안면 문양, 독수리 머리 투구와 검은 깃털 망토, 흑요석 칼' },
    cuauhtemoc: { name: '쿠아우테목', title: '메시카의 젊은 장수 · 「내려앉는 독수리」', st: 'az', role: 'noble', mate: 'h_cuauhtemoc', born: 1497, look: '20대, 날카로운 눈과 곧은 코, 독수리 머리 투구, 방패와 마쿠아우이틀' },
    xicotencatl: { name: '시코텐카틀', title: '틀락스칼라의 젊은 전사', st: 'az', role: 'soldier', mate: 'h_xicotencatl', born: 1484, look: '30대, 재규어 머리 투구와 흑백 안면 문양, 붉고 흰 줄무늬 전사복, 손님을 믿지 않는 눈' },
    yaocihuatl: { name: '야오시우아틀', title: '메시카의 여성 전사 지휘관 · 「전쟁의 여인」', st: 'az', role: 'native', g: 'f', born: 1492, look: '20대 후반, 붉은 눈가 채색과 검은 기하 문양, 녹색 케찰 깃털관, 청록·조개 전투 장식, 방패와 마쿠아우이틀을 든 성인 여성' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });
  G.AZTEC_FIGS = Object.keys(L);
  // 짧은 인물 이야기 (이름을 누르면 G.Bio.show) — 이미 있는 이름은 건드리지 않는다
  var B = G.BIOS = G.BIOS || {};
  var BIO = {
    '쿠이틀라우아크': '목테수마의 아우로 이스타팔라파의 군주. 1520년 「슬픈 밤」에 에스파냐 사람들을 도시에서 몰아낸 뒤 황제가 되었으나, 여든 날 만에 천연두로 세상을 떠났다.',
    '판필로 데 나르바에스': '쿠바 총독 벨라스케스가 명을 어긴 코르테스를 붙잡으라고 보낸 대장. 1520년 셈포알라에서 밤에 습격을 받아 한쪽 눈을 잃고 사로잡혔다. 뒷날 플로리다 원정에서 바다에 사라졌다.',
    '페드로 데 알바라도': '코르테스의 부장. 금빛 머리 때문에 원주민들이 「태양」이라 불렀다. 1520년 톡스카틀 축제 때 대신전에서 춤추던 귀족들을 죽여 도시의 봉기를 불렀다. 뒷날 과테말라를 정복했다.',
    '베르날 디아스 델 카스티요': '코르테스를 따라 싸운 병사. 늙어서 과테말라에서 「누에바 에스파냐 정복의 참된 역사」를 써, 처음 호수의 도시를 보았을 때의 놀라움부터 함락까지를 남겼다.'
  };
  Object.keys(BIO).forEach(function (k) { if (!B[k]) B[k] = BIO[k]; });
})(window.G = window.G || {});
