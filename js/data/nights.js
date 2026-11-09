/* 천일야화의 세 이야기 (사건은 js/systems/nights.js · G.Nights). 2026-11-08 사용자 요청
   ■ 세 이야기 모두 셰헤라자드가 해금되어야(동료로 맞은 적이 있어야) 열린다 — 알라딘·알리바바와 같다 (2026-11-09)
   ① 신드바드의 모험 — 바스라 → 콜롬보(세렌디브): 바스라와 콜롬보에 다녀온 적이 있어야 · 늙은 신드바드와 일곱 번의 항해를 다시 밟는다
      고래를 섬으로 알고 상륙(첫 항해 · 오만 앞바다) → 거대한 새 로크의 알(둘째·다섯째 항해 · 라카디브 바다) → 세렌디브 산속의 다이아몬드 골짜기(둘째 항해) → 동료(항해술 3)
   ② 하룬 알 라시드의 밤 산책 — 바그다드(귀족 작위가 하나라도 있어야): 상인 차림의 칼리프와 대신 자파르를 술집에서 만나 도와주면 후원자가 된다 (후원자 ar_harun · 황금 문의 궁)
   ③ 흑단 말 — 시라즈 · 이스파한(운용술 2·과학 2를 지닌 동료 + 매력 80 이상인 제독이나 동료): 페르시아 왕자 카마르 알 아크마르의 날아다니는 기계 말을 고쳐 주면(과학) 왕자가 동료가 되어 사나의 공주를 구하러 함께 간다
      구해 낸 공주 나디라 알 사나니도 「다른 궁에 갇히러 돌아가지는 않겠다」며 함께 가겠다고 한다 → 동료
   그림: images/legend-events/NIGHTS_PROMPT.md — 신드바드 초상은 이미 있다(portraits/legendary/sinbad) · 카마르 portraits/legendary/qamar · 나디라 portraits/legendary/nadira · 나머지 portraits/history/an_* · 장면 legend-events/an_* */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.nights = G.BALANCE.nights || {
    sinbad: { city: 126, minFame: 1500, end: 155,
      whale: { box: [58.6, 62.2, 18.6, 22.4], hpCut: 0.06, crewLeft: 0.04, hpSave: 0.12, food: 2 },
      roc: { box: [71.6, 74.6, 8.4, 12.6], hp: 0.25, crew: 0.06 },
      valley: { food: 8, gemsMeat: 10, gemsDive: 25, army: 40 } },
    harun: { city: 127, minFame: 800, pay: 300, speech: 2, thugs: 14, gift: 3000, trust: 60 },
    ebony: { shiraz: 129, isfahan: 130, minFame: 1000, ops: 2, sci: 2, cha: 80, med: 1, army: 50 },   // 운용술 ops · 과학 sci 를 함께 지닌 동료 + 매력 cha 이상인 제독이나 동료
    again: 180
  };
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    an_sinbad: { name: '뱃사람 신드바드', title: '바스라의 늙은 뱃사람 · 일곱 번 바다로 나간 사람', st: 'is', role: 'sailor', born: 1420, face: 'portraits/legendary/sinbad',
      look: '(초상은 이미 있다 — portraits/legendary/sinbad)' },
    an_harun: { name: '모술의 상인', full: '칼리프 하룬 알 라시드', title: '압바스 왕조의 칼리프 (상인 차림)', st: 'is', role: 'king', born: 1450,
      look: '40대, 짙은 수염, 날카롭지만 웃음기 있는 눈, 수수한 갈색 상인 옷과 두건, 그 밑으로 살짝 보이는 금실 소매와 큰 루비 반지' },
    an_jafar: { name: '자파르', full: '대신 자파르 알 바르마키', title: '칼리프의 대신 (상인 차림)', st: 'is', role: 'official', born: 1455,
      look: '30대 후반, 단정하게 다듬은 검은 수염, 영리한 눈, 상인 옷 위에 걸친 짙은 녹색 망토, 손에 작은 장부' },
    an_masrur: { name: '마스루르', title: '칼리프의 칼잡이', st: 'is', role: 'soldier', born: 1450,
      look: '40대, 아주 큰 키와 넓은 어깨, 말이 없는 얼굴, 검은 두건과 망토, 허리에 큰 언월도' },
    an_qamar: { name: '카마르 알 아크마르', title: '페르시아 사부르 왕의 왕자', st: 'is', role: 'noble', born: 1470, face: 'portraits/legendary/qamar',
      look: '20대 초반, 「달 중의 달」이라 불리는 고운 얼굴, 흰 비단 터번에 깃털 장식, 푸른 페르시아 비단 옷, 허리에 보석 박힌 단검' },
    an_nadira: { name: '나디라 알 사나니', title: '예멘 사나의 공주', st: 'is', g: 'f', role: 'noble', born: 1474, face: 'portraits/legendary/nadira',
      look: '20세 안팎, 영리하고 당찬 눈, 진주를 꿴 얇은 베일, 붉은 비단 옷, 미친 척 흐트러뜨린 머리 사이로 또렷한 눈빛' },
    an_sage: { name: '늙은 현자', title: '흑단 말을 만든 페르시아의 장인 · 사나의 공주를 훔쳐 간 자', st: 'is', role: 'scholar', born: 1400,
      look: '70대, 매부리코, 흰 수염, 기름때 묻은 검은 옷, 손에 작은 태엽 열쇠, 탐욕스러운 눈' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });
  G.NIGHTS_FIGS = Object.keys(L);

  // ---------------------------------------------------------------- 동료 셋 — 술집에는 나오지 않고 사건으로만
  var M = [
    { id: 'sinbad', name: '뱃사람 신드바드', short: '신드바드', g: 'm', style: 'is', role: 'captain', tone: 'merch', pic: 'sinbad', age: 'mid',
      st: [74, 70, 64, 84], sk: { nav: 3, acct: 2, ops: 1, speech: 1 }, skBoost: 1, lg: { 5: 3, 6: 2, 8: 2, 12: 1, 10: 1 },
      desc: '바스라의 뱃사람. 일곱 번 바다로 나가 일곱 번 배를 잃고 일곱 번 부자가 되어 돌아왔다. 고래 등에서 불을 피웠고, 로크의 다리에 매달려 날았고, 다이아몬드 골짜기에서 뱀을 피해 고깃덩이에 몸을 묶었다. 이야기를 하기 시작하면 밤이 짧고, 바다 냄새를 맡으면 다리가 근질거린다. 「바다는 언제나 마지막 항해라고 속인다네.」' },
    { id: 'qamar', name: '카마르 알 아크마르', short: '카마르', g: 'm', style: 'is', role: 'noble', tone: 'noble', pic: 'qamar', age: 'young',
      st: [72, 74, 70, 92], sk: { sword: 2, speech: 2, music: 1, sci: 1 }, skBoost: 1, lg: { 6: 3, 5: 2, 8: 1 },
      desc: '페르시아 사부르 왕의 왕자. 「달 중의 달」이라 불릴 만큼 고운 얼굴에, 흑단 말의 귀에 박힌 못을 돌려 하늘로 날아오른 무모함을 함께 지녔다. 사나의 공주 나디라를 사랑한다. 기계를 보면 먼저 손잡이부터 돌려 보는 버릇이 있다.' },
    { id: 'nadira', name: '나디라 알 사나니', short: '나디라', g: 'f', style: 'is', role: 'noble', tone: 'charm', pic: 'nadira', age: 'young',
      st: [52, 86, 40, 92], sk: { speech: 3, music: 2, med: 1, acct: 1 }, skBoost: 1, lg: { 5: 3, 6: 1, 10: 1 },
      desc: '예멘 사나 왕의 딸. 이름은 「귀한 사람」이라는 뜻이다. 흑단 말을 만든 늙은 현자에게 납치되어 이스파한 성주의 궁에 갇히자, 몇 달 동안 미친 척을 해서 아무도 곁에 오지 못하게 했다. 그때 배운 연기와 말솜씨로 상인도 성주도 쥐락펴락한다. 커피 향과 바다 냄새를 좋아하고, 다시는 누구의 궁에도 갇히지 않겠다고 맹세했다. 「미친 척하는 것보다 어려운 건, 멀쩡한 척하는 사람들 사이에서 사는 거예요.」' }
  ];
  M.forEach(function (m) {
    m.tale = true; m.legend = true; m.fame = 0; m.wage = G.taleWage ? G.taleWage(m) : 0; m.y = [1480, 1700]; m.reg = []; m.face = 'portraits/legendary/' + m.pic; m.eventOnly = true;
    if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }
  });

  // ---------------------------------------------------------------- 후원자 — 칼리프 (밤 산책에서 도와준 뒤에만 자리에 있다: js/systems/nights.js)
  var HARUN = { id: 'ar_harun', title: '바그다드의 칼리프', face: 'portraits/history/an_harun', type: 'king', city: 127, bld: 'mansion', place: '황금 문의 궁', honor: '폐하', pw: 3, wealth: 5, lang: 5, rel: 'I',
    taste: ['treasure', 'geo', 'creature', 'art'], nights: true, holders: [[1480, 1700, '하룬 알 라시드']] };
  if (G.SPONSORS && G.SPONSOR && !G.SPONSOR[HARUN.id]) { G.SPONSORS.push(HARUN); G.SPONSOR[HARUN.id] = HARUN; }

  var IT = [
    { id: 'an_valley_diamond', name: '다이아몬드 골짜기의 큰 다이아몬드', gv: 40, desc: '세렌디브 산속, 뱀이 우글거리는 골짜기 바닥에서 고깃덩이에 붙어 올라온 주먹만 한 다이아몬드. 신드바드가 「내 둘째 항해 때 것보다 크군」 하고 웃었다.' },
    { id: 'an_roc_feather', name: '로크의 깃털', gv: 26, desc: '돛대만큼 긴 거대한 새 로크의 깃털 한 가닥. 깃대가 사람 팔뚝보다 굵다. 마르코 폴로도 칸에게 로크의 깃털이 바쳐졌다고 적었다.' },
    { id: 'an_khilat', name: '칼리프의 영예의 옷', gv: 30, desc: '하룬 알 라시드가 밤 산책에서 자기를 도와준 이방인에게 내린 금실 비단 옷(힐아트). 이 옷을 입고 바그다드에 들어서면 궁의 문지기가 먼저 고개를 숙인다.' },
    { id: 'an_ebony_key', name: '흑단 말의 태엽 열쇠', gv: 28, desc: '하늘을 나는 흑단 말의 귀 뒤에 꽂는 은 열쇠의 짝. 왕자 카마르가 「말을 고쳐 준 사람에게」라며 내주었다. 돌리면 아주 작게 날갯짓 소리가 난다.' },
    { id: 'an_sanaa_pearls', name: '사나 공주의 진주 목걸이', gv: 32, desc: '이스파한에서 구해 낸 예멘 사나의 공주 나디라 알 사나니가 고마움의 뜻으로 건넨 어머니의 진주 목걸이.' }
  ];
  if (G.ITEMS && G.ITEM) IT.forEach(function (x) {
    if (G.ITEM[x.id]) return;
    var it = { id: x.id, name: x.name, kind: x.kind || 'keepsake', price: 0, gv: x.gv, reg: [], desc: x.desc };
    G.ITEMS.push(it); G.ITEM[it.id] = it;
  });
})(window.G = window.G || {});
