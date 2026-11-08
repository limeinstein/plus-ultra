"""내장 ImageGen의 드레이크·콜럼버스 원화를 게임 규격으로 등록한다."""
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
from import_generated_portrait import face_square

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / 'tools/drake_newworld_art_20261108_prompts.json'
ART = ROOT / 'artifacts/drake-newworld-art-20261108'
DOC = ROOT / 'docs/art'


def asset_file(key):
    """신대륙의 10월 원본은 보존하고 이번 원화를 별도 파일에 둔다."""
    folder, name = key.rsplit('/', 1)
    if name.startswith('nw_') or key in ('legend-events/dc_lima', 'legend-events/dc_john'):
        suffix = '_half' if name.endswith('_half') else ''
        name = name.removesuffix('_half') + '_v20261108' + suffix
    return folder + '/' + name + '.webp'


def sync_faces(keys):
    physical = [Path(file).with_suffix('').as_posix() for key, file in keys.items() if key.startswith('portraits/')]
    key_file = ART / 'portrait-physical-keys.json'
    key_file.write_text(json.dumps(physical, ensure_ascii=False), encoding='utf-8')
    subprocess.run([sys.executable, str(ROOT / 'tools/portrait_faces.py'), '--merge', '--keys-file', str(key_file)], check=True)
    dest = ROOT / 'js/data/portraitfaces.js'
    text = dest.read_text(encoding='utf-8')
    match = re.search(r'G\.PORTRAIT_FACES = (\{[\s\S]*?\});', text)
    faces = json.loads(match.group(1))
    for key, file in keys.items():
        actual = Path(file).with_suffix('').as_posix()
        if key.startswith('portraits/') and actual != key:
            if actual not in faces:
                raise ValueError('새 초상 얼굴 자리 없음: ' + actual)
            # 기존 줄만 갱신해 다른 그림의 좌표·정렬을 보존한다.
            pattern = r'(?m)^    ' + re.escape(json.dumps(key)) + r': [^\n]*$'
            def replace(m):
                return '    ' + json.dumps(key) + ': ' + json.dumps(faces[actual], separators=(',', ':')) + (',' if m.group(0).endswith(',') else '')
            text, count = re.subn(pattern, replace, text)
            if count != 1:
                raise ValueError('얼굴 좌표 별칭 없음: ' + key)
    dest.write_text(text, encoding='utf-8', newline='\n')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--partial', action='store_true')
    parser.add_argument('--faces', action='store_true')
    args = parser.parse_args()
    plan = json.loads(PLAN.read_text(encoding='utf-8'))
    checks, keys, grids = [], {}, {'portraits': [], 'scenes': []}
    source_hashes = []
    for category in grids:
        for row in plan[category]:
            record = ART / 'records' / (row.get('recordId', row['id']) + '.json')
            if not record.exists():
                if args.partial:
                    continue
                raise ValueError('원화 없음: ' + row['id'])
            row.update(json.loads(record.read_text(encoding='utf-8')))
            if category == 'scenes':
                extra = ' Character identities above apply only to people explicitly included in this scene; do not add absent people.'
                row.setdefault('generationPrompt', row['prompt'] + extra)
                row['initial_referenced_image_paths'] = [str(ROOT / 'images/portraits' / ('mates/drake_half.webp' if row['id'].startswith('dc_') else 'rivals/크리스토발 콜론_half.webp'))]
                row['prompt'] = row.get('revisionPrompt', row['generationPrompt'])
                row['referenced_image_paths'] = [row['reference']] if row.get('reference') else row['initial_referenced_image_paths']
            original = ART / 'sources' / category / (row.get('sourceId', row['id']) + '.png')
            original.parent.mkdir(parents=True, exist_ok=True)
            if not original.exists():
                shutil.copy2(row['source'], original)
            row['workspace_source'] = original.relative_to(ROOT).as_posix()
            row['source_sha256'] = hashlib.sha256(original.read_bytes()).hexdigest()
            source_hashes.append(row['source_sha256'])
            with Image.open(original) as opened:
                if category == 'portraits':
                    image = opened.convert('RGBA')
                    if image.size != (1024, 1536):
                        raise ValueError('무릎상 크기: ' + row['id'])
                    base = 'portraits/history/' + row['id']
                    existing_face = ROOT / 'images' / asset_file(base)
                    if existing_face.exists():
                        with Image.open(existing_face) as saved_face:
                            face = saved_face.convert('RGBA')
                    else:
                        face = face_square(image).resize((448, 448), Image.Resampling.LANCZOS)
                    exports = [(base, face), (base + '_half', image)]
                    grids[category].append((row, image, face))
                else:
                    if opened.width <= opened.height:
                        raise ValueError('가로 사건샷 원화가 아님: ' + row['id'])
                    image = ImageOps.fit(opened.convert('RGB'), (1881, 836), Image.Resampling.LANCZOS)
                    exports = [('legend-events/' + row['id'], image)]
                    grids[category].append((row, image))
                for key, picture in exports:
                    dest = ROOT / 'images' / asset_file(key)
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    if not dest.exists():
                        picture.save(dest, 'WEBP', quality=95, method=6, exact=True)
                    with Image.open(dest) as saved:
                        saved.load()
                        if saved.size != picture.size:
                            raise ValueError('파일 크기 불일치: ' + key)
                        check = {'key': key, 'file': asset_file(key), 'size': list(saved.size), 'bytes': dest.stat().st_size,
                                 'sha256': hashlib.sha256(dest.read_bytes()).hexdigest()}
                        if category == 'portraits':
                            hist = saved.convert('RGBA').getchannel('A').histogram()
                            pixels = saved.width * saved.height
                            check.update(clear=sum(hist[:8]) / pixels, solid=sum(hist[240:]) / pixels)
                            if check['clear'] < .025 or check['solid'] < .08:
                                raise ValueError('투명도 확인 필요: ' + key)
                        checks.append(check)
                    keys[key] = asset_file(key)
    manifest = ROOT / 'images/manifest.js'
    text = manifest.read_text(encoding='utf-8')
    match = re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', text)
    files = json.loads(match.group(1))
    files.update(keys)
    replacement = 'G.IMAGE_FILES = ' + json.dumps(dict(sorted(files.items())), ensure_ascii=False, indent=2) + ';'
    manifest.write_text(text[:match.start()] + replacement + text[match.end():], encoding='utf-8', newline='\n')
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 21)
    previews = []
    for category, tiles in grids.items():
        per_page = 12 if category == 'portraits' else 8
        for start in range(0, len(tiles), per_page):
            batch = tiles[start:start + per_page]
            columns, width, height = (min(4, len(batch)), 350, 500) if category == 'portraits' else (2, 800, 400)
            preview = Image.new('RGB', (columns * width, ((len(batch) + columns - 1) // columns) * height), '#252a30')
            draw = ImageDraw.Draw(preview)
            for i, tile in enumerate(batch):
                row, im = tile[:2]
                x, y = i % columns * width, i // columns * height
                if category == 'portraits':
                    thumb = im.copy()
                    thumb.thumbnail((310, 440), Image.Resampling.LANCZOS)
                    preview.paste(thumb, (x + (350 - thumb.width) // 2, y), thumb)
                    face = tile[2].resize((120, 120), Image.Resampling.LANCZOS)
                    preview.paste(face, (x + 225, y + 325), face)
                    label_y = y + 460
                else:
                    preview.paste(im.resize((780, 347), Image.Resampling.LANCZOS), (x + 10, y + 5))
                    label_y = y + 362
                draw.text((x + 8, label_y), row.get('name', row.get('title')), fill='#f1e5cc', font=font)
            name = 'drake-newworld-art-20261108-' + category + '-' + str(start // per_page + 1) + '.jpg'
            preview.save(DOC / name, quality=93)
            previews.append(name)
    PLAN.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ART / 'asset-checks.json').write_text(json.dumps(checks, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    portrait_keys = [k for k in keys if k.startswith('portraits/')]
    (ART / 'portrait-keys.json').write_text(json.dumps(portrait_keys, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    if args.faces:
        sync_faces(keys)
    if not args.partial:
        if len(source_hashes) != 44 or len(set(source_hashes)) != 44 or len(keys) != 64:
            raise ValueError('원화 44종·게임 그림 64장 구성 확인 필요')
        with zipfile.ZipFile(ART / 'drake-newworld-art-20261108.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
            for key in keys:
                p = ROOT / 'images' / keys[key]
                archive.write(p, p.relative_to(ROOT).as_posix())
            archive.write(PLAN, PLAN.relative_to(ROOT).as_posix())
            for name in previews:
                archive.write(DOC / name, 'preview/' + name)
    print(json.dumps({'portraits': len(grids['portraits']), 'scenes': len(grids['scenes']), 'files': len(keys)}))


if __name__ == '__main__':
    main()
