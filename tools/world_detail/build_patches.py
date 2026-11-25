"""산악·탐험 지역에서는 ETOPO 60초 원본을 지역 판으로 읽어 전 세계 축소판보다 세밀하게 쓴다."""
from pathlib import Path
import rasterio,numpy as np,json,zlib,base64
from rasterio.windows import from_bounds
from rasterio.enums import Resampling
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'artifacts/world-detail-20261125'
areas=[
 ('alps-west',3,44,9,49),('alps-east',9,44,15,49),('iberia',-10,35,-3,43),('anatolia',24,35,39,43),
 ('himalaya-west',72,27,82,36),('himalaya-east',82,25,92,32),('china-karst',105,22,115,31),('japan',134,31,142,39),
 ('korea',125,33,131,40),('malay',96,-1,105,8),('borneo',111,-2,120,7),('java',104,-10,116,-5),
 ('kilimanjaro',33,-6,40,0),('cape',16,-36,23,-30),('atlas',-10,28,1,37),('ethiopia',34,5,43,15),
 ('canyon',-115,33,-108,39),('rockies',-115,47,-104,55),('california',-125,35,-117,43),('mexico',-104,16,-95,23),
 ('andes-north',-80,-5,-72,5),('andes-peru',-79,-19,-68,-10),('andes-south',-76,-56,-66,-45),('iguazu',-59,-29,-51,-22),
 ('iceland',-25,63,-13,67),('scandinavia',4,57,14,65),('newzealand',166,-47,175,-40),('australia',128,-29,138,-21)
]
side=512;layers=[];meta=[]
with rasterio.open(OUT/'sources/etopo2022-60s.tif') as src:
 for name,x0,y0,x1,y1 in areas:
  h=src.read(1,window=from_bounds(x0,y0,x1,y1,src.transform),out_shape=(side,side),resampling=Resampling.bilinear)
  q=(np.clip(h,-12000,12000)+12000).astype(np.uint16)
  raw=np.zeros((side,side,2),dtype=np.uint8);raw[:,:,0]=q//256;raw[:,:,1]=q%256;layers.append(raw)
  meta.append({'name':name,'rect':[x0,y0,x1-x0,y1-y0]})
data={'side':side,'areas':meta,'data':base64.b64encode(zlib.compress(np.stack(layers).tobytes(),9)).decode('ascii')}
(ROOT/'js/data/terrain_patches.js').write_text('/* ETOPO 2022 60각초 원본의 지역별 고도. 제작: tools/world_detail/build_patches.py */\n(function(G){G.TERRAIN_PATCHES='+json.dumps(data,separators=(',',':'))+';})(window.G=window.G||{});\n',encoding='utf-8')
(OUT/'patch-manifest.json').write_text(json.dumps({'source':'ETOPO 2022 60 arc-second','side':side,'areas':meta},ensure_ascii=False,indent=2),encoding='utf-8')
print('PATCHES_READY',len(meta),len(data['data']),flush=True)
