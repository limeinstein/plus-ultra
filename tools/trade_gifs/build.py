#!/usr/bin/env python3
"""교역품 발견 장면 프레임(tools/procedural_art 로 찍은 24장) → 576×256 GIF와 마지막 장면.

    python tools/trade_gifs/build.py                 # frames/ 안의 모든 교역품
    python tools/trade_gifs/build.py --only t_pepper,t_tea
    python tools/trade_gifs/build.py --frames 다른/폴더

프레임은 tools/trade_gifs/frames/ID/00.png ~ 23.png (node tools/procedural_art/run_trade.js 가 만든다).
보물 GIF와 같은 8.4초 길이로, 등불 켜진 시장 좌판에 카메라가 천천히 다가간다.
"""
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[2]
FRAMES = ROOT / "tools" / "trade_gifs" / "frames"
SOURCES = ROOT / "tools" / "trade_gifs" / "sources"
OUT = ROOT / "images" / "discoveries"
ENDS = ROOT / "images" / "discovery-ends"
W, H = 576, 256
DURATIONS = [400, 400] + [300] * 18 + [300, 400, 500, 1000]
assert sum(DURATIONS) == 8400


def vignette(im: Image.Image) -> Image.Image:
    mask = Image.new("L", (W, H), 255)
    ImageDraw.Draw(mask).ellipse((-80, -70, W + 80, H + 90), fill=0)
    mask = mask.filter(ImageFilter.GaussianBlur(48))
    return Image.composite(Image.new("RGB", (W, H), (6, 3, 1)), im, mask)


def grade(im: Image.Image, k: float) -> Image.Image:
    im = ImageEnhance.Contrast(im).enhance(1.05)
    im = ImageEnhance.Brightness(im).enhance(0.9 + 0.12 * k)
    glow = im.filter(ImageFilter.GaussianBlur(10))
    im = ImageChops.screen(im, ImageEnhance.Brightness(glow).enhance(0.18))
    return vignette(im)


def fit_story_panel(panel: Image.Image) -> Image.Image:
    """정사각형에 가까운 ImageGen 칸을 피사체를 자르지 않고 9:4 화면에 넣는다."""
    # 전체 그림을 유지하되, 남는 양옆은 같은 장면을 어둡게 늘여서 세로 카드처럼
    # 보이지 않게 한다. 중앙 원화와 배경 사이는 부드럽게 섞는다.
    backdrop = ImageOps.fit(panel, (W, H), Image.Resampling.LANCZOS)
    backdrop = backdrop.filter(ImageFilter.GaussianBlur(18))
    backdrop = ImageEnhance.Brightness(backdrop).enhance(.58)
    foreground = ImageOps.contain(panel, (W, H), Image.Resampling.LANCZOS)
    x0 = (W - foreground.width) // 2
    y0 = (H - foreground.height) // 2
    mask = Image.new("L", foreground.size, 255)
    fade = min(28, foreground.width // 5)
    px = mask.load()
    for x in range(fade):
        value = round(255 * (x + 1) / (fade + 1))
        for y in range(foreground.height):
            px[x, y] = value
            px[foreground.width - 1 - x, y] = value
    backdrop.paste(foreground, (x0, y0), mask)
    return backdrop


def storyboard_frames(path: Path) -> list[Image.Image]:
    """4x2 고해상도 원화를 24개의 부드러운 접근 장면으로 바꾼다."""
    with Image.open(path) as image:
        src = image.convert("RGB")
    xs = [round(i * src.width / 4) for i in range(5)]
    ys = [round(i * src.height / 2) for i in range(3)]
    views = []
    for row in range(2):
        for col in range(4):
            # 생성 시 생길 수 있는 1~2px짜리 칸 경계는 버린다.
            box = (xs[col] + 2, ys[row] + 2, xs[col + 1] - 2, ys[row + 1] - 2)
            views.append(fit_story_panel(src.crop(box)))
    frames = []
    for index in range(len(DURATIONS)):
        # 장면 사이를 직접 섞으면 잔·저울·자루가 이중으로 보인다. 각 원화를 세 장씩
        # 아주 조금 확대해 GIF 자체는 또렷하게 유지하고, 게임의 장면판 재생기가
        # 장면 전환만 부드럽게 이어 주도록 한다.
        view = views[min(len(views) - 1, index // 3)]
        scale = 1.0 + (index % 3) * .009
        size = (round(W * scale), round(H * scale))
        enlarged = view.resize(size, Image.Resampling.LANCZOS)
        x0 = (size[0] - W) // 2
        y0 = (size[1] - H) // 2
        frames.append(enlarged.crop((x0, y0, x0 + W, y0 + H)))
    return frames


def build_one(tid: str, src: Path) -> Path:
    source = SOURCES / f"{tid}.png"
    n = len(DURATIONS)
    if source.exists():
        raw = storyboard_frames(source)
    else:
        files = sorted((src / tid).glob("*.png"))
        if len(files) < 2:
            raise SystemExit(f"{tid}: 프레임이 없습니다 ({src / tid})")
        rendered = [Image.open(f).convert("RGB").resize((W, H), Image.Resampling.LANCZOS) for f in files]
        pick = [round(i * (len(rendered) - 1) / (n - 1)) for i in range(n)]
        raw = [rendered[p] for p in pick]
    frames = [grade(frame, i / (n - 1)) for i, frame in enumerate(raw)]
    sample = Image.new("RGB", (W * 4, H * 2))
    for i in range(8):
        sample.paste(frames[round(i * (n - 1) / 7)], ((i % 4) * W, (i // 4) * H))
    palette = sample.convert("P", palette=Image.Palette.ADAPTIVE, colors=128)
    pal = [f.quantize(palette=palette, dither=Image.Dither.FLOYDSTEINBERG) for f in frames]
    OUT.mkdir(parents=True, exist_ok=True)
    dst = OUT / f"{tid}.gif"
    pal[0].save(dst, save_all=True, append_images=pal[1:], duration=DURATIONS, loop=0, disposal=1, optimize=True)
    ENDS.mkdir(parents=True, exist_ok=True)
    frames[-1].save(ENDS / f"{tid}.jpg", "JPEG", quality=93, optimize=True)
    return dst


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only")
    ap.add_argument("--frames", default=str(FRAMES))
    a = ap.parse_args()
    src = Path(a.frames)
    if a.only:
        ids = a.only.split(",")
    else:
        ids = sorted({p.name for p in src.iterdir() if p.is_dir()} |
                     {p.stem for p in SOURCES.glob("*.png")})
    for i, tid in enumerate(ids, 1):
        d = build_one(tid, src)
        print(f"[{i:02d}/{len(ids):02d}] {tid:<12} {d.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
