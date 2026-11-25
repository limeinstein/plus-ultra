"""첨부 PDF의 형태 특징을 참고한 독립 Blender 시안. 본편 파일을 바꾸지 않는다."""
import bpy, math, random, os, json
from mathutils import Vector, noise

OUT=os.path.dirname(os.path.abspath(__file__))
TAU=math.tau
def clamp(x,a=0,b=1): return max(a,min(b,x))
def smooth(a,b,x):
    t=clamp((x-a)/(b-a)); return t*t*(3-2*t)
def nv(x,y,z=1): return noise.noise_vector(Vector((x,y,z)))[0]
def fb(x,y,z=1): return noise.fractal(Vector((x,y,z)),1,2,4)

def mat(name,a,b,scale=2.0,rough=.85,bump=.12):
    m=bpy.data.materials.new(name); m.use_nodes=True; m.diffuse_color=(*a,1)
    nt=m.node_tree; p=nt.nodes.get('Principled BSDF'); p.inputs['Roughness'].default_value=rough
    coord=nt.nodes.new('ShaderNodeTexCoord'); tex=nt.nodes.new('ShaderNodeTexNoise')
    tex.inputs['Scale'].default_value=scale; tex.inputs['Detail'].default_value=4; tex.inputs['Roughness'].default_value=.72
    nt.links.new(coord.outputs['Object'],tex.inputs['Vector'])
    ramp=nt.nodes.new('ShaderNodeValToRGB'); ramp.color_ramp.elements[0].position=.18; ramp.color_ramp.elements[0].color=(*a,1)
    ramp.color_ramp.elements[1].position=.82; ramp.color_ramp.elements[1].color=(*b,1)
    nt.links.new(tex.outputs['Fac'],ramp.inputs[0]); nt.links.new(ramp.outputs[0],p.inputs['Base Color'])
    bn=nt.nodes.new('ShaderNodeBump'); bn.inputs['Strength'].default_value=.38; bn.inputs['Distance'].default_value=bump
    fine=nt.nodes.new('ShaderNodeTexNoise'); fine.inputs['Scale'].default_value=scale*9; fine.inputs['Detail'].default_value=3
    nt.links.new(coord.outputs['Object'],fine.inputs[0]); nt.links.new(fine.outputs['Fac'],bn.inputs['Height']); nt.links.new(bn.outputs[0],p.inputs['Normal'])
    return m

def mesh(name,vs,fs,mats=None):
    me=bpy.data.meshes.new(name); me.from_pydata(vs,[],fs); me.update()
    o=bpy.data.objects.new(name,me); bpy.context.collection.objects.link(o)
    for m in mats or []: me.materials.append(m)
    return o

def cylinder_between(vs,fs,ids,a,b,r1,r2,mi=0,sides=7):
    a,b=Vector(a),Vector(b); axis=(b-a).normalized(); u=axis.cross(Vector((0,0,1)))
    if u.length<.1: u=axis.cross(Vector((0,1,0)))
    u.normalize(); v=axis.cross(u); start=len(vs)
    for p,r in [(a,r1),(b,r2)]:
        for k in range(sides): vs.append(tuple(p+r*(u*math.cos(k*TAU/sides)+v*math.sin(k*TAU/sides))))
    for k in range(sides): fs.append((start+k,start+(k+1)%sides,start+(k+1)%sides+sides,start+k+sides)); ids.append(mi)
    fs.append(tuple(start+sides+k for k in range(sides))); ids.append(mi)

