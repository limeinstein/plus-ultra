# -*- coding: utf-8 -*-
"""발견물·유물의 실제 자료 모으기 (인터넷이 되는 PC에서 한 번 실행).

    python tools/heritage/fetch.py              # 전부 (처음엔 20~40분, 캐시가 있으면 빠름)
    python tools/heritage/fetch.py --only seokguram,r_bulguksa
    python tools/heritage/fetch.py --no-images  # 글·자료만
    python tools/heritage/fetch.py --force-images   # 사람이 넣은 그림까지 덮어쓰기 (보통은 건너뜀)
    python tools/heritage/fetch.py --reference-images --only stonehenge,...

쓰는 API (모두 열쇠 없이 됨. 스미스소니언만 api.data.gov 열쇠 — 없으면 DEMO_KEY, 하루 50번 제한)
  - UNESCO 세계유산 (data.unesco.org 의 whc001, 안 되면 whc.unesco.org/en/list/xml)
  - 위키백과 / MediaWiki Action API (en.wikipedia.org, commons.wikimedia.org)
  - The Met Collection API (공공 영역 작품만)
  - GBIF API (CC0·CC BY 사진만)
  - OBIS API
  - Smithsonian Open Access API (CC0만)   환경 변수 SI_API_KEY 로 열쇠를 넣을 수 있다.

만드는 것
  tools/heritage/cache/            API 원본 응답 (다시 실행하면 여기서 읽음)
  tools/heritage/out/raw.json      발견물·유물별로 정리한 실제 자료 (build.py·한국어 글쓰기에 씀)
  tools/heritage/out/report.md     찾은 것·못 찾은 것·이름이 어긋난 것
  images/discoveries/ID.jpg        발견 카드 사진 (1440×640)   — 이미 사람이 넣은 그림이 있으면 건너뜀
  tools/heritage/references/discoveries/ID.jpg
                                    --reference-images를 쓸 때의 복원·작화용 기준 사진
  images/relics/유물ID.jpg         유물 사진 (512×512)
끝나면 tools/images.py 와 tools/heritage/build.py 를 이어서 실행한다.

재사용 조건: 사진은 공공 영역·CC0·CC BY·CC BY-SA 만 받는다. 출처·작가·라이선스는 raw.json 에 남기고
게임(발견 카드·도감)이 그대로 보여 준다. UNESCO 설명은 CC BY-SA 3.0 IGO — 게임에는 한국어로 다시 쓴 글과 출처를 싣는다.
"""
import html
import hashlib
import io
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
from sources import DISC, RELIC  # noqa: E402

CACHE = os.path.join(HERE, 'cache')
OUT = os.path.join(HERE, 'out')
IMG = os.path.join(ROOT, 'images')
UA = 'PLUS-ULTRA-game heritage fetcher/1.0 (https://github.com/limeinstein/plus-ultra; educational game)'
SI_KEY = os.environ.get('SI_API_KEY', 'DEMO_KEY')
OK_LICENSE = re.compile(r'public domain|cc0|cc[- ]by|creativecommons\.org/(licenses/by|publicdomain)|pdm|no restrictions|kogl type 1|공공누리 제1유형', re.I)
NC_ND = re.compile(r'\b(nc|nd)\b|noncommercial|noderiv', re.I)

try:
    from PIL import Image  # 있으면 크기를 맞춰 저장, 없으면 받은 그대로
except Exception:  # pragma: no cover
    Image = None

# ---------------------------------------------------------------- http + cache
_last = {}


def _pace(host, gap):
    t = time.time() - _last.get(host, 0)
    if t < gap:
        time.sleep(gap - t)
    _last[host] = time.time()


