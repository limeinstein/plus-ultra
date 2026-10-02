#!/usr/bin/env python3
"""육상전·육상 탐험·항해 사건 스프라이트 시트를 게임이 쓰는 고른 칸 시트로 다시 짠다.

원본 시트(그림 생성기로 만든 것)는 장면이 줄마다 제멋대로 놓여 있고, 망토·칼·연기가 이웃 장면과 겹친다.
이 도구는
  1) 줄(행)을 찾고 — 투명한 가로줄로 나눈다
  2) 줄마다 장면 수 N을 알려 주면, 세로로 자를 자리 N−1곳을 동적 계획법으로 고른다
     (자르는 값 = 그 세로줄의 불투명 픽셀 수 + 머리 높이 픽셀 ×3, 빈 틈을 품은 장면·텅 빈 장면·너무 가벼운 장면은 벌점)
  3) 이어진 픽셀 덩어리가 한 장면에 70% 넘게 들어 있으면 덩어리째 그 장면에 준다(칼끝·연기가 잘리지 않게)
  4) 모든 장면을 한 줄의 땅선(발밑)과 몸통 가운데에 맞춰 같은 크기의 칸에 옮겨 담는다
결과: images/sprites/<시트>.webp 와 js/data/sprites.js (G.SPRITE_SHEETS — 칸 크기·피벗·동작별 장면 번호).

  python tools/sprite_repack.py                    # 모두 다시 만들기 (원본: images/_extra/sprite_src/)
  python tools/sprite_repack.py officers --debug   # 장면마다 번호를 붙인 점검 그림 → images/_extra/sprite_debug/
원본 파일은 저장소에 올리지 않는다(images/_extra/). 탐험대 8방향 시트는 ../assets/sprites/land_expedition 의 매니페스트를 따른다.
numpy·Pillow 가 필요하다.
"""
import json, os, sys
from collections import deque
import numpy as np
from PIL import Image, ImageDraw

TOOLS = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(TOOLS)
SRC = os.path.join(ROOT, 'images', '_extra', 'sprite_src')
OUT = os.path.join(ROOT, 'images', 'sprites')
DBG = os.path.join(ROOT, 'images', '_extra', 'sprite_debug')
PARTY_SRC = os.path.join(os.path.dirname(ROOT), 'assets', 'sprites', 'land_expedition')
DATA_JS = os.path.join(ROOT, 'js', 'data', 'sprites.js')

