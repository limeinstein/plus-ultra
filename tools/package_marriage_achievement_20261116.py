"""혼인 정원 업적 두 장의 원본·프롬프트를 보존하고 게임 그림을 등록한다."""
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / (sys.argv[1] if len(sys.argv) > 1 else 'tools/marriage_achievement_20261116_prompts.json')
OUT = ROOT / (sys.argv[2] if len(sys.argv) > 2 else 'artifacts/marriage-achievements-20261116')
plan = json.loads(PLAN.read_text(encoding='utf-8'))
(OUT / 'sources').mkdir(parents=True, exist_ok=True)
checks = []
for row in plan['images']:
    source = OUT / 'sources' / (row['id'] + '.png')
    if not source.exists():
        shutil.copy2(row['source'], source)
    with Image.open(source) as im:
        original_size = im.size
        picture = im.convert('RGB')
        if picture.size != tuple(plan['size']):
            picture = picture.resize(tuple(plan['size']), Image.Resampling.LANCZOS)
        target = ROOT / 'images' / (row['key'] + '.webp')
        if not target.exists():
            picture.save(target, 'WEBP', quality=95, method=4)
        picture.save(OUT / (row['id'] + '-preview.jpg'), quality=94)
    with Image.open(target) as im:
        assert im.size == tuple(plan['size']) and im.mode == 'RGB'
    row.update(workspace_source=source.relative_to(ROOT).as_posix(), file=target.relative_to(ROOT).as_posix(),
               original_size=list(original_size), sha256=hashlib.sha256(target.read_bytes()).hexdigest())
    checks.append({k: row[k] for k in ('id', 'file', 'sha256', 'original_size')})
manifest = ROOT / 'images/manifest.js'
text = manifest.read_text(encoding='utf-8')
match = re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});', text)
files = json.loads(match.group(1))
for row in plan['images']:
    value = row['key'] + '.webp'
    assert row['key'] not in files or files[row['key']] == value
    files[row['key']] = value
manifest.write_text(text[:match.start()] + 'G.IMAGE_FILES = ' + json.dumps(dict(sorted(files.items())), ensure_ascii=False, indent=2) + ';' + text[match.end():], encoding='utf-8', newline='\n')
PLAN.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(OUT / 'asset-checks.json').write_text(json.dumps(checks, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('업적샷 등록 완료: ' + str(len(checks)) + '장')
