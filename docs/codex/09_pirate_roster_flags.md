# 09 이름난 해적 초상 · 해적 깃발 그림 (2026-11-10 사용자 요청)

## 왜
이름난 해적을 바다마다 2.5배로 늘렸다 (규칙·글은 Claude가 끝냄). 지금은 해적 얼굴이 역할·양식으로 지은 공용 얼굴이고, 해적 깃발은 코드가 대강 그린다.
**해적마다 전용 초상, 해적단마다 깃발 그림을 그려 넣는 것이 이 작업이다.** 코드는 고치지 않는다 — 파일만 같은 이름으로 넣으면 게임이 찾아 쓴다.

| 무엇 | 수 | 자료 |
|---|---|---|
| 이름난 해적 (역사 인물 + 지어낸 해적) | 135명 (+소굴 간부 21 = 바다의 명부 156) | `js/data/seacaptains.js`(예전 32명) · `js/data/pirate_roster.js`(새 103명, 모두에 성별·해적단·생김새) |
| 소굴의 간부·두목 | 간부 21 · 두목 14 | `js/data/pirate_lairs.js` (생김새는 `pirate_roster.js`의 LAIR_LOOK · CHIEF_LOOK) |
| 해적단 = 해적 깃발 | 68개 (역사 이름 46 · 지어낸 이름 22) | `js/data/pirate_roster.js`의 `G.PIRATE_BANDS` — 이름·이름의 뿌리·**깃발 모양** |

바다별 이름난 해적 수: 지중해 43 · 대서양 32 · 북해 16 · 카리브 30 · 인도양 22 · 동남아시아 18 · 동아시아 25 (여러 바다에 걸친 사람은 바다마다 센다).

## 자료
- **그릴 목록·프롬프트:** `tools/pirate_roster_20261110/prompts.json`
  - `portraits[]` — `id` · `name` · `kind`(named 이름난 해적 / lair_mate 소굴 간부 / lair_chief 소굴 두목) · `gender` · `zones` · `years` · `historical` · `band` · `look`(생김새·옷·성격) · `face` · `half` · `have`(이미 그림이 있으면 true — 건너뛴다) · `prompt`
  - `flags[]` — `id`(아이템 id) · `band` · `name` · `zone` · `real` · `basis` · `design`(**깃발 모양 — 이대로 그린다**) · `members` · `file` · `have` · `prompt`
- **사람이 보는 목록:** `docs/art/pirate-roster-20261110-list.md` (바다별 해적 표 · 해적단과 깃발 표, 「그릴 것」 표시)
- 이름·성별·생김새·깃발 모양을 고치려면 `js/data/pirate_roster.js`를 고친 뒤 `node tools/pirate_roster_20261110/gen.js`로 두 파일을 다시 만든다.

## 그리는 법
### 해적 초상 (경쟁 탐험가 초상과 같은 규칙 — `images/portraits/rivals/PROMPT.md`)
1. `prompts.json`의 `portraits` 가운데 `have: false`인 사람을 `prompt`로 그린다. 기준 그림은 `크리스토발 콜론.webp` · `크리스토발 콜론_half.webp`.
2. `images/portraits/rivals/<이름>.webp` — 384×384 얼굴 (불투명 RGB) · `images/portraits/rivals/<이름>_half.webp` — 1024×1536 무릎상 (투명 RGBA).
   파일 이름은 `name` 그대로 (띄어쓰기 포함). 게임은 바다에서 만날 때(신호·대화창)와 식당 현상수배 벽보에서 이 그림을 쓴다 (`js/systems/seacaptains.js` CP.speaker).
3. **성별(`gender`)을 꼭 지킨다.** 여해적 27명: 그레이스 오말리 · 사이이다 알후라 · 앤 보니 · 메리 리드 · 정일수 · 소굴 두목 넷 · 지어낸 여해적 18명.
4. 역사 인물은 그 사람의 시대·나라·종교에 맞는 옷과 무기로 (오스만 레이스는 터번·카프탄, 버커니어는 셔츠·커틀러스, 왜구는 일본·명나라 옷이 섞임 …). `look`의 나이·수염·특징(외팔·나무다리·안대 등)을 그대로.
5. 지어낸 해적은 해적단 이름의 뿌리(세이렌·크라켄·구미호·두리안 …)를 소품·문신·장신구로 살짝 드러낸다 — 괴물 자체를 그리지는 않는다.

### 해적 깃발 (아이템 그림)
1. `prompts.json`의 `flags`를 `prompt`로 그린다 — 짧은 나무 깃대에 매달려 살짝 나부끼는 천 깃발 하나, 바다에 바랜 천 결.
2. `images/items/flag_<해적단>.webp` — 256×256 투명 WebP (다른 아이템 그림과 같은 크기·화풍). 소지품·식당 벽보(26·64px)에도 쓰이므로 **48px로 줄여도 그림이 읽혀야** 한다.
3. **`design`에 적힌 모양을 그대로** — 바탕색·그림·위치. 「…을 본뜸」·「…로 전하는 도안」은 역사 근거가 있는 모양이니 고증대로, 「지어낸 도안」은 그 뜻(이름의 뿌리)이 보이게.
   - 글자가 들어가는 깃발은 셋뿐: 하치만 왜구(세로 「八幡大菩薩」) · 리베르탈리아(「A DEO A LIBERTATE」) · 임씨·유향·홍기방·십팔지·무라카미(한자 한 자).
4. 지금 코드가 그리는 임시 깃발(`G.Wanted.flagArt`, js/systems/pirate_wanted.js)은 색·배치의 참고일 뿐이다.

## 넣는 곳
1. `images/portraits/rivals/<이름>.webp` · `<이름>_half.webp` (그릴 것 165명쯤 — `have`로 확인), `images/items/flag_<해적단>.webp` 68장.
2. `python tools/images.py` 로 `images/manifest.js`를 다시 만든다 (그래야 게임이 그림을 찾는다).
3. `node tools/pirate_roster_20261110/gen.js` 를 다시 돌려 목록의 「있음」을 갱신한다.
4. 점검판: 깃발 68장을 한 장에 — `docs/art/pirate-flags-20261110-preview.jpg`, 초상은 바다별로 `docs/art/pirate-portraits-20261110-<바다>.jpg`.
5. 확인: `node tests/pirate_wanted_smoke.js` (명부·벽보·소문·깃발) · `node tests/rival_captains_smoke.js` · 게임에서 리스본 식당 「현상수배 벽보를 본다」를 열어 초상과 깃발이 보이는지, 소지품에서 깃발 그림을 본다. 콘솔 오류 0, 검사용 브라우저는 닫는다.

## 하지 않을 것
- 해적 id·이름·해적단 id·아이템 id를 바꾸지 않는다 (바꿀 일이 있으면 `pirate_roster.js`를 고치고 Claude에게 알린다).
- 이미 있는 초상(`have: true` — 바르바로사·오루츠·투르구트·울루츠 알리·카라 호자 등)은 다시 그리지 않는다.
- 실존 인물을 지어낸 모습으로 꾸미지 않는다 (예: 검은 수염의 도화선 수염, 앤 보니의 붉은 머리처럼 전하는 특징을 지킨다).
