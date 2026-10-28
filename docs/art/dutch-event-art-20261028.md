# 네덜란드 독립 이벤트 인물화와 장면

2026-10-28 제작 시작, 2026-10-29 검증 완료. 내장 ImageGen으로 인물 원화 5장과 장면 3장을 만들고 게임에 연결했다.

| 인물 | 얼굴상·무릎상 경로 | 모습 |
|---|---|---|
| 할리나 | `images/portraits/legendary/halina{,_half}.webp` | 붉은 웨이브 머리, 밝은 표정, 몸에 맞는 남색 사서풍 드레스, 책과 장부 |
| 페르베르크 | `images/portraits/legendary/verberk{,_half}.webp` | 금발, 내려다보는 미소, 검붉은 귀족 드레스, 부채, 책을 밟는 한쪽 부츠 |
| 얀 | `images/portraits/history/nl_jan{,_half}.webp` | 금발 선원, 회색 외투, 류트와 초승달 메달 |
| 피터르 | `images/portraits/history/nl_pieter{,_half}.webp` | 갈색 머리 상인, 걱정스러운 표정, 장부와 밀 이삭 |
| 디르크 | `images/portraits/history/nl_dirk{,_half}.webp` | 짧은 턱수염 장교, 흉갑과 붉은 띠, 모리온 투구와 검 |

사용자 사진은 표정·머리·자세의 참고로 사용했다. 두 여성은 성인 창작 인물로 묘사했다. 페르베르크의 첫 생성은 도구의 안전 필터로 중단되어, 신체 강조를 제외하고 창작 귀족 인물의 복식·표정·책을 밟는 동작으로 조정했다. 최종 페르베르크는 사진을 직접 재현한 얼굴이 아니다.

무릎상은 투명 알파를 보존한 1024×1536이며 같은 원화에서 얼굴상 448×448을 잘랐다. 네 인물은 무릎단에서 끝나고, 페르베르크만 사용자 요청에 따라 들어 올린 발 하나와 책을 화면 안에 보이게 했다. 반대편 다리는 무릎단에서 끝난다. 세로 압축이나 머리만 확대하는 보정은 쓰지 않았다.

장면은 `images/legend-events/dutch_summer.webp`(시장 논쟁), `dutch_canal.webp`(밤 운하), `dutch_manor.webp`(곳간)의 세 장이며 모두 1881×836이다. 원화의 얼굴·복식을 참조해 같은 인물이 이어지도록 만들었다. 시장 장면에도 페르베르크가 책을 밟는 동작을 반영했다. 기존 사건의 선택·날짜·보상은 유지하고 머릿수건·드레스 묘사만 새 복식에 맞췄다.

생성 지시문은 `tools/dutch_event_art_prompts.json`, 실제 호출과 선택 원화는 `artifacts/dutch-event-art-20261028/generated.json`, 보관 원화는 같은 폴더의 `sources/portrait`, `sources/scene`에 있다. 첨부 사진은 `references/face-reference-1.png`, `face-reference-2.png`에 보관했다. `python tools/dutch_event_art.py`는 생성 API를 호출하지 않고 선택된 원화를 내보낸다. `python tools/images.py`로 등록하고 `tools/portrait_faces.py --key … --merge`로 이번 10개 초상의 얼굴 기준점만 갱신했다.

검증:

- `node tests/dutch_event_art_smoke.js`: 이미지 13개의 읽기·규격·투명 여백, 5명 대화 얼굴상·무릎상, 장면 3종의 실제 표시 통과. `pageerror`·`console.error` 0건. 전체 역사 화자 100명의 초상 쌍 누락 0명.
- `node tests/dutchwar_smoke.js`: 두 편의 이벤트 진행·전투 승패·청혼·동료 영입·독립 시점·기한·옛 저장 검사 통과. 이 환경의 Chrome 경로를 `BROWSER_EXE`로 지정했다.
- `python tools/audit_event_images.py`: 전체 장면 274개 파일·등록 누락 0개.
- 테스트 브라우저는 `finally`에서 종료했다.

결과는 `artifacts/dutch-event-art-20261028/browser-results.json`, `art-smoke.log`, `event-smoke.log`, `event-image-audit.json`에 있다. 미리보기는 `face-preview.jpg`, `portrait-preview.jpg`, `scene-preview.jpg`, 실제 화면은 `*-in-game.png`다.
