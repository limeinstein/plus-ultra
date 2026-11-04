/* 연산군과 장녹수, 그리고 흥청망청 — 사람·소지품·조정값 (사건: js/systems/yeonsan.js) 2026-11-03 사용자 요청
   ■ 사람 (G.HIST_FIG): 연산군(얼굴 portraits/legendary/yeonsangun) · 제안대군 · 내시 김처선 · 채홍사 임숭재 · 박원종 · 흥청 · 신부
     장녹수는 원래 있던 지역 사람 동료 h_jangnoksu (js/data/regionfolk.js — 얼굴 portraits/legendary/jang_noksu)
   ■ 소지품: 연산군의 시(ys_poem) · 장녹수의 은가락지(ys_ring) · 노비 문서의 재(ys_ash) */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('ys_king', { name: '연산군', title: '조선의 열째 임금', st: 'kr', role: 'noble', born: 1476, face: 'portraits/legendary/yeonsangun', look: '20대 후반, 붉은 곤룡포 위에 술 얼룩, 날카롭고 지친 눈, 시를 짓는 가는 손' });
  fig('ys_jean', { name: '제안대군', title: '예종의 아들 · 연산군의 당숙', st: 'kr', role: 'noble', born: 1466, face: 'portraits/history/ys_jean', look: '30대, 어수룩한 웃음, 화려한 도포, 잔칫상 앞의 한량' });
  fig('ys_cheoseon', { name: '김처선', title: '세 임금을 모신 늙은 내시', st: 'kr', role: 'official', born: 1421, face: 'portraits/history/ys_cheoseon', look: '80대, 굽은 등, 흰 눈썹, 꼿꼿한 목소리' });
  fig('ys_sungjae', { name: '임숭재', title: '채홍사 · 임금의 매부', st: 'kr', role: 'noble', born: 1475, face: 'portraits/history/ys_sungjae', look: '30대, 비단 갓에 거만한 미소, 뒤에 늘어선 군졸들' });
  fig('ys_wonjong', { name: '박원종', title: '반정을 이끈 무신', st: 'kr', role: 'soldier', born: 1467, face: 'portraits/history/ys_wonjong', look: '30대 후반, 갑옷 위 붉은 철릭, 횃불을 든 굳은 얼굴' });
  fig('ys_hc', { name: '흥청', title: '대궐로 뽑혀 온 기녀', st: 'kr', role: 'maid', g: 'f', born: 1488, face: 'portraits/history/ys_hc', fiction: true, look: '10대 후반, 화려한 비단 저고리, 웃는 얼굴에 젖은 눈' });
  fig('ys_bride', { name: '분이', title: '혼례날 끌려가던 신부', st: 'kr', role: 'maid', g: 'f', born: 1490, face: 'portraits/history/ys_bride', fiction: true, look: '열여섯, 원삼에 족두리, 눈물 자국' });
  G.YEONSAN_FIGS = ['ys_king', 'ys_jean', 'ys_cheoseon', 'ys_sungjae', 'ys_wonjong', 'ys_hc', 'ys_bride'];

  if (G.ITEMS && G.ITEM) {
    var add = function (it) { if (!G.ITEM[it.id]) { G.ITEMS.push(it); G.ITEM[it.id] = it; } };
    add({ id: 'ys_poem', name: '연산군의 시', kind: 'special', price: 0, reg: [], rare: true,
      desc: '폐위되던 밤 연산군이 붓으로 휘갈겨 건넨 시 한 장. 「인생은 풀잎의 이슬 같아, 만날 날이 많지 않구나(人生如草露 會合不多時)」 — 그가 흥청들과의 잔치에서 읊었다는 구절이다.' });
    add({ id: 'ys_ring', name: '장녹수의 은가락지', kind: 'special', price: 0, reg: [], rare: true,
      desc: '노비였던 시절부터 장녹수가 끼던 투박한 은가락지. 숙용이 되어 금가락지를 열 개 끼고도 이것만은 빼지 않았다.' });
    add({ id: 'ys_ash', name: '노비 문서의 재', kind: 'special', price: 0, reg: [], rare: true,
      desc: '반정의 밤, 불타는 장례원 앞에서 장녹수가 한 줌 쥐어 담은 재. 「제 이름이 여기 있었어요. 이제 없어요.」' });
  }

  G.BALANCE = G.BALANCE || {};
  G.BALANCE.yeonsan = G.BALANCE.yeonsan || {
    gift: 300,                                   // ① 노래에 답하는 선물 (구슬 목걸이)
    order: { jewelry: 30, silk: 30, k: 2.5, days: 120 },   // ② 흥청의 잔치에 바칠 장신구·견직물 — 시세의 k배 · 기한(날)
    orderNoto: 6,                                // 흥청망청에 보탠 악명
    bribe: 800,                                  // ③ 채홍사를 매수
    foe: { chae: 14, gate: 30, escape: 18 },
    fame: { song: 40, bride: 80, coup: 160, noksu: 200 }
  };
})(window.G = window.G || {});
