#!/usr/bin/env python3
"""Build text-free seven-stage reconstruction GIFs with a day/night 360 orbit."""
from __future__ import annotations

import argparse
import math
import random
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[2]
DISCOVERIES = ROOT / "js" / "data" / "discoveries.js"
SOURCES = ROOT / "tools" / "ruin_gifs" / "reconstructions"
OUT = ROOT / "images" / "discoveries"
W, H = 576, 256


def ruin_rows() -> list[tuple[str, str]]:
    src = DISCOVERIES.read_text(encoding="utf-8")
    return re.findall(r"^\s*add\('([^']+)', '([^']+)', 'ruin'", src, re.M)


def paper(seed: int) -> Image.Image:
    rng = random.Random(seed)
    im = Image.new("RGB", (W, H), (244, 236, 216))
    px = im.load()
    for y in range(H):
        for x in range(W):
            n = rng.randrange(-6, 7)
            px[x, y] = (244 + n, 236 + n, 216 + n)
    return im.filter(ImageFilter.GaussianBlur(.28))


def views(path: Path) -> list[Image.Image]:
    """Split the ImageGen 2x2 turnaround and crop each panel to the 9:4 card."""
    src = Image.open(path).convert("RGB")
    mx, my = src.width // 2, src.height // 2
    boxes = ((0, 0, mx, my), (mx, 0, src.width, my),
             (mx, my, src.width, src.height), (0, my, mx, src.height))
    return [ImageOps.fit(src.crop(box), (W, H), Image.Resampling.LANCZOS,
                         centering=(.5, .50)) for box in boxes]


def watercolor(im: Image.Image, base: Image.Image) -> Image.Image:
    soft = im.filter(ImageFilter.GaussianBlur(.45))
    soft = ImageEnhance.Color(soft).enhance(.82)
    soft = ImageEnhance.Contrast(soft).enhance(.93)
    return Image.blend(base, soft, .93)


def pencil(im: Image.Image, base: Image.Image, strength: float = 1.0) -> Image.Image:
    gray = ImageOps.grayscale(im)
    edges = gray.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.GaussianBlur(.35))
    edges = ImageOps.autocontrast(edges, cutoff=1)
    mask = edges.point(lambda p: 0 if p < 23 else min(210, int((p - 23) * 1.7 * strength)))
    graphite = Image.new("RGB", (W, H), (61, 57, 53))
    out = Image.composite(graphite, base, mask)
    ghost = ImageOps.colorize(gray, (94, 88, 80), (244, 236, 216))
    return Image.blend(out, ghost, min(.13, .07 * strength))


def vertical_mask(height_ratio: float, feather: int = 30) -> Image.Image:
    cut = H * (1.0 - height_ratio)
    m = Image.new("L", (W, H), 0)
    p = m.load()
    for y in range(H):
        a = int(max(0, min(255, (y - cut + feather) * 255 / max(1, feather))))
        for x in range(W):
            p[x, y] = a
    return m


def wash_mask(progress: float, seed: int) -> Image.Image:
    """Irregular watercolor bloom expanding from lower centre."""
    rng = random.Random(seed)
    cx, cy = W * .5, H * .68
    radius = 42 + progress * math.hypot(W * .58, H * .88)
    m = Image.new("L", (W, H), 0)
    px = m.load()
    for y in range(H):
        for x in range(W):
            wobble = 15 * math.sin(x * .047) + 9 * math.sin(y * .071) + rng.randrange(-5, 6)
            d = math.hypot((x - cx) * .88, (y - cy) * 1.1)
            px[x, y] = int(max(0, min(255, (radius + wobble - d) * 8)))
    return m.filter(ImageFilter.GaussianBlur(4.2))


def tint_for_time(im: Image.Image, phase: float, seed: int) -> Image.Image:
    """Morning -> noon -> sunset -> moonlit night -> dawn over one orbit."""
    keys = ((0.00, (255, 211, 164), .16, .94),
            (0.25, (255, 248, 226), .03, 1.04),
            (0.52, (225, 114, 72), .23, .82),
            (0.75, (35, 61, 108), .50, .48),
            (1.00, (255, 211, 164), .16, .94))
    color, alpha, bright = keys[0][1:]
    for i in range(len(keys) - 1):
        if keys[i][0] <= phase <= keys[i + 1][0]:
            a, b = keys[i], keys[i + 1]
            u = (phase - a[0]) / (b[0] - a[0])
            color = tuple(round(a[1][j] * (1-u) + b[1][j] * u) for j in range(3))
            alpha = a[2] * (1-u) + b[2] * u
            bright = a[3] * (1-u) + b[3] * u
            break
    out = ImageEnhance.Brightness(im).enhance(bright)
    out = Image.blend(out, Image.new("RGB", out.size, color), alpha)
    d = ImageDraw.Draw(out, "RGBA")
    night = max(0.0, 1.0 - abs(phase - .75) / .23)
    if night > .08:
        rng = random.Random(seed)
        for _ in range(25):
            x, y = rng.randrange(12, W - 12), rng.randrange(9, 91)
            a = int(155 * night * rng.uniform(.4, 1.0))
            d.ellipse((x, y, x + 1.4, y + 1.4), fill=(244, 238, 196, a))
        mx = int(W * (.78 - .24 * (phase - .62)))
        my = int(36 - 14 * math.sin((phase - .62) / .28 * math.pi))
        r = 10
        d.ellipse((mx-r, my-r, mx+r, my+r), fill=(250, 238, 192, int(225*night)))
        d.ellipse((mx-r+5, my-r-2, mx+r+7, my+r-2), fill=(42, 65, 106, int(205*night)))
    return out


