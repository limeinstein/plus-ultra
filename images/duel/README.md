# 일기토 그림 묶음

`fighters/`에는 투명 전투원 시트와 전설 전용 시트, `backgrounds/`에는 초광폭 전투 배경 5장,
`cutins/`에는 화면 전체를 덮는 인물별 일격필살·필살기·호통 5단계 GIF, `finishers/`에는 비밀무기·호통 보조 효과가 있습니다.

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
| 2 | 피격 | 3 | 70, 110, 300 |
| 3 | 행동·대기 | 6 | 180, 180, 180, 180, 150, 180 |

프레임 원점은 `x = 열 × 칸 너비`, `y = 행 × 칸 높이`입니다. 상대편은 같은 그림을 가로 반전해서 씁니다.

2026-10-28: 아토스·아라미스의 큰 몸과 칸을 넘은 칼끝·장화를 다시 분리하고 모든 동작에 같은 배율을 적용했습니다.
37명 모두 피격 마지막 칸을 실제로 바닥에 누운 자세로 바꿨습니다. 보통 피격은 480ms 뒤 대기로 돌아가며,
체력이 0이면 마지막 칸을 유지합니다. 원화·sprite-gen 제작 명령·검증은 `docs/art/duel-motion-2026-10-28.md`에 있습니다.

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

`main_admiral`, `first_mate`, `western_brawler`, `columbus`, `cortes`, `redhair_pirate`, `blonde_pirate`, `african_warrior`, `mesoamerican_warrior`, `guan_yu`, `zhang_fei`, `d_artagnan`, `athos`, `aramis`, `joseon_swordsman`, `east_asian_attendant`, `samurai`, `barbary_corsair`, `caribbean_pirate`, `explorer`, `vietnamese_woman`, `indian_warrior`, `native_chief`, `spanish_soldier`.

제독 생김새 시트(21종 밖, 얼굴 그림 이름과 같음): `ganghui`(이강희), `navigator_white`,
`armored_navigator`, `sea_dog`, `muscle_swordsman`, `hat_spinner`, `charismatic_admiral`,
`battle_vanguard`, `noble_scholar`, `casanova`, `army_officer`, `sky_adventurer`, `blackcoat_captain`.

## 전면 필살기 컷인

- 모든 전투원 시트마다 `cutins/<id>.gif`가 있다. 1060×380, 정확히 다섯 장면이며 0.9초 동안 `기세 모으기 → 무기 당기기 → 돌진 → 타격 섬광 → 자세 회수`로 한 번 재생한 뒤 마지막 자세에서 멈춘다. CSS는 시작할 때 먹빛으로 화면을 열고 섬광 띠를 보탠다(`css/style.css` `.rd-motion.cutin` · `.rd-cut-flash`). 적이 쓰면 좌우를 뒤집어 오른쪽에서 들어온다.
- 일격필살·필살기는 컷인이 덮은 채로 칼이 들어가고, 호통은 컷인에 고함을 띄운 뒤 원래의 호통 기운(`finishers/.../roar.gif`)이 퍼진다.
- 장비는 `cutins/_source/zhang_fei/prepare.png`와 `recover.png`를 추가로 써서 준비·회수 자세가 돌진 원화와 실제로 다르다. 다른 인물은 현재 한 장 원화에 단계별 화면 이동·속도선·명암을 합성한다.
- 작은 전투 스프라이트를 확대하지 않고, 원본 얼굴·머리·복식·무기를 참조해 별도의 초광폭 원화를 만들었다. 원화는 `cutins/_source/`에 보관하며 매니페스트에는 넣지 않는다.
- 지역 미술: 유럽권 채색 동판화, 중국 수묵·공필화, 조선 한지 수묵·민화, 일본 무사 우키요에, 이슬람권 마그레브·오스만 세밀화, 인도 라지푸트 세밀화, 동남아 칠화·목판화, 아프리카 직물·부조 선화, 아메리카 필사본·회화 문법.
- 검술 3 전설인 관우·장비·달타냥·아토스·아라미스는 같은 인물 컷인 위에 각자 청룡언월·장판교 벽력·가스코뉴의 섬광·귀족의 십자검·성 미카엘의 기도 이름을 표시한다.
- 장비의 호통은 `finishers/zhang_fei/roar.gif`, 다른 인물의 호통과 비밀무기는 `finishers/common/`의 투명 효과 GIF를 쓴다.
- 컷인 다시 만들기: `python tools/duel_cutins.py --build`. 게임 파일을 건드리지 않고 결과를 확인하려면 `--preview`, ImageGen 인물 참조를 다시 뽑으려면 `--references`를 쓴다.

## 배경 파일

- `deck.png`: 해상 백병전
- `land_battle.png`: 육상 전투
- `exploration.png`: 탐험
- `city.png`: 도시
- `tavern.png`: 술집

## 타격 효과 연결

화면 흔들림, 전체 화면 플래시, 넉백, 피격 파티클은 그림에 구워 넣지 않고 `js/games/duel.js`에서 따로 합성합니다. 세기는 `js/data/seafx.js`의 `G.FX.duel`에서 조정합니다. 따라서 색약 모드나 연출 끄기 설정과 충돌하지 않고, 같은 시트를 다른 전투 화면에서도 재사용할 수 있습니다.
