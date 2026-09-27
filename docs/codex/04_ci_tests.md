# 04 PR 자동 시험 (GitHub Actions)

## 목표
PR마다 헤드리스 Chromium으로 기본 흐름을 돌려 콘솔 오류와 셰이더·JS 파도 식 어긋남을 잡습니다.

## 만들 것
- `.github/workflows/test.yml` — pull_request·push(main)에서: Node 20, `npm i playwright` → `npx playwright install --with-deps chromium`.
  - `node tests/wavecheck.js` (셰이더 원문과 `G.Waves` 비교, 오차 6% 넘으면 실패)
  - `node tests/smoke.js` (새로 만듦): 새 게임 → 도시 → 바다(30초 항해) → 해전(20초) → 육상(10초) → 도감 열기, `pageerror`·`console.error`가 있으면 실패. 끝 화면 스크린샷을 아티팩트로 올림.
- 기존 `pages.yml`(웹판 게시)은 건드리지 않음.

## 참고
- `--use-gl=swiftshader --enable-unsafe-swiftshader`, `settings.res = 0.35`, 640×360.
- `requestAnimationFrame`을 막고 `G.Game.scene.update(1/30)`을 직접 돌리면 결과가 매번 같음.
