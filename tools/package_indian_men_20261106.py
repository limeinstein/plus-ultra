"""첨부 사진을 참고한 인도계 일반 남성 후보의 그림과 검수 묶음을 저장한다."""
import json
import re
import shutil
import sys
import zipfile
from pathlib import Path

import cv2
from PIL import Image, ImageDraw, ImageFont
from import_generated_portrait import face_square
import protagonist_portraits as portrait_tools

cv2.setNumThreads(2)
ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / 'tools/folk_indian_men_20261106_prompts.json'
ART = ROOT / 'artifacts/indian-men-illustrated-20261106'
PREVIEW = ROOT / 'docs/art/indian-men-illustrated-20261106-preview.jpg'


def game_face(image):
    """플레이어 초상처럼 머리 전체와 어깨가 들어오게 얼굴상을 내보낸다."""
    fallback = face_square(image)  # Windows 한글 경로의 얼굴 모델도 준비한다.
    found = portrait_tools.detect_face(image)
    if not found:
        return fallback
    x, y, width, height = found
    solid = image.getchannel('A').point(lambda value: 255 if value >= 240 else 0).getbbox()
    top = (solid[1] if solid else 0) - height * .08
    side = max(width * 2.8, height * 2.6, (y + height - top) * 1.3)
    left = x + width / 2 - side / 2
    return image.crop((round(left), round(top), round(left + side), round(top + side))).resize((512, 512), Image.Resampling.LANCZOS)


def main():
    spec = json.loads(PLAN.read_text(encoding='utf-8'))
    refresh = '--refresh' in sys.argv
    source_dir = ART / 'sources'
    source_dir.mkdir(parents=True, exist_ok=True)
    if refresh:
        previous = ART / 'previous-graphic-style'
        old_files = list(source_dir.glob('*.png')) + list((ROOT / 'images/portraits/mates/indian-men').glob('*.webp')) + ([PREVIEW] if PREVIEW.exists() else [])
        for old in old_files:
            dest = previous / (old.relative_to(ART) if old.is_relative_to(ART) else old.relative_to(ROOT))
            dest.parent.mkdir(parents=True, exist_ok=True)
            if not dest.exists():
                shutil.copy2(old, dest)
    keys, checks, tiles, exports = {}, [], [], []
    for row in spec['portraits']:
        original = source_dir / (row['id'] + '.png')
        if not original.exists() or refresh:
            shutil.copy2(row['source'], original)
        with Image.open(original) as opened:
            half = opened.convert('RGBA')
        assert half.size == (1024, 1536), (row['id'], half.size)
        assert max(half.getpixel(p)[3] for p in [(0, 0), (1023, 0), (0, 1535), (1023, 1535)]) < 8
        face = game_face(half)
        for suffix, picture in (('', face), ('_half', half)):
            key = row['key'] + suffix
            dest = ROOT / 'images' / (key + '.webp')
            dest.parent.mkdir(parents=True, exist_ok=True)
            if not dest.exists() or refresh or (not suffix and '--refresh-faces' in sys.argv):
                picture.save(dest, 'WEBP', quality=95, method=6, exact=True)
            with Image.open(dest) as saved:
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

    preview = Image.new('RGB', (1800, 1300), '#303943')
    draw = ImageDraw.Draw(preview)
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 22)
    for i, (row, half, face) in enumerate(tiles):
        x, y = (i % 4) * 450, (i // 4) * 650
        thumb = half.copy()
        thumb.thumbnail((300, 540), Image.Resampling.LANCZOS)
        preview.paste(thumb, (x + 10 + (300 - thumb.width) // 2, y + 10), thumb)
        thumb = face.resize((132, 132), Image.Resampling.LANCZOS)
        preview.paste(thumb, (x + 310, y + 175), thumb)
        draw.text((x + 70, y + 571), row['id'] + ' ' + row['name'], font=font, fill='#f3e8d5')
        draw.text((x + 115, y + 607), '얼굴상 · 무릎상', font=font, fill='#c5cacf')
    preview.save(PREVIEW, quality=94)
    # 실제 게임 원화와 새 얼굴을 같은 크기로 놓고 화풍을 비교한다.
    comparison = ART / 'style-comparison.jpg'
    style_rows = spec.get('style_references', [])
    if style_rows:
        sheet = Image.new('RGB', ((len(style_rows) + 1) * 300, 350), '#303943')
        labels = ImageDraw.Draw(sheet)
        for index, ref in enumerate(style_rows):
            with Image.open(ROOT / ref['path']) as opened:
                head = game_face(opened.convert('RGBA')).resize((288, 288), Image.Resampling.LANCZOS)
            sheet.paste(head, (index * 300 + 6, 5), head)
            labels.text((index * 300 + 12, 310), ref['label'], font=font, fill='#f3e8d5')
        head = tiles[0][2].resize((288, 288), Image.Resampling.LANCZOS)
        sheet.paste(head, (len(style_rows) * 300 + 6, 5), head)
        labels.text((len(style_rows) * 300 + 12, 310), '수정한 인도계 후보', font=font, fill='#f3e8d5')
        sheet.save(comparison, quality=94)
    PLAN.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ART / 'keys.json').write_text(json.dumps(list(keys), indent=2) + '\n', encoding='utf-8')
    (ART / 'asset-checks.json').write_text(json.dumps(checks, indent=2) + '\n', encoding='utf-8')
    with zipfile.ZipFile(ART / 'indian-men-illustrated-20261106.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        evidence = [ART / 'asset-checks.json', ART / 'runtime-checks.json', ART / 'dialog-preview.png', ART / 'runtime-preview.png', comparison, ROOT / 'docs/art/indian-men-illustrated-20261106.md']
        for file in exports + [PLAN, PREVIEW] + list(source_dir.glob('*.png')) + [f for f in evidence if f.exists()]:
            archive.write(file, file.relative_to(ROOT).as_posix())
    print('남성 8명: 얼굴상 512x512, 무릎상 1024x1536, 투명 WebP 16장, 원본 PNG 8장, 미리보기, ZIP 저장·등록 완료')


if __name__ == '__main__':
    main()
