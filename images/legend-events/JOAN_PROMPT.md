# 오를레앙의 처녀 잔 그림 주문서 (js/systems/joan.js · js/data/joan.js)

15세기 사료(재판 기록·당대 증언)에 나오는 모습을 바탕으로 새로 그립니다. 특정 영화·애니메이션·게임의 잔 다르크 디자인을 따르지 않습니다.
그림이 없으면 초상은 그려 만든 얼굴로, 장면은 글만으로 지나갑니다.

## 초상

| 파일 | 크기 | 내용 |
|---|---|---|
| `images/portraits/legendary/joan_of_arc.webp` | 448×448 투명 | 흉상 |
| `images/portraits/legendary/joan_of_arc_half.webp` | 1024×1536 투명 | 무릎상 (서 있는 모습) |

원화는 `artifacts/legendary-portraits/joan_of_arc.png`에 보관하고, 무릎 아래까지 잘라 무릎상, 얼굴을 자동으로 찾아 흉상을 만든다 (다른 전설의 인물과 같은 방식).

```text
Use case: stylized-concept
Asset type: transparent game dialogue portrait (bust 448x448 / knee-length 1024x1536)
Primary request: an original young French woman of about 19, a peasant girl from Lorraine who led an army, 1430s, now rescued and sailing with a ship's crew
Look: short dark-brown hair cut round at the ears like a soldier's, strong brows, steady grey-green eyes, a proud slightly sulky expression (tsundere: chin up, lips pressed, faint blush), sun-browned skin, small scar on one cheek
Clothing: plain fitted man's doublet in faded blue wool over a white linen shirt, dark hose, worn leather boots (half-length), a simple arming sword on a leather belt, a small wooden rosary at the wrist; no full plate armour, at most a battered steel gorget
Style/medium: highly polished semi-realistic hand-painted Age of Sail character portrait matching the other legendary portraits
Composition: one person, three-quarter pose, arms crossed or one hand on the sword hilt, hair complete, shoulders visible; half-length shows her standing squarely, weight on one leg
Constraints: transparent background; clean alpha edge; no text; no frame; no scenery; no halo; no fleur-de-lis banner in the portrait; not resembling any film, anime or game design
```

## 장면 (가로 16:9, 다른 legend-events 그림과 같은 화풍)

| 파일 | 장면 |
|---|---|
| `images/legend-events/joan_of_arc_stake.webp` | 프랑스 숲 가장자리의 작은 마을 광장, 해 질 녘. 장작을 높이 쌓은 화형대 기둥에 위 초상의 처녀가 밧줄로 묶여 고개를 꼿꼿이 들고 있다. 횃불과 도리깨를 든 마을 사람들이 둘러싸 고함친다. 앞장선 덩치 큰 사내(마녀 사냥꾼)가 횃불을 쳐들었다. 연기, 붉은 하늘. 불은 아직 붙지 않았다. |
| `images/legend-events/joan_of_arc_rescue.webp` | 같은 광장, 횃불이 땅에 떨어져 꺼져 가고 마을 사람들은 흩어진다. 끊긴 밧줄이 기둥에 늘어져 있고, 처녀는 손목을 문지르며 화형대에서 막 뛰어내려 팔짱을 낀 채 고개를 살짝 돌리고 있다(고맙다는 말을 하기 싫은 얼굴). 칼을 거두는 뱃사람들이 그녀를 바라본다. |
