"""제독 동작의 전체 미리보기·손 확대 확인판·최종 파일 묶음을 만든다."""
import html
import json
import zipfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'artifacts/hero-motion-20261124'
RAW=ROOT/'art_sources/hero-motion-20261124/raw'
CHARS=json.loads((ROOT/'tools/hero_motion_20261124/characters.json').read_text(encoding='utf-8'))
NAMES=['기본 제독','중세의 연금술사','하얀 남방의 항해사','철갑 항해사','망원경을 든 뱃사람','근육질 검사','모자를 돌리는 항해사','카리스마 제독','돌격대장','귀족 학자 제독','카사노바','정규군 장교','가죽옷 모험가','검은 코트의 선장','제시카','김소영']


def main():
    OUT.mkdir(parents=True,exist_ok=True)
    hands=Image.new('RGB',(1600,1120),'#ddd7cb')
    events=Image.new('RGB',(1600,840),'#ddd7cb')
    combat=Image.new('RGBA',(1600,1440),'#ddd7cb')
    draw=ImageDraw.Draw(hands);evdraw=ImageDraw.Draw(events)
    cards=[];paths=[];audit=[]
    for i,(character,name) in enumerate(zip(CHARS,NAMES)):
        fid=character['id']
        fighter='main_admiral' if fid=='admiral' else fid
        revised=RAW/f'{fid}_cutin_handfix.png'
        raw=revised if revised.exists() else RAW/f'{fid}_cutin.png'
        if raw.exists():
            image=Image.open(raw).convert('RGB')
            w,h=image.size
            crop=image.crop((round(w*.46),round(h*.25),round(w*.69),round(h*.64)))
            crop.thumbnail((385,245))
            x,y=(i%4)*400,(i//4)*280
            hands.paste(crop,(x+(400-crop.width)//2,y+8))
            draw.text((x+10,y+258),fid,fill='#322b23')
            small=image.copy();small.thumbnail((390,170))
            x,y=(i%4)*400,(i//4)*210
            events.paste(small,(x+5,y+5));evdraw.text((x+10,y+185),fid,fill='#322b23')
        else:audit.append({'id':fid,'missing':'cutin'})
        # 칼날·얼굴·발이 잘리지 않은지 원화와 게임용 파일을 함께 볼 수 있다.
        rel=lambda p:Path('../../')/p.relative_to(ROOT)
        walk=ROOT/'images/characters'/fid/'motion/stride_walk.webp'
        duel=ROOT/'images/duel/fighters'/(fighter+'.png')
        if duel.exists():
            sheet=Image.open(duel).convert('RGBA')
            for j,(col,row) in enumerate([(0,3),(3,0),(2,2)]):
                tile=sheet.crop((col*432,row*304,(col+1)*432,(row+1)*304))
                tile.thumbnail((210,175))
                x,y=(i%4)*400+(0 if j!=1 else 190),(i//4)*360+(0 if j<2 else 150)
                combat.alpha_composite(tile,(x,y))
            ImageDraw.Draw(combat).text(((i%4)*400+14,(i//4)*360+330),fid,fill='#30291f')
        cut=ROOT/'images/duel/cutins/events-20261124'/(fighter+'.webp')
        gif=ROOT/'images/duel/cutins'/(fighter+'.gif')
        paths.extend([walk,walk.with_name('walk.webp'),duel,gif,cut])
        individual=ROOT/'images/characters' if fid=='admiral' else ROOT/'images/characters'/fid
        for frame in range(1,9):
            matches=sorted(individual.glob(f'walk_{frame}.*'))
            paths.append(matches[0] if matches else individual/f'walk_{frame}.webp')
        paths.extend(ROOT/'images/duel/fighters_ext'/(fighter+'_'+k+'.png') for k in ('atk','react'))
        paths.extend(ROOT/'images/duel/finishers'/fighter/(k+'.gif') for k in ('slash','thrust','bash'))
        card=f'<article id="{fid}"><h2>{html.escape(name)}</h2><div class="motions"><img class="walk" src="{fid}-walk.gif" alt="걷기 동작"><img class="cutin" src="{rel(cut).as_posix()}" alt="필살기 사건샷"></div><details><summary>걷기·일기토 스프라이트 시트</summary><a href="{rel(walk).as_posix()}">걷기 시트</a> · <a href="{rel(duel).as_posix()}">일기토 시트</a> · <a href="{rel(gif).as_posix()}">필살기 GIF</a><img class="sheet" src="{rel(duel).as_posix()}" alt="일기토 시트"></details></article>'
        if fid in ('admiral','jessica','soyoung'):
            card=card.replace('</article>',f'<p>실제 게임: <a href="browser/{fid}-town.png">거리</a> · <a href="browser/{fid}-duel.png">일기토</a> · <a href="browser/{fid}-cutin.png">필살기 재생</a></p></article>')
        cards.append(card)
    hands.save(OUT/'hands-review.jpg',quality=95)
    events.save(OUT/'events-preview.jpg',quality=92)
    combat.convert('RGB').save(OUT/'combat-preview.jpg',quality=95)
    soyoung=RAW/'soyoung_cutin_handfix.png'
    if soyoung.exists():
        painting=Image.open(soyoung).convert('RGB');w,h=painting.size
        detail=Image.new('RGB',(1000,430),'#ddd7cb');labels=ImageDraw.Draw(detail)
        font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',25)
        for i,(title,box) in enumerate([('칼 손잡이',(.51,.30,.66,.55)),('부채 손잡이',(.025,.45,.17,.71))]):
            tile=painting.crop(tuple(round(v*(w if j%2==0 else h)) for j,v in enumerate(box)))
            tile.thumbnail((480,365));detail.paste(tile,(i*500+(500-tile.width)//2,18))
            labels.text((i*500+24,390),title,fill='#30291f',font=font)
        detail.save(OUT/'soyoung-hands-review.jpg',quality=96)
    text='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>제독 16종 · 걷기와 일기토</title><style>body{margin:0;background:#182329;color:#eee4cf;font:16px/1.6 system-ui}main{max-width:1280px;margin:auto;padding:30px}h1{font-size:30px}h2{font-size:21px;margin:0 0 12px}a{color:#f3ca7c}article{padding:24px;border:1px solid #665f4e;background:#243138;margin:24px 0;border-radius:12px}.motions{display:flex;align-items:center;gap:24px}.walk{height:260px;max-width:28%;object-fit:contain;background:#d6d2c8;border-radius:6px}.cutin{width:calc(100% - 220px);max-height:340px;object-fit:contain}.sheet{width:100%;display:block;background:#c4bba9;margin-top:14px}details{margin-top:16px}nav{display:flex;flex-wrap:wrap;gap:12px}@media(max-width:650px){main{padding:16px}.motions{flex-direction:column}.walk{max-width:100%}.cutin{width:100%}}</style><main><h1>제독 16종 · 걷기와 일기토</h1><p>여성 2종·남성 14종의 전용 그림. 걷기 8칸, 공격·방어·피격·쓰러짐, 필살기 사건샷을 확인할 수 있습니다. 제시카의 칼 쥔 손, 김소영의 칼과 부채 쥔 손 수정본을 포함합니다.</p><p><a href="hero-sprites-and-cutins-20261124.zip">전체 파일 ZIP</a> · <a href="hands-review.jpg">손 모양 확대 확인판</a> · <a href="events-preview.jpg">필살기 전체 미리보기</a></p><nav>'''
    text+=''.join(f'<a href="#{c["id"]}">{n}</a>' for c,n in zip(CHARS,NAMES))+'</nav>'+''.join(cards)+'</main></html>'
    text=text.replace('</nav>','</nav><p><a href="soyoung-hands-review.jpg">소영의 칼·부채 손 확대</a> · <a href="combat-preview.jpg">일기토 전체 확인판</a></p>')
    (OUT/'index.html').write_text(text,encoding='utf-8')
    with zipfile.ZipFile(OUT/'hero-sprites-and-cutins-20261124.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
        for path in paths:
            if path.exists():archive.write(path,path.relative_to(ROOT))
            else:audit.append({'path':str(path.relative_to(ROOT)),'missing':True})
    (OUT/'package-audit.json').write_text(json.dumps({'files':len(paths),'missing':audit},ensure_ascii=False,indent=2),encoding='utf-8')
    prompts=[]
    for path in sorted([*(ROOT/'tools/hero_motion_20261124').glob('*.json'),*(ROOT/'tools/hero_background_20261124').glob('*.json')]):
        data=json.loads(path.read_text(encoding='utf-8'))
        if isinstance(data,dict) and data.get('group','hero-motion-20261124')!='hero-motion-20261124':continue
        if isinstance(data,dict) and data.get('prompt'):prompts.append(data)
        elif path.name=='female-prompts-and-sources.json':prompts.extend(data)
    (OUT/'generation-prompts-and-sources.json').write_text(json.dumps({'mode':'built-in image_gen','records':prompts},ensure_ascii=False,indent=2),encoding='utf-8')
    print('미리보기·확대 확인판·ZIP:',OUT)

if __name__=='__main__':main()
