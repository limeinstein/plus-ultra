/* 배의 종류·특성·목재.
   배 종류는 대항해시대 2·4, 세일링 에라, 대항해시대 온라인에 나오는 배들을 참고해 1480~1600년 무렵의 실제 배로 골랐다.
   수치는 이 게임에 맞게 새로 정했다 (원작 수치를 옮기지 않았다).

   cap 적재량(통) · hp 내구력 · crew [최저, 최대] · ports 최대 포문 · spd 돛 속도(°/일) · oar 노 속도(°/일)
   sails 돛 구성 (sq 사각돛 · lat 삼각돛 · bat 대나무 살 돛) · turn 선회 · price 값 · from/to 지어지는 해
   cult 문화권 (eu 유럽 · is 이슬람·인도양 · sa 동남아시아 · ea 동아시아 · am 아메리카) — 다른 문화권 조선소에서는 수리비가 비싸다
   hull 그림 모양 · traits 특성 (G.SHIP_TRAITS) · armor 장갑 배수 · len 해전 선체 길이 배수 · feat 한 줄 특징 · where 파는 곳
   lv 조선 기술 등급 (1~5) — 대항해시대 2처럼 도시 조선소의 기술(공업) 수준이 이 등급 이상이어야 짓는다. 기술 투자로 올린다. */
