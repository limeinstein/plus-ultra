"""ImageGen 원본을 거리 건물 규격(높이 520px 투명 WEBP)으로 정리한다.

작업 중 생성된 PNG의 알파 채널을 보존하면서 리샘플링·형식 변환만 한다.
이미 있는 게임 자산은 실수로 덮어쓰지 않는다.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("target", type=Path)
    parser.add_argument("--height", type=int, default=520)
    parser.add_argument("--trim", action="store_true", help="투명 여백을 자른 뒤 크기를 맞춥니다")
    parser.add_argument("--force", action="store_true", help="기존 대상 파일을 교체합니다")
    args = parser.parse_args()

    if args.target.exists() and not args.force:
        raise SystemExit(f"이미 있는 파일은 덮어쓰지 않습니다: {args.target}")
    image = Image.open(args.source).convert("RGBA")
    if args.trim:
        box = image.getchannel("A").getbbox()
        if not box:
            raise SystemExit(f"불투명 픽셀이 없습니다: {args.source}")
        image = image.crop(box)
    width = max(1, round(image.width * args.height / image.height))
    image = image.resize((width, args.height), Image.Resampling.LANCZOS)
    args.target.parent.mkdir(parents=True, exist_ok=True)
    image.save(args.target, "WEBP", quality=88, method=6, exact=True)
    print(f"{args.target}: {width}x{args.height} RGBA")


if __name__ == "__main__":
    main()
