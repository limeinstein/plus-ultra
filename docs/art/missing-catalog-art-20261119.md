# 누락 아이템·발견물 원화 보완 — 2026-11-19

현재 `index.html`의 자료 로딩 순서로 아이템·발견물과 그림 선택 경로를 대조했다. 발견물 4종과 새 해적 전리품 15종의 원화를 내장 `image_gen`으로 제작해 게임 파일 27개를 추가했다.

## 추가한 그림

- 발견물: 세들레츠 납골당의 리치(`lich`), 리보니아의 늑대인간(`werewolf`), 크라크 데 슈발리에의 해골 기사(`deadknight`), 세계수 이그드라실(`worldtree`).
- 보물 8종: 에스파냐 금화 궤짝, 8레알 은화 자루, 에메랄드 십자가, 루비 박힌 금잔, 굵은 진주 목걸이, 비취 인장, 호박 목걸이 상자, 은괴 꾸러미.
- 명검 7종: 해적왕의 커틀러스, 톨레도 강철 레이피어, 다마스쿠스 킬리지, 산호 자루 샴시르, 일곱 굽이 크리스, 왜구의 노다치, 서리 무늬 장검.

발견물은 `images/discoveries/<ID>.gif`(576×256, 24장, 9.6초), `images/discovery-ends/<ID>.jpg`(576×256), `images/discovery-sheets/<ID>.webp`(3456×1024, 6×4칸)로 등록했다. 원화 한 장에 완만한 확대·이동을 적용한 발견 연출이다.

아이템은 `images/items/pl_*.webp` 8개와 `images/items/ps_*.webp` 7개의 256×256 투명 그림이며, 각 물건의 재질·형태를 구분했다. 기존 파일을 덮어쓰지 않고 `images/manifest.js`에 새 연결만 추가했다.

도감에 빠져 있던 `js/data/pirate_loot.js` 로딩도 추가해 해적 보물·명검 15종이 각 전용 그림과 함께 검색되도록 연결했다.

## 원본·프롬프트·미리보기

- [전체 그림 보기](../../artifacts/missing-catalog-art-20261119/report.html)
- [발견물 미리보기](../../artifacts/missing-catalog-art-20261119/preview-scenes-01.jpg)
- [아이템 미리보기](../../artifacts/missing-catalog-art-20261119/preview-icons-01.jpg)
- [원본 보존 폴더](../../artifacts/missing-catalog-art-20261119/raw/)
- [전체 생성 프롬프트](../../tools/missing_discovery_art_20261119/prompts.json)
- [출력 파일·해시·크기](../../tools/missing_discovery_art_20261119/assets.json)

생성 원본은 작업 폴더에도 복사해 보존했다. 다시 변환하려면 `python tools/missing_discovery_art_20261119/package.py`를 실행한다. 이미지 생성에는 내장 도구만 사용했다.

## 검사

- 변환기: 게임 파일 27개의 해시·크기, 발견 GIF 24장·9.6초, 아이템 투명도·13픽셀 이상 여백 확인.
- `python tests/discovery_assets_smoke.py`: 본편 1,297종·이야기 전용 7종, 총 1,304종의 GIF·끝 장면·시트·매니페스트 누락 0건.
- `node tools/audit_item_art.cjs --out artifacts/missing-catalog-art-20261119 --strict`: 아이템 1,790종 중 전용 연결 620종·같은 물건의 기존 그림 연결 1,170종, 누락 0건.
- `node tests/missing_catalog_art_20261119_smoke.cjs`: `file://` 게임에서 새 원화 19종 로딩, 발견물 4종의 재생·발견 화면, 아이템 15종의 실제 소지품 표시, 도감 19종 모두 통과. 페이지·콘솔 오류 0건. 결과와 스크린샷은 미리보기 폴더에 저장했다.
- `tools/images.py`의 재생성용 `scan()`으로 새 이미지 연결 27개가 그대로 유지되는 것도 확인했다.

기존 발견물 검사의 오래된 고정 총개수 조건을 실제 로딩 목록 검사로 바꾸고, 날치처럼 다른 발견물로 통합된 ID의 옛 그림은 `G.DISC_ALIAS`를 따라 저장 호환용으로 인정하도록 보완했다.

게임 규칙과 수치는 변경하지 않았다. 웹 빌드·배포는 수행하지 않았다.
