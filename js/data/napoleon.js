/* 나폴레옹과 조제핀 — 바다에서 건진 소년과 빈의 살롱 (만나는 일은 js/systems/napoleon.js). 2026-10-23 사용자 요청
   · 1510년부터 코르시카 바다에서 해적을 포격으로 무찌르면 바다에 빠진 소년 나폴레옹을 건지고, 다시 해적을 백병전으로 이기면 사로잡힌 그의 가족을 구한다 — 그가 바다 사나이가 된다.
   · 그를 데리고 오스트리아의 도시에 가면 조제핀 드 보아르네를 만나고, 나폴레옹이 제독의 물건을 훔쳐 바치려다 들킨다 — 일기토에서 이기면 둘 다 동료가 된다.
   · 역사의 나폴레옹(1769~1821)과 조제핀(1763~1814)을 이 게임의 전설 동료로 옮겨 온 것이다 (피터 팬·동화 동료와 같은 「이야기 속 동료」).
   · 그림: images/portraits/legendary/napoleon · josephine · letizia_bonaparte · joseph_bonaparte (각 .webp · _half.webp) — 주문서 images/legend-events/NAPOLEON_PROMPT.md. 없으면 그린 얼굴. */
(function (G) {
  'use strict';
  function add(m) {
    m.tale = true; m.legend = true; m.fame = 0; m.wage = G.taleWage ? G.taleWage(m) : (m.wage || 0); m.y = [1480, 1700]; m.reg = []; m.face = 'portraits/legendary/' + m.pic; m.eventOnly = true;
    if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }
  }
  add({ id: 'napoleon', name: '나폴레옹 보나파르트', g: 'm', style: 'it', role: 'soldier', tone: 'shonen', pic: 'napoleon', age: 'young',
    st: [66, 90, 82, 74], sk: { gun: 3, shoot: 3, speech: 3, ops: 3, ship: 3, survey: 3, hist: 3, sci: 3, music: 2, sword: 2, nav: 1, art: 1 }, skBoost: 1,
    lg: { 2: 3, 0: 3, 1: 3, 3: 3, 4: 3, 5: 3, 10: 3 },   // 2026-10-23 사용자 지정: 포술·사격술·웅변·운용술·조선기술·측량·역사학·과학 3, 음악·검술 2, 항해술·그림 1 · 말: 로망스어·스페인어·포르투갈어·게르만어·슬라브·그리스어·아랍어·아프리카토착어
    desc: '코르시카 아작시오의 보나파르트 집안 둘째 아들. 키는 작지만 눈빛이 매섭고, 해도와 대포 이야기만 나오면 밤을 샌다. 해적에게 가족을 잃을 뻔한 날 바다에 뛰어들었다가 제독의 배에 건져졌다. 「대포는 멀리서 이기는 법이고, 백병전은 가까이서 지키는 법」이라는 말을 입버릇처럼 한다. 사랑에는 서툴러서 한번 빠지면 앞뒤를 가리지 않는다.' });
  add({ id: 'josephine', name: '조제핀 드 보아르네', g: 'f', style: 'it', role: 'noble', pic: 'josephine', age: 'adult',
    st: [46, 76, 28, 96], sk: { speech: 3, music: 2, art: 2, acct: 2 }, skBoost: 1, lg: { 2: 3, 3: 2 },   // 웅변 3 — 살롱의 여주인 · 로망스어·게르만어
    desc: '카리브 마르티니크섬의 사탕수수 농장에서 자라 빈의 살롱에 흘러든 여인. 웃음 한 번에 사교계가 그녀 쪽으로 돌아앉는다. 장미와 비단, 빚과 소문을 모두 다룰 줄 알며, 남자들의 허세를 꿰뚫어 보는 눈이 있다. 나폴레옹을 조르던 것은 장난이었지만, 그를 칼 한 자루로 꺾고도 웃어 넘긴 제독에게는 장난이 아닌 눈빛을 보낸다.' });
  var B = G.BIOS = G.BIOS || {};
  if (!B['나폴레옹 보나파르트']) B['나폴레옹 보나파르트'] = '코르시카 아작시오 출신. 역사에서는 포병 장교로 출세해 1804년 프랑스 황제가 되었고 유럽 대부분을 휩쓸었다. 이 게임에서는 해적에게 가족을 잃을 뻔한 소년으로 제독의 배에 오른다.';
  if (!B['조제핀 드 보아르네']) B['조제핀 드 보아르네'] = '카리브의 마르티니크섬에서 태어나 파리 사교계의 꽃이 된 여인. 역사에서는 1796년 나폴레옹과 혼인해 프랑스 황후가 되었다. 이 게임에서는 빈의 살롱에서 나폴레옹의 마음을 흔든다.';
})(window.G = window.G || {});
