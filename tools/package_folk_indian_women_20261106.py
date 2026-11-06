"""인도 여성 항해사 원화 8종에서 같은 얼굴상·무릎상을 저장하고 등록한다."""
import json
import re
import shutil
import zipfile
from pathlib import Path

import cv2
from PIL import Image, ImageDraw, ImageFont
from import_generated_portrait import face_square

cv2.setNumThreads(2)
ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / 'tools/folk_indian_women_20261106_prompts.json'
ART = ROOT / 'artifacts/folk-indian-women-20261106'
PREVIEW = ROOT / 'docs/art/folk-indian-women-20261106-preview.jpg'


def main():
    spec = json.loads(PLAN.read_text(encoding='utf-8'))
    sources = ART / 'sources'
    sources.mkdir(parents=True, exist_ok=True)
    keys, checks, tiles, exports = {}, [], [], []
    for row in spec['portraits']:
        original = sources / (row['id'] + '.png')
        if not original.exists():
            shutil.copy2(row['source'], original)
        with Image.open(original) as opened:
            half = opened.convert('RGBA')
        assert half.size == (1024, 1536), row['id']
        face = face_square(half)
        for suffix, picture in (('', face), ('_half', half)):
            key = row['key'] + suffix
            dest = ROOT / 'images' / (key + '.webp')
            dest.parent.mkdir(parents=True, exist_ok=True)
            if not dest.exists():
                picture.save(dest, 'WEBP', quality=95, method=6, exact=True)
            with Image.open(dest) as saved:
                saved.load()
                assert saved.size == picture.size and saved.mode == 'RGBA', key
                hist = saved.getchannel('A').histogram()
                clear = sum(hist[:8]) / (saved.width * saved.height)
                solid = sum(hist[240:]) / (saved.width * saved.height)
                assert clear > .01 and solid > .08, (key, clear, solid)
            keys[key] = key + '.webp'
            checks.append({'key': key, 'size': list(picture.size), 'clear': clear, 'solid': solid})
            exports.append(dest)
        row['workspace_source'] = original.relative_to(ROOT).as_posix()
        row['face_file'] = 'images/' + row['key'] + '.webp'
        row['half_file'] = 'images/' + row['key'] + '_half.webp'
        tiles.append((row, half, face))
    manifest = ROOT / 'images/manifest.js'
    text = manifest.read_text(encoding='utf-8')
    match = re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', text)
    files = json.loads(match.group(1))
    files.update(keys)
    updated = text[:match.start()] + 'G.IMAGE_FILES = ' + json.dumps(dict(sorted(files.items())), ensure_ascii=False, indent=2) + ';' + text[match.end():]
    if updated != text:
        manifest.write_text(updated, encoding='utf-8', newline='\n')
    preview = Image.new('RGB', (1800, 1300), '#293239')
    draw = ImageDraw.Draw(preview)
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 23)
    for i, (row, half, face) in enumerate(tiles):
        x, y = (i % 4) * 450, (i // 4) * 650
        thumb = half.copy()
        thumb.thumbnail((300, 540), Image.Resampling.LANCZOS)
        preview.paste(thumb, (x + 10 + (300 - thumb.width) // 2, y + 10), thumb)
        thumb = face.resize((132, 132), Image.Resampling.LANCZOS)
        preview.paste(thumb, (x + 310, y + 175), thumb)
        draw.text((x + 55, y + 571), row['id'] + ' ' + row['name'], font=font, fill='#f3e8d5')
        draw.text((x + 100, y + 607), '얼굴상 · 무릎상', font=font, fill='#c5cacf')
    PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    preview.save(PREVIEW, quality=94)
    PLAN.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ART / 'asset-checks.json').write_text(json.dumps(checks, indent=2) + '\n', encoding='utf-8')
    with zipfile.ZipFile(ART / 'folk-indian-women-20261106.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for file in exports + [PLAN, PREVIEW]:
            archive.write(file, file.relative_to(ROOT).as_posix())
    print('인도 여성 후보 8종 얼굴상·무릎상 16장 저장·등록·미리보기·ZIP 완료')


if __name__ == '__main__':
    main()
