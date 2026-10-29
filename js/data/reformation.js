/* 루터의 종교 개혁 — 면죄받은 자들 (추리 수사극, 사건은 js/systems/reformation.js). 2026-10-29 사용자 요청
   · 마그데부르크(도시 50 — 루터가 소년 시절 학교를 다닌 곳, 뒷날 그의 후원자 자리 de_luther가 있는 곳)
   · 마르틴 루터 — 대화 얼굴은 이미 있는 후원자 그림(portraits/sponsors/de_luther)
   · 카타리나 폰 보라 — 이 게임에서는 스물넷의 성인 수녀로 그린다. (실제 역사에서는 1499년에 태어났다 — 이 사건의 무대 1499~1510년에 맞춰 나이를 바꾸었다)
   · 추기경 오토 폰 그라우엔펠스 · 비서 루프레히트 · 참사회원 볼프강 · 비단 상인 콘라트 · 기사 쿠르트 — 지어낸 인물
   · 요한 테첼 — 실제 면죄부 설교사 (그 유명한 노랫말만 빌린다)
   그림: images/legend-events/REFORMATION_PROMPT.md */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.reform = G.BALANCE.reform || {
    city: 50,              // 마그데부르크
    from: 14990101, to: 15101231,   // 술을 싣고 루터를 처음 만날 수 있는 때
    until: 15171030,       // 수사를 마칠 수 있는 마지막 날 (95개조 전날)
    wine: 10,              // 단서 ① 참사회원의 포도주
    beer: 10,              // 단서 ② 수도사들의 맥주
    feast: 20,             // 단서 ③ 추기경의 연회에 들일 술 (포도주·맥주·브랜디·럼 아무것이나)
    guards: 40,            // 고발한 밤, 추기경의 사병
    chest: 3000,           // 추기경의 금고에서 나온 몫
    wrongMax: 2,           // 추리에서 이만큼 틀리면 그날은 고발하지 못한다
    fame: 200, trust: 20
  };
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    lu_luther: { name: '마르틴 루터', title: '젊은 학생 · 아우구스티노회 수도사', st: 'ne', role: 'priest', face: 'portraits/sponsors/de_luther', born: 1483,
      look: '20대, 각진 턱과 짙은 눈썹, 꿰뚫어 보는 검은 눈, 검은 아우구스티노회 수도복과 삭발한 정수리, 손에 낡은 성서' },
    lu_katharina: { name: '카타리나 폰 보라', title: '수녀 (이 게임에서는 스물넷의 성인)', st: 'ne', role: 'maid', g: 'f',
      look: '24세 성인 여성, 단정한 얼굴에 곧은 콧날, 또렷하고 단호한 회색 눈, 흰 두건과 검은 수녀복, 허리에 열쇠 꾸러미, 팔짱을 낀 꼿꼿한 자세' },
    lu_cardinal: { name: '그라우엔펠스 추기경', full: '오토 폰 그라우엔펠스', title: '추기경 · 수녀원과 면죄부 금고를 거느린 이', st: 'ne', role: 'priest', fiction: true,
      look: '50대, 살진 볼과 번들거리는 입술, 붉은 추기경 모자와 망토, 손가락마다 보석 반지, 그중 하나가 커다란 인장 반지' },
    lu_ruprecht: { name: '비서 루프레히트', title: '추기경의 비서', st: 'ne', role: 'official', g: 'm', fiction: true,
      look: '30대, 마르고 창백한 얼굴, 가는 콧수염, 검은 옷에 열쇠 꾸러미와 장부, 늘 곁눈질하는 눈' },
    lu_canon: { name: '참사회원 볼프강', title: '대성당 참사회원 신부', st: 'ne', role: 'priest', fiction: true,
      look: '60대, 딸기코와 불룩한 배, 낡은 사제복에 포도주 얼룩, 사람 좋은 웃음' },
    lu_tetzel: { name: '요한 테첼', title: '도미니코회 면죄부 설교사', st: 'ne', role: 'priest', born: 1465,
      look: '40대, 둥근 얼굴, 흰 도미니코회 수도복에 검은 망토, 옆에 쇠로 묶은 면죄부 돈궤' },
    lu_konrad: { name: '비단 상인 콘라트', title: '면죄받은 자 ①', st: 'ne', role: 'captain', g: 'm', fiction: true,
      look: '40대, 기름진 얼굴, 모피 깃 외투, 품에서 붉은 인장이 찍힌 면죄부를 꺼내 흔드는 손' },
    lu_kurt: { name: '기사 쿠르트', title: '면죄받은 자 ②', st: 'ne', role: 'soldier', g: 'm', fiction: true,
      look: '30대, 흉터 난 얼굴, 그을음 묻은 갑옷, 비웃는 입' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });

  if (G.ITEMS && G.ITEM && !G.ITEM.luther_note) {
    var it = { id: 'luther_note', name: '루터의 수첩 한 장', kind: 'keepsake', price: 0, gv: 30, reg: [],
      desc: '마그데부르크 사건을 함께 푼 젊은 루터가 찢어 준 수첩 한 장. 「면죄받은 자들은 왜 다시 죄를 짓는가 — 죄를 돈으로 미리 샀으니 죄가 아니라 여긴다. 참된 뉘우침은 금고에 떨어지는 동전 소리가 아니라 가슴에서 난다.」 아래쪽에 서툰 글씨로 「언젠가 이것을 교회 문에 붙이리라」라고 적혀 있다.' };
    G.ITEMS.push(it); G.ITEM[it.id] = it;
  }
})(window.G = window.G || {});
