"""간체(zh-Hans)에서 번체(zh-Hant)를 만든다 — python tools/i18n/make_hant.py  (그다음 python tools/i18n/build_lang.py zh-Hant)

· OpenCC s2twp(대만 정체자 · 낱말까지)로 바꾼다: pip install opencc-python-reimplemented
· 한국 지명은 tools/i18n/korean_places.tsv 의 繁體 열을 따른다 (한국 지명 원칙 — 2026-11-12 사용자 지시)
· 고쳐 쓸 낱말: tools/i18n/zh-Hant/_fix.tsv (바뀐 글<TAB>바랄 글) — 손으로 고칠 것은 여기에만 (나머지 zh-Hant/*.tsv 는 이 스크립트가 덮어쓴다)
· tsv 의 원문(한국어) 열은 그대로, 번역 열만 바꾼다. person_*.tsv 는 셋째 열."""
import os, glob, re, sys
from opencc import OpenCC
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'zh-Hans'), os.path.join(HERE, 'zh-Hant')
os.makedirs(DST, exist_ok=True)
cc = OpenCC('s2twp')
FIX = []
for line in open(os.path.join(HERE, 'korean_places.tsv'), encoding='utf-8'):
    if line.startswith('#') or '\t' not in line: continue
    c = line.rstrip('\n').split('\t')
    if len(c) >= 4 and c[2] and c[3]: FIX.append((cc.convert(c[2]), c[3]))
fx = os.path.join(DST, '_fix.tsv')
if os.path.exists(fx):
    for line in open(fx, encoding='utf-8'):
        if '\t' in line and not line.startswith('#'):
            a, b = line.rstrip('\n').split('\t', 1); FIX.append((a, b))
FIX.sort(key=lambda p: -len(p[0]))
def conv(s):
    t = cc.convert(s)
    for a, b in FIX:
        if a and a != b: t = t.replace(a, b)
    return t
n = 0
for f in sorted(glob.glob(os.path.join(SRC, '*.tsv'))):
    base = os.path.basename(f); out = []
    for line in open(f, encoding='utf-8').read().split('\n'):
        if '\t' not in line: out.append(line); continue
        c = line.split('\t')
        if base.startswith('person_') and len(c) >= 3: c[2] = conv(c[2])
        elif base in ('_city.tsv', '_good.tsv') or len(c) == 2: c[1] = conv(c[1])
        else: c[-1] = conv(c[-1])
        out.append('\t'.join(c)); n += 1
    open(os.path.join(DST, base), 'w', encoding='utf-8').write('\n'.join(out))
h = os.path.join(SRC, 'help.html')
if os.path.exists(h): open(os.path.join(DST, 'help.html'), 'w', encoding='utf-8').write(conv(open(h, encoding='utf-8').read()))
gb = os.path.join(HERE, '..', '..', 'docs', 'guidebook.zh-Hans.md')   # 가이드북 원고도 번체로 (2026-11-13)
if os.path.exists(gb):
    t = conv(open(gb, encoding='utf-8').read()).replace('簡體中文稿', '繁體中文稿')
    open(os.path.join(HERE, '..', '..', 'docs', 'guidebook.zh-Hant.md'), 'w', encoding='utf-8').write(t)
for flag in ('_ready',):
    if os.path.exists(os.path.join(SRC, flag)) and not os.path.exists(os.path.join(DST, flag)): open(os.path.join(DST, flag), 'w').close()
print('zh-Hant rows', n, 'fix', len(FIX))
pj = os.path.join(SRC, '_pjoin.json')   # 사람 이름 잇는 법은 그대로 옮긴다
if os.path.exists(pj): open(os.path.join(DST, '_pjoin.json'), 'w', encoding='utf-8').write(open(pj, encoding='utf-8').read())
