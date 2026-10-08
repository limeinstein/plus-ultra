"""83개 GIF와 다른 폴더에서도 열리는 미리보기 페이지를 하나로 묶는다."""
from pathlib import Path
import json
from zipfile import ZipFile, ZIP_DEFLATED

ROOT=Path(__file__).resolve().parents[2]
rows=json.loads((ROOT/'tools/discovery83/prompts.json').read_text(encoding='utf-8'))
assert len(rows)==83
dest=ROOT/'artifacts/discovery83-gifs.zip'
dest.parent.mkdir(exist_ok=True)
gallery=(ROOT/'docs/art/discovery83-gallery.html').read_text(encoding='utf-8').replace('../../images/discoveries/','gifs/')
with ZipFile(dest,'w',compression=ZIP_DEFLATED,compresslevel=6) as z:
    for r in rows:
        z.write(ROOT/'images/discoveries'/f"{r['id']}.gif",f"gifs/{r['id']}.gif")
    z.writestr('index.html',gallery)
    z.writestr('목록.txt','새 발견물 83개 GIF\n576×256 · 9.82초 반복\n압축을 푼 뒤 index.html을 열면 모두 볼 수 있습니다.\n\n'+'\n'.join(f"{i+1:02}. {r['name']} — gifs/{r['id']}.gif" for i,r in enumerate(rows)))
with ZipFile(dest) as z:
    assert len([n for n in z.namelist() if n.endswith('.gif')])==83
    assert z.testzip() is None
print(f'{dest}: {dest.stat().st_size/1048576:.1f} MiB, 83 GIFs')
