"""Blender 4.5 바다 원본과 file://용 수면 데이터. -- --render 로 미리보기도 출력한다."""
import bpy, math, json, base64, sys
from pathlib import Path
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'artifacts/ocean-blender-20261124'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = '에메랄드 연안과 남색 심해'
scene.render.engine = 'CYCLES'
scene.cycles.samples = 16
scene.cycles.use_denoising = True
scene.render.resolution_x = 1200
scene.render.resolution_y = 760
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.fps = 24
scene.frame_end = 240
scene.world = bpy.data.worlds.new('맑은 바다의 하늘')
scene.world.use_nodes = True
sky = scene.world.node_tree.nodes.new('ShaderNodeTexSky')
sky.sky_type = 'NISHITA'; sky.sun_elevation = math.radians(38)
sky.sun_rotation = math.radians(135)
scene.world.node_tree.links.new(sky.outputs[0], scene.world.node_tree.nodes['Background'].inputs['Color'])
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .035

def node(tree, kind, name, xy):
    n = tree.nodes.new(kind); n.label = name; n.name = name; n.location = xy
    return n

water = bpy.data.materials.new('바다 · Musgrave Bump / 굴절 / 포말')
water.use_nodes = True
nt = water.node_tree; nt.nodes.clear(); link = nt.links.new
out = node(nt, 'ShaderNodeOutputMaterial', '물 표면', (1050, 200))
bs = node(nt, 'ShaderNodeBsdfPrincipled', '물 IOR 1.333 · 투과와 윤슬', (500, 260))
bs.inputs['Base Color'].default_value = (.035, .21, .33, 1)
bs.inputs['IOR'].default_value = 1.333
bs.inputs['Transmission Weight'].default_value = .96
bs.inputs['Roughness'].default_value = .17
bs.inputs['Specular IOR Level'].default_value = .5
tex = node(nt, 'ShaderNodeTexNoise', 'Musgrave fBM · Blender 4.1 이후 Noise 통합', (-800, 100))
tex.noise_dimensions = '4D'; tex.noise_type = 'FBM'; tex.normalize = False
tex.inputs['Scale'].default_value = 7
tex.inputs['Detail'].default_value = 5
tex.inputs['Roughness'].default_value = .58
tex.inputs['W'].driver_add('default_value').driver.expression = 'frame / 180'
bump = node(nt, 'ShaderNodeBump', '잔물결 · 메시 분할 없는 법선', (-220, 160))
bump.inputs['Strength'].default_value = .16
bump.inputs['Distance'].default_value = .035
link(tex.outputs['Fac'], bump.inputs['Height']); link(bump.outputs['Normal'], bs.inputs['Normal'])
glass = node(nt, 'ShaderNodeBsdfGlass', '연안 굴절 유리 · IOR 1.333', (480, -100))
glass.inputs['Color'].default_value = (.78, .97, .94, 1)
glass.inputs['IOR'].default_value = 1.333; glass.inputs['Roughness'].default_value = .12
link(bump.outputs['Normal'], glass.inputs['Normal'])
clear = node(nt, 'ShaderNodeMixShader', '투명 수면', (740, 200)); clear.inputs[0].default_value = .12
link(bs.outputs[0], clear.inputs[1]); link(glass.outputs[0], clear.inputs[2])
foam = node(nt, 'ShaderNodeAttribute', '포말 데이터 → 셰이더', (180, 640)); foam.attribute_name = 'foam'
white = node(nt, 'ShaderNodeBsdfPrincipled', '부서지는 흰 물거품', (480, 640))
white.inputs['Base Color'].default_value = (.91, .98, .97, 1)
white.inputs['Roughness'].default_value = .68
mix = node(nt, 'ShaderNodeMixShader', '포말과 물 혼합', (850, 450))
link(foam.outputs['Fac'], mix.inputs[0]); link(clear.outputs[0], mix.inputs[1]); link(white.outputs[0], mix.inputs[2]); link(mix.outputs[0], out.inputs['Surface'])

bpy.ops.mesh.primitive_plane_add()
ocean = bpy.context.object; ocean.name = '바다 · Ocean → Displace → 해안과 물보라'
ocean.data.materials.append(water)
oc = ocean.modifiers.new('Ocean · 고해상도 파도와 포말', 'OCEAN')
oc.geometry_mode = 'GENERATE'; oc.viewport_resolution = 12; oc.resolution = 16
oc.spatial_size = 48; oc.size = 1
oc.wave_scale = .55; oc.choppiness = .45; oc.wind_velocity = 7
oc.wave_scale_min = .025; oc.wave_alignment = .35
oc.use_normals = True; oc.use_foam = True; oc.foam_layer_name = 'ocean_foam'
oc.foam_coverage = .15; oc.use_spray = True; oc.spray_layer_name = 'spray_direction'
oc.time = 1; oc.keyframe_insert('time', frame=1)
oc.time = 11; oc.keyframe_insert('time', frame=241)
for f in ocean.animation_data.action.fcurves:
    for k in f.keyframe_points: k.interpolation = 'LINEAR'
