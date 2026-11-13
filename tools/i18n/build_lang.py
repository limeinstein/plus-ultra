"""영어 밖의 언어 파일을 만든다 — python tools/i18n/build_lang.py zh-Hans  (→ js/lang/zh-Hans.js)

tools/i18n/<언어>/ 아래의 tsv를 읽는다 (영어판 tools/i18n/en/ 과 같은 꼴 — 한 줄에 「한국어 원문<TAB>번역」):
  · *.tsv            사전(text)·틀(pat) — 틀: # 숫자 · @ 이름 · (을|를) 조사 · {n} 차례 · {n:lc} 소문자 · /정규식/ 그대로 (tsv_tools.compile_row)
  · names_*.tsv      고유 이름 (G.N이 찾는 표)
  · person_*.tsv     묶음<TAB>한국어 조각<TAB>번역 — 게임이 지어 내는 사람 이름
  · _city.tsv        도시 번호<TAB>이름 · _good.tsv 교역품 id<TAB>이름
  · help.html        타이틀 「조작 안내」 본문 (원문은 en/help.ko.html)
  · _ready           있으면 ready: true (고를 수 있다)
  · _pjoin.json      지어 낸 사람 이름 잇는 법 {gs, sf, combo, num} — 중국어는 「安东尼奥·班德拉斯」「宋康昊」「若昂二世」
번체(zh-Hant)는 tools/i18n/make_hant.py 가 간체(zh-Hans)에서 바꿔 만든다."""
import json, sys, re, glob, os
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from tsv_tools import compile_row

LANG = sys.argv[1] if len(sys.argv) > 1 else 'zh-Hans'
SRC = os.path.join(HERE, LANG)
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, '..', '..', 'js', 'lang', LANG + '.js')
TEXT, pats, NAMES, PERSON, CITY, GOOD = {}, [], {}, {}, {}, {}
hk = os.path.join(HERE, 'en', 'help.ko.html'); hl = os.path.join(SRC, 'help.html')
if os.path.exists(hl): TEXT[open(hk, encoding='utf-8').read()] = open(hl, encoding='utf-8').read().strip()
for f in sorted(glob.glob(os.path.join(SRC, '*.tsv'))):
    base = os.path.basename(f)
    for line in open(f, encoding='utf-8').read().split('\n'):
        if not line.strip() or '\t' not in line or line.startswith('#\t'): continue
        if base.startswith('person_'):
            g, ko, tr = line.split('\t')[:3]
            PERSON.setdefault(g.strip(), {}).setdefault(ko.strip(), tr.strip()); continue
        ko, tr = line.split('\t', 1)
        if base == '_city.tsv': CITY[int(ko)] = tr.strip(); continue
        if base == '_good.tsv': GOOD[ko.strip()] = tr.strip(); continue
        if base.startswith('names_'):
            NAMES.setdefault(re.sub(r'\s+', ' ', ko).strip(), tr.strip()); continue
        kind, a, b = compile_row(ko, tr.replace('\\n', '\n'))
        if kind == 'text': TEXT[a] = b
        else: pats.append([a, b])
def lit(r): return len(re.sub(r'\((?!\?:)[^)]*\)', '', r).replace('\\', ''))
seen = set(); P2 = []
for p in sorted(pats, key=lambda p: -lit(p[0])):
    if p[0] in seen: continue
    seen.add(p[0]); P2.append(p)
for p in P2: re.compile(p[0])
def js(o): return json.dumps(o, ensure_ascii=False)
ready = os.path.exists(os.path.join(SRC, '_ready'))
L = ["""/* %s 번역 — js/core/i18n.js (G.I18N)
   이 파일은 tools/i18n/build_lang.py 가 만든다 — 고칠 때는 tools/i18n/%s/*.tsv(원문<TAB>번역)를 고치고 python tools/i18n/build_lang.py %s
   (번체 zh-Hant 는 python tools/i18n/make_hant.py 로 간체에서 먼저 바꾼 뒤 만든다) */
(function (G) {
  'use strict';
  G.I18N.add(%s, {
    ready: %s,""" % (LANG, LANG, LANG, js(LANG), 'true' if ready else 'false')]
pj = os.path.join(SRC, '_pjoin.json')   # 지어 낸 사람 이름 잇는 법 (i18n.js PJ)
if os.path.exists(pj): L.append('    pjoin: %s,' % js(json.load(open(pj, encoding='utf-8'))))
def block(name, items, last=False):
    L.append('    %s: {' % name)
    items = list(items)
    L.extend('      %s: %s%s' % (js(k), js(v), ',' if i < len(items) - 1 else '') for i, (k, v) in enumerate(items))
    L.append('    }' + ('' if last else ','))
block('text', TEXT.items())
L.append('    pat: [')
L.extend('      [%s, %s]%s' % (js(a), js(b), ',' if i < len(P2) - 1 else '') for i, (a, b) in enumerate(P2))
L.append('    ],')
block('city', sorted(CITY.items()))
block('good', GOOD.items())
block('name', NAMES.items())
block('person', PERSON.items(), True)
L.append('  });\n})(window.G = window.G || {});\n')
open(OUT, 'w', encoding='utf-8').write('\n'.join(L))
print(LANG, 'ready' if ready else 'not ready', 'text', len(TEXT), 'pat', len(P2), 'city', len(CITY), 'good', len(GOOD), 'name', len(NAMES), 'person', sum(len(v) for v in PERSON.values()))
