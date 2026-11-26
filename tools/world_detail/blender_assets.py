"""게임용 투명 수목·자연경관과 편집 가능한 Blender 원본. 색보다 형태로 수종을 나눈다."""
import bpy, math, random, json, sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from blender_helpers import mat,mesh,cylinder_between,make_tree,make_palm,make_cliff,instance
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'artifacts/world-detail-20261125/blender';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.samples=24;sc.cycles.use_denoising=True
try:
 prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='CUDA';prefs.get_devices()
 for d in prefs.devices:d.use=d.type=='CUDA'
 sc.cycles.device='GPU'
except Exception:pass
sc.render.film_transparent=True;sc.render.image_settings.file_format='PNG';sc.render.image_settings.color_mode='RGBA'
sc.view_settings.view_transform='AgX';sc.view_settings.look='AgX - Medium High Contrast';sc.world.color=(.32,.32,.32)
def light(name,loc,energy,size):
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=energy;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
light('같은 숲을 비추는 부드러운 주광',(-3,-5,8),700,5);light('약한 하늘 반사광',(4,3,7),260,6)
bpy.ops.object.camera_add(location=(5,-8,10));cam=bpy.context.object;cam.name='실시간 미니어처 카메라';cam.data.type='ORTHO';sc.camera=cam
def camera(target,scale):
 cam.location=Vector(target)+Vector((5,-8,7));cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale
def group(name):
 c=bpy.data.collections.new(name);sc.collection.children.link(c);return c
def move_to(o,c):
 for old in list(o.users_collection):old.objects.unlink(o)
 c.objects.link(o);o.hide_render=False;o.hide_viewport=False
groups=[];frames=[]
def render(c,key,size,target,scale):
 if '--waterfalls-only' in sys.argv and key not in ['wonder-iguazu','wonder-gullfoss','wonder-nachi','wonder-pamukkale']:
  frames.append({'id':key,'size':size,'collection':c.name});return
 if '--mountains-only' in sys.argv and (not key.startswith('wonder-') or c.name.endswith('형태 모델')):
  frames.append({'id':key,'size':size,'collection':c.name});return
 for cc in groups:cc.hide_render=cc!=c
 camera(target,scale);sc.render.resolution_x=size;sc.render.resolution_y=size;sc.render.resolution_percentage=100
 sc.render.filepath=str(OUT/(key+'.png'));bpy.ops.render.render(write_still=True)
 frames.append({'id':key,'size':size,'collection':c.name});print('ASSET_DONE '+key,flush=True)
bark=mat('통일된 회갈색 수피',(.075,.048,.025),(.16,.105,.055),8,bump=.02)
# 잎의 색상각을 고정하고 명도만 7% 이내로 바꾼다. 가을 단풍·꽃 색은 이 판에 넣지 않는다.
leaves=[]
for k in range(4):
 f=.93+k*.046
 leaves.append(mat('숲의 공통 녹색 명암 '+str(k),tuple(x*f for x in (.045,.090,.026)),tuple(x*f for x in (.15,.23,.067)),19,bump=.012))
