#!/usr/bin/env python3
"""images 폴더를 훑어서 images/manifest.js 를 다시 만들고, 파일 이름이 게임 데이터와 맞는지 확인합니다.

사용법 (WebGame 폴더에서):
    python tools/images.py            # manifest.js 다시 만들기 + 점검 결과 출력
    python tools/images.py --list     # 쓸 수 있는 파일 이름을 모두 출력

파일 이름 규칙은 images/README.md 와 catalog.html(게임 도감)에 정리되어 있습니다.
"""
import json, os, re, sys, unicodedata

TOOLS = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(TOOLS)
IMG = os.path.join(ROOT, 'images')
EXTS = ('.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif')
TIMES = ('golden', 'dusk')
DISC_CATS = ['geo', 'nature', 'ruin', 'treasure', 'creature', 'people', 'trade']


def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()


def pairs(src, name):
    """[['id', '이름'], ...] 배열을 images.js 에서 읽기"""
    m = re.search(r'I\.' + name + r' = \[(.*?)\];', src, re.S)
    return re.findall(r"\['([^']+)', '([^']*)'\]", m.group(1)) if m else []


def game_data():
    """게임 데이터(js/data)에서 이름표를 읽는다. 브라우저 없이 쓰려고 정규식으로 읽는다."""
    d = {}
    d['cities'] = []
    for line in read('js/data/cities.js').splitlines():
        line = line.strip().rstrip(',')
        if line.startswith('{"id"'):
            d['cities'].append(json.loads(line))
    people = read('js/data/people.js')
    d['sponsors'] = [{'id': m[0], 'title': m[1], 'type': m[2], 'city': int(m[3]),
                      'holders': re.findall(r"\[(\d+), (\d+), '([^']*)'\]", m[4])}
                     for m in re.findall(r"\{ id: '(\w+)', title: '([^']*)', type: '(\w+)', city: (\d+),.*?holders: (\[\[.*?\]\]) \}", people, re.S)]
    d['mates'] = [{'id': m[0], 'name': m[1], 'g': m[2]} for m in re.findall(r"\{ id: '(\w+)', name: '([^']*)', g: '(\w)'", people)]
    d['maids'] = [{'id': m[0], 'city': int(m[1]), 'name': m[2]} for m in re.findall(r"\{ id: '(m_\w+)', city: (\d+), name: '([^']*)'", people)]
    disc = read('js/data/discoveries.js')
    d['discoveries'] = []
    for line in disc.splitlines():
        m = re.match(r"\s*add\('([^']+)', '([^']+)', '(\w+)'", line)
        t = re.match(r"\s*trade\('([^']+)', '([^']+)', '(\w+)'", line)
        if m:
            d['discoveries'].append({'id': m.group(1), 'name': m.group(2), 'cat': m.group(3)})
        elif t:
            d['discoveries'].append({'id': t.group(1), 'name': t.group(2), 'cat': 'trade'})
        r = re.search(r"rival: \[(\d+), (\d+), '([^']+)'\]", line)
        if r and d['discoveries']:
            d['discoveries'][-1]['rival'] = r.group(3)
    names = []
    for x in d['discoveries']:
        if x.get('rival') and x['rival'] not in names:
            names.append(x['rival'])
    d['rivals'] = names
    shipjs = read('js/data/ships.js')
    ships = shipjs[shipjs.index('G.SHIP_TYPES = ['):]
    d['ships'] = [{'id': m[0], 'name': m[1]} for m in re.findall(r"\{ id: '(\w+)', name: '([^']*)'", ships[:ships.index('\n  ];')])]
    imgjs = read('js/core/images.js')
    d['npcs'] = pairs(imgjs, 'NPCS')
    d['interiors'] = pairs(imgjs, 'INTERIORS')
    d['cultures'] = pairs(imgjs, 'CULTURES')
    d['styles'] = pairs(imgjs, 'STYLES')
    d['maidstyles'] = pairs(imgjs, 'MAIDSTYLES')
    d['extstyles'] = pairs(imgjs, 'EXTSTYLES')
    return d


