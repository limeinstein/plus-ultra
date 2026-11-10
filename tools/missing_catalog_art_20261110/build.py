"""막야 아이템과 민족 발견 장면 18종을 게임에 연결한다."""
from pathlib import Path
import argparse
import html
import json
import math
import shutil
from PIL import Image, ImageDraw, ImageEnhance, ImageFont, ImageOps

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / 'artifacts/missing-catalog-art-20261110'
SUBJECTS = json.loads((HERE / 'subjects.json').read_text(encoding='utf-8'))
RECEIPTS = json.loads((HERE / 'receipts.json').read_text(encoding='utf-8'))
W, H = 576, 256


def movie(master):
    frames = []
    for i in range(18):
        t = i / 17
        zoom = 1 + .035 * math.sin(t * math.pi) ** 2
        cw, ch = round(master.width / zoom), round(master.height / zoom)
        # 확대 정점의 두 장면도 같은 칸을 반복하지 않도록 카메라를 조금씩 옆으로 옮긴다.
        x, y = round((master.width - cw) * (.15 + .70 * t)), (master.height - ch) // 2
        frame = master.crop((x, y, x + cw, y + ch)).resize((W, H), Image.Resampling.LANCZOS)
        frame = ImageEnhance.Brightness(frame).enhance(.9 + .1 * min(1, t * 5))
        frames.append(frame)
    return frames


def build(did):
    source = HERE / 'sources' / f'{did}.png'
    source.parent.mkdir(exist_ok=True)
    if not source.exists():
        shutil.copy2(RECEIPTS[did]['source'], source)
    original = ImageOps.exif_transpose(Image.open(source))
    if did == 'moye':
        item = original.convert('RGBA')
        assert item.getchannel('A').getextrema()[0] == 0, '투명 배경이 필요합니다'
        item = item.crop(item.getchannel('A').getbbox())
        item = ImageOps.contain(item, (440, 440), Image.Resampling.LANCZOS)
        canvas = Image.new('RGBA', (512, 512))
        canvas.alpha_composite(item, ((512 - item.width) // 2, (512 - item.height) // 2))
        canvas.save(ROOT / 'images/items/moye.webp', 'WEBP', lossless=True, method=6)
        return
    master = ImageOps.fit(original.convert('RGB'), (1440, 640), Image.Resampling.LANCZOS)
    for folder in ('discovery-ends', 'discoveries', 'discovery-sheets'):
        (ROOT / 'images' / folder).mkdir(exist_ok=True)
    # 고해상도 정지 장면도 따로 남겨 발견 카드·그림 출처에서 쓸 수 있게 한다.
    master.save(ROOT / f'images/discovery-ends/{did}.jpg', quality=95, optimize=True)
    frames = movie(master)
    atlas = Image.new('RGB', (W * 6, H * 3))
    for i, frame in enumerate(frames):
        atlas.paste(frame, ((i % 6) * W, (i // 6) * H))
    atlas.save(ROOT / f'images/discovery-sheets/{did}.webp', 'WEBP', quality=90, method=6)
    palette = atlas.convert('P', palette=Image.Palette.ADAPTIVE, colors=256)
    encoded = [frame.quantize(palette=palette, dither=Image.Dither.FLOYDSTEINBERG) for frame in frames]
    encoded[0].save(ROOT / f'images/discoveries/{did}.gif', save_all=True, append_images=encoded[1:],
                    duration=[460] * 17 + [580], loop=0, disposal=1, optimize=True)


def report():
    OUT.mkdir(parents=True, exist_ok=True)
    font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 21)
    board = Image.new('RGB', (1728, 6 * 290), '#151b23')
    d = ImageDraw.Draw(board)
    for i, row in enumerate(SUBJECTS):
        im = Image.open(ROOT / f'images/discovery-ends/{row["id"]}.jpg').resize((576, 256), Image.Resampling.LANCZOS)
        x, y = (i % 3) * 576, (i // 3) * 290
        board.paste(im, (x, y)); d.text((x + 10, y + 260), row['name'], font=font, fill='white')
    board.save(OUT / 'discoveries-preview.jpg', quality=94)
    small = Image.new('RGB', (1728, 580), '#151b23'); sd = ImageDraw.Draw(small)
    keys = ['folk_tibet', 'folk_miao', 'folk_buyei', 'folk_mnong', 'folk_samoa', 'folk_rapanui']
    names = {r['id']: r['name'] for r in SUBJECTS}
    for i, key in enumerate(keys):
        x, y = (i % 3) * 576, (i // 3) * 290
        small.paste(Image.open(ROOT / f'images/discovery-ends/{key}.jpg').resize((576, 256)), (x, y))
        sd.text((x + 10, y + 260), names[key], font=font, fill='white')
    small.save(OUT / 'preview.jpg', quality=94)
    e = html.escape
    parts = ['<!doctype html><html lang="ko"><meta charset="utf-8"><title>누락 아이템·발견 장면 보완</title><style>body{background:#151b23;color:#eee;font:16px/1.7 Malgun Gothic,sans-serif;margin:24px}a{color:#9fd3ff}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(450px,1fr));gap:18px}section{padding:14px;border:1px solid #515b69}img{max-width:100%;height:auto}h2{margin:0 0 8px}</style>',
             '<h1>막야·민족 발견 장면 18종·혼인 업적 그림</h1><p>2026-11-10 · 내장 이미지 생성기로 새 원화 19장을 제작했다. 민족 장면은 고해상도 정지 그림과 8.4초 완만한 확대 GIF·게임용 원색 장면 판을 함께 만든다. 혼인 업적은 기존 사건 그림을 도감에도 연결했다.</p>',
             '<p><a href="../../tools/missing_catalog_art_20261110/prompts.json">전체 제작 지시문</a> · <a href="../../tools/missing_catalog_art_20261110/subjects.json">발견물 이름·설명</a> · <a href="runtime-check.json">게임·도감 검사</a></p>',
             '<div class="grid"><section><h2>막야 · 공격력 42</h2><img style="width:320px;background:#101a29" src="../../images/items/moye.webp"></section><section><h2>Happily Ever After · 도감 연결</h2><img src="../../images/legend-events/happily_after_all.webp"></section>']
    for row in SUBJECTS:
        did = row['id']; parts += [f'<section><h2>{e(row["name"])}</h2><img loading="lazy" src="../../images/discovery-ends/{did}.jpg"><p>{e(row["description"])}</p><details><summary>발견 연출 GIF</summary><img loading="lazy" src="../../images/discoveries/{did}.gif"></details></section>']
    parts.append('</div></html>')
    (OUT / 'report.html').write_text('\n'.join(parts), encoding='utf-8')


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--only'); args = ap.parse_args()
    ids = args.only.split(',') if args.only else ['moye'] + [row['id'] for row in SUBJECTS]
    for i, did in enumerate(ids, 1):
        build(did); print(f'[{i}/{len(ids)}] {did}', flush=True)
    if not args.only:
        report()
