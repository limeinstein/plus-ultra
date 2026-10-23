#!/usr/bin/env python3
"""일기토 전투원 원화를 화면 가득 차는 필살기 컷인 그림(정지 WebP 한 장)으로 만든다.

ImageGen이 만든 `images/duel/cutins/_source/<id>.png` 한 장에 종이결·속도선·위아래 먹선 테두리를 입혀
`images/duel/cutins/<id>.webp`로 저장한다. 먹선 등장 → 무기 돌진 → 섬광 → 멈춤은 게임 화면의 CSS가 움직인다.
`--preview`는 예전 7장 GIF 연출을 확인용으로만 `.work/cutin_preview`에 만든다.
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


def light_sweep(size, pos, power):
    """비스듬한 빛줄기 한 줄 (pos 0~1: 왼쪽→오른쪽 위치, power: 세기)."""
    w, h = size
    band = Image.new('L', (w * 2, h * 2), 0)
    d = ImageDraw.Draw(band)
    cx = int(w * 2 * pos)
    for half, a in ((150, 50), (80, 110), (34, 190), (10, 255)):
        d.rectangle((cx - half, 0, cx + half, h * 2), fill=int(a * power))
    band = band.filter(ImageFilter.GaussianBlur(18)).rotate(-24, resample=Image.Resampling.BICUBIC)
    band = band.crop((w // 2, h // 2, w // 2 + w, h // 2 + h))
    glow = Image.new('RGBA', size, (255, 244, 208, 0))
    glow.putalpha(band)
    return glow


def frame(base, fid, i, flash=True):
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
    if flash and i in (3, 4):
        # 섬광: 고정된 원 대신 화면을 비스듬히 가로지르는 빛줄기 — 무기가 어디에 있든 어색하지 않다.
        rgba = Image.alpha_composite(rgba, light_sweep(SIZE, .38 if i == 3 else .78, 1.0 if i == 3 else .6))
    if i == 0:
        veil = Image.new('RGBA', SIZE, (24, 17, 12, 0))
        vd = ImageDraw.Draw(veil)
        vd.rectangle((0, 0, 350, SIZE[1]), fill=(24, 17, 12, 175))
        rgba = Image.alpha_composite(rgba, veil)
    return rgba.convert('RGB')


def build_one(path):
    """정지 그림 한 장(WebP)만 만든다. 먹선 등장 → 돌진 → 섬광 → 멈춤은 게임 화면의 CSS 움직임이 맡는다
    (css/style.css .rd-motion.cutin · .rd-cut-flash). 7장짜리 GIF는 한 장에 1.5MB였지만 정지 그림은 0.1~0.2MB다."""
    fid = path.stem
    base = Image.open(path).convert('RGB')
    still = frame(base, fid, 3, flash=False)
    dst = OUT / (fid + '.webp')
    dst.parent.mkdir(parents=True, exist_ok=True)
    still.save(dst, quality=84, method=6)
    old = OUT / (fid + '.gif')
    if old.exists():
        old.unlink()  # 예전 GIF가 남아 있으면 그림 목록(manifest)이 GIF를 먼저 집는다
    print(fid, '→', dst.relative_to(ROOT))


def preview_one(path):
    """움직임을 눈으로 확인할 때만: 예전처럼 7장 GIF를 .work/cutin_preview에 만든다 (게임에는 쓰지 않는다)."""
    fid = path.stem
    base = Image.open(path).convert('RGB')
    frames = [frame(base, fid, i).convert('P', palette=Image.Palette.ADAPTIVE, colors=255) for i in range(7)]
    dst = ROOT / '.work' / 'cutin_preview' / (fid + '.gif')
    dst.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(dst, save_all=True, append_images=frames[1:], duration=[110, 90, 75, 85, 100, 150, 260], loop=0, disposal=2, optimize=True)
    print(fid, '→', dst.relative_to(ROOT))


def build():
    paths = sorted(SOURCE.glob('*.png'))
    if not paths:
        raise SystemExit('ImageGen 원화가 없습니다: ' + str(SOURCE))
    for path in paths:
        build_one(path)
    print('컷인', len(paths), '장 완성')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--references', action='store_true')
    ap.add_argument('--build', action='store_true')
    ap.add_argument('--preview', action='store_true', help='움직임 확인용 GIF (.work/cutin_preview)')
    args = ap.parse_args()
    if args.references:
        make_references()
    if args.build:
        build()
    if args.preview:
        for path in sorted(SOURCE.glob('*.png')):
            preview_one(path)
    if not args.references and not args.build and not args.preview:
        ap.print_help()


if __name__ == '__main__':
    main()
