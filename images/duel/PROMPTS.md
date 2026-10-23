# 일기토 에셋 생성 프롬프트

이 묶음은 내장 `imagegen` 도구로 생성했습니다. 기존 `images/characters/walk_1.webp`는 주인공의 인물·복식·렌더 밀도 참고로만 사용했고, 완성된 `main_admiral.png`를 나머지 시트의 화풍·그리드 기준으로 사용했습니다.

## 전면 필살기 컷인 공통 프롬프트

첨부된 삼국지식 화면은 **구도 참고만** 사용하고 UI·글자·인물·원화를 복제하지 않았습니다. 두 번째 입력에는 `tools/duel_cutins.py --references`로 뽑은 해당 전투원의 얼굴·복식·무기 참조를 넣었습니다.

```text
Use case: historical-scene
Asset type: full-screen duel ultimate cut-in artwork for a 1060×380 animated GIF
Input images: Image 1 is composition reference only; never copy its UI, text, character, or exact artwork. Image 2 is the fighter identity reference; preserve the exact face, hair, costume colors, silhouette, and weapon.
Primary request: Create one continuous cinematic ultimate-attack scene of the referenced fighter turning toward the viewer and driving the weapon forward with extreme foreshortening, as if the attack bursts out of the screen.
Composition/framing: ultra-wide 2.8:1, dynamic waist-up or three-quarter figure, face clearly visible with direct gaze, weapon aimed diagonally toward camera, strong left-to-right motion.
Constraints: one fighter only; not comic panels or a sprite sheet. No text, letters, numbers, speech bubble, UI, border, logo, watermark, extra people, or modern objects.
Style/medium: <아래 지역 화풍>
```

- 유럽·이베리아: 채색 르네상스 동판화와 강한 크로스해칭
- 중국: 금빛 선지 위 공필 인물화와 힘 있는 수묵 필선
- 조선: 한지 위 수묵화·민화 선묘
- 일본: 무사 우키요에와 스미에 붓질
- 이슬람권: 마그레브 장식 필사본과 오스만 세밀화
- 인도: 광물 안료와 금니를 쓴 라지푸트 세밀화
- 동남아: 칠화와 민간 목판화
- 아프리카: 인디고 직물 기하와 목각 부조형 선화
- 메소아메리카·북미: 각각 아마테 필사본 회화와 동부 삼림권 회화 문법

## 전투원 공통 프롬프트

```text
Use case: stylized-concept
Asset type: production-ready transparent 2D game combat sprite sheet PNG
Input images: Image 1 is a style and atlas-layout reference only; create a different character described below.
Primary request: Create one historical adventure RPG duel sprite sheet. The character faces screen-right in every frame.
Style/medium: match Image 1's polished hand-painted semi-realistic 2D game-sprite quality, proportions, crisp cutout edges, restrained painterly shading, readable silhouette, and consistent identity across frames.
Composition/framing: strict atlas matching Image 1, exactly 6 equal columns by 4 equal rows. Equal scale in every frame. Isolated poses with generous transparent padding and no overlap. Every foot contact point lands on the exact same horizontal baseline near the bottom of its cell; pivot centered between the feet. Row 1: 6 sequential attack frames — anticipation, wind-up, step, contact, follow-through, recover. Row 2: 4 sequential defense frames — guard raise, brace, impact block, recover; columns 5-6 fully transparent. Row 3: 3 sequential hit-reaction frames — impact recoil, stagger, recover; columns 4-6 fully transparent. Row 4: 6 sequential action/idle frames — ready, breathing down, breathing up, look/shift, signature flourish, return ready.
Constraints: genuine alpha transparency; no backdrop, floor, cast shadow, grid, borders, labels, text, numbers, or watermark. Keep body, weapon, garments, hair, and accessories fully inside each cell with safe margins. Consistent camera, scale, lighting, anatomy, costume details, weapon length, and face. Do not merge poses. Empty cells fully transparent.
Subject: <아래 표의 인물 명세>
```

