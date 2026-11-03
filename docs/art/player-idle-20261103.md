# 플레이어의 거리 대기 동작 (2026-11-03)

앞서 만든 걷기 캐릭터를 기준으로 플레이어 14종에 경치 구경·귀족식 인사·스트레칭을 추가했다.

[움직이는 미리보기](player-idle-20261103.gif) · [걷기와 14종 동작 비교](player-idle-20261103.png)

## 게임에서의 동작

아무 입력 없이 4.5초 쉬면 경치를 바라보며 눈가에 손을 댄다. 이후 동작이 끝나고 8~13초 뒤에 경치 구경과 스트레칭을 번갈아 한다. 스트레칭은 어깨를 풀고 두 손을 머리 위로 올려 몸을 늘이는 모습이다.

가까운 거리 주민이 170px 이내에 0.65초 머물면 상대를 향해 돌아서 가슴에 손을 얹고 허리를 숙인다. 같은 사람 곁에서 계속 인사하지 않는다. 상대가 240px 밖으로 나갔다가 돌아오고 30초가 지나면 다시 인사할 수 있다. 동물은 이 인사 대상에서 제외한다.

주민을 직접 눌러 말을 걸면 다가간 뒤 1.65초의 인사를 마치고 대화를 연다. 이동 입력이 들어오면 인사와 대화 대기를 취소한다. 다른 대화·문 입장·화면 전환도 대기 동작보다 우선한다. 화면을 닫거나 배경을 다시 만들 때 기다리는 인사도 해제한다.

## 자산과 외형

14종 각각의 기존 걷기 대기 칸을 얼굴·머리·복장·체형의 참조로 사용했다. 내장 `image_gen`으로 동작별 6자세를 만든 뒤 RIFE v4.6으로 중간 칸을 잇는다. 잔상이나 잘림이 있는 보간은 원본 자세를 유지하므로 모든 칸이 서로 다른 그림인 것은 아니다.

각 외형의 `images/characters/<look>/motion/idle.webp`가 세 동작을 함께 담는다. 6열×6줄, 동작당 12칸이며 총 14장·504칸이다. 한 칸 높이 420px, 발밑 414px, 실제 서 있는 키는 해당 외형의 걷기 원본과 같다. 팔을 올릴 공간을 위에 확보하고 게임에서 걷기와 같은 배율로 그린다.

기존 걷기·달리기·문 입장 시트와 이동 속도는 바꾸지 않았다. [파일 해시와 제작 기준](player-idle-20261103.json)으로 이전 걷기 원본이 그대로인지 확인한다. 새 동작은 거리 화면의 임시 상태에만 남으며 저장 파일 형식은 바꾸지 않는다.

## 파일과 재현

- 동작 선택·인사 대기·취소·렌더링: `js/scenes/town.js`
- 말을 걸기 전에 인사를 기다리는 연결: `js/scenes/city.js`
- 시간·거리·프레임 조정값: `G.FX.townHeroGestures`, `js/data/seafx.js`
- [원화 생성 지시문 14종](../../tools/player_idle_20261103_prompts.json), [두 시트의 배경 정리 지시문](../../tools/player_idle_20261103_background_prompt.json): 내장 image_gen 사용
- [포장·보간 도구](../../tools/prepare_player_gestures.py), [미리보기 도구](../../tools/preview_player_gestures.py)
- 참조·원화·키포즈·보간 캐시·인물별 검수 보고서: `artifacts/player-idle-20261103/`

원화를 `<look>-generated.png`로 보관한 뒤 `prepare_player_gestures.py --input ... --output ... --sprite-gen ... --rife-binary ... --rife-model ... --looks ... --apply`로 적용한다. 원화가 바뀌면 새 출력 폴더를 사용한다. 게임 실행에는 Python·RIFE나 생성 도구가 필요 없다.

## 검증

- `python -X utf8 tests/player_idle_gestures.py`: 14종·504칸의 투명 배경, 발밑, 가장자리, 몸을 숙이는 인사와 팔을 올리는 스트레칭, 걷기 원본 해시 통과.
- `node tests/player_idle_gestures_browser.cjs`: 실제 `file://` 거리에서 14종의 세 동작 36칸 선택, 자동 시작·완료, 상대 방향, 같은 NPC에게 반복 인사 방지, 이동·대화 우선권 통과. 인사 완료 뒤 대화를 여는 연결과 화면을 떠날 때 대기 해제도 통과. 콘솔 오류 0.
- `python -X utf8 tests/player_motion_frames.py`, `python -X utf8 tests/player_motion_faces.py`, `node tests/player_motion_atlas_smoke.js`: 기존 걷기·달리기·얼굴·문 입장 검사 통과.
- `node tests/player_walk_loops_browser.js`, `node tests/player_run_loops_browser.js`, `node tests/navigator_walk49_browser.js`: 기존 14종 보행·달리기와 실제 화살표 조작·정지 호흡 통과. 콘솔 오류 0.
- 실제 거리 화면: `artifacts/player-idle-20261103/browser/{admiral,navigator_white,ganghui}-{look,greet,stretch}.png`.

검수 브라우저와 제작용 보간 과정은 모두 종료했다.