# ------------------------------------------------------------------ 시트 설정
# n: 줄마다 장면 수(하나면 모든 줄), wmin/wmax: 장면 너비 범위(원본 px), mf·mx: 너무 가볍거나 무거운 장면 벌점 기준(평균 질량의 배수)
# ops: 줄마다 [('merge', i) 장면 i와 i+1을 합침 | ('split', i) 장면 i를 가장 얇은 곳에서 나눔] — 위에서부터 차례로
# rows: 줄 이름, acts: 동작 → 장면 번호 목록, racts: 줄마다 덮어쓸 acts (rows 순서대로)
# scale: 내보낼 크기 배율, speck: 버릴 부스러기 크기(장면에서 가장 큰 덩어리 대비), grow: 몸통 씨앗 침식 횟수(0이면 세로로만 자름)
SHEETS = {
    # 제독대(장교) — 오른쪽을 본다. 줄: 해군 장교 · 견장 장교 · 망토 장교 · 흰 망토 제독
    'officers': dict(n=40, wmin=34, wmax=150, scale=0.7,
                     rows=['officer', 'officer2', 'officer3', 'admiral'],
                     acts=dict(idle=[0, 1, 2, 3], walk=[4, 5, 6, 7, 8], run=[9, 10, 11, 12, 13, 14],
                               attack=[15, 16, 17, 18, 19, 20, 21], hurt=[22, 24], dead=[26], back=[30, 31, 32, 33, 34], cheer=[35, 36, 37, 38, 39])),
    # 총병 — 줄: 산적 총잡이 · 왜구 총잡이 · 총병 · 머스킷총병
    'musketeers': dict(n=30, wmin=34, wmax=170, scale=0.7, ops=[('merge', 14)],
                       rows=['bandit_gun', 'pirate_gun', 'musketeer', 'musketeer2'],
                       acts=dict(idle=[0, 1, 2, 3], ready=[4, 5, 6, 7], walk=[8, 9, 10, 11, 12], attack=[13, 14, 15, 16, 17],
                                 hurt=[18], dead=[18], back=[19, 20, 21, 22, 23], cheer=[24, 25, 26, 27], vanish=[28])),
    # 포병 — 줄: 산적 포수 · 가죽앞치마 포수 · 포병 · 캐논포병
    'cannons': dict(n=32, wmin=40, wmax=200, scale=0.7, ops=[('merge', 15)],
                    rows=['bandit_cannon', 'cannon_crew', 'gunner', 'gunner2'],
                    acts=dict(idle=[0, 1, 2], load=[3, 4, 5, 6, 7], walk=[7, 8, 9, 10, 11], attack=[12, 13, 14, 15, 16, 17], hurt=[18], dead=[19],
                              back=[21, 22, 23, 24, 25, 26], smoke=[27, 28, 29, 30])),
    # 동아시아 무사 — 줄: 닌자 · 창병 · 검객 · 갓 쓴 검객 · 몽둥이 장사 (몽둥이 장사 줄은 장면 하나가 더 있다)
    'east_fighters': dict(n=[25, 25, 25, 25, 26], wmin=36, wmax=220, mf=0.45, scale=0.7,
                          ops=[[], [], [], [], [('merge', 9), ('merge', 12), ('split', 16)]],
                          rows=['ninja', 'spearman', 'swordsman', 'scholar', 'brute'],
                          acts=dict(idle=[0, 1, 2], walk=[3, 4, 5, 6], run=[7, 8, 9], attack=[10, 11, 12, 13, 14], hurt=[15], dead=[17],
                                    back=[18, 19, 20, 21], away=[22, 23, 24])),
    # 칼잡이 보병 — 줄: 몽둥이 농민 · 칼잡이 · 검은 옷 칼잡이 · 망토 칼잡이
    'swordsmen': dict(n=35, wmin=40, wmax=200, mf=0.4, scale=0.7,
                      rows=['club', 'blade', 'blade2', 'blade3'],
                      acts=dict(idle=[0, 1, 2, 3], walk=[4, 5, 6, 7], run=[8, 9, 10, 11, 12, 13], attack=[14, 15, 16, 17, 18, 19],
                                hurt=[22], dead=[21], crouch=[22, 23, 24, 25], back=[26, 27, 28, 29, 30], cheer=[31, 32, 33, 34])),
    # 오스만 군 — 줄: 방패 보병 · 포수 · 예니체리 총병 (줄마다 장면 수가 다르다)
    'ottoman': dict(n=[30, 20, 27], mx=2.4, wmin=36, wmax=220, mf=0.4, scale=0.7,
                    rows=['shield', 'topcu', 'janissary'],
                    acts=dict(idle=[0, 1, 2, 3]),
                    racts=[dict(walk=[4, 5, 6, 7, 8, 9, 10, 11], attack=[12, 13, 14], hurt=[17], dead=[19], back=[22, 23, 24, 25], cheer=[26, 27, 28, 29]),
                           dict(idle=[0, 1], load=[2, 3, 4, 5, 6], walk=[2, 3, 4, 5], attack=[7, 8, 9, 10], hurt=[12], dead=[12], back=[14, 15, 16], smoke=[17, 18, 19]),
                           dict(walk=[4, 5, 6, 7], attack=[8, 9, 10, 11, 12, 13], load=[14], hurt=[15], dead=[16], back=[18, 19, 20, 21, 22], cheer=[23, 24, 25, 26])]),
    # 원주민 — 줄: 주술사 · 깃털 전사 (지팡이 창)
    'natives': dict(n=24, mx=2.0, wmin=40, wmax=260, mf=0.4, scale=0.6,
                    ops=[[('split', 19), ('merge', 11), ('merge', 9), ('split', 4)], [('merge', 10), ('split', 4)]],
                    rows=['shaman', 'warrior'],
                    acts=dict(idle=[0, 1, 2], hurt=[13], back=[16, 17, 18, 19, 20], cheer=[21, 22, 23]),
                    racts=[dict(walk=[3, 6, 7, 8], attack=[10, 11, 12], dead=[14]), dict(walk=[3, 4, 5, 6, 7, 8], attack=[9, 10, 11], dead=[15])]),
    # 들짐승 — 줄: 멧돼지 · 사자 · 재규어 · 호랑이 · 곰 · 하이에나
    'animals': dict(n=28, mx=1.9, speck=0.12, grow=4, wmin=30, wmax=200, mf=0.35, scale=0.7,
                    rows=['boar', 'lion', 'jaguar', 'tiger', 'bear', 'hyena'],
                    acts=dict(idle=[2]),
                    racts=[dict(idle=[0, 1, 2], walk=[4, 5, 6, 7], run=[9, 10, 11, 12], attack=[12, 13, 14], hurt=[17], back=[20, 21, 22, 23], cheer=[24, 25, 26, 27]),
                           dict(idle=[1, 2, 3], walk=[4, 5, 7], run=[8, 9, 10, 11, 12], attack=[13, 14, 15], hurt=[16], back=[21, 22, 23, 24], cheer=[25, 26, 27]),
                           dict(idle=[2], walk=[3, 5, 6], run=[7, 8, 9, 10, 11], attack=[12, 14, 15], hurt=[16], back=[21, 22, 23, 24], cheer=[25, 26, 27]),
                           dict(idle=[0, 1, 2], walk=[3, 4, 5], run=[7, 8, 9, 10, 11], attack=[12, 14, 15], hurt=[16], back=[21, 22, 23], cheer=[25, 26, 27]),
                           dict(idle=[2, 3], walk=[5, 6, 7], run=[8, 9, 10, 11, 12], attack=[12, 13, 14], hurt=[15], back=[21, 22, 23, 24], cheer=[25, 26, 27]),
                           dict(idle=[1, 2, 3], walk=[4, 6, 7], run=[8, 9, 10, 11, 12], attack=[12, 13, 14], hurt=[15], back=[21, 22, 23, 24], cheer=[25, 26, 27])]),
    # ---- 항해 사건 (한 장면 = 한 칸이 뚜렷한 시트). 줄을 위에서부터 이어 붙여 차례로 튼다. ms: 한 장면 시간, once: 한 번만
    'whale': dict(ms=150, once=True, n=5, wmin=200, wmax=420, mf=0.2, scale=0.55, rows=['a', 'b'],
                  acts=dict(play=[0, 1, 2, 3, 4], play2=[0, 1, 2, 3, 4])),
    'dolphin': dict(ms=110, once=True, n=4, wmin=150, wmax=560, mf=0.2, scale=0.55, rows=['a', 'b'],
                    acts=dict(play=[0, 1, 2, 3])),
    'mermaid': dict(ms=120, once=True, n=4, wmin=200, wmax=420, mf=0.2, scale=0.5, rows=['a', 'b', 'c'],
                    acts=dict(rise=[0, 1, 2, 3], sing=[0, 1, 2, 3], dive=[0, 1, 2, 3])),
    'storm': dict(ms=100, n=5, wmin=250, wmax=420, mf=0.2, scale=0.5, rows=['a', 'b'],
                  acts=dict(play=[0, 1, 2, 3, 4])),
    'raincloud': dict(ms=130, n=4, wmin=250, wmax=480, mf=0.2, scale=0.5, rows=['a', 'b'],
                      acts=dict(play=[0, 1, 2, 3])),
    'rain': dict(ms=90, n=3, wmin=250, wmax=520, mf=0.2, scale=0.5, rows=['a', 'b'],
                 acts=dict(play=[0, 1, 2])),
    'sun': dict(ms=160, n=4, wmin=300, wmax=620, mf=0.2, scale=0.45, rows=['a'],
                acts=dict(play=[0, 1, 2, 3])),
}


