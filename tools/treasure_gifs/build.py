#!/usr/bin/env python3
"""보물 4×2 회전 원화 → 암흑 속 박물관 조명·2회전 GIF와 마지막 장면.

각 원화는 같은 보물을 45도 간격으로 본 여덟 시점을 담는다. 빌더는 앞모습에서
시작해 0→315→0도를 정확히 두 번 지나고, 이동하는 큐레이터 스포트라이트와
별빛·프리즘 회절광을 더한 576×256 GIF를 만든다.
"""
from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[2]
SOURCES = ROOT / "tools" / "treasure_gifs" / "sources"
OUT = ROOT / "images" / "discoveries"
ENDS = ROOT / "images" / "discovery-ends"
W, H = 576, 256
TREASURE_IDS = [
    "beowulf", "kingjohn", "agamemnon", "tutankh", "rosetta", "sargon",
    "urcrown", "goldplate", "ewer", "shiva", "goldelephant", "jadesuit",
    "bronze", "cloisonne", "seismo", "glassbowl", "goldseal",
    "crystalskull", "eldorado", "jademask", "grail", "stcrown",
    "reliquary", "ifehead",
    # 2026-10-02에 더한 보물 — 원화(sources/ID.png)가 생기면 만들어진다 (PROMPTS.md)
    "sillacrown", "cheonmado", "baekjecenser", "hanseal", "guanyublade",
    "libai", "kohinoor", "genghis", "holylance",
    # 2026-10-02 두 번째로 더한 53종 — 원화는 tools/procedural_art(절차적 3D)로 만들었다 (Codex 원화가 오면 바꿔 끼운다)
    "goryeoceladon", "tangsancai", "qinghua", "ruware", "moonjar", "iznikware", "lustreware",
    "aritaware", "rakubowl", "tsukumonasu", "blackprince", "ironcrown", "wenceslas", "paladoro",
    "timurruby", "peacockthrone", "mogokruby", "lankasapphire", "muzoemerald", "peregrina",
    "nefertiti", "hammurabi", "venusmilo", "nike", "laocoon", "ajanta", "qingming", "lanting",
    "tripitaka", "hunmin", "benin", "moctezuma", "sunstone", "incadisc", "mayacodex", "monalisa",
    "creation", "lastsupper", "birthvenus", "david", "ghentaltar", "durer", "earthlydelights",
    "urbinovenus", "babeltower", "orgaz", "ambassadors", "saliera", "belemmonstrance",
    "nanbanscreen", "baburnama", "shahnameh", "pirireis",
    "flordelamar",   # 바다 발견물(seadisc.js)의 난파선 보물
]

# 도입 2장 + (앞·45°…315°·앞) × 2 + 정면 피날레 4장.
VIEW_SEQUENCE = [0, 0] + list(range(8)) + [0] + list(range(8)) + [0] + [0, 0, 0, 0]
DURATIONS = [400, 400] + [300] * 18 + [300, 400, 500, 1000]
assert len(VIEW_SEQUENCE) == 24 and sum(DURATIONS) == 8400

COOL_IDS = {"crystalskull", "glassbowl", "jademask", "jadesuit", "cloisonne",
            "goryeoceladon", "qinghua", "ruware", "moonjar", "lankasapphire", "muzoemerald", "peregrina", "kohinoor", "hanseal"}


def split_turntable(src: Image.Image) -> list[Image.Image]:
    """생성 도구의 크기 반올림까지 받아들이며 4×2 판을 여덟 칸으로 나눈다."""
    sw, sh = src.size
    xs = [round(i * sw / 4) for i in range(5)]
    ys = [round(i * sh / 2) for i in range(3)]
    return [src.crop((xs[x], ys[y], xs[x + 1], ys[y + 1])).convert("RGB")
            for y in range(2) for x in range(4)]


