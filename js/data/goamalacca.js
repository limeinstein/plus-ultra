/* 포르투갈의 고아·말라카 점령 (1509~1515)에 나오는 실제 인물들 — G.HIST_FIG 에 덧붙인다. 사건은 js/systems/goamalacca.js. 2026-10-28 사용자 요청
   얼굴 그림: images/portraits/history/<id>.webp (448×448) · <id>_half.webp (1024×1536 투명 무릎상)
   마가야네스는 경쟁 탐험가 그림(portraits/rivals/페르난도 데 마가야네스)을 그대로 쓴다. 그림이 없으면 역할(role)·양식(st: ib 이베리아, in 인도, is 이슬람, se 동남아시아)으로 그린 얼굴. */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    // ── 포르투갈 — 인도 총독과 그 사람들
    albuquerque: { name: '아폰수 드 알부케르크', title: '포르투갈령 인도 총독', st: 'ib', role: 'noble', born: 1453, look: '50대 후반, 가슴까지 내려오는 길고 흰 수염, 마르고 꼿꼿한 몸, 검은 옷 위에 낡은 흉갑과 산티아고 기사단의 붉은 칼 십자가, 매서운 눈' },
    magellan: { name: '페르난도 데 마가야네스', portraitName: '페르난도 데 마가야네스', title: '인도 함대의 젊은 포르투갈 귀족 (뒷날의 마젤란)', st: 'ib', role: 'captain', born: 1480, look: '20대 후반, 짧은 검은 수염, 말수 적고 고집 센 얼굴, 가죽 조끼와 칼' },
    araujo: { name: '루이 드 아라우주', title: '말라카에 붙잡힌 포르투갈 상관원', st: 'ib', role: 'merchant', born: 1475, look: '30대, 여윈 얼굴과 덥수룩한 수염, 해진 포르투갈 옷, 손목에 쇠고랑 자국' },
    // ── 인도 — 고아를 둘러싼 사람들
    timoja: { name: '티모자', title: '호나바르의 해상 무사 · 고아의 타나다르', st: 'in', role: 'captain', born: 1470, look: '40대, 검게 그을린 얼굴과 굵은 콧수염, 흰 터번과 허리에 감은 붉은 천, 금 귀고리, 곡도' },
    rasulkhan: { name: '라술 칸', title: '비자푸르의 장수 · 고아 수비대장', st: 'is', role: 'soldier', born: 1475, look: '40대, 짙은 수염, 데칸식 쇠사슬 갑옷과 둥근 방패, 초록 터번, 지친 눈' },
    // ── 말라카 — 술탄과 그 도시의 사람들
    mahmud: { name: '술탄 마흐무드 샤', title: '말라카의 술탄', st: 'se', role: 'king', born: 1468, look: '40대, 노란 비단 옷(말라카 왕실의 색)과 금실 두건, 허리에 금 손잡이 크리스, 오만하고 지친 얼굴' },
    ahmadshah: { name: '아흐마드 샤', title: '술탄의 아들 · 코끼리를 탄 장수', st: 'se', role: 'noble', born: 1490, look: '20대, 젊고 사나운 얼굴, 금빛 두건, 가죽 갑옷, 코끼리 등 위 망루에서 창을 든 모습' },
    ninachatu: { name: '니나 차투', title: '말라카의 클링(타밀) 상인', st: 'in', role: 'merchant', born: 1465, look: '40대, 이마에 재로 그은 줄, 흰 무명 도티와 숄, 손에 야자잎 장부, 조심스럽고 영리한 눈' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });
  G.GOAMAL_FIGS = Object.keys(L);
  // 이름 없는 조연도 전용 얼굴상·무릎상을 사용한다.
  var extra = {
    goa_envoy: { name: '아딜 샤의 사절', st: 'is', role: 'official' },
    malacca_junk: { name: '중국 정크선 선장', st: 'cn', role: 'captain' },
    malacca_bendahara: { name: '말라카의 벤다하라', st: 'se', role: 'official' }
  };
  Object.keys(extra).forEach(function (id) { if (!F[id]) { extra[id].id = id; F[id] = extra[id]; } });
  G.GOAMAL_EXTRA_FIGS = Object.keys(extra);
})(window.G = window.G || {});
