/* 오스만과 유럽 세계의 다툼 (1529~1699) — 사람·기념품·조정값. 사건은 js/systems/ottomaneurope.js (G.OttoEu). 2026-11-01 사용자 요청
   제1차 빈 포위(1529) · 프레베자 해전(1538) · 페르시아의 호르무즈 탈환(1622) · 오만의 무스카트 탈환(1650) · 제2차 빈 포위와 칼렌베르크(1683) · 카를로비츠 조약(1699)
   (레판토 해전 1571은 이미 있다 — js/data/relevents.js cr_league1571)
   얼굴 그림: images/portraits/history/<id>.webp (448×448) · <id>_half.webp (1024×1536 투명 무릎상) — images/legend-events/OTTOMANEUROPE_PROMPT.md
   그림이 없으면 역할(role)·양식(st)으로 그린 얼굴. */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.ottoEu = G.BALANCE.ottoEu || {
    v1: { from: 15290901, to: 15291014, siege: 15290927, tunnel: 28, sortie: 70, tries: 2 },          // 제1차 빈 포위 — 9월 27일 에워싸고 10월 14일 물러난다
    pv: { from: 15380901, to: 15380928, box: [19.3, 21.6, 38.3, 39.9] },                               // 프레베자 앞바다 [서경, 동경, 남위, 북위]
    hz: { from: 16220209, to: 16220422 },                                                                // 호르무즈 — 4월 23일 요새가 항복
    ms: { from: 16491001, to: 16491224, imam: 60, warn: 80 },                                            // 무스카트 — 성탄 밤의 기습 (1650년 1월에 무너진다)
    v2: { spyFrom: 16830714, spyTo: 16830831, patrol: 24, battleFrom: 16830901, battleTo: 16830912, army: 130, coffeeTo: 16841231, coffee: 20 },
    kw: { from: 16981015, to: 16990125, cities: [54, 29, 112, 69], tries: 3 }                          // 비엔나 · 베니스 · 이스탄불 · 베오그라드
  };
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    // ── 제1차 빈 포위 (1529)
    ot_salm: { name: '니클라스 잘름 백작', title: '빈 수비대 사령관', st: 'ne', role: 'soldier', born: 1459,
      look: '70세, 희고 긴 수염, 주름 깊은 얼굴, 오래 입어 닳은 반갑옷, 등에 큰 양손검, 지친 눈빛이지만 꼿꼿한 자세' },
    ot_suleyman: { name: '쉴레이만 1세', title: '오스만 제국의 술탄 · 「입법자」', st: 'is', role: 'king', born: 1494,
      look: '30대 중반, 마르고 긴 얼굴, 매부리코, 가는 콧수염, 거대한 흰 터번에 깃털 보석, 금실 카프탄' },
    ot_ibrahim: { name: '이브라힘 파샤', title: '오스만 대재상 · 원정군 총사령관', st: 'is', role: 'official', born: 1495,
      look: '30대 중반, 그리스 출신의 날렵한 얼굴, 짧은 검은 수염, 붉은 카프탄과 높은 터번' },
    // ── 프레베자 해전 (1538)
    ot_capello: { name: '빈첸초 카펠로', title: '베네치아 함대 사령관', st: 'it', role: 'captain', born: 1469,
      look: '60대 후반, 짧은 흰 수염, 붉은 베네치아 귀족 망토, 손에 지휘봉, 성미 급한 눈' },
    ot_grimani: { name: '마르코 그리마니', title: '교황 함대 사령관 · 아퀼레이아 총대주교', st: 'it', role: 'priest', born: 1494,
      look: '40대, 성직자의 둥근 모자 위에 갑옷 목가리개, 붉은 망토, 깔끔한 수염' },
    // ── 호르무즈 (1622)
    ot_melo: { name: '시망 드 멜루', title: '호르무즈 요새 사령관', st: 'ib', role: 'soldier', born: 1580,
      look: '40대, 햇볕에 탄 얼굴, 지친 눈 밑의 그늘, 검은 수염, 땀에 젖은 흉갑과 붉은 십자 어깨띠' },
    ot_blyth: { name: '리처드 블라이스', title: '잉글랜드 동인도 회사 함대 사령관', st: 'ne', role: 'captain', born: 1580,
      look: '40대, 붉은 얼굴, 짧은 갈색 수염, 넓은 깃의 가죽 조끼와 챙 넓은 모자, 손에 망원경' },
    ot_imamquli: { name: '이맘 쿨리 칸', title: '파르스의 총독 · 사파비 군 사령관', st: 'pe', role: 'noble', born: 1580,
      look: '40대, 길고 검은 수염, 붉은 막대가 솟은 사파비식 터번(타지), 비단 겉옷 위의 사슬 갑옷, 허리에 굽은 칼' },
    // ── 무스카트 (1650)
    ot_narottam: { name: '나로탐', title: '무스카트 요새의 창고를 맡은 인도 상인', st: 'in', role: 'merchant', born: 1590,
      look: '60대 초반의 신드 출신 상인, 흰 터번과 흰 무명옷, 이마에 붉은 점, 굵은 은 반지, 걱정과 결의가 섞인 얼굴' },
    ot_pereira: { name: '페레이라', title: '무스카트 수비대장', st: 'ib', role: 'soldier', born: 1610,
      look: '30대 후반, 거만하게 올린 콧수염, 주름 장식 깃, 술잔을 든 손, 금단추 웃옷' },
    ot_saif: { name: '술탄 빈 사이프', title: '야루바 이맘의 사촌 · 오만 군 사령관 (뒷날 이맘)', st: 'is', role: 'noble', born: 1610,
      look: '30대 후반, 다부진 몸, 짙은 수염, 오만식 흰 디슈다샤에 짙은 남색 터번, 허리에 은 칸자르(굽은 단검)' },
    // ── 제2차 빈 포위 (1683)
    ot_kolschitzky: { name: '콜시츠키', full: '예지 프란치셰크 쿨치츠키', title: '통역 · 포위된 빈의 밀사', st: 'gr', role: 'merchant', born: 1640,
      look: '40대 초반, 장난스러운 눈, 짙은 콧수염, 튀르크 상인의 헐렁한 옷과 붉은 모자로 변장, 등에 작은 보따리' },
    ot_starhemberg: { name: '슈타르헴베르크 백작', full: '에른스트 뤼디거 폰 슈타르헴베르크', title: '빈 수비대 사령관', st: 'ne', role: 'soldier', born: 1638,
      look: '40대 중반, 긴 곱슬 가발, 붕대 감은 머리, 그을린 흉갑, 고집 센 턱' },
    ot_sobieski: { name: '얀 3세 소비에스키', title: '폴란드의 국왕 · 구원군 총사령관', st: 'gr', role: 'king', born: 1629,
      look: '50대, 넉넉한 몸, 머리를 짧게 민 폴란드 귀족식 머리, 처진 콧수염, 털 달린 망토와 독수리 깃털 모자, 손에 지휘봉' },
    ot_lorraine: { name: '로트링겐 공작 카를', title: '황제군 사령관', st: 'ne', role: 'noble', born: 1643,
      look: '40대 초반, 마른 얼굴, 긴 가발, 붉은 장교 띠와 반갑옷' },
    ot_karamustafa: { name: '카라 무스타파 파샤', title: '오스만 대재상 · 빈 원정군 총사령관', st: 'is', role: 'official', born: 1634,
      look: '50세, 무겁고 검은 수염, 오만한 눈, 거대한 터번과 담비 털 카프탄' },
    // ── 카를로비츠 조약 (1699)
    ot_paget: { name: '윌리엄 패짓 경', title: '잉글랜드 대사 · 강화 회담의 중재인', st: 'ne', role: 'official', born: 1637,
      look: '60대, 긴 회색 가발, 검은 외교관 옷과 흰 레이스 목장식, 인내심 많은 얼굴' },
    ot_mavro: { name: '알렉산드로스 마브로코르다토스', title: '오스만 궁정의 대통역관 · 술탄의 사절', st: 'is', role: 'scholar', born: 1641,
      look: '50대 후반, 그리스 출신, 희끗한 수염, 학자의 털모자와 길게 늘어진 검은 옷, 영리한 눈' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });
  G.OTTOEU_FIGS = Object.keys(L);

  // 기념품 (시장에서는 팔지 않는다)
  var IT = [
    { id: 'vienna_bowl', name: '케른트너 성문의 물 대야', gv: 18,
      desc: '1529년 빈의 성벽 밑 지하실에 놓았던 놋쇠 대야. 땅 밑에서 곡괭이가 울리면 물낯에 잔물결이 일었다. 그 물결을 보고 오스만 광부들의 굴을 찾아 무너뜨렸다.' },
    { id: 'hz_firman', name: '이맘 쿨리 칸의 통행장', gv: 22,
      desc: '1622년 호르무즈를 되찾은 사파비 군 사령관 이맘 쿨리 칸이 건넨 비단 통행장. 「샤 아바스의 바다에서 이 배를 막지 말라」고 적혀 있다. 포르투갈 사람들은 이 종이를 보면 얼굴을 붉힌다.' },
    { id: 'hz_ledger', name: '호르무즈 상관의 장부 상자', gv: 22,
      desc: '1622년 4월, 무너지는 호르무즈 요새에서 건져 낸 포르투갈 상관의 장부 상자. 백 년 동안 이 섬을 드나든 진주·말·비단의 셈이 적혀 있다.' },
    { id: 'narottam_ring', name: '나로탐의 은 반지', gv: 20,
      desc: '1649년 성탄 밤, 무스카트의 인도 상인 나로탐이 딸을 지켜 준 답례로 건넨 굵은 은 반지. 안쪽에 신드 글자로 「약속」이라 새겨져 있다.' },
    { id: 'kolschitzky_cup', name: '콜시츠키의 커피 잔', gv: 20,
      desc: '1683년 빈 포위가 끝난 뒤, 오스만 군이 버리고 간 커피 자루로 문을 연 콜시츠키의 커피 집에서 받은 잔. 빈 사람들 입맛에 맞춰 우유와 꿀을 넣었다.' },
    { id: 'karlowitz_knob', name: '카를로비츠 정자의 문고리', gv: 18,
      desc: '1699년 카를로비츠 강화 회담을 위해 지은 둥근 나무 정자의 문고리. 문을 사절단 수만큼 내어 누구도 먼저 들어서지 않게 했다.' }
  ];
  if (G.ITEMS && G.ITEM) IT.forEach(function (x) {
    if (G.ITEM[x.id]) return;
    var it = { id: x.id, name: x.name, kind: 'keepsake', price: 0, gv: x.gv, reg: [], desc: x.desc };
    G.ITEMS.push(it); G.ITEM[it.id] = it;
  });
})(window.G = window.G || {});
