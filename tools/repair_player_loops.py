#!/usr/bin/env python3
"""기존 보행 그림의 반복 유지 시간을 정리하고 마지막→첫 칸까지 이어 만든다.

원본 걷기·달리기·대기 그림은 보존한다. 별도 stride_walk/run 시트와
자세 변화량에 따른 시간표를 만든다. 원본 순서를 뒤집거나 왕복하지 않는다.
"""
from __future__ import annotations
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
from pathlib import Path
import shutil
import sys
import cv2
import numpy as np
from PIL import Image
from update_player_walk_loops import ROOT, cells, box, digest, read_config, trim_alpha, fit_canvas


def visible(frame):
    a = np.asarray(frame).astype(np.float32)/255
    return np.dstack((a[:,:,:3]*a[:,:,3:], a[:,:,3]))


def distance(a, b):
    a, b = visible(a), visible(b)
    mask = (a[:,:,3]>.05)|(b[:,:,3]>.05)
    # 발의 교대가 망토보다 크게 반영되도록 하체에 무게를 둔다.
    weights = np.ones(mask.shape, np.float32)
    weights[int(mask.shape[0]*.52):] = 2
    return float((np.abs(a-b).mean(2)*weights)[mask].sum()/weights[mask].sum())


def frame_hash(frame):
    return hashlib.sha256((visible(frame)*255).round().astype(np.uint8).tobytes()).hexdigest()


def flow_pair(a, b):
    def gray(f):
        v = visible(f)
        return np.clip((.5*v[:,:,3]+.5*cv2.cvtColor(v[:,:,:3], cv2.COLOR_RGB2GRAY))*255, 0, 255).astype(np.uint8)
    engine = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    return engine.calc(gray(a), gray(b), None), engine.calc(gray(b), gray(a), None)


def flow_frame(a, b, flows, t):
    h, w = a.height, a.width
    yy, xx = np.indices((h,w), dtype=np.float32)
    warped = []
    for f, flow, amount in ((a, flows[0], t), (b, flows[1], 1-t)):
        premul = visible(f)
        warped.append(cv2.remap(premul, xx-amount*flow[:,:,0], yy-amount*flow[:,:,1], cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT))
    # 두 실루엣을 겹쳐 반투명 다리가 생기지 않게 한쪽의 변형된 윤곽을 쓴다.
    # 양쪽 모두 몸 안인 부분에서만 색을 섞는다.
    primary = warped[0] if t < .5 else warped[1]
    v = np.clip(primary,0,1).copy()
    overlap = (warped[0][:,:,3]>.97)&(warped[1][:,:,3]>.97)
    mixed = np.clip(warped[0]*(1-t)+warped[1]*t,0,1)
    v[:,:,:3][overlap] = mixed[:,:,:3][overlap]
    rgb = np.divide(v[:,:,:3], v[:,:,3:], out=np.zeros_like(v[:,:,:3]), where=v[:,:,3:]>.001)
    return Image.fromarray(np.clip(np.dstack((rgb,v[:,:,3]))*255,0,255).round().astype(np.uint8))