def valid_keys(d):
    """게임이 찾는 모든 키 → 설명"""
    k = {'title': '타이틀 화면', 'characters/player': '거리를 걷는 제독'}
    cn = {c['id']: c['name'] for c in d['cities']}
    # 거리 배경 (항구/내륙, 변형은 뒤에 _a, _b … 를 붙인다)
    for c in d['cities']:
        k['backgrounds/%d' % c['id']] = '거리 배경 · %s' % c['name']
    for s, label in d['styles']:
        k['bg-styles/' + s] = '거리 배경 · %s 양식 공통' % label
        for sub, slab in (('_port', '항구'), ('_inland', '내륙')):
            k['bg-styles/' + s + sub] = '거리 배경 · %s %s' % (label, slab)
            for v in 'abcdefghijkl':
                k['bg-styles/%s%s_%s' % (s, sub, v)] = '거리 배경 · %s %s (%s)' % (label, slab, v)
    # 거리에서 보이는 건물 겉모습
    for kind, label in d['interiors']:
        k['exteriors/' + kind] = '건물 겉모습 · ' + label
        for cu, cl in d['cultures']:
            k['exteriors/%s_%s' % (kind, cu)] = '건물 겉모습 · %s (%s)' % (label, cl)
        for c in d['cities']:
            k['exteriors/%s@%d' % (kind, c['id'])] = '건물 겉모습 · %s (%s)' % (label, c['name'])
    for sp in d['sponsors']:
        for kind in ('palace', 'mansion'):
            k['exteriors/%s@%s' % (kind, sp['id'])] = '건물 겉모습 · %s' % sp['title']
    # 지역별 건물 겉모습 묶음
    for es, elab in d.get('extstyles', []):
        for kind, label in d['interiors']:
            k['exterior-styles/%s/%s' % (es, kind)] = '건물 겉모습 · %s (%s)' % (label, elab)
    for c in d['cities']:
        k['cities/%d' % c['id']] = '도시 풍경 · %s' % c['name']
        for t in TIMES:
            k['cities/%d_%s' % (c['id'], t)] = '도시 풍경(%s) · %s' % ('해질녘' if t == 'golden' else '저녁', c['name'])
    for s, label in d['styles']:
        k['city-styles/' + s] = '같은 양식 도시 공통 풍경 · ' + label
        for t in TIMES:
            k['city-styles/%s_%s' % (s, t)] = '같은 양식 도시 공통 풍경(%s) · %s' % ('해질녘' if t == 'golden' else '저녁', label)
    for kind, label in d['interiors']:
        k['interiors/' + kind] = '건물 내부 · ' + label
        for cu, cl in d['cultures']:
            k['interiors/%s_%s' % (kind, cu)] = '건물 내부 · %s (%s)' % (label, cl)
        for c in d['cities']:
            k['interiors/%s@%d' % (kind, c['id'])] = '건물 내부 · %s (%s)' % (label, c['name'])
    for sp in d['sponsors']:
        for kind in ('palace', 'mansion'):
            k['interiors/%s@%s' % (kind, sp['id'])] = '후원자 저택·왕궁 내부 · ' + sp['title']
    VAR = [('', ''), ('_f', ' 여자'), ('_m', ' 남자'), ('_2', ' 다른 얼굴 2'), ('_3', ' 다른 얼굴 3')]
    for nid, label in d['npcs']:
        for vs, vl in VAR:
            k['portraits/npc/' + nid + vs] = '마을 사람 · ' + label + vl
            for cu, cl in d['cultures']:
                k['portraits/npc/%s_%s%s' % (nid, cu, vs)] = '마을 사람 · %s (%s)%s' % (label, cl, vl)
        for c in d['cities']:
            k['portraits/npc/%s@%d' % (nid, c['id'])] = '마을 사람 · %s (%s)' % (label, c['name'])
    for m in d['mates']:
        k['portraits/mates/' + m['id']] = '동료 · ' + m['name']
    for m in d['maids']:
        k['portraits/maids/' + m['id']] = '여급 · %s (%s)' % (m['name'], cn.get(m['city'], '?'))
        k['portraits/maids/' + m['id'] + '_half'] = '여급 서 있는 모습 · %s (%s)' % (m['name'], cn.get(m['city'], '?'))
    for sid, label in d.get('maidstyles', []):
        k['maid-styles/' + sid] = '지역별 여급 흉상 · ' + label
        k['maid-styles/' + sid + '_half'] = '지역별 여급 서 있는 모습 · ' + label
        for n in range(1, 41):
            k['maid-styles/%s/%d' % (sid, n)] = '지역별 여급 흉상 · %s %d' % (label, n)
            k['maid-styles/%s/%d_half' % (sid, n)] = '지역별 여급 서 있는 모습 · %s %d' % (label, n)
    for sp in d['sponsors']:
        k['portraits/sponsors/' + sp['id']] = '후원자 · ' + sp['title']
        for i, h in enumerate(sp['holders']):
            k['portraits/sponsors/%s_%d' % (sp['id'], i + 1)] = '후원자 · %s — %s (%s~%s)' % (sp['title'], h[2], h[0], h[1])
    for r in d['rivals']:
        k['portraits/rivals/' + r] = '경쟁자 · ' + r
    for b, label in (('son', '아들'), ('daughter', '딸')):
        k['portraits/family/' + b] = '자녀 · ' + label
        for n in range(1, 7):
            k['portraits/family/%s_%d' % (b, n)] = '자녀 · %s %d' % (label, n)
    for x in d['discoveries']:
        k['discoveries/' + x['id']] = '발견물 · ' + x['name']
    for c in DISC_CATS:
        k['discovery-cats/' + c] = '발견물 분류 공통 · ' + c
    for s in d['ships']:
        k['ships/' + s['id']] = '배 · ' + s['name']
        k['ships-nav/' + s['id']] = '항해·해전 16방향 배 · ' + s['name']
    return k


