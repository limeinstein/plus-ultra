"""내장 ImageGen 원화를 보관하고 연산군 사건의 초상·장면을 게임 규격으로 내보낸다."""
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import zipfile
from PIL import Image, ImageDraw, ImageFont, ImageOps
from romeojuliet_assets import face_portrait, knee_portrait

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'artifacts/yeonsan-art-20261103'
PLAN = ROOT / 'tools/yeonsan_art_20261103_prompts.json'


def main():
    plan = json.loads(PLAN.read_text(encoding='utf-8'))
    keys, checks, exports = {}, [], []
    rows = plan['portraits'] + plan['scenes']
    for row in rows:
        kind = 'portrait' if 'folder' in row else 'scene'
        original = WORK / 'sources' / (row['id'] + '.png')
        original.parent.mkdir(parents=True, exist_ok=True)
        if not original.exists():
            shutil.copy2(row['source'], original)
        image = Image.open(original).convert('RGBA')
        if kind == 'portrait':
            assert image.getchannel('A').getextrema()[0] == 0, row['id']
            renders = [('', face_portrait(image)), ('_half', knee_portrait(image))]
            folder = 'portraits/' + row['folder']
        else:
            renders = [('', ImageOps.fit(image.convert('RGB'), (1881, 836), Image.Resampling.LANCZOS))]
            folder = 'legend-events'
        row['outputs'] = []
        row['workspace_source'] = original.relative_to(ROOT).as_posix()
        for suffix, output in renders:
            key = folder + '/' + row['id'] + suffix
            dest = ROOT / 'images' / (key + '.webp')
            if dest.exists():
                backup = WORK / 'before' / (key + '.webp')
                backup.parent.mkdir(parents=True, exist_ok=True)
                if not backup.exists():
                    shutil.copy2(dest, backup)
            dest.parent.mkdir(parents=True, exist_ok=True)
            output.save(dest, 'WEBP', quality=95, method=6, exact=True)
            with Image.open(dest) as saved:
                saved.load()
                assert saved.size == output.size
                check = {'key': key, 'size': list(saved.size)}
                if kind == 'portrait':
                    hist = saved.getchannel('A').histogram()
                    check['transparent_fraction'] = sum(hist[:8]) / (saved.width * saved.height)
                    check['solid_fraction'] = sum(hist[240:]) / (saved.width * saved.height)
                    assert check['transparent_fraction'] > .015 and check['solid_fraction'] > .08, key
            checks.append(check)
            keys[key] = key + '.webp'
            row['outputs'].append(dest.relative_to(ROOT).as_posix())
            exports.append(dest)
    manifest = ROOT / 'images/manifest.js'
    text = manifest.read_text(encoding='utf-8')
    match = re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', text)
    files = json.loads(match.group(1))
    files.update(keys)
    updated = text[:match.start()] + 'G.IMAGE_FILES = ' + json.dumps(dict(sorted(files.items())), ensure_ascii=False, indent=2) + ';' + text[match.end():]
    manifest.write_text(updated, encoding='utf-8', newline='\n')
    (WORK / 'keys.json').write_text(json.dumps([k for k in keys if k.startswith('portraits/')]), encoding='utf-8')
    subprocess.run([sys.executable, str(ROOT/'tools/portrait_faces.py'), '--merge', '--keys-file', str(WORK/'keys.json')], cwd=ROOT, check=True)
    PLAN.write_text(json.dumps(plan, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    (WORK/'asset-checks.json').write_text(json.dumps(checks, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 24)
    for kind, items, cols, cw, ch in [('portraits', plan['portraits'], 4, 380, 730), ('events', plan['scenes'], 2, 940, 460)]:
        sheet = Image.new('RGB', (cols*cw, ((len(items)+cols-1)//cols)*ch), '#303038')
        draw = ImageDraw.Draw(sheet)
        for i, row in enumerate(items):
            x,y = i%cols*cw, i//cols*ch
            paths = [(row['outputs'][1], (360,510), 0), (row['outputs'][0], (170,170), 515)] if kind=='portraits' else [(row['outputs'][0], (920,409), 0)]
            for path, size, offset in paths:
                thumb = Image.open(ROOT/path).convert('RGBA'); thumb.thumbnail(size, Image.Resampling.LANCZOS)
                sheet.paste(thumb, (x+(cw-thumb.width)//2,y+offset), thumb)
            draw.text((x+15,y+ch-37),row.get('name',row.get('title')),font=font,fill='#f2dfbd')
        sheet.save(WORK/(kind+'-preview.jpg'),quality=95)
    with zipfile.ZipFile(WORK/'yeonsan-art-20261103.zip','w',zipfile.ZIP_DEFLATED) as archive:
        for file in exports + [PLAN, WORK/'portraits-preview.jpg', WORK/'events-preview.jpg']:
            archive.write(file,file.relative_to(ROOT).as_posix())
    print(str(len(plan['portraits'])) + '명 얼굴·무릎상 ' + str(len(plan['portraits'])*2) + '장, 이벤트 샷 ' + str(len(plan['scenes'])) + '장 저장·등록·검사 완료')


if __name__ == '__main__':
    main()
