"""내장 ImageGen 원화 77종을 게임의 얼굴상·무릎상·사건샷으로 보관·등록한다."""
import argparse
import json
import re
import shutil
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps
from import_generated_portrait import face_square

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / 'tools/seasia_event_art_20261107_prompts.json'
ART = ROOT / 'artifacts/seasia-event-art-20261107'
DOC = ROOT / 'docs/art'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--partial', action='store_true', help='생성된 원화만 먼저 보관한다')
    args = parser.parse_args()
    plan = json.loads(PLAN.read_text(encoding='utf-8'))
    keys, checks, portrait_tiles, scene_tiles = {}, [], [], []
    for category in ('portraits', 'scenes'):
        record_dir = ART / 'records' if category == 'portraits' else ART / 'records/scenes'
        records = {p.stem: json.loads(p.read_text(encoding='utf-8')) for p in record_dir.glob('*.json')}
        for row in plan[category]:
            record = records.get(row['id'])
            if not record:
                if args.partial:
                    continue
                raise ValueError('생성 원화 없음: ' + row['id'])
            row.update(record)
            original = ART / 'sources' / category / (row['id'] + '.png')
            original.parent.mkdir(parents=True, exist_ok=True)
            if not original.exists():
                shutil.copy2(row['source'], original)
            row['workspace_source'] = original.relative_to(ROOT).as_posix()
            with Image.open(original) as opened:
                if category == 'portraits':
                    image = opened.convert('RGBA')
                    if image.size != (1024, 1536):
                        raise ValueError('무릎상 원화 크기: ' + row['id'] + str(image.size))
                    face = face_square(image).resize((448, 448), Image.Resampling.LANCZOS)
                    base = 'portraits/' + row['folder'] + '/' + row['id']
                    exports = [(base, face), (base + '_half', image)]
                    portrait_tiles.append((row, image, face))
                    row['face_file'] = 'images/' + base + '.webp'
                    row['half_file'] = 'images/' + base + '_half.webp'
                else:
                    image = ImageOps.fit(opened.convert('RGB'), (1881, 836), Image.Resampling.LANCZOS,
                                         centering=tuple(row.get('centering', [.5, .5])))
                    exports = [('legend-events/' + row['id'], image)]
                    scene_tiles.append((row, image))
                    row['file'] = 'images/legend-events/' + row['id'] + '.webp'
                for key, picture in exports:
                    dest = ROOT / 'images' / (key + '.webp')
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    if not dest.exists():
                        picture.save(dest, 'WEBP', quality=95, method=6, exact=True)
                    with Image.open(dest) as saved:
                        saved.load()
                        if saved.size != picture.size:
                            raise ValueError('크기 불일치: ' + key)
                        check = {'key': key, 'size': list(saved.size), 'bytes': dest.stat().st_size}
                        if category == 'portraits':
                            histogram = saved.convert('RGBA').getchannel('A').histogram()
                            total = saved.width * saved.height
                            check.update(clear=sum(histogram[:8]) / total, solid=sum(histogram[240:]) / total)
                            if check['clear'] < .025 or check['solid'] < .08:
                                raise ValueError('투명도 확인 필요: ' + key)
                        checks.append(check)
                    keys[key] = key + '.webp'
    manifest = ROOT / 'images/manifest.js'
    text = manifest.read_text(encoding='utf-8')
    match = re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', text)
    files = json.loads(match.group(1))
    files.update(keys)
    replacement = 'G.IMAGE_FILES = ' + json.dumps(dict(sorted(files.items())), ensure_ascii=False, indent=2) + ';'
    manifest.write_text(text[:match.start()] + replacement + text[match.end():], encoding='utf-8', newline='\n')
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 21)
    previews = []
    for start in range(0, len(portrait_tiles), 12):
        batch = portrait_tiles[start:start + 12]
        preview = Image.new('RGB', (350 * min(4, len(batch)), ((len(batch) + 3) // 4) * 500), '#252a30')
        draw = ImageDraw.Draw(preview)
        for i, (row, image, face) in enumerate(batch):
            x, y = i % 4 * 350, i // 4 * 500
            thumb = image.copy()
            thumb.thumbnail((310, 440), Image.Resampling.LANCZOS)
            preview.paste(thumb, (x + (350 - thumb.width) // 2, y), thumb)
            small = face.resize((120, 120), Image.Resampling.LANCZOS)
            preview.paste(small, (x + 225, y + 325), small)
            draw.text((x + 8, y + 460), row['name'], fill='#f1e5cc', font=font)
        name = 'seasia-event-art-20261107-portraits-' + str(start // 12 + 1) + '.jpg'
        preview.save(DOC / name, quality=93)
        previews.append(name)
    for start in range(0, len(scene_tiles), 8):
        batch = scene_tiles[start:start + 8]
        preview = Image.new('RGB', (1600, ((len(batch) + 1) // 2) * 400), '#252a30')
        draw = ImageDraw.Draw(preview)
        for i, (row, image) in enumerate(batch):
            x, y = i % 2 * 800, i // 2 * 400
            preview.paste(image.resize((780, 347), Image.Resampling.LANCZOS), (x + 10, y + 5))
            draw.text((x + 12, y + 362), row['title'], fill='#f1e5cc', font=font)
        name = 'seasia-event-art-20261107-scenes-' + str(start // 8 + 1) + '.jpg'
        preview.save(DOC / name, quality=93)
        previews.append(name)
    PLAN.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ART / 'asset-checks.json').write_text(json.dumps(checks, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ART / 'keys.json').write_text(json.dumps(list(keys), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    if not args.partial:
        archive = ART / 'seasia-event-art-20261107.zip'
        with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
            for key in keys:
                p = ROOT / 'images' / (key + '.webp')
                z.write(p, p.relative_to(ROOT).as_posix())
            z.write(PLAN, PLAN.relative_to(ROOT).as_posix())
            for name in previews:
                z.write(DOC / name, 'preview/' + name)
    print(json.dumps({'portraits': len(portrait_tiles), 'scenes': len(scene_tiles), 'files': len(keys)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
