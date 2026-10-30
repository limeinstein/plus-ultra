"""현재 실행 목록 전체 발견 장면과 도시·야외 외관의 빈칸을 검사한다."""
from pathlib import Path
import hashlib, json, re, sys
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from complete_discovery_art import complete_runtime
rows=complete_runtime()
spec=json.loads((ROOT/'docs/art/discovery-exteriors-20261031-prompts.json').read_text(encoding='utf-8'))
manifest=(ROOT/'images/manifest.js').read_text(encoding='utf-8')
icons=(ROOT/'js/art/discovery_icon.js').read_text(encoding='utf-8')
bases=(ROOT/'js/data/landmarkbase.js').read_text(encoding='utf-8')
ids=[r['id'] for r in rows]
assert len(ids)==len(set(ids)), '발견물 ID 중복'
missing=[]
for d in rows:
    did=d['id']
    for folder,ext in [('discoveries','.gif'),('discovery-ends','.jpg'),('discovery-sheets','.webp')]:
        if not (ROOT/'images'/folder/(did+ext)).is_file() or json.dumps(folder+'/'+did) not in manifest:missing.append(folder+'/'+did)
    if d['cat']=='ruin' and d['how']=='city' and json.dumps('landmarks/'+did) not in manifest:missing.append('landmarks/'+did)
    if (d['cat'] in ('ruin','nature') or d.get('natural')) and d['how']!='city' and "'"+did+"'" not in icons and 'POS.'+did+' =' not in icons:missing.append('map:'+did)
assert not missing,'그림 누락: '+str(missing)
for key,relative in re.findall(r'"([^"]+)":\s*"([^"]+)"',manifest):
    if key.startswith(('landmarks/','map-discoveries/')):assert (ROOT/'images'/relative).is_file(),relative
hashes=set()
for r in spec['assets']:
    for field in ['source','target']:assert (ROOT/r[field]).is_file(),r[field]
    assert json.dumps(r['key']) in manifest,r['id']
    with Image.open(ROOT/r['target']) as im:
        assert im.mode=='RGBA',r['id']
        a=im.getchannel('A');assert a.getextrema()==(0,255),r['id']
        assert a.histogram()[0]>im.width*im.height*.08,r['id']
        box=a.point(lambda v:255 if v>=8 else 0).getbbox()
        assert box and box[0]>1 and box[1]>1 and box[2]<im.width-1 and box[3]<im.height-1,(r['id'],'잘림',box)
        if r['kind']=='city':assert im.height==520 and json.dumps(r['id']) in bases,r['id']
        else:assert im.size==(512,512),r['id']
    digest=hashlib.sha256((ROOT/r['target']).read_bytes()).hexdigest();assert digest not in hashes,r['id'];hashes.add(digest)
print(f"PASS: 전체 발견물 {len(rows)}종 장면·도시/야외 외관 누락 0, 신규 외관 {len(spec['assets'])}종 실제 투명 배경·여백·규격·고유 그림")
