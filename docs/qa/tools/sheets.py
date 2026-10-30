"""갈래별 모아보기 그림 — python3 sheets.py <repo> <outdir>
   번호 붙은 칸 60개(10×6)씩, 칸 아래 파일 이름. 투명한 곳은 바둑판 무늬. index.json 에 sheet → 파일 목록."""
import sys, os, json, math
from PIL import Image, ImageDraw, ImageFont
ROOT, OUT = sys.argv[1], sys.argv[2]
IMG = os.path.join(ROOT, 'images')
os.makedirs(OUT, exist_ok=True)
COLS, ROWS, TW, TH, LH = 10, 6, 176, 176, 30
try:
    FONT = ImageFont.truetype('/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc', 12)
except Exception:
    import glob
    c = glob.glob('/usr/share/fonts/**/*CJK*.tt*', recursive=True) + glob.glob('/usr/share/fonts/**/*Nanum*.ttf', recursive=True)
    FONT = ImageFont.truetype(c[0], 12) if c else ImageFont.load_default()
EXT = ('.webp', '.jpg', '.jpeg', '.png', '.gif')
SKIP = ('discovery-sheets/',)   # 동작 시트는 자동 검사로만

def checker(w, h):
    im = Image.new('RGB', (w, h), (205, 205, 205)); d = ImageDraw.Draw(im)
    for y in range(0, h, 12):
        for x in range(0, w, 12):
            if (x // 12 + y // 12) % 2: d.rectangle([x, y, x + 11, y + 11], fill=(235, 235, 235))
    return im
CH = checker(TW, TH)

def groups():
    files = []
    for dp, dn, fn in os.walk(IMG):
        for f in fn:
            if f.lower().endswith(EXT):
                rel = os.path.relpath(os.path.join(dp, f), IMG).replace(os.sep, '/')
                if rel.startswith(SKIP): continue
                # GIF는 같은 이름의 webp/png가 있으면 건너뛴다(같은 그림의 움직이는 판)
                if rel.lower().endswith('.gif'):
                    base = rel[:-4]
                    if any(os.path.exists(os.path.join(IMG, base + e)) for e in ('.webp', '.png', '.jpg')): continue
                files.append(rel)
    files.sort()
    g = {}
    for rel in files:
        parts = rel.split('/')
        key = '/'.join(parts[:2]) if parts[0] == 'portraits' and len(parts) > 2 else parts[0]
        g.setdefault(key, []).append(rel)
    return g

def make(name, lst):
    out = []
    per = COLS * ROWS
    for si in range(math.ceil(len(lst) / per)):
        chunk = lst[si * per:(si + 1) * per]
        sheet = Image.new('RGB', (COLS * TW, ROWS * (TH + LH)), (40, 40, 40)); d = ImageDraw.Draw(sheet)
        for i, rel in enumerate(chunk):
            x, y = (i % COLS) * TW, (i // COLS) * (TH + LH)
            try:
                im = Image.open(os.path.join(IMG, rel)); im.seek(0); im = im.convert('RGBA')
                im.thumbnail((TW - 4, TH - 4))
                cell = CH.copy(); cell.paste(im, ((TW - im.width) // 2, (TH - im.height) // 2), im)
            except Exception as e:
                cell = Image.new('RGB', (TW, TH), (180, 0, 0))
            sheet.paste(cell, (x, y))
            label = '%d %s' % (si * per + i, rel.split('/', 1)[1] if '/' in rel else rel)
            d.text((x + 3, y + TH + 1), label[:30], fill=(255, 255, 255), font=FONT)
            if len(label) > 30: d.text((x + 3, y + TH + 15), label[30:60], fill=(200, 200, 200), font=FONT)
        fn = '%s_%02d.jpg' % (name.replace('/', '__'), si)
        sheet.save(os.path.join(OUT, fn), quality=78)
        out.append({'sheet': fn, 'files': chunk, 'start': si * per})
    return out

if __name__ == '__main__':
    only = set(sys.argv[3:])
    g = groups(); index = {}
    for k in sorted(g):
        if only and k not in only: continue
        index[k] = make(k, g[k]); print(k, len(g[k]), len(index[k]), flush=True)
    json.dump(index, open(os.path.join(OUT, 'index.json'), 'w'), ensure_ascii=False, indent=0)
