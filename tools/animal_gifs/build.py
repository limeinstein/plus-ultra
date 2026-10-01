#!/usr/bin/env python3
"""동물 발견 2×2 원화 → 새끼 등장·성체 보호 GIF와 마지막 장면.

원화 한 장에는 같은 장소의 네 장면이 2×2로 들어 있다.
  1. 새끼의 코·부리 끝만 보임
  2. 얼굴을 내밀며 고개를 갸웃함
  3. 가까이 다가와 애교를 부림
  4. 뒤에서 성체가 나타나 새끼를 보호함

장면 사이에는 확대·이동과 부드러운 겹침을 넣는다. 최종 GIF는 다른 발견
애니메이션과 같은 576×256(9:4)이며, tools/ruin_gifs/sheets.py가 게임용
장면 판(images/discovery-sheets/ID.webp)으로 바꾼다.
"""
from __future__ import annotations

import argparse
import math
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[2]
SOURCES = ROOT / "tools" / "animal_gifs" / "sources"
OUT = ROOT / "images" / "discoveries"
ENDS = ROOT / "images" / "discovery-ends"
W, H = 576, 256
FRAME_COUNT = 18
DURATION = 400

# 원래 발견물에 있던 동물과 js/data/animals.js에 새로 더한 동물을 함께 만든다.
# 새 동물이 더 생기면 animals.js의 a('ID', ...) 선언만으로 빌더에도 자동 반영된다.
BASE_ANIMAL_IDS = [
    "tarantula", "llama", "prairiedog", "moose", "frigatebird", "tortoise",
    "albatross", "kangaroo", "paradise", "sable", "tiger", "panda",
    "porcupine", "coelacanth", "warthog", "komodo", "penguin", "mandrill",
    "ostrich", "flamingo", "hippo", "crocodile", "polarbear",
]
ANIMALS_DATA = ROOT / "js" / "data" / "animals.js"
ADDED_ANIMAL_IDS = re.findall(
    r"^\s*a\('([^']+)'", ANIMALS_DATA.read_text(encoding="utf-8"), re.M
)
ANIMAL_IDS = BASE_ANIMAL_IDS + [did for did in ADDED_ANIMAL_IDS if did not in BASE_ANIMAL_IDS]


def ease(u: float) -> float:
    """양끝이 부드러운 보간."""
    u = max(0.0, min(1.0, u))
    return u * u * (3.0 - 2.0 * u)


def split_storyboard(src: Image.Image) -> list[Image.Image]:
    """얇은 흰 칸막이를 버리고 2×2 원화를 네 장으로 나눈다."""
    sw, sh = src.size
    mx, my = sw // 2, sh // 2
    gap = max(3, round(min(sw, sh) * .004))
    boxes = [
        (0, 0, mx - gap, my - gap),
        (mx + gap, 0, sw, my - gap),
        (0, my + gap, mx - gap, sh),
        (mx + gap, my + gap, sw, sh),
    ]
    panels = []
    for i, box in enumerate(boxes):
        # 마지막 칸은 뒤에 선 성체의 얼굴·뿔·날개가 위쪽에서 잘리지 않게
        # 화면을 위에 붙인다. 앞의 세 칸은 새끼 얼굴을 가운데 둔다.
        cy = .12 if i == 3 else .46
        panels.append(ImageOps.fit(src.crop(box), (W, H), Image.Resampling.LANCZOS,
                                   centering=(.5, cy)).convert("RGB"))
    return panels


def zoom(im: Image.Image, amount: float, dx: float = 0.0, dy: float = 0.0) -> Image.Image:
    """화면을 빈틈없이 채운 채 중심을 아주 조금 확대·이동한다."""
    amount = max(1.0, amount)
    cw, ch = max(1, round(W / amount)), max(1, round(H / amount))
    cx = W * (.5 + dx)
    cy = H * (.5 + dy)
    x0 = max(0, min(W - cw, round(cx - cw / 2)))
    y0 = max(0, min(H - ch, round(cy - ch / 2)))
    return im.crop((x0, y0, x0 + cw, y0 + ch)).resize((W, H), Image.Resampling.LANCZOS)


def vignette_mask() -> Image.Image:
    """숲속을 엿보는 듯 가장자리만 은은하게 어둡게 하는 마스크."""
    open_area = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(open_area)
    d.ellipse((-W * .08, -H * .38, W * 1.08, H * 1.34), fill=255)
    open_area = open_area.filter(ImageFilter.GaussianBlur(42))
    edge = ImageOps.invert(open_area)
    return edge.point(lambda x: round(x * .55))


