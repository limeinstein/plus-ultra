# Blender 바다 · 에메랄드 연안과 남색 심해

2026-11-24. 기존 연안·대륙붕·먼바다·심해의 팔레트를 유지하면서 투명한 얕은 물, 수심별 흡수, 잔결과 윤슬, 쇄파 포말을 보강했다.

## Blender 원본

- 원본: `artifacts/ocean-blender-20261124/emerald_ocean.blend`.
- 제작: `tools/ocean_blender/build.py`. Blender 4.5.9 LTS 배경 실행으로 생성한다.
- Ocean → Displace → Geometry Nodes 순서. Ocean의 편집 해상도는 12, 렌더 해상도는 16이다. 편집 평가 메시 21,025개 꼭짓점에서 128×128 법선·포말을 12번 추출한다.
- Noise Texture의 Musgrave fBM → Bump → Principled BSDF·Glass BSDF Normal. 미세 결에는 추가 메시 분할을 쓰지 않는다. [Blender 4.1 이후 Musgrave 통합 안내](https://developer.blender.org/docs/release_notes/4.1/rendering/).
- Principled Transmission 0.96, Roughness 0.17, Specular IOR Level 0.5, 물과 Glass의 IOR 1.333. 두 셰이더를 섞고 `foam` 속성으로 흰 거품 재질을 얹는다.
- 닫힌 48×48×30m 수체에 Volume Absorption을 연결했다. 깊어지는 모래 해저 위에서 빛이 통과하는 거리에 따라 흡수된다.
- Ocean의 `ocean_foam`·`spray_direction`을 생성한다. Geometry Nodes는 `foam`·`coast_contact`를 기록하고, 시간에 따른 흐름과 해안의 높이 감쇠, 거품 영역에서만 생기는 작은 물보라 인스턴스를 연결한다. 원본의 해안 접촉 기준은 X=16~22m이며, 게임에서는 실제 해안 거리장을 쓴다. [Ocean 속성 안내](https://docs.blender.org/manual/ko/4.0/modeling/modifiers/physics/ocean.html).

```powershell
& 'C:/Users/User/AppData/Local/Programs/Blender Foundation/blender-4.5.9-windows-x64/blender.exe' -b -t 6 --python-exit-code 1 --python tools/ocean_blender/build.py -- --render
```

## 게임 연결과 조정값

`js/data/ocean_baked.js`에 Blender 평가 메시에서 추출한 RG 법선 기울기·B 포말을 담는다. 데이터는 786,432바이트이며 Base64를 포함한 JS는 약 1MiB다. `index.html`에서 읽으므로 `file://`와 스크립트 목록을 따르는 단일 파일판에서도 별도 요청 없이 쓸 수 있다. 도감에는 바다 렌더러가 없어 추가하지 않았다.

`js/world/renderer.js`가 WebGL2 배열 텍스처로 읽는다. 각 장마다 밉맵을 만들고 두 장을 부드럽게 섞어 세계 좌표·바람 방향으로 흐르게 한다. 축소하면 작은 결을 흐리고, 확대하면 정교한 결이 드러난다. 자료가 없으면 평평한 법선·거품 없는 1×1 텍스처로 대체한다. 그래픽 컨텍스트를 복원하면 자료도 다시 올린다.

조정값은 `js/data/seafx.js`의 `G.FX.water.optics`에 있다.

- `ior: 1.333`, `transmission: 0.76`, `specular: 0.5`, `roughness: 0.22`.
- `absorption: [0.24, 0.065, 0.028]`, `depth: 3.2`. Beer–Lambert 광흡수로 붉은빛부터 줄인다.
- `bump: 0.30`, `tile: 1.6`, `drift: 0.018`, `foam: 0.55`.

연안의 수면 법선과 IOR로 `refract` 방향을 구해 해저 무늬가 보이는 위치를 바꾼다. 얕은 물에는 모래·암초·해초와 약한 집광 무늬를 얹는다. GGX와 프레넬로 반사를 계산하며 기존 밝기 상한과 날씨·해질녘 조명을 따른다. Blender 포말은 기존 물마루·해안 쇄파 영역 안에서만 섞어 지도 전체가 거품으로 덮이지 않게 했다.

Blender의 실제 Ocean·Displace 메시와 물보라 인스턴스는 제작 원본에 있다. 게임은 그 원본의 작은 법선·포말과 실시간 광학 셰이더를 사용하며 Blender 시뮬레이터 자체를 실행하지 않는다. 게임 수심은 측량 자료가 아닌 기존 해안 거리로 추정한 연출값이다. 선박 높이를 정하는 큰 파도 식과 `G.Waves`, 속력·항로·저장 형식은 바꾸지 않았다.

## 검사

```powershell
$env:NODE_PATH='D:/tmp/codex-game-perf/node_modules'
$env:BROWSER_EXE='C:/Program Files/Google/Chrome/Application/chrome.exe'
node tests/wavecheck.js
node tests/ocean_optics_20261124.cjs
$env:WATER_STILLS='1'
node tests/water_surface_browser.cjs blender-final
& 'C:/Users/User/AppData/Local/Programs/Blender Foundation/blender-4.5.9-windows-x64/blender.exe' -b artifacts/ocean-blender-20261124/emerald_ocean.blend --python-exit-code 1 --python tools/ocean_blender/inspect.py
```

- GPU·JS 파도 높이 일치 검사 6조건 통과.
- 수심 5단계 팔레트, IOR·투과·흡수·스페큘러·러프니스·Bump의 실제 픽셀 변화 확인. 12장에 법선 86단계·포말 168단계가 존재한다.
- 시간 변화의 평균 픽셀 차이 약 0.528/255, 4초 반복 경계 앞뒤 차이 0.0023/255. 반복 순간의 불연속이 없다.
- 본편 업로드 경로의 12번째 텍스처, 자료 누락 시 1×1 대체 텍스처, 강제 WebGL 컨텍스트 손실·복원 뒤 동일 데이터 재생성 통과.
- 실제 항해 기본·3배·근접 확대·연안·폭풍·석양 6화면과 해전 5척. WebGL/콘솔 오류 0.
- RTX 3050·1600×900의 해전 바다 패스 측정: 변경 전 중앙값 1.9ms, 최종 4.0ms·95백분위 4.3ms. 전체 게임 프레임 비용은 이 값과 다르며 장치마다 달라진다.
- Blender 원본의 모디파이어·IOR·노드 연결과 시간/장소에 따라 달라지는 실제 포말 속성 확인.

광학·Blender 검사 자료: `artifacts/ocean-blender-20261124/`. 실제 게임 화면·성능 자료: `artifacts/water-surface-20261101/blender-final/`. 작업 전 화면은 같은 경로의 `blender-before/`에 있다. 검사 브라우저와 Blender 배경 과정은 종료한다. 배포는 수행하지 않았다.
