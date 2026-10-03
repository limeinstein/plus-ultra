# 일기토 그림 묶음

`fighters/`에는 투명 전투원 시트 21장, `backgrounds/`에는 초광폭 전투 배경 5장이 있습니다.

## 전투원 시트

- 만드는 규격(원본): 1536×1024 PNG(RGBA), 6열×4행, 셀 256×256, 발밑 피벗 `(128, 246)`
- 게임에 넣는 규격: **2592×1216, 칸 432×304, 발밑 피벗 `(165, 278)`** — 원본은 찌르기 칼날(옆 칸으로 60~125px)·긴 병기·대기 동작의 머리(윗칸으로 5~19px)가 칸을 넘어, 칸 256으로 자르면 칼이 사라지고 다음 장면에 남의 칼끝이 떠 보였다. `python tools/duel_repack.py 원본폴더 images/duel/fighters`가 장면마다 몸통에서 이어진 픽셀을 따라 주인을 가려 큰 칸으로 옮긴다(픽셀 그대로, 알파 4 이하 먼지는 버림). 원본은 `images/_extra/duel_fighters_src/`.
- 읽는 순서: 왼쪽에서 오른쪽, 모든 동작에서 피벗 고정
- `ganghui`(이강희)는 `--soft-edge 10`으로 짰다: 대기 5장째 치켜든 칼끝 7px이 칸 위로 넘어가 칸 경계에서 흐려지며 사라진다(다른 장면은 그대로).
- 알려진 흠: `zhang_fei` 공격 4~6장은 장팔사모가 다음 장면 몸에 겹쳐 그려져 있어 창끝 일부가 다음 장면에 남는다(다시 그리면 좋음).

| 행 | 동작 | 프레임 | 권장 시간(ms) |
|---|---|---:|---|
| 0 | 공격 | 6 | 120, 90, 80, 70, 100, 140 |
| 1 | 방어 | 4 | 90, 110, 80, 130 |
| 2 | 피격 | 3 | 70, 110, 170 |
| 3 | 행동·대기 | 6 | 180, 180, 180, 180, 150, 180 |

프레임 원점은 `x = 열 × 칸 너비`, `y = 행 × 칸 높이`입니다. 상대편은 같은 그림을 가로 반전해서 씁니다.

## 누가 어떤 그림으로 나오나 (`G.DUEL_ART.pick`)

초상의 양식(style)·성별로 고르고, 없으면 지금 도시의 양식을 씁니다.

| 상대 | 유럽 | 이베리아 | 이슬람권·초원 | 동아시아 | 인도·동남아 | 아프리카 | 아메리카 |
|---|---|---|---|---|---|---|---|
| 해적 두목 | caribbean_pirate | caribbean_pirate | barbary_corsair | samurai(왜구) | caribbean_pirate | caribbean_pirate | caribbean_pirate |
| 적 함장 | spanish_soldier | spanish_soldier·cortes | barbary_corsair | 명 guan_yu · 조선 joseon_swordsman · 일본 samurai | indian_warrior | african_warrior | mesoamerican_warrior·native_chief |
| 술집 사내 | western_brawler | western_brawler | barbary_corsair | 명 zhang_fei · 조선 joseon_swordsman · 일본 samurai | indian_warrior | african_warrior | mesoamerican_warrior·native_chief |
| 부관 | first_mate | first_mate | barbary_corsair | (술집 사내와 같음) | indian_warrior | african_warrior | (같음) |

- 제독 = `main_admiral`. 얼굴 그림으로 생김새가 정해지면(이강희 = `ganghui`) `fighters/<이름>.png`를 쓰고, 없으면 `main_admiral` — 21종과 같은 규격(`tools/duel_repack.py`를 거친 2592×1216).
- 경쟁자 = `explorer`(크리스토발 콜론 = `columbus`, 에르난 코르테스 = `cortes`).
- 여자(초상 g = f): 동아시아 `east_asian_attendant`, 인도·동남아 `vietnamese_woman`, 그 밖 `redhair_pirate`·`blonde_pirate`.

## 전투원 파일

`main_admiral`, `first_mate`, `western_brawler`, `columbus`, `cortes`, `redhair_pirate`, `blonde_pirate`, `african_warrior`, `mesoamerican_warrior`, `guan_yu`, `zhang_fei`, `joseon_swordsman`, `east_asian_attendant`, `samurai`, `barbary_corsair`, `caribbean_pirate`, `explorer`, `vietnamese_woman`, `indian_warrior`, `native_chief`, `spanish_soldier`.

제독 생김새 시트(21종 밖, 얼굴 그림 이름과 같음): `ganghui`(이강희), `navigator_white`,
`armored_navigator`, `sea_dog`, `muscle_swordsman`, `hat_spinner`, `charismatic_admiral`,
`battle_vanguard`, `noble_scholar`, `casanova`, `army_officer`, `sky_adventurer`, `blackcoat_captain`.

## 배경 파일

- `deck.png`: 해상 백병전
- `land_battle.png`: 육상 전투
- `exploration.png`: 탐험
- `city.png`: 도시
- `tavern.png`: 술집

## 타격 효과 연결

화면 흔들림, 전체 화면 플래시, 넉백, 피격 파티클은 그림에 구워 넣지 않고 `js/games/duel.js`에서 따로 합성합니다. 세기는 `js/data/seafx.js`의 `G.FX.duel`에서 조정합니다. 따라서 색약 모드나 연출 끄기 설정과 충돌하지 않고, 같은 시트를 다른 전투 화면에서도 재사용할 수 있습니다.
