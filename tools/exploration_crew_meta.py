#!/usr/bin/env python3
"""남녀 부하·제독의 원본을 보관하고 방향별 기준 키를 같은 이동 수단에 맞춘다."""
import copy
import json
import shutil
import statistics
from pathlib import Path
from PIL import Image, ImageDraw
from expedition_motion_meta import inspect

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts/exploration-crew-20261031'

def row_heights(m):
    return [round(statistics.median(c[5] for c in m['cells'][r*4:r*4+4]), 3) for r in range(8)]

def main():
    specs = json.loads((ROOT/'tools/exploration_crew_prompts.json').read_text(encoding='utf-8'))['assets']
    records = json.loads((OUT/'generated.json').read_text(encoding='utf-8'))['records']
    selected = {r['id']: r for r in records}
    base = json.loads((ROOT/'artifacts/exploration-formation-20261029/manifest.json').read_text(encoding='utf-8'))
    data = {'sheets': {}}
    for kind, original in base['sheets'].items():
        m = copy.deepcopy(original)
        m.update(rowHeights=row_heights(m), gender='m', kind=kind)
        data['sheets']['male_'+kind] = m
    for a in specs:
        if a['id'] not in selected:
            continue
        sid, kind = a['id'], a['kind']
        source = OUT/'sources'/(sid+'.png')
        src = Path(selected[sid]['source'])
        if src.exists() and src.resolve()!=source.resolve():
            shutil.copy2(src, source)
        assert source.exists(), sid
        dest = ROOT/'images/sprites'/('expedition_crew_'+sid+'.png')
        shutil.copy2(source, dest)
        m = inspect(dest, 4, 8, walking=True)
        m.update(key='sprites/'+dest.stem, file='sprites/'+dest.name,
                 kind=kind, gender='f' if a['type']=='female' else 'm',
                 targetHeight=base['sheets'][kind]['targetHeight'],
                 directionRows=copy.deepcopy(base['sheets'][kind]['directionRows']), rowHeights=row_heights(m))
        data['sheets'][sid] = m
    (OUT/'manifest.json').write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n',encoding='utf-8')
    text=('/* 자동 생성: python tools/exploration_crew_meta.py. 제독·남녀 부하의 이동 수단별 키를 맞춘다. */\n'
          '(function(G){\'use strict\';G.EXPEDITION_CREW='+json.dumps(data, ensure_ascii=False,separators=(',',':'))+';\n'
          'G.IMAGE_FILES=G.IMAGE_FILES||{};Object.keys(G.EXPEDITION_CREW.sheets).forEach(function(id){var s=G.EXPEDITION_CREW.sheets[id];if(!G.IMAGE_FILES[s.key])G.IMAGE_FILES[s.key]=s.file;});\n'
          '})(window.G=window.G||{});\n')
    (ROOT/'js/data/expedition_crew.js').write_text(text,encoding='utf-8')
    rows=(len(data['sheets'])+3)//4
    canvas=Image.new('RGB',(1280,rows*240),'#34463c');draw=ImageDraw.Draw(canvas)
    for i,(sid,m) in enumerate(data['sheets'].items()):
        x,y=i%4*320,i//4*240;draw.text((x+12,y+10),sid,fill='#f1e0b1')
        with Image.open(ROOT/'images'/m['file']) as im:
            c=m['cells'][8];tile=im.crop((c[0],c[1],c[0]+c[2],c[1]+c[3]));tile.thumbnail((290,200),Image.Resampling.LANCZOS)
            canvas.paste(tile,(x+(320-tile.width)//2,y+230-tile.height),tile)
    canvas.save(OUT/'source-preview.jpg',quality=94)
    print(f"추가 원본 {len(selected)}장, 표시 시트 {len(data['sheets'])}종")

if __name__=='__main__':
    main()
