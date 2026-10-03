#!/usr/bin/env python3
"""지리 발견물의 항해 장면 → 고지도 항로 애니메이션 GIF를 만든다."""
from __future__ import annotations

import argparse
import base64
import math
import random
import re
import zlib
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[2]
WORLD_DATA = ROOT / "js" / "data" / "world_data.js"
DISCOVERIES = ROOT / "js" / "data" / "discoveries.js"
SOURCE = ROOT / "tools" / "geo_gifs" / "sources" / "ship_sighting.png"
SHIP_SHEET = ROOT / "images" / "ships-nav" / "carrack.webp"
OUT = ROOT / "images" / "discoveries"
ENDS = ROOT / "images" / "discovery-ends"

W, H = 576, 256
SCALE = 2
RW, RH = W * SCALE, H * SCALE
CELL = 224

# 경도는 날짜 변경선을 자연스럽게 건너도록 180도 바깥 값도 쓴다.
# 마지막 점은 발견 위치이며, 세계일주만 출발지로 돌아온 점이다.
ROUTES: dict[str, dict] = {
    "capegood": {
        "name": "아프리카 남단",
        "route": [(-9.1, 38.7), (-15.5, 28.2), (-17.5, 14.7), (-10.0, 4.0), (5.0, -5.0),
                  (11.8, -18.0), (15.2, -27.0), (19.5, -34.6)],
        "tone": "storm",
    },
    "westroute": {
        "name": "서회항로",
        "route": [(-5.9, 36.5), (-16.0, 28.2), (-28.0, 25.0), (-43.0, 22.0), (-58.0, 20.0), (-70.0, 18.5)],
        "tone": "atlantic",
    },
    "indiaroute": {
        "name": "인도항로",
        "route": [(-9.1, 38.7), (-17.0, 16.0), (-8.0, -4.0), (12.0, -22.0), (19.5, -34.6),
                  (37.0, -22.0), (44.0, -12.0), (57.0, -4.0), (75.5, 11.2)],
        "tone": "tropic",
    },
    "malacca": {
        "name": "말라카 해협",
        "route": [(75.5, 11.2), (80.0, 7.0), (88.0, 5.0), (96.0, 4.0), (101.3, 2.6)],
        "tone": "tropic",
    },
    "spiceis": {
        "name": "향료제도",
        "route": [(101.3, 2.6), (108.0, -3.0), (116.0, -5.0), (123.0, -2.0), (127.4, .8)],
        "tone": "tropic",
    },
    "china": {
        "name": "중국",
        "route": [(101.3, 2.6), (106.0, 8.0), (110.0, 14.0), (113.0, 19.0), (114.2, 22.4)],
        "tone": "east",
    },
    "zipang": {
        "name": "지팡그",
        "route": [(114.2, 22.4), (119.0, 25.0), (124.0, 29.0), (130.5, 33.0)],
        "tone": "east",
    },
    "newstrait": {
        "name": "신세계 해협",
        "route": [(-5.9, 36.5), (-18.0, 25.0), (-35.0, 8.0), (-48.0, -16.0), (-60.0, -35.0), (-70.6, -53.4)],
        "tone": "cold",
    },
    "circum": {
        "name": "세계일주 항로",
        "route": [(-9.0, 38.7), (-35.0, 8.0), (-70.6, -53.4), (-115.0, -28.0), (-165.0, -12.0),
                  (-205.0, -4.0), (-232.6, .8), (-258.7, 2.6), (-300.0, -18.0), (-340.5, -34.6), (-369.0, 38.7)],
        "tone": "atlantic",
        "global": True,
    },
    "antarctic": {
        "name": "남극대륙",
        "route": [(-70.6, -53.4), (-66.0, -57.5), (-62.0, -61.0), (-60.0, -64.5)],
        "tone": "ice",
    },
    "northstrait": {
        "name": "북쪽 해협",
        "route": [(127.4, .8), (142.0, 19.0), (157.0, 37.0), (170.0, 54.0), (185.0, 63.0), (191.0, 66.0)],
        "tone": "ice",
    },
    "endstrait": {
        "name": "땅끝 해협",
        "route": [(-70.6, -53.4), (-69.0, -56.0), (-66.0, -57.0)],
        "tone": "cold",
    },
    "australia": {
        "name": "남방대륙",
        "route": [(127.4, .8), (128.0, -5.0), (129.0, -9.0), (130.5, -13.0)],
        "tone": "tropic",
    },
}


