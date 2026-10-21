#!/usr/bin/env python3
"""지역별 왕실 정원 내부와 투명 정원사 얼굴상·무릎상 점검."""
from pathlib import Path
import hashlib

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
STYLES = ["ib", "ne", "it", "gr", "ru", "is", "pe", "af", "sw", "in", "se", "cn", "kr", "jp", "az", "an", "co", "tr", "st", "na"]


def main() -> int:
    paths, hashes = [], set()
    for style in STYLES:
        garden = ROOT / "images" / "interiors" / "royal-gardens" / f"{style}.webp"
        face = ROOT / "images" / "portraits" / "gardeners" / style / "gardener.webp"
        half = ROOT / "images" / "portraits" / "gardeners" / style / "gardener_half.webp"
        for path, size, transparent in ((garden, (1600, 900), False), (face, (512, 512), True), (half, (1024, 1536), True)):
            assert path.is_file(), f"빠진 파일: {path.relative_to(ROOT)}"
            with Image.open(path) as image:
                assert image.size == size, f"크기 오류: {path.relative_to(ROOT)} {image.size}"
                if transparent:
                    alpha = image.convert("RGBA").getchannel("A")
                    assert alpha.getextrema()[0] < 255, f"배경이 불투명함: {path.relative_to(ROOT)}"
                    clear = sum(alpha.resize((64, 96)).histogram()[:16])
                    assert clear > 64 * 96 * 0.08, f"투명 영역이 너무 적음: {path.relative_to(ROOT)}"
            hashes.add(hashlib.sha256(path.read_bytes()).digest())
            paths.append(path)
    assert len(hashes) == len(paths), "서로 같은 정원·정원사 파일이 있음"
    print(f"통과 - 왕실 정원 내부 20장과 투명 정원사 얼굴상·무릎상 40장, 고유 파일 {len(hashes)}장")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