def scan():
    found, dups = {}, []
    if not os.path.isdir(IMG):
        return found, dups
    for dirpath, dirnames, filenames in os.walk(IMG):
        dirnames[:] = sorted(d for d in dirnames if not d.startswith('_'))  # _extra 같은 보관 폴더는 건너뛴다
        for fn in sorted(filenames):
            ext = os.path.splitext(fn)[1]
            if ext.lower() not in EXTS:
                continue
            rel = os.path.relpath(os.path.join(dirpath, fn), IMG).replace(os.sep, '/')
            key = unicodedata.normalize('NFC', rel[:-len(ext)])
            if key in found:
                dups.append((key, found[key], rel))
                continue
            found[key] = unicodedata.normalize('NFC', rel)
    return found, dups


def write_manifest(found):
    body = ',\n'.join('  %s: %s' % (json.dumps(k, ensure_ascii=False), json.dumps(v, ensure_ascii=False)) for k, v in sorted(found.items()))
    text = ('/* 자동 생성 파일입니다. images 폴더에 그림을 넣은 뒤 WebGame 폴더에서 python tools/images.py 를 실행하면 다시 만들어집니다. */\n'
            'window.G = window.G || {};\nG.IMAGE_FILES = {\n' + body + ('\n' if body else '') + '};\n')
    os.makedirs(IMG, exist_ok=True)
    with open(os.path.join(IMG, 'manifest.js'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)


def is_valid(key, keys):
    return key in keys or key.startswith('portraits/player/') or key.startswith('landmarks/') or key.startswith('characters/')


def report(found, dups, keys):
    groups = [('타이틀', 'title'), ('거리 배경', 'backgrounds/'), ('거리 배경(공통)', 'bg-styles/'), ('건물 겉모습', 'exteriors/'), ('지역별 건물', 'exterior-styles/'),
              ('거리 볼거리', 'landmarks/'), ('제독 캐릭터', 'characters/'), ('도시 풍경', 'cities/'), ('양식 공통 풍경', 'city-styles/'), ('건물 내부', 'interiors/'),
              ('마을 사람', 'portraits/npc/'), ('동료', 'portraits/mates/'), ('여급', 'portraits/maids/'), ('지역별 여급', 'maid-styles/'), ('후원자', 'portraits/sponsors/'),
              ('경쟁자', 'portraits/rivals/'), ('제독(주인공)', 'portraits/player/'), ('자녀', 'portraits/family/'),
              ('발견물', 'discoveries/'), ('발견물 분류 공통', 'discovery-cats/'), ('배', 'ships/'), ('항해 배', 'ships-nav/')]
    print('그림 %d개 → images/manifest.js' % len(found))
    for label, pre in groups:
        n = sum(1 for k in found if k == pre or k.startswith(pre))
        if n:
            print('  %-10s %d' % (label, n))
    bad = [found[k] for k in sorted(found) if not is_valid(k, keys)]
    if bad:
        print('\n게임에서 찾지 않는 이름입니다. 철자나 번호를 확인하세요:')
        for b in bad:
            print('  images/' + b)
    for key, a, b in dups:
        print('\n같은 이름의 파일이 둘 있습니다. 하나만 남기세요: images/%s, images/%s' % (a, b))


def main():
    try:
        sys.stdout.reconfigure(errors='replace')
    except Exception:
        pass
    d = game_data()
    keys = valid_keys(d)
    if '--list' in sys.argv:
        for k in sorted(keys, key=lambda s: [int(t) if t.isdigit() else t for t in re.split(r'(\d+)', s)]):
            if '@' in k or re.search(r'_(golden|dusk)$', k):
                continue
            print('%-40s %s' % (k, keys[k]))
        print('\n(+ 도시별 버전 "@도시번호", 시간대 버전 "_golden"/"_dusk", 제독 얼굴 portraits/player/아무이름)')
        return
    found, dups = scan()
    write_manifest(found)
    report(found, dups, keys)


if __name__ == '__main__':
    main()
