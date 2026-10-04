# 교역품 발견 장면 GIF

교역품 발견물 28종(`js/data/discoveries.js`의 `trade(...)`)은 처음 사들일 때 발견됩니다. 그 장면은
등불 켜진 시장 좌판 위의 물건(자루의 후추, 차 상자, 카카오 꼬투리 …)에 카메라가 천천히 다가가는 576×256, 24장, 8.4초 GIF입니다.
게임은 보물과 같은 발견 연출(어두워짐 → 장면 → 마지막 장면에서 멈춤 → 요리 솜씨 좋은 부하의 기록)을 씁니다.

```sh
node tools/procedural_art/run_trade.js tools/trade_gifs/frames all   # 프레임 24장씩 (frames/는 git에 넣지 않음)
python tools/trade_gifs/build.py                                      # images/discoveries/ID.gif + discovery-ends/ID.jpg
python tools/ruin_gifs/sheets.py t_pepper t_clove ...                 # 장면 판
python tools/images.py
```
