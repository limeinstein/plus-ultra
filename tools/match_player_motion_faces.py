#!/usr/bin/env python3
"""sprite-gen 얼굴 레이어로 걷기의 머리를 달리기에 고정한다.

걷기 대기 칸을 원본으로 삼아 정수 좌표로만 옮긴다. 하얀 남방 항해사는
먼저 걷기 머리 폭을 54px로 맞춘다. 몸통과 팔다리, 바닥선은 보존한다.
목·옷깃의 경계만 3px 안에서 섞으며 결과와 원본을 따로 보관한다.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import shutil
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from update_player_walk_loops import ROOT, box, cells, contact, digest, metrics, read_config, save_sheet

# 머리 중심에서 잰 가로 좌표와 정수 칸의 목·옷깃 경계. 머리카락이 긴
# 인물은 뒤쪽 경계를 더 내리고, 어깨와 망토는 가능한 한 몸 동작을 남긴다.
XS = [-1000, -34, -25, -15, -5, 5, 15, 25, 34, 1000]
CUTS = {
    'admiral':               [32, 32, 39, 43, 48, 54, 53, 46, 39, 39],
    'armored_navigator':     [31, 31, 33, 38, 45, 51, 49, 45, 38, 38],
    'army_officer':          [35, 35, 45, 47, 51, 55, 53, 47, 42, 42],
    'battle_vanguard':       [32, 32, 35, 39, 47, 55, 55, 49, 42, 42],
    'blackcoat_captain':     [36, 36, 52, 56, 58, 59, 57, 51, 45, 45],
    'casanova':              [32, 32, 43, 46, 51, 56, 54, 48, 42, 42],
    'charismatic_admiral':   [32, 32, 38, 42, 48, 54, 52, 47, 40, 40],
    'ganghui':               [32, 32, 37, 41, 47, 54, 54, 48, 42, 42],
    'hat_spinner':           [32, 32, 41, 46, 51, 57, 56, 49, 43, 43],
    'muscle_swordsman':      [33, 33, 40, 44, 50, 56, 54, 48, 41, 41],
    'navigator_white':      [33, 33, 47, 52, 59, 67, 65, 60, 52, 47],
    'noble_scholar':         [31, 31, 37, 41, 47, 54, 54, 48, 42, 42],
    'sea_dog':               [33, 33, 40, 45, 51, 57, 55, 49, 43, 43],
    'sky_adventurer':        [35, 35, 45, 49, 55, 61, 61, 55, 49, 49],
}
FACE_BOTTOM = dict(zip(CUTS, (44,43,44,46,49,45,45,46,47,47,54,43,46,50)))
NAVIGATOR_HEAD_WIDTH = 54


def record_lock(look, reference_index, records, walkpath, runpath):
    """다음 자산 교체에서도 얼굴 원본을 확인할 수 있도록 제작 좌표를 남긴다."""
    path = ROOT/'docs/art/player-motion-faces.json'
    manifest = json.loads(path.read_text(encoding='utf-8')) if path.exists() else {'version':1,'characters':{}}
    manifest['characters'][look] = {
        'walking_reference_frame':reference_index,'walking_sha256':digest(walkpath),
        'run_sha256':digest(runpath),'scale':1,'face_bottom':FACE_BOTTOM[look],
        'translations':[r['translation'] for r in records],
    }
    if look == 'navigator_white':
        manifest['characters'][look]['head_width'] = NAVIGATOR_HEAD_WIDTH
    # 한 인물의 좌표를 한 줄에 모아 원본과 49칸 대응 관계를 읽기 쉽게 둔다.
    rows = [json.dumps(k)+': '+json.dumps(v,ensure_ascii=False) for k,v in manifest['characters'].items()]
    path.write_text('{"version":1,"characters":{\n'+',\n'.join(rows)+'\n}}\n',encoding='utf-8')


def head_centre(frame):
    top = box(frame)[1]
    bb = frame.getchannel('A').crop((0, top, frame.width, top+28)).point(lambda a: 255 if a > 40 else 0).getbbox()
    return round((bb[0]+bb[2]-1)/2)


def head_width(frame):
    top = box(frame)[1]
    bb = frame.getchannel('A').crop((0,top,frame.width,top+30)).point(lambda a:255 if a>40 else 0).getbbox()
    return bb[2]-bb[0]


def prepare_walking_faces(look, walking, reference_index):
    """하얀 남방의 작았던 원본 머리를 보정하고 두 동작이 함께 쓸 기준을 만든다."""
    if look != 'navigator_white':
        return walking
    reference = walking[reference_index]
    current_width = head_width(reference)
    if current_width == NAVIGATOR_HEAD_WIDTH:
        return walking
    from sprite_gen.util.resample import resize_cell
    factor = NAVIGATOR_HEAD_WIDTH/current_width
    cx,top = head_centre(reference),box(reference)[1]
    enlarged = resize_cell(reference,(round(reference.width*factor),round(reference.height*factor)))
    placed = Image.new('RGBA',reference.size)
    placed.paste(enlarged,(cx-round(cx*factor),top-round(top*factor)))
    xx = np.arange(reference.width)-cx
    yy = np.arange(reference.height)[:,None]
    weight = np.clip((top+np.interp(xx,XS,CUTS[look])[None,:]-yy)/3,0,1).astype(np.float32)
    original = np.asarray(reference)
    a,b = original.astype(np.float32),np.asarray(placed).astype(np.float32)
    for picture in (a,b):
        picture[:,:,:3] *= picture[:,:,3:]/255
    mixed = a*(1-weight[:,:,None])+b*weight[:,:,None]
    mixed[:,:,:3] = np.divide(mixed[:,:,:3]*255,mixed[:,:,3:],out=np.zeros_like(mixed[:,:,:3]),where=mixed[:,:,3:]>0)
    data = np.clip(np.rint(mixed),0,255).astype(np.uint8)
    data[weight==0] = original[weight==0]
    canonical = Image.fromarray(data)
    assert head_width(canonical) == NAVIGATOR_HEAD_WIDTH, '하얀 남방 머리 폭 보정 실패'
    result,records = lock_faces(look,canonical,walking)
    assert all(head_width(f)==NAVIGATOR_HEAD_WIDTH for f in result)
    return result


def preview(looks, sequences, target):
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 16)
    canvas = Image.new('RGB', (1050, len(looks)*190+38), '#d6d3cc')
    draw = ImageDraw.Draw(canvas)
    draw.text((8, 5), '걷기 원본 / 기존 뛰기 / 얼굴을 맞춘 뛰기 — 머리와 얼굴 확대', font=font, fill='#171717')
    for row, look in enumerate(looks):
        y = 38+190*row
        draw.text((8, y), look, font=font, fill='#171717')
        for col, seq in enumerate(sequences[look]):
            for k, idx in enumerate((0,24)):
                f = seq[idx]
                cx, top = head_centre(f), box(f)[1]
                crop = f.crop((cx-35, top-2, cx+45, top+74)).resize((160,152))
                x = col*350+k*170
                canvas.paste(crop, (x,y+28), crop)
    canvas.save(target)


def lock_faces(look, reference, running):
    """완성된 달리기 칸에 걷기 머리를 얹는다. 배율과 몸 동작은 바꾸지 않는다."""
    from sprite_gen.video.face_layer import shift, warp
    arr = np.asarray(reference).astype(np.float32)
    # 누끼 가장자리의 검은 띠를 피하기 위해 색을 알파와 먼저 곱한다.
    arr[:,:,:3] *= arr[:,:,3:]/255
    srcx, srctop = head_centre(reference), box(reference)[1]
    centres = [head_centre(f) for f in running]
    # 한 칸만 튀는 머리 위치는 원형 5칸 중앙값으로 정리한다.
    anchors = [round(float(np.median([centres[(i+j)%49] for j in (-2,-1,0,1,2)]))) for i in range(49)]
    output, records = [], []
    for i, body in enumerate(running):
        top = box(body)[1]
        dx, dy = anchors[i]-srcx, top-srctop
        placed = warp(arr, shift(-dx,-dy), body.size)
        xx = np.arange(body.width)-anchors[i]
        boundary = top+np.interp(xx, XS, CUTS[look])
        yy = np.arange(body.height)[:,None]
        weight = np.clip((boundary[None,:]-yy)/3,0,1).astype(np.float32)
        original = np.asarray(body).astype(np.float32)
        premul = original.copy()
        premul[:,:,:3] *= premul[:,:,3:]/255
        mixed = premul*(1-weight[:,:,None])+placed*weight[:,:,None]
        alpha = mixed[:,:,3:]
        mixed[:,:,:3] = np.divide(mixed[:,:,:3]*255,alpha,out=np.zeros_like(mixed[:,:,:3]),where=alpha>0)
        out = np.clip(np.rint(mixed),0,255).astype(np.uint8)
        # 경계 밖은 RGB의 반올림이나 투명 픽셀조차 바뀌지 않는다.
        out[weight==0] = np.asarray(body)[weight==0]
        result = Image.fromarray(out)
        rb = box(result)
        assert rb[1] == top and rb[3] == box(body)[3], (look,i,rb)
        # 알파가 있는 얼굴의 중심부는 원본 픽셀과 완전히 같아야 한다.
        face = (weight==1)&(placed[:,:,3]>200)&(yy<top+38)
        check = placed.copy()
        check[:,:,:3] = np.divide(check[:,:,:3]*255,check[:,:,3:],out=np.zeros_like(check[:,:,:3]),where=check[:,:,3:]>0)
        expected = np.clip(np.rint(check),0,255).astype(np.uint8)
        assert np.array_equal(out[face],expected[face]), (look,i,'얼굴 픽셀 변경')
        records.append({'frame':i,'translation':[dx,dy],'scale':1,'face_identical_pixels':int(face.sum()),
                        'body_identical_pixels':int((weight==0).sum()),'neck_blend_px':3})
        output.append(result)
    return output, records


def build(look, cfg, args):
    dest = args.output/look
    dest.mkdir(parents=True, exist_ok=True)
    base = ROOT/'images/characters'/look/'motion'
    walkpath, runpath = base/'walk.webp', base/'run.webp'
    backup = dest/'before-run.webp'
    if not backup.exists():
        shutil.copy2(runpath,backup)
    walking, running = cells(walkpath), cells(backup)
    reference_index = cfg['idle']
    reference = walking[reference_index]
    reference.save(dest/'walking-head-reference.png')
    output, records = lock_faces(look, reference, running)
    save_sheet(output,dest/'run.webp')
    contact(output,dest/'contact.png')
    report = {'look':look,'method':'sprite-gen.video.face_layer.warp, integer translation, premultiplied neck blend',
              'walking_reference_frame':reference_index,'walking_sha256':digest(walkpath),
              'before_run_sha256':digest(backup),'after_run_sha256':digest(dest/'run.webp'),
              'head_scale':1,'cut_x':XS,'cut_y':CUTS[look],
              'frames':records,'output':metrics(output),'walking':metrics(walking)}
    (dest/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    if args.apply:
        shutil.copy2(dest/'run.webp',runpath)
        record_lock(look,reference_index,records,walkpath,runpath)
    print(f'{look}: 얼굴 49칸 동일, 키 {report["output"]["height_min"]}~{report["output"]["height_max"]}',flush=True)
    return report, (walking,running,output)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--sprite-gen',type=Path,required=True)
    ap.add_argument('--output',type=Path,default=ROOT/'artifacts/face-match-update-20261028')
    ap.add_argument('--looks',nargs='*')
    ap.add_argument('--apply',action='store_true')
    args = ap.parse_args()
    sys.path.insert(0,str(args.sprite_gen.resolve()))
    args.output.mkdir(parents=True,exist_ok=True)
    config = read_config(ROOT/'js/data/heromotion.js')
    reports, sequences = [], {}
    for look in args.looks or config:
        report, seq = build(look,config[look],args)
        reports.append(report)
        sequences[look] = seq
    (args.output/'report.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding='utf-8')
    preview(list(sequences),sequences,args.output/'face-comparison.png')


if __name__ == '__main__':
    main()
