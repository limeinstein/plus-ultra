#!/usr/bin/env python3
"""ImageGen의 4×4 제독 보행 원화를 두 동작의 키포즈로 분리한다.

그림 자체는 새로 그리지 않는다. 인물 연결 성분을 추출하고 기존 시트와
같은 키·발밑·상체 중심으로 포장한다. 보간은 update_player_walk_loops.py.
"""
from pathlib import Path
import argparse
import json
import shutil
import sys
import numpy as np
from PIL import Image
from player_motion_runtime import figures, anchor
from update_player_walk_loops import ROOT, cells, box, read_config, save_sheet, metrics, digest


def finish(dest, sprite_gen, apply):
    sys.path.insert(0, str(sprite_gen.resolve()))
    from match_player_motion_faces import lock_faces, record_lock
    walking, running = (cells(dest/m/'admiral'/f'{m}.webp') for m in ('walk', 'run'))
    # 새 그림의 팔다리만 쓰며, 기존 걷기 첫 칸의 얼굴 픽셀을 두 동작 모두에 고정한다.
    old = cells(dest/'original-walk.webp')[0]
    walking, walk_faces = lock_faces('admiral', old, walking)
    # 발이 교차한 보행 칸은 한 발로 선 자세라 대기로 쓰지 않는다.
    # 기존 양발 대기 한 칸 + 순환 보행 48칸을 한 시트에 담는다.
    standing = Image.new('RGBA', walking[0].size)
    standing.alpha_composite(old, ((standing.width-old.width)//2, 0))
    walking = [standing]+[walking[round(i*49/48)] for i in range(48)]
    idle = 0
    running, run_faces = lock_faces('admiral', walking[idle], running)
    final = dest/'final'
    final.mkdir(exist_ok=True)
    for motion, frames in (('walk', walking), ('run', running)):
        save_sheet(frames, final/f'{motion}.webp')
    report = {'idle': idle, 'walk': metrics(walking), 'run': metrics(running),
              'original_walk_sha256': digest(dest/'original-walk.webp'),
              'original_run_sha256': digest(dest/'original-run.webp'),
              'walk_faces': walk_faces, 'run_faces': run_faces,
              'source': str(dest/'admiral-generated.png')}
    (dest/'final-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    if apply:
        base = ROOT/'images/characters/admiral/motion'
        for motion in ('walk', 'run'):
            shutil.copy2(final/f'{motion}.webp', base/f'{motion}.webp')
        config_path = ROOT/'js/data/heromotion.js'
        config = read_config(config_path)
        config['admiral'].update({'idle': idle, 'walkStart': 1, 'walkCycles': 1, 'runCycles': 1})
        config_path.write_text('/* 주인공 보행 시트: Cycles는 두 걸음 주기 수, Start는 출발 대기 제외 칸 수. */\nwindow.G = window.G || {};\nG.HERO_MOTION = '+json.dumps(config, ensure_ascii=False, separators=(',', ':'))+';\n', encoding='utf-8', newline='\n')
        record_lock('admiral', idle, run_faces, base/'walk.webp', base/'run.webp')
    print(f'제독 얼굴 고정·시트 포장 완료, 대기 칸 {idle}, 적용 {apply}')


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('source', type=Path)
    ap.add_argument('--output', type=Path, required=True)
    ap.add_argument('--finish', action='store_true', help='보간 후보의 얼굴을 고정하고 최종 시트를 만든다')
    ap.add_argument('--sprite-gen', type=Path)
    ap.add_argument('--apply', action='store_true')
    args = ap.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    if args.finish:
        if not args.sprite_gen: ap.error('--finish에는 --sprite-gen이 필요합니다')
        finish(args.output, args.sprite_gen, args.apply)
        return
    base = ROOT/'images/characters/admiral/motion'
    for motion in ('walk', 'run'):
        backup = args.output/f'original-{motion}.webp'
        if not backup.exists():
            shutil.copy2(base/f'{motion}.webp', backup)
    frames, rows = figures(Image.open(args.source))
    if rows != [4, 4, 4, 4] or len(frames) != 16:
        raise ValueError(f'4×4 키포즈 시트가 아닙니다: {rows}')
    height = int(np.median([box(f)[3]-box(f)[1] for f in cells(args.output/'original-walk.webp')]))
    for motion, group in (('walk', frames[:8]), ('run', frames[8:])):
        dest = args.output/'keys'/motion/'admiral'
        dest.mkdir(parents=True, exist_ok=True)
        scaled = [f.resize((round(f.width*height/f.height), height), Image.Resampling.LANCZOS) for f in group]
        half = max(max(anchor(f), f.width-anchor(f)) for f in scaled)
        width = int(np.ceil(half)*2)+24
        for i, f in enumerate(scaled):
            canvas = Image.new('RGBA', (width, 300))
            canvas.alpha_composite(f, (round(width/2-anchor(f)), 295-f.height))
            canvas.save(dest/f'key-{i:02d}.png')
    print(f'제독 걷기 8칸·달리기 8칸 추출: 키 {height}px, 발밑 294px')


if __name__ == '__main__':
    main()
