#!/usr/bin/env python3
"""일기토 전투원 시트에서 필살 동작 GIF를 만든다.

전투원 시트의 공격·행동 프레임을 다시 그리지 않고 묶어, 모든 전투원에게
베기·찌르기·치기 일격필살 동작을 만든다. 검술 3 전설은 인물별 필살기와
장비의 호통을 따로 만들고, 비밀무기·공통 호통은 투명 효과 GIF로 만든다.

    python tools/duel_finishers.py
    python tools/duel_finishers.py --import-generated .work/duel_generated

생성 위치: images/duel/finishers/<전투원>/<slash|thrust|bash|special|roar>.gif
"""
import argparse
import math
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
FIGHTERS = ROOT / 'images' / 'duel' / 'fighters'
OUT = ROOT / 'images' / 'duel' / 'finishers'
SHEET = (2592, 1216)
CELL = (432, 304)
PIVOT = (165, 278)
SOURCE = (1536, 1024)
SOURCE_CELL = (256, 256)
SOURCE_PIVOT = (128, 246)
USED = {0: 6, 1: 4, 2: 3, 3: 6}

MOVES = {
    'slash': ([(0, 0), (0, 2), (0, 4), (0, 5), (3, 4), (3, 5)], [180, 110, 90, 130, 150, 260]),
    'thrust': ([(0, 0), (0, 2), (0, 3), (0, 4), (0, 5), (3, 4), (3, 5)], [180, 100, 65, 85, 120, 150, 260]),
    'bash': ([(0, 0), (0, 1), (0, 1), (0, 4), (0, 5), (3, 4), (3, 5)], [180, 110, 70, 100, 140, 150, 260]),
}

LEGENDS = {
    'guan_yu': ('dragon', (78, 222, 132)),
    'zhang_fei': ('thunder', (246, 92, 72)),
    'd_artagnan': ('flash', (80, 184, 255)),
    'athos': ('cross', (238, 232, 202)),
    'aramis': ('prayer', (184, 112, 255)),
}


def alpha_clean(im, cut=5):
    """ImageGen의 투명 배경에 남은 보이지 않는 알파 먼지를 없앤다."""
    im = im.convert('RGBA')
    a = im.getchannel('A').point(lambda x: 0 if x <= cut else 255)
    im.putalpha(a)
    return im


def normalize_generated(src, dst):
    """생성 시트를 게임의 2592×1216(432×304 칸) 규격으로 맞춘다."""
    im = alpha_clean(Image.open(src))
    ratio = im.width / im.height
    if abs(ratio - SOURCE[0] / SOURCE[1]) < .05:
        out = Image.new('RGBA', SHEET)
        dx, dy = PIVOT[0] - SOURCE_PIVOT[0], PIVOT[1] - SOURCE_PIVOT[1]
        for row, count in USED.items():
            for col in range(count):
                box = (col * SOURCE_CELL[0], row * SOURCE_CELL[1], (col + 1) * SOURCE_CELL[0], (row + 1) * SOURCE_CELL[1])
                frame = im.crop(box)
                out.alpha_composite(frame, (col * CELL[0] + dx, row * CELL[1] + dy))
    else:
        out = im.resize(SHEET, Image.Resampling.LANCZOS)
        out = alpha_clean(out, 8)
    # 생성기가 비워야 할 칸에 작은 장식이나 잔상을 남겨도 런타임에서 읽지 않게 지운다.
    blank = Image.new('RGBA', CELL)
    for row, count in USED.items():
        for col in range(count, 6):
            out.paste(blank, (col * CELL[0], row * CELL[1]))
    # 각 칸의 가장자리를 투명하게 닫아 다음 동작에 칼끝·옷자락이 비치지 않게 한다.
    for x in range(0, SHEET[0] + 1, CELL[0]):
        out.paste((0, 0, 0, 0), (max(0, x - 1), 0, min(SHEET[0], x + 1), SHEET[1]))
    for y in range(0, SHEET[1] + 1, CELL[1]):
        out.paste((0, 0, 0, 0), (0, max(0, y - 1), SHEET[0], min(SHEET[1], y + 1)))
    dst.parent.mkdir(parents=True, exist_ok=True)
    out.save(dst, optimize=True)
    print('전설 시트', dst.relative_to(ROOT), out.size)


def crop(sheet, row, col):
    return sheet.crop((col * CELL[0], row * CELL[1], (col + 1) * CELL[0], (row + 1) * CELL[1]))


def glow(size, center, radius, color, strength=150):
    layer = Image.new('RGBA', size)
    d = ImageDraw.Draw(layer)
    for r in range(radius, 2, -6):
        a = int(strength * (1 - r / radius) ** 2)
        d.ellipse((center[0] - r, center[1] - r, center[0] + r, center[1] + r), fill=(*color, a))
    return layer.filter(ImageFilter.GaussianBlur(5))


