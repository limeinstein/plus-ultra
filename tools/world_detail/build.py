"""ETOPO·RESOLVE·Natural Earth를 file://용 지형 자료로 묶는다."""
from pathlib import Path
import json,zlib,base64,re,zipfile
import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.features import rasterize
from rasterio.transform import from_bounds
import shapefile
from scipy import ndimage

ROOT=Path(__file__).resolve().parents[2]; OUT=ROOT/'artifacts/world-detail-20261125'; CACHE=OUT/'sources'
W,H=4096,2048
def shp(name):
 folder=CACHE/Path(name).stem; folder.mkdir(exist_ok=True)
 with zipfile.ZipFile(CACHE/name) as z:z.extractall(folder)
 file=next(folder.rglob('*.shp'))
 return shapefile.Reader(str(file),encoding='utf-8',encodingErrors='replace')
def pack(a):return base64.b64encode(zlib.compress(a.tobytes(),9)).decode('ascii')
def features(reader):
 names=[f[0] for f in reader.fields[1:]]
 for sr in reader.iterShapeRecords():
  yield dict(zip(names,sr.record)),sr.shape

eco=shp('ecoregions2017.zip'); rows=list(features(eco));print('ECO_FIELDS',rows[0][0],flush=True)
biomes=[]
for p,s in rows:
 key=next(k for k in p if k.upper() in ('BIOME_NUM','BIOME')); v=p[key]
 try:v=int(v)
 except (ValueError,TypeError):continue
 biomes.append((s.__geo_interface__,v))
habitat=rasterize(biomes,out_shape=(H,W),transform=from_bounds(-180,-90,180,90,W,H),fill=0,dtype='uint8')
print('BIOMES',np.unique(habitat,return_counts=True),flush=True)

with rasterio.open(CACHE/'etopo2022-60s.tif') as src:
 elevation=src.read(1,out_shape=(H,W),resampling=Resampling.bilinear)
 elevation=np.nan_to_num(elevation,nan=0).clip(-12000,12000).astype(np.int16)
 elev_meta={'crs':str(src.crs),'transform':list(src.transform),'size':[src.width,src.height],'resampling':'bilinear'}
print('ELEVATION',int(elevation.min()),int(elevation.max()),flush=True)

lakes=[]; lake_meta=[]
for p,s in features(shp('ne_10m_lakes.zip')):
 if str(p.get('featurecla','')).lower()=='reservoir':continue
 lakes.append((s.__geo_interface__,1))
 if s.bbox[2]-s.bbox[0]>.15 or s.bbox[3]-s.bbox[1]>.15:
  lake_meta.append({'name':p.get('name') or '', 'box':list(s.bbox)})
lake=rasterize(lakes,out_shape=(H,W),transform=from_bounds(-180,-90,180,90,W,H),fill=0,dtype='uint8')

# 기존 바다·해협·항구의 외곽선은 보존하고 내륙의 호수만 10m 축척 자료로 교체한다.
world=(ROOT/'js/data/world_data.js').read_text(encoding='utf-8')
blob=re.search(r'land:\s*"([A-Za-z0-9+/=]+)"',world).group(1)
old=np.unpackbits(np.frombuffer(zlib.decompress(base64.b64decode(blob)),dtype=np.uint8),bitorder='little').reshape(H,W)
labels,num=ndimage.label(old==0)
ocean_id=labels[int((90-30)/180*H),int((-30+180)/360*W)]
# wrap 경계에서 끊긴 태평양·극해도 바다로 둔다.
ocean_ids=np.unique(np.concatenate([labels[:,0],labels[:,-1],labels[0,:],labels[-1,:],np.array([ocean_id])]))
ocean_ids=ocean_ids[ocean_ids!=0]
ocean=np.isin(labels,ocean_ids)
land=((old!=0)|~ocean).astype(np.uint8); land[lake!=0]=0
changed=int(np.sum(old!=land));print('LAKE_BOUNDARY_CELLS',changed,flush=True)

rivers=[]; names=[]
for p,s in features(shp('ne_10m_rivers_lake_centerlines.zip')):
 name=p.get('name_en') or p.get('name') or ''
 rank=p.get('scalerank') or 9
 if 'Canal' in str(p.get('featurecla')) or str(name).lower().find('panama')>=0:continue
 if rank>7:continue
 parts=list(s.parts)+[len(s.points)]
 for a,b in zip(parts,parts[1:]):
  pts=s.points[a:b]
  # 원본 꼭짓점을 지나치게 줄이지 않고 실행용 소수 정밀도만 맞춘다.
  coords=[]
  for x,y,*_ in pts:
   q=[round(x,5),round(y,5)]
   if not coords or abs(q[0]-coords[-1][0])+abs(q[1]-coords[-1][1])>.002:coords.append(q)
  if len(coords)>1:rivers.append([str(name),int(rank),coords])
 names.append(name)
print('RIVERS',len(rivers), 'POINTS',sum(len(r[2]) for r in rivers),flush=True)
(OUT/'river-names.json').write_text(json.dumps(sorted(set(names)),ensure_ascii=False),encoding='utf-8')

encoded=(elevation.astype(np.int32)+12000).astype(np.uint16)
lake_signed=ndimage.distance_transform_edt(lake>0)-ndimage.distance_transform_edt(lake==0)
tex=np.zeros((H,W,4),dtype=np.uint8);tex[:,:,0]=encoded//256;tex[:,:,1]=encoded%256;tex[:,:,2]=habitat;tex[:,:,3]=np.clip(np.round(128+lake_signed*16),0,255).astype(np.uint8)
meta={'version':'20261125','W':W,'H':H,'sources':json.loads((CACHE/'manifest.json').read_text()),'elevation':elev_meta,
      'vegetation':'RESOLVE 2017 terrestrial biome geography; potential vegetation, not a 1480 forest census',
      'lakes':'Natural Earth 1:10 million, natural lakes only; reservoirs excluded','preserved':'existing ocean coast, ports and longitude/latitude units',
      'changedLakeCells':changed,'riverCount':len(rivers),'biomeCounts':{str(k):int(v) for k,v in zip(*np.unique(habitat,return_counts=True))}}
data={'W':W,'H':H,'tex':pack(tex),'land':pack(np.packbits(land.reshape(-1),bitorder='little')),'rivers':rivers,'lakes':lake_meta}
dst=ROOT/'js/data/terrain_detail.js'
dst.write_text('/* 공개 고도·생물군계·호수·강의 제작 결과. tools/world_detail/build.py와 sources/manifest.json 참조. */\n(function(G){G.TERRAIN_DETAIL='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';})(window.G=window.G||{});\n',encoding='utf-8')
np.savez_compressed(OUT/'terrain-source.npz',elevation=elevation,biome=habitat,lake=lake,land=land)
(OUT/'source-manifest.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf-8')
print('TERRAIN_DATA_READY',dst.stat().st_size,flush=True)
