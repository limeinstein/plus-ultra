#!/usr/bin/env python3
"""강희 4×2 걷기·뛰기 시트를 거리 화면용 8장으로 나눈다.

    python tools/ganghui_walk.py        # sheet.png     → walk_1 … walk_8.webp
    python tools/ganghui_walk.py run    # run_sheet.png → run_1 … run_8.webp (그 다음 python tools/images.py)

원본은 ``images/characters/ganghui/sheet.png`` 에 둔다. 이미지 생성기가 만든
1774×887 그림을 4×2로 정확히 나눌 수 있게 1776×888로 아주 조금 맞춘 뒤,
머리 위치와 발밑선을 고정해 걷는 동안 몸이 튀지 않게 한다.

    python tools/ganghui_walk.py
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SHEET = ROOT / "images" / "characters" / "ganghui" / "sheet.png"
OUT = SHEET.parent

COLS, ROWS = 4, 2
CELL = 444
FRAME_W, FRAME_H = 380, 444
HEAD_X = 220
FOOT_LINE = 441  # 불투명 픽셀 bbox의 아래쪽(배타 좌표), 아래에 3px 여백
ALPHA_DUST = 8
ALPHA_SHAPE = 32


def mask(alpha, cutoff):
    return alpha.point(lambda value: 255 if value > cutoff else 0)


def normalized_frame(sheet, index):
    col, row = index % COLS, index // COLS
    frame = sheet.crop((col * CELL, row * CELL, (col + 1) * CELL, (row + 1) * CELL))

    # 위 행의 발끝이 반 픽셀 경계에 걸려 아래 행 첫 줄에 남은 것을 지운다.
    if row:
        ImageDraw.Draw(frame).rectangle((0, 0, CELL - 1, 5), fill=(0, 0, 0, 0))

    alpha = frame.getchannel("A").point(lambda value: 0 if value <= ALPHA_DUST else value)
    frame.putalpha(alpha)
    shape = mask(alpha, ALPHA_SHAPE)
    bounds = shape.getbbox()
    if not bounds:
        raise ValueError(f"{index + 1}번 칸에 인물이 없습니다")

    # 걷는 자세마다 외투와 다리 폭이 달라도 머리 중심은 같은 곳에 둔다.
    top = bounds[1]
    head = shape.crop((0, top, CELL, min(CELL, top + 105))).getbbox()
    if not head:
        raise ValueError(f"{index + 1}번 칸의 머리 위치를 찾지 못했습니다")
    head_center = (head[0] + head[2]) / 2
    dx = round(HEAD_X - head_center)
    dy = FOOT_LINE - bounds[3]

    out = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    out.alpha_composite(frame, (dx, dy))
    return out


def main():
    global SHEET
    kind = "run" if "run" in sys.argv[1:] else "walk"
    if kind == "run":
        SHEET = OUT / "run_sheet.png"
    if not SHEET.exists():
        raise SystemExit(f"원본 시트가 없습니다: {SHEET}")

    with Image.open(SHEET) as src:
        sheet = src.convert("RGBA")
    target = (COLS * CELL, ROWS * CELL)
    if sheet.size != target:
        sheet = sheet.resize(target, Image.Resampling.LANCZOS)
        sheet.save(SHEET, "PNG", optimize=True)
        print(f"{SHEET.relative_to(ROOT)}  {target[0]}×{target[1]}로 격자를 맞춤")

    for index in range(COLS * ROWS):
        frame = normalized_frame(sheet, index)
        path = OUT / f"{kind}_{index + 1}.webp"
        frame.save(path, "WEBP", lossless=True, method=6, exact=True)
        bounds = mask(frame.getchannel("A"), ALPHA_SHAPE).getbbox()
        print(f"{path.relative_to(ROOT)}  {frame.width}×{frame.height}  그림 {bounds}")


if __name__ == "__main__":
    main()
