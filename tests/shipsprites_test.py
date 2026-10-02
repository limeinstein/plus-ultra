#!/usr/bin/env python3
"""8방향 동작 선박 시트의 개수·크기·투명 여백·메타데이터를 확인한다."""
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SHIP_SRC = (ROOT / "js" / "data" / "ships.js").read_text(encoding="utf-8")
TYPE_SRC = SHIP_SRC[SHIP_SRC.index("G.SHIP_TYPES = ["):SHIP_SRC.index("\n  ];")]
IDS = re.findall(r"\{ id: '(\w+)', name:", TYPE_SRC)
META = (ROOT / "js" / "data" / "shipart.js").read_text(encoding="utf-8")
OUT = ROOT / "images" / "ships-nav"
CELL = int(re.search(r'"cell":(\d+)', META).group(1))
COLS = int(re.search(r'"cols":(\d+)', META).group(1))
DIRS = int(re.search(r'"dirs":(\d+)', META).group(1))
ACTIONS = ((0, 0, 3, "idle"), (0, 3, 5, "drift"), (DIRS, 0, 8, "dash"))

assert len(IDS) == 36, f"선박 수: {len(IDS)}"
assert META.count('"key":"ships-nav/') == 36, "메타데이터 36종이 아님"
assert META.count('"layout":"motion-v2"') == 36, "동작 시트 형식이 아님"
assert DIRS == 8 and COLS == 8, f"방향·열 수: {DIRS}방향 {COLS}열"
total = 0
for ship_id in IDS:
    path = OUT / f"{ship_id}.webp"
    assert path.exists(), f"누락: {path}"
    with Image.open(path) as im:
        assert im.size == (CELL * COLS, CELL * DIRS * 2), f"{ship_id} 크기 {im.size}"
        assert im.mode == "RGBA", f"{ship_id} 투명 채널 없음: {im.mode}"
        alpha = im.getchannel("A")
        lo, hi = alpha.getextrema()
        assert lo == 0 and hi == 255, f"{ship_id} 알파 범위 {lo}~{hi}"
        for row0, col0, frames, action in ACTIONS:
            for direction in range(DIRS):
                for frame in range(frames):
                    cell = alpha.crop(((col0 + frame) * CELL, (row0 + direction) * CELL,
                                       (col0 + frame + 1) * CELL, (row0 + direction + 1) * CELL))
                    box = cell.getbbox()
                    assert box, f"{ship_id} {action} {direction}방향 {frame}장 비었음"
                    assert box[0] >= 2 and box[1] >= 2 and box[2] <= CELL - 2 and box[3] <= CELL - 2, (
                        f"{ship_id} {action} {direction}방향 {frame}장 셀 가장자리 침범: {box}")
    total += path.stat().st_size

assert total <= 40 * 1024 * 1024, f"시트 합계가 40MiB를 넘음: {total / 1024 / 1024:.2f}MiB"
print(f"OK · 36종 · 8방향 · 정박3/표류5/질주8 · {total / 1024 / 1024:.2f} MiB")
