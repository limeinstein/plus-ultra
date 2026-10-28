/* 은징가 여왕의 저항 (1621~1663)에 나오는 실제 인물들 — G.HIST_FIG 에 덧붙인다. 사건은 js/systems/nzinga.js. 2026-10-28 사용자 요청
   얼굴 그림: images/portraits/history/<id>.webp (448×448) · <id>_half.webp (1024×1536 투명 무릎상)
   그림이 없으면 역할(role)·양식(st: af 아프리카, ib 이베리아, it 이탈리아)으로 그린 얼굴. */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    // ── 은동고·마탐바
    njinga: { name: '은징가', full: '은징가 음반데 (세례명 아나 드 소우자)', title: '은동고와 마탐바의 왕', st: 'af', role: 'king', g: 'f', born: 1583, look: '40대(1622)~70대, 꼿꼿한 몸과 날카로운 눈, 짧게 자른 머리에 구슬과 깃털 관, 어깨에 두른 붉은 천과 표범 가죽, 팔목에 구리·상아 팔찌, 허리에 전투 도끼' },
    kifunji: { name: '키푼지', full: '키푼지 (세례명 그라사)', title: '은징가의 동생 · 사절', st: 'af', role: 'noble', g: 'f', born: 1590, look: '30대, 차분한 얼굴, 푸른 천을 머리에 두르고 구슬 목걸이, 숨긴 편지를 쥔 손' },
    kambu: { name: '캄부', full: '캄부 (세례명 바르바라)', title: '은징가의 막냇동생', st: 'af', role: 'noble', g: 'f', born: 1595, look: '50대(1656), 오랜 포로 생활로 여윈 얼굴, 포르투갈식 드레스 위에 은동고의 붉은 천, 묵주' },
    // ── 포르투갈령 앙골라
    jcsousa: { name: '주앙 코헤이아 드 소우자', title: '앙골라 총독 (1621~1623)', st: 'ib', role: 'noble', born: 1570, look: '50대, 뾰족한 회색 수염, 검은 옷에 흰 러프, 벨벳 의자에 앉은 거만한 자세' },
    fsousa: { name: '페르낭 드 소우자', title: '앙골라 총독 (1624~1630)', st: 'ib', role: 'noble', born: 1575, look: '50대, 각진 얼굴과 짧은 수염, 흉갑 위 검은 망토, 지도와 장부를 든 냉정한 관리' },
    // ── 카푸친 수도회
    gaeta: { name: '안토니우 다 가에타 신부', title: '카푸친회 수도사 · 강화의 중재자', st: 'it', role: 'priest', born: 1620, look: '30대, 갈색 카푸친 수도복과 뾰족한 두건, 긴 수염, 나무 십자가와 샌들' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });
  G.NZINGA_FIGS = Object.keys(L);
})(window.G = window.G || {});
