#!/usr/bin/env python3
"""36종 배의 8방향 동작 시트를 3D(three.js)로 굽는다.

tools/render_ship_sprites.py(Pillow 평면 그림)와 같은 규격·같은 치수를 쓴다:
224px 칸, 8열×16행(1792×3584) 투명 WebP, 정박 3·표류 5·질주 8장 × 8방향, 수면 피벗 (112,139).
배 길이·폭·뱃전 높이·돛대 자리·높이는 render_ship_sprites.py의 dims()·mast_positions()·mast_heights()에서
그대로 가져와 게임의 배 크기(baseLen 158)와 깃발 자리가 바뀌지 않는다.

    python3 tools/ship3d/bake.py                 # 36종 모두 → images/ships-nav/*.webp, js/data/shipart.js, 접촉 시트
    python3 tools/ship3d/bake.py --ids galleon,junk --preview    # 몇 장면만 .work/ship3d/preview 에
필요한 것: Node + playwright + three@0.147.0 (tools/ship3d에서 `npm install three@0.147.0 playwright`), Pillow.
"""
from __future__ import annotations

import argparse
import json
import math
import os
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import render_ship_sprites as rs  # noqa: E402

WORK = ROOT / ".work" / "ship3d"


def specs(ids=None):
    out = []
    for s in rs.ships():
        if ids and s["id"] not in ids:
            continue
        L, W, H = rs.dims(s)
        masts = rs.mast_positions(s, L)
        out.append({**s, "p": rs.P[s["id"]], "L": L, "W": W, "H": H,
                    "masts": masts, "heights": rs.mast_heights(s, len(masts))})
    return out


def font(size):
    for f in ("C:/Windows/Fonts/malgun.ttf", "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
              "/usr/share/fonts/truetype/nanum/NanumGothic.ttf", "/System/Library/Fonts/AppleSDGothicNeo.ttc"):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            continue
    return None


def contact_sheet(ss, atlases, path, action="dash", di=1, fi=2):
    thumb = 180; pad = 12; cols = 6; rows = math.ceil(len(ss) / cols)
    out = Image.new("RGBA", (cols * (thumb + pad) + pad, rows * (thumb + 34 + pad) + pad), rs.rgb("#20262d"))
    f = font(13); labels = []
    for i, s in enumerate(ss):
        x = pad + (i % cols) * (thumb + pad); y = pad + (i // cols) * (thumb + 34 + pad)
        spec = rs.ACTIONS[action]; sy = (spec["row"] + di) * rs.CELL; sx = (spec["col"] + fi) * rs.CELL
        base = atlases[s["id"]].crop((sx, sy, sx + rs.CELL, sy + rs.CELL))
        base.thumbnail((thumb, thumb), Image.Resampling.LANCZOS)
        out.alpha_composite(base, (x + (thumb - base.width) // 2, y))
        labels.append((x + 4, y + thumb + 5, f"{s['name']}  {s['id']}"))
    d = ImageDraw.Draw(out)
    for x, y, t in labels:
        d.text((x, y), t, fill=(235, 225, 202, 255), font=f)
    path.parent.mkdir(parents=True, exist_ok=True)
    out.convert("RGB").save(path, quality=90, optimize=True)


def run_node(spec_list, out_dir, extra=()):
    WORK.mkdir(parents=True, exist_ok=True)
    sf = WORK / "specs.json"
    sf.write_text(json.dumps(spec_list, ensure_ascii=False), encoding="utf-8")
    cmd = ["node", str(HERE / "render.js"), str(sf), str(out_dir), *extra]
    subprocess.run(cmd, check=True, cwd=ROOT)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ids", help="쉼표로 나눈 배 ID(없으면 36종 모두)")
    ap.add_argument("--preview", action="store_true", help="몇 장면만 .work/ship3d/preview에")
    ap.add_argument("--scenes", default="dash:1:2,drift:3:0,idle:6:0,dash:0:0,dash:2:4",
                    help="미리보기 장면 동작:방향:장 목록")
    ap.add_argument("--quality", type=int, default=86, help="WebP 품질")
    ap.add_argument("--ss", type=int, default=3, help="초과 표본 배율")
    ap.add_argument("--from-png", action="store_true", help="굽지 않고 .work/ship3d/png 의 PNG만 다시 담기")
    a = ap.parse_args()
    ids = set(a.ids.split(",")) if a.ids else None
    sp = specs(ids)
    if a.preview:
        lst = [[x.split(":")[0], int(x.split(":")[1]), int(x.split(":")[2])] for x in a.scenes.split(",")]
        pf = WORK / "preview.json"; WORK.mkdir(parents=True, exist_ok=True)
        pf.write_text(json.dumps({"list": lst}), encoding="utf-8")
        run_node(sp, WORK / "preview", ["--preview", str(pf), "--ss", str(a.ss)])
        n = len(lst); sheet = Image.new("RGBA", (rs.CELL * n, rs.CELL * len(sp)), rs.rgb("#20262d"))
        for r, s in enumerate(sp):
            for c in range(n):
                im = Image.open(WORK / "preview" / f"{s['id']}_{c}.png").convert("RGBA")
                sheet.alpha_composite(im, (c * rs.CELL, r * rs.CELL))
        sheet.save(WORK / "preview_sheet.png")
        print("미리보기:", WORK / "preview_sheet.png")
        return
    png_dir = WORK / "png"
    if not a.from_png:
        run_node(sp, png_dir, ["--ss", str(a.ss)])
    atlases = {}
    rs.OUT.mkdir(parents=True, exist_ok=True)
    for i, s in enumerate(sp, 1):
        im = Image.open(png_dir / f"{s['id']}.png").convert("RGBA")
        if im.size != (rs.CELL * rs.COLS, rs.CELL * rs.DIRS * 2):
            raise RuntimeError(f"{s['id']} 크기 {im.size}")
        atlases[s["id"]] = im
        path = rs.OUT / f"{s['id']}.webp"
        im.save(path, "WEBP", quality=a.quality, method=6, alpha_quality=100)
        print(f"[{i:02d}/{len(sp)}] {path.relative_to(ROOT)} {path.stat().st_size / 1024:.0f} KiB")
    if len(sp) == 36:
        rs.write_meta(sp)
        contact_sheet(sp, atlases, rs.CONTACT)
    total = sum(p.stat().st_size for p in rs.OUT.glob("*.webp"))
    print(f"합계 {total / 1024 / 1024:.2f} MiB")


if __name__ == "__main__":
    main()
