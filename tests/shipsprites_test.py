#!/usr/bin/env python3
"""16방향 선박 시트의 개수·크기·투명도·메타데이터를 확인한다."""
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

assert len(IDS) == 36, f"선박 수: {len(IDS)}"
assert META.count('"key":"ships-nav/') == 36, "메타데이터 36종이 아님"
total = 0
for ship_id in IDS:
    path = OUT / f"{ship_id}.webp"
    assert path.exists(), f"누락: {path}"
    with Image.open(path) as im:
        assert im.size == (CELL * 8, CELL * 14), f"{ship_id} 크기 {im.size}"
        assert im.mode == "RGBA", f"{ship_id} 투명 채널 없음: {im.mode}"
        alpha = im.getchannel("A")
        lo, hi = alpha.getextrema()
        assert lo == 0 and hi == 255, f"{ship_id} 알파 범위 {lo}~{hi}"
    total += path.stat().st_size

assert total <= 12 * 1024 * 1024, f"시트 합계가 12MiB를 넘음: {total / 1024 / 1024:.2f}MiB"
print(f"OK · 36종 · 16방향 · 7레이어 · {total / 1024 / 1024:.2f} MiB")
