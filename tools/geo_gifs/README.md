# 지리 발견 GIF 만들기

`js/data/discoveries.js`의 지리 발견물 13개를 `images/discoveries/ID.gif`로 만듭니다.
다른 발견 연출과 같은 576×256, 25프레임, 9820ms의 수채화·잉크 톤입니다.

장면은 다음 순서로 이어집니다.

1. 카락의 갑판에서 미지의 대륙·바다를 바라본다.
2. 풍경 위로 중세풍 양피지 세계 지도가 겹쳐진다.
3. 실제 발견 좌표까지의 이동 경로가 갈색 잉크로 그려진다.
4. 목적지에 잉크 점이 번지고 카락 표식이 나타난다.
5. 항로와 카락을 남긴 채 지도가 서서히 줌 아웃된다.

세계 윤곽은 게임이 쓰는 Natural Earth 기반 `js/data/world_data.js`의 육지 마스크를 그대로
사용합니다. 항로·대륙별 이동 경로는 `build.py`의 `ROUTES`에 있으며 날짜 변경선을 넘는 길은
경도를 180도 밖까지 이어 적어 선이 반대편으로 튀지 않게 했습니다. 카락 표식은 게임의
`images/ships-nav/carrack.webp`를 세피아 잉크 표식으로 바꾸어 사용합니다.

```powershell
python tools/geo_gifs/build.py
python tools/ruin_gifs/sheets.py capegood westroute indiaroute malacca spiceis china zipang newstrait circum antarctic northstrait endstrait australia
python tools/images.py
```

하나만 다시 만들 때:

```powershell
python tools/geo_gifs/build.py --only malacca
```

첫 장면 원화는 이미지 생성 도구로 아래 프롬프트를 사용해 만들었습니다.

```text
Use case: historical-scene
Asset type: source artwork for a 576x256 game discovery animation
Primary request: Create a very wide cinematic view from aboard a late-15th-century carrack at the moment sailors sight unknown land across the sea. The viewer stands behind a dark wooden gunwale; a little rigging and one edge of a cream square sail frame the foreground, while most of the image remains open sea and a long low distant coastline on a clear horizon.
Scene/backdrop: open ocean, distant low coast with no buildings, no people visible, no landmarks that identify a specific place.
Style/medium: richly detailed hand-painted watercolor with delicate sepia ink linework on subtly fibrous paper, refined historical exploration sketchbook, matching classic maritime game discovery art.
Composition/framing: uninterrupted ultra-wide 9:4 landscape, stable horizon, generous central open view, ship foreground confined to bottom and far side edges so later overlays remain readable.
Lighting/mood: luminous early dawn, muted navy sea, warm pearl sky, restrained wonder and discovery.
Color palette: indigo, sea green, parchment cream, walnut brown, subtle warm gold.
Constraints: historically plausible carrack details; no text, no labels, no map, no compass rose, no border, no logo, no watermark, no collage, no panels, no modern objects.
```
