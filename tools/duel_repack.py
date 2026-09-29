"""일기토 전투원 시트를 칸이 넉넉한 시트로 다시 짠다.

Codex가 만든 원본(1536×1024, 6열×4행, 칸 256, 발밑 피벗 (128, 246))은 찌르기 동작의 칼날이
옆 칸으로 60~125px, 대기 동작의 머리가 윗칸으로 5~19px 넘어가 있다. 칸 256으로 잘라 그리면
칼이 사라지고 다음 장면에 남의 칼끝이 떠 보인다.

이 도구는 장면마다 몸통(깎아 낸 불투명 덩어리)을 씨앗으로 삼아 이어진 픽셀을 따라가며(측지 거리)
각 픽셀이 어느 장면의 것인지 가린 뒤, 모든 장면을 같은 피벗에 맞춰 더 큰 칸에 옮겨 담는다.
픽셀 값은 그대로 옮기며(다시 뽑기 없음) 행·열·동작 순서도 원본과 같다.

  python tools/duel_repack.py SRC_DIR OUT_DIR [--cell 448x320 --pivot 176,292]
  python tools/duel_repack.py --check OUT_DIR     # 다시 짠 시트 점검
원본은 images/_extra/duel_fighters_src/ 에 둔다(저장소에는 올리지 않음).
"""
import argparse, glob, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage
from skimage.segmentation import watershed

SRC_CELL, SRC_PIVOT = 256, (128, 246)
DUST = 4                                   # 이 알파 이하는 배경 지우기에서 남은 먼지(눈에 안 보임)
ROWS = {0: 6, 1: 4, 2: 3, 3: 6}            # 공격 6 · 방어 4 · 피격 3 · 행동 6
USED = [(r, c) for r, n in ROWS.items() for c in range(n)]


def split_frames(a):
    """RGBA 배열 → 장면별 (픽셀 좌표 ys, xs) — 원본 시트 좌표."""
    alpha = a[:, :, 3]
    mask = alpha > DUST                       # 알파 1~4의 보이지 않는 먼지는 버린다
    core = ndimage.binary_erosion(alpha > 100, structure=np.ones((3, 3)), iterations=4)
    lab_c, _ = ndimage.label(core, structure=np.ones((3, 3)))
    markers = np.zeros(alpha.shape, np.int32)
    for k, (r, c) in enumerate(USED, 1):
        y0, x0 = r * SRC_CELL, c * SRC_CELL
        sub = lab_c[y0:y0 + SRC_CELL, x0:x0 + SRC_CELL]
        ids, cnt = np.unique(sub[sub > 0], return_counts=True)
        if not len(ids):
            continue
        best = ids[np.argmax(cnt)]
        region = np.zeros_like(mask); region[y0:y0 + SRC_CELL, x0:x0 + SRC_CELL] = True
        markers[(lab_c == best) & region] = k
    # 몸통에서 이어진 픽셀을 따라 가까운 장면으로 (평평한 지형의 watershed = 측지 거리 순서)
    labels = watershed(np.zeros(alpha.shape, np.uint8), markers=markers, mask=mask, connectivity=2)
    # 몸통과 떨어진 조각(떨어진 칼날·잔 점)은 가장 가까운 장면으로 — 조각 전체를 한 장면에
    left = mask & (labels == 0)
    if left.any():
        _, (iy, ix) = ndimage.distance_transform_edt(labels == 0, return_indices=True)
        dist = ndimage.distance_transform_edt(labels == 0)
        lab_l, n = ndimage.label(left, structure=np.ones((3, 3)))
        for i, sl in enumerate(ndimage.find_objects(lab_l), 1):
            m = lab_l[sl] == i
            d = np.where(m, dist[sl], np.inf)
            j = np.unravel_index(np.argmin(d), d.shape)
            gy, gx = j[0] + sl[0].start, j[1] + sl[1].start
            labels[sl][m] = labels[iy[gy, gx], ix[gy, gx]]
    return labels


def extents(labels):
    """장면마다 원본 피벗 기준 (왼, 오른, 위, 아래) 거리."""
    out = {}
    for k, (r, c) in enumerate(USED, 1):
        ys, xs = np.nonzero(labels == k)
        if not len(ys):
            continue
        px, py = c * SRC_CELL + SRC_PIVOT[0], r * SRC_CELL + SRC_PIVOT[1]
        out[(r, c)] = (px - xs.min(), xs.max() - px, py - ys.min(), ys.max() - py)
    return out


