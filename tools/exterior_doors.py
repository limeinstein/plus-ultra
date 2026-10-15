#!/usr/bin/env python3
"""거리 건물 그림마다 문 자리를 찾아 js/data/exteriordoors.js 로 적는다 (python3 tools/exterior_doors.py)

제독이 건물에 들어갈 때 (js/scenes/town.js) 건물 한가운데가 아니라 문 앞에 서고,
문턱 높이까지만 걸어 들어가며 작아진다 — 예전엔 건물 가운데에서 96px 위로 떠올라 벽 속으로 날아가는 것처럼 보였다.

찾는 법: 건물 아래 40%에서 땅부터 위로 길게 이어진 어두운 세로 줄(문·아치 그늘) — 가운데에 가까울수록 더 믿는다.
뚜렷하지 않거나 가운데에서 많이 벗어났으면 가운데로 둔다 (통·그늘을 문으로 잘못 짚지 않게).
G.EXT_DOORS['exteriors/church'] = [cx, foot]  — cx: 문 가운데(그림 너비의 몇 할), foot: 문턱(그림 높이의 몇 할, 위에서부터)"""
import glob, json
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]

def door(path):
    im = Image.open(path).convert('RGBA'); W, H = im.size
    a = np.asarray(im).astype(float); al = a[:, :, 3] > 128
    ys = np.nonzero(al.any(1))[0]; bottom, top = ys.max(), ys.min(); bh = bottom - top
    lum = a[:, :, :3] @ np.array([0.3, 0.55, 0.15])
    y0 = int(bottom - bh * 0.40)
    med = np.median(lum[al])
    dark = (lum[y0:bottom + 1] < med * 0.62) & al[y0:bottom + 1]
    # 문은 땅에서부터 위로 길게 이어진 어두운 세로 줄 — 통·그늘처럼 낮은 것은 문이 아니다
    run = np.zeros(W)
    for x in range(W):
        colm = dark[:, x]; nz = np.nonzero(colm)[0]
        if not len(nz) or nz.max() < len(colm) - bh * 0.10: continue
        y = nz.max(); n = 0
        while y >= 0 and (colm[y] or (y > 0 and colm[y - 1])): n += 1; y -= 1
        run[x] = n / bh
    k = max(3, W // 50); run = np.convolve(run, np.ones(k) / k, 'same')
    xs = np.arange(W); prior = np.exp(-((xs - W / 2) / (W * 0.22)) ** 2)
    s = run * (0.35 + 0.65 * prior)
    c = int(np.argmax(s)); tall = float(run[c])
    # 문 너비: 그 둘레에서 높이가 절반 넘게 이어지는 데까지 — 그 한가운데 (문설주 그늘이 아니라 문 가운데에 선다)
    l, r = c, c
    while l > 0 and run[l - 1] > tall * 0.5: l -= 1
    while r < W - 1 and run[r + 1] > tall * 0.5: r += 1
    c = (l + r) // 2; cx = c / W
    # 뚜렷하지 않거나(문 높이가 건물의 12% 미만) 가운데에서 많이 벗어나면 가운데 — 잘못 짚어 벽으로 걸어가는 것보다 낫다
    if tall < 0.12 or (abs(cx - 0.5) > 0.12 and tall < 0.2) or abs(cx - 0.5) > 0.2: cx = 0.5; c = W // 2
    l, r = max(0, c - W // 40), min(W - 1, c + W // 40)
    foot = int(np.nonzero(al[:, l:r + 1].any(1))[0].max())
    return [round(cx, 3), round(foot / H, 3)]

def main():
    out = {}
    for p in sorted(glob.glob(str(ROOT / 'images/exteriors/*.webp')) + glob.glob(str(ROOT / 'images/exterior-styles/*/*.webp'))):
        key = str(Path(p).relative_to(ROOT / 'images').with_suffix('')).replace('\\', '/')
        d = door(p)
        if key.split('/')[-1].split('@')[0] == 'gate': d[0] = 0.5   # 성문: 문이 뚫려 하늘이 보여 어둡지 않다 — 가운데
        out[key] = d
    js = ('/* 거리 건물 그림의 문 자리 — tools/exterior_doors.py 가 만든다 (손으로 고치면 다시 만들 때 사라진다)\n'
          '   [cx 문 가운데 (그림 너비의 몇 할), foot 문턱 (그림 높이의 몇 할)] — js/scenes/town.js */\n'
          'window.G = window.G || {};\nG.EXT_DOORS = ' + json.dumps(out, separators=(',', ':')) + ';\n')
    (ROOT / 'js/data/exteriordoors.js').write_text(js, encoding='utf-8')
    print(len(out), 'buildings')

if __name__ == '__main__':
    main()
