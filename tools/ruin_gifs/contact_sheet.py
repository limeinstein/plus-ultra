#!/usr/bin/env python3
"""Create paged QA sheets for the generated four-view reconstruction sources."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


HERE = Path(__file__).resolve().parent
SRC, OUT = HERE / "reconstructions", HERE / "qa"
COLS, ROWS, CW, CH = 4, 3, 300, 326


def font():
    for p in (Path("C:/Windows/Fonts/arial.ttf"), Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")):
        if p.exists():
            return ImageFont.truetype(str(p), 14)
    return ImageFont.load_default()


def main() -> None:
    files, fnt = sorted(SRC.glob("*.png")), font()
    OUT.mkdir(parents=True, exist_ok=True)
    page_size = COLS * ROWS
    for page in range((len(files) + page_size - 1) // page_size):
        canvas = Image.new("RGB", (COLS * CW, ROWS * CH), "#e8ddc5")
        draw = ImageDraw.Draw(canvas)
        for j, path in enumerate(files[page*page_size:(page+1)*page_size]):
            x, y = (j % COLS) * CW, (j // COLS) * CH
            im = Image.open(path).convert("RGB")
            canvas.paste(ImageOps.fit(im, (CW, CH - 24), Image.Resampling.LANCZOS), (x, y))
            draw.rectangle((x, y + CH - 24, x + CW, y + CH), fill="#f5ecd7")
            draw.text((x + 6, y + CH - 20), path.stem, font=fnt, fill="#392f27")
        dst = OUT / f"reconstruction-sheet-{page+1}.jpg"
        canvas.save(dst, quality=88, optimize=True)
        print(dst)


if __name__ == "__main__":
    main()
