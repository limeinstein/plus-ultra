/* 이야기 속 동료 열 사람 — 역사책에는 없는, 이 게임만의 항해사들. 1480년부터 저마다의 고향 술집·여관에서 만날 수 있다.
   그림: images/portraits/mates/<id>.webp (흉상 448×448) · <id>_half.webp (무릎상 1024×1536, 투명)
   항해사 한 사람의 꼴은 js/data/people.js 의 G.MATES 와 같다 (st = [힘, 지력, 무력, 매력], lg = {말 번호: 단계}, reg = 고장).
   돌아다니는 곳은 G.MATE_RANGE (js/data/materange.js 다음에 읽는다). */
(function (G) {
  'use strict';
  var CREW = [
    { id: 'monteiro', name: '루이스 몬테이루', g: 'm', style: 'ib', st: [70, 46, 72, 82], sk: { ops: 2, nav: 1, sword: 1 }, lg: { 1: 3, 0: 2 }, fame: 0, wage: 55,
      y: [1480, 1545], reg: [0], zones: ['iberia', 'wafrica'], home: 0,
      desc: '붉은 띠를 두른 낡은 밀짚모자의 젊은 선장. 늘 이를 드러내고 웃으며, 한번 동료로 삼은 사람은 끝까지 지킨다. 왼쪽 눈 아래에 꿰맨 흉터가 있다.' },
    { id: 'deleon', name: '로드리고 데 레온', g: 'm', style: 'ib', st: [82, 40, 92, 36], sk: { sword: 3, ops: 1 }, lg: { 0: 3, 1: 1 }, fame: 300, wage: 110,
      y: [1480, 1535], reg: [0], zones: ['iberia', 'maghreb'], home: 7,
      desc: '기사단을 떠나 떠도는 카스티야의 검객. 허리에 칼 세 자루를 차고 다니며 말수가 적다. 왼쪽 눈을 세로로 지나는 흉터가 있다.' },
    { id: 'vandermeer', name: '마리나 판 데르 메르', g: 'f', style: 'ne', st: [46, 80, 50, 72], sk: { acct: 3, survey: 2, nav: 1 }, lg: { 3: 3, 2: 1, 0: 1 }, fame: 250, wage: 120,
      y: [1480, 1535], reg: [1], zones: ['lowlands', 'britain', 'france'], home: 24,
      desc: '홀란트의 항해사. 해도와 금고를 함께 맡는다. 돈 계산이 빠르고 바람과 물길을 읽는 눈이 밝다. 왼팔에 귤나무 가지와 풍차 문신이 있다.' },
    { id: 'samios', name: '우소포스 사미오스', g: 'm', style: 'gr', st: [52, 64, 58, 62], sk: { shoot: 3, craft: 2, speech: 1 }, lg: { 4: 3, 2: 1, 5: 1 }, fame: 100, wage: 70,
      y: [1480, 1540], reg: [2], zones: ['greece', 'italy'], home: 72,
      desc: '아테네 출신의 저격수이자 도구 제작자. 허풍이 심하고 겁도 많지만, 한번 겨누면 좀처럼 빗나가지 않는다. 주머니마다 손수 만든 도구가 삐죽 나와 있다.' },
    { id: 'beaumont', name: '쥘리앵 드 보몽', g: 'm', style: 'ne', st: [68, 60, 70, 74], sk: { cook: 3, speech: 1 }, lg: { 2: 3, 0: 1 }, fame: 150, wage: 90,
      y: [1480, 1540], reg: [1, 2], zones: ['france'], home: 18,
      desc: '귀족 집안을 나와 배의 부엌을 택한 프랑스의 요리사. 긴 금발로 한쪽 눈을 가렸고, 선단에서 옷깃과 손이 가장 깨끗하다.' },
    { id: 'weiss', name: '안톤 바이스', g: 'm', style: 'ne', st: [40, 72, 30, 68], sk: { med: 3, sci: 2 }, lg: { 3: 3, 2: 1 }, fame: 50, wage: 60,
      y: [1480, 1545], reg: [1], zones: ['germany', 'france'], home: 55,
      desc: '스위스 서약동맹에서 온 젊은 약초사. 장밋빛 펠트 모자에 순록 모양 청동 브로치를 달았다. 키는 작아도 약초와 의술 도구를 다루는 손은 섬세하다.' },
    { id: 'laskaris', name: '니콜레타 라스카리스', g: 'f', style: 'it', role: 'scholar', st: [42, 90, 40, 66], sk: { hist: 3, sci: 2, survey: 1 }, lg: { 4: 3, 2: 3, 5: 1 }, fame: 400, wage: 120,
      y: [1480, 1535], reg: [2], zones: ['italy', 'greece'], home: 29,
      desc: '베네치아에 몸을 의탁한 그리스계 망명 학자. 금속 잠금쇠가 달린 낡은 책을 늘 품고 다니며, 옛 기록과 사라진 땅의 이야기에 밝다.' },
    { id: 'ferraro', name: '프란체스코 페라로', g: 'm', style: 'it', st: [92, 62, 70, 58], sk: { ship: 3, craft: 2 }, lg: { 2: 3 }, fame: 200, wage: 110,
      y: [1480, 1535], reg: [2], zones: ['italy'], home: 28,
      desc: '제노바의 괴짜 조선공. 사고로 잃은 몸을 쇠와 놋쇠로 손수 기워 붙였다고 큰소리친다. 큰 망치 하나로 부서진 배를 하룻밤에 일으켜 세운다.' },
    { id: 'rosenthal', name: '브루노 폰 로젠탈', g: 'm', style: 'ne', st: [44, 64, 60, 76], sk: { music: 3, sword: 1 }, lg: { 3: 3, 2: 1 }, fame: 150, wage: 80,
      y: [1480, 1525], reg: [1], zones: ['germany', 'nordic'], home: 44,
      desc: '신성로마제국에서 온 키 큰 악사. 검은 긴 옷에 상아색 해골 펜던트를 걸었다. 정중하게 인사하고 익살스럽게 웃으며, 그의 노래 한 곡이면 지친 선원들이 다시 일어선다.' },
    { id: 'macleod', name: '이언 맥레오드', g: 'm', style: 'ne', st: [86, 62, 76, 62], sk: { nav: 3, ops: 2 }, lg: { 3: 3 }, fame: 500, wage: 140,
      y: [1480, 1520], reg: [1], zones: ['britain', 'nordic'], home: 42,
      desc: '스코틀랜드의 노장 조타수. 바다색 망토를 청동 물고기 브로치로 여몄다. 거친 바다에서도 키를 놓지 않는 묵직한 사람이다.' }
  ];
  G.STORY_CREW = CREW.map(function (m) { return m.id; });
  CREW.forEach(function (m) {
    var d = {}; for (var k in m) if (k !== 'zones' && k !== 'home') d[k] = m[k];
    if (G.MATES && !G.MATE[d.id]) { G.MATES.push(d); G.MATE[d.id] = d; }
    if (G.MATE_RANGE && !G.MATE_RANGE[m.id]) G.MATE_RANGE[m.id] = { zones: m.zones, home: m.home };
  });
})(window.G = window.G || {});
