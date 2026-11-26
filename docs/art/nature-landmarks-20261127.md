# 자연경관 지도 모형과 접지 (2026-11-27)

전체 자연 발견물 222곳(육상 148·해상 및 특별 74)에 같은 외관·발치·선택 영역을 쓴다. 새 Blender 모형 35곳과 기존 전용 투명 원화를 지도용 이미지 23장으로 묶었다. 발견물 ID·원래 경위도·발견 조건·보상·저장은 바꾸지 않는다.

`G.NATURE_LANDMARKS`는 이미지 칸과 발치·크기를, `G.NATURE_FOOTINGS`는 원래 좌표·검사한 육지 위치·허용 폭을 기록한다. `G.NatureLandmark`가 이 자료를 먼저 읽고, 자료와 대상이 다르면 기존 지형 판정으로 다시 계산한다. 좁은 섬과 넓은 해도에서는 작은 위치 점을 사용한다. `G.DiscoveryIcon.layout/screen`이 항해·육상·해도의 표시와 선택 영역을 함께 정한다. 발견 전 숨김과 신기루의 투명도는 기존 조건을 따른다.

조정값은 `js/data/seafx.js`의 `G.FX.natureLandmark`에 있다. 도시·건축 유적의 기존 모형과 대표 외관은 유지한다. 직접 발견한 자연경관은 지형의 중복 모형을 대신한다. 해도는 화면에 들어온 그림을 읽고 완료되면 다시 그린다.

제작기: `tools/map_ruins/build_nature.py`(Blender 모형), `pack_nature.py`(투명 이미지 묶기), `nature_inventory.cjs --ground`(접지 자료). 원본 제작 결과·Blender 파일·렌더 로그는 작업 폴더의 `artifacts/nature-landmarks-20261127/`에 보존했다. 검사: `tests/nature_landmarks_world.cjs`에서 전체 이미지 칸·발견 전 숨김·선택·148곳의 여러 확대 단계·해상 좌표 보존과 실제 육상/해상/해도 표시를 확인한다.
