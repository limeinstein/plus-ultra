#!/usr/bin/env python3
"""교역품 발견 장면(시장 좌판 GIF·마지막 장면·장면 판)을 검사한다."""
import re
from pathlib import Path

from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[1]
data = (ROOT / "js" / "data" / "discoveries.js").read_text(encoding="utf-8")
ids = re.findall(r"^\s*trade\('([^']+)'", data, re.M)
more = (ROOT / "js" / "data" / "moredisc.js").read_text(encoding="utf-8")
ids += re.findall(r"^\s*\['(t_[a-z]+)'", more, re.M)      # 사용자 요청으로 더한 교역품 (바나나·고구마)
assert len(ids) == 30, ids
generator = (ROOT / "tools" / "procedural_art" / "trade" / "trade.js").read_text(encoding="utf-8")
assert "fillText(" not in generator, "교역품 발견 장면에 글자가 들어갔습니다"
assert "PT.person(" not in generator, "교역품 발견 장면에 사람이 들어갔습니다"
stage = ROOT / "tools" / "trade_gifs" / "assets" / "trade-showcase.webp"
with Image.open(stage) as im:
    assert im.size == (1152, 512), im.size


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

print(f"OK: {len(ids)} trade showcase scenes without people/text, final frames and runtime sheets")
