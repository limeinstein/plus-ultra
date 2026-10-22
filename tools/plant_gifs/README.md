# 식물 발견 GIF 만들기

`js/data/discoveries.js`의 기존 식물과 `js/data/plantdisc.js`의 신규 식물 79종을
`images/discoveries/ID.gif`로 만듭니다. 식물인지 건축물인지 모호한 별탑도 같은
연출을 씁니다.

1. 따뜻한 빛의 종이 위에 아주 옅은 연필 밑선을 잡습니다.
2. 산·물·숲과 중심 식물의 윤곽을 검은 펜선으로 차례로 완성합니다.
3. 잎·꽃·열매·나무껍질에는 짧은 해칭과 먹빛 음영이 더해집니다.
4. 완성된 펜화에 옅은 자연색이 스며들고 같은 구도의 실사 풍경으로 이어집니다.
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

원화는 `sources/ID.png`에 둡니다. 신규 79종 지시문은 아래처럼 만들며 결과를
`prompts.json`에 보관합니다.

```powershell
node tools/plant_gifs/prompts.js tools/plant_gifs/prompts.json
```

공통 제작 지시와 기존 식물의 핵심 특징은 `PROMPTS.md`에 정리되어 있습니다.
