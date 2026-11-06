#!/usr/bin/env python3
"""기존과 보강한 보행의 같은 한 주기를 느리게 반복해 비교한다."""
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from update_player_walk_loops import ROOT,cells,read_config


def main():
 cfg=read_config(ROOT/'js/data/heromotion.js')
 font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',17)
 for look in ('admiral','armored_navigator'):
  sequences=[]
  for motion in ('walk','run'):
   old=cells(ROOT/'images/characters'/look/'motion'/f'{motion}.webp')[cfg[look].get(motion+'Start',0):]
   clip=cfg[look]['loops'][motion]
   sheet=Image.open(ROOT/'images/characters'/look/'motion'/f'stride_{motion}.webp').convert('RGBA')
   w=sheet.width//clip['cols']
   new=[sheet.crop((i%clip['cols']*w,i//clip['cols']*300,(i%clip['cols']+1)*w,i//clip['cols']*300+300)) for i in range(clip['count'])]
   sequences.append((motion,old,new,clip))
  frames=[]
  for i in range(100):
   u=i/100;canvas=Image.new('RGB',(800,510),'#dedbd4');draw=ImageDraw.Draw(canvas)
   draw.text((225,4),'한 주기 2초 · 느리게 반복 비교',font=font,fill='#34312b')
   for row,(motion,old,new,clip) in enumerate(sequences):
    for col in range(2):
     index=min(len(old)-1,int(u*len(old))) if col==0 else min(clip['count']-1,int(np.searchsorted(clip['times'],u,side='right')-1))
     f=old[index] if col==0 else new[index]
     f=f.resize((round(f.width*.6),180),Image.Resampling.LANCZOS)
     x,y=200+col*400,250+row*240
     label=('기존 ' if col==0 else '보강 ')+('걷기' if motion=='walk' else '달리기')
     draw.text((x-45,y-210),label,font=font,fill='#34312b')
     draw.line((x-150,y-2,x+150,y-2),fill='#b1aa9d')
     canvas.paste(f,(x-f.width//2,y-f.height),f)
   frames.append(canvas)
  target=ROOT/'docs/art'/f'player-loop-20261106-{look}.gif'
  frames[0].save(target,save_all=True,append_images=frames[1:],duration=20,loop=0,disposal=2)
  print(target)


if __name__=='__main__':main()
