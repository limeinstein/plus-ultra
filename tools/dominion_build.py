#!/usr/bin/env python3
"""도시별 지배 국가·나라별 지도자 조사 자료(tools/dominion/out_*.json)를 게임 자료로 만든다.

    python tools/dominion_build.py

  tools/dominion/out_A~G.json : 지역별 도시 조사 {"cities": [{id, name, periods, notes, src}], "leaders": {...}}
  tools/dominion/out_L.json   : 큰 나라 지도자 {"leaders": {...}, "titles": {...}}
  → js/data/dominion.js        G.DOMINION(도시 → [[해, 나라, 달?] …]) · G.NATION_LEADERS · G.NATION_TITLES · G.NATION_COLORS
  → js/data/dominion_notes.js  G.DOMINION_NOTES(도시 → [한 줄 설명, [출처 …]]) — 도감·조사 페이지용
조사 지침은 tools/dominion/BRIEF.md.
"""
import colorsys, glob, hashlib, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools', 'dominion')

# 지도·깃발 색 (나머지는 이름으로 정해지는 색)
COLORS = {
    '포르투갈': '#1d3f7a', '카스티야': '#8a1e1e', '아라곤': '#c9a030', '에스파냐': '#b8322a',
    '잉글랜드': '#b01e28', '스코틀랜드': '#2a4a8a', '영국': '#c0283a', '영국 동인도 회사': '#d0605a',
    '프랑스': '#2a4ab0', '네덜란드': '#e07a1a', '네덜란드 동인도 회사': '#e8a040',
    '신성로마제국': '#d4a82a', '오스트리아': '#e6d040', '오스트리아-헝가리': '#d8c038', '프로이센': '#3a3a3a', '독일 제국': '#4a4a4a',
    '베네치아': '#8a1e2a', '제노바': '#c8c8c8', '교황령': '#f0e0a0', '사보이아': '#5a8ad0', '이탈리아 왕국': '#3a9a5a',
    '오스만 제국': '#a01818', '맘루크 왕조': '#c9a030', '이집트': '#7ab050', '사파비 왕조': '#2a9a8a', '페르시아': '#2a9a8a',
    '모스크바 대공국': '#5a8a6a', '러시아 차르국': '#4a8a5a', '러시아 제국': '#2e7a4a',
    '스웨덴': '#3a7ac8', '덴마크': '#c84a4a', '폴란드': '#d86a8a', '한자 동맹': '#8a1e1e',
    '명': '#b8281e', '청': '#e0b020', '조선': '#3a5aa0', '대한제국': '#3a5aa0', '일본': '#e8e8e8', '무굴 제국': '#2a8a3a',
    '미국': '#3050a0', '멕시코': '#2a7a4a', '브라질': '#3aa040', '원주민': '#8a6a4a',
}
# 조사 목록에 칭호가 없는 나라의 최고 지도자 칭호 (지도자 이름 앞에 붙는다; 이름에 칭호가 들어 있으면 붙이지 않는다)
TITLES = {
    '국왕': ['헝가리', '보헤미아', '노르웨이', '벨기에', '시암', '크메르', '나폴리 왕국', '양시칠리아 왕국', '이탈리아 왕국'],
    '황제': ['대월', '에티오피아', '오스트리아-헝가리', '대순', '대서', '독일 제국'],
    '대통령': ['페루', '그란콜롬비아', '콜롬비아', '베네수엘라', '칠레', '볼리비아', '에콰도르', '엘살바도르', '과테말라', '온두라스', '니카라과', '아르헨티나', '파라과이', '아이티', '중앙아메리카 연방', '페루-볼리비아 연합', '도미니카 공화국', '아메리카 연합국'],
    '술탄': ['모로코', '오만', '아크코윤루', '소코토 칼리파국'], '총독': ['이집트'], '도제': ['제노바'], '천왕': ['태평천국'], '번왕': ['삼번'],
    '칸': ['후금', '몽골', '모굴리스탄'], '페슈와': ['마라타 동맹'], '공': ['왈라키아', '몰다비아', '세르비아', '루마니아', '부르고뉴'], '달라이 라마': ['티베트'],
    '니잠': ['하이데라바드 니잠국'], '에미르': ['아프가니스탄 토후국', '부하라 에미르국', '헤라트 토후국'], '이맘': ['디리야 토후국', '히라브 이맘국', '카심 이맘국'],
    '헤트만': ['코사크 헤트만국'], '나와브': ['벵골 나와브국', '캄바트 나와브국'], '대공': ['리투아니아', '토스카나 대공국'], '마흐디': ['마흐디국'],
}
SEATS = {'국왕', '황제', '술탄', '교황', '쇼군', '대통령', '총독', '스타트하우더', '도제', '대공', '차르', '샤', '칸'}


