"""생성 원화의 얇은 구분선을 따라 4×4 장면을 잘라 기존 GIF 규격에 맞춘다."""
from PIL import Image


def bounds(im, axis, expected=4):
    """칸 너비가 조금 달라도 흰 구분선 중심을 찾는다. 선이 검으면 등분을 쓴다."""
    w,h=im.size
    length, cross=(w,h) if axis=='x' else (h,w)
    samples=range(max(2,cross//20),cross-max(2,cross//20),4)
    pixels=im.load()
    cuts=[0]
    for i in range(1,expected):
        center=round(length*i/expected)
        candidates=[]
        for p in range(max(1,center-round(length*.08)),min(length-1,center+round(length*.08))):
            whites=sum(min(pixels[p,q] if axis=='x' else pixels[q,p])>=210 for q in samples)
            if whites >= len(samples)*.85: candidates.append(p)
        runs=[]
        for p in candidates:
            if not runs or p>runs[-1][-1]+1: runs.append([p])
            else: runs[-1].append(p)
        mids=[round(sum(run)/len(run)) for run in runs if len(run)>=2]
        cuts.append(min(mids,key=lambda p:abs(p-center)) if mids else center)
    cuts.append(length)
    return cuts


def cells(path,fit):
    with Image.open(path) as src: im=src.convert('RGB')
    ys=bounds(im,'y')
    result=[]
    for row in range(4):
        band=im.crop((0,ys[row]+2,im.width,ys[row+1]-2))
        xs=bounds(band,'x')
        for col in range(4):
            result.append(fit(band.crop((xs[col]+2,0,xs[col+1]-2,band.height))))
    return result
