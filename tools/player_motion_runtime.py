#!/usr/bin/env python3
"""제독 걷기·달리기·문 들어가기 아틀라스(게임용) 만들기 — images/characters/<look>/motion/{walk,run,back}.webp
raw 동작 시트 → 게임용 7×7 아틀라스 (images/characters/<look>/motion/{walk,run,back}.webp)
- 사람을 연결 성분으로 하나씩 찾아낸다 (raw 시트의 줄 수는 5~7로 제각각이라 7×7 격자로 자르면 머리·다리가 잘린다)
- 시트 위·아래 가장자리에 걸려 키가 줄어든 칸과 키가 중간값의 88%도 안 되는 칸(멀어지며 작게 그려진 칸)은 뺀다
- back: 돌아서는 동작 — 뒷모습이 된 뒤 다시 앞을 보는 칸은 뺀다 (머리 부분 살빛으로 판정)
- 모두 오른쪽을 보게 맞춘다 (raw는 대부분 왼쪽을 보고, 중간에 반대로 그려진 칸도 있다)
- 세 동작의 키를 맞춘다 (걷기·뒤돌기 = T, 달리기 = 0.94T) · 머리·몸통 가운데를 칸 가운데에 둔다
- 칸 수가 49가 아니면 고르게 되풀이해 49칸을 채운다

raw 시트(artifacts/player-motion-sheets/<look>/<motion>.raw.png)는 ImageGen이 그린 것이라 줄 수(5~7)·칸 수(35~49)·보는 쪽이 제각각이다.
7×7 격자로 그대로 자르면 머리나 다리만 남은 칸이 생긴다 (2026-10-15 QA: 14종 가운데 대부분의 걷기·뒤돌기에서 머리 없는 칸).
python3 tools/player_motion_runtime.py [look ...]
"""
from __future__ import annotations
import argparse, json, os, sys
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

