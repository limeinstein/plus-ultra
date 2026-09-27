# tools

WebGame 폴더에서 실행합니다. 파이썬 3 표준 라이브러리만 씁니다(world/ 제외).

## images.py — 교체 그림 등록

```
python tools/images.py          # images 폴더를 훑어 images/manifest.js 를 다시 만들고 이름을 점검
python tools/images.py --list   # 쓸 수 있는 파일 이름 전체 목록
```

## bundle.py — 단일 파일 다시 만들기

```
python tools/bundle.py                     # PLUS_ULTRA.html (교체 그림도 파일 안에 넣음)
python tools/bundle.py --artifact 폴더      # Claude 아티팩트용 game.html · catalog.html 도 만들기
```

## build_web.py — 웹 배포판

```
python tools/build_web.py              # dist/web 폴더 + dist/PLUS_ULTRA_web.zip
python tools/build_web.py --no-minify  # 코드를 줄이지 않고 묶기
```

esbuild(`npm i -g esbuild`)가 있으면 자바스크립트와 CSS를 줄입니다. 파일 이름에 내용 해시를 붙이므로 다시 올려도 방문자 브라우저에 옛 파일이 남지 않습니다.

## pages.py

bundle.py 와 build_web.py 가 함께 쓰는 도우미입니다. index.html · catalog.html 의 스크립트 목록을 그대로 따릅니다.

## world/ — 세계 지형·도시 데이터 생성기

`js/data/world_data.js`(육지·강·기후 비트맵)와 `js/data/cities.js`(도시 226곳)를 만든 스크립트입니다.
게임을 실행하는 데는 필요 없고, 해안선이나 도시 목록을 바꿀 때만 씁니다.

1. [Natural Earth](https://github.com/nvkelso/natural-earth-vector) 저장소의 `geojson/` 폴더에서 아래 네 파일을 받아 `tools/world/ne/`에 넣습니다.
   `ne_50m_land.geojson`, `ne_50m_lakes.geojson`, `ne_50m_rivers_lake_centerlines.geojson`, `ne_50m_geography_regions_polys.geojson`
2. `pip install numpy pillow scipy`
3. `tools/world` 폴더 안에서 차례로 실행합니다.
   - `python build_world.py` — 4096×2048 육지 마스크(좁은 해협을 손으로 뚫고 작은 섬을 더함), 강, 1024×512 기후 지도를 만들어 `world_blobs.json`, `mask.npy`, `ocean.npy`로 저장
   - `python snap_cities.py` — `cities_src.py`의 도시 좌표를 마스크에 맞춰 육지 위치와 부두 위치로 옮김 → `city_snap.json`
   - `python gen_js.py` — `js/data/world_data.js`, `js/data/cities.js`를 새로 씀

도시의 이름·언어·종교·특산품 같은 속성은 `cities_src.py`에서 고칩니다. `cities.js`를 직접 고쳤다면 `gen_js.py`를 다시 돌릴 때 덮어써진다는 점에 주의하세요.
