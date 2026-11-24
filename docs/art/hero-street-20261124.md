# 제독 29종의 거리 동작 전체 (2026-11-24)

남성 14종, 제시카·김소영, 직업별 여성 13종의 걷기·달리기·뒤돌아 건물 들어가기·둘러보기·인사·스트레칭을 각자의 얼굴과 복식으로 연결한다. 정지는 같은 인물의 양발 대기 자세를 쓴다. 거리 이동 속도·제스처 시간·건물 진입의 축소와 사라짐은 기존 값을 유지한다.

- [전체 동작 미리보기와 시트](../../artifacts/hero-street-20261124/index.html)
- [거리 그림 묶음 ZIP](../../artifacts/hero-street-20261124/hero-street-sheets-20261124.zip)
- [대기 자세 전체](../../artifacts/hero-street-20261124/overview.jpg)
- [내장 ImageGen 지시문·원화 경로·해시](../../artifacts/hero-street-20261124/prompts-and-sources.json)
- [실제 게임 검사 결과](../../artifacts/hero-street-20261124/browser/report.json)

## 인물과 원본

전체 목록은 `tools/hero_street_20261124/characters.json`에 있다. 새 여성은 항해사·선교사·발굴자·귀족 항해사·측량사·탐험가·사냥꾼·군인·파수꾼·백발 항해사·정복자·검은 머리 사냥꾼·금발 측량사다. 원래의 `_f` 식별자를 유지한다.

여성 13종의 기존 초상은 상위 폴더 `output/imagegen/female-player-13-professions-20261123/`, `female-player-13-mature-20261123/`, `female-player-13-elderly-dyed-20261123/`에서 찾았다. 단계별 얼굴·무릎상 78개를 게임에도 등록했다. 제작 기록의 성숙 단계는 약 30~32세, 노년 단계는 약 70세다. 게임의 기존 초상 교체 기준 40세·70세는 바꾸지 않는다. 제시카·소영은 중년 초상이 없어도 만들기 목록에 남는다.

거리 원화는 **내장 `image_gen`**으로 제작하고 투명 배경 보정도 같은 도구를 사용한다. 이번 원화는 100장(기존 16종의 달리기·후면·대기 48장, 추가 여성 13종의 걷기·달리기·후면·대기 52장)이다. 기존 16종의 새 걷기 원화는 [앞선 제작 기록](hero-motion-20261124.md)을 이어 쓴다. 추가 여성 13종의 일기토·필살기는 [별도 제작 기록](hero-women-20261124.md)에 정리했다. 이후 배경 재검사에서 기존 원화의 잔여 배경도 수정했다.

원화: `art_sources/hero-street-20261124/raw/`. 투명 배경 보정본은 `_alpha.png`로 따로 보관한다. 참조 초상은 같은 폴더의 `references/`, 교체 전 파일은 `before/`에 최초 한 번 보관한다. 원화에 발이 잘렸던 초기 제시카 36칸 대기안은 `raw/discarded/`에 남기고 사용하지 않는다.

## 게임 시트

인물별 `images/characters/<외형>/motion/`에 다음 파일을 둔다.

- `walk.webp`·`run.webp`·`back.webp`: 기존 호출과 호환되는 7×7, 49칸.
- `stride_walk.webp`·`stride_run.webp`: 각각 8×1, 8개 보행·달리기 자세. 이동 거리 기반으로 반복한다.
- `idle.webp`: 6×6, 36칸. 둘러보기·인사·스트레칭 순서이며 동작당 6개 원화 키포즈를 두 칸씩 유지해 기존 12칸 시간표에 맞춘다. 36개의 서로 다른 원화라는 뜻은 아니다.
- `standing.webp`: 양발을 딛는 대기 자세. 같은 자세를 `walk.webp`의 0번 칸에도 넣어 기존 정지 경로에서 사용한다.

개별 `walk_1~8.webp`·`run_1~8.webp`도 같은 새 그림으로 맞춘다. 기본 제독의 개별 그림은 기존대로 `images/characters/` 바로 아래에 있다. 29종의 6개 아틀라스·정지 자세·개별 걷기/달리기를 합쳐 667개 게임 그림이다.

원화의 자세는 알파 연결 성분으로 분리하고 비율을 보존해 배치한다. 걷기와 달리기는 머리 중심을 맞추고, 대기 동작은 발 위치를 맞춘다. 뒤돌기는 옆모습→뒷모습으로 한 번만 진행하고 마지막 뒷모습에서 멈춘다. 마지막 네 자세에 얼굴을 그리지 않고 원화 자체에 축소나 문을 넣지 않는다.

`js/data/heromotion.js`가 반복 시트의 칸 수·거리 위상·달리기의 발 뜨는 높이를 읽는다. 예전 후면 시트를 숨기던 `skip`은 새 시트가 완성된 인물에서 해제한다. `js/core/images.js`는 여성 13명의 한국어 이름을 등록하고 기존 성별 분류(`_f`)를 이용한다.

## 다시 포장하고 검사하기

원화 제작 지시문은 `tools/hero_street_20261124/jobs.json`과 각 `<외형>_<동작>.json`에 보관한다. 최초 목록 준비는 `prepare_hero_street_20261124.py`, 여성 13종 추가는 `extend_hero_street_women_20261124.py`다. 원화가 보관된 상태에서 실행한다.

```powershell
python -X utf8 tools/audit_hero_street_alpha_20261124.py
python -X utf8 tools/install_hero_street_20261124.py
python -X utf8 -c "import sys;sys.path.insert(0,'tools');import images;f,d=images.scan();images.write_manifest(f);print(len(f),len(d))"
node tests/hero_street_20261124_browser.cjs
python -X utf8 tools/package_hero_street_20261124.py
```

픽셀 검사는 모든 칸의 실제 인물·투명 가장자리·크기를 확인한다. `file://` Chromium 검사는 제독 선택 목록(남성 14·여성 15), 각 인물의 여섯 아틀라스 읽기, 걷기/달리기 8칸 반복, 후면 49칸, 대기 각 12칸 선택, 정지 0번 칸, 이동 시 제스처 취소와 새 여성의 나이별 초상 경로를 확인한다. 실제 거리 화면을 `artifacts/hero-street-20261124/browser/`에 저장하고 `finally`에서 브라우저를 닫는다.


## 최종 검사 결과

29종 × 거리 여섯 동작의 모든 프레임 선택·반복·멈춤·취소와 새 여성의 25·40·70세 초상 연결이 통과했다. 브라우저 오류는 0이다. 게임용 시트 174개와 개별 그림을 합친 667개가 픽셀·파일 검사에 통과했으며 ZIP 667개 항목의 무결성 오류도 없다. [실제 화면·결과 JSON](../../artifacts/hero-street-20261124/browser/report.json)을 보관했다.

사용자 지적 뒤 이전 일기토 원화까지 포함해 174장을 재검사했고 배경 잔여 원화 18장을 수정했다. [배경 수정 전후·전체 검사](../../artifacts/hero-background-20261124/index.html).
