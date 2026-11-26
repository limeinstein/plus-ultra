"""원본을 처음 열면 모형 하나가 보이도록 한다. 다른 모형은 이름 붙인 모음에서 켤 수 있다."""
import bpy
from mathutils import Vector
from pathlib import Path
OUT=Path(__file__).resolve().parents[2]/'artifacts/world-detail-20261125/blender'
for file,target in [('regional-vegetation.blend','수목 / oak / 0'),('natural-landmarks.blend','자연경관 / fuji / ETOPO')]:
 bpy.ops.wm.open_mainfile(filepath=str(OUT/file))
 for c in bpy.context.scene.collection.children:
  if c.name.startswith(('수목 /','자연경관 /')):c.hide_render=c.name!=target;c.hide_viewport=c.name!=target
 cam=bpy.context.scene.camera;aim=Vector((0,0,1.05 if file.startswith('regional') else 1));cam.location=aim+Vector((5,-8,7));cam.rotation_euler=(aim-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=2.8 if file.startswith('regional') else 7.6
 for screen in bpy.data.screens:
  for area in screen.areas:
   if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA'
 bpy.ops.wm.save_as_mainfile(filepath=str(OUT/file),compress=True)
print('EDITABLE_ORIGINALS_ORGANIZED')
