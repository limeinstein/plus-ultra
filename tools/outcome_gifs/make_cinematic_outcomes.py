#!/usr/bin/env python3
"""Build the smooth outcome animations from the ImageGen source paintings.

The source files live in ``tools/outcome_gifs/sources/v2``.  Each image is
centre-cropped to 8:5, then receives a restrained loading-screen style camera
move and colour pulse.  The output is animated WebP rather than GIF so the
painted gradients remain smooth without making ten very large files.

Run from the WebGame directory:
    python tools/outcome_gifs/make_cinematic_outcomes.py
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[2]
SRC = Path(__file__).resolve().parent / "sources" / "v2"
OUT = ROOT / "images" / "outcomes"
SIZE = (720, 450)
FRAMES = 26
FRAME_MS = 100
INTRO_FRAMES = 14       # 1.4초: 성공·실패보다 먼저 따로 재생하는 중립 장면
INTRO_NAMES = {"negotiate_open", "negotiate_open_f", "sneak_open", "sneak_open_f",
               "propose_open", "propose_open_f"}


GOOD = {"win", "win_f", "sneak_ok", "sneak_ok_f", "propose", "propose_f"}
FOCUS = {
    "win": (0.50, 0.58),
    "win_f": (0.50, 0.58),
    "lose": (0.52, 0.55),
    "lose_f": (0.52, 0.55),
    "sneak_ok": (0.57, 0.53),
    "sneak_ok_f": (0.57, 0.53),
    "sneak_fail": (0.51, 0.48),
    "sneak_fail_f": (0.51, 0.48),
    "sneak_open": (0.50, 0.52),
    "sneak_open_f": (0.50, 0.52),
    "negotiate_open": (0.50, 0.54),
    "negotiate_open_f": (0.50, 0.54),
    "propose": (0.50, 0.55),
    "propose_f": (0.50, 0.55),
    "propose_fail": (0.50, 0.55),
    "propose_fail_f": (0.50, 0.55),
    "propose_open": (0.50, 0.55),
    "propose_open_f": (0.50, 0.55),
}


def crop_8x5(im: Image.Image) -> Image.Image:
    target = 8 / 5
    ratio = im.width / im.height
    if ratio > target:
        w = round(im.height * target)
        left = (im.width - w) // 2
        return im.crop((left, 0, left + w, im.height))
    h = round(im.width / target)
    top = (im.height - h) // 2
    return im.crop((0, top, im.width, top + h))


def camera(im: Image.Image, scale: float, focus: tuple[float, float]) -> Image.Image:
    w, h = SIZE
    rw, rh = round(w * scale), round(h * scale)
    frame = im.resize((rw, rh), Image.Resampling.LANCZOS)
    fx, fy = focus
    left = min(max(round(fx * rw - fx * w), 0), rw - w)
    top = min(max(round(fy * rh - fy * h), 0), rh - h)
    return frame.crop((left, top, left + w, top + h))


def vignette(size: tuple[int, int]) -> Image.Image:
    w, h = size
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    pad = 34
    draw.ellipse((-pad, -pad, w + pad, h + pad), fill=190)
    mask = mask.filter(ImageFilter.GaussianBlur(70))
    return ImageChops.invert(mask)


def grade(frame: Image.Image, good: bool, t: float, edge: Image.Image) -> Image.Image:
    # Ease into the result instead of repeatedly flashing; the final still is
    # held long enough to read before the outcome window closes.
    ease = t * t * (3 - 2 * t)
    if good:
        frame = ImageEnhance.Color(frame).enhance(0.96 + 0.08 * ease)
        frame = ImageEnhance.Brightness(frame).enhance(0.96 + 0.08 * ease)
        tint = Image.new("RGB", SIZE, (255, 188, 76))
        frame = Image.blend(frame, tint, 0.025 * ease)
    else:
        frame = ImageEnhance.Color(frame).enhance(1.0 - 0.20 * ease)
        frame = ImageEnhance.Brightness(frame).enhance(1.0 - 0.10 * ease)
        tint = Image.new("RGB", SIZE, (43, 60, 88))
        frame = Image.blend(frame, tint, 0.055 * ease)
    shade = Image.new("RGB", SIZE, (5, 8, 13))
    amount = 0.22 if good else 0.31
    return Image.composite(shade, frame, edge.point(lambda p: round(p * amount)))


def neutral_grade(frame: Image.Image, edge: Image.Image) -> Image.Image:
    """성공·실패 힌트가 없는 공통 청혼 도입부의 색감."""
    frame = ImageEnhance.Color(frame).enhance(0.98)
    frame = ImageEnhance.Brightness(frame).enhance(0.98)
    shade = Image.new("RGB", SIZE, (5, 8, 13))
    return Image.composite(shade, frame, edge.point(lambda p: round(p * 0.24)))


def build(name: str) -> Path:
    source = SRC / f"{name}.png"
    if not source.exists():
        raise FileNotFoundError(source)
    base = crop_8x5(Image.open(source).convert("RGB"))
    good = name in GOOD
    edge = vignette(SIZE)
    if name in INTRO_NAMES:
        frames = []
        for i in range(INTRO_FRAMES):
            t = i / max(1, INTRO_FRAMES - 1)
            ease = 0.5 - 0.5 * math.cos(math.pi * t)
            frames.append(neutral_grade(camera(base, 1.040 - 0.018 * ease, FOCUS[name]), edge))
        durations = [FRAME_MS] * len(frames)
    else:
        frames = []
        for i in range(FRAMES):
            t = i / (FRAMES - 1)
            ease = 0.5 - 0.5 * math.cos(math.pi * t)
            # Success opens out slightly; failure closes in on the refusal/capture.
            scale = (1.045 - 0.025 * ease) if good else (1.015 + 0.035 * ease)
            frame = camera(base, scale, FOCUS[name])
            frames.append(grade(frame, good, t, edge))
        durations = [FRAME_MS] * (FRAMES - 1) + [800]
    target = OUT / f"{name}.webp"
    target.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(
        target,
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=1,
        quality=78,
        method=6,
        minimize_size=True,
    )
    return target


def main() -> None:
    names = ["win", "win_f", "lose", "lose_f", "negotiate_open", "negotiate_open_f",
             "sneak_ok", "sneak_ok_f", "sneak_open", "sneak_open_f",
             "sneak_fail", "sneak_fail_f", "propose", "propose_f",
             "propose_fail", "propose_fail_f", "propose_open", "propose_open_f"]
    for name in names:
        target = build(name)
        print(f"{target.relative_to(ROOT)}  {target.stat().st_size / 1024:.0f} KiB")


if __name__ == "__main__":
    main()
