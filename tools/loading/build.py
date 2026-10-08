#!/usr/bin/env python3
"""고지도 원화와 갤리온을 타이틀 화면의 움직이는 로딩 그림으로 합친다."""

import math
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageFilter


HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
MAP_PATH = HERE / "sources" / "world-map.png"
OUT_PATH = ROOT / "images" / "effects" / "loading-world.gif"
WORK = ROOT / "tmp" / "loading-world"

SIZE = 320
FRAMES = 180
DURATION_MS = 60
LAPS = 3
CX, CY = 160, 158
RADIUS = 106
SHIP_WIDTH = round(RADIUS * 2 * 0.15)  # 지구 지름의 15%


def globe_frame(world, phase):
    """고지도를 구에 투영하고 경계 명암과 푸른 대기광을 입힌다."""
    globe = Image.new("RGBA", (RADIUS * 2, RADIUS * 2), (0, 0, 0, 0))
    pix = globe.load()
    src = world.load()
    sw, sh = world.size
    turn = phase * math.tau

    for oy in range(RADIUS * 2):
        ny = (oy + 0.5 - RADIUS) / RADIUS
        for ox in range(RADIUS * 2):
            nx = (ox + 0.5 - RADIUS) / RADIUS
            rr = nx * nx + ny * ny
            if rr >= 1:
                continue
            nz = math.sqrt(1 - rr)
            lon = math.atan2(nx, nz) + turn
            lat = math.asin(-ny)
            sx = int(((lon / math.tau) + 0.5) * sw) % sw
            sy = min(sh - 1, max(0, int((0.5 - lat / math.pi) * sh)))
            r, g, b = src[sx, sy][:3]

            # 오른쪽 위 햇빛, 왼쪽 아래 그림자. 가장자리는 둥글게 어두워진다.
            light = max(0.0, nx * -0.36 + ny * -0.42 + nz * 0.83)
            shade = 0.43 + light * 0.64
            edge = min(1.0, nz * 2.25)
            shade *= 0.76 + edge * 0.24
            rim = max(0.0, (0.28 - nz) / 0.28)
            pix[ox, oy] = (
                min(255, int(r * shade + 22 * rim)),
                min(255, int(g * shade + 48 * rim)),
                min(255, int(b * shade + 70 * rim)),
                min(255, int(edge * 285)),
            )

    globe = globe.filter(ImageFilter.GaussianBlur(0.25))
    return globe


def orbit_position(phase):
    """고리 없이 도는 항로. 세 바퀴 동안 타원의 기울기도 한 바퀴 돌아온다."""
    a = -phase * math.tau * (LAPS + 1) - math.pi / 2
    tilt = phase * math.tau
    x, y = math.cos(a) * (RADIUS + 17), math.sin(a) * (RADIUS - 6)
    return (CX + x * math.cos(tilt) - y * math.sin(tilt),
            CY + x * math.sin(tilt) + y * math.cos(tilt))


def ship_heading(phase):
    x0, y0 = orbit_position(phase - 0.0001)
    x1, y1 = orbit_position(phase + 0.0001)
    # 기존 3D 카메라의 수면 투영(높이 0.52)을 역산한다. +x가 선수다.
    return math.atan2(-(y1 - y0) / 0.52, x1 - x0)


def render_ships():
    sys.path.insert(0, str(ROOT / "tools" / "ship3d"))
    import bake
    poses = [["dash", ship_heading(i / FRAMES) / math.tau * 8,
              i / FRAMES * 8 * 15] for i in range(FRAMES)]
    cfg = {"spec": bake.specs(["galleon"])[0], "poses": poses, "out": str(WORK)}
    subprocess.run(["node", str(HERE / "render_ship.js")], input=json.dumps(cfg),
                   text=True, encoding="utf-8", check=True)
    return json.loads((WORK / "scale.json").read_text())


def build():
    world = Image.open(MAP_PATH).convert("RGB")
    meta = render_ships()
    ship_scale = SHIP_WIDTH / (meta["hullLength"] * meta["scale"])
    cell = round(224 * ship_scale)

    frames = []
    for i in range(FRAMES):
        phase = i / FRAMES
        frame = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        globe = globe_frame(world, phase)
        frame.alpha_composite(globe, (CX - RADIUS, CY - RADIUS))
        x, y = orbit_position(phase)
        sprite = Image.open(WORK / f"ship-{i:03d}.png").convert("RGBA")
        if not sprite.getchannel("A").getbbox():
            raise RuntimeError(f"갤리온 {i}번 장면이 비어 있습니다.")
        sprite = sprite.resize((cell, cell), Image.Resampling.LANCZOS)
        # 모든 방향에 같은 수면 중심을 써 선수·선미에서 배의 자리가 튀지 않는다.
        frame.alpha_composite(sprite, (round(x - 112 * ship_scale), round(y - 139 * ship_scale)))
        frames.append(frame)

    # 전 프레임에 같은 색상표를 써 자전할 때 색이 번쩍이지 않게 한다.
    samples = Image.new("RGB", (SIZE * 5, SIZE * 2), (1, 0, 1))
    for n, frame in enumerate(frames[::FRAMES // 10]):
        samples.paste(frame.convert("RGB"), ((n % 5) * SIZE, (n // 5) * SIZE))
    palette_seed = samples.quantize(colors=255, method=Image.Quantize.MEDIANCUT)
    pal = palette_seed.getpalette()[:255 * 3]
    palette = Image.new("P", (1, 1))
    palette.putpalette(pal + pal[-3:])

    out = []
    for frame in frames:
        alpha = frame.getchannel("A")
        p = frame.convert("RGB").quantize(palette=palette, dither=Image.Dither.NONE)
        # 색상표를 한 칸 밀어 0번을 투명색으로 비워 둔다.
        data = bytes(min(255, v + 1) for v in p.tobytes())
        p.frombytes(data)
        p.putpalette([1, 0, 1] + pal + [0] * (768 - 3 - len(pal)))
        mask = alpha.point(lambda a: 255 if a < 24 else 0)
        p.paste(0, mask=mask)
        p.info["transparency"] = 0
        out.append(p)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    out[0].save(
        OUT_PATH,
        save_all=True,
        append_images=out[1:],
        duration=DURATION_MS,
        loop=0,
        disposal=2,
        transparency=0,
        optimize=False,
    )
    # 네 방향의 모습과 반복 경계를 한눈에 검토한다.
    contact = Image.new("RGBA", (SIZE * 4, SIZE * 2), (17, 26, 34, 255))
    for n, index in enumerate([0, 22, 45, 67, 90, 112, 135, 157]):
        contact.alpha_composite(frames[index], ((n % 4) * SIZE, (n // 4) * SIZE))
    contact.save(WORK / "contact.png")
    print(f"{OUT_PATH} ({FRAMES} frames, {SIZE}x{SIZE}, ship {SHIP_WIDTH}px)")


if __name__ == "__main__":
    build()
