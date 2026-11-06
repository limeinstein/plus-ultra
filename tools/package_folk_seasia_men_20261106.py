"""동남아 민족 발견물 남성 5종의 원화·얼굴상·무릎상을 보관하고 등록한다."""
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
PLAN = ROOT / 'tools/folk_seasia_men_20261106_prompts.json'
ART = ROOT / 'artifacts/folk-seasia-men-20261106'
PREVIEW = ROOT / 'docs/art/folk-seasia-men-20261106-preview.jpg'


def main():
    spec = json.loads(PLAN.read_text(encoding='utf-8'))
    sources = ART / 'sources'
    sources.mkdir(parents=True, exist_ok=True)
    keys, checks, exports = {}, [], []
    preview = Image.new('RGB', (2000, 820), '#293239')
    draw = ImageDraw.Draw(preview)
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 23)
    for i, row in enumerate(spec['portraits']):
        original = sources / (row['id'] + '.png')
        if not original.exists():
            shutil.copy2(row['source'], original)
        with Image.open(original) as opened:
            half = opened.convert('RGBA')
        assert half.size == (1024, 1536), (row['id'], half.size)
        face = face_square(half)
        base = 'portraits/mates/folk_' + row['id'] + '_m'
        for suffix, picture in (('', face), ('_half', half)):
            key = base + suffix
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
                assert clear > .02 and solid > .08, ('투명도', key, clear, solid)
            keys[key] = key + '.webp'
            exports.append(dest)
            checks.append({'key': key, 'size': list(picture.size), 'clear': clear, 'solid': solid})
        row.update(workspace_source=original.relative_to(ROOT).as_posix(), key=base,
                   face_file='images/' + base + '.webp', half_file='images/' + base + '_half.webp')
        x = i * 400
        thumb = half.copy()
        thumb.thumbnail((380, 560), Image.Resampling.LANCZOS)
        preview.paste(thumb, (x + (400 - thumb.width) // 2, 5), thumb)
        thumb = face.resize((160, 160), Image.Resampling.LANCZOS)
        preview.paste(thumb, (x + 120, 580), thumb)
        label = row['name']
        box = draw.textbbox((0, 0), label, font=font)
        draw.text((x + (400 - box[2]) // 2, 770), label, font=font, fill='#f4e7ce')
    # 공유 등록부는 저장 직전에 다시 읽어 다른 작업의 새 항목도 보존한다.
    manifest = ROOT / 'images/manifest.js'
    text = manifest.read_text(encoding='utf-8')
    match = re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', text)
    files = json.loads(match.group(1))
    files.update(keys)
    manifest.write_text(text[:match.start()] + 'G.IMAGE_FILES = ' + json.dumps(dict(sorted(files.items())), ensure_ascii=False, indent=2) + ';' + text[match.end():], encoding='utf-8', newline='\n')
    PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    preview.save(PREVIEW, quality=94)
    PLAN.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ART / 'keys.json').write_text(json.dumps(list(keys), indent=2) + '\n', encoding='utf-8')
    (ART / 'asset-checks.json').write_text(json.dumps(checks, indent=2) + '\n', encoding='utf-8')
    with zipfile.ZipFile(ART / 'folk-seasia-men-20261106.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for file in exports + list(sources.glob('*.png')) + [PLAN, PREVIEW]:
            archive.write(file, file.relative_to(ROOT).as_posix())
    print('남성 5종: 얼굴상 512×512·무릎상 1024×1536, 투명 WebP 10장·원본 PNG·미리보기·ZIP 저장·등록 완료')


if __name__ == '__main__':
    main()
