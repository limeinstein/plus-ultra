# 누락 소지품 원화와 기존 원화 연결 (2026-11-06)

게임이 실제로 읽는 소지품 1,053종을 검사했다. 전용 소지품 그림이 있던 것은 120종,
같은 물건의 유물·선수상·발견 원화를 공유할 수 있는 것은 686종이었다. 나머지 247종은
악기 160종, 기념품 30종, 책 3종, 선수상 1종, 특수 물품 39종, 보물 14종이다.
자료 파일뿐 아니라 시스템 코드가 추가 등록하는 명작 공통 그림·레오나르도 발명품 12종·갈릴레오의 쇠공도 검사한다.

## 그림 파일

새 그림 247종을 `images/items/<아이템ID>.webp`에 저장했다. 기존 원화 120종은 보존했다.
내장 `image_gen` 도구로 물건마다 따로 생성하며, 투명 배경과 알파 채널을 유지한다.
원본 PNG는 `artifacts/missing-item-art-20261106/raw/`, 게임용 그림은 256×256 WebP이며
적어도 14픽셀의 투명 여백을 둔다. 기존 아쟁 등 소지품 원화의 목재·금속 재질과
부드러운 빛을 맞췄다.

[전체 품목·제작 지시문·원본 경로·출력 경로](missing-item-prompts-20261106.json).
각 생성 결과는 `artifacts/missing-item-art-20261106/generated/`에도 기록한다.

악기는 전통 현악기·관악기·타악기, 오케스트라와 군악 악기까지 포함한다. 새로 만든
160종과 기존 원화 26종을 합쳐 악기 186종 모두 개별 전용 그림을 사용한다.
사건 물품은 문서·장부·보석·무기·의복·조각 등의 설명을 반영한다.

## 연결

`G.Img.chain.item`은 개별 소지품 원화 다음에 같은 ID의 유물·선수상 원화를 찾고,
그 유물에 연결된 발견 원화도 사용한다. 원화가 이미 있는 물건이 도감이나 소지품에서
종류 공통 그림으로 보이던 연결 누락을 함께 해결한다.
품목 ID·이름·가격·효과·저장 자료는 바꾸지 않는다.

## 확인

```text
python tools/package_missing_item_art.py
python tools/images.py
node tools/audit_item_art.cjs --strict --out artifacts/missing-item-art-20261106/after
python tests/item_assets_smoke.py
node tests/missing_item_art_smoke.cjs
node tests/instrument_market_smoke.js
```

검사 도구는 자료의 실제 읽기 순서와 게임의 그림 체인을 이용한다. 원화 파일의 크기·투명 여백을
검사하고, 브라우저에서 신규 그림이 읽히는지, 악기 186종이 각각 자기 전용 그림을 고르는지,
전체 소지품에 종류 공통 그림 대신 해당 물건의 그림이 연결되는지 확인한다.

검증 결과: 신규 원화 247/247종 로딩·256×256 크기·투명 배경 검사 통과. 전체 소지품
1,053종은 전용 소지품 원화 367종과 같은 물건의 기존 원화 686종을 골라 누락이 0건이다.
악기 186종 전용 원화, 12문화권 주간 진열, 실제 구매·매각·저장·소지품·도감 검사도 통과했고
브라우저 오류는 0건이었다. 기존 교역품 158종·일반 소지품 59종·유물 680종 검사도 통과했다.

브라우저 시험은 file://로 실행했다. 외부 선택 글꼴 CSS에는 빈 응답을 주어 운영체제 대체
글꼴을 사용한다. 시장 시험은 별도 역사 사건의 대기 대화만 생략하고, 실제 시장 자료와
구매·매각·저장·그림 표시를 검사한다. 도시 입장 처리가 끝나기 전에 시험이 창을 여는
경합도 입장 완료를 기다리도록 고쳤다.

전체 그림 모음은 `artifacts/missing-item-art-20261106/preview-01.jpg`부터
`preview-07.jpg`까지이며, 실제 게임에서 읽은 대표 그림은 같은 폴더의 `runtime-preview.png`다.
파일별 SHA-256과 크기는 `assets.json`, 브라우저 결과는 `browser-check.json`에 기록한다.

그림 모음: [1 — 국악기·현악기·건반](../../artifacts/missing-item-art-20261106/preview-01.jpg) ·
[2 — 지역 악기·오케스트라](../../artifacts/missing-item-art-20261106/preview-02.jpg) ·
[3 — 중세·이슬람권 악기](../../artifacts/missing-item-art-20261106/preview-03.jpg) ·
[4 — 군악기·지역 악기](../../artifacts/missing-item-art-20261106/preview-04.jpg) ·
[5 — 사건 기념품](../../artifacts/missing-item-art-20261106/preview-05.jpg) ·
[6 — 역사 사건 보상·명작·발명품](../../artifacts/missing-item-art-20261106/preview-06.jpg) ·
[7 — 발명품·갈릴레오의 쇠공](../../artifacts/missing-item-art-20261106/preview-07.jpg).