def get(url, kind='json', cache_key=None, gap=0.25, tries=3):
    """GET with on-disk cache. kind: json | text | bytes"""
    key = cache_key or re.sub(r'[^A-Za-z0-9._-]+', '_', url)[-180:]
    path = os.path.join(CACHE, key + ('.bin' if kind == 'bytes' else '.txt'))
    if os.path.exists(path):
        with open(path, 'rb') as f:
            raw = f.read()
    else:
        host = urllib.parse.urlparse(url).netloc
        raw = None
        for i in range(tries):
            _pace(host, gap)
            try:
                req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': '*/*'})
                with urllib.request.urlopen(req, timeout=40) as r:
                    raw = r.read()
                break
            except urllib.error.HTTPError as e:
                if e.code in (404, 400, 403):
                    raw = b''
                    break
                time.sleep(2 + i * 3)
            except Exception:
                time.sleep(2 + i * 3)
        if raw is None:
            return None
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'wb') as f:
            f.write(raw)
    if kind == 'bytes':
        return raw or None
    if not raw:
        return None
    txt = raw.decode('utf-8', 'replace')
    if kind == 'text':
        return txt
    try:
        return json.loads(txt)
    except ValueError:
        return None


def q(url, **params):
    return url + ('&' if '?' in url else '?') + urllib.parse.urlencode({k: v for k, v in params.items() if v is not None})


def strip_html(s):
    s = re.sub(r'<[^>]+>', ' ', s or '')
    return re.sub(r'\s+', ' ', html.unescape(s)).strip()


# ---------------------------------------------------------------- UNESCO
_whc_xml = None


def whc_xml_rows():
    global _whc_xml
    if _whc_xml is None:
        txt = get('https://whc.unesco.org/en/list/xml/', 'text', 'unesco/list_xml') or ''
        rows = {}
        for m in re.finditer(r'<row>(.*?)</row>', txt, re.S):
            rec = {}
            for f in re.finditer(r'<([a-z_]+)>(.*?)</\1>', m.group(1), re.S):
                rec[f.group(1)] = html.unescape(re.sub(r'^<!\[CDATA\[|\]\]>$', '', f.group(2).strip()))
            if rec.get('id_number'):
                rows[int(rec['id_number'])] = rec
        _whc_xml = rows
    return _whc_xml


def _pick(rec, *pats):
    for p in pats:
        for k, v in rec.items():
            if v not in (None, '', []) and re.search(p, k, re.I):
                return v
    return None


def unesco(no=None, name=None):
    """세계유산 한 곳 — 번호로, 없으면 이름으로."""
    base = 'https://data.unesco.org/api/explore/v2.1/catalog/datasets/whc001/records'
    rec = None
    if no:
        j = get(q(base, where='id_no=%d' % no, limit=1), cache_key='unesco/whc001_%d' % no)
        if j and j.get('results'):
            rec = j['results'][0]
    if rec is None and name:
        j = get(q(base, where='search("%s")' % name.replace('"', ''), limit=3), cache_key='unesco/whc001_q_' + re.sub(r'\W+', '_', name))
        if j and j.get('results'):
            rec = j['results'][0]
    if rec is not None:
        out = dict(
            no=_pick(rec, r'^id_no$', r'id_no', r'number'),
            name=_pick(rec, r'^name_en$', r'name_en', r'^site$', r'name'),
            desc=strip_html(_pick(rec, r'short_description_en', r'description_en', r'short_description', r'description')),
            why=strip_html(_pick(rec, r'justification_en', r'justification', r'outstanding')),
            year=_pick(rec, r'date_inscribed', r'inscri'),
            crit=_pick(rec, r'criteria'),
            cat=_pick(rec, r'category'),
            states=_pick(rec, r'states_name_en', r'states', r'countr'),
            danger=_pick(rec, r'danger'),
            src='data.unesco.org/whc001')
    else:
        rows = whc_xml_rows()
        r = rows.get(int(no)) if no else None
        if r is None and name:
            low = name.lower()
            r = next((x for x in rows.values() if low in (x.get('site') or '').lower()), None)
        if r is None:
            return None
        out = dict(no=r.get('id_number'), name=strip_html(r.get('site')), desc=strip_html(r.get('short_description')),
                   why=strip_html(r.get('justification')), year=r.get('date_inscribed'), crit=r.get('criteria_txt'),
                   cat=r.get('category'), states=r.get('states'), danger=r.get('danger'), src='whc.unesco.org/en/list/xml')
    if out.get('no'):
        out['url'] = 'https://whc.unesco.org/en/list/%s' % str(out['no']).split('.')[0]
    out['license'] = 'CC BY-SA 3.0 IGO'
    out['credit'] = 'UNESCO World Heritage Centre'
    if isinstance(out.get('year'), str) and out['year'][:4].isdigit():
        out['year'] = int(out['year'][:4])
    return out


# ---------------------------------------------------------------- Wikipedia / Commons
WAPI = 'https://en.wikipedia.org/w/api.php'
CAPI = 'https://commons.wikimedia.org/w/api.php'


def wiki(title):
    j = get(q(WAPI, action='query', format='json', formatversion=2, redirects=1, titles=title,
              prop='extracts|pageimages|info|langlinks|coordinates', exintro=1, explaintext=1, exsentences=8,
              piprop='original|name', inprop='url', lllang='ko'), cache_key='wiki/' + re.sub(r'\W+', '_', title))
    if not j or not j.get('query', {}).get('pages'):
        return None
    p = j['query']['pages'][0]
    if p.get('missing'):
        return None
    out = dict(title=p.get('title'), extract=p.get('extract', ''), url=p.get('fullurl'),
               ko=(p.get('langlinks') or [{}])[0].get('title'), image=p.get('pageimage'),
               license='CC BY-SA 4.0', credit='Wikipedia contributors')
    if p.get('coordinates'):
        out['coord'] = [p['coordinates'][0].get('lat'), p['coordinates'][0].get('lon')]
    if out['ko']:  # 한국어 문서 첫머리 (이름·용어를 맞추는 데 참고)
        k = get(q('https://ko.wikipedia.org/w/api.php', action='query', format='json', formatversion=2, redirects=1,
                  titles=out['ko'], prop='extracts', exintro=1, explaintext=1, exsentences=4),
                cache_key='wiki/ko_' + re.sub(r'\W+', '_', out['ko']))
        try:
            out['ko_extract'] = k['query']['pages'][0].get('extract', '')
        except Exception:
            pass
    return out


def commons_file(fname, width=1600):
    """위키미디어 공용 파일 — 재사용 가능한 라이선스일 때만 {url, license, artist, page}"""
    if not fname:
        return None
    j = get(q(CAPI, action='query', format='json', formatversion=2, titles='File:' + fname, prop='imageinfo',
              iiprop='url|extmetadata|mime', iiurlwidth=width), cache_key='commons/' + re.sub(r'\W+', '_', fname)[-150:])
    try:
        ii = j['query']['pages'][0]['imageinfo'][0]
    except Exception:
        return None
    md = ii.get('extmetadata', {})
    lic = (md.get('LicenseShortName', {}) or {}).get('value', '') + ' ' + (md.get('License', {}) or {}).get('value', '')
    if not OK_LICENSE.search(lic) or NC_ND.search(lic) or not str(ii.get('mime', '')).startswith('image/'):
        return None
    return dict(url=ii.get('thumburl') or ii.get('url'), page=ii.get('descriptionurl'),
                license=(md.get('LicenseShortName', {}) or {}).get('value', '').strip(),
                license_url=(md.get('LicenseUrl', {}) or {}).get('value'),
                artist=strip_html((md.get('Artist', {}) or {}).get('value', ''))[:160] or 'Wikimedia Commons',
                source='Wikimedia Commons')


# ---------------------------------------------------------------- GBIF / OBIS
GBIF = 'https://api.gbif.org/v1'


def gbif(name):
    m = get(q(GBIF + '/species/match', name=name, verbose='false'), cache_key='gbif/match_' + re.sub(r'\W+', '_', name))
    if not m or not m.get('usageKey'):
        return None
    key = m['usageKey']
    sp = get('%s/species/%d' % (GBIF, key), cache_key='gbif/sp_%d' % key) or {}
    vn = get('%s/species/%d/vernacularNames?limit=200' % (GBIF, key), cache_key='gbif/vn_%d' % key) or {}
    names = {}
    for v in vn.get('results', []):
        lang = v.get('language')
        if lang in ('kor', 'eng') and lang not in names:
            names[lang] = v.get('vernacularName')
    cnt = get('%s/occurrence/search?taxonKey=%d&limit=0' % (GBIF, key), cache_key='gbif/cnt_%d' % key) or {}
    out = dict(key=key, sci=sp.get('scientificName') or m.get('scientificName'), canonical=sp.get('canonicalName'),
               rank=m.get('rank'), status=m.get('status'), kingdom=sp.get('kingdom'), phylum=sp.get('phylum'),
               cls=sp.get('class'), order=sp.get('order'), family=sp.get('family'), en=names.get('eng'), ko=names.get('kor'),
               records=cnt.get('count'), extinct=sp.get('extinct'), url='https://www.gbif.org/species/%d' % key,
               credit='GBIF.org', license='CC BY 4.0 (data)')
    return out


def gbif_photo(key):
    for lic in ('CC0_1_0', 'CC_BY_4_0'):
        j = get('%s/occurrence/search?taxonKey=%d&mediaType=StillImage&license=%s&limit=20' % (GBIF, key, lic),
                cache_key='gbif/img_%d_%s' % (key, lic))
        for occ in (j or {}).get('results', []):
            for md in occ.get('media', []):
                ident = md.get('identifier')
                if not ident or md.get('type') != 'StillImage':
                    continue
                if (md.get('format') or 'image/jpeg').lower() not in ('image/jpeg', 'image/jpg', 'image/png'):
                    continue
                return dict(url='https://api.gbif.org/v1/image/cache/fit-in/1600x/' + urllib.parse.quote(ident, safe=''),
                            orig=ident, page='https://www.gbif.org/occurrence/%s' % occ.get('key'),
                            license='CC0' if lic.startswith('CC0') else 'CC BY 4.0',
                            artist=(md.get('rightsHolder') or md.get('creator') or occ.get('recordedBy') or occ.get('datasetName') or 'GBIF')[:160],
                            source='GBIF · ' + (occ.get('datasetName') or occ.get('publishingOrgKey') or '')[:80])
    return None


OBIS = 'https://api.obis.org/v3'


def obis(name):
    j = get(q(OBIS + '/occurrence', scientificname=name, size=500,
              fields='decimalLatitude,decimalLongitude,minimumDepthInMeters,maximumDepthInMeters,depth,date_year'),
            cache_key='obis/occ_' + re.sub(r'\W+', '_', name))
    if not j:
        return None
    rows = j.get('results', [])
    depths = sorted(d for d in ((r.get('depth') or r.get('maximumDepthInMeters') or r.get('minimumDepthInMeters')) for r in rows) if isinstance(d, (int, float)) and d >= 0)
    lats = [r['decimalLatitude'] for r in rows if isinstance(r.get('decimalLatitude'), (int, float))]
    years = sorted(r['date_year'] for r in rows if isinstance(r.get('date_year'), int))
    out = dict(records=j.get('total'), url='https://obis.org/taxon/' + urllib.parse.quote(name), credit='OBIS', license='CC BY 4.0 (data)')
    if depths:
        out['depth'] = [depths[0], depths[len(depths) // 2], depths[-1]]
    if lats:
        out['lat'] = [round(min(lats), 1), round(max(lats), 1)]
    if years:
        out['years'] = [years[0], years[-1]]
    return out


# ---------------------------------------------------------------- museums
MET = 'https://collectionapi.metmuseum.org/public/collection/v1'


def _has(words, *texts):
    if not words:
        return True
    blob = ' '.join(t or '' for t in texts).lower()
    return any(w in blob for w in words)


def met(query, must=None):
    j = get(q(MET + '/search', hasImages='true', q=query), cache_key='met/s_' + re.sub(r'\W+', '_', query), gap=0.15)
    for oid in ((j or {}).get('objectIDs') or [])[:30]:
        o = get('%s/objects/%d' % (MET, oid), cache_key='met/o_%d' % oid, gap=0.15)
        if not o or not o.get('isPublicDomain') or not (o.get('primaryImage') or o.get('primaryImageSmall')):
            continue
        tags = ' '.join(t.get('term', '') for t in (o.get('tags') or []))
        if not _has(must, o.get('title'), o.get('culture'), o.get('period'), o.get('dynasty'), o.get('medium'), o.get('objectName'), tags, o.get('country'), o.get('region')):
            continue
        return dict(museum='The Metropolitan Museum of Art', id=oid, title=o.get('title'), name=o.get('objectName'),
                    date=o.get('objectDate'), culture=o.get('culture') or o.get('dynasty') or o.get('period'),
                    place=', '.join(x for x in (o.get('city'), o.get('region'), o.get('country')) if x),
                    medium=o.get('medium'), dims=o.get('dimensions'), accession=o.get('accessionNumber'),
                    creditline=o.get('creditLine'), url=o.get('objectURL'), license='CC0 (Open Access)',
                    image=dict(url=o.get('primaryImage') or o.get('primaryImageSmall'), page=o.get('objectURL'),
                               license='CC0', artist='The Metropolitan Museum of Art', source='The Met Open Access'))
    return None


SI = 'https://api.si.edu/openaccess/api/v1.0'


def si(query, must=None):
    j = get(q(SI + '/search', q=query + ' AND online_media_type:"Images"', rows=25, api_key=SI_KEY),
            cache_key='si/s_' + re.sub(r'\W+', '_', query), gap=1.2)
    rows = ((j or {}).get('response') or {}).get('rows') or []
    for r in rows:
        c = r.get('content') or {}
        dn = c.get('descriptiveNonRepeating') or {}
        media = ((dn.get('online_media') or {}).get('media')) or []
        pic = None
        for m in media:
            if (m.get('usage') or {}).get('access') == 'CC0' and m.get('type') == 'Images':
                res = {x.get('label'): x.get('url') for x in (m.get('resources') or [])}
                pic = res.get('High-resolution JPEG') or res.get('Screen Image') or m.get('content')
                if pic:
                    break
        if not pic:
            continue
        title = (dn.get('title') or {}).get('content') or r.get('title')
        ft = c.get('freetext') or {}
        flat = lambda k: '; '.join(x.get('content', '') for x in (ft.get(k) or []))  # noqa: E731
        if not _has(must, title, flat('notes'), flat('objectType'), flat('culture'), flat('place')):
            continue
        return dict(museum=dn.get('data_source') or 'Smithsonian Institution', id=r.get('id'), title=title,
                    date=flat('date'), culture=flat('culture'), place=flat('place'), medium=flat('physicalDescription'),
                    accession=(dn.get('record_ID')), url=dn.get('record_link') or dn.get('guid'), license='CC0 (Open Access)',
                    image=dict(url=pic, page=dn.get('record_link') or dn.get('guid'), license='CC0',
                               artist=dn.get('data_source') or 'Smithsonian Institution', source='Smithsonian Open Access'))
    return None


# ---------------------------------------------------------------- images
def save_image(pic, rel_path, size, force=False, cover=True):
    """사진을 images/ 아래에 저장. 사람이 넣은 그림(같은 이름·다른 확장자 포함)은 건드리지 않는다."""
    if not pic or not pic.get('url'):
        return None
    stem = os.path.join(IMG, rel_path)
    regular_img = os.path.abspath(IMG) == os.path.abspath(os.path.join(ROOT, 'images'))
    mine = os.path.join(OUT, 'fetched_images.json' if regular_img else 'fetched_reference_images.json')
    owned = json.load(open(mine, encoding='utf-8')) if os.path.exists(mine) else {}
    for ext in ('.jpg', '.jpeg', '.png', '.webp'):
        if os.path.exists(stem + ext) and not force and rel_path not in owned:
            return dict(skipped='이미 있는 그림 — 건너뜀', file=rel_path + ext)
    url_tag = hashlib.sha1(pic['url'].encode('utf-8')).hexdigest()[:12]
    raw = get(pic['url'], 'bytes', cache_key='img/' + re.sub(r'\W+', '_', rel_path) + '_' + url_tag, gap=0.5)
    if not raw:
        return None
    os.makedirs(os.path.dirname(stem), exist_ok=True)
    out = stem + '.jpg'
    if Image is not None:
        try:
            im = Image.open(io.BytesIO(raw)).convert('RGB')
            W, H = size
            if cover:
                k = max(W / im.width, H / im.height)
                im = im.resize((max(W, int(im.width * k + 0.5)), max(H, int(im.height * k + 0.5))), Image.LANCZOS)
                x0 = (im.width - W) // 2
                y0 = int((im.height - H) * (0.4 if W > H else 0.5))
                im = im.crop((x0, y0, x0 + W, y0 + H))
            else:
                im.thumbnail(size, Image.LANCZOS)
            im.save(out, 'JPEG', quality=80, optimize=True, progressive=True)
        except Exception as e:  # 그림을 못 읽으면 받은 그대로
            print('   ! 그림 변환 실패', rel_path, e)
            open(out, 'wb').write(raw)
    else:
        open(out, 'wb').write(raw)
    owned[rel_path] = pic.get('page') or pic['url']
    os.makedirs(OUT, exist_ok=True)
    json.dump(owned, open(mine, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return dict(file=rel_path + '.jpg')


# ---------------------------------------------------------------- main
def collect_disc(did, s, images, force):
    rec = {'id': did}
    if s.get('legend'):
        rec['legend'] = True
    if s.get('whc') or s.get('whcName'):
        u = unesco(s.get('whc'), s.get('whcName'))
        if u:
            rec['unesco'] = u
    if s.get('wiki'):
        w = wiki(s['wiki'])
        if w:
            rec['wiki'] = w
    if s.get('gbif'):
        g = gbif(s['gbif'])
        if g:
            rec['gbif'] = g
    if s.get('obis'):
        o = obis(s['obis'])
        if o:
            rec['obis'] = o
    if s.get('met'):
        m = met(s['met'], s.get('must'))
        if m:
            rec['object'] = m
    if not rec.get('object') and s.get('si'):
        m = si(s['si'], s.get('must'))
        if m:
            rec['object'] = m
    # 사진: 직접 지정한 공용 파일 → 위키백과 대표 사진 → 소장품 → GBIF 관찰 사진
    pic = commons_file(s.get('commons')) if s.get('commons') else None
    if not pic and rec.get('wiki') and rec['wiki'].get('image'):
        pic = commons_file(rec['wiki']['image'])
    if not pic and rec.get('object'):
        pic = rec['object'].get('image')
    if not pic and rec.get('gbif'):
        pic = gbif_photo(rec['gbif']['key'])
    if pic:
        rec['photo'] = pic
        if images:
            rec['photo'].update(save_image(pic, 'discoveries/' + did, (1440, 640), force) or {})
    return rec


def collect_relic(rid, s, images, force):
    rec = {'id': rid}
    if s.get('legend'):
        rec['legend'] = True
    obj = None
    if s.get('met'):
        obj = met(s['met'], s.get('must'))
    if not obj and s.get('si'):
        obj = si(s['si'], s.get('must'))
    if obj:
        rec['object'] = obj
    if s.get('wiki'):
        w = wiki(s['wiki'])
        if w:
            rec['wiki'] = w
    if s.get('gbif'):
        g = gbif(s['gbif'])
        if g:
            rec['gbif'] = g
    if s.get('obis'):
        o = obis(s['obis'])
        if o:
            rec['obis'] = o
    pic = (obj or {}).get('image')
    if not pic and rec.get('wiki') and rec['wiki'].get('image'):
        pic = commons_file(rec['wiki']['image'], 800)
    if not pic and rec.get('gbif'):
        pic = gbif_photo(rec['gbif']['key'])
    if pic:
        rec['photo'] = dict(pic)
        if images:
            rec['photo'].update(save_image(pic, 'relics/' + rid, (512, 512), force) or {})
    return rec


def report(res):
    lines = ['# 실제 자료 수집 보고서', '', '| 종류 | ID | UNESCO | 위키백과 | 생물(GBIF/OBIS) | 소장품 | 사진 |', '|---|---|---|---|---|---|---|']
    for kind in ('disc', 'relic'):
        for k, r in res[kind].items():
            u = r.get('unesco')
            lines.append('| %s | %s | %s | %s | %s | %s | %s |' % (
                '발견물' if kind == 'disc' else '유물', k,
                ('%s %s (%s)' % (u.get('no'), (u.get('name') or '')[:40], u.get('year'))) if u else '',
                (r.get('wiki') or {}).get('title', ''),
                ' / '.join(x for x in ((r.get('gbif') or {}).get('sci'), ('OBIS %s건' % r['obis']['records']) if r.get('obis') else '') if x),
                ('%s — %s' % ((r.get('object') or {}).get('museum', ''), (r.get('object') or {}).get('title', '')))[:70] if r.get('object') else '',
                ((r.get('photo') or {}).get('file') or (r.get('photo') or {}).get('skipped') or ('있음' if r.get('photo') else '없음'))))
    miss = [k for kind in ('disc', 'relic') for k, r in res[kind].items() if len(r) <= 2 and not r.get('legend')]
    lines += ['', '## 아무것도 찾지 못한 항목', ''] + ['- ' + m for m in miss]
    open(os.path.join(OUT, 'report.md'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')


def main():
    global IMG
    try:
        sys.stdout.reconfigure(errors='replace')
    except Exception:
        pass
    args = sys.argv[1:]
    images = '--no-images' not in args
    force = '--force-images' in args
    references = '--reference-images' in args
    if references:
        IMG = os.path.join(HERE, 'references')
        images = True
    only = None
    for a in args:
        if a.startswith('--only'):
            only = set((a.split('=', 1)[1] if '=' in a else args[args.index(a) + 1]).split(','))
    os.makedirs(CACHE, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    rawp = os.path.join(OUT, 'raw.json')
    res = json.load(open(rawp, encoding='utf-8')) if os.path.exists(rawp) else {'disc': {}, 'relic': {}}
    todo = [('disc', k, v) for k, v in DISC.items()] + [('relic', k, v) for k, v in RELIC.items()]
    if only:
        todo = [t for t in todo if t[1] in only]
    t0 = time.time()
    for i, (kind, k, s) in enumerate(todo, 1):
        try:
            rec = (collect_disc if kind == 'disc' else collect_relic)(k, s, images, force)
        except Exception as e:
            print('  ! 실패', k, e)
            continue
        rec['fetched'] = time.strftime('%Y-%m-%d')
        res[kind][k] = rec
        got = [n for n in ('unesco', 'wiki', 'gbif', 'obis', 'object', 'photo') if rec.get(n)]
        print('[%3d/%d] %-6s %-16s %s' % (i, len(todo), kind, k, ' '.join(got) or '-'))
        if i % 10 == 0:
            json.dump(res, open(rawp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    json.dump(res, open(rawp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    report(res)
    print('\n끝 (%.0f초). tools/heritage/out/report.md 를 보세요.' % (time.time() - t0))
    if images and not references:
        print('그림 목록을 새로 만듭니다: tools/images.py')
        subprocess.call([sys.executable, os.path.join(ROOT, 'tools', 'images.py')])
    elif references:
        print('복원 기준 사진: ' + os.path.join(HERE, 'references', 'discoveries'))
    print('게임 자료를 만듭니다: tools/heritage/build.py')
    subprocess.call([sys.executable, os.path.join(HERE, 'build.py')])


if __name__ == '__main__':
    main()
