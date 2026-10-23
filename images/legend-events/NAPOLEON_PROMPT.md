# 나폴레옹과 조제핀 — 그림 주문서 (2026-10-23)

사건: `js/systems/napoleon.js` · 사람: `js/data/napoleon.js`. 그림을 넣기만 하면 바로 쓰인다(코드 수정 없음). 없으면 장면 그림은 건너뛰고, 얼굴은 그린 얼굴(지금은 어른 군인처럼 보임)로 대신한다.

## 얼굴상·무릎상 (images/portraits/legendary/)

Codex 내장 이미지 생성기로 2026-10-23에 만들었다. 투명 원본은 `artifacts/legendary-portraits/`에 보존하고, `tools/legendary_portraits.py`가 같은 인물 원화에서 448×448 얼굴상과 1024×1536 무릎상을 만든다. 나폴레옹과 조제핀의 얼굴은 사용자가 첨부한 얼굴 사진을 참고하되, 옷과 배경은 가져오지 않았다.

| 파일 | 사람 | 실제 제작 모습 |
|---|---|---|
| `napoleon` · `napoleon_half` | 젊은 나폴레옹 보나파르트 | 첨부 남성의 검은 헝클어진 머리·회청색 눈·섬세한 얼굴. 몸에 조금 큰 남색 초년 포병 장교복의 단추를 급히 채우고, 팔에는 찌그러진 이각모와 해도를 함께 끼웠다. 한쪽 무릎을 안으로 굽힌 비대칭 자세이며 황제식 손 넣기·월계관·훈장은 쓰지 않았다 |
| `josephine` · `josephine_half` | 조제핀 드 보아르네 | 첨부 여성의 밝은 피부·풍성한 연갈색 웨이브·관능적이고 여유로운 표정. 몸을 크게 비튼 S자 자세, 풍만한 성인 체형, 가슴선이 깊고 넓게 파인 화려한 백색·상아색 비단 드레스, 진주·레이스·부채. 얌전한 정면 자세는 피했다 |
| `letizia_bonaparte` · `letizia_bonaparte_half` | 레티치아 보나파르트 | 검은 레이스 베일과 흑색·버건디 드레스. 한 손은 열쇠 꾸러미를 쥐고 다른 손은 앞으로 내밀어 경고하며, 구출 직후의 안도·분노·통제를 함께 보인다 |
| `joseph_bonaparte` · `joseph_bonaparte_half` | 조제프 보나파르트 | 나폴레옹과 닮았으나 더 차분하고 나이 든 형. 가족을 등 뒤로 감싸며 몸을 옆으로 크게 튼 자세, 장부를 가슴에 안은 검갈색 민간 신사복 |

### 최종 생성 프롬프트 세트

네 장 공통: `production-ready transparent-background character portrait for a historical adventure or romance game, vertical 2:3 head-to-knees cutout, complete head and both hands visible, knees near the lower edge, true transparent alpha, premium semi-realistic digital oil painting, polished European historical-romance game art, accurate hands and anatomy, cinematic light, crisp silhouette, no scenery, floor, border, text, watermark, cropped head or hands.`

