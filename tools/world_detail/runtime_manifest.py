"""작업본의 파일 해시와 직접 수정 범위를 남긴다. 사용자 변경 파일을 덮어 되돌리지 않는다."""
from pathlib import Path
import json,hashlib,difflib
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'artifacts/world-detail-20261125';before=OUT/'before-source'
files=['index.html','js/data/base.js','js/data/seafx.js','js/world/geo.js','js/world/nav.js','js/world/landnav.js','js/world/renderer.js','js/scenes/sea.js','js/scenes/land.js','js/art/discovery_icon.js','js/data/terrain_detail.js','js/data/terrain_patches.js','js/data/waterway_geometry.js','js/data/waterways.js','js/data/terrain_art.js','js/world/terrain.js','js/art/terrain_art.js','js/ui/credits.js','THIRD_PARTY_NOTICES.md']
rows=[];diff=[]
for name in files:
 p=ROOT/name;raw=p.read_bytes();rows.append({'path':name,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
 old=before/name
 if old.exists():diff.extend(difflib.unified_diff(old.read_text(encoding='utf-8').splitlines(True),raw.decode('utf-8').splitlines(True),fromfile='before/'+name,tofile='after/'+name))
(OUT/'implementation.diff').write_text(''.join(diff),encoding='utf-8')
(OUT/'runtime-manifest.json').write_text(json.dumps({'date':'2026-11-25','status':'미배포 작업본','files':rows},ensure_ascii=False,indent=2),encoding='utf-8')
print('Runtime manifest:',len(rows),'files; patch against preserved working source')
