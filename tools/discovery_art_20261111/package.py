"""생성 원화를 보존하고 발견 연출·증거품 아이콘·검수 모음을 만든다."""
import argparse
import hashlib
import html
import json
import math
from pathlib import Path
import shutil

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[2]
SPEC = Path(__file__).with_name('prompts.json')
OUT = ROOT / 'artifacts/discovery-art-20261111'


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def scene_frames(original):
    source = ImageOps.fit(original.convert('RGB'), (1152, 512), Image.Resampling.LANCZOS)
    frames = []
    for i in range(24):
        t = i / 23
        amount = 1.025 + .025 * math.sin(math.pi * t) ** 2
        width, height = round(source.width / amount), round(source.height / amount)
        cx = source.width * (.5 + .012 * math.sin(2 * math.pi * t))
        cy = source.height * (.5 + .006 * math.sin(math.pi * t))
        x = max(0, min(source.width - width, round(cx - width / 2)))
        y = max(0, min(source.height - height, round(cy - height / 2)))
        frames.append(source.crop((x, y, x + width, y + height)).resize((576, 256), Image.Resampling.LANCZOS))
    return frames


def build(asset, generated):
    revision = generated.get('revision', 1)
    raw = OUT / 'raw' / (asset['id'] + (('-v%d' % revision) if revision > 1 else '') + '.png')
    raw.parent.mkdir(parents=True, exist_ok=True)
    if not raw.exists():
        shutil.copy2(generated['source'], raw)
    receipt = OUT / 'packaged' / (asset['id'] + '.json')
    previous = read(receipt) if receipt.exists() else None
    outputs = [asset['output']] + ([asset['end'], asset['sheet']] if asset['kind'] == 'scene' else [])
    if previous and previous['raw'] == raw.relative_to(ROOT).as_posix() and all(
            (ROOT / row['file']).exists() and digest(ROOT / row['file']) == row['sha256'] for row in previous['files']):
        return previous
    for rel in outputs:
        if (ROOT / rel).exists() and not previous:
            raise FileExistsError('기존 그림 보존: ' + rel)
    staged = []
    with Image.open(raw) as original:
        original_size = list(original.size)
        if asset['kind'] == 'scene':
            frames = scene_frames(original)
            for rel in outputs:
                (ROOT / rel).parent.mkdir(parents=True, exist_ok=True)
            gif = (ROOT / asset['output']).with_suffix('.build.tmp')
            palette_source = Image.new('RGB', (1152, 512))
            for i, n in enumerate((0, 7, 15, 23)):
                palette_source.paste(frames[n], (i % 2 * 576, i // 2 * 256))
            palette = palette_source.convert('P', palette=Image.Palette.ADAPTIVE, colors=128)
            quantized = [frame.quantize(palette=palette, dither=Image.Dither.FLOYDSTEINBERG) for frame in frames]
            quantized[0].save(gif, 'GIF', save_all=True, append_images=quantized[1:], duration=400, loop=0, disposal=1, optimize=False)
            end = (ROOT / asset['end']).with_suffix('.build.tmp')
            frames[-1].save(end, 'JPEG', quality=94, optimize=True)
            sheet = Image.new('RGB', (3456, 1024))
            for i, frame in enumerate(frames):
                sheet.paste(frame, (i % 6 * 576, i // 6 * 256))
            atlas = (ROOT / asset['sheet']).with_suffix('.build.tmp')
            sheet.save(atlas, 'WEBP', quality=90, method=4)
            staged = [(gif, asset['output']), (end, asset['end']), (atlas, asset['sheet'])]
            with Image.open(gif) as check:
                assert check.size == (576, 256) and check.n_frames >= 16, asset['id']
            extra = {'frames': len(frames), 'durationMs': 9600, 'size': [576, 256]}
        else:
            rgba = original.convert('RGBA')
            alpha = rgba.getchannel('A')
            low, high = alpha.getextrema()
            if low != 0 or high < 240 or alpha.histogram()[0] < rgba.width * rgba.height * .02:
                raise ValueError('투명 원화 확인 필요: ' + asset['id'])
            bounds = alpha.getbbox()
            assert bounds, asset['id']
            obj = rgba.crop(bounds)
            obj.thumbnail((228, 228), Image.Resampling.LANCZOS)
            icon = Image.new('RGBA', (256, 256))
            icon.paste(obj, ((256 - obj.width) // 2, (256 - obj.height) // 2))
            destination = ROOT / asset['output']
            destination.parent.mkdir(parents=True, exist_ok=True)
            temporary = destination.with_suffix('.build.tmp')
            icon.save(temporary, 'WEBP', quality=95, method=4, exact=True)
            with Image.open(temporary) as check:
                box = check.getchannel('A').getbbox()
                assert check.size == (256, 256) and check.mode == 'RGBA'
                assert min(box[0], box[1], 256 - box[2], 256 - box[3]) >= 13
            staged = [(temporary, asset['output'])]
            extra = {'size': [256, 256], 'alphaBounds': list(box)}
    files = [{'file': rel, 'bytes': temporary.stat().st_size, 'sha256': digest(temporary)} for temporary, rel in staged]
    record = {'id': asset['id'], 'name': asset['name'], 'kind': asset['kind'], 'disc': asset.get('disc'),
              'raw': raw.relative_to(ROOT).as_posix(), 'originalSize': original_size, 'files': files, **extra}
    write(receipt, record)
    for temporary, rel in staged:
        temporary.replace(ROOT / rel)
    return record


def previews(spec, records):
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 15)
    by_id = {row['id']: row for row in records}
    ready = [row for row in spec['assets'] if row['id'] in by_id]
    for kind, rows, columns, per_page, cell_w, cell_h in (
            ('scenes', [row for row in ready if row['kind'] == 'scene'], 3, 12, 320, 195),
            ('icons', [row for row in ready if row['kind'] != 'scene'], 5, 40, 200, 220)):
        for start in range(0, len(rows), per_page):
            group = rows[start:start + per_page]
            canvas = Image.new('RGB', (columns * cell_w, math.ceil(len(group) / columns) * cell_h), '#26252b')
            draw = ImageDraw.Draw(canvas)
            for i, row in enumerate(group):
                x, y = i % columns * cell_w, i // columns * cell_h
                with Image.open(ROOT / (row['end'] if kind == 'scenes' else row['output'])) as image:
                    obj = image.convert('RGBA')
                obj.thumbnail((304, 135) if kind == 'scenes' else (160, 160), Image.Resampling.LANCZOS)
                canvas.paste(obj, (x + (cell_w - obj.width) // 2, y), obj)
                lines, line = [], ''
                for char in row['name']:
                    if line and draw.textlength(line + char, font=font) > cell_w - 16:
                        lines.append(line.rstrip()); line = char.lstrip()
                    else:
                        line += char
                lines.append(line)
                for k, line in enumerate(lines[:3]):
                    draw.text((x + 8, y + (140 if kind == 'scenes' else 163) + k * 18), line, font=font, fill='white')
            canvas.save(OUT / ('preview-%s-%02d.jpg' % (kind, start // per_page + 1)), quality=92)
    cards = []
    for row in sorted(ready, key=lambda row: (row['kind'] != 'scene', row['disc'] or '', row['name'])):
        scene = row['kind'] == 'scene'
        preview = row['end'] if scene else row['output']
        cards.append('<figure class="%s"><a href="../../%s"><img loading="lazy" src="../../%s"></a><figcaption>%s<small>%s</small></figcaption></figure>' % (
            'scene' if scene else 'icon', html.escape(row['output'], quote=True), html.escape(preview, quote=True), html.escape(row['name']), html.escape(row['id'])))
    body = '<!doctype html><meta charset="utf-8"><title>발견물과 증빙 아이템 원화</title><style>body{margin:24px;background:#26252b;color:#eee;font:16px sans-serif}main{display:flex;flex-wrap:wrap;gap:12px}figure{margin:0;padding:10px;background:#33323a;width:180px}figure.scene{width:440px}img{width:100%%;height:180px;object-fit:contain}.scene img{height:196px}small{display:block;font-size:11px;color:#bab8c0;margin-top:6px}h1{font-size:26px}</style><h1>발견물·증빙 아이템 원화</h1><p>내장 ImageGen 원화 · %d/%d종 저장 · 그림을 누르면 게임용 파일이 열립니다.</p><main>%s</main>' % (len(ready), len(spec['assets']), ''.join(cards))
    (OUT / 'report.html').write_text(body, encoding='utf-8')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--partial', action='store_true')
    parser.add_argument('--preview-only', action='store_true')
    args = parser.parse_args()
    spec = read(SPEC)
    records, errors = [], []
    for asset in spec['assets']:
        receipt = OUT / 'packaged' / (asset['id'] + '.json')
        generated = OUT / 'generated' / (asset['id'] + '.json')
        if args.preview_only:
            if receipt.exists(): records.append(read(receipt))
            continue
        if not generated.exists():
            if not args.partial: errors.append({'id': asset['id'], 'error': '생성 원본 없음'})
            continue
        try:
            selected = read(generated)
            failure = generated.with_name(asset['id'] + '.error.json')
            if failure.exists():
                history = read(failure)
                history.update(resolved=True, selectedSource=selected['source'])
                write(failure, history)
            if selected.get('prompt') and selected['prompt'] != asset['prompt']:
                asset.setdefault('initialPrompt', asset['prompt'])
                asset['prompt'] = selected['prompt']
            asset['source'] = selected['source']
            records.append(build(asset, selected))
        except Exception as error:
            errors.append({'id': asset['id'], 'error': str(error)})
    if not args.preview_only: write(SPEC, spec)
    write(OUT / 'assets.json', records)
    write(OUT / 'package-errors.json', errors)
    if len(records) == len(spec['assets']) and not errors:
        write(Path(__file__).with_name('assets.json'), records)
    previews(spec, records)
    print(json.dumps({'packaged': len(records), 'planned': len(spec['assets']), 'errors': errors}, ensure_ascii=True))
    if errors: raise SystemExit(1)


if __name__ == '__main__':
    main()
