"""시장 수집 업적샷 9종을 1881×836으로 저장하고 그림 목록에 등록한다."""
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw,ImageFont
import json,shutil,hashlib,re
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts/market-collection-achievements-20261116';PLAN=ROOT/'tools/market_collection_achievement_shots_20261116_prompts.json'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 OUT.mkdir(parents=True,exist_ok=True);raw=OUT/'sources';raw.mkdir(exist_ok=True)
 baseline=OUT/'baseline.json'
 if not baseline.exists():baseline.write_text(json.dumps({p.name:sha(p) for p in (ROOT/'images/achievement-events').glob('*') if p.is_file()},indent=2),encoding='utf-8')
 plan=json.loads(PLAN.read_text(encoding='utf-8'));assert len(plan['scenes'])==9
 canvas=Image.new('RGB',(1560,3*270),'#252c35');d=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',18);checks=[]
 order=['collect_jewel10','collect_jewel25','collect_jewel50','collect_jewel_regions','collect_legend_jewels','collect_medicine5','collect_medicine10','collect_medicine20','collect_market70']
 plan['scenes'].sort(key=lambda a:order.index(a['id']))
 for i,a in enumerate(plan['scenes']):
  source=raw/(a['id']+'.png');target=ROOT/a['file'];src=Path(a['source'])
  changed=not source.exists() or sha(source)!=sha(src)
  if changed:
   if source.exists():
    history=OUT/'revisions'/a['id'];history.mkdir(parents=True,exist_ok=True)
    shutil.copy2(source,history/(sha(source)[:16]+'.png'))
   shutil.copy2(src,source)
  with Image.open(source) as im:
   size=list(im.size);picture=ImageOps.fit(im.convert('RGB'),(1881,836),Image.Resampling.LANCZOS,centering=(.5,.5))
  if target.exists():assert target.name not in json.loads(baseline.read_text(encoding='utf-8')),'기존 업적샷 덮어쓰기 차단'
  if changed or not target.exists() or sha(target)!=a.get('sha256'):
   picture.save(target,'WEBP',quality=95,method=4)
  with Image.open(target) as actual:assert actual.size==(1881,836) and actual.mode=='RGB'
  a.update(workspace_source=source.relative_to(ROOT).as_posix(),size=[1881,836],source_size=size,sha256=sha(target),bytes=target.stat().st_size)
  x,y=i%3*520,i//3*270;canvas.paste(picture.resize((508,226),Image.Resampling.LANCZOS),(x+6,y+4));d.text((x+10,y+237),a['name'],font=font,fill='#f2dfbb');checks.append({k:a[k] for k in ['id','name','file','key','size','source_size','sha256','bytes']})
 canvas.save(OUT/'preview.jpg',quality=95)
 assert all(sha(ROOT/'images/achievement-events'/n)==h for n,h in json.loads(baseline.read_text(encoding='utf-8')).items()),'기존 업적샷 변경'
 manifest=ROOT/'images/manifest.js';text=manifest.read_text(encoding='utf-8');m=re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});',text);files=json.loads(m.group(1))
 for a in plan['scenes']:
  value=a['file'].removeprefix('images/');assert a['key'] not in files or files[a['key']]==value;files[a['key']]=value
 manifest.write_text(text[:m.start()]+'G.IMAGE_FILES = '+json.dumps(dict(sorted(files.items())),ensure_ascii=False,indent=2)+';'+text[m.end():],encoding='utf-8',newline='\n')
 PLAN.write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8');(OUT/'asset-checks.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps({'shots':len(checks),'source_sizes':[a['source_size'] for a in checks],'output_size':[1881,836],'existing_preserved':len(json.loads(baseline.read_text(encoding='utf-8')))},ensure_ascii=True))
if __name__=='__main__':main()
