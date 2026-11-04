/* 미녀와 야수 — 보르네오 밀림의 짐승 가면 (만나는 일은 js/systems/beautybeast.js · G.Beauty). 2026-11-01 사용자 요청
   · 보몽 부인의 옛이야기(1756, 퍼블릭 도메인)에서 얼개만 빌려 새로 썼다. 마법에 걸린 왕자가 아니라, 얼굴을 가린 몰락한 왕가의 사생아다.
     디즈니 영화에만 나오는 인물(촛대·시계·가스통 등)과 디자인(유리 덮개 속 장미 등)은 쓰지 않는다.
   · 두 사람은 아직 연인이 아니다 — 서로 티격태격하는 사이로 동료가 된다.
       랜던 아이작: 과학 3 · 운용술 3 (「힘쓰는 일」 — 밧줄을 당기고 돛을 다루는 운용술에 담았다) · 체력 92
       에이미 벨라지오: 회계 3 · 역사학 3 · 신학 3 (책 관련 일) — 장미를 다루는 꽃집 아가씨 (성인)
   · 옛이야기 동료(tale) — 술집에는 나오지 않고 사건으로만 만난다 (eventOnly). 품삯은 옛이야기 동료 규칙(G.taleWage)
   그림: images/legend-events/BEAUTYBEAST_PROMPT.md — 사용자 선택 초상 portraits/legendary/beast·beauty를 랜던·에이미에 연결, 장면 legend-events/bb_* */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.beauty = G.BALANCE.beauty || {
    from: 15700101,                 // 1570년부터
    box: [108.6, 119.3, -4.2, 7.1], // 보르네오 섬 [서경, 동경, 남위, 북위] — 뭍(바다·얼음이 아닌 땅)에서만
    city: 170,                      // 브루나이 (동료가 되는 곳 · 소문)
    chance: 0.35,                   // 장미를 지니고 보르네오의 뭍을 걷는 날마다
    sure: 3,                        // 장미를 지닌 채 이만큼 걸으면 반드시 (운이 나빠도)
    beasts: 9,                      // 강가의 짐승 떼
    coolDays: 45,                   // 싸움에 지거나 물러서면 다시 만나기까지
    loyal: 80
  };
  var M = [
    { id: 'landon', name: '랜던 아이작', short: '아이작', g: 'm', style: 'ne', role: 'noble', tone: 'plain', pic: 'beast', age: 'young',
      st: [92, 84, 78, 52], sk: { sci: 3, ops: 3 }, skBoost: 1, lg: { 3: 3, 12: 2, 1: 1 },
      desc: '보르네오 밀림 속 낡은 장미 정원에 숨어 사는 거구의 사내. 바다 건너 어느 왕가의 사생아로 태어났으나, 그 왕가가 무너진 뒤 이복형들이 보낸 자객을 피해 어머니와 함께 이 섬까지 흘러왔다. 멧돼지 엄니와 곰 가죽으로 만든 짐승 가면으로 얼굴을 가린다. 산의 찬물을 물레바퀴로 끌어 열대에서 장미를 살려 낸 자연철학자이자, 혼자서 통나무 다리를 놓는 장사. 말이 짧고 무뚝뚝하다.' },
    { id: 'amy', name: '에이미 벨라지오', short: '벨라지오', g: 'f', style: 'it', role: 'merchant', tone: 'polite', pic: 'beauty', age: 'young',
      st: [55, 88, 30, 92], sk: { acct: 3, hist: 3, theo: 3 }, skBoost: 1, lg: { 2: 3, 12: 2, 1: 2 },
      desc: '브루나이 항구에서 작은 꽃집을 하는 이탈리아 출신 아가씨. 코모 호숫가 벨라지오 마을에서 책 장수였던 아버지를 따라 동방까지 왔다. 장미 접붙이기와 꽃꽂이에 능하고, 아버지가 남긴 책 상자를 끼고 살아 장부·옛 역사·교부들의 글에 두루 밝다. 상냥하지만 할 말은 다 한다. 열대에서 시드는 장미를 살릴 길을 찾아 밀림에 들어갔다가 짐승 떼를 만났다.' }
  ];
  G.BEAUTY_MATES = M.map(function (m) { return m.id; });
  M.forEach(function (m) {
    m.tale = true; m.legend = true; m.fame = 0; m.wage = G.taleWage ? G.taleWage(m) : 0; m.y = [1550, 1700]; m.reg = []; m.face = 'portraits/legendary/' + m.pic; m.eventOnly = true;
    if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }
  });
  if (G.ITEMS && G.ITEM && !G.ITEM.beast_mask) {
    var it = { id: 'beast_mask', name: '짐승 가면의 엄니 한 쌍', kind: 'keepsake', price: 0, gv: 18, reg: [],
      desc: '랜던 아이작의 짐승 가면에서 떨어져 나온 멧돼지 엄니 한 쌍. 보르네오 강가에서 짐승 떼와 싸우던 날 부러졌다. 에이미 벨라지오는 「이게 없으니 좀 덜 무섭네요」라며 웃었다.' };
    G.ITEMS.push(it); G.ITEM[it.id] = it;
  }
})(window.G = window.G || {});
