#!/usr/bin/env python3
"""제독 걷기·달리기·문 들어가기 아틀라스 49칸 점검 (python3 tests/player_motion_frames.py)
- 칸마다 사람이 통째로 있다: 위·옆 칸 가장자리에 닿지 않고, 발이 같은 바닥선(±4px)에 선다
- 걷기·달리기는 모든 칸의 키 차이가 1px 이내다
- 걷기와 달리기를 합쳐도 키 차이가 1px 이내다. 뒤돌기 첫 칸은 걷기의 85~115%다
- 걷기·달리기는 오른쪽을 본다 (게임은 왼쪽으로 갈 때 거울로 뒤집는다) — 머리 부분 살빛이 머리 가운데보다 오른쪽"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
LOOKS = ('admiral armored_navigator army_officer battle_vanguard blackcoat_captain casanova charismatic_admiral ganghui '
         'hat_spinner muscle_swordsman navigator_white noble_scholar sea_dog sky_adventurer').split()
bad = []

def cells(path):
    im = Image.open(path).convert('RGBA'); cw, ch = im.width // 7, im.height // 7
    for i in range(49):
        yield im.crop(((i % 7) * cw, (i // 7) * ch, (i % 7 + 1) * cw, (i // 7 + 1) * ch))

def facing(c):
    a = np.asarray(c); al = a[:, :, 3] > 64; ys, xs = np.nonzero(al)
    top = a[ys.min():ys.min() + max(4, int((ys.max() - ys.min()) * 0.2))]
    hsv = np.asarray(Image.fromarray(top[:, :, :3]).convert('HSV')).astype(float)
    H, S, V = hsv[:, :, 0] * 180 / 255, hsv[:, :, 1] / 255, hsv[:, :, 2] / 255
    m = top[:, :, 3] > 128; skin = (H <= 22) & (S > 0.18) & (S < 0.68) & (V > 0.45) & m
    sx = np.nonzero(skin)[1]; hx = np.nonzero(m)[1]
    if len(sx) < 15 or not len(hx): return 0
    return (sx.mean() - (hx.min() + hx.max()) / 2) / max(1, hx.max() - hx.min())

for look in LOOKS:
    med, ranges = {}, {}
    for mo in ('walk', 'run', 'back'):
        p = ROOT / 'images' / 'characters' / look / 'motion' / f'{mo}.webp'
        hs, foot, right = [], [], 0
        for i, c in enumerate(cells(p)):
            bb = c.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
            if not bb: bad.append(f'{look}/{mo} 칸{i} 비었다'); continue
            if bb[0] <= 0 or bb[1] <= 0 or bb[2] >= c.width: bad.append(f'{look}/{mo} 칸{i} 칸 가장자리에 걸림 {bb}')
            hs.append(bb[3] - bb[1]); foot.append(bb[3])
            if mo != 'back' and facing(c) > 0.04: right += 1
        if max(foot) - min(foot) > 4: bad.append(f'{look}/{mo} 발 높이가 {min(foot)}~{max(foot)}')
        m = float(np.median(hs)); med[mo] = m
        ranges[mo] = (min(hs),max(hs))
        if mo != 'back' and max(hs)-min(hs) > 1: bad.append(f'{look}/{mo} 키가 {min(hs)}~{max(hs)} — 1px 초과')
        if mo != 'back' and right < 40: bad.append(f'{look}/{mo} 오른쪽을 보는 칸이 49칸 중 {right}칸')
    first_back = [c for c in cells(ROOT / 'images' / 'characters' / look / 'motion' / 'back.webp')][0]
    fb = first_back.getchannel('A').getbbox(); fh = fb[3] - fb[1]
    if max(ranges['walk'][1],ranges['run'][1])-min(ranges['walk'][0],ranges['run'][0]) > 1:
        bad.append(f'{look} 걷기 {ranges["walk"]} / 달리기 {ranges["run"]} — 전환 크기 차이')
    if not 0.85 <= fh / med['walk'] <= 1.15: bad.append(f'{look} 뒤돌기 첫 칸 키 {fh} / 걷기 {med["walk"]:.0f}')

if bad:
    print('\n'.join('✗ ' + b for b in bad)); sys.exit(1)
print(f'제독 {len(LOOKS)}종 × 걷기·달리기·뒤돌기 49칸: 잘린 칸 없음 · 바닥선 같음 · 키 고름 · 오른쪽을 봄')
