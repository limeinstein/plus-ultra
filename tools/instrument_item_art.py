#!/usr/bin/env python3
"""악기 원화의 투명도를 유지해 소지품 규격으로 저장한다.

python tools/instrument_item_art.py
원본은 artifacts/instrument-item-art-20261101/raw/에 보존한다.
"""
import hashlib
import argparse
import json
from pathlib import Path
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SPEC = ROOT / 'docs/art/instrument-item-prompts-20261101.json'
OUT = ROOT / 'artifacts/instrument-item-art-20261101'


def main():
    parser = argparse.ArgumentParser(description='악기 투명 원화를 게임용 WebP로 저장한다.')
    parser.add_argument('--spec', type=Path, default=SPEC, help='원본·출력·생성 지시문 목록')
    parser.add_argument('--out', type=Path, default=OUT, help='원본 보관·검사 기록 폴더')
    args = parser.parse_args()
    spec_path = args.spec if args.spec.is_absolute() else ROOT / args.spec
    out = args.out if args.out.is_absolute() else ROOT / args.out
    spec = json.loads(spec_path.read_text(encoding='utf-8'))
    size, margin = spec['size'], spec['margin']
    (out / 'raw').mkdir(parents=True, exist_ok=True)
    report = []
    for asset in spec['assets']:
        raw = out / 'raw' / (asset['id'] + '.png')
        if not raw.exists():
            shutil.copy2(asset['source'], raw)
        original = Image.open(raw).convert('RGBA')
        alpha = original.getchannel('A')
        bounds = alpha.getbbox()
        if not bounds or alpha.getextrema()[0] != 0:
            raise ValueError(asset['id'] + ': 투명 배경·물체 확인 필요')
        obj = original.crop(bounds)
        obj.thumbnail((size - margin * 2, size - margin * 2), Image.Resampling.LANCZOS)
        icon = Image.new('RGBA', (size, size))
        icon.paste(obj, ((size - obj.width) // 2, (size - obj.height) // 2))
        dest = ROOT / asset['output']
        dest.parent.mkdir(parents=True, exist_ok=True)
        icon.save(dest, 'WEBP', quality=95, method=6, exact=True)
        saved = Image.open(dest)
        assert saved.size == (size, size) and saved.mode == 'RGBA'
        box = saved.getchannel('A').getbbox()
        assert min(box[0], box[1], size - box[2], size - box[3]) >= margin - 1
        report.append({'id': asset['id'], 'raw': raw.relative_to(ROOT).as_posix(),
                       'originalSize': list(original.size), 'originalBounds': list(bounds),
                       'output': asset['output'], 'size': list(saved.size), 'alphaBounds': list(box),
                       'bytes': dest.stat().st_size, 'sha256': hashlib.sha256(dest.read_bytes()).hexdigest()})
    (out / 'assets.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
