#!/usr/bin/env python3
"""일기토 전투원 원화를 화면 가득 차는 필살기 컷인 GIF로 만든다.

ImageGen이 만든 `images/duel/cutins/source/<id>.png` 한 장을 받아, 먹선 등장 →
무기 돌진 → 섬광 → 잉크가 가라앉는 짧은 화면 연출로 합성한다.
`--references`는 ImageGen에 넣을 인물 참조 이미지를 `.work/cutin_refs`에 만든다.
"""
import argparse
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
FIGHTERS = ROOT / 'images' / 'duel' / 'fighters'
SOURCE = ROOT / 'images' / 'duel' / 'cutins' / '_source'
OUT = ROOT / 'images' / 'duel' / 'cutins'
REFS = ROOT / '.work' / 'cutin_refs'
CELL = (432, 304)
SIZE = (1060, 380)


REGION = {
    'guan_yu': 'cn', 'zhang_fei': 'cn',
    'joseon_swordsman': 'kr', 'ganghui': 'kr',
    'samurai': 'jp',
    'barbary_corsair': 'islam',
    'indian_warrior': 'india', 'vietnamese_woman': 'seasia',
    'east_asian_attendant': 'cn',
    'african_warrior': 'africa',
    'mesoamerican_warrior': 'meso', 'native_chief': 'na',
    'caribbean_pirate': 'caribbean', 'redhair_pirate': 'caribbean', 'blonde_pirate': 'caribbean',
}

PALETTE = {
    'eu': ((202, 169, 94), (72, 35, 26)),
    'caribbean': ((224, 162, 65), (39, 70, 76)),
    'cn': ((214, 170, 67), (119, 31, 24)),
    'kr': ((227, 218, 178), (40, 75, 90)),
    'jp': ((222, 196, 142), (124, 35, 31)),
    'islam': ((216, 181, 91), (24, 90, 91)),
    'india': ((234, 173, 70), (117, 33, 92)),
    'seasia': ((219, 183, 85), (38, 104, 88)),
    'africa': ((222, 154, 57), (80, 42, 25)),
    'meso': ((205, 159, 54), (45, 91, 69)),
    'na': ((210, 175, 111), (105, 48, 32)),
}


def region(fid):
    return REGION.get(fid, 'eu')


