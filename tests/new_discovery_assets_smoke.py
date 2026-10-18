#!/usr/bin/env python3
"""2026-10-18 신규 발견물 151종의 원화·게임 자산·도시 외관·지도 시트를 점검한다."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PROMPTS = ROOT / "tools" / "new_discovery_assets" / "prompts.json"


def main() -> None:
    data = json.loads(PROMPTS.read_text(encoding="utf-8"))
    source = data["source"]
    landmarks = data["landmarks"]
    sheets = data["iconSheets"]

    assert len(source) == 151
    assert len({row["id"] for row in source}) == 151
    assert {cat: sum(row["cat"] == cat for row in source) for cat in ("ruin", "nature", "creature", "treasure")} == {
        "ruin": 75, "nature": 25, "creature": 50, "treasure": 1
    }

    missing = []
    for row in source:
        for rel in (row["target"], f"images/discoveries/{row['id']}.gif",
                    f"images/discovery-ends/{row['id']}.jpg",
                    f"images/discovery-sheets/{row['id']}.webp"):
            if not (ROOT / rel).is_file():
                missing.append(rel)
        with Image.open(ROOT / "images" / "discoveries" / f"{row['id']}.gif") as image:
            assert image.size == (576, 256), row["id"]
            assert image.n_frames >= 16, row["id"]
        with Image.open(ROOT / "images" / "discovery-ends" / f"{row['id']}.jpg") as image:
            assert image.size == (576, 256), row["id"]
        with Image.open(ROOT / "images" / "discovery-sheets" / f"{row['id']}.webp") as image:
            assert image.width % 6 == 0 and image.height % 256 == 0, row["id"]
    assert not missing, "신규 발견물 파일 누락:\n" + "\n".join(missing)

    assert len(landmarks) == 19
    for row in landmarks:
        with Image.open(ROOT / row["final"]) as image:
            assert image.height == 520, row["id"]
            assert image.mode == "RGBA" and image.getchannel("A").getextrema()[0] == 0, row["id"]

    assert len(sheets) == 6 and sum(len(row["ids"]) for row in sheets) == 81
    for row in sheets:
        with Image.open(ROOT / row["target"]) as image:
            assert image.width == image.height and image.width % 4 == 0, row["id"]
            assert image.mode == "RGBA" and image.getchannel("A").getextrema()[0] == 0, row["id"]

    icon_js = (ROOT / "js" / "art" / "discovery_icon.js").read_text(encoding="utf-8")
    for row in sheets:
        assert f"map-discoveries/{row['id']}" in icon_js
        for did in row["ids"]:
            assert f"'{did}'" in icon_js

    print("PASS: 신규 발견물 151종 GIF/end/sheet, 도시 정면 외관 19종, 지도 아이콘 81종(6시트)")


if __name__ == "__main__":
    main()
