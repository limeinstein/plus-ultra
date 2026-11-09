"""전투원별 원화를 발밑 기준 432×304 칸에 맞춘다.

원본 폴더에 <id>_atk.png와 <id>_react.png를 둔다. 새 공주는 _base.png와 _cutin.png도 쓴다.
이미 완성된 파일은 건너뛴다. 원화를 수정한 경우 다시 만들 결과 파일만 지우고 실행한다.
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from scipy.optimize import linear_sum_assignment
from skimage.segmentation import watershed

from duel_cutins import frame, save_gif

ROOT = Path(__file__).resolve().parents[1]
DUEL = ROOT / 'images/duel'
CW, CH, PX, FLOOR = 432, 304, 165, 278
PRINCESSES = ('cinderella', 'snow_white', 'sleeping_beauty', 'little_mermaid', 'elizaveta', 'scheherazade')


def separate(path, rows, cols):
    """칸마다 몸통을 찾아 이어진 칼끝까지 한 자세로 묶는다."""
    rgba = np.array(Image.open(path).convert('RGBA'))
    alpha = rgba[:, :, 3]
    height, width = alpha.shape
    solid = alpha > 75
    if solid.mean() > 0.78:
        raise ValueError(f'{path.stem}: missing transparent background')
    core = ndi.binary_erosion(solid, iterations=3)
    labels, n = ndi.label(core, structure=np.ones((3, 3)))
    areas = np.bincount(labels.ravel(), minlength=n + 1)
    candidates = np.flatnonzero(areas > max(50, height * width / (cols * rows) * 0.008))
    candidates = candidates[candidates != 0]
    if len(candidates) < rows * cols:
        raise ValueError(f'{path.stem}: only {len(candidates)} body markers')
    centers = np.array(ndi.center_of_mass(core, labels, candidates))
    positions = centers / [height / rows, width / cols]
    cells = np.indices((rows, cols)).reshape(2, -1).T + 0.5
    # 칸 중심까지의 거리와 덩어리 면적으로 몸통을 모자·방패와 구별한다.
    delta = cells[:, None, :] - positions
    cost = (delta ** 2).sum(axis=2) - 0.13 * np.log(areas[candidates])
    _, assignment = linear_sum_assignment(cost)
    chosen = candidates[assignment]
    offsets = np.abs(delta[np.arange(len(cells)), assignment])
    if offsets.max() > 0.76:
        raise ValueError(f'{path.stem}: misplaced body markers {offsets.max():.2f}')
    lookup = np.zeros(n + 1, np.int32)
    lookup[chosen] = np.arange(1, len(chosen) + 1)
    # 인물에 붙은 반투명 가장자리만 살리고 투명 배경에 남은 먼지는 걷어낸다.
    mask = (alpha > 8) & ndi.binary_dilation(solid, iterations=2)
    parts = watershed(np.zeros_like(alpha), lookup[labels], mask=mask, connectivity=2)
    loose, _ = ndi.label(mask & (parts == 0), structure=np.ones((3, 3)))
    if loose.max():
        distance, indices = ndi.distance_transform_edt(parts == 0, return_indices=True)
        for k, sl in enumerate(ndi.find_objects(loose), 1):
            island = loose[sl] == k
            if island.sum() < 4:
                continue
            j, i = np.unravel_index(np.where(island, distance[sl], np.inf).argmin(), island.shape)
            y, x = j + sl[0].start, i + sl[1].start
            if distance[y, x] < min(width / cols, height / rows) * 0.23:
                parts[sl][island] = parts[indices[0, y, x], indices[1, y, x]]
    poses = []
    for k, sl in enumerate(ndi.find_objects(parts), 1):
        pixels = rgba[sl].copy()
        pixels[parts[sl] != k] = 0
        poses.append(Image.fromarray(pixels))
    return poses


def feet(pose):
    a = np.asarray(pose.getchannel('A'))
    yy, xx = np.where(a > 75)
    floor = yy.max() + 1
    sole = xx[yy >= floor - max(4, int(pose.height * 0.055))]
    return (sole.min() + sole.max()) * 0.5, floor


def base_reference(fid):
    with Image.open(DUEL / 'fighters' / (fid + '.png')) as base:
        idle = base.crop((0, CH * 3, CW, CH * 4))
    box = idle.getchannel('A').point(lambda a: 255 if a > 75 else 0).getbbox()
    anchor, floor = feet(idle)
    return box[3] - box[1], anchor, floor


def fit(poses, neutral, height, floor):
    return min(height / poses[neutral].height, (floor - 7) / max(p.height for p in poses),
               (CW - 14) / max(p.width for p in poses))


def place(atlas, r, c, pose, scale, anchor, floor, prone=False):
    tile = pose.resize(tuple(max(1, round(v * scale)) for v in pose.size), Image.Resampling.LANCZOS)
    # 발바닥의 마지막 픽셀이 게임의 바닥에 닿게 한다.
    box = tile.getchannel('A').point(lambda a: 255 if a > 4 else 0).getbbox()
    tile = tile.crop(box)
    center = tile.width / 2 if prone else feet(tile)[0]
    x = max(4, min(CW - tile.width - 4, round(anchor - center)))
    y = round(floor) - tile.height
    if y < 2 or y + tile.height >= CH - 1 or x + tile.width >= CW - 1:
        raise ValueError(f'pose {r},{c} has no margin')
    atlas.paste(tile, (c * CW + x, r * CH + y))


def build_base(raw, fid, attacks, reacts):
    poses = separate(raw / (fid + '_base.png'), 2, 3)
    neutral, guard, command, stagger, kneel, fallen = poses
    if fallen.width <= 2.5 * fallen.height:
        raise ValueError(f'{fid}: final pose is not lying flat')
    scale = fit(poses, 0, 215, FLOOR)
    atlas = Image.new('RGBA', (CW * 6, CH * 4))
    attack_scale = fit(attacks, 5, 215, FLOOR)
    react_scale = fit(reacts, 5, 215, FLOOR)
    rows = [
        [(p, attack_scale) for p in attacks[:6]],
        [(guard, scale), (reacts[12], react_scale), (reacts[13], react_scale), (guard, scale)],
        [(stagger, scale), (kneel, scale), (fallen, scale)],
        [(neutral, scale), (attacks[1], attack_scale), (guard, scale),
         (attacks[4], attack_scale), (command, scale), (neutral, scale)],
    ]
    for row, cells in enumerate(rows):
        for col, (pose, size) in enumerate(cells):
            place(atlas, row, col, pose, size, PX, FLOOR, row == 2 and col == 2)
    atlas.save(DUEL / 'fighters' / (fid + '.png'))


def build(raw, fid):
    new = fid in PRINCESSES
    kinds = ('atk', 'react')
    if new and (raw / (fid + '_cutin.png')).is_file():
        target = DUEL / 'cutins' / (fid + '.gif')
        if not target.exists():
            with Image.open(raw / (fid + '_cutin.png')) as painting:
                rgb = painting.convert('RGB')
            frames = [frame(rgb, fid, i).quantize(colors=128, method=Image.Quantize.MEDIANCUT) for i in range(5)]
            save_gif(target, frames)
    base = DUEL / 'fighters' / (fid + '.png')
    paths = {k: raw / (fid + '_' + k + '.png') for k in kinds}
    if not base.exists() and (not new or not all(p.exists() for p in [*paths.values(), raw / (fid + '_base.png')])):
        return
    layers = {k: separate(p, 4, 6) for k, p in paths.items() if p.exists() and
              (not base.exists() or not (DUEL / 'fighters_ext' / p.name).exists())}
    if not base.exists():
        build_base(raw, fid, layers['atk'], layers['react'])
    height, anchor, floor = base_reference(fid)
    for k, poses in layers.items():
        scale = fit(poses, 5, height, floor)
        atlas = Image.new('RGBA', (CW * 6, CH * 4))
        for i, pose in enumerate(poses):
            place(atlas, i // 6, i % 6, pose, scale, anchor, floor)
        atlas.save(DUEL / 'fighters_ext' / paths[k].name)
        print(f'{fid}_{k}', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('raw', type=Path)
    parser.add_argument('ids', nargs='*')
    args = parser.parse_args()
    ids = args.ids or sorted({p.stem.rsplit('_', 1)[0] for p in args.raw.glob('*.png')})
    errors = []
    for fighter in ids:
        try:
            build(args.raw, fighter)
        except (ValueError, OSError) as exc:
            errors.append(str(exc))
    if errors:
        raise SystemExit('\n'.join(errors))
