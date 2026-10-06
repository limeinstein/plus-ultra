#!/usr/bin/env python3
"""ImageGen의 투명 4×2 재해 원화를 게임용 고정 셀 WebP로 정리한다."""
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
SOURCES = ROOT / "tools" / "disaster_sprites" / "sources"
OUT = ROOT / "images" / "sprites"
IDS = ("quake", "volcano", "landslide", "tsunami", "flood")
CELL = 256


def build_one(kind: str) -> Path:
    with Image.open(SOURCES / f"{kind}.png") as raw:
        src = raw.convert("RGBA")
    xs = [round(i * src.width / 4) for i in range(5)]
    ys = [round(i * src.height / 2) for i in range(3)]
    sheet = Image.new("RGBA", (CELL * 4, CELL * 2), (0, 0, 0, 0))
    for row in range(2):
        for col in range(4):
            frame = src.crop((xs[col], ys[row], xs[col + 1], ys[row + 1]))
            frame = frame.resize((CELL, CELL), Image.Resampling.LANCZOS)
            sheet.alpha_composite(frame, (col * CELL, row * CELL))
    OUT.mkdir(parents=True, exist_ok=True)
    dst = OUT / f"disaster_{kind}.webp"
    sheet.save(dst, "WEBP", lossless=True, method=6)
    return dst


def main() -> None:
    missing = [kind for kind in IDS if not (SOURCES / f"{kind}.png").exists()]
    if missing:
        raise SystemExit("missing disaster sprite sources: " + ", ".join(missing))
    for kind in IDS:
        dst = build_one(kind)
        print(f"{kind:<10} {dst.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