def normalize(frame, height, size):
    from sprite_gen.util.resample import resize_cell
    scaled = fit_canvas(trim_alpha(frame), height, resize_cell)
    bb = box(scaled)
    out = Image.new('RGBA', size)
    out.alpha_composite(scaled, ((size[0]-scaled.width)//2,295-bb[3]))
    return trim_alpha(out)


def lock_head(look, reference, frame):
    from match_player_motion_faces import head_centre, XS, CUTS
    from sprite_gen.video.face_layer import warp, shift
    src, original = visible(reference)*255, np.asarray(frame).astype(np.float32)
    dx, dy = head_centre(frame)-head_centre(reference), box(frame)[1]-box(reference)[1]
    placed = warp(src, shift(-dx,-dy), frame.size)
    x = np.arange(frame.width)-head_centre(frame)
    boundary = box(frame)[1]+np.interp(x, XS, CUTS[look])
    weight = np.clip((boundary[None,:]-np.arange(frame.height)[:,None])/3,0,1)[:,:,None]
    premul = visible(frame)*255
    v = premul*(1-weight)+placed*weight
    rgb = np.divide(v[:,:,:3]*255,v[:,:,3:],out=np.zeros_like(v[:,:,:3]),where=v[:,:,3:]>0)
    out = np.clip(np.dstack((rgb,v[:,:,3])),0,255).round().astype(np.uint8)
    out[weight[:,:,0]==0] = original.astype(np.uint8)[weight[:,:,0]==0]
    return Image.fromarray(out)


def build(look, motion, cfg, args):
    from sprite_gen.video.rife import Rife
    from sprite_gen.video.align import measure_made
    from sprite_gen.video.interpolation_quality import faults, ghost_screen
    source = ROOT/'images/characters'/look/'motion'/f'{motion}.webp'
    dest = args.output/look/motion
    dest.mkdir(parents=True, exist_ok=True)
    original = cells(source)
    frames, indices, last = [], [], None
    for index in range(cfg.get(motion+'Start',0),49):
        key = frame_hash(original[index])
        if key == last: continue
        frames.append(original[index]); indices.append(index); last = key
    if frame_hash(frames[-1]) == frame_hash(frames[0]): frames.pop(); indices.pop()
    height = round(float(np.median([box(f)[3]-box(f)[1] for f in frames])))
    n = len(frames)
    deltas = [distance(f, frames[(i+1)%n]) for i,f in enumerate(frames)]
    # 루프 경계와 가장 큰 내부 도약은 신경망 보간으로도 후보를 만든다.
    neural_edges = set(sorted(range(n), key=lambda i:deltas[i], reverse=True)[:1]+[n-1])
    rife = Rife(args.rife_binary.resolve(), args.rife_model.resolve())
    delivered, phases, records = [], [], []
    for i, a in enumerate(frames):
        b = frames[(i+1)%n]
        delivered.append(a); phases.append((i,0.))
        parts = max(1, min(5, int(np.ceil(deltas[i]/.045))))
        if i == n-1: parts = max(parts,4)
        flows = None
        for j in range(1,parts):
            t = j/parts
            made_path = dest/f'between-v3-{i:02d}-{j}of{parts}.png'
            if made_path.exists():
                made = Image.open(made_path).convert('RGBA'); method='cache'
            else:
                if flows is None: flows = flow_pair(a,b)
                made = flow_frame(a,b,flows,t); method='flow'
                if i in neural_edges:
                    # 같은 곳을 여러 번 생성하지 않도록 신경망 후보도 따로 보관한다.
                    neural = dest/f'rife-{i:02d}-{j}of{parts}.png'
                    if neural.exists(): candidate = Image.open(neural).convert('RGBA')
                    else: candidate = rife(a,b,t); candidate.save(neural)
                    issues = faults(measure_made(candidate,a,b,t,reads=True))
                    # 빠른 동작의 일시적인 옷 무늬 부드러움은 허용하되,
                    # 반투명 팔다리·구멍·겹친 윤곽은 전달하지 않는다.
                    if all(f in ('smear','outline','outline_shift') for f in issues) and not ghost_screen([candidate]).get('ghosts'):
                        made = candidate; method='rife'
                made = normalize(made,height,a.size)
                made = lock_head(look,a,made)
                made.save(made_path)
            delivered.append(made); phases.append((i,t))
            records.append({'edge':[indices[i],indices[(i+1)%n]],'t':t,'method':method})
        if i%10==0: print(f'{look}/{motion}: {i+1}/{n}',flush=True)
    # 자세 변화량에 따라 시간을 나누고 경계도 같은 속도로 통과한다.
    changes = [max(.00001,distance(f,delivered[(i+1)%len(delivered)])) for i,f in enumerate(delivered)]
    weights = np.array(changes,dtype=float)**.85
    # 미세한 흔들림에 오래 머물지 않고 큰 자세 변화에 필요한 시간을 준다.
    weights = np.maximum(weights, float(np.median(weights))*.22)
    times = np.r_[0,np.cumsum(weights)/weights.sum()].tolist()
    cols, count = 8,len(delivered); rows = int(np.ceil(count/cols))
    sheet = Image.new('RGBA',(a.width*cols,300*rows))
    for i,f in enumerate(delivered): sheet.alpha_composite(f,(i%cols*a.width,i//cols*300))
    sheet.save(dest/f'stride_{motion}.webp','WEBP',lossless=True,method=6,exact=True)
    report={'look':look,'motion':motion,'source_sha256':digest(source),'source_indices':indices,
      'count':count,'cols':cols,'rows':rows,'cycles':cfg.get(motion+'Cycles',2 if motion=='run' else 1),
      'times':[round(t,9) for t in times], 'phases':phases,'insertions':records,
      'before':{'seam':deltas[-1],'max':max(deltas),'holds_removed':49-cfg.get(motion+'Start',0)-n},
      'after':{'seam':changes[-1],'max':max(changes),'mean':float(np.mean(changes))},
      'output_sha256':digest(dest/f'stride_{motion}.webp')}
    (dest/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8',newline='\n')
    if args.apply: shutil.copy2(dest/f'stride_{motion}.webp',source.with_name(f'stride_{motion}.webp'))
    print(f'{look}/{motion}: {n}→{count}칸, 경계 {deltas[-1]:.3f}→{changes[-1]:.3f}',flush=True)
    return report


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--output',type=Path,required=True)
    ap.add_argument('--sprite-gen',type=Path,required=True)
    ap.add_argument('--rife-binary',type=Path,required=True)
    ap.add_argument('--rife-model',type=Path,required=True)
    ap.add_argument('--looks',nargs='*')
    ap.add_argument('--jobs',type=int,default=3)
    ap.add_argument('--apply',action='store_true')
    args=ap.parse_args();args.output.mkdir(parents=True,exist_ok=True)
    sys.path.insert(0,str(args.sprite_gen.resolve()))
    cfg=read_config(ROOT/'js/data/heromotion.js'); reports=[];errors=[]
    with ThreadPoolExecutor(max_workers=args.jobs) as pool:
        tasks={pool.submit(build,l,m,cfg[l],args):(l,m) for l in (args.looks or cfg) for m in ('walk','run')}
        for future in as_completed(tasks):
            try: reports.append(future.result())
            except Exception as e: errors.append({'clip':tasks[future],'error':str(e)});print(errors[-1],flush=True)
    (args.output/'summary.json').write_text(json.dumps({'reports':reports,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8',newline='\n')
    if errors: raise SystemExit(1)


if __name__=='__main__': main()