VIGNETTE = vignette_mask()


# 시간, 원화 칸, 확대. 같은 칸이 연달아 나오면 잠시 머물며 확대하고,
# 다른 칸으로 넘어갈 때만 겹쳐 그린다. 마지막은 살짝 멀어져 성체까지 보여 준다.
STATES = [
    (0.00, 0, 1.00, .40),
    (0.13, 0, 1.045, .06),
    (0.32, 1, 1.035, .00),
    (0.43, 1, 1.075, .00),
    (0.62, 2, 1.085, .00),
    (0.70, 2, 1.12, .00),
    (0.90, 3, 1.035, .00),
    (1.00, 3, 1.00, .00),
]


def frame_at(panels: list[Image.Image], p: float) -> Image.Image:
    a, b = STATES[0], STATES[-1]
    for left, right in zip(STATES, STATES[1:]):
        if left[0] <= p <= right[0]:
            a, b = left, right
            break
    span = max(.0001, b[0] - a[0])
    u = ease((p - a[0]) / span)
    z = a[2] * (1 - u) + b[2] * u
    # 새끼가 숨을 쉬고 고개를 내미는 듯한 아주 작은 상하 움직임.
    bob = math.sin(p * math.pi * 5) * .004
    fa = zoom(panels[a[1]], z, dy=bob)
    if a[1] == b[1]:
        out = fa
    else:
        fb = zoom(panels[b[1]], z, dy=bob)
        out = Image.blend(fa, fb, u)

    dark = a[3] * (1 - u) + b[3] * u
    if dark > .001:
        out = ImageEnhance.Brightness(out).enhance(1 - dark)
    out = Image.composite(Image.new("RGB", (W, H), (5, 7, 8)), out, VIGNETTE)
    return out


def animation(src: Image.Image) -> list[Image.Image]:
    panels = split_storyboard(src)
    return [frame_at(panels, i / (FRAME_COUNT - 1)) for i in range(FRAME_COUNT)]


def shared_palette(frames: list[Image.Image]) -> Image.Image:
    sample = Image.new("RGB", (W * 4, H * 2))
    picks = [round(i * (len(frames) - 1) / 7) for i in range(8)]
    for i, fi in enumerate(picks):
        sample.paste(frames[fi], ((i % 4) * W, (i // 4) * H))
    # GIF는 장면 판의 원본·구형 대체재다. 80색이면 밤 장면의 털·비늘 질감을
    # 지키면서도 117종 전체의 내려받기 크기를 지나치게 키우지 않는다.
    return sample.convert("P", palette=Image.Palette.ADAPTIVE, colors=80)


def build_one(did: str) -> Path:
    source = SOURCES / f"{did}.png"
    with Image.open(source) as raw:
        src = raw.convert("RGB")
    frames = animation(src)
    palette = shared_palette(frames)
    pal = [f.quantize(palette=palette, dither=Image.Dither.FLOYDSTEINBERG) for f in frames]

    OUT.mkdir(parents=True, exist_ok=True)
    dst = OUT / f"{did}.gif"
    pal[0].save(dst, save_all=True, append_images=pal[1:], duration=[DURATION] * FRAME_COUNT,
                loop=0, disposal=1, optimize=True)

    ENDS.mkdir(parents=True, exist_ok=True)
    frames[-1].save(ENDS / f"{did}.jpg", "JPEG", quality=91, optimize=True)
    return dst


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="쉼표로 구분한 동물 발견물 ID")
    args = ap.parse_args()
    wanted = set(args.only.split(",")) if args.only else None
    ids = [did for did in ANIMAL_IDS if wanted is None or did in wanted]
    unknown = sorted((wanted or set()) - set(ANIMAL_IDS))
    if unknown:
        raise SystemExit("unknown animal discovery ids: " + ", ".join(unknown))
    missing = [did for did in ids if not (SOURCES / f"{did}.png").exists()]
    if missing:
        raise SystemExit("missing animal storyboard sources: " + ", ".join(missing))
    for n, did in enumerate(ids, 1):
        dst = build_one(did)
        print(f"[{n:02d}/{len(ids):02d}] {did:<12} {dst.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
