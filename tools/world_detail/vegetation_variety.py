"""지역 숲에 사용할 수형 일곱 종을 기존 조명과 녹색 재질로 렌더한다."""
import json
import math
import random
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from blender_helpers import cylinder_between, mat, mesh

OUT = Path(__file__).resolve().parents[2] / 'artifacts/world-detail-20261125/blender'
SOURCE = 'vegetation-variety.blend'
bpy.ops.wm.open_mainfile(filepath=str(OUT / 'mountains-retouched.blend'))
scene = bpy.context.scene
scene.cycles.device = 'CPU'
prefs = bpy.context.preferences.addons['cycles'].preferences
try:
    prefs.compute_device_type = 'CUDA'
    prefs.get_devices()
    for device in prefs.devices:
        device.use = device.type == 'CUDA'
    if any(device.use for device in prefs.devices):
        scene.cycles.device = 'GPU'
except (RuntimeError, TypeError):
    pass
scene.cycles.samples = 16
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x = scene.render.resolution_y = 384
scene.render.resolution_percentage = 100

BARK = bpy.data.materials['통일된 회갈색 수피']
BIRCH = mat('자작나무의 밝은 수피',(.19,.172,.133),(.49,.467,.398),13,bump=.012)
LEAVES = sorted((m for m in bpy.data.materials if m.name.startswith('숲의 공통 녹색 명암')),key=lambda m:m.name)[:3]
assert LEAVES, '수목의 공통 녹색 재질이 필요합니다.'


class Tree:
    def __init__(self, seed):
        self.random = random.Random(seed)
        self.vertices, self.faces, self.materials = [], [], []

    def stem(self, points, radii):
        for start,end,r1,r2 in zip(points,points[1:],radii,radii[1:]):
            cylinder_between(self.vertices,self.faces,self.materials,start,end,r1,r2,0,7)

    def leaf(self, center, angle, length, width, hanging=0):
        rng = self.random
        forward = Vector((math.cos(angle),math.sin(angle),rng.uniform(-.55,.55)-hanging)).normalized()*length
        side = Vector((-math.sin(angle),math.cos(angle),rng.uniform(-.30,.30))).normalized()*width
        start = len(self.vertices)
        self.vertices.extend(tuple(v) for v in (center-forward,center+side,center+forward,center-side,center+Vector((0,0,width*.3))))
        material = rng.randrange(1,1+len(LEAVES))
        for i in range(4):
            self.faces.append((start+i,start+(i+1)%4,start+4))
            self.materials.append(material)

    def foliage(self, center, radii, count, length=.089, width=.035, hanging=0):
        rng = self.random
        for _ in range(count):
            a,z = rng.uniform(0,math.tau),rng.uniform(-1,1)
            r = rng.random()**.28
            planar = math.sqrt(1-z*z)*r
            p = Vector((center[0]+radii[0]*planar*math.cos(a),center[1]+radii[1]*planar*math.sin(a),center[2]+radii[2]*z*r))
            self.leaf(p,rng.uniform(0,math.tau),length*rng.uniform(.65,1.25),width*rng.uniform(.70,1.25),hanging)

    def finish(self, name, collection, bark):
        obj = mesh(name,self.vertices,self.faces,[bark]+LEAVES)
        for face,material in zip(obj.data.polygons,self.materials):
            face.material_index = material
        for parent in list(obj.users_collection):
            parent.objects.unlink(obj)
        collection.objects.link(obj)


def broadleaf(tree, kind):
    rng = tree.random
    # 같은 잎 재질도 가지가 퍼지는 각도와 잎이 뭉치는 높이에 따라 수관이 달라진다.
    height,reach,crown,branches = {
        'beech':(1.68,.65,.38,16),'birch':(2.24,.40,.26,14),
        'willow':(1.64,.79,.30,16),'kapok':(2.65,.92,.33,16),'tamarisk':(1.27,.66,.28,12)
    }[kind]
    drift = rng.uniform(-.16,.16)
    tree.stem([(0,0,0),(drift*.3,0,height*.47),(drift,0,height*.87),(drift*1.7,.06,height)],
              [.10 if kind in ('beech','kapok') else .065,.058,.032,.012])
    if kind in ('birch','tamarisk'):
        for sign in (-1,1):
            tip = (sign*.3,sign*.17,height*.80)
            tree.stem([(0,0,.03),(sign*.12,0,height*.46),tip],[.054,.032,.013])
    if kind=='kapok':
        for i in range(5):
            a = i*math.tau/5
            tree.stem([(math.cos(a)*.37,math.sin(a)*.37,0),(.01,0,.49)],[.052,.020])
    for i in range(branches):
        a = i*2.399+rng.uniform(-.26,.26)
        r = reach*rng.uniform(.46,1.11)
        z = height*rng.uniform(.56,.99) if kind=='birch' else height*rng.uniform(.73,1.02)
        tip = (drift+math.cos(a)*r,math.sin(a)*r,z)
        mid = (tip[0]*.53,tip[1]*.53,z-.11)
        tree.stem([(drift*.6,0,z-height*.31),mid,tip],[.026,.016,.005])
        if kind in ('willow','tamarisk'):
            drop = rng.uniform(.33,.78) if kind=='willow' else rng.uniform(.17,.36)
            for j in range(4):
                ox,oy = rng.uniform(-.17,.17),rng.uniform(-.17,.17)
                for k in range(4):
                    t=k/4
                    tree.foliage((tip[0]+ox*(1+t),tip[1]+oy*(1+t),z-drop*t),(.095,.090,.13),22,.079,.021,.7)
        tall = crown*(1.30 if kind=='birch' else .52 if kind=='kapok' else .84)
        tree.foliage(tip,(crown,crown*.87,tall),140 if kind=='tamarisk' else 240,.074 if kind=='tamarisk' else .103,.024 if kind=='tamarisk' else .041)
    if kind in ('beech','birch','kapok'):
        tree.foliage((drift*1.4,0,height*.96),(crown*1.22,crown,tall),300)


