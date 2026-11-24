"""거리 제독의 모든 시트·움직임 미리보기·출처·ZIP을 모으고 투명 여백을 검사한다."""
import json
import hashlib
import shutil
import zipfile
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/hero-street-20261124'
CHARS=json.loads((ROOT/'tools/hero_street_20261124/characters.json').read_text(encoding='utf-8'))
NAMES=['기본 제독','중세의 연금술사','하얀 남방의 항해사','철갑 항해사','망원경을 든 뱃사람','근육질 검사','모자를 돌리는 항해사','카리스마 제독','돌격대장','귀족 학자 제독','카사노바','정규군 장교','가죽옷 모험가','검은 코트의 선장','제시카','김소영']
NAMES += [c['name'] for c in CHARS[16:]]
MOTIONS=[('walk','걷기'),('run','달리기'),('back','뒤돌아 들어가기'),('look','둘러보기'),('greet','인사'),('stretch','스트레칭')]
SHEETS={'walk':(7,7),'run':(7,7),'back':(7,7),'idle':(6,6),'stride_walk':(8,1),'stride_run':(8,1)}


def main():
    OUT.mkdir(parents=True,exist_ok=True);cards=[];files=[];missing=[];bounds=[]
    board=Image.new('RGBA',(1200,((len(CHARS)+3)//4)*340),'#d8d2c5');font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',20)
    for i,(c,name) in enumerate(zip(CHARS,NAMES)):
        fid=c['id'];dest=ROOT/'images/characters'/fid/'motion'
        old=ROOT/'artifacts/hero-motion-20261124'/f'{fid}-walk.gif'
        if old.exists():shutil.copy2(old,OUT/f'{fid}-walk.gif')
        for kind,_ in MOTIONS:
            if not (OUT/f'{fid}-{kind}.gif').exists():missing.append(f'{fid}-{kind}.gif')
        links=[]
        for kind,(cols,rows) in SHEETS.items():
            path=dest/(kind+'.webp');files.append(path)
            links.append(f'<a href="../../{path.relative_to(ROOT).as_posix()}">{kind}</a>')
            if not path.exists():missing.append(str(path.relative_to(ROOT)));continue
            image=Image.open(path).convert('RGBA')
            if image.width%cols or image.height%rows:raise ValueError(f'{fid}/{kind}: 칸이 정수가 아님')
            cw,ch=image.width//cols,image.height//rows
            for n in range(cols*rows):
                a=image.crop(((n%cols)*cw,(n//cols)*ch,(n%cols+1)*cw,(n//cols+1)*ch)).getchannel('A')
                box=a.point(lambda v:255 if v>32 else 0).getbbox()
                if not box or box[2]-box[0]<20 or box[3]-box[1]<60:raise ValueError(f'{fid}/{kind}/{n}: 비거나 잘린 칸 {box}')
                edge=max(a.crop((0,0,cw,1)).getextrema()[1],a.crop((0,ch-1,cw,ch)).getextrema()[1],a.crop((0,0,1,ch)).getextrema()[1],a.crop((cw-1,0,cw,ch)).getextrema()[1])
                if edge>4:raise ValueError(f'{fid}/{kind}/{n}: 칸 가장자리의 그림')
            bounds.append({'id':fid,'kind':kind,'cell':[cw,ch],'frames':cols*rows})
        stand=dest/'standing.webp';files.append(stand)
        if stand.exists():
            im=Image.open(stand).convert('RGBA');im.thumbnail((270,285))
            x,y=(i%4)*300,(i//4)*340;board.alpha_composite(im,(x+(300-im.width)//2,y+285-im.height))
            ImageDraw.Draw(board).text((x+12,y+305),name,font=font,fill='#30281f')
        else:missing.append(str(stand.relative_to(ROOT)))
        individual=ROOT/'images/characters' if fid=='admiral' else ROOT/'images/characters'/fid
        for kind in ('walk','run'):
            for n in range(1,9):
                matches=sorted(individual.glob(f'{kind}_{n}.*'))
                if matches:files.append(matches[0])
                else:missing.append(f'{fid}/{kind}_{n}')
        gifs=''.join(f'<figure><figcaption>{label}</figcaption><img src="{fid}-{kind}.gif" alt="{name} {label}" loading="lazy"></figure>' for kind,label in MOTIONS)
        cards.append(f'<article id="{fid}"><h2>{name}</h2><div class="moves">{gifs}</div><p>스프라이트 시트: '+ ' · '.join(links)+f'</p><p><a href="browser/{fid}-stretch.png">실제 거리 화면</a></p></article>')
    board.convert('RGB').save(OUT/'overview.jpg',quality=94)
    nav=''.join(f'<a href="#{c["id"]}">{n}</a>' for c,n in zip(CHARS,NAMES))
    page='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>제독 29종 · 거리 동작 전체</title><style>body{margin:0;background:#19292d;color:#efe5ce;font:16px/1.65 system-ui}main{max-width:1320px;margin:auto;padding:28px}h1{font-size:30px}h2{font-size:23px}a{color:#f2c773}nav{display:flex;flex-wrap:wrap;gap:14px}article{margin:26px 0;padding:22px;border:1px solid #756c56;border-radius:12px;background:#26383a}.moves{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}figure{margin:0;text-align:center}figcaption{height:50px}figure img{height:260px;width:100%;object-fit:contain;background:#d8d2c5;border-radius:6px}@media(max-width:1000px){.moves{grid-template-columns:repeat(3,1fr)}}@media(max-width:600px){main{padding:14px}.moves{grid-template-columns:repeat(2,1fr)}}</style><main><h1>제독 29종 · 거리 동작 전체</h1><p>걷기 · 달리기 · 뒤돌아 건물 들어가기 · 둘러보기 · 인사 · 스트레칭. 여성 15종과 남성 14종 모두 같은 얼굴·복식의 전용 시트를 사용합니다. 뒤돌아 들어가기는 한 번 재생되며 마지막 뒷모습에서 멈춥니다.</p><p><a href="hero-street-sheets-20261124.zip">거리 시트 전체 ZIP</a> · <a href="overview.jpg">양발 대기 자세 전체</a> · <a href="prompts-and-sources.json">내장 ImageGen 제작 지시문·출처</a></p><nav>'''+nav+'</nav>'+''.join(cards)+'</main></html>'
    (OUT/'index.html').write_text(page,encoding='utf-8')
    with zipfile.ZipFile(OUT/'hero-street-sheets-20261124.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for p in files:
            if p.exists():z.write(p,p.relative_to(ROOT))
    prompts=[]
    for p in sorted([*(ROOT/'tools/hero_street_20261124').glob('*.json'),*(ROOT/'tools/hero_background_20261124').glob('*.json')]):
        data=json.loads(p.read_text(encoding='utf-8'))
        if isinstance(data,dict) and data.get('group','hero-street-20261124')!='hero-street-20261124':continue
        if isinstance(data,dict) and 'prompt' in data:
            source=ROOT/'art_sources/hero-street-20261124/raw'/(data['key']+'.png')
            if not source.exists():raise ValueError(f'원화 누락: {source.name}')
            data['workspaceSource']=str(source.relative_to(ROOT))
            data['sha256']=hashlib.sha256(source.read_bytes()).hexdigest()
            prompts.append(data)
    (OUT/'prompts-and-sources.json').write_text(json.dumps({'mode':'built-in image_gen','records':prompts},ensure_ascii=False,indent=2),encoding='utf-8')
    (OUT/'asset-report.json').write_text(json.dumps({'actors':len(CHARS),'files':len(files),'sheets':bounds,'missing':missing},ensure_ascii=False,indent=2),encoding='utf-8')
    if missing:raise SystemExit('부족한 그림: '+str(missing))
    print(f'제독 29종 · 시트 {len(bounds)}개 · 게임 그림 {len(files)}개 · 여백·온몸·목록 검사 통과')

if __name__=='__main__':main()
