"""공개 원본 자료를 작업 캐시에 보관한다. 게임 실행에는 압축 결과만 포함한다."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import requests, hashlib, json, time
ROOT=Path(__file__).resolve().parents[2]
CACHE=ROOT/'artifacts'/'world-detail-20261125'/'sources'; CACHE.mkdir(parents=True,exist_ok=True)
URLS={
 'etopo2022-60s.tif':'https://www.ngdc.noaa.gov/mgg/global/relief/ETOPO2022/data/60s/60s_surface_elev_gtif/ETOPO_2022_v1_60s_N90W180_surface.tif',
 'ecoregions2017.zip':'https://storage.googleapis.com/teow2016/Ecoregions2017.zip',
 'ne_10m_rivers_lake_centerlines.zip':'https://naturalearth.s3.amazonaws.com/10m_physical/ne_10m_rivers_lake_centerlines.zip',
 'ne_10m_lakes.zip':'https://naturalearth.s3.amazonaws.com/10m_physical/ne_10m_lakes.zip',
 'ne_10m_land.zip':'https://naturalearth.s3.amazonaws.com/10m_physical/ne_10m_land.zip'
}
def get(item):
 name,url=item; dst=CACHE/name
 if dst.exists() and dst.stat().st_size>10000:
  print('CACHED',name,dst.stat().st_size,flush=True)
 else:
  for attempt in range(3):
   try:
    with requests.get(url,stream=True,timeout=(20,90)) as r:
     r.raise_for_status(); total=int(r.headers.get('Content-Length',0)); count=0; report=0
     with dst.with_suffix(dst.suffix+'.part').open('wb') as f:
      for b in r.iter_content(1024*1024):
       f.write(b); count+=len(b)
       if count-report>30*1024*1024:print('DOWNLOAD',name,count,total,flush=True); report=count
     if total and count!=total:raise IOError('incomplete download')
    dst.with_suffix(dst.suffix+'.part').replace(dst); break
   except Exception as e:
    print('RETRY',name,attempt,repr(e),flush=True)
    if attempt==2:raise
    time.sleep(2)
 h=hashlib.sha256()
 with dst.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return {'file':name,'url':url,'bytes':dst.stat().st_size,'sha256':h.hexdigest()}
with ThreadPoolExecutor(max_workers=3) as pool:rows=list(pool.map(get,URLS.items()))
(CACHE/'manifest.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
print('SOURCES_READY',flush=True)
