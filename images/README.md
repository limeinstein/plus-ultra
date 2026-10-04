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
| 추가 도시 거리 배경 | `backgrounds/286.jpg`~`297.jpg` — 소주·하문·상해·독도·시베리아 5곳·우르가·후허호토·에도. 기존 그림을 참고해 내장 ImageGen으로 제작. 제작 지시문은 `tools/backgrounds/additional-prompts.json` | 1600×900 |
| 거리 앞길 바닥 (지역별) | `street-ground/양식.webp` — `python tools/street_ground.py`가 Codex 기준 그림 `docs/art/regional-street-ground-reference.png`(칼사다·부채꼴·모자이크·둥근 돌·판석·흙길 6칸)에서 만드는 19장(iberia·espana·italy·france·east·russia·arabia·ottoman·swahili·africa·india·seasia·eastasia·japan·steppe·volcanic·andes·native·pueblo — `js/scenes/town.js` GROUND_STYLE) | 높이 164, 가로로 끝없이 이어지는 띠(폭 218~569) |
| 건물 겉모습 (거리에 세움) | `exteriors/건물.webp` (tavern, trade, inn …) · 도시별 `@도시번호` · 후원자 저택 `mansion@후원자ID` | 배경 지운 PNG·WEBP, 높이 660 |
| 지역별 건물 묶음 | `exterior-styles/<묶음>/건물.webp` — 북미 원주민은 `woodland`(숲: 나무껍질 긴 집·위그웜·티피·울타리·카누), `plains`(평원 티피·가죽 천막 시장·의식용 큰 티피·목책 성문, 다코타 230·만단 243), `pueblo`(흙벽돌 계단 집·키바, 타오스 241·아코마 242). 없는 건물은 plains·pueblo → woodland → tropic 순으로 빌림. `tools/natives/make.py`가 기본 그림을 다시 만든다 | 배경 지운 WEBP, 높이 520(시장 660) |
| 거리 볼거리 (장식) | 도시 건축 발견물은 `landmarks/발견물ID.webp`로 두면 해당 도시·건축 연도에 자동 배치. 그 밖의 장식은 `landmarks/이름.webp`와 `js/scenes/town.js`의 `LANDMARKS`로 수동 배치 | 배경 지운 PNG·WEBP, 권장 높이 520 |
| 제독 — 거리에서 걷는 모습 | `characters/walk_1.webp` … `walk_8.webp` (옆모습, 발끝이 아래) | 높이 430 |
| 제독 — 수첩 반신상 | `characters/player_half.webp` | 512×512 |
| 제독 — 대화창 얼굴 | `portraits/player/이름.webp` (가슴 위) | 512×512 |
| 제독 — 40세 이상 얼굴 | `portraits/player-aged/이름.png` (젊은 얼굴과 같은 이름, 수염 난 모습) | 512×512 |
| 제독 — 생김새별 그림 | 만들기 화면에서 얼굴 `portraits/player/<이름>`을 고르면 반신상 `characters/player_half_<이름>`, 걷는 그림 `characters/<이름>/walk_1…8`, 일기토 시트 `duel/fighters/<이름>`을 쓴다(없으면 기본 제독 그림). 테스트 캐릭터 이강희 = `ganghui` | 위와 같음 |
| 제독 — 40세 이상 무릎상 | 기본 `characters/player_half_old.png`, 그 밖 `characters/player_half_<이름>_old.png`. 현재 나이가 40세가 되는 날부터 얼굴과 함께 자동 교체 | 512×512 |
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
| 자녀 | `portraits/family/daughter_age5.png` · `_age10` · `_age15` (3~7살·8~12살·13살부터), `son_…` 같은 꼴. 무릎상은 끝에 `_half` (대화창 위에 서는 모습, 1024×1536 투명). 딸은 어머니의 고장 `portraits/family/<고장>/daughter_…` (여급 그림 묶음 `maid-styles/<고장>`과 같은 이름: iberia·france·britain·korea…), 아들은 제독의 생김새 `portraits/family/<생김새>/son_…` (sea_dog·muscle_swordsman… `I.heroLook`). 없으면 폴더 없는 그림 → `daughter_<몇째>.png` → `daughter.png` | 흉상 1254×1254, 무릎상 1024×1536 |
| 자택 장면 | `events/home/<이름>.webp` — 아이와 보내는 시간·집안일의 배경(아이 무릎상이 그 앞 가운데에 선다 → **가운데는 비우고 볼거리는 왼쪽·오른쪽에**, 사람은 그리지 않는다). 이름: yard(마당의 대야와 장난감 배) · harbor(해 질 녘 부두) · drawing(그림 그리는 탁자) · shell(조개 목걸이) · night(밤의 아이 방) · swords(목검과 허수아비) · duel(진검) · chart(서재의 해도) · pier(새벽 낚시) · book(책과 깃펜) · market(장난감 좌판) · chess(난롯가 체스판) · stars(밤하늘과 사분의) · ledger(장부와 금화) · window(바다가 보이는 창) · dinner(저녁상) · easel(화가의 이젤) · cake(생일 과자) · vase(깨진 꽃병) · bed(앓아누운 침대) · barrel(부두의 식량 통) · height(문설주의 키 금). 없으면 고향의 건물 안·도시 그림에 빛깔을 입혀 쓴다 (`js/art/homeart.js` `HA.SCENES`) | 900×520 |
| 발견물 | `discoveries/발견물ID.jpg` (예: `capegood`). 유적은 `tools/ruin_gifs`, 자연 경관은 `tools/nature_gifs`, 동물은 `tools/animal_gifs`, 식물은 `tools/plant_gifs`, 보물은 `tools/treasure_gifs`로 만든 GIF를 쓰면 전용 발견 연출이 재생됨 | 1440×640 정지화상 또는 576×256 GIF |
| 발견물 — 분류 공통 | `discovery-cats/geo.jpg` (geo·nature·ruin·treasure·creature·people·trade) | 1440×640 |
| 일반 소지품 | `items/아이템ID.webp` (레이피어 `rapier`, 나침반 `compass`, 약속 반지 `ring` 등) · 종류 공통 `item-kinds/종류.webp` | 투명 배경 정사각형, 권장 256×256 |
| 발견 유물 | `relics/유물ID.webp` (예: `r_qinshi`, `r_sillacrown`) · 종류 공통 `relic-kinds/종류.webp` | 투명 배경 정사각형, 권장 256×256 |
| 교역품 | `goods/교역품ID.webp` (후추 `pepper`, 비단 `silk`, 대포 `cannon` 등) · 갈래 공통 `good-kinds/갈래.webp` | 투명 배경 정사각형, 권장 192×192 |
| 지도에 남는 유적 모형 | `map-discoveries/ruins-1.png` … `ruins-4.png` — 도시 밖 유적 52곳을 4×4 셀에 13곳씩 배치 | 투명 배경 PNG, 4열×4행 |
| 배 | `ships/배ID.webp` — 36종 (예: caravel·carrack·galleon·galley·dhow·junk·baochuan·panokseon·geobukseon·atakebune …, 전체 목록은 `python tools/images.py --list`) | 880×480 |
| 항해·해전 8방향 동작 배 | `ships-nav/배ID.webp` — `python tools/ship3d/bake.py`가 three.js 3D 모형으로 굽는 정박 3장·표류 5장·질주 8장 시트(치수·돛대 자리는 `tools/render_ship_sprites.py`와 같다) | 자동 생성 1792×3584, 셀 224×224, 수면 피벗 (112,139), 투명 배경 |
| 기함 선실 | `cabins/선실ID.webp` — 함장실 `captain`, 부관실 `adjutant`, 조타실 `helm`, 파수대 `lookout`, 갑판 `deck`, 빈 선실 `hold`, 지도 제작실 `chart`, 요리실 `galley`, 식당 `mess`, 회계실 `account`, 예배실 `chapel`, 진료실 `sick`, 오락실 `rec`, 조범실 `rig`, 선박 수리실 `repair`, 사육실 `pen`, 포격실 `gun`, 해병 대기실 `marine`, 통역실 `interp` | 정사각형, 권장 320×320 |
| 항해 효과 스프라이트 시트 | `effects/ship_spray.png`, `effects/departure_gull.png` | 1024×512, 4열×2행, 셀 256×256, 투명 배경 |
| 육상전·육상 탐험·사건 스프라이트 | `sprites/시트.webp` — 우리 편 0~3단계(swordsmen·musketeers·cannons·officers), 지역 적(east_fighters·ottoman·natives·west_europe·india_central·southeast_asia·africa_regions·meso_south·north_america·pacific), 들짐승(animals), 항해 사건(whale·dolphin·mermaid·storm·raincloud·rain·sun), 탐험대 8방향(party_*) | `python tools/sprite_repack.py`가 원본(`_extra/sprite_src/`)을 고른 칸으로 다시 짠 것. 칸·피벗은 `js/data/sprites.js` |
| 육상전 지형 배경 | `landwar/backgrounds/지형.png` — grass·steppe·desert·forest·jungle·mountain·snow·tundra·ice | 초광폭 2.25:1 이상, 가로 1800 이상 |
| 일기토 전투원 | `duel/fighters/이름.png` | 2592×1216, 6열×4행, 칸 432×304, 발밑 피벗 (165, 278), 투명 배경 — 1536×1024(칸 256) 원본을 `tools/duel_repack.py`로 다시 짠 것 |
| 일기토 배경 | `duel/backgrounds/deck.png` 등 | 초광폭 2094×751 안팎 |

