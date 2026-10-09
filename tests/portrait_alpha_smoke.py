#!/usr/bin/env python3
"""새 거리·이야기 초상의 크기와 투명 배경을 검사한다."""
from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
STYLES = ("ib", "ne", "it", "gr", "ru", "is", "pe", "af", "sw", "in",
          "se", "cn", "kr", "jp", "az", "an", "co", "tr", "st", "na")
ROLES = ("town_man", "town_woman", "boy", "girl", "elder", "grandmother",
         "librarian", "innkeeper", "adventurer", "merchant", "noble_youth",
         "soldier", "navigator")
STORY = {
    "images/portraits/npc/story_mother": (1024, 1024),
    "images/portraits/npc/story_father": (1024, 1024),
    "images/portraits/mates/anselmo": (1024, 1024),
    "images/portraits/mates/estevao": (1024, 1024),
    "images/portraits/sponsors/pt_casanova": (1024, 1024),
}


def check(path: Path, size: tuple[int, int]) -> None:
    with Image.open(path) as raw:
        image = raw.convert("RGBA")
    assert image.size == size, (path, image.size, size)
    alpha = image.getchannel("A")
    assert alpha.getextrema() == (0, 255), (path, alpha.getextrema())
    transparent = sum(alpha.histogram()[:6])
    assert transparent >= alpha.width * alpha.height * .05, (path, transparent)


for style in STYLES:
    for role in ROLES:
        base = ROOT / "images" / "portraits" / "street-folk" / f"{role}_{style}"
        check(base.with_suffix(".webp"), (512, 512))
        check(base.with_name(base.name + "_half").with_suffix(".webp"), (768, 1152))

for stem, face_size in STORY.items():
    base = ROOT / stem
    check(base.with_suffix(".webp"), face_size)
    check(base.with_name(base.name + "_half").with_suffix(".webp"), (1024, 1536))

print("거리 NPC 520장 + 이야기 인물 10장: RGBA 투명 배경·크기 통과")
