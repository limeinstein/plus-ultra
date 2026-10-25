/* 정글의 사내 — 타잔 (만나는 일은 js/systems/tarzan.js). 2026-10-25 사용자 요청
   · 시에라리온 동쪽 정글에서 야영하며 「사냥한다」 → 덤벼든 짐승 떼를 이끄는 사람이 있다 → 계속 공격 · 일기토(의학을 아는 사람이 있을 때) · 설득(물건 하나를 건넨다)
   · 운용술 3 · 검술 3 · 무력 93. 사람의 말을 모른다(lg 없음) — 함께 지낸 지 90일이 지나야 말이 통한다
   · 배에서 지내며 제독과 동료들에게서 솜씨를 빠르게 배운다 — 3년(36달) 동안 새 솜씨 9가지가 3단계에 이른다 (G.Tarzan.learn)
   · 품삯을 받지 않는 옛이야기 동료(tale) — 술집에는 나오지 않고 사건으로만 만난다 (eventOnly)
   · 그림: images/portraits/legendary/tarzan(·_half), 장면 images/legend-events/tarzan_* — images/legend-events/TARZAN_PROMPT.md */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.tarzan = G.BALANCE.tarzan || {
    box: { east: 2.6, south: 7.2, north: 9.9 },   // 시에라리온 항구(경도)에서 동쪽으로 east도, 위도 south~north 안의 밀림·숲
    beasts: 10,          // 덤벼드는 짐승 수
    haltTurn: 1,         // 첫 차례가 끝나면 짐승들이 물러서고 사람이 보인다
    coolAttack: 365,     // 계속 공격해 다쳐 사라지면 — 상처가 아물 때까지(날)
    coolLose: 60,        // 일기토에서 지면
    muteDays: 90,        // 말이 통하지 않는 날
    learnMonths: 36,     // 새 솜씨를 다 배우는 달 수 (3년)
    learnSkills: 9,      // 3단계에 이르는 새 솜씨 수
    duel: { str: 92, atk: 14, def: 6, skill: 3, mar: 93, int: 40, cha: 30 }
  };
  var m = { id: 'tarzan', name: '타잔', short: '타잔', g: 'm', style: 'ne', role: 'soldier', tone: 'rush', pic: 'tarzan', age: 'young',
    st: [92, 58, 93, 52], sk: { ops: 3, sword: 3 }, skBoost: 1, lg: {}, y: [1480, 1760],
    desc: '아기 때 난파한 배에서 홀로 살아남아 서아프리카 밀림의 짐승들 손에 자란 사내. 나무에서 나무로 덩굴을 타고 날며, 맨손으로 표범과 씨름한다. 사자와 하이에나와 유인원이 그를 무리의 우두머리로 따른다. 사람의 말은 한마디도 모르지만, 무엇이든 한 번 보면 따라 하고 두 번 보면 익힌다.' };
  m.tale = true; m.legend = true; m.fame = 0; m.wage = G.taleWage ? G.taleWage(m) : 0; m.reg = []; m.face = 'portraits/legendary/' + m.pic; m.eventOnly = true;
  if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }
})(window.G = window.G || {});
