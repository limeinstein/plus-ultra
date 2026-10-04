#!/usr/bin/env python3
"""보물 회전 원화·GIF·마지막 장면·런타임 시트를 검사한다."""
import re
from pathlib import Path

from PIL import Image, ImageChops, ImageStat


ROOT = Path(__file__).resolve().parents[1]
import importlib.util
_spec = importlib.util.spec_from_file_location("treasure_build", ROOT / "tools" / "treasure_gifs" / "build.py")
_mod = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(_mod)
TREASURE_IDS = list(_mod.TREASURE_IDS)
# 그림·책·병풍·벽화처럼 납작한 보물은 360° 대신 ±30° 흔들어 찍었다 (tools/procedural_art) — 앞·뒤 차이가 작다
FLAT = {"cheonmado", "libai", "lanting", "qingming", "hunmin", "baburnama", "shahnameh", "mayacodex", "pirireis",
        "monalisa", "creation", "lastsupper", "birthvenus", "durer", "urbinovenus", "babeltower", "orgaz",
        "ambassadors", "earthlydelights", "ghentaltar", "nanbanscreen", "ajanta", "paladoro", "holylance",
        "incadisc", "sunstone", "hammurabi", "tripitaka", "moctezuma", "iznikware", "lustreware"}


def difference(a: Image.Image, b: Image.Image) -> float:
    delta = ImageStat.Stat(ImageChops.difference(a.convert("RGB"), b.convert("RGB"))).mean
    return sum(delta) / 3


data = (ROOT / "js" / "data" / "discoveries.js").read_text(encoding="utf-8")
treasures = set(re.findall(r"^\s*add\('([^']+)', '[^']+', 'treasure'", data, re.M))
sea = (ROOT / "js" / "data" / "seadisc.js").read_text(encoding="utf-8")
treasures |= set(re.findall(r"^\s*s\('([^']+)', '[^']+', 'treasure'", sea, re.M))
assert set(TREASURE_IDS) == treasures, (set(TREASURE_IDS) ^ treasures)

for did in TREASURE_IDS:
    source = ROOT / "tools" / "treasure_gifs" / "sources" / f"{did}.png"
    gif = ROOT / "images" / "discoveries" / f"{did}.gif"
    end = ROOT / "images" / "discovery-ends" / f"{did}.jpg"
    sheet = ROOT / "images" / "discovery-sheets" / f"{did}.webp"
    for path in (source, gif, end, sheet):
        assert path.exists(), path

    with Image.open(source) as im:
        assert im.width >= 1500 and im.height >= 880, (did, im.size)
        # 4×2 판의 각 칸은 세로형 또는 정사각형에 가까워야 한다.
        cell_ratio = (im.width / 4) / (im.height / 2)
        assert .72 <= cell_ratio <= 1.03, (did, im.size, cell_ratio)

    with Image.open(gif) as im:
        assert im.size == (576, 256), (did, im.size)
        assert im.n_frames == 24, (did, im.n_frames)
        frames = []
        duration = 0
        for frame_no in range(im.n_frames):
            im.seek(frame_no)
            duration += im.info["duration"]
            if frame_no in (2, 6, 11, 15, 23):
                frames.append(im.convert("RGB"))
        assert duration == 8400, (did, duration)
        # 두 회전 모두 정면과 뒷면이 충분히 달라야 하며 피날레도 존재해야 한다.
        turn = 0.8 if did in FLAT else 3.5
        assert difference(frames[0], frames[1]) > turn, did
        assert difference(frames[2], frames[3]) > turn, did
        assert difference(frames[0], frames[4]) > 1.0, did

    with Image.open(end) as im:
        assert im.size == (576, 256), (did, im.size)
    with Image.open(sheet) as im:
        assert im.size == (3456, 1024), (did, im.size)

print(f"OK: {len(TREASURE_IDS)} treasure turntables, GIFs, final frames and runtime sheets")
