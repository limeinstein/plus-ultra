# 국가별 항해사 후보·후원자 초상

Codex 내장 ImageGen으로 만든 개별 초상 묶음이다. 각 파일은 512×512 투명 WebP이며 총 760장이다.

- `mates/{국가}/f/01.webp`~`10.webp`: 여성 항해사 후보 10명
- `mates/{국가}/m/01.webp`~`10.webp`: 남성 항해사 후보 10명
- `sponsors/{국가}/f/01.webp`~`10.webp`: 여성 후원자 10명
- `sponsors/{국가}/m/01.webp`~`10.webp`: 남성 후원자 10명

국가 코드는 `pt` 포르투갈, `es` 에스파냐, `fr` 프랑스, `de` 독일, `en` 잉글랜드,
`nl` 네덜란드, `na` 북미 원주민, `kr` 조선, `cn` 명, `jp` 일본, `ot` 오스만,
`af` 아프리카 원주민, `az` 아즈텍, `inca` 잉카, `vn` 베트남, `eg` 이집트,
`pe` 페르시아, `ind` 인도, `se` 동남아시아를 뜻한다.

## 공통 프롬프트

```text
Use case: stylized-concept
Asset type: square transparent game dialogue portrait
Primary request: one original adult {culture} {mate candidate|sponsor}, {gender}, with the assigned vocation, pose, expression, and palette
Style/medium: highly polished semi-realistic hand-painted Age of Sail character portrait matching the supplied portrait references
Composition/framing: one person, head and upper torso, varied three-quarter or near-front pose, complete hair and headwear, shoulders visible
Constraints: culturally and historically inspired 1480–1600 clothing; distinct face and silhouette; transparent background; clean alpha edge; no text; no frame; no scenery; no extra people; no copied real-person likeness
```

여성은 모두 성인이며 10명 안에서 윙크, 수줍은 미소, 활짝 웃음, 자신감 있는 미소, 고혹적인 곁눈질,
장난스러운 삐침, 다정한 눈빛, 짓궂은 웃음, 우아한 무표정, 강한 눈맞춤을 하나씩 나누어 쓴다.
남성은 따뜻한 신뢰, 과묵한 보호자, 호탕한 웃음, 과시적인 웃음, 경계하는 눈빛, 노련한 미소,
고개를 든 자부심, 생각에 잠긴 곁눈질, 도전적인 시선, 장난기 있는 자신감을 하나씩 나누어 쓴다.

같은 얼굴이 반복되지 않도록 얼굴 레퍼런스는 쓰지 않는다. 각 번호마다 하트형·긴 타원형·둥근형·마름모형·넓은 타원형·
부드러운 사각형·각진형·배형·높은 이마·삼각형 얼굴을 비롯해 눈 간격, 눈꺼풀, 코 길이와 폭, 광대, 턱, 입술,
점·주근깨·보조개·흉터·수염을 별도로 지정한다. 포즈도 정면, 좌우로 크게 튼 몸, 준측면, 뒤돌아보기,
낮은 시점, 손을 뺨에 댄 자세, 앞으로 숙이기, 몸통 비틀기, 먼 곳 보기, 대각선 자세로 하나씩 갈라 놓는다.
항해사 후보는 선장·항법사·지도 제작자·포술가·조선공·경리·통역·호위·의사 등으로,
후원자는 군주·귀족·대상인·관료·금융가·학자·선주·조합장·수집가 등으로 서로 다르게 구성한다.
