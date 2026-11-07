# 07 발견 유물 그림 411장 — 동물의 새끼 · 전설 생물의 물건 · 종교 성물 (2026-11-07 사용자 요청)

## 완료 (2026-11-07)
- ImageGen으로 411장 제작: 전설 물건 46장 · 동물의 새끼 209장 · 종교 성물 156장. 원본 PNG와 256×256 투명 WebP 저장 완료.
- `images/manifest.js`와 제작 기록을 갱신했다. 제작 기록은 기존 387개를 포함해 총 798개다.
- 밝은 배경과 어두운 배경에서 전체 아이콘을 검수했다. 새끼의 형태·색과 펼친 경전 10종을 보정하고, 배경 흔적이 남은 4종을 수정했다. 수정 전 그림은 작업 폴더의 `revisions/`에 보관했다.
- `node tests/disc_relics_smoke.js`: 13개 통과. `ART=1 node tests/disc_relics_smoke.js`: 14개 통과(411개 그림 모두 있음).
- 호랑이·인어·노트르담을 실제 발견 처리해 발견 카드와 소지품 화면 6장을 확인했다. 콘솔 오류 0건, 검사용 브라우저 종료 완료.
- [전체 점검판](../art/disc-relics-20261107-preview.jpg) · [게임 화면 및 검증 결과](../art/disc-relics-20261107-game/verification.json) · 재현 도구 `tools/disc_relics_20261107/verify_game.js`.

## 왜
발견물을 찾으면 손에 넣는 유물을 세 갈래로 늘렸다 (규칙·글은 Claude가 끝냄 — `js/data/discrelics.js`, `js/data/relics.js`, `js/systems/discovery.js`).

| 갈래 | 수 | 무엇 | 유물 id |
|---|---|---|---|
| 동물의 새끼 | 209 | 실제 동물을 찾으면 그 새끼를 데려온다. 개는 강아지, 말은 망아지, 곤충은 애벌레, 물고기는 치어 | `r_<발견>_baby` |
| 전설 생물의 물건 | 46 | 전설·미신의 생물과 공룡·매머드는 새끼 대신 물건 하나 (용의 비늘 · 티라노사우루스 이빨 화석 · 인어의 귀걸이 …) | `r_<발견>_legend` |
| 종교 성물 | 156 | 성당·모스크·절·사원·신전에 있을 법한 성물이나 경전 (십자가 목걸이 · 은촛대 · 시도서 · 꾸란 필사본 · 염주 · 마니차 …) | `r_<발견>_holy` |

지금은 그림 파일이 없어 `G.Art.relicArt`가 코드로 대충 그린다. **411장 모두 원화로 바꾸는 것이 이 작업이다.** 코드는 고치지 않는다.

## 자료
- **프롬프트·목록:** `tools/disc_relics_20261107/prompts.json` — 항목마다 `id`(유물 id) · `name` · `kind` · `description` · `group`(baby·legend·faith) · `target`(원본 png 자리) · `file`(게임 그림 자리) · `prompt`(ImageGen에 그대로 넣는 글).
- **사람이 보는 목록:** `docs/art/disc-relics-20261107-list.md`
- 이름·설명을 고치려면 `js/data/discrelics.js`를 직접 고치지 말고 `tools/disc_relics_20261107/`의 `legend.js`(전설 46) · `religion.js`(종교 갈래 나눔) · `gen.js`(새끼 이름 규칙·종교 성물 틀)를 고친 뒤 `node gen.js && node emit.js` — `js/data/discrelics.js` · `prompts.json` · 목록 md가 함께 다시 만들어진다. 유물 id는 바꾸지 않는다(저장 호환).

## 그리는 법 (기존 유물 아이콘 387종과 같은 화풍)
1. `prompts.json`의 `prompt`로 ImageGen 원화를 만들어 `target`(`tools/disc_relics_20261107/sources/<id>.png`)에 둔다. 투명 배경 정사각형.
2. `python tools/prepare_relic_icon.py tools/disc_relics_20261107/sources/<id>.png images/relics/<id>.webp` — 256×256 투명 WEBP로 잘라 맞춘다.
3. 다 넣은 뒤 `python tools/images.py` 로 `images/manifest.js`를 다시 만든다 (그래야 게임이 그림을 찾는다).
4. 점검판: 411장을 한 장에 모은 `docs/art/disc-relics-20261107-preview.jpg` (갈래별로 줄을 나눠서).

## 갈래별 주의
- **새끼 (baby):** 그 종이 틀림없이 알아보이게 — 무늬·색·귀·발 수를 실제 동물대로. 새끼답게 귀엽되 만화처럼 눈을 키우지 않는다. 우리·사람·글자 없음.
  - 강아지·새끼 고양이·망아지는 품종이 드러나게. 새끼 고양이는 작은 버들 바구니에.
  - 물짐승(고래·돌고래·바다코끼리 …)은 물에서 막 건진 듯 젖은 몸만, 통·물결은 그리지 않는다.
  - 치어는 코르크 마개 유리병 속 작은 물고기 몇 마리. 애벌레는 잎 한 장 위에.
- **전설 (legend):** **생물을 그리지 않는다.** 남긴 물건 하나만 (비늘·뿔·이빨·깃털·귀걸이·화석 …). 화석은 돌이 된 뼈·이빨의 결이 보이게.
- **성물 (faith):** 그 종교·지역·시대의 솜씨로 (가톨릭 / 정교회 / 이슬람 / 불교 / 티베트 불교 / 힌두 / 시크 / 유교 제례 / 도교 / 옛 지중해 신전 / 옛 아메리카·태평양 신전 — 프롬프트에 적혀 있다). 이슬람 성물에는 사람·짐승 그림을 넣지 않는다. 예언자의 얼굴은 어디에도 그리지 않는다. 경전·기도서는 펼친 책이나 두루마리로 글자를 읽을 수 없게 흐리게.

## 넣는 곳
1. `images/relics/<id>.webp` 411장 (같은 이름 — 코드는 고치지 않는다).
2. `images/manifest.js` 다시 만들기 (`python tools/images.py`).
3. `docs/art/disc-relics-20261107-preview.jpg` 점검판, `docs/art/relic-icons-generation.json`의 `assets`에 411개 덧붙이기(`total`도).
4. 확인: `node tests/disc_relics_smoke.js` 그리고 `ART=1 node tests/disc_relics_smoke.js` — 「images/relics/ 그림 모두 있음」이 통과해야 한다. 게임에서 호랑이·인어·노트르담을 찾아 발견 카드와 소지품에 그림이 뜨는 화면을 찍는다.

## 하지 않을 것
- 유물 id·이름·값·종류를 바꾸지 않는다 (바꿀 일이 있으면 위의 생성 도구로, Claude에게 알리고).
- 예전 유물 387종의 그림은 건드리지 않는다.