def make_tree(kind,seed,bark,leaves):
    rng=random.Random(seed); vs=[]; fs=[]; mids=[]
    cylinder_between(vs,fs,mids,(0,0,0),(.035,.02,1.7),.085,.025,0,8)
    if kind=='pine':
        for level in range(11):
            z=.30+level*.145; radius=.58*(1-level/13)
            for k in range(7):
                a=k*TAU/7+level*.46+rng.uniform(-.15,.15)
                end=(math.cos(a)*radius,math.sin(a)*radius,z-.10)
                cylinder_between(vs,fs,mids,(0,0,z+.10),end,.018,.004,0,5)
                for sub in range(3):
                    dist=(sub+1)/3
                    cx,cy=end[0]*dist,end[1]*dist
                    w=.17*(1-dist*.4)*(1-level/15)
                    start=len(vs)
                    for j in range(9):
                        t=j/8; rr=(.09+.07*math.sin(j*2.3))*(1-t*.4)
                        vs.append((cx+math.cos(a)*(.23*t-.09)-math.sin(a)*rr,cy+math.sin(a)*(.23*t-.09)+math.cos(a)*rr,z+.035*(1-t)))
                        vs.append((cx+math.cos(a)*(.23*t-.09)+math.sin(a)*rr,cy+math.sin(a)*(.23*t-.09)-math.cos(a)*rr,z+.035*(1-t)))
                    for j in range(8): fs.append((start+j*2,start+j*2+1,start+j*2+3,start+j*2+2)); mids.append(1+rng.randrange(len(leaves)))
    else:
        # 가지를 드러내고 개별 잎을 겹쳐 불규칙한 수관을 만든다.
        for k in range(12):
            a=k*2.399; r=rng.uniform(.22,.52); z=rng.uniform(1.0,1.65)
            end=(math.cos(a)*r,math.sin(a)*r,z)
            cylinder_between(vs,fs,mids,(.02,0,.65),end,.028,.007,0,6)
        for k in range(42):
            a=rng.uniform(0,TAU); rr=math.sqrt(rng.random())*.58
            cx,cy=math.cos(a)*rr,math.sin(a)*rr
            cz=1.35+.42*(1-rr/.7)+rng.uniform(-.18,.18)
            sz=rng.uniform(.15,.28)
            for leaf_index in range(46):
                th=rng.uniform(0,TAU); zz=rng.uniform(-1,1); rad=sz*rng.random()**.33
                rr=math.sqrt(1-zz*zz)
                c=Vector((cx+math.cos(th)*rr*rad,cy+math.sin(th)*rr*rad,cz+zz*rad*.75))
                a=rng.uniform(0,TAU); tilt=rng.uniform(-.65,.65)
                u=Vector((math.cos(a),math.sin(a),tilt)).normalized()*rng.uniform(.055,.09)
                v=Vector((-math.sin(a),math.cos(a),rng.uniform(-.8,.8))).normalized()*rng.uniform(.022,.039)
                start=len(vs); vs.extend([tuple(c-u),tuple(c+v),tuple(c+u),tuple(c-v),tuple(c+Vector((0,0,.012)))])
                mi=1+rng.randrange(len(leaves))
                for q in range(4):fs.append((start+q,start+(q+1)%4,start+4)); mids.append(mi)
    o=mesh('수목 원형 '+kind+str(seed),vs,fs,[bark]+leaves)
    for f,mi in zip(o.data.polygons,mids): f.material_index=mi; f.use_smooth=kind!='pine'
    o.hide_render=True; o.hide_viewport=True
    return o

def instance(src,name,loc,scale,rz=0):
    o=bpy.data.objects.new(name,src.data); bpy.context.collection.objects.link(o); o.location=loc; o.scale=scale; o.rotation_euler[2]=rz; return o

