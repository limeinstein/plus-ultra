#!/usr/bin/env python3
"""같은 플레이어 외형으로 생성한 6×3 대기 원화를 6×6 게임 시트로 포장한다.

각 동작 6개 키포즈의 사이를 RIFE로 한 칸씩 잇는다. 잔상·잘림이 생긴
중간 칸은 원본 자세를 유지한다. 걷기 원본은 바꾸지 않는다.
"""
from __future__ import annotations
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
from pathlib import Path
import shutil
import sys
import cv2
import numpy as np
from PIL import Image
from player_motion_runtime import figures
from update_player_walk_loops import ROOT, box, cells, digest, read_config, trim_alpha

COUNT, COLS, ROWS, CELL_H, FOOT = 12, 6, 6, 420, 414
MOTIONS = ('look', 'greet', 'stretch')


def extract(raw):
    frames, rows = figures(raw)
    if rows == [6, 6, 6] and len(frames) == 18:
        return frames, rows
    # 넓게 뻗은 손이 몸에서 떨어져 별도 인물로 잡히는 시트는 정해진
    # 6×3 칸 안에서 몸과 같은 칸의 손을 함께 묶는다. 옆줄 발끝은 제외한다.
    a = np.asarray(raw.convert('RGBA'))
    if np.mean(a[:, :, 3] == 0) < .01:
        raise ValueError('투명 배경이 없는 원화: ImageGen에서 배경 제거가 필요합니다')
    result = []
    for row in range(3):
        for col in range(6):
            x0, x1 = round(col*raw.width/6), round((col+1)*raw.width/6)
            y0, y1 = max(0, round(row*raw.height/3)-18), min(raw.height, round((row+1)*raw.height/3)+18)
            px = a[y0:y1, x0:x1].copy()
            n, labels, stats, _ = cv2.connectedComponentsWithStats((px[:, :, 3]>128).astype(np.uint8), 8)
            if n < 2: raise ValueError(f'{row}/{col}: 인물이 없는 칸')
            largest = float(stats[1:, cv2.CC_STAT_AREA].max())
            keep = [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] >= largest*.05]
            mask = cv2.dilate(np.isin(labels, keep).astype(np.uint8), np.ones((5,5), np.uint8)).astype(bool)
            px[:, :, 3] = np.where(mask, px[:, :, 3], 0)
            frame = Image.fromarray(px)
            result.append(frame.crop(frame.getchannel('A').getbbox()))
    return result, [6, 6, 6]


def foot_centre(frame):
    a = np.asarray(frame)[:, :, 3] > 64
    y, x = np.nonzero(a)
    feet = np.nonzero(a[max(y.min(), y.max()-12):])[1]
    return float(np.median(feet)) if len(feet) else float(np.median(x))


def place(frame, width):
    frame = trim_alpha(frame)
    bb = box(frame)
    out = Image.new('RGBA', (width, CELL_H))
    out.alpha_composite(frame, (round(width/2-foot_centre(frame)), FOOT+1-bb[3]))
    return out


