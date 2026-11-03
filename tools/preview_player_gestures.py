#!/usr/bin/env python3
"""게임에 적용한 대기 동작의 움직이는 미리보기와 14종 비교표를 만든다."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from update_player_walk_loops import ROOT, cells, read_config


def frames(look):
    with Image.open(ROOT/'images/characters'/look/'motion/idle.webp') as im:
        sheet = im.convert('RGBA')
    w, h = sheet.width//6, sheet.height//6
    return [sheet.crop((i%6*w, i//6*h, (i%6+1)*w, (i//6+1)*h)) for i in range(36)]


def main():
    cfg = read_config(ROOT/'js/data/heromotion.js')
    fx = json.loads((ROOT/'artifacts/player-idle-20261103/browser/fx.json').read_text(encoding='utf-8'))
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 18)
    atlas = {look: frames(look) for look in cfg}
    gallery = Image.new('RGB', (1220, 50+len(cfg)*180), '#dedbd4')
    draw = ImageDraw.Draw(gallery)
    for c, title in enumerate(('걷기 기준', '경치 구경', '귀족식 인사', '스트레칭')):
        draw.text((190+c*255, 10), title, font=font, fill='#272723')
    for row, (look, record) in enumerate(cfg.items()):
        draw.text((8, row*180+120), look, fill='#272723')
        walking = cells(ROOT/'images/characters'/look/'motion/walk.webp')[record['idle']]
        for col, f in enumerate((walking, atlas[look][8], atlas[look][20], atlas[look][32])):
            f = f.resize((round(f.width*.48), round(f.height*.48)), Image.Resampling.LANCZOS)
            gallery.paste(f, (230+col*255-f.width//2, 224+row*180-f.height), f)
    gallery.save(ROOT/'docs/art/player-idle-20261103.png')
    gif = []
    for i in range(110):
        canvas = Image.new('RGB', (900, 310), '#dedbd4')
        draw = ImageDraw.Draw(canvas)
        t = i*.04
        for row, (kind, title) in enumerate((('look','경치 구경'), ('greet','귀족식 인사'), ('stretch','스트레칭'))):
            phase = t/fx['seconds'][kind]
            frame = max((k for k,p in enumerate(fx['keyTimes']) if p <= phase), default=0) if phase < 1 else 0
            f = atlas['admiral'][row*12+frame]
            f = f.resize((round(f.width*178/300), round(f.height*178/300)), Image.Resampling.LANCZOS)
            x, y = row*300+150, 284
            draw.text((x-56, 14), title, font=font, fill='#272723')
            draw.line((x-130, y-3, x+130, y-3), fill='#b8b2a6')
            draw.ellipse((x-30,y-6,x+30,y+2), fill='#c7c0b3')
            canvas.paste(f, (x-f.width//2, y-f.height), f)
        gif.append(canvas)
    gif[0].save(ROOT/'docs/art/player-idle-20261103.gif', save_all=True, append_images=gif[1:], duration=40, loop=0, disposal=2)
    print('14종 정지 비교표·기본 제독 세 동작 GIF 저장')


if __name__ == '__main__':
    main()
