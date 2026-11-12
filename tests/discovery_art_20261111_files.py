"""신규 발견 연출과 전체 증빙 원화·해도·구입 단서의 파일 연결을 점검한다."""
from collections import Counter
import hashlib
import json
from pathlib import Path
import subprocess
import sys

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts/discovery-art-20261111'
spec = json.loads((ROOT / 'tools/discovery_art_20261111/prompts.json').read_text(encoding='utf-8'))
assets = spec['assets']
assert len(assets) == len({row['id'] for row in assets})
assert Counter(row['kind'] for row in assets) == {'scene': 42, 'relic': 289, 'evidence': 18, 'clue': 26}
records = json.loads((ROOT / 'tools/discovery_art_20261111/assets.json').read_text(encoding='utf-8'))
assert {row['id'] for row in records} == {row['id'] for row in assets}, '제작 기록 누락'
by_id = {row['id']: row for row in records}
for row in assets:
    record = by_id[row['id']]
    if '--raw' in sys.argv:
        assert (ROOT / record['raw']).exists(), '원본 누락: ' + row['id']
    for item in record['files']:
        file = ROOT / item['file']
        assert file.exists() and file.stat().st_size > 0, item['file']
        assert hashlib.sha256(file.read_bytes()).hexdigest() == item['sha256'], item['file']
    if row['kind'] == 'scene':
        with Image.open(ROOT / row['output']) as gif:
            assert gif.size == (576, 256) and gif.n_frames >= 16, row['id']
        with Image.open(ROOT / row['sheet']) as sheet:
            assert sheet.size == (3456, 1024), row['id']
            first = sheet.crop((0, 0, 576, 256)).convert('RGB')
            middle = sheet.crop((0, 512, 576, 768)).convert('RGB')
            assert ImageChops.difference(first, middle).getbbox(), '움직임 누락: ' + row['id']
        with Image.open(ROOT / row['end']) as end:
            assert end.size == (576, 256), row['id']
    else:
        with Image.open(ROOT / row['output']) as icon:
            assert icon.mode == 'RGBA' and icon.size == (256, 256), row['id']
            alpha = icon.getchannel('A')
            assert alpha.getextrema()[0] == 0 and alpha.getextrema()[1] >= 240, row['id']
            x0, y0, x1, y1 = alpha.getbbox()
            assert min(x0, y0, 256 - x1, 256 - y1) >= 13, row['id']
subprocess.run(['node', 'tools/discovery_art_20261111/audit.cjs', '--strict', '--out',
                'artifacts/discovery-art-20261111/audit-after.json'], cwd=ROOT, check=True)
audit = json.loads((OUT / 'audit-after.json').read_text(encoding='utf-8'))
for row in audit['relics']:
    assert any(item['file'] and item['manifest'] and (ROOT / 'images' / item['manifest']).exists()
               for item in row['assets']), '증빙 유물 전용 원화 연결 누락: ' + row['id']
print('PASS: discovery masters 42; proof icons 333; GIF/end/sheet 42 sets; all discovery/proof links complete')
