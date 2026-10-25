# 신규 신기루 발견물 50 GIF

기획 자료의 `js/data/miragedisc.js` 50곳을 각각 독립된 ImageGen 원화로 제작했다.
각 장소의 건축 모형 공사 → 실제 공간 답사 → 여러 방향의 낮·노을·밤 풍경을
16프레임으로 보여 주는 수채화풍 시네마틱이다. 다리·운하에는 허구의 방을 만들지 않는다.
미래 건물을 신기루로 발견하는 게임 규칙과 1610년 등장 조건은 그대로 사용한다.

- 원화: `tools/mirage_gifs/masters/<id>.png` (작업 폴더에 보존, Git 제외)
- 원문 목록: `items.json`, 실제 생성 프롬프트: `prompts.json`
- GIF: `images/discoveries/<id>.gif` — 576×256, 16프레임, 9.82초 반복
- 마지막 장면: `images/discovery-ends/<id>.jpg`
- 게임 재생 판: `images/discovery-sheets/<id>.webp` — 6열×3행
- 전체 미리보기: `docs/art/mirage50-gallery.html`, `docs/art/mirage50-preview.jpg`
- 배포용 묶음: `artifacts/mirage50-gifs.zip` — 압축을 풀고 `index.html` 열기

```powershell
node tools/mirage_gifs/export.js
python tools/mirage_gifs/build.py --ready
python tools/mirage_gifs/build.py --preview --package
python tools/images.py
python tests/mirage50_assets.py
node tests/mirage50_assets_runtime.js
```

한 곳만 다시 변환할 때는 `python tools/mirage_gifs/build.py --only empirestate`.
도시 거리의 건물은 투명 배경을 쓰는 별도 규격이므로 이 도구는 발견 화면의 세 자산만 만든다.
도시·육상·항해에서 보이는 투명 외관은 `tools/mirage_exteriors/README.md`를 참고한다.
원화는 내장 ImageGen 도구로 장소마다 한 장씩 생성했으며, 기존 시네마틱 합성기와
장면 판 도구를 재사용한다. `catalog.html`에도 신기루 자료를 불러와 도감에서 재생한다.
발견 보상·연도·위치는 변경하지 않는다.
`grid.py`는 4×4, 5×3 또는 행마다 5·5·6칸인 실제 패널 경계를 찾아 옆 칸이 섞이지 않게 자른다.
15칸인 원화에는 조사도가 옅게 나타나는 도입 프레임을 더해 16프레임으로 맞춘다.
변환에는 Pillow와 NumPy를 쓴다.
낮·노을·밤을 함께 담은 공통 256색 팔레트로 장면별 색을 보존한다.
