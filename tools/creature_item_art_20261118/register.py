from pathlib import Path
import json,runpy
repo=Path(__file__).resolve().parents[2];out=repo/'artifacts/creature-item-art-20261118'
overrides=json.loads((Path(__file__).parent/'asset-overrides.json').read_text(encoding='utf-8'))
assert len(overrides)==54
manifest=repo/'images/manifest.js'
with manifest.open(encoding='utf-8',newline='') as f:text=f.read()
start=text.index('G.IMAGE_FILES = ')+len('G.IMAGE_FILES = ');end=text.rindex('};')+1
before=json.loads(text[start:end]);after=dict(before)
for key,rel in overrides.items():
    assert (repo/'images'/rel).is_file(),rel
    after[key]=rel
assert all(after[k]==v for k,v in before.items() if k not in overrides)
snapshot=out/'previous-connections.json'
if not snapshot.exists():snapshot.write_text(json.dumps({k:before.get(k) for k in overrides},ensure_ascii=False,indent=2),encoding='utf-8')
nl='\r\n' if '\r\n' in text else '\n'
body=json.dumps(after,ensure_ascii=False,indent=2,sort_keys=True).replace('\n',nl)
with manifest.open('w',encoding='utf-8',newline='') as f:f.write(text[:start]+body+text[end:])
preferred=runpy.run_path(str(repo/'tools/images.py'))['PREFERRED_FILES']
assert all(preferred[k]==v for k,v in overrides.items())
(out/'registration_checks.json').write_text(json.dumps({'aliases':len(overrides),'preferredRegeneration':True,'unrelatedMappingsPreserved':True,'changedKeys':[k for k in after if before.get(k)!=after[k]],'originalFilesPreserved':True},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'aliases':54,'preferredRegeneration':True,'changedKeys':sum(before.get(k)!=v for k,v in after.items())}))
