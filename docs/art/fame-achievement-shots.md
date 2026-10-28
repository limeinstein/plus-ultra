# 새 명성 업적샷 22장

2026-10-27, 내장 `image_gen`으로 업적마다 별도의 장면을 생성했다. 기존 업적 그림 60장에 이어 통합 명성 9장, 탐험·교역·전투·사교 각 3장, 네 바다의 조화 1장을 더했다.

- 최종 그림: `images/achievement-events/fame_*.png` (생성 원본 그대로 보존).
- 전체 생성 지시문: `docs/art/fame-achievement-prompts.json`.
- 미리보기: `docs/art/fame-achievement-shots.html`.
- 화풍: 기존 업적샷과 어울리는 대항해 시대 반실사 회화, 가로 9:4, 따뜻한 빛과 목선·황동·직물의 질감. 글자·테두리·현대 물건 없음.
- 통합 명성은 첫 나침반·귀항·해도 발표·탐험·함대 지휘·세계의 교류·전설적인 귀항·구조·다음 세대로의 계승으로 발전한다.
- 탐험은 해도·미지의 땅·박물학 기록, 교역은 첫 거래·큰 상단·세계 교류, 전투는 갑판의 공로·호위·노련한 제독, 사교는 항구의 우정·중재·여러 문화의 신뢰로 구별했다.

`images/manifest.js`에 등록하면 `js/systems/achieve.js`의 기존 `achievementPic`이 업적 ID에 맞는 그림을 고른다. 명성 업적의 공적록 대사와 보상 규칙은 그대로 쓴다. 생성 원본의 너비·높이에 1~2픽셀 편차가 있어 시험에서는 새 그림에만 이를 허용하며, 기존 60장의 1881×836 규격 검사는 유지한다.

확인 명령:

```powershell
$env:BROWSER_EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
node tests/achievement_shots_smoke.js
python tools/audit_event_images.py
```

업적 그림 82개의 실제 이미지 로딩·등록·규격, 기존 동료 업적 달성, 새 명성 업적 22개의 개별 그림·제목·팝업·닫힘을 검사한다. 실제 「네 바다의 조화」 달성 장면은 `artifacts/fame-achievement-shots-20261027/fame-balanced-in-game.png`에 남긴다.
