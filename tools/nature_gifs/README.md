# 자연 경관 발견 GIF 만들기

`js/data/discoveries.js`의 기존 자연 7개와 `js/data/naturals.js`의 자연경관 34개를
`images/discoveries/ID.gif`로 만듭니다. 원화는 유적 복원 그림과 어울리는
수채화·잉크 풍의 3:1 초광각 파노라마입니다. `naturals.js`에서 보물로 분류한
솔로몬의 광산도 자연경관 묶음에 들어갑니다.

한 바퀴는 576×256, 25프레임, 9820ms이며 다음 순서로 이어집니다.

1. 새벽의 먼 원경
2. 일출과 함께 확대
3. 왼쪽에서 오른쪽으로 파노라마 이동
4. 한낮, 노을, 밤으로 시간 변화
5. 밤의 먼 원경으로 복귀

```powershell
python tools/nature_gifs/build.py
python tools/ruin_gifs/sheets.py
python tools/images.py
```

하나만 다시 만들 때:

```powershell
python tools/nature_gifs/build.py --only uluru
```

원화 제작 프롬프트는 장소마다 실제 지형 특징만 바꾸고 아래 공통 형식을 사용했습니다.

```text
Use case: stylized-concept
Asset type: game discovery animation source panorama
Primary request: Create an extremely wide continuous panoramic landscape of <LANDMARK>, seen from a distant elevated viewpoint. Show <DISTINCTIVE GEOGRAPHY>.
Style/medium: richly detailed hand-painted watercolor with delicate ink linework, matching a refined historical exploration sketchbook; natural texture and believable geography.
Composition/framing: one uninterrupted ultra-wide panorama, approximately 3:1 composition, landmark fully visible at a distance with generous scenery extending left and right for a cinematic horizontal pan; stable horizon; no panels, no collage, no close-up inset.
Lighting/mood: neutral early daylight with balanced exposure so later dawn, noon, sunset, and night color grading will work.
Constraints: no people, no modern structures, no signs, no text, no frame, no border, no labels, no logo, no watermark.
```

`build.py`는 원화를 다시 그리지 않고 카메라 확대·수평 이동과 색·광원 변화만 합성합니다. 그래서
파노라마 도중 지형의 실루엣이 프레임마다 바뀌지 않습니다. 마지막 프레임은 발견 연출에서 멈춰
보이도록 `images/discovery-ends/ID.jpg`에도 함께 저장합니다. 이어서 `sheets.py`가 GIF를
게임이 가볍게 재생하는 `images/discovery-sheets/ID.webp` 장면 판으로 바꿉니다.
