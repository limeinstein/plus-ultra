"""블렌더 아틀라스와 기존 발견물 외관을 지도에 맞는 투명 WebP로 묶는다."""
import json
import re
from pathlib import Path

from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'artifacts/city-icons-world-20261126'
DEST=ROOT/'images/map-cities'
DEST.mkdir(exist_ok=True)
index={}
sheets={}


def add(name, path, img):
    full=DEST/path
    full.parent.mkdir(exist_ok=True)
    img.save(full,'WEBP',quality=88,method=6,exact=True)
    index['map-cities/'+name]='map-cities/'+path


source=json.loads((OUT/'atlas-source.json').read_text(encoding='utf-8'))
for key,parts in source.items():
    with Image.open(OUT/'blender-renders'/f'{key}.png') as img:
        rgba=img.convert('RGBA')
        entries={}
        for name,(x,y,w,h,ax,ay) in parts.items():
            alpha=rgba.getchannel('A').crop((x,y,x+w,y+h))
            bounds=alpha.point(lambda v: 255 if v>15 else 0).getbbox()
            if bounds is None:
                raise ValueError((key,name,'빈 모형'))
            l,t,r,b=bounds
            if min(l,t,w-r,h-b)<1:
                raise ValueError((key,name,bounds,'아틀라스 칸 경계'))
            entries[name]=[x+l,y+t,r-l,b-t,round((ax-l)/(r-l),5),round((ay-t)/(r-l),5)]
        add(key,key+'.webp',rgba)
        sheets[key]=entries

photos={}
for src in sorted((ROOT/'images/landmarks').glob('*.webp')):
    with Image.open(src) as img:
        if 'A' not in img.getbands():
            continue
        alpha=img.getchannel('A')
        bounds=alpha.point(lambda v: 255 if v>24 else 0).getbbox()
        if not bounds:
            continue
        img=img.crop(bounds)
        img.thumbnail((236,228),Image.Resampling.LANCZOS)
        name=src.stem
        add('landmarks/'+name,'landmarks/'+name+'.webp',img)
        photos[name]=[img.width,img.height]

data={'sheets':sheets,'photos':photos}
body=json.dumps(data,separators=(',',':'),ensure_ascii=False)
(ROOT/'js/data/city_models.js').write_text(
    '/* 도시 외관 아틀라스 좌표. 제작: tools/city_icons/world_pack.py */\n'
    '(function(G){G.CITY_MODELS='+body+';})(window.G=window.G||{});\n',encoding='utf-8')

manifest=ROOT/'images/manifest.js'
content=manifest.read_text(encoding='utf-8')
content=re.sub(r'^  "map-cities/[^"]+": "[^"]+",\n','',content,flags=re.M)
entries=''.join('  '+json.dumps(k)+': '+json.dumps(v)+',\n' for k,v in sorted(index.items()))
content=content.replace('G.IMAGE_FILES = {\n','G.IMAGE_FILES = {\n'+entries,1)
manifest.write_text(content,encoding='utf-8')
print(f'도시 시설 아틀라스 {len(sheets)}장, 기존 투명 외관 {len(photos)}개')
