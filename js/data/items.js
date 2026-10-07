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
    { id: 'excalibur', name: '성검 엑스칼리버', kind: 'weapon', atk: 34, price: 0, reg: [], rare: true, desc: '호수의 여인이 맡겼다는 전설의 검.' },
    { id: 'longinus', name: '롱기누스의 창', kind: 'weapon', atk: 30, price: 0, reg: [], rare: true, desc: '성스러운 힘이 깃든 창.' },
    // armor (def)
    { id: 'leather', name: '가죽 갑옷', kind: 'armor', def: 3, price: 700, reg: [0, 1, 2, 3, 4, 10], desc: '무두질한 가죽 갑옷.' },
    { id: 'chain', name: '체인메일', kind: 'armor', def: 6, price: 1800, reg: [0, 1, 2], desc: '쇠고리를 엮은 사슬 갑옷.' },
    { id: 'brigandine', name: '브리간딘', kind: 'armor', def: 8, price: 2900, reg: [1, 2], desc: '천 속에 철판을 댄 갑옷.' },
    { id: 'scale', name: '스케일메일', kind: 'armor', def: 7, price: 2300, reg: [4, 7], desc: '비늘 모양 철편 갑옷.' },
    { id: 'breast', name: '브레스트플레이트', kind: 'armor', def: 10, price: 4200, reg: [1], desc: '가슴을 지키는 강철 흉갑.' },
    { id: 'plate', name: '플레이트메일', kind: 'armor', def: 14, price: 7800, reg: [1], desc: '온몸을 감싸는 판금 갑옷. 무겁다.' },
    { id: 'lamellar', name: '라멜라 갑옷', kind: 'armor', def: 9, price: 3400, reg: [6, 7], desc: '작은 철편을 끈으로 엮은 갑옷.' },
    { id: 'samurai', name: '무사 갑옷', kind: 'armor', def: 12, price: 6400, reg: [9], desc: '옻칠한 동방 무사의 갑옷.' },
    // tools
    { id: 'compass', name: '나침반', kind: 'tool', price: 600, reg: [0, 1, 2, 4, 6], desc: '진행 방향과 풍향을 정확히 알 수 있다.' },
    { id: 'sextant', name: '육분의', kind: 'tool', price: 2400, reg: [0, 1, 2], from: 1490, desc: '현재 위치의 위도와 경도를 알 수 있다.' },
    { id: 'astrolabe', name: '천문판', kind: 'tool', price: 1500, reg: [0, 2, 4], desc: '별로 위도를 잰다. 위도만 표시된다.' },
    { id: 'telescope', name: '망원경', kind: 'tool', price: 3800, reg: [1, 2], from: 1500, desc: '멀리 있는 함대를 먼저 발견하고, 망루와 정찰대가 수평선 너머의 발견물을 더 멀리서 알아챈다.' },
    { id: 'turban', name: '터번', kind: 'tool', price: 400, reg: [2, 3, 4, 5, 7, 8], desc: '이슬람 상인처럼 변장한다. 이슬람 도시에 잠입할 때 크게, 중국 항구(회회 상인이 오가던 광주·천주 등)에서는 조금 도움이 된다.' },
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
    // special battle items
    { id: 'rapidgun', name: '속사포', kind: 'special', price: 9000, reg: [], rare: true, desc: '해전에서 포격을 두 번 할 수 있다.' },
    { id: 'shells', name: '작렬탄', kind: 'special', price: 5200, reg: [1], from: 1510, consumable: 3, desc: '해전에서 포격 위력이 크게 오른다. (3회)' },
    { id: 'divebomb', name: '잠수 폭탄', kind: 'special', price: 0, reg: [], rare: true, desc: '적의 배 밑에서 터지는 신기한 무기.' },
    { id: 'dango', name: '수수 경단', kind: 'special', price: 60, reg: [9], consumable: 1, desc: '먹으면 기분이 좋아져 피로가 풀린다.' },
    // 야영지에서 얻는 것 (js/systems/castaway.js)
    { id: 'wilson', name: '윌슨', kind: 'tool', price: 30, reg: [], rare: true, desc: '같은 야영지를 맴돌던 대원이 낡은 가죽 공에 숯으로 얼굴을 그려 넣은 말 없는 친구. 함께 있으면 야영에서 쉴 때 피로가 더 풀린다.' },
    { id: 'castawaylog', name: '표류기', kind: 'tool', price: 1600, reg: [], rare: true, desc: '한 야영지에서 석 달을 버티며 적은 나날의 기록. 물이 나는 곳·사냥감 다니는 길·날씨를 읽는 법이 담겨 육상 탐험 경비가 줄고 사냥·물 긷기가 넉넉해진다.' },
    { id: 'mingrobe', name: '명나라 옷', kind: 'tool', price: 700, reg: [6, 8], desc: '명나라 상인의 단령(團領)과 망건. 쇄국한 중국 도시에 잠입할 때 크게 도움이 된다.' }
  ];
  G.ITEM = {}; G.ITEMS.forEach(function (it) { G.ITEM[it.id] = it; });
  G.ITEM_KIND = { weapon: '무기', armor: '방어구', tool: '항해도구', gift: '장신구', special: '특수', treasure: '보물', evidence: '증거품' };
})(window.G = window.G || {});
