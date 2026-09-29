#!/usr/bin/env python3
"""복원 기준 사진을 한눈에 점검하는 내부용 접촉 시트를 만든다."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

HERE = Path(__file__).resolve().parent
SRC = HERE / "references" / "discoveries"
OUT = HERE / "out"
COLS, ROWS = 4, 4
CW, CH = 360, 190


def font():
    for p in (Path("C:/Windows/Fonts/arial.ttf"), Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")):
        if p.exists():
            return ImageFont.truetype(str(p), 15)
    return ImageFont.load_default()


def main():
    files = sorted(SRC.glob("*.jpg"))
    OUT.mkdir(parents=True, exist_ok=True)
    fnt = font()
    page_size = COLS * ROWS
    for page in range((len(files) + page_size - 1) // page_size):
        canvas = Image.new("RGB", (COLS * CW, ROWS * CH), "#e8ddc5")
        draw = ImageDraw.Draw(canvas)
        for j, path in enumerate(files[page * page_size:(page + 1) * page_size]):
            x, y = (j % COLS) * CW, (j // COLS) * CH
            im = Image.open(path).convert("RGB")
            thumb = ImageOps.fit(im, (CW, CH - 26), method=Image.Resampling.LANCZOS)
            canvas.paste(thumb, (x, y))
            draw.rectangle((x, y + CH - 26, x + CW, y + CH), fill="#f5ecd7")
            draw.text((x + 7, y + CH - 23), path.stem, font=fnt, fill="#392f27")
        out = OUT / f"reference-sheet-{page + 1}.jpg"
        canvas.save(out, quality=88, optimize=True)
        print(out)


if __name__ == "__main__":
    main()
