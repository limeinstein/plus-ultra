/* 셰익스피어와 글로브 극장의 불 — 앤 해서웨이의 불멸의 사랑 (사건: js/systems/globe.js). 2026-10-30 사용자 요청
   「셰익스피어와 지구(글로브) 극장 화재 사건 그리고 앤 해서웨이의 불멸의 사랑 — 그날 둘은 사라지고 항해사가 되어 바다에서 이야기를 노래한다」
   ■ 동료 앤 해서웨이 (실존 인물, 1556~): 스트랫퍼드 곁 쇼터리 농가의 딸, 셰익스피어의 아내 — 요리 3 · 의학 2 · 음악 2 · 웅변 1 / 게르만어(영어) 3
     wed: 'shakespeare' — 이미 짝이 있다: 부하끼리의 썸·제독의 청혼 대상이 아니다 (js/systems/romance.js · js/city/matetalk.js 가 d.wed를 본다)
   ■ 인물: 리처드 버비지 (글로브의 으뜸 배우) — 얼굴: images/portraits/history/burbage.webp
   ■ 그림: images/portraits/legendary/anne_hathaway.webp · _half.webp (없으면 코드 초상) */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  if (!F.burbage) F.burbage = { id: 'burbage', name: '리처드 버비지', title: '국왕 극단의 으뜸 배우', st: 'ne', role: 'noble', born: 1567, look: '40대, 굵은 목소리가 들릴 듯한 넓은 가슴, 짧은 수염, 무대 의상인 왕의 붉은 망토와 금관(헨리 8세 역)' };
  G.GLOBE_FIGS = ['burbage'];

  // ── 동료: 앤 해서웨이 (사건으로만)
  var a = { id: 'anne_hathaway', name: '앤 해서웨이', g: 'f', style: 'ne', role: 'maid', tone: 'polite', pic: 'anne_hathaway', age: 'mid',
    st: [56, 74, 40, 80], sk: { cook: 3, med: 2, music: 2, speech: 1 }, skBoost: 1, lg: { 3: 3 },
    desc: '스트랫퍼드 곁 쇼터리 농가의 딸. 열여덟 살 윌리엄 셰익스피어와 혼인했을 때 그녀는 스물여섯이었다. 남편이 런던의 극장에서 스무 해 넘게 이름을 날리는 동안 세 아이를 키우고 집을 지켰다. 1613년 글로브 극장이 불타던 날 남편과 함께 사라졌다 — 그 뒤로 바다 위의 배에서, 남편이 지은 이야기에 가락을 붙여 선원들에게 들려준다. 빵을 굽고 약초를 달이는 솜씨는 런던의 어느 여관 주인도 따라오지 못한다.' };
  a.tale = true; a.legend = true; a.fame = 0; a.wage = 0; a.y = [1613, 1660]; a.reg = []; a.face = 'portraits/legendary/' + a.pic; a.eventOnly = true; a.wed = 'shakespeare';
  if (G.MATES && !G.MATE[a.id]) { G.MATES.push(a); G.MATE[a.id] = a; }
  if (G.MATE && G.MATE.shakespeare && !G.MATE.shakespeare.wed) G.MATE.shakespeare.wed = 'anne_hathaway';   // 셰익스피어도 짝이 있다

  // ── 소지품: 불길에서 건진 원고 궤짝
  if (G.ITEMS && G.ITEM && !G.ITEM.globe_papers) {
    var it = { id: 'globe_papers', name: '불길에서 건진 원고 궤짝', kind: 'special', price: 0, reg: [], rare: true,
      desc: '1613년 6월 29일 글로브 극장이 불탈 때 분장실에서 건져 낸 참나무 궤짝. 셰익스피어가 손으로 쓴 극 원고 묶음이 들어 있다 — 『템페스트』, 『겨울 이야기』, 『맥베스』…. 군데군데 그을음과 앤의 손자국이 남았다.' };
    G.ITEMS.push(it); G.ITEM.globe_papers = it;
  }

  // ── 바다의 이야기 노래 (둘이 함께 배에 있을 때) — [제목, 누가 먼저, 대사(셰익스피어 극·소네트에서 옮김), 덧말]
  G.GLOBE_SONGS = [
    ['『템페스트』 — 다섯 길 물 아래', 'shakespeare', '「다섯 길 물 아래 그대 아버지가 누웠네. 그 뼈는 산호가 되었고, 그 눈은 진주가 되었네.」', '앤이 낮게 가락을 붙이자 망대의 선원까지 내려와 귀를 기울였다.'],
    ['『십이야』 — 비는 날마다 내리네', 'anne_hathaway', '「헤이, 호, 바람과 비 — 비는 날마다 내리네.」', '빗속의 갑판에서 선원들이 발을 구르며 후렴을 따라 불렀다.'],
    ['소네트 116 — 흔들리지 않는 표지', 'shakespeare', '「사랑은 폭풍을 내려다보며 흔들리지 않는 표지, 길 잃은 배마다 비추는 별이오.」', '셰익스피어가 앤의 손을 잡고 읊자, 키잡이가 괜히 헛기침을 했다.'],
    ['『뜻대로 하세요』 — 온 세상이 무대', 'shakespeare', '「온 세상이 무대요, 모든 남녀는 배우일 뿐. 저마다 나가고 들어오는 때가 있지.」', '앤이 웃으며 덧붙였다. 「그렇다면 이 배는 떠다니는 무대네요.」'],
    ['소네트 145 — 미움을 던져 버리고', 'anne_hathaway', '「「미워한다」 — 그 말에서 그녀는 미움을 던져 버리고(hate away), 「당신은 아니에요」 하며 내 목숨을 살렸네.」 …열여덟 살 윌이 내 이름(해서웨이)으로 말장난을 해서 써 준 시예요.', '앤이 시를 읊고 셰익스피어가 얼굴을 붉혔다. 선원들의 휘파람이 쏟아졌다.'],
    ['『템페스트』 — 꿈과 같은 재료', 'shakespeare', '「우리는 꿈과 같은 재료로 만들어졌고, 우리의 짧은 삶은 잠으로 둘러싸여 있다.」', '노을이 지는 동안 아무도 말하지 않았다. 그날 밤 선원들은 오랜만에 깊이 잤다.']
  ];

  // ── 조정값
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.globe = G.BALANCE.globe || {
    song: 0.06, songGap: 20,           // 둘이 함께 배에 있을 때 바다의 하루에 이야기 노래가 벌어질 확률 · 사이 날수
    songFatigue: 10, songDisc: 6,      // 노래의 효과: 피로 − · 규율 +
    path: { trap: 0.7, stair: 0.55, jump: 0.45 },   // 불타는 분장실에 들어가는 길의 성공률 (+ 검술·의학 단계마다 0.05)
    burn: 25                           // 실패하면 제독의 체력 −
  };
})(window.G = window.G || {});
