"""표시 틀이 다른 자택·개척도시는 제외하고 컷신 9:4에 맞지 않는 원화를 선정한다."""
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).parent
audit=json.loads((HERE/'audit.json').read_text(encoding='utf-8'))
rows=[r for r in audit['rows'] if not r['key'].startswith(('events/home/','events/colony/')) and r.get('error',0)>.003]
groups={}
for r in rows:
    p=ROOT/'images'/r['file']
    digest=hashlib.sha256(p.read_bytes()).hexdigest()
    groups.setdefault(digest,[]).append(r)
priority={'gold/cuts/01-childhood':0,'jhook/cuts/01_gift':1}
jobs=[]
for digest,group in groups.items():
    r=sorted(group,key=lambda x:priority.get(x['key'],2))[0]
    change=('HORIZONTAL CANVAS EXPANSION. Keep the full original height and extend the left and right background edges. '
            if r['ratio']<2.25 else 'VERTICAL CANVAS EXPANSION. Keep the full original width and extend the top and bottom background edges slightly. ')
    prompt=('Use case: precise-object-edit. Image 1 is the EDIT TARGET, a painted game cutscene. '
            'Repaint and outpaint this SAME scene onto a NEW ULTRAWIDE canvas with aspect ratio EXACTLY 9:4 (2.25:1), for example 1881x836. '
            'The output shape must be 9:4, even though the input has a different ratio. '+change+
            'Preserve the ENTIRE original image content: same people and number of people, faces, ages, expressions, hairstyles, clothing, poses, hands, every prop, ships, architecture, action, lighting and painted art style. '
            'Only add seamless adjacent environment that continues the same scene and perspective, not new people or narrative objects. '
            'All original faces, heads, hands, held objects and scene-defining details must remain fully visible. Do not invent blank faces. '
            'NO stretching, squeezing or distorting. NO cropping original content to fake the new ratio. '
            'Full-bleed continuous painting from edge to edge: no empty padding, black bars, wooden side strips, blurred extensions, mirror copies, borders, frames, panels, text, logo or watermark. '
            'This is production art for a fixed 9:4 in-game frame; the painting itself must fill that exact ultrawide shape.')
    jobs.append(dict(id=r['key'].replace('/','__'),key=r['key'],aliases=[x['key'] for x in group],source=str(ROOT/'images'/r['file']),originalFile=r['file'],originalSize=[r['width'],r['height']],sourceSha256=digest,prompt=prompt))
jobs.sort(key=lambda j:(priority.get(j['key'],2),j['key']))
(HERE/'prompts.json').write_text(json.dumps(jobs,ensure_ascii=False,indent=2),encoding='utf-8')
selection=dict(scanned=audit['total'],wrongCutsceneKeys=len(rows),uniqueImages=len(jobs),excludedHome=22,excludedColony=5,duplicates=[j['aliases'] for j in jobs if len(j['aliases'])>1])
(HERE/'selection.json').write_text(json.dumps(selection,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(selection,ensure_ascii=True))
