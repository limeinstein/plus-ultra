"""무도회·데뷔탕트의 공용 장면을 저장하고 게임에 등록한다."""
import json
import re
import shutil
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / 'tools/ball_event_art_20261104_prompts.json'
ART = ROOT / 'artifacts/ball-event-art-20261104'


def main():
    spec = json.loads(PLAN.read_text(encoding='utf-8'))
    sources = ART / 'sources'
    sources.mkdir(parents=True, exist_ok=True)
    keys, checks, exports = {}, [], []
    preview = Image.new('RGB', (1680, 828), '#293039')
    draw = ImageDraw.Draw(preview)
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 25)
    for i, row in enumerate(spec['scenes']):
        source = sources / (row['id'] + '.png')
        if not source.exists():
            shutil.copy2(row['source'], source)
        with Image.open(source) as opened:
            image = ImageOps.fit(opened.convert('RGB'), (1881, 836), Image.Resampling.LANCZOS)
        key = 'events/ball/' + row['id']
        dest = ROOT / 'images' / (key + '.webp')
        if not dest.exists():
            image.save(dest, 'WEBP', quality=95, method=6)
        with Image.open(dest) as saved:
            saved.load()
            if saved.size != (1881, 836):
                raise ValueError('장면 규격: ' + key)
        keys[key] = key + '.webp'
        exports.append(dest)
        row['workspace_source'] = source.relative_to(ROOT).as_posix()
        row['file'] = dest.relative_to(ROOT).as_posix()
        checks.append({'key': key, 'size': [1881, 836], 'bytes': dest.stat().st_size})
        x, y = (i%2)*840, (i//2)*414
        preview.paste(image.resize((820, 364), Image.Resampling.LANCZOS), (x+10, y+5))
        draw.text((x+15, y+373), row['title'], font=font, fill='#f0e5cf')
    manifest = ROOT / 'images/manifest.js'
    old = manifest.read_text(encoding='utf-8')
    match = re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', old)
    files = json.loads(match.group(1))
    files.update(keys)
    replacement = 'G.IMAGE_FILES = ' + json.dumps(dict(sorted(files.items())), ensure_ascii=False, indent=2) + ';'
    updated = old[:match.start()] + replacement + old[match.end():]
    if updated != old:
        manifest.write_text(updated, encoding='utf-8', newline='\n')
    preview_file = ROOT / 'docs/art/ball-event-art-20261104-preview.jpg'
    preview.save(preview_file, quality=95)
    PLAN.write_text(json.dumps(spec, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    (ART/'asset-checks.json').write_text(json.dumps(checks, indent=2)+'\n', encoding='utf-8')
    with zipfile.ZipFile(ART/'ball-event-art-20261104.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for file in exports+[preview_file, PLAN]:
            archive.write(file, file.relative_to(ROOT).as_posix())
    print('공용 무도회·데뷔탕트 장면 4장 저장·등록·미리보기·묶음 완료')


if __name__ == '__main__':
    main()
