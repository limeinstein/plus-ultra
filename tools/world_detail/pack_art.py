"""Blender 투명 렌더를 여백 없이 묶는다. 원본 PNG·blend는 그대로 보관한다."""
from pathlib import Path
from PIL import Image
import json,base64,io,math
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'artifacts/world-detail-20261125/blender'
frames=json.loads((OUT/'frames.json').read_text(encoding='utf-8'));sheets=[];sprites={}
rock_prefixes=tuple(f'detail-{name}-' for name in ('slab','talus','erratic','cobbles'))
for kind,cell,cols in [('tree',192,5),('wonder',384,5),('detail',256,5),('rock',112,8)]:
 rows=[r for r in frames if (r['id'].startswith(rock_prefixes) if kind=='rock' else r['id'].startswith(kind+'-') and not r['id'].startswith(rock_prefixes))]
 if not rows: continue
 atlas=Image.new('RGBA',(cols*cell,math.ceil(len(rows)/cols)*cell))
 for i,row in enumerate(rows):
  im=Image.open(OUT/(row['id']+'.png')).convert('RGBA');box=im.getchannel('A').getbbox();im=im.crop(box);im.thumbnail((cell-6,cell-6),Image.Resampling.LANCZOS)
  x=i%cols*cell+(cell-im.width)//2;y=i//cols*cell+(cell-im.height)//2;atlas.alpha_composite(im,(x,y))
  sprites[row['id']]={'sheet':len(sheets),'x':x,'y':y,'w':im.width,'h':im.height}
 atlas.save(OUT/(kind+'-atlas.png'));buf=io.BytesIO();atlas.save(buf,format='PNG',optimize=True);sheets.append('data:image/png;base64,'+base64.b64encode(buf.getvalue()).decode())
(ROOT/'js/data/terrain_art.js').write_text('/* Blender 제작 투명 미니어처. 원본: artifacts/world-detail-20261125/blender */\n(function(G){G.TERRAIN_ART='+json.dumps({'sprites':sprites,'sheets':sheets},separators=(',',':'))+';})(window.G=window.G||{});\n',encoding='utf-8')
print('PACKED',len(sprites),'sprites',len(sheets),'sheets')