def foreground_box(panel: Image.Image) -> tuple[int, int, int, int]:
    """거의 검은 스튜디오 배경을 제외한 보물의 대략적인 경계."""
    # 밝기 자체가 아니라 경계를 찾으면 부드러운 스포트라이트·바닥 반사는 빠지고,
    # 검은 로제타석처럼 어두운 보물의 윤곽과 세공도 남는다.
    edge = ImageOps.grayscale(panel).filter(ImageFilter.FIND_EDGES)
    edge = ImageOps.autocontrast(edge, cutoff=1)
    mask = edge.point(lambda v: 255 if v >= 35 else 0)
    border = min(5, panel.width // 10, panel.height // 10)
    mask.paste(0, (0, 0, panel.width, border))
    mask.paste(0, (0, panel.height - border, panel.width, panel.height))
    mask.paste(0, (0, 0, border, panel.height))
    mask.paste(0, (panel.width - border, 0, panel.width, panel.height))
    box = mask.getbbox()
    return box or (0, 0, panel.width, panel.height)


def common_crop(panels: list[Image.Image]) -> tuple[int, int, int, int]:
    """회전 중 크기와 중심이 흔들리지 않도록 모든 시점에 같은 크롭을 쓴다."""
    boxes = [foreground_box(p) for p in panels]
    x0 = min(b[0] for b in boxes)
    y0 = min(b[1] for b in boxes)
    x1 = max(b[2] for b in boxes)
    y1 = max(b[3] for b in boxes)
    pad_x = round((x1 - x0) * .045)
    pad_y = round((y1 - y0) * .035)
    return (max(0, x0 - pad_x), max(0, y0 - pad_y),
            min(panels[0].width, x1 + pad_x), min(panels[0].height, y1 + pad_y))


def prepared_views(src: Image.Image) -> list[Image.Image]:
    panels = split_turntable(src)
    box = common_crop(panels)
    views = []
    for panel in panels:
        crop = panel.crop(box)
        scale = min(390 / crop.width, 238 / crop.height)
        size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
        views.append(crop.resize(size, Image.Resampling.LANCZOS))
    return views


def radial_layer(size: tuple[int, int], center: tuple[float, float], radius: float,
                 color: tuple[int, int, int], strength: float = 1.0) -> Image.Image:
    """스크린 합성용 부드러운 광원."""
    w, h = size
    small = Image.new("RGB", (max(1, w // 3), max(1, h // 3)), (0, 0, 0))
    px = small.load()
    cx, cy = center[0] / 3, center[1] / 3
    rr = max(1.0, radius / 3)
    for y in range(small.height):
        for x in range(small.width):
            d = math.hypot((x - cx) * .82, y - cy) / rr
            a = max(0.0, 1.0 - d)
            a = a * a * strength
            px[x, y] = tuple(min(255, round(c * a)) for c in color)
    return small.resize(size, Image.Resampling.BILINEAR)


def gallery(phase: float, light: float) -> Image.Image:
    """암흑의 전시실, 이동하는 상부 스포트라이트, 받침대 위 반사광."""
    base = Image.new("RGB", (W, H), (1, 2, 6))
    halo = radial_layer((W, H), (W * .5, H * .48), 238,
                        (30, 24, 18), .46 + light * .36)
    base = ImageChops.screen(base, halo)

    cone = Image.new("L", (W, H), 0)
    top_x = W * (.43 + .16 * math.sin(phase * math.tau))
    floor_x = W * (.50 + .07 * math.sin(phase * math.tau + .8))
    d = ImageDraw.Draw(cone)
    d.polygon([(top_x - 12, -16), (top_x + 12, -16),
               (floor_x + 150, H + 20), (floor_x - 150, H + 20)],
              fill=round(90 + 90 * light))
    cone = cone.filter(ImageFilter.GaussianBlur(38))
    warm = Image.new("RGB", (W, H), (78, 55, 26))
    base = ImageChops.screen(base, Image.composite(warm, Image.new("RGB", (W, H)), cone))

    floor = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fd = ImageDraw.Draw(floor)
    fd.ellipse((W * .24, H * .77, W * .76, H * 1.08),
               fill=(255, 190, 90, round(38 + 36 * light)))
    floor = floor.filter(ImageFilter.GaussianBlur(28))
    base = Image.alpha_composite(base.convert("RGBA"), floor).convert("RGB")
    return base


def screen_paste(base: Image.Image, art: Image.Image, x: int, y: int) -> Image.Image:
    """검은 스튜디오 배경은 사라지고 보물과 원화 조명만 남도록 합성한다."""
    layer = Image.new("RGB", base.size, (0, 0, 0))
    layer.paste(art, (x, y))
    return ImageChops.screen(base, layer)


def star(draw: ImageDraw.ImageDraw, x: float, y: float, radius: float,
         color: tuple[int, int, int, int]) -> None:
    """박물관 조명이 보석 모서리에 닿는 네 갈래 별빛."""
    r = radius
    draw.polygon([(x, y - r), (x + r * .12, y - r * .14), (x + r, y),
                  (x + r * .12, y + r * .14), (x, y + r),
                  (x - r * .12, y + r * .14), (x - r, y),
                  (x - r * .12, y - r * .14)], fill=color)
    draw.ellipse((x - r * .14, y - r * .14, x + r * .14, y + r * .14),
                 fill=(255, 255, 244, min(255, color[3] + 45)))


def flare_layer(did: str, phase: float, light: float, art_box: tuple[int, int, int, int]) -> Image.Image:
    """다이아몬드 회절광처럼 무지개 광선·별빛·작은 빛가루를 더한다."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x0, y0, x1, y1 = art_box
    aw, ah = x1 - x0, y1 - y0
    x = x0 + aw * (.52 + .29 * math.sin(phase * math.tau + .3))
    y = y0 + ah * (.27 + .18 * math.cos(phase * math.tau * 1.7))
    power = .38 + .62 * light

    # 유리·수정·옥은 청백색, 금속은 따뜻한 금빛을 중심으로 한다.
    core = (200, 238, 255, round(210 * power)) if did in COOL_IDS else (255, 229, 166, round(205 * power))
    star(d, x, y, 9 + 12 * power, core)
    star(d, x0 + aw * .30, y0 + ah * .62, 3 + 5 * power,
         (255, 248, 220, round(130 * power)))

    # 좁은 무지개 부채: 보석에 백색광을 쏘았을 때 갈라지는 회절광.
    spectral = [(255, 70, 90, 42), (255, 180, 60, 48), (90, 255, 205, 42),
                (80, 165, 255, 52), (188, 100, 255, 42)]
    for i, color in enumerate(spectral):
        off = (i - 2) * 4.2
        d.polygon([(x, y), (x + 138, y + off - 2), (x + 170, y + off + 4)],
                  fill=(color[0], color[1], color[2], round(color[3] * power)))

    for i in range(13):
        a = phase * math.tau + i * 2.39996
        rr = 34 + (i % 5) * 19
        px = W * .5 + math.cos(a) * rr * 1.65
        py = H * .48 + math.sin(a * 1.21) * rr * .52
        rad = 1 + (i % 3)
        d.ellipse((px - rad, py - rad, px + rad, py + rad),
                  fill=(255, 224 + i % 2 * 22, 165 + i % 3 * 28, round((38 + i % 4 * 13) * power)))

    bloom = layer.filter(ImageFilter.GaussianBlur(7))
    return Image.alpha_composite(bloom, layer)


def vignette(im: Image.Image) -> Image.Image:
    mask = Image.new("L", (W, H), 255)
    d = ImageDraw.Draw(mask)
    d.ellipse((-70, -92, W + 70, H + 112), fill=0)
    mask = mask.filter(ImageFilter.GaussianBlur(54))
    shade = Image.new("RGB", (W, H), (0, 0, 3))
    return Image.composite(shade, im, mask)


def render(did: str, view: Image.Image, frame_index: int) -> Image.Image:
    phase = frame_index / (len(VIEW_SEQUENCE) - 1)
    if frame_index < 2:
        light = .35 + frame_index * .25
    elif frame_index >= 20:
        light = min(1.0, .72 + (frame_index - 20) * .095)
    else:
        light = .72 + .18 * (math.sin(phase * math.tau * 2 - .8) + 1) / 2

    frame = gallery(phase, light)
    art = ImageEnhance.Color(view).enhance(1.04)
    art = ImageEnhance.Contrast(art).enhance(1.08)
    art = ImageEnhance.Brightness(art).enhance(.83 + .24 * light)
    x = round((W - art.width) / 2)
    y = round(H * .50 - art.height * .49)
    frame = screen_paste(frame, art, x, y)

    flare = flare_layer(did, phase, light, (x, y, x + art.width, y + art.height))
    frame = Image.alpha_composite(frame.convert("RGBA"), flare).convert("RGB")
    frame = vignette(frame)
    return ImageEnhance.Contrast(frame).enhance(1.035)


def animation(did: str, src: Image.Image) -> list[Image.Image]:
    views = prepared_views(src)
    return [render(did, views[view_no], i) for i, view_no in enumerate(VIEW_SEQUENCE)]


def shared_palette(frames: list[Image.Image]) -> Image.Image:
    sample = Image.new("RGB", (W * 4, H * 2))
    picks = [round(i * (len(frames) - 1) / 7) for i in range(8)]
    for i, fi in enumerate(picks):
        sample.paste(frames[fi], ((i % 4) * W, (i // 4) * H))
    return sample.convert("P", palette=Image.Palette.ADAPTIVE, colors=96)


def build_one(did: str) -> Path:
    source = SOURCES / f"{did}.png"
    with Image.open(source) as raw:
        src = raw.convert("RGB")
    frames = animation(did, src)
    palette = shared_palette(frames)
    pal = [f.quantize(palette=palette, dither=Image.Dither.FLOYDSTEINBERG) for f in frames]

    OUT.mkdir(parents=True, exist_ok=True)
    dst = OUT / f"{did}.gif"
    pal[0].save(dst, save_all=True, append_images=pal[1:], duration=DURATIONS,
                loop=0, disposal=1, optimize=True)

    ENDS.mkdir(parents=True, exist_ok=True)
    frames[-1].save(ENDS / f"{did}.jpg", "JPEG", quality=93, optimize=True)
    return dst


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="쉼표로 구분한 보물 발견물 ID")
    args = ap.parse_args()
    wanted = set(args.only.split(",")) if args.only else None
    ids = [did for did in TREASURE_IDS if wanted is None or did in wanted]
    unknown = sorted((wanted or set()) - set(TREASURE_IDS))
    if unknown:
        raise SystemExit("unknown treasure discovery ids: " + ", ".join(unknown))
    missing = [did for did in ids if not (SOURCES / f"{did}.png").exists()]
    if missing and wanted is None:   # 전체를 만들 때는 원화가 아직 없는 보물을 건너뛴다
        print("원화가 아직 없어 건너뜀: " + ", ".join(missing))
        ids = [did for did in ids if did not in missing]
        missing = []
    if missing:
        raise SystemExit("missing treasure turntable sources: " + ", ".join(missing))
    for n, did in enumerate(ids, 1):
        dst = build_one(did)
        print(f"[{n:02d}/{len(ids):02d}] {did:<13} {dst.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
