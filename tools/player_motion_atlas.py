#!/usr/bin/env python3
"""Normalize the 20s admiral motion sheets (archival previews only).

Game atlases are built by tools/player_motion_runtime.py, which finds each figure
by connected components instead of slicing a fixed 7 x 7 grid.

The ImageGen output is always a 7 x 7 transparent sheet, but its canvas size is
fixed by the generator.  This tool repacks every cell without stretching the
character so that the final PNG exactly matches the corresponding reference
sheet.  A lossless WebP copy is placed beside each playable character.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont


COLS = 7
ROWS = 7
LOOKS = (
    "admiral",
    "armored_navigator",
    "army_officer",
    "battle_vanguard",
    "blackcoat_captain",
    "casanova",
    "charismatic_admiral",
    "ganghui",
    "hat_spinner",
    "muscle_swordsman",
    "navigator_white",
    "noble_scholar",
    "sea_dog",
    "sky_adventurer",
)
SPECS = {
    "walk": (2632, 4928),
    "back": (2646, 7350),
    "run": (4032, 6916),
}


def cell_box(width: int, height: int, col: int, row: int) -> tuple[int, int, int, int]:
    return (
        round(col * width / COLS),
        round(row * height / ROWS),
        round((col + 1) * width / COLS),
        round((row + 1) * height / ROWS),
    )


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    return image.getchannel("A").getbbox()


def keep_main_silhouette(image: Image.Image) -> Image.Image:
    """Drop detached generator debris while retaining the antialiased outline."""
    pixels = np.asarray(image).copy()
    alpha = pixels[:, :, 3]
    # A higher solid-alpha threshold also breaks the faint bridges that image
    # generation occasionally leaves between the actor and a stray accessory.
    count, labels, stats, _ = cv2.connectedComponentsWithStats((alpha > 64).astype(np.uint8), 8)
    if count <= 1:
        return image
    largest = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    main = (labels == largest).astype(np.uint8)
    # Bring back the soft alpha fringe around the selected solid silhouette.
    halo = cv2.dilate(main, np.ones((5, 5), np.uint8), iterations=1).astype(bool)
    pixels[:, :, 3] = np.where(halo, alpha, 0)
    return Image.fromarray(pixels, "RGBA")


def normalize(raw_path: Path, output_path: Path, target_size: tuple[int, int]) -> dict:
    raw = Image.open(raw_path).convert("RGBA")
    target_w, target_h = target_size
    cell_w, cell_h = target_w // COLS, target_h // ROWS
    frames: list[tuple[Image.Image, tuple[int, int, int, int]]] = []

    for row in range(ROWS):
        for col in range(COLS):
            frame = keep_main_silhouette(raw.crop(cell_box(raw.width, raw.height, col, row)))
            bbox = alpha_bbox(frame)
            if not bbox:
                raise ValueError(f"empty frame at row {row + 1}, col {col + 1}: {raw_path}")
            frames.append((frame, bbox))

    max_w = max(b[2] - b[0] for _, b in frames)
    max_h = max(b[3] - b[1] for _, b in frames)
    scale = min((cell_w * 0.90) / max_w, (cell_h * 0.94) / max_h)
    sheet = Image.new("RGBA", target_size, (0, 0, 0, 0))
    frame_stats = []

    for index, (frame, bbox) in enumerate(frames):
        sprite = frame.crop(bbox)
        size = (
            max(1, round(sprite.width * scale)),
            max(1, round(sprite.height * scale)),
        )
        sprite = sprite.resize(size, Image.Resampling.LANCZOS)
        row, col = divmod(index, COLS)
        left = col * cell_w + (cell_w - sprite.width) // 2
        top = row * cell_h + round(cell_h * 0.98) - sprite.height
        sheet.alpha_composite(sprite, (left, top))
        frame_stats.append({
            "index": index,
            "row": row,
            "col": col,
            "width": sprite.width,
            "height": sprite.height,
        })

    output_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output_path, compress_level=2)
    return {
        "raw": str(raw_path),
        "output": str(output_path),
        "raw_size": list(raw.size),
        "output_size": list(sheet.size),
        "cell_size": [cell_w, cell_h],
        "frames": len(frame_stats),
        "scale": round(scale, 6),
        "min_frame": [min(x["width"] for x in frame_stats), min(x["height"] for x in frame_stats)],
        "max_frame": [max(x["width"] for x in frame_stats), max(x["height"] for x in frame_stats)],
    }


def validate_sheet(path: Path, expected: tuple[int, int]) -> dict:
    image = Image.open(path).convert("RGBA")
    if image.size != expected:
        raise ValueError(f"wrong canvas {image.size}, expected {expected}: {path}")
    empty = []
    edge_touches = []
    for row in range(ROWS):
        for col in range(COLS):
            frame = image.crop(cell_box(image.width, image.height, col, row))
            bbox = alpha_bbox(frame)
            if not bbox:
                empty.append([row, col])
                continue
            if bbox[0] == 0 or bbox[1] == 0 or bbox[2] == frame.width or bbox[3] == frame.height:
                edge_touches.append([row, col])
    if empty or edge_touches:
        raise ValueError(f"invalid cells in {path}: empty={empty}, edge={edge_touches}")
    return {"frames": COLS * ROWS, "empty": 0, "edge_touches": 0, "transparent_corner": image.getpixel((0, 0))[3] == 0}


def image_size(path: Path) -> tuple[int, int] | None:
    try:
        return Image.open(path).size
    except (OSError, ValueError):
        return None


def checkerboard(size: tuple[int, int], block: int = 16) -> Image.Image:
    image = Image.new("RGB", size, "#d4d4d4")
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], block):
        for x in range(0, size[0], block):
            if (x // block + y // block) % 2:
                draw.rectangle((x, y, x + block - 1, y + block - 1), fill="#eeeeee")
    return image


def make_preview(artifact_root: Path, output: Path) -> None:
    tile_w, tile_h = 230, 300
    label_h = 24
    preview = checkerboard((tile_w * 3, (tile_h + label_h) * len(LOOKS)), 14)
    draw = ImageDraw.Draw(preview)
    font = ImageFont.load_default()
    for row, look in enumerate(LOOKS):
        for col, motion in enumerate(SPECS):
            sheet = Image.open(artifact_root / look / f"{motion}.png").convert("RGBA")
            frame = sheet.crop(cell_box(sheet.width, sheet.height, 0, 0))
            bbox = alpha_bbox(frame)
            if bbox:
                sprite = frame.crop(bbox)
                sprite.thumbnail((tile_w - 20, tile_h - 20), Image.Resampling.LANCZOS)
                x = col * tile_w + (tile_w - sprite.width) // 2
                y = row * (tile_h + label_h) + label_h + tile_h - sprite.height - 10
                preview.paste(sprite, (x, y), sprite)
            draw.rectangle((col * tile_w, row * (tile_h + label_h), (col + 1) * tile_w - 1, row * (tile_h + label_h) + label_h - 1), fill="#20242b")
            draw.text((col * tile_w + 8, row * (tile_h + label_h) + 7), f"{look} / {motion}", fill="white", font=font)
    output.parent.mkdir(parents=True, exist_ok=True)
    preview.save(output, quality=90, optimize=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--force", action="store_true", help="rebuild normalized PNGs and runtime atlases")
    args = parser.parse_args()
    root = args.root.resolve()
    artifact_root = root / "artifacts" / "player-motion-sheets"
    image_root = root / "images" / "characters"
    report = {"looks": {}, "totals": {"looks": 0, "sheets": 0, "frames": 0}}

    for look in LOOKS:
        look_report = {}
        for motion, size in SPECS.items():
            raw = artifact_root / look / f"{motion}.raw.png"
            if not raw.exists():
                raise FileNotFoundError(raw)
            normalized = artifact_root / look / f"{motion}.png"
            game_path = image_root / look / "motion" / f"{motion}.webp"
            if normalized.exists() and not args.force:
                image = Image.open(normalized)
                info = {
                    "raw": str(raw), "output": str(normalized),
                    "raw_size": list(Image.open(raw).size), "output_size": list(image.size),
                    "cell_size": [size[0] // COLS, size[1] // ROWS], "frames": COLS * ROWS,
                    "reused": True,
                }
            else:
                info = normalize(raw, normalized, size)
            check = validate_sheet(normalized, size)
            # 게임용 아틀라스(images/characters/<look>/motion/*.webp)는 tools/player_motion_runtime.py가 만든다.
            # 이 정규화 시트는 raw를 7×7 격자로 자른 것이라, raw의 줄 수가 7이 아니면 머리·다리가 잘린 칸이 생긴다
            # (2026-10-15 QA) — 게임에 그대로 쓰지 않는다.
            game_path = image_root / look / "motion" / f"{motion}.webp"
            look_report[motion] = {**info, "validation": check, "game": str(game_path)}
            report["totals"]["sheets"] += 1
            report["totals"]["frames"] += COLS * ROWS
        report["looks"][look] = look_report
        report["totals"]["looks"] += 1

    make_preview(artifact_root, artifact_root / "_preview.jpg")
    report_path = artifact_root / "report.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report["totals"], ensure_ascii=False))
    print(report_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
