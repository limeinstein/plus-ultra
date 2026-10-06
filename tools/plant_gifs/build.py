#!/usr/bin/env python3
"""식물 원화 → 빈 캔버스에 유화가 완성되고 풍경이 숨 쉬는 발견 GIF.

실사 원화를 밑칠, 큰 붓질, 세부 붓질 순으로 캔버스에 드러낸다. 완성된
유화는 같은 구도의 실사 풍경으로 이어지고, 마지막에는 잎·물·빛이 아주
조금 움직인 뒤 원래 장면으로 돌아온다.
"""
from __future__ import annotations

import argparse
import math
import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[2]
SOURCES = ROOT / "tools" / "plant_gifs" / "sources"
OUT = ROOT / "images" / "discoveries"
ENDS = ROOT / "images" / "discovery-ends"
W, H = 576, 256

# 별탑은 식물인지 건축물인지 알 수 없다는 설정이므로 같은 연출에 넣는다.
PLANT_IDS = [
    "rubber", "sequoia", "breadfruit", "lotus", "welwitschia",
    "mangrove", "papyrus", "rafflesia", "carnivplant", "startower",
    "bullocho",
]


def seed_for(did: str) -> int:
    return sum((i + 7) * ord(c) for i, c in enumerate(did))


def fit_source(src: Image.Image) -> Image.Image:
    """가로가 긴 원화를 9:4 화면에 가장 적게 잘라 맞춘다."""
    return ImageOps.fit(src.convert("RGB"), (W, H), Image.Resampling.LANCZOS,
                        centering=(.5, .5))


