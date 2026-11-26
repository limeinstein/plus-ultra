"""원래 Blender 파일을 보존하고 새 암릉·설산·화산의 투명 렌더를 굽는다."""
import bpy
import json
import math
import shutil
import sys
from pathlib import Path
from mathutils import Vector, noise

sys.path.insert(0, str(Path(__file__).resolve().parent))
from blender_helpers import mat, mesh, smooth

OUT = Path(__file__).resolve().parents[2] / 'artifacts/world-detail-20261125/blender'
SOURCE = 'mountains-retouched.blend'
bpy.ops.wm.open_mainfile(filepath=str(OUT / 'biome-assets.blend'))
scene = bpy.context.scene
preferences = bpy.context.preferences.addons['cycles'].preferences
try:
    preferences.compute_device_type = 'CUDA'
    preferences.get_devices()
    for device in preferences.devices:
        device.use = device.type == 'CUDA'
    if any(device.use for device in preferences.devices):
        scene.cycles.device = 'GPU'
except (RuntimeError, TypeError):
    scene.cycles.device = 'CPU'
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x = scene.render.resolution_y = 640
scene.render.resolution_percentage = 100


def surface(name, dark, light, snowy):
    material = mat(name, dark, light, 3.4, bump=.035)
    tree = material.node_tree
    nodes, links = tree.nodes, tree.links
    shader = nodes.get('Principled BSDF')
    fade = nodes.new('ShaderNodeAttribute')
    fade.attribute_name = 'slope_edge'
    links.new(fade.outputs['Fac'], shader.inputs['Alpha'])
    if snowy:
        snow = nodes.new('ShaderNodeAttribute')
        snow.attribute_name = 'snow_drift'
        rock_color = shader.inputs['Base Color'].links[0].from_socket
        mix = nodes.new('ShaderNodeMixRGB')
        mix.inputs[2].default_value = (.74, .81, .86, 1)
        links.new(snow.outputs['Fac'], mix.inputs[0])
        links.new(rock_color, mix.inputs[1])
        links.new(mix.outputs[0], shader.inputs['Base Color'])
    return material


def height_at(x, y, peaks, kind):
    # 주봉과 옆 능선을 하나의 지면으로 잇고, 굽은 홈이 정상에서 산기슭으로 이어지게 한다.
    warped_x = x + .14 * noise.noise(Vector((x*1.6, y*1.6, 1)))
    warped_y = y + .14 * noise.noise(Vector((x*1.6, y*1.6, 8)))
    masses = []
    foothills = []
    for px, py, height, width, length, angle in peaks:
        dx, dy = warped_x-px, warped_y-py
        u = (dx*math.cos(angle)+dy*math.sin(angle))/width
        v = (dy*math.cos(angle)-dx*math.sin(angle))/length
        r, theta = math.hypot(u, v), math.atan2(v, u)
        fan = math.cos(theta*5+1.1*r)+.42*math.cos(theta*11-2.4*r)
        edge = r*(1+.17*fan*smooth(.05,.32,r))
        if kind == 'volcano':
            z = max(0, 1-edge*.67)**2.3*height
            z -= .23*math.exp(-(r/.09)**2)
            z -= .22*math.sin(theta*23+2*r)**2*smooth(.045,.20,r)*max(0,1-r*.72)
        elif kind == 'granite':
            # 화강암 지붕은 둥글고 바깥 급벽은 짧게 끊긴다.
            z = height*max(0,1-edge**1.8)**.74
        else:
            z = height*max(0,1-edge)**1.42
        masses.append(max(0,z))
        foothills.append(.48*(1-smooth(.54,1.46,edge)))
    peak = sum(z**5 for z in masses)**.2
    radius = math.hypot(x, y*1.15)
    foot = sum(z**3 for z in foothills)**(1/3)
    stone = noise.fractal(Vector((x*6,y*6,3)), 1, 2.1, 4)
    cracks = abs(noise.noise(Vector(((x+y*.22)*9,y*3,11))))
    roughness = (.14 if kind == 'granite' else .10)*stone - .08*(1-smooth(.035,.18,cracks))
    return max(0, peak+foot+roughness*smooth(.06,.75,peak+foot))*(1-smooth(2.55,2.92,radius))


