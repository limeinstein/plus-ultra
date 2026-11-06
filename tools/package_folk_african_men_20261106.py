"""아프리카계 민족 발견물 남성 후보 12명의 얼굴·무릎상을 저장하고 등록한다."""
import json
import re
import shutil
import sys
import zipfile
from pathlib import Path

import cv2
from PIL import Image, ImageDraw, ImageFont
from import_generated_portrait import face_square

cv2.setNumThreads(2)
ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / 'tools/folk_african_men_20261106_prompts.json'
ART = ROOT / 'artifacts/folk-african-men-20261106'
PREVIEW = ROOT / 'docs/art/folk-african-men-20261106-preview.jpg'


def main():
    spec = json.loads(PLAN.read_text(encoding='utf-8-sig'))
    source_dir = ART / 'sources'
    source_dir.mkdir(parents=True, exist_ok=True)
    keys, checks, tiles, exports = {}, [], [], []
    for row in spec['portraits']:
        original = source_dir / (row['id'] + '.png')
        refresh = '--refresh' in sys.argv
        if not original.exists() or refresh:
            shutil.copy2(row['source'], original)
        with Image.open(original) as opened:
            half = opened.convert('RGBA')
        assert half.size == (1024, 1536), (row['id'], half.size)
        corners = [(0, 0), (1023, 0), (0, 1535), (1023, 1535)]
        assert max(half.getpixel(p)[3] for p in corners) < 8, ('배경 조각', row['id'])
        face = face_square(half)
        for suffix, picture in (('', face), ('_half', half)):
            key = row['key'] + suffix
            dest = ROOT / 'images' / (key + '.webp')
            dest.parent.mkdir(parents=True, exist_ok=True)
            if not dest.exists() or refresh:
                temporary = dest.with_name(dest.name + '.tmp')
                picture.save(temporary, 'WEBP', quality=95, method=6, exact=True)
                temporary.replace(dest)
            with Image.open(dest) as saved:
                saved.load()
                assert saved.size == picture.size and saved.mode == 'RGBA', key
                hist = saved.getchannel('A').histogram()
                clear = sum(hist[:8]) / (saved.width * saved.height)
                solid = sum(hist[240:]) / (saved.width * saved.height)
                assert clear > .01 and solid > .08, ('투명도', key, clear, solid)
            keys[key] = key + '.webp'
            exports.append(dest)
            checks.append({'key': key, 'size': list(picture.size), 'clear': clear, 'solid': solid})
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

    # 각 칸에 원화와 같은 원화에서 자른 얼굴을 나란히 보여 준다.
    preview = Image.new('RGB', (1800, 3 * 650), '#293239')
    draw = ImageDraw.Draw(preview)
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 23)
    for i, (row, half, face) in enumerate(tiles):
        x, y = (i % 4) * 450, (i // 4) * 650
        thumb = half.copy()
        thumb.thumbnail((300, 540), Image.Resampling.LANCZOS)
        preview.paste(thumb, (x + 10 + (300 - thumb.width) // 2, y + 10), thumb)
        thumb = face.resize((132, 132), Image.Resampling.LANCZOS)
        preview.paste(thumb, (x + 310, y + 175), thumb)
        draw.text((x + 100, y + 571), row['name'], font=font, fill='#f3e8d5')
        draw.text((x + 100, y + 607), '얼굴상 · 무릎상', font=font, fill='#c5cacf')
    preview.save(PREVIEW, quality=94)
    PLAN.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ART / 'keys.json').write_text(json.dumps(list(keys), indent=2) + '\n', encoding='utf-8')
    (ART / 'asset-checks.json').write_text(json.dumps(checks, indent=2) + '\n', encoding='utf-8')
    with zipfile.ZipFile(ART / 'folk-african-men-20261106.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for file in exports + [PLAN, PREVIEW]:
            archive.write(file, file.relative_to(ROOT).as_posix())
    print('12명 얼굴상 512×512·무릎상 1024×1536, 투명 WebP 24장·원본 PNG·미리보기·ZIP 저장·등록 완료')


if __name__ == '__main__':
    main()