def construction_frames(color: Image.Image, base: Image.Image, seed: int) -> tuple[list[Image.Image], list[int]]:
    line = pencil(color, base, 1.0)
    faint = pencil(color, base, .42)
    frames: list[Image.Image] = []
    # 1 survey/earthwork: almost blank paper, only faint site and ground traces.
    frames.append(Image.blend(base, Image.composite(faint, base, vertical_mask(.24, 48)), .58))
    # 2 foundation and structural base.
    frames.append(Image.composite(line, faint, vertical_mask(.34, 42)))
    # 3 exterior and roof/waterproofing rise.
    frames.append(Image.composite(line, faint, vertical_mask(.62, 42)))
    # 4 interior/services: full mass is legible in lighter graphite.
    frames.append(Image.blend(faint, line, .56))
    # 5 completed monument in decisive graphite.
    frames.append(line)
    # 6 landscape receives a restrained earth/vegetation wash.
    ground = watercolor(color, base)
    frames.append(Image.composite(ground, line, vertical_mask(.31, 50)))
    # 7 watercolor arrives as an irregular spreading wash.
    wc = watercolor(color, base)
    for n, progress in enumerate((.22, .50, .82, 1.12)):
        frames.append(Image.composite(wc, line, wash_mask(progress, seed + n)))
    durations = [720, 720, 720, 720, 800, 860, 240, 240, 270, 760]
    return frames, durations


def orbit_frames(vs: list[Image.Image], base: Image.Image, seed: int) -> tuple[list[Image.Image], list[int]]:
    rendered = [watercolor(v, base) for v in vs]
    frames, durations = [], []
    steps = 4
    for i in range(4 * steps):
        pos = i / steps
        idx, u = int(pos) % 4, pos % 1
        ease = .5 - .5 * math.cos(math.pi * u)
        spun = Image.blend(rendered[idx], rendered[(idx + 1) % 4], ease)
        phase = i / (4 * steps - 1)
        frames.append(tint_for_time(spun, phase, seed))
        durations.append(205)
    durations[-1] = 820
    return frames, durations


def build_one(did: str, source: Path) -> Path:
    seed = sum((i + 1) * ord(c) for i, c in enumerate(did))
    base = paper(seed)
    vs = views(source)
    first, first_ms = construction_frames(vs[0], base, seed)
    orbit, orbit_ms = orbit_frames(vs, base, seed)
    frames, durations = first + orbit, first_ms + orbit_ms
    OUT.mkdir(parents=True, exist_ok=True)
    dst = OUT / f"{did}.gif"
    # One shared palette lets GIF encode frame deltas instead of repeating large local tables.
    master = frames[-1].convert("P", palette=Image.Palette.ADAPTIVE, colors=64)
    pal = [f.quantize(palette=master, dither=Image.Dither.FLOYDSTEINBERG) for f in frames]
    pal[0].save(dst, save_all=True, append_images=pal[1:], duration=durations,
                loop=0, disposal=1, optimize=True)
    return dst


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="comma-separated discovery ids")
    args = ap.parse_args()
    wanted = set(args.only.split(",")) if args.only else None
    rows = [(did, name) for did, name in ruin_rows() if wanted is None or did in wanted]
    missing = [did for did, _ in rows if not (SOURCES / f"{did}.png").exists()]
    if missing:
        raise SystemExit("missing ImageGen turnaround sources: " + ", ".join(missing))
    for n, (did, _name) in enumerate(rows, 1):
        dst = build_one(did, SOURCES / f"{did}.png")
        print(f"[{n:02d}/{len(rows):02d}] {did:<16} {dst.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    # V2 uses genuinely different construction scenes and eight generated
    # azimuths.  Keep this module's drawing helpers available to build_v2.
    from build_v2 import main as v2_main
    v2_main()
