from pathlib import Path
import json,hashlib,math,html,sys,shutil
from PIL import Image,ImageDraw,ImageFont
repo=Path(__file__).resolve().parents[2]
out=repo/'artifacts/creature-item-art-20261118';dest=repo/'images/creature-items-20261118'
dest.mkdir(exist_ok=True)
(out/'game-icons').mkdir(exist_ok=True)
plan=json.loads((out/'prompts.json').read_text(encoding='utf-8'));jobs=plan['jobs']
names={r['id']:r['name'] for r in json.loads((out/'ui_checks.json').read_text(encoding='utf-8')).get('items',[])} if (out/'ui_checks.json').exists() else {}
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',17)
bold=ImageFont.truetype('C:/Windows/Fonts/malgunbd.ttf',22)
records=[];overrides={}
for j in jobs:
    j={**j,'name':names.get(j['id'],j['name'])}
    src=out/'originals'/f"{j['id']}.png"
    if not src.exists():continue
    with Image.open(src) as im:
        assert im.mode=='RGBA',j['id']
        alpha=im.getchannel('A');assert alpha.getextrema()==(0,255),j['id']
        bbox=alpha.point(lambda v:255 if v>32 else 0).getbbox();assert bbox and bbox[0]>0 and bbox[1]>0 and bbox[2]<im.width and bbox[3]<im.height,(j['id'],bbox)
        icon=im.resize((256,256),Image.Resampling.LANCZOS)
        target=dest/f"{j['id']}.webp";icon.save(target,lossless=True,method=6)
        shutil.copyfile(target,out/'game-icons'/target.name)
        records.append({**{k:j[k] for k in ['id','name','key','type']},'original':src.relative_to(out).as_posix(),'gameFile':target.relative_to(repo).as_posix(),'originalSize':list(im.size),'gameSize':[256,256],'rgba':True,'alphaRange':list(alpha.getextrema()),'bbox':list(bbox),'originalSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'gameSha256':hashlib.sha256(target.read_bytes()).hexdigest()})
        overrides[j['key']]=target.relative_to(repo/'images').as_posix()
if '--final' in sys.argv:assert len(records)==54,len(records)
(out/'asset-overrides.json').write_text(json.dumps(overrides,ensure_ascii=False,indent=2),encoding='utf-8')
if '--final' in sys.argv:
    (Path(__file__).parent/'asset-overrides.json').write_text(json.dumps(overrides,ensure_ascii=False,indent=2),encoding='utf-8')
(out/'art_checks.json').write_text(json.dumps({'expected':54,'completed':len(records),'tool':'built-in image_gen','records':records},ensure_ascii=False,indent=2),encoding='utf-8')
groups={'mount':'무광 머리 박제','fossil':'거대한 머리 화석','fan':'깃털 부채','baby':'새끼와 알','relic':'괴물과 세계수의 유물'}
for typ,title in groups.items():
    rr=[r for r in records if r['type']==typ]
    if not rr:continue
    cols=4;cw=320;ch=356;cv=Image.new('RGB',(cols*cw,90+math.ceil(len(rr)/cols)*ch),'#d9cfba');dr=ImageDraw.Draw(cv)
    dr.text((20,20),title+f' · {len(rr)}종',font=bold,fill='#30271d')
    for i,r in enumerate(rr):
        x=(i%cols)*cw+10;y=90+(i//cols)*ch
        with Image.open(out/r['original']) as im:
            im.thumbnail((300,300),Image.Resampling.LANCZOS);cv.paste(im,(x+(300-im.width)//2,y+(300-im.height)//2),im)
        label=r['name'].replace('거대한 ','').replace('머리 박제','박제')
        if len(label)>19:label=label[:18]+'…'
        dr.text((x+3,y+302),label,font=font,fill='#30271d');dr.text((x+3,y+328),r['id'],font=font,fill='#685842')
    cv.save(out/f'preview-{typ}.jpg',quality=94)
sections=[]
for typ,title in groups.items():
    cards=[]
    for r in records:
        if r['type']!=typ:continue
        cards.append(f'<figure><a href="{r["original"]}"><img src="game-icons/{r["id"]}.webp" alt="{html.escape(r["name"])}"></a><figcaption>{html.escape(r["name"])}<small>{r["id"]}</small></figcaption></figure>')
    sections.append(f'<section id="{typ}"><h2>{title}</h2><div class="grid">'+''.join(cards)+'</div></section>')
(out/'index.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><title>발견물 아이템 원화 · 2026-11-18</title><style>body{margin:30px auto;max-width:1400px;padding:0 25px;background:#201a15;color:#e5d6be;font:17px/1.6 "Malgun Gothic",sans-serif}a{color:#ebc88b}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}figure{margin:0;background:#d9cfba;color:#30271d;padding:12px}img{display:block;width:256px;height:256px;margin:auto;object-fit:contain}figcaption{text-align:center}small{display:block;color:#685842}section{padding-top:30px}</style><h1>발견물 아이템 전용 원화</h1><p>2026-11-18 · '+str(len(records))+'/54종 · 내장 ImageGen · 게임용 256×256 RGBA · 원본 별도 보존</p><p>동물 머리 박제는 참고 이미지의 벽걸이 구도에서 출발해 무광 질감·낮은 시선·쓸쓸한 분위기로 새로 그렸습니다. 그림을 누르면 생성 원본을 엽니다.</p><nav>'+ ' · '.join(f'<a href="#{k}">{v}</a>' for k,v in groups.items())+'</nav>'+''.join(sections),encoding='utf-8')
print(json.dumps({'completed':len(records),'total':54},ensure_ascii=False))
