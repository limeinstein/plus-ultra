"""아프리카 부족 마을에 추가한 건물 외형 14종을 한 장으로 모아 본다."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "art" / "africa-tribal-exteriors-preview.png"
KINDS = ["home", "church", "harbor", "library", "mansion", "palace", "shipyard"]
LABELS = {
    "home": "HOME",
    "church": "SHRINE / PRAYER",
    "harbor": "RIVER LANDING",
    "library": "LORE / STUDY",
    "mansion": "LEADER RESIDENCE",
    "palace": "ROYAL PAVILION",
    "shipyard": "CANOE YARD",
}


def font(size: int):
    for path in (Path("C:/Windows/Fonts/malgunbd.ttf"), Path("C:/Windows/Fonts/arialbd.ttf")):
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def main():
    cell_w, cell_h, pad = 390, 270, 16
    sheet = Image.new("RGB", (cell_w * len(KINDS), cell_h * 2 + 54), "#171310")
    draw = ImageDraw.Draw(sheet)
    title_font, label_font, set_font = font(26), font(16), font(22)
    draw.text((18, 10), "AFRICAN TRIBAL EXTERIORS - NEW 14 ASSETS", fill="#ead6ad", font=title_font)
    for row, bundle in enumerate(("kraal", "tent")):
        top = 54 + row * cell_h
        for col, kind in enumerate(KINDS):
            left = col * cell_w
            draw.rounded_rectangle((left + 6, top + 6, left + cell_w - 6, top + cell_h - 6), 12,
                                   fill="#29221c", outline="#65513c", width=2)
            image = Image.open(ROOT / "images" / "exterior-styles" / bundle / f"{kind}.webp").convert("RGBA")
            image = ImageOps.contain(image, (cell_w - pad * 2, cell_h - 66), Image.Resampling.LANCZOS)
            x = left + (cell_w - image.width) // 2
            y = top + 14 + (cell_h - 66 - image.height) // 2
            sheet.paste(image, (x, y), image)
            draw.text((left + 16, top + cell_h - 45), LABELS[kind], fill="#e9dcc8", font=label_font)
            if col == 0:
                draw.text((left + 16, top + 14), bundle.upper(), fill="#d99b55", font=set_font)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT, optimize=True)
    print(OUT)


if __name__ == "__main__":
    main()
