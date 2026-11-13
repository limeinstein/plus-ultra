import json, sys, re, glob, os
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from en_text import TEXT, PAT, NAMES
from tsv_tools import compile_row
TEXT = dict(TEXT)
TEXT[open(os.path.join(HERE, 'en', 'help.ko.html'), encoding='utf-8').read()] = open(os.path.join(HERE, 'en', 'help.en.html'), encoding='utf-8').read().strip()
pats = [list(p) for p in PAT]
PERSON = {}   # person_*.tsv: 묶음<TAB>한국어 조각<TAB>번역 — 게임이 지어 내는 사람 이름의 조각 (js/core/i18n.js personEn)
for f in sorted(glob.glob(os.path.join(HERE, 'en', '*.tsv'))):
    for line in open(f, encoding='utf-8').read().split('\n'):
        if not line.strip() or '\t' not in line: continue
        if os.path.basename(f).startswith('person_'):
            g, ko, en = line.split('\t')[:3]
            PERSON.setdefault(g.strip(), {}).setdefault(ko.strip(), en.strip()); continue
        ko, en = line.split('\t', 1)
        if os.path.basename(f).startswith('names_'):   # names_*.tsv: 고유 이름 (G.N이 찾는 표) — 배·동료·발견물·물건·후원자·책
            NAMES.setdefault(re.sub(r'\s+', ' ', ko).strip(), en.strip()); continue
        kind, a, b = compile_row(ko, en.replace('\\n', '\n'))   # 번역의 줄바꿈은 \n 으로 적는다
        if kind == 'text': TEXT[a] = b
        else: pats.append([a, b])
# 틀 차례: 글자(붙잡지 않는 부분)가 많은 것부터 — 넓게 붙잡는 틀은 뒤로
def lit(r): return len(re.sub(r'\((?!\?:)[^)]*\)', '', r).replace('\\', ''))
seen = set(); P2 = []
for p in sorted(pats, key=lambda p: -lit(p[0])):
    if p[0] in seen: continue
    seen.add(p[0]); P2.append(p)
for p in P2: re.compile(p[0])
def js(o): return json.dumps(o, ensure_ascii=False)
L = ["""/* English 번역 — js/core/i18n.js (G.I18N)
   text: 한국어 원문 → 영어 (화면 글자·대사·알림을 통째로 찾는다 · G.T의 틀도 여기에) · pat: 숫자·이름이 섞인 글의 틀 [정규식, 바꿀 글] (⟦$1⟧ = 이름이면 옮김)
   name: 사람·나라·지역·종교·언어·배·음식 같은 이름 · 도시·교역품 이름은 js/lang/en_names.js
   말투 기준: docs/번역_말투_영어.md — 대사는 그 사람의 입말로 (2026-11-12 사용자 요청)
   이 파일은 tools/i18n/build_en.py 가 만든다 — 고칠 때는 tools/i18n/en/*.tsv(원문<TAB>번역)·en_text.py 를 고치고 python tools/i18n/build_en.py
   새 글 찾기: node tools/i18n_missing.js en → 나온 목록을 tsv에 더한다 (틀: # 숫자 · @ 이름 · (을|를) 조사 · {n} 차례 · /정규식/) */
(function (G) {
  'use strict';
  G.I18N.add('en', {
    ready: true,
    text: {"""]
items = list(TEXT.items())
L += ['      %s: %s%s' % (js(k), js(v), ',' if i < len(items) - 1 else '') for i, (k, v) in enumerate(items)]
L.append('    },\n    pat: [')
L += ['      [%s, %s]%s' % (js(a), js(b), ',' if i < len(P2) - 1 else '') for i, (a, b) in enumerate(P2)]
L.append('    ],\n    name: {')
items = list(NAMES.items())
L += ['      %s: %s%s' % (js(k), js(v), ',' if i < len(items) - 1 else '') for i, (k, v) in enumerate(items)]
L.append('    },\n    person: {')
items = list(PERSON.items())
L += ['      %s: %s%s' % (js(k), js(v), ',' if i < len(items) - 1 else '') for i, (k, v) in enumerate(items)]
L.append('    }\n  });\n})(window.G = window.G || {});\n')
open(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', '..', 'js', 'lang', 'en.js'), 'w', encoding='utf-8').write('\n'.join(L))
print('text', len(TEXT), 'pat', len(P2), 'name', len(NAMES), 'person', sum(len(v) for v in PERSON.values()))
