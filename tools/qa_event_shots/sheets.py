"""연출 QA 모아보기 — python3 sheets.py shots.json [shots2.json …] → sheets/<사건>.jpg + sheets/index.json
   사건마다 그 사건에서 처음 나온 장면만(다른 사건에서 이미 본 같은 글은 뺀다) 최대 16장, 4×4칸(칸 480×270) + 칸 아래 번호·종류·제목."""
import json, sys, os, hashlib
from PIL import Image, ImageDraw, ImageFont
D = os.environ.get('WORK', '/tmp/qa_event_shots'); SH = os.environ.get('SHOTS', D + '/shots'); OUT = os.environ.get('SHEETS', D + '/sheets')
os.makedirs(OUT, exist_ok=True)
try: FONT = ImageFont.truetype('/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc', 15)
except Exception:
    import glob; c = glob.glob('/usr/share/fonts/**/*CJK*.tt*', recursive=True); FONT = ImageFont.truetype(c[0], 15)
recs = []
for f in sys.argv[1:]: recs += json.load(open(f))
GENERIC = ('세상의 소식', '통합 명성', '공적록', '마을 사람', '사례금', '소문:', '「베파나」')
seen = set(); index = {}
for r in recs:
    shots = []
    for m in r.get('shots', []):
        if not m.get('file') or not os.path.exists(os.path.join(SH, m['file'])): continue
        key = hashlib.md5((m.get('text') or '')[:160].encode()).hexdigest()
        if key in seen: continue
        seen.add(key)
        if any(g in (m.get('text') or '')[:60] for g in GENERIC): continue
        shots.append(m)
    shots = shots[:int(os.environ.get('CAP', '16'))]
    if not shots: index[r['id']] = {'sheet': None, 'n': 0}; continue
    W, H, LH, C = 480, 270, 24, 4
    rows = (len(shots) + C - 1) // C
    img = Image.new('RGB', (C * W, rows * (H + LH)), (30, 30, 30)); d = ImageDraw.Draw(img)
    for i, m in enumerate(shots):
        x, y = (i % C) * W, (i // C) * (H + LH)
        im = Image.open(os.path.join(SH, m['file'])).convert('RGB').resize((W, H))
        img.paste(im, (x, y))
        cap = '%d %s %s' % (i, m.get('kind', ''), (m.get('title') or m.get('text') or '')[:34])
        d.text((x + 4, y + H + 3), cap, fill=(255, 255, 255), font=FONT)
    fn = r['id'] + '.jpg'; img.save(os.path.join(OUT, fn), quality=80)
    index[r['id']] = {'sheet': fn, 'n': len(shots), 'files': [m['file'] for m in shots],
                      'metrics': [{'i': i, 'kind': m.get('kind'), 'title': m.get('title'), 'text': (m.get('text') or '')[:200], 'imgs': m.get('imgs'), 'bgs': m.get('bgs'), 'canvases': m.get('canvases'), 'bad': m.get('bad'), 'overflow': m.get('overflow')} for i, m in enumerate(shots)],
                      'imgMiss': r.get('imgMiss'), 'imgFallback': r.get('imgFallback'), 'errors': r.get('errors'), 'fired': r.get('fired')}
json.dump(index, open(os.path.join(OUT, 'index.json'), 'w'), ensure_ascii=False, indent=1)
print(len(index), 'events,', sum(v['n'] for v in index.values()), 'shots,', sum(1 for v in index.values() if not v['n']), 'empty')
