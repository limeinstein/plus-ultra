"""최종 원화·표시본·연결·압축 파일의 누락과 규격을 확인한다."""
from pathlib import Path
from collections import Counter
import hashlib
import json
import zipfile
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'artifacts/plant-native-art-20261119'
plan = json.loads((OUT / 'prompts.json').read_text(encoding='utf-8'))
checks = json.loads((OUT / 'checks.json').read_text(encoding='utf-8'))
mapping = json.loads((Path(__file__).parent / 'asset-overrides.json').read_text(encoding='utf-8'))
ui = json.loads((OUT / 'ui-checks.json').read_text(encoding='utf-8'))
counts = Counter(job['type'] for job in plan['jobs'])
assert dict(counts) == {'plant': 96, 'village': 11, 'exterior': 77, 'interior': 77}, counts
assert checks['completed'] == checks['expected'] == len(plan['jobs']) == 261
assert len(mapping) == 368
assert ui['loaded'] == ui['gallery'] == ui['expected'] == 261 and not ui['errors']
assert len(ui['rendered']) == 6
hashes = set()
for job in plan['jobs']:
    original = OUT / 'originals' / (job['id'] + '.png')
    display = ROOT / 'images/plant-native-20261119' / (job['id'] + '.webp')
    digest = hashlib.sha256(original.read_bytes()).hexdigest()
    assert digest not in hashes, ('중복 원화', job['id'])
    hashes.add(digest)
    with Image.open(original) as im:
        im.load()
        if job['type'] == 'plant':
            assert im.mode == 'RGBA' and im.getchannel('A').getextrema() == (0, 255), job['id']
    with Image.open(display) as im:
        im.load()
        assert im.size == ((256, 256) if job['type'] == 'plant' else (1536, 864)), job['id']
        if job['type'] == 'plant':
            assert im.mode == 'RGBA' and im.getchannel('A').getextrema() == (0, 255), job['id']
            alpha = im.getchannel('A')
            assert not any(alpha.crop(box).getbbox() for box in [(0,0,256,8),(0,248,256,256),(0,0,8,256),(248,0,256,256)]), job['id']
    for key in job['keys']:
        assert mapping[key] == 'plant-native-20261119/' + display.name, key
with zipfile.ZipFile(OUT / 'plant-native-art-20261119.zip') as archive:
    assert archive.testzip() is None
    assert len(archive.namelist()) == 262
    for record in checks['records']:
        assert archive.read(record['file']) == (ROOT / record['file']).read_bytes(), record['id']
result = {'counts': dict(counts), 'originals':len(hashes), 'displayFiles':261, 'logicalKeys':len(mapping),
          'transparentIcons':96, 'zipEntries':262, 'gameLoaded':ui['loaded'], 'galleryLoaded':ui['gallery'],
          'renderedScenes':len(ui['rendered']), 'errors':[]}
(OUT / 'final-checks.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(result, ensure_ascii=False))
