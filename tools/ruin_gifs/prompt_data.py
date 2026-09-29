#!/usr/bin/env python3
"""Print compact JSON used to drive the ImageGen reconstruction pass."""
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "tools" / "heritage" / "out" / "raw.json"
DISCOVERIES = ROOT / "js" / "data" / "discoveries.js"
REFERENCES = ROOT / "tools" / "heritage" / "references" / "discoveries"


def ruin_rows() -> list[tuple[str, str]]:
    import re
    src = DISCOVERIES.read_text(encoding="utf-8")
    return re.findall(r"^\s*add\('([^']+)', '([^']+)', 'ruin'", src, re.M)


def main() -> None:
    raw = json.loads(RAW.read_text(encoding="utf-8")).get("disc", {})
    rows = []
    for did, ko_name in ruin_rows():
        rec = raw.get(did, {})
        unesco = rec.get("unesco") or {}
        wiki = rec.get("wiki") or {}
        name = unesco.get("name") or wiki.get("title") or ko_name
        context = unesco.get("desc") or wiki.get("extract") or ""
        rows.append({
            "id": did,
            "name": name,
            "koName": ko_name,
            "context": " ".join(context.split())[:700],
            "legend": bool(rec.get("legend")),
            "reference": str(REFERENCES / f"{did}.jpg"),
        })
    print(json.dumps(rows, ensure_ascii=True, separators=(",", ":")))


if __name__ == "__main__":
    main()
