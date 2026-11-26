"""자연 유적의 투명 원화와 새 Blender 모형을 지도용으로 묶는다."""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont

from pack import ROOT, SIDE, GUTTER, COLS, normalize, read_image, source_tile
from pack_missing import register


def finish(image):
    alpha=image.getchannel('A')
    core=alpha.filter(ImageFilter.MinFilter(3))
    rgb=image.convert('RGB')
    image=Image.composite(rgb,ImageEnhance.Color(rgb).enhance(.22),core)
    image.putalpha(ImageChops.multiply(alpha,core.point(lambda a:min(255,142+a))))
    return image


def set_tier(d,image):
    if d['how']=='special' or image.height/image.width<.30:
        return 0
    if d['id'] in ('canyon','siwa','halong','amazon','ds_386','ds_632','ds_640','ds_646'):
        return 2
    return 2 if re.search('폭포|피오르|설산|화산|산맥|고원|사구|빙하|돌숲|분화구|계곡|산$',d['name']) else 1


def contact(out,entries,rows):
    featured='huangshan matterhorn canyon iguazu ds_378 ds_379 ds_385 ds_388 ds_397 ds_645 ds_650 ds_386 ds_400 ds_636 maldives'.split()
    cols,cw,ch=5,230,190
    canvas=Image.new('RGB',(cols*cw+24,((len(featured)+cols-1)//cols)*ch+72),'#253030')
    draw=ImageDraw.Draw(canvas)
    font='C:/Windows/Fonts/malgun.ttf'
    title=ImageFont.truetype(font,26)
    text=ImageFont.truetype(font,15)
    draw.text((16,17),'자연 발견물  |  지도 미리보기',font=title,fill='#f4e6ca')
    for i,site in enumerate(featured):
        key,x,y,w,h,*_=entries[site]
        picture=read_image(ROOT/'images'/f'{key}.webp').crop((x,y,x+w,y+h))
        picture.thumbnail((206,140),Image.Resampling.LANCZOS)
        bx,by=12+i%cols*cw,62+i//cols*ch
        draw.rounded_rectangle((bx,by,bx+cw-8,by+ch-8),radius=7,fill='#37433d')
        center=bx+(cw-8)//2
        canvas.paste(picture,(center-picture.width//2,by+148-picture.height),picture)
        draw.text((center,by+157),rows[site]['name'],font=text,fill='#f4e6ca',anchor='mt')
    canvas.save(out/'nature-preview.jpg',quality=94)


def main(out):
    originals=json.loads((out/'inventory.json').read_text(encoding='utf-8'))
    blender=json.loads((out/'blender-layout.json').read_text(encoding='utf-8'))
    missing={d['id'] for d in originals if not d['source']}
    if missing!=set(blender):
        raise ValueError(f'자연 명소 그림 누락 {sorted(missing^set(blender))}')
    manifest=(ROOT/'images'/'manifest.js').read_text(encoding='utf-8')
    files=json.JSONDecoder().raw_decode(manifest.split('G.IMAGE_FILES = ',1)[1])[0]
    groups,regional=defaultdict(list),defaultdict(list)
    rows={d['id']:d for d in originals}
    for d in originals:
        site=d['id']
        if site in blender:
            group,x,y,w,h,ax,ay=blender[site]
            raw=read_image(out/'blender-renders'/f'{group}.png').crop((x,y,x+w,y+h))
            image,anchor=normalize(raw,(ax,ay))
            origin='blender'
        else:
            source=d['source']
            raw=source_tile(source,files)
            if d['how']!='special':raw=finish(raw)
            image,anchor=normalize(raw)
            origin='legacy'
            if source['cols']==source['rows']==1:
                regional[d.get('region',0)].append((site,image,anchor,origin))
                continue
            group=source['key'].rsplit('/',1)[-1]
        groups[group].append((site,image,anchor,origin))
    for region,sprites in regional.items():
        for i in range(0,len(sprites),16):groups[f'region-{region}-{i//16+1}']=sprites[i:i+16]
    paths,entries={},{}
    target=ROOT/'images'/'map-nature'
    target.mkdir(exist_ok=True)
    for group,sprites in sorted(groups.items()):
        cols=min(COLS,len(sprites))
        sheet=Image.new('RGBA',(cols*SIDE,((len(sprites)+cols-1)//cols)*SIDE))
        key=f'map-nature/{group}'
        for i,(site,image,anchor,origin) in enumerate(sprites):
            x,y=i%cols*SIDE+GUTTER,i//cols*SIDE+GUTTER
            sheet.paste(image,(x,y))
            h=image.height/image.width
            ax,ay=min(.86,max(.14,anchor[0])),min(h*.97,max(h*.50,anchor[1]))
            entries[site]=[key,x,y,image.width,image.height,round(ax,5),round(ay,5),set_tier(rows[site],image),origin]
        sheet.save(target/f'{group}.webp',quality=89,method=4,alpha_quality=100)
        paths[key]=f'{key}.webp'
    body=',\n'.join(f'  {json.dumps(site)}: {json.dumps(value,separators=(",",":"))}' for site,value in sorted(entries.items()))
    (ROOT/'js'/'data'/'nature_landmarks.js').write_text('/* tools/map_ruins/pack_nature.py가 생성한 자연 발견물 지도 그림과 발치. */\n'
            "(function (G) { 'use strict';\nG.NATURE_LANDMARKS = {\n"+body+"\n};\n})(window.G = window.G || {});\n",encoding='utf-8')
    register(paths)
    contact(out,entries,rows)
    print(len(entries),'landmarks;',len(blender),'new Blender models;',len(paths),'sheets')


if __name__=='__main__':main(Path(sys.argv[1]).resolve())
