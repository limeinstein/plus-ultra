#!/usr/bin/env python3
"""Compose V2 GIFs from genuine 7-stage and eight-angle ImageGen sheets."""
from __future__ import annotations

import argparse
import math
import re
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

from build import H, W, paper, pencil, tint_for_time, vertical_mask, wash_mask, watercolor


ROOT = Path(__file__).resolve().parents[2]
DISCOVERIES = ROOT / "js" / "data" / "discoveries.js"
WONDERS = ROOT / "js" / "data" / "wonders.js"
MORE_DISCOVERIES = ROOT / "js" / "data" / "moredisc.js"
CHAIN_DISCOVERIES = ROOT / "js" / "data" / "chaindisc.js"
MASTER = ROOT / "tools" / "ruin_gifs" / "v2" / "master"
PREVIEW_OUT = ROOT / "images" / "discoveries_v2"


def ruin_ids() -> list[str]:
    src = DISCOVERIES.read_text(encoding="utf-8")
    ids = re.findall(r"^\s*add\('([^']+)', '[^']+', 'ruin'", src, re.M)
    if WONDERS.exists():
        wonders = WONDERS.read_text(encoding="utf-8")
        ids.extend(re.findall(r"^\s*w\('([^']+)',\s*'[^']+'", wonders, re.M))
    if MORE_DISCOVERIES.exists():
        more = MORE_DISCOVERIES.read_text(encoding="utf-8")
        ids.extend(re.findall(r"^\s*ruin\('([^']+)'", more, re.M))
    if CHAIN_DISCOVERIES.exists():
        chain = CHAIN_DISCOVERIES.read_text(encoding="utf-8")
        ids.extend(re.findall(r"^\s*c\('[^']+',\s*'([^']+)',\s*'[^']+',\s*'ruin'", chain, re.M))
    return ids


def cells(path: Path, rows: int = 4) -> list[Image.Image]:
    src = Image.open(path).convert("RGB")
    cw, ch = src.width // 4, src.height // rows
    result = []
    for row in range(rows):
        for col in range(4):
            box = (col*cw, row*ch, (col+1)*cw if col < 3 else src.width,
                   (row+1)*ch if row < rows-1 else src.height)
            result.append(fit_whole(src.crop(box)))
    return result


# 칸(정사각형에 가까움)을 576×256에 넣는 방법.
# 예전에는 가운데를 잘라(ImageOps.fit) 위아래가 절반 넘게 잘려 지붕·탑 끝이 보이지 않았다.
# 이제는 칸의 맨 위(지붕 끝)부터 KEEP_BOTTOM까지 세로를 모두 살려 가운데에 두고,
# 양옆은 그림의 바깥 가장자리(나무·하늘·물)를 흐리게 늘여 이어 그리다가 종이색으로 번지듯 사라지게 한다
# (스케치북에 그린 수채화처럼 — 건물이 겹쳐 보이지 않게 가장자리 띠만 쓴다).
KEEP_TOP, KEEP_BOTTOM = 0.0, 0.93   # 칸 높이에서 남길 범위 (0 = 맨 위)
EDGE_STRIP = 0.14                   # 양옆을 이어 그릴 때 쓰는 가장자리 띠 (그림 너비 비율)
SIDE_BLUR, SIDE_FEATHER = 12, 34    # 양옆 바탕의 흐림, 가운데 그림과 섞이는 너비(px)
PAPER = (244, 236, 216)             # build.paper()의 바탕색
SIDE_FADE = .85                     # 바깥 끝에서 종이색으로 바래는 정도 (1 = 완전히 종이)


def _side(fg: Image.Image, width: int, left: bool) -> Image.Image:
    sw = max(2, int(fg.width * EDGE_STRIP))
    strip = fg.crop((0, 0, sw, H) if left else (fg.width - sw, 0, fg.width, H))
    strip = ImageOps.mirror(strip)            # 이음매 쪽 색이 그대로 이어지게 뒤집어 붙인다
    side = strip.resize((width, H), Image.Resampling.BICUBIC).filter(ImageFilter.GaussianBlur(SIDE_BLUR))
    side = ImageEnhance.Color(side).enhance(.8)
    paper = Image.new("RGB", (width, H), PAPER)
    fade = Image.new("L", (width, H))
    fp = fade.load()
    for x in range(width):
        t = x / max(1, width - 1)            # 0 = 이음매, 1 = 바깥 끝
        if left:
            t = 1 - t
        v = int(255 * min(1, SIDE_FADE * t ** 1.4))
        for y in range(H):
            fp[x, y] = v
    return Image.composite(paper, side, fade)


def fit_whole(cell: Image.Image) -> Image.Image:
    cw, ch = cell.size
    part = cell.crop((0, int(ch * KEEP_TOP), cw, int(ch * KEEP_BOTTOM)))
    fw = round(part.width * H / part.height)
    if fw >= W:
        return ImageOps.fit(part, (W, H), Image.Resampling.LANCZOS, centering=(0.5, 0.0))
    fg = part.resize((fw, H), Image.Resampling.LANCZOS)
    x0 = (W - fw) // 2
    out = Image.new("RGB", (W, H), PAPER)
    out.paste(_side(fg, x0 + SIDE_FEATHER, True), (0, 0))
    rw = W - x0 - fw + SIDE_FEATHER
    out.paste(_side(fg, rw, False), (W - rw, 0))
    mask = Image.new("L", (fw, H), 255)
    px = mask.load()
    for x in range(min(SIDE_FEATHER, fw // 2)):
        v = int(255 * (x + 1) / (SIDE_FEATHER + 1))
        for y in range(H):
            px[x, y] = v
            px[fw - 1 - x, y] = v
    out.paste(fg, (x0, 0), mask)
    return out


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
