#!/usr/bin/env python3
"""신규 발견물 마지막 장면과 도시 정면 외관의 육안 점검표를 만든다."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[2]
DATA = json.loads((ROOT / "tools" / "new_discovery_assets" / "prompts.json").read_text(encoding="utf-8"))
OUT = ROOT / "docs" / "art"


def font(size: int) -> ImageFont.ImageFont:
    for path in (Path("C:/Windows/Fonts/malgun.ttf"), Path("C:/Windows/Fonts/arial.ttf")):
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def discovery_sheet() -> Path:
    cols, width, image_h, label_h = 6, 288, 128, 34
    rows = (len(DATA["source"]) + cols - 1) // cols
    canvas = Image.new("RGB", (cols * width, rows * (image_h + label_h)), "#171b20")
    draw, fnt = ImageDraw.Draw(canvas), font(13)
    for index, row in enumerate(DATA["source"]):
        x, y = (index % cols) * width, (index // cols) * (image_h + label_h)
        image = Image.open(ROOT / "images" / "discovery-ends" / f"{row['id']}.jpg").convert("RGB")
        canvas.paste(ImageOps.fit(image, (width, image_h), Image.Resampling.LANCZOS), (x, y))
        draw.text((x + 6, y + image_h + 7), f"{row['id']} · {row['name']}", font=fnt, fill="#f0dfbd")
    path = OUT / "new-discoveries-2026-10-18-contact-sheet.jpg"
    canvas.save(path, "JPEG", quality=88, optimize=True)
    return path


def landmark_sheet() -> Path:
    cols, cell_w, cell_h = 4, 390, 330
    rows = (len(DATA["landmarks"]) + cols - 1) // cols
    canvas = Image.new("RGB", (cols * cell_w, rows * cell_h), "#30343a")
    draw, fnt = ImageDraw.Draw(canvas), font(14)
    for index, row in enumerate(DATA["landmarks"]):
        x, y = (index % cols) * cell_w, (index // cols) * cell_h
        image = Image.open(ROOT / row["final"]).convert("RGBA")
        image.thumbnail((cell_w - 20, cell_h - 42), Image.Resampling.LANCZOS)
        canvas.paste(image, (x + (cell_w - image.width) // 2, y + 4), image)
        draw.text((x + 8, y + cell_h - 30), f"{row['id']} · {row['name']}", font=fnt, fill="#f0dfbd")
    path = OUT / "new-city-landmarks-2026-10-18-contact-sheet.jpg"
    canvas.save(path, "JPEG", quality=90, optimize=True)
    return path


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    print(discovery_sheet().relative_to(ROOT))
    print(landmark_sheet().relative_to(ROOT))


if __name__ == "__main__":
    main()
