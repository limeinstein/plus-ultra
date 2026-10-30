#!/usr/bin/env python3
"""포토시 이벤트 원화를 전용 얼굴상·무릎상과 장면 그림으로 내보낸다."""
from pathlib import Path
import argparse
import json
import shutil

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps
from portrait_asset_layout import make_face, make_half

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'artifacts/potosi-art'
PEOPLE = {'chaska': '차스카', 'huallpa': '디에고 우알파', 'villarroel': '후안 데 비야로엘',
          'kusimayta': '쿠시 마이타', 'ayala': '로드리고 데 아얄라', 'mendo': '감독관 멘도'}
SCENES = {'potosi_wayra': '은산의 바람 화로', 'potosi_hostage': '쿠라카의 부탁',
          'potosi_caravan': '은을 나르는 라마 행렬', 'potosi_tunnel': '옛 잉카 갱도',
          'potosi_star': '샛별 — 구출 뒤 재회'}


def folder(key):
    return ROOT / 'images/portraits' / ('legendary' if key == 'chaska' else 'history')


def import_one(key, source):
    if key not in PEOPLE and key not in SCENES:
        raise ValueError(key)
    raw = WORK / 'raw' / (key + '.png')
    raw.parent.mkdir(parents=True, exist_ok=True)
    if Path(source).resolve() != raw.resolve():
        shutil.copy2(source, raw)
    with Image.open(raw) as opened:
        image = opened.convert('RGBA')
    if key in PEOPLE:
        pixels = np.array(image)
        if pixels[:, :, 3].min() != 0:
            raise ValueError('인물 원화에 투명 배경이 없습니다: ' + key)
        pixels[pixels[:, :, 3] <= 4] = 0
        person = Image.fromarray(pixels)
        target = folder(key)
        target.mkdir(parents=True, exist_ok=True)
        for suffix, output in [('', make_face(person, size=1024)), ('_half', make_half(person))]:
            output.save(target / (key + suffix + '.webp'), 'WEBP', quality=95, method=4, exact=True)
    else:
        target = ROOT / 'images/legend-events'
        target.mkdir(parents=True, exist_ok=True)
        # 게임 장면 액자의 가로세로 비율(576:256)에 맞춘다.
        output = ImageOps.fit(image.convert('RGB'), (1800, 800), Image.Resampling.LANCZOS)
        output.save(target / (key + '.webp'), 'WEBP', quality=93, method=4)
    print(key + ' 내보내기 완료')


def preview():
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 21)
    sheet = Image.new('RGB', (1800, 750), '#302924')
    draw = ImageDraw.Draw(sheet)
    checks = []
    for index, (key, name) in enumerate(PEOPLE.items()):
        x = index * 300
        for suffix, box in [('_half', (290, 710)), ('', (180, 180))]:
            path = folder(key) / (key + suffix + '.webp')
            image = Image.open(path).convert('RGBA')
            a = np.array(image); rgb = a[:, :, :3].astype(float)
            neon = int(((rgb.max(axis=2) > 240) & (rgb.min(axis=2) < 8) & (a[:, :, 3] > 32)).sum())
            expected = (1024, 1536) if suffix else (1024, 1024)
            assert image.size == expected and a[:, :, 3].min() == 0 and neon < 12, key
            checks.append({'path': str(path.relative_to(ROOT)), 'size': list(image.size), 'opaque_neon_pixels': neon})
            image.thumbnail(box)
            sheet.paste(image, (x + (300-image.width)//2, 15 if suffix else 490), image)
        draw.text((x+10, 705), name, font=font, fill='#f5dfb0')
    sheet.save(WORK / 'portraits-preview.jpg', quality=94)
    sheet = Image.new('RGB', (1800, 1290), '#302924'); draw = ImageDraw.Draw(sheet)
    for index, (key, name) in enumerate(SCENES.items()):
        image = Image.open(ROOT / 'images/legend-events' / (key+'.webp'))
        assert image.size == (1800, 800)
        checks.append({'path': 'images/legend-events/'+key+'.webp', 'size': list(image.size)})
        image.thumbnail((880, 390))
        x, y = index % 2 * 900, index // 2 * 430
        sheet.paste(image, (x+10, y)); draw.text((x+20, y+396), name, font=font, fill='#f5dfb0')
    sheet.save(WORK / 'events-preview.jpg', quality=94)
    (WORK / 'asset-check.json').write_text(json.dumps(checks, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
    print('초상 12장·장면 5장 규격·투명 배경·형광색 검사 완료')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--import-one', nargs=2, metavar=('ID', 'PNG'))
    parser.add_argument('--preview', action='store_true')
    args = parser.parse_args()
    if args.import_one:
        import_one(*args.import_one)
    if args.preview:
        preview()
