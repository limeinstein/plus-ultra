"""일기토 공격 시트에서 앞쪽 무기 끝·대기 키를 재어 duelart.js에 기록한다."""
import argparse
import json
import re
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
CW, CH = 432, 304


def tip(frame, overhead=False, wooden=False):
    rgba = np.asarray(frame)
    solid = rgba[:, :, 3] > 80
    ys, xs = np.where(solid)
    top, bottom = int(ys.min()), int(ys.max())
    # 발·자락을 제외한다. 밝고 가는 날에서 전진 방향 끝을 찾고, 손잡이 타격이면 팔 끝을 쓴다.
    yy, xx = np.indices(solid.shape)
    band = solid & (yy < top + (bottom - top) * 0.69)
    rgb = rgba[:, :, :3].astype(int)
    steel = band & (rgb.min(axis=2) > 95) & (np.ptp(rgb, axis=2) < 58)
    labels, count = ndimage.label(steel, np.ones((3, 3)))
    blades = []
    for i, sl in enumerate(ndimage.find_objects(labels), 1):
        if sl is None:
            continue
        y, x = sl
        if max(x.stop-x.start, y.stop-y.start) >= 15 and (x.stop > 165 or overhead):
            blades.append((y.start if overhead else -x.stop, i))
    # 나무 봉과 전쟁 곤봉은 금속 반사가 없어 소매·깃털 장식이 밝게 잡힌다.
    mask = labels == min(blades)[1] if blades and not wooden else band
    ys, xs = np.where(mask)
    if overhead:
        edge = ys <= ys.min() + 2
    else:
        edge = xs >= xs.max() - 2
    return [round(float(np.median(xs[edge]))), round(float(np.median(ys[edge])))]


def row(im, r, rise=False, wooden=False):
    def frame(c):
        return im.crop((CW*c, CH*r, CW*(c+1), CH*(r+1)))
    return {1: tip(frame(0 if rise else 1), overhead=r in (0, 2) and not rise, wooden=wooden),
            3: tip(frame(1 if rise else 3), wooden=wooden)}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()
    directory = ROOT / 'images/duel'
    lines = []
    for path in sorted((directory/'fighters').glob('*.png')):
        with Image.open(path) as im:
            base = row(im, 0)
            idle = im.crop((0, CH*3, CW, CH*4)).getchannel('A').point(lambda a: 255 if a > 80 else 0).getbbox()
        data = {'base': base, 'height': idle[3]-idle[1]}
        extra = directory/'fighters_ext'/(path.stem+'_atk.png')
        if extra.exists():
            with Image.open(extra) as im:
                wooden = path.stem in ('east_asian_attendant', 'native_chief')
                data.update({str(r): row(im, r, r == 3, wooden=wooden) for r in range(4)})
        lines.append('      ' + json.dumps(path.stem) + ': ' + json.dumps(data, separators=(',', ':')))
    table = '// CONTACT_BEGIN\n    contact: {\n' + ',\n'.join(lines) + '\n    },\n    // CONTACT_END'
    dest = ROOT / 'js/data/duelart.js'
    old = dest.read_text(encoding='utf8')
    new, n = re.subn(r'// CONTACT_BEGIN.*?// CONTACT_END', lambda _: table, old, flags=re.S)
    if n != 1 or args.check and old != new:
        raise SystemExit('접점 표가 시트와 다릅니다.')
    if not args.check and new != old:
        dest.write_text(new, encoding='utf8', newline='\n')
    print(f'{len(lines)}명 접점 일치')


if __name__ == '__main__':
    main()
