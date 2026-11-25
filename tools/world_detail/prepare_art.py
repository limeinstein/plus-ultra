"""Blender용 실제 산 고도 판과 제작 함수 준비. 실행 때만 원본에서 추출한다."""
from pathlib import Path
import json, numpy as np, rasterio
from rasterio.windows import from_bounds
from rasterio.enums import Resampling
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'artifacts/world-detail-20261125/blender'
OUT.mkdir(parents=True,exist_ok=True)
old=ROOT.parent/'output/terrain-reference-20261125/build_reference_examples.py'
(Path(__file__).parent/'blender_helpers.py').write_text(old.read_text(encoding='utf-8').split('def build_scene(')[0],encoding='utf-8')
meta=json.loads((OUT.parent/'before/world-meta.json').read_text(encoding='utf-8'))['nature']
ids={'fuji':.14,'kilimanjaro':.30,'everest':.23,'matterhorn':.13,'machapuchare':.16,'vihren':.16,'torrespaine':.18,'vinicunca':.13,'kailash':.19,'kinabalu':.17,'damavand':.20,'yulong':.18}
data=[]
with rasterio.open(OUT.parent/'sources/etopo2022-60s.tif') as ds:
 for d in meta:
  if d['id'] not in ids:continue
  half=ids[d['id']]; lon,lat=d['lon'],d['lat']; cos=max(.3,np.cos(np.radians(lat)))
  arr=ds.read(1,window=from_bounds(lon-half/cos,lat-half,lon+half/cos,lat+half,ds.transform),out_shape=(97,97),resampling=Resampling.bilinear)
  data.append(dict(d,half=half,side=97,heights=arr.astype(float).round(1).ravel().tolist()))
(OUT/'mountain-heights.json').write_text(json.dumps(data,ensure_ascii=False),encoding='utf-8')
print('Prepared real ETOPO mountain patches:',len(data))
