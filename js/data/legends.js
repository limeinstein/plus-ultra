/* 전설 속 인물 — 옛이야기에서 걸어 나온 부하 열한 사람. 술집 명부에는 오르지 않고, 정해진 일을 해야 만난다 (js/systems/legends.js).
   · 도원의 세 형제(유비·관우·장비): 탁군 땅을 밟거나, 중국 도시 술집에서 한 번 들른 사이에 술을 세 번 사면 만난다 — 서로 다른 곳에서 세 번 만나면 부하가 된다
   · 제갈량: 유비를 부관으로 두고 여관에 세 번 들르면 찾아온다 (삼고초려를 거꾸로)
   · 달타냥: 프랑스 도시 시장에서 한 번 들른 사이에 물건을 세 번 사면 돈을 빌려 달라고 한다 — 빌려주면 부하가 된다
     달타냥을 데리고 처음 가는 도시 술집에 들어설 때마다 삼총사(아토스·포르토스·아라미스) 가운데 한 사람이 결투를 걸어 온다 — 이기면 부하가 된다
   · 셰헤라자드: 이슬람 도시 도서관에서 한 번 들른 사이에 책을 다섯 권 읽으면 말을 걸어 온다 — 유럽 말·아랍어·페르시아어·아프리카 말에 능하다
   · 알라딘·알리바바: 셰헤라자드를 통역으로 두고 오스만 제국 도시 교역소 출자를 5등급까지 올리면 만난다 (두 사람은 서로 다른 도시에서)
   그림: images/portraits/legendary/<id>.webp (흉상 448×448) · <id>_half.webp (무릎상 1024×1536, 투명) — d.face 로 이어 쓴다.
   항해사 한 사람의 꼴은 js/data/people.js 의 G.MATES 와 같다 (st = [힘, 지력, 무력, 매력], lg = {말 번호: 단계}).
   reg: [] — 고장이 없어 도시를 떠돌지 않는다 (G.MateMove 명부·술집 손님·바다의 배에 나오지 않는다). tale: true (마녀의 legend와 다르다) */
