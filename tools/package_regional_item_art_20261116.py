"""지역 장신구·약의 내장 ImageGen 원본을 256px 투명 게임 그림으로 포장하고 검증한다."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import hashlib,json,math,shutil
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/regional-item-art-20261116'
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def baseline():
 p=OUT/'baseline.json'
 if not p.exists():p.write_text(json.dumps({x.name:sha(x) for x in (ROOT/'images/items').glob('*') if x.is_file()},ensure_ascii=False,indent=2),encoding='utf-8')
def package():
 specs=json.loads((OUT/'prompts.json').read_text(encoding='utf-8'))
 records=json.loads((OUT/'generated.json').read_text(encoding='utf-8-sig'))
 lookup={r['id']:r for r in records};done=[]
 cachefile=OUT/'assets.json'
 cached={a['id']:a for a in json.loads(cachefile.read_text(encoding='utf-8'))['assets']} if cachefile.exists() else {}
 for a in specs:
  r=lookup[a['id']];src=Path(r['source']);raw=OUT/'raw'/f"{a['id']}.png";target=ROOT/a['output']
  old=cached.get(a['id'])
  if old and old.get('generated_source')==str(src) and target.exists() and sha(target)==old.get('sha256') and raw.exists():
   done.append(old);continue
  raw.parent.mkdir(parents=True,exist_ok=True)
  if r.get('previousSource'):
   previous=Path(r['previousSource']);history=OUT/'revisions'/a['id'];history.mkdir(parents=True,exist_ok=True)
   shutil.copy2(previous,history/(sha(previous)[:16]+'.png'))
  if raw.exists() and sha(raw)!=sha(src):
   history=OUT/'revisions'/a['id'];history.mkdir(parents=True,exist_ok=True)
   shutil.copy2(raw,history/(sha(raw)[:16]+'.png'))
   shutil.copy2(src,raw)
  elif not raw.exists():shutil.copy2(src,raw)
  with Image.open(raw) as im:
   im=im.convert('RGBA');alpha=im.getchannel('A');assert alpha.getextrema()==(0,255),f"알파 확인: {a['id']}"
   box=alpha.point(lambda x:255 if x>=8 else 0).getbbox();assert box,f"빈 그림: {a['id']}"
   icon=im.crop(box);icon.thumbnail((230,230),Image.Resampling.LANCZOS)
   result=Image.new('RGBA',(256,256));result.paste(icon,((256-icon.width)//2,(256-icon.height)//2))
   if target.exists():
    old=json.loads((OUT/'baseline.json').read_text(encoding='utf-8'));assert target.name not in old,'기존 그림 덮어쓰기 차단'
   result.save(target,'WEBP',quality=95,method=6,exact=True)
  a.update(prompt=r['prompt'],source=str(raw.relative_to(ROOT)),generated_source=str(src),sha256=sha(target),bytes=target.stat().st_size,tool='built-in image_gen',size=[256,256]);done.append(a)
 (OUT/'assets.json').write_text(json.dumps({'completed':len(done),'total':70,'assets':done},ensure_ascii=False,indent=2),encoding='utf-8')
 (ROOT/'docs/art/regional-item-prompts-20261116.json').write_text(json.dumps({'tool':'built-in image_gen','assets':done},ensure_ascii=False,indent=2),encoding='utf-8')
 verify(done);preview(done)
def verify(done):
 for a in done:
  with Image.open(ROOT/a['output']) as im:
   assert im.mode=='RGBA' and im.size==(256,256),a['id']
   alpha=im.getchannel('A');assert alpha.getextrema()==(0,255),a['id']
   x0,y0,x1,y1=alpha.getbbox();assert min(x0,y0,256-x1,256-y1)>=12,a['id']
 old=json.loads((OUT/'baseline.json').read_text(encoding='utf-8'));assert all(sha(ROOT/'images/items'/n)==h for n,h in old.items()),'기존 원화 변경'
 print(f'검증 통과: {len(done)}/70종, 256×256 투명·여백·기존 {len(old)}개 보존')
def preview(done):
 font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',14)
 for dark in [False,True]:
  bg,fg=('#1e2935','#f2e5cf') if dark else ('#e8dcc4','#33291d')
  sheet=Image.new('RGB',(7*190,math.ceil(len(done)/7)*206+55),bg);d=ImageDraw.Draw(sheet)
  d.text((15,14),'지역 장신구·보석 50종 / 회복약 20종',font=font,fill=fg)
  for i,a in enumerate(done):
   x,y=i%7*190,i//7*206+55
   with Image.open(ROOT/a['output']) as im:
    im=im.convert('RGBA');im.thumbnail((168,168),Image.Resampling.LANCZOS);sheet.paste(im,(x+(190-im.width)//2,y),im)
   name=a['name'];n=len(name)
   while n>1 and d.textlength(name[:n],font=font)>180:n-=1
   d.text((x+5,y+169),name[:n],font=font,fill=fg)
   if n<len(name):d.text((x+5,y+186),name[n:],font=font,fill=fg)
  sheet.save(OUT/('preview-dark.jpg' if dark else 'preview.jpg'),quality=94)
if __name__=='__main__':
 import sys
 OUT.mkdir(parents=True,exist_ok=True);baseline()
 if '--baseline' not in sys.argv:package()
