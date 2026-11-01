"""연안 명암 전후와 실제 시간으로 움직이는 선체를 게임 캡처로 비교한다."""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
out = root / 'artifacts/water-coast-ride-20261101'
surface = root / 'artifacts/water-surface-20261101'
font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 22)
board = Image.new('RGB', (1300, 540), '#102b3b')
draw = ImageDraw.Draw(board)
for i, (folder, title) in enumerate([('after', '직전 · 연안까지 강했던 물결'), ('coast-review', '수정 · 잔잔한 연안과 청록 물빛')]):
    im = Image.open(surface / folder / 'coast-3x.png').convert('RGB')
    board.paste(im.crop((650, 280, 1300, 780)), (650*i, 40))
    draw.text((650*i+18, 7), title, font=font, fill='#f0e5ca')
board.save(out / 'coast-comparison.jpg', quality=94)

# 배와 해안의 상대 위치를 볼 수 있게 같은 영역을 같은 배율로 자른다. 프레임 보간은 하지 않는다.
frames = [Image.open(p).convert('RGB').crop((620, 290, 1120, 610)) for p in sorted((out/'frames').glob('*.png'))]
assert len(frames) == 120
palette = Image.new('RGB', (500, 320*8))
for i in range(8):
    palette.paste(frames[i*15], (0, i*320))
palette = palette.quantize(colors=192, method=Image.Quantize.MEDIANCUT)
indexed = [im.quantize(palette=palette, dither=Image.Dither.NONE) for im in frames]
indexed[0].save(out/'coast-bobbing.gif', save_all=True, append_images=indexed[1:], duration=100, loop=0, optimize=False)

# 배·뭍·UI가 없는 같은 연안 영역의 미세 명암을 비교한다(색 변화 자체와 구별).
def contrast(folder):
    a = np.asarray(Image.open(surface/folder/'coast-3x.png').convert('RGB'), dtype=float)[530:720, 710:910]
    y = a @ np.array([.2126, .7152, .0722])
    return float(np.mean(np.abs(y[1:]-y[:-1])) + np.mean(np.abs(y[:,1:]-y[:,:-1])))

old, new = contrast('after'), contrast('coast-review')
assert new < old*.45, (old, new)
motion = json.loads((out/'report.json').read_text(encoding='utf-8'))['motion']
report = {'coastDetailBefore':old,'coastDetailAfter':new,'reductionPercent':100*(1-new/old), 'motionFrames':120, 'seconds':12, 'motion':motion}
(out/'image-check.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(report, ensure_ascii=False))
