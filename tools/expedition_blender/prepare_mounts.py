"""탈것의 남녀 제독·여성 부하 원화를 방향과 실제 투명 틈에 맞춰 정리한다."""
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw,ImageFont
from scipy import ndimage
import numpy as np
import json

ROOT=Path(__file__).resolve().parents[2]
RAW=Path(__file__).resolve().parent/'mounts'
OUT=ROOT/'artifacts/expedition-mounts-20261124'
OUT.mkdir(parents=True,exist_ok=True)
W,H=384,256

def boundaries(projection,count):
    step=len(projection)/count;result=[0]
    for i in range(1,count):
        expected=step*i;lo=max(result[-1]+1,round(expected-step*.44));hi=min(len(projection)-1,round(expected+step*.44))
        candidates=np.arange(lo,hi+1);score=projection[candidates]+np.abs(candidates-expected)*.04
        result.append(int(candidates[np.argmin(score)]))
    return result+[len(projection)]

def clean(im):
    a=np.array(im.convert('RGBA'));mask=a[:,:,3]>28
    labels,n=ndimage.label(mask);sizes=np.bincount(labels.ravel());sizes[0]=0
    mask=sizes[labels]>=max(8,sizes.max()*.035)
    a[:,:,3]=np.where(mask,a[:,:,3],0)
    im=Image.fromarray(a);box=im.getbbox()
    if not box: raise ValueError('비어 있는 탈것 자세')
    return im.crop(box)

def split(file,row_count=8):
    with Image.open(file) as im:
        mask=np.array(im.convert('RGBA'))[:,:,3]>28
        xs=boundaries(mask.sum(axis=0),4);ys=boundaries(mask.sum(axis=1),row_count)
        return [[clean(im.crop((xs[c],ys[r],xs[c+1],ys[r+1]))) for c in range(4)] for r in range(row_count)]

text=(ROOT/'js/data/expedition_crew.js').read_text(encoding='utf8');a=text.index('{"');crew=json.loads(text[a:text.index(';',a)])['sheets']
jobs=json.loads((RAW/'jobs.json').read_text(encoding='utf8'))
audit=json.loads((RAW/'direction_audit.json').read_text(encoding='utf8')) if (RAW/'direction_audit.json').exists() else {}
specs={}
for job in jobs:
    if job['kind']=='porter' and job['character']!='scout_f':continue
    name=job['id'];file=RAW/(name+'.png')
    if name=='crew_m_reindeer':file=RAW/'crew_m_reindeer_north.png'
    if not file.exists():continue
    if name=='crew_m_reindeer':
        base=crew['male_reindeer'];rows=[]
        with Image.open(ROOT/'images'/base['file']) as original:
            for d in range(8):
                source_row,flip=base['directionRows'][d];row=[]
                for cell in base['cells'][source_row*4:source_row*4+4]:
                    im=clean(original.crop((cell[0],cell[1],cell[0]+cell[2],cell[1]+cell[3])))
                    row.append(ImageOps.mirror(im) if flip else im)
                rows.append(row)
        rows[0]=split(file,1)[0]
    else:rows=split(file)
    if job['kind']=='reindeer' and name!='crew_m_reindeer' and (RAW/'reindeer_north.png').exists():
        north=split(RAW/'reindeer_north.png',3)
        rows[0]=north[['captain_m','captain_f','scout_f'].index(job['character'])]
    for d in audit.get(name,{}).get('flipRows',[]): rows[d]=[ImageOps.mirror(im) for im in rows[d]]
    for d,src in [(5,3),(6,2),(7,1)]:rows[d]=[ImageOps.mirror(im) for im in rows[src]]
    atlas=Image.new('RGBA',(W*4,H*8));rowheights=[]
    for d,row in enumerate(rows):
        median=float(np.median([im.height for im in row]));factor=min(200/median,348/max(im.width for im in row))
        rowheights.append(round(median*factor,3))
        for f,im in enumerate(row):
            scaled=im.resize((round(im.width*factor),round(im.height*factor)),Image.Resampling.LANCZOS)
            px=round((W-scaled.width)/2);py=230-scaled.height
            if py<3:raise ValueError((name,d,f,scaled.size))
            atlas.paste(scaled,(f*W+px,d*H+py))
    atlas.save(OUT/(name+'_source.png'))
    kind=job['kind'];base=crew['male_'+kind]
    specs[name]={'kind':kind,'character':job['character'],'file':name+'_source.png','rowHeights':rowheights,'targetHeight':base['targetHeight'],'count':4}
(OUT/'sources.json').write_text(json.dumps(specs,indent=2),encoding='utf8')
# 머리·주둥이·발끝의 방향을 원화와 함께 사람이 검수하는 표.
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',16)
for offset in range(0,len(specs),9):
    selected=list(specs)[offset:offset+9]
    board=Image.new('RGB',(1200,len(selected)*170),'#9ca783');draw=ImageDraw.Draw(board)
    for r,name in enumerate(selected):
        with Image.open(OUT/(name+'_source.png')) as im:
            for d in range(8):
                part=im.crop((0,d*H,W,(d+1)*H));part.thumbnail((150,140))
                board.paste(part,(d*150,r*170+24),part)
                draw.text((d*150+3,r*170+3),name+' '+str(d),font=font,fill='#18271d')
    board.save(OUT/f'audit-{offset//9}.jpg',quality=94)
print('탈것 원화 정리 완료:',len(specs))
