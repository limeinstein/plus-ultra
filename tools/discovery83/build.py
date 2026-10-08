"""새 발견물 83개의 원화를 기존 규격 GIF·마지막 장면·재생 판으로 굽는다."""
from pathlib import Path
import argparse
import importlib.util
import json
import sys
from PIL import Image, ImageDraw, ImageFont, ImageSequence

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / 'tools/ruin_gifs'))

def module(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

nature = module('nature83', 'tools/nature_gifs/build.py')
# 원화 속 해와 겹치는 두 번째 해·지형 앞 별을 만들지 않고 빛과 색만 바꾼다.
nature.sun_layer = lambda *args: Image.new('RGBA', (576, 256))
nature.night_layer = lambda *args: Image.new('RGBA', (576, 256))
ruin = module('ruin83', 'tools/ruin_gifs/build_v2.py')
ruin.KEEP_BOTTOM = 1.0
sheets = module('sheets83', 'tools/ruin_gifs/sheets.py')
ROWS = json.loads((HERE / 'prompts.json').read_text(encoding='utf-8'))

def source_cells(source):
    # 수채화 원화의 투명 가장자리를 종이 위에 얹는다. 알파를 버리면 색 잡음이 드러난다.
    with Image.open(source) as raw:
        src = Image.alpha_composite(Image.new('RGBA', raw.size, (244,236,216,255)), raw.convert('RGBA')).convert('RGB')
    frames = []
    for y in range(4):
        for x in range(4):
            box=(round(x*src.width/4)+3, round(y*src.height/4)+3,
                 round((x+1)*src.width/4)-3, round((y+1)*src.height/4)-3)
            frames.append(ruin.fit_whole(src.crop(box)))
    return frames

ruin.cells = source_cells

def people(row):
    # 전신·악기·손발이 잘리지 않게 전체 칸 맞춤을 쓴다.
    frames = source_cells(ROOT / row['source'])
    palette_image = Image.new('RGB', (576 * 4, 256 * 4))
    for i, frame in enumerate(frames):
        palette_image.paste(frame, ((i % 4)*576, (i // 4)*256))
    palette = palette_image.quantize(colors=128)
    encoded = [frame.quantize(palette=palette, dither=Image.Dither.FLOYDSTEINBERG) for frame in frames]
    durations = [430]*4 + [480]*8 + [1000]*3 + [1260]
    assert sum(durations) == 9820
    dest = ROOT / 'images/discoveries' / (row['id']+'.gif')
    encoded[0].save(dest, save_all=True, append_images=encoded[1:], duration=durations,
                    loop=0, disposal=1, optimize=True)
    return dest

def build(row):
    did = row['id']
    if row['category'] == 'nature':
        dest = nature.build_one(did)
    elif row['category'] == 'ruin':
        dest = ruin.build_one(did, ROOT / 'images/discoveries')
    else:
        dest = people(row)
    with Image.open(dest) as image:
        image.seek(image.n_frames-1)
        image.convert('RGB').save(ROOT / 'images/discovery-ends' / (did+'.jpg'), quality=90)
    sheets.build(did, force=True)
    print(f"완료 {did}: {dest.stat().st_size // 1024} KB", flush=True)

def preview():
    import html
    art = ROOT / 'docs/art'
    font_path = Path('C:/Windows/Fonts/malgun.ttf')
    font = ImageFont.truetype(str(font_path), 17) if font_path.exists() else ImageFont.load_default()
    cards = []
    for cat in ('nature','ruin','people'):
        chosen = [r for r in ROWS if r['category']==cat and (ROOT/'images/discoveries'/f"{r['id']}.gif").exists()]
        contact = Image.new('RGB', (1152, ((len(chosen)+3)//4)*158), '#eee4d0')
        draw = ImageDraw.Draw(contact)
        for i,row in enumerate(chosen):
            with Image.open(ROOT/'images/discoveries'/f"{row['id']}.gif") as im:
                im.seek(8 if cat in ('people','nature') else min(12,im.n_frames-1))
                frame = im.convert('RGB').resize((288,128), Image.Resampling.LANCZOS)
            x,y=(i%4)*288,(i//4)*158
            contact.paste(frame,(x,y))
            draw.text((x+5,y+132),row['name'][:21],font=font,fill='#302818')
            cards.append(f'<article><h2>{html.escape(row["name"])}</h2><img loading="lazy" width="576" height="256" src="../../images/discoveries/{row["id"]}.gif"><p>{html.escape(row["description"])}</p><a href="../../images/discoveries/{row["id"]}.gif">GIF 열기 · {row["id"]}</a></article>')
        if chosen:
            contact.save(art/f'discovery83-{cat}-preview.jpg',quality=92)
    (art/'discovery83-gallery.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><title>새 발견물 83개 GIF</title><style>body{margin:32px;background:#171e21;color:#f1eadb;font-family:system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:24px}article{background:#293236;padding:20px;border-radius:12px}h1{font-size:28px}h2{font-size:20px}img{width:100%;height:auto}p{line-height:1.7}a{color:#ecd298}</style><h1>새 발견물 83개 · 자연 30 / 유적 17 / 민족 36</h1><main>'+''.join(cards)+'</main></html>',encoding='utf-8')

if __name__ == '__main__':
    ap=argparse.ArgumentParser()
    ap.add_argument('--only', help='쉼표로 나눈 발견물 ID')
    ap.add_argument('--ready', action='store_true', help='원화가 도착한 항목만 제작')
    ap.add_argument('--preview', action='store_true', help='미리보기만 갱신')
    args=ap.parse_args()
    if not args.preview:
        rows=[r for r in ROWS if not args.only or r['id'] in args.only.split(',')]
        missing=[r['id'] for r in rows if not (ROOT/r['source']).exists()]
        if missing and not args.ready:
            raise SystemExit('없는 원화: '+', '.join(missing))
        for row in rows:
            source=ROOT/row['source']
            gif=ROOT/'images/discoveries'/f"{row['id']}.gif"
            if source.exists() and (not args.ready or not gif.exists() or source.stat().st_mtime>gif.stat().st_mtime):
                build(row)
    preview()
