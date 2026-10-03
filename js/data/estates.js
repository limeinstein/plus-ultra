/* 도시의 저택과 도서관을 늘린다 — 그 시대에 그 도시에서 실제로 활동한 정치인·귀족과, 장서가 있었던 도시.
   · 저택: G.SPONSORS 에 후원자(bld: 'mansion')로 더한다. holders 는 [시작 해, 끝 해, 이름] — 자리에 아무도 없는 해에는 저택이 비어 있다.
     1600년을 넘겨 끝나는 자리는 rulers.js 가 그 직함으로 이어 준다(한 사람만의 저택은 그 사람과 함께 끝난다).
   · 도서관: G.LIBRARY_MORE[도시] = 그 서가에 꽂을 책 (books.js 가 libs 에 더한다). 책이 꽂힌 도시에는 도서관이 선다(R.facilities).
   people.js 다음, rulers.js 앞에서 읽는다. 이름·연도는 역사 자료를 따랐고 글은 이 게임을 위해 새로 썼다. */
(function (G) {
  'use strict';
  var L = [];
  // m(id, 직함, 종류, 도시, 힘, 재력, 언어, 종교, 나라, 취향, 차례)
  function m(id, title, type, city, pw, wealth, lang, rel, nation, taste, holders) {
    var o = { id: id, title: title, type: type, city: city, bld: 'mansion', pw: pw, wealth: wealth, lang: lang, rel: rel, taste: taste, holders: holders };
    if (nation) o.nation = nation;
    L.push(o);
  }

  // ------------------------------------------------------------------ 이베리아
  m('es_tendilla', '그라나다 총사령관', 'noble', 10, 3, 3, 0, 'C', 'ES', ['ruin', 'treasure'],
    [[1492, 1515, '텐디야 백작 이니고 로페스 데 멘도사'], [1515, 1566, '몬데하르 후작 루이스 우르타도 데 멘도사'], [1566, 1650, '몬데하르 후작 가문 당주']]);
  m('es_toledo', '톨레도 대주교·왕국 재상', 'official', 4, 4, 4, 0, 'C', 'ES', ['people', 'ruin'],
    [[1482, 1495, '멘도사 추기경'], [1495, 1517, '시스네로스 추기경'], [1517, 1650, '톨레도 대주교']]);
  m('es_capitan', '대장군', 'noble', 6, 3, 3, 0, 'C', 'ES', ['treasure', 'people'],
    [[1480, 1515, '곤살로 페르난데스 데 코르도바'], [1515, 1650, '세사 공작 가문 당주']]);
  m('es_cardona', '카르도나 공작', 'noble', 12, 3, 4, 2, 'C', 'ES', ['trade', 'treasure'],
    [[1480, 1513, '후안 라몬 폴크 데 카르도나'], [1513, 1650, '카르도나 공작 가문 당주']]);
  // ------------------------------------------------------------------ 프랑스
  m('fr_brittany', '브르타뉴 공작', 'noble', 17, 3, 3, 2, 'C', null, ['geo', 'creature'],
    [[1480, 1488, '프랑수아 2세 공작'], [1488, 1514, '안 드 브르타뉴']]);
  m('fr_amboise', '루앙 대주교·국왕 재상', 'official', 15, 4, 4, 2, 'C', 'FR', ['ruin', 'treasure'],
    [[1494, 1510, '조르주 당부아즈 추기경'], [1510, 1650, '루앙 대주교']]);
  m('fr_guise', '기즈 공작', 'noble', 14, 4, 4, 2, 'C', 'FR', ['treasure', 'people'],
    [[1528, 1550, '기즈 공작 클로드'], [1550, 1563, '기즈 공작 프랑수아'], [1563, 1588, '기즈 공작 앙리'], [1588, 1640, '기즈 공작 샤를']]);
  m('fr_minister', '국왕 재상', 'official', 14, 5, 4, 2, 'C', 'FR', ['geo', 'trade'],
    [[1598, 1611, '쉴리 공작 (재무경)'], [1624, 1642, '리슐리외 추기경'], [1642, 1661, '마자랭 추기경'], [1661, 1683, '장바티스트 콜베르']]);
  m('fr_montaigne', '보르도의 귀족·시장', 'official', 18, 2, 2, 2, 'C', 'FR', ['people', 'nature'],
    [[1571, 1592, '미셸 드 몽테뉴']]);
  // ------------------------------------------------------------------ 저지대
  m('nl_regent', '네덜란드 섭정', 'noble', 25, 4, 4, 3, 'C', null, ['treasure', 'people', 'geo'],
    [[1507, 1530, '오스트리아의 마르가레테'], [1531, 1555, '헝가리의 마리아'], [1559, 1567, '파르마의 마르가레타'], [1567, 1573, '알바 공작'], [1578, 1592, '파르마 공작 알레산드로 파르네세'], [1598, 1621, '알브레히트 대공']]);
  m('nl_gruuthuse', '그뤼트후제 영주', 'noble', 22, 2, 3, 3, 'C', null, ['ruin', 'people'],
    [[1480, 1492, '루이 드 그뤼트후제'], [1492, 1512, '장 드 그뤼트후제']]);
  m('nl_amsterdam', '암스테르담 시장', 'official', 24, 3, 4, 3, 'C', null, ['trade', 'geo'],
    [[1588, 1626, '코르넬리스 호프트'], [1627, 1652, '안드리스 비커르'], [1652, 1700, '암스테르담 시장']]);
  // ------------------------------------------------------------------ 이탈리아
  m('it_trivulzio', '프랑스 원수', 'noble', 26, 3, 3, 2, 'C', null, ['treasure', 'creature'],
    [[1480, 1518, '잔 자코모 트리불치오']]);
  m('it_doria', '제노바 제독', 'noble', 28, 4, 4, 2, 'C', null, ['geo', 'trade'],
    [[1528, 1560, '안드레아 도리아'], [1560, 1606, '잔안드레아 도리아'], [1606, 1650, '도리아 가문 당주']]);
  m('it_contarini', '베네치아 대사', 'official', 29, 2, 3, 2, 'C', null, ['people', 'trade'],
    [[1520, 1542, '가스파로 콘타리니']]);
  m('it_machiavelli', '피렌체 공화국 서기장', 'official', 30, 2, 1, 2, 'C', null, ['people', 'ruin'],
    [[1498, 1527, '니콜로 마키아벨리']]);
  m('it_farnese', '파르네세 추기경', 'noble', 33, 4, 4, 2, 'C', null, ['ruin', 'treasure'],
    [[1493, 1534, '알레산드로 파르네세 추기경'], [1534, 1589, '알레산드로 파르네세 (조카) 추기경'], [1591, 1626, '오도아르도 파르네세 추기경']]);
  m('it_sanseverino', '살레르노 대공', 'noble', 34, 3, 4, 2, 'C', null, ['treasure', 'nature'],
    [[1480, 1487, '안토넬로 산세베리노'], [1507, 1552, '페란테 산세베리노']]);
  // ------------------------------------------------------------------ 브리튼·아일랜드
  m('en_minister', '국왕 수석 대신', 'official', 38, 5, 4, 3, 'C', 'EN', ['geo', 'trade', 'treasure'],
    [[1515, 1529, '토머스 울지 추기경'], [1532, 1540, '토머스 크롬웰'], [1558, 1598, '벌리 경 윌리엄 세실'], [1598, 1612, '로버트 세실']]);
  m('en_north', '북부 평의회 의장', 'official', 41, 2, 2, 3, 'C', 'EN', ['ruin', 'people'],
    [[1572, 1595, '헌팅던 백작 헨리 헤이스팅스'], [1595, 1650, '북부 평의회 의장']]);
  m('sc_moray', '스코틀랜드 섭정', 'noble', 42, 3, 2, 3, 'C', null, ['people', 'geo'],
    [[1561, 1570, '머리 백작 제임스 스튜어트']]);
  m('ie_kildare', '아일랜드 총독', 'noble', 43, 3, 2, 3, 'C', null, ['creature', 'people'],
    [[1480, 1513, '킬데어 백작 제럴드 피츠제럴드'], [1513, 1534, '킬데어 백작 제럴드 오그'], [1534, 1650, '아일랜드 총독']]);
  // ------------------------------------------------------------------ 신성로마제국·중부 유럽
  m('de_cologne', '쾰른 선제후', 'noble', 47, 3, 3, 3, 'C', null, ['ruin', 'treasure'],
    [[1480, 1508, '헤르만 4세 폰 헤센'], [1508, 1515, '필리프 2세 폰 다운'], [1515, 1547, '헤르만 5세 폰 비트'], [1547, 1650, '쾰른 선제후']]);
  m('de_pirckheimer', '뉘른베르크 시 참사회원', 'official', 51, 2, 3, 3, 'C', null, ['ruin', 'geo'],
    [[1495, 1530, '빌리발트 피르크하이머']]);
  m('bo_rozmberk', '로젠베르크 가문', 'noble', 53, 3, 4, 4, 'C', null, ['treasure', 'creature'],
    [[1551, 1592, '로젠베르크의 빌렘'], [1592, 1611, '로젠베르크의 페테르 보크']]);
  m('at_salm', '빈 수비 사령관', 'noble', 54, 2, 2, 3, 'C', null, ['people', 'treasure'],
    [[1500, 1530, '니클라스 잘름 백작']]);
  m('pl_zamoyski', '폴란드 왕국 재상', 'official', 62, 3, 4, 4, 'C', null, ['people', 'ruin'],
    [[1578, 1605, '얀 자모이스키']]);
  m('hu_bakocz', '헝가리 왕국 재상', 'official', 63, 3, 4, 3, 'C', null, ['treasure', 'ruin'],
    [[1486, 1521, '바코츠 터마시']]);
  // ------------------------------------------------------------------ 북유럽·러시아
  m('se_regent', '스웨덴 섭정·재상', 'noble', 64, 3, 3, 3, 'C', null, ['geo', 'creature'],
    [[1480, 1503, '스텐 스투레'], [1512, 1520, '스텐 스투레 2세'], [1612, 1654, '악셀 옥센셰르나']]);
  m('dk_brahe', '천문학자 귀족', 'noble', 66, 2, 3, 3, 'C', null, ['geo', 'nature'],
    [[1576, 1597, '튀코 브라헤']]);
  m('ru_regent', '차르의 섭정', 'noble', 60, 4, 4, 4, 'O', null, ['creature', 'trade'],
    [[1584, 1598, '보리스 고두노프'], [1619, 1633, '필라레트 총대주교']]);
  m('ua_ostrogski', '키예프 총독', 'noble', 61, 3, 4, 4, 'O', null, ['ruin', 'people'],
    [[1559, 1608, '콘스탄티 오스트로그스키 공']]);
  // ------------------------------------------------------------------ 이슬람 세계
  m('ot_vizier', '오스만 대재상', 'official', 112, 5, 5, 5, 'I', null, ['trade', 'treasure', 'geo'],
    [[1480, 1481, '카라마니 메흐메트 파샤'], [1497, 1516, '헤르세크자데 아흐메트 파샤'], [1523, 1536, '파르가르 이브라힘 파샤'], [1565, 1579, '소콜루 메흐메트 파샤'], [1579, 1700, '오스만 대재상']]);
  m('ot_nasi', '낙소스 공작', 'noble', 112, 3, 5, 5, 'I', null, ['trade', 'people'],
    [[1554, 1579, '요세프 나시']]);
  m('sy_pasha', '다마스쿠스 총독', 'official', 119, 3, 3, 5, 'I', null, ['trade', 'ruin'],
    [[1480, 1516, '맘루크 다마스쿠스 태수'], [1516, 1520, '자나비르디 알 가잘리'], [1520, 1700, '다마스쿠스 파샤']]);
  m('pe_fars', '파르스 총독', 'noble', 129, 3, 4, 6, 'I', null, ['ruin', 'treasure'],
    [[1595, 1613, '알라베르디 칸'], [1613, 1632, '이맘쿨리 칸']]);
  m('hr_navai', '헤라트의 대신·시인', 'official', 135, 2, 3, 6, 'I', null, ['ruin', 'people'],
    [[1480, 1501, '알리셰르 나바이']]);
  // ------------------------------------------------------------------ 인도
  m('in_vakil', '무굴 대신', 'official', 145, 4, 4, 6, 'I', null, ['treasure', 'creature'],
    [[1556, 1560, '바이람 칸 (섭정)'], [1579, 1602, '아불 파즐']]);
  m('in_timmarasu', '비자야나가르 재상', 'official', 153, 3, 4, 8, 'H', null, ['treasure', 'trade'],
    [[1509, 1529, '살루바 팀마루수']]);
  // ------------------------------------------------------------------ 중국·일본
  m('cn_grand', '내각 수보 대학사', 'official', 188, 4, 3, 7, 'K', null, ['geo', 'treasure'],
    [[1480, 1487, '만안'], [1513, 1524, '양정화'], [1572, 1582, '장거정'], [1582, 1644, '내각 수보']]);
  m('cn_wang', '남경 병부상서', 'official', 178, 3, 2, 7, 'K', null, ['people', 'nature'],
    [[1521, 1528, '왕수인 (양명)'], [1528, 1644, '남경 병부상서']]);
  m('cn_hu', '절강 총독', 'official', 177, 3, 3, 7, 'K', null, ['geo', 'creature'],
    [[1556, 1563, '호종헌']]);
  m('jp_tenka', '천하인', 'noble', 193, 5, 5, 13, 'J', null, ['treasure', 'trade', 'people'],
    [[1568, 1582, '오다 노부나가'], [1582, 1598, '도요토미 히데요시'], [1600, 1616, '도쿠가와 이에야스']]);
  m('jp_omura', '오무라 영주', 'noble', 191, 2, 2, 13, 'J', null, ['trade', 'people'],
    [[1563, 1587, '오무라 스미타다']]);
  // ------------------------------------------------------------------ 아메리카
  m('es_cortes', '오아하카 계곡 후작', 'noble', 201, 3, 5, 0, 'C', 'ES', ['treasure', 'ruin'],
    [[1529, 1547, '에르난 코르테스'], [1547, 1650, '오아하카 계곡 후작 가문 당주']]);
  m('pt_brazil', '브라질 총독', 'gov', 215, 3, 3, 1, 'C', 'PT', ['nature', 'trade'],
    [[1549, 1553, '토메 드 소우자'], [1553, 1558, '두아르트 다 코스타'], [1558, 1572, '멩 드 사'], [1572, 1650, '브라질 총독']]);
  m('pt_rio', '리우데자네이루 총독', 'gov', 216, 2, 2, 1, 'C', 'PT', ['nature', 'geo'],
    [[1565, 1567, '에스타시우 드 사'], [1568, 1598, '살바도르 코헤이아 드 사']]);
  m('nl_stuyvesant', '뉴네덜란드 총독', 'gov', 254, 2, 2, 3, 'C', null, ['trade', 'nature'],
    [[1647, 1664, '피터르 스타위베산트']]);
  m('en_winthrop', '매사추세츠 만 총독', 'gov', 256, 2, 2, 3, 'C', 'EN', ['nature', 'people'],
    [[1630, 1649, '존 윈스럽']]);
  m('fr_champlain', '누벨프랑스 총독', 'gov', 251, 2, 1, 2, 'C', 'FR', ['geo', 'people', 'nature'],
    [[1608, 1635, '사뮈엘 드 샹플랭']]);
  m('en_penn', '펜실베이니아 영주', 'noble', 263, 2, 3, 3, 'C', 'EN', ['people', 'nature'],
    [[1682, 1718, '윌리엄 펜']]);

  // 저택을 사람 이름 대신 가문·자리 이름으로 부르는 곳 (city.js C.mansionName)
  var HOUSE = { fr_brittany: '브르타뉴 공작', fr_guise: '기즈 공작', nl_regent: '섭정', ot_vizier: '대재상', es_toledo: '대주교', fr_amboise: '대주교', cn_grand: '대학사', jp_tenka: '천하인' };
  L.forEach(function (o) { if (HOUSE[o.id]) o.house = HOUSE[o.id]; });
  // 같은 id가 이미 있으면 그쪽을 따른다 (다른 파일에서 먼저 넣은 인물)
  var have = {}; (G.SPONSORS || []).forEach(function (s) { have[s.id] = true; });
  L.forEach(function (o) { if (!have[o.id]) { G.SPONSORS.push(o); G.SPONSOR[o.id] = o; } });

  // ------------------------------------------------------------------ 도서관
  // 대학·인쇄소·왕실 문고·모스크 학당·서원 같은 장서가 있었던 도시 → 그 서가에 둘 책
  G.LIBRARY_MORE = {
    11: ['b_nebrija', 'b_colon', 'b_martyr', 'b_ptolemy', 'b_pliny'],                 // 발렌시아 — 대학(1499), 에스파냐 첫 인쇄소
    5: ['b_nebrija', 'b_aeneid', 'b_legenda', 'b_ptolemy'],                           // 사라고사 — 대학, 아라곤 기록
    6: ['b_alhambra', 'b_idrisi', 'b_nebrija', 'b_pliny', 'b_aeneid'],                // 코르도바 — 옛 칼리프 도서관의 고장, 대성당 장서
    19: ['b_grandes', 'b_legenda', 'b_ptolemy', 'b_herodotus'],                        // 툴루즈 — 대학
    20: ['b_polo', 'b_mandeville', 'b_grandes', 'b_jandun', 'b_pigafetta'],           // 리옹 — 인쇄의 도시
    22: ['b_morte', 'b_mandeville', 'b_legenda', 'b_grandes', 'b_polo'],              // 브뤼즈 — 그뤼트후제 문고, 캑스턴의 첫 인쇄
    25: ['b_martyr', 'b_cortes', 'b_munster', 'b_grandes', 'b_herberstein'],          // 브뤼셀 — 부르고뉴 공작 문고
    24: ['b_northpass', 'b_munster', 'b_pigafetta', 'b_raleigh', 'b_southland', 'b_orta', 'b_barros'],   // 암스테르담 — 지도 출판
    26: ['b_pliny', 'b_vitruvius', 'b_toscanelli', 'b_polo', 'b_dante', 'b_ptolemy'],   // 밀라노 — 스포르차 문고(파비아)
    34: ['b_aeneid', 'b_pliny', 'b_suetonius', 'b_dante', 'b_legenda'],               // 나폴리 — 아라곤 왕실 문고
    41: ['b_beowulf', 'b_morte', 'b_chaucer', 'b_legenda', 'b_brendan'],               // 요크 — 대성당 장서
    42: ['b_chaucer', 'b_brendan', 'b_heims', 'b_northpass', 'b_munster'],            // 에든버러 — 대학(1582)
    43: ['b_brendan', 'b_legenda', 'b_chaucer', 'b_vinland'],                          // 더블린 — 트리니티 칼리지
    48: ['b_munster', 'b_behaim', 'b_ptolemy', 'b_herberstein', 'b_parzival', 'b_olaus'],   // 프랑크푸르트 — 책 박람회
    49: ['b_ptolemy', 'b_behaim', 'b_munster', 'b_parzival'],                          // 스트라스부르크 — 인쇄, 1513년 프톨레마이오스
    51: ['b_behaim', 'b_munster', 'b_polo', 'b_mandeville', 'b_parzival'],            // 뉘른베르크 — 지구의와 연대기의 도시
    52: ['b_munster', 'b_herberstein', 'b_pigafetta', 'b_polo', 'b_ptolemy'],         // 아우크스부르크 — 푸거 문고
    57: ['b_heims', 'b_olaus', 'b_primary', 'b_munster'],                              // 쾨니히스베르크 — 대학(1544)
    63: ['b_hungary', 'b_ptolemy', 'b_strabo', 'b_philo', 'b_diodorus', 'b_herodotus'],   // 부다 — 마차시 왕의 코르비누스 문고
    61: ['b_primary', 'b_rila', 'b_strabo', 'b_cosmas'],                                // 키예프 — 동굴 수도원
    64: ['b_olaus', 'b_heims', 'b_vinland', 'b_beowulf'],                              // 스톡홀름 — 웁살라 대학의 고장
    71: ['b_polo', 'b_strabo', 'b_pausanias', 'b_dante', 'b_legenda'],                 // 라구사 — 수도원 장서와 공화국 기록
    73: ['b_strabo', 'b_pausanias', 'b_philo', 'b_aristeas', 'b_cosmas', 'b_tursun'],   // 살로니카 — 유대 인쇄소(1492년 뒤)
    131: ['b_rashid', 'b_shahnameh', 'b_hafez', 'b_masudi'],                           // 타브리즈 — 라시드 앗 딘의 학원
    120: ['b_aristeas', 'b_legenda', 'b_mandeville', 'b_jubayr', 'b_masudi'],         // 예루살렘 — 수도원·마드라사
    123: ['b_battuta', 'b_jubayr', 'b_majid', 'b_masudi', 'b_idrisi'],                // 메카 — 순례자의 학당
    82: ['b_idrisi', 'b_leo', 'b_battuta', 'b_maqrizi', 'b_nights'],                   // 튀니스 — 자이투나 모스크
    95: ['b_griot', 'b_battuta', 'b_leo', 'b_tarikh'],                                 // 젠네 — 학자의 도시
    146: ['b_babur', 'b_shahnameh', 'b_hafez', 'b_ramayana'],                          // 라호르 — 무굴 궁정
    149: ['b_hafez', 'b_shahnameh', 'b_vijaya', 'b_battuta'],                          // 비자푸르 — 아딜 샤 왕실 문고
    177: ['b_songshi', 'b_shiji', 'b_mahuan', 'b_xuanzang', 'b_shanhai'],             // 항주 — 송의 서울, 출판
    176: ['b_mahuan', 'b_zhenla', 'b_shanhai', 'b_hongxia'],                            // 복주 — 건양의 서방(책방)
    184: ['b_shiji', 'b_hanshu', 'b_xuanzang', 'b_houhan', 'b_faxian'],               // 서안 — 비림(비석의 숲)
    185: ['b_songshi', 'b_houhan', 'b_shiji', 'b_shanhai'],                            // 개봉 — 옛 송의 서울
    165: ['b_shiji', 'b_hanshu', 'b_zhenla', 'b_mahuan'],                              // 교도(탕롱) — 문묘·국자감
    191: ['b_kojiki', 'b_haedong', 'b_polo', 'b_legenda', 'b_ricci'],                 // 나가사키 — 예수회 인쇄소(1590)
    222: ['b_cieza', 'b_acosta', 'b_quipu', 'b_oviedo', 'b_gomara'],                  // 리마 — 산마르코스 대학(1551)
    194: ['b_colon', 'b_oviedo', 'b_martyr', 'b_cabeza'],                              // 산토도밍고 — 신대륙 첫 대학(1538)
    256: ['b_raleigh', 'b_northpass', 'b_munster', 'b_vinland'],                       // 보스턴 — 하버드 칼리지(1636)
    251: ['b_northpass', 'b_grandes', 'b_jandun', 'b_legenda']                         // 퀘벡 — 예수회 학교(1635)
  };
})(window.G = window.G || {});
