"""바위 수형과 바닥에 닿는 옅은 그림자를 같은 Blender 장면에서 만든다."""
import json
import math
import random
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0,str(Path(__file__).resolve().parent))
from blender_helpers import mat, mesh

OUT = Path(__file__).resolve().parents[2]/'artifacts/world-detail-20261125/blender'
EXPAND = '--expanded' in sys.argv
SOURCE = 'rock-variety-expanded.blend' if EXPAND else 'rock-variety.blend'
bpy.ops.wm.open_mainfile(filepath=str(OUT/('rock-variety.blend' if EXPAND else 'vegetation-variety.blend')))
scene = bpy.context.scene
scene.cycles.device = 'CPU'
prefs = bpy.context.preferences.addons['cycles'].preferences
try:
    prefs.compute_device_type = 'CUDA'
    prefs.get_devices()
    for device in prefs.devices:
        device.use = device.type=='CUDA'
    if any(device.use for device in prefs.devices):
        scene.cycles.device = 'GPU'
except (RuntimeError,TypeError):
    pass
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x = scene.render.resolution_y = 448
scene.render.resolution_percentage = 100

slab = mat('갈라진 황회색 판암',(.16,.125,.083),(.36,.29,.19),5.5,bump=.032)
talus = mat('사면의 갈라진 회색 암석',(.125,.116,.10),(.33,.30,.24),6.2,bump=.032)
erratic = mat('풍화된 밝은 회갈색 큰 돌',(.147,.133,.115),(.35,.321,.274),4.6,bump=.026)
cobbles = mat('물에 닳은 회갈색 자갈',(.117,.105,.081),(.278,.247,.187),8.7,rough=.71,bump=.015)


def add_joints(material, scale):
    nodes,links = material.node_tree.nodes,material.node_tree.links
    shader = nodes.get('Principled BSDF')
    rock_color = shader.inputs['Base Color'].links[0].from_socket
    position = nodes.new('ShaderNodeTexCoord')
    stretch = nodes.new('ShaderNodeVectorMath')
    stretch.operation = 'MULTIPLY'
    stretch.inputs[1].default_value = (1.0,1.6,.48)
    links.new(position.outputs['Object'],stretch.inputs[0])
    joints = nodes.new('ShaderNodeTexVoronoi')
    joints.feature = 'DISTANCE_TO_EDGE'
    joints.inputs['Scale'].default_value = scale
    links.new(stretch.outputs['Vector'],joints.inputs['Vector'])
    softness = nodes.new('ShaderNodeValToRGB')
    softness.color_ramp.elements[0].color = (.48,.45,.41,1)
    softness.color_ramp.elements[1].position = .10
    links.new(joints.outputs['Distance'],softness.inputs[0])
    tint = nodes.new('ShaderNodeMixRGB')
    tint.blend_type = 'MULTIPLY'
    tint.inputs[0].default_value = .50
    links.new(rock_color,tint.inputs[1])
    links.new(softness.outputs['Color'],tint.inputs[2])
    links.new(tint.outputs[0],shader.inputs['Base Color'])


add_joints(slab,2.4)
add_joints(talus,2.0)
shadow = mat('옅게 퍼지는 돌 아래 그림자',(.06,.047,.036),(.06,.047,.036),1,bump=0)
nodes,links = shadow.node_tree.nodes,shadow.node_tree.links
shader = nodes.get('Principled BSDF')
shader.inputs['Base Color'].default_value = (.06,.047,.036,1)
shader.inputs['Emission Color'].default_value = (.06,.047,.036,1)
shader.inputs['Emission Strength'].default_value = .48
alpha = nodes.new('ShaderNodeAttribute')
alpha.attribute_name = 'contact_shadow'
links.new(alpha.outputs['Fac'],shader.inputs['Alpha'])


def put(obj,collection):
    for parent in list(obj.users_collection):
        parent.objects.unlink(obj)
    collection.objects.link(obj)