def ease(u: float) -> float:
    u = max(0.0, min(1.0, u))
    return u * u * (3.0 - 2.0 * u)


def lerp(a: float, b: float, u: float) -> float:
    return a + (b - a) * u


def geo_rows() -> list[tuple[str, str]]:
    src = DISCOVERIES.read_text(encoding="utf-8")
    return re.findall(r"^\s*add\('([^']+)', '([^']+)', 'geo'", src, re.M)


def load_land_mask() -> Image.Image:
    src = WORLD_DATA.read_text(encoding="utf-8")
    m = re.search(r"WORLD_DATA=\{W:(\d+),H:(\d+).*?land:\"([^\"]+)\"", src, re.S)
    if not m:
        raise RuntimeError("world_data.js에서 육지 자료를 찾지 못했습니다")
    width, height = int(m.group(1)), int(m.group(2))
    packed = zlib.decompress(base64.b64decode(m.group(3)))
    # 게임 자료는 한 바이트의 낮은 비트부터 왼쪽→오른쪽 여덟 칸을 담는다.
    lut = tuple(bytes(255 if (b >> i) & 1 else 0 for i in range(8)) for b in range(256))
    raw = b"".join(lut[b] for b in packed)
    if len(raw) != width * height:
        raise RuntimeError(f"육지 자료 크기 불일치: {len(raw)} != {width * height}")
    return Image.frombytes("L", (width, height), raw)


