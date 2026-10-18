#!/usr/bin/env python3
"""ImageGen 지도 아이콘 시트를 4×4 셀용 1024×1024 투명 PNG로 맞춘다."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
PROMPTS = ROOT / "tools" / "new_discovery_assets" / "prompts.json"
SIZE = 1024


def normalize(path: Path) -> None:
    image = Image.open(path).convert("RGBA")
    side = max(image.size)
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    square.alpha_composite(image, ((side - image.width) // 2, (side - image.height) // 2))
    square.resize((SIZE, SIZE), Image.Resampling.LANCZOS).save(path, "PNG", optimize=True)


def main() -> None:
    data = json.loads(PROMPTS.read_text(encoding="utf-8"))
    for row in data["iconSheets"]:
        path = ROOT / row["target"]
        normalize(path)
        print(path.relative_to(ROOT))


if __name__ == "__main__":
    main()
