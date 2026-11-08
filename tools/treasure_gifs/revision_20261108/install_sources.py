"""15종의 원본을 보존하고 생성 원화·공개 작품 사진을 보물 제작 원화로 연결한다."""
from pathlib import Path
import hashlib
import json
import os
import shutil

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
RECEIPTS = json.loads((HERE / 'receipts.json').read_text(encoding='utf-8'))
if (HERE / 'receipts-phase2.json').exists():
    RECEIPTS.update(json.loads((HERE / 'receipts-phase2.json').read_text(encoding='utf-8')))
PAINTINGS = {'ghentaltar', 'earthlydelights', 'urbinovenus'}


def backup():
    records = {}
    profiles = json.loads((HERE.parent / 'profiles_20261108.json').read_text(encoding='utf-8'))
    for did in profiles:
        files = [f'tools/treasure_gifs/sources/{did}.png',
                 f'images/discoveries/{did}.gif', f'images/discovery-ends/{did}.jpg',
                 f'images/discovery-sheets/{did}.webp']
        for rel in files:
            src = ROOT / rel
            dst = HERE / 'before' / rel
            if not dst.exists():
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, dst)
            records[rel] = hashlib.sha256(dst.read_bytes()).hexdigest()
    (HERE / 'before-sha256.json').write_text(json.dumps(records, indent=2), encoding='utf-8')


def photograph(did, session):
    src = ImageOps.exif_transpose(Image.open(HERE / 'photos' / f'{did}.jpg')).convert('RGB')
    if did not in PAINTINGS:
        from rembg import remove
        cutout = HERE / 'photos' / f'{did}-cutout.png'
        if not cutout.exists():
            src.thumbnail((1600, 2400))
            result = remove(src, session=session, post_process_mask=True)
            result.save(cutout)
        subject = Image.open(cutout).convert('RGBA')
        subject = subject.crop(subject.getchannel('A').getbbox())
    else:
        # 작품의 검은 부분도 보존한다. 외곽은 원본 사진 그대로 사용한다.
        subject = src.convert('RGBA')
    panel = Image.new('RGB', (384, 512), 'black')
    size = (348, 454) if did not in PAINTINGS else (358, 444)
    art = ImageOps.contain(subject, size, Image.Resampling.LANCZOS)
    x, y = (384 - art.width) // 2, (512 - art.height) // 2
    if did in PAINTINGS:
        # 단순한 전시 테두리만 더하고 회화 내용은 바꾸지 않는다.
        d = ImageDraw.Draw(panel)
        d.rectangle((x - 5, y - 5, x + art.width + 4, y + art.height + 4), fill='#6c4c22')
        d.rectangle((x - 2, y - 2, x + art.width + 1, y + art.height + 1), fill='#c2a063')
    else:
        d = ImageDraw.Draw(panel)
        d.rectangle((x - 4, y + art.height, x + art.width + 4, y + art.height + 8), fill='#181512')
    panel.paste(art, (x, y), art)
    sheet = Image.new('RGB', (1536, 1024), 'black')
    # 단일 사진에서 뒷모습을 꾸며내지 않는다. 재생 시 조명·완만한 확대만 적용한다.
    for i in range(8):
        sheet.paste(panel, ((i % 4) * 384, (i // 4) * 512))
    return sheet


def main():
    backup()
    os.environ['U2NET_HOME'] = str(Path.home() / '.rembg' / 'models')
    from rembg import new_session
    session = new_session('u2net', providers=['CPUExecutionProvider'])
    for did, row in RECEIPTS.items():
        dest = ROOT / 'tools' / 'treasure_gifs' / 'sources' / f'{did}.png'
        if row['mode'] == 'generated':
            shutil.copy2(row['path'], dest)
        else:
            photograph(did, session).save(dest)
        print('원화 연결', did, flush=True)


if __name__ == '__main__':
    main()
