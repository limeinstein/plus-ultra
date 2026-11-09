"""생성 원화 7명을 게임의 얼굴상·무릎상 규격으로 내보내고 등록한다."""
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
ART = ROOT / 'artifacts/german-maids-20261109'
PLAN = ROOT / 'tools/german_maids_20261109_prompts.json'


def save_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def main():
    cv2.setNumThreads(2)
    spec = json.loads(PLAN.read_text(encoding='utf-8'))
    assert len(spec['portraits']) == 7
    for folder in ['sources', 'references']:
        (ART / folder).mkdir(parents=True, exist_ok=True)
    checks, exports, tiles = [], [], []
    for row in spec['portraits']:
        source = ART / 'sources' / (row['id'] + '.png')
        reference = ART / 'references' / (row['id'] + '.png')
        if not source.exists():
            shutil.copy2(row['source'], source)
        if not reference.exists():
            shutil.copy2(row['original_reference'], reference)
        row['workspace_source'] = source.relative_to(ROOT).as_posix()
        row['reference'] = reference.relative_to(ROOT).as_posix()
        half = Image.open(source).copy()
        assert half.mode == 'RGBA' and half.size == (1024, 1536), (row['id'], half.mode, half.size)
        # 게임의 기존 수입 도구로 동일 원화의 얼굴만 내보낸다. 원화는 수정하지 않는다.
        face = face_square(half).resize((448, 448), Image.Resampling.LANCZOS)
        tiles.append((row, half, face))
        for suffix, picture in [('', face), ('_half', half)]:
            key = row['key'] + suffix
            destination = ROOT / 'images' / (key + '.webp')
            destination.parent.mkdir(parents=True, exist_ok=True)
            if not destination.exists():
                picture.save(destination, 'WEBP', quality=95, method=4, exact=True)
            with Image.open(destination) as actual:
                actual.load()
                assert actual.mode == 'RGBA' and actual.size == picture.size, key
                alpha = actual.getchannel('A')
                hist = alpha.histogram()
                clear = sum(hist[:8]) / (actual.width * actual.height)
                solid = sum(hist[240:]) / (actual.width * actual.height)
                assert clear > .015 and solid > .08, (key, clear, solid)
                assert alpha.tobytes() == picture.getchannel('A').tobytes(), key + ' 알파 불일치'
                coordinates = face_coordinates(actual.convert('RGBA'))
            checks.append(dict(key=key, file=destination.relative_to(ROOT).as_posix(), size=list(picture.size), clear=clear, solid=solid, alpha_preserved=True, face=coordinates))
            exports.append(destination)
        row['face_file'] = 'images/' + row['key'] + '.webp'
        row['half_file'] = 'images/' + row['key'] + '_half.webp'

    manifest_path = ROOT / 'images/manifest.js'
    text = manifest_path.read_text(encoding='utf-8')
    match = re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', text)
    files = json.loads(match.group(1))
    previous = ART / 'previous-keys.json'
    if not previous.exists():
        save_json(previous, {c['key']: files.get(c['key']) for c in checks})
    for c in checks:
        relative = c['file'].removeprefix('images/')
        assert c['key'] not in files or files[c['key']] == relative, c['key']
        files[c['key']] = relative
    manifest_path.write_text(text[:match.start()] + 'G.IMAGE_FILES = ' + json.dumps(dict(sorted(files.items())), ensure_ascii=False, indent=2) + ';' + text[match.end():], encoding='utf-8', newline='\n')

    coordinate_path = ROOT / 'js/data/portraitfaces.js'
    text = coordinate_path.read_text(encoding='utf-8')
    additions = []
    for c in checks:
        entry = json.dumps(c['key']) + ': ' + json.dumps(c['face'], separators=(',', ':'))
        pattern = r'"' + re.escape(c['key']) + r'": \{[^\n]+\}'
        if re.search(pattern, text):
            text = re.sub(pattern, entry, text)
        else:
            additions.append('    ' + entry)
    if additions:
        end = text.index('\n  };')
        body = text[:end].rstrip()
        text = body + ('' if body.endswith('{') else ',') + '\n' + ',\n'.join(additions) + text[end:]
    coordinate_path.write_text(text, encoding='utf-8', newline='\n')

    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 21)
    preview = Image.new('RGB', (7 * 256, 660), '#30373c')
    draw = ImageDraw.Draw(preview)
    comparison = Image.new('RGB', (4 * 448, 2 * 300), '#30373c')
    cd = ImageDraw.Draw(comparison)
    for i, (row, half, face) in enumerate(tiles):
        x = i * 256
        thumbnail = half.resize((248, 372), Image.Resampling.LANCZOS)
        preview.paste(thumbnail, (x + 4, 8), thumbnail)
        thumbnail = face.resize((200, 200), Image.Resampling.LANCZOS)
        preview.paste(thumbnail, (x + 28, 394), thumbnail)
        draw.text((x + 10, 611), '게르만 여급 ' + str(i + 1), font=font, fill='#f4e5ce')
        cx, cy = (i % 4) * 448, (i // 4) * 300
        ref = face_square(Image.open(ROOT / row['reference']).convert('RGBA')).resize((212, 212), Image.Resampling.LANCZOS)
        comparison.paste(ref, (cx + 6, cy + 35), ref)
        thumbnail = face.resize((212, 212), Image.Resampling.LANCZOS)
        comparison.paste(thumbnail, (cx + 230, cy + 35), thumbnail)
        cd.text((cx + 8, cy + 8), '참고 ' + str(i + 1), font=font, fill='#f4e5ce')
        cd.text((cx + 232, cy + 8), '게임 얼굴상', font=font, fill='#f4e5ce')
    preview.save(ART / 'preview.jpg', quality=95)
    comparison.save(ART / 'face-comparison.jpg', quality=95)
    save_json(PLAN, spec)
    save_json(ART / 'asset-checks.json', checks)
    save_json(ART / 'keys.json', [c['key'] for c in checks])
    with zipfile.ZipFile(ART / 'german-maids-20261109.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for file in exports + [ART / 'preview.jpg', ART / 'face-comparison.jpg', ART / 'asset-checks.json', PLAN]:
            archive.write(file, file.relative_to(ROOT).as_posix())
    print('게르만 여급 7명: 얼굴상 7장·무릎상 7장·투명 알파·등록·미리보기·ZIP 완료')


if __name__ == '__main__':
    main()
