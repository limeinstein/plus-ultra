#!/usr/bin/env python3
"""베로나 사건 원화를 얼굴상·무릎 아래까지의 초상과 장면 그림으로 내보낸다."""
from pathlib import Path
import argparse
import json
import shutil

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps
from portrait_asset_layout import alpha_bounds, detect_face, make_face

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'artifacts/romeojuliet-art'
PEOPLE = {'romeo': '로미오', 'juliet': '줄리엣', 'rj_mercutio': '머큐시오',
          'rj_tybalt': '티볼트', 'rj_laurence': '로렌스 수사',
          'rj_escalus': '영주 에스칼루스', 'rj_balthasar': '발타자르'}
SCENES = {'rj_brawl': '베로나의 거리 싸움', 'rj_mercutio': '머큐시오의 죽음',
          'rj_potion': '잠의 약', 'rj_grail': '네 개의 잔', 'rj_tomb': '캐풀렛가의 무덤'}


def folder(key):
    return ROOT / 'images/portraits' / ('legendary' if key in ('romeo', 'juliet') else 'history')


def knee_portrait(person):
    # 얼굴 크기를 키우려고 확대해 무릎을 잘라 내지 않는다. 원화 전체를 여백 안에 맞춘다.
    subject = person.crop(alpha_bounds(person))
    scale = min(1000 / subject.width, 1512 / subject.height)
    subject = subject.resize((round(subject.width * scale), round(subject.height * scale)), Image.Resampling.LANCZOS)
    output = Image.new('RGBA', (1024, 1536))
    output.alpha_composite(subject, ((1024-subject.width)//2, 12))
    return output


def face_portrait(person):
    face = detect_face(person)
    if face is None:
        return make_face(person, size=1024)
    x, y, w, h = face
    side = max(w / 0.36, h / 0.42)
    # 얼굴 윤곽과 표정이 잘 보이도록 상반신보다 가깝게, 머리 위쪽은 모두 담는다.
    top = min(y - side * 0.16, alpha_bounds(person)[1] - side * 0.025)
    left = x + w / 2 - side / 2
    return person.crop((round(left), round(top), round(left+side), round(top+side))).resize((1024, 1024), Image.Resampling.LANCZOS)


def import_one(kind, key, source):
    if kind not in ('portrait', 'scene') or key not in (PEOPLE if kind == 'portrait' else SCENES):
        raise ValueError((kind, key))
    raw = WORK / 'raw' / (kind+'-'+key+'.png')
    raw.parent.mkdir(parents=True, exist_ok=True)
    if Path(source).resolve() != raw.resolve():
        shutil.copy2(source, raw)
    with Image.open(raw) as opened:
        image = opened.convert('RGBA')
    if kind == 'portrait':
        pixels = np.array(image)
        if pixels[:, :, 3].min() != 0:
            raise ValueError('투명 배경 누락: '+key)
        pixels[pixels[:, :, 3] <= 4] = 0
        person = Image.fromarray(pixels)
        target = folder(key); target.mkdir(parents=True, exist_ok=True)
        for suffix, output in [('', face_portrait(person)), ('_half', knee_portrait(person))]:
            output.save(target / (key+suffix+'.webp'), 'WEBP', quality=95, method=4, exact=True)
    else:
        target = ROOT / 'images/legend-events'; target.mkdir(parents=True, exist_ok=True)
        output = ImageOps.fit(image.convert('RGB'), (1881, 836), Image.Resampling.LANCZOS)
        output.save(target / (key+'.webp'), 'WEBP', quality=94, method=4)
    print(kind+' '+key+' 내보내기 완료')


def preview():
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 21)
    sheet = Image.new('RGB', (2100, 790), '#302924'); draw = ImageDraw.Draw(sheet)
    checks = []
    for index, (key, name) in enumerate(PEOPLE.items()):
        x = index*300
        for suffix, box, y in [('_half', (290, 480), 10), ('', (205, 205), 510)]:
            path = folder(key) / (key+suffix+'.webp')
            image = Image.open(path).convert('RGBA'); a = np.array(image); rgb = a[:, :, :3].astype(float)
            neon = int(((rgb.max(axis=2)>240) & (rgb.min(axis=2)<8) & (a[:, :, 3]>32)).sum())
            expected = (1024, 1536) if suffix else (1024, 1024)
            assert image.size == expected and a[:, :, 3].min() == 0 and neon < 12, str(path)
            checks.append({'path': str(path.relative_to(ROOT)), 'size': list(image.size), 'opaque_neon_pixels': neon})
            image.thumbnail(box); sheet.paste(image, (x+(300-image.width)//2, y), image)
        draw.text((x+10, 747), name, font=font, fill='#f5dfb0')
    sheet.save(WORK / 'portraits-preview.jpg', quality=95)
    sheet = Image.new('RGB', (1800, 1290), '#302924'); draw = ImageDraw.Draw(sheet)
    for index, (key, name) in enumerate(SCENES.items()):
        image = Image.open(ROOT / 'images/legend-events' / (key+'.webp'))
        assert image.size == (1881, 836)
        checks.append({'path': 'images/legend-events/'+key+'.webp', 'size': list(image.size)})
        image.thumbnail((880, 390)); x, y = index%2*900, index//2*430
        sheet.paste(image, (x+10, y)); draw.text((x+20, y+396), name, font=font, fill='#f5dfb0')
    sheet.save(WORK / 'events-preview.jpg', quality=95)
    (WORK / 'asset-check.json').write_text(json.dumps(checks, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
    print('초상 14장·장면 5장 해상도·투명 배경·형광색 검사 통과')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--import-one', nargs=3, metavar=('KIND', 'ID', 'PNG'))
    parser.add_argument('--preview', action='store_true')
    args = parser.parse_args()
    if args.import_one:
        import_one(*args.import_one)
    if args.preview:
        preview()
