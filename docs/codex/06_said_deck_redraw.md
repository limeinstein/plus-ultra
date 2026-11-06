# 06 「갑판의 길잡이」 사건 그림 다시 그리기 — 사이드의 팔 (2026-11-06 사용자 QA)

## 왜
`images/legend-events/bx_said_deck.webp` (사건 「갑판의 길잡이」, `js/systems/beauxis.js` — 1500년 말린디에서 사이드를 길잡이로 맞은 밤)에서
**사이드의 왼팔(카말 나무판을 북극성 쪽으로 들어 올린 팔)이 어깨가 아니라 등 뒤·조끼 옆구리에서 길게 솟아 나온다.** 오른팔(책을 내미는 팔)과 함께 보면 팔이 몸에 붙은 자리가 어긋나 이상하다.
손으로 지워 고칠 수 있는 정도가 아니어서(팔이 하늘·바다·조끼에 걸쳐 있다) 같은 장면을 다시 그린다.

## 그릴 것
- 지난 생성 기록: `tools/missing_event_scenes_20261105_prompts.json`의 `bx_said_deck` 항목 (참고 얼굴 `artifacts/beaux-portraits-20261105/sources/bx_said.png`). 같은 크기 1881×836 · 같은 화풍·인물(흰 터번·남색 조끼·맨팔 · 달밤의 갑판 · 뒷모습의 선장).
- **자세를 하나로 단순하게** — 두 가지 일을 두 팔에 나눠 맡기지 않는다:
  - 사이드는 **오른손으로** 카말(작은 나무판, 매듭 끈)을 눈앞에 팔 길이만큼 들어 북극성을 잰다. 끈 끝은 이로 문다(카말을 쓰는 실제 방법). 왼손은 난간을 가볍게 짚는다. 두 팔 모두 **자기 어깨에서** 자연스럽게 이어진다.
  - 손으로 쓴 항해서 『이로움의 책』은 탁자 위 해도 곁에 펼쳐져 선장 쪽으로 놓여 있다 (선장의 손이 그 책 위에).
- 프롬프트에 덧붙일 말: `Exactly two arms, both clearly attached to his own shoulders; anatomically correct elbows and hands; no arm emerging from behind the back.`
- 나머지(얼굴은 중앙 55% 높이 안, 글자·테두리 없음, 선장 얼굴 가림)는 지난 프롬프트 그대로.

## 넣는 곳
1. `images/legend-events/bx_said_deck.webp` 교체 (같은 이름 — 코드는 고치지 않는다). 원본은 `artifacts/missing-event-scenes-20261105/sources/bx_said_deck.png` 를 `…_v1.png` 로 남기고 새 원본을 같은 이름으로.
2. 프롬프트 JSON의 `bx_said_deck` 항목 `prompt`·`description`을 새 것으로, 지난 것은 `previous_versions`에.
3. `docs/art/missing-event-art-20261105.md` 에 「2026-11-06 다시 그림 — 팔」 한 줄과 미리보기.
4. 확인: 게임에서 말린디(1500)의 사이드 사건을 열어 장면 그림과 대사 창이 함께 보이는 화면을 찍어 팔이 자연스러운지 본다.
