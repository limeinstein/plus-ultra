#!/usr/bin/env python3
"""지리 발견 애니메이션의 원화·GIF·마지막 장면·장면 판을 검사한다."""
import re
from pathlib import Path

from PIL import Image, ImageChops, ImageStat


ROOT = Path(__file__).resolve().parents[1]
src = (ROOT / "js" / "data" / "discoveries.js").read_text(encoding="utf-8")
ids = re.findall(r"^\s*add\('([^']+)', '[^']+', 'geo'", src, re.M)
assert ids == [
    "capegood", "westroute", "indiaroute", "malacca", "spiceis", "china", "zipang",
    "newstrait", "circum", "antarctic", "northstrait", "endstrait", "australia",
], ids

source = ROOT / "tools" / "geo_gifs" / "sources" / "ship_sighting.png"
assert source.exists(), source

for did in ids:
    gif = ROOT / "images" / "discoveries" / f"{did}.gif"
    end = ROOT / "images" / "discovery-ends" / f"{did}.jpg"
    sheet = ROOT / "images" / "discovery-sheets" / f"{did}.webp"
    assert gif.exists(), gif
    assert end.exists(), end
    assert sheet.exists(), sheet
    with Image.open(gif) as im:
        assert im.size == (576, 256), (did, im.size)
        assert im.n_frames == 25, (did, im.n_frames)
        duration = 0
        for frame in range(im.n_frames):
            im.seek(frame)
            duration += im.info["duration"]
        im.seek(0); first = im.convert("RGB")
        im.seek(7); mapped = im.convert("RGB")
        im.seek(24); last = im.convert("RGB")
        assert duration == 9820, (did, duration)
        assert sum(ImageStat.Stat(ImageChops.difference(first, mapped)).mean) / 3 > 15, did
        assert sum(ImageStat.Stat(ImageChops.difference(mapped, last)).mean) / 3 > 5, did
    with Image.open(end) as im:
        assert im.size == (576, 256), (did, im.size)
    with Image.open(sheet) as im:
        assert im.size == (3456, 1024), (did, im.size)

print(f"OK: {len(ids)} geography GIFs, final frames and runtime sheets")
