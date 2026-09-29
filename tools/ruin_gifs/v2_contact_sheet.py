#!/usr/bin/env python3
"""Create enlarged QA pages for the sixteen-cell V2 master sheets."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


HERE = Path(__file__).resolve().parent
SRC, OUT = HERE / "v2" / "master", HERE / "v2" / "qa"
COLS, ROWS, CW, CH = 3, 2, 440, 464


def font():
    for p in (Path("C:/Windows/Fonts/arial.ttf"), Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")):
        if p.exists():
            return ImageFont.truetype(str(p), 16)
    return ImageFont.load_default()


def main() -> None:
    files, fnt = sorted(SRC.glob("*.png")), font()
    OUT.mkdir(parents=True, exist_ok=True)
    page_size = COLS * ROWS
    for page in range((len(files) + page_size - 1) // page_size):
        canvas = Image.new("RGB", (COLS*CW, ROWS*CH), "#e8ddc5")
        draw = ImageDraw.Draw(canvas)
        for j, path in enumerate(files[page*page_size:(page+1)*page_size]):
            x, y = (j % COLS)*CW, (j // COLS)*CH
            im = Image.open(path).convert("RGB")
            canvas.paste(ImageOps.fit(im, (CW, CH-24), Image.Resampling.LANCZOS), (x, y))
            draw.rectangle((x, y+CH-24, x+CW, y+CH), fill="#f5ecd7")
            draw.text((x+7, y+CH-21), path.stem, font=fnt, fill="#392f27")
        dst = OUT / f"v2-master-sheet-{page+1}.jpg"
        canvas.save(dst, quality=90, optimize=True)
        print(dst)


if __name__ == "__main__":
    main()
