#!/usr/bin/env python3
"""sprite-gen으로 주인공 걷기·달리기를 같은 크기의 연속 49칸으로 만든다.

원본을 보관하고 후보만 만든 뒤 --apply로 적용한다. sprite-gen은 제작할 때만
필요하며 게임에는 설치하지 않는다. --sprite-gen에 압축을 푼 도구 경로,
--rife-binary와 --rife-model에 검증된 RIFE 경로를 지정한다.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import shutil
import sys
import time

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ALPHA = 40
CELL_H, FOOT, COUNT = 300, 294, 49


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_config(path):
    return json.loads(path.read_text(encoding='utf-8').split('G.HERO_MOTION = ')[1].split(';')[0])


def trim_alpha(frame):
    frame = frame.convert('RGBA').copy()
    frame.putalpha(frame.getchannel('A').point(lambda a: 0 if a <= 8 else a))
    return frame


def box(frame):
    result = frame.getchannel('A').point(lambda a: 255 if a > ALPHA else 0).getbbox()
    if result is None:
        raise ValueError('빈 동작 프레임')
    return result


def cells(path):
    with Image.open(path) as raw:
        sheet = raw.convert('RGBA')
    w, h = sheet.width // 7, sheet.height // 7
    return [sheet.crop((i % 7*w, i // 7*h, (i % 7+1)*w, (i // 7+1)*h)) for i in range(COUNT)]


def visible_hash(frame):
    a = np.asarray(frame).astype(np.uint16)
    # 투명 영역의 숨은 RGB 차이는 별도 자세로 세지 않는다.
    return hashlib.sha256(np.dstack((a[:, :, :3] * a[:, :, 3:], a[:, :, 3])).tobytes()).hexdigest()


def unique_poses(frames):
    output, seen = [], set()
    for index, frame in enumerate(frames):
        key = visible_hash(frame)
        if key not in seen:
            output.append((index, frame))
            seen.add(key)
    return output


def normalize(frame, target, resize_cell):
    frame = trim_alpha(frame)
    bb = box(frame)
    # 안티앨리어싱 가장자리를 자르지 않도록 실제 알파 영역 전체를 보존한다.
    crop = frame.crop(frame.getchannel('A').getbbox())
    factor = target / (bb[3] - bb[1])
    return trim_alpha(resize_cell(crop, (max(1, round(crop.width*factor)), max(1, round(crop.height*factor)))))


def fit_canvas(frame, target, resize_cell):
    """같은 배율로 확대하되 알파 경계의 반올림까지 확인해 목표 키를 맞춘다."""
    bb = box(frame)
    h0 = round(frame.height*target/(bb[3]-bb[1]))
    best, error = None, float('inf')
    for delta in (0,-1,1,-2,2,-3,3):
        h = max(1,h0+delta)
        candidate = resize_cell(frame,(max(1,round(frame.width*h/frame.height)),h))
        cb = box(candidate)
        diff = abs(cb[3]-cb[1]-target)
        if diff < error:
            best, error = candidate, diff
        if error == 0:
            break
    return best


def metrics(frames):
    boxes = [box(f) for f in frames]
    arrays = [np.asarray(f).astype(float)/255 for f in frames]
    visual = [np.dstack((a[:, :, :3]*a[:, :, 3:], a[:, :, 3])) for a in arrays]
    deltas = []
    for i, a in enumerate(visual):
        b = visual[(i+1) % len(visual)]
        mask = (a[:, :, 3] > 0) | (b[:, :, 3] > 0)
        deltas.append(float(np.abs(a-b)[mask].mean()))
    heights = [b[3]-b[1] for b in boxes]
    return {'frames': len(frames), 'visible_unique': len(set(visible_hash(f) for f in frames)),
        'height_min': min(heights), 'height_max': max(heights),
        'foot_min': min(b[3]-1 for b in boxes), 'foot_max': max(b[3]-1 for b in boxes),
        'edge_frames': [i for i, (f, b) in enumerate(zip(frames, boxes)) if b[0] <= 1 or b[1] <= 1 or b[2] >= f.width-1 or b[3] >= f.height-1],
        'delta_cv': float(np.std(deltas)/np.mean(deltas)),
        'seam_delta': deltas[-1], 'max_delta': max(deltas), 'mean_delta': float(np.mean(deltas)),
        'deltas': deltas}


def save_sheet(frames, target):
    w, h = frames[0].size
    sheet = Image.new('RGBA', (w*7, h*7))
    for i, frame in enumerate(frames):
        sheet.alpha_composite(frame, (i % 7*w, i // 7*h))
    sheet.save(target, 'WEBP', lossless=True, method=6, exact=True)
    sheet.save(target.with_suffix('.png'))


def contact(frames, target):
    w, h = frames[0].size
    im = Image.new('RGB', (w*7, (h+20)*7), '#d6d3cc')
    d = ImageDraw.Draw(im)
    for i, f in enumerate(frames):
        x, y = i % 7*w, i // 7*(h+20)
        im.paste(f, (x, y), f)
        d.text((x+4, y+h+3), str(i+1), fill='#111111')
    im.save(target)


def build(look, cfg, args, engine):
    resize_cell, register, place, analyze, FrameSequence, interpolate = engine
    from sprite_gen.video.align import measure_made
    from sprite_gen.video.interpolation_quality import faults, looks, ghost_screen
    dest = args.output / look
    dest.mkdir(parents=True, exist_ok=True)
    motion = args.motion
    source = ROOT / 'images/characters' / look / 'motion' / f'{motion}.webp'
    backup = dest / f'original-{motion}.webp'
    if not backup.exists():
        shutil.copy2(source, backup)
    old = cells(backup)
    legacy = motion == 'walk' and 'walk' in cfg.get('skip', [])
    files = [backup]
    supplied = sorted((args.source_dir/look).glob('key-*.png')) if args.source_dir else []
    if supplied:
        files = supplied
        source_poses = []
        for path in files:
            with Image.open(path) as im:
                source_poses.append(im.convert('RGBA'))
        original_indices = list(range(len(source_poses)))
    elif motion == 'run' and motion in cfg.get('skip', []) and look not in args.allow_excluded_looks:
        raise ValueError(f'{look}: 외형 때문에 제외된 달리기입니다. 올바른 --source-dir 키포즈가 필요합니다.')
    elif legacy:
        files = [ROOT / 'images/characters' / look / f'walk_{i}.webp' for i in range(1,9)]
        if not all(p.exists() for p in files):
            files = [ROOT / 'images/characters' / f'walk_{i}.webp' for i in range(1,9)]
        source_poses = [Image.open(p).convert('RGBA') for p in files]
        original_indices = list(range(8))
    else:
        unique = unique_poses(old)
        # 촘촘한 달리기의 반복 유지 시간도 원본 동작의 일부이므로 49칸 전체를 유지한다.
        if motion == 'run' and len(unique) > 12:
            unique = list(enumerate(old))
        # 하얀 남방 항해사는 기존 보간의 원본 키포즈 7장만 다시 사용한다.
        if motion == 'walk' and look == 'navigator_white':
            unique = [(i, old[i]) for i in range(0,49,7)]
        original_indices, source_poses = zip(*unique)
    source_poses = list(source_poses)
    source_metrics = {'height_min': min(box(f)[3]-box(f)[1] for f in source_poses),
        'height_max': max(box(f)[3]-box(f)[1] for f in source_poses), 'frames': len(source_poses)}
    # 낱장은 게임과 같은 300px 표시 높이로 환산한 뒤 키를 정한다.
    heights = [(box(f)[3]-box(f)[1])*CELL_H/f.height for f in source_poses]
    source_metrics['display_height_min'] = min(heights)
    source_metrics['display_height_max'] = max(heights)
    target_h = min(280, round(float(np.median(heights))))
    working_h = target_h
    walk_reference = None
    if motion == 'run':
        walk_path = ROOT/'images/characters'/look/'motion/walk.webp'
        walking = cells(walk_path)
        walk_boxes = [box(f) for f in walking]
        walk_heights = [b[3]-b[1] for b in walk_boxes]
        walk_reference = {'sha256': digest(walk_path), 'height_range': [min(walk_heights),max(walk_heights)],
            'footline_range': [min(b[3]-1 for b in walk_boxes),max(b[3]-1 for b in walk_boxes)]}
        # 출력 키는 걷기와 정확히 같게 한다. 보간 작업 크기는 캐시와 분리해 재생성 때도 유지한다.
        target_h = round(float(np.median(walk_heights)))
        working_h = round(target_h*.94)
    normalized = [normalize(f, working_h, resize_cell) for f in source_poses]
    # sprite-gen의 상체 알파 정합. 발밑의 의도하지 않은 수직 이동은 허용하지 않는다.
    registered = register(normalized, slack_x=8, slack_y=0)
    width = max(old[0].width, registered[0].width+16)
    if width % 2:
        width += 1
    # 공통 캔버스/공통 x로 놓아 정합 결과를 유지한다.
    keys = [place(f, width, CELL_H, 1, (width-f.width)//2, 0, safe_margin_y=5, ground=True) for f in registered]
    for i, f in enumerate(keys):
        key_path = dest / f'key-{i:02d}.png'
        if key_path.exists():
            with Image.open(key_path) as previous:
                if previous.size != f.size or previous.convert('RGBA').tobytes() != f.tobytes():
                    raise ValueError(f'{look}: 이전 보간 캐시의 키포즈가 다릅니다. 새 --output 경로를 사용하세요.')
        f.save(key_path)
    frames, rejected, review = [], [], []
    source_screen = ghost_screen(keys) if motion == 'run' else {'ghosts': []}
    bad_sources = {g['frame'] for g in source_screen['ghosts']}
    clean_candidates = [(float(k), f) for k, f in enumerate(keys) if k not in bad_sources]
    start = time.monotonic()
    for i in range(COUNT):
        p = i*len(keys)/COUNT
        k = int(p)
        t = p-k
        cached = dest / f'between-{i:02d}.png'
        if cached.exists():
            with Image.open(cached) as im:
                made = im.convert('RGBA')
        else:
            made = keys[k].copy() if t < 1e-9 else interpolate(keys[k], keys[(k+1) % len(keys)], t)
            made.save(cached)
        wrong = []
        if t < 1e-9 and k in bad_sources:
            wrong = ['source-ghost']
            rejected.append({'frame': i, 'between': [k,k], 't': t, 'faults': wrong})
        if t > 1e-9:
            measure = measure_made(made, keys[k], keys[(k+1) % len(keys)], t, reads=True)
            wrong = faults(measure)
            if wrong:
                rejected.append({'frame': i, 'between': [k,(k+1)%len(keys)], 't': t,
                    'faults': wrong, 'measure': measure})
            elif looks(measure):
                review.append({'frame': i, 'measure': measure, 'reasons': looks(measure)})
        if not wrong:
            clean_candidates.append((p, made))
        if i % 7 == 0:
            print(f'{look}: {i+1}/49 ({time.monotonic()-start:.1f}s)', flush=True)
    # 나쁜 프레임은 키포즈와 검사를 통과한 중간 자세 중 같은 시간에 가장 가까운 것으로
    # 대체한다. 키포즈만 고르면 직전의 정상 보간보다 과거로 되돌아가는 역순 동작이 생긴다.
    candidates = [(p+shift*len(keys), f) for p, f in clean_candidates for shift in (-1,0,1)]
    # 같은 시점의 키포즈/보간 쌍은 영상 자체를 비교하지 않도록 위치만 정렬한다.
    candidates.sort(key=lambda entry: entry[0])
    selected_phases = []
    output_width = max(width, int(np.ceil(width*target_h/working_h)))
    if output_width % 2:
        output_width += 1
    for i in range(COUNT):
        p = i*len(keys)/COUNT
        phase, made = min(candidates, key=lambda entry: (abs(entry[0]-p), entry[0]))
        selected_phases.append(phase)
        # RIFE의 미세한 키 변화도 마지막에 한 번 더 맞춘다. 가로 중심은 보간 결과를 유지한다.
        if motion == 'run':
            scaled = fit_canvas(made,target_h,resize_cell)
        else:
            bb = box(made)
            factor = target_h/(bb[3]-bb[1])
            scaled = resize_cell(made, (max(1, round(width*factor)), max(1, round(CELL_H*factor))))
        sb = box(scaled)
        out = Image.new('RGBA', (output_width, CELL_H))
        out.alpha_composite(trim_alpha(scaled), ((output_width-scaled.width)//2, FOOT+1-sb[3]))
        frames.append(out)
    # 확대 후 5px 이상으로 드러나는 반투명 띠도 최종 표시 크기에서 다시 걸러낸다.
    screen = ghost_screen(frames)
    postscale_rejected = list(screen['ghosts'])
    if screen['reads'] and postscale_rejected:
        bad = {g['frame'] for g in postscale_rejected}
        clean = [(p+s*len(keys), f) for i,(p,f) in enumerate(zip(selected_phases,frames)) if i not in bad for s in (-1,0,1)]
        if not clean:
            raise ValueError(f'{look}: 최종 크기에서 정상 프레임이 없습니다.')
        chosen = [min(clean,key=lambda row: (abs(row[0]-i*len(keys)/COUNT),row[0])) for i in range(COUNT)]
        selected_phases = [p for p,f in chosen]
        frames = [f.copy() for p,f in chosen]
        screen = ghost_screen(frames)
    if any(b < a-1e-9 for a, b in zip(selected_phases, selected_phases[1:])):
        raise ValueError(f'{look}: 보행 자세의 시간 순서가 역전됨')
    face_lock = None
    if motion == 'walk':
        from match_player_motion_faces import prepare_walking_faces
        frames = prepare_walking_faces(look,frames,cfg.get('idle',0))
        screen = ghost_screen(frames)
    if motion == 'run':
        # 보간 뒤에 걷기 원본 얼굴을 고정한다. 먼저 합성하면 RIFE가 얼굴을 다시 변형한다.
        from match_player_motion_faces import lock_faces
        current_cfg = read_config(ROOT/'js/data/heromotion.js')[look]
        walkpath = ROOT/'images/characters'/look/'motion/walk.webp'
        reference_index = current_cfg['idle']
        frames, face_records = lock_faces(look,cells(walkpath)[reference_index],frames)
        face_lock = {'walking_reference_frame':reference_index,'walking_sha256':digest(walkpath),
                     'scale':1,'frames':face_records}
        screen = ghost_screen(frames)
    measured = metrics(frames)
    if measured['height_max']-measured['height_min'] > 2 or measured['foot_min'] != measured['foot_max'] or measured['edge_frames']:
        raise ValueError(f'{look} 크기/접지/가장자리 검사 실패: {measured}')
    if walk_reference and (max(measured['height_max'],walk_reference['height_range'][1])-min(measured['height_min'],walk_reference['height_range'][0]) > 1
            or [measured['foot_min'],measured['foot_max']] != walk_reference['footline_range']):
        raise ValueError(f'{look}: 걷기/달리기의 크기 또는 발밑 위치가 다릅니다.')
    # 원본 파일 해시와 원본 순서를 함께 남긴다. 접지 발을 수동 지정하지 않았으므로 보폭 확정은 하지 않는다.
    sequence = FrameSequence(tuple(frames), tuple([1/COUNT]*COUNT), metadata={'normalized_cycle_seconds': 1})
    qa = analyze(sequence)
    (dest/'motion.json').write_text(json.dumps(qa, ensure_ascii=False, indent=2), encoding='utf-8')
    # 기존의 발 모은 대기 자세와 가장 가까운 시간 위치를 유지한다.
    if motion == 'run':
        idle_key = 0
    elif legacy:
        from player_motion_cycles import feet_gap
        idle_key = min(range(len(keys)), key=lambda k: feet_gap(keys[k]))
    else:
        idle_key = min(range(len(original_indices)), key=lambda k: abs(original_indices[k]-cfg.get('idle',0)))
    idle = round(idle_key*COUNT/len(keys)) % COUNT
    if screen['reads'] and screen['ghosts']:
        raise ValueError(f'{look}: 최종 프레임의 반투명 팔다리 검사 실패: {screen}')
    save_sheet(frames, dest/f'{motion}.webp')
    contact(frames, dest/'contact.png')
    report = {'look': look, 'motion': motion, 'supplied_keyframes': bool(supplied),
        'legacy_source': legacy, 'source_hashes': {str(f): digest(f) for f in files},
        'source_indices': list(original_indices), 'source': source_metrics, 'old_atlas': metrics(old),
        'walk_reference': walk_reference,
        'face_lock': face_lock,
        'target_height': target_h, 'cell': [output_width, CELL_H], 'pivot': [output_width//2, FOOT],
        'idle': idle, 'output': measured, 'backend': interpolate.runner.describe(),
        'rejected_interpolations': rejected, 'review_interpolations': review,
        'delivered_ghost_screen': screen,
        'source_ghost_screen': source_screen,
        'postscale_rejected_frames': postscale_rejected,
        'selected_source_phases': selected_phases,
        'source_pose_order': 'original chronological order, cyclic final-to-first interpolation'}
    (dest/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'{look}: 완료 height={measured["height_min"]}~{measured["height_max"]}, unique={measured["visible_unique"]}',flush=True)
    return report


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--sprite-gen', type=Path, required=True)
    ap.add_argument('--rife-binary', type=Path, required=True)
    ap.add_argument('--rife-model', type=Path, required=True)
    ap.add_argument('--output', type=Path, required=True)
    ap.add_argument('--looks', nargs='*')
    ap.add_argument('--motion', choices=('walk','run'), default='walk')
    ap.add_argument('--source-dir', type=Path, help='올바른 외형의 <look>/key-*.png가 있는 폴더')
    ap.add_argument('--allow-excluded-looks', nargs='*', default=[], help='외형을 직접 검수해 제외 해제를 허용한 생김새')
    ap.add_argument('--jobs', type=int, default=1, choices=(1,2,3))
    ap.add_argument('--apply', action='store_true')
    args = ap.parse_args()
    args.output = args.output.resolve()
    args.output.mkdir(parents=True,exist_ok=True)
    sys.path.insert(0,str(args.sprite_gen.resolve()))
    from sprite_gen.util.resample import resize_cell
    from sprite_gen.frames.extract import register_row_frames, place_row_frame
    from sprite_gen.qa.motion import analyze_motion
    from sprite_gen.spec.assets import FrameSequence
    from sprite_gen.video.rife import Rife, model_bytes
    model_bytes(args.rife_model)  # 고정된 모델 SHA-256 검증
    interpolate = Rife(args.rife_binary.resolve(), args.rife_model.resolve())
    config_path = ROOT/'js/data/heromotion.js'
    backup_config = args.output/'original-heromotion.js'
    if not backup_config.exists():
        shutil.copy2(config_path,backup_config)
    config = read_config(backup_config)
    engine = (resize_cell, register_row_frames, place_row_frame, analyze_motion, FrameSequence, interpolate)
    with ThreadPoolExecutor(max_workers=args.jobs) as pool:
        reports = list(pool.map(lambda look: build(look,config[look],args,engine), args.looks or config))
    (args.output/'report.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding='utf-8')
    if args.apply:
        current = read_config(config_path)
        for r in reports:
            look = r['look']
            shutil.copy2(args.output/look/f'{args.motion}.webp',ROOT/'images/characters'/look/'motion'/f'{args.motion}.webp')
            if args.motion == 'run':
                from match_player_motion_faces import record_lock
                face = r['face_lock']
                record_lock(look,face['walking_reference_frame'],face['frames'],
                    ROOT/'images/characters'/look/'motion/walk.webp',
                    ROOT/'images/characters'/look/'motion/run.webp')
            if args.motion == 'walk':
                current[look]['idle'] = r['idle']
            current[look]['skip'] = [k for k in current[look].get('skip',[]) if k != args.motion]
            if not current[look]['skip']:
                current[look].pop('skip')
        text = ('/* 주인공 걷기·달리기: 같은 크기·발밑·연속 49칸. tools/update_player_walk_loops.py.\n'
            '   skip은 아직 외형이 다른 동작에만 적용한다. */\nwindow.G = window.G || {};\nG.HERO_MOTION = '
            + json.dumps(current,ensure_ascii=False,separators=(',',':'))+';\n')
        config_path.write_text(text,encoding='utf-8')


if __name__ == '__main__':
    main()