def runs(v):
    r, s = [], None
    for i, x in enumerate(v):
        if x and s is None:
            s = i
        if not x and s is not None:
            r.append((s, i)); s = None
    if s is not None:
        r.append((s, len(v)))
    return r


def row_bands(al):
    return [r for r in runs((al > 20).sum(1) > 2) if r[1] - r[0] > 30]


def cut_cost(al, r0, r1):
    band = al[r0:r1] > 140
    h = r1 - r0
    full = band.sum(0).astype(float)
    head = band[int(h * 0.12):int(h * 0.5)].sum(0).astype(float)
    return full + 3 * head, band.sum(0) >= 2


def dp_cuts(cost, has, n, wmin, wmax, mf, mx=None, gap_pen=40.0):
    W = len(cost); INF = 1e18
    nz = np.nonzero(has)[0]; xs, xe = int(nz[0]), int(nz[-1]) + 1
    idx = np.arange(W + 1)
    nc = np.full(W + 1, W); last = W
    for y in range(W - 1, -1, -1):
        if has[y]:
            last = y
        nc[y] = last
    pc = np.full(W + 1, -1); lst = -1
    for x in range(1, W + 1):
        if has[x - 1]:
            lst = x - 1
        pc[x] = lst
    Z = np.concatenate([[0], np.cumsum(~has)])
    c = np.zeros(W + 1); c[:W] = cost
    M = np.concatenate([[0], np.cumsum(cost)]); m0 = mf * M[-1] / n
    dp = np.full(W + 1, INF); dp[xs] = 0; back = []
    for k in range(1, n + 1):
        nd = np.full(W + 1, INF); arg = np.zeros(W + 1, int)
        for w in range(wmin, wmax + 1):
            x = idx[w:]; y = x - w
            a = nc[y]; b = pc[x]
            empty = a > b
            inner = np.where(empty, 0, Z[np.maximum(b, 0)] - Z[np.minimum(a, W)])
            mass = M[x] - M[y]
            fc = dp[y] + np.where(empty, 1e7, gap_pen * inner) + np.where(mass < m0, (m0 - mass) * 50, 0)
            if mx:
                m1 = mx * M[-1] / n
                fc = fc + np.where(mass > m1, (mass - m1) * 50, 0)
            src = np.full(W + 1, INF); src[w:] = fc
            better = src < nd; nd[better] = src[better]; arg[better] = np.nonzero(better)[0] - w
        if k < n:
            nd = nd + c
        dp = nd; back.append(arg)
    e = min(range(xe, min(W, xe + wmax) + 1), key=lambda e: dp[e])
    cuts = [e]
    for k in range(n - 1, -1, -1):
        e = int(back[k][e]); cuts.append(e)
    return cuts[::-1]


