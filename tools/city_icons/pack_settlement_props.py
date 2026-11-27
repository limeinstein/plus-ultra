"""도시 표식의 투명 WebP와 지도 발치 좌표를 만든다."""
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'/'map_ruins'))
from pack_missing import register


def main(out):
    layout=json.loads((out/'layout.json').read_text(encoding='utf8'))
    target=ROOT/'images'/'map-settlements'
    target.mkdir(exist_ok=True)
    results,entries={},{}
    with Image.open(out/'blender-renders'/'settlement-props.png') as sheet:
        for name,(x,y,w,h,ax,ay) in layout.items():
            raw=sheet.crop((x,y,x+w,y+h))
            a=raw.getchannel('A').point(lambda v:255 if v>22 else 0)
            bounds=a.getbbox()
            if not bounds:raise ValueError(f'{name} 모형이 비었습니다')
            l,t,r,b=bounds
            if min(l,t,w-r,h-b)<2:raise ValueError(f'{name} 모형이 렌더 경계에 걸쳤습니다')
            art=raw.crop(bounds)
            relative=f'map-settlements/{name}.webp'
            art.save(ROOT/'images'/relative,quality=92,alpha_quality=100,method=6)
            results[name]=[0,0,r-l,b-t,round((ax-l)/(r-l),5),round((ay-t)/(r-l),5)]
            entries[f'map-settlements/{name}']=relative
    data=json.dumps(results,separators=(',',':'))
    (ROOT/'js'/'data'/'city_props.js').write_text('/* tools/city_icons/pack_settlement_props.py가 만든 지도 표식과 발치. */\n'
        "(function (G) { 'use strict';\nG.CITY_PROPS = "+data+";\n})(window.G = window.G || {});\n",encoding='utf8')
    register(entries)


if __name__=='__main__':main(Path(sys.argv[1]).resolve())
