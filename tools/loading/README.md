# 타이틀 로딩 그림

`sources/world-map.png`와 기존 `tools/ship3d`의 갤리온 3D 모형을 `build.py`로 합쳐
`images/effects/loading-world.gif`를 만듭니다.

- 320×320, 180장, 장당 60ms(10.8초 반복, 배는 세 바퀴)
- 갤리온 너비는 지구 지름의 15%
- 지구가 자전하는 동안 갤리온은 바깥 둘레를 돌며, 매 바퀴 항로의 기울기가 달라집니다.
- 연결 고리나 궤도 선은 그리지 않습니다.
- `render_ship.js`가 매 장면의 이동 방향에 맞춰 3D 모형을 돌립니다. 선수·선미·양현과 돛이 보이는 각도가 실제로 달라지며, 돛과 선체의 움직임·작은 물결도 함께 렌더링됩니다.
- 모든 장면이 같은 256색 색상표를 써서 재생 중 색이 번쩍이지 않습니다.

다시 만들기:

```powershell
python tools/loading/build.py
```

생성에는 Pillow, Node, Playwright, Chrome과 `tools/procedural_art/node_modules/three`가 필요합니다.
중간 장면과 검토용 장면 모음은 `tmp/loading-world/`에 저장합니다.
게임 실행 중에는 3D 계산 없이 완성된 GIF만 재생합니다.

고지도는 앞서 이미지 생성 도구로 만든 원화를 재사용합니다. `sources/galleon.png`는 이전 시안이며 현재 GIF에는 쓰지 않습니다.
