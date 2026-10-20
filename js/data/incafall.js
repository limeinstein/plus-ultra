/* 잉카 제국의 멸망 (1524~1572)에 나오는 실제 인물들 — G.HIST_FIG 에 덧붙인다. 사건은 js/systems/incafall.js. 2026-10-19 사용자 요청
   얼굴 그림: images/portraits/history/<id>.webp (448×448) · <id>_half.webp (1024×1536 투명 무릎상) — images/portraits/history/PROMPT.md 「잉카 제국의 멸망」
   피사로·데 소토는 경쟁 탐험가 그림(portraits/rivals/<이름>)을 그대로 쓴다. 그림이 없으면 역할(role)·양식(st: ib 이베리아, an 안데스)으로 그린 얼굴. */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    // ── 에스파냐 — 「레반테 회사」의 세 동업자와 그 사람들
    pizarro: { name: '프란시스코 피사로', title: '정복자 · 누에바 카스티야 총독', st: 'ib', role: 'soldier', born: 1478, look: '50대, 마르고 단단한 몸, 희끗한 짧은 수염, 낡은 흉갑과 넓은 챙 모자, 글을 모르는 늙은 군인의 고집스러운 눈' },
    almagro: { name: '디에고 데 알마그로', title: '피사로의 동업자 · 원정대 보급 대장', st: 'ib', role: 'soldier', born: 1475, look: '50대, 작고 다부진 몸, 한쪽 눈을 잃어 검은 안대, 거친 회색 수염, 털털한 웃음' },
    luque: { name: '에르난도 데 루케', title: '파나마의 신부 · 원정의 돈줄', st: 'ib', role: 'priest', born: 1470, look: '60대, 둥근 얼굴, 검은 사제복과 은 십자가, 장부를 낀 팔' },
    hpizarro: { name: '에르난도 피사로', title: '피사로의 아우 · 기병 대장', st: 'ib', role: 'noble', born: 1501, look: '30대, 덩치가 크고 오만한 얼굴, 짙은 수염, 번쩍이는 흉갑과 붉은 띠' },
    desoto: { name: '에르난도 데 소토', title: '기병 대장', st: 'ib', role: 'soldier', born: 1500, look: '30대, 날렵한 기병, 짧은 검은 수염, 깃털 꽂은 모리온 투구' },
    valverde: { name: '비센테 데 발베르데 수사', title: '도미니코회 수사 · 원정대 사제', st: 'ib', role: 'priest', born: 1498, look: '30대, 삭발한 정수리, 흰 수도복에 검은 망토, 한 손에 기도서와 십자가' },
    felipillo: { name: '펠리피요', title: '원정대 통역 · 툼베스 출신', st: 'an', role: 'native', born: 1513, look: '10대 후반, 에스파냐식 셔츠 위에 안데스 망토, 영리하고 불안한 눈빛' },
    // ── 잉카 — 타완틴수유 (네 지방의 나라)
    atahualpa: { name: '아타우알파', title: '사파 잉카 · 태양의 아들', st: 'an', role: 'king', born: 1502, look: '30대, 위엄 있는 얼굴, 이마에 붉은 술 장식(마스카파이차), 박쥐 털로 짠 망토, 금 귀마개' },
    manco: { name: '망코 잉카 유팡키', title: '사파 잉카 · 와이나 카팍의 아들', st: 'an', role: 'king', born: 1516, look: '20대, 젊고 날카로운 얼굴, 마스카파이차, 뒷날에는 에스파냐 갑옷을 걸치고 말을 탄다' },
    curaocllo: { name: '쿠라 오클로', title: '코야 · 망코 잉카의 왕비이자 저항 지도자', st: 'an', role: 'native', g: 'f', born: 1508, look: '20대 후반, 두 갈래 검은 댕기머리, 붉은색·청록색 직물 전투복과 리클랴 망토, 금 투푸 핀, 가죽 방패와 돌팔매' },
    villacumu: { name: '비약 우무', title: '태양 신전의 대사제', st: 'an', role: 'priest', born: 1480, look: '50대, 금 원반 가슴 장식, 흰 운쿠, 엄하고 깊은 눈' },
    tupacamaru: { name: '투팍 아마루', title: '빌카밤바의 마지막 잉카', st: 'an', role: 'king', born: 1545, look: '20대 후반, 여윈 얼굴, 쇠사슬에 묶였지만 꼿꼿한 몸, 검은 망토' },
    toledo: { name: '프란시스코 데 톨레도', title: '페루 부왕', st: 'ib', role: 'noble', born: 1515, look: '50대, 엄격한 얼굴, 검은 옷에 흰 러프, 칼라트라바 기사단 십자가' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });
  G.INCA_FIGS = Object.keys(L);
})(window.G = window.G || {});
