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
| 지역별 건물 묶음 | `exterior-styles/<묶음>/건물.webp` — 북미 원주민은 `woodland`(숲: 나무껍질 긴 집·위그웜·티피·울타리·카누), `plains`(평원 티피·가죽 천막 시장·의식용 큰 티피·목책 성문, 다코타 230·만단 243), `pueblo`(흙벽돌 계단 집·키바, 타오스 241·아코마 242). 없는 건물은 plains·pueblo → woodland → tropic 순으로 빌림. `tools/natives/make.py`가 기본 그림을 다시 만든다 | 배경 지운 WEBP, 높이 520(시장 660) |
| 거리 볼거리 (장식) | 도시 건축 발견물은 `landmarks/발견물ID.webp`로 두면 해당 도시·건축 연도에 자동 배치. 그 밖의 장식은 `landmarks/이름.webp`와 `js/scenes/town.js`의 `LANDMARKS`로 수동 배치 | 배경 지운 PNG·WEBP, 권장 높이 520 |
| 제독 — 거리에서 걷는 모습 | `characters/walk_1.webp` … `walk_8.webp` (옆모습, 발끝이 아래) | 높이 430 |
| 제독 — 수첩 반신상 | `characters/player_half.webp` | 512×512 |
| 제독 — 대화창 얼굴 | `portraits/player/이름.webp` (가슴 위) | 512×512 |
| 제독 — 생김새별 그림 | 만들기 화면에서 얼굴 `portraits/player/<이름>`을 고르면 반신상 `characters/player_half_<이름>`, 걷는 그림 `characters/<이름>/walk_1…8`, 일기토 시트 `duel/fighters/<이름>`을 쓴다(없으면 기본 제독 그림). 테스트 캐릭터 이강희 = `ganghui` | 위와 같음 |
| 도시 풍경 | `cities/도시번호.jpg` (예: `cities/0.jpg` = 리스본) | 1600×900 |
| 도시 풍경 — 해질녘·저녁 | `cities/0_golden.jpg`, `cities/0_dusk.jpg` | 1600×900 |
| 같은 양식의 도시 모두 | `city-styles/양식.jpg` (예: `city-styles/ib.jpg` = 이베리아 양식) | 1600×900 |
| 건물 내부 | `interiors/건물.jpg` (예: `interiors/tavern.jpg`) | 1600×900 |
| 건물 내부 — 문화권별 | `interiors/tavern_islam.jpg` (europe·islam·eastasia·south·native) | 1600×900 |
| 건물 내부 — 도시별 | `interiors/tavern@0.jpg` | 1600×900 |
| 후원자의 왕궁·저택 | `interiors/palace@pt_king.jpg`, `interiors/mansion@pt_behaim.jpg` | 1600×900 |
| 동료 | `portraits/mates/동료ID.png` (예: `rocco`) | 512×512 |
| 술집 접대부 — 대화창 얼굴 | `portraits/maids/여급ID.webp` (예: `m_lis`) | 1024×1024, 투명 배경 |
| 술집 접대부 — 리깅 반신 | `portraits/maids/여급ID_half.webp` (예: `m_lis_half`) | 1024×1536, 투명 배경·머리부터 무릎까지 |
| 후원자 | `portraits/sponsors/후원자ID.png`, 시대별 인물은 `_2`, `_3` … — 번호는 `js/data/rulers.js`의 그림 번호(도감 후원자 칸에 사람마다 파일 이름이 나옴. 예: 메리 1세 `en_king_7`, 제임스 1세 `en_king_8`). 여성 군주에게는 자리 공통 그림(남성)을 쓰지 않고 그 고장 귀부인 그림으로 | 512×512 |
| 경쟁자 | `portraits/rivals/이름.png` (예: `바르톨로메우 디아스.png`) | 512×512 |
| 마을 사람 | `portraits/npc/역할.png` (예: `trader`), 문화권별 `_islam`, 도시별 `@0` | 512×512 |
| 마을 사람 — 도시마다 다른 얼굴 | 같은 이름 뒤에 `_f`(여) `_m`(남) `_2` `_3` 을 붙이면 도시 번호에 따라 번갈아 나옵니다. 예: `portraits/npc/priest_europe_f.webp` (수녀) | 512×512 |
| 마을 사람 — 도시 양식×역할 240장 | `portraits/npc-roles/양식/역할.webp` (예: 조선 상인 `kr/merchant.webp`). 양식 20종×역할 12종이며, `portraits/npc/역할@도시번호`가 있으면 도시 전용 그림을 먼저 씁니다. | 512×512, 투명 배경 |
| 국가별 항해사 후보·후원자 760장 | `portraits/pools/mates/국가/f/01.webp`, `portraits/pools/sponsors/국가/m/01.webp`. 국가 19종×항해사·후원자×여·남×10명 | 512×512, 투명 배경 |
| 제독 얼굴 | `portraits/player/아무이름.png` — 여러 장 넣으면 제독을 만들 때 "얼굴" 버튼으로 고름 | 512×512 |
| 자녀 | `portraits/family/son.png`, `daughter.png`, 둘째는 `son_2.png` | 512×512 |
| 발견물 | `discoveries/발견물ID.jpg` (예: `capegood`). 유적은 `tools/ruin_gifs`, 자연 경관은 `tools/nature_gifs`, 동물은 `tools/animal_gifs`, 보물은 `tools/treasure_gifs`로 만든 GIF를 쓰면 전용 발견 연출이 재생됨 | 1440×640 정지화상 또는 576×256 GIF |
| 발견물 — 분류 공통 | `discovery-cats/geo.jpg` (geo·nature·ruin·treasure·creature·people·trade) | 1440×640 |
| 배 | `ships/배ID.png` — 36종 (예: caravel·carrack·galleon·galley·dhow·junk·baochuan·panokseon·geobukseon·atakebune …, 전체 목록은 `python tools/images.py --list`) | 880×480 |
| 항해·해전 8방향 동작 배 | `ships-nav/배ID.webp` — `python tools/render_ship_sprites.py`가 만드는 정박 3장·표류 5장·질주 8장 시트 | 자동 생성 1792×3584, 셀 224×224, 수면 피벗 (112,139), 투명 배경 |
| 항해 효과 스프라이트 시트 | `effects/ship_spray.png`, `effects/departure_gull.png` | 1024×512, 4열×2행, 셀 256×256, 투명 배경 |
| 육상전·육상 탐험·사건 스프라이트 | `sprites/시트.webp` — 육상전 부대(officers·musketeers·cannons·swordsmen·east_fighters·ottoman·natives), 들짐승(animals), 항해 사건(whale·dolphin·mermaid·storm·raincloud·rain·sun), 탐험대 8방향(party_*) | `python tools/sprite_repack.py`가 원본(`_extra/sprite_src/`)을 고른 칸으로 다시 짠 것. 칸·피벗은 `js/data/sprites.js` |
| 일기토 전투원 | `duel/fighters/이름.png` | 2592×1216, 6열×4행, 칸 432×304, 발밑 피벗 (165, 278), 투명 배경 — 1536×1024(칸 256) 원본을 `tools/duel_repack.py`로 다시 짠 것 |
| 일기토 배경 | `duel/backgrounds/deck.png` 등 | 초광폭 2094×751 안팎 |

