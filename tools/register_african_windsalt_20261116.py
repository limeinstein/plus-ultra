"""아프리카 항해사 30명의 전용 초상 60장을 게임 이미지 목록에 등록한다."""
import json
import re
import shutil
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT.parent/'output/african-windsalt-navigators-30-20261116'
rows=json.loads((SOURCE/'manifest.json').read_text(encoding='utf-8'))
assert len(rows)==30 and sum(r['ornate'] for r in rows)==4
manifest=ROOT/'images/manifest.js'
text=manifest.read_text(encoding='utf-8')
match=re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});',text)
files=json.loads(match.group(1))
keys=[]
for row in rows:
    for field,size in [('face',(512,512)),('knee',(1024,1536))]:
        source=SOURCE/'game-ready'/row[field]
        target=ROOT/row[field]
        target.parent.mkdir(parents=True,exist_ok=True)
        if target.exists() and target.read_bytes()!=source.read_bytes():
            raise RuntimeError('기존의 다른 원화는 덮어쓰지 않습니다: '+str(target))
        shutil.copy2(source,target)
        with Image.open(target) as im:
            assert im.size==size and im.mode=='RGBA' and im.getchannel('A').getextrema()[0]==0
        key=target.relative_to(ROOT/'images').with_suffix('').as_posix()
        keys.append(key)
        files[key]=key+'.webp'
replacement='G.IMAGE_FILES = '+json.dumps(dict(sorted(files.items())),ensure_ascii=False,indent=2)+';'
manifest.write_text(text[:match.start()]+replacement+text[match.end():],encoding='utf-8',newline='\n')
(ROOT/'tools/african_windsalt_20261116_keys.json').write_text(json.dumps(keys,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
record={'mode':'built-in image_gen','source':str(SOURCE),'portraits':rows,'keys':keys,'prompts':'prompts-final.json'}
(ROOT/'tools/african_windsalt_20261116_assets.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for source_name,target_name in [('preview-ornate.jpg','african-windsalt-20261116-ornate.jpg'),('overview-knees.jpg','african-windsalt-20261116-preview.jpg')]:
    shutil.copy2(SOURCE/source_name,ROOT/'docs/art'/target_name)
print('아프리카 항해사 30명: 전용 초상 60장 등록·규격·투명도 확인 완료')
