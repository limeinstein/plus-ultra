"""공주·이야기 인물·마녀의 8단계 보행 시트를 게임과 배포 파일에 등록한다."""
import argparse
import hashlib
import json
import re
import shutil
import zipfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
from package_pirate_island_art_20261107 import split_sprites

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'artifacts/fairy-witch-walks-20261107'
PLAN=ROOT/'tools/fairy_witch_walks_20261107_prompts.json'
FW,FH=380,444


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--partial',action='store_true')
    args=parser.parse_args()
    plan=json.loads(PLAN.read_text(encoding='utf-8'))
    generated={p.stem:json.loads(p.read_text(encoding='utf-8')) for p in (ART/'generated').glob('*.json')}
    missing=[r['id'] for r in plan['characters'] if r['id'] not in generated]
    if missing and not args.partial:
        raise ValueError('원화가 필요합니다: '+', '.join(missing))
    (ART/'sources').mkdir(parents=True,exist_ok=True)
    (ART/'sheets').mkdir(parents=True,exist_ok=True)
    (ROOT/'docs/art').mkdir(parents=True,exist_ok=True)
    checks,registry,paths,animations=[],{}, {}, []
    for row in plan['characters']:
        ident=row['id']
        if ident not in generated:
            continue
        result=generated[ident]
        row.update({k:result[k] for k in ['source','prompt']})
        source=ART/'sources'/(ident+'.png')
        if Path(result['source']).is_file():
            shutil.copy2(result['source'],source)
        else:
            assert source.is_file(),ident+' 생성 원본이 없습니다'
        row['workspace_source']=source.relative_to(ROOT).as_posix()
        with Image.open(source) as raw:
            assert raw.mode=='RGBA',ident
            sprites=split_sprites(raw,4,2,separate_rows=True)
        boxes=[s.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox() for s in sprites]
        assert all(boxes),(ident,boxes)
        maxw=max(b[2]-b[0] for b in boxes)
        maxh=max(b[3]-b[1] for b in boxes)
        scale=min(352/maxw,424/maxh)
        sheet=Image.new('RGBA',(FW*4,FH*2))
        cells=[]
        for i,(sprite,box) in enumerate(zip(sprites,boxes)):
            body=sprite.crop(box)
            body=body.resize((round(body.width*scale),round(body.height*scale)),Image.Resampling.LANCZOS)
            cell=Image.new('RGBA',(FW,FH))
            cell.alpha_composite(body,((FW-body.width)//2,440-body.height))
            sheet.alpha_composite(cell,((i%4)*FW,(i//4)*FH))
            cells.append(cell)
        key=row['key']
        dest=ROOT/'images'/(key+'.webp');dest.parent.mkdir(parents=True,exist_ok=True)
        sheet.save(dest,'WEBP',quality=94,method=4,exact=True)
        png=ART/'sheets'/(ident+'_walk.png');sheet.save(png,optimize=True)
        spec={'id':ident,'name':row['name'],'key':key,'image':ident+'_walk.png','columns':4,'rows':2,'frames':8,'frameWidth':FW,'frameHeight':FH,'direction':'right',
              'rects':[[i%4*FW,i//4*FH,FW,FH] for i in range(8)]}
        registry[ident]=spec
        (ART/'sheets'/(ident+'_walk.json')).write_text(json.dumps(spec,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        hashes=[hashlib.sha256(c.tobytes()).hexdigest() for c in cells]
        feet=[c.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox()[3] for c in cells]
        heights=[b[3]-b[1] for b in boxes]
        with Image.open(dest) as saved:
            saved.load();hist=saved.getchannel('A').histogram()
            clear=sum(hist[:9])/(saved.width*saved.height)
            solid=sum(hist[220:])/(saved.width*saved.height)
            assert saved.size==(1520,888) and clear>.03 and solid>.04,(ident,clear,solid)
        assert len(set(hashes))>=6,(ident,'보행 자세가 반복됩니다')
        assert max(feet)-min(feet)<=2,(ident,feet)
        check={'id':ident,'name':row['name'],'key':key,'file':dest.relative_to(ROOT).as_posix(),'size':[1520,888],
               'clear':clear,'solid':solid,'uniqueFrames':len(set(hashes)),'feet':feet,'sourceHeights':heights,
               'sourceHeightRatio':round(max(heights)/min(heights),4),'sharedScale':scale,'frameHashes':hashes}
        checks.append(check)
        paths[key]=dest.relative_to(ROOT/'images').as_posix()
        animations.append((row,cells))
        print(ident+' 8단계 저장')
    manifest_path=ROOT/'images/manifest.js'
    text=manifest_path.read_text(encoding='utf-8')
    match=re.search(r'G\.IMAGE_FILES = (\{[\s\S]*?\});',text)
    files=json.loads(match.group(1));files.update(paths)
    manifest_path.write_text(text[:match.start()]+'G.IMAGE_FILES = '+json.dumps(dict(sorted(files.items())),ensure_ascii=False,indent=2)+';'+text[match.end():],encoding='utf-8',newline='\n')
    (ROOT/'js/data/matewalks.js').write_text('/* 공주·이야기 인물·마녀 보행 — tools/package_fairy_witch_walks_20261107.py */\n(function (G) {\n  \'use strict\';\n  G.MATE_WALKS = '+json.dumps(registry,ensure_ascii=False,indent=2)+';\n})(window.G = window.G || {});\n',encoding='utf-8',newline='\n')
    (ART/'asset-checks.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    PLAN.write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',19)
    def preview(rows,name,cols=6):
        if not rows:return
        frames=[]
        for phase in range(8):
            frame=Image.new('RGB',(cols*240,((len(rows)+cols-1)//cols)*308),'#26323a')
            draw=ImageDraw.Draw(frame)
            for i,(row,cells) in enumerate(rows):
                x,y=i%cols*240,i//cols*308
                pic=ImageOps.contain(cells[phase],(232,276),Image.Resampling.LANCZOS)
                frame.paste(pic,(x+(240-pic.width)//2,y+276-pic.height),pic)
                label_font=font
                for size in range(19,13,-1):
                    label_font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',size)
                    if draw.textlength(row['name'],font=label_font)<=224:break
                draw.text((x+8,y+282),row['name'],font=label_font,fill='#f5e6c8')
            frames.append(frame)
        frames[0].save(ROOT/'docs/art'/(name+'.jpg'),quality=94)
        frames[0].save(ROOT/'docs/art'/(name+'.gif'),save_all=True,append_images=frames[1:],duration=125,loop=0,disposal=2)
    preview(animations,'fairy-witch-walks-20261107')
    preview([a for a in animations if a[0]['group']=='princess'],'fairy-princess-walks-20261107')
    preview([a for a in animations if a[0]['group']=='witch'],'witch-walks-20261107',5)
    readme='공주·이야기 인물·마녀 보행 시트\n\n4열 x 2줄, 시트 1520 x 888, 한 칸 380 x 444, 오른쪽 보행 8단계입니다.\n윗줄 왼쪽부터 1~4번, 아랫줄 왼쪽부터 5~8번입니다.\n왼쪽 보행은 좌우 반전으로 사용합니다.\nPNG·좌표 JSON: artifacts/fairy-witch-walks-20261107/sheets/\n게임용 WebP: images/characters/mates/<인물 ID>/walk.webp\n투명 배경, 인물마다 같은 배율, 발끝 바닥선 고정.\n미리보기 GIF는 8fps이며 실제 게임에서는 이동 거리에 맞춰 재생할 수 있습니다.\n내장 image_gen으로 기존 인물화를 참고해 제작했습니다.\n\n'+ '\n'.join(r['id']+' : '+r['name'] for r,_ in animations)+'\n'
    (ART/'README.txt').write_text(readme,encoding='utf-8')
    with zipfile.ZipFile(ART/'fairy-witch-walks-20261107.zip','w',zipfile.ZIP_DEFLATED) as archive:
        exports=list((ART/'sheets').glob('*'))+[PLAN,ART/'asset-checks.json',ART/'README.txt',ROOT/'js/data/matewalks.js']
        exports += [ROOT/r['file'] for r in checks]
        exports += [ROOT/'docs/art'/(n+'.gif') for n in ['fairy-witch-walks-20261107','fairy-princess-walks-20261107','witch-walks-20261107'] if (ROOT/'docs/art'/(n+'.gif')).is_file()]
        for path in exports:
            archive.write(path,path.relative_to(ROOT).as_posix())
    print(str(len(checks))+'명 / '+str(len(checks)*8)+'개 보행 자세 - 규격·투명도·발끝·자세 검사 통과')


if __name__=='__main__':
    main()
