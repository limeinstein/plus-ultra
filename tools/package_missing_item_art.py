"""내장 ImageGen의 개별 원화를 보존하고 투명 소지품 WebP로 맞춘다."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SPEC = ROOT / 'docs/art/missing-item-prompts-20261106.json'
OUT = ROOT / 'artifacts/missing-item-art-20261106'


def make_previews(report):
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 15)
    for start in range(0, len(report), 40):
        group = report[start:start + 40]
        sheet = Image.new('RGB', (1000, ((len(group) + 4) // 5) * 220), '#25242a')
        draw = ImageDraw.Draw(sheet)
        for i, row in enumerate(group):
            x, y = i % 5 * 200, i // 5 * 220
            with Image.open(ROOT / row['output']) as icon:
                icon.thumbnail((160, 160), Image.Resampling.LANCZOS)
                sheet.paste(icon, (x + (200 - icon.width) // 2, y), icon)
            lines, line = [], ''
            for char in row['name']:
                if line and draw.textlength(line + char, font=font) > 184:
                    lines.append(line.rstrip())
                    line = char.lstrip()
                else:
                    line += char
            lines.append(line)
            assert len(lines) <= 3, row['name']
            for offset, line in enumerate(lines):
                draw.text((x + 8, y + 162 + offset * 18), line, font=font, fill='white')
        sheet.save(OUT / ('preview-%02d.jpg' % (start // 40 + 1)), quality=92)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--partial', action='store_true', help='완료한 원화만 처리')
    parser.add_argument('--preview-only', action='store_true', help='저장된 그림 모음만 다시 만든다')
    args = parser.parse_args()
    if args.preview_only:
        make_previews(json.loads((OUT / 'assets.json').read_text(encoding='utf-8')))
        return
    spec = json.loads(SPEC.read_text(encoding='utf-8'))
    for asset in spec['assets']:
        generated = OUT / 'generated' / (asset['id'] + '.json')
        if generated.exists():
            result = json.loads(generated.read_text(encoding='utf-8'))
            for key in ('source', 'prompt', 'revision'):
                if key in result:
                    asset[key] = result[key]
            failure = OUT / 'generated' / (asset['id'] + '.error.json')
            if failure.exists():
                record = json.loads(failure.read_text(encoding='utf-8'))
                record.update(resolved=True, source=asset['source'])
                failure.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    SPEC.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    size, margin = spec['size'], spec['margin']
    raw_dir = OUT / 'raw'
    raw_dir.mkdir(parents=True, exist_ok=True)
    previous_rows = json.loads((OUT / 'assets.json').read_text(encoding='utf-8')) if (OUT / 'assets.json').exists() else []
    previous = {row['id']: row for row in previous_rows}
    report = []
    for asset in spec['assets']:
        if not asset.get('source'):
            if args.partial:
                continue
            raise ValueError(asset['id'] + ': 생성 원본 누락')
        suffix = '-v%d' % asset['revision'] if asset.get('revision', 1) > 1 else ''
        raw = raw_dir / (asset['id'] + suffix + '.png')
        if not raw.exists():
            shutil.copy2(asset['source'], raw)
        dest = ROOT / asset['output']
        cached = previous.get(asset['id'])
        if (cached and dest.exists() and cached['raw'] == raw.relative_to(ROOT).as_posix()
                and cached['sha256'] == hashlib.sha256(dest.read_bytes()).hexdigest()):
            report.append(cached)
            continue
        with Image.open(raw) as image:
            original = image.convert('RGBA')
        alpha = original.getchannel('A')
        bounds = alpha.getbbox()
        if not bounds or alpha.getextrema()[0] != 0 or alpha.getextrema()[1] < 240:
            raise ValueError(asset['id'] + ': 투명 배경 확인 필요')
        obj = original.crop(bounds)
        obj.thumbnail((size - margin * 2, size - margin * 2), Image.Resampling.LANCZOS)
        icon = Image.new('RGBA', (size, size))
        icon.paste(obj, ((size - obj.width) // 2, (size - obj.height) // 2))
        if dest.exists() and asset['id'] not in previous:
            raise ValueError(asset['id'] + ': 기존 그림 덮어쓰기 방지')
        dest.parent.mkdir(parents=True, exist_ok=True)
        icon.save(dest, 'WEBP', quality=95, method=6, exact=True)
        with Image.open(dest) as saved:
            assert saved.size == (size, size) and saved.mode == 'RGBA'
            box = saved.getchannel('A').getbbox()
            assert min(box[0], box[1], size - box[2], size - box[3]) >= margin - 1
        report.append({'id': asset['id'], 'name': asset['name'], 'kind': asset['kind'],
                       'raw': raw.relative_to(ROOT).as_posix(), 'output': asset['output'],
                       'originalSize': list(original.size), 'alphaBounds': list(box),
                       'bytes': dest.stat().st_size, 'sha256': hashlib.sha256(dest.read_bytes()).hexdigest()})
    (OUT / 'assets.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    make_previews(report)
    print('소지품 원화 %d/%d종 저장' % (len(report), len(spec['assets'])))


if __name__ == '__main__':
    main()
