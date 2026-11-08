"""새 원화·회전 GIF·원색 장면 판·종료 그림과 사진 출처를 함께 확인한다."""
from pathlib import Path
import hashlib
import json
import sys
from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[1]
HERE = ROOT / 'tools/treasure_gifs/revision_20261108'
profiles = json.loads((HERE.parent / 'profiles_20261108.json').read_text(encoding='utf-8'))
before = json.loads((HERE / 'before-sha256.json').read_text(encoding='utf-8'))
credits = json.loads((HERE / 'attributions.json').read_text(encoding='utf-8'))
require_sources = '--require-sources' in sys.argv  # 원화 입력 폴더는 저장소에서 제외하는 로컬 제작 자료다.
source_count = 0
for did, profile in profiles.items():
    for folder, suffix in [('tools/treasure_gifs/sources', 'png'), ('images/discoveries', 'gif'), ('images/discovery-ends', 'jpg'), ('images/discovery-sheets', 'webp')]:
        rel = f'{folder}/{did}.{suffix}'
        if folder.startswith('tools/') and not (ROOT / rel).is_file() and not require_sources:
            continue
        assert (ROOT / rel).is_file(), rel
        changed = hashlib.sha256((ROOT / rel).read_bytes()).hexdigest() != before[rel]
        if folder.startswith('tools/') and profile.get('retained_source'):
            assert not changed, rel
        else:
            assert changed, rel
    source = ROOT / f'tools/treasure_gifs/sources/{did}.png'
    if source.is_file():
        source_count += 1
        with Image.open(source) as src:
            assert src.width >= 1500 and src.height >= 880, (did, src.size)
    with Image.open(ROOT / f'images/discoveries/{did}.gif') as gif:
        assert gif.size == (576, 256) and gif.n_frames == 24, did
        duration = 0
        for i in range(gif.n_frames):
            gif.seek(i); duration += gif.info['duration']
        assert duration == 8400, (did, duration)
        gif.seek(2); first = gif.convert('RGB')
        gif.seek(7); mid = gif.convert('RGB')
        assert sum(ImageStat.Stat(ImageChops.difference(first, mid)).mean) > 2, did
    with Image.open(ROOT / f'images/discovery-sheets/{did}.webp') as atlas, Image.open(ROOT / f'images/discovery-ends/{did}.jpg') as end:
        assert atlas.size == (3456, 1024), did
        final = atlas.crop((2880, 768, 3456, 1024)).convert('RGB')
        error = sum(ImageStat.Stat(ImageChops.difference(final, end.convert('RGB'))).mean) / 3
        assert error < 6, (did, error)
    if profile['mode'] == 'photo':
        assert credits[did]['license'] and credits[did]['page'], did
print(f'OK: {len(profiles)}종 GIF·게임 장면 판·종료 그림·사진 출처 / 로컬 원화 입력 {source_count}종 확인')
