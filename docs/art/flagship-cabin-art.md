# 기함 선실 그림 제작 기준

## 결과물

- 선박 36종 옆모습: `images/ships/<배 ID>.webp`, 880×480
- 선실 19종 내부: `images/cabins/<선실 ID>.webp`, 320×320
- 선박 모음: `docs/art/flagship-cabin-ships-preview.jpg`
- 선실 모음: `docs/art/cabin-room-assets-preview.jpg`
- 실제 화면: `docs/art/flagship-cabin-runtime.png`

원본 PNG는 `images/_extra/cabin-screen-src/`에 보관한다. `_extra`는 배포 그림 목록에서 건너뛴다.

## 공통 화풍

기본 제공 ImageGen 도구로 만들었다. 도시 배경의 사실적인 재질과 따뜻한 빛에 맞춰 짙은 목재, 꿀빛 갑판, 낡은 상아색 돛, 놋쇠를 공통 재질로 썼다. 글자·문장·국기·사람은 넣지 않았다.

### 선박 프롬프트 틀

```text
Use case: stylized-concept
Asset type: browser game flagship-cabin screen ship side-profile background art
Primary request: <js/data/ships.js에 적힌 선종의 시대·문화권·선체·범장 특징>, shown in complete starboard side profile on calm water
Scene/backdrop: dark warm atmospheric sea-and-sky vignette with a thin contact ripple at the waterline
Style/medium: premium painterly historical game illustration matching a richly detailed historical port-city background; realistic warm wood, cloth and rope textures; crisp readable silhouette
Composition/framing: strict orthographic side elevation, bow pointing left, whole vessel visible, centered horizontally, generous margin around the vessel
Lighting/mood: warm coastal daylight from upper left, restrained cinematic contrast
Constraints: one vessel only; historically grounded 1480-1600 construction; no text, labels, border, logo or watermark; do not crop the vessel
Avoid: three-quarter view, top-down view, fantasy ornament, modern hardware, flags, coats of arms, people, duplicate masts, broken rigging
```

36종의 개별 주제는 `js/data/ships.js`와 `tools/render_ship_sprites.py`의 선체·선루·돛·노 구분을 따랐다. 서양 범선, 갤리, 다우, 종·코라코라, 정크, 조선·일본 군선, 발사 뗏목의 구조를 서로 바꾸어 쓰지 않는다.

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

`js/ui/cabinview.js`는 `G.Img`에서 `ships/<배 ID>`와 `cabins/<선실 ID>`를 찾는다. 선체 위에는 Canvas로 목재 갑판·격벽·늑골·용골을 다시 그려, 선실 카드가 떠 있지 않고 잘라 본 선체 안에 들어가 보이게 한다. 그림을 받기 전이거나 파일이 없으면 예전 Canvas 선박 그림이 배경으로 남는다. 따라서 `file://`, 웹판, 한 파일판, 아티팩트판에서 같은 방식으로 동작한다.
