#!/usr/bin/env python3
"""옛 민족 발견물이 정지/낮밤 파노라마가 아닌 16동작 문화 장면인지 검사한다."""
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageStat


ROOT = Path(__file__).resolve().parents[1]
ROWS = json.loads((ROOT / "tools" / "discovery83" / "legacy-folk.json").read_text(encoding="utf-8"))

assert len(ROWS) == 16
assert len({row["id"] for row in ROWS}) == len(ROWS)

for row in ROWS:
    did = row["id"]
    source = ROOT / row["source"]
    gif = ROOT / "images" / "discoveries" / f"{did}.gif"
    end = ROOT / "images" / "discovery-ends" / f"{did}.jpg"
    sheet = ROOT / "images" / "discovery-sheets" / f"{did}.webp"
    assert source.exists(), source
    assert gif.exists(), gif
    assert end.exists(), end
    assert sheet.exists(), sheet
    with Image.open(source) as im:
        assert abs(im.width / im.height - 4 / 3) < 0.01, (did, im.size)
    with Image.open(gif) as im:
        assert im.size == (576, 256), (did, im.size)
        assert im.n_frames == 16, (did, im.n_frames)
        duration = 0
        frames = []
        for i in range(im.n_frames):
            im.seek(i)
            duration += im.info["duration"]
            frames.append(im.convert("RGB"))
        assert duration == 9820, (did, duration)
        # 첫 장면과 춤/행동이 무르익은 가운데 장면이 실제로 달라야 한다.
        delta = ImageStat.Stat(ImageChops.difference(frames[0], frames[8])).mean
        assert sum(delta) / 3 > 18, (did, delta)
    with Image.open(end) as im:
        assert im.size == (576, 256), (did, im.size)
    with Image.open(sheet) as im:
        assert im.size == (3456, 768), (did, im.size)

print(f"OK: {len(ROWS)} legacy folk discoveries use 16-action cultural storyboards")
