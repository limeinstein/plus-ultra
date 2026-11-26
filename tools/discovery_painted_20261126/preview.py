"""교체된 회화의 육안 검사와 이전 GIF 비교용 그림 모음."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / 'artifacts/discovery-painted-20261126'
font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 12)
plan = json.loads((HERE / 'plan.json').read_text(encoding='utf-8'))
rows = [r for r in plan['generate'] + plan['recompose'] if (HERE / 'receipts' / (r['id'] + '.json')).exists()]
for start in range(0, len(rows), 54):
    part = rows[start:start+54]
    canvas = Image.new('RGB', (1200, ((len(part)+5)//6)*112), '#efe9dc')
    draw = ImageDraw.Draw(canvas)
    for i, row in enumerate(part):
        x, y = i % 6 * 200, i // 6 * 112
        with Image.open(ROOT / 'images/discovery-ends' / (row['id']+'.jpg')) as im:
            canvas.paste(im.resize((198,88)), (x,y))
        draw.text((x+2,y+89), row['id']+' '+row['name'], font=font, fill='#231e19')
    canvas.save(OUT / f'progress-{start//54+1:02}.jpg', quality=92)
ids = ['giza','muyeol','moonjar','t_pepper','canyon','sequoia']
canvas = Image.new('RGB', (1440, len(ids)*130), '#efe9dc')
draw = ImageDraw.Draw(canvas)
for row, did in enumerate(ids):
    for side, path in enumerate([HERE/'before/images/discoveries'/f'{did}.gif', ROOT/'images/discoveries'/f'{did}.gif']):
        if not path.exists():
            continue
        with Image.open(path) as im:
            for col, idx in enumerate([0,im.n_frames//2,im.n_frames-1]):
                im.seek(idx)
                canvas.paste(im.convert('RGB').resize((240,107)),(side*720+col*240,row*130))
    draw.text((5,row*130+108), did+' 이전 / 새 회화',font=font,fill='#231e19')
canvas.save(OUT/'painted-before-after.jpg', quality=92)
print('회화', len(rows), '미리보기', (len(rows)+53)//54)
