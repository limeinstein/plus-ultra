"""전용 지도 그림이 없는 자연 명소를 장소의 지형에 맞춰 Blender로 만든다."""
import json
import math
import random
import sys
from pathlib import Path

import bpy
from mathutils import Vector, noise

sys.path.insert(0,str(Path(__file__).resolve().parent))
from build_models import W, configure
from build_missing import detailed_materials


def materials(key):
    found=detailed_materials(key)
    for name,color,frequency,texture,roughness in (
        ('snow','E1E8E5',31,.19,.78), ('glacial','558C9D',20,.25,.44),
        ('water','368B8B',48,.28,.42), ('shallows','75A99A',40,.23,.54),
        ('foam','C3DCD2',62,.21,.58), ('lava','C46832',37,.35,.57),
        ('salt','DED3B5',38,.22,.83), ('sulfur','B7A44F',33,.28,.83),
    ):
        found[name]=W.B.material(name,color,frequency,texture,roughness)
    if key.startswith('sand'):
        tone='C88D59' if key=='sandred' else 'D3B47E'
        mat=W.B.material(key+' 사구 모래',tone,37,.23,.93)
        for node in mat.node_tree.nodes:
            if node.type=='BUMP':node.inputs['Distance'].default_value=.014
        found['sand']=mat
    return found


class NaturalModel(W.B.Model):
    def surface(self, vertices, faces, colors):
        start=len(self.vertices)
        first=len(self.faces)
        self.vertices.extend(vertices)
        self.faces.extend(tuple(i+start for i in face) for face in faces)
        for color in colors:
            if color not in self.keys:self.keys.append(color)
            self.shaders.append(self.keys.index(color))
        self.smooth=getattr(self,'smooth',[])+[range(first,len(self.faces))]

    def object(self, soften=False):
        obj=super().object(False)
        for strip in getattr(self,'smooth',[]):
            for i in strip:obj.data.polygons[i].use_smooth=True
        return obj


def field(x,y,seed,frequency):
    return noise.fractal(Vector((x*frequency,y*frequency,seed*.13)),1.03,2.06,3)


def s_curve(value):
    value=max(0,min(1,value))
    return value*value*(3-2*value)


def patch(m, x, y, rx, ry, seed, surface, material, rings=27, span=76):
    vertices=[]
    for j in range(rings+1):
        r=max(.001,j/rings)
        for i in range(span):
            a=math.tau*i/span
            edge=1+r**3*(.080*math.cos(5*a+seed)+.038*math.sin(9*a+seed*.4))
            px=x+rx*math.cos(a)*r*edge
            py=y+ry*math.sin(a)*r*edge
            vertices.append((px,py,surface(px,py,r,a)))
    faces,colors=[],[]
    for j in range(rings):
        for i in range(span):
            indices=(j*span+i,(j+1)*span+i,(j+1)*span+(i+1)%span,j*span+(i+1)%span)
            a,b,c,d=[Vector(vertices[k]) for k in indices]
            q=(a+b+c+d)/4
            normal=(b-a).cross(d-a).normalized()
            faces.append(indices)
            colors.append(material(q,normal))
    m.surface(vertices,faces,colors)


def peak_curve(x,y,pack):
    px,py,wx,wy,h,sharp=pack
    r=math.hypot((x-px)/wx,(y-py)/wy)
    return h*max(0,1-r)**sharp


def mountain(m, peaks, seed, snow=.91, tree=.29, rock=.58, table=False):
    def surface(x,y,r,a):
        primary=sorted((peak_curve(x,y,p) for p in peaks),reverse=True)
        amplitude=primary[0]+sum(primary[1:])*.20
        if table:
            shelf=1.21*s_curve((amplitude-.20)/.38)
            amplitude=shelf+amplitude*.17
        coarse=field(x,y,seed,2.6)
        groove=abs(field(x+.095*y,y*.72,seed+2,5.4))
        relief=amplitude*(1+coarse*.22-groove*.32)
        return max(0, (relief+(coarse*.105+.045)*(1-r)) * s_curve((1-r)*5))
    def shade(q,n):
        a=field(q.x,q.y,seed+7,3)
        if q.z+a*.14>snow and n.z>.27:return 'snow'
        if n.z<rock or q.z>tree+a*.08:return 'stone' if a<-.04 else 'wall'
        return 'leaf' if a<.11 else 'soil'
    patch(m,0,0,1.75,1.55,seed,surface,shade)