| 파일 | 인물 명세 요약 |
|---|---|
| `main_admiral` | 기존 제독과 같은 짙은 머리·수염, 남색 가죽 외투, 붉은 망토, 해군 세이버 |
| `first_mate` | 40대 지중해계 부관, 올리브색 짧은 선상 외투, 자주색 모자, 커틀러스 |
| `western_brawler` | 털이 많은 웃통 벗은 서양인 격투가, 육중한 양손 팔시온 |
| `columbus` | 15세기 말 콜럼버스, 자주색 벨벳 모자, 검붉은 항해가 복식, 아밍 소드 |
| `cortes` | 16세기 초 코르테스, 검은 반신 갑옷과 붉은 더블릿, 모리온, 레이피어·버클러 |
| `redhair_pirate` | 구릿빛 붉은 머리의 여성 해적 선장, 검정·진홍 선상 외투, 커틀러스 |
| `blonde_pirate` | 금발 땋은 머리의 여성 해적, 남색 외투와 황토색 허리띠, 세이버 |
| `african_warrior` | 근세 서아프리카 해안 전사, 남색 직물과 가죽 방호구, 단검형 검·가죽 방패 |
| `mesoamerican_warrior` | 16세기 메소아메리카 재규어 전사, 면갑과 절제된 깃 장식, 마쿠아후이틀 |
| `guan_yu` | 관우, 긴 검은 수염, 녹색 한대풍 전포와 찰갑, 셀 안에 맞춘 청룡언월도 |
| `zhang_fei` | 장비, 다부진 체격과 검은 수염, 검붉은 한대풍 갑주, 셀 안에 맞춘 장팔사모 |
| `joseon_swordsman` | 흰 도포와 검은 갓의 조선 무사, 환도 |
| `east_asian_attendant` | 명대 항구의 성인 여성 여급, 청록 상의·짙은 붉은 치마·앞치마, 짧은 장봉 |
| `samurai` | 센고쿠 말기 사무라이, 남색·적색 찰갑과 하카마, 양손 가타나 |
| `barbary_corsair` | 북아프리카 바르바리 해적, 청록 카프탄·붉은 허리띠·터번, 샴쉬르·버클러 |
| `caribbean_pirate` | 아프로카리브계 해적 선장, 빛바랜 녹색 외투·황토 띠, 커틀러스·단검 |
| `explorer` | 르네상스 현장 탐험가·지도 제작자, 황갈색 가죽옷·초록 여행복, 사이드소드 |
| `vietnamese_woman` | 보라색 초기 아오자이풍 장의와 상아색 바지, 베트남식 도검 |
| `indian_warrior` | 사프란·청록 보석색의 발리우드풍 인도 영웅 전사, 탈와르·달 방패 |
| `native_chief` | 북동부 삼림권 하우데노쇼니풍 원주민 지도자, 사슴가죽옷·왐펌 띠, 전투봉·방패 |
| `spanish_soldier` | 16세기 말 스페인 보병, 모리온·흉갑·황토색 더블릿·붉은 띠, 사이드소드·버클러 |

## 검술 3 전설 추가 시트

달타냥·아토스·아라미스의 `*_half.webp` 초상을 인물 참조로, `main_admiral.png`를 화풍·6×4 배열 참조로 함께 넣고 아래처럼 생성했습니다. 생성본은 `tools/duel_finishers.py --import-generated`로 2592×1216 게임 규격에 맞춥니다.

```text
Create a production-ready transparent 2D combat sprite sheet for <달타냥/아토스/아라미스>.
Match the supplied portrait's face, hair, costume colors and weapon, and match the supplied atlas reference's polished hand-painted semi-realistic historical-RPG style.
Strict 6 equal columns × 4 equal rows: attack 6 frames (anticipation, wind-up, step, contact, follow-through, stylish weapon-sheathing recovery); defense 4 frames then 2 empty; hit reaction 3 frames then 3 empty; action/idle 6 frames ending in signature flourish and return-ready.
The character faces screen-right in every frame. Keep identical scale, camera, baseline and identity. Genuine alpha transparency; no background, floor, shadow, grid, labels, text or watermark; unused cells fully transparent.
```

## 배경 공통 프롬프트

```text
Use case: stylized-concept
Asset type: wide 2D duel-arena background for a historical adventure RPG
Primary request: Create a reusable combat background with no characters.
Style/medium: polished hand-painted semi-realistic 2D game background, crisp readable shapes, restrained painterly texture, matching high-quality historical RPG character sprites.
Composition/framing: wide cinematic side-view arena, horizon in upper half, central lower third is a clear flat fighting lane for two full-body fighters, strong depth layers, safe crop for an extra-wide 1060x380 game canvas, important elements kept away from outer edges.
Constraints: environment only; absolutely no people, warriors, silhouettes, bodies, animals, text, labels, UI, logos, or watermark. No foreground object may block the fighters' feet.
Scene/backdrop: <아래 장면>
```

- `deck`: 16세기 범선의 넓은 갑판, 양옆 돛대·밧줄·통, 갈고리로 붙은 적선과 거친 바다, 늦은 오후.
- `land_battle`: 르네상스 성곽 도시 밖 짓밟힌 풀밭, 먼 깃발·마차·연기, 흐린 낮.
- `exploration`: 열대 밀림 유적의 이끼 낀 석조 단상, 안개 낀 계단식 유적과 아침 햇살.
- `city`: 16세기 대서양 항구 도시 광장, 아케이드·분수·먼 항구의 돛대, 햇빛 드는 석재 바닥.
- `tavern`: 근세 항구 술집, 목재 들보·벽난로·등불, 양옆 탁자와 통, 중앙의 빈 널마루.
