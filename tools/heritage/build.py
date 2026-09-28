# -*- coding: utf-8 -*-
"""out/raw.json(실제 자료) + ko.json(한국어로 다시 쓴 글) → js/data/heritage.js

    python tools/heritage/build.py

인터넷이 필요 없다. fetch.py 가 끝에 저절로 부른다.
ko.json 형식
  { "disc":  { "발견ID": { "desc": "게임 속 설명(시대 속 말투)", "record": "세계유산 기록(오늘날의 사실)", "lore": ["덧붙일 이야기", ...] } },
    "relic": { "유물ID": { "name": "실존 유물 이름", "desc": "설명" } } }
글이 없는 항목도 사실(등재 연도·학명·소장처)과 출처는 게임에 실린다.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
RAW = os.path.join(HERE, 'out', 'raw.json')
KO = os.path.join(HERE, 'ko.json')
DST = os.path.join(ROOT, 'js', 'data', 'heritage.js')


def clean(d):
    return {k: v for k, v in d.items() if v not in (None, '', [], {})}


def pick_photo(p):
    if not p or not (p.get('file') or p.get('url')):
        return None
    return clean(dict(file=p.get('file'), by=p.get('artist'), lic=p.get('license'), src=p.get('source'), url=p.get('page') or p.get('url')))


def facts(r):
    out = {}
    u = r.get('unesco')
    if u:
        out['whc'] = clean(dict(no=str(u.get('no') or '').split('.')[0], name=u.get('name'), year=u.get('year'),
                                crit=u.get('crit'), states=u.get('states'), danger=bool(u.get('danger') and str(u.get('danger')) not in ('0', 'False', 'false')),
                                url=u.get('url')))
    w = r.get('wiki')
    if w:
        out['wiki'] = clean(dict(title=w.get('title'), ko=w.get('ko'), url=w.get('url')))
    g = r.get('gbif')
    if g:
        out['bio'] = clean(dict(sci=g.get('canonical') or g.get('sci'), family=g.get('family'), order=g.get('order'), cls=g.get('cls'),
                                ko=g.get('ko'), en=g.get('en'), records=g.get('records'), extinct=g.get('extinct'), url=g.get('url')))
    o = r.get('obis')
    if o:
        out['sea'] = clean(dict(records=o.get('records'), depth=o.get('depth'), lat=o.get('lat'), url=o.get('url')))
    ob = r.get('object')
    if ob:
        out['obj'] = clean(dict(museum=ob.get('museum'), title=ob.get('title'), date=ob.get('date'), culture=ob.get('culture'),
                                place=ob.get('place'), medium=ob.get('medium'), no=ob.get('accession'), url=ob.get('url')))
    ph = pick_photo(r.get('photo'))
    if ph:
        out['photo'] = ph
    if r.get('legend'):
        out['legend'] = True
    return out


def main():
    raw = json.load(open(RAW, encoding='utf-8')) if os.path.exists(RAW) else {'disc': {}, 'relic': {}}
    ko = json.load(open(KO, encoding='utf-8')) if os.path.exists(KO) else {'disc': {}, 'relic': {}}
    data = {'disc': {}, 'relic': {}}
    for kind in ('disc', 'relic'):
        ids = set(raw.get(kind, {})) | set(ko.get(kind, {}))
        for k in sorted(ids):
            e = facts(raw.get(kind, {}).get(k, {}))
            e.update(clean(ko.get(kind, {}).get(k, {})))
            if e:
                data[kind][k] = e
    body = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    body = body.replace('},"', '},\n"')
    js = ('/* 발견물·유물의 실제 자료 — tools/heritage/build.py 가 만든다. 손으로 고치지 말고 tools/heritage/ko.json 을 고친 뒤 다시 만든다.\n'
          '   출처: UNESCO 세계유산센터(CC BY-SA 3.0 IGO), 위키백과·위키미디어 공용(CC BY-SA 등), The Met·Smithsonian Open Access(CC0),\n'
          '   GBIF.org·OBIS(CC BY 4.0). 한국어 글은 이 자료를 바탕으로 게임에 맞게 새로 쓴 것이며 같은 조건(CC BY-SA)으로 공개한다. */\n'
          '(function (G) {\n  G.HERITAGE = ' + body + ';\n})(window.G = window.G || {});\n')
    open(DST, 'w', encoding='utf-8', newline='\n').write(js)
    print('heritage.js — 발견물 %d, 유물 %d (%.0f KB)' % (len(data['disc']), len(data['relic']), len(js.encode('utf-8')) / 1024))


if __name__ == '__main__':
    main()
