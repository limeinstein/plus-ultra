#!/usr/bin/env python3
"""ImageGen 원본 명작을 게임 규격으로 자르고 미리보기 판을 만든다."""

from pathlib import Path
import re

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'images' / 'masterworks' / '_generated'
OUT = ROOT / 'images' / 'masterworks'
PREVIEW = ROOT / 'docs' / 'art' / 'masterworks-preview.webp'
SIZE = (1400, 1000)


def expected_names():
    source = (ROOT / 'js' / 'data' / 'masterworks.js').read_text(encoding='utf-8')
    source = source.split('G.MASTERWORKS = {', 1)[1].split('G.MASTERWORKS_GENERIC', 1)[0]
    names = []
    artist = None
    for line in source.splitlines():
        match = re.match(r'^    ([a-zA-Z0-9_]+):\s*\{', line)
        if match:
            artist = match.group(1)
        if artist:
            for kind in re.findall(r'\b(paint|sculpt)\s*:', line):
                names.extend(f'{artist}_{kind}{n}' for n in range(3))
    return names


def convert(names):
    OUT.mkdir(parents=True, exist_ok=True)
    missing = [name for name in names if not (RAW / f'{name}.png').is_file()]
    if missing:
        raise SystemExit('원본 누락: ' + ', '.join(missing))
    for name in names:
        with Image.open(RAW / f'{name}.png') as source:
            image = ImageOps.fit(source.convert('RGB'), SIZE, Image.Resampling.LANCZOS)
            image.save(OUT / f'{name}.webp', 'WEBP', quality=92, method=6)


def make_preview(names):
    columns = 6
    thumb = (280, 200)
    label_h = 24
    rows = (len(names) + columns - 1) // columns
    sheet = Image.new('RGB', (columns * thumb[0], rows * (thumb[1] + label_h)), '#171411')
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    for index, name in enumerate(names):
        x = (index % columns) * thumb[0]
        y = (index // columns) * (thumb[1] + label_h)
        with Image.open(OUT / f'{name}.webp') as source:
            sheet.paste(source.resize(thumb, Image.Resampling.LANCZOS), (x, y))
        draw.text((x + 7, y + thumb[1] + 6), name, font=font, fill='#f1e6ca')
    PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(PREVIEW, 'WEBP', quality=88, method=6)


def main():
    names = expected_names()
    if len(names) != 72 or len(set(names)) != 72:
        raise SystemExit(f'명작 슬롯 수가 72가 아님: {len(names)}')
    convert(names)
    make_preview(names)
    print(f'{len(names)}점 변환 완료: {SIZE[0]}x{SIZE[1]} WebP')
    print(PREVIEW.relative_to(ROOT))


if __name__ == '__main__':
    main()
