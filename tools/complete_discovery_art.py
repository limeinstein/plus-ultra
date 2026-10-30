#!/usr/bin/env python3
"""전체 발견물의 도시·야외 외관 누락 조사와 새 ImageGen 원화 등록·변환."""
from __future__ import annotations
import argparse, html, json, os, re, shutil, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
import addition_art
import landmark_base

ROOT = Path(__file__).resolve().parents[1]
SPEC = ROOT / 'docs/art/discovery-exteriors-20261031-prompts.json'
HERE = ROOT / 'tools/discovery_exteriors_20261031'
SPECIAL = {
    'septizodium': 'Exactly THREE complete stacked storeys of Roman marble colonnades, seven bays wide, each storey has its own continuous entablature. A monumental ornamental facade wall, not a roofed temple. No fourth storey.',
    'constbaths': 'Roman Baths of Constantine on the Quirinal: weathered red brick bathhouse remains, tall arches and vaulted hall, no modern spa or pools.',
    'manwoldae': 'Actual surviving Goryeo palace site at Kaesong: broad granite terraces, stairs, stone foundation blocks and low grass, no reconstructed palace buildings.',
    'aurora': 'Luminous translucent green and purple aurora curtains over a tiny snow-covered Arctic shoreline. Aurora is an atmospheric phenomenon, not a solid structure. No opaque rectangular night sky.',
    'worcesterwall': 'A surviving segment of medieval Worcester city wall in weathered red sandstone, low ramparts and a modest gate, not a huge fantasy castle.',
}

def complete_runtime():
    rows=addition_art.runtime()["discoveries"]
    story=(ROOT/"js/data/story.js").read_text(encoding="utf-8")
    for did,name in re.findall(r"^\s*\['(ft_[^']+)',\s*'([^']+)',\s*\d+",story,re.M):
        if not any(d["id"]==did for d in rows):rows.append({"id":did,"name":name,"cat":"treasure","how":"special"})
    return rows

def read():
    return json.loads(SPEC.read_text(encoding='utf-8'))

def prepare():
    if SPEC.exists():
        raise FileExistsError('이미 만든 제작 목록은 보존합니다.')
    data = complete_runtime()
    manifest = (ROOT/'images/manifest.js').read_text(encoding='utf-8')
    icon_js = (ROOT/'js/art/discovery_icon.js').read_text(encoding='utf-8')
    mapped = set(re.findall(r"'([a-z0-9_]+)'", icon_js))
    rows, missing = [], []
    for d in data:
        did = d['id']
        for folder, ext in [('discoveries','.gif'),('discovery-ends','.jpg'),('discovery-sheets','.webp')]:
            if not (ROOT/'images'/folder/(did+ext)).exists() or '"'+folder+'/'+did+'"' not in manifest:
                missing.append(folder+'/'+did)
        city = d['cat']=='ruin' and d['how']=='city'
        field = (d['cat'] in ('ruin','nature') or d.get('natural')) and d['how']!='city'
        if city and '"landmarks/'+did+'"' not in manifest:
            kind, key = 'city', 'landmarks/'+did
        elif field and did not in mapped:
            kind, key = 'field', 'map-discoveries/completion/'+did
        else:
            continue
        subject = addition_art.ISLANDS.get(did, d.get('desc',''))
        composition = ('Strict frontal elevation at human eye level, level ground contact. Entire principal building or coherent facade group, all towers and roofs inside the image. No aerial view.' if city else
                       'Elevated three-quarter orthographic/isometric view, compact readable world-map miniature of the entire site. Natural scenery is a small irregular natural landform vignette with characteristic cliffs, water, vegetation or geology. No rectangular landscape backdrop, pedestal or artificial model base.')
        prompt = ('Use case: stylized-concept. Asset type: ONE transparent historical exploration game '+('city street landmark exterior' if city else 'exploration and sailing map landmark')+'. '
                  'Subject: '+d['name']+' ('+did+'). '+subject+' '+SPECIAL.get(did,'')+' '
                  +composition+' Refined detailed hand-painted travel illustration, realistic materials and geography, warm neutral daylight, crisp recognizable silhouette. '
                  'Historical sites use the period condition described, future university mirages use the defining historic campus building. Islands are before modern tourism: no hotels, pools, cruise ships, modern marinas or beach umbrellas. '
                  'One asset centered on a square 1024x1024 canvas with generous fully transparent margin on every side, 8 percent padding, no clipped spires or branches. '
                  'Genuinely transparent RGBA background. Only a subtle local contact shadow. No white backdrop, sky rectangle, checkerboard, surrounding city, text, captions, logos, watermark, panels, grid or collage.')
        rows.append({'id':did,'name':d['name'],'kind':kind,'how':d['how'],'city':d.get('city'),'cat':d['cat'],
                     'source':f'tools/discovery_exteriors_20261031/sources/{did}.png',
                     'target':'images/'+key+'.webp','key':key,'prompt':prompt})
    result={'date':'2026-10-31','generator':'built-in image_gen','audited_discoveries':len(data),
            'missing_discovery_scenes':missing,'assets':rows}
    SPEC.parent.mkdir(exist_ok=True,parents=True)
    SPEC.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'total':len(data),'missing_scenes':missing,'city':sum(r['kind']=='city' for r in rows),'field':sum(r['kind']=='field' for r in rows)},ensure_ascii=False))

