"""중세 해도 장식을 투명 WebP로 내보낸다. 생성 원화는 그대로 둔다."""
import json
from pathlib import Path
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parents[1]
sources = json.loads((ROOT / 'tools/chart_art_sources.json').read_text(encoding='utf-8'))
out = ROOT / 'images/chart'
out.mkdir(parents=True, exist_ok=True)
preview = Image.new('RGB', (1200, 340), '#e2d0a3')
d = ImageDraw.Draw(preview)
for i, row in enumerate(sources):
    im = Image.open(row['path']).convert('RGBA')
    im.thumbnail((640, 640), Image.Resampling.LANCZOS)
    assert im.getchannel('A').getextrema() == (0, 255)
    im.save(out / (row['id'] + '.webp'), quality=92, method=4)
    im.thumbnail((280, 280), Image.Resampling.LANCZOS)
    preview.paste(im, (i * 300 + (300-im.width)//2, 35 + (280-im.height)//2), im)
    d.text((i*300 + 20, 12), row['id'], fill='#694e2a')
preview.save(ROOT / 'docs/art/chart-motifs-preview.jpg', quality=93)
print('4 transparent chart motifs exported and verified')
