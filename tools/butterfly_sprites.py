"""나비·나방 비행 원화 17종을 투명 4×2 게임 시트와 검토판으로 내보낸다."""
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
rows = json.loads((ROOT / 'tools/butterfly_sprite_sources_20261031.json').read_text(encoding='utf-8-sig'))
out = ROOT / 'images/effects/butterflies'
out.mkdir(parents=True, exist_ok=True)
preview = Image.new('RGB', (1200, ((len(rows) + 2) // 3) * 225), '#a7b6ad')
draw = ImageDraw.Draw(preview)
for i, row in enumerate(rows):
    dest = out / (row['id'] + '.webp')
    if not dest.exists():
        sheet = Image.open(row['path']).convert('RGBA').resize((1024, 512), Image.Resampling.LANCZOS)
        sheet.save(dest, quality=93, method=4)
    sheet = Image.open(dest).convert('RGBA')
    assert sheet.size == (1024, 512), row['id']
    lo, hi = sheet.getchannel('A').getextrema()
    assert lo == 0 and hi > 0, row['id']
    for f in range(8):
        box = (f % 4 * 256, f // 4 * 256, (f % 4 + 1) * 256, (f // 4 + 1) * 256)
        assert sheet.crop(box).getchannel('A').getbbox(), (row['id'], f)
    x, y = i % 3 * 400, i // 3 * 225
    draw.text((x + 10, y + 5), row['id'], fill='#19291c')
    thumb = sheet.resize((380, 190), Image.Resampling.LANCZOS)
    preview.paste(thumb, (x + 10, y + 25), thumb)
preview.save(ROOT / 'docs/art/butterfly-sprites-20261031.jpg', quality=94)
print(f'{len(rows)} sheets, 8 RGBA frames each, 1024x512 verified')
