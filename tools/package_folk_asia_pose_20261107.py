"""원 캡처 자세를 기준으로 재제작한 8종을 v3 한 쌍으로 보관·등록한다."""
import argparse
import json
import shutil
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from package_folk_asia_pacific_faces_20261107 import closeup

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT/'artifacts/folk-asia-pose-20261107'
SPEC = ROOT/'tools/folk_asia_pose_20261107_prompts.json'
MASTER = ROOT/'tools/folk_asia_pacific_women_20261107_prompts.json'
OLD = ROOT/'artifacts/folk-asia-pacific-women-20261107'
STEM = ROOT/'docs/art/folk-asia-pose-20261107'


def save(path, data):
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')


def prepare():
    spec=json.loads(SPEC.read_text(encoding='utf-8'))
    generated=json.loads((ART/'generation-results.json').read_text(encoding='utf-8'))
    master=json.loads(MASTER.read_text(encoding='utf-8'))
    results=json.loads((OLD/'generation-results.json').read_text(encoding='utf-8'))
    rows={r['id']:r for r in master['portraits']}
    (ART/'sources').mkdir(exist_ok=True)
    for row in spec['portraits']:
        old=rows[row['id']]
        row['source']=generated[row['id']]['source']
        source=ART/'sources'/(row['id']+'_v3.png')
        if not source.exists():shutil.copy2(row['source'],source)
        if old['face_key']!=row['face_key']:
            row['previous_version']={k:old.get(k) for k in ['face_key','face_file','half_file','workspace_source','prompt','source']}
        else:row['previous_version']=old['previous_version']
        row['workspace_source']=source.relative_to(ROOT).as_posix()
        row['target']=row['reference']
        old.update(row)
        results[row['id']].update(row)
    save(SPEC,spec)
    save(MASTER,master)
    save(OLD/'generation-results.json',results)
    # 8종만 v3, 나머지 12종의 현재 v2 선택은 그대로 둔다.
    data=ROOT/'js/data/folkjoin.js'
    text=data.read_text(encoding='utf-8')
    old="    p.portraits.f = ['portraits/folk-join/' + id + '_f_20261107_v2'];"
    if old in text:
        ids=', '.join("'"+r['id']+"'" for r in spec['portraits'])
        new="    // 원 캡처의 몸 방향·동작·성인 비율을 다시 그린 8종.\n    var poseV3 = ["+ids+"];\n    var version = poseV3.indexOf(id) >= 0 ? 'v3' : 'v2';\n    p.portraits.f = ['portraits/folk-join/' + id + '_f_20261107_' + version];"
        data.write_text(text.replace(old,new),encoding='utf-8',newline='\n')
    print('8종 v3 원본·주 캡처·의상 참고·명세 저장')


def report():
    spec=json.loads(SPEC.read_text(encoding='utf-8'))
    rows=spec['portraits']
    font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',22)
    small=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',19)
    board=Image.new('RGB',(1920,2320),'#30373c')
    draw=ImageDraw.Draw(board)
    gallery=Image.new('RGB',(1280,1200),'#30373c')
    gd=ImageDraw.Draw(gallery)
    for i,row in enumerate(rows):
        x,y=i%2*960,i//2*580
        draw.text((x+12,y+8),row['name']+' · 원 캡처 '+str(row['primary_reference_number']),font=font,fill='#f1e8d6')
        paths=[ROOT/row['reference'],ROOT/'images'/(row['previous_face_key']+'_half.webp'),ROOT/'images'/(row['face_key']+'_half.webp')]
        for j,(path,label) in enumerate(zip(paths,['원 캡처','이전 v2','몸·비율 재제작 v3'])):
            im=Image.open(path).convert('RGBA')
            im.thumbnail((304,480),Image.Resampling.LANCZOS)
            board.paste(im,(x+j*320+(320-im.width)//2,y+48+(480-im.height)//2),im)
            draw.text((x+j*320+10,y+540),label,font=small,fill='#dce3e8')
        half=Image.open(paths[2]).convert('RGBA')
        half.thumbnail((310,530),Image.Resampling.LANCZOS)
        gx,gy=i%4*320,i//4*600
        gallery.paste(half,(gx+(320-half.width)//2,gy),half)
        gd.text((gx+14,gy+556),row['name'],font=font,fill='#f1e8d6')
    # 얼굴 확대: 원 캡처와 v2/v3의 눈·코·입·시선도 함께 비교한다.
    faces=Image.new('RGB',(2880,620),'#30373c'); fd=ImageDraw.Draw(faces)
    for i,row in enumerate(rows):
        x,y=i%4*720,i//4*310
        fd.text((x+16,y+8),row['name'],font=font,fill='#f1e8d6')
        paths=[ROOT/row['reference'],ROOT/'images'/(row['previous_face_key']+'.webp'),ROOT/'images'/(row['face_key']+'.webp')]
        for j,(path,label) in enumerate(zip(paths,['원 캡처','이전 v2','재제작 v3'])):
            face=closeup(path); faces.paste(face,(x+16+j*232,y+46),face)
            fd.text((x+16+j*232,y+276),label,font=small,fill='#dce3e8')
    paths=[Path(str(STEM)+'-pose-comparison.jpg'),Path(str(STEM)+'-face-comparison.jpg'),Path(str(STEM)+'-preview.jpg')]
    for im,path in zip([board,faces,gallery],paths):im.save(path,quality=95)
    checks=[r for r in json.loads((OLD/'asset-checks.json').read_text(encoding='utf-8')) if '_v3' in r['key']]
    assert len(checks)==16
    save(ART/'asset-checks.json',checks)
    save(ART/'keys.json',[r['key'] for r in checks])
    with zipfile.ZipFile(ART/'folk-asia-pose-20261107.zip','w',zipfile.ZIP_DEFLATED) as z:
        files=[ROOT/'images'/(r['face_key']+suffix+'.webp') for r in rows for suffix in ['', '_half']]
        for path in files+paths+[SPEC,Path(str(STEM)+'.md'),ART/'asset-checks.json']:
            z.write(path,path.relative_to(ROOT).as_posix())
    print('16장·자세/얼굴 비교판·ZIP 완료')


if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--prepare',action='store_true')
    args=parser.parse_args(); prepare() if args.prepare else report()
