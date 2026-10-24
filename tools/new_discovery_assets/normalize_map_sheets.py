#!/usr/bin/env python3
"""ImageGen 지도 아이콘 시트를 4×4 셀용 1024×1024 투명 PNG로 맞춘다."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
PROMPTS = ROOT / "tools" / "new_discovery_assets" / "prompts.json"
SIZE = 1024


def normalize(path: Path, used_cells: int | None = None) -> None:
    image = Image.open(path).convert("RGBA")
    changed = image.size != (SIZE, SIZE)
    if changed:
        side = max(image.size)
        square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        square.alpha_composite(image, ((side - image.width) // 2, (side - image.height) // 2))
        image = square.resize((SIZE, SIZE), Image.Resampling.LANCZOS)

    # ImageGen may leave faint pixels in unused cells. Clear them so the
    # sprite atlas can never expose a phantom discovery icon.
    if used_cells is not None and used_cells < 16:
        cell = SIZE // 4
        for index in range(used_cells, 16):
            x = index % 4 * cell
            y = index // 4 * cell
            image.paste((0, 0, 0, 0), (x, y, x + cell, y + cell))
        changed = True

    if changed:
        image.save(path, "PNG", optimize=True)


def main() -> None:
    data = json.loads(PROMPTS.read_text(encoding="utf-8"))
    for group in ("iconSheets", "mysteryIconSheets"):
        for row in data.get(group, []):
            path = ROOT / row["target"]
            used_cells = len(row["ids"]) if group == "mysteryIconSheets" else None
            normalize(path, used_cells)
            print(path.relative_to(ROOT))


if __name__ == "__main__":
    main()
