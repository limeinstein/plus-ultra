"""자연 폭포: 원형 받침대 대신 굽은 절벽·젖은 상단·불규칙한 흰 물줄기."""
import bpy,math,random
from mathutils import Vector
from blender_helpers import mesh,mat

def build_waterfall(collection,ident,tree):
 rng=random.Random(143);grass=bpy.data.materials['같은 녹색의 낮은 식생'];rock=bpy.data.materials['풍화된 회색 암벽'];water=bpy.data.materials['얕은 담수'];white=bpy.data.materials['폭포의 흰 물과 석회']
 falling=mat('폭포의 하얀 포말과 얇은 물막 '+ident,(.38,.55,.51),(.77,.86,.81),17,rough=.25,bump=.008)
 p=falling.node_tree.nodes.get('Principled BSDF');p.inputs['Emission Color'].default_value=(.48,.65,.60,1);p.inputs['Emission Strength'].default_value=.25
 def own(o):
  for c in list(o.users_collection):c.objects.unlink(o)
  collection.objects.link(o);o.hide_render=False;o.hide_viewport=False;return o
 def point(t,out=0):
  jitter=.025*math.sin(t*19)+.018*math.sin(t*37)
  return ((1.55+out+jitter)*math.sin(t),(.25+(1.15+out+jitter)*math.cos(t)))
 def top(t):return 1.25+.055*math.sin(t*6)+.025*math.cos(t*17)
 count=120;ts=[-2.45+4.90*i/count for i in range(count+1)];vs=[];fs=[];ids=[]
 for t in ts:
  for out,z in [(0,.04),(-.03,.48),(.015,.91),(0,top(t)),(.60,top(t)+.02),(.66,.85),(.72,.12)]:
   x,y=point(t,out);vs.append((x,y,z))
 for i in range(count):
  for j in range(6):a=i*7+j;fs.append((a,a+7,a+8,a+1));ids.append(0 if j==3 else 1)
 cliff=own(mesh('굽은 자연 단층의 안팎 암벽',vs,fs,[grass,rock]))
 for f,mi in zip(cliff.data.polygons,ids):f.material_index=mi;f.use_smooth=True
 # 얇은 상단 급류. 원형 대형 수조를 만들지 않는다.
 vs=[];fs=[]
 for t in ts:
  for out in [.015,.23+.04*math.sin(t*9)]:x,y=point(t,out);vs.append((x,y,top(t)+.025))
 for i in range(count):a=i*2;fs.append((a,a+1,a+3,a+2))
 own(mesh('낙하 직전 갈라지는 물길',vs,fs,[water]))
 vs=[(0,.1,.045)];vs.extend([(1.58*math.cos(i*math.tau/100),.1+1.4*math.sin(i*math.tau/100),.045) for i in range(100)]);fs=[(0,i+1,(i+1)%100+1) for i in range(100)];own(mesh('폭포 아래의 깊은 소',vs,fs,[water]))
 for k in range(86):
  t=-2.44+4.88*(k+rng.uniform(-.35,.35))/85
  if rng.random()<.12:continue
  w=rng.uniform(.035,.13);vs=[];fs=[]
  for j in range(13):
   f=j/12;offset=-.025-.10*f*f;x,y=point(t+math.sin(f*10+k)*.008,offset);z=top(t)*(1-f)+.055*f;wid=w*(1+.18*math.sin(f*17+k))
   vs.extend([(x-math.cos(t)*wid,y+math.sin(t)*wid,z),(x+math.cos(t)*wid,y-math.sin(t)*wid,z)])
  for j in range(12):a=j*2;fs.append((a,a+1,a+3,a+2))
  o=own(mesh('바위 틈에서 갈라져 떨어지는 포말',vs,fs,[falling]))
  for f in o.data.polygons:f.use_smooth=True
 for k in range(100):
  t=rng.uniform(-2.45,2.45);x,y=point(t,-rng.uniform(.04,.25));bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=rng.uniform(.025,.085),location=(x,y,.07+rng.uniform(0,.04)));o=bpy.context.object;o.scale.z=.20;o.data.materials.append(white);own(o)
 if ident!='gullfoss':
  for k in range(40):
   t=rng.uniform(-2.40,2.40);x,y=point(t,rng.uniform(.33,.58));tree(collection,'tropical',x,y,top(t),rng.uniform(.23,.39),k)
 collection['source']='첨부 자연경관의 형태를 해석한 미술용 모형; 낙수는 정지 렌더'
