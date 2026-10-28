/* 엘미나 요새 건설 (1481~1482, 뒷이야기 ~1637)에 나오는 실제 인물들 — G.HIST_FIG 에 덧붙인다. 사건은 js/systems/elmina.js. 2026-10-28 사용자 요청
   얼굴 그림: images/portraits/history/<id>.webp (448×448) · <id>_half.webp (1024×1536 투명 무릎상)
   디아스·콜롬부는 경쟁 탐험가 그림(portraits/rivals/바르톨로메우 디아스 · 크리스토발 콜론)을 그대로 쓴다.
   그림이 없으면 역할(role)·양식(st: ib 이베리아, af 아프리카)으로 그린 얼굴. */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    // ── 포르투갈 — 미나 원정대
    azambuja: { name: '디오구 드 아잠부자', title: '미나 원정대장 · 상 조르즈 다 미나의 첫 성주', st: 'ib', role: 'noble', born: 1432, look: '50대, 짧게 다듬은 회색 수염, 금실 수놓은 비단 옷 위에 금 목걸이, 허리에 칼, 늙은 군인의 단단한 손과 차분한 눈' },
    dias: { name: '바르톨로메우 디아스', portraitName: '바르톨로메우 디아스', title: '아잠부자 함대의 짐배 선장 (뒷날 희망봉을 돈 사람)', st: 'ib', role: 'captain', born: 1450, look: '30대 초, 검은 수염, 소금기에 바랜 가죽 조끼, 손에 측심줄' },
    colombo: { name: '크리스토방 콜롬부', portraitName: '크리스토발 콜론', title: '포르투갈 배를 타는 제노바 선원 (뒷날의 콜론)', st: 'ib', role: 'captain', born: 1451, look: '30대 초, 일찍 센 붉은 기 도는 머리, 길쭉한 얼굴, 낡은 선원 외투, 해도에 무언가를 적어 넣는 버릇' },
    // ── 황금 해안 — 두 마을의 사람들
    caramansa: { name: '카라만사', full: '콰민 안사 (포르투갈 사람들은 「카라만사」라고 불렀다)', title: '「두 마을」의 우두머리', st: 'af', role: 'king', born: 1440, look: '40대, 위엄 있는 얼굴, 팔과 다리에 금 고리, 목에 금 사슬, 수염에 매단 작은 금 조각들, 흰 무명 천을 어깨에 두르고 시종들이 든 큰 일산 아래 앉은 모습' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });
  G.MINA_FIGS = Object.keys(L);
  // 사건의 이름 없는 화자도 서로 다른 전용 초상을 쓴다.
  var extra = {
    mina_elder: { name: '두 마을의 노인', st: 'af', role: 'elder' },
    mina_trader: { name: '아칸 상인', st: 'af', role: 'merchant', g: 'f' },
    mina_factor: { name: '서인도 회사의 상관장', st: 'ne', role: 'merchant' },
    mina_mother: { name: '쇠사슬에 묶인 여인', st: 'af', role: 'native', g: 'f' }
  };
  Object.keys(extra).forEach(function (id) { if (!F[id]) { extra[id].id = id; F[id] = extra[id]; } });
  G.MINA_EXTRA_FIGS = Object.keys(extra);
})(window.G = window.G || {});
