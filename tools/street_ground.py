#!/usr/bin/env python3
"""Codex가 그린 지역별 길바닥 기준 그림(docs/art/regional-street-ground-reference.png, 3×2 칸)을
거리 화면(js/scenes/town.js)의 앞길 띠로 바꾼다.

    python tools/street_ground.py         # images/street-ground/<양식>.webp 19장 + docs/art/street-ground-contact.png

- 칸 6장: 이베리아 칼사다(물결 현무암), 지중해 부채꼴 벽돌, 아랍 판석·별 모자이크, 북유럽 둥근 돌, 동아시아 판석, 아프리카 흙길.
- 각 칸에서 길바닥 부분을 잘라(동아시아·흙길은 양옆 도랑·길섶을 빼고) 거리 화면 앞길 높이(164px)에 맞춰 눕힌다.
- 가로로 끝없이 이어지게: 무늬가 되풀이되는 칸(칼사다·부채꼴·모자이크)은 무늬 한 주기에 맞춰 자르고,
  돌·흙처럼 고르지 않은 칸은 좌우를 뒤집은 조각을 이어 붙여 넓힌 뒤, 겹치는 띠 안에서 차이가 가장 적은
  길(최소 비용 이음선)을 따라 잇는다. 이음선 양쪽 2px만 섞어 돌이 두 겹으로 비치지 않게 한다.
- 양식 19종(town.js GROUND_STYLE)은 가까운 칸을 쓰고 돌·흙 빛만 바꾼다(예: 메소아메리카 = 둥근 돌을 검은 현무암 빛으로).
"""
from __future__ import annotations

import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'docs', 'art', 'regional-street-ground-reference.png')
OUT = os.path.join(ROOT, 'images', 'street-ground')
CONTACT = os.path.join(ROOT, 'docs', 'art', 'street-ground-contact.png')

TH = 164            # town.js 앞길 높이(H - WALK_TOP + 6)
SH = 0.86           # 가로 배율(기준 그림 1px → 거리 화면 0.86px). 세로는 TH에 맞춰 눌러 앞쪽으로 눕힌다
OV = 44             # 이음 겹침 폭

# 기준 그림 3×2 칸의 안쪽 상자(테두리 선 제외)
COLS = [(2, 507), (515, 1020), (1028, 1534)]
ROWS = [(1, 507), (516, 1022)]
# 칸 이름: (열, 행, 가운데 x, 쓸 폭, 쓸 높이, 소실점 높이(칸 위 끝 기준, 없으면 원근 펴지 않음), 이어 붙이는 방식)
# 둥근 돌·판석·흙길 칸은 가운데로 모이는 원근이 커서 그대로 이으면 이음매마다 V자 무늬가 생긴다.
# 그래서 줄마다 가로 배율을 (y - 소실점)에 반비례하게 바꿔 깊이 방향 줄눈을 세로로 펴고(앞뒤 높이감은 그대로),
# 동아시아 판석의 양옆 도랑·흙길의 길섶은 쓸 폭 밖으로 뺀다.
YREF = 150          # 원근을 펼 때 배율 1로 두는 줄
TILES = {
    'calcada': (0, 0, 252, 505, 380, None, 'period'),
    'fan':     (1, 0, 252, 505, 400, None, 'period'),
    'mosaic':  (2, 0, 253, 506, 400, None, 'period'),
    'cobble':  (0, 1, 252, 360, 380, -460, 'quilt'),
    'slab':    (1, 1, 252, 300, 380, -390, 'quilt'),
    'earth':   (2, 1, 254, 330, 390, -900, 'quilt'),
}
# 양식 → (칸, 빛 바꾸기). tint=(색, 세기) · val 밝기 · sat 채도 · con 대비
STYLES = {
    'iberia':   ('calcada', {}),
    'espana':   ('cobble', dict(tint=('#b98c62', 0.42), val=1.08, sat=0.95)),
    'italy':    ('fan', {}),
    'france':   ('cobble', {}),
    'east':     ('cobble', dict(tint=('#7d8283', 0.22), sat=0.78, val=0.96)),
    'russia':   ('slab', dict(tint=('#8d8a82', 0.18), sat=0.75, val=0.95)),
    'arabia':   ('mosaic', {}),
    'ottoman':  ('mosaic', dict(tint=('#c8a77d', 0.18), val=0.97)),
    'swahili':  ('cobble', dict(tint=('#dcc49a', 0.86), val=1.30, sat=1.0, con=0.85)),
    'africa':   ('earth', {}),
    'india':    ('mosaic', dict(tint=('#c48a62', 0.30), val=0.96, sat=1.05)),
    'seasia':   ('earth', dict(tint=('#8e6a45', 0.20), val=0.94, sat=0.92)),
    'eastasia': ('slab', {}),
    'japan':    ('slab', dict(tint=('#958d80', 0.20), val=1.02)),
    'steppe':   ('earth', dict(tint=('#b8a06d', 0.48), val=1.05, sat=0.8)),
    'volcanic': ('cobble', dict(tint=('#56534f', 0.40), val=0.74, sat=0.55, con=1.06)),
    'andes':    ('slab', dict(tint=('#a49272', 0.38), val=1.04)),
    'native':   ('earth', dict(tint=('#7f5c40', 0.32), val=0.9, sat=0.9)),
    'pueblo':   ('earth', dict(tint=('#c8946a', 0.34), val=1.06)),
}
NAMES = {
    'iberia': '이베리아', 'espana': '에스파냐·식민', 'italy': '지중해', 'france': '서·북유럽', 'east': '동유럽', 'russia': '러시아',
    'arabia': '아랍·북아프리카', 'ottoman': '오스만·레반트', 'swahili': '동아프리카 해안', 'africa': '아프리카 내륙', 'india': '인도',
    'seasia': '동남아시아', 'eastasia': '동아시아', 'japan': '일본', 'steppe': '초원', 'volcanic': '메소아메리카', 'andes': '안데스',
    'native': '북미 마을', 'pueblo': '푸에블로',
}


