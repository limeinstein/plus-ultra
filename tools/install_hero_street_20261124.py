"""제독 29종의 거리 달리기·후면 전환·대기 원화를 게임 시트로 포장한다.

새로 그리는 작업은 내장 ImageGen이 맡는다. 이 도구는 포즈의 연결 성분을
분리하고 비율·발밑 기준을 보존해 배치한다. 원본과 이전 게임 파일을 보관한다.
"""
import argparse
import json
import shutil
from pathlib import Path

import numpy as np
from PIL import Image
from duel_roster_sheets import separate

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'art_sources/hero-street-20261124'
RAW=BASE/'raw'
OUT=ROOT/'artifacts/hero-street-20261124'
RECORD=ROOT/'tools/hero_street_20261124'
CHARS=json.loads((ROOT/'tools/hero_street_20261124/characters.json').read_text(encoding='utf-8'))
HEIGHT,GROUND=300,295
RUN_LIFT=[0,0,3,12,0,0,3,12]


def backup(path):
    dest=BASE/'before'/path.relative_to(ROOT)
    if path.exists() and not dest.exists():
        dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,dest)


def save(im,path):
    backup(path);path.parent.mkdir(parents=True,exist_ok=True)
    im.save(path,lossless=True,method=6,exact=True)


def extract(fid,kind):
    source=RAW/f'{fid}_{kind}.png'
    alpha=source.with_stem(source.stem+'_alpha')
    if alpha.exists():source=alpha
    im=Image.open(source).convert('RGBA')
    rows,cols=(3,6) if kind=='idle' else (2,4)
    if abs(im.width/im.height-1.5)>.08:
        raise ValueError(f'{source.name}: {cols}×{rows} 원화의 가로세로비가 다름')
    poses=separate(source,rows,cols)
    for i,p in enumerate(poses):
        a=p.getchannel('A').point(lambda v:0 if v<=32 else v);p.putalpha(a)
        box=a.getbbox()
        if not box:raise ValueError(f'{source.name}: {i}번 자세가 비었음')
        poses[i]=p.crop(box)
    if kind=='idle':
        h=[poses[i].height for i in (0,6,12)]
        if min(h)<max(h)*.83:raise ValueError(f'{source.name}: 대기 동작에 반신상이 섞임 {h}')
    return poses,source


def head_x(im):
    a=np.asarray(im.getchannel('A'))
    band=a[round(im.height*.075):round(im.height*.20)]
    _,x=np.where(band>75)
    return float(np.median(x))


def foot_x(im):
    a=np.asarray(im.getchannel('A'))
    _,x=np.where(a[max(0,im.height-12):]>75)
    return float(np.median(x)) if len(x) else im.width/2


def scaled(im,scale):
    tile=im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))),Image.Resampling.LANCZOS)
    a=tile.getchannel('A').point(lambda v:0 if v<=4 else v);tile.putalpha(a)
    return tile.crop(a.getbbox())


