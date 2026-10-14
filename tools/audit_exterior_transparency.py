"""Build checkerboard contact sheets for exterior alpha-channel inspection.

The outer silhouette can be transparent while openings under awnings, between
posts, or behind signs still contain an opaque generated backdrop.  These
sheets make those internal mistakes visible without changing source assets.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIRS = (ROOT / "images" / "exterior-styles", ROOT / "images" / "exteriors")


def checker(size: tuple[int, int], tile: int = 12) -> Image.Image:
    image = Image.new("RGB", size)
    draw = ImageDraw.Draw(image)
    colors = ((36, 189, 206), (226, 48, 152))
    for y in range(0, size[1], tile):
        for x in range(0, size[0], tile):
            draw.rectangle(
                (x, y, min(x + tile - 1, size[0] - 1), min(y + tile - 1, size[1] - 1)),
                fill=colors[(x // tile + y // tile) % 2],
            )
    return image


def asset_paths() -> list[Path]:
    paths = list((ASSET_DIRS[0]).glob("*/*.webp"))
    paths.extend(ASSET_DIRS[1].glob("*.webp"))
    return sorted(paths, key=lambda path: path.relative_to(ROOT).as_posix())


def label(path: Path) -> str:
    rel = path.relative_to(ROOT / "images").with_suffix("")
    return rel.as_posix().removeprefix("exterior-styles/")


def render_page(paths: list[Path], output: Path, columns: int = 5) -> None:
    cell_w, cell_h = 260, 228
    thumb_w, thumb_h = 244, 190
    rows = (len(paths) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * cell_w, rows * cell_h), (27, 24, 31))
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default(size=14)
    for index, path in enumerate(paths):
        col, row = index % columns, index // columns
        x, y = col * cell_w + 8, row * cell_h + 8
        source = Image.open(path).convert("RGBA")
        source.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        backdrop = checker((thumb_w, thumb_h))
        px = (thumb_w - source.width) // 2
        py = thumb_h - source.height
        backdrop.paste(source, (px, py), source)
        sheet.paste(backdrop, (x, y))
        draw.text((x, y + thumb_h + 7), label(path), fill=(246, 242, 232), font=font)
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, default=ROOT / "artifacts" / "exterior-alpha-audit")
    parser.add_argument("--page-size", type=int, default=65)
    parser.add_argument("--prefix", help="Only include labels starting with this prefix, for example arabia/")
    args = parser.parse_args()
    paths = asset_paths()
    if args.prefix:
        paths = [path for path in paths if label(path).startswith(args.prefix)]
    for offset in range(0, len(paths), args.page_size):
        page = offset // args.page_size + 1
        render_page(paths[offset : offset + args.page_size], args.output_dir / f"page-{page:02d}.png")
    print(f"Rendered {len(paths)} assets across {(len(paths) + args.page_size - 1) // args.page_size} pages")


if __name__ == "__main__":
    main()
