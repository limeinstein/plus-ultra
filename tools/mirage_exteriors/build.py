"""신기루 발견 위치에 맞는 투명 외관 50개와 지도용 판을 만든다."""
from pathlib import Path
import argparse
import html
import json
import re
import sys
import zipfile
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'tools'))
import prepare_landmark_imagegen as landmark
import landmark_base
ROWS=json.loads((HERE/'prompts.json').read_text(encoding='utf-8'))
FIELD=[r for r in ROWS if r['kind']!='city']
SHEETS=[{'key':f'map-discoveries/mirage-ruins-{i//16+1}','ids':[r['id'] for r in FIELD[i:i+16]]} for i in range(0,len(FIELD),16)]


def source(row):
    with Image.open(ROOT/row['source']) as im:
        rgba=im.convert('RGBA')
    alpha=rgba.getchannel('A')
    lo,hi=alpha.getextrema()
    if lo!=0 or hi<240 or alpha.histogram()[0]<rgba.width*rgba.height*.08:
        raise ValueError(f"실제 투명 배경이 없는 원화: {row['id']}")
    return rgba


def field_image(image,size=512):
    bbox=image.getchannel('A').point(lambda a:255 if a>=8 else 0).getbbox()
    if not bbox: raise ValueError('그림이 비어 있습니다.')
    fg=image.crop(bbox)
    factor=min((size-40)/fg.width,(size-40)/fg.height)
    fg=fg.resize((max(1,round(fg.width*factor)),max(1,round(fg.height*factor))),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(size,size),(0,0,0,0))
    canvas.alpha_composite(fg,((size-fg.width)//2,size-20-fg.height))
    return canvas


def build(row):
    im=source(row)
    target=ROOT/row['target']
    target.parent.mkdir(parents=True,exist_ok=True)
    if row['kind']=='city':
        landmark.prepare(ROOT/row['source'],target)
    else:
        field_image(im).save(target,'WEBP',quality=94,method=6,exact=True)
    print(f"완료 {row['kind']} {row['id']}",flush=True)


def sheets():
    for row in SHEETS:
        atlas=Image.new('RGBA',(1024,1024),(0,0,0,0))
        for i,did in enumerate(row['ids']):
            path=ROOT/'images/map-discoveries/mirage'/f'{did}.webp'
            if not path.exists(): continue
            with Image.open(path) as im:
                tile=im.convert('RGBA').resize((256,256),Image.Resampling.LANCZOS)
            atlas.alpha_composite(tile,((i%4)*256,(i//4)*256))
        atlas.save(ROOT/'images'/f"{row['key']}.png",optimize=True)
    (HERE/'map-sheets.json').write_text(json.dumps(SHEETS,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')


def preview():
    ready=[r for r in ROWS if (ROOT/r['target']).exists()]
    font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',17)
    contact=Image.new('RGB',(1440,((len(ready)+4)//5)*246),'#eee7da')
    draw=ImageDraw.Draw(contact)
    labels={'city':'도시 외관','land':'육상 탐험','sea':'항해'}
    cards=[]
    for i,row in enumerate(ready):
        with Image.open(ROOT/row['target']) as im: fg=im.convert('RGBA')
        fg.thumbnail((268,198),Image.Resampling.LANCZOS)
        x,y=(i%5)*288,(i//5)*246
        contact.paste(fg,(x+(288-fg.width)//2,y+200-fg.height),fg)
        draw.text((x+6,y+205),row['name'][:20],font=font,fill='#302b23')
        draw.text((x+6,y+225),labels[row['kind']],font=font,fill='#746957')
        cards.append(f'<article data-kind="{row["kind"]}"><h2>{html.escape(row["name"])}</h2><p>{labels[row["kind"]]}</p><div class="checker"><img src="../../{row["target"]}" loading="lazy"></div><a href="../../{row["target"]}" download>이미지 저장 · {row["id"]}</a></article>')
    art=ROOT/'docs/art'
    art.mkdir(parents=True,exist_ok=True)
    if ready: contact.save(art/'mirage50-exteriors-preview.jpg',quality=94)
    page='<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>신기루 발견물 외관 50</title><style>body{background:#202a2d;color:#f0e9dc;font-family:system-ui;margin:28px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}article{padding:18px;background:#2b383c;border-radius:12px}h2{font-size:18px}.checker{height:260px;display:grid;place-items:center;background:repeating-conic-gradient(#ece9e2 0% 25%,#ddd9ce 0% 50%) 50%/24px 24px}img{max-width:100%;max-height:250px}a{color:#e8c894;display:block;margin-top:12px}button{padding:10px 18px;margin:0 8px 18px 0;background:#d8c399;border:0;border-radius:6px;cursor:pointer}</style><h1>신기루 발견물 외관 · '+str(len(ready))+'/50</h1><p>도시 18곳 · 육상 20곳 · 항해 12곳 — 실제 투명 배경</p><nav><button data-filter="all">전체</button><button data-filter="city">도시 외관</button><button data-filter="land">육상 탐험</button><button data-filter="sea">항해</button></nav><main>'+''.join(cards)+'</main><script>document.querySelectorAll("[data-filter]").forEach(b=>b.onclick=()=>document.querySelectorAll("article").forEach(a=>a.hidden=b.dataset.filter!=="all"&&a.dataset.kind!==b.dataset.filter));</script></html>'
    (art/'mirage50-exteriors.html').write_text(page,encoding='utf-8')


def update_bases():
    # 기존 볼거리 표는 보존하고 이번 도시 외관 18곳의 발치만 갱신한다.
    target=ROOT/'js/data/landmarkbase.js'
    text=target.read_text(encoding='utf-8')
    match=re.search(r'G\.LANDMARK_BASE\s*=\s*(\{.*\});',text,re.S)
    table=json.loads(match.group(1))
    for row in ROWS:
        if row['kind']=='city' and (ROOT/row['target']).exists():
            table[row['id']]=landmark_base.base(ROOT/row['target'])
    body=',\n'.join('  '+json.dumps(k)+': '+json.dumps(v) for k,v in sorted(table.items()))
    target.write_text(text[:match.start(1)]+'{\n'+body+'\n};\n',encoding='utf-8',newline='\n')


def update_manifest():
    # 다른 제작 중인 그림은 건드리지 않고 이번 외관만 등록한다.
    target=ROOT/'images/manifest.js'
    text=target.read_text(encoding='utf-8')
    match=re.search(r'G\.IMAGE_FILES\s*=\s*(\{.*\});',text,re.S)
    table=json.loads(match.group(1))
    paths=[r['target'][7:] for r in ROWS]+[r['key']+'.png' for r in SHEETS]
    for path in paths:
        if (ROOT/'images'/path).exists(): table[str(Path(path).with_suffix('')).replace('\\','/')]=path
    target.write_text(text[:match.start(1)]+json.dumps(table,ensure_ascii=False,indent=2,sort_keys=True)+';\n',encoding='utf-8',newline='\n')


def package():
    target=ROOT/'artifacts/mirage50-exteriors.zip'
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
        for row in ROWS: z.write(ROOT/row['target'],row['target'])
        for row in SHEETS: z.write(ROOT/'images'/f"{row['key']}.png",f"images/{row['key']}.png")
        page=(ROOT/'docs/art/mirage50-exteriors.html').read_text(encoding='utf-8').replace('../../images/','images/')
        z.writestr('index.html',page)
        z.write(HERE/'prompts.json','prompts.json')
    print(f'묶음: {target}',flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--ready',action='store_true')
    parser.add_argument('--only')
    parser.add_argument('--preview',action='store_true')
    parser.add_argument('--package',action='store_true')
    args=parser.parse_args()
    if not args.preview:
        for row in ROWS:
            if args.only and row['id'] not in args.only.split(','): continue
            src=ROOT/row['source'];dst=ROOT/row['target']
            if args.ready and (not src.exists() or (dst.exists() and dst.stat().st_mtime>=src.stat().st_mtime)): continue
            build(row)
        sheets()
        update_bases()
        update_manifest()
    preview()
    if args.package: package()
