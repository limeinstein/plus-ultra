"""첨부 지형·산·해변 사진을 형태 참고로 삼은 미술 부품과 편집 가능한 환경 시안.
실측 DEM을 대체하는 측량 모형이 아니다. 게임에는 같은 부품을 지리·경사에 맞춰 배치한다.
"""
import bpy,math,random,json,sys
from pathlib import Path
from mathutils import Vector,noise
sys.path.insert(0,str(Path(__file__).parent))
from blender_helpers import mat,mesh,make_cliff,cylinder_between,instance
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'artifacts/world-detail-20261125/blender';STUDY=OUT.parent/'biomes';STUDY.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(OUT/'regional-vegetation.blend'));sc=bpy.context.scene
sc.render.engine='CYCLES';sc.cycles.samples=24;sc.cycles.use_denoising=True
try:
 p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='CUDA';p.get_devices()
 for d in p.devices:d.use=d.type=='CUDA'
 sc.cycles.device='GPU'
except Exception:pass
sc.render.film_transparent=True;sc.render.image_settings.file_format='PNG';sc.render.resolution_percentage=100
for c in sc.collection.children:
 if c.name.startswith('수목 /'):c.hide_render=True;c.hide_viewport=True
trees={}
for c in sc.collection.children:
 if c.name.startswith('수목 /'):
  form=c.name.split('/')[1].strip();trees.setdefault(form,next((o for o in c.objects if o.type=='MESH'),None))
rock=mat('청회색 화강암과 절리',(.16,.17,.15),(.41,.42,.36),4,bump=.07)
sandstone=mat('수평 층리의 따뜻한 사암',(.26,.13,.065),(.53,.33,.18),5,bump=.045)
snow=mat('바위 홈과 가지 위의 눈',(.60,.67,.68),(.91,.94,.92),14,bump=.008)
grass=mat('절제된 올리브 초지',(.13,.17,.075),(.24,.27,.13),8,bump=.006)
soil=mat('숲 아래의 흙과 마른 풀',(.17,.14,.085),(.29,.27,.16),9,bump=.007)
sand=mat('밝은 마른 모래',(.46,.38,.24),(.72,.64,.46),12,bump=.007)
wet=mat('젖은 모래와 진흙',(.17,.18,.11),(.31,.31,.20),11,bump=.007)
water=mat('얕은 투명 청록 물',(.02,.18,.22),(.08,.40,.39),3,rough=.19,bump=.002)
leaf=trees['oak'].data.materials[1];bark=trees['oak'].data.materials[0]
assets={};groups=[];added=[]
def group(name):
 c=bpy.data.collections.new(name);sc.collection.children.link(c);groups.append(c);return c
def move(o,c):
 for old in list(o.users_collection):old.objects.unlink(o)
 c.objects.link(o);o.hide_render=False;o.hide_viewport=False;return o
def clone(src,c,loc,scale,angle=0):
 o=instance(src,src.name+' / 배치',loc,(scale,)*3,angle);return move(o,c)
def cam(target=(0,0,1),scale=6.5):
 target=Vector(target);camera=sc.camera;camera.location=target+Vector((4,-8,8));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=scale
def show(c):
 for cc in sc.collection.children:
  if cc.name.startswith(('수목 /','지형 부품 /','환경 시안 /')):cc.hide_render=cc!=c;cc.hide_viewport=cc!=c
def bake(c,key,scale=6.5,target=(0,0,1),size=512):
 show(c);cam(target,scale);sc.render.resolution_x=sc.render.resolution_y=size;sc.render.filepath=str(OUT/(key+'.png'));bpy.ops.render.render(write_still=True)
 added.append({'id':key,'size':size,'collection':c.name,'source':'biome-assets.blend'});assets[key]=c;print('BIOME_ASSET '+key,flush=True)
def pebble(c,x,y,z,s,seed,material=rock):
 rng=random.Random(seed);bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=(x,y,z+s*.32));o=bpy.context.object
 for v in o.data.vertices:v.co*=rng.uniform(.83,1.12)
 o.scale=(s,s*rng.uniform(.65,1.05),s*rng.uniform(.35,.75));o.rotation_euler[2]=rng.random()*6.28;o.data.materials.append(material);bevel=o.modifiers.new('풍화된 모서리','BEVEL');bevel.width=.07;bevel.segments=2;move(o,c);return o
def cliff(c,x,y,h,sx,sy,seed,material=rock):
 before=set(bpy.data.objects);make_cliff(x,y,h,sx,sy,seed,material,lambda x,y:0)
 for o in set(bpy.data.objects)-before:move(o,c)
