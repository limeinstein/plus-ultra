#!/usr/bin/env python3
"""내장 ImageGen 원화를 민족 발견물 여성 동료의 얼굴상·무릎상으로 패키징한다."""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from portrait_asset_layout import clear_transparent_rgb, defringe, make_face


ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / "tools" / "folk_black_women_20261106_prompts.json"
ART = ROOT / "artifacts" / "folk-black-women-20261106"
PREVIEW = ROOT / "docs" / "art" / "folk-black-women-20261106-preview.jpg"


def alpha_stats(image: Image.Image) -> tuple[float, float]:
    alpha = image.getchannel("A")
    hist = alpha.histogram()
    pixels = image.width * image.height
    return sum(hist[:8]) / pixels, sum(hist[240:]) / pixels


def main() -> None:
    spec = json.loads(PLAN.read_text(encoding="utf-8"))
    source_dir = ART / "sources"
    source_dir.mkdir(parents=True, exist_ok=True)
    out_dir = ROOT / "images" / "portraits" / "mates"
    out_dir.mkdir(parents=True, exist_ok=True)

    manifest_keys: dict[str, str] = {}
    checks: list[dict[str, object]] = []
    tiles: list[tuple[dict[str, str], Image.Image, Image.Image]] = []

    for row in spec["portraits"]:
        source = Path(row["source"])
        if not source.is_file():
            raise FileNotFoundError(source)
        archived = source_dir / f"{row['id']}.png"
        if not archived.exists():
            shutil.copy2(source, archived)

        with Image.open(archived) as opened:
            original = opened.convert("RGBA")
        if original.size != (1024, 1536):
            raise ValueError(f"{row['id']} 원화 규격 {original.size}, 1024x1536 필요")
        half = clear_transparent_rgb(defringe(original))
        face = make_face(half, size=512)

        for suffix, image in (("", face), ("_half", half)):
            key = f"portraits/mates/{row['id']}{suffix}"
            destination = ROOT / "images" / f"{key}.webp"
            if destination.exists():
                raise FileExistsError(f"기존 자산을 덮어쓰지 않음: {destination}")
            image.save(destination, "WEBP", quality=96, method=6, exact=True)
            with Image.open(destination) as saved:
                check = saved.convert("RGBA")
            clear, solid = alpha_stats(check)
            expected = (512, 512) if not suffix else (1024, 1536)
            if check.size != expected or clear < 0.04 or solid < 0.08:
                raise ValueError(f"규격·투명도 확인 필요: {key}")
            manifest_keys[key] = f"{key}.webp"
            checks.append({
                "key": key,
                "size": list(check.size),
                "clear": round(clear, 4),
                "solid": round(solid, 4),
            })
        tiles.append((row, half, face))

    manifest = ROOT / "images" / "manifest.js"
    manifest_text = manifest.read_text(encoding="utf-8")
    match = re.search(r"G\.IMAGE_FILES = (\{[\s\S]*?\});", manifest_text)
    if not match:
        raise RuntimeError("images/manifest.js에서 G.IMAGE_FILES를 찾지 못함")
    files = json.loads(match.group(1))
    files.update(manifest_keys)
    replacement = "G.IMAGE_FILES = " + json.dumps(dict(sorted(files.items())), ensure_ascii=False, indent=2) + ";"
    manifest.write_text(manifest_text[:match.start()] + replacement + manifest_text[match.end():], encoding="utf-8", newline="\n")

    cols, tile_w, tile_h = 5, 330, 500
    rows = (len(tiles) + cols - 1) // cols
    preview = Image.new("RGB", (cols * tile_w, rows * tile_h), "#221a17")
    draw = ImageDraw.Draw(preview)
    font = ImageFont.truetype("C:/Windows/Fonts/malgun.ttf", 19)
    small = ImageFont.truetype("C:/Windows/Fonts/malgun.ttf", 15)
    for index, (row, half, face) in enumerate(tiles):
        x, y = index % cols * tile_w, index // cols * tile_h
        thumb = half.copy()
        thumb.thumbnail((285, 425), Image.Resampling.LANCZOS)
        preview.paste(thumb, (x + (tile_w - thumb.width) // 2, y + 4), thumb)
        face_thumb = face.resize((108, 108), Image.Resampling.LANCZOS)
        preview.paste(face_thumb, (x + 210, y + 330), face_thumb)
        draw.text((x + 12, y + 447), row["name"], fill="#f1dfbb", font=font)
        draw.text((x + 12, y + 476), row["folk"], fill="#c7af89", font=small)
    PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    preview.save(PREVIEW, "JPEG", quality=95, subsampling=0)

    (ART / "keys.json").write_text(json.dumps(sorted(manifest_keys), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (ART / "asset-checks.json").write_text(json.dumps(checks, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(tiles)}명 / 얼굴상·무릎상 {len(manifest_keys)}장 저장·등록 완료")


if __name__ == "__main__":
    main()