def record(did, source):
    data=read(); row=next(r for r in data['assets'] if r['id']==did)
    target=ROOT/row['source']; target.parent.mkdir(exist_ok=True,parents=True)
    if target.exists(): raise FileExistsError(str(target))
    with Image.open(source) as im:
        a=im.convert('RGBA').getchannel('A')
        if a.getextrema()[0]!=0 or a.histogram()[0]<im.width*im.height*.05:
            raise ValueError('투명 배경 없는 원화: '+did)
    shutil.copy2(source,target)
    row['generated_from']=str(source)
    SPEC.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(did+' 원화 저장')

def select_revisions():
    data=read()
    for did in ('potosimint','septizodium','manwoldae'):
        path=HERE/(did+'-revision.json')
        if not path.exists():continue
        revision=json.loads(path.read_text(encoding='utf-8'))
        row=next(r for r in data['assets'] if r['id']==did)
        revised='tools/discovery_exteriors_20261031/sources/'+did+'-v2.png'
        row['mode']=revision.get('mode','edit' if did=='septizodium' else 'generate')
        if row['mode']=='edit':row['reference']=revision.get('reference','tools/discovery_exteriors_20261031/sources/'+did+'.png')
        if row['source']==revised:continue
        row.setdefault('revisions',[]).append({k:row.get(k) for k in ('source','prompt','generated_from')})
        row.update(source=revised,prompt=revision['prompt'],generated_from=revision['source'],rebuild=True)
    data['audited_discoveries']=len(complete_runtime())
    SPEC.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('외형·층수·지형 수정 원화 선택')

