"""여성 제독 일기토 원화의 투명 여백만 읽어서 확인한다. 사건샷은 불투명하다."""
import json
from pathlib import Path
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
pending=[]
for p in sorted((ROOT/'art_sources/hero-women-20261124/raw').glob('*.png')):
    if p.stem.endswith('_alpha') or '_cutin' in p.stem:continue
    chosen=p.with_stem(p.stem+'_alpha')
    if not chosen.exists():chosen=p
    a=np.asarray(Image.open(chosen).convert('RGBA'))[:,:,3]
    samples=[int(a[round(r*a.shape[0]/4)+3,round(c*a.shape[1]/6)+3]) for r in range(4) for c in range(6)]
    if np.median(samples)>12:pending.append(p.stem)
out=ROOT/'artifacts/hero-women-20261124';out.mkdir(parents=True,exist_ok=True)
(out/'alpha-pending.json').write_text(json.dumps(pending,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(pending,ensure_ascii=False))