def footprint(group,x,y,width,length,height,angle,outline):
    # 중심은 밑면 바로 아래에 두고, 낮은 빛이 들어오는 반대쪽으로만 길이를 조금 더한다.
    vertices,faces,opacity = [],[],[]
    sides = len(outline)
    for radius,shade in [(.11,.28),(.61,.23),(.96,.09),(1.35,0)]:
        for i,edge in enumerate(outline):
            a = math.tau*i/sides
            u,v = math.cos(a)*width*radius*edge,math.sin(a)*length*radius*edge
            vertices.append((x+u*math.cos(angle)-v*math.sin(angle)+height*.19,
                             y+v*math.cos(angle)+u*math.sin(angle)-height*.14,-.018-height*.002))
            opacity.append(shade)
    faces.append(tuple(range(sides)))
    for row in range(3):
        for i in range(sides):
            faces.append((row*sides+i,(row+1)*sides+i,(row+1)*sides+(i+1)%sides,row*sides+(i+1)%sides))
    obj = mesh('바위 밑면의 연한 그림자',vertices,faces,[shadow])
    attr = obj.data.attributes.new('contact_shadow','FLOAT','POINT')
    for value,opacity_value in zip(attr.data,opacity):
        value.value = opacity_value
    put(obj,group)


def stone(group,rng,data,kind,material):
    x,y,width,length,height,angle = data
    rounded = kind in ('erratic','cobbles')
    sides = 10 if rounded else 8
    outline = [rng.uniform(.82,1.13) for _ in range(sides)]
    vertices,faces = [],[]
    tiers = [(0,.75),(.23,1),(.72,.90),(1,.57)] if rounded else [(0,.79),(.19,1),(.76,.95),(1,.74)]
    for row,(z,radius) in enumerate(tiers):
        for i,edge in enumerate(outline):
            a = i*math.tau/sides+.11*(row-1)
            u = math.cos(a)*width*radius*edge+height*.17*z
            v = math.sin(a)*length*radius*edge
            h = height*(z+rng.uniform(-.12,.11)) if row else 0
            vertices.append((x+u*math.cos(angle)-v*math.sin(angle),y+v*math.cos(angle)+u*math.sin(angle),h))
    faces.append(tuple(reversed(range(sides))))
    for row in range(3):
        for i in range(sides):
            p,q = row*sides+i,row*sides+(i+1)%sides
            faces.append((p,q,q+sides,p+sides))
    faces.append(tuple(range(sides*3,sides*4)))
    obj = mesh('물에 닳은 돌' if rounded else '면과 절리가 드러난 바위',vertices,faces,[material])
    bevel = obj.modifiers.new('풍화된 모서리','BEVEL')
    bevel.width = min(height,width)*(.18 if rounded else .065)
    bevel.segments = 3 if rounded else 2
    obj.modifiers.new('암석 면의 명암','WEIGHTED_NORMAL')
    for face in obj.data.polygons:
        face.use_smooth = rounded
    put(obj,group)
    footprint(group,x,y,width,length,height,angle,outline)


layouts = {
    # x, y, 반너비, 반깊이, 높이, 회전
    'slab':[
        [(-.23,.07,.58,.28,.24,.23),(.36,-.22,.37,.18,.13,-.23),
         (.45,.37,.18,.12,.09,.6),(-.85,-.31,.105,.086,.065,.2)],
        [(-.18,.07,.57,.36,.19,-.70),(.47,-.12,.42,.24,.30,-.24),
         (.83,-.37,.18,.13,.09,0),(.22,.58,.16,.11,.11,.5)]],
    'talus':[
        [(-.24,.14,.50,.31,.59,.55),(.43,-.13,.39,.27,.33,.4),
         (.83,-.25,.23,.15,.17,-.4),(-.75,-.35,.19,.13,.18,.8),(.11,-.57,.12,.09,.10,.1)],
        [(-.37,.2,.47,.40,.47,-.5),(.43,.25,.37,.23,.48,.06),
         (.61,-.29,.28,.20,.21,.66),(-.72,-.40,.19,.13,.20,-.16),(.05,-.64,.18,.10,.11,.7)]],
    'erratic':[
        [(-.06,.08,.65,.45,.57,.47),(.66,-.21,.22,.14,.17,.21),(.39,-.50,.13,.10,.11,-.37)],
        [(0,.05,.62,.46,.74,-.32),(-.66,-.25,.22,.15,.13,.23),(.30,.55,.15,.11,.12,.6)]],
    'cobbles':[
        [(-.52,.20,.21,.17,.13,0),(-.18,.13,.27,.18,.20,.6),(.25,-.01,.19,.14,.13,.7),
         (.51,-.10,.25,.17,.14,0),(-.20,-.31,.15,.13,.105,0),(.66,.29,.14,.12,.09,.8)],
        [(-.54,-.17,.19,.16,.13,.2),(-.31,.22,.19,.13,.13,.6),(0,-.06,.31,.22,.15,.7),
         (.38,.16,.21,.18,.12,0),(.61,-.21,.17,.12,.10,.3),(.19,-.41,.15,.12,.10,.2)]]
}

