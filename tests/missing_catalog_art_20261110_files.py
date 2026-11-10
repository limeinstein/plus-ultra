"""새 원화의 실제 파일·투명도·움직임과 기존 자료·이미지 연결 보존을 검사한다."""
from pathlib import Path
import json
import re
from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[1]
HERE = ROOT / 'tools/missing_catalog_art_20261110'
rows = json.loads((HERE / 'subjects.json').read_text(encoding='utf-8'))


def manifest(path):
    return json.loads(re.search(r'G\.IMAGE_FILES\s*=\s*(\{.*\})\s*;', path.read_text(encoding='utf-8'), re.S)[1])


files = manifest(ROOT / 'images/manifest.js')
previous = manifest(HERE / 'before/images/manifest.js')
assert all(files.get(k) == v for k, v in previous.items()), '기존 그림 연결이 바뀌었습니다'
for rel in ('js/data/asiafolk.js', 'js/data/zhenghe.js', 'js/data/achievements.js'):
    if rel.endswith('achievements.js'):
        # 기존 업적은 보존한다. 통합 배포에서 뒤에 추가된 교역 업적은 허용한다.
        old = (HERE / 'before' / rel).read_text(encoding='utf-8').rsplit('})(window.G', 1)[0].rstrip()
        assert (ROOT / rel).read_text(encoding='utf-8').startswith(old), rel
    else:
        assert (ROOT / rel).read_bytes() == (HERE / 'before' / rel).read_bytes(), rel
for r in rows:
    did = r['id']
    with Image.open(HERE / f'sources/{did}.png') as src:
        assert src.width >= 1500 and src.width / src.height > 2.1, did
    with Image.open(ROOT / f'images/discovery-ends/{did}.jpg') as im:
        assert im.size == (1440, 640), did
    with Image.open(ROOT / f'images/discoveries/{did}.gif') as im:
        assert im.size == (576, 256) and im.n_frames == 18, (did, im.n_frames)
        duration = 0
        for i in range(im.n_frames):
            im.seek(i); duration += im.info['duration']
        assert duration == 8400, did
        im.seek(0); a = im.convert('RGB'); im.seek(8); b = im.convert('RGB')
        assert sum(ImageStat.Stat(ImageChops.difference(a, b)).mean) > 3, did
    with Image.open(ROOT / f'images/discovery-sheets/{did}.webp') as im:
        assert im.size == (3456, 768), did
    assert files['discoveries/' + did] == f'discoveries/{did}.gif', did
with Image.open(ROOT / 'images/items/moye.webp') as im:
    assert im.mode == 'RGBA' and im.size == (512, 512)
    assert im.getchannel('A').getextrema() == (0, 255)
    assert im.getchannel('A').getbbox()[0] >= 20
assert files['achievement-events/happily'] == 'legend-events/happily_after_all.webp'
print('OK: 원화 19장·민족 발견 연출 18종·막야 투명도·기존 자료와 그림 연결 보존')
