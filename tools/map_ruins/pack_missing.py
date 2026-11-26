"""추가 유적을 지도 아틀라스와 거리용 투명 이미지로 묶는다."""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from pack import ROOT, SIDE, GUTTER, COLS, normalize, read_image, tidy_stone_edges


def register(files):
    manifest = ROOT/'images'/'manifest.js'
    existing = manifest.read_bytes()
    lines = existing.splitlines(keepends=True)
    eol = b'\r\n' if b'\r\n' in existing else b'\n'
    current = {json.loads(m[1]):json.loads(m[2]) for line in lines
               if (m:=re.match(rb'^  ("[^"\r\n]+"): ("[^"\r\n]+"),?\s*$',line))}
    additions = []
    for key, filename in sorted(files.items()):
        if key in current:
            if current[key] != filename:
                raise ValueError(f'{key}의 기존 그림을 교체하지 않습니다')
        else:
            additions.append(f'  "{key}": "{filename}",'.encode()+eol)
    marker = b'G.IMAGE_FILES = {'+eol
    manifest.write_bytes(existing.replace(marker,marker+b''.join(additions),1))


def full_sprite(raw):
    bounds = raw.getchannel('A').point(lambda p:255 if p>=33 else 0).getbbox()
    if not bounds:
        raise ValueError('불러온 모형에 보이는 픽셀이 없습니다')
    left,top,right,bottom = bounds
    return raw.crop((max(0,left-3),max(0,top-3),min(raw.width,right+3),min(raw.height,bottom+3)))


def contact(out, cards):
    cols,w,h = 5,242,200
    canvas=Image.new('RGB',(cols*w+24,((len(cards)+cols-1)//cols)*h+72),'#253030')
    d=ImageDraw.Draw(canvas)
    font='C:/Windows/Fonts/malgun.ttf'
    title=ImageFont.truetype(font,26)
    text=ImageFont.truetype(font,15)
    d.text((15,16),'누락됐던 도시·야외 유적 29곳',font=title,fill='#f4e6ca')
    for i,(row,picture) in enumerate(cards):
        x,y=12+i%cols*w,61+i//cols*h
        d.rounded_rectangle((x,y,x+w-8,y+h-8),radius=7,fill='#37433d')
        picture.thumbnail((213,145),Image.Resampling.LANCZOS)
        center=x+(w-8)//2
        canvas.paste(picture,(center-picture.width//2,y+151-picture.height),picture)
        d.text((center,y+162),row['name'],font=text,fill='#f4e6ca',anchor='mt')
    canvas.save(out/'missing-ruins-preview.jpg',quality=94)


def main(out):
    inventory = json.loads((out/'inventory.json').read_text(encoding='utf-8'))
    missing = {d['id']:d for d in inventory['ruins'] if not d['future'] and not
               (d['model'] or d['formation'] or d['cityArt'] or d['oldArt'] or (d['how']!='city' and d['key']))}
    layout = json.loads((out/'blender-layout.json').read_text(encoding='utf-8'))
    if set(layout)|{'vesta'} != set(missing):
        raise ValueError(f'렌더한 항목과 누락 목록의 차이 {sorted((set(layout)|{"vesta"})^set(missing))}')
    target = ROOT/'images'/'map-ruin-additions'
    target.mkdir(exist_ok=True)
    groups,entries,files,cards=defaultdict(list),{}, {},[]
    for site,row in missing.items():
        if site in layout:
            group,x,y,w,h,ax,ay=layout[site]
            raw=read_image(out/'blender-renders'/f'{group}.png').crop((x,y,x+w,y+h))
            art,anchor=normalize(raw,(ax,ay))
        else:
            group='completion-3'
            raw=tidy_stone_edges(read_image(ROOT/'images'/(row['source']['key']+'.webp')))
            art,anchor=normalize(raw)
        groups[group].append((site,art,anchor,'blender' if site in layout else 'legacy'))
        full=full_sprite(raw)
        cards.append((row,full))
        if row['how']=='city':
            key=f'landmarks/{site}'
            relative=f'{key}.webp'
            full.save(ROOT/'images'/relative,quality=93,method=4,alpha_quality=100)
            files[key]=relative
    for group,sprites in sorted(groups.items()):
        cols=min(COLS,len(sprites))
        sheet=Image.new('RGBA',(cols*SIDE,((len(sprites)+cols-1)//cols)*SIDE))
        key=f'map-ruin-additions/{group}'
        for i,(site,art,anchor,origin) in enumerate(sprites):
            x,y=i%cols*SIDE+GUTTER,i//cols*SIDE+GUTTER
            sheet.paste(art,(x,y))
            tier=0 if site in ('ds_687','ds_850') else 1
            entries[site]=[key,x,y,art.width,art.height,*anchor,tier,origin]
        sheet.save(target/f'{group}.webp',quality=89,alpha_quality=100,method=4)
        files[key]=f'{key}.webp'
    body=',\n'.join(f'  {json.dumps(site)}: {json.dumps(entry,separators=(",",":"))}' for site,entry in sorted(entries.items()))
    (ROOT/'js'/'data'/'ruin_additions.js').write_text(
        '/* tools/map_ruins/pack_missing.py가 생성한 추가 유적의 지도 그림과 발치. */\n'
        "(function (G) { 'use strict';\nG.RUIN_ADDITIONS = {\n"+body+"\n};\n})(window.G = window.G || {});\n",encoding='utf-8')
    register(files)
    contact(out,cards)
    print(f'지도 외관 {len(entries)}곳과 거리 외관 {sum(d["how"]=="city" for d in missing.values())}곳 등록')


if __name__=='__main__':
    main(Path(sys.argv[1]).resolve())