def apply_ops(cuts, cost, ops):
    cuts = list(cuts)
    for op, i in ops:
        if op == 'merge':
            del cuts[i + 1]
        elif op == 'split':
            a, b = cuts[i], cuts[i + 1]; lo, hi = a + (b - a) // 5, b - (b - a) // 5
            m = lo + int(np.argmin(cost[lo:hi])); cuts.insert(i + 1, m)
    return cuts


def label(mask):
    """8-이웃으로 이어진 덩어리 번호 (scipy 없이)"""
    h, w = mask.shape
    lab = np.zeros((h, w), np.int32); n = 0
    ys, xs = np.nonzero(mask)
    for y0, x0 in zip(ys.tolist(), xs.tolist()):
        if lab[y0, x0]:
            continue
        n += 1; lab[y0, x0] = n; q = deque([(y0, x0)])
        while q:
            y, x = q.popleft()
            for yy in (y - 1, y, y + 1):
                if yy < 0 or yy >= h:
                    continue
                for xx in (x - 1, x, x + 1):
                    if 0 <= xx < w and mask[yy, xx] and not lab[yy, xx]:
                        lab[yy, xx] = n; q.append((yy, xx))
    return lab, n


def erode(m, it):
    """3×3 침식을 it번 (scipy 없이)"""
    for _ in range(it):
        e = m.copy()
        e[1:] &= m[:-1]; e[:-1] &= m[1:]; e[:, 1:] &= m[:, :-1]; e[:, :-1] &= m[:, 1:]
        e[1:, 1:] &= m[:-1, :-1]; e[:-1, :-1] &= m[1:, 1:]; e[1:, :-1] &= m[:-1, 1:]; e[:-1, 1:] &= m[1:, :-1]
        m = e
    return m


