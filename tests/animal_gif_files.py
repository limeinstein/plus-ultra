#!/usr/bin/env python3
"""동물 발견 스토리보드·GIF·마지막 장면·런타임 시트를 검사한다."""
import re
from pathlib import Path

from PIL import Image, ImageChops, ImageStat


ROOT = Path(__file__).resolve().parents[1]
BASE_ANIMAL_IDS = [
    "tarantula", "llama", "prairiedog", "moose", "frigatebird", "tortoise",
    "albatross", "kangaroo", "paradise", "sable", "tiger", "panda",
    "porcupine", "coelacanth", "warthog", "komodo", "penguin", "mandrill",
    "ostrich", "flamingo", "hippo", "crocodile", "polarbear",
]
animal_data = (ROOT / "js" / "data" / "animals.js").read_text(encoding="utf-8")
ADDED_ANIMAL_IDS = re.findall(r"^\s*a\('([^']+)'", animal_data, re.M)
more_data = (ROOT / "js" / "data" / "moredisc.js").read_text(encoding="utf-8")
MORE_BEAST_IDS = re.findall(r"^\s*beast\('([^']+)'", more_data, re.M)
ANIMAL_IDS = BASE_ANIMAL_IDS + [
    did for did in ADDED_ANIMAL_IDS + MORE_BEAST_IDS if did not in BASE_ANIMAL_IDS
]

data = (ROOT / "js" / "data" / "discoveries.js").read_text(encoding="utf-8")
creatures = set(re.findall(r"^\s*add\('([^']+)', '[^']+', 'creature'", data, re.M))
assert set(BASE_ANIMAL_IDS) <= creatures
assert len(ADDED_ANIMAL_IDS) == 94, len(ADDED_ANIMAL_IDS)
assert len(MORE_BEAST_IDS) == 21, len(MORE_BEAST_IDS)
assert len(ANIMAL_IDS) == 138, len(ANIMAL_IDS)
assert len(ANIMAL_IDS) == len(set(ANIMAL_IDS)), "duplicate animal discovery id"

for did in ANIMAL_IDS:
    source = ROOT / "tools" / "animal_gifs" / "sources" / f"{did}.png"
    gif = ROOT / "images" / "discoveries" / f"{did}.gif"
    end = ROOT / "images" / "discovery-ends" / f"{did}.jpg"
    sheet = ROOT / "images" / "discovery-sheets" / f"{did}.webp"
    for path in (source, gif, end, sheet):
        assert path.exists(), path

    with Image.open(source) as im:
        # 이미지 생성기는 같은 2×2 원화를 4:3·3:2·16:9에 가까운 세 규격으로
        # 내보낼 수 있다. 빌더는 가운데 칸막이를 기준으로 모두 같은 방식으로 자른다.
        assert im.width >= 1400 and im.height >= 900, (did, im.size)
        assert 1.30 <= im.width / im.height <= 1.80, (did, im.size)
        # 첫 장면과 성체가 나온 마지막 장면이 실제로 달라야 한다.
        mx, my = im.width // 2, im.height // 2
        first_panel = im.crop((0, 0, mx - 6, my - 6)).resize((288, 192)).convert("RGB")
        last_panel = im.crop((mx + 6, my + 6, im.width, im.height)).resize((288, 192)).convert("RGB")
        delta = ImageStat.Stat(ImageChops.difference(first_panel, last_panel)).mean
        assert sum(delta) / 3 > 12, (did, delta)

    with Image.open(gif) as im:
        assert im.size == (576, 256), (did, im.size)
        assert im.n_frames == 18, (did, im.n_frames)
        duration = 0
        im.seek(0)
        first = im.convert("RGB")
        for frame in range(im.n_frames):
            im.seek(frame)
            duration += im.info["duration"]
        last = im.convert("RGB")
        assert duration == 7200, (did, duration)
        delta = ImageStat.Stat(ImageChops.difference(first, last)).mean
        assert sum(delta) / 3 > 18, (did, delta)

    with Image.open(end) as im:
        assert im.size == (576, 256), (did, im.size)
    with Image.open(sheet) as im:
        assert im.size == (3456, 768), (did, im.size)

print(f"OK: {len(ANIMAL_IDS)} animal storyboards, GIFs, final frames and runtime sheets")
