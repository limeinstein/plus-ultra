# 천일야화 인물화·이벤트샷 (2026-11-09)

신드바드의 모험·하룬 알 라시드의 밤 산책·흑단 말에 신규 인물 6명의 얼굴상·무릎상 12장과 사건샷 9장을 제작했다. 기존 신드바드 초상은 그대로 쓴다.

![인물화 전체](../../artifacts/nights-art-20261109/portraits-preview.jpg)

![이벤트샷 전체](../../artifacts/nights-art-20261109/scenes-preview.jpg)

## 인물·연결

| 인물 | 그림 키 | 구성 |
|---|---|---|
| 나디라 알 사나니 | `portraits/legendary/nadira` | 참고 사진의 눈매·입술·고개 기울임·옆을 보는 미소, 풍만한 성인 체형, 열린 어깨와 목선의 붉은 비단 공주복·진주·예멘식 은 장신구 |
| 카마르 알 아크마르 | `portraits/legendary/qamar` | 흰 깃털 터번·푸른 페르시아 비단·보석 단검·은 열쇠 |
| 하룬 알 라시드 | `portraits/history/an_harun` | 갈색 상인복·두건·금실 소매·루비 반지 |
| 자파르 | `portraits/history/an_jafar` | 녹색 망토·장부·단정한 검은 수염 |
| 마스루르 | `portraits/history/an_masrur` | 검은 호위복·큰 체격·칼집에 든 언월도 |
| 늙은 현자 | `portraits/history/an_sage` | 흰 수염·검은 작업복·태엽 열쇠·작은 기계 |

각 키에 `_half`를 붙이면 1024×1536 투명 무릎상이다. 얼굴상은 같은 원화에서 얼굴을 찾아 448×448로 추출해 얼굴·의상 일관성을 유지했다. `portraitfaces.js`에는 12장의 눈·입 좌표를 추가했다.

합류 전에는 역사 화자, 합류 뒤에는 전설 동료 화자로 같은 얼굴·몸 그림을 선택한다. 후원자 하룬의 `face`도 같은 전용 초상으로 지정했다. 도감에서 새 동료를 읽도록 `catalog.html`에 천일야화 자료를 추가했고, 사건 목록에 9장면을 등록했다.

## 장면

게임용 1881×836 WebP, `images/legend-events/`에 저장했다.

- `an_sinbad_house`: 바스라 신드바드 저택의 잔치와 이야기
- `an_whale`: 섬인 줄 알았던 고래와 선원 구조
- `an_roc`: 로크의 거대한 알·날개 그림자·깃털
- `an_valley`: 다이아몬드 골짜기·뱀·독수리
- `an_tavern`: 밤 술집의 변장한 칼리프 일행
- `an_palace`: 황금 문의 궁에서 정체를 밝힌 칼리프
- `an_ebony`: 시라즈 장미 정원의 흑단 말 수리
- `an_isfahan`: 성주 궁 앞 현자와 의원으로 변장한 왕자
- `an_flight`: 흑단 말을 타고 이스파한 위로 탈출하는 왕자·공주

## 제작 자료

내장 `image_gen`으로 원화 15장을 생성했다. 사용자 첨부 2장은 나디라의 얼굴·표정 참고로만 사용했다. 프로젝트의 그림 요청서에 적힌 의상 안내보다 사용자가 이번에 요청한 의상·체형을 우선했다.

- [전체 생성 프롬프트·원본 경로](../../tools/nights_art_20261109_prompts.json)
- [게임용 21장·미리보기·프롬프트 묶음](../../artifacts/nights-art-20261109/nights-art-20261109.zip)
- [해상도·투명도·파일 해시](../../artifacts/nights-art-20261109/asset-checks.json)
- 원본 PNG: `artifacts/nights-art-20261109/sources/`
- 변환 도구: `tools/package_nights_art_20261109.py`
- 실제 화면 검증: `tests/nights_art_20261109_smoke.cjs`

## 검증 결과

- `node tests/nights_art_20261109_smoke.cjs`: 통과. 파일 실행에서 인물 6명의 얼굴·몸, 동료 3명의 초상, 후원자 하룬, 사건샷 9장의 표시·종료, 도감의 동료와 9장면을 확인했다. 페이지·콘솔 오류 0, 이미지 요청 실패 0.
- `tests/nights_smoke.js`: 통과. 명성 조건·거절·재방문·고래 구조·로크·골짜기·칼리프 후원·왕자와 공주 합류·거리 소문 분기를 확인했다. 로컬에 있는 `playwright-core`를 기존 시험의 `playwright` 별칭으로 실행했다.
- `git diff --check`: 통과. 시험용 브라우저는 `finally`에서 종료했고 남은 시험 과정도 없다.
- [실제 연결 검사 기록](../../artifacts/nights-art-20261109/runtime/checks.json) · [나디라 무릎상 화면](../../artifacts/nights-art-20261109/runtime/nadira_half.png) · [흑단 말 사건 화면](../../artifacts/nights-art-20261109/runtime/an_flight.png)

게시·배포는 이 작업에 포함하지 않는다.
