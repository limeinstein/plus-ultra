#!/usr/bin/env python3
"""게임과 같은 고정 배율·발 디딤 속도로 새 보행을 미리 본다."""
import bisect,json
from PIL import Image,ImageDraw,ImageFont
from update_player_walk_loops import ROOT,read_config

def main():
 cfg=read_config(ROOT/'js/data/heromotion.js');font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',16)
 all_clips={}
 for look,data in cfg.items():
  for motion in ('walk','run'):
   c=data['loops'][motion];s=Image.open(ROOT/'images/characters'/look/'motion'/f'stride_{motion}.webp').convert('RGBA');w,h=s.width//c['cols'],s.height//c['rows']
   fr=[s.crop((i%8*w,i//8*h,(i%8+1)*w,(i//8+1)*h)) for i in range(c['count'])]
   all_clips[look,motion]=(c,fr)
 for slow in (False,True):
  frames=[];looks=('admiral','armored_navigator','navigator_white')
  for i in range(200):
   t=i*.02/(2 if slow else 1);canvas=Image.new('RGB',(840,500),'#dedbd4');d=ImageDraw.Draw(canvas)
   d.text((20,8),'걷기 / 뛰기 · '+('절반 속도' if slow else '게임 속도'),font=font,fill='#34312b')
   for col,look in enumerate(looks):
    for row,motion in enumerate(('walk','run')):
     c,fr=all_clips[look,motion];hz=1 if motion=='walk' else 680/440;u=(t*hz)%1
     k=min(len(fr)-1,bisect.bisect_right(c['times'],u)-1);f=fr[k];scale=178/c['baseHeight']
     f=f.resize((round(f.width*scale),round(f.height*scale)),Image.Resampling.LANCZOS)
     x=140+col*280;y=242+row*242
     d.text((col*280+12,34+row*242),look+(' 걷기' if row==0 else ' 뛰기'),font=font,fill='#34312b')
     d.line((col*280+10,y-3,(col+1)*280-10,y-3),fill='#aaa293')
     canvas.paste(f,(x-f.width//2,y-f.height),f)
   frames.append(canvas)
  name='player-gait-20261107'+('-slow' if slow else '')+'.gif';p=ROOT/'docs/art'/name
  frames[0].save(p,save_all=True,append_images=frames[1:],duration=20,loop=0,disposal=2)
  print(p)
 # 각 인물의 전체 한 주기를 한 줄씩 펼쳐 접합부와 크기를 눈으로 확인한다.
 for motion in ('walk','run'):
  sheet=Image.new('RGB',(16*110,14*156),'#dedbd4');d=ImageDraw.Draw(sheet)
  for row,look in enumerate(cfg):
   c,fr=all_clips[look,motion];d.text((2,row*156),look,font=font,fill='#34312b')
   for i,f in enumerate(fr):
    f=f.resize((round(f.width*.36),round(f.height*.36)),Image.Resampling.LANCZOS)
    sheet.paste(f,(i*110+(110-f.width)//2,row*156+24),f)
  sheet.save(ROOT/'docs/art'/f'player-gait-20261107-{motion}.jpg',quality=93)

if __name__=='__main__':main()