def volcano(m,seed,style):
    profiles={
        'baekdu':(1.51,.49,.54,.90), 'halla':(1.14,.30,.26,2.5),
        'aso':(.94,.67,.40,2.5), 'ngorongoro':(.67,.85,.28,3.2),
        'etna':(1.94,.21,.24,1.24), 'stromboli':(2.17,.16,.42,3), 'vesuvius':(1.55,.27,.19,2.1),
    }
    height,bowl,waterline,snow=profiles[style]
    def surface(x,y,r,a):
        angle=math.atan2(y+.08,x)
        t=math.hypot((x+.05)/1.64,(y-.06)/1.49)
        rim=bowl*(1+.09*math.cos(angle*4+seed))
        grit=field(x,y,seed,4.1)
        cone=height*max(0,1-t)**(1.25 if style=='halla' else 1.58)
        hollow=max(0,(rim-t)/rim)**.69*height*.84
        if style=='vesuvius':cone+=peak_curve(x,y,(.56,.44,1.32,1.08,.7,1.27))
        if style=='aso':cone+=peak_curve(x,y,(.05,.21,.60,.54,.64,1.3))
        slope=max(0,cone-hollow)
        if style not in ('etna','stromboli','vesuvius') and t<rim*.68:
            return waterline
        return max(0,(slope + grit*(.10+cone*.11))*s_curve((1-r)*5))
    def shade(q,n):
        t=math.hypot((q.x+.05)/1.64,(q.y-.06)/1.49)
        a=field(q.x,q.y,seed+1,5)
        inside=t<bowl*.80 and n.z>.74
        if abs(q.z-waterline)<.002 and inside:
            if style in ('baekdu','halla'):return 'glacial'
            if style=='aso' and math.hypot(q.x+.12,q.y-.16)<.26:return 'glacial'
            if style=='ngorongoro' and math.hypot((q.x+.13)*1.7,q.y+.23)<.35:return 'water'
            return 'leaf'
        if style=='stromboli' and inside:return 'lava'
        if q.z+a*.26>snow and n.z>.29:return 'snow'
        if n.z<.67 or q.z>height*.55:return 'stone' if a<.11 else 'wall'
        return 'soil' if style=='stromboli' else 'leaf'
    patch(m,0,0,1.78,1.57,seed,surface,shade)


def escarpment(m,seed,profiles):
    columns,styles=profiles
    for i,(x,y,h,rx,ry) in enumerate(columns):
        def profile(px,py,r,a):
            shelf=(1-r**7)*h
            edge=s_curve((1-r)*8)
            return max(0,shelf*edge+field(px,py,seed+i,5.3)*h*.16*edge)
        def shade(q,n):
            dark=field(q.x,q.y,seed+2,6.8)
            if styles=='basalt' and q.z<h*.80:return 'stone' if dark<.2 else 'wall'
            if q.z>h*.71 and n.z>.70 and styles!='limestone':return 'leaf' if dark<.18 else 'soil'
            return 'cut' if dark>.14 else 'wall'
        patch(m,x,y,rx,ry,seed+i,profile,shade,17,48)


def causeway(m):
    rng=random.Random(127)
    for i in range(13):
        for j in range(9):
            x=(i-6)*.22
            y=(j-4)*.198+(i%2)*.09
            if math.hypot(x/1.41,y/1.04)>1.06:continue
            h=max(.08,.145+j*.105 + rng.uniform(-.13,.15)+.15*math.sin(i*.65))
            r=.128+rng.uniform(-.018,.021)
            m.rings(x,y,[(0,r*1.03,r*1.06),(h*.73,r,r),(h,r*.93,r*.93)],6,
                    rng.choice(('stone','stone','wall','cut')),math.pi/6)


def dunes(m,seed,coastal=False):
    def surface(x,y,r,a):
        warp=field(x,y,seed,1.9)
        t=(1.46*x+y*3.75+.66*math.cos(x*1.9)+warp*.45)
        crest=max(0,.48+.52*math.sin(t))**(2.6 if coastal else 1.6)
        return max(0,(.055+(.66+warp*.23)*crest+.012*math.cos(9*t)) * s_curve((1-r)*3.5))
    patch(m,0,0,1.84,1.41,seed,surface,lambda q,n:'sand')


