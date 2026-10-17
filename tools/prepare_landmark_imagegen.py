"""ImageGen 원화를 거리용 투명 WebP 볼거리 그림으로 다듬는다.

사용법:
    python tools/prepare_landmark_imagegen.py input.png images/landmarks/example.webp

기존 볼거리 그림과 같은 520px 높이를 쓰되, 탑은 좁게 두고 다리·광장처럼
가로로 긴 그림은 최대 1300px 안에서 원래 비율을 보존한다. 물체의 발치는
캔버스 아래에 맞춰 거리의 바닥선 계산이 안정적으로 동작하게 한다.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


HEIGHT = 520
MAX_WIDTH = 1300
MIN_WIDTH = 294
SIDE_MARGIN = 10
TOP_MARGIN = 6
BOTTOM_MARGIN = 4


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    alpha = image.getchannel("A")
    threshold = alpha.point(lambda value: 255 if value >= 8 else 0)
    return threshold.getbbox()


def prepare(source: Path, target: Path) -> None:
    image = Image.open(source).convert("RGBA")
    bbox = alpha_bbox(image)
    if not bbox:
        raise ValueError(f"투명하지 않은 물체를 찾을 수 없습니다: {source}")

    image = image.crop(bbox)
    max_height = HEIGHT - TOP_MARGIN - BOTTOM_MARGIN
    max_width = MAX_WIDTH - SIDE_MARGIN * 2
    scale = min(max_height / image.height, max_width / image.width)
    image = image.resize(
        (max(1, round(image.width * scale)), max(1, round(image.height * scale))),
        Image.Resampling.LANCZOS,
    )

    width = max(MIN_WIDTH, min(MAX_WIDTH, image.width + SIDE_MARGIN * 2))
    canvas = Image.new("RGBA", (width, HEIGHT), (0, 0, 0, 0))
    x = (width - image.width) // 2
    y = HEIGHT - BOTTOM_MARGIN - image.height
    canvas.alpha_composite(image, (x, y))

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
