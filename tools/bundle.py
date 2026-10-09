#!/usr/bin/env python3
"""게임을 파일 하나(PLUS_ULTRA.html)로 묶습니다. images 폴더의 교체 그림도 파일 안에 넣습니다.

사용법 (WebGame 폴더에서):
    python tools/bundle.py                      # PLUS_ULTRA.html 다시 만들기
    python tools/bundle.py --artifact 폴더       # Claude 아티팩트용 게임(game.html)·도감(catalog.html)도 만들기
                                                #   그림은 폴더/img/pack-NN-해시.js 묶음으로 따로 — 페이지를 열 때 읽지 않고, 그 묶음의 그림이 처음 필요할 때 읽는다
                                                #   (그래서 화면 크기에 맞는 큰 그림(slim.HQ)을 쓸 수 있다. 한도는 아티팩트 한 판 256MB 안에서 PACK_BUDGET)
                                                #   움직이는 그림(유적 GIF)은 묶음 대신 폴더/images/… 파일로 따로 (필요할 때만 읽힘)
                                                #   올릴 목록은 폴더/publish.json (packs = 올릴 묶음, files = 그림 파일, removed = 아티팩트에서 지울 옛 것)
    python tools/bundle.py --mark-published 폴더 # 아티팩트에 올린 뒤 '올린 목록'을 적어 둔다
    python tools/bundle.py --artifact 폴더 --scale 0.4   # 그림 배율을 이 값부터 시작 (한도를 넘을 걸 알 때 시간 절약)
"""
import json, os, sys

sys.dont_write_bytecode = True  # tools 폴더에 __pycache__ 를 만들지 않음
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import images as imgtool  # noqa: E402
import pages  # noqa: E402

ARTIFACT_LIMIT = 16 * 1024 * 1024      # 아티팩트 페이지 하나·텍스트 파일 하나의 한도 (16MiB)
PACK_BUDGET = 170 * 1000 * 1000        # (예전 값 — 지금은 아래 ARTIFACT_TOTAL로 한 판 전체를 잰다)
ARTIFACT_TOTAL = 248 * 1000 * 1000     # 아티팩트 한 판 합계 한도(256MB) 안에서: 페이지 + 그림 묶음 + 장면 판·움직이는 그림 + 음악
ARTIFACT_FILES = 500                   # 아티팩트 한 판 파일 수 한도(511) 안에서: 페이지 + 묶음 + 장면 판 + 음악
PACK_TARGET = int(float(os.environ.get('PACK_MB', '7')) * 1024 * 1024)   # 그림 묶음 파일 하나의 크기 (대략, MB는 PACK_MB로 바꿈 — 거리 마을 사람 등으로 파일 수가 늘어 5→7) — 작을수록 한 장면에서 덜 받지만 파일 수가 는다 (장면 판 370장과 합쳐 한 판 511개 안에서)


# 아티팩트 한 판(256MB·511개)에 넣지 않고 아티팩트의 자산 저장소(/_blob/…)에 원래 크기 그대로 올리는 그림 —
# 거리를 걷는 마을 사람 시트(20곳 × 14종, 칸 380×444): 줄이지 않고, 한 판 한도와 따로 센다.
# 올린 주소는 <아티팩트 폴더>/assets.json 에 적어 두고(그림이 그대로면 다시 올리지 않는다), 주소가 없는 그림은 게임이 코드 그림으로 그린다.
ASSET_PREFIXES = ('street-folk/', 'portraits/street-folk/')   # 걷는 그림 시트 · 같은 사람의 얼굴·무릎상(tools/street_faces.py, 520장 — 묶음에 넣으면 한 판 256MB를 넘는다)
# 한 판 파일 수(511)를 넘지 않게: 2026-10-08 신규 발견물 83곳의 장면 판(discovery-sheets)도 자산 저장소로 (목록 tools/discovery83/prompts.json).
# 도감(catalog.html)은 다른 아티팩트라 이 83곳은 장면 판 대신 그림 한 장으로 보인다.
def asset_extra():
    here = os.path.dirname(os.path.abspath(__file__))
    out = set()
    try:
        with open(os.path.join(here, 'discovery83', 'prompts.json'), encoding='utf-8') as f:
            out |= {'discovery-sheets/' + r['id'] for r in json.load(f)}
    except Exception:
        pass
    # 2026-10-09: 새 발견물 49곳의 장면 판도 자산 저장소로 — 한 판 파일 수·크기 한도 (목록 tools/artifact_sheet_assets.txt)
    try:
        with open(os.path.join(here, 'artifact_sheet_assets.txt'), encoding='utf-8') as f:
            out |= {'discovery-sheets/' + l.split('#')[0].strip() for l in f if l.split('#')[0].strip()}
    except OSError:
        pass
    return out
