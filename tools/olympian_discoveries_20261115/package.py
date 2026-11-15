"""신화 발견물 원화를 기존 GIF·장면 판·투명 외관·보상 그림 규격으로 묶는다."""
import hashlib
import html
import importlib.util
import json
from pathlib import Path
import shutil
import sys
import zipfile

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).parent
OUT = ROOT / 'artifacts/olympian-discoveries-20261115'
SPEC = json.loads((HERE / 'spec.json').read_text(encoding='utf-8'))
GENERATED = json.loads((HERE / 'generated.json').read_text(encoding='utf-8'))
sys.path.insert(0, str(ROOT / 'tools/discovery_art_20261111'))
module = importlib.util.spec_from_file_location('discovery_pack', ROOT / 'tools/discovery_art_20261111/package.py')
pack = importlib.util.module_from_spec(module)
module.loader.exec_module(pack)
pack.OUT = OUT


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def icon(asset, generated):
    raw = OUT / 'raw' / (asset['id'] + '.png')
    raw.parent.mkdir(parents=True, exist_ok=True)
    if not raw.exists():
        shutil.copy2(generated['source'], raw)
    path = ROOT / asset['output']
    receipt = OUT / 'packaged' / (asset['id'] + '.json')
    if path.exists() and not receipt.exists():
        raise FileExistsError('기존 외관 보존: ' + str(path))
    with Image.open(raw) as source:
        image = source.convert('RGBA')
        alpha = image.getchannel('A')
        assert alpha.getextrema() == (0, 255), asset['id']
        obj = image.crop(alpha.getbbox())
        obj.thumbnail((456, 456), Image.Resampling.LANCZOS)
        canvas = Image.new('RGBA', (512, 512))
        canvas.paste(obj, ((512 - obj.width) // 2, (512 - obj.height) // 2))
        path.parent.mkdir(parents=True, exist_ok=True)
        canvas.save(path, 'WEBP', quality=94, method=4, exact=True)
        record = {**asset, 'raw': raw.relative_to(ROOT).as_posix(), 'size': [512, 512],
                  'files': [{'file': asset['output'], 'bytes': path.stat().st_size, 'sha256': pack.digest(path)}]}
        write(receipt, record)
        return record


def update_manifest(records):
    """이번에 만든 열쇠만 추가한다. 다른 작업의 파일 선택은 그대로 둔다."""
    path = ROOT / 'images/manifest.js'
    text = path.read_text(encoding='utf-8')
    start, end = text.index('{', text.index('G.IMAGE_FILES =')), text.rindex('}') + 1
    data = json.loads(text[start:end])
    for row in records:
        for file in row['files']:
            relative = file['file'].removeprefix('images/')
            data[str(Path(relative).with_suffix('')).replace('\\', '/')] = relative
    path.write_text(text[:start] + json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True) + text[end:], encoding='utf-8', newline='\n')


def verify(records):
    for record in records:
        for row in record['files']:
            path = ROOT / row['file']
            assert pack.digest(path) == row['sha256']
            with Image.open(path) as image:
                image.load()
                if path.suffix == '.gif':
                    assert image.size == (576, 256) and image.n_frames >= 16
                    elapsed, unique = 0, set()
                    for i in range(image.n_frames):
                        image.seek(i)
                        elapsed += image.info['duration']
                        unique.add(hashlib.sha256(image.convert('RGB').tobytes()).digest())
                    assert elapsed == 9820 and len(unique) == image.n_frames, (path, elapsed)
                elif record['kind'] in ('map', 'relic'):
                    size, margin = (512, 27) if record['kind'] == 'map' else (256, 13)
                    assert image.size == (size, size) and image.mode == 'RGBA'
                    alpha = image.getchannel('A')
                    assert alpha.getextrema() == (0, 255)
                    x0, y0, x1, y1 = alpha.getbbox()
                    assert min(x0, y0, size-x1, size-y1) >= margin
                else:
                    assert image.size == ((3456, 1024) if path.suffix == '.webp' else (576, 256))


def previews(records):
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 18)
    small = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 14)
    canvas = Image.new('RGB', (1344, 7*230), '#202936')
    draw = ImageDraw.Draw(canvas)
    cards = []
    for i, item in enumerate(SPEC['assets']):
        did, y = item['id'], i*230
        draw.text((18, y+12), item['name'] + ' · ' + item['god'], font=font, fill='#f2d9a4')
        with Image.open(ROOT / f'images/discovery-ends/{did}.jpg') as picture:
            canvas.paste(picture.resize((432,192)), (18,y+40))
        for folder, x, size in [('map-discoveries/completion', 494, 180), ('relics', 775, 180)]:
            name = ('r_' if folder == 'relics' else '') + did
            with Image.open(ROOT / f'images/{folder}/{name}.webp') as picture:
                picture.thumbnail((size,size))
                canvas.paste(picture, (x+(size-picture.width)//2,y+45+(size-picture.height)//2), picture)
        draw.text((1030,y+80), '파노라마 · 낮과 밤' if item['style']=='nat' else '동굴 안팎 답사' if item['style']=='cave' else '모형 공사 · 실물 답사', font=small, fill='white')
        draw.text((1030,y+108), '9.82초 · 전용 보상', font=small, fill='white')
        cards.append('<article><h2>'+html.escape(item['name'])+'</h2><p>'+html.escape(item['god'])+'</p>'
                     '<img class="scene" src="../../images/discoveries/'+did+'.gif">'
                     '<div class="icons"><img src="../../images/map-discoveries/completion/'+did+'.webp">'
                     '<img src="../../images/relics/r_'+did+'.webp"></div></article>')
    canvas.save(OUT / 'preview.jpg', quality=93)
    (OUT / 'preview.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><title>그리스 신화 발견물</title>'
        '<style>body{margin:24px;background:#202936;color:#f5e6c5;font-family:system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:20px}article{padding:18px;background:#303b49;border-radius:12px}h2{font-size:20px}.scene{width:100%;height:auto}.icons{display:flex;justify-content:space-evenly}.icons img{width:140px;object-fit:contain}p{color:#c5cbd2}</style>'
        '<h1>흩어진 그리스 신들의 성소</h1><p>새 발견물 7종 · 형태별 GIF · 지도 외관 · 발견 보상</p><main>'+''.join(cards)+'</main></html>', encoding='utf-8')


if __name__ == '__main__':
    generated = {(row['kind'], row['id']): row for row in GENERATED}
    records = []
    for item in SPEC['assets']:
        did, name = item['id'], item['name']
        scene = {'id': 'scene_'+did, 'disc': did, 'name': name, 'kind': 'scene',
                 'output': f'images/discoveries/{did}.gif', 'end': f'images/discovery-ends/{did}.jpg',
                 'sheet': f'images/discovery-sheets/{did}.webp', 'sceneStyle': 'nat-dawn' if item['style']=='nat' else 'ruin'}
        if item['style'] != 'nat':
            # 원화를 눈으로 확인한 정확한 4×4 경계. 동굴의 짙은 바위를 칸막이로 잘못 읽지 않는다.
            scene['sceneLayout'] = {'columnsPerRow': [4, 4, 4, 4], 'skipFrames': []}
        records.append(pack.build(scene, generated['scene',did]))
        reward = {'id': 'r_'+did, 'disc': did, 'name': item['god']+'의 보상', 'kind': 'relic', 'output': f'images/relics/r_{did}.webp'}
        records.append(pack.build(reward, generated['reward',did]))
        exterior = {'id': 'map_'+did, 'disc': did, 'name': name+' 외관', 'kind': 'map', 'output': f'images/map-discoveries/completion/{did}.webp'}
        records.append(icon(exterior, generated['map',did]))
        print('제작: '+did, flush=True)
    verify(records)
    update_manifest(records)
    write(HERE / 'assets.json', records)
    previews(records)
    with zipfile.ZipFile(OUT / 'olympian-discoveries-20261115.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for record in records:
            for row in record['files']:
                archive.write(ROOT / row['file'], row['file'])
        for name in ('spec.json', 'generated.json', 'assets.json'):
            archive.write(HERE / name, 'production/' + name)
    print('7종 · 원화 21장 · 게임 그림 35개 · GIF/시트/끝 장면/외관/보상 확인')
