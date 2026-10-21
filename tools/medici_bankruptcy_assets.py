#!/usr/bin/env python3
"""메디치 은행 파산 사건 인물 원본을 게임 얼굴상·무릎상으로 가공한다."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

from portrait_asset_layout import alpha_bounds, defringe, make_face, make_half


ROOT = Path(__file__).resolve().parents[1]
MASTERS = ROOT / "artifacts" / "medici-bankruptcy" / "knee-masters"
OUT = ROOT / "images" / "portraits" / "medici"
NAMES = ("lucrezia_medici", "calds", "sousa", "launay", "ashford")


def normalize_alpha(image: Image.Image) -> Image.Image:
    rgba = np.asarray(image.convert("RGBA")).copy()
    alpha = rgba[:, :, 3]
    alpha[alpha <= 6] = 0
    alpha[alpha >= 249] = 255
    rgba[:, :, 3] = alpha
    return defringe(Image.fromarray(rgba, "RGBA"))


def build() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name in NAMES:
        source = MASTERS / f"{name}.png"
        person = normalize_alpha(Image.open(source))
        face = make_face(person, size=448)
        half = make_half(person, size=(1024, 1536))
        face.save(OUT / f"{name}.webp", "WEBP", lossless=True, method=6)
        half.save(OUT / f"{name}_half.webp", "WEBP", lossless=True, method=6)
        print(f"built {name}: face={face.size} half={half.size}")


def check() -> None:
    for name in NAMES:
        for suffix, expected in (("", (448, 448)), ("_half", (1024, 1536))):
            path = OUT / f"{name}{suffix}.webp"
            image = Image.open(path).convert("RGBA")
            assert image.size == expected, (path, image.size)
            alpha = image.getchannel("A")
            assert alpha.getextrema()[0] == 0, f"{path}: transparent background missing"
            bounds = alpha_bounds(image)
            assert bounds[2] > bounds[0] and bounds[3] > bounds[1], f"{path}: empty subject"
            print(f"ok {path.relative_to(ROOT)} {image.size} alpha={alpha.getextrema()} bounds={bounds}")


if __name__ == "__main__":
    check() if len(sys.argv) > 1 and sys.argv[1] == "check" else build()
