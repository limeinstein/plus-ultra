#!/usr/bin/env python3
"""Import one generated PNG portrait into the game's WebP asset tree.

The command refuses to overwrite an existing asset unless --overwrite is given.
It keeps alpha, uses high-quality Lanczos resizing, and verifies the saved size.
"""

from __future__ import annotations

import argparse
import shutil
import tempfile
from pathlib import Path

from PIL import Image

import protagonist_portraits as portrait_tools


def face_square(image: Image.Image) -> Image.Image:
    """Run YuNet from an ASCII path because OpenCV cannot open Korean paths on Windows."""
    model = portrait_tools.MODEL
    try:
        str(model).encode("ascii")
    except UnicodeEncodeError:
        runtime_model = Path(tempfile.gettempdir()) / model.name
        if not runtime_model.is_file() or runtime_model.stat().st_size != model.stat().st_size:
            shutil.copyfile(model, runtime_model)
        portrait_tools.MODEL = runtime_model
    return portrait_tools.face_square(image)


def parse_size(value: str) -> tuple[int, int]:
    try:
        width, height = (int(part) for part in value.lower().split("x", 1))
    except (TypeError, ValueError) as exc:
        raise argparse.ArgumentTypeError("size must look like 512x512") from exc
    if width <= 0 or height <= 0:
        raise argparse.ArgumentTypeError("size dimensions must be positive")
    return width, height


def parse_crop(value: str) -> tuple[int, int, int, int]:
    try:
        left, top, right, bottom = (int(part) for part in value.split(",", 3))
    except (TypeError, ValueError) as exc:
        raise argparse.ArgumentTypeError("crop must look like left,top,right,bottom") from exc
    if right <= left or bottom <= top:
        raise argparse.ArgumentTypeError("crop must have positive width and height")
    return left, top, right, bottom


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--size", required=True, type=parse_size)
    parser.add_argument("--crop", type=parse_crop,
                        help="optional source crop as left,top,right,bottom")
    parser.add_argument("--face-output", type=Path,
                        help="also save a 512x512 face portrait cropped from the knee portrait")
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()

    source = args.source.resolve()
    destination = args.destination.resolve()
    face_destination = args.face_output.resolve() if args.face_output else None
    if not source.is_file():
        parser.error(f"source does not exist: {source}")
    if destination.exists() and not args.overwrite:
        parser.error(f"destination already exists: {destination}")
    if face_destination and face_destination.exists() and not args.overwrite:
        parser.error(f"face destination already exists: {face_destination}")

    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(destination.name + ".tmp.webp")
    if temporary.exists():
        temporary.unlink()
    with Image.open(source) as opened:
        image = opened.convert("RGBA")
        if args.crop:
            image = image.crop(args.crop)
        if image.size != args.size:
            image = image.resize(args.size, Image.Resampling.LANCZOS)
        image.save(temporary, "WEBP", quality=92, method=6, exact=True)

        if face_destination:
            face_destination.parent.mkdir(parents=True, exist_ok=True)
            face_temporary = face_destination.with_name(face_destination.name + ".tmp.webp")
            if face_temporary.exists():
                face_temporary.unlink()
            face_square(image).save(face_temporary, "WEBP", quality=92, method=6, exact=True)
            with Image.open(face_temporary) as saved_face:
                if saved_face.size != (512, 512):
                    raise RuntimeError(f"face size mismatch: {saved_face.size} != (512, 512)")
            face_temporary.replace(face_destination)

    with Image.open(temporary) as saved:
        if saved.size != args.size:
            raise RuntimeError(f"saved size mismatch: {saved.size} != {args.size}")
    temporary.replace(destination)
    extra = f" + {face_destination} (512x512)" if face_destination else ""
    print(f"{destination} ({args.size[0]}x{args.size[1]}){extra}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
