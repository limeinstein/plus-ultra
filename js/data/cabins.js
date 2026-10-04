/* 기함의 선실 — 종류와 쓰임 (규칙은 js/systems/cabins.js, 화면은 js/ui/cabinview.js, 조정값은 js/data/base.js 의 G.BALANCE.cabins)
   · fixed: 어느 배에나 있는 자리 (고칠 수 없다). role: 그 자리에 앉는 사람은 「부하편성」의 그 역할과 같다.
   · skills: 이 방에 배치된 부하의 이 특기가 함대에 쓰인다(역할이 없어도). 방의 힘 = 1 + 그 특기 가운데 가장 높은 단계.
   · cost·days: 조선소에서 이 방으로 고치는 값(금화)과 날수. */
(function (G) {
  'use strict';
  G.CABINS = [
    { id: 'captain', name: '함장실', icon: 'crown', fixed: true, who: 'admiral', desc: '제독의 방. 해도와 일지가 놓여 있다.' },
    { id: 'adjutant', name: '부관실', icon: 'people', fixed: true, role: 'first', desc: '부관이 머문다. 전투·교섭·의술 같은 특기를 제독 대신 맡고, 부하들의 불만을 다독인다.', fx: '달마다 부하들의 충성이 조금 오른다' },
    { id: 'helm', name: '조타실', icon: 'wheel', fixed: true, role: 'nav', desc: '항해사가 키를 잡는다. 항해술·운용술이 함대에 쓰인다.', fx: '날마다 쌓이는 피로가 준다' },
    { id: 'lookout', name: '파수대', icon: 'telescope', fixed: true, role: 'surveyor', desc: '돛대 꼭대기의 망루. 측량사가 오르면 측량·역사학이 쓰이고 먼 곳의 발견물을 먼저 알아본다.', fx: '발견물을 알아보는 거리가 는다' },
    { id: 'deck', name: '갑판', icon: 'ship', fixed: true, skills: ['ops', 'sword'], desc: '갑판을 맡은 사람이 선원들을 부린다.', fx: '규율이 덜 떨어진다' },
    { id: 'hold', name: '빈 선실', icon: 'sack', cost: 0, days: 0, desc: '아직 쓰임을 정하지 않은 방. 조선소에서 고칠 수 있다.' },
    { id: 'chart', name: '지도 제작실', icon: 'chart', skills: ['survey', 'art'], cost: 1400, days: 3, desc: '측량한 것을 해도로 옮긴다.', fx: '해도에 밝혀지는 넓이가 는다' },
    { id: 'galley', name: '요리실', icon: 'bread', skills: ['cook'], cost: 900, days: 2, desc: '따뜻한 끼니를 짓는 부엌.', fx: '피로가 덜 쌓이고, 별미를 차리는 일이 잦아진다' },
    { id: 'mess', name: '식당', icon: 'mug', skills: ['cook', 'speech'], cost: 800, days: 2, desc: '선원들이 둘러앉아 먹고 쉬는 곳.', fx: '피로와 규율을 조금씩 돌본다' },
    { id: 'account', name: '회계실', icon: 'coin', skills: ['acct'], role: 'purser', cost: 1200, days: 2, desc: '경리가 장부를 맞춘다. 이 방에 앉은 사람이 경리다.', fx: '값 깎기가 잘 통하고 급료가 덜 든다' },
    { id: 'chapel', name: '예배실', icon: 'pray', skills: ['theo'], cost: 1000, days: 2, desc: '기도하고 마음을 다잡는 방.', fx: '규율이 덜 떨어진다' },
    { id: 'sick', name: '진료실', icon: 'cross', skills: ['med', 'sci'], cost: 1500, days: 3, desc: '아픈 선원을 누이고 돌본다.', fx: '괴혈병이 느리게 번진다' },
    { id: 'rec', name: '오락실', icon: 'dice', skills: ['music'], cost: 900, days: 2, desc: '노래와 놀이로 시름을 잊는 방.', fx: '규율이 덜 떨어지고, 뱃노래가 자주 울린다' },
    { id: 'rig', name: '조범실', icon: 'sail', skills: ['nav', 'ops'], cost: 1600, days: 3, desc: '돛과 밧줄을 맡은 사람들의 자리.', fx: '함대가 조금 빨라진다' },
    { id: 'repair', name: '선박 수리실', icon: 'hammer', skills: ['ship'], cost: 1500, days: 3, desc: '목수의 연장과 자재를 둔다.', fx: '바다 위에서 기함을 더 빨리 고친다 (자재가 있어야 한다)' },
    { id: 'pen', name: '사육실', icon: 'horse', skills: ['sci'], cost: 1100, days: 2, desc: '닭·염소를 길러 달걀과 젖을 얻는다.', fx: '날마다 식량이 조금 생긴다' },
    { id: 'gun', name: '포격실', icon: 'cannon', skills: ['gun'], cost: 1800, days: 3, desc: '포수들이 화약과 포탄을 다룬다.', fx: '기함의 포격이 세진다' },
    { id: 'marine', name: '해병 대기실', icon: 'sword', skills: ['sword', 'shoot'], cost: 1600, days: 3, desc: '백병전에 나설 사람들이 기다린다.', fx: '기함의 백병전이 세진다' },
    { id: 'interp', name: '통역실', icon: 'scroll', skills: [], lang: true, cost: 700, days: 1, desc: '여러 나라 말을 아는 사람의 방. 이 방에 있는 사람의 말도 통역으로 쓰인다.', fx: '이 방 사람의 말이 통역에 쓰인다' }
  ];
  G.CABIN = {};
  G.CABINS.forEach(function (c) { G.CABIN[c.id] = c; });
})(window.G = window.G || {});
