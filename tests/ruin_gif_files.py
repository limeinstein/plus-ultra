#!/usr/bin/env python3
"""Structural checks for every historical reconstruction animation."""
import re
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
src = (ROOT / "js" / "data" / "discoveries.js").read_text(encoding="utf-8")
legacy_ids = re.findall(r"^\s*add\('([^']+)', '[^']+', 'ruin'", src, re.M)
wonders = (ROOT / "js" / "data" / "wonders.js").read_text(encoding="utf-8")
wonder_ids = re.findall(r"^\s*w\('([^']+)',\s*'[^']+'", wonders, re.M)
ids = legacy_ids + wonder_ids
assert len(legacy_ids) == 66, len(legacy_ids)
assert len(wonder_ids) == 96, len(wonder_ids)
assert len(ids) == len(set(ids)) == 162, len(ids)
for did in ids:
    ref = ROOT / "tools" / "heritage" / "references" / "discoveries" / f"{did}.jpg"
    turn = ROOT / "tools" / "ruin_gifs" / "reconstructions" / f"{did}.png"
    master = ROOT / "tools" / "ruin_gifs" / "v2" / "master" / f"{did}.png"
    gif = ROOT / "images" / "discoveries" / f"{did}.gif"
    end = ROOT / "images" / "discovery-ends" / f"{did}.jpg"
    if did in legacy_ids:
        assert ref.exists(), ref
        assert turn.exists(), turn
    assert master.exists(), master
    assert end.exists(), end
    with Image.open(gif) as im:
        assert im.size == (576, 256), (did, im.size)
        # Pillow merges one identical handoff frame during GIF optimization.
        assert im.n_frames == 18, (did, im.n_frames)
        duration = 0
        for frame in range(im.n_frames):
            im.seek(frame)
            duration += im.info["duration"]
        assert duration == 9820, (did, duration)
print(f"OK: {len(ids)} V2 master sheets, animated GIFs, and final frames")
