# 후계를 위한 안배 — 장면 그림 주문서 (2026-10-29)

게임 코드: `js/systems/heirplan.js` · `js/systems/oldguard.js`. 그림이 없으면 장면 없이 대화만 나온다(`G.FamEv.showPic`).
`python tools/audit_event_images.py` 의 누락 목록에 아래 네 이름이 나온다.

규격: 다른 `family-events` 그림과 같음 — 넓은 한 장(2.25:1, 예 1881×836), `images/family-events/<이름>.webp`. 글자·테두리·여러 칸 없음.
공통 문체: `tools/complete_event_images.py` 의 STYLE(유화풍 사실화, 16~17세기 항구 도시, 원작 인물 아님).
아들(후계자)·제독은 성별·얼굴이 정해지지 않게 뒷모습·실루엣·화면 가장자리로 둔다 — 플레이어마다 생김새가 다르다.

| 이름 | 제목 | 장면 |
|---|---|---|
| `childfriend_visit` | 소꿉친구 | Early modern seafarer's family home, open front door at golden afternoon. An adult childhood friend in practical travel clothes with a small sea bag stands on the doorstep, grinning; in the foreground the young adult heir is seen from behind, arms open in surprised welcome. Two old wooden toy swords hang on the wall by the door. Harbor masts visible down the sloping street. Warm, nostalgic reunion. |
| `childfriend_join` | 소꿉친구의 합류 | A busy early modern harbor pier at morning. An adult childhood friend carries a sea chest up the gangplank of a caravel, looking back with a confident smile; sailors make room. The heir stands on deck seen only from behind, reaching out a hand. Gulls, rigging, bright sea light. Joyful beginning of a voyage. |
| `heir_council` | 후계를 위한 안배 | A long candlelit dinner table in a seafarer's home at night. Five or six weathered veteran sailors of various origins (grey beards, scars, sun-worn faces, old coats) listen seriously. At the head of the table an aging admiral's hands rest on a folded sea chart and an old brass compass, face out of frame. At the far end the heir sits as a backlit silhouette. Window shows harbor lights. Solemn, intimate, trust between generations. |
| `oldguard_farewell` | 노장들의 작별 | Harbor at sunset. A handful of old sailors with canvas sea bags walk down a gangplank onto the quay, one turning back to raise his hat toward the ship. The caravel's crew lines the rail in silence; a young officer on deck (back view) salutes. Long shadows, copper sky, gentle melancholy and pride. |


연결 완료 (2026-10-29): 새 집·식탁·출신권별 부두 배경에 실제 후계자·소꿉친구·선택한 노장을 합성한다. 원화·실제 지시문·검사 `docs/art/event-shots-20261029.md`.
