"""실제 생성 지시문과 수정 이력을 보존한다."""
from pathlib import Path
import json
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'artifacts/plant-native-art-20261119'
path = OUT/'prompts.json'
plan = json.loads(path.read_text(encoding='utf-8'))
initial = {j['id']:j for j in json.loads((OUT/'generation-plants-first.json').read_text(encoding='utf-8-sig'))}
for job in plan['jobs']:
    if job['id'] in initial:
        job['prompt'] = initial[job['id']]['prompt']
    edit = OUT/('edit-'+job['id']+'.json')
    if edit.exists():
        job['edits'] = [json.loads(edit.read_text(encoding='utf-8-sig'))]
    if job['type']=='plant' and not (OUT/'originals'/(job['id']+'.png')).exists() and 'No milky' not in job['prompt']:
        job['prompt'] += ' No milky white matte, no floor shadow, no glow or halo, no drawn checkerboard. Outside the exact object silhouette must be genuinely empty with zero alpha, including gaps.'
path.write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
print('제작 지시문과 수정 이력 보존')
