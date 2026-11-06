"""내장 ImageGen 원본을 보존하고 누락 사건 인물화·장면을 게임에 등록한다."""
import json
import re
import shutil
import zipfile
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps
from import_generated_portrait import face_square
import protagonist_portraits as portraits

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'artifacts/missing-event-art-20261106'
PLAN = ROOT / 'tools/missing_event_art_20261106_prompts.json'


def face_coordinates(im):
    # face_square가 먼저 모델을 영문 임시 경로로 옮긴다(한글 경로의 OpenCV 제한).
    bg = Image.new('RGBA', im.size, '#808080')
    bg.alpha_composite(im)
    w, h = im.size
    scale = min(1, 640 / max(w, h))
    small = bg.convert('RGB').resize((round(w * scale), round(h * scale)))
    data = cv2.cvtColor(np.array(small), cv2.COLOR_RGB2BGR)
    detector = cv2.FaceDetectorYN.create(str(portraits.MODEL), '', (small.width, small.height), .5, .3, 50)
    _, faces = detector.detect(data)
    if faces is None:
        raise ValueError('얼굴 좌표를 찾지 못했습니다')
    f = max(faces, key=lambda r: r[14] - .3 * r[1] / small.height) / scale
    rnd = lambda x: round(float(x), 4)
    return {'box': [rnd(f[0]/w), rnd(f[1]/h), rnd(f[2]/w), rnd(f[3]/h)],
            'eyes': [rnd(f[4]/w), rnd(f[5]/h), rnd(f[6]/w), rnd(f[7]/h)],
            'mouth': [rnd((f[10]+f[12])/2/w), rnd((f[11]+f[13])/2/h)]}


