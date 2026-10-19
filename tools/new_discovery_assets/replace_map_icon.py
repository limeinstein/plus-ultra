#!/usr/bin/env python3
"""투명 단일 아이콘을 4×4 지도 시트의 지정 칸에 넣는다."""
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("sheet", type=Path)
    parser.add_argument("icon", type=Path)
    parser.add_argument("slot", type=int, help="0부터 시작하는 4×4 칸 번호")
    args = parser.parse_args()

    sheet = Image.open(args.sheet).convert("RGBA")
    if sheet.width != sheet.height or sheet.width % 4:
        raise SystemExit(f"4×4 정사각 시트가 아님: {sheet.size}")
    if not 0 <= args.slot < 16:
        raise SystemExit("slot은 0~15여야 함")

    icon = Image.open(args.icon).convert("RGBA")
    bbox = icon.getchannel("A").getbbox()
    if not bbox:
        raise SystemExit("아이콘에 불투명 픽셀이 없음")
    icon = icon.crop(bbox)
    cell = sheet.width // 4
    limit = cell - 12
    icon.thumbnail((limit, limit), Image.Resampling.LANCZOS)
    tile = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
    tile.alpha_composite(icon, ((cell - icon.width) // 2, (cell - icon.height) // 2))

    x = (args.slot % 4) * cell
    y = (args.slot // 4) * cell
    sheet.paste((0, 0, 0, 0), (x, y, x + cell, y + cell))
    sheet.alpha_composite(tile, (x, y))
    sheet.save(args.sheet, optimize=True)
    print(f"{args.sheet}: slot {args.slot} 교체 ({icon.width}×{icon.height})")


if __name__ == "__main__":
    main()
