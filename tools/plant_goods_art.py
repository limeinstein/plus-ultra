#!/usr/bin/env python3
"""식물 특산물 원화의 투명도를 보존하고 상품 그림·미리보기를 만든다."""
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SPEC = ROOT / 'docs/art/plant-goods-prompts-20261029.json'
SOURCES = ROOT / 'artifacts/plant-goods-20261029/sources'


def main():
    spec = json.loads(SPEC.read_text(encoding='utf-8'))
    names = json.loads((SOURCES.parent / 'names.json').read_text(encoding='utf-8'))
    cells = []
    for asset in spec['assets']:
        source = SOURCES / (asset['id'] + '.png')
        if not source.exists():
            continue
        raw = Image.open(source).convert('RGBA')
        assert raw.getchannel('A').getextrema() == (0, 255), source
        # 원화를 확대·축소하지 않고 그대로 놓고 사방 여백만 더한다.
        side = max(1536, ((max(raw.size) + 255) // 256) * 256)
        out = Image.new('RGBA', (side, side))
        out.paste(raw, ((side - raw.width) // 2, (side - raw.height) // 2))
        dest = ROOT / asset['file']
        dest.parent.mkdir(parents=True, exist_ok=True)
        if not dest.exists() or dest.stat().st_mtime < source.stat().st_mtime:
            out.save(dest, quality=92, method=6, exact=True)
        cell = Image.new('RGB', (184, 216), '#e6d7b3')
        thumb = out.copy()
        thumb.thumbnail((180, 180), Image.Resampling.LANCZOS)
        cell.paste(thumb, ((184 - thumb.width) // 2, 0), thumb)
        draw = ImageDraw.Draw(cell)
        font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 15)
        draw.text((8, 180), names[asset['id']], fill='#332719', font=font)
        draw.text((8, 199), asset['id'], fill='#6d5c3e', font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 11))
        cells.append(cell)
    cols = 8
    preview = Image.new('RGB', (cols * 184, ((len(cells) + cols - 1) // cols) * 216), '#f4ecd9')
    for index, cell in enumerate(cells):
        preview.paste(cell, ((index % cols) * 184, (index // cols) * 216))
    preview.save(ROOT / 'docs/art/plant-goods-preview-20261029.jpg', quality=93)
    print(f'식물 특산물 {len(cells)}/{len(spec["assets"])}종 저장')


if __name__ == '__main__':
    main()
