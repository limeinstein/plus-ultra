"""호수 가장자리의 거리장을 저장해 경계의 계단·해수 색 네모를 없앤다."""
from pathlib import Path
import json,zlib,base64,numpy as np
from scipy import ndimage
ROOT=Path(__file__).resolve().parents[2];file=ROOT/'js/data/terrain_detail.js'
s=file.read_text(encoding='utf-8');a=s.index('G.TERRAIN_DETAIL=')+len('G.TERRAIN_DETAIL=');b=s.index(';}',a);d=json.loads(s[a:b])
raw=np.frombuffer(zlib.decompress(base64.b64decode(d['tex'])),dtype=np.uint8).reshape(d['H'],d['W'],4).copy()
lake=np.load(ROOT/'artifacts/world-detail-20261125/terrain-source.npz')['lake']>0
signed=ndimage.distance_transform_edt(lake)-ndimage.distance_transform_edt(~lake)
raw[:,:,3]=np.clip(np.round(128+signed*16),0,255).astype(np.uint8)
d['tex']=base64.b64encode(zlib.compress(raw.tobytes(),9)).decode();d['lakeField']='signed distance, alpha=(128+distanceInCells*16)/255'
file.write_text(s[:a]+json.dumps(d,ensure_ascii=False,separators=(',',':'))+s[b:],encoding='utf-8');print('LAKE_DISTANCE_READY')
