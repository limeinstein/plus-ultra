/* 도요토미 히데요시의 일본 통일 — 1590년 오다와라 정벌 (사건: js/systems/odawara.js). 2026-11-01 사용자 요청
   「1590 도요토미 히데요시의 일본 통일 — 오다와라 정벌을 통해 주요 다이묘를 복속시키고 전국 통일을 사실상 완성」
   ■ 사람(G.HIST_FIG): 도요토미 히데요시 · 도쿠가와 이에야스 · 다테 마사무네 · 호조 우지나오
     얼굴: images/portraits/legendary/toyotomi_hideyoshi · tokugawa_ieyasu · date_masamune (이미 있다)
     구키 요시타카(h_yoshitaka)·센노 리큐(h_rikyu)는 원래 있던 지역 사람(js/data/regionfolk.js)
   ■ 소지품: 히데요시의 진바오리(odawara_jinbaori)
   ■ 날짜는 모두 양력으로 고친 것 (일본 기록은 음력): 에도성 개성 1590.5.25 · 마사무네 오다와라 도착 7.6(대면 7.10) · 이시가키야마 「하룻밤 성」 7.27 ·
     오다와라 항복 8.4 · 호조 우지마사 할복 8.10 · 이에야스 에도 입성 8.30 · 아이즈의 오슈 시오키 9.7 · 센노 리큐 할복 1591.4.21 */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('od_hideyoshi', { name: '도요토미 히데요시', title: '관백 태정대신', st: 'jp', role: 'king', born: 1537, face: 'portraits/legendary/toyotomi_hideyoshi', look: '50대, 작은 체구, 원숭이 같은 주름진 얼굴, 금빛 진바오리, 가짜 수염' });
  fig('od_ieyasu', { name: '도쿠가와 이에야스', title: '스루가·도토미·미카와의 다이묘', st: 'jp', role: 'noble', born: 1543, face: 'portraits/legendary/tokugawa_ieyasu', look: '40대 후반, 통통한 볼, 참을성 많은 눈, 검은 갑옷' });
  fig('od_masamune', { name: '다테 마사무네', title: '오슈의 「외눈박이 용」', st: 'jp', role: 'noble', born: 1567, face: 'portraits/legendary/date_masamune', look: '20대 초반, 오른눈의 검은 안대, 죽음을 각오한 흰 수의, 머리를 짧게 자름' });
  fig('od_ujinao', { name: '호조 우지나오', title: '오다와라 성주', st: 'jp', role: 'noble', born: 1562, look: '20대 후반, 지친 얼굴, 칼을 풀어 내려놓은 갑옷 차림' });

  if (G.ITEMS && G.ITEM && !G.ITEM.odawara_jinbaori) {
    var it = { id: 'odawara_jinbaori', name: '히데요시의 진바오리', kind: 'treasure', price: 20000, rare: true, reg: [],
      desc: '도요토미 히데요시가 오다와라의 진영에서 벗어 준 진바오리(갑옷 위에 걸치는 겉옷). 금실로 수놓은 표주박 문양이 반짝인다. 「천하인이 입던 옷」이라 하면 누구나 눈을 크게 뜬다.' };
    G.ITEMS.push(it); G.ITEM.odawara_jinbaori = it;
  }
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.odawara = G.BALANCE.odawara || {
    sail: 12,                          // 사카이에서 사가미 앞바다까지 구키 수군과 함께 가는 날수
    gold: 6000,                        // 히데요시의 포상 (진영에 머물러 항복을 지켜보면 — 떠나면 절반)
    fame: { blockade: 220, camp: 120, surrender: 160 }
  };
})(window.G = window.G || {});
