#!/usr/bin/env python3
"""아래가 비어 떠 보이는 옛 얼굴상을 같은 인물의 무릎상으로 다시 만든다.

초창기 448px 얼굴상은 투명 피사체를 정사각형 한가운데 놓아 아래에 16~80px
빈틈이 남았다. 같은 이름의 ``*_half.webp`` 상단 정사각형에는 얼굴과 상반신이
온전히 있으므로, 그 부분을 512px 얼굴상으로 줄이면 인물의 정체성과 복식을
그대로 지키면서 아래 가장자리까지 자연스럽게 이어진다.

사용법 (WebGame 폴더에서):
    python tools/repair_floating_portraits.py --check
    python tools/repair_floating_portraits.py
"""
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PORTRAITS = ROOT / "images" / "portraits"
MIN_BOTTOM_GAP = 16
TARGET_SIZE = (512, 512)
SOURCE_CROP = 896
SPECIAL_SOURCES = {
    PORTRAITS / "player" / "admiral.webp": (ROOT / "images" / "characters" / "fullbody-20s" / "admiral.png", 640),
}


def alpha_bounds(image: Image.Image, cutoff: int = 12) -> tuple[int, int, int, int] | None:
    alpha = image.convert("RGBA").getchannel("A")
    return alpha.point(lambda value: 255 if value > cutoff else 0).getbbox()


def bottom_gap(path: Path) -> int:
    with Image.open(path) as opened:
        image = opened.convert("RGBA")
        bounds = alpha_bounds(image)
        return image.height if bounds is None else image.height - bounds[3]


def candidates() -> list[tuple[Path, Path, int]]:
    found: list[tuple[Path, Path, int]] = []
    for face in sorted(PORTRAITS.rglob("*.webp")):
        if face.name.endswith(".tmp.webp") or face.stem.endswith("_half"):
            continue
        gap = bottom_gap(face)
        special = SPECIAL_SOURCES.get(face)
        half = special[0] if special else face.with_name(face.stem + "_half.webp")
        if gap >= MIN_BOTTOM_GAP and half.is_file():
            found.append((face, half, gap))
    return found


def rebuild(face: Path, half: Path) -> None:
    with Image.open(half) as opened:
        image = opened.convert("RGBA")
        special = SPECIAL_SOURCES.get(face)
        side = min(special[1] if special else SOURCE_CROP, image.width, image.height)
        left = (image.width - side) // 2
        # 무릎상은 머리를 위에 두고 아래로 몸을 잇는 규격이다. 상단 중앙을
        # 넉넉히 잡아 머리·모자·올린 팔을 살리면서 얼굴 비중을 유지한다.
        crop = image.crop((left, 0, left + side, side))
        crop = crop.resize(TARGET_SIZE, Image.Resampling.LANCZOS)
        temporary = face.with_name(face.name + ".tmp.webp")
        # 202장을 한꺼번에 다시 만들므로 압축 시간과 화질이 균형 잡힌 method 4.
        crop.save(temporary, "WEBP", quality=92, method=4, exact=True)
    temporary.replace(face)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="고칠 얼굴상만 나열한다")
    args = parser.parse_args()

    found = candidates()
    print(f"아래가 뜬 얼굴상 {len(found)}장")
    for face, half, gap in found:
        print(f"{face.relative_to(ROOT)}: 아래 {gap}px <- {half.relative_to(ROOT)}")
    if args.check:
        return 1 if found else 0
    for face, half, _ in found:
        rebuild(face, half)
    print(f"같은 인물 무릎상으로 {len(found)}장을 512x512 얼굴상으로 다시 만들었습니다.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
