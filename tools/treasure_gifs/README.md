# 보물 발견 GIF 만들기

`js/data/discoveries.js`의 물건형 보물 발견물 24종을 어두운 박물관 전시실에서 두 번
360° 회전하는 `images/discoveries/ID.gif`로 만듭니다. 투탕카멘 보물
(`tutankh`)은 사용자가 예로 든 앙크를 중심 전시물로 삼고 스카라베와 운석
단검을 함께 배치했습니다.

보물 분류의 나머지 한 곳인 `solomon`은 물건이 아니라 광산 전경이므로 기존
자연 경관 파노라마 GIF를 그대로 씁니다. 따라서 게임의 보물 25종은 모두
움직이되, 24종은 이 도구의 2회전 전시 연출이고 한 곳은 장소 파노라마입니다.

원화 `sources/ID.png`는 동일한 보물의 45° 간격 시점 여덟 장을 4×2로 담습니다.
빌더는 이 시점을 `0°→315°→0°` 순서로 두 번 재생하고 다음 효과를 합성합니다.

- 거의 완전한 암흑의 전시실과 위에서 움직이는 큐레이터 스포트라이트
- 금속·옥·수정 표면을 스치는 별 모양 하이라이트
- 다이아몬드에 백색광을 쏜 듯한 짧은 무지개 회절광과 빛가루
- 정면에서 가장 밝게 멈추는 피날레

최종 GIF는 576×256, 24프레임, 8.4초입니다. 마지막 정면 장면 JPG도 함께
만들며, 게임에서는 WebP 장면 판으로 바꿔 같은 8.4초 동안 부드럽게 재생합니다.

```powershell
python tools/treasure_gifs/build.py
python tools/ruin_gifs/sheets.py beowulf kingjohn agamemnon tutankh rosetta sargon urcrown goldplate ewer shiva goldelephant jadesuit bronze cloisonne seismo glassbowl goldseal crystalskull eldorado jademask grail stcrown reliquary ifehead
python tools/images.py
```

하나만 다시 만들 때:

```powershell
python tools/treasure_gifs/build.py --only crystalskull
python tools/ruin_gifs/sheets.py crystalskull
python tools/images.py
```

원화는 Codex의 내장 이미지 생성 도구로 만들었습니다. 공통 프롬프트와 보물별
주제 지정은 [`PROMPTS.md`](PROMPTS.md)에 기록되어 있습니다.