전체 이름 목록은 `catalog.html`에서 그림과 함께 보거나, `python tools/images.py --list`로 글자로 볼 수 있습니다.

소지품·유물·교역품 그림은 `images/_extra/item-src/`의 그림판을 `python tools/split_item_atlases.py`로 나눈 것입니다(무기·유물 무기 그림판은 물체별로 나눠 긴 칼날·창끝이 잘리거나 이웃 칸 조각이 붙지 않음). 게임에서 쓰는 곳: 교역소 표·시세 수첩·함대 짐·도시 정보(교역품), 시장 구입·매각 목록과 구입 확인 창, 소지품 수첩, 선물 고르기(여급·부하·원주민), 해적선에서 건진 물건, 유물·물건을 얻을 때의 알림, 발견 카드, 도감. 코드에서는 `G.Img.itemSrc(물건)`·`G.Img.goodSrc(교역품ID)`로 주소를 얻습니다. 그림이 없으면 예전처럼 코드로 그린 그림이 나옵니다.

신규 제독 생김새 12종은 `navigator_white`(하얀 남방), `armored_navigator`(철갑), `sea_dog`(망원경),
`muscle_swordsman`(근육 검사), `hat_spinner`(모자를 돌리는 항해사), `charismatic_admiral`(카리스마 제독),
`battle_vanguard`(전투 직전), `noble_scholar`(귀족 학자 제독), `casanova`, `army_officer`(정규군 장교),
`sky_adventurer`(갈색 가죽 모험 항해사), `blackcoat_captain`(검은 코트의 냉정한 선장)입니다.
기본 제독 `admiral`과 이강희 `ganghui`에도 40대 얼굴·무릎상이 있습니다.
정지 인물화는 머리부터 무릎까지만 그리며 정강이·장화·발은 포함하지 않습니다. 보행·전투 동작 시트만 동작 판독을 위해 전신을 사용합니다.

