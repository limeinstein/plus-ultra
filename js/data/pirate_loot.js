/* 이름난 해적의 전리품 — 보물과 명검 (2026-11-19 사용자 요청)
   「해적 토벌에 따른 보상을 5만에서 10만 골드로 늘리고 보물을 받기도 해. 강한 해적은 40 이상의 공격력을 가진 검을 가지고 있기도 한다.」
   · 규칙: js/systems/pirate_wanted.js (W.bounty · W.swordOf · W.afterWin) · 조정값: G.BALANCE.wanted.reward·treasure·sword (js/data/base.js)
   · 보물(kind 'treasure'): 이름난 해적을 무찌르면 그 해적의 궤짝에서 나오기도 한다. zones = 그 보물이 잘 나오는 바다 (없으면 어디서나).
   · 명검(kind 'weapon', 공격 40~44): 강한 해적이 허리에 차고 다닌다. 일기토에서 그 검으로 덤비고, 무찌르면 손에 넣는다.
     암시장 명검(45~48)과 엑스칼리버(50)보다는 조금 아래. 바다마다 그 바다 해적다운 칼.
   · 그림: images/items/<id>.webp (없으면 images/item-kinds/weapon·treasure 그림) */
(function (G) {
  'use strict';
  var TREASURE = [
    { id: 'pl_doubloons', name: '에스파냐 금화 궤짝', kind: 'treasure', price: 30000, zones: ['amer', 'atl'], desc: '에스파냐 금화(도블론)가 가득 든 쇠 테 두른 궤짝. 신대륙에서 세비야로 가던 보물선에서 털어 온 것이라 한다.' },
    { id: 'pl_reales', name: '8레알 은화 자루', kind: 'treasure', price: 16000, zones: ['amer', 'atl', 'med'], desc: '포토시 은으로 찍은 8레알 은화를 묵직하게 채운 가죽 자루. 바다 어느 항구에서나 돈으로 통한다.' },
    { id: 'pl_emerald_cross', name: '에메랄드 십자가', kind: 'treasure', price: 28000, zones: ['amer'], desc: '누에바그라나다의 에메랄드를 박은 금 십자가. 어느 성당에 바치러 가던 것을 해적이 가로챘다.' },
    { id: 'pl_ruby_cup', name: '루비 박힌 금잔', kind: 'treasure', price: 34000, zones: ['med', 'ind'], desc: '붉은 루비를 빙 둘러 박은 금잔. 어느 태수의 연회상에 오르던 것이라는 소문이다.' },
    { id: 'pl_pearls', name: '굵은 진주 목걸이', kind: 'treasure', price: 18000, zones: ['ind', 'sea', 'amer'], desc: '엄지손톱만 한 진주를 세 줄로 꿴 목걸이. 진주 캐는 배를 습격해 모은 것이다.' },
    { id: 'pl_jade_seal', name: '비취 인장', kind: 'treasure', price: 22000, zones: ['east', 'sea'], desc: '푸른 비취를 깎아 만든 인장. 손잡이에 용이 서려 있다. 어느 상단 우두머리의 것이었다고 한다.' },
    { id: 'pl_amber', name: '호박 목걸이 상자', kind: 'treasure', price: 14000, zones: ['north'], desc: '발트해의 호박을 갈아 꿴 목걸이가 가득 든 상자. 한자 상선의 짐칸에서 나왔다.' },
    { id: 'pl_silver_bars', name: '은괴 꾸러미', kind: 'treasure', price: 20000, desc: '돛천으로 싼 은괴 여섯 개. 어느 나라 조폐소 도장이 반쯤 갈려 나갔다.' }
  ];
  var SWORDS = [
    { id: 'ps_cutlass', name: '해적왕의 커틀러스', kind: 'weapon', atk: 42, price: 42000, reg: [], rare: true, style: 'slash', zones: ['amer', 'atl'], desc: '카리브를 주름잡던 해적 두목이 휘두르던 넓고 휜 칼. 손을 감싸는 바구니 손잡이에 금박을 입혔다.' },
    { id: 'ps_toledo', name: '톨레도 강철 레이피어', kind: 'weapon', atk: 40, price: 38000, reg: [], rare: true, style: 'thrust', zones: ['atl'], desc: '톨레도 대장간의 강철로 벼린 긴 찌르기 칼. 어느 귀족 선장의 것을 해적이 빼앗아 찼다.' },
    { id: 'ps_kilij', name: '다마스쿠스 킬리지', kind: 'weapon', atk: 43, price: 46000, reg: [], rare: true, style: 'slash', zones: ['med'], desc: '물결무늬가 비치는 다마스쿠스 강철의 휜 칼. 칼끝 쪽이 넓어 한 번 베면 깊이 들어간다. 바르바리 해적 두목의 칼.' },
    { id: 'ps_shamshir', name: '산호 자루 샴시르', kind: 'weapon', atk: 41, price: 40000, reg: [], rare: true, style: 'slash', zones: ['ind'], desc: '붉은 산호로 자루를 깎은 페르시아식 초승달 칼. 인도양 해적이 아라비아 상선에서 얻었다.' },
    { id: 'ps_kris', name: '일곱 굽이 크리스', kind: 'weapon', atk: 40, price: 38000, reg: [], rare: true, style: 'thrust', zones: ['sea'], desc: '칼날이 일곱 번 굽이치는 크리스. 대대로 해협의 두목에게만 물려 왔다는 칼이다.' },
    { id: 'ps_nodachi', name: '왜구의 노다치', kind: 'weapon', atk: 44, price: 48000, reg: [], rare: true, style: 'slash', zones: ['east'], desc: '사람 키만 한 긴 칼. 왜구 두목이 등에 메고 다니며 두 손으로 내리친다.' },
    { id: 'ps_frost', name: '서리 무늬 장검', kind: 'weapon', atk: 41, price: 40000, reg: [], rare: true, style: 'bash', zones: ['north'], desc: '칼날에 서리 같은 무늬가 핀 무거운 북방 장검. 내리치면 방패째 부순다.' }
  ];
  G.PIRATE_TREASURE = TREASURE.map(function (d) { return d.id; });
  G.PIRATE_SWORDS = SWORDS.map(function (d) { return d.id; });
  if (G.ITEMS && G.ITEM) TREASURE.concat(SWORDS).forEach(function (d) {
    if (G.ITEM[d.id]) return;
    if (d.kind === 'treasure') { d.rare = true; d.reg = []; }
    G.ITEMS.push(d); G.ITEM[d.id] = d;
  });
})(window.G = window.G || {});