ASSET_MARK = '/*ASSET_URLS*/'

PACK_SMALL = int(1.5 * 1024 * 1024)               # 이보다 작은 묶음은 같은 갈래의 이웃 묶음과 합친다 (파일 수가 너무 늘지 않게 — 한 판 511개)

# 지역 여급 그림 묶음 → 그 그림을 쓰는 문화권 (js/core/images.js I.MAID_POOL)
MAID_CULTURE = {'westeurope': 'europe', 'iberia': 'europe', 'britain': 'europe', 'germany': 'europe', 'france': 'europe',
                'lowlands': 'europe', 'greece': 'europe', 'slav': 'europe', 'russia': 'europe', 'italy': 'europe',
                'arabia': 'islam', 'ottoman': 'islam', 'persia': 'islam', 'india': 'south', 'seasia': 'south',
                'china': 'eastasia', 'japan': 'eastasia', 'korea': 'eastasia', 'tropic': 'native', 'africa': 'native', 'native': 'native'}


def game_places():
    """게임 자료(도시·후원자·여급·동료·발견물의 자리)를 node로 읽는다 (tools/pack_groups.js). node가 없으면 None"""
    import subprocess
    try:
        r = subprocess.run(['node', os.path.join(pages.TOOLS, 'pack_groups.js')], capture_output=True, timeout=120, cwd=pages.ROOT)
        if r.returncode == 0:
            return json.loads(r.stdout.decode('utf-8'))
        print('pack_groups.js 실패 — 그림 묶음을 갈래별로만 나눕니다: ' + r.stderr.decode('utf-8', 'replace')[:300])
    except Exception as e:  # node 가 없음
        print('node를 찾지 못해 그림 묶음을 갈래별로만 나눕니다 (%s)' % e)
    return None