def grow_owner(mask, strong, colseg, it, nf):
    """몸통 씨앗에서 이어진 픽셀을 따라 넓혀 가며 픽셀마다 장면을 정한다(측지 거리로 가장 가까운 몸통).
    맞닿은 이웃 짐승의 다리·꼬리가 제 몸통을 따라가므로 세로로 자를 때 생기는 부스러기가 없다. 닿지 못한 픽셀은 -1"""
    core = erode(strong, it)
    cl, cn = label(core)
    if not cn:
        return np.full(mask.shape, -1, np.int32)
    counts = np.zeros((cn + 1, nf), np.int64)
    f, c = cl.ravel(), colseg.ravel()
    np.add.at(counts, (f[f > 0], c[f > 0]), 1)
    tot = counts.sum(1); best = counts.argmax(1)
    share = np.where(tot > 0, counts.max(1) / np.maximum(tot, 1), 0)
    dec = np.where(tot < 30, -1, np.where(share >= 0.75, best, -2)); dec[0] = -1
    seed = dec[cl]
    seed = np.where(seed == -2, colseg, seed).astype(np.int32)   # 두 장면에 크게 걸친 씨앗은 자르는 선으로 나눈다
    owner = seed.copy()
    h, w = mask.shape
    ys, xs = np.nonzero(owner >= 0)
    q = deque(zip(ys.tolist(), xs.tolist()))
    while q:
        y, x = q.popleft(); o = owner[y, x]
        for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1), (y - 1, x - 1), (y - 1, x + 1), (y + 1, x - 1), (y + 1, x + 1)):
            if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and owner[yy, xx] < 0:
                owner[yy, xx] = o; q.append((yy, xx))
    return owner


def frames_of_band(a, r0, r1, cuts, speck=0.03, grow=0):
    """장면별 (RGBA 조각, 원본 좌상단 x, y) — 덩어리째 옮길 수 있으면 덩어리째. grow>0 이면 몸통 씨앗에서 넓혀 가며 나눈다"""
    pad = 6
    y0, y1 = max(0, r0 - pad), min(a.shape[0], r1 + pad)
    band = a[y0:y1]
    mask = band[:, :, 3] > 6
    lab, n = label(mask)
    W = band.shape[1]
    seg = np.zeros(W, np.int32)
    for i in range(len(cuts) - 1):
        seg[cuts[i]:cuts[i + 1]] = i
    seg[:cuts[0]] = 0; seg[cuts[-1]:] = len(cuts) - 2
    colseg = np.broadcast_to(seg, lab.shape)
    owner = colseg.copy()
    flat = lab.ravel(); cs = colseg.ravel()
    nf = len(cuts) - 1
    counts = np.zeros((n + 1, nf), np.int64)
    np.add.at(counts, (flat[flat > 0], cs[flat > 0]), 1)
    tot = counts.sum(1)
    best = counts.argmax(1); share = np.where(tot > 0, counts.max(1) / np.maximum(tot, 1), 0)
    whole = share >= 0.7
    m = lab > 0
    lw = whole[lab]
    owner = np.where(m & lw, best[lab], colseg)
    if grow:
        g = grow_owner(m, band[:, :, 3] > 140, colseg, grow, nf)
        owner = np.where(g >= 0, g, owner)
        lw = lw & (g < 0)
    out = []
    for i in range(nf):
        sel = (owner == i) & m
        if not sel.any():
            out.append(None); continue
        # 이웃 장면에서 잘려 들어온 부스러기(가장 큰 덩어리의 speck 미만, 덩어리째 받은 것이 아닌 것)는 버린다
        own = np.unique(lab[sel & lw])
        sl, k = label(sel)
        if k > 1:
            area = np.bincount(sl.ravel())[1:]
            keep = np.zeros(k + 1, bool); keep[1:] = area >= speck * area.max()
            for j in range(1, k + 1):
                if not keep[j] and np.isin(lab[sl == j], own).all():
                    keep[j] = True
            sel = keep[sl]
        ys, xs = np.nonzero(sel)
        ya, yb, xa, xb = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        piece = np.zeros((yb - ya, xb - xa, 4), np.uint8)
        sub = band[ya:yb, xa:xb]; ss = sel[ya:yb, xa:xb]
        piece[ss] = sub[ss]
        out.append((piece, int(xa), int(ya + y0)))
    return out


def pivot_of(piece, ox, oy):
    al = piece[:, :, 3] > 140
    ys, xs = np.nonzero(al)
    if not len(ys):
        return ox + piece.shape[1] / 2, oy + piece.shape[0]
    h0, h1 = np.percentile(ys, 25), np.percentile(ys, 60)
    mid = (ys >= h0) & (ys <= h1)
    cx = float(np.median(xs[mid])) if mid.any() else float(np.median(xs))
    return ox + cx, oy + float(ys.max())


