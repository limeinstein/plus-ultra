#!/usr/bin/env python3
"""게임용 7×7 걷기 아틀라스를 7장의 7×1 무손실 PNG로 내보낸다.

각 캐릭터의 런타임 아틀라스는 이미 49칸, 고정 발밑 피벗, 투명 배경으로
검증된다. 이 도구는 그 칸을 다시 그리지 않고 그대로 복사하므로 실제 게임과
검수용 스트립의 프레임 순서가 반드시 일치한다.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image


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
COLS = ROWS = 7
ALPHA_LIMIT = 40


def validate_cell(cell: Image.Image, index: int) -> dict:
    alpha = np.asarray(cell.getchannel("A"))
    ys, xs = np.nonzero(alpha > ALPHA_LIMIT)
    if not len(xs):
        raise ValueError(f"{index + 1}번 프레임이 비어 있음")
    bbox = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]
    touches = bbox[0] == 0 or bbox[1] == 0 or bbox[2] == cell.width or bbox[3] == cell.height
    return {"frame": index + 1, "bbox": bbox, "footline": bbox[3] - 1, "edge_touch": touches}


def export(root: Path, look: str) -> dict:
    runtime = root / "images" / "characters" / look / "motion" / "walk.webp"
    if not runtime.exists():
        raise FileNotFoundError(runtime)
    sheet = Image.open(runtime).convert("RGBA")
    if sheet.width % COLS or sheet.height % ROWS:
        raise ValueError(f"7×7로 나눌 수 없는 아틀라스: {runtime} ({sheet.size})")
    cell_w, cell_h = sheet.width // COLS, sheet.height // ROWS
    output = root / "artifacts" / "player-motion-sheets" / look / "walk49"
    output.mkdir(parents=True, exist_ok=True)
    checks = []
    for row in range(ROWS):
        strip = Image.new("RGBA", (cell_w * COLS, cell_h), (0, 0, 0, 0))
        for col in range(COLS):
            index = row * COLS + col
            cell = sheet.crop((col * cell_w, row * cell_h, (col + 1) * cell_w, (row + 1) * cell_h))
            checks.append(validate_cell(cell, index))
            strip.alpha_composite(cell, (col * cell_w, 0))
        start, end = row * 7 + 1, row * 7 + 7
        strip.save(output / f"walk_{row + 1:02d}_frames_{start:02d}-{end:02d}.png", "PNG", compress_level=4)
    sheet.save(output / "walk_master_7x7.png", "PNG", compress_level=4)
    footlines = [x["footline"] for x in checks]
    edge_touches = [x["frame"] for x in checks if x["edge_touch"]]
    report = {
        "look": look,
        "runtime": str(runtime),
        "output": str(output),
        "frames": 49,
        "strips": 7,
        "cell": [cell_w, cell_h],
        "atlas": [sheet.width, sheet.height],
        "pivot": [cell_w // 2, max(footlines)],
        "footline_min": min(footlines),
        "footline_max": max(footlines),
        "edge_touches": edge_touches,
        "transparent_corner": sheet.getpixel((0, 0))[3] == 0,
    }
    (output / "walk49_export_report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return report


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("looks", nargs="*", choices=LOOKS)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    root = args.root.resolve()
    reports = [export(root, look) for look in (args.looks or LOOKS)]
    bad = [r["look"] for r in reports if r["edge_touches"] or not r["transparent_corner"]]
    summary = {
        "characters": len(reports),
        "strips": len(reports) * 7,
        "frames": len(reports) * 49,
        "invalid": bad,
        "reports": reports,
    }
    destination = root / "artifacts" / "player-motion-sheets" / "walk49_export_report.json"
    destination.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: summary[k] for k in ("characters", "strips", "frames", "invalid")}, ensure_ascii=False))
    print(destination)
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
