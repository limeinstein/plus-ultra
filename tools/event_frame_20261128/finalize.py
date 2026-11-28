"""선정한 9:4 재작화만 원본 보존 폴더와 게임 표시본으로 저장한다."""
import hashlib
import json
import shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps

ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).parent
OUT=ROOT/'artifacts/event-frame-20261128'
JOBS=json.loads((HERE/'prompts.json').read_text(encoding='utf-8'))

def main():
    assets=[]
    overrides={}
    missing=[]
    wrong=[]
    for job in JOBS:
        receipt=HERE/'receipts'/f"{job['id']}.json"
        if not receipt.exists():
            missing.append(job['key']);continue
        r=json.loads(receipt.read_text(encoding='utf-8'))
        assert hashlib.sha256((ROOT/'images'/job['originalFile']).read_bytes()).hexdigest()==job['sourceSha256'],job['key']
        source=Path(r['generated'])
        with Image.open(source) as im:
            w,h=im.size
            if w*4!=h*9:
                wrong.append(dict(key=job['key'],size=[w,h],generated=str(source)));continue
            original=ROOT/'art_sources/event-frame-20261128'/f"{job['id']}.png"
            original.parent.mkdir(parents=True,exist_ok=True)
            unchanged=original.exists() and hashlib.sha256(original.read_bytes()).digest()==hashlib.sha256(source.read_bytes()).digest()
            if not unchanged:
                shutil.copy2(source,original)
            rel=f"event-frame-20261128/{job['key']}.webp"
            target=ROOT/'images'/rel
            target.parent.mkdir(parents=True,exist_ok=True)
            # 동일 비율의 해상도만 통일한다. 자르기·찌그러뜨리기·여백 추가는 하지 않는다.
            if not unchanged or not target.exists():
                image=im.convert('RGB')
                if image.size!=(1881,836):image=image.resize((1881,836),Image.Resampling.LANCZOS)
                image.save(target,quality=94,method=6)
            with Image.open(target) as saved:assert saved.size==(1881,836),target
        for key in job['aliases']:overrides[key]=rel
        assets.append(dict(key=job['key'],aliases=job['aliases'],file=rel,width=1881,height=836,
                           originalFile=job['originalFile'],originalSize=job['originalSize'],
                           originalSha256=job['sourceSha256'],
                           source=str(original.relative_to(ROOT)).replace('\\','/'),
                           sha256=hashlib.sha256(target.read_bytes()).hexdigest(),prompt=r['prompt']))
    (HERE/'conversion-status.json').write_text(json.dumps(dict(done=len(assets),missing=missing,wrong=wrong),ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(dict(done=len(assets),missing=len(missing),wrong=wrong),ensure_ascii=True))
    if missing or wrong:return
    (HERE/'assets.json').write_text(json.dumps(assets,ensure_ascii=False,indent=2),encoding='utf-8')
    used=[dict(key=a['key'],prompt=a['prompt'],mode='built-in image_gen edit',reference='images/'+a['originalFile']) for a in assets]
    (HERE/'used-prompts.json').write_text(json.dumps(used,ensure_ascii=False,indent=2),encoding='utf-8')
    (HERE/'asset-overrides.json').write_text(json.dumps(overrides,ensure_ascii=False,indent=2),encoding='utf-8')
    OUT.mkdir(parents=True,exist_ok=True)
    for start in range(0,len(assets),12):
        group=assets[start:start+12]
        sheet=Image.new('RGB',(1680,840),'#171b23');draw=ImageDraw.Draw(sheet)
        for i,a in enumerate(group):
            with Image.open(ROOT/'images'/a['file']) as im:thumb=ImageOps.contain(im,(420,230))
            x,y=i%4*420,i//4*280
            sheet.paste(thumb,(x,y));draw.text((x+4,y+233),a['key'][:55],fill='white')
            draw.text((x+4,y+252),'1881 x 836 / 9:4',fill='#e7c384')
        sheet.save(OUT/f"after-{start//12+1:02}.jpg",quality=94)

if __name__=='__main__':main()
