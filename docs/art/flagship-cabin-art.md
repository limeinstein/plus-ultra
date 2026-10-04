# 기함 선실 그림 제작 기준

## 결과물

- 선박 36종 측면 단면도: `images/ships/<배 ID>.webp`, 880×480
- 선실 19종 내부: `images/cabins/<선실 ID>.webp`, 320×320
- 선박 단면 모음: `docs/art/flagship-cabin-cutaway-ships-preview.jpg`
- 선실 모음: `docs/art/cabin-room-assets-preview.jpg`
- 실제 화면: `docs/art/flagship-cabin-runtime.png`

단면 원본 PNG는 `images/_extra/cabin-screen-src/cutaway/`에 보관한다. 교체 전 외관 WebP는 `images/_extra/cabin-screen-src/exterior-webp/`에 보관한다. `_extra`는 배포 그림 목록에서 건너뛴다.

## 공통 화풍

기본 제공 ImageGen 도구로 만들었다. 도시 배경의 사실적인 재질과 따뜻한 빛에 맞춰 짙은 목재, 꿀빛 갑판, 낡은 상아색 돛, 놋쇠를 공통 재질로 썼다. 기존 선박별 외관 그림을 편집 대상으로 삼아 돛·선형·배경은 유지하고, 가까운 쪽 선체만 열어 갑판·격벽·늑골·용골과 빈 선실 칸이 보이게 했다. 글자·문장·국기·사람은 넣지 않았다.

### 선박 프롬프트 틀

```text
Use case: precise-object-edit
Asset type: browser game flagship cabin-screen cutaway ship background
Input images: Image 1 is the edit target and defines the exact ship type, framing, lighting, palette and sea backdrop
Primary request: remove the near-side outer hull planking across most of the hull so the interior deck structure and cabins are visible
Interior structure: <배 크기와 용도에 맞는 1~3층 갑판 및 빈 선실 칸>; evenly spaced bulkheads; visible curved ribs, floor beams, posts and keel; subtle warm lantern light
Style/medium: premium painterly historical game illustration with the same realistic timber, canvas, rope, sea and historical lighting as Image 1
Composition/framing: preserve the exact strict full side elevation, facing direction and complete uncropped vessel
Constraints: preserve the vessel silhouette, bow, stern, masts, sails, rigging, oars or outriggers, waterline and background; no people, furniture, cargo, labels, text, UI or watermark
Avoid: floating rooms, detached dollhouse, exploded diagram, transparent ghost hull, top-down or three-quarter view, modern construction, fantasy machinery, changed mast or sail count
```

36종의 개별 주제는 `js/data/ships.js`와 `tools/render_ship_sprites.py`의 선체·선루·돛·노 구분을 따랐다. 소형선은 얕은 1층, 범선·다우는 2~3층, 갤리는 긴 노잡이 갑판, 정크는 칸막이식 선체, 조선·일본 군선은 노잡이·전투 갑판, 코라코라는 중앙 카누 선체, 발사 뗏목은 묶은 갈대와 가로보가 드러난다. 서로 다른 문화권의 구조를 바꾸어 쓰지 않는다.

### 선실 프롬프트 틀

```text
Use case: stylized-concept
Asset type: reusable browser game cabin tile illustration
Primary request: <js/data/cabins.js의 방 쓰임을 대표하는 시대 소품과 공간>
Scene/backdrop: the entire frame is a believable compartment aboard a 15th-16th century wooden sailing vessel
Style/medium: premium painterly historical game illustration matching a richly detailed Renaissance port-city background; realistic timber, parchment, cloth and brass textures; crisp focal objects readable at thumbnail size
Composition/framing: straight-on cutaway room view, centered functional objects, clear silhouette, no people
Lighting/mood: warm lantern glow mixed with soft daylight, inviting but practical
Constraints: square reusable asset; no text, letters or numbers; no UI frame, people, logo or watermark
Avoid: modern furniture or instruments, fantasy magic, excessive clutter, fisheye perspective
```

방마다 책상·키·망원경·해도·화덕·식탁·장부·침상·악기·돛과 밧줄·목공구·가축·대포·무기걸이·여러 언어의 책처럼 기능을 바로 알아볼 수 있는 중심 소품을 하나씩 두었다.

## 화면 연결

`js/ui/cabinview.js`는 `G.Img`에서 `ships/<배 ID>`와 `cabins/<선실 ID>`를 찾는다.

- **무대**: 배 단면 그림을 선체가 무대 가로를 채우도록 키우고 잘라 보인다(`view`). 그림 속 자리는 `cabinview.js`의 `SPOT` 표에 880×480 원본 픽셀로 적어 두었다 — `hull`(열린 선실 칸들의 네모), `deck`(윗갑판 높이), `mast`(파수대를 둘 큰 돛대 꼭대기), `stern`(함장실을 둘 고물 누각 위). 모든 배는 왼쪽이 뱃머리다. 배 그림을 새로 그리면 이 값만 다시 잰다.
- **갑판의 얼굴표**: 함장실·부관실·조타실·갑판이 고물에서 뱃머리 쪽으로 갑판 위에 서고, 파수대는 돛대 꼭대기에 선다. 서로 겹치면 한 칸씩 비킨다.
- **선체 속 선실 표**: 선실마다 번호 붙은 둥근 표가 `hull` 안에 놓인다. 줄·칸 짜임은 맞닿은 방 판정(`G.Cabins.cols`)과 같고, 낮고 긴 선체(갤리 등)에서는 줄을 줄여 한 줄에 더 늘어놓는다. 사람이 있으면 얼굴, 없으면 방 아이콘.
- **선실 카드**: 무대 아래에 `images/cabins` 방 그림을 깐 카드가 같은 번호로 늘어선다. 카드와 표는 마우스를 올리면 함께 밝아진다.
- **오른쪽**: 부하 명단(자리 없는 사람 먼저)과 지금 힘을 내는 방.
- 방·얼굴표·카드를 누르거나, 부하를 끌어다 방에 놓아 배치한다(명단에 놓으면 자리에서 뺀다). 조선소에서는 카드를 눌러 방을 고친다.
- 크기 조정값은 `G.FX.cabinView` (`js/data/seafx.js`).

그림을 받기 전이거나 파일이 없을 때에는 같은 자리표에 맞춘 Canvas 배가 대신 보이므로 `file://`, 웹판, 한 파일판, 아티팩트판에서 같은 방식으로 동작한다.
