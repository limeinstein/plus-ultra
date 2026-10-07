# 거리를 걷는 마을 사람 그림 (js/systems/streetfolk.js)

그림이 없으면 코드로 그린 사람(js/art/streetfolk.js)이 걷는다. 그림을 넣으면 그쪽이 먼저 쓰인다.

- 자리: `images/street-folk/<종류>_<문화권>/walk_1.webp … walk_8.webp` (그 문화권 전용) 또는 `images/street-folk/<종류>/walk_1.webp …` (모든 문화권)
- 종류: man woman boy girl elder grandma librarian innkeeper dog cat adventurer merchant noble soldier navigator
- 문화권: europe islam south eastasia native (G.Art.cultureOf)
- 그림 한 장: 투명 배경, 오른쪽을 보고 걷는 옆모습 전신, 발이 그림 아래쪽에 닿게. 제독 걷는 그림(images/characters/<이름>/walk_N.webp, 380×444)과 같은 결 · 같은 크기 비율.
  8장이 한 걸음 주기(왼발·오른발 한 번씩). 왼쪽으로 갈 때는 뒤집어 그린다.
- 넣은 뒤 `python tools/images.py` 로 images/manifest.js 를 다시 만든다.
