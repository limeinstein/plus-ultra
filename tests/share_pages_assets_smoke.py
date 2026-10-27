#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import subprocess
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TOOL = ROOT / "tools" / "share_pages_assets.py"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


with tempfile.TemporaryDirectory() as temp:
    site = Path(temp) / "site"
    beta = site / "beta"
    for name, relative, payload in (
        ("images", "monster.webp", b"full-resolution-image"),
        ("music", "sea.ogg", b"full-quality-music"),
        ("sounds", "cannon.ogg", b"full-quality-sound"),
    ):
        stable_file = site / name / relative
        beta_file = beta / name / relative
        stable_file.parent.mkdir(parents=True, exist_ok=True)
        beta_file.parent.mkdir(parents=True, exist_ok=True)
        stable_file.write_bytes(payload)
        beta_file.write_bytes(payload)

    (beta / "assets").mkdir(parents=True)
    (beta / "center").mkdir(parents=True)
    (beta / "index.html").write_text(
        '<img src="images/monster.webp"><script src="assets/game.js"></script>',
        encoding="utf-8",
    )
    (beta / "assets" / "game.js").write_text(
        'const a="sounds/cannon.ogg",b="music/sea.ogg",c="https://cdn.test/images/x";',
        encoding="utf-8",
    )
    (beta / "center" / "index.html").write_text(
        '<img src="../images/monster.webp">', encoding="utf-8"
    )

    stable_hashes = {
        name: digest(site / name / relative)
        for name, relative in (
            ("images", "monster.webp"),
            ("music", "sea.ogg"),
            ("sounds", "cannon.ogg"),
        )
    }
    result = subprocess.run(
        [sys.executable, str(TOOL), "--site", str(site)],
        check=True,
        capture_output=True,
        text=True,
    )

    assert "3 files" in result.stdout
    assert "../images/monster.webp" in (beta / "index.html").read_text(encoding="utf-8")
    game_js = (beta / "assets" / "game.js").read_text(encoding="utf-8")
    assert '"../sounds/cannon.ogg"' in game_js
    assert '"../music/sea.ogg"' in game_js
    assert "https://cdn.test/images/x" in game_js
    assert "../../images/monster.webp" in (beta / "center" / "index.html").read_text(
        encoding="utf-8"
    )
    assert all(not (beta / name).exists() for name in ("images", "music", "sounds"))
    assert stable_hashes == {
        name: digest(site / name / relative)
        for name, relative in (
            ("images", "monster.webp"),
            ("music", "sea.ogg"),
            ("sounds", "cannon.ogg"),
        )
    }

print("share_pages_assets_smoke: ok")
