/* 정글북 — 늑대 손에 자란 청년 모글리 (만나는 일은 js/systems/junglebook.js). 2026-10-26 사용자 요청 · 2026-10-28 QA에서 게임에 연결
   · 키플링의 『정글북』(1894, 퍼블릭 도메인)을 바탕으로 새로 썼다. 디즈니 영화에만 나오는 인물(오랑우탄 왕 「루이」 등)·디자인은 쓰지 않는다.
   · 모글리는 스무 살 남짓한 청년 — 늑대 무리에서 자라 정글의 짐승 말을 안다 (그림: Codex가 만든 portraits/legendary/mowgli·_half)
   · 세공·사격·측량·조선기술 3. 사람의 말은 모른다 — 배에 오른 뒤 90일 동안 힌두어·아프리카토착어·동남아시아토착어·페르시아어를 3단계까지 익힌다
   · 옛이야기 동료(tale) — 술집에는 나오지 않고 사건으로만 만난다 (eventOnly). 품삯은 옛이야기 동료 규칙(G.taleWage)
   · 장면: 바나나 도둑·수수께끼·사람의 모습(mowgli_bananas·_riddle·_human), 합류할 때 어미 늑대와의 작별(mowgli_farewell)을 보인다 */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.jungleBook = G.BALANCE.jungleBook || {
    city: 145,            // 델리
    radius: 3.0,          // 델리에서 이만큼(도) 안의 숲 — 게임 지도의 델리 둘레는 메마른 땅으로 칠해져 있어, 지형 대신 이 둘레를 「델리 근처 숲」으로 본다
    banana: 10,           // 바나나가 이만큼 있어야 일이 시작된다
    steals: 2,            // 걸을 때마다 바나나가 사라지는 날 — 이만큼 사라진 다음 날 오랑우탄들과 마주친다
    stealN: [1, 3],       // 하루에 사라지는 바나나
    fee: 3,               // 일이 끝난 뒤 오랑우탄들이 가져가는 바나나
    coolDays: 30,         // 수수께끼를 못 풀면
    langDays: 90,         // 이 날 수 동안 네 가지 말을 3단계까지
    langs: [8, 10, 12, 6] // 힌두어 · 아프리카토착어 · 동남아시아토착어 · 페르시아어 (G.LANGS)
  };
  var m = { id: 'mowgli', name: '모글리', short: '모글리', g: 'm', style: 'in', role: 'soldier', tone: 'rush', pic: 'mowgli', age: 'young',
    st: [74, 72, 82, 70], sk: { craft: 3, shoot: 3, survey: 3, ship: 3 }, skBoost: 1, lg: {}, y: [1480, 1760],
    desc: '갓난아기 때 정글에서 늑대 무리에게 거두어져 자란 스무 살 남짓한 청년. 곰에게서 정글의 법을, 흑표범에게서 사냥을 배웠고, 짐승들의 말을 모두 알아듣는다. 나무 덩굴로 다리를 엮고 뗏목을 묶는 솜씨, 돌팔매로 날아가는 새를 떨어뜨리는 눈, 별과 강물로 길을 찾는 감이 남다르다. 짐승들은 그를 「사람 새끼」라 부르지만, 정작 그는 사람이 무엇인지 아직 모른다.' };
  m.tale = true; m.legend = true; m.fame = 0; m.wage = G.taleWage ? G.taleWage(m) : 0; m.reg = []; m.face = 'portraits/legendary/' + m.pic; m.eventOnly = true;
  if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }
})(window.G = window.G || {});
