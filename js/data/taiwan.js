/* 타이완 — 정성공의 질란디아 공략(1661~1662) · 청의 타이완 정복(1683) (사건: js/systems/taiwan.js). 2026-11-01 사용자 요청
   ■ 사람(대화에 세우는 실존 인물 — G.HIST_FIG): 하빈(옛 네덜란드 통역) · 코이엣(질란디아 총독) · 카우(구원 함대 지휘관) · 유국헌(정씨 수군 대장) · 정극상(마지막 연평왕)
     정성공(h_zhengchenggong)·시랑(h_shilang)은 원래 있던 지역 사람 동료(js/data/regionfolk.js)를 쓴다.
   ■ 소지품: 질란디아 성의 열쇠(tw_key — 정씨 편) · 동인도 회사의 은 메달(tw_medal — 네덜란드 편) · 대명의 마지막 깃발(tw_banner — 1683 정씨 편) */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('tw_hebin', { name: '하빈', title: '질란디아의 옛 통역', st: 'cn', role: 'merchant', born: 1610, look: '50대, 복건 상인의 비단 장삼, 소매에 감춘 바다 그림, 눈치 빠른 웃음' });
  fig('tw_coyett', { name: '프레데릭 코이엣', title: '포르모사 총독', st: 'ne', role: 'official', born: 1615, look: '40대 중반, 검은 동인도 회사 관복, 흰 깃, 수염, 아홉 달 포위에 야윈 얼굴' });
  fig('tw_caeuw', { name: '야코프 카우', title: '바타비아 구원 함대 지휘관', st: 'ne', role: 'captain', born: 1625, look: '30대, 깃털 모자, 불안한 눈길, 늘 바람의 방향만 묻는 선장' });
  fig('tw_liu', { name: '유국헌', title: '정씨 수군 대장', st: 'cn', role: 'captain', born: 1629, look: '50대, 붉은 전포, 명나라식 투구, 팽호 바다에 선 노장' });
  fig('tw_keshuang', { name: '정극상', title: '연평왕 (정성공의 손자)', st: 'cn', role: 'noble', born: 1670, look: '열세 살 소년, 너무 큰 왕포, 막 깎은 앞머리' });
  G.TAIWAN_FIGS = ['tw_hebin', 'tw_coyett', 'tw_caeuw', 'tw_liu', 'tw_keshuang'];

  if (G.ITEMS && G.ITEM) {
    [{ id: 'tw_key', name: '질란디아 성의 열쇠', kind: 'special', price: 0, reg: [], rare: true, desc: '1662년 2월 1일, 코이엣 총독이 정성공에게 넘긴 질란디아 성문의 쇠 열쇠. 국성야가 「바다가 이 섬을 돌려받은 날」을 잊지 말라며 제독에게 나누어 주었다.' },
     { id: 'tw_medal', name: '동인도 회사의 은 메달', kind: 'special', price: 0, reg: [], rare: true, desc: '네덜란드 동인도 회사의 머리글자를 엮어 새긴 은 메달. 질란디아 포위 속으로 화약과 쌀을 들여보낸 선장에게 바타비아 평의회가 내렸다.' },
     { id: 'tw_banner', name: '대명의 마지막 깃발', kind: 'special', price: 0, reg: [], rare: true, desc: '팽호 바다에서 건져 낸 정씨 수군의 깃발. 「大明」 두 글자가 그을렸다. 바다 위에서 명의 연호를 쓰던 마지막 사람들의 것이다.' }
    ].forEach(function (it) { if (!G.ITEM[it.id]) { G.ITEMS.push(it); G.ITEM[it.id] = it; } });
  }

  G.BALANCE = G.BALANCE || {};
  G.BALANCE.taiwan = G.BALANCE.taiwan || {
    fame: { cross: 260, relief: 220, surrender: 160, penghu: 300, last: 200 },
    gold: { cross: 3000, relief: 2500, surrender: 4000, penghu: 3500 }
  };
})(window.G = window.G || {});
