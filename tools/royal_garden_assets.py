#!/usr/bin/env python3
"""지역별 왕실 정원 원화를 내부 장면과 투명 정원사 얼굴상·무릎상으로 나눈다.

원화는 1536×1024 가로 화면이며 왼쪽 2/3는 정원, 오른쪽 1/3은 정원사다.
"""
from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

from portrait_asset_layout import defringe, make_face, make_half


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "artifacts" / "royal-gardens" / "sources"
GARDENS = ROOT / "images" / "interiors" / "royal-gardens"
GARDENERS = ROOT / "images" / "portraits" / "gardeners"
STYLES = ["ib", "ne", "it", "gr", "ru", "is", "pe", "af", "sw", "in", "se", "cn", "kr", "jp", "az", "an", "co", "tr", "st", "na"]
_CUTOUT_SESSION = None


def cutout(image: Image.Image) -> Image.Image:
    global _CUTOUT_SESSION
    from rembg import new_session, remove
    if _CUTOUT_SESSION is None:
        _CUTOUT_SESSION = new_session("u2net_human_seg")
    removed = remove(image, session=_CUTOUT_SESSION, alpha_matting=True,
                     alpha_matting_foreground_threshold=235,
                     alpha_matting_background_threshold=12,
                     alpha_matting_erode_size=6).convert("RGBA")
    return defringe(removed)


def build_one(path: Path, style: str) -> None:
    with Image.open(path) as opened:
        sheet = opened.convert("RGBA")
    if sheet.height != 1024 or sheet.width not in (1535, 1536):
        raise ValueError(f"{path}: 1535~1536×1024 원화가 아님 ({sheet.size})")
    split = round(sheet.width * 2 / 3)
    garden = sheet.crop((0, 0, split - 3, sheet.height)).convert("RGB")
    garden = ImageOps.fit(garden, (1600, 900), Image.Resampling.LANCZOS, centering=(0.5, 0.5))
    GARDENS.mkdir(parents=True, exist_ok=True)
    garden.save(GARDENS / f"{style}.webp", "WEBP", quality=90, method=6)

    person = cutout(sheet.crop((split + 3, 0, sheet.width, sheet.height)))
    half = make_half(person)
    face = make_face(person)
    out = GARDENERS / style
    out.mkdir(parents=True, exist_ok=True)
    face.save(out / "gardener.webp", "WEBP", quality=91, method=6, exact=True)
    half.save(out / "gardener_half.webp", "WEBP", quality=88, method=6, exact=True)


def build() -> None:
    missing = [SOURCE / f"{style}.png" for style in STYLES if not (SOURCE / f"{style}.png").is_file()]
    if missing:
        raise FileNotFoundError("빠진 원화: " + ", ".join(str(path) for path in missing))
    for style in STYLES:
        print(f"분리·투명화: {style}", flush=True)
        build_one(SOURCE / f"{style}.png", style)
    print(f"왕실 정원 {len(STYLES)}장 · 정원사 얼굴상/무릎상 {len(STYLES) * 2}장")


def expected() -> list[Path]:
    return ([GARDENS / f"{style}.webp" for style in STYLES] +
            [GARDENERS / style / ("gardener" + suffix + ".webp") for style in STYLES for suffix in ("", "_half")])


def check() -> int:
    missing, bad, opaque, framing, hashes = [], [], [], [], {}
    for path in expected():
        if not path.is_file():
            missing.append(path)
            continue
        with Image.open(path) as image:
            if path.parent == GARDENS:
                wanted = (1600, 900)
            else:
                wanted = (1024, 1536) if path.stem.endswith("_half") else (512, 512)
            if image.size != wanted:
                bad.append((path, image.size, wanted))
            if path.parent != GARDENS:
                alpha = image.convert("RGBA").getchannel("A")
                if alpha.getextrema()[0] == 255:
                    opaque.append(path)
                bounds = alpha.point(lambda value: 255 if value > 12 else 0).getbbox()
                if bounds:
                    top_gap, bottom_gap = bounds[1], image.height - bounds[3]
                    if path.stem.endswith("_half") and (top_gap > 12 or bottom_gap > 12):
                        framing.append((path, top_gap, bottom_gap))
                    if not path.stem.endswith("_half") and bottom_gap > 8:
                        framing.append((path, top_gap, bottom_gap))
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        hashes.setdefault(digest, []).append(path)
    duplicates = [paths for paths in hashes.values() if len(paths) > 1]
    print(f"정원·정원사 {len(expected()) - len(missing)}/{len(expected())}장 · 고유 파일 {len(hashes)}장")
    if missing:
        print("빠진 파일: " + ", ".join(str(path.relative_to(ROOT)) for path in missing))
    if bad:
        print("잘못된 크기: " + ", ".join(f"{path.relative_to(ROOT)} {got} != {want}" for path, got, want in bad))
    if opaque:
        print("불투명 정원사: " + ", ".join(str(path.relative_to(ROOT)) for path in opaque))
    if framing:
        print("인물 크기·자리 어긋남: " + ", ".join(
            f"{path.relative_to(ROOT)} 위 {top}px/아래 {bottom}px" for path, top, bottom in framing))
    if duplicates:
        print("중복 파일: " + " / ".join(", ".join(str(path.relative_to(ROOT)) for path in paths) for paths in duplicates))
    return 1 if missing or bad or opaque or framing or duplicates else 0


def checker(size: tuple[int, int], cell: int = 14) -> Image.Image:
    out = Image.new("RGB", size, "#dedede")
    draw = ImageDraw.Draw(out)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill="#a9a9a9")
    return out


def contact_sheet(destination: Path) -> None:
    garden_w, garden_h, person_w, label_w, head_h = 320, 180, 120, 48, 28
    row_h = garden_h
    canvas = Image.new("RGB", (label_w + garden_w + person_w, head_h + row_h * len(STYLES)), "#171513")
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.load_default()
    draw.text((label_w + 8, 8), "royal garden interior", fill="#e7d29a", font=font)
    draw.text((label_w + garden_w + 8, 8), "gardener", fill="#e7d29a", font=font)
    for row, style in enumerate(STYLES):
        y = head_h + row * row_h
        draw.text((10, y + 82), style, fill="#e7d29a", font=font)
        with Image.open(GARDENS / f"{style}.webp") as opened:
            garden = ImageOps.fit(opened.convert("RGB"), (garden_w, garden_h), Image.Resampling.LANCZOS)
        canvas.paste(garden, (label_w, y))
        with Image.open(GARDENERS / style / "gardener_half.webp") as opened:
            person = ImageOps.fit(opened.convert("RGBA"), (person_w, garden_h), Image.Resampling.LANCZOS)
        bg = checker((person_w, garden_h))
        bg.paste(person, (0, 0), person)
        canvas.paste(bg, (label_w + garden_w, y))
    destination.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(destination, "JPEG", quality=92, optimize=True)
    print(f"미리보기 → {destination.relative_to(ROOT)}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("build", "check", "sheet"), nargs="?", default="build")
    parser.add_argument("--out", type=Path, default=ROOT / "docs" / "art" / "royal-gardens-preview.jpg")
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
