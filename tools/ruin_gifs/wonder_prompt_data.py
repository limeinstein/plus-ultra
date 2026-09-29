#!/usr/bin/env python3
"""Print the 96 building-wonder rows used by the reconstruction-art pass."""
from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
WONDERS = ROOT / "js" / "data" / "wonders.js"


def wonder_rows() -> list[dict[str, str]]:
    src = WONDERS.read_text(encoding="utf-8")
    # The prose arguments are each kept on their own final line.  Restrict
    # the match to one w(...); call so the following r(...) relic is excluded.
    pattern = re.compile(
        r"^\s*w\('([^']+)',\s*'([^']+)'(?:(?!^\s*w\().)*?\n"
        r"\s*'((?:\\.|[^'\\])*)',\n\s*'((?:\\.|[^'\\])*)'"
        r"(?:,\s*\{.*?\})?\);",
        re.M | re.S,
    )
    return [
        {"id": match.group(1), "name": match.group(2),
         "description": match.group(3), "hint": match.group(4)}
        for match in pattern.finditer(src)
    ]


if __name__ == "__main__":
    print(json.dumps(wonder_rows(), ensure_ascii=False, indent=2))
