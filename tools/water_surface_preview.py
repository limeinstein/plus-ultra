"""실제 게임 캡처로 전후 비교와 5초 움직임 미리보기를 만든다."""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFont

root=Path(__file__).resolve().parents[1]
out=root/'artifacts/water-surface-20261101'
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',22)
small=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',16)
board=Image.new('RGB',(1600,510),'#102b3b')
d=ImageDraw.Draw(board)
for i,(label,title) in enumerate([('before','변경 전'),('after','적용 후 · 3배율')]):
    shot=Image.open(out/label/'sea-3x.png').convert('RGB')
    board.paste(shot.crop((380,295,1180,755)),(800*i,50))
    d.text((800*i+24,12),title,font=font,fill='#f0e5ca')
board.save(out/'comparison.jpg',quality=94)
frames=[]
for f in sorted((out/'after/frames').glob('*.png')):
    im=Image.open(f).convert('RGB').crop((380,295,1200,755))
    frames.append(im)
# 공통 팔레트를 써서 프레임마다 바다 색이 떨리지 않는다.
palette=Image.new('RGB',(820,460*6))
for i in range(6): palette.paste(frames[i*10],(0,i*460))
palette=palette.quantize(colors=128,method=Image.Quantize.MEDIANCUT)
indexed=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames]
indexed[0].save(out/'sailing.gif',save_all=True,append_images=indexed[1:],duration=[80,80,90]*20,loop=0,optimize=False)
frames[0].save(out/'motion-first.png')
frames[-1].save(out/'motion-last.png')
before=np.asarray(frames[0],dtype=np.float32)
after=np.asarray(frames[-1],dtype=np.float32)
diff=float(np.abs(before-after).mean())
assert diff>2, f'수면 움직임 부족: {diff}'
report={'frames':len(frames),'seconds':5,'fps':12,'motionMeanPixelChange':diff,'checks':[]}
for name in ['sea-default','sea-3x','sea-close','coast-3x','sea-storm','sea-warm','battle']:
    a=np.asarray(Image.open(out/'after'/f'{name}.png').convert('RGB'))
    crop=a[300:535,400:1170]
    assert crop.mean()>15 and crop.std()>10, name
    report['checks'].append({'view':name,'mean':float(crop.mean()),'std':float(crop.std())})
(out/'image-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
