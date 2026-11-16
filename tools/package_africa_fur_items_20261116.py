"""아프리카 동물 문양 장신구·북방 모피 코트 원화를 256px 투명 WebP로 포장한다."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,shutil,math
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts/africa-fur-items-20261116'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def baseline():
 p=OUT/'baseline.json'
 if not p.exists():p.write_text(json.dumps({x.name:sha(x) for x in (ROOT/'images/items').glob('*') if x.is_file()},indent=2),encoding='utf-8')
def main():
 baseline();items=json.loads((OUT/'items.json').read_text(encoding='utf-8'));records={a['id']:a for a in json.loads((OUT/'generated.json').read_text(encoding='utf-8'))};done=[]
 assert len(items)==len(records)==15
 old=json.loads((OUT/'baseline.json').read_text(encoding='utf-8'));rawdir=OUT/'raw';rawdir.mkdir(exist_ok=True)
 for a in items:
  r=records[a['id']];src=Path(r['source']);raw=rawdir/(a['id']+'.png');target=ROOT/r['file']
  if raw.exists() and sha(raw)!=sha(src):
   hist=OUT/'revisions'/a['id'];hist.mkdir(parents=True,exist_ok=True);shutil.copy2(raw,hist/(sha(raw)[:16]+'.png'))
  if not raw.exists() or sha(raw)!=sha(src):shutil.copy2(src,raw)
  assert target.name not in old,'기존 원화 덮어쓰기 차단'
  with Image.open(raw) as im:
   im=im.convert('RGBA');alpha=im.getchannel('A');assert alpha.getextrema()==(0,255),a['id']+' 투명도'
   box=alpha.point(lambda x:255 if x>=8 else 0).getbbox();assert box,a['id']+' 빈 원화';icon=im.crop(box);icon.thumbnail((230,230),Image.Resampling.LANCZOS)
   canvas=Image.new('RGBA',(256,256));canvas.paste(icon,((256-icon.width)//2,(256-icon.height)//2));canvas.save(target,'WEBP',quality=95,method=6,exact=True)
   x0,y0,x1,y1=canvas.getchannel('A').getbbox();assert min(x0,y0,256-x1,256-y1)>=12
  done.append({**a,**r,'workspace_source':raw.relative_to(ROOT).as_posix(),'size':[256,256],'sha256':sha(target),'bytes':target.stat().st_size,'tool':'built-in image_gen'})
 assert all(sha(ROOT/'images/items'/name)==h for name,h in old.items()),'기존 아이템 원화 변경'
 (OUT/'assets.json').write_text(json.dumps({'completed':15,'assets':done},ensure_ascii=False,indent=2),encoding='utf-8')
 (ROOT/'tools/africa_fur_item_prompts_20261116.json').write_text(json.dumps({'tool':'built-in image_gen','assets':done},ensure_ascii=False,indent=2),encoding='utf-8')
 font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',17)
 for dark in [False,True]:
  bg,fg=('#202b36','#f5e4c8') if dark else ('#e7dbc3','#3b2c1c');sheet=Image.new('RGB',(5*232,3*262+48),bg);d=ImageDraw.Draw(sheet);d.text((12,12),'아프리카 동물 장신구 10종 · 북방 모피 코트 5종',font=font,fill=fg)
  for i,a in enumerate(done):
   x,y=i%5*232,i//5*262+48
   with Image.open(ROOT/a['file']) as im:
    im=im.convert('RGBA');im.thumbnail((208,208));sheet.paste(im,(x+(232-im.width)//2,y),im)
   d.text((x+6,y+216),a['name'],font=font,fill=fg)
  sheet.save(OUT/('preview-dark.jpg' if dark else 'preview.jpg'),quality=95)
 print(json.dumps({'items':len(done),'preserved':len(old),'size':[256,256],'alpha':'transparent'}))
if __name__=='__main__':
 import sys
 OUT.mkdir(exist_ok=True,parents=True);baseline()
 if '--baseline' not in sys.argv:main()
