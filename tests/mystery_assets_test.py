#!/usr/bin/env python3
"""Validate every regional mystery discovery art asset."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    data = json.loads(
        (ROOT / "tools" / "new_discovery_assets" / "prompts.json").read_text(
            encoding="utf-8"
        )
    )
    prompts = data["mystery"]
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

    landmarks = data["mysteryLandmarks"]
    map_sheets = data["mysteryIconSheets"]
    assert not landmarks  # 현재 110곳은 육상 106곳·해상 4곳이며 도시형은 없다.
    assert len(map_sheets) == 7
    assert sum(len(row["ids"]) for row in map_sheets) == 110
    for row in map_sheets:
        icon_sheet = Image.open(ROOT / row["target"])
        assert icon_sheet.width == icon_sheet.height
        assert icon_sheet.width % 4 == 0
        assert icon_sheet.mode == "RGBA"
        assert icon_sheet.getchannel("A").getextrema()[0] == 0
        assert f'"map-discoveries/{row["id"]}"' in manifest

    last = Image.open(ROOT / map_sheets[-1]["target"])
    cell = last.width // 4
    alpha = last.getchannel("A")
    for slot in (14, 15):
        x = (slot % 4) * cell
        y = (slot // 4) * cell
        assert alpha.crop((x, y, x + cell, y + cell)).getextrema()[1] == 0
    print(
        "OK: mystery assets 110 × "
        "(4×4 source, 16-frame GIF, ending, runtime sheet) + "
        "achievement shot + exploration icons 7 sheets"
    )


if __name__ == "__main__":
    main()
