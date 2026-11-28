"""내장 ImageGen 원본을 보존하고 게임 규격으로 변환한다. 생성 API는 사용하지 않는다."""
import hashlib
import html
import json
import shutil
import zipfile
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).parent
OUT = ROOT / 'artifacts/life-scenes-20261127'
SOURCE = ROOT / 'art_sources/life-scenes-20261127'
OUT.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(parents=True, exist_ok=True)
records = []
receipts = []
planned = json.loads((HERE / 'prompts.json').read_text(encoding='utf-8'))
planned_ids = {r['id'] for r in planned}
previous = json.loads((HERE/'assets.json').read_text(encoding='utf-8')) if (HERE/'assets.json').exists() else []
previous_ids = {r['key']:r['id'] for r in previous}
for file in sorted((HERE / 'receipts').glob('*.json')):
    r = json.loads(file.read_text(encoding='utf-8'))
    if r['id'] not in planned_ids: continue
    receipts.append(r)
    src = Path(r['source'])
    original = SOURCE / (r['id'] + '.png')
    if not original.exists():
        shutil.copy2(src, original)
    target = ROOT / 'images' / (r['key'] + '.webp')
    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.exists() or ('faces_v2' in r['id'] and previous_ids.get(r['key']) != r['id']):
        with Image.open(original) as im:
            converted = ImageOps.fit(im.convert('RGB'), (1152, 512), method=Image.Resampling.LANCZOS)
            converted.save(target, quality=90, method=6)
    with Image.open(target) as im:
        im.verify()
    records.append(dict(id=r['id'], key=r['key'], title=r.get('title', r['id']), file=str(target.relative_to(ROOT)).replace('\\','/'), original=str(original.relative_to(ROOT)).replace('\\','/'), sha256=hashlib.sha256(target.read_bytes()).hexdigest()))
(HERE / 'assets.json').write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')
(HERE / 'generated-prompts.json').write_text(json.dumps(receipts, ensure_ascii=False, indent=2), encoding='utf-8')
planned = json.loads((HERE / 'prompts.json').read_text(encoding='utf-8'))
missing = sorted({r['id'] for r in planned} - {r['id'] for r in records})
family = [r['key'].split('/')[-1] for r in planned if r['id'].startswith('family_f_')]
missing_pairs = [key for key in family if not (ROOT/'images/family-events'/f'{key}.webp').is_file() or not (ROOT/'images/family-events/female'/f'{key}.webp').is_file()]
(OUT / 'asset-checks.json').write_text(json.dumps(dict(planned=len(planned), complete=len(records), missing=missing, familyMale=len(family), familyFemale=len(family), missingFamilyPairs=missing_pairs, files=records), ensure_ascii=False, indent=2), encoding='utf-8')
sections = [('공연 — 기존 카디 모티브 · 신규 원화', []), ('여성 가족 장면 — 남성 장면과 일대일 대응', []), ('남녀별 사망과 새로운 세기의 여명', [])]
for key in sorted(p.stem for p in (ROOT/'images/song/concerts').glob('*.webp') if not p.stem.endswith('_20261127')):
    sections[0][1].append(('기존 공연 · ' + key, 'images/song/concerts/' + key + '.webp'))
for r in records:
    idx = 0 if r['id'].startswith('concert') else 1 if r['id'].startswith('family') else 2
    sections[idx][1].append((r['title'], r['file']))
parts = ['<!doctype html><html lang="ko"><meta charset="utf-8"><title>공연·가족·마지막 항해 장면</title><style>body{margin:0;background:#161820;color:#eee6d7;font:16px system-ui}main{max-width:1500px;margin:auto;padding:32px}h1,h2{color:#e5c58e}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:16px}figure{margin:0;background:#242733;padding:8px;border-radius:8px}img{display:block;width:100%;aspect-ratio:9/4;object-fit:cover}figcaption{padding:8px;overflow-wrap:anywhere}a{color:inherit}</style><main><h1>공연·가족·마지막 항해</h1><p>내장 ImageGen 장면별 제작. 가족 남녀 각 42장 · 사망 13종과 1700년 종료 남녀 각 14장 · 기존 공연 보존 및 신규 3장.</p>']
for section_index, (title, files) in enumerate(sections):
    parts.append('<h2>'+title+'</h2><div class="grid">')
    if section_index == 1:
        files = [(key, 'images/family-events/female/'+key+'.webp') for key in family]
    for title, file in files:
        male = file.replace('/female/', '/') if section_index == 1 else None
        pair = '<img loading="lazy" src="../../'+html.escape(male)+'" alt="남성 플레이어">' if male else ''
        label = ('위: 남성 · 아래: 여성 — ' if male else '')+title
        parts.append('<figure>'+pair+'<a href="../../'+html.escape(file)+'"><img loading="lazy" src="../../'+html.escape(file)+'" alt="'+html.escape(title)+'"></a><figcaption>'+html.escape(label)+'</figcaption></figure>')
    parts.append('</div>')
parts.append('</main></html>')
(OUT / 'index.html').write_text(''.join(parts), encoding='utf-8')
thumbs = []
for r in records:
    with Image.open(ROOT / r['file']) as im:
        thumbs.append((r['id'], ImageOps.fit(im.convert('RGB'), (384,171))))
sheet = Image.new('RGB', (384*4, 200*((len(thumbs)+3)//4)), '#1c2029')
draw = ImageDraw.Draw(sheet)
for i,(id,im) in enumerate(thumbs):
    x,y=i%4*384,i//4*200
    sheet.paste(im,(x,y)); draw.text((x+6,y+174),id[:46],fill='white')
if thumbs: sheet.save(OUT / 'preview.jpg', quality=90)
if not missing and not missing_pairs:
    with zipfile.ZipFile(OUT / 'life-scenes-20261127.zip','w',zipfile.ZIP_DEFLATED) as z:
        for r in records: z.write(ROOT / r['file'], r['file'])
        new_keys = {r['key'] for r in records}
        for key in family:
            logical = 'family-events/'+key
            if logical not in new_keys:
                file = ROOT/'images'/(logical+'.webp')
                z.write(file,str(file.relative_to(ROOT)))
        for file in sorted((ROOT/'images/song/concerts').glob('*.webp')):
            if file.stem.endswith('_20261127'): continue
            z.write(file,str(file.relative_to(ROOT)))
        z.write(HERE/'generated-prompts.json','generated-prompts.json')
        z.write(HERE/'assets.json','assets.json')
print(json.dumps(dict(complete=len(records),planned=len(planned),missing=missing),ensure_ascii=True))
