#!/usr/bin/env python3
"""대기 동작 14종·504칸의 실제 알파·접지·자세 변화와 걷기 원본 보존을 검사한다."""
import hashlib
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
config = json.loads((ROOT/'js/data/heromotion.js').read_text(encoding='utf-8').split('G.HERO_MOTION = ')[1].split(';')[0])
manifest = json.loads((ROOT/'docs/art/player-idle-20261103.json').read_text(encoding='utf-8'))['characters']
checked = 0
looks = sys.argv[1:] or list(config)
for look in looks:
    base = ROOT/'images/characters'/look/'motion'
    report = manifest[look]
    assert hashlib.sha256((base/'idle.webp').read_bytes()).hexdigest() == report['output_sha256'], (look, '제작 기록과 다른 대기 시트')
    assert hashlib.sha256((base/'walk.webp').read_bytes()).hexdigest() == report['walk_sha256'], (look, '걷기 원본이 바뀜')
    with Image.open(base/'idle.webp') as image:
        sheet = image.convert('RGBA')
    assert sheet.width % 6 == 0 and sheet.height == 2520, (look, sheet.size)
    width, height = sheet.width//6, 420
    boxes, hashes = [], []
    for i in range(36):
        f = sheet.crop((i%6*width, i//6*height, (i%6+1)*width, (i//6+1)*height))
        alpha = f.getchannel('A')
        bb = alpha.point(lambda a: 255 if a>40 else 0).getbbox()
        assert bb is not None, (look, i, '빈 칸')
        assert bb[0]>=3 and bb[1]>=3 and bb[2]<width-3 and bb[3]==415, (look, i, '잘림·발밑', bb)
        assert float((np.asarray(alpha)==0).mean()) > .4, (look, i, '투명 배경')
        boxes.append(bb)
        hashes.append(hashlib.sha256(f.tobytes()).hexdigest())
        checked += 1
    heights = [b[3]-b[1] for b in boxes]
    assert abs(heights[0]-report['standing_height'])<=2, (look, '걷기와 대기 키 차이')
    assert heights[20] < heights[12]-3, (look, '인사 중 몸을 숙이지 않음')
    assert max(heights[30],heights[32]) > heights[24]+3, (look, '스트레칭 중 팔이 올라가지 않음')
    for row in range(3):
        assert len(set(hashes[row*12:row*12+12]))>=4, (look, row, '동작 자세 부족')
    print(f'{look}: 36칸 투명·접지·구경·인사·스트레칭·걷기 보존 통과')
print(f'{len(looks)}종 · {checked}칸 검사 통과')
