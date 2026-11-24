"""Blender 2.5D 투명 출력을 게임용 WebP·방향·발밑 좌표로 묶는다."""
from pathlib import Path
from PIL import Image
import json

ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'artifacts/expedition-blender-painted-20261124'
DEST=ROOT/'images/sprites/expedition-blender'
DEST.mkdir(parents=True,exist_ok=True)
SW,SH=224,256
W,H=112,128
characters=['captain_m','captain_f','crew_m','scout_f']
data={'source':'회화 원화 · Blender 4.5.9 2.5D 출력','framesPerCycle':4,'sheets':{}}
for ci,character in enumerate(characters):
    for action in ['walk','run','idle']:
        count=1 if action=='idle' else 4
        sheet=Image.new('RGBA',(W*count,H*8));cells=[]
        for direction in range(8):
            for frame in range(count):
                with Image.open(SOURCE/f'{action}-{direction}-{frame}.png') as im:
                    cell=im.crop((ci*SW,0,(ci+1)*SW,SH)).resize((W,H),Image.Resampling.LANCZOS)
                    cell.putalpha(cell.getchannel('A').point(lambda alpha: 0 if alpha < 8 else alpha))
                bounds=cell.getbbox()
                assert bounds and bounds[0]>0 and bounds[1]>0 and bounds[2]<W and bounds[3]<H,(character,action,direction,frame,bounds)
                sheet.paste(cell,(frame*W,direction*H))
                cells.append([frame*W,direction*H,W,H,W/2,112])
        name=f'{character}_{action}';file=f'sprites/expedition-blender/{name}.webp'
        sheet.save(ROOT/'images'/file,lossless=True,method=6)
        data['sheets'][name]={'key':file[:-5],'file':file,'width':sheet.width,'height':sheet.height,'columns':count,'rows':8,'framesPerDirection':count,'bodyHeight':98,'targetHeight':52,'cells':cells,'directionRows':[[i,False] for i in range(8)],'character':character,'action':action}
text='/* 회화 탐험대: 남녀 제독·대원의 8방향 걷기·달리기·정지. 여성 제독은 붉은 머리·자주색 의상·금장 남색 망토, 모자 없음. */\n'
text+="(function(G){'use strict';\nG.EXPEDITION_PAINTED="+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n'
text+="G.IMAGE_FILES=G.IMAGE_FILES||{};Object.keys(G.EXPEDITION_PAINTED.sheets).forEach(function(id){var s=G.EXPEDITION_PAINTED.sheets[id];G.IMAGE_FILES[s.key]=s.file;});\n})(window.G=window.G||{});\n"
(ROOT/'js/data/expedition_blender.js').write_bytes(text.encode('utf8'))
print('회화 탐험대 12개 시트 · 288개 자세 출력 완료')
