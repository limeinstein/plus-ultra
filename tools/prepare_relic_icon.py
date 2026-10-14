"""ImageGen 원화를 게임의 256x256 투명 WebP 유물 아이콘으로 다듬는다.

사용법:
    python tools/prepare_relic_icon.py input.png images/relics/r_example.webp
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


SIZE = 256
MARGIN = 12


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    """아주 옅은 가장자리 잡티는 버리고 실제 물체의 둘레를 찾는다."""
    alpha = image.getchannel("A")
    threshold = alpha.point(lambda value: 255 if value >= 8 else 0)
    return threshold.getbbox()


def prepare(source: Path, target: Path) -> None:
    image = Image.open(source).convert("RGBA")
    bbox = alpha_bbox(image)
    if not bbox:
        raise ValueError(f"투명하지 않은 물체를 찾을 수 없습니다: {source}")

    image = image.crop(bbox)
    max_side = SIZE - MARGIN * 2
    scale = min(max_side / image.width, max_side / image.height, 1.0)
    image = image.resize(
        (max(1, round(image.width * scale)), max(1, round(image.height * scale))),
        Image.Resampling.LANCZOS,
    )

    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    x = (SIZE - image.width) // 2
    y = (SIZE - image.height) // 2
    canvas.alpha_composite(image, (x, y))

    # RGB가 검은 투명 픽셀을 남기지 않도록 완전 투명 영역도 정리한다.
    clean = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    clean.alpha_composite(canvas)
    target.parent.mkdir(parents=True, exist_ok=True)
    clean.save(target, "WEBP", quality=94, method=6, exact=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("target", type=Path)
    args = parser.parse_args()
    prepare(args.source, args.target)


if __name__ == "__main__":
    main()
