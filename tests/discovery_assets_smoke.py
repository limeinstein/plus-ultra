#!/usr/bin/env python3
"""본편·이야기·튜토리얼 발견물의 그림 세트와 매니페스트를 모두 점검한다."""
from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import images  # noqa: E402


def ids(pattern, rel, flags=re.M):
    text = (ROOT / rel).read_text(encoding="utf-8")
    return {match[0] if isinstance(match, tuple) else match for match in re.findall(pattern, text, flags)}


data = images.game_data()
rows = data["discoveries"]
all_ids = [row["id"] for row in rows]
assert len(all_ids) == len(set(all_ids)), "발견물 ID 중복: " + ", ".join(sorted({x for x in all_ids if all_ids.count(x) > 1}))

sea_ids = ids(r"^\s*s\('([^']+)'", "js/data/seadisc.js")
tutorial_ids = ids(r"W\.list\.push\(\['([^']+)'", "js/data/tutorial.js")
story_ids = ids(r"^\s*\['(ft_[^']+)',\s*'[^']+',\s*\d+", "js/data/story.js")
known = set(all_ids)

assert len(sea_ids) == 24 and sea_ids <= known, "본편 해양 발견물 누락: " + ", ".join(sorted(sea_ids - known))
assert tutorial_ids == {"herc_cave"} and tutorial_ids <= known, "튜토리얼 발견물 누락"
assert len(story_ids) == 7 and story_ids <= known, "이야기 발견물 누락: " + ", ".join(sorted(story_ids - known))
assert len(known) == 693, f"전체 발견물 수가 예상과 다름: {len(known)}"

folders = {
    "discoveries": ".gif",
    "discovery-ends": ".jpg",
    "discovery-sheets": ".webp",
}
manifest = (ROOT / "images/manifest.js").read_text(encoding="utf-8")
missing = []
for did in sorted(known):
    for folder, ext in folders.items():
        path = ROOT / "images" / folder / f"{did}{ext}"
        if not path.is_file():
            missing.append(str(path.relative_to(ROOT)))
        if f'"{folder}/{did}"' not in manifest:
            missing.append(f"manifest:{folder}/{did}")
assert not missing, "발견물 그림 누락:\n" + "\n".join(missing)

# 완성된 세 파일이 있는데 어느 모드의 발견물에도 없는 경우도 잡는다.
asset_sets = [{path.stem for path in (ROOT / "images" / folder).glob(f"*{ext}")} for folder, ext in folders.items()]
orphaned = set.intersection(*asset_sets) - known
assert not orphaned, "자료에 없는 발견물 그림: " + ", ".join(sorted(orphaned))

print(
    "PASS: discoveries 693 "
    f"(main {len(known - story_ids)}, story-only {len(story_ids)}, tutorial {len(tutorial_ids)}); "
    "GIF/end/sheet/manifest complete"
)
