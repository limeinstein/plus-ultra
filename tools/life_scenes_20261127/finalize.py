"""일반 사망은 해골이 아닌 사람을 그린 수정본으로 교체하며 이전 제작 기록을 보관한다."""
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).parent
plan = json.loads((HERE/'prompts.json').read_text(encoding='utf-8'))
codes = {'mutiny','pirate','navy','prison','illness','peace_home','peace_sea','peace_land'}
for j in plan:
    if not j['id'].startswith('death_') or j['id'].split('_',2)[-1] not in codes: continue
    revised = HERE/'receipts'/(j['id']+'_human_v2.json')
    if not revised.is_file(): raise RuntimeError('수정 원화 누락: '+j['id'])
    r = json.loads(revised.read_text(encoding='utf-8'))
    old_receipt = HERE/'receipts'/(j['id']+'.json')
    if old_receipt.exists():
        archive = HERE/'receipts/rejected'
        archive.mkdir(exist_ok=True)
        shutil.move(str(old_receipt),str(archive/old_receipt.name))
    old_image = (ROOT/'images'/(j['key']+'.webp')).resolve()
    assert old_image.is_relative_to((ROOT/'images/endings').resolve())
    if old_image.is_file():
        archive_image = ROOT/'art_sources/life-scenes-20261127/rejected'/old_image.parent.name/old_image.name
        archive_image.parent.mkdir(parents=True,exist_ok=True)
        shutil.move(str(old_image),str(archive_image))
    j.update({k:r[k] for k in ('id','key','prompt')})
(HERE/'prompts.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
print('일반 사망 원화 16장 수정본 선택, 이전 원화·기록 보존')
