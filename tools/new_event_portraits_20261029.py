#!/usr/bin/env python3
"""새 사건의 내장 생성 원화를 얼굴상·무릎상과 검수 모음으로 내보낸다."""
from pathlib import Path
import json
import shutil
from PIL import Image, ImageDraw, ImageFont, ImageOps
import history_event_art as export

ROOT = Path(__file__).resolve().parents[1]

def women_preview(specs, out):
    """여성 세 사람을 큰 칸으로 비교하는 검수 모음이다. 원본 초상은 고치지 않는다."""
    women = [a for a in specs['assets'] if a['g'] == 'f']
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 20)
    for kind, cell in [('women', (384, 608)), ('women-faces', (320, 354))]:
        sheet = Image.new('RGB', (cell[0] * len(women), cell[1]), '#302b28')
        draw = ImageDraw.Draw(sheet)
        for i, a in enumerate(women):
            suffix = '_half.webp' if kind == 'women' else '.webp'
            with Image.open(ROOT / 'images/portraits/history' / (a['id'] + suffix)) as im:
                figure = ImageOps.contain(im.convert('RGBA'), (cell[0] - 16, cell[1] - 46), Image.Resampling.LANCZOS)
            sheet.paste(figure, (i * cell[0] + (cell[0] - figure.width) // 2, 6), figure)
            draw.text((i * cell[0] + 12, cell[1] - 34), a['name'], font=font, fill='#f5dfae')
        sheet.save(out / (kind + '-preview.jpg'), quality=94)

if __name__ == '__main__':
    export.OUT = ROOT / 'artifacts/new-event-portraits-20261029'
    export.SPECS = ROOT / 'tools/new_event_portraits_20261029_prompts.json'
    export.OUT.mkdir(parents=True, exist_ok=True)
    rows = export.materialize()
    export.preview()
    specs = json.loads(export.SPECS.read_text(encoding='utf-8'))
    women_preview(specs, export.OUT)
    references = sorted({r for a in specs['assets'] for r in a.get('refs', [])})
    for i, source in enumerate(references, 1):
        target = export.OUT / 'references' / ('reference-%02d.png' % i)
        target.parent.mkdir(parents=True, exist_ok=True)
        if Path(source).is_file() and not target.exists():
            shutil.copy2(source, target)
    print('인물 %d명 얼굴상·무릎상 내보내기 완료' % len(rows))
