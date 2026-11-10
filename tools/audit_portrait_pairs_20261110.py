"""제작 기록과 현재 초상 파일을 비교해 짝이 달라진 후보를 찾는다. 원화는 수정하지 않는다."""
import json
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts/portrait-pairs-20261110'


def thumb(file, size=(128, 192)):
    im = Image.open(file).convert('RGBA')
    im = ImageOps.contain(im, size)
    bg = Image.new('RGBA', size, '#30373c')
    bg.alpha_composite(im, ((size[0]-im.width)//2, (size[1]-im.height)//2))
    return bg.convert('RGB')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    text = (ROOT/'images/manifest.js').read_text(encoding='utf-8')
    files = json.loads(re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', text).group(1))
    plan = json.loads((ROOT/'tools/event_art_20261031_prompts.json').read_text(encoding='utf-8'))
    imjin = json.loads((ROOT/'tools/imjin_portrait_prompts.json').read_text(encoding='utf-8'))
    candidates = plan['portraits'] + imjin['assets']
    for source in (ROOT/'artifacts/imjin-missing-art-20261031/sources').glob('*_half.png'):
        ident=source.stem.removesuffix('_half')
        face=source.with_name(ident+'_face.png')
        key=next((k for k in ('portraits/history/'+ident,'portraits/legendary/'+ident,'portraits/mates/'+ident) if k in files),None)
        if key and face.is_file():
            candidates.append(dict(id=ident,name=ident,key=key,half_source=source.relative_to(ROOT).as_posix(),face_source=face.relative_to(ROOT).as_posix()))
    rows = []
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 17)
    for row in candidates:
        row = dict(row)
        if not row['key'].startswith('portraits/'):
            row['key'] = 'portraits/' + row['key']
        if row['key'] not in files or not all((ROOT/row[k+'_source']).is_file() for k in ('face','half')):
            continue
        item = {k:row[k] for k in ['id','name','key','face_source','half_source']}
        for kind, suffix in [('face',''),('half','_half')]:
            current = ROOT/'images'/files[row['key']+suffix]
            source = ROOT/row[kind+'_source']
            a,b = thumb(current),thumb(source)
            item[kind+'_difference'] = round(float(np.abs(np.asarray(a,dtype=float)-np.asarray(b,dtype=float)).mean()),3)
        rows.append(item)
    for offset in range(0,len(rows),8):
        sheet = Image.new('RGB',(1440,520),'#30373c'); d=ImageDraw.Draw(sheet)
        for j,row in enumerate(rows[offset:offset+8]):
            x,y=(j%4)*360,(j//4)*260
            d.text((x+4,y+3),row['name'],font=font,fill='white')
            for k,(kind,source) in enumerate([('face',False),('half',False),('half',True)]):
                p=ROOT/row['half_source'] if source else ROOT/'images'/files[row['key']+('_half' if kind=='half' else '')]
                sheet.paste(thumb(p,(116,195)),(x+k*120,y+30))
            d.text((x+4,y+230),'현재 얼굴 | 현재 몸 | 보관 원화',font=font,fill='white')
        sheet.save(OUT/('audit-'+str(offset//8)+'.jpg'),quality=94)
    (OUT/'source-audit.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    for row in rows:
        print(row['id'],row['face_difference'],row['half_difference'])


if __name__=='__main__':
    main()
