/* Items: weapons, armor, navigation tools, gifts, special items. (original descriptions) */
(function (G) {
  'use strict';
  // kind: weapon armor tool gift special treasure
  // reg: regions where sold in markets (empty = special only)
  G.ITEMS = [
    // weapons (atk)
    { id: 'rapier', name: '레이피어', kind: 'weapon', atk: 6, price: 900, reg: [0, 1, 2], desc: '가볍고 날렵한 찌르기용 검.' },
    { id: 'longsword', name: '롱소드', kind: 'weapon', atk: 8, price: 1300, reg: [0, 1, 2], desc: '기사들이 즐겨 쓰는 양날검.' },
    { id: 'broadsword', name: '브로드소드', kind: 'weapon', atk: 10, price: 1800, reg: [1, 2], desc: '폭이 넓어 베기에 강한 검.' },
    { id: 'estoc', name: '에스톡', kind: 'weapon', atk: 12, price: 2600, reg: [1, 2], desc: '갑옷 틈을 노리는 찌르기 검.' },
    { id: 'bastard', name: '바스타드소드', kind: 'weapon', atk: 15, price: 3800, reg: [1], desc: '한손과 양손을 겸하는 장검.' },
    { id: 'twohand', name: '투핸드소드', kind: 'weapon', atk: 19, price: 5600, reg: [1], desc: '거대한 양손검. 한 번에 적을 쓰러뜨린다.' },
    { id: 'flamberge', name: '플랑베르주', kind: 'weapon', atk: 22, price: 8200, reg: [1, 2], desc: '물결치는 칼날의 명검.' },
    { id: 'saber', name: '사브르', kind: 'weapon', atk: 9, price: 1500, reg: [2, 4, 7], desc: '휘어진 기병용 검.' },
    { id: 'shamshir', name: '샴시르', kind: 'weapon', atk: 13, price: 3000, reg: [4, 7], desc: '페르시아의 초승달 검.' },
    { id: 'katar', name: '카타르', kind: 'weapon', atk: 11, price: 2400, reg: [5], desc: '인도의 주먹 단검.' },
    { id: 'firangi', name: '피랑기', kind: 'weapon', atk: 16, price: 4800, reg: [5], desc: '인도 무사의 장검.' },
    { id: 'shotel', name: '쇼텔', kind: 'weapon', atk: 12, price: 2800, reg: [3], desc: '낫처럼 굽은 아프리카의 검.' },
    { id: 'kris', name: '크리스', kind: 'weapon', atk: 10, price: 2100, reg: [8], desc: '물결 모양 칼날의 단검.' },
    { id: 'guandao', name: '청룡도', kind: 'weapon', atk: 20, price: 7600, reg: [6], desc: '팔고 있는 무기 중 최고로 강하다는 언월도.' },
    { id: 'katana', name: '일본도', kind: 'weapon', atk: 21, price: 8800, reg: [9], desc: '놀랄 만큼 잘 드는 동방의 칼.' },
    { id: 'macuahuitl', name: '마카나', kind: 'weapon', atk: 9, price: 1600, reg: [10], desc: '흑요석 날을 박은 목검.' },
    { id: 'excalibur', name: '성검 엑스칼리버', kind: 'weapon', atk: 50, price: 0, reg: [], rare: true, desc: '호수의 여인이 맡겼다는 전설의 검.' },
    { id: 'longinus', name: '롱기누스의 창', kind: 'weapon', atk: 30, price: 0, reg: [], rare: true, desc: '성스러운 힘이 깃든 창.' },
    // 암시장 명검 — 시장에는 나오지 않고, 그 도시의 뒷골목 암시장에서만 판다 (js/systems/blackmarket.js BM.SWORDS · style = 일기토의 공격 갈래)
    //   2026-10-21: 대항해시대 2의 지어낸 이름(성기사의 검·시바신의 마검·룬 블레이드)을 실존하는 명검으로 바꾸고 공격력 45 이상으로 (엑스칼리버 50 아래).
    //   id는 옛 저장 때문에 그대로 둔다 (claymore → 월리스의 검, shivablade → 줄피카르, runeblade → 울프베르트, paladin → 주와이외즈)
    { id: 'claymore', name: '월리스의 검', kind: 'weapon', atk: 45, price: 180000, reg: [], rare: true, style: 'bash', desc: '스코틀랜드의 영웅 윌리엄 월리스가 휘둘렀다는 키만 한 양손검. 1505년 제임스 4세가 손잡이를 새로 달게 했다는 그 칼이, 바다 건너 더블린 뒷골목에 나왔다.' },
    { id: 'shivablade', name: '줄피카르', kind: 'weapon', atk: 46, price: 200000, reg: [], rare: true, style: 'slash', desc: '예언자의 사위 알리가 지녔다고 전하는, 칼끝이 두 갈래로 갈라진 검. 벵골 술탄의 보물고에서 흘러나왔다는 소문이 캘커타 뒷골목에 돈다.' },
    { id: 'runeblade', name: '울프베르트', kind: 'weapon', atk: 46, price: 200000, reg: [], rare: true, style: 'slash', desc: '칼날에 「+VLFBERH+T」라는 글자를 상감한 북방의 옛 검. 바이킹 시대 장인이 도가니 강철로 벼려 지금 칼보다도 단단하다. 어느 배가 어떻게 브라질 해안까지 싣고 왔는지 아무도 모른다.' },
    { id: 'paladin', name: '주와이외즈', kind: 'weapon', atk: 48, price: 250000, reg: [], rare: true, style: 'slash', desc: '샤를마뉴 대제의 검이라 전하는 프랑스 왕가의 대관식 검 「기쁨」. 생드니 수도원 보물고에 있어야 할 칼이 사하라를 건너온 대상의 짐 속에서 나왔다 — 진짜인지는 칼만이 안다.' },
    { id: 'muramasa', name: '요도 무라마사', kind: 'weapon', atk: 47, price: 230000, reg: [], rare: true, style: 'slash', made: 1501, desc: '이세의 칼장인 무라마사가 벼린 칼. 너무 잘 들어 주인에게 화를 부른다는 소문 때문에 요도(妖刀)라 불린다.' },
    { id: 'saingeom', name: '사인검', kind: 'weapon', atk: 46, price: 210000, reg: [], rare: true, style: 'thrust', desc: '범의 해·범의 달·범의 날·범의 시, 네 번 겹친 범의 기운이 모인 때에만 벼린다는 조선 왕실의 곧은 양날검. 칼날에 북두칠성과 스물여덟 별자리를 금은으로 새기고 사악한 것을 베는 주문을 적었다. 궁궐 무기고에 있어야 할 한 자루가 한양 뒷골목에 나왔다.' },   // 2026-10-21 · 한양 암시장
    // armor (def)
    { id: 'leather', name: '가죽 갑옷', kind: 'armor', def: 3, price: 700, reg: [0, 1, 2, 3, 4, 10], desc: '무두질한 가죽 갑옷.' },
    { id: 'chain', name: '체인메일', kind: 'armor', def: 6, price: 1800, reg: [0, 1, 2], desc: '쇠고리를 엮은 사슬 갑옷.' },
    { id: 'brigandine', name: '브리간딘', kind: 'armor', def: 8, price: 2900, reg: [1, 2], desc: '천 속에 철판을 댄 갑옷.' },
    { id: 'scale', name: '스케일메일', kind: 'armor', def: 7, price: 2300, reg: [4, 7], desc: '비늘 모양 철편 갑옷.' },
    { id: 'breast', name: '브레스트플레이트', kind: 'armor', def: 10, price: 4200, reg: [1], desc: '가슴을 지키는 강철 흉갑.' },
    { id: 'plate', name: '플레이트메일', kind: 'armor', def: 14, price: 7800, reg: [1], desc: '온몸을 감싸는 판금 갑옷. 무겁다.' },
    { id: 'lamellar', name: '라멜라 갑옷', kind: 'armor', def: 9, price: 3400, reg: [6, 7], desc: '작은 철편을 끈으로 엮은 갑옷.' },
    { id: 'samurai', name: '무사 갑옷', kind: 'armor', def: 12, price: 6400, reg: [9], desc: '옻칠한 동방 무사의 갑옷.' },
    // 암시장 명품 갑옷 (2026-10-21, 대항해시대 2의 「성기사의 갑옷」 자리) — 아테네 뒷골목 암시장에만 (js/systems/blackmarket.js BM.SWORDS)
    //   방어 30: 일기토 피해 = … − 방어 × 0.5 라서 45면 해적 두목의 한 칼이 거의 들어가지 않는다 — 플레이트메일(14)의 두 배쯤
    { id: 'achilles', name: '아킬레우스의 갑옷', kind: 'armor', def: 30, price: 200000, reg: [], rare: true, desc: '대장장이 신 헤파이스토스가 하룻밤에 벼려 바다의 여신 테티스가 아들 아킬레우스에게 주었다는 청동 갑옷. 아테네 뒷골목의 골동 상인은 트로이 들판에서 파냈다고 우긴다.' },
    { id: 'oyoroi', name: '오요로이', kind: 'armor', def: 29, price: 190000, reg: [], rare: true, desc: '말 위에서 활을 쏘던 옛 무사 대장의 큰 갑옷. 옻칠한 작은 비늘판 수천 장을 붉은 실로 엮고, 가슴에는 사슴 가죽에 그림을 찍어 댔다. 대대로 신사에 바쳐 두던 것이 전란 통에 흘러나와 쿄토 뒷골목에 돈다.' },   // 2026-10-21 · 쿄토 암시장
    // tools
    { id: 'compass', name: '나침반', kind: 'tool', price: 600, reg: [0, 1, 2, 4, 6], desc: '진행 방향과 풍향을 정확히 알 수 있다.' },
    { id: 'sextant', name: '육분의', kind: 'tool', price: 2400, reg: [0, 1, 2], from: 1490, desc: '현재 위치의 위도와 경도를 알 수 있다.' },
    { id: 'astrolabe', name: '천문판', kind: 'tool', price: 1500, reg: [0, 2, 4], desc: '별로 위도를 잰다. 위도만 표시된다.' },
    { id: 'telescope', name: '망원경', kind: 'tool', price: 3800, reg: [1, 2], from: 1500, desc: '멀리 있는 함대를 먼저 발견하고, 망루와 정찰대가 수평선 너머의 발견물을 더 멀리서 알아챈다.' },
    { id: 'turban', name: '터번', kind: 'tool', price: 400, reg: [2, 3, 4, 5, 7, 8], desc: '이슬람 상인처럼 변장한다. 이슬람 도시에 잠입할 때 크게, 중국 항구(회회 상인이 오가던 광주·천주 등)에서는 조금 도움이 된다. 쓴다고 없어지지 않지만 들키면 불태워진다 — 여러 개 있으면 다음에 또 쓴다.' },
    { id: 'lime', name: '라임 절임', kind: 'tool', price: 600, reg: [0, 2, 3, 4, 5], consumable: 1, desc: '장기 항해의 괴혈병을 한동안(60일) 막아 준다. 이베리아·지중해·동아프리카·중근동·인도의 시장에서 판다.' },
    { id: 'cat', name: '배 고양이', kind: 'tool', price: 300, reg: [0, 1, 2], desc: '배에 사는 쥐를 잡아 식량을 지킨다.' },
    { id: 'charm', name: '행운의 부적', kind: 'tool', price: 1200, reg: [4, 3], desc: '이집트의 앵크. 작은 행운을 부른다.' },
    // gifts for ladies
    { id: 'ribbon', name: '비단 리본', kind: 'gift', price: 200, gv: 4, reg: [0, 1, 2, 4], desc: '고운 빛깔의 리본.' },
    { id: 'perfume', name: '향수', kind: 'gift', price: 600, gv: 8, reg: [2, 4], desc: '장미와 사향의 향수.' },
    { id: 'hairpin', name: '무지개 머리장식', kind: 'gift', price: 1400, gv: 12, reg: [2, 6], desc: '빛에 따라 색이 변하는 머리장식.' },
    { id: 'shawl', name: '행운의 케이프', kind: 'gift', price: 1800, gv: 14, reg: [1, 5], desc: '부드러운 캐시미어 숄.' },
    { id: 'pearlnk', name: '진주 목걸이', kind: 'gift', price: 3200, gv: 20, reg: [4, 5], desc: '큰 알 진주를 꿴 목걸이.' },
    { id: 'rose', name: '야음의 장미', kind: 'gift', price: 2400, gv: 17, reg: [2], desc: '밤에만 피는 검붉은 장미 브로치.' },
    { id: 'tears', name: '여신의 눈물', kind: 'gift', price: 6400, gv: 30, reg: [5, 8], desc: '눈물 모양의 푸른 보석.' },
    { id: 'ring', name: '약속 반지', kind: 'gift', price: 5000, gv: 25, ring: 1, reg: [0, 1, 2], desc: '청혼할 때 건네는 반지.' },
    // gifts for men (부하와 이야기 「선물한다」 — 남자 부하에게: 술·카드·장난감. 검·방어구도 줄 수 있다). gv = 선물의 값어치(충성이 오르는 만큼의 바탕)
    //   mg: 'drink' 술 · 'game' 카드·주사위·체스 · 'toy' 장난감 — 받는 사람의 말이 갈래마다 다르다
    { id: 'cards', name: '놀이 카드 한 벌', kind: 'mgift', mg: 'game', price: 150, gv: 3, reg: [0, 1, 2], desc: '목판으로 찍어 낸 카드 한 벌. 뱃사람들이 밤새 내기를 한다.' },
    { id: 'dice', name: '상아 주사위', kind: 'mgift', mg: 'game', price: 250, gv: 4, reg: [3, 4, 5, 6], desc: '상아를 깎아 만든 주사위 한 벌. 어느 항구 술집에서나 통한다.' },
    { id: 'sack', name: '헤레스 셰리 한 통', kind: 'mgift', mg: 'drink', price: 500, gv: 6, reg: [0], desc: '안달루시아 헤레스의 독한 포도주(색). 북쪽 뱃사람들이 가장 탐내는 술.' },
    { id: 'arak', name: '아락주', kind: 'mgift', mg: 'drink', price: 700, gv: 8, reg: [4, 5, 8], desc: '야자 수액과 쌀로 빚어 내린 동방의 독주. 한 모금에 눈물이 핑 돈다.' },
    { id: 'huangjiu', name: '소흥 황주', kind: 'mgift', mg: 'drink', price: 800, gv: 8, reg: [6], desc: '소흥에서 빚어 항아리째 묵힌 누런 술. 데워 마시면 속이 녹는다.' },
    { id: 'sake', name: '청주 한 통', kind: 'mgift', mg: 'drink', price: 800, gv: 8, reg: [9], desc: '쌀로 빚은 맑은 술. 삼나무 통 냄새가 은은하다.' },
    { id: 'brandy', name: '브랜디 한 통', kind: 'mgift', mg: 'drink', price: 900, gv: 9, reg: [1, 2], desc: '포도주를 끓여 거른 「불탄 포도주」. 추운 바다에서 뱃속을 데운다.' },
    { id: 'tarocchi', name: '타로키 카드', kind: 'mgift', mg: 'game', price: 900, gv: 9, reg: [2], desc: '밀라노 공방에서 금박을 입혀 그린 귀족의 카드. 놀이에도 점에도 쓴다.' },
    { id: 'shipmodel', name: '범선 모형', kind: 'mgift', mg: 'toy', price: 1600, gv: 13, reg: [0, 1, 2], desc: '돛과 밧줄까지 깎아 맞춘 카락선 모형. 뱃사람이면 누구나 눈을 떼지 못한다.' },
    { id: 'chess', name: '상아 체스판', kind: 'mgift', mg: 'game', price: 2200, gv: 16, reg: [2, 4], desc: '흑단과 상아로 짠 체스판과 말. 한 판 두자는 사람이 줄을 선다.' },
    { id: 'automaton', name: '태엽 장난감 기사', kind: 'mgift', mg: 'toy', price: 3600, gv: 22, reg: [1], from: 1500, desc: '뉘른베르크 장인의 태엽 인형. 감으면 칼을 휘두르며 걷는다.' },
    // special battle items
    { id: 'rapidgun', name: '속사포', kind: 'special', price: 9000, reg: [], rare: true, desc: '해전에서 포격을 두 번 할 수 있다.' },
    { id: 'shells', name: '작렬탄', kind: 'special', price: 5200, reg: [1], from: 1510, consumable: 3, desc: '해전에서 포격 위력이 크게 오른다. (3회)' },
    { id: 'divebomb', name: '잠수 폭탄', kind: 'special', price: 0, reg: [], rare: true, desc: '적의 배 밑에서 터지는 신기한 무기.' },
    { id: 'dango', name: '수수 경단', kind: 'special', price: 60, reg: [9], consumable: 1, desc: '먹으면 기분이 좋아져 피로가 풀린다.' },
    // 야영지에서 얻는 것 (js/systems/castaway.js)
    { id: 'wilson', name: '윌슨', kind: 'tool', price: 30, reg: [], rare: true, desc: '같은 야영지를 맴돌던 대원이 낡은 가죽 공에 숯으로 얼굴을 그려 넣은 말 없는 친구. 함께 있으면 야영에서 쉴 때 피로가 더 풀린다.' },
    { id: 'castawaylog', name: '표류기', kind: 'tool', price: 1600, reg: [], rare: true, desc: '한 야영지에서 석 달을 버티며 적은 나날의 기록. 물이 나는 곳·사냥감 다니는 길·날씨를 읽는 법이 담겨 육상 탐험 경비가 줄고 사냥·물 긷기가 넉넉해진다.' },
    { id: 'mingrobe', name: '명나라 옷', kind: 'tool', price: 700, reg: [6, 8], desc: '명나라 상인의 단령(團領)과 망건. 쇄국한 중국 도시에 잠입할 때 크게 도움이 된다. 쓴다고 없어지지 않지만 들키면 불태워진다 — 여러 개 있으면 다음에 또 쓴다.' },
    // 토르데시야스 조약 뒤 암시장에서만 (js/systems/blackmarket.js) — 상대 왕실 항구에 그 나라 배처럼 들어간다 (js/systems/sneak.js)
    { id: 'flag_pt', name: '포르투갈 국기', kind: 'tool', price: 900, reg: [], rare: true, desc: '흰 바탕에 방패와 혼천의를 그린 포르투갈 왕실의 깃발. 토르데시야스 조약으로 막힌 포르투갈 항구에 잠입할 때 포르투갈 배 행세를 한다. 들키면 불태워진다 — 여러 장 있으면 다음에 또 쓴다.' },
    { id: 'flag_es', name: '에스파냐 국기', kind: 'tool', price: 900, reg: [], rare: true, desc: '부르고뉴 십자가를 그린 에스파냐 왕실의 깃발. 토르데시야스 조약으로 막힌 에스파냐 항구에 잠입할 때 에스파냐 배 행세를 한다. 들키면 불태워진다 — 여러 장 있으면 다음에 또 쓴다.' }
  ];
  G.ITEM = {}; G.ITEMS.forEach(function (it) { G.ITEM[it.id] = it; });
  G.ITEM_KIND = { weapon: '무기', armor: '방어구', tool: '항해도구', gift: '장신구', mgift: '남자 선물', special: '특수', treasure: '보물', evidence: '증거품' };
})(window.G = window.G || {});
