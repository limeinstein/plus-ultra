import json, re
def load_list(path, src='A'):
    d = json.load(open(path))
    return [x['ko'] for x in d if x['src'] == src]
def tr_to_tsv(trfile, lst, tsvfile):
    rows = []
    for l in open(trfile, encoding='utf-8').read().split('\n'):
        if not l.strip(): continue
        parts = [p.strip() for p in l.split(' ⇒ ')]
        idx = int(parts[0])
        if len(parts) == 2: ko, en = lst[idx], parts[1]
        else: ko, en = parts[1], ' ⇒ '.join(parts[2:])
        rows.append((ko, en))
    with open(tsvfile, 'w', encoding='utf-8') as f:
        for ko, en in rows: f.write(ko.replace('\t', ' ') + '\t' + en + '\n')
    return len(rows)
TOK = re.compile(r'(#|@|\((?:[^()|]+\|)+[^()|]+\))')
def compile_row(ko, en):
    """→ ('text', ko, en) or ('pat', regex, repl)"""
    if ko.startswith('/') and ko.endswith('/'):
        return ('pat', '^' + ko[1:-1] + '$', en)
    ko = re.sub(r'\s+', ' ', ko).strip()
    parts = TOK.split(ko)
    if len(parts) == 1: return ('text', ko, en)
    rx, caps = '', []
    for p in parts:
        if p == '#': caps.append('#'); rx += r'([\d,.]+)'
        elif p == '@': caps.append('@'); rx += r'(.+?)'
        elif p.startswith('(') and '|' in p: rx += '(?:' + '|'.join(re.escape(x) for x in p[1:-1].split('|')) + ')'
        else: rx += re.escape(p)
    # 번역의 자리 표시: {n} 명시 · 아니면 # / @ 차례대로
    nums = [i + 1 for i, c in enumerate(caps) if c == '#']; names = [i + 1 for i, c in enumerate(caps) if c == '@']
    def ref(i): return '⟦$%d⟧' % i if caps[i - 1] == '@' else '$%d' % i
    out = re.sub(r'\{(\d+)\}', lambda m: '\x00%s\x00' % m.group(1), en)
    ni, mi = iter(nums), iter(names)
    def rep(m):
        t = m.group(0)
        try: return ref(next(ni) if t == '#' else next(mi))
        except StopIteration: return t
    out = re.sub(r'#|@', rep, out)
    out = re.sub(r'\x00(\d+)\x00', lambda m: ref(int(m.group(1))), out)
    return ('pat', '^' + rx + '$', out)

def lit_rows(trfile, lst):
    """코드 글자(리터럴) 번역 → (ko 틀, en) 줄들. {X:a/b} → @(a|b), {X} → @, \\f → 쪽마다 따로, 끝 공백 → 뒤에 이어지는 글(@)"""
    rows = []
    for l in open(trfile, encoding='utf-8').read().split('\n'):
        if not l.strip(): continue
        idx, en = l.split(' ⇒ ', 1); ko = lst[int(idx)]['ko']
        ko = ko.replace('\\f', '\f'); en = en.replace('\\f', '\f')
        kps, eps = ko.split('\f'), en.split('\f')
        if len(kps) != len(eps): kps, eps = [ko.replace('\f', ' ')], [en.replace('\f', ' ')]
        for k, e in zip(kps, eps):
            k = re.sub(r'\{[A-Za-z]+:([^/{}]+)/([^{}]+)\}', r'@(\1|\2)', k)
            k = re.sub(r'\{[A-Za-z]+\}', '@', k)
            if k.endswith(' ') and k.strip():
                k = k.rstrip() + ' @'; e = e.rstrip() + ' @'
            rows.append((k.strip(), e.strip()))
    return rows