def foliage(m,x,y,z,scale,rng):
    trunk=.34*scale
    m.cylinder(x,y,z,.061*scale,trunk,'beam',7,.033*scale)
    for i in range(3):
        px=x+scale*.10*math.cos(i*2.3+rng.random())
        py=y+scale*.10*math.sin(i*2.3+rng.random())
        radius=scale*rng.uniform(.15,.23)
        base=z+trunk*(.73+i*.40)
        m.rings(px,py,[(base,radius*.55,radius*.52),(base+radius*.28,radius,radius*.84),
                      (base+radius*.88,radius*.72,radius*.60),(base+radius*1.29,radius*.32,radius*.38)],
                8,'leaflight' if i==2 and rng.random()<.45 else 'leaf',rng.random())
        if scale>.45:
            for a in (i*2.2+.58,i*2.2+2.8):
                bx=px+math.cos(a)*radius*.78
                by=py+math.sin(a)*radius*.70
                m.rings(bx,by,[(base+radius*.35,radius*.32,radius*.32),(base+radius*.54,radius*.52,radius*.49),
                               (base+radius*.94,radius*.21,radius*.28)],7,'leaf',a)


def forest(m,seed):
    rng=random.Random(seed)
    def surface(x,y,r,a):return max(0,(.16+.24*field(x,y,seed,2))*s_curve((1-r)*4))
    patch(m,0,0,1.69,1.45,seed,surface,lambda q,n:'soil' if q.z<.08 else 'leaf')
    for i in range(51):
        a=rng.random()*math.tau
        r=rng.uniform(.12,.91)
        x,y=1.62*r*math.cos(a),1.40*r*math.sin(a)
        if abs(x+.32*math.sin(y*3))<.17:continue
        foliage(m,x,y,surface(x,y,r,a),rng.uniform(.58,1.34),rng)


def karst(m,seed,needles):
    rng=random.Random(seed)
    count=43 if needles else 24
    for i in range(count):
        a=rng.random()*math.tau
        r=rng.uniform(.05,.99)
        x,y=1.61*r*math.cos(a),1.34*r*math.sin(a)
        h=rng.uniform(.29,1.52)*(1-r*.32)
        size=rng.uniform(.095,.24) if needles else rng.uniform(.17,.39)
        m.rings(x,y,[(0,size*1.18,size*1.28),(h*.23,size,size*.88),(h*.52,size*.79,size*.81),
                     (h*.85,size*.47,size*.50),(h,size*.105,size*.13)],rng.choice((5,6,7)),
                rng.choice(('stone','wall','wall','cut')),rng.random())
        if i%5==0:foliage(m,x+.17,y-.08,0,.55,rng)


def lake(m,seed,style):
    rng=random.Random(seed)
    rx,ry,offset,ground={'caspian':(.57,1.15,.19,'soil'),'aral':(.80,.88,.19,'soil'),
                         'galilee':(.74,.96,.22,'leaf'),'chad':(1.07,.72,.26,'leaf'),
                         'xihu':(1.06,.75,.22,'leaf'),'danakil':(.87,.76,.14,'salt') }[style]
    def ratio(x,y):
        a=math.atan2((y+.09)/ry,x/rx)
        return math.hypot(x/rx,(y+.09)/ry)/(1+.20*math.cos(a*3+seed)+.09*math.cos(a*5))
    def surface(x,y,r,a):
        t=ratio(x,y)
        swell=s_curve((t-.84)*2.26)
        hills=offset*(.75+.64*field(x,y,seed,2.0))
        return max(0,(.052+swell*hills)*s_curve((1-r)*4))
    def shade(q,n):
        t=ratio(q.x,q.y)
        if t<.85:return 'sulfur' if style=='danakil' and q.x<-.18 else 'water' if t<.72 else 'shallows'
        if t<.99:return 'salt' if style in ('aral','chad','danakil') else 'cut'
        if field(q.x,q.y,seed,5)<-.20:return 'wall'
        return ground
    patch(m,0,0,1.65,1.38,seed,surface,shade)
    if style in ('xihu','galilee','chad'):
        for j in range(15):
            a=j*math.tau/15
            x,y=rx*1.33*math.cos(a),ry*1.19*math.sin(a)
            r=math.hypot(x/1.65,y/1.38)
            if r<.91:foliage(m,x,y,surface(x,y,r,a),rng.uniform(.45,.72),rng)


