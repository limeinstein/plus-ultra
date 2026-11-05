"""누락 이벤트 샷을 보관하고 게임 규격으로 변환·등록한다."""
import json
import re
import shutil
import zipfile
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / 'tools/missing_event_scenes_20261105_prompts.json'
ART = ROOT / 'artifacts/missing-event-scenes-20261105'

def main():
    spec = json.loads(PLAN.read_text(encoding='utf-8'))
    sources = ART / 'sources'
    sources.mkdir(parents=True, exist_ok=True)
    keys, checks, tiles, exports = {}, [], [], []
    for row in spec['scenes']:
        original = sources / (row['id'] + '.png')
        if not original.exists():
            shutil.copy2(row['source'], original)
        with Image.open(original) as opened:
            source_size = list(opened.size)
            picture = ImageOps.fit(opened.convert('RGB'), (1881, 836), Image.Resampling.LANCZOS)
        key = row['key']
        dest = ROOT / 'images' / (key + '.webp')
        dest.parent.mkdir(parents=True, exist_ok=True)
        if not dest.exists():
            picture.save(dest, 'WEBP', quality=95, method=4)
        with Image.open(dest) as saved:
            saved.load()
            assert saved.size == (1881, 836) and saved.mode == 'RGB', key
        keys[key] = key + '.webp'
        row['workspace_source'] = original.relative_to(ROOT).as_posix()
        row['file'] = dest.relative_to(ROOT).as_posix()
        checks.append({'key': key, 'size': [1881, 836], 'source_size': source_size})
        exports.append(dest)
        tiles.append((row, picture))
    manifest = ROOT / 'images/manifest.js'
    text = manifest.read_text(encoding='utf-8')
    match = re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', text)
    files = json.loads(match.group(1))
    files.update(keys)
    manifest.write_text(text[:match.start()] + 'G.IMAGE_FILES = ' + json.dumps(dict(sorted(files.items())), ensure_ascii=False, indent=2) + ';' + text[match.end():], encoding='utf-8', newline='\n')
    previews = []
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 22)
    for page, start in enumerate(range(0, len(tiles), 8), 1):
        subset = tiles[start:start + 8]
        preview = Image.new('RGB', (1600, ((len(subset) + 1) // 2) * 402), '#30373c')
        draw = ImageDraw.Draw(preview)
        for n, (row, picture) in enumerate(subset):
            x, y = n % 2 * 800, n // 2 * 402
            preview.paste(picture.resize((780, 347), Image.Resampling.LANCZOS), (x + 10, y + 8))
            draw.text((x + 12, y + 364), row['title'], font=font, fill='#eee2c7')
        file = ROOT / ('docs/art/missing-event-scenes-20261105-preview-' + str(page) + '.jpg')
        preview.save(file, quality=94)
        previews.append(file)
    PLAN.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ART / 'keys.json').write_text(json.dumps(list(keys), indent=2) + '\n', encoding='utf-8')
    (ART / 'asset-checks.json').write_text(json.dumps(checks, indent=2) + '\n', encoding='utf-8')
    with zipfile.ZipFile(ART / 'missing-event-scenes-20261105.zip', 'w', zipfile.ZIP_DEFLATED) as z:
        for file in exports + [PLAN] + previews:
            z.write(file, file.relative_to(ROOT).as_posix())
    print(str(len(checks)) + ' event scenes packaged and registered.')

if __name__ == '__main__':
    main()
