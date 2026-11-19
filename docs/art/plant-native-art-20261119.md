# 식물 증거·새 원주민 마을 전체 시설 원화 (2026-11-19)

식물 증거 아이템 96종과 새 원주민 마을 11곳의 전경, 각 마을의 전체 시설 외부·내부를 제작했다. 초기 안내의 95종과 달리 실제 `G.PLANT_RELICS`에는 96종이 있어 전부 포함했다. 총 261장이다.

## 제작과 결과물

내장 ImageGen으로 각 자산을 개별 생성했다. 식물 아이템은 실제 투명 배경의 물건 중심 그림이며, 마을과 시설은 같은 회화풍의 가로 배경이다. 각 마을의 게임 자료에 맞춰 해안 나무껍질 쉼터, 사막 차양, 호수 마을, 수상 가옥, 타이가 천막, 북극권 가죽·돌집, 삼나무 판재 건물, 아마존 야자잎 지붕을 구분했다. 게임용 창작 해석이며 역사 복원 자료를 표방하지 않는다.

- [전체 갤러리](../../artifacts/plant-native-art-20261119/index.html): 식물·마을·외부·내부 필터, 그림을 누르면 원본 PNG.
- [게임용 이미지 ZIP](../../artifacts/plant-native-art-20261119/plant-native-art-20261119.zip): WebP 261개와 제작 프롬프트.
- [전체 제작 프롬프트](../../artifacts/plant-native-art-20261119/prompts.json): 261개 항목의 ID·논리 키·생성 지시문과 수정 이력.
- 생성 원본: `artifacts/plant-native-art-20261119/originals/<ID>.png`. 생성 도구가 저장한 원본도 그대로 보존했다.
- 표시본: `images/plant-native-20261119/<ID>.webp`. 식물은 256×256 RGBA 무손실, 마을·시설은 1536×864 RGB.

시설은 교역소·술집·여관·성문·사당·시장·조합의 7종이다. 11개 마을마다 외부 7장·내부 7장, 총 154장을 만들었다. 개방형 쉼터의 내부는 지붕 아래 공간으로, 성문 내부는 출입구 안팎의 길로 표현했다.

## 연결과 보존

식물의 `relics/<ID>`·`items/<ID>`, 마을의 `backgrounds/<도시>`·`cities/<도시>`, 시설의 `exteriors/<종류>@<도시>`·`interiors/<종류>@<도시>` 등 논리 키 368개를 연결했다. `tools/plant_native_art_20261119/asset-overrides.json`을 `tools/images.py`의 우선 파일 목록에서 읽으므로 그림 목록을 재생성해도 연결을 유지한다. 기존 그림은 별도로 보존하며 게임 규칙과 ID를 바꾸지 않았다.

잭프루트·블랙커런트·노팔의 배경과 튤립의 꽃 형태, 홍경천의 불필요한 생화를 내장 ImageGen 편집으로 수정했다. 수정 전 원화는 `rejected/`, 지시문은 `edit-<ID>.json`에 보존했다.

## 검증

261개 원본의 해시가 모두 다르고, 표시본 크기와 368개 연결을 확인했다. 식물 96개는 원본·표시본 모두 실제 알파 투명 영역이 있고 표시본 외곽 여백이 유지된다. ZIP의 262개 항목은 손상 없이 열리며 게임용 이미지와 일치한다.

실제 file:// 게임에서 `G.Img.chain`·`G.Img.resolve`를 통해 261개 전용 원화를 읽고 식물 96개를 소지품 경로로도 확인했다. 에오라·모투·이누구이트의 마을과 술집 총 6장면을 촬영했다. 갤러리 261개 이미지도 전부 해독했으며 `pageerror`·`console.error`는 0건이다. 브라우저는 `finally`에서 종료했다.

- [최종 파일 검사](../../artifacts/plant-native-art-20261119/final-checks.json)
- [실제 게임·갤러리 검사](../../artifacts/plant-native-art-20261119/ui-checks.json)
- [에오라 마을](../../artifacts/plant-native-art-20261119/game-316-village.png) · [모투 술집](../../artifacts/plant-native-art-20261119/game-319-tavern.png) · [이누구이트 술집](../../artifacts/plant-native-art-20261119/game-323-tavern.png)

## 재실행

```powershell
python tools/plant_native_art_20261119/refresh_plan.py
python tools/plant_native_art_20261119/package.py --final
python -c "import sys;sys.path.insert(0,'tools');import images;f,d=images.scan();images.write_manifest(f)"
node tools/plant_native_art_20261119/check_ui.cjs
python tools/plant_native_art_20261119/audit.py
```

`plan.cjs`는 초기 제작 목록용이므로 확정된 프롬프트·수정 이력을 덮어쓰지 않도록 재실행하지 않는다. 이번 작업은 로컬 제작·연결·검증까지이며 배포와 커밋은 수행하지 않았다.