def paper_texture(seed: int, size: tuple[int, int] = (RW, RH)) -> Image.Image:
    rng = random.Random(seed)
    w, h = size
    # 작은 얼룩을 확대해 종이의 완만한 번짐을 만들고, 가는 섬유를 얹는다.
    noise = Image.new("L", (max(8, w // 14), max(8, h // 14)))
    noise.putdata([rng.randrange(84, 174) for _ in range(noise.width * noise.height)])
    noise = noise.resize((w, h), Image.Resampling.BICUBIC).filter(ImageFilter.GaussianBlur(5))
    out = Image.new("RGB", (w, h), (226, 207, 165))
    tint = Image.merge("RGB", (noise.point(lambda x: min(255, x + 70)),
                               noise.point(lambda x: min(255, x + 50)),
                               noise.point(lambda x: min(255, x + 22))))
    out = Image.blend(out, tint, .16)
    d = ImageDraw.Draw(out, "RGBA")
    for _ in range(max(120, w // 3)):
        x = rng.randrange(w); y = rng.randrange(h)
        length = rng.randrange(5, 36)
        d.line((x, y, min(w, x + length), y + rng.choice((-1, 0, 0, 1))), fill=(105, 75, 39, rng.randrange(5, 14)), width=1)
    return out


def map_bounds(route: list[tuple[float, float]], zoom_out: float) -> tuple[float, float, float, float]:
    xs = [p[0] for p in route]
    ys = [p[1] for p in route]
    if max(xs) - min(xs) >= 330:
        span_x = 360.0
    else:
        span_x = max(54.0, max(xs) - min(xs) + 24.0)
    span_y = max(36.0, max(ys) - min(ys) + 18.0)
    span_x = max(span_x, span_y * W / H)
    span_x = min(360.0, span_x * lerp(1.0, 1.30, zoom_out))
    span_y = span_x * H / W
    cx = (min(xs) + max(xs)) / 2
    cy = (min(ys) + max(ys)) / 2
    cy = max(-82 + span_y / 2, min(82 - span_y / 2, cy)) if span_y < 164 else 0
    return cx - span_x / 2, cx + span_x / 2, cy - span_y / 2, cy + span_y / 2


def repeat_world(mask: Image.Image) -> Image.Image:
    out = Image.new("L", (mask.width * 3, mask.height), 0)
    for i in range(3):
        out.paste(mask, (i * mask.width, 0))
    return out


def project(lon: float, lat: float, bounds: tuple[float, float, float, float]) -> tuple[float, float]:
    lon0, lon1, lat0, lat1 = bounds
    return ((lon - lon0) / (lon1 - lon0) * RW, (lat1 - lat) / (lat1 - lat0) * RH)


def render_map(world3: Image.Image, bounds: tuple[float, float, float, float], seed: int) -> Image.Image:
    lon0, lon1, lat0, lat1 = bounds
    sx0 = (lon0 + 540.0) / 1080.0 * world3.width
    sx1 = (lon1 + 540.0) / 1080.0 * world3.width
    sy0 = (90.0 - lat1) / 180.0 * world3.height
    sy1 = (90.0 - lat0) / 180.0 * world3.height
    land = world3.crop((round(sx0), round(sy0), round(sx1), round(sy1))).resize((RW, RH), Image.Resampling.LANCZOS)
    land = land.filter(ImageFilter.GaussianBlur(.45))

    paper = paper_texture(seed)
    sea_wash = Image.new("RGB", (RW, RH), (177, 190, 171))
    base = Image.blend(paper, sea_wash, .16)
    earth = Image.new("RGB", (RW, RH), (190, 157, 102))
    base.paste(Image.blend(paper, earth, .46), mask=land)

    # 잉크 해안선은 두 겹으로 그려 수채 종이에 스민 듯 보이게 한다.
    edge = land.filter(ImageFilter.FIND_EDGES).point(lambda x: 255 if x > 34 else 0)
    soft = edge.filter(ImageFilter.GaussianBlur(2.2))
    ink_soft = Image.new("RGBA", (RW, RH), (73, 48, 26, 0)); ink_soft.putalpha(soft.point(lambda x: x * 55 // 255))
    base = Image.alpha_composite(base.convert("RGBA"), ink_soft)
    ink = Image.new("RGBA", (RW, RH), (64, 41, 20, 0)); ink.putalpha(edge.point(lambda x: x * 150 // 255))
    base = Image.alpha_composite(base, ink)

    d = ImageDraw.Draw(base, "RGBA")
    lon_step = 10 if lon1 - lon0 <= 85 else 20 if lon1 - lon0 <= 190 else 30
    lat_step = 10 if lat1 - lat0 <= 65 else 20
    for lon in range(math.floor(lon0 / lon_step) * lon_step, math.ceil(lon1 / lon_step) * lon_step + 1, lon_step):
        x, _ = project(lon, 0, bounds)
        d.line((x, 0, x, RH), fill=(91, 66, 34, 28), width=1)
    for lat in range(math.floor(lat0 / lat_step) * lat_step, math.ceil(lat1 / lat_step) * lat_step + 1, lat_step):
        _, y = project(lon0, lat, bounds)
        d.line((0, y, RW, y), fill=(91, 66, 34, 28), width=1)

    # 목표점에서 뻗는 흐릿한 방사선은 15~16세기 포르톨란 해도의 분위기만 보탠다.
    cx, cy = project((lon0 + lon1) / 2, (lat0 + lat1) / 2, bounds)
    for a in range(0, 360, 30):
        r = math.radians(a)
        d.line((cx, cy, cx + math.cos(r) * RW, cy + math.sin(r) * RW), fill=(85, 54, 25, 18), width=1)

    shade = Image.new("L", (RW, RH), 0)
    sd = ImageDraw.Draw(shade)
    for n in range(46):
        a = round(78 * (n / 45) ** 2)
        sd.rectangle((n, n, RW - 1 - n, RH - 1 - n), outline=a, width=1)
    vignette = Image.new("RGBA", (RW, RH), (67, 40, 18, 0)); vignette.putalpha(shade)
    return Image.alpha_composite(base, vignette).convert("RGB")


def crop_scene(src: Image.Image, did: str, phase: float) -> Image.Image:
    cfg = ROUTES[did]
    src = ImageOps.fit(src.convert("RGB"), (RW + 90, RH + 40), method=Image.Resampling.LANCZOS)
    seed = sum((i + 1) * ord(c) for i, c in enumerate(did))
    dx = ((seed % 51) - 25) + round(phase * 18)
    dy = ((seed // 11) % 17) - 8
    frame = src.crop((45 + dx, 20 + dy, 45 + dx + RW, 20 + dy + RH))
    tone = cfg["tone"]
    if tone == "storm":
        frame = ImageEnhance.Brightness(frame).enhance(.78)
        frame = Image.blend(frame, Image.new("RGB", frame.size, (65, 78, 92)), .19)
    elif tone in ("cold", "ice"):
        frame = Image.blend(frame, Image.new("RGB", frame.size, (154, 181, 195)), .18 if tone == "cold" else .28)
        frame = ImageEnhance.Color(frame).enhance(.76)
    elif tone == "tropic":
        frame = Image.blend(frame, Image.new("RGB", frame.size, (225, 188, 112)), .10)
        frame = ImageEnhance.Color(frame).enhance(1.08)
    elif tone == "east":
        frame = Image.blend(frame, Image.new("RGB", frame.size, (202, 177, 143)), .10)
    else:
        frame = Image.blend(frame, Image.new("RGB", frame.size, (117, 145, 164)), .08)

    # 얼음 바다는 먼 수평선의 작은 유빙만 추가한다. 지도 장면과 충돌하지 않도록 첫 장면에만 있다.
    if tone == "ice":
        layer = Image.new("RGBA", frame.size, (0, 0, 0, 0)); d = ImageDraw.Draw(layer, "RGBA")
        rng = random.Random(seed)
        for i in range(12):
            x = rng.randrange(40, RW - 40); y = rng.randrange(round(RH * .48), round(RH * .67)); w = rng.randrange(12, 45)
            d.polygon(((x - w, y + 3), (x - w // 3, y - rng.randrange(3, 11)), (x + w // 2, y - 2), (x + w, y + 5)), fill=(226, 236, 232, 135))
        frame = Image.alpha_composite(frame.convert("RGBA"), layer).convert("RGB")
    return frame


def progressive_path(route: list[tuple[float, float]], amount: float) -> list[tuple[float, float]]:
    if amount <= 0:
        return [route[0]]
    lengths = [math.dist(a, b) for a, b in zip(route, route[1:])]
    total = sum(lengths)
    need = total * min(1.0, amount)
    out = [route[0]]
    for a, b, length in zip(route, route[1:], lengths):
        if need >= length:
            out.append(b); need -= length; continue
        u = need / length if length else 1
        out.append((lerp(a[0], b[0], u), lerp(a[1], b[1], u)))
        break
    return out


def route_layer(route: list[tuple[float, float]], bounds: tuple[float, float, float, float], amount: float) -> Image.Image:
    layer = Image.new("RGBA", (RW, RH), (0, 0, 0, 0))
    pts = [project(x, y, bounds) for x, y in progressive_path(route, amount)]
    if len(pts) < 2:
        return layer
    # 종이에 번진 갈색 잉크와 날카로운 펜 선을 겹친다.
    blur = Image.new("RGBA", layer.size, (0, 0, 0, 0)); bd = ImageDraw.Draw(blur, "RGBA")
    bd.line(pts, fill=(53, 28, 15, 92), width=11, joint="curve")
    blur = blur.filter(ImageFilter.GaussianBlur(5))
    layer = Image.alpha_composite(layer, blur)
    d = ImageDraw.Draw(layer, "RGBA")
    d.line(pts, fill=(70, 35, 18, 235), width=5, joint="curve")
    d.line([(x + 1, y - 1) for x, y in pts], fill=(139, 83, 40, 155), width=2, joint="curve")
    # 지나간 꺾임점에 아주 작은 잉크 맺힘을 남긴다.
    shown = progressive_path(route, amount)
    for p in shown[1:-1]:
        x, y = project(*p, bounds)
        d.ellipse((x - 3, y - 3, x + 3, y + 3), fill=(61, 31, 17, 185))
    return layer


def carrack_icon() -> Image.Image:
    with Image.open(SHIP_SHEET) as sheet:
        # 동쪽을 보는 표류 동작 첫 칸: 돛을 편 카락의 옆모습.
        icon = sheet.convert("RGBA").crop((CELL * 3, 0, CELL * 4, CELL))
    box = icon.getbbox()
    if box:
        icon = icon.crop(box)
    alpha = icon.getchannel("A")
    gray = ImageOps.grayscale(icon)
    sepia = ImageOps.colorize(gray, (52, 29, 16), (213, 177, 111)).convert("RGBA")
    sepia.putalpha(alpha)
    return sepia


def finish_marks(base: Image.Image, cfg: dict, bounds: tuple[float, float, float, float], dot: float, ship: float,
                 ship_source: Image.Image) -> Image.Image:
    target = cfg["route"][-1]
    x, y = project(*target, bounds)
    layer = Image.new("RGBA", (RW, RH), (0, 0, 0, 0))
    if dot > 0:
        r = lerp(3, 11, ease(dot))
        bloom = Image.new("RGBA", layer.size, (0, 0, 0, 0)); bd = ImageDraw.Draw(bloom, "RGBA")
        bd.ellipse((x - r * 1.8, y - r * 1.8, x + r * 1.8, y + r * 1.8), fill=(49, 24, 13, round(125 * dot)))
        bloom = bloom.filter(ImageFilter.GaussianBlur(8))
        layer = Image.alpha_composite(layer, bloom)
        d = ImageDraw.Draw(layer, "RGBA")
        d.ellipse((x - r, y - r, x + r, y + r), fill=(55, 27, 14, round(235 * dot)))
        rng = random.Random(sum(ord(c) for c in cfg["name"]))
        for _ in range(9):
            a = rng.random() * math.tau; rr = r * rng.uniform(.8, 1.75); q = rng.uniform(1, 2.8) * dot
            px, py = x + math.cos(a) * rr, y + math.sin(a) * rr
            d.ellipse((px - q, py - q, px + q, py + q), fill=(49, 23, 12, round(180 * dot)))
    if ship > 0:
        size = max(12, round(82 * ease(ship)))
        marker = ship_source.resize((size, max(1, round(ship_source.height * size / ship_source.width))), Image.Resampling.LANCZOS)
        marker.putalpha(marker.getchannel("A").point(lambda a: round(a * ship)))
        outline = marker.getchannel("A").filter(ImageFilter.MaxFilter(7))
        halo = Image.new("RGBA", marker.size, (235, 219, 179, 0)); halo.putalpha(outline.point(lambda a: round(a * .62 * ship)))
        px = round(x - marker.width / 2); py = round(y - marker.height + 5)
        layer.alpha_composite(halo, (px, py))
        layer.alpha_composite(marker, (px, py))
    return Image.alpha_composite(base.convert("RGBA"), layer).convert("RGB")


def zoom_frame(image: Image.Image, amount: float, seed: int) -> Image.Image:
    if amount <= 0:
        return image
    scale = lerp(1.0, .925, ease(amount))
    nw, nh = round(RW * scale), round(RH * scale)
    small = image.resize((nw, nh), Image.Resampling.LANCZOS)
    bg = paper_texture(seed + 991)
    shadow = Image.new("RGBA", (RW, RH), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow, "RGBA")
    x, y = (RW - nw) // 2, (RH - nh) // 2
    sd.rounded_rectangle((x - 5, y - 4, x + nw + 6, y + nh + 8), radius=8, fill=(50, 29, 15, round(100 * amount)))
    shadow = shadow.filter(ImageFilter.GaussianBlur(8))
    out = Image.alpha_composite(bg.convert("RGBA"), shadow)
    out.alpha_composite(small.convert("RGBA"), (x, y))
    d = ImageDraw.Draw(out, "RGBA")
    d.rectangle((x, y, x + nw - 1, y + nh - 1), outline=(82, 50, 25, round(110 * amount)), width=2)
    return out.convert("RGB")


def animation(src: Image.Image, did: str, world3: Image.Image, ship: Image.Image) -> tuple[list[Image.Image], list[int]]:
    cfg = ROUTES[did]
    seed = sum((i + 1) * ord(c) for i, c in enumerate(did))
    frames: list[Image.Image] = []
    durations = [500, 500, 500, 380] + [380] * 17 + [360] * 3 + [400]
    assert len(durations) == 25 and sum(durations) == 9820

    # 1) 배 위에서 처음 발견지를 바라본다.
    for i in range(4):
        frame = crop_scene(src, did, i / 3)
        frames.append(frame.resize((W, H), Image.Resampling.LANCZOS))

    # 2) 풍경 위로 양피지 고지도가 스며든다.
    close_bounds = map_bounds(cfg["route"], 0)
    close_map = render_map(world3, close_bounds, seed)
    scene = crop_scene(src, did, 1)
    for i in range(4):
        a = ease((i + 1) / 4)
        frame = Image.blend(scene, close_map, a)
        frames.append(frame.resize((W, H), Image.Resampling.LANCZOS))

    # 3) 출발지에서 발견지까지 항로가 젖은 잉크로 자라난다.
    for i in range(10):
        amount = ease((i + 1) / 10)
        frame = Image.alpha_composite(close_map.convert("RGBA"), route_layer(cfg["route"], close_bounds, amount)).convert("RGB")
        frames.append(frame.resize((W, H), Image.Resampling.LANCZOS))

    # 4) 목적지의 잉크 점이 번지고, 그 위에 카락 표식이 선다.
    routed = Image.alpha_composite(close_map.convert("RGBA"), route_layer(cfg["route"], close_bounds, 1)).convert("RGB")
    frames.append(finish_marks(routed, cfg, close_bounds, .42, 0, ship).resize((W, H), Image.Resampling.LANCZOS))
    frames.append(finish_marks(routed, cfg, close_bounds, 1, 0, ship).resize((W, H), Image.Resampling.LANCZOS))
    frames.append(finish_marks(routed, cfg, close_bounds, 1, 1, ship).resize((W, H), Image.Resampling.LANCZOS))

    # 5) 카락과 항로를 남긴 채 지도를 서서히 줌 아웃한다.
    for i in range(4):
        u = ease((i + 1) / 4)
        bounds = map_bounds(cfg["route"], u)
        base = render_map(world3, bounds, seed)
        base = Image.alpha_composite(base.convert("RGBA"), route_layer(cfg["route"], bounds, 1)).convert("RGB")
        frame = finish_marks(base, cfg, bounds, 1, 1, ship)
        frame = zoom_frame(frame, u, seed)
        frames.append(frame.resize((W, H), Image.Resampling.LANCZOS))

    assert len(frames) == 25
    return frames, durations


def shared_palette(frames: list[Image.Image]) -> Image.Image:
    sheet = Image.new("RGB", (W * 2, H * 2))
    for xy, idx in zip(((0, 0), (W, 0), (0, H), (W, H)), (0, 7, 16, 24)):
        sheet.paste(frames[idx], xy)
    return sheet.convert("P", palette=Image.Palette.ADAPTIVE, colors=64)


def build_one(did: str, src: Image.Image, world3: Image.Image, ship: Image.Image) -> Path:
    frames, durations = animation(src, did, world3, ship)
    palette = shared_palette(frames)
    pal = [frame.quantize(palette=palette, dither=Image.Dither.FLOYDSTEINBERG) for frame in frames]
    OUT.mkdir(parents=True, exist_ok=True)
    dst = OUT / f"{did}.gif"
    pal[0].save(dst, save_all=True, append_images=pal[1:], duration=durations, loop=0, disposal=1, optimize=True)
    ENDS.mkdir(parents=True, exist_ok=True)
    frames[-1].save(ENDS / f"{did}.jpg", "JPEG", quality=90, optimize=True)
    return dst


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="쉼표로 구분한 지리 발견물 ID")
    args = ap.parse_args()
    wanted = set(args.only.split(",")) if args.only else None
    rows = [(did, name) for did, name in geo_rows() if wanted is None or did in wanted]
    unknown = [did for did, _ in rows if did not in ROUTES]
    if unknown:
        raise SystemExit("missing geography route specs: " + ", ".join(unknown))
    if not SOURCE.exists():
        raise SystemExit(f"missing source artwork: {SOURCE}")
    if not SHIP_SHEET.exists():
        raise SystemExit(f"missing carrack sprite: {SHIP_SHEET}")

    with Image.open(SOURCE) as raw:
        src = raw.convert("RGB")
    world3 = repeat_world(load_land_mask())
    ship = carrack_icon()
    for n, (did, name) in enumerate(rows, 1):
        dst = build_one(did, src, world3, ship)
        print(f"[{n:02d}/{len(rows):02d}] {did:<12} {name:<10} {dst.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
