#!/usr/bin/env python3
"""현재 사용하는 탐험 시트와 독립 실행 미리보기를 묶는다."""
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT/'docs/art/expedition-motion-manifest.json').read_text(encoding='utf-8'))
files = ['test_expedition_sprites.html', 'js/core/images.js', 'js/data/seafx.js',
         'js/data/expedition_motion.js', 'js/art/party.js', 'js/art/expedition_motion.js',
         'docs/art/expedition-motion-manifest.json']
files += ['images/' + s['file'] for s in manifest['sheets'].values()]
prompts = json.loads((ROOT/'tools/expedition_generation.json').read_text(encoding='utf-8'))
for record in prompts['records']:
    record.pop('source', None)
    record.pop('previousSource', None)
target = ROOT/'docs/art/expedition-motion-sprites.zip'
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
    for name in files:
        archive.write(ROOT/name, name)
    archive.write(ROOT/'docs/art/expedition-motion.md', 'README.md')
    archive.writestr('generation-prompts.json', json.dumps(prompts, ensure_ascii=False, indent=2))
    archive.writestr('images/manifest.js', 'window.G = window.G || {}; window.G.IMAGE_FILES = {};\n')
with zipfile.ZipFile(target) as archive:
    assert archive.testzip() is None
    assert len([n for n in archive.namelist() if n.endswith('.png')]) == 22
print(f'{target.name}: {target.stat().st_size/1024/1024:.1f} MiB · PNG 22장 · 압축 검사 통과')
