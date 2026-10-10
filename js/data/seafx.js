/* 지형·바다·배 움직임·물보라의 조정값 (G.FX). 값만 바꿔서 느낌을 다듬을 수 있게 한곳에 모은다.
   · terrain / water 는 WebGL 지형 셰이더에 uniform 으로 넘어간다 (js/world/renderer.js)
   · ship 은 바다 장면의 선체 관성 (js/scenes/sea.js), wake / spray 는 항적·물보라 (js/scenes/seafx.js)
   시간 단위: 'd' = 게임 속 하루(×1 배속에서 실제 1.25초). 거리 단위: 경도·위도의 도(°). 기본 항해 확대에서 1° ≈ 110px, 기함 길이 ≈ 0.35°. */
(function (G) {
  'use strict';
  G.FX = {
    // 자택 장면 그림 (js/art/homeart.js): 그림 크기와 화면 위에서의 자리 (무대 1600×900)
    homeArt: { w: 900, h: 520, top: 78 },
    famScene: { w: 1008, top: 74 },
    // 내 컴퓨터의 코스타 델 솔 MP3 (js/systems/localost.js): 곡을 바꿀 때 겹쳐 바꾸는 초 fade · 곡 끝에서 처음과 겹쳐 돌리는 초 loopFade ·
    //   이 초 안에 같은 곡으로 돌아오면 이어서 resumeSec · 곡 이름이 떠 있는 초 showSec(0 = 안 띄움) · 음악 크기에 곱하는 값 gain · 파일 찾기 기다림 probeMs
    // 불러오는 그림 (js/ui/loader.js): 적어도 minShow ms 보여 주고 fadeMs 에 걸쳐 걷는다 · 장면 사이 검은 막이 fadeAfter ms 넘게 걸리면 작게 띄운다 ·
    //   게임을 시작할 때 그림 받기를 기다리는 가장 긴 시간 prepareMs · 도시에 들어서 앞바다를 미리 그리기 시작하는 때 cityWarmMs
    loader: { minShow: 450, fadeMs: 450, fadeAfter: 350, prepareMs: 5000, cityWarmMs: 1500 },
    localOst: { fade: 2.5, loopFade: 3, resumeSec: 300, showSec: 3.2, gain: 0.9, probeMs: 6000 },            // 가족 사건 그림의 너비(높이는 576:256 비율)·위쪽 자리
    // 자택 화면에 서 있는 가족 (homelife.js familyPanel): 어른 키 h, 설 자리(왼쪽·아래·너비), 옆 사람과 겹치는 비율
    homeFamily: { h: 610, width: 1150, left: 50, bottom: 0, overlap: 0.3 },
    // 기함 선실 화면 (js/ui/cabinview.js): 무대(배 그림) 크기, 오른쪽 명단 폭, 선체 속 선실 표·갑판 얼굴표 크기, 배 그림을 자르는 여백, 카드 최대 폭, 명단 높이
    cabinView: { stageW: 920, stageH: 314, side: 300, pin: 38, pinMin: 24, medal: 54, pad: 70, minSpan: 560, below: 40, cardMax: 180, rosterH: 280 },
    // 자동항해를 시작하면 켜지는 배속 (js/scenes/sea.js setTarget — 1·2·4 가운데). 손으로 몰면 이전 배속으로 돌아간다
    autoSailSpeed: 4,
    // 바다에서 멈춰 있을 때(Space·정지) 시간이 흐르는 배속 — 날이 가고 다른 배들이 움직인다. 0이면 예전처럼 멈추면 시간도 멈춘다
    waitSpeed: 1,
    // 바람을 보여 주는 구름 (js/scenes/sea.js cloudStep·cloudTail, js/world/renderer.js clouds)
    //   drift: 풍속 1일 때 구름이 게임 속 하루에 흐르는 거리(°) · idleRate: 멈춰 있거나 대화 중일 때 흐르는 빠르기(×1 배속의 몫)
    //   turn: 바람이 바뀔 때 구름 흐름이 도는 가장 빠른 빠르기(rad/초) · morph: 다른 바다로 들어설 때 구름 모양이 바뀌는 시간(초)
    //   tail: 구름이 흘러가는 쪽(±18°)으로 달릴 때 속력 보너스 (바다마다 steady를 곱한다: 무역풍·계절풍 1, 편서풍 0.7, 극지 0.5, 지중해 0.4, 무풍대 0)
    //   regimes: 바다별 모양을 바꾸려면 { trades: { form: [늘어남, 구름길, 크기, 솟음], steady: 1, name: '…' } } 처럼 덮어쓴다
    clouds: { drift: 1.3, idleRate: 0.35, turn: 0.12, morph: 6, tail: 0.08, regimes: {} },
    // 낚시 배경의 수면 위치. 그림을 화면의 실제 찌 높이에 맞춰 나누어 그린다.
    minigames: { fishingWaterline: 0.365, boat: [0, -118, 218, 145] },
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
      whitecap: 1.0,                    // 흰 물마루 양
      glint: 1.0,                       // 수면 반짝임 (배·항로를 가리지 않게 상한이 있다)
      shallow: [0.10, 0.47, 0.55],      // 연해 색
      deep: [0.04, 0.165, 0.32],        // 먼바다 색
      lagoon: [0.30, 0.66, 0.63],       // 모래 바닥이 비치는 아주 얕은 물
      foam: 1.0,                        // 해안 포말
      cloud: 0.8,                       // 구름 양
      berg: 1.0                         // 빙산·유빙 밀도 (찬 바다에서만)
    },
    ship: {
      accel: 0.32,        // 출발할 때 목표 속력의 63%에 이르는 시간 (d)
      decel: 0.7,         // 돛을 거두었을 때 속력이 37%로 줄어드는 시간 (d)
      lateral: 0.20,      // 옆으로 미끄러지는 속도가 37%로 줄어드는 시간 (d) — 클수록 선회 때 더 미끄러진다
      maxDrift: 0.42,     // 선수 방향과 진행 방향의 최대 차이 (rad, 약 24°)
      stopSpeed: 0.03,    // 이보다 느리면 멈춘 것으로 친다 (°/d)
      arriveSlow: 0.3,    // 목적지 이만큼(°) 안에서 속력을 줄인다
      heave: 1.0, pitch: 1.0, roll: 1.0,  // 상하·앞뒤·좌우 흔들림 크기
      camLead: 0.22,      // 카메라가 진행 방향으로 앞서 보여 주는 정도 (속력 1°/d 당 °, 최대 0.3°)
      camCatch: 4,        // 카메라: 배를 그대로 따라가고, 어긋난 만큼(앞서 보기가 바뀔 때 등)만 이 빠르기(1/초)로 좁힌다
      zoomEase: 12,       // 확대·축소가 목표에 다가가는 빠르기 (1/초) — 휠 한 칸이 한 번에 뛰지 않고 부드럽게
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
      life: 2.2,          // 항적이 남는 시간 (d)
      spread: 0.34,       // 선미 V자 파문이 옆으로 퍼지는 빠르기 (배 속력에 대한 비, 켈빈 파 ≈ 0.35)
      foamWidth: 0.55,    // 거품 항적의 처음 폭 (선체 폭에 대한 비)
      foamGrow: 1.4,      // 거품 항적이 퍼지는 빠르기 (선체 폭/d)
      alpha: 0.85,        // 항적 진하기
      maxPoints: 420
    },
    party: {              // 육상 탐험대 모형 (js/art/party.js) — 지원 동물의 속력·피로 수치는 js/data/mounts.js
      size: 1.3,          // 크기 (1 = 사람 키 약 34px — 1.3이면 사람 44px, 말 탄 대원 약 70px: 예전 탐험대의 약 2.5배)
      spacing: 1.0,       // 줄 선 대원 사이 간격
      dust: 1.0,          // 발밑 먼지·눈보라·풀잎의 양
      maxStepHz: 2.2      // 걸음이 이보다 빨라지지 않는다 (초당 걸음 주기) — 빨리 가도 장난감처럼 종종거리지 않게
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
      shakeX: 10,         // 흔들림 가로 최대 거리(px, shakeT=1)
      shakeY: 6,          // 흔들림 세로 최대 거리
      shakeHit: 0.25,     // 보통 명중 때 더하는 흔들림
      shakeBig: 0.6,      // 치명타·큰 공격
      shakeDecay: 2.5,    // 흔들림이 줄어드는 빠르기(1/초)
      flashHit: 0.10,     // 적 명중 때 화면 번쩍임
      flashTaken: 0.16,   // 아군 피격 때 붉은 번쩍임
      flashBig: 0.25,     // 큰 공격의 번쩍임 하한
      flashDecay: 6,      // 번쩍임이 줄어드는 빠르기(1/초)
      knockback: 26,      // 피격자가 밀리는 거리(px)
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
      slamSpray: 1.0,     // 그때 튀는 물보라 양
      luffFrom: 2.25, luffTo: 2.7, // 겉바람이 선수에서 이 각(rad, 뒤=0·정면=π) 사이로 들어오면 돛이 펄럭이기 시작해 다 펄럭인다
      rigRate: 1.6,       // 활대·삼각돛이 바람을 따라 돌아가는 빠르기 (1/초)
      windScale: 1.6,     // 참바람 세기(0~1)를 배 속력과 같은 척도로 (겉바람 = 참바람×이 값 − 배 속력/기준 속력)
      flag: 1.0           // 돛대 위 긴 깃발 크기 (0이면 없음)
    },
    spray: {
      bow: 1.0,           // 선수 물보라
      side: 1.0,          // 선측 물살(접촉 포말)
      stern: 1.0,         // 선미 거품
      turn: 1.0,          // 선회 때 측면 물보라
      maxParticles: 700,
      size: 1.0
    }
  };
  // 항해 효과 스프라이트 (js/scenes/voyagefx.js · images/effects/ship_spray.png·departure_gull.png)
  G.FX.voyage = {
    spray: true,         // 배가 속력을 낼 때 선수 양옆 물보라
    accelFrom: 0.35,     // 이 가속(°/일²)부터 보이기 시작해 (출발할 때 약 2.5, 순풍으로 돌 때 0.5~1)
    accelFull: 1.8,      // 이 가속에서 가장 세다
    sprayScale: 0.95,    // 물보라 한 장의 너비 = 배 그림 길이 × 이 값 (세기에 따라 0.65~1.1배)
    sprayFrameMs: 80,    // 한 프레임 (그림 설명: 70~90ms)
    sprayFollow: 0.6,    // 따르는 배는 이만큼
    sprayAlpha: 0.9,
    burstFrom: 0.55,     // 세기가 이 값을 넘어서는 순간 한 번 크게 튄다
    burstCool: 2.5,      // 크게 튄 뒤 쉬는 시간(초)
    burstScale: 1.35,
    sendoffMonths: 3,    // 모항 출항 배웅: 지난번 모항 출항에서 이만큼(달)이 지나야 (처음 출항 포함)
    gulls: 9,            // 배웅하는 갈매기 수
    gullFrameMs: 95,     // 날갯짓 한 프레임 (그림 설명: 85~110ms)
    gullSize: 0.62,      // 갈매기 한 마리 = 배 그림 길이 × 이 값 (가까이 올수록 커진다)
    sendoffSec: 7.5,     // 배웅이 이어지는 시간(초)
    title: true          // 「모항 ○○을 떠나다」 글귀
  };
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
      admiralHeight: 52
    },
    battle: true,        // 육상전 부대를 그림 시트로
    unitH: 56,           // 육상전 병사 몸 키(px, 1000×430 판 기준 — 치켜든 무기는 빼고) · 짐승은 beastH
    beastH: 40,
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
  /** 코스타 델 솔 3 OST 유튜브 재생기 창 (js/systems/ytmusic.js) — 유튜브 규칙상 200×200보다 작게 하거나 숨길 수 없다.
     w·h 재생기 크기 · idle 마우스를 올리지 않았을 때 흐림(0~1) · flash 곡이 바뀌면 또렷하게 보이는 초 · gap 구석에서 띄우는 px */
  G.FX.ostBox = { w: 200, h: 200, idle: 0.5, flash: 2.5, gap: 8 };
  // 유튜브 OST 곡 돌림 (js/systems/ytmusic.js): 곡 끝 guard초 전에 그 곡 처음으로 되감는다 · 끝에서 줄이고 되감은 뒤 올리는 fade초 · 위치를 보는 간격(ms)
  G.FX.ostLoop = { fade: 1.5, guard: 0.35, every: 250 };
})(window.G = window.G || {});
