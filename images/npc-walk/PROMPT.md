# 지역별 NPC 걷기 스프라이트 생성 프롬프트

`images/characters/ganghui/sheet.png`는 4×2 격자·옆모습·보행 단계·렌더링 기준,
`images/portraits/npc-roles/<지역>/native_half.webp`는 각 지역 현지 주민의 얼굴·머리·복식·색 기준으로 사용한다.

```text
Use case: stylized-concept
Asset type: production-ready transparent 2D game walking sprite atlas for a regional town NPC
Input images: Image 1 is layout, animation, scale, side-profile, and rendering reference only; Image 2 is the exact regional NPC identity, face, hair, costume, materials, colors, and cultural details to preserve.
Primary request: Create a seamless eight-frame walk cycle of the exact same NPC from Image 2, walking naturally toward screen-right.
Subject: one local resident NPC, preserving the exact person and culturally specific historical clothing shown in Image 2; complete the lower legs and footwear plausibly in the same period costume.
Style/medium: match Image 1's polished hand-painted semi-realistic 2D game sprite, crisp transparent cutout edges, restrained painterly shading, readable silhouette at small size.
Composition/framing: exactly 4 equal columns by 2 equal rows, read left-to-right across the top row and then the bottom row. Eight sequential phases: right-foot contact, down, passing, up, left-foot contact, down, passing, up. Full body in strict side profile facing screen-right; identical camera, scale, pivot, head height, and foot baseline in every cell. Natural alternating arm swing and subtle cloth and hair follow-through.
Constraints: genuine alpha transparency; exactly one complete character in each cell; no prop unless it is already attached to the costume; no backdrop, floor, shadow, grid, border, labels, text, watermark, overlap, cropping, extra limbs, duplicated accessories, floating objects, weapon in hand, or motion blur. Preserve identity, facial traits, hairstyle, costume, proportions, lighting, and colors consistently across all eight frames.
```

지역 코드는 게임의 `G.Art.NPC_STYLES`와 같다. 각 지역 폴더에는 아래 14종의 8프레임 원본 시트가 있다.

| 파일 이름 | NPC |
|---|---|
| `town_man_sheet.png` | 마을 남자 (`native_sheet.png`와 같은 기존 주민) |
| `town_woman_sheet.png` | 마을 여자 |
| `boy_sheet.png` / `girl_sheet.png` | 소년 / 소녀 |
| `elder_sheet.png` / `grandmother_sheet.png` | 촌장 할아버지 / 할머니 |
| `librarian_sheet.png` / `innkeeper_sheet.png` | 도서관 사서 / 여관 주인 |
| `pet_sheet.png` | 지역에 어울리는 강아지 또는 고양이 |
| `adventurer_sheet.png` / `merchant_sheet.png` | 모험가 / 장사꾼 |
| `noble_youth_sheet.png` | 귀족 청년 |
| `soldier_sheet.png` / `navigator_sheet.png` | 병사 / 항해사 |

사람 역할은 `images/portraits/npc-roles/<지역>/`의 대응 반신상을 얼굴·복식 기준으로 썼다.
소년·소녀·노인은 현지 주민과 시녀 반신상에서 문화권 복식만 이어받아 나이와 체형을 새로 만들었다.
동물은 사람과 같은 4×2 읽기 순서로, 지역에 어울리는 개 또는 고양이의 자연스러운 8단계 보행을 만들었다.
`python tools/npc_walks.py`를 실행하면 모든 시트를 칸마다 같은 발끝·높이로 맞춰 `images/street-folk/<역할>_<지역>.webp`(1520×888, 4×2, 칸 380×444, WebP 품질 85)로 다시 붙인다.
게임의 종류 이름과 그림 이름은 `js/data/streetfolk.js`의 `sprites`로 잇고(마을 남자 → `town_man`, 할머니 → `grandmother`, 강아지·고양이 → `pet`),
지역 짐승이 고양이인 곳은 `petKind`에 적는다. 원본 시트(약 400MB)는 저장소에 올리지 않는다(.gitignore).