def build():
    data=read(); ready=[]
    for row in data['assets']:
        source=ROOT/row['source']; target=ROOT/row['target']
        if not source.exists(): continue
        if target.exists() and not row.get('built'): raise FileExistsError('기존 그림 보존: '+str(target))
        if not target.exists() or row.get('rebuild'):
            if target.exists():
                backup=HERE/'before-revisions'/target.name;backup.parent.mkdir(exist_ok=True,parents=True)
                if not backup.exists():shutil.copy2(target,backup)
            with Image.open(source) as im: rgba=im.convert('RGBA')
            box=rgba.getchannel('A').point(lambda a:255 if a>=8 else 0).getbbox()
            if not box: raise ValueError(row['id'])
            fg=rgba.crop(box)
            if row['kind']=='city':
                h=480; w=round(fg.width*h/fg.height)
                if w>1220: h=round(h*1220/w);w=1220
                canvas=Image.new('RGBA',(max(294,w+40),520))
                fg=fg.resize((w,h),Image.Resampling.LANCZOS)
                canvas.alpha_composite(fg,((canvas.width-w)//2,500-h))
            else:
                canvas=Image.new('RGBA',(512,512));fg=ImageOps.contain(fg,(472,472),Image.Resampling.LANCZOS)
                canvas.alpha_composite(fg,((512-fg.width)//2,492-fg.height))
            target.parent.mkdir(exist_ok=True,parents=True)
            canvas.save(target,'WEBP',quality=94,method=6,exact=True)
            row['built']=True
            row.pop('rebuild',None)
        ready.append(row)
    SPEC.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    # 기존 등록은 유지하고 완성된 개별 외관만 더한다.
    manifest=ROOT/'images/manifest.js';text=manifest.read_text(encoding='utf-8')
    additions=[json.dumps(r['key'])+': '+json.dumps(r['target'][7:])+',' for r in ready if json.dumps(r['key'])+':' not in text]
    if additions:
        mark=re.search(r'G\.IMAGE_FILES\s*=\s*\{',text)
        if not mark: raise ValueError('그림 목록 시작을 찾지 못했습니다.')
        text=text[:mark.end()]+'\n'+''.join('  '+x+'\n' for x in additions)+text[mark.end():]
        manifest.write_text(text,encoding='utf-8',newline='\n')
    icons=ROOT/'js/art/discovery_icon.js';text=icons.read_text(encoding='utf-8')
    start='  // 2026-10-31 누락 외관 자동 등록 시작';end='  // 2026-10-31 누락 외관 자동 등록 끝'
    block=start+'\n'+''.join('  POS.'+r['id']+' = { key: '+json.dumps(r['key'])+', slot: 0, cols: 1, rows: 1 };\n' for r in ready if r['kind']=='field')+end+'\n'
    if start in text: text=re.sub(re.escape(start)+r'.*?'+re.escape(end)+r'\n',lambda _:block,text,flags=re.S)
    else: text=text.replace('  DI.isMapLandmark =',block+'\n  DI.isMapLandmark =',1)
    icons.write_text(text,encoding='utf-8',newline='\n')
    bases=ROOT/'js/data/landmarkbase.js';text=bases.read_text(encoding='utf-8')
    match=re.search(r'G\.LANDMARK_BASE\s*=\s*(\{.*\});',text,re.S);table=json.loads(match.group(1))
    for row in ready:
        if row['kind']=='city':table[row['id']]=landmark_base.base(ROOT/row['target'])
    body=',\n'.join('  '+json.dumps(k)+': '+json.dumps(v) for k,v in sorted(table.items()))
    bases.write_text(text[:match.start(1)]+'{\n'+body+'\n};\n',encoding='utf-8',newline='\n')
    font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',17)
    for kind in ('city','field'):
        rows=[r for r in ready if r['kind']==kind]
        if not rows:continue
        cv=Image.new('RGB',(1440,((len(rows)+4)//5)*220),'#e9e1d2');draw=ImageDraw.Draw(cv)
        for i,row in enumerate(rows):
            with Image.open(ROOT/row['target']) as im:fg=ImageOps.contain(im.convert('RGBA'),(268,178),Image.Resampling.LANCZOS)
            x,y=i%5*288,i//5*220;cv.paste(fg,(x+(288-fg.width)//2,y+180-fg.height),fg)
            draw.text((x+8,y+190),row['name'][:19],font=font,fill='#302a23')
        cv.save(ROOT/f'docs/art/discovery-exteriors-20261031-{kind}.jpg',quality=94)
    cards=[]
    for row in sorted(ready,key=lambda r:r['kind']!='city'):
        name=html.escape(row['name']);url='../../'+row['target']
        label='도시 거리' if row['kind']=='city' else '탐험·항해·해도'
        cards.append(f'<article data-kind="{row["kind"]}"><div class="art"><img src="{url}" alt="{name}" loading="lazy"></div><h2>{name}</h2><p>{label}</p><a href="{url}" download>그림 저장</a></article>')
    gallery='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>발견물 도시·야외 외관</title><style>body{margin:28px;background:#202a2d;color:#f1e8d6;font-family:system-ui}h1{font-size:28px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}article{background:#2c393d;padding:16px;border-radius:10px}article[hidden]{display:none}.art{display:grid;place-items:center;height:260px;background:repeating-conic-gradient(#ede8dc 0% 25%,#ddd7ca 0% 50%) 50%/24px 24px;border-radius:5px}img{max-width:100%;max-height:250px}h2{font-size:18px}p{color:#c7c3b8}a{color:#e7c788}button{background:#dec89e;color:#302b23;border:0;border-radius:5px;padding:10px 18px;margin:0 8px 20px 0;cursor:pointer}</style><h1>발견물 도시·야외 외관</h1>'''
    gallery+=f'<p>도시 거리 10종 · 탐험·항해·해도 80종 — 완성 {len(ready)}/90</p><nav><button data-filter="all">전체</button><button data-filter="city">도시 거리</button><button data-filter="field">탐험·항해·해도</button></nav><main>'+''.join(cards)+'''</main><script>document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>document.querySelectorAll('article').forEach(a=>a.hidden=b.dataset.filter!=='all'&&a.dataset.kind!==b.dataset.filter));</script></html>'''
    (ROOT/'docs/art/discovery-exteriors-20261031.html').write_text(gallery,encoding='utf-8',newline='\n')
    print('도시·지도 외관 연결: '+str(len(ready))+'/'+str(len(data['assets'])))

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('action',choices=['prepare','record','select-revisions','build']);p.add_argument('--id');p.add_argument('--source',type=Path);a=p.parse_args()
    # 원화 저장과 중간 미리보기 제작이 겹쳐도 생성 기록을 덮어 잃지 않는다.
    HERE.mkdir(parents=True,exist_ok=True)
    with (HERE/'.build.lock').open('a+b') as lock:
        if lock.tell()==0:lock.write(b'0');lock.flush()
        lock.seek(0)
        if os.name=='nt':
            import msvcrt
            msvcrt.locking(lock.fileno(),msvcrt.LK_LOCK,1)
        else:
            import fcntl
            fcntl.flock(lock,fcntl.LOCK_EX)
        try:
            if a.action=='prepare':prepare()
            elif a.action=='record':record(a.id,a.source)
            elif a.action=='select-revisions':select_revisions()
            else:build()
        finally:
            lock.seek(0)
            if os.name=='nt':msvcrt.locking(lock.fileno(),msvcrt.LK_UNLCK,1)
            else:fcntl.flock(lock,fcntl.LOCK_UN)