def make_references():
    REFS.mkdir(parents=True, exist_ok=True)
    for path in sorted(FIGHTERS.glob('*.png')):
        sheet = Image.open(path).convert('RGBA')
        # 정면에 가까운 행동 첫 장면과 공격 준비 장면을 함께 보여 주면 얼굴·복식·무기를 더 잘 보존한다.
        idle = sheet.crop((0, 3 * CELL[1], CELL[0], 4 * CELL[1]))
        attack = sheet.crop((0, 0, CELL[0], CELL[1]))
        canvas = Image.new('RGBA', (864, 512), (242, 232, 208, 255))
        for i, fr in enumerate((idle, attack)):
            box = fr.getbbox()
            if box:
                fr = fr.crop(box)
                fr.thumbnail((390, 470), Image.Resampling.LANCZOS)
                canvas.alpha_composite(fr, (i * 432 + (432 - fr.width) // 2, 500 - fr.height))
        d = ImageDraw.Draw(canvas)
        d.line((432, 18, 432, 494), fill=(102, 79, 51, 100), width=2)
        canvas.convert('RGB').save(REFS / (path.stem + '.jpg'), quality=94)
    print('참조 그림', len(list(REFS.glob('*.jpg'))), '장:', REFS.relative_to(ROOT))


def cover(im, size, scale=1.0, dx=0, dy=0):
    w, h = size
    s = max(w / im.width, h / im.height) * scale
    nw, nh = round(im.width * s), round(im.height * s)
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (w - nw) // 2 + dx
    y = (h - nh) // 2 + dy
    out = Image.new('RGB', size, (20, 16, 12))
    out.paste(im, (x, y))
    return out


def paper_texture(size, color, seed):
    layer = Image.new('RGBA', size)
    d = ImageDraw.Draw(layer)
    for i in range(34):
        y = (i * 47 + seed * 19) % size[1]
        a = 10 + (i * 7) % 20
        d.line((0, y, size[0], y + ((i % 5) - 2) * 3), fill=(*color, a), width=1 + i % 2)
    return layer.filter(ImageFilter.GaussianBlur(.5))


def streaks(size, color, phase, reverse=False):
    layer = Image.new('RGBA', size)
    d = ImageDraw.Draw(layer)
    p = min(1, max(0, phase))
    for i in range(18):
        y = 34 + i * 19 + (i % 3) * 5
        reach = int((260 + (i * 71) % 650) * p)
        x0 = size[0] - 30 if reverse else 30
        x1 = x0 - reach if reverse else x0 + reach
        d.line((x0, y, x1, y + (i % 5 - 2) * 7), fill=(*color, 30 + (i * 13) % 80), width=1 + i % 4)
    return layer.filter(ImageFilter.GaussianBlur(.6))


def frame(base, fid, i):
    warm, accent = PALETTE[region(fid)]
    zoom = [1.08, 1.055, 1.03, 1.0, 1.035, 1.015, 1.0][i]
    dx = [-44, -28, -12, 0, 20, 8, 0][i]
    im = cover(base, SIZE, zoom, dx)
    if i == 0:
        im = ImageEnhance.Color(im).enhance(.35)
        im = ImageEnhance.Contrast(im).enhance(1.35)
    rgba = im.convert('RGBA')
    rgba = Image.alpha_composite(rgba, paper_texture(SIZE, warm, i + len(fid)))
    rgba = Image.alpha_composite(rgba, streaks(SIZE, accent, [0.15, .35, .62, 1, .85, .55, .2][i], i % 2 == 0))
    d = ImageDraw.Draw(rgba)
    # 위·아래 먹선 테두리와 순간적인 창끝/칼끝 섬광으로 컷인 전체가 전투 화면과 분리돼 보인다.
    d.rectangle((0, 0, SIZE[0], 10), fill=(22, 15, 10, 235))
    d.rectangle((0, SIZE[1] - 10, SIZE[0], SIZE[1]), fill=(22, 15, 10, 235))
    if i in (3, 4):
        cx, cy = (760, 178) if i == 3 else (850, 164)
        for r, a in ((8, 255), (24, 150), (52, 55)):
            d.ellipse((cx-r, cy-r, cx+r, cy+r), fill=(255, 246, 194, a))
        d.line((cx - 300, cy + 42, cx + 160, cy - 28), fill=(255, 247, 211, 220), width=8)
    if i == 0:
        veil = Image.new('RGBA', SIZE, (24, 17, 12, 0))
        vd = ImageDraw.Draw(veil)
        vd.rectangle((0, 0, 350, SIZE[1]), fill=(24, 17, 12, 175))
        rgba = Image.alpha_composite(rgba, veil)
    return rgba.convert('P', palette=Image.Palette.ADAPTIVE, colors=255)


def build_one(path):
    fid = path.stem
    base = Image.open(path).convert('RGB')
    frames = [frame(base, fid, i) for i in range(7)]
    dst = OUT / (fid + '.gif')
    dst.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(dst, save_all=True, append_images=frames[1:], duration=[110, 90, 75, 85, 100, 150, 260], loop=0, disposal=2, optimize=True)
    print(fid, '→', dst.relative_to(ROOT))


def build():
    paths = sorted(SOURCE.glob('*.png'))
    if not paths:
        raise SystemExit('ImageGen 원화가 없습니다: ' + str(SOURCE))
    for path in paths:
        build_one(path)
    print('컷인 GIF', len(paths), '장 완성')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--references', action='store_true')
    ap.add_argument('--build', action='store_true')
    args = ap.parse_args()
    if args.references:
        make_references()
    if args.build:
        build()
    if not args.references and not args.build:
        ap.print_help()


if __name__ == '__main__':
    main()