## 항해 효과 시트 규격

- 프레임은 왼쪽 위부터 가로 방향으로 읽으며 0~7번입니다. `x = (프레임 % 4) × 256`, `y = floor(프레임 / 4) × 256`입니다.
- `ship_spray`는 오른쪽으로 항해하는 배의 선수 물보라입니다. 배의 진행 방향에 맞춰 시트를 회전해서 쓰며, 프레임당 70~90ms가 어울립니다.
- `departure_gull`은 오른쪽을 보는 갈매기의 한 번 날갯짓 순환입니다. 왼쪽 비행은 좌우 반전하고, 이동 경로는 게임에서 따로 적용하며, 프레임당 85~110ms가 어울립니다.
- 게임에서 쓰는 곳: `js/scenes/voyagefx.js` — 물보라는 선수 양옆에 하나씩(우현은 위아래를 뒤집어) 물마루 밑동(셀 안 x 150, y 226)을 선수 옆에 맞춰 그리고, 갈매기는 모항 배웅 때 항구에서 날아올라 함대를 지나갑니다(그림자는 같은 시트의 검은 실루엣). 조정값 `G.FX.voyage`.
- 각 셀 가장자리에 4px 투명 여백이 있어 텍스처 보간 시 이웃 프레임이 번지지 않습니다.

