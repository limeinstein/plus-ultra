/* 궁정 — 국왕의 부름·왕명(작은 임무)·작위 (규칙: js/systems/court.js)
   G.COURT.realms[열쇠] = {
     name: 나라 이름, sponsors: 그 궁정의 군주(후원자 id), nation: 'PT'|'ES'(제 나라 제독에게는 ranks, 남의 나라 제독에게는 honor),
     lands: 그 나라가 다스리는 도시의 주인 이름(R.cityOwner) — 그 땅에서는 그 나라 작위로 부른다,
     ranks: 제 나라 귀족의 사다리(아래 → 위), honor: 다른 나라 사람에게 내리는 명예 작위(아래 → 위),
     foes: 싸우는 나라(R.cityOwner·바다의 배 나라 이름) — [이름, 시작 해, 끝 해], dens: 왕녀가 붙잡혀 가는 해적 소굴(도시 번호),
     ladies: 왕녀 이름, kind: 'eu' 유럽 | 'is' 이슬람 | 'as' 아시아 (말투)
   }
   작위 한 칸 = [우리말 이름, 그 나라 말(남), 그 나라 말(여), 무게(1~7 — 여러 나라 작위 가운데 높은 것을 고를 때), 부르는 말]
   원작의 대사·이름을 옮기지 않고, 역사에 있던 작위·기사단 이름으로 새로 지었다. */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.court = G.BALANCE.court || {
    step: 10000,         // 통합 명성이 이만큼 오를 때마다 군주가 한 번 부른다 (작위 한 칸 = 왕명 하나)
    choices: 4,          // 한 번의 알현에서 내놓는 왕명 수 (탐험·교역·전투·사교에서 하나씩)
    years: 2,            // 왕명의 기한(해)
    again: 180,          // 왕명을 내려놓거나 기한을 넘긴 뒤 다시 부르기까지(일)
    fame: [450, 160],    // 왕명을 마쳤을 때 명성 = [0] + [1] × 받을 작위의 칸
    gold: [3000, 2500],  // 하사금 = [0] + [1] × 받을 작위의 칸
    trust: 10,           // 왕명을 마치면 오르는 군주의 신뢰
    failTrust: 12, failFame: 200,   // 내려놓거나 기한을 넘기면 깎이는 신뢰·명성
    tribute: [20000, 15000],        // 비용 지불: [0] + [1] × 지금 작위의 칸 (명예 작위는 절반)
    supplyQty: [20, 10, 80],        // 납품 수량: [0] + [1] × 칸 (최대 [2])
    supplyPay: 2.2,                 // 납품 값 = 기준 시세 × 수량 × 이 배수
    shipsN: [2, 0.5, 5],            // 나포·해적 토벌 척수: [0] + [1] × 칸 (최대 [2])
    geoN: [1, 0.34, 3],             // 지리·자연 발견 건수
    zooN: 5,                        // 동물원에 들일 신기한 동물 수
    warSpawn: 0.22, warNear: 14,    // 나포 왕명 중: 그 나라 항구가 warNear° 안이면 하루에 warSpawn 확률로 그 나라 배가 나타난다
    denNear: 2.6,                   // 소굴 앞바다: 이 거리(°) 안에 들면 납치한 해적단이 나타난다
    envoyRetry: 30,                 // 교섭이 깨진 뒤 다시 교섭하기까지(일)
    // 귀족의 권한 — 값 깎기(유럽·이슬람 도시의 교역소·시장): 작위의 무게(1~7) 한 칸마다 성공률 +p, 깎는 폭 +disc. 그 작위를 내린 나라의 땅에서는 ×own
    haggle: { p: 0.04, disc: 0.005, own: 1.5 },
    // 특허장 (왕궁 메뉴 「특허장」 — 그 나라의 작위가 있어야 받는다). 값은 작위 무게 한 칸마다 rankCut만큼 싸진다
    //  사략허가장: 한 나라를 정해 marqueYears년 — 그 나라 배를 쳐도 악명이 오르지 않고, 한 척마다 포상금 bounty닢·전투 명성 bountyFame.
    //             그 나라 항구 warNear° 안에서 하루 marqueSpawn 확률로 그 나라 배가 나타난다.
    //  면세증: exemptYears년 — 그 나라가 다스리는 항구의 교역소에서 사는 값 −duty, 들여온 물건 파는 값 +duty
    papers: { marqueFee: 6000, marqueYears: 2, bounty: 500, bountyFame: 10, marqueSpawn: 0.12, exemptFee: 12000, exemptYears: 1, duty: 0.08, rankCut: 0.05 }
  };

  // 제 나라 귀족 사다리 (아래 → 위) — 사용자 지정: 피달구/이달고 → 영주 → 남작 → 자작 → 백작 → 후작 → 공작
  var PT = [
    ['피달구', 'Fidalgo', 'Fidalga', 1, '나리'], ['영주', 'Senhor', 'Senhora', 2, '나리'], ['남작', 'Barão', 'Baronesa', 3, '각하'], ['자작', 'Visconde', 'Viscondessa', 4, '각하'],
    ['백작', 'Conde', 'Condessa', 5, '각하'], ['후작', 'Marquês', 'Marquesa', 6, '각하'], ['공작', 'Duque', 'Duquesa', 7, '각하']
  ];
  var ES = [
    ['이달고', 'Hidalgo', 'Hidalga', 1, '나리'], ['영주', 'Señor', 'Señora', 2, '나리'], ['남작', 'Barón', 'Baronesa', 3, '각하'], ['자작', 'Vizconde', 'Vizcondesa', 4, '각하'],
    ['백작', 'Conde', 'Condesa', 5, '각하'], ['후작', 'Marqués', 'Marquesa', 6, '각하'], ['공작', 'Duque', 'Duquesa', 7, '각하']
  ];
  var BARBARY = [83, 82, 81, 85], ARABIA = [124, 109, 125], MALAY = [166, 170, 167], EAST = [191];
  var EU_LADY = ['마르가레테 왕녀', '엘리자베트 왕녀', '안나 왕녀', '카타리나 왕녀'], IS_LADY = ['아이셰 공주', '파티마 공주', '셀마 공주', '굴바하르 공주'];
  var TURK = [['오스만 제국', 0, 9999], ['하프스 왕조', 0, 1574], ['틀렘센 왕국', 0, 1554], ['맘루크 왕조', 0, 1517]];

  G.COURT = { realms: {
    PT: { name: '포르투갈', sponsors: ['pt_king'], nation: 'PT', kind: 'eu', lands: ['포르투갈'], ranks: PT,
      honor: [['그리스도 기사단 기사', 'Cavaleiro da Ordem de Cristo', 'Dama da Ordem de Cristo', 1, '나리'], ['명예 피달구', 'Fidalgo honorário', 'Fidalga honorária', 2, '나리'], ['왕실 고문 남작', 'Barão do Conselho', 'Baronesa do Conselho', 3, '각하']],
      foes: TURK.concat([['모로코', 0, 9999], ['구자라트 술탄국', 1500, 1573], ['캘리컷 왕국', 1500, 9999]]), dens: BARBARY, ladies: ['이자벨 왕녀', '베아트리스 왕녀', '마리아 왕녀', '주아나 왕녀'] },
    ES: { name: '에스파냐', sponsors: ['es_crown', 'es_aragon'], nation: 'ES', kind: 'eu', lands: ['카스티야', '아라곤', '에스파냐', '시칠리아'], ranks: ES,
      honor: [['산티아고 기사단 기사', 'Caballero de Santiago', 'Dama de Santiago', 1, '나리'], ['명예 이달고', 'Hidalgo de privilegio', 'Hidalga de privilegio', 2, '나리'], ['카스티야 명예 남작', 'Barón honorario', 'Baronesa honoraria', 3, '각하']],
      foes: TURK.concat([['그라나다 왕국', 0, 1492], ['프랑스', 1494, 1559], ['잉글랜드', 1585, 1604]]), dens: BARBARY, ladies: ['후아나 왕녀', '카탈리나 왕녀', '마리아 왕녀', '이사벨 왕녀'] },
    FR: { name: '프랑스', sponsors: ['fr_king'], kind: 'eu', lands: ['프랑스'],
      honor: [['생미셸 기사단 기사', "Chevalier de l'Ordre de Saint-Michel", "Dame de l'Ordre de Saint-Michel", 1, '나리'], ['남작', 'Baron', 'Baronne', 3, '각하'], ['백작', 'Comte', 'Comtesse', 5, '각하']],
      foes: [['카스티야', 1494, 1559], ['잉글랜드', 0, 1560], ['오스만 제국', 0, 1525]], dens: BARBARY, ladies: ['클로드 왕녀', '마르그리트 왕녀', '르네 왕녀'] },
    EN: { name: '잉글랜드', sponsors: ['en_king'], kind: 'eu', lands: ['잉글랜드', '영국'],
      honor: [['기사', 'Knight Bachelor', 'Dame', 1, '경'], ['남작', 'Baron', 'Baroness', 3, '각하'], ['가터 기사', 'Knight of the Garter', 'Lady of the Garter', 5, '경']],
      foes: [['프랑스', 0, 1560], ['카스티야', 1585, 1604], ['스코틀랜드', 0, 1560]], dens: BARBARY, ladies: ['메리 왕녀', '마거릿 왕녀', '엘리자베스 왕녀'] },
    HRE: { name: '신성로마제국', sponsors: ['de_emperor'], kind: 'eu', lands: ['오스트리아', '신성로마제국', '부르고뉴'],
      honor: [['제국 기사', 'Reichsritter', 'Reichsritterin', 1, '나리'], ['제국 남작', 'Reichsfreiherr', 'Reichsfreifrau', 3, '각하'], ['제국 백작', 'Reichsgraf · Imperial Count', 'Reichsgräfin · Imperial Countess', 5, '각하']],
      foes: [['오스만 제국', 0, 9999], ['프랑스', 1494, 1559], ['베네치아', 1508, 1516]], dens: BARBARY, ladies: EU_LADY },
    VE: { name: '베네치아', sponsors: ['it_doge'], kind: 'eu', lands: ['베네치아'],
      honor: [['산마르코 기사', 'Cavaliere di San Marco', 'Dama di San Marco', 1, '나리'], ['황금의 책에 오른 명예 귀족', 'Patrizio veneto', 'Patrizia veneta', 4, '각하']],
      foes: [['오스만 제국', 0, 9999], ['제노바', 0, 1500]], dens: BARBARY, ladies: ['도제의 조카딸 카테리나', '도제의 손녀 엘레나'] },
    PAPAL: { name: '교황청', sponsors: ['it_pope'], kind: 'eu', lands: ['교황령'],
      honor: [['황금 박차 기사', "Cavaliere dello Speron d'Oro", "Dama dello Speron d'Oro", 2, '나리'], ['라테라노 궁정백', 'Comes Palatinus Lateranus', 'Comitissa Palatina', 4, '각하']],
      foes: [['오스만 제국', 0, 9999], ['하프스 왕조', 0, 1574], ['틀렘센 왕국', 0, 1554]], dens: BARBARY, ladies: ['교황의 조카딸 루크레치아', '로마 귀족의 딸 줄리아'] },
    DK: { name: '덴마크', sponsors: ['dk_king'], kind: 'eu', lands: ['덴마크'],
      honor: [['기사', 'Ridder', 'Dame', 1, '나리'], ['코끼리 기사단 기사', 'Ridder af Elefantordenen', 'Dame af Elefantordenen', 4, '각하']],
      foes: [['스웨덴', 0, 9999], ['한자 동맹', 0, 1536]], dens: BARBARY, ladies: ['엘리사베트 왕녀', '도로테아 왕녀'] },
    PL: { name: '폴란드', sponsors: ['pl_king'], kind: 'eu', lands: ['폴란드'],
      honor: [['황금 박차 기사', 'Eques Auratus', 'Domina Aurata', 1, '나리'], ['폴란드 명예 귀족', 'Indygenat', 'Indygenat', 3, '각하']],
      foes: [['오스만 제국', 0, 9999], ['튜턴 기사단', 0, 1525]], dens: BARBARY, ladies: ['야드비가 왕녀', '안나 왕녀', '조피아 왕녀'] },
    RU: { name: '모스크바', sponsors: ['ru_prince'], kind: 'eu', lands: ['모스크바 대공국', '러시아 차르국', '러시아 제국'],
      honor: [['궁정 귀족', 'Dvoryanin', 'Dvoryanka', 1, '나리'], ['오콜니치', 'Okolnichy', 'Okolnichy', 3, '각하'], ['보야르', 'Boyar', 'Boyarynya', 5, '각하']],
      foes: [['리보니아', 0, 1561], ['스웨덴', 0, 9999], ['오스만 제국', 0, 9999]], dens: BARBARY, ladies: ['옐레나 공녀', '페오도시야 공녀'] },
    HU: { name: '헝가리', sponsors: ['hu_king'], kind: 'eu', lands: ['헝가리'],
      honor: [['용 기사단 기사', 'Societas Draconistarum', 'Societas Draconistarum', 1, '나리'], ['남작', 'Báró', 'Báróné', 3, '각하']],
      foes: [['오스만 제국', 0, 9999]], dens: BARBARY, ladies: EU_LADY },
    OT: { name: '오스만 제국', sponsors: ['ot_sultan'], kind: 'is', lands: ['오스만 제국'],
      honor: [['아아', 'Ağa', 'Hatun', 1, '나리'], ['베이', 'Bey', 'Hanım', 3, '나리'], ['파샤', 'Paşa', 'Sultan Hanım', 6, '각하']],
      foes: [['베네치아', 0, 9999], ['카스티야', 0, 9999], ['맘루크 왕조', 0, 1517], ['포르투갈', 1500, 9999]], dens: BARBARY, ladies: IS_LADY },
    EG: { name: '맘루크 왕조', sponsors: ['eg_sultan'], kind: 'is', lands: ['맘루크 왕조'],
      honor: [['십인장 아미르', 'Amīr ʿAshara', 'Khātūn', 1, '나리'], ['군악대 아미르', 'Amīr Ṭablkhāna', 'Khātūn', 3, '나리'], ['백인장 아미르', "Amīr Mi'a", 'Khātūn', 5, '각하']],
      foes: [['오스만 제국', 0, 9999], ['포르투갈', 1500, 9999]], dens: ARABIA, ladies: IS_LADY },
    PE: { name: '페르시아', sponsors: ['pe_shah'], kind: 'is', lands: ['아크코윤루', '사파비 왕조', '페르시아'],
      honor: [['베그', 'Beg', 'Begum', 2, '나리'], ['칸', 'Khān', 'Khānum', 5, '각하']],
      foes: [['오스만 제국', 0, 9999], ['호르무즈 왕국', 0, 1515]], dens: ARABIA, ladies: IS_LADY },
    HR: { name: '헤라트', sponsors: ['hr_baykara'], kind: 'is', lands: ['티무르 왕조'],
      honor: [['베그', 'Beg', 'Begum', 2, '나리'], ['아미르', 'Amīr', 'Khānum', 4, '각하']],
      foes: [], dens: ARABIA, ladies: IS_LADY },
    DL: { name: '델리', sponsors: ['in_delhi'], kind: 'is', lands: ['델리 술탄국', '무굴 제국'],
      honor: [['아미르', 'Amīr', 'Begum', 2, '나리'], ['말리크', 'Malik', 'Malika', 4, '각하'], ['칸', 'Khān', 'Khānum', 6, '각하']],
      foes: [['구자라트 술탄국', 0, 1573], ['포르투갈', 1500, 9999]], dens: ARABIA, ladies: IS_LADY },
    GJ: { name: '구자라트', sponsors: ['in_gujarat'], kind: 'is', lands: ['구자라트 술탄국'],
      honor: [['말리크', 'Malik', 'Malika', 2, '나리'], ['칸', 'Khān', 'Khānum', 4, '각하']],
      foes: [['포르투갈', 1500, 9999], ['캘리컷 왕국', 0, 9999]], dens: ARABIA, ladies: IS_LADY },
    MY: { name: '말라카', sponsors: ['my_malacca'], kind: 'is', lands: ['말라카 술탄국'],
      honor: [['오랑 카야', 'Orang Kaya', 'Orang Kaya', 2, '나리'], ['다툭', 'Datuk', 'Datin', 4, '각하']],
      foes: [['아유타야 왕국', 0, 9999], ['포르투갈', 1509, 9999], ['아체 술탄국', 0, 9999]], dens: MALAY, ladies: ['라덴 갈루 공주', '푸트리 하미다 공주'] },
    VJ: { name: '비자야나가르', sponsors: ['in_vijaya'], kind: 'as', lands: ['비자야나가르 제국'],
      honor: [['나야카', 'Nāyaka', 'Nāyakī', 3, '나리']], foes: [['바흐마니 술탄국', 0, 9999]], dens: ARABIA, ladies: ['티루말라 공주', '친나 공주'] },
    TH: { name: '아유타야', sponsors: ['th_king'], kind: 'as', lands: ['아유타야 왕국'],
      honor: [['쿤', 'Khun', 'Khun', 1, '나리'], ['루앙', 'Luang', 'Luang', 3, '나리'], ['프라', 'Phra', 'Phra', 5, '각하']],
      foes: [['한타와디 왕국', 0, 9999], ['말라카 술탄국', 0, 1511]], dens: MALAY, ladies: ['수리요타이 공주', '사왓 공주'] },
    KR: { name: '조선', sponsors: ['kr_king'], kind: 'as', lands: ['조선'],
      honor: [['수직 사정', '受職 司正', '受職 司正', 1, '나리'], ['수직 호군', '受職 護軍', '受職 護軍', 3, '영감'], ['수직 상호군', '受職 上護軍', '受職 上護軍', 5, '영감']],
      foes: [['일본', 1510, 1512], ['일본', 1555, 1556], ['일본', 1592, 1598]], dens: EAST, ladies: ['정순 옹주', '경현 공주'] }
  } };
  /* 서임 때 교서를 읽는 전속 신하. 얼굴·무릎상은 portraits/courtiers/<군주 id>(_half).webp 이다.
     같은 나라라도 카스티야와 아라곤처럼 군주 자리가 다르면 서로 다른 신하가 나온다. */
  G.COURT.courtiers = {
    pt_king: { name: '왕실 전령관' }, es_crown: { name: '카스티야 전령관' }, es_aragon: { name: '아라곤 궁정서기관' },
    fr_king: { name: '왕실 의전관' }, en_king: { name: '국왕 전령관' }, de_emperor: { name: '제국 전령관' },
    it_doge: { name: '수상부 서기관' }, it_pope: { name: '교황청 공증관' }, dk_king: { name: '왕실 원수' },
    pl_king: { name: '왕실 대법관' }, ru_prince: { name: '대공의 보야르' }, hu_king: { name: '왕실 의전관' },
    ot_sultan: { name: '디완 서기관' }, eg_sultan: { name: '다와다르' }, pe_shah: { name: '왕실 문서관' },
    hr_baykara: { name: '궁정 문서관' }, in_delhi: { name: '디완 서기관' }, in_gujarat: { name: '궁정 대리인' },
    my_malacca: { name: '벤타라' }, in_vijaya: { name: '왕실 서기관' }, th_king: { name: '왕실 전령관' },
    kr_king: { name: '승정원 승지' }
  };
  var by = {};
  Object.keys(G.COURT.realms).forEach(function (k) { var r = G.COURT.realms[k]; r.id = k; r.sponsors.forEach(function (id) { by[id] = k; }); });
  G.COURT.bySponsor = by;

  // 왕명의 종류. cat = 그 일을 마치면 오르는 명성의 갈래
  G.COURT.kinds = {
    geo:      { name: '지리상의 발견', cat: 'ex', icon: 'compass' },
    treasure: { name: '보물 발견', cat: 'ex', icon: 'chest' },
    zoo:      { name: '동물원 건설', cat: 'ex', icon: 'star' },
    supply:   { name: '교역품 납품', cat: 'tr', icon: 'sack' },
    tribute:  { name: '비용 지불', cat: 'tr', icon: 'coin' },
    capture:  { name: '적국 선박 나포', cat: 'bt', icon: 'sword' },
    rescue:   { name: '왕녀 구출', cat: 'bt', icon: 'crown' },
    pirates:  { name: '해적 토벌', cat: 'bt', icon: 'skull' },
    letter:   { name: '외교 문서', cat: 'so', icon: 'scroll' },
    envoy:    { name: '외교 특사', cat: 'so', icon: 'handshake' }
  };
  // 갈래마다 내놓을 수 있는 왕명
  G.COURT.byCat = { ex: ['geo', 'treasure', 'zoo'], tr: ['supply', 'tribute'], bt: ['capture', 'rescue', 'pirates'], so: ['letter', 'envoy'] };
})(window.G = window.G || {});
