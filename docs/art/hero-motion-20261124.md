# 제독 16종의 걷기·일기토·필살기 원화

2026-11-24 요청: 여성 제독 제시카·김소영과 남성 외형 14종 전체의 동작을 새로 제작한다. 현재 게임의 젊은 초상과 얼굴·머리·복장을 맞추며 기존 저장의 생김새 ID는 유지한다.

## 파일과 연결

- 걷기: `images/characters/<외형>/motion/walk.webp`(7×7 호환 아틀라스), `stride_walk.webp`(8×1, 실제 8칸 주기).
- 개별 걷기: `images/characters/<외형>/walk_1.webp`부터 `walk_8.webp`까지(기본 제독은 `characters/walk_*`). 도감과 개별 프레임 경로도 같은 새 그림을 쓴다.
- 일기토: `images/duel/fighters/<전투원>.png` 및 `fighters_ext/<전투원>_{atk,react}.png`, 모두 2592×1216, 칸 432×304, 피벗 165·278. 기본 제독의 전투원 ID만 `main_admiral`이다.
- 필살기: `images/duel/cutins/<전투원>.gif`(1060×380, 5단계 일회 재생). 정지 사건샷은 `cutins/events-20261124/<전투원>.webp`.
- 원화·젊은 초상 참조: `art_sources/hero-motion-20261124/`. 교체 전 파일은 같은 폴더의 `before/`에 최초 한 번만 보관한다.
- 내장 ImageGen 제작 지시문·원본 경로: `tools/hero_motion_20261124/*_*.json`, 최초 남성 제작 지시문 묶음은 `male-prompts.json`.

걷기는 기존 이동 거리 기반 시간표를 사용한다. 전투 시트의 행을 런타임에 맞게 재배치하고 칼끝 접점과 쓰러짐 외곽선을 `js/data/duelart.js`에 기록한다. 필살기 원화의 방향은 모두 오른쪽이므로 해당 인물을 예전 왼쪽 방향 목록에서 해제한다. 소영의 여성 초상(`portrait.g='f'`)도 일반 여성 전투원보다 제독의 전용 시트를 우선 고른다.

## 손 모양 수정

제시카의 칼 쥔 손과 소영의 칼·부채 쥔 손은 별도 수정 원화(`*_cutin_handfix.png`)를 우선 사용한다. 네 손가락이 손잡이를 감싸고 엄지가 맞물리는 형태로, 소영의 왼손은 부채살이 모이는 아래 손잡이를 실제로 잡도록 수정했다. 먼저 제작한 기본 제독·연금술사도 칼 손잡이 쥔 손을 같은 기준으로 수정했다. 이후 남성 원화에도 손가락·손잡이 접촉 조건을 제작 지시문에 반영했다.

## 다시 포장하기

```powershell
python tools/install_hero_motion_20261124.py
python tools/images.py
python tools/hero_motion_20261124/package_preview.py
node tests/duel_assets_smoke.js
node tests/hero_motion_20261124_browser.cjs
```

전체 미리보기·걷기 GIF·손 확대 확인판·최종 ZIP: `artifacts/hero-motion-20261124/index.html`. 실제 게임 화면과 검사 결과는 그 아래 `browser/`에 저장한다. 설치 누락은 `install-errors.json`, ZIP 누락은 `package-audit.json`으로 확인한다.

## 최종 검사 결과

- `node tests/duel_assets_smoke.js`: 기존 전투원 포함 45종의 시트 규격·투명 여백·쓰러짐·필살기 5단계·그림 선택 통과.
- `node tests/hero_motion_20261124_browser.cjs`: 제독 16종의 개별 걷기 8장·거리의 8칸 순환/반복 경계/멈춤, 일기토 전용 그림 64회 읽기, 여성 초상 정보의 우선순위 검사 통과. 제시카·소영·기본 제독의 실제 일기토 시트 표시와 일격필살 GIF 재생·방향까지 확인. 콘솔·페이지 오류 0.
- `python tools/duel_fall_geometry.py --check`, `python tools/duel_contact_points.py --check`: 45종의 실제 픽셀과 착지 외곽점·칼끝 접점 일치.
- 최종 파일 288개, 묶음 누락 0, ZIP CRC 오류 0. 교체 전 원본 보존.

내장 `image_gen` 사용. [전체 생성 지시문과 출처](../../artifacts/hero-motion-20261124/generation-prompts-and-sources.json) · [소영의 칼·부채 손 확대](../../artifacts/hero-motion-20261124/soyoung-hands-review.jpg) · [실제 게임 검사 결과](../../artifacts/hero-motion-20261124/browser/report.json).
