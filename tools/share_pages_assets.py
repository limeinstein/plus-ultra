#!/usr/bin/env python3
"""Share identical heavy assets between stable and beta GitHub Pages builds.

The Pages site serves the stable build at ``/`` and the beta build at
``/beta/``.  When both builds contain byte-identical images/audio, keeping a
second copy under ``/beta`` only makes the deployment artifact larger.  This
tool verifies the trees are identical, rewrites beta text references one
directory upward, and removes the duplicate beta trees.  Pixel data and audio
files are never transcoded or modified.
"""

from __future__ import annotations

import argparse
import hashlib
import re
import shutil
from pathlib import Path


SHARED_DIRS = ("images", "music", "sounds")
TEXT_SUFFIXES = {".css", ".html", ".js", ".json", ".webmanifest"}


def file_digest(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def relative_files(root: Path) -> dict[str, Path]:
    return {
        path.relative_to(root).as_posix(): path
        for path in root.rglob("*")
        if path.is_file()
    }


def verify_identical(stable_dir: Path, beta_dir: Path) -> tuple[int, int]:
    stable_files = relative_files(stable_dir)
    beta_files = relative_files(beta_dir)
    if stable_files.keys() != beta_files.keys():
        missing = sorted(stable_files.keys() - beta_files.keys())[:5]
        extra = sorted(beta_files.keys() - stable_files.keys())[:5]
        raise SystemExit(
            f"shared tree mismatch: {stable_dir.name}; missing={missing}; extra={extra}"
        )

    total_bytes = 0
    for relative, stable_path in stable_files.items():
        beta_path = beta_files[relative]
        stable_size = stable_path.stat().st_size
        if stable_size != beta_path.stat().st_size:
            raise SystemExit(f"shared file size mismatch: {stable_dir.name}/{relative}")
        if file_digest(stable_path) != file_digest(beta_path):
            raise SystemExit(f"shared file content mismatch: {stable_dir.name}/{relative}")
        total_bytes += stable_size
    return len(stable_files), total_bytes


def rewrite_beta_references(beta_root: Path, shared: tuple[str, ...] = SHARED_DIRS) -> tuple[int, int]:
    names = "|".join(re.escape(name) for name in shared)
    pattern = re.compile(rf"(?<![:/A-Za-z0-9_-])((?:\.\./|\./)*)(?:{names})/")
    changed_files = 0
    changed_refs = 0

    def add_parent(match: re.Match[str]) -> str:
        nonlocal changed_refs
        changed_refs += 1
        original = match.group(0)
        return "../" + original

    for path in beta_root.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        text = path.read_text(encoding="utf-8")
        rewritten = pattern.sub(add_parent, text)
        if rewritten != text:
            path.write_text(rewritten, encoding="utf-8", newline="\n")
            changed_files += 1
    return changed_files, changed_refs


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--site", type=Path, required=True, help="stable Pages root")
    parser.add_argument("--beta", type=Path, help="beta root; defaults to SITE/beta")
    args = parser.parse_args()

    site_root = args.site.resolve()
    beta_root = (args.beta or site_root / "beta").resolve()
    if not site_root.is_dir() or not beta_root.is_dir():
        raise SystemExit(f"missing build root: site={site_root}, beta={beta_root}")
    if beta_root == site_root or site_root not in beta_root.parents:
        raise SystemExit("beta root must be a child of the stable Pages root")

    total_files = 0
    total_bytes = 0
    shared: list[str] = []
    for name in SHARED_DIRS:
        stable_dir = site_root / name
        beta_dir = beta_root / name
        if not stable_dir.is_dir() or not beta_dir.is_dir():
            print(f"shared Pages assets: {name} kept in beta (missing directory)")
            continue
        # 정식(main)과 베타(beta) 가지의 그림·소리가 다르면(한쪽만 새 그림을 받은 때) 배포 전체를 멈추지 않고
        # 그 폴더만 베타에 그대로 둔다 — 2026-10-28 QA
        try:
            file_count, byte_count = verify_identical(stable_dir, beta_dir)
        except SystemExit as error:
            print(f"shared Pages assets: {name} kept in beta ({error})")
            continue
        shared.append(name)
        total_files += file_count
        total_bytes += byte_count

    if not shared:
        print("shared Pages assets: nothing shared")
        return 0
    changed_files, changed_refs = rewrite_beta_references(beta_root, tuple(shared))
    for name in shared:
        shutil.rmtree(beta_root / name)

    print(
        "shared Pages assets: "
        f"{total_files} files, {total_bytes / (1024 ** 3):.2f} GiB removed; "
        f"{changed_refs} references rewritten in {changed_files} files"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
