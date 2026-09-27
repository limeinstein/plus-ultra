import numpy as np, json, math
from scipy import ndimage
from cities_src import CITIES
m=np.load('mask.npy'); ocean=np.load('ocean.npy')
H,W=m.shape
def px(lon,lat): return ((lon+180)/360*W, (90-lat)/180*H)
def ll(x,y): return (x/W*360-180, 90-y/H*180)
# distance transform to get nearest ocean pixel indices
dist_o, (iy_o, ix_o) = ndimage.distance_transform_edt(~ocean, return_indices=True)
dist_l, (iy_l, ix_l) = ndimage.distance_transform_edt(~m, return_indices=True)
out=[]; warn=[]
for c in CITIES:
    cid,name,lat,lon,port=c[0],c[1],c[2],c[3],c[4]
    x,y=px(lon,lat); xi,yi=int(x)%W,int(min(H-1,max(0,y)))
    # land position
    if m[yi,xi]: lx,ly=xi,yi
    else: lx,ly=ix_l[yi,xi],iy_l[yi,xi]
    dland=math.hypot(lx-xi,ly-yi)
    rec={'id':cid,'land':[round(ll(lx+0.5,ly+0.5)[0],3),round(ll(lx+0.5,ly+0.5)[1],3)]}
    if port:
        ox,oy=ix_o[ly,lx],iy_o[ly,lx]
        dd=math.hypot(ox-lx,oy-ly)
        # push dock one px further into water away from land for safety
        vx,vy=ox-lx,oy-ly; n=math.hypot(vx,vy) or 1
        ox2,oy2=int(round(ox+vx/n*1.0)),int(round(oy+vy/n*1.0))
        if 0<=oy2<H and ocean[oy2,ox2%W]: ox,oy=ox2%W,oy2
        rec['dock']=[round(ll(ox+0.5,oy+0.5)[0],3),round(ll(ox+0.5,oy+0.5)[1],3)]
        if dd>6: warn.append((cid,name,'dock far',round(dd,1)))
    if dland>3: warn.append((cid,name,'land moved',round(dland,1)))
    out.append(rec)
json.dump(out,open('city_snap.json','w'))
for w in warn: print(w)
print(len(out))
