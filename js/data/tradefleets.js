/* 교역 항로의 상선대 (js/systems/tradefleets.js 가 쓴다) — 2026-10-24 사용자 요청
   「항로(인도·향료·서회·신세계·말라카·중국·일본)가 발견되면 첫 두 해는 2함대, 다음 두 해는 4함대… 2배씩 늘어 10년에 32함대까지 늘고 멈춘다.
     이 교역이 경제에 반영되게」
   · disc: 이 발견이 세상에 알려지면(제독의 보고·발표, 경쟁자의 발표) 항로가 열린다
   · nat: 처음 상선대를 띄우는 나라 · from/to: 오가는 두 항구(소식에 쓰는 이름)
   · home: 상선대가 물건을 실어 가는 쪽(받는 시장)의 문화권 번호(G.REGIONS) · far: 물건이 나는 쪽
   · goods: far → home 으로 실어 오는 물건 — home 에서는 흔해져 값이 내리고, far 에서는 사 가는 배가 많아 값이 오른다
   · back: home → far 로 실어 가는 물건(값을 치르는 은·모직물…) — far 에서는 흔해지고, home 에서는 조금 귀해진다
   · lane: 상선대가 다니는 뱃길 [경도, 위도] — 이 길 가까운 바다에서 그 항로의 상선대를 자주 만난다
   역사 속 교역(포르투갈 인도 항로·마닐라 갤리온·마카오–나가사키 무역 등)의 큰 흐름을 따라 게임에 맞게 줄였다. 조정값 G.BALANCE.tradeFleet */
(function (G) {
  'use strict';
  G.TRADE_ROUTES = [
    { id: 'india', disc: 'indiaroute', name: '인도 항로', nat: '포르투갈', from: '리스본', to: '캘리컷·고아',
      home: [0, 1, 2], far: [5],
      goods: ['pepper', 'cinnamon', 'ginger', 'calico', 'chintz', 'gems', 'dye'], back: ['woolcloth', 'coral', 'wine', 'silver', 'guns'],
      lane: [[-9.2, 38.6], [-16, 28], [-23, 14], [-28, -8], [-10, -32], [18.5, -35.5], [35, -26], [40.5, -15], [45, -2], [60, 8], [73.8, 15.4]] },
    { id: 'spice', disc: 'spiceis', name: '향료 항로', nat: '포르투갈', from: '말라카', to: '몰루카(향료제도)',
      home: [0, 1, 2, 5], far: [8],
      goods: ['clove', 'nutmeg', 'sandalwood', 'pepper'], back: ['calico', 'cottoncloth', 'silver', 'guns'],
      lane: [[102.2, 2.2], [106, -2.5], [112, -5.5], [120, -6.5], [127, -5], [129.9, -4.5], [127.4, 0.8]] },
    { id: 'west', disc: 'westroute', name: '서회 항로', nat: '카스티야', from: '세비야', to: '산토도밍고·아바나',
      home: [0, 1, 2], far: [10],
      goods: ['sugar', 'tobacco', 'cacao', 'hides', 'allspice', 'dye', 'silver'], back: ['wine', 'olive', 'woolcloth', 'wheat', 'horses', 'guns'],
      lane: [[-6.4, 36.6], [-15.5, 28], [-35, 21], [-61, 16], [-69.9, 18.3], [-82.4, 23.2], [-76, 30], [-50, 37], [-28, 38.6], [-9.5, 37]] },
    { id: 'pacific', disc: 'newstrait', name: '신세계 항로 (태평양)', nat: '카스티야', from: '아카풀코', to: '마닐라',
      home: [10], far: [6, 8],
      goods: ['cnsilk', 'porcelain', 'silkraw', 'clove'], back: ['silver', 'cacao'],
      lane: [[-99.9, 16.7], [-115, 14], [-140, 13], [-170, 13], [165, 13.5], [144.8, 13.4], [125, 13], [120.9, 14.5]] },
    { id: 'malacca', disc: 'malacca', name: '말라카 항로', nat: '포르투갈', from: '고아', to: '말라카',
      home: [5, 0, 2], far: [8],
      goods: ['pepper', 'tin', 'sandalwood', 'gold'], back: ['calico', 'cottoncloth', 'chintz', 'silver'],
      lane: [[73.8, 15.4], [75.8, 9.5], [80, 5.6], [88, 5.8], [95, 6], [99, 4.5], [102.2, 2.2]] },
    { id: 'china', disc: 'china', name: '중국 항로', nat: '포르투갈', from: '말라카', to: '마카오·광저우',
      home: [0, 1, 2, 8], far: [6],
      goods: ['cnsilk', 'porcelain', 'tea', 'silkraw', 'musk'], back: ['silver', 'pepper', 'guns', 'woolcloth'],
      lane: [[102.2, 2.2], [105, 5], [109, 11.5], [111.5, 17.5], [113.5, 22.1]] },
    { id: 'japan', disc: 'zipang', name: '일본 항로', nat: '포르투갈', from: '마카오', to: '나가사키',
      home: [6, 0], far: [9],
      goods: ['silver', 'copper', 'eaart'], back: ['cnsilk', 'silkraw', 'guns', 'porcelain'],
      lane: [[113.5, 22.1], [118, 23.5], [122, 26.5], [126, 30], [129.8, 32.7]] }
  ];
})(window.G = window.G || {});
