# Codex 작업 지시서

`AGENTS.md`의 공통 규칙을 먼저 읽고, 지시서 하나를 작업(가지·PR) 하나로 합니다.
Claude가 설계·통합·실제 플레이 검증·배포를, Codex가 떼어 낼 수 있는 모듈 구현을 맡습니다. 서로의 PR을 교차 리뷰합니다.

| 번호 | 지시서 | 단계 | 건드리는 곳 | 먼저 끝나야 할 것 |
|---|---|---|---|---|
| 01 | [돛·선체 물리](01_sail_physics.md) | 2 | `js/core/sailphys.js`(새), `tests/` | 없음 |
| 02 | [조각 쌓기 배 그림](02_ship_stack.md) | 3 | `tools/stack_ships.py`(새), `js/art/shipstack.js`(새) | 없음 |
| 03 | [인물 리그 실행기](03_rig_runtime.md) | 3 | `js/art/rig.js`(새), `test_rig.html`(새) | 없음 |
| 04 | [PR 자동 시험](04_ci_tests.md) | 공통 | `.github/workflows/test.yml`(새), `tests/` | 없음 |

1단계(파도를 타는 배·돛·깃발·선수 물보라)는 2026-09-28에 Claude가 구현했습니다 — `js/world/waves.js`, `G.FX.ride`.
연결(바다·해전 장면에 끼워 넣기)은 모듈이 들어온 뒤 Claude가 합니다. 지시서의 "연결 지점"은 참고용입니다.
