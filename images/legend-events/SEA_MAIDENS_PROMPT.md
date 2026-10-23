# 남쪽 바다의 두 아가씨 그림 주문서 — 떰 · 마리아 (js/systems/seamaidens.js · js/data/seamaidens.js)

베트남 옛이야기 「떰과 깜(Tấm Cám)」과 필리핀 타갈로그 사람들의 악어 신앙(악어를 「누노 — 할아버지」라 부르며 조상의 넋으로 모심)을 바탕으로 새로 그립니다.
특정 영화·애니메이션·게임의 디자인을 따르지 않습니다. 그림이 없으면 초상은 그려 만든 얼굴로, 장면은 글만으로 지나갑니다.

## 초상

| 파일 | 크기 | 내용 |
|---|---|---|
| `images/portraits/legendary/tam.webp` | 448×448 투명 | 떰 흉상 |
| `images/portraits/legendary/tam_half.webp` | 1024×1536 투명 | 떰 무릎상 |
| `images/portraits/legendary/maria.webp` | 448×448 투명 | 마리아 흉상 |
| `images/portraits/legendary/maria_half.webp` | 1024×1536 투명 | 마리아 무릎상 |
| `images/portraits/history/tam_stepmother.webp` · `_half` | 448×448 · 1024×1536 투명 | 새어머니 |
| `images/portraits/history/tam_cam.webp` · `_half` | 448×448 · 1024×1536 투명 | 새동생 깜 |

원화는 `artifacts/legendary-portraits/<id>.png`에 보관하고, 무릎 아래까지 잘라 무릎상, 얼굴을 자동으로 찾아 흉상을 만든다 (다른 전설의 인물과 같은 방식).

```text
Use case: stylized-concept
Asset type: transparent game dialogue portrait (bust 448x448 / knee-length 1024x1536)
Primary request: Tấm — an original gentle young Vietnamese village woman of about 18 from the 16th-century Annam coast (Đại Việt), the kind elder sister of the folk tale "Tấm Cám"
Look: long black hair tied up and wrapped in a dark cloth headband (khăn), soft round face, warm dark eyes, quiet resilient smile, sun-touched skin, slim hands of a weaver
Clothing: worn brown four-panel tunic (áo tứ thân) over a faded red bodice (yếm), dark long skirt, a small bamboo fish basket at her hip in the knee-length version; barefoot or straw sandals
Style/medium: highly polished semi-realistic hand-painted Age of Sail character portrait matching the other legendary portraits
Composition: one person, three-quarter pose, hands folded or holding the basket, hair complete, shoulders visible
Constraints: transparent background; clean alpha edge; no text; no frame; no scenery; not resembling any film, anime or game design
```

```text
Use case: stylized-concept
Asset type: transparent game dialogue portrait (bust 448x448 / knee-length 1024x1536)
Primary request: Maria — an original young Tagalog woman of about 20 from the shores of Laguna de Bay, Luzon, about 1600 (early Spanish era), a herbalist and shell-and-pearl carver who reveres crocodiles as ancestors ("Nuno")
Look: long wavy black hair loose with a sampaguita flower behind one ear, warm brown skin, calm confident gaze, gentle smile; a small black pearl on a cord at her throat
Clothing: loose white baro (blouse) with wide sleeves, a patterned wrap skirt (tapis) over a long skirt, shell and bead bracelets; a woven pouch of herbs at the hip in the knee-length version
Style/medium: highly polished semi-realistic hand-painted Age of Sail character portrait matching the other legendary portraits
Composition: one person, three-quarter pose, one hand raised palm-out as if calming an animal, hair complete, shoulders visible
Constraints: transparent background; clean alpha edge; no text; no frame; no scenery; no crucifix; not resembling any film, anime or game design
```

새어머니: 40대 베트남 여인, 비단 머릿수건, 단정하지만 날카로운 눈매, 짙은 남색 웃옷. 깜: 15~16세 소녀, 떰보다 화려한 붉은 옷, 뾰로통하지만 새 옷 보따리를 안고 머뭇거리는 얼굴. (위 떰 프롬프트와 같은 화풍)

## 장면 (가로 16:9, 다른 legend-events 그림과 같은 화풍)

| 파일 | 장면 |
|---|---|
| `images/legend-events/tam_shore.webp` | 안남 바닷가 갯벌, 이른 아침. 바지를 걷어 올린 떰이 텅 빈 대바구니를 안고 앉아 운다. 바구니 바닥에 작은 망둑어 한 마리. 멀리 대나무 울타리 마을과 바구니배(통배), 앞바다에 서양식 범선 한 척. |
| `images/legend-events/tam_clothes.webp` | 밤, 범선 갑판의 등불 아래. 선원(세공사)이 펼친 비단 옷감을 가위로 마르고, 떰이 갓 지은 웃옷과 바지, 비단 머릿수건을 두 손으로 받쳐 들고 놀라워한다. 개켜진 옷 두 벌. |
| `images/legend-events/maria_crocodile.webp` | 루손 라구나 호숫가 갈대숲, 한낮. 배 두 척 길이만 한 악어가 진흙을 튀기며 뭍으로 올라오고, 창과 화승총을 든 뱃사람들이 물러선다. 그 사이로 흰 블라우스의 마리아가 두 팔을 벌리고 뛰어든다. |
| `images/legend-events/maria_pearl.webp` | 잔잔해진 호수 물가. 악어가 반쯤 물에 잠긴 채 입에 흑진주 두 알을 물고 있고, 마리아가 무릎을 꿇고 악어 코끝에 이마를 댄다. 제독과 뱃사람들이 창을 거두고 바라본다. |

## 육상전 스프라이트 (선택)

`images/sprites/animals.webp`에 `crocodile` 줄을 더하면(js/data/sprites.js `G.SPRITE_SHEETS.animals.rows`) 마리아 사건의 싸움에 악어가 나온다. 없으면 멧돼지 그림으로 대신한다 (js/games/landwar.js e.beast).