def atlas(frames,cols,rows):
    out=Image.new('RGBA',(frames[0].width*cols,frames[0].height*rows))
    for i,im in enumerate(frames):out.alpha_composite(im,((i%cols)*im.width,(i//cols)*im.height))
    return out


def preview(frames,path,duration=100,loop=True):
    made=[]
    for frame in frames:
        cv=Image.new('RGBA',frame.size,'#d8d2c5');cv.alpha_composite(frame)
        made.append(cv.convert('RGB').quantize(colors=128))
    opts={'loop':0} if loop else {}
    made[0].save(path,save_all=True,append_images=made[1:],duration=duration,disposal=2,**opts)


def pack_move(fid,kind):
    poses,source=extract(fid,kind)
    scale=min(275/float(np.median([p.height for p in poses])),280/max(p.height for p in poses))
    tiles=[scaled(p,scale) for p in poses]
    anchors=[head_x(t) for t in tiles]
    half=max(max(x,t.width-x) for t,x in zip(tiles,anchors))
    width=int(np.ceil(half/2)*4+24)
    frames=[]
    for i,(tile,x) in enumerate(zip(tiles,anchors)):
        canvas=Image.new('RGBA',(width,HEIGHT));lift=RUN_LIFT[i] if kind=='run' else 0
        canvas.alpha_composite(tile,(round(width/2-x),GROUND-tile.height-lift));frames.append(canvas)
    dest=ROOT/'images/characters'/fid/'motion'
    if kind in ('walk','run'):
        save(atlas(frames,8,1),dest/('stride_'+kind+'.webp'))
        sequence=[frames[(i*8//49)%8] for i in range(49)]
        individual=ROOT/'images/characters' if fid=='admiral' else ROOT/'images/characters'/fid
        for i,frame in enumerate(frames,1):
            paths=sorted(individual.glob(f'{kind}_{i}.*'))
            save(frame,paths[0] if paths else individual/f'{kind}_{i}.webp')
    else:sequence=[frames[min(7,i*8//49)] for i in range(49)]
    save(atlas(sequence,7,7),dest/(kind+'.webp'))
    preview(frames,OUT/f'{fid}-{kind}.gif',90 if kind=='run' else 110,kind in ('walk','run'))
    return {'source':str(source.relative_to(ROOT)),'cell':[width,HEIGHT],'poses':8,'frames':49}


def pack_idle(fid):
    poses,source=extract(fid,'idle')
    scales=[275/poses[row*6].height for row in range(3)]
    scales=[min(s,405/max(p.height for p in poses[row*6:row*6+6])) for row,s in enumerate(scales)]
    tiles=[scaled(p,scales[i//6]) for i,p in enumerate(poses)]
    anchors=[foot_x(t) for t in tiles]
    half=max(max(x,t.width-x) for t,x in zip(tiles,anchors));width=int(np.ceil(half/2)*4+24)
    cells=[]
    for tile,x in zip(tiles,anchors):
        cell=Image.new('RGBA',(width,420));cell.alpha_composite(tile,(round(width/2-x),415-tile.height));cells.append(cell)
    # 여섯 키포즈를 두 칸씩 유지해 기존 12칸/동작 시간표를 그대로 사용한다.
    frames=[cells[row*6+k] for row in range(3) for k in range(6) for _ in range(2)]
    dest=ROOT/'images/characters'/fid/'motion'
    save(atlas(frames,6,6),dest/'idle.webp')
    for row,name in enumerate(('look','greet','stretch')):
        preview(cells[row*6:row*6+6],OUT/f'{fid}-{name}.gif',270 if name=='greet' else 500)
    # 정지한 제독은 발을 들고 있는 보행 중간 칸 대신 같은 새 인물의 양발 대기 자세를 쓴다.
    neutral=scaled(poses[0],275/poses[0].height)
    standing_width=max(width,int(np.ceil(max(head_x(neutral),neutral.width-head_x(neutral))))*2+24)
    standing=Image.new('RGBA',(standing_width,HEIGHT))
    standing.alpha_composite(neutral,(round(standing_width/2-head_x(neutral)),GROUND-neutral.height))
    save(standing,dest/'standing.webp')
    walkpath=dest/'walk.webp';old=Image.open(walkpath).convert('RGBA');cw,ch=old.width//7,old.height//7
    nw=max(cw,standing_width);new=Image.new('RGBA',(nw*7,ch*7))
    for i in range(49):
        frame=standing if i==0 else old.crop(((i%7)*cw,(i//7)*ch,(i%7+1)*cw,(i//7+1)*ch))
        new.alpha_composite(frame,((i%7)*nw+(nw-frame.width)//2,(i//7)*ch))
    save(new,walkpath)
    return {'source':str(source.relative_to(ROOT)),'cell':[width,420],'keys':18,'frames':36,'motions':['look','greet','stretch']}


def config(results):
    path=ROOT/'js/data/heromotion.js';backup(path);text=path.read_text(encoding='utf-8')
    data=json.loads(text[text.index('= {')+2:text.rindex(';')])
    for fid,entry in results.items():
        cfg=data.setdefault(fid,{})
        if 'walk' in entry:
            cfg.update(walkStart=1,walkCycles=1)
            cfg.setdefault('loops',{})['walk']={'cols':8,'rows':1,'count':8,'cycles':1,'times':[i/8 for i in range(9)],'pose':[i/8 for i in range(9)],'baseHeight':300,'fixedScale':True,'lift':[0]*8}
        if 'run' in entry:
            cfg.update(runStart=0,runCycles=1)
            cfg.setdefault('loops',{})['run']={'cols':8,'rows':1,'count':8,'cycles':1,'times':[i/8 for i in range(9)],'pose':[i/8 for i in range(9)],'baseHeight':300,'fixedScale':True,'lift':RUN_LIFT}
        if 'idle' in entry:cfg['idle']=0
        skip=cfg.get('skip',[])
        for kind in entry:
            if kind in skip:skip.remove(kind)
        if skip:cfg['skip']=skip
        else:cfg.pop('skip',None)
    path.write_text('/* 제독 거리 동작: 이동 거리 기반 걷기·달리기와 전용 후면·대기 시트. */\nwindow.G = window.G || {};\nG.HERO_MOTION = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8',newline='\n')


def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('ids',nargs='*');parser.add_argument('--partial',action='store_true')
    args=parser.parse_args();OUT.mkdir(parents=True,exist_ok=True)
    report=OUT/'install-report.json';results=json.loads(report.read_text(encoding='utf-8')) if report.exists() else {};errors=[]
    for fid in args.ids or [c['id'] for c in CHARS]:
        kinds=('walk','run','back','idle') if fid.endswith('_f') else ('run','back','idle')
        for kind in kinds:
            if not (RAW/f'{fid}_{kind}.png').exists():
                if not args.partial:errors.append(f'{fid}/{kind}: 원화 없음')
                continue
            try:
                results.setdefault(fid,{})[kind]=pack_idle(fid) if kind=='idle' else pack_move(fid,kind)
                print(fid,kind,'완료',flush=True)
            except (ValueError,OSError) as e:errors.append(f'{fid}/{kind}: {e}')
    config(results);report.write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    (OUT/'install-errors.json').write_text(json.dumps(errors,ensure_ascii=False,indent=2),encoding='utf-8')
    if errors:raise SystemExit('\n'.join(errors))

if __name__=='__main__':main()
