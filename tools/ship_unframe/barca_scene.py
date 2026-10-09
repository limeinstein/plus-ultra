"""바르카 단면 그림은 검은 바탕에 떠 있어서, 같은 배의 외관 원본(투명 배경)으로 배 모양을 따 리스본 앞바다(images/backgrounds/0)에 앉혔다.
   images/_extra/cabin-screen-src/ships/barca.png(외관, 투명) 의 돛 부분을 단면 그림에서 찾아 크기·자리를 맞추고, 그 투명도를 단면 그림에 씌운다."""
import cv2, numpy as np
from PIL import Image, ImageFilter
X='images/_extra/cabin-screen-src'
src=cv2.imread(X+'/ships/barca.png',cv2.IMREAD_UNCHANGED); cut=cv2.imread(X+'/cutaway/barca.png')
Hc,Wc=cut.shape[:2]; a=src[:,:,3]; ys,xs=np.where(a>128)
rgb=(src[:,:,:3].astype(float)*(a[:,:,None]/255.)).astype(np.uint8)
x0,y0,x1,y1=xs.min(),ys.min(),xs.max(),ys.max()
ty0,ty1=y0+int((y1-y0)*0.05),y0+int((y1-y0)*0.5); tx0,tx1=x0+int((x1-x0)*0.3),x0+int((x1-x0)*0.8)
tmpl=cv2.cvtColor(rgb[ty0:ty1,tx0:tx1],cv2.COLOR_BGR2GRAY); g=cv2.cvtColor(cut,cv2.COLOR_BGR2GRAY); best=None
for sc in np.arange(0.8,1.3,0.02):
    t=cv2.resize(tmpl,None,fx=sc,fy=sc); r=cv2.matchTemplate(g,t,cv2.TM_CCOEFF_NORMED); _,mx,_,loc=cv2.minMaxLoc(r)
    if best is None or mx>best[0]: best=(mx,sc,loc)
_,sc,(lx,ly)=best; ox,oy=int(round(lx-tx0*sc)),int(round(ly-ty0*sc))
A=cv2.resize(a,None,fx=sc,fy=sc); M=np.zeros((Hc,Wc),np.uint8)
ya0,xa0=max(0,oy),max(0,ox); ya1,xa1=min(Hc,oy+A.shape[0]),min(Wc,ox+A.shape[1])
M[ya0:ya1,xa0:xa1]=A[ya0-oy:ya1-oy,xa0-ox:xa1-ox]
cutI=Image.fromarray(cv2.cvtColor(cut,cv2.COLOR_BGR2RGB)); AI=Image.fromarray(M)
bg=Image.open('images/backgrounds/0.jpg').convert('RGB').crop((300,0,1311,551)).resize((Wc,Hc),Image.LANCZOS)
arr=np.asarray(bg).astype(float)/255*np.array([1.04,0.99,0.90])
yy,xx=np.mgrid[0:Hc,0:Wc]; glow=np.clip(1-np.sqrt((xx/Wc-0.15)**2+(yy/Hc-0.1)**2)*1.6,0,1)[...,None]*0.35
arr=np.clip(arr*(1-glow)+np.array([0.98,0.80,0.55])*glow,0,1); scene=Image.fromarray((arr*255).astype('uint8'))
ybot=np.where(M.max(1)>128)[0].max()
refl=Image.new('RGB',cutI.size); rm=Image.new('L',cutI.size,0)
refl.paste(cutI.transpose(Image.FLIP_TOP_BOTTOM),(0,ybot*2-Hc-6)); rm.paste(AI.transpose(Image.FLIP_TOP_BOTTOM),(0,ybot*2-Hc-6))
fade=np.clip(1-(np.arange(Hc)-ybot)/120.0,0,1); fade[:ybot]=0
scene=Image.composite(refl.filter(ImageFilter.GaussianBlur(3)),scene,Image.fromarray((np.asarray(rm).astype(float)*fade[:,None]*0.28).astype('uint8')))
scene=Image.composite(cutI,scene,AI.filter(ImageFilter.GaussianBlur(1.2)))
scene.resize((880,480),Image.LANCZOS).save('images/ships/barca.webp','WEBP',quality=90,method=6)
print('ok')