def cut_path(err):
    """겹친 띠(err: 높이×폭)에서 위→아래로 이어지는 최소 비용 세로 이음선. 행마다 열 번호를 돌려준다."""
    h, w = err.shape
    cost = err.copy(); back = np.zeros((h, w), np.int8)
    for y in range(1, h):
        prev = cost[y - 1]
        left = np.r_[np.inf, prev[:-1]]; right = np.r_[prev[1:], np.inf]
        stack = np.vstack([left, prev, right]); k = stack.argmin(0)
        cost[y] += stack[k, np.arange(w)]; back[y] = k - 1
    path = np.zeros(h, int); path[-1] = int(cost[-1].argmin())
    for y in range(h - 1, 0, -1):
        path[y - 1] = min(w - 1, max(0, path[y] + back[y, path[y]]))
    return path


def join(a, b):
    """a의 오른쪽 끝 OV 열과 b의 왼쪽 OV 열을 이음선으로 합친다(왼쪽 = a, 오른쪽 = b)."""
    ra, rb = a[:, -OV:], b[:, :OV]
    err = ((ra - rb) ** 2).sum(2)
    err = err + 0.15 * np.abs(np.gradient(err, axis=0))
    path = cut_path(err)
    xs = np.arange(OV)[None, :]
    m = np.clip((xs - path[:, None] + 2.0) / 4.0, 0, 1)[..., None]    # 이음선 양쪽 2px만 섞는다
    mid = ra * (1 - m) + rb * m
    return mid


def stitch(a, b):
    return np.concatenate([a[:, :-OV], join(a, b), b[:, OV:]], 1)


def make_loop(s):
    """끝과 처음을 이어 가로로 끝없이 되풀이되는 띠(폭 = 원래 폭 - OV)."""
    w = s.shape[1]
    first = join(s[:, w - OV:], s[:, :OV])   # 왼쪽 = 끝 조각, 오른쪽 = 처음 조각
    return np.concatenate([first, s[:, OV:w - OV]], 1)


def best_period(img, lo, hi):
    w = img.shape[1]; best = None
    for p in range(lo, min(hi, w - OV) + 1):
        e = ((img[:, p:p + OV] - img[:, :OV]) ** 2).mean()
        if best is None or e < best[0]:
            best = (e, p)
    return best[1]


def flatten(a, cx, wout, h, vy):
    """줄마다 가로 배율을 바꿔 원근을 편다: 출력 x → 원본 cx + (x - 가운데)·(y - vy)/(YREF - vy)."""
    w = a.shape[1]
    ys = np.arange(h)[:, None]; xo = np.arange(wout)[None, :] - (wout - 1) / 2
    xs = cx + (xo * (ys - vy) / (YREF - vy) if vy is not None else xo)
    x0 = np.clip(np.floor(xs).astype(int), 0, w - 2); f = np.clip(xs - x0, 0, 1)[..., None]
    rows = np.repeat(np.arange(h)[:, None], wout, 1)
    return a[rows, x0] * (1 - f) + a[rows, x0 + 1] * f


def even_columns(im, sigma=28.0):
    """열마다 평균 밝기를 넓게 흐린 값으로 나눠 가로 빛 기울기를 없앤다(돌·흙의 잔무늬는 그대로)."""
    lum = (im * [0.299, 0.587, 0.114]).sum(2)
    col = lum.mean(0)
    k = np.exp(-0.5 * (np.arange(-3 * sigma, 3 * sigma + 1) / sigma) ** 2); k /= k.sum()
    pad = np.pad(col, int(3 * sigma), mode='reflect')
    smooth = np.convolve(pad, k, mode='valid')
    gain = (col.mean() / np.maximum(smooth, 1.0))[None, :, None]
    return np.clip(im * gain, 0, 255)


