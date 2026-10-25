"""외관 50개와 지도용 32칸의 실제 투명도·여백·연결을 검사한다."""
from pathlib import Path
import hashlib
import json
import zipfile
from collections import Counter
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
rows=json.loads((ROOT/'tools/mirage_exteriors/prompts.json').read_text(encoding='utf-8'))
sheets=json.loads((ROOT/'tools/mirage_exteriors/map-sheets.json').read_text(encoding='utf-8'))
assert len(rows)==len({r['id'] for r in rows})==50
assert Counter(r['kind'] for r in rows)=={'city':18,'land':20,'sea':12}
manifest=(ROOT/'images/manifest.js').read_text(encoding='utf-8')
bases=(ROOT/'js/data/landmarkbase.js').read_text(encoding='utf-8')
hashes=set()
for row in rows:
    path=ROOT/row['target']
    digest=hashlib.sha256(path.read_bytes()).hexdigest()
    assert digest not in hashes,(row['id'],'중복 외관')
    hashes.add(digest)
    key=row['target'][7:-5]
    assert f'"{key}"' in manifest,(row['id'],'매니페스트 누락')
    with Image.open(path) as im:
        assert im.mode=='RGBA',(row['id'],im.mode)
        a=im.getchannel('A')
        lo,hi=a.getextrema()
        assert lo==0 and hi>=240,(row['id'],'투명도 없음')
        assert a.histogram()[0]>im.width*im.height*.08,(row['id'],'투명 여백 부족')
        box=a.point(lambda v:255 if v>=8 else 0).getbbox()
        assert box and box[0]>1 and box[1]>1 and box[2]<im.width-1 and box[3]<im.height-1,(row['id'],'외곽 잘림',box)
        if row['kind']=='city':
            assert im.height==520 and 294<=im.width<=1300,(row['id'],im.size)
            assert f'"{row["id"]}"' in bases,(row['id'],'거리 발치 표 누락')
        else:
            assert im.size==(512,512),(row['id'],im.size)
assert len(sheets)==2
assert {did for row in sheets for did in row['ids']}=={r['id'] for r in rows if r['kind']!='city'}
for row in sheets:
    assert f'"{row["key"]}"' in manifest
    with Image.open(ROOT/'images'/f"{row['key']}.png") as im:
        assert im.mode=='RGBA' and im.size==(1024,1024)
        for i,did in enumerate(row['ids']):
            tile=im.crop(((i%4)*256,(i//4)*256,(i%4+1)*256,(i//4+1)*256))
            assert tile.getchannel('A').getbbox(),(did,'지도 판의 빈칸')
package=ROOT/'artifacts/mirage50-exteriors.zip'
package_result=''
if package.is_file():
    with zipfile.ZipFile(package) as z:
        assert z.testzip() is None
        for row in rows: assert z.read(row['target'])==(ROOT/row['target']).read_bytes()
    package_result=' · ZIP 일치'
print('PASS: 도시 외관 18 · 육상 20 · 항해 12 · 투명 배경/여백 · 지도 판 32칸'+package_result)
