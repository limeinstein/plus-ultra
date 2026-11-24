"""Blender의 탈것 그림을 묶고 게임에 전용 인물·탈것 조합을 등록한다."""
from pathlib import Path
from PIL import Image
import json
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'artifacts/expedition-mounts-20261124'
specs=json.loads((OUT/'sources.json').read_text(encoding='utf8'))
data={'source':'회화 원화 · Blender 2.5D · 탈것별 남녀 제독과 여성 부하','sheets':{}}
W,H=240,160
dest=ROOT/'images/sprites/expedition-mounts';dest.mkdir(parents=True,exist_ok=True)
for name,spec in specs.items():
    atlas=Image.new('RGBA',(W*4,H*8));cells=[]
    for d in range(8):
        for f in range(4):
            with Image.open(OUT/f'{name}-{d}-{f}.png') as source:
                im=source.resize((W,H),Image.Resampling.LANCZOS)
                box=im.getbbox();assert box and box[0]>0 and box[1]>0 and box[2]<W and box[3]<H,(name,d,f,box)
                atlas.paste(im,(f*W,d*H))
            cells.append([f*W,d*H,W,H,W/2,143.75])
    file='sprites/expedition-mounts/'+name+'.webp';atlas.save(ROOT/'images'/file,lossless=True,method=6)
    data['sheets'][name]={'key':file[:-5],'file':file,'width':W*4,'height':H*8,'columns':4,'rows':8,'framesPerDirection':4,'bodyHeight':125,'rowHeights':[round(h*.625,4) for h in spec['rowHeights']],'targetHeight':spec['targetHeight'],'directionRows':[[d,False] for d in range(8)],'cells':cells,'character':spec['character'],'kind':spec['kind'],'action':'walk'}
text="/* 탈것별 남녀 제독·여성 부하. tools/expedition_blender/package_mounts.py로 재생성. */\n(function(G){'use strict';\nG.EXPEDITION_MOUNT_ART="+json.dumps(data,ensure_ascii=False,separators=(',',':'))+";\nG.IMAGE_FILES=G.IMAGE_FILES||{};Object.keys(G.EXPEDITION_MOUNT_ART.sheets).forEach(function(id){var s=G.EXPEDITION_MOUNT_ART.sheets[id];G.IMAGE_FILES[s.key]=s.file;});\n})(window.G=window.G||{});\n"
(ROOT/'js/data/expedition_mounts.js').write_bytes(text.encode('utf8'))
print('탈것 전용 시트 등록:',len(specs))
