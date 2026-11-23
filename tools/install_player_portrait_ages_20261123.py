#!/usr/bin/env python3
"""제작한 제독 그림을 40세 중년·70세 노년 단계에 연결한다. 기존 원화는 보존한다."""
import hashlib
import json
from pathlib import Path

from PIL import Image

import images

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'output' / 'imagegen'
META = ROOT / 'tools' / 'player_portrait_ages_20261123'
FIRST = SOURCE / 'player-faces-seven-20261123'
MIDDLE = SOURCE / 'player-faces-seven-plus20-20261123'
REMAINING = SOURCE / 'player-remaining-seven-plus30-20261123'


def main():
    META.mkdir(parents=True, exist_ok=True)
    overrides, records, prompts = {}, [], {}
    for folder in (FIRST, MIDDLE, REMAINING):
        data = json.loads((folder / 'prompts-and-sources.json').read_text(encoding='utf-8'))
        prompts[folder.name] = data
    for rec in prompts[FIRST.name]['records']:
        for stage, source in [('young', FIRST / 'young'), ('middle', MIDDLE), ('elderly', FIRST / 'middle-aged')]:
            records.extend(export(rec, stage, source, overrides))
    for rec in prompts[REMAINING.name]['records']:
        records.extend(export(rec, 'elderly', REMAINING, overrides))
    (META / 'asset-overrides.json').write_text(json.dumps(overrides, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (META / 'sources-and-prompts.json').write_text(json.dumps(prompts, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (META / 'installed-assets.json').write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    # 다른 작업에서 등록한 그림을 건드리지 않고 이번 그림과 별칭만 목록에 합친다.
    images.PREFERRED_FILES.update(overrides)
    found, _ = images.scan()
    manifest = ROOT / 'images' / 'manifest.js'
    text = manifest.read_text(encoding='utf-8')
    current = json.loads(text[text.index('G.IMAGE_FILES = ') + len('G.IMAGE_FILES = '):].strip().rstrip(';'))
    for key, rel in overrides.items():
        current[key] = found[key]
        raw_key = str(Path(rel).with_suffix('')).replace('\\', '/')
        current[raw_key] = found[raw_key]
    images.write_manifest(current)
    print('제독 그림 %d개 연결: 젊은 14개·중년 14개·노년 28개' % len(records))


def export(rec, stage, source, overrides):
    result = []
    ident = rec['id']
    young_half = 'characters/player_half' + ('' if ident == 'admiral' else '_' + ident)
    for kind in ('face', 'knee'):
        src = source / kind / (ident + '.png')
        group = 'portraits' if kind == 'face' else 'characters'
        rel = f'{group}/player-ages-20261123/{stage}/{ident}.webp'
        target = ROOT / 'images' / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(src) as original:
            image = original.convert('RGBA').resize((512, 512), Image.Resampling.LANCZOS)
            image.save(target, lossless=True, method=6)
        if kind == 'face':
            folder = {'young': 'player', 'middle': 'player-aged', 'elderly': 'player-elderly'}[stage]
            key = f'portraits/{folder}/{ident}'
        else:
            key = young_half + {'young': '', 'middle': '_old', 'elderly': '_elderly'}[stage]
        overrides[key] = rel
        result.append({'id': ident, 'name': rec['name'], 'stage': stage, 'kind': kind,
                       'key': key, 'file': rel, 'source': str(src),
                       'sourceSHA256': hashlib.sha256(src.read_bytes()).hexdigest()})
    return result


if __name__ == '__main__':
    main()
