"""내장 ImageGen 사건 원화를 게임 장면(1881×836 WebP)과 검수판으로 내보낸다."""
import argparse,json
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/event-shots-20261029'
SPECS=ROOT/'tools/event_shots_20261029_prompts.json'

def main():
 ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--ready',action='store_true');ap.add_argument('--check',action='store_true');args=ap.parse_args()
 data=json.loads(SPECS.read_text(encoding='utf-8'));rows=data['assets'];pending=[];report=[]
 for row in rows:
  ident=row['id'];source=OUT/'sources'/(ident+'.png');target=ROOT/'images'/row.get('folder','legend-events')/(ident+'.webp')
  if not source.exists():pending.append(ident);continue
  if not args.check and (not target.exists() or source.stat().st_mtime>target.stat().st_mtime):
   with Image.open(source) as im:
    im.load();assert im.width>=1500 and im.height>=700,(ident,im.size)
    pic=ImageOps.fit(im.convert('RGB'),(1881,836),Image.Resampling.LANCZOS)
    temporary=target.with_suffix('.tmp.webp');pic.save(temporary,'WEBP',quality=94,method=6);temporary.replace(target)
  with Image.open(target) as im:
   im.load();assert im.size==(1881,836),(ident,im.size)
   report.append({'id':ident,'size':list(im.size),'bytes':target.stat().st_size,'source':str(source.relative_to(ROOT))})
 if not args.ready and pending:raise SystemExit('원화 누락: '+','.join(pending))
 for key,original in data.get('aliases',{}).items():
  source=ROOT/'images'/(original+'.webp');target=ROOT/'images'/(key+'.webp')
  assert source.exists(),source
  if args.check:
   assert target.exists() and target.read_bytes()==source.read_bytes(),key
  elif not target.exists() or target.read_bytes()!=source.read_bytes():target.write_bytes(source.read_bytes())
  with Image.open(target) as im:im.load();assert im.size==(1881,836)
  report.append({'id':key,'size':[1881,836],'bytes':target.stat().st_size,'aliasOf':original})
 (OUT/'asset-report.json').write_bytes((json.dumps(report,ensure_ascii=False,indent=2)+'\n').encode('utf-8'))
 font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',15)
 for group in ['history','oldguard']:
  visible=[r for r in rows if (r['event'] in ['oldguard','heirplan'])==(group=='oldguard') and (ROOT/'images'/r.get('folder','legend-events')/(r['id']+'.webp')).exists()]
  if not visible:continue
  w,h,cols=376,194,4
  board=Image.new('RGB',(w*cols,h*((len(visible)+cols-1)//cols)),'#211e1b');draw=ImageDraw.Draw(board)
  for i,r in enumerate(visible):
   x,y=i%cols*w,i//cols*h
   with Image.open(ROOT/'images'/r.get('folder','legend-events')/(r['id']+'.webp')) as im:board.paste(im.resize((376,167),Image.Resampling.LANCZOS),(x,y))
   draw.text((x+6,y+170),r['name'],font=font,fill='#f3d69e')
  board.save(OUT/(group+'-preview.jpg'),quality=92)
 print(json.dumps({'ready':len(report),'pending':pending},ensure_ascii=True))
if __name__=='__main__':main()
