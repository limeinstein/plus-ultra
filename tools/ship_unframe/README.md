# 배 단면 그림 정리 (2026-10-09)

`images/ships/<배 ID>.webp`(880×480) 가운데 35장은 그림이 액자처럼 작게 들어가고 둘레가 흐리고 어두운 띠였다(외관 원본을 880×480에 「담아」 흐린 바탕을 깐 것을, 단면 그림 모델이 그대로 따라 그림). 바르카는 검은 바탕.
대형 카라벨(lcaravel)처럼 화면 가득 차게 고쳤다. 원래 그림은 `images/_extra/cabin-screen-src/ships-framed/`에 그대로 있다.

- `ship_unframe.py`: 단면 원본(`images/_extra/cabin-screen-src/cutaway/<ID>.png`)에서 깨끗한 칸(contain.json — 외관 원본을 외관 그림에 맞대어 찾은 자리에서 흐린 띠만큼 안쪽)을 잘라, 배(돛대 꼭대기 ~ 선체 아래 물결, 선실 칸 양끝)가 잘리지 않는 만큼 키워 채운다. 모자라는 가장자리는 하늘·바다를 늘려 잇는다(갤리처럼 아주 긴 배만 조금). lcaravel·baghlah·jong·tartane은 이미 가득 차 있어 그대로.
- `barca_scene.py`: 바르카 — 외관 원본(투명)의 배 모양으로 따서 리스본 앞바다에 앉힘.
- `apply_spot.py` + `transform.json`: `js/ui/cabinview.js`의 SPOT(그림 속 선실 자리)을 새 그림 좌표로 옮김 — 새 = 옛×s + (ox, oy). `spot_before.json`이 옮기기 전 값.
