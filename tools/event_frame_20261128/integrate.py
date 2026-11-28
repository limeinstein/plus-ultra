"""이번 교체 키만 목록에 반영하고 다른 작업의 그림 연결은 보존한다."""
import importlib.util
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).parent
file=ROOT/'images/manifest.js'
before=json.loads(re.search(r'G\.IMAGE_FILES\s*=\s*(\{[\s\S]*?\});',file.read_text(encoding='utf-8'))[1])
overrides=json.loads((HERE/'asset-overrides.json').read_text(encoding='utf-8'))
assets=json.loads((HERE/'assets.json').read_text(encoding='utf-8'))
for asset in assets:
    for key in asset['aliases']:
        assert before.get(key) in (asset['originalFile'],asset['file']),key
spec=importlib.util.spec_from_file_location('game_images',ROOT/'tools/images.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
scanned,_=module.scan()
assert len(overrides)==106
for key,rel in overrides.items():assert scanned.get(key)==rel,key
after=dict(before)
after.update(overrides)
for rel in overrides.values():after[rel.rsplit('.',1)[0]]=rel
assert all(after[k]==v for k,v in before.items() if k not in overrides)
module.write_manifest(after)
report=dict(corrected=len(overrides),newFileKeys=len(set(overrides.values())),unrelatedMappingsPreserved=True,regeneratedTargetMappingsMatch=True)
(HERE/'integration-checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report))
