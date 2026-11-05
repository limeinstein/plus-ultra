/* 천계제의 궁궐과 동림당 — 목수 황제·객씨·위충현, 육군자, 소주 민변 (사건: js/systems/donglin.js) 2026-11-05 사용자 요청
   「1620~1627 천계제 시기 환관 정치와 동림당 탄압 — 만력제와 태창제가 잇달아 죽은 뒤 천계제가 즉위하고, 위충현이 권력을 잡아 동림당 관료를 탄압」
   「등장하는 미인들이 동료가 될 수 있는 스토리」 — 1626 영원성 · 1627 숭정제와 위충현 숙청은 다른 묶음(js/systems/ningchong.js)
   ■ 사람 (G.HIST_FIG): 천계제 · 위충현 · 객씨 · 어용감의 유 태감(지어낸 인물) · 이성비 · 설소소 · 동창 교위 · 동림 선비의 아내 육 부인(지어낸 인물) · 주순창 · 안패위
   ■ 동료 셋 (사건으로만 — eventOnly · 여자 어른 — 연애도 된다)
     · 취연(dl_cuiyan) — 이성비를 모시던 궁녀. 객씨가 성비를 굶겨 죽이려 할 때 벽 틈에 먹을 것을 숨겼다 (지어낸 인물)
     · 소만(dl_xiaoman) — 서호의 명기 설소소에게 말타기와 탄궁(彈弓)을 배운 제자 (지어낸 인물 — 설소소는 1564년생이라 이 무렵 예순 안팎)
     · 왕미(dl_wangwei) — 양주 출신의 시인 왕미(王微, 1597~1647), 호는 초의도인(草衣道人). 책을 가득 실은 거룻배로 강과 호수, 이름난 산을 떠돌았다
   ■ 소지품: 목수 황제의 작은 누각(dl_pavilion) · 설소소의 난초 그림(dl_orchid) · 다섯 사람의 이름(dl_wuren — 팔 수 없다)
   ■ 얼굴: images/portraits/mates/dl_*.webp · _half.webp (없으면 코드 초상) — 개발노트의 그림 주문 */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('dl_tianqi', { name: '천계제', title: '명의 열다섯째 황제 · 목수 황제', st: 'cn', role: 'noble', born: 1605, look: '10대 후반~20대 초, 곤룡포 소매를 걷어붙이고 대패를 쥔 앳된 황제, 손톱 밑의 나뭇밥, 일에 빠진 맑은 눈' });
  fig('dl_wei', { name: '위충현', title: '사례감 병필태감 · 동창의 우두머리 · 「구천세」', st: 'cn', role: 'official', born: 1568, look: '50대, 수염 없는 넓적한 얼굴, 붉은 망의(蟒衣), 웃는 입과 웃지 않는 눈, 상소문 뭉치를 든 손' });
  fig('dl_ke', { name: '객씨', title: '봉성부인 · 천계제의 유모', st: 'cn', role: 'noble', g: 'f', born: 1582, look: '40대, 짙은 분칠과 금비녀 여럿, 황제 곁에서만 부드러워지는 눈매, 뒤에 늘어선 궁녀와 내관' });
  fig('dl_yu', { name: '유 태감', title: '어용감의 태감 · 황제의 목재를 사들이는 사람', st: 'cn', role: 'official', born: 1580, fiction: true, look: '40대, 살집 있는 얼굴, 푸른 내관 옷에 자를 꽂은 허리띠, 나무 냄새를 맡는 버릇' });
  fig('dl_chengfei', { name: '이성비', title: '천계제의 후궁', st: 'cn', role: 'noble', g: 'f', born: 1604, look: '20대 초, 핏기 없는 얼굴, 장신구를 다 빼앗긴 맨머리, 그래도 꼿꼿한 목' });
  fig('dl_susu', { name: '설소소', title: '서호의 명기 · 그림·말타기·탄궁의 달인', st: 'cn', role: 'merchant', g: 'f', born: 1564, look: '예순 안팎, 흰머리를 옥비녀 하나로 틀어 올린 꼿꼿한 여인, 남장한 승마복, 손에 든 탄궁, 아직도 고운 눈매' });
  fig('dl_tiqi', { name: '동창의 교위', title: '위충현이 부리는 동창의 사람', st: 'cn', role: 'soldier', born: 1590, fiction: true, look: '30대, 갈색 관복에 흰 가죽 장화, 허리에 찬 쇠사슬과 붉은 체포 문서' });
  fig('dl_lu', { name: '육 부인', title: '붙잡혀 간 동림 선비의 아내', st: 'cn', role: 'maid', g: 'f', born: 1595, fiction: true, look: '30대, 무명 옷에 어린 아들을 안은 여인, 비 맞은 머리, 품에 숨긴 남편의 편지' });
  fig('dl_zhou', { name: '주순창', title: '소주의 청렴한 관리 · 동림의 벗', st: 'cn', role: 'official', born: 1584, look: '40대, 해진 관복, 마른 얼굴에 형형한 눈, 붙잡혀 가면서도 고개를 숙이지 않는 선비' });
  fig('dl_yan', { name: '안패위', title: '소주의 저자 사람', st: 'cn', role: 'sailor', born: 1595, look: '30대, 걷어붙인 소매, 굵은 팔뚝, 군중 맨 앞에서 주먹을 쥔 사내' });
  G.DONGLIN_FIGS = ['dl_tianqi', 'dl_wei', 'dl_ke', 'dl_yu', 'dl_chengfei', 'dl_susu', 'dl_tiqi', 'dl_lu', 'dl_zhou', 'dl_yan'];

  // ── 동료 (사건으로만 · 여자 어른 — 연애도 된다)
  function mate(o) {
    o.tale = true; o.legend = true; o.fame = 0; o.wage = 0; o.reg = []; o.eventOnly = true;
    o.face = 'portraits/mates/' + o.id;
    if (G.MATES && G.MATE && !G.MATE[o.id]) { G.MATES.push(o); G.MATE[o.id] = o; }
  }
  mate({ id: 'dl_cuiyan', name: '취연', g: 'f', style: 'cn', role: 'maid', tone: 'polite', age: 'young', st: [40, 76, 34, 92], sk: { acct: 2, cook: 1, speech: 1, craft: 1 }, lg: { 7: 3 }, y: [1621, 1680],
    desc: '자금성에서 이성비를 모시던 궁녀. 「푸른 연기」라는 이름처럼 가는 몸에 버들잎 같은 눈썹, 웃을 때 한쪽 볼에만 보조개가 팬다. 궁에서 열 해를 살며 장부와 곳간 열쇠를 맡았고, 벽돌 하나 빼는 데도 소리를 내지 않는다. 객씨의 눈을 피해 주인의 방 벽 틈에 먹을 것을 숨겼던 손이다.' });
  mate({ id: 'dl_xiaoman', name: '소만', g: 'f', style: 'cn', role: 'soldier', tone: 'tsun', age: 'young', st: [64, 62, 70, 88], sk: { shoot: 3, survey: 1, music: 1, art: 1 }, lg: { 7: 3 }, y: [1625, 1680],
    desc: '서호의 명기 설소소에게 말타기와 탄궁(彈弓)을 배운 제자. 남장한 승마복에 머리를 높이 묶은 늘씬한 아가씨로, 붉은 입술을 꼭 다물고 있다가 활시위를 당길 때만 웃는다. 달리는 말 위에서 쏜 흙탄 하나로 백 걸음 밖의 등불 심지를 끊는다. 스승 말로는 「서호가 좁다고 우는 아이」.' });
  mate({ id: 'dl_wangwei', name: '왕미', g: 'f', style: 'cn', role: 'scholar', tone: 'charm', age: 'young', st: [38, 88, 30, 94], sk: { hist: 2, survey: 2, music: 1, speech: 1 }, lg: { 7: 3 }, y: [1626, 1647],
    desc: '양주 출신의 시인, 호는 초의도인(草衣道人). 풀빛 옷에 맨 비녀 하나, 달빛 아래 호수 같은 서늘한 얼굴로 강남의 문사들을 줄 세웠다. 책을 가득 실은 거룻배 한 척으로 소주와 회계, 동정호와 여산을 떠돌며 『명산기』를 썼다. 「배 위가 제 집이에요. 이번엔 조금 큰 배일 뿐이죠.」' });

  // ── 소지품
  if (G.ITEMS && G.ITEM) {
    var add = function (it) { if (!G.ITEM[it.id]) { G.ITEMS.push(it); G.ITEM[it.id] = it; } };
    add({ id: 'dl_pavilion', name: '목수 황제의 작은 누각', kind: 'special', price: 0, reg: [], rare: true,
      desc: '천계제가 남만의 백단향으로 손수 깎아 칠한 손바닥만 한 누각. 문짝이 여닫히고 처마 끝에 방울까지 달렸다. 「바다의 나무로 지은 집이니 바다의 사람이 가져라.」 — 황제는 그날 상소문 한 장 읽지 않았다.' });
    add({ id: 'dl_orchid', name: '설소소의 난초 그림', kind: 'special', price: 0, reg: [], rare: true,
      desc: '설소소가 서호의 배 위에서 단숨에 친 난초 한 폭. 바람에 눕는 잎 끝에 「멀리 가는 아이를 위해」라는 작은 글씨가 있다. 동기창이 칭찬했다는 그 붓이다.' });
    add({ id: 'dl_wuren', name: '다섯 사람의 이름', kind: 'special', price: 0, reg: [], rare: true, noSell: true,
      desc: '안패위·양념여·마걸·심양·주문원 — 1626년 소주 민변 뒤에 목숨을 내놓은 다섯 저자 사람의 이름을 왕미가 시와 함께 적은 종이. 팔 수 없다.' });
  }

  G.BALANCE = G.BALANCE || {};
  G.BALANCE.donglin = G.BALANCE.donglin || {
    wood: { good: 'sandalwood', n: 12, k: 3, days: 300 },   // ① 목수 황제가 찾는 남만의 나무 — 백단향 n통 · 시세의 k배 · 기한(날)
    bribe: 1500,                                             // ② 유 태감을 매수해 빈 나무 궤짝에 숨긴다
    foe: { gate: 16, lake: 12, riot: 14 },                   // ② 동안문의 동창 · ③ 서호 부두의 교위 · ④ 소주 서찰원의 교위
    fame: { wood: 60, cui: 120, man: 120, riot: 160, wang: 100 }
  };
})(window.G = window.G || {});
