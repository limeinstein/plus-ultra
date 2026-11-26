#!/usr/bin/env python3
"""누락 발견물 전용 ImageGen 원화를 GIF·마지막 장면·24칸 시트로 변환한다."""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import html
import json
from pathlib import Path
import re
import sys
import time

from PIL import Image, ImageDraw, ImageFont, ImageOps

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from complete_discovery_art import complete_runtime

SOURCES = HERE / 'sources'
OUT = ROOT / 'artifacts/discovery-gif-qa-20261126'
W, H, COUNT = 576, 256, 24
REVEAL_FX = {k: int(v) for k, v in re.findall(r'\b(plantGifMs|treasureGifMs|gifMs)\s*:\s*(\d+)',
    (ROOT / 'js/data/seafx.js').read_text(encoding='utf-8'))}


def duration_ms(row):
    kind = 'plantGifMs' if row.get('plant') else 'treasureGifMs' if row['cat'] in ('treasure', 'trade') and not row.get('natural') else 'gifMs'
    return REVEAL_FX[kind]


def needs_build(row):
    source = SOURCES / (row['id'] + '.png')
    if not source.is_file():
        return False
    if not all(p.is_file() and p.stat().st_mtime >= source.stat().st_mtime for p in paths(row['id'])):
        return True
    # 기존 9.82초 원화를 먼저 설치했어도 설치형의 식물·보물·교역품 길이(현재 8.4초)에 맞춰 보완한다.
    with Image.open(paths(row['id'])[0]) as gif:
        unit = duration_ms(row) // COUNT // 10 * 10
        return gif.info.get('duration', 0) <= 0 or gif.info['duration'] % unit != 0


def frames(did, source):
    with Image.open(source) as raw:
        raw.load()
        image = raw.convert('RGB')
    assert image.width >= 1024 and image.height >= 512, f'원화 크기 부족: {did}'
    if did == 'ds_083':
        # 이 발견물은 한 장의 풍경 대신 4×4의 실제 접근 장면을 생성했다.
        cells = []
        for y in range(4):
            for x in range(4):
                box = (round(x * image.width / 4), round(y * image.height / 4),
                       round((x + 1) * image.width / 4), round((y + 1) * image.height / 4))
                cells.append(ImageOps.fit(image.crop(box), (W, H), Image.Resampling.LANCZOS))
        return [Image.blend(cells[int(i * 15 / 23)], cells[min(15, int(i * 15 / 23) + 1)], (i * 15 / 23) % 1) for i in range(COUNT)]
    # 대상마다 별도로 그린 원화를 완만하게 확대한다. 끝 장면은 원래 색을 그대로 보존한다.
    base = ImageOps.fit(image, (W * 2, H * 2), Image.Resampling.LANCZOS)
    result = []
    for i in range(COUNT):
        p = i / (COUNT - 1)
        ease = p * p * (3 - 2 * p)
        scale = 1 + .075 * ease
        cw, ch = base.width / scale, base.height / scale
        x = (base.width - cw) * (.35 + .3 * ease)
        y = (base.height - ch) * .5
        result.append(base.resize((W, H), Image.Resampling.LANCZOS, box=(x, y, x + cw, y + ch)))
    return result


def paths(did):
    return [ROOT / 'images' / folder / (did + ext) for folder, ext in
            [('discoveries', '.gif'), ('discovery-ends', '.jpg'), ('discovery-sheets', '.webp')]]