def figures(raw):
    rgba = np.asarray(raw.convert('RGBA'))
    a = rgba[:, :, 3]
    solid = (a > 64).astype(np.uint8)
    n, lab, st, cen = cv2.connectedComponentsWithStats(solid, 8)
    idx = list(range(1, n)); areas = st[1:, cv2.CC_STAT_AREA]
    ref = np.median(np.sort(areas)[-30:])
    big = [i for i in idx if st[i, cv2.CC_STAT_AREA] >= 0.2 * ref]
    small = [i for i in idx if i not in big and st[i, cv2.CC_STAT_AREA] >= 12]
    bx = {i: [st[i, 0], st[i, 1], st[i, 0] + st[i, 2], st[i, 1] + st[i, 3]] for i in idx}
    mh = np.median([bx[i][3] - bx[i][1] for i in big]); mw = np.median([bx[i][2] - bx[i][0] for i in big])
    # 큰 덩어리에 붙은 작은 조각(모자 깃털·칼끝)
    owner = {i: [i] for i in big}
    for s in small:
        x0, y0, x1, y1 = bx[s]
        best = None
        for b in big:
            X0, Y0, X1, Y1 = bx[b]
            if x1 >= X0 - 8 and x0 <= X1 + 8 and y1 >= Y0 - 8 and y0 <= Y1 + 8:
                d = abs((x0 + x1) / 2 - (X0 + X1) / 2)
                if best is None or d < best[0]: best = (d, b)
        if best: owner[best[1]].append(s)
    # 붙어 버린 사람들은 가로·세로로 나눈다 (자르는 자리는 알파가 가장 옅은 곳)
    def cuts(prof, k):
        L = len(prof); out = [0]
        for j in range(1, k):
            c = L * j / k; w = int(L / k * 0.25)
            lo, hi = max(1, int(c - w)), min(L - 1, int(c + w))
            out.append(lo + int(np.argmin(prof[lo:hi])) if hi > lo else int(c))
        return out + [L]
    items = []
    for b in big:
        x0, y0, x1, y1 = bx[b]; w = x1 - x0; h = y1 - y0
        kx = max(1, int(round(w / mw))) if w > 1.55 * mw else 1
        ky = max(1, int(round(h / mh))) if h > 1.55 * mh else 1
        m = np.isin(lab[y0:y1, x0:x1], owner[b])
        xc = cuts(m.sum(0), kx); yc = cuts(m.sum(1), ky)
        for jy in range(ky):
            for jx in range(kx):
                clip = None if kx == 1 and ky == 1 else (x0 + xc[jx], x0 + xc[jx + 1], y0 + yc[jy], y0 + yc[jy + 1])
                cx = x0 + (xc[jx] + xc[jx + 1]) / 2; cy = y0 + (yc[jy] + yc[jy + 1]) / 2
                items.append({'labels': owner[b], 'clip': clip, 'cy': cy, 'cx': cx})
    # 줄 나누기: 가운데 높이로 묶는다
    items.sort(key=lambda t: t['cy'])
    rows = [[items[0]]]
    for t in items[1:]:
        if t['cy'] - rows[-1][-1]['cy'] > 0.45 * mh: rows.append([t])
        else: rows[-1].append(t)
    out = []
    for r in rows:
        for t in sorted(r, key=lambda t: t['cx']):
            m = np.isin(lab, t['labels']).astype(np.uint8)
            halo = cv2.dilate(m, np.ones((5, 5), np.uint8)).astype(bool)
            if t['clip']:   # 나눈 조각에서도 가장 큰 덩어리만 (이웃의 팔·모자 끝은 버린다)
                c = t['clip']; box = np.zeros_like(halo); box[int(c[2]):int(c[3]), int(c[0]):int(c[1])] = True
                n2, l2, s2, _ = cv2.connectedComponentsWithStats((m.astype(bool) & box).astype(np.uint8), 8)
                if n2 > 1:
                    k2 = 1 + int(np.argmax(s2[1:, cv2.CC_STAT_AREA])); halo = cv2.dilate((l2 == k2).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
            if t['clip']:
                c = t['clip']; box = np.zeros_like(halo); box[int(c[2]):int(c[3]), int(c[0]):int(c[1])] = True; halo &= box
            px = rgba.copy(); px[:, :, 3] = np.where(halo, a, 0)
            ys, xs = np.nonzero(px[:, :, 3] > 8)
            im = Image.fromarray(px[ys.min():ys.max() + 1, xs.min():xs.max() + 1], 'RGBA')
            im.info['edge'] = bool(ys.max() >= a.shape[0] - 2 or ys.min() <= 1)
            out.append(im)
    return out, [len(r) for r in rows]

def face_score(f):
    """머리 부분(위 22%)에 살빛이 얼마나 보이나 — 뒷모습이면 거의 없다"""
    a = np.asarray(f)
    h = a.shape[0]; top = a[:max(4, int(h * 0.22))]
    rgb = top[:, :, :3].astype(np.uint8); al = top[:, :, 3] > 128
    hsv = cv2.cvtColor(rgb.reshape(-1, 1, 3), cv2.COLOR_RGB2HSV).reshape(top.shape[0], top.shape[1], 3)
    H, S, V = hsv[:, :, 0], hsv[:, :, 1] / 255.0, hsv[:, :, 2] / 255.0
    skin = (H <= 22) & (S > 0.18) & (S < 0.68) & (V > 0.45) & al
    return skin.sum() / max(1, al.sum())

def facing(f):
    """옆모습이 보는 쪽: 머리 부분 살빛(얼굴)이 머리 가운데보다 오른쪽이면 +, 왼쪽이면 − (모르겠으면 0)"""
    a = np.asarray(f); h = a.shape[0]; top = a[:max(4, int(h * 0.2))]
    al = top[:, :, 3] > 128
    xs = np.nonzero(al)[1]
    if not len(xs): return 0.0
    hsv = cv2.cvtColor(top[:, :, :3].astype(np.uint8).reshape(-1, 1, 3), cv2.COLOR_RGB2HSV).reshape(top.shape[0], top.shape[1], 3)
    H, S, V = hsv[:, :, 0], hsv[:, :, 1] / 255.0, hsv[:, :, 2] / 255.0
    skin = (H <= 22) & (S > 0.18) & (S < 0.68) & (V > 0.45) & al
    sx = np.nonzero(skin)[1]
    if len(sx) < 15: return 0.0
    return (sx.mean() - (xs.min() + xs.max()) / 2) / max(1, xs.max() - xs.min())


CELL_H, FOOT, T = 300, 294, 268
LOOKS = 'admiral armored_navigator army_officer battle_vanguard blackcoat_captain casanova charismatic_admiral ganghui hat_spinner muscle_swordsman navigator_white noble_scholar sea_dog sky_adventurer'.split()
def anchor(f):
    a = np.asarray(f)[:, :, 3] > 64; h = a.shape[0]; top = a[: int(h * 0.4)]
    xs = np.nonzero(top)[1]; return xs.mean() if len(xs) else f.width / 2
def face_right(fr):
    """모두 오른쪽을 보게 뒤집는다 (게임은 왼쪽으로 갈 때만 거울로 뒤집는다). 판단이 안 서는 칸은 시트 대부분을 따른다"""
    v = [facing(f) for f in fr]; major = -1 if sum(1 for x in v if x < -0.06) > sum(1 for x in v if x > 0.06) else 1
    out = []
    for f, x in zip(fr, v):
        left = x < -0.06 or (abs(x) <= 0.06 and major < 0)
        out.append(f.transpose(Image.Transpose.FLIP_LEFT_RIGHT) if left else f)
    return out, sum(1 for f, o in zip(fr, out) if f is not o)
def pick_back(fr):
    """옆모습에서 시작해 뒷모습으로 끝나는 가장 그럴듯한 구간을 고른다 (raw 시트마다 돌아서는 순서가 제각각이다)"""
    n = len(fr); s = np.array([face_score(f) for f in fr]); v = np.array([facing(f) for f in fr])
    sm = np.convolve(np.pad(s, 1, mode='edge'), np.ones(3) / 3, 'valid')
    lo, hi = s.min(), s.max(); back = s <= lo + 0.2 * (hi - lo); side = (np.abs(v) >= 0.12) & (s >= lo + 0.35 * (hi - lo))
    best = None
    for a in range(n):
        if not side[a]: continue
        for e in range(a + 2, min(n, a + 30)):
            if not back[e]: continue
            seg = sm[a:e + 1]; L = len(seg)
            mono = -np.corrcoef(np.arange(L), seg)[0, 1] if L > 2 and seg.std() > 1e-6 else 0
            sd = np.sign(v[a:e + 1]) * (np.abs(v[a:e + 1]) >= 0.12); sd = sd[sd != 0]
            flips = int(np.sum(sd != sd[0])) if len(sd) else 0     # 옆모습이 반대로 그려진 칸 수
            front = int(np.sum((s[a + 1:e + 1] >= lo + 0.6 * (hi - lo)) & (np.abs(v[a + 1:e + 1]) < 0.1)))   # 중간에 다시 앞을 보는 칸
            score = mono * min(L, 22) - 3 * flips - 4 * front
            if best is None or score > best[0]: best = (score, a, e)
    if best is None:                                       # 못 찾으면 예전처럼 처음부터 가장 뒷모습까지
        a, e = 0, int(np.argmin(sm))
    else: _, a, e = best
    # 뒷모습이 이어지면 그 칸들까지 조금 더 (최대 6칸) — 문 앞에서 잠깐 등을 보인다
    k = 0
    while e + 1 < n and back[e + 1] and k < 6: e += 1; k += 1
    sign = 1 if v[a] >= 0 else -1
    seq = []
    for i in range(a, e + 1):
        f = fr[i]
        if sign < 0: f = f.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        if v[i] * sign < -0.12: f = f.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        seq.append(f)
    return seq, (a, e + 1)
def build(R, out, look):
    rep = {}; seqs = {}
    for mo in ['walk', 'run', 'back']:
        fr, rows = figures(Image.open(f'{R}/{look}/{mo}.raw.png'))
        med = np.median([f.height for f in fr]); keep = [f for f in fr if not (f.info.get('edge') and f.height < 0.93 * med) and f.height >= 0.88 * med]
        info = {'raw_frames': len(fr), 'rows': rows, 'dropped_short': len(fr) - len(keep)}
        if mo == 'back': keep, n = pick_back(keep); info['back_range'] = n
        else: keep, nf = face_right(keep); info['flipped'] = nf
        seqs[mo] = keep; rep[mo] = info
    tgt = {'walk': T, 'run': T * 0.94, 'back': T}
    sc = {mo: tgt[mo] / np.median([f.height for f in seqs[mo]]) for mo in seqs}
    lim = min(min((FOOT - 4) / (max(f.height for f in seqs[mo]) * sc[mo]), 1.0) for mo in seqs)
    for mo, fr in seqs.items():
        s = sc[mo] * lim
        sprites = []
        for f in fr:
            g = f.resize((max(1, round(f.width * s)), max(1, round(f.height * s))), Image.Resampling.LANCZOS)
            sprites.append((g, anchor(g)))
        half = max(max(ax, g.width - ax) for g, ax in sprites)
        cw = int(np.ceil(half * 2)) + 8
        sheet = Image.new('RGBA', (cw * 7, CELL_H * 7), (0, 0, 0, 0)); n = len(sprites)
        for i in range(49):
            g, ax = sprites[min(n - 1, i * n // 49)]
            x = (i % 7) * cw + int(round(cw / 2 - ax)); y = (i // 7) * CELL_H + FOOT - g.height
            sheet.alpha_composite(g, (x, y))
        os.makedirs(f'{out}/{look}/motion', exist_ok=True)
        sheet.save(f'{out}/{look}/motion/{mo}.webp', 'WEBP', lossless=True, method=4)
        rep[mo].update({'frames': n, 'cell': [cw, CELL_H], 'scale': round(s, 4)})
    return rep
def main():
    root = Path(__file__).resolve().parents[1]
    ap = argparse.ArgumentParser()
    ap.add_argument('--raw', type=Path, default=root / 'artifacts' / 'player-motion-sheets', help='<look>/{walk,run,back}.raw.png 가 있는 곳')
    ap.add_argument('--out', type=Path, default=root / 'images' / 'characters')
    ap.add_argument('looks', nargs='*')
    a = ap.parse_args()
    rep = {l: build(str(a.raw), str(a.out), l) for l in (a.looks or LOOKS)}
    (a.raw / 'runtime_report.json').write_text(json.dumps(rep, ensure_ascii=False, indent=1), encoding='utf-8') if a.raw.exists() else None
    print(json.dumps({l: {m: d['frames'] for m, d in v.items()} for l, v in rep.items()}, ensure_ascii=False))

if __name__ == '__main__':
    main()

