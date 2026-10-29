#!/usr/bin/env python3
"""일기토 착지 중 외투·발끝이 바닥을 뚫지 않도록 기존 시트의 외곽점을 기록한다.

이미지 픽셀은 바꾸지 않는다. 시트를 교체한 뒤 실행하고 --check로 일치 여부를 검사한다.
브라우저에서 픽셀을 읽지 않아 file://에서도 같은 바닥 접촉을 쓴다.
"""
import argparse
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CW, CH, PX = 432, 304, 165
BEGIN, END = '    // FALL_GEOMETRY_BEGIN', '    // FALL_GEOMETRY_END'


def hull(points):
    def turn(a, b, c):
        return (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0])
    points = sorted(set(points))
    def half(seq):
        out = []
        for p in seq:
            while len(out) > 1 and turn(out[-2], out[-1], p) <= 0:
                out.pop()
            out.append(p)
        return out
    return half(points)[:-1] + half(reversed(points))[:-1]


def geometry(path):
    with Image.open(path) as sheet:
        if sheet.size != (2592, 1216):
            raise ValueError(f'{path}: 시트 크기가 다름')
        alpha = sheet.getchannel('A').point(lambda a: 255 if a > 4 else 0)
    def cell(c, r):
        return alpha.crop((c*CW, r*CH, (c+1)*CW, (r+1)*CH))
    knee = cell(1, 2)
    bottom = knee.getbbox()[3]
    edge = []
    for x in range(CW):
        ys = knee.crop((x, 0, x+1, CH)).getbbox()
        if ys:
            edge.extend([(x-PX, ys[1]-bottom), (x+1-PX, ys[1]-bottom),
                         (x-PX, ys[3]-bottom), (x+1-PX, ys[3]-bottom)])
    rest = cell(2, 2).getbbox()
    return dict(ground=cell(0, 3).getbbox()[3], hit=cell(0, 2).getbbox()[3],
                knee=bottom, rest=rest[3]-rest[1], edge=hull(edge))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    rows = []
    for path in sorted((ROOT/'images/duel/fighters').glob('*.png')):
        rows.append('      ' + json.dumps(path.stem) + ': ' +
                    json.dumps(geometry(path), separators=(',', ':')))
    block = BEGIN + '\n    fallGeometry: {\n' + ',\n'.join(rows) + '\n    },\n' + END
    target = ROOT/'js/data/duelart.js'
    source = target.read_text(encoding='utf-8')
    start, end = source.index(BEGIN), source.index(END) + len(END)
    if args.check:
        if source[start:end] != block:
            raise SystemExit('착지 외곽점이 시트와 다름: python tools/duel_fall_geometry.py 실행 필요')
    else:
        target.write_text(source[:start] + block + source[end:], encoding='utf-8', newline='\n')
    print(f'일기토 {len(rows)}명 착지 외곽점 ' + ('일치' if args.check else '기록'))


if __name__ == '__main__':
    main()
