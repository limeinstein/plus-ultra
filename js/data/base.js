/* Core static game data: regions, languages, skills, jobs, goods, ships, cannons, figureheads. */
(function (G) {
  'use strict';

  G.REGIONS = ['이베리아', '북유럽', '지중해', '아프리카', '중근동', '인도', '중국', '중앙아시아', '동남아시아', '일본', '아메리카'];
  // trade distance between culture regions (0 = same)
  G.REGION_DIST = [
    //IB NE ME AF NE IN CN CA SE JP AM
    [0, 1, 1, 2, 2, 4, 5, 3, 5, 5, 3],
    [1, 0, 2, 3, 3, 5, 5, 3, 5, 5, 3],
    [1, 2, 0, 2, 1, 3, 4, 2, 4, 5, 4],
    [2, 3, 2, 0, 2, 3, 4, 3, 4, 5, 3],
    [2, 3, 1, 2, 0, 2, 3, 1, 3, 4, 5],
    [4, 5, 3, 3, 2, 0, 2, 2, 1, 3, 5],
    [5, 5, 4, 4, 3, 2, 0, 2, 1, 1, 5],
    [3, 3, 2, 3, 1, 2, 2, 0, 3, 3, 5],
    [5, 5, 4, 4, 3, 1, 1, 3, 0, 2, 5],
    [5, 5, 5, 5, 4, 3, 1, 3, 2, 0, 4],
    [3, 3, 4, 3, 5, 5, 5, 5, 5, 4, 0]
  ];

  G.LANGS = ['스페인어', '포르투갈어', '로망스어', '게르만어', '슬라브·그리스어', '아랍어', '페르시아어', '중국어', '힌두어', '위굴어', '아프리카토착어', '중남미토착어', '동남아시아토착어', '동아시아토착어', '조선어', '북미토착어'];
  G.LANG_LV = ['모름', '기초', '보통', '능숙'];

  G.SKILLS = [
    { id: 'nav', name: '항해술', desc: '항해 중 피로 누적을 줄이고 폭풍을 피한다.' },
    { id: 'ops', name: '운용술', desc: '선원의 규율을 유지하고 탐험 비용을 줄인다.' },
    { id: 'cook', name: '요리', desc: '배와 야영지의 끼니를 맛있게 차려 피로를 덜어 준다. 교역품 발견물(향신료·작물)의 가치를 알아보고 높인다. 제독이나 부하 누구든 요리에 밝으면 된다.' },
    { id: 'music', name: '음악', desc: '노래와 악기로 선원들을 하나로 묶어 규율을 지킨다. 민족 발견물(사람들의 노래·춤·의식)의 가치를 높이고 반란 때 잔치로 달랠 수 있다. 제독이나 부하 누구든 음악에 밝으면 된다.' },
    { id: 'sword', name: '검술', desc: '백병전과 일기토, 지상전 기병을 강하게 한다.' },
    { id: 'gun', name: '포술', desc: '해전의 포격 명중과 위력을 높인다.' },
    { id: 'shoot', name: '사격술', desc: '해전·지상전의 사격을 강하게 한다.' },
    { id: 'med', name: '의학', desc: '괴혈병과 전염병을 막고 부상자를 치료한다.' },
    { id: 'speech', name: '웅변', desc: '후원자 설득과 입항 교섭의 성공률을 높인다.' },
    { id: 'survey', name: '측량', desc: '미발견 항구를 찾는 범위와 해도 작성 범위를 넓힌다.' },
    { id: 'hist', name: '역사학', desc: '육상의 발견물을 찾기 쉽게 하고 모조품을 가려낸다.' },
    { id: 'acct', name: '회계', desc: '교역소에서 값을 깎는 교섭의 성공률을 높인다. 경리 자리에 두면 교역소·시장에서 값을 후려치고 후원자에게 선금·기한을 더 받아 낸다.' },
    { id: 'ship', name: '조선기술', desc: '항해 중 자재로 배를 수리할 수 있다.' },
    { id: 'theo', name: '신학', desc: '교회와 성직자에게 신뢰를 얻고 선원의 사기를 붙든다.' },
    { id: 'sci', name: '과학', desc: '자연·생물 발견에 유리하며 괴혈병 예방에 도움이 된다.' },
    { id: 'art', name: '그림', desc: '발견한 것을 그려 남긴다. 제독이나 부하 누구든 그림에 밝으면 발견물의 가치가 오른다(명성·사례금·하사금).' },
    { id: 'craft', name: '세공', desc: '보물과 공예품을 알아보고 손질한다. 제독이나 부하 누구든 세공에 밝으면 발견물(특히 보물·유적)의 가치와 유물 값이 오른다.' }
  ];
  G.SKILL_BY_ID = {}; G.SKILLS.forEach(function (s, i) { s.idx = i; G.SKILL_BY_ID[s.id] = s; });
  // which fleet role lets a companion's skill apply (DKJ3 style)
  G.ROLE_SKILLS = {
    admiral: 'all',
    first: ['sword', 'gun', 'shoot', 'med', 'ship', 'sci', 'acct', 'speech', 'theo', 'hist', 'craft'],
    nav: ['nav', 'ops', 'cook', 'music'],
    surveyor: ['survey', 'hist', 'art'],
    interp: [],
    purser: ['acct']          // 경리: 회계 — 교역소·시장·후원자 앞에서 값을 후려치고 셈을 따진다
  };
  G.ROLES = [
    { id: 'first', name: '부관' }, { id: 'nav', name: '항해사' }, { id: 'surveyor', name: '측량사' }, { id: 'interp', name: '통역' }, { id: 'purser', name: '경리' }
  ];

  G.JOBS = [
    { id: 'explorer', name: '탐험가', desc: '항해와 측량에 능하다. 처음 시작하는 제독에게 권한다.', skills: { nav: 2, survey: 2, ops: 1 } },
    { id: 'digger', name: '발굴자', desc: '역사와 웅변에 밝아 유적을 찾는 데 강하다.', skills: { hist: 2, speech: 2 } },
    { id: 'hunter', name: '사냥꾼', desc: '운용술이 뛰어나 오랜 탐험을 견딘다. 생물 발견에 강하다.', skills: { ops: 3, sci: 1 } },
    { id: 'conq', name: '정복자', desc: '검술의 달인. 해전과 지상전에서 두각을 나타낸다.', skills: { sword: 3, gun: 1 } },
    { id: 'miss', name: '전도사', desc: '신학을 익혀 교회의 신뢰를 얻고 선원의 마음을 붙든다.', skills: { theo: 3, speech: 1 } },
    { id: 'merchant', name: '상인', desc: '회계에 능해 교역으로 부를 쌓는다.', skills: { acct: 3, speech: 1 }, ship: 'tartane' },   // 코그(네모돛 하나)는 맞바람에 하루 0.12°밖에 못 가 마데이라 앞에서 굶었다 → 세모돛 타르타나
    { id: 'soldier', name: '군인', desc: '포술과 사격술을 익힌 군인. 전투에 강하다.', skills: { gun: 2, shoot: 2 } }
  ];

  G.ZODIAC = [
    { name: '염소자리', from: [12, 22], stat: 'int' }, { name: '물병자리', from: [1, 20], stat: 'int' },
    { name: '물고기자리', from: [2, 19], stat: 'cha' }, { name: '양자리', from: [3, 21], stat: 'mar' },
    { name: '황소자리', from: [4, 20], stat: 'str' }, { name: '쌍둥이자리', from: [5, 21], stat: 'int' },
    { name: '게자리', from: [6, 22], stat: 'cha' }, { name: '사자자리', from: [7, 23], stat: 'mar' },
    { name: '처녀자리', from: [8, 23], stat: 'int' }, { name: '천칭자리', from: [9, 23], stat: 'cha' },
    { name: '전갈자리', from: [10, 23], stat: 'mar' }, { name: '궁수자리', from: [11, 22], stat: 'str' }
  ];
  G.zodiacOf = function (m, d) {
    var md = m * 100 + d, best = G.ZODIAC[0];
    for (var i = 1; i < G.ZODIAC.length; i++) {
      var z = G.ZODIAC[i];
      if (md >= z.from[0] * 100 + z.from[1]) best = z;
    }
    if (md >= 1222) best = G.ZODIAC[0];
    return best;
  };

  G.STATS = [
    { id: 'str', name: '체력' }, { id: 'int', name: '지력' }, { id: 'mar', name: '무력' }, { id: 'cha', name: '매력' }
  ];

  // ---------------------------------------------------------------- goods
  // cat: food drink spice luxury fiber cloth ore metal gem craft arms misc
  // p: base price per 통(unit); life: shelf life in days (0 = does not spoil); el: price elasticity vs distance
  G.GOOD_CATS = { food: '식량품', drink: '주류', spice: '향신료', lux: '기호품', fiber: '섬유', cloth: '직물', ore: '광석', metal: '귀금속', gem: '사치품', craft: '공예품', arms: '무기', misc: '기타' };
  G.GOODS = [
    { id: 'wheat', name: '밀', cat: 'food', p: 8, life: 240, el: 0.35 },
    { id: 'rice', name: '쌀', cat: 'food', p: 9, life: 240, el: 0.45 },
    { id: 'maize', name: '옥수수', cat: 'food', p: 9, life: 200, el: 0.6, nw: 1 },
    { id: 'beans', name: '콩', cat: 'food', p: 8, life: 260, el: 0.35 },
    { id: 'potato', name: '감자', cat: 'food', p: 8, life: 150, el: 0.6, nw: 1 },
    { id: 'fish', name: '어육', cat: 'food', p: 11, life: 70, el: 0.35 },
    { id: 'beef', name: '쇠고기', cat: 'food', p: 13, life: 50, el: 0.4 },
    { id: 'dairy', name: '유제품', cat: 'food', p: 14, life: 60, el: 0.45 },
    { id: 'sugar', name: '설탕', cat: 'food', p: 32, life: 0, el: 0.7 },
    { id: 'honey', name: '벌꿀', cat: 'food', p: 24, life: 0, el: 0.5 },
    { id: 'salt', name: '돌소금', cat: 'food', p: 15, life: 0, el: 0.5 },
    { id: 'olive', name: '올리브유', cat: 'food', p: 22, life: 300, el: 0.55 },
    { id: 'palmoil', name: '야자유', cat: 'food', p: 17, life: 300, el: 0.5 },
    { id: 'wine', name: '포도주', cat: 'drink', p: 26, life: 0, el: 0.6 },
    { id: 'brandy', name: '브랜디', cat: 'drink', p: 42, life: 0, el: 0.6 },
    { id: 'rum', name: '럼주', cat: 'drink', p: 36, life: 0, el: 0.6 },
    { id: 'beer', name: '맥주', cat: 'drink', p: 18, life: 120, el: 0.4 },
    { id: 'pepper', name: '후추', cat: 'spice', p: 55, life: 0, el: 1.0 },
    { id: 'clove', name: '정향', cat: 'spice', p: 80, life: 0, el: 1.15 },
    { id: 'nutmeg', name: '육두구', cat: 'spice', p: 90, life: 0, el: 1.15 },
    { id: 'cinnamon', name: '계피', cat: 'spice', p: 65, life: 0, el: 1.0 },
    { id: 'ginger', name: '생강', cat: 'spice', p: 42, life: 0, el: 0.9 },
    { id: 'allspice', name: '피멘트', cat: 'spice', p: 48, life: 0, el: 0.9, nw: 1 },
    { id: 'tea', name: '차', cat: 'lux', p: 55, life: 0, el: 1.0 },
    { id: 'coffee', name: '커피', cat: 'lux', p: 58, life: 0, el: 0.95 },
    { id: 'cacao', name: '카카오', cat: 'lux', p: 62, life: 0, el: 1.0, nw: 1 },
    { id: 'tobacco', name: '담배', cat: 'lux', p: 52, life: 0, el: 0.95, nw: 1 },
    { id: 'wool', name: '양모', cat: 'fiber', p: 20, life: 0, el: 0.5 },
    { id: 'cotton', name: '면화', cat: 'fiber', p: 18, life: 0, el: 0.55 },
    { id: 'silkraw', name: '생사', cat: 'fiber', p: 70, life: 0, el: 0.9 },
    { id: 'hemp', name: '마', cat: 'fiber', p: 16, life: 0, el: 0.45 },
    { id: 'woolcloth', name: '모직물', cat: 'cloth', p: 46, life: 0, el: 0.75 },
    { id: 'cottoncloth', name: '면직물', cat: 'cloth', p: 40, life: 0, el: 0.8 },
    { id: 'silk', name: '견직물', cat: 'cloth', p: 105, life: 0, el: 0.9 },
    { id: 'linen', name: '린네르', cat: 'cloth', p: 40, life: 0, el: 0.7 },
    { id: 'chintz', name: '편사', cat: 'cloth', p: 72, life: 0, el: 0.95 },
    { id: 'carpet', name: '융단', cat: 'cloth', p: 125, life: 0, el: 0.85 },
    { id: 'iron', name: '철광석', cat: 'ore', p: 15, life: 0, el: 0.45 },
    { id: 'copper', name: '동광석', cat: 'ore', p: 22, life: 0, el: 0.55 },
    { id: 'tin', name: '주석광석', cat: 'ore', p: 26, life: 0, el: 0.6 },
    { id: 'mercury', name: '수은', cat: 'ore', p: 60, life: 0, el: 0.7 },
    { id: 'coal', name: '석탄', cat: 'ore', p: 10, life: 0, el: 0.35 },
    { id: 'gold', name: '금', cat: 'metal', p: 175, life: 0, el: 0.55 },
    { id: 'silver', name: '은', cat: 'metal', p: 115, life: 0, el: 0.55 },
    { id: 'gems', name: '보석', cat: 'gem', p: 210, life: 0, el: 0.8 },
    { id: 'pearl', name: '진주', cat: 'gem', p: 150, life: 0, el: 0.85 },
    { id: 'coral', name: '산호', cat: 'gem', p: 85, life: 0, el: 0.9 },
    { id: 'amber', name: '호박', cat: 'gem', p: 78, life: 0, el: 0.85 },
    { id: 'jade', name: '비취', cat: 'gem', p: 135, life: 0, el: 0.9 },
    { id: 'ivory', name: '상아', cat: 'gem', p: 105, life: 0, el: 0.9 },
    { id: 'tortoise', name: '별갑', cat: 'gem', p: 90, life: 0, el: 0.9 },
    { id: 'rhino', name: '코뿔소 뿔', cat: 'gem', p: 140, life: 0, el: 1.0 },
    { id: 'fur', name: '모피', cat: 'gem', p: 82, life: 0, el: 0.8 },
    { id: 'ambergris', name: '용연향', cat: 'gem', p: 190, life: 0, el: 1.0 },
    { id: 'frankincense', name: '유향', cat: 'gem', p: 82, life: 0, el: 0.9 },
    { id: 'musk', name: '사향', cat: 'gem', p: 150, life: 0, el: 1.0 },
    { id: 'sandalwood', name: '백단향', cat: 'gem', p: 88, life: 0, el: 0.95 },
    { id: 'glass', name: '유리', cat: 'craft', p: 50, life: 0, el: 0.8 },
    { id: 'porcelain', name: '도자기', cat: 'craft', p: 115, life: 0, el: 0.95 },
    { id: 'leathergoods', name: '가죽제품', cat: 'craft', p: 44, life: 0, el: 0.7 },
    { id: 'jewelry', name: '장신구', cat: 'craft', p: 125, life: 0, el: 0.85 },
    { id: 'art', name: '미술품', cat: 'craft', p: 170, life: 0, el: 0.8 },
    { id: 'antique', name: '골동품', cat: 'craft', p: 145, life: 0, el: 0.8 },
    { id: 'guns', name: '총', cat: 'arms', p: 85, life: 0, el: 0.9 },
    { id: 'cannon', name: '대포', cat: 'arms', p: 130, life: 0, el: 0.9 },
    { id: 'timber', name: '목재', cat: 'misc', p: 12, life: 0, el: 0.4 },
    { id: 'dye', name: '염료', cat: 'misc', p: 52, life: 0, el: 0.8 },
    { id: 'hides', name: '피혁', cat: 'misc', p: 24, life: 0, el: 0.5 },
    { id: 'herbs', name: '약재', cat: 'misc', p: 68, life: 0, el: 0.85 },
    { id: 'horses', name: '말', cat: 'misc', p: 95, life: 180, el: 0.7 }
  ];
  G.GOOD = {}; G.GOODS.forEach(function (g, i) { g.idx = i; G.GOOD[g.id] = g; });
  // special regional demand multipliers (region index -> factor)
  G.GOOD_DEMAND = {
    silver: { 6: 1.6, 5: 1.25, 8: 1.3 }, gold: { 1: 1.1, 0: 1.1, 5: 1.2 }, horses: { 5: 1.7, 8: 1.3 },
    guns: { 3: 1.25, 5: 1.4, 8: 1.4, 9: 1.8, 10: 1.6 }, cannon: { 3: 1.2, 5: 1.4, 8: 1.4, 9: 1.6, 10: 1.5 },   // 아프리카(3) 총포 1.5·1.4 → 1.25·1.2: 리스본~카사블랑카 열흘에 본전의 131%가 남던 것
    woolcloth: { 3: 1.3, 5: 1.2, 10: 1.3 }, glass: { 3: 1.6, 10: 1.7, 8: 1.3 }, wine: { 10: 1.5, 3: 1.3 },
    coral: { 5: 1.5, 6: 1.3 }, ivory: { 5: 1.2, 6: 1.3 }, rhino: { 6: 1.5 }, musk: { 1: 1.2, 2: 1.2 },
    amber: { 2: 1.2, 4: 1.2 }, jade: { 6: 1.3 }, fur: { 6: 1.2, 4: 1.1 }, salt: { 3: 1.8 }, copper: { 5: 1.2, 3: 1.3 },
    wheat: { 3: 1.2 }, iron: { 3: 1.5, 10: 1.4 }, linen: { 10: 1.3 }
  };

  // ---------------------------------------------------------------- ships
  // 배의 종류·특성·목재는 js/data/ships.js 에 있다.

  // 바다의 위험 조정값 (sea.js) — 해적이 나타나는 빈도 배수, 폭풍 빈도 배수, 해적 통행료(가진 돈의 비율),
  // 사정해서 빠져나올 수 있는 재산 한도(소지금 + 금고)
  G.SEA_RISK = { pirate: 0.5, storm: 0.5, tollBase: 200, tollRate: 0.08, pleadMax: 10000 };

  // 밸런스 조정값 (2026-09-27 밸런스 패치) — 쓰는 곳은 괄호 안
  G.BALANCE = {
    // 제독 만들기 (scenes/create.js) — 대항해시대 3처럼 나이가 많을수록 보너스가 많다.
    // 능력 보너스 = statPts + (나이 − 18) × statPerYear (체력·지력·무력·매력에 나눠 줌, 한 능력 statMax까지)
    // 특기 점수 = 3 + (나이 − 18) ÷ 4 + 지식 보너스(지력 knowFrom부터 knowStep마다 +1, 최대 knowMax)
    create: { statPts: 4, statPerYear: 0.5, statMax: 99, knowFrom: 40, knowStep: 15, knowMax: 3 },
    homeTools: ['compass', 'sextant'],   // 처음 떠나는 도시(제독의 고향) 시장에 늘 있는 항해 도구 — 연도(from)·지역·그날 물량과 상관없이 (js/city/misc.js MK.stock)
    // 선수상: 함대에서 가장 센 덕 + 나머지 배의 덕 × figRest (R.fleetBonus). 폭풍 빈도는 stormFloor 아래로 줄지 않는다 (sea.js)
    figRest: 0.25, stormFloor: 0.35, stormDmgCut: 0.3,
    // 피로 60을 넘으면 속력 × (1 − (피로 − 60) / fatigueDiv) → 피로 100에서 75% (R.fleetMotion)
    fatigueDiv: 160,
    // 선원이 최소 인원 × spareWatch 이상이면 교대가 넉넉해 하루 피로가 spareRest만큼 덜 쌓인다 (sea.js runDay)
    spareWatch: 1.3, spareRest: 0.3,
    // 괴혈병: 출항 뒤 scurvyOnset일부터 번진다. 의술 1마다 scurvyMed일, 과학 1마다 scurvySci일 늦춘다.
    // 번지는 빠르기 × max(0.35, 1 − 0.18 × 의술 − 0.08 × 과학). 의술은 배에 탄 동료 누구의 것이든 쓴다 (R.medSkill)
    scurvyOnset: 40, scurvyMed: 8, scurvySci: 4,
    // 괴혈병이 번지는 가속(하루마다 더해지는 양)과, 괴혈 18을 넘었을 때 하루에 쓰러지는 선원 비율(× 괴혈/18, 이틀에 한 번)
    scurvyGrow: 0.03, scurvyDeath: 0.007,
    // 열병·바다 괴물·유령선이 한 번에 앗아 가는 선원은 선원 수의 eventDeath 이하 (explore.js)
    eventDeath: 0.15,
    // 쥐: 하루 확률과 먹어 치우는 비율 (sea.js)
    rat: 0.01, ratLoss: [0.06, 0.15],
    // 계약 없이 찾은 발견을 후원자에게 보고할 때: 같은 해 같은 후원자에게 n번째 보고면 사례금 ÷ (1 + lateRepCut × (n−1)) (sponsor.js)
    lateRepCut: 0.3,
    // 해적: 세기는 명성과 함대 크기(짐칸)로 정한다 — min(1, 명성/4000, pirateBase + 짐칸/pirateCap) (sea.js, battle.js)
    // 해적선 선원 = 정원 × (pirateCrew[0] + pirateCrew[1] × 세기), 포 = 포문 × (40~60% + 30% × 세기)
    pirateBase: 0.3, pirateCap: 1500, pirateCrew: [0.22, 0.66],
    // 해적선 1척 전리품 기준(금화, 짐칸 200 기준), 나포선을 그 자리에서 팔 때 값의 비율 (battle.js)
    pirateLoot: 1400, prizeSale: 0.8,
    // 나포한 배의 짐 (battle.js prizeHolds): 배 짐칸(cap) × 비율. 식량·물·자재는 모든 배, 교역품은 상선이 많고 해적은 약탈품, 군함은 자재(matK배)가 많다.
    // 선원: 남은 적 선원(없으면 정원 최소 × crewLeft) 가운데 join 비율이 따르겠다고 한다
    prizeHold: { food: [0.05, 0.12], water: [0.05, 0.12], mat: [0.02, 0.06], goods: { merchant: [0.35, 0.7], pirate: [0.1, 0.3], navy: [0, 0.08] },
      matK: { navy: 1.6 }, join: { merchant: 0.3, pirate: 0.5, navy: 0.2 }, crewLeft: [0.15, 0.4] },
    // 기함의 선실 (js/systems/cabins.js). 고칠 수 있는 선실 수 = (정원 + 내구) ÷ slotDiv, slotMin~slotMax. 방의 힘 = (1 + 특기 단계) × 충성 효율, 같은 방을 여럿 두면 더해지되 cap까지.
    //   fx: 방의 힘 1마다의 효과 — lookout 발견 거리(°) · chart 해도 넓이(°) · galley/mess/helm 하루 피로 · messD/chapel/rec/deck 하루 규율 · sick 괴혈병 번짐 감소 비율
    //       rig 속력 비율(최대 rigMax) · repair 하루 기함 수리(내구) · pen 하루 식량(통) · gun 포격 · marine 백병전 비율 · haggle 값 깎기 성공률 · wage 급료 감소 비율 · feast/songs 사건 가중
    //   langDays: 한배에서 지낸 날이 이만큼이면 말 1·2·3단계 (3달·9달·2년), farRate: 방이 멀 때 하루에 쌓이는 몫, cols: 선실 한 줄의 칸 수
    cabins: { slotDiv: 22, slotMin: 2, slotMax: 16, cap: 8, cols: 6, rigMax: 0.08, langDays: [90, 270, 730], farRate: 0.3,
      fx: { lookout: 0.12, chart: 0.15, galley: 0.05, mess: 0.04, messD: 0.03, helm: 0.03, chapel: 0.06, rec: 0.05, deck: 0.04, sick: 0.07, rig: 0.01, repair: 0.1, pen: 0.12,
        gun: 0.03, marine: 0.04, haggle: 0.03, wage: 0.02, feast: 1.5, songs: 1 } },
    // 부하: 수는 제한이 없다. 재산이 급료 warnMonths달 치에 못 미치면 경리·부관이 경고한다. 충성 low 이하면 효율 lowEff, veryLow 이하면 veryLowEff.
    //   역할도 방도 없는 부하는 달마다 충성 −idleLoyal, 부관이 있으면 급료를 치른 달에 충성이 settle 아래인 부하 +adjutantLoyal.
    //   충성 0이면 떠나겠다고 나선다 — 붙잡을 확률 persuade + (매력−50)/200 + 웅변 × persuadeSpeech, 붙잡으면 충성 persuadeLoyal
    // 부하 후보 특기 늘리기 (js/data/renown.js): base = 모든 후보에게 얹는 단계, byTier[지명도 0~4] = 실존 인물에게 더, wander = 철새·고장 사람 [최소, 최대], wanderLucky = 한 단계 더 받을 확률, cap = 한 특기 최고 단계
    mateSkills: { base: 1, byTier: [0, 1, 2, 3, 4], wander: [1, 2], wanderLucky: 0.2, cap: 3 },
    mates: { warnMonths: 6, low: 40, lowEff: 0.75, veryLow: 20, veryLowEff: 0.5, idleLoyal: 2, adjutantLoyal: 1, settle: 70, persuade: 0.25, persuadeSpeech: 0.12, persuadeLoyal: 25 },
    // 해적 세기가 가득 차는 명성(예전 4000 — 첫해에 이미 가득 찼다), 해적선 수가 한 척 느는 명성 간격(예전 1200), 해적선 한 척을 꺾은 명성(예전 25)
    pirateFame: 8000, pirateCountFame: 2000, pirateFameGain: 40,
    // 명성 칭호의 문턱: 신참 모험가 · 이름난 모험가 · 저명한 항해가 · 위대한 탐험가 · 대항해자 (예전 400·1600·4000·8000·15000 — 3년이면 끝 칭호였다)
    fameTitles: [400, 1600, 5000, 12000, 25000],
    // 식량·물이 떨어진 날 쓰러지는 선원의 비율 [최소, 최대]
    starve: [0.03, 0.07],
    // 모든 것을 잃고 고향에서 다시 시작할 때 받는 배 (잃은 기함이 더 싼 배였으면 그 배)
    restartShip: 'caravel',
    // 후원자 신뢰의 상한 (sponsor.js, errand.js)
    trustMax: 100,
    // 보급: 선원 한 사람이 하루에 먹고 마시는 양(통) — 식량·물 따로 (예전 0.04 → 0.025: 같은 짐칸으로 약 1.6배 오래)
    ration: 0.025,
    // 육상 탐험: 대원은 배의 식량·물을 쓰지 않고 그 고장에서 사 먹고 길잡이·짐꾼 삯을 낸다 — 하루 경비(금화)
    //   (base + perMan × 대원 수) × 탈것 보정(먹이·물 덜 드는 짐승은 싸다) × (1 + thirsty × 메마른 땅)
    //   못 내면 피로 +unpaidFatigue, 대원이 desert 확률로 떠난다. 물 긷기(야영)는 water × 하루 쓰는 양 × 땅의 물 많음
    // 바다 위 반란: 규율 < discipline 이고 피로 > fatigue 일 때 하루 chance 확률, 한 번 일어나면 cooldown일 동안 다시 안 일어난다 (sea.js)
    //   (예전: 규율 22 · 피로 70 · 하루 18%, 쉬는 날 없음)
    mutiny: { discipline: 15, fatigue: 80, chance: 0.06, cooldown: 40 },
    // 요리·음악 (부가 기술 — 제독이나 부하 누구든 가장 잘하는 사람의 단계, R.skillRead)
    //   바다: 하루 피로 −cookFatigue×요리, 규율 +musicDiscipline×음악 / 뭍: 하루 피로 −landCook×요리, 야영 쉬기 −restBonus×(요리+음악)
    //   발견물 가치: 교역품 +discValue×요리, 민족 +discValue×음악 / 발견의 여파: 교역품 피로 −impact×요리, 민족 규율 +impact×음악
    //   반란 교섭 「잔치」: 규율 +feastBase + feastPer×(요리+음악), 피로 −feastFatigue, 식량 하루치 × feastFood
    crewCare: { cookFatigue: 0.12, musicDiscipline: 0.15, landCook: 0.15, restBonus: 3, discValue: 0.08, impact: 2, feastBase: 12, feastPer: 6, feastFatigue: 10, feastFood: 2 },
    landCost: { base: 5, perMan: 1, thirsty: 0.5, unpaidFatigue: 6, desert: 0.25, water: [4, 8] },
    // 짐의 부피·무게 (js/systems/cargo.js). 1통 = 부피 1. wt = 1통의 무게(갈래별, wtGood가 있으면 그 값).
    // 배가 버티는 무게 = 짐칸 × shipWt. 선원 한 사람 crewWt, 대포 한 문 = 짐칸 차지(load) × gunWt + 포탄 shotWt, 식량·물 supWt, 자재 matWt
    // keep = 신선하게 파는 날수(갈래별, keepGood가 있으면 그 값, 0 = 상하지 않음). 넘으면 파는 값이 떨어져 두 배에서 decayMin,
    // 두 배를 넘기면 한 달에 rotMonth만큼 상해 없어진다
    cargo: {
      shipWt: 1.3, crewWt: 0.1, gunWt: 1.5, shotWt: 0.25, supWt: 1, matWt: 1.2,
      wt: { food: 1, drink: 1.2, spice: 0.5, lux: 0.6, fiber: 0.7, cloth: 0.6, ore: 3, metal: 2.5, gem: 0.3, craft: 0.9, arms: 1.8, misc: 1 },
      wtGood: { salt: 1.6, sugar: 1.1, coal: 2.4, mercury: 3.5, timber: 1.6, horses: 2, guns: 1.5, cannon: 3, glass: 1.1, porcelain: 1.1, faience: 1.2, carpet: 0.9, dye: 0.6, herbs: 0.5, hides: 0.9, fur: 0.5, ivory: 0.8 },
      keep: { food: 360, spice: 720, lux: 540 },
      keepGood: { fish: 150, beef: 120, dairy: 150, potato: 240, maize: 300, wheat: 420, rice: 480, beans: 420, olive: 480, palmoil: 480, sugar: 900, honey: 0, salt: 0, beer: 240, clove: 900, nutmeg: 900, horses: 300 },
      decayMin: 0.5, rotMonth: 0.06
    },
    // 교역소 물량과 값의 기울기 (대항해시대 2처럼 큰 배로 많이 실어 나를수록 남게) — rules.js R.supply·onBuy·onSell·buyPrice·sellPrice
    // 재고 = stock[0] + stock[1] × 도시 크기 · 사면 품귀(dep)가 q / (dep[0] + dep[1] × 크기)만큼 늘고 사는 값 × (1 + depPrice × 품귀)
    // 팔면 포화(sat)가 q / (sat[0] + sat[1] × 크기)만큼 늘고 파는 값 × e^(−satPrice × 포화). 품귀·포화는 25일마다 절반으로
    market: { stock: [80, 140], dep: [120, 160], depPrice: 0.45, sat: [160, 140], satPrice: 0.45 },
    // 육상 탐험: 식량·물은 쓰지 않고 금화 경비(landCost)만 나간다. 야영의 사냥·물 긷기(배의 식량·물 보급)는
    // 배(출발한 항구)가 near도 안에 보일 때만 할 수 있다 (js/systems/cargo.js G.Cargo.nearShip)
    landPack: { near: 1.2 },
    // 제독의 수명·생일 선물 (js/systems/lifespan.js): maxAge세 생일에 세상을 떠난다(아들이 있으면 뒤를 잇는다). warnFrom세부터 생일마다 귀띔.
    //   생일에 충성 giftLoyal 이상인 부하 가운데 가장 충성스러운 한 사람이 특기에 맞는 선물 하나(고맙다는 말에 충성 +giftLoyalUp),
    //   함께 배에 탄 아내·견습 아이도 선물 (아이와의 사이 +kidBond)
    life: { maxAge: 80, warnFrom: 75, giftLoyal: 90, giftLoyalUp: 2, kidBond: 3 },
    // 야영지에서 배 고치기 (js/scenes/land.js camp): 배가 보이는 곳(landPack.near)에서, 자재가 있을 때.
    //   days일 동안 날마다 배마다 최대 내구 × (perDay + perSkill × 조선 특기). 인원이 최저 승원 수보다 적으면 그 비율만큼 덜 고친다(crewFloor 아래로는 안 줄임).
    //   자재는 바다 위 수리와 같이 내구 1마다 matPerHp통. 하루마다 피로 +fatigue
    landRepair: { days: 2, perDay: 0.07, perSkill: 0.04, crewFloor: 0.3, fatigue: 3 },
    // 같은 곳 맴돌며 야영하기 (js/systems/castaway.js): radius도 안을 한 야영지로 친다. 야영 사이가 gapDays일보다 벌어지면 처음부터.
    //   wilsonDays일 안에 wilsonCamps번 야영하면 「윌슨」 사건(한 번), 한 야영지에서 journalDays일 넘게 journalCamps번 넘게 야영하면 「표류기」(한 번).
    //   윌슨을 데리고 있으면 야영의 쉬기에서 피로가 wilsonRest 더 풀린다. 표류기를 지니면 야영 경비가 journalCost만큼 줄고 사냥·물 긷기가 journalFind배
    castaway: { radius: 0.6, gapDays: 30, wilsonDays: 30, wilsonCamps: 10, journalDays: 90, journalCamps: 15, wilsonRest: 8, journalCost: 0.15, journalFind: 1.25 },
    // 잠입 (js/systems/sneak.js): 성공 가망 = 바탕(base) + 변장 + 말(못 하면 lang0, 단계마다 langLv) + 화술 × speech + 모국어 동료(native)
    //   − 악명 × noto(최대 notoMax) − 얼마 전(alertDays일 안) 들킨 일(alert). min~max로 자른다.
    //   터번: 이슬람 도시 turban(성지 turbanHoly) · 중국 항구 turbanChinaPort · 중국 내륙 turbanChina. 명나라 옷: mingrobe
    //   들키면 confiscate 확률로 변장 도구를 빼앗김. 교섭으로 받은 통행 허가는 passDays일.
    //   med = 지중해 이슬람 항구로 치는 상자 [위도 남, 위도 북, 경도 서, 경도 동]. nonIslam = 이 나라가 다스리면 이슬람 도시라도 그냥 들어감
    sneak: { base: { holy: 0.1, islam: 0.4, closed: 0.25, treaty: 0.35, wanted: 0.3 },
      turban: 0.35, turbanHoly: 0.45, turbanChinaPort: 0.12, turbanChina: 0.04, mingrobe: 0.35,
      lang0: -0.1, langLv: 0.06, speech: 0.05, native: 0.1, noto: 0.003, notoMax: 0.2, alertDays: 30, alert: -0.15,
      min: 0.05, max: 0.95, confiscate: 0.5, passDays: 365, med: [29, 41.5, -6.5, 37],
      nonIslam: ['카스티야', '에스파냐', '아라곤', '포르투갈', '프랑스', '영국', '잉글랜드', '네덜란드', '프로이센', '독일 제국', '이탈리아 왕국', '구호기사단',
        '베네치아', '제노바', '러시아 제국', '러시아 차르국', '돈 코사크', '스텐카 라진 반란군', '푸가초프 반란군', '영국 동인도 회사', '네덜란드 동인도 회사',
        '시크 미슬 연맹', '시크 제국', '마라타 동맹', '청', '준가르 칸국', '알와 왕국'] },
    // 단서 겹치기 (js/systems/discovery.js): 다른 곳(다른 도시의 술집·교역소, 다른 후원자, 다른 책, 망루·원주민…)에서 같은 발견의 단서를 또 얻으면 겹친다.
    // 배열은 겹수(0~4)별 값. sense: 망루·정찰대가 알아채는 거리, find: 실제로 찾는 반경(바다·뭍), zone: 계약 목적지 원의 크기, fish: 낚시 희귀어 확률 덧셈
    clueStack: { max: 4, sense: [1, 1.4, 1.7, 2.0, 2.3], find: [1, 1, 1.2, 1.35, 1.5], zone: [1, 1, 0.72, 0.5, 0.34], fish: 0.75, stackW: 0.35 },
    // 발견의 여파: 발견 갈래에 따라 피로·규율이 즉시 달라진다 (discovery.js).
    // (예전의 '스트레스'는 피로 하나로 합쳤다 — 옛 저장의 스트레스는 불러올 때 절반을 피로에 더한다, main.js)
    discoveryImpact: {
      awe:     { fatigue: -16, discipline: 2 },
      triumph: { fatigue: -13, discipline: 5 },
      delight: { fatigue: -9,  discipline: 3 },
      wonder:  { fatigue: -7,  discipline: 2 },
      fear:    { fatigue: 14,  discipline: -4 },
      grief:   { fatigue: 4,   discipline: 3 }       // 숙연함 — 노예무역의 현장 같은 곳 (moredisc.js 고레 섬)
    },
    // 물은 식량보다 싸다 (보급값 × waterPrice). 자재(수리용 목재·밧줄·돛천): 한 통 값 = 보급값 × matPrice
    waterPrice: 0.5, matPrice: 3,
    // 바다 위 수리: 내구 1을 고치는 데 드는 자재(통). 새 게임은 자재 matStart통으로 시작
    matPerHp: 0.4, matStart: 10,
    // 테스트용 캐릭터(만들기 화면에서 이름 「이강희」 + 엔터): 능력치·행운(최대 99), 소지금, 첫 함대(배 ID — 앞의 것이 기함)
    // 모조품(js/systems/fakes.js): 값 = 발견물 가치 × priceK, 둘 다 바치면 사례금 × bothK·신뢰 +bothTrust, 들키면 벌금 = 사례금 × fineK 또는 옥살이 jailBase+세력×12+0~25일
    fakes: { priceK: 0.12, bothK: 1.3, bothTrust: 10, fineK: 0.6, arrestBase: 0.3, jailBase: 20 },
    testChar: { stat: 99, luck: 99, gold: 999999999, look: 'ganghui', ships: ['geobukseon', 'galleon'] },   // look: 얼굴·반신상·걷는 그림·일기토 시트 이름 · gold: 소지금 최대(9억 9999만 9999닢)
    // 여관 허드렛일: 한 번에 최대 maxDays일. 하루에 명성이 famePerDay씩 내려가고(제독이 허드렛일을…), 그 고장 말을 익힌다 —
    // 말 단계(모름→기초→보통→능숙)마다 일한 날 langDays[지금 단계]일이 쌓이면 한 단계 오른다(지력이 높으면 빨리: 지력 50 기준)
    innWork: { maxDays: 150, famePerDay: 1, langDays: [40, 80, 120] },
    // 시세의 출렁임: 도시·품목 갈래마다 천천히 오르내린다 (최대 ± driftAmp, 주기 driftPeriod[0]~[1]일)
    driftAmp: [0.08, 0.15], driftPeriod: [70, 200],
    // 후원자의 대가 바뀔 때 (succession.js): 그 자리의 신뢰는 sponsorKeep만 남고, 제독의 자녀가 뒤를 이으면 모든 신뢰가 heirKeep만 남는다.
    // 유산: 떠난 사람과의 신뢰가 legacyTrust 이상이면 legacyBase + (신뢰 − legacyTrust)/60 확률로 물건·돈(재력 × 세력 × legacyGold)을 남긴다
    succession: { sponsorKeep: 0.5, heirKeep: 0.3, legacyTrust: 70, legacyBase: 0.35, legacyGold: 250 },
    // 가족 (family.js): 결혼 뒤 자택에 들르거나 쉴 때 conceive 확률로 아이가 생긴다(마지막 출산 뒤 gapDays일이 지나야, 자녀 maxKids명까지).
    // gestation일 뒤에 태어나고(쌍둥이 twins), adult세가 되면 뒤를 이을 수 있다. 가정교사는 한 아이에게 해마다 한 번, 값 eduCost닢
    // 유행 (js/systems/fad.js): window일 안에 need번, 한 번에 profit 넘는 이익으로 같은 물건을 같은 나라·지역에 팔면 chance 확률로 유행
    // → days일 동안 그곳에서 그 물건 값이 mult배 · 끝나면 같은 곳·같은 물건은 cooldown일 동안 쉰다
    // 자연재해 (js/systems/disaster.js · js/data/disasters.js)
    //  random: 이름 없는 재해의 잦기(배수, 0 = 역사 재해만) · localK: 탐험대가 재해가 잦은 땅을 걸을 때 더 잦게 · volcanoRate/volcanoNear: 화산 한 곳이 한 해에 터질 확률(멀리/곁에 있을 때)
    //  news: 이만큼(°) 안의 재해는 소식이 온다 · loss: 대원을 잃는 몫 [최소, 최대] × 세기 (한 번에 많아야 maxLoss) · flee: 조짐을 알아채 피하면 피해 배수 · hurt: 부하가 다칠 확률
    //  mitig: 운용술·의학 한 단계마다 피해를 줄이는 몫 · detect: 조짐을 알아챌 확률 (갈래별 기본 + 과학·측량·역사학 단계마다, 역사 재해는 역사학 2단계 이상이면 histBonus)
    //  tsuInland: 해안에서 이만큼(°) 넘게 들어와 있으면 해일이 닿지 않는다 · seaCoast: 바다에서 해안 이만큼 안이면 해일에 배가 상한다 · ship: 배가 상하는 몫(최대 내구 대비)
    //  cityDays: 재해를 입은 도시의 시장 값이 뛰는 날 · relief: 구호금 기본값 · stayFatigue: 재해 자취 안을 걸을 때 하루 피로(× 세기)
    disaster: { on: true, random: 1, localK: 4, volcanoRate: 0.012, volcanoNear: 0.5, news: 15,
      loss: { quake: [0.02, 0.07], volcano: [0.04, 0.14], landslide: [0.05, 0.15], tsunami: [0.08, 0.22], flood: [0.04, 0.12] },
      flee: 0.3, hurt: 0.35, maxLoss: 0.35, mitig: { ops: 0.08, med: 0.06 },
      detect: { quake: 0.03, volcano: 0.35, landslide: 0.25, tsunami: 0.25, flood: 0.4, sci: 0.12, survey: 0.1, hist: 0.1, nav: 0.05, histBonus: 0.2 },
      tsuInland: 0.3, seaCoast: 0.6, ship: [0.08, 0.3], cityDays: [60, 150], relief: 120, stayFatigue: 1.2 },
    // 해전 함대 명령 (js/scenes/battle.js — 기함을 뺀 배들)
    //  craneStep/craneMax: 학익진 날개 한 칸의 벌림(라디안)·가장 많이 벌리는 각 · craneR: 적에게서 사정거리의 몇 배 거리에 서는가
    //  envSpread: 우리 배들이 적을 감싼 각(라디안)이 이만큼(2척 / 3척 이상)이면 포위 · envelop: 포위한 적에게 포격 피해 + [2척, 3척 이상]
    //  focusR: 일제 공격에서 붙는 거리(사정거리 배수) · volley: 두 척 넘게 한 적을 함께 쏘면 피해 + · board: 선원이 적의 이만큼 배면 올라탄다
    //  gunR: 포격전에서 서는 거리(사정거리 배수) · gunKeep: 적이 이만큼 다가오면 물러난다 · guardR: 호위하는 배가 기함에서 떨어진 거리 · slotR: 자리에 왔다고 보는 거리
    fleetOrders: { craneStep: 0.62, craneMax: 1.45, craneR: 0.72, envSpread: [1.6, 2.6], envelop: [0.2, 0.35], focusR: 0.55, volley: 0.15, board: 1.5, gunR: 1.05, gunKeep: 170, guardR: 120, slotR: 70 },
    // 시대의 유행·세상의 유행 (js/systems/era.js · js/data/eratrade.js)
    //  strength: 시대 수요 배수의 세기(1 = 자료 그대로) · worldPerYear: 저절로 이는 유행이 한 해에 몇 번 · worldMin: 그 시대 수요가 이만큼 넘는 물건만 · worldMult/worldDays: 그 유행의 값 배수·날
    //  discChance/discGoods/discMult/discDays: 발견이 알려졌을 때 유행이 일 확률·물건 수·배수·날 · spreadDays/spreadChance: 세상의 유행이 이웃 유럽 지역으로 번지는 때·확률
    era: { on: true, strength: 1, worldPerYear: 2.5, worldMin: 1.05, worldMult: 1.7, worldDays: [60, 120], discChance: 0.85, discGoods: 2, discMult: 2, discDays: [90, 150], spreadDays: 30, spreadChance: 0.4 },
    fad: { profit: 0.3, need: 3, window: 90, chance: 0.6, mult: 3, days: 60, cooldown: 180 },
    // 자택에서 아이와 보내는 시간 (js/systems/homelife.js): 능력 상한 statMax · 특기를 익힐 확률 skillChance · 장부를 맡기면 지력×ledgerGold닢
    // · 가족 저녁의 피로 회복 dinnerRest · 사이가 cold 아래면 서먹한 첫마디(함께하면 +coldBonus) · 집을 longAway일 넘게 비웠다 오면 키 재기
    // · 생일 앞뒤 birthdayDays일 · 집에서 일이 생기는 간격 happenGap일·확률 happenChance · 바다에서 추억의 물건: 피로 keepFatigue부터 하루 keepChance, 피로 −keepRest
    homelife: { statMax: 90, skillChance: 0.6, ledgerGold: 4, dinnerRest: 10, cold: 30, coldBonus: 2, longAway: 300, birthdayDays: 10,
      happenGap: 20, happenChance: 0.55, keepChance: 0.03, keepRest: 4, keepFatigue: 25 },
    family: { conceive: 0.35, gapDays: 300, maxKids: 5, gestation: 266, twins: 0.03, adult: 16, heirYoung: 20, eduCost: 800,
      // 아이와 제독의 사이(0~100): 해산을 지켜보면 bondBorn, 놓치면 bondMissed에서 시작 · 집에 들르면 +bondVisit(보름에 한 번)
      // · 집을 비운 달마다 −bondAway(3살부터) · 견습으로 배에 타면 달마다 +bondAboard, 특기를 익힐 확률 apprenticeSkill
      // · 해산 한 달 앞(nearDays)이면 소식과 자택 「해산을 기다린다」 · 견습은 apprenticeAge살부터
      bondBorn: 60, bondMissed: 40, bondVisit: 3, bondAway: 1, bondAboard: 2, apprenticeSkill: 0.22, nearDays: 30, apprenticeAge: 12 },
    // 철새(떠돌이 항해사, wanderers.js): 새 게임에 startN명, 해마다 perYear명이 새로 나타난다.
    // cycle년마다(epoch부터 센다: 1510·1540·1570…) 세대가 바뀐다 — 고용하지 않은 철새는 떠나고, 그 가운데 rebornMax명의 「다음 세대」가 나타난다.
    // 다음 세대는 이름이 늘 새로 붙고, 국적은 keepNation, 성별은 keepGender 확률로 그대로다 (얼굴·솜씨 갈래는 이어받는다).
    // 떠도는 고장: 제 나라 고장에 더해 farZone 확률로 먼 고장 하나를 더 다닌다. 마녀 전설(legend)은 한 세대에 legendMax명까지 소문이 돈다
    wander: { perYear: 5, startN: 12, cycle: 30, epoch: 1480, rebornMax: 30, keepNation: 0.55, keepGender: 0.7, farZone: 0.35, legendMax: 2 },
    // 고장 사람: 어느 5년 칸에도 고장(G.MATE_ZONES)마다 사람 사는 도시 수 × ratio명쯤의 항해사 후보가 있게, every해마다 세어 모자라면 그 고장 태생으로 채운다. extraLang: 다른 말 하나를 알 확률
    regionFolk: { ratio: 0.8, every: 1, extraLang: 0.15, maxPerFill: 400 },
    // 부하와 이야기 (matetalk.js): 하루 한 번 이야기(충성 chatLoyal·호감 chatAff), 한잔(값 drinkCost × 도시 크기, 충성 drinkLoyal·호감 drinkAff).
    // 여성 부하는 호감이 wedAff 이상이고 약속 반지가 있으면 청혼할 수 있다. 마녀의 점괘는 fortuneDays일에 한 번
    mateTalk: { chatLoyal: 1, chatAff: 2, drinkCost: 8, drinkLoyal: 2, drinkAff: 3, wedAff: 90, fortuneDays: 30 }
  };

  // 계절풍 바다 (바람 모델 R.wind와 안내 G.Monsoon이 함께 쓴다)
  // box: [서경계, 동경계, 남위계, 북위계] · sw: 남서 계절풍이 부는 날(1월 1일부터 센 날수 [시작, 끝]) — 나머지는 북동 계절풍
  // rim: 계절풍 안내를 들려줄 연안 항구의 범위(box를 넓힌 것) · tip: 항구에서 들려줄 뱃길 예
  G.MONSOON = [
    { id: 'india', name: '인도양', box: [40, 100, -5, 25], rim: [37, 103, -8, 28], sw: [130, 270], spdSW: 0.8, spdNE: 0.6,
      tip: { sw: '동아프리카·아라비아에서 인도·말라카로 건너기 좋다', ne: '인도에서 아라비아·동아프리카로 돌아가기 좋다' } },
    { id: 'scs', name: '남중국해', box: [100, 125, 0, 25], rim: [98, 127, -2, 27], sw: [130, 270], spdSW: 0.65, spdNE: 0.65,
      tip: { sw: '말라카에서 중국·일본 쪽으로 올라가기 좋다', ne: '중국에서 말라카·자바 쪽으로 내려가기 좋다' } }
  ];

  G.CANNONS = [
    { id: 'saker', name: '세이커포', price: 90, load: 1.0, range: 3, dmg: 3, acc: 0.62, desc: '값싸지만 위력은 위협 정도.' },
    { id: 'culverin', name: '캘버린포', price: 260, load: 2.0, range: 5, dmg: 4, acc: 0.72, desc: '먼 거리를 겨냥해 맞추는 데 최고.' },
    { id: 'perrier', name: '페리에포', price: 180, load: 1.5, range: 4, dmg: 5, acc: 0.64, desc: '균형이 좋아 추천할 만하다.' },
    { id: 'cannon', name: '카논포', price: 380, load: 3.0, range: 2, dmg: 9, acc: 0.58, desc: '사정은 짧지만 맞으면 일격필살.' }
  ];
  G.CANNON = {}; G.CANNONS.forEach(function (c) { G.CANNON[c.id] = c; });

  // figureheads: bonus keys: spd, hp, luck, storm, monster, morale, battle, curse
  G.FIGUREHEADS = [
    { id: 'falcon', name: '송골매상', price: 800, spd: 0.03, desc: '송골매가 날개치는 모습. 속도가 약간 오른다.' },
    { id: 'fairy', name: '요정상', price: 1200, luck: 0.05, desc: '요정을 형상화한 상. 행운이 따른다.' },
    { id: 'admiral', name: '제독상', price: 1500, morale: 0.1, desc: '위엄 있는 제독의 상. 선원의 규율이 오른다.' },
    { id: 'swan', name: '백조상', price: 1100, storm: 0.06, desc: '더러움 없는 백조. 폭풍을 조금 피한다.' },
    { id: 'horse', name: '마상', price: 1000, spd: 0.02, morale: 0.04, desc: '힘차게 달리는 말의 상.' },
    { id: 'leopard', name: '표범상', price: 1600, battle: 0.05, desc: '사나운 표범. 해전에서 기세를 올린다.' },
    { id: 'turtle', name: '거북상', price: 1400, hp: 0.08, desc: '단단한 바다거북. 선체를 지켜 준다.' },
    { id: 'wolf', name: '이리상', price: 1300, battle: 0.04, morale: 0.03, desc: '무리를 이끄는 이리의 상.' },
    { id: 'owl', name: '올빼미상', price: 1700, storm: 0.05, luck: 0.03, desc: '밤을 지배하는 올빼미. 위험을 먼저 알아챈다.' },
    { id: 'dolphin', name: '돌고래상', price: 1800, spd: 0.04, storm: 0.03, desc: '뱃사람의 친구 돌고래.' },
    { id: 'shark', name: '상어상', price: 2600, battle: 0.08, desc: '바다의 자객. 해전에서 강하다.' },
    { id: 'unicorn', name: '일각수상', price: 4200, luck: 0.08, monster: 0.3, desc: '전설의 짐승. 괴물이 가까이 오지 않는다.' },
    { id: 'angel', name: '천사상', price: 5200, luck: 0.06, storm: 0.1, morale: 0.08, desc: '천사의 가호. 저주를 풀 수 있다고 한다.' },
    { id: 'lion', name: '사자상', price: 3800, battle: 0.1, morale: 0.05, desc: '백수의 왕. 적을 위압한다.' },
    { id: 'whale', name: '백경상', price: 4500, hp: 0.12, spd: 0.02, desc: '바다의 왕자 백경.' },
    { id: 'goddess', name: '여신상', price: 9000, luck: 0.1, storm: 0.15, morale: 0.1, rare: true, desc: '바다의 여신. 모든 항해를 지켜 준다.' },
    { id: 'seagod', name: '해신상', price: 12000, spd: 0.06, storm: 0.2, monster: 0.5, rare: true, desc: '바다를 다스리는 신의 상.' },
    { id: 'demon', name: '마왕상', price: 6000, battle: 0.2, morale: -0.1, curse: true, rare: true, desc: '무서운 힘을 주지만 저주가 깃들어 있다.' }
  ];
  G.FIGUREHEAD = {}; G.FIGUREHEADS.forEach(function (f) { G.FIGUREHEAD[f.id] = f; });

  G.SHIP_NAMES = ['산티아고', '산마르코', '산안토니오', '산마르틴', '산세바스찬', '산조르디', '아르메리아', '루이자', '카타리나', '콘세프시온', '블랑카', '에레오노라', '요한나', '테레사', '디니스', '산타마리아', '후아나', '아순시온', '콘스탄시아', '베렌게라', '트리니다드', '빅토리아', '에스페란사', '산가브리엘', '산라파엘', '베리오', '핀타', '니냐', '플로르 데 라 마르', '보아 비아젱'];
})(window.G = window.G || {});