def delta(m,seed,style):
    rng=random.Random(seed)
    def branch(x,y):
        return min(abs(x-(i-2)*(.12+max(0,.8-y)*.23)-math.sin(y*3+i)*.087) for i in range(5))
    def surface(x,y,r,a):
        return max(0,(.045+(.16+field(x,y,seed,2.9)*.04)*s_curve((branch(x,y)-.045)*8))*s_curve((1-r)*4))
    def shade(q,n):
        v=branch(q.x,q.y)
        return 'water' if v<.036 else 'shallows' if v<.075 else 'leaf' if field(q.x,q.y,seed,5)<.12 else 'soil'
    patch(m,0,0,1.79,1.34,seed,surface,shade,34,92)
    for i in range(31):
        x,y=rng.uniform(-1.46,1.46),rng.uniform(-1.05,1.05)
        r=math.hypot(x/1.79,y/1.34)
        if r<.86 and branch(x,y)>.092:foliage(m,x,y,surface(x,y,r,0),rng.uniform(.21,.51 if style=='sudd' else .70),rng)


def pools(m,seed,style):
    rng=random.Random(seed)
    tiers={'jiu':[(.10,.79,.51,.35,.73),(-.27,.32,.58,.34,.44),(.29,-.28,.72,.46,.19),(-.18,-.82,1.06,.42,.05)],
           'plitvice':[(.35,.80,.64,.36,.67),(-.35,.31,.72,.29,.46),(.21,-.27,.65,.34,.24),(-.22,-.72,.81,.42,.05)]}[style]
    for j,(x,y,rx,ry,z) in enumerate(tiers):
        def rock(px,py,r,a):
            shoulder=s_curve((r-.69)*6)
            return max(0,(z+.058+.17*shoulder+field(px,py,seed,4)*(.005+.085*shoulder))*s_curve((1-r)*7))
        def shade(q,n):
            r=math.hypot((q.x-x)/rx,(q.y-y)/ry)
            return 'water' if r<.68 else 'shallows' if r<.78 else 'cut' if r<.90 else 'wall'
        patch(m,x,y,rx*1.27,ry*1.18,seed+j,rock,shade,18,64)
        if j+1<len(tiers):
            nx,ny,nrx,nry,nz=tiers[j+1]
            ww=.16+rx*.19
            vertices=[]
            cols,rows=34,10
            for rr in range(rows+1):
                t=rr/rows
                for i in range(cols+1):
                    u=(i/cols)*2-1
                    yl=y-ry*.77+abs(u)**2*.10+(ny+nry*.37-y+ry*.77)*t
                    line=.016*math.sin(8*u+t*2)+.008*math.sin(27*u+t*8)
                    vertices.append((x+u*ww*(1+.22*t)+(nx-x)*.52*t,yl+line,z+.045+(nz-z)*t**.76+line))
            faces=[]
            colors=[]
            for rr in range(rows):
                for i in range(cols):
                    k=rr*(cols+1)+i
                    faces.append((k,k+1,k+cols+2,k+cols+1))
                    colors.append('foam' if rr>=rows-3 or math.sin(i*2.10+rr*.07)>.26 else 'shallows')
            m.surface(vertices,faces,colors)
            for i in range(16):
                u=rng.uniform(-.90,.90); a=x+(nx-x)*.49+u*ww
                yy=ny+nry*(.49+rng.uniform(-.10,.13))
                w=rng.uniform(.022,.058)
                m.rings(a,yy,[(nz+.058,w,w*.45),(nz+.072,w*.75,w*.32)],7,'foam',i)
        for i in range(10):
            a=i*math.tau/10+.35
            if math.sin(a)<-.31 and abs(math.cos(a))<.61:continue
            foliage(m,x+rx*.99*math.cos(a),y+ry*.96*math.sin(a),z*.79,rng.uniform(.29,.60),rng)


