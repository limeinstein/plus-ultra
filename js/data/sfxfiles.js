/* 녹음 효과음 (sounds/rpg/ — Kenney 「RPG Audio」, CC0 공개 저작물 · sounds/rpg/License.txt)
   G.Audio.sfx(이름)이 불리면 여기 적힌 녹음을 먼저 낸다. 녹음을 못 내는 환경(ogg를 못 트는 브라우저·파일이 없음)이면 예전 합성음을 낸다.
   항목: f 파일들(하나를 무작위로, 바로 전과 다르게) · v 크기(0~1, 효과음 크기 설정에 곱한다) · rate 빠르기 [가장 느리게, 가장 빠르게](음높이도 함께 바뀐다)
         seq 한 번에 여러 번 낼 때의 시작 시각(초) — 발걸음처럼 · mode 'replace' 합성음 대신 / 'layer' 합성음과 함께
   조정값: 전체 크기 vol, 항목별 v·rate·seq */
(function (G) {
  'use strict';
  var STEPS = ['footstep00', 'footstep01', 'footstep02', 'footstep03', 'footstep04', 'footstep05', 'footstep06', 'footstep07', 'footstep08', 'footstep09'];
  G.SFX_FILES = {
    dir: 'sounds/rpg/',
    ext: '.ogg',
    vol: 1,
    sets: {
      // ---- 돈: 교역소에서 사고팔 때 · 식당 · 내기에서 땄을 때 · 전리품
      coin:     { f: ['handleCoins', 'handleCoins2'], v: 0.75, rate: [0.95, 1.06], mode: 'replace' },
      purse:    { f: ['handleCoins'], v: 0.7, rate: [0.97, 1.03] },                       // 매출: 동전 소나기(coinRain)의 첫머리 — 돈주머니에 쏟는 소리
      purse2:   { f: ['handleCoins2'], v: 0.6, rate: [0.9, 1.1] },                         //   큰 매출이면 한 번 더
      unload:   { f: ['dropLeather', 'handleSmallLeather', 'handleSmallLeather2'], v: 0.75, rate: [0.85, 1], seq: [0, 0.24], mode: 'layer' },   // 짐 부리기
      // ---- 걷기·뛰기
      townstep: { f: STEPS, v: 0.3, rate: [0.95, 1.08], seq: [0, 0.42], mode: 'replace' },   // 마을 돌길 걷기 (한 번에 두 걸음)
      run:      { f: STEPS, v: 0.36, rate: [1.08, 1.22], seq: [0, 0.19, 0.38], mode: 'replace' },   // 뛰기 (마을·뭍)
      landstep: { f: STEPS, v: 0.26, rate: [0.82, 0.94], seq: [0, 0.07, 0.44, 0.5] },        // 뭍의 탐험대 걷기 — 여럿이 걷는 무거운 걸음
      // ---- 건물·책
      door:     { f: ['doorOpen_1', 'doorOpen_2'], v: 0.5, rate: [0.95, 1.05], mode: 'replace' },   // 건물에 들어선다
      doorClose: { f: ['doorClose_1', 'doorClose_2', 'doorClose_3', 'doorClose_4'], v: 0.38, rate: [0.95, 1.05] },   // 건물을 나선다
      page:     { f: ['bookFlip1', 'bookFlip2', 'bookFlip3'], v: 0.6, rate: [0.95, 1.08], mode: 'replace' },   // 서고·수첩 쪽 넘기기
      book:     { f: ['bookOpen'], v: 0.7, rate: [0.95, 1.05] },                           // 수첩을 펼 때
      bookClose: { f: ['bookClose'], v: 0.45, rate: [0.95, 1.05] },                       // 수첩을 덮을 때
      // ---- 항해
      sail:     { f: ['cloth1', 'cloth2', 'cloth3'], v: 0.28, rate: [0.55, 0.7], mode: 'layer' },   // 돛폭이 바람에 펄럭임 (항해 중 가끔)
      creak:    { f: ['creak1', 'creak2', 'creak3'], v: 0.32, rate: [0.75, 0.95] },        // 배 나무가 삐걱임 (항해 중 가끔 · 백병전에서 배가 부딪칠 때)
      depart:   { f: ['creak2'], v: 0.4, rate: [0.8, 0.9], mode: 'layer' },
      dock:     { f: ['creak1', 'creak3'], v: 0.45, rate: [0.8, 0.95], mode: 'layer' },
      // ---- 칼싸움: 일기토 · 백병전 · 육상전
      sword:    { f: ['knifeSlice', 'knifeSlice2'], v: 0.5, rate: [0.9, 1.1], mode: 'layer' },   // 칼을 휘두르는 쉭 소리 (+ 합성 쇳소리)
      draw:     { f: ['drawKnife1', 'drawKnife2', 'drawKnife3'], v: 0.75, rate: [0.92, 1.05] },   // 칼을 뽑는다: 일기토·육상전·백병전 시작
      cut:      { f: ['chop', 'knifeSlice2'], v: 0.55, rate: [0.85, 1.05] },             // 일기토에서 칼이 들어갔을 때
      parry:    { f: ['metalPot1', 'metalPot2', 'metalPot3'], v: 0.22, rate: [1.3, 1.5] },   // 일기토에서 막았을 때 — 칼날이 부딪는 쇳소리
      // ---- 카드 (술집 포카)
      card:     { f: ['bookFlip3', 'bookFlip2'], v: 0.5, rate: [1.25, 1.45] },              // 한 장씩 나눈다
      shuffle:  { f: ['cloth2', 'cloth3', 'cloth4', 'bookFlip1'], v: 0.42, rate: [1.35, 1.6], seq: [0, 0.13, 0.27, 0.42] },   // 패를 섞는다
      reveal:   { f: ['bookPlace1', 'bookPlace2', 'bookPlace3'], v: 0.4, rate: [1.15, 1.3] },   // 패를 펼쳐 보인다
      // ---- 그 밖
      equip:    { f: ['clothBelt', 'clothBelt2', 'beltHandle1', 'beltHandle2'], v: 0.55, rate: [0.95, 1.05] },   // 방어구를 걸친다
      latch:    { f: ['metalLatch', 'metalClick'], v: 0.55, rate: [0.9, 1.05] },          // 상자 걸쇠
      pot:      { f: ['metalPot1', 'metalPot2', 'metalPot3'], v: 0.18, rate: [0.95, 1.1] }   // 식당·요리 — 냄비
    }
  };
})(window.G = window.G || {});