dis = ocean.modifiers.new('Displace · 큰 물결 위의 부드러운 결', 'DISPLACE')
dt = bpy.data.textures.new('흑백 Musgrave 잔물결', type='MUSGRAVE')
dt.noise_scale = 1.3; dt.noise_intensity = .6
dis.texture = dt; dis.strength = .055; dis.mid_level = .5

# Ocean의 포말/물보라 속성, 해안 접촉, 시간에 따른 흐름을 실제 Geometry Nodes로 연결한다.
gn = bpy.data.node_groups.new('파도 흐름 · 해안 접촉 · 포말 · 물보라', 'GeometryNodeTree')
gn.interface.new_socket(name='Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
gn.interface.new_socket(name='Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
L = gn.links.new
inp = node(gn, 'NodeGroupInput', 'Ocean와 Displace', (-1000, 300))
end = node(gn, 'NodeGroupOutput', '수면과 물보라', (1150, 300))
pos = node(gn, 'GeometryNodeInputPosition', '해안 위치', (-1100, -100))
sep = node(gn, 'ShaderNodeSeparateXYZ', '해안선 X', (-900, -100)); L(pos.outputs[0], sep.inputs[0])
contact = node(gn, 'ShaderNodeMapRange', '해안 접촉 폭', (-700, -100))
contact.clamp = True
contact.inputs['From Min'].default_value = 16; contact.inputs['From Max'].default_value = 22
L(sep.outputs['X'], contact.inputs['Value'])
attr = node(gn, 'GeometryNodeInputNamedAttribute', 'Ocean 포말 읽기', (-800, 650)); attr.data_type = 'FLOAT'; attr.inputs['Name'].default_value = 'ocean_foam'
noise = node(gn, 'ShaderNodeTexNoise', '바람 따라 흐르는 결', (-850, -400)); noise.noise_dimensions = '4D'
noise.inputs['Scale'].default_value = 2
L(pos.outputs[0], noise.inputs['Vector'])
time = node(gn, 'GeometryNodeInputSceneTime', '흐르는 시간', (-1100, -550)); L(time.outputs['Seconds'], noise.inputs['W'])
mul = node(gn, 'ShaderNodeMath', '접촉면의 거품', (-400, -70)); mul.operation = 'MULTIPLY'
L(contact.outputs['Result'], mul.inputs[0]); L(noise.outputs['Fac'], mul.inputs[1])
maximum = node(gn, 'ShaderNodeMath', '물마루와 해안 거품 합치기', (-190, 600)); maximum.operation = 'MAXIMUM'
L(attr.outputs['Attribute'], maximum.inputs[0]); L(mul.outputs[0], maximum.inputs[1])
store = node(gn, 'GeometryNodeStoreNamedAttribute', 'foam 속성 기록', (40, 400)); store.domain = 'POINT'; store.data_type = 'FLOAT'; store.inputs['Name'].default_value = 'foam'
flow = node(gn, 'ShaderNodeMath', '흐르는 결의 높이', (-610, -420)); flow.operation = 'MULTIPLY_ADD'; flow.inputs[1].default_value = .025; flow.inputs[2].default_value = -.0125
L(noise.outputs['Fac'], flow.inputs[0])
damp = node(gn, 'ShaderNodeMath', '해안에서 파도 감쇠', (-610, -200)); damp.operation = 'MULTIPLY'; L(sep.outputs['Z'], damp.inputs[0]); L(contact.outputs[0], damp.inputs[1])
height = node(gn, 'ShaderNodeMath', '해안 감쇠와 흐름 합치기', (-390, -240)); height.operation = 'MULTIPLY_ADD'; height.inputs[1].default_value = -.55
L(damp.outputs[0], height.inputs[0]); L(flow.outputs[0], height.inputs[2])
vector = node(gn, 'ShaderNodeCombineXYZ', '수면의 흐름 방향', (-180, -240)); L(height.outputs[0], vector.inputs['Z'])
surface = node(gn, 'GeometryNodeSetPosition', '해안 접촉과 수면 흐름', (-190, 300)); L(inp.outputs[0], surface.inputs['Geometry']); L(vector.outputs[0], surface.inputs['Offset'])
L(surface.outputs[0], store.inputs['Geometry']); L(maximum.outputs[0], store.inputs['Value'])
coaststore = node(gn, 'GeometryNodeStoreNamedAttribute', 'coast_contact 속성 기록', (250, 400)); coaststore.domain = 'POINT'; coaststore.data_type = 'FLOAT'; coaststore.inputs['Name'].default_value = 'coast_contact'
L(store.outputs[0], coaststore.inputs['Geometry']); L(contact.outputs[0], coaststore.inputs['Value'])
density = node(gn, 'ShaderNodeMath', '포말에서만 드문 물보라', (10, -120)); density.operation = 'MULTIPLY'; density.inputs[1].default_value = .045; L(maximum.outputs[0], density.inputs[0])
points = node(gn, 'GeometryNodeDistributePointsOnFaces', '쇄파 물보라 입자', (250, 50))
L(coaststore.outputs[0], points.inputs['Mesh']); L(density.outputs[0], points.inputs['Density'])
sprayattr = node(gn, 'GeometryNodeInputNamedAttribute', 'Ocean 물보라 방향', (-150, -420)); sprayattr.data_type = 'FLOAT_VECTOR'; sprayattr.inputs['Name'].default_value = 'spray_direction'
offset = node(gn, 'ShaderNodeVectorMath', '바람에 날리는 물방울', (80, -420)); offset.operation = 'SCALE'; offset.inputs['Scale'].default_value = .16
L(sprayattr.outputs[0], offset.inputs[0])
lift = node(gn, 'GeometryNodeSetPosition', '물보라 띄우기', (470, 0)); L(points.outputs['Points'], lift.inputs['Geometry']); L(offset.outputs['Vector'], lift.inputs['Offset'])
ball = node(gn, 'GeometryNodeMeshIcoSphere', '작은 물방울', (250, -260)); ball.inputs['Radius'].default_value = .025; ball.inputs['Subdivisions'].default_value = 1
mat = node(gn, 'GeometryNodeSetMaterial', '물방울 재질', (470, -250)); mat.inputs['Material'].default_value = water; L(ball.outputs[0], mat.inputs['Geometry'])
instance = node(gn, 'GeometryNodeInstanceOnPoints', '물보라 인스턴스', (690, 30)); L(lift.outputs[0], instance.inputs['Points']); L(mat.outputs[0], instance.inputs['Instance'])
join = node(gn, 'GeometryNodeJoinGeometry', '수면과 입자 합치기', (920, 300)); L(coaststore.outputs[0], join.inputs[0]); L(instance.outputs[0], join.inputs[0]); L(join.outputs[0], end.inputs[0])
gm = ocean.modifiers.new('Geometry Nodes · 흐름과 해안 포말', 'NODES'); gm.node_group = gn

# 닫힌 수체에 흡수 체적을 넣는다. 수면 한 장에 체적을 붙이는 잘못된 형태를 피한다.
volume = bpy.data.materials.new('수심 · Volume Absorption'); volume.use_nodes = True
vt = volume.node_tree; vt.nodes.clear()
vo = node(vt, 'ShaderNodeOutputMaterial', '닫힌 수체의 체적', (300, 0))
absorb = node(vt, 'ShaderNodeVolumeAbsorption', '깊을수록 붉은 빛 흡수', (0, 0))
absorb.inputs['Color'].default_value = (.16, .64, .78, 1); absorb.inputs['Density'].default_value = .12
vt.links.new(absorb.outputs[0], vo.inputs['Volume'])
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, -15.4))
body = bpy.context.object; body.name = '닫힌 수체 · 깊이 30m'; body.dimensions = (48, 48, 30); body.data.materials.append(volume)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
sand = bpy.data.materials.new('햇빛이 비치는 모래와 바위'); sand.use_nodes=True
sand.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.48, .38, .22, 1)
sand.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .9
verts=[]; faces=[]
for y in range(33):
    for x in range(65):
        xx=-26+x*52/64; yy=-26+y*52/32
        zz=-.4-max(0,22-xx)**1.35*.12 + .12*math.sin(xx*.6)*math.cos(yy*.7)
        verts.append((xx,yy,zz))
