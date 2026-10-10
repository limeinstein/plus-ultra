#!/usr/bin/env python3
"""4×4 시네마틱 원화를 발견 GIF와 마지막 장면으로 굽는다."""
from __future__ import annotations

import argparse
import re
from pathlib import Path

from PIL import Image

from build_v2 import H, W, fit_whole


ROOT = Path(__file__).resolve().parents[2]
MASTER = ROOT / "tools" / "ruin_gifs" / "v3" / "master"
LIVE_OUT = ROOT / "images" / "discoveries"
LIVE_ENDS = ROOT / "images" / "discovery-ends"
PREVIEW_OUT = ROOT / "images" / "discoveries_cinematic"
PREVIEW_ENDS = ROOT / "images" / "discovery-ends-cinematic"

# 전체 9.82초. 기존 발견 연출의 G.FX.reveal.gifMs와 맞춰 다른 GIF와 함께 써도 된다.
DURATIONS = [700, 600, 600, 700, 800, 700, 500, 600,
             600, 500, 500, 500, 500, 600, 600, 820]


def storyboard_cells(path: Path) -> list[Image.Image]:
    source = Image.open(path).convert("RGB")
    if source.width < 1024 or source.height < 768:
        raise ValueError(f"원화가 너무 작음: {path} ({source.width}×{source.height})")
    cells = []
    cell_w, cell_h = source.width // 4, source.height // 4
    for row in range(4):
        for col in range(4):
            right = (col + 1) * cell_w if col < 3 else source.width
            bottom = (row + 1) * cell_h if row < 3 else source.height
            cells.append(fit_whole(source.crop((col * cell_w, row * cell_h, right, bottom))))
    return cells


def master_path(did: str) -> Path:
    """같은 ID의 수정본(-v2, -v3…)이 있으면 가장 높은 판을 쓴다."""
    versions = []
    for path in MASTER.glob(f"{did}-v*.png"):
        match = re.fullmatch(rf"{re.escape(did)}-v(\d+)", path.stem)
        if match:
            versions.append((int(match.group(1)), path))
    if versions:
        return max(versions)[1]
    return MASTER / f"{did}.png"


def build_one(did: str, out_dir: Path, ends_dir: Path) -> Path:
    source = master_path(did)
    if not source.exists():
        raise FileNotFoundError(f"시네마틱 원화 없음: {source}")
    frames = storyboard_cells(source)
    if len(frames) != 16 or len(DURATIONS) != 16:
        raise AssertionError("시네마틱 원화와 재생 시간은 반드시 16칸이어야 함")

    out_dir.mkdir(parents=True, exist_ok=True)
    ends_dir.mkdir(parents=True, exist_ok=True)
    destination = out_dir / f"{did}.gif"
    palette = frames[-1].convert("P", palette=Image.Palette.ADAPTIVE, colors=128)
    quantized = [frame.quantize(palette=palette, dither=Image.Dither.FLOYDSTEINBERG)
                 for frame in frames]
    quantized[0].save(destination, save_all=True, append_images=quantized[1:],
                      duration=DURATIONS, loop=0, disposal=1, optimize=True)
    frames[-1].save(ends_dir / f"{did}.jpg", quality=92, optimize=True)
    return destination


def requested_ids(raw: str | None) -> list[str]:
    if raw:
        return [part.strip() for part in raw.split(",") if part.strip()]
    if not MASTER.exists():
        return []
    return sorted({re.sub(r"-v\d+$", "", path.stem) for path in MASTER.glob("*.png")})


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", help="쉼표로 나눈 발견물 ID. 생략하면 준비된 V3 원화만 굽는다.")
    parser.add_argument("--preview", action="store_true",
                        help="게임 파일 대신 별도 미리보기 폴더에 쓴다.")
    args = parser.parse_args()
    ids = requested_ids(args.only)
    if not ids:
        raise SystemExit("tools/ruin_gifs/v3/master에 시네마틱 원화가 없습니다.")
    out_dir = PREVIEW_OUT if args.preview else LIVE_OUT
    ends_dir = PREVIEW_ENDS if args.preview else LIVE_ENDS
    for index, did in enumerate(ids, 1):
        destination = build_one(did, out_dir, ends_dir)
        print(f"[{index:03d}/{len(ids):03d}] {did:<18} {destination.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
