#!/usr/bin/env python3
"""모형·회전 전시·기하학적 조립을 2D 회화 원화의 발견 장면으로 교체한다."""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import sys
import time

from PIL import Image, ImageOps, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / 'artifacts/discovery-painted-20261126'
SOURCES = HERE / 'sources'
RECEIPTS = HERE / 'receipts'
SPEC = json.loads((HERE / 'plan.json').read_text(encoding='utf-8'))
ROWS = SPEC['generate'] + SPEC['recompose']
NEW = {r['id'] for r in SPEC['generate']}
module = importlib.util.spec_from_file_location('discovery_original_pack', ROOT / 'tools/discovery_gif_repair_20261126/build.py')
base = importlib.util.module_from_spec(module)
module.loader.exec_module(base)
base.OUT = OUT
W, H, COUNT = 576, 256, 24


def write(path, data):
    path.parent.mkdir(exist_ok=True, parents=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    tmp.replace(path)


def digest(path):
    with path.open('rb') as handle:
        return hashlib.file_digest(handle, 'sha256').hexdigest()


def prepare_paintings():
    SOURCES.mkdir(exist_ok=True, parents=True)
    for row in SPEC['recompose']:
        source = SOURCES / (row['id'] + '.png')
        if not source.exists():
            shutil.copy2(ROOT / row['source'], source)
            source.touch()
        meta = SOURCES / (row['id'] + '.json')
        if not meta.exists():
            write(meta, {'id': row['id'], 'name': row['name'], 'generator': 'existing ImageGen painting',
                'originalSource': row['source'], 'operation': '기존 회화 원화 보존, 기하학적 조립·합성 별과 달 제거'})


def ready(row):
    source = SOURCES / (row['id'] + '.png')
    meta = SOURCES / (row['id'] + '.json')
    receipt = RECEIPTS / (row['id'] + '.json')
    if not source.is_file() or not meta.is_file() or not receipt.is_file():
        return False
    record = json.loads(receipt.read_text(encoding='utf-8'))
    return record['sourceMtimeNs'] == source.stat().st_mtime_ns and all(p.is_file() for p in base.paths(row['id']))


def backup(row):
    result = []
    for target in base.paths(row['id']):
        saved = HERE / 'before' / target.relative_to(ROOT)
        if not saved.exists():
            saved.parent.mkdir(exist_ok=True, parents=True)
            shutil.copy2(target, saved)
        result.append({'file': saved.relative_to(ROOT).as_posix(), 'sha256': digest(saved)})
    return result


def build(row):
    if ready(row):
        return
    did = row['id']
    source = SOURCES / (did + '.png')
    original = backup(row)
    with Image.open(source) as im:
        im.load()
        assert im.width >= W and im.height >= H, did
        painting = ImageOps.fit(im.convert('RGB'), (W * 2, H * 2), Image.Resampling.LANCZOS)
    frames = []
    for i in range(COUNT):
        p = i / (COUNT - 1)
        ease = p * p * (3 - 2 * p)
        # 전 장면이 회화다. 마지막에는 그림 전체를 보존하며, 도형·모형·별·달을 합성하지 않는다.
        scale = 1.05 - .05 * ease
        cw, ch = painting.width / scale, painting.height / scale
        x, y = (painting.width - cw) * .5, (painting.height - ch) * .5
        frames.append(painting.resize((W, H), Image.Resampling.LANCZOS, box=(x, y, x + cw, y + ch)))
    palette = frames[-1].convert('P', palette=Image.Palette.ADAPTIVE, colors=256)
    quantized = [f.quantize(palette=palette, dither=Image.Dither.FLOYDSTEINBERG) for f in frames]
    total = base.duration_ms(row)
    unit = total // COUNT // 10 * 10
    durations = [unit] * (COUNT - 1) + [total - unit * (COUNT - 1)]
    targets = base.paths(did)
    temp = targets[0].with_suffix('.gif.tmp')
    quantized[0].save(temp, format='GIF', save_all=True, append_images=quantized[1:], duration=durations,
        loop=0, disposal=1, optimize=False)
    temp.replace(targets[0])
    temp = targets[1].with_suffix('.jpg.tmp')
    frames[-1].save(temp, format='JPEG', quality=95, optimize=True)
    temp.replace(targets[1])
    sheet = Image.new('RGB', (W * 6, H * 4))
    for i, f in enumerate(frames):
        sheet.paste(f, (i % 6 * W, i // 6 * H))
    temp = targets[2].with_suffix('.webp.tmp')
    sheet.save(temp, format='WEBP', quality=90, method=4)
    temp.replace(targets[2])
    record = {'id': did, 'name': row['name'], 'cat': row['cat'], 'style': '2D oil/gouache',
        'newPainting': did in NEW, 'source': source.relative_to(ROOT).as_posix(),
        'sourceSha256': digest(source), 'sourceMtimeNs': source.stat().st_mtime_ns,
        'durationMs': total, 'logicalFrames': COUNT, 'before': original,
        'files': [{'file': p.relative_to(ROOT).as_posix(), 'sha256': digest(p), 'bytes': p.stat().st_size} for p in targets]}
    write(RECEIPTS / (did + '.json'), record)
    print('회화 적용', did, row['name'], flush=True)


def gallery():
    complete = [{**r, 'desc': r.get('desc') or ''} for r in ROWS if ready(r)]
    base.gallery(complete)
    path = OUT / 'index.html'
    text = path.read_text(encoding='utf-8')
    text = text.replace('발견물 GIF 누락 복구', '회화풍으로 다시 그린 발견물')
    old = '전체 1,744종을 검사해 빠진 발견물 438종에 전용 원화·GIF·마지막 장면·재생 시트를 연결합니다.'
    text = text.replace(old, f'새 회화 원화 657종과 조립 연출을 제거하는 271종 중 {len(complete)}종을 적용했습니다. 모든 프레임에서 모형·폴리곤·조각 조립을 사용하지 않습니다.')
    for row in complete:
        did = row['id']
        key = f'<a href="../../images/discoveries/{did}.gif">GIF</a>'
        text = text.replace(key, key + f' · <a href="../../tools/discovery_painted_20261126/sources/{did}.png">원화</a> · <a href="../../tools/discovery_painted_20261126/before/images/discoveries/{did}.gif">이전 GIF</a>')
    path.write_text(text, encoding='utf-8', newline='\n')
    return complete


def finish(rows):
    receipts = [json.loads((RECEIPTS / (r['id'] + '.json')).read_text(encoding='utf-8')) for r in rows]
    # 출력 때 기록하고 별도 검사에서 다시 확인하는 해시를 재사용한다.
    # 그림 모음을 만들려고 모든 원화와 GIF를 세 번째로 읽지 않는다.
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 13)
    for start in range(0, len(rows), 54):
        group = rows[start:start + 54]
        contact = Image.new('RGB', (1200, ((len(group) + 5) // 6) * 135), '#18212a')
        draw = ImageDraw.Draw(contact)
        for i, row in enumerate(group):
            x, y = i % 6 * 200, i // 6 * 135
            with Image.open(base.paths(row['id'])[1]) as im:
                contact.paste(im.resize((196, 87), Image.Resampling.LANCZOS), (x, y))
            draw.text((x, y + 88), row['id'], fill='#c9b787', font=font)
            name = row['name']
            draw.text((x, y + 104), name[:14], fill='white', font=font)
            if len(name) > 14:
                draw.text((x, y + 119), name[14:28], fill='white', font=font)
        contact.save(OUT / ('contact-' + str(start // 54 + 1).zfill(2) + '.jpg'), quality=92)
    write(HERE / 'assets.json', receipts)
    write(HERE / 'prompts.json', {'generator': 'built-in image_gen', 'assets': [json.loads((SOURCES / (r['id'] + '.json')).read_text(encoding='utf-8')) for r in SPEC['generate']],
        'recomposed': [json.loads((SOURCES / (r['id'] + '.json')).read_text(encoding='utf-8')) for r in SPEC['recompose']]})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--watch', action='store_true')
    args = parser.parse_args()
    prepare_paintings()
    while True:
        pending = [r for r in ROWS if (SOURCES / (r['id'] + '.png')).is_file() and (SOURCES / (r['id'] + '.json')).is_file() and not ready(r)]
        with ThreadPoolExecutor(max_workers=4) as pool:
            list(pool.map(build, pending[:12]))
        complete = gallery()
        print(f'회화 적용 {len(complete)}/{len(ROWS)} · 새 원화 {sum(r["id"] in NEW for r in complete)}/{len(NEW)}', flush=True)
        if len(complete) == len(ROWS):
            finish(complete)
            break
        if not args.watch and not pending:
            break
        if not pending:
            time.sleep(15)


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    main()
