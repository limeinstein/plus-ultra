"""금봉호·왕서방/명월의 누락 장면 원화를 저장·등록하고 점검판과 묶음을 만든다."""
import json
import re
import shutil
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'artifacts/merchant-event-shots-20261104'
PLAN = ROOT / 'tools/merchant_event_shots_20261104_prompts.json'


def main():
    spec = json.loads(PLAN.read_text(encoding='utf-8'))
    sources = ART / 'sources'
    sources.mkdir(parents=True, exist_ok=True)
    keys, checks, exports = {}, [], []
    preview = Image.new('RGB', (1680, 414*3), '#293039')
    draw = ImageDraw.Draw(preview)
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 25)
    for i, row in enumerate(spec['scenes']):
        original = sources / (row['id'] + '.png')
        if not original.exists():
            shutil.copy2(row['source'], original)
        with Image.open(original) as opened:
            image = ImageOps.fit(opened.convert('RGB'), (1881, 836), Image.Resampling.LANCZOS)
        key = 'legend-events/' + row['id']
        dest = ROOT / 'images' / (key + '.webp')
        if not dest.exists():
            image.save(dest, 'WEBP', quality=95, method=6)
        with Image.open(dest) as saved:
            saved.load()
            if saved.size != (1881, 836):
                raise ValueError('장면 규격: ' + key)
        keys[key] = key + '.webp'
        exports.append(dest)
        row['workspace_source'] = original.relative_to(ROOT).as_posix()
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
    if old != updated:
        manifest.write_text(updated, encoding='utf-8', newline='\n')
    preview_file = ROOT / 'docs/art/merchant-event-shots-20261104-preview.jpg'
    preview.save(preview_file, quality=95)
    PLAN.write_text(json.dumps(spec, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    (ART/'asset-checks.json').write_text(json.dumps(checks, indent=2)+'\n', encoding='utf-8')
    with zipfile.ZipFile(ART/'merchant-event-shots-20261104.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for p in exports+[preview_file, PLAN]:
            archive.write(p, p.relative_to(ROOT).as_posix())
    print('사건 장면 5장 저장·등록·미리보기·ZIP 완료')


if __name__ == '__main__':
    main()
