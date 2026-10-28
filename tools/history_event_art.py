#!/usr/bin/env python3
"""내장 ImageGen 원화를 역사 이벤트 얼굴상·무릎상·장면 규격으로 내보낸다."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import shutil

from PIL import Image, ImageDraw, ImageFont, ImageOps
import cv2

cv2.setNumThreads(2)  # 작은 초상 검출에서 많은 CPU 스레드가 서로 기다리는 일을 줄인다.

from import_generated_portrait import face_square
from portrait_asset_layout import detect_face

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'artifacts/history-event-art-20261028'
SPECS = ROOT/'tools/history_event_art_prompts.json'
FACE_SIZE = (1024, 1024)  # 원본 해상도를 줄이지 않는 대화창 얼굴상 규격


def save_asset(image,path,**options):
    path=Path(path)
    temporary=path.with_name(path.stem+'.tmp.webp')
    image.save(temporary,'WEBP',**options)
    temporary.replace(path)


def materialize():
    specs = json.loads(SPECS.read_text(encoding='utf-8'))['assets']
    results_path = OUT/'generated.json'
    results = json.loads(results_path.read_text(encoding='utf-8')) if results_path.exists() else {}
    old_path=OUT/'asset-report.json'
    old_rows=json.loads(old_path.read_text(encoding='utf-8')) if old_path.exists() else []
    cached={(r['type'],r['id']):r for r in old_rows}
    report = []
    for asset in specs:
        ident = asset['id']
        portrait_dir = asset.get('portrait_dir','portraits/history')
        result_key=asset['type']+':'+ident if asset['type']+':'+ident in results else ident
        if result_key not in results:
            continue
        # 히데요시 초상과 같은 이름의 사건 장면은 서로 다른 원화다.
        if asset['type']=='scene' and ident=='teppo_hideyoshi' and result_key==ident:
            continue
        saved = OUT/'sources'/asset['type']/f'{ident}.png'
        saved.parent.mkdir(parents=True,exist_ok=True)
        origin = Path(results[result_key]['source'])
        if not saved.exists() or saved.stat().st_size != origin.stat().st_size or saved.stat().st_mtime < origin.stat().st_mtime:
            shutil.copy2(origin,saved)
        target=ROOT/'images'/(portrait_dir+'/'+ident+'_half.webp' if asset['type']=='portrait' else 'legend-events/'+ident+'.webp')
        row=cached.get((asset['type'],ident))
        valid=bool(row and target.exists() and target.stat().st_mtime>=origin.stat().st_mtime
          and row.get('crop')==asset.get('crop') and row.get('face_crop')==asset.get('face_crop')
          and (asset['type']!='portrait' or row.get('face_size')==list(FACE_SIZE)))
        if valid:
            paths=[target]
            if asset['type']=='portrait':
                paths.append(ROOT/'images'/portrait_dir/f'{ident}.webp')
            try:
                for picture in paths:
                    with Image.open(picture) as im:
                        im.load()
            except (OSError,ValueError):
                valid=False
        if valid:
            report.append(row)
            continue
        with Image.open(saved) as opened:
            im = opened.convert('RGBA' if asset['type']=='portrait' else 'RGB')
        if asset['type']=='portrait':
            alpha = im.getchannel('A')
            assert alpha.getextrema()[0]==0, (ident,'투명 배경 없음')
            # 전신 원화를 받은 경우 명세에 검수한 무릎단 영역을 적어 둔다. 종횡비는 유지한다.
            if asset.get('crop'):
                x0,y0,x1,y1=asset['crop']
                im=im.crop((round(x0*im.width),round(y0*im.height),round(x1*im.width),round(y1*im.height)))
            half = ImageOps.contain(im,(1008,1520),Image.Resampling.LANCZOS)
            canvas = Image.new('RGBA',(1024,1536))
            canvas.alpha_composite(half,((1024-half.width)//2,8))
            if asset.get('face_crop'):
                # 사람 얼굴 검출기가 읽지 못하는 동물 화자의 수동 검수 영역.
                x0,y0,x1,y1=asset['face_crop']
                face=canvas.crop((round(x0*1024),round(y0*1536),round(x1*1024),round(y1*1536)))
                face=ImageOps.fit(face,FACE_SIZE,Image.Resampling.LANCZOS)
            else:
                face = face_square(canvas).resize(FACE_SIZE,Image.Resampling.LANCZOS)
            path = ROOT/'images'/portrait_dir/ident
            path.parent.mkdir(parents=True,exist_ok=True)
            save_asset(canvas,str(path)+'_half.webp',quality=94,method=6,exact=True)
            save_asset(face,str(path)+'.webp',quality=94,method=6,exact=True)
            report.append({'id':ident,'type':'portrait','size':[1024,1536],'face_size':list(FACE_SIZE),
                'detected_face':detect_face(canvas),'alpha_range':alpha.getextrema(),
                **({'crop':asset['crop']} if asset.get('crop') else {}),
                **({'face_crop':asset['face_crop']} if asset.get('face_crop') else {})})
        else:
            picture = ImageOps.fit(im,(1881,836),Image.Resampling.LANCZOS,centering=(.5,.5))
            path = ROOT/'images/legend-events'/f'{ident}.webp'
            save_asset(picture,path,quality=94,method=6)
            report.append({'id':ident,'type':'scene','size':[1881,836]})
    (OUT/'asset-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    return report


def preview():
    specs=json.loads(SPECS.read_text(encoding='utf-8'))['assets']
    font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',16)
    for kind in ('face','portrait','scene'):
        source_kind='portrait' if kind=='face' else kind
        assets=[a for a in specs if a['type']==source_kind and (OUT/'sources'/source_kind/f'{a["id"]}.png').exists()]
        if not assets:
            continue
        cw,ch=(200,240) if kind=='face' else (256,420) if kind=='portrait' else (480,250)
        cols=5 if kind=='face' else 4 if kind=='portrait' else 3
        sheet=Image.new('RGB',(cols*cw,((len(assets)+cols-1)//cols)*ch),'#302b28')
        draw=ImageDraw.Draw(sheet)
        for i,a in enumerate(assets):
            x,y=i%cols*cw,i//cols*ch
            key=a.get('portrait_dir','portraits/history')+'/'+a['id']+('.webp' if kind=='face' else '_half.webp') if source_kind=='portrait' else 'legend-events/'+a['id']+'.webp'
            p=ROOT/'images'/key
            with Image.open(p) as im:
                display=ImageOps.contain(im.convert('RGBA'),(cw-12,ch-40),Image.Resampling.LANCZOS)
            sheet.paste(display,(x+(cw-display.width)//2,y+4),display)
            lines=['']
            for char in a['name']:
                if draw.textbbox((0,0),lines[-1]+char,font=font)[2]>cw-12:
                    lines.append('')
                lines[-1]+=char
            for j,line in enumerate(lines[:2]):
                draw.text((x+6,y+ch-38+j*18),line,font=font,fill='#f5dfae')
        sheet.save(OUT/f'{kind}-preview.jpg',quality=92)


if __name__=='__main__':
    OUT.mkdir(parents=True,exist_ok=True)
    reports=materialize()
    preview()
    print(json.dumps({'portraits':sum(r['type']=='portrait' for r in reports),'scenes':sum(r['type']=='scene' for r in reports)},ensure_ascii=False))
