"""최종 같은 조명으로 수목을 맞추고, 모래 부품의 사각 받침과 물가의 면 단위 색 경계를 없앤다."""
import bpy,math,json,random
from pathlib import Path
from mathutils import Vector
OUT=Path(__file__).resolve().parents[2]/'artifacts/world-detail-20261125/blender';STUDY=OUT.parent/'biomes'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'biome-assets.blend'));sc=bpy.context.scene
try:
 p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='CUDA';p.get_devices()
 for d in p.devices:d.use=d.type=='CUDA'
 sc.cycles.device='GPU'
except Exception:pass
sc.cycles.samples=24;sc.cycles.use_denoising=True
frames=json.loads((OUT/'frames.json').read_text(encoding='utf-8'));updates=[]
def show(c):
 for cc in sc.collection.children:
  if cc.name.startswith(('수목 /','지형 부품 /','환경 시안 /')):cc.hide_render=cc!=c;cc.hide_viewport=cc!=c
def camera(target,scale):
 target=Vector(target);cam=sc.camera;cam.location=target+Vector((4,-8,8));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale
def bake(c,key,scale,target,size):
 show(c);camera(target,scale);sc.render.film_transparent=True;sc.render.resolution_x=sc.render.resolution_y=size;sc.render.filepath=str(OUT/(key+'.png'));bpy.ops.render.render(write_still=True);updates.append({'id':key,'collection':c.name,'size':size,'source':'biome-assets.blend'});print('FINAL_ASSET '+key,flush=True)
desert=bpy.data.materials['밝은 마른 모래'].copy();desert.name='사하라의 따뜻한 금빛 모래'
for n in desert.node_tree.nodes:
 if n.type=='VALTORGB':
  n.color_ramp.elements[0].color=(.40,.235,.075,1);n.color_ramp.elements[1].color=(.65,.43,.17,1)
seen=set()
for c in sc.collection.children:
 if not (c.name.startswith('지형 부품 / dune') or c.name=='환경 시안 / desert'):continue
 for o in c.objects:
  if o.type!='MESH' or '모래' not in ''.join(m.name for m in o.data.materials if m):continue
  if o.data not in seen:
   seen.add(o.data);o.data.materials.clear();o.data.materials.append(desert)
   if '바람받이' in o.name:
    edge=o.data.attributes.new('dune_edge','FLOAT','POINT')
    for v,a in zip(o.data.vertices,edge.data):t=max(0,min(1,(1-max(abs(v.co.x)/2.5,abs(v.co.y)/1.6))/.18));a.value=t*t*(3-2*t)
    m=desert.copy();m.name='지면으로 스며드는 사구 모래';nt=m.node_tree;n=nt.nodes.new('ShaderNodeAttribute');n.attribute_name='dune_edge';nt.links.new(n.outputs['Fac'],nt.nodes.get('Principled BSDF').inputs['Alpha']);o.data.materials[0]=m
for c in sc.collection.children:
 if not c.name.startswith('환경 시안 /'):continue
 kind=c.name.split('/')[1].strip()
 for o in c.objects:
  if o.type!='MESH' or not o.name.startswith('한 지면'):continue
  if kind not in ['beach','cove','temperate-beach','oasis','mangrove','tropical']:continue
  attr=o.data.attributes.new('shore_distance','FLOAT','POINT')
  for v,a in zip(o.data.vertices,attr.data):
   x,y,z=v.co
   if kind=='oasis':d=math.hypot(x*.9,y*1.2)-.88
   elif kind in ['beach','cove','temperate-beach']:d=y+1.65+.45*math.sin(x*.65)+(.35*math.cos(x*1.7) if kind=='cove' else 0)
   elif kind=='mangrove':d=.4+.7*math.sin(x*.75+y*.4)-abs(y*.30)
   else:d=abs(y-.65*math.sin(x*.55))-.44
   a.value=d
  m=o.data.materials[0].copy();nt=m.node_tree;p=nt.nodes.get('Principled BSDF');original=p.inputs['Base Color'].links[0].from_socket
  n=nt.nodes.new('ShaderNodeAttribute');n.attribute_name='shore_distance';ramp=nt.nodes.new('ShaderNodeMapRange');ramp.inputs['From Min'].default_value=-.04;ramp.inputs['From Max'].default_value=.28;ramp.clamp=True;nt.links.new(n.outputs['Fac'],ramp.inputs['Value']);mix=nt.nodes.new('ShaderNodeMixRGB');mix.inputs[1].default_value=(.19,.21,.14,1);nt.links.new(original,mix.inputs[2]);nt.links.new(ramp.outputs[0],mix.inputs[0]);nt.links.new(mix.outputs[0],p.inputs['Base Color']);o.data.materials.clear();o.data.materials.append(m)
  for f in o.data.polygons:f.material_index=0
for c in sc.collection.children:
 if c.name.startswith('수목 /'):
  _,form,variant=[x.strip() for x in c.name.split('/')];bake(c,'tree-'+form+'-'+variant,3,(0,0,1),384)
for variant in range(2):bake(bpy.data.collections['지형 부품 / dune / '+str(variant)],'detail-dune-'+str(variant),6.3,(0,0,.45),512)
# 시안은 참조 장면이며 실제 게임 캡처와 별도로 제공한다.
for c in sc.collection.children:
 if not c.name.startswith('환경 시안 /'):continue
 kind=c.name.split('/')[1].strip();show(c);camera((0,0,.5),13.5);sc.render.film_transparent=False;sc.render.resolution_x=1280;sc.render.resolution_y=900;sc.render.filepath=str(STUDY/(kind+'.png'));bpy.ops.render.render(write_still=True);print('FINAL_STUDY '+kind,flush=True)
show(bpy.data.collections['환경 시안 / tropical']);camera((0,0,.5),13.5)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'biome-assets.blend'),compress=True)
replace={r['id'] for r in updates};frames=[r for r in frames if r['id'] not in replace]+updates;(OUT/'frames.json').write_text(json.dumps(frames,ensure_ascii=False,indent=2),encoding='utf-8')
print('TERRAIN_ART_FINISHED',flush=True)
