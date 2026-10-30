# 육상 탐험대 다이아 편대 (2026-10-29)

2026-10-31: 고정 대형으로 옮겨 붙이던 표시를 동료별 경로 추종으로 바꿨다. 넓은 곳의 느슨한 다이아 대열은 유지하되 각자 돌아서 걷고, 모퉁이·좁은 길에서 줄이 좁아진다. 현재 동작과 검사는 [추종 변경 기록](exploration-following-20261031.md), 실제 재생은 `test_expedition_following.html`을 따른다.

선장 혼자 표시되던 육상 탐험에 동료용 투명 PNG 시트 12장을 추가하고 실제 게임에 연결했다. 한 장에 8방향 × 보행 4자세, 총 384칸이다. 내장 ImageGen으로 제작했으며 원본 색과 알파를 보존한다.

## 편대

- 넓은 땅에서는 선장 앞, 좌우 동료 2명, 후미 동료 1명의 다이아 편대다.
- 선원은 화면에서 최대 4자리로 대표 표시한다. 실제 인원이 1~3명이면 그만큼만 표시한다. 각 고용 동료의 고유 얼굴을 재현한 시트는 아니며 이동 수단별 탐험대원 외형이다.
- 선장은 기존 보행·회전 원화를 유지한다. 기존에 없는 소 마차와 쌍봉낙타 조합에서는 해당 이동 수단 시트를 선장 자리에도 사용한다.
- 도보·짐꾼·말·당나귀·낙타·라마·야크·마차·코끼리·순록 썰매 모두 적용했다. 말/소 마차, 단봉/쌍봉낙타를 구분한다.
- 말·낙타가 부족하면 걸어서 따르는 사람이 섞인다. 큰 수레·코끼리·썰매는 좌우 도보 호위와 후미의 두 번째 탈것으로 구성하며, 한 대만 있으면 두 번째 탈것을 그리지 않는다.
- 지나온 길의 방향을 따라 걷고 대원별 걸음 위상을 다르게 한다. 멈추면 마지막 자세를 유지하며 재출발하면 이어서 걷는다. 빠른 이동에서도 기존 거리 기반 보행 주기를 따르며 별도의 질주 원화를 추가한 것은 아니다.
- 해안에서는 가까운 육지 자리를 골라 물 위에 발을 딛지 않게 한다. 넓은 땅의 편대는 유지하고 좁은 땅에서는 자리를 조정한다. 앞뒤 가림은 발밑의 화면 높이 순으로 정렬한다.
- 야영은 기존 공통 야영 장면으로 전환하고 종료하면 편대로 돌아온다. 실제 이동 속도·날짜·소모량과 저장 파일 형식은 바꾸지 않는다.

## 시트와 규격

게임 파일은 `images/sprites/expedition_follower_<이름>.png`다. 생성 결과의 실제 크기와 투명한 틈을 읽어 `cells`에 자르는 좌표와 기준점을 기록한다. 동일한 프레임 크기를 가정해 임의로 균등 분할하지 않는다. 처음 만든 가로로 긴 탈것 일부는 칸 폭이 부족해 넓은 칸 배치로 다시 제작했다. 당나귀는 사람과 동물의 좌우 자리가 일정한 최초 시트를 선택했다.

| 이름 | 모습 | 방향·보행 |
| --- | --- | --- |
| foot | 갈색 망토·청록 옷·배낭의 도보 동료 | 8 × 4 |
| porter | 머리수건·등짐의 짐꾼 | 8 × 4 |
| horse | 말을 탄 동료 | 8 × 4 |
| camel | 단봉낙타 기수 | 8 × 4 |
| camel2 | 쌍봉낙타 기수 | 8 × 4 |
| donkey | 당나귀를 이끄는 동료 | 8 × 4 |
| llama | 라마를 이끄는 동료 | 8 × 4 |
| yak | 야크를 이끄는 동료 | 8 × 4 |
| wagon | 말이 끄는 덮개 마차와 마부 | 8 × 4 |
| oxwagon | 소가 끄는 덮개 마차와 마부 | 8 × 4 |
| elephant | 코끼리·몰이꾼·하우다 탑승자 | 8 × 4 |
| reindeer | 순록이 끄는 짐 썰매와 동료 | 8 × 4 |

## 파일과 생성 지시문

- 최종 PNG: `images/sprites/expedition_follower_*.png`
- 선택한 원본 보관: `artifacts/exploration-formation-20261029/sources/`
- 내장 도구에 실제로 전달한 지시문·참조·선택 기록: `artifacts/exploration-formation-20261029/generated.json`
- 최종 지시문과 방향 행 지정: `tools/exploration_formation_prompts.json`
- 전체 칸 좌표: `artifacts/exploration-formation-20261029/manifest.json`
- 게임 자료: `js/data/expedition_followers.js`
- 편대 표시: `js/art/expedition_formation.js`, 연결 `js/art/expedition_motion.js`·`js/scenes/land.js`
- 크기·간격·위상·회전·물가 자리 찾기 조정값: `G.FX.sprites.expedition.formation` (`js/data/seafx.js`)
- 파일로 여는 동작 비교: `test_expedition_formation.html`
- 스프라이트 묶음: `artifacts/exploration-formation-20261029/sprite-sheets.zip`

다시 좌표를 만들 때는 `python tools/exploration_formation_meta.py`, 그림 등록은 `python tools/images.py`를 실행한다. 생성 도구의 기본 저장 위치가 없어져도 프로젝트에 보관한 원본을 사용할 수 있다. PNG 픽셀을 잘라 붙이거나 몸 일부를 늘려 보행을 합성하지 않는다. 순록 썰매는 실제 원화가 바라보는 방향에 맞춰 일부 행을 좌우 반전해 재생한다.

## 검증

`node tests/exploration_formation_smoke.js`에서 파일 실행으로 12장·384칸과 10가지 이동 수단의 8방향 × 4자세(320가지 조합)를 검사한다. 정지·재출발·회전, 1~4명, 탈것 부족, 지역별 이동 수단, 굽은 길, 해안 자리 조정, 야영과 그림 누락 대체도 확인한다. 실제 리스본 해안과 내륙 지도에서 4자리와 발밑의 육지 여부를 확인한다.

기존 동작 회귀 검사는 `node tests/expedition_motion_test.js`와 `node tests/expedition_motion_browser.js`다. 검사 결과는 `artifacts/exploration-formation-20261029/`에 보관하며, 생성 이미지의 세부 관절이 수학적으로 고정된 골격 애니메이션이라는 의미는 아니다. 브라우저는 성공·실패 모두 `finally`에서 닫는다.

미리보기: `formation-preview.png`, `formation-east.png`, `horse-formation.png`, `horse-coast-in-game.png`, `horse-in-game.png`. 자동 검사 결과는 `browser-results.json`에 있다.

최종 검사 결과: 동료 12장·384칸, 방향·자세 320가지, 실제 지도 4자리와 해안 발밑 검사 모두 통과했다. 기존 10종·424장면의 동작 검사와 실제 야영 시작/종료 검사도 통과했으며 두 브라우저 검사 모두 콘솔 오류 0건이다. 게임에 저장한 PNG 12장은 보관 원본과 SHA-256이 모두 같고, ZIP 내부 파일 무결성도 확인했다. 테스트 브라우저는 모두 닫았다.
