"""투명 ImageGen 건물 시트를 칸별 거리 외관 WEBP로 나눈다.

각 칸의 알파 여백을 제거한 뒤 지정 높이로 리샘플링한다.
대상은 ``경로:높이`` 형식이며, 왼쪽 위부터 행 우선 순서다.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("targets", nargs="+")
    parser.add_argument("--cols", type=int, required=True)
    parser.add_argument("--rows", type=int, required=True)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    if len(args.targets) > args.cols * args.rows:
        raise SystemExit("대상 수가 시트 칸 수보다 많습니다")

    sheet = Image.open(args.source).convert("RGBA")
    for index, spec in enumerate(args.targets):
        raw_path, raw_height = spec.rsplit(":", 1)
        target = Path(raw_path)
        height = int(raw_height)
        if target.exists() and not args.force:
            raise SystemExit(f"이미 있는 파일은 덮어쓰지 않습니다: {target}")

        col, row = index % args.cols, index // args.cols
        left = round(sheet.width * col / args.cols)
        right = round(sheet.width * (col + 1) / args.cols)
        top = round(sheet.height * row / args.rows)
        bottom = round(sheet.height * (row + 1) / args.rows)
        image = sheet.crop((left, top, right, bottom))

        # 이웃 칸에서 넘어온 작은 조각은 보통 칸 경계에 붙어 있다. 가장 큰 본체는
        # 보존하고, 경계에 닿은 작은 연결 성분만 투명하게 지운다.
        pixels = np.array(image)
        mask = (pixels[:, :, 3] > 8).astype("uint8")
        count, labels, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
        if count > 1:
            largest = int(stats[1:, cv2.CC_STAT_AREA].max())
            for component in range(1, count):
                x, y, width0, height0, area = map(int, stats[component])
                touches_edge = x == 0 or y == 0 or x + width0 == image.width or y + height0 == image.height
                if touches_edge and area < largest * 0.4:
                    pixels[labels == component] = 0
            image = Image.fromarray(pixels, "RGBA")

        box = image.getchannel("A").getbbox()
        if not box:
            raise SystemExit(f"{index + 1}번 칸에 불투명 픽셀이 없습니다")
        image = image.crop(box)
        width = max(1, round(image.width * height / image.height))
        image = image.resize((width, height), Image.Resampling.LANCZOS)
        target.parent.mkdir(parents=True, exist_ok=True)
        image.save(target, "WEBP", quality=88, method=6, exact=True)
        print(f"{target}: {width}x{height} RGBA")


if __name__ == "__main__":
    main()