def fjord(m,seed):
    m.rings(0,0,[(.02,1.77,1.05),(.04,1.69,1.00)],36,'water')
    for sign in (-1,1):
        escarpment(m,seed+sign,([(sign*.88,.49,1.48,.66,.88),(sign*.99,-.49,1.11,.69,.62)],'basalt'))
    for i in range(4):
        y=.24+i*.15
        m.prism([(.49,y-.035,.95+i*.07),(.49,y+.033,.95+i*.07),(.38,y+.037,.082),(.36,y-.035,.082)],(0,0,.016),'foam')


def victoria(m):
    seed=101
    rng=random.Random(seed)
    def lip(x):return -.12+.10*math.sin(x*2.8)+.025*math.sin(x*6)
    def channel(x,y):
        middle=.10*math.sin(y*3.4)
        width=.73+.22*math.exp(-5*(y+.12)**2) if y>=-.2 else .33+.38*math.exp(-8*(y+.20)**2)
        return abs(x-middle)/width
    def surface(x,y,r,a):
        d=y-lip(x)
        shoulder=s_curve((channel(x,y)-.79)*4)
        shelf=s_curve((d+.16)/.31)
        uneven=(.08+shoulder*.24)*field(x,y,seed,4)
        lower=.12+shelf*.80+shoulder*(.09+.18*shelf)
        return max(0,(lower+uneven)*s_curve((1-r)*4.8))
    def shade(q,n):
        d=q.y-lip(q.x)
        t=channel(q.x,q.y)
        if t<.85:
            if -.16<d<.15:return 'foam' if math.sin(q.x*37+q.y*9)>.02 or d<-.09 else 'shallows'
            return 'water' if t<.73 else 'shallows'
        if q.z>.80 and n.z>.80:return 'leaf' if field(q.x,q.y,seed,8)<.23 else 'soil'
        layered=math.sin(q.z*31+q.x*2.3)+field(q.x,q.y,seed,9)*.65
        return 'stone' if layered>.30 else 'wall'
    patch(m,0,0,1.85,1.49,seed,surface,shade,45,110)
    for i in range(25):
        x,y=rng.uniform(-1.66,1.66),rng.uniform(-1.22,1.20)
        r=math.hypot(x/1.85,y/1.49)
        if r<.92 and channel(x,y)>1.17:
            foliage(m,x,y,surface(x,y,r,0),rng.uniform(.24,.53),rng)


def tidal(m,seed):
    def surface(x,y,r,a):
        x+=.23*math.cos(y*3.6)
        wave=math.exp(-((x+.12)*8)**2)*(.38+.14*math.cos(y*4))
        return (.055+wave+.018*math.sin(x*24+y*14))*s_curve((1-r)*6)
    def shade(q,n):return 'foam' if q.z>.30 and n.z>.47 else 'shallows' if q.z>.13 else 'water'
    patch(m,0,0,1.80,1.28,seed,surface,shade)


SNOWS={
 'mont':([(-.24,.35,1.35,1.31,2.24,1.16),(.64,.42,1.05,.90,1.40,.91),(-.80,-.36,.74,.66,.91,.98)],.60),
 'pamir':([(-.62,.32,1.52,1.31,1.64,.79),(.62,.42,1.23,1.03,1.47,.80),(.05,-.45,1.37,.79,1.13,.62)],.77),
 'ararat':([(-.38,.30,1.45,1.43,2.03,1.31),(.74,-.35,1.00,1.00,1.21,1.42)],.98),
 'rwenzori':([(-.51,.43,1.19,1.14,1.99,.80),(.51,.31,1.01,1.11,1.50,.85),(-.22,-.38,.98,.87,1.01,.85)],1.06),
 'elbrus':([(-.48,.19,1.28,1.35,1.75,.93),(.47,.30,1.24,1.29,1.61,.96)],.62),
 'dolomite':([(-.60,.25,1.06,1.07,1.89,.48),(.17,.48,.97,1.01,1.80,.51),(.77,-.27,.73,.79,1.40,.50)],1.52),
 'eiger':([(-.34,.35,1.13,1.47,2.12,.62),(.62,.44,.99,1.04,1.41,.79),(.39,-.62,.78,.77,.69,1.08)],1.31),
}

def alpine(m,key,seed):
    peaks,snow=SNOWS[key]
    mountain(m,peaks,seed,snow=snow,tree=.32,rock=.66)


