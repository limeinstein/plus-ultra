# 지역 장신구·보석·회복약 원화 70종 (2026-11-16)

시장 확장으로 추가한 장신구·보석 50종과 약 20종에 각각 전용 원화를 제작했다. 기존 아이템의 따뜻한 금속광·섬세한 재질 표현에 맞춘 내장 ImageGen 그림이며 실제 투명 배경을 보존한다.

![70종 전체 미리보기](../../artifacts/regional-item-art-20261116/preview.jpg)

- 게임 그림: `images/items/regional_jewel_<지역>_<번호>.webp` 44종, `regional_legend_<번호>.webp` 6종, `regional_medicine_<번호>.webp` 20종.
- 규격: 256×256 투명 WebP, 각 변 여백 12px 이상.
- 장신구는 지역별 역사 양식과 재료를 구별하고 전설의 보석은 정교한 금세공·보석광으로 강조한다.
- 약은 약병뿐 아니라 산삼 뿌리, 나무껍질, 약초 묶음, 약탕, 연고, 환약, 수지 등 품목에 맞는 모습이다. 실제 상품의 상표·문구는 사용하지 않는다.
- [개별 이름·설명·최종 프롬프트·출력 경로](regional-item-prompts-20261116.json).
- [생성 PNG 원본](../../artifacts/regional-item-art-20261116/raw/) · [생성 기록](../../artifacts/regional-item-art-20261116/generated.json) · [파일 해시·목록](../../artifacts/regional-item-art-20261116/assets.json).
- [어두운 바탕 검수표](../../artifacts/regional-item-art-20261116/preview-dark.jpg).

## 제작·검증

생성 도구는 내장 `image_gen`이다. 품목마다 별도 호출로 원화를 제작하고, 일부 초안의 불필요한 짝 장신구와 배경 잔여물은 내장 이미지 편집으로 수정했다. 원본과 수정 기록은 함께 보존한다. `tools/package_regional_item_art_20261116.py`는 원화 복사·여백 정렬·축소·WebP 포장과 밝고 어두운 바탕 검수표만 처리한다.

`python tools/package_regional_item_art_20261116.py`로 70종의 투명도·크기·여백과 작업 전 기존 아이템 원화의 해시 보존을 검사한다. `python tools/images.py`로 게임 그림 목록을 갱신한다. 시장·소지품·도감은 기존 `items/<아이템ID>` 연결을 사용하며 상품 가격·효과·지역·재고 규칙은 그대로다.

`node tests/regional_item_art_20261116_smoke.cjs`는 실제 file:// 게임에서 70종의 개별 그림 경로·디코딩·투명도, 시장 선택 목록, 소지품 그림, 도감 상세를 검사하고 콘솔 오류를 수집한다. 결과와 화면은 `artifacts/regional-item-art-20261116/browser-check.json` 및 같은 폴더의 PNG에 기록한다. 브라우저는 finally에서 종료한다.

최종 검증 통과: 70/70종, 256×256 실제 투명 배경·가장자리 여백, 기존 원화 530개 해시 보존. 밝고 어두운 바탕에서 전체 그림을 확인했으며, 서아프리카 홍옥수·실론 사파이어 반지·중국 점취 비녀의 옅은 배경 잔여물도 수정했다. 실제 게임의 시장·소지품·도감 검사 및 콘솔 오류 0건을 확인했다.

- [브라우저 검사 결과](../../artifacts/regional-item-art-20261116/browser-check.json)
- [산삼 소지품 화면](../../artifacts/regional-item-art-20261116/regional_medicine_3-inventory.png)
- [샤만타카 보석 도감 화면](../../artifacts/regional-item-art-20261116/regional_legend_4-catalog.png)
- [호랑이연고 도감 화면](../../artifacts/regional-item-art-20261116/regional_medicine_1-catalog.png)
