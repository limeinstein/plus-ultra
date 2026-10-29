# 심어 얻는 식물 특산물의 상품 그림

식물 발견물 79종을 교역소에 심어 얻는 교역품에 전용 그림을 추가했다. 기존에는 `G.Img.chain.good`가 식물 발견 장면만 먼저 골라 별도의 상품 그림을 사용할 수 없었다. 이제 `images/goods/p_*.webp`를 먼저 읽고, 전용 그림이 없는 사용자 그림 묶음에서는 발견 마지막 장면·발견 GIF·분류 공통 그림 순으로 대신 표시한다.

열매 55종에 매실·잣·은행·사와로 열매, 꽃과 묘목, 목재, 수지·염료·술·차를 더해 79종이다. 곶감·말린 살구·말린 무화과·말린 용안은 말린 모습, 두견주는 술병, 국화차는 말린 꽃, 장미수는 유리병, 용뇌는 흰 결정, 코치닐은 붉은 염료로 그렸다. 목재는 숲 풍경 대신 베어 묶은 재목을 쓴다. 도감의 교역품 파일 안내도 같은 상품 그림 경로로 맞췄다.

내장 `image_gen`으로 품목당 한 장씩 생성했다. 최종 지시문은 `plant-goods-prompts-20261029.json`의 `base_prompt`와 각 `subject`를 이어 붙인 것이다. 실제 투명 배경을 유지하고 원화는 `artifacts/plant-goods-20261029/sources/p_*.png`에 보존한다. `python tools/plant_goods_art.py`는 원화를 확대·축소하지 않고 사방 여백을 더한 뒤 WebP 품질 92로 저장한다. 일반적인 최종 크기는 1536×1536이다. 미리보기만 작게 줄인다.

- 게임 그림: `images/goods/p_*.webp` (79장)
- 전체 미리보기: `plant-goods-preview-20261029.jpg`
- 그림 등록: `images/manifest.js`
- 연결: `js/core/images.js`, `js/catalog.js`
- 검사: `node tests/plant_goods_art_smoke.js`, `node tests/plant_trade_smoke.js`

새 검사는 79종의 실제 파일 읽기·정사각형 크기·투명 영역·작은 상품 표시와 기존 그림 대체를 확인한다. 용뇌수와 두리안을 말라카에 실제로 심고 구입 창에서 전용 그림을 읽는지도 확인하며, 화면은 `artifacts/plant-goods-20261029/trade-runtime.png`에 남긴다. 교역 규칙·가격·수량·심기 제한은 바꾸지 않았다.

두 검사 모두 통과했다. 새 그림은 79장 모두 1536×1536 RGBA이며, 서로 다른 그림 79장·투명 영역·전용 경로를 확인했다(전체 약 35.38 MB). 도감에서 장미수 상세 창의 상품 파일 안내까지 확인했으며, 두 화면의 콘솔 오류는 0건이다. 도감 화면은 `artifacts/plant-goods-20261029/catalog-runtime.png`, 읽기 결과는 같은 폴더의 `browser-report.json`에 보존했다. 검사 브라우저와 변환 과정은 모두 종료했다.
