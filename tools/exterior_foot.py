#!/usr/bin/env python3
"""거리 건물 그림 아래쪽의 빈칸(바닥에 닿지 않는 투명한 띠)을 재어 js/data/exteriorfoot.js 로 적는다 (python3 tools/exterior_foot.py)

그림 몇 장(아가데스 같은 천막 고장의 교역소·술집·여관, 크랄·숲 고장 그림 …)은 건물 아래에 그림 높이의 10~25%쯤 되는 빈칸(말뚝 끝·옅은 티끌)이 있어,
거리의 바닥선(js/scenes/town.js GROUND)에 그림 바닥을 맞추면 건물이 공중에 떠 보였다. 이 표만큼 아래를 잘라 내고 바닥에 붙인다.

찾는 법: 그림을 가로로 4칸씩 묶어, 알파가 뚜렷한(>128) 칸이 너비의 4% 넘는 가장 아랫줄 — 말뚝·밧줄처럼 가는 것은 바닥으로 치지 않는다.
그 아래가 그림 높이의 3% 넘게 비었을 때만 적는다 (js/scenes/town.js TRIM_MIN). G.EXT_FOOT['exterior-styles/tent/trade'] = 0.248 (그림 높이의 몇 할)"""
import glob, json
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]

def pad(path):
    im = Image.open(path).convert('RGBA'); W, H = im.size
    a = np.asarray(im)[:, :, 3] > 128
    cols = a[:, : (W // 4) * 4].reshape(H, W // 4, 4).any(2)
    cov = cols.sum(1) / max(1, W // 4)
    ys = np.nonzero(cov >= 0.04)[0]
    if not len(ys): return 0
    return (H - 1 - ys.max()) / H

def main():
    out = {}
    for f in sorted(glob.glob(str(ROOT / 'images/exteriors/**/*.webp'), recursive=True) + glob.glob(str(ROOT / 'images/exterior-styles/**/*.webp'), recursive=True)):
        rel = Path(f).relative_to(ROOT / 'images').with_suffix('').as_posix()
        p = pad(f)
        if p > 0.03: out[rel] = round(p, 3)
    js = ('/* 거리 건물 그림 아래의 빈칸 — tools/exterior_foot.py 가 만든다 (손으로 고치면 다시 만들 때 사라진다)\n'
          '   그림 높이의 몇 할: 이만큼 아래를 잘라 거리 바닥선에 붙인다 (건물이 떠 보이지 않게) — js/scenes/town.js */\n'
          'window.G = window.G || {};\nG.EXT_FOOT = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
    (ROOT / 'js/data/exteriorfoot.js').write_text(js, encoding='utf-8')
    print(len(out), 'pictures')

if __name__ == '__main__':
    main()