## 육상전·탐험 스프라이트 규격 (`images/sprites/`)

- 원본은 그림 생성기로 만든 시트라 장면이 줄마다 제멋대로 놓이고 망토·칼·연기가 이웃 장면과 겹칩니다. `images/_extra/sprite_src/<시트>.png`에 두고 `python tools/sprite_repack.py`를 돌리면, 줄마다 장면 수를 알려 준 대로 잘라 **발밑 피벗이 같은 고른 칸**으로 다시 짜서 `sprites/<시트>.webp`와 `js/data/sprites.js`(칸 크기·피벗·동작별 장면 번호)를 만듭니다. `--debug`를 붙이면 장면마다 번호를 단 점검 그림이 `_extra/sprite_debug/`에 생깁니다.
- 모든 그림은 오른쪽을 봅니다(적은 좌우 반전). 시트의 줄 = 병종(우리 편 시트는 줄 = 0~3단계), 칸 = 장면. 동작(idle·walk·attack·hurt·dead…)마다 쓸 장면 번호는 도구의 `SHEETS` 설정에 있습니다. 지역 적 시트 7장(`autoacts`)은 Codex 시트의 동작 차례(대기·전진·달리기·공격·헛손질·피격·뒤돌아 복귀)를 따라 저절로 고르며, 반쪽만 잘린 장면은 빼고 씁니다.
- 원본: `../Claude outputs/육상전투_스프라이트_시트/` 01~15 (README에 줄 구성). 08번까지는 처음 받은 묶음과 같은 그림입니다.
- 쓰는 곳: 육상전(`js/games/landwar.js` — 우리 편 보병 = 검술, 총병 = 사격술, 포병 = 포술 단계의 줄, 제독대 = 세 솜씨 평균(셋 다 3이면 전설), 기병 = 말·낙타·코끼리 탄 탐험대. 적은 싸우는 땅 35곳마다 근접·원거리·우두머리·포대·짐승 — 짝은 `js/data/landwarart.js`), 육상 탐험 지도(`js/art/party.js` — 도보·말·짐꾼·당나귀·마차·낙타·라마·코끼리·순록 썰매·야크 탐험대 8방향), 사건 그림 창(`js/art/eventfx.js` — 고래·돌고래·인어·폭풍·비구름·소나기·뙤약볕·짐승 습격). 조정값은 `G.FX.sprites`(`js/data/seafx.js`).
- 탐험대 8방향 시트는 저장소 밖 `../assets/sprites/land_expedition/`의 매니페스트(줄 = N NE E SE S SW W NW)를 따라 반 크기로 줄여 `sprites/party_*.webp`로 씁니다(탈것마다 천천히·빨리 두 장, 모두 20장).
- 크기는 장면들의 몸 키 가운데값(`bh`, 치켜든 무기 제외)으로 맞춥니다. 배포판(`tools/slim.py`)은 이 시트들을 줄이지 않고, 혹시 줄어 있어도 게임이 칸 좌표를 그림 크기에 맞춰 읽습니다.
- 그림 파일이 없으면 예전처럼 코드로 그립니다(사건 그림 창은 띄우지 않음).

## 일기토 시트 규격

