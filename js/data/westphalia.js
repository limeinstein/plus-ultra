/* 베스트팔렌 조약 (1648)에 나오는 실제 인물들 — G.HIST_FIG 에 덧붙인다. 사건은 js/systems/westphalia.js. 2026-10-29 사용자 요청
   네덜란드 독립 전쟁 「개미와 베짱이」(js/systems/dutchwar.js)의 뒷이야기 — 할리나·페르베르크는 그 파일의 동료를 그대로 쓴다.
   얼굴 그림: images/portraits/history/<id>.webp (448×448) · <id>_half.webp (1024×1536 투명 무릎상)
   그림이 없으면 역할(role)·양식(st: ne 북유럽, ib 이베리아)으로 그린 얼굴. */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    wp_pauw: { name: '아드리안 파우', title: '네덜란드 연방 대표 · 홀란트의 법률고문', st: 'ne', role: 'noble', born: 1585, look: '60대 초, 희끗한 짧은 수염, 검은 비단 옷에 넓고 흰 맷돌 깃, 검은 모자, 손에 접은 조약문, 꼼꼼하고 깐깐한 얼굴' },
    wp_penaranda: { name: '페냐란다 백작', full: '가스파르 데 브라카몬테 이 구스만', title: '에스파냐 전권 대사', st: 'ib', role: 'noble', born: 1595, look: '50대, 뾰족하게 다듬은 콧수염과 턱수염, 검은 에스파냐 궁정복에 흰 골릴라 깃, 가슴에 붉은 칼 십자가, 지치고 위엄 있는 눈' },
    wp_terborch: { name: '헤라르트 테르보르흐', title: '뮌스터에 온 젊은 화가', st: 'ne', role: 'merchant', born: 1617, look: '30대 초, 갸름한 얼굴과 가는 콧수염, 수수한 갈색 옷, 겨드랑이에 작은 화판, 손가락에 물감 자국, 관찰하는 조용한 눈' },
    wp_salvius: { name: '요한 아들레르 살비우스', title: '스웨덴 대표 · 오스나브뤼크 회의', st: 'ne', role: 'noble', born: 1590, look: '50대 후반, 둥근 얼굴에 흰 턱수염, 짙은 푸른 외투와 털 깃, 금테 안경, 장부를 사랑하는 외교관' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });
  G.WESTPHALIA_FIGS = Object.keys(L);
})(window.G = window.G || {});
