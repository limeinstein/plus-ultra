"""내장 ImageGen의 초원 남성 항해사 원화 60장을 보존·내보내기·등록한다."""
import argparse
import hashlib
import json
import re
import shutil
import zipfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / 'tools/steppe_windsalt_20261117_prompts.json'
OUT = ROOT.parent / 'output/steppe-windsalt-navigators-30-20261117'
parser = argparse.ArgumentParser()
parser.add_argument('--id')
parser.add_argument('--part', choices=['knee', 'face'])
parser.add_argument('--source')
parser.add_argument('--finalize', action='store_true')
parser.add_argument('--revise', action='store_true', help='이번 제작의 이전 원본을 보존한 뒤 수정본을 선택한다')
args = parser.parse_args()
plan = json.loads(PLAN.read_text(encoding='utf-8'))
rows = plan['portraits']
if args.source:
    row = next(r for r in rows if r['id'] == args.id)
    source = Path(args.source)
    native = OUT / 'sources' / args.part / (row['id'] + '.png')
    native.parent.mkdir(parents=True, exist_ok=True)
    if native.exists() and native.read_bytes() != source.read_bytes():
        if not args.revise:
            raise RuntimeError('다른 최종 원본을 덮어쓰지 않습니다: ' + str(native))
        previous = native.with_name(native.stem + '-previous-' + hashlib.sha256(native.read_bytes()).hexdigest()[:12] + '.png')
        shutil.copy2(native, previous)
        row.setdefault(args.part + '_previous', []).append({'native': str(previous), 'source': row.get(args.part + '_source')})
    shutil.copy2(source, native)
    suffix = '_half' if args.part == 'knee' else ''
    rel = 'portraits/mates/steppe-windsalt/' + row['id'] + suffix + '.webp'
    target = ROOT / 'images' / rel
    target.parent.mkdir(parents=True, exist_ok=True)
    size = tuple(plan['kneeSize' if args.part == 'knee' else 'faceSize'])
    with Image.open(native) as im:
        original_size = list(im.size)
        assert im.mode == 'RGBA' and im.getchannel('A').getextrema()[0] == 0, (args.id, args.part, im.mode)
        picture = im.resize(size, Image.Resampling.LANCZOS) if im.size != size else im.copy()
        picture.save(target, 'WEBP', quality=95, method=4)
    row[args.part + '_source'] = str(source)
    row[args.part + '_native'] = str(native)
    row[args.part + '_size'] = original_size
    row[args.part + '_file'] = 'images/' + rel
    row[args.part + '_sha256'] = hashlib.sha256(target.read_bytes()).hexdigest()
    PLAN.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(row['id'] + ' ' + args.part + ' 저장 완료')

if args.finalize:
    assert len(rows) == 30 and all(r.get('knee_file') and r.get('face_file') for r in rows)
    keys, hashes = [], []
    for row in rows:
        for part, size in [('knee', tuple(plan['kneeSize'])), ('face', tuple(plan['faceSize']))]:
            target = ROOT / row[part + '_file']
            with Image.open(target) as im:
                assert im.mode == 'RGBA' and im.size == size and im.getchannel('A').getextrema()[0] == 0
            hashes.append(hashlib.sha256(target.read_bytes()).hexdigest())
            keys.append(target.relative_to(ROOT / 'images').with_suffix('').as_posix())
    assert len(set(hashes)) == 60
    manifest = ROOT / 'images/manifest.js'
    text = manifest.read_text(encoding='utf-8')
    match = re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', text)
    files = json.loads(match.group(1))
    for key in keys:
        assert key not in files or files[key] == key + '.webp'
        files[key] = key + '.webp'
    manifest.write_text(text[:match.start()] + 'G.IMAGE_FILES = ' + json.dumps(dict(sorted(files.items())), ensure_ascii=False, indent=2) + ';' + text[match.end():], encoding='utf-8', newline='\n')
    (ROOT / 'tools/steppe_windsalt_20261117_keys.json').write_text(json.dumps(keys, indent=2) + '\n', encoding='utf-8')
    font_path = Path('C:/Windows/Fonts/malgun.ttf')
    font = ImageFont.truetype(str(font_path), 18)
    for part, tile, name in [('knee', (240, 390), 'overview-knees'), ('face', (220, 260), 'overview-faces')]:
        sheet = Image.new('RGB', (tile[0] * 6, tile[1] * 5), '#e5d7bd')
        draw = ImageDraw.Draw(sheet)
        for i, row in enumerate(rows):
            with Image.open(ROOT / row[part + '_file']) as im:
                im = im.copy(); im.thumbnail((tile[0] - 12, tile[1] - 54), Image.Resampling.LANCZOS)
                x, y = i % 6 * tile[0], i // 6 * tile[1]
                sheet.paste(im, (x + (tile[0] - im.width) // 2, y + 4), im)
            draw.text((x + 8, y + tile[1] - 48), row['id'] + ' ' + row['name'], fill='#35291e', font=font)
            draw.text((x + 8, y + tile[1] - 25), row['nationality'] + ' · ' + str(row['age']) + '세', fill='#60452d', font=font)
        sheet.save(OUT / (name + '.jpg'), quality=94)
        shutil.copy2(OUT / (name + '.jpg'), ROOT / 'docs/art' / ('steppe-windsalt-20261117-' + part + '.jpg'))
    shutil.copy2(PLAN, OUT / 'prompts-final.json')
    with zipfile.ZipFile(OUT / 'steppe-windsalt-navigators-30-game-ready.zip', 'w', zipfile.ZIP_DEFLATED) as z:
        for row in rows:
            for part in ['face', 'knee']:
                p = ROOT / row[part + '_file']; z.write(p, row[part + '_file'])
        z.write(PLAN, 'prompts-final.json')
    print('30명·60장 규격·투명도·중복·등록·미리보기·ZIP 확인 완료')
