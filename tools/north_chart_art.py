"""2026-10-30 도시 10곳·미지 지도 삽화 10종을 내보내고 검토판을 만든다."""
import json
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont
ROOT = Path(__file__).resolve().parents[1]
font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 19)
def records(name):
    return json.loads((ROOT / 'tools' / name).read_text(encoding='utf-8'))
def export(rows, city=False):
    width, height = (400, 225) if city else (240, 240)
    cols = 2 if city else 5
    board = Image.new('RGB', (cols * width, ((len(rows)+cols-1)//cols) * (height+35)), '#e2d0a3')
    draw = ImageDraw.Draw(board)
    for i, row in enumerate(rows):
        im = Image.open(row['path']).convert('RGB' if city else 'RGBA')
        if city:
            key = ('backgrounds/steppe-20261030/' if row['id'] < 309 else 'backgrounds/') + str(row['id']) + '.jpg'
            im = ImageOps.fit(im, (1600, 900), Image.Resampling.LANCZOS)
            dest = ROOT / 'images' / key
            dest.parent.mkdir(parents=True, exist_ok=True)
            im.save(dest, quality=93, subsampling=0)
            thumb = im.resize((width, height), Image.Resampling.LANCZOS)
        else:
            alpha_min, alpha_max = im.getchannel('A').getextrema()
            assert alpha_min == 0 and alpha_max > 0, row['id']
            im.thumbnail((640, 640), Image.Resampling.LANCZOS)
            dest = ROOT / 'images/chart' / (row['id'] + '.webp')
            im.save(dest, quality=92, method=4)
            thumb = im.copy(); thumb.thumbnail((width-10, height-10), Image.Resampling.LANCZOS)
        x, y = i%cols * width, i//cols * (height+35)
        draw.text((x+8, y+5), str(row.get('name', row['id'])), font=font, fill='#50391f')
        board.paste(thumb, (x+(width-thumb.width)//2, y+35+(height-thumb.height)//2), thumb if not city else None)
    board.save(ROOT / 'docs/art' / ('north-cities-20261030.jpg' if city else 'chart-legends-20261030.jpg'), quality=94)
    print(('cities' if city else 'chart legends') + ': ' + str(len(rows)))
export(records('chart_legend_sources_20261030.json'))
export(records('north_city_sources_20261030.json'), True)
