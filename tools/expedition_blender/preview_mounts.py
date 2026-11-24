"""브라우저 검사가 남긴 실제 게임 화면으로 움직이는 미리보기와 탈것 모음을 만든다."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageOps
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'artifacts/expedition-mounts-20261124'
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',15)
frames=[]
for f in range(8):
    source=Image.open(OUT/f'run-sw-{f}.png').convert('RGB')
    frame=Image.new('RGB',(source.width,source.height+40),'#203831')
    ImageDraw.Draw(frame).text((12,10),'남서쪽 달리기 · 제독과 부하 모두 같은 방향',font=font,fill='#edd6a8')
    frame.paste(source,(0,40));frames.append(frame)
frames[0].save(OUT/'run-southwest.gif',save_all=True,append_images=frames[1:],duration=80,loop=0,optimize=False)
labels=['도보','짐꾼','말','단봉낙타','쌍봉낙타','당나귀','라마','야크','말 마차','소 마차','코끼리','순록 썰매']
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',21)
board=Image.new('RGB',(1200,1240),'#203831');draw=ImageDraw.Draw(board)
for i,label in enumerate(labels):
    x=(i%3)*400;y=(i//3)*310
    draw.text((x+15,y+8),label,font=font,fill='#edd6a8')
    source=Image.open(OUT/f'mount-preview-{i}.png').convert('RGB')
    source=ImageOps.contain(source,(390,273),Image.Resampling.LANCZOS)
    board.paste(source,(x+(400-source.width)//2,y+35))
board.save(OUT/'all-transports-preview.jpg',quality=95)
print('남서 달리기 GIF와 탈것 12종 미리보기 저장')
