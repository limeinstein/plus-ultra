#!/usr/bin/env python3
"""ImageGen 원본 5장을 이야기 인물의 얼굴·무릎상 파일로 정리한다."""
from pathlib import Path
import sys
from PIL import Image, ImageDraw, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "tmp" / "story-portraits"
TARGETS = {
    "story_mother": ROOT / "images" / "portraits" / "npc",
    "story_father": ROOT / "images" / "portraits" / "npc",
    "anselmo": ROOT / "images" / "portraits" / "mates",
    "estevao": ROOT / "images" / "portraits" / "mates",
    "pt_casanova": ROOT / "images" / "portraits" / "sponsors",
}


def main() -> None:
    for name, target in TARGETS.items():
        with Image.open(SOURCE / f"{name}.png") as raw:
            half = raw.convert("RGBA")
        if half.size != (1024, 1536):
            half = half.resize((1024, 1536), Image.Resampling.LANCZOS)
        face = half.crop((0, 0, 1024, 1024))
        target.mkdir(parents=True, exist_ok=True)
        face.save(target / f"{name}.webp", "WEBP", quality=94, method=6, exact=True)
        half.save(target / f"{name}_half.webp", "WEBP", quality=94, method=6, exact=True)
        print(f"{name}: 얼굴 1024×1024 · 무릎상 1024×1536")
    preview = Image.new("RGB", (2000, 680), (28, 22, 18))
    draw = ImageDraw.Draw(preview)
    for index, (name, target) in enumerate(TARGETS.items()):
        with Image.open(target / f"{name}_half.webp") as raw:
            card = ImageOps.contain(raw.convert("RGBA"), (360, 580), Image.Resampling.LANCZOS)
        x = index * 400 + (400 - card.width) // 2
        preview.paste(card, (x, 45), card)
        draw.text((index * 400 + 16, 638), name, fill=(232, 218, 181))
    preview_path = ROOT / "docs" / "art" / "story-portraits-preview.jpg"
    preview.save(preview_path, "JPEG", quality=91, optimize=True)
    print(preview_path)


if __name__ == "__main__":
    main()
