import json, os
from multiprocessing import Pool
import numpy as np
from PIL import Image
IMG='/home/claude/pu_full/images/'
D=json.load(open('scan.json'))
L=[r['f'] for r in D['files'] if r.get('transp',0)>0.2 and (r['f'].startswith(('portraits/','maid-styles/','characters/','street-folk/','items/','relics/','goods/','figureheads/','foods/','landmarks/'))) and not r['f'].endswith('.gif')]
def one(f):
    try:
        a=np.asarray(Image.open(IMG+f).convert('RGBA'))[:,:,3]
        h,w=a.shape
        top=float((a[0]>200).mean()); left=float((a[:,0]>200).mean()); right=float((a[:,-1]>200).mean()); bot=float((a[-1]>200).mean())
        # 위쪽 2% 줄에 불투명이 얼마나
        top2=float((a[:max(1,h//50)]>200).mean())
        return [f,round(top,3),round(left,3),round(right,3),round(bot,3),round(top2,3),w,h]
    except Exception as e: return [f,'err',str(e)]
with Pool(2) as p: R=p.map(one,L,chunksize=50)
json.dump(R,open('edges.json','w'))
print(len(R))
