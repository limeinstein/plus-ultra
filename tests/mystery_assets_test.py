#!/usr/bin/env python3
"""Validate every regional mystery discovery art asset."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    prompts = json.loads(
        (ROOT / "tools" / "new_discovery_assets" / "prompts.json").read_text(
            encoding="utf-8"
        )
    )["mystery"]
    ids = [row["id"] for row in prompts]
    assert len(ids) == 110
    assert len(set(ids)) == 110

    manifest = (ROOT / "images" / "manifest.js").read_text(encoding="utf-8")
    for discovery_id in ids:
        source = Image.open(
            ROOT / "tools" / "ruin_gifs" / "v3" / "master" / f"{discovery_id}.png"
        )
        assert abs(source.width / source.height - 4 / 3) < 0.001

        gif = Image.open(ROOT / "images" / "discoveries" / f"{discovery_id}.gif")
        assert gif.size == (576, 256)
        assert gif.n_frames == 16
        duration = 0
        for frame in range(gif.n_frames):
            gif.seek(frame)
            duration += gif.info.get("duration", 0)
        assert duration == 9820

        ending = Image.open(
            ROOT / "images" / "discovery-ends" / f"{discovery_id}.jpg"
        )
        sheet = Image.open(
            ROOT / "images" / "discovery-sheets" / f"{discovery_id}.webp"
        )
        assert ending.size == (576, 256)
        assert sheet.size == (3456, 768)

        for group in ("discoveries", "discovery-ends", "discovery-sheets"):
            assert f'"{group}/{discovery_id}"' in manifest

    achievement = Image.open(
        ROOT / "images" / "achievement-events" / "mysteries.webp"
    )
    assert achievement.size == (1881, 836)
    assert '"achievement-events/mysteries"' in manifest
    print(
        "OK: mystery assets 110 × "
        "(4×4 source, 16-frame GIF, ending, runtime sheet) + achievement shot"
    )


if __name__ == "__main__":
    main()
