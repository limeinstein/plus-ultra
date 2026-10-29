"""생성 원화를 4열×2행 게임 시트로 내보내고 전체 검토판을 만든다."""
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
sources = json.loads((ROOT / 'tools/bird_sprite_sources.json').read_text(encoding='utf-8'))
out = ROOT / 'images/effects/birds'
out.mkdir(parents=True, exist_ok=True)
preview = Image.new('RGB', (1000, ((len(sources) + 3) // 4) * 160), '#9cabae')
draw = ImageDraw.Draw(preview)
for i, source in enumerate(sources):
    original = Path(source['path'])
    dest = out / (source['id'] + '.webp')
    if original.exists() and not dest.exists():
        sheet = Image.open(original).convert('RGBA').resize((1024, 512), Image.Resampling.LANCZOS)
        sheet.save(dest, quality=92, method=4)
    else:
        sheet = Image.open(dest).convert('RGBA')
    assert sheet.size == (1024, 512)
    assert sheet.getchannel('A').getextrema() == (0, 255), source['id']
    for f in range(8):
        cell = sheet.crop(((f % 4) * 256, (f // 4) * 256, (f % 4 + 1) * 256, (f // 4 + 1) * 256))
        assert cell.getchannel('A').getbbox(), (source['id'], f)
    thumb = sheet.resize((240, 120), Image.Resampling.LANCZOS)
    x, y = i % 4 * 250 + 5, i // 4 * 160 + 24
    preview.paste(thumb, (x, y), thumb)
    draw.text((x + 5, y - 17), source['id'], fill='black')
preview.save(ROOT / 'docs/art/bird-sprites-preview.jpg', quality=92)
print(f'{len(sources)} sheets, 8 frames each, RGBA 1024x512 verified')
