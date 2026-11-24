# 회화 탐험대와 모자 없는 여성 제독

2026-11-24. 사용자가 지정한 기존 탐험대의 회화풍을 기준으로 도보 인물의 걷기·달리기·정지 그림을 연결했다. 구체 관절 인형 형태의 첫 3D 시안은 적용하지 않는다. 최종 Blender 파일은 원화를 입힌 **2.5D 그림판 애니메이션**이며, 자유 시점의 입체 인체 모델은 아니다.

- 남성 제독: 검은 깃털 모자, 남색 금장 외투, 붉은 망토, 장화와 검.
- 여성 제독: 사용자가 제공한 의상을 모티브로 붉은 긴 머리·흰 리본·자주색 의상·금장 남색 망토·긴 가죽 장화. 모든 방향과 동작에서 모자를 쓰지 않는다.
- 부하: 기존 회화풍 남성 대원과 여성 대원. 부하가 있으면 표시되는 부하 가운데 한 명은 여성이다. 제독 포함 표시 인원은 기존처럼 최대 네 명이다.
- 빠른 이동은 상체를 숙이고 팔꿈치·무릎을 굽히는 별도 달리기 그림을 쓴다. 8방향 × (걷기 4장 + 달리기 4장 + 정지 1장) × 4인물 = 288자세, WebP 12개.

## 방향·달리기·탈것 수정 (같은 날 후속 요청)

도보 부하의 앞쪽 대각선 원화가 남동·남서와 반대로 쓰이던 부분을 바로잡았다. 남녀 제독의 앞쪽 대각선은 정면이 보이는 새 걷기·달리기 원화로 교체했고, 여성 부하는 상체를 숙이고 팔꿈치를 굽히며 무릎과 뒤꿈치를 높이 드는 새 달리기를 쓴다. 시트 비교 화면은 실제 이동 경로가 없으므로 같은 캐시에서 방향 선택·자동 회전을 할 때 부하도 제독과 같은 방위를 향한다. 실제 지도에서는 기존처럼 각자의 이동 경로를 따라 돈다.

도보 외에도 말·단봉낙타·쌍봉낙타·당나귀·라마·야크·말 마차·소 마차·코끼리·순록 썰매에 남녀 제독과 여성 부하를 연결했다. 여성 짐꾼은 큰 보급 바구니를 지고 걷는다. 말과 낙타에서는 안장에 앉아 고삐를 잡고, 당나귀·라마·야크는 옆에서 이끈다. 마차는 마부석, 코끼리는 뒷좌석, 썰매는 썰매 안에 앉는다. 여성 제독의 붉은 머리·흰 리본·자주색 의상·금장 남색 망토·모자 없는 외형을 유지한다.

순록의 좌우 방위를 별도로 교정하고, 북쪽은 사람과 동물의 뒷모습이 함께 보이도록 다시 제작했다. 남성 부하의 순록 북쪽도 따로 수정했다. 탈것 전용 시트 32개·1024자세를 추가했다. 원본과 지시문은 `tools/expedition_blender/mounts/`, 실제 투명 틈과 방향 감사 정보는 `prepare_mounts.py`·`mounts/direction_audit.json`에서 읽는다. `build_mounts.py`를 Blender로 실행한 뒤 `package_mounts.py`로 등록한다. 북쪽 순록만 다시 출력할 때는 Blender 인수 뒤 `-- reindeer`를 붙인다.

게임용 시트는 실제 표시 크기에 맞춰 도보 셀 112×128, 탈것 셀 240×160으로 내보낸다. 여러 탈것을 한꺼번에 비교해도 그림 캐시가 계속 비워지지 않도록 중복되는 옛 무리 원화는 받지 않고, 해당 인물·탈것 시트가 준비된 뒤 함께 표시한다. 높은 해상도의 원화·Blender 출력은 제작 폴더에 보존한다. 최종 탈것 원본은 `artifacts/expedition-mounts-20261124/expedition_mounts.blend`.

