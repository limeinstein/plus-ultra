/* 금봉호 — 마대인과 딸 지나의 인물·거래 조정값. 사건: js/systems/wangmerchant.js.
   중국 근해에서 견직물·도자기·차를 싸게 판다. 금봉호에서 세 차례 물건을 사면 지나가 합류한다.
   왕서방·명월의 인물·조선 물건 매입은 js/data/wangmoon.js의 독립 사건이다. */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.wangMerch = G.BALANCE.wangMerch || {
    box: [108.5, 123.5, 20.0, 33.0],  // 중국 근해 [서경, 동경, 남위, 북위] — 바다에서만 (조선·일본·루손 앞바다는 빠진다)
    chance: 0.04,                     // 바다의 하루마다 (처음 만나기 전에는 firstChance)
    firstChance: 0.07,
    cool: 120,                        // 한 번 만나면 이만큼(날) 뒤에야 다시
    goods: ['silk', 'porcelain', 'tea'],
    stock: [700, 1000],               // 품목마다 싣고 있는 통 수
    ratio: 0.70,                      // 최근에 본 값의 이만큼
    floor: 0.45,                      // 후려쳐도 이 아래로는 내려가지 않는다
    joinDeals: 3,                     // 이만큼 거래하면(만날 때마다 한 번으로 친다) 지나가 제독을 따라온다
    patience: 2,                      // 교섭이 이만큼 거절당하면 더는 깎아 주지 않는다 (경리가 있으면 +1)
    bluffBack: 0.03,                  // 돌아서는 척이 들키면 값이 이만큼 도로 오른다 (처음 값 위로는 안 오른다)
    ports: [173, 174, 175, 176, 177, 287, 288]   // 산 곳으로 적는 명나라 항구 (가장 가까운 곳)
  };
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    wm_ma: { name: '마대인', full: '마(馬) 대인', title: '정크선 「금봉호」의 선주', st: 'cn', role: 'merchant', born: 1520,
      look: '50대, 넉넉한 풍채와 둥근 얼굴, 짧은 콧수염과 단정한 턱수염, 검은 머리 장식으로 고정한 상투, 짙은 남색 비단 장포와 넓은 검은 허리띠, 비취 가락지와 접부채' },
    wm_jina: { name: '지나', full: '지나(芝娜)', title: '마대인의 딸 · 금봉호의 장부를 쥔 사람', st: 'cn', role: 'merchant', g: 'f', mate: 'jina',
      look: '날씬한 체형과 풍성한 가슴을 지닌 20대 성인 여성, 잔머리를 드리운 올림머리에 흰 꽃·청자색 꽃과 푸른 댕기, 목을 여민 연한 청자색 반팔 비단 옷과 푸른 치마, 이를 드러낸 밝은 웃음, 손에 장부' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });
  G.WANGMERCH_FIGS = Object.keys(L);

  // 지나 — 거래를 joinDeals번 하면 동료가 된다 (술집에는 나오지 않고 사건으로만 · 품삯은 이야기 동료 규칙 G.taleWage)
  var m = { id: 'jina', name: '지나', short: '지나', g: 'f', style: 'cn', role: 'merchant', tone: 'merch', pic: 'wm_jina', age: 'young',
    st: [52, 84, 34, 88], sk: { acct: 3, speech: 2, craft: 2 }, skBoost: 1, lg: { 7: 3, 12: 2, 1: 1 },
    desc: '남쪽 바다를 떠도는 정크선 금봉호의 선주 마대인의 딸. 스물두 살. 열 살 때부터 아버지 배의 장부를 맡아, 주판알 소리만 듣고도 셈이 틀린 곳을 짚는다. 비단 올과 도자기 유약을 손끝으로 가려내고, 값을 부르는 말솜씨는 아버지보다 한 수 위. 「아버지 말은 반만 믿으세요」가 입버릇이다. 장부 너머의 세상 — 바다 건너 서쪽 나라들의 셈법과 시장을 보고 싶어 제독을 따라나섰다.' };
  m.tale = true; m.legend = true; m.fame = 0; m.wage = G.taleWage ? G.taleWage(m) : 0; m.y = [1550, 1700]; m.reg = []; m.face = 'portraits/history/wm_jina'; m.eventOnly = true;
  if (G.MATES && !G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }
})(window.G = window.G || {});
