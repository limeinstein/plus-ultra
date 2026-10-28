# 역사 이벤트의 빠진 인물화·장면 보완

2026-10-29 제작·연결·검증 완료. 내장 ImageGen을 사용했으며 선택 원화 53장을 저장소에 보관했다. 게임용 결과는 얼굴상 25개·무릎상 25개·이벤트 샷 28개, 총 78개다.

처음 대조에서는 등록된 장면 274개와 역사 화자 100명의 초상 쌍에 파일 누락이 없었다. 공용 사제 얼굴을 쓰던 가디너 등 3명과 아직 전용 장면 연결이 없던 튜더·바르바로사·칼레·레판토 장면을 보완했다. 작업 중 새로 추가된 신대륙·명말·포토시 사건도 확인하여, 해당 사건의 실제 누락 18장과 인물 초상을 함께 제작한다.

| 묶음 | 새 인물 초상 쌍 | 새 장면 |
|---|---:|---:|
| 튜더·바르바로사·칼레·레판토 | 3 | 10 |
| 신대륙 발견과 그 뒤 | 6 | 7 |
| 명의 붕괴와 마지막 편지 | 7 | 6 |
| 포토시 은광 | 9 | 5 |
| 합계 | 25 | 28 |

얼굴상은 1024×1024, 무릎상은 1024×1536 투명 WebP다. 같은 인물 원화에서 두 종류를 만든다. 이미 1024×1024였던 얼굴상은 작업 중에도 해상도를 줄이지 않도록 원본 1024×1536 생성본에서 다시 내보낸다. 무릎상은 무릎단에서 끝내고 종아리·발을 제외한다. 세로 압축이나 머리만 확대하는 보정은 쓰지 않는다. 장면은 1881×836이며 해당 인물 원화를 얼굴·복식 참조로 사용한다.

콜럼버스·진원원·기존 제독·군주의 전용 초상은 재사용한다. 새로 그리는 역할 인물(위병·궁녀·문지기·기병·감찰관 등)은 실제 역사 인물과 구별하여 `fiction: true`로 기록했다. 차스카는 기존 사건의 성인 창작 인물로, `portraits/legendary/chaska`에 연결한다. 다른 새 인물은 `portraits/history/<id>`다. 역사·시대 배경은 저장소의 게임 대사와 복식 설명에 기반한 게임용 해석이며, 얼굴의 역사적 복원을 주장하지 않는다.

## 원화·지시문·내보내기

- 첫 묶음: `tools/history_gap_art_prompts.json`, `artifacts/history-gap-art-20261029/generated.json`, `sources/portrait`, `sources/scene`.
- 새 세 사건: `tools/history_addon_art_prompts.json`, `artifacts/history-addon-art-20261029/generated.json`, `sources/portrait`, `sources/scene`.
- 실제 생성 도구: 내장 ImageGen. 실제 호출 지시문·참조 이미지·선택 원화 경로는 각 `generated.json`에 저장한다.
- 내보내기: `python tools/history_gap_art.py`, `python tools/history_addon_art.py`. 생성 API를 호출하지 않는다.
- 등록: `python tools/images.py`. 얼굴 기준점은 이번 인물 키만 `tools/portrait_faces.py --key … --merge`로 갱신한다.
- 미리보기: 각 아티팩트 폴더의 `face-preview.jpg`, `portrait-preview.jpg`, `scene-preview.jpg`.

## 연결과 검증

`G.Hist.withScene`이 역사 장면을 준비하고 대사·선택이 끝나면 `finally`에서 정리한다. 튜더·바르바로사 사건과 칼레·레판토의 양측 작전 회의에 그림을 연결했다. `tools/audit_event_images.py`는 `withScene`과 `councilPic`·`foePic` 자료의 짧은 이름도 검사한다.

신규 세 사건의 이름 없는 대사 화자에게도 전용 얼굴상·무릎상을 연결했다. 사건 날짜·선택·보상 수치는 바꾸지 않는다.

검증 결과:

- `node tests/history_gap_art_smoke.js`: 첫 묶음 16개 파일의 읽기·규격·투명 여백, 10개 표시 사례 통과.
- `node tests/history_addon_art_smoke.js`: 새 세 사건 62개 파일과 29개 표시 사례 통과. 차스카·진원원은 실제 동료 화자를 쓰고 콜럼버스는 기존 경쟁 탐험가 화자를 쓴다.
- 위 두 검사에서 `pageerror`·`console.error` 0건. 전체 역사 이벤트 화자 124명의 얼굴상·무릎상 쌍 누락 0명.
- `node tests/history_gap_flow_smoke.js`: 실제 사건 진입으로 장면 10종과 새 화자 3명의 연결, 진행 상태·작전 회의·선택 뒤 정리·중단 예외 뒤 정리·없는 그림 대체를 확인했다. 콘솔 오류 0건.
- `tests/newworld_smoke.js`, `mingfall_smoke.js`, `potosi_smoke.js`: 선택 분기·기한·동료 영입·보상·옛 저장·소식 검사 통과. 이 환경의 Chrome 경로를 `BROWSER_EXE`로 지정했다.
- `tests/potosi_art_smoke.js`: 포토시 주요 인물 6명과 장면 5종의 별도 표시 검사 통과. 얼굴상은 기존 1024×1024 해상도를 유지하고, 장면은 공용 내보내기 규격 1881×836을 검사한다.
- `python tools/audit_event_images.py`: 전체 장면 302종 파일·등록 누락 0개.
- `node tests/historical_naval_portraits_smoke.js`: 기존 제독들의 초상 재사용 연결 통과.

결과는 각 아티팩트 폴더의 `browser-results.json`, `flow-results.json`, `*-smoke.log`, `event-image-audit.json`, `asset-report.json`에 보관했다. 테스트 브라우저는 모두 `finally`에서 종료했으며 남은 테스트 과정이 없는 것도 확인했다.

합친 미리보기는 `python tools/preview_history_missing_art.py`로 다시 만든다. `artifacts/history-missing-art-20261029/face-preview.jpg`, `portrait-preview.jpg`, `scene-preview.jpg`, 대표 장면 아홉 장의 `overview.jpg`를 제공한다.
