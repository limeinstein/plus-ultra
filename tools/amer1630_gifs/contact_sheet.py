"""갈래별 마지막 장면과 주요 장면을 한눈에 보는 검수판."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'artifacts/discovery-gif-import-20261029'
OUT.mkdir(parents=True, exist_ok=True)
rows = json.loads((ROOT / 'docs/art/amer1630-gif-prompts.json').read_text(encoding='utf-8'))['items']
font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 15)
for kind in ['nature', 'plant', 'animal', 'ruin']:
    group = [r for r in rows if r['kind'] == kind and (ROOT/'images/discovery-ends'/(r['id']+'.jpg')).exists()]
    if not group:
        continue
    cols, w, h = 4, 288, 154
    result = Image.new('RGB', (cols*w, ((len(group)+cols-1)//cols)*h), '#141c25')
    draw = ImageDraw.Draw(result)
    for i, r in enumerate(group):
        x, y = i % cols*w, i // cols*h
        with Image.open(ROOT/'images/discoveries'/(r['id']+'.gif')) as im:
            im.seek(min(10, im.n_frames-1) if kind == 'nature' else im.n_frames-1)
            result.paste(im.convert('RGB').resize((288, 128), Image.Resampling.LANCZOS), (x, y))
        draw.text((x+6, y+130), r['name'] + ' / ' + r['id'], font=font, fill='#f3ddb5')
    target = OUT / (kind+'-contact.jpg')
    result.save(target, quality=90)
    print(target)
