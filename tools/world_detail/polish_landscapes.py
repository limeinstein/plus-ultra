"""사진의 층진 정글·침식 암벽·사구를 같은 부품과 팔레트로 보강한다. 첫 제작 뒤 한 번 실행."""
import bpy,math,random,json,sys
from pathlib import Path
from mathutils import Vector,noise
sys.path.insert(0,str(Path(__file__).parent))
from blender_helpers import mesh,mat,instance,cylinder_between
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'artifacts/world-detail-20261125/blender';STUDY=OUT.parent/'biomes'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'biome-assets.blend'));sc=bpy.context.scene
try:
 p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='CUDA';p.get_devices()
 for d in p.devices:d.use=d.type=='CUDA'
 sc.cycles.device='GPU'
except Exception:pass
sc.cycles.samples=32;sc.cycles.use_denoising=True
sc.world.use_nodes=True;bg=sc.world.node_tree.nodes.get('Background');bg.inputs['Color'].default_value=(.65,.74,.82,1);bg.inputs['Strength'].default_value=.48
for light in [x for x in sc.objects if x.type=='LIGHT']:
 if '주광' in light.name:light.data.energy=950;light.data.size=4
frames=json.loads((OUT/'frames.json').read_text(encoding='utf-8'));added=[]
def move(o,c):
 for old in list(o.users_collection):old.objects.unlink(o)
 c.objects.link(o);o.hide_render=False;o.hide_viewport=False;return o
def group(name):
 c=bpy.data.collections.new(name);sc.collection.children.link(c);return c
def clone(src,c,loc=(0,0,0),scale=1,angle=0):return move(instance(src,src.name+' / 새 배치',loc,(scale,)*3,angle),c)
def show(c):
 for cc in sc.collection.children:
  if cc.name.startswith(('수목 /','지형 부품 /','환경 시안 /')):cc.hide_render=cc!=c;cc.hide_viewport=cc!=c
def camera(target,scale):
 target=Vector(target);cam=sc.camera;cam.location=target+Vector((4,-8,8));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale
def render(c,key,scale=3,target=(0,0,1),size=512):
 show(c);camera(target,scale);sc.render.film_transparent=True;sc.render.resolution_x=sc.render.resolution_y=size;sc.render.filepath=str(OUT/(key+'.png'));bpy.ops.render.render(write_still=True);added.append({'id':key,'size':size,'collection':c.name,'source':'biome-assets.blend'});print('POLISHED '+key,flush=True)
leaf=bpy.data.materials['숲의 공통 녹색 명암 1'];bark=bpy.data.materials['통일된 회갈색 수피'];rock=bpy.data.materials['청회색 화강암과 절리'];sand=bpy.data.materials['밝은 마른 모래'];grass=bpy.data.materials['절제된 올리브 초지']
# 모든 잎에 같은 명도 보정을 사용한다. 임의의 색상 변이는 더하지 않는다.
for m in bpy.data.materials:
 if m.name.startswith('숲의 공통 녹색 명암'):
  for n in m.node_tree.nodes:
   if n.type=='VALTORGB':
    for e in n.color_ramp.elements:e.color=tuple(min(1,x*1.13) for x in e.color[:3])+(1,)
# 암벽은 작은 시멘트 같은 입자 대신 큰 절리와 약한 풍화 결을 쓴다.
for m in [rock,bpy.data.materials['수평 층리의 따뜻한 사암']]:
 nt=m.node_tree;p=nt.nodes.get('Principled BSDF');base=p.inputs['Base Color'].links[0].from_socket
 coord=nt.nodes.new('ShaderNodeTexCoord');scale=nt.nodes.new('ShaderNodeVectorMath');scale.operation='MULTIPLY';scale.inputs[1].default_value=(1,1,.16);nt.links.new(coord.outputs['Object'],scale.inputs[0])
 vor=nt.nodes.new('ShaderNodeTexVoronoi');vor.feature='DISTANCE_TO_EDGE';vor.inputs['Scale'].default_value=4.0;nt.links.new(scale.outputs[0],vor.inputs['Vector'])
 ramp=nt.nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.012;ramp.color_ramp.elements[0].color=(.12,.14,.13,1);ramp.color_ramp.elements[1].position=.065;ramp.color_ramp.elements[1].color=(1,1,1,1);nt.links.new(vor.outputs['Distance'],ramp.inputs[0])
 mult=nt.nodes.new('ShaderNodeMixRGB');mult.blend_type='MULTIPLY';mult.inputs[0].default_value=.48;nt.links.new(base,mult.inputs[1]);nt.links.new(ramp.outputs[0],mult.inputs[2]);nt.links.new(mult.outputs[0],p.inputs['Base Color'])
 bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.27;bump.inputs['Distance'].default_value=.055;nt.links.new(vor.outputs['Distance'],bump.inputs['Height']);nt.links.new(bump.outputs[0],p.inputs['Normal'])
