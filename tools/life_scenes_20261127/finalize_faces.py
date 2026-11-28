"""얼굴·표정 수정본을 최종 그림으로 선택한다. 사용자 요청에 따른 교체이며 이전 원본은 보존한다."""
import json
import shutil
from pathlib import Path

HERE = Path(__file__).parent
jobs = json.loads((HERE/'face-jobs.json').read_text(encoding='utf-8'))
plan = json.loads((HERE/'prompts.json').read_text(encoding='utf-8'))
by_old = {j['replaces']:j for j in jobs}
by_new = {j['id']:j for j in jobs}
missing = [j['id'] for j in jobs if not (HERE/'receipts'/(j['id']+'.json')).is_file()]
if missing: raise RuntimeError('얼굴 수정본 누락: '+', '.join(missing))
for p in plan:
    j = by_old.get(p['id']) or by_new.get(p['id'])
    if not j: continue
    receipt = json.loads((HERE/'receipts'/(j['id']+'.json')).read_text(encoding='utf-8'))
    old = HERE/'receipts'/(j['replaces']+'.json')
    if old.is_file():
        archive=HERE/'receipts/rejected'
        archive.mkdir(exist_ok=True)
        shutil.move(str(old),str(archive/old.name))
    p.update({k:receipt[k] for k in ('id','key','prompt','refs')})
(HERE/'prompts.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
print('가족 원화 44장 얼굴·표정 수정본 선택')
