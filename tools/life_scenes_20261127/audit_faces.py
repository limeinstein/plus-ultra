"""얼굴 수정본을 검수할 연락 인화지. 원화 내용은 편집하지 않는다."""
import json
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

HERE = Path(__file__).parent
ROOT = HERE.parents[1]
OUT = ROOT/'artifacts/life-scenes-20261127'
jobs = json.loads((HERE/'face-jobs.json').read_text(encoding='utf-8'))
done=[]
for start in range(0,len(jobs),12):
    sheet=Image.new('RGB',(1800,1200),'#171c25');draw=ImageDraw.Draw(sheet)
    for i,j in enumerate(jobs[start:start+12]):
        file=HERE/'receipts'/(j['id']+'.json')
        if not file.exists(): continue
        r=json.loads(file.read_text(encoding='utf-8'));done.append(r['id'])
        with Image.open(r['source']) as im: thumb=ImageOps.fit(im.convert('RGB'),(600,266))
        x,y=i%3*600,i//3*300;sheet.paste(thumb,(x,y));draw.text((x+5,y+270),j['replaces'],fill='white')
    sheet.save(OUT/f'face-after-{start//12+1}.jpg',quality=95)
(OUT/'face-checks.json').write_text(json.dumps(dict(planned=len(jobs),complete=len(done),files=done),ensure_ascii=False,indent=2),encoding='utf-8')
print(str(len(done))+'/'+str(len(jobs)))
