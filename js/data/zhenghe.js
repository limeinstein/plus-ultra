/* 정화의 보선 — 바다에 가라앉은 보물선의 유령 (사건은 js/systems/zhenghe.js · G.ZhengHe). 2026-11-08 사용자 요청
   명성 minFame 이상 · 중국인 항해사가 함대에 있을 때, 정화의 함대가 들렀던 아프리카 항구(말린디·모가디슈)에서 보선의 소문을 듣는다.
   그 뒤 정화의 배가 실제로 머물렀던 바다를 따라 중국까지 — 유령 보선을 이길 때마다 금화를 건진다.
     ① 캘리컷 앞바다 (고리 古里 — 첫 원정의 목적지 · 1433년 정화가 마지막 귀항길에 숨진 바다) — 금화 3만
     ② 실론 남쪽 갈레 앞바다 (석란산 錫蘭山 — 1409년 세 가지 글로 새긴 비석 · 1411년 알라케스바라 왕과의 싸움) — 금화 5만
     ③ 말라카 해협 (만랄가 滿剌加 — 원정대의 창고 관창 官廠) — 금화 7만
     ④ 황해 — 북경의 황제께 복명하러 북으로 가는 보선 다섯 척 — 금화 20만 · 마지막 보선의 칼 「막야」(무력 42)
   그림: images/legend-events/ZHENGHE_PROMPT.md — 초상 portraits/history/zh_*, 장면 legend-events/zh_* */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.zhenghe = G.BALANCE.zhenghe || {
    minFame: 200000,            // 통합 명성 (player.fame)
    rumor: [108, 109],          // 소문을 듣는 아프리카 항구: 말린디 · 모가디슈
    navSkill: 1,                // 항해사 자리가 아니어도 항해 특기가 이만큼 있으면 「항해사」로 본다
    again: 30,                  // 물러나거나 지면 이만큼 뒤에 다시 나타난다 (날)
    stages: [
      null,
      { key: 'calicut', name: '캘리컷 앞바다', box: [74.3, 75.75, 10.3, 12.1], ships: ['baochuan', 'ljunk', 'ljunk'], boss: 'zh_hongbao', gold: 30000, fame: 1500 },
      { key: 'galle', name: '실론 남쪽 바다', box: [79.5, 81.4, 5.2, 6.4], ships: ['baochuan', 'baochuan', 'ljunk', 'ljunk'], boss: 'zh_wangjinghong', gold: 50000, fame: 2000 },
      { key: 'malacca', name: '말라카 해협', box: [100.6, 102.5, 1.4, 3.1], ships: ['baochuan', 'baochuan', 'baochuan', 'ljunk', 'ljunk'], boss: 'zh_houxian', gold: 70000, fame: 2500 },
      { key: 'yellow', name: '황해', box: [120.6, 125.2, 33.8, 38.4], ships: ['baochuan', 'baochuan', 'baochuan', 'baochuan', 'baochuan'], boss: 'zh_zhenghe', gold: 200000, fame: 6000 }
    ]
  };
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    zh_zhenghe: { name: '정화의 혼령', full: '삼보태감 정화(鄭和)의 혼령', title: '명나라 서양 원정대의 정사 태감', st: 'cn', role: 'admiral', born: 1371,
      look: '60대, 큰 키와 넓은 어깨, 위엄 있는 얼굴, 붉은 망포(蟒袍)와 검은 사모, 몸이 희미하게 비치는 푸른 빛, 허리에 칼' },
    zh_hongbao: { name: '홍보의 망령', full: '태감 홍보(洪保)의 망령', title: '보선 선단을 이끌던 태감', st: 'cn', role: 'admiral', born: 1370,
      look: '60대, 마른 얼굴, 남색 관복, 젖은 옷자락, 푸르스름하게 비치는 몸, 손에 나침반(나경)' },
    zh_wangjinghong: { name: '왕경홍의 망령', full: '부사 왕경홍(王景弘)의 망령', title: '원정대의 부사 태감', st: 'cn', role: 'admiral', born: 1375,
      look: '50대, 단단한 얼굴, 짙은 녹색 관복과 흉배, 해초가 감긴 소매, 푸른 빛으로 비치는 몸, 손에 칼' },
    zh_houxian: { name: '후현의 망령', full: '태감 후현(侯顯)의 망령', title: '서역과 남양을 오간 사신 태감', st: 'cn', role: 'admiral', born: 1380,
      look: '40대 후반, 날카로운 눈, 검붉은 관복, 칙서 두루마리, 안개처럼 흐린 몸' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });
  G.ZHENGHE_FIGS = Object.keys(L);

  // 막야(莫邪): 오나라의 칼장인 간장(干將)과 그의 아내 막야가 벼렸다는 한 쌍의 칼 가운데 암칼 — 무력 42
  var IT = [
    { id: 'moye', name: '막야', kind: 'weapon', atk: 42, price: 150000, reg: [], rare: true, style: 'slash',
      desc: '오나라의 칼장인 간장과 그의 아내 막야가 벼렸다는 한 쌍의 칼 가운데 암칼. 쇠가 녹지 않자 막야가 머리카락과 손톱을 화로에 넣었다고 전한다. 정화의 마지막 보선 창고에 실려 황해에 잠들어 있었다. 짝인 간장은 어디에 있는지 아무도 모른다.' },
    { id: 'zh_qilin_scroll', name: '기린도 두루마리', kind: 'keepsake', price: 0, gv: 24, reg: [],
      desc: '1414년 벵골의 사신이 말린디의 기린을 명나라 황제께 바친 날을 그린 그림의 옛 사본. 말린디의 늙은 뱃사람이 할아버지의 할아버지에게서 물려받았다며 내주었다.' }
  ];
  if (G.ITEMS && G.ITEM) IT.forEach(function (x) { if (!G.ITEM[x.id]) { G.ITEMS.push(x); G.ITEM[x.id] = x; } });
})(window.G = window.G || {});
