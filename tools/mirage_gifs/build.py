"""신기루 50곳의 독립 원화를 기존 시네마틱 규격으로 변환한다."""
from pathlib import Path
import argparse
import html
import json
import sys
import zipfile
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / 'tools/ruin_gifs'))
import build_cinematic as cinematic
import build_v2
import sheets
import grid

ROWS = json.loads((HERE / 'items.json').read_text(encoding='utf-8'))
build_v2.KEEP_BOTTOM = 1.0  # 탑·다리의 끝과 원화 아래쪽을 모두 살린다.


def build(row):
    did = row['id']
    frames=grid.cells(ROOT/row['source'],build_v2.fit_whole)
    # 낮 장면 하나로 팔레트를 뽑으면 밤의 남색·노을의 붉은빛이 사라진다.
    # 전체 장면을 함께 줄여 공통 256색을 고른다.
    mosaic=Image.new('RGB',(576*4,256*4))
    for i,frame in enumerate(frames):
        mosaic.paste(frame,((i%4)*576,(i//4)*256))
    palette=mosaic.quantize(colors=256)
    encoded=[frame.quantize(palette=palette,dither=Image.Dither.FLOYDSTEINBERG) for frame in frames]
    destination=ROOT/'images/discoveries'/f'{did}.gif'
    destination.parent.mkdir(parents=True,exist_ok=True)
    encoded[0].save(destination,save_all=True,append_images=encoded[1:],duration=cinematic.DURATIONS,loop=0,disposal=1,optimize=True)
    end=ROOT/'images/discovery-ends'/f'{did}.jpg'
    end.parent.mkdir(parents=True,exist_ok=True)
    frames[-1].save(end,quality=92,optimize=True)
    sheets.build(did, force=True)
    print(f"완료 {did}: {destination.stat().st_size//1024} KB", flush=True)


def preview():
    art = ROOT/'docs/art'
    art.mkdir(parents=True, exist_ok=True)
    ready = [r for r in ROWS if (ROOT/'images/discoveries'/f"{r['id']}.gif").exists()]
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 17)
    contact = Image.new('RGB', (1440, ((len(ready)+4)//5)*160), '#eee5d5')
    draw = ImageDraw.Draw(contact)
    cards = []
    for i, row in enumerate(ready):
        did = row['id']
        with Image.open(ROOT/'images/discoveries'/f'{did}.gif') as gif:
            gif.seek(gif.n_frames-1)
            frame = gif.convert('RGB').resize((288,128), Image.Resampling.LANCZOS)
        x,y = (i%5)*288, (i//5)*160
        contact.paste(frame,(x,y))
        draw.text((x+5,y+132),row['name'][:20],font=font,fill='#302818')
        cards.append(f'<article><h2>{html.escape(row["name"])}</h2><img loading="lazy" width="576" height="256" src="../../images/discoveries/{did}.gif"><p>{html.escape(row["description"])}</p><a href="../../images/discoveries/{did}.gif" download>GIF 저장 · {did}</a></article>')
    if ready:
        contact.save(art/'mirage50-preview.jpg',quality=93)
    page = '<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>신기루 발견물 50 GIF</title><style>body{margin:28px;background:#192327;color:#f1eadb;font-family:system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px}article{background:#29373b;padding:16px;border-radius:12px}h1{font-size:28px}h2{font-size:18px}img{width:100%;height:auto}p{line-height:1.7}a{color:#e8ce9d}</style><h1>신기루 발견물 GIF · '+str(len(ready))+'/50</h1><p>수채화풍 시네마틱 · 576×256 · 16프레임 · 9.82초 반복</p><main>'+''.join(cards)+'</main></html>'
    (art/'mirage50-gallery.html').write_text(page,encoding='utf-8')


def package():
    target = ROOT/'artifacts/mirage50-gifs.zip'
    target.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as archive:
        cards=[]
        for row in ROWS:
            did=row['id']
            source=ROOT/'images/discoveries'/f'{did}.gif'
            archive.write(source, f'gifs/{did}.gif')
            cards.append(f'<article><h2>{html.escape(row["name"])}</h2><img loading="lazy" src="gifs/{did}.gif"><p>{html.escape(row["description"])}</p></article>')
        archive.writestr('index.html','<!doctype html><html lang="ko"><meta charset="utf-8"><title>신기루 발견물 50</title><style>body{background:#192327;color:#f1eadb;font-family:system-ui;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px}article{padding:16px;background:#29373b}img{width:100%}p{line-height:1.6}</style><h1>신기루 발견물 GIF 50개</h1><main>'+''.join(cards)+'</main></html>')
        archive.write(HERE/'items.json','items.json')
    print(f'묶음: {target}',flush=True)


if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--only',help='쉼표로 나눈 ID')
    parser.add_argument('--ready',action='store_true',help='새로 도착한 원화만 변환')
    parser.add_argument('--preview',action='store_true')
    parser.add_argument('--package',action='store_true')
    args=parser.parse_args()
    if not args.preview:
        for row in ROWS:
            if args.only and row['id'] not in args.only.split(','): continue
            source=ROOT/row['source']
            gif=ROOT/'images/discoveries'/f"{row['id']}.gif"
            if args.ready and (not source.exists() or (gif.exists() and gif.stat().st_mtime>=source.stat().st_mtime)): continue
            build(row)
    preview()
    if args.package: package()
