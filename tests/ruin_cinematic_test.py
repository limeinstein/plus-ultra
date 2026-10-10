#!/usr/bin/env python3
"""역사·종교 발견물 시네마틱 프롬프트와 16칸 합성 규격 검사."""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools" / "ruin_gifs"))
import build_cinematic as cinematic  # noqa: E402


def check_prompts() -> None:
    raw = subprocess.check_output(
        ["node", "tools/ruin_gifs/cinematic_prompts.js"], cwd=ROOT, text=True,
        encoding="utf-8"
    )
    rows = json.loads(raw)
    assert len(rows) == 216, len(rows)
    assert len({row["id"] for row in rows}) == 216
    for row in rows:
        prompt = row["prompt"]
        assert "나무 제도 테이블" in prompt
        assert "실제 역사 공간으로 전환" in prompt
        assert "내부" in prompt
        assert "360도" in prompt
        assert "깊은 밤" in prompt
        assert "다시 밝은 낮" in prompt
        assert "허구의 방을 만들지 않는다" in prompt


def check_compositor() -> None:
    assert len(cinematic.DURATIONS) == 16
    assert sum(cinematic.DURATIONS) == 9820
    with tempfile.TemporaryDirectory() as folder:
        path = Path(folder) / "sheet.png"
        image = Image.new("RGB", (1024, 768))
        for index in range(16):
            x, y = (index % 4) * 256, (index // 4) * 192
            color = ((index * 37) % 256, (index * 67) % 256, (index * 97) % 256)
            image.paste(color, (x, y, x + 256, y + 192))
        image.save(path)
        cells = cinematic.storyboard_cells(path)
        assert len(cells) == 16
        assert all(cell.size == (cinematic.W, cinematic.H) for cell in cells)


def check_built_assets() -> None:
    """준비된 V3 원화는 게임용 세 파일까지 빠짐없이 같은 규격이어야 한다."""
    prompt_rows = json.loads(
        (ROOT / "tools" / "ruin_gifs" / "cinematic-prompts.json").read_text(encoding="utf-8")
    )
    prompt_ids = {row["id"] for row in prompt_rows}
    master_dir = ROOT / "tools" / "ruin_gifs" / "v3" / "master"
    ready = sorted(path.stem for path in master_dir.glob("*.png") if path.stem in prompt_ids)
    assert ready, "V3 원화가 하나도 없음"

    for did in ready:
        master = master_dir / f"{did}.png"
        gif_path = ROOT / "images" / "discoveries" / f"{did}.gif"
        end_path = ROOT / "images" / "discovery-ends" / f"{did}.jpg"
        sheet_path = ROOT / "images" / "discovery-sheets" / f"{did}.webp"
        assert gif_path.exists(), f"GIF 없음: {did}"
        assert end_path.exists(), f"마지막 장면 없음: {did}"
        assert sheet_path.exists(), f"재생 시트 없음: {did}"

        with Image.open(master) as image:
            assert image.width >= 1024 and image.height >= 768, (did, image.size)
        with Image.open(gif_path) as image:
            assert image.size == (cinematic.W, cinematic.H), (did, image.size)
            assert image.n_frames == 16, (did, image.n_frames)
            durations = []
            for frame in range(image.n_frames):
                image.seek(frame)
                durations.append(image.info.get("duration", 0))
            assert sum(durations) == sum(cinematic.DURATIONS), (did, durations)
        with Image.open(end_path) as image:
            assert image.size == (cinematic.W, cinematic.H), (did, image.size)
        with Image.open(sheet_path) as image:
            assert image.size == (cinematic.W * 6, cinematic.H * 3), (did, image.size)

    print(f"OK: 준비된 V3 {len(ready)}개 · GIF/마지막 장면/재생 시트")


if __name__ == "__main__":
    check_prompts()
    check_compositor()
    check_built_assets()
    print("OK: 유적 216개 프롬프트 · 16칸 · 9820ms")
