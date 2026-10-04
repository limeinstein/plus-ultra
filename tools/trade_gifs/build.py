#!/usr/bin/env python3
"""교역품 발견 장면 프레임(tools/procedural_art 로 찍은 24장) → 576×256 GIF와 마지막 장면.

    python tools/trade_gifs/build.py                 # frames/ 안의 모든 교역품
    python tools/trade_gifs/build.py --only t_pepper,t_tea
    python tools/trade_gifs/build.py --frames 다른/폴더

프레임은 tools/trade_gifs/frames/ID/00.png ~ 23.png (node tools/procedural_art/run_trade.js 가 만든다).
보물 GIF와 같은 8.4초 길이로, 등불 켜진 시장 좌판에 카메라가 천천히 다가간다.
"""
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
FRAMES = ROOT / "tools" / "trade_gifs" / "frames"
OUT = ROOT / "images" / "discoveries"
ENDS = ROOT / "images" / "discovery-ends"
W, H = 576, 256
DURATIONS = [400, 400] + [300] * 18 + [300, 400, 500, 1000]
assert sum(DURATIONS) == 8400


def vignette(im: Image.Image) -> Image.Image:
    mask = Image.new("L", (W, H), 255)
    ImageDraw.Draw(mask).ellipse((-80, -70, W + 80, H + 90), fill=0)
    mask = mask.filter(ImageFilter.GaussianBlur(48))
    return Image.composite(Image.new("RGB", (W, H), (6, 3, 1)), im, mask)


def grade(im: Image.Image, k: float) -> Image.Image:
    im = ImageEnhance.Contrast(im).enhance(1.05)
    im = ImageEnhance.Brightness(im).enhance(0.9 + 0.12 * k)
    glow = im.filter(ImageFilter.GaussianBlur(10))
    im = ImageChops.screen(im, ImageEnhance.Brightness(glow).enhance(0.18))
    return vignette(im)


def build_one(tid: str, src: Path) -> Path:
    files = sorted((src / tid).glob("*.png"))
    if len(files) < 2:
        raise SystemExit(f"{tid}: 프레임이 없습니다 ({src / tid})")
    raw = [Image.open(f).convert("RGB").resize((W, H), Image.Resampling.LANCZOS) for f in files]
    n = len(DURATIONS)
    pick = [round(i * (len(raw) - 1) / (n - 1)) for i in range(n)]
    frames = [grade(raw[p], i / (n - 1)) for i, p in enumerate(pick)]
    sample = Image.new("RGB", (W * 4, H * 2))
    for i in range(8):
        sample.paste(frames[round(i * (n - 1) / 7)], ((i % 4) * W, (i // 4) * H))
    palette = sample.convert("P", palette=Image.Palette.ADAPTIVE, colors=128)
    pal = [f.quantize(palette=palette, dither=Image.Dither.FLOYDSTEINBERG) for f in frames]
    OUT.mkdir(parents=True, exist_ok=True)
    dst = OUT / f"{tid}.gif"
    pal[0].save(dst, save_all=True, append_images=pal[1:], duration=DURATIONS, loop=0, disposal=1, optimize=True)
    ENDS.mkdir(parents=True, exist_ok=True)
    frames[-1].save(ENDS / f"{tid}.jpg", "JPEG", quality=93, optimize=True)
    return dst


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only")
    ap.add_argument("--frames", default=str(FRAMES))
    a = ap.parse_args()
    src = Path(a.frames)
    ids = a.only.split(",") if a.only else sorted(p.name for p in src.iterdir() if p.is_dir())
    for i, tid in enumerate(ids, 1):
        d = build_one(tid, src)
        print(f"[{i:02d}/{len(ids):02d}] {tid:<12} {d.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
