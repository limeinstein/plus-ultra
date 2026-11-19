"""내장 ImageGen 원본 보존·사건샷 규격 확인·WebP 등록·검토 묶음."""
import json
import shutil
import zipfile
from pathlib import Path
from html import escape
from PIL import Image, ImageOps, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
NAME = 'monster-event-shots-20261119'
OUT = ROOT / 'artifacts' / NAME
DEST = ROOT / 'images/monster-events'
SPEC = ROOT / 'tools/monster_event_shots_20261119_prompts.json'
SOURCES = ROOT / 'tools/monster_event_shots_20261119_sources.json'

def main():
    jobs = json.loads(SPEC.read_text(encoding='utf-8'))['jobs']
    sources = json.loads(SOURCES.read_text(encoding='utf-8'))
    (OUT / 'originals').mkdir(parents=True, exist_ok=True)
    DEST.mkdir(parents=True, exist_ok=True)
    entries, report, cards = {}, [], []
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 18)
    overview = Image.new('RGB', (1260, 7 * 222), '#17202a')
    draw = ImageDraw.Draw(overview)
    for i, job in enumerate(jobs):
        key = job['key']
        original = OUT / 'originals' / (key + '.png')
        if not original.exists():
            shutil.copy2(sources[key], original)
        with Image.open(original) as source:
            original_size = source.size
            # 중앙 안전 영역을 지킨 생성 원화를 기존 사건 액자와 같은 규격으로 맞춘다.
            image = ImageOps.fit(source.convert('RGB'), (1881, 836), method=Image.Resampling.LANCZOS)
            target = DEST / (key + '_20261119.webp')
            image.save(target, quality=92, method=6)
            thumb = image.resize((410, 182), Image.Resampling.LANCZOS)
            x, y = (i % 3) * 420, (i // 3) * 222
            overview.paste(thumb, (x + 5, y + 5))
            draw.text((x + 8, y + 190), job['title'], font=font, fill='#f4eadb')
        logical = 'monster-events/' + key + '_20261119'
        entries[logical] = logical + '.webp'
        report.append({'key': key, 'title': job['title'], 'original_size': original_size, 'size': [1881, 836], 'file': str(target.relative_to(ROOT)), 'bytes': target.stat().st_size})
        url = '../../images/' + entries[logical]
        cards.append('<article><a href="' + url + '"><img loading="lazy" width="1881" height="836" src="' + url + '"></a><h2>' + escape(job['title']) + '</h2></article>')
    manifest = ROOT / 'images/manifest.js'
    text = manifest.read_text(encoding='utf-8')
    start, end = text.index('{', text.index('G.IMAGE_FILES =')), text.rindex('}')
    files = json.loads(text[start:end + 1])
    files.update(entries)
    manifest.write_bytes((text[:start] + json.dumps(files, ensure_ascii=False, indent=2, sort_keys=True) + text[end + 1:]).encode('utf-8'))
    overview.save(OUT / 'preview.jpg', quality=94)
    (OUT / 'assets.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    (OUT / 'index.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><title>인간형 괴물 사건샷 21장</title><style>body{background:#17202a;color:#f4eadb;margin:24px;font-family:system-ui}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}img{width:100%;height:auto}h1{font-size:26px}h2{font-size:17px}article{background:#25313e;padding:10px}a{color:#ead3a2}@media(max-width:900px){main{grid-template-columns:1fr}}</style><h1>인간형 괴물 7종 · 만남과 두 갈래 결말 21장</h1><p>모두 1881×836 · 내장 ImageGen 제작 · 실제 게임 대사 기준</p><main>' + ''.join(cards) + '</main></html>', encoding='utf-8')
    with zipfile.ZipFile(OUT / 'monster-event-shots-21.zip', 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        for job in jobs:
            file = DEST / (job['key'] + '_20261119.webp')
            archive.write(file, file.name)
        archive.write(SPEC, 'prompts.json')
        archive.write(ROOT / 'tools/monster_event_shots_20261119_revisions.json', 'revisions.json')
        archive.write(OUT / 'preview.jpg', 'preview.jpg')
    print('인간형 괴물 사건샷: ' + str(len(report)) + '장 · 1881×836 · 원본·WebP·미리보기·ZIP·게임 목록')

if __name__ == '__main__':
    main()
