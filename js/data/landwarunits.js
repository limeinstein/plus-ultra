/* 육상전 자료 (js/games/landwar.js) — 병종 상성 · 땅마다 나오는 특별한 적 부대 · 동료 지휘관의 솜씨 · 전장의 사건 · 조정값 (2026-10-23 사용자 요청)
   ■ 병종(cls): pike 창병 · blade 칼잡이(근접) · cav 기병 · missile 활·투석·총 · horsearcher 기마궁수 · art 포 · beast 짐승 · elephant 전투 코끼리
   ■ 상성 G.LANDWAR.VS[공격][수비] — 1보다 크면 유리. 창병은 기병에, 기병은 활·총·포에, 활·총은 걸어 다니는 보병에, 포는 빽빽한 보병·코끼리에 강하다
   ■ 땅마다 특별한 적(SPECIAL): 원주민·수비대와의 싸움에서 적이 20명이 넘으면 한 부대가 그 땅의 이름난 병사가 된다 (그림은 js/data/landwarart.js 의 m·r·l 줄을 빌린다)
     ability: capture 사로잡기 (쓰러뜨린 우리 대원 일부를 끌고 간다 — 이기면 되찾는다) · poison 독화살 (맞은 부대가 두 차례 더 다친다) · trample 짓밟기 (옆 줄까지)
              skirmish 치고 빠지기 (근접 반격을 받지 않는다) · duel 일기토를 청한다 · volley 일제 사격 · rocket 신기전 (모든 줄을 태운다) · haka 함성 (첫 차례 우리 편이 움츠러든다)
   ■ 동료 지휘관(MATE_SKILL): 부대에 부하를 붙이면 그 사람의 검술·사격·포술·무력이 부대에 더해지고, 이름난 동료는 고유한 솜씨를 쓴다
   조정값: G.BALANCE.landwar */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.landwar = G.BALANCE.landwar || {
    cool: { ambush: 3, trap: 3, snipe: 3, shells: 2, volley: 2, cry: 4 },   // 특수 작전을 다시 쓰기까지 차례
    charge: [1.5, 1.4],                 // 돌격: 주는 피해 ×1.5, 받는 피해 ×1.4
    guard: 0.5, counter: 0.45,          // 방어: 받는 피해 ×0.5 · 근접 반격의 세기
    pikeCounter: 0.8,                   // 창병이 기병을 받아칠 때의 세기
    hill: [1.25, 0.8], woods: 0.7, stream: 0.7,   // 언덕(사격 ×1.25 · 받는 근접 ×0.8) · 숲(받는 사격 ×0.7) · 개울(건너 치는 근접 ×0.7)
    rain: { gun: 0.5, bow: 0.8 }, fog: 0.6, heat: 0.05,   // 비 — 총·포 ×0.5, 활 ×0.8 · 안개 — 사격 ×0.6 · 더위 — 차례마다 힘 −5%
    deep: { cav: 0.7, gun: 1.1 },       // 종심 진형: 기병 돌격을 ×0.7로 받고 총병 ×1.1
    ambushForm: 1.5,                    // 매복 대기가 통하면 첫 차례 우리 공격 ×1.5
    cmdr: { sk: 0.07, mar: 1 / 250 },   // 지휘관: 솜씨 한 단계마다 +7%, 무력 50을 넘는 1마다 +0.4%
    kit: { musket: 45, pike: 14, armor: 70, per: 1 },   // 탐험 장비 값 (한 사람 몫, 금화)
    kitK: { musket: 0.4, pike: 0.4, armor: 0.2 },        // 다 갖추었을 때: 총병 +40% · 기병을 받는 보병 +40% · 근접 피해 −20%
    event: 0.55,                        // 판마다 사건이 하나 일어날 확률
    prisoners: 0.6, ransom: [15, 30],   // 우두머리가 쓰러지면 남은 적의 60%가 항복한다 · 몸값 한 사람에 금화
    friendYears: 20                     // 포로를 풀어 준 땅의 원주민은 20년 동안 우리를 반긴다
  };
  var VS = {
    pike:        { pike: 1, blade: 0.9, cav: 1.6, missile: 1.1, horsearcher: 1.3, art: 1.2, beast: 1.1, elephant: 1.2 },
    blade:       { pike: 1.2, blade: 1, cav: 0.85, missile: 1.3, horsearcher: 0.9, art: 1.3, beast: 1, elephant: 0.7 },
    cav:         { pike: 0.6, blade: 1.15, cav: 1, missile: 1.6, horsearcher: 1.2, art: 1.8, beast: 0.85, elephant: 0.6 },
    missile:     { pike: 1.25, blade: 1.2, cav: 0.85, missile: 1, horsearcher: 0.8, art: 1, beast: 1.3, elephant: 1.2 },
    horsearcher: { pike: 1.2, blade: 1.2, cav: 0.9, missile: 1.1, horsearcher: 1, art: 1.1, beast: 1.1, elephant: 1 },
    art:         { pike: 1.3, blade: 1.3, cav: 0.8, missile: 1.1, horsearcher: 0.7, art: 1, beast: 1.2, elephant: 1.5 },
    beast:       { pike: 0.9, blade: 1, cav: 1.1, missile: 1.3, horsearcher: 1, art: 1.3, beast: 1, elephant: 0.6 },
    elephant:    { pike: 1.2, blade: 1.4, cav: 1.5, missile: 1.3, horsearcher: 1.1, art: 1.1, beast: 1.4, elephant: 1 }
  };
  var CLS_NAME = { pike: '창병', blade: '근접', cav: '기병', missile: '사격', horsearcher: '기마궁수', art: '포', beast: '짐승', elephant: '코끼리' };

  // 땅마다 이름난 병사 — look: 그림 줄 (m 근접 · r 원거리 · l 우두머리 그림), party: 탐험대 질주 시트를 빌린다
  var SPECIAL = {
    iberia:    { name: '테르시오 창병', cls: 'pike', pow: 1.3, look: 'm', desc: '창과 총을 섞어 세운 에스파냐의 방진 — 기병이 뚫지 못한다' },
    weurope:   { name: '란츠크네히트', cls: 'pike', pow: 1.3, look: 'm', desc: '긴 창과 양손검을 든 독일 용병' },
    eeurope:   { name: '스트라디오트 경기병', cls: 'cav', pow: 1.3, look: 'm', ability: 'skirmish', desc: '발칸의 날랜 기병 — 치고 빠진다' },
    russia:    { name: '스트렐치 총병', cls: 'missile', pow: 1.15, look: 'r', ability: 'volley', desc: '도끼창을 세워 받치고 쏘는 모스크바의 총병' },
    ottoman:   { name: '예니체리', cls: 'missile', pow: 1.3, look: 'r', ability: 'volley', desc: '술탄의 상비 보병 — 총을 잘 쏘고 칼도 잘 쓴다' },
    persia:    { name: '키질바시 기마궁수', cls: 'horsearcher', pow: 1.2, look: 'r', ability: 'skirmish', desc: '말 위에서 활을 쏘고 빠지는 붉은 모자의 전사' },
    afghan:    { name: '초원의 기마궁수', cls: 'horsearcher', pow: 1.2, look: 'r', ability: 'skirmish', desc: '말을 탄 채 돌아서며 활을 쏜다' },
    india:     { name: '전투 코끼리', cls: 'elephant', pow: 1.7, look: 'party', party: 'elephant_charge', ability: 'trample', desc: '등에 망루를 얹은 코끼리 — 앞줄을 짓밟는다. 불과 포에 놀란다' },
    thai:      { name: '아유타야 코끼리 부대', cls: 'elephant', pow: 1.6, look: 'party', party: 'elephant_charge', ability: 'trample', desc: '왕의 코끼리 부대 — 앞줄을 짓밟는다' },
    vietnam:   { name: '대월 화창병', cls: 'missile', pow: 1.15, look: 'r', desc: '불을 뿜는 창을 쓰는 병사' },
    china:     { name: '명의 화기수', cls: 'missile', pow: 1.2, look: 'r', ability: 'volley', desc: '불화살과 화총을 함께 쏘는 명의 병사' },
    korea:     { name: '신기전 화차', cls: 'art', pow: 0.9, look: 'r', ability: 'rocket', desc: '한 번에 수십 발의 불화살을 날리는 조선의 수레' },
    japan:     { name: '사무라이', cls: 'blade', pow: 1.45, look: 'l', ability: 'duel', desc: '이름을 외치며 일기토를 청하는 무사' },
    malay:     { name: '크리스 전사', cls: 'blade', pow: 1.25, look: 'm', ability: 'poison', desc: '독을 바른 물결 모양 칼' },
    java:      { name: '독침 사냥꾼', cls: 'missile', pow: 1.0, look: 'r', ability: 'poison', desc: '대롱으로 독침을 분다' },
    moluccas:  { name: '독침 사냥꾼', cls: 'missile', pow: 1.0, look: 'r', ability: 'poison', desc: '대롱으로 독침을 분다' },
    wafrica:   { name: '독화살 궁수', cls: 'missile', pow: 1.05, look: 'r', ability: 'poison', desc: '화살촉에 독을 바른다' },
    sahel:     { name: '송가이 기병', cls: 'cav', pow: 1.35, look: 'm', desc: '사막을 달리는 누빈 갑옷의 기병' },
    congo:     { name: '독화살 궁수', cls: 'missile', pow: 1.05, look: 'r', ability: 'poison', desc: '화살촉에 독을 바른다' },
    ethiopia:  { name: '방패 창병', cls: 'pike', pow: 1.25, look: 'm', desc: '쇠가죽 방패를 든 고원의 창병' },
    swahili:   { name: '해안의 궁수', cls: 'missile', pow: 1.05, look: 'r', ability: 'poison', desc: '독을 바른 화살' },
    mexico:    { name: '재규어 전사', cls: 'blade', pow: 1.35, look: 'm', ability: 'capture', desc: '흑요석 칼을 든 정예 — 적을 죽이지 않고 사로잡아 간다' },
    maya:      { name: '마야 창병', cls: 'pike', pow: 1.15, look: 'm', desc: '흑요석 창을 든 전사' },
    caribbean: { name: '독화살 궁수', cls: 'missile', pow: 1.0, look: 'r', ability: 'poison', desc: '만치닐 나무의 독을 바른 화살' },
    andes:     { name: '잉카 투석병', cls: 'missile', pow: 1.15, look: 'r', desc: '돌팔매로 투구를 깨뜨린다' },
    amazon:    { name: '독화살 궁수', cls: 'missile', pow: 1.05, look: 'r', ability: 'poison', desc: '쿠라레 독을 바른 화살' },
    woodland:  { name: '숲의 전사', cls: 'blade', pow: 1.2, look: 'm', ability: 'ambush', desc: '나무 사이에서 소리 없이 덮친다' },
    plains:    { name: '초원의 전사', cls: 'blade', pow: 1.2, look: 'm', ability: 'ambush', desc: '풀숲에 몸을 숨기고 기다린다' },
    pueblo:    { name: '푸에블로 궁수', cls: 'missile', pow: 1.05, look: 'r', desc: '절벽 마을을 지키는 궁수' },
    northwest: { name: '나무 갑옷 전사', cls: 'blade', pow: 1.25, look: 'm', desc: '나무 판자 갑옷을 입은 전사' },
    maori:     { name: '하카 전사', cls: 'blade', pow: 1.3, look: 'm', ability: 'haka', desc: '싸움 앞에 하카를 추어 적을 움츠러들게 한다' },
    polynesia: { name: '상어 이빨 전사', cls: 'blade', pow: 1.2, look: 'm', desc: '상어 이빨을 박은 곤봉' },
    micronesia:{ name: '돌팔매 전사', cls: 'missile', pow: 1.0, look: 'r', desc: '돌팔매질에 능하다' },
    papua:     { name: '독화살 궁수', cls: 'missile', pow: 1.0, look: 'r', ability: 'poison', desc: '독을 바른 화살' },
    australia: { name: '부메랑 사냥꾼', cls: 'missile', pow: 1.0, look: 'r', desc: '돌아오는 몽둥이를 던진다' }
  };
  var ABILITY = { capture: '사로잡기', poison: '독', trample: '짓밟기', skirmish: '치고 빠지기', duel: '일기토', volley: '일제 사격', rocket: '불화살 수레', haka: '함성', ambush: '매복' };

  // 이름난 동료 — kind: melee 근접 · shot 사격 · art 포 · all 모든 부대 · scheme 계략 · duel 일기토. k: 배수 · once: 한 번만 쓰는 솜씨
  var MATE_SKILL = {
    guan_yu:      { name: '청룡언월도', kind: 'melee', k: 1.4, duel: 25, desc: '근접 ×1.4 · 일기토에 강하다' },
    zhang_fei:    { name: '장판교의 호통', kind: 'roar', once: true, desc: '한 번 — 적 앞줄 한 부대가 한 차례 움직이지 못한다' },
    liu_bei:      { name: '인덕', kind: 'guardall', k: 0.9, desc: '모든 부대가 받는 피해 −10%' },
    zhuge_liang:  { name: '팔진도', kind: 'scheme', k: 0.2, desc: '특수 작전 성공 +20%p · 다시 쓰기까지 한 차례 짧다' },
    d_artagnan:   { name: '하나를 위하여', kind: 'charge', once: true, k: 2, desc: '한 번 — 지휘 부대의 돌격 ×2' },
    athos:        { name: '총사의 검', kind: 'melee', k: 1.2, desc: '근접 ×1.2' },
    porthos:      { name: '장사의 힘', kind: 'melee', k: 1.25, desc: '근접 ×1.25' },
    aramis:       { name: '총사의 냉정', kind: 'shot', k: 1.2, desc: '사격 ×1.2' },
    drake:        { name: '일제 사격', kind: 'shot', k: 1.4, desc: '사격 ×1.4' },
    barbarossa:   { name: '붉은 수염의 돌격', kind: 'melee', k: 1.3, vs: { bandit: 1.5 }, desc: '근접 ×1.3 (도적에게는 ×1.5)' },
    joan_of_arc:  { name: '오를레앙의 깃발', kind: 'all', k: 1.15, desc: '모든 부대 공격 +15%' },
    bokuden:      { name: '검성', kind: 'melee', k: 1.4, duel: 35, desc: '근접 ×1.4 · 일기토에 아주 강하다' },
    don_quixote:  { name: '돌격하라!', kind: 'charge', once: false, k: 1.8, risk: 1.3, desc: '지휘 부대의 돌격 ×1.8 (대신 더 다친다)' },
    sancho_panza: { name: '알뜰한 종자', kind: 'guard', k: 0.8, desc: '지휘 부대가 받는 피해 −20%' },
    marina:       { name: '통역', kind: 'parley', desc: '원주민과의 싸움 — 첫 차례 전에 말로 싸움을 멈출 수 있다' },
    tupac:        { name: '산의 길', kind: 'scheme', k: 0.15, terr: 'mountain', desc: '산에서 특수 작전 +15%p' },
    kisk:         { name: '은동고의 여왕', kind: 'all', k: 1.15, region: ['wafrica', 'congo', 'sahel', 'swahili', 'ethiopia'], desc: '아프리카에서 모든 부대 +15%' },
    leonardo:     { name: '대포 설계', kind: 'art', k: 1.35, desc: '포 ×1.35' },
    peter_pan:    { name: '하늘의 아이', kind: 'snipe', k: 0.25, desc: '저격 성공 +25%p' },
    ahmad:        { name: '사막의 전사', kind: 'melee', k: 1.25, desc: '근접 ×1.25' }
  };

  // 전장의 사건 — when: 일어날 수 있는 차례 [처음, 끝]
  var EVENTS = [
    { id: 'allies', w: 1, text: '지나던 사냥꾼들이 함성을 듣고 우리 편을 들어 달려왔다!', banner: '원군!' },
    { id: 'reinforce', w: 1, text: '적의 원군이 뒤쪽 언덕을 넘어온다!', banner: '적의 원군' },
    { id: 'rain', w: 1, text: '갑자기 소나기가 쏟아진다 — 화약이 젖는다!', banner: '소나기' },
    { id: 'fog', w: 0.8, text: '안개가 깔려 앞이 잘 보이지 않는다. 사격이 빗나간다.', banner: '안개' },
    { id: 'ammo', w: 0.8, text: '총병들의 화약이 떨어져 간다! 두 차례 동안 힘이 빠진다.', banner: '화약 부족', need: 'gun' },
    { id: 'beasts', w: 0.7, text: '싸움 소리에 놀란 들짐승 떼가 전장을 가로지른다!', banner: '짐승 난입' }
  ];

  G.LANDWAR = { VS: VS, CLS_NAME: CLS_NAME, SPECIAL: SPECIAL, ABILITY: ABILITY, MATE_SKILL: MATE_SKILL, EVENTS: EVENTS };
})(window.G = window.G || {});
