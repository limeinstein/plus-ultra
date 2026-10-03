# 식물 발견 GIF 만들기

`js/data/discoveries.js`의 식물 발견 9종과 식물인지 건축물인지 모호한 별탑을
`images/discoveries/ID.gif`로 만듭니다.

1. 따뜻한 빛의 빈 아마포 캔버스에서 시작합니다.
2. 먼 하늘과 숲·산·물을 큰 붓으로 먼저 칠합니다.
3. 중심 식물의 줄기·잎·꽃·열매를 짧은 붓질로 하나씩 완성합니다.
4. 완성된 유화가 같은 구도의 실사 풍경으로 이어집니다.
5. 잎·물결·빛이 한 번 천천히 숨 쉬듯 움직인 뒤 실사 원화에 멈춥니다.

최종 GIF는 576×256, 24프레임, 8.4초입니다. 게임에서는 같은 그림을 WebP
장면 판으로 바꾸어 GIF보다 가볍고 부드럽게 재생합니다.

```powershell
python tools/plant_gifs/build.py
python tools/ruin_gifs/sheets.py rubber sequoia breadfruit lotus welwitschia mangrove papyrus rafflesia carnivplant startower
python tools/images.py
```

하나만 다시 만들 때:

```powershell
python tools/plant_gifs/build.py --only rafflesia
python tools/ruin_gifs/sheets.py rafflesia
python tools/images.py
```

원화는 `sources/ID.png`에 둡니다. 제작 지시문은 `PROMPTS.md`에 정리되어 있습니다.