(function (G) {
  'use strict';
  var EU = { 0: 3, 1: 3, 2: 3, 3: 3, 4: 3 };
  function langs(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }
  var L = [
    { id: 'liu_bei', name: '유비', g: 'm', style: 'cn', tone: 'noble', st: [70, 78, 72, 97], sk: { speech: 3, ops: 2, sword: 1 }, lg: { 7: 3 }, wage: 150,
      desc: '탁군 사람. 짚신을 삼아 팔며 살았다지만 귀가 크고 팔이 무릎까지 닿는다. 사람을 믿고 아끼는 마음 하나로 두 아우와 수많은 사람을 따르게 했다.' },
    { id: 'guan_yu', name: '관우', g: 'm', style: 'cn', tone: 'hidden', st: [92, 74, 99, 82], sk: { sword: 3, ops: 2, hist: 1 }, lg: { 7: 3 }, wage: 200,
      desc: '석 자 수염을 쓸어내리는 붉은 얼굴의 장수. 청룡언월도를 들고 『춘추』를 읽는다. 한번 맺은 의리는 목숨보다 무겁게 여긴다.' },
    { id: 'zhang_fei', name: '장비', g: 'm', style: 'cn', tone: 'rush', st: [97, 40, 97, 52], sk: { sword: 3, gun: 1, ops: 1 }, lg: { 7: 3 }, wage: 180,
      desc: '고리눈에 범 같은 수염. 장팔사모를 휘두르면 다리 위의 만 명도 물러선다. 술을 좋아하고 성미가 급하지만 형님 앞에서는 어린애처럼 웃는다.' },
    { id: 'zhuge_liang', name: '제갈량', g: 'm', style: 'cn', tone: 'genius', st: [50, 100, 58, 92], sk: { nav: 3, survey: 3, sci: 2, hist: 2 }, lg: { 7: 3, 13: 1 }, wage: 260,
      desc: '와룡이라 불린 남양의 선비. 흰 깃털 부채를 들고 하늘의 별과 바람을 읽는다. 남동풍을 불러왔다는 그라면 바다의 바람도 그의 편이다.' },
    { id: 'd_artagnan', name: '달타냥', g: 'm', style: 'ne', tone: 'shonen', st: [80, 62, 93, 84], sk: { sword: 3, speech: 1, ops: 1 }, lg: { 2: 3, 0: 1 }, wage: 120,
      desc: '가스코뉴에서 올라온 젊은 검객. 늙은 말 한 마리와 아버지의 편지 한 통이 가진 것의 전부였다. 성미는 급해도 칼끝과 의리는 곧다.' },
    { id: 'athos', name: '아토스', g: 'm', style: 'ne', tone: 'noble', st: [82, 80, 92, 78], sk: { sword: 3, ops: 1, hist: 1 }, lg: { 2: 3, 0: 1, 3: 1 }, wage: 160,
      desc: '삼총사의 맏형. 말수가 적고 술을 많이 마시며, 지난날을 이야기하지 않는다. 몸가짐 하나하나에 숨길 수 없는 귀족의 품이 배어 있다.' },
    { id: 'porthos', name: '포르토스', g: 'm', style: 'ne', tone: 'rush', st: [99, 44, 89, 72], sk: { sword: 2, gun: 1, cook: 1 }, lg: { 2: 3 }, wage: 140,
      desc: '삼총사 가운데 가장 크고 힘센 사내. 금실 어깨띠와 깃털 모자를 자랑하고 잘 먹고 잘 웃는다. 그의 팔 힘이면 돛대 하나쯤은 혼자 세운다.' },
    { id: 'aramis', name: '아라미스', g: 'm', style: 'ne', tone: 'hidden', st: [66, 82, 87, 86], sk: { sword: 3, theo: 2, speech: 1 }, lg: { 2: 3, 0: 1, 4: 1 }, wage: 150,
      desc: '언젠가 사제가 되겠다며 기도서를 품고 다니는 총사. 부드러운 말씨와 고운 손 아래 누구보다 날랜 칼솜씨를 감추고 있다.' },
    { id: 'scheherazade', name: '셰헤라자드', g: 'f', style: 'is', role: 'scholar', tone: 'charm', st: [44, 97, 30, 98], sk: { speech: 3, hist: 2, music: 1, art: 1 },
      lg: langs(EU, { 5: 3, 6: 3, 10: 3 }), wage: 180,
      desc: '천 하루 밤 동안 이야기를 이어 목숨을 건진 이야기꾼. 유럽의 여러 말과 아랍어·페르시아어, 아프리카의 말까지 막힘없이 옮긴다. 이야기가 끝나는 곳에서 늘 다음 이야기가 시작된다.' },
    { id: 'aladdin', name: '알라딘', g: 'm', style: 'is', tone: 'shonen', st: [70, 66, 60, 88], sk: { speech: 2, acct: 2, nav: 1 }, lg: { 5: 3, 6: 2, 4: 1 }, wage: 130,
      desc: '바그다드 뒷골목에서 자란 재빠른 젊은이. 허리춤의 낡은 놋쇠 램프를 아무에게도 만지게 하지 않는다. 문지르면 무엇이 나오는지는 묻지 않는 게 좋다.' },
    { id: 'ali_baba', name: '알리바바', g: 'm', style: 'is', tone: 'merch', st: [76, 64, 58, 72], sk: { acct: 3, ops: 1, craft: 1 }, lg: { 5: 3, 6: 1 }, wage: 130,
      desc: '나무를 하던 가난한 사내였다가 「열려라 참깨」 한마디로 도적 마흔 명의 보물 동굴을 연 사람. 바위가 열리는 소리를 듣는 귀와 장사꾼의 셈을 함께 지녔다.' }
  ];
  G.LEGENDS = L.map(function (m) { return m.id; });
  L.forEach(function (m) {
    m.tale = true; m.fame = 0; m.y = [1480, 1700]; m.reg = []; m.face = 'portraits/legendary/' + m.id;
    if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }
  });
})(window.G = window.G || {});