def pack(look, args):
    from sprite_gen.video.rife import Rife, model_bytes
    from sprite_gen.video.align import measure_made
    from sprite_gen.video.interpolation_quality import faults, ghost_screen
    source = args.input/f'{look}-generated.png'
    dest = args.output/look
    dest.mkdir(parents=True, exist_ok=True)
    raw, rows = extract(Image.open(source))
    if rows != [6, 6, 6] or len(raw) != 18:
        raise ValueError(f'{look}: 6×3 원화 분리 실패: {rows}')
    walkpath = ROOT/'images/characters'/look/'motion/walk.webp'
    walking = cells(walkpath)
    height = int(np.median([box(f)[3]-box(f)[1] for f in walking]))
    keys = []
    for row in range(3):
        scale = height/(box(raw[row*6])[3]-box(raw[row*6])[1])
        keys.extend([trim_alpha(f.resize((max(1,round(f.width*scale)), max(1,round(f.height*scale))), Image.Resampling.LANCZOS)) for f in raw[row*6:row*6+6]])
    half = max(max(foot_centre(f), f.width-foot_centre(f)) for f in keys)
    width = max(260, int(np.ceil(half))*2+24)
    keys = [place(f, width) for f in keys]
    for i, f in enumerate(keys):
        bb = box(f)
        if bb[0] < 3 or bb[1] < 3 or bb[2] >= width-3 or bb[3] >= CELL_H-3:
            raise ValueError(f'{look}: {i}번 원화의 여백 부족 {bb}')
        key_path = dest/f'key-{i:02d}.png'
        if key_path.exists():
            with Image.open(key_path) as previous:
                if previous.size != f.size or previous.convert('RGBA').tobytes() != f.tobytes():
                    raise ValueError(f'{look}: 키포즈가 바뀌었습니다. 새 --output 경로를 사용하세요')
        f.save(key_path)
    model_bytes(args.rife_model)
    interpolate = Rife(args.rife_binary.resolve(), args.rife_model.resolve())
    output, rejected = [], []
    for row, motion in enumerate(MOTIONS):
        group = keys[row*6:row*6+6]
        for k, a in enumerate(group):
            b = group[(k+1)%6]
            output.append(a)
            cached = dest/f'between-{row}-{k}.png'
            if cached.exists():
                made = Image.open(cached).convert('RGBA')
            else:
                made = interpolate(a, b, .5)
                made.save(cached)
            reasons = faults(measure_made(made, a, b, .5, reads=True))
            made = place(made, width)
            bb = box(made)
            if bb[0] < 3 or bb[1] < 3 or bb[2] >= width-3: reasons.append('가장자리')
            if ghost_screen([a, made, b]).get('ghosts'): reasons.append('잔상')
            if reasons:
                rejected.append({'motion': motion, 'after_key': k, 'reasons': reasons})
                made = a.copy()
            output.append(made)
        print(f'{look}: {motion} 12칸 완료', flush=True)
    atlas = Image.new('RGBA', (width*COLS, CELL_H*ROWS))
    contact = Image.new('RGB', atlas.size, '#dedbd4')
    for i, f in enumerate(output):
        xy = (i%COLS*width, i//COLS*CELL_H)
        atlas.alpha_composite(f, xy)
        contact.paste(f, xy, f)
    atlas.save(dest/'idle.webp', 'WEBP', lossless=True, method=6, exact=True)
    contact.thumbnail((1560, 1680))
    contact.save(dest/'contact.jpg', quality=90)
    report = {'look': look, 'source': str(source), 'source_sha256': digest(source),
              'walk_sha256': digest(walkpath), 'rows': rows, 'standing_height': height,
              'cell': [width, CELL_H], 'cols': COLS, 'atlas_rows': ROWS, 'foot': FOOT,
              'motions': list(MOTIONS), 'frames_per_motion': COUNT,
              'rejected': rejected, 'output_sha256': digest(dest/'idle.webp'),
              'boxes': [box(f) for f in output]}
    (dest/'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8', newline='\n')
    if args.apply:
        shutil.copy2(dest/'idle.webp', ROOT/'images/characters'/look/'motion/idle.webp')
    print(f'{look}: 3동작 적용 {args.apply}, 중간 칸 대체 {len(rejected)}', flush=True)
    return report


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--input', type=Path, required=True)
    ap.add_argument('--output', type=Path, required=True)
    ap.add_argument('--sprite-gen', type=Path, required=True)
    ap.add_argument('--rife-binary', type=Path, required=True)
    ap.add_argument('--rife-model', type=Path, required=True)
    ap.add_argument('--looks', nargs='*')
    ap.add_argument('--jobs', type=int, default=2)
    ap.add_argument('--apply', action='store_true')
    args = ap.parse_args()
    sys.path.insert(0, str(args.sprite_gen.resolve()))
    args.output.mkdir(parents=True, exist_ok=True)
    looks = args.looks or list(read_config(ROOT/'js/data/heromotion.js'))
    reports, errors = [], []
    with ThreadPoolExecutor(max_workers=args.jobs) as pool:
        pending = {pool.submit(pack, look, args): look for look in looks}
        for future in as_completed(pending):
            try:
                reports.append(future.result())
            except Exception as exc:
                errors.append({'look': pending[future], 'error': str(exc)})
                print(f'{pending[future]}: 실패 {exc}', file=sys.stderr, flush=True)
    (args.output/'report-selected.json').write_text(json.dumps(reports, ensure_ascii=False, indent=2), encoding='utf-8', newline='\n')
    if errors:
        (args.output/'errors-selected.json').write_text(json.dumps(errors, ensure_ascii=False, indent=2), encoding='utf-8', newline='\n')
        raise SystemExit(1)


if __name__ == '__main__':
    main()
