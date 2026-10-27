#!/usr/bin/env python3
"""sprite-gen의 아핀 합성으로 일기토 크기와 피격 마지막 자세를 고친다.

원본은 --out/source에 한 번 보관한다. 재실행해도 이 원본에서 만들며,
--apply가 없으면 후보와 sprite-gen 동작 측정만 내보낸다.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import shutil
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from skimage.segmentation import watershed

ROOT = Path(__file__).resolve().parents[1]
CELL = (432, 304)
PIVOT = (165, 278)
COUNTS = (6, 4, 3, 6)
HIT_MS = (70, 110, 300)
BIG = {'athos': 232, 'aramis': 232}


def bbox(image):
    return image.getchannel('A').point(lambda a: 255 if a > 4 else 0).getbbox()


def split_large(sheet):
    """옆 칸의 칼끝·아래 칸의 장화를 몸통에서 가까운 장면으로 돌려준다.

    고정 칸으로 먼저 자르면 이미 넘어온 장화를 잃는다. duel_repack과 같은
    몸통 씨앗·측지 거리 분할을 원본 전체에 적용한다.
    """
    a = np.array(sheet)
    mask = a[:, :, 3] > 4
    core = ndimage.binary_erosion(a[:, :, 3] > 100, iterations=4)
    labels, _ = ndimage.label(core, structure=np.ones((3, 3)))
    markers = np.zeros(mask.shape, np.int32)
    positions = [(r, c) for r, count in enumerate(COUNTS) for c in range(count)]
    for k, (r, c) in enumerate(positions, 1):
        sl = (slice(r*304, (r+1)*304), slice(c*432, (c+1)*432))
        region = labels[sl]
        ids, counts = np.unique(region[region > 0], return_counts=True)
        best = ids[np.argmax(counts)]
        markers[sl][region == best] = k
    owners = watershed(np.zeros(mask.shape, np.uint8), markers, mask=mask, connectivity=2)
    missing, _ = ndimage.label(mask & (owners == 0), structure=np.ones((3, 3)))
    distance, near = ndimage.distance_transform_edt(owners == 0, return_indices=True)
    for k, sl in enumerate(ndimage.find_objects(missing), 1):
        part = missing[sl] == k
        local = np.unravel_index(np.argmin(np.where(part, distance[sl], np.inf)), part.shape)
        y, x = local[0]+sl[0].start, local[1]+sl[1].start
        owners[sl][part] = owners[near[0, y, x], near[1, y, x]]
    result = {}
    # 넉넉한 작업 칸 안에서 합성한 뒤 마지막에만 표준 칸으로 옮긴다.
    for k, (r, c) in enumerate(positions, 1):
        y, x = np.where(owners == k)
        frame = np.zeros((608, 864, 4), np.uint8)
        nx, ny = x-c*432+216, y-r*304+152
        if not ((nx >= 0) & (nx < 864) & (ny >= 0) & (ny < 608)).all():
            raise ValueError(f'{r},{c}: 작업 칸 밖 그림')
        frame[ny, nx] = a[y, x]
        result[r, c] = Image.fromarray(frame)
    return result


def normalize_large(sheet, target, transform):
    frames = split_large(sheet)
    idle = frames[3, 0]
    b = bbox(idle)
    scale = target / (b[3]-b[1])
    # 각 행의 공통 발밑을 맞춘다. 공격 중 전진·몸 기울기는 그대로 둔다.
    grounds = {r: float(np.median([bbox(frames[r, c])[3] for c in range(n)]))
               for r, n in enumerate(COUNTS)}
    feet = np.array(idle)[:, :, 3] > 40
    _, xs = np.where(feet[max(0, b[3]-18):b[3]])
    anchor_x = float((xs.min()+xs.max())/2)
    # 가장 긴 칼끝까지 같은 배율로 보존한다. 장면마다 따로 줄이면
    # 찌르기에서 사람 크기가 달라지므로 전체 동작의 여백을 함께 잰다.
    for frame in frames.values():
        bounds = bbox(frame)
        scale = min(scale, (PIVOT[0]-9)/max(1, anchor_x-bounds[0]),
                    (CELL[0]-9-PIVOT[0])/max(1, bounds[2]-anchor_x))
    out = Image.new('RGBA', sheet.size)
    for (r, c), frame in frames.items():
        t = {'scale': scale, 'dx': PIVOT[0]-216-scale*(anchor_x-432),
             'dy': PIVOT[1]-152-scale*(grounds[r]-304)}
        fixed = transform(frame, t, CELL)
        out.paste(fixed, (c*432, r*304))
    return out, scale


def fallen(frame, standing_height, transform):
    # 실제로 누운 원화를 등신에 맞춘다. 높이에 맞춰 키우면 가로로 누운
    # 사람이 거인이 되므로 머리~발끝 길이를 대기 자세 키의 1.2배로 맞춘다.
    b = bbox(frame)
    scale = standing_height * 1.2 / (b[2]-b[0])
    return transform(frame, {'scale': scale,
                            'dx': PIVOT[0]-216-scale*((b[0]+b[2])/2-216),
                            'dy': PIVOT[1]-152-scale*(b[3]-152)}, CELL)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--sprite-gen', type=Path, required=True)
    ap.add_argument('--out', type=Path, required=True)
    ap.add_argument('--fallen-dir', type=Path, required=True,
                    help='sprite-gen slice-sheet로 추출한 인물별 착지 PNG 폴더')
    ap.add_argument('--apply', action='store_true')
    args = ap.parse_args()
    sys.path.insert(0, str(args.sprite_gen.resolve()))
    from sprite_gen.curate.curation import apply_transform
    from sprite_gen.spec.assets import load_asset
    from sprite_gen.qa.motion import analyze_motion

    source = args.out/'source'
    candidate = args.out/'fighters'
    source.mkdir(parents=True, exist_ok=True)
    candidate.mkdir(parents=True, exist_ok=True)
    report = {'tool': 'sprite-gen 3.5.0', 'cell': CELL, 'pivot': PIVOT,
              'hit_ms': HIT_MS, 'files': {}}
    boards = []
    for path in sorted((ROOT/'images/duel/fighters').glob('*.png')):
        backup = source/path.name
        if not backup.exists():
            shutil.copy2(path, backup)
        original = Image.open(backup).convert('RGBA')
        sheet = original.copy()
        scale = 1
        if path.stem in BIG:
            sheet, scale = normalize_large(sheet, BIG[path.stem], apply_transform)
        idle_box = bbox(sheet.crop((0, 912, 432, 1216)))
        fall_source = args.fallen_dir/path.name
        last = fallen(Image.open(fall_source).convert('RGBA'), idle_box[3]-idle_box[1], apply_transform)
        sheet.paste(last, (864, 608))
        # 이미 경계가 깨진 원본 두 장을 포함해 모든 사용 칸에 투명 테두리 보장.
        for r, n in enumerate(COUNTS):
            for c in range(n):
                fr = sheet.crop((c*432, r*304, (c+1)*432, (r+1)*304))
                b = bbox(fr)
                if b and (b[0] < 1 or b[1] < 1 or b[2] > 431 or b[3] > 303):
                    raise ValueError(f'{path.stem} {r},{c}: 여백 부족 {b}')
        sheet.save(candidate/path.name, optimize=True)
        frames_dir = args.out/path.stem/'hit'
        frames_dir.mkdir(parents=True, exist_ok=True)
        entries = []
        for c, ms in enumerate(HIT_MS):
            fr = sheet.crop((c*432, 608, (c+1)*432, 912))
            fr.save(frames_dir/f'{c}.png')
            entries.append({'file': f'hit/{c}.png', 'duration': ms/1000})
        descriptor = args.out/path.stem/'hit.asset.json'
        descriptor.write_text(json.dumps({'kind': 'sprite-gen-asset', 'version': 1,
                                         'anchor': PIVOT, 'frames': entries}), encoding='utf-8')
        motion = analyze_motion(load_asset(descriptor))
        (descriptor.parent/'hit.motion.json').write_text(json.dumps(motion, indent=2), encoding='utf-8')
        last_box = bbox(last)
        if abs(last_box[3] - PIVOT[1]) > 1:
            raise ValueError(f'{path.stem}: 착지 자세 이상 {last_box}')
        report['files'][path.stem] = {'source_sha256': hashlib.sha256(backup.read_bytes()).hexdigest(),
                                    'fallen_source_sha256': hashlib.sha256(fall_source.read_bytes()).hexdigest(),
                                    'scale': scale, 'fallen_bbox': last_box,
                                    'edge_contact': motion['edge_contact']}
        boards.append((path.stem, [sheet.crop((c*432, 608, (c+1)*432, 912)) for c in range(3)]))
    board = Image.new('RGB', (648*4, 180*((len(boards)+3)//4)), '#333333')
    d = ImageDraw.Draw(board)
    for i, (name, frames) in enumerate(boards):
        x, y = i%4*648, i//4*180
        d.text((x+8, y+3), name, fill='white')
        for c, fr in enumerate(frames):
            fr = fr.resize((216, 152))
            board.paste(fr, (x+c*216, y+24), fr)
            d.line((x+c*216, y+24+139, x+(c+1)*216, y+24+139), fill='#777777')
    board.save(args.out/'hit-review.jpg', quality=92)
    (args.out/'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    if args.apply:
        for path in candidate.glob('*.png'):
            shutil.copy2(path, ROOT/'images/duel/fighters'/path.name)
    print(json.dumps({'fighters': len(boards), 'applied': args.apply, 'out': str(args.out)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
