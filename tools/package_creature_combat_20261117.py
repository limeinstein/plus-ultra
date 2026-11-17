"""생물 전투 원화를 고정 칸 시트와 검토용 움직임으로 정리한다."""
import json
import shutil
import argparse
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'artifacts/creature-combat-20261117'
SOURCE = BASE / 'sources'
OUT = ROOT / 'images/creature-combat-20261117'


def build(split_duel=False):
    manifest = json.loads((BASE / 'prompts.json').read_text(encoding='utf-8'))
    OUT.mkdir(parents=True, exist_ok=True)
    preview = Image.new('RGB', (1024, 320*((len(manifest)+3)//4)), '#242c32')
    draw = ImageDraw.Draw(preview)
    for i, entry in enumerate(manifest):
        ident, kind = entry['id'], entry['type']
        im = Image.open(SOURCE / (ident + '.png')).convert('RGBA')
        cols, rows = (6, 4) if kind == 'duel' else (4, 2)
        sw, sh = round(im.width / cols), round(im.height / rows)
        frames = [im.crop((round(c*im.width/cols), round(r*im.height/rows), round((c+1)*im.width/cols), round((r+1)*im.height/rows))).resize((sw, sh), Image.Resampling.LANCZOS) for r in range(rows) for c in range(cols)]
        assert im.getchannel('A').getextrema()[0] == 0
        # 모든 칸에 같은 배율과 이동량을 적용해 동작 중 크기 변화와 발 미끄러짐을 막는다.
        boxes = [f.getchannel('A').point(lambda a: 255 if a > 16 else 0).getbbox() for f in frames]
        assert all(boxes), ident
        if kind == 'duel':
            cw, ch, oc, ort = 432, 304, 6, 4
            scale = min(256 / sw, 256 / sh)
            dx, dy = 37, 32
            pivot = [165, 278]
        else:
            cw, ch, oc, ort = 256, 256, 8, 1
            left, top = min(b[0] for b in boxes), min(b[1] for b in boxes)
            right, bottom = max(b[2] for b in boxes), max(b[3] for b in boxes)
            scale = min(232 / (right-left), 220 / (bottom-top))
            dx, dy = round(128 - (left+right)*scale/2), round(239-bottom*scale)
            pivot = [128, 239]
        if kind == 'duel' and split_duel:
            # 칸을 넘어간 칼끝·머리는 사각형으로 자르지 않고 원래 몸에 붙여 옮긴다.
            import numpy as np
            import duel_repack
            assert im.size == (1536, 1024), ident
            pixels = np.asarray(im)
            labels = duel_repack.split_frames(pixels, duel_repack.FULL)
            output, clipped = duel_repack.repack(pixels, labels, (cw, ch), pivot, duel_repack.FULL)
            assert clipped == 0, (ident, '프레임 밖으로 잘린 픽셀', clipped)
            assert np.count_nonzero(output[:, :, 3] > duel_repack.DUST) == np.count_nonzero(pixels[:, :, 3] > duel_repack.DUST), ident
            atlas = Image.fromarray(output)
            packed = [atlas.crop((c*cw, r*ch, (c+1)*cw, (r+1)*ch)) for r, c in duel_repack.FULL]
            for n, cell in enumerate(packed):
                box = cell.getchannel('A').getbbox()
                assert box and min(box[:2]) > 0 and box[2] < cw and box[3] < ch, (ident, n, box)
            entry['frameSplit'] = 'connected-pixels'
            entry['clippedPixels'] = clipped
        else:
            atlas = Image.new('RGBA', (cw*oc, ch*ort))
            packed = []
            for n, frame in enumerate(frames):
                cell = Image.new('RGBA', (cw, ch))
                frame = frame.resize((round(sw*scale), round(sh*scale)), Image.Resampling.LANCZOS)
                cell.paste(frame, (dx, dy))
                atlas.paste(cell, ((n % oc)*cw, (n // oc)*ch))
                packed.append(cell)
        dest = OUT / (ident + '.png')
        atlas.save(dest)
        entry.update(file=dest.relative_to(ROOT).as_posix(), cell=[cw, ch], columns=oc, rows=ort, pivot=pivot,
                     sourceSize=list(im.size), alphaExtrema=list(im.getchannel('A').getextrema()), frames=len(frames))
        sequence = ([18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14] if kind == 'duel' else list(range(8)))
        gif = []
        for n in sequence:
            bg = Image.new('RGBA', (cw, ch), '#242c32')
            bg.alpha_composite(packed[n])
            gif.append(bg.convert('RGB'))
        gif[0].save(BASE / (ident + '.gif'), save_all=True, append_images=gif[1:], duration=140, loop=0)
        thumb = packed[18 if kind == 'duel' else 0].copy()
        thumb.thumbnail((235, 260))
        x, y = (i % 4)*256, (i // 4)*320
        preview.paste(thumb, (x+(256-thumb.width)//2, y+20), thumb)
        draw.text((x+16, y+285), ident + ' / ' + kind, fill='white')
    preview.save(BASE / 'preview.jpg', quality=92)
    (BASE / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    shutil.make_archive(str(BASE / ('creature-combat-' + str(len(manifest)))), 'zip', OUT)
    print(json.dumps([{'id': e['id'], 'frames': e['frames'], 'cell': e['cell'], 'alpha': e['alphaExtrema']} for e in manifest], ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--batch', default='creature-combat-20261117')
    args = parser.parse_args()
    BASE = ROOT / 'artifacts' / args.batch
    SOURCE = BASE / 'sources'
    OUT = ROOT / 'images' / args.batch
    build()
