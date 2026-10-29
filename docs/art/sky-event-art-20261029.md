# 하늘을 재는 사람들 — 인물화와 이벤트 샷

2026-10-29. 새 천문학 이벤트의 공용 초상을 전용 초상으로 바꾸고, 미제작 장면 10종을 추가했다. 내장 ImageGen으로 원화 17장을 만들었다.

## 결과와 경로

- 얼굴상 7개: `images/portraits/history/sky_*.webp`, 1024×1024.
- 무릎상 7개: 같은 이름의 `*_half.webp`, 1024×1536 투명 배경. 종아리·발 없이 무릎단에서 끝난다.
- 이벤트 샷 10개: `images/legend-events/sky_*.webp`, 1881×836.
- 선택 원화: `artifacts/sky-event-art-20261029/sources/portrait/`, `sources/scene/`.
- 얼굴·무릎상·장면 모음: 같은 아티팩트 폴더의 `face-preview.jpg`, `portrait-preview.jpg`, `scene-preview.jpg`.

| 인물 | 파일 이름 |
|---|---|
| 레티쿠스 | sky_rheticus |
| 안드레아스 오시안더 | sky_osiander |
| 요하네스 페트레이우스 | sky_petreius |
| 티데만 기제 주교 | sky_giese |
| 종교재판관 | sky_inq |
| 풀젠치오 미칸치오 | sky_micanzio |
| 로데베이크 엘제비르 | sky_elzevir |

얼굴상은 같은 무릎상 원화의 얼굴을 잘라 만들어 외모를 일치시켰다. 기존 코페르니쿠스·케플러·갈릴레이 초상은 장면의 인물 참조로 썼다. 실존 인물의 얼굴과 복식은 게임 대사에 맞춘 창작 해석이며 역사적 복원을 주장하지 않는다. 종교재판관은 이름 없는 창작 역할 인물이다.

## 생성 지시문과 내보내기

전체 실제 지시문은 `tools/sky_event_art_prompts.json`의 `prompt`에 있다. 공통 요구는 사실적인 역사 모험 게임 화풍, 인물은 투명 배경의 무릎상, 장면은 사건 대사의 장소·행동·소품을 담은 2.25:1 구도다. 글자·UI·워터마크는 넣지 않는다.

`artifacts/sky-event-art-20261029/generated.json`에 실제 호출 지시문·참조·생성 원본 경로를 보관했다. 생성에 사용한 방식은 내장 `image_gen`이며 CLI/API 생성은 쓰지 않았다. 인물과 장면에 같은 이름 `sky_elzevir`가 있으므로 기록은 `portrait:`·`scene:` 접두사로 구별한다.

`python tools/sky_event_art.py`는 기존 역사 그림 내보내기를 재사용해 원화 보관, 비율을 유지한 규격 변환, 얼굴 자르기와 미리보기를 수행한다. 새 이미지 생성이나 얼굴 재묘사는 하지 않는다. `python tools/images.py`로 24개 파일을 등록했고, `tools/portrait_faces.py --key … --merge`로 이번 초상 14개의 눈·입 기준점을 추가했다.

## 연결과 검사

`js/systems/skylore.js`의 화자 7명에 전용 초상 키를 연결했다. 사건 조건·선택·기한·보상은 바꾸지 않았다. 장면은 기존 이벤트의 `scene()` 경로를 사용한다. `tools/audit_event_images.py`가 이 경로와 조건식으로 고르는 첫 책 장면까지 검사하도록 보완했다.

- `node tests/sky_smoke.js`: 기존 천문학 사건 분기·보상·옛 저장 호환, 실제 화자 7명의 초상 쌍, 장면 10종 호출과 사건 뒤 정리, 실제 베니스 대화 화면. 콘솔 오류 0.
- `node tests/sky_event_art_smoke.js`: 새 파일 24개의 브라우저 읽기·해상도·투명 여백, 얼굴 대화와 무릎상 및 장면 표시 캡처.
- `python tools/audit_event_images.py`: 전체 이벤트 장면 312종, 파일·등록 누락 0개.

검사 로그·캡처·결과 JSON은 `artifacts/sky-event-art-20261029/`에 보관한다. 브라우저는 각 검사의 `finally`에서 종료한다.
