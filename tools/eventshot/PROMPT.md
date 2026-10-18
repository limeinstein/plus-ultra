# 공주 장면 이벤트 샷 (선택) — images/events/princess/

그림이 없어도 게임은 있는 그림(배경 + 인물 무릎상 + 빛)으로 장면을 꾸려 보여 준다 (js/art/eventshot.js).
아래 이름으로 그림을 넣으면 그 장면에서 꾸린 그림 대신 그 그림이 뜬다. 넣은 뒤 `python tools/images.py`로 목록을 다시 만든다.

| 파일 | 장면 | 나오는 사람 |
|---|---|---|
| `es_rescued.webp` | 홍해 해적 요새에서 사라진 왕녀(블랑카)를 구한 순간 | 제독 · 블랑카 왕녀 |
| `es_return.webp` | 세빌리아 왕궁, 왕녀의 귀환 | 블랑카 왕녀 · 에스파냐 국왕 |
| `es_wedding.webp` | 왕녀와의 혼례 (부마) | 제독 · 블랑카 왕녀 |
| `eliz_tower.webp` | 런던 탑 종탑 방에 갇힌 엘리자베스 공주 (밤) | 엘리자베스 공주 |
| `eliz_safe.webp` | 공주를 피신시킨 잉글랜드 항구 (요크·브리스틀·사우샘프턴·플리머스) | 제독 · 엘리자베스 공주 |
| `eliz_knight.webp` | 여왕이 된 엘리자베스 1세가 제독을 기사로 서임 | 제독 · 엘리자베스 1세 |
| `court_rescue.webp` | 해적에게서 구해 온 왕녀가 궁정으로 돌아옴 (왕명 「구출」) | 제독 · 그 나라의 왕녀 |
| `royal_wedding.webp` | 왕녀가 직접 전하는 두 왕실의 혼인 소식 | 그 왕녀 |

- 크기: 1512×672 (액자 비율 576:256), webp, 품질 82 안팎. 위 30% 쯤에 얼굴이 오게.
- 화풍: 게임의 인물·실내 그림과 같은 사실적 유화풍. 원작 게임(대항해시대 시리즈)의 그림·구도·인물을 베끼지 않는다.
- 실제 역사 인물(엘리자베스 1세 등)은 게임 안의 초상과 같은 차림·머리색으로 — 사진 같은 실존 인물 얼굴을 그대로 쓰지 않는다.

## 프롬프트 예 (영문)
- es_rescued: `A 16th-century sea captain helping a Spanish princess in a dusty gown out of a pirate fortress storeroom on the Red Sea coast, dusk light, stormy sea behind, painterly realistic oil painting, wide 2.25:1, no text`
- eliz_tower: `A young Tudor princess in a red gown standing by a narrow window of a stone tower room at night, the Tower of London and the Thames outside in moonlight, candle light, painterly realistic, wide 2.25:1, no text`
- eliz_knight: `A red-haired Tudor queen in a white and gold gown touching a kneeling sea captain's shoulder with a sword in a palace hall, painterly realistic, wide 2.25:1, no text`
