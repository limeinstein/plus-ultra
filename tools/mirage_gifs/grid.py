"""생성 원화의 실제 패널 경계를 찾아 이웃 장면이 섞이지 않게 자른다."""
from pathlib import Path
import math
import numpy as np
from PIL import Image


def axis_cuts(pixels, axis, count):
    length=pixels.shape[axis]
    differences=np.abs(np.diff(pixels,axis=axis)).mean(axis=(1,2) if axis==0 else (0,2))
    edges=np.convolve(differences,np.ones(3)/3,mode='same')
    baseline=max(1,float(np.median(edges)))
    cuts=[0]
    quality=[]
    radius=round(length*(.025 if axis==1 else .085))
    for i in range(1,count):
        target=round(length*i/count)
        lo=max(cuts[-1]+round(length/count*.45),target-radius)
        hi=min(length-1,target+radius)
        at=lo+int(np.argmax(edges[lo:hi]))
        cuts.append(at+1)
        quality.append(math.log1p(float(edges[at])/baseline))
    cuts.append(length)
    return cuts,sum(quality)/len(quality)


def layout(path):
    with Image.open(path) as raw:
        source=Image.alpha_composite(Image.new('RGBA',raw.size,(244,236,216,255)),raw.convert('RGBA')).convert('RGB')
    pixels=np.asarray(source,dtype=np.float32)
    choices=[]
    # 세로 경계는 정확한 등분 위치에 있으므로 먼저 열 수를 판정한다.
    for columns in (4,5):
        xs,xq=axis_cuts(pixels,1,columns)
        choices.append((xq,columns,xs))
    xq,columns,xs=max(choices)
    rows=4 if columns==4 else 3
    ys,yq=axis_cuts(pixels,0,rows)
    row_x=[]
    for row in range(rows):
        if columns==4:
            row_x.append(xs)
        else:
            # 일부 16칸 원화는 5칸·5칸·6칸으로 나뉜다. 각 행을 따로 읽는다.
            band=pixels[ys[row]+3:ys[row+1]-3]
            candidates=[]
            for count in (5,6):
                cuts,quality=axis_cuts(band,1,count)
                candidates.append((quality,cuts))
            row_x.append(max(candidates)[1])
    return source,{'columns':columns,'rows':rows,'x':xs,'y':ys,'row_x':row_x,'cells':sum(len(x)-1 for x in row_x),'quality':round(xq+yq,3)}


def cells(path,fit):
    source,grid=layout(path)
    frames=[]
    for y in range(grid['rows']):
        cuts=grid['row_x'][y]
        for x in range(len(cuts)-1):
            # 2px 안쪽을 써서 경계의 흐린 픽셀까지 이웃 그림에서 분리한다.
            box=(cuts[x]+2,grid['y'][y]+2,cuts[x+1]-2,grid['y'][y+1]-2)
            frames.append(fit(source.crop(box)))
    if len(frames)==15:
        # 원화가 15칸이면 조사도가 옅게 나타나는 도입을 더해 기존 16프레임 시간표에 맞춘다.
        frames.insert(0,Image.blend(Image.new('RGB',frames[0].size,(244,236,216)),frames[0],.40))
    if len(frames)!=16:
        raise ValueError(f'16프레임으로 변환할 수 없는 원화: {Path(path).name}')
    return frames
