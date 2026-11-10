"""내장 ImageGen 원본을 보존하고 게임용 무릎상·얼굴상·사건샷으로 등록한다."""
from pathlib import Path
import argparse
import hashlib
import json
import re
import subprocess
import sys
import zipfile
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'tools'))
from import_generated_portrait import face_square
import cv2
cv2.setNumThreads(2)
OUT = ROOT/'artifacts/folktales-art-20261110'
TOOLS = ROOT/'tools/folktales_art_20261110'

def actual_file(key):
    tail = '_half' if key.endswith('_half') else ''
    return key.removesuffix('_half')+'_v20261110'+tail+'.webp'

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--partial',action='store_true')
    parser.add_argument('--faces',action='store_true')
    args=parser.parse_args()
    plan=json.loads((TOOLS/'prompts.json').read_text(encoding='utf-8'))
    rows=[]; overrides={}; physical=[]; done=[]; missing=[]
    old_check={}
    if (OUT/'assets.json').exists():
        old_check={x['key']:x for x in json.loads((OUT/'assets.json').read_text(encoding='utf-8'))['assets']}
    for kind in ['portraits','scenes']:
        for row in plan[kind]:
            record=OUT/'records'/f'{row.get("recordId",row["id"])}.json'
            if not record.is_file():missing.append(row['id']);continue
            rec=json.loads(record.read_text(encoding='utf-8'))
            source=ROOT/rec['workspace_source']
            source_hash=hashlib.sha256(source.read_bytes()).hexdigest()
            key=row['key']
            # 준비된 파일은 다시 양자화하지 않고 검사만 한다.
            keys=[key,key+'_half'] if kind=='portraits' else [key]
            need=any(not (ROOT/'images'/actual_file(k)).is_file() or old_check.get(k,{}).get('source_sha256')!=source_hash for k in keys)
            if need:
                with Image.open(source) as opened:
                    if kind=='portraits':
                        if opened.size!=(1024,1536):raise ValueError(f'무릎상 원본 크기: {row["id"]}: {opened.size}')
                        half=opened.convert('RGBA')
                        # 같은 인물의 얼굴을 추출하여 표정·의상·외형을 일치시킨다.
                        face=face_square(half).resize((448,448),Image.Resampling.LANCZOS)
                        exports=[(key,face),(key+'_half',half)]
                    else:
                        if opened.width<=opened.height:raise ValueError('가로 사건샷이 아님: '+row['id'])
                        scene=ImageOps.fit(opened.convert('RGB'),(1881,836),Image.Resampling.LANCZOS)
                        exports=[(key,scene)]
                    for k,im in exports:
                        dest=ROOT/'images'/actual_file(k);dest.parent.mkdir(parents=True,exist_ok=True)
                        im.save(dest,'WEBP',quality=95,method=6,exact=True)
            for k in keys:
                dest=ROOT/'images'/actual_file(k)
                with Image.open(dest) as im:
                    im.load()
                    expected=(1024,1536) if k.endswith('_half') else (448,448) if kind=='portraits' else (1881,836)
                    if im.size!=expected:raise ValueError('게임용 크기: '+k)
                    info={'key':k,'file':actual_file(k),'size':list(im.size),'bytes':dest.stat().st_size,
                          'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'source_sha256':source_hash}
                    if kind=='portraits':
                        a=im.convert('RGBA').getchannel('A');hist=a.histogram();pixels=im.width*im.height
                        info.update(clear=sum(hist[:8])/pixels,solid=sum(hist[240:])/pixels,bounds=list(a.point(lambda v:255 if v>40 else 0).getbbox()))
                        if info['clear']<.01 or info['solid']<.1:raise ValueError('투명도: '+k)
                        if k.endswith('_half') and im.height-info['bounds'][3]>30:raise ValueError('무릎상 하단 여백: '+k)
                        if not k.endswith('_half') and im.height-info['bounds'][3]>22:raise ValueError('얼굴상 하단 여백: '+k)
                        physical.append(Path(actual_file(k)).with_suffix('').as_posix())
                    rows.append(info);overrides[k]=actual_file(k)
            done.append({**row,**rec,'source_sha256':source_hash})
    if missing and not args.partial:raise ValueError('남은 원화 '+str(len(missing))+': '+', '.join(missing))
    (TOOLS/'asset-overrides.json').write_text(json.dumps(overrides,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
    manifest=ROOT/'images/manifest.js';text=manifest.read_text(encoding='utf-8')
    match=re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});',text)
    files=json.loads(match[1]);files.update(overrides)
    manifest.write_text(text[:match.start()]+'G.IMAGE_FILES = '+json.dumps(dict(sorted(files.items())),ensure_ascii=False,indent=2)+';'+text[match.end():],encoding='utf-8',newline='\n')
    (OUT/'assets.json').write_text(json.dumps({'assets':rows,'completed':len(done),'missing':missing,'records':done},ensure_ascii=False,indent=2),encoding='utf-8')
    (OUT/'physical-portraits.json').write_text(json.dumps(physical),encoding='utf-8')
    if args.faces:
        face_args=[str(ROOT/'tools/portrait_faces.py'),'--merge','--keys-file',str(OUT/'physical-portraits.json')]
        # 얼굴 분석은 작은 그림을 다루므로 과도한 작업 스레드를 만들지 않는다.
        face_runner="import cv2,runpy,sys;cv2.setNumThreads(2);sys.argv="+repr(face_args)+";runpy.run_path(sys.argv[0],run_name='__main__')"
        subprocess.run([sys.executable,'-c',face_runner],check=True)
        file=ROOT/'js/data/portraitfaces.js';text=file.read_text(encoding='utf-8');match=re.search(r'G\.PORTRAIT_FACES = (\{[\s\S]*?\});',text);faces=json.loads(match[1])
        additions=[]
        for k,f in overrides.items():
            if not k.startswith('portraits/'):continue
            actual=Path(f).with_suffix('').as_posix()
            if actual not in faces:raise ValueError('얼굴 자리 없음: '+actual)
            entry='    '+json.dumps(k,ensure_ascii=False)+': '+json.dumps(faces[actual],separators=(',',':'))
            pattern=r'(?m)^[ \t]*'+re.escape(json.dumps(k,ensure_ascii=False))+r': [^\n]*$'
            found=re.search(pattern,text)
            if found:
                text=text[:found.start()]+entry+(',' if found[0].endswith(',') else '')+text[found.end():]
            else:additions.append(entry)
        # 이전 항목의 값·순서·들여쓰기를 유지하고 이번 논리 키만 추가한다.
        if additions:
            match=re.search(r'G\.PORTRAIT_FACES = (\{[\s\S]*?\});',text)
            end=match.end(1)-1
            text=text[:end].rstrip()+',\n'+',\n'.join(additions)+'\n  '+text[end:]
        file.write_text(text,encoding='utf-8',newline='\n')
    if not missing:
        with zipfile.ZipFile(OUT/'folktales-art-20261110.zip','w',compression=zipfile.ZIP_DEFLATED) as archive:
            for f in overrides.values():archive.write(ROOT/'images'/f,'images/'+f)
            archive.write(TOOLS/'prompts.json','prompts.json')
            archive.write(OUT/'assets.json','assets.json')
    print(json.dumps({'completed':len(done),'assets':len(rows),'remaining':len(missing),'faces':args.faces}))

if __name__=='__main__':main()
