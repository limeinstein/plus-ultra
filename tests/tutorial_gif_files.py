#!/usr/bin/env python3
"""튜토리얼 발견물 GIF와 게임용 장면 판을 검사한다."""
from pathlib import Path

from PIL import Image, ImageChops, ImageStat


ROOT = Path(__file__).resolve().parents[1]
did = "herc_cave"
source = ROOT / "tools" / "tutorial_gifs" / "sources" / f"{did}.png"
gif = ROOT / "images" / "discoveries" / f"{did}.gif"
end = ROOT / "images" / "discovery-ends" / f"{did}.jpg"
sheet = ROOT / "images" / "discovery-sheets" / f"{did}.webp"

for path in (source, gif, end, sheet):
    assert path.exists(), path

with Image.open(source) as image:
    assert image.width >= 1500 and image.height >= 800, image.size

with Image.open(gif) as image:
    assert image.size == (576, 256), image.size
    assert image.n_frames == 24, image.n_frames
    duration = 0
    image.seek(0); first = image.convert("RGB")
    for index in range(image.n_frames):
        image.seek(index); duration += image.info["duration"]
    image.seek(image.n_frames - 1); last = image.convert("RGB")
    assert duration == 8400, duration
    delta = sum(ImageStat.Stat(ImageChops.difference(first, last)).mean) / 3
    assert delta > 12, delta

with Image.open(end) as image:
    assert image.size == (576, 256), image.size
with Image.open(sheet) as image:
    assert image.size == (3456, 1024), image.size

print("OK: tutorial discovery GIF, final frame and runtime sheet")