for y in range(32):
    for x in range(64):
        a=y*65+x; faces.append((a,a+1,a+66,a+65))
mesh=bpy.data.meshes.new('깊어지는 해저'); mesh.from_pydata(verts,[],faces); mesh.update()
bed=bpy.data.objects.new('에메랄드빛 모래톱에서 심해까지',mesh); scene.collection.objects.link(bed); bed.data.materials.append(sand)

bpy.ops.object.light_add(type='SUN', location=(-10,-8,18)); sun=bpy.context.object; sun.name='윤슬의 햇빛'; sun.rotation_euler=(.35,-.5,-.6); sun.data.energy=2.5; sun.data.angle=.09
bpy.ops.object.camera_add(location=(0,-13,38)); cam=bpy.context.object
cam.rotation_euler=(Vector((0,0,-1))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO'; cam.data.ortho_scale=39; scene.camera=cam

# Ocean의 실제 평가 메시에서 법선과 포말을 읽는다. 런타임은 작은 결만 사용해 기존 선박 높이와 맞춘다.
gm.show_viewport=False; gm.show_render=False; dis.show_viewport=False; dis.show_render=False
oc.choppiness=0
dep=bpy.context.evaluated_depsgraph_get(); obj=ocean.evaluated_get(dep); me=obj.to_mesh()
base=np.array([tuple(v.co) for v in me.vertices]); order=np.lexsort((base[:,0],base[:,1])); obj.to_mesh_clear()
# 변형 뒤 좌표로 다시 정렬하면 수평 변위가 있는 파도의 행/열이 섞인다. 원래 격자 순서를 유지한다.
oc.choppiness=.65
N=128; FRAMES=12; pixels=[]; stats=[]
for frame in range(FRAMES):
    scene.frame_set(1+frame*8)
    dep=bpy.context.evaluated_depsgraph_get(); obj=ocean.evaluated_get(dep); me=obj.to_mesh()
    v=np.array([tuple(v.co) for v in me.vertices]); normals=np.array([tuple(v.normal) for v in me.vertices])
    side=round(math.sqrt(len(v)))
    assert side*side==len(v), len(v)
    norm=normals[order].reshape(side,side,3)
    fa=me.attributes.get('ocean_foam'); assert fa is not None
    raw=np.array([d.color[0] for d in fa.data]) if fa.data_type in ('FLOAT_COLOR','BYTE_COLOR') else np.array([d.value for d in fa.data])
    if fa.domain=='CORNER':
        accum=np.zeros(len(v)); counts=np.zeros(len(v))
        ids=np.array([l.vertex_index for l in me.loops]); np.add.at(accum,ids,raw); np.add.at(counts,ids,1); raw=accum/np.maximum(counts,1)
    foamgrid=raw[order].reshape(side,side)
    idx=np.arange(N)*((side-1)/N); lo=idx.astype(int); hi=lo+1; f=idx-lo
    def sample(a):
        return ((a[lo[:,None],lo[None,:]]*(1-f[None,:])+a[lo[:,None],hi[None,:]]*f[None,:])*(1-f[:,None])+
                (a[hi[:,None],lo[None,:]]*(1-f[None,:])+a[hi[:,None],hi[None,:]]*f[None,:])*f[:,None])
    slopes=-norm[:,:,:2]/np.maximum(norm[:,:,2:3],.05)
    rgba=np.zeros((N,N,4),dtype=np.uint8)
    for c in range(2): rgba[:,:,c]=np.round(np.clip(sample(slopes[:,:,c])*.5+.5,0,1)*255)
    # 평온한 수면의 기저 거품값을 빼고 쇄파 구간을 8비트 범위로 옮긴다.
    rgba[:,:,2]=np.round(np.clip((sample(foamgrid)-.012)/.14,0,1)*255); rgba[:,:,3]=255
    pixels.append(rgba.tobytes()); stats.append({'frame':frame,'vertices':len(v),'foamMin':float(raw.min()),'foamMax':float(raw.max()),'foamStd':float(raw.std()),'slopeMax':float(np.abs(slopes).max())})
    obj.to_mesh_clear()
    print('OCEAN_BAKE',frame,stats[-1],flush=True)
payload=base64.b64encode(b''.join(pixels)).decode('ascii')
dest=ROOT/'js/data/ocean_baked.js'
dest.write_text("/* Blender Ocean 실측 법선 RG·포말 B. tools/ocean_blender/build.py로 재생성. */\n(function (G) { 'use strict';\nG.OceanBaked = "+json.dumps({'size':N,'frames':FRAMES,'seconds':4,'data':payload},separators=(',',':'))+";\n})(window.G = window.G || {});\n",encoding='utf8')
(OUT/'bake-report.json').write_text(json.dumps({'blender':bpy.app.version_string,'resolution':16,'textureSize':N,'frames':stats,'bytes':sum(map(len,pixels))},indent=2),encoding='utf8')
oc.choppiness=.45; gm.show_viewport=True; gm.show_render=True; dis.show_viewport=True; dis.show_render=True
scene.frame_set(48)
for p in ocean.data.polygons: p.use_smooth=True
scene['작업 안내']='Ocean 해상도 16 / Musgrave fBM→Bump / IOR 1.333 / 닫힌 흡수 수체 / foam 속성 / 물보라 Geometry Nodes'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'emerald_ocean.blend'))
if '--render' in sys.argv:
    scene.render.filepath=str(OUT/'blender-preview.png'); bpy.ops.render.render(write_still=True)
print('OCEAN_DONE',dest,flush=True)
