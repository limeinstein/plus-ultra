"""작성된 원본의 폭포 상단 식생과 절벽 재질을 정리해 네 모형만 다시 굽는다."""
import bpy,math
from pathlib import Path
from mathutils import Vector
OUT=Path(__file__).resolve().parents[2]/'artifacts/world-detail-20261125/blender'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'natural-landmarks.blend'));sc=bpy.context.scene
try:
 p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='CUDA';p.get_devices()
 for d in p.devices:d.use=d.type=='CUDA'
 sc.cycles.device='GPU'
except Exception:pass
grass=bpy.data.materials.get('같은 녹색의 낮은 식생');rock=bpy.data.materials.get('풍화된 회색 암벽')
groups=[c for c in sc.collection.children if c.name.startswith(('수목 /','자연경관 /'))]
for ident in ['iguazu','gullfoss','nachi']:
 c=next(c for c in groups if ' / '+ident+' / ' in c.name)
 for cc in groups:cc.hide_render=cc!=c;cc.hide_viewport=cc!=c
 for o in list(c.objects):
  if ident=='gullfoss' and o.name.startswith('숲의 군락'):c.objects.unlink(o)
  if o.type=='MESH' and o.name.startswith('연결된 골짜기와 능선'):
   o.data.materials.clear();o.data.materials.append(grass);o.data.materials.append(rock)
   for f in o.data.polygons:f.material_index=0 if f.normal.z>.65 else 1
 aim=Vector((0,0,1.1));cam=sc.camera;cam.location=aim+Vector((5,-8,7));cam.rotation_euler=(aim-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=7.6
 sc.render.resolution_x=512;sc.render.resolution_y=512;sc.render.filepath=str(OUT/('wonder-'+ident+'.png'));bpy.ops.render.render(write_still=True)
for c in groups:c.hide_render=' / fuji / ' not in c.name;c.hide_viewport=c.hide_render
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'natural-landmarks.blend'),compress=True)