seen=set()
for c in sc.collection.children:
 if not c.name.startswith('지형 부품 /'):continue
 for o in c.objects:
  if o.type!='MESH' or o.data in seen:continue
  seen.add(o.data)
  if '세로 균열' in o.name:
   tx=bpy.data.textures.new('큰 암면 사이의 작은 침식','CLOUDS');tx.noise_scale=.23;tx.noise_depth=2
   sub=o.modifiers.new('암면의 작은 갈라짐','SUBSURF');sub.subdivision_type='SIMPLE';sub.levels=1;sub.render_levels=1
   dis=o.modifiers.new('암벽 풍화','DISPLACE');dis.texture=tx;dis.strength=.075;dis.mid_level=.5
  if '눈 덮인' in c.name or 'snowshrub' in c.name:
   rng=random.Random(57);snowIndex=next((i for i,m in enumerate(o.data.materials) if m and m.name.startswith('바위 홈과')),None)
   if snowIndex is not None:
    for f in o.data.polygons:
     if f.material_index==snowIndex and rng.random()<.65:f.material_index=1

def leafMesh(c,name,fern=False,variant=0):
 rng=random.Random(177+variant);vs=[];fs=[]
 for k in range(12 if fern else 8):
  a=k*math.tau/(12 if fern else 8)+rng.uniform(-.1,.1);L=rng.uniform(.65,1.0);z=rng.uniform(.20,.40)
  if fern:
   for j in range(1,15):
    t=j/15;center=Vector((math.cos(a)*L*t,math.sin(a)*L*t,z*math.sin(math.pi*t)));w=.17*math.sin(t*math.pi)
    for side in [-1,1]:
     u=Vector((math.cos(a+.7*side),math.sin(a+.7*side),.10))*w;v=Vector((-math.sin(a),math.cos(a),0))*.025;i=len(vs);vs.extend([tuple(center),tuple(center+u*.55+v),tuple(center+u),tuple(center+u*.55-v)]);fs.append((i,i+1,i+2,i+3))
  else:
   for j in range(12):
    t=j/11;w=.17*math.sin(t*math.pi)**.7;x,y=math.cos(a)*L*t,math.sin(a)*L*t;zz=.1+z*math.sin(t*math.pi)+.2*t
    for side in [-1,0,1]:vs.append((x-math.sin(a)*w*side,y+math.cos(a)*w*side,zz-abs(side)*.025))
   base=len(vs)-36
   for j in range(11):
    for q in range(2):i=base+j*3+q;fs.append((i,i+1,i+4,i+3))
 o=move(mesh(name,vs,fs,[leaf]),c)
 for f in o.data.polygons:f.use_smooth=True
 return o
for kind in ['fern','broadleaf']:
 for variant in range(2):
  c=group('지형 부품 / '+kind+' / '+str(variant));leafMesh(c,'정글 아래층의 잎',kind=='fern',variant);render(c,'detail-'+kind+'-'+str(variant),2.5,(0,0,.35),384)
for variant in range(2):
 c=group('지형 부품 / emergent / '+str(variant));src=next(o for o in bpy.data.collections['수목 / tropical / '+str(variant)].objects if o.type=='MESH');o=clone(src,c);o.data=o.data.copy()
 for v in o.data.vertices:
  x,y,z=v.co;v.co=(x*1.15,y*1.15,z if z<.35 else .35+(z-.35)*1.42)
 vs=[];fs=[];ids=[]
 for k in range(7):
  a=k*2.399;rad=.32+.22*(k%3);last=(math.cos(a)*rad,math.sin(a)*rad,2.4)
  for j in range(1,11):
   z=2.4-j*.20;nextp=(math.cos(a)*rad+.04*math.sin(j),math.sin(a)*rad+.04*math.cos(j),z);cylinder_between(vs,fs,ids,last,nextp,.012,.010,0,5);last=nextp
 for k in range(6):a=k*math.tau/6;cylinder_between(vs,fs,ids,(0,0,.7),(.42*math.cos(a),.42*math.sin(a),0),.055,.016,0,6)
 move(mesh('덩굴과 판자뿌리',vs,fs,[bark]),c);render(c,'tree-emergent-'+str(variant),4,(0,0,1.4),512)

def dune(c,variant):
 n=100;vs=[];fs=[]
 for j in range(n+1):
  y=(j/n*2-1)*1.6
  for i in range(n+1):
   x=(i/n*2-1)*2.5;ridge=.40*math.sin(y*1.3+variant)+.1*math.sin(y*3);u=x-ridge;h=1.20*math.exp(-((u/(1.45 if u<0 else .50))**2))*max(0,1-(abs(y)/1.6)**4);h+=.015*math.sin((x+y*.12)*100)*min(1,h)
   vs.append((x,y,h))
 for j in range(n):
  for i in range(n):a=j*(n+1)+i;fs.append((a,a+1,a+n+2,a+n+1))
 o=move(mesh('바람받이와 급한 바람그늘 사면',vs,fs,[sand]),c)
 for f in o.data.polygons:f.use_smooth=True
