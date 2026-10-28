# 조총·무굴·고아와 말라카 이벤트 그림

2026-10-28. 내장 ImageGen으로 인물 원화 17장과 이벤트 장면 16장을 만들었다.
인물마다 같은 원화에서 얼굴상과 무릎상을 내보내므로 얼굴·옷차림이 일치한다.
기존 노부나가 얼굴상·무릎상도 조총 이벤트에서 함께 사용한다.

## 인물

| 사건 | 새 얼굴상·무릎상 |
|---|---|
| 조총 삼백 자루 | 젊은 기노시타 도키치로, 중년 하시바 히데요시 |
| 무굴 제국 성립 | 바부르, 후마윤, 우스타드 알리 쿨리, 이브라힘 로디 |
| 고아·말라카 | 알부케르크, 젊은 마가야네스, 아라우주, 티모자, 라술 칸, 마흐무드 샤, 아흐마드 샤, 니나 차투 |
| 고아·말라카 조연 | 아딜 샤의 사절, 중국 정크선 선장, 말라카의 벤다하라 |

얼굴상은 `images/portraits/history/<id>.webp`의 448×448, 무릎상은
`<id>_half.webp`의 1024×1536 투명 WebP다. 머리 장식·손·무릎에 여백을 둔다.
마가야네스는 노년의 경쟁 탐험가 초상 대신 인도 함대 시기의 전용 모습을 쓴다.
도키치로는 1573년 8월 이전의 젊은 모습, 이후에는 하시바 히데요시 모습을 쓴다.
노부나가는 기존 `portraits/legendary/oda_nobunaga`를 유지했다.

## 이벤트 샷

모두 `images/legend-events/<key>.webp`, 1881×836이다.

| 사건 | 그림 키 |
|---|---|
| 조총 | `teppo_offer`, `teppo_firing`, `teppo_hideyoshi` |
| 무굴 | `mughal_gunner`, `mughal_garden`, `mughal_sultan`, `mughal_panipat`, `mughal_crown` |
| 고아 | `goa_council`, `goa_keys`, `goa_mandovi`, `goa_catherine`, `goa_three_days` |
| 말라카 | `malacca_letter`, `malacca_bridge`, `malacca_flor` |

코친의 첫 회의에도 그림을 추가했다. 다른 장면은 기존 이벤트의 그림 키에
맞춰 연결했다. 이름만 표시되던 조연 세 명도 `G.Hist.speaker`로 연결했다.
전투·거래·날짜 조건·보상은 유지한다.

## 원화·제작 기록

- 기본 주문과 인물·장면 목록: `tools/history_event_art_prompts.json`
- 참조 이미지와 수정 주문, 생성 결과 경로: `artifacts/history-event-art-20261028/generated.json`
- 프로젝트에 보관한 PNG 원화: `artifacts/history-event-art-20261028/sources/portrait/`, `sources/scene/`
- 변환 도구: `tools/history_event_art.py` (외부 이미지 API를 호출하지 않는다)
- 규격·알파·얼굴 검출 기록: `artifacts/history-event-art-20261028/asset-report.json`
- 인물 모음: `artifacts/history-event-art-20261028/portrait-preview.jpg`
- 얼굴상 모음: `artifacts/history-event-art-20261028/face-preview.jpg`
- 장면 모음: `artifacts/history-event-art-20261028/scene-preview.jpg`
- 실제 게임 화면: `artifacts/history-event-art-20261028/runtime-preview.jpg`

처음 나온 고아 피난 그림의 후대 성당은 옛 데칸 도시 건물로 수정했다.
말라카 편지 장면에서 포로와 편지를 받는 선장이 같은 얼굴로 나온 부분도 분리했다.
무릎상의 투명 알파를 유지하며, 얼굴은 검출한 얼굴 위치를 기준으로 자른다.
원본 그림을 서로 늘이거나 몸 비율을 바꾸지 않는다.

## 검사

- `node tests/history_event_art_smoke.js`: 새 자산 50개의 등록·실제 디코딩·규격·무릎상 투명 여백과 세 사건의 실제 대화/액자를 확인한다.
- `node tests/teppo_smoke.js`: 조총 부탁·전달·노부나가/히데요시 갈래와 실제 사카이 화면.
- `node tests/mughal_smoke.js`: 무굴 이벤트의 거래·진영·파니파트·즉위·소식.
- `node tests/goamalacca_smoke.js`: 고아·말라카의 양쪽 진영·편지·피난·보물선 갈래.

실행 브라우저는 각 검사에서 `finally`로 닫는다. 배포는 수행하지 않는다.

위 네 검사 모두 통과했다. 새 파일 50개가 실제 브라우저에서 지정 규격으로
읽혔고, 조총·무굴·고아의 이벤트 액자 및 무릎상 대화 화면도 확인했다.
각 검사의 페이지·콘솔 오류는 0이다. 무릎상 17장의 눈·입 위치도 기존
`tools/portrait_faces.py --key … --merge`로 등록해 다른 인물의 위치를 보존했다.
