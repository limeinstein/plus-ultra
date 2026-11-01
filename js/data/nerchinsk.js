/* 네르친스크 조약 (1689) — 청과 러시아의 국경 (사건: js/systems/nerchinsk.js). 2026-11-01 사용자 요청
   ■ 사람(G.HIST_FIG): 송고투(색액도 — 청의 대신) · 토마스 페레이라 · 장프랑수아 제르비용(예수회 통역) · 표도르 골로빈(러시아 대사) · 강희제(소식·편지)
   ■ 소지품: 라틴어 조약문 사본(nc_copy) */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('nc_songgotu', { name: '송고투', title: '청의 영시위내대신 (색액도)', st: 'cn', role: 'noble', born: 1636, look: '50대, 공작 깃 꽂은 청의 관모, 붉은 산호 조주, 변발, 무겁게 내리깐 눈' });
  fig('nc_pereira', { name: '토마스 페레이라', title: '예수회 신부 · 청의 라틴어 통역', st: 'ib', role: 'priest', born: 1645, look: '40대, 청나라 관복을 입은 포르투갈 신부, 변발, 수염, 손에 라틴어 문서' });
  fig('nc_gerbillon', { name: '장프랑수아 제르비용', title: '예수회 신부 · 청의 라틴어 통역', st: 'ne', role: 'priest', born: 1654, look: '30대, 청나라 관복을 입은 프랑스 신부, 변발, 일기장' });
  fig('nc_golovin', { name: '표도르 골로빈', title: '러시아 차르의 전권 대사', st: 'ru', role: 'noble', born: 1650, look: '30대 후반, 담비 모피를 두른 비단 카프탄, 큰 털모자, 날카로운 콧수염' });
  fig('nc_kangxi', { name: '강희제', title: '대청의 황제', st: 'cn', role: 'noble', born: 1654, look: '30대, 노란 용포, 얽은 자국이 남은 얼굴, 서양 수학책을 펼친 손' });
  G.NERCHINSK_FIGS = ['nc_songgotu', 'nc_pereira', 'nc_gerbillon', 'nc_golovin', 'nc_kangxi'];

  if (G.ITEMS && G.ITEM && !G.ITEM.nc_copy) {
    var it = { id: 'nc_copy', name: '네르친스크 조약문 사본 (라틴어)', kind: 'special', price: 0, reg: [], rare: true,
      desc: '1689년 9월 7일, 실카 강가의 천막에서 맺은 청과 러시아의 조약. 라틴어로 쓴 원문을 옮겨 적은 사본이다. 아르군 강과 외흥안령(스타노보이 산맥)을 경계로 삼고, 여권을 가진 상인은 오갈 수 있다고 적혀 있다.' };
    G.ITEMS.push(it); G.ITEM.nc_copy = it;
  }

  G.BALANCE = G.BALANCE || {};
  G.BALANCE.nerchinsk = G.BALANCE.nerchinsk || {
    travel: 60,          // 북경·이르쿠츠크에서 네르친스크까지 사절단의 길 (날) — 회담 날(8.22)보다 늦지 않게, 많아야
    base: 0.35,          // 밤의 초안: 성공 바탕 확률 (+ 로망스어(라틴어) 단계마다 0.15 · 웅변 단계마다 0.1 · 상대 말(중국어/슬라브어) 단계마다 0.05)
    fame: { good: 320, ok: 180 }, gold: { good: 5000, ok: 2500 }
  };
})(window.G = window.G || {});
