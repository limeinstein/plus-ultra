#!/usr/bin/env python3
"""깜·마리아 친지 사건의 초상과 장면 그림 규격을 확인한다."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PORTRAITS = ROOT / "images" / "portraits" / "legendary"
EVENTS = ROOT / "images" / "legend-events"


def check_image(path: Path, size: tuple[int, int], transparent: bool) -> None:
    assert path.is_file() and path.stat().st_size > 0, f"missing image: {path}"
    with Image.open(path) as image:
        assert image.size == size, f"wrong size: {path} {image.size}"
        if transparent:
            rgba = image.convert("RGBA")
            low, high = rgba.getchannel("A").getextrema()
            assert low < 250 and high > 0, f"missing alpha cutout: {path}"


for person in ("cam", "maria", "lan", "mateo"):
    check_image(PORTRAITS / f"{person}.webp", (448, 448), True)
    check_image(PORTRAITS / f"{person}_half.webp", (1024, 1536), True)

for scene in (
    "cam_hoian_reunion",
    "maria_manila_reunion",
    "cam_maria_lantern_feast",
    "cam_maria_departure",
):
    check_image(EVENTS / f"{scene}.webp", (1881, 836), False)

manifest = (ROOT / "images" / "manifest.js").read_text(encoding="utf-8")
faces = (ROOT / "js" / "data" / "portraitfaces.js").read_text(encoding="utf-8")
for person in ("cam", "maria", "lan", "mateo"):
    assert f'"portraits/legendary/{person}"' in manifest
    assert f'"portraits/legendary/{person}_half"' in manifest
    assert f'"portraits/legendary/{person}"' in faces
    assert f'"portraits/legendary/{person}_half"' in faces

for scene in (
    "cam_hoian_reunion",
    "maria_manila_reunion",
    "cam_maria_lantern_feast",
    "cam_maria_departure",
):
    assert f'"legend-events/{scene}"' in manifest

print("cam/maria art smoke: 8 portraits + 4 event shots OK")
