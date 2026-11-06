"""아메리카 민족 발견물 남성 22종의 원화·얼굴상·무릎상을 보관하고 등록한다."""
import argparse
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
PLAN = ROOT / 'tools/folk_american_men_20261106_prompts.json'
ART = ROOT / 'artifacts/folk-american-men-20261106'
DOC = ROOT / 'docs/art'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--partial', action='store_true', help='생성이 끝난 원화만 먼저 규격 변환한다. 최종 ZIP·등록은 하지 않는다.')
    args = parser.parse_args()
    spec = json.loads(PLAN.read_text(encoding='utf-8'))
    assert len(spec['portraits']) == 22
    sources = ART / 'sources'
    sources.mkdir(parents=True, exist_ok=True)
    ready = []
    for row in spec['portraits']:
        record = ART / 'generated' / (row['id'] + '.json')
        if not record.exists():
            if args.partial:
                continue
            raise RuntimeError('미완성 원화: ' + row['id'])
        generated = json.loads(record.read_text(encoding='utf-8'))
        assert generated['id'] == row['id']
        row['source'] = generated['source']
        ready.append(row)
    keys, checks, exports, tiles = {}, [], [], []
    for row in ready:
        original = sources / (row['id'] + '.png')
        if not original.exists():
            shutil.copy2(row['source'], original)
        with Image.open(original) as opened:
            half = opened.convert('RGBA')
        assert half.size == (1024, 1536), (row['id'], half.size)
        face = face_square(half)
        base = row['key']
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
        row.update(workspace_source=original.relative_to(ROOT).as_posix(),
                   face_file='images/' + base + '.webp', half_file='images/' + base + '_half.webp')
        tiles.append((row, half, face))
        print(row['id'] + ' 얼굴·무릎상 완료', flush=True)
    if args.partial:
        print(str(len(ready)) + '종 규격 변환. 전체 원화 완성 뒤 옵션 없이 실행한다.')
        return
    # 다른 초상 작업의 등록 항목도 보존하도록 저장 직전에 공유 등록부를 읽는다.
    manifest = ROOT / 'images/manifest.js'
    text = manifest.read_text(encoding='utf-8')
    match = re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', text)
    files = json.loads(match.group(1))
    files.update(keys)
    manifest.write_text(text[:match.start()] + 'G.IMAGE_FILES = ' + json.dumps(dict(sorted(files.items())), ensure_ascii=False, indent=2) + ';' + text[match.end():], encoding='utf-8', newline='\n')
    previews = []
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 23)
    for page, start in enumerate(range(0, len(tiles), 12), 1):
        subset = tiles[start:start + 12]
        preview = Image.new('RGB', (1600, ((len(subset) + 3) // 4) * 720), '#293239')
        draw = ImageDraw.Draw(preview)
        for i, (row, half, face) in enumerate(subset):
            x, y = (i % 4) * 400, (i // 4) * 720
            thumb = half.copy()
            thumb.thumbnail((370, 480), Image.Resampling.LANCZOS)
            preview.paste(thumb, (x + (400 - thumb.width) // 2, y + 5), thumb)
            thumb = face.resize((150, 150), Image.Resampling.LANCZOS)
            preview.paste(thumb, (x + 125, y + 505), thumb)
            label = row['name']
            box = draw.textbbox((0, 0), label, font=font)
            draw.text((x + (400 - box[2]) // 2, y + 678), label, font=font, fill='#f4e7ce')
        dest = DOC / ('folk-american-men-20261106-preview-' + str(page) + '.jpg')
        dest.parent.mkdir(parents=True, exist_ok=True)
        preview.save(dest, quality=94)
        previews.append(dest)
    PLAN.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ART / 'keys.json').write_text(json.dumps(list(keys), indent=2) + '\n', encoding='utf-8')
    (ART / 'asset-checks.json').write_text(json.dumps(checks, indent=2) + '\n', encoding='utf-8')
    with zipfile.ZipFile(ART / 'folk-american-men-20261106.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for file in exports + list(sources.glob('*.png')) + [PLAN] + previews:
            archive.write(file, file.relative_to(ROOT).as_posix())
    print('남성 22종: 얼굴상 512×512·무릎상 1024×1536, 투명 WebP 44장·원본 PNG 22장·미리보기 2장·ZIP 저장·등록 완료')


if __name__ == '__main__':
    main()
