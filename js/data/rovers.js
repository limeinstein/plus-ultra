/* 바다의 사람들 — 메이플라워 · 스페르베르 · 하멜 · 벨테브레이 · 그레이스 오말리 · 앤 보니와 메리 리드 · 에드워드 티치 (사건은 js/systems/rovers.js · G.Rovers). 2026-11-04 사용자 요청
   ■ 이주(메이플라워)는 「물품 조달」과 「원주민과의 만남」으로 — 런던에서 배에 실을 밀·맥주, 첫 겨울의 식량·약재, 왐파노아그와의 약속과 추수 잔치.
   ■ 해적선은 「바다에서 맞붙어 → 약탈하고(이기면 제독이, 지면 해적이) → 서로 친해진다」. 이기면 그 해적이 동료가 되고, 지면 웃으며 떠났다가 180일 뒤 다시 붙을 수 있다.
   ■ 시대: 이 게임은 1700년 1월 1일에 끝난다. 앤 보니·메리 리드·에드워드 티치의 실제 활동(1716~1720)은 그 뒤라,
          이 게임에서는 「해적의 황금시대」를 앞당겨 1685~1699년의 카리브·캐롤라이나 바다에 전설 동료로 내보낸다 (모두 성인으로 그린다).
   ■ 동료: 하멜(1666 탈출을 도우면) · 오말리 · 보니 · 리드 · 검은 수염 — 술집에는 나오지 않고 사건으로만 (eventOnly), 품삯은 이야기 동료 규칙(G.taleWage)
   그림: images/legend-events/ROVERS_PROMPT.md — 초상 portraits/legendary/<id>, portraits/history/rv_*, 장면 legend-events/rv_* */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.rovers = G.BALANCE.rovers || {
    // 메이플라워 (이주 — 물품 조달과 원주민과의 만남): ① 런던에서 배에 실을 물자 ② 플리머스의 첫 겨울 ③ 왐파노아그와의 약속 ④ 첫 추수 잔치
    supply: { city: 38, from: 16200601, to: 16200910, goods: { wheat: 20, beer: 10 }, k: 1.5 },   // 순례자들의 대리인이 부탁하는 물자 · 값의 1.5배를 쳐 준다
    mayflower: { city: 253, from: 16201221, to: 16210315, food: 30, herbs: 8 },        // 플리머스(뉴잉글랜드)의 첫 겨울
    natives: { city: 253, from: 16210316, to: 16210831, gifts: ['woolcloth', 'cottoncloth', 'copper'], gift: 5 },   // 사모셋·스콴토·마사소이트
    feast: { city: 253, from: 16210920, to: 16211130 },                                  // 첫 추수 잔치 (겨울에 도운 사람만)
    weltevree: { city: 190, from: 16280101, to: 16601231 },                              // 한양 — 훈련도감의 박연
    sperwer: { from: 16530801, to: 16530930, box: [125.9, 127.1, 32.95, 33.75] },        // 제주 앞바다
    hamel: { from: 16660801, to: 16660915, box: [127.3, 128.2, 34.3, 34.95] },           // 여수(전라 좌수영) 앞바다
    omalley: { from: 15650101, to: 16001231, box: [-10.8, -9.3, 53.3, 54.5], chance: 0.35, toll: 0.1 },   // 아일랜드 서쪽 클루 만
    bonny: { from: 16850101, to: 16991231, box: [-80.5, -73.5, 17.0, 26.5], chance: 0.2, toll: 0.1 },     // 자메이카~바하마
    teach: { from: 16850101, to: 16991231, box: [-80.5, -75.0, 31.5, 36.5], chance: 0.25, toll: 0.15 },   // 캐롤라이나 앞바다
    plunder: 0.2,   // 지면 해적이 소지금의 이만큼을 가져간다
    again: 180,
    loyal: 84
  };
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    rv_cmartin: { name: '크리스토퍼 마틴', title: '순례자들의 물자를 맡은 대리인', st: 'ne', role: 'merchant', born: 1582,
      look: '40대, 깐깐한 얼굴, 검은 옷, 품에 물자 목록, 손에 동전 주머니' },
    rv_samoset: { name: '사모셋', title: '아베나키 사람 · 잉글랜드 어부들에게 말을 배운 이', st: 'an', role: 'native', born: 1590,
      look: '30대, 큰 키, 허리에 가죽 두른 차림, 활과 화살, 서툰 영어를 하는 쾌활한 얼굴' },
    rv_bradford: { name: '윌리엄 브래드퍼드', title: '플리머스 식민지의 순례자 · 뒷날 총독', st: 'ne', role: 'priest', born: 1590,
      look: '30세, 검은 옷에 흰 넓은 깃, 높은 모자, 마른 얼굴과 깊은 눈, 손에 성경' },
    rv_squanto: { name: '티스콴텀 (스콴토)', title: '파툭세트 사람 · 잉글랜드 말을 아는 이', st: 'an', role: 'native', born: 1585,
      look: '30대, 사슴 가죽 옷, 한쪽 어깨에 걸친 망토, 영어를 아는 영리한 눈, 손에 옥수수 씨앗' },
    rv_massasoit: { name: '마사소이트', title: '왐파노아그의 대추장', st: 'an', role: 'king', born: 1581,
      look: '40세, 위엄 있는 얼굴, 붉게 칠한 얼굴 무늬, 하얀 조개 구슬 목걸이, 털가죽 망토' },
    rv_weltevree: { name: '박연 (얀 얀서 벨테브레이)', title: '훈련도감의 귀화인 · 홍이포 장인', st: 'ne', role: 'soldier', born: 1595,
      look: '40~60대, 큰 키에 붉은 수염과 파란 눈, 조선 무관의 갓과 철릭, 손에 화포 설계도' },
    rv_yiwonjin: { name: '이원진', title: '제주 목사', st: 'kr', role: 'official', born: 1594,
      look: '50대, 단정한 수염, 붉은 관복과 사모, 차분하지만 경계하는 눈' },
    rv_hamel: { name: '헨드릭 하멜', title: '스페르베르호의 서기', st: 'ne', role: 'scholar', born: 1630, face: 'portraits/legendary/hamel',
      look: '20대(1653)~30대(1666), 금갈색 머리, 마른 얼굴, 낡은 조선 옷을 걸친 네덜란드 사람, 품에 일지' },
    rv_grace: { name: '그레이스 오말리', title: '아일랜드 서쪽 바다의 여왕 「그라누알」', st: 'ne', role: 'captain', g: 'f', born: 1530, face: 'portraits/legendary/omalley',
      look: '40~60대, 짧게 깎은 붉은 머리, 바닷바람에 그을린 얼굴, 망토에 금 브로치, 허리에 칼' },
    rv_rackham: { name: '「캘리코」 잭 래컴', title: '해적 선장 · 옥양목 옷의 멋쟁이', st: 'ne', role: 'captain', born: 1660,
      look: '30대, 화려한 옥양목 줄무늬 웃옷, 술병, 비뚜름한 웃음' },
    rv_bonny: { name: '앤 보니', title: '래컴 해적단의 여해적', st: 'ne', role: 'captain', g: 'f', born: 1660, face: 'portraits/legendary/bonny',
      look: '20대, 불꽃 같은 붉은 머리, 남자 옷과 허리띠에 꽂은 권총 두 자루, 당찬 눈' },
    rv_read: { name: '메리 리드', title: '래컴 해적단의 여해적 · 전직 병사', st: 'ne', role: 'soldier', g: 'f', born: 1655, face: 'portraits/legendary/mread',
      look: '20대 후반, 짧은 갈색 머리, 군인 출신의 단단한 몸, 낡은 붉은 군복 조끼, 커틀러스' },
    rv_teach: { name: '에드워드 티치 「검은 수염」', title: '앤 여왕의 복수호의 선장', st: 'ne', role: 'captain', born: 1650, face: 'portraits/legendary/blackbeard',
      look: '30대, 가슴까지 내려오는 검은 수염을 땋아 리본으로 묶고, 모자 밑에 연기 나는 도화선을 꽂음, 가슴에 권총 여섯 자루' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });
  G.ROVERS_FIGS = Object.keys(L);

  var M = [
    { id: 'hamel', name: '헨드릭 하멜', short: '하멜', g: 'm', style: 'ne', role: 'scholar', tone: 'polite', pic: 'hamel', age: 'young',
      st: [62, 84, 45, 72], sk: { acct: 3, hist: 2, survey: 1 }, skBoost: 1, lg: { 3: 3, 14: 3, 13: 1, 1: 1 },
      desc: '네덜란드 동인도 회사 상선 스페르베르호의 서기. 1653년 제주 앞바다에서 배가 부서져 살아남은 서른여섯 사람과 함께 열세 해를 조선에서 보냈다. 한양의 훈련도감, 강진의 병영, 여수의 좌수영 — 조선 말을 모국어처럼 한다. 밀린 품삯과 그 열세 해를 하루도 빠짐없이 일지에 적어 두었다.' },
    { id: 'omalley', name: '그레이스 오말리', short: '그라누알', g: 'f', style: 'ne', role: 'captain', tone: 'rush', pic: 'omalley', age: 'mid',
      st: [82, 76, 86, 88], sk: { nav: 3, sword: 3, ops: 2 }, skBoost: 1, lg: { 3: 2, 0: 1, 2: 1 },
      desc: '아일랜드 서쪽 클루 만을 다스린 오말리 가문의 딸, 「그라누알」. 소녀 시절 아버지의 배에 타려고 머리를 짧게 잘랐다는 이야기가 있다. 갤리선을 몰고 클루 만을 지나는 배마다 통행세를 받았고, 잉글랜드 총독과도 맞섰다. 바다에서는 누구에게도 고개를 숙이지 않는다 — 여왕에게도.' },
    { id: 'bonny', name: '앤 보니', short: '앤', g: 'f', style: 'ne', role: 'captain', tone: 'rush', pic: 'bonny', age: 'young',
      st: [74, 66, 84, 92], sk: { shoot: 3, sword: 2, ops: 1 }, skBoost: 1, lg: { 3: 3 },
      desc: '아일랜드에서 태어나 캐롤라이나에서 자란 붉은 머리의 여해적. 남자 옷을 입고 권총 두 자루를 차고 다닌다. 「캘리코」 잭 래컴의 배에서 누구보다 먼저 적의 갑판에 뛰어들었다. 웃음소리가 크고, 겁쟁이를 가장 싫어한다.' },
    { id: 'mread', name: '메리 리드', short: '메리', g: 'f', style: 'ne', role: 'soldier', tone: 'plain', pic: 'mread', age: 'young',
      st: [80, 70, 88, 84], sk: { sword: 3, shoot: 2, gun: 1 }, skBoost: 1, lg: { 3: 3, 2: 1 },
      desc: '런던에서 태어나 어려서부터 남자 행세를 하며 살았고, 플랑드르에서 병사로 싸웠다. 서인도로 가는 배가 해적에게 잡히자 그대로 해적이 되었다. 말수가 적고 칼솜씨는 배에서 가장 매섭다. 앤 보니가 유일하게 비밀을 털어놓은 사람.' },
    { id: 'blackbeard', name: '에드워드 티치', short: '검은 수염', g: 'm', style: 'ne', role: 'captain', tone: 'rush', pic: 'blackbeard', age: 'mid',
      st: [92, 72, 94, 70], sk: { gun: 3, ops: 3, sword: 2, nav: 1 }, skBoost: 1, lg: { 3: 3 },
      desc: '「검은 수염」. 가슴까지 내려오는 수염을 땋아 리본으로 묶고, 싸울 때면 모자 밑에 도화선을 꽂아 연기를 피운다 — 사람들은 지옥에서 온 악마라 했다. 그러나 그 무서운 겉모습은 싸우지 않고 항복을 받아 내려는 꾀였다. 포를 다루는 솜씨는 바다 위 누구보다 낫다.' }
  ];
  G.ROVERS_MATES = M.map(function (m) { return m.id; });
  M.forEach(function (m) {
    m.tale = true; m.legend = true; m.fame = 0; m.wage = G.taleWage ? G.taleWage(m) : 0; m.y = [1550, 1700]; m.reg = []; m.face = 'portraits/legendary/' + m.pic; m.eventOnly = true;
    if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }
  });

  var IT = [
    { id: 'mayflower_compact', name: '메이플라워 서약 사본', gv: 16, desc: '1620년 11월, 케이프 코드 앞바다의 메이플라워호 선실에서 마흔한 사람이 서명한 약속의 사본. 「스스로 법을 만들고 따르겠다」는 짧은 글이다.' },
    { id: 'hongi_cannon', name: '박연의 홍이포 설계도', gv: 20, desc: '훈련도감의 귀화인 박연(벨테브레이)이 그린 서양식 대포의 설계도. 네덜란드 글자와 조선 글자가 나란히 적혀 있다.' },
    { id: 'hamel_journal', name: '『하멜 표류기』 원고 한 장', kind: 'book', gv: 26, desc: '헨드릭 하멜이 조선에서 보낸 열세 해를 적은 일지의 한 장. 제주의 바람, 한양의 거리, 여수의 바다가 네덜란드 말로 빼곡하다.' },
    { id: 'granuaile_brooch', name: '그라누알의 금 브로치', gv: 20, desc: '그레이스 오말리의 망토를 여미던 금 브로치. 바다에서 진 사람에게 준 적은 없다 — 이긴 사람에게만.' },
    { id: 'calico_pistol', name: '앤 보니의 권총', gv: 18, desc: '앤 보니가 허리에 차고 다니던 권총 한 자루. 손잡이에 작은 별이 새겨져 있다.' },
    { id: 'blackbeard_fuse', name: '검은 수염의 도화선', gv: 16, desc: '에드워드 티치가 모자 밑에 꽂고 다니던 느린 도화선 한 묶음. 불을 붙이면 지독한 연기가 피어오른다.' }
  ];
  if (G.ITEMS && G.ITEM) IT.forEach(function (x) {
    if (G.ITEM[x.id]) return;
    var it = { id: x.id, name: x.name, kind: x.kind || 'keepsake', price: 0, gv: x.gv, reg: [], desc: x.desc };
    G.ITEMS.push(it); G.ITEM[it.id] = it;
  });
})(window.G = window.G || {});
