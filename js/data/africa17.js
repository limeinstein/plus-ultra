/* 17세기 아프리카의 다섯 이야기 — 사람·조정값 (사건은 js/systems/africa17.js · G.Afr17). 2026-11-03 사용자 요청
   ① 쿠바 왕국의 통합 (1625년 무렵, 샤암 왕) — 짜는 동안 들여다보지 말라는 라피아 직녀 카샤 (「학의 보은」을 살짝)
   ② 곤다르 건설 (1636, 파실리다스) — 웨흐니 산꼭대기 왕족 감옥의 세나이트 (「라푼젤」을 살짝)
   ③ 케이프 보급기지 (1652, 판리베크) — 코이코이 목자 코아와 「돌아오지 못하는 배」(「방황하는 네덜란드인」 전설을 살짝)
   ④ 음빌라 전투 (1665) — 루안다에서 빨래꾼으로 숨은 콩고의 귀부인 도나 루지아 (「거위 치는 소녀」를 살짝)
   ⑤ 몸바사 예수 요새 (1696~1698 포위) — 리옹고의 노래를 지키는 스와힐리 시인 음와나 자흐라 (스와힐리 영웅 「푸모 리옹고」 전설을 살짝)
   · 다섯 여인은 모두 이 게임을 위해 새로 지은 사람이다(실존 인물이 아니다). 모두 성인으로 그린다.
   · 옛이야기 동료(tale) — 술집에는 나오지 않고 사건으로만 만난다 (eventOnly). 품삯은 이야기 동료 규칙(G.taleWage)
   그림: images/legend-events/AFRICA17_PROMPT.md — 초상 portraits/legendary/<id>, portraits/history/af_*, 장면 legend-events/af_* */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.afr17 = G.BALANCE.afr17 || {
    kuba: { from: 16250101, to: 16801231, box: [19.5, 23.8, -6.6, -2.4], gift: 10 },   // 카사이 강 너머 쿠바 왕국의 뭍 [서경, 동경, 남위, 북위] · 왕에게 바칠 옥수수·담배
    gondar: { from: 16360101, to: 16671231, city: 110, gold: 3000, theo: 2, guards: 24 }, // 악숨에서 사흘 길 남쪽 곤다르 · 웨흐니 산
    cape: { from: 16520406, to: 16801231, city: 101, ransom: 1500, soldiers: 18 },
    mbwila: { from: 16651101, to: 16681231, city: 100, ransom: 2500, guards: 22 },     // 르완다(루안다) — 음빌라 전투(1665.10.29) 뒤
    mombasa: { from: 16960315, to: 16981212, city: 107, raiders: 26, herbs: 10 },       // 예수 요새 포위 (1696.3.15 ~ 1698.12.13)
    again: 180,   // 물러서거나 막히면 이만큼(날) 뒤 다시 만날 수 있다 (기한 안에서)
    loyal: 82
  };
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    af_shyaam: { name: '샤암 왕', full: '샤암 아 음불 아 은공', title: '쿠바 왕국을 하나로 묶은 왕 (뉘미)', st: 'af', role: 'king', born: 1590,
      look: '30대 후반, 위엄 있는 얼굴, 조개껍데기와 구슬로 덮인 높은 왕관, 무늬 놓은 라피아 천을 겹겹이 두른 옷, 손에 조각한 나무 지팡이' },
    af_fasilides: { name: '파실리다스 황제', full: '파실리다스 (알람 사가드)', title: '에티오피아의 황제 · 곤다르를 세운 이', st: 'af', role: 'king', born: 1603,
      look: '30대 중반, 마르고 단호한 얼굴, 짧은 곱슬 수염, 흰 샴마 위에 금실 수놓은 붉은 망토, 머리에 금관, 손에 은 십자가' },
    af_riebeeck: { name: '얀 판리베크', title: 'VOC 희망봉 보급기지 사령관', st: 'ne', role: 'official', born: 1619,
      look: '30대 초반, 긴 갈색 곱슬머리, 짧은 콧수염, 검은 웃옷에 넓은 흰 깃, 손에 장부와 깃펜' },
    af_vidal: { name: '비달 드 네그레이루스 총독', full: '앙드레 비달 드 네그레이루스', title: '포르투갈령 앙골라 총독', st: 'ib', role: 'noble', born: 1606,
      look: '50대 후반, 희끗한 짧은 수염, 그을린 얼굴, 검은 웃옷 위의 흉갑과 붉은 어깨띠, 지팡이를 짚은 노장' },
    af_saif: { name: '사이프 빈 술탄', title: '오만의 이맘 · 예수 요새를 에워싼 이', st: 'is', role: 'king', born: 1660,
      look: '30대 후반, 짙은 수염, 흰 디슈다샤에 짙은 남색 터번, 허리에 은 칸자르' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });
  G.AFR17_FIGS = Object.keys(L);

  // ================================================================ 다섯 여인 (동료)
  var M = [
    { id: 'kasha', name: '카샤', short: '카샤', g: 'f', style: 'af', role: 'merchant', tone: 'polite', pic: 'kasha', age: 'young',
      st: [62, 78, 40, 92], sk: { craft: 3, art: 2, survey: 2, music: 1 }, skBoost: 1, lg: { 10: 3, 1: 1 },
      desc: '카사이 강 너머 쿠바 왕국의 라피아 직녀. 스물셋. 야자 잎 실로 짠 천에 바늘로 짧은 털을 심어 「벨벳」처럼 도톰한 무늬 천을 만든다 — 그 무늬는 같은 것이 하나도 없다. 큰 눈과 가지런히 땋은 머리, 웃을 때 드러나는 보조개. 짜는 동안에는 누구도 들여다보지 말라고 한다. 바다의 물결 무늬를 보고 싶어 제독을 따라나섰다.' },
    { id: 'senait', name: '세나이트', short: '세나이트', g: 'f', style: 'af', role: 'priest', tone: 'polite', pic: 'senait', age: 'young',
      st: [50, 88, 30, 94], sk: { theo: 3, hist: 2, music: 2, med: 1 }, skBoost: 1, lg: { 10: 3, 5: 2, 1: 2 },
      desc: '에티오피아 왕가의 먼 친척 아가씨. 스물하나. 아버지가 예수회의 가톨릭을 따랐다는 까닭으로 웨흐니 산꼭대기의 왕족 감옥에 갇혀 자랐다. 발목까지 닿는 검은 머리를 촘촘히 땋고, 게에즈어 시편을 외우며 열 줄 하프 베겐나를 탄다. 산 아래 세상을 처음 본 날, 바다가 하늘보다 넓다는 말을 믿지 않았다.' },
    { id: 'koa', name: '코아', short: '코아', g: 'f', style: 'af', role: 'native', tone: 'rush', pic: 'koa', age: 'young',
      st: [78, 72, 55, 88], sk: { survey: 2, med: 2, cook: 2, shoot: 1 }, skBoost: 1, lg: { 10: 3, 3: 2, 1: 1 },
      desc: '희망봉 둘레에서 소를 치는 코이코이 목자 집안의 딸. 스물넷. 바람에 그을린 구릿빛 피부, 웃음 많은 눈, 타조알 구슬 목걸이. 부쿠 풀로 상처를 다스리고, 바람 냄새로 비를 맞힌다. 네덜란드 사람들의 말을 귀동냥으로 익혀 소값을 흥정해 왔다. 「배들이 어디서 와서 어디로 가는지」 보고 싶어 했다.' },
    { id: 'luzia', name: '도나 루지아', short: '루지아', g: 'f', style: 'af', role: 'noble', tone: 'noble', pic: 'luzia', age: 'young',
      st: [60, 82, 58, 94], sk: { speech: 3, theo: 2, sword: 2 }, skBoost: 1, lg: { 10: 3, 1: 3 },
      desc: '콩고 왕국 상살바도르 궁정의 귀부인. 스물여섯. 음빌라 싸움에서 안토니우 1세가 쓰러진 뒤, 신분을 숨기고 루안다에서 빨래꾼으로 지냈다. 높게 틀어 올린 머리와 꼿꼿한 목, 포르투갈어와 킥콩고어를 오가며 궁정의 말로 사람을 설득한다. 왕실 호위대에게 배운 칼솜씨도 녹슬지 않았다.' },
    { id: 'zahra', name: '음와나 자흐라', short: '자흐라', g: 'f', style: 'is', role: 'scholar', tone: 'polite', pic: 'zahra', age: 'young',
      st: [55, 90, 32, 92], sk: { hist: 3, speech: 2, nav: 2, music: 1 }, skBoost: 1, lg: { 10: 3, 5: 3, 1: 2 },
      desc: '몸바사의 스와힐리 시인. 스물다섯. 할아버지에게서 물려받은 영웅 푸모 리옹고의 노래 필사본을 지킨다. 헤나로 물들인 손끝, 금실 수놓은 검은 부이부이 사이로 반짝이는 눈. 다우선 선장 집안에서 자라 계절풍과 별자리를 읽는다. 「노래는 성벽보다 오래 남는다」가 입버릇.' }
  ];
  G.AFR17_MATES = M.map(function (m) { return m.id; });
  M.forEach(function (m) {
    m.tale = true; m.legend = true; m.fame = 0; m.wage = G.taleWage ? G.taleWage(m) : 0; m.y = [1600, 1700]; m.reg = []; m.face = 'portraits/legendary/' + m.pic; m.eventOnly = true;
    if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }
  });

  // 기념품 (시장에서는 팔지 않는다) — 리옹고의 노래는 책(지력)
  var IT = [
    { id: 'kuba_velvet', name: '카샤의 라피아 벨벳', kind: 'keepsake', gv: 20, desc: '쿠바 왕국의 직녀 카샤가 밤새 짠 라피아 천. 야자 잎 실에 짧은 털을 심어 벨벳처럼 도톰하다. 바다의 물결을 닮은 무늬가 하나 들어 있다.' },
    { id: 'senait_braid', name: '세나이트의 땋은 머리 끈', kind: 'keepsake', gv: 18, desc: '웨흐니 산꼭대기에서 세나이트가 제 머리카락과 목화실을 꼬아 만든 끈의 한 토막. 산 아래로 늘어뜨린 그 줄을 타고 제독이 올라갔다.' },
    { id: 'buchu_pouch', name: '코아의 부쿠 주머니', kind: 'keepsake', gv: 14, desc: '희망봉 언덕의 부쿠 풀잎을 말려 담은 가죽 주머니. 코이코이 사람들은 이것으로 상처를 씻고 몸에 향을 낸다.' },
    { id: 'kongo_rosary', name: '콩고 왕실의 상아 묵주', kind: 'keepsake', gv: 22, desc: '도나 루지아가 음빌라 싸움터에서 가져온 상아 묵주. 십자가 끝에 콩고 왕실의 문장이 작게 새겨져 있다.' },
    { id: 'liongo_utenzi', name: '『리옹고의 노래』 필사본', kind: 'book', gv: 30, price: 0, desc: '스와힐리의 영웅이자 시인 푸모 리옹고의 노래를 아랍 글자로 적은 필사본. 몸바사 포위 속에서 음와나 자흐라가 지켜 냈다. 구리 바늘 이야기가 마지막 장에 있다.' }
  ];
  if (G.ITEMS && G.ITEM) IT.forEach(function (x) {
    if (G.ITEM[x.id]) return;
    var it = { id: x.id, name: x.name, kind: x.kind, price: x.price || 0, gv: x.gv, reg: [], desc: x.desc };
    G.ITEMS.push(it); G.ITEM[it.id] = it;
  });
})(window.G = window.G || {});
