# tools/heritage — 발견물·유물에 실제 자료 입히기

발견물 191곳과 유물 125점을 실제 세계유산·생물·박물관 소장품 자료와 잇습니다.

| API | 쓰는 곳 |
|---|---|
| UNESCO 세계유산 (data.unesco.org `whc001`, 대체: whc.unesco.org/en/list/xml) | 세계유산 번호·등재 연도·기준·나라·설명 → 「세계유산 기록」 |
| Wikipedia / MediaWiki Action API | 요약·한국어 문서 이름·대표 사진(위키미디어 공용, 재사용 가능한 라이선스만) |
| The Met Collection API | 유물을 실존 소장품(공공 영역)으로 |
| Smithsonian Open Access API | 유물을 실존 소장품(CC0)으로 — 환경 변수 `SI_API_KEY` (없으면 DEMO_KEY, 하루 50번) |
| GBIF API | 동식물·교역품의 학명·분류·관찰 기록 수·사진(CC0·CC BY) |
| OBIS API | 바다 생물의 바다 관찰 기록 수·깊이 |

## 순서
1. `python tools/heritage/fetch.py` — 인터넷이 되는 PC에서. 캐시(`cache/`)가 있어 끊겨도 다시 실행하면 이어서 합니다.
   - `images/discoveries/ID.jpg`(1440×640), `images/relics/유물ID.jpg`(512×512)를 저장합니다. 사람이 넣은 그림은 덮어쓰지 않습니다.
   - 끝나면 `tools/images.py`, `tools/heritage/build.py`를 저절로 실행합니다.
   - 사진 크기를 맞추려면 Pillow가 있어야 합니다 (`pip install pillow`). 없으면 받은 크기 그대로 저장합니다.
2. `out/report.md`를 보고 어긋난 항목은 `sources.py`를 고쳐 `--only ID`로 다시 모읍니다.
3. `ko.json`에 한국어 글을 씁니다(Claude에게 맡기면 `out/raw.json`을 읽고 씁니다).
   - `desc` 게임 속 설명(그 시대 사람이 보는 말투), `record` 세계유산 기록(오늘날의 사실), `lore` 덧붙일 이야기, 유물은 `name`·`desc`.
4. `python tools/heritage/build.py` → `js/data/heritage.js`.

## 저작권
- UNESCO 설명은 CC BY-SA 3.0 IGO, 위키백과 글은 CC BY-SA 4.0입니다. 게임에는 그대로 옮기지 않고 한국어로 새로 쓰며, 출처를 발견 카드와 도감에 표시합니다. 새로 쓴 글도 같은 조건으로 공개합니다.
- 사진은 공공 영역·CC0·CC BY·CC BY-SA만 받습니다(비영리·변경 금지 조건은 거릅니다). 작가·라이선스·원본 링크가 카드와 도감에 함께 나옵니다.
- 사진을 모두 받으면 수십 MB가 되므로, claude.ai 아티팩트용 한 파일판(16MB 제한)은 `tools/slim.py`로 줄인 사본을 씁니다.
