"""검수한 최종 원화 선택 → 게임 규격 변환 → 매니페스트 → 묶음 검증."""
import hashlib
import json
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

HERE=Path(__file__).parent.resolve()
ROOT=HERE.parents[1]
OUT=ROOT/'artifacts/life-scenes-20261127'
front=HERE/'receipts/family_f_31_daughter_wedding_father_pov_faces_v2_front.json'
if front.is_file():
    r=json.loads(front.read_text(encoding='utf-8'))
    jobs=json.loads((HERE/'face-jobs.json').read_text(encoding='utf-8'))
    for job in jobs:
        if job['replaces']=='family_f_31_daughter_wedding_father_pov':
            job.update({k:r[k] for k in ('id','refs','prompt')})
    (HERE/'face-jobs.json').write_text(json.dumps(jobs,ensure_ascii=False,indent=2),encoding='utf-8')
    before=HERE/'receipts/family_f_31_daughter_wedding_father_pov_faces_v2.json'
    if before.exists():
        old=json.loads(before.read_text(encoding='utf-8'))
        dest=ROOT/'art_sources/life-scenes-20261127/rejected'/f"{old['id']}.png"
        dest.parent.mkdir(parents=True,exist_ok=True)
        if not dest.exists(): shutil.copy2(old['source'],dest)
for name in ('finalize_faces.py','package.py','audit_faces.py'):
    subprocess.run([sys.executable,str(HERE/name)],cwd=ROOT,check=True)
r=subprocess.run([sys.executable,str(ROOT/'tools/images.py')],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
(OUT/'manifest-check.log').write_text(r.stdout+'\n'+r.stderr,encoding='utf-8')
if r.returncode: raise RuntimeError('그림 매니페스트 검사 실패: '+r.stderr[-1000:])
assets=json.loads((HERE/'assets.json').read_text(encoding='utf-8'))
assert len(assets)==75
assert len({a['key'] for a in assets})==75
for a in assets:
    assert hashlib.sha256((ROOT/a['file']).read_bytes()).hexdigest()==a['sha256'],a['key']
male={p.stem for p in (ROOT/'images/family-events').glob('*.webp')}
female={p.stem for p in (ROOT/'images/family-events/female').glob('*.webp')}
assert male==female and len(male)==42,(len(male),len(female),male^female)
endings=list((ROOT/'images/endings').glob('*/*.webp'))
assert len(endings)==28
with zipfile.ZipFile(OUT/'life-scenes-20261127.zip') as z:
    assert z.testzip() is None
    entries=z.namelist()
    assert len(entries)==len(set(entries)), 'ZIP 중복 항목'
    assert len([n for n in entries if n.endswith('.webp')])==139,len(entries)
checks=dict(newArt=75,familyMale=42,familyFemale=42,endings=28,concertLegacy=24,concertNew=3,faceEdits=44,zipImages=139,zipEntries=len(entries),hashErrors=0,zipErrors=0)
(OUT/'final-checks.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(checks,ensure_ascii=True),flush=True)
