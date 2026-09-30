#!/usr/bin/env python3
"""자연 경관 발견 애니메이션의 원화·GIF·마지막 장면을 검사한다."""
import re
from pathlib import Path

from PIL import Image, ImageChops, ImageStat


ROOT = Path(__file__).resolve().parents[1]
src = (ROOT / "js" / "data" / "discoveries.js").read_text(encoding="utf-8")
ids = re.findall(r"^\s*add\('([^']+)', '[^']+', 'nature'", src, re.M)
src = (ROOT / "js" / "data" / "naturals.js").read_text(encoding="utf-8")
ids += re.findall(r"^\s*n\('([^']+)', '[^']+'", src, re.M)
assert ids == [
    "pamukkale", "huangshan", "uluru", "canyon", "monument", "niagara", "iguazu",
    "gibraltar", "vesuvius", "matterhorn", "vihren", "gullfoss", "eyjafjalla", "sinai",
    "kilimanjaro", "lengai", "solomon", "adamspeak", "flowers", "kailash", "machapuchare",
    "everest", "zhangjiajie", "seongsan", "nachi", "fuji", "reef", "mapuavaea", "bermuda",
    "youth", "bluehole", "barringer", "redwood", "craterlake", "devilstower", "oldfaithful",
    "joatinga", "roraima", "vinicunca", "cerrorico", "torrespaine",
], ids

for did in ids:
    source = ROOT / "tools" / "nature_gifs" / "sources" / f"{did}.png"
    gif = ROOT / "images" / "discoveries" / f"{did}.gif"
    end = ROOT / "images" / "discovery-ends" / f"{did}.jpg"
    sheet = ROOT / "images" / "discovery-sheets" / f"{did}.webp"
    assert source.exists(), source
    assert gif.exists(), gif
    assert end.exists(), end
    assert sheet.exists(), sheet
    with Image.open(source) as im:
        assert im.width / im.height >= 2.8, (did, im.size)
    with Image.open(gif) as im:
        assert im.size == (576, 256), (did, im.size)
        assert im.n_frames == 25, (did, im.n_frames)
        duration = 0
        im.seek(0)
        first = im.convert("RGB")
        for frame in range(im.n_frames):
            im.seek(frame)
            duration += im.info["duration"]
        last = im.convert("RGB")
        assert duration == 9820, (did, duration)
        # 새벽과 밤의 원경이 서로 다른 시간대로 보이는지 확인한다.
        delta = ImageStat.Stat(ImageChops.difference(first, last)).mean
        assert sum(delta) / 3 > 12, (did, delta)
    with Image.open(end) as im:
        assert im.size == (576, 256), (did, im.size)
    with Image.open(sheet) as im:
        assert im.size == (3456, 1024), (did, im.size)

print(f"OK: {len(ids)} nature panorama sources, GIFs, final frames and runtime sheets")
