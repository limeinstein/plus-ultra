"""내장 ImageGen 원화를 제독 16종의 걷기·일기토·필살기 자산으로 포장한다.

그림을 새로 그리거나 신체를 변형하지 않는다. 연결 성분을 분리하고
같은 비율로 축소·배치한다. 교체 전 파일은 최초 한 번만 보관한다.
"""
import argparse
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

from duel_roster_sheets import separate, feet
from duel_cutins import make_frames, save_gif
from duel_finishers import make_moves
from duel_fall_geometry import geometry
from duel_contact_points import row as contact_row

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT/'art_sources/hero-motion-20261124'
RAW = SOURCE/'raw'
BACKUP = SOURCE/'before'
OUT = ROOT/'artifacts/hero-motion-20261124'
CW, CH, PX, FLOOR = 432, 304, 165, 278
IDS = [c['id'] for c in json.loads((ROOT/'tools/hero_motion_20261124/characters.json').read_text(encoding='utf-8'))]


def backup(path):
    old = BACKUP/path.relative_to(ROOT)
    if path.exists() and not old.exists():
        old.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, old)


def save(image, path, **kwargs):
    backup(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, **kwargs)


def clean_poses(path, rows, cols):
    """실루엣에 붙지 않은 알파 먼지는 버리고 실제 인물 1개씩 분리한다."""
    revised=path.with_stem(path.stem+'_alpha')
    if revised.exists():path=revised
    poses = separate(path, rows, cols)
    result = []
    for p in poses:
        rgba = np.array(p)
        rgba[rgba[:,:,3] <= 32] = 0
        p = Image.fromarray(rgba)
        bounds = p.getchannel('A').getbbox()
        if not bounds:
            raise ValueError(f'{path.name}: 빈 인물')
        p = p.crop(bounds)
        result.append(p)
    return result


def place(sheet, pose, r, c, scale, prone=False):
    if prone and pose.width <= 2.5*pose.height:
        raise ValueError(f'누운 자세가 가로로 충분히 눕지 않았습니다: {pose.size}')
    if prone:
        scale = min(max(scale, 64/pose.height), (CW-14)/pose.width)
    tile = pose.resize(tuple(max(1,round(v*scale)) for v in pose.size), Image.Resampling.LANCZOS)
    # 재표본화에서 생기는 거의 보이지 않는 알파는 여백 검사에도 동일하게 처리한다.
    a = tile.getchannel('A').point(lambda x: 0 if x <= 4 else x)
    tile.putalpha(a)
    tile = tile.crop(a.getbbox())
    foot = tile.width/2 if prone else feet(tile)[0]
    x = max(6, min(CW-tile.width-6, round(PX-foot)))
    y = FLOOR-tile.height
    if y < 6 or x < 5 or x+tile.width > CW-5:
        raise ValueError(f'포즈가 전투 칸을 넘습니다: {r},{c} {tile.size}')
    sheet.alpha_composite(tile,(c*CW+x,r*CH+y))


