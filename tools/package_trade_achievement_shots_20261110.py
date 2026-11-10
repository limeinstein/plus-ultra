"""대단한 거래 5종과 교역왕의 생성 원본을 게임 규격으로 저장하고 등록한다."""
import hashlib
import json
import re
import shutil
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/trade-achievement-shots-20261110'
PLAN=ROOT/'tools/trade_achievement_shots_20261110_prompts.json'


def main():
    plan=json.loads(PLAN.read_text(encoding='utf-8'))
    assert len(plan['scenes'])==6
    (OUT/'sources').mkdir(parents=True,exist_ok=True)
    exports=[]; checks=[]
    preview=Image.new('RGB',(1440,3*362),'#30373c')
    draw=ImageDraw.Draw(preview);font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',23)
    for i,row in enumerate(plan['scenes']):
        source=OUT/'sources'/(row['id']+'.png')
        if not source.exists():shutil.copy2(row['source'],source)
        im=Image.open(source).convert('RGB')
        original_size=im.size
        picture=ImageOps.fit(im,(1881,836),Image.Resampling.LANCZOS,centering=(.5,.5))
        destination=ROOT/'images/achievement-events'/(row['id']+'.webp')
        if not destination.exists():picture.save(destination,'WEBP',quality=95,method=4)
        with Image.open(destination) as actual:
            actual.load();assert actual.size==(1881,836) and actual.mode=='RGB'
            if original_size==(1881,836):
                assert sum(abs(a-b) for a,b in zip(actual.resize((48,24)).tobytes(),picture.resize((48,24)).tobytes()))/(48*24*3)<3
        row['workspace_source']=source.relative_to(ROOT).as_posix()
        row['file']=destination.relative_to(ROOT).as_posix()
        row['size']=[1881,836]
        row['sha256']=hashlib.sha256(destination.read_bytes()).hexdigest()
        checks.append(dict(id=row['id'],file=row['file'],source_size=list(original_size),size=row['size'],sha256=row['sha256']))
        x,y=(i%2)*720,(i//2)*362
        preview.paste(picture.resize((708,315),Image.Resampling.LANCZOS),(x+6,y+4))
        draw.text((x+12,y+326),row['name'],font=font,fill='#f3e6ca')
        exports.append(destination)
    manifest=ROOT/'images/manifest.js'
    text=manifest.read_text(encoding='utf-8');match=re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});',text)
    files=json.loads(match.group(1))
    for row in plan['scenes']:
        value=row['file'].removeprefix('images/')
        assert row['key'] not in files or files[row['key']]==value
        files[row['key']]=value
    manifest.write_text(text[:match.start()]+'G.IMAGE_FILES = '+json.dumps(dict(sorted(files.items())),ensure_ascii=False,indent=2)+';'+text[match.end():],encoding='utf-8',newline='\n')
    PLAN.write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (OUT/'asset-checks.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    preview.save(OUT/'preview.jpg',quality=94)
    with zipfile.ZipFile(OUT/'trade-achievement-shots-20261110.zip','w',zipfile.ZIP_DEFLATED) as archive:
        for file in exports+[PLAN,OUT/'asset-checks.json',OUT/'preview.jpg']:
            archive.write(file,file.relative_to(ROOT).as_posix())
    print('6 achievement shots exported, registered, preserved and packaged')


if __name__=='__main__':
    main()
