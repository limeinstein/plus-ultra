"""블렌더에서 도시별 쌍둥이 탑·돔·성채와 실제 게임 시설을 조립하고 투명 시안을 렌더한다."""
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Quaternion, Vector

OUT = Path(__file__).resolve().parents[2] / 'artifacts/city-icons-large-20261126'
TAU = math.tau
PALETTES = {
    'paris': ('BFAF91', 'DACCAB', '3C4C5B', '854939', '954C40'),
    'rome': ('BB835D', 'CABB9C', '975538', 'A05236', '6D7946'),
    'istanbul': ('BA816C', 'DAC6AA', '4E626A', '835440', '4C6E67'),
    'london': ('AFA48C', 'D7CDB3', '37474E', '744B3A', '854638'),
    'seville': ('CF9A61', 'E8DAB7', 'A45C45', '98533B', '407466'),
}
SIZES = {1: (42, 52), 2: (56, 70), 3: (112, 132)}
TARGET = Vector((0,-.12,1.03))
CAMERA_POS = TARGET+Vector((6,-9,10.9))
CAMERA_ROT = (TARGET-CAMERA_POS).to_track_quat('-Z','Y')
VARIANTS = [
    ('a', 1, '한 길 소도시'),
    ('b', 2, '장터 중도시'),
    ('c', 3, '광장 중심'),
    ('d', 3, '대로 중심'),
    ('e', 3, '엇갈린 골목'),
]


def linear(h):
    rgb = [int(h[i:i+2], 16)/255 for i in (0, 2, 4)]
    return tuple(x/12.92 if x <= .04045 else ((x+.055)/1.055)**2.4 for x in rgb)


def material(name, hex_code, freq=13, texture=.21, rough=.78, masonry=False):
    old = bpy.data.materials.get(name)
    if old:
        return old
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*linear(hex_code), 1)
    m.use_nodes = True
    n, links = m.node_tree.nodes, m.node_tree.links
    shader = n.get('Principled BSDF')
    shader.inputs['Roughness'].default_value = rough
    tex = n.new('ShaderNodeTexCoord')
    noise = n.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = freq
    noise.inputs['Detail'].default_value = 2.0
    links.new(tex.outputs['Object'], noise.inputs['Vector'])
    ramp = n.new('ShaderNodeValToRGB')
    for el, quantity in zip(ramp.color_ramp.elements, (1-texture, 1+texture*.75)):
        el.color = (*[min(1, x*quantity) for x in linear(hex_code)], 1)
    links.new(noise.outputs['Fac'], ramp.inputs['Fac'])
    color = ramp.outputs['Color']
    if masonry:
        coords = n.new('ShaderNodeSeparateXYZ')
        links.new(tex.outputs['Object'], coords.inputs[0])
        across = n.new('ShaderNodeMath')
        across.operation = 'ADD'
        links.new(coords.outputs['X'], across.inputs[0])
        links.new(coords.outputs['Y'], across.inputs[1])
        uv = n.new('ShaderNodeCombineXYZ')
        links.new(across.outputs[0], uv.inputs['X'])
        links.new(coords.outputs['Z'], uv.inputs['Y'])
        bricks = n.new('ShaderNodeTexBrick')
        links.new(uv.outputs[0], bricks.inputs['Vector'])
        bricks.inputs['Scale'].default_value = 1
        bricks.inputs['Brick Width'].default_value = .29
        bricks.inputs['Row Height'].default_value = .139
        bricks.inputs['Mortar Size'].default_value = .011
        bricks.inputs['Mortar Smooth'].default_value = .006
        tone = linear(hex_code)
        for socket, shade in (('Color1', 1.048), ('Color2', .887), ('Mortar', .75)):
            bricks.inputs[socket].default_value = (*[min(1, c*shade) for c in tone], 1)
        blend = n.new('ShaderNodeMixRGB')
        blend.inputs[0].default_value = .64
        links.new(color, blend.inputs[1])
        links.new(bricks.outputs['Color'], blend.inputs[2])
        color = blend.outputs[0]
    links.new(color, shader.inputs['Base Color'])
    bump = n.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = .24 if rough > .5 else .17
    bump.inputs['Distance'].default_value = .056 if rough > .5 else .035
    links.new(noise.outputs['Fac'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], shader.inputs['Normal'])
    return m


def materials(key):
    wall, cut, roof, tile, sign = PALETTES[key]
    local = {
        'wall': (wall, 14, .24, .82), 'cut': (cut, 16, .18, .8),
        'roof': (roof, 20, .25, .79), 'tile': (tile, 21, .21, .76),
        'sign': (sign, 12, .18, .72),
    }
    common = {
        'dark': ('342E2B', 13, .15, .95), 'beam': ('5C4432', 18, .21, .86),
        'wood': ('A47D52', 26, .26, .86), 'stone': ('9B927D', 22, .27, .9),
        'cream': ('EADBC0', 25, .19, .87), 'lead': ('65777D', 17, .22, .63),
        'copper': ('647E6D', 18, .19, .71), 'glass': ('344F5C', 10, .15, .54),
        'metal': ('C4A162', 17, .15, .53), 'leadseam': ('4B5B5F', 16, .19, .66),
        'soil': ('8C6D4D', 15, .23, .9), 'leaf': ('697449', 13, .27, .88),
        'leaflight': ('8F975C', 18, .24, .86), 'cloth': ('ECE0BC', 24, .18, .9),
    }
    return {**{k: material(k, *v, masonry=k=='stone') for k, v in common.items()},
            **{k: material(f'{key} {k}', *v, masonry=k in ('wall','cut')) for k, v in local.items()}}


