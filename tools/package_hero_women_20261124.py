"""추가 여성 13명의 거리·초상·일기토·필살기 전체를 검사하고 미리보기와 ZIP으로 묶는다."""
import hashlib
import json
import zipfile
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/hero-women-20261124'
CHARS=json.loads((ROOT/'tools/hero_women_20261124/characters.json').read_text(encoding='utf-8'))
CW,CH=432,304

def cell(sheet,n):
    return sheet.crop(((n%6)*CW,(n//6)*CH,(n%6+1)*CW,(n//6+1)*CH))

def gif(frames,path):
    made=[]
    for fr in frames:
        cv=Image.new('RGBA',fr.size,'#d8d2c5');cv.alpha_composite(fr)
        made.append(cv.convert('RGB').quantize(colors=128))
    made[0].save(path,save_all=True,append_images=made[1:],duration=180,loop=0,disposal=2)

def check(path,kind):
    sheet=Image.open(path).convert('RGBA')
    if sheet.size!=(CW*6,CH*4):raise ValueError(f'{path.name}: 전투 칸 규격')
    used=list(range(24)) if kind!='base' else [r*6+c for r,count in enumerate((6,4,3,6)) for c in range(count)]
    for n in used:
        a=cell(sheet,n).getchannel('A').point(lambda v:255 if v>32 else 0);box=a.getbbox()
        if not box:raise ValueError(f'{path.name}/{n}: 빈 전투 자세')
        if min(box[0],box[1],CW-box[2],CH-box[3])<2:raise ValueError(f'{path.name}/{n}: 잘린 가장자리')
    prone=cell(sheet,22 if kind=='react' else 14) if kind in ('base','react') else None
    if prone:
        b=prone.getchannel('A').point(lambda v:255 if v>32 else 0).getbbox()
        if b[2]-b[0]<=2.5*(b[3]-b[1]):raise ValueError(f'{path.name}: 수평으로 눕지 않은 쓰러짐')
    return sheet

def main():
    OUT.mkdir(parents=True,exist_ok=True);files=[];cards=[];checks=[]
    font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',20)
    board=Image.new('RGB',(1320,4*270),'#202c32');draw=ImageDraw.Draw(board)
    origins=json.loads((ROOT/'tools/hero_street_20261124/portrait-origins.json').read_text(encoding='utf-8'))
    for i,c in enumerate(CHARS):
        fid,name=c['id'],c['name'];base=ROOT/'images/duel/fighters'/(fid+'.png')
        attack=ROOT/'images/duel/fighters_ext'/(fid+'_atk.png');react=attack.with_name(fid+'_react.png')
        b,a,r=check(base,'base'),check(attack,'atk'),check(react,'react')
        paths=[base,attack,react,ROOT/'images/duel/cutins'/(fid+'.gif'),ROOT/'images/duel/cutins/events-20261124'/(fid+'.webp')]
        paths += [ROOT/'images/duel/finishers'/fid/(k+'.gif') for k in ('slash','thrust','bash')]
        for p in paths:
            if not p.exists():raise ValueError(f'전투 그림 없음: {p}')
            with Image.open(p) as im:
                im.verify()
            files.append(p)
        gif([cell(a,n) for n in range(6)],OUT/(fid+'-slash.gif'))
        gif([cell(a,n) for n in range(6,12)],OUT/(fid+'-thrust.gif'))
        gif([cell(a,n) for n in range(12,18)],OUT/(fid+'-bash.gif'))
        gif([cell(r,n) for n in range(18,24)],OUT/(fid+'-fall.gif'))
        event=Image.open(paths[4]).convert('RGB');event.thumbnail((310,200))
        x,y=(i%4)*330,(i//4)*270;board.paste(event,(x+(330-event.width)//2,y+12));draw.text((x+10,y+220),name,font=font,fill='#f0d7a5')
        street=ROOT/'images/characters'/fid
        for kind in ('walk','run','back','idle','stride_walk','stride_run','standing'):files.append(street/'motion'/(kind+'.webp'))
        for kind in ('walk','run'):
            files.extend(street/(f'{kind}_{n}.webp') for n in range(1,9))
        files.extend(ROOT/o['runtime'] for o in origins if o['id']==fid)
        moves=''.join(f'<figure><figcaption>{label}</figcaption><img src="{fid}-{kind}.gif" alt="{name} {label}" loading="lazy"></figure>' for kind,label in [('slash','베기'),('thrust','찌르기'),('bash','손잡이 치기'),('fall','피격·쓰러짐')])
        links=' · '.join(f'<a href="../../{p.relative_to(ROOT).as_posix()}">{label}</a>' for p,label in zip(paths[:3],('기본 전투 시트','공격 24칸','반응 24칸')))
        eventrel=paths[4].relative_to(ROOT).as_posix();cutrel=paths[3].relative_to(ROOT).as_posix()
        cards.append(f'<article id="{fid}"><h2>{name}</h2><div class="moves">{moves}</div><a href="../../{eventrel}"><img class="event" src="../../{cutrel}" alt="{name} 필살기" loading="lazy"></a><p>{links} · <a href="../hero-street-20261124/index.html#{fid}">거리의 모든 동작</a> · <a href="browser/{fid}-duel.png">실제 일기토</a> · <a href="browser/{fid}-cutin.png">실제 필살기</a></p></article>')
        checks.append({'id':fid,'fighter':[CW*6,CH*4],'attackFrames':24,'reactionFrames':24,'flatFall':True})
    for p in files:
        if not p.exists():raise ValueError(f'게임 그림 없음: {p}')
    if len(set(files))!=len(files):raise ValueError('ZIP 목록의 중복 그림')
    board.save(OUT/'overview.jpg',quality=94)
    page='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>추가 여성 제독 13종 · 동작 전체</title><style>body{margin:0;background:#19292d;color:#efe5ce;font:16px/1.65 system-ui}main{max-width:1320px;margin:auto;padding:28px}a{color:#f2c773}article{margin:26px 0;padding:22px;border:1px solid #756c56;border-radius:12px;background:#26383a}.moves{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}figure{margin:0;text-align:center}figure img{width:100%;background:#d8d2c5}.event{display:block;max-width:100%;width:1060px;margin:20px auto}@media(max-width:700px){.moves{grid-template-columns:repeat(2,1fr)}main{padding:14px}}</style><main><h1>추가 여성 제독 13종 · 거리와 전투 동작 전체</h1><p>기존 직업별 초상의 얼굴·복식을 유지한 걷기·달리기·후면·대기, 전용 일기토 시트와 필살기 이벤트샷입니다. 칼을 잡은 손과 칼자루의 연결을 중점 확인합니다.</p><p><a href="hero-women-complete-20261124.zip">게임 그림 전체 ZIP</a> · <a href="prompts-and-sources.json">내장 ImageGen 지시문·원화·해시</a> · <a href="overview.jpg">필살기 전체 보기</a> · <a href="hands-review.jpg">칼자루 쥔 손 확대</a> · <a href="../hero-street-20261124/index.html">전체 제독 29종 거리 동작</a></p>'''+''.join(cards)+'</main></html>'
    (OUT/'index.html').write_text(page,encoding='utf-8')
    with zipfile.ZipFile(OUT/'hero-women-complete-20261124.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for p in files:z.write(p,p.relative_to(ROOT))
    prompts=[]
    for p in sorted([*(ROOT/'tools/hero_women_20261124').glob('*.json'),*(ROOT/'tools/hero_background_20261124').glob('*.json')]):
        data=json.loads(p.read_text(encoding='utf-8'))
        if isinstance(data,dict) and data.get('group','hero-women-20261124')!='hero-women-20261124':continue
        if not isinstance(data,dict) or 'prompt' not in data:continue
        src=ROOT/'art_sources/hero-women-20261124/raw'/(data['key']+'.png')
        data['workspaceSource']=str(src.relative_to(ROOT));data['sha256']=hashlib.sha256(src.read_bytes()).hexdigest();prompts.append(data)
    (OUT/'prompts-and-sources.json').write_text(json.dumps({'mode':'built-in image_gen','records':prompts},ensure_ascii=False,indent=2),encoding='utf-8')
    (OUT/'asset-report.json').write_text(json.dumps({'actors':13,'files':len(files),'checks':checks},ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'여성 13종 · 전투 39시트·사건샷·GIF·거리·초상 {len(files)}개 검사·포장 완료')

if __name__=='__main__':main()
