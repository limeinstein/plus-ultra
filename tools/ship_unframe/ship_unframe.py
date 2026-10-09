"""배 단면 그림(images/ships) 정리 — 액자 같은 흐린 테두리를 걷어 내고 화면을 채운다.
   · 깨끗한 그림 칸(clean)을 잘라, 배(돛대 꼭대기~선체 아래)가 잘리지 않는 만큼만 키운다
   · 위아래는 하늘 위·바다 아래 여유에서만 자르고, 모자라는 좌우·위아래는 가장자리 빛을 늘려(흐리게) 채운다"""
import numpy as np, json, os, sys
from PIL import Image, ImageFilter
S='/home/claude/shipsrc'; OUT='/home/claude/shipfix/out2'; os.makedirs(OUT,exist_ok=True)
W,H=880,480
contain=json.load(open('/home/claude/shipfix/contain.json')); spot=json.load(open('/home/claude/shipfix/spot.json'))
FULL={'lcaravel','baghlah','jong','tartane'}
OVR=json.load(open('/home/claude/shipfix/override.json')) if os.path.exists('/home/claude/shipfix/override.json') else {}
def clean_of(n):
    if n in OVR.get('clean',{}): return OVR['clean'][n]
    x0,y0,x1,y1=contain[n]
    if x0<=0:   # 위아래로 띠가 있는 긴 배(갤리 등): 띠 안쪽 가장자리만 조금 걷는다
        return [x0+20, y0+26, x1-20, y1-18]
    return [x0+(12 if x0<=0 else 20), y0+(12 if y0<=0 else 22), x1-(12 if x1>=W else 22), y1-(12 if y1>=H else 24)]
def stretch_fill(img, pl, pr, pt, pb):
    a=np.asarray(img).astype(float); h,w=a.shape[:2]
    e=np.pad(a,((pt,pb),(0,0),(0,0)),mode='symmetric')      # 위아래: 하늘·바다를 거울처럼 (돛대 끝은 그대로 이어져 보인다)
    e=np.pad(e,((0,0),(pl,pr),(0,0)),mode='edge')            # 좌우: 가장자리 빛을 가로로 늘린다 (바다·하늘 결)
    out=Image.fromarray(e.astype('uint8'))
    nh,nw=e.shape[:2]
    # 늘린 곳: 가로로 길게 흐려 바다·하늘 결처럼 보이게, 바깥으로 갈수록 더
    soft=out.filter(ImageFilter.GaussianBlur(5))
    xs=np.arange(nw); ys=np.arange(nh)
    dx=np.maximum(np.maximum(pl-xs,0)/max(pl,1), np.maximum(xs-(nw-pr-1),0)/max(pr,1))
    dy=np.maximum(np.maximum(pt-ys,0)/max(pt,1), np.maximum(ys-(nh-pb-1),0)/max(pb,1))
    m=np.clip(np.maximum(dx[None,:]*1.6,dy[:,None]*1.2),0,1)
    return Image.composite(soft,out,Image.fromarray((m*255).astype('uint8')))
def hblur(a, r):
    c=np.cumsum(np.pad(a,((0,0),(r+1,r),(0,0)),mode='edge'),axis=1)
    return (c[:,2*r+1:]-c[:,:-2*r-1])/(2*r+1)
def sky_sea_fill(img, pt, pb):
    """위·아래 모자란 띠: 하늘·바다를 거울처럼 이어 붙이고 가로로 길게 흐려 결만 남긴다 (돛 끝 같은 모양은 번져 사라진다)"""
    a=np.asarray(img).astype(float); h,w=a.shape[:2]
    e=np.pad(a,((pt,pb),(0,0),(0,0)),mode='symmetric')
    sm=hblur(e,28)
    nh=e.shape[0]; ys=np.arange(nh)
    t=np.maximum(np.clip((pt-ys)/10.0,0,1), np.clip((ys-(nh-pb-1))/10.0,0,1))[:,None,None]
    return Image.fromarray(np.clip(e*(1-t)+sm*t,0,255).astype('uint8'))
def process(n):
    src=Image.open(f'{S}/cutaway/{n}.png').convert('RGB'); k=src.size[0]/W
    if n in FULL: return src.resize((W,H),Image.LANCZOS),{'s':1.0,'ox':0.0,'oy':0.0}
    cx0,cy0,cx1,cy1=clean_of(n); cw,ch=cx1-cx0,cy1-cy0
    sp=spot[n]
    # 배에서 꼭 보여야 하는 곳 (옛 그림 좌표): 돛대 꼭대기 조금 위 ~ 선체 아래 물결, 선실 칸 양끝
    tn=sp['mast'][1]-18; bn=sp['hull'][3]+18; ln=sp['hull'][0]-10; rn=sp['hull'][2]+10
    s=max(W/cw,H/ch)                                              # 화면을 가득 (넘치는 쪽만 자른다)
    if cw/ch > W/H: s=min(s, W/cw*1.12)                          # 가로로 긴 그림은 양끝을 조금만
    s=min(s, H/max(1,bn-tn), W/max(1,rn-ln)); s=max(s, min(W/cw,H/ch))
    crop=src.crop((round(cx0*k),round(cy0*k),round(cx1*k),round(cy1*k)))
    nw,nh=round(cw*s),round(ch*s); img=crop.resize((nw,nh),Image.LANCZOS)
    def win(size, full, lo, hi):          # 창 시작: 가운데 두되 [lo,hi]가 들어가게
        if size>=full: return 0
        st=round((full-size)/2); st=min(st, lo); st=max(st, hi-size); return int(min(max(0,st), full-size))
    left=win(W,nw,(ln-cx0)*s,(rn-cx0)*s); top=win(H,nh,(tn-cy0)*s,(bn-cy0)*s)
    img=img.crop((left,top,left+min(W,nw),top+min(H,nh))); ox=-left; oy=-top
    pl=(W-img.size[0])//2 if img.size[0]<W else 0; pr=W-img.size[0]-pl if img.size[0]<W else 0
    pt=(H-img.size[1])//2 if img.size[1]<H else 0; pb=H-img.size[1]-pt if img.size[1]<H else 0
    if pt or pb: img=sky_sea_fill(img,pt,pb); oy+=pt
    if pl or pr: img=stretch_fill(img,pl,pr,0,0); ox+=pl
    return img,{'s':round(s,5),'ox':round(ox-cx0*s,2),'oy':round(oy-cy0*s,2),'win':[left,top],'pad':[pl,pr,pt,pb]}
if __name__=='__main__':
    names=[n for n in sorted(spot) if n!='barca']
    tf={}
    for n in names:
        img,t=process(n); tf[n]=t; img.save(f'{OUT}/{n}.webp','WEBP',quality=90,method=6)
        print(n.ljust(12), t)
    json.dump(tf,open('/home/claude/shipfix/transform.json','w'),indent=0)
