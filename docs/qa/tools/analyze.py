import json, os, collections, statistics, re
D = json.load(open('/home/claude/qa/assets/scan.json'))
F = D['files']; MAN = dict(D['manifest'])
ROOT = '/home/claude/pu_full/images/'
out = {}
def grp(f):
    p = f.split('/')
    if p[0] == 'portraits' and len(p) > 2: return '/'.join(p[:2])
    if p[0] in ('exterior-styles', 'interiors', 'duel', 'characters', 'effects', 'legend-events', 'achievement-events', 'maid-styles', 'street-folk', 'sprites', 'landwar') and len(p) > 2: return '/'.join(p[:2])
    return p[0]
byf = {r['f']: r for r in F}
# 1 해독 실패
out['decode_error'] = [(r['f'], r['err']) for r in F if 'err' in r]
# 2 매니페스트
files = set(byf)
man_missing = [(k, v) for k, v in MAN.items() if v not in files]
noext = {}
for f in files:
    noext.setdefault(re.sub(r'\.(webp|jpg|jpeg|png|gif)$', '', f), []).append(f)
in_man = set(MAN.values())
unreg = sorted(f for f in files if f not in in_man and not f.startswith('_extra/'))
out['manifest_missing_file'] = man_missing
out['unregistered_count'] = len(unreg)
out['unregistered_by_dir'] = collections.Counter(grp(f) for f in unreg).most_common(40)
out['unregistered_sample'] = unreg[:60]
# 3 크기 일관성 / 4 투명도 / 5 잘림 / 6 단색 / 7 흐림
G = collections.defaultdict(list)
for r in F:
    if 'err' in r or r['f'].startswith('_extra/'): continue
    G[grp(r['f'])].append(r)
dims, alpha, cut, blank, blur, huge, text = [], [], [], [], [], [], []
for g, L in G.items():
    if len(L) < 4: continue
    c = collections.Counter((r['w'], r['h']) for r in L)
    top, n = c.most_common(1)[0]
    if n / len(L) >= 0.6:
        for r in L:
            if (r['w'], r['h']) != top:
                # 비율이 같고 더 크면(고해상도) 문제 아님, 작거나 비율이 다르면
                ar1, ar2 = r['w'] / r['h'], top[0] / top[1]
                if abs(ar1 - ar2) > 0.03 or r['w'] < top[0]:
                    dims.append((g, r['f'], '%dx%d' % (r['w'], r['h']), 'dominant %dx%d (%d/%d)' % (top[0], top[1], n, len(L))))
    ac = sum(1 for r in L if r['transp'] > 0.02)
    if ac / len(L) >= 0.7:
        for r in L:
            if r['transp'] <= 0.02 and not r['f'].endswith('.gif'):
                alpha.append((g, r['f'], 'transp %.3f' % r['transp'], '%d/%d of folder are cutouts' % (ac, len(L))))
    for r in L:
        if r.get('edgeOpaque', 0) > 0.06 and r['transp'] > 0.25 and not g.startswith(('sprites', 'effects', 'duel', 'landwar', 'sea-monsters', 'ships-nav', 'chart', 'minigames')):
            cut.append((g, r['f'], 'edge opaque %.3f' % r['edgeOpaque']))
        if r.get('std', 99) < 8:
            blank.append((g, r['f'], 'std %.1f mean %.0f' % (r.get('std', 0), r.get('mean', 0))))
        if r['bytes'] > 3_000_000:
            huge.append((g, r['f'], '%.1fMB %dx%d' % (r['bytes'] / 1e6, r['w'], r['h'])))
    sh = [r['sharp'] for r in L if r.get('sharp')]
    if len(sh) >= 8:
        med = statistics.median(sh)
        for r in L:
            if r.get('sharp') is not None and r['sharp'] < med * 0.18 and max(r['w'], r['h']) >= 256:
                blur.append((g, r['f'], 'sharp %.0f vs median %.0f' % (r['sharp'], med)))
    be = [r.get('botEdge', 0) for r in L]
    if len(be) >= 8:
        m = statistics.median(be)
        for r in L:
            if r.get('botEdge', 0) > max(0.08, m * 4) and r['transp'] < 0.02:
                text.append((g, r['f'], 'bottom edge density %.3f vs %.3f' % (r['botEdge'], m)))
out['dims_outlier'] = dims; out['alpha_missing'] = alpha; out['cutoff'] = cut; out['blank'] = blank; out['blurry'] = blur; out['huge'] = huge; out['bottom_text_suspect'] = text
# 8 같은 바이트
by = collections.defaultdict(list)
for r in F:
    if 'sha1' in r: by[r['sha1']].append(r['f'])
out['exact_dup'] = [v for v in by.values() if len(v) > 1]
# 9 거의 같은 그림 (같은 갈래 안 · 해밍 ≤ 3)
def ham(a, b): return sum(x != y for x, y in zip(a, b))
near = []
for g in ('discoveries', 'discovery-ends', 'relics', 'items', 'goods', 'backgrounds', 'landmarks', 'foods', 'masterworks', 'portraits/mates', 'portraits/sponsors', 'portraits/history', 'portraits/legendary', 'portraits/rivals', 'figureheads', 'legend-events', 'events', 'achievement-events'):
    L = [r for r in G.get(g, []) if r.get('dh') and not r['f'].endswith('.gif') and '_half' not in r['f']]
    bands = collections.defaultdict(list)
    for r in L:
        for i in range(4): bands[(i, r['dh'][i * 16:(i + 1) * 16])].append(r)
    seen = set()
    for lst in bands.values():
        if len(lst) < 2 or len(lst) > 60: continue
        for i in range(len(lst)):
            for j in range(i + 1, len(lst)):
                a, b = lst[i], lst[j]
                k = tuple(sorted((a['f'], b['f'])))
                if k in seen or a.get('sha1') == b.get('sha1'): continue
                seen.add(k)
                if ham(a['dh'], b['dh']) <= 3: near.append((g, k[0], k[1], ham(a['dh'], b['dh'])))
out['near_dup'] = near
out['gif_count'] = sum(1 for r in F if r['f'].endswith('.gif'))
out['total_bytes'] = sum(r['bytes'] for r in F)
json.dump(out, open('/home/claude/qa/assets/analysis.json', 'w'), ensure_ascii=False, indent=1)
for k, v in out.items():
    print(k, len(v) if isinstance(v, list) else v)
