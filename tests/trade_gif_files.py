#!/usr/bin/env python3
"""교역품 발견 장면(시장 좌판 GIF·마지막 장면·장면 판)을 검사한다."""
import re
from pathlib import Path

from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[1]
data = (ROOT / "js" / "data" / "discoveries.js").read_text(encoding="utf-8")
ids = re.findall(r"^\s*trade\('([^']+)'", data, re.M)
assert len(ids) == 28, ids


def difference(a, b):
    return sum(ImageStat.Stat(ImageChops.difference(a.convert("RGB"), b.convert("RGB"))).mean) / 3


for tid in ids:
    gif = ROOT / "images" / "discoveries" / f"{tid}.gif"
    end = ROOT / "images" / "discovery-ends" / f"{tid}.jpg"
    sheet = ROOT / "images" / "discovery-sheets" / f"{tid}.webp"
    for path in (gif, end, sheet):
        assert path.exists(), path
    with Image.open(gif) as im:
        assert im.size == (576, 256) and im.n_frames == 24, (tid, im.size, im.n_frames)
        total, keep = 0, []
        for k in range(im.n_frames):
            im.seek(k); total += im.info["duration"]
            if k in (0, 23): keep.append(im.convert("RGB"))
        assert total == 8400, (tid, total)
        assert difference(keep[0], keep[1]) > 4, tid   # 카메라가 다가가므로 처음과 끝이 달라야 한다
    with Image.open(end) as im:
        assert im.size == (576, 256), tid
    with Image.open(sheet) as im:
        assert im.size == (3456, 1024), (tid, im.size)

print(f"OK: {len(ids)} trade market scenes, final frames and runtime sheets")
