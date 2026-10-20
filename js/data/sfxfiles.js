/* 녹음 효과음과 배경 소리
   sounds/rpg/    — Kenney 「RPG Audio」 (CC0 공개 저작물 · sounds/rpg/License.txt): 발걸음·동전·칼·책·문·천·삐걱임
   sounds/nature/ — Mixkit·Pixabay 효과음 (무료 사용 허가 · sounds/nature/License.txt): 파도·항구·비·폭풍·새·짐승·동전·북·폭발
   G.Audio.sfx(이름)이 불리면 sets에 적힌 녹음을 먼저 낸다. 녹음을 못 내는 환경(ogg를 못 트는 브라우저·파일이 없음)이면 예전 합성음을 낸다.
   항목: f 파일들(하나를 무작위로, 바로 전과 다르게) · v 크기(0~1, 효과음 크기 설정에 곱한다) · rate 빠르기 [가장 느리게, 가장 빠르게](음높이도 함께 바뀐다)
         seq 한 번에 여러 번 낼 때의 시작 시각(초) — 발걸음처럼 · mode 'replace' 합성음 대신 / 'layer' 합성음과 함께
   amb: 계속 깔리는 배경 소리 (G.Audio.amb — 장면이 매 순간 크기 0~1을 알려 주고, 알려 주지 않으면 서서히 사라진다)
   wild: 뭍에서 가끔 들리는 짐승·새 소리 (G.Audio.wild) — 땅마다 고르는 이름들, 간격 every [가장 짧게, 가장 길게](초)
   beast: 들짐승이 덮칠 때 짐승마다 내는 소리 (G.Audio.beast)
   조정값: 전체 크기 vol · ambVol(배경 소리 전체) · 항목별 v·rate·seq */