for variant in range(2):
 c=group('지형 부품 / dune / '+str(variant));dune(c,variant);render(c,'detail-dune-'+str(variant),6.3,(0,0,.45),512)
 c=group('지형 부품 / cactus / '+str(variant));vs=[];fs=[];ids=[]
 cylinder_between(vs,fs,ids,(0,0,0),(0,0,1.6),.13,.10,0,14)
 for s in [-1,1]:cylinder_between(vs,fs,ids,(0,0,.7),(.40*s,0,.85),.08,.065,0,10);cylinder_between(vs,fs,ids,(.40*s,0,.85),(.40*s,0,1.25+variant*.15),.065,.045,0,10)
 move(mesh('미주 사막의 기둥 선인장',vs,fs,[leaf]),c);render(c,'detail-cactus-'+str(variant),2.5,(0,0,.8),384)

# 원본 부품의 수정은 연결된 환경 배치에도 반영된다. 모든 게임용 판을 같은 빛으로 다시 굽는다.
latest={r['id']:r for r in frames+added}
for key,row in latest.items():
 if row.get('source')=='biome-assets.blend' and key not in {x['id'] for x in added}:
  c=bpy.data.collections.get(row['collection'])
  if c:render(c,key,6.5 if key.startswith(('detail-granite','detail-sandstone','detail-pillar','detail-wall','detail-karst','detail-snowridge','detail-volcano','wonder-')) else 3.4 if key.startswith('detail-stones') else 2.8 if key.startswith('tree-') else 1.6,(0,0,1.2 if key.startswith('wonder-') or key.startswith(('detail-granite','detail-sandstone','detail-pillar','detail-wall','detail-karst','detail-snowridge','detail-volcano')) else .9 if key.startswith('tree-') else .25),row['size'])

# 정글 시안은 교목·야자·넓은 잎·양치식물의 네 층과 굽은 물길로 다시 조립한다.
c=bpy.data.collections.get('환경 시안 / tropical');rng=random.Random(84)
for o in list(c.objects):
 if o.name.startswith('한 지면'):
  for v in o.data.vertices:
   x,y,z=v.co;d=abs(y-.65*math.sin(x*.55))-.44;v.co.z=-.15 if d<0 else .13+.025*noise.noise(Vector((x*1.4,y*1.4,1)))
  o.data.update()
for k in range(250):
 x,y=rng.uniform(-5.8,5.8),rng.uniform(-4.8,4.8)
 if abs(y-.65*math.sin(x*.55))<.75:continue
 form='fern' if k%2 else 'broadleaf';src=bpy.data.collections['지형 부품 / '+form+' / 0']
 for o in src.objects:clone(o,c,(x,y,.13),rng.uniform(.25,.55),rng.random()*6)
for k in range(20):
 x,y=rng.uniform(-5.5,5.5),rng.uniform(-4.5,4.5)
 if abs(y-.65*math.sin(x*.55))<1:continue
 for o in bpy.data.collections['지형 부품 / emergent / 0'].objects:clone(o,c,(x+o.location.x,y+o.location.y,.13+o.location.z),rng.uniform(.50,.65),rng.random()*6)

# 실제 지구 좌표를 꾸며낸 지형이 아닌, 재질·배치 확인용 별도 사막 시안.
c=group('환경 시안 / desert');n=140;vs=[];fs=[]
for j in range(n+1):
 y=(j/n*2-1)*7
 for i in range(n+1):x=(i/n*2-1)*7;u=x+.3*math.sin(y*.7);p=(u*.45)%1;h=(p/.73 if p<.73 else (1-p)/.27)*.23;vs.append((x,y,h))
for j in range(n):
 for i in range(n):a=j*(n+1)+i;fs.append((a,a+1,a+n+2,a+n+1))
o=move(mesh('이어지는 사구 바다',vs,fs,[sand]),c)
for f in o.data.polygons:f.use_smooth=True
for k,(x,y,s) in enumerate([(-3,1,1.4),(1,2,1.2),(3,-2,1.1),(-1,-2,.9)]):
 for src in bpy.data.collections['지형 부품 / dune / '+str(k%2)].objects:clone(src,c,(x,y,.05),s)
for src in bpy.data.collections['지형 부품 / sandstone / 0'].objects:clone(src,c,(-4+src.location.x,3+src.location.y,src.location.z),.7)

for c in list(sc.collection.children):
 if not c.name.startswith('환경 시안 /'):continue
 kind=c.name.split('/')[1].strip();show(c);camera((0,0,.5),13.5);sc.render.film_transparent=False;sc.render.resolution_x=1280;sc.render.resolution_y=900;sc.render.filepath=str(STUDY/(kind+'.png'));bpy.ops.render.render(write_still=True);print('POLISHED_STUDY '+kind,flush=True)
show(bpy.data.collections['환경 시안 / tropical']);camera((0,0,.5),13.5)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'biome-assets.blend'),compress=True)
replace={r['id'] for r in added};frames=[r for r in frames if r['id'] not in replace]+added;(OUT/'frames.json').write_text(json.dumps(frames,ensure_ascii=False,indent=2),encoding='utf-8')
print('LANDSCAPE_POLISH_DONE',flush=True)
