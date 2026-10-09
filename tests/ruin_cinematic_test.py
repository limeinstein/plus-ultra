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


if __name__ == "__main__":
    check_prompts()
    check_compositor()
    print("OK: 유적 216개 프롬프트 · 16칸 · 9820ms")
