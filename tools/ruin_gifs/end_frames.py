# -*- coding: utf-8 -*-
"""유적 GIF의 마지막 장면을 따로 저장한다 — 발견 연출에서 GIF가 한 바퀴 돈 뒤 이 그림으로 멈춘다.

    python tools/ruin_gifs/end_frames.py            # images/discoveries/*.gif 전부
    python tools/ruin_gifs/end_frames.py knossos    # 하나만

브라우저는 GIF를 멈추거나 Canvas에 지금 프레임을 옮길 수 없어서(첫 프레임만 옮겨짐) 마지막 프레임을
images/discovery-ends/ID.jpg 로 미리 뽑아 둔다. GIF를 다시 만들면(tools/ruin_gifs/build.py) 이것도 다시 실행한다.
"""
import glob
import os
import sys

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
SRC = os.path.join(ROOT, 'images', 'discoveries')
DST = os.path.join(ROOT, 'images', 'discovery-ends')


def last_frame(path):
    im = Image.open(path)
    n, total = 0, 0
    try:
        while True:
            total += im.info.get('duration', 0)
            n += 1
            im.seek(im.tell() + 1)
    except EOFError:
        pass
    im.seek(n - 1)
    return im.convert('RGB'), n, total


def main():
    only = set(sys.argv[1:])
    os.makedirs(DST, exist_ok=True)
    for f in sorted(glob.glob(os.path.join(SRC, '*.gif'))):
        did = os.path.splitext(os.path.basename(f))[0]
        if only and did not in only:
            continue
        im, n, ms = last_frame(f)
        im.save(os.path.join(DST, did + '.jpg'), 'JPEG', quality=90, optimize=True)
        print('%-16s %d프레임 %dms' % (did, n, ms))


if __name__ == '__main__':
    main()
