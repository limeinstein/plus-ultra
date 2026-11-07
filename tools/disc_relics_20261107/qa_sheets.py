"""저장된 아이콘을 36장씩 나누어 검수판으로 만든다."""
from pathlib import Path
import sys
from PIL import Image, ImageDraw, ImageFont, UnidentifiedImageError
from package import ASSETS, ROOT, HERE

out = HERE / 'qa'
out.mkdir(exist_ok=True)
font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 13)
dark = '--dark' in sys.argv
background = '#1c2c3c' if dark else '#d9c9ac'
foreground = '#e8dbc4' if dark else '#30251a'
suffix = '-dark' if dark else ''
for group in ['legend', 'baby', 'faith']:
    items = [a for a in ASSETS if a['group'] == group]
    for start in range(0, len(items), 36):
        canvas = Image.new('RGB', (1200, 1440), background)
        draw = ImageDraw.Draw(canvas)
        for n, a in enumerate(items[start:start+36]):
            x, y = (n % 6) * 200, (n // 6) * 240
            path = ROOT / a['file']
            if path.exists():
                try:
                    with Image.open(path) as icon:
                        icon = icon.convert('RGBA').resize((188,188), Image.Resampling.LANCZOS)
                        canvas.paste(icon, (x+6,y), icon)
                except UnidentifiedImageError:
                    pass  # 생성 중인 파일은 다음 검수판 갱신 때 읽는다.
            draw.text((x+5,y+190), a['id'], font=font, fill=foreground)
            draw.text((x+5,y+212), a['name'][:15], font=font, fill=foreground)
        canvas.save(out / f'{group}-{start//36+1}{suffix}.jpg', quality=93)
print(out)
