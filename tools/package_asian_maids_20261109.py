"""참고 사진 10명의 얼굴상·무릎상 20장을 새 지역 여급 묶음으로 저장한다."""
import json,math,re,shutil,zipfile
from pathlib import Path

import cv2
from PIL import Image,ImageDraw,ImageFont
from import_generated_portrait import face_square
from package_missing_event_art_20261106 import face_coordinates
from package_folk_asia_pacific_faces_20261107 import closeup

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'artifacts/asian-maids-20261109'
PLAN=ROOT/'tools/asian_maids_20261109_prompts.json'
STEM=ROOT/'docs/art/asian-maids-20261109'


def save(path,data):
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')


def build_previews(rows):
    font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',22)
    small=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',18)
    previews=[]
    for group in [None,'조선','중국','필리핀','인도네시아']:
        selected=[r for r in rows if group is None or r['group']==group]
        cols=5 if group is None else len(selected)
        im=Image.new('RGB',(cols*320,math.ceil(len(selected)/cols)*750),'#30373c'); d=ImageDraw.Draw(im)
        for i,r in enumerate(selected):
            x,y=i%cols*320,i//cols*750
            half=Image.open(ROOT/r['half_file']).convert('RGBA'); half.thumbnail((310,465),Image.Resampling.LANCZOS)
            im.paste(half,(x+(320-half.width)//2,y+8),half)
            face=Image.open(ROOT/r['face_file']).convert('RGBA').resize((160,160),Image.Resampling.LANCZOS)
            im.paste(face,(x+80,y+490),face)
            d.text((x+12,y+671),r['group']+' 여급 '+str(r['number']),font=font,fill='#f1e8d6')
            d.text((x+12,y+708),r['key'],font=small,fill='#c9d5dc')
        suffix='' if group is None else '-'+{'조선':'joseon','중국':'china','필리핀':'philippines','인도네시아':'indonesia'}[group]
        path=Path(str(STEM)+suffix+'-preview.jpg'); im.save(path,quality=95); previews.append(path)
    compare=Image.new('RGB',(1440,1200),'#30373c'); d=ImageDraw.Draw(compare)
    pose=Image.new('RGB',(1280,2700),'#30373c'); pd=ImageDraw.Draw(pose)
    for i,r in enumerate(rows):
        x,y=i%3*480,i//3*300
        d.text((x+12,y+8),r['group']+' '+str(r['number']),font=font,fill='#f1e8d6')
        for j,(file,label) in enumerate([(r['reference'],'원 캡처'),(r['face_file'],'새 얼굴상')]):
            thumb=closeup(ROOT/file); compare.paste(thumb,(x+12+j*232,y+40),thumb)
            d.text((x+12+j*232,y+270),label,font=small,fill='#dce3e8')
        x,y=i%2*640,i//2*540
        pd.text((x+12,y+8),r['group']+' '+str(r['number']),font=font,fill='#f1e8d6')
        for j,(file,label) in enumerate([(r['reference'],'원 캡처'),(r['half_file'],'새 무릎상')]):
            thumb=Image.open(ROOT/file).convert('RGBA'); thumb.thumbnail((304,450),Image.Resampling.LANCZOS)
            pose.paste(thumb,(x+j*320+(320-thumb.width)//2,y+44+(450-thumb.height)//2),thumb)
            pd.text((x+j*320+12,y+506),label,font=small,fill='#dce3e8')
    for image,suffix in [(compare,'-face-comparison.jpg'),(pose,'-pose-comparison.jpg')]:
        path=Path(str(STEM)+suffix); image.save(path,quality=95); previews.append(path)
    return previews


def main():
    cv2.setNumThreads(2)
    spec=json.loads(PLAN.read_text(encoding='utf-8'))
    results=json.loads((ART/'generation-results.json').read_text(encoding='utf-8'))
    assert len(spec['portraits'])==10
    (ART/'sources').mkdir(exist_ok=True)
    checks=[]; exports=[]
    for r in spec['portraits']:
        r.update(results[r['id']])
        for i,old in enumerate(r.get('revisions',[])):
            before=ART/'revisions'/(r['id']+'_'+str(i+1)+'.png')
            before.parent.mkdir(exist_ok=True)
            if not before.exists():shutil.copy2(old['source'],before)
            old['workspace_source']=before.relative_to(ROOT).as_posix()
        r['edit_inputs']=([r['revisions'][-1]['workspace_source'],r['reference']] if r.get('revisions') else [r['reference']])
        source=ART/'sources'/(r['id']+'_v1.png')
        if not source.exists():shutil.copy2(r['source'],source)
        r['workspace_source']=source.relative_to(ROOT).as_posix()
        half=Image.open(source).copy()
        assert half.mode=='RGBA' and half.size==(1024,1536),(r['id'],half.mode,half.size)
        face=face_square(half).resize((448,448),Image.Resampling.LANCZOS)
        for suffix,picture in [('',face),('_half',half)]:
            key=r['key']+suffix; relative=key+'.webp'; dest=ROOT/'images'/relative
            dest.parent.mkdir(parents=True,exist_ok=True)
            if not dest.exists():picture.save(dest,'WEBP',quality=95,method=4,exact=True)
            with Image.open(dest) as opened:
                opened.load(); assert opened.size==picture.size and opened.mode=='RGBA',key
                alpha=opened.getchannel('A'); hist=alpha.histogram()
                clear=sum(hist[:8])/(picture.width*picture.height); solid=sum(hist[240:])/(picture.width*picture.height)
                assert clear>.015 and solid>.08,(key,clear,solid)
                assert alpha.tobytes()==picture.getchannel('A').tobytes(),key+' 기존 파일/알파 불일치'
                coords=face_coordinates(opened.convert('RGBA'))
            checks.append(dict(key=key,file='images/'+relative,size=list(picture.size),clear=clear,solid=solid,alpha_preserved=True,face=coords))
            exports.append(dest)
        r['face_file']='images/'+r['key']+'.webp'; r['half_file']='images/'+r['key']+'_half.webp'
    # 파일을 모두 검사한 뒤 새 20개만 최신 이미지 목록에 추가한다.
    manifest=ROOT/'images/manifest.js'; text=manifest.read_text(encoding='utf-8')
    match=re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});',text); files=json.loads(match.group(1))
    previous=ART/'previous-keys.json'
    if not previous.exists():save(previous,{c['key']:files.get(c['key']) for c in checks})
    for c in checks:
        relative=c['file'].removeprefix('images/')
        assert c['key'] not in files or files[c['key']]==relative,c['key']+' 이미 사용 중인 열쇠'
        files[c['key']]=relative
    manifest.write_text(text[:match.start()]+'G.IMAGE_FILES = '+json.dumps(dict(sorted(files.items())),ensure_ascii=False,indent=2)+';'+text[match.end():],encoding='utf-8',newline='\n')
    coords_path=ROOT/'js/data/portraitfaces.js'; text=coords_path.read_text(encoding='utf-8'); missing=[]
    for c in checks:
        pattern=r'"'+re.escape(c['key'])+r'": \{[^\n]+\}'
        entry=json.dumps(c['key'])+': '+json.dumps(c['face'],separators=(',',':'))
        if re.search(pattern,text):text=re.sub(pattern,entry,text)
        else:missing.append('    '+entry)
    if missing:
        end=text.index('\n  };'); body=text[:end].rstrip()
        text=body+('' if body.endswith('{') else ',')+'\n'+',\n'.join(missing)+text[end:]
    coords_path.write_text(text,encoding='utf-8',newline='\n')
    spec['event_shots']=False;save(PLAN,spec);save(ART/'asset-checks.json',checks);save(ART/'keys.json',[c['key'] for c in checks])
    previews=build_previews(spec['portraits'])
    with zipfile.ZipFile(ART/'asian-maids-20261109.zip','w',zipfile.ZIP_DEFLATED) as z:
        for path in exports+previews+[PLAN,ART/'asset-checks.json',Path(str(STEM)+'.md')]:
            if path.is_file():z.write(path,path.relative_to(ROOT).as_posix())
    print('10명·얼굴/무릎20장·투명 알파·얼굴 좌표·지역 묶음 등록·비교판·ZIP 완료')


if __name__=='__main__':main()
