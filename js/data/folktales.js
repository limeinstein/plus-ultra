/* 유럽 옛이야기 셋 (사건은 js/systems/folktales.js · G.Folktales). 2026-11-10 사용자 요청
   ① 로빈 후드 — 요크(노팅엄 · 셔우드 숲): 사격술 3 — 노팅엄 장관의 활쏘기 대회, 셔우드 숲의 잔치, 부자 상인을 털 것인가
      주인공은 로빈 후드의 조수 「배트 후드」(눈 뚫린 안대 · 검은 늑대 귀 모자 · 검은 망토)와 화살 장인의 딸 캐시. 사건은 배트 후드가 벌이고,
      로빈 후드가 제독에게 조수와 캐시를 맡긴다 → 배트 후드 · 캐시 동료 (2026-11-10 고침 — 로빈 후드 · 마리안 동료였던 것)
   ② 라푼젤 — 동유럽의 큰 숲(프라하 · 바르샤바 · 부다페스트): 측량 3 · 과학 3 — 문도 계단도 없는 탑, 긴 머리 밧줄, 마녀 고텔 → 라푼젤 동료
   ③ 빌헬름 텔 — 스위스(베른 → 우리 주 알트도르프 · 루체른 호수): 사격술 3 · 항해술 3 — 게슬러의 모자, 아들 발터의 머리 위 사과, 폭풍 속 호수의 바위 → 빌헬름 텔 동료
   조건의 능력은 제독이나 동료 가운데 가장 높은 사람의 것으로 본다(R.skillBest).
   그림: images/legend-events/FOLKTALES_PROMPT.md — 동료 portraits/legendary/<id> · 인물 portraits/history/ft_* · 장면 legend-events/ft_* */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.folk = G.BALANCE.folk || {
    robin: { city: 41, minFame: 1000, shoot: 3, guards: 40, rob: 6000, toll: 2500, noto: 4 },
    rapunzel: { cities: [53, 62, 63], minFame: 1000, survey: 3, sci: 3, witch: 30 },
    tell: { city: 55, minFame: 1000, shoot: 3, nav: 3, guards: 30 },
    again: 180
  };
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    ft_robin: { name: '로빈 후드', title: '셔우드 숲의 의적', st: 'ne', role: 'soldier', born: 1470, face: 'portraits/legendary/robin_hood', look: '(이미 그린 초상 portraits/legendary/robin_hood — 이제 동료가 아니라 셔우드에 남는 이야기 속 인물)' },
    ft_bathood: { name: '배트 후드', title: '로빈 후드의 조수', st: 'ne', role: 'soldier', born: 1484, face: 'portraits/legendary/bat_hood', look: '(동료 초상 portraits/legendary/bat_hood)' },
    ft_cathy: { name: '캐시', title: '노팅엄 화살 장인의 딸', st: 'ne', g: 'f', role: 'merchant', born: 1485, face: 'portraits/legendary/cathy', look: '(동료 초상 portraits/legendary/cathy)' },
    ft_sheriff: { name: '노팅엄 장관', title: '노팅엄의 셰리프', st: 'ne', role: 'official', born: 1450,
      look: '50대, 뾰족한 턱수염, 가늘게 뜬 눈, 검붉은 벨벳 옷에 금 사슬, 깃털 모자, 손에 금 화살' },
    ft_littlejohn: { name: '리틀 존', title: '로빈 후드의 오른팔', st: 'ne', role: 'soldier', born: 1465,
      look: '30대, 거인 같은 키와 덩치, 덥수룩한 갈색 수염, 녹색 두건, 손에 굵은 참나무 지팡이' },
    ft_gothel: { name: '마녀 고텔', title: '숲속 탑의 주인', st: 'ne', g: 'f', role: 'scholar', born: 1420,
      look: '60대 여인, 매서운 눈, 은빛이 섞인 검은 머리, 짙은 보라 망토, 손에 초롱초롱한 라푼젤 풀 한 다발과 커다란 가위' },
    ft_rapunzel: { name: '탑 위의 처녀', title: '문 없는 탑에 갇힌 처녀', st: 'ne', g: 'f', role: 'noble', born: 1478, face: 'portraits/legendary/rapunzel', look: '(동료 초상 portraits/legendary/rapunzel)' },
    ft_tell: { name: '빌헬름 텔', title: '우리 주 뷔르글렌의 사냥꾼', st: 'ne', role: 'soldier', born: 1460, face: 'portraits/legendary/tell', look: '(동료 초상 portraits/legendary/tell)' },
    ft_gessler: { name: '게슬러', title: '합스부르크의 대관(代官)', st: 'ne', role: 'official', born: 1450,
      look: '50대, 차가운 눈, 각진 턱, 검은 판금 흉갑 위에 붉은 망토, 깃털 달린 모자, 손에 장갑' },
    ft_walter: { name: '발터', title: '빌헬름 텔의 아들', st: 'ne', role: 'child', born: 1490,
      look: '열 살 남짓한 소년, 헝클어진 금발, 굳게 다문 입, 소박한 양털 웃옷, 머리 위에 사과 하나' },
    ft_woodcutter: { name: '숲의 나무꾼', title: '문 없는 탑으로 길을 알려 주는 나무꾼', st: 'ne', role: 'peasant', fiction: true,
      look: '40대 후반, 거친 갈색 수염, 황토색 모자와 적갈색 양털 웃옷, 손에 땔감 한 묶음' },
    ft_herald: { name: '장관의 전령', title: '노팅엄 활쏘기 대회의 전령', st: 'ne', role: 'soldier', fiction: true,
      look: '30대, 짧은 모래색 머리, 붉은 모자, 붉은색·크림색 겉옷, 허리에 작은 북과 북채' },
    ft_tuck: { name: '터크 수사', title: '셔우드 숲의 수사', st: 'ne', role: 'priest', fiction: true,
      look: '50대, 둥글고 붉은 얼굴과 넉넉한 체격, 갈색 수도복과 밧줄 허리띠, 나무 그릇과 장부' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });
  G.FOLK_FIGS = Object.keys(L);

  // ---------------------------------------------------------------- 동료 넷 — 술집에는 나오지 않고 사건으로만 (로빈 후드는 셔우드에 남는다 — 이야기 속 인물 ft_robin)
  var M = [
    { id: 'bat_hood', name: '배트 후드', short: '배트', g: 'm', style: 'ne', role: 'soldier', tone: 'shonen', pic: 'bat_hood', age: 'young',
      st: [70, 66, 78, 80], sk: { shoot: 3, sword: 2, ops: 1 }, skBoost: 1, lg: { 3: 3, 2: 1 },
      desc: '로빈 후드의 조수. 셔우드 숲에서 로빈의 손에 자란 고아로, 본명은 로빈과 캐시만 안다. 조로처럼 눈만 뚫린 검은 안대를 쓰고, 검은 늑대 귀가 솟은 모자에 검은 망토를 두르고 밤길을 달려서 사람들이 「배트 후드」라 부른다. 쏜 화살을 다음 화살로 쪼개는 솜씨는 스승 못지않고, 칼끝으로 장관 병사들의 허리띠를 끊어 바지를 흘러내리게 하는 장난을 좋아한다. 로빈이 「넓은 세상을 보고 오라」며 제독에게 맡겼다.' },
    { id: 'cathy', name: '캐시 플레처', short: '캐시', g: 'f', style: 'ne', role: 'merchant', tone: 'charm', pic: 'cathy', age: 'young',
      st: [58, 76, 52, 90], sk: { craft: 2, shoot: 1, acct: 1, speech: 1 }, skBoost: 1, lg: { 3: 3, 2: 1 },
      desc: '노팅엄 화살 장인의 딸. 아버지의 공방에서 깃을 다듬고 촉을 갈며 자랐고, 장관의 병사들에게 화살을 팔면서 그 귀로 들은 이야기를 몰래 셔우드 숲에 전했다. 배트 후드의 안대를 손수 기워 준 사람도 캐시다. 셈이 빠르고 말이 야무져, 장터에서 캐시를 이기는 상인은 없다. 「화살은 곧게, 거래는 공정하게.」' },
    { id: 'rapunzel', name: '라푼젤', short: '라푼젤', g: 'f', style: 'ne', role: 'noble', tone: 'cute', pic: 'rapunzel', age: 'young',
      st: [44, 80, 30, 92], sk: { music: 3, med: 2, survey: 1 }, skBoost: 1, lg: { 3: 3, 4: 2 },
      desc: '마녀 고텔이 문도 계단도 없는 탑에 가두어 기른 처녀. 이름은 어머니가 탐냈던 마녀 밭의 들상추(라푼젤)에서 왔다. 해 질 녘마다 부른 노래가 숲 밖까지 들렸고, 그녀의 눈물은 가시에 다친 눈을 낫게 한다고 한다. 탑 창으로만 보던 별자리를 이제 갑판에서 헤아린다.' },
    { id: 'tell', name: '빌헬름 텔', short: '텔', g: 'm', style: 'ne', role: 'soldier', tone: 'plain', pic: 'tell', age: 'mid',
      st: [86, 62, 80, 70], sk: { shoot: 3, nav: 2, ops: 1 }, skBoost: 1, lg: { 3: 3, 2: 1 },
      desc: '스위스 우리 주 뷔르글렌의 사냥꾼이자 루체른 호수에서 가장 노를 잘 젓는 사람. 합스부르크의 대관 게슬러의 모자에 절하지 않아, 아들 발터의 머리 위 사과를 쏘아야 했다. 화살 통에 남겨 둔 두 번째 화살 때문에 쫓기는 몸이 되어, 산과 호수가 다시 자유로워질 때까지 바다로 나섰다.' }
  ];
  // 옛 저장 호환 — 2026-11-10 하루 동안 로빈 후드·마리안이 동료로 들어온 저장이 있을 수 있다 (사건에서는 더 이상 들이지 않는다)
  M.push({ id: 'robin_hood', name: '로빈 후드', short: '로빈', g: 'm', style: 'ne', role: 'soldier', tone: 'rush', pic: 'robin_hood', age: 'young', legacy: true,
    st: [76, 66, 78, 84], sk: { shoot: 3, ops: 1, speech: 1, sword: 1 }, skBoost: 1, lg: { 3: 3, 2: 1 }, desc: '셔우드 숲의 의적. 부자에게서 빼앗아 가난한 이에게 나눈다.' });
  M.push({ id: 'marian', name: '마리안', short: '마리안', g: 'f', style: 'ne', role: 'noble', tone: 'polite', pic: 'marian', age: 'young', legacy: true,
    st: [60, 78, 64, 90], sk: { sword: 2, shoot: 2, med: 1, speech: 1 }, skBoost: 1, lg: { 3: 3, 2: 2 }, desc: '노팅엄 성에서 자란 귀족 아가씨. 셔우드 숲의 의적들과 함께한다.' });
  M.forEach(function (m) {
    m.tale = true; m.legend = true; m.fame = 0; m.wage = G.taleWage ? G.taleWage(m) : 0; m.y = [1480, 1700]; m.reg = []; m.face = 'portraits/legendary/' + m.pic; m.halfKey = m.face + '_half'; m.eventOnly = true;
    if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }
  });

  var IT = [
    { id: 'ft_golden_arrow', name: '노팅엄의 금 화살', gv: 30, desc: '노팅엄 장관이 활쏘기 대회의 상으로 건 금 화살. 장관은 이 화살로 로빈 후드의 무리를 꾀어내려 했지만, 검은 망토의 배트 후드가 단상에서 낚아채 갔다.' },
    { id: 'ft_rapunzel_braid', name: '라푼젤의 금빛 머리채', gv: 28, desc: '마녀 고텔이 잘라 낸 라푼젤의 머리채. 탑 꼭대기에서 땅까지 닿던 길이다. 라푼젤이 「다시는 이걸로 누구를 올려 주지 않을 거예요」라며 웃으며 건넸다.' },
    { id: 'ft_gessler_hat', name: '게슬러의 모자', gv: 26, desc: '알트도르프 광장의 장대 끝에 걸려, 지나가는 사람마다 절하게 했던 합스부르크 대관의 모자. 이제는 아무도 그 앞에서 고개를 숙이지 않는다.' }
  ];
  if (G.ITEMS && G.ITEM) IT.forEach(function (x) {
    if (G.ITEM[x.id]) return;
    var it = { id: x.id, name: x.name, kind: x.kind || 'keepsake', price: 0, gv: x.gv, reg: [], desc: x.desc };
    G.ITEMS.push(it); G.ITEM[it.id] = it;
  });
})(window.G = window.G || {});
