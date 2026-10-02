# 생성 프롬프트 세트

내장 ImageGen을 사용했습니다. 스타일 참고 이미지는 다음 세 파일입니다.

- `참고 이미지/항해 모습.png`
- `참고 이미지/육상 탐험.png`
- `WebGame/images/characters/ganghui/sheet.png`

## 공통 프롬프트

```text
Use case: stylized-concept
Asset type: production-ready 2D game animation sprite sheet for a Renaissance Age-of-Sail exploration game
Style/medium: polished hand-painted game sprite, stylized realism, crisp readable silhouette, matching the historical maritime/adventure references.
Composition/framing: sequential frames in strict left-to-right, top-to-bottom order; identical scale and camera; bottom-center pivot at the feet, tail, or water-contact point. Keep every protruding element fully inside its own cell with a wide transparent gutter so no hair, shawl, fin, weapon-like accessory, droplet, ray, cloud curl, or splash touches another frame.
Background: genuine transparent alpha; no scenery, terrain, ocean plane, checkerboard, or colored fill.
Constraints: exact requested frame count; no duplicate frames; no labels, text, numbers, guides, borders, cell outlines, logos, or watermark; all frames isolated for clean rectangular slicing.
```

## 이벤트별 프롬프트

- **폭풍 / 10프레임 / 5×2:** 소용돌이치는 검은 뇌운, 강풍 호, 빗줄기, 물보라, 번개가 모였다가 강해진 뒤 사라지는 루프.
- **비 / 6프레임 / 3×2:** 구름 없이 대각선 빗줄기와 바닥의 작은 물방울·파문이 강해졌다 잦아드는 루프.
- **비구름 / 8프레임 / 4×2:** 작은 회청색 구름이 생기고 부풀어 비를 내린 뒤 옅어지는 구름 중심 루프. 큰 번개는 제외.
- **햇살 / 4프레임 / 4×1:** 따뜻한 금빛 태양 원반과 회화적인 광선·반짝임이 확장·수축하는 루프.
- **돌고래 출현 / 8프레임 / 4×2:** 한 마리의 큰돌고래가 수면에서 솟아 호를 그리고 잠수하며 작은 물보라만 남기는 동작.
- **고래 출현 / 10프레임 / 5×2:** 한 마리의 혹등고래가 떠오르고 숨을 뿜은 뒤 등을 굴리고 꼬리를 들어 잠수하는 동작.
- **세이렌 등장 / 12프레임 / 4×3:** 성인 신화적 세이렌 한 명이 물에서 올라와 노래하는 몸짓을 보이고 다시 잠기는 동작. 청록 비늘 꼬리, 긴 검은 머리, 금빛 조개 장신구, 반투명 바다빛 숄. 무기·노출·선정적 표현 제외.

## 세이렌 최종 정리 편집

```text
Preserve the siren identity, style, colors, costume, 12 sequential actions, and 4×3 order. Change only layout and transparency: scale each full sprite down slightly and recenter it inside its equal-sized cell. Keep all hair, hands, shawl, tail, jewelry, splashes, droplets, and soft glow pixels inside the cell. Make every separator a wide band of 100% transparent pixels, remove the gradient haze, preserve genuine alpha, and keep the bottom-center water-contact pivot.
```
