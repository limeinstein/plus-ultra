# 무도회 마녀 그리젤다 인물화 — 2026-11-05

`G.BALL_WITCH`의 엉겅퀴 마녀 그리젤다(`w_thistle`)에게 전용 얼굴상과 무릎상을 제작했다. 첫 첨부의 차가운 눈매·차분한 표정·긴 잿빛 금발 분위기를 성인 마녀의 얼굴로 해석하고, 두 번째 첨부의 검정·녹색 비대칭 드레스를 반영했다. 녹색 퍼프 소매와 프릴, 검정 몸판, 금색 장식·허리띠, 엉겅퀴 펜던트와 나무 지팡이로 구별한다.

미형의 반실사 회화 인물화다. 무릎에서 치마가 잘리며 발·신발이 나오지 않는다. 얼굴상은 최종 무릎상에서 추출했다. 참고 이미지의 학교 복장과 상징, 드레스 도안의 글자·배경은 포함하지 않았다.

- [얼굴상·무릎상 미리보기](ball-witch-portraits-20261105-preview-1.jpg)
- [2장 WebP·미리보기·제작 지시문 ZIP](../../artifacts/ball-witch-portraits-20261105/ball-witch-portraits-20261105.zip)
- [실제 생성 지시문·참고 경로·원화 경로](../../tools/ball_witch_portraits_20261105_prompts.json)
- [변환·등록 스크립트](../../tools/package_ball_witch_portraits_20261105.py)

내장 `image_gen`으로 생성했으며, 최종 PNG는 `artifacts/ball-witch-portraits-20261105/sources/w_thistle.png`에 보존했다. 게임 파일은 `images/portraits/legendary/w_thistle.webp`(448×448)와 `w_thistle_half.webp`(1024×1536), 모두 투명 배경이다. `images/manifest.js`와 `js/data/portraitfaces.js`에 등록했다. 기존 마녀의 동료 ID·설정·초상 선택 경로를 사용하므로 무도회와 동료·가족 대화에서 같은 얼굴을 쓴다.

`tests/ball_ladies_portraits_20261105_smoke.cjs`에서 영애·부인 12명과 마녀 1명의 초상 26장 해독·규격·얼굴 좌표·실제 대화창과 가족 연결을 함께 확인한다. 규격·RGBA·투명 영역 검증은 변환 스크립트의 `asset-checks.json`에, 화면 검증은 `artifacts/ball-ladies-portraits-20261105/screenshots/`에 저장한다. 시험 뒤 Chromium을 종료한다.