def tile_strip(name, src):
    c, r, cx, wout, h, vy, mode = TILES[name]
    tile = np.asarray(src.crop((COLS[c][0], ROWS[r][0], COLS[c][1], ROWS[r][1]))).astype(np.float64)
    flat = Image.fromarray(flatten(tile, cx, wout, h, vy).clip(0, 255).astype(np.uint8))
    w = round(wout * SH)
    im = np.asarray(flat.resize((w, TH), Image.Resampling.LANCZOS)).astype(np.float64)
    if mode == 'period':
        # 무늬 주기에 맞춰 자른다: 처음 OV 열과 가장 잘 맞는 자리
        p = best_period(im, int(w * 0.42), w - OV)
        return make_loop(im[:, :p + OV]), p
    # 고르지 않은 칸: 칸 가장자리가 어두운 빛 얼룩(가로 밝기 기울기)을 먼저 고르게 펴서 이음매에 밝기 계단이 생기지 않게 하고,
    # [원본 | 좌우를 뒤집어 절반쯤 밀어낸 조각 | 원본을 1/5 밀어낸 조각]을 이어 넓힌다(뒤집힌 짝이 바로 옆에 오지 않게)
    im = even_columns(im)
    mir = im[:, ::-1]
    s = stitch(stitch(im, mir[:, int(w * 0.52):]), im[:, int(w * 0.22):])
    out = make_loop(s)
    return out, out.shape[1]


def recolor(a, tint=None, val=1.0, sat=1.0, con=1.0):
    x = a / 255.0
    lum = (x * [0.299, 0.587, 0.114]).sum(2, keepdims=True)
    if tint:
        t = np.array([int(tint[0][i:i + 2], 16) for i in (1, 3, 5)]) / 255.0
        tl = (t * [0.299, 0.587, 0.114]).sum()
        x = x * (1 - tint[1]) + (lum * t / max(tl, 1e-3)) * tint[1]
        lum = (x * [0.299, 0.587, 0.114]).sum(2, keepdims=True)
    x = lum + (x - lum) * sat
    m = x.mean((0, 1), keepdims=True)
    x = (m + (x - m) * con) * val
    return np.clip(x * 255.0, 0, 255)


def font(size):
    for f in ('C:/Windows/Fonts/malgun.ttf', '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
              '/usr/share/fonts/truetype/nanum/NanumGothic.ttf', '/System/Library/Fonts/AppleSDGothicNeo.ttc'):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            continue
    return ImageFont.load_default()


def main():
    if not os.path.exists(SRC):
        sys.exit('기준 그림이 없습니다: ' + SRC)
    src = Image.open(SRC).convert('RGB')
    os.makedirs(OUT, exist_ok=True)
    base = {}
    for name in TILES:
        base[name] = tile_strip(name, src)
        print(f'칸 {name:8s} 띠 폭 {base[name][0].shape[1]}px')
    rows = []
    for sid, (tile, opt) in STYLES.items():
        arr = recolor(base[tile][0], **opt)
        im = Image.fromarray(arr.round().astype(np.uint8), 'RGB')
        path = os.path.join(OUT, sid + '.webp')
        im.save(path, 'WEBP', quality=86, method=6)
        rows.append((sid, im))
        print(f'{sid:9s} ← {tile:8s} {im.size[0]}×{im.size[1]} {os.path.getsize(path) // 1024} KiB')
    # 접촉 시트: 띠를 두 번 이어 붙여 이음매가 보이지 않는지 함께 확인한다
    f = font(15); cw = 1000; pad = 10; rh = TH + 26
    sheet = Image.new('RGB', (cw * 2 + pad * 3, pad + ((len(rows) + 1) // 2) * (rh + pad)), (33, 27, 22))
    d = ImageDraw.Draw(sheet)
    for i, (sid, im) in enumerate(rows):
        x = pad + (i % 2) * (cw + pad); y = pad + (i // 2) * (rh + pad)
        strip = Image.new('RGB', (cw, TH))
        for gx in range(0, cw, im.size[0]):
            strip.paste(im, (gx, 0))
        sheet.paste(strip, (x, y + 24))
        d.text((x + 2, y + 2), f'{NAMES[sid]} · {sid} ← {STYLES[sid][0]}  (이음 {im.size[0]}px마다)', fill=(236, 222, 196), font=f)
    sheet.save(CONTACT, optimize=True)
    print('접촉 시트', os.path.relpath(CONTACT, ROOT))


if __name__ == '__main__':
    main()