def grid(c,name,fn,materials,r=3,n=110):
 vs=[];fs=[]
 for j in range(n+1):
  for i in range(n+1):x=(i/n*2-1)*r;y=(j/n*2-1)*r;vs.append((x,y,fn(x,y)))
 for j in range(n):
  for i in range(n):a=j*(n+1)+i;fs.append((a,a+1,a+n+2,a+n+1))
 o=move(mesh(name,vs,fs,materials),c)
 for f in o.data.polygons:f.use_smooth=True
 return o
def frost(o):
 o.data=o.data.copy();index=len(o.data.materials);o.data.materials.append(snow)
 rng=random.Random(41)
 for f in o.data.polygons:
  if f.material_index>0 and f.normal.z>.12 and rng.random()<.65:f.material_index=index
def terrain_edge(o,r=2.9,fade=.65):
 a=o.data.attributes.new('soft_edge','FLOAT','POINT')
 for v,d in zip(o.data.vertices,a.data):t=max(0,min(1,(r-math.hypot(v.co.x,v.co.y))/fade));d.value=t*t*(3-2*t)
 for m in o.data.materials:
  m=m.copy();p=m.node_tree.nodes.get('Principled BSDF');n=m.node_tree.nodes.new('ShaderNodeAttribute');n.attribute_name='soft_edge';m.node_tree.links.new(n.outputs['Fac'],p.inputs['Alpha'])
  # 전용 메시의 재질이므로 다른 부품의 투명도에는 영향을 주지 않는다.
  o.data.materials[0]=m;break

# 식물의 색상각은 공유하고 눈·낮은 관목·뿌리 형태로 환경을 나눈다.
for variant in range(2):
 c=group('지형 부품 / 눈 덮인 침엽수 / '+str(variant));o=clone(trees['pine'],c,(0,0,0),1,variant*.7);frost(o);bake(c,'tree-snowpine-'+str(variant),3,(0,0,1.0),384)
for kind in ['shrub','snowshrub','reeds','grass']:
 for variant in range(2):
  c=group('지형 부품 / '+kind+' / '+str(variant));rng=random.Random(variant+81)
  if kind in ['shrub','snowshrub']:
   o=clone(trees['oak'],c,(0,0,-.05),.55,variant);o.scale.z=.20
   if kind=='snowshrub':frost(o)
  else:
   vs=[];fs=[]
   for k in range(75 if kind=='grass' else 32):
    a=rng.random()*math.tau;r=rng.random()*.37;x,y=math.cos(a)*r,math.sin(a)*r;h=rng.uniform(.15,.40) if kind=='grass' else rng.uniform(.45,.95);u=Vector((math.cos(a),math.sin(a),0))*.025;start=len(vs)
    vs.extend([(x-u.x,y-u.y,0),(x+u.x,y+u.y,0),(x+math.cos(a)*.14,y+math.sin(a)*.14,h*.65),(x+math.cos(a)*.22,y+math.sin(a)*.22,h)]);fs.append((start,start+1,start+2,start+3))
   move(mesh('낮은 풀잎의 군락',vs,fs,[leaf]),c)
  bake(c,'detail-'+kind+'-'+str(variant),1.6,(0,0,.35),256)
