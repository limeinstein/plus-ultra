# 이강희 걷기 스프라이트 생성 프롬프트

내장 `imagegen` 도구로 만들었다. `player_half_ganghui.png`는 얼굴·안경·복식·색의 기준,
`duel/fighters/ganghui.png`는 같은 인물의 전신과 렌더링 기준, 기본 `walk_1.webp`는
거리 화면의 옆모습·구도 기준으로만 사용했다.

```text
Use case: stylized-concept
Asset type: production-ready transparent 2D game walking sprite atlas
Primary request: Create a seamless eight-frame walk cycle of the exact same Kanghee shown in the references, walking briskly toward screen-right.
Subject: young male navigator with curly dark hair, round glasses, ornate ivory and deep-teal coat with gold celestial embroidery, brown boots, belts, compass ornaments, and a sheathed curved sword.
Style/medium: polished hand-painted semi-realistic 2D game sprite, crisp cutout edges, restrained painterly shading, readable silhouette at small size.
Composition/framing: exactly 4 equal columns by 2 equal rows, read left-to-right across the top row and then the bottom row. Eight sequential phases: contact, down, passing, up, opposite contact, opposite down, opposite passing, opposite up. Full body in strict side profile facing screen-right; identical camera, scale, pivot, and foot baseline in every cell. Natural alternating arm swing, with subtle coat-tail and hair follow-through.
Constraints: genuine alpha transparency; exactly one complete character in each cell; sword stays sheathed; no backdrop, floor, shadow, grid, border, labels, text, watermark, overlap, cropping, extra limbs, duplicated accessories, floating objects, weapon in hand, or motion blur. Preserve identity, glasses, hair, costume, proportions, lighting, and colors in all eight frames.
```

첫 결과에서 보폭이 한쪽에 치우쳐 보여, 같은 조건을 유지하면서 1~4번은 오른발 접지부터,
5~8번은 왼발 접지부터 시작하고 팔 스윙도 반대로 보이도록 한 번 보정했다.

완성 시트는 `sheet.png`, 게임이 직접 읽는 프레임은 `walk_1.webp`부터 `walk_8.webp`까지다.
`python tools/ganghui_walk.py`로 시트를 다시 나눌 수 있다.
