"""저장된 Blender 원본에서 두 폭포만 교체·렌더한다."""
import bpy,sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from blender_waterfalls import build_waterfall
OUT=Path(__file__).resolve().parents[2]/'artifacts/world-detail-20261125/blender'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'natural-landmarks.blend'));sc=bpy.context.scene
try:
 p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='CUDA';p.get_devices()
 for d in p.devices:d.use=d.type=='CUDA'
 sc.cycles.device='GPU'
except Exception:pass
src=next(o for o in bpy.data.objects if o.name.startswith('지역 수종 tropical'))
def tree(c,form,x,y,z,s,k):
 o=bpy.data.objects.new('숲의 군락',src.data);c.objects.link(o);o.location=(x,y,z);o.scale=(s,)*3;o.rotation_euler[2]=k*2.399
groups=[c for c in sc.collection.children if c.name.startswith(('수목 /','자연경관 /'))]
for ident in ['iguazu','gullfoss']:
 c=next(c for c in groups if ' / '+ident+' / ' in c.name)
 for o in list(c.objects):c.objects.unlink(o)
 for cc in groups:cc.hide_render=cc!=c;cc.hide_viewport=cc!=c
 build_waterfall(c,ident,tree);aim=Vector((0,0,.75));cam=sc.camera;cam.location=aim+Vector((5,-8,7));cam.rotation_euler=(aim-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=6.2
 sc.render.filepath=str(OUT/('wonder-'+ident+'.png'));bpy.ops.render.render(write_still=True)
for c in groups:c.hide_render=' / fuji / ' not in c.name;c.hide_viewport=c.hide_render
aim=Vector((0,0,1));cam=sc.camera;cam.location=aim+Vector((5,-8,7));cam.rotation_euler=(aim-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=7.6
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'natural-landmarks.blend'),compress=True)
