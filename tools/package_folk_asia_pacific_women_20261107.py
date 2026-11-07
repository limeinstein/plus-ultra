"""중국·동남아·폴리네시아 여성 20종의 투명 원본·얼굴·무릎상·미리보기·묶음을 저장한다."""
import json
import math
import re
import shutil
import zipfile
from pathlib import Path

import cv2
from PIL import Image, ImageDraw, ImageFont
from import_generated_portrait import face_square

cv2.setNumThreads(2)
ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / 'tools/folk_asia_pacific_women_20261107_prompts.json'
ART = ROOT / 'artifacts/folk-asia-pacific-women-20261107'
PREVIEW = ROOT / 'docs/art/folk-asia-pacific-women-20261107-preview.jpg'


def main():
    spec = json.loads(PLAN.read_text(encoding='utf-8-sig'))
    results = json.loads((ART / 'generation-results.json').read_text(encoding='utf-8'))
    sources = ART / 'sources'
    sources.mkdir(parents=True, exist_ok=True)
    references = ART / 'references'
    references.mkdir(exist_ok=True)
    for row in spec['portraits']:
        for ref in row['refs']:
            target = references / Path(ref).name
            if not target.exists():
                shutil.copy2(ref, target)
        for i, old in enumerate(results[row['id']].get('revisions', [])):
            if old.get('source'):
                target = ART / 'revisions' / (row['id'] + '_' + str(i + 1) + '.png')
                target.parent.mkdir(exist_ok=True)
                if not target.exists():
                    shutil.copy2(old['source'], target)
                old['workspace_source'] = target.relative_to(ROOT).as_posix()
    checks, exports, tiles, keys = [], [], [], {}
    for row in spec['portraits']:
        row.update(results[row['id']])
        original = ROOT / row['workspace_source'] if row.get('workspace_source') else sources / (row['id'] + '.png')
        if not original.exists():
            shutil.copy2(row['source'], original)
        with Image.open(original) as opened:
            assert opened.mode == 'RGBA', row['id']
            half = opened.copy()
        assert half.size == (1024, 1536), (row['id'], half.size)
        face = face_square(half).resize((448, 448), Image.Resampling.LANCZOS)
        for suffix, picture in (('', face), ('_half', half)):
            key = row['face_key'] + suffix
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
                assert clear > .015 and solid > .08, (key, clear, solid)
                alpha_same = saved.getchannel('A').tobytes() == picture.getchannel('A').tobytes()
                assert alpha_same, key + ' 알파 보존'
            keys[key] = key + '.webp'
            exports.append(dest)
            checks.append({'key': key, 'size': list(picture.size), 'clear': clear, 'solid': solid, 'alpha_preserved': alpha_same})
        row['workspace_source'] = original.relative_to(ROOT).as_posix()
        row['workspace_refs'] = [(ART / 'references' / Path(ref).name).relative_to(ROOT).as_posix() for ref in row['refs']]
        row['face_file'] = 'images/' + row['face_key'] + '.webp'
        row['half_file'] = 'images/' + row['face_key'] + '_half.webp'
        tiles.append((row, half, face))
    manifest = ROOT / 'images/manifest.js'
    text = manifest.read_text(encoding='utf-8')
    match = re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', text)
    files = json.loads(match.group(1))
    files.update(keys)
    updated = text[:match.start()] + 'G.IMAGE_FILES = ' + json.dumps(dict(sorted(files.items())), ensure_ascii=False, indent=2) + ';' + text[match.end():]
    if updated != text:
        manifest.write_text(updated, encoding='utf-8', newline='\n')
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 22)
    for region in [None, '중국', '동남아', '폴리네시아']:
        subset = [t for t in tiles if region is None or t[0]['region'] == region]
        cols = min(6, len(subset))
        preview = Image.new('RGB', (cols * 300, math.ceil(len(subset) / cols) * 600), '#30373c')
        draw = ImageDraw.Draw(preview)
        for i, (row, half, face) in enumerate(subset):
            x, y = (i % cols) * 300, (i // cols) * 600
            thumb = half.copy()
            thumb.thumbnail((290, 425), Image.Resampling.LANCZOS)
            preview.paste(thumb, (x + (300 - thumb.width) // 2, y + 2), thumb)
            thumb = face.resize((125, 125), Image.Resampling.LANCZOS)
            preview.paste(thumb, (x + 87, y + 430), thumb)
            label = row['region'] + ' · ' + row['name']
            box = draw.textbbox((0, 0), label, font=font)
            draw.text((x + (300 - box[2]) // 2, y + 565), label, font=font, fill='#f1e8d6')
        output = PREVIEW if region is None else PREVIEW.with_name(PREVIEW.stem.replace('-preview', '-' + {'중국':'china','동남아':'seasia','폴리네시아':'polynesia'}[region] + '-preview') + '.jpg')
        output.parent.mkdir(parents=True, exist_ok=True)
        preview.save(output, quality=94)
    PLAN.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ART / 'asset-checks.json').write_text(json.dumps(checks, indent=2) + '\n', encoding='utf-8')
    (ART / 'keys.json').write_text(json.dumps(list(keys), indent=2) + '\n', encoding='utf-8')
    with zipfile.ZipFile(ART / 'folk-asia-pacific-women-20261107.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for file in exports + [PLAN, PREVIEW, ROOT / 'docs/art/folk-asia-pacific-women-20261107.md', ART / 'asset-checks.json']:
            archive.write(file, file.relative_to(ROOT).as_posix())
    print('중국·동남아·폴리네시아 여성 20종 얼굴상·무릎상 40장 저장·등록·미리보기·ZIP 완료')


if __name__ == '__main__':
    main()
