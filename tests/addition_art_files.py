"""추가 발견물 45종과 소지품·유물 31종의 배포 자산·실제 프레임·투명도 검사."""
from pathlib import Path
import json
import re
from collections import Counter
from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[1]
spec = json.loads((ROOT / 'docs/art/additions-20261030-prompts.json').read_text(encoding='utf-8'))
rows = spec['assets']
assert len(rows) == 76 and len({r['id'] for r in rows}) == 76
assert Counter(r['kind'] for r in rows) == {'nature': 38, 'ruin': 7, 'item': 24, 'relic': 7}
manifest = json.loads(re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', (ROOT / 'images/manifest.js').read_text(encoding='utf-8'))[1])

def delta(a, b):
    return sum(ImageStat.Stat(ImageChops.difference(a.convert('RGB'), b.convert('RGB'))).mean) / 3

for row in rows:
    iid = row['id']
    assert (ROOT / row['target']).is_file(), (iid, '원화 누락')
    for f in row['files']:
        rel = f.removeprefix('images/')
        assert manifest.get(str(Path(rel).with_suffix('')).replace('\\', '/')) == rel, (iid, '목록 연결')
        assert (ROOT / f).is_file(), (iid, '배포 파일 누락')
    if row['kind'] in ('item', 'relic'):
        with Image.open(ROOT / row['files'][0]) as im:
            assert im.size == (256, 256) and im.mode == 'RGBA', (iid, im.size, im.mode)
            alpha = im.getchannel('A')
            assert alpha.getextrema() == (0, 255), (iid, '투명도 범위')
            assert all(alpha.getpixel(p) == 0 for p in [(0, 0), (255, 0), (0, 255), (255, 255)]), (iid, '투명 모서리')
            assert 2000 < sum(n for n, value in alpha.getcolors(256) if value > 128) < 60000, (iid, '빈 아이콘/배경 잔류')
    else:
        with Image.open(ROOT / f'images/discoveries/{iid}.gif') as im:
            assert im.size == (576, 256) and im.info.get('loop') == 0, iid
            assert im.n_frames == (25 if row['kind'] == 'nature' else 16), (iid, im.n_frames)
            duration = 0
            im.seek(0); first = im.convert('RGB')
            for i in range(im.n_frames):
                im.seek(i); duration += im.info['duration']
            last = im.convert('RGB')
            assert duration == 9820 and delta(first, last) > 1, (iid, duration, '변화 없는 애니메이션')
        with Image.open(ROOT / f'images/discovery-ends/{iid}.jpg') as end:
            assert end.size == (576, 256) and delta(end, last) < 20, (iid, '마지막 장면 불일치')
        with Image.open(ROOT / f'images/discovery-sheets/{iid}.webp') as sheet:
            height = 1024 if row['kind'] == 'nature' else 768
            assert sheet.size == (3456, height), (iid, sheet.size)
            assert delta(sheet.crop((2880, height-256, 3456, height)), last) < 20, (iid, '시트 마지막 칸 불일치')
print('PASS: 발견물 45종 GIF·9.82초·끝 장면·6열 시트, 소지품 24종·유물 7종 256px 투명 아이콘, 전체 목록 연결')