def build(sid, cfg, debug=False):
    src = os.path.join(SRC, sid + '.png')
    a = np.array(Image.open(src).convert('RGBA'))
    al = a[:, :, 3]
    bands = row_bands(al)
    rows = []
    for bi, (r0, r1) in enumerate(bands):
        n = cfg['n'][bi] if isinstance(cfg['n'], list) else cfg['n']
        cost, has = cut_cost(al, r0, r1)
        cuts = dp_cuts(cost, has, n, cfg.get('wmin', 34), cfg.get('wmax', 200), cfg.get('mf', 0.3), cfg.get('mx'))
        ops = cfg.get('ops', [])
        if ops and isinstance(ops[0], list):
            ops = ops[bi] if bi < len(ops) else []
        cuts = apply_ops(cuts, cost, ops)
        frs = frames_of_band(a, r0, r1, cuts, cfg.get('speck', 0.03), cfg.get('grow', 0))
        piv = [pivot_of(*f) if f else None for f in frs]
        base = float(np.median([p[1] for p in piv if p]))     # 줄의 땅선: 발밑의 가운데값 (뛰어오른 장면은 떠 있게)
        rows.append([(f, (p[0], base)) if f else None for f, p in zip(frs, piv)])
    if debug:
        dump_debug(sid, rows)
    # 칸 크기: 피벗 기준으로 모든 장면이 들어가는 크기
    L = T = R = B = 0
    for row in rows:
        for it in row:
            if not it:
                continue
            (piece, ox, oy), (px, py) = it
            h, w = piece.shape[:2]
            L = max(L, px - ox); R = max(R, ox + w - px); T = max(T, py - oy); B = max(B, oy + h - py)
    s = cfg.get('scale', 1.0)
    cw, ch = int(np.ceil((L + R) * s)) + 4, int(np.ceil((T + B) * s)) + 4
    pxc, pyc = int(round(L * s)) + 2, int(round(T * s)) + 2
    ncol = max(len(r) for r in rows)
    sheet = Image.new('RGBA', (cw * ncol, ch * len(rows)), (0, 0, 0, 0))
    for ri, row in enumerate(rows):
        for ci, it in enumerate(row):
            if not it:
                continue
            (piece, ox, oy), (px, py) = it
            im = Image.fromarray(piece)
            if s != 1:
                im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
            dx = ci * cw + pxc + round((ox - px) * s); dy = ri * ch + pyc + round((oy - py) * s)
            sheet.alpha_composite(im, (int(dx), int(dy)))
    os.makedirs(OUT, exist_ok=True)
    sheet.save(os.path.join(OUT, sid + '.webp'), 'WEBP', quality=88, method=6)
    meta = dict(cw=cw, ch=ch, px=pxc, py=pyc, cols=ncol, rows=cfg.get('rows', [str(i) for i in range(len(rows))]),
                n=[len(r) for r in rows], h=round((T) * s), acts=cfg['acts'])
    if 'racts' in cfg:
        meta['racts'] = cfg['racts']
    for k in ('ms', 'once'):
        if k in cfg:
            meta[k] = cfg[k]
    print('%-14s %d줄 × %d칸, 칸 %d×%d, 피벗 (%d,%d) → %s' % (sid, len(rows), ncol, cw, ch, pxc, pyc, sheet.size))
    return meta


