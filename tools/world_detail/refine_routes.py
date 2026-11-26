"""개방 하류의 굽이를 Natural Earth 강 선분망 위로 맞춘다. 자료에 없는 짧은 연결선은 따로 남긴다."""
from pathlib import Path
import json,re,math,heapq
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'artifacts/world-detail-20261125'
s=(ROOT/'js/data/terrain_detail.js').read_text(encoding='utf-8');data=json.loads(s.split('G.TERRAIN_DETAIL=',1)[1].rsplit(';}',1)[0])
water=(ROOT/'js/data/waterways.js').read_text(encoding='utf-8')
rows=re.findall(r"\['([^']+)','([^']+)',\[([^\]]+)\]",water)
mapping={'tagus':['Tagus'],'thames':['Thames'],'seine':['Seine'],'rhine':['Rhine'],'elbe':['Elbe'],'danube':['Danube'],
 'nile':['Nile'],'niger':['Niger'],'congo':['Congo'],'amazon':['Amazon'],'parana':['Paraná','Paraná River'],
 'mississippi':['Mississippi'],'stlawrence':['St. Lawrence'],'yangtze':['Yangtze'],'pearl':['Pearl'],
 'hooghly':['Hugli','Hooghly'],'mekong':['Mekong'],'irrawaddy':['Irrawaddy'],'chaophraya':['Chao Phraya'],'northerndvina':['Northern Dvina']}
def dist(a,b):return math.hypot((a[0]-b[0])*max(.2,math.cos((a[1]+b[1])/2*math.pi/180)),a[1]-b[1])
output={};report=[]
for rid,name,coords in rows:
 nums=[float(x) for x in coords.split(',')];manual=list(zip(nums[::2],nums[1::2]));lines=[r[2] for r in data['rivers'] if r[0] in mapping.get(rid,[])]
 if not lines:report.append({'id':rid,'geometry':'reviewed estuary/branch connection','points':len(manual)});continue
 pts=[];index={};adj={}
 def add(p):
  k=(round(p[0],4),round(p[1],4))
  if k not in index:index[k]=len(pts);pts.append(list(p));adj[index[k]]=[]
  return index[k]
 for line in lines:
  for a,b in zip(line,line[1:]):
   u,v=add(a),add(b);w=dist(a,b);adj[u].append((v,w));adj[v].append((u,w))
 snaps=[]
 for k,p in enumerate(manual):
  idx=min(range(len(pts)),key=lambda i:dist(pts[i],p))
  if dist(pts[idx],p)<.25:snaps.append((k,idx))
 # 넓은 하구는 원본 선 자료에서 생략되므로 검토한 하구 연결을 앞에 보존한다.
 if len(snaps)<2:report.append({'id':rid,'geometry':'reviewed estuary, NE begins farther upstream'});continue
 first,start=snaps[0];last,end=snaps[-1]
 def find():
  heap=[(0,start)];best={start:0};prev={}
  while heap:
   cost,u=heapq.heappop(heap)
   if cost!=best[u]:continue
   if u==end:
    out=[u]
    while u!=start:u=prev[u];out.append(u)
    return [pts[i] for i in out[::-1]]
   for v,w in adj[u]:
    n=cost+w
    if n<best.get(v,1e30):best[v]=n;prev[v]=u;heapq.heappush(heap,(n,v))
  return None
 result=find()
 if result is None:
  ends=[i for i in adj if len(adj[i])==1]
  for n,i in enumerate(ends):
   for j in ends[n+1:]:
    d=dist(pts[i],pts[j])
    if d<.07:adj[i].append((j,d));adj[j].append((i,d))
  result=find()
 if not result:report.append({'id':rid,'geometry':'reviewed connection, NE network discontinuity'});continue
 prefix=[list(p) for p in manual[:first]]
 geometry='Natural Earth 1:10m river line plus reviewed estuary connection'
 if rid=='nile':
  # 로제타 지류는 하구까지 원본 지도 중심선이 있고, 카이로 북쪽에서 나일 본류와 한 점을 공유한다.
  rosetta=next((r[2] for r in data['rivers'] if r[0]=='Rosetta Branch'),[])
  if rosetta and rosetta[0]==result[0]:
   prefix=rosetta[:0:-1]
   geometry='Natural Earth 1:10m Rosetta Branch and Nile centerlines'
 result=prefix+result+[list(p) for p in manual[last+1:]]
 output[rid]=result;report.append({'id':rid,'geometry':geometry,'points':len(result)})
(ROOT/'js/data/waterway_geometry.js').write_text('/* Natural Earth의 실제 강 굽이. 제작: tools/world_detail/refine_routes.py */\n(function(G){G.WATERWAY_GEOMETRY='+json.dumps(output,separators=(',',':'))+';})(window.G=window.G||{});\n',encoding='utf-8')
(OUT/'route-geometry.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False),flush=True)