def combat(fid):
    atk, react = (clean_poses(RAW/f'{fid}_{kind}.png',4,6) for kind in ('atk','react'))
    neutral=react[0] if fid=='hat_spinner' else react[18]
    scale = min(215/neutral.height, 270/max(p.height for p in atk+react), 418/max(p.width for p in atk+react))
    if react[22].width <= 2.5*react[22].height:
        raise ValueError(f'{fid}: 쓰러진 원화 재제작 필요: {react[22].size}')
    fighter = 'main_admiral' if fid == 'admiral' else fid
    layers = {}
    # 런타임 행 순서: 베기·찌르기·손잡이 치기·올려베기/튕김,
    # 피격 상단·하단·칼 흘리기·넘어지기. 제작 원화의 주제별 행을 이 순서로 옮긴다.
    attack_runtime = atk[:12]+atk[18:24]+[atk[i] for i in (12,14,15,16,17,0)]
    record=ROOT/'tools/hero_motion_20261124'/f'{fid}_atk.json'
    if record.exists() and json.loads(record.read_text(encoding='utf-8')).get('layout')=='runtime':
        attack_runtime=atk
    react_runtime = [react[i] for i in (12,13,14,13,15,16,14,15,16,13,15,16,1,2,3,0,4,5,12,13,21,20,22,23)]
    for kind, poses in (('atk',attack_runtime),('react',react_runtime)):
        atlas = Image.new('RGBA',(CW*6,CH*4))
        for i,p in enumerate(poses):
            place(atlas,p,i//6,i%6,scale, kind=='react' and i==22)
        path = ROOT/'images/duel/fighters_ext'/f'{fighter}_{kind}.png'
        save(atlas,path,optimize=True)
        layers[kind]=atlas
    rows = [atk[:6],react[:4],[react[12],react[20],react[22]],
            [neutral,atk[1],react[2],atk[4],react[19],neutral]]
    atlas = Image.new('RGBA',(CW*6,CH*4))
    for r,poses in enumerate(rows):
        for c,p in enumerate(poses):
            place(atlas,p,r,c,scale,r==2 and c==2)
    path = ROOT/'images/duel/fighters'/f'{fighter}.png'
    save(atlas,path,optimize=True)
    for kind in ('slash','thrust','bash'):
        backup(ROOT/'images/duel/finishers'/fighter/(kind+'.gif'))
    make_moves(fighter,atlas)
    idle=atlas.crop((0,CH*3,CW,CH*4)).getchannel('A').point(lambda a:255 if a>80 else 0).getbbox()
    contact = {'base':contact_row(atlas,0),'height':idle[3]-idle[1]}
    contact.update({str(r):contact_row(layers['atk'],r,r==3) for r in range(4)})
    return {'fighter':fighter,'contact':contact,'geometry':geometry(path)}


def walking(fid):
    poses=clean_poses(RAW/f'{fid}_walk.png',2,4)
    target=275
    frames=[]
    for p in poses:
        scale=target/p.height
        tile=p.resize((round(p.width*scale),target),Image.Resampling.LANCZOS)
        # 얼굴 중심으로 수평 정렬한다. 내딛는 발의 위치로 정렬하면 몸이 좌우로 튄다.
        band=np.asarray(tile.getchannel('A'))[round(target*.08):round(target*.20)]
        _,xs=np.where(band>75)
        head=float(np.median(xs))
        frames.append((tile,head))
    half=max(max(head,t.width-head) for t,head in frames)
    width=int(np.ceil(half/2)*4+20)
    cells=[]
    for tile,head in frames:
        cell=Image.new('RGBA',(width,300))
        cell.alpha_composite(tile,(round(width/2-head),295-target))
        cells.append(cell)
    # 개별 걷기 그림도 같은 새 원화로 맞춘다. 도감·아틀라스 미지원 경로도 남성 기본 그림으로 돌아가지 않는다.
    individual=ROOT/'images/characters' if fid=='admiral' else ROOT/'images/characters'/fid
    for i,cell in enumerate(cells,1):
        existing=sorted(individual.glob(f'walk_{i}.*'))
        path=existing[0] if existing else individual/f'walk_{i}.webp'
        save(cell,path,**({'lossless':True,'method':6} if path.suffix=='.webp' else {'optimize':True}))
    dest=ROOT/'images/characters'/fid/'motion'
    stride=Image.new('RGBA',(width*8,300))
    for i,cell in enumerate(cells):
        stride.alpha_composite(cell,(i*width,0))
    save(stride,dest/'stride_walk.webp',lossless=True,method=6)
    legacy=Image.new('RGBA',(width*7,300*7))
    # 기본 아틀라스는 49칸. 멈추면 발이 가까운 passing 자세를 고정한다.
    legacy.alpha_composite(cells[2],(0,0))
    for i in range(1,49):
        legacy.alpha_composite(cells[((i-1)*8//48)%8],((i%7)*width,(i//7)*300))
    save(legacy,dest/'walk.webp',lossless=True,method=6)
    preview=OUT/f'{fid}-walk.gif'
    bg=[]
    for cell in cells:
        im=Image.new('RGBA',cell.size,'#d6d2c8');im.alpha_composite(cell)
        bg.append(im.convert('RGB').quantize(colors=128))
    bg[0].save(preview,save_all=True,append_images=bg[1:],duration=100,loop=0)
    loop={'cols':8,'rows':1,'count':8,'cycles':1,'times':[i/8 for i in range(9)],'pose':[i/8 for i in range(9)],'baseHeight':300,'fixedScale':True,'lift':[0]*8}
    return {'idle':0,'walkStart':1,'walkCycles':1,'loops':{'walk':loop}}


def cutin(fid):
    fighter='main_admiral' if fid=='admiral' else fid
    revised=RAW/f'{fid}_cutin_handfix.png'
    path=revised if revised.exists() else RAW/f'{fid}_cutin.png'
    target=ROOT/'images/duel/cutins'/(fighter+'.gif')
    backup(target)
    target.parent.mkdir(parents=True,exist_ok=True)
    save_gif(target,make_frames(path))
    # 생성 원본은 별도로 보존하고 정지 사건샷도 바로 사용할 수 있게 둔다.
    painting=Image.open(path).convert('RGB')
    save(painting,ROOT/'images/duel/cutins/events-20261124'/(fighter+'.webp'),quality=94,method=6)


def patch_data(results):
    hm=ROOT/'js/data/heromotion.js';backup(hm)
    source=hm.read_text(encoding='utf-8')
    config=json.loads(source[source.index('= {')+2:source.rindex(';')])
    for fid,entry in results.items():
        if 'walking' not in entry: continue
        old=config.get(fid,{})
        old.update({k:v for k,v in entry['walking'].items() if k!='loops'})
        old.setdefault('loops',{}).update(entry['walking']['loops'])
        config[fid]=old
    hm.write_text('/* 제독 보행: 실제 이동 거리에 맞춰 발 디딤 순서대로 재생한다. */\nwindow.G = window.G || {};\nG.HERO_MOTION = '+json.dumps(config,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8',newline='\n')
    path=ROOT/'js/data/duelart.js';backup(path)
    source=path.read_text(encoding='utf-8')
    for start,end,key in [('// CONTACT_BEGIN','// CONTACT_END','contact'),('// FALL_GEOMETRY_BEGIN','// FALL_GEOMETRY_END','geometry')]:
        lo,hi=source.index(start),source.index(end)
        block=source[lo:hi]
        for fid,entry in results.items():
            if 'combat' not in entry:continue
            data=entry['combat'];fighter=data['fighter']
            line='      '+json.dumps(fighter)+': '+json.dumps(data[key],separators=(',',':'))
            pattern=r'^      "'+re.escape(fighter)+r'": .*?(,?)$'
            block,n=re.subn(pattern,lambda m:line+m[1],block,flags=re.M)
            if not n:
                pos=block.rfind('\n    },')
                block=block[:pos].rstrip()+',\n'+line+block[pos:]
        source=source[:lo]+block+source[hi:]
    # 새 컷인은 모두 오른쪽으로 공격한다. 종전 그림의 왼쪽 방향 표시는 해제한다.
    updated={entry['combat']['fighter'] for entry in results.values() if 'combat' in entry}
    source=re.sub(r'cutinFaceLeft: \[(.*?)\]',lambda m:'cutinFaceLeft: ['+', '.join(repr(fid) for fid in re.findall(r"'([^']+)'",m[1]) if fid not in updated)+']',source,flags=re.S)
    path.write_text(source,encoding='utf-8',newline='\n')


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('ids',nargs='*')
    parser.add_argument('--partial',action='store_true',help='완성된 원화만 포장한다')
    parser.add_argument('--kind',choices=['walking','combat','cutin'],help='지정한 종류만 다시 포장한다')
    args=parser.parse_args()
    OUT.mkdir(parents=True,exist_ok=True)
    report_path=OUT/'install-report.json'
    results=json.loads(report_path.read_text(encoding='utf-8')) if report_path.exists() else {}
    failures=[]
    for fid in args.ids or IDS:
        entry=results.setdefault(fid,{})
        for name,required,fn in [('walking',['walk'],walking),('combat',['atk','react'],combat),('cutin',['cutin'],cutin)]:
            if args.kind and args.kind!=name:continue
            if not all((RAW/f'{fid}_{kind}.png').exists() for kind in required):
                if not args.partial:failures.append(f'{fid} {name}: 원화 없음')
                continue
            try:
                entry[name]=fn(fid) or True
                print(fid,name,'완료',flush=True)
            except (ValueError,OSError) as ex:
                failures.append(f'{fid} {name}: {ex}')
    patch_data(results)
    report_path.write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    (OUT/'install-errors.json').write_text(json.dumps(failures,ensure_ascii=False,indent=2),encoding='utf-8')
    if failures:
        print('\n'.join(failures),file=sys.stderr)
        raise SystemExit(1)


if __name__=='__main__':
    main()
