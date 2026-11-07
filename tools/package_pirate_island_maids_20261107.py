"""참고 얼굴·표정·자세로 제작한 일곱 해적섬 여급의 얼굴·무릎상 등록."""
import json
import re
import shutil
import zipfile
from pathlib import Path

import cv2
from PIL import Image, ImageDraw, ImageFont
from import_generated_portrait import face_square
from package_missing_event_art_20261106 import face_coordinates
from package_folk_asia_pacific_faces_20261107 import closeup

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'artifacts/pirate-island-maids-20261107'
PLAN=ROOT/'tools/pirate_island_maids_20261107_prompts.json'
STEM=ROOT/'docs/art/pirate-island-maids-20261107'


def save(path,data):
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')


def main():
    cv2.setNumThreads(2)
    spec=json.loads(PLAN.read_text(encoding='utf-8'))
    generated=json.loads((ART/'generation-results.json').read_text(encoding='utf-8'))
    manifest=ROOT/'images/manifest.js'; text=manifest.read_text(encoding='utf-8')
    match=re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});',text)
    files=json.loads(match.group(1))
    coords_path=ROOT/'js/data/portraitfaces.js'; coords_text=coords_path.read_text(encoding='utf-8')
    previous_path=ART/'previous-mapping.json'
    previous=json.loads(previous_path.read_text(encoding='utf-8')) if previous_path.exists() else {}
    (ART/'sources').mkdir(exist_ok=True)
    gallery=Image.new('RGB',(1400,1560),'#30373c'); gd=ImageDraw.Draw(gallery)
    compare=Image.new('RGB',(1920,2320),'#30373c'); cd=ImageDraw.Draw(compare)
    faces=Image.new('RGB',(1440,1240),'#30373c'); fd=ImageDraw.Draw(faces)
    font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',22)
    small=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',19)
    checks=[]; exports=[]
    for i,row in enumerate(spec['portraits']):
        row.update(generated[row['id']])
        source=ART/'sources'/(row['id']+'_v1.png')
        if not source.exists():shutil.copy2(row['source'],source)
        row['workspace_source']=source.relative_to(ROOT).as_posix()
        half=Image.open(source).copy()
        assert half.mode=='RGBA' and half.size==(1024,1536),row['id']
        face=face_square(half).resize((448,448),Image.Resampling.LANCZOS)
        for suffix,pic in [('',face),('_half',half)]:
            key=row['key']+suffix
            relative=row['key']+row['tag']+suffix+'.webp'
            dest=ROOT/'images'/relative
            if not dest.exists():pic.save(dest,'WEBP',quality=95,method=4,exact=True)
            with Image.open(dest) as opened:
                opened.load()
                assert opened.mode=='RGBA' and opened.size==pic.size,key
                alpha=opened.getchannel('A'); hist=alpha.histogram()
                clear=sum(hist[:8])/(pic.width*pic.height)
                solid=sum(hist[240:])/(pic.width*pic.height)
                assert clear>.015 and solid>.1,(key,clear,solid)
                assert alpha.tobytes()==pic.getchannel('A').tobytes(),key+' alpha'
                coords=face_coordinates(opened.convert('RGBA'))
            if key not in previous:previous[key]=files[key]
            files[key]=relative
            checks.append(dict(key=key,file='images/'+relative,size=list(pic.size),clear=clear,solid=solid,alpha_preserved=True,face=coords))
            exports.append(dest)
        row['face_file']='images/'+row['key']+row['tag']+'.webp'
        row['half_file']='images/'+row['key']+row['tag']+'_half.webp'
        gx,gy=i%4*350,i//4*780
        thumb=half.copy(); thumb.thumbnail((340,510),Image.Resampling.LANCZOS)
        gallery.paste(thumb,(gx+(350-thumb.width)//2,gy+4),thumb)
        thumb=face.resize((150,150),Image.Resampling.LANCZOS)
        gallery.paste(thumb,(gx+100,gy+530),thumb)
        gd.text((gx+12,gy+694),row['place']+' · 여급',font=font,fill='#f1e8d6')
        gd.text((gx+12,gy+730),row['region']+' / 참고 '+str(row['reference_number']),font=small,fill='#dce3e8')
        x,y=i%2*960,i//2*580
        cd.text((x+12,y+8),row['place']+' · 원 캡처 '+str(row['reference_number']),font=font,fill='#f1e8d6')
        old_half=ROOT/'images'/previous[row['key']+'_half']
        paths=[ROOT/row['workspace_reference'],old_half,source]
        for j,(path,label) in enumerate(zip(paths,['원 캡처','이전 여급','새 여급'])):
            im=Image.open(path).convert('RGBA'); im.thumbnail((304,480),Image.Resampling.LANCZOS)
            compare.paste(im,(x+j*320+(320-im.width)//2,y+48+(480-im.height)//2),im)
            cd.text((x+j*320+10,y+540),label,font=small,fill='#dce3e8')
        x,y=i%2*720,i//2*310
        fd.text((x+16,y+8),row['place'],font=font,fill='#f1e8d6')
        paths=[ROOT/row['workspace_reference'],ROOT/'images'/previous[row['key']],ROOT/row['face_file']]
        for j,(path,label) in enumerate(zip(paths,['원 캡처','이전 여급','새 여급'])):
            im=closeup(path); faces.paste(im,(x+16+j*232,y+46),im)
            fd.text((x+16+j*232,y+276),label,font=small,fill='#dce3e8')
        exports.extend([source,ROOT/row['workspace_reference']])
    assert len(checks)==14
    # 그림과 얼굴 좌표를 모두 확인한 뒤 기존 논리 키 14개만 교체한다.
    # 다른 그림 작업의 목록 변경을 덮어쓰지 않도록 저장 직전에 다시 읽는다.
    text=manifest.read_text(encoding='utf-8')
    match=re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});',text)
    files=json.loads(match.group(1))
    files.update({r['key']:r['file'].removeprefix('images/') for r in checks})
    coords_text=coords_path.read_text(encoding='utf-8')
    missing=[]
    for row in checks:
        pattern=r'"'+re.escape(row['key'])+r'": \{[^\n]+\}'
        entry='"'+row['key']+'": '+json.dumps(row['face'],separators=(',',':'))
        if re.search(pattern,coords_text):coords_text=re.sub(pattern,entry,coords_text)
        else:missing.append('    '+entry)
    if missing:
        end=coords_text.index('\n  };')
        body=coords_text[:end].rstrip()
        coords_text=body+('' if body.endswith('{') else ',')+'\n'+',\n'.join(missing)+coords_text[end:]
    manifest.write_text(text[:match.start()]+'G.IMAGE_FILES = '+json.dumps(dict(sorted(files.items())),ensure_ascii=False,indent=2)+';'+text[match.end():],encoding='utf-8',newline='\n')
    coords_path.write_text(coords_text,encoding='utf-8',newline='\n')
    save(previous_path,previous); save(PLAN,spec); save(ART/'asset-checks.json',checks)
    previews=[Path(str(STEM)+suffix+'.jpg') for suffix in ['-preview','-pose-comparison','-face-comparison']]
    for im,path in zip([gallery,compare,faces],previews):im.save(path,quality=95)
    extra=[PLAN,ART/'asset-checks.json',previous_path,Path(str(STEM)+'.md'),Path(__file__)]+previews
    with zipfile.ZipFile(ART/'pirate-island-maids-20261107.zip','w',zipfile.ZIP_DEFLATED) as z:
        for path in exports+extra:
            if path.is_file():z.write(path,path.relative_to(ROOT).as_posix())
    print('일곱 섬 여급 얼굴상·무릎상 14장, 얼굴 좌표·참고 비교·ZIP 완료')


if __name__=='__main__':main()
