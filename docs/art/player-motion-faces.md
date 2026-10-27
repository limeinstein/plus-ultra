# 주인공 걷기·달리기 얼굴 통일 (2026-10-28)

14종의 달리기 원본은 걷기와 눈·코·턱선, 머리카락 및 머리 크기가 달랐다.
키와 발밑을 맞추는 처리만으로는 이 차이가 없어지지 않았다.

각 인물의 걷기 대기 칸(`G.HERO_MOTION[look].idle`)을 얼굴 원본으로 사용한다.
sprite-gen 3.5.0의 `video.face_layer.warp`로 같은 크기의 머리를 정수 좌표로
옮겨 달리기의 49칸에 합성했다. 얼굴을 새로 생성하거나 보간하지 않는다.
목·옷깃을 따라 정한 경계에서만 3px를 섞고, 그 아래의 몸과 팔다리는 원래
달리기 픽셀을 보존한다. 머리 위치에는 원형 5칸 중앙값을 사용한다.

처리 순서는 키포즈 정리 → RIFE 보간 → 잔상 제거 → 걷기와 키·발밑 맞춤
→ 걷기 얼굴 합성 → 최종 검수다. 얼굴 합성은 보간 뒤에 수행해야 한다.
`tools/update_player_walk_loops.py --motion run`에도 이 순서를 반영했다.

## 파일

- 게임 자산: `images/characters/<look>/motion/run.webp` (14종 × 49칸)
- 제작 도구: `tools/match_player_motion_faces.py`
- 얼굴 원본·파일 해시·칸별 배치 좌표: `docs/art/player-motion-faces.json`
- 보정 전 백업·보정본·49칸 비교·검수 결과:
  `artifacts/face-match-update-20261028/<look>/`
- 확대 비교: `artifacts/face-match-update-20261028/face-comparison.png`
- 걷기·뛰기 전환: `artifacts/face-match-update-20261028/walk-run-faces.gif`

원본 걷기 파일과 시트의 크기·발밑 기준은 유지했다. 새 이미지 생성은 하지
않았으며, 사용자 지정 sprite-gen의 얼굴 레이어를 이용한 결정적 합성이다.

## 하얀 남방 항해사의 머리 크기 재조정

처음 얼굴을 통일할 때 `navigator_white`는 머리 폭이 약 55px이던 달리기에
40px인 걷기 머리를 그대로 옮겨 얼굴이 작아졌다. 이 인물은 걷기 원본의
생김새를 유지하면서 머리 폭을 54px로 먼저 조정한 뒤, 두 동작의 98칸에
같은 얼굴을 적용했다. 확대율은 원본 기준 약 1.35배다.

걷기·달리기 모든 칸의 머리 폭은 54px, 전체 키는 걷기 267~268px·달리기
268px, 발밑은 294px다. 목·옷깃 아래 y=100부터 몸과 팔다리는 보정 전과
픽셀이 같고 다른 13종도 유지했다. 이후 걷기 제작에서도 머리 폭 54px를
먼저 맞추므로 중복 실행해도 계속 커지지 않는다.

보정 전 파일과 비교 이미지는 `artifacts/navigator-head-size-20261028/`에 있다.

## 검증

`python -X utf8 tests/player_motion_faces.py`는 합성 계산을 다시 실행하지 않고
실제 자산을 걷기 원본과 정수 좌표로 직접 비교한다. 14종 686칸의 머리 상단과
눈·코·입·턱 안쪽 1,016,309픽셀이 원본과 완전히 같았다.

`python -X utf8 tests/player_motion_frames.py`: 14종의 크기·발밑·방향·잘림 통과.
걷기와 달리기 전체 키 차이는 인물별 최대 1px이고 발밑은 모두 294px이다.

`node tests/player_run_loops_browser.js`: 실제 `file://` 게임에서 14종의 49→1
루프, 달리기→걷기→대기 전환, 표시 크기를 확인했다. 콘솔 오류 0.
검수용 98개 가로 스트립도 새 달리기 자산으로 다시 내보냈다.
