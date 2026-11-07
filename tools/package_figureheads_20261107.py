"""누락 선수상 원화를 192×192 투명 WebP로 저장하고 점검판을 만든다."""
import argparse
import hashlib
import json
import math
import shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
HERE = ROOT / 'artifacts/figureheads-20261107'
SPEC = json.loads((ROOT / 'docs/art/figureheads-prompts-20261107.json').read_text(encoding='utf-8'))

def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def save(asset_id, source):
    asset = next(a for a in SPEC['assets'] if a['id'] == asset_id)
    target, output = ROOT / asset['source'], ROOT / asset['file']
    if output.exists():
        raise FileExistsError(f'기존 그림 보존: {output}')
    with Image.open(source) as raw:
        raw = raw.convert('RGBA')
        assert raw.getchannel('A').getextrema() == (0, 255), source
        alpha = raw.getchannel('A').point(lambda a: 255 if a > 8 else 0)
        icon = raw.crop(alpha.getbbox())
        icon.thumbnail((164, 164), Image.Resampling.LANCZOS)
        result = Image.new('RGBA', (192, 192))
        result.paste(icon, ((192-icon.width)//2, (192-icon.height)//2))
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        result.save(output, quality=95, method=6, exact=True)
        record = {**asset, 'tool': SPEC['tool'], 'generated_source': str(source),
                  'size': [192, 192], 'alpha': list(result.getchannel('A').getextrema()),
                  'sha256': hashlib.sha256(output.read_bytes()).hexdigest()}
        write(HERE / 'records' / f'{asset_id}.json', record)
    print(f'저장: {asset_id}')

def preview():
    complete = [a for a in SPEC['assets'] if (ROOT / a['file']).exists()]
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 14)
    small = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 12)
    for dark in [False, True]:
        background, text = ('#1c2c3c', '#ecdfc7') if dark else ('#e8d9b9', '#302519')
        canvas = Image.new('RGB', (6*216, math.ceil(len(SPEC['assets'])/6)*246+52), background)
        draw = ImageDraw.Draw(canvas)
        draw.text((14, 14), f'발견·전설 선수상 {len(complete)}/{len(SPEC["assets"])}종 · 투명 WebP 192×192', fill=text, font=font)
        for i, a in enumerate(SPEC['assets']):
            x, y = i%6*216, i//6*246+52
            path = ROOT/a['file']
            if path.exists():
                with Image.open(path) as icon:
                    icon = icon.convert('RGBA')
                    canvas.paste(icon, (x+12,y), icon)
            draw.text((x+10,y+194), a['name'][:16], fill=text, font=font)
            draw.text((x+10,y+220), a['id'], fill=text, font=small)
        path = HERE/'preview-dark.jpg' if dark else ROOT/'docs/art/figureheads-preview-20261107.jpg'
        path.parent.mkdir(parents=True, exist_ok=True)
        canvas.save(path, quality=95)
    records = [json.loads((HERE/'records'/f'{a["id"]}.json').read_text(encoding='utf-8')) for a in complete]
    write(HERE/'files-report.json', {'completed': len(complete), 'requested': len(SPEC['assets']), 'assets': records})
    print(f'선수상 {len(complete)}/{len(SPEC["assets"])}종 저장')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--id')
    parser.add_argument('--source', type=Path)
    args = parser.parse_args()
    if args.id and args.source:
        save(args.id, args.source)
    elif args.id or args.source:
        parser.error('--id와 --source를 함께 지정하세요')
    else:
        preview()
