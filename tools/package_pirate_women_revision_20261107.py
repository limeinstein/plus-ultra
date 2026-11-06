"""참고 얼굴로 수정한 여성 해적 4명의 투명 얼굴·무릎상을 등록한다."""
import json
import re
import shutil
import zipfile
from pathlib import Path

import cv2
from PIL import Image, ImageDraw, ImageFont
from import_generated_portrait import face_square
from package_missing_event_art_20261106 import face_coordinates

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'artifacts/pirate-women-revision-20261107'
PLAN = ROOT / 'tools/pirate_women_revision_20261107_prompts.json'
TAG = '_ref20261107'


def main():
    cv2.setNumThreads(2)
    spec = json.loads(PLAN.read_text(encoding='utf-8'))
    rows = []
    for original in spec['portraits']:
        result = ART / 'generated' / (original['id'] + '.json')
        assert result.is_file(), '생성 원본이 필요합니다: ' + original['id']
        rows.append(json.loads(result.read_text(encoding='utf-8')))
    manifest_path = ROOT / 'images/manifest.js'
    manifest = manifest_path.read_text(encoding='utf-8')
    match = re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', manifest)
    files = json.loads(match.group(1))
    coords_path = ROOT / 'js/data/portraitfaces.js'
    coords_text = coords_path.read_text(encoding='utf-8')
    for folder in ['sources', 'references']:
        (ART / folder).mkdir(parents=True, exist_ok=True)
    checks, previous, exports = [], {}, []
    preview = Image.new('RGB', (1600, 840), '#30373c')
    draw = ImageDraw.Draw(preview)
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 23)
    for i, row in enumerate(rows):
        source = ART / 'sources' / (row['id'] + '.png')
        reference = ART / 'references' / (row['id'] + '.png')
        if not source.exists():
            shutil.copy2(row['source'], source)
        if not reference.exists():
            shutil.copy2(row['ref'], reference)
        with Image.open(source) as opened:
            half = opened.convert('RGBA')
        assert half.size == (1024, 1536), (row['id'], half.size)
        face = face_square(half).resize((448, 448), Image.Resampling.LANCZOS)
        for suffix, pic in [('', face), ('_half', half)]:
            key = row['key'] + suffix
            relative = row['key'] + TAG + suffix + '.webp'
            dest = ROOT / 'images' / relative
            if not dest.exists():
                pic.save(dest, 'WEBP', quality=95, method=4, exact=True)
            with Image.open(dest) as opened:
                opened.load()
                assert opened.mode == 'RGBA' and opened.size == pic.size, key
                hist = opened.getchannel('A').histogram()
                clear, solid = sum(hist[:8])/(pic.width*pic.height), sum(hist[240:])/(pic.width*pic.height)
                assert clear > .015 and solid > .1, (key, clear, solid)
                if suffix:
                    assert opened.getchannel('A').crop((0, pic.height-8, pic.width, pic.height)).getextrema()[1] > 240, key
                coords = face_coordinates(opened.convert('RGBA'))
            previous[key] = files.get(key)
            files[key] = relative
            pattern = r'"' + re.escape(key) + r'": \{[^\n]+\}'
            assert re.search(pattern, coords_text), key
            coords_text = re.sub(pattern, '"' + key + '": ' + json.dumps(coords, separators=(',', ':')), coords_text)
            checks.append({'key': key, 'file': 'images/' + relative, 'size': list(pic.size), 'clear': clear, 'solid': solid, 'face': coords})
            exports.append(dest)
        row['workspace_source'] = source.relative_to(ROOT).as_posix()
        row['workspace_reference'] = reference.relative_to(ROOT).as_posix()
        row['face_file'] = 'images/' + row['key'] + TAG + '.webp'
        row['half_file'] = 'images/' + row['key'] + TAG + '_half.webp'
        x = i * 400
        thumb = half.resize((372, 558), Image.Resampling.LANCZOS)
        preview.paste(thumb, (x+14, 8), thumb)
        thumb = face.resize((180, 180), Image.Resampling.LANCZOS)
        preview.paste(thumb, (x+110, 574), thumb)
        label_font = font
        for size in range(23, 15, -1):
            label_font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', size)
            if draw.textbbox((0, 0), row['name'], font=label_font)[2] <= 380:
                break
        draw.text((x+10, 766), row['name'], font=label_font, fill='#f5e6ce')
        draw.text((x+10, 804), row['place'], font=font, fill='#b1c4c9')
        exports.extend([source, reference])
    # 완성한 새 파일을 다 검수한 다음 논리 열쇠 8개만 새 버전에 연결한다.
    manifest_path.write_text(manifest[:match.start()] + 'G.IMAGE_FILES = ' + json.dumps(dict(sorted(files.items())), ensure_ascii=False, indent=2) + ';' + manifest[match.end():], encoding='utf-8', newline='\n')
    coords_path.write_text(coords_text, encoding='utf-8', newline='\n')
    previous_path = ART / 'previous-mapping.json'
    if not previous_path.exists():
        previous_path.write_text(json.dumps(previous, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    spec['portraits'] = rows
    PLAN.write_text(json.dumps(spec, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    (ART / 'asset-checks.json').write_text(json.dumps(checks, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    preview_path = ROOT / 'docs/art/pirate-women-revision-20261107-preview.jpg'
    preview.save(preview_path, quality=95)
    extras = [ROOT/'docs/art/pirate-women-revision-20261107.md', ROOT/'tools/package_pirate_women_revision_20261107.py', ROOT/'tools/images.py']
    extras.extend((ART/'runtime').glob('*.json'))
    extras.extend((ART/'runtime').glob('*.png'))
    with zipfile.ZipFile(ART / 'pirate-women-revision-20261107.zip', 'w', zipfile.ZIP_DEFLATED) as z:
        for file in exports + [PLAN, preview_path, ART/'asset-checks.json', previous_path] + [p for p in extras if p.is_file()]:
            z.write(file, file.relative_to(ROOT).as_posix())
    print('여성 해적 4명 얼굴상·무릎상 8장 저장·등록·얼굴 좌표·미리보기·ZIP 완료. 옛 원화 보존.')


if __name__ == '__main__':
    main()
