#!/usr/bin/env python3
"""28개 순환 시트의 실제 픽셀·시간표·왕복 없는 순서·원본 보존을 검사한다."""
import sys, json
from pathlib import Path
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from repair_player_loops import distance, frame_hash
from update_player_walk_loops import digest, box, cells, read_config

if read_config(ROOT/'js/data/heromotion.js')['admiral']['loops']['walk'].get('fixedScale'):
 import runpy
 runpy.run_path(str(ROOT/'tests/player_gait_20261107.py'),run_name='__main__')
 raise SystemExit(0)

data=json.loads((ROOT/'docs/art/player-loop-20261106.json').read_text(encoding='utf-8'))['clips']
cfg=read_config(ROOT/'js/data/heromotion.js')
checked=0
for r in data:
 look,motion=r['look'],r['motion'];c=r['clip']
 base=ROOT/'images/characters'/look/'motion'
 assert digest(base/f'{motion}.webp')==r['source_sha256'],(look,motion,'원본 변경')
 assert digest(base/f'stride_{motion}.webp')==r['output_sha256'],(look,motion,'납품 해시 불일치')
 assert cfg[look]['loops'][motion]==c,(look,motion,'게임 시간표 불일치')
 assert c['times'][0]==0 and c['times'][-1]==1 and len(c['times'])==c['count']+1
 assert all(a<b for a,b in zip(c['times'],c['times'][1:])),(look,motion,'멈춘 시간 구간')
 assert c['pose'][0]==0 and c['pose'][-1]==c['cycles'] and all(a<b for a,b in zip(c['pose'],c['pose'][1:])),(look,motion,'발 교대 진행도')
 assert r['phases']==sorted(r['phases']),(look,motion,'발 동작 역순')
 image=Image.open(base/f'stride_{motion}.webp').convert('RGBA');w,h=r['cell']
 assert image.size==(w*c['cols'],h*c['rows'])
 frames=[image.crop((i%c['cols']*w,i//c['cols']*h,(i%c['cols']+1)*w,i//c['cols']*h+h)) for i in range(c['count'])]
 boxes=[box(f) for f in frames]
 assert all(b[0]>1 and b[1]>1 and b[2]<w-1 and b[3]==295 for b in boxes),(look,motion,'잘림·접지')
 heights=[b[3]-b[1] for b in boxes];assert max(heights)-min(heights)<=2,(look,motion,'크기 튐')
 assert all(frame_hash(f)!=frame_hash(frames[(i+1)%len(frames)]) for i,f in enumerate(frames)),(look,motion,'연속 중복·경계 정지')
 assert r['after']['seam']<r['before']['seam']*.7,(look,motion,'반복 경계 개선 부족')
 assert r['after']['speed_cv']<.35,(look,motion,'보행 속도 편차')
 assert not r['ghosts']
 checked+=len(frames)
 print(f'{look}/{motion}: {len(frames)}칸, 경계 {r["before"]["seam"]:.3f}→{r["after"]["seam"]:.3f}, 속도 편차 {r["after"]["speed_cv"]:.3f}')
assert len(data)==28
print(f'14종 × 두 동작 · {checked}칸 검사 통과')
