# 자녀 40대 성장 초상·성인 가족 이벤트 이미지

- 생성 방식: Codex 내장 ImageGen
- 초상: 기존 20대 자녀 무릎상 10장을 참조한 인물 동일성 보존 나이 진행
- 이벤트: 기존 `family-events` 및 항구 혼례 자산을 참조한 9:4 파노라마
- 게임 크기: 얼굴상 448×44448, 무릎상 1024×1536 RGBA WebP, 이벤트 576×256 WebP

## 초상 프롬프트 방향

공통으로 “참조상의 인종·얼굴형·눈·머리·직업 소품을 유지한 채 20세에서 42세로 자연스럽게 성장, 약한 눈가 주름과 새치, 건강하고 원숙한 표정, 기존 반실사 페인터리 톤, 투명 배경, 무릎상”을 지정했다.

- 딸 v1–v5: 학자, 지도 제작자, 측량가, 탐험가, 궁정 후원자로 성장
- 아들 v1–v5: 숙련 선원, 수석 지도 제작자, 해군 장교, 탐험대장, 외교관과 제독으로 성장

## 이벤트 프롬프트 방향

모든 장면은 “15세기 해양 모험 게임, 따뜻한 반실사 페인터리 스타일, 중요 행동을 576×256 중앙 영역에 배치, 손·뒷모습·어깨 넘어 구도로 외형 가변성 보존, 문자·UI·로고 없음”을 공통 조건으로 사용했다.

1. `31_daughter_wedding_father_pov`: 아버지가 딸을 손에 이끄고 예배당 통로를 걷는 시점
2. `32_daughter_wedding_brother_pov`: 남자 형제가 신부에게 나침반 목걸이를 건네는 시점
3. `33_daughter_wedding_sister_pov`: 여자 형제가 신부의 베일과 머리 장식을 매는 시점
4. `34_adult_daughter_chart_gift`: 나이 든 아버지가 성인 딸에게 나침반과 항해 일지를 물려주는 장면
5. `35_adult_son_first_command`: 성인 아들에게 육분의와 선장실 열쇠를 건네는 첫 지휘 장면
6. `36_adult_siblings_homecoming`: 서로 다른 항해에서 돌아온 성인 남매가 부두에서 재회하는 장면

## 파일

- 원본: `artifacts/portraits/family-age40/raw`, `artifacts/family-adult-events/raw`
- 편집 중간본: `artifacts/portraits/family-age40/faces`, `artifacts/portraits/family-age40/halves`
- 미리보기: `docs/art/family-age40-preview.jpg`, `docs/art/family-adult-events-preview.jpg`
- 가공 재현: `tools/process_family_age40_events.py`
