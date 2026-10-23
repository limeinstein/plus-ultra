from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]


PORTRAITS = {
    "images/portraits/legendary/tam.webp": ((448, 448), True),
    "images/portraits/legendary/tam_half.webp": ((1024, 1536), True),
    "images/portraits/legendary/maria.webp": ((448, 448), True),
    "images/portraits/legendary/maria_half.webp": ((1024, 1536), True),
    "images/portraits/history/tam_stepmother.webp": ((448, 448), True),
    "images/portraits/history/tam_stepmother_half.webp": ((1024, 1536), True),
    "images/portraits/history/tam_cam.webp": ((448, 448), True),
    "images/portraits/history/tam_cam_half.webp": ((1024, 1536), True),
}

EVENTS = (
    "images/legend-events/tam_shore.webp",
    "images/legend-events/tam_clothes.webp",
    "images/legend-events/maria_crocodile.webp",
    "images/legend-events/maria_pearl.webp",
)


def check() -> None:
    manifest = (ROOT / "images/manifest.js").read_text(encoding="utf-8")
    for relative, (size, needs_alpha) in PORTRAITS.items():
        path = ROOT / relative
        with Image.open(path) as image:
            assert image.size == size, (relative, image.size)
            assert ("A" in image.getbands()) is needs_alpha, (relative, image.mode)
            if needs_alpha:
                assert image.getchannel("A").getextrema()[0] < 250, relative
        assert relative.removeprefix("images/") in manifest, relative

    for relative in EVENTS:
        path = ROOT / relative
        with Image.open(path) as image:
            assert image.size == (1881, 836), (relative, image.size)
            assert image.mode == "RGB", (relative, image.mode)
        assert relative.removeprefix("images/") in manifest, relative


if __name__ == "__main__":
    check()
    print("sea maidens art: OK")
