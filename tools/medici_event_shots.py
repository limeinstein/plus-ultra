#!/usr/bin/env python3
"""메디치 은행 사건 시네마틱 원본을 게임 액자 규격으로 만든다."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "artifacts" / "medici-bankruptcy" / "event-shots"
OUT = ROOT / "images" / "legend-events"
NAMES = ("medici_crisis", "medici_challenge", "medici_saved")
SIZES = {
    "medici_crisis": (1880, 836),
    "medici_challenge": (1881, 836),
    "medici_saved": (1881, 836),
}


def build() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name in NAMES:
        image = Image.open(SOURCE / f"{name}.png").convert("RGB")
        assert image.size == SIZES[name], (name, image.size)
        image.save(OUT / f"{name}.webp", "WEBP", quality=92, method=6)
        print(f"built {name}: {image.size}")


def check() -> None:
    for name in NAMES:
        path = OUT / f"{name}.webp"
        image = Image.open(path)
        assert image.size == SIZES[name], (path, image.size)
        assert image.mode in ("RGB", "RGBA"), (path, image.mode)
        print(f"ok {path.relative_to(ROOT)} {image.size} {image.mode}")


if __name__ == "__main__":
    check() if len(sys.argv) > 1 and sys.argv[1] == "check" else build()
