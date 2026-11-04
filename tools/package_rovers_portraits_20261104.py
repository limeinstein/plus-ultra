"""바다의 사람들 13명의 ImageGen 원화를 얼굴상·무릎상으로 내보낸다."""
import argparse
import json
import re
import shutil
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
import cv2
from import_generated_portrait import face_square

cv2.setNumThreads(2)

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / 'tools/rovers_portraits_20261104_prompts.json'
ART = ROOT / 'artifacts/rovers-portraits-20261104'


def main():
    spec = json.loads(PLAN.read_text(encoding='utf-8'))
    parser = argparse.ArgumentParser()
    parser.add_argument('--refresh-id', action='append', default=[], choices=[r['id'] for r in spec['portraits']],
                        help='수정 요청한 인물의 기존 원본·게임용 파일을 보관하고 갱신한다')
    refresh = set(parser.parse_args().refresh_id)
    sources = ART / 'sources'
    sources.mkdir(parents=True, exist_ok=True)
    keys, checks, tiles, exports = {}, [], [], []
    for row in spec['portraits']:
        original = sources / (row['id'] + '.png')
        if row['id'] in refresh and original.exists():
            backup = ART / 'before-costume-face-revision' / original.name
            backup.parent.mkdir(parents=True, exist_ok=True)
            if not backup.exists():
                shutil.copy2(original, backup)
            shutil.copy2(row['source'], original)
        if not original.exists():
            shutil.copy2(row['source'], original)
        with Image.open(original) as opened:
            half = opened.convert('RGBA')
        if half.size != (1024, 1536):
            raise ValueError('무릎상 규격: ' + row['id'])
        face = face_square(half).resize((448, 448), Image.Resampling.LANCZOS)
        base = 'portraits/' + row['group'] + '/' + row['id']
        for suffix, picture in (('', face), ('_half', half)):
            key = base + suffix
            dest = ROOT / 'images' / (key + '.webp')
            dest.parent.mkdir(parents=True, exist_ok=True)
            if row['id'] in refresh and dest.exists():
                backup = ART / 'before-costume-face-revision' / dest.name
                if not backup.exists():
                    shutil.copy2(dest, backup)
            if not dest.exists() or row['id'] in refresh:
                picture.save(dest, 'WEBP', quality=95, method=6, exact=True)
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
    preview = Image.new('RGB', (1800, 4 * 710), '#30373c')
    draw = ImageDraw.Draw(preview)
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 22)
    for i, (row, half, face) in enumerate(tiles):
        x, y = (i % 4) * 450, (i // 4) * 710
        thumb = half.copy()
        thumb.thumbnail((344, 516), Image.Resampling.LANCZOS)
        preview.paste(thumb, (x + (450 - thumb.width) // 2, y + 6), thumb)
        thumb = face.resize((136, 136), Image.Resampling.LANCZOS)
        preview.paste(thumb, (x + 157, y + 530), thumb)
        title = row['name'].replace(' (얀 얀서 벨테브레이)', '')
        box = draw.textbbox((0, 0), title, font=font)
        draw.text((x + (450 - box[2]) // 2, y + 678), title, font=font, fill='#f1e8d6')
    preview_path = ROOT / 'docs/art/rovers-portraits-20261104-preview.jpg'
    preview.save(preview_path, quality=94)
    PLAN.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ART / 'keys.json').write_text(json.dumps(list(keys), indent=2) + '\n', encoding='utf-8')
    (ART / 'asset-checks.json').write_text(json.dumps(checks, indent=2) + '\n', encoding='utf-8')
    with zipfile.ZipFile(ART / 'rovers-portraits-20261104.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for file in exports + [PLAN, preview_path]:
            archive.write(file, file.relative_to(ROOT).as_posix())
        revision_plan = ROOT / 'tools/rovers_portraits_20261104_revisions.json'
        if revision_plan.exists():
            archive.write(revision_plan, revision_plan.relative_to(ROOT).as_posix())
    revised = [tile for tile in tiles if tile[0]['id'] in ('bonny', 'mread', 'omalley', 'rv_yiwonjin')]
    revision_preview = Image.new('RGB', (1800, 900), '#30373c')
    revision_draw = ImageDraw.Draw(revision_preview)
    for i, (row, half, face) in enumerate(revised):
        thumb = half.copy()
        thumb.thumbnail((420, 630), Image.Resampling.LANCZOS)
        revision_preview.paste(thumb, (i * 450 + (450 - thumb.width) // 2, 8), thumb)
        thumb = face.resize((176, 176), Image.Resampling.LANCZOS)
        revision_preview.paste(thumb, (i * 450 + 137, 660), thumb)
        revision_draw.text((i * 450 + 130, 856), row['name'], font=font, fill='#f1e8d6')
    revision_path = ROOT / 'docs/art/rovers-costume-face-revision-20261104-preview.jpg'
    revision_preview.save(revision_path, quality=94)
    with zipfile.ZipFile(ART / 'rovers-portraits-20261104.zip', 'a', zipfile.ZIP_DEFLATED) as archive:
        archive.write(revision_path, revision_path.relative_to(ROOT).as_posix())
    print('13명 얼굴상·무릎상 26장 저장·등록 완료')


if __name__ == '__main__':
    main()