def arc_layer(size, box, start, end, color, width=10, alpha=235):
    layer = Image.new('RGBA', size)
    d = ImageDraw.Draw(layer)
    d.arc(box, start, end, fill=(*color, alpha), width=width)
    d.arc(box, start, end, fill=(255, 248, 218, min(255, alpha + 15)), width=max(2, width // 3))
    return layer.filter(ImageFilter.GaussianBlur(.7))


def move_effect(frame, move, phase):
    out = frame.copy()
    if phase < 2 or phase > 4:
        return out
    if move == 'slash':
        out = Image.alpha_composite(out, arc_layer(out.size, (130, 34, 420, 292), 202, 326, (255, 190, 62), 13, 220))
    elif move == 'thrust':
        layer = Image.new('RGBA', out.size)
        d = ImageDraw.Draw(layer)
        for i, a in enumerate((210, 125, 70)):
            y = 126 + i * 12
            d.line((205 - i * 18, y, 425, y - 5), fill=(245, 235, 190, a), width=7 - i * 2)
        out = Image.alpha_composite(out, layer.filter(ImageFilter.GaussianBlur(.8)))
    else:
        out = Image.alpha_composite(out, glow(out.size, (322, 184), 92, (255, 132, 52), 130))
        layer = Image.new('RGBA', out.size)
        d = ImageDraw.Draw(layer)
        for r, a in ((24, 240), (46, 155), (72, 80)):
            d.ellipse((322-r, 184-r, 322+r, 184+r), outline=(255, 220, 126, a), width=max(2, 8-r//14))
        out = Image.alpha_composite(out, layer)
    return out


def legend_effect(frame, kind, color, phase):
    out = frame.copy()
    if phase < 1 or phase > 5:
        return out
    layer = Image.new('RGBA', out.size)
    d = ImageDraw.Draw(layer)
    if kind == 'dragon':
        layer = arc_layer(out.size, (95, 18, 425, 318), 190, 340, color, 18, 225)
        d = ImageDraw.Draw(layer)
        d.polygon([(382, 96), (420, 112), (386, 126), (400, 111)], fill=(*color, 220))
    elif kind == 'thunder':
        for off in (0, 16, 31):
            d.line([(195+off, 28), (175+off, 89), (210+off, 91), (177+off, 164), (235+off, 120)], fill=(*color, 210-off*3), width=7)
        for r in (45, 78, 112):
            d.ellipse((245-r, 162-r*.45, 245+r, 162+r*.45), outline=(*color, max(55, 220-r)), width=6)
    elif kind == 'flash':
        for i in range(5):
            d.line((165-i*18, 92+i*14, 430, 104+i*4), fill=(*color, 220-i*32), width=max(2, 9-i))
        d.ellipse((345, 72, 425, 152), outline=(255, 255, 245, 220), width=5)
    elif kind == 'cross':
        d.line((238, 45, 342, 238), fill=(*color, 220), width=13)
        d.line((342, 45, 238, 238), fill=(*color, 220), width=13)
        d.line((238, 45, 342, 238), fill=(255,255,255,230), width=4)
        d.line((342, 45, 238, 238), fill=(255,255,255,230), width=4)
    else:
        d.ellipse((222, 38, 408, 238), outline=(*color, 220), width=12)
        d.line((315, 56, 315, 216), fill=(255,245,255,210), width=7)
        d.line((270, 111, 360, 111), fill=(255,245,255,210), width=7)
        for r in (36, 70, 102):
            d.arc((315-r, 136-r, 315+r, 136+r), 205, 335, fill=(*color, 175), width=5)
    return Image.alpha_composite(out, layer.filter(ImageFilter.GaussianBlur(1.2)))


def save_gif(path, frames, durations):
    path.parent.mkdir(parents=True, exist_ok=True)
    # GIF는 반투명 알파가 없으므로 가장자리만 투명/불투명으로 정리한다.
    ready = []
    for rgba in frames:
        rgba = rgba.convert('RGBA')
        alpha = rgba.getchannel('A').point(lambda a: 255 if a >= 20 else 0)
        rgba.putalpha(alpha)
        ready.append(rgba)
    ready[0].save(path, save_all=True, append_images=ready[1:], duration=durations,
                  loop=0, disposal=2, transparency=0, optimize=True)


def make_moves(fid, sheet):
    for move, (seq, durations) in MOVES.items():
        frames = [move_effect(crop(sheet, r, c), move, i) for i, (r, c) in enumerate(seq)]
        save_gif(OUT / fid / (move + '.gif'), frames, durations)


def make_legend(fid, sheet, kind, color):
    seq = [(0, 0), (0, 1), (0, 2), (0, 3), (0, 4), (0, 5), (3, 4), (3, 5)]
    frames = [legend_effect(crop(sheet, r, c), kind, color, i) for i, (r, c) in enumerate(seq)]
    save_gif(OUT / fid / 'special.gif', frames, [180, 105, 80, 65, 80, 120, 160, 280])


def make_zhang_roar(sheet):
    seq = [(3, 0), (3, 3), (3, 4), (3, 4), (3, 5)]
    frames = []
    for i, (r, c) in enumerate(seq):
        fr = crop(sheet, r, c)
        layer = Image.new('RGBA', fr.size)
        d = ImageDraw.Draw(layer)
        for n in range(max(0, i-1) + 1):
            rx, ry = 55 + n*42 + i*16, 24 + n*13 + i*4
            d.ellipse((205-rx, 112-ry, 205+rx, 112+ry), outline=(255, 92, 54, max(45, 225-n*55-i*18)), width=max(3, 10-n*2))
        frames.append(Image.alpha_composite(fr, layer.filter(ImageFilter.GaussianBlur(.8))))
    save_gif(OUT / 'zhang_fei' / 'roar.gif', frames, [180, 120, 100, 120, 300])


def make_common():
    common = OUT / 'common'
    frames, durations = [], [180, 85, 70, 110, 180, 260]
    for i in range(6):
        fr = Image.new('RGBA', CELL)
        d = ImageDraw.Draw(fr)
        if i >= 1:
            x = 150 + i * 42
            d.line((92, 170, min(426, x), 144), fill=(238, 228, 190, max(45, 235-i*25)), width=max(2, 10-i))
            d.ellipse((min(410, x)-13, 131, min(410, x)+13, 157), fill=(255, 238, 148, max(55, 245-i*24)))
        frames.append(fr.filter(ImageFilter.GaussianBlur(.7)))
    save_gif(common / 'secret_dagger.gif', frames, durations)

    frames = []
    for i in range(6):
        fr = Image.new('RGBA', CELL)
        d = ImageDraw.Draw(fr)
        if i == 2:
            for r, a in ((10, 255), (28, 165), (54, 70)):
                d.ellipse((316-r, 147-r, 316+r, 147+r), fill=(255, 226, 126, a))
        if i >= 2:
            for n in range(4):
                r = 12 + n*7 + (i-2)*6
                d.ellipse((315-r+(i-2)*10, 146-r-(i-2)*5, 315+r+(i-2)*10, 146+r-(i-2)*5), fill=(220, 220, 214, max(20, 120-n*22-(i-2)*20)))
        frames.append(fr.filter(ImageFilter.GaussianBlur(2)))
    save_gif(common / 'secret_gun.gif', frames, [180, 90, 55, 100, 180, 260])

    frames = []
    for i in range(6):
        fr = Image.new('RGBA', CELL)
        d = ImageDraw.Draw(fr)
        for n in range(i):
            rx, ry = 48+n*38+i*11, 20+n*13+i*3
            d.ellipse((160-rx, 126-ry, 160+rx, 126+ry), outline=(255, 206, 92, max(35, 220-n*42-i*18)), width=max(3, 9-n))
        frames.append(fr.filter(ImageFilter.GaussianBlur(.8)))
    save_gif(common / 'roar.gif', frames, [150, 90, 90, 105, 145, 260])


def build():
    sheets = sorted(FIGHTERS.glob('*.png'))
    if not sheets:
        raise SystemExit('전투원 시트가 없습니다: ' + str(FIGHTERS))
    for i, path in enumerate(sheets, 1):
        im = Image.open(path).convert('RGBA')
        if im.size != SHEET:
            raise SystemExit('%s: %s, 필요한 크기 %s' % (path.name, im.size, SHEET))
        fid = path.stem
        make_moves(fid, im)
        if fid in LEGENDS:
            make_legend(fid, im, *LEGENDS[fid])
        if fid == 'zhang_fei':
            make_zhang_roar(im)
        print('%2d/%d %s' % (i, len(sheets), fid))
    make_common()
    print('완료: 전투원 %d명 × 기본 3종 + 전설 필살기 %d종 + 공통 동작 3종' % (len(sheets), len(LEGENDS)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--import-generated', metavar='DIR', help='d_artagnan.png·athos.png·aramis.png 생성본을 전투원 규격으로 가져온다')
    args = ap.parse_args()
    if args.import_generated:
        src = Path(args.import_generated)
        for fid in ('d_artagnan', 'athos', 'aramis'):
            path = src / (fid + '.png')
            if not path.exists():
                raise SystemExit('생성본이 없습니다: ' + str(path))
            normalize_generated(path, FIGHTERS / (fid + '.png'))
    build()


if __name__ == '__main__':
    main()