- 나폴레옹: `Use the attached young man's face as the primary facial reference: youthful fine-boned beauty, pale skin, striking blue-gray eyes, tousled black hair, clean-shaven. An adult young Napoleon around 19, short and slender. Avoid a formal pose: twist sharply while trying to button an oversized navy junior artillery coat; trap a rolled battle map and slightly crushed plain bicorne under one elbow. Crooked cravat, one misaligned button, sleeves too long, awkward belt, scuffed clothes, one knee angled inward. Fierce concentration, embarrassed flush, ambition in the eyes. No emperor pose, hand in coat, laurel, crown, grand medals or imperial splendor.`
- 조제핀: `Use the attached adult woman's face as the primary reference: fair soft features, warm eyes, full lips, loose chestnut-blonde waves, flirtatious self-possession. An unmistakably adult Josephine in her late twenties, glamorous and sensuous. Absolutely avoid a conservative straight-on pose: pronounced S-curve, hips turned away and shoulders twisted back, one hand lifting lace and pearls, the other high at the waist with a half-open mother-of-pearl fan, leaning toward the viewer as if sharing a dangerous secret. Voluptuous large-busted adult figure in an exceptionally ornate white and ivory silk gown with lavish lace, pearls, floral embroidery and a daring very deep, wide decolletage; provocative but covered. Direct half-lidded eye contact, raised brow, knowing half-smile. No modern shorts or exposed underwear.`
- 레티치아: `Letizia Bonaparte, adult Corsican matriarch in her early forties. Avoid a conventional formal pose: stepping forward from a ship hold on a strong diagonal, black lace veil whipping sideways, one hand gripping heavy household keys, the other thrust forward in warning. Handsome severe face, dark intelligent eyes, pinned dark hair; exhausted relief, maternal fury and iron control. Black late-18th-century matron dress, velvet, burgundy lining, jet beads, practical wear from captivity.`
- 조제프: `Joseph Bonaparte, adult Corsican gentleman around 23. Avoid a stiff aristocratic pose: pivot sideways to place himself between younger siblings and danger, one arm stretched protectively behind him while the other snaps a leather account book to his chest, coat flaring. Resembles Napoleon but has a longer calmer face, tied dark wavy hair and warm brown eyes. Understated charcoal-brown frock coat, wine waistcoat, imperfect cravat and worn belt, no military decorations.`

## 장면 그림 (images/legend-events/, 1881×836 · 다른 장면 그림과 같은 화풍)

| 파일 | 장면 | 나오는 곳 |
|---|---|---|
| `napoleon_rescue.webp` | 포연이 걷힌 코르시카 앞바다. 가라앉는 해적선 둘레에 부서진 돛대 조각, 거기 매달린 소년에게 선원들이 밧줄을 던진다. 멀리 코르시카의 산 | 해적을 포격으로 이긴 뒤 |
| `napoleon_family.webp` | 빼앗은 해적선의 어두운 짐칸. 부서진 문틈의 빛, 검은 옷의 어머니가 아이들을 품에 안고, 젖은 소년이 달려가 안긴다 | 해적을 백병전으로 이긴 뒤 |
| `josephine_salon.webp` | 빈의 살롱. 수백 개의 촛불, 현악 사중주, 부채를 든 여인이 웃음 한가운데 서 있고, 작은 소년 장교가 넋을 잃고 바라본다 | 오스트리아 도시에 들어설 때 |
| `napoleon_duel.webp` | 새벽 안개 낀 도나우 강가 부두. 칼을 든 작은 소년과 제독이 마주 서고, 뒤에서 여인이 부채를 들고 지켜본다 | 일기토 |

### 장면 그림 최종 생성 기록 (2026-10-24)

- 모드: Codex 내장 ImageGen `generate`
- 공통 규격: `1881×836`(9:4), 반사실적 디지털 유화, 영화적 조명, 18세기 말 재질과 복식, 글자·UI·로고·워터마크 없음
- 인물 참조: 기존 `napoleon_half`, `josephine_half`, `letizia_bonaparte_half`, `joseph_bonaparte_half`는 얼굴과 복식 단서에만 사용하고 초상 배경과 구도는 복사하지 않음
- `napoleon_rescue`: 코르시카 해전 뒤 파도 속 부서진 돛대에 매달린 젊은 나폴레옹에게 선원들이 밧줄을 던지는 비폭력 구조 장면
- `napoleon_family`: 빼앗은 해적선 짐칸의 문틈 빛 아래 레티치아와 동생들에게 달려가 안기는 나폴레옹, 곁을 지키는 조제프와 열린 쇠사슬
- `josephine_salon`: 수백 촛불과 현악 사중주가 있는 빈의 살롱, 부채를 든 성인 조제핀을 보고 얼어붙은 젊은 나폴레옹
- `napoleon_duel`: 새벽 안개 낀 도나우 부두, 상처 없이 칼을 맞댄 나폴레옹과 성인 제독, 안전한 거리에서 지켜보는 조제핀