def pack_order(keys, places):
    """그림마다 (갈래, 차례)를 정한다 — 한 장면에서 같이 쓰이는 그림이 같은 묶음에 들어가도록.
    · geo:<지역>   도시마다: 거리 배경, 그 도시 전용 건물·건물 안·마을 사람, 그 도시 후원자·여급 (가까운 도시끼리 이어지게 줄 세움)
    · cul:<문화권> 문화권 공통 건물 안·마을 사람·거리 배경 변형
    · ext:<묶음> 건물 겉모습 / role:<양식> 역할 공통 초상 / maid:<묶음> 지역 여급 / mates:<지역> 동료 / pool:<종류>/<나라> 얼굴 묶음
    · dend:<지역> 발견 마지막 장면 / 나머지는 첫 폴더 이름"""
    import re
    cities = {int(k): v for k, v in (places or {}).get('cities', {}).items()}
    sponsors = (places or {}).get('sponsors', {})
    maids = (places or {}).get('maids', {})
    mates = (places or {}).get('mates', {})
    discs = (places or {}).get('discoveries', {})
    # 지역 안에서 가까운 도시끼리 이어지게: 가장 서쪽 도시에서 시작해 가장 가까운 도시로 차례로 잇는다
    rank = {}
    regions = {}
    for cid, c in cities.items():
        regions.setdefault(c['region'], []).append(cid)
    for reg, ids in regions.items():
        left = set(ids)
        cur = min(ids, key=lambda i: (cities[i]['lon'], i))
        n = 0
        while left:
            left.discard(cur)
            rank[cur] = n
            n += 1
            if not left:
                break
            c0 = cities[cur]
            cur = min(left, key=lambda i: ((cities[i]['lat'] - c0['lat']) ** 2 + ((cities[i]['lon'] - c0['lon']) * 0.8) ** 2, i))

    def city_slot(cid, sub):
        c = cities.get(cid)
        if c is None:
            return None
        return ('geo:%02d' % c['region'], '%04d/%s' % (rank.get(cid, 0), sub))

    def near_region(lat, lon):
        if not cities or lat is None or lon is None:
            return 99
        best = min(cities.values(), key=lambda c: (c['lat'] - lat) ** 2 + (c['lon'] - lon) ** 2)
        return best['region']

    out = {}
    for k in keys:
        parts = k.split('/')
        top = parts[0]
        slot = None
        if places:
            m = re.match(r'^(exteriors|interiors|portraits/npc)/[^@]+@(\d+)$', k)
            if top == 'backgrounds' and parts[1].isdigit():
                slot = city_slot(int(parts[1]), '0')
            elif m:
                slot = city_slot(int(m.group(2)), k)
            elif k.startswith('portraits/sponsors/'):
                sid = re.sub(r'_\d+$', '', parts[2])
                if sid in sponsors:
                    slot = city_slot(sponsors[sid], k)
            elif k.startswith('portraits/maids/'):
                mid = re.sub(r'_half$', '', parts[2])
                if mid in maids:
                    slot = city_slot(maids[mid], k)
            elif k.startswith('exteriors/') and '@' in k:
                sid = k.split('@', 1)[1]
                if sid in sponsors:
                    slot = city_slot(sponsors[sid], k)
            elif k.startswith('portraits/mates/') and parts[2] in mates:
                slot = ('mates:%02d' % max(-1, mates[parts[2]]), k)
            elif top == 'discovery-ends' and parts[1] in discs:
                d = discs[parts[1]]
                reg = cities[d['city']]['region'] if d.get('city') in cities else near_region(d.get('lat'), d.get('lon'))
                slot = ('dend:%02d' % reg, k)
        if slot is None:
            m = re.match(r'^(interiors|exteriors|portraits/npc)/[^_@]+_(europe|islam|eastasia|south|native|steppe)(?:_|$)', k)
            if top == 'bg-styles':
                slot = ('cul:' + {'ib': 'europe'}.get(parts[1].split('_')[0], parts[1].split('_')[0]), k)
            elif m:
                slot = ('cul:' + m.group(2), k)
            elif top == 'exterior-styles' and len(parts) > 2:
                slot = ('ext:' + parts[1], k)
            elif k.startswith('portraits/npc-roles/') and len(parts) > 3:
                slot = ('role:' + parts[2], k)
            elif top == 'maid-styles' and len(parts) > 2:
                slot = ('maid:%s/%s' % (MAID_CULTURE.get(parts[1], 'z'), parts[1]), k)
            elif k.startswith('portraits/pools/') and len(parts) > 4:
                slot = ('pool:%s/%s' % (parts[2], parts[3]), k)
            elif top in ('portraits', 'duel', 'characters') and len(parts) > 2:
                slot = ('%s/%s' % (top, parts[1]), k)
            else:
                slot = (top, k)
        out[k] = slot
    return out


