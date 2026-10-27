#!/usr/bin/env python3
"""구판 여급 얼굴상을 확대한다. 얼굴·의상·체형을 생성하거나 바꾸지 않는다.

기존 448/512px 여급 얼굴상은 1024px로, 384px 여성 시설 NPC는 표준
512px로 확대한다. 원본 픽셀의 Lanczos 보간과 약한 선명화만 사용한다.
무릎상은 이미 1024×1536이므로 다시 확대하지 않는다.
"""
from pathlib import Path
import argparse
import json

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
FEMALE_NPC = ('innkeeper_europe', 'librarian_europe_f', 'priest_europe_f', 'tavernkeeper_europe_f')


def candidates():
    for folder in (ROOT / 'images/maid-styles', ROOT / 'images/portraits/maids'):
        for path in sorted(folder.rglob('*.webp')):
            if path.stem.endswith('_half'):
                continue
            with Image.open(path) as image:
                if image.width < 1024:
                    yield path, 1024, image.size
    for name in FEMALE_NPC:
        path = ROOT / 'images/portraits/npc' / (name + '.webp')
        with Image.open(path) as image:
            if image.width < 512:
                yield path, 512, image.size


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    rows = []
    for path, side, before in list(candidates()):
        if args.write:
            with Image.open(path) as raw:
                image = raw.convert('RGBA').resize((side, side), Image.Resampling.LANCZOS)
            rgb = image.convert('RGB').filter(ImageFilter.UnsharpMask(radius=0.7, percent=65, threshold=4))
            rgb.putalpha(image.getchannel('A'))
            temporary = path.with_name(path.name + '.tmp')
            rgb.save(temporary, 'WEBP', quality=95, method=4, exact=True)
            temporary.replace(path)
        rows.append({'path': path.relative_to(ROOT).as_posix(), 'before': list(before),
                     'after': [side, side], 'method': 'Lanczos + mild unsharp; no generation'})
    if args.write:
        report = ROOT / 'artifacts/female-portrait-repair/resolution.json'
        report.parent.mkdir(parents=True, exist_ok=True)
        report.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"얼굴상 {len(rows)}장 {'확대 완료' if args.write else '확대 대상'} (재생성 없음)")


if __name__ == '__main__':
    main()
