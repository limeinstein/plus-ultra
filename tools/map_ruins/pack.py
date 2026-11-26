"""Pack map-sized ruin sprites and retain their ground anchors in the game metadata."""
import json
import re
import sys
from collections import defaultdict
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
TODAY = ROOT / 'artifacts' / 'map-ruins-20261126'
SIDE = 224
GUTTER = 3
COLS = 4
BIG = set('giza pyramid thebes abusimbel petra angkor borobudur greatwall persepolis '
          'machupicchu chichen tikal teotihuacan luxor angkorthom prambanan brihadeeswarar '
          'ds_083 ds_308 ds_319 ds_342 ds_355 ds_678 ds_679 ds_680 ds_686'.split())
PREFER_LEGACY = {'stonehenge'}


@lru_cache(maxsize=24)
def read_image(path):
    with Image.open(path) as image:
        return image.convert('RGBA')


def normalize(image, ground=None):
    alpha = image.getchannel('A')
    bounds = alpha.point(lambda p: 255 if p >= 36 else 0).getbbox()
    if not bounds:
        raise ValueError('Sprite source contains no visible pixels')
    box = (max(0,bounds[0]-2), max(0,bounds[1]-2), min(image.width,bounds[2]+2), min(image.height,bounds[3]+2))
    image = image.crop(box)
    if ground is None:
        ground = ((bounds[0]+bounds[2])/2, bounds[1]+.91*(bounds[3]-bounds[1]))
    anchor = [(ground[0]-box[0])/image.width, (ground[1]-box[1])/image.width]
    image.thumbnail((SIDE-2*GUTTER,SIDE-2*GUTTER),Image.Resampling.LANCZOS)
    return image, [round(n,4) for n in anchor]


def source_tile(legacy, files):
    path = ROOT/'images'/files[legacy['key']]
    image = read_image(path)
    cols,rows = legacy['cols'],legacy['rows']
    if cols == rows == 1:
        return image
    col,row = legacy['slot']%cols,legacy['slot']//cols
    w,h = image.width/cols,image.height/rows
    box = tuple(round(v) for v in (col*w+1,row*h+1,(col+1)*w-1,(row+1)*h-1))
    tile = image.crop(box)
    # Older sheets occasionally touch their neighbors. Preserve the main silhouette
    # and small pieces of rubble, while fading the 1–2 px shared cell border.
    edge = Image.new('L',tile.size,0)
    draw = ImageDraw.Draw(edge)
    draw.rectangle((1,1,tile.width-2,tile.height-2),fill=120)
    draw.rectangle((2,2,tile.width-3,tile.height-3),fill=255)
    tile.putalpha(ImageChops.multiply(tile.getchannel('A'),edge))
    return tile


def stonehenge_finish(image):
    # Keep the original close, irregular stones and grass between them. The original
    # matte left saturated red/yellow pixels in the semi-transparent silhouette.
    alpha = image.getchannel('A')
    core = alpha.filter(ImageFilter.MinFilter(3))
    rgb = image.convert('RGB')
    muted = ImageEnhance.Color(rgb).enhance(.80)
    edge = ImageEnhance.Color(rgb).enhance(.14)
    edited = Image.composite(muted,edge,core)
    edited.putalpha(ImageChops.multiply(alpha,core.point(lambda a: min(255,128+a))))
    return edited


def location(row, image):
    if row['id'] in BIG:
        return 2
    if row['how']=='sea' or image.height/image.width < .32 or re.search('암각|동굴|고분|돌비|선돌|동굴벽화',row['name']):
        return 0
    return 1