def image_packs(found, base, out_dir, places=None):
    """아티팩트용: 그림을 data: 주소로 바꿔 JS 묶음 파일(img/pack-NN-해시.js)에 나눠 담는다.
    페이지(game.html)에는 그림이 들어가지 않으므로 페이지 한도(16MiB)와 상관없이 그림을 늘릴 수 있다.
    묶음은 「한 장면에서 같이 쓰이는 그림끼리」(pack_order) — 도시에 들어갈 때 그 도시와 이웃 도시 그림만 받게.
    돌려주는 값: [(페이지에서 부를 상대 경로, 바이트 수, 키 목록)]"""
    img_dir = os.path.join(out_dir, 'img')
    os.makedirs(img_dir, exist_ok=True)
    for f in os.listdir(img_dir):
        if f.startswith('pack-') and f.endswith('.js'):
            os.remove(os.path.join(img_dir, f))
    order = pack_order(list(found), places)
    groups = []          # [(갈래, {키: 주소}, 크기)]
    cur, n, grp = {}, 0, None
    # 메모리를 아끼려고 먼저 크기만 셈해 묶음을 나누고(data: 주소 길이 = base64 길이 + 머리), 파일을 쓸 때 묶음마다 그림을 읽는다
    def ulen(k):
        path = os.path.join(base or os.path.join(pages.ROOT, 'images'), found[k])
        ext = os.path.splitext(path)[1].lower()
        return len('data:%s;base64,' % pages.MIME.get(ext, 'application/octet-stream')) + 4 * ((os.path.getsize(path) + 2) // 3)
    for k in sorted(found, key=lambda x: order[x]):
        g = order[k][0]
        ul = ulen(k)
        if cur and (g != grp or n + ul > PACK_TARGET):
            groups.append((grp, cur, n))
            cur, n = {}, 0
        cur[k] = True
        grp = g
        n += ul + len(k) + 8
    if cur:
        groups.append((grp, cur, n))
    # 아주 작은 묶음은 같은 갈래 이름(앞부분)의 바로 앞 묶음과 합친다
    packs = []
    for g, pk, size in groups:
        fam = g.split(':')[0].split('/')[0]
        if packs and size < PACK_SMALL and packs[-1][0] == fam and packs[-1][2] + size <= PACK_TARGET:
            packs[-1][1].update(pk)
            packs[-1][2] += size
        elif packs and packs[-1][2] < PACK_SMALL and packs[-1][0] == fam and packs[-1][2] + size <= PACK_TARGET:
            packs[-1][1].update(pk)
            packs[-1][2] += size
        else:
            packs.append([fam, dict(pk), size])
    out = []
    for i, (_, pk0, _) in enumerate(packs, 1):
        pk = {k: pages.data_uri(os.path.join(base or os.path.join(pages.ROOT, 'images'), found[k])) for k in pk0}
        js = ('/* PLUS ULTRA 그림 묶음 %d/%d (tools/bundle.py가 만듦) */\nwindow.G = window.G || {};\n'
              'G.IMAGE_FILES = Object.assign(G.IMAGE_FILES || {}, %s);\n') % (i, len(packs), json.dumps(pk, ensure_ascii=False))
        rel = 'img/pack-%03d-%s.js' % (i, pages.short_hash(js))
        with open(os.path.join(out_dir, rel), 'w', encoding='utf-8', newline='\n') as f:
            f.write(js)
        out.append((rel, len(js.encode('utf-8')), list(pk)))
    return out


def split_anim(found):
    """아티팩트용: 움직이는 그림(유적 GIF → .anim.webp)은 묶음에 넣지 않고 images/ 아래 파일로 따로 올린다.
    묶음은 페이지를 열 때 모두 읽히지만, 따로 올린 파일은 발견 연출·도감에서 필요할 때만 읽힌다.
    발견 장면 판(discovery-sheets/)도 따로 올린다. 장면 판이 있는 발견물의 움직이는 그림은 게임이 쓰지 않으므로 뺀다."""
    # 아티팩트 한 판의 파일 수(511)·크기(256MB) 때문에 장면 판을 다 싣지 못할 때: tools/artifact_sheet_drop.txt 의 발견물은
    # 장면 판·움직이는 그림을 빼고 마지막 장면(discovery-ends, 묶음 안)만 싣는다 — 웹판·개발판은 그대로 움직인다
    drop = set()
    dp = os.path.join(pages.TOOLS, 'artifact_sheet_drop.txt')
    if os.path.exists(dp):
        drop = {l.split('#')[0].strip() for l in open(dp, encoding='utf-8')} - {''}
    if drop:
        found = {k: rel for k, rel in found.items() if not ((k.startswith('discovery-sheets/') or k.startswith('discoveries/')) and k.split('/', 1)[1] in drop)}
    sheets = {k[len('discovery-sheets/'):] for k in found if k.startswith('discovery-sheets/')}
    anim = {k: rel for k, rel in found.items() if rel.lower().endswith(('.anim.webp', '.gif')) or k.startswith('discovery-sheets/')}
    anim = {k: rel for k, rel in anim.items() if not (k.startswith('discoveries/') and k[len('discoveries/'):] in sheets)}
    rest = {k: rel for k, rel in found.items() if k not in anim and not (k.startswith('discoveries/') and k[len('discoveries/'):] in sheets and rel.lower().endswith(('.anim.webp', '.gif')))}
    return rest, anim


def asset_script(urls):
    return ('<script>/* 자산 저장소의 그림 (tools/bundle.py --set-assets 가 고쳐 쓴다) */\nwindow.G = window.G || {};\nG.IMAGE_FILES = Object.assign(G.IMAGE_FILES || {}, ' +
            ASSET_MARK + json.dumps(urls, ensure_ascii=False, sort_keys=True) + ASSET_MARK + ');\n</script>')


def inline(page, found, artifact, title=None, extra_css='', base=None, packs=None, files=None, assets=None):
    p = pages.parse(page)
    css = '\n'.join(pages.read(c) for c in p['css']) + extra_css
    parts = []
    for s in p['scripts']:
        if s == 'images/manifest.js' and packs is not None:
            # 그림은 따로 올린 묶음 파일(img/pack-NN.js)에 있다. 페이지를 열 때는 읽지 않고, 묶음 안의 그림이 처음 필요할 때
            # G.Img가 그 묶음을 읽는다 — 그때까지 G.IMAGE_FILES 에는 'pack:번호' 자리표만 둔다 (has·pick·list는 바로 된다)
            paths = {k: rel for k, rel in sorted(found.items())}
            lazy = {}
            for i, (_, _, keys) in enumerate(packs):
                for k in keys:
                    lazy[k] = 'pack:%d' % i
            lazy.update(files or {})   # 따로 올린 그림 파일(images/…)은 상대 경로로 — G.Img가 images/ 를 붙여 필요할 때 읽는다
            parts.append('<script>/* images (lazy packs) */\nwindow.G = window.G || {};\nG.IMAGE_PACK_URLS = ' + json.dumps([rel for rel, _, _ in packs]) +
                         ';\nG.IMAGE_FILES = Object.assign(G.IMAGE_FILES || {}, ' + json.dumps(lazy, ensure_ascii=False) + ');\nG.IMAGE_PATHS = ' + json.dumps(paths, ensure_ascii=False) + ';\n</script>')
            if assets is not None:
                parts.append(asset_script(assets))
        elif s == 'images/manifest.js':
            js, _ = pages.manifest_js(found, embed=True, base=base)
            # data: 주소만으로는 움직이는 WEBP를 알 수 없어서 그 그림들의 원래 이름을 함께 넣는다 (G.Img.isAnim)
            anim = {k: rel for k, rel in sorted(found.items()) if rel.lower().endswith(('.anim.webp', '.gif'))}
            if anim:
                js += '\nG.IMAGE_PATHS = Object.assign(G.IMAGE_PATHS || {}, ' + json.dumps(anim, ensure_ascii=False) + ');\n'
            parts.append('<script>/* images (embedded) */\n' + js + '</script>')
        else:
            parts.append('<script>/* ' + s + ' */\n' + pages.script_text(s) + '\n</script>')
    icon = '<link rel="icon" href="' + pages.data_uri(os.path.join(pages.ROOT, 'favicon.svg')) + '" type="image/svg+xml">'
    title = title or p['title']
    head = '<title>' + title + '</title>\n' + ('' if artifact else icon + '\n') + '\n'.join(p['fonts']) + '\n<style>\n' + css + '\n</style>\n'
    if artifact:
        return head + p['markup'] + '\n' + '\n'.join(parts) + '\n'
    return ('<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + head +
            '</head>\n<body>\n' + p['markup'] + '\n' + '\n'.join(parts) + '\n</body>\n</html>\n')


def write(path, text):
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    n = len(text.encode('utf-8'))
    print('%-42s %s' % (os.path.relpath(path, pages.ROOT) if path.startswith(pages.ROOT) else path, pages.human(n)))
    return n


def mark_published(out):
    """아티팩트에 올린 뒤: 지금 묶음 목록을 '올린 목록'으로 적어 둔다 (다음 번에 지울 옛 묶음을 알 수 있게)"""
    pub_path = os.path.join(out, 'publish.json')
    with open(pub_path, encoding='utf-8') as f:
        d = json.load(f)
    d['published'] = d.get('packs', [])
    d['published_files'] = d.get('files', [])
    d['removed'] = []
    with open(pub_path, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
    print('올린 묶음 %d개를 적어 두었습니다.' % len(d['published']))


def asset_state(out):
    p = os.path.join(out, 'assets.json')
    try:
        with open(p, encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}


def file_sha(path):
    import hashlib
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()[:16]


def set_assets(out, map_path):
    """자산을 올린 뒤: {"assets/street-folk/…webp": "/_blob/…"} 를 assets.json 에 적고 game.html 의 주소 표를 고쳐 쓴다"""
    with open(map_path, encoding='utf-8') as f:
        new = json.load(f)
    st = asset_state(out)
    for rel, url in new.items():
        rel = rel[len('assets/'):] if rel.startswith('assets/') else rel
        src = os.path.join(out, 'assets', rel)
        st[rel] = {'url': url, 'sha': file_sha(src) if os.path.exists(src) else None}
    with open(os.path.join(out, 'assets.json'), 'w', encoding='utf-8') as f:
        json.dump(st, f, ensure_ascii=False, indent=1, sort_keys=True)
    rewrite_assets(out, st)


def rewrite_assets(out, st):
    pub = {}
    try:
        with open(os.path.join(out, 'publish.json'), encoding='utf-8') as f:
            pub = json.load(f)
    except Exception:
        pass
    urls, pending = {}, []
    for rel in pub.get('assets', []):
        r = rel[len('assets/'):]
        e = st.get(r)
        if e and e.get('url') and e.get('sha') == file_sha(os.path.join(out, rel)):
            urls[os.path.splitext(r)[0]] = e['url']
        else:
            pending.append(rel)
    import re
    page = os.path.join(out, 'game.html')
    with open(page, encoding='utf-8') as f:
        html = f.read()
    m = re.escape(ASSET_MARK)
    html2, n = re.subn(m + r'.*?' + m, lambda _: ASSET_MARK + json.dumps(urls, ensure_ascii=False, sort_keys=True) + ASSET_MARK, html, count=1, flags=re.S)
    if n:
        with open(page, 'w', encoding='utf-8', newline='\n') as f:
            f.write(html2)
    pub['assets_pending'] = pending
    with open(os.path.join(out, 'publish.json'), 'w', encoding='utf-8') as f:
        json.dump(pub, f, ensure_ascii=False, indent=1)
    print('자산 저장소 그림 %d장 주소를 game.html에 넣었습니다 · 아직 올리지 않은 그림 %d장' % (len(urls), len(pending)))


def main():
    if '--set-assets' in sys.argv:
        i = sys.argv.index('--set-assets')
        set_assets(sys.argv[i + 1], sys.argv[i + 2])
        return
    if '--mark-published' in sys.argv:
        i = sys.argv.index('--mark-published')
        mark_published(sys.argv[i + 1] if i + 1 < len(sys.argv) and not sys.argv[i + 1].startswith('--') else os.path.join(pages.ROOT, 'dist', 'artifact'))
        return
    try:
        sys.stdout.reconfigure(errors='replace')  # 콘솔 인코딩에 없는 글자는 ? 로
    except Exception:
        pass
    found, dups = imgtool.scan()
    imgtool.write_manifest(found)
    if found:
        print('교체 그림 %d장을 파일 안에 넣습니다.' % len(found))
    # 한 파일짜리 판과 아티팩트는 브라우저가 한 번에 읽어야 하므로 그림을 줄여 넣는다
    import slim
    slim_dir = os.path.join(pages.ROOT, 'dist', 'slim-images')
    sfound = slim.build(found, slim_dir, 1.0)
    if not os.environ.get('NO_SINGLE'): write(os.path.join(pages.ROOT, 'PLUS_ULTRA.html'), inline('index.html', sfound, False, base=slim_dir))
    if '--artifact' in sys.argv:
        i = sys.argv.index('--artifact')
        out = sys.argv[i + 1] if i + 1 < len(sys.argv) else os.path.join(pages.ROOT, 'dist', 'artifact')
        os.makedirs(out, exist_ok=True)
        # 아티팩트는 페이지(game.html·catalog.html) + 그림 묶음 파일(img/pack-*.js)로 나눠 올린다.
        # 한도: 페이지·텍스트 파일 하나 16MiB, 한 번에 올리는 합계 64MB → 그림이 늘어도 페이지는 코드만큼만 커진다
        old = {}
        pub_path = os.path.join(out, 'publish.json')
        if os.path.exists(pub_path):
            try:
                with open(pub_path, encoding='utf-8') as f:
                    old = json.load(f)
            except Exception:
                old = {}
        scale = float(sys.argv[sys.argv.index('--scale') + 1]) if '--scale' in sys.argv else 1.0
        hq_dir = os.path.join(pages.ROOT, 'dist', 'slim-hq')
        # 장면 판이 있는 발견물의 움직이는 그림은 아티팩트에 넣지 않으므로 줄이지도 않는다 (시간 절약)
        sheet_ids = {k[len('discovery-sheets/'):] for k in found if k.startswith('discovery-sheets/')}
        skip = {k for k, rel in found.items() if k.startswith('discoveries/') and k[len('discoveries/'):] in sheet_ids and rel.lower().endswith('.gif')}
        # 게임이 쓰지 않는 옛 탐험대 시트(js/data/expedition_motion.js에 이름이 없는 것)는 넣지 않는다 — 한도 256MB에서 약 9MB
        try:
            with open(os.path.join(pages.ROOT, 'js', 'data', 'expedition_motion.js'), encoding='utf-8') as f:
                em = f.read()
            skip |= {k for k in found if k.startswith('sprites/expedition_') and k[len('sprites/'):] not in em}
        except OSError:
            pass
        # 자산 저장소로 올릴 그림(ASSET_PREFIXES)은 줄이지도, 묶음에 넣지도 않는다
        extra = asset_extra()
        asset_keys = {k: rel for k, rel in found.items() if k.startswith(ASSET_PREFIXES) or k in extra}
        skip |= set(asset_keys)
        slim_dir = hq_dir
        places = game_places()
        mdir0 = os.path.join(pages.ROOT, 'music')
        mus = [os.path.join(mdir0, fn) for fn in sorted(os.listdir(mdir0)) if fn.lower().endswith(('.mp3', '.ogg', '.m4a'))] if os.path.isdir(mdir0) else []
        msize = sum(os.path.getsize(m) for m in mus)
        while True:
            sfound = slim.build(found, hq_dir, scale, hq=True, skip=skip)
            pfound, afound = split_anim(sfound)
            packs = image_packs(pfound, slim_dir, out, places)
            import shutil
            if os.path.isdir(os.path.join(out, 'images')):
                shutil.rmtree(os.path.join(out, 'images'))
            for rel in afound.values():
                dst = os.path.join(out, 'images', rel)
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.copy2(os.path.join(slim_dir, rel), dst)
            n1 = write(os.path.join(out, 'game.html'), inline('index.html', sfound, True, title='Loop of Good Hope 더 먼 바다로', extra_css='\nhtml, body { height: 100%; }\n', base=slim_dir, packs=packs, files=afound, assets={}))
            n2 = write(os.path.join(out, 'catalog.html'), inline('catalog.html', sfound, True, base=slim_dir, packs=packs, files=afound))
            nf = sum(os.path.getsize(os.path.join(out, 'images', rel)) for rel in afound.values())
            print('따로 올리는 움직이는 그림 %d장: %s (필요할 때만 읽힘)' % (len(afound), pages.human(nf)))
            total = n1 + sum(b for _, b, _ in packs)
            for rel, b, _ in packs:
                print('%-42s %s' % (rel, pages.human(b)))
            whole = total + nf + msize
            nfiles = 1 + len(packs) + len(afound) + len(mus)
            print('한 판 합계 %s (한도 %s) · 파일 %d개 (한도 %d)' % (pages.human(whole), pages.human(ARTIFACT_TOTAL), nfiles, ARTIFACT_FILES))
            if nfiles > ARTIFACT_FILES:
                print('주의: 파일 수가 한도를 넘습니다 — PACK_TARGET을 키우세요 (그림을 줄여도 파일 수는 거의 그대로)')
            ok = max([n1, n2] + [b for _, b, _ in packs]) <= ARTIFACT_LIMIT and whole <= ARTIFACT_TOTAL
            if ok or scale < 0.5:
                break
            scale -= 0.05
            print('한도를 넘어 그림을 더 줄입니다 (배율 %.2f)' % scale)
        print('아티팩트 합계 %s (페이지 %s + 그림 묶음 %d개 %s) — 페이지 한도 %s까지 %s 남음' % (
            pages.human(total), pages.human(n1), len(packs), pages.human(total - n1), pages.human(ARTIFACT_LIMIT), pages.human(ARTIFACT_LIMIT - max(n1, n2))))
        if not ok:
            print('주의: 아티팩트 한도(파일 하나 16MiB, 한 판 합계 %s)를 넘습니다. 그림 수를 줄여야 합니다.' % pages.human(ARTIFACT_TOTAL))
        # 올릴 때 쓸 목록: 새 묶음 파일, 지난번에 '올린' 묶음 가운데 이제는 없는 것(아티팩트에서 지울 것)
        # 올린 뒤 python tools/bundle.py --mark-published 로 '올린 목록'을 새로 적는다
        new = [rel for rel, _, _ in packs]
        # 배경 음악은 페이지에 넣지 않고 music/*.mp3 파일 그대로 아티팩트에 올린다 (한 번에 64MB 한도 — 그림 묶음과 따로 올려도 된다)
        music = []
        mdir = os.path.join(pages.ROOT, 'music')
        if os.path.isdir(mdir):
            import shutil
            os.makedirs(os.path.join(out, 'music'), exist_ok=True)
            for fn in sorted(os.listdir(mdir)):
                if fn.lower().endswith(('.mp3', '.ogg', '.m4a')):
                    shutil.copy2(os.path.join(mdir, fn), os.path.join(out, 'music', fn))
                    music.append('music/' + fn)
            print('배경 음악 %d곡: %s' % (len(music), pages.human(sum(os.path.getsize(os.path.join(out, m)) for m in music))))
        published = old.get('published', [])
        removed = [rel for rel in published if rel not in new]
        img_files = sorted('images/' + rel for rel in afound.values())
        old_files = old.get('published_files', [])
        removed += [rel for rel in old_files if rel not in img_files]
        # 자산 저장소 그림: 원래 크기 그대로 <폴더>/assets/ 에 — 올린 적 있고 그대로인 그림은 주소를 game.html에 넣고, 나머지는 assets_pending
        import shutil
        if os.path.isdir(os.path.join(out, 'assets')):
            shutil.rmtree(os.path.join(out, 'assets'))
        for rel in asset_keys.values():
            dst = os.path.join(out, 'assets', rel)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(os.path.join(pages.ROOT, 'images', rel), dst)
        asset_files = sorted('assets/' + rel for rel in asset_keys.values())
        abytes = sum(os.path.getsize(os.path.join(out, r)) for r in asset_files)
        print('자산 저장소에 원래 크기로 올리는 그림 %d장: %s (한 판 한도와 따로)' % (len(asset_files), pages.human(abytes)))
        with open(pub_path, 'w', encoding='utf-8') as f:
            json.dump({'pages': ['game.html', 'catalog.html'], 'packs': new, 'files': img_files, 'music': music, 'published': published,
                       'published_files': old_files, 'removed': removed, 'bytes': total, 'files_bytes': nf,
                       'assets': asset_files, 'assets_bytes': abytes}, f, ensure_ascii=False, indent=1)
        rewrite_assets(out, asset_state(out))
        print('올릴 파일 목록: ' + os.path.relpath(pub_path, pages.ROOT) if pub_path.startswith(pages.ROOT) else '올릴 파일 목록: ' + pub_path)


if __name__ == '__main__':
    main()
