#!/usr/bin/env python3
"""튜토리얼 발견물 원화 판을 발견 GIF와 마지막 장면으로 만든다."""
from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[2]
SOURCES = Path(__file__).resolve().parent / "sources"
OUT = ROOT / "images" / "discoveries"
ENDS = ROOT / "images" / "discovery-ends"
W, H = 576, 256
COLS, ROWS = 4, 2
FRAME_MS = 350
FRAME_COUNT = 24
IDS = ("herc_cave",)


def cells(source: Image.Image) -> list[Image.Image]:
    """4×2 원화 판을 9:4 게임 화면 여덟 장으로 자른다."""
    frames = []
    for index in range(COLS * ROWS):
        col, row = index % COLS, index // COLS
        x0 = round(source.width * col / COLS)
        y0 = round(source.height * row / ROWS)
        x1 = round(source.width * (col + 1) / COLS)
        y1 = round(source.height * (row + 1) / ROWS)
        cell = source.crop((x0, y0, x1, y1)).convert("RGB")
        # 동굴 천장과 물결이 함께 남도록 화면 중심을 조금 아래에 둔다.
        cell = ImageOps.fit(cell, (W * 2, H * 2), Image.Resampling.LANCZOS, centering=(.5, .54))
        frames.append(cell)
    return frames


def ease(value: float) -> float:
    value = max(0.0, min(1.0, value))
    return .5 - .5 * math.cos(math.pi * value)


def zoom(frame: Image.Image, amount: float) -> Image.Image:
    """정지한 칸 사이에서도 파도 쪽으로 아주 천천히 다가간다."""
    scale = 1.0 + .035 * ease(amount)
    crop_w, crop_h = round(frame.width / scale), round(frame.height / scale)
    x0 = (frame.width - crop_w) // 2
    y0 = round((frame.height - crop_h) * .62)
    return frame.crop((x0, y0, x0 + crop_w, y0 + crop_h)).resize((W, H), Image.Resampling.LANCZOS)


def animation(source: Image.Image) -> list[Image.Image]:
    keys = cells(source)
    frames = []
    for index in range(FRAME_COUNT):
        position = index * (len(keys) - 1) / (FRAME_COUNT - 1)
        left = min(len(keys) - 1, int(position))
        right = min(len(keys) - 1, left + 1)
        mix = ease(position - left)
        a = zoom(keys[left], index / (FRAME_COUNT - 1))
        b = zoom(keys[right], index / (FRAME_COUNT - 1))
        frame = Image.blend(a, b, mix)
        # 마지막으로 갈수록 햇빛과 바위 결을 조금 또렷하게 한다.
        frame = ImageEnhance.Contrast(frame).enhance(1.0 + index / (FRAME_COUNT - 1) * .06)
        frame = frame.filter(ImageFilter.UnsharpMask(radius=1.1, percent=45, threshold=3))
        frames.append(frame)
    return frames


def shared_palette(frames: list[Image.Image]) -> Image.Image:
    sheet = Image.new("RGB", (W * 2, H * 2))
    for xy, index in zip(((0, 0), (W, 0), (0, H), (W, H)), (0, 7, 15, 23)):
        sheet.paste(frames[index], xy)
    return sheet.convert("P", palette=Image.Palette.ADAPTIVE, colors=96)


def build_one(did: str) -> Path:
    source_path = SOURCES / f"{did}.png"
    if not source_path.exists():
        raise FileNotFoundError(source_path)
    with Image.open(source_path) as raw:
        frames = animation(raw.convert("RGB"))

    palette = shared_palette(frames)
    paletted = [frame.quantize(palette=palette, dither=Image.Dither.FLOYDSTEINBERG) for frame in frames]
    OUT.mkdir(parents=True, exist_ok=True)
    destination = OUT / f"{did}.gif"
    paletted[0].save(
        destination,
        save_all=True,
        append_images=paletted[1:],
        duration=[FRAME_MS] * FRAME_COUNT,
        loop=0,
        disposal=1,
        optimize=True,
    )
    ENDS.mkdir(parents=True, exist_ok=True)
    frames[-1].save(ENDS / f"{did}.jpg", "JPEG", quality=91, optimize=True)
    return destination


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("ids", nargs="*", choices=IDS)
    args = parser.parse_args()
    for did in args.ids or IDS:
        path = build_one(did)
        print(f"{did}: {path.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
