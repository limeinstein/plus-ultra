"""누락 이벤트 인물과 시기별 추가 모습의 얼굴·무릎상을 저장하고 등록한다."""
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
PLAN = ROOT / 'tools/missing_event_portraits_20261105_prompts.json'
ART = ROOT / 'artifacts/missing-event-portraits-20261105'


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
        assert half.size == (1024, 1536), ('무릎상 크기', row['id'], half.size)
        # 여러 이사가 함께 선 그림은 가운데 대표의 얼굴을 쓴다.
        face = (half.crop(row['face_crop']) if row.get('face_crop') else face_square(half)).resize((448, 448), Image.Resampling.LANCZOS)
        base = 'portraits/' + row['group'] + '/' + row['id']
        for suffix, picture in (('', face), ('_half', half)):
            key = base + suffix
            dest = ROOT / 'images' / (key + '.webp')
            dest.parent.mkdir(parents=True, exist_ok=True)
            if not dest.exists():
                picture.save(dest, 'WEBP', quality=95, method=4, exact=True)
            with Image.open(dest) as saved:
                saved.load()
                assert saved.size == picture.size and saved.mode == 'RGBA', key
                hist = saved.getchannel('A').histogram()
                clear = sum(hist[:8]) / (saved.width * saved.height)
                solid = sum(hist[240:]) / (saved.width * saved.height)
                assert clear > .015 and solid > .08, ('투명도', key, clear, solid)
            keys[key] = key + '.webp'
            exports.append(dest)
            checks.append({'key': key, 'size': list(picture.size), 'clear': clear, 'solid': solid})
        row['workspace_source'] = original.relative_to(ROOT).as_posix()
        row['face_file'] = 'images/' + base + '.webp'
        row['half_file'] = 'images/' + base + '_half.webp'
        tiles.append((row, half, face))
    manifest = ROOT / 'images/manifest.js'
    text = manifest.read_text(encoding='utf-8')
    match = re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', text)
    files = json.loads(match.group(1))
    files.update(keys)
    updated = text[:match.start()] + 'G.IMAGE_FILES = ' + json.dumps(dict(sorted(files.items())), ensure_ascii=False, indent=2) + ';' + text[match.end():]
    if updated != text:
        manifest.write_text(updated, encoding='utf-8', newline='\n')
    preview_files = []
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 24)
    for page, start in enumerate(range(0, len(tiles), 12), 1):
        subset = tiles[start:start + 12]
        preview = Image.new('RGB', (1600, ((len(subset) + 3) // 4) * 680), '#30373c')
        draw = ImageDraw.Draw(preview)
        for i, (row, half, face) in enumerate(subset):
            x, y = (i % 4) * 400, (i // 4) * 680
            thumb = half.copy()
            thumb.thumbnail((330, 495), Image.Resampling.LANCZOS)
            preview.paste(thumb, (x + (400 - thumb.width) // 2, y + 5), thumb)
            thumb = face.resize((126, 126), Image.Resampling.LANCZOS)
            preview.paste(thumb, (x + 137, y + 510), thumb)
            box = draw.textbbox((0, 0), row['name'], font=font)
            draw.text((x + (400 - box[2]) // 2, y + 643), row['name'], font=font, fill='#f1e8d6')
        dest = ROOT / ('docs/art/missing-event-portraits-20261105-preview-' + str(page) + '.jpg')
        preview.save(dest, quality=94)
        preview_files.append(dest)
    PLAN.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ART / 'keys.json').write_text(json.dumps(list(keys), indent=2) + '\n', encoding='utf-8')
    (ART / 'asset-checks.json').write_text(json.dumps(checks, indent=2) + '\n', encoding='utf-8')
    with zipfile.ZipFile(ART / 'missing-event-portraits-20261105.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for file in exports + [PLAN] + preview_files:
            archive.write(file, file.relative_to(ROOT).as_posix())
    print(str(len(tiles)) + ' portrait variants packaged; ' + str(len(checks)) + ' images registered.')


if __name__ == '__main__':
    main()
