/* 항구 영향도 · 식민지의 후원자 — 자료·조정값 (규칙: js/systems/influence.js · js/systems/colonysponsor.js) — 2026-11-05 사용자 요청
   「동인도 회사나 투자가 커지면 제독이 몸담은 나라의 항구 영향도가 높아진다 (1602년 VOC 설립부터) · 영향도가 높으면 교역에 이점 ·
     식민지가 생기면 그 도시에 귀족 저택 같은 후원자 2~3명」 */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  // ---------------------------------------------------------------- 항구 영향도 (0~100, 제독의 나라)
  G.BALANCE.influence = {
    from: 16020320,                 // 이날(연합 동인도 회사 설립)부터 셈한다. 그 전에는 0
    perInvest: 7,                   // 그 항구 교역소 출자 등급 하나마다 (5등급 35)
    member: [0, 10, 16, 22, 28],    // 내 회사의 본부·상관이 있는 항구: 계급(사원~총독)마다
    built: 10,                      // 제독이 세운 상관
    stakeMax: 10, stakeFull: 150000,   // 그 회사 주식(주가 × 주식 수)이 이만큼이면 +stakeMax (그 회사의 본부·상관이 있는 항구)
    foreignK: 0.5,                  // 다른 나라 회사의 몫은 절반
    companyMax: 45,                 // 회사 몫의 상한
    act: { max: 25, half: 730,      // 실적: 회사 일을 한 항구에 쌓인다 — 두 해마다 절반으로 줄고 25까지
      chain: 3, warehouse: 40, mono: 4000, report: 6, convoy: 8, convoyFrom: 4, found: 20 },   // 주문서 고리 · 창고 n통마다 1 · 독점품 n닢마다 1 · 임무 보고 · 선단 귀환(본부 · 떠난 항구) · 상관 건설
    tiers: [[0, '없음'], [10, '발판'], [30, '우세'], [55, '지배'], [80, '독점']],
    // 영향도 100일 때의 이점 (영향도에 비례): 사는 값 −15% · 파는 값 +12% · 교역소 재고 +50% · 시장이 받아 주는 양 +40% · 회사 창고 할당 +50%
    effect: { buy: 0.15, sell: 0.12, stock: 0.5, demand: 0.4, quota: 0.5 },
    list: 8                         // 수첩에 보여 줄 항구 수
  };

  // ---------------------------------------------------------------- 식민지의 후원자
  G.BALANCE.colonySp = {
    stay: 24,                       // 역사의 점령은 이 달수 넘게 이어질 때만 식민지로 친다 (며칠·몇 달의 약탈·점령은 빼고)
    count: [2, 3],                  // 작은 도시(크기 1) 2명 · 그보다 큰 도시 3명
    gen: [22, 32],                  // 가문(대농장주·상인…)이 대를 잇는 해
    term: [8, 16],                  // 직책(주교·사령관…)의 임기
    end: 1701,                      // 마지막 사람이 머무는 해 (대항해시대의 끝 뒤)
    islands: [84, 86, 87, 88]       // 유럽 지역 자료에 들었지만 바다 건너 식민지인 곳: 세우타·아조레스·마데이라·카나리아(라스팔마스)
  };
  // 식민 세력 (도시 주인 이름 → 기호)
  G.COLONY_POWERS = { '포르투갈': 'PT', '카스티야': 'ES', '에스파냐': 'ES', '아라곤': 'ES', '잉글랜드': 'EN', '영국': 'EN', '영국 동인도 회사': 'EN', '스코틀랜드': 'SC',
    '네덜란드': 'NL', '네덜란드 동인도 회사': 'NL', '네덜란드 서인도 회사': 'NL', '프랑스': 'FR', '스웨덴': 'SE', '덴마크': 'DK', '벨저 가문': 'DE', '쿠를란트': 'DE' };
  // 기호 → 나라 이름 · 후원자 나라(경쟁 판정 sp.nation) · 말(G.LANGS) · 얼굴 양식 · 가톨릭인가
  G.COLONY_NATION = {
    PT: { name: '포르투갈', sp: 'PT', lang: 1, style: 'ib', cath: true },
    ES: { name: '에스파냐', sp: 'ES', lang: 0, style: 'ib', cath: true },
    EN: { name: '잉글랜드', sp: 'EN', lang: 3, style: 'ne', cath: false },
    SC: { name: '스코틀랜드', sp: null, lang: 3, style: 'ne', cath: false },
    NL: { name: '네덜란드', sp: null, lang: 3, style: 'ne', cath: false },
    FR: { name: '프랑스', sp: 'FR', lang: 2, style: 'ne', cath: true },
    SE: { name: '스웨덴', sp: null, lang: 3, style: 'ne', cath: false },
    DK: { name: '덴마크', sp: null, lang: 3, style: 'ne', cath: false },
    DE: { name: '독일', sp: null, lang: 3, style: 'ne', cath: true }
  };
  // 이름 — 그 나라에 흔한 이름과 성을 섞어 지은 가상의 인물 (실존 인물을 그리지 않는다)
  G.COLONY_NAMES = {
    PT: { given: ['주앙', '페드루', '안토니우', '마누엘', '프란시스쿠', '디오구', '루이스', '곤살루', '베르나르두', '시망', '자이미', '바스쿠'],
      sur: ['다 시우바', '드 소자', '드 멜루', '코헤이아', '드 알메이다', '페헤이라', '다 코스타', '핀투', '드 브리투', '로보', '드 노로냐', '모니즈'] },
    ES: { given: ['디에고', '후안', '페드로', '알론소', '에르난도', '곤살로', '프란시스코', '로드리고', '마르틴', '가스파르', '베르나르디노', '크리스토발'],
      sur: ['데 벨라스코', '데 살라사르', '데 리베라', '데 오르도녜스', '데 아빌라', '데 우요아', '데 비야로엘', '데 소토마요르', '데 아로', '데 바르가스', '데 키로가', '데 메사'] },
    EN: { given: ['존', '토머스', '윌리엄', '리처드', '에드워드', '헨리', '로버트', '조지', '험프리', '너새니얼'],
      sur: ['애슐리', '브래드퍼드', '캐링턴', '포스터', '그린우드', '해서웨이', '레인스퍼드', '멀린스', '페어팩스', '스탠턴'] },
    SC: { given: ['제임스', '알렉산더', '로버트', '앤드루', '패트릭', '데이비드'],
      sur: ['맥린', '캠벨', '고든', '머리', '해밀턴', '먼로'] },
    NL: { given: ['얀', '피터르', '코르넬리스', '헨드릭', '빌럼', '아드리안', '디르크', '야코프', '마르턴', '하위헌'],
      sur: ['반 데르 베르프', '드 브라위너', '반 하스털', '페르묄런', '스하위르만', '반 리스', '드 비터', '반 덴 브룩', '보스만', '크라머르'] },
    FR: { given: ['장', '피에르', '프랑수아', '자크', '루이', '앙투안', '니콜라', '미셸', '르네', '샤를'],
      sur: ['드 라 바르', '르 노르망', '데 로지에', '뒤 퓌', '드 쿠르셀', '모랭', '드 보뇌르', '라 페리에르', '쇼보', '르 브룅'] },
    SE: { given: ['요한', '페르', '스벤', '닐스', '라르스', '올로프'], sur: ['린드', '베리', '홀름', '스트란드', '셰블룸', '팔크'] },
    DK: { given: ['옌스', '올레', '크리스티안', '페데르', '한스', '모겐스'], sur: ['크라그', '로센', '빌레', '스케', '울펠트', '홀크'] },
    DE: { given: ['한스', '요아힘', '게오르크', '바르톨로모이스', '암브로지우스', '하인리히'], sur: ['자일러', '푸거', '에잉어', '렘', '슈미트', '호프만'] }
  };
  /* 후원자의 갈래 — id 꼬리 · 직함 · 종류(G.SPONSOR_TYPE) · 힘(pw → 알현 명성 G.POWER_FAME) · 재력 · 관심사 · 가문(대를 잇는다) / 직책(place: 저택 이름)
     where: 'amer' 아메리카 · 'africa' 아프리카 · 'asia' 인도양·동남아·동아시아 · 'island' 대서양의 섬 · 'any'
     only: 그 나라만 (ES 엔코멘데로·아우디엔시아) · cath: 가톨릭 나라만 · prot: 개신교 나라만 · silver: 은·금이 나는 도시 · trade: 회사 상관이 있음직한 항구 */
  G.COLONY_ARCHETYPES = [
    { key: 'planter', title: '대농장주', type: 'noble', pw: 2, wealth: 4, taste: ['nature', 'trade'], family: true, where: ['amer', 'africa', 'island'], w: 3 },
    { key: 'merchant', title: '대상인', type: 'merchant', pw: 2, wealth: 4, taste: ['trade', 'treasure'], family: true, where: ['any'], w: 3 },
    { key: 'bishop', title: '주교', type: 'priest', pw: 3, wealth: 3, taste: ['faith', 'people'], place: '주교관', cath: true, where: ['any'], w: 2 },
    { key: 'pastor', title: '목사', type: 'priest', pw: 2, wealth: 2, taste: ['faith', 'people'], place: '목사관', prot: true, where: ['any'], w: 1 },
    { key: 'captain', title: '요새 사령관', type: 'official', pw: 2, wealth: 2, taste: ['geo', 'creature'], place: '요새 사령부', where: ['any'], w: 2 },
    { key: 'judge', title: '아우디엔시아 판사', type: 'official', pw: 3, wealth: 3, taste: ['people', 'ruin'], place: '아우디엔시아', only: 'ES', where: ['amer'], w: 2 },
    { key: 'encomendero', title: '엔코멘데로', type: 'noble', pw: 2, wealth: 3, taste: ['ruin', 'people'], family: true, only: 'ES', where: ['amer'], w: 2 },
    { key: 'miner', title: '광산주', type: 'noble', pw: 2, wealth: 5, taste: ['treasure', 'ruin'], family: true, silver: true, where: ['any'], w: 4 },
    { key: 'factor', title: '상관장', type: 'official', pw: 3, wealth: 4, taste: ['trade', 'creature'], place: '상관장 관저', trade: true, where: ['asia', 'africa'], w: 3 },
    { key: 'mission', title: '선교회 원장', type: 'priest', pw: 2, wealth: 2, taste: ['people', 'faith'], place: '선교회', cath: true, where: ['asia', 'amer'], w: 1 },
    { key: 'naturalist', title: '박물학자', type: 'scholar', pw: 1, wealth: 2, taste: ['nature', 'creature'], family: true, where: ['any'], w: 1 }
  ];
})(window.G = window.G || {});
