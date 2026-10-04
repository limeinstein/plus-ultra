# 잠입 변장 도구 그림 주문 (2026-10-05)

지금 `images/items/mingrobe.webp`는 코드로 그린 임시 그림이다. 다른 소지품(터번 등)과 같은 화풍으로 다시 그려 주면 바꿔 끼운다.

| id | 이름 | 그림 |
|---|---|---|
| mingrobe | 명나라 옷 | 15~16세기 명나라 관원·상인의 붉은 비단 단령(團領, 둥근 깃 겉옷)을 반듯하게 접어 놓고, 그 위에 검은 사모(紗帽, 양옆 날개 달린 망사 모자)를 얹은 모습. 가슴의 흉배(학 무늬 네모 수)와 옥대 일부가 보이게. |

- 규격: 256×256 WEBP, 투명 배경(네 모서리 알파 0), 물체가 칸의 약 90%를 채움 — `tests/item_assets_smoke.py`가 점검한다.
- 원본 그림판을 쓰면 `images/_extra/item-src/item-disguise.png`(1×1칸)에 두고 `python tools/split_item_atlases.py`.
- 터번 그림(`images/items/turban.webp`)은 그대로 쓴다.