forms=['oak','pine','umbrella','acacia','cedar','tropical','poplar','palm','mangrove','bamboo']
tree_sources={}
for fi,form in enumerate(forms):
 for variant in range(2):
  c=group('수목 / '+form+' / '+str(variant));groups.append(c)
  if form=='bamboo':
   rng=random.Random(70+variant);vs=[];fs=[];mi=[]
   for k in range(8):
    x,y=rng.uniform(-.30,.30),rng.uniform(-.26,.26);h=rng.uniform(1.4,2.2)
    cylinder_between(vs,fs,mi,(x,y,0),(x+.07,y,h),.023,.012,1,7)
    for lev in range(4,9):
     z=lev*h/10;a=rng.random()*math.tau
     cylinder_between(vs,fs,mi,(x,y,z),(x+.37*math.cos(a),y+.37*math.sin(a),z+.08),.01,.004,0,5)
     for j in range(9):
      p=Vector((x+.37*math.cos(a)*j/9,y+.37*math.sin(a)*j/9,z+.08*j/9));u=Vector((math.cos(a+.7),math.sin(a+.7),.12))*.22;v=Vector((-math.sin(a+.7),math.cos(a+.7),0))*.026;i=len(vs)
      vs.extend([tuple(p),tuple(p+u*.5+v),tuple(p+u),tuple(p+u*.5-v)]);fs.append((i,i+1,i+2,i+3));mi.append(1+j%4)
   o=mesh('대나무 마디와 가는 잎',vs,fs,[bark]+leaves)
   for p,m in zip(o.data.polygons,mi):p.material_index=m
  else:
   o=make_palm(100+variant,bark,leaves) if form=='palm' else make_tree('pine' if form in ['pine','cedar'] else 'broad',100+variant,bark,leaves)
   for v in o.data.vertices:
    x,y,z=v.co
    if form in ['umbrella','acacia']:v.co=(x*1.45,y*1.45,z if z<.9 else .9+(z-.9)*.45)
    if form=='cedar':v.co=(x*1.55,y*1.55,z*.9)
    if form=='tropical':v.co=(x*1.25,y*1.25,z*1.15)
    if form=='poplar':v.co=(x*.48,y*.48,z*1.35)
    if form=='mangrove':v.co=(x*.9,y*.9,z*.70+.18)
   if form=='mangrove':
    vs=[];fs=[];mi=[]
    for k in range(9):a=k*math.tau/9;cylinder_between(vs,fs,mi,(.02,0,.65),(.42*math.cos(a),.42*math.sin(a),0),.025,.012,0,6)
    roots=mesh('맹그로브 버팀뿌리',vs,fs,[bark]);move_to(roots,c)
  o.name='지역 수종 '+form;move_to(o,c);tree_sources[form]=o
  render(c,'tree-'+form+'-'+str(variant),256,(0,0,1.05),2.8)
for cc in groups:cc.hide_viewport=cc!=groups[0];cc.hide_render=cc!=groups[0]
camera((0,0,1.05),2.8)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'regional-vegetation.blend'),compress=True)
for cc in groups:cc.hide_viewport=False

rock=mat('풍화된 회색 암벽',(.14,.13,.105),(.34,.32,.27),3,bump=.055)
red=mat('붉은 사암 층리',(.16,.068,.032),(.43,.20,.095),3,bump=.05)
grass=mat('같은 녹색의 낮은 식생',(.06,.10,.026),(.16,.22,.06),9,bump=.018)
snow=mat('능선에 남은 눈',(.56,.62,.66),(.88,.91,.91),14,bump=.012)
water=mat('얕은 담수',(.035,.14,.13),(.085,.28,.24),4,rough=.23,bump=.008)
white=mat('폭포의 흰 물과 석회',(.50,.60,.58),(.85,.88,.81),8,bump=.008)
sand=mat('밝은 모래와 산호',(.36,.29,.16),(.65,.58,.37),10,bump=.018)
def disk(c,name,r,z,m):
 n=96;vs=[(0,0,z)]+[(r*math.cos(k*math.tau/n),r*math.sin(k*math.tau/n),z) for k in range(n)];fs=[(0,k+1,(k+1)%n+1) for k in range(n)];o=mesh(name,vs,fs,[m]);move_to(o,c);return o
def tree(c,form,x,y,z,s,seed=0):
 o=instance(tree_sources[form],'숲의 군락',(x,y,z),(s,)*3,seed*2.399);move_to(o,c)
def ground(c,fn,mats,r=3,n=100):
 vs=[];fs=[]
 for j in range(n+1):
  y=(j/n*2-1)*r
  for i in range(n+1):
   x=(i/n*2-1)*r;vs.append((x,y,fn(x,y)))
 for j in range(n):
  for i in range(n):
   x=((i+.5)/n*2-1)*r;y=((j+.5)/n*2-1)*r
   if x*x+y*y>r*r:continue
   a=j*(n+1)+i;fs.append((a,a+1,a+n+2,a+n+1))
 o=mesh('연결된 골짜기와 능선',vs,fs,mats);move_to(o,c)
 for f in o.data.polygons:
  f.use_smooth=True;f.material_index=0
 return o

