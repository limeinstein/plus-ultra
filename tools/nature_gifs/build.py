#!/usr/bin/env python3
"""자연 경관 원화에 시간 변화와 파노라마 이동을 더해 발견 GIF를 만든다."""
from __future__ import annotations

import argparse
import math
import random
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[2]
DISCOVERIES = ROOT / "js" / "data" / "discoveries.js"
NATURALS = ROOT / "js" / "data" / "naturals.js"
SOURCES = ROOT / "tools" / "nature_gifs" / "sources"
OUT = ROOT / "images" / "discoveries"
ENDS = ROOT / "images" / "discovery-ends"
W, H = 576, 256

# 장소마다 가장 높은 지형선이 달라 해와 별이 바위나 숲 앞에 겹치지 않게 맞춘다.
SKYLINE = {
    "pamukkale": .16,
    "huangshan": .08,
    "uluru": .27,
    "canyon": .14,
    "monument": .23,
    "niagara": .15,
    "iguazu": .09,
    "gibraltar": .12,
    "vesuvius": .10,
    "matterhorn": .04,
    "vihren": .05,
    "gullfoss": .13,
    "eyjafjalla": .12,
    "sinai": .05,
    "kilimanjaro": .05,
    "lengai": .06,
    "solomon": .06,
    "adamspeak": .05,
    "flowers": .04,
    "kailash": .05,
    "machapuchare": .04,
    "everest": .03,
    "zhangjiajie": .05,
    "seongsan": .16,
    "nachi": .05,
    "fuji": .05,
    "reef": .10,
    "mapuavaea": .14,
    "bermuda": .12,
    "youth": .05,
    "bluehole": .08,
    "barringer": .10,
    "redwood": .02,
    "craterlake": .06,
    "devilstower": .10,
    "oldfaithful": .03,
    "joatinga": .05,
    "roraima": .06,
    "vinicunca": .03,
    "cerrorico": .04,
    "torrespaine": .03,
}


def nature_rows() -> list[tuple[str, str]]:
    """기존 자연 발견과 naturals.js에 덧붙인 경관을 데이터 순서대로 읽는다."""
    src = DISCOVERIES.read_text(encoding="utf-8")
    rows = re.findall(r"^\s*add\('([^']+)', '([^']+)', 'nature'", src, re.M)
    if NATURALS.exists():
        src = NATURALS.read_text(encoding="utf-8")
        rows += re.findall(r"^\s*n\('([^']+)', '([^']+)'", src, re.M)
    return rows


def lerp(a: float, b: float, u: float) -> float:
    return a * (1 - u) + b * u


def ease(u: float) -> float:
    return .5 - .5 * math.cos(math.pi * max(0, min(1, u)))


def viewport(src: Image.Image, zoom: float, pan: float) -> Image.Image:
    """먼 원경에서 확대해 왼쪽부터 오른쪽까지 천천히 훑는다."""
    crop_h = min(src.height, max(1, round(src.height / zoom)))
    crop_w = min(src.width, max(1, round(crop_h * W / H)))
    # 드물게 세로가 긴 원화가 들어와도 9:4 화면을 빈틈없이 채운다.
    if crop_w == src.width:
        crop_h = min(src.height, round(crop_w * H / W))
    left_c = crop_w / 2
    right_c = src.width - crop_w / 2
    cx = lerp(left_c, right_c, ease(pan))
    cy = src.height / 2
    x0 = max(0, min(src.width - crop_w, round(cx - crop_w / 2)))
    y0 = max(0, min(src.height - crop_h, round(cy - crop_h / 2)))
    crop = src.crop((x0, y0, x0 + crop_w, y0 + crop_h))
    return crop.resize((W, H), Image.Resampling.LANCZOS)


def time_values(phase: float) -> tuple[tuple[int, int, int], float, float, float]:
    """새벽 → 아침 → 한낮 → 노을 → 밤의 색·밝기·채도를 보간한다."""
    keys = (
        (0.00, (45, 58, 105), .43, .62, .78),
        (0.13, (255, 174, 108), .22, .86, .94),
        (0.38, (255, 246, 222), .035, 1.05, 1.02),
        (0.67, (225, 105, 58), .27, .84, 1.08),
        (0.82, (87, 66, 112), .39, .62, .82),
        (1.00, (24, 39, 77), .56, .42, .60),
    )
    phase = max(0, min(1, phase))
    for a, b in zip(keys, keys[1:]):
        if a[0] <= phase <= b[0]:
            u = (phase - a[0]) / (b[0] - a[0])
            color = tuple(round(lerp(a[1][i], b[1][i], u)) for i in range(3))
            return color, lerp(a[2], b[2], u), lerp(a[3], b[3], u), lerp(a[4], b[4], u)
    return keys[-1][1:]


def sun_layer(phase: float, horizon: float) -> Image.Image:
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if not .025 <= phase <= .79:
        return layer
    day = min(1, phase / .76)
    x = lerp(W * .12, W * .88, day)
    base_y, top_y = H * horizon, H * .055
    y = base_y - math.sin(math.pi * day) * max(0, base_y - top_y)
    strength = min(1, (phase - .025) / .075, (.79 - phase) / .075)
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow, "RGBA")
    r = 22
    gd.ellipse((x-r, y-r, x+r, y+r), fill=(255, 188, 91, round(125 * strength)))
    glow = glow.filter(ImageFilter.GaussianBlur(16))
    layer = Image.alpha_composite(layer, glow)
    d = ImageDraw.Draw(layer, "RGBA")
    r = 4.5
    d.ellipse((x-r, y-r, x+r, y+r), fill=(255, 236, 178, round(220 * strength)))
    return layer


