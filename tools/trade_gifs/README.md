# 교역품 발견 장면 GIF

교역품 발견물 28종(`js/data/discoveries.js`의 `trade(...)`)은 처음 사들일 때 발견됩니다. 그 장면은
금빛 조명의 고급 진열대 위에서 물건(자루의 후추, 차 상자, 카카오 꼬투리 …)이 부드럽게 돌아가고, 카메라가 다가가며 광택과 별빛이 스쳐 지나가는 576×256, 24장, 8.4초 GIF입니다.
사람과 문자는 넣지 않으며, 공통 쇼케이스 배경은 `assets/trade-showcase.webp`입니다.
게임은 보물과 같은 발견 연출(어두워짐 → 장면 → 마지막 장면에서 멈춤 → 요리 솜씨 좋은 부하의 기록)을 씁니다.

```sh
node tools/procedural_art/run_trade.js tools/trade_gifs/frames all   # 프레임 24장씩 (frames/는 git에 넣지 않음)
python tools/trade_gifs/build.py                                      # images/discoveries/ID.gif + discovery-ends/ID.jpg
python tools/ruin_gifs/sheets.py t_pepper t_clove ...                 # 장면 판
python tools/images.py
```
