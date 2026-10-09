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
more = (ROOT / "js" / "data" / "moredisc.js").read_text(encoding="utf-8")
more_ids = re.findall(r"^\s*ruin\('([^']+)'", more, re.M)
chain = (ROOT / "js" / "data" / "chaindisc.js").read_text(encoding="utf-8")
chain_ids = re.findall(r"^\s*c\('[^']+',\s*'([^']+)',\s*'[^']+',\s*'ruin'", chain, re.M)
ids = legacy_ids + wonder_ids + more_ids + chain_ids
assert len(legacy_ids) == 67, len(legacy_ids)
assert len(wonder_ids) == 96, len(wonder_ids)
assert len(more_ids) == 10, len(more_ids)
assert len(chain_ids) == 26, len(chain_ids)
assert len(ids) == len(set(ids)) == 199, len(ids)
for did in ids:
    ref = ROOT / "tools" / "heritage" / "references" / "discoveries" / f"{did}.jpg"
    turn = ROOT / "tools" / "ruin_gifs" / "reconstructions" / f"{did}.png"
    master = ROOT / "tools" / "ruin_gifs" / "v2" / "master" / f"{did}.png"
    cinematic_master = ROOT / "tools" / "ruin_gifs" / "v3" / "master" / f"{did}.png"
    gif = ROOT / "images" / "discoveries" / f"{did}.gif"
    end = ROOT / "images" / "discovery-ends" / f"{did}.jpg"
    # 무열왕릉은 사진·복원 그림 단계를 거치지 않고 절차적 3D 원화에서 V2 판을 바로 굽는다.
    if did in legacy_ids and did != "muyeol":
        assert ref.exists(), ref
        assert turn.exists(), turn
    assert master.exists(), master
    assert end.exists(), end
    with Image.open(gif) as im:
        assert im.size == (576, 256), (did, im.size)
        # V2 has 19 source frames and Pillow merges one identical handoff frame.
        # V3 is a native 16-cell cinematic storyboard with no duplicate handoff.
        expected_frames = 16 if cinematic_master.exists() else 18
        assert im.n_frames == expected_frames, (did, im.n_frames, expected_frames)
        duration = 0
        for frame in range(im.n_frames):
            im.seek(frame)
            duration += im.info["duration"]
        assert duration == 9820, (did, duration)
cinematic_count = sum(
    (ROOT / "tools" / "ruin_gifs" / "v3" / "master" / f"{did}.png").exists()
    for did in ids
)
print(
    f"OK: {len(ids)} reconstruction GIFs and final frames "
    f"({cinematic_count} cinematic V3, {len(ids) - cinematic_count} legacy V2)"
)