- 자세한 인물 목록과 좌표는 `images/duel/README.md`, 게임에서 읽는 값은 `js/data/duelart.js`에 있습니다.
- 모든 시트는 6열×4행입니다. 1행 공격 6장, 2행 방어 4장, 3행 피격 3장, 4행 행동 6장입니다. 남는 칸은 완전히 투명합니다. 상대편은 게임에서 좌우 반전합니다.
- 그림을 만들 때 규격은 1536×1024(셀 256, 발밑 피벗 `(128, 246)`)입니다. 그런데 찌르기 칼날·긴 병기·대기 동작의 머리가 옆 칸으로 60~125px 넘어가는 일이 잦아, 게임에는 `python tools/duel_repack.py 원본폴더 images/duel/fighters`로 **칸 432×304, 피벗 `(165, 278)`** 시트(2592×1216)로 다시 짜서 넣습니다. 도구가 장면마다 몸통에서 이어진 픽셀을 따라가 어느 장면의 것인지 가려 옮기므로 그림 크기(픽셀)는 그대로이고 잘리지 않습니다. 원본은 `images/_extra/duel_fighters_src/`(저장소 밖)에 둡니다.
- 게임(`js/data/duelart.js` `layout`)은 그림 너비로 두 규격을 알아봅니다 — 1536 너비 원본을 그대로 넣어도 그려지지만 넘친 칼날은 잘립니다. 점검: `node tests/duel_assets_smoke.js`, `python tools/duel_repack.py --check images/duel/fighters`.
- 배경은 `deck`, `land_battle`, `exploration`, `city`, `tavern` 다섯 장이며 1060×380 일기토 화면에 맞춰 덮어 그립니다.

## 미니게임 그림

- 유적 퍼즐 6종·포카·바다 낚시는 `minigames/`의 새 그림을 쓴다. 건물 외관 `exteriors/tavern.webp`, `church.webp`의 석재·목재·금속 질감을 참고했다.
- `props.png`는 1254×1254 투명 소품 판이다. 돌 원반·기둥·보석·천칭·잔 3개·입방체·돌판·바위·열쇠·문·횃불·카드 앞뒷면·물고기의 16종이 들어 있다. 실제 소품 경계는 `js/data/minigameart.js`에 있다.
- `ruins.png`, `sphinx.png`, `poker.png`, `fishing.png`는 1536×1024 배경이다. `boat.png`는 같은 크기의 투명 낚싯배 그림이다. 투명 배경을 흰색이나 검은색으로 합치지 않는다.
- 그림 주소는 `G.Img`로 읽으며, 숫자·카드 무늬·물 양·입방체 방향·낚시 줄은 게임에서 겹쳐 표시한다. 배경에 글자를 그려 넣지 않는다.
- 낚시 수면 정렬·배 위치는 `js/data/seafx.js`의 `G.FX.minigames`, 화면 배치는 `css/minigames.css`에서 조정한다. 한 파일판에서 줄어든 소품 판도 원본 좌표 비율에 맞춰 그린다.
- 생성 도구와 프롬프트: `docs/art/minigame-prompts.json`. 실제 게임 화면 모음: `docs/art/minigame-preview.png`. 점검: `node tests/minigame_art_smoke.js` (Playwright·Chromium 필요).

## 알아 둘 점

- 거리 배경이 있는 도시는 **거리 화면**이 됩니다. 배경 위에 `exteriors/` 건물이 늘어서고, 건물을 누르거나 오른쪽 메뉴에서 골라 들어갑니다. 배경이 없으면 예전처럼 코드로 그린 도시 풍경 한 장이 나옵니다.
- 한 자리에 여러 이름이 있으면 더 구체적인 이름부터 찾습니다. 예) 리스본 술집: `tavern@0` → `tavern_europe` → `tavern` → 코드 그림.
- 그림은 칸을 꽉 채우도록 가운데를 기준으로 잘라 씁니다. 인물은 위쪽 4분의 1 지점을 기준으로 자르므로 얼굴을 위쪽에 두세요.
- 해질녘·저녁 전용 그림이 없으면 기본 그림에 옅은 노을빛을 입혀 씁니다.
- 바다 지도, 육상 탐험 지도, 해전 화면은 실시간으로 그리는 화면이라 파일로 바꾸지 않습니다.
- claude.ai에 올리는 한 파일짜리 판은 16MB까지입니다. 그림을 많이 넣을 때는 JPG(품질 80 안팎)로 저장하세요.