def build(row):
    did = row['id']
    targets = paths(did)
    source = SOURCES / (did + '.png')
    if not needs_build(row):
        return False
    fr = frames(did, source)
    # 모든 장면에 공통 256색을 사용해 확대 중 색 깜빡임을 막는다.
    palette = fr[-1].convert('P', palette=Image.Palette.ADAPTIVE, colors=256)
    quantized = [frame.quantize(palette=palette, dither=Image.Dither.FLOYDSTEINBERG) for frame in fr]
    total_ms = duration_ms(row)
    unit = total_ms // COUNT // 10 * 10
    durations = [unit] * (COUNT - 1) + [total_ms - unit * (COUNT - 1)]
    for target in targets:
        target.parent.mkdir(exist_ok=True, parents=True)
    temp = targets[0].with_suffix('.gif.tmp')
    quantized[0].save(temp, format='GIF', save_all=True, append_images=quantized[1:],
                      duration=durations, loop=0, disposal=1, optimize=False)
    temp.replace(targets[0])
    fr[-1].save(targets[1], quality=94, optimize=True)
    sheet = Image.new('RGB', (W * 6, H * 4))
    for i, frame in enumerate(fr):
        sheet.paste(frame, (i % 6 * W, i // 6 * H))
    temp = targets[2].with_suffix('.webp.tmp')
    sheet.save(temp, format='WEBP', quality=84, method=4)
    temp.replace(targets[2])
    print('완성', did, row['name'], flush=True)
    return True


def register(rows):
    manifest = ROOT / 'images/manifest.js'
    text = manifest.read_text(encoding='utf-8')
    additions = []
    for row in rows:
        if not all(p.is_file() for p in paths(row['id'])):
            continue
        for folder, ext in [('discoveries', '.gif'), ('discovery-ends', '.jpg'), ('discovery-sheets', '.webp')]:
            key = folder + '/' + row['id']
            if json.dumps(key) + ':' not in text:
                additions.append('  ' + json.dumps(key) + ': ' + json.dumps(key + ext) + ',\n')
    if additions:
        marker = 'G.IMAGE_FILES = {'
        assert marker in text
        text = text.replace(marker, marker + '\n' + ''.join(sorted(additions)), 1)
        manifest.write_text(text, encoding='utf-8', newline='\n')
    return len(additions)


def gallery(rows):
    cards = []
    labels = {'geo': '지리', 'nature': '자연', 'ruin': '유적', 'treasure': '보물', 'creature': '생물', 'people': '민족', 'trade': '교역품'}
    for r in rows:
        did = r['id']
        if not all(p.is_file() for p in paths(did)):
            continue
        cards.append(f'<article data-cat="{r["cat"]}"><h2>{html.escape(r["name"])}</h2><small>{did} · {labels[r["cat"]]}</small>'
                     f'<button data-gif="../../images/discoveries/{did}.gif" aria-label="{html.escape(r["name"])} GIF 재생">'
                     f'<img loading="lazy" width="576" height="256" src="../../images/discovery-ends/{did}.jpg" alt="{html.escape(r["name"])}"></button>'
                     f'<a href="../../images/discoveries/{did}.gif">GIF</a> · <a href="../../images/discovery-sheets/{did}.webp">재생 시트</a>'
                     f'<p>{html.escape(r.get("desc", ""))}</p></article>')
    OUT.mkdir(exist_ok=True, parents=True)
    page = '''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>발견물 GIF 누락 복구</title><style>body{background:#161c23;color:#e8e1d2;font:16px system-ui;margin:24px auto;max-width:1440px;padding:0 16px}h1{font-size:30px}input,select{font:inherit;padding:10px;margin:8px;background:#27323e;color:inherit;border:1px solid #8c7b5b;border-radius:6px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:18px}article{background:#25303b;border:1px solid #51606b;border-radius:12px;padding:14px}h2{font-size:20px;margin:0 0 8px}small{color:#c7b386}button{padding:0;border:0;background:none;cursor:pointer;display:block;width:100%;margin:12px 0}img{width:100%;height:auto;border-radius:6px;display:block}a{color:#e5c889}p{font-size:14px;line-height:1.6}article[hidden]{display:none}</style>
<h1>발견물 GIF 누락 복구</h1><p>전체 1,744종을 검사해 빠진 발견물 438종에 전용 원화·GIF·마지막 장면·재생 시트를 연결합니다. 그림을 누르면 GIF를 재생하고 다시 누르면 멈춥니다.</p>
<input id="query" type="search" placeholder="이름 또는 ID로 찾기" aria-label="발견물 검색"><select id="cat" aria-label="갈래"><option value="">전체 갈래</option>''' + ''.join(f'<option value="{cat}">{labels[cat]}</option>' for cat in sorted({r['cat'] for r in rows})) + '''</select><span id="count"></span><main class="grid">''' + ''.join(cards) + '''</main><script>
const articles=[...document.querySelectorAll('article')],q=document.querySelector('#query'),c=document.querySelector('#cat');function filter(){let n=0;articles.forEach(a=>{a.hidden=!(a.textContent.toLowerCase().includes(q.value.toLowerCase())&&(!c.value||a.dataset.cat===c.value));if(!a.hidden)n++});document.querySelector('#count').textContent=n+'종'}q.oninput=c.onchange=filter;filter();document.querySelectorAll('button[data-gif]').forEach(b=>b.onclick=()=>{let im=b.querySelector('img');im.loading='eager';if(!b.dataset.still)b.dataset.still=im.src;let play=im.src===b.dataset.still;im.src=play?b.dataset.gif:b.dataset.still;b.setAttribute('aria-pressed',String(play))});</script></html>'''
    (OUT / 'index.html').write_text(page, encoding='utf-8')


def provenance(rows):
    records, prompts = [], []
    def digest(path):
        with path.open('rb') as handle:
            return hashlib.file_digest(handle, 'sha256').hexdigest()
    for row in rows:
        source = SOURCES / (row['id'] + '.png')
        meta = SOURCES / (row['id'] + '.json')
        assert source.is_file() and meta.is_file(), '생성 기록 없음:' + row['id']
        prompts.append(json.loads(meta.read_text(encoding='utf-8')))
        records.append({'id': row['id'], 'name': row['name'], 'cat': row['cat'],
            'motion': 'storyboard' if row['id'] == 'ds_083' else 'camera', 'durationMs': duration_ms(row),
            'source': source.relative_to(ROOT).as_posix(), 'sourceSha256': digest(source),
            'files': [{'file': p.relative_to(ROOT).as_posix(), 'bytes': p.stat().st_size, 'sha256': digest(p)} for p in paths(row['id'])]})
    (HERE / 'assets.json').write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (HERE / 'prompts.json').write_text(json.dumps({'generator': 'built-in image_gen', 'assets': prompts}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 13)
    for start in range(0, len(rows), 54):
        group = rows[start:start + 54]
        contact = Image.new('RGB', (1200, ((len(group) + 5) // 6) * 135), '#18212a')
        draw = ImageDraw.Draw(contact)
        for i, row in enumerate(group):
            x, y = i % 6 * 200, i // 6 * 135
            with Image.open(paths(row['id'])[1]) as im:
                contact.paste(im.resize((196, 87), Image.Resampling.LANCZOS), (x, y))
            draw.text((x, y + 88), row['id'], fill='#c9b787', font=font)
            name = row['name']
            draw.text((x, y + 104), name[:14], fill='white', font=font)
            if len(name) > 14:
                draw.text((x, y + 119), name[14:28], fill='white', font=font)
        contact.save(OUT / ('contact-' + str(start // 54 + 1).zfill(2) + '.jpg'), quality=92)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--watch', action='store_true')
    args = parser.parse_args()
    rows = [r for r in complete_runtime() if r.get('discStoryNew')]
    assert len(rows) == 438, '새 발견물 제작 목록이 바뀌었습니다. 먼저 전체 누락을 다시 조사하세요.'
    while True:
        ready = [r for r in rows if needs_build(r)]
        with ThreadPoolExecutor(max_workers=3) as pool:
            results = list(pool.map(build, ready))
        additions = register(rows)
        if any(results) or additions:
            gallery(rows)
        total = sum(all(p.is_file() for p in paths(r['id'])) for r in rows)
        print(f'완성 {total}/{len(rows)} · 연결 추가 {additions}', flush=True)
        if total == len(rows) or not args.watch:
            gallery(rows)
            if total == len(rows):
                provenance(rows)
            break
        time.sleep(15)


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    main()
