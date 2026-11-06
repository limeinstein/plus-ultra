"""무릎상 전체에서 하반신을 재사용한 얼굴 합성본 후보를 찾는다.

실행: python tools/audit_portrait_joins.py
결과: artifacts/portrait-join-20261106/audit.json, body-groups-*.jpg
같은 하반신은 검수 후보이며 같은 인물의 시기별 모습 등은 오류가 아닐 수 있다.
기존 감사 보고서와 원화 대조로 확인한 파일만 portraitquality.js에 반영한다.
파일을 바꾸거나 얼굴을 새로 합성하지 않는다.
"""
from pathlib import Path
from collections import defaultdict
import argparse
import json

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts/portrait-join-20261106'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--append', action='store_true', help='기존 보고서에 아직 검사하지 않은 파일만 보탠다')
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    text = (ROOT / 'images/manifest.js').read_text(encoding='utf-8')
    manifest = json.loads(text[text.index('{', text.index('G.IMAGE_FILES =')):text.rindex('}') + 1])
    files = sorted({ROOT / 'images' / value for key, value in manifest.items()
                    if key.endswith('_half') or key.startswith('characters/player_half')})
    rows = json.loads((OUT / 'audit.json').read_text(encoding='utf-8'))['rows'] if args.append and (OUT / 'audit.json').exists() else []
    rows = [row for row in rows if row['key'] in manifest]
    groups = defaultdict(list)
    for row in rows:
        groups[row['bodyhash']].append(row)
    seen = {row['key'] for row in rows}
    files = [p for p in files if p.relative_to(ROOT / 'images').with_suffix('').as_posix() not in seen]
    for i, path in enumerate(files):
        with Image.open(path) as source:
            im = source.convert('RGBA')
        w, h = im.size
        body = im.crop((0, int(h * .55), w, h)).resize((17, 16)).convert('L')
        a = np.asarray(body)
        signature = np.packbits((a[:, 1:] > a[:, :-1]).flatten()).tobytes().hex()
        row = dict(key=path.relative_to(ROOT / 'images').with_suffix('').as_posix(),
                   file=str(path.relative_to(ROOT)), size=im.size,
                   alpha=im.getchannel('A').getextrema(), bodyhash=signature)
        rows.append(row)
        groups[signature].append(row)
        if (i + 1) % 200 == 0:
            print(f'검사 {i + 1}/{len(files)}', flush=True)
    shared = sorted((g for g in groups.values() if len(g) > 1), key=len, reverse=True)
    (OUT / 'audit.json').write_bytes((json.dumps(dict(total=len(rows), rows=rows,
        body_groups=shared), ensure_ascii=False, indent=2) + '\n').encode('utf-8'))
    selected = [r for group in shared for r in group[:3]]
    for offset in range(0, len(selected), 24):
        sheet = Image.new('RGB', (1200, 1140), (45, 46, 48))
        draw = ImageDraw.Draw(sheet)
        for j, row in enumerate(selected[offset:offset + 24]):
            with Image.open(ROOT / row['file']) as source:
                im = source.convert('RGBA')
            im.thumbnail((190, 250))
            x, y = j % 6 * 200, j // 6 * 285
            sheet.paste(im, (x + (200 - im.width) // 2, y), im)
            draw.text((x + 3, y + 252), row['key'].replace('portraits/', '')[:31], fill='white')
        sheet.save(OUT / f'body-groups-{offset // 24}.jpg')
    print(f'전체 {len(rows)}장, 몸통 재사용 후보 {sum(map(len, shared))}장 / {len(shared)}묶음')


if __name__ == '__main__':
    main()
