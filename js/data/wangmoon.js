/* 왕서방·명월 — 조선 항구의 독립 상인 사건. 금봉호의 진행과는 관계없다. */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.wangMoon = G.BALANCE.wangMoon || {
    ports: [190, 226],       // 한양·동래
    ratio: 1.6,             // 최근에 본 값과 본디 값 중 높은 값의 이만큼에 조선 물건을 산다
    cool: 120,              // 거래한 뒤 다시 만나는 날 간격
    retryDays: 1            // 인사만 하거나 거래를 사양한 뒤의 간격
  };
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var figures = {
    wm_wang: { name: '왕서방', full: '왕(王) 서방', title: '비단 장수 · 조선 항구의 상인', st: 'cn', role: 'merchant', born: 1535,
      look: '40대, 넉넉한 체형과 둥근 볼, 상투와 길게 늘어진 콧수염·턱수염, 연한 비취빛 회베이지 장포에 구름무늬 깃, 비단 견본과 작은 조선식 노리개, 사람 좋은 웃음' },
    wm_myeongwol: { name: '명월', full: '명월(明月)', title: '조선의 상인 · 왕서방의 장사 벗', st: 'kr', role: 'merchant', g: 'f', fiction: true,
      look: '날씬한 체형과 풍성한 가슴을 지닌 20대 성인 여성, 은비녀를 꽂은 쪽머리와 작은 진주 귀걸이, 저고리 없이 가슴을 덮어 여민 흰 비단 치마, 드러난 어깨와 가슴선, 허리에 작은 옥 노리개, 차분한 미소' }
  };
  Object.keys(figures).forEach(function (id) { if (!F[id]) { figures[id].id = id; F[id] = figures[id]; } });
  G.WANGMOON_FIGS = Object.keys(figures);
})(window.G = window.G || {});