def terrain(collection, name, kind, peaks):
    steps, extent = 196, 3.0
    vertices, faces = [], []
    for j in range(steps+1):
        y = extent*(2*j/steps-1)
        for i in range(steps+1):
            x = extent*(2*i/steps-1)
            vertices.append((x,y,height_at(x,y,peaks,kind)))
    for j in range(steps):
        for i in range(steps):
            a = j*(steps+1)+i
            faces.append((a,a+1,a+steps+2,a+steps+1))
    snowy = kind != 'granite'
    colors = ((.09,.085,.088),(.26,.24,.215)) if snowy else ((.145,.132,.115),(.36,.327,.28))
    material = surface(name+' 암석', *colors, snowy)
    rock = mesh(name,vertices,faces,[material])
    for previous in list(rock.users_collection):
        previous.objects.unlink(rock)
    collection.objects.link(rock)
    for face in rock.data.polygons:
        face.use_smooth = True
    edge = rock.data.attributes.new('slope_edge','FLOAT','POINT')
    drift = rock.data.attributes.new('snow_drift','FLOAT','POINT')
    for i, vertex in enumerate(rock.data.vertices):
        x,y,z = vertex.co
        edge.data[i].value = smooth(.035,.52,z) * (1-smooth(2.30,2.90,math.hypot(x,y*1.15)))
        if snowy:
            drift_noise = noise.fractal(Vector((x*5,y*5,5)),1,2,3)
            snow_line = (1.62 if kind=='volcano' else 1.24)+.46*drift_noise
            sheltered = smooth(.32,.66,vertex.normal.z+.22*drift_noise)
            snow_mask = max(sheltered,.59*smooth(2.3,3.15,z))
            drift.data[i].value = smooth(snow_line,snow_line+.30,z)*snow_mask


def render(collection, key):
    for candidate in scene.collection.children:
        if candidate.name.startswith(('수목 /','지형 부품 /','환경 시안 /','보정 산형 /')):
            candidate.hide_render = candidate.hide_viewport = candidate != collection
    camera = scene.camera
    target = Vector((0,0,1.35))
    camera.location = target + Vector((4,-8,8))
    camera.rotation_euler = (target-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.ortho_scale = 6.8
    scene.render.filepath = str(OUT/(key+'.png'))
    bpy.ops.render.render(write_still=True)
    return {'id':key,'collection':collection.name,'size':640,'source':SOURCE}


shapes = [
    ('granite',0,'갈라진 화강암 주능선',[(-.7,.25,2.45,1.02,1.12,-.3),(.23,.50,3.0,.98,.94,.3),(1.05,.30,1.95,.80,.96,.25),(.21,-.66,1.38,1.10,.72,-.42)]),
    ('granite',1,'낮은 화강암 곁능선',[(-.85,.25,1.65,1.03,.99,-.32),(-.06,.35,2.50,.88,.92,.42),(.72,-.18,1.85,.92,.88,-.2)]),
    ('snowridge',0,'설산의 주봉과 설릉',[(-.39,.40,3.62,1.67,1.52,.53),(.93,.53,2.65,1.28,1.12,-.17),(-1.26,.51,1.91,1.26,1.11,.12),(-.14,-.74,1.78,1.18,1.12,.61)]),
    ('snowridge',1,'날카로운 설산의 두 암벽',[(-.15,.40,3.70,1.25,1.64,.63),(.82,.44,2.43,1.40,1.07,-.33),(-1.17,-.05,1.96,1.24,1.09,.40)]),
    ('volcano',0,'화구와 방사형 골짜기',[(0,.12,3.40,1.98,1.80,.30)]),
]
updated = {}
for kind, variant, name, peaks in shapes:
    group = bpy.data.collections.new('보정 산형 / '+name)
    scene.collection.children.link(group)
    terrain(group,name,kind,peaks)
    key = f'detail-{kind}-{variant}'
    updated[key] = render(group,key)

for wonder, detail in {'everest':'snowridge-0','machapuchare':'snowridge-1','matterhorn':'snowridge-1','fuji':'volcano-0','huangshan':'granite-0'}.items():
    key = 'wonder-'+wonder
    shutil.copyfile(OUT/('detail-'+detail+'.png'),OUT/(key+'.png'))
    updated[key] = {**updated['detail-'+detail],'id':key}
file = OUT/'frames.json'
frames = json.loads(file.read_text(encoding='utf-8'))
file.write_text(json.dumps([updated.get(row['id'],row) for row in frames],ensure_ascii=False,indent=2),encoding='utf-8')
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/SOURCE),compress=True)
