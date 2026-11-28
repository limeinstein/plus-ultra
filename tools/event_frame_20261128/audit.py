"""게임 이벤트 원화의 실제 비율과 액자 9:4 비율을 비교한다."""
import json
import re
from collections import Counter
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).parent
OUT=ROOT/'artifacts/event-frame-20261128'
OUT.mkdir(parents=True,exist_ok=True)
text=(ROOT/'images/manifest.js').read_text(encoding='utf-8')
manifest=json.loads(re.search(r'G\.IMAGE_FILES\s*=\s*(\{[\s\S]*?\});',text)[1])
prefixes=('gold/cuts/','jhook/cuts/','song/cuts/','song/concerts/','story/cuts/','legend-events/','family-events/','romance-events/','achievement-events/','monster-events/','elf-events/','olympian-events/','crew-pet-events/','endings/','events/')
rows=[]
for key,file in manifest.items():
    if not key.startswith(prefixes):continue
    p=ROOT/'images'/file
    try:
        with Image.open(p) as im:
            w,h=im.size
            if w<400 or h<200:continue
            row=dict(key=key,file=file,width=w,height=h,ratio=round(w/h,5),error=round(abs(w/h-2.25),5),narrow=w/h<2.20,wide=w/h>2.30)
            rows.append(row)
    except Exception as e: rows.append(dict(key=key,file=file,error=str(e)))
bad=[r for r in rows if r.get('narrow') or r.get('wide')]
report=dict(total=len(rows),narrow=sum(r.get('narrow',False) for r in rows),wide=sum(r.get('wide',False) for r in rows),groups=dict(Counter(r['key'].split('/')[0] for r in bad)),rows=rows,bad=bad)
(HERE/'audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
story=[r for r in rows if r['key'].startswith(('gold/cuts/','jhook/cuts/'))]
for start in range(0,len(bad),16):
    group=bad[start:start+16]
    sheet=Image.new('RGB',(1600,1000),'#171b23');draw=ImageDraw.Draw(sheet)
    for i,r in enumerate(group):
        with Image.open(ROOT/'images'/r['file']) as im:
            thumb=ImageOps.contain(im.convert('RGB'),(400,210))
        x,y=i%4*400,i//4*250
        sheet.paste(thumb,(x+(400-thumb.width)//2,y))
        draw.text((x+5,y+213),r['key'][:53],fill='white');draw.text((x+5,y+230),str(r['width'])+' x '+str(r['height']),fill='#e7c384')
    sheet.save(OUT/f'bad-{start//16+1:02}.jpg',quality=92)
print(json.dumps({k:v for k,v in report.items() if k not in ('rows','bad')},ensure_ascii=True))
print(json.dumps(story,ensure_ascii=True))
