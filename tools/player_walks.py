#!/usr/bin/env python3
"""신규 제독의 4×2 보행 시트를 거리 화면용 8장으로 나눈다."""
from pathlib import Path
import sys

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "images" / "characters"
LOOKS = (
    "navigator_white", "armored_navigator", "sea_dog", "muscle_swordsman",
    "hat_spinner", "charismatic_admiral", "battle_vanguard", "noble_scholar",
    "casanova", "army_officer", "sky_adventurer", "blackcoat_captain",
)
COLS, ROWS = 4, 2
CELL = 444
FRAME_W, FRAME_H = 380, 444
PAD_X, PAD_TOP, PAD_BOTTOM = 6, 4, 3
ALPHA_DUST = 8


def clean(frame):
    alpha = frame.getchannel("A").point(lambda value: 0 if value <= ALPHA_DUST else value)
    frame.putalpha(alpha)
    return frame


def build(look):
    source = BASE / look / "sheet.png"
    if not source.exists():
        raise FileNotFoundError(source)
    with Image.open(source) as raw:
        sheet = raw.convert("RGBA").resize((COLS * CELL, ROWS * CELL), Image.Resampling.LANCZOS)
    sheet.save(source, "PNG", optimize=True)
    frames, boxes = [], []
    for index in range(COLS * ROWS):
        col, row = index % COLS, index // COLS
        frame = clean(sheet.crop((col * CELL, row * CELL, (col + 1) * CELL, (row + 1) * CELL)))
        box = frame.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
        if not box:
            raise ValueError(f"{look} {index + 1}번 칸에 인물이 없습니다")
        frames.append(frame); boxes.append(box)
    max_w = max(b[2] - b[0] for b in boxes)
    max_h = max(b[3] - b[1] for b in boxes)
    scale = min((FRAME_W - PAD_X * 2) / max_w, (FRAME_H - PAD_TOP - PAD_BOTTOM) / max_h)
    for index, (frame, box) in enumerate(zip(frames, boxes), 1):
        if scale != 1:
            frame = frame.resize((round(CELL * scale), round(CELL * scale)), Image.Resampling.LANCZOS)
            box = tuple(round(v * scale) for v in box)
        bw, bh = box[2] - box[0], box[3] - box[1]
        dx = round((FRAME_W - bw) / 2 - box[0])
        dy = FRAME_H - PAD_BOTTOM - box[3]
        out = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        out.alpha_composite(frame, (dx, dy))
        target = BASE / look / f"walk_{index}.webp"
        out.save(target, "WEBP", lossless=True, method=6, exact=True)
    print(f"{look}: sheet.png → walk_1.webp … walk_8.webp")


def main():
    only = [v for v in sys.argv[1:] if not v.startswith("-")]
    for look in (only or LOOKS):
        if look not in LOOKS:
            raise SystemExit(f"모르는 생김새: {look}")
        build(look)


if __name__ == "__main__":
    main()
