# -*- coding: utf-8 -*-
"""발견 GIF(유적 복원·자연 파노라마·동물 등장·식물 유화·보물 회전) → 한 장짜리 장면 판(스프라이트 시트) images/discovery-sheets/ID.webp

    python tools/ruin_gifs/sheets.py            # 바뀐 GIF만 새로 만든다
    python tools/ruin_gifs/sheets.py --all      # 모두 다시
    python tools/ruin_gifs/sheets.py zeus canyon

왜: GIF는 256색 장면을 통째로 여러 장 담아 무겁고(약 0.9~1.5MB), 재생 빠르기를 게임이 고칠 수 없으며,
    처음 장면부터 다시 돌리려면 파일을 새로 받아야 했다. 장면 판은 WEBP 한 장(약 절반 크기)이고,
    게임(js/art/reel.js)이 Canvas에 장면 사이를 겹쳐 그리며 G.FX.reveal.playMs 동안 부드럽게 돌린다.

판의 짜임 (js/art/reel.js 와 약속):
  · 가로 COLS(6)칸, 세로는 필요한 만큼. 칸 하나는 원본 장면 크기(576×256, 가로:세로 2.25).
  · 칸 수는 늘 COLS의 배수 — 원본 장면 수가 맞지 않으면 시간을 고르게 나눠 가까운 장면으로 채운다
    (첫 칸 = 첫 장면, 끝 칸 = 마지막 장면). 그래서 게임은 그림 크기만 보고 장면 수를 안다.
"""
import os
import sys
from PIL import Image, ImageSequence

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
SRC = os.path.join(ROOT, 'images', 'discoveries')
DST = os.path.join(ROOT, 'images', 'discovery-sheets')
COLS = 6
QUALITY = 76


def frames_of(path):
    im = Image.open(path)
    if getattr(im, 'n_frames', 1) < 2:
        return None
    return [f.convert('RGB') for f in ImageSequence.Iterator(im)]


def build(gid, force=False):
    src = os.path.join(SRC, gid + '.gif')
    dst = os.path.join(DST, gid + '.webp')
    if not force and os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
        return None
    fr = frames_of(src)
    if not fr:
        return None
    n = len(fr)
    rows = max(1, round(n / COLS))
    cells = rows * COLS
    pick = [round(i * (n - 1) / (cells - 1)) for i in range(cells)]
    w, h = fr[0].size
    sheet = Image.new('RGB', (w * COLS, h * rows))
    for i, fi in enumerate(pick):
        f = fr[fi] if fr[fi].size == (w, h) else fr[fi].resize((w, h), Image.LANCZOS)
        sheet.paste(f, ((i % COLS) * w, (i // COLS) * h))
    os.makedirs(DST, exist_ok=True)
    tmp = dst + '.tmp'
    sheet.save(tmp, 'WEBP', quality=QUALITY, method=6)
    os.replace(tmp, dst)
    return n, cells, os.path.getsize(src), os.path.getsize(dst)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    force = '--all' in sys.argv
    ids = args or sorted(os.path.splitext(f)[0] for f in os.listdir(SRC) if f.lower().endswith('.gif'))
    made = a = b = 0
    for gid in ids:
        r = build(gid, force or bool(args))
        if r:
            made += 1; a += r[2]; b += r[3]
            print('%-16s 장면 %2d → 칸 %2d   %4d KB → %4d KB' % (gid, r[0], r[1], r[2] // 1024, r[3] // 1024))
    if made:
        print('장면 판 %d장: GIF %.1f MB → %.1f MB' % (made, a / 1048576, b / 1048576))
    else:
        print('새로 만들 장면 판이 없습니다.')


if __name__ == '__main__':
    main()