RECIPES=[
 ('vesuvius','volcanic',lambda m:volcano(m,7,'vesuvius')),('xihu','lush',lambda m:lake(m,17,'xihu')),
 ('ds_377','lush',lambda m:pools(m,25,'jiu')),('ds_378','alpine',lambda m:volcano(m,30,'baekdu')),
 ('ds_379','alpine',lambda m:karst(m,37,False)),('ds_380','lush',lambda m:volcano(m,51,'halla')),
 ('ds_381','lush',lambda m:volcano(m,62,'aso')),('ds_385','sandred',lambda m:dunes(m,73,True)),
 ('ds_386','lush',lambda m:delta(m,86,'okavango')),('ds_387','lush',lambda m:volcano(m,97,'ngorongoro')),
 ('ds_388','basalt',victoria),
 ('ds_389','basalt',lambda m:mountain(m,[(-.07,.20,1.82,1.19,1.02,.73),(.7,.35,.91,.80,.57,1.2)],106,2.5,.41,.71,True)),
 ('ds_394','lush',lambda m:tidal(m,115)),('ds_396','alpine',lambda m:fjord(m,123)),
 ('ds_397','basalt',causeway),('ds_398','volcanic',lambda m:volcano(m,136,'etna')),
 ('ds_399','volcanic',lambda m:volcano(m,143,'stromboli')),('ds_400','alpine',lambda m:alpine(m,'mont',155)),
 ('ds_629','sandlight',lambda m:dunes(m,162)),('ds_631','alpine',lambda m:alpine(m,'pamir',169)),
 ('ds_632','sandlight',lambda m:lake(m,179,'caspian')),('ds_633','sandlight',lambda m:lake(m,186,'aral')),
 ('ds_635','alpine',lambda m:alpine(m,'ararat',192)),('ds_636','lush',lambda m:lake(m,200,'galilee')),
 ('ds_640','lush',lambda m:delta(m,213,'sudd')),('ds_641','sandlight',lambda m:lake(m,218,'chad')),
 ('ds_642','lush',lambda m:forest(m,220)),('ds_643','alpine',lambda m:alpine(m,'rwenzori',227)),
 ('ds_644','sandlight',lambda m:lake(m,239,'danakil')),('ds_645','alpine',lambda m:karst(m,241,True)),
 ('ds_646','basalt',lambda m:escarpment(m,253,([(-.69,.19,1.43,.93,.91),(.61,.45,1.63,1.03,.84),(.72,-.45,.71,.82,.52)],'basalt'))),
 ('ds_647','alpine',lambda m:alpine(m,'elbrus',262)),('ds_648','limestone',lambda m:alpine(m,'dolomite',269)),
 ('ds_649','basalt',lambda m:alpine(m,'eiger',278)),('ds_650','lush',lambda m:pools(m,286,'plitvice')),
]


def main():
    out=Path(sys.argv[sys.argv.index('--')+1]).resolve()
    configure(out,cell=416)
    W.B.materials=materials
    W.B.Model=NaturalModel
    W.METER=5.65
    W.RERENDER=next((arg.split('=',1)[1].split(',') for arg in sys.argv if arg.startswith('--rerender=')),[])
    for key,palette in {
        'alpine':'746E5E AAA697 616C66 7E8275 74917C', 'limestone':'98857A D1BB9C 69726E B3977E 82927A',
        'basalt':'60625D 949184 514F4A 7E796D 697C70', 'volcanic':'62564F A2937D 6D635A 8D6954 8B876C',
        'sandred':'B5794B E6AD70 8A624A C88454 A78156', 'sandlight':'AE8956 DDC191 958160 D4A975 8C8D71',
        'lush':'867C66 B9AA86 687253 928B68 7B8B6B',
    }.items():W.B.PALETTES[key]=tuple(palette.split())
    art={}
    for i in range(0,len(RECIPES),12):
        group=f'relief-{i//12+1}'
        parts=[(site,palette,1.0,0,build) for site,palette,build in RECIPES[i:i+12]]
        art.update({site:[group,*rect] for site,rect in W.make_atlas(group,parts).items()})
    (out/'blender-layout.json').write_text(json.dumps(art),encoding='utf-8')
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(out/'nature-landmarks.blend'),compress=True)


if __name__=='__main__':main()
