# 식물 발견 원화 제작 지시

## 공통

```text
Use case: photorealistic-natural
Asset type: 9:4 panoramic game discovery animation source
Primary request: Create a botanically accurate, breathtaking landscape revealing <SPECIES> in its native habitat.
Subject: one unmistakable hero plant with the diagnostic form, leaves, flowers, fruit, roots or pitchers fully readable.
Style/medium: cinematic high-end nature documentary photography, fully photorealistic; broad color masses and clear depth layers suitable for an oil-painting reconstruction.
Composition/framing: very wide 9:4 landscape, fixed view, complete hero plant and habitat visible, no important detail near edges.
Lighting/mood: soft dawn light after rain or mist, wondrous first discovery, tranquil and lifelike.
Constraints: no people, no animals, no text, no labels, no border, no panel grid, no watermark, no illustration.
```

## 식물별 핵심

| ID | 학명·대상 | 반드시 보이는 특징과 환경 |
|---|---|---|
| `rubber` | *Hevea brasiliensis* | 아마존 우림, 큰 뿌리, 작은 수피 상처에 맺힌 흰 수액 |
| `sequoia` | *Sequoiadendron giganteum* | 시에라네바다 숲, 붉고 깊게 갈라진 거대한 줄기, 뿌리부터 수관까지 |
| `breadfruit` | *Artocarpus altilis* | 태평양 화산섬, 깊게 갈라진 큰 잎, 둥근 초록 열매 |
| `lotus` | *Victoria amazonica* | 아마존 흑수 호수, 테두리가 선 거대 원형 잎, 흰빛과 분홍빛 꽃 |
| `welwitschia` | *Welwitschia mirabilis* | 나미브 자갈 사막, 둘뿐인 띠 모양 잎이 갈라져 땅에 펼쳐짐 |
| `mangrove` | 맹그로브 숲 | 순다르반스 하구, 아치형 지주뿌리와 진흙 위 호흡뿌리, 썰물 반사 |
| `papyrus` | *Cyperus papyrus* | 나일 습지, 삼각 줄기와 우산살처럼 퍼진 가는 꽃차례 |
| `rafflesia` | *Rafflesia arnoldii* | 수마트라 숲 바닥, 점박이의 두꺼운 다섯 갈래 붉은 꽃과 꽃봉오리 |
| `carnivplant` | *Nepenthes rajah* | 키나발루 운무림, 덩굴과 잎에 이어진 거대한 적갈색 포충낭 |
| `startower` | 전설의 별탑 식물 | 타실리 사막, 석회화한 섬유질 줄기와 별 모양 수관, 건축물처럼도 보이는 모호함 |

원화는 생성 후 `sources/ID.png`로 복사하며 사진 속 구도는 GIF 전 구간에서
바뀌지 않습니다. 유화 단계는 `build.py`가 원화를 바탕으로 누적 합성합니다.
