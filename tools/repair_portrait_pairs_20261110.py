"""확인한 일곱 인물의 기존 수정 원화를 얼굴·무릎 한 쌍으로 다시 연결한다."""
import hashlib
import json
import re
import shutil
from pathlib import Path

import cv2
from PIL import Image, ImageDraw, ImageFont
from import_generated_portrait import face_square
from package_missing_event_art_20261106 import face_coordinates
from audit_portrait_pairs_20261110 import thumb

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'artifacts/portrait-pairs-20261110'
OVERRIDES = ROOT/'tools/portrait_pair_overrides_20261110.json'
IDS = {'newton','nt_halley','nt_hooke','burbage','nt_broker'}


def save(path,data):
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')


def preview(rows,files,name):
    sheet=Image.new('RGB',(7*256,440),'#30373c'); d=ImageDraw.Draw(sheet)
    font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',17)
    for i,row in enumerate(rows):
        x=i*256
        for k,suffix in enumerate(['','_half']):
            sheet.paste(thumb(ROOT/'images'/files[row['key']+suffix],(124,365)),(x+k*128,35))
        d.text((x+4,8),row['name'],font=font,fill='white')
        d.text((x+4,409),'얼굴상              무릎상',font=font,fill='white')
    sheet.save(OUT/name,quality=95)


def main():
    cv2.setNumThreads(2)
    OUT.mkdir(parents=True,exist_ok=True)
    manifest=ROOT/'images/manifest.js'; text=manifest.read_text(encoding='utf-8')
    match=re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});',text); files=json.loads(match.group(1))
    plan=json.loads((ROOT/'tools/event_art_20261031_prompts.json').read_text(encoding='utf-8'))
    rows=[dict(r) for r in plan['portraits'] if r['id'] in IDS]
    rows.extend([
        {'id':'tam','name':'떰','key':'portraits/legendary/tam','existing_pair':'portraits/legendary/cam'},
        {'id':'maria','name':'마리아','key':'portraits/legendary/maria','half_source':'artifacts/cam-maria/maria_master.png'}
    ])
    assert len(rows)==7
    if not (OUT/'previous-mappings.json').exists():
        save(OUT/'previous-mappings.json',{r['key']+s:files[r['key']+s] for r in rows for s in ('','_half')})
        preview(rows,files,'before.jpg')
    changes={}; coords={}; records=[]
    for row in rows:
        key=row['key']; newkey=key+'_pair20261110'
        if row.get('existing_pair'):
            face_file=files[row['existing_pair']]
            half_file=files[row['existing_pair']+'_half']
            origin=half_file
        else:
            face_file=newkey+'.webp'; half_file=newkey+'_half.webp'
            half=Image.open(ROOT/row['half_source']).convert('RGBA')
            assert half.size==(1024,1536),(row['id'],half.size)
            if row['id']=='maria':
                face=face_square(half).resize((448,448),Image.Resampling.LANCZOS)
                face.save(ROOT/'images'/face_file,'WEBP',quality=95,method=4,exact=True)
            else:
                # 같은 제작 기록의 얼굴은 이미 정상이므로 픽셀을 그대로 보존한다.
                oldface=ROOT/'images'/files[key]
                target=ROOT/'images'/face_file
                if oldface.resolve()!=target.resolve():shutil.copy2(oldface,target)
            half.save(ROOT/'images'/half_file,'WEBP',quality=95,method=4,exact=True)
            origin=row['half_source']
            files[newkey]=face_file; files[newkey+'_half']=half_file
        for suffix,file in [('',face_file),('_half',half_file)]:
            im=Image.open(ROOT/'images'/file).convert('RGBA')
            assert im.getchannel('A').getextrema()[0]==0,file
            face_square(im)  # 얼굴 검출 모델의 한글 경로를 처리한다.
            c=face_coordinates(im)
            coords[key+suffix]=c
            if not row.get('existing_pair'):coords[newkey+suffix]=c
            changes[key+suffix]=file
        records.append(dict(id=row['id'],name=row['name'],key=key,face_file='images/'+face_file,half_file='images/'+half_file,source=origin,
            face_sha256=hashlib.sha256((ROOT/'images'/face_file).read_bytes()).hexdigest(),
            half_sha256=hashlib.sha256((ROOT/'images'/half_file).read_bytes()).hexdigest(),
            reason='기존에 제작된 수정 얼굴·무릎상 한 쌍으로 연결'))
    files.update(changes)
    # 다른 작업이 더한 목록을 보존하도록 쓰기 직전에 다시 읽는다.
    text=manifest.read_text(encoding='utf-8'); match=re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});',text)
    latest=json.loads(match.group(1))
    latest.update({k:v for k,v in files.items() if k in changes or '_pair20261110' in k})
    manifest.write_text(text[:match.start()]+'G.IMAGE_FILES = '+json.dumps(dict(sorted(latest.items())),ensure_ascii=False,indent=2)+';'+text[match.end():],encoding='utf-8',newline='\n')
    save(OVERRIDES,changes)
    coordinate_file=ROOT/'js/data/portraitfaces.js'; text=coordinate_file.read_text(encoding='utf-8'); additions=[]
    for key,c in coords.items():
        entry=json.dumps(key)+': '+json.dumps(c,separators=(',',':'))
        pattern=r'"'+re.escape(key)+r'": \{[^\n]+\}'
        if re.search(pattern,text):text=re.sub(pattern,entry,text)
        else:additions.append('    '+entry)
    if additions:
        end=text.index('\n  };'); body=text[:end].rstrip()
        text=body+('' if body.endswith('{') else ',')+'\n'+',\n'.join(additions)+text[end:]
    coordinate_file.write_text(text,encoding='utf-8',newline='\n')
    save(OUT/'repair-records.json',records)
    preview(rows,latest,'after.jpg')
    print('7 pairs reconnected; old assets preserved; persistent overrides and face coordinates updated')


if __name__=='__main__':
    main()