전체 이름 목록은 `catalog.html`에서 그림과 함께 보거나, `python tools/images.py --list`로 글자로 볼 수 있습니다.

## 항해 효과 시트 규격

- 프레임은 왼쪽 위부터 가로 방향으로 읽으며 0~7번입니다. `x = (프레임 % 4) × 256`, `y = floor(프레임 / 4) × 256`입니다.
- `ship_spray`는 오른쪽으로 항해하는 배의 선수 물보라입니다. 배의 진행 방향에 맞춰 시트를 회전해서 쓰며, 프레임당 70~90ms가 어울립니다.
- `departure_gull`은 오른쪽을 보는 갈매기의 한 번 날갯짓 순환입니다. 왼쪽 비행은 좌우 반전하고, 이동 경로는 게임에서 따로 적용하며, 프레임당 85~110ms가 어울립니다.
- 게임에서 쓰는 곳: `js/scenes/voyagefx.js` — 물보라는 선수 양옆에 하나씩(우현은 위아래를 뒤집어) 물마루 밑동(셀 안 x 150, y 226)을 선수 옆에 맞춰 그리고, 갈매기는 모항 배웅 때 항구에서 날아올라 함대를 지나갑니다(그림자는 같은 시트의 검은 실루엣). 조정값 `G.FX.voyage`.
- 각 셀 가장자리에 4px 투명 여백이 있어 텍스처 보간 시 이웃 프레임이 번지지 않습니다.

## 육상전·탐험 스프라이트 규격 (`images/sprites/`)

