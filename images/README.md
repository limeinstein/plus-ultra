# images — 그림 교체 폴더

이 폴더에 정해진 이름으로 그림 파일을 넣으면, 게임이 코드로 그리던 그림 대신 그 파일을 씁니다.
넣지 않은 그림은 원래대로 코드가 그립니다.

## 순서

1. WebGame 폴더의 `catalog.html`(게임 도감)을 열어 바꿀 항목을 찾습니다. 항목을 누르면 쓸 파일 이름이 나옵니다.
2. 그 이름으로 이 폴더에 그림을 넣습니다. PNG·JPG·WEBP 모두 됩니다. (예: `images/cities/0.jpg`)
3. WebGame 폴더에서 `python tools/images.py`를 실행합니다. `images/manifest.js`가 새로 만들어지고, 이름이 틀린 파일이 있으면 알려 줍니다.
4. `index.html`을 새로 고치면 바로 보입니다.
   - 한 파일짜리 `PLUS_ULTRA.html`에 넣으려면 `python tools/bundle.py`
   - 웹 배포판(`dist/web`)에 넣으려면 `python tools/build_web.py`

## 파일 이름 규칙

| 그림 | 파일 이름 | 권장 크기 |
|---|---|---|
| 타이틀 화면 | `title.jpg` | 1600×900 |
| 거리 배경 (도시 화면) | `bg-styles/ib_port_a.jpg` 항구 · `bg-styles/ib_inland_a.jpg` 내륙 (여러 장이면 _a, _b …) | 1600×900 |
| 거리 배경 — 한 도시만 | `backgrounds/도시번호.jpg` | 1600×900 |
| 건물 겉모습 (거리에 세움) | `exteriors/건물.webp` (tavern, trade, inn …) · 도시별 `@도시번호` · 후원자 저택 `mansion@후원자ID` | 배경 지운 PNG·WEBP, 높이 660 |
| 거리 볼거리 (장식) | `landmarks/이름.webp` | 배경 지운 PNG·WEBP |
| 제독 — 거리에서 걷는 모습 | `characters/walk_1.webp` … `walk_8.webp` (옆모습, 발끝이 아래) | 높이 430 |
| 제독 — 수첩 반신상 | `characters/player_half.webp` | 512×512 |
| 제독 — 대화창 얼굴 | `portraits/player/이름.webp` (가슴 위) | 512×512 |
| 도시 풍경 | `cities/도시번호.jpg` (예: `cities/0.jpg` = 리스본) | 1600×900 |
| 도시 풍경 — 해질녘·저녁 | `cities/0_golden.jpg`, `cities/0_dusk.jpg` | 1600×900 |
| 같은 양식의 도시 모두 | `city-styles/양식.jpg` (예: `city-styles/ib.jpg` = 이베리아 양식) | 1600×900 |
| 건물 내부 | `interiors/건물.jpg` (예: `interiors/tavern.jpg`) | 1600×900 |
| 건물 내부 — 문화권별 | `interiors/tavern_islam.jpg` (europe·islam·eastasia·south·native) | 1600×900 |
| 건물 내부 — 도시별 | `interiors/tavern@0.jpg` | 1600×900 |
| 후원자의 왕궁·저택 | `interiors/palace@pt_king.jpg`, `interiors/mansion@pt_behaim.jpg` | 1600×900 |
| 동료 | `portraits/mates/동료ID.png` (예: `rocco`) | 512×512 |
| 여급 | `portraits/maids/여급ID.png` (예: `m_lis`) | 512×512 |
| 후원자 | `portraits/sponsors/후원자ID.png`, 시대별 인물은 `_2`, `_3` … | 512×512 |
| 경쟁자 | `portraits/rivals/이름.png` (예: `바르톨로메우 디아스.png`) | 512×512 |
| 마을 사람 | `portraits/npc/역할.png` (예: `trader`), 문화권별 `_islam`, 도시별 `@0` | 512×512 |
| 마을 사람 — 도시마다 다른 얼굴 | 같은 이름 뒤에 `_f`(여) `_m`(남) `_2` `_3` 을 붙이면 도시 번호에 따라 번갈아 나옵니다. 예: `portraits/npc/priest_europe_f.webp` (수녀) | 512×512 |
| 제독 얼굴 | `portraits/player/아무이름.png` — 여러 장 넣으면 제독을 만들 때 "얼굴" 버튼으로 고름 | 512×512 |
| 자녀 | `portraits/family/son.png`, `daughter.png`, 둘째는 `son_2.png` | 512×512 |
| 발견물 | `discoveries/발견물ID.jpg` (예: `capegood`) | 1440×640 |
| 발견물 — 분류 공통 | `discovery-cats/geo.jpg` (geo·nature·ruin·treasure·creature·people·trade) | 1440×640 |
| 배 | `ships/배ID.png` — 36종 (예: caravel·carrack·galleon·galley·dhow·junk·baochuan·panokseon·geobukseon·atakebune …, 전체 목록은 `python tools/images.py --list`) | 880×480 |

전체 이름 목록은 `catalog.html`에서 그림과 함께 보거나, `python tools/images.py --list`로 글자로 볼 수 있습니다.

## 알아 둘 점

- 거리 배경이 있는 도시는 **거리 화면**이 됩니다. 배경 위에 `exteriors/` 건물이 늘어서고, 건물을 누르거나 오른쪽 메뉴에서 골라 들어갑니다. 배경이 없으면 예전처럼 코드로 그린 도시 풍경 한 장이 나옵니다.
- 한 자리에 여러 이름이 있으면 더 구체적인 이름부터 찾습니다. 예) 리스본 술집: `tavern@0` → `tavern_europe` → `tavern` → 코드 그림.
- 그림은 칸을 꽉 채우도록 가운데를 기준으로 잘라 씁니다. 인물은 위쪽 4분의 1 지점을 기준으로 자르므로 얼굴을 위쪽에 두세요.
- 해질녘·저녁 전용 그림이 없으면 기본 그림에 옅은 노을빛을 입혀 씁니다.
- 바다 지도, 육상 탐험 지도, 해전 화면은 실시간으로 그리는 화면이라 파일로 바꾸지 않습니다.
- claude.ai에 올리는 한 파일짜리 판은 16MB까지입니다. 그림을 많이 넣을 때는 JPG(품질 80 안팎)로 저장하세요.