def color(name):
    if name in COLORS:
        return COLORS[name]
    h = int(hashlib.md5(name.encode('utf-8')).hexdigest()[:6], 16)
    r, g, b = colorsys.hls_to_rgb((h % 360) / 360, 0.42 + (h >> 9) % 18 / 100, 0.45 + (h >> 4) % 25 / 100)
    return '#%02x%02x%02x' % (round(r * 255), round(g * 255), round(b * 255))


def better(a, b):
    """같은 나라 지도자 목록이 두 곳에서 오면 빈칸이 적고 긴 쪽"""
    score = lambda l: (sum(1 for x in l if x[2]), len(l))
    return a if score(a) >= score(b) else b


def main():
    dom, notes, leaders = {}, {}, {}
    for f in sorted(glob.glob(os.path.join(SRC, 'out_[A-Z].json'))):
        if f.endswith('out_L.json'):
            continue
        d = json.load(open(f, encoding='utf-8'))
        for c in d['cities']:
            dom[c['id']] = [[p[0], p[1]] + ([p[2]] if len(p) > 2 and p[2] else []) for p in c['periods']]
            notes[c['id']] = [c.get('notes', ''), c.get('src', [])[:3]]
        for k, v in d.get('leaders', {}).items():
            leaders[k] = better(leaders[k], v) if k in leaders else v
    big = json.load(open(os.path.join(SRC, 'out_L.json'), encoding='utf-8'))
    leaders.update(big['leaders'])
    nations = sorted({p[1] for ps in dom.values() for p in ps})
    for k in leaders:
        leaders[k] = [[x[0], x[1], x[2]] for x in sorted(leaders[k], key=lambda x: (x[0], x[1]))]
    out = ['/* tools/dominion_build.py가 만든 파일 (조사 자료 tools/dominion/). 손으로 고치지 말고 자료를 고친 뒤 다시 만든다.',
           '   G.DOMINION[도시 번호] = [[해, 나라, 달(없으면 1월)] …] — 1480(또는 세워진 해)부터 1900년까지 그 도시를 다스린 나라',
           '   G.NATION_LEADERS[나라] = [[즉위 해, 물러난 해, 이름(null = 모름)] …] · G.NATION_TITLES[나라] = 칭호 · G.NATION_COLORS[나라] = 깃발 색 */',
           '(function (G) {', "  'use strict';", '  G.DOMINION = {']
    ids = sorted(dom)
    for i, k in enumerate(ids):
        out.append('    %d: %s%s' % (k, json.dumps(dom[k], ensure_ascii=False, separators=(',', ':')), ',' if i < len(ids) - 1 else ''))
    out += ['  };', '  G.NATION_LEADERS = {']
    ks = sorted(leaders)
    for i, k in enumerate(ks):
        out.append('    %s: %s%s' % (json.dumps(k, ensure_ascii=False), json.dumps(leaders[k], ensure_ascii=False, separators=(',', ':')), ',' if i < len(ks) - 1 else ''))
    out += ['  };', '  G.NATION_TITLES = ' + json.dumps(dict({n: t for t, ns in TITLES.items() for n in ns}, **big.get('titles', {})), ensure_ascii=False) + ';',
            '  G.NATION_COLORS = ' + json.dumps({n: color(n) for n in nations}, ensure_ascii=False) + ';',
            '})(window.G = window.G || {});', '']
    open(os.path.join(ROOT, 'js', 'data', 'dominion.js'), 'w', encoding='utf-8', newline='\n').write('\n'.join(out))
    nl = ['/* tools/dominion_build.py가 만든 파일 — 도시마다 지배 국가가 바뀐 까닭 한 줄과 조사 출처 (도감·조사 페이지용) */',
          '(function (G) {', "  'use strict';", '  G.DOMINION_NOTES = {']
    for i, k in enumerate(ids):
        nl.append('    %d: %s%s' % (k, json.dumps(notes[k], ensure_ascii=False, separators=(',', ':')), ',' if i < len(ids) - 1 else ''))
    nl += ['  };', '})(window.G = window.G || {});', '']
    open(os.path.join(ROOT, 'js', 'data', 'dominion_notes.js'), 'w', encoding='utf-8', newline='\n').write('\n'.join(nl))
    missing = [n for n in nations if n not in leaders and n != '원주민']
    print('도시 %d곳 · 나라 %d개 · 지도자 목록 %d개' % (len(dom), len(nations), len(leaders)))
    if missing:
        print('지도자 목록이 없는 나라:', ', '.join(missing))


if __name__ == '__main__':
    main()