- 원본은 그림 생성기로 만든 시트라 장면이 줄마다 제멋대로 놓이고 망토·칼·연기가 이웃 장면과 겹칩니다. `images/_extra/sprite_src/<시트>.png`에 두고 `python tools/sprite_repack.py`를 돌리면, 줄마다 장면 수를 알려 준 대로 잘라 **발밑 피벗이 같은 고른 칸**으로 다시 짜서 `sprites/<시트>.webp`와 `js/data/sprites.js`(칸 크기·피벗·동작별 장면 번호)를 만듭니다. `--debug`를 붙이면 장면마다 번호를 단 점검 그림이 `_extra/sprite_debug/`에 생깁니다.
- 모든 그림은 오른쪽을 봅니다(적은 좌우 반전). 시트의 줄 = 부대 종류(예: 장교·견장 장교·망토 장교·제독), 칸 = 장면. 동작(idle·walk·attack·hurt·dead…)마다 쓸 장면 번호는 도구의 `SHEETS` 설정에 있고, 잘못 잘린 장면은 목록에서 빼면 됩니다.
- 쓰는 곳: 육상전(`js/games/landwar.js` — 우리 편 보병·총병·포병·제독대·기병, 적은 싸우는 땅에 따라 유럽·오스만·동아시아·원주민·짐승), 육상 탐험 지도(`js/art/party.js` — 도보·말·짐꾼·당나귀·마차·낙타·라마·코끼리·순록 썰매·야크 탐험대 8방향), 사건 그림 창(`js/art/eventfx.js` — 고래·돌고래·인어·폭풍·비구름·소나기·뙤약볕·짐승 습격). 조정값은 `G.FX.sprites`(`js/data/seafx.js`).
- 탐험대 8방향 시트는 저장소 밖 `../assets/sprites/land_expedition/`의 매니페스트(줄 = N NE E SE S SW W NW)를 따라 반 크기로 줄여 `sprites/party_*.webp`로 씁니다(탈것마다 천천히·빨리 두 장, 모두 20장).
- 그림 파일이 없으면 예전처럼 코드로 그립니다(사건 그림 창은 띄우지 않음).

## 일기토 시트 규격

- 자세한 인물 목록과 좌표는 `images/duel/README.md`, 게임에서 읽는 값은 `js/data/duelart.js`에 있습니다.
- 모든 시트는 6열×4행입니다. 1행 공격 6장, 2행 방어 4장, 3행 피격 3장, 4행 행동 6장입니다. 남는 칸은 완전히 투명합니다. 상대편은 게임에서 좌우 반전합니다.
- 그림을 만들 때 규격은 1536×1024(셀 256, 발밑 피벗 `(128, 246)`)입니다. 그런데 찌르기 칼날·긴 병기·대기 동작의 머리가 옆 칸으로 60~125px 넘어가는 일이 잦아, 게임에는 `python tools/duel_repack.py 원본폴더 images/duel/fighters`로 **칸 432×304, 피벗 `(165, 278)`** 시트(2592×1216)로 다시 짜서 넣습니다. 도구가 장면마다 몸통에서 이어진 픽셀을 따라가 어느 장면의 것인지 가려 옮기므로 그림 크기(픽셀)는 그대로이고 잘리지 않습니다. 원본은 `images/_extra/duel_fighters_src/`(저장소 밖)에 둡니다.
- 게임(`js/data/duelart.js` `layout`)은 그림 너비로 두 규격을 알아봅니다 — 1536 너비 원본을 그대로 넣어도 그려지지만 넘친 칼날은 잘립니다. 점검: `node tests/duel_assets_smoke.js`, `python tools/duel_repack.py --check images/duel/fighters`.
- 배경은 `deck`, `land_battle`, `exploration`, `city`, `tavern` 다섯 장이며 1060×380 일기토 화면에 맞춰 덮어 그립니다.

## 알아 둘 점

- 거리 배경이 있는 도시는 **거리 화면**이 됩니다. 배경 위에 `exteriors/` 건물이 늘어서고, 건물을 누르거나 오른쪽 메뉴에서 골라 들어갑니다. 배경이 없으면 예전처럼 코드로 그린 도시 풍경 한 장이 나옵니다.
- 한 자리에 여러 이름이 있으면 더 구체적인 이름부터 찾습니다. 예) 리스본 술집: `tavern@0` → `tavern_europe` → `tavern` → 코드 그림.
- 그림은 칸을 꽉 채우도록 가운데를 기준으로 잘라 씁니다. 인물은 위쪽 4분의 1 지점을 기준으로 자르므로 얼굴을 위쪽에 두세요.
- 해질녘·저녁 전용 그림이 없으면 기본 그림에 옅은 노을빛을 입혀 씁니다.
- 바다 지도, 육상 탐험 지도, 해전 화면은 실시간으로 그리는 화면이라 파일로 바꾸지 않습니다.
- claude.ai에 올리는 한 파일짜리 판은 16MB까지입니다. 그림을 많이 넣을 때는 JPG(품질 80 안팎)로 저장하세요.
