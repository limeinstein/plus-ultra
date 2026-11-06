#!/usr/bin/env python3
"""접지·발 교차·공중 키포즈로 보행을 재구성한다. 전체 키로 배율을 맞추지 않는다."""
from __future__ import annotations
import argparse
import hashlib
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
from pathlib import Path
import shutil
import sys
import cv2
import numpy as np
from PIL import Image
from update_player_walk_loops import ROOT, cells, box, digest, read_config, trim_alpha
from player_motion_runtime import figures

CELL_H, FOOT, BASE_H = 360, 354, 300
STAGES = {'walk':['왼발 접지','왼발 무게 받기','오른발 교차','왼발 밀기','오른발 접지','오른발 무게 받기','왼발 교차','오른발 밀기'],
          'run':['왼발 착지','왼발 압축','왼발 차기','오른발 향한 공중','오른발 착지','오른발 압축','오른발 차기','왼발 향한 공중']}


def extract(path):
    im=Image.open(path).convert('RGBA');alpha=np.asarray(im)[:,:,3]
    if float((alpha==0).mean())<.001:raise ValueError('배경 제거 필요')
    fr,rows=figures(im)
    if len(fr)==16 and rows==[4,4,4,4]:return fr
    out=[];a=np.asarray(im)
    for row in range(4):
      for col in range(4):
        x0,x1=round(col*im.width/4),round((col+1)*im.width/4)
        y0,y1=max(0,round(row*im.height/4)-12),min(im.height,round((row+1)*im.height/4)+12)
        px=a[y0:y1,x0:x1].copy()
        n,lab,st,_=cv2.connectedComponentsWithStats((px[:,:,3]>128).astype(np.uint8),8)
        if n<2:raise ValueError('인물 없는 칸')
        area=st[1:,cv2.CC_STAT_AREA].max()
        keep=[i for i in range(1,n) if st[i,cv2.CC_STAT_AREA]>=area*.06]
        mask=cv2.dilate(np.isin(lab,keep).astype(np.uint8),np.ones((5,5),np.uint8)).astype(bool)
        px[:,:,3]=np.where(mask,px[:,:,3],0);f=Image.fromarray(px)
        out.append(f.crop(f.getchannel('A').getbbox()))
    return out


def head_x(frame, band):
    bb=box(frame);a=np.asarray(frame)[bb[1]:bb[1]+band,:,3]>80
    xs=np.nonzero(a)[1]
    return float((xs.min()+xs.max())/2)


def head_width(frame):
    top=box(frame)[1];a=np.asarray(frame)[top:top+24,:,3]>80
    xs=np.nonzero(a)[1];return float(xs.max()-xs.min()+1)


