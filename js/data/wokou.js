/* 왜구의 대규모 침입과 척계광의 토벌 (1553~1565) — 사람·소지품·조정값 (사건: js/systems/wokou.js) 2026-11-05 사용자 요청
   ■ 사람 (G.HIST_FIG): 호종헌(절강 총독) · 서해(왜구 두목) · 모해봉(왕직의 양아들) · 의오의 광부 · 관군 천호 · 피란민
     왕직·척계광·유대유는 원래 있던 지역 사람 동료(js/data/regionfolk.js — h_wangzhi · h_qijiguang · h_yudayou)를 그대로 쓴다
   ■ 소지품: 정해왕의 통행 깃발(wk_flag) · 『기효신서』(wk_book) · 호종헌의 통행첩(wk_pass — 팔 수 없다)
   ■ 고증 메모: 날짜는 그레고리력(명의 기록은 음력). 왕직 처형은 가정 38년 12월 25일 = 1560.1.22. 태주의 아홉 번 승리는 1561년 5~6월, 평해위는 1563.5(가정 42년 4월).
     원앙진: 대장 1 · 등패수 2 · 낭선수 2 · 장창수 4 · 당파수 2 · 화병 1 — 『기효신서』 */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('wk_hu', { name: '호종헌', title: '절강 순무 · 동남 연해 총독', st: 'cn', role: 'official', born: 1512, look: '40대, 붉은 관복에 학 흉배, 가는 수염, 셈하는 눈' });
  fig('wk_xuhai', { name: '서해', title: '절강 앞바다의 왜구 두목', st: 'cn', role: 'captain', born: 1520, look: '30대, 승려였던 민머리, 왜도를 찬 허리, 일본식 갑옷 위에 중국 비단' });
  fig('wk_mao', { name: '모해봉', title: '왕직의 양아들', st: 'cn', role: 'captain', born: 1530, look: '20대, 날랜 몸, 히라도 무사의 머리 모양, 의심 많은 눈' });
  fig('wk_miner', { name: '의오의 광부', title: '척계광이 모은 의오현의 광부', st: 'cn', role: 'sailor', born: 1530, fiction: true, look: '30대, 검게 탄 팔, 짚신, 대나무 낭선을 든 손' });
  fig('wk_officer', { name: '관군 천호', title: '항주 위소의 천호', st: 'cn', role: 'soldier', born: 1515, fiction: true, look: '40대, 녹슨 갑옷, 지친 얼굴' });
  fig('wk_refugee', { name: '피란민', title: '불타는 마을에서 온 사람', st: 'cn', role: 'sailor', born: 1520, fiction: true, look: '그을린 옷, 아이를 업은 아낙' });
  G.WOKOU_FIGS = ['wk_hu', 'wk_xuhai', 'wk_mao', 'wk_miner', 'wk_officer', 'wk_refugee'];

  if (G.ITEMS && G.ITEM) {
    var add = function (it) { if (!G.ITEM[it.id]) { G.ITEMS.push(it); G.ITEM[it.id] = it; } };
    add({ id: 'wk_flag', name: '정해왕의 통행 깃발', kind: 'special', price: 0, reg: [], rare: true,
      desc: '「정해왕(淨海王)」 왕직의 배라는 표시. 이 깃발을 단 배는 동중국해의 왜구가 건드리지 않았다 — 왕직이 바다에 있는 동안은.' });
    add({ id: 'wk_book', name: '『기효신서』', kind: 'special', price: 0, reg: [], rare: true,
      desc: '척계광이 의오의 광부들을 길러 낸 방법을 적은 병법서. 원앙진 열두 사람의 자리와 무기, 북과 깃발의 신호가 그림과 함께 실렸다. 첫 장에 「바다의 손님에게」라는 친필이 있다.' });
    add({ id: 'wk_pass', name: '호종헌의 통행첩', kind: 'special', price: 0, reg: [], rare: true, noSell: true,
      desc: '절강 총독 호종헌의 붉은 관인이 찍힌 통행첩. 이것을 가진 이방인의 배는 왜구 토벌을 돕는 배로 여겨 항주·상해·복주·천주·하문에 들어갈 수 있다. 팔 수 없다.' });
  }

  G.BALANCE = G.BALANCE || {};
  G.BALANCE.wokou = G.BALANCE.wokou || {
    ports: [177, 288, 176, 175, 287],          // 이 사건으로 들어갈 수 있는 명의 항구 (통행첩)
    trade: 4000,                               // ①' 정해왕과의 밀무역 — 은과 생사를 바꿔 남기는 금화
    huGold: 3000,                              // ② 호종헌의 사례
    foe: { raid: 30, taizhou: 44, pinghai: [0, 4, 3, 2] },   // 육상전 왜구 수 · 평해위 해전 [안택선, 관선, 소조, 정크]
    quizCut: 0.12,                             // 원앙진 물음을 하나 맞힐 때마다 태주의 왜구 수 −12%
    fame: { raid: 80, wang: 80, hu: 100, taizhou: 200, pinghai: 260 }
  };
})(window.G = window.G || {});
