#!/usr/bin/env python3
"""Compose V2 GIFs from genuine 7-stage and eight-angle ImageGen sheets."""
from __future__ import annotations

import argparse
import math
import re
from pathlib import Path

from PIL import Image, ImageOps

from build import H, W, paper, pencil, tint_for_time, vertical_mask, wash_mask, watercolor


ROOT = Path(__file__).resolve().parents[2]
DISCOVERIES = ROOT / "js" / "data" / "discoveries.js"
MASTER = ROOT / "tools" / "ruin_gifs" / "v2" / "master"
PREVIEW_OUT = ROOT / "images" / "discoveries_v2"


def ruin_ids() -> list[str]:
    src = DISCOVERIES.read_text(encoding="utf-8")
    return re.findall(r"^\s*add\('([^']+)', '[^']+', 'ruin'", src, re.M)


def cells(path: Path, rows: int = 4) -> list[Image.Image]:
    src = Image.open(path).convert("RGB")
    cw, ch = src.width // 4, src.height // rows
    result = []
    for row in range(rows):
        for col in range(4):
            box = (col*cw, row*ch, (col+1)*cw if col < 3 else src.width,
                   (row+1)*ch if row < rows-1 else src.height)
            result.append(ImageOps.fit(src.crop(box), (W, H), Image.Resampling.LANCZOS))
    return result


def construction_frames(master: list[Image.Image], base: Image.Image, seed: int):
    stages = master[:7]
    frames, durations = [], []
    # Each of the first five frames is a genuinely different construction state.
    for i in range(5):
        frames.append(pencil(stages[i], base, .72 + i*.08))
        durations.append(760)
    # Landscaping receives only a low ground wash; architecture stays graphite.
    s6_line = pencil(stages[5], base, 1.0)
    s6_color = watercolor(stages[5], base)
    frames.append(Image.composite(s6_color, s6_line, vertical_mask(.30, 54)))
    durations.append(860)
    # Final watercolor blooms over the completed graphite drawing.
    final_line = pencil(stages[6], base, 1.0)
    final_color = watercolor(stages[6], base)
    for n, progress in enumerate((.18, .39, .62, .86, 1.10)):
        frames.append(Image.composite(final_color, final_line, wash_mask(progress, seed+n)))
        durations.append(230 if n < 4 else 760)
    return frames, durations


def orbit_frames(master: list[Image.Image], base: Image.Image, seed: int):
    angles = [watercolor(frame, base) for frame in master[8:16]]
    frames, durations = [], []
    # Use only genuine generated azimuths. Crossfading produces doubled architecture.
    for i, spun in enumerate(angles):
        frames.append(tint_for_time(spun, i/7, seed))
        durations.append(380)
    durations[-1] = 820
    return frames, durations


def build_one(did: str, out_dir: Path) -> Path:
    seed = sum((i+1)*ord(c) for i, c in enumerate(did))
    base = paper(seed)
    master = cells(MASTER / f"{did}.png")
    first, first_ms = construction_frames(master, base, seed)
    orbit, orbit_ms = orbit_frames(master, base, seed)
    frames, durations = first+orbit, first_ms+orbit_ms
    out_dir.mkdir(parents=True, exist_ok=True)
    dst = out_dir / f"{did}.gif"
    master = frames[-1].convert("P", palette=Image.Palette.ADAPTIVE, colors=64)
    pal = [f.quantize(palette=master, dither=Image.Dither.FLOYDSTEINBERG) for f in frames]
    pal[0].save(dst, save_all=True, append_images=pal[1:], duration=durations,
                loop=0, disposal=1, optimize=True)
    return dst


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only")
    ap.add_argument("--preview", action="store_true",
                    help="write to images/discoveries_v2 instead of the live game directory")
    args = ap.parse_args()
    ids = args.only.split(",") if args.only else ruin_ids()
    missing = [did for did in ids if not (MASTER/f"{did}.png").exists()]
    if missing:
        raise SystemExit("missing V2 sheets: " + ", ".join(missing))
    out_dir = PREVIEW_OUT if args.preview else ROOT / "images" / "discoveries"
    for n, did in enumerate(ids, 1):
        dst = build_one(did, out_dir)
        print(f"[{n:02d}/{len(ids):02d}] {did:<16} {dst.stat().st_size/1024:.0f} KB")


if __name__ == "__main__":
    main()
