#!/usr/bin/env python3
"""1550년 신규 여급 10명의 생성 원화를 전용 얼굴상·무릎상으로 옮긴다."""
from pathlib import Path
import argparse
import json
import shutil

from PIL import Image, ImageDraw, ImageFont
import numpy as np
from portrait_asset_layout import make_face, make_half

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'artifacts/maids1550'
OUT = ROOT / 'images/portraits/maids'
SPECS = [
    {'id': 'm_1550_qz', 'name': '심약란', 'city': 175, 'place': '천주', 'region': '중국', 'ref': '7f998c4c-ca26-4ac1-b6b5-7fbbff440bb4', 'like': 'steady'},
    {'id': 'm_1550_hs', 'name': '윤소월', 'city': 229, 'place': '한산도', 'region': '조선', 'ref': 'c37ca499-03b3-4124-b44d-1ee182454d63', 'like': 'kind'},
    {'id': 'm_1550_edo', 'name': '오미오', 'city': 297, 'place': '에도', 'region': '일본', 'ref': 'a9821a50-600b-4351-94af-d4c88eaadc03', 'like': 'delicate'},
    {'id': 'm_1550_cag', 'name': '리비아 세라', 'city': 35, 'place': '칼리아리', 'region': '사르데냐', 'ref': '98996295-6d2d-4c15-904d-8ee2d951474a', 'like': 'kind'},
    {'id': 'm_1550_vis', 'name': '에바 린드', 'city': 65, 'place': '비즈비', 'region': '발트해', 'ref': '208a3246-1578-40c3-98e8-13010726cc8f', 'like': 'strong'},
    {'id': 'm_1550_yor', 'name': '세실리 에번턴', 'city': 41, 'place': '요크', 'region': '잉글랜드', 'ref': 'f18a872d-3953-464b-8c96-7d2143a2cd4a', 'like': 'generous'},
    {'id': 'm_1550_mag', 'name': '마르타 켈러', 'city': 50, 'place': '마그데부르크', 'region': '독일', 'ref': '6ea4c2fb-ec76-454f-bb35-01b12879c344', 'like': 'steady'},
    {'id': 'm_1550_hor', 'name': '미라 데사이', 'city': 128, 'place': '호르무즈', 'region': '인도양 교역권', 'ref': 'f6b9bdfe-2d12-4eb4-9717-152820688dcf', 'like': 'bold'},
    {'id': 'm_1550_ade', 'name': '사미라 알하킴', 'city': 124, 'place': '아덴', 'region': '아라비아', 'ref': '7fffcca1-1b9c-4fc2-bd2f-0a2760d05c27', 'like': 'brave'},
    {'id': 'm_1550_mlg', 'name': '이사벨 데루나', 'city': 9, 'place': '말라가', 'region': '안달루시아', 'ref': 'd5b9954c-85da-4a70-a13e-450aa7ddf184', 'like': 'willful'},
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--prepare', action='store_true')
    parser.add_argument('--import-one', nargs=2, metavar=('ID', 'PNG'))
    parser.add_argument('--preview', action='store_true')
    args = parser.parse_args()
    WORK.mkdir(parents=True, exist_ok=True)
    if args.prepare:
        (WORK / 'references').mkdir(exist_ok=True)
        (WORK / 'raw').mkdir(exist_ok=True)
        for index, spec in enumerate(SPECS, 1):
            source = Path('C:/Users/User/AppData/Local/Temp') / ('codex-clipboard-' + spec['ref'] + '.png')
            shutil.copy2(source, WORK / 'references' / f'{index:02}.png')
        (WORK / 'characters.json').write_text(json.dumps(SPECS, ensure_ascii=False, indent=2), encoding='utf-8', newline='\n')
        print('참고 얼굴 10장과 인물 목록 준비 완료')
    if args.import_one:
        key, source = args.import_one
        if not any(spec['id'] == key for spec in SPECS):
            raise ValueError(key)
        source = Path(source)
        target = WORK / 'raw' / (key + '.png')
        target.parent.mkdir(exist_ok=True)
        if source.resolve() != target.resolve():
            shutil.copy2(source, target)
        with Image.open(target) as raw:
            person = raw.convert('RGBA')
        if person.getchannel('A').getextrema()[0] != 0:
            raise ValueError('생성 원화에 투명 배경이 없습니다: ' + key)
        # 생성 PNG의 거의 투명한 픽셀에 들어 있는 진단용 형광 RGB를 없앤다.
        pixels = np.array(person)
        pixels[pixels[:, :, 3] <= 4] = 0
        person = Image.fromarray(pixels)
        half = make_half(person)
        face = make_face(person, size=1024)
        OUT.mkdir(parents=True, exist_ok=True)
        for suffix, image in (('', face), ('_half', half)):
            image.save(OUT / (key + suffix + '.webp'), 'WEBP', quality=95, method=4, exact=True)
        print(key + ': 얼굴상 1024×1024 · 무릎상 1024×1536 완료')
    if args.preview:
        canvas = Image.new('RGB', (1600, 1100), '#302924')
        draw = ImageDraw.Draw(canvas)
        font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 18)
        for i, spec in enumerate(SPECS):
            x, y = i % 5 * 320, i // 5 * 550
            with Image.open(OUT / (spec['id'] + '_half.webp')) as raw:
                half = raw.convert('RGBA')
            half.thumbnail((310, 460))
            canvas.paste(half, (x + (320 - half.width) // 2, y + 35), half)
            with Image.open(OUT / (spec['id'] + '.webp')) as raw:
                face = raw.convert('RGBA').resize((115, 115), Image.Resampling.LANCZOS)
            canvas.paste(face, (x + 200, y + 350), face)
            draw.text((x + 12, y + 497), spec['name'] + ' · ' + spec['place'], font=font, fill='#f5dfb0')
            draw.text((x + 12, y + 522), '1550년부터 · ' + spec['region'], font=font, fill='#bcb0a2')
        canvas.save(WORK / 'preview.jpg', quality=94)
        print('preview.jpg 완료')


if __name__ == '__main__':
    main()
