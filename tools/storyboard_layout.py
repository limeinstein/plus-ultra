"""검은 칸막이가 있는 생성 원화에서 행마다 다른 실제 칸 경계를 읽는다."""
from pathlib import Path
from itertools import combinations
import numpy as np
from PIL import Image, ImageDraw

def runs(values):
    indexes=np.flatnonzero(values)
    return np.split(indexes,np.where(np.diff(indexes)>1)[0]+1) if len(indexes) else []

def separators(rgb, axis):
    dark=(rgb.max(axis=2)<48)
    light=(rgb.min(axis=2)>200)&(np.ptp(rgb.astype(np.int16),axis=2)<45)
    coverage=np.maximum(dark.mean(axis=axis),light.mean(axis=axis))
    length=len(coverage)
    found=[]
    for group in runs(coverage>.97):
        if 1<=len(group)<=length*.035 and group[0]>length*.08 and group[-1]<length*.92:
            item=(int(group[0]),int(group[-1])+1)
            # 같은 두꺼운 선의 명암·압축 잡음 때문에 양쪽 테두리가 따로 잡히는 경우를 합친다.
            if found and item[0]-found[-1][1]<length*.008:
                found[-1]=(found[-1][0],item[1])
            else:found.append(item)
    return found

def boxes(path):
    with Image.open(path) as image: rgb=np.asarray(image.convert('RGB'))
    h,w=rgb.shape[:2]
    # 첫 행의 칸막이가 갈색이어서 단색선 검사로 잡히지 않는 원화다.
    if Path(path).stem=='sigiriya' and (w,h)==(1448,1086):
        ys=[0,246,529,798,1086];xs=[0,361,724,1087,1448]
        return [(xs[j]+3,ys[i]+3,xs[j+1]-3,ys[i+1]-3) for i in range(4) for j in range(4)]
    # 이 원화는 구분선 없이 5·5·5·4칸으로 그려졌다. 원본을 보고 잰 경계다.
    if Path(path).stem=='stbasil' and (w,h)==(1448,1086):
        ys=[0,273,545,815,1086]
        rows=[[0,290,580,869,1160,1448]]*3+[[0,377,725,1075,1448]]
        return [(xs[j]+3,ys[i]+3,xs[j+1]-3,ys[i+1]-3) for i,xs in enumerate(rows) for j in range(len(xs)-1)]
    ys=separators(rgb,1)
    if not 1<=len(ys)<=5: return []
    if len(ys)>3:
        ys=list(min(combinations(ys,3),key=lambda items:sum(abs((a+b)/2-h*(i+1)/4) for i,(a,b) in enumerate(items))))
    result=[]
    ybounds=[(0,0)]+ys+[(h,h)]
    for i in range(len(ybounds)-1):
        top,bottom=ybounds[i][1],ybounds[i+1][0]
        row=rgb[top+3:bottom-3]
        xs=separators(row,0)
        if len(xs)>6:return []
        xbounds=[(0,0)]+xs+[(w,w)]
        for j in range(len(xbounds)-1):
            left,right=xbounds[j][1],xbounds[j+1][0]
            if right-left<w*.10:return []
            result.append((left+3,top+3,right-3,bottom-3))
    return result

def cells(path, fallback=4):
    """칸막이를 찾을 수 없는 기존 정규 시트만 고정 4×4로 읽는다."""
    with Image.open(path) as raw:
        src=raw.convert('RGBA')
        src=Image.alpha_composite(Image.new('RGBA',src.size,(244,236,216,255)),src).convert('RGB')
    layout=boxes(path)
    if not layout:
        layout=[(round(x*src.width/fallback)+3,round(y*src.height/fallback)+3,
                 round((x+1)*src.width/fallback)-3,round((y+1)*src.height/fallback)-3)
                for y in range(fallback) for x in range(fallback)]
    return [src.crop(box) for box in layout]

def durations(count,total=9820):
    unit=(total//count//10)*10
    return [unit]*(count-1)+[total-unit*(count-1)]

if __name__=='__main__':
    import json
    root=Path(__file__).resolve().parents[1]
    qa=json.loads((root/'docs/qa/asset-qa-2026-10-31.json').read_text(encoding='utf-8'))
    rows=[]
    for item in qa['items']:
        if item['area']!='discoveries' or item['issue']!='glitch':continue
        did=Path(item['file']).stem
        source=root/'tools/ruin_gifs/v3/master'/f'{did}.png'
        if not source.exists():
            found=list((root/'tools').glob(f'**/{did}.png'))
            source=next((f for f in found if 'source' in str(f)),found[0] if found else source)
        cells=boxes(source) if source.exists() else []
        rows.append(dict(id=did,source=str(source.relative_to(root)),count=len(cells),boxes=cells))
    out=root/'tools/asset_qa_20261031/storyboards.json';out.write_text(json.dumps(rows,indent=2),encoding='utf-8')
    print([(r['id'],r['count']) for r in rows])
    selected=[r for r in rows if r['count']!=16]
    contact=Image.new('RGB',(1200,((len(selected)+4)//5)*200),'#333333');draw=ImageDraw.Draw(contact)
    for i,row in enumerate(selected):
        path=root/row['source']
        if not path.exists():continue
        with Image.open(path) as im:
            im=im.convert('RGB');im.thumbnail((235,170))
        x,y=i%5*240,i//5*200
        contact.paste(im,(x,y));draw.text((x,y+172),row['id']+' '+str(row['count']),fill='white')
    contact.save(root/'tools/asset_qa_20261031/storyboards-before.jpg')
