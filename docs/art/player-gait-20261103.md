# 플레이어 걷기·달리기 보강 (2026-11-03)

기본 제독(admiral)의 걷기·달리기 그림을 교체하고, 플레이어 14종의 보행 재생을 이동 거리에 맞췄다.

[움직이는 전후 비교](player-gait-20261103.gif) · [키포즈 비교](player-gait-20261103.png)

## 참고 자료와 반영

- [배경을 움직여 달리는 느낌을 만드는 원리](https://www.youtube.com/shorts/xyCP3__cAxk): 자막 확인. 거리 화면은 기존 배경·건물의 서로 다른 스크롤 속도를 유지하고, 캐릭터의 보행 주기는 실제 이동량을 따라가게 했다.
- [걷기 애니메이션 제작 시 포인트](https://www.youtube.com/watch?v=BhCCOsR-TfM): 제목과 설명을 확인했다. 자막을 제공하지 않고 브라우저 화면 캡처도 실패해 세부 동작을 직접 확인하지는 못했다.
- [워킹 사이클이란](https://www.youtube.com/shorts/bD8bOmxzkI4): 자막의 접지·내려앉기·발 교차·밀어 올리기 순서를 키포즈와 상하 운동에 반영했다.

## 바꾼 것

기본 제독은 같은 인물·복장의 걷기 8자세와 달리기 8자세를 내장 `image_gen`으로 만들었다. sprite-gen과 기존 RIFE v4.6 제작 도구로 연결하고, 잔상이 있는 중간 칸은 정상 이웃 자세로 대체했다. 최종 시트는 걷기 49칸(기존 양발 대기 1칸 + 순환 48칸), 달리기 49칸이다. 모든 칸이 서로 다른 그림인 것은 아니다. 보이는 고유 자세는 걷기 35개, 달리기 31개다.

얼굴은 기존 걷기 첫 칸을 정수 좌표로 옮겨 고정했다. 머리 크기와 인물별 기준 키·발밑은 보존한다. 제독의 키는 280px, 발밑은 294px다. 새 자산은 `images/characters/admiral/motion/{walk,run}.webp`에 있다.

14종 공통으로 장면 시간이 아닌 이동 거리로 두 걸음 주기를 진행한다. Shift를 바꿔도 진행 중인 발 교대는 이어지고, 멈추거나 거리 끝에 막히면 보행을 멈춘다. 무게를 받을 때 조금 눌리고, 걷기는 발밑을 고정한 채 밀어 올리며, 달리기는 밀어낸 뒤 몸이 떠오르고 그림자가 작아진다. 기존 달리기의 출발 대기 칸이 반복되던 6종은 그 6칸을 루프에서 제외했다.

다른 13종의 원본 스프라이트, 문 들어가기 그림, 실제 이동 속도·도착 시간·카메라 규칙은 유지했다.

## 조정값

`js/data/seafx.js`의 `G.FX.heroGait`에 둔다. 두 걸음 보폭은 걷기 240px·달리기 360px, 초당 주기 상한은 1.8·2.6이다. 눌림은 2.2·3.2px, 밀어 올림은 1.5·5.5px다. `G.HERO_MOTION`의 `walkCycles/runCycles`는 시트 안의 두 걸음 주기 수, `walkStart/runStart`는 출발 대기로 제외할 칸 수다. 원본 자산의 키를 바꾸는 대신 그릴 때 작은 상하 운동을 적용한다.

## 제작 원본과 지시문

- [내장 image_gen 최종 지시문](../../tools/admiral_gait_20261103_prompt.json)
- [추출·얼굴 고정·적용 도구](../../tools/prepare_admiral_gait.py)
- 원본, 적용 전 백업, 키포즈, 보간·잔상 보고서, 최종 시트: `artifacts/player-gait-20261103/`
- 원화 생성 뒤 `prepare_admiral_gait.py`로 분리 → `update_player_walk_loops.py --source-dir ... --motion walk/run`으로 보간 → `prepare_admiral_gait.py --finish --sprite-gen ... --apply` 순서로 적용한다.

## 검증

- `python -X utf8 tests/player_motion_frames.py`: 14종 × 세 동작의 잘림·키·발밑·방향 통과.
- `python -X utf8 tests/player_motion_faces.py`: 달리기 686칸, 얼굴·머리 993,720픽셀이 걷기 기준과 완전히 같음.
- `node tests/player_motion_atlas_smoke.js`: 14종의 자산 연결·문 진입 동작 통과.
- `node tests/player_walk_loops_browser.js`, `node tests/player_run_loops_browser.js`: 실제 `file://` 거리에서 14종의 프레임 순서·반복 경계·Shift 전환·대기·벽 앞 정지·표시 크기 통과. 각 실행의 콘솔 오류 0.
- `node tests/navigator_walk49_browser.js`: 실제 화살표 조작·목적지 이동·정지 호흡 통과, 콘솔 오류 0.
- 실제 거리 화면: `artifacts/player-gait-20261103/browser-{walk,run}/admiral-town.png`. 모든 검수 브라우저는 종료했다.
