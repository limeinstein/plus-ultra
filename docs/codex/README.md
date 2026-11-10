# Codex 작업 지시서

`AGENTS.md`의 공통 규칙을 먼저 읽고, 지시서 하나를 작업(가지·PR) 하나로 합니다.
Claude가 설계·통합·실제 플레이 검증·배포를, Codex가 떼어 낼 수 있는 모듈 구현을 맡습니다. 서로의 PR을 교차 리뷰합니다.

| 번호 | 지시서 | 단계 | 건드리는 곳 | 먼저 끝나야 할 것 |
|---|---|---|---|---|
| 01 | [돛·선체 물리](01_sail_physics.md) | 2 | `js/core/sailphys.js`(새), `tests/` | 없음 |
| 02 | [조각 쌓기 배 그림](02_ship_stack.md) | 3 | `tools/stack_ships.py`(새), `js/art/shipstack.js`(새) | 없음 |
| 03 | [인물 리그 실행기](03_rig_runtime.md) | 3 | `js/art/rig.js`(새), `test_rig.html`(새) | 없음 |
| 04 | [PR 자동 시험](04_ci_tests.md) | 공통 | `.github/workflows/test.yml`(새), `tests/` | 없음 |
| 05 | [신기루 7곳 → 가상의 놀이공원](05_mirage_amusement_parks.md) (저작권 QA 2026-11-04) | 그림·글 | `js/data/miragedisc.js`, `js/data/discfam_8.js`, `images/discoveries·discovery-ends·discovery-sheets·map-discoveries`, `tools/mirage_*` | 없음 |
| 06 | [「갑판의 길잡이」 사이드의 팔 다시 그리기](06_said_deck_redraw.md) (사용자 QA 2026-11-06) | 그림 | `images/legend-events/bx_said_deck.webp`, `tools/missing_event_scenes_20261105_prompts.json` | 없음 |
| 07 | [발견 유물 그림 411장 — 동물의 새끼 · 전설 생물의 물건 · 종교 성물](07_discovery_relic_icons.md) (사용자 요청 2026-11-07) | 완료 · 411장 및 게임 화면 검증 | `images/relics/r_*_baby·_legend·_holy.webp`, `images/manifest.js`, `tools/disc_relics_20261107/` | 없음 |
| 08 | [일기토 타격감 — 히트스톱·접촉 효과·피격 자세·패링·처치](08_duel_impact.md) (사용자 요청 2026-11-09) | A·B·C 완료, [전투원 43명 모션](../art/duel-roster-20261109.md) | `js/games/duel.js`, `js/data/seafx.js`·`duelart.js`, `js/systems/audio.js`, `images/duel/fx/`(새), `images/duel/fighters_ext/`(새), `tools/duel_contact_points.py`(새) | 기존 37명과 공주 6명 |
| 09 | [이름난 해적 초상 170명 · 해적 깃발 68장](09_pirate_roster_flags.md) (사용자 요청 2026-11-10) | 그림 | `images/portraits/rivals/<이름>.webp·_half.webp`, `images/items/flag_*.webp`, `tools/pirate_roster_20261110/prompts.json` | 없음 |

1단계(파도를 타는 배·돛·깃발·선수 물보라)는 2026-09-28에 Claude가 구현했습니다 — `js/world/waves.js`, `G.FX.ride`.
연결(바다·해전 장면에 끼워 넣기)은 모듈이 들어온 뒤 Claude가 합니다. 지시서의 "연결 지점"은 참고용입니다.
