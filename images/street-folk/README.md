# 거리를 걷는 마을 사람 그림 (js/systems/streetfolk.js)

그림이 없으면 코드로 그린 사람(js/art/streetfolk.js)이 걷는다. 그림을 넣으면 그쪽이 먼저 쓰인다.

- 자리: `images/street-folk/<종류>_<문화권>/walk_1.webp … walk_8.webp` (그 문화권 전용) 또는 `images/street-folk/<종류>/walk_1.webp …` (모든 문화권)
- 종류: man woman boy girl elder grandma librarian innkeeper dog cat adventurer merchant noble soldier navigator
- 문화권: europe islam south eastasia native (G.Art.cultureOf)
- 그림 한 장: 투명 배경, 오른쪽을 보고 걷는 옆모습 전신, 발이 그림 아래쪽에 닿게. 제독 걷는 그림(images/characters/<이름>/walk_N.webp, 380×444)과 같은 결 · 같은 크기 비율.
  8장이 한 걸음 주기(왼발·오른발 한 번씩). 왼쪽으로 갈 때는 뒤집어 그린다.
- 넣은 뒤 `python tools/images.py` 로 images/manifest.js 를 다시 만든다.

## 지역 20곳 × 14종 (2026-10-08, Codex)
- `street-folk/<그림 이름>_<도시 양식>.webp` — 한 장짜리 시트 1520×888, 4열×2줄 = 걸음 8단계(왼→오, 윗줄 → 아랫줄), 칸마다 380×444(제독 걷는 그림과 같은 칸). 도시 양식 20곳(`G.Art.NPC_STYLES`: ib ne it gr ru is pe af sw in se cn kr jp az an co tr st na) × 14종 = 280장.
- 그림 이름: town_man(마을 사람) town_woman boy girl elder grandmother librarian innkeeper pet adventurer merchant noble_youth soldier navigator — 게임 종류와는 `js/data/streetfolk.js` `sprites`로 잇는다.
- pet은 지역마다 개 또는 고양이 한 마리 — 고양이인 지역은 `petKind`(ne it is pe sw se jp).
- 아이·짐승은 칸 안에서 이미 작게 그렸다(원본 `images/npc-walk/sprite_manifest.json`의 displayScale). 게임은 모든 칸을 같은 높이(`G.FX.streetFolk.imgH`)로 그린다.
- 원본 4×2 시트(칸 444×444)는 `images/npc-walk/<양식>/<이름>_sheet.png` → `python tools/npc_walks.py`가 사람을 칸마다 같은 발끝·높이로 맞춰 이 시트로 다시 붙인다. 얼굴(대화창)은 같은 지역의 `portraits/npc-roles/<양식>/<역할>` 무릎상.
- 낱장(`<이름>/walk_1.webp …`)으로 넣어도 쓴다(시트가 먼저).
- 아티팩트판: 이 시트들은 한 판 한도(256MB) 밖의 **자산 저장소**에 원래 크기로 올린다 (`tools/bundle.py` ASSET_PREFIXES).