def night_layer(phase: float, skyline: float, seed: int) -> Image.Image:
    night = max(0, min(1, (phase - .79) / .18))
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if night <= 0:
        return layer
    d = ImageDraw.Draw(layer, "RGBA")
    rng = random.Random(seed)
    for _ in range(48):
        x = rng.randrange(8, W - 8)
        y = rng.randrange(7, max(8, round(H * skyline)))
        a = round(night * rng.uniform(95, 205))
        r = rng.choice((.7, .8, 1.0, 1.2))
        d.ellipse((x-r, y-r, x+r, y+r), fill=(250, 242, 205, a))
    mx, my, r = W * .78, H * .14, 9
    d.ellipse((mx-r, my-r, mx+r, my+r), fill=(250, 239, 191, round(230 * night)))
    d.ellipse((mx-r+5, my-r-2, mx+r+7, my+r-2), fill=(37, 52, 91, round(225 * night)))
    return layer


def grade(im: Image.Image, phase: float, skyline: float, seed: int) -> Image.Image:
    color, alpha, bright, saturation = time_values(phase)
    out = ImageEnhance.Brightness(im).enhance(bright)
    out = ImageEnhance.Color(out).enhance(saturation)
    out = Image.blend(out, Image.new("RGB", out.size, color), alpha)
    out = ImageEnhance.Contrast(out).enhance(.96)
    rgba = out.convert("RGBA")
    rgba = Image.alpha_composite(rgba, sun_layer(phase, skyline))
    rgba = Image.alpha_composite(rgba, night_layer(phase, skyline, seed))
    return rgba.convert("RGB")


def animation(src: Image.Image, did: str) -> tuple[list[Image.Image], list[int]]:
    seed = sum((i + 1) * ord(c) for i, c in enumerate(did))
    skyline = SKYLINE.get(did, .15)
    frames: list[Image.Image] = []
    durations: list[int] = []

    # 새벽 원경: 해가 떠오르기 직전부터 장면이 천천히 가까워진다.
    for phase, zoom in ((0.00, 1.00), (0.05, 1.025), (0.10, 1.07)):
        frames.append(grade(viewport(src, zoom, .50), phase, skyline, seed))
        durations.append(500)

    # 파노라마: 해가 오르고 중천을 지나 노을과 밤까지 왼쪽에서 오른쪽으로 훑는다.
    for i in range(18):
        u = i / 17
        frames.append(grade(viewport(src, 1.32, lerp(.04, .96, u)), lerp(.12, 1.0, u), skyline, seed))
        durations.append(380)

    # 밤이 된 풍경을 다시 한 화면의 원경으로 되돌린다.
    for zoom, pan in ((1.24, .82), (1.16, .70), (1.08, .58)):
        frames.append(grade(viewport(src, zoom, pan), 1.0, skyline, seed))
        durations.append(360)
    frames.append(grade(viewport(src, 1.00, .50), 1.0, skyline, seed))
    durations.append(400)
    assert sum(durations) == 9820
    return frames, durations


def shared_palette(frames: list[Image.Image]) -> Image.Image:
    sheet = Image.new("RGB", (W * 2, H * 2))
    for xy, idx in zip(((0, 0), (W, 0), (0, H), (W, H)), (0, 10, 18, len(frames) - 1)):
        sheet.paste(frames[idx], xy)
    return sheet.convert("P", palette=Image.Palette.ADAPTIVE, colors=64)


def build_one(did: str) -> Path:
    source = SOURCES / f"{did}.png"
    with Image.open(source) as raw:
        src = raw.convert("RGB")
    frames, durations = animation(src, did)
    palette = shared_palette(frames)
    pal = [frame.quantize(palette=palette, dither=Image.Dither.FLOYDSTEINBERG) for frame in frames]

    OUT.mkdir(parents=True, exist_ok=True)
    dst = OUT / f"{did}.gif"
    pal[0].save(dst, save_all=True, append_images=pal[1:], duration=durations,
                loop=0, disposal=1, optimize=True)

    ENDS.mkdir(parents=True, exist_ok=True)
    frames[-1].save(ENDS / f"{did}.jpg", "JPEG", quality=90, optimize=True)
    return dst


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="쉼표로 구분한 자연 발견물 ID")
    args = ap.parse_args()
    wanted = set(args.only.split(",")) if args.only else None
    rows = [(did, name) for did, name in nature_rows() if wanted is None or did in wanted]
    missing = [did for did, _ in rows if not (SOURCES / f"{did}.png").exists()]
    if missing:
        raise SystemExit("missing nature panorama sources: " + ", ".join(missing))
    for n, (did, _name) in enumerate(rows, 1):
        dst = build_one(did)
        print(f"[{n:02d}/{len(rows):02d}] {did:<16} {dst.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
