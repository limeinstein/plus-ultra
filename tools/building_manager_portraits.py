#!/usr/bin/env python3
"""지역별 동물원·박물관·미술관 관리자 원화를 게임용 얼굴상·무릎상으로 나눈다.

원화는 1536×1024 가로 삼분할이며 왼쪽부터 zoo, museum, gallery 순서다.
"""
from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "artifacts" / "building-managers" / "sources"
OUTPUT = ROOT / "images" / "portraits" / "building-managers"
STYLES = ["ib", "ne", "it", "gr", "ru", "is", "pe", "af", "sw", "in", "se", "cn", "kr", "jp", "az", "an", "co", "tr", "st", "na"]
ROLES = ["zoo", "museum", "gallery"]


def panel_bounds(width: int, index: int) -> tuple[int, int]:
    """세 칸 폭이 1px 다를 때도 원화를 빠짐없이 세 부분으로 나눈다."""
    left = round(width * index / 3)
    right = round(width * (index + 1) / 3)
    return left + (3 if index else 0), right - (3 if index < 2 else 0)


def dark_edge(image: Image.Image) -> tuple[int, int, int, int]:
    points = [(0, 0), (image.width - 1, 0), (0, image.height - 1), (image.width - 1, image.height - 1)]
    pixels = [image.getpixel(p) for p in points]
    return tuple(sum(p[i] for p in pixels) // len(pixels) for i in range(4))


def build_one(source: Path, style: str) -> None:
    with Image.open(source) as opened:
        sheet = opened.convert("RGBA")
    if sheet.height != 1024 or sheet.width not in (1535, 1536):
        raise ValueError(f"{source}: 1535~1536×1024 원화가 아님 ({sheet.size})")
    for index, role in enumerate(ROLES):
        left, right = panel_bounds(sheet.width, index)
        panel = sheet.crop((left, 0, right, sheet.height))
        fill = dark_edge(panel)

        target_width = round(panel.height * 2 / 3)
        half = Image.new("RGBA", (target_width, panel.height), fill)
        half.alpha_composite(panel, ((target_width - panel.width) // 2, 0))
        half = half.resize((1024, 1536), Image.Resampling.LANCZOS)

        face_side = min(panel.width, panel.height)
        face = panel.crop((0, 0, face_side, face_side)).resize((512, 512), Image.Resampling.LANCZOS)

        out = OUTPUT / style
        out.mkdir(parents=True, exist_ok=True)
        face.save(out / f"{role}.webp", "WEBP", quality=91, method=6, exact=True)
        half.save(out / f"{role}_half.webp", "WEBP", quality=88, method=6, exact=True)


def build() -> None:
    missing = [SOURCE / f"{style}.png" for style in STYLES if not (SOURCE / f"{style}.png").is_file()]
    if missing:
        raise FileNotFoundError("빠진 원화: " + ", ".join(str(path) for path in missing))
    for style in STYLES:
        build_one(SOURCE / f"{style}.png", style)
    print(f"관리자 얼굴상·무릎상 {len(STYLES) * len(ROLES) * 2}장 → {OUTPUT.relative_to(ROOT)}")


def expected() -> list[Path]:
    return [OUTPUT / style / (role + suffix + ".webp") for style in STYLES for role in ROLES for suffix in ("", "_half")]


def check() -> int:
    missing, bad, hashes = [], [], {}
    for path in expected():
        if not path.is_file():
            missing.append(path)
            continue
        with Image.open(path) as image:
            wanted = (1024, 1536) if path.stem.endswith("_half") else (512, 512)
            if image.size != wanted:
                bad.append((path, image.size, wanted))
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        hashes.setdefault(digest, []).append(path)
    duplicates = [paths for paths in hashes.values() if len(paths) > 1]
    print(f"관리자 초상 {len(expected()) - len(missing)}/{len(expected())}장 · 고유 파일 {len(hashes)}장")
    if missing:
        print("빠진 파일: " + ", ".join(str(path.relative_to(ROOT)) for path in missing))
    if bad:
        print("잘못된 크기: " + ", ".join(f"{path.relative_to(ROOT)} {got} != {want}" for path, got, want in bad))
    if duplicates:
        print("중복 파일: " + " / ".join(", ".join(str(path.relative_to(ROOT)) for path in paths) for paths in duplicates))
    return 1 if missing or bad or duplicates else 0


def contact_sheet(destination: Path) -> None:
    cell_w, cell_h, label_w, head_h = 150, 225, 76, 30
    canvas = Image.new("RGB", (label_w + cell_w * len(ROLES), head_h + cell_h * len(STYLES)), "#171513")
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.load_default()
    for col, role in enumerate(ROLES):
        draw.text((label_w + col * cell_w + 8, 9), role, fill="#e7d29a", font=font)
    for row, style in enumerate(STYLES):
        y = head_h + row * cell_h
        draw.text((12, y + 102), style, fill="#e7d29a", font=font)
        for col, role in enumerate(ROLES):
            path = OUTPUT / style / f"{role}_half.webp"
            if not path.is_file():
                continue
            with Image.open(path) as opened:
                image = ImageOps.fit(opened.convert("RGB"), (cell_w, cell_h), Image.Resampling.LANCZOS)
            canvas.paste(image, (label_w + col * cell_w, y))
    destination.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(destination, "JPEG", quality=92, optimize=True)
    print(f"연락판 → {destination.relative_to(ROOT)}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("build", "check", "sheet"), nargs="?", default="build")
    parser.add_argument("--out", type=Path, default=ROOT / "docs" / "art" / "building-manager-portraits-preview.jpg")
    args = parser.parse_args()
    if args.command == "build":
        build()
        return check()
    if args.command == "check":
        return check()
    contact_sheet(args.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