추가 검사: `node tests/expedition_directions_mounts_20261124_browser.cjs` — 12가지 이동 수단 × 남녀 제독 × 보통/빠른 이동 × 탈것 1/충분함 × 8방향 = 768조합. 제독뿐 아니라 모든 부하의 방위·동작·탈것·성별을 확인하고 같은 캐시의 정지 회전, 실제 미리보기의 남서 2배속을 검사한다. 원화의 얼굴·주둥이·발끝 방향은 `artifacts/expedition-mounts-20261124/audit-*.jpg`로 함께 검수한다. 화면과 결과는 같은 폴더에 남긴다.

## 원본과 재출력

원화는 내장 `image_gen`으로 제작했다. 기존 남녀 부하의 걷기는 기존 원화를 유지하고 달리기를 추가했다. 지시문은 `tools/expedition_blender/painted/prompts.json`, 새 원본 PNG는 같은 폴더에 보관한다. 외부 API 키나 CLI 생성기는 쓰지 않았다.

1. `python tools/expedition_blender/prepare_painted.py` — 투명 여백을 정리하고 인물 크기·방향을 맞춘다. 팔다리를 늘이거나 얼굴을 다시 그리지 않는다.
2. Blender 4.5.9의 배경 실행으로 `tools/expedition_blender/build.py`를 실행한다. 원화 텍스처·걷기/달리기/정지 그림판·72프레임의 UV와 표시 전환·정사영 카메라를 만든다. 모든 텍스처를 `.blend`에 포함한다.
3. `python tools/expedition_blender/package.py` — Blender 출력에서 게임용 시트와 `js/data/expedition_blender.js`를 만든다.

최종 `.blend`와 원화 비교: `artifacts/expedition-blender-painted-20261124/expedition_painted.blend`, `company-preview.jpg`. 게임에서 쓰는 WebP는 `images/sprites/expedition-blender/`에 있다.

## 게임 연결

`js/art/expedition_formation.js`에서 제독은 기존 `G.R.heroFemale()` 판정으로 외형을 고른다. `heroGender`는 미리보기에서만 성별을 지정할 때 쓴다. 각 대원의 실제 화면 이동 속도와 `fast` 입력을 보고 걷기·달리기를 고르며, 제독이 멈춘 뒤 따라오는 대원은 계속 이동하다 자기 위치에 닿으면 정지한다. 저장 형식과 실제 이동 속도·날짜·발자국·좁은 길 추종은 바꾸지 않는다.

조정값은 `G.FX.sprites.expedition.formation.gait`: 달리기 진입 70px/초, 걷기 복귀 56px/초, 여성 대원 기본 자리 3번(부하가 적으면 마지막 자리). 도보는 `G.EXPEDITION_PAINTED`, 탈것과 짐꾼은 `G.EXPEDITION_MOUNT_ART`에서 인물·이동 수단에 맞는 그림을 고른다. 일반 남성 부하의 기존 탈것 원화도 함께 쓰며, 여성이나 제독이 공용 남성으로 바뀌지 않게 전용 시트를 먼저 준비한다.

미리보기는 `test_expedition_following.html`과 `test_expedition_formation.html`. 제독 성별과 속도 1×/2×를 바꿔 확인할 수 있다.

## 검사

- `node tests/expedition_painted_20261124_browser.cjs`: 실제 파일 실행, 12개 시트·288자세, 남녀 제독과 8방향, 1~4명 편대의 여성 부하 수, 실제 속도로 걷기/달리기 전환, 뒤따라온 뒤 정지, 실제 여성 제독 지도, 저장 호환, 콘솔 오류 0.
- `node tests/expedition_following_test.js`: 10종 탈것의 연속 추종·모퉁이·좁은 길·급반전·정지·카메라 이동.
- `node tests/expedition_motion_test.js`: 기존 424개 자세·방향·회전·야영·공통 크기.
- `node tests/expedition_following_browser.js`: 10종 실제 시트·지도·카메라·발자국. 검사 시작 전에 회전·동료 시트도 기다려 로딩 중 대체 그림이 동선 측정에 섞이지 않게 한다.

브라우저 결과와 실제 화면은 `artifacts/expedition-blender-painted-20261124/`. 모든 시험 브라우저와 Blender 배경 과정은 종료한다. 배포는 하지 않았다.
