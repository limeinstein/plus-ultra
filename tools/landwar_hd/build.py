#!/usr/bin/env python3
"""ImageGen 육상전 원화를 고른 칸으로 포장한다. 그림을 새로 그리지 않고 알파 여백·발밑만 맞춘다.

python tools/landwar_hd/build.py
원화와 생성 지시문: artifacts/landwar-hd-20261105/sources.json · sources/*.png
옛 시트는 그대로 보존하며 전투에서만 G.LANDWAR_HD의 새 그림을 고른다.
"""
from pathlib import Path
import json
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
import sprite_repack as repack
try:
    from scipy.ndimage import label as fast_label
    repack.label=lambda mask: fast_label(mask,structure=np.ones((3,3),dtype=np.uint8))
except ImportError:
    pass  # 원래 포장 도구의 같은 8방향 연결 검사로도 만들 수 있다.
WORK = ROOT / 'artifacts/landwar-hd-20261105'
CELL, PX, PY = 256, 128, 239
SPECS = {
    'swordsmen': ['lv0','lv1','lv2','lv3'],
    'musketeers': ['lv0','lv1','lv2','lv3'],
    'cannons': ['lv0','lv1','lv2','lv3'],
    'officers': ['lv0','lv1','lv2','lv3'],
    'cavalry_horse': ['lv0','lv1','lv2','lv3'],
    'cavalry_camel': ['lv0','lv1','lv2','lv3'],
    'cavalry_elephant': ['lv0','lv1','lv2','lv3'],
    'regional_africa_a': ['wafrica_m','wafrica_r','sahel_m','sahel_r','congo_m','congo_r'],
    'regional_africa_b': ['ethiopia_m','ethiopia_r','swahili_m','swahili_r','mexico_m','mexico_r'],
    'regional_america_a': ['maya_m','maya_r','caribbean_m','caribbean_r','andes_m','andes_r'],
    'regional_america_b': ['amazon_m','amazon_r','woodland_m','woodland_r','plains_m','plains_r'],
    'regional_pacific_a': ['pueblo_m','pueblo_r','northwest_m','northwest_r','maori_m','maori_r'],
    'regional_pacific_b': ['polynesia_m','polynesia_r','australia_m','australia_r','papua_m','papua_r'],
    'regional_pacific_c': ['micronesia_m','micronesia_r','congo_l','andes_l'],
    'animals_hd': ['boar','lion','jaguar','tiger','bear','hyena','crocodile'],
    'landwar_fx': ['blast','muzzle','smoke','dust'],
    'east_fighters': ['ninja','spearman','swordsman','scholar','brute'],
    'ottoman': ['shield','topcu','janissary'],
    'west_europe': ['rodelero','landsknecht','crossbow','stradiot','streltsy'],
    'india_central': ['qizilbash','afghan','rajput','mughal_gun','horse_archer'],
    'southeast_asia': ['malay','javanese','ayutthaya','daiviet','moluccan'],
    'regional_mounts': ['songhai','rajput_elephant','ayutthaya_elephant','qizilbash_archer'],
}
WEAPONS = {
    'swordsmen':['club','sword','sword','sword'], 'musketeers':['gun']*4,
    'officers':['sword']*4, 'cannons':['cannon']*4,
    'cavalry_horse':['lance']*4, 'cavalry_camel':['lance']*4, 'cavalry_elephant':['lance']*4,
    'regional_africa_a':['spear','bow','spear','bow','axe','bow'],
    'regional_africa_b':['spear','bow','sword','bow','macuahuitl','bow'],
    'regional_america_a':['spear','bow','club','bow','axe','sling'],
    'regional_america_b':['spear','bow','club','bow','spear','bow'],
    'regional_pacific_a':['club','bow','spear','bow','taiaha','javelin'],
    'regional_pacific_b':['club','javelin','spear','boomerang','spear','bow'],
    'regional_pacific_c':['spear','sling','axe','mace'],
    'east_fighters':['sword','spear','sword','sword','club'],
    'ottoman':['sword','cannon','gun'],
    'west_europe':['sword','spear','crossbow','lance','gun'],
    'india_central':['sword','spear','sword','gun','bow'],
    'southeast_asia':['sword','blowpipe','spear','spear','blowpipe'],
    'regional_mounts':['lance','lance','lance','bow'],
}

