"""두 번째 미술 검토: 층이 있는 수관과 실제 산의 경사 재질을 원본 모형에 반영한다."""
import bpy,sys,math,random
from pathlib import Path
from mathutils import Vector,noise
sys.path.insert(0,str(Path(__file__).parent))
from blender_helpers import make_tree,make_palm
OUT=Path(__file__).resolve().parents[2]/'artifacts/world-detail-20261125/blender'
def setup():
 sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.samples=24;sc.cycles.use_denoising=True
 try:
  p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='CUDA';p.get_devices()
  for d in p.devices:d.use=d.type=='CUDA'
  sc.cycles.device='GPU'
 except Exception:pass
 sc.render.film_transparent=True;sc.render.image_settings.file_format='PNG';sc.render.resolution_x=512;sc.render.resolution_y=512
 return sc
def view(target,scale):
 cam=bpy.context.scene.camera;target=Vector(target);cam.location=target+Vector((4,-8,8));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale
def only(collection):
 for c in bpy.context.scene.collection.children:
  if c.name.startswith(('수목 /','자연경관 /')):c.hide_render=c!=collection;c.hide_viewport=c!=collection
def render(c,key):
 only(c);bpy.context.scene.render.filepath=str(OUT/(key+'.png'));bpy.ops.render.render(write_still=True);print('REFINED '+key,flush=True)
bpy.ops.wm.open_mainfile(filepath=str(OUT/'regional-vegetation.blend'));sc=setup()
bark=bpy.data.materials['통일된 회갈색 수피'];leaves=[bpy.data.materials['숲의 공통 녹색 명암 '+str(k)] for k in range(4)]
for c in list(sc.collection.children):
 if not c.name.startswith('수목 /'):continue
 _,form,v=[x.strip() for x in c.name.split('/')];variant=int(v)
 if form not in ['palm','bamboo']:
  for obj in list(c.objects):bpy.data.objects.remove(obj,do_unlink=True)
  o=make_tree('pine' if form in ['pine','cedar'] else 'broad',100+variant,bark,leaves)
  for vertex in o.data.vertices:
   x,y,z=vertex.co
   if form in ['umbrella','acacia']:vertex.co=(x*1.40,y*1.40,z if z<.65 else .65+(z-.65)*.48)
   elif form=='cedar':vertex.co=(x*1.40,y*1.40,z*.92)
   elif form=='tropical':vertex.co=(x*1.10,y*1.10,z*1.18)
   elif form=='poplar':vertex.co=(x*.47,y*.47,z*1.45)
   elif form=='mangrove':vertex.co=(x*.92,y*.92,z*.70+.14)
  for old in list(o.users_collection):old.objects.unlink(o)
  c.objects.link(o);o.hide_render=False;o.hide_viewport=False
  o.name='지면과 연결되는 층진 수관 / '+form
 view((0,0,1),3.0);render(c,'tree-'+form+'-'+str(variant))
target=bpy.data.collections['수목 / oak / 0'];only(target);view((0,0,1),3.0)
sc['revision']='2026-11-25 두 번째 검토: 낮은 가지·층진 수관·같은 녹색'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'regional-vegetation.blend'),compress=True)

bpy.ops.wm.open_mainfile(filepath=str(OUT/'natural-landmarks.blend'));sc=setup()
for c in list(sc.collection.children):
 if not c.name.startswith('자연경관 /') or not c.name.endswith('ETOPO'):continue
 ident=c.name.split('/')[1].strip();o=next((x for x in c.objects if x.name.startswith('연결된 골짜기')),None)
 if not o:continue
 m=o.data.materials[0];nt=m.node_tree;p=nt.nodes.get('Principled BSDF')
 original=p.inputs['Base Color'].links[0].from_socket
 geo=nt.nodes.new('ShaderNodeNewGeometry');normal=nt.nodes.new('ShaderNodeSeparateXYZ');nt.links.new(geo.outputs['Normal'],normal.inputs[0])
 slope=nt.nodes.new('ShaderNodeMapRange');slope.inputs['From Min'].default_value=.86;slope.inputs['From Max'].default_value=.54;slope.clamp=True;nt.links.new(normal.outputs['Z'],slope.inputs['Value'])
 # 급사면은 풀 대신 차가운 회색 암반. 고도별 눈과 초지는 기존 재질을 그대로 보존한다.
 blend=nt.nodes.new('ShaderNodeMixRGB');nt.links.new(original,blend.inputs[1]);blend.inputs[2].default_value=(.27,.275,.26,1);nt.links.new(slope.outputs[0],blend.inputs[0]);nt.links.new(blend.outputs[0],p.inputs['Base Color'])
 tex=nt.nodes.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=7;tex.inputs['Detail'].default_value=3;tex.inputs['Roughness'].default_value=.75
 bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.32;bump.inputs['Distance'].default_value=.095;nt.links.new(tex.outputs['Fac'],bump.inputs['Height']);nt.links.new(bump.outputs[0],p.inputs['Normal'])
 # 실제 DEM의 큰 윤곽은 보존하고, 암반 입자의 미술용 표면 요철만 얹는다.
 for v in o.data.vertices:
  x,y,z=v.co;edge=min(1,max(0,(2.95-math.hypot(x,y))/.65));rough=noise.fractal(Vector((x*8,y*8,2)),1.0,2.0,3)
  v.co.z+=rough*.035*edge*min(1,max(0,(z-.40)/.45))
 o.data.update();c['art_revision']='실제 고도 윤곽 + 경사 암반 + 미술용 작은 풍화 요철'
 view((0,0,1),7.3);render(c,'wonder-'+ident)
only(bpy.data.collections['자연경관 / fuji / ETOPO']);view((0,0,1),7.3)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'natural-landmarks.blend'),compress=True)
print('FOREST_MOUNTAIN_REFINEMENT_DONE',flush=True)
