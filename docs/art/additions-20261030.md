# 추가 발견물·소지품 그림 (2026-10-30)

추가된 휴양지 섬 38곳·유적 7곳·곤충 30종의 발견 연출, 전용 그림이 없던 사건 소지품 24종과 새 유물 7종을 연결했다. 모두 106종이며 발견물·물건의 ID와 효과는 그대로 사용한다. 아래 표는 기본 제작 76종이고, 곤충 30종은 마지막 절에 따로 기록했다.

| 대상 | 수 | 게임용 파일 |
|---|---:|---|
| 휴양지 섬 | 38 | `images/discoveries/<ID>.gif`, `images/discovery-ends/<ID>.jpg`, `images/discovery-sheets/<ID>.webp` |
| 유적 | 7 | 위와 같은 세 가지 파일 |
| 사건 소지품 | 24 | `images/items/<ID>.webp` |
| 새 유적의 유물 | 7 | `images/relics/r_<ID>.webp` |

기존 몰디브·갈라파고스의 그림을 포함하면 휴양지 40곳 모두 전용 연출이 있다. GIF는 576×256·9.82초, 자연은 25장면, 유적은 16장면이다. 게임에서 사용하는 재생 시트는 6열이며 각각 24칸·18칸으로 시간을 고르게 나눠 담는다. 아이콘은 256×256 투명 WebP다.

## 그림과 생성 지시문

- [발견물 전체 미리보기](additions-20261030-discoveries.jpg)
- [소지품·유물 전체 미리보기](additions-20261030-items.jpg)
- [개별 원화 경로·최종 생성 지시문·게임 파일 목록](additions-20261030-prompts.json)
- [층수·책 가장자리 보정 지시문](additions-20261030-revisions.json)

기본 제작 76종 가운데 75종은 내장 ImageGen으로 만들었다. 피노키오 인형은 도구가 목각 인형 생성을 세 차례 거절해 프로젝트의 기존 three.js 아이콘 제작기로 나뭇결·관절·긴 코·옷을 모델링했다. 원래 추가된 인형 원화도 보존하고, 최종 아이콘은 `pinocchio_doll-v2.png`에서 만들었다. 생성 도구의 CLI/API 대체 호출은 사용하지 않았다.

원화는 자연 `tools/nature_gifs/sources/`, 유적 `tools/ruin_gifs/v3/master/`, 물건 `tools/addition_art/sources/`에 보존했다. 수정 전 원화는 지우지 않고 판 번호를 붙여 보관한다. 셉티조디움은 최종 `septizodium-v3.png`를 사용한다.

유적 원화의 칸 높이가 조금씩 달라지는 경우 실제 칸막이를 찾아 잘라, 이전 장면이 화면 위에 띠처럼 섞이지 않게 했다. 만월대의 실물 장면은 남은 축대·계단·주춧돌이다. 카프리 동굴에는 해·달·별 합성을 겹치지 않는다. 책 두 권은 잘린 표지 가장자리를 보정했다.

## 변환과 검증

```powershell
python tools/addition_art.py build
python tools/addition_art.py build --refresh
python -X utf8 tests/addition_art_files.py
node tests/addition_art_smoke.js
```

`build`는 이 제작 기록에 이미 있는 결과를 보존한다. `--refresh`는 새 원화로 바뀐 결과만 `artifacts/additions-20261030/before-refresh/`에 보관한 뒤 다시 만들며, 이번 제작 기록에 없는 파일은 덮지 않는다. 그림 목록은 기존 등록을 유지하면서 이번 파일만 더한다.

파일 검사는 76종의 누락·규격·알파·GIF 프레임 수·재생 시간·마지막 장면·시트 끝 칸·목록 연결을 확인한다. 브라우저 검사는 `file://`에서 전체 그림을 실제로 해독하고, 휴양지 40곳의 전용 연출·GIF 팩 경로·수첩 아이콘 31개·자연과 유적의 발견 및 다시 보기를 확인한다. 브라우저는 검사 뒤 닫는다.

실제 게임 캡처와 결과는 `artifacts/additions-20261030/items-runtime.png`, `jeju-reveal.png`, `septizodium-reveal.png`, `runtime-report.json`에 저장한다.

## 함께 추가된 곤충 30종

작업 도중 들어온 `js/data/insects.js`의 나비·나방·풍뎅이·사마귀·매미·반딧불이 30종도 내장 ImageGen으로 네 장면씩 제작했다. 이를 합치면 이번 작업은 발견물 75종과 소지품·유물 아이콘 31종, 모두 106종이다.

- [곤충 30종 미리보기](insects-20261030-preview.jpg)
- [곤충 원화·생성 지시문·게임 파일 목록](insects-20261030-prompts.json)

곤충 원화는 `tools/insect_gifs/sources/`에 둔다. 나비류는 애벌레·번데기·우화·날개 펼침, 풍뎅이는 숨어 있다가 걸어 나오는 흐름이다. 제왕나비·매미 떼·반딧불이 강은 무리의 출현을 별도로 구성했다. 최종 곤충 전체를 자르지 않고 넣으며, 각 종의 표본 유물도 기존 그림 체인을 통해 해당 종의 끝 장면을 사용한다.

```powershell
python tools/insect_art.py build
python -X utf8 tests/insect_art_files.py
```

곤충 GIF는 576×256·18장면·7.2초, 장면 판은 6열×3행이다. `tests/addition_art_smoke.js`는 곤충이 있으면 전체 106종과 표본의 그림 체인까지 함께 검사한다. 도감에서 빠져 있던 유적·사건 소지품 자료도 게임과 같은 파일로 연결하고, 「소중한 물건」 종류가 표시되게 했다.

최종 검증: 두 그림 파일 검사와 기존 `tests/item_assets_smoke.py` 모두 통과했다. 실제 브라우저에서도 106종 해독·투명 배경·발견 연출·다시 보기·수첩 31개 아이콘·도감 자료 연결을 통과했고 콘솔 오류는 0개였다. `morpho-reveal.png`와 `catalog-gat.png`도 위 캡처 폴더에 저장했다. 검사 브라우저는 종료했다.
