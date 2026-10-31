/* 지형·바다·배 움직임·물보라의 조정값 (G.FX). 값만 바꿔서 느낌을 다듬을 수 있게 한곳에 모은다.
   · terrain / water 는 WebGL 지형 셰이더에 uniform 으로 넘어간다 (js/world/renderer.js)
   · ship 은 바다 장면의 선체 관성 (js/scenes/sea.js), wake / spray 는 항적·물보라 (js/scenes/seafx.js)
   시간 단위: 'd' = 게임 속 하루(×1 배속에서 실제 1.25초). 거리 단위: 경도·위도의 도(°). 기본 항해 확대에서 1° ≈ 110px, 기함 길이 ≈ 0.35°. */
(function (G) {
  'use strict';
  G.FX = {
    // 합성 효과음 크기 (js/systems/audio.js). 거리의 짐승 소리는 다른 효과음보다 작게 들린다.
    audio: { pet: { cat: 0.042, dog: 0.05 } },
    // 자택 장면 그림 (js/art/homeart.js): 그림 크기와 화면 위에서의 자리 (무대 1600×900)
    homeArt: { w: 900, h: 520, top: 78 },
    // 집 외관 높이: 평민·유력자·남작·백작·공작 (거리의 다른 건물과 견줄 때)
    homeBuilding: { heights: [340, 390, 415, 465, 520] },
    famScene: { w: 1008, top: 74 },            // 가족 사건 그림의 너비(높이는 576:256 비율)·위쪽 자리
    // 불러오는 그림 (js/ui/loader.js): 적어도 minShow ms 보여 주고 fadeMs 에 걸쳐 걷는다 · 장면 사이 검은 막이 fadeAfter ms 넘게 걸리면 작게 띄운다 ·
    //   게임을 시작할 때 그림 받기를 기다리는 가장 긴 시간 prepareMs · 도시에 들어서 앞바다를 미리 그리기 시작하는 때 cityWarmMs
    loader: { minShow: 450, fadeMs: 450, fadeAfter: 350, prepareMs: 5000, cityWarmMs: 1500 },
    // 자택 화면에 서 있는 가족 (homelife.js familyPanel): 어른 키 h, 설 자리(왼쪽·아래·너비), 옆 사람과 겹치는 비율
    homeFamily: { h: 610, width: 1150, left: 50, bottom: 0, overlap: 0.3 },
    // 기함 선실 화면 (js/ui/cabinview.js): 무대(배 그림) 크기, 오른쪽 명단 폭, 선체 속 선실 표·갑판 얼굴표 크기, 배 그림을 자르는 여백, 카드 최대 폭, 명단 높이
    cabinView: { stageW: 920, stageH: 314, side: 300, pin: 38, pinMin: 24, medal: 54, pad: 70, minSpan: 560, below: 40, cardMax: 180, rosterH: 280 },
    // 교역 이익 금화비 (js/ui/tradefx.js): 순이익 perCoin마다 금화 한 닢. 큰 이익은 화면 개수만 제한하고 비·소리의 밀도로 크기를 보인다.
  tradeProfit: { perCoin: 100, maxCoins: 120, showerAt: 18, heroH: 470, minMs: 1450, maxMs: 4800,
    gravity: 1480, bounce: 0.34, floorFriction: 2.6, airDrag: 0.08, scatter: 340 },
    // 자동항해를 시작하면 켜지는 배속 (js/scenes/sea.js setTarget — 1·2·4 가운데). 손으로 몰면 이전 배속으로 돌아간다
    autoSailSpeed: 4,
    // 바다에서 멈춰 있을 때(Space·정지) 시간이 흐르는 배속 — 날이 가고 다른 배들이 움직인다. 0이면 예전처럼 멈추면 시간도 멈춘다
    waitSpeed: 1,
    // 멈춘 채 이만큼(초) 아무 입력이 없으면 자리를 비운 것으로 보고 바다의 시간을 멈춘다 — 화면을 켜 둔 채 떠나면 몇 달이 흘러 급료·충성·식량이 빠지던 것 (베타 피드백 #87, 2026-10-28). 0이면 끈다
    afkSec: 90,
    // 바람을 보여 주는 구름 (js/scenes/sea.js cloudStep·cloudTail, js/world/renderer.js clouds)
    //   drift: 풍속 1일 때 구름이 게임 속 하루에 흐르는 거리(°) · idleRate: 멈춰 있거나 대화 중일 때 흐르는 빠르기(×1 배속의 몫)
    //   turn: 바람이 바뀔 때 구름 흐름이 도는 가장 빠른 빠르기(rad/초) · morph: 다른 바다로 들어설 때 구름 모양이 바뀌는 시간(초)
    //   tail: 구름이 흘러가는 쪽(±18°)으로 달릴 때 속력 보너스 (바다마다 steady를 곱한다: 무역풍·계절풍 1, 편서풍 0.7, 극지 0.5, 지중해 0.4, 무풍대 0)
    //   regimes: 바다별 모양을 바꾸려면 { trades: { form: [늘어남, 구름길, 크기, 솟음], steady: 1, name: '…' } } 처럼 덮어쓴다
    clouds: { drift: 1.3, idleRate: 0.35, turn: 0.12, morph: 6, tail: 0.08, regimes: {} },
    // 낚시 배경의 수면 위치. 그림을 화면의 실제 찌 높이에 맞춰 나누어 그린다.
    minigames: {
      fishingWaterline: 0.365, boat: [0, -118, 218, 145],
      // 포카: 덱을 섞고 한 장씩 나누며, 교환 때는 홀드하지 않은 패만 거두어 빈자리에 보충한다.
      poker: { shuffleMs: 720, dealMs: 170, discardMs: 260 }
    },
    // 유적·자연 경관·동물·보물 발견 연출 (js/scenes/common.js SC.discoveryReveal): 화면이 어두워지고 GIF가 빛난 뒤 마지막 장면에서 멈춘다
    reveal: {
      dim: 0.7,           // 뒤쪽 탐험 지도가 어두워지는 정도 (0~1, 가운데는 이것의 80%)
      dimMs: 900,         // 어두워지는 데 걸리는 시간
      playMs: 5000,       // 장면 판(images/discovery-sheets — js/art/reel.js)을 한 바퀴 돌리는 시간. 끝나면 마지막 장면에서 멈춘다
      plantPlayMs: 8400,  // 식물: 빈 캔버스의 유화가 실사 풍경으로 살아나는 시간
      treasurePlayMs: 8400, // 보물 장면 판: 360° 회전 두 번과 정면 피날레
      blend: 0.55,        // 장면 판: 한 장면 시간 가운데 다음 장면으로 겹쳐 넘어가는 몫 (0이면 뚝뚝, 1이면 늘 겹침)
      gifMs: 9820,        // (장면 판이 없을 때) 발견 GIF 한 바퀴 (유적 V2와 자연 파노라마가 같은 길이) — 이 뒤에 마지막 장면으로 멈춘다
      plantGifMs: 8400,   // (장면 판이 없을 때) 식물 유화 GIF 한 바퀴
      treasureGifMs: 8400, // (장면 판이 없을 때) 보물 GIF 두 바퀴의 실제 길이
      scale: 1.9,         // GIF(576×256)를 몇 배로 크게 보이나
      titleMs: 1600,      // 「○○ 발견」 글자가 떠오른 뒤 대화가 시작될 때까지
      loadWaitMs: 2500    // 장면 판·GIF를 기다리는 가장 긴 시간 (보통은 가까워질 때 미리 받아 둔다 — G.Reel.prefetch)
    },
    // 화면 갱신 (js/main.js) — 한 장면이 오래 걸려도 배가 순간 이동하지 않게, 느린 기기는 바다 해상도를 낮춘다
    loop: {
      maxDt: 0.1,         // 한 장면에서 흐르는 가장 긴 시간(초). 이보다 오래 멈췄으면 그만큼만 움직인다
      resDown: 0.028,     // 평균 장면 시간이 이보다 길면(약 36fps 아래) 바다 해상도를 한 단계 낮춘다
      resUp: 0.0185,      // 이보다 짧게 오래 버티면(약 54fps 위) 한 단계 올린다
      resMin: 0.45,       // 가장 낮은 해상도 배율
      resStep: 0.1,       // 한 번에 바꾸는 폭
      resHold: 40,        // 한 단계에서 버벅여 내려왔으면 이 초 동안은 다시 올리지 않는다 (올렸다 내렸다 반복 방지)
      sceneGrace: 1500    // 장면을 막 바꾼 뒤 이 ms 동안은 장면 시간을 재지 않는다 (첫 장면들의 그림 읽기 때문에 해상도가 괜히 내려가지 않게)
    },
    terrain: {
      relief: 1.0,        // 음영(높낮이가 얼마나 도드라져 보이나)
      mountain: 1.0,      // 산맥 높이
      forest: 1.0,        // 숲 밀도
      treeSize: 1.0,      // 나무 크기
      snowline: 0.0,      // 설선 보정 (+면 눈이 적다)
      river: 1.0,         // 강폭
      beach: 1.0,         // 모래사장·해안 띠 폭
      detail: 1.0         // 가까이서의 잔무늬
    },
    water: {
      shelf: 1.0,                       // 연해(얕은 바다)가 뻗는 거리
      wave: 1.0,                        // 파도 크기
      whitecap: 0.5,                    // 흰 물마루 양 — 배경 바다는 얇고 드물게, 선박 포말이 먼저 읽히게 한다
      glint: 1.0,                       // 수면 반짝임 (배·항로를 가리지 않게 상한이 있다)
      shallow: [0.10, 0.47, 0.55],      // 연해 색
      deep: [0.035, 0.21, 0.33],        // 먼바다 색
      lagoon: [0.30, 0.66, 0.63],       // 모래 바닥이 비치는 아주 얕은 물
      foam: 1.0,                        // 해안 포말
      cloud: 0.8,                       // 구름 양
      berg: 1.0,                        // 빙산·유빙 밀도 (찬 바다에서만)
      abyss: [0.018, 0.12, 0.22],       // 가장 깊은 바다 색 — 짙은 남청색 안에서도 청록 기운이 죽지 않게 한다
      rough: 0.56,                      // 먼바다일수록 거칠어지는 정도 (물결 높이·물마루 그늘·흰 물마루). 0이면 예전처럼 어디나 같다
      flow: 0.74,                       // 큰 너울을 따라 흐르는 넓은 청록 명암 (0이면 끔)
      ripple: 0.52,                     // 가까이서만 보이는 잔물결 법선의 세기
      crest: 0.56                       // 배경 물마루 선의 세기 — 흰 반달 조각 대신 얇고 끊어진 선으로만 보인다
    },
    landSea: {            // 육상 탐험 중 화면 속 바다를 오가는 배 (js/systems/landsea.js — 그림만, 마주침 없음)
      on: true,
      max: 5,             // 화면 속 바다에 함께 보이는 배(탐험 함대 빼고) 최대
      every: 0.35,        // 이만큼 날이 흐를 때마다 새 배가 들어올 수 있다
      near: 8,            // 경쟁자의 탐험 함대가 이 거리(°) 안이면 보인다
      life: [5, 12],      // 한 배가 머무는 날
      idle: 0.012,        // 탐험대가 멈춰 있을 때도 미끄러지는 빠르기 (배 빠르기 × 이 값 °/초)
      size: 0.9,          // 그림 크기 (바다의 다른 배 크기 × 이 값)
      pirate: 0.12, navy: 0.18   // 해적·함대가 나올 몫 (나머지는 상선)
    },
    ship: {
      accel: 0.32,        // 출발할 때 목표 속력의 63%에 이르는 시간 (d)
      decel: 0.7,         // 돛을 거두었을 때 속력이 37%로 줄어드는 시간 (d)
      lateral: 0.20,      // 옆으로 미끄러지는 속도가 37%로 줄어드는 시간 (d) — 클수록 선회 때 더 미끄러진다
      maxDrift: 0.42,     // 선수 방향과 진행 방향의 최대 차이 (rad, 약 24°)
      stopSpeed: 0.03,    // 이보다 느리면 멈춘 것으로 친다 (°/d)
      arriveSlow: 0.3,    // 목적지 이만큼(°) 안에서 속력을 줄인다
      portApproach: 2.0,  // 항구를 눌러 가는 길: 그 항구가 이만큼(°) 안이면 지그재그 없이 곧장 붙는다 (다가가는 빠르기는 같다). 0이면 끔
      openReach: 0.6,     // 설정 「맞바람 지그재그 — 먼바다에서만」: 두 다리 쪽 모두 이만큼(°)까지 바다여야 지그재그를 한다
      heave: 1.0, pitch: 1.0, roll: 1.0,  // 상하·앞뒤·좌우 흔들림 크기
      camLead: 0.22,      // 카메라가 진행 방향으로 앞서 보여 주는 정도 (속력 1°/d 당 °, 최대 0.3°)
      camCatch: 4,        // 카메라: 배를 그대로 따라가고, 어긋난 만큼(앞서 보기가 바뀔 때 등)만 이 빠르기(1/초)로 좁힌다
      zoomEase: 12,       // 확대·축소가 목표에 다가가는 빠르기 (1/초) — 휠 한 칸이 한 번에 뛰지 않고 부드럽게
      zoom: {
        min: 26, max: 2400, reference: 110, navigationMax: 420, // 새 확대 구간에서도 기존 해안 판정 크기 유지
        power: 0.55, minScale: 0.45, maxScale: 5.5, // 지도와 함께 커지는 배 그림 — 충돌 크기와 별개
        fleetGap: 2.2,     // 가장 가까이 볼 때 동행선 사이 간격 배수
        leadMaxPx: 90      // 확대해도 카메라가 기함보다 너무 앞서가지 않게
      },
      refSpeed: 1.1,      // 물보라 세기를 셀 때의 기준 속력 (°/d)
      size: 66,           // 기함 그림 길이 (px, 2026-10 0.7배로 줄임 — 전 95) — 항적·물보라·선체의 물도 이 크기에 맞춘다
      followSize: 53,     // 따르는 배 (0.7배, 전 76)
      npcSize: 38,        // 다른 나라 배·해적선 (0.7배, 전 54 — 조종하는 배가 먼저 눈에 들어오게)
      side: {             // 지도 위의 배를 옆모습으로 (js/scenes/sea.js sideView) — on: false 면 예전처럼 진행 방향으로 돈다
        on: false,        // 8방향 시트가 실제 진로를 보여 준다
        tilt: 20,         // 위·아래(북·남)로 갈 때 뱃머리를 드는·숙이는 가장 큰 각도 (°)
        hold: 0.2,        // 좌우가 바뀌는 경계: 진로의 동서 성분(cos)이 반대쪽으로 이만큼 넘어가야 돌아선다
        flipSec: 0.35     // 좌우로 돌아서는 데 걸리는 시간 (초)
      }
    },
    wake: {
      spacing: 0.012,     // 항적 점 간격 (°)
      life: 3.0,          // 항적이 남는 시간 (d) — 가는 선이 길게 이어졌다 서서히 물빛에 섞인다
      spread: 0.31,       // 선미 V자 파문이 옆으로 퍼지는 빠르기 (배 속력에 대한 비, 켈빈 파 ≈ 0.35)
      foamWidth: 0.34,    // 가운데 거품 물길의 처음 폭 (선체 폭에 대한 비)
      foamGrow: 0.82,     // 가운데 물길이 퍼지는 빠르기 (선체 폭/d)
      alpha: 0.72,        // V자 파문과 가운데 포말의 전체 진하기
      bubbles: 0.7,       // 가운데 물길에서 흩어지는 작은 거품 양
      maxPoints: 420
    },
    party: {              // 육상 탐험대 모형 (js/art/party.js) — 지원 동물의 속력·피로 수치는 js/data/mounts.js
      size: 1.3,          // 크기 (1 = 사람 키 약 34px — 1.3이면 사람 44px, 말 탄 대원 약 70px: 예전 탐험대의 약 2.5배)
      spacing: 1.0,       // 줄 선 대원 사이 간격
      dust: 1.0,          // 발밑 먼지·눈보라·풀잎의 양
      maxStepHz: 2.2      // 걸음이 이보다 빨라지지 않는다 (초당 걸음 주기) — 빨리 가도 장난감처럼 종종거리지 않게
    },
    seaMonster: {        // 해상 괴물의 행 전환. 초 단위이며 전투 규칙을 바꾸지 않는다.
      actions: {
        idle: { frames: [0, 1, 0], seconds: 2.4, loop: true },
        swim: { frames: [0, 1, 0], seconds: 0.9, loop: true },
        attack: { frames: [0, 2, 0], seconds: 1.0, loop: false },
        dive: { frames: [0, 3, 4], seconds: 1.6, loop: false },
        submerged: { frames: [4], seconds: 1, loop: true },
        emerge: { frames: [4, 5, 0], seconds: 1.6, loop: false }
      }
    },
    galleon3d: {           // 항해 기함 갤리온 한 척의 실시간 3D 시제품
      enabled: true,      // false면 기존 8방향 그림. 규칙·저장 파일과 무관하다
      span: 256, anchorY: 164, baseLen: 158, elevation: 0.52,
      minBuffer: 256, maxBuffer: 1280, supersample: 2, // 기본 크기도 더 촘촘하게 그린 뒤 줄인다
      shadows: true, shadowSize: 512, shadowMinLen: 48, // 기본 기함·동행선에도 망루·난간의 자체 그림자
      exposure: 1.22, sunLight: 1.65, skyLight: 0.9, rimLight: 0.35,
      waterline: 0.65, heave: 65,
      maxBrace: 0.75, billRate: 1.3, billPulse: 0.045,
      flutterRate: 7.5, flutter: 0.75, foldHeight: 0.045, foldDepth: 0.65,
      sailFoot: 2.3, sailLeech: 0.035, sailCrease: 0.22, // 돛 아랫자락·옆선·당겨진 주름
      flagLength: 13, flagHeight: 5.5, flagRate: 6, flagWave: 1.3,
      art: {              // 갤리온 전용 색·표면 깊이. 바꾸면 장면에 재진입할 때 반영된다.
        hull: '#73482e', deck: '#ac8956', inner: '#88613b', wales: '#302319',
        paint: '#24484c', mast: '#68462d', rope: '#4c3e29', sail: '#e8ddc1',
        woodRelief: 0.13, clothRelief: 0.07
      }
    },
    sprite: {             // 8방향 동작 배 그림 시트 (js/art/shipsprite.js, images/ships-nav/)
      halfBelow: 0.55,    // 화면에 그리는 배율(장치 픽셀 기준)이 이보다 작으면 반 크기 사본을 쓴다 — 0이면 늘 원본
      hold: 0.12,         // 방위 칸이 바뀌는 경계에서 먼저 쓰던 칸을 칸 폭의 이만큼 더 붙잡는다 (뱃머리가 흔들려도 깜박이지 않게)
      blend: 0.02,        // 배 이름(sid)이 없을 때 경계 바로 앞 이 폭(칸 폭 대비)만 두 칸을 겹친다
      fade: 0.14,         // 배 이름이 있을 때: 칸이 바뀌면 앞 칸 위에 새 칸을 이 초 동안 서서히 올린다 (0이면 바로 바뀜)
      dashAt: 0.72,       // 기준 속력 대비 이 값부터 질주 동작
      fps: { idle: 2.2, drift: 4.0, dash: 11.5 },
      keep: 12,           // 풀어 둘 배 시트 수 (한 장 약 25~31MB). 넘으면 오래 안 쓴 것부터 놓아 준다 — 그림 장치 메모리 보호
      keepSec: 20         // 이 초 안에 쓴 시트는 수가 넘어도 놓지 않는다
    },
    img: {                // 그림 읽기 (js/core/images.js) — 해상도는 건드리지 않고, 못 받거나 늦게 오는 그림을 다룬다
      tries: 3,           // 한 그림(또는 묶음)을 몇 번까지 다시 받아 보나
      retryMs: [400, 1500], // 다시 받기 전 쉬는 시간 (ms)
      stallMs: 45000,     // 이만큼 소식이 없으면 끊고 다시 받는다
      failHold: 20000,    // 끝내 못 받은 그림은 이 시간(ms) 동안만 코드 그림으로 대신하고, 그 뒤 다시 받아 본다
      waitMs: 12000,      // 장면(도시·건물 안·발견)이 그림을 기다리는 가장 긴 시간 — 넘기면 먼저 뜨고 그림은 오는 대로 채운다
      slowMs: 500,        // 기다림이 이보다 길어지면 「그림을 불러오는 중」 표시
      keep: 900,          // 읽어 둔 그림을 이 장수까지 쥐고 있는다 — 넘으면 오래 안 쓴 것부터 놓아 준다(다음에 쓸 때 다시 읽음)
      decodeMs: 1200,     // 받은 그림을 미리 풀어 두기(decode)를 기다리는 가장 긴 시간
      graceMs: 8000       // 배·부대·사람 그림을 받는 동안 코드 그림 대신 비워 두는 가장 긴 시간
    },
    portraitFace: {       // 작은 얼굴상: 머리카락·모자 대신 눈과 입을 가운데에 맞춘다
      deadZone: 0.055,    // 이 정도의 작은 가로 차이는 원래 구도를 유지
      maxShift: 0.25,     // 한 번에 옮길 수 있는 그림 너비 비율
      minFaceWidth: 0.18, // 무릎상·전신상이 임시로 쓰인 경우는 보정하지 않는다
      bg: '#1a120c'
    },
    dialogue: {           // 대화 인물 2.5D 리그 (js/art/portrait_rig.js)
      breath: 1.0,        // 호흡에 따른 상체 움직임
      sway: 1.0,          // 듣고 있을 때의 고개·몸 기울기
      talk: 1.0,          // 말할 때의 고개 반응
      blinkMin: 2800,     // 눈을 감았다 뜨기까지 가장 짧은 틈 (ms)
      blinkMax: 6200      // 가장 긴 틈 (ms)
    },
    stand: {              // 대화창 위에 서는 인물 (js/ui/ui.js dialogShell) — 무대 1600×900 기준 px
      top: 60,            // 그림 꼭대기가 내려올 수 있는 가장 높은 곳 (HUD 54px 아래)
      sink: 6,            // 그림 아랫단이 대화창 윗변 아래로 들어가는 깊이 (발밑이 떠 보이지 않게)
      aspect: 0.6667,     // 무릎상 가로÷세로 (1024×1536)
      minH: 360, maxH: 640, // 무릎상 높이 범위
      fitMax: 1.2,        // 두 사람이 마주 설 때 머리끝을 맞추려고 키울 수 있는 배수 (그림마다 머리 위 빈칸이 다르다 — 기본 제독 그림은 13%)
      bustW: 260, bustH: 260, // 무릎상이 없는 사람의 흉상 크기
      soloCity: true      // 혼자 말하는 사람(집사·상인·여관 주인…)은 도시 안에서만 대화창 가운데에 세운다 (바다에서는 예전 흉상 창)
    },
    battle: {             // 해전 (px·초 단위 — 해전 화면 1px ≈ 선체 길이의 1/120)
      accel: 1.6,         // 속력이 붙는 시간 (초)
      decel: 2.4,         // 속력이 줄어드는 시간 (초)
      lateral: 0.45,      // 옆 미끄러짐이 37%로 줄어드는 시간 (초)
      day: 3.0,           // 물보라의 '하루' = 3초 (바다 장면의 항적·물보라 수치를 그대로 쓰기 위한 환산)
      ref: 105,           // 물보라 세기 기준 속력 (px/하루 — 보통 배 속력 35px/초)
      wakeLife: 2.2,      // 항적이 남는 시간 (하루 — 약 6.6초)
      wakeSpacing: 5      // 항적 점 간격 (px)
    },
    impact: {             // 해전의 타격감 (초·px) — 히트스톱(잠깐 멈춤)·화면 흔들림·번쩍임·백병전 넉백. 설정 「화면 흔들림·번쩍임」을 끄면 흔들림과 번쩍임만 빠진다
      hitstop: 0.07,      // 우리 포탄이 적선에 맞았을 때 멈춤 (피해가 크면 최대 1.8배)
      hitstopTaken: 0.05, // 우리 배가 맞았을 때
      hitstopSink: 0.3,   // 배가 부서져 가라앉을 때·백병전으로 빼앗을 때
      hitstopRam: 0.12,   // 들이받았을 때
      hitstopCool: 0.12,  // 한 번 멈춘 뒤 다음 멈춤까지 쉬는 틈 (한 현측의 포탄이 연달아 맞아도 한 번만)
      shakeFire: 1.5,     // 우리 배가 한 현측을 쏠 때 (반동)
      shakeHit: 5,        // 적선에 맞았을 때
      shakeTaken: 8,      // 우리 배가 맞았을 때
      shakeSink: 16,      // 침몰·나포
      shakeClash: 11,     // 백병전이 시작될 때 (배끼리 부딪힘)
      shakeRound: 5,      // 백병전 한 판마다
      shakeDecay: 9,      // 흔들림이 줄어드는 빠르기 (1/초)
      flashFire: 0.04,    // 번쩍임 세기 (0~1, 화면 전체)
      flashHit: 0.1,
      flashTaken: 0.16,   // 우리 배가 맞으면 붉은빛
      flashSink: 0.42,
      flashClash: 0.32,
      flashRound: 0.12,
      flashDecay: 9,
      shipFlash: 0.12,    // 맞은 배가 하얗게 번쩍이는 시간 (초)
      recoil: 4,          // 맞은 배가 포탄 방향으로 밀리는 거리 (px, 보이는 흔들림)
      knock: 14,          // 백병전 한 판마다 밀린 쪽이 물러나는 거리 (px)
      knockApart: 34,     // 백병전이 끝나고 두 배가 떨어지는 속력 (px/초)
      roundDelay: 0.26,   // 백병전 한 판을 보여 주는 시간 (초)
      numbers: true,      // 피해 숫자 (포탄이 선체에 준 피해 −N, 쓰러진 선원 수) — 한 현측의 포탄은 한 숫자로 합친다
      debris: 12,         // 명중 때 튀는 나뭇조각 수
      sparks: 9,          // 명중 때 튀는 불티 수
      ballArc: 24,        // 포탄이 날아가는 궤적의 높이 (px)
      zoomHit: 0.015,     // 큰 명중 때 화면이 살짝 다가오는 정도 (배율)
      zoomSink: 0.05,     // 침몰·나포 때
      burnAt: 0.55,       // 내구가 이만큼 아래로 떨어진 배는 검은 연기를 뿜는다
      fireAt: 0.3         // 이만큼 아래면 불길이 보인다
    },
    duel: {               // 일기토 스프라이트와 타격감 (js/games/duel.js)
      spriteSize: 230,    // 256px 셀을 화면에 그리는 크기
      idleFrame: 0,       // 대기할 때 행동 줄의 안정된 전투 자세 한 장을 쓴다(프레임 순환은 고개가 까닥여 보임)
      breathRate: 1.35,   // 대기 호흡 속도(rad/초, 한 번 약 4.7초)
      breathScale: 0.0018,// 발을 고정한 채 몸이 숨에 따라 아주 조금 늘어나는 정도
      shakeX: 10,         // 흔들림 가로 최대 거리(px, shakeT=1)
      shakeY: 6,          // 흔들림 세로 최대 거리
      shakeHit: 0.25,     // 보통 명중 때 더하는 흔들림
      shakeBig: 0.6,      // 치명타·큰 공격
      shakeDecay: 2.5,    // 흔들림이 줄어드는 빠르기(1/초)
      flashHit: 0.10,     // 적 명중 때 화면 번쩍임
      flashTaken: 0.16,   // 아군 피격 때 붉은 번쩍임
      flashBig: 0.25,     // 큰 공격의 번쩍임 하한
      flashDecay: 6,      // 번쩍임이 줄어드는 빠르기(1/초)
      hitMs: 220,         // 보통 피격: 발을 딛고 잠깐 움찔한 뒤 복귀
      hitLean: 0.045,     // 피격 순간 상체가 뒤로 젖혀지는 정도
      downMs: [100, 380, 500, 280], // 마지막 타격 → 무릎 굽힘 → 천천히 넘어짐 → 바닥에서 멈춤
      downAngle: 1.45,    // 주저앉은 몸이 뒤로 기우는 각도(rad)
      downNarrow: 0.3,    // 옆으로 누우면서 굽힌 다리를 펴는 폭
      downSink: 0.18,     // 무릎을 굽힐 때 몸이 낮아지는 비율
      downBlend: 0.35,    // 넘어짐 중 누운 그림으로 이어지기 시작하는 지점
      downHoldMs: 280,    // 결과창을 닫기 전 바닥에 누운 자세를 보여 주는 시간
      knockback: 8,       // 보통 피격자가 살짝 밀리는 거리(px)
      downKnockback: 20,  // 마지막 일격의 반동
      knockReturnMs: 260, // 제자리로 돌아오기 시작하는 때
      hitParticles: 10,   // 명중점에서 튀는 작은 파편 수
      particleLife: 0.42  // 파편이 남는 시간(초)
    },
    ride: {               // 배가 보이는 파도를 탄다 (js/world/waves.js — 셰이더와 같은 파도 식으로 선체 위 다섯 점의 높이를 잰다)
      on: true,           // 끄면 예전처럼 사인 곡선으로만 흔들린다
      sea: { roll: 0.18, pitch: 0.10, heave: 0.56, chop: 0.13 },       // 항해 지도: 물 기울기·높이 → 흔들림 (바람 0.5에서 좌우 약 ±0.05, 앞뒤 ±0.025)
      battle: { roll: 0.93, pitch: 0.66, heave: 0.33, chop: 0.23 },   // 해전 바다 (chop = 배 가운데 한 점의 잔물결 기울기를 섞는 비율 — 긴 너울의 느린 흔들림 위의 잔 흔들림)
      follow: 0.9,        // 따르는 배는 제 자리의 파도를 탄다 (1 = 기함과 같은 세기)
      storm: 1.6,         // 폭풍이면 이만큼 더
      maxRoll: 0.22, maxPitch: 0.09, maxHeave: 0.05,
      rollW: 2.1, rollZ: 0.22,     // 좌우 흔들림의 고유 진동(rad/초)과 감쇠 — 감쇠가 작으면 한 번 기울면 몇 번 되흔들린다
      pitchW: 3.0, pitchZ: 0.45,   // 앞뒤 (좌우보다 빠르고 금방 멎는다)
      heaveW: 2.6, heaveZ: 0.55,   // 오르내림
      slam: 0.10,         // 선수가 파도에 박히는 판정 (앞뒤 기울기가 내려가는 빠르기, /초) — 넘으면 선수 물보라가 크게 튄다
      slamCool: 0.7,      // 물보라 뒤 쉬는 시간 (초)
      slamSpray: 1.28,    // 파도를 찍을 때는 짧고 시원하게 크게 튄다
      luffFrom: 2.25, luffTo: 2.7, // 겉바람이 선수에서 이 각(rad, 뒤=0·정면=π) 사이로 들어오면 돛이 펄럭이기 시작해 다 펄럭인다
      rigRate: 1.6,       // 활대·삼각돛이 바람을 따라 돌아가는 빠르기 (1/초)
      windScale: 1.6,     // 참바람 세기(0~1)를 배 속력과 같은 척도로 (겉바람 = 참바람×이 값 − 배 속력/기준 속력)
      flag: 1.0           // 돛대 위 긴 깃발 크기 (0이면 없음)
    },
    spray: {
      bow: 1.08,          // 선수 물보라 — 항적보다 강하게, 배에 붙여 과장한다
      side: 0.72,         // 선측 물살(접촉 포말)
      stern: 0.72,        // 선미 거품
      turn: 0.94,         // 선회 때 바깥쪽 물보라
      maxParticles: 700,
      size: 0.84          // 물방울은 키우되 수명·궤적으로 덩어리화를 피한다
    }
  };
  // 항해 효과 스프라이트 (js/scenes/voyagefx.js · images/effects/ship_spray.png·departure_gull.png)
  G.FX.voyage = {
    spray: true,         // 배가 속력을 낼 때 선수 양옆 물보라
    accelFrom: 0.35,     // 이 가속(°/일²)부터 보이기 시작해 (출발할 때 약 2.5, 순풍으로 돌 때 0.5~1)
    accelFull: 1.8,      // 이 가속에서 가장 세다
    sprayScale: 0.90,    // 물보라 한 장의 너비 = 배 그림 길이 × 이 값
    sprayFrameMs: 80,    // 한 프레임 (그림 설명: 70~90ms)
    sprayFollow: 0.6,    // 따르는 배는 이만큼
    sprayAlpha: 0.78,
    burstFrom: 0.55,     // 세기가 이 값을 넘어서는 순간 한 번 크게 튄다
    burstCool: 2.5,      // 크게 튄 뒤 쉬는 시간(초)
    burstScale: 1.18,
    sendoffMonths: 3,    // 모항 출항 배웅: 지난번 모항 출항에서 이만큼(달)이 지나야 (처음 출항 포함)
    gulls: 9,            // 배웅하는 갈매기 수
    gullFrameMs: 95,     // 날갯짓 한 프레임 (그림 설명: 85~110ms)
    gullSize: 0.62,      // 갈매기 한 마리 = 배 그림 길이 × 이 값 (가까이 올수록 커진다)
    sendoffSec: 7.5,     // 배웅이 이어지는 시간(초)
    title: true          // 「모항 ○○을 떠나다」 글귀
  };
  // 양피지 해도: 실제 탐사한 범위만 단계별로 드러낸다.
  G.FX.chart = {
    viewPadding: 4, viewMinSpan: 48,
    wear: { foldAlpha: .07, foldLight: .16, foldWidth: 3, edgeStep: 8, edgeDepth: 7,
      backing: '#665038', edgeInk: 'rgba(86,54,25,.55)', tearLength: 38, tearWidth: 3, dripLength: 25, inkAlpha: .19 },
    paper: [226, 208, 163], land: [211, 190, 139], sea: [143, 170, 162], ink: [105, 78, 42], river: [79, 129, 139],
    grain: 5, stain: 20, fineCoast: 0.2, riverWidth: 0.7, relief: 24, edgeFade: 12, edgeRagged: 6,
    detailMinStep: 0.3, detailGap: 28, mountainSize: 7, mountainFrom: 0.56, treeSize: 4,
    mountainInk: 'rgba(91,66,37,.68)', forestInk: 'rgba(61,91,58,.50)', gridInk: 'rgba(100,72,39,.18)', rhumbInk: 'rgba(103,72,37,.12)',
    terrainColors: [[143,170,162], [173,183,128], [191,187,131], [133,158,113], [114,147,105], [218,193,133], [170,154,119], [220,219,198], [181,186,164], [230,230,211]],
    motifs: ['kraken', 'dragon', 'compass', 'edge', 'eldorado', 'sevencities', 'fountain', 'magnetic', 'maelstrom', 'whaleisland', 'roclegend', 'presterjohn', 'treasureisle', 'ghostship'],
    motifGrid: { lon: -165, lat: -60, cols: 9, rows: 5, lonStep: 40, latStep: 30 },
    motifMinCanvas: 500, motifWorldSize: 20, motifMinSize: 115, motifMaxSize: 250, motifAlpha: 0.48
  };
  // 조류 무리: 4열×2행 시트, 각 개체가 다른 간격·날갯짓으로 지나간다.
  G.FX.birds = { count: 8, duration: 8, stagger: 1.2, spacing: 62, size: 100,
    countById: { phoenixw: 1, phoenix: 1, flamingo: 32, crane: 24, bncrane: 24, stork: 24, mallard: 24,
      sacredibis: 24, ploverbird: 24, albatross: 16, frigatebird: 16, snowyowl: 16 },
    runCount: [1, 2], largeColumns: 6,
    frameMs: 105, travel: 1000, height: 120, arc: 130, groundOffset: 35, fade: 0.7,
    groundStep: 0.025, groundSteps: 100, groundSpacing: 0.24, surfaceSearch: 2, surfaceAngles: 16,
    coastSearch: 12, coastSearchStep: 0.15, coastBisect: 16, shoreSpacing: 0.07, shoreWalk: 0.45,
    entryWalk: 0.30, entryDive: 0.12, diveHeight: 24, splashSize: 22,
    frameById: { hummingbird: 45, albatross: 150, condor: 155, roc: 160, crane: 135, flamingo: 135 },
    sizeById: { hummingbird: 0.6, vinousbird: 0.65, budgie: 0.7, ploverbird: 0.7, kiwi: 0.75, roc: 1.4, phoenix: 1.3, condor: 1.2, albatross: 1.2 } };
  // 나비·나방: 조류보다 작게, 무리·개체마다 등장과 퇴장 시점을 달리한다.
  G.FX.butterflies = { count: [30, 60], duration: 11, stagger: 2.4, life: [7, 11], size: 32,
    frameMs: 75, height: 110, scale: [0.65, 1.1], flap: [0.7, 1.4], fadeRange: [0.35, 0.85],
    spreadX: [-330, 270], spreadY: [-140, 100], drift: [-25, 45], rise: [4, 15],
    swayX: [12, 35], swayY: [14, 45], frequency: [1.1, 2.8], swayRatio: 0.73, tilt: 0.25 };
  // 그린 스프라이트 시트 (js/art/sprites.js · images/sprites/ — tools/sprite_repack.py 가 만든다)
  G.FX.sprites = {
    party: true,         // 육상 탐험대를 8방향 그림 시트로 (탈것마다 천천히·빨리 두 장 — 시트가 없는 탈것은 코드 그림)
    partyScale: 0.95,    // 탐험대 그림 배율 × G.FX.party.size (시트에서 세 사람 무리의 키가 약 50px)
    partyCycle: 1,       // 걸음 주기 하나에 넘기는 시트 한 바퀴의 수
    partyFastPx: 70,     // 화면에서 초당 이만큼(px) 넘게 움직이면 뛰기·질주 장면
    partyFps: { on_foot_walk: 9, on_foot_run: 11, mounted_walk: 9, mounted_gallop: 9 },
    expedition: {       // 새 탐험대 시트: 거리로 보행, 최단 방향으로 회전, 야영 중 쉬는 모습
      enabled: true, turnRate: 4.8, turnEpsilon: 0.015, maxDelta: 0.1,
      previewHz: 1.1, campFps: 7,
      // 제독의 기준 키. 앉은 자세는 원본별 인물 비율로 보정한다.
      // 탈것 전체 높이를 같게 맞추지 않으므로 코끼리는 자연히 크게 보인다.
      admiralHeight: 52,
      formation: {      // 선장·좌우 동료·후미의 다이아 편대. [뒤쪽 간격, 좌우 폭] (화면 px × 탐험대 크기)
        enabled: true, maxMembers: 4, lateralY: 0.72, turnRate: 4.8,
        groundMinGap: 20, groundAngles: 24, groundRadii: [1, 0.85, 0.7, 0.55, 0.4, 0.25, 0.1],
        phaseOffsets: [0, 0.21, 0.48, 0.73],
        tracks: {      // 대원마다 구두·발굽·발바닥과 바퀴·썰매 자국을 구분한다.
          enabled: true, life: 45, maxMarks: 1600, opacity: 0.36, groundSquash: 0.7,
          humanWidth: 2.8, animalWidth: 3.6, animalStride: 5.5,
          packAnimalSide: 7, packHumanSide: 10, draftForward: 22, cartBack: 12, rutWidth: 10,
          wheelLine: 1.5, runnerLine: 1.1,
          colors: { soil: '#3c2c1d', sand: '#79542e', snow: '#536978' },
          spacing: { foot: 10, porter: 10, horse: 14, camel: 17, camel2: 17, donkey: 12,
            llama: 12, yak: 13, wagon: 11, oxwagon: 11, elephant: 19, reindeer: 11 }
        },
        follow: {       // 자리로 옮겨 붙이지 않고 각 대원이 제독의 지나온 길을 쫓는다.
          maxDelta: 0.1, teleportPx: 120, trailStep: 0.7, trailPoints: 600,
          backSlots: [0, 1, 1.3, 2.15], lineSlots: [0, 1, 2, 3], sideSlots: [0, -0.8, 0.8, 0],
          bendAngle: 1.3, closeRate: 4.5, openRate: 0.75,
          stopDistance: 2.5, arrivalSeconds: 0.3, minSpeed: 22, catchup: 1.32, catchupExtra: 12,
          acceleration: 210, turnRate: 4.1, speedSmooth: 6,
          separation: 18, separationGap: 0.42, separationWeight: 0.9,
          groundStep: 7, lookAhead: 32,
          strides: { foot: 20, porter: 20, horse: 40, camel: 46, camel2: 46, donkey: 22,
            llama: 24, yak: 30, wagon: 34, oxwagon: 34, elephant: 50, reindeer: 36 }
        },
        gaps: { walk: [44, 34], porter: [48, 38], horse: [64, 56], camel: [72, 62],
          donkey: [60, 50], llama: [60, 50], yak: [64, 56], wagon: [100, 86], elephant: [100, 88], reindeer: [94, 80] }
      }
    },
    battle: true,        // 육상전 부대를 그림 시트로
    unitH: 56,           // 육상전 병사 몸 키(px, 1000×430 판 기준 — 치켜든 무기는 빼고) · 짐승은 beastH
    beastH: 40,
    mountH: { '말': 76, '낙타': 80, '코끼리': 98 },       // 기병은 탈것까지 포함해 병사보다 크게
    mountN: { '말': 2, '낙타': 2, '코끼리': 1 },          // 한 부대를 그릴 때 겹치는 기수 수
    mountGap: { '말': 58, '낙타': 62, '코끼리': 78 },     // 여러 기수를 나란히 놓는 간격
    sheetK: { natives: 1.3 },   // 시트마다 덧붙이는 배율 — 원주민 주술 전사는 머리 위로 늘 지팡이가 솟아 몸이 작게 재진다
    battleFps: { idle: 5, walk: 10, attack: 12, hurt: 8, dead: 6 },
    events: true,        // 항해·육상 탐험 사건 그림 (js/art/eventfx.js)
    eventFrame: false,   // true 면 나무틀 안에 그린 하늘·바다 배경과 함께, false 면 틀·배경 없이 항해·탐험 화면 위에 그림만
    eventW: 640,         // 사건 그림 창 안쪽 크기(1600×900 화면 기준, 나무틀 10px 은 따로)
    eventH: 280,
    eventBottom: 205     // 창 아래 끝이 화면 아래에서 이만큼 위 (대화창 바로 위)
  };
  // 자연재해 그림창 (js/art/disasterfx.js): 크기·위치는 사건 그림과 같게, shake = 지진 때 화면이 흔들리는 초
  G.FX.disaster = { on: true, w: 640, h: 280, bottom: 205, shake: 1.6 };
  // 거리를 걷는 마을 사람 (js/systems/streetfolk.js · 그림 js/art/streetfolk.js): 거리에 나올 때마다 min~max명,
  //   걷는 빠르기 speed(짐승 animalSpeed) px/초, 멈춰 쉬는 시간 idle초, 바닥선 아래 깊이 depth px(멀수록 작게 scale), 말을 걸 때 제독이 서는 거리 talkGap px
  //   fps: 거리 사람만 움직일 때 거리를 다시 그리는 횟수(초당) — 낮출수록 가볍다 · imgH: 걷는 그림(380×444 한 장)을 그리는 높이 px (제독 178)
  G.FX.streetFolk = { min: 3, max: 4, speed: [38, 72], animalSpeed: [70, 130], idle: [1.2, 4.5], depth: [12, 52], scale: [1.02, 1.16], talkGap: 100, fps: 60, imgH: 158 };
  // 제독이 거리의 건물 문으로 들어가는 연출 (js/scenes/town.js): sec 전체 시간,
  // rise 문턱까지 올라가는 높이의 상한 px (실제로는 그 건물 문턱 높이만큼 — js/data/exteriordoors.js), scale 마지막 크기 비율, fadeAt 이 진행도부터 사라진다.
  G.FX.townHeroEnter = { sec: 0.62, rise: 70, scale: 0.66, fadeAt: 0.5 };
  // 거리에서 멈춘 제독의 아주 약한 호흡. 발밑은 고정하고 세로 길이만 1픽셀 안팎으로 바꾼다.
  G.FX.townHeroIdle = { fps: 12, sec: 2.4, scaleY: 0.004 };
  // 제독 달리기 아틀라스(49칸에 약 4걸음)를 넘기는 빠르기 칸/초 — 62면 한 걸음이 0.19초쯤 (js/scenes/town.js)
  G.FX.heroRun = { fps: 62 };
  // 해전 물보라: 4×2칸, 각 256px. 크기는 해전 화면의 기준 px, 수명은 전투 초.
  G.FX.waterSplash = {
    on: true, cell: 256, cols: 4, frames: 8, anchor: [128, 176], max: 48,
    fadeIn: 0.035, fadeOut: 0.2, planeY: 0.62,
    opacity: 0.72, rippleOpacity: 0.12, rippleLine: 1.1, rippleParts: 5,
    rippleSpan: 0.4, rippleGrow: 0.7,
    alpha: { spray: 0.9, base: 0.28, edge: 0.05, sprayAt: 0.48, baseAt: 0.69, edgeAt: 0.85 },
    fallbackStart: 0.08, fallbackGrow: 0.28, fallbackLine: 4,
    wakeEvery: 0.24, attackGap: 0.08, shipScale: 0.012, minScale: 0.75, maxScale: 1.8,
    shake: { fire: 3.2, volley: 7, rush: 4.5, dive: 2.5, emerge: 6 },
    tremor: { fire: 3.8, volley: 5, rush: 3, dive: 1.5, emerge: 4, ram: 7 },
    types: {
      cannon: { name: '포탄 착수', life: 1.05, size: 100, under: false },
      hull: { name: '선체 피격', life: 0.75, size: 128, under: false, directional: true },
      volley: { name: '사방 분출', life: 1.25, size: 210, under: false },
      wake: { name: '돌진 물살', life: 0.85, size: 180, under: true, directional: true },
      ram: { name: '충돌 폭발', life: 1.1, size: 245, under: false, directional: true },
      dive: { name: '잠수 소용돌이', life: 1.6, size: 240, under: true },
      emerge: { name: '재등장 물기둥', life: 1.6, size: 255, under: false }
    }
  };
  // 승계 사건 샷: 실제 후계자·소꿉친구·선택한 노장의 무릎상을 새 배경에 함께 놓는다.
  G.FX.oldGuardShot = {
    visit: { oldX: 0.18, heirX: 0.47, friendX: 0.78, h: 1.04, y: 0.04 },
    join: { heirX: 0.27, friendX: 0.68, h: 1.04, y: 0.04 },
    arrange: { oldX: 0.32, heirX: 0.68, h: 1.04, y: 0.04 },
    aide: { heirX: 0.18, oldX: 0.40, mateX: [0.64, 0.84], h: 1.01, y: 0.05 },
    mourning: { heirX: 0.25, mateX: [0.56, 0.80], h: 1.02, y: 0.04 }
  };
  // 전 선종 렌더러. 기존 갤리온 비교 페이지도 같은 조정값을 사용한다.
  G.FX.ship3d = G.FX.galleon3d;
  Object.assign(G.FX.ship3d, {
    boundsPadding: 10, oarRate: 2.8, oarSweep: .42, oarLift: 3,
    sailRopeRadius: .19, reefRopeLength: 1.25, sailWrinkle: .32,
    idleModels: 3,            // 화면에서 사라진 선종은 최근 3종만 보관. 보이는 배는 같은 모형을 재사용한다.
    pirateSailTint: '#766c62' // 주변 해적선의 어두운 돛. 같은 선종의 아군 돛에는 적용하지 않는다.
  });
  // 거북선: 첨부 복원선 사진을 기준으로 한 미술 배치. 게임의 배 성능과 무관하다.
  G.FX.turtle3d = {
    mastX: [.20, -.18], sailHeight: [58, 52], sailWidth: [.76, .67],
    sailClearance: 4.5, sailYaw: Math.PI / 2, sailPanels: 8,
    roofStart: .06, roofEnd: .94, wallHeight: .62, roofRise: .46,
    dragonScale: 1.05
  };
  // 선종별 미술용 범장. [길이 방향 위치/L, 돛대 높이/L, 돛 형식, 층수, 폭/W].
  // sq 사각돛, lat 라틴돛, bat 정크돛, kr 조선 돛, jp 일본 사각돛, tanja 탄자돛.
  // 자료와 시대 선택 근거: docs/art/rig3d-references.md. 배 성능·저장 자료에는 적용하지 않는다.
  G.FX.shipRig = {
    clearance: 4, yardGap: 2, sailOffset: 1.1, sheetRadius: .12,
    deadeyeRadius: .52, blockRadius: .48, topRailPosts: 16,
    courseFoot: .10, topFoot: .055, leech: .075,
    bands: {
      1: [[.94, .06, 1, .93]],
      2: [[.60, .04, 1, .94], [.95, .69, .52, .88]],
      3: [[.51, .03, 1, .94], [.78, .59, .53, .84], [.96, .85, .32, .49]]
    },
    profiles: {
      barca: [[.04,.58,'sq',1,1.30]], cog: [[.02,.66,'sq',1,1.50]],
      hulk: [[.22,.69,'sq',2,1.45],[-.22,.53,'sq',1,1.05]],
      caravel: [[.20,.58,'lat',1,1.05],[-.24,.46,'lat',1,.85]],
      lcaravel: [[.29,.65,'sq',2,1.55],[0,.62,'lat',1,1.05],[-.29,.43,'lat',1,.75]],
      pinnace: [[.20,.67,'sq',2,1.65],[-.27,.49,'lat',1,.88]],
      carrack: [[.27,.70,'sq',2,1.60],[-.05,.80,'sq',2,1.80],[-.34,.53,'lat',1,.85]],
      lcarrack: [[.28,.73,'sq',2,1.63],[0,.84,'sq',2,1.82],[-.25,.56,'lat',1,.83],[-.40,.40,'lat',1,.58]],
      hcarrack: [[.28,.78,'sq',3,1.68],[0,.88,'sq',3,1.85],[-.25,.58,'lat',1,.85],[-.40,.42,'lat',1,.60]],
      galleon: [[.28,.70,'sq',2,1.65],[-.04,.80,'sq',2,1.85],[-.33,.54,'lat',1,.95]],
      lgalleon: [[.29,.77,'sq',3,1.68],[0,.88,'sq',3,1.90],[-.26,.57,'lat',1,.85],[-.41,.39,'lat',1,.58]],
      fluyt: [[.26,.69,'sq',2,1.48],[-.04,.79,'sq',2,1.65],[-.33,.52,'lat',1,.84]],
      frigate: [[.28,.75,'sq',3,1.83],[-.04,.85,'sq',3,2.0],[-.32,.58,'lat',1,1.05]],
      tartane: [[.06,.62,'lat',1,1.30]], galley: [[.12,.55,'lat',1,1.7]],
      greatgalley: [[.23,.58,'lat',1,1.55],[-.22,.70,'lat',1,1.85]],
      galleass: [[.28,.56,'lat',1,1.30],[-.03,.67,'lat',1,1.55],[-.34,.45,'lat',1,.95]],
      fusta: [[.12,.55,'lat',1,1.8]], xebec: [[.29,.54,'lat',1,1.7],[-.04,.63,'lat',1,1.95],[-.35,.41,'lat',1,1.15]],
      dhow: [[.15,.62,'lat',1,1.45],[-.29,.43,'lat',1,.87]],
      sambuk: [[.15,.63,'lat',1,1.5],[-.29,.44,'lat',1,.9]],
      baghlah: [[.13,.71,'lat',1,1.40],[-.30,.49,'lat',1,.85]],
      parau: [[.09,.54,'lat',1,2.0]],
      jong: [[.30,.59,'tanja',1,.64],[.07,.77,'tanja',1,.80],[-.18,.65,'tanja',1,.66],[-.39,.49,'tanja',1,.48]],
      korakora: [[.05,.49,'tanja',1,2.1]],
      junk: [[.24,.65,'bat',1,.70],[-.23,.54,'bat',1,.65]],
      shachuan: [[.30,.57,'bat',1,.65],[0,.72,'bat',1,.85],[-.31,.50,'bat',1,.62]],
      ljunk: [[.30,.62,'bat',1,.62],[0,.76,'bat',1,.79],[-.31,.53,'bat',1,.58]],
      baochuan: [[.33,.52,'bat',1,.43],[.17,.67,'bat',1,.51],[-.02,.78,'bat',1,.58],[-.22,.63,'bat',1,.48],[-.40,.45,'bat',1,.36]],
      maengseon: [[.22,.64,'kr',1,.85],[-.21,.54,'kr',1,.75]],
      panokseon: [[.24,.71,'kr',1,.86],[-.24,.63,'kr',1,.75]],
      geobukseon: [[.20,.65,'kr',1,.76],[-.18,.60,'kr',1,.67]],
      kobaya: [[.04,.60,'jp',1,1.45]], sekibune: [[.04,.65,'jp',1,1.25]],
      atakebune: [[.10,.77,'jp',1,1.10]], balsa: [[.08,.55,'sq',1,.86]]
    }
  };
  G.FX.shipArt = {
    families: {
      west: { hull: '#73482e', deck: '#ac8956', inner: '#88613b', wales: '#302319', paint: '#24484c', mast: '#68462d', rope: '#4c3e29', boltRope: '#9b8055', sail: '#e8ddc1', woodRelief: .13, clothRelief: .07 },
      galley: { hull: '#78432a', deck: '#ac8153', inner: '#93663c', paint: '#78322b', sail: '#e8d9b9' },
      dhow: { hull: '#8d5f38', deck: '#c09a62', inner: '#9e774d', paint: '#315e60', sail: '#e3d0aa' },
      jong: { hull: '#68432b', deck: '#a78650', inner: '#8a693b', paint: '#73432a', sail: '#c1a16a' },
      outrigger: { hull: '#916137', deck: '#b28b53', inner: '#a47e4b', paint: '#8f3e26', sail: '#c9ac74' },
      junk: { hull: '#6d4030', deck: '#a57848', inner: '#91633d', paint: '#833a2d', sail: '#c49c63' },
      korean: { hull: '#795737', deck: '#b58e5c', inner: '#947046', paint: '#3e6861', sail: '#e2d3ad' },
      japanese: { hull: '#55402d', deck: '#a68a61', inner: '#80643e', paint: '#302c27', sail: '#e7dcc3' },
      raft: { hull: '#997140', deck: '#c09c5e', inner: '#ac8649', paint: '#70502c', sail: '#c6ad7d' }
    },
    profiles: {
      barca: { family: 'west', paint: '#41565c', kit: 'open', cargo: 1 },
      cog: { family: 'west', paint: '#823d2d', kit: 'merchant', cargo: 3 },
      hulk: { family: 'west', paint: '#534638', kit: 'merchant', cargo: 4 },
      caravel: { family: 'west', paint: '#81533a', kit: 'explorer', cargo: 2 },
      lcaravel: { family: 'west', paint: '#6c4131', kit: 'explorer', cargo: 2 },
      pinnace: { family: 'west', paint: '#355e63', kit: 'open', cargo: 1 },
      carrack: { family: 'west', paint: '#8a3e32', kit: 'castle', cargo: 3 },
      lcarrack: { family: 'west', paint: '#31545e', kit: 'castle', cargo: 4 },
      hcarrack: { family: 'west', paint: '#66342e', kit: 'castle', cargo: 4 },
      galleon: { family: 'west', paint: '#24484c', kit: 'galleon', cargo: 3 },
      lgalleon: { family: 'west', paint: '#233c55', kit: 'gallery', cargo: 3 },
      fluyt: { family: 'west', paint: '#3f6555', kit: 'merchant', cargo: 5 },
      frigate: { family: 'west', paint: '#303c48', kit: 'gallery', cargo: 1 },
      tartane: { family: 'west', paint: '#566c70', kit: 'open', cargo: 2 },
      galley: { family: 'galley', kit: 'oared', cargo: 0 },
      greatgalley: { family: 'galley', paint: '#643249', kit: 'oared', cargo: 2 },
      galleass: { family: 'galley', paint: '#315658', kit: 'oared', cargo: 1 },
      fusta: { family: 'galley', paint: '#654832', kit: 'oared', cargo: 0 },
      xebec: { family: 'galley', paint: '#38564c', kit: 'oared', cargo: 1 },
      dhow: { family: 'dhow', kit: 'sewn', cargo: 3 },
      sambuk: { family: 'dhow', paint: '#656f68', kit: 'sewn', cargo: 2 },
      baghlah: { family: 'dhow', paint: '#346369', kit: 'sewn', cargo: 4 },
      parau: { family: 'galley', hull: '#8e613a', paint: '#715136', kit: 'oared', cargo: 0 },
      jong: { family: 'jong', kit: 'woven', cargo: 4 },
      korakora: { family: 'outrigger', kit: 'lashed', cargo: 0 },
      junk: { family: 'junk', kit: 'lattice', cargo: 3 },
      shachuan: { family: 'junk', hull: '#79583b', paint: '#415e5c', kit: 'lattice', cargo: 4 },
      ljunk: { family: 'junk', paint: '#6c2e29', kit: 'lattice', cargo: 4 },
      baochuan: { family: 'junk', paint: '#a13b2a', sail: '#d3b071', kit: 'lattice', cargo: 4 },
      maengseon: { family: 'korean', kit: 'korean', cargo: 1 },
      panokseon: { family: 'korean', paint: '#3c6258', kit: 'korean', cargo: 1 },
      geobukseon: { family: 'korean', hull: '#765036', inner: '#9d7046', paint: '#684332', sail: '#d5b473', kit: 'armored', cargo: 0 },
      kobaya: { family: 'japanese', kit: 'shield', cargo: 0 },
      sekibune: { family: 'japanese', paint: '#6b3b2e', kit: 'shield', cargo: 1 },
      atakebune: { family: 'japanese', paint: '#242f32', kit: 'castle-jp', cargo: 1 },
      balsa: { family: 'raft', kit: 'lashed', cargo: 3 }
    }
  };
  // 초기 갤리온 팔레트 조정도 새 선종 프로필과 같은 곳을 가리킨다.
  Object.assign(G.FX.shipArt.profiles.galleon, G.FX.ship3d.art);
  G.FX.ship3d.art = G.FX.shipArt.profiles.galleon;
})(window.G = window.G || {});