def pack(id, rows, src):
    im = Image.open(src).convert('RGBA')
    w, h = im.size
    original=np.array(im)
    if float((original[:,:,3] < 12).mean()) < .12:
        raise ValueError(f'{id}: 투명 배경이 아닌 원화는 포장하지 않습니다.')
    original[:,:,3][original[:,:,3] < 12]=0
    # 줄 경계도 빈 가로줄로 옮긴다. 바로 윗줄의 발끝이 다음 줄 머리 위에 남지 않게 한다.
    profile=(original[:,:,3]>32).sum(axis=1).astype(float)
    row_cuts=[0]
    for r in range(1,len(rows)):
        center=h*r/len(rows);radius=h/len(rows)*.19
        lo=max(row_cuts[-1]+1,round(center-radius));hi=min(h-1,round(center+radius))
        scores=profile[lo:hi]+np.abs(np.arange(lo,hi)-center)*.02
        row_cuts.append(lo+int(np.argmin(scores)))
    row_cuts.append(h)
    result = Image.new('RGBA',(CELL*8,CELL*len(rows)))
    boxes, frames = [], []
    # 원화는 등간격 격자다. 각 칸의 희미한 알파 찌꺼기를 버리고, 같은 줄은 같은 배율로 맞춘다.
    for r in range(len(rows)):
        line = []
        # 칸 경계를 넘는 창·꼬리·칼끝은 연결된 몸통의 칸으로 돌려준다.
        band=original[row_cuts[r]:row_cuts[r+1]]
        pieces=repack.frames_of_band(band,0,band.shape[0],[round(w*c/8) for c in range(9)],speck=.035)
        for c in range(8):
            if pieces[c] is None: raise ValueError(f'{id} {r}:{c} 빈 장면')
            tile = Image.fromarray(pieces[c][0])
            a = np.array(tile)
            a[:,:,3][a[:,:,3] < 12] = 0
            tile = Image.fromarray(a)
            mask = tile.getchannel('A').point(lambda v: 255 if v > 32 else 0)
            bbox = mask.getbbox()
            if bbox is None: raise ValueError(f'{id} {r}:{c} 빈 장면')
            line.append((tile, bbox))
        # 넓은 포·기마도 창끝이 잘리지 않게 한다. 줄 안에서만 고른 배율을 쓴다.
        scale = min(222/max(b[2]-b[0] for _,b in line), 218/max(b[3]-b[1] for _,b in line), 1.65)
        for c,(tile,b) in enumerate(line):
            cut=tile.crop(b); cut=cut.resize((max(1,round(cut.width*scale)),max(1,round(cut.height*scale))),Image.Resampling.LANCZOS)
            # 장비의 끝보다 발밑의 무게 중심을 고른다. 넓은 방패·창으로 몸이 좌우로 튀지 않는다.
            aa=np.array(tile)[:,:,3].astype(float); yy=np.arange(tile.height)[:,None]
            weights=aa*(yy>tile.height*.58)
            mass=weights.sum(axis=0)
            center=float((mass*np.arange(tile.width)).sum()/mass.sum()) if mass.sum() else (b[0]+b[2])/2
            x=round(PX-(center-b[0])*scale); x=max(5,min(CELL-cut.width-5,x))
            y=PY-cut.height
            result.alpha_composite(cut,(c*CELL+x,r*CELL+y))
            boxes.append([r,c,x,y,cut.width,cut.height]); frames.append(cut.height)
    dest=ROOT/'images/sprites'/('lw_'+id+'.webp')
    result.save(dest,quality=93,method=6)
    # 키는 무기를 올리지 않은 대기 장면에서 잰다. 원거리 화기·포·탈것은 넓이도 맞춘다.
    body_heights=[boxes[r*8][5] for r in range(len(rows))]
    bh=round(float(np.median(body_heights)))
    ports=[]
    for r in range(len(rows)):
        b=boxes[r*8+3]; cannon=id=='cannons' or id=='ottoman' and r==1
        ports.append([b[2]+b[4]-PX-6,b[3]+b[5]*(.48 if cannon else .28)-PY])
    mounts=[('말' if id=='west_europe' and r==3 or id=='india_central' and r==4 or id=='cavalry_horse' else '낙타' if id=='cavalry_camel' else '코끼리' if id=='cavalry_elephant' else None) for r in range(len(rows))]
    if id=='regional_mounts': mounts=['말','코끼리','코끼리','말']
    return result, dict(image='lw_'+id,cw=CELL,ch=CELL,px=PX,py=PY,cols=8,rows=rows,n=[8]*len(rows),h=bh,bh=bh,bhs=body_heights,ports=ports,mounts=mounts,
        acts=dict(idle=[0],walk=[1,2],run=[1,2],charge=[1,2],attack=[3,4,5,6],ready=[3],load=[6],hurt=[7],dead=[7],back=[2,1],cheer=[0]),
        weapons=WEAPONS.get(id,rows),hd=True), boxes

