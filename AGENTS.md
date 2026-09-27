# AGENTS.md — PLUS ULTRA 저장소에서 일하는 AI(Codex·Claude) 공통 규칙

대항해시대 3을 따라 만든 웹 브라우저 게임입니다. 코드를 고치기 전에 이 문서와 `README.md`를 읽으세요.
게임 설계·변경 기록은 Claude 프로젝트의 「PLUS_ULTRA_개발노트」에 있습니다(사람이 필요한 부분을 작업 지시서에 옮겨 줍니다).

## 반드시 지킬 것

1. **빌드 없이 file://로 실행됩니다.** `index.html`을 더블클릭하면 돌아가야 합니다.
   - ES 모듈(`import`/`export`), `fetch`, 번들러 전용 문법, npm 런타임 의존성은 쓰지 않습니다.
   - 파일마다 `(function (G) { 'use strict'; ... })(window.G = window.G || {});` 형식이고 전역은 `window.G` 하나입니다.
   - 새 파일은 `index.html`의 `<script>` 목록에 알맞은 순서로 넣습니다(도감에서도 쓰면 `catalog.html`에도). `tools/pages.py`가 이 목록을 읽어 단일 파일판·웹판을 만듭니다.
2. **조정값은 한곳에.** 연출 수치는 `js/data/seafx.js`의 `G.FX`, 게임 규칙 수치는 `js/data/base.js`(`G.BALANCE`, `G.SEA_RISK` 등)에 둡니다. 코드 안에 숫자를 흩뿌리지 않습니다.
3. **규칙과 연출을 섞지 않습니다.** 속력·도착 예정·원정 계획·밸런스는 `R.shipSpeed`·`R.fleetSpeed`(`js/core/rules.js`)가 정합니다. 연출용 물리(흔들림·돛)는 이 값을 바꾸지 않습니다. 바꿔야 한다면 평균이 기존 값과 같게 보정하고, 자동 플레이(`tools/autoplay`)로 전후를 비교합니다.
4. **셰이더와 JS는 같은 식.** 바다 파도는 `js/world/renderer.js`(GLSL `waterCol`·`battleSea`)와 `js/world/waves.js`(`G.Waves`)에 같은 식이 두 번 있습니다. 한쪽을 고치면 다른 쪽도 고치고, `tests/wavecheck.js`로 GPU 값과 비교합니다.
5. **그림은 코드로, 교체는 images/로.** 기본 그림은 Canvas 2D·WebGL 코드로 그립니다. 사람이 만든 그림은 `images/`에 정해진 이름으로 넣으면 바뀝니다(`G.Img`, `images/README.md`). 원작의 그래픽·대사를 옮기지 않습니다.
6. **옛 저장 파일 호환.** 저장 상태(`G.Game.state`)에 새 필드를 넣을 때는 없을 때의 기본값을 코드에서 처리합니다. 배·동료·후원자 ID는 바꾸지 않습니다(ID가 겹치면 뒤의 것이 앞의 것을 덮습니다).
7. **콘솔 오류 0.** 바꾼 화면을 헤드리스 Chromium으로 열어 `pageerror`·`console.error`가 없어야 합니다.

## 글쓰기

- 주석·화면 글·문서는 한국어, 쉬운 우리말로 씁니다(예: "태킹" 옆에 "지그재그"). 원작 대사를 옮기지 않고 새로 씁니다.
- 커밋 메시지도 한국어 한 줄 요약 + 필요하면 본문.

## 시험하는 법

- Chromium: `chromium.launch({ args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader'] })`
- swiftshader는 느리므로 `G.Game.state.settings.res = 0.35`, 창은 640×360~960×540. `requestAnimationFrame`을 막고(`addInitScript`) `G.Game.scene.update(1/30)`을 직접 돌리면 장면을 정확히 넘길 수 있습니다.
- 새 게임: `G.State.newGame({name, nation, job, age, birth:{m,d}, st, sk, lg, diff})` → `G.Game.ensureGeo()` 기다림 → `G.Game.go('sea', {depart: 도시번호})`
- 바다: `G.Scenes.sea.runtime()`(상태), `takeCourse(rad)`, `goCity(번호)`. 해전: `G.Game.go('battle', {npc:{kind:'pirate', n:2}})`, `G.Scenes.battle.runtime()`.
- 예시 시험: `tests/`.

## 작업 단위

- 한 작업(PR) = 한 영역의 파일. 여러 영역에 걸치면 나눠서 올립니다.
- PR 설명에 ① 바꾼 것 ② 조정값 ③ 시험한 것(명령·결과·스크린샷) ④ 하지 않은 것 을 적습니다.
- `dist/`, `PLUS_ULTRA.html`, `images/_extra/`는 올리지 않습니다(.gitignore).
