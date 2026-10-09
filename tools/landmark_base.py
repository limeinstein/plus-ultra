#!/usr/bin/env python3
"""볼거리 그림(images/landmarks)의 아래 테두리를 재어 js/data/landmarkbase.js 를 만든다.

조감(내려다본) 그림은 발치가 V자라, 거리 바닥선에 맞춰 세우면 양옆이 떠 보인다.
거리(js/scenes/town.js)는 이 테두리 아래를 그 고장 길바닥으로 채워 땅에 붙인다.
웹판·아티팩트는 그림에서 바로 재고, 픽셀을 못 읽는 file://에서만 이 표를 쓴다.

사용법 (WebGame 폴더에서):  python tools/landmark_base.py
"""
import os, json
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'images', 'landmarks')
OUT = os.path.join(ROOT, 'js', 'data', 'landmarkbase.js')
N = 48          # 그림 너비를 몇 칸으로 나눠 재는가
ALPHA = 60      # town.js baseOf 와 같은 문턱


def base(path):
    im = Image.open(path).convert('RGBA')
    w, h = im.size
    a = im.getchannel('A').load()
    out = []
    for i in range(N):
        x = min(w - 1, int((i + 0.5) / N * w))
        yb = None
        for y in range(h - 1, int(h * 0.15), -1):
            if a[x, y] > ALPHA:
                yb = y
                break
        out.append(None if yb is None else round(yb / h, 3))
    return out


def main():
    table = {}
    for fn in sorted(os.listdir(SRC)):
        name, ext = os.path.splitext(fn)
        if ext.lower() in ('.webp', '.png', '.jpg', '.jpeg', '.avif'):
            table[name] = base(os.path.join(SRC, fn))
    body = ',\n'.join('  %s: %s' % (json.dumps(k), json.dumps(v)) for k, v in table.items())
    text = ('/* 자동 생성 (python tools/landmark_base.py) — 볼거리 그림 아래 테두리: 그림 너비 %d칸마다 알파가 뚜렷한 가장 아랫줄의 높이 비율(0~1, 없으면 null).\n'
            '   거리(js/scenes/town.js)가 이 아래를 길바닥으로 채워 조감 그림이 떠 보이지 않게 한다. 픽셀을 못 읽는 file://에서만 쓴다. */\n'
            'window.G = window.G || {};\nG.LANDMARK_BASE = {\n%s\n};\n') % (N, body)
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    print('볼거리 %d곳 → %s' % (len(table), os.path.relpath(OUT, ROOT)))


if __name__ == '__main__':
    main()
