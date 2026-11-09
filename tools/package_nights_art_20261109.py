"""천일야화 내장 ImageGen 원화를 얼굴상·무릎상·사건샷으로 등록한다."""
import hashlib
import json
import re
import shutil
import zipfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
from import_generated_portrait import face_square

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'artifacts/nights-art-20261109'
PLAN = ROOT / 'tools/nights_art_20261109_prompts.json'

def main():
    plan = json.loads(PLAN.read_text(encoding='utf-8'))
    keys, checks = {}, []
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 23)
    for category in ['portraits', 'scenes']:
        rows = plan.get(category, [])
        cw, ch, cols = (360, 530, 3) if category == 'portraits' else (660, 335, 3)
        preview = Image.new('RGB', (cw * cols, ch * ((len(rows) + cols - 1) // cols)), '#252a30')
        draw = ImageDraw.Draw(preview)
        for i, row in enumerate(rows):
            source = ART / 'sources' / (row['id'] + '.png')
            source.parent.mkdir(parents=True, exist_ok=True)
            if not source.exists():
                shutil.copy2(row['source'], source)
            with Image.open(source) as opened:
                if category == 'portraits':
                    im = opened.convert('RGBA')
                    im = im.resize((1024, 1536), Image.Resampling.LANCZOS)
                    face_path = ROOT / 'images' / (row['base'] + '.webp')
                    if face_path.exists():
                        with Image.open(face_path) as saved_face:
                            face = saved_face.convert('RGBA')
                    else:
                        face = face_square(im).resize((448, 448), Image.Resampling.LANCZOS)
                    exports = [(row['base'], face), (row['base'] + '_half', im)]
                else:
                    im = ImageOps.fit(opened.convert('RGB'), (1881, 836), Image.Resampling.LANCZOS)
                    exports = [('legend-events/' + row['id'], im)]
                for key, pic in exports:
                    target = ROOT / 'images' / (key + '.webp')
                    target.parent.mkdir(parents=True, exist_ok=True)
                    if not target.exists():
                        pic.save(target, 'WEBP', quality=95, method=6, exact=True)
                    with Image.open(target) as saved:
                        saved.load()
                        assert saved.size == pic.size, key
                        check = {'key': key, 'size': list(saved.size), 'bytes': target.stat().st_size,
                                 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
                        if category == 'portraits':
                            hist = saved.convert('RGBA').getchannel('A').histogram()
                            check['clear'] = sum(hist[:8]) / (saved.width * saved.height)
                            check['solid'] = sum(hist[240:]) / (saved.width * saved.height)
                            assert check['clear'] > .025 and check['solid'] > .08, check
                        checks.append(check)
                    keys[key] = key + '.webp'
                x, y = (i % cols) * cw, (i // cols) * ch
                thumb = im.copy()
                thumb.thumbnail((cw - 20, ch - 55), Image.Resampling.LANCZOS)
                preview.paste(thumb, (x + (cw - thumb.width) // 2, y + 5), thumb if category == 'portraits' else None)
                if category == 'portraits':
                    mini = face.resize((120, 120), Image.Resampling.LANCZOS)
                    preview.paste(mini, (x + cw - 125, y + ch - 175), mini)
                draw.text((x + 10, y + ch - 40), row['name'], fill='#f1e5cc', font=font)
        preview.save(ART / (category + '-preview.jpg'), quality=94)
    manifest = ROOT / 'images/manifest.js'
    content = manifest.read_text(encoding='utf-8')
    match = re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', content)
    files = json.loads(match.group(1))
    files.update(keys)
    replacement = 'G.IMAGE_FILES = ' + json.dumps(dict(sorted(files.items())), ensure_ascii=False, indent=2) + ';'
    manifest.write_text(content[:match.start()] + replacement + content[match.end():], encoding='utf-8', newline='\n')
    (ART / 'asset-checks.json').write_text(json.dumps(checks, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ART / 'portrait-keys.json').write_text(json.dumps([k for k in keys if k.startswith('portraits/')], indent=2) + '\n', encoding='utf-8')
    with zipfile.ZipFile(ART / 'nights-art-20261109.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for key in keys:
            archive.write(ROOT / 'images' / keys[key], 'images/' + keys[key])
        archive.write(PLAN, 'prompts.json')
        for name in ['portraits-preview.jpg', 'scenes-preview.jpg']:
            archive.write(ART / name, name)
    print(json.dumps({'portraits': len(plan['portraits']), 'scenes': len(plan['scenes']), 'files': len(keys)}))

if __name__ == '__main__':
    main()