def make_palm(seed,bark,leaves):
    rng=random.Random(seed); vs=[]; fs=[]; ids=[]
    cylinder_between(vs,fs,ids,(0,0,0),(.12,.04,2.05),.065,.035,0,8)
    for k in range(11):
        a=k*TAU/11; length=rng.uniform(.72,1.05)
        for j in range(9):
            t=j/9; x=.12+math.cos(a)*length*t; y=.04+math.sin(a)*length*t; z=2.05+.25*math.sin(t*math.pi)-.30*t*t
            for side in [-1,1]:
                w=.19*math.sin((t+.1)*math.pi)*side; i=len(vs)
                vs.extend([(x,y,z),(x-math.sin(a)*w+math.cos(a)*.11,y+math.cos(a)*w+math.sin(a)*.11,z-.06),(x+math.cos(a)*.16,y+math.sin(a)*.16,z-.02)])
                fs.append((i,i+1,i+2)); ids.append(1+rng.randrange(len(leaves)))
    o=mesh('야자수 원형',vs,fs,[bark]+leaves)
    for f,mi in zip(o.data.polygons,ids): f.material_index=mi
    o.hide_render=True; o.hide_viewport=True; return o

def make_cliff(x,y,h,sx,sy,seed,rock,height):
    rng=random.Random(seed); sides=14; vs=[]; fs=[]; base=height(x,y)-.2
    outlines=[rng.uniform(.78,1.12) for _ in range(sides)]
    levels=[(0,1.15),(.10,1.06),(.30,.94),(.49,.93),(.52,1.01),(.72,.85),(.88,.80),(1,.65)]
    for j,(z,r) in enumerate(levels):
        for k in range(sides):
            a=k*TAU/sides; rough=1+.065*math.sin(k*7.1+j*1.3)
            vs.append((x+math.cos(a)*sx*r*outlines[k]*rough+.12*z,y+math.sin(a)*sy*r*outlines[k]*rough,base+h*z+(rng.uniform(-.12,.12) if j else 0)))
    for j in range(len(levels)-1):
        for k in range(sides): fs.append((j*sides+k,j*sides+(k+1)%sides,(j+1)*sides+(k+1)%sides,(j+1)*sides+k))
    fs.append(tuple((len(levels)-1)*sides+k for k in range(sides)))
    o=mesh('세로 균열과 층리가 있는 암벽',vs,fs,[rock])
    bevel=o.modifiers.new('풍화된 모서리','BEVEL'); bevel.width=.055; bevel.segments=2
    o.modifiers.new('암벽 면의 법선','WEIGHTED_NORMAL')
    return o

def boat(x,y,size,wood,cloth):
    vs=[]; fs=[]; rings=[(-1.45,.04),(-1.18,.30),(-.6,.43),(.4,.42),(1.05,.28),(1.40,.015)]
    for yy,w in rings:
        for xx,z in [(-w,.34),(-w*.8,.05),(0,-.13),(w*.8,.05),(w,.34)]: vs.append((xx,yy,z))
    for j in range(len(rings)-1):
        for k in range(4): fs.append((j*5+k,(j+1)*5+k,(j+1)*5+k+1,j*5+k+1))
    fs.append(tuple(list(range(0,30,5))+list(range(29,0,-5))))
    o=mesh('수로 크기 비교용 범선',vs,fs,[wood]); o.location=(x,y,.08); o.scale=(size,)*3
    vs=[]; fs=[]; ids=[]
    cylinder_between(vs,fs,ids,(0,-.15,.35),(0,-.15,2.5),.038,.018,0,7)
    cylinder_between(vs,fs,ids,(-.68,-.15,2.2),(.68,-.15,2.2),.025,.025,0,6)
    cylinder_between(vs,fs,ids,(0,.65,.3),(0,.65,1.7),.025,.012,0,6)
    m=mesh('돛대와 활대',vs,fs,[wood]); m.location=o.location; m.scale=o.scale
    vs=[]; fs=[]
    for j in range(9):
        v=j/8
        for i in range(11):
            u=i/10; w=.68*(.78+.22*v)
            vs.append(((u-.5)*2*w,-.15+.24*math.sin(u*math.pi)*math.sin(v*math.pi),.82+v*1.40))
    for j in range(8):
        for i in range(10): a=j*11+i; fs.append((a,a+1,a+12,a+11))
    m=mesh('바람을 받은 돛',vs,fs,[cloth]); m.location=o.location; m.scale=o.scale
    for f in m.data.polygons:f.use_smooth=True

