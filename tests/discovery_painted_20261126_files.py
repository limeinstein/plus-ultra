#!/usr/bin/env python3
"""회화 원화·교체 전 보존·실제 출력·옛 출력기의 덮어쓰기 방지를 검사한다."""
from __future__ import annotations
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import sys

import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
HERE = ROOT / 'tools/discovery_painted_20261126'
OUT = ROOT / 'artifacts/discovery-painted-20261126'


def digest(path):
    with path.open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()


def check(row, new):
    did = row['id']
    receipt = json.loads((HERE / 'receipts' / (did + '.json')).read_text(encoding='utf-8'))
    source = ROOT / receipt['source']
    assert digest(source) == receipt['sourceSha256'], '원화 변경:' + did
    assert receipt['newPainting'] == new and receipt['style'] == '2D oil/gouache', did
    meta = json.loads((HERE / 'sources' / (did + '.json')).read_text(encoding='utf-8'))
    assert meta['id'] == did
    if new:
        assert meta['generator'] == 'built-in image_gen' and 'TWO-DIMENSIONAL' in meta['prompt'], did
    else:
        assert digest(ROOT / meta['originalSource']) == receipt['sourceSha256'], '기존 회화 원화 보존:' + did
    for file in receipt['files'] + receipt['before']:
        assert digest(ROOT / file['file']) == file['sha256'], '결과·보존본 변경:' + file['file']
    assert receipt['files'][0]['sha256'] != receipt['before'][0]['sha256'], '옛 GIF 미교체:' + did
    with Image.open(source) as raw:
        expected = np.asarray(ImageOps.fit(raw.convert('RGB'), (576, 256), Image.Resampling.LANCZOS), dtype=np.int16)
    with Image.open(ROOT / 'images/discovery-ends' / (did + '.jpg')) as im:
        actual = np.asarray(im.convert('RGB'), dtype=np.int16)
    error = float(np.abs(expected - actual).mean())
    assert error < 8, '회화와 끝 장면 불일치:' + did + ':' + str(error)
    with Image.open(ROOT / 'images/discoveries' / (did + '.gif')) as im:
        assert im.size == (576, 256) and im.n_frames >= 16, did
        im.seek(im.n_frames - 1)
        last = np.asarray(im.convert('RGB'), dtype=np.int16)
        assert np.abs(last - expected).mean() < 10, 'GIF 마지막 장면의 회화 불일치:' + did
    with Image.open(ROOT / 'images/discovery-sheets' / (did + '.webp')) as im:
        assert im.size == (3456, 1024), did
        last = np.asarray(im.crop((2880, 768, 3456, 1024)).convert('RGB'), dtype=np.int16)
        assert np.abs(last - expected).mean() < 8, '시트 마지막 장면의 회화 불일치:' + did
    return {'id': did, 'newPainting': new, 'lastFrameMeanError': round(error, 4)}


def guard_tests(known):
    cases = [
        ('ruin_gifs/build.py', 'build_one', 'giza', [Path('존재하지 않는 옛 모형.png')]),
        ('ruin_gifs/build_v2.py', 'build_one', 'giza', [ROOT / 'images/discoveries']),
        ('ruin_gifs/build_cinematic.py', 'build_one', 'giza', [ROOT / 'images/discoveries', ROOT / 'images/discovery-ends']),
        ('nature_gifs/build.py', 'build_one', 'canyon', []),
        ('plant_gifs/build.py', 'build_one', 'sequoia', []),
        ('treasure_gifs/build.py', 'build_one', 'moonjar', []),
        ('trade_gifs/build.py', 'build_one', 't_pepper', [Path('존재하지 않는 옛 모형 폴더')]),
        ('ruin_gifs/sheets.py', 'build', 'moonjar', [True]),
    ]
    checked = []
    for rel, fn, did, args in cases:
        if did not in known:
            continue
        files = [ROOT / 'images' / folder / (did + ext) for folder, ext in [('discoveries', '.gif'), ('discovery-ends', '.jpg'), ('discovery-sheets', '.webp')]]
        before = [digest(p) for p in files]
        path = ROOT / 'tools' / rel
        sys.path.insert(0, str(path.parent))
        try:
            spec = importlib.util.spec_from_file_location('painted_guard_' + str(len(checked)), path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            getattr(module, fn)(did, *args)
        finally:
            sys.path.pop(0)
        assert before == [digest(p) for p in files], '옛 출력기가 회화를 덮어썼습니다:' + rel
        checked.append(rel)
    return checked


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--partial', action='store_true')
    args = parser.parse_args()
    spec = json.loads((HERE / 'plan.json').read_text(encoding='utf-8'))
    assert len(spec['generate']) == 657 and len(spec['recompose']) == 271
    rows = spec['generate'] + spec['recompose']
    assert len(rows) == len({r['id'] for r in rows}) == 928
    new = {r['id'] for r in spec['generate']}
    ready = [r for r in rows if (HERE / 'receipts' / (r['id'] + '.json')).is_file()]
    assert args.partial or len(ready) == len(rows), f'회화 교체 누락:{len(ready)}/{len(rows)}'
    result = [check(r, r['id'] in new) for r in ready]
    guards = guard_tests({r['id'] for r in ready})
    if not args.partial:
        assert len(guards) == 8
    report = {'total': len(rows), 'checked': len(result), 'newPainting': sum(r['newPainting'] for r in result),
        'recomposed': sum(not r['newPainting'] for r in result), 'guards': guards, 'pass': True, 'results': result}
    (OUT / ('style-partial.json' if args.partial else 'style.json')).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'PASS: 회화 {len(result)}/{len(rows)}, 원본·결과 해시·끝 장면·시트·옛 출력기 보호 {len(guards)}개')


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    main()