def build(look,args):
    from sprite_gen.video.rife import Rife
    from sprite_gen.video.align import measure_made
    from sprite_gen.video.interpolation_quality import faults,ghost_screen
    from repair_player_loops import lock_head
    from match_player_motion_faces import CUTS
    src=args.input/f'{look}-generated.png';raw=extract(src)
    cfg=read_config(ROOT/'js/data/heromotion.js')[look]
    from match_player_motion_faces import reference_index
    original=ROOT/'images/characters'/look/'motion';walking=cells(original/'walk.webp')
    reference=walking[reference_index(look,cfg['idle'])]
    target=float(np.median([box(f)[3]-box(f)[1] for f in walking]))
    # 발을 접은 키가 낮아지는 것은 정상이다. 걷기 접지 두 칸에서 정한 같은 배율을 전 동작에 적용한다.
    standing=float(np.mean([box(raw[i])[3]-box(raw[i])[1] for i in (0,4)]))
    scale=target/standing
    scaled=[trim_alpha(f.resize((max(1,round(f.width*scale)),max(1,round(f.height*scale))),Image.Resampling.LANCZOS)) for f in raw]
    mid_path=args.input/f'{look}-mid.png';mid_scaled=[];mid_scale=None
    if mid_path.exists():
        mid_raw=extract(mid_path)
        # 별도 원화 판의 해상도 차이는 머리 폭으로 한 번만 맞춘다. 자세마다 배율을 바꾸지 않는다.
        mid_scale=scale*float(np.median([head_width(f) for f in raw]))/float(np.median([head_width(f) for f in mid_raw]))
        mid_scaled=[trim_alpha(f.resize((max(1,round(f.width*mid_scale)),max(1,round(f.height*mid_scale))),Image.Resampling.LANCZOS)) for f in mid_raw]
    band=max(10,round(target*.08))
    centres=[head_x(f,band) for f in scaled]
    half=max(max(x,f.width-x) for f,x in zip(scaled,centres))
    if mid_scaled:
        half=max(half,max(max(head_x(f,band),f.width-head_x(f,band)) for f in mid_scaled))
    width=max(240,round(half)*2+40)
    dest=args.output/look;dest.mkdir(parents=True,exist_ok=True)
    rife=Rife(args.rife_binary.resolve(),args.rife_model.resolve())
    reports=[]
    for motion,offset in [('walk',0),('run',8)]:
      keys=[];heads=[]
      for k,f in enumerate(scaled[offset:offset+8]):
        bb=box(f);y=FOOT+1-bb[3]
        keys.append((f,round(width/2-centres[offset+k]),y))
        heads.append(y+bb[1])
      if motion=='run':
        for k in (3,7):
          # 공중 자세는 머리·몸통 배율을 유지하고, 접지 자세보다 조금 올라간 위치에 둔다.
          target_top=round(float(np.median([heads[i] for i in (0,2,4,6)])))-7
          f,x,_=keys[k];keys[k]=(f,x,target_top-box(f)[1]);heads[k]=target_top
      packed=[];transforms=[]
      for k,(f,x,y) in enumerate(keys):
        out=Image.new('RGBA',(width,CELL_H));out.alpha_composite(f,(x,y))
        cut=box(out)[1]+max(CUTS[look])+4
        body_hash=hashlib.sha256(np.asarray(out)[cut:].tobytes()).hexdigest()
        transforms.append({'scale':scale,'x':x,'y':y,'cut':cut,'body_sha256':body_hash})
        out=lock_head(look,reference,out)
        bb=box(out)
        if bb[0]<=2 or bb[1]<=2 or bb[2]>=width-2 or bb[3]>=CELL_H-2:raise ValueError(f'{motion}/{k}: 여백 부족 {bb}')
        out.save(dest/f'{motion}-key-{k}.png');packed.append(out)
      frames=[];times=[];rejected=[];stage=[];methods=[]
      for k,a in enumerate(packed):
        b=packed[(k+1)%8];frames.append(a);times.append(k/8);stage.append(float(k));methods.append('key')
        # 양쪽 키포즈의 몸통보다 갑자기 커지는 보간은 쓰지 않는다.
        def trunk(f):
          aa=np.asarray(f)[:,:,3]>100;top=box(f)[1]
          return int(aa[top+70:top+155].sum())
        chosen=None;chosen_method=None
        for method in (['drawn','rife'] if mid_scaled else ['rife']):
          issues=[]
          if method=='drawn':
            f=mid_scaled[offset+k];bb=box(f);x=round(width/2-head_x(f,band))
            y=FOOT+1-bb[3] if motion=='walk' or k in (0,1,4,5) else round((heads[k]+heads[(k+1)%8])/2)-bb[1]
            made=Image.new('RGBA',(width,CELL_H));made.alpha_composite(f,(x,y))
          else:
            cache=dest/f'{motion}-half-{k}-{width}x{CELL_H}.png'
            if cache.exists():made=Image.open(cache).convert('RGBA')
            else:made=rife(a,b,.5);made.save(cache)
            issues=faults(measure_made(made,a,b,.5,reads=True))
          if any(v not in ('smear','outline','outline_shift') for v in issues) or ghost_screen([made]).get('ghosts'):
            rejected.append({'after':k,'method':method,'faults':issues or ['잔상']});continue
          if trunk(made)>max(trunk(a),trunk(b))*1.04:
            rejected.append({'after':k,'method':method,'faults':['몸통 팽창']});continue
          made=lock_head(look,reference,trim_alpha(made))
          bb=box(made)
          if bb[0]<=2 or bb[1]<=2 or bb[2]>=width-2 or bb[3]>=CELL_H-2:
            rejected.append({'after':k,'method':method,'faults':['가장자리']});continue
          chosen=made;chosen_method=method;break
        if chosen is None:continue
        frames.append(chosen);times.append((k+.5)/8);stage.append(k+.5);methods.append(chosen_method)
      cols=8;rows=int(np.ceil(len(frames)/cols));sheet=Image.new('RGBA',(width*cols,CELL_H*rows))
      for i,f in enumerate(frames):sheet.alpha_composite(f,(i%cols*width,i//cols*CELL_H))
      target_file=dest/f'stride_{motion}.webp';sheet.save(target_file,'WEBP',lossless=True,method=6,exact=True)
      lift=[max(0,FOOT+1-box(f)[3]) for f in frames]
      clip={'cols':cols,'rows':rows,'count':len(frames),'cycles':1,'times':times+[1.],
            'pose':[v/8 for v in stage]+[1.],'baseHeight':BASE_H,'fixedScale':True,'lift':lift}
      report={'look':look,'motion':motion,'source_sha256':digest(src),'reference_sha256':digest(original/'walk.webp'),
              'reference_frame':reference_index(look,cfg['idle']),'scale':scale,'cell':[width,CELL_H],'foot':FOOT,
              'key_heads':heads,'key_heights':[box(f)[3]-box(f)[1] for f in packed],
              'stages':STAGES[motion],'key_transforms':transforms,'frame_stages':stage,'methods':methods,
              'mid_scale':mid_scale,'mid_source_sha256':digest(mid_path) if mid_scaled else None,
              'rejected':rejected,'clip':clip,'output_sha256':digest(target_file)}
      (dest/f'{motion}-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8',newline='\n')
      reports.append(report);print(f'{look}/{motion}: {len(frames)}칸, 전체 키 배율 보정 없음',flush=True)
    return reports


def main():
    p=argparse.ArgumentParser(description=__doc__)
    for name in ('input','output','sprite-gen','rife-binary','rife-model'):p.add_argument('--'+name,type=Path,required=True)
    p.add_argument('--looks',nargs='*');p.add_argument('--jobs',type=int,default=3)
    a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True);sys.path.insert(0,str(a.sprite_gen.resolve()))
    looks=a.looks or list(read_config(ROOT/'js/data/heromotion.js'));done=[];errors=[]
    with ThreadPoolExecutor(max_workers=a.jobs) as pool:
      futures={pool.submit(build,l,a):l for l in looks}
      for future in as_completed(futures):
        try:done.extend(future.result())
        except Exception as e:errors.append({'look':futures[future],'error':str(e)});print(errors[-1],flush=True)
    (a.output/'summary.json').write_text(json.dumps({'reports':done,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8',newline='\n')
    if errors:raise SystemExit(1)


if __name__=='__main__':main()
