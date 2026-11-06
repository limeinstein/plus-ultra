/* 민족 발견물에서 나서는 동료 (G.FOLK_JOIN) — 2026-11-05 사용자 요청. 시스템: js/systems/folkjoin.js
   민족(cat 'people') 발견물을 찾으면 3%로 그 민족의 젊은 남자나 여자가 배에 태워 달라고 나선다.
   항목: style = 얼굴 양식(portraits/npc-roles/<양식>/… — af 서아프리카 · tr 동·남아프리카 · sw 스와힐리·뿔 · is 아랍·사하라 ·
         na 북아메리카 숲 · an 안데스·남아메리카 · az 메소아메리카 · se 동남아시아·태평양 · st 초원·북방 · ne 북유럽 · jp · cn · ru),
         lang = [모국 말, 장사 말(있으면)] (G.LANGS 번호), types = 잘하는 갈래 (G.WANDER_TYPES), m·f = 이름들
   ※ 오세아니아(아넘랜드·마오리·하와이) 전용 얼굴 그림이 아직 없어 동남아시아(se) 양식을 빌린다. 남극인은 전설이라 뺐다. */
(function (G) {
  'use strict';
  function P(style, lang, types, m, f) { return { style: style, lang: lang, types: types, m: m, f: f }; }
  var AFR = 10, MAM = 11, SEA = 12, EAS = 13, NAM = 15, ARA = 5, CHN = 7, UYG = 9, GER = 3, ROM = 2, SLV = 4, PT = 1, ES = 0;
  G.FOLK_JOIN = {
    // ───── 아프리카
    khoikhoi:     P('tr', [AFR, GER], ['tongue', 'survey'], ['아우추마오', '도만', '고네마', '키즈테'], ['크로토아', '나마스', '아이차스', '가가스']),
    folk_zulu:    P('tr', [AFR], ['war', 'survey'], ['산디레', '징가', '탄도', '음판데'], ['논디', '은톰비', '탄디웨', '줄리']),
    folk_maasai:  P('tr', [AFR], ['war', 'survey'], ['레마샤', '시아이', '카코', '산카레'], ['나이시세', '시안투', '나마냐', '은쿠아푸']),
    folk_xhosa:   P('tr', [AFR], ['war', 'tongue'], ['응퀴카', '판도', '시포', '마카나'], ['노마쿠', '탄디', '은톰비자네', '노시포']),
    folk_san:     P('tr', [AFR], ['survey', 'doctor'], ['카오', '퀴시', '크샤오', '투마'], ['니시', '쿠', '다이', '나우']),
    folk_yoruba:  P('af', [AFR, PT], ['bard', 'trade'], ['아데바요', '오군데', '코라우', '아인데'], ['폴라케', '아데우미', '투누', '모라예']),
    folk_hausa:   P('af', [AFR, ARA], ['trade', 'tongue'], ['다우다', '가르바', '무사', '이누와'], ['하우와', '자흐라우', '라리', '다다']),
    folk_fulani:  P('af', [AFR, ARA], ['survey', 'trade'], ['아마두', '볼레', '삼바', '데모'], ['쿰바', '디아리아투', '타코', '아이사타']),
    folk_akan:    P('af', [AFR, PT], ['trade', 'wright'], ['크와메', '코피', '야우', '쿠와쿠'], ['아마', '아쿠아', '아프아', '아두아']),
    folk_mbuti:   P('af', [AFR], ['survey', 'bard'], ['모케', '켄게', '아마보수', '은졸로'], ['마셀리', '에키안가', '아쿠', '테테']),
    folk_oromo:   P('sw', [AFR, ARA], ['war', 'priest'], ['길로', '보루', '투파', '다디'], ['아야투', '시누', '하위', '비프투']),
    punt:         P('sw', [AFR, ARA], ['trade', 'nav'], ['아덴', '와르사메', '피다', '아브디'], ['아라웨일로', '푸두', '하보', '와리스']),
    folk_amazigh: P('is', [ARA, AFR], ['trade', 'war'], ['이데르', '아마스탄', '유바', '타리크'], ['티지리', '타실라', '마크네스', '투디트']),
    folk_tuareg:  P('is', [ARA, AFR], ['survey', 'trade'], ['아크놀', '이부', '길리', '아고라'], ['틴히난', '다사인', '타키트', '타무트']),
    // ───── 북아메리카
    inuit:        P('na', [NAM], ['survey', 'nav'], ['칼루크', '아키아크', '나누크', '툴루각'], ['아타', '누니크', '칼리크', '파니']),
    skraeling:    P('na', [NAM], ['survey', 'nav'], ['노노사바수트', '카바즈', '아샤봇', '데스나'], ['샤나우디딧', '데마스두이트', '아쉐우', '오비']),
    folk_dakota:  P('na', [NAM], ['war', 'survey'], ['와나타', '마토', '타하차', '히누'], ['위노나', '마피야', '위차피', '칸데']),
    folk_cherokee:P('na', [NAM], ['tongue', 'doctor'], ['아후디', '사니', '와야', '오코노'], ['아이타', '아다', '왈레라', '아마도아']),
    folk_haudenosaunee: P('na', [NAM], ['tongue', 'war'], ['오노가', '사가와', '테이오하', '가야네'], ['카나와', '오타시', '제고', '카리와']),
    folk_wendat:  P('na', [NAM], ['trade', 'tongue'], ['오덴타', '아수타', '타레차', '아티로'], ['아에낭', '앙웬', '오와쿠', '탄나']),
    folk_stlawrence: P('na', [NAM], ['tongue', 'nav'], ['도마가야', '타이뇨아니', '아고나', '시나데'], ['아가하', '오쿠', '테나', '사카']),
    folk_powhatan:P('na', [NAM], ['tongue', 'survey'], ['나모타크', '와하간체', '오파찬', '마차우크'], ['네카', '마타치', '아토쿠', '와나크']),
    folk_wampanoag: P('na', [NAM], ['tongue', 'nav'], ['핀세', '와무수타', '사사몬', '호바목'], ['웨타무', '쿠사', '나나파샤', '아워션크스']),
    folk_muscogee:P('na', [NAM], ['trade', 'war'], ['호포에', '메나와', '에초', '하조'], ['사칼라', '이니하', '아키', '호시']),
    folk_natchez: P('na', [NAM], ['priest', 'war'], ['오시', '타쿠', '미시', '유비'], ['아누', '데사', '카오', '수리']),
    folk_calusa:  P('na', [NAM, ES], ['nav', 'war'], ['세네파', '에스칸', '투쿠', '오칼'], ['이시', '세나', '마시', '투이']),
    folk_taos:    P('na', [NAM, ES], ['wright', 'priest'], ['타비', '피아', '수와', '오장'], ['타오', '피난', '세와', '아와']),
    folk_acoma:   P('na', [NAM, ES], ['wright', 'cook'], ['지아', '카치', '오에', '하미'], ['시에', '아마', '카와', '우나']),
    folk_mandan:  P('na', [NAM], ['trade', 'cook'], ['시하', '포카', '마토', '나테'], ['시카', '오와', '미니', '호나']),
    folk_chumash: P('na', [NAM], ['nav', 'wright'], ['투모', '칼리', '스미', '하소'], ['시와', '미야', '알리', '쿠타']),
    folk_makah:   P('na', [NAM], ['nav', 'war'], ['체카', '아쿠', '와치', '사트'], ['키보', '마카', '아시', '니아']),
    // ───── 중남미
    aztec:        P('az', [MAM, ES], ['war', 'priest'], ['틀라카엘', '이친', '미스코아틀', '토치틀'], ['시우틀', '소치틀', '이츠파파', '테크파틀']),
    inca:         P('an', [MAM, ES], ['survey', 'scholar'], ['아마루', '투팍', '와만', '킬리'], ['차스카', '오클로', '코야', '수마크']),
    blemmyes:     P('an', [MAM], ['nav', 'doctor'], ['아비바', '하이모', '코보', '이라바'], ['아나코', '이세', '와이나', '오리코']),
    patagon:      P('an', [MAM], ['survey', 'war'], ['오르케케', '사이웨케', '칼펜', '파파온'], ['아이나', '킬로', '마와', '테레케']),
    folk_selknam: P('an', [MAM], ['survey', 'war'], ['콘', '타이', '케이', '할라'], ['롤라', '케렌', '타미', '할레']),
    // ───── 동남아시아·태평양
    padaung:      P('se', [SEA], ['wright', 'bard'], ['라마', '키아', '보바', '무태'], ['마팡', '무디', '마자', '무프레']),
    cannibal:     P('se', [SEA], ['scholar', 'doctor'], ['시싱아', '토가르', '라자 오푸', '나이 앙길'], ['보루 사리부', '남보루', '보루 도아', '보루 툼부']),
    orangutan:    P('se', [SEA], ['survey', 'war'], ['렌탑', '리바우', '주가', '앙킨'], ['인두 다라', '사리', '부낫', '레망']),
    folk_bajau:   P('se', [SEA], ['nav', 'cook'], ['사마', '다우드', '우만', '라시드'], ['다양', '누르', '사리파', '아이나']),
    folk_andaman: P('se', [SEA], ['survey', 'nav'], ['쿠지', '타이', '롱고', '바라'], ['엔지', '이나', '타비', '포로']),
    aborigine:    P('se', [SEA], ['survey', 'doctor'], ['완주크', '나리친', '문구라위', '굴필릴'], ['굴룸부', '냐파냐파', '반두크', '갈루마']),
    folk_maori:   P('se', [SEA], ['nav', 'war'], ['타마', '히라', '와이티', '투이'], ['아로하', '히네', '마타', '피타']),
    folk_hawaii:  P('se', [SEA], ['nav', 'bard'], ['카마이', '키아', '마카나', '칼라니'], ['레이', '마일레', '레아니', '노엘라니']),
    // ───── 북방·초원·동아시아·유럽
    folk_chukchi: P('st', [EAS], ['survey', 'war'], ['아마', '레우', '툼', '캐우'], ['네우', '아이나', '퀴', '티나']),
    folk_tuva:    P('st', [UYG, EAS], ['bard', 'survey'], ['아이디스', '오르자크', '체렌', '숀'], ['아이랑마', '체체크', '오유나', '아이수']),
    folk_ainu:    P('jp', [EAS], ['survey', 'cook'], ['코탄', '에카시', '오키쿠', '시쿠'], ['우나루', '시사', '메노코', '카무']),
    nestorian:    P('cn', [CHN], ['scholar', 'priest'], ['경통', '이 요한', '마르 시몬', '장 다윗'], ['마리아 왕', '하나 이', '사라 진', '미리암 장']),
    folk_sami:    P('ne', [GER], ['survey', 'nav'], ['아슬락', '비에라', '마티', '우를로'], ['엘레', '카레', '사라', '마리엣']),
    vampire:      P('ru', [ROM, SLV], ['doctor', 'priest'], ['이온', '바실레', '미르체아', '도브레'], ['아나', '일레아나', '마리차', '플로리차'])
  };
  // 첨부 참고 남성 전용 원화. 민족별 한 쌍이며 이름·솜씨는 기존처럼 따로 뽑는다.
  ['khoikhoi', 'folk_zulu', 'folk_maasai', 'folk_xhosa', 'folk_san', 'folk_yoruba',
    'folk_hausa', 'folk_fulani', 'folk_akan', 'folk_mbuti', 'folk_oromo', 'punt'].forEach(function (id) {
    var p = G.FOLK_JOIN[id];
    p.portraits = p.portraits || {};
    p.portraits.m = ['portraits/folk-african-men/' + id];
  });
  // 동남아 남성 전용 원화. 같은 민족의 네 이름이 얼굴·무릎상 한 쌍을 함께 쓴다.
  ['padaung', 'cannibal', 'orangutan', 'folk_bajau', 'folk_andaman'].forEach(function (id) {
    var p = G.FOLK_JOIN[id];
    p.portraits = p.portraits || {};
    p.portraits.m = ['portraits/mates/folk_' + id + '_m'];
  });
  // 첨부 참고 동남아 여성 전용 원화. 남성 선택을 보존하고 이름 넷이 한 쌍을 함께 쓴다.
  ['padaung', 'cannibal', 'orangutan', 'folk_bajau', 'folk_andaman'].forEach(function (id) {
    var p = G.FOLK_JOIN[id];
    p.portraits = p.portraits || {};
    p.portraits.f = ['portraits/folk-join/' + id + '_f_v1'];
  });
  // 아프리카계·안다만·아넘랜드 여성 전용 얼굴상·무릎상. 첨부 참고는 얼굴·머리·표정만 빌리고
  // 민족마다 복식·장신구·역할 소품을 새로 그렸다. 안다만은 위 동남아 공용 설정보다 이 전용 원화를 우선한다.
  var BLACK_FEMALE_PORTRAITS = {
    khoikhoi: 'fj_khoikhoi_f_v1', folk_zulu: 'fj_zulu_f_v1', folk_maasai: 'fj_maasai_f_v1',
    folk_xhosa: 'fj_xhosa_f_v1', folk_san: 'fj_san_f_v1', folk_yoruba: 'fj_yoruba_f_v1',
    folk_hausa: 'fj_hausa_f_v1', folk_fulani: 'fj_fulani_f_v1', folk_akan: 'fj_akan_f_v1',
    folk_mbuti: 'fj_mbuti_f_v1', folk_oromo: 'fj_oromo_f_v1', punt: 'fj_punt_f_v1',
    folk_tuareg: 'fj_tuareg_f_v1', folk_andaman: 'fj_andaman_f_v1', aborigine: 'fj_aborigine_f_v1'
  };
  Object.keys(BLACK_FEMALE_PORTRAITS).forEach(function (id) {
    var p = G.FOLK_JOIN[id];
    p.portraits = p.portraits || {};
    var key = 'portraits/mates/' + BLACK_FEMALE_PORTRAITS[id];
    // 안다만 여성은 앞서 만든 동남아 계열 후보도 함께 남겨 두어 두 원화가 모두 실제 후보로 쓰이게 한다.
    // 나머지 민족은 이번 전용 원화 한 쌍을 사용한다.
    p.portraits.f = id === 'folk_andaman'
      ? [key].concat((p.portraits.f || []).filter(function (old) { return old !== key; }))
      : [key];
  });
  // 아메리카 남성 전용 원화. 네 이름은 민족별 같은 얼굴상·무릎상 한 쌍을 쓴다.
  ['inuit', 'skraeling', 'folk_dakota', 'folk_cherokee', 'folk_haudenosaunee', 'folk_wendat',
    'folk_stlawrence', 'folk_powhatan', 'folk_wampanoag', 'folk_muscogee', 'folk_natchez',
    'folk_calusa', 'folk_taos', 'folk_acoma', 'folk_mandan', 'folk_chumash', 'folk_makah',
    'aztec', 'inca', 'blemmyes', 'patagon', 'folk_selknam'].forEach(function (id) {
    var p = G.FOLK_JOIN[id];
    p.portraits = p.portraits || {};
    p.portraits.m = ['portraits/mates/folk_' + id + '_m'];
  });
  // 첨부 참고 아메리카 성인 여성 전용 원화: 북미 17·중미 1·남미 4종.
  // 같은 민족의 여성 이름 넷이 한 쌍을 공용한다. 남성 초상 설정은 보존한다.
  ['inuit', 'skraeling', 'folk_dakota', 'folk_cherokee', 'folk_haudenosaunee',
    'folk_wendat', 'folk_stlawrence', 'folk_powhatan', 'folk_wampanoag', 'folk_muscogee',
    'folk_natchez', 'folk_calusa', 'folk_taos', 'folk_acoma', 'folk_mandan', 'folk_chumash',
    'folk_makah', 'aztec', 'inca', 'blemmyes', 'patagon', 'folk_selknam'].forEach(function (id) {
    var p = G.FOLK_JOIN[id];
    p.portraits = p.portraits || {};
    p.portraits.f = ['portraits/folk-join/' + id + '_f_amer_v1'];
  });
  // 갈래마다 나서며 하는 말 ({who} = 그 민족)
  G.FOLK_JOIN_LINES = {
    nav: '우리 {who}는 어려서부터 물 위에서 자랍니다. 바람과 물결을 읽는 눈이라면 누구에게도 지지 않아요.',
    survey: '이 땅의 길은 내가 다 압니다. 강이 어디서 갈라지고 짐승이 어디로 다니는지 — 당신들 지도에 없는 것까지요.',
    war: '사냥과 싸움이라면 마을에서 내가 첫째였습니다. 바다 건너에서 위험을 만나면 내 창이 앞장서겠어요.',
    trade: '우리 {who}는 이웃 마을들과 오래 물건을 바꿔 왔습니다. 무엇이 값지고 무엇이 헐한지, 흥정이라면 자신 있어요.',
    tongue: '당신들 말을 벌써 몇 마디 익혔어요. 이웃 마을의 말도 압니다. 말이 막히는 곳에서 내가 다리가 되어 드릴게요.',
    doctor: '할머니에게서 풀과 뿌리로 병을 다스리는 법을 배웠습니다. 먼 바다에서 아픈 사람이 생기면 나를 찾으세요.',
    priest: '나는 조상들의 노래와 기도를 지키는 집안에서 났습니다. 낯선 바다에서도 마음을 붙들어 줄 말을 알아요.',
    scholar: '우리 {who}의 옛 이야기와 셈을 배웠습니다. 당신들이 적어 두는 것들, 나도 배우고 싶어요.',
    wright: '손으로 만드는 일이라면 무엇이든 합니다. 배의 이음새도, 부서진 연장도 고쳐 볼게요.',
    cook: '아무것도 없는 곳에서도 먹을 것을 찾아 끓여 낼 수 있어요. 배고픈 선원들을 웃게 해 드리죠.',
    bard: '나는 노래하는 사람입니다. 긴 항해의 밤, 우리 {who}의 노래로 선원들의 마음을 달래 드릴게요.',
    gun: '불을 뿜는 막대(총)를 다루는 법을 보았습니다. 금방 익힐 수 있어요.'
  };
})(window.G = window.G || {});
