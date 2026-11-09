"""북아프리카 여급 7명의 생성 원화를 게임 규격으로 내보내고 등록한다."""
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
ART = ROOT / 'artifacts/northafrica-maids-20261109'
PLAN = ROOT / 'tools/northafrica_maids_20261109_prompts.json'
PREVIEW = ROOT / 'docs/art/northafrica-maids-20261109-preview.jpg'


def save(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def main():
    cv2.setNumThreads(2)
    spec = json.loads(PLAN.read_text(encoding='utf-8'))
    assert len(spec['portraits']) == 7
    checks, exports = [], []
    for row in spec['portraits']:
        for sub in ['sources', 'references']:
            (ART / sub).mkdir(parents=True, exist_ok=True)
        original = ART / 'sources' / (row['id'] + '.png')
        reference = ART / 'references' / (row['id'] + '.png')
        if not original.exists():
            shutil.copy2(row['source'], original)
        if not reference.exists():
            shutil.copy2(row['input_reference'], reference)
        row['workspace_source'] = original.relative_to(ROOT).as_posix()
        row['reference'] = reference.relative_to(ROOT).as_posix()
        with Image.open(original) as opened:
            opened.load()
            assert opened.mode == 'RGBA' and opened.size == (1024, 1536), (row['id'], opened.mode, opened.size)
            half = opened.copy()
        # 같은 생성 원화의 얼굴을 게임의 기존 추출 도구로 내보낸다.
        face = face_square(half).resize((448, 448), Image.Resampling.LANCZOS)
        for suffix, picture in [('', face), ('_half', half)]:
            key = row['key'] + suffix
            target = ROOT / 'images' / (key + '.webp')
            target.parent.mkdir(parents=True, exist_ok=True)
            if not target.exists():
                picture.save(target, 'WEBP', quality=95, method=4, exact=True)
            with Image.open(target) as opened:
                opened.load()
                assert opened.mode == 'RGBA' and opened.size == picture.size
                alpha = opened.getchannel('A')
                assert alpha.tobytes() == picture.getchannel('A').tobytes(), key + ' 알파 불일치'
                hist = alpha.histogram()
                clear = sum(hist[:8]) / (opened.width * opened.height)
                solid = sum(hist[240:]) / (opened.width * opened.height)
                assert clear > .015 and solid > .08, (key, clear, solid)
                coords = face_coordinates(opened)
            checks.append(dict(key=key, file=target.relative_to(ROOT).as_posix(), size=list(picture.size), clear=clear, solid=solid, alpha_preserved=True, face=coords))
            exports.append(target)
        row['face_file'] = 'images/' + row['key'] + '.webp'
        row['half_file'] = 'images/' + row['key'] + '_half.webp'

    # 최신 목록을 읽어 이번에 추가한 14개 항목만 합친다.
    manifest = ROOT / 'images/manifest.js'
    text = manifest.read_text(encoding='utf-8')
    match = re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', text)
    files = json.loads(match.group(1))
    previous = ART / 'previous-keys.json'
    if not previous.exists():
        save(previous, {row['key']: files.get(row['key']) for row in checks})
    for row in checks:
        relative = row['file'].removeprefix('images/')
        assert row['key'] not in files or files[row['key']] == relative, row['key']
        files[row['key']] = relative
    manifest.write_text(text[:match.start()] + 'G.IMAGE_FILES = ' + json.dumps(dict(sorted(files.items())), ensure_ascii=False, indent=2) + ';' + text[match.end():], encoding='utf-8', newline='\n')
    location = ROOT / 'js/data/portraitfaces.js'
    text = location.read_text(encoding='utf-8')
    missing = []
    for row in checks:
        pattern = r'"' + re.escape(row['key']) + r'": \{[^\n]+\}'
        entry = json.dumps(row['key']) + ': ' + json.dumps(row['face'], separators=(',', ':'))
        if re.search(pattern, text):
            text = re.sub(pattern, entry, text)
        else:
            missing.append('    ' + entry)
    if missing:
        end = text.index('\n  };')
        body = text[:end].rstrip()
        text = body + ('' if body.endswith('{') else ',') + '\n' + ',\n'.join(missing) + text[end:]
    location.write_text(text, encoding='utf-8', newline='\n')
    save(PLAN, spec)
    save(ART / 'asset-checks.json', checks)
    save(ART / 'keys.json', [row['key'] for row in checks])

    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 22)
    sheet = Image.new('RGB', (7 * 280, 690), '#30373c')
    draw = ImageDraw.Draw(sheet)
    for i, row in enumerate(spec['portraits']):
        for field, size, top in [('half_file', (270, 405), 8), ('face_file', (180, 180), 426)]:
            im = Image.open(ROOT / row[field]).convert('RGBA')
            im.thumbnail(size, Image.Resampling.LANCZOS)
            sheet.paste(im, (i * 280 + (280 - im.width) // 2, top), im)
        draw.text((i * 280 + 15, 620), row['group'] + ' 여급 ' + str(row['number']), font=font, fill='#f1e8d6')
        draw.text((i * 280 + 15, 653), row['key'], font=font, fill='#cad5dc')
    PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(PREVIEW, quality=95)
    with zipfile.ZipFile(ART / 'northafrica-maids-20261109.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for target in exports + [PREVIEW, PLAN, ART / 'asset-checks.json']:
            archive.write(target, target.relative_to(ROOT).as_posix())
    print('북아프리카 여급 7명·얼굴상/무릎상 14장·투명 알파 보존·목록/얼굴 좌표·미리보기·ZIP 완료')


if __name__ == '__main__':
    main()
