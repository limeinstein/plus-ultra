"""아프리카 다섯 이야기 원화를 얼굴·무릎상·사건 장면으로 내보낸다."""
import argparse
import json
import re
import shutil
import zipfile
from pathlib import Path

import cv2
from PIL import Image, ImageDraw, ImageFont, ImageOps
from import_generated_portrait import face_square

cv2.setNumThreads(2)
ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / 'tools/africa17_art_20261104_prompts.json'
ART = ROOT / 'artifacts/africa17-art-20261104'
DOC = ROOT / 'docs/art'


def keep_source(row, kind):
    original = ART / 'sources' / kind / (row['id'] + '.png')
    original.parent.mkdir(parents=True, exist_ok=True)
    if not original.exists():
        shutil.copy2(row['source'], original)
    row['workspace_source'] = original.relative_to(ROOT).as_posix()
    return original


def portrait_preview(rows, filename):
    sheet = Image.new('RGB', (1800, 850), '#293039')
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 25)
    for i, row in enumerate(rows):
        image = Image.open(ROOT / row['half_file']).convert('RGBA')
        image.thumbnail((348, 600), Image.Resampling.LANCZOS)
        x = i * 360
        sheet.paste(image, (x + (360-image.width)//2, 8), image)
        face = Image.open(ROOT / row['face_file']).convert('RGBA').resize((170, 170), Image.Resampling.LANCZOS)
        sheet.paste(face, (x + 95, 620), face)
        label = row['name']
        box = draw.textbbox((0, 0), label, font=font)
        draw.text((x+(360-box[2])/2, 803), label, font=font, fill='#f0e5cf')
    sheet.save(DOC / filename, quality=95)
    return DOC / filename


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--portraits-only', action='store_true', help='사건 장면을 기다리는 동안 초상만 내보낸다')
    args = parser.parse_args()
    spec = json.loads(PLAN.read_text(encoding='utf-8'))
    keys, checks, exports = {}, [], []
    for row in spec['portraits']:
        original = keep_source(row, 'portraits')
        image = Image.open(original).convert('RGBA')
        if image.size != (1024, 1536):
            raise ValueError('무릎상 크기: ' + row['id'] + str(image.size))
        face = face_square(image)
        prefix = 'portraits/' + row['dir'] + '/' + row['id']
        row['face_file'] = 'images/' + prefix + '.webp'
        row['half_file'] = 'images/' + prefix + '_half.webp'
        for suffix, pic in (('', face), ('_half', image)):
            key = prefix + suffix
            dest = ROOT / 'images' / (key + '.webp')
            dest.parent.mkdir(parents=True, exist_ok=True)
            if not dest.exists():
                pic.save(dest, 'WEBP', quality=95, method=6, exact=True)
            with Image.open(dest) as saved:
                saved.load()
                if saved.size != pic.size or saved.mode != 'RGBA':
                    raise ValueError('규격·알파: ' + key)
                hist = saved.getchannel('A').histogram()
                clear = sum(hist[:8]) / (saved.width*saved.height)
                solid = sum(hist[240:]) / (saved.width*saved.height)
                if clear < .025 or solid < .08:
                    raise ValueError('투명 배경: ' + key)
            keys[key] = key + '.webp'
            checks.append({'key': key, 'size': list(pic.size), 'clear': clear, 'solid': solid})
            exports.append(dest)
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 25)
    scene_sheet = Image.new('RGB', (1680, 5*414), '#293039')
    draw = ImageDraw.Draw(scene_sheet)
    scenes = [] if args.portraits_only else spec['scenes']
    for i, row in enumerate(scenes):
        original = keep_source(row, 'scenes')
        image = Image.open(original).convert('RGB')
        # 장면 비율을 보존하고 표준 9:4 화면에 필요한 최소 여백만 자른다.
        image = ImageOps.fit(image, (1881, 836), Image.Resampling.LANCZOS)
        key = 'legend-events/' + row['id']
        dest = ROOT / 'images' / (key + '.webp')
        if not dest.exists():
            image.save(dest, 'WEBP', quality=95, method=6)
        with Image.open(dest) as saved:
            saved.load()
            if saved.size != (1881, 836):
                raise ValueError('장면 크기: ' + key)
        row['file'] = dest.relative_to(ROOT).as_posix()
        keys[key] = key + '.webp'
        exports.append(dest)
        checks.append({'key': key, 'size': [1881, 836]})
        x, y = (i%2)*840, (i//2)*414
        scene_sheet.paste(image.resize((820, 364), Image.Resampling.LANCZOS), (x+10, y+5))
        draw.text((x+15, y+373), row['name'], font=font, fill='#f0e5cf')
    scene_path = DOC / 'africa17-scenes-20261104-preview.jpg'
    if scenes:
        scene_sheet.save(scene_path, quality=94)
    previews = [portrait_preview(spec['portraits'][:5], 'africa17-women-20261104-preview.jpg'),
                portrait_preview(spec['portraits'][5:], 'africa17-supporting-20261104-preview.jpg')]
    if scenes:
        previews.append(scene_path)
    manifest = ROOT / 'images/manifest.js'
    old = manifest.read_text(encoding='utf-8')
    match = re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', old)
    files = json.loads(match.group(1))
    files.update(keys)
    replacement = 'G.IMAGE_FILES = ' + json.dumps(dict(sorted(files.items())), ensure_ascii=False, indent=2) + ';'
    updated = old[:match.start()] + replacement + old[match.end():]
    if updated != old:
        manifest.write_text(updated, encoding='utf-8', newline='\n')
    PLAN.write_text(json.dumps(spec, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    (ART/'keys.json').write_text(json.dumps(list(keys), indent=2)+'\n', encoding='utf-8')
    (ART/'portrait-keys.json').write_text(json.dumps([k for k in keys if k.startswith('portraits/')], indent=2)+'\n', encoding='utf-8')
    (ART/'asset-checks.json').write_text(json.dumps(checks, indent=2)+'\n', encoding='utf-8')
    with zipfile.ZipFile(ART/'africa17-art-20261104.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for file in exports + previews + [PLAN]:
            archive.write(file, file.relative_to(ROOT).as_posix())
    print(f'인물 {len(spec["portraits"])}명, 얼굴·무릎상 {len(spec["portraits"])*2}장, 사건 장면 {len(scenes)}장 저장·등록 완료')


if __name__ == '__main__':
    main()
