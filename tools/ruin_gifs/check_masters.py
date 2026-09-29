#!/usr/bin/env python3
"""Validate every V2 4x4 reconstruction master sheet."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

from build_v2 import MASTER, ruin_ids


def main() -> None:
    ids = ruin_ids()
    missing: list[str] = []
    bad: list[str] = []
    for did in ids:
        path = MASTER / f"{did}.png"
        if not path.exists():
            missing.append(did)
            continue
        try:
            with Image.open(path) as image:
                image.load()
                # ImageGen output can be a few pixels off-square and the
                # splitter deliberately gives the remainder to the last row
                # and column.  Reject only undersized or materially non-square
                # sheets; build_v2.py handles the harmless remainder.
                ratio = image.width / image.height
                if min(image.size) < 1024 or not 0.60 <= ratio <= 1.60:
                    bad.append(f"{did}: {image.size}")
        except Exception as exc:
            bad.append(f"{did}: {exc}")
    if missing or bad:
        if missing:
            print("missing:", ", ".join(missing))
        if bad:
            print("bad:", *bad, sep="\n  ")
        raise SystemExit(1)
    print(f"OK: {len(ids)} loadable 4x4 master sheets")


if __name__ == "__main__":
    main()