# 큰 돌 하나에서 자갈 띠까지, 같은 바위의 회전만 바꾸지 않고 배치 자체를 바꾼다.
formations = [
    [(0,0,1)],
    [(-.34,.08,1),(.50,-.17,.72)],
    [(-.34,-.19,.88),(.21,.27,1),(.47,-.34,.55)],
    [(-.67,.33,.54),(-.12,-.25,1),(.50,-.25,.70),(.87,.19,.42)],
    [(-.62,-.38,1),(-.11,-.11,.72),(.37,.08,.52),(.72,.24,.38),(.94,.40,.24)],
    [(-.65,.16,.52),(-.12,.16,1),(.43,.29,.48),(.59,-.43,.36),(-.28,-.60,.31),(-.92,-.36,.27)],
]
stone_scale = {'slab':(.59,.31,.27),'talus':(.46,.33,.55),'erratic':(.62,.46,.63),'cobbles':(.31,.24,.17)}


def expanded_layout(kind,variant,rng):
    form = formations[(variant-2)//2]
    width,depth,height = stone_scale[kind]
    twist = rng.uniform(-.55,.55)+(math.pi*.39 if variant%2 else 0)
    c,s = math.cos(twist),math.sin(twist)
    for x,y,size in form:
        x += rng.uniform(-.06,.06)
        y += rng.uniform(-.10,.10)
        yield (x*c-y*s,x*s+y*c,width*size*rng.uniform(.81,1.17),
               depth*size*rng.uniform(.78,1.14),height*size*rng.uniform(.64,1.29),twist+rng.uniform(-.9,.9))


camera = scene.camera
target = Vector((0,0,.24))
camera.location = target+Vector((4,-8,8))
camera.rotation_euler = (target-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.ortho_scale = 2.9
added = []
first = None
for i,(kind,label,material) in enumerate([('slab','낮은 암판',slab),('talus','사면의 부서진 바위',talus),('erratic','둥글게 풍화된 큰 돌',erratic),('cobbles','강가의 물돌',cobbles)]):
    for variant in range(2,14) if EXPAND else range(2):
        name = f'바위 부품 / {label} / {variant+1}'
        collection = bpy.data.collections.new(name)
        scene.collection.children.link(collection)
        first = first or collection
        rng = random.Random(601+i*49+variant*131)
        layout = expanded_layout(kind,variant,rng) if EXPAND else layouts[kind][variant]
        for data in layout:
            stone(collection,rng,data,kind,material)
        for group in scene.collection.children:
            if group.name.startswith(('수목 /','지형 부품 /','환경 시안 /','보정 산형 /','지역 식생 /','바위 부품 /')):
                group.hide_render = group.hide_viewport = group!=collection
        key = f'detail-{kind}-{variant}'
        scene.render.filepath = str(OUT/(key+'.png'))
        bpy.ops.render.render(write_still=True)
        added.append({'id':key,'collection':collection.name,'size':448,'source':SOURCE})

for group in scene.collection.children:
    if group.name.startswith('바위 부품 /'):
        group.hide_render = group.hide_viewport = group!=first
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/SOURCE),compress=True)
file = OUT/'frames.json'
frames = json.loads(file.read_text(encoding='utf8'))
keys = {row['id'] for row in added}
file.write_text(json.dumps([row for row in frames if row['id'] not in keys]+added,ensure_ascii=False,indent=2),encoding='utf8')