for d in json.loads((OUT/'mountain-heights.json').read_text(encoding='utf-8')):
 c=group('자연경관 / '+d['id']+' / ETOPO');groups.append(c);h=d['heights'];n=d['side'];low=min(h);high=max(h);span=max(500,high-low)
 def height(x,y):
  fx=(x/6+.5)*(n-1);fy=(.5-y/6)*(n-1);ix=max(0,min(n-2,int(fx)));iy=max(0,min(n-2,int(fy)));a=max(0,min(1,fx-ix));b=max(0,min(1,fy-iy))
  z=(h[iy*n+ix]*(1-a)*(1-b)+h[iy*n+ix+1]*a*(1-b)+h[(iy+1)*n+ix]*(1-a)*b+h[(iy+1)*n+ix+1]*a*b-low)/span*2.7
  return .04+z*min(1,max(0,(3-math.hypot(x,y))/.35))
 o=ground(c,height,[grass,rock,snow],n=96)
 # 연속적인 고도 속성과 잡음으로 재질을 섞어 면마다 생기던 지그재그 색 경계를 줄인다.
 elevation=o.data.attributes.new('absolute_height','FLOAT','POINT')
 for a,v in zip(elevation.data,o.data.vertices):a.value=low+v.co.z/2.7*span
 m=mat('실제 고도의 암반 / '+d['id'],(.13,.125,.105),(.34,.32,.27),6,bump=.035)
 nt=m.node_tree;p=nt.nodes.get('Principled BSDF');base=p.inputs['Base Color'].links[0].from_socket
 attr=nt.nodes.new('ShaderNodeAttribute');attr.attribute_name='absolute_height'
 def transition(a,b):
  node=nt.nodes.new('ShaderNodeMapRange');node.inputs['From Min'].default_value=a;node.inputs['From Max'].default_value=b;node.clamp=True;nt.links.new(attr.outputs['Fac'],node.inputs['Value']);return node.outputs[0]
 tl=1500 if abs(d['lat'])>40 else 2400 if abs(d['lat'])>30 else 3100
 sl=2800 if abs(d['lat'])>40 else 3000 if abs(d['lat'])>30 else 4500
 if d['id'] in ['kailash','everest','machapuchare']:tl=3800;sl=5200
 mix=nt.nodes.new('ShaderNodeMixRGB');mix.inputs[1].default_value=(.12,.18,.045,1);nt.links.new(base,mix.inputs[2]);nt.links.new(transition(tl-160,tl+160),mix.inputs[0])
 sn=nt.nodes.new('ShaderNodeMixRGB');nt.links.new(mix.outputs[0],sn.inputs[1]);sn.inputs[2].default_value=(.83,.87,.87,1);nt.links.new(transition(sl-120,sl+140),sn.inputs[0]);nt.links.new(sn.outputs[0],p.inputs['Base Color'])
 o.data.materials.clear();o.data.materials.append(m)
 rng=random.Random(29)
 for k in range(45):
  x,y=rng.uniform(-2.6,2.6),rng.uniform(-2.6,2.6);z=height(x,y)
  if x*x+y*y<6.8 and z<.8:tree(c,'pine',x,y,z,rng.uniform(.14,.22),k)
 c['source']='NOAA ETOPO2022 60 arcsec';c['lon']=d['lon'];c['lat']=d['lat'];c['vertical_exaggeration']='화면 식별을 위한 정규화; 통행 고도에는 적용하지 않음'
 render(c,'wonder-'+d['id'],512,(0,0,1),7.6)

