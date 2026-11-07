/* 순다클라파와 자야카르타(1522~1527) · 조호르 술탄국의 성립(1526~1528) — 사람·동료·소지품·조정값 (사건: js/systems/sundajohor.js) 2026-11-07 사용자 요청
   「1527 순다클라파 점령과 자야카르타 성립 · 1528 조호르 술탄국 성립 — 플레이어와 관계되는 미형 인물이 등장하게」
   1511 말라카 함락은 원래 있던 사건(js/systems/goamalacca.js)이 맡는다 — 그때 제독이 고른 편(s.goaMal.mal)을 조호르 장에서 기억한다.
   ■ 사람 (G.HIST_FIG): 파타힐라 · 툼응궁 상 아디파티(순다클라파의 항구 관리 — 1522년 조약에 이름이 남은 사람) · 엔히크 레므 · 두아르트 코엘류
     · 툰 파티마 · 라자 알리(알라우딘 리아야트 샤 2세) · 락사마나 항 나딤 · 포르투갈 순찰선 선장(지어낸 인물)
     말라카의 술탄 마흐무드 샤는 원래 있던 사람(js/data/goamalacca.js의 mahmud) · 순안 구능 자티는 원래 있던 지역 사람 동료(h_gunungjati)
   ■ 동료 둘 (사건으로만 — eventOnly · 여자 어른 — 연애도 된다)
     · 라트나(sj_ratna) — 순다클라파 항구 관리 툼응궁 상 아디파티의 딸. 1522년 돌기둥(파드랑)을 세우던 날 통역을 했다 (지어낸 인물)
     · 쿠말라(sj_kumala) — 툰 파티마를 모시는 말라카 왕실의 시녀. 1511년 그 밤 노란 휘장의 보트에 있던 여덟 살 아이 (지어낸 인물)
   ■ 소지품: 파드랑의 탁본(sj_padrao) · 노바트의 북채(sj_nobat)
   ■ 얼굴: images/portraits/mates/sj_*.webp · _half.webp (없으면 코드 초상) — 개발노트의 그림 주문 */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('sj_fatahillah', { name: '파타힐라', title: '데막의 장수 · 순다클라파를 친 사람', st: 'se', role: 'soldier', born: 1490, look: '30대 후반, 파사이 사람다운 갸름한 얼굴과 짧은 수염, 흰 터번에 초록 띠, 허리에 금 손잡이 크리스, 차분하고 깊은 눈' });
  fig('sj_tumenggung', { name: '툼응궁 상 아디파티', title: '순다클라파의 항구 관리 · 파자자란의 신하', st: 'se', role: 'official', born: 1470, look: '50대, 머리에 감은 바틱 천(이켓), 맨 윗몸에 금 팔찌, 후추 자루 사이에서 야자잎 장부를 든 너그러운 얼굴' });
  fig('sj_leme', { name: '엔히크 레므', title: '말라카에서 온 포르투갈 사절', st: 'ib', role: 'captain', born: 1485, look: '30대, 검은 수염, 땀에 젖은 흰 셔츠 위 가죽 조끼, 조약문을 말아 쥔 손' });
  fig('sj_coelho', { name: '두아르트 코엘류', title: '프란시스쿠 드 사의 함대 선장', st: 'ib', role: 'captain', born: 1485, look: '40대, 소금기에 하얗게 바랜 수염, 찢긴 망토, 부러진 돛대를 돌아보는 지친 눈' });
  fig('sj_fatimah', { name: '툰 파티마', title: '말라카의 왕비 · 벤다하라 툰 무타히르의 딸', st: 'se', role: 'noble', g: 'f', born: 1492, look: '30대 중반, 말라카 제일의 미인이라던 얼굴에 깊은 그늘, 노란 비단 바주 쿠룽에 금실 숄, 허리에 작은 크리스, 울지 않는 눈' });
  fig('sj_ali', { name: '라자 알리', title: '마흐무드 샤의 아들 · 뒷날의 알라우딘 리아야트 샤 2세', st: 'se', role: 'noble', born: 1513, look: '열다섯, 앳되지만 굳게 다문 입, 노란 두건, 아버지의 크리스를 두 손으로 받쳐 든 소년' });
  fig('sj_nadim', { name: '항 나딤', title: '말라카 왕실의 락사마나(바다의 장수)', st: 'se', role: 'captain', born: 1480, look: '40대, 볕에 그은 단단한 몸, 붉은 머리띠, 프라후 뱃머리에 선 장수, 팔뚝의 칼자국' });
  fig('sj_patrol', { name: '포르투갈 순찰선 선장', title: '말라카 요새의 갤리선', st: 'ib', role: 'soldier', born: 1495, fiction: true, look: '30대, 철모와 붉은 십자가 겉옷, 갤리선 고물에서 소리치는 사내' });
  G.SUNDAJOHOR_FIGS = ['sj_fatahillah', 'sj_tumenggung', 'sj_leme', 'sj_coelho', 'sj_fatimah', 'sj_ali', 'sj_nadim', 'sj_patrol'];

  // ── 동료 (사건으로만 · 여자 어른 — 연애도 된다)
  function mate(o) {
    o.tale = true; o.legend = true; o.fame = 0; o.wage = 0; o.reg = []; o.eventOnly = true;
    o.face = 'portraits/mates/' + o.id;
    if (G.MATES && G.MATE && !G.MATE[o.id]) { G.MATES.push(o); G.MATE[o.id] = o; }
  }
  mate({ id: 'sj_ratna', name: '라트나', g: 'f', style: 'se', role: 'merchant', tone: 'charm', age: 'young', st: [40, 82, 32, 94], sk: { speech: 3, acct: 2, survey: 1 }, lg: { 12: 3, 1: 2 }, y: [1522, 1575],
    desc: '순다클라파의 항구 관리 툼응궁 상 아디파티의 딸. 꿀빛 살결에 긴 속눈썹, 웃으면 눈꼬리가 초승달처럼 휜다. 허리까지 내려오는 검은 머리를 재스민 한 줄로 묶고, 붉은 바틱 사롱에 금 귀고리를 단다. 어려서부터 아버지의 후추 장부를 맡았고, 말라카에서 배운 포르투갈 말로 1522년 돌기둥을 세우던 날 통역을 했다. 「말은 돌기둥보다 오래가요. 사람이 지키기만 하면요.」' });
  mate({ id: 'sj_kumala', name: '쿠말라', g: 'f', style: 'se', role: 'soldier', tone: 'polite', age: 'young', st: [62, 70, 66, 90], sk: { sword: 3, nav: 1, speech: 1 }, lg: { 12: 3, 5: 1 }, y: [1526, 1575],
    desc: '툰 파티마를 모시는 말라카 왕실의 시녀. 이름은 「보석」이라는 뜻이다. 가늘고 긴 목에 옻칠처럼 검은 눈, 노란 비단 바주 쿠룽 위로 머리를 높이 틀어 금비녀를 꽂았다. 왕비에게서 실랏(말레이 칼춤)과 크리스 쓰는 법을 배워, 춤추듯 돌다가 한 걸음에 칼을 뽑는다. 1511년 말라카가 무너진 밤, 여덟 살의 그녀는 노란 휘장을 친 보트에서 낯선 선장의 소매를 붙잡고 있었다.' });

  // ── 소지품
  if (G.ITEMS && G.ITEM) {
    var add = function (it) { if (!G.ITEM[it.id]) { G.ITEMS.push(it); G.ITEM[it.id] = it; } };
    add({ id: 'sj_padrao', name: '파드랑의 탁본', kind: 'special', price: 0, reg: [], rare: true,
      desc: '1522년 8월 순다클라파 강어귀에 포르투갈 사람들이 세운 돌기둥(파드랑)의 글을 라트나가 야자 종이에 떠 놓은 탁본. 십자가 아래 포르투갈 왕의 문장과 혼천의가 찍혀 있다. 돌기둥은 남았으나, 그 약속을 지키러 온 배는 없었다.' });
    add({ id: 'sj_nobat', name: '노바트의 북채', kind: 'special', price: 0, reg: [], rare: true, noSell: true,
      desc: '말라카 왕실의 즉위 북(노바트)을 치던 북채 한 쌍. 1528년 조호르 강가에서 열다섯 살의 알라우딘 리아야트 샤 2세가 즉위하던 날, 툰 파티마가 「북을 지켜 준 배에게」라며 내렸다. 팔 수 없다.' });
  }

  G.BALANCE = G.BALANCE || {};
  G.BALANCE.sundajohor = G.BALANCE.sundajohor || {
    bribe: 700,                                         // ② 데막의 척후를 매수해 라트나의 집안을 빼낸다
    ransom: 1500,                                       // ② 파타힐라에게 붙잡힌 라트나를 몸값으로 풀어낸다
    aid: 800,                                           // ④ 빈탄에서 쫓겨난 왕실에 약값을 건넨다
    share: { fatah: 3200, ambush: 1800 },               // ② 파타힐라 편의 몫 · ③ 늦게 온 포르투갈 배를 친 몫
    reward: { johor: 2500 },                            // ⑤ 노바트를 지켜 준 사례
    foe: { sunda: 32, demak: 40, pier: 14, ambush: 20, patrol: 16, galley: 24 },
    trust: { warn: 5, ambush: -8, johor: -6, tell: 6 },  // 포르투갈 왕실의 신뢰
    speech: 2,                                          // 말로 설득할 때 웅변(speech) 기준
    fame: { pad: 40, ratna: 160, fleet: 80, bin: 100, kumala: 160, johor: 200, fatah: 180 }
  };
})(window.G = window.G || {});
