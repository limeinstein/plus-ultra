"""신규 83개 발견물의 누락·고정 프레임·재생 시간·마지막 장면 불일치를 검사한다."""
from pathlib import Path
import hashlib
import json
import sys
from collections import Counter
from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[1]
rows = json.loads((ROOT/'tools/discovery83/prompts.json').read_text(encoding='utf-8'))
sys.path.insert(0, str(ROOT/'tools'))
import images as registry
keys = registry.valid_keys(registry.game_data())
assert all('discoveries/'+r['id'] in keys for r in rows), '그림 도구에 신규 ID 누락'
assert len(rows)==83 and len({r['id'] for r in rows})==83
assert Counter(r['category'] for r in rows)=={'nature':30, 'ruin':17, 'people':36}
manifest=(ROOT/'images/manifest.js').read_text(encoding='utf-8')
hashes=set()
total=0
for row in rows:
    did=row['id']
    if (ROOT/'tools/discovery83/masters').is_dir():   # 원화(약 130MB)는 저장소에 올리지 않는다 — 있는 컴퓨터에서만 확인
        assert (ROOT/row['source']).is_file(), f'{did}: 원화 없음'
    gif=ROOT/'images/discoveries'/f'{did}.gif'
    digest=hashlib.sha256(gif.read_bytes()).hexdigest()
    assert digest not in hashes, f'{did}: 다른 발견물과 같은 GIF'
    hashes.add(digest)
    total+=gif.stat().st_size
    for folder,ext in [('discoveries','gif'),('discovery-ends','jpg'),('discovery-sheets','webp')]:
        assert f'{folder}/{did}' in manifest, f'{did}: {folder} 등록 안 됨'
        assert (ROOT/'images'/folder/f'{did}.{ext}').is_file()
    with Image.open(gif) as im:
        assert im.size==(576,256), (did,im.size)
        assert im.info.get('loop')==0, did
        assert im.n_frames>=16, (did,im.n_frames)
        frames=[];duration=0
        for i in range(im.n_frames):
            im.seek(i); frames.append(im.convert('RGB')); duration+=im.info['duration']
        assert duration==9820,(did,duration)
        assert len({f.tobytes() for f in frames})>=16,(did,'정지 장면')
        last=frames[-1]
    with Image.open(ROOT/'images/discovery-ends'/f'{did}.jpg') as im:
        assert im.size==(576,256)
        assert sum(ImageStat.Stat(ImageChops.difference(im.convert('RGB'),last)).mean)/3<12,(did,'마지막 장면 불일치')
    with Image.open(ROOT/'images/discovery-sheets'/f'{did}.webp') as im:
        assert im.width==3456 and im.height%256==0,(did,im.size)
        end=im.crop((2880,im.height-256,3456,im.height)).convert('RGB')
        assert sum(ImageStat.Stat(ImageChops.difference(end,last)).mean)/3<12,(did,'재생 판 마지막 장면 불일치')
print(f'PASS: 83 unique animated GIFs, 83 end frames, 83 runtime sheets; GIF total {total/1048576:.1f} MiB')