def main():
    sources=json.loads((WORK/'sources.json').read_text('utf8'))
    meta, regional, audit, thumbs = {}, {}, {}, []
    for id, rows in SPECS.items():
        src=WORK/'sources'/(id+'.png')
        if not src.exists(): continue
        atlas,m,boxes=pack(id,rows,src)
        print(id+' 포장 완료',flush=True)
        meta[id]=m; audit[id]=dict(source=str(src.relative_to(ROOT)),boxes=boxes,rows=rows)
        for r,name in enumerate(rows):
            if name.endswith(('_m','_r','_l')):
                reg,kind=name.rsplit('_',1); regional.setdefault(reg,{})[kind]=[id,name]
            thumb=atlas.crop((0,r*CELL,CELL,(r+1)*CELL));thumb.thumbnail((144,144),Image.Resampling.LANCZOS)
            thumbs.append((id+'/'+name,thumb))
    for id in ('swordsmen','musketeers','cannons','officers'):
        if id in meta: meta[id+'_enemy']=dict(meta[id])
    if 'animals_hd' in meta:
        # 옛 호출도 그대로 통한다. 악어는 독립 ID와 줄 이름을 유지한다.
        meta['animals']=dict(meta['animals_hd'], rows=SPECS['animals_hd'][:6], n=[8]*6, imageRows=7)
        meta['crocodile']=dict(meta['animals_hd'], rows=['crocodile'], n=[8], sourceRows=[6], imageRows=7,bh=meta['animals_hd']['bhs'][6],bhs=[meta['animals_hd']['bhs'][6]])
    for reg,parts in regional.items():
        parts.setdefault('l',parts['m'])
    code='/* 자동 생성: python tools/landwar_hd/build.py. 원화·생성 지시문은 artifacts/landwar-hd-20261105/. */\n(function(G){\n\'use strict\';\nG.LANDWAR_HD='+json.dumps(meta,ensure_ascii=False,separators=(',',':'))+';\nG.LANDWAR_REGIONAL_HD='+json.dumps(regional,ensure_ascii=False,separators=(',',':'))+';\n})(window.G=window.G||{});\n'
    (ROOT/'js/data/landwarmotion.js').write_text(code,encoding='utf8')
    (WORK/'packing.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf8')
    # 새 그림 키만 목록에 더한다. 다른 작업에서 추가한 목록은 보존한다.
    mf=ROOT/'images/manifest.js'; text=mf.read_text('utf8')
    entries=[]
    for id in audit:
        key='sprites/lw_'+id
        if '"'+key+'"' not in text: entries.append('  '+json.dumps(key)+': '+json.dumps(key+'.webp')+',')
    if entries: text=text.replace('G.IMAGE_FILES = {','G.IMAGE_FILES = {\n'+'\n'.join(entries),1);mf.write_text(text,encoding='utf8')
    cols=8;rows=(len(thumbs)+cols-1)//cols; preview=Image.new('RGB',(cols*170,rows*174),'#28333c'); draw=ImageDraw.Draw(preview)
    try: font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',10)
    except OSError: font=ImageFont.load_default()
    for i,(label,thumb) in enumerate(thumbs):
        x=i%cols*170;y=i//cols*174;preview.paste(thumb,(x+(170-thumb.width)//2,y),thumb);draw.text((x+4,y+146),label,fill='#e5d6b7',font=font)
    preview.save(WORK/'contact.jpg',quality=93)
    print(f'{len(audit)}개 시트, {len(thumbs)}개 외형, {sum(len(v["rows"])*8 for v in audit.values())}개 장면 포장')

if __name__=='__main__': main()
