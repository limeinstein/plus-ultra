"""바다의 사람들 사건 원화 14장을 보관하고 기존 이벤트 경로에 등록한다."""
import json
import re
import shutil
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / 'tools/rovers_event_shots_20261104_prompts.json'
ART = ROOT / 'artifacts/rovers-event-shots-20261104'


def main():
    spec = json.loads(PLAN.read_text(encoding='utf-8'))
    sources = ART / 'sources'
    sources.mkdir(parents=True, exist_ok=True)
    keys, checks, tiles, exports = {}, [], [], []
    for row in spec['scenes']:
        original = sources / (row['id'] + '.png')
        if not original.exists():
            shutil.copy2(row['source'], original)
        if row.get('draft_source'):
            draft = sources / (row['id'] + '-draft.png')
            if not draft.exists():
                shutil.copy2(row['draft_source'], draft)
        with Image.open(original) as opened:
            source_size = list(opened.size)
            image = ImageOps.fit(opened.convert('RGB'), (1881, 836), Image.Resampling.LANCZOS,
                                 centering=tuple(row.get('centering', [.5, .5])))
        key = 'legend-events/' + row['id']
        dest = ROOT / 'images' / (key + '.webp')
        dest.parent.mkdir(parents=True, exist_ok=True)
        if not dest.exists():
            image.save(dest, 'WEBP', quality=95, method=6)
        with Image.open(dest) as saved:
            saved.load()
            assert saved.size == (1881, 836) and saved.mode == 'RGB', key
        keys[key] = key + '.webp'
        row['workspace_source'] = original.relative_to(ROOT).as_posix()
        row['file'] = dest.relative_to(ROOT).as_posix()
        checks.append({'key': key, 'size': [1881, 836], 'source_size': source_size, 'bytes': dest.stat().st_size})
        tiles.append((row, image))
        exports.append(dest)
    manifest = ROOT / 'images/manifest.js'
    text = manifest.read_text(encoding='utf-8')
    match = re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', text)
    files = json.loads(match.group(1))
    files.update(keys)
    updated = text[:match.start()] + 'G.IMAGE_FILES = ' + json.dumps(dict(sorted(files.items())), ensure_ascii=False, indent=2) + ';' + text[match.end():]
    if updated != text:
        manifest.write_text(updated, encoding='utf-8', newline='\n')
    preview = Image.new('RGB', (1600, ((len(tiles) + 1) // 2) * 402), '#252a2e')
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 23)
    draw = ImageDraw.Draw(preview)
    for i, (row, image) in enumerate(tiles):
        x, y = (i % 2) * 800, (i // 2) * 402
        preview.paste(image.resize((780, 347), Image.Resampling.LANCZOS), (x + 10, y + 8))
        draw.text((x + 14, y + 365), row['title'], font=font, fill='#eee2c7')
    preview_path = ROOT / 'docs/art/rovers-event-shots-20261104-preview.jpg'
    preview.save(preview_path, quality=94)
    PLAN.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ART / 'asset-checks.json').write_text(json.dumps(checks, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    with zipfile.ZipFile(ART / 'rovers-event-shots-20261104.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for file in exports + [PLAN, preview_path]:
            archive.write(file, file.relative_to(ROOT).as_posix())
    print(str(len(checks)) + '장 사건 원화 보관·등록·미리보기·ZIP 완료')


if __name__ == '__main__':
    main()
