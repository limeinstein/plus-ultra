#!/usr/bin/env python3
"""생성된 NPC 초상을 게임용 512px WebP로 정리하고 240장 묶음을 점검한다."""
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


STYLES = ['ib', 'ne', 'it', 'gr', 'ru', 'is', 'pe', 'af', 'sw', 'in', 'se', 'cn', 'kr', 'jp', 'az', 'an', 'co', 'tr', 'st', 'na']
ROLES = ['king', 'priest', 'noble', 'official', 'merchant', 'scholar', 'keeper', 'sailor', 'soldier', 'maid', 'native', 'captain']


def convert(src: Path, dest: Path) -> None:
    with Image.open(src) as opened:
        image = opened.convert('RGBA')
        image.thumbnail((512, 512), Image.Resampling.LANCZOS)
        square = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
        square.alpha_composite(image, ((512 - image.width) // 2, (512 - image.height) // 2))
        dest.parent.mkdir(parents=True, exist_ok=True)
        square.save(dest, 'WEBP', quality=88, method=6, exact=True)


def check(root: Path) -> list[Path]:
    missing = [root / style / (role + '.webp') for style in STYLES for role in ROLES if not (root / style / (role + '.webp')).is_file()]
    bad = []
    for path in (root / style / (role + '.webp') for style in STYLES for role in ROLES):
        if not path.is_file():
            continue
        with Image.open(path) as image:
            if image.size != (512, 512) or image.mode not in ('RGBA', 'RGB'):
                bad.append(path)
            elif image.mode == 'RGBA' and image.getchannel('A').getextrema() == (255, 255):
                bad.append(path)
    print('초상 %d/240장' % (240 - len(missing)))
    if missing:
        print('빠진 파일: ' + ', '.join(str(p.relative_to(root)) for p in missing))
    if bad:
        print('규격·투명 배경 점검 필요: ' + ', '.join(str(p.relative_to(root)) for p in bad))
    return missing + bad


def sheet(root: Path, dest: Path) -> None:
    cell, label_w, head_h = 128, 88, 28
    canvas = Image.new('RGB', (label_w + cell * len(ROLES), head_h + cell * len(STYLES)), '#171513')
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.load_default()
    for col, role in enumerate(ROLES):
        draw.text((label_w + col * cell + 4, 8), role, fill='#e7d29a', font=font)
    for row, style in enumerate(STYLES):
        y = head_h + row * cell
        draw.text((8, y + 56), style, fill='#e7d29a', font=font)
        for col, role in enumerate(ROLES):
            path = root / style / (role + '.webp')
            if not path.is_file():
                continue
            with Image.open(path) as opened:
                image = opened.convert('RGBA').resize((cell, cell), Image.Resampling.LANCZOS)
                backdrop = Image.new('RGBA', (cell, cell), '#2a211c')
                backdrop.alpha_composite(image)
                canvas.paste(backdrop.convert('RGB'), (label_w + col * cell, y))
    dest.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(dest, 'PNG', optimize=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest='command', required=True)
    p_convert = sub.add_parser('convert')
    p_convert.add_argument('src', type=Path)
    p_convert.add_argument('dest', type=Path)
    p_check = sub.add_parser('check')
    p_check.add_argument('root', type=Path)
    p_sheet = sub.add_parser('sheet')
    p_sheet.add_argument('root', type=Path)
    p_sheet.add_argument('dest', type=Path)
    args = parser.parse_args()
    if args.command == 'convert':
        convert(args.src, args.dest)
        return 0
    if args.command == 'check':
        return 1 if check(args.root) else 0
    sheet(args.root, args.dest)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
