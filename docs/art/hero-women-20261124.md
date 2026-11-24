# 추가 여성 제독 13종 · 거리·일기토·필살기 (2026-11-24)

[전체 미리보기·ZIP](../../artifacts/hero-women-20261124/index.html) · [제독 29종 거리 동작](../../artifacts/hero-street-20261124/index.html)

상위 `output/imagegen/female-player-13-*20261123`에 있던 직업별 여성 초상 13종을 찾아 게임에 등록했다. 얼굴·무릎상의 세 단계 78개를 보존하고, 현재 젊은 얼굴과 복식에 맞는 걷기·달리기·후면·둘러보기·인사·스트레칭, 일기토와 필살기 사건샷을 새로 제작했다. 제시카·김소영을 포함하면 여성 외형은 15종, 남성 14종과 합쳐 거리 동작은 29종이다.

여성 항해사·선교사·발굴자·귀족 항해사·측량사·탐험가·사냥꾼·군인·파수꾼·백발 항해사·정복자·검은 머리 사냥꾼·금발 측량사를 각각 구분한다. 기존 직업별 소품은 허리나 등에 고정하고, 전투 중에는 오른손으로 칼자루를 쥔다. 네 손가락이 손잡이를 감싸고 엄지가 반대에서 눌러 잡으며 손목·자루·날이 이어지도록 제작했다.

## 원화와 게임 파일

**내장 `image_gen` 모드**를 사용했다. 원화는 `art_sources/hero-women-20261124/raw/`, 참조 초상은 `art_sources/hero-street-20261124/references/`, 실제 요청 지시문과 생성 경로는 `tools/hero_women_20261124/<외형>_<종류>.json`에 보관한다. [지시문·원화·해시 모음](../../artifacts/hero-women-20261124/prompts-and-sources.json)으로 재확인할 수 있다. 생성된 그림은 프로젝트에 복사하며 기본 생성 폴더 원본도 남긴다.

인물마다 공격·반응 24칸 원화 2장과 필살기 사건샷 1장을 제작한다. 원화의 연결 성분을 분리하고 비율을 유지해 432×304 칸에 배치한다. 누운 자세는 몸 전체가 가로로 놓여야 한다. 배경 제거는 같은 내장 이미지 도구로 처리하며 `_alpha.png`를 우선 사용한다.

- `images/duel/fighters/<외형>.png`: 기본 일기토 시트.
- `images/duel/fighters_ext/<외형>_atk.png`·`_react.png`: 공격·반응 각 24칸.
- `images/duel/finishers/<외형>/{slash,thrust,bash}.gif`: 세 가지 필살기 동작.
- `images/duel/cutins/<외형>.gif`: 필살기 사건 재생.
- `images/duel/cutins/events-20261124/<외형>.webp`: 정지 사건샷.

13종의 전투 파일은 104개다. [여성 전체 ZIP](../../artifacts/hero-women-20261124/hero-women-complete-20261124.zip)에는 거리 299개·초상 78개를 더해 게임 그림 481개를 담는다. 나이별 얼굴·무릎상은 기존 40세·70세 교체 기준을 그대로 사용한다.

## 연결과 검사

`js/core/images.js`의 여성 선택 목록에 13종을 추가하고, 중년 초상이 없는 제시카·소영도 목록에 남긴다. 전투 선택은 인물 전용 시트를 우선하며 `js/data/duelart.js`의 접촉점·쓰러짐 기하 자료도 새 시트에서 구한다. 거리 반복 설정은 `js/data/heromotion.js`에 둔다.

```powershell
python -X utf8 tools/audit_hero_women_alpha_20261124.py
python -X utf8 tools/install_hero_women_duel_20261124.py
python -X utf8 -c "import sys;sys.path.insert(0,'tools');import images;f,d=images.scan();images.write_manifest(f);print(len(f),len(d))"
node tests/hero_women_20261124_browser.cjs
python -X utf8 tools/package_hero_women_20261124.py
python -X utf8 tools/audit_hero_background_20261124.py
```

브라우저 검사는 13종의 거리 걷기 반복·전투 그림 선택과 읽기, 실제 일기토 표시, 실제 필살기 사건샷 재생·방향을 확인한다. 화면과 결과는 `artifacts/hero-women-20261124/browser/`에 저장하고 브라우저는 `finally`에서 닫는다. 픽셀 검사는 빈 자세·가장자리 잘림·수평 쓰러짐을 확인한다.


## 최종 검사 결과

13명 전원의 거리 걷기·전투 그림 연결, 실제 일기토의 본인 시트 표시와 필살기 사건샷 재생·방향을 확인했다. 결과 39건, 브라우저 오류 0이다. [실제 화면·결과 JSON](../../artifacts/hero-women-20261124/browser/report.json), [칼자루 쥔 손 확대](../../artifacts/hero-women-20261124/hands-review.jpg)를 보관했다.

13종의 전투 39시트에서 빈 자세·가장자리 잘림·수평 쓰러짐을 검사했고, 전체 ZIP 481개 항목의 무결성 오류도 없다. 전체 전투 자산 검사에서는 58종의 시트·컷인·메타데이터·그림 선택이 통과했다. `node tests/player_motion_atlas_smoke.js`와 `node tests/duel_assets_smoke.js`도 통과했다. [배경 수정 전후와 알파 검사](../../artifacts/hero-background-20261124/index.html).
