"""발견 유물 원화 저장·변환과 점검판·제작 기록 갱신.

원화 한 장: python tools/disc_relics_20261107/package.py --id ID --source PNG
중간/최종 점검판: python tools/disc_relics_20261107/package.py
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
import shutil
from collections import Counter
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
PROMPTS = HERE / "prompts.json"
ASSETS = json.loads(PROMPTS.read_text(encoding="utf-8"))["assets"]


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def check(path, size=None):
    with Image.open(path) as image:
        image.load()
        if size and image.size != size:
            raise ValueError(f"잘못된 크기: {path}: {image.size}")
        if "A" not in image.getbands():
            raise ValueError(f"투명 채널 없음: {path}")
        alpha = image.getchannel("A")
        low, high = alpha.getextrema()
        if low != 0 or high < 128:
            raise ValueError(f"배경/물체 투명도 확인 필요: {path}: {(low, high)}")
        return {"size": list(image.size), "alpha": [low, high]}


def save_source(asset_id, source, replace=False):
    asset = next(a for a in ASSETS if a["id"] == asset_id)
    target, output = ROOT / asset["target"], ROOT / asset["file"]
    check(source)
    if output.exists() and not replace:
        raise FileExistsError(f"기존 그림 덮어쓰기 차단: {output}")
    if output.exists() and replace:
        old_hash = hashlib.sha256(output.read_bytes()).hexdigest()[:16]
        history = HERE / 'revisions' / asset_id
        history.mkdir(parents=True, exist_ok=True)
        shutil.copy2(output, history / f'{old_hash}.webp')
        if target.exists():
            shutil.copy2(target, history / f'{old_hash}.png')
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    spec = importlib.util.spec_from_file_location("prepare_relic_icon", ROOT / "tools/prepare_relic_icon.py")
    prepare = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(prepare)
    prepare.prepare(target, output)
    info = check(output, (256, 256))
    record = {
        "id": asset_id, "source": str(source), "target": asset["target"],
        "file": asset["file"], "tool": "built-in image_gen", "date": "2026-11-07",
        "sha256": hashlib.sha256(output.read_bytes()).hexdigest(), **info,
    }
    fixes = HERE / 'qa_fixes.json'
    if replace and fixes.exists():
        fix = json.loads(fixes.read_text(encoding='utf-8')).get(asset_id)
        if fix:
            record.update(fix)
    write_json(HERE / "records" / f"{asset_id}.json", record)
    print(f"저장: {asset_id}")


def make_preview(available):
    cols, cw, ch = 12, 172, 198
    groups = [("legend", "전설 생물의 물건"), ("baby", "동물의 새끼"), ("faith", "종교 성물")]
    height = 90 + sum(54 + math.ceil(sum(a["group"] == g for a in ASSETS) / cols) * ch for g, _ in groups)
    canvas = Image.new("RGB", (cols * cw + 32, height), "#e6dac3")
    draw = ImageDraw.Draw(canvas)
    font_path = Path("C:/Windows/Fonts/malgun.ttf")
    font = ImageFont.truetype(str(font_path), 12)
    heading = ImageFont.truetype(str(font_path), 25)
    draw.text((16, 13), f"발견 유물 원화 · {len(available)}/411장 저장", fill="#33291d", font=heading)
    subtitle = "OpenAI ImageGen · 투명 WebP 256×256"
    if len(available) < len(ASSETS):
        subtitle += " · 빈 칸은 아직 생성되지 않은 항목"
    draw.text((16, 52), subtitle, fill="#574d40", font=font)
    y = 90
    for group, label in groups:
        items = [a for a in ASSETS if a["group"] == group]
        count = sum(a["id"] in available for a in items)
        draw.text((16, y + 8), f"{label}  {count}/{len(items)}", fill="#33291d", font=heading)
        y += 54
        for i, a in enumerate(items):
            x, yy = 16 + (i % cols) * cw, y + (i // cols) * ch
            draw.rounded_rectangle((x + 3, yy + 3, x + cw - 5, yy + ch - 5), radius=5, fill="#f6f0e4")
            if a["id"] in available:
                with Image.open(ROOT / a["file"]) as im:
                    im = im.convert("RGBA")
                    im.thumbnail((148, 148), Image.Resampling.LANCZOS)
                    canvas.paste(im, (x + (cw - im.width) // 2, yy + 5 + (148 - im.height) // 2), im)
            else:
                draw.text((x + 60, yy + 65), "미생성", fill="#a69e91", font=font)
            name = a["name"]
            lines = []
            while name:
                n = len(name)
                while n > 1 and draw.textlength(name[:n], font=font) > cw - 14:
                    n -= 1
                lines.append(name[:n])
                name = name[n:]
            for j, line in enumerate(lines[:2]):
                draw.text((x + 7, yy + 155 + 15 * j), line, fill="#33291d", font=font)
        y += math.ceil(len(items) / cols) * ch
    canvas.save(ROOT / "docs/art/disc-relics-20261107-preview.jpg", quality=92)


def package():
    available, missing = [], []
    for a in ASSETS:
        if not (ROOT / a["file"]).exists():
            missing.append(a["id"])
            continue
        check(ROOT / a["target"])
        check(ROOT / a["file"], (256, 256))
        available.append(a)
    ledger_path = ROOT / "docs/art/relic-icons-generation.json"
    ledger = json.loads(ledger_path.read_text(encoding="utf-8"))
    mine = {a["id"] for a in ASSETS}
    base = [a for a in ledger["assets"] if a["id"] not in mine]
    added = []
    for a in available:
        row = {**a, "tool": "built-in image_gen", "date": "2026-11-07"}
        record_path = HERE / 'records' / f'{a["id"]}.json'
        if record_path.exists():
            record = json.loads(record_path.read_text(encoding='utf-8'))
            for key in ['prompt', 'note', 'sha256']:
                if key in record:
                    row[key] = record[key]
        added.append(row)
    ledger["assets"] = base + added
    ledger["total"] = len(ledger["assets"])
    ledger["generated"] = ledger["total"] - ledger.get("preserved", 0)
    ledger["discovery_relics_20261107"] = {"completed": len(available), "requested": len(ASSETS), "prompts": "tools/disc_relics_20261107/prompts.json"}
    write_json(ledger_path, ledger)
    status = {"completed": len(available), "total": len(ASSETS), "groups": dict(Counter(a["group"] for a in available)), "missing": missing}
    write_json(HERE / "progress.json", status)
    make_preview({a["id"] for a in available})
    print(json.dumps({k: v for k, v in status.items() if k != "missing"}, ensure_ascii=False))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--id")
    parser.add_argument("--source", type=Path)
    parser.add_argument("--replace", action="store_true", help="이번 작업의 검수 수정본으로 교체하고 이전 그림을 보관")
    args = parser.parse_args()
    if args.id and args.source:
        save_source(args.id, args.source, replace=args.replace)
    elif args.id or args.source:
        parser.error("--id와 --source를 함께 지정하세요")
    else:
        package()
