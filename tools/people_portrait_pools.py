#!/usr/bin/env python3
"""국가별 항해사 후보·후원자 초상 760장의 규격과 연락판을 점검한다."""
from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


NATIONS = [
    ('pt', '포르투갈'), ('es', '에스파냐'), ('fr', '프랑스'), ('de', '독일'),
    ('en', '잉글랜드'), ('nl', '네덜란드'), ('na', '북미 원주민'), ('kr', '조선'),
    ('cn', '명'), ('jp', '일본'), ('ot', '오스만'), ('af', '아프리카 원주민'),
    ('az', '아즈텍'), ('inca', '잉카'), ('vn', '베트남'), ('eg', '이집트'),
    ('pe', '페르시아'), ('ind', '인도'), ('se', '동남아시아'),
]
KINDS = [('mates', '항해사 후보'), ('sponsors', '후원자')]
GENDERS = [('f', '여성'), ('m', '남성')]
COUNT = 10


def expected(root: Path):
    for kind, _ in KINDS:
        for nation, _ in NATIONS:
            for gender, _ in GENDERS:
                for index in range(1, COUNT + 1):
                    yield root / kind / nation / gender / ('%02d.webp' % index)


def check(root: Path) -> list[Path]:
    paths = list(expected(root))
    missing = [path for path in paths if not path.is_file()]
    bad: list[Path] = []
    hashes: dict[str, list[Path]] = {}
    for path in paths:
        if not path.is_file():
            continue
        with Image.open(path) as image:
            if image.size != (512, 512) or image.mode != 'RGBA':
                bad.append(path)
            elif image.getchannel('A').getextrema() == (255, 255):
                bad.append(path)
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        hashes.setdefault(digest, []).append(path)
    duplicates = [items for items in hashes.values() if len(items) > 1]
    print('초상 %d/%d장 · 고유 파일 %d장' % (len(paths) - len(missing), len(paths), len(hashes)))
    if missing:
        print('빠진 파일: ' + ', '.join(str(path.relative_to(root)) for path in missing))
    if bad:
        print('규격·투명 배경 점검 필요: ' + ', '.join(str(path.relative_to(root)) for path in bad))
    if duplicates:
        print('같은 파일: ' + ' / '.join(', '.join(str(path.relative_to(root)) for path in items) for items in duplicates))
    return missing + bad + [path for items in duplicates for path in items[1:]]


def sheet(root: Path, dest: Path, kind: str, gender: str) -> None:
    cell, label_w, head_h = 112, 130, 32
    canvas = Image.new('RGB', (label_w + cell * COUNT, head_h + cell * len(NATIONS)), '#171513')
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.load_default()
    for col in range(COUNT):
        draw.text((label_w + col * cell + 8, 10), '%02d' % (col + 1), fill='#e7d29a', font=font)
    for row, (nation, label) in enumerate(NATIONS):
        y = head_h + row * cell
        draw.text((8, y + 46), nation + ' / ' + label, fill='#e7d29a', font=font)
        for col in range(COUNT):
            path = root / kind / nation / gender / ('%02d.webp' % (col + 1))
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
    p_check = sub.add_parser('check')
    p_check.add_argument('root', type=Path)
    p_sheet = sub.add_parser('sheet')
    p_sheet.add_argument('root', type=Path)
    p_sheet.add_argument('dest', type=Path)
    p_sheet.add_argument('kind', choices=[kind for kind, _ in KINDS])
    p_sheet.add_argument('gender', choices=[gender for gender, _ in GENDERS])
    args = parser.parse_args()
    if args.command == 'check':
        return 1 if check(args.root) else 0
    sheet(args.root, args.dest, args.kind, args.gender)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