class Model:
    def __init__(self, collection, name, mats, x=0, y=0, z=0, angle=0, scale=1):
        self.collection, self.name, self.mats = collection, name, mats
        self.origin, self.angle, self.scale = (x, y, z), angle, scale
        self.vertices, self.faces, self.shaders, self.keys = [], [], [], []

    def geometry(self, verts, faces, mat):
        if mat not in self.keys:
            self.keys.append(mat)
        offset = len(self.vertices)
        self.vertices.extend(verts)
        self.faces.extend(tuple(i+offset for i in face) for face in faces)
        self.shaders.extend([self.keys.index(mat)]*len(faces))

    def prism(self, p, direction, mat):
        length = len(p)
        verts = list(p) + [tuple(a+b for a, b in zip(v, direction)) for v in p]
        faces = [tuple(reversed(range(length))), tuple(range(length, length*2))]
        faces += [(i, (i+1)%length, (i+1)%length+length, i+length) for i in range(length)]
        self.geometry(verts, faces, mat)

    def box(self, x, y, z, w, d, h, mat):
        self.prism([(x-w/2,y-d/2,z), (x+w/2,y-d/2,z), (x+w/2,y+d/2,z), (x-w/2,y+d/2,z)], (0,0,h), mat)

    def rings(self, x, y, rings, n, mat, offset=0):
        p = [(x+a*math.cos(i*TAU/n+offset), y+b*math.sin(i*TAU/n+offset), z)
             for z, a, b in rings for i in range(n)]
        f = [tuple(reversed(range(n)))]
        for j in range(len(rings)-1):
            f.extend((j*n+i, j*n+(i+1)%n, (j+1)*n+(i+1)%n, (j+1)*n+i) for i in range(n))
        f.append(tuple(range(len(p)-n, len(p))))
        self.geometry(p, f, mat)

    def cylinder(self,x,y,z,r,h,mat,n=12,rt=None):
        t = r if rt is None else rt
        self.rings(x,y,[(z,r,r),(z+h,t,t)],n,mat,math.pi/n)

    def beam(self, a, b, r, mat):
        dr = Vector(b)-Vector(a)
        u = dr.cross(Vector((0,0,1)))
        if u.length < .0001:
            u = Vector((1,0,0))
        u = u.normalized()*r
        v = dr.cross(u).normalized()*r
        p = [tuple(Vector(a)+u*i+v*j) for i,j in ((-1,-1),(1,-1),(1,1),(-1,1))]
        self.prism(p, dr, mat)

    def arch(self, x, y, z, w, h, mat='dark', point=False, line=False, side=False):
        r = w/2
        shoulder = h-r*(1.45 if point else 1)
        p = [(-r,0),(r,0)] + [(r*math.cos(t*math.pi/8), shoulder+(h-shoulder)*math.sin(t*math.pi/8)**(1.5 if point else 1)) for t in range(9)]
        def at(a,b): return (x,y+a,z+b) if side else (x+a,y,z+b)
        p = [at(a,b) for a,b in p]
        self.prism(p, (.024,0,0) if side else (0,-.024,0), mat)
        if line:
            for a,b in zip(p[1:],p[2:]+p[:1]):
                self.beam(a,b,.023,'cut')

    def roof(self, x, y, z, w, d, h, color='roof', gable='wall', ridge='y'):
        def at(a,b,c): return (x+b,y+a,c) if ridge == 'x' else (x+a,y+b,c)
        t = [at(-w/2,-d/2,z), at(w/2,-d/2,z), at(0,-d/2,z+h)]
        self.prism(t, (d,0,0) if ridge == 'x' else (0,d,0), gable)
        w, d = w+.15, d+.17
        for sign in (-1,1):
            p = [at(0,-d/2,z+h+.03), at(sign*w/2,-d/2,z+.025),
                 at(sign*w/2,d/2,z+.025), at(0,d/2,z+h+.03)]
            self.prism(p, (0,0,.055), color)
            steps = max(4, int(w*4))
            for j in range(1,steps):
                f = j/steps
                self.beam(at(sign*w/2*f,-d/2,z+h*(1-f)+.079), at(sign*w/2*f,d/2,z+h*(1-f)+.079), .011, color)
            self.beam(p[1],p[2],.028,'beam')
        self.beam(at(0,-d/2,z+h+.103),at(0,d/2,z+h+.103),.032,color)

    def hip(self,x,y,z,w,d,h,mat='roof'):
        self.prism([(x-w/2,y-d/2,z),(x+w/2,y-d/2,z),(x+w/2,y+d/2,z),(x-w/2,y+d/2,z)],(0,0,.055),mat)
        v = [(x-w/2,y-d/2,z+.035),(x+w/2,y-d/2,z+.035),(x+w/2,y+d/2,z+.035),(x-w/2,y+d/2,z+.035),
             (x-w*.28,y-d*.26,z+h),(x+w*.28,y-d*.26,z+h),(x+w*.28,y+d*.26,z+h),(x-w*.28,y+d*.26,z+h)]
        self.geometry(v,[(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(4,5,6,7)],mat)

    def object(self, soften=False):
        mesh = bpy.data.meshes.new(self.name)
        mesh.from_pydata(self.vertices,[],self.faces)
        mesh.update()
        obj = bpy.data.objects.new(self.name,mesh)
        obj.location, obj.rotation_euler.z, obj.scale = self.origin, self.angle, (self.scale,)*3
        self.collection.objects.link(obj)
        for key in self.keys:
            mesh.materials.append(self.mats[key])
        for p, i in zip(mesh.polygons,self.shaders):
            p.material_index = i
        if soften:
            mod = obj.modifiers.new('모서리 마모', 'BEVEL')
            mod.width, mod.segments = .021, 2
        return obj


def crenels(m,x,y,z,w,d,mat='cut'):
    m.box(x,y,z,w+.13,d+.13,.13,mat)
    for s in (-1,1):
        for i in range(5):
            m.box(x+w*(i/4-.5),y+s*d/2,z+.09,.15,.16,.2,mat)
        for i in range(1,4):
            m.box(x+s*w/2,y+d*(i/4-.5),z+.09,.16,.15,.2,mat)


def dome(m,x,y,z,r,h,mat='lead'):
    rings = [(z+h*math.sin(i*math.pi/32), r*math.cos(i*math.pi/32), r*math.cos(i*math.pi/32)) for i in range(16)]
    rings.append((z+h,r*.018,r*.018))
    m.rings(x,y,rings,64,mat)
    if r>.56:
        for i in range(18):
            a=i*TAU/18
            line=[(x+(r1+.007)*math.cos(a),y+(r2+.007)*math.sin(a),zz+.002) for zz,r1,r2 in rings]
            for start,end in zip(line,line[1:]):
                m.beam(start,end,.008,'leadseam')


def nor(m):
    m.box(0,.45,0,2.28,2.65,1.74,'wall')
    m.box(0,.65,.18,3.02,2.62,.92,'wall')
    m.roof(0,.55,1.75,2.35,2.61,.69)
    m.box(0,-1.0,0,2.74,.9,2.53,'cut')
    for x in (-.91,.91):
        m.box(x,-.99,2.08,.83,.88,1.13,'cut')
        m.box(x,-.99,3.19,.91,.96,.12,'wall')
        for side in (-1,1):
            m.box(x+side*.42,-.99,3.28,.08,.9,.14,'cut')
            m.box(x,-.99+side*.43,3.28,.87,.08,.14,'cut')
        for dx in (-.17,.16):
            m.arch(x+dx,-1.452,2.49,.225,.6,'dark',True,True)
            for z in (2.57,2.65,2.73,2.81,2.89):
                m.box(x+dx,-1.48,z,.142,.033,.023,'beam')
        m.arch(x+math.copysign(.42,x),-1.01,2.46,.31,.63,'dark',True,False,True)
    for x in (-.89,0,.89):
        w=.53 if x else .64
        m.arch(x,-1.463,.047,w+.13,.9,'wall',True,True)
        m.arch(x,-1.493,.061,w,.81,'dark',True,True)
        m.box(x,-1.528,.02,w+.08,.17,.054,'cut')
        for side in (-1,1):
            m.cylinder(x+side*w*.52,-1.51,.07,.034,.54,'cut',8)
    for x in (-1.32,-.48,.48,1.32):
        m.box(x,-1.439,.06,.09,.13,2.42,'wall')
        m.box(x,-1.477,1.24,.14,.11,.11,'cut')
        m.arch(x,-1.485,1.37,.1,.29,'stone',True,True)
    m.box(0,-1.47,1.03,2.77,.11,.18,'wall')
    for j in range(18):
        x=(j-8.5)*.144
        m.arch(x,-1.54,1.061,.112,.202,'stone',True,True)
        m.cylinder(x,-1.568,1.07,.027,.105,'cut',7)
        m.cylinder(x,-1.568,1.17,.026,.041,'cut',7,.014)
    circle = [(math.cos(i*TAU/24)*.33,-1.465,1.96+math.sin(i*TAU/24)*.33) for i in range(24)]
    m.prism(circle,(0,-.04,0),'glass')
    for i in range(24):
        a,b=circle[i],circle[(i+1)%24]
        m.beam(a,b,.031,'cut')
        if i%2==0:
            m.beam((0,-1.519,1.96),(a[0],-1.519,a[2]),.011,'cut')
    m.box(0,-1.452,2.37,2.7,.135,.079,'cut')
    for j in range(14):
        m.arch((j-6.5)*.106,-1.477,2.39,.077,.15,'dark',True)
    for s in (-1,1):
        for yy in (-.34,.18,.72,1.24):
            m.box(s*1.51,yy,0,.15,.17,1.21,'cut')
            m.beam((s*1.51,yy,1.03),(s*1.44,yy,1.37),.059,'cut')
            m.beam((s*1.44,yy,1.37),(s*1.12,yy,1.78),.059,'cut')
            m.cylinder(s*1.51,yy,1.21,.115,.215,'cut',6,.012)
        for yy in (-.14,.45,1.05,1.52):
            m.arch(s*1.151,yy,1.12,.24,.48,'glass',True,False,True)


def colosseum(m):
    # 바깥 벽의 끊어진 부분과 낮은 안쪽 고리가 함께 읽히게 한다.
    n = 36
    c = lambda i,z,a,b: (a*math.cos(i*TAU/n), b*math.sin(i*TAU/n), z)
    m.rings(0,0,[(-.01,1.78,1.38),(.09,1.78,1.38)],40,'stone')
    m.rings(0,0,[(.094,.78,.5),(.12,.81,.53)],32,'soil')
    for i in range(n):
        high = 4 if i >= 26 or i < 11 else 3 if i < 15 or i >= 23 else 2
        for level in range(high):
            z = .11+level*.59
            a,b = 1.77-level*.027,1.35-level*.024
            mat = 'cut' if level%2==0 else 'wall'
            m.prism([c(i,z,a,b),c(i+.26,z,a,b),c(i+.26,z,a-.26,b-.25),c(i,z,a-.26,b-.25)],(0,0,.59),mat)
            m.prism([c(i,z+.43,a,b),c(i+1,z+.43,a,b),c(i+1,z+.43,a-.26,b-.25),c(i,z+.43,a-.26,b-.25)],(0,0,.17),mat)
            if level == 3:
                m.prism([c(i+.25,z,a,b),c(i+1,z,a,b),c(i+1,z,a-.26,b-.25),c(i+.25,z,a-.26,b-.25)],(0,0,.48),mat)
            else:
                for t in range(3):
                    j = i+.24+t*.124
                    low = z+.29+t*.055
                    for k in (j,i+1-(j-i)-.124):
                        m.prism([c(k,low,a,b),c(k+.124,low,a,b),c(k+.124,low,a-.25,b-.24),c(k,low,a-.25,b-.24)],(0,0,z+.5-low),mat)
                cx,cy,_=c(i+.13,z,a+.023,b+.022)
                m.cylinder(cx,cy,z+.014,.041,.425,'cut',9,.039)
                m.cylinder(cx,cy,z+.417,.056,.047,'cut',10)
                m.cylinder(cx,cy,z+.006,.052,.043,'wall',10)
            m.beam(c(i,z+.56,a+.02,b+.02),c(i+1,z+.56,a+.02,b+.02),.032,'cut')
        for k in range(4):
            a,b = .76+k*.194,.53+k*.174
            z=.13+k*.133
            m.prism([c(i,z,a,b),c(i+1,z,a,b),c(i+1,z,a+.21,b+.18),c(i,z,a+.21,b+.18)],(0,0,.107),'wall' if k%2 else 'stone')


def sophia(m):
    m.box(0,0,0,2.82,2.72,1.3,'wall')
    m.box(0,0,1.21,2.36,2.46,.47,'cut')
    m.box(0,0,1.64,2.06,2.05,.34,'wall')
    m.cylinder(0,0,1.91,1.035,.21,'cut',32)
    dome(m,0,0,2.11,1.08,.65)
    for s in (-1,1):
        m.box(0,s*1.29,.05,1.94,.82,1.37,'wall')
        dome(m,0,s*1.11,1.4,.88,.58)
        for x in (-.78,.78):
            m.box(x,s*1.25,0,.3,.55,1.32,'cut')
            dome(m,x,s*1.32,1.3,.29,.28)
        for y in (-.83,.83):
            m.box(s*1.4,y,0,.43,.3,1.65,'wall')
            m.hip(s*1.4,y,1.65,.46,.34,.12,'lead')
            m.box(s*1.56,y,0,.23,.4,.38,'cut')
        for z,n in ((.35,4),(.87,5),(1.42,3)):
            for j in range(n):
                m.arch((j-(n-1)/2)*.332,s*1.73,z,.145,.255,'dark',line=True)
                m.arch(s*1.425,(j-(n-1)/2)*.35,z,.153,.25,'dark',line=True,side=True)
        for z in (.31,1.06,1.51):
            m.box(0,s*1.426,z,2.52,.083,.046,'cut')
            m.box(s*1.427,0,z,.083,2.36,.046,'cut')
    for i in range(28):
        a=i*TAU/28
        m.beam((1.044*math.cos(a),1.044*math.sin(a),1.95),(1.044*math.cos(a),1.044*math.sin(a),2.067),.027,'dark')
    m.box(-1.28,-1.25,0,.43,.44,1.57,'cut')
    m.cylinder(-1.28,-1.25,1.47,.082,1.66,'beam',10,.059)
    m.cylinder(-1.28,-1.25,2.61,.123,.075,'wood',12)
    m.cylinder(-1.28,-1.25,3.1,.097,.31,'lead',12,.006)
    m.cylinder(0,0,2.75,.029,.122,'metal',9,.008)


def london_tower(m):
    m.box(0,0,0,2.55,2.18,.15,'stone')
    m.box(0,0,.11,2.17,1.94,2.28,'cut')
    m.hip(0,0,2.34,2.09,1.88,.23)
    crenels(m,0,0,2.4,2.12,1.93)
    for x in (-.99,.99):
        for y in (-.87,.87):
            if x>0 and y>0:
                m.cylinder(x,y,.06,.32,2.59,'cut')
                m.cylinder(x,y,2.63,.356,.16,'wall')
                m.cylinder(x,y,2.78,.32,.54,'roof',12,.016)
            else:
                m.box(x,y,.05,.51,.54,2.63,'cut')
                m.box(x,y,2.68,.59,.61,.1,'wall')
                m.hip(x,y,2.78,.58,.6,.36)
            m.arch(x,y-.282,2.19,.136,.27)
    for z in (.39,1.03,1.67):
        m.box(0,0,z-.08,2.19,1.969,.069,'wall')
        for x in (-.58,0,.58):
            m.arch(x,-.989,z,.219,.38,'dark',False,True)
            m.arch(1.097,x,z,.185,.34,'dark',False,True,True)
            m.box(x,-1.013,z+.014,.273,.096,.046,'wall')
            m.box(1.122,x,z+.011,.096,.225,.042,'wall')
    for sign in (-1,1):
        for i in range(13):
            z=.17+i*.163
            shift=.03 if i%2 else .068
            m.box(sign*(1.068-shift),-.982,z,.156,.051,.102,'wall')
            m.box(1.088,sign*(.95-shift),z,.052,.155,.102,'wall')
    m.cylinder(.25,.95,.08,.54,1.24,'cut',24)
    m.hip(-.25,-1.27,.61,.78,.73,.23)
    m.box(-.25,-1.27,0,.71,.71,.59,'wall')
    m.arch(-.25,-1.639,.045,.32,.47)


def giralda(m):
    m.box(.28,.28,0,2.45,2.32,1.21,'cut')
    m.roof(.27,.41,1.2,2.24,2.01,.4,'tile',ridge='x')
    m.box(.28,-.8,0,2.31,.54,.9,'wall')
    m.roof(.29,-.78,.9,2.3,.52,.25,'tile',ridge='x')
    m.box(-.96,-.65,0,.79,.83,2.86,'wall')
    m.box(-.96,-.65,2.85,.9,.92,.12,'cut')
    for s in (-1,1):
        m.box(-.96+s*.352,-.65,2.96,.148,.91,.16,'wall')
        m.box(-.96,-.65+s*.37,2.96,.91,.148,.16,'wall')
    for z in (.7,1.16,1.62,2.08):
        m.arch(-.96,-1.08,z,.29,.34,'dark',True,True)
        m.arch(-.552,-.65,z,.27,.32,'dark',True,True,True)
        m.box(-.96,-1.123,z+.023,.026,.045,.199,'cut')
        m.box(-.515,-.65,z+.026,.048,.025,.19,'cut')
    for x in (-1.243,-.689):
        for i in range(8):
            z=.47+i*.253
            p=[(x,-1.098,z),(x+.061,-1.098,z+.111),(x,-1.098,z+.229),(x-.061,-1.098,z+.111)]
            q=[(-.537,y+.315,z1) for (y,_,z1) in p]
            for ring in (p,q):
                for a,b in zip(ring,ring[1:]+ring[:1]):
                    m.beam(a,b,.012,'cut')
    for x in (-1.334,-.585):
        m.box(x,-1.087,.33,.035,.055,2.37,'wall')
    for z in (.29,2.63,2.75):
        m.box(-.96,-.65,z,.829,.874,.047,'cut')
    m.box(-.96,-.65,2.96,.49,.5,.31,'wall')
    m.arch(-.96,-.912,3.04,.22,.21)
    m.hip(-.96,-.65,3.26,.55,.55,.15,'tile')
    for x in (-.58,-.02,.56,1.15):
        m.box(x,-1.07,0,.12,.21,1.29,'cut')
        m.cylinder(x,-1.07,1.29,.102,.2,'cut',4,.018)
    for x in (-.31,.29,.88):
        m.arch(x,-1.08,.12,.31,.55,'dark',True,True)


LANDMARKS = {'paris': nor, 'rome': colosseum, 'istanbul': sophia, 'london': london_tower, 'seville': giralda}


def house(m,key,role):
    w,d,h = {'tavern':(.89,.65,.58), 'inn':(.76,.72,.51), 'home':(1.12,.81,.81),
             'trade':(1.12,.78,.67), 'library':(1.21,.9,.85)}[role]
    m.box(0,0,0,w+.04,d+.045,.13,'stone')
    m.box(0,0,.09,w,d,h-.09,'cut' if key!='rome' else 'wall')
    if key in ('london','paris'):
        upper_w=w+.08 if key=='london' else w
        m.box(0,-.036,h*.52,upper_w,d+.12,h*.48,'cut')
        m.roof(0,-.03,h,upper_w,d+.09,(.65 if key=='paris' else .52)*w,'tile' if role=='tavern' else 'roof')
        m.box(0,-d/2-.007,h*.49,w+.04,.042,.066,'beam')
        y=-d/2-.11
        for s in (-1,1):
            m.box(s*w*.46,y,.15,.043,.048,h-.14,'beam')
            m.beam((s*w*.43,y,h*.55),(s*w*.18,y,h-.018),.022,'beam')
            if key=='london':
                m.beam((s*w*.31,y,h*.55),(s*w*.1,y,h*.78),.017,'beam')
            m.box(s*w*.29,y-.014,h*.71,.162,.024,.121,'glass')
            m.box(s*w*.29,y-.032,h*.709,.018,.02,.131,'wood')
        m.box(0,y,h,.049,.041,w*.47,'beam')
        m.box(0,y,h*.96,w+.06,.037,.052,'beam')
    elif key == 'istanbul':
        m.box(0,-.092,h*.53,w+.045,d+.16,h*.46,'wood')
        m.hip(0,-.061,h,w+.24,d+.32,.259,'tile')
        y=-d/2-.183
        for x in (-.31,0,.31):
            x*=w
            m.box(x,y,h*.61,w*.204,.055,.206,'beam')
            m.box(x,y-.034,h*.639,w*.159,.026,.14,'glass')
            m.box(x,y-.053,h*.632,.02,.022,.161,'wood')
            m.beam((x,-d/2,.17),(x,y,h*.54),.022,'beam')
    else:
        m.roof(0,0,h,w,d,.25,'tile',ridge='x')
        m.box(0,-d/2,h-.085,w+.03,.072,.056,'wall')
        if key=='seville':
            m.box(0,-d/2,.118,w+.031,.064,.065,'sign')
            m.arch(0,-d/2-.021,.03,w*.32,h*.69,'wall',line=True)
        else:
            m.box(0,-d/2,.153,w+.042,.083,.045,'wall')
        for i in range(13):
            x=(i-6)*w*.083
            m.cylinder(x,-d/2-.063,h+.009,.032,.022,'tile',8)
    m.arch(0,-d/2-.015,.03,w*.27,h*.63,'dark')
    for s in (-1,1):
        if key in ('rome','seville'):
            x=w*.28*s
            y=-d/2-.027
            m.arch(x,y,h*.55,w*.147,.161,'glass',line=True)
            m.box(x,y-.027,h*.534,w*.24,.063,.028,'cut')
            for side in (-1,1):
                m.box(x+side*w*.112,y-.019,h*.546,w*.07,.035,.154,'sign' if key=='seville' else 'copper')
    for y in (-d*.26,d*.23):
        m.arch(w/2+.011,y,h*.41,.15,.19,'glass',side=True)
    m.box(w*.2,d*.24,h+.1,.12,.13,.33,'wall')
    m.box(w*.2,d*.24,h+.4,.15,.16,.05,'cut')
    if role=='inn':
        for s in (-1,1):
            m.box(s*.246,-d/2-.07,.07,.14,.14,.17,'wood')
            m.cylinder(s*.246,-d/2-.07,.23,.09,.1,'leaflight',7,.06)
    elif role=='trade':
        m.box(-.22,-d/2-.092,.01,.21,.18,.2,'wood')
        m.box(.23,-d/2-.09,.012,.16,.14,.14,'wood')
        m.beam((-.45,-d/2,.47),(-.45,-d/2-.26,.47),.023,'beam')
    elif role=='library':
        m.box(0,-d/2-.15,.016,w*.72,.31,.045,'stone')
        for x in (-.36,.36):
            m.cylinder(x,-d/2-.13,.06,.045,.57,'cut',8)
        m.roof(0,-d/2-.12,.63,.87,.27,.21,'roof')
    if role in ('inn','tavern','trade'):
        m.beam((.3,-d/2,h*.88),(.3,-d/2-.25,h*.88),.018,'beam')
        m.box(.3,-d/2-.215,h*.55,.18,.042,.15,'sign')
        m.box(.3,-d/2-.242,h*.598,.084,.016,.025,'metal')


def palace(m,key):
    if key in ('paris','london'):
        m.box(0,.18,0,2.2,1.18,1.0,'cut')
        m.roof(0,.19,1.0,1.29,2.19,.68,'roof',ridge='x')
        for x in (-.99,.99):
            if key == 'paris':
                m.cylinder(x,-.26,0,.32,1.42,'cut')
                m.cylinder(x,-.26,1.41,.384,.54,'roof',12,.023)
                m.arch(x,-.584,.75,.13,.36,'dark',True)
            else:
                m.box(x,-.3,0,.37,.5,1.49,'wall')
                crenels(m,x,-.3,1.47,.36,.49)
                m.arch(x,-.567,.87,.135,.43,'dark',True)
        for i in range(7):
            m.arch((i-3)*.225,-.432,.38,.143,.44,'glass',True,True)
    elif key == 'istanbul':
        m.box(0,.14,0,2.2,1.28,.75,'cut')
        m.hip(0,.275,.75,2.28,.99,.38,'copper')
        for i in range(7):
            x=(i-3)*.285
            m.arch(x,-.514,.16,.176,.49,'dark',True,True)
        for x in (-.71,.71):
            m.box(x,.1,.71,.59,.54,.37,'wall')
            dome(m,x,.1,1.09,.37,.35)
        m.box(0,.21,.7,.42,.44,.88,'cut')
        m.hip(0,.21,1.58,.59,.6,.42,'roof')
    else:
        m.box(0,.1,0,2.22,1.16,1.14,'wall' if key=='rome' else 'cut')
        m.hip(0,.12,1.14,2.26,1.24,.32,'tile')
        for i in range(7):
            x=(i-3)*.284
            m.arch(x,-.496,.11,.173,.42,'dark',key=='seville',True)
            m.arch(x,-.495,.71,.142,.22,'glass',key=='seville')
        m.box(0,-.58,.554,2.16,.19,.075,'cut')
        if key=='seville':
            crenels(m,0,.124,1.19,2.2,1.16)
            m.box(.5,.22,.96,.53,.62,.72,'wall')
            m.hip(.5,.22,1.68,.62,.73,.23,'copper')
        else:
            m.box(0,.27,.99,.82,.73,.63,'cut')
            m.hip(0,.27,1.62,.89,.8,.23,'tile')
    m.arch(0,-.517,.02,.34,.53,'dark',key in ('london','paris','seville'),True)


def market(m):
    for x,col in ((-.32,'sign'),(.32,'cloth')):
        m.box(x,-.01,.06,.56,.45,.14,'wood')
        for a,y in ((-.24,-.2),(.24,-.2),(-.24,.21),(.24,.21)):
            m.box(x+a,y,.01,.033,.033,.52,'beam')
        for j in range(7):
            a=x+(j-3)*.084
            p=[(a-.042,-.26,.48),(a+.042,-.26,.48),(a+.042,.23,.622),(a-.042,.23,.622)]
            m.prism(p,(0,0,.023),col if j%2 else 'cloth' if col!='cloth' else 'tile')
        for i in range(3):
            m.box(x+(i-1)*.145,-.105,.21,.11,.13,.059,'leaf' if i==1 else 'soil')


def ship(m,x,y,scale):
    n=8
    rings=[(.12,.16,.39),(.21,.235,.61),(.355,.232,.615),(.382,.21,.56)]
    m.rings(x,y,[(z*scale,a*scale,b*scale) for z,a,b in rings],n,'beam',math.pi/8)
    m.rings(x,y,[(.377*scale,.21*scale,.56*scale),(.4*scale,.219*scale,.58*scale)],n,'wood',math.pi/8)
    m.box(x,y+.31*scale,.365*scale,.34*scale,.24*scale,.13*scale,'wood')
    m.cylinder(x,y,.36*scale,.023*scale,.96*scale,'wood',8,.014*scale)
    m.beam((x-.31*scale,y,1.14*scale),(x+.31*scale,y,1.14*scale),.013*scale,'beam')
    for i in range(8):
        a=(i/8-.5)*.56*scale
        b=((i+1)/8-.5)*.56*scale
        sweep=lambda t: -.115*scale*(1-(t/(.28*scale))**2)
        p=[(x+a,y-.02,1.13*scale),(x+b,y-.02,1.13*scale),(x+b,y+sweep(b)-.06,.69*scale),(x+a,y+sweep(a)-.06,.69*scale)]
        m.prism(p,(0,-.014,0),'cloth' if i%3 else 'cream')
    m.prism([(x,y,1.29*scale),(x+.22*scale,y,1.25*scale),(x,y,1.19*scale)],(0,.016,0),'sign')


def harbor(m,key):
    # 물은 지도의 수면을 쓴다. 부두 발치에서 바깥쪽 잔교로 이어지는 목재만 모델링한다.
    m.box(0,.26,.01,.92,.58,.18,'stone')
    m.box(0,.25,.155,.96,.6,.065,'cut')
    m.box(0,-.26,.135,.44,1.12,.105,'beam')
    for j in range(13):
        m.box(0,-.75+j*.083,.229,.477,.075,.041,'wood')
    for y in (-.73,-.34,.1):
        for x in (-.198,.198):
            m.cylinder(x,y,-.02,.043,.36,'beam',8,.04)
    for i in range(3):
        m.cylinder(-.28,.25+i*.082,.209,.057,.123,'wood',10)
    if key == 'istanbul':
        for x in (.21,.36):
            m.box(x,.37,.22,.14,.15,.17,'sign')
            m.box(x,.37,.36,.146,.153,.034,'cloth')
    else:
        m.box(.26,.34,.22,.22,.18,.13,'wood')
        m.beam((.16,.25,.353),(.35,.43,.353),.014,'beam')
    m.beam((.2,-.68,.29),(.43,-.76,.27),.009,'beam')
    ship(m,.57,-.69,.82)


# 같은 시선에서 배치·밀도·실루엣을 비교한다. 역할의 높이는 건물마다 독립 축척으로 조정한다.
LAYOUT = {
    'a': {'landmark':(-.6,.69,3,1), 'tavern':(1.58,-.44,-9,1), 'inn':(.57,-1.28,8,.88)},
    'b': {'landmark':(-.83,.93,2,1), 'tavern':(-1.69,-1.47,-8,1), 'inn':(.21,-1.74,8,.89),
          'market':(.86,-.46,3,1), 'trade':(1.94,.5,-6,1)},
    'c': {'landmark':(-.61,1.1,0,1), 'palace':(1.98,1.63,-5,.95), 'library':(2.62,.04,4,.81),
          'tavern':(-.83,-1.85,0,1), 'inn':(1.25,-1.9,14,.9), 'market':(.57,-.55,-7,1.05), 'trade':(-2.69,-.51,-8,1.10)},
    'd': {'landmark':(-1.42,1.08,12,1), 'palace':(1.75,1.71,-15,1), 'library':(2.68,.25,-7,.85),
          'tavern':(-2.53,-1.23,0,1), 'inn':(-1.43,-1.83,5,.9), 'market':(.27,-.65,-8,1.05), 'trade':(2.5,-1.66,0,1.03)},
    'e': {'landmark':(.32,1.28,-8,1), 'palace':(-2.14,1.13,9,.93), 'library':(-2.51,-.35,10,.91),
          'tavern':(.5,-1.88,-9,1), 'inn':(1.66,-1.86,-5,.91), 'market':(-.65,-.76,6,1.05), 'trade':(2.76,-.67,-7,1.09)},
}
ROLE = {'tavern':'술집', 'inn':'여관', 'library':'도서관', 'trade':'교역소', 'market':'시장', 'harbor':'항구'}
FOOT = {'landmark': (1.22,1.05), 'palace':(.86,.44),'library':(.43,.34),
        'trade':(.43,.3),'tavern':(.32,.23),'inn':(.29,.27),'market':(.53,.18)}


def preview_scene(name,rig):
    scene=bpy.data.scenes.new(name)
    scene.collection.children.link(rig)
    scene.camera=bpy.data.objects['지도 직교 카메라']
    scene.render.engine='CYCLES'
    scene.render.film_transparent=True
    scene.render.resolution_x=scene.render.resolution_y=560
    scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'
    scene.render.image_settings.color_mode='RGBA'
    scene.render.threads_mode='FIXED'
    scene.render.threads=6
    scene.cycles.samples=22
    scene.cycles.use_denoising=True
    scene.cycles.device='GPU' if GPU else 'CPU'
    scene.world=rig_world
    scene.view_settings.view_transform='AgX'
    scene.view_settings.look='AgX - Medium High Contrast'
    camera=scene.camera
    camera.location=CAMERA_POS
    camera.rotation_euler=CAMERA_ROT.to_euler()
    camera.data.ortho_scale=10.75
    return scene


def shadow_plane(scene):
    mesh=bpy.data.meshes.new('그림자 받침')
    mesh.from_pydata([(-12,-12,-.032),(12,-12,-.032),(12,12,-.032),(-12,12,-.032)],[],[(0,1,2,3)])
    obj=bpy.data.objects.new('접지 그림자만',mesh)
    obj.is_shadow_catcher=True
    scene.collection.objects.link(obj)
    # 편집 화면에서도 투명한 접지면으로 표시한다.
    obj.display_type='WIRE'


def xy(scene,p):
    view=CAMERA_ROT.inverted()@(Vector(p)-CAMERA_POS)
    scale=scene.camera.data.ortho_scale
    return [round((.5+view.x/scale)*560,3),round((.5-view.y/scale)*560,3)]


def footprint(scene,obj,role):
    w,d=FOOT[role]
    x,y,z=obj.location
    a,b=math.cos(obj.rotation_euler.z)*obj.scale.x,math.sin(obj.rotation_euler.z)*obj.scale.x
    return [xy(scene,(x+a*u-b*v,y+b*u+a*v,z)) for u,v in ((0,0),(-w,-d),(w,-d),(w,d),(-w,d))]


def make_scene(city, tag, tier, title, rig):
    key=city['key']
    scene=preview_scene(f"{city['name']} {tag.upper()} · {title}",rig)
    shadow_plane(scene)
    # 시안의 도시 크기를 비교할 때만 단계 하향. 게임의 실제 도시 규모는 도시 데이터에 남긴다.
    model=bpy.data.collections.new(f"{city['name']} {tag.upper()} 건물")
    scene.collection.children.link(model)
    m=materials(key)
    port=city['facilities']['harbor']
    roles=['landmark']
    feet={}
    for role,(x,y,degrees,scale) in LAYOUT[tag].items():
        if role=='palace' and not city['facilities']['palace']:
            continue
        if role in ROLE and not city['facilities'][role]:
            continue
        name=city['landmarkName'] if role=='landmark' else city['palace'] if role=='palace' else ROLE[role]
        b=Model(model,name,m,x,y,0,math.radians(degrees),scale)
        if role=='landmark':
            LANDMARKS[key](b)
        elif role=='palace':
            palace(b,key)
        elif role=='market':
            market(b)
        else:
            house(b,key,role)
        obj=b.object(True)
        obj['시설']=role
        feet[role]=obj
        if role!='landmark':
            roles.append(role)
    dock=None
    if port:
        x={'a':-.63,'b':-1.25,'c':-1.37,'d':.05,'e':-2.05}[tag]
        d=Model(model,'항구 · 부두와 작은 배',m,x,-2.6,angle=math.radians(10 if tag=='e' else -6))
        harbor(d,key)
        dock=d.object()
        dock['시설']='harbor'
        roles.append('harbor')
    scene['도시 ID']=city['id']
    scene['발견물 ID']=city['landmark']
    scene['시안 단계']=tier
    scene['지도 기본 너비']=SIZES[tier][0]
    scene['지도 확대 너비']=SIZES[tier][1]
    scene['표시 시설']=', '.join(roles)
    scene['물길']= {'london':'템스강', 'seville':'과달키비르강', 'istanbul':'골든혼'}[key] if port else '내륙'
    # 지도 시안은 플레이어의 자택이 없는 상태다. 자택 모듈은 원본 안의 별도 모음에 둔다.
    return scene, {'id':f'{key}-{tag}','city':key,'variant':tag,'tier':tier,'name':title,'roles':roles,
                   'width':SIZES[tier][0],'zoomWidth':SIZES[tier][1],'water':scene['물길']}, feet,dock


def light(rig, name, location, energy, size, color):
    data=bpy.data.lights.new(name,'AREA')
    data.energy,data.shape,data.size,data.color=energy,'DISK',size,color
    obj=bpy.data.objects.new(name,data)
    rig.objects.link(obj)
    obj.location=location
    obj.rotation_euler=(Vector((0,0,.7))-obj.location).to_track_quat('-Z','Y').to_euler()


if __name__ == '__main__':
    DATA = json.loads((OUT / 'cities.json').read_text(encoding='utf-8'))
    bpy.ops.wm.read_factory_settings(use_empty=True)
    GPU=False
    if '--cpu' not in sys.argv:
        try:
            prefs=bpy.context.preferences.addons['cycles'].preferences
            prefs.compute_device_type='CUDA'
            prefs.get_devices()
            for device in prefs.devices:
                device.use=device.type=='CUDA'
                GPU |= device.use
        except (RuntimeError, TypeError, AttributeError):
            pass
    rig=bpy.data.collections.new('공통 조명과 지도 시점')
    rig_world=bpy.data.worlds.new('온화한 낮')
    rig_world.use_nodes=True
    rig_world.node_tree.nodes['Background'].inputs[0].default_value=(.45,.56,.71,1)
    rig_world.node_tree.nodes['Background'].inputs[1].default_value=.42
    light(rig,'왼쪽 위 햇빛',(-5,-5.4,9),1430,3.1,(1,.86,.69))
    light(rig,'하늘 반사광',(6,-.8,7),500,8,(.73,.85,1))
    light(rig,'뒤쪽 가장자리 햇빛',(-1,6,8),1030,5.7,(1,.9,.75))
    cam=bpy.data.objects.new('지도 직교 카메라',bpy.data.cameras.new('도시 비교'))
    cam.data.type='ORTHO'
    rig.objects.link(cam)

    scenes=[]
    for city in DATA['cities']:
        for tag,tier,title in VARIANTS:
            scenes.append(make_scene(city,tag,tier,title,rig))

    quays={}
    for city in DATA['cities']:
        if not city['facilities']['harbor']:
            continue
        key=city['key']
        scene=preview_scene(city['name']+' · 해안 배치용 부두',rig)
        part=Model(scene.collection,'부두와 작은 배',materials(key))
        harbor(part,key)
        quays[key]=(scene,part.object())

    modules=bpy.data.scenes.new('자택 모듈 · 제독의 거주 도시에만 사용')
    modules.collection.children.link(rig)
    modules.camera=cam
    modules.world=rig_world
    for i,city in enumerate(DATA['cities']):
        h=Model(modules.collection,city['name']+' 자택',materials(city['key']),(i-2)*1.85,0,.01)
        house(h,city['key'],'home')
        h.object(True)['시설']='home'

    bpy.context.window.scene=scenes[2][0]
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type=='VIEW_3D':
                area.spaces.active.region_3d.view_perspective='CAMERA'
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'city-icons.blend'),compress=True)
    (OUT/'raw-renders').mkdir(exist_ok=True)
    subset=next((v.split('=',1)[1].split(',') for v in sys.argv if v.startswith('--only=')),None)
    reuse='--reuse-renders' in sys.argv

    def render(scene,key):
        if reuse:
            if not (OUT/'raw-renders'/f"{key}.png").is_file():
                raise FileNotFoundError(key)
            return
        scene.render.filepath=str(OUT/'raw-renders'/f"{key}.png")
        print('CITY_RENDER',key,flush=True)
        bpy.ops.render.render(write_still=True)

    for scene,card,feet,dock in scenes:
        if subset and card['id'] not in subset:
            continue
        bpy.context.window.scene=scene
        bpy.context.view_layer.update()
        card['origin']=xy(scene,(0,0,0))
        card['feet']={role:footprint(scene,obj,role) for role,obj in feet.items()}
        render(scene,card['id'])
        if dock and card['variant']=='c':
            dock.hide_render=True
            render(scene,card['id']+'-land')
            dock.hide_render=False

    quay_cards={}
    for key,(scene,obj) in quays.items():
        if subset:
            continue
        bpy.context.window.scene=scene
        turns=[]
        for i in range(8):
            angle=i*TAU/8
            obj.rotation_euler.z=angle
            bpy.context.view_layer.update()
            name=f'{key}-quay-{i}'
            points=((0,0,0),(0,.35,0),(0,-.69,0),(.57,-.69,0))
            rotation=Quaternion((0,0,1),angle)
            origin,land,water,ship_point = [xy(scene,rotation@Vector(p)) for p in points]
            turns.append({'id':name,'origin':origin,'land':land,'water':water,'ship':ship_point})
            render(scene,name)
        quay_cards[key]=turns
    (OUT/'variants.json').write_text(json.dumps([row[1] for row in scenes],ensure_ascii=False,indent=2),encoding='utf-8')
    (OUT/'quays.json').write_text(json.dumps(quay_cards,ensure_ascii=False,indent=2),encoding='utf-8')