(function (G) {
  'use strict';

  // ---------------------------------------------------------------- 특성
  G.SHIP_TRAITS = {
    oar:      { name: '노', icon: 'oar', desc: '바람이 없거나 맞바람이어도 노를 저어 나아간다. 해전에서는 바람과 상관없이 움직인다. 노를 오래 저으면 선원이 지친다.' },
    bow:      { name: '뱃머리 포', desc: '대포를 뱃머리에 모아 두었다. 적을 정면에 두고 모든 포를 한꺼번에 쏜다. 옆으로는 거의 쏘지 못한다.' },
    dragon:   { name: '용머리 포구', desc: '양 옆구리의 포와 따로, 뱃머리로도 온힘을 다해 쏜다.' },
    ram:      { name: '충파', desc: '뱃머리로 적선을 들이받아 선체를 부순다.' },
    coast:    { name: '연안선', desc: '뭍에서 멀리 떨어진 먼 바다(해안에서 2.5° 넘게)에서는 느려지고, 큰 파도에 상하며, 폭풍에 크게 부서진다.' },
    armor:    { name: '덮개 장갑', desc: '갑판을 판자·쇠로 덮었다. 포탄 피해가 크게 줄고 선원이 덜 다친다.' },
    spikes:   { name: '쇠못 지붕', desc: '지붕에 쇠못을 촘촘히 박아 적이 올라타지 못한다. 뛰어든 적은 크게 다친다.' },
    layered:  { name: '겹판자 선체', desc: '판자를 여러 겹 덧대어 포탄에 잘 견딘다.' },
    sewn:     { name: '꿰맨 선체', desc: '못 대신 야자 끈으로 판자를 꿰맸다. 수리가 싸고 쉽지만 포탄에는 약하다.' },
    bulkhead: { name: '수밀 격벽', desc: '선창이 칸막이로 나뉘어 물이 새도 잘 가라앉지 않는다. 해전에서 한 번은 침몰을 버티고, 폭풍에는 가라앉지 않는다.' },
    raft:     { name: '뗏목', desc: '가벼운 통나무를 엮은 배라 가라앉지 않는다. 폭풍 피해가 적고, 해전에서 부서져도 떠 있다.' },
    sturdy:   { name: '튼튼한 선체', desc: '두꺼운 판자로 지어 폭풍 피해가 적고 먼 바다의 파도에도 끄떡없다.' },
    highdeck: { name: '높은 갑판', desc: '높은 선루와 갑판 덕분에 백병전에서 유리하다 (공격·방어 모두).' },
    heavygun: { name: '대형 총통', desc: '큰 포를 실을 수 있게 지어 포격 위력이 세다.' },
    gundeck:  { name: '포열 갑판', desc: '대포를 갑판 아래 가지런히 늘어놓아 재장전이 빠르다.' },
    grapple:  { name: '접현 돌격', desc: '적선에 재빨리 붙어 먼저 뛰어든다. 멀리서도 백병전을 걸 수 있고 첫 공격이 세다.' },
    shallow:  { name: '얕은 흘수', desc: '바닥이 얕아 뭍 가까이(해안에서 1° 안)에서 더 빠르고, 여울·암초 사고를 입지 않는다.' },
    scout:    { name: '탐험선', desc: '가볍고 날렵해 멀리까지 살핀다. 함대에 있으면 망루의 시야가 넓어진다.' },
    monsoon:  { name: '계절풍 항해', desc: '인도양과 남중국해의 계절풍을 잘 탄다. 그 바다에서 더 빠르다.' },
    thrift:   { name: '짐배 선형', desc: '짐을 가득 실어도 덜 느려지고, 부리는 데 드는 일손이 적다.' },
    awe:      { name: '위용', desc: '기함으로 삼으면 거대한 모습에 작은 해적 떼가 덤비지 못하고 달아난다.' }
  };

  // ---------------------------------------------------------------- 배
  G.SHIP_TYPES = [
    // ------------------------------------------------ 유럽 (대서양·북해)
    { id: 'barca', name: '바르카', lv: 1, cult: 'eu', cap: 90, hp: 24, crew: [6, 26], ports: 4, spd: 1.25, sails: ['sq'], maxMast: 2, price: 2400, turn: 1.2, hull: 'west',
      traits: ['shallow'], feat: '가장 값싼 원양 배', where: '이베리아',
      desc: '포르투갈 사람들이 아프리카 해안을 더듬어 내려갈 때 쓴 외돛 작은 배. 짐은 적지만 싸고 얕은 물에 강하다.' },
    { id: 'cog', name: '코그', lv: 1, cult: 'eu', cap: 150, hp: 34, crew: [8, 40], ports: 6, spd: 1.05, sails: ['sq'], maxMast: 2, price: 3200, turn: 0.8, hull: 'west',
      traits: ['sturdy'], feat: '느리지만 튼튼한 북해의 짐배', where: '북유럽·이베리아',
      desc: '판자를 겹쳐 붙인 북유럽의 외돛 범선. 느리지만 폭풍에 강하다.' },
    { id: 'hulk', name: '홀크', lv: 2, cult: 'eu', cap: 430, hp: 72, crew: [18, 90], ports: 12, spd: 1.02, sails: ['sq', 'sq'], maxMast: 3, price: 15500, turn: 0.7, hull: 'west',
      traits: ['sturdy', 'thrift'], feat: '한자 동맹의 큰 짐배 — 적은 선원으로 많이 싣는다', where: '한자 동맹 도시',
      desc: '코그를 키운 한자 동맹의 짐배. 코그의 세 배 가까이 싣지만 굼뜨다. 발트해의 곡물·목재·청어를 나른다.' },
    { id: 'caravel', name: '카라벨', lv: 2, cult: 'eu', cap: 170, hp: 38, crew: [10, 50], ports: 8, spd: 1.45, sails: ['lat', 'lat'], maxMast: 3, price: 7800, turn: 1.25, hull: 'west',
      traits: ['scout', 'shallow'], feat: '역풍에 강한 탐험선', where: '이베리아·유럽 식민지',
      desc: '삼각돛으로 맞바람도 거슬러 오르는 포르투갈의 탐험선. 얕은 해안을 살피며 나아가기 좋다.' },
    { id: 'lcaravel', name: '대형카라벨', lv: 3, cult: 'eu', cap: 260, hp: 52, crew: [16, 80], ports: 12, spd: 1.40, sails: ['sq', 'lat', 'lat'], maxMast: 4, price: 13800, turn: 1.1, hull: 'west',
      traits: ['scout'], feat: '원양 탐험의 주력', where: '이베리아·유럽 식민지',
      desc: '사각돛을 더한 카라벨(카라벨라 레돈다). 순풍에서도 역풍에서도 고르게 달려 대양 탐험에 알맞다.' },
    { id: 'pinnace', name: '피너스', lv: 2, cult: 'eu', cap: 120, hp: 30, crew: [8, 40], ports: 8, spd: 1.55, oar: 0.5, sails: ['sq', 'lat'], maxMast: 2, price: 7200, turn: 1.4, from: 1540, hull: 'west',
      traits: ['scout', 'oar'], feat: '노도 젓는 날랜 정찰선', where: '잉글랜드·네덜란드·이베리아 (1540년~)',
      desc: '큰 배를 따라다니며 앞길을 살피던 날랜 소형선. 바람이 멎으면 노를 젓는다.' },
    { id: 'carrack', name: '카락', lv: 3, cult: 'eu', cap: 380, hp: 68, crew: [24, 120], ports: 18, spd: 1.28, sails: ['sq', 'sq', 'lat'], maxMast: 4, price: 20500, turn: 0.95, hull: 'west',
      traits: ['highdeck'], feat: '높은 선루의 원양 무역선', where: '유럽 각지',
      desc: '앞뒤로 높은 선루를 올린 원양 무역선(나우). 선창이 넓고 백병전에 강하다.' },
    { id: 'lcarrack', name: '대형카락', lv: 4, cult: 'eu', cap: 560, hp: 88, crew: [36, 170], ports: 26, spd: 1.22, sails: ['sq', 'sq', 'lat', 'lat'], maxMast: 4, price: 31500, turn: 0.85, hull: 'west',
      traits: ['highdeck'], feat: '인도 항로의 거대한 상선', where: '큰 항구',
      desc: '인도 항로를 오가던 거대한 카락. 향료를 가득 싣고 대양을 건넌다.' },
    { id: 'hcarrack', name: '중카락', lv: 5, cult: 'eu', cap: 720, hp: 112, crew: [52, 230], ports: 32, spd: 1.12, sails: ['sq', 'sq', 'sq', 'lat'], maxMast: 4, price: 44000, turn: 0.75, from: 1500, hull: 'west',
      traits: ['highdeck', 'sturdy'], feat: '떠다니는 성채', where: '큰 항구 (1500년~)',
      desc: '무장과 적재량이 모두 뛰어난 중(重)카락. 느리지만 폭풍에도 적의 칼에도 끄떡없다.' },
    { id: 'galleon', name: '갤리온', lv: 4, cult: 'eu', cap: 620, hp: 104, crew: [46, 210], ports: 42, spd: 1.36, sails: ['sq', 'sq', 'lat', 'lat'], maxMast: 4, price: 52000, turn: 1.0, from: 1525, hull: 'west',
      traits: ['gundeck'], feat: '빠르고 포가 많은 신형 군함 겸 상선', where: '큰 항구 (1525년~)',
      desc: '선루를 낮추고 선체를 길게 뽑은 신형 배. 포열 갑판에 대포를 늘어놓아 빠르게 쏜다.' },
    { id: 'lgalleon', name: '대형 갤리온', lv: 5, cult: 'eu', cap: 900, hp: 140, crew: [70, 300], ports: 54, spd: 1.2, sails: ['sq', 'sq', 'sq', 'lat'], maxMast: 4, price: 82000, turn: 0.8, from: 1565, hull: 'west',
      traits: ['gundeck', 'highdeck'], feat: '태평양을 건너는 은 수송선', where: '세비야·리스본·아바나·아카풀코 (1565년~)',
      desc: '마닐라와 아카풀코를 잇던 거대한 갤리온. 은과 비단을 산더미처럼 싣고 포도 많다.' },
    { id: 'fluyt', name: '플류트', lv: 3, cult: 'eu', cap: 540, hp: 58, crew: [18, 70], ports: 10, spd: 1.32, sails: ['sq', 'sq', 'lat'], maxMast: 3, price: 26000, turn: 0.9, from: 1595, hull: 'west',
      traits: ['thrift'], feat: '싸게 많이 나르는 네덜란드의 짐배', where: '네덜란드·한자 동맹 (1595년~)',
      desc: '배 밑이 넓고 갑판이 좁은 네덜란드의 짐배. 적은 선원으로 많은 짐을 싸게 나른다.' },
    { id: 'frigate', name: '프리깃', lv: 4, cult: 'eu', cap: 360, hp: 84, crew: [40, 180], ports: 34, spd: 1.58, sails: ['sq', 'sq', 'sq', 'lat'], maxMast: 4, price: 60000, turn: 1.25, from: 1590, hull: 'west',
      traits: ['gundeck'], feat: '가장 빠른 군함', where: '잉글랜드·네덜란드·프랑스 (1590년~)',
      desc: '됭케르크 사략선에서 비롯된 날렵한 군함. 빠르고 잘 돌며 포열 갑판을 갖췄다.' },

    // ------------------------------------------------ 지중해
    { id: 'tartane', name: '타르타나', lv: 1, cult: 'eu', cap: 130, hp: 30, crew: [8, 36], ports: 4, spd: 1.42, sails: ['lat'], maxMast: 2, price: 4200, turn: 1.4, hull: 'west',
      traits: ['shallow', 'thrift'], feat: '지중해 연안의 값싼 짐배', where: '지중해 항구',
      desc: '큰 삼각돛 하나를 단 지중해의 연안 짐배. 선원이 적게 들고 얕은 항구에도 드나든다.' },
    { id: 'galley', name: '갤리', lv: 2, cult: 'eu', cap: 110, hp: 46, crew: [70, 180], ports: 5, spd: 1.0, oar: 0.85, sails: ['lat'], maxMast: 1, price: 14500, turn: 1.7, len: 1.35, hull: 'galley',
      traits: ['oar', 'bow', 'ram', 'coast'], feat: '바람 없이도 싸우는 지중해의 군선', where: '지중해 항구',
      desc: '수많은 노꾼이 젓는 지중해의 군선. 뱃머리 포로 쏘고 충각으로 들이받는다. 먼 바다에는 약하다.' },
    { id: 'greatgalley', name: '대형 갤리', lv: 3, cult: 'eu', cap: 300, hp: 64, crew: [100, 230], ports: 8, spd: 1.12, oar: 0.7, sails: ['lat', 'lat', 'lat'], maxMast: 3, price: 26000, turn: 1.15, len: 1.35, hull: 'galley',
      traits: ['oar', 'bow', 'highdeck'], feat: '노 달린 큰 상선 — 비싼 짐을 안전하게', where: '베네치아·제노바',
      desc: '베네치아가 플랑드르와 알렉산드리아로 보내던 갤레아 그로사. 노와 돛을 함께 써 비싼 짐을 안전하게 나른다.' },
    { id: 'galleass', name: '갤리어스', lv: 5, cult: 'eu', cap: 340, hp: 100, crew: [140, 320], ports: 32, spd: 1.0, oar: 0.6, sails: ['lat', 'lat', 'lat'], maxMast: 3, price: 58000, turn: 0.8, from: 1565, len: 1.45, hull: 'galley',
      traits: ['oar', 'dragon', 'highdeck', 'coast'], feat: '노 달린 떠다니는 포대', where: '베네치아 (1565년~)',
      desc: '대형 갤리에 포를 가득 실은 베네치아의 군선. 옆으로도 앞으로도 쏜다. 레판토에서 이름을 떨쳤다.' },
    { id: 'fusta', name: '푸스타', lv: 1, cult: 'eu', cap: 70, hp: 26, crew: [26, 70], ports: 3, spd: 1.18, oar: 0.95, sails: ['lat'], maxMast: 1, price: 5400, turn: 1.8, len: 1.25, hull: 'galley',
      traits: ['oar', 'bow', 'grapple', 'coast'], feat: '해적이 즐겨 타는 작은 갤리', where: '바르바리 해안·고아',
      desc: '바르바리 해적과 인도의 포르투갈 사람이 즐겨 탄 작은 갤리. 빠르게 붙어 뛰어든다.' },
    { id: 'xebec', name: '지벡', lv: 3, cult: 'eu', cap: 190, hp: 46, crew: [34, 130], ports: 16, spd: 1.55, oar: 0.65, sails: ['lat', 'lat', 'lat'], maxMast: 3, price: 19500, turn: 1.5, from: 1550, len: 1.2, hull: 'galley',
      traits: ['oar', 'grapple'], feat: '돛과 노를 다 쓰는 해적선', where: '바르바리 해안 (1550년~)',
      desc: '날렵한 선체에 삼각돛 셋과 노를 갖춘 바르바리 해적의 배. 빠르고 잘 붙는다.' },

    // ------------------------------------------------ 인도양
    { id: 'dhow', name: '다우', lv: 1, cult: 'is', cap: 210, hp: 36, crew: [10, 60], ports: 6, spd: 1.38, sails: ['lat', 'lat'], maxMast: 2, price: 6200, turn: 1.3, hull: 'dhow', islamic: true,
      traits: ['sewn', 'monsoon'], feat: '계절풍을 타는 인도양의 짐배', where: '인도양·페르시아만·홍해',
      desc: '인도양의 삼각돛 배. 판자를 야자 끈으로 꿰매 지었다. 계절풍을 타면 빠르다.' },
    { id: 'sambuk', name: '삼부크', lv: 1, cult: 'is', cap: 140, hp: 28, crew: [8, 40], ports: 4, spd: 1.5, sails: ['lat', 'lat'], maxMast: 2, price: 4600, turn: 1.45, hull: 'dhow', islamic: true,
      traits: ['sewn', 'shallow'], feat: '홍해의 여울을 누비는 날랜 배', where: '홍해·아라비아·동아프리카',
      desc: '뱃머리가 낮고 고물이 높은 작은 다우. 산호초 많은 홍해와 동아프리카 해안을 누빈다.' },
    { id: 'baghlah', name: '바글라', lv: 3, cult: 'is', cap: 420, hp: 62, crew: [24, 110], ports: 12, spd: 1.3, sails: ['lat', 'lat', 'lat'], maxMast: 3, price: 18500, turn: 1.0, hull: 'dhow', islamic: true,
      traits: ['monsoon', 'highdeck'], feat: '인도양의 큰 원양 상선', where: '인도·페르시아만',
      desc: '높은 고물을 가진 인도양의 큰 다우. 계절풍을 타고 인도와 아라비아를 오간다.' },
    { id: 'parau', name: '파라우', lv: 1, cult: 'is', cap: 60, hp: 22, crew: [22, 60], ports: 2, spd: 1.25, oar: 1.0, sails: ['lat'], maxMast: 1, price: 3800, turn: 1.85, len: 1.2, hull: 'galley',
      traits: ['oar', 'grapple', 'shallow', 'coast'], feat: '말라바르 해안의 날랜 노 배', where: '말라바르 해안',
      desc: '캘리컷의 해군이 포르투갈 배를 에워쌀 때 쓴 작은 노 배. 얕은 물을 파고들어 재빨리 붙는다.' },

    // ------------------------------------------------ 동남아시아
    { id: 'jong', name: '종', lv: 3, cult: 'sa', cap: 720, hp: 98, crew: [50, 200], ports: 14, spd: 1.18, sails: ['lat', 'sq', 'lat', 'lat'], maxMast: 4, price: 34000, turn: 0.78, hull: 'jong',
      traits: ['layered', 'monsoon'], feat: '판자를 네 겹 덧댄 자바의 거선', where: '자바·말라카',
      desc: '자바 사람들이 지은 거대한 배. 판자를 여러 겹 덧대 포탄도 잘 뚫지 못했다고 포르투갈 사람들이 적었다.' },
    { id: 'korakora', name: '코라코라', lv: 1, cult: 'sa', cap: 40, hp: 18, crew: [30, 90], ports: 2, spd: 1.35, oar: 1.1, sails: ['lat'], maxMast: 1, price: 2600, turn: 2.0, len: 1.25, hull: 'outrigger',
      traits: ['oar', 'grapple', 'shallow', 'coast'], feat: '향료 제도의 쪽배 전선', where: '향료 제도',
      desc: '양옆에 부판을 단 몰루카의 긴 전선. 수십 명이 노를 저어 바람보다 빠르게 달린다.' },

    // ------------------------------------------------ 중국 (명)
    { id: 'junk', name: '정크', lv: 2, cult: 'ea', cap: 300, hp: 58, crew: [16, 80], ports: 8, spd: 1.26, sails: ['bat', 'bat'], maxMast: 3, price: 11500, turn: 0.95, hull: 'junk',
      traits: ['bulkhead'], feat: '가라앉지 않는 동양의 상선', where: '중국·동남아시아·일본',
      desc: '대나무 살을 댄 돛과 칸막이 선창을 가진 중국의 상선. 물이 새도 잘 가라앉지 않는다.' },
    { id: 'shachuan', name: '사선', lv: 2, cult: 'ea', cap: 380, hp: 50, crew: [14, 60], ports: 6, spd: 1.2, sails: ['bat', 'bat', 'bat'], maxMast: 3, price: 9500, turn: 1.05, hull: 'junk',
      traits: ['bulkhead', 'shallow', 'coast'], feat: '모래톱을 넘나드는 평저 짐배', where: '항주·요동',
      desc: '바닥이 평평한 북중국의 짐배(沙船). 모래톱이 많은 연안과 강어귀를 잘 다니지만 먼 바다에는 약하다.' },
    { id: 'ljunk', name: '대형 정크', lv: 4, cult: 'ea', cap: 580, hp: 94, crew: [40, 180], ports: 22, spd: 1.2, sails: ['bat', 'bat', 'bat'], maxMast: 4, price: 30500, turn: 0.8, hull: 'junk',
      traits: ['bulkhead', 'highdeck'], feat: '복건의 높은 누선', where: '복주·천주·광주·항주',
      desc: '복건에서 지은 큰 배(福船). 높은 갑판에서 내려다보며 싸우고 짐도 많이 싣는다.' },
    { id: 'baochuan', name: '보선', lv: 5, cult: 'ea', cap: 1400, hp: 180, crew: [150, 450], ports: 24, spd: 0.95, sails: ['bat', 'bat', 'bat', 'bat', 'bat'], maxMast: 5, price: 125000, turn: 0.55, len: 1.05, hull: 'junk',
      traits: ['bulkhead', 'highdeck', 'awe'], feat: '정화의 보물선 — 세상에서 가장 큰 배', where: '명의 큰 항구 (조선 기술 5등급)',
      desc: '정화의 원정대가 탄 거대한 보물선. 원정이 끝난 뒤 잊혔으나, 조선소에 기술을 대어 주면 옛 장인들이 다시 지어 준다.' },

    // ------------------------------------------------ 조선
    { id: 'maengseon', name: '맹선', lv: 2, cult: 'ea', cap: 240, hp: 58, crew: [30, 80], ports: 8, spd: 1.06, oar: 0.55, sails: ['bat', 'bat'], maxMast: 2, price: 9000, turn: 0.95, hull: 'kr',
      traits: ['oar', 'sturdy', 'shallow'], feat: '조선 수군의 평저 군선', where: '한양',
      desc: '경국대전에 실린 조선 전기의 군선. 소나무로 두껍게 지은 평저선으로, 노와 돛을 함께 쓴다.' },
    { id: 'panokseon', name: '판옥선', lv: 4, cult: 'ea', cap: 300, hp: 112, crew: [100, 180], ports: 24, spd: 1.0, oar: 0.75, sails: ['bat', 'bat'], maxMast: 2, price: 38000, turn: 1.2, from: 1555, hull: 'panok',
      traits: ['oar', 'highdeck', 'heavygun', 'coast'], feat: '큰 총통을 싣는 2층 군선', where: '한양 (1555년~)',
      desc: '을묘왜변 뒤 지은 조선의 주력 군선. 노꾼은 아래층, 군사는 위층에 두어 높은 곳에서 큰 총통을 쏜다. 평저선이라 제자리에서 잘 돈다.' },
    { id: 'geobukseon', name: '거북선', lv: 5, cult: 'ea', cap: 150, hp: 130, crew: [80, 150], ports: 20, spd: 1.0, oar: 0.9, sails: ['bat', 'bat'], maxMast: 2, price: 62000, turn: 1.25, armor: 0.5, hull: 'turtle',
      traits: ['oar', 'armor', 'spikes', 'ram', 'dragon', 'coast'], feat: '적진을 헤집는 돌격선', where: '한양 (조선 기술 5등급)',
      desc: '등을 판자로 덮고 쇠못을 박은 조선의 돌격선(龜船). 태종 때 이미 기록에 나온다. 용머리로도 쏘고 적선을 들이받는다.' },

    // ------------------------------------------------ 일본
    { id: 'kobaya', name: '소조', lv: 1, cult: 'ea', cap: 50, hp: 20, crew: [20, 50], ports: 2, spd: 1.25, oar: 1.05, sails: ['sq'], maxMast: 1, price: 3600, turn: 1.9, hull: 'jp',
      traits: ['oar', 'scout', 'coast'], feat: '수군의 날랜 전령선', where: '일본',
      desc: '일본 수군의 작은 배(小早). 빠르게 노를 저어 척후와 연락을 맡는다.' },
    { id: 'sekibune', name: '관선', lv: 2, cult: 'ea', cap: 130, hp: 42, crew: [50, 110], ports: 6, spd: 1.2, oar: 1.0, sails: ['sq'], maxMast: 1, price: 12500, turn: 1.55, from: 1500, hull: 'jp',
      traits: ['oar', 'grapple', 'coast'], feat: '재빨리 붙어 뛰어드는 무사의 배', where: '일본 (1500년~)',
      desc: '세토 내해의 수군이 즐겨 탄 중형 군선(関船). 날렵하게 붙어 무사들이 뛰어든다.' },
    { id: 'atakebune', name: '안택선', lv: 4, cult: 'ea', cap: 260, hp: 124, crew: [110, 220], ports: 20, spd: 0.9, oar: 0.65, sails: ['sq'], maxMast: 1, price: 50000, turn: 0.7, from: 1550, armor: 0.7, hull: 'atake',
      traits: ['oar', 'armor', 'highdeck', 'coast'], feat: '물 위의 성', where: '사카이 (1550년~)',
      desc: '두꺼운 판자 벽과 망루를 올린 일본 수군의 대형 군선(安宅船). 느리지만 떠다니는 성과 같다.' },

    // ------------------------------------------------ 아메리카
    { id: 'balsa', name: '발사', lv: 1, cult: 'am', cap: 60, hp: 16, crew: [5, 20], ports: 0, spd: 1.05, sails: ['sq'], maxMast: 1, price: 900, turn: 0.9, hull: 'raft',
      traits: ['raft', 'shallow'], feat: '가라앉지 않는 잉카의 뗏목배', where: '잉카 해안',
      desc: '발사나무 통나무를 엮고 돛을 단 잉카의 뗏목배. 대포는 못 싣지만 결코 가라앉지 않는다.' }
  ];
  G.SHIP = {}; G.SHIP_TYPES.forEach(function (s) { s.traits = s.traits || []; s.cult = s.cult || 'eu'; G.SHIP[s.id] = s; });
  G.SHIP_CULT = { eu: '유럽', is: '이슬람·인도양', sa: '동남아시아', ea: '동아시아', am: '아메리카' };
  G.SAIL_NAME = { sq: '사각돛', lat: '삼각돛', bat: '대나무 살 돛' };
  G.SHIP_LV = ['', '작은 배', '중형선', '대형선', '원양 대형선', '거함·특수선'];

  // ---------------------------------------------------------------- 목재
  // hp 내구 배수 · spd 속도 보정 · rep 수리비 배수 · price 값 배수 (조선소에서 쓰는 값) · local: 다른 고장으로 들여가지 않는 목재
  G.TIMBERS = [
    { id: 'oak', name: '발트 참나무', hp: 1.15, spd: -0.03, rep: 1.0, price: 1.0, desc: '단치히·리가에서 나는 단단한 참나무. 튼튼하지만 조금 무겁다.' },
    { id: 'pine', name: '북유럽 소나무', hp: 1.0, spd: 0.04, rep: 1.1, price: 0.95, desc: '스칸디나비아의 곧은 소나무·전나무. 가벼워 배가 빠르지만 쉽게 썩는다.' },
    { id: 'iberian', name: '이베리아 참나무', hp: 1.05, spd: 0, rep: 1.0, price: 1.0, desc: '이베리아의 코르크참나무와 소나무. 무난하다.' },
    { id: 'dalm', name: '달마티아 참나무', hp: 1.1, spd: 0, rep: 1.0, price: 1.05, desc: '베네치아 조병창이 아껴 쓰던 이스트라·달마티아의 참나무.' },
    { id: 'med', name: '지중해 소나무', hp: 0.95, spd: 0.02, rep: 1.05, price: 1.0, desc: '지중해 연안의 소나무. 가볍지만 무르다.' },
    { id: 'blacksea', name: '흑해 참나무', hp: 1.1, spd: 0, rep: 1.0, price: 1.0, desc: '시노프와 흑해 연안 숲의 참나무. 오스만 조선소의 밑천.' },
    { id: 'cedar', name: '레바논 삼나무', hp: 1.08, spd: 0, rep: 0.9, price: 1.15, desc: '옛날부터 이름난 향기로운 삼나무. 귀해서 비싸다.' },
    { id: 'african', name: '서아프리카 경목', hp: 1.12, spd: -0.01, rep: 0.95, price: 1.0, desc: '기니 해안의 단단한 나무(이로코). 벌레에 강하다.' },
    { id: 'mangrove', name: '맹그로브·야자', hp: 0.9, spd: 0, rep: 0.9, price: 1.05, local: true, desc: '동아프리카 해안의 맹그로브 기둥과 야자나무. 구하기 쉽지만 약하다. (다른 고장으로 내보내지 않는다)' },
    { id: 'teak', name: '티크', hp: 1.3, spd: -0.02, rep: 0.75, price: 1.05, desc: '말라바르·버마·자바의 티크. 가장 튼튼하고 잘 썩지 않아 수리비가 적게 든다.' },
    { id: 'camphor', name: '녹나무·삼목', hp: 1.15, spd: 0, rep: 0.85, price: 1.0, desc: '복건·광동의 녹나무와 삼목. 벌레가 먹지 않는다.' },
    { id: 'kpine', name: '조선 소나무', hp: 1.2, spd: -0.02, rep: 0.95, price: 1.0, desc: '조선의 곧고 단단한 소나무. 두껍게 켜서 판옥선을 짓는다.' },
    { id: 'hinoki', name: '편백·삼나무', hp: 1.1, spd: 0.02, rep: 0.85, price: 1.05, desc: '일본의 편백과 삼나무. 가볍고 물에 강하다.' },
    { id: 'mahog', name: '카리브 마호가니', hp: 1.25, spd: 0, rep: 0.8, price: 1.0, desc: '쿠바와 이스파뇰라의 마호가니·시더. 아바나 조선소가 갤리온을 짓는 나무.' },
    { id: 'brazil', name: '브라질 경목', hp: 1.2, spd: -0.01, rep: 0.85, price: 1.0, desc: '브라질 해안 숲의 단단한 나무.' },
    { id: 'balsawood', name: '발사나무', hp: 0.8, spd: 0.05, rep: 0.8, price: 0.9, local: true, desc: '안데스 해안의 아주 가벼운 나무. 뗏목배에는 좋지만 선체로는 약하다. (다른 고장으로 내보내지 않는다)' }
  ];
  G.TIMBER = {}; G.TIMBERS.forEach(function (t) { G.TIMBER[t.id] = t; });
})(window.G = window.G || {});
