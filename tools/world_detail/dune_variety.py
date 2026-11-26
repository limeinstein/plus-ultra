"""게임이 쓰는 사구 높이 판을 읽어 편집 가능한 Blender 메시로 저장한다."""
import array
import subprocess
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'artifacts/world-detail-20261125/blender/dune-variety.blend'
sys.path.insert(0, str(Path(__file__).resolve().parent))
from blender_helpers import mat, mesh

side = 256
source = r"""
const fs=require('fs'), vm=require('vm'), ctx={window:{}};
vm.runInNewContext(fs.readFileSync(process.argv[1],'utf8'),ctx);
const heights=ctx.window.G.TerrainMaterials.duneHeights(Number(process.argv[2]));
process.stdout.write(Buffer.from(heights.buffer));
"""
heights = array.array('f')
heights.frombytes(subprocess.check_output(['node','-e',source,str(ROOT/'js/art/terrain_materials.js'),str(side)]))
assert len(heights)==side*side

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
sand = mat('따뜻한 모래',(.45,.28,.13),(.62,.43,.22),10,bump=.004)
vertices,faces = [],[]
step = side+1
for y in range(step):
    for x in range(step):
        z=heights[(y%side)*side+x%side]
        vertices.append((12*(x/side-.5),12*(.5-y/side),1.65*z))
for y in range(side):
    for x in range(side):
        a=y*step+x
        faces.append((a,a+step,a+step+1,a+1))
obj = mesh('게임의 사구 높이 판',vertices,faces,[sand])
for face in obj.data.polygons:
    face.use_smooth = True
obj['설명']='초승달·굽은 능선·별사구·낮은 언덕을 한 판에 배치한 원형. 게임은 이 높이에서 법선을 만들고 지형에 두 크기로 섞어 그린다.'
bpy.ops.object.camera_add(location=(9,-14,17))
camera = bpy.context.object
camera.rotation_euler = (-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO'
camera.data.ortho_scale=18
scene.camera=camera
bpy.ops.object.light_add(type='SUN', location=(-6,2,5))
sun=bpy.context.object
sun.rotation_euler = (-sun.location).to_track_quat('-Z','Y').to_euler()
sun.data.energy=2.4
scene.world=bpy.data.worlds.new('밝은 사막 하늘')
scene.world.color=(.34,.36,.39)
scene.render.resolution_x,scene.render.resolution_y=1100,850
scene.render.resolution_percentage=100
for area in bpy.context.screen.areas if bpy.context.screen else []:
    if area.type=='VIEW_3D':
        area.spaces.active.region_3d.view_rotation=camera.rotation_euler.to_quaternion()
        area.spaces.active.region_3d.view_distance=18
bpy.context.view_layer.objects.active=obj
sun.select_set(False)
obj.select_set(True)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT),compress=True)