def canvas(seed: int) -> Image.Image:
    """붓결이 희미하게 남은 따뜻한 아마포 캔버스."""
    rng = random.Random(seed)
    base = Image.new("RGB", (W, H), (232, 222, 197))
    noise = Image.effect_noise((W, H), 18).filter(ImageFilter.GaussianBlur(.35))
    fibers = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(fibers)
    for _ in range(150):
        y = rng.randrange(H)
        d.line((0, y, W, y + rng.choice((-1, 0, 1))),
               fill=rng.randrange(12, 34), width=rng.choice((1, 1, 2)))
    for _ in range(70):
        x = rng.randrange(W)
        d.line((x, 0, x + rng.choice((-1, 0, 1)), H),
               fill=rng.randrange(8, 23))
    texture = ImageChops.lighter(noise.point(lambda p: p // 7), fibers)
    pale = Image.new("RGB", (W, H), (204, 186, 151))
    return Image.composite(pale, base, texture)


def oil_layers(photo: Image.Image) -> tuple[Image.Image, Image.Image, Image.Image]:
    """같은 구도의 밑칠·큰 붓질·세부 유화 세 단계를 만든다."""
    def block(px: int) -> Image.Image:
        sw = max(16, W // px)
        sh = max(8, H // px)
        return photo.resize((sw, sh), Image.Resampling.BILINEAR).resize(
            (W, H), Image.Resampling.BICUBIC)

    broad = ImageEnhance.Color(block(16)).enhance(1.12)
    broad = ImageEnhance.Contrast(broad).enhance(.92)
    middle = Image.blend(block(7), photo.filter(ImageFilter.MedianFilter(7)), .45)
    middle = ImageEnhance.Color(middle).enhance(1.10)
    fine = Image.blend(photo.filter(ImageFilter.MedianFilter(3)), middle, .34)
    fine = ImageEnhance.Color(fine).enhance(1.08)
    fine = ImageEnhance.Sharpness(fine).enhance(.72)

    grain = Image.effect_noise((W, H), 24).filter(ImageFilter.GaussianBlur(.45))
    hi = Image.new("RGB", (W, H), (246, 235, 207))
    layers = []
    for i, layer in enumerate((broad, middle, fine)):
        k = (8, 6, 4)[i]
        veil = grain.point(lambda p, strength=k: max(0, min(255, (p - 112) * strength)))
        layers.append(Image.blend(layer, Image.composite(hi, layer, veil), .11))
    return layers[0], layers[1], layers[2]


def brush_schedule(seed: int) -> list[tuple[int, int, int, int, int]]:
    """먼 하늘부터 땅과 중심 식물까지 차례로 채우는 굵은 붓질."""
    rng = random.Random(seed)
    strokes: list[tuple[int, int, int, int, int]] = []
    bands = [
        (0, int(H * .34), 58, (26, 54), (-8, 8)),
        (int(H * .22), int(H * .64), 62, (22, 48), (-13, 13)),
        (int(H * .52), H, 52, (20, 44), (-16, 16)),
    ]
    for y0, y1, count, widths, slope in bands:
        for _ in range(count):
            x = rng.randrange(-25, W + 15)
            y = rng.randrange(y0, max(y0 + 1, y1))
            length = rng.randrange(widths[0], widths[1] + 1)
            dy = rng.randrange(slope[0], slope[1] + 1)
            strokes.append((x, y, x + length, y + dy, rng.randrange(9, 22)))
    # 주인공 식물은 마지막에 세로·사선의 짧은 붓으로 형태를 세운다.
    for _ in range(46):
        x = rng.randrange(int(W * .17), int(W * .83))
        y = rng.randrange(int(H * .10), int(H * .94))
        length = rng.randrange(18, 46)
        angle = rng.uniform(-1.25, 1.25)
        strokes.append((x, y, round(x + math.cos(angle) * length),
                        round(y + math.sin(angle) * length), rng.randrange(7, 16)))
    return strokes


def add_strokes(mask: Image.Image, strokes: list[tuple[int, int, int, int, int]],
                start: int, stop: int, seed: int) -> None:
    d = ImageDraw.Draw(mask)
    rng = random.Random(seed + start * 31)
    for x0, y0, x1, y1, width in strokes[start:stop]:
        ink = rng.randrange(205, 256)
        d.line((x0, y0, x1, y1), fill=ink, width=width)
        r = max(2, width // 2)
        d.ellipse((x0-r, y0-r, x0+r, y0+r), fill=ink)
        d.ellipse((x1-r, y1-r, x1+r, y1+r), fill=ink)


def painted_frames(photo: Image.Image, did: str) -> list[Image.Image]:
    seed = seed_for(did)
    cloth = canvas(seed)
    broad, middle, fine = oil_layers(photo)
    strokes = brush_schedule(seed)
    mask = Image.new("L", (W, H), 0)
    frames = [cloth]
    cursor = 0
    for step in range(1, 11):
        stop = round(len(strokes) * step / 10)
        add_strokes(mask, strokes, cursor, stop, seed)
        cursor = stop
        soft = mask.filter(ImageFilter.GaussianBlur(1.1))
        if step >= 8:
            wash = Image.new("L", (W, H), round((step - 7) / 3 * 255))
            soft = ImageChops.lighter(soft, wash)
        if step <= 3:
            paint = broad
        elif step <= 7:
            paint = Image.blend(broad, middle, (step - 3) / 4)
        else:
            paint = Image.blend(middle, fine, (step - 7) / 3)
        frames.append(Image.composite(paint, cloth, soft))
    frames.extend((Image.blend(middle, fine, .35),
                   Image.blend(middle, fine, .68), fine))
    return frames


def living_frame(photo: Image.Image, phase: float) -> Image.Image:
    """잎·물결·공기가 숨 쉬는 정도의 미세한 흔들림."""
    if phase <= .0001 or phase >= .9999:
        return photo.copy()
    wave = math.sin(phase * math.tau)
    out = Image.new("RGB", (W, H))
    band = 8
    for y in range(0, H, band):
        y1 = min(H, y + band)
        sway = round(math.sin(y * .075 + phase * math.tau) * 1.25 * (y / H) + wave * .6)
        strip = photo.crop((0, y, W, y1))
        if sway > 0:
            strip = ImageChops.offset(strip, sway, 0)
            strip.paste(photo.crop((0, y, sway, y1)), (0, 0))
        elif sway < 0:
            strip = ImageChops.offset(strip, sway, 0)
            strip.paste(photo.crop((W + sway, y, W, y1)), (W + sway, 0))
        out.paste(strip, (0, y))
    out = ImageEnhance.Brightness(out).enhance(1 + wave * .008)
    return ImageEnhance.Color(out).enhance(1 + wave * .006)


def animation(src: Image.Image, did: str) -> tuple[list[Image.Image], list[int]]:
    photo = fit_source(src)
    frames = painted_frames(photo, did)
    oil = frames[-1]
    for u in (.18, .42, .70, 1.0):
        frames.append(Image.blend(oil, photo, u))
    # 직전 장면이 이미 실사 원화이므로 0.0을 되풀이하지 않고 곧장 첫 숨결로 간다.
    for phase in (.08, .24, .40, .56, .72, 1.0):
        frames.append(living_frame(photo, phase))
    durations = [520] + [340] * 10 + [300] * 3 + [270] * 4 + [400] * 5 + [500]
    assert len(frames) == len(durations) == 24
    assert sum(durations) == 8400
    return frames, durations


def shared_palette(frames: list[Image.Image]) -> Image.Image:
    sheet = Image.new("RGB", (W * 3, H * 2))
    for i, idx in enumerate((0, 4, 9, 13, 17, 22)):
        sheet.paste(frames[idx], ((i % 3) * W, (i // 3) * H))
    return sheet.convert("P", palette=Image.Palette.ADAPTIVE, colors=96)


def build_one(did: str) -> Path:
    source = SOURCES / f"{did}.png"
    with Image.open(source) as raw:
        frames, durations = animation(raw.convert("RGB"), did)
    palette = shared_palette(frames)
    pal = [f.quantize(palette=palette, dither=Image.Dither.FLOYDSTEINBERG) for f in frames]
    OUT.mkdir(parents=True, exist_ok=True)
    dst = OUT / f"{did}.gif"
    pal[0].save(dst, save_all=True, append_images=pal[1:], duration=durations,
                loop=0, disposal=1, optimize=True)
    ENDS.mkdir(parents=True, exist_ok=True)
    frames[-1].save(ENDS / f"{did}.jpg", "JPEG", quality=91, optimize=True)
    return dst


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="쉼표로 구분한 식물 발견물 ID")
    args = ap.parse_args()
    wanted = set(args.only.split(",")) if args.only else None
    ids = [did for did in PLANT_IDS if wanted is None or did in wanted]
    unknown = sorted((wanted or set()) - set(PLANT_IDS))
    if unknown:
        raise SystemExit("unknown plant discovery ids: " + ", ".join(unknown))
    missing = [did for did in ids if not (SOURCES / f"{did}.png").exists()]
    if missing:
        raise SystemExit("missing plant panorama sources: " + ", ".join(missing))
    for n, did in enumerate(ids, 1):
        dst = build_one(did)
        print(f"[{n:02d}/{len(ids):02d}] {did:<12} {dst.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
