"""신기루 50곳의 GIF·끝 장면·재생 판 연결을 전수 검사한다."""
from pathlib import Path
import hashlib
import json
import sys
import zipfile
from PIL import Image, ImageChops, ImageStat

ROOT=Path(__file__).resolve().parents[1]
rows=json.loads((ROOT/'tools/mirage_gifs/items.json').read_text(encoding='utf-8'))
sys.path.insert(0,str(ROOT/'tools'))
import images as registry
keys=registry.valid_keys(registry.game_data())
manifest=(ROOT/'images/manifest.js').read_text(encoding='utf-8')
assert len(rows)==len({r['id'] for r in rows})==50
assert sum(isinstance(r['how'],int) for r in rows)==18
hashes=set()
total=0
for row in rows:
    did=row['id']
    assert 'discoveries/'+did in keys,(did,'그림 도구 등록 누락')
    for folder,ext in [('discoveries','gif'),('discovery-ends','jpg'),('discovery-sheets','webp')]:
        assert f'"{folder}/{did}"' in manifest,(did,folder,'목록 누락')
        assert (ROOT/'images'/folder/f'{did}.{ext}').is_file(),(did,folder)
    gif=ROOT/'images/discoveries'/f'{did}.gif'
    digest=hashlib.sha256(gif.read_bytes()).hexdigest()
    assert digest not in hashes,(did,'다른 발견물과 동일한 GIF')
    hashes.add(digest)
    total+=gif.stat().st_size
    with Image.open(gif) as im:
        assert im.size==(576,256) and im.n_frames==16,(did,im.size,im.n_frames)
        assert im.info.get('loop')==0,did
        frames=[]
        duration=0
        for i in range(im.n_frames):
            im.seek(i)
            frames.append(im.convert('RGB'))
            duration+=im.info['duration']
        assert duration==9820,(did,duration)
        assert len({f.tobytes() for f in frames})==16,(did,'중복 장면')
        last=frames[-1]
    for folder,ext in [('discovery-ends','jpg'),('discovery-sheets','webp')]:
        with Image.open(ROOT/'images'/folder/f'{did}.{ext}') as im:
            if folder=='discovery-sheets':
                assert im.size==(3456,768),(did,im.size)
                im=im.crop((2880,512,3456,768))
            else:
                assert im.size==(576,256)
            error=sum(ImageStat.Stat(ImageChops.difference(im.convert('RGB'),last)).mean)/3
            assert error<12,(did,folder,'끝 장면 불일치',error)
package=ROOT/'artifacts/mirage50-gifs.zip'
package_result=''
if package.is_file():
    with zipfile.ZipFile(package) as archive:
        assert len([n for n in archive.namelist() if n.endswith('.gif')])==50
        assert archive.testzip() is None
    package_result=' · ZIP 정상'
print(f'PASS: GIF 50개 · 9.82초/16장면 · 끝 장면 50개 · 재생 판 50개{package_result} ({total/1048576:.1f} MiB)')
