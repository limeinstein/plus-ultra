#!/usr/bin/env python3
"""보관한 일기토 착지 원화를 sprite-gen slice-sheet로 다시 추출한다."""
import argparse
import json
from pathlib import Path
import sys

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--sprite-gen', type=Path, required=True)
    ap.add_argument('--out', type=Path, required=True)
    args = ap.parse_args()
    sys.path.insert(0, str(args.sprite_gen.resolve()))
    from sprite_gen.frames.slice_sheet import run

    source = ROOT/'artifacts/duel-motion-20261028/source'
    groups = json.loads((source/'groups.json').read_text(encoding='utf-8'))
    args.out.mkdir(parents=True, exist_ok=True)
    for name, names in groups.items():
        sheet = source/(name+'.png')
        grid = (2, 2) if name == 'fall-fix' else (2, 5)
        if len(names) < grid[0]*grid[1]:
            # 빈 칸을 거부하는 추출기용 사본. 복제 칸은 게임에 사용하지 않는다.
            image = Image.open(sheet).convert('RGBA')
            first = image.crop((0, 0, image.width//2, image.height//5))
            names = names.copy()
            for j in range(len(names), grid[0]*grid[1]):
                image.paste(first, (j%2*(image.width//2), round(j//2*image.height/5)))
                names.append('unused'+str(j))
            sheet = args.out/(name+'-padded.png')
            image.save(sheet)
        run(sheet=sheet, out_dir=args.out, chroma_key='none', alpha_floor=64,
            grid=grid, names=','.join(names), cell_width=432, cell_height=304,
            baseline_y=278, target_height=100, fit='contain')
        for report in ('slice-sheet.json', 'alpha-cleanup.json'):
            (args.out/report).replace(args.out/(name+'-'+report))


if __name__ == '__main__':
    main()