for ident in ['uluru','roraima','zhangjiajie','canyon','iguazu','gullfoss','nachi','pamukkale','reef','bluehole','redwood','seongsan','mapuavaea','flowers']:
 c=group('자연경관 / '+ident+' / 형태 모델');groups.append(c);rng=random.Random(59)
 if ident not in ['iguazu','gullfoss']:disk(c,'자연경관 바탕',2.8,.015,sand if ident in ['uluru','canyon','reef','bluehole','flowers'] else grass)
 if ident in ['uluru','roraima','zhangjiajie','canyon']:
  if ident=='uluru':
   # 둥근 한 덩어리, 세로 빗물 홈. 원뿔을 쓰지 않는다.
   def fn(x,y):
    q=(x/2.3)**2+(y/1.45)**2;return .025+1.45*max(0,1-q**2)**.48*(.96+.035*math.sin(math.atan2(y,x)*78))
   ground(c,fn,[red],n=140)
  else:
   for k in range(16 if ident=='zhangjiajie' else 8):
    x,y=rng.uniform(-2,2),rng.uniform(-1.7,1.7)
    if ident=='canyon':x=(-1 if k%2 else 1)*(1.15+rng.random()*.6)
    before=set(bpy.data.objects);make_cliff(x,y,rng.uniform(1.4,3.4) if ident=='zhangjiajie' else rng.uniform(.7,1.6),.30 if ident=='zhangjiajie' else .85,.4 if ident=='zhangjiajie' else .8,k,rock if ident=='zhangjiajie' else red,lambda x,y:0)
    for o in set(bpy.data.objects)-before:move_to(o,c)
    if ident=='zhangjiajie':tree(c,'pine',x,y,2.2,.17,k)
 elif ident in ['iguazu','gullfoss']:
  from blender_waterfalls import build_waterfall
  build_waterfall(c,ident,tree)
 elif ident in ['nachi','pamukkale']:
  falling=mat('갈라져 흐르는 자연 낙수',(.25,.43,.39),(.76,.85,.78),14,rough=.3,bump=.008)
  if ident=='pamukkale':
   def limestone(x,y):
    z=.1+max(0,y+2.4)*.34;step=math.floor((z+.045*math.sin(x*4+y*2))*7)/7
    return .05+step*min(1,max(0,(2.8-math.hypot(x,y))/.25))
   ground(c,limestone,[white],n=140)
   for k in range(30):
    x,y=rng.uniform(-1.9,1.9),rng.uniform(-1.9,1.9);o=disk(c,'불규칙한 석회 온천 못',rng.uniform(.18,.49),limestone(x,y)+.008,water);o.scale.y=.55;o.location.x=x;o.location.y=y
  else:
   # 인공 댐처럼 균등한 기둥을 세우지 않고, 굽은 단층에 붙은 불규칙 낙수를 만든다.
   tall=ident=='nachi';fall_h=2.8 if tall else 1.35
   def cliffline(t):return (math.sin(t)*(1.70 if not tall else .65),math.cos(t)*1.2+.20)
   def plateau(x,y):
    rr=math.sqrt((x/1.7)**2+((y-.2)/1.2)**2)
    h=fall_h if rr>1 and (y>-.75 or abs(x)>1.1) else .04
    return h*min(1,max(0,(2.8-math.hypot(x,y))/.35))+.025*math.sin(x*16+y*13)
   cliff=ground(c,plateau,[grass,rock],n=160)
   for face in cliff.data.polygons:face.material_index=0 if face.normal.z>.65 else 1
   pool=disk(c,'물보라가 모이는 깊은 소',1.70,.06,water);pool.scale.y=.80;pool.location.y=.1
   # 상단의 좁은 급류는 절벽 뒤에서 이어진다.
   o=mesh('절벽으로 이어지는 급류',[(-.55,2.4,fall_h+.02),(.60,2.4,fall_h+.02),(.55,1.3,fall_h+.02),(-.48,1.3,fall_h+.02)],[(0,1,2,3)],[water]);move_to(o,c)
   count=14 if tall else 135
   for k in range(count):
    t=rng.uniform(-.28,.28) if tall else -2.5+5*k/(count-1)+rng.uniform(-.025,.025)
    x,y=cliffline(t);w=rng.uniform(.025,.095) if not tall else rng.uniform(.018,.06);vs=[];fs=[];top=fall_h+rng.uniform(-.03,.035)
    for j in range(9):
     f=j/8;z=top*(1-f)+.08*f;out=.04+f*f*.11;wx=w*(1+.45*math.sin(f*13+k));xx=x+math.sin(t)*out;yy=y+math.cos(t)*out
     vs.extend([(xx-math.cos(t)*wx,yy+math.sin(t)*wx,z),(xx+math.cos(t)*wx,yy-math.sin(t)*wx,z)])
    for j in range(8):fs.append((j*2,j*2+1,j*2+3,j*2+2))
    o=mesh('폭과 갈래가 다른 물줄기',vs,fs,[falling]);move_to(o,c)
   for k in range(70):
    t=rng.uniform(-.3,.3) if tall else rng.uniform(-2.5,2.5);x,y=cliffline(t);r=rng.uniform(.025,.10)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=r,location=(x+rng.uniform(-.13,.13),y+rng.uniform(-.13,.13),.09+rng.uniform(0,.10)));o=bpy.context.object;o.scale.z=.25;o.data.materials.append(white);move_to(o,c)
   for k in range(60):
    if ident=='gullfoss':continue
    x,y=rng.uniform(-2.55,2.55),rng.uniform(-1.8,2.5)
    if math.hypot(x,y)>2.65 or plateau(x,y)<.6:continue
    tree(c,'tropical' if ident=='iguazu' else 'pine',x,y,plateau(x,y)+.03,rng.uniform(.23,.38),k)
 elif ident in ['reef','bluehole','mapuavaea','seongsan']:
  disk(c,'푸른 얕은 물',2.6,.03,water)
  if ident=='bluehole':
   dark=mat('깊은 청록 원형 함몰',(.006,.028,.044),(.012,.055,.07),7,rough=.22,bump=.004);disk(c,'깊은 원형 수직 동굴',1.35,.04,dark)
  elif ident=='seongsan':
   def fn(x,y):
    r=math.hypot(x,y);return .05+1.5*math.exp(-((r-1.1)/.4)**4)*(1+.10*math.sin(math.atan2(y,x)*9))
   ground(c,fn,[grass,rock],n=110)
  else:
   for k in range(70):
    a=rng.random()*math.tau;r=rng.uniform(1.1,2.5);x,y=math.cos(a)*r,math.sin(a)*r
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=rng.uniform(.07,.22),location=(x,y,.07));o=bpy.context.object;o.scale.z=.3;o.data.materials.append(sand);move_to(o,c)
 elif ident=='redwood':
  for k in range(30):
   x,y=rng.uniform(-2.2,2.2),rng.uniform(-1.9,1.9);tree(c,'pine',x,y,.05,rng.uniform(.9,1.65),k)
 elif ident=='flowers':
  for k in range(230):
   a=rng.random()*math.tau;r=math.sqrt(rng.random())*2.6;x,y=r*math.cos(a),r*math.sin(a)
   bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=.045,location=(x,y,.05));o=bpy.context.object;o.scale.z=.4;o.data.materials.append(sand);move_to(o,c)
 c['source']='첨부 자연경관 PDF의 형태 참고; 절벽·폭포는 미술용 모형, 측량 복제 아님'
 render(c,'wonder-'+ident,512,(0,0,.75 if ident in ['iguazu','gullfoss'] else 1.1),6.2 if ident in ['iguazu','gullfoss'] else 7.6 if ident!='redwood' else 9.5)
for cc in groups:cc.hide_render=' / fuji / ' not in cc.name;cc.hide_viewport=cc.hide_render
camera((0,0,1),7.6)
sc['production']='tools/world_detail/blender_assets.py';sc['palette']='같은 지역 녹색, 명암 편차 7% 이내'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'natural-landmarks.blend'),compress=True)
(OUT/'frames.json').write_text(json.dumps(frames,ensure_ascii=False,indent=2),encoding='utf-8')
print('ALL_ASSETS_DONE '+str(len(frames)),flush=True)
