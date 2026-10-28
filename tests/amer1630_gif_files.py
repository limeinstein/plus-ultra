#!/usr/bin/env python3
"""아메리카 70종의 데이터·원화·GIF·마지막 장면·6열 재생 시트의 연결과 규격 검사."""
import json
import re
from pathlib import Path
from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[1]
rows = json.loads((ROOT / 'docs/art/amer1630-gif-prompts.json').read_text(encoding='utf-8'))['items']
source = (ROOT / 'js/data/amer1630.js').read_text(encoding='utf-8')
ids = re.findall(r"^(?:nat|plant|ani|ruin|uni)\('([^']+)'", source, re.M)
assert len(rows) == len(ids) == 70
assert set(ids) == {r['id'] for r in rows}
expected = {'nature': (9820, 22, 25), 'plant': (8400, 24, 24), 'animal': (7200, 18, 18), 'ruin': (9820, 16, 16)}
manifest = (ROOT / 'images/manifest.js').read_text(encoding='utf-8')
for row in rows:
    did, kind = row['id'], row['kind']
    original = ROOT / row['target']
    assert original.is_file(), original
    with Image.open(original) as im:
        assert im.width >= 1024 and im.height >= 700, (did, im.size)
    for prefix, suffix in [('discoveries', '.gif'), ('discovery-ends', '.jpg'), ('discovery-sheets', '.webp')]:
        key = prefix + '/' + did
        assert f'"{key}": "{key}{suffix}"' in manifest, key
    with Image.open(ROOT / 'images/discoveries' / (did + '.gif')) as im:
        assert im.size == (576, 256) and im.info.get('loop') == 0, (did, im.size)
        ms, low, high = expected[kind]
        assert low <= im.n_frames <= high, (did, im.n_frames)
        count = im.n_frames
        first = im.convert('RGB')
        duration = 0
        for frame in range(count):
            im.seek(frame)
            duration += im.info.get('duration', 0)
        last = im.convert('RGB')
        assert duration == ms, (did, duration, ms)
        assert sum(ImageStat.Stat(ImageChops.difference(first, last)).mean) / 3 > 1, (did, '변화 없는 GIF')
    with Image.open(ROOT / 'images/discovery-ends' / (did + '.jpg')) as im:
        assert im.size == (576, 256), (did, im.size)
        delta = sum(ImageStat.Stat(ImageChops.difference(im.convert('RGB'), last)).mean) / 3
        assert delta < 20, (did, '마지막 장면이 다름', delta)
    with Image.open(ROOT / 'images/discovery-sheets' / (did + '.webp')) as im:
        height = max(1, round(count / 6)) * 256
        assert im.size == (3456, height), (did, im.size)
        final = im.convert('RGB').crop((2880, height - 256, 3456, height))
        delta = sum(ImageStat.Stat(ImageChops.difference(final, last)).mean) / 3
        assert delta < 20, (did, '시트 끝 칸이 다름', delta)
    print('OK', did, kind, count, duration)
print('PASS: 아메리카 발견물 70종의 원화·GIF·끝 장면·장면 판·manifest')
