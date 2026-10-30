#!/usr/bin/env python3
"""사용자 얼굴 참고로 다시 그린 여섯 무릎상과 같은 원화의 얼굴상을 나란히 보여 준다."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/other-event-art-20261028'
PEOPLE=[('mina_trader','아칸 상인'),('mina_mother','엘미나의 여인'),('njinga','은징가'),
        ('kifunji','키푼지'),('kambu','캄부'),('kongo_leonor','레오노르 왕비')]

def preview():
    font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',18)
    for kind,cw,ch in [('faces',200,230),('knees',220,370)]:
        sheet=Image.new('RGB',(cw*len(PEOPLE),ch),'#302b28')
        draw=ImageDraw.Draw(sheet)
        for i,(ident,name) in enumerate(PEOPLE):
            path=ROOT/'images/portraits/history'/(ident+('_half' if kind=='knees' else '')+'.webp')
            with Image.open(path) as source:
                im=ImageOps.contain(source.convert('RGBA'),(cw-12,ch-38),Image.Resampling.LANCZOS)
            sheet.paste(im,(i*cw+(cw-im.width)//2,4),im)
            draw.text((i*cw+8,ch-30),name,font=font,fill='#f5dfae')
        sheet.save(OUT/f'women-{kind}-preview.jpg',quality=94)

if __name__=='__main__': preview()
