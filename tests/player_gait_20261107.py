#!/usr/bin/env python3
"""굽힌 무릎을 확대하지 않는 배율·발 교대·얼굴·원본 보존 회귀 검사."""
import hashlib,json,sys
from pathlib import Path
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from update_player_walk_loops import read_config,digest,box,cells,visible_hash
from match_player_motion_faces import head_centre
records=json.loads((ROOT/'docs/art/player-gait-20261107.json').read_text(encoding='utf8'))['clips']
cfg=read_config(ROOT/'js/data/heromotion.js');scales={};count=0
for r in records:
 look,motion=r['look'],r['motion'];c=r['clip'];base=ROOT/'images/characters'/look/'motion'
 assert c==cfg[look]['loops'][motion] and c['fixedScale'] and c['cycles']==1 and c['baseHeight']==300
 for name,sha in r['original_sha256'].items():assert digest(base/(name+'.webp'))==sha,(look,name,'기존 원본 변경')
 assert digest(base/f'stride_{motion}.webp')==r['output_sha256']
 stages=r['frame_stages'];assert stages==sorted(stages) and len(stages)==len(set(stages))
 assert set(range(8)).issubset(stages) and c['times']==c['pose']==[s/8 for s in stages]+[1]
 assert 8<=c['count']<=16 and len(c['times'])==c['count']+1
 im=Image.open(base/f'stride_{motion}.webp').convert('RGBA');w,h=r['cell'];assert h==360 and im.size==(w*c['cols'],h*c['rows'])
 frames=[im.crop((i%8*w,i//8*h,(i%8+1)*w,(i//8+1)*h)) for i in range(c['count'])]
 bb=[box(f) for f in frames];assert all(b[0]>2 and b[1]>2 and b[2]<w-2 and b[3]<h-2 for b in bb)
 assert c['lift']==[max(0,r['foot']+1-b[3]) for b in bb]
 assert all(visible_hash(f)!=visible_hash(frames[(i+1)%len(frames)]) for i,f in enumerate(frames))
 ref=cells(base/'walk.webp')[r['reference_frame']];ref_a=np.asarray(ref);top=box(ref)[1];cx=round(head_centre(ref))
 # 목과 머리카락의 윤곽을 피해 얼굴 중심 픽셀을 직접 대조한다.
 face=ref_a[top+10:top+29,cx-5:cx+8]
 for f in frames:
  a=np.asarray(f);y=box(f)[1];x=round(head_centre(f))
  # 대칭인 머리 윤곽의 중심 반올림은 1px 달라질 수 있다. 정수 이동만 허용한다.
  assert any(np.array_equal(face,a[y+10+dy:y+29+dy,x-5+dx:x+8+dx]) for dy in range(-1,2) for dx in range(-2,3)),(look,motion,'얼굴 배율·픽셀 변경')
 for k,t in enumerate(r['key_transforms']):
  assert t['scale']==r['scale'];f=frames[stages.index(float(k))];body=np.asarray(f)[t['cut']:]
  assert hashlib.sha256(body.tobytes()).hexdigest()==t['body_sha256'],(look,motion,k,'몸통 재확대·변형')
  if motion=='walk' or k not in (3,7):assert box(f)[3]==r['foot']+1,(look,motion,k,'접지')
 if motion=='run':
  for k in (3,7):assert c['lift'][stages.index(float(k))]>5,(look,'공중에서 두 발 들기')
 scales.setdefault(look,set()).add(r['scale']);count+=len(frames)
 print(f'{look}/{motion}: {len(frames)}칸 · 배율·얼굴·접지·순서 통과')
assert len(records)==28 and len(scales)==14 and all(len(s)==1 for s in scales.values())
print(f'14종 걷기·뛰기 {count}칸 검사 통과')
