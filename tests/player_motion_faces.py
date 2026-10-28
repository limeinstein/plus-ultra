#!/usr/bin/env python3
"""게임에 실린 686칸의 머리·눈·코·입·턱이 걷기 원본 픽셀과 같은지 확인한다."""
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def frames(path):
    with Image.open(path) as im:
        sheet = im.convert('RGBA')
    w,h = sheet.width//7,sheet.height//7
    return [np.asarray(sheet.crop((i%7*w,i//7*h,(i%7+1)*w,(i//7+1)*h))) for i in range(49)]


manifest = json.loads((ROOT/'docs/art/player-motion-faces.json').read_text(encoding='utf-8'))['characters']
assert len(manifest)==14, '주인공 누락'
checked = pixels = 0
for look,record in manifest.items():
    base = ROOT/'images/characters'/look/'motion'
    for action in ('walk','run'):
        assert hashlib.sha256((base/f'{action}.webp').read_bytes()).hexdigest()==record[f'{action if action=="run" else "walking"}_sha256'], (look,action,'제작 원본 변경')
    walking,running = frames(base/'walk.webp'),frames(base/'run.webp')
    if 'run_head_width' in record:
        for i,frame in enumerate(running):
            ys0,xs0 = np.nonzero(frame[:,:,3]>40)
            yh,xh = np.nonzero(frame[ys0.min():ys0.min()+30,:,3]>40)
            assert xh.max()-xh.min()+1 == record['run_head_width'], (look,i,'달리기 머리 크기 변화')
    reference = walking[record['walking_reference_frame']]
    sy,sx = np.nonzero(reference[:,:,3]>40)
    top = sy.min()
    hy,hx = np.nonzero(reference[top:top+28,:,3]>40)
    cx = round((hx.min()+hx.max())/2)
    yy,xx = np.indices(reference.shape[:2])
    # 머리 상단 전체와 눈 아래~턱의 안쪽을 따로 비교한다. 합성 계산을
    # 다시 실행하지 않고, 원본 픽셀을 저장된 정수 좌표로 직접 대조한다.
    mask = ((yy>=top)&(yy<top+30)) | ((yy>=top+25)&(yy<top+record['face_bottom'])&(xx>=cx+2)&(xx<cx+20))
    mask &= reference[:,:,3]>40
    y,x = np.nonzero(mask)
    assert len(x)>500, (look,'얼굴 검사 영역 부족')
    for i,(dx,dy) in enumerate(record['translations']):
        assert np.array_equal(reference[y,x],running[i][y+dy,x+dx]), (look,i,'얼굴/머리 픽셀 불일치')
        checked += 1
        pixels += len(x)
print(f'14종 · {checked}칸 · 얼굴/머리 {pixels:,}픽셀: 걷기 원본과 완전히 일치')