def fir(tree):
    rng = tree.random
    h = rng.uniform(2.02,2.38)
    tree.stem([(0,0,0),(.025,-.025,h*.62),(.065,0,h)],[.064,.039,.008])
    # 아래로 처진 가지가 층마다 어긋난다. 끝은 위로 살짝 들린다.
    for level in range(11):
        t = level/11
        z = h*(.19+.76*t)
        for i in range(7):
            a = math.tau*i/7+level*.47+rng.uniform(-.14,.14)
            r = (.63-.56*t)*rng.uniform(.8,1.08)
            x,y = r*math.cos(a),r*math.sin(a)
            tip = (x,y,z-.09*(1-t))
            tree.stem([(.025,0,z),(x*.65,y*.65,z-.14*(1-t)),tip],[.016,.010,.003])
            for j in range(3):
                f=.47+.22*j
                tree.foliage((x*f,y*f,z-.14*(1-t)+.06*f),(.125*(1-t*.7),.10*(1-t*.7),.081),28,.07,.020)
    tree.foliage((.06,0,h-.10),(.12,.11,.16),140,.068,.022)


def fanpalm(tree):
    rng = tree.random
    h = rng.uniform(1.75,2.13)
    drift = rng.uniform(-.20,.23)
    tree.stem([(0,0,0),(drift*.30,0,h*.48),(drift,.07,h)],[.077,.058,.037])
    for i in range(16):
        young = i>=11
        angle = (math.tau*(i-11)/5+.29 if young else math.tau*i/11)+rng.uniform(-.14,.14)
        outward = Vector((math.cos(angle),math.sin(angle),0))
        side = Vector((-outward.y,outward.x,0))
        root = Vector((drift,.07,h))
        reach = rng.uniform(.10,.18) if young else rng.uniform(.23,.45)
        rise = rng.uniform(.15,.31) if young else rng.uniform(-.22,.18)
        fan = root+outward*reach+Vector((0,0,rise))
        tree.stem([root,fan],[.015,.006])
        for blade in range(11):
            a = (blade/10-.5)*2.3
            length = (.31+.13*math.cos(a))*rng.uniform(.87,1.09)
            direction = math.cos(a)*outward+math.sin(a)*side
            tip = fan+direction*(length*(.64 if young else 1))+Vector((0,0,(.12 if young else -.15)+.10*math.cos(a)))
            middle = fan.lerp(tip,.61)+Vector((0,0,.08))
            width = Vector((-direction.y,direction.x,0))*.049
            start = len(tree.vertices)
            tree.vertices.extend(tuple(p) for p in (fan,middle+width,tip,middle-width,middle))
            for j in range(4):
                tree.faces.append((start+j,start+(j+1)%4,start+4))
                tree.materials.append(1+(blade+i)%len(LEAVES))


def show(collection):
    for group in scene.collection.children:
        if group.name.startswith(('수목 /','지형 부품 /','환경 시안 /','보정 산형 /','지역 식생 /')):
            group.hide_render = group.hide_viewport = group != collection


camera = scene.camera
target = Vector((0,0,1.20))
camera.location = target+Vector((4,-8,8))
camera.rotation_euler = (target-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.ortho_scale = 3.6
added = []
first = None
forms = [('beech','너도밤나무형'),('birch','자작나무형'),('fir','전나무형'),('willow','버드나무형'),
         ('kapok','케이폭형'),('fanpalm','부채야자형'),('tamarisk','위성류형')]
for i,(kind,name) in enumerate(forms):
    for variant in range(2):
        tree = Tree(1551+i*231+variant*47)
        if kind=='fir':
            fir(tree)
        elif kind=='fanpalm':
            fanpalm(tree)
        else:
            broadleaf(tree,kind)
        collection = bpy.data.collections.new(f'지역 식생 / {name} / {variant+1}')
        scene.collection.children.link(collection)
        first = first or collection
        tree.finish(name,collection,BIRCH if kind=='birch' else BARK)
        show(collection)
        key = f'tree-{kind}-{variant}'
        scene.render.filepath = str(OUT/(key+'.png'))
        bpy.ops.render.render(write_still=True)
        added.append({'id':key,'collection':collection.name,'size':384,'source':SOURCE})
        print('VEGETATION_READY',key,flush=True)

show(first)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/SOURCE),compress=True)
frames_file = OUT/'frames.json'
frames = json.loads(frames_file.read_text(encoding='utf8'))
keys = {row['id'] for row in added}
frames_file.write_text(json.dumps([row for row in frames if row['id'] not in keys]+added,ensure_ascii=False,indent=2),encoding='utf8')
