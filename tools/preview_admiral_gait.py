#!/usr/bin/env python3
"""적용 전후 제독 시트와 보행 리듬을 같은 크기의 GIF로 비교한다."""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from update_player_walk_loops import ROOT, cells


def main():
    work = ROOT/'artifacts/player-gait-20261103'
    sequences = [cells(work/'original-walk.webp'), cells(work/'final/walk.webp'),
                 cells(work/'original-run.webp'), cells(work/'final/run.webp')]
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 17)
    frames = []
    for tick in range(100):
        t = tick*.04
        canvas = Image.new('RGB', (800, 480), '#dedbd4')
        draw = ImageDraw.Draw(canvas)
        for j, title in enumerate(('기존 걷기', '새 걷기', '기존 달리기', '새 달리기')):
            x, y = (j % 2)*400+200, (j//2)*240+222
            draw.text((x-60, y-208), title, font=font, fill='#2b2924')
            phase = t*(300/240 if j < 2 else 680/360)
            if j == 0: index = math.floor(t*300/416*49) % 49
            elif j == 1: index = 1+math.floor((phase % 1)*48)
            elif j == 2: index = math.floor(t*62) % 49
            else: index = math.floor((phase % 1)*49)
            f = sequences[j][index]
            lift, scale = 0, 1
            if j % 2:
                p = (phase*2) % 1
                down = math.sin(math.pi*min(1, p/.42))
                up = math.sin(math.pi*max(0, min(1, (p-.42)/.58)))
                scale = 1-down*(2.2 if j == 1 else 3.2)/178+(up*1.5/178 if j == 1 else 0)
                lift = up*5.5 if j == 3 else 0
            ground = y
            shadow = 1/(1+lift*.035)
            draw.line((x-150, ground, x+150, ground), fill='#b3afa4')
            draw.ellipse((x-36*shadow, ground-4*shadow, x+36*shadow, ground+4*shadow), fill='#c2bdb2')
            f = f.resize((round(f.width*178/300), round(178*scale)), Image.Resampling.LANCZOS)
            canvas.paste(f, (x-f.width//2, round(y-lift)-f.height), f)
        frames.append(canvas)
    target = ROOT/'docs/art/player-gait-20261103.gif'
    frames[0].save(target, save_all=True, append_images=frames[1:], duration=40, loop=0, disposal=2)
    print(target)


if __name__ == '__main__':
    main()
