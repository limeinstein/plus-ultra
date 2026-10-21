#!/usr/bin/env python3
"""눈의 여왕 인물 3명의 얼굴상·무릎상과 사건 장면을 게임 규격으로 만든다."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

from portrait_asset_layout import clear_transparent_rgb, defringe, make_face, make_half


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "artifacts" / "snow-queen" / "masters"
EVENT_SOURCE_DIR = ROOT / "artifacts" / "snow-queen" / "events"
PORTRAIT_DIR = ROOT / "images" / "portraits" / "legendary"
EVENT_DIR = ROOT / "images" / "legend-events"
CHARACTERS = ("elizaveta", "gerda", "kai")
EVENTS = ("gerda_lake", "snow_queen_hall")


def normalize_alpha(image: Image.Image) -> Image.Image:
    rgba = np.asarray(image.convert("RGBA")).copy()
    alpha = rgba[:, :, 3]
    alpha[alpha <= 6] = 0
    alpha[alpha >= 249] = 255
    rgba[:, :, 3] = alpha
    return clear_transparent_rgb(Image.fromarray(rgba, "RGBA"))


def anchor_bottom(image: Image.Image) -> Image.Image:
    bounds = image.getchannel("A").getbbox()
    if not bounds or bounds[3] >= image.height:
        return image
    canvas = Image.new("RGBA", image.size, (0, 0, 0, 0))
    canvas.alpha_composite(image, (0, image.height - bounds[3]))
    return clear_transparent_rgb(canvas)


def build() -> None:
    PORTRAIT_DIR.mkdir(parents=True, exist_ok=True)
    EVENT_DIR.mkdir(parents=True, exist_ok=True)
    for name in CHARACTERS:
        source = SOURCE_DIR / f"{name}.png"
        if not source.is_file():
            raise FileNotFoundError(source)
        master = normalize_alpha(defringe(Image.open(source)))
        face = make_face(master, 448)
        half = anchor_bottom(make_half(master))
        face.save(PORTRAIT_DIR / f"{name}.webp", "WEBP", quality=91, method=6, exact=True)
        half.save(PORTRAIT_DIR / f"{name}_half.webp", "WEBP", quality=91, method=6, exact=True)

    for name in EVENTS:
        source = EVENT_SOURCE_DIR / f"{name}.png"
        if not source.is_file():
            raise FileNotFoundError(source)
        event = ImageOps.fit(Image.open(source).convert("RGB"), (1881, 836), method=Image.Resampling.LANCZOS)
        event.save(EVENT_DIR / f"{name}.webp", "WEBP", quality=92, method=6)


def check() -> None:
    failures: list[str] = []
    for name in CHARACTERS:
        for suffix, expected in (("", (448, 448)), ("_half", (1024, 1536))):
            path = PORTRAIT_DIR / f"{name}{suffix}.webp"
            if not path.is_file():
                failures.append(f"없음: {path.relative_to(ROOT)}")
                continue
            with Image.open(path) as image:
                if image.size != expected:
                    failures.append(f"크기: {path.relative_to(ROOT)} = {image.size}")
                if image.mode != "RGBA" or image.getchannel("A").getextrema()[0] != 0:
                    failures.append(f"투명도: {path.relative_to(ROOT)} = {image.mode}")
                if suffix and image.getchannel("A").getbbox()[3] != image.height:
                    failures.append(f"무릎상 하단 여백: {path.relative_to(ROOT)}")
    for name in EVENTS:
        path = EVENT_DIR / f"{name}.webp"
        if not path.is_file():
            failures.append(f"없음: {path.relative_to(ROOT)}")
            continue
        with Image.open(path) as image:
            if image.size != (1881, 836):
                failures.append(f"크기: {path.relative_to(ROOT)} = {image.size}")
    if failures:
        raise RuntimeError("\n".join(failures))
    print("눈의 여왕 얼굴상 3장·무릎상 3장·사건 장면 2장 확인 완료")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "check":
        check()
    else:
        build()
        check()