(function (G) {
  'use strict';
  function rpg(a) { return a.map(function (n) { return 'rpg/' + n; }); }
  function nat(a) { return a.map(function (n) { return 'nature/' + n; }); }
  var STEPS = rpg(['footstep00', 'footstep01', 'footstep02', 'footstep03', 'footstep04', 'footstep05', 'footstep06', 'footstep07', 'footstep08', 'footstep09']);
  G.SFX_FILES = {
    dir: 'sounds/',
    ext: '.ogg',
    vol: 1,
    ambVol: 1,
    sets: {
      // ---- 돈: 교역소에서 사고팔 때 · 식당 · 전리품
      coin:     { f: rpg(['handleCoins', 'handleCoins2']).concat(nat(['coins_clink', 'coins_handle'])), v: 0.7, rate: [0.95, 1.06], mode: 'replace' },
      purse:    { f: rpg(['handleCoins']), v: 0.7, rate: [0.97, 1.03] },                  // 매출: 동전 소나기(coinRain)의 첫머리 — 돈주머니에 쏟는 소리
      purse2:   { f: nat(['coins_clink', 'coin_drop1', 'coin_drop2']).concat(rpg(['handleCoins2'])), v: 0.6, rate: [0.9, 1.1] },   //   큰 매출이면 한 번 더
      prize:    { f: nat(['coin_prize']), v: 0.55, rate: [0.97, 1.03] },                  // 아주 큰 매출 · 보물 · 내기에서 땄다
      bet:      { f: nat(['coin_spin']), v: 0.55, rate: [0.95, 1.08] },                   // 판돈을 건다 (탁자 위에 동전이 돈다)
      unload:   { f: rpg(['dropLeather', 'handleSmallLeather', 'handleSmallLeather2']), v: 0.75, rate: [0.85, 1], seq: [0, 0.24], mode: 'layer' },   // 짐 부리기
      // ---- 걷기·뛰기
      townstep: { f: STEPS, v: 0.3, rate: [0.95, 1.08], seq: [0, 0.42], mode: 'replace' },   // 마을 돌길 걷기 (한 번에 두 걸음)
      run:      { f: STEPS, v: 0.36, rate: [1.08, 1.22], seq: [0, 0.19, 0.38], mode: 'replace' },   // 뛰기 (마을·뭍)
      landstep: { f: STEPS, v: 0.26, rate: [0.82, 0.94], seq: [0, 0.07, 0.44, 0.5] },        // 뭍의 탐험대 걷기 — 여럿이 걷는 무거운 걸음
      // ---- 건물·책
      door:     { f: rpg(['doorOpen_1', 'doorOpen_2']), v: 0.5, rate: [0.95, 1.05], mode: 'replace' },   // 건물에 들어선다
      doorClose: { f: rpg(['doorClose_1', 'doorClose_2', 'doorClose_3', 'doorClose_4']), v: 0.38, rate: [0.95, 1.05] },   // 건물을 나선다
      page:     { f: rpg(['bookFlip1', 'bookFlip2', 'bookFlip3']), v: 0.6, rate: [0.95, 1.08], mode: 'replace' },   // 서고·수첩 쪽 넘기기
      book:     { f: rpg(['bookOpen']), v: 0.7, rate: [0.95, 1.05] },                      // 수첩을 펼 때
      bookClose: { f: rpg(['bookClose']), v: 0.45, rate: [0.95, 1.05] },                  // 수첩을 덮을 때
      // ---- 항해
      sail:     { f: rpg(['cloth1', 'cloth2', 'cloth3']), v: 0.28, rate: [0.55, 0.7], mode: 'layer' },   // 돛폭이 바람에 펄럭임 (항해 중 가끔)
      creak:    { f: rpg(['creak1', 'creak2', 'creak3']), v: 0.32, rate: [0.75, 0.95] },   // 배 나무가 삐걱임 (항해 중 가끔 · 백병전에서 배가 부딪칠 때)
      depart:   { f: rpg(['creak2']), v: 0.4, rate: [0.8, 0.9], mode: 'layer' },
      dock:     { f: rpg(['creak1', 'creak3']), v: 0.45, rate: [0.8, 0.95], mode: 'layer' },
      seamonster: { f: nat(['dragon_roar']), v: 0.75, rate: [0.8, 0.9] },                 // 바다 괴물이 배를 덮친다
      // ---- 싸움: 일기토 · 백병전 · 육상전 · 해전
      sword:    { f: rpg(['knifeSlice', 'knifeSlice2']), v: 0.5, rate: [0.9, 1.1], mode: 'layer' },   // 칼을 휘두르는 쉭 소리 (+ 합성 쇳소리)
      draw:     { f: rpg(['drawKnife1', 'drawKnife2', 'drawKnife3']), v: 0.75, rate: [0.92, 1.05] },   // 칼을 뽑는다: 일기토·육상전·백병전 시작
      cut:      { f: rpg(['chop', 'knifeSlice2']), v: 0.55, rate: [0.85, 1.05] },        // 일기토에서 칼이 들어갔을 때
      parry:    { f: rpg(['metalPot1', 'metalPot2', 'metalPot3']), v: 0.22, rate: [1.3, 1.5] },   // 일기토에서 막았을 때 — 칼날이 부딪는 쇳소리
      drums:    { f: nat(['war_drums']), v: 0.6, rate: [0.97, 1.03] },                     // 해전·육상전이 시작된다
      boom:     { f: nat(['boom_far']), v: 0.55, rate: [0.85, 1] },                        // 배가 터져 가라앉는다 (멀리서 울리는 폭발)
      // ---- 카드 (술집 포카)
      card:     { f: rpg(['bookFlip3', 'bookFlip2']), v: 0.5, rate: [1.25, 1.45] },         // 한 장씩 나눈다
      shuffle:  { f: rpg(['cloth2', 'cloth3', 'cloth4', 'bookFlip1']), v: 0.42, rate: [1.35, 1.6], seq: [0, 0.13, 0.27, 0.42] },   // 패를 섞는다
      reveal:   { f: rpg(['bookPlace1', 'bookPlace2', 'bookPlace3']), v: 0.4, rate: [1.15, 1.3] },   // 패를 펼쳐 보인다
      // ---- 짐승·새 (거리의 고양이·개 · 뭍의 짐승 — wild·beast가 고른다)
      cat:      { f: nat(['cat']), v: 0.3, rate: [0.95, 1.12], mode: 'replace' },
      dog:      { f: nat(['dog']), v: 0.32, rate: [0.92, 1.08], mode: 'replace' },
      horse:    { f: nat(['horse_snort']), v: 0.45, rate: [0.95, 1.05], mode: 'layer' },   // 육상전 기병 돌격 (+ 합성 말발굽)
      eagle:    { f: nat(['eagle']), v: 0.3, rate: [0.95, 1.05] },
      raven:    { f: nat(['raven']), v: 0.3, rate: [0.92, 1.05] },
      songbird: { f: nat(['songbird']), v: 0.3, rate: [0.95, 1.1] },
      goat:     { f: nat(['goat']), v: 0.32, rate: [0.95, 1.08] },
      donkey:   { f: nat(['donkey']), v: 0.32, rate: [0.97, 1.03] },
      snort:    { f: nat(['horse_snort']), v: 0.3, rate: [0.95, 1.05] },
      wolfHowl: { f: nat(['wolf_howl']), v: 0.26, rate: [0.95, 1.05] },
      wolves:   { f: nat(['wolves']), v: 0.24, rate: [0.97, 1.03] },
      hyena:    { f: nat(['hyena']), v: 0.3, rate: [0.95, 1.05] },
      lion:     { f: nat(['lion']), v: 0.32, rate: [0.9, 1.0] },
      roarBeast: { f: nat(['beast_roar']), v: 0.6, rate: [0.95, 1.08] },
      roarBig:  { f: nat(['monster_roar']), v: 0.6, rate: [0.9, 1.0] },
      roarLion: { f: nat(['lion']), v: 0.7, rate: [0.95, 1.02] },
      wolfAttack: { f: nat(['wolf_attack']), v: 0.6, rate: [0.95, 1.05] },
      // ---- 그 밖
      equip:    { f: rpg(['clothBelt', 'clothBelt2', 'beltHandle1', 'beltHandle2']), v: 0.55, rate: [0.95, 1.05] },   // 방어구를 걸친다
      latch:    { f: rpg(['metalLatch', 'metalClick']), v: 0.55, rate: [0.9, 1.05] },     // 상자 걸쇠
      pot:      { f: rpg(['metalPot1', 'metalPot2', 'metalPot3']), v: 0.18, rate: [0.95, 1.1] }   // 식당·요리 — 냄비
    },
    // 배경 소리 (반복): 크기 v는 장면이 알려 주는 0~1에 곱한다
    amb: {
      sea_waves:   { f: 'nature/sea_waves', v: 0.32 },     // 먼바다 물결 (항해)
      sea_birds:   { f: 'nature/sea_birds', v: 0.3 },      // 물결과 바닷새 (멈춰 닻을 내렸을 때)
      sea_wind:    { f: 'nature/sea_wind', v: 0.26 },      // 센 바람
      sea_rough:   { f: 'nature/sea_rough', v: 0.4 },      // 폭풍의 거친 바다
      sea_close:   { f: 'nature/sea_close', v: 0.3 },      // 뱃전에 부딪는 물결 (해전)
      harbor:      { f: 'nature/harbor', v: 0.22 },        // 항구 바위에 찰싹이는 물결 (도시 거리)
      rain:        { f: 'nature/rain', v: 0.4 },           // 빗소리 (G.Audio.rain)
      storm:       { f: 'nature/storm', v: 0.42 },         // 폭풍우와 천둥
      meadow:      { f: 'nature/meadow', v: 0.26 },        // 뭍: 풀밭·초원의 아침 새
      forest:      { f: 'nature/forest', v: 0.26 },        // 뭍: 숲·냇가의 새
      jungle:      { f: 'nature/jungle', v: 0.3 },         // 뭍: 밀림의 새
      jungle_rain: { f: 'nature/jungle_rain', v: 0.3 },    // 뭍: 밀림에 비가 오는 날
      night:       { f: 'nature/night', v: 0.3 },          // 뭍: 야영하는 밤 (부엉이)
      gallop:      { f: 'nature/gallop', v: 0.3 }          // 뭍: 말을 타고 달린다
    },
    // 뭍의 땅마다 가끔 들리는 소리 (같은 이름을 여러 번 적으면 더 자주)
    wild: {
      every: [16, 38],
      grass: ['songbird', 'songbird', 'eagle', 'goat'], steppe: ['eagle', 'eagle', 'wolfHowl', 'snort'], forest: ['raven', 'songbird', 'wolfHowl'],
      jungle: ['songbird', 'raven'], mountain: ['eagle', 'goat', 'goat', 'wolfHowl'], desert: ['raven', 'eagle'],
      snow: ['wolves', 'wolfHowl', 'raven'], tundra: ['wolves', 'wolfHowl', 'raven'], ice: ['wolfHowl'],
      africa: ['hyena', 'hyena', 'lion'],      // 하이에나·사자가 사는 땅이면 더한다
      mount: { donkey: ['donkey'], horse: ['snort'], wagon: ['snort'] }   // 탈것이 내는 소리도 가끔
    },
    // 들짐승이 덮칠 때 (육상전 짐승 이름 → 소리)
    beast: { lion: 'roarLion', hyena: 'hyena', tiger: 'roarBig', jaguar: 'roarBeast', bear: 'roarBig', boar: 'roarBeast', wolf: 'wolfAttack' }
  };
})(window.G = window.G || {});
