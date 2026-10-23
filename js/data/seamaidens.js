/* 남쪽 바다의 두 아가씨 (만나는 일은 js/systems/seamaidens.js). 2026-10-24 사용자 요청
   ■ 떰 (Tấm) — 베트남 옛이야기 「떰과 깜」의 착한 언니. 새어머니와 새동생 깜의 구박을 받으며 바닷가에서 새우와 물고기를 잡는다.
     세공·회계·항해 3 · 동남아시아토착어 3 (사용자 메모 「깜: 세공, 회계, 항해 LV3」 — 동료가 되는 떰의 능력으로 읽었다)
   ■ 마리아 (Maria) — 필리핀 루손의 라구나 호숫가 처녀. 타갈로그 사람들은 악어를 「누노(할아버지)」라 부르며 조상의 넋으로 모셨다.
     세공·과학·웅변 3 · 동남아시아토착어 3 · 에스파냐어 2
   · 둘 다 품삯을 받지 않는 옛이야기 동료(tale) — 술집에는 나오지 않고 사건으로만 만난다 (eventOnly)
   · 그림: images/portraits/legendary/tam(·_half) · maria(·_half), 장면 images/legend-events/tam_*·maria_* — Codex가 그린다 (images/legend-events/SEA_MAIDENS_PROMPT.md)
   · 마리아의 악어가 건네는 보석: 아이템 buwaya_pearl */
(function (G) {
  'use strict';
  function add(m) {
    m.tale = true; m.legend = true; m.fame = 0; m.wage = G.taleWage ? G.taleWage(m) : 0; m.reg = []; m.face = 'portraits/legendary/' + m.pic; m.eventOnly = true;
    if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }
  }
  add({ id: 'tam', name: '떰', short: '떰', g: 'f', style: 'se', role: 'noble', tone: 'warm', pic: 'tam', age: 'young',
    st: [58, 80, 42, 94], sk: { craft: 3, acct: 3, nav: 3 }, skBoost: 1, lg: { 12: 3, 7: 1 }, y: [1480, 1750],
    desc: '안남 바닷가 마을의 처녀. 어머니를 일찍 여의고 새어머니와 새동생 깜의 구박 속에 자랐다. 새벽마다 바구니를 들고 갯벌에서 새우와 물고기를 잡았고, 밤에는 베틀에 앉아 옷감을 짰다. 바느질과 수놓기에 솜씨가 좋고, 장에서 물고기 값을 셈하는 데도 밝으며, 바람과 물때를 읽어 조각배를 몬다. 자신을 미워한 사람들에게도 끝내 손을 내미는 사람이다.' });
  add({ id: 'maria', name: '마리아', short: '마리아', g: 'f', style: 'se', role: 'noble', tone: 'polite', pic: 'maria', age: 'young',
    st: [55, 86, 40, 90], sk: { craft: 3, sci: 3, speech: 3 }, skBoost: 1, lg: { 12: 3, 0: 2 }, y: [1565, 1760],
    desc: '루손 섬 라구나 호숫가에서 자란 타갈로그 처녀. 할머니에게서 숲과 물가 짐승들의 이름과 약초를 배웠고, 악어를 「누노(할아버지)」라 부르며 조상의 넋으로 모신다. 조개와 진주를 깎아 장신구를 만들고, 성당의 신부와도 마을 어른들과도 막힘없이 말을 나눈다. 사람들은 그녀가 마킬링 산의 여신을 닮았다고 수군거린다.' });

  // 마리아의 악어가 물어다 준 보석 (시장에서는 팔지 않는다)
  if (G.ITEMS && G.ITEM && !G.ITEM.buwaya_pearl) {
    var it = { id: 'buwaya_pearl', name: '누노의 흑진주', kind: 'treasure', price: 9000, gv: 30, reg: [], desc: '라구나 호수의 늙은 악어가 물속에서 물어 올린 엄지손가락만 한 흑진주. 옛날 가라앉은 배의 보물이라고도, 호수 여신의 눈물이라고도 한다.' };
    G.ITEMS.push(it); G.ITEM[it.id] = it;
  }
})(window.G = window.G || {});
