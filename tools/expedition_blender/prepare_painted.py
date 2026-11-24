"""회화 원화의 투명 여백·방향·인물 크기를 맞춘다. 재화풍화나 팔다리 왜곡은 하지 않는다."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont
import numpy as np
from scipy import ndimage
import json

ROOT=Path(__file__).resolve().parents[2]
SOURCE=Path(__file__).resolve().parent/'painted'
DEST=ROOT/'artifacts/expedition-blender-painted-20261124'
DEST.mkdir(parents=True,exist_ok=True)
W,H=224,256

def clean(im):
    a=np.array(im.convert('RGBA'))
    # 투명 여백에 남은 거의 안 보이는 점은 형체·기준점 계산에서 뺀다.
    mask=a[:,:,3]>28
    labels,n=ndimage.label(mask)
    sizes=np.bincount(labels.ravel()); sizes[0]=0
    mask=sizes[labels]>=max(6,sizes.max()*.001)
    a[:,:,3]=np.where(mask,a[:,:,3],0)
    out=Image.fromarray(a)
    return out.crop(out.getbbox())

def cells(file,rows,columns=4):
    with Image.open(file) as im:
        a=np.array(im.convert('RGBA'))[:,:,3]>28
        def cuts(projection,count):
            step=len(projection)/count; result=[0]
            for i in range(1,count):
                expected=step*i;lo=max(result[-1]+1,round(expected-step*.42));hi=min(len(projection)-1,round(expected+step*.42))
                candidates=np.arange(lo,hi+1)
                score=projection[candidates]+np.abs(candidates-expected)*.04
                result.append(int(candidates[np.argmin(score)]))
            return result+[len(projection)]
        xs=cuts(a.sum(axis=0),columns);ys=cuts(a.sum(axis=1),rows)
        return [[clean(im.crop((xs[c],ys[r],xs[c+1],ys[r+1]))) for c in range(columns)] for r in range(rows)]

def original(file,meta):
    with Image.open(file) as im:
        return [[clean(im.crop((c[0],c[1],c[0]+c[2],c[1]+c[3]))) for c in meta['cells'][r*4:r*4+4]] for r in range(8)]

crewtext=(ROOT/'js/data/expedition_crew.js').read_text(encoding='utf8')
a=crewtext.index('{"'); crew=json.loads(crewtext[a:crewtext.index(';',a)])['sheets']
all_frames={}
for name in ['captain_m','captain_f','crew_m','scout_f']:
    if name.startswith('captain'):
        turn=cells(SOURCE/(name+'_turnaround.png'),2)
        idle=[[turn[d//4][d%4]] for d in range(8)]
        walk=cells(SOURCE/(name+'_walk.png'),8)
        run=cells(SOURCE/(name+'_run.png'),8)
        diagonal=SOURCE/(name+'_se_motion.png')
        if diagonal.exists():
            se=cells(diagonal,2);walk[3]=se[0];run[3]=se[1]
    else:
        s=crew['male_foot' if name=='crew_m' else 'female_foot']
        walk=original(ROOT/'images'/s['file'],s)
        idle=[[row[1]] for row in walk]
        runfile=SOURCE/(name+'_run_v2.png')
        run=cells(runfile if runfile.exists() else SOURCE/(name+'_run.png'),8)
        # 기존 도보 부하 원화의 3번 줄은 실제로 남서쪽을 향한다.
        # 정면 대각선의 코·발끝을 함께 바로잡은 뒤 반대편 줄을 만든다.
        walk[3]=[ImageOps.mirror(im) for im in walk[3]]
        idle[3]=[ImageOps.mirror(im) for im in idle[3]]
        if name=='crew_m' or not runfile.exists():
            run[3]=[ImageOps.mirror(im) for im in run[3]]
    # 왼쪽 방향은 오른쪽의 실제 좌우 반전. 잘못된 생성 방위가 끼지 않도록 한다.
    for action in [idle,walk,run]:
        for d,src in [(5,3),(6,2),(7,1)]: action[d]=[ImageOps.mirror(im) for im in action[src]]
    for action,rows in [('idle',idle),('walk',walk),('run',run)]:
        count=len(rows[0]); atlas=Image.new('RGBA',(W*count,H*8))
        for d,row in enumerate(rows):
            factor=(196 if name.startswith('captain') else 190)/float(np.median([im.height for im in row]))
            for f,im in enumerate(row):
                resized=im.resize((round(im.width*factor),round(im.height*factor)),Image.Resampling.LANCZOS)
                assert resized.width<W-10 and resized.height<H-20,(name,action,d,f,resized.size)
                # 눈·머리 기준을 고정해 망토와 다리 폭이 바뀌어도 몸통이 좌우로 흔들리지 않는다.
                arr=np.array(resized); head=arr[:max(1,round(resized.height*.20)),:,3]
                xs=np.arange(resized.width); weight=head.sum(axis=0)
                cx=float((xs*weight).sum()/max(1,weight.sum()))
                px=max(4,min(W-resized.width-4,round(W/2-cx))); py=26 + ([-1,-5,-1,-5][f] if action=='run' else 0)
                assert px>=2 and px+resized.width<W-1,(name,action,d,f,px,resized.width)
                atlas.paste(resized,(f*W+px,d*H+py))
        atlas.save(DEST/f'{name}_{action}_source.png')
        all_frames[f'{name}_{action}']={'file':f'{name}_{action}_source.png','count':count}
(DEST/'sources.json').write_text(json.dumps(all_frames,indent=2),encoding='utf8')
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',23)
board=Image.new('RGB',(1120,660),'#213731'); draw=ImageDraw.Draw(board)
draw.text((28,20),'탐험대 · 회화 원화 / 여성 제독 의상 반영',font=font,fill='#efd7a8')
for i,(name,label) in enumerate([('captain_m','남성 제독'),('captain_f','여성 제독 · 모자 없음'),('crew_m','남성 대원'),('scout_f','여성 대원')]):
    draw.text((i*280+20,65),label,font=font,fill='#efd7a8')
    for j,action in enumerate(['idle','run']):
        with Image.open(DEST/f'{name}_{action}_source.png') as im: crop=im.crop((0,3*H,W,4*H))
        board.paste(crop,(i*280+25,95+j*270),crop)
board.save(DEST/'company-preview.jpg',quality=95)
print('회화 원화 시트 12개 준비 완료')