def dump_debug(sid, rows):
    os.makedirs(DBG, exist_ok=True)
    tw, th = 150, 150
    ncol = max(len(r) for r in rows)
    per = 20
    pages = (ncol + per - 1) // per
    img = Image.new('RGB', (min(ncol, per) * tw, len(rows) * th * pages), (205, 205, 205))
    d = ImageDraw.Draw(img)
    for ri, row in enumerate(rows):
        for ci, it in enumerate(row):
            pg, cc = divmod(ci, per)
            x0, y0 = cc * tw, (pg * len(rows) + ri) * th
            d.rectangle([x0, y0, x0 + tw - 1, y0 + th - 1], outline=(150, 150, 150))
            d.text((x0 + 3, y0 + 2), '%d' % ci, fill=(180, 0, 0))
            if not it:
                continue
            (piece, ox, oy), (px, py) = it
            im = Image.fromarray(piece); k = min((tw - 6) / im.width, (th - 14) / im.height, 1)
            im = im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))))
            img.paste(im, (x0 + (tw - im.width) // 2, y0 + 12), im)
    img.save(os.path.join(DBG, sid + '.png'))


def clean_cells(a, cols, rows, keep=0.04):
    """칸마다 가장 큰 덩어리의 keep 배보다 작은, 떨어진 부스러기(옆 줄 짐승의 발끝·꼬리 따위)를 지운다"""
    a = a.copy()
    for r in range(len(rows) - 1):
        for c in range(len(cols) - 1):
            y0, y1, x0, x1 = rows[r], rows[r + 1], cols[c], cols[c + 1]
            cell = a[y0:y1, x0:x1]
            lab, n = label(cell[:, :, 3] > 8)
            if n < 2:
                continue
            area = np.bincount(lab.ravel())[1:]
            drop = np.zeros(n + 1, bool); drop[1:] = area < keep * area.max()
            cell[drop[lab]] = 0
    return a


def party_sheets():
    """탐험대 8방향 시트: 반 크기 WEBP로 줄이고 매니페스트를 G.SPRITE_PARTY 로 옮긴다"""
    man = json.load(open(os.path.join(PARTY_SRC, 'sprite_manifest.json'), encoding='utf-8'))
    k = 0.5; out = {}
    for sh in man['sheets']:
        im = Image.open(os.path.join(PARTY_SRC, sh['file'])).convert('RGBA')
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        cols, rows = [round(x * k) for x in sh['columnBounds']], [round(y * k) for y in sh['rowBounds']]
        im = Image.fromarray(clean_cells(np.array(im), cols, rows))
        im.save(os.path.join(OUT, 'party_' + sh['id'] + '.webp'), 'WEBP', quality=88, method=6)
        out[sh['id']] = dict(cols=cols, rows=rows,
                             px=[round(x * k) for x in sh['pivotXByColumn']], py=[round(y * k) for y in sh['pivotYByRow']],
                             n=sh['frameCountPerDirection'])
        print('party_%-10s %s' % (sh['id'], im.size))
    return dict(dirs=man['directionsByRow'], sheets=out)


def main():
    args = [x for x in sys.argv[1:] if not x.startswith('--')]
    debug = '--debug' in sys.argv
    old = {}
    if os.path.exists(DATA_JS):
        txt = open(DATA_JS, encoding='utf-8').read()
        try:
            old = json.loads(txt[txt.index('G.SPRITE_SHEETS = ') + 18:txt.index(';\nG.SPRITE_PARTY')])
        except ValueError:
            old = {}
    meta = dict(old)
    for sid, cfg in SHEETS.items():
        if args and sid not in args:
            continue
        meta[sid] = build(sid, cfg, debug)
    meta = {k: meta[k] for k in SHEETS if k in meta}
    party = party_sheets() if (not args or 'party' in args) or not os.path.exists(DATA_JS) else None
    if party is None:
        txt = open(DATA_JS, encoding='utf-8').read()
        party = json.loads(txt[txt.index('G.SPRITE_PARTY = ') + 17:txt.rindex(';')])
    with open(DATA_JS, 'w', encoding='utf-8', newline='\n') as f:
        f.write('/* 자동 생성 파일입니다 — python tools/sprite_repack.py 가 만듭니다. 손으로 고치지 마십시오.\n'
                '   G.SPRITE_SHEETS: 시트마다 칸 크기(cw·ch), 칸 안의 발밑 피벗(px·py), 줄 이름(rows), 줄마다 장면 수(n), 동작별 장면 번호(acts)\n'
                '   G.SPRITE_PARTY: 탐험대 8방향 시트(images/sprites/party_*.webp)의 자르는 선과 피벗 */\n'
                'window.G = window.G || {};\nG.SPRITE_SHEETS = ' + json.dumps(meta, ensure_ascii=False, separators=(',', ':')) +
                ';\nG.SPRITE_PARTY = ' + json.dumps(party, ensure_ascii=False, separators=(',', ':')) + ';\n')


if __name__ == '__main__':
    main()