def repack(a, labels, cell, pivot):
    cw, ch = cell
    out = np.zeros((ch * 4, cw * 6, 4), np.uint8)
    clipped = 0
    for k, (r, c) in enumerate(USED, 1):
        ys, xs = np.nonzero(labels == k)
        if not len(ys):
            continue
        ny = ys - (r * SRC_CELL + SRC_PIVOT[1]) + pivot[1]
        nx = xs - (c * SRC_CELL + SRC_PIVOT[0]) + pivot[0]
        ok = (ny >= 0) & (ny < ch) & (nx >= 0) & (nx < cw)
        clipped += int((~ok).sum())
        out[ny[ok] + r * ch, nx[ok] + c * cw] = a[ys[ok], xs[ok]]
    return out, clipped


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src', nargs='?')
    ap.add_argument('out', nargs='?')
    ap.add_argument('--cell', default='')
    ap.add_argument('--pivot', default='')
    ap.add_argument('--margin', type=int, default=8)
    ap.add_argument('--check', default='')
    ap.add_argument('--report', default='')
    args = ap.parse_args()
    if args.check:
        return check(args.check)
    files = sorted(glob.glob(os.path.join(args.src, '*.png')))
    data, ext = {}, {}
    for f in files:
        a = np.array(Image.open(f).convert('RGBA'))
        if a.shape[:2] != (1024, 1536):
            sys.exit(f + ': 원본은 1536×1024여야 함')
        lab = split_frames(a)
        data[f] = (a, lab)
        for key, e in extents(lab).items():
            ext.setdefault(key, []).append((os.path.basename(f), e))
    m = args.margin
    L = max(e[0] for v in ext.values() for _, e in v); R = max(e[1] for v in ext.values() for _, e in v)
    U = max(e[2] for v in ext.values() for _, e in v); D = max(e[3] for v in ext.values() for _, e in v)
    if args.cell:
        cell = tuple(int(x) for x in args.cell.split('x')); pivot = tuple(int(x) for x in args.pivot.split(','))
    else:
        cw = int(np.ceil((L + R + 1 + 2 * m) / 16) * 16); chh = int(np.ceil((U + D + 1 + 2 * m) / 16) * 16)
        cell = (cw, chh); pivot = (int(L + m + (cw - (L + R + 1 + 2 * m)) // 2), int(chh - D - m - 1))
    print('피벗 기준 가장 먼 픽셀: 왼 %d 오른 %d 위 %d 아래 %d → 칸 %dx%d, 피벗 %s' % (L, R, U, D, cell[0], cell[1], pivot))
    os.makedirs(args.out, exist_ok=True)
    rep = {}
    for f, (a, lab) in data.items():
        out, clipped = repack(a, lab, cell, pivot)
        name = os.path.basename(f)
        Image.fromarray(out, 'RGBA').save(os.path.join(args.out, name), optimize=True)
        rep[name] = {'clipped': clipped}
        print(name.ljust(28), '잘림', clipped, 'px')
    if args.report:
        json.dump({'cell': cell, 'pivot': pivot, 'files': rep}, open(args.report, 'w'), ensure_ascii=False, indent=1)


def check(d):
    bad = 0
    for f in sorted(glob.glob(os.path.join(d, '*.png'))):
        a = np.array(Image.open(f).convert('RGBA'))[:, :, 3]
        H, W = a.shape; cw, ch = W // 6, H // 4
        lab, n = ndimage.label(a > DUST, structure=np.ones((3, 3)))
        cells = set()
        for i, sl in enumerate(ndimage.find_objects(lab), 1):
            ys, xs = np.nonzero(lab[sl] == i)
            ys = ys + sl[0].start; xs = xs + sl[1].start
            cs = set(zip((ys // ch).tolist(), (xs // cw).tolist()))
            if len(cs) > 1:
                bad += 1; print(os.path.basename(f), '칸을 넘는 덩어리', sorted(cs))
        for r in range(4):
            for c in range(6):
                sub = a[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw]
                if (r, c) not in USED and sub.max() > DUST:
                    bad += 1; print(os.path.basename(f), '안 쓰는 칸에 그림', r, c)
                if (r, c) in USED and max(sub[0].max(), sub[-1].max(), sub[:, 0].max(), sub[:, -1].max()) > DUST:
                    bad += 1; print(os.path.basename(f), '가장자리에 닿음', r, c)
    print('점검 끝, 문제', bad)
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main() or 0)
