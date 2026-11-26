"""갈대·억새 및 곡물 이삭의 높이와 실루엣을 Blender에서 만든다."""
import json
import math
import random
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0,str(Path(__file__).resolve().parent))
from blender_helpers import cylinder_between, mat, mesh

OUT = Path(__file__).resolve().parents[2]/'artifacts/world-detail-20261125/blender'
SOURCE = 'plain-tall-plants-blended.blend'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'rock-variety.blend'))
scene = bpy.context.scene
scene.cycles.samples = 20
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x = scene.render.resolution_y = 448
scene.render.resolution_percentage = 100

stem = mat('초지의 차분한 줄기',(.13,.153,.068),(.251,.277,.131),11,bump=.003)
leaf = mat('큰 풀의 올리브색 잎',(.115,.143,.063),(.226,.264,.116),11,bump=.004)
reed = mat('물가 갈대의 짙은 꽃차례',(.19,.132,.074),(.32,.244,.137),9,bump=.006)
silver = mat('억새의 차분한 베이지색 꽃차례',(.255,.233,.151),(.433,.387,.252),11,bump=.004)
grain = mat('이삭의 차분한 황금색',(.247,.198,.102),(.424,.357,.177),10,bump=.003)


class Patch:
    def __init__(self,kind,seed):
        self.kind = kind
        self.rng = random.Random(seed)
        self.vertices,self.faces,self.ids = [],[],[]

    def stick(self,a,b,root,tip,material=0):
        cylinder_between(self.vertices,self.faces,self.ids,a,b,root,tip,material,5)

    def blade(self,root,angle,length,width,rise):
        axis = Vector((math.cos(angle),math.sin(angle),0))
        side = Vector((-axis.y,axis.x,0))
        start = len(self.vertices)
        for t in (0,.32,.62,1):
            w = width*math.sin(.2+t*2.94)
            p = root+axis*length*t+Vector((0,0,rise*t-.31*t*t))
            self.vertices.extend((tuple(p-side*w),tuple(p+Vector((0,0,w*.28))),tuple(p+side*w)))
        for row in range(3):
            for col in range(2):
                i = start+row*3+col
                self.faces.append((i,i+1,i+4,i+3))
                self.ids.append(1)

    def plume(self,top,lean):
        rng = self.rng
        length = .24 if self.kind=='miscanthus' else .22
        tip = top+Vector((lean,.02,length))
        self.stick(top,tip,.021,.003,2)
        for i in range(14):
            angle = i*2.399+rng.uniform(-.28,.28)
            t = .08+.76*i/14
            root = top.lerp(tip,t)
            spread = (.075 if self.kind=='miscanthus' else .046)*(1-t*.67)
            branch = root+Vector((math.cos(angle)*spread,math.sin(angle)*spread,.067+(1-t)*.037))
            self.stick(root,branch,.011,.003,2)
            self.stick(branch,branch+Vector((math.cos(angle)*.020,math.sin(angle)*.020,.043)),.006,.001,2)

    def ear(self,top):
        barley = self.kind=='barley'
        for i in range(11 if barley else 9):
            phase = i*2.399
            to_side = Vector((math.cos(phase),math.sin(phase),0))
            p = top+Vector((0,0,i*.026))
            kernel = p+to_side*(.027 if barley else .039)+Vector((0,0,.062))
            self.stick(p,kernel,.019 if barley else .026,.006,2)
            if barley:
                tip = kernel+to_side*.024+Vector((0,0,.135+self.rng.random()*.11))
                self.stick(kernel,tip,.005,.0014,2)

    def grow(self,x,y,h):
        rng = self.rng
        lean = rng.uniform(.04,.19) if self.kind in ('reed-tall','miscanthus') else rng.uniform(-.07,.10)
        base = Vector((x,y,0))
        middle = base+Vector((lean*.33,0,h*.59))
        top = base+Vector((lean,rng.uniform(-.11,.11),h))
        self.stick(base,middle,.013,.010)
        self.stick(middle,top,.010,.006)
        for i in range(4):
            root = base.lerp(middle,.15+i*.23)
            self.blade(root,rng.uniform(0,math.tau),rng.uniform(.18,.52),rng.uniform(.025,.049),rng.uniform(.28,.62))
        if self.kind in ('reed-tall','miscanthus'):
            self.plume(top,lean*.39)
        else:
            self.ear(top)


def make_patch(kind,variant,collection,top_material):
    patch = Patch(kind,927+variant*72+len(kind)*117)
    rng = patch.rng
    if kind in ('barley','wheat'):
        # 가운데로 치우친 줄과 소실된 포기가 있어 작은 밭 모양이 읽힌다.
        for row in range(4):
            for col in range(9):
                x,y = (col-4)*.18+rng.uniform(-.08,.08),(row-1.5)*.19+rng.uniform(-.075,.075)
                edge = min(1,abs(x)*.8+abs(y))
                if rng.random()<.12+.25*edge:continue
                h = rng.uniform(.52,.86) if kind=='wheat' else rng.uniform(.53,.91)
                patch.grow(x,y,h*(1-.22*edge))
    else:
        for _ in range(23):
            a,r = rng.uniform(0,math.tau),math.sqrt(rng.random())
            x,y = math.cos(a)*r*.67,math.sin(a)*r*.39
            h = rng.uniform(.39,1.15)*(1-r*.36)
            patch.grow(x,y,h)
    obj = mesh('줄기와 이삭',patch.vertices,patch.faces,[stem,leaf,top_material])
    for face,material in zip(obj.data.polygons,patch.ids):
        face.material_index = material
    for group in list(obj.users_collection):
        group.objects.unlink(obj)
    collection.objects.link(obj)


camera = scene.camera
target = Vector((0,0,.47))
camera.location = target+Vector((4,-8,8))
camera.rotation_euler = (target-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.ortho_scale = 2.8
added = []
first = None
for kind,label,material in [('reed-tall','갈대',reed),('miscanthus','억새',silver),('barley','보리',grain),('wheat','밀',grain)]:
    for variant in range(2):
        collection = bpy.data.collections.new(f'큰 풀과 곡물 / {label} / {variant+1}')
        scene.collection.children.link(collection)
        first=first or collection
        make_patch(kind,variant,collection,material)
        for group in scene.collection.children:
            if group.name.startswith(('수목 /','지형 부품 /','환경 시안 /','보정 산형 /','지역 식생 /','바위 부품 /','큰 풀과 곡물 /')):
                group.hide_render = group.hide_viewport = group!=collection
        key=f'detail-{kind}-{variant}'
        scene.render.filepath=str(OUT/(key+'.png'))
        bpy.ops.render.render(write_still=True)
        added.append({'id':key,'collection':collection.name,'size':448,'source':SOURCE})

for group in scene.collection.children:
    if group.name.startswith('큰 풀과 곡물 /'):
        group.hide_render = group.hide_viewport = group!=first
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/SOURCE),compress=True)
file=OUT/'frames.json'
frames=json.loads(file.read_text(encoding='utf8'))
keys={row['id'] for row in added}
file.write_text(json.dumps([row for row in frames if row['id'] not in keys]+added,ensure_ascii=False,indent=2),encoding='utf8')
