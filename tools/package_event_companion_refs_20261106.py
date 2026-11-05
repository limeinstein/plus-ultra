"""첨부 얼굴을 참고한 최근 사건 동료 5명의 새 그림을 보존·등록한다."""
import json
import re
import shutil
import zipfile
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from import_generated_portrait import face_square
import protagonist_portraits as portrait_tools

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / 'tools/event_companion_refs_20261106_prompts.json'
ART = ROOT / 'artifacts/event-companion-refs-20261106'
TAG = '_ref20261106'


def coordinates(im):
    """게임 리그가 쓰는 두 눈·입·얼굴 상자를 원화 비율로 돌려준다."""
    bg = Image.new('RGBA', im.size, (128, 128, 128, 255))
    bg.alpha_composite(im)
    data = cv2.cvtColor(np.array(bg.convert('RGB')), cv2.COLOR_RGB2BGR)
    w, h = im.size
    scale = 640 / max(w, h)
    small = cv2.resize(data, (round(w * scale), round(h * scale)))
    detector = cv2.FaceDetectorYN.create(str(portrait_tools.MODEL), '',
        (small.shape[1], small.shape[0]), .5, .3, 50)
    _, faces = detector.detect(small)
    assert faces is not None, '얼굴 자리를 찾지 못했습니다'
    f = max(faces, key=lambda r: r[14] - .3 * r[1] / small.shape[0]) / scale
    rnd = lambda n: round(float(n), 4)
    return {'box': [rnd(f[0]/w), rnd(f[1]/h), rnd(f[2]/w), rnd(f[3]/h)],
            'eyes': [rnd(f[4]/w), rnd(f[5]/h), rnd(f[6]/w), rnd(f[7]/h)],
            'mouth': [rnd((f[10]+f[12])/2/w), rnd((f[11]+f[13])/2/h)]}


def main():
    cv2.setNumThreads(2)
    plan = json.loads(PLAN.read_text(encoding='utf-8'))
    (ART / 'sources').mkdir(parents=True, exist_ok=True)
    manifest_path = ROOT / 'images/manifest.js'
    manifest = manifest_path.read_text(encoding='utf-8')
    match = re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', manifest)
    files = json.loads(match.group(1))
    coords_path = ROOT / 'js/data/portraitfaces.js'
    coord_text = coords_path.read_text(encoding='utf-8')
    checks, previous, exports = [], {}, []
    preview = Image.new('RGB', (2000, 820), '#30373c')
    draw = ImageDraw.Draw(preview)
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 26)
    for i, row in enumerate(plan['portraits']):
        source = ART / 'sources' / (row['id'] + '.png')
        if not source.exists():
            shutil.copy2(row['source'], source)
        with Image.open(source) as opened:
            half = opened.convert('RGBA')
        assert half.size == (1024, 1536), row['id']
        face = face_square(half).resize((448, 448), Image.Resampling.LANCZOS)
        base = 'portraits/mates/' + row['id']
        for suffix, pic in (('', face), ('_half', half)):
            key = base + suffix
            relative = base + TAG + suffix + '.webp'
            dest = ROOT / 'images' / relative
            if not dest.exists():
                pic.save(dest, 'WEBP', quality=95, method=6, exact=True)
            with Image.open(dest) as opened:
                opened.load()
                assert opened.mode == 'RGBA' and opened.size == pic.size, key
                a = opened.getchannel('A')
                hist = a.histogram()
                clear, solid = sum(hist[:8])/(pic.width*pic.height), sum(hist[240:])/(pic.width*pic.height)
                assert clear > .015 and solid > .1, (key, clear, solid)
                assert opened.getpixel((0, 0))[3] < 8 and opened.getpixel((pic.width-1, 0))[3] < 8, key
                coord = coordinates(opened.convert('RGBA'))
            previous[key] = files.get(key)
            files[key] = relative
            pattern = r'"' + re.escape(key) + r'": \{[^\n]+\}'
            assert re.search(pattern, coord_text), key
            coord_text = re.sub(pattern, '"' + key + '": ' + json.dumps(coord, separators=(',', ':')), coord_text)
            checks.append({'key': key, 'file': 'images/' + relative, 'size': list(pic.size), 'clear': clear, 'solid': solid, 'face': coord})
            exports.append(dest)
        row['workspace_source'] = source.relative_to(ROOT).as_posix()
        row['face_file'] = 'images/' + base + TAG + '.webp'
        row['half_file'] = 'images/' + base + TAG + '_half.webp'
        x = i * 400
        thumb = half.resize((380, 570), Image.Resampling.LANCZOS)
        preview.paste(thumb, (x+10, 12), thumb)
        thumb = face.resize((164, 164), Image.Resampling.LANCZOS)
        preview.paste(thumb, (x+118, 594), thumb)
        label = row['name']
        width = draw.textbbox((0,0), label, font=font)[2]
        draw.text((x+(400-width)//2, 776), label, font=font, fill='#f6ebdb')
    updated = manifest[:match.start()] + 'G.IMAGE_FILES = ' + json.dumps(dict(sorted(files.items())), ensure_ascii=False, indent=2) + ';' + manifest[match.end():]
    manifest_path.write_text(updated, encoding='utf-8', newline='\n')
    coords_path.write_text(coord_text, encoding='utf-8', newline='\n')
    PLAN.write_text(json.dumps(plan, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    preview_path = ROOT / 'docs/art/event-companion-refs-20261106-preview.jpg'
    preview.save(preview_path, quality=95)
    (ART / 'asset-checks.json').write_text(json.dumps(checks, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    rollback = ART / 'previous-mapping.json'
    if not rollback.exists():
        rollback.write_text(json.dumps(previous, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    with zipfile.ZipFile(ART / 'event-companion-refs-20261106.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for file in exports + [PLAN, preview_path]:
            archive.write(file, file.relative_to(ROOT).as_posix())
    print('5명 얼굴상·무릎상 10장 저장·등록·얼굴 좌표·미리보기·ZIP 완료. 기존 이미지 보존.')


if __name__ == '__main__':
    main()