def main():
    cv2.setNumThreads(2)
    spec = json.loads(PLAN.read_text(encoding='utf-8'))
    generated = {p.stem: json.loads(p.read_text(encoding='utf-8')) for p in (ART / 'generated').glob('*.json')}
    required = spec['portraits'] + spec['scenes']
    missing = [r['id'] for r in required if r['id'] not in generated]
    if missing:
        print('아직 생성 중: ' + ', '.join(missing))
    rows = [generated[r['id']] for r in required if r['id'] in generated]
    if 'dreamcome' in generated:
        rows.append(generated['dreamcome'])
    (ART / 'sources').mkdir(parents=True, exist_ok=True)
    manifest_path = ROOT / 'images/manifest.js'
    manifest = manifest_path.read_text(encoding='utf-8')
    match = re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', manifest)
    files = json.loads(match.group(1))
    coords_path = ROOT / 'js/data/portraitfaces.js'
    coords_text = coords_path.read_text(encoding='utf-8')
    checks, exports, portrait_tiles, scene_tiles = [], [], [], []
    for row in rows:
        row['source'] = row['source'].split(' as ')[-1]
        source = ART / 'sources' / (row['id'] + '.png')
        if not source.exists():
            shutil.copy2(row['source'], source)
        with Image.open(source) as opened:
            original_size = list(opened.size)
            is_portrait = row['key'].startswith('portraits/')
            if is_portrait:
                half = opened.convert('RGBA')
                if half.size != (1024, 1536):
                    half = half.resize((1024, 1536), Image.Resampling.LANCZOS)
                face = face_square(half).resize((448, 448), Image.Resampling.LANCZOS)
                pictures = [('', face), ('_half', half)]
                portrait_tiles.append((row, half, face))
            else:
                picture = ImageOps.fit(opened.convert('RGB'), (1881, 836), Image.Resampling.LANCZOS)
                pictures = [('', picture)]
                scene_tiles.append((row, picture))
        for suffix, picture in pictures:
            key = row['key'] + suffix
            dest = ROOT / 'images' / (key + '.webp')
            dest.parent.mkdir(parents=True, exist_ok=True)
            if not dest.exists():
                picture.save(dest, 'WEBP', quality=95, method=4, exact=True)
            with Image.open(dest) as saved:
                saved.load()
                assert saved.size == picture.size, key
                check = {'key': key, 'file': dest.relative_to(ROOT).as_posix(), 'size': list(saved.size), 'source_size': original_size}
                if is_portrait:
                    assert saved.mode == 'RGBA', key
                    hist = saved.getchannel('A').histogram()
                    check['clear'] = sum(hist[:8]) / (saved.width * saved.height)
                    check['solid'] = sum(hist[240:]) / (saved.width * saved.height)
                    assert check['clear'] > .015 and check['solid'] > .10, check
                    # 얼굴을 확대하면 넓은 모자 깃이 위쪽 모서리에 닿을 수 있다.
                    corners = [(0, 0), (saved.width-1, 0), (0, saved.height-1), (saved.width-1, saved.height-1)]
                    assert min(saved.getpixel(pos)[3] for pos in corners) < 8, key
                    if suffix:
                        # 사람의 옷이 아래 끝까지 이어져야 허공에 뜨지 않는다.
                        check['bottom_alpha'] = saved.getchannel('A').crop((0, saved.height-8, saved.width, saved.height)).getextrema()[1]
                        assert check['bottom_alpha'] > 240, check
                    coord = face_coordinates(saved.convert('RGBA'))
                    check['face'] = coord
                    pattern = r'"' + re.escape(key) + r'": \{[^\n]+\}'
                    entry = '"' + key + '": ' + json.dumps(coord, separators=(',', ':'))
                    if re.search(pattern, coords_text):
                        coords_text = re.sub(pattern, entry, coords_text)
                    else:
                        coords_text = coords_text.replace('G.PORTRAIT_FACES = {', 'G.PORTRAIT_FACES = {\n    ' + entry + ',', 1)
            files[key] = key + '.webp'
            exports.append(dest)
            checks.append(check)
        row['workspace_source'] = source.relative_to(ROOT).as_posix()
    manifest_path.write_text(manifest[:match.start()] + 'G.IMAGE_FILES = ' + json.dumps(dict(sorted(files.items())), ensure_ascii=False, indent=2) + ';' + manifest[match.end():], encoding='utf-8', newline='\n')
    coords_path.write_text(coords_text, encoding='utf-8', newline='\n')
    (ART / 'asset-checks.json').write_text(json.dumps(checks, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    (ART / 'delivery.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 24)
    previews = []
    for page, start in enumerate(range(0, len(portrait_tiles), 5), 1):
        subset = portrait_tiles[start:start+5]
        preview = Image.new('RGB', (1600, 746), '#30373c')
        draw = ImageDraw.Draw(preview)
        for i, (row, half, face) in enumerate(subset):
            x = i * 320
            thumb = half.resize((300, 450), Image.Resampling.LANCZOS)
            preview.paste(thumb, (x+10, 8), thumb)
            thumb = face.resize((190, 190), Image.Resampling.LANCZOS)
            preview.paste(thumb, (x+65, 468), thumb)
            label_font = font
            for size in range(24, 15, -1):
                label_font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', size)
                if draw.textbbox((0, 0), row['name'], font=label_font)[2] <= 300:
                    break
            draw.text((x+10, 674), row['name'], font=label_font, fill='#f5e6ce')
            draw.text((x+10, 710), row['place'], font=font, fill='#b1c4c9')
        dest = ROOT / ('docs/art/missing-event-art-20261106-portraits-' + str(page) + '.jpg')
        preview.save(dest, quality=94)
        previews.append(dest)
    for page, start in enumerate(range(0, len(scene_tiles), 6), 1):
        subset = scene_tiles[start:start+6]
        preview = Image.new('RGB', (1600, ((len(subset)+1)//2)*402), '#30373c')
        draw = ImageDraw.Draw(preview)
        for i, (row, picture) in enumerate(subset):
            x, y = i%2*800, i//2*402
            preview.paste(picture.resize((780, 347), Image.Resampling.LANCZOS), (x+10, y+8))
            draw.text((x+12, y+364), row['title'], font=font, fill='#f5e6ce')
        dest = ROOT / ('docs/art/missing-event-art-20261106-scenes-' + str(page) + '.jpg')
        preview.save(dest, quality=94)
        previews.append(dest)
    with zipfile.ZipFile(ART / 'missing-event-art-20261106.zip', 'w', zipfile.ZIP_DEFLATED) as z:
        for dest in exports + previews + [PLAN, ART/'delivery.json', ART/'asset-checks.json']:
            z.write(dest, dest.relative_to(ROOT).as_posix())
    print(json.dumps({'portraits': len(portrait_tiles), 'scenes': len(scene_tiles), 'files': len(checks)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