def pack(rows, layout, files, out):
    groups = defaultdict(list)
    entries = {}
    singles = defaultdict(list)
    for row in rows:
        site = row['id']
        if row['future'] or row['formation']:
            continue
        if site in layout and site not in PREFER_LEGACY:
            source,x,y,w,h,ax,ay = layout[site]
            frame = read_image(out/'blender-renders'/f'{source}.png').crop((x,y,x+w,y+h))
            image, anchor = normalize(frame,(ax,ay))
            group, origin = source, 'blender'
        elif row['how']!='city' and row['source']:
            legacy = row['source']
            frame = source_tile(legacy,files)
            if site == 'stonehenge':
                frame = stonehenge_finish(frame)
            image, anchor = normalize(frame)
            if legacy['cols']==legacy['rows']==1:
                singles[row.get('region',0)].append((row,image,anchor,'legacy'))
                continue
            group, origin = legacy['key'].rsplit('/',1)[-1], 'legacy'
        else:
            continue
        groups[group].append((row,image,anchor,origin))
    for region, sprites in singles.items():
        for i in range(0,len(sprites),16):
            groups[f'exteriors-{region}-{i//16+1}'] = sprites[i:i+16]

    target = ROOT/'images'/'map-ruins'
    target.mkdir(exist_ok=True)
    for group, sprites in sorted(groups.items()):
        cols = min(COLS,len(sprites))
        sheet = Image.new('RGBA',(cols*SIDE,((len(sprites)+cols-1)//cols)*SIDE))
        for i,(site,image,anchor,origin) in enumerate(sprites):
            x,y = i%cols*SIDE+GUTTER, i//cols*SIDE+GUTTER
            sheet.paste(image,(x,y))
            entries[site['id']] = [f'map-ruins/{group}',x,y,image.width,image.height,*anchor,location(site,image),origin]
        sheet.save(target/f'{group}.webp',quality=88,alpha_quality=100,method=4)

    models = ROOT/'js'/'data'/'ruin_models.js'
    header = '/* tools/map_ruins/pack.py가 생성한 지도 유적 아틀라스 좌표 및 발치. */\n'
    body = ',\n'.join(f'  {json.dumps(site)}: {json.dumps(data,separators=(",",":"))}' for site,data in sorted(entries.items()))
    models.write_text(header+"(function (G) { 'use strict';\nG.RUIN_MODELS = {\n"+body+"\n};\n})(window.G = window.G || {});\n",encoding='utf-8')
    manifest = ROOT/'images'/'manifest.js'
    old = manifest.read_bytes()
    newline = b'\r\n' if b'\r\n' in old else b'\n'
    manifest_line = b'G.IMAGE_FILES = {'+newline
    current = re.sub(rb'^  "map-ruins/[^\n]+\n',b'',old,flags=re.M)
    register = [f'  "map-ruins/{name}": "map-ruins/{name}.webp",'.encode() for name in sorted(groups)]
    manifest.write_bytes(current.replace(manifest_line,manifest_line+newline.join(register)+newline,1))
    return entries


def contact_sheet(rows, entries, out):
    ids = 'stonehenge giza pyramid thebes petra borobudur angkor greatwall machupicchu chichen seokguram parthenon ds_083 ds_319 ds_329 ds_678'.split()
    names = {row['id']:row['name'] for row in rows}
    card_w,card_h = 284,242
    canvas = Image.new('RGB',(1168,1050),'#202a28')
    draw = ImageDraw.Draw(canvas)
    font = 'C:/Windows/Fonts/malgun.ttf'
    title = ImageFont.truetype(font,27)
    body = ImageFont.truetype(font,16)
    draw.text((22,16),'유적·건축 발견물  |  지도 미리보기',font=title,fill='#f3e7cd')
    for i,site in enumerate(ids):
        key,x,y,w,h,*_ = entries[site]
        art = read_image(ROOT/'images'/f'{key}.webp').crop((x,y,x+w,y+h))
        art.thumbnail((226,177),Image.Resampling.LANCZOS)
        dx,dy = 21+i%4*card_w,64+i//4*card_h
        draw.rounded_rectangle((dx,dy,dx+card_w-10,dy+card_h-9),radius=9,fill='#38423c')
        cx,cy = dx+(card_w-10)//2,dy+182
        draw.ellipse((cx-76,cy-8,cx+76,cy+7),fill='#303a33')
        canvas.paste(art,(cx-art.width//2,cy-art.height+4),art)
        draw.text((cx,dy+202),names[site],font=body,fill='#f2e5c9',anchor='mt')
    canvas.save(out/'ruin-models.jpg',quality=94)


def main():
    out = Path(sys.argv[1]).resolve() if len(sys.argv)>1 else TODAY
    rows = json.loads((out/'source.json').read_text(encoding='utf-8'))
    layout = json.loads((out/'blender-layout.json').read_text(encoding='utf-8'))
    manifest = (ROOT/'images'/'manifest.js').read_text(encoding='utf-8')
    files = json.JSONDecoder().raw_decode(manifest.split('G.IMAGE_FILES = ',1)[1])[0]
    entries = pack(rows,layout,files,out)
    contact_sheet(rows,entries,out)
    print(f'{len(entries)} map models, {sum(e[-1]=="blender" for e in entries.values())} Blender renders')


if __name__=='__main__':
    main()
