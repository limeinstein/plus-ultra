#!/usr/bin/env python3
"""역사 사건의 빠진 인물화와 장면 원화를 내보내고 검사용 모음을 만든다."""
from pathlib import Path
import argparse
import json
import re
import shutil
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps
from romeojuliet_assets import face_portrait, knee_portrait

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'artifacts/history-art-20261101'


def records():
    return [json.loads(p.read_text(encoding='utf-8')) for p in sorted((WORK/'selected').glob('*.json'))]


def outputs(row):
    if row['kind'] == 'portrait':
        return [ROOT/'images/portraits/history'/(row['id']+s+'.webp') for s in ('','_half')]
    return [ROOT/'images/legend-events'/(row['id']+'.webp')]


def import_ready():
    log_path = WORK/'imported.json'
    log = json.loads(log_path.read_text(encoding='utf-8')) if log_path.exists() else {}
    count = 0
    for row in records():
        key = row['kind']+'-'+row['id']; targets = outputs(row)
        if log.get(key) == row['source'] and all(p.exists() for p in targets):
            expected = [(1024,1024),(1024,1536)] if row['kind']=='portrait' else [(1881,836)]
            # 다른 축소 작업이 지나갔더라도 요청한 해상도로 다시 내보낼 수 있게 한다.
            if all(Image.open(p).size==size for p,size in zip(targets,expected)):
                continue
        raw = WORK/'raw'/(key+'.png'); raw.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(row['source'], raw)
        image = Image.open(raw).convert('RGBA')
        if row['kind'] == 'portrait':
            a = np.array(image)
            if a[:,:,3].min() != 0:
                raise ValueError('투명 배경 누락: '+key)
            a[a[:,:,3] <= 4] = 0; person = Image.fromarray(a)
            rendered = [face_portrait(person), knee_portrait(person)]
        else:
            rendered = [ImageOps.fit(image.convert('RGB'), (1881,836), Image.Resampling.LANCZOS)]
        for target, output in zip(targets, rendered):
            target.parent.mkdir(parents=True, exist_ok=True)
            output.save(target, 'WEBP', quality=95, method=4, exact=True)
        log[key] = row['source']; count += 1
        print(key+' 내보내기 완료', flush=True)
        log_path.write_text(json.dumps(log, ensure_ascii=False, indent=2)+'\n',encoding='utf-8',newline='\n')
    print(str(count)+'개 원화 내보내기 완료')


def register():
    rows = [r for r in records() if all(p.exists() for p in outputs(r))]
    path = ROOT/'images/manifest.js'; text = path.read_text(encoding='utf-8'); additions=[]
    for row in rows:
        for output in outputs(row):
            file = output.relative_to(ROOT/'images').as_posix(); key = file[:-5]
            if '"'+key+'":' not in text:
                additions.append('  '+json.dumps(key)+': '+json.dumps(file)+',')
    if additions:
        text=text.replace('G.IMAGE_FILES = {\n','G.IMAGE_FILES = {\n'+'\n'.join(additions)+'\n',1)
        path.write_text(text,encoding='utf-8',newline='\n')
    keys=[p.relative_to(ROOT/'images').as_posix()[:-5] for r in rows if r['kind']=='portrait' for p in outputs(r)]
    path=ROOT/'js/data/portraitfaces.js'; before=path.read_text(encoding='utf-8')
    command=[sys.executable,str(ROOT/'tools/portrait_faces.py'),'--merge']
    for key in keys: command+=['--key',key]
    if keys: subprocess.run(command,cwd=ROOT,check=True)
    after=path.read_text(encoding='utf-8')
    parse=lambda t:{k:json.loads(v) for k,v in re.findall(r'"([^"\n]+)":\s*(\{[^\n]*\})',t)}
    a,b=parse(before),parse(after)
    assert all(b.get(k)==v for k,v in a.items() if k not in keys), '다른 얼굴 좌표 변경'
    assert all(k in b for k in keys), '얼굴 좌표 누락'
    print('이미지 경로·얼굴 좌표 연결 완료')


def preview():
    font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',18)
    groups={}; checks=[]
    for row in records():
        if not all(p.exists() for p in outputs(row)): continue
        group=row.get('group',row['id'].split('_')[0]); groups.setdefault((row['kind'],group),[]).append(row)
        for path in outputs(row):
            image=Image.open(path); expected=(1881,836) if row['kind']=='scene' else ((1024,1536) if path.stem.endswith('_half') else (1024,1024))
            assert image.size==expected, str(path)
            check={'path':path.relative_to(ROOT).as_posix(),'size':list(image.size)}
            if row['kind']=='portrait':
                a=np.array(image.convert('RGBA')); rgb=a[:,:,:3].astype(float)
                neon=int(((rgb.max(axis=2)>240)&(rgb.min(axis=2)<8)&(a[:,:,3]>32)).sum())
                assert a[:,:,3].min()==0 and neon<12, str(path)
                check['opaque_neon_pixels']=neon
            checks.append(check)
    for (kind,group),rows in groups.items():
        columns=6 if kind=='portrait' else 2; cellw=300 if kind=='portrait' else 900; cellh=660 if kind=='portrait' else 430
        sheet=Image.new('RGB',(columns*cellw,((len(rows)+columns-1)//columns)*cellh),'#302924'); draw=ImageDraw.Draw(sheet)
        for i,row in enumerate(rows):
            x,y=i%columns*cellw,i//columns*cellh
            if kind=='portrait':
                for path,box,off in [(outputs(row)[1],(290,430),0),(outputs(row)[0],(170,170),440)]:
                    im=Image.open(path).convert('RGBA'); im.thumbnail(box); sheet.paste(im,(x+(cellw-im.width)//2,y+off),im)
                draw.text((x+8,y+623),row.get('name',row['id']),font=font,fill='#f5dfb0')
            else:
                im=Image.open(outputs(row)[0]); im.thumbnail((880,390)); sheet.paste(im,(x+10,y)); draw.text((x+15,y+397),row.get('title',row['id']),font=font,fill='#f5dfb0')
        sheet.save(WORK/(kind+'-'+group+'-preview.jpg'),quality=94)
    (WORK/'asset-check.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
    print(str(len(checks))+'장 규격·투명 배경·형광색 검사 완료')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--import-ready',action='store_true'); parser.add_argument('--register',action='store_true'); parser.add_argument('--preview',action='store_true')
    args=parser.parse_args()
    if args.import_ready: import_ready()
    if args.register: register()
    if args.preview: preview()
