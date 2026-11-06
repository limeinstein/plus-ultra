#!/usr/bin/env python3
"""검수한 보행 순환 시트를 등록한다. 대기·얼굴 기준 원본은 교체하지 않는다."""
from pathlib import Path
import argparse
import json
import sys
import cv2
import numpy as np
from PIL import Image
from repair_player_loops import ROOT, frame_hash, distance, flow_pair, flow_frame, normalize, lock_head
from update_player_walk_loops import read_config, digest, box, cells


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--output',type=Path,required=True)
    ap.add_argument('--sprite-gen',type=Path,required=True)
    args=ap.parse_args();sys.path.insert(0,str(args.sprite_gen.resolve()))
    from sprite_gen.video.interpolation_quality import ghost_screen
    config_path=ROOT/'js/data/heromotion.js';cfg=read_config(config_path)
    manifest_path=ROOT/'images/manifest.js'
    additions={}
    reports=[]
    for look in cfg:
        cfg[look]['loops']={}
        for motion in ('walk','run'):
            folder=args.output/look/motion
            r=json.loads((folder/'report.json').read_text(encoding='utf-8'))
            source=ROOT/'images/characters'/look/'motion'/f'{motion}.webp'
            if digest(source)!=r['source_sha256']: raise ValueError(f'{look}/{motion}: 제작 중 원본 변경')
            im=Image.open(folder/f'stride_{motion}.webp').convert('RGBA')
            w,h=im.width//r['cols'],300
            frames=[];phases=[];previous=None
            for i in range(r['count']):
                f=im.crop((i%r['cols']*w,i//r['cols']*h,(i%r['cols']+1)*w,i//r['cols']*h+h))
                key=frame_hash(f)
                if key!=previous: frames.append(f);phases.append(r['phases'][i]);previous=key
            if frame_hash(frames[-1])==frame_hash(frames[0]):frames.pop();phases.pop()
            # 원본 칸 끝에 닿은 중간 자세는 넓힌 캔버스에서 다시 보간한다.
            # 빈 여백만 붙여 잘린 발끝을 숨기지 않는다.
            padding=16;wide=w+padding*2
            def pad(f):
                out=Image.new('RGBA',(wide,300));out.alpha_composite(f,(padding,0));return out
            originals=cells(source);fixed=[];edge_repaired=[]
            target_height=round(float(np.median([box(f)[3]-box(f)[1] for f in frames])))
            for i,f in enumerate(frames):
                b=box(f);phase,t=phases[i]
                if (b[0]<=1 or b[2]>=w-1) and t>0:
                    a=pad(originals[r['source_indices'][phase]])
                    bframe=pad(originals[r['source_indices'][(phase+1)%len(r['source_indices'])]])
                    f=normalize(flow_frame(a,bframe,flow_pair(a,bframe),t),target_height,a.size)
                    f=lock_head(look,a,f);edge_repaired.append(i)
                else:f=pad(f)
                fixed.append(f)
            frames=fixed;w=wide
            screen=ghost_screen(frames);coverage_repaired=[]
            for bad in screen.get('ghosts',[]):
                i=bad['frame'];f=frames[i];pixels=np.asarray(f).copy()
                # 변형 과정에서 넓어진 반투명 가장자리를 실제 윤곽으로 다시 래스터화한다.
                # 머리 원본은 그대로 두고 몸의 경계에만 한 픽셀 안팎의 알파를 만든다.
                coverage=cv2.GaussianBlur((pixels[:,:,3]>127).astype(np.float32),(3,3),.45)
                top=box(f)[1]+65
                pixels[top:,:,3]=(coverage[top:]*255).round().astype(np.uint8)
                restored=Image.fromarray(pixels);foot_shift=295-box(restored)[3]
                if foot_shift:
                    grounded=Image.new('RGBA',restored.size);grounded.alpha_composite(restored,(0,foot_shift));restored=grounded
                frames[i]=restored;coverage_repaired.append(i)
            screen=ghost_screen(frames)
            if screen.get('ghosts'): raise ValueError(f'{look}/{motion}: 잔상 {screen["ghosts"]}')
            boxes=[box(f) for f in frames]
            if any(b[0]<=1 or b[1]<=1 or b[2]>=w-1 or b[3]!=295 for b in boxes):
                raise ValueError(f'{look}/{motion}: 접지·잘림 검사 실패')
            changes=[max(.00001,distance(f,frames[(i+1)%len(frames)])) for i,f in enumerate(frames)]
            weights=np.array(changes)**.85
            weights=np.maximum(weights,float(np.median(weights))*.22)
            times=np.r_[0,np.cumsum(weights)/weights.sum()]
            count=len(frames);rows=int(np.ceil(count/8));atlas=Image.new('RGBA',(w*8,rows*300))
            for i,f in enumerate(frames):atlas.alpha_composite(f,(i%8*w,i//8*300))
            target=source.with_name(f'stride_{motion}.webp')
            atlas.save(target,'WEBP',lossless=True,method=6,exact=True)
            clip={'cols':8,'rows':rows,'count':count,'cycles':r['cycles'],'times':[round(t,9) for t in times]}
            start=cfg[look].get(motion+'Start',0);span=49-start
            pose=[]
            for phase,t in phases:
                a=r['source_indices'][phase];b=r['source_indices'][(phase+1)%len(r['source_indices'])]
                if phase==len(r['source_indices'])-1:b+=span
                pose.append(round((a+(b-a)*t-start)/span*r['cycles'],9))
            clip['pose']=pose+[r['cycles']]
            cfg[look]['loops'][motion]=clip
            key=f'characters/{look}/motion/stride_{motion}'
            additions[key]=key+'.webp'
            velocity=np.array(changes)/np.diff(times)
            reports.append({'look':look,'motion':motion,'source_sha256':r['source_sha256'],
              'output_sha256':digest(target),'cell':[w,300],'clip':clip,'phases':phases,
              'source_indices':r['source_indices'],'before':r['before'],
              'after':{'seam':changes[-1],'max':max(changes),'mean':float(np.mean(changes)),
              'speed_cv':float(np.std(velocity)/np.mean(velocity))},
              'inserted':count-len(r['source_indices']),'edge_repaired':edge_repaired,
              'coverage_repaired':coverage_repaired,'ghosts':screen['ghosts']})
            print(f'{look}/{motion}: {count}칸 등록, 잔상 0',flush=True)
    # 검수하는 동안 다른 자산이나 설정이 추가되어도 이 작업의 항목만 합친다.
    current=read_config(config_path)
    for look in cfg: current[look]['loops']=cfg[look]['loops']
    config_path.write_text('/* 보행 원본과 순환 시트 시간표. times는 자세별 시작 진행도(마지막 값 1). */\nwindow.G = window.G || {};\nG.HERO_MOTION = '+json.dumps(current,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8',newline='\n')
    text=manifest_path.read_text(encoding='utf-8')
    manifest=json.loads(text.split('G.IMAGE_FILES = ')[1].split(';')[0]);manifest.update(additions)
    manifest_path.write_text(text.split('G.IMAGE_FILES = ')[0]+'G.IMAGE_FILES = '+json.dumps(dict(sorted(manifest.items())),ensure_ascii=False,indent=2)+';\n',encoding='utf-8',newline='\n')
    (ROOT/'docs/art/player-loop-20261106.json').write_text(json.dumps({'version':1,'clips':reports},ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')


if __name__=='__main__':main()
