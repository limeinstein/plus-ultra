"""역사 인물 카드 마스터 시트를 같은 크기의 게임용 카드로 나눈다.

기본 입력은 docs/art/historical-poker-face-cards-master.png 이며,
출력은 images/minigames/cards/*.webp (모두 280x392)이다.
"""
from pathlib import Path
import argparse

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "docs" / "art" / "historical-poker-face-cards-master.png"
DEFAULT_OUTPUT = ROOT / "images" / "minigames" / "cards"
CARD_SIZE = (280, 392)

# ImageGen 마스터 시트에서 닫힌 바깥 테두리를 잰 자리(x, y, w, h).
# 각 장을 따로 늘여 같은 5:7 규격으로 맞추므로 원화의 행별 미세한 크기 차이가 게임에 남지 않는다.
BOXES = (
    ((133, 33, 253, 327), (407, 33, 247, 327), (673, 33, 254, 327)),
    ((133, 376, 253, 326), (407, 376, 247, 326), (673, 376, 254, 326)),
    ((133, 718, 253, 311), (407, 718, 247, 311), (673, 718, 254, 311)),
    ((133, 1044, 253, 309), (407, 1044, 247, 309), (673, 1044, 254, 309)),
)
ROWS = ("hearts", "spades", "clubs", "diamonds")
RANKS = ("k", "q", "j")


def card_path(out_dir: Path, suit: str, rank: str) -> Path:
    return out_dir / f"{rank}-{suit}.webp"


def split(source: Path, out_dir: Path) -> list[Path]:
    image = Image.open(source).convert("RGB")
    if image.size != (1060, 1484):
        raise ValueError(f"마스터 시트 크기가 다릅니다: {image.size} (필요: 1060x1484)")
    out_dir.mkdir(parents=True, exist_ok=True)
    made = []
    for row, suit in enumerate(ROWS):
        for col, rank in enumerate(RANKS):
            x, y, w, h = BOXES[row][col]
            card = image.crop((x, y, x + w, y + h))
            card = card.resize(CARD_SIZE, Image.Resampling.LANCZOS)
            path = card_path(out_dir, suit, rank)
            card.save(path, "WEBP", quality=94, method=6)
            made.append(path)
    return made


def check(out_dir: Path) -> list[Path]:
    paths = [card_path(out_dir, suit, rank) for suit in ROWS for rank in RANKS]
    missing = [p for p in paths if not p.is_file()]
    if missing:
        raise FileNotFoundError("없는 카드: " + ", ".join(str(p) for p in missing))
    wrong = []
    for path in paths:
        with Image.open(path) as image:
            if image.size != CARD_SIZE:
                wrong.append(f"{path.name}={image.size}")
    if wrong:
        raise ValueError("카드 크기가 다릅니다: " + ", ".join(wrong))
    return paths


def preview(paths: list[Path], destination: Path) -> None:
    gap, margin = 18, 24
    width = margin * 2 + CARD_SIZE[0] * 3 + gap * 2
    height = margin * 2 + CARD_SIZE[1] * 4 + gap * 3
    sheet = Image.new("RGB", (width, height), "#eee9df")
    draw = ImageDraw.Draw(sheet)
    for i, path in enumerate(paths):
        with Image.open(path) as card:
            x = margin + (i % 3) * (CARD_SIZE[0] + gap)
            y = margin + (i // 3) * (CARD_SIZE[1] + gap)
            sheet.paste(card.convert("RGB"), (x, y))
            draw.rectangle((x - 1, y - 1, x + CARD_SIZE[0], y + CARD_SIZE[1]), outline="#7d6848")
    destination.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(destination, "JPEG", quality=91, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    paths = check(args.out) if args.check else split(args.source, args.out)
    if not args.check:
        preview(paths, ROOT / "docs" / "art" / "historical-poker-face-cards-game-preview.jpg")
    print(f"포커 카드 {len(paths)}장 · 모두 {CARD_SIZE[0]}x{CARD_SIZE[1]} 확인")


if __name__ == "__main__":
    main()
