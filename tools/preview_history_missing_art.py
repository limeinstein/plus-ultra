#!/usr/bin/env python3
"""이번 역사 이벤트 보완분의 인물과 장면 미리보기를 한곳에 모은다."""
import json
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw,ImageFont

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/history-missing-art-20261029'

def preview():
    OUT.mkdir(parents=True,exist_ok=True)
    assets=[]
    for filename in ['history_gap_art_prompts.json','history_addon_art_prompts.json']:
        assets.extend(json.loads((ROOT/'tools'/filename).read_text(encoding='utf-8'))['assets'])
    font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',15)
    def sheet(items,kind,cols,cw,ch,name):
        canvas=Image.new('RGB',(cols*cw,((len(items)+cols-1)//cols)*ch),'#302b28')
        draw=ImageDraw.Draw(canvas)
        for i,a in enumerate(items):
            x,y=i%cols*cw,i//cols*ch
            key=('legend-events/'+a['id']+'.webp') if a['type']=='scene' else a.get('portrait_dir','portraits/history')+'/'+a['id']+('_half.webp' if kind=='portrait' else '.webp')
            with Image.open(ROOT/'images'/key) as source:
                im=ImageOps.contain(source.convert('RGBA'),(cw-12,ch-40),Image.Resampling.LANCZOS)
            canvas.paste(im,(x+(cw-im.width)//2,y+3),im)
            lines=['']
            for char in a['name']:
                if draw.textbbox((0,0),lines[-1]+char,font=font)[2]>cw-12:lines.append('')
                lines[-1]+=char
            for row,line in enumerate(lines[:2]):draw.text((x+6,y+ch-36+row*17),line,font=font,fill='#f5dfae')
        canvas.save(OUT/name,quality=94)
    people=[a for a in assets if a['type']=='portrait']
    scenes=[a for a in assets if a['type']=='scene']
    sheet(people,'face',5,200,240,'face-preview.jpg')
    sheet(people,'portrait',5,240,380,'portrait-preview.jpg')
    sheet(scenes,'scene',4,480,250,'scene-preview.jpg')
    selected=['tudor_marriage_petition','barb_toulon_winter','calais_fireships','lepanto_allied_council','nw_egg','ming_meishan','ming_join','potosi_wayra','potosi_star']
    sheet([next(a for a in scenes if a['id']==id) for id in selected],'scene',3,480,250,'overview.jpg')
    print('인물',len(people),'명 · 장면',len(scenes),'종 미리보기')

if __name__=='__main__':preview()
