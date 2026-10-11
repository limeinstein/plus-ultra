# 개척 도시 장면 그림 (선택) — images/events/colony/

그림이 없어도 게임은 「새 건물이 선 거리 + 금빛 글귀 + 반짝임」으로 장면을 보여 준다.
아래 파일을 넣으면 금빛 글귀 위에 그 그림이 함께 뜬다 (js/systems/colony.js `CO.picture`).

| 파일 | 언제 |
|---|---|
| `found.webp` / `found_<area>.webp` | 개척지에 처음 입항해 이름을 짓고 항구·술집·교역소·여관이 선 순간 |
| `stage2.webp` (`_<area>`) | 물자 1번째 → 시장·교회 |
| `stage3.webp` (`_<area>`) | 물자 2번째 → 조합·감찰관 저택 |
| `stage4.webp` (`_<area>`) | 물자 3번째 → 총독부 (총독령 도시) |
| `governor.webp` (`_<area>`) | 총독 취임 |

`<area>`: 3 아프리카 · 5 인도 · 8 동남아시아 · 10 아메리카 (G.REGIONS 번호). 지역판이 없으면 공통판을 쓴다.

- 크기: 1280×720 (16:9) webp, 품질 82 안팎.
- 화풍: 게임의 거리·실내 그림과 같은 사실적 유화풍, 따뜻한 오후 빛.
- 원작 게임(대항해시대 시리즈)의 그림·구도·인물을 베끼지 않는다. 실제 역사 인물의 얼굴도 그리지 않는다.

## 프롬프트 (영문)

- found: `A small 16th-century Iberian colonial settlement being founded on a tropical bay, a wooden pier with a caravel at anchor, a lighthouse, a few whitewashed buildings with red tile roofs under construction, settlers unloading barrels and timber, a royal banner being raised, warm afternoon light, painterly realistic oil painting, wide shot, no text`
- stage2: `The same colonial port town a year later, a busy open-air market with awnings and a small whitewashed church with a bell tower, settlers and local traders, painterly realistic, no text`
- stage3: `A growing 16th-century colonial town, a merchants' guild hall and an elegant noble mansion of the royal inspector with balconies and cypress trees, cobbled square, painterly realistic, no text`
- stage4: `A grand colonial governor's palace with arcades and twin towers overlooking a harbour full of ships, flags flying, crowds celebrating in the square, golden hour, painterly realistic, no text`
- governor: `Interior of a colonial governor's hall, a sea captain in 16th-century attire receiving a sealed royal commission with a wax seal from a clerk, candles and tapestries, painterly realistic, no text`
- 지역판: 끝에 `in West Africa` / `on the coast of India` / `in the Indonesian islands` / `in the Caribbean / Spanish America` 를 붙이고 사람·식물을 그 고장에 맞춘다.
