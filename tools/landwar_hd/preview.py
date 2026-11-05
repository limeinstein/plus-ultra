"""포장한 실제 장면을 모아 움직이는 검토용 그림을 만든다. python tools/landwar_hd/preview.py"""
from pathlib import Path
import json
import re
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[2]
WORK=ROOT/'artifacts/landwar-hd-20261105'
text=(ROOT/'js/data/landwarmotion.js').read_text('utf8')
meta=json.loads(re.search(r'G.LANDWAR_HD=(.*?);\n',text).group(1))
choices=[('musketeers',2,'총병 · 조준과 사격'),('cannons',2,'포병 · 점화와 반동'),('cavalry_horse',2,'말 기병 · 돌격'),
         ('cavalry_camel',1,'낙타 기병 · 돌격'),('cavalry_elephant',2,'코끼리 · 돌진'),('animals_hd',3,'호랑이 · 달리기와 덮치기'),
         ('regional_america_a',5,'안데스 · 돌팔매'),('regional_pacific_b',3,'오스트레일리아 · 부메랑'),('regional_pacific_a',5,'아오테아로아 · 투창')]
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',15)
atlases={id:Image.open(ROOT/'images/sprites'/(meta[id]['image']+'.webp')).convert('RGBA') for id,_,_ in choices}
frames=[]
sequence=[0,1,2,1,2,3,4,5,6,0]
for pose in sequence:
    result=Image.new('RGB',(900,660),'#26313a');d=ImageDraw.Draw(result)
    for i,(id,row,title) in enumerate(choices):
        x=i%3*300;y=i//3*220;m=meta[id];a=atlases[id]
        cell=a.crop((pose*m['cw'],row*m['ch'],(pose+1)*m['cw'],(row+1)*m['ch']))
        body=m.get('bhs',[m['bh']]*len(m['rows']))[row]
        size=112 if id.startswith('cavalry') else 90 if id=='animals_hd' else 127
        k=size/body;cell=cell.resize((round(cell.width*k),round(cell.height*k)),Image.Resampling.LANCZOS)
        xx=x+150-round(m['px']*k);yy=y+177-round(m['py']*k)
        d.ellipse((x+94,y+174,x+206,y+188),fill='#1c252c')
        result.paste(cell,(xx,yy),cell)
        d.text((x+20,y+195),title,font=font,fill='#e6d7b7')
    frames.append(result)
frames[0].save(WORK/'motion.gif',save_all=True,append_images=frames[1:],duration=[500,130,130,130,130,300,180,180,350,500],loop=0,disposal=2)
frames[0].save(WORK/'selected.jpg',quality=94)
shots=([WORK/'runtime-explosion.png'] if (WORK/'runtime-explosion.png').exists() else [])+sorted(WORK.glob('runtime-explosion-*.png'))
if shots:
    screenshots=[]
    for p in shots:
        im=Image.open(p).convert('RGB');im.thumbnail((1000,500),Image.Resampling.LANCZOS);screenshots.append(im)
    screenshots[0].save(WORK/'explosion.gif',save_all=True,append_images=screenshots[1:],duration=140,loop=0)
print('motion.gif · selected.jpg'+(' · explosion.gif' if shots else ''))
