#!/usr/bin/env python3
"""Import one generated PNG portrait into the game's WebP asset tree.

The command refuses to overwrite an existing asset unless --overwrite is given.
It keeps alpha, uses high-quality Lanczos resizing, and verifies the saved size.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def parse_size(value: str) -> tuple[int, int]:
    try:
        width, height = (int(part) for part in value.lower().split("x", 1))
    except (TypeError, ValueError) as exc:
        raise argparse.ArgumentTypeError("size must look like 512x512") from exc
    if width <= 0 or height <= 0:
        raise argparse.ArgumentTypeError("size dimensions must be positive")
    return width, height


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--size", required=True, type=parse_size)
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()

    source = args.source.resolve()
    destination = args.destination.resolve()
    if not source.is_file():
        parser.error(f"source does not exist: {source}")
    if destination.exists() and not args.overwrite:
        parser.error(f"destination already exists: {destination}")

    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(destination.name + ".tmp.webp")
    if temporary.exists():
        temporary.unlink()
    with Image.open(source) as opened:
        image = opened.convert("RGBA")
        if image.size != args.size:
            image = image.resize(args.size, Image.Resampling.LANCZOS)
        image.save(temporary, "WEBP", quality=92, method=6, exact=True)

    with Image.open(temporary) as saved:
        if saved.size != args.size:
            raise RuntimeError(f"saved size mismatch: {saved.size} != {args.size}")
    temporary.replace(destination)
    print(f"{destination} ({args.size[0]}x{args.size[1]})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
