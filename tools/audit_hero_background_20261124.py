"""제독 원화의 모든 칸 경계와 빈 바탕의 알파를 읽기만 해 검사한다."""
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/hero-background-20261124';OUT.mkdir(parents=True,exist_ok=True)
records=[]
for group in ['hero-motion-20261124','hero-street-20261124','hero-women-20261124']:
 for p in sorted((ROOT/'art_sources'/group/'raw').glob('*.png')):
  if p.stem.endswith('_alpha') or '_cutin' in p.stem or 'grip' in p.stem:continue
  kind=p.stem.rsplit('_',1)[-1]
  if kind not in ('walk','run','back','idle','atk','react'):continue
  chosen=p.with_stem(p.stem+'_alpha')
  if not chosen.exists():chosen=p
  rows,cols=(4,6) if kind in ('atk','react') else (3,6) if kind=='idle' else (2,4)
  im=Image.open(chosen).convert('RGBA');a=np.asarray(im)[:,:,3];h,w=a.shape
  gutters=[]
  for r in range(rows):
   for c in range(cols):
    y0,y1=round(r*h/rows),round((r+1)*h/rows);x0,x1=round(c*w/cols),round((c+1)*w/cols)
    tile=a[y0:y1,x0:x1];gutters.extend([tile[:3,:].ravel(),tile[-3:,:].ravel(),tile[:,:3].ravel(),tile[:,-3:].ravel()])
  g=np.concatenate(gutters)
  haze=float(((g>12)&(g<200)).mean())
  bad=float(np.median(g))>12 or haze>.03 or float((a>32).mean())>.60
  records.append({'group':group,'key':p.stem,'source':str(chosen.relative_to(ROOT)),'gutterMedian':float(np.median(g)),'gutterP99':float(np.percentile(g,99)),'gutterVisibleFraction':float((g>12).mean()),'gutterHazeFraction':haze,'visibleFraction':float((a>32).mean()),'needsRemoval':bad})
(OUT/'source-audit.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'checked':len(records),'pending':[{k:r[k] for k in ('group','key','gutterP99','gutterVisibleFraction')} for r in records if r['needsRemoval']]},ensure_ascii=False))
# 어두운 바탕에 합성한 검토용 전후 비교. 게임 원화는 수정하지 않는다.
p=ROOT/'art_sources/hero-women-20261124/raw/noble_navigator_f_atk.png';q=p.with_stem(p.stem+'_alpha')
if q.exists():
 board=Image.new('RGB',(1200,460),'#142b48');draw=ImageDraw.Draw(board);font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',22)
 for i,path in enumerate([p,q]):
  im=Image.open(path).convert('RGBA');im=im.crop((0,0,im.width,im.height//2));im.thumbnail((580,400));cv=Image.new('RGBA',im.size,'#142b48');cv.alpha_composite(im);board.paste(cv.convert('RGB'),(i*600+10,50));draw.text((i*600+15,12),'수정 전' if i==0 else '수정 후',font=font,fill='white')
 board.save(OUT/'noble-before-after.jpg',quality=95)
