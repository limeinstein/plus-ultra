/* 명의 베이징 정권 붕괴 · 청의 입관 (1644)에 나오는 실제 인물들 — G.HIST_FIG 에 덧붙인다. 사건은 js/systems/mingfall.js. 2026-10-29 사용자 요청
   진원원은 이미 있는 지역 사람 동료(h_chenyuanyuan, js/data/regionfolk.js · 그림 portraits/mates/h_chenyuanyuan)를 그대로 쓴다.
   얼굴 그림: images/portraits/history/<id>.webp (448×448) · <id>_half.webp (1024×1536 투명 무릎상)
   그림이 없으면 역할(role)·양식(st: cn 중국, ne 북유럽)으로 그린 얼굴. */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    // ── 명의 궁정 — 마지막 밤
    chongzhen: { name: '숭정제', full: '주유검 (명의 열여섯째 황제, 1627~1644)', title: '대명 황제', st: 'cn', role: 'king', born: 1611, look: '30대 초, 여위고 창백한 얼굴, 짧은 수염, 잠 못 잔 붉은 눈, 풀어 헤친 상투, 누런 용포 대신 흰 겹옷 한 벌, 손에 붓' },
    wangchengen: { name: '왕승은', title: '사례감 병필태감 · 황제 곁에 끝까지 남은 환관', st: 'cn', role: 'noble', born: 1600, look: '40대, 수염 없는 둥근 얼굴, 검은 환관 모자와 짙은 붉은 옷, 등불을 든 떨리는 손' },
    schall: { name: '아담 샬 폰 벨', full: 'Johann Adam Schall von Bell (중국 이름 탕약망)', title: '예수회 신부 · 명의 흠천감에서 일하는 독일인', st: 'ne', role: 'priest', born: 1592, look: '50대, 길고 흰 수염, 명나라 학자의 검은 관과 비단 도포, 목에 작은 십자가, 손에 대포 주조 도면' },
    // ── 대순(이자성의 나라)
    liuzongmin: { name: '유종민', title: '대순의 권장군 · 북경을 차지한 장수', st: 'cn', role: 'soldier', born: 1609, look: '30대, 거친 수염과 그을린 얼굴, 대순의 붉은 전포 위에 쇠비늘 갑옷, 술잔과 칼, 오만한 웃음' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });
  G.MINGFALL_FIGS = Object.keys(L);
})(window.G = window.G || {});
