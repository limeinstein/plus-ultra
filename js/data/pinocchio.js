/* 피노키오 — 고래를 쫓는 어촌의 철없는 사내 (만나는 일은 js/systems/pinocchio.js). 2026-10-25 사용자 요청
   · 고래를 5번 넘게 만난 뒤, 대양(대서양·태평양·인도양)에서 또 고래를 만나면: 고래에게 삼켜진 아버지 제페토를 구해 달라는 사내의 작은 고깃배.
   · 제페토를 구해 둘을 태우고 가까운 도시에 내려 주면, 제페토가 「사내라면 본받을 만한 사람을 따라가는 거다」 하며 아들을 맡긴다.
   · 항해술·측량·과학·조선기술 3 / 로망스어(이탈리아 말) 3
   · 제페토가 떠나며 「아들의 분신」 피노키오 인형(소지품)을 준다 — 뱃노래가 울릴 때 50% 확률로 춤춰 음악 효과 ×1.5 (G.Pino.dance)
   · 그림: images/portraits/legendary/pinocchio.png (얼굴상) · pinocchio_half.png (무릎상) — 없으면 코드 초상(이탈리아 양식).
     제페토: portraits/legendary/geppetto (없으면 코드 초상) · 장면: legend-events/pinocchio_whale · legend-events/geppetto_farewell
     카를로 콜로디의 소설(1883) 속 이야기를 빌렸지만, 여기서는 나무 인형이 아니라 바닷가 어촌의 진짜 사람 — 서른이 다 되도록 철이 안 든 어른이다 (2026-10-25 사용자 요청: 아이 아님). 뒤에 나온 영화의 모습(이름 붙은 고래, 귀뚜라미 따위)은 쓰지 않는다. */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.pinocchio = G.BALANCE.pinocchio || {
    need: 5,            // 고래를 이만큼 만난 뒤(바다의 사건 「고래 떼」·고래 발견물) 대양에서 또 만나면 벌어진다
    coolDays: 40,       // 지나쳐 가면 이만큼 뒤에야 대양의 고래와 함께 다시 만난다
    chase: 3,           // 「지칠 때까지 따라간다」를 고르면 걸리는 날수 (식량·물이 그만큼 든다)
    fatigue: 12,        // 「횃불 보트로 고래 입속에 들어간다」를 고르면 피로 +
    fame: 40,           // 제페토를 구하면 명성(모험) +
    loyal: 85,          // 합류할 때 충성
    doll: { chance: 0.5, mult: 1.5 }   // 피노키오 인형: 뱃노래(음악 사건)가 벌어질 때 이 확률로 춤춘다 → 피로 풀림·규율 오름 × mult
  };
  // 제페토가 떠나며 준 「아들의 분신」 (소지품 — 기념품). 그림: images/items/pinocchio_doll.webp (없으면 기념품 갈래 그림)
  if (G.ITEMS && G.ITEM && !G.ITEM.pinocchio_doll) {
    var doll = { id: 'pinocchio_doll', name: '피노키오 인형', kind: 'special', price: 0, reg: [], rare: true,
      desc: '제페토가 고래 배 속에서 난파선 판자로 깎은 나무 인형. 아들을 다시 못 볼까 봐 그 얼굴을 떠올리며 깎았다고 한다. 코가 조금 길다. 선실에서 뱃노래가 울리면 이따금 실에 매달린 팔다리를 들썩이며 춤을 춘다 — 그 춤사위에 노래가 더 신이 난다 (뱃노래 때 50% · 피로 풀림·규율 오름 ×1.5).' };
    G.ITEMS.push(doll); G.ITEM.pinocchio_doll = doll;
  }
  var m = { id: 'pinocchio', name: '피노키오', g: 'm', style: 'it', role: 'sailor', tone: 'rush', pic: 'pinocchio', age: 'mid', beard: 0,
    st: [64, 68, 56, 72], sk: { nav: 3, survey: 3, sci: 3, ship: 3 }, skBoost: 1, lg: { 2: 3 },   // skBoost: 정해 준 능력 그대로 · 로망스어(이탈리아 말)
    desc: '토스카나 바닷가 어촌의 목수 제페토의 외아들. 해진 조끼를 걸치고 낡은 그물을 기워 쓰는 가난한 어부다. 서른이 다 되도록 아버지 집에 얹혀살며 아버지 말은 귓등으로 듣는다. 허풍이 세서, 비 오는 날 집채만 한 고래를 봤다고 큰소리를 치고는 그 고래를 잡겠다며 혼자 고깃배를 몰고 나가 늘 빈손으로 돌아왔다. 거짓말을 할 때마다 코끝이 새빨개지는 버릇이 있다. 아버지가 고래에게 삼켜진 날부터 다시는 거짓말을 하지 않기로 했다. 아버지에게 배운 대로 배 판자 한 장, 별 하나, 물결 한 줄을 허투루 보지 않는다.' };
  // 아이가 아니다 — 철없는 어른 (minor 아님 · 2026-10-25 사용자 요청)
  m.tale = true; m.legend = true; m.fame = 0; m.wage = G.taleWage ? G.taleWage(m) : 0; m.y = [1480, 1700]; m.reg = []; m.face = 'portraits/legendary/' + m.pic; m.eventOnly = true;
  if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }
})(window.G = window.G || {});
