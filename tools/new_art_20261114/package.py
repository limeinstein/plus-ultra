"""강서대묘·사신도·천축 여행 소지품을 기존 게임 그림 규격으로 변환한다."""
import importlib.util
import json
from pathlib import Path
import shutil
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'artifacts/new-art-20261114'
SPEC = json.loads(Path(__file__).with_name('prompts.json').read_text(encoding='utf-8'))
sys.path.insert(0, str(ROOT / 'tools/discovery_art_20261111'))
module = importlib.util.spec_from_file_location('discovery_pack', ROOT / 'tools/discovery_art_20261111/package.py')
pack = importlib.util.module_from_spec(module)
module.loader.exec_module(pack)
pack.OUT = OUT


def map_icon(asset):
    raw = ROOT / asset['raw']
    raw.parent.mkdir(parents=True, exist_ok=True)
    if not raw.exists():
        shutil.copy2(asset['source'], raw)
    receipt = OUT / 'packaged' / (asset['id'] + '.json')
    target = ROOT / asset['output']
    if receipt.exists():
        previous = pack.read(receipt)
        if all((ROOT / row['file']).exists() and pack.digest(ROOT / row['file']) == row['sha256'] for row in previous['files']):
            return previous
    elif target.exists():
        raise FileExistsError('기존 외관 보존: ' + str(target))
    with Image.open(raw) as image:
        rgba = image.convert('RGBA')
        assert rgba.getchannel('A').getextrema() == (0, 255), asset['id']
        obj = rgba.crop(rgba.getchannel('A').getbbox())
        obj.thumbnail((456, 456), Image.Resampling.LANCZOS)
        icon = Image.new('RGBA', (512, 512))
        icon.paste(obj, ((512 - obj.width) // 2, (512 - obj.height) // 2))
        target.parent.mkdir(parents=True, exist_ok=True)
        icon.save(target, 'WEBP', quality=95, method=4, exact=True)
        record = {'id': asset['id'], 'name': asset['name'], 'kind': 'map',
                  'raw': asset['raw'], 'originalSize': list(image.size), 'size': [512, 512],
                  'files': [{'file': asset['output'], 'bytes': target.stat().st_size, 'sha256': pack.digest(target)}]}
    pack.write(receipt, record)
    return record


def verify(records):
    for record in records:
        for file in record['files']:
            path = ROOT / file['file']
            assert pack.digest(path) == file['sha256'], path
            with Image.open(path) as image:
                image.load()
                if record['kind'] == 'scene':
                    if path.suffix == '.gif':
                        assert image.size == (576, 256) and image.n_frames == 16
                        frames, duration = [], 0
                        for i in range(image.n_frames):
                            image.seek(i)
                            duration += image.info['duration']
                            frames.append(image.convert('RGB').tobytes())
                        assert len(set(frames)) == 16 and duration == 9820
                    else:
                        assert image.size == ((3456, 1024) if path.suffix == '.webp' else (576, 256))
                else:
                    size = 512 if record['kind'] == 'map' else 256
                    margin = 27 if size == 512 else 13
                    assert image.size == (size, size) and image.mode == 'RGBA'
                    alpha = image.getchannel('A')
                    assert alpha.getextrema() == (0, 255)
                    box = alpha.getbbox()
                    assert min(box[0], box[1], size-box[2], size-box[3]) >= margin
    print('원화 7종 · 게임 파일 9개: 크기·투명도·여백·16장 움직임·9.82초·해시 확인')


def preview():
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 16)
    small = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 13)
    icons = [a for a in SPEC['assets'] if a['kind'] in ('item', 'relic')]
    for dark in (False, True):
        bg, fg = ('#233044', '#f2e6ce') if dark else ('#eaddc2', '#34281c')
        canvas = Image.new('RGB', (1200, 650), bg)
        draw = ImageDraw.Draw(canvas)
        draw.text((20, 14), '강서대묘 발견 연출 · 지도 외관 · 새 아이템 5종', font=font, fill=fg)
        with Image.open(ROOT / SPEC['assets'][0]['end']) as image:
            canvas.paste(image, (20, 52))
        with Image.open(ROOT / SPEC['assets'][1]['output']) as image:
            image.thumbnail((430, 270), Image.Resampling.LANCZOS)
            canvas.paste(image, (680, 48), image)
        draw.text((20, 318), '모형 공사 → 내부 사신도 답사 → 낮·밤 외관', font=small, fill=fg)
        for i, asset in enumerate(icons):
            with Image.open(ROOT / asset['output']) as image:
                image.thumbnail((210, 210), Image.Resampling.LANCZOS)
                canvas.paste(image, (i*240+15, 366), image)
            name = asset['name']
            if asset['id'] == 'xy_last_sutra':
                name = '빠진 마지막 권의\n빈 두루마리'
            draw.text((i*240+12, 585), name, font=small, fill=fg)
        canvas.save(OUT / ('preview-dark.jpg' if dark else 'preview.jpg'), quality=95)
    with Image.open(ROOT / SPEC['assets'][0]['output']) as gif:
        sheet = Image.new('RGB', (4*384, 4*171))
        for i in range(16):
            gif.seek(i)
            sheet.paste(gif.convert('RGB').resize((384, 171), Image.Resampling.LANCZOS), (i%4*384, i//4*171))
        sheet.save(OUT / 'storyboard-preview.jpg', quality=95)


if __name__ == '__main__':
    records = []
    for asset in SPEC['assets']:
        if asset['kind'] == 'map':
            record = map_icon(asset)
        else:
            record = pack.build(asset, {'source': asset['source']})
        record['rawSha256'] = pack.digest(ROOT / record['raw'])
        records.append(record)
        print('저장·확인: ' + asset['id'])
    verify(records)
    pack.write(Path(__file__).with_name('assets.json'), records)
    preview()