for kind in ['granite','sandstone','pillar','wall','karst','snowridge','volcano','stones']:
 for variant in range(2):
  c=group('지형 부품 / '+kind+' / '+str(variant));rng=random.Random(variant+117)
  if kind=='stones':
   for k in range(19):a=rng.random()*math.tau;r=rng.random()*1.3;pebble(c,math.cos(a)*r,math.sin(a)*r,0,rng.uniform(.13,.44),k)
  elif kind in ['pillar','karst']:
   for k in range(7 if kind=='pillar' else 5):
    x,y=rng.uniform(-1.4,1.4),rng.uniform(-.8,.8);h=rng.uniform(2.0,4.0) if kind=='pillar' else rng.uniform(1.4,2.9);w=rng.uniform(.20,.36) if kind=='pillar' else rng.uniform(.45,.68);cliff(c,x,y,h,w,w*.8,k)
    clone(trees['pine'] if kind=='pillar' else trees['oak'],c,(x,y,h-.12),.17 if kind=='pillar' else .25,k)
  elif kind=='volcano':
   def fn(x,y):
    r=math.hypot(x,y);a=math.atan2(y,x);cone=max(0,1-r/2.75)**1.55;flutes=(.045*math.sin(a*37+math.sin(r*2))+.022*math.sin(a*63))*min(1,r*2)*cone
    return max(.015,3.6*cone+flutes-.19*math.exp(-(r/.16)**2))
   o=grid(c,'원뿔 사면과 방사형 침식 홈',fn,[rock,snow],n=160)
   for f in o.data.polygons:
    z=sum(o.data.vertices[i].co.z for i in f.vertices)/4;x=sum(o.data.vertices[i].co.x for i in f.vertices)/4;y=sum(o.data.vertices[i].co.y for i in f.vertices)/4
    f.material_index=1 if z>1.65+.19*math.sin(math.atan2(y,x)*17)+.09*noise.noise(Vector((x*7,y*7,1))) else 0
   terrain_edge(o)
  elif kind=='snowridge':
   def fn(x,y):
    peaks=[]
    for xx,yy,h,w in [(-.4,.3,3.9,1.55),(1.1,.75,2.6,1.2),(-1.3,.6,2.3,1.3)]:
     q=max(abs(x-xx)/w,abs((y-yy)*1.2)/w);peaks.append(max(0,1-q)**1.4*h)
    return max(peaks)+.05*noise.fractal(Vector((x*7,y*7,2)),1,2,3)*max(0,1-math.hypot(x,y)/3)
   o=grid(c,'비대칭 설산의 주능선과 지능선',fn,[rock,snow],n=150)
   for f in o.data.polygons:
    z=sum(o.data.vertices[i].co.z for i in f.vertices)/4;f.material_index=1 if z>1.3 and f.normal.z>.35 else 0
   terrain_edge(o)
  else:
   material=sandstone if kind=='sandstone' else rock
   for k in range(6):
    x=(k%3-1)*.85+rng.uniform(-.15,.15);y=(k//3-.5)*.55;h=rng.uniform(1.5,3.1) if kind!='wall' else rng.uniform(2.5,3.5);cliff(c,x,y,h,.61 if kind!='wall' else .74,.56,k,material)
   for k in range(16):a=rng.random()*6.28;r=rng.uniform(.5,2.0);pebble(c,math.cos(a)*r,math.sin(a)*r,0,rng.uniform(.10,.34),k,material)
  bake(c,'detail-'+kind+'-'+str(variant),6.5 if kind!='stones' else 3.4,(0,0,1.2 if kind!='stones' else .2))

# 맹그로브는 낮은 수관 아래에 굽은 지주근이 보이도록 원본도 다시 만든다.
for variant in range(2):
 c=group('지형 부품 / 물가 맹그로브 / '+str(variant));o=clone(trees['oak'],c,(0,0,.16),.84,variant);o.scale.z=.62
 vs=[];fs=[];mi=[]
 for k in range(13):
  a=k*math.tau/13;end=(math.cos(a)*.65,math.sin(a)*.65,-.06);knee=(end[0]*.65,end[1]*.65,.32)
  cylinder_between(vs,fs,mi,(.02,0,.72),knee,.045,.032,0,7);cylinder_between(vs,fs,mi,knee,end,.032,.016,0,7)
 move(mesh('수면 밖으로 벌어진 지주근',vs,fs,[bark]),c);bake(c,'tree-mangrove-'+str(variant),2.8,(0,0,.9),384)

# 휴양지와 산 발견물은 환경 부품을 다시 조립한 별도 모형이다.
for key,base in [('fuji','volcano'),('matterhorn','snowridge'),('machapuchare','snowridge'),('everest','snowridge'),('huangshan','granite'),('zhangjiajie','pillar'),('halong','karst')]:
 c=group('지형 부품 / 경관 '+key)
 for o in assets['detail-'+base+'-0'].objects:clone(o,c,tuple(o.location),1)
 bake(c,'wonder-'+key,6.5,(0,0,1.2),768)

def surface(c,kind):
 def shore(x,y):
  if kind=='oasis':return math.hypot(x*.9,y*1.2)-.88
  if kind in ['beach','cove','temperate-beach']:return y+1.65+.45*math.sin(x*.65)+(.35*math.cos(x*1.7) if kind=='cove' else 0)
  if kind=='mangrove':return .40+.7*math.sin(x*.75+y*.4)-abs(y*.30)
  if kind=='tropical':return abs(y-.45*math.sin(x*.7))-.17
  return 5
 def height(x,y):
  d=shore(x,y);return -.15 if d<-.20 else -.15+(min(.32,max(0,d+.20))/.32)*.28+.025*noise.fractal(Vector((x*1.4,y*1.4,1)),1,2,3)
 ground=grid(c,'한 지면으로 이어지는 풀·흙·물가',height,[sand if kind in ['oasis','beach','cove'] else soil if kind=='tundra' else grass,wet],r=7,n=140)
 for f in ground.data.polygons:
  x=sum(ground.data.vertices[i].co.x for i in f.vertices)/4;y=sum(ground.data.vertices[i].co.y for i in f.vertices)/4
  f.material_index=1 if -.05<shore(x,y)<.18 else 0
 if kind=='tundra':
  m=ground.data.materials[0].copy();nt=m.node_tree;p=m.node_tree.nodes.get('Principled BSDF');original=p.inputs['Base Color'].links[0].from_socket;n=nt.nodes.new('ShaderNodeTexNoise');n.inputs['Scale'].default_value=1.4;n.inputs['Detail'].default_value=2;ramp=nt.nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.44;ramp.color_ramp.elements[1].position=.56;nt.links.new(n.outputs['Fac'],ramp.inputs[0]);mix=nt.nodes.new('ShaderNodeMixRGB');nt.links.new(original,mix.inputs[1]);mix.inputs[2].default_value=(.78,.85,.87,1);nt.links.new(ramp.outputs[0],mix.inputs[0]);nt.links.new(mix.outputs[0],p.inputs['Base Color']);ground.data.materials[0]=m
 if kind in ['oasis','beach','cove','temperate-beach','mangrove','tropical']:
  w=grid(c,'지형과 같은 낮은 곳을 채운 수면',lambda x,y:0,[water],r=7,n=2)
 return shore,height

studyKinds=['tundra','grassland','tropical','rocky','mountains','mangrove','oasis','beach','cove','temperate-beach']
for kind in studyKinds:
 c=group('환경 시안 / '+kind);rng=random.Random(292);shore,height=surface(c,kind)
 for k in range(200):
  x,y=rng.uniform(-6,6),rng.uniform(-5,5);d=shore(x,y)
  if kind=='mangrove':
   if -.1<d<.8:
    for o in assets['tree-mangrove-0'].objects:clone(o,c,(x+o.location.x,y+o.location.y,height(x,y)+o.location.z),.55,rng.random()*6)
   continue
  if d<.28:continue
  grove=noise.noise_vector(Vector((x*.5,y*.5,2))).x
  if kind in ['grassland','tundra'] and grove<.14:continue
  if kind=='oasis' and d>1.5:continue
  if kind in ['beach','cove','temperate-beach'] and d<.8:continue
  if kind in ['rocky','mountains'] and grove<.25:continue
  form='pine' if kind in ['tundra','mountains','grassland','temperate-beach'] else 'palm' if kind in ['oasis','beach'] or kind=='tropical' and k%4==0 else 'tropical' if kind=='tropical' else 'oak'
  o=clone(trees[form],c,(x,y,max(.04,height(x,y))),rng.uniform(.37,.65),rng.random()*6)
  if kind=='tundra':frost(o)
 for k in range(600):
  x,y=rng.uniform(-6,6),rng.uniform(-5,5);d=shore(x,y)
  if d<.2 or kind=='oasis' and d>1.6 or kind in ['beach','cove','temperate-beach'] and d<.7:continue
  typ='snowshrub' if kind=='tundra' else 'grass' if k%3 else 'shrub'
  for o in assets['detail-'+typ+'-0'].objects:clone(o,c,(x,y,height(x,y)),rng.uniform(.14,.35),rng.random()*6)
 if kind in ['rocky','mountains','cove']:
  typ='granite' if kind=='rocky' else 'snowridge' if kind=='mountains' else 'wall'
  for x,y,s in [(-3,1,1),(2.8,2.7,.8)]:
   for o in assets['detail-'+typ+'-0'].objects:clone(o,c,(x+o.location.x*s,y+o.location.y*s,o.location.z*s+height(x,y)),s)
 if kind in ['tundra','rocky','grassland','oasis','temperate-beach']:
  for k in range(80):
   x,y=rng.uniform(-5.5,5.5),rng.uniform(-4.5,4.5)
   if shore(x,y)>.2:pebble(c,x,y,height(x,y),rng.uniform(.07,.25),k,sandstone if kind=='oasis' else rock)
 show(c);cam((0,0,.5),13.5);sc.render.film_transparent=False;sc.render.resolution_x=1280;sc.render.resolution_y=900;sc.render.filepath=str(STUDY/(kind+'.png'));bpy.ops.render.render(write_still=True);print('BIOME_STUDY '+kind,flush=True)

show(assets['detail-granite-0']);cam((0,0,1.2),6.5);sc.render.film_transparent=True
sc['purpose']='첨부 사진의 형태를 해석한 환경 부품·미술 시안. 실제 게임 화면은 after/와 별도.'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'biome-assets.blend'),compress=True)
frames=json.loads((OUT/'frames.json').read_text(encoding='utf-8'));replace={r['id'] for r in added};frames=[r for r in frames if r['id'] not in replace]+added;(OUT/'frames.json').write_text(json.dumps(frames,ensure_ascii=False,indent=2),encoding='utf-8')
print('BIOME_ART_DONE '+str(len(added)),flush=True)
