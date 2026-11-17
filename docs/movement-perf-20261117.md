# 항해·탐험 끊김 원인 수정 (2026-11-17)

원본 해상도 1600×900, 같은 Chrome·PC·고정 난수로 변경 전후를 측정했다. 게임 속도·이동·해도·파도 식·선박 꼭짓점 수는 바꾸지 않았다.

## 확인한 원인과 수정

항해 CPU 프로파일에서 3D 돛 갱신이 주요 비용이었다. 돛의 UV에만 의존하는 거듭제곱·삼각함수·주름·아랫단·가장자리 값을 모형 생성 때 미리 계산한다. 시간·바람·접힘에 따른 식과 법선·밧줄·노 갱신은 계속 수행한다. 제작 원본 `tools/ship3d/runtime_rig.js`와 실행용 `js/art/ship-models.js`에 같은 변경을 반영했다.

탐험 화면에서 작은 배를 처음 준비할 때 큰 선박 시트와 축소 시트의 createImageBitmap 작업이 CPU 프로파일에 나타났다. 작은 배는 이미 decode가 끝난 그림을 고품질 축소 캔버스로 보관하며 원본을 다시 해독하지 않는다. 확대해 원본이 필요해지면 그때 ImageBitmap을 준비하고, 준비하는 동안 축소 그림을 유지한다. 큰 선박이나 3D 실패 시의 대체 그림 경로도 유지한다.

선박 검사 전용 HTML에는 배 자료가 요구하는 base.js가 빠져 기존 검사기가 shipPrices 오류로 멈췄다. 자료를 올바른 순서로 읽도록 수정했다.

## 측정과 검증

단독 실행한 `runtime_perf_browser.cjs movement-before`와 `movement-after` 비교에서 항해 CPU는 초당 273.94→226.15ms(약 17% 감소), 선박 그리기는 533.5→387.4ms(약 27% 감소), 장면 처리 상위 5%는 6.6→5.0ms였다. 기기·함대·다른 프로그램 부하에 따라 달라지며 FPS 향상률을 뜻하지 않는다. 탐험의 평상시 프레임은 이미 가벼웠으며 최종 변경은 첫 선박 준비의 재해독을 없애는 데 초점을 뒀다.

- `node tests/movement_perf_20261117.cjs`: 수정 전 참고 모션과 갤리온·캐러벨·갤리·정크·판옥선의 돛·밧줄 꼭짓점을 접힘·바람·시간 조합으로 비교, 최대 좌표 오차 0. 작은 배 재해독 0회, 실제 896×1792 축소 캔버스 사용, 확대 시 원본 준비 확인, 콘솔 오류 0건. 참고 구현은 tests/fixtures에 보존한다.
- `node tests/runtime_perf_browser.cjs movement-after`: 실제 항해·탐험·해전, 중첩 전투 정지와 복귀, 원본 해상도, 그래픽 자원 해제 검사 통과.
- `SHIP3D_GPU=1 SHIP3D_SKIP_SEA=1 node tests/ships3d_smoke.cjs`: 선박 36종의 방향·돛·노·자원 검사 통과, 콘솔 오류 0건. 실제 항해 경로는 위 runtime 시험이 검사한다.
- `BROWSER_EXE=<Chrome> node tests/landsea_smoke.js`: 탐험 화면의 배 출현·해상 위치·항로·제거, 항적·파도 검사 통과, 콘솔 오류 0건.

측정 자료는 artifacts/runtime-perf-20261115/movement-before, movement-after, movement-final과 artifacts/movement-perf-20261117에 기록한다. movement-final은 다른 브라우저 시험과 동시에 실행해 기능 회귀만 판정하며 위 단독 성능 수치와 섞지 않는다. 배포는 수행하지 않았다.
