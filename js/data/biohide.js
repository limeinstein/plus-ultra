/* 동물·식물 발견물의 자리 나누기와 숨기 (2026-11-19 사용자 요청 — 규칙: js/systems/biohide.js)
   「한곳에 몰려 있는 것을 지역 기준으로 배분하고, 같은 동물 발견물 중에 육식이 있으면 주변에 동물 발견물이 안 보이고 도망쳐서 멀리 떨어지는
     기능을 구현해. 식물 발견물이 있으면 동물 발견물이 숨어 버려서 안 보이게 구현해.」
   · G.BIO_SPREAD: 1° 안에 동식물이 몰려 있던 곳(한반도·교토·세렝게티·아마존 등 QA 100판에서 한 걸음마다 카드가 뜨던 곳)의 동물·식물을
     같은 지역(가까운 도시의 지역이 발견물의 지역과 같은 곳) 안에서 0.9° 넘게 떨어진 뭍으로 옮긴 좌표 [위도, 경도].
     이름에 자리가 박힌 식물(「사가노 대나무숲」「요시노의 벚나무」)·전설·책으로만 나오는 것은 옮기지 않았다. 단서 글의 「○○ 북쪽」 방향도 지켰다.
     원래 좌표는 d.lat0·d.lon0 에 그대로 남는다. 만든 곳: QA 도구 spread.js (뭍·지역·지형·단서 방향을 따져 가장 적게 옮긴 자리)
   · G.CARNIVORES: 육식 동물 발견물 — 이것을 아직 찾지 않았으면 둘레(scareR)의 다른 동물 발견물은 놀라 멀리(flee) 달아나 있다.
   · 조정값 G.BALANCE.bio */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.bio = {
    scareR: 2.2,          // 찾지 않은 육식 동물에서 이 거리(°) 안에 사는 동물은 달아난다
    flee: [2.0, 3.2],     // 달아나는 거리(°) — 육식 동물 반대쪽으로, 같은 지역의 뭍
    plantR: 1.0,          // 찾지 않은 식물에서 이 거리(°) 안의 동물은 덤불에 숨어 보이지 않는다 (그 식물을 찾으면 나온다)
    sayDays: 20           // 「달아났다·숨었다」 알림을 같은 동물에 대해 다시 하는 간격(일)
  };
  G.BIO_SPREAD = {
    shiri: [37.41, 127.58],   // 쉬리
    moonbear: [37.63, 128.46],   // 반달곰
    yuzu: [34.72, 134.52],   // 유자
    akebi: [35.57, 136.3],   // 아케비
    shiba: [35.06, 137.05],   // 시바견
    koreancat: [34.52, 129.39],   // 코리안 숏헤어
    papyrus: [31.09, 31.11],   // 파피루스
    yorkie: [53.74, -0.11],   // 요크셔 테리어
    giraffe: [-1.5, 35.7],   // 기린
    vinousbird: [38.15, 127.02],   // 뱁새
    crane: [39.15, 127.2],   // 두루미
    sacredibis: [30.84, 32.12],   // 신성따오기
    wildebeest: [-0.96, 34.95],   // 검은꼬리누
    boto: [-3.11, -59.27],   // 아마존강돌고래
    morpho: [-2.42, -59.98],   // 모르포나비
    buffalo: [15.1, 101.11],   // 물소
    lion: [-2.95, 34.47],   // 사자
    ploverbird: [24.5, 33.45],   // 악어새
    mallard: [53.06, 5.68],   // 청둥오리
    otter: [57.26, -5.85],   // 수달
    gibbon: [14.43, 101.89],   // 흰손긴팔원숭이
    leopard: [-19.3, 23.53],   // 표범
    asianelephant: [11.6, 77.11],   // 아시아코끼리
    gooseberry: [50.68, 1.6],   // 구스베리
    blackcurrant: [58.75, 32.86],   // 블랙커런트
    kola: [8.76, -13.09],   // 콜라나무
    pomegranate: [32.53, 52.45],   // 석류
    rambutan: [-5.78, 105.72],   // 람부탄
    biwa: [32.21, 129.94],   // 비파
    saguaro: [32.62, -111.54],   // 사와로
    hummingbird: [0.37, -79.05],   // 벌새
    hercules: [13.83, -60.87],   // 헤라클레스장수풍뎅이
    swallowtail: [36.55, 127.31],   // 호랑나비
    atlasmoth: [2.02, 101.57],   // 아틀라스나방
    sacredscarab: [25.53, 33.61],   // 성스러운 쇠똥구리
    peacockbf: [47.72, 7.38],   // 공작나비
  };
  // 육식 동물 (땅의 짐승·맹금·큰 뱀). 전설의 짐승은 따로 다루므로 넣지 않는다
  G.CARNIVORES = ['lion', 'hyena', 'cheetah', 'leopard', 'graywolf', 'himalwolf', 'floridawolf', 'hudsonwolf', 'arcticwolf', 'amurtiger', 'tiger',
    'snowleopard', 'amurleopard', 'cloudleopard', 'jaguar', 'puma', 'coyote', 'redfox', 'lynx', 'grizzly', 'brownbear', 'polarbear', 'dingo',
    'wolverine', 'manul', 'fennec', 'kingcobra', 'boa', 'anaconda', 'komodo', 'crocodile', 'baldeagle', 'eagle', 'falcon', 'snowyowl'];
  // 육식 동물을 겁내지 않는 큰 짐승 (코끼리·코뿔소·하마) — 달아나지 않는다
  G.BIO_FEARLESS = ['elephant', 'asianelephant', 'rhino', 'hippo'];
  // 옮긴 자리를 발견물에 적는다 (G.DISC 를 만든 바로 뒤 — 다른 시스템이 좌표를 기억하기 전에)
  if (G.DISC) Object.keys(G.BIO_SPREAD).forEach(function (id) {
    var d = G.DISC[id], p = G.BIO_SPREAD[id]; if (!d) return;
    if (d.lat0 == null) { d.lat0 = d.lat; d.lon0 = d.lon; }
    d.lat = p[0]; d.lon = p[1]; d.spread = true;
  });
})(window.G = window.G || {});
