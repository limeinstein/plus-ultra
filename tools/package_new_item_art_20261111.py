"""2026-11-11 누락 소지품 원화를 보존하고 256×256 투명 WebP로 맞춘다."""
import argparse
import hashlib
import json
import math
import shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts/new-item-art-20261111'
SPEC = json.loads((ROOT / 'docs/art/new-item-prompts-20261111.json').read_text(encoding='utf-8'))

def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def save(asset_id, source, replace=False):
    asset = next(a for a in SPEC['assets'] if a['id'] == asset_id)
    raw, target = ROOT / asset['source'], ROOT / asset['output']
    if target.exists():
        if not replace:
            raise FileExistsError(f'기존 원화 덮어쓰기 차단: {target}')
        old = hashlib.sha256(target.read_bytes()).hexdigest()[:16]
        history = OUT / 'revisions' / asset_id
        history.mkdir(parents=True, exist_ok=True)
        shutil.copy2(target, history / (old + '.webp'))
        if raw.exists():
            shutil.copy2(raw, history / (old + '.png'))
    with Image.open(source) as image:
        image = image.convert('RGBA')
    alpha = image.getchannel('A')
    if alpha.getextrema() != (0, 255):
        raise ValueError(f'투명 배경 확인 필요: {asset_id}')
    box = alpha.point(lambda a: 255 if a >= 8 else 0).getbbox()
    if not box:
        raise ValueError(f'빈 그림: {asset_id}')
    icon = image.crop(box)
    size, margin = SPEC['size'], SPEC['margin']
    icon.thumbnail((size-2*margin, size-2*margin), Image.Resampling.LANCZOS)
    result = Image.new('RGBA', (size, size))
    result.paste(icon, ((size-icon.width)//2, (size-icon.height)//2))
    raw.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, raw)
    target.parent.mkdir(parents=True, exist_ok=True)
    result.save(target, 'WEBP', quality=95, method=6, exact=True)
    record = {**asset, 'date': SPEC['date'], 'tool': SPEC['tool'], 'generated_source': str(source),
              'size': [size,size], 'alpha': list(result.getchannel('A').getextrema()),
              'sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'bytes': target.stat().st_size}
    fixes = OUT / 'qa-fixes.json'
    if replace and fixes.exists():
        record.update(json.loads(fixes.read_text(encoding='utf-8')).get(asset_id, {}))
    write(OUT/'records'/f'{asset_id}.json', record)
    print(f'저장: {asset_id}')

def package():
    assets = [a for a in SPEC['assets'] if (ROOT/a['output']).exists()]
    records = []
    for a in assets:
        with Image.open(ROOT/a['output']) as im:
            assert im.size == (256,256) and im.mode == 'RGBA', a['id']
            assert im.getchannel('A').getextrema() == (0,255), a['id']
            x0,y0,x1,y1 = im.getchannel('A').getbbox()
            assert min(x0,y0,256-x1,256-y1) >= SPEC['margin']-1, a['id']
        records.append(json.loads((OUT/'records'/f'{a["id"]}.json').read_text(encoding='utf-8')))
    write(OUT/'assets.json', {'completed':len(assets),'total':len(SPEC['assets']),'assets':records})
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 14)
    small = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 11)
    heading = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 23)
    for dark in [False,True]:
        bg,fg = ('#1c2c3c','#e8dbc4') if dark else ('#e9dcc0','#33291d')
        canvas = Image.new('RGB',(6*216,math.ceil(len(SPEC['assets'])/6)*230+68),bg)
        d = ImageDraw.Draw(canvas)
        d.text((16,12),f'새 소지품 원화 {len(assets)}/{len(SPEC["assets"])}종 · 2026-11-11',font=heading,fill=fg)
        for i,a in enumerate(SPEC['assets']):
            x,y = i%6*216,i//6*230+68
            path = ROOT/a['output']
            if path.exists():
                with Image.open(path) as im:
                    im = im.convert('RGBA')
                    im.thumbnail((182,182),Image.Resampling.LANCZOS)
                    canvas.paste(im,(x+(216-im.width)//2,y),im)
            name,lines = a['name'],[]
            while name:
                n=len(name)
                while n>1 and d.textlength(name[:n],font=font)>202:
                    n-=1
                lines.append(name[:n]); name=name[n:]
            for k,line in enumerate(lines[:2]):
                d.text((x+7,y+179+k*17),line,font=font,fill=fg)
            d.text((x+7,y+215),a['id'],font=small,fill=fg)
        path = OUT/'preview-dark.jpg' if dark else ROOT/'docs/art/new-item-preview-20261111.jpg'
        path.parent.mkdir(parents=True,exist_ok=True)
        canvas.save(path,quality=95)
    print(f'소지품 {len(assets)}/{len(SPEC["assets"])}종 저장·검증')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--id')
    parser.add_argument('--source',type=Path)
    parser.add_argument('--replace',action='store_true')
    args = parser.parse_args()
    if args.id and args.source:
        save(args.id,args.source,args.replace)
    elif args.id or args.source:
        parser.error('--id와 --source를 함께 지정하세요')
    else:
        package()
