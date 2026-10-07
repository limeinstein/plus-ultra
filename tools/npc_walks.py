#!/usr/bin/env python3
"""지역별 NPC 4×2 보행 시트를 거리 화면용으로 다듬는다 — 칸마다 사람을 같은 발끝·같은 높이(380×444)에 맞춰
4×2 한 장(1520×888 WebP)으로 다시 붙인다: images/street-folk/<역할>_<지역>.webp (게임 js/systems/streetfolk.js가 칸을 잘라 그린다)."""
from pathlib import Path
import json

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "images" / "npc-walk"
TARGET = ROOT / "images" / "street-folk"
FRAME_W, FRAME_H = 380, 444
PAD_X, PAD_TOP, PAD_BOTTOM = 6, 4, 3
ALPHA_DUST = 8


def clean(frame: Image.Image) -> Image.Image:
    alpha = frame.getchannel("A").point(lambda value: 0 if value <= ALPHA_DUST else value)
    frame.putalpha(alpha)
    return frame


def build(
    style: str,
    role: str,
    rel: str,
    layout: dict,
    target_role: str | None = None,
    display_scale: float = 1.0,
) -> None:
    cols, rows = layout["columns"], layout["rows"]
    cell_w, cell_h = layout["cellWidth"], layout["cellHeight"]
    with Image.open(SOURCE / rel) as raw:
        sheet = raw.convert("RGBA").resize((cols * cell_w, rows * cell_h), Image.Resampling.LANCZOS)
    frames, boxes = [], []
    for index in range(cols * rows):
        col, row = index % cols, index // cols
        frame = clean(sheet.crop((col * cell_w, row * cell_h, (col + 1) * cell_w, (row + 1) * cell_h)))
        box = frame.getchannel("A").point(lambda value: 255 if value > 24 else 0).getbbox()
        if not box:
            raise ValueError(f"{style} {index + 1}번 칸에 인물이 없습니다")
        frames.append(frame)
        boxes.append(box)
    max_w = max(box[2] - box[0] for box in boxes)
    max_h = max(box[3] - box[1] for box in boxes)
    scale = min((FRAME_W - PAD_X * 2) / max_w, (FRAME_H - PAD_TOP - PAD_BOTTOM) / max_h) * display_scale
    TARGET.mkdir(parents=True, exist_ok=True)
    out_path = TARGET / f"{target_role or role}_{style}.webp"
    sheet_out = Image.new("RGBA", (FRAME_W * cols, FRAME_H * rows), (0, 0, 0, 0))
    for index, (frame, box) in enumerate(zip(frames, boxes), 1):
        if scale != 1:
            frame = frame.resize((round(frame.width * scale), round(frame.height * scale)), Image.Resampling.LANCZOS)
            box = tuple(round(value * scale) for value in box)
        bw = box[2] - box[0]
        dx = round((FRAME_W - bw) / 2 - box[0])
        dy = FRAME_H - PAD_BOTTOM - box[3]
        out = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        out.alpha_composite(frame, (dx, dy))
        sheet_out.alpha_composite(out, (((index - 1) % cols) * FRAME_W, ((index - 1) // cols) * FRAME_H))
    sheet_out.save(out_path, "WEBP", quality=85, method=4, exact=True)
    print(f"{style}/{role}: {rel} → street-folk/{out_path.name} (4×2, 칸 {FRAME_W}×{FRAME_H})")


def main() -> None:
    manifest = json.loads((SOURCE / "sprite_manifest.json").read_text(encoding="utf-8"))
    for style in manifest["styles"]:
        for role, spec in manifest["roles"].items():
            rel = f"{style}/{spec['file']}"
            build(style, role, rel, manifest["layout"], display_scale=spec.get("displayScale", 1.0))
            # legacyTarget이 있으면 그 이름으로도 한 벌 더 (지금은 쓰지 않는다 — 게임이 G.STREET_FOLK.sprites로 이름을 잇는다)
            if spec.get("legacyTarget"):
                build(
                    style,
                    role,
                    rel,
                    manifest["layout"],
                    spec["legacyTarget"],
                    spec.get("displayScale", 1.0),
                )


if __name__ == "__main__":
    main()
