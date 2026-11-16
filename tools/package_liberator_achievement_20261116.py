"""해방자 업적 전용 원화를 보존하고 게임용 그림과 이미지 목록에 연결한다."""
import hashlib
import json
import re
import shutil
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
PLAN=ROOT/'tools/liberator_achievement_20261116_prompts.json'
OUT=ROOT/'artifacts/liberator-achievement-20261116'
plan=json.loads(PLAN.read_text(encoding='utf-8'))
(OUT/'sources').mkdir(parents=True,exist_ok=True)
source=OUT/'sources/liberator.png'
if not source.exists():
    shutil.copy2(plan['source'],source)
with Image.open(source) as im:
    assert im.size==(1881,836),im.size
    picture=im.convert('RGB')
    target=ROOT/'images/achievement-events/liberator.webp'
    if not target.exists():
        picture.save(target,'WEBP',quality=95,method=4)
    picture.save(OUT/'preview.jpg',quality=94)
with Image.open(target) as im:
    assert im.size==(1881,836) and im.mode=='RGB'
manifest=ROOT/'images/manifest.js'
text=manifest.read_text(encoding='utf-8')
match=re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});',text)
files=json.loads(match.group(1))
value='achievement-events/liberator.webp'
assert plan['key'] not in files or files[plan['key']]==value
files[plan['key']]=value
manifest.write_text(text[:match.start()]+'G.IMAGE_FILES = '+json.dumps(dict(sorted(files.items())),ensure_ascii=False,indent=2)+';'+text[match.end():],encoding='utf-8',newline='\n')
plan['workspace_source']=source.relative_to(ROOT).as_posix()
plan['file']=target.relative_to(ROOT).as_posix()
plan['sha256']=hashlib.sha256(target.read_bytes()).hexdigest()
PLAN.write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(OUT/'asset-checks.json').write_text(json.dumps({'key':plan['key'],'file':plan['file'],'size':list(picture.size),'sha256':plan['sha256']},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('해방자 이벤트샷 1881×836 등록·원본·프롬프트 보존 완료')
