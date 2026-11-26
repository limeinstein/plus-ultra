"""산 모형의 원형 받침대를 없애고 주변 땅으로 스며드는 산기슭으로 바꾼다."""
import bpy,math,sys
from pathlib import Path
from mathutils import Vector,noise
OUT=Path(__file__).resolve().parents[2]/'artifacts/world-detail-20261125/blender'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'natural-landmarks.blend'));sc=bpy.context.scene
try:
 prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='CUDA';prefs.get_devices()
 for d in prefs.devices:d.use=d.type=='CUDA'
 sc.cycles.device='GPU'
except Exception:pass
sc.cycles.samples=24;sc.render.resolution_x=768;sc.render.resolution_y=768
for c in list(sc.collection.children):
 if not c.name.startswith('자연경관 /') or not c.name.endswith('ETOPO'):continue
 ident=c.name.split('/')[1].strip();o=next(x for x in c.objects if x.name.startswith('연결된 골짜기'))
 for t in list(c.objects):
  if t!=o and t.name.startswith('숲의 군락'):bpy.data.objects.remove(t,do_unlink=True)
 attr=o.data.attributes.new('mountain_edge','FLOAT','POINT')
 for v,a in zip(o.data.vertices,attr.data):
  r=math.hypot(v.co.x,v.co.y);t=max(0,min(1,(2.95-r)/1.35));fade=t*t*(3-2*t)
  v.co.z=.025+(v.co.z-.025)*fade
  t=max(0,min(1,(2.65-r+noise.noise_vector(Vector((v.co.x*3,v.co.y*3,2))).x*.12)/.85));a.value=t*t*(3-2*t)
 o.data.update();m=o.data.materials[0];nt=m.node_tree;p=nt.nodes.get('Principled BSDF');edge=nt.nodes.new('ShaderNodeAttribute');edge.attribute_name='mountain_edge';nt.links.new(edge.outputs['Fac'],p.inputs['Alpha'])
 for n in nt.nodes:
  if n.type=='MIX_RGB':
   if not n.inputs[1].is_linked and tuple(round(x,2) for x in n.inputs[1].default_value[:3])==(.12,.18,.04):n.inputs[1].default_value=(.15,.18,.09,1)
 for other in sc.collection.children:
  if other.name.startswith(('수목 /','자연경관 /')):other.hide_render=other!=c;other.hide_viewport=other!=c
 cam=sc.camera;target=Vector((0,0,.95));cam.location=target+Vector((4,-8,8));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=6.2
 sc.render.filepath=str(OUT/('wonder-'+ident+'.png'));bpy.ops.render.render(write_still=True);print('SOFT_MOUNTAIN '+ident,flush=True)
for c in sc.collection.children:
 if c.name.startswith(('수목 /','자연경관 /')):c.hide_render=' / fuji / ' not in c.name;c.hide_viewport=c.hide_render
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'natural-landmarks.blend'),compress=True)
print('MOUNTAIN_FOOTPRINTS_DONE',flush=True)
