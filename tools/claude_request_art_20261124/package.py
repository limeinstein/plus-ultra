"""바닷길 노래 발견 GIF·증거품·외관과 이번 사건 원화를 게임에 넣는다."""
import hashlib
import html
import json
from pathlib import Path
import zipfile

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
RAW = ROOT / 'art_sources/claude-request-art-20261124'
OUT = ROOT / 'artifacts/claude-request-art-20261124'
DURATIONS = [700, 600, 600, 700, 800, 700, 500, 600, 600, 500, 500, 500, 500, 600, 600, 820]


def dump(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    rows = json.loads((HERE / 'prompts.json').read_text('utf-8'))[:1]
    rows += [json.loads(p.read_text('utf-8')) for p in sorted(HERE.glob('*.json'))
             if p.name not in ('prompts.json', 'assets.json', 'asset-overrides.json')]
    if not any(r['id'] == 'cheukcheon' for r in rows):
        rows.append({'id': 'cheukcheon', 'name': '측천무후 — 노년의 새로운 인연',
                     'output': 'achievement-events/cheukcheon.webp', 'tool': 'built-in image_gen',
                     'source': str(RAW / 'cheukcheon.png'),
                     'prompt': 'Historical-scene, ultrawide 1881x836 sailing RPG event. A dignified silver-haired female admiral clearly over seventy, visible wrinkles, braided updo, navy brocade captain coat, raises a goblet on a sixteenth-century ship deck at sunset. Six distinct adult seafaring husbands return her toast, one holds her hand. Tender joyful companionship late in life, realistic hands, fine painted wood and sailcloth. No text, panels, border or watermark; an elderly captain, not a Chinese empress.'})
    previous = json.loads((HERE / 'assets.json').read_text('utf-8')) if (HERE / 'assets.json').exists() else []
    owned = {f['file'] for r in previous for f in r['files']}
    records, entries = [], {}
    for row in rows:
        rid = row['id']
        source = RAW / (rid + '.png')
        if not source.exists():
            raise FileNotFoundError(source)
        if rid.startswith('r_sy_'):
            row['output'] = 'items/evidence_' + row['disc'] + '.webp'
        rels = [row['output']] + ([row['end'], row['sheet']] if row.get('kind') == 'scene' else [])
        for rel in rels:
            if (ROOT / 'images' / rel).exists() and 'images/' + rel not in owned:
                raise FileExistsError('기존 그림 보존: ' + rel)
        with Image.open(source) as image:
            if row.get('kind') == 'scene':
                # 원본을 확인한 정확한 4×4 칸. 칸 경계의 이웃 장면은 2px 안쪽에서 자른다.
                frames = []
                for y in range(4):
                    for x in range(4):
                        box = (round(x * image.width / 4) + 2, round(y * image.height / 4) + 2,
                               round((x + 1) * image.width / 4) - 2, round((y + 1) * image.height / 4) - 2)
                        frames.append(ImageOps.fit(image.crop(box).convert('RGB'), (576, 256), Image.Resampling.LANCZOS))
                for rel in rels:
                    (ROOT / 'images' / rel).parent.mkdir(parents=True, exist_ok=True)
                palette_image = Image.new('RGB', (576 * 4, 256 * 4))
                for i, frame in enumerate(frames):
                    palette_image.paste(frame, (i % 4 * 576, i // 4 * 256))
                palette = palette_image.convert('P', palette=Image.Palette.ADAPTIVE, colors=256)
                quantized = [f.quantize(palette=palette, dither=Image.Dither.FLOYDSTEINBERG) for f in frames]
                quantized[0].save(ROOT / 'images' / row['output'], save_all=True,
                                  append_images=quantized[1:], duration=DURATIONS, loop=0, disposal=1, optimize=False)
                frames[-1].save(ROOT / 'images' / row['end'], quality=94)
                sheet = Image.new('RGB', (3456, 1024))
                for i in range(24):
                    sheet.paste(frames[round(i * 15 / 23)], (i % 6 * 576, i // 6 * 256))
                sheet.save(ROOT / 'images' / row['sheet'], 'WEBP', quality=92, method=4)
            else:
                target = ROOT / 'images' / row['output']
                target.parent.mkdir(parents=True, exist_ok=True)
                if row.get('kind') in ('icon', 'map'):
                    rgba = image.convert('RGBA')
                    alpha = rgba.getchannel('A')
                    assert alpha.getextrema()[0] == 0 and alpha.histogram()[0] > image.width * image.height * .05, rid
                    # 생성 알파를 그대로 보존한다. 배경 제거·재그리기는 하지 않는다.
                    obj = rgba.crop(alpha.getbbox())
                    size, limit = (512, 472) if row['kind'] == 'map' else (256, 224)
                    obj.thumbnail((limit, limit), Image.Resampling.LANCZOS)
                    canvas = Image.new('RGBA', (size, size))
                    canvas.alpha_composite(obj, ((size - obj.width) // 2, (size - obj.height) // 2))
                else:
                    canvas = image.convert('RGB').resize((1881, 836), Image.Resampling.LANCZOS)
                canvas.save(target, 'WEBP', quality=94, method=4, exact=True)
        files = []
        for rel in rels:
            p = ROOT / 'images' / rel
            key = rel.rsplit('.', 1)[0]
            entries[key] = rel
            files.append({'file': 'images/' + rel, 'bytes': p.stat().st_size,
                          'sha256': hashlib.sha256(p.read_bytes()).hexdigest()})
        records.append({'id': rid, 'name': row.get('name', rid), 'kind': row.get('kind', 'event'),
                        'output': row['output'], 'files': files})
    manifest = ROOT / 'images/manifest.js'
    text = manifest.read_text('utf-8')
    block = ''.join('  ' + json.dumps(k) + ': ' + json.dumps(v) + ',\n'
                    for k, v in sorted(entries.items()) if json.dumps(k) + ':' not in text)
    if block:
        text = text.replace('G.IMAGE_FILES = {\n', 'G.IMAGE_FILES = {\n' + block, 1)
        manifest.write_text(text, encoding='utf-8', newline='\n')
    labels = {'femme_fatale': '팜므파탈 — 젊은 제독의 혼인 약속', 'ship_harbor': '남편들과 함께하는 항해', 'cv_belen': '벨렌 강의 불과 구조'}
    for r in records:
        r['name'] = labels.get(r['id'], r['name'])
    order = {'scene': 0, 'icon': 1, 'map': 2, 'event': 4}
    records.sort(key=lambda r: (3 if r['id'].startswith('concert_') else order.get(r['kind'], 4), r['id']))
    dump(HERE / 'assets.json', records)
    dump(HERE / 'prompts.json', rows)
    checks = []
    for record in records:
        for f in record['files']:
            path = ROOT / f['file']
            key = path.relative_to(ROOT / 'images').with_suffix('').as_posix()
            assert json.dumps(key) + ':' in text, key
            with Image.open(path) as image:
                item = {'file': f['file'], 'size': list(image.size), 'mode': image.mode}
                if path.suffix == '.gif':
                    assert image.size == (576, 256) and image.n_frames == 16
                    distinct, duration = set(), 0
                    for i in range(image.n_frames):
                        image.seek(i); distinct.add(image.convert('RGB').tobytes()); duration += image.info['duration']
                    assert len(distinct) == 16 and duration == 9820
                    item.update(frames=16, distinctFrames=16, durationMs=duration)
                elif record['kind'] in ('icon', 'map'):
                    a = image.convert('RGBA').getchannel('A'); box = a.getbbox()
                    assert a.getextrema()[0] == 0 and min(box[0], box[1], image.width - box[2], image.height - box[3]) >= 15
                    item['alphaBounds'] = box
                checks.append(item)
    dump(OUT / 'asset-checks.json', {'assets': len(records), 'files': len(checks), 'checks': checks})
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 19)
    preview = Image.new('RGB', (1200, ((len(records) + 2) // 3) * 230), '#172334')
    draw = ImageDraw.Draw(preview)
    cards = []
    for i, r in enumerate(records):
        rel = next((f['file'] for f in r['files'] if '/discovery-ends/' in f['file']), r['files'][0]['file'])
        with Image.open(ROOT / rel) as image:
            obj = ImageOps.contain(image.convert('RGBA'), (380, 185), Image.Resampling.LANCZOS)
        x, y = i % 3 * 400, i // 3 * 230
        preview.paste(obj, (x + (400 - obj.width) // 2, y + (185 - obj.height) // 2), obj)
        draw.text((x + 10, y + 192), r['name'], font=font, fill='#f1dfb3')
        img = '../../images/' + r['output']
        cards.append('<article><h2>' + html.escape(r['name']) + '</h2><a href="' + img + '"><img loading="lazy" src="' + img + '"></a><p>' + html.escape(r['output']) + '</p></article>')
    preview.save(OUT / 'preview.jpg', quality=92)
    (OUT / 'index.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><title>바닷길 노래 발견물·아이템 원화</title><style>body{background:#14202e;color:#f2e2be;font:16px sans-serif;margin:28px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(350px,1fr));gap:20px}article{background:#233244;padding:16px;border-radius:12px}img{width:100%;height:230px;object-fit:contain}h2{font-size:19px}p{overflow-wrap:anywhere;font-size:13px}</style><h1>바닷길 노래 발견물·아이템 원화</h1><p>용문석굴·도다이지 GIF, 증거품·지도, 외관과 사건·초반 3인 공연. 내장 image_gen 제작.</p><p><a href="claude-request-art-20261124.zip">게임용 파일 ZIP</a></p><main>' + ''.join(cards) + '</main></html>', encoding='utf-8')
    with zipfile.ZipFile(OUT / 'claude-request-art-20261124.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for record in records:
            for f in record['files']:
                archive.write(ROOT / f['file'], f['file'])
        archive.write(HERE / 'prompts.json', '제작_프롬프트.json')
    print('그림 묶음:', len(records), '종 / 게임 파일', sum(len(r['files']) for r in records), '개')


if __name__ == '__main__':
    main()
